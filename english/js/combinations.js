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
        'home': '学习详情',
        'overview': '学习',
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
            initStudySection();
            break;
        case 'overview':
            renderOverview();
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
    showSection('home');
}

// 开始练习
function startPractice() {
    showSection('practice');
}

// 返回首页
function goBack() {
    window.location.href = 'index.html';
}

// 组合一览：当前筛选分类
let OverviewCategory = 'all';

// 切换一览筛选
function filterOverview(category) {
    OverviewCategory = category;
    document.querySelectorAll('#overviewFilters .filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === category);
    });
    renderOverview();
}

// 渲染组合一览列表
function renderOverview() {
    const listEl = document.getElementById('overviewList');
    if (!listEl) return;

    const totalEl = document.getElementById('overviewTotal');
    if (totalEl) totalEl.textContent = CombinationsData.length;

    const keyword = (document.getElementById('overviewSearch').value || '').trim().toLowerCase();

    let items = CombinationsData.filter(c => {
        if (OverviewCategory !== 'all' && c.category !== OverviewCategory) return false;
        if (keyword) {
            const pattern = (c.pattern || '').toLowerCase();
            const desc = (c.description || '').toLowerCase();
            const examples = (c.examples || []).map(e => e.word).join(' ').toLowerCase();
            const common = (c.common || []).join(' ').toLowerCase();
            if (!pattern.includes(keyword) && !desc.includes(keyword) &&
                !examples.includes(keyword) && !common.includes(keyword)) {
                return false;
            }
        }
        return true;
    });

    if (items.length === 0) {
        listEl.innerHTML = '<div class="overview-empty">没有匹配的组合</div>';
        return;
    }

    // 按分类分组（元音/辅音）
    const groups = {};
    items.forEach(c => {
        const key = c.category || '其他';
        if (!groups[key]) groups[key] = [];
        groups[key].push(c);
    });

    listEl.innerHTML = Object.keys(groups).map(category => {
        const cards = groups[category].map(c => {
            const states = [
                c.mastered ? '<span class="ov-state mastered">已掌握</span>' : '',
                c.difficulty ? '<span class="ov-state diff">难度' + c.difficulty + '</span>' : ''
            ].join('');
            const examples = (c.examples || []).slice(0, 4).map(e =>
                '<span class="ov-example">' + e.word + '</span>'
            ).join('');
            return '' +
                '<div class="overview-card" onclick="startStudyFromOverview(\'' + c.id + '\')">' +
                    '<div class="ov-card-top">' +
                        '<div class="ov-pattern">' + (c.pattern || '') + '</div>' +
                        '<div class="ov-pronunciation">' + (c.pronunciation || '') + '</div>' +
                        '<div class="ov-states">' + states + '</div>' +
                    '</div>' +
                    '<div class="ov-subcategory">' + (c.subcategory || '') + '</div>' +
                    '<div class="ov-examples">' + examples + '</div>' +
                '</div>';
        }).join('');
        return '' +
            '<div class="overview-group">' +
                '<div class="overview-group-title">' + category + '（' + groups[category].length + '）</div>' +
                '<div class="overview-cards">' + cards + '</div>' +
            '</div>';
    }).join('');
}

// 从一览跳转到学习该组合
function startStudyFromOverview(combinationId) {
    const idx = CombinationsData.findIndex(c => c.id === combinationId);
    if (idx === -1) return;
    const groupIdx = CombinationGroups.findIndex(g => g.combinations.includes(idx));
    if (groupIdx === -1) return;
    showSection('home');
    // showSection 内部会调用 initStudySection 复位 currentGroup/currentCombination，
    // 因此必须在 showSection 之后再定位到目标组合
    CombinationsApp.currentGroup = groupIdx;
    CombinationsApp.currentCombination = CombinationGroups[groupIdx].combinations.indexOf(idx);
    updateGroupInfo();
    showCombination();
}

// 更新首页统计
function updateHomeStats() {
    const data = CombinationsData;
    const masteredCount = data.filter(c => c.mastered).length;
    const totalCombinations = data.length;
    const accuracy = CombinationsApp.totalAnswered > 0 
        ? Math.round((CombinationsApp.correctAnswers / CombinationsApp.totalAnswered) * 100) 
        : 0;
    
    // 更新顶部进度条
    const progressPercent = totalCombinations > 0 ? (masteredCount / totalCombinations) * 100 : 0;
    document.getElementById('masteredProgress').style.width = progressPercent + '%';
    document.getElementById('progressText').textContent = masteredCount + '/' + totalCombinations;
    
    // 更新顶部统计
    document.getElementById('headerMastered').textContent = masteredCount;
    document.getElementById('headerAccuracy').textContent = accuracy + '%';
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
    
    // 更新例词（显示 5-10 个，点击可发音）
    const examplesHTML = combination.examples.slice(0, 12).map(example => `
        <div class="example-word" onclick="speakWord('${example.word.replace(/'/g, "\\'")}')" title="点击发音">
            <span class="word-text">${example.word}</span>
            <span class="word-phonetic">${example.phonetic || ''}</span>
            <span class="word-meaning">${example.meaning || ''}</span>
            <span class="word-speak">🔊</span>
        </div>
    `).join('');
    document.getElementById('studyExamples').innerHTML = examplesHTML;
    
    // 更新记忆技巧
    document.getElementById('studyTips').textContent = combination.tips || combination.description || '暂无记忆技巧';
    

    // 更新按钮状态
    document.getElementById('prevBtn').disabled = CombinationsApp.currentCombination === 0;
    
    const isLastInGroup = CombinationsApp.currentCombination >= group.combinations.length - 1;
    document.getElementById('nextBtn').textContent = isLastInGroup ? '下一组 →' : '下一个 →';
    
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

// 发言：朗读当前字母组合的发音
function speakCurrentCombination() {
    const group = CombinationGroups[CombinationsApp.currentGroup];
    const combinationIndex = group.combinations[CombinationsApp.currentCombination];
    const combination = CombinationsData[combinationIndex];
    if (!combination) return;
    playCombinationSound(combination.combination);
}

// 朗读单个例词
function speakWord(word) {
    if (!word) return;
    if (window.audioManager && typeof window.audioManager.speak === 'function') {
        window.audioManager.speak(word, 'en-US');
    } else if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-US';
        utterance.rate = 0.8;
        speechSynthesis.speak(utterance);
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

// 练习当前组合：写出 5 个包含该组合的单词
function practiceCurrentCombination() {
    const group = CombinationGroups[CombinationsApp.currentGroup];
    const combinationIndex = group.combinations[CombinationsApp.currentCombination];
    const combination = CombinationsData[combinationIndex];
    if (!combination) return;
    
    showSection('practice');
    
    // 针对当前组合生成单题练习
    CombinationsApp.practiceQuestions = [{ type: 'words', combination: combination }];
    CombinationsApp.currentQuestion = 0;
    
    document.getElementById('practiceConfig').style.display = 'none';
    document.getElementById('practiceGame').classList.remove('hidden');
    document.getElementById('practiceResult').classList.add('hidden');
    
    showQuestion();
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

// 开始练习会话
function startPracticeSession() {
    // 获取练习用的组合：优先已掌握，不足 2 个时回退到全部组合
    let learnedCombinations = CombinationsData.filter(c => c.mastered);
    if (learnedCombinations.length < 2) {
        learnedCombinations = CombinationsData;
    }
    
    // 生成练习题目
    generatePracticeQuestions(learnedCombinations);
    
    // 切换界面
    document.getElementById('practiceConfig').style.display = 'none';
    document.getElementById('practiceGame').classList.remove('hidden');
    document.getElementById('practiceResult').classList.add('hidden');
    
    // 显示第一题
    showQuestion();
}

// 生成练习题目：每题给出一个组合，要求写出 5 个包含该组合的单词
function generatePracticeQuestions(combinations) {
    const questions = [];
    const count = CombinationsApp.settings.practiceCount;
    const pool = combinations.slice();
    
    for (let i = 0; i < count && pool.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        const combination = pool[randomIndex];
        pool.splice(randomIndex, 1);
        
        questions.push({
            type: 'words',
            combination: combination
        });
    }
    
    CombinationsApp.practiceQuestions = questions;
}

// 单词词典：word -> {phonetic, meaning}
let WordDictionary = {};

// 构建单词词典（从所有组合的例词中收集）
function buildWordDictionary() {
    WordDictionary = {};
    CombinationsData.forEach(combo => {
        (combo.examples || []).forEach(ex => {
            if (ex && ex.word) {
                const key = ex.word.toLowerCase();
                if (!WordDictionary[key]) {
                    WordDictionary[key] = {
                        phonetic: ex.phonetic || '',
                        meaning: ex.meaning || ''
                    };
                }
            }
        });
    });
}

// 查询单词释义和音标
function getWordInfo(word) {
    const key = (word || '').trim().toLowerCase();
    return WordDictionary[key] || null;
}

// 提取组合的纯字母部分（去掉首尾的 -）
function getCombinationCore(combination) {
    return (combination.combination || '').replace(/^-|-$/g, '');
}

// 判断单词是否包含该组合
function wordMatchesCombination(word, combination) {
    const core = getCombinationCore(combination);
    if (!core) return false;
    const w = word.toLowerCase();
    const pattern = combination.combination || '';
    
    if (pattern.startsWith('-')) {
        // 后缀组合（如 -tion）：单词以 core 结尾
        return w.endsWith(core);
    }
    if (pattern.endsWith('-')) {
        // 前缀组合（如 un-）：单词以 core 开头
        return w.startsWith(core);
    }
    // 普通组合（如 ee）：单词包含 core
    return w.includes(core);
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
    
    // 显示组合
    document.getElementById('wordsPattern').textContent = question.combination.combination;
    document.getElementById('wordsPhonetic').textContent = question.combination.phonetic || '';
    
    // 生成 5 个输入框
    const inputs = document.getElementById('wordsInputs');
    inputs.innerHTML = '';
    for (let i = 0; i < 5; i++) {
        const row = document.createElement('div');
        row.className = 'words-input-row';
        // 直接显示该组合例词的音标和中文释义作为提示
        const example = (question.combination.examples || [])[i];
        // 直接显示该组合例词的音标和中文释义作为提示，等待用户填入对应单词
        const hint = example && example.word
            ? `<span class="words-word-info has-info">${(example.phonetic || '')} ${(example.meaning || '')}</span>`
            : `<span class="words-word-info" id="wordInfo_${i}"></span>`;
        row.innerHTML = `
            <span class="words-input-num">${i + 1}</span>
            <input type="text" class="words-input" data-idx="${i}" placeholder="输入包含 ${question.combination.combination} 的单词" />
            ${hint}
        `;
        inputs.appendChild(row);
    }
    
    // 重置提交按钮
    const submitBtn = document.getElementById('wordsSubmitBtn');
    submitBtn.disabled = false;
    submitBtn.textContent = '提交';
    
    // 自动播放发音
    if (CombinationsApp.settings.autoPlay) {
        playCombinationSound(question.combination.combination);
    }
    
    // 聚焦第一个输入框
    const first = inputs.querySelector('.words-input');
    if (first) first.focus();
}

// 检查单词答案
function checkWords() {
    if (CombinationsApp.isProcessing) return;
    CombinationsApp.isProcessing = true;
    
    const question = CombinationsApp.practiceQuestions[CombinationsApp.currentQuestion];
    const inputs = document.querySelectorAll('.words-input');
    let correctCount = 0;
    
    inputs.forEach(input => {
        const word = input.value.trim().toLowerCase();
        const valid = word !== '' && wordMatchesCombination(word, question.combination);
        input.classList.remove('correct', 'wrong');
        if (valid) {
            input.classList.add('correct');
            correctCount++;
        } else {
            input.classList.add('wrong');
        }
    });
    
    // 更新统计
    CombinationsApp.totalAnswered++;
    if (correctCount === 5) {
        CombinationsApp.correctAnswers++;
        CombinationsApp.practiceScore += 10;
    } else {
        CombinationsApp.wrongCombinations.push(question.combination);
    }
    
    // 禁用提交按钮，防止重复提交
    document.getElementById('wordsSubmitBtn').disabled = true;
    
    // 显示反馈
    showWordsFeedback(correctCount, question.combination);
    
    // 延迟后进入下一题
    setTimeout(() => {
        CombinationsApp.currentQuestion++;
        CombinationsApp.isProcessing = false;
        showQuestion();
    }, 2000);
}

// 显示单词练习反馈
function showWordsFeedback(correctCount, combination) {
    const feedback = document.getElementById('practiceFeedback');
    const icon = document.getElementById('feedbackIcon');
    const text = document.getElementById('feedbackText');
    const detail = document.getElementById('feedbackDetail');
    
    feedback.classList.remove('hidden');
    
    if (correctCount === 5) {
        icon.textContent = '✓';
        icon.className = 'feedback-icon correct';
        text.textContent = '太棒了！全部正确！';
    } else if (correctCount >= 3) {
        icon.textContent = '✓';
        icon.className = 'feedback-icon correct';
        text.textContent = `不错！正确 ${correctCount}/5`;
    } else {
        icon.textContent = '✗';
        icon.className = 'feedback-icon wrong';
        text.textContent = `还需努力，正确 ${correctCount}/5`;
    }
    
    const core = getCombinationCore(combination);
    const examples = combination.examples.slice(0, 5).map(e => e.word).join('、');
    detail.textContent = `${combination.combination} 发 ${combination.phonetic} 音，包含 ${core} 的单词如：${examples}`;
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
        mastered = mastered.filter(c => c.category === '元音组合');
    } else if (filter === 'consonant') {
        mastered = mastered.filter(c => c.category === '辅音组合');
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
    
    showSection('home');
    // showSection 内部会调用 initStudySection 复位，必须在之后定位到目标组合
    for (let i = 0; i < CombinationGroups.length; i++) {
        if (CombinationGroups[i].combinations.includes(index)) {
            CombinationsApp.currentGroup = i;
            CombinationsApp.currentCombination = CombinationGroups[i].combinations.indexOf(index);
            break;
        }
    }
    updateGroupInfo();
    showCombination();
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
    if (CombinationsApp.currentSection === 'home') {
        if (e.key === 'ArrowLeft') {
            prevCombination();
        } else if (e.key === 'ArrowRight') {
            nextCombination();
        } else if (e.key === 'm' || e.key === 'M') {
            toggleMastery();
        }
    } else if (CombinationsApp.currentSection === 'practice') {
        if (e.key === 'Enter') {
            const wordsSubmitBtn = document.getElementById('wordsSubmitBtn');
            if (wordsSubmitBtn && !wordsSubmitBtn.disabled) {
                checkWords();
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
            phonetic: item.pronunciation,
            sound: item.pronunciation,
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
        
        buildWordDictionary();
        
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
    showSection('overview');
});

// 定期自动保存
setInterval(saveProgress, 30000);
