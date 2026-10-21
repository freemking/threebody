/**
 * 背单词UI模块 - 多模式训练
 * 通过 Object.assign 将方法合并到全局 VocabularyAppMixin 聚合对象
 * 依赖：vocabulary.js (Vocabulary), wrongbook.js, audio.js
 */

(function () {
    Object.assign(VocabularyAppMixin, {
        /**
         * 开始训练（根据配置选择模式）
         */
        async startTraining() {
            // 获取听写高级设置（优先读界面控件，缺失时回退到已保存设置）
            const listeningInterval = 5000; // 固定5秒间隔
            const savedSettings = this.getVocabularySettings();
            let listeningPlayCount = savedSettings.listeningPlayCount;
            let listeningShowChinese = savedSettings.listeningShowChinese;
            let listeningShowFirstLetter = savedSettings.listeningShowFirstLetter;

            const playCountBtn = document.querySelector('[data-setting="listening-play-count"].active');
            if (playCountBtn) {
                const value = parseInt(playCountBtn.dataset.value, 10);
                if (!Number.isNaN(value)) listeningPlayCount = value;
            }

            const chineseHintEl = document.getElementById('listening-show-chinese-hint');
            if (chineseHintEl) listeningShowChinese = chineseHintEl.checked;
            const firstLetterEl = document.getElementById('listening-show-first-letter');
            if (firstLetterEl) listeningShowFirstLetter = firstLetterEl.checked;

            // 读取每天学习单词数量设置
            const totalWords = parseInt(
                document.getElementById('daily-word-count')?.value || savedSettings.dailyWordCount
            );

            // 统一从 /today 端点获取训练单词（后端已按阶段返回：复习昨天的 或 今天的新词）
            await vocabulary._loadTodayWords();
            const result = vocabulary._todayResult || {};
            let words = vocabulary.getTodayWords() || [];

            // 提示
            if (result.phase === 'review_yesterday' && words.length > 0) {
                this.showVocabularyNotification('请先完成昨天的单词训练', 'info');
            } else if (!words || words.length === 0) {
                // 今日单词为空。若今天还没有任何记录（尚未开始），优先调用 /complete-review
                // 生成"从未学过"的新词，避免直接用错题本随机兜底而抽到旧词。
                // 仅在 /today 请求成功（无加载错误）时才触发，防止网络/登录异常时误写数据。
                const todayNotStarted = !vocabulary._todayLoadError &&
                    (result.studied || 0) === 0 && (result.total || 0) === 0;
                if (todayNotStarted) {
                    console.log('今日尚无记录，调用 /complete-review 生成今日新词');
                    await vocabulary.completeReview();
                    await vocabulary._loadTodayWords();
                    words = vocabulary.getTodayWords() || [];
                }
                // 仍然为空（如错题本已无"从未学过"的词，或今日已完成），再用错题本未掌握词随机兜底
                if (!words || words.length === 0) {
                    console.log('今日单词仍为空，使用错题本未掌握词随机兜底');
                    const unmasteredWords = wrongBook.getUnmasteredWords();
                    words = unmasteredWords
                        .sort(() => Math.random() - 0.5)
                        .slice(0, totalWords)
                        .map(w => ({
                            word: w.word,
                            meaning: w.meaning,
                            phonetic: w.phonetic || ''
                        }));
                }
            } else {
                console.log(`使用今日单词进行训练: ${words.length} 个单词`);
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
            this.trainingTransitioning = false; // 模式切换中，防止重复点击"下一个"
            if (this._trainingTransitionTimer) {
                clearTimeout(this._trainingTransitionTimer);
                this._trainingTransitionTimer = null;
            }
            this._speakToken = (this._speakToken || 0) + 1; // 终止上一次未完成的重复播放

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
            if (!this.trainingWordResults) this.trainingWordResults = {};
            if (!this.trainingWordResults[word]) {
                this.trainingWordResults[word] = {};
            }

            const bucket = this.trainingMultiModeResults && this.trainingMultiModeResults[mode];
            const previous = this.trainingWordResults[word][mode];

            // 幂等：同词同模式重复作答（如点"上一个"回去重答）时，先撤销上一次的统计
            if (previous !== undefined && bucket) {
                if (previous) {
                    bucket.correct = Math.max(0, bucket.correct - 1);
                    this.trainingCorrect = Math.max(0, (this.trainingCorrect || 0) - 1);
                } else {
                    const idx = bucket.errors.indexOf(word);
                    if (idx !== -1) bucket.errors.splice(idx, 1);
                }
            }

            this.trainingWordResults[word][mode] = isCorrect;

            // 更新模式结果统计
            if (bucket) {
                if (isCorrect) {
                    bucket.correct++;
                } else if (!bucket.errors.includes(word)) {
                    bucket.errors.push(word);
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
         * HTML 转义，避免释义中的引号/尖括号破坏模板
         */
        escapeHtml(value) {
            return String(value == null ? '' : value)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        },

        /**
         * 构建认读模式选项：1 个正确释义 + 最多 3 个干扰释义
         * 干扰项优先取错题本（难度贴近当前学习内容），不足时用 data.js 完整词库补齐；
         * 按释义去重，避免出现两个相同选项
         */
        buildRecognitionOptions(word) {
            const correctMeaning = String(word && word.meaning ? word.meaning : '').trim();
            const correctWord = String(word && word.word ? word.word : '').toLowerCase();
            const seen = new Set([correctMeaning.toLowerCase()]);
            const candidates = [];

            const collect = (list) => {
                (list || []).forEach(item => {
                    if (!item) return;
                    const itemWord = String(item.word || '').toLowerCase();
                    const meaning = String(item.meaning || '').trim();
                    if (!meaning || itemWord === correctWord) return;
                    const key = meaning.toLowerCase();
                    if (seen.has(key)) return;
                    seen.add(key);
                    candidates.push(meaning);
                });
            };

            // 1. 错题本词库
            collect(vocabulary.getAll());

            // 2. 完整词库兜底（词库为空时重新读取，避免首次加载未完成导致长期无干扰项）
            if (candidates.length < 3 && typeof wordData !== 'undefined' && wordData && typeof wordData.getWordsByGrade === 'function') {
                try {
                    if (!Array.isArray(this._meaningPool) || this._meaningPool.length === 0) {
                        this._meaningPool = wordData.getWordsByGrade('all') || [];
                    }
                    collect(this._meaningPool);
                } catch (err) {
                    console.warn('构建认读选项时读取词库失败:', err);
                }
            }

            const distractors = candidates.sort(() => Math.random() - 0.5).slice(0, 3);
            return [correctMeaning, ...distractors].sort(() => Math.random() - 0.5);
        },

        /**
         * 认读模式渲染
         */
        renderRecognitionMode(word, container, reviewBadge = '') {
            const options = this.buildRecognitionOptions(word);
            const esc = (value) => this.escapeHtml(value);

            container.innerHTML = `
                <div class="recognition-card">
                    ${reviewBadge}
                    <div class="recognition-word" id="training-word">${esc(word.word)}</div>
                    <div class="recognition-phonetic">${esc(word.phonetic || '')}</div>
                    <div class="recognition-options" id="training-options">
                        ${options.map((opt, i) => `
                            <button class="recognition-option" data-meaning="${esc(opt)}" data-index="${i}">
                                <span class="option-key">${i + 1}</span>
                                ${esc(opt)}
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
            // 两侧都 trim 后比较，避免释义首尾空格导致误判
            const isCorrect = String(selectedMeaning || '').trim() === String(word.meaning || '').trim();

            // 先记录多模式训练结果（同步操作，确保结果立即记录）
            this.recordWordResult(word.word, 'recognition', isCorrect);

            // 记录学习统计（异步操作，studyWord 统一在 showTrainingResult 中调用）
            vocabulary.updateStudyStats(word.word, isCorrect).catch(err => console.error('更新学习统计失败:', err));

            if (isCorrect) {
                this.trainingCorrect++;
                btn.classList.add('correct');
                this.showVocabularyNotification('正确！', 'success');
            } else {
                btn.classList.add('wrong');
                // 高亮正确选项
                document.querySelectorAll('.recognition-option').forEach(b => {
                    if (String(b.dataset.meaning || '').trim() === String(word.meaning || '').trim()) {
                        b.classList.add('correct');
                    }
                });
                this.showVocabularyNotification('错误！', 'error');
                this.trainingErrors.push(word);

                // 自动添加到错题本
                wrongBook.addWrongWord({
                    word: word.word,
                    meaning: word.meaning,
                    phonetic: word.phonetic || '',
                    from: 'vocabulary-recognition'
                });
            }

            // 显示单词详情
            const detail = document.getElementById('recognition-detail');
            if (detail) {
                detail.style.display = 'block';
                detail.innerHTML = `
                    <div class="detail-meaning">${this.escapeHtml(word.meaning)}</div>
                    <div class="detail-phonetic">${this.escapeHtml(word.phonetic || '')}</div>
                    ${word.example ? `<div class="detail-example">"${this.escapeHtml(word.example)}"</div>` : ''}
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

            // 记录学习统计（异步操作，studyWord 统一在 showTrainingResult 中调用）
            vocabulary.updateStudyStats(word.word, isCorrect).catch(err => console.error('更新学习统计失败:', err));

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
                    from: 'vocabulary-spelling'
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

            // 提示区：按系统设置决定是否默认显示中文释义 / 首字母
            const hintEl = document.getElementById('listening-hint');
            const renderHints = (full = false) => {
                const parts = [];
                if (full || this.listeningShowChinese) parts.push(word.meaning || '');
                if (full || this.listeningShowFirstLetter) parts.push(`首字母: ${word.word[0]}`);
                if (hintEl) hintEl.textContent = parts.filter(Boolean).join(' · ');
            };
            renderHints(false);

            const hintBtn = document.getElementById('btn-listening-hint');
            if (hintBtn) {
                hintBtn.onclick = () => {
                    renderHints(true);
                    hintBtn.textContent = '已显示提示';
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

            // 记录学习统计（异步操作，studyWord 统一在 showTrainingResult 中调用）
            vocabulary.updateStudyStats(word.word, isCorrect).catch(err => console.error('更新学习统计失败:', err));

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
                    from: 'vocabulary-listening'
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
            // 听音模式按「播放次数」设置重复朗读
            const times = this.trainingMode === 'listening'
                ? Math.max(1, parseInt(this.listeningPlayCount, 10) || 1)
                : 1;
            this._playTrainingWordRepeated(times);
        },

        /**
         * 重复播放当前单词发音（串行，避免前一次朗读被打断）
         */
        async _playTrainingWordRepeated(times = 1) {
            const word = this.trainingWords[this.trainingIndex];
            if (!word) return;

            // 通过 token 让切换单词后立刻终止尚未完成的重复播放
            const token = (this._speakToken = (this._speakToken || 0) + 1);
            const speakOnce = () => {
                if (typeof audioManager === 'undefined' || !audioManager.speak) {
                    return Promise.resolve();
                }
                return Promise.resolve(audioManager.speak(word.word, 'en-US')).catch(() => {});
            };

            for (let i = 0; i < times; i++) {
                if (this._speakToken !== token) return;
                await speakOnce();
                if (this._speakToken !== token) return;
                if (i < times - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
        },

        /**
         * 下一个训练单词
         */
        async nextTrainingWord() {
            // 模式切换动画期间忽略重复点击，否则会多加一次 trainingIndex 跳过首个单词
            if (this.trainingTransitioning) return;

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

                    // 切换期间锁住"下一个"按钮
                    this.trainingTransitioning = true;
                    const nextBtn = document.getElementById('btn-training-next');
                    if (nextBtn) nextBtn.disabled = true;

                    // 显示第一个单词
                    this._trainingTransitionTimer = setTimeout(() => {
                        this._trainingTransitionTimer = null;
                        this.trainingTransitioning = false;
                        this.showTrainingWord();
                    }, 500);
                } else {
                    // 所有模式完成，显示结果（加锁避免重复提交学习记录）
                    this.trainingTransitioning = true;
                    try {
                        await this.showTrainingResult();
                    } finally {
                        this.trainingTransitioning = false;
                    }
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
            this.trainingTransitioning = false;
            this._speakToken = (this._speakToken || 0) + 1; // 终止未完成的重复播放
            if (this._trainingTransitionTimer) {
                clearTimeout(this._trainingTransitionTimer);
                this._trainingTransitionTimer = null;
            }
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

            // 昨天的日期。复习昨天的单词时，学习记录必须写到昨天的日期上，
            // 否则会在今天生成一批和昨天相同的记录，导致"今天的单词和昨天一样"
            const yesterdayDate = new Date();
            yesterdayDate.setDate(yesterdayDate.getDate() - 1);
            const yesterdayStr = vocabulary._getLocalDateStr(yesterdayDate);

            // 自动将完全掌握的单词标记为已记住
            // 复习昨天的单词时写到昨天的记录，避免在今天生成重复记录
            for (const word of fullyMasteredWords) {
                const wordData = this.trainingWords.find(w => w.word === word);
                const targetDate = (wordData && wordData.isYesterday) ? yesterdayStr : null;
                await vocabulary.toggleRemembered(word, true, targetDate);
            }

            // 统一记录每个单词的学习结果（用3种模式的综合结果，避免竞态条件）
            for (const wordData of this.trainingWords) {
                // 复习昨天的单词时不写入今天的学习记录，否则今天的词表会变得和昨天一样
                if (wordData.isYesterday) continue;
                const word = wordData.word;
                const modes = this.trainingWordResults[word];
                if (!modes) continue;
                const hasAllModes = modes.recognition !== undefined && modes.spelling !== undefined && modes.listening !== undefined;
                const allCorrect = hasAllModes && modes.recognition && modes.spelling && modes.listening;
                try {
                    await vocabulary.studyWord(word, allCorrect, {
                        meaning: wordData.meaning,
                        phonetic: wordData.phonetic,
                        grade: wordData.grade,
                        unit: wordData.unit
                    });
                } catch (err) {
                    console.error('记录学习结果失败:', word, err);
                }
            }

            // 将"3种模式全对"的昨天单词逐个标记为已复习（只有真正完成的单词才标记 reviewed=1）。
            // 没全对的词保持 reviewed=0，会继续留在复习阶段，直到全部复习通过才推进。
            for (const word of fullyMasteredWords) {
                const wordData = this.trainingWords.find(w => w.word === word);
                if (wordData && wordData.isYesterday) {
                    try {
                        await vocabulary.markAsReviewed(word, yesterdayStr);
                    } catch (err) {
                        console.error('标记复习状态失败:', err);
                    }
                }
            }

            // 标记完成后调用 /complete-review 尝试推进：
            // 后端仅在昨天的单词全部 reviewed=1 时，才为今天插入"从未学过"的新单词；
            // 若还有单词未全对（reviewed=0），则不推进，这些词会在下次 /today 复习阶段继续出现。
            const hasYesterdayWords = this.trainingWords.some(w => w.isYesterday);
            if (hasYesterdayWords) {
                await vocabulary.completeReview();
            }

            // 重新加载今日单词列表（后端会根据昨天是否全部 reviewed 切换到今天的新词阶段）
            await vocabulary._loadTodayWords();

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
        }
    });
})();