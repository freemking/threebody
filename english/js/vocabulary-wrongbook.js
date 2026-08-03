/**
 * 背单词UI模块 - 错题本（单词库）
 * 通过 Object.assign 将方法合并到全局 VocabularyAppMixin 聚合对象
 * 依赖：vocabulary.js (Vocabulary), wrongbook.js, audio.js
 */

(function () {
    Object.assign(VocabularyAppMixin, {
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
            a.download = `单词库_${vocabulary._getLocalDateStr()}.tsv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            this.showVocabularyNotification('单词库已导出', 'success');
        }
    });
})();