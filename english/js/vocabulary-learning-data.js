/**
 * 背单词UI模块 - 学习数据
 * 通过 Object.assign 将方法合并到全局 VocabularyAppMixin 聚合对象
 * 依赖：vocabulary.js (Vocabulary), wrongbook.js
 */

(function () {
    Object.assign(VocabularyAppMixin, {
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
        }
    });
})();