/**
 * 背单词UI模块 - 核心导航与渲染
 * 通过 Object.assign 将方法合并到全局 VocabularyAppMixin 聚合对象
 * 依赖：vocabulary.js (Vocabulary), wrongbook.js, audio.js, app.js
 */

(function () {
    Object.assign(VocabularyAppMixin, {
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
            // 统一基于 /today 端点返回的阶段判断，避免双套逻辑
            const result = vocabulary._todayResult || {};
            const isReviewPhase = result.phase === 'review_yesterday';

            const startBtn = document.getElementById('btn-start-training');
            const lock = document.getElementById('training-lock');
            const titleElement = document.getElementById('vocabulary-today-title');

            // 根据阶段设置标题
            let title = isReviewPhase ? '📖 请先完成昨天的单词' : '📖 今日记单词';

            if (startBtn) {
                startBtn.disabled = false;
                startBtn.classList.remove('disabled');
            }
            if (lock) {
                if (isReviewPhase) {
                    lock.classList.remove('hidden');
                } else {
                    lock.classList.add('hidden');
                }
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

            // 统一从 /today 端点获取数据，后端已按阶段返回，前端不再自己判断昨天/今天
            await vocabulary._loadTodayWords();
            const result = vocabulary._todayResult || {};
            const wordsToShow = vocabulary.getTodayWords() || [];
            const phase = result.phase; // 'review_yesterday' | 'today_new'
            const isYesterdayWords = phase === 'review_yesterday';

            let title;
            if (isYesterdayWords) {
                title = '📖 请先复习昨天的单词';
            } else {
                title = '📖 今日记单词';
            }

            // 更新标题
            if (titleElement) {
                titleElement.textContent = title;
            }

            // 更新进度
            if (progressText && progressFill) {
                if (isYesterdayWords) {
                    // 昨天复习进度：已复习数 / 总数
                    const total = result.total || wordsToShow.length;
                    // 已复习数 = 昨天总数 - 当前未复习数
                    const reviewedCount = Math.max(0, total - wordsToShow.length);
                    const progressPercent = total > 0 ? Math.min((reviewedCount / total) * 100, 100) : 0;
                    progressText.textContent = `${reviewedCount}/${total}`;
                    progressFill.style.width = `${progressPercent}%`;
                } else {
                    // 今天的单词进度
                    const stats = vocabulary.getStats();
                    const todayStudied = stats ? stats.todayStudied : 0;
                    const totalToday = result.total || 5;
                    const progressPercent = totalToday > 0 ? Math.min((todayStudied / totalToday) * 100, 100) : 0;
                    progressText.textContent = `${todayStudied}/${totalToday}`;
                    progressFill.style.width = `${progressPercent}%`;
                }
            }

            // 更新单词列表
            if (todayWordsContainer) {
                if (wordsToShow.length === 0) {
                    const loadError = vocabulary.getTodayLoadError();
                    let emptyIcon = '📖';
                    let emptyText = '今日暂无记单词';
                    
                    if (loadError === 'auth') {
                        emptyIcon = '🔐';
                        emptyText = '请先登录后查看记单词';
                    } else if (loadError === 'network') {
                        emptyIcon = '🌐';
                        emptyText = '网络连接失败，请检查网络后重试';
                    } else if (loadError) {
                        emptyIcon = '⚠️';
                        emptyText = '数据加载失败，请刷新页面重试';
                    } else if (vocabulary._todayCompleted || vocabulary._todayStudied >= 5) {
                        emptyIcon = '🎉';
                        emptyText = '今日已完成所有单词，明天再来！';
                    }
                    
                    todayWordsContainer.innerHTML = `
                        <div class="vocabulary-empty">
                            <span class="vocabulary-empty-icon">${emptyIcon}</span>
                            <div class="vocabulary-empty-text">${emptyText}</div>
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
        }
    });
})();