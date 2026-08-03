/**
 * 背单词UI模块 - 周末测验
 * 通过 Object.assign 将方法合并到全局 VocabularyAppMixin 聚合对象
 * 依赖：vocabulary.js (Vocabulary), audio.js
 */

(function () {
    Object.assign(VocabularyAppMixin, {
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
    });
})();