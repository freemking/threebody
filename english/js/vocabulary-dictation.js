/**
 * 背单词UI模块 - 听写训练
 * 通过 Object.assign 将方法合并到全局 VocabularyAppMixin 聚合对象
 * 依赖：vocabulary.js (Vocabulary), audio.js, wrongbook.js
 */

(function () {
    Object.assign(VocabularyAppMixin, {
        /**
         * 开始听写训练
         */
        async startDictation() {
            // 获取听写范围
            const rangeBtn = document.querySelector('#dictation-training-module .config-option[data-range].active');
            const range = rangeBtn ? rangeBtn.dataset.range : 'today';

            // 获取间隔时间
            const intervalBtn = document.querySelector('.interval-option.active');
            this.dictationInterval = intervalBtn ? parseInt(intervalBtn.dataset.seconds, 10) * 1000 : 5000;

            // 获取播放次数（界面控件缺失时回退到已保存的系统设置）
            const savedSettings = this.getVocabularySettings();
            const playCountBtn = document.querySelector('.play-count-option.active');
            this.dictationPlayCount = playCountBtn
                ? (parseInt(playCountBtn.dataset.count, 10) || savedSettings.listeningPlayCount)
                : savedSettings.listeningPlayCount;

            // 获取提示设置
            const chineseHintEl = document.getElementById('show-chinese-hint');
            const firstLetterEl = document.getElementById('show-first-letter');
            this.dictationShowChinese = chineseHintEl ? chineseHintEl.checked : savedSettings.listeningShowChinese;
            this.dictationShowFirstLetter = firstLetterEl ? firstLetterEl.checked : savedSettings.listeningShowFirstLetter;

            // 获取单词（复制一份，避免后续刷新词库时影响本次听写队列）
            let words = (range === 'today' ? vocabulary.getTodayWords() : vocabulary.getUnmasteredWords()) || [];
            // 今日单词尚未加载时回退到未掌握词库，避免误判为"没有可听写的单词"
            if (words.length === 0 && range === 'today') {
                words = vocabulary.getUnmasteredWords() || [];
            }
            words = Array.isArray(words) ? words.slice() : [];

            if (words.length === 0) {
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
            this.dictationAnswers = []; // 每个单词的作答记录，防止重复计分
            this.dictationSubmitted = false;

            // 显示听写界面
            const dictationInterface = document.getElementById('dictation-interface');
            if (dictationInterface) {
                dictationInterface.classList.remove('hidden');
                dictationInterface.classList.add('active');
            }

            // 上一次听写的结算页可能还在显示，进入听写时先隐藏
            const resultInterface = document.getElementById('training-result');
            if (resultInterface) {
                resultInterface.classList.remove('active');
                resultInterface.classList.add('hidden');
            }

            // 设置事件
            const exitBtn = document.getElementById('btn-exit-dictation');
            if (exitBtn) exitBtn.onclick = () => this.exitDictation();

            const playBtn = document.getElementById('btn-dictation-play');
            if (playBtn) playBtn.onclick = () => this.playDictationWord();

            const submitBtn = document.getElementById('btn-dictation-submit');
            if (submitBtn) submitBtn.onclick = () => this.submitDictationAnswer();

            // 输入框回车键监听：未提交时提交，已提交时进入下一个
            const dictationInput = document.getElementById('dictation-input');
            if (dictationInput) {
                dictationInput.onkeydown = (e) => {
                    if (e.key !== 'Enter') return;
                    e.preventDefault();
                    // 阻止冒泡到全局 keydown，否则全局快捷键会再提交/推进一次
                    e.stopPropagation();
                    if (this.dictationSubmitted) {
                        this.nextDictationWord();
                    } else {
                        this.submitDictationAnswer();
                    }
                };
            }

            const prevBtn = document.getElementById('btn-dictation-prev');
            if (prevBtn) prevBtn.onclick = () => {
                if (this.dictationIndex > 0) {
                    this.dictationIndex--;
                    this.showDictationWord();
                }
            };

            // 「下一个」必须走统一流程，否则会跳过未作答的单词且不记录结果
            const nextBtn = document.getElementById('btn-dictation-next');
            if (nextBtn) nextBtn.onclick = () => this.nextDictationWord();

            const replayBtn = document.getElementById('btn-dictation-replay');
            if (replayBtn) replayBtn.onclick = () => this.playDictationWord();

            this.showDictationWord();
        },

        /**
         * 显示听写单词
         */
        showDictationWord() {
            const word = this.dictationWords[this.dictationIndex];
            if (!word) return;

            this._stopDictationTimer();

            // 更新进度
            const progressText = document.getElementById('dictation-progress-text');
            if (progressText) progressText.textContent = `${this.dictationIndex + 1}/${this.dictationWords.length}`;

            const answer = this.dictationAnswers[this.dictationIndex];
            this.dictationSubmitted = !!answer;

            // 输入框：已作答的单词回填答案并保持禁用，避免重复提交
            const input = document.getElementById('dictation-input');
            if (input) {
                input.classList.remove('correct', 'wrong', 'input-shake');
                input.disabled = !!answer;
                input.value = answer ? answer.userAnswer : '';
                if (!answer) input.focus();
            }

            // 更新提示（未作答显示辅助提示，已作答显示对错反馈）
            const hintEl = document.getElementById('dictation-hint');
            if (hintEl) {
                hintEl.textContent = answer
                    ? this._buildDictationFeedback(word, answer)
                    : this._buildDictationHint(word);
            }

            // 未作答的单词自动播放；已作答的交由"重播"按钮
            if (!answer) {
                this.playDictationWord();
            }
        },

        /**
         * 构造听写辅助提示
         */
        _buildDictationHint(word) {
            let hint = '';
            if (this.dictationShowChinese) hint += word.meaning || '';
            if (this.dictationShowFirstLetter) hint += ` (首字母: ${String(word.word || '').charAt(0)})`;
            return hint;
        },

        /**
         * 构造听写对错反馈
         */
        _buildDictationFeedback(word, answer) {
            return answer && answer.isCorrect
                ? '✓ 正确 - 按回车继续'
                : `✗ 错误 答案: ${word.word} - 按回车继续`;
        },

        /**
         * 播放听写单词（按"播放次数"设置自动复读，按"间隔时间"设置复读倒计时）
         */
        playDictationWord() {
            const word = this.dictationWords[this.dictationIndex];
            if (!word || !word.word) return;
            if (typeof audioManager === 'undefined' || typeof audioManager.speak !== 'function') return;

            this._stopDictationTimer();

            const playCount = Math.max(1, Number(this.dictationPlayCount) || 1);
            const interval = Math.max(1000, Number(this.dictationInterval) || 5000);
            let played = 0;

            const playOnce = () => {
                if (!this.dictationMode) return;
                audioManager.speak(word.word, 'en-US').catch(() => {});
                played++;
                if (played >= playCount) {
                    this._stopDictationTimer();
                    return;
                }
                this._startDictationTimer(interval, playOnce);
            };

            playOnce();
        },

        /**
         * 启动复读倒计时，并在界面显示剩余秒数
         * @param {number} interval 间隔毫秒数
         * @param {Function} onDone 倒计时结束后的回调
         */
        _startDictationTimer(interval, onDone) {
            this._stopDictationTimer();

            const timerEl = document.getElementById('dictation-timer');
            let remaining = Math.max(1, Math.round(interval / 1000));
            if (timerEl) {
                timerEl.style.display = '';
                timerEl.textContent = `${remaining}s`;
            }

            this._dictationTimerId = setInterval(() => {
                remaining--;
                if (remaining > 0) {
                    if (timerEl) timerEl.textContent = `${remaining}s`;
                    return;
                }
                this._stopDictationTimer();
                if (typeof onDone === 'function') onDone();
            }, 1000);
        },

        /**
         * 停止复读倒计时并隐藏倒计时显示
         */
        _stopDictationTimer() {
            if (this._dictationTimerId) {
                clearInterval(this._dictationTimerId);
                this._dictationTimerId = null;
            }
            const timerEl = document.getElementById('dictation-timer');
            if (timerEl) timerEl.style.display = 'none';
        },

        /**
         * 提交听写答案
         */
        submitDictationAnswer() {
            const word = this.dictationWords[this.dictationIndex];
            const input = document.getElementById('dictation-input');
            if (!word || !input) return;
            // 已作答的单词不允许重复提交，否则会重复计分/重复累加错误次数
            if (this.dictationSubmitted) return;
            if (this.dictationAnswers[this.dictationIndex]) return;

            const userAnswer = input.value.trim();
            if (!userAnswer) {
                input.classList.add('input-shake');
                setTimeout(() => input.classList.remove('input-shake'), 300);
                return;
            }

            const normalizedUserAnswer = userAnswer.toLowerCase().replace(/\s+/g, ' ');
            const normalizedCorrectAnswer = String(word.word || '').toLowerCase().replace(/\s+/g, ' ');
            const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;

            this.dictationAnswers[this.dictationIndex] = { userAnswer, isCorrect };
            this.dictationSubmitted = true;

            this._stopDictationTimer();
            input.disabled = true;
            input.classList.remove('correct', 'wrong', 'input-shake');
            input.classList.add(isCorrect ? 'correct' : 'wrong');

            // 记录学习统计（showDictationResult 只做展示，不重复写入）
            vocabulary.updateStudyStats(word.word, isCorrect).catch(err => console.error('更新学习统计失败:', err));

            // 复习昨天的单词时不写入今天的学习记录，否则今天的词表会变得和昨天一样
            if (!word.isYesterday) {
                vocabulary.studyWord(word.word, isCorrect, {
                    meaning: word.meaning,
                    phonetic: word.phonetic,
                    grade: word.grade,
                    unit: word.unit
                }).catch(err => console.error('记录学习结果失败:', err));
            }

            if (isCorrect) {
                this.dictationCorrect++;
            } else {
                this.dictationResults.push({ word, userAnswer });
                // 听写错词同样进入错题本
                if (typeof wrongBook !== 'undefined' && wrongBook.addWrongWord) {
                    wrongBook.addWrongWord({
                        word: word.word,
                        meaning: word.meaning,
                        phonetic: word.phonetic || '',
                        from: 'vocabulary-dictation'
                    }).catch(err => console.error('添加听写错词失败:', err));
                }
            }

            const hintEl = document.getElementById('dictation-hint');
            if (hintEl) hintEl.textContent = this._buildDictationFeedback(word, { userAnswer, isCorrect });
        },

        /**
         * 进入下一个听写单词（未作答时先提交当前单词）
         */
        nextDictationWord() {
            if (!this.dictationAnswers[this.dictationIndex]) {
                this.submitDictationAnswer();
                // 仍未作答（输入为空）时停留当前单词，等待用户输入
                if (!this.dictationAnswers[this.dictationIndex]) return;
            }

            this.dictationSubmitted = false;
            this.dictationIndex++;
            if (this.dictationIndex >= this.dictationWords.length) {
                this.showDictationResult();
            } else {
                this.showDictationWord();
            }
        },

        /**
         * 显示听写结果
         * 复用训练结算页的 DOM，但按听写的实际口径（每词 1 次作答）展示，不依赖三模式结果结构
         */
        async showDictationResult() {
            this._stopDictationTimer();
            this.dictationMode = false;

            const total = this.dictationWords.length;
            const correct = this.dictationAnswers.filter(item => item && item.isCorrect).length;
            const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
            const duration = Math.max(1, Math.round((Date.now() - this.dictationStartTime) / 60000));

            // 隐藏听写界面，显示结算页
            const dictationInterface = document.getElementById('dictation-interface');
            if (dictationInterface) {
                dictationInterface.classList.remove('active');
                dictationInterface.classList.add('hidden');
            }
            const resultInterface = document.getElementById('training-result');
            if (resultInterface) {
                resultInterface.classList.remove('hidden');
                resultInterface.classList.add('active');
            }

            const timeEl = document.getElementById('result-time');
            const newWordsEl = document.getElementById('result-new-words');
            const reviewWordsEl = document.getElementById('result-review-words');
            const accuracyEl = document.getElementById('result-accuracy');
            const resultTitle = document.querySelector('.result-title');

            if (timeEl) timeEl.textContent = `${duration}分钟`;
            if (newWordsEl) newWordsEl.textContent = `${correct}/${total}`;
            if (reviewWordsEl) reviewWordsEl.textContent = `${total - correct}个需复习`;
            if (accuracyEl) accuracyEl.textContent = `${accuracy}%`;
            if (resultTitle) resultTitle.textContent = `听写完成 - 答对 ${correct}/${total}`;

            // 错误单词列表
            const errorList = document.getElementById('error-words-list');
            if (errorList) {
                const wrongItems = this.dictationWords
                    .map((word, index) => ({ word, answer: this.dictationAnswers[index] }))
                    .filter(item => item.answer && !item.answer.isCorrect);

                if (wrongItems.length === 0) {
                    errorList.innerHTML = '<div style="color:var(--vb-text-muted)">全部答对，太棒了！</div>';
                } else {
                    errorList.innerHTML = `
                        <div class="error-section-title">听写错误的单词</div>
                        ${wrongItems.map(({ word, answer }) => `
                            <div class="error-word-item">
                                <div class="word">${this.escapeHtml(word.word)}</div>
                                <div class="meaning">你的答案：${this.escapeHtml(answer.userAnswer)}</div>
                            </div>
                        `).join('')}
                    `;
                }
            }

            // 按钮事件
            const viewErrorsBtn = document.getElementById('btn-view-errors');
            if (viewErrorsBtn) {
                viewErrorsBtn.onclick = async () => {
                    if (resultInterface) {
                        resultInterface.classList.remove('active');
                        resultInterface.classList.add('hidden');
                    }
                    await this.switchVocabularyModule('wrong-book');
                };
            }

            const practiceAgainBtn = document.getElementById('btn-practice-again');
            if (practiceAgainBtn) {
                practiceAgainBtn.onclick = () => {
                    if (resultInterface) {
                        resultInterface.classList.remove('active');
                        resultInterface.classList.add('hidden');
                    }
                    this.startDictation();
                };
            }

            const backHomeBtn = document.getElementById('btn-back-home');
            if (backHomeBtn) {
                backHomeBtn.onclick = () => {
                    if (resultInterface) {
                        resultInterface.classList.remove('active');
                        resultInterface.classList.add('hidden');
                    }
                    this.exitDictation();
                };
            }

            // 刷新数据，让列表与统计和本次听写结果保持一致
            try {
                await vocabulary.refresh();
            } catch (err) {
                console.error('刷新记单词数据失败:', err);
            }
            this.renderVocabularyList();
            this.updateVocabularyHeaderStats();
        },

        /**
         * 退出听写
         */
        exitDictation() {
            this.dictationMode = false;
            this._stopDictationTimer();

            const dictationInterface = document.getElementById('dictation-interface');
            if (dictationInterface) {
                dictationInterface.classList.remove('active');
                dictationInterface.classList.add('hidden');
            }
            this.renderVocabularyList();
            this.updateVocabularyHeaderStats();
        }
    });
})();