/**
 * 背单词UI模块 - 听写训练
 * 通过 Object.assign 将方法合并到全局 VocabularyAppMixin 聚合对象
 * 依赖：vocabulary.js (Vocabulary), audio.js
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
        }
    });
})();