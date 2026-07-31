// 字母组合测验专用控制器

class CombinationsQuiz {
    constructor() {
        this.currentQuiz = null;
        this.startTime = null;
        this.timer = null;
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // 测验类型选择
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('quiz-type-btn')) {
                this.handleQuizTypeSelection(e.target);
            }
        });

        // 测验范围选择
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('quiz-scope-btn')) {
                this.handleScopeSelection(e.target);
            }
        });

        // 测验题目选项
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('quiz-option')) {
                this.handleOptionClick(e.target);
            }
        });

        // 测验控制按钮
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('quiz-control-btn')) {
                this.handleControlButton(e.target);
            }
        });
    }

    handleQuizTypeSelection(element) {
        const quizType = element.dataset.quizType;
        if (!quizType) return;

        // 更新UI
        document.querySelectorAll('.quiz-type-btn').forEach(btn => btn.classList.remove('active'));
        element.classList.add('active');

        // 显示范围选择
        this.showScopeSelection(quizType);
    }

    showScopeSelection(quizType) {
        const scopeContainer = document.getElementById('quiz-scope');
        if (!scopeContainer) return;

        let html = '<h4>选择测验范围</h4><div class="scope-options">';
        
        if (quizType === '随堂小测') {
            html += '<p>请选择要测验的字母组合：</p>';
            html += '<select id="combination-select" class="form-control">';
            html += '<option value="">选择字母组合</option>';
            // 这里需要动态加载组合选项
            html += '</select>';
        } else if (quizType === '单元专项测') {
            html += `
                <button class="quiz-scope-btn" data-scope="元音组合">元音组合</button>
                <button class="quiz-scope-btn" data-scope="辅音组合">辅音组合</button>
                <button class="quiz-scope-btn" data-scope="后缀">后缀</button>
                <button class="quiz-scope-btn" data-scope="前缀">前缀</button>
            `;
        } else if (quizType === '综合结业测') {
            html += '<p>将从所有字母组合中随机出题</p>';
            html += '<button class="quiz-scope-btn" data-scope="综合">开始综合测验</button>';
        }

        html += '</div>';
        scopeContainer.innerHTML = html;
        scopeContainer.style.display = 'block';
    }

    handleScopeSelection(element) {
        const scope = element.dataset.scope;
        if (!scope) return;

        // 更新UI
        document.querySelectorAll('.quiz-scope-btn').forEach(btn => btn.classList.remove('active'));
        element.classList.add('active');

        // 获取选中的测验类型
        const activeType = document.querySelector('.quiz-type-btn.active');
        if (!activeType) return;

        const quizType = activeType.dataset.quizType;
        this.startQuiz(quizType, scope);
    }

    async startQuiz(quizType, scope) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('请先登录');
                return;
            }

            // 显示加载状态
            this.showLoading();

            let url = `/api/combinations/quiz?type=${encodeURIComponent(quizType)}&count=5`;
            if (scope && scope !== '综合') {
                url += `&category=${encodeURIComponent(scope)}`;
            }

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                this.currentQuiz = {
                    quizType,
                    scope: scope || '综合',
                    questions: data.data.questions,
                    currentIndex: 0,
                    answers: {},
                    startTime: Date.now(),
                    timeSpent: 0
                };

                this.renderQuiz();
                this.startTimer();
            } else {
                alert('获取测验题目失败');
            }
        } catch (error) {
            console.error('开始测验失败:', error);
            alert('开始测验失败，请稍后重试');
        }
    }

    renderQuiz() {
        const container = document.getElementById('quiz-container');
        if (!container || !this.currentQuiz) return;

        const question = this.currentQuiz.questions[this.currentQuiz.currentIndex];
        const answered = this.currentQuiz.answers[this.currentQuiz.currentIndex] !== undefined;
        const isLast = this.currentQuiz.currentIndex === this.currentQuiz.questions.length - 1;

        container.innerHTML = `
            <div class="quiz-header">
                <h3>${this.currentQuiz.quizType} - ${this.currentQuiz.scope}</h3>
                <div class="quiz-info">
                    <span>题目 ${this.currentQuiz.currentIndex + 1} / ${this.currentQuiz.questions.length}</span>
                    <span>用时: <span id="quiz-timer">0</span>秒</span>
                </div>
            </div>

            <div class="quiz-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${((this.currentQuiz.currentIndex + 1) / this.currentQuiz.questions.length * 100).toFixed(1)}%"></div>
                </div>
            </div>

            <div class="quiz-question">
                <h4>${question.questionText}</h4>
                <div class="quiz-options">
                    ${question.options.map((option, index) => `
                        <div class="quiz-option ${answered ? (option === question.correctAnswer ? 'correct' : (option === this.currentQuiz.answers[this.currentQuiz.currentIndex] ? 'wrong' : '')) : ''}" 
                             data-index="${index}" 
                             data-value="${option}">
                            <span class="option-letter">${String.fromCharCode(65 + index)}</span>
                            <span class="option-text">${option}</span>
                        </div>
                    `).join('')}
                </div>
                ${answered ? `
                    <div class="quiz-explanation">
                        <strong>解析：</strong>${question.explanation}
                    </div>
                ` : ''}
            </div>

            <div class="quiz-controls">
                <button class="quiz-control-btn secondary" data-action="prev" ${this.currentQuiz.currentIndex === 0 ? 'disabled' : ''}>上一题</button>
                <button class="quiz-control-btn primary" data-action="${isLast ? 'submit' : 'next'}">
                    ${isLast ? '提交测验' : '下一题'}
                </button>
            </div>
        `;
    }

    handleOptionClick(element) {
        if (!this.currentQuiz) return;

        const currentIndex = this.currentQuiz.currentIndex;
        if (this.currentQuiz.answers[currentIndex] !== undefined) return;

        const selectedValue = element.dataset.value;
        const question = this.currentQuiz.questions[currentIndex];

        this.currentQuiz.answers[currentIndex] = selectedValue;

        // 标记选项
        const options = document.querySelectorAll('.quiz-option');
        options.forEach(opt => {
            if (opt.dataset.value === question.correctAnswer) {
                opt.classList.add('correct');
            } else if (opt.dataset.value === selectedValue && selectedValue !== question.correctAnswer) {
                opt.classList.add('wrong');
            }
        });

        // 延迟显示解析
        setTimeout(() => {
            this.renderQuiz();
        }, 500);
    }

    handleControlButton(element) {
        const action = element.dataset.action;
        if (!action || !this.currentQuiz) return;

        switch (action) {
            case 'next':
                this.nextQuestion();
                break;
            case 'prev':
                this.prevQuestion();
                break;
            case 'submit':
                this.submitQuiz();
                break;
        }
    }

    nextQuestion() {
        if (!this.currentQuiz) return;

        const currentIndex = this.currentQuiz.currentIndex;
        if (this.currentQuiz.answers[currentIndex] === undefined) {
            alert('请先选择答案');
            return;
        }

        if (currentIndex < this.currentQuiz.questions.length - 1) {
            this.currentQuiz.currentIndex++;
            this.renderQuiz();
        }
    }

    prevQuestion() {
        if (!this.currentQuiz || this.currentQuiz.currentIndex === 0) return;
        this.currentQuiz.currentIndex--;
        this.renderQuiz();
    }

    async submitQuiz() {
        if (!this.currentQuiz) return;

        // 检查是否所有题目都已回答
        const unanswered = this.currentQuiz.questions.length - Object.keys(this.currentQuiz.answers).length;
        if (unanswered > 0) {
            if (!confirm(`还有 ${unanswered} 道题未回答，确定要提交吗？`)) {
                return;
            }
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            this.stopTimer();
            this.currentQuiz.timeSpent = Math.floor((Date.now() - this.currentQuiz.startTime) / 1000);

            const response = await fetch('/api/combinations/quiz', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    quizType: this.currentQuiz.quizType,
                    category: this.currentQuiz.scope,
                    questions: this.currentQuiz.questions,
                    answers: Object.values(this.currentQuiz.answers),
                    timeSpent: this.currentQuiz.timeSpent
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.showResult(data.data);
            }
        } catch (error) {
            console.error('提交测验失败:', error);
            alert('提交测验失败，请稍后重试');
        }
    }

    showResult(result) {
        const container = document.getElementById('quiz-container');
        if (!container) return;

        let scoreClass = 'good';
        if (result.score >= 90) scoreClass = 'excellent';
        else if (result.score < 60) scoreClass = 'poor';

        const minutes = Math.floor(result.timeSpent / 60);
        const seconds = result.timeSpent % 60;
        const timeString = minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;

        container.innerHTML = `
            <div class="quiz-result">
                <h3>测验完成！</h3>
                <div class="result-score ${scoreClass}">
                    <span class="score-number">${result.score.toFixed(1)}</span>
                    <span class="score-unit">分</span>
                </div>
                
                <div class="result-stats">
                    <div class="stat-item">
                        <div class="stat-value">${result.totalQuestions}</div>
                        <div class="stat-label">总题数</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${result.correctAnswers}</div>
                        <div class="stat-label">答对</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${result.wrongAnswers}</div>
                        <div class="stat-label">答错</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${timeString}</div>
                        <div class="stat-label">用时</div>
                    </div>
                </div>

                ${result.weakCombinations.length > 0 ? `
                    <div class="weak-combinations">
                        <h4>薄弱知识点</h4>
                        <div class="weak-list">
                            ${result.weakCombinations.map(id => {
                                const combo = this.findCombination(id);
                                return combo ? `<span class="weak-tag">${combo.pattern}</span>` : '';
                            }).join('')}
                        </div>
                    </div>
                ` : ''}

                <div class="result-actions">
                    <button class="quiz-control-btn primary" onclick="combinationsQuiz.restartQuiz()">再测一次</button>
                    <button class="quiz-control-btn secondary" onclick="combinationsQuiz.backToMenu()">返回菜单</button>
                    <button class="quiz-control-btn secondary" onclick="combinationsQuiz.viewWrongAnswers()">查看错题</button>
                </div>
            </div>
        `;
    }

    findCombination(id) {
        // 这里需要从全局数据中查找组合
        if (window.combinationsManager) {
            return window.combinationsManager.combinations.find(c => c.id === id);
        }
        return null;
    }

    restartQuiz() {
        if (this.currentQuiz) {
            this.startQuiz(this.currentQuiz.quizType, this.currentQuiz.scope);
        }
    }

    backToMenu() {
        this.currentQuiz = null;
        this.stopTimer();
        // 返回到测验菜单
        if (window.combinationsManager) {
            window.combinationsManager.currentTab = 'quiz';
            window.combinationsManager.render();
        }
    }

    viewWrongAnswers() {
        if (window.combinationsManager) {
            window.combinationsManager.currentTab = 'wrong';
            window.combinationsManager.render();
        }
    }

    startTimer() {
        this.stopTimer();
        this.timer = setInterval(() => {
            if (this.currentQuiz) {
                const elapsed = Math.floor((Date.now() - this.currentQuiz.startTime) / 1000);
                const timerElement = document.getElementById('quiz-timer');
                if (timerElement) {
                    timerElement.textContent = elapsed;
                }
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    showLoading() {
        const container = document.getElementById('quiz-container');
        if (container) {
            container.innerHTML = `
                <div class="quiz-loading">
                    <div class="loading-spinner"></div>
                    <p>正在加载测验题目...</p>
                </div>
            `;
        }
    }
}

// 初始化
let combinationsQuiz;
document.addEventListener('DOMContentLoaded', () => {
    combinationsQuiz = new CombinationsQuiz();
});