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
const VocabularyAppMixin = {
    /**
     * 显示记单词界面
     */
    async showVocabulary() {
        this.hideAllScreens();
        const screen = document.getElementById('vocabulary-screen');
        if (screen) screen.classList.remove('hidden');
        this.currentScreen = 'vocabulary-screen';
        this.currentVocabularyModule = 'memory-training';
        this.trainingMode = null;
        this.dictationMode = false;
        
        await vocabulary.init();
        await wrongBook.init(); // 同时加载错题本数据
        this.renderVocabularyList();
        this.setupVocabularyListeners();
        this.setupVocabularySidebar();
        this.updateVocabularyHeaderStats();
    },

    
    /**
     * 设置侧边栏导航
     */
    setupVocabularySidebar() {
        // 导航项点击事件
        document.querySelectorAll('.nav-item').forEach(item => {
            item.onclick = async (e) => {
                const module = e.currentTarget.dataset.module;
                await this.switchVocabularyModule(module);
            };
        });
        
        // 切换侧边栏按钮
        const toggleBtn = document.getElementById('btn-toggle-sidebar');
        if (toggleBtn) toggleBtn.onclick = () => this.toggleSidebar();
        
        // 设置按钮
        const settingsBtn = document.getElementById('btn-settings');
        if (settingsBtn) settingsBtn.onclick = async () => await this.switchVocabularyModule('settings');
        
        // 训练配置
        this.setupTrainingConfig();
        
        // 听写配置（已整合到记单词中）
        // this.setupDictationConfig();
        
        // 错题本模块监听
        this.setupVocabularyWrongBookListeners();
        
        // 系统设置监听
        this.setupSettingsListeners();
    },

    
    /**
     * 切换模块
     */
    async switchVocabularyModule(moduleName) {
        this.currentVocabularyModule = moduleName;
        
        // 更新导航高亮
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.module === moduleName);
        });
        
        // 更新模块显示
        document.querySelectorAll('.vocabulary-module').forEach(mod => {
            mod.classList.toggle('active', mod.id === `${moduleName}-module`);
        });
        
        // 更新标题
        const titleMap = {
            'memory-training': '记单词',
            'history-words': '历史单词',
            'wrong-book': '单词库',
            'learning-data': '学习数据',
            'achievements': '成就徽章',
            'weekly-quiz': '周末测验',
            'settings': '系统设置'
        };
        const headerTitle = document.getElementById('header-title');
        if (headerTitle) headerTitle.textContent = titleMap[moduleName] || moduleName;
        
        // 根据模块触发对应的渲染
        if (moduleName === 'achievements') {
            this.renderAchievements();
        } else if (moduleName === 'learning-data') {
            this.renderLearningData();
        } else if (moduleName === 'wrong-book') {
            await this.renderVocabularyWrongBook();
        } else if (moduleName === 'history-words') {
            this.renderHistoryWords();
        } else if (moduleName === 'weekly-quiz') {
            this.initWeeklyQuiz();
        }
    },

    
    /**
     * 更新顶部状态栏统计
     */
    async updateVocabularyHeaderStats() {
        const stats = vocabulary.getStats();
        if (!stats) return;
        
        const totalEl = document.getElementById('header-total-words');
        const masteredEl = document.getElementById('header-mastered-words');
        const progressFill = document.getElementById('header-progress-fill');
        const progressText = document.getElementById('header-progress-text');
        const sidebarLevel = document.getElementById('sidebar-user-level');
        
        if (totalEl) totalEl.textContent = stats.totalWords;
        if (masteredEl) masteredEl.textContent = stats.masteredWords;
        
        const todayStudied = stats.todayStudied || 0;
        const progressPercent = Math.min((todayStudied / 5) * 100, 100);
        if (progressFill) progressFill.style.width = `${progressPercent}%`;
        if (progressText) progressText.textContent = `${todayStudied}/5`;
        
        // 更新侧边栏等级
        try {
            const userStats = await vocabulary.getUserStats();
            if (userStats && userStats.levelInfo && sidebarLevel) {
                sidebarLevel.innerHTML = `
                    <span class="level-icon">${userStats.levelInfo.icon}</span>
                    <span class="level-text">Lv.${userStats.levelInfo.level} ${userStats.levelInfo.title}</span>
                `;
            }
        } catch (e) { /* ignore */ }
    },

    
    /**
     * 渲染学习数据图表
     */
    async renderLearningData() {
        try {
            // 获取统计数据
            const stats = vocabulary.getStats();
            const userStats = await vocabulary.getUserStats();
            const weeklyChart = await vocabulary.getWeeklyChart();
            
            // 更新概览卡片
            const studyTimeEl = document.getElementById('data-study-time');
            const wordsLearnedEl = document.getElementById('data-words-learned');
            const accuracyEl = document.getElementById('data-accuracy');
            const streakEl = document.getElementById('data-streak');
            
            if (studyTimeEl) studyTimeEl.textContent = `${stats.todayStudied * 2}分钟`;
            if (wordsLearnedEl) wordsLearnedEl.textContent = stats.totalWords;
            if (accuracyEl) accuracyEl.textContent = `${stats.todayAccuracy}%`;
            if (streakEl) streakEl.textContent = `${userStats?.stats?.consecutiveDays || 0}天`;
            
            // 渲染学习趋势图
            this.renderLearningChart(weeklyChart);
            
            // 渲染高频错题
            this.renderTopErrors();
        } catch (error) {
            console.error('渲染学习数据失败:', error);
        }
    },

    
    /**
     * 渲染学习趋势图
     */
    renderLearningChart(data) {
        const chartArea = document.getElementById('learning-chart');
        if (!chartArea || !data) return;
        
        const maxCount = Math.max(...data.map(d => d.count || 0), 1);
        
        chartArea.innerHTML = `
            <div class="trend-chart">
                <div class="trend-chart-grid">
                    ${[...Array(5)].map((_, i) => `
                        <div class="trend-chart-grid-line" style="bottom:${i * 25}%">
                            <span class="trend-chart-grid-label">${Math.round(maxCount * (i * 0.25))}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="trend-chart-bars">
                    ${data.map((d, i) => {
                        const height = maxCount > 0 ? ((d.count || 0) / maxCount) * 100 : 0;
                        const isMax = (d.count || 0) === maxCount && maxCount > 0;
                        // 优化动画延迟，30天数据使用更小的延迟
                        const delay = i * 0.02;
                        return `
                            <div class="trend-chart-bar-wrapper" style="animation-delay:${delay}s">
                                <div class="trend-chart-bar-value ${isMax ? 'max' : ''}">${d.count || 0}</div>
                                <div class="trend-chart-bar-container">
                                    <div class="trend-chart-bar ${isMax ? 'max' : ''}" style="--target-height:${height}%">
                                        <div class="trend-chart-bar-glow"></div>
                                    </div>
                                </div>
                                <div class="trend-chart-bar-label">${d.date?.slice(5) || ''}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    },

    

    
    /**
     * 渲染高频错题
     */
    renderTopErrors() {
        const listEl = document.getElementById('top-errors-list');
        if (!listEl) return;
        
        const wrongWords = wrongBook.getAll();
        if (!wrongWords || wrongWords.length === 0) {
            listEl.innerHTML = '<div style="color:var(--vb-text-muted)">暂无错题数据</div>';
            return;
        }
        
        // 按错误次数排序，取前10个
        const topErrors = [...wrongWords]
            .sort((a, b) => (b.wrongCount || 1) - (a.wrongCount || 1))
            .slice(0, 10);
        
        listEl.innerHTML = topErrors.map(w => `
            <div class="top-error-item">
                <span class="word">${w.word}</span>
                <span class="count">${w.wrongCount || 1}次</span>
            </div>
        `).join('');
    },

    
    /**
     * 渲染词汇模块内的错题本
     */
    async renderVocabularyWrongBook() {
        const listContainer = document.getElementById('vocabulary-wrongbook-list');
        const statsContainer = document.getElementById('vocabulary-wrongbook-stats');
        if (!listContainer || !statsContainer) return;
        
        // 如果缓存为空，先从数据库加载
        if (wrongBook.getAll().length === 0) {
            await wrongBook.refresh();
        }
        
        const timeFilter = document.getElementById('wrongbook-time-filter');
        const errorFilter = document.getElementById('wrongbook-error-filter');
        const masteryFilter = document.getElementById('wrongbook-mastery-filter');
        
        let words = wrongBook.getAll();
        const stats = wrongBook.getStats();
        const timeVal = timeFilter ? timeFilter.value : 'all';
        const errorVal = errorFilter ? errorFilter.value : 'all';
        const masteryVal = masteryFilter ? masteryFilter.value : 'all';
        
        // 时间筛选
        if (timeVal !== 'all') {
            const now = new Date();
            words = words.filter(w => {
                const t = new Date(w.lastWrongTime || w.firstWrongTime);
                if (timeVal === 'today') return t.toDateString() === now.toDateString();
                if (timeVal === 'week') return (now - t) < 7 * 24 * 60 * 60 * 1000;
                if (timeVal === 'month') return (now - t) < 30 * 24 * 60 * 60 * 1000;
                return true;
            });
        }
        
        // 错因筛选
        if (errorVal !== 'all') {
            words = words.filter(w => w.errorType === errorVal);
        }
        
        // 掌握度筛选
        if (masteryVal === 'mastered') {
            words = words.filter(w => w.mastered);
        } else if (masteryVal === 'high') {
            words = words.filter(w => (w.wrongCount || 1) >= 3);
        } else if (masteryVal === 'review') {
            words = words.filter(w => !w.mastered);
        }
        
        // 计算掌握率
        const masteryRate = stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0;
        
        // 渲染统计卡片
        statsContainer.innerHTML = `
            <div class="wrongbook-stat-card">
                <div class="wrongbook-stat-number">${stats.total}</div>
                <div class="wrongbook-stat-label">总计</div>
                <div class="wrongbook-stat-progress">
                    <div class="wrongbook-progress-bar">
                        <div class="wrongbook-progress-fill" style="width: ${masteryRate}%"></div>
                    </div>
                    <span class="wrongbook-progress-text">${masteryRate}%</span>
                </div>
            </div>
            <div class="wrongbook-stat-card">
                <div class="wrongbook-stat-number">${stats.unmastered}</div>
                <div class="wrongbook-stat-label">未掌握</div>
                <div class="wrongbook-stat-icon">📚</div>
            </div>
            <div class="wrongbook-stat-card">
                <div class="wrongbook-stat-number">${stats.mastered}</div>
                <div class="wrongbook-stat-label">已掌握</div>
                <div class="wrongbook-stat-icon">✅</div>
            </div>
        `;
        
        if (words.length === 0) {
            listContainer.innerHTML = `
                <div class="wrongbook-empty">
                    <div class="wrongbook-empty-icon">📖</div>
                    <div class="wrongbook-empty-text">暂无匹配的错题</div>
                    <div class="wrongbook-empty-hint">去游戏中挑战单词吧！</div>
                </div>`;
            return;
        }
        
        const sourceNames = { 
            monopoly: '单词大富翁', 
            wordmatch: '单词配对', 
            wordblast: '单词填空' 
        };
        
        // 渲染错题卡片
        listContainer.innerHTML = words.map((w, index) => {
            const mc = w.mastered ? ' mastered' : '';
            const mt = w.mastered ? '取消掌握' : '标记掌握';
            const mi = w.mastered ? '✅' : '⬜';
            
            // 音标和朗读按钮
            const phoneticHtml = w.phonetic ? `
                <div class="wrongbook-phonetic">
                    <span>${w.phonetic}</span>
                    <button class="wrongbook-speak-btn" data-word="${w.word}" title="朗读单词">🔊</button>
                </div>` : `
                <div class="wrongbook-phonetic">
                    <button class="wrongbook-speak-btn" data-word="${w.word}" title="朗读单词">🔊</button>
                </div>`;
            
            // 英文释义
            const explain = getWordExplain(w.word);
            const explainHtml = explain ? `
                <div class="wrongbook-explain">${explain}</div>` : '';

            // 词根词缀
            const rootAffixHtml = w.rootAffix ? `
                <div class="wrongbook-rootAffix">
                    <span class="wrongbook-rootAffix-label">词根词缀:</span> 
                    ${w.rootAffix}
                </div>` : '';
            
            // 例句
            const exampleHtml = w.example ? `
                <div class="wrongbook-example">"${w.example}"</div>` : '';
            
            // 错误次数进度条
            const wrongCount = w.wrongCount || 1;
            const maxWrong = 10; // 假设最大错误次数为10
            const wrongPercent = Math.min((wrongCount / maxWrong) * 100, 100);
            
            // 时间格式化
            const lastWrongTime = w.lastWrongTime ? new Date(w.lastWrongTime).toLocaleDateString() : '';
            
            return `
                <div class="wrongbook-item${mc}" data-word="${w.word}" style="animation-delay: ${index * 0.05}s">
                    <div class="wrongbook-item-header">
                        <label class="vocabulary-checkbox">
                            <input type="checkbox" class="wrongbook-checkbox" data-word="${w.word}" data-meaning="${w.meaning}" data-phonetic="${w.phonetic || ''}" data-example="${w.example || ''}" data-root-affix="${w.rootAffix || ''}" data-grade="${w.grade || ''}">
                            <span class="vocabulary-checkbox-mark"></span>
                        </label>
                        <div class="wrongbook-word${w.mastered ? ' mastered-text' : ''}">${w.word}</div>
                        <div class="wrongbook-badges">
                            <span class="wrongbook-badge from-${w.from}">${sourceNames[w.from] || w.from}</span>
                            ${w.mastered ? '<span class="wrongbook-badge mastered-badge">已掌握</span>' : ''}
                        </div>
                    </div>
                    ${phoneticHtml}
                    <div class="wrongbook-meaning">${w.meaning}</div>
                    ${explainHtml}
                    ${rootAffixHtml}
                    ${exampleHtml}
                    <div class="wrongbook-meta">
                        <div class="wrongbook-wrong-info">
                            <span class="wrongbook-count">错误次数: ${wrongCount}</span>
                            <div class="wrongbook-wrong-bar">
                                <div class="wrongbook-wrong-fill" style="width: ${wrongPercent}%"></div>
                            </div>
                        </div>
                        ${lastWrongTime ? `<span class="wrongbook-time">${lastWrongTime}</span>` : ''}
                    </div>
                    <div class="wrongbook-actions-cell">
                        <button class="wrongbook-action-btn-small success" data-word="${w.word}" data-mastered="${w.mastered}">
                            ${mi} ${mt}
                        </button>
                        <button class="wrongbook-action-btn-small danger" data-word="${w.word}">
                            🗑️ 删除
                        </button>
                    </div>
                </div>`;
        }).join('');
    },

    
    /**
     * 设置词汇模块内错题本的事件监听
     */
    setupVocabularyWrongBookListeners() {

        
        // 测验模式切换按钮
        const quizToggleBtn = document.getElementById('btn-quiz-toggle');
        if (quizToggleBtn) {
            quizToggleBtn.onclick = () => {
                this.quizMode = !this.quizMode;
                const container = document.querySelector('.wrongbook-content');
                const btnText = document.getElementById('quiz-btn-text');
                
                if (this.quizMode) {
                    // 开启测验模式
                    container.classList.add('quiz-mode');
                    quizToggleBtn.classList.add('active');
                    btnText.textContent = '结束测验';
                    
                    // 添加测验提示
                    let hint = document.querySelector('.wrongbook-quiz-hint');
                    if (!hint) {
                        hint = document.createElement('div');
                        hint.className = 'wrongbook-quiz-hint';
                        hint.textContent = '📝 测验模式：只显示单词和音标，回忆释义后点击结束测验';
                        const list = document.getElementById('vocabulary-wrongbook-list');
                        if (list) list.parentNode.insertBefore(hint, list);
                    }
                    
                    this.showVocabularyNotification('测验开始！只显示单词和音标', 'info');
                } else {
                    // 关闭测验模式
                    container.classList.remove('quiz-mode');
                    quizToggleBtn.classList.remove('active');
                    btnText.textContent = '开始测验';
                    
                    // 移除测验提示
                    const hint = document.querySelector('.wrongbook-quiz-hint');
                    if (hint) hint.remove();
                    
                    this.showVocabularyNotification('测验结束！所有内容已恢复显示', 'success');
                }
            };
        }
        
        // 开始复习按钮
        const reviewBtn = document.getElementById('btn-start-wrongbook-review');
        if (reviewBtn) {
            reviewBtn.onclick = async () => {
                await this.switchVocabularyModule('memory-training');
                await this.startTraining();
            };
        }
        

        

        

        
        // 列表事件委托
        const listContainer = document.getElementById('vocabulary-wrongbook-list');
        if (listContainer) {
            listContainer.onclick = async (e) => {
                const target = e.target.closest('button');
                if (!target) return;
                
                // 朗读按钮
                if (target.classList.contains('wrongbook-speak-btn')) {
                    e.stopPropagation();
                    const word = target.dataset.word;
                    if (word && typeof audioManager !== 'undefined') {
                        audioManager.speak(word, 'en-US').catch(() => {});
                        // 添加朗读动画
                        target.classList.add('speaking');
                        setTimeout(() => target.classList.remove('speaking'), 1000);
                    }
                    return;
                }
                
                // 掌握/取消掌握按钮
                if (target.classList.contains('wrongbook-action-btn-small') && target.classList.contains('success')) {
                    const word = target.dataset.word;
                    const item = target.closest('.wrongbook-item');
                    
                    if (target.dataset.mastered === 'true') {
                        await wrongBook.unmarkMastered(word);
                        this.showVocabularyNotification(`已取消掌握: ${word}`, 'info');
                    } else {
                        await wrongBook.markMastered(word);
                        // 添加掌握成功动画
                        if (item) {
                            item.classList.add('mastered-success');
                            setTimeout(() => item.classList.remove('mastered-success'), 500);
                        }
                        this.showVocabularyNotification(`已掌握: ${word}`, 'success');
                    }
                    await this.renderVocabularyWrongBook();
                    return;
                }
                
                // 删除按钮
                if (target.classList.contains('wrongbook-action-btn-small') && target.classList.contains('danger')) {
                    const word = target.dataset.word;
                    const item = target.closest('.wrongbook-item');
                    
                    // 添加删除确认动画
                    if (item) {
                        item.classList.add('delete-confirm');
                        setTimeout(async () => {
                            await wrongBook.removeWrongWord(word);
                            await this.renderVocabularyWrongBook();
                            this.showVocabularyNotification(`已删除: ${word}`, 'warning');
                        }, 300);
                    } else {
                        await wrongBook.removeWrongWord(word);
                        await this.renderVocabularyWrongBook();
                    }
                    return;
                }
            };
            
            // 卡片点击展开/收起详情
            listContainer.addEventListener('click', (e) => {
                const item = e.target.closest('.wrongbook-item');
                if (!item || e.target.closest('button')) return;
                
                // 切换卡片展开状态
                item.classList.toggle('expanded');
            });
        }
        
        // 勾选框事件
        this.setupWrongbookCheckboxListeners();
    },

    
    /**
     * 设置错题本勾选框监听器
     */
    setupWrongbookCheckboxListeners() {
        const batchBar = document.getElementById('vocabulary-batch-bar');
        const batchCount = document.getElementById('vocabulary-batch-count');
        const addToVocabBtn = document.getElementById('btn-add-to-vocabulary');
        const clearSelectionBtn = document.getElementById('btn-clear-selection');
        
        // 勾选框变化事件
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('wrongbook-checkbox')) {
                this.updateWrongbookSelection();
            }
        });
        
        // 添加到记单词按钮
        if (addToVocabBtn) {
            addToVocabBtn.onclick = async () => {
                const checkboxes = document.querySelectorAll('.wrongbook-checkbox:checked');
                const words = [];
                
                checkboxes.forEach(cb => {
                    words.push({
                        word: cb.dataset.word,
                        meaning: cb.dataset.meaning,
                        phonetic: cb.dataset.phonetic,
                        example: cb.dataset.example,
                        rootAffix: cb.dataset.rootAffix,
                        grade: cb.dataset.grade,
                        source: 'wrongbook'
                    });
                });
                
                if (words.length === 0) {
                    this.showVocabularyNotification('请先勾选单词', 'warning');
                    return;
                }
                
                // 批量添加到记单词词库
                await vocabulary.addWordsBatch(words);
                
                // 取消所有勾选
                checkboxes.forEach(cb => {
                    cb.checked = false;
                });
                
                // 隐藏批量操作栏
                this.updateWrongbookSelection();
                
                this.showVocabularyNotification(`已添加 ${words.length} 个单词到记单词词库`, 'success');
            };
        }
        
        // 取消选择按钮
        if (clearSelectionBtn) {
            clearSelectionBtn.onclick = () => {
                document.querySelectorAll('.wrongbook-checkbox').forEach(cb => {
                    cb.checked = false;
                });
                this.updateWrongbookSelection();
            };
        }
    },

    
    /**
     * 更新错题本选择状态
     */
    updateWrongbookSelection() {
        const batchBar = document.getElementById('vocabulary-batch-bar');
        const batchCount = document.getElementById('vocabulary-batch-count');
        const checkboxes = document.querySelectorAll('.wrongbook-checkbox:checked');
        
        if (batchBar) {
            batchBar.style.display = checkboxes.length > 0 ? 'flex' : 'none';
        }
        
        if (batchCount) {
            batchCount.textContent = checkboxes.length;
        }
    },

    
    /**
     * 导出错题本为文本
     */
    exportWrongBook() {
        const words = wrongBook.getAll();
        if (!words || words.length === 0) {
            this.showVocabularyNotification('单词库为空，无法导出', 'warning');
            return;
        }
        
        const text = words.map(w => 
            `${w.word}\t${w.meaning || ''}\t${w.phonetic || ''}\t错${w.wrongCount || 1}次`
        ).join('\n');
        
        const header = '单词\t释义\t音标\t错误次数\n';
        const blob = new Blob([header + text], { type: 'text/tab-separated-values;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `单词库_${new Date().toISOString().split('T')[0]}.tsv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showVocabularyNotification('单词库已导出', 'success');
    },

    
    /**
     * 设置系统设置面板的事件监听
     */
    setupSettingsListeners() {
        // 主题切换
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.onclick = (e) => {
                document.querySelectorAll('.theme-option').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                const theme = e.target.dataset.theme;
                this.applyTheme(theme);
                this.showVocabularyNotification(`主题已切换为: ${e.target.textContent}`, 'success');
            };
        });
        
        // 字体大小
        const fontSizeSlider = document.getElementById('font-size-slider');
        const fontSizeValue = document.getElementById('font-size-value');
        if (fontSizeSlider && fontSizeValue) {
            fontSizeSlider.oninput = (e) => {
                const size = e.target.value;
                fontSizeValue.textContent = `${size}px`;
                // 调整词汇模块根元素的字体大小
                const vocabScreen = document.getElementById('vocabulary-screen');
                if (vocabScreen) vocabScreen.style.fontSize = `${size}px`;
            };
        }
        
        // 进度条样式
        const progressStyle = document.getElementById('progress-style');
        if (progressStyle) {
            progressStyle.onchange = (e) => {
                this.showVocabularyNotification(`进度条样式已更新`, 'success');
            };
        }
        
        // 护眼提醒
        const eyeProtection = document.getElementById('eye-protection');
        if (eyeProtection) {
            eyeProtection.onchange = (e) => {
                if (e.target.checked) {
                    this.startEyeProtectionTimer();
                    this.showVocabularyNotification('护眼提醒已开启', 'success');
                } else {
                    this.stopEyeProtectionTimer();
                    this.showVocabularyNotification('护眼提醒已关闭', 'info');
                }
            };
        }
        
        // 每日目标提醒
        const dailyReminder = document.getElementById('daily-reminder');
        if (dailyReminder) {
            dailyReminder.onchange = (e) => {
                this.showVocabularyNotification(
                    e.target.checked ? '每日目标提醒已开启' : '每日目标提醒已关闭',
                    'success'
                );
            };
        }
        
        // 新词比例滑块
        const ratioSlider = document.getElementById('new-word-ratio');
        if (ratioSlider) {
            ratioSlider.oninput = (e) => {
                document.getElementById('new-ratio-value').textContent = e.target.value;
                document.getElementById('review-ratio-value').textContent = 100 - e.target.value;
                this.showVocabularyNotification(`新词比例已设置为${e.target.value}%`, 'success');
            };
        }
        
        // 每天学习单词数量滑块
        const dailyWordCountSlider = document.getElementById('daily-word-count');
        if (dailyWordCountSlider) {
            dailyWordCountSlider.oninput = (e) => {
                document.getElementById('daily-word-count-value').textContent = e.target.value;
                this.showVocabularyNotification(`每天学习单词数量已设置为${e.target.value}个`, 'success');
            };
        }
        
        // 听写高级设置
        document.querySelectorAll('[data-setting="listening-play-count"]').forEach(btn => {
            btn.onclick = (e) => {
                document.querySelectorAll('[data-setting="listening-play-count"]').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.showVocabularyNotification(`播放次数已设置为${e.target.dataset.value}次`, 'success');
            };
        });
    },

    
    /**
     * 应用主题
     */
    applyTheme(theme) {
        const root = document.documentElement;
        if (theme === 'light') {
            root.style.setProperty('--vb-bg-primary', 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 50%, #f5f5f5 100%)');
            root.style.setProperty('--vb-bg-card', 'rgba(0, 0, 0, 0.05)');
            root.style.setProperty('--vb-text-primary', '#1a1a1a');
            root.style.setProperty('--vb-text-secondary', 'rgba(0, 0, 0, 0.85)');
            root.style.setProperty('--vb-text-muted', 'rgba(0, 0, 0, 0.5)');
            root.style.setProperty('--vb-border', 'rgba(0, 0, 0, 0.15)');
        } else if (theme === 'green') {
            root.style.setProperty('--vb-bg-primary', 'linear-gradient(135deg, #0a1a0a 0%, #1a2a1a 50%, #0a1a0a 100%)');
            root.style.setProperty('--vb-primary', '#4ade80');
            root.style.setProperty('--vb-primary-light', 'rgba(74, 222, 128, 0.7)');
            root.style.setProperty('--vb-primary-dark', '#22c55e');
        } else {
            // 恢复默认深色主题
            root.style.removeProperty('--vb-bg-primary');
            root.style.removeProperty('--vb-bg-card');
            root.style.removeProperty('--vb-text-primary');
            root.style.removeProperty('--vb-text-secondary');
            root.style.removeProperty('--vb-text-muted');
            root.style.removeProperty('--vb-border');
            root.style.removeProperty('--vb-primary');
            root.style.removeProperty('--vb-primary-light');
            root.style.removeProperty('--vb-primary-dark');
        }
    },

    
    /**
     * 启动护眼提醒
     */
    startEyeProtectionTimer() {
        this.stopEyeProtectionTimer();
        this._eyeProtectionTimer = setInterval(() => {
            this.showVocabularyNotification('您已学习40分钟，建议休息一下眼睛 👀', 'warning');
        }, 40 * 60 * 1000);
    },

    
    /**
     * 停止护眼提醒
     */
    stopEyeProtectionTimer() {
        if (this._eyeProtectionTimer) {
            clearInterval(this._eyeProtectionTimer);
            this._eyeProtectionTimer = null;
        }
    },

    
    /**
     * 设置训练配置交互
     */
    setupTrainingConfig() {
        // 新词比例滑块
        const ratioSlider = document.getElementById('new-word-ratio');
        if (ratioSlider) {
            ratioSlider.oninput = (e) => {
                document.getElementById('new-ratio-value').textContent = e.target.value;
                document.getElementById('review-ratio-value').textContent = 100 - e.target.value;
            };
        }
        
        // 开始训练按钮（配置区内）
        const startBtn = document.getElementById('btn-start-training');
        if (startBtn) {
            startBtn.onclick = async () => await this.startTraining();
        }

        
        // 检查昨天训练情况并更新按钮状态
        this.updateTrainingButtons();
    },

    
    /**
     * 更新训练按钮状态
     */
    async updateTrainingButtons() {
        // 检查昨天的单词是否已经全部记住
        const yesterdayWordsRemembered = await vocabulary.checkYesterdayWordsRemembered();
        
        const startBtn = document.getElementById('btn-start-training');
        const lock = document.getElementById('training-lock');
        const titleElement = document.getElementById('vocabulary-today-title');
        
        // 获取今日单词，检查是否有复习单词
        const todayWords = vocabulary.getTodayWords();
        const hasReviewWords = todayWords.some(w => w.isReview);
        
        // 根据条件设置标题
        let title = '📖 今日记单词';
        if (!yesterdayWordsRemembered) {
            // 昨天没有全部记住，显示复习标题
            title = '📖 请先完成昨天的单词';
        } else if (hasReviewWords) {
            // 昨天全部记住了，但显示的是复习单词，也显示复习标题
            title = '📖 复习昨天的单词';
        }
        
        if (!yesterdayWordsRemembered) {
            // 显示锁定状态，但按钮仍可点击（点击后会加载昨天的单词进行训练）
            if (startBtn) {
                startBtn.disabled = false;
                startBtn.classList.remove('disabled');
            }
            if (lock) lock.classList.remove('hidden');
        } else {
            // 隐藏锁定状态
            if (startBtn) {
                startBtn.disabled = false;
                startBtn.classList.remove('disabled');
            }
            if (lock) lock.classList.add('hidden');
        }
        
        if (titleElement) {
            titleElement.textContent = title;
        }
    },

    
    /**
     * 设置听写配置
     */
    setupDictationConfig() {
        // 听写范围
        document.querySelectorAll('#dictation-training-module .config-option[data-range]').forEach(btn => {
            btn.onclick = (e) => {
                document.querySelectorAll('#dictation-training-module .config-option[data-range]').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            };
        });
        
        // 间隔选项
        document.querySelectorAll('.interval-option').forEach(btn => {
            btn.onclick = (e) => {
                document.querySelectorAll('.interval-option').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            };
        });
        
        // 播放次数
        document.querySelectorAll('.play-count-option').forEach(btn => {
            btn.onclick = (e) => {
                document.querySelectorAll('.play-count-option').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            };
        });
        
        // 开始听写按钮（配置区内）
        const startBtn = document.getElementById('btn-start-dictation');
        if (startBtn) {
            startBtn.onclick = () => this.startDictation();
        }

        // 快速开始按钮（Hero区）
        const quickStartBtn = document.getElementById('btn-quick-start-dictation');
        if (quickStartBtn) {
            quickStartBtn.onclick = () => this.startDictation();
        }
    },

    

    

    

    

    
    /**
     * 渲染记单词列表
     * 逻辑：先显示昨天的单词列表，等昨天的单词训练通过后，再显示今天的单词列表
     * 使用reviewed字段判断是否已复习
     */
    async renderVocabularyList() {
        const todayWordsContainer = document.getElementById('vocabulary-today-words');
        const progressText = document.getElementById('today-progress-text');
        const progressFill = document.getElementById('today-progress-fill');
        const titleElement = document.getElementById('vocabulary-today-title');
        
        // 检查昨天训练状态
        const yesterdayPassed = await vocabulary.checkYesterdayTraining();
        
        let wordsToShow = [];
        let title = '';
        let isYesterdayWords = false;
        let allYesterdayWords = []; // 保存完整的昨天单词列表用于进度计算
        
        if (!yesterdayPassed) {
            // 昨天没有完成训练，显示昨天的单词
            allYesterdayWords = await vocabulary._loadYesterdayWords();
            
            // 过滤出没有复习的单词（reviewed=0的都算未完成）
            const unreviewedWords = allYesterdayWords.filter(w => {
                // 只检查reviewed字段
                return w.reviewed !== 1;
            });
            
            if (unreviewedWords.length > 0) {
                // 还有没复习的单词，显示这些单词
                wordsToShow = unreviewedWords;
                title = '📖 请先复习昨天的单词';
                isYesterdayWords = true;
            } else {
                // 所有昨天单词都已复习，加载并显示今天的单词
                await vocabulary._loadTodayWords();
                wordsToShow = vocabulary.getTodayWords();
                title = '📖 今日记单词';
                isYesterdayWords = false;
            }
        } else {
            // 昨天已经完成训练，加载并显示今天的单词
            await vocabulary._loadTodayWords();
            wordsToShow = vocabulary.getTodayWords();
            
            // 检查是否有复习单词
            const hasReviewWords = wordsToShow.some(w => w.isReview);
            title = hasReviewWords ? '📖 复习昨天的单词' : '📖 今日记单词';
        }
        
        // 更新标题
        if (titleElement) {
            titleElement.textContent = title;
        }
        
        // 更新进度
        if (progressText && progressFill) {
            if (isYesterdayWords) {
                // 昨天单词的进度：显示已复习/总数
                const totalYesterday = allYesterdayWords.length;
                const reviewedCount = allYesterdayWords.filter(w => {
                    // 只检查reviewed字段
                    return w.reviewed === 1;
                }).length;
                const progressPercent = totalYesterday > 0 ? Math.min((reviewedCount / totalYesterday) * 100, 100) : 0;
                progressText.textContent = `${reviewedCount}/${totalYesterday}`;
                progressFill.style.width = `${progressPercent}%`;
            } else {
                // 今天的单词进度
                const stats = vocabulary.getStats();
                const todayStudied = stats ? stats.todayStudied : 0;
                const progressPercent = Math.min((todayStudied / 5) * 100, 100);
                progressText.textContent = `${todayStudied}/5`;
                progressFill.style.width = `${progressPercent}%`;
            }
        }
        
        // 更新单词列表
        if (todayWordsContainer) {
            if (wordsToShow.length === 0) {
                todayWordsContainer.innerHTML = `
                    <div class="vocabulary-empty">
                        <span class="vocabulary-empty-icon">📖</span>
                        <div class="vocabulary-empty-text">${isYesterdayWords ? '昨天没有学习记录' : '今日暂无记单词'}</div>
                    </div>`;
            } else {
                todayWordsContainer.innerHTML = wordsToShow.map(word => `
                    <div class="vocabulary-word-card ${word.reviewed ? 'remembered' : ''}" data-word="${word.word}">
                        <div class="vocabulary-word-header">
                            <div>
                                <div class="vocabulary-word-text">${word.word}</div>
                                <div class="vocabulary-word-phonetic">
                                    <span>${word.phonetic || ''}</span>
                                    <button class="btn-pronunciation" data-word="${word.word}" title="朗读单词">🔊</button>
                                </div>
                            </div>
                        </div>
                        <div class="vocabulary-word-meaning">${word.meaning}</div>
                        ${(() => { const exp = getWordExplain(word.word); return exp ? `<div class="vocabulary-word-explain">${exp}</div>` : ''; })()}
                        ${word.rootAffix ? `<div class="vocabulary-word-rootAffix"><span class="root-affix-label">词根词缀:</span> ${word.rootAffix}</div>` : ''}
                        ${word.example ? `<div class="vocabulary-word-example">"${word.example}"</div>` : ''}
                    </div>
                `).join('');
                

                
                // 添加发音按钮事件监听
                todayWordsContainer.querySelectorAll('.btn-pronunciation').forEach(btn => {
                    btn.onclick = async (e) => {
                        e.stopPropagation();
                        const word = btn.dataset.word;
                        if (word && typeof audioManager !== 'undefined') {
                            btn.classList.add('playing');
                            try {
                                await audioManager.speak(word, 'en-US');
                            } catch (err) {
                                console.error('发音失败:', err);
                            }
                            btn.classList.remove('playing');
                        }
                    };
                });
            }
        }
    },

    
    /**
     * 设置记单词事件监听器
     */
    setupVocabularyListeners() {
        const backBtn = document.getElementById('btn-back-vocabulary');
        if (backBtn) backBtn.onclick = () => this.showMainMenu();
        

        
        // 设置面板标签切换
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.onclick = (e) => {
                const tabName = e.currentTarget.dataset.tab;
                document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
                e.currentTarget.classList.add('active');
                document.querySelectorAll('.settings-panel').forEach(p => p.classList.add('hidden'));
                const panel = document.getElementById(`${tabName}-settings`);
                if (panel) panel.classList.remove('hidden');
            };
        });
        
        // 设置面板：历史记录和成就面板保留
        const historyBtn = document.getElementById('btn-history');
        if (historyBtn) historyBtn.onclick = () => this.toggleHistoryPanel();
        
        const closeHistoryBtn = document.getElementById('btn-close-history');
        if (closeHistoryBtn) closeHistoryBtn.onclick = () => this.toggleHistoryPanel(false);
        
        const loadHistoryBtn = document.getElementById('btn-load-history');
        if (loadHistoryBtn) loadHistoryBtn.onclick = () => this.loadHistory();
    },

    
    /**
     * 开始训练（根据配置选择模式）
     */
    async startTraining() {
        // 检查昨天单词的训练情况
        const yesterdayPassed = await vocabulary.checkYesterdayTraining();
        
        // 获取听写高级设置（从系统设置中读取）
        const listeningInterval = 5000; // 固定5秒间隔
        let listeningPlayCount = 2; // 默认2次
        let listeningShowChinese = true; // 默认显示中文释义
        let listeningShowFirstLetter = false; // 默认不显示首字母
        
        const playCountBtn = document.querySelector('[data-setting="listening-play-count"].active');
        listeningPlayCount = playCountBtn ? parseInt(playCountBtn.dataset.value) : 2;
        
        listeningShowChinese = document.getElementById('listening-show-chinese-hint')?.checked || false;
        listeningShowFirstLetter = document.getElementById('listening-show-first-letter')?.checked || false;
        
        // 读取每天学习单词数量设置
        const totalWords = parseInt(document.getElementById('daily-word-count')?.value || 5);
        
        // 如果昨天没有完成训练，使用昨天的单词
        let words = [];
        if (!yesterdayPassed) {
            console.log('昨天的训练未完成，使用昨天的单词进行训练');
            const yesterdayWords = await vocabulary._loadYesterdayWords();
            
            // 过滤出未复习的单词（reviewed=0，不管remembered状态）
            words = yesterdayWords.filter(w => {
                return w.reviewed !== 1;
            });
            
            if (words.length > 0) {
                this.showVocabularyNotification('请先完成昨天的单词训练', 'info');
            }
        }
        
        // 如果昨天已完成或没有昨天的单词，使用今日单词
        if (words.length === 0) {
            // 优先使用今日单词（从API获取的今日要记的单词）
            words = vocabulary.getTodayWords();
            
            // 如果今日单词为空，则使用配置生成单词列表
            if (!words || words.length === 0) {
                console.log('今日单词为空，使用配置生成单词列表');
                
                // 获取复习词（来自错题本中未掌握的单词）
                const unmasteredWords = wrongBook.getUnmasteredWords();
                const reviewWords = unmasteredWords
                    .sort(() => Math.random() - 0.5)
                    .slice(0, totalWords)
                    .map(w => ({
                        word: w.word,
                        meaning: w.meaning,
                        phonetic: w.phonetic || ''
                    }));
                
                words = reviewWords;
            } else {
                console.log(`使用今日单词进行训练: ${words.length} 个单词`);
            }
        }
        
        // 检查是否有复习单词
        const reviewWords = words.filter(w => w.isReview);
        const newWords = words.filter(w => !w.isReview);
        
        // 如果有复习单词，显示提示
        if (reviewWords.length > 0) {
            this.showVocabularyNotification(`先复习 ${reviewWords.length} 个历史单词，再学习新词`, 'info');
        }
        
        if (words.length === 0) {
            this.showVocabularyNotification('没有可学习的单词', 'warning');
            return;
        }
        
        // 启动多模式训练
        this.trainingModes = ['recognition', 'spelling', 'listening']; // 三种模式依次进行
        this.trainingModeIndex = 0; // 当前模式索引
        this.trainingMode = this.trainingModes[0]; // 当前模式
        this.trainingWords = words;
        this.trainingIndex = 0;
        this.trainingCorrect = 0;
        this.trainingStartTime = Date.now();
        this.trainingAnswered = false;
        this.trainingErrors = [];
        
        // 多模式训练结果跟踪
        this.trainingMultiModeResults = {
            recognition: { correct: 0, errors: [] },
            spelling: { correct: 0, errors: [] },
            listening: { correct: 0, errors: [] }
        };
        this.trainingWordResults = {}; // 跟踪每个单词在每种模式下的结果
        
        // 听写模式设置
        this.listeningInterval = listeningInterval;
        this.listeningPlayCount = listeningPlayCount;
        this.listeningShowChinese = listeningShowChinese;
        this.listeningShowFirstLetter = listeningShowFirstLetter;
        
        // 隐藏今日记单词列表
        const todaySection = document.querySelector('.vocabulary-today');
        if (todaySection) {
            todaySection.style.display = 'none';
        }

        // 显示训练界面
        const trainingInterface = document.getElementById('training-interface');
        if (trainingInterface) {
            trainingInterface.classList.remove('hidden');
            trainingInterface.classList.add('active');
        }
        
        // 设置退出按钮
        const exitBtn = document.getElementById('btn-exit-training');
        if (exitBtn) exitBtn.onclick = () => this.exitTraining();
        
        // 设置发音按钮
        const speakBtn = document.getElementById('btn-training-speak');
        if (speakBtn) speakBtn.onclick = () => this.playCurrentTrainingWord();
        
        // 设置导航按钮
        const prevBtn = document.getElementById('btn-training-prev');
        const nextBtn = document.getElementById('btn-training-next');
        if (prevBtn) prevBtn.onclick = () => this.prevTrainingWord();
        if (nextBtn) nextBtn.onclick = () => this.nextTrainingWord();
        
        // 更新模式指示器
        this.updateTrainingModeIndicator();
        
        // 显示第一个单词
        this.showTrainingWord();
    },

    
    /**
     * 更新训练模式指示器
     */
    updateTrainingModeIndicator() {
        const indicator = document.getElementById('training-mode-indicator');
        if (!indicator) return;
        
        const modeInfo = {
            recognition: { icon: '👁️', name: '认读模式' },
            spelling: { icon: '✍️', name: '拼写模式' },
            listening: { icon: '🎧', name: '听音模式' }
        };
        
        const currentMode = this.trainingModes[this.trainingModeIndex];
        const info = modeInfo[currentMode];
        if (info) {
            indicator.querySelector('.mode-icon').textContent = info.icon;
            indicator.querySelector('.mode-name').textContent = info.name;
        }
    },

    
    /**
     * 记录单词在特定模式下的结果
     */
    recordWordResult(word, mode, isCorrect) {
        if (!this.trainingWordResults[word]) {
            this.trainingWordResults[word] = {};
        }
        this.trainingWordResults[word][mode] = isCorrect;
        
        // 更新模式结果统计
        if (this.trainingMultiModeResults[mode]) {
            if (isCorrect) {
                this.trainingMultiModeResults[mode].correct++;
            } else {
                this.trainingMultiModeResults[mode].errors.push(word);
            }
        }
    },

    
    /**
     * 显示训练单词
     */
    showTrainingWord() {
        const word = this.trainingWords[this.trainingIndex];
        if (!word) return;
        
        this.trainingAnswered = false;
        
        // 更新进度
        const progressFill = document.getElementById('training-progress-fill');
        const progressText = document.getElementById('training-progress-text');
        const progress = ((this.trainingIndex + 1) / this.trainingWords.length) * 100;
        if (progressFill) progressFill.style.width = `${progress}%`;
        if (progressText) progressText.textContent = `${this.trainingIndex + 1}/${this.trainingWords.length}`;
        
        // 更新导航按钮
        const prevBtn = document.getElementById('btn-training-prev');
        const nextBtn = document.getElementById('btn-training-next');
        if (prevBtn) prevBtn.disabled = this.trainingIndex === 0;
        if (nextBtn) {
            nextBtn.disabled = true;
        }
        
        // 渲染内容
        const content = document.getElementById('training-content');
        if (!content) return;
        
        // 添加复习标识
        const reviewBadge = word.isReview ? '<div class="review-badge">复习</div>' : '';
        
        if (this.trainingMode === 'recognition') {
            this.renderRecognitionMode(word, content, reviewBadge);
        } else if (this.trainingMode === 'spelling') {
            this.renderSpellingMode(word, content, reviewBadge);
        } else if (this.trainingMode === 'listening') {
            this.renderListeningMode(word, content, reviewBadge);
        }
        
        // 自动播放发音
        setTimeout(() => this.playCurrentTrainingWord(), 300);
    },

    
    /**
     * 认读模式渲染
     */
    renderRecognitionMode(word, container, reviewBadge = '') {
        const allWords = vocabulary.getAll();
        const options = [word.meaning];
        const otherWords = allWords.filter(w => w.word !== word.word)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);
        otherWords.forEach(w => options.push(w.meaning));
        options.sort(() => Math.random() - 0.5);
        
        container.innerHTML = `
            <div class="recognition-card">
                ${reviewBadge}
                <div class="recognition-word" id="training-word">${word.word}</div>
                <div class="recognition-phonetic">${word.phonetic || ''}</div>
                <div class="recognition-options" id="training-options">
                    ${options.map((opt, i) => `
                        <button class="recognition-option" data-meaning="${opt}" data-index="${i}">
                            <span class="option-key">${i + 1}</span>
                            ${opt}
                        </button>
                    `).join('')}
                </div>
                <div class="recognition-detail" id="recognition-detail" style="display:none"></div>
            </div>
        `;
        
        // 选项点击事件
        container.querySelectorAll('.recognition-option').forEach(btn => {
            btn.onclick = () => this.handleRecognitionAnswer(btn, word);
        });
    },

    
    /**
     * 处理认读模式答案
     */
    async handleRecognitionAnswer(btn, word) {
        if (this.trainingAnswered) return;
        this.trainingAnswered = true;
        
        const selectedMeaning = btn.dataset.meaning;
        const isCorrect = selectedMeaning === word.meaning;
        
        // 先记录多模式训练结果（同步操作，确保结果立即记录）
        this.recordWordResult(word.word, 'recognition', isCorrect);
        
        // 记录学习结果（异步操作，不影响训练结果记录）
        vocabulary.studyWord(word.word, isCorrect, { meaning: word.meaning, phonetic: word.phonetic, grade: word.grade, unit: word.unit }).catch(err => console.error('记录学习失败:', err));
        vocabulary.updateStudyStats(word.word, isCorrect).catch(err => console.error('更新学习统计失败:', err));
        // 注意：reviewed标记已移至showTrainingResult中，等3种模式全部完成后才统一标记
        
        if (isCorrect) {
            this.trainingCorrect++;
            btn.classList.add('correct');
            this.showVocabularyNotification('正确！', 'success');
        } else {
            btn.classList.add('wrong');
            // 高亮正确选项
            document.querySelectorAll('.recognition-option').forEach(b => {
                if (b.dataset.meaning === word.meaning) b.classList.add('correct');
            });
            this.showVocabularyNotification('错误！', 'error');
            this.trainingErrors.push(word);
            
            // 自动添加到错题本
            wrongBook.addWrongWord({
                word: word.word,
                meaning: word.meaning,
                phonetic: word.phonetic || '',
                fromList: 'vocabulary-recognition'
            });
        }
        
        // 显示单词详情
        const detail = document.getElementById('recognition-detail');
        if (detail) {
            detail.style.display = 'block';
            detail.innerHTML = `
                <div class="detail-meaning">${word.meaning}</div>
                <div class="detail-phonetic">${word.phonetic || ''}</div>
                ${word.example ? `<div class="detail-example">"${word.example}"</div>` : ''}
            `;
        }
        
        // 禁用所有选项
        document.querySelectorAll('.recognition-option').forEach(b => b.classList.add('disabled'));
        
        // 启用下一个按钮
        const nextBtn = document.getElementById('btn-training-next');
        if (nextBtn) nextBtn.disabled = false;
    },

    
    /**
     * 拼写模式渲染
     */
    renderSpellingMode(word, container, reviewBadge = '') {
        container.innerHTML = `
            <div class="spelling-card">
                ${reviewBadge}
                <div class="spelling-prompt">${word.meaning}</div>
                <div class="spelling-phonetic">${word.phonetic || ''}</div>
                <div class="spelling-input-area">
                    <input type="text" class="spelling-input" id="spelling-input" 
                           placeholder="请输入单词" autocomplete="off" autofocus>
                </div>
                <button class="spelling-hint-btn" id="btn-spelling-hint">显示提示</button>
                <div class="spelling-feedback" id="spelling-feedback"></div>
            </div>
        `;
        
        const input = document.getElementById('spelling-input');
        if (input) {
            input.focus();
            input.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    this.checkSpellingAnswer(word);
                }
            };
        }
        
        const hintBtn = document.getElementById('btn-spelling-hint');
        if (hintBtn) {
            hintBtn.onclick = () => {
                const firstLetter = word.word[0];
                const hint = firstLetter + '_ '.repeat(word.word.length - 1);
                hintBtn.textContent = `提示: ${hint}`;
                hintBtn.disabled = true;
            };
        }
    },

    
    /**
     * 检查拼写答案
     */
    async checkSpellingAnswer(word) {
        if (this.trainingAnswered) return;
        
        const input = document.getElementById('spelling-input');
        if (!input) return;
        
        const userAnswer = input.value.trim().toLowerCase();
        if (!userAnswer) {
            input.classList.add('input-shake');
            setTimeout(() => input.classList.remove('input-shake'), 300);
            return;
        }
        
        this.trainingAnswered = true;
        // 标准化空格：将多个空格合并为一个，然后比较
        const normalizedUserAnswer = userAnswer.replace(/\s+/g, ' ');
        const normalizedCorrectAnswer = word.word.toLowerCase().replace(/\s+/g, ' ');
        const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
        
        // 先记录多模式训练结果（同步操作，确保结果立即记录）
        this.recordWordResult(word.word, 'spelling', isCorrect);
        
        // 记录学习结果（异步操作，不影响训练结果记录）
        vocabulary.studyWord(word.word, isCorrect, { meaning: word.meaning, phonetic: word.phonetic, grade: word.grade, unit: word.unit }).catch(err => console.error('记录学习失败:', err));
        vocabulary.updateStudyStats(word.word, isCorrect).catch(err => console.error('更新学习统计失败:', err));
        // 注意：reviewed标记已移至showTrainingResult中，等3种模式全部完成后才统一标记
        
        const feedback = document.getElementById('spelling-feedback');
        
        if (isCorrect) {
            this.trainingCorrect++;
            input.classList.add('correct');
            this.showVocabularyNotification('正确！', 'success');
            if (feedback) feedback.innerHTML = `<div class="correct-word">✓ ${word.word}</div>`;
        } else {
            input.classList.add('wrong');
            input.classList.add('input-shake');
            this.showVocabularyNotification('错误！', 'error');
            this.trainingErrors.push(word);
            
            // 自动添加到错题本
            wrongBook.addWrongWord({
                word: word.word,
                meaning: word.meaning,
                phonetic: word.phonetic || '',
                fromList: 'vocabulary-spelling'
            });
            
            // 显示正确拼写，错误字母标红
            if (feedback) {
                let diffHtml = '';
                for (let i = 0; i < word.word.length; i++) {
                    const correctChar = word.word[i];
                    const userChar = userAnswer[i] || '';
                    if (correctChar.toLowerCase() === userChar.toLowerCase()) {
                        diffHtml += `<span class="correct-letter">${correctChar}</span>`;
                    } else {
                        diffHtml += `<span class="wrong-letter">${correctChar}</span>`;
                    }
                }
                feedback.innerHTML = `
                    <div class="wrong-word">你的答案: ${userAnswer}</div>
                    <div class="correct-word">正确拼写: ${diffHtml}</div>
                `;
            }
        }
        
        input.disabled = true;
        
        // 启用下一个按钮
        const nextBtn = document.getElementById('btn-training-next');
        if (nextBtn) nextBtn.disabled = false;
    },

    
    /**
     * 听音模式渲染
     */
    renderListeningMode(word, container, reviewBadge = '') {
        container.innerHTML = `
            <div class="spelling-card">
                ${reviewBadge}
                <div class="spelling-prompt">听发音，写单词</div>
                <div class="spelling-phonetic" id="listening-hint"></div>
                <button class="training-speak-btn" id="btn-listening-play" style="margin-bottom:var(--vb-space-xl)">
                    <span>🔊</span>
                    <span>点击播放发音</span>
                </button>
                <div class="spelling-input-area">
                    <input type="text" class="spelling-input" id="listening-input" 
                           placeholder="请输入单词" autocomplete="off">
                </div>
                <button class="spelling-hint-btn" id="btn-listening-hint">显示提示</button>
                <div class="spelling-feedback" id="listening-feedback"></div>
            </div>
        `;
        
        const playBtn = document.getElementById('btn-listening-play');
        if (playBtn) playBtn.onclick = () => this.playCurrentTrainingWord();
        
        const input = document.getElementById('listening-input');
        if (input) {
            input.focus();
            input.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    this.checkListeningAnswer(word);
                }
            };
        }
        
        const hintBtn = document.getElementById('btn-listening-hint');
        if (hintBtn) {
            hintBtn.onclick = () => {
                const hintEl = document.getElementById('listening-hint');
                if (hintEl) hintEl.textContent = word.meaning;
                hintBtn.textContent = `首字母: ${word.word[0]}`;
                hintBtn.disabled = true;
            };
        }
    },

    
    /**
     * 检查听音答案
     */
    async checkListeningAnswer(word) {
        if (this.trainingAnswered) return;
        
        const input = document.getElementById('listening-input');
        if (!input) return;
        
        const userAnswer = input.value.trim().toLowerCase();
        if (!userAnswer) {
            input.classList.add('input-shake');
            setTimeout(() => input.classList.remove('input-shake'), 300);
            return;
        }
        
        this.trainingAnswered = true;
        // 标准化空格：将多个空格合并为一个，然后比较
        const normalizedUserAnswer = userAnswer.replace(/\s+/g, ' ');
        const normalizedCorrectAnswer = word.word.toLowerCase().replace(/\s+/g, ' ');
        const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
        
        // 先记录多模式训练结果（同步操作，确保结果立即记录）
        this.recordWordResult(word.word, 'listening', isCorrect);
        
        // 记录学习结果（异步操作，不影响训练结果记录）
        vocabulary.studyWord(word.word, isCorrect, { meaning: word.meaning, phonetic: word.phonetic, grade: word.grade, unit: word.unit }).catch(err => console.error('记录学习失败:', err));
        vocabulary.updateStudyStats(word.word, isCorrect).catch(err => console.error('更新学习统计失败:', err));
        
        // 注意：reviewed标记已移至showTrainingResult中，等3种模式全部完成后才统一标记
        
        const feedback = document.getElementById('listening-feedback');
        
        if (isCorrect) {
            this.trainingCorrect++;
            input.classList.add('correct');
            this.showVocabularyNotification('正确！', 'success');
            if (feedback) feedback.innerHTML = `<div class="correct-word">✓ ${word.word}</div>`;
        } else {
            input.classList.add('wrong');
            input.classList.add('input-shake');
            this.showVocabularyNotification('错误！', 'error');
            this.trainingErrors.push(word);
            
            // 自动添加到错题本
            wrongBook.addWrongWord({
                word: word.word,
                meaning: word.meaning,
                phonetic: word.phonetic || '',
                fromList: 'vocabulary-listening'
            });
            
            if (feedback) {
                let diffHtml = '';
                for (let i = 0; i < word.word.length; i++) {
                    const correctChar = word.word[i];
                    const userChar = userAnswer[i] || '';
                    if (correctChar.toLowerCase() === userChar.toLowerCase()) {
                        diffHtml += `<span class="correct-letter">${correctChar}</span>`;
                    } else {
                        diffHtml += `<span class="wrong-letter">${correctChar}</span>`;
                    }
                }
                feedback.innerHTML = `
                    <div class="wrong-word">你的答案: ${userAnswer}</div>
                    <div class="correct-word">正确拼写: ${diffHtml}</div>
                `;
            }
        }
        
        input.disabled = true;
        
        const nextBtn = document.getElementById('btn-training-next');
        if (nextBtn) nextBtn.disabled = false;
    },

    
    /**
     * 播放当前训练单词发音
     */
    playCurrentTrainingWord() {
        const word = this.trainingWords[this.trainingIndex];
        if (!word) return;
        
        if (typeof audioManager !== 'undefined' && audioManager.speak) {
            audioManager.speak(word.word, 'en-US').catch(() => {});
        }
    },

    
    /**
     * 下一个训练单词
     */
    async nextTrainingWord() {
        this.trainingIndex++;
        if (this.trainingIndex >= this.trainingWords.length) {
            // 当前模式完成，检查是否还有下一个模式
            this.trainingModeIndex++;
            if (this.trainingModeIndex < this.trainingModes.length) {
                // 切换到下一个模式
                this.trainingMode = this.trainingModes[this.trainingModeIndex];
                this.trainingIndex = 0;
                this.trainingCorrect = 0;
                this.trainingErrors = [];
                this.trainingAnswered = false;
                
                // 更新模式指示器
                this.updateTrainingModeIndicator();
                
                // 显示模式切换提示
                const modeNames = { recognition: '认读', spelling: '拼写', listening: '听音' };
                this.showVocabularyNotification(`${modeNames[this.trainingMode]}模式开始`, 'info');
                
                // 显示第一个单词
                setTimeout(() => this.showTrainingWord(), 500);
            } else {
                // 所有模式完成，显示结果
                await this.showTrainingResult();
            }
        } else {
            this.showTrainingWord();
        }
    },

    
    /**
     * 上一个训练单词
     */
    prevTrainingWord() {
        if (this.trainingIndex > 0) {
            this.trainingIndex--;
            this.showTrainingWord();
        }
    },

    
    /**
     * 退出训练
     */
    exitTraining() {
        this.trainingMode = null;
        this.trainingModes = null;
        this.trainingModeIndex = 0;
        this.trainingMultiModeResults = null;
        this.trainingWordResults = null;
        
        const trainingInterface = document.getElementById('training-interface');
        if (trainingInterface) {
            trainingInterface.classList.remove('active');
            trainingInterface.classList.add('hidden');
        }
        
        // 恢复显示今日记单词列表
        const todaySection = document.querySelector('.vocabulary-today');
        if (todaySection) {
            todaySection.style.display = '';
        }
        
        this.renderVocabularyList();
        this.updateVocabularyHeaderStats();
    },

    
    /**
     * 显示训练结果
     */
    async showTrainingResult() {
        this.trainingMode = null;
        
        // 隐藏训练界面
        const trainingInterface = document.getElementById('training-interface');
        if (trainingInterface) {
            trainingInterface.classList.remove('active');
            trainingInterface.classList.add('hidden');
        }
        
        // 显示结果界面
        const resultInterface = document.getElementById('training-result');
        if (resultInterface) {
            resultInterface.classList.remove('hidden');
            resultInterface.classList.add('active');
        }
        
        // 计算多模式统计数据
        const duration = Math.round((Date.now() - this.trainingStartTime) / 60000);
        const totalWords = this.trainingWords.length;
        const totalAttempts = totalWords * 3; // 每个单词3种模式
        
        // 计算总正确数（所有模式）
        let totalCorrect = 0;
        let allModeErrors = new Set();
        
        // 安全检查：确保 trainingMultiModeResults 已初始化
        if (this.trainingMultiModeResults) {
            Object.values(this.trainingMultiModeResults).forEach(modeResult => {
                totalCorrect += modeResult.correct;
                modeResult.errors.forEach(word => allModeErrors.add(word));
            });
        } else {
            console.warn('trainingMultiModeResults 未初始化，使用 trainingWordResults 计算');
            // 如果 trainingMultiModeResults 未初始化，从 trainingWordResults 计算
            if (this.trainingWordResults) {
                Object.values(this.trainingWordResults).forEach(modes => {
                    Object.values(modes).forEach(isCorrect => {
                        if (isCorrect) totalCorrect++;
                    });
                });
            }
        }
        
        const accuracy = totalAttempts > 0 
            ? Math.round((totalCorrect / totalAttempts) * 100) 
            : 0;
        
        // 计算完全掌握的单词数（三种模式全部通过）
        let fullyMasteredCount = 0;
        let partiallyMasteredWords = [];
        let fullyMasteredWords = [];
        
        Object.entries(this.trainingWordResults).forEach(([word, modes]) => {
            // 检查三种模式是否都有记录且全部正确
            const hasAllModes = modes.recognition !== undefined && modes.spelling !== undefined && modes.listening !== undefined;
            const allCorrect = hasAllModes && modes.recognition && modes.spelling && modes.listening;
            if (allCorrect) {
                fullyMasteredCount++;
                fullyMasteredWords.push(word);
            } else {
                partiallyMasteredWords.push(word);
            }
        });
        
        // 自动将完全掌握的单词标记为已记住
        for (const word of fullyMasteredWords) {
            await vocabulary.toggleRemembered(word, true);
        }
        
        // 将昨天的单词中全部3种模式都答对的标记为已复习（统一在此处标记，避免未完成全部模式就被标记）
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayStr = vocabulary._getLocalDateStr(yesterdayDate);
        for (const word of fullyMasteredWords) {
            const wordData = this.trainingWords.find(w => w.word === word);
            if (wordData && wordData.isYesterday) {
                vocabulary.markAsReviewed(word, yesterdayStr).catch(err => console.error('标记复习状态失败:', err));
            }
        }
        
        // 更新结果数据
        const timeEl = document.getElementById('result-time');
        const newWordsEl = document.getElementById('result-new-words');
        const reviewWordsEl = document.getElementById('result-review-words');
        const accuracyEl = document.getElementById('result-accuracy');
        
        if (timeEl) timeEl.textContent = `${duration}分钟`;
        if (newWordsEl) newWordsEl.textContent = `${fullyMasteredCount}/${totalWords}`;
        if (reviewWordsEl) reviewWordsEl.textContent = `${partiallyMasteredWords.length}个需复习`;
        if (accuracyEl) accuracyEl.textContent = `${accuracy}%`;
        
        // 更新标题
        const resultTitle = document.querySelector('.result-title');
        if (resultTitle) {
            resultTitle.textContent = `训练完成 - ${fullyMasteredCount}个单词完全掌握`;
        }
        
        // 显示错误单词（部分掌握的单词）
        const errorList = document.getElementById('error-words-list');
        if (errorList && partiallyMasteredWords.length > 0) {
            errorList.innerHTML = `
                <div class="error-section-title">未完全掌握的单词（需复习）</div>
                ${partiallyMasteredWords.map(word => {
                    const modes = this.trainingWordResults[word] || {};
                    const modeStatus = [];
                    if (modes.recognition !== true) modeStatus.push('认读');
                    if (modes.spelling !== true) modeStatus.push('拼写');
                    if (modes.listening !== true) modeStatus.push('听音');
                    return `
                        <div class="error-word-item">
                            <div class="word">${word}</div>
                            <div class="meaning">${modeStatus.join('、')}错误</div>
                        </div>
                    `;
                }).join('')}
            `;
        } else if (errorList) {
            errorList.innerHTML = '<div style="color:var(--vb-text-muted)">全部掌握，太棒了！🎉</div>';
        }
        
        // 按钮事件
        const viewErrorsBtn = document.getElementById('btn-view-errors');
        const practiceAgainBtn = document.getElementById('btn-practice-again');
        const backHomeBtn = document.getElementById('btn-back-home');
        
        if (viewErrorsBtn) {
            viewErrorsBtn.onclick = async () => {
                resultInterface.classList.remove('active');
                resultInterface.classList.add('hidden');
                await this.switchVocabularyModule('wrong-book');
            };
        }
        
        if (practiceAgainBtn) {
            practiceAgainBtn.onclick = async () => {
                resultInterface.classList.remove('active');
                resultInterface.classList.add('hidden');
                await this.startTraining();
            };
        }
        
        if (backHomeBtn) {
            backHomeBtn.onclick = () => {
                resultInterface.classList.remove('active');
                resultInterface.classList.add('hidden');
                this.renderVocabularyList();
                this.updateVocabularyHeaderStats();
            };
        }
        
        // 等待异步的studyWord调用完成，确保数据一致
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // 刷新数据
        await vocabulary.refresh();
        this.renderVocabularyList();
        this.updateVocabularyHeaderStats();
        
        // 恢复显示今日记单词列表
        const todaySection = document.querySelector('.vocabulary-today');
        if (todaySection) {
            todaySection.style.display = '';
        }
    },

    
    /**
     * 开始听写训练
     */
    async startDictation() {
        // 获取听写范围
        const rangeBtn = document.querySelector('#dictation-training-module .config-option[data-range].active');
        const range = rangeBtn ? rangeBtn.dataset.range : 'today';
        
        // 获取间隔时间
        const intervalBtn = document.querySelector('.interval-option.active');
        this.dictationInterval = intervalBtn ? parseInt(intervalBtn.dataset.seconds) * 1000 : 5000;
        
        // 获取播放次数
        const playCountBtn = document.querySelector('.play-count-option.active');
        this.dictationPlayCount = playCountBtn ? parseInt(playCountBtn.dataset.count) : 2;
        
        // 获取提示设置
        this.dictationShowChinese = document.getElementById('show-chinese-hint')?.checked || false;
        this.dictationShowFirstLetter = document.getElementById('show-first-letter')?.checked || false;
        
        // 获取单词
        let words;
        if (range === 'today') {
            words = vocabulary.getTodayWords();
        } else {
            words = vocabulary.getUnmasteredWords();
        }
        
        if (!words || words.length === 0) {
            this.showVocabularyNotification('没有可听写的单词', 'warning');
            return;
        }
        
        // 初始化听写状态
        this.dictationMode = true;
        this.dictationWords = words;
        this.dictationIndex = 0;
        this.dictationCorrect = 0;
        this.dictationStartTime = Date.now();
        this.dictationResults = [];
        
        // 显示听写界面
        const dictationInterface = document.getElementById('dictation-interface');
        if (dictationInterface) {
            dictationInterface.classList.remove('hidden');
            dictationInterface.classList.add('active');
        }
        
        // 设置事件
        const exitBtn = document.getElementById('btn-exit-dictation');
        if (exitBtn) exitBtn.onclick = () => this.exitDictation();
        
        const playBtn = document.getElementById('btn-dictation-play');
        if (playBtn) playBtn.onclick = () => this.playDictationWord();
        
        const submitBtn = document.getElementById('btn-dictation-submit');
        if (submitBtn) submitBtn.onclick = () => this.submitDictationAnswer();
        
        // 输入框回车键监听
        const dictationInput = document.getElementById('dictation-input');
        if (dictationInput) {
            dictationInput.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    if (this.dictationSubmitted) {
                        this.nextDictationWord();
                    } else {
                        this.submitDictationAnswer();
                    }
                }
            };
        }
        
        // 初始化提交状态
        this.dictationSubmitted = false;
        
        const prevBtn = document.getElementById('btn-dictation-prev');
        const nextBtn = document.getElementById('btn-dictation-next');
        const replayBtn = document.getElementById('btn-dictation-replay');
        
        if (prevBtn) prevBtn.onclick = () => {
            if (this.dictationIndex > 0) {
                this.dictationIndex--;
                this.showDictationWord();
            }
        };
        if (nextBtn) nextBtn.onclick = () => {
            this.dictationIndex++;
            if (this.dictationIndex >= this.dictationWords.length) {
                this.showTrainingResult();
            } else {
                this.showDictationWord();
            }
        };
        if (replayBtn) replayBtn.onclick = () => this.playDictationWord();
        
        this.showDictationWord();
    },

    
    /**
     * 显示听写单词
     */
    showDictationWord() {
        const word = this.dictationWords[this.dictationIndex];
        if (!word) return;
        
        // 更新进度
        const progressText = document.getElementById('dictation-progress-text');
        if (progressText) progressText.textContent = `${this.dictationIndex + 1}/${this.dictationWords.length}`;
        
        // 更新提示
        const hintEl = document.getElementById('dictation-hint');
        if (hintEl) {
            let hint = '';
            if (this.dictationShowChinese) hint += word.meaning;
            if (this.dictationShowFirstLetter) hint += ` (首字母: ${word.word[0]})`;
            hintEl.textContent = hint;
        }
        
        // 清空输入
        const input = document.getElementById('dictation-input');
        if (input) {
            input.value = '';
            input.disabled = false;
            input.classList.remove('correct', 'wrong', 'input-shake');
            input.focus();
        }
        
        // 自动播放
        this.playDictationWord();
        
        // 隐藏倒计时显示
        const timerEl = document.getElementById('dictation-timer');
        if (timerEl) timerEl.style.display = 'none';
    },

    
    /**
     * 播放听写单词
     */
    playDictationWord() {
        const word = this.dictationWords[this.dictationIndex];
        if (!word) return;
        
        if (typeof audioManager !== 'undefined' && audioManager.speak) {
            audioManager.speak(word.word, 'en-US').catch(() => {});
        }
    },

    
    /**
     * 提交听写答案
     */
    submitDictationAnswer() {
        const word = this.dictationWords[this.dictationIndex];
        const input = document.getElementById('dictation-input');
        if (!word || !input) return;
        
        const userAnswer = input.value.trim().toLowerCase();
        if (!userAnswer) {
            input.classList.add('input-shake');
            setTimeout(() => input.classList.remove('input-shake'), 300);
            return;
        }
        
        const isCorrect = userAnswer === word.word.toLowerCase();
        input.disabled = true;
        
        if (isCorrect) {
            this.dictationCorrect++;
            input.classList.add('correct');
            vocabulary.studyWord(word.word, true, { meaning: word.meaning, phonetic: word.phonetic, grade: word.grade, unit: word.unit });
        } else {
            input.classList.add('wrong');
            vocabulary.studyWord(word.word, false, { meaning: word.meaning, phonetic: word.phonetic, grade: word.grade, unit: word.unit });
            this.dictationResults.push({ word, userAnswer });
        }
        
        // 显示提示，等待用户按回车进入下一个
        const hintEl = document.getElementById('dictation-hint');
        if (hintEl) {
            const correctAnswer = isCorrect ? '' : ` 答案: ${word.word}`;
            hintEl.textContent = `${isCorrect ? '✓ 正确' : '✗ 错误'}${correctAnswer} - 按回车继续`;
        }
        
        // 标记已提交状态，等待回车键
        this.dictationSubmitted = true;
    },
    
    /**
     * 进入下一个听写单词
     */
    nextDictationWord() {
        this.dictationSubmitted = false;
        this.dictationIndex++;
        if (this.dictationIndex >= this.dictationWords.length) {
            // 转换为训练结果格式
            this.trainingWords = this.dictationWords;
            this.trainingCorrect = this.dictationCorrect;
            this.trainingStartTime = this.dictationStartTime;
            this.trainingErrors = this.dictationResults.map(r => r.word);
            this.showTrainingResult();
        } else {
            this.showDictationWord();
        }
    },

    
    /**
     * 退出听写
     */
    exitDictation() {
        this.dictationMode = false;
        if (this.dictationCountdown) clearInterval(this.dictationCountdown);
        
        const dictationInterface = document.getElementById('dictation-interface');
        if (dictationInterface) {
            dictationInterface.classList.remove('active');
            dictationInterface.classList.add('hidden');
        }
        this.renderVocabularyList();
        this.updateVocabularyHeaderStats();
    },

    
    /**
     * 显示记单词通知
     */
    showVocabularyNotification(message, type = 'info') {
        // 移除现有通知
        const existing = document.querySelector('.vocabulary-notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = `vocabulary-notification vocabulary-notification-${type}`;
        notification.innerHTML = `
            <span class="vocabulary-notification-icon">${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : type === 'error' ? '❌' : 'ℹ️'}</span>
            <span class="vocabulary-notification-text">${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // 动画显示
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });
        
        // 自动隐藏
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    },

    
    /**
     * 切换历史记录面板
     */
    toggleHistoryPanel(show = null) {
        const panel = document.getElementById('vocabulary-history-panel');
        if (!panel) return;
        
        if (show === null) {
            show = panel.classList.contains('hidden');
        }
        
        if (show) {
            panel.classList.remove('hidden');
            // 设置默认日期为今天（使用本地时间）
            const today = vocabulary._getLocalDateStr(new Date());
            const dateInput = document.getElementById('history-date');
            if (dateInput) dateInput.value = today;
            this.loadHistory();
        } else {
            panel.classList.add('hidden');
        }
    },

    
    /**
     * 加载历史记录
     */
    async loadHistory() {
        const dateInput = document.getElementById('history-date');
        const summaryContainer = document.getElementById('history-summary');
        const listContainer = document.getElementById('history-list');
        
        if (!dateInput || !summaryContainer || !listContainer) return;
        
        const date = dateInput.value;
        if (!date) {
            this.showVocabularyNotification('请选择日期', 'warning');
            return;
        }
        
        try {
            const records = await vocabulary.getDailyRecord(date);
            
            if (!records || records.length === 0) {
                summaryContainer.innerHTML = `
                    <div class="history-empty">
                        <div class="history-empty-icon">📅</div>
                        <div class="history-empty-text">该日无学习记录</div>
                    </div>
                `;
                listContainer.innerHTML = '';
                return;
            }
            
            // 计算统计信息
            const totalWords = records.length;
            const correctWords = records.filter(r => r.correct).length;
            const accuracy = totalWords > 0 ? Math.round((correctWords / totalWords) * 100) : 0;
            
            summaryContainer.innerHTML = `
                <div class="history-stats">
                    <div class="history-stat-item">
                        <div class="history-stat-value">${totalWords}</div>
                        <div class="history-stat-label">学习单词</div>
                    </div>
                    <div class="history-stat-item">
                        <div class="history-stat-value">${correctWords}</div>
                        <div class="history-stat-label">正确</div>
                    </div>
                    <div class="history-stat-item">
                        <div class="history-stat-value">${accuracy}%</div>
                        <div class="history-stat-label">正确率</div>
                    </div>
                </div>
            `;
            
            // 渲染记录列表
            listContainer.innerHTML = records.map(record => `
                <div class="history-record-item ${record.correct ? 'correct' : 'wrong'}">
                    <div class="history-record-header">
                        <div class="history-record-word">${record.word}</div>
                        <div class="history-record-status ${record.correct ? 'correct' : 'wrong'}">
                            ${record.correct ? '✅' : '❌'}
                        </div>
                    </div>
                    <div class="history-record-meaning">${record.meaning || ''}</div>
                    ${record.phonetic ? `<div class="history-record-phonetic">${record.phonetic}</div>` : ''}
                    <div class="history-record-time">
                        学习时间: ${new Date(record.studyTime).toLocaleTimeString('zh-CN')}
                    </div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('加载历史记录失败:', error);
            this.showVocabularyNotification('加载历史记录失败', 'error');
        }
    },

    
    /**
     * 切换成就徽章面板
     */
    async toggleAchievementsPanel(show = null) {
        const panel = document.getElementById('vocabulary-achievements');
        if (!panel) return;
        
        if (show === null) {
            show = panel.classList.contains('hidden');
        }
        
        if (show) {
            panel.classList.remove('hidden');
            await this.renderAchievements();
        } else {
            panel.classList.add('hidden');
        }
    },

    
    /**
     * 渲染成就徽章
     */
    async renderAchievements() {
        const gridContainer = document.getElementById('achievements-grid');
        if (!gridContainer) return;
        
        try {
            const userStats = await vocabulary.getUserStats();
            if (!userStats) {
                gridContainer.innerHTML = `
                    <div class="achievements-empty">
                        <div class="achievements-empty-icon">🏆</div>
                        <div class="achievements-empty-text">加载成就信息失败</div>
                    </div>
                `;
                return;
            }
            
            const achievements = userStats.achievements || [];
            const levelConfig = userStats.levelConfig || [];
            
            // 创建等级成就
            const levelAchievements = levelConfig.map(level => {
                const isUnlocked = userStats.levelInfo.level >= level.level;
                return {
                    id: `level_${level.level}`,
                    name: level.title,
                    desc: `达到${level.title}等级`,
                    icon: level.icon,
                    unlocked: isUnlocked,
                    progress: isUnlocked ? 100 : Math.min((userStats.stats.totalWordsLearned / level.minWords) * 100, 100),
                    target: level.minWords,
                    isLevel: true
                };
            });
            
            // 合并所有成就
            const allAchievements = [...levelAchievements, ...achievements.map(a => ({
                ...a,
                unlocked: a.unlocked || false,
                progress: a.progress || 0,
                target: a.target || 1,
                isLevel: false
            }))];
            
            // 按解锁状态和进度排序
            allAchievements.sort((a, b) => {
                if (a.unlocked && !b.unlocked) return -1;
                if (!a.unlocked && b.unlocked) return 1;
                return b.progress - a.progress;
            });
            
            gridContainer.innerHTML = allAchievements.map(achievement => {
                // 等级成就的progress已经是百分比(0-100)，普通成就的progress是实际进度值
                const progressPercent = achievement.isLevel 
                    ? Math.min(achievement.progress, 100) 
                    : (achievement.target > 0 ? Math.min((achievement.progress / achievement.target) * 100, 100) : 0);
                
                return `
                    <div class="achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}">
                        <div class="achievement-icon">${achievement.icon}</div>
                        <div class="achievement-info">
                            <div class="achievement-name">${achievement.name}</div>
                            <div class="achievement-desc">${achievement.desc}</div>
                            ${!achievement.unlocked ? `
                                <div class="achievement-progress">
                                    <div class="achievement-progress-bar">
                                        <div class="achievement-progress-fill" style="width: ${progressPercent}%"></div>
                                    </div>
                                    <div class="achievement-progress-text">
                                        ${achievement.isLevel 
                                            ? `${userStats.stats.totalWordsLearned}/${achievement.target}个单词` 
                                            : `${achievement.progress}/${achievement.target}`
                                        }
                                    </div>
                                </div>
                            ` : `
                                <div class="achievement-unlocked-time">
                                    ${achievement.unlockedTime ? `解锁于 ${new Date(achievement.unlockedTime).toLocaleDateString('zh-CN')}` : '已解锁'}
                                </div>
                            `}
                        </div>
                    </div>
                `;
            }).join('');
            
        } catch (error) {
            console.error('渲染成就徽章失败:', error);
            gridContainer.innerHTML = `
                <div class="achievements-empty">
                    <div class="achievements-empty-icon">❌</div>
                    <div class="achievements-empty-text">加载成就信息失败</div>
                </div>
            `;
        }
    },

    
    /**
     * 切换历史单词面板（保留兼容性）
     */
    async toggleHistoryWords() {
        await this.switchVocabularyModule('history-words');
    },

    
    /**
     * 渲染历史单词列表
     */
    async renderHistoryWords() {
        const historyList = document.getElementById('vocabulary-history-list');
        const historyStats = document.getElementById('history-stats');
        if (!historyList || !historyStats) return;
        
        try {
            // 获取历史日期列表
            const historyDates = await vocabulary.getHistoryDates();
            
            if (historyDates.length === 0) {
                historyStats.innerHTML = `
                    <div class="history-empty">
                        <div class="empty-icon">📚</div>
                        <div class="empty-text">暂无学习记录</div>
                        <div class="empty-subtext">开始训练后，历史记录将显示在这里</div>
                    </div>
                `;
                historyList.innerHTML = '';
                return;
            }
            
            // 显示统计信息
            const totalDays = historyDates.length;
            const totalWords = historyDates.reduce((sum, date) => sum + date.wordCount, 0);
            const avgAccuracy = historyDates.reduce((sum, date) => sum + parseFloat(date.accuracy), 0) / totalDays;
            
            historyStats.innerHTML = `
                <div class="history-stats-grid">
                    <div class="history-stat-card">
                        <div class="stat-icon">📅</div>
                        <div class="stat-value">${totalDays}</div>
                        <div class="stat-label">学习天数</div>
                    </div>
                    <div class="history-stat-card">
                        <div class="stat-icon">📝</div>
                        <div class="stat-value">${totalWords}</div>
                        <div class="stat-label">学习单词数</div>
                    </div>
                    <div class="history-stat-card">
                        <div class="stat-icon">🎯</div>
                        <div class="stat-value">${avgAccuracy.toFixed(1)}%</div>
                        <div class="stat-label">平均正确率</div>
                    </div>
                </div>
            `;
            
            // 按日期分组显示历史单词
            let historyHtml = '';
            
            for (const dateInfo of historyDates) {
                // 确保日期格式为YYYY-MM-DD（兼容ISO格式）
                const date = typeof dateInfo.date === 'string' && dateInfo.date.includes('T') 
                    ? dateInfo.date.split('T')[0] 
                    : dateInfo.date;
                const formattedDate = this.formatDate(date);
                
                historyHtml += `
                    <div class="history-date-group">
                        <div class="history-date-header">
                            <div class="date-label">
                                <span class="date-icon">📅</span>
                                <span class="date-text">${formattedDate}</span>
                            </div>
                            <div class="date-stats">
                                <span class="date-stat">${dateInfo.wordCount} 个单词</span>
                                <span class="date-stat">正确率: ${dateInfo.accuracy}%</span>
                            </div>
                        </div>
                        <div class="history-date-words" id="history-words-${date}">
                            <div class="loading-words">加载中...</div>
                        </div>
                    </div>
                `;
            }
            
            historyList.innerHTML = historyHtml;
            
            // 添加历史单词发音按钮事件委托
            historyList.addEventListener('click', (e) => {
                const pronunciationBtn = e.target.closest('.btn-pronunciation');
                if (pronunciationBtn) {
                    e.stopPropagation();
                    const word = pronunciationBtn.dataset.word;
                    if (word) {
                        audioManager.speak(word, 'en-US').catch(() => {});
                    }
                }
            });
            
            // 异步加载每个日期的单词
            for (const dateInfo of historyDates) {
                // 确保日期格式为YYYY-MM-DD（与HTML ID一致）
                const date = typeof dateInfo.date === 'string' && dateInfo.date.includes('T') 
                    ? dateInfo.date.split('T')[0] 
                    : dateInfo.date;
                const words = await vocabulary.getDailyRecord(date);
                console.log(`历史单词数据 (${date}):`, words);
                const wordsContainer = document.getElementById(`history-words-${date}`);
                
                if (wordsContainer && words.length > 0) {
                    wordsContainer.innerHTML = words.map(word => `
                        <div class="history-word-item ${word.correct ? 'correct' : 'incorrect'}">
                            <div class="history-word-header">
                                <div class="history-word">${word.word}</div>
                                <div class="history-word-badges">
                                    <span class="history-badge ${word.correct ? 'correct' : 'incorrect'}">${word.correct ? '正确' : '错误'}</span>
                                </div>
                            </div>
                            <div class="history-word-phonetic">
                                <span>${word.phonetic || ''}</span>
                                <button class="btn-pronunciation" data-word="${word.word}" title="朗读单词">🔊</button>
                            </div>
                            <div class="history-word-meaning">${word.meaning || ''}</div>
                            ${(() => { const exp = getWordExplain(word.word); return exp ? `<div class="history-word-explain">${exp}</div>` : ''; })()}
                            ${word.rootAffix ? `<div class="history-word-rootAffix"><span class="root-affix-label">词根词缀:</span> ${word.rootAffix}</div>` : ''}
                            ${word.example ? `<div class="history-word-example">"${word.example}"</div>` : ''}
                        </div>
                    `).join('');
                } else if (wordsContainer) {
                    wordsContainer.innerHTML = '<div class="no-words">暂无记录</div>';
                }
            }
            
        } catch (error) {
            console.error('渲染历史单词失败:', error);
            historyList.innerHTML = `
                <div class="history-error">
                    <div class="error-icon">⚠️</div>
                    <div class="error-text">加载历史记录失败</div>
                    <div class="error-subtext">${error.message}</div>
                </div>
            `;
        }
    },

    
    /**
     * 格式化日期
     */
    formatDate(dateStr) {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (dateStr === vocabulary._getLocalDateStr(today)) {
            return '今天';
        } else if (dateStr === vocabulary._getLocalDateStr(yesterday)) {
            return '昨天';
        } else {
            return date.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'short'
            });
        }
    },

    
    /**
     * 显示编辑单词模态框
     */
    showEditWordModal(word) {
        const item = vocabulary.getAll().find(w => w.word === word);
        if (!item) return;
        
        // 创建模态框
        const modal = document.createElement('div');
        modal.className = 'vocabulary-edit-modal';
        modal.innerHTML = `
            <div class="edit-modal-content">
                <div class="edit-modal-header">
                    <h3>编辑单词: ${word}</h3>
                    <button class="edit-modal-close">&times;</button>
                </div>
                <div class="edit-modal-body">
                    <div class="form-group">
                        <label>单词</label>
                        <input type="text" id="edit-word" class="form-input" value="${item.word}" readonly>
                    </div>
                    <div class="form-group">
                        <label>释义 *</label>
                        <input type="text" id="edit-meaning" class="form-input" value="${item.meaning || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>音标</label>
                        <input type="text" id="edit-phonetic" class="form-input" value="${item.phonetic || ''}">
                    </div>
                    <div class="form-group">
                        <label>例句</label>
                        <textarea id="edit-example" class="form-textarea" rows="2">${item.example || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>词根词缀</label>
                        <input type="text" id="edit-rootAffix" class="form-input" value="${item.rootAffix || ''}">
                    </div>
                    <div class="form-group">
                        <label>年级</label>
                        <select id="edit-grade" class="form-select">
                            <option value="" ${!item.grade ? 'selected' : ''}>选择年级</option>
                            <option value="小学" ${item.grade === '小学' ? 'selected' : ''}>小学</option>
                            <option value="初中" ${item.grade === '初中' ? 'selected' : ''}>初中</option>
                            <option value="高中" ${item.grade === '高中' ? 'selected' : ''}>高中</option>
                            <option value="四级" ${item.grade === '四级' ? 'selected' : ''}>四级</option>
                            <option value="六级" ${item.grade === '六级' ? 'selected' : ''}>六级</option>
                            <option value="考研" ${item.grade === '考研' ? 'selected' : ''}>考研</option>
                            <option value="托福" ${item.grade === '托福' ? 'selected' : ''}>托福</option>
                            <option value="雅思" ${item.grade === '雅思' ? 'selected' : ''}>雅思</option>
                        </select>
                    </div>
                </div>
                <div class="edit-modal-footer">
                    <button class="edit-modal-cancel">取消</button>
                    <button class="edit-modal-save">保存</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 关闭按钮事件
        modal.querySelector('.edit-modal-close').onclick = () => modal.remove();
        modal.querySelector('.edit-modal-cancel').onclick = () => modal.remove();
        
        // 保存按钮事件
        modal.querySelector('.edit-modal-save').onclick = async () => {
            const meaning = document.getElementById('edit-meaning').value.trim();
            const phonetic = document.getElementById('edit-phonetic').value.trim();
            const example = document.getElementById('edit-example').value.trim();
            const rootAffix = document.getElementById('edit-rootAffix').value.trim();
            const grade = document.getElementById('edit-grade').value;
            
            if (!meaning) {
                this.showVocabularyNotification('请输入释义', 'warning');
                return;
            }
            
            try {
                // 使用addWord接口更新（已存在时会自动更新）
                await vocabulary.addWord({
                    word,
                    meaning,
                    phonetic,
                    example,
                    rootAffix,
                    grade,
                    source: item.source || 'manual'
                });
                
                this.showVocabularyNotification(`单词 "${word}" 已更新`, 'success');
                modal.remove();
                this.renderVocabularyList();
            } catch (error) {
                console.error('更新单词失败:', error);
                this.showVocabularyNotification('更新单词失败', 'error');
            }
        };
        
        // 点击模态框外部关闭
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    },

    
    // ==================== 周末测验功能 ====================
    
    /**
     * 初始化周末测验
     */
    async initWeeklyQuiz() {
        console.log('初始化周末测验模块');
        
        // 重置测验状态
        this.weeklyQuizWords = [];
        this.weeklyQuizShuffledWords = [];
        this.weeklyQuizMode = 'meaning';
        this.weeklyQuizCurrentIndex = 0;
        this.weeklyQuizCorrectCount = 0;
        this.weeklyQuizTotalAnswered = 0;
        this.weeklyQuizWrongWords = [];
        
        // 显示配置区，隐藏其他区
        document.getElementById('quiz-config')?.classList.remove('hidden');
        document.getElementById('quiz-testing')?.classList.add('hidden');
        document.getElementById('quiz-result')?.classList.add('hidden');
        
        // 加载测验单词数据
        await this.loadWeeklyQuizWords();
        
        // 设置测验事件监听
        this.setupWeeklyQuizListeners();
    },
    
    /**
     * 加载最近7天的测验单词
     */
    async loadWeeklyQuizWords() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/vocabulary/weekly-quiz-words', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            
            if (data.success) {
                this.weeklyQuizWords = data.data || [];
                
                // 更新配置区统计
                const totalWordsEl = document.getElementById('quiz-total-words');
                const dateRangeEl = document.getElementById('quiz-date-range');
                
                if (totalWordsEl) totalWordsEl.textContent = this.weeklyQuizWords.length;
                if (dateRangeEl && data.dateRange) {
                    dateRangeEl.textContent = `${data.dateRange.start.slice(5)} ~ ${data.dateRange.end.slice(5)}`;
                }
                
                // 如果没有单词，禁用开始按钮
                const startBtn = document.getElementById('btn-start-weekly-quiz');
                if (startBtn) {
                    if (this.weeklyQuizWords.length === 0) {
                        startBtn.disabled = true;
                        startBtn.innerHTML = '<span class="btn-icon">⚠️</span><span>暂无可测验单词</span>';
                    } else {
                        startBtn.disabled = false;
                        startBtn.innerHTML = '<span class="btn-icon">🚀</span><span>开始测验</span>';
                    }
                }
            } else {
                console.error('获取测验单词失败:', data.error);
                this.showVocabularyNotification('获取测验单词失败', 'error');
            }
        } catch (error) {
            console.error('加载测验单词失败:', error);
            this.showVocabularyNotification('加载测验单词失败', 'error');
        }
    },
    
    /**
     * 设置周末测验事件监听
     */
    setupWeeklyQuizListeners() {
        // 测验模式切换
        document.querySelectorAll('#weekly-quiz-module .mode-btn').forEach(btn => {
            btn.onclick = (e) => {
                document.querySelectorAll('#weekly-quiz-module .mode-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.weeklyQuizMode = e.currentTarget.dataset.mode;
            };
        });
        
        // 开始测验按钮
        const startBtn = document.getElementById('btn-start-weekly-quiz');
        if (startBtn) {
            startBtn.onclick = () => this.startWeeklyQuiz();
        }
        
        // 下一题按钮
        const nextBtn = document.getElementById('btn-next-question');
        if (nextBtn) {
            nextBtn.onclick = () => this.nextWeeklyQuizQuestion();
        }
        
        // 拼写确认按钮
        const checkBtn = document.getElementById('btn-check-spelling');
        if (checkBtn) {
            checkBtn.onclick = () => this.checkWeeklyQuizSpellingAnswer();
        }
        
        // 拼写输入回车
        const spellingInput = document.getElementById('spelling-answer');
        if (spellingInput) {
            spellingInput.onkeydown = (e) => {
                if (e.key === 'Enter') this.checkWeeklyQuizSpellingAnswer();
            };
        }
        
        // 重新测验按钮
        const retryBtn = document.getElementById('btn-retry-quiz');
        if (retryBtn) {
            retryBtn.onclick = () => this.startWeeklyQuiz();
        }
        
        // 返回配置按钮
        const backBtn = document.getElementById('btn-back-to-config');
        if (backBtn) {
            backBtn.onclick = () => this.initWeeklyQuiz();
        }
    },
    
    /**
     * 开始周末测验
     */
    startWeeklyQuiz() {
        if (this.weeklyQuizWords.length === 0) {
            this.showVocabularyNotification('没有可测验的单词', 'warning');
            return;
        }
        
        // 重置测验状态
        this.weeklyQuizCurrentIndex = 0;
        this.weeklyQuizCorrectCount = 0;
        this.weeklyQuizTotalAnswered = 0;
        this.weeklyQuizWrongWords = [];
        
        // 打乱单词顺序
        this.weeklyQuizShuffledWords = [...this.weeklyQuizWords].sort(() => Math.random() - 0.5);
        
        // 切换显示区域
        document.getElementById('quiz-config')?.classList.add('hidden');
        document.getElementById('quiz-testing')?.classList.remove('hidden');
        document.getElementById('quiz-result')?.classList.add('hidden');
        
        // 更新总数显示
        document.getElementById('quiz-total-num').textContent = this.weeklyQuizShuffledWords.length;
        
        // 显示第一题
        this.showWeeklyQuizQuestion();
    },
    
    /**
     * 显示测验题目
     */
    showWeeklyQuizQuestion() {
        const currentWord = this.weeklyQuizShuffledWords[this.weeklyQuizCurrentIndex];
        if (!currentWord) return;
        
        // 更新进度
        document.getElementById('quiz-current-num').textContent = this.weeklyQuizCurrentIndex + 1;
        document.getElementById('quiz-correct-count').textContent = this.weeklyQuizCorrectCount;
        document.getElementById('quiz-total-answered').textContent = this.weeklyQuizTotalAnswered;
        
        const progressPercent = ((this.weeklyQuizCurrentIndex) / this.weeklyQuizShuffledWords.length) * 100;
        document.getElementById('quiz-progress-fill').style.width = `${progressPercent}%`;
        
        // 隐藏反馈和下一题按钮
        document.getElementById('quiz-feedback')?.classList.add('hidden');
        document.getElementById('btn-next-question')?.classList.add('hidden');
        
        // 根据模式显示题目
        const wordDisplay = document.getElementById('quiz-word-display');
        const optionsContainer = document.getElementById('quiz-options');
        const spellingInput = document.getElementById('quiz-spelling-input');
        
        // 更新发音按钮状态和事件
        const pronunciationBtn = document.getElementById('btn-quiz-pronunciation');
        if (pronunciationBtn) {
            // 所有模式都显示发音按钮
            pronunciationBtn.classList.remove('hidden');
            
            // 移除旧事件监听器
            const newPronunciationBtn = pronunciationBtn.cloneNode(true);
            pronunciationBtn.parentNode.replaceChild(newPronunciationBtn, pronunciationBtn);
            
            // 添加新的点击事件
            newPronunciationBtn.addEventListener('click', () => {
                if (audioManager && currentWord.word) {
                    audioManager.speak(currentWord.word, { 
                        rate: 0.8, 
                        onStart: () => newPronunciationBtn.classList.add('playing'),
                        onEnd: () => newPronunciationBtn.classList.remove('playing')
                    });
                }
            });
        }
        
        if (this.weeklyQuizMode === 'spelling') {
            // 拼写模式
            wordDisplay.innerHTML = `
                <div class="quiz-word-meaning">${currentWord.meaning}</div>
                ${currentWord.phonetic ? `<div class="quiz-word-phonetic">${currentWord.phonetic}</div>` : ''}
            `;
            optionsContainer.innerHTML = '';
            spellingInput?.classList.remove('hidden');
            document.getElementById('spelling-answer').value = '';
            document.getElementById('spelling-answer').focus();
            
            // 拼写模式下自动朗读（延迟一点让用户先看到题目）
            setTimeout(() => {
                if (audioManager && currentWord.word) {
                    audioManager.speak(currentWord.word, { rate: 0.8 });
                }
            }, 500);
        } else if (this.weeklyQuizMode === 'meaning') {
            // 看英文选释义
            wordDisplay.innerHTML = `
                <div class="quiz-word-english">${currentWord.word}</div>
                ${currentWord.phonetic ? `<div class="quiz-word-phonetic">${currentWord.phonetic}</div>` : ''}
            `;
            spellingInput?.classList.add('hidden');
            this.renderQuizOptions(currentWord, 'meaning');
            
            // 自动朗读单词
            setTimeout(() => {
                if (audioManager && currentWord.word) {
                    audioManager.speak(currentWord.word, { rate: 0.8 });
                }
            }, 300);
        } else {
            // 看释义选英文
            wordDisplay.innerHTML = `
                <div class="quiz-word-meaning">${currentWord.meaning}</div>
                ${currentWord.phonetic ? `<div class="quiz-word-phonetic">${currentWord.phonetic}</div>` : ''}
            `;
            spellingInput?.classList.add('hidden');
            this.renderQuizOptions(currentWord, 'word');
            
            // 看释义选英文模式也自动朗读（帮助记忆发音）
            setTimeout(() => {
                if (audioManager && currentWord.word) {
                    audioManager.speak(currentWord.word, { rate: 0.8 });
                }
            }, 300);
        }
    },
    
    /**
     * 渲染选择题选项
     */
    renderQuizOptions(currentWord, type) {
        const optionsContainer = document.getElementById('quiz-options');
        if (!optionsContainer) return;
        
        // 生成干扰选项
        const otherWords = this.weeklyQuizWords.filter(w => w.word !== currentWord.word);
        const distractors = otherWords.sort(() => Math.random() - 0.5).slice(0, 3);
        
        let options = [currentWord, ...distractors].sort(() => Math.random() - 0.5);
        
        optionsContainer.innerHTML = options.map((opt, index) => {
            const isCorrect = opt.word === currentWord.word;
            const displayText = type === 'meaning' ? opt.meaning : opt.word;
            return `
                <button class="quiz-option-btn" data-correct="${isCorrect}" data-index="${index}">
                    <span class="option-letter">${String.fromCharCode(65 + index)}</span>
                    <span class="option-text">${displayText}</span>
                </button>
            `;
        }).join('');
        
        // 绑定选项点击事件
        optionsContainer.querySelectorAll('.quiz-option-btn').forEach(btn => {
            btn.onclick = (e) => this.handleQuizOptionClick(e, currentWord);
        });
    },
    
    /**
     * 处理选项点击
     */
    handleQuizOptionClick(e, currentWord) {
        const btn = e.currentTarget;
        const isCorrect = btn.dataset.correct === 'true';
        
        // 禁用所有选项
        document.querySelectorAll('.quiz-option-btn').forEach(b => {
            b.disabled = true;
            if (b.dataset.correct === 'true') {
                b.classList.add('correct');
            }
        });
        
        // 标记选择的选项
        if (!isCorrect) {
            btn.classList.add('wrong');
        }
        
        // 更新统计
        this.weeklyQuizTotalAnswered++;
        if (isCorrect) {
            this.weeklyQuizCorrectCount++;
        } else {
            this.weeklyQuizWrongWords.push(currentWord);
        }
        
        // 显示反馈
        this.showQuizFeedback(isCorrect, currentWord);
    },
    
    /**
     * 检查周末测验拼写答案
     */
    checkWeeklyQuizSpellingAnswer() {
        const currentWord = this.weeklyQuizShuffledWords[this.weeklyQuizCurrentIndex];
        if (!currentWord) return;
        
        const input = document.getElementById('spelling-answer');
        const userAnswer = input.value.trim().toLowerCase();
        const correctAnswer = currentWord.word.toLowerCase();
        const isCorrect = userAnswer === correctAnswer;
        
        // 更新统计
        this.weeklyQuizTotalAnswered++;
        if (isCorrect) {
            this.weeklyQuizCorrectCount++;
        } else {
            this.weeklyQuizWrongWords.push(currentWord);
        }
        
        // 禁用输入
        input.disabled = true;
        document.getElementById('btn-check-spelling').disabled = true;
        
        // 显示反馈
        this.showQuizFeedback(isCorrect, currentWord);
    },
    
    /**
     * 显示测验反馈
     */
    showQuizFeedback(isCorrect, currentWord) {
        const feedback = document.getElementById('quiz-feedback');
        const nextBtn = document.getElementById('btn-next-question');
        
        if (feedback) {
            feedback.classList.remove('hidden');
            feedback.className = `quiz-feedback ${isCorrect ? 'correct' : 'wrong'}`;
            feedback.innerHTML = isCorrect 
                ? `<div class="feedback-icon">✅</div><div class="feedback-text">正确！</div>`
                : `<div class="feedback-icon">❌</div>
                   <div class="feedback-text">
                       <div>正确答案：<strong>${currentWord.word}</strong></div>
                       <div>${currentWord.meaning}</div>
                       ${currentWord.example ? `<div class="feedback-example">"${currentWord.example}"</div>` : ''}
                   </div>`;
        }
        
        if (nextBtn) {
            nextBtn.classList.remove('hidden');
            nextBtn.textContent = this.weeklyQuizCurrentIndex < this.weeklyQuizShuffledWords.length - 1 ? '下一题' : '查看结果';
        }
        
        // 更新进度显示
        document.getElementById('quiz-correct-count').textContent = this.weeklyQuizCorrectCount;
        document.getElementById('quiz-total-answered').textContent = this.weeklyQuizTotalAnswered;
    },
    
    /**
     * 下一题
     */
    nextWeeklyQuizQuestion() {
        this.weeklyQuizCurrentIndex++;
        
        if (this.weeklyQuizCurrentIndex >= this.weeklyQuizShuffledWords.length) {
            // 测验结束，显示结果
            this.showWeeklyQuizResult();
        } else {
            // 重置拼写输入状态
            const spellingInput = document.getElementById('spelling-answer');
            const checkBtn = document.getElementById('btn-check-spelling');
            if (spellingInput) spellingInput.disabled = false;
            if (checkBtn) checkBtn.disabled = false;
            
            // 显示下一题
            this.showWeeklyQuizQuestion();
        }
    },
    
    /**
     * 显示测验结果
     */
    showWeeklyQuizResult() {
        // 切换显示区域
        document.getElementById('quiz-testing')?.classList.add('hidden');
        document.getElementById('quiz-result')?.classList.remove('hidden');
        
        // 更新结果统计
        const total = this.weeklyQuizShuffledWords.length;
        const correct = this.weeklyQuizCorrectCount;
        const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
        
        document.getElementById('result-total').textContent = total;
        document.getElementById('result-correct').textContent = correct;
        document.getElementById('result-accuracy').textContent = `${accuracy}%`;
        
        // 显示错误单词
        const wrongWordsContainer = document.getElementById('result-wrong-words');
        if (wrongWordsContainer) {
            if (this.weeklyQuizWrongWords.length > 0) {
                wrongWordsContainer.innerHTML = `
                    <h4>需要加强的单词 (${this.weeklyQuizWrongWords.length}个)</h4>
                    <div class="wrong-words-list">
                        ${this.weeklyQuizWrongWords.map(w => `
                            <div class="wrong-word-item">
                                <div class="wrong-word">${w.word}</div>
                                <div class="wrong-word-meaning">${w.meaning}</div>
                            </div>
                        `).join('')}
                    </div>
                `;
            } else {
                wrongWordsContainer.innerHTML = `
                    <div class="perfect-score">
                        <div class="perfect-icon">🎉</div>
                        <div class="perfect-text">太棒了！全部正确！</div>
                    </div>
                `;
            }
        }
        
        // 显示完成通知
        this.showVocabularyNotification(`测验完成！正确率 ${accuracy}%`, accuracy >= 80 ? 'success' : 'warning');
    }
};
