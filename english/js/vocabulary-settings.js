/**
 * 背单词UI模块 - 系统设置
 * 通过 Object.assign 将方法合并到全局 VocabularyAppMixin 聚合对象
 */

(function () {
    Object.assign(VocabularyAppMixin, {
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
        }
    });
})();