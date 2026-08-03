/**
 * 记单词管理模块 - Vocabulary
 * 数据只保存到MySQL数据库，不使用localStorage
 *
 * 本文件为核心模块：包含 Vocabulary 数据类、全局实例、工具函数。
 * 背单词 UI 功能按模块拆分到以下文件：
 *  - vocabulary-ui.js             核心导航与列表渲染
 *  - vocabulary-wrongbook.js      错题本（单词库）
 *  - vocabulary-settings.js       系统设置
 *  - vocabulary-learning-data.js  学习数据
 *  - vocabulary-history.js        历史单词 / 成就徽章
 *  - vocabulary-training.js       训练（认读/拼写/听音）
 *  - vocabulary-dictation.js      听写
 *  - vocabulary-weekly-quiz.js    周末测验
 */

class Vocabulary {
    constructor() {
        this.DAILY_TARGET = 5;
        // 自动检测API地址：本地开发用3000端口，生产环境用相对路径
        this.API_BASE = window.location.port === '8080' 
            ? 'http://localhost:3000/api/vocabulary' 
            : '/api/vocabulary';
        this._cache = []; // 内存缓存，从数据库加载
        this._todayWords = []; // 今日记单词列表
        this._stats = null; // 统计信息
        this._loaded = false;
        this._loading = false;
        this._todayLoadError = null; // 今日单词加载错误信息
        this._todayResult = null; // 今日单词完整结果
        this._todayStudied = 0; // 今日已学单词数
        this._todayCompleted = false; // 今日是否完成
    }

    /**
     * 初始化：从数据库加载数据
     * 注意：不再预加载今日单词，由renderVocabularyList按需加载
     */
    async init() {
        if (this._loading) return;
        this._loading = true;
        try {
            await this._loadFromDatabase();
            await this._loadStats();
        } finally {
            this._loading = false;
        }
    }

    /**
     * 获取本地日期字符串（YYYY-MM-DD格式）
     * 使用本地时间而不是UTC时间，与后端保持一致
     */
    _getLocalDateStr(date = new Date()) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * API请求封装
     */
    async _apiRequest(endpoint, method = 'GET', body = null) {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (body) options.body = JSON.stringify(body);
        
        // 添加认证头
        if (typeof auth !== 'undefined' && auth.getToken()) {
            options.headers['Authorization'] = `Bearer ${auth.getToken()}`;
        }
        
        const url = `${this.API_BASE}${endpoint}`;
        console.log(`Vocabulary API请求: ${method} ${url}`);
        
        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`API响应错误: ${response.status} ${response.statusText}`);
        }
        
        const text = await response.text();
        if (!text || text.trim() === '') {
            throw new Error('API响应为空');
        }
        
        return JSON.parse(text);
    }

    /**
     * 从数据库加载数据到内存缓存
     */
    async _loadFromDatabase() {
        // 检查用户是否已登录
        if (typeof auth === 'undefined' || !auth.isLoggedIn()) {
            console.log('用户未登录，跳过从数据库加载记单词');
            this._cache = [];
            this._loaded = true;
            return [];
        }
        
        try {
            const result = await this._apiRequest('/list');
            if (result && result.success && Array.isArray(result.data)) {
                this._cache = result.data;
                this._loaded = true;
                console.log(`从数据库加载了 ${this._cache.length} 个记单词`);
                return this._cache;
            }
        } catch (error) {
            console.error('从数据库加载记单词失败:', error);
        }
        return [];
    }

    /**
     * 加载今日记单词
     */
    async _loadTodayWords() {
        this._todayLoadError = null;
        try {
            const result = await this._apiRequest('/today');
            if (result && result.success) {
                this._todayWords = result.data || [];
                this._todayStudied = result.studied || 0;
                this._todayCompleted = result.completed || false;
                this._todayResult = result; // 保存完整结果，供渲染判断阶段(phase/total等)
                console.log(`今日记单词: ${this._todayWords.length} 个, phase=${result.phase}`);
                return this._todayWords;
            } else {
                // API返回失败，可能是未登录
                this._todayLoadError = result?.message || '数据加载失败';
                this._todayWords = [];
                return [];
            }
        } catch (error) {
            const msg = error.message || String(error);
            console.error('加载今日记单词失败:', msg);
            this._todayLoadError = msg.includes('401') ? 'auth' : (msg.includes('NetworkError') || msg.includes('Failed to fetch') ? 'network' : 'error');
            this._todayWords = [];
            return [];
        }
    }

    /**
     * 获取昨天的单词列表
     * 从历史记录中获取昨天的学习记录，并转换为与今日单词相同的格式
     */
    async _loadYesterdayWords() {
        try {
            // 获取昨天的日期（使用本地时间）
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = this._getLocalDateStr(yesterday);
            
            // 获取昨天的学习记录
            const records = await this.getDailyRecord(yesterdayStr);
            
            if (!records || records.length === 0) {
                console.log('昨天没有学习记录');
                return [];
            }
            
            // 将记录转换为与今日单词相同的格式
            const yesterdayWords = records.map(record => ({
                word: record.word,
                meaning: record.meaning || '',
                phonetic: record.phonetic || '',
                rootAffix: record.rootAffix || '',
                example: record.example || '',
                remembered: record.remembered || 0, // 使用数据库中的remembered字段
                reviewed: record.reviewed || 0, // 使用数据库中的reviewed字段
                isYesterday: true, // 标记为昨天的单词
                yesterdayCorrect: record.correct // 记录昨天的正确状态
            }));
            
            console.log(`昨天单词: ${yesterdayWords.length} 个`);
            return yesterdayWords;
        } catch (error) {
            console.error('加载昨天单词失败:', error);
            return [];
        }
    }

    /**
     * 检查昨天单词的训练情况
     * 返回 true 表示昨天已完成训练，false 表示未完成
     */
    async checkYesterdayTraining() {
        try {
            // 获取昨天的日期（使用本地时间）
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = this._getLocalDateStr(yesterday);
            
            // 获取昨天的学习记录
            const records = await this.getDailyRecord(yesterdayStr);
            
            // 如果昨天没有学习记录，说明是新用户或昨天没有学习，允许训练
            if (!records || records.length === 0) {
                return true;
            }
            
            // 检查是否所有单词都已复习（只检查reviewed字段）
            const allReviewed = records.every(record => {
                // 如果reviewed为1，认为已复习
                return record.reviewed === 1;
            });
            
            // 如果所有单词都已复习，返回true；否则返回false
            return allReviewed;
        } catch (error) {
            console.error('检查昨天训练情况失败:', error);
            // 出错时默认不允许训练，确保用户能完成昨天的单词
            return false;
        }
    }

    /**
     * 检查昨天的单词是否已经全部记住
     * 返回 true 表示昨天的单词已经全部记住，可以显示今天的单词
     * 返回 false 表示昨天的单词还没有全部记住，需要继续显示昨天的单词
     */
    async checkYesterdayWordsRemembered() {
        // 直接调用 checkYesterdayTraining()，保持逻辑一致
        return await this.checkYesterdayTraining();
    }

    /**
     * 加载统计信息
     */
    async _loadStats() {
        try {
            const result = await this._apiRequest('/stats');
            if (result && result.success) {
                this._stats = result.data;
                return this._stats;
            }
        } catch (error) {
            console.error('加载记单词统计失败:', error);
        }
        return null;
    }

    /**
     * 获取所有记单词（同步，从内存缓存）
     */
    getAll() {
        return this._cache;
    }

    /**
     * 获取今日记单词
     */
    getTodayWords() {
        return this._todayWords;
    }

    /**
     * 获取今日单词加载错误信息
     * @returns {string|null} 'auth'=未登录, 'network'=网络错误, 'error'=其他错误, null=正常
     */
    getTodayLoadError() {
        return this._todayLoadError;
    }

    /**
     * 获取统计信息
     */
    getStats() {
        return this._stats;
    }

    /**
     * 添加单词到记单词词库
     */
    async addWord(wordData) {
        if (!wordData || !wordData.word) return;

        try {
            const result = await this._apiRequest('/add', 'POST', {
                word: wordData.word,
                meaning: wordData.meaning || '',
                phonetic: wordData.phonetic || '',
                example: wordData.example || '',
                rootAffix: wordData.rootAffix || '',
                grade: wordData.grade || '',
                source: wordData.source || 'wrongbook'
            });

            if (result.success) {
                console.log(`单词已添加到记单词词库: ${wordData.word}`);
                // 重新加载数据
                await this._loadFromDatabase();
                await this._loadStats();
            }
        } catch (error) {
            console.error('添加单词到词库失败:', error);
        }
    }

    /**
     * 批量添加单词到记单词词库
     */
    async addWordsBatch(words) {
        if (!Array.isArray(words) || words.length === 0) return;

        try {
            const result = await this._apiRequest('/add-batch', 'POST', { words });

            if (result.success) {
                console.log(`批量添加单词: 新增 ${result.added} 个，更新 ${result.updated} 个`);
                // 重新加载数据
                await this._loadFromDatabase();
                await this._loadStats();
            }
        } catch (error) {
            console.error('批量添加单词失败:', error);
        }
    }

    /**
     * 删除单词（从词库中移除）
     */
    async removeWord(word) {
        try {
            await this._apiRequest('/remove', 'POST', { word });
            console.log(`单词已从词库移除: ${word}`);
            // 重新加载数据
            await this._loadFromDatabase();
            await this._loadStats();
        } catch (error) {
            console.error('删除单词失败:', error);
        }
    }

    /**
     * 标记已掌握
     */
    async markMastered(word) {
        try {
            await this._apiRequest('/mastered', 'POST', { word, mastered: true });
            // 重新加载数据
            await this._loadFromDatabase();
            await this._loadStats();
        } catch (error) {
            console.error('标记掌握失败:', error);
        }
    }

    /**
     * 取消掌握标记
     */
    async unmarkMastered(word) {
        try {
            await this._apiRequest('/mastered', 'POST', { word, mastered: false });
            // 重新加载数据
            await this._loadFromDatabase();
            await this._loadStats();
        } catch (error) {
            console.error('取消掌握标记失败:', error);
        }
    }

    /**
     * 清除已掌握的单词
     */
    async clearMastered() {
        try {
            await this._apiRequest('/clear-mastered', 'POST');
            // 重新加载数据
            await this._loadFromDatabase();
            await this._loadStats();
        } catch (error) {
            console.error('清除已掌握单词失败:', error);
        }
    }

    /**
     * 清空词库
     */
    async clearAll() {
        try {
            await this._apiRequest('/clear-all', 'POST');
            // 重新加载数据
            await this._loadFromDatabase();
            await this._loadStats();
        } catch (error) {
            console.error('清空词库失败:', error);
        }
    }

    /**
     * 记录学习单词
     */
    async studyWord(word, correct, wordData = null) {
        try {
            const payload = {
                word,
                correct
            };
            // 传递单词详细信息用于周测验
            if (wordData) {
                payload.meaning = wordData.meaning || '';
                payload.phonetic = wordData.phonetic || '';
                payload.grade = wordData.grade || '';
                payload.unit = wordData.unit || '';
            }
            const result = await this._apiRequest('/study', 'POST', payload);

            if (result.success) {
                console.log(`学习记录已保存: ${word}, 正确: ${correct}`);
                // 重新加载数据
                await this._loadTodayWords();
                await this._loadStats();
                return true;
            }
        } catch (error) {
            console.error('记录学习单词失败:', error);
        }
        return false;
    }

    /**
     * 获取每日学习记录
     */
    async getDailyRecord(date) {
        try {
            // 确保日期格式为YYYY-MM-DD
            let queryDate = date;
            if (date && typeof date === 'string' && date.includes('T')) {
                queryDate = date.split('T')[0];
            }
            const url = queryDate ? `/daily-record?date=${queryDate}` : '/daily-record';
            const result = await this._apiRequest(url);
            if (result && result.success) {
                return result.data;
            }
        } catch (error) {
            console.error('获取每日学习记录失败:', error);
        }
        return [];
    }

    /**
     * 获取总体学习记录
     */
    async getTotalRecord() {
        try {
            const result = await this._apiRequest('/total-record');
            if (result && result.success) {
                return result.data;
            }
        } catch (error) {
            console.error('获取总体学习记录失败:', error);
        }
        return [];
    }

    /**
     * 获取周记录（用于图表）
     */
    async getWeeklyChart() {
        try {
            const result = await this._apiRequest('/weekly-chart');
            if (result && result.success) {
                return result.data;
            }
        } catch (error) {
            console.error('获取周记录失败:', error);
        }
        return [];
    }

    /**
     * 获取未掌握的单词
     */
    getUnmasteredWords() {
        return this._cache.filter(w => !w.mastered);
    }

    /**
     * 获取已掌握的单词
     */
    getMasteredWords() {
        return this._cache.filter(w => w.mastered);
    }

    /**
     * 获取历史学习日期列表
     */
    async getHistoryDates() {
        try {
            const result = await this._apiRequest('/history-dates');
            if (result && result.success) {
                // 过滤掉没有单词记录的日期
                return (result.data || []).filter(d => d.wordCount > 0);
            }
        } catch (error) {
            console.error('获取历史学习日期失败:', error);
        }
        return [];
    }

    /**
     * 刷新缓存（从数据库重新加载）
     */
    async refresh() {
        await this._loadFromDatabase();
        await this._loadTodayWords();
        await this._loadStats();
    }

    /**
     * 获取用户等级和成就信息
     */
    async getUserStats() {
        try {
            const result = await this._apiRequest('/user-stats');
            if (result && result.success) {
                return result.data;
            }
        } catch (error) {
            console.error('获取用户统计信息失败:', error);
        }
        return null;
    }

    /**
     * 获取等级配置信息
     */
    async getLevelConfig() {
        try {
            const result = await this._apiRequest('/level-config');
            if (result && result.success) {
                return result.data;
            }
        } catch (error) {
            console.error('获取等级配置失败:', error);
        }
        return null;
    }

    /**
     * 切换单词记忆状态
     */
    async toggleRemembered(word, remembered) {
        try {
            const result = await this._apiRequest('/remembered', 'POST', {
                word,
                remembered
            });

            if (result.success) {
                console.log(`单词记忆状态已更新: ${word}, 记住: ${remembered}`);
                // 更新本地缓存中的记忆状态
                const todayWord = this._todayWords.find(w => w.word === word);
                if (todayWord) {
                    todayWord.remembered = remembered ? 1 : 0;
                }
                return true;
            }
        } catch (error) {
            console.error('更新记忆状态失败:', error);
        }
        return false;
    }

    /**
     * 标记单词为已复习（仅更新复习状态，不改变记住状态）
     * @param {string} word - 单词
     * @param {string} date - 日期（可选，默认今天）
     * @returns {Promise<boolean>} - 是否成功
     */
    async markAsReviewed(word, date = null) {
        try {
            const result = await this._apiRequest('/reviewed', 'POST', {
                word,
                date
            });

            if (result.success) {
                console.log(`单词已标记为复习: ${word}`);
                return true;
            }
        } catch (error) {
            console.error('标记复习状态失败:', error);
        }
        return false;
    }

    /**
     * 更新学习统计（学习单词时调用）
     */
    async updateStudyStats(word, correct) {
        try {
            const result = await this._apiRequest('/update-stats', 'POST', {
                word,
                correct,
                userId: 'default'
            });
            return result && result.success;
        } catch (error) {
            console.error('更新学习统计失败:', error);
            return false;
        }
    }

    /**
     * 计算等级进度百分比
     */
    calculateLevelProgress(levelInfo) {
        if (!levelInfo || !levelInfo.nextLevelWords) {
            return 100; // 已满级
        }
        
        const currentProgress = levelInfo.currentWords - (levelInfo.level > 1 ? this._getLevelMinWords(levelInfo.level - 1) : 0);
        const levelRange = levelInfo.nextLevelWords - (levelInfo.level > 1 ? this._getLevelMinWords(levelInfo.level - 1) : 0);
        
        return Math.min(Math.round((currentProgress / levelRange) * 100), 100);
    }

    /**
     * 获取指定等级的最小单词数
     */
    _getLevelMinWords(level) {
        const thresholds = [0, 50, 100, 200, 350, 500, 800, 1200, 1800, 2500];
        return thresholds[level - 1] || 0;
    }

    /**
     * 格式化连续学习天数
     */
    formatConsecutiveDays(days) {
        if (days === 0) return '今天开始';
        if (days === 1) return '1天';
        if (days < 7) return `${days}天`;
        if (days < 30) return `${Math.floor(days / 7)}周${days % 7 > 0 ? `${days % 7}天` : ''}`;
        return `${Math.floor(days / 30)}月${days % 30 > 0 ? `${days % 30}天` : ''}`;
    }

    /**
     * 获取成就图标
     */
    getAchievementIcon(achievementId) {
        const icons = {
            'first_word': '⭐',
            'ten_words': '📚',
            'fifty_words': '📖',
            'hundred_words': '🎯',
            'three_days': '📅',
            'seven_days': '🔥',
            'thirty_days': '💪',
            'five_hundred_words': '💎',
            'perfect_day': '✨',
            'thousand_studies': '🎖️'
        };
        return icons[achievementId] || '🏆';
    }
}

// 创建全局实例
const vocabulary = new Vocabulary();

// 页面加载后初始化
window.addEventListener('load', async () => {
    try {
        await vocabulary.init();
        console.log('记单词模块初始化完成');
        // 触发自定义事件，通知app.js记单词模块已加载
        window.dispatchEvent(new CustomEvent('vocabulary-loaded', { detail: vocabulary.getAll() }));
    } catch (error) {
        console.error('记单词模块初始化失败:', error);
    }
});

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Vocabulary, vocabulary };
}

/**
 * 从 wordData (JSON数据) 中查找单词的 explain
 * @param {string} wordName 单词
 * @returns {string} explain 文本，未找到返回空字符串
 */
function getWordExplain(wordName) {
    if (typeof wordData === 'undefined' || !wordData || !wordData.words) return '';
    const lower = wordName.toLowerCase();
    for (const gradeKey in wordData.words) {
        const found = wordData.words[gradeKey].find(w => w.word && w.word.toLowerCase() === lower);
        if (found && found.explain) return found.explain;
    }
    return '';
}

// ==================== 背单词UI模块 ====================
// VocabularyAppMixin 为全局聚合对象，各拆分文件通过 Object.assign 向其追加方法
const VocabularyAppMixin = {};
window.VocabularyAppMixin = VocabularyAppMixin;