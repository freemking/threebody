/**
 * 音标测验模块
 * 管理随堂小测、单元测验和综合结业测验
 * 数据存储到MySQL数据库，不使用localStorage
 */

// API配置
const QUIZ_API_BASE = window.location.port === '8080' 
    ? 'http://localhost:3000/api/phonetics' 
    : '/api/phonetics';

/**
 * API请求封装
 */
async function quizApiRequest(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (body) options.body = JSON.stringify(body);
    
    // 添加认证头
    if (typeof auth !== 'undefined' && auth.getToken()) {
        options.headers['Authorization'] = `Bearer ${auth.getToken()}`;
    }
    
    const url = `${QUIZ_API_BASE}${endpoint}`;
    console.log(`测验API请求: ${method} ${url}`);
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
        throw new Error(`API响应错误: ${response.status} ${response.statusText}`);
    }
    
    const text = await response.text();
    if (!text || text.trim() === '') {
        throw new Error('API响应为空');
    }
    
    return JSON.parse(text);
}

class PhoneticsQuiz {
    constructor() {
        this.phoneticsData = [];
        this.quizTypes = {
            'daily': '随堂小测',
            'unit': '单元测验',
            'final': '综合结业测验'
        };
        this.currentQuiz = null;
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.answers = [];
        this.wrongQuestions = [];
        
        this.init();
    }
    
    async init() {
        await this.loadPhoneticsData();
    }
    
    async loadPhoneticsData() {
        try {
            const response = await fetch('data/phonetics.json');
            this.phoneticsData = await response.json();
        } catch (error) {
            console.error('Failed to load phonetics data:', error);
            this.phoneticsData = [];
        }
    }
    
    startQuiz(type, phoneticId = null) {
        this.currentQuiz = type;
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.answers = [];
        this.wrongQuestions = [];
        
        switch (type) {
            case 'daily':
                this.generateDailyQuiz(phoneticId);
                break;
            case 'unit':
                this.generateUnitQuiz();
                break;
            case 'final':
                this.generateFinalQuiz();
                break;
        }
        
        this.showQuizScreen();
        this.renderQuestion();
    }
    
    generateDailyQuiz(phoneticId) {
        // 随堂小测：5道题
        const phonetic = this.phoneticsData.find(p => p.id === phoneticId);
        if (!phonetic) return;
        
        // 生成5道题目
        const questionTypes = ['listen', 'match'];
        
        for (let i = 0; i < 5; i++) {
            const type = questionTypes[i % 2];
            let question;
            
            if (type === 'listen') {
                question = this.createListenQuestion(phonetic);
            } else {
                question = this.createMatchQuestion(phonetic);
            }
            
            this.questions.push(question);
        }
    }
    
    generateUnitQuiz() {
        // 单元测验：15道题
        const categories = ['长元音', '短元音', '双元音', '清辅音', '浊辅音'];
        const selectedCategory = categories[Math.floor(Math.random() * categories.length)];
        
        const categoryPhonetics = this.phoneticsData.filter(p => 
            p.subcategory.includes(selectedCategory)
        );
        
        if (categoryPhonetics.length === 0) return;
        
        // 生成15道题目
        for (let i = 0; i < 15; i++) {
            const phonetic = categoryPhonetics[Math.floor(Math.random() * categoryPhonetics.length)];
            const questionTypes = ['listen', 'match', 'identify'];
            const type = questionTypes[Math.floor(Math.random() * questionTypes.length)];
            
            let question;
            switch (type) {
                case 'listen':
                    question = this.createListenQuestion(phonetic);
                    break;
                case 'match':
                    question = this.createMatchQuestion(phonetic);
                    break;
                case 'identify':
                    question = this.createIdentifyQuestion(phonetic);
                    break;
            }
            
            this.questions.push(question);
        }
    }
    
    generateFinalQuiz() {
        // 综合结业测验：30道题
        const allPhonetics = [...this.phoneticsData];
        
        // 随机选择30个音标
        const shuffled = allPhonetics.sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, 30);
        
        selected.forEach(phonetic => {
            const questionTypes = ['listen', 'match', 'identify', 'distinguish'];
            const type = questionTypes[Math.floor(Math.random() * questionTypes.length)];
            
            let question;
            switch (type) {
                case 'listen':
                    question = this.createListenQuestion(phonetic);
                    break;
                case 'match':
                    question = this.createMatchQuestion(phonetic);
                    break;
                case 'identify':
                    question = this.createIdentifyQuestion(phonetic);
                    break;
                case 'distinguish':
                    question = this.createDistinguishQuestion(phonetic);
                    break;
            }
            
            this.questions.push(question);
        });
    }
    
    createListenQuestion(phonetic) {
        // 听音选音标
        const otherPhonetics = this.phoneticsData
            .filter(p => p.id !== phonetic.id)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);
        
        const options = [phonetic, ...otherPhonetics]
            .sort(() => Math.random() - 0.5);
        
        return {
            type: 'listen',
            question: '听音选音标',
            audioPhonetic: phonetic,
            options: options.map(p => ({
                id: p.id,
                symbol: p.symbol,
                correct: p.id === phonetic.id
            })),
            correctAnswer: phonetic.id,
            explanation: `正确答案是 ${phonetic.symbol}，发音为：${phonetic.description}`
        };
    }
    
    createMatchQuestion(phonetic) {
        // 看音标识单词
        const correctExample = phonetic.examples[Math.floor(Math.random() * phonetic.examples.length)];
        
        const otherExamples = [];
        const otherPhonetics = this.phoneticsData
            .filter(p => p.id !== phonetic.id)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);
        
        otherPhonetics.forEach(p => {
            if (p.examples.length > 0) {
                const example = p.examples[Math.floor(Math.random() * p.examples.length)];
                otherExamples.push(example);
            }
        });
        
        const options = [correctExample, ...otherExamples]
            .sort(() => Math.random() - 0.5);
        
        return {
            type: 'match',
            question: '看音标识单词',
            phoneticSymbol: phonetic.symbol,
            options: options.map(ex => ({
                word: ex.word,
                phonetic: ex.phonetic,
                meaning: ex.meaning,
                correct: ex.word === correctExample.word
            })),
            correctAnswer: correctExample.word,
            explanation: `${phonetic.symbol} 对应的单词是 ${correctExample.word} (${correctExample.meaning})`
        };
    }
    
    createIdentifyQuestion(phonetic) {
        // 音标辨析
        const otherPhonetics = this.phoneticsData
            .filter(p => p.id !== phonetic.id)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);
        
        const options = [phonetic, ...otherPhonetics]
            .sort(() => Math.random() - 0.5);
        
        return {
            type: 'identify',
            question: '音标辨析',
            targetPhonetic: phonetic,
            options: options.map(p => ({
                id: p.id,
                symbol: p.symbol,
                category: p.subcategory,
                correct: p.id === phonetic.id
            })),
            correctAnswer: phonetic.id,
            explanation: `${phonetic.symbol} 属于 ${phonetic.subcategory}，发音特点：${phonetic.description}`
        };
    }
    
    createDistinguishQuestion(phonetic) {
        // 易混音标区分
        // 找出相似的音标
        const similarPhonetics = this.phoneticsData
            .filter(p => 
                p.id !== phonetic.id && 
                (p.subcategory === phonetic.subcategory || 
                 p.symbol.includes(phonetic.symbol.charAt(1)))
            )
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);
        
        if (similarPhonetics.length < 3) {
            return this.createMatchQuestion(phonetic);
        }
        
        const options = [phonetic, ...similarPhonetics]
            .sort(() => Math.random() - 0.5);
        
        return {
            type: 'distinguish',
            question: '易混音标区分',
            targetPhonetic: phonetic,
            options: options.map(p => ({
                id: p.id,
                symbol: p.symbol,
                description: p.description,
                correct: p.id === phonetic.id
            })),
            correctAnswer: phonetic.id,
            explanation: `${phonetic.symbol} 的发音特点是：${phonetic.description}`
        };
    }
    
    showQuizScreen() {
        // 创建测验界面
        const quizScreen = document.createElement('div');
        quizScreen.id = 'phonetics-quiz-screen';
        quizScreen.className = 'phonetics-quiz-screen';
        
        quizScreen.innerHTML = `
            <div class="quiz-header">
                <button class="quiz-back-btn" id="quiz-back-btn">← 返回</button>
                <h2 class="quiz-title">${this.quizTypes[this.currentQuiz]}</h2>
                <div class="quiz-progress">
                    <span id="quiz-progress-text">1/${this.questions.length}</span>
                </div>
            </div>
            
            <div class="quiz-content">
                <div class="quiz-question-container" id="quiz-question-container">
                    <!-- 动态生成题目 -->
                </div>
                
                <div class="quiz-navigation">
                    <button id="quiz-prev-btn" class="quiz-nav-btn" disabled>上一题</button>
                    <button id="quiz-next-btn" class="quiz-nav-btn">下一题</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(quizScreen);
        
        // 绑定事件
        document.getElementById('quiz-back-btn').addEventListener('click', () => this.closeQuiz());
        document.getElementById('quiz-prev-btn').addEventListener('click', () => this.prevQuestion());
        document.getElementById('quiz-next-btn').addEventListener('click', () => this.nextQuestion());
    }
    
    renderQuestion() {
        if (this.currentQuestionIndex >= this.questions.length) {
            this.showResults();
            return;
        }
        
        const question = this.questions[this.currentQuestionIndex];
        const container = document.getElementById('quiz-question-container');
        
        // 更新进度
        document.getElementById('quiz-progress-text').textContent = 
            `${this.currentQuestionIndex + 1}/${this.questions.length}`;
        
        // 根据题目类型渲染
        switch (question.type) {
            case 'listen':
                container.innerHTML = this.renderListenQuestion(question);
                break;
            case 'match':
                container.innerHTML = this.renderMatchQuestion(question);
                break;
            case 'identify':
                container.innerHTML = this.renderIdentifyQuestion(question);
                break;
            case 'distinguish':
                container.innerHTML = this.renderDistinguishQuestion(question);
                break;
        }
        
        // 绑定选项事件
        this.bindOptionEvents(question);
    }
    
    renderListenQuestion(question) {
        return `
            <div class="quiz-question">
                <div class="quiz-question-header">
                    <h3>听音选音标</h3>
                    <button class="quiz-audio-btn" id="quiz-audio-btn">🔊 播放发音</button>
                </div>
                <p class="quiz-question-text">请听发音，选择正确的音标符号</p>
                
                <div class="quiz-options">
                    ${question.options.map((option, index) => `
                        <button class="quiz-option" data-id="${option.id}" data-index="${index}">
                            <span class="quiz-option-symbol">${option.symbol}</span>
                        </button>
                    `).join('')}
                </div>
                
                <div class="quiz-feedback hidden" id="quiz-feedback">
                    <div class="quiz-feedback-text"></div>
                    <div class="quiz-feedback-explanation"></div>
                </div>
            </div>
        `;
    }
    
    renderMatchQuestion(question) {
        return `
            <div class="quiz-question">
                <div class="quiz-question-header">
                    <h3>看音标识单词</h3>
                </div>
                <p class="quiz-question-text">请选择与音标 <strong>${question.phoneticSymbol}</strong> 对应的单词</p>
                
                <div class="quiz-options">
                    ${question.options.map((option, index) => `
                        <button class="quiz-option" data-word="${option.word}" data-index="${index}">
                            <span class="quiz-option-word">${option.word}</span>
                            <span class="quiz-option-phonetic">${option.phonetic}</span>
                            <span class="quiz-option-meaning">${option.meaning}</span>
                        </button>
                    `).join('')}
                </div>
                
                <div class="quiz-feedback hidden" id="quiz-feedback">
                    <div class="quiz-feedback-text"></div>
                    <div class="quiz-feedback-explanation"></div>
                </div>
            </div>
        `;
    }
    
    renderIdentifyQuestion(question) {
        return `
            <div class="quiz-question">
                <div class="quiz-question-header">
                    <h3>音标辨析</h3>
                </div>
                <p class="quiz-question-text">请识别以下音标属于哪个分类</p>
                
                <div class="quiz-phonetic-display">
                    <span class="quiz-phonetic-symbol">${question.targetPhonetic.symbol}</span>
                </div>
                
                <div class="quiz-options">
                    ${question.options.map((option, index) => `
                        <button class="quiz-option" data-id="${option.id}" data-index="${index}">
                            <span class="quiz-option-category">${option.category}</span>
                        </button>
                    `).join('')}
                </div>
                
                <div class="quiz-feedback hidden" id="quiz-feedback">
                    <div class="quiz-feedback-text"></div>
                    <div class="quiz-feedback-explanation"></div>
                </div>
            </div>
        `;
    }
    
    renderDistinguishQuestion(question) {
        return `
            <div class="quiz-question">
                <div class="quiz-question-header">
                    <h3>易混音标区分</h3>
                </div>
                <p class="quiz-question-text">请选择与描述相符的音标</p>
                
                <div class="quiz-description">
                    <p>${question.targetPhonetic.description}</p>
                </div>
                
                <div class="quiz-options">
                    ${question.options.map((option, index) => `
                        <button class="quiz-option" data-id="${option.id}" data-index="${index}">
                            <span class="quiz-option-symbol">${option.symbol}</span>
                        </button>
                    `).join('')}
                </div>
                
                <div class="quiz-feedback hidden" id="quiz-feedback">
                    <div class="quiz-feedback-text"></div>
                    <div class="quiz-feedback-explanation"></div>
                </div>
            </div>
        `;
    }
    
    bindOptionEvents(question) {
        const options = document.querySelectorAll('.quiz-option');
        
        options.forEach(option => {
            option.addEventListener('click', () => {
                if (this.answers[this.currentQuestionIndex] !== undefined) return;
                
                let selectedAnswer;
                if (question.type === 'listen' || question.type === 'identify' || question.type === 'distinguish') {
                    selectedAnswer = option.dataset.id;
                } else if (question.type === 'match') {
                    selectedAnswer = option.dataset.word;
                }
                
                const isCorrect = this.checkAnswer(question, selectedAnswer);
                
                // 记录答案
                this.answers[this.currentQuestionIndex] = {
                    selected: selectedAnswer,
                    correct: isCorrect
                };
                
                if (!isCorrect) {
                    this.wrongQuestions.push({
                        question: question,
                        selected: selectedAnswer
                    });
                }
                
                // 更新分数
                if (isCorrect) {
                    this.score++;
                }
                
                // 显示反馈
                this.showFeedback(question, isCorrect, selectedAnswer);
                
                // 禁用其他选项
                options.forEach(opt => {
                    opt.disabled = true;
                    if (opt.dataset.id === question.correctAnswer || 
                        opt.dataset.word === question.correctAnswer) {
                        opt.classList.add('correct');
                    } else if (opt === option && !isCorrect) {
                        opt.classList.add('incorrect');
                    }
                });
            });
        });
        
        // 播放音频按钮
        const audioBtn = document.getElementById('quiz-audio-btn');
        if (audioBtn) {
            audioBtn.addEventListener('click', () => {
                if (question.audioPhonetic) {
                    this.playPhoneticAudio(question.audioPhonetic);
                }
            });
        }
    }
    
    checkAnswer(question, selectedAnswer) {
        return selectedAnswer === question.correctAnswer;
    }
    
    showFeedback(question, isCorrect, selectedAnswer) {
        const feedback = document.getElementById('quiz-feedback');
        feedback.classList.remove('hidden');
        
        const feedbackText = feedback.querySelector('.quiz-feedback-text');
        const explanation = feedback.querySelector('.quiz-feedback-explanation');
        
        if (isCorrect) {
            feedbackText.textContent = '✅ 回答正确！';
            feedbackText.className = 'quiz-feedback-text correct';
        } else {
            feedbackText.textContent = '❌ 回答错误';
            feedbackText.className = 'quiz-feedback-text incorrect';
        }
        
        explanation.textContent = question.explanation;
    }
    
    playPhoneticAudio(phonetic) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance();
            utterance.text = phonetic.symbol.replace(/\//g, '');
            utterance.lang = 'en-US';
            utterance.rate = 0.8;
            speechSynthesis.speak(utterance);
        }
    }
    
    prevQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.renderQuestion();
            this.updateNavigationButtons();
        }
    }
    
    nextQuestion() {
        if (this.answers[this.currentQuestionIndex] === undefined) {
            alert('请先回答当前题目');
            return;
        }
        
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.currentQuestionIndex++;
            this.renderQuestion();
            this.updateNavigationButtons();
        } else {
            this.showResults();
        }
    }
    
    updateNavigationButtons() {
        const prevBtn = document.getElementById('quiz-prev-btn');
        const nextBtn = document.getElementById('quiz-next-btn');
        
        prevBtn.disabled = this.currentQuestionIndex === 0;
        
        if (this.currentQuestionIndex === this.questions.length - 1) {
            nextBtn.textContent = '查看结果';
        } else {
            nextBtn.textContent = '下一题';
        }
    }
    
    showResults() {
        const container = document.getElementById('quiz-question-container');
        const totalQuestions = this.questions.length;
        const correctAnswers = this.score;
        const percentage = Math.round((correctAnswers / totalQuestions) * 100);
        
        let resultMessage = '';
        let resultClass = '';
        
        if (percentage >= 90) {
            resultMessage = '🎉 优秀！';
            resultClass = 'excellent';
        } else if (percentage >= 80) {
            resultMessage = '👍 良好！';
            resultClass = 'good';
        } else if (percentage >= 60) {
            resultMessage = '😊 及格';
            resultClass = 'pass';
        } else {
            resultMessage = '💪 继续努力';
            resultClass = 'fail';
        }
        
        container.innerHTML = `
            <div class="quiz-results">
                <div class="quiz-results-header">
                    <h2 class="quiz-results-title">测验结果</h2>
                    <div class="quiz-results-score ${resultClass}">
                        <span class="quiz-score-number">${correctAnswers}/${totalQuestions}</span>
                        <span class="quiz-score-percent">${percentage}%</span>
                    </div>
                    <div class="quiz-results-message">${resultMessage}</div>
                </div>
                
                <div class="quiz-results-details">
                    <div class="quiz-results-stats">
                        <div class="quiz-stat">
                            <span class="quiz-stat-label">正确</span>
                            <span class="quiz-stat-value correct">${correctAnswers}</span>
                        </div>
                        <div class="quiz-stat">
                            <span class="quiz-stat-label">错误</span>
                            <span class="quiz-stat-value incorrect">${totalQuestions - correctAnswers}</span>
                        </div>
                        <div class="quiz-stat">
                            <span class="quiz-stat-label">正确率</span>
                            <span class="quiz-stat-value">${percentage}%</span>
                        </div>
                    </div>
                    
                    ${this.wrongQuestions.length > 0 ? `
                        <div class="quiz-results-wrong">
                            <h3>错题回顾</h3>
                            <div class="quiz-wrong-list">
                                ${this.wrongQuestions.map((wrong, index) => `
                                    <div class="quiz-wrong-item">
                                        <span class="quiz-wrong-number">${index + 1}.</span>
                                        <span class="quiz-wrong-question">${wrong.question.question}</span>
                                        <span class="quiz-wrong-answer">正确答案: ${wrong.question.correctAnswer}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <div class="quiz-results-actions">
                    <button class="quiz-retry-btn" id="quiz-retry-btn">再试一次</button>
                    <button class="quiz-back-menu-btn" id="quiz-back-menu-btn">返回菜单</button>
                </div>
            </div>
        `;
        
        // 绑定按钮事件
        document.getElementById('quiz-retry-btn').addEventListener('click', () => {
            this.closeQuiz();
            this.startQuiz(this.currentQuiz);
        });
        
        document.getElementById('quiz-back-menu-btn').addEventListener('click', () => {
            this.closeQuiz();
        });
        
        // 更新导航按钮
        document.getElementById('quiz-prev-btn').classList.add('hidden');
        document.getElementById('quiz-next-btn').classList.add('hidden');
        
        // 保存测验结果
        this.saveQuizResults();
    }
    
    async saveQuizResults() {
        // 检查用户是否已登录
        if (typeof auth === 'undefined' || !auth.isLoggedIn()) {
            console.log('用户未登录，跳过保存测验结果到数据库');
            return;
        }
        
        const quizResult = {
            type: this.currentQuiz,
            date: new Date().toISOString(),
            score: this.score,
            total: this.questions.length,
            percentage: Math.round((this.score / this.questions.length) * 100),
            wrongQuestions: this.wrongQuestions.length
        };
        
        try {
            // 保存测验记录到数据库
            const quizResponse = await quizApiRequest('/quiz-history', 'POST', quizResult);
            if (quizResponse && quizResponse.success) {
                console.log('测验记录保存到数据库成功');
            } else {
                console.error('测验记录保存到数据库失败:', quizResponse);
            }
            
            // 保存错题到数据库
            if (this.wrongQuestions.length > 0) {
                for (const wrongQuestion of this.wrongQuestions) {
                    try {
                        await quizApiRequest('/wrong-answers', 'POST', wrongQuestion);
                        console.log('错题保存到数据库成功');
                    } catch (wrongError) {
                        console.error('错题保存到数据库失败:', wrongError);
                    }
                }
            }
            
        } catch (error) {
            console.error('保存测验结果失败:', error);
        }
    }
    
    closeQuiz() {
        const quizScreen = document.getElementById('phonetics-quiz-screen');
        if (quizScreen) {
            quizScreen.remove();
        }
    }
}

// 导出模块
window.PhoneticsQuiz = PhoneticsQuiz;