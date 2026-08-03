/**
 * 背单词UI模块 - 历史单词与成就徽章
 * 通过 Object.assign 将方法合并到全局 VocabularyAppMixin 聚合对象
 * 依赖：vocabulary.js (Vocabulary), audio.js
 */

(function () {
    Object.assign(VocabularyAppMixin, {
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
        }
    });
})();