/**
 * 背单词UI模块 - 系统设置
 * 通过 Object.assign 将方法合并到全局 VocabularyAppMixin 聚合对象
 * 设置统一持久化到 localStorage（key: vocabulary_settings），进入记单词时自动应用
 */

(function () {
    const STORAGE_KEY = 'vocabulary_settings';

    const DEFAULT_SETTINGS = {
        theme: 'green',
        fontSize: 16,
        progressStyle: 'default',
        dailyWordCount: 5,
        newWordRatio: 70,
        listeningPlayCount: 2,
        listeningShowChinese: true,
        listeningShowFirstLetter: false,
        eyeProtection: true,
        dailyReminder: true
    };

    // 主题会修改的所有变量，切换前统一清理，避免残留上一主题的颜色
    const THEME_VARS = [
        '--vb-bg-primary', '--vb-bg-card', '--vb-bg-card-hover', '--vb-bg-card-mastered',
        '--vb-surface-rgb', '--vb-line-rgb',
        '--vb-text-primary', '--vb-text-secondary', '--vb-text-muted', '--vb-text-accent',
        '--vb-on-primary', '--vb-border', '--vb-border-mastered',
        '--vb-shadow', '--vb-shadow-hover',
        '--vb-primary', '--vb-primary-rgb', '--vb-primary-light', '--vb-primary-dark',
        '--vb-accent', '--vb-accent-rgb', '--vb-accent-dark', '--vb-accent-light',
        '--vb-success', '--vb-success-rgb', '--vb-success-dark', '--vb-success-light',
        '--vb-danger', '--vb-danger-rgb', '--vb-danger-dark', '--vb-danger-light',
        '--vb-warning', '--vb-warning-rgb', '--vb-purple', '--vb-purple-rgb'
    ];

    Object.assign(VocabularyAppMixin, {
        /**
         * 读取已保存的设置（缺失字段用默认值补齐）
         */
        getVocabularySettings() {
            const settings = { ...DEFAULT_SETTINGS };
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                if (raw) {
                    const saved = JSON.parse(raw);
                    if (saved && typeof saved === 'object') Object.assign(settings, saved);
                }
            } catch (error) {
                console.warn('读取记单词设置失败:', error);
            }
            // 已移除的「明亮」主题旧值迁移为护眼绿，避免按钮无选中态
            if (settings.theme === 'light') settings.theme = 'green';
            return settings;
        },

        /**
         * 保存设置并立即应用
         */
        saveVocabularySettings(patch = {}) {
            const settings = { ...this.getVocabularySettings(), ...patch };
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
            } catch (error) {
                console.warn('保存记单词设置失败:', error);
            }
            this.applyVocabularySettings(settings);
            return settings;
        },

        /**
         * 将设置应用到界面（进入记单词时调用）
         */
        applyVocabularySettings(settings = null) {
            const s = settings || this.getVocabularySettings();
            const screen = document.getElementById('vocabulary-screen');

            // 主题变量必须挂在记单词容器上，不能污染整个应用
            this.applyTheme(s.theme || 'green');
            if (!screen) return;

            // 字号
            const fontSize = Math.min(20, Math.max(12, Number(s.fontSize) || 16));
            screen.style.fontSize = `${fontSize}px`;
            const fontSizeSlider = document.getElementById('font-size-slider');
            const fontSizeValue = document.getElementById('font-size-value');
            if (fontSizeSlider) fontSizeSlider.value = String(fontSize);
            if (fontSizeValue) fontSizeValue.textContent = `${fontSize}px`;

            // 主题按钮高亮
            document.querySelectorAll('.theme-option').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.theme === (s.theme || 'green'));
            });

            // 进度条样式
            const progressStyle = document.getElementById('progress-style');
            if (progressStyle) progressStyle.value = s.progressStyle || 'default';

            // 每天学习单词数量
            const dailyCount = Math.min(20, Math.max(5, Number(s.dailyWordCount) || 5));
            const dailySlider = document.getElementById('daily-word-count');
            const dailyValue = document.getElementById('daily-word-count-value');
            if (dailySlider) dailySlider.value = String(dailyCount);
            if (dailyValue) dailyValue.textContent = String(dailyCount);

            // 新词比例
            const ratio = Math.min(100, Math.max(0, Number(s.newWordRatio) || 70));
            const ratioSlider = document.getElementById('new-word-ratio');
            const ratioValue = document.getElementById('new-ratio-value');
            const reviewValue = document.getElementById('review-ratio-value');
            if (ratioSlider) ratioSlider.value = String(ratio);
            if (ratioValue) ratioValue.textContent = String(ratio);
            if (reviewValue) reviewValue.textContent = String(100 - ratio);

            // 听写高级设置
            const playCount = Math.min(3, Math.max(1, Number(s.listeningPlayCount) || 2));
            document.querySelectorAll('[data-setting="listening-play-count"]').forEach(btn => {
                btn.classList.toggle('active', String(btn.dataset.value) === String(playCount));
            });

            const chineseHint = document.getElementById('listening-show-chinese-hint');
            if (chineseHint) chineseHint.checked = !!s.listeningShowChinese;
            const firstLetter = document.getElementById('listening-show-first-letter');
            if (firstLetter) firstLetter.checked = !!s.listeningShowFirstLetter;

            // 提醒开关
            const eyeProtection = document.getElementById('eye-protection');
            if (eyeProtection) eyeProtection.checked = !!s.eyeProtection;
            if (s.eyeProtection) {
                this.startEyeProtectionTimer();
            } else {
                this.stopEyeProtectionTimer();
            }

            const dailyReminder = document.getElementById('daily-reminder');
            if (dailyReminder) dailyReminder.checked = !!s.dailyReminder;
        },

        /**
         * 设置系统设置面板的事件监听
         */
        setupSettingsListeners() {
            // 主题切换
            document.querySelectorAll('.theme-option').forEach(btn => {
                btn.onclick = (e) => {
                    const target = e.currentTarget;
                    const theme = target.dataset.theme;
                    this.saveVocabularySettings({ theme });
                    this.showVocabularyNotification(`主题已切换为: ${target.textContent}`, 'success');
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
                fontSizeSlider.onchange = (e) => {
                    this.saveVocabularySettings({ fontSize: parseInt(e.target.value, 10) || 16 });
                };
            }

            // 进度条样式
            const progressStyle = document.getElementById('progress-style');
            if (progressStyle) {
                progressStyle.onchange = (e) => {
                    this.saveVocabularySettings({ progressStyle: e.target.value });
                    this.showVocabularyNotification('进度条样式已更新', 'success');
                };
            }

            // 护眼提醒
            const eyeProtection = document.getElementById('eye-protection');
            if (eyeProtection) {
                eyeProtection.onchange = (e) => {
                    this.saveVocabularySettings({ eyeProtection: e.target.checked });
                    this.showVocabularyNotification(
                        e.target.checked ? '护眼提醒已开启' : '护眼提醒已关闭',
                        e.target.checked ? 'success' : 'info'
                    );
                };
            }

            // 每日目标提醒
            const dailyReminder = document.getElementById('daily-reminder');
            if (dailyReminder) {
                dailyReminder.onchange = (e) => {
                    this.saveVocabularySettings({ dailyReminder: e.target.checked });
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
                    const newRatio = parseInt(e.target.value, 10) || 0;
                    const newValue = document.getElementById('new-ratio-value');
                    const reviewValue = document.getElementById('review-ratio-value');
                    if (newValue) newValue.textContent = newRatio;
                    if (reviewValue) reviewValue.textContent = 100 - newRatio;
                };
                ratioSlider.onchange = (e) => {
                    this.saveVocabularySettings({ newWordRatio: parseInt(e.target.value, 10) || 0 });
                    this.showVocabularyNotification(`新词比例已设置为${e.target.value}%`, 'success');
                };
            }

            // 每天学习单词数量滑块
            const dailyWordCountSlider = document.getElementById('daily-word-count');
            if (dailyWordCountSlider) {
                dailyWordCountSlider.oninput = (e) => {
                    const value = document.getElementById('daily-word-count-value');
                    if (value) value.textContent = e.target.value;
                };
                dailyWordCountSlider.onchange = (e) => {
                    this.saveVocabularySettings({ dailyWordCount: parseInt(e.target.value, 10) || 5 });
                    this.showVocabularyNotification(`每天学习单词数量已设置为${e.target.value}个`, 'success');
                };
            }

            // 听写高级设置：播放次数
            document.querySelectorAll('[data-setting="listening-play-count"]').forEach(btn => {
                btn.onclick = (e) => {
                    const target = e.currentTarget;
                    this.saveVocabularySettings({ listeningPlayCount: parseInt(target.dataset.value, 10) || 2 });
                    this.showVocabularyNotification(`播放次数已设置为${target.dataset.value}次`, 'success');
                };
            });

            // 听写高级设置：显示中文释义 / 首字母
            const chineseHint = document.getElementById('listening-show-chinese-hint');
            if (chineseHint) {
                chineseHint.onchange = (e) => {
                    this.saveVocabularySettings({ listeningShowChinese: e.target.checked });
                };
            }
            const firstLetter = document.getElementById('listening-show-first-letter');
            if (firstLetter) {
                firstLetter.onchange = (e) => {
                    this.saveVocabularySettings({ listeningShowFirstLetter: e.target.checked });
                };
            }

            // 同步界面控件为已保存的值
            this.applyVocabularySettings();
        },

        /**
         * 应用主题（只作用于记单词容器）
         */
        applyTheme(theme) {
            const screen = document.getElementById('vocabulary-screen');
            if (!screen) return;

            // 兼容已移除的「明亮」主题旧值
            if (theme === 'light') theme = 'green';

            const style = screen.style;
            THEME_VARS.forEach(name => style.removeProperty(name));

            // green 为默认主题，清空变量即恢复 :root 的护眼绿配色
            if (theme === 'green') return;

            // dark：柔和夜间主题，保留足够对比度
            style.setProperty('--vb-bg-primary', 'linear-gradient(135deg, #12203A 0%, #1D2C46 50%, #12203A 100%)');
            style.setProperty('--vb-bg-card', 'rgba(255, 255, 255, 0.07)');
            style.setProperty('--vb-bg-card-hover', 'rgba(255, 255, 255, 0.12)');
            style.setProperty('--vb-bg-card-mastered', 'rgba(74, 222, 128, 0.12)');
            style.setProperty('--vb-surface-rgb', '18, 32, 58');
            style.setProperty('--vb-line-rgb', '255, 255, 255');
            style.setProperty('--vb-text-primary', '#EAF2FF');
            style.setProperty('--vb-text-secondary', 'rgba(234, 242, 255, 0.88)');
            style.setProperty('--vb-text-muted', 'rgba(198, 214, 238, 0.68)');
            style.setProperty('--vb-text-accent', '#93C5FD');
            style.setProperty('--vb-border', 'rgba(147, 197, 253, 0.2)');
            style.setProperty('--vb-border-mastered', 'rgba(74, 222, 128, 0.45)');
            style.setProperty('--vb-shadow', '0 6px 20px rgba(0, 0, 0, 0.28)');
            style.setProperty('--vb-shadow-hover', '0 12px 30px rgba(0, 0, 0, 0.38)');
            style.setProperty('--vb-primary', '#4F8DF7');
            style.setProperty('--vb-primary-rgb', '79, 141, 247');
            style.setProperty('--vb-primary-light', '#BFDBFE');
            style.setProperty('--vb-primary-dark', '#2563EB');
            style.setProperty('--vb-accent', '#FBBF24');
            style.setProperty('--vb-accent-rgb', '251, 191, 36');
            style.setProperty('--vb-accent-dark', '#F59E0B');
            style.setProperty('--vb-accent-light', '#FDE68A');
            style.setProperty('--vb-success', '#4ADE80');
            style.setProperty('--vb-success-rgb', '74, 222, 128');
            style.setProperty('--vb-success-dark', '#22C55E');
            style.setProperty('--vb-success-light', '#86EFAC');
            style.setProperty('--vb-danger', '#F87171');
            style.setProperty('--vb-danger-rgb', '248, 113, 113');
            style.setProperty('--vb-danger-dark', '#EF4444');
            style.setProperty('--vb-danger-light', '#FCA5A5');
        },

        /**
         * 启动护眼提醒
         */
        startEyeProtectionTimer() {
            if (this._eyeProtectionTimer) return; // 已启动则不重复计时
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