/**
 * 音标学习模块
 * 管理48个国际音标的学习、测验和进度跟踪
 * 数据存储到MySQL数据库，不使用localStorage
 */

// API配置
const PHONETICS_API_BASE = window.location.port === '8080' 
    ? 'http://localhost:3000/api/phonetics' 
    : '/api/phonetics';

/**
 * API请求封装
 */
async function phoneticsApiRequest(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (body) options.body = JSON.stringify(body);
    
    // 添加认证头
    if (typeof auth !== 'undefined' && auth.getToken()) {
        options.headers['Authorization'] = `Bearer ${auth.getToken()}`;
    }
    
    const url = `${PHONETICS_API_BASE}${endpoint}`;
    console.log(`音标API请求: ${method} ${url}`);
    
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

class Phonetics {
    constructor() {
        this.phoneticsData = [];
        this.learnedPhonetics = new Set();
        this.quizHistory = [];
        this.wrongPhonetics = [];
        this.currentPhonetic = null;
        this.currentPhoneticIndex = -1;
        this.allPhoneticsFlat = [];
        
        this.quizTypes = {
            'daily': '随堂小测',
            'unit': '单元测验',
            'final': '综合结业测验'
        };
        
        this.init();
    }
    
    async init() {
        await this.loadData();
        await this.loadSavedProgress();
        this.bindEvents();
        this.renderAllPhonetics();
        this.updateProgressDisplay();
        
        // 初始化测验模块
        if (typeof PhoneticsQuiz !== 'undefined') {
            this.quiz = new PhoneticsQuiz();
        }
    }
    
    async loadData() {
        try {
            const response = await fetch('data/phonetics.json');
            this.phoneticsData = await response.json();
            this.preparePhoneticsData();
        } catch (error) {
            console.error('Failed to load phonetics data:', error);
            this.phoneticsData = [];
        }
    }
    
    preparePhoneticsData() {
        // 将音标数据按分类组织
        this.categories = {
            '元音': {
                icon: '🗣️',
                subcategories: {
                    '单元音-长元音': [],
                    '单元音-短元音': [],
                    '双元音': []
                }
            },
            '辅音': {
                icon: '👂',
                subcategories: {
                    '清辅音': [],
                    '浊辅音': []
                }
            }
        };
        
        // 创建扁平化数组用于导航
        this.allPhoneticsFlat = [];
        
        this.phoneticsData.forEach(phonetic => {
            const category = phonetic.category;
            const subcategory = phonetic.subcategory;
            
            if (this.categories[category] && this.categories[category].subcategories[subcategory]) {
                this.categories[category].subcategories[subcategory].push(phonetic);
            }
            
            this.allPhoneticsFlat.push(phonetic);
        });
    }
    
    async loadSavedProgress() {
        try {
            // 加载已学习的音标
            const progressData = await phoneticsApiRequest('/progress');
            if (progressData.success) {
                this.learnedPhonetics = new Set(progressData.data.learnedPhonetics || []);
            }
            
            // 加载测验历史
            const quizData = await phoneticsApiRequest('/quiz-history');
            if (quizData.success) {
                this.quizHistory = quizData.data.quizHistory || [];
            }
            
            // 加载错题本
            const wrongData = await phoneticsApiRequest('/wrong-answers');
            if (wrongData.success) {
                this.wrongPhonetics = wrongData.data.wrongPhonetics || [];
            }
        } catch (error) {
            console.error('从数据库加载音标学习进度失败:', error);
            this.learnedPhonetics = new Set();
            this.quizHistory = [];
            this.wrongPhonetics = [];
        }
    }
    
    bindEvents() {
        // 侧边栏菜单点击事件
        document.querySelectorAll('.nav-item[data-screen]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.nav-item[data-screen]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const screen = btn.dataset.screen;
                if (screen === 'learn') {
                    this.showMainContent();
                } else if (screen === 'progress') {
                    this.showProgressCenter();
                } else if (screen === 'quiz') {
                    this.showQuizSelection();
                }
            });
        });
        
        // 顶部按钮事件
        document.getElementById('phonetics-progress-btn')?.addEventListener('click', () => {
            this.showProgressCenter();
        });
        
        document.getElementById('phonetics-quiz-btn')?.addEventListener('click', () => {
            this.showQuizSelection();
        });
        
        // 详情弹窗事件
        document.getElementById('phonetic-detail-close')?.addEventListener('click', () => {
            this.closeDetailModal();
        });
        
        document.getElementById('phonetic-detail-modal')?.addEventListener('click', (e) => {
            if (e.target === document.getElementById('phonetic-detail-modal')) {
                this.closeDetailModal();
            }
        });
        
        document.getElementById('phonetic-detail-prev')?.addEventListener('click', () => {
            this.navigatePhonetic(-1);
        });
        
        document.getElementById('phonetic-detail-next')?.addEventListener('click', () => {
            this.navigatePhonetic(1);
        });
        
        document.getElementById('phonetic-detail-mark')?.addEventListener('click', () => {
            this.toggleLearned();
        });
        
        // 键盘导航
        document.addEventListener('keydown', (e) => {
            if (document.getElementById('phonetic-detail-modal').classList.contains('active')) {
                if (e.key === 'Escape') {
                    this.closeDetailModal();
                } else if (e.key === 'ArrowLeft') {
                    this.navigatePhonetic(-1);
                } else if (e.key === 'ArrowRight') {
                    this.navigatePhonetic(1);
                }
            }
        });
    }
    
    renderAllPhonetics() {
        const container = document.getElementById('phonetics-categories');
        if (!container) return;
        
        container.innerHTML = '';
        
        // 遍历每个大类
        Object.entries(this.categories).forEach(([categoryName, categoryData]) => {
            const categoryElement = document.createElement('div');
            categoryElement.className = 'phonetics-category';
            
            // 计算该大类的音标数量
            let totalInCategory = 0;
            Object.values(categoryData.subcategories).forEach(sub => {
                totalInCategory += sub.length;
            });
            
            // 计算已学习数量
            let learnedInCategory = 0;
            Object.values(categoryData.subcategories).forEach(sub => {
                sub.forEach(phonetic => {
                    if (this.learnedPhonetics.has(phonetic.id)) {
                        learnedInCategory++;
                    }
                });
            });
            
            categoryElement.innerHTML = `
                <div class="phonetics-category-header">
                    <div class="phonetics-category-icon">${categoryData.icon}</div>
                    <div class="phonetics-category-info">
                        <h2 class="phonetics-category-title">${categoryName}</h2>
                        <p class="phonetics-category-desc">${categoryName === '元音' ? '单元音 · 双元音' : '清辅音 · 浊辅音'}</p>
                    </div>
                    <div class="phonetics-category-count">${learnedInCategory}/${totalInCategory} 已学</div>
                </div>
                <div class="phonetics-subcategories" id="subcategories-${categoryName}">
                    <!-- 子分类将在这里渲染 -->
                </div>
            `;
            
            container.appendChild(categoryElement);
            
            // 渲染子分类
            const subcategoriesContainer = document.getElementById(`subcategories-${categoryName}`);
            Object.entries(categoryData.subcategories).forEach(([subName, phonetics]) => {
                if (phonetics.length === 0) return;
                
                const subcategoryElement = document.createElement('div');
                subcategoryElement.className = 'phonetics-subcategory';
                
                // 生成唯一的网格容器ID
                const gridId = `grid-${encodeURIComponent(categoryName)}-${encodeURIComponent(subName)}`;
                
                subcategoryElement.innerHTML = `
                    <div class="phonetics-subcategory-header">
                        <div class="phonetics-subcategory-dot"></div>
                        <h3 class="phonetics-subcategory-title">${subName}</h3>
                    </div>
                    <div class="phonetics-grid" id="${gridId}">
                        <!-- 音标卡片将在这里渲染 -->
                    </div>
                `;
                
                subcategoriesContainer.appendChild(subcategoryElement);
                
                // 渲染音标卡片
                const gridContainer = document.getElementById(gridId);
                phonetics.forEach(phonetic => {
                    const card = this.createPhoneticCard(phonetic);
                    gridContainer.appendChild(card);
                });
            });
        });
    }
    
    createPhoneticCard(phonetic) {
        const card = document.createElement('div');
        card.className = `phonetic-card ${this.learnedPhonetics.has(phonetic.id) ? 'learned' : ''}`;
        card.dataset.id = phonetic.id;
        
        // 获取第一个例词
        const firstExample = phonetic.examples && phonetic.examples.length > 0 
            ? phonetic.examples[0].word 
            : '';
        
        card.innerHTML = `
            <div class="phonetic-card-symbol">${phonetic.symbol}</div>
            <div class="phonetic-card-example">${firstExample}</div>
        `;
        
        card.addEventListener('click', () => {
            this.showPhoneticDetail(phonetic.id);
        });
        
        return card;
    }
    
    showPhoneticDetail(phoneticId) {
        const phonetic = this.phoneticsData.find(p => p.id === phoneticId);
        if (!phonetic) return;
        
        this.currentPhonetic = phonetic;
        this.currentPhoneticIndex = this.allPhoneticsFlat.findIndex(p => p.id === phoneticId);
        
        // 更新弹窗内容
        document.getElementById('phonetic-detail-symbol').textContent = phonetic.symbol;
        document.getElementById('phonetic-detail-category').textContent = phonetic.subcategory;
        document.getElementById('phonetic-detail-description').textContent = phonetic.description;
        
        // 更新例词
        const examplesContainer = document.getElementById('phonetic-detail-examples');
        examplesContainer.innerHTML = '';
        
        if (phonetic.examples && phonetic.examples.length > 0) {
            phonetic.examples.forEach(example => {
                const exampleItem = document.createElement('div');
                exampleItem.className = 'phonetic-example-item';
                exampleItem.innerHTML = `
                    <div class="phonetic-example-word">${example.word}</div>
                    <div class="phonetic-example-phonetic">${example.phonetic}</div>
                    <div class="phonetic-example-meaning">${example.meaning}</div>
                `;
                examplesContainer.appendChild(exampleItem);
            });
        }
        
        // 更新标记按钮状态
        this.updateMarkButton();
        
        // 更新导航按钮状态
        this.updateNavigationButtons();
        
        // 显示弹窗
        document.getElementById('phonetic-detail-modal').classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    closeDetailModal() {
        document.getElementById('phonetic-detail-modal').classList.remove('active');
        document.body.style.overflow = '';
        this.currentPhonetic = null;
        this.currentPhoneticIndex = -1;
    }
    
    navigatePhonetic(direction) {
        if (this.currentPhoneticIndex === -1) return;
        
        const newIndex = this.currentPhoneticIndex + direction;
        if (newIndex >= 0 && newIndex < this.allPhoneticsFlat.length) {
            this.showPhoneticDetail(this.allPhoneticsFlat[newIndex].id);
        }
    }
    
    updateNavigationButtons() {
        const prevBtn = document.getElementById('phonetic-detail-prev');
        const nextBtn = document.getElementById('phonetic-detail-next');
        
        if (prevBtn) {
            prevBtn.disabled = this.currentPhoneticIndex === 0;
            prevBtn.style.opacity = this.currentPhoneticIndex === 0 ? '0.5' : '1';
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.currentPhoneticIndex === this.allPhoneticsFlat.length - 1;
            nextBtn.style.opacity = this.currentPhoneticIndex === this.allPhoneticsFlat.length - 1 ? '0.5' : '1';
        }
    }
    
    updateMarkButton() {
        const markBtn = document.getElementById('phonetic-detail-mark');
        if (!markBtn || !this.currentPhonetic) return;
        
        const isLearned = this.learnedPhonetics.has(this.currentPhonetic.id);
        markBtn.innerHTML = isLearned 
            ? '✓ 已学习' 
            : '✓ 标记已学';
        markBtn.className = `phonetic-detail-btn ${isLearned ? 'primary' : 'secondary'}`;
    }
    
    async toggleLearned() {
        if (!this.currentPhonetic) return;
        
        const phoneticId = this.currentPhonetic.id;
        const isLearned = this.learnedPhonetics.has(phoneticId);
        
        try {
            const action = isLearned ? 'remove' : 'add';
            await phoneticsApiRequest('/progress', 'POST', {
                phoneticId,
                action
            });
            
            if (isLearned) {
                this.learnedPhonetics.delete(phoneticId);
            } else {
                this.learnedPhonetics.add(phoneticId);
            }
            
            // 更新UI
            this.updateMarkButton();
            this.updatePhoneticCardUI(phoneticId);
            this.updateProgressDisplay();
            this.updateCategoryProgress();
        } catch (error) {
            console.error('更新学习进度失败:', error);
            alert('更新失败，请重试');
        }
    }
    
    updatePhoneticCardUI(phoneticId) {
        const card = document.querySelector(`.phonetic-card[data-id="${phoneticId}"]`);
        if (card) {
            if (this.learnedPhonetics.has(phoneticId)) {
                card.classList.add('learned');
            } else {
                card.classList.remove('learned');
            }
        }
    }
    
    updateProgressDisplay() {
        const total = this.phoneticsData.length;
        const learned = this.learnedPhonetics.size;
        const percentage = total > 0 ? Math.round((learned / total) * 100) : 0;
        
        document.getElementById('total-phonetics').textContent = total;
        document.getElementById('learned-phonetics').textContent = learned;
        document.getElementById('learning-progress').textContent = `${percentage}%`;
    }
    
    updateCategoryProgress() {
        Object.entries(this.categories).forEach(([categoryName, categoryData]) => {
            let totalInCategory = 0;
            let learnedInCategory = 0;
            
            Object.values(categoryData.subcategories).forEach(sub => {
                sub.forEach(phonetic => {
                    totalInCategory++;
                    if (this.learnedPhonetics.has(phonetic.id)) {
                        learnedInCategory++;
                    }
                });
            });
            
            // 查找对应的大类元素
            const categoryElements = document.querySelectorAll('.phonetics-category');
            categoryElements.forEach(element => {
                const titleElement = element.querySelector('.phonetics-category-title');
                if (titleElement && titleElement.textContent === categoryName) {
                    const countElement = element.querySelector('.phonetics-category-count');
                    if (countElement) {
                        countElement.textContent = `${learnedInCategory}/${totalInCategory} 已学`;
                    }
                }
            });
        });
    }
    
    showMainContent() {
        document.getElementById('phonetics-main-content').style.display = 'block';
        document.getElementById('phonetics-progress-container').style.display = 'none';
        document.getElementById('phonetics-quiz-container').style.display = 'none';
    }
    
    showProgressCenter() {
        const progressData = this.getProgressData();
        
        // 隐藏其他容器，显示进度中心容器
        document.getElementById('phonetics-main-content').style.display = 'none';
        document.getElementById('phonetics-quiz-container').style.display = 'none';
        document.getElementById('phonetics-progress-container').style.display = 'block';
        
        // 更新侧边栏状态
        document.querySelectorAll('.nav-item[data-screen]').forEach(b => b.classList.remove('active'));
        document.querySelector('.nav-item[data-screen="progress"]')?.classList.add('active');
        
        // 渲染内容
        const container = document.getElementById('phonetics-progress-container');
        container.innerHTML = `
            <div class="progress-center-content">
                <div class="progress-center-header">
                    <h2>个人中心</h2>
                </div>
                
                <div class="progress-center-tabs">
                    <button class="progress-tab active" data-tab="progress">学习进度</button>
                    <button class="progress-tab" data-tab="wrong">错题本</button>
                    <button class="progress-tab" data-tab="history">测验记录</button>
                </div>
                
                <div class="progress-center-body">
                    <!-- 学习进度 -->
                    <div class="progress-tab-content active" id="progress-tab-progress">
                        <div class="progress-stats">
                            <div class="progress-stat">
                                <div class="progress-stat-number">${progressData.learned}</div>
                                <div class="progress-stat-label">已学音标</div>
                            </div>
                            <div class="progress-stat">
                                <div class="progress-stat-number">${progressData.total}</div>
                                <div class="progress-stat-label">总音标数</div>
                            </div>
                            <div class="progress-stat">
                                <div class="progress-stat-number">${progressData.percentage}%</div>
                                <div class="progress-stat-label">完成率</div>
                            </div>
                        </div>
                        
                        <div class="progress-details">
                            <h3>各分类进度</h3>
                            ${this.renderCategoryProgress()}
                        </div>
                    </div>
                    
                    <!-- 错题本 -->
                    <div class="progress-tab-content" id="progress-tab-wrong">
                        ${progressData.wrongQuestions.length > 0 ? `
                            <div class="wrong-questions-list">
                                ${progressData.wrongQuestions.map((wrong, index) => `
                                    <div class="wrong-question-item">
                                        <div class="wrong-question-header">
                                            <span class="wrong-question-number">${index + 1}</span>
                                            <span class="wrong-question-type">${wrong.type}</span>
                                        </div>
                                        <div class="wrong-question-content">
                                            <div class="wrong-question-phonetic">${wrong.phonetic}</div>
                                            <div class="wrong-question-answer">正确答案: ${wrong.correctAnswer}</div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <div class="empty-state">
                                <div class="empty-icon">📝</div>
                                <div class="empty-text">暂无错题记录</div>
                            </div>
                        `}
                    </div>
                    
                    <!-- 测验记录 -->
                    <div class="progress-tab-content" id="progress-tab-history">
                        ${progressData.quizHistory.length > 0 ? `
                            <div class="quiz-history-list">
                                ${progressData.quizHistory.slice().reverse().map(record => `
                                    <div class="quiz-history-item">
                                        <div class="quiz-history-header">
                                            <span class="quiz-history-type">${this.quizTypes[record.type]}</span>
                                            <span class="quiz-history-date">${new Date(record.date).toLocaleDateString()}</span>
                                        </div>
                                        <div class="quiz-history-details">
                                            <span class="quiz-history-score">${record.score}/${record.total}</span>
                                            <span class="quiz-history-percent">${record.percentage}%</span>
                                            <span class="quiz-history-status ${record.percentage >= 80 ? 'passed' : 'failed'}">
                                                ${record.percentage >= 80 ? '通关' : '未通关'}
                                            </span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <div class="empty-state">
                                <div class="empty-icon">📊</div>
                                <div class="empty-text">暂无测验记录</div>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
        
        // 绑定标签切换事件
        container.querySelectorAll('.progress-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                container.querySelectorAll('.progress-tab').forEach(t => t.classList.remove('active'));
                container.querySelectorAll('.progress-tab-content').forEach(c => c.classList.remove('active'));
                
                tab.classList.add('active');
                const tabId = `progress-tab-${tab.dataset.tab}`;
                document.getElementById(tabId).classList.add('active');
            });
        });
    }
    
    getProgressData() {
        const total = this.phoneticsData.length;
        const learned = this.learnedPhonetics.size;
        const percentage = total > 0 ? Math.round((learned / total) * 100) : 0;
        
        return {
            total,
            learned,
            percentage,
            quizHistory: this.quizHistory || [],
            wrongQuestions: this.wrongPhonetics || []
        };
    }
    
    renderCategoryProgress() {
        const categories = [
            { name: '长元音', subcategory: '单元音-长元音', icon: '🔴' },
            { name: '短元音', subcategory: '单元音-短元音', icon: '🟡' },
            { name: '双元音', subcategory: '双元音', icon: '🟠' },
            { name: '清辅音', subcategory: '清辅音', icon: '🔵' },
            { name: '浊辅音', subcategory: '浊辅音', icon: '🟣' }
        ];
        
        return categories.map(cat => {
            const phonetics = this.phoneticsData.filter(p => p.subcategory === cat.subcategory);
            const learned = phonetics.filter(p => this.learnedPhonetics.has(p.id)).length;
            const total = phonetics.length;
            const percentage = total > 0 ? Math.round((learned / total) * 100) : 0;
            
            return `
                <div class="category-progress-item">
                    <div class="category-progress-header">
                        <span class="category-progress-icon">${cat.icon}</span>
                        <span class="category-progress-name">${cat.name}</span>
                        <span class="category-progress-count">${learned}/${total}</span>
                    </div>
                    <div class="category-progress-bar">
                        <div class="category-progress-fill" style="width: ${percentage}%"></div>
                    </div>
                    <div class="category-progress-percent">${percentage}%</div>
                </div>
            `;
        }).join('');
    }
    
    showQuizSelection() {
        // 隐藏其他容器，显示测验选择容器
        document.getElementById('phonetics-main-content').style.display = 'none';
        document.getElementById('phonetics-progress-container').style.display = 'none';
        document.getElementById('phonetics-quiz-container').style.display = 'block';
        
        // 更新侧边栏状态
        document.querySelectorAll('.nav-item[data-screen]').forEach(b => b.classList.remove('active'));
        document.querySelector('.nav-item[data-screen="quiz"]')?.classList.add('active');
        
        // 渲染内容
        const container = document.getElementById('phonetics-quiz-container');
        container.innerHTML = `
            <div class="quiz-selection-content">
                <h2>选择测验类型</h2>
                <div class="quiz-selection-options">
                    <button class="quiz-selection-option" data-type="daily">
                        <span class="quiz-selection-icon">📝</span>
                        <span class="quiz-selection-title">随堂小测</span>
                        <span class="quiz-selection-desc">单音标自测，5道题</span>
                    </button>
                    <button class="quiz-selection-option" data-type="unit">
                        <span class="quiz-selection-icon">📚</span>
                        <span class="quiz-selection-title">单元测验</span>
                        <span class="quiz-selection-desc">分类巩固，15道题</span>
                    </button>
                    <button class="quiz-selection-option" data-type="final">
                        <span class="quiz-selection-icon">🎓</span>
                        <span class="quiz-selection-title">综合结业测验</span>
                        <span class="quiz-selection-desc">全局检测，30道题</span>
                    </button>
                </div>
            </div>
        `;
        
        // 绑定事件
        container.querySelectorAll('.quiz-selection-option').forEach(option => {
            option.addEventListener('click', () => {
                const type = option.dataset.type;
                this.quiz.startQuiz(type);
            });
        });
    }
    
    playAudio() {
        if (!this.currentPhonetic) return;
        
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance();
            utterance.text = this.currentPhonetic.symbol.replace(/\//g, '');
            utterance.lang = 'en-US';
            utterance.rate = 0.8;
            speechSynthesis.speak(utterance);
        } else {
            alert('您的浏览器不支持语音合成');
        }
    }
    
    startQuiz() {
        if (!this.quiz) {
            alert('测验模块加载失败');
            return;
        }
        
        this.showQuizSelection();
    }
    
    async saveQuizResult(type, score, total, wrongQuestions) {
        try {
            const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
            const result = await phoneticsApiRequest('/quiz-history', 'POST', {
                type,
                score,
                total,
                percentage,
                date: new Date().toISOString()
            });
            
            if (result.success) {
                this.quizHistory.push({
                    type,
                    score,
                    total,
                    percentage,
                    date: new Date().toISOString()
                });
                
                // 保存错题到错题本
                if (wrongQuestions && wrongQuestions.length > 0) {
                    for (const wrong of wrongQuestions) {
                        await phoneticsApiRequest('/wrong-answers', 'POST', {
                            phoneticId: wrong.phoneticId,
                            type: wrong.type,
                            correctAnswer: wrong.correctAnswer
                        });
                    }
                    this.wrongPhonetics = [...this.wrongPhonetics, ...wrongQuestions];
                }
            }
        } catch (error) {
            console.error('保存测验结果失败:', error);
        }
    }
    
    async saveProgress() {
        // 由于 API 已经分别保存各个部分，这个方法主要用于手动触发保存
        // 实际保存已在各个操作中完成
        console.log('进度已通过各个 API 调用保存');
    }
}

// 导出给测验模块使用
window.Phonetics = Phonetics;
