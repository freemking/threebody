/**
 * 记单词管理模块 - Vocabulary
 * 数据只保存到MySQL数据库，不使用localStorage
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
    }

    /**
     * 初始化：从数据库加载数据
     */
    async init() {
        if (this._loading) return;
        this._loading = true;
        try {
            await this._loadFromDatabase();
            await this._loadTodayWords();
            await this._loadStats();
        } finally {
            this._loading = false;
        }
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
        try {
            const result = await this._apiRequest('/today');
            if (result && result.success) {
                this._todayWords = result.data || [];
                this._todayStudied = result.studied || 0;
                this._todayCompleted = result.completed || false;
                console.log(`今日记单词: ${this._todayWords.length} 个`);
                return this._todayWords;
            }
        } catch (error) {
            console.error('加载今日记单词失败:', error);
        }
        return [];
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
    async studyWord(word, correct, responseTime = 0) {
        try {
            const result = await this._apiRequest('/study', 'POST', {
                word,
                correct,
                responseTime
            });

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
            const url = date ? `/daily-record?date=${date}` : '/daily-record';
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
                return result.data;
            }
        } catch (error) {
            console.error('获取历史学习日期失败:', error);
        }
        return [];
    }

    /**
     * 获取指定日期的学习记录
     */
    async getDailyRecord(date) {
        try {
            const result = await this._apiRequest(`/daily-record?date=${date}`);
            if (result && result.success) {
                return result.data;
            }
        } catch (error) {
            console.error('获取每日学习记录失败:', error);
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
     * 更新学习统计（学习单词时调用）
     */
    async updateStudyStats(word, correct, responseTime = 0) {
        try {
            const result = await this._apiRequest('/update-stats', 'POST', {
                word,
                correct,
                responseTime,
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