/**
 * 字母组合学习系统 - 主逻辑
 * 基于自然拼读的字母组合学习工具
 */

// 全局数据（异步加载）
let CombinationsData = [];
let CombinationGroups = [];

// 全局状态
const CombinationsApp = {
    currentSection: 'home',
    currentGroup: 0,
    currentCombination: 0,
    practiceMode: 'recognition',
    practiceQuestions: [],
    currentQuestion: 0,
    practiceScore: 0,
    totalAnswered: 0,
    correctAnswers: 0,
    wrongCombinations: [],
    isProcessing: false,
    settings: {
        autoPlay: true,
        showPhonetic: true,
        learnCount: 5,
        practiceCount: 10
    }
};

// 侧边栏切换
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
}

// 切换页面区块
function showSection(sectionId) {
    // 隐藏所有区块
    document.querySelectorAll('.combinations-section').forEach(section => {
        section.classList.add('hidden');
    });
    
    // 显示目标区块
    const targetSection = document.getElementById('section-' + sectionId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }
    
    // 更新侧边栏激活状态
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.section === sectionId) {
            item.classList.add('active');
        }
    });
    
    // 更新标题
    const titles = {
        'home': '字母组合学习',
        'study': '学习字母组合',
        'practice': '练习',
        'mastered': '已掌握列表',
        'settings': '设置'
    };
    document.getElementById('headerTitle').textContent = titles[sectionId] || '字母组合学习';
    
    CombinationsApp.currentSection = sectionId;
    
    // 根据区块执行初始化
    switch (sectionId) {
        case 'home':
            updateHomeStats();
            break;
        case 'study':
            initStudySection();
            break;
        case 'practice':
            resetPractice();
            break;
        case 'mastered':
            renderMasteredList();
            break;
    }
}

// 开始学习
function startLearning() {
    showSection('study');
}

// 开始练习
function startPractice() {
    showSection('practice');
}

// 返回首页
function goBack() {
    window.location.href = 'index.html';
}

// 更新首页统计
function updateHomeStats() {
    const data = CombinationsData;
    const masteredCount = data.filter(c => c.mastered).length;
    const totalCombinations = data.length;
    const accuracy = CombinationsApp.totalAnswered > 0 
        ? Math.round((CombinationsApp.correctAnswers / CombinationsApp.totalAnswered) * 100) 
        : 0;
    
    // 计算分组进度
    const totalGroups = CombinationGroups.length;
    const masteredGroups = CombinationGroups.filter(group => 
        group.combinations.every(index => data[index].mastered)
    ).length;
    
    document.getElementById('totalCombinations').textContent = totalCombinations;
    document.getElementById('masteredCount').textContent = masteredCount;
    document.getElementById('accuracyRate').textContent = accuracy + '%';
    document.getElementById('groupProgress').textContent = masteredGroups + '/' + totalGroups;
    
    // 更新顶部进度条
    const progressPercent = totalCombinations > 0 ? (masteredCount / totalCombinations) * 100 : 0;
    document.getElementById('masteredProgress').style.width = progressPercent + '%';
    document.getElementById('progressText').textContent = masteredCount + '/' + totalCombinations;
    
    // 更新顶部统计
    document.getElementById('headerMastered').textContent = masteredCount;
    document.getElementById('headerAccuracy').textContent = accuracy + '%';
    
    // 更新下一组学习提示
    const nextGroupIndex = findNextLearnGroup();
    if (nextGroupIndex >= 0) {
        const nextGroup = CombinationGroups[nextGroupIndex];
        document.getElementById('nextLearnText').textContent = `下一组: ${nextGroup.name}`;
    } else {
        document.getElementById('nextLearnText').textContent = '所有组合已学习完成！';
    }
}

// 找到下一个需要学习的分组
function findNextLearnGroup() {
    for (let i = 0; i < CombinationGroups.length; i++) {
        const group = CombinationGroups[i];
        const hasUnmastered = group.combinations.some(index => !CombinationsData[index].mastered);
        if (hasUnmastered) return i;
    }
    return -1;
}

// 初始化学习区块
function initStudySection() {
    const nextGroupIndex = findNextLearnGroup();
    if (nextGroupIndex >= 0) {
        CombinationsApp.currentGroup = nextGroupIndex;
    }
    
    updateGroupInfo();
    showCombination();
}

// 更新分组信息
function updateGroupInfo() {
    const group = CombinationGroups[CombinationsApp.currentGroup];
    document.getElementById('studyGroupName').textContent = group.name;
    document.getElementById('studyGroupDesc').textContent = group.combinations
        .map(i => CombinationsData[i].combination)
        .join(', ');
    
    const masteredInGroup = group.combinations.filter(i => CombinationsData[i].mastered).length;
    document.getElementById('studyGroupProgress').textContent = 
        masteredInGroup + '/' + group.combinations.length;
}

// 显示字母组合
function showCombination() {
    const group = CombinationGroups[CombinationsApp.currentGroup];
    const combinationIndex = group.combinations[CombinationsApp.currentCombination];
    const combination = CombinationsData[combinationIndex];
    
    // 更新显示
    document.getElementById('studyText').textContent = combination.combination;
    document.getElementById('studyPronunciation').textContent = combination.phonetic;
    document.getElementById('studySound').textContent = combination.sound;
    
    // 更新例词
    const examplesHTML = combination.examples.slice(0, 4).map(example => `
        <div class="example-word">
            <span class="word-text">${example.word}</span>
            <span class="word-meaning">${example.meaning || ''}</span>
        </div>
    `).join('');
    document.getElementById('studyExamples').innerHTML = examplesHTML;
    
    // 更新记忆技巧
    document.getElementById('studyTips').textContent = combination.tips;
    
    // 更新常见单词
    document.getElementById('studyCommon').textContent = combination.common ? combination.common.join(', ') : '暂无常见单词数据';
    
    // 更新按钮状态
    document.getElementById('prevBtn').disabled = CombinationsApp.currentCombination === 0;
    
    const isLastInGroup = CombinationsApp.currentCombination >= group.combinations.length - 1;
    document.getElementById('nextBtn').textContent = isLastInGroup ? '下一组 →' : '下一个 →';
    
    // 更新掌握状态
    updateMasteryButton(combination.mastered);
    
    // 自动播放发音
    if (CombinationsApp.settings.autoPlay) {
        playCombinationSound(combination.combination);
    }
}

// 上一个字母组合
function prevCombination() {
    if (CombinationsApp.currentCombination > 0) {
        CombinationsApp.currentCombination--;
        showCombination();
    }
}

// 下一个字母组合
function nextCombination() {
    const group = CombinationGroups[CombinationsApp.currentGroup];
    
    if (CombinationsApp.currentCombination < group.combinations.length - 1) {
        CombinationsApp.currentCombination++;
    } else {
        // 切换到下一组
        if (CombinationsApp.currentGroup < CombinationGroups.length - 1) {
            CombinationsApp.currentGroup++;
            CombinationsApp.currentCombination = 0;
            updateGroupInfo();
        } else {
            // 所有组合学习完成
            showSection('home');
            return;
        }
    }
    
    showCombination();
}

// 切换掌握状态
function toggleMastery() {
    const group = CombinationGroups[CombinationsApp.currentGroup];
    const combinationIndex = group.combinations[CombinationsApp.currentCombination];
    const combination = CombinationsData[combinationIndex];
    
    combination.mastered = !combination.mastered;
    updateMasteryButton(combination.mastered);
    updateGroupInfo();
    updateHomeStats();
    
    // 保存进度
    saveProgress();
}

// 更新掌握按钮状态
function updateMasteryButton(isMastered) {
    const btn = document.getElementById('masteryBtn');
    const icon = document.getElementById('masteryIcon');
    const text = document.getElementById('masteryText');
    
    if (isMastered) {
        btn.classList.add('mastered');
        icon.textContent = '✓';
        text.textContent = '已掌握';
    } else {
        btn.classList.remove('mastered');
        icon.textContent = '○';
        text.textContent = '标记为已掌握';
    }
}

// 播放字母组合发音
function playCombinationSound(combination) {
    // 使用Web Speech API
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(combination);
        utterance.lang = 'en-US';
        utterance.rate = 0.8;
        speechSynthesis.speak(utterance);
    }
}

// 重置练习
function resetPractice() {
    document.getElementById('practiceConfig').style.display = 'block';
    document.getElementById('practiceGame').classList.add('hidden');
    document.getElementById('practiceResult').classList.add('hidden');
    
    CombinationsApp.practiceQuestions = [];
    CombinationsApp.currentQuestion = 0;
    CombinationsApp.practiceScore = 0;
    CombinationsApp.totalAnswered = 0;
    CombinationsApp.correctAnswers = 0;
    CombinationsApp.wrongCombinations = [];
}

// 选择练习模式
function selectPracticeMode(mode) {
    CombinationsApp.practiceMode = mode;
    
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
}

// 开始练习会话
function startPracticeSession() {
    // 获取已学习的组合
    const learnedCombinations = CombinationsData.filter(c => c.learned);
    
    if (learnedCombinations.length < 2) {
        alert('请先学习至少2个字母组合再开始练习');
        return;
    }
    
    // 生成练习题目
    generatePracticeQuestions(learnedCombinations);
    
    // 切换界面
    document.getElementById('practiceConfig').style.display = 'none';
    document.getElementById('practiceGame').classList.remove('hidden');
    document.getElementById('practiceResult').classList.add('hidden');
    
    // 更新模式显示
    const modeNames = {
        'recognition': '认读练习',
        'chooseSound': '听音选拼写',
        'chooseWord': '听音选词',
        'spelling': '听写练习'
    };
    document.getElementById('practiceMode').textContent = modeNames[CombinationsApp.practiceMode];
    
    // 显示第一题
    showQuestion();
}

// 生成练习题目
function generatePracticeQuestions(combinations) {
    const questions = [];
    const count = CombinationsApp.settings.practiceCount;
    
    for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * combinations.length);
        const combination = combinations[randomIndex];
        
        let question;
        switch (CombinationsApp.practiceMode) {
            case 'recognition':
                question = generateRecognitionQuestion(combination, combinations);
                break;
            case 'chooseSound':
                question = generateChooseSoundQuestion(combination, combinations);
                break;
            case 'chooseWord':
                question = generateChooseWordQuestion(combination, combinations);
                break;
            case 'spelling':
                question = generateSpellingQuestion(combination);
                break;
        }
        
        questions.push(question);
    }
    
    CombinationsApp.practiceQuestions = questions;
}

// 生成认读题目
function generateRecognitionQuestion(correct, all) {
    const options = [correct];
    
    while (options.length < 4) {
        const random = all[Math.floor(Math.random() * all.length)];
        if (!options.includes(random)) {
            options.push(random);
        }
    }
    
    // 打乱选项顺序
    shuffleArray(options);
    
    return {
        type: 'recognition',
        combination: correct,
        options: options,
        correctIndex: options.indexOf(correct)
    };
}

// 生成听音选拼写题目
function generateChooseSoundQuestion(correct, all) {
    const options = [correct.combination];
    
    while (options.length < 4) {
        const random = all[Math.floor(Math.random() * all.length)];
        if (!options.includes(random.combination)) {
            options.push(random.combination);
        }
    }
    
    shuffleArray(options);
    
    return {
        type: 'chooseSound',
        combination: correct,
        options: options,
        correctIndex: options.indexOf(correct.combination)
    };
}

// 生成听音选词题目
function generateChooseWordQuestion(correct, all) {
    // 使用正确组合的例词
    const correctWord = correct.examples[Math.floor(Math.random() * correct.examples.length)];
    const options = [correctWord];
    
    // 从其他组合中选例词作为干扰项
    const otherCombinations = all.filter(c => c !== correct);
    while (options.length < 4 && otherCombinations.length > 0) {
        const randomCombo = otherCombinations[Math.floor(Math.random() * otherCombinations.length)];
        const randomWord = randomCombo.examples[Math.floor(Math.random() * randomCombo.examples.length)];
        if (!options.includes(randomWord)) {
            options.push(randomWord);
        }
    }
    
    // 如果选项不够，用其他常见单词补充
    while (options.length < 4) {
        const dummyWord = 'word' + options.length;
        options.push(dummyWord);
    }
    
    shuffleArray(options);
    
    return {
        type: 'chooseWord',
        combination: correct,
        word: correctWord,
        options: options,
        correctIndex: options.indexOf(correctWord)
    };
}

// 生成听写题目
function generateSpellingQuestion(correct) {
    const word = correct.examples[Math.floor(Math.random() * correct.examples.length)];
    return {
        type: 'spelling',
        combination: correct,
        word: word
    };
}

// 显示题目
function showQuestion() {
    if (CombinationsApp.currentQuestion >= CombinationsApp.practiceQuestions.length) {
        showPracticeResult();
        return;
    }
    
    const question = CombinationsApp.practiceQuestions[CombinationsApp.currentQuestion];
    
    // 更新进度
    document.getElementById('practiceProgress').textContent = 
        (CombinationsApp.currentQuestion + 1) + '/' + CombinationsApp.practiceQuestions.length;
    document.getElementById('practiceScore').textContent = CombinationsApp.practiceScore;
    
    // 隐藏反馈
    document.getElementById('practiceFeedback').classList.add('hidden');
    
    // 根据题目类型显示不同界面
    if (question.type === 'spelling') {
        document.getElementById('recognitionArea').classList.add('hidden');
        document.getElementById('spellingArea').classList.remove('hidden');
        
        document.getElementById('spellingWord').textContent = question.word;
        document.getElementById('spellingInput').value = '';
        document.getElementById('spellingInput').focus();
    } else {
        document.getElementById('recognitionArea').classList.remove('hidden');
        document.getElementById('spellingArea').classList.add('hidden');
        
        // 显示问题
        document.getElementById('questionText').textContent = question.combination.combination;
        
        // 显示选项
        const optionsGrid = document.getElementById('optionsGrid');
        optionsGrid.innerHTML = '';
        
        question.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'option-btn';
            
            if (question.type === 'chooseSound') {
                button.textContent = option;
            } else if (question.type === 'chooseWord') {
                button.textContent = option;
            } else {
                button.innerHTML = `
                    <div style="font-size: 1.5rem; margin-bottom: 5px">${option.combination}</div>
                    <div style="font-size: 0.8rem; color: var(--vb-text-muted)">${option.phonetic}</div>
                `;
            }
            
            button.onclick = () => checkAnswer(index);
            optionsGrid.appendChild(button);
        });
        
        // 自动播放发音
        if (CombinationsApp.settings.autoPlay) {
            playCombinationSound(question.combination.combination);
        }
    }
}

// 检查答案
function checkAnswer(selectedIndex) {
    if (CombinationsApp.isProcessing) return;
    CombinationsApp.isProcessing = true;
    
    const question = CombinationsApp.practiceQuestions[CombinationsApp.currentQuestion];
    const isCorrect = selectedIndex === question.correctIndex;
    
    // 更新统计
    CombinationsApp.totalAnswered++;
    if (isCorrect) {
        CombinationsApp.correctAnswers++;
        CombinationsApp.practiceScore += 10;
    } else {
        CombinationsApp.wrongCombinations.push(question.combination);
    }
    
    // 高亮正确和错误选项
    const options = document.querySelectorAll('.option-btn');
    options.forEach((btn, index) => {
        if (index === question.correctIndex) {
            btn.classList.add('correct');
        } else if (index === selectedIndex && !isCorrect) {
            btn.classList.add('wrong');
        }
        btn.onclick = null;
    });
    
    // 显示反馈
    showFeedback(isCorrect, question.combination);
    
    // 延迟后进入下一题
    setTimeout(() => {
        CombinationsApp.currentQuestion++;
        CombinationsApp.isProcessing = false;
        showQuestion();
    }, 1500);
}

// 检查拼写
function checkSpelling() {
    if (CombinationsApp.isProcessing) return;
    CombinationsApp.isProcessing = true;
    
    const input = document.getElementById('spellingInput').value.trim().toLowerCase();
    const question = CombinationsApp.practiceQuestions[CombinationsApp.currentQuestion];
    const isCorrect = input === question.combination.combination;
    
    // 更新统计
    CombinationsApp.totalAnswered++;
    if (isCorrect) {
        CombinationsApp.correctAnswers++;
        CombinationsApp.practiceScore += 10;
    } else {
        CombinationsApp.wrongCombinations.push(question.combination);
    }
    
    // 显示反馈
    showFeedback(isCorrect, question.combination);
    
    // 延迟后进入下一题
    setTimeout(() => {
        CombinationsApp.currentQuestion++;
        CombinationsApp.isProcessing = false;
        showQuestion();
    }, 1500);
}

// 显示反馈
function showFeedback(isCorrect, combination) {
    const feedback = document.getElementById('practiceFeedback');
    const icon = document.getElementById('feedbackIcon');
    const text = document.getElementById('feedbackText');
    const detail = document.getElementById('feedbackDetail');
    
    feedback.classList.remove('hidden');
    
    if (isCorrect) {
        icon.textContent = '✓';
        icon.className = 'feedback-icon correct';
        text.textContent = '正确！';
    } else {
        icon.textContent = '✗';
        icon.className = 'feedback-icon wrong';
        text.textContent = '错误！';
    }
    
    detail.textContent = `${combination.combination} 发 ${combination.phonetic} 音`;
}

// 播放当前发音
function playCurrentSound() {
    const question = CombinationsApp.practiceQuestions[CombinationsApp.currentQuestion];
    if (question) {
        playCombinationSound(question.combination.combination);
    }
}

// 显示练习结果
function showPracticeResult() {
    document.getElementById('practiceGame').classList.add('hidden');
    document.getElementById('practiceResult').classList.remove('hidden');
    
    const total = CombinationsApp.practiceQuestions.length;
    const correct = CombinationsApp.correctAnswers;
    const wrong = total - correct;
    const score = Math.round((correct / total) * 100);
    
    document.getElementById('resultScore').textContent = score;
    document.getElementById('resultCorrect').textContent = correct;
    document.getElementById('resultWrong').textContent = wrong;
}

// 重新开始练习
function restartPractice() {
    resetPractice();
}

// 筛选已掌握列表
function filterMastered(filter) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    
    renderMasteredList(filter);
}

// 渲染已掌握列表
function renderMasteredList(filter = 'all') {
    const masteredGrid = document.getElementById('masteredGrid');
    let mastered = CombinationsData.filter(c => c.mastered);
    
    if (filter === 'vowel') {
        mastered = mastered.filter(c => c.group === 'vowel');
    } else if (filter === 'consonant') {
        mastered = mastered.filter(c => c.group === 'consonant');
    }
    
    if (mastered.length === 0) {
        masteredGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--vb-text-muted);">
                <div style="font-size: 3rem; margin-bottom: 15px;">📭</div>
                <div>还没有掌握的字母组合</div>
            </div>
        `;
        return;
    }
    
    masteredGrid.innerHTML = mastered.map(combination => `
        <div class="mastered-item" onclick="viewCombination('${combination.combination}')">
            <div class="item-combination">${combination.combination}</div>
            <div class="item-phonetic">${combination.phonetic}</div>
            <div class="item-examples">
                ${combination.examples.slice(0, 3).map(example => `
                    <span class="example-tag">${example.word}</span>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// 查看字母组合详情
function viewCombination(combinationText) {
    const index = CombinationsData.findIndex(c => c.combination === combinationText);
    if (index === -1) return;
    
    // 找到所属分组
    for (let i = 0; i < CombinationGroups.length; i++) {
        if (CombinationGroups[i].combinations.includes(index)) {
            CombinationsApp.currentGroup = i;
            CombinationsApp.currentCombination = CombinationGroups[i].combinations.indexOf(index);
            break;
        }
    }
    
    showSection('study');
}

// 保存学习进度
function saveProgress() {
    const progress = {
        mastered: CombinationsData.filter(c => c.mastered).map(c => c.combination),
        stats: {
            totalAnswered: CombinationsApp.totalAnswered,
            correctAnswers: CombinationsApp.correctAnswers
        },
        settings: CombinationsApp.settings
    };
    
    try {
        localStorage.setItem('combinations-progress', JSON.stringify(progress));
    } catch (e) {
        console.error('保存进度失败:', e);
    }
}

// 加载学习进度
function loadProgress() {
    try {
        const saved = localStorage.getItem('combinations-progress');
        if (saved) {
            const progress = JSON.parse(saved);
            
            // 恢复掌握状态
            progress.mastered.forEach(combinationText => {
                const combination = CombinationsData.find(c => c.combination === combinationText);
                if (combination) {
                    combination.mastered = true;
                }
            });
            
            // 恢复统计
            CombinationsApp.totalAnswered = progress.stats.totalAnswered || 0;
            CombinationsApp.correctAnswers = progress.stats.correctAnswers || 0;
            
            // 恢复设置
            if (progress.settings) {
                Object.assign(CombinationsApp.settings, progress.settings);
            }
        }
    } catch (e) {
        console.error('加载进度失败:', e);
    }
}

// 应用设置
function applySettings() {
    document.getElementById('autoPlay').checked = CombinationsApp.settings.autoPlay;
    document.getElementById('showPhonetic').checked = CombinationsApp.settings.showPhonetic;
    document.getElementById('learnCount').value = CombinationsApp.settings.learnCount;
    document.getElementById('practiceCount').value = CombinationsApp.settings.practiceCount;
}

// 监听设置变化
function initSettingsListeners() {
    document.getElementById('autoPlay').addEventListener('change', function() {
        CombinationsApp.settings.autoPlay = this.checked;
        saveProgress();
    });
    
    document.getElementById('showPhonetic').addEventListener('change', function() {
        CombinationsApp.settings.showPhonetic = this.checked;
        saveProgress();
    });
    
    document.getElementById('learnCount').addEventListener('change', function() {
        CombinationsApp.settings.learnCount = parseInt(this.value);
        saveProgress();
    });
    
    document.getElementById('practiceCount').addEventListener('change', function() {
        CombinationsApp.settings.practiceCount = parseInt(this.value);
        saveProgress();
    });
}

// 工具函数：打乱数组
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 键盘快捷键
document.addEventListener('keydown', function(e) {
    if (CombinationsApp.currentSection === 'study') {
        if (e.key === 'ArrowLeft') {
            prevCombination();
        } else if (e.key === 'ArrowRight') {
            nextCombination();
        } else if (e.key === 'm' || e.key === 'M') {
            toggleMastery();
        }
    } else if (CombinationsApp.currentSection === 'practice') {
        if (e.key === '1' || e.key === '2' || e.key === '3' || e.key === '4') {
            const index = parseInt(e.key) - 1;
            const options = document.querySelectorAll('.option-btn');
            if (options[index]) {
                options[index].click();
            }
        } else if (e.key === 'Enter') {
            const spellingInput = document.getElementById('spellingInput');
            if (document.activeElement === spellingInput) {
                checkSpelling();
            }
        }
    }
});

// 加载字母组合数据
async function loadCombinationsData() {
    try {
        const response = await fetch('data/combinations.json');
        if (!response.ok) throw new Error('Failed to load combinations data');
        const rawData = await response.json();
        
        // 为每个组合添加学习状态字段
        CombinationsData = rawData.map((item, index) => ({
            ...item,
            combination: item.pattern,
            index: index,
            learned: false,
            mastered: false
        }));
        
        // 按分类创建分组
        const groupMap = {};
        CombinationsData.forEach((item, index) => {
            const key = item.category + '|' + item.subcategory;
            if (!groupMap[key]) {
                groupMap[key] = {
                    name: item.subcategory ? `${item.category} - ${item.subcategory}` : item.category,
                    category: item.category,
                    subcategory: item.subcategory,
                    combinations: []
                };
            }
            groupMap[key].combinations.push(index);
        });
        
        CombinationGroups = Object.values(groupMap);
        
        console.log('字母组合数据加载完成:', CombinationsData.length, '个组合,', CombinationGroups.length, '个分组');
    } catch (e) {
        console.error('加载字母组合数据失败:', e);
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', async function() {
    await loadCombinationsData();
    loadProgress();
    applySettings();
    initSettingsListeners();
    showSection('home');
});

// 定期自动保存
setInterval(saveProgress, 30000);
