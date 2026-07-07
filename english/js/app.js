/**
 * Main application module
 * Handles initialization, user interaction, and game state management
 */

// ===== 国际化翻译文本 =====
const i18nTexts = {
    zh: {
        menuTitle: '📚 英语单词大冒险',
        menuSubtitle: '选择学习模式，开始你的英语之旅！',
        btnMonopoly: '🏠 单词大富翁',
        btnWordmatch: '🃏 单词配对',
        btnWordblast: '💣 单词大爆炸',
        playerName: '小学霸',
        playerLevel: '等级: 1',
        playerExp: '经验: 0/100',
        langLabel: '中/EN',
        // 游戏设置页
        setupTitle: '开始学习之旅',
        setupSubtitle: '选择年级和对手，开始你的英语冒险！',
        sectionGrade: '📚 选择年级',
        sectionUnit: '📖 选择单元',
        sectionAI: '🤖 AI对手',
        aiCount: 'AI数量:',
        allGrades: '全部年级',
        allUnits: '全部单元',
        btnStartGame: '开始游戏',
        btnBackMenu: '返回菜单',
        btnBack: '← 返回',
        // 游戏界面
        gameTitleMonopoly: '单词大富翁',
        gameTitleWordmatch: '单词配对',
        // 成就页面
        achievementsTitle: '成就徽章',
        achFirstStep: '第一步',
        achFirstStepDesc: '学会你的第一个单词',
        achWordStar: '单词之星',
        achWordStarDesc: '学会10个单词',
        achGrade1: '一年级毕业',
        achGrade1Desc: '完成所有一年级单词',
        // 单词详情
        btnPronounce: '🔊 朗读',
        mastery: '掌握度: ',
        // 错题本
        wrongbookTitle: '📓 错题本',
        btnWrongbook: '📓 错题本',
        filterAll: '全部',
        filterUnmastered: '未掌握',
        filterMastered: '已掌握',
        btnClearMastered: '清除已掌握',
        btnClearAll: '清空全部',
        wrongbookEmpty: '暂无错题，继续努力！',
        wrongbookFromMonopoly: '大富翁',
        wrongbookFromWordmatch: '配对',
        wrongbookFromWordblast: '大爆炸',
        wrongbookWrongCount: '错误次数',
        wrongbookMarkMastered: '标记掌握',
        wrongbookUnmarkMastered: '取消掌握',
        wrongbookDelete: '删除',
        wrongbookRootAffix: '词根词缀',
        confirmClearMastered: '确定清除所有已掌握的错题吗？',
        confirmClearAll: '确定清空所有错题吗？此操作不可撤销。',
        // 加载页面
        loadingSubtitle: '小学1-9年级英语学习游戏',
        loadingText: '正在准备你的学习之旅...',
        // 通知和确认
        alertSelectGrade: '请先选择一个年级！',
        confirmReset: '确定要重置所有游戏进度吗？此操作不可撤销。',
        notifyReset: '游戏进度已重置',
        notifyInitFail: '应用初始化失败，请刷新页面',
        // 大富翁游戏
        grade: '年级',
        difficulty: {
            easy: '简单',
            normal: '普通',
            hard: '困难',
            expert: '专家'
        },
        // 大富翁游戏界面
        selectGrade: '选择年级',
        gradeRange: '年级 1-9',
        selectUnit: '选择单元',
        round: '回合',
        player: '玩家',
        owned: '拥有:',
        eventLog: '事件日志',
        start: '起点',
        lucky: '幸运',
        chance: '机会',
        tax: '税',
        rollDice: '掷骰子',
        yourTurn: '你的回合',
        aiTurn: 'AI回合',
        bankrupt: '破产',
        roundX: '回合 {round}',
        property: '地产',
        sell: '卖出',
        buy: '购买',
        upgrade: '升级',
        notEnoughMoney: '金钱不足',
        pressToRoll: '按空格键掷骰子',
        pressToContinue: '按空格键继续',
        purchase: '购买',
        purchaseSuccess: '购买成功！',
        purchaseFail: '购买失败',
        upgradeSuccess: '升级成功！',
        upgradeFail: '升级失败',
        sellSuccess: '卖出成功！',
        taxPay: '缴纳税款',
        luckyMoney: '获得奖金',
        chanceEvent: '机会事件',
        go: '前进',
        jail: '监狱',
        goJail: '进监狱',
        freeParking: '免费停车',
        // 单词配对游戏
        wordmatchTitle: '单词配对',
        wordmatchDesc: '左右两列中英文配对，消除后随机出现新对，倒计时挑战',
        wordSource: '单词来源',
        selectWordSource: '选择单词范围',
        gameMode: '游戏模式',
        classicMode: '经典翻牌',
        classicDesc: '无限制',
        timedMode: '限时挑战',
        timedDesc: '争分夺秒',
        limitedMode: '步数限制',
        limitedDesc: '策略记忆',
        difficultyLevel: '难度等级',
        beginner: '入门',
        intermediate: '进阶',
        advanced: '挑战',
        master: '大师',
        endless: '无尽',
        matchType: '配对类型',
        wordMeaning: '单词 ↔ 中文释义',
        wordEnglish: '单词 ↔ 英文例句',
        theme: '主题皮肤',
        defaultTheme: '默认',
        forestTheme: '森林',
        spaceTheme: '太空',
        oceanTheme: '海洋',
        magicTheme: '魔法',
        gardenTheme: '花园',
        startGame: '开始游戏',
        score: '分数',
        combo: '连击',
        pairs: '配对',
        time: '时间',
        moves: '步数',
        pause: '暂停',
        restart: '重来',
        hint: '提示',
        back: '返回',
        memoryXSeconds: '记忆 {seconds} 秒！',
        gameStart: '游戏开始！',
        tryAgain: '再试试',
        minusTime: '-10秒！',
        plusMoves: '+5步！',
        levelPrefix: '等级: ',
        expPrefix: '经验: ',
        // 游戏结束界面
        gameWin: '恭喜过关！',
        gameFail: '挑战失败',
        starRating: '星评价',
        totalScore: '总分',
        maxCombo: '最大连击',
        flipCount: '翻牌次数',
        pairsCount: '配对数',
        playAgain: '再来一局',
        // 大富翁游戏
        purchase: '购买',
        purchaseSuccess: '购买成功！',
        purchaseFail: '购买失败',
        upgrade: '升级',
        upgradeSuccess: '升级成功！',
        upgradeFail: '升级失败',
        sell: '卖出',
        sellSuccess: '卖出成功！',
        taxPay: '缴纳税款',
        luckyMoney: '获得奖金',
        chanceEvent: '机会事件',
        go: '前进',
        jail: '监狱',
        goJail: '进监狱',
        freeParking: '免费停车',
        notEnoughMoney: '金钱不足',
        pressToRoll: '按空格键掷骰子',
        pressToContinue: '按空格键继续',
        extraTurn: '额外回合',
        forward: '前进',
        backward: '后退',
        steps: '步',
        maxUpgradesReached: '已达到最大升级',
        autoUpgraded: '自动升级！',
        chanceLanding: '机会降落！',
        nowUnowned: '现在无人拥有',
        becomesUnowned: '变为无主',
        downgradedTo: '降级到',
        stillOwnedBy: '仍属于',
        from: '来自',
        // 单词大爆炸
        wbTitle: '单词大爆炸',
        wbDesc: '点击配对中英文单词，炸掉它们！每关显示所有单词，时间逐渐缩短！',
        wbWordBank: '单词库',
        wbBlastClear: '爆炸消除',
        wbWordSource: '📚 单词来源',
        wbAllGrades: '全部年级',
        wbAllUnits: '全部单元',
        wbStartBtn: '开始爆炸',
        wbTip: '💡 先选中文，再选英文，配对成功即爆炸！',
        wbLevel: '关卡',
        wbTime: '时间',
        wbLimit: '限制',
        wbScore: '分数',
        wbCombo: '连击',
        wbRemaining: '剩余',
        wbPause: '⏸ 暂停',
        wbRestart: '🔄 重来',
        wbBack: '🏠 返回',
        wbWin: '恭喜过关！',
        wbTimeUp: '时间到！',
        wbStarRating: '星评价',
        wbTotalScore: '总分',
        wbMaxCombo: '最大连击',
        wbReachedLevel: '到达关卡',
        wbPlayAgain: '🔄 再来一局',
        wbPaused: '⏸ 已暂停',
        wbResumed: '▶ 继续',
        wbGradeX: '年级 {grade}',
        wbUnitX: '单元 {unit}',
        wbLevelUp: '🎉 第{level}关！时间缩短了！'
    },
    en: {
        menuTitle: '📚 English Word Adventure',
        menuSubtitle: 'Choose your learning mode and start your English journey!',
        btnMonopoly: '🏠 Word Monopoly',
        btnWordmatch: '🃏 Word Match',
        btnWordblast: '💣 Word Blast',
        playerName: 'Little Scholar',
        playerLevel: 'Level: 1',
        playerExp: 'EXP: 0/100',
        langLabel: '中/EN',
        // Game Setup
        setupTitle: 'Start Learning Journey',
        setupSubtitle: 'Choose grade and opponents to begin your English adventure!',
        sectionGrade: '📚 Select Grade',
        sectionUnit: '📖 Select Unit',
        sectionAI: '🤖 AI Opponents',
        aiCount: 'Number of AI:',
        allGrades: 'All Grades',
        allUnits: 'All Units',
        btnStartGame: 'Start Game',
        btnBackMenu: 'Back to Menu',
        btnBack: '← Back',
        // Game Screen
        gameTitleMonopoly: 'Word Monopoly',
        gameTitleWordmatch: 'Word Match',
        // Achievements
        achievementsTitle: 'Achievement Badges',
        achFirstStep: 'First Step',
        achFirstStepDesc: 'Learn your first word',
        achWordStar: 'Word Star',
        achWordStarDesc: 'Learn 10 words',
        achGrade1: 'Grade 1 Graduate',
        achGrade1Desc: 'Complete all Grade 1 words',
        // Word Detail
        btnPronounce: '🔊 Pronounce',
        mastery: 'Mastery: ',
        // Wrong Book
        wrongbookTitle: '📓 Error Book',
        btnWrongbook: '📓 Error Book',
        filterAll: 'All',
        filterUnmastered: 'Unmastered',
        filterMastered: 'Mastered',
        btnClearMastered: 'Clear Mastered',
        btnClearAll: 'Clear All',
        wrongbookEmpty: 'No errors yet, keep up the good work!',
        wrongbookFromMonopoly: 'Monopoly',
        wrongbookFromWordmatch: 'Match',
        wrongbookFromWordblast: 'Blast',
        wrongbookWrongCount: 'Wrong Count',
        wrongbookMarkMastered: 'Mark Mastered',
        wrongbookUnmarkMastered: 'Unmark Mastered',
        wrongbookDelete: 'Delete',
        wrongbookRootAffix: 'Root/Affix',
        confirmClearMastered: 'Clear all mastered words?',
        confirmClearAll: 'Clear all error words? This cannot be undone.',
        // Loading
        loadingSubtitle: 'English Learning Game for Grades 1-9',
        loadingText: 'Preparing your learning journey...',
        // Notifications
        alertSelectGrade: 'Please select a grade first!',
        confirmReset: 'Are you sure you want to reset all game progress? This action cannot be undone.',
        notifyReset: 'Game progress reset',
        notifyInitFail: 'App initialization failed, please refresh the page',
        // Monopoly
        grade: 'Grade',
        difficulty: {
            easy: 'Easy',
            normal: 'Normal',
            hard: 'Hard',
            expert: 'Expert'
        },
        // Monopoly Game UI
        selectGrade: 'Select Grade',
        gradeRange: 'Grade 1-9',
        selectUnit: 'Select Unit',
        round: 'Round',
        player: 'Player',
        owned: 'Owned:',
        eventLog: 'Event Log',
        start: 'Start',
        lucky: 'Lucky',
        chance: 'Chance',
        tax: 'Tax',
        rollDice: 'Roll Dice',
        yourTurn: 'Your Turn',
        aiTurn: 'AI Turn',
        bankrupt: 'Bankrupt',
        roundX: 'Round {round}',
        property: 'Property',
        sell: 'Sell',
        buy: 'Buy',
        upgrade: 'Upgrade',
        notEnoughMoney: 'Not enough money',
        pressToRoll: 'Press Space to roll dice',
        pressToContinue: 'Press Space to continue',
        purchase: 'Purchase',
        purchaseSuccess: 'Purchase successful!',
        purchaseFail: 'Purchase failed',
        upgradeSuccess: 'Upgrade successful!',
        upgradeFail: 'Upgrade failed',
        sellSuccess: 'Sold successfully!',
        taxPay: 'Pay tax',
        luckyMoney: 'Get bonus',
        chanceEvent: 'Chance event',
        go: 'Go',
        jail: 'Jail',
        goJail: 'Go to Jail',
        freeParking: 'Free Parking',
        // Word Match Game
        wordmatchTitle: 'Word Match',
        wordmatchDesc: 'Match Chinese meanings with English words in two columns, with countdown challenge',
        wordSource: 'Word Source',
        selectWordSource: 'Select word range',
        gameMode: 'Game Mode',
        classicMode: 'Classic',
        classicDesc: 'No limit',
        timedMode: 'Timed Challenge',
        timedDesc: 'Race against time',
        limitedMode: 'Move Limit',
        limitedDesc: 'Strategy memory',
        difficultyLevel: 'Difficulty',
        beginner: 'Beginner',
        intermediate: 'Intermediate',
        advanced: 'Advanced',
        master: 'Master',
        endless: 'Endless',
        matchType: 'Match Type',
        wordMeaning: 'Word ↔ Meaning',
        wordEnglish: 'Word ↔ Example',
        theme: 'Theme',
        defaultTheme: 'Default',
        forestTheme: 'Forest',
        spaceTheme: 'Space',
        oceanTheme: 'Ocean',
        magicTheme: 'Magic',
        gardenTheme: 'Garden',
        startGame: 'Start Game',
        score: 'Score',
        combo: 'Combo',
        pairs: 'Pairs',
        time: 'Time',
        moves: 'Moves',
        pause: 'Pause',
        restart: 'Restart',
        hint: 'Hint',
        back: 'Back',
        memoryXSeconds: 'Memorize for {seconds} seconds!',
        gameStart: 'Game Start!',
        tryAgain: 'Try again',
        minusTime: '-10s!',
        plusMoves: '+5 moves!',
        levelPrefix: 'Level: ',
        expPrefix: 'EXP: ',
        // Game End Screen
        gameWin: 'Congratulations!',
        gameFail: 'Challenge Failed',
        starRating: 'Star Rating',
        totalScore: 'Total Score',
        maxCombo: 'Max Combo',
        flipCount: 'Flip Count',
        pairsCount: 'Pairs Count',
        playAgain: 'Play Again',
        // Monopoly Game
        purchase: 'Purchase',
        purchaseSuccess: 'Purchase successful!',
        purchaseFail: 'Purchase failed',
        upgrade: 'Upgrade',
        upgradeSuccess: 'Upgrade successful!',
        upgradeFail: 'Upgrade failed',
        sell: 'Sell',
        sellSuccess: 'Sold successfully!',
        taxPay: 'Pay tax',
        luckyMoney: 'Get bonus',
        chanceEvent: 'Chance event',
        go: 'Go',
        jail: 'Jail',
        goJail: 'Go to Jail',
        freeParking: 'Free Parking',
        notEnoughMoney: 'Not enough money',
        pressToRoll: 'Press Space to roll dice',
        pressToContinue: 'Press Space to continue',
        extraTurn: 'Extra Roll',
        forward: 'Forward',
        backward: 'Backward',
        steps: 'steps',
        maxUpgradesReached: 'Max upgrades reached',
        autoUpgraded: 'auto-upgraded!',
        chanceLanding: 'Chance landing!',
        nowUnowned: 'is now unowned',
        becomesUnowned: 'becomes unowned',
        downgradedTo: 'downgraded to',
        stillOwnedBy: 'still owned by',
        from: 'from',
        // Word Blast
        wbTitle: 'Word Blast',
        wbDesc: 'Match Chinese and English word pairs to blast them! All words shown each level, time gets shorter!',
        wbWordBank: 'Word Bank',
        wbBlastClear: 'Blast Clear',
        wbWordSource: '📚 Word Source',
        wbAllGrades: 'All Grades',
        wbAllUnits: 'All Units',
        wbStartBtn: 'Start Blasting',
        wbTip: '💡 Select Chinese first, then English — match to blast!',
        wbLevel: 'Level',
        wbTime: 'Time',
        wbLimit: 'Limit',
        wbScore: 'Score',
        wbCombo: 'Combo',
        wbRemaining: 'Remaining',
        wbPause: '⏸ Pause',
        wbRestart: '🔄 Restart',
        wbBack: '🏠 Back',
        wbWin: 'Congratulations!',
        wbTimeUp: "Time's Up!",
        wbStarRating: 'Star Rating',
        wbTotalScore: 'Total Score',
        wbMaxCombo: 'Max Combo',
        wbReachedLevel: 'Level Reached',
        wbPlayAgain: '🔄 Play Again',
        wbPaused: '⏸ Paused',
        wbResumed: '▶ Resumed',
        wbGradeX: 'Grade {grade}',
        wbUnitX: 'Unit {unit}',
        wbLevelUp: '🎉 Level {level}! Time reduced!'
    }
};

// 全局翻译函数，供其他模块使用
function t(key) {
    // 如果app实例存在，使用app的翻译函数
    if (window.app && window.app.t) {
        return window.app.t(key);
    }
    // 否则使用默认语言（英文）
    const texts = i18nTexts['en'];
    if (!texts) return key;
    // Support dot notation for nested keys
    if (key.includes('.')) {
        const parts = key.split('.');
        let obj = texts;
        for (const part of parts) {
            if (obj && typeof obj === 'object' && part in obj) {
                obj = obj[part];
            } else {
                return key;
            }
        }
        return typeof obj === 'string' ? obj : key;
    }
    return texts && texts[key] !== undefined ? texts[key] : key;
}

class App {
    constructor() {
        this.gameEngine = null;
        this.currentScreen = 'loading';
        this.isInitialized = false;
        this.selectedMode = 'monopoly'; // User's selected game mode
        this.selectedGrade = null; // User's selected grade
        this.selectedUnit = 'all'; // User's selected unit
        this.lang = 'en'; // 默认英文
        
        // Bind event handlers
        this.bindEventHandlers();
    }
    
    /**
     * 初始化应用
     */
    async init() {
        try {
            console.log('App initialization started...');
            
            // Show loading screen
            this.showLoadingScreen();
            
            // Initialize word data
            await wordData.init();
            
            // Initialize audio manager
            await audioManager.preloadSounds();
            
            // Use global game engine instance
            this.gameEngine = gameEngine;
            await this.gameEngine.init();

            // Initialize word match game
            await wordMatchGame.init();
            
            // Load user progress
            this.loadProgress();
            
            // Load sound settings
            this.loadSoundSettings();
            
            // Load language settings
            this.loadLanguageSettings();
            
            // Hide loading screen, show main menu
            this.hideLoadingScreen();
            this.showMainMenu();
            
            this.isInitialized = true;
            console.log('App initialization complete');
            
        } catch (error) {
            console.error('App initialization failed:', error);
            this.showError(this.t('notifyInitFail'));
        }
    }
    
    /**
     * 显示加载屏幕
     */
    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'block';
        }
        
        // Simulate loading progress
        this.simulateLoading();
    }
    
    /**
     * 模拟加载进度
     */
    simulateLoading() {
        const progressBar = document.querySelector('.loading-progress');
        if (!progressBar) return;
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 10;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
            }
            progressBar.style.width = `${progress}%`;
        }, 100);
    }
    
    /**
     * 隐藏加载屏幕
     */
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
        
        const uiOverlay = document.getElementById('ui-overlay');
        if (uiOverlay) {
            uiOverlay.style.display = 'block';
        }
    }
    
    /**
     * 显示主菜单
     */
    showMainMenu() {
        this.hideAllScreens();
        
        const mainMenu = document.getElementById('main-menu');
        if (mainMenu) {
            mainMenu.classList.remove('hidden');
        }
        
        this.currentScreen = 'main-menu';
        this.updatePlayerInfo();
    }
    
    /**
     * Show game setup page (combined grade selection and AI settings)
     */
    showGameSetup(mode = 'monopoly') {
        this.selectedMode = mode; // Save selected mode
        this.hideAllScreens();

        if (mode === 'wordmatch' || mode === 'wordblast') {
            // WordMatch and WordBlast have their own setup screens
            this.showGameScreen(mode);
            return;
        }

        const gameSetup = document.getElementById('game-setup');
        if (gameSetup) {
            gameSetup.classList.remove('hidden');
        }

        this.currentScreen = 'game-setup';
        this.setupGameSetupListeners();

        // Initialize unit selection buttons (default to "All")
        this.updateUnitButtons(this.selectedGrade || 'all');
    }
    
    /**
     * 显示游戏界面
     */
    showGameScreen(mode) {
        this.hideAllScreens();
        
        const gameScreen = document.getElementById('game-screen');
        if (gameScreen) {
            gameScreen.classList.remove('hidden');
        }
        
        this.currentScreen = 'game-screen';
        
        // Update game title
        const gameTitle = document.querySelector('.game-title');
        if (gameTitle) {
            if (mode === 'wordmatch') gameTitle.textContent = this.t('gameTitleWordmatch');
            else if (mode === 'wordblast') gameTitle.textContent = this.t('wbTitle');
            else gameTitle.textContent = this.t('gameTitleMonopoly');
        }
        
        // 根据游戏模式显示或隐藏外部的game-header
        const gameHeader = gameScreen.querySelector('.game-header');
        if (gameHeader) {
            if (mode === 'wordmatch' || mode === 'wordblast') {
                gameHeader.style.display = 'none';
            } else {
                gameHeader.style.display = 'flex';
            }
        }
        
        // 切换游戏场景
        if (this.gameEngine) {
            this.gameEngine.switchScene(mode);
        }
    }
    
    /**
     * 显示成就界面
     */
    showAchievements() {
        this.hideAllScreens();
        
        const achievementsScreen = document.getElementById('achievements-screen');
        if (achievementsScreen) {
            achievementsScreen.classList.remove('hidden');
        }
        
        this.currentScreen = 'achievements-screen';
        this.updateAchievements();
    }
    
    /**
     * 隐藏所有屏幕
     */
    hideAllScreens() {
        const screens = document.querySelectorAll('.ui-screen');
        screens.forEach(screen => {
            screen.classList.add('hidden');
        });
    }
    
    /**
     * 绑定事件处理器
     */
    bindEventHandlers() {
        // 等待DOM加载完成
        document.addEventListener('DOMContentLoaded', () => {
            this.setupEventListeners();
        });
        
        // 如果DOM已经加载完成
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            setTimeout(() => this.setupEventListeners(), 100);
        }
    }
    
    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 主菜单按钮
        const monopolyBtn = document.getElementById('btn-monopoly');
        const wordmatchBtn = document.getElementById('btn-wordmatch');
        const wordblastBtn = document.getElementById('btn-wordblast');
        
        if (monopolyBtn) monopolyBtn.addEventListener('click', () => this.showGameSetup('monopoly'));
        if (wordmatchBtn) wordmatchBtn.addEventListener('click', () => this.showGameSetup('wordmatch'));
        if (wordblastBtn) wordblastBtn.addEventListener('click', () => this.showGameSetup('wordblast'));
        
        // 错题本按钮
        const wrongbookBtn = document.getElementById('btn-wrongbook');
        if (wrongbookBtn) wrongbookBtn.addEventListener('click', () => this.showWrongBook());
        
        // 音效切换按钮
        const soundToggleBtn = document.getElementById('btn-sound-toggle');
        if (soundToggleBtn) soundToggleBtn.addEventListener('click', () => this.toggleSound());
        
        // 返回按钮
        const backBtn = document.getElementById('btn-back');
        if (backBtn) backBtn.addEventListener('click', () => this.showMainMenu());
        
        const backAchievementsBtn = document.getElementById('btn-back-achievements');
        if (backAchievementsBtn) backAchievementsBtn.addEventListener('click', () => this.showMainMenu());
        
        // 模态框关闭按钮
        const closeModal = document.querySelector('.close-modal');
        if (closeModal) closeModal.addEventListener('click', () => this.closeModal());
        
        // 单词发音按钮
        const playWordBtn = document.getElementById('btn-play-word');
        if (playWordBtn) playWordBtn.addEventListener('click', () => this.playCurrentWord());
        
        // 键盘快捷键
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // 窗口关闭前保存进度
        window.addEventListener('beforeunload', () => this.saveProgress());
        
        console.log('Event listeners setup complete');
    }
    
    /**
     * 选择年级
     */
    selectGrade(grade) {
        console.log(`Selected grade: ${grade}`);
        
        // 设置当前年级
        if (this.gameEngine) {
            this.gameEngine.gameState.currentGrade = grade === 'all' ? 'all' : parseInt(grade);
            this.gameEngine.gameState.currentUnit = 'all';
        }
        
        // 更新年级选择按钮状态
        document.querySelectorAll('.grade-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.grade === grade);
        });
        
        // 保存选择的年级
        this.selectedGrade = grade;
        
        // 更新单元选择按钮
        this.updateUnitButtons(grade);
    }
    
    /**
     * 选择单元
     */
    selectUnit(unit) {
        console.log(`Selected unit: ${unit}`);
        
        if (this.gameEngine) {
            this.gameEngine.gameState.currentUnit = unit;
        }
        
        // 更新单元选择按钮状态
        document.querySelectorAll('.unit-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.unit === unit);
        });
        
        this.selectedUnit = unit;
    }
    
    /**
     * 更新单元选择按钮
     */
    updateUnitButtons(grade) {
        const unitGrid = document.getElementById('unit-grid');
        if (!unitGrid) return;
        
        const allUnitsText = this.t('allUnits');
        let html = `<button class="unit-btn active" data-unit="all" data-i18n="allUnits">${allUnitsText}</button>`;
        
        if (grade !== 'all') {
            const units = wordData.getUnitsByGrade(parseInt(grade));
            units.forEach(u => {
                const unitLabel = `${this.t('selectUnit')} ${u}`;
                html += `<button class="unit-btn" data-unit="${u}">${unitLabel}</button>`;
            });
        }
        
        unitGrid.innerHTML = html;
        
        // 重新绑定事件（使用闭包避免 e.target 问题）
        unitGrid.querySelectorAll('.unit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectUnit(btn.dataset.unit);
            });
        });
    }

    /**
     * 设置游戏设置页面的事件监听
     */
    setupGameSetupListeners() {
        // 年级选择按钮 - 使用事件委托避免重复绑定
        const gradeGrid = document.querySelector('.grade-grid');
        if (gradeGrid && !gradeGrid._listenersAttached) {
            gradeGrid.addEventListener('click', (e) => {
                const btn = e.target.closest('.grade-btn');
                if (!btn) return;
                const grade = btn.dataset.grade;
                if (grade) this.selectGrade(grade);
            });
            gradeGrid._listenersAttached = true;
        }
        
        // 电脑数量卡片 - 使用事件委托避免重复绑定
        const aiCountSection = document.querySelector('.ai-count-selector');
        if (aiCountSection && !aiCountSection._listenersAttached) {
            aiCountSection.addEventListener('click', (e) => {
                const card = e.target.closest('.ai-count-card');
                if (!card) return;
                const count = parseInt(card.dataset.count);
                this.setAiCount(count);
                
                // 添加点击动画效果
                card.classList.add('card-clicked');
                setTimeout(() => {
                    card.classList.remove('card-clicked');
                }, 300);
            });
            aiCountSection._listenersAttached = true;
        }

        // 难度选择器 - 使用事件委托避免重复绑定
        const aiList = document.getElementById('ai-list');
        if (aiList && !aiList._difficultyListenersAttached) {
            aiList.addEventListener('click', (e) => {
                const option = e.target.closest('.difficulty-option');
                if (!option) return;
                const container = option.closest('.difficulty-options');
                const options = container.querySelectorAll('.difficulty-option');
                const clickedValue = parseInt(option.dataset.value);
                
                // 单选模式：只激活点击的那一个，其他全部取消
                options.forEach(opt => {
                    opt.classList.toggle('active', parseInt(opt.dataset.value) === clickedValue);
                });
                
                // 添加选择动画效果
                const selectedOption = container.querySelector('.difficulty-option.active');
                if (selectedOption) {
                    selectedOption.classList.add('option-selected');
                    setTimeout(() => {
                        selectedOption.classList.remove('option-selected');
                    }, 500);
                }
            });
            aiList._difficultyListenersAttached = true;
        }

        // 开始游戏按钮
        const startBtn = document.getElementById('btn-start-game');
        if (startBtn) {
            startBtn.onclick = () => this.startGameWithSetup();
        }

        // 返回按钮
        const backBtn = document.getElementById('btn-back-setup-top');
        if (backBtn) {
            backBtn.onclick = () => this.showMainMenu();
        }
    }



    /**
     * 设置电脑数量
     */
    setAiCount(count) {
        // 更新卡片状态
        document.querySelectorAll('.ai-count-card').forEach(card => {
            card.classList.toggle('active', parseInt(card.dataset.count) === count);
        });

        // 显示/隐藏电脑项
        document.querySelectorAll('.ai-item').forEach((item, index) => {
            item.classList.toggle('hidden', index >= count);
        });
    }

    /**
     * 使用游戏设置开始游戏
     */
    startGameWithSetup() {
        // 检查是否选择了年级
        if (!this.selectedGrade) {
            alert(this.t('alertSelectGrade'));
            return;
        }
        
        // 获取电脑配置
        const aiCount = document.querySelector('.ai-count-card.active').dataset.count;
        const aiConfigs = [];

        for (let i = 0; i < parseInt(aiCount); i++) {
            const item = document.querySelector(`.ai-item[data-index="${i}"]`);
            const difficultySelector = item.querySelector('.difficulty-selector');
            // 获取激活的难度选项的值
            const activeOption = difficultySelector.querySelector('.difficulty-option.active');
            const difficulty = activeOption ? parseInt(activeOption.dataset.value) : 80;
            aiConfigs.push({
                name: `AI${i + 1}`,
                difficulty: difficulty
            });
        }

        // 保存AI配置和单元选择到gameEngine
        if (this.gameEngine) {
            this.gameEngine.aiConfigs = aiConfigs;
            this.gameEngine.gameState.currentUnit = this.selectedUnit || 'all';
        }

        // 开始游戏
        const currentMode = this.getCurrentMode();
        this.showGameScreen(currentMode);
    }
    
    /**
     * 获取当前游戏模式
     */
    getCurrentMode() {
        // 返回用户选择的游戏模式
        return this.selectedMode;
    }
    
    /**
     * 更新玩家信息
     */
    updatePlayerInfo() {
        if (!this.gameEngine) return;
        
        const gameState = this.gameEngine.gameState;
        
        // Update level display
        const levelElement = document.querySelector('.player-level');
        if (levelElement) {
            const levelPrefix = this.t('levelPrefix');
            levelElement.textContent = `${levelPrefix}${gameState.level}`;
        }
        
        // Update experience display
        const expElement = document.querySelector('.player-exp');
        if (expElement) {
            const expNeeded = gameState.level * 100;
            const expPrefix = this.t('expPrefix');
            expElement.textContent = `${expPrefix}${gameState.experience}/${expNeeded}`;
        }
    }
    
    /**
     * 加载音效设置
     */
    loadSoundSettings() {
        const settings = JSON.parse(localStorage.getItem('gameSettings') || '{}');
        // 默认声音开启：只有明确保存为 false 时才关闭
        const soundEnabled = settings.soundEnabled === false ? false : true;
        audioManager.setSoundEnabled(soundEnabled);
        this.updateSoundButton(soundEnabled);
    }
    
    /**
     * 切换音效开关
     */
    toggleSound() {
        const settings = JSON.parse(localStorage.getItem('gameSettings') || '{}');
        const soundEnabled = !(settings.soundEnabled !== false);
        settings.soundEnabled = soundEnabled;
        localStorage.setItem('gameSettings', JSON.stringify(settings));
        
        audioManager.setSoundEnabled(soundEnabled);
        this.updateSoundButton(soundEnabled);
        
        if (this.gameEngine) {
            this.gameEngine.gameState.settings.soundEnabled = soundEnabled;
        }
        
        if (soundEnabled) {
            audioManager.playClick();
        }
    }
    
    /**
     * 更新音效按钮图标
     */
    updateSoundButton(soundEnabled) {
        const soundToggleBtn = document.getElementById('btn-sound-toggle');
        if (soundToggleBtn) {
            soundToggleBtn.textContent = soundEnabled ? '🔊' : '🔇';
        }
    }
    
    // ===== 语言切换相关方法 =====
    
    /**
     * 加载语言设置
     */
    loadLanguageSettings() {
        const settings = JSON.parse(localStorage.getItem('gameSettings') || '{}');
        this.lang = settings.lang || 'en';
        
        // 更新滑动按钮状态
        const langToggle = document.getElementById('lang-toggle');
        if (langToggle) {
            langToggle.checked = (this.lang === 'en');
            langToggle.addEventListener('change', () => this.toggleLanguage());
        }
        
        // 应用语言
        this.applyLanguage();
    }
    
    /**
     * 切换语言
     */
    toggleLanguage() {
        this.lang = this.lang === 'zh' ? 'en' : 'zh';
        
        // 保存设置
        const settings = JSON.parse(localStorage.getItem('gameSettings') || '{}');
        settings.lang = this.lang;
        localStorage.setItem('gameSettings', JSON.stringify(settings));
        
        // 应用语言
        this.applyLanguage();
        
        // 播放点击音效
        audioManager.playClick();
    }
    
    /**
     * 应用语言到界面
     */
    applyLanguage() {
        const texts = i18nTexts[this.lang];
        if (!texts) return;
        
        // 更新所有带 data-i18n 属性的元素
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (texts[key] !== undefined) {
                el.textContent = texts[key];
            }
        });
        
        // 更新游戏标题（如果在游戏界面）
        if (this.currentScreen === 'game-screen') {
            const gameTitle = document.querySelector('.game-title');
            if (gameTitle) {
                if (this.selectedMode === 'wordmatch') gameTitle.textContent = texts.gameTitleWordmatch;
                else if (this.selectedMode === 'wordblast') gameTitle.textContent = texts.wbTitle;
                else gameTitle.textContent = texts.gameTitleMonopoly;
            }
        }
        
        // 更新难度标签
        this.updateDifficultyLabels();
        
        // 更新 HTML lang 属性
        document.documentElement.lang = this.lang === 'zh' ? 'zh-CN' : 'en';
        
        // 派发语言变更事件，供其他模块响应
        document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: this.lang } }));
    }
    
    /**
     * 更新难度标签
     */
    updateDifficultyLabels() {
        const texts = i18nTexts[this.lang];
        if (!texts || !texts.difficulty) return;
        
        const difficultyMap = {
            '70': texts.difficulty.easy,
            '80': texts.difficulty.normal,
            '90': texts.difficulty.hard,
            '100': texts.difficulty.expert
        };
        
        document.querySelectorAll('.diff-text').forEach(label => {
            const option = label.closest('.difficulty-option');
            if (option) {
                const value = option.dataset.value;
                if (difficultyMap[value]) {
                    label.textContent = difficultyMap[value];
                }
            }
        });
    }
    
    /**
     * 获取翻译文本
     * @param {string} key - 翻译键名
     * @returns {string} 翻译后的文本
     */
    t(key) {
        const texts = i18nTexts[this.lang];
        if (!texts) return key;
        // Support dot notation for nested keys (e.g. 'difficulty.normal')
        if (key.includes('.')) {
            const parts = key.split('.');
            let obj = texts;
            for (const part of parts) {
                if (obj && typeof obj === 'object' && part in obj) {
                    obj = obj[part];
                } else {
                    return key;
                }
            }
            return typeof obj === 'string' ? obj : key;
        }
        return texts[key] !== undefined ? texts[key] : key;
    }
    
    /**
     * 更新成就显示
     */
    updateAchievements() {
        if (!this.gameEngine) return;
        
        const achievements = document.querySelectorAll('.achievement');
        achievements.forEach(achievement => {
            const achievementId = achievement.dataset.id;
            if (this.gameEngine.gameState.achievements.has(achievementId)) {
                achievement.classList.remove('locked');
                achievement.classList.add('unlocked');
            } else {
                achievement.classList.remove('unlocked');
                achievement.classList.add('locked');
            }
        });
    }
    
    /**
     * 关闭模态框
     */
    closeModal() {
        const modal = document.getElementById('word-detail-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }
    
    /**
     * 播放当前单词
     */
    playCurrentWord() {
        const wordText = document.querySelector('.word-text');
        if (wordText) {
            const word = wordText.textContent;
            audioManager.speak(word, 'en-US');
        }
    }
    
    /**
     * 处理键盘按键
     */
    handleKeyPress(e) {
        switch (e.key) {
            case 'Escape':
                this.closeModal();
                break;
            case 'm':
            case 'M':
                if (this.currentScreen !== 'main-menu') {
                    this.showMainMenu();
                }
                break;
        }
    }
    
    /**
     * 显示通知
     */
    showNotification(message, type = 'success') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // 添加样式
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : '#2196F3'};
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
            font-family: 'Microsoft YaHei', sans-serif;
        `;
        
        document.body.appendChild(notification);
        
        // 3秒后移除
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    /**
     * 显示错误信息
     */
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    /**
     * 保存游戏进度
     */
    saveProgress() {
        if (!this.gameEngine) return;
        
        const progress = {
            level: this.gameEngine.gameState.level,
            experience: this.gameEngine.gameState.experience,
            wordsLearned: Array.from(this.gameEngine.gameState.wordsLearned),
            achievements: Array.from(this.gameEngine.gameState.achievements),
            score: this.gameEngine.gameState.score,
            lastPlayed: new Date().toISOString()
        };
        
        localStorage.setItem('gameProgress', JSON.stringify(progress));
        console.log('Game progress saved');
    }
    
    /**
     * 加载游戏进度
     */
    loadProgress() {
        try {
            const progress = JSON.parse(localStorage.getItem('gameProgress') || '{}');
            
            if (this.gameEngine && progress) {
                this.gameEngine.gameState.level = progress.level || 1;
                this.gameEngine.gameState.experience = progress.experience || 0;
                this.gameEngine.gameState.score = progress.score || 0;
                
                if (progress.wordsLearned) {
                    this.gameEngine.gameState.wordsLearned = new Set(progress.wordsLearned);
                }
                
                if (progress.achievements) {
                    this.gameEngine.gameState.achievements = new Set(progress.achievements);
                }
            }
            
            console.log('Game progress loaded');
        } catch (error) {
            console.warn('Failed to load game progress:', error);
        }
    }
    
    /**
     * 重置游戏进度
     */
    resetProgress() {
        if (confirm(this.t('confirmReset'))) {
            localStorage.removeItem('gameProgress');
            
            if (this.gameEngine) {
                this.gameEngine.gameState = {
                    currentGrade: null,
                    currentMode: null,
                    score: 0,
                    level: 1,
                    experience: 0,
                    wordsLearned: new Set(),
                    achievements: new Set(),
                    settings: this.gameEngine.gameState.settings
                };
            }
            
            this.updatePlayerInfo();
            this.showNotification(this.t('notifyReset'));
        }
    }
    
    /**
     * 获取游戏统计信息
     */
    getGameStats() {
        if (!this.gameEngine) return null;
        
        const gameState = this.gameEngine.gameState;
        const wordStats = wordData.getStats();
        
        return {
            playerLevel: gameState.level,
            playerExperience: gameState.experience,
            totalWordsLearned: gameState.wordsLearned.size,
            totalWordsAvailable: wordStats.totalWords,
            completionPercentage: Math.round((gameState.wordsLearned.size / wordStats.totalWords) * 100),
            achievementsUnlocked: gameState.achievements.size,
            totalAchievements: 10, // Assume 10 achievements
            totalScore: gameState.score
        };
    }
    
    /**
     * 显示错题本界面
     */
    showWrongBook() {
        this.hideAllScreens();
        const screen = document.getElementById('wrongbook-screen');
        if (screen) screen.classList.remove('hidden');
        this.currentScreen = 'wrongbook-screen';
        this.currentWrongBookFilter = 'all';
        this.quizMode = false; // 初始化测验模式为关闭
        this.renderWrongBookList();
        this.setupWrongBookListeners();
    }
    
    /**
     * 渲染错题列表
     */
    renderWrongBookList() {
        const listContainer = document.getElementById('wrongbook-list');
        const statsContainer = document.getElementById('wrongbook-stats');
        if (!listContainer || !statsContainer) return;
        
        const stats = wrongBook.getStats();
        const filter = this.currentWrongBookFilter || 'all';
        let words;
        
        if (filter === 'unmastered') {
            words = wrongBook.getUnmasteredWords();
        } else if (filter === 'mastered') {
            words = wrongBook.getMasteredWords();
        } else {
            words = wrongBook.getAll();
        }
        
        // 计算掌握率
        const masteryRate = stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0;
        
        // 增强统计卡片
        statsContainer.innerHTML = `
            <div class="wrongbook-stat-card">
                <div class="wrongbook-stat-number">${stats.total}</div>
                <div class="wrongbook-stat-label">${this.t('filterAll')}</div>
                <div class="wrongbook-stat-progress">
                    <div class="wrongbook-progress-bar">
                        <div class="wrongbook-progress-fill" style="width: ${masteryRate}%"></div>
                    </div>
                    <span class="wrongbook-progress-text">${masteryRate}%</span>
                </div>
            </div>
            <div class="wrongbook-stat-card">
                <div class="wrongbook-stat-number">${stats.unmastered}</div>
                <div class="wrongbook-stat-label">${this.t('filterUnmastered')}</div>
                <div class="wrongbook-stat-icon">📚</div>
            </div>
            <div class="wrongbook-stat-card">
                <div class="wrongbook-stat-number">${stats.mastered}</div>
                <div class="wrongbook-stat-label">${this.t('filterMastered')}</div>
                <div class="wrongbook-stat-icon">✅</div>
            </div>
        `;
        
        if (words.length === 0) {
            listContainer.innerHTML = `
                <div class="wrongbook-empty">
                    <div class="wrongbook-empty-icon">📖</div>
                    <div class="wrongbook-empty-text">${this.t('wrongbookEmpty')}</div>
                    <div class="wrongbook-empty-hint">去游戏中挑战单词吧！</div>
                </div>`;
            return;
        }
        
        const sourceNames = { 
            monopoly: this.t('wrongbookFromMonopoly'), 
            wordmatch: this.t('wrongbookFromWordmatch'), 
            wordblast: this.t('wrongbookFromWordblast') 
        };
        
        // 生成错题卡片
        listContainer.innerHTML = words.map((item, index) => {
            const mc = item.mastered ? ' mastered' : '';
            const mt = item.mastered ? this.t('wrongbookUnmarkMastered') : this.t('wrongbookMarkMastered');
            const mi = item.mastered ? '✅' : '⬜';
            
            // 音标和朗读按钮
            const phoneticHtml = item.phonetic ? `
                <div class="wrongbook-phonetic">
                    <span>${item.phonetic}</span>
                    <button class="wrongbook-speak-btn" data-word="${item.word}" title="朗读单词">🔊</button>
                </div>` : `
                <div class="wrongbook-phonetic">
                    <button class="wrongbook-speak-btn" data-word="${item.word}" title="朗读单词">🔊</button>
                </div>`;
            
            // 词根词缀
            const rootAffixHtml = item.rootAffix ? `
                <div class="wrongbook-rootAffix">
                    <span class="wrongbook-rootAffix-label">${this.t('wrongbookRootAffix')}:</span> 
                    ${item.rootAffix}
                </div>` : '';
            
            // 例句
            const exampleHtml = item.example ? `
                <div class="wrongbook-example">"${item.example}"</div>` : '';
            
            // 错误次数进度条
            const wrongCount = item.wrongCount || 1;
            const maxWrong = 10; // 假设最大错误次数为10
            const wrongPercent = Math.min((wrongCount / maxWrong) * 100, 100);
            
            // 时间格式化
            const lastWrongTime = item.lastWrongTime ? new Date(item.lastWrongTime).toLocaleDateString() : '';
            
            return `
                <div class="wrongbook-item${mc}" data-word="${item.word}" style="animation-delay: ${index * 0.05}s">
                    <div class="wrongbook-item-header">
                        <div class="wrongbook-word${item.mastered ? ' mastered-text' : ''}">${item.word}</div>
                        <div class="wrongbook-badges">
                            <span class="wrongbook-badge from-${item.from}">${sourceNames[item.from] || item.from}</span>
                            ${item.mastered ? '<span class="wrongbook-badge mastered-badge">已掌握</span>' : ''}
                        </div>
                    </div>
                    ${phoneticHtml}
                    <div class="wrongbook-meaning">${item.meaning}</div>
                    ${rootAffixHtml}
                    ${exampleHtml}
                    <div class="wrongbook-meta">
                        <div class="wrongbook-wrong-info">
                            <span class="wrongbook-count">${this.t('wrongbookWrongCount')}: ${wrongCount}</span>
                            <div class="wrongbook-wrong-bar">
                                <div class="wrongbook-wrong-fill" style="width: ${wrongPercent}%"></div>
                            </div>
                        </div>
                        ${lastWrongTime ? `<span class="wrongbook-time">${lastWrongTime}</span>` : ''}
                    </div>
                    <div class="wrongbook-actions-cell">
                        <button class="wrongbook-action-btn-small success" data-word="${item.word}" data-mastered="${item.mastered}">
                            ${mi} ${mt}
                        </button>
                        <button class="wrongbook-action-btn-small danger" data-word="${item.word}">
                            🗑️ ${this.t('wrongbookDelete')}
                        </button>
                    </div>
                </div>`;
        }).join('');
    }
    
    /**
     * 设置错题本事件监听器
     */
    setupWrongBookListeners() {
        const backBtn = document.getElementById('btn-back-wrongbook');
        if (backBtn) backBtn.onclick = () => this.showMainMenu();
        
        // 筛选按钮事件
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.onclick = (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentWrongBookFilter = e.target.dataset.filter;
                this.renderWrongBookList();
            };
        });
        
        // 测验模式切换按钮
        const quizToggleBtn = document.getElementById('btn-quiz-toggle');
        if (quizToggleBtn) {
            quizToggleBtn.onclick = () => {
                this.quizMode = !this.quizMode;
                const container = document.querySelector('.wrongbook-container');
                const btnText = document.getElementById('quiz-btn-text');
                
                if (this.quizMode) {
                    // 开启测验模式
                    container.classList.add('quiz-mode');
                    quizToggleBtn.classList.add('active');
                    btnText.textContent = '结束测验';
                    
                    // 添加测验提示
                    let hint = document.querySelector('.wrongbook-quiz-hint');
                    if (!hint) {
                        hint = document.createElement('div');
                        hint.className = 'wrongbook-quiz-hint';
                        hint.textContent = '📝 测验模式：只显示单词和音标，回忆释义后点击结束测验';
                        const list = document.getElementById('wrongbook-list');
                        if (list) list.parentNode.insertBefore(hint, list);
                    }
                    
                    this.showWrongbookNotification('测验开始！只显示单词和音标', 'info');
                } else {
                    // 关闭测验模式
                    container.classList.remove('quiz-mode');
                    quizToggleBtn.classList.remove('active');
                    btnText.textContent = '开始测验';
                    
                    // 移除测验提示
                    const hint = document.querySelector('.wrongbook-quiz-hint');
                    if (hint) hint.remove();
                    
                    this.showWrongbookNotification('测验结束！所有内容已恢复显示', 'success');
                }
            };
        }
        
        // 清除已掌握按钮
        const clearMasteredBtn = document.getElementById('btn-clear-mastered');
        if (clearMasteredBtn) clearMasteredBtn.onclick = () => {
            if (confirm(this.t('confirmClearMastered'))) { 
                wrongBook.clearMastered(); 
                this.renderWrongBookList(); 
                this.showWrongbookNotification('已清除所有已掌握的单词', 'success');
            }
        };
        
        // 清除全部按钮
        const clearAllBtn = document.getElementById('btn-clear-all');
        if (clearAllBtn) clearAllBtn.onclick = () => {
            if (confirm(this.t('confirmClearAll'))) { 
                wrongBook.clearAll(); 
                this.renderWrongBookList(); 
                this.showWrongbookNotification('已清空错题本', 'success');
            }
        };
        
        // 列表容器事件委托
        const listContainer = document.getElementById('wrongbook-list');
        if (listContainer) {
            listContainer.onclick = (e) => {
                const target = e.target.closest('button');
                if (!target) return;
                
                // 朗读按钮
                if (target.classList.contains('wrongbook-speak-btn')) {
                    e.stopPropagation();
                    const word = target.dataset.word;
                    if (word && typeof audioManager !== 'undefined') {
                        audioManager.speak(word, 'en-US');
                        // 添加朗读动画
                        target.classList.add('speaking');
                        setTimeout(() => target.classList.remove('speaking'), 1000);
                    }
                    return;
                }
                
                // 掌握/取消掌握按钮
                if (target.classList.contains('wrongbook-action-btn-small') && target.classList.contains('success')) {
                    const word = target.dataset.word;
                    const item = target.closest('.wrongbook-item');
                    
                    if (target.dataset.mastered === 'true') {
                        wrongBook.unmarkMastered(word);
                        this.showWrongbookNotification(`已取消掌握: ${word}`, 'info');
                    } else {
                        wrongBook.markMastered(word);
                        // 添加掌握成功动画
                        if (item) {
                            item.classList.add('mastered-success');
                            setTimeout(() => item.classList.remove('mastered-success'), 500);
                        }
                        this.showWrongbookNotification(`已掌握: ${word}`, 'success');
                    }
                    this.renderWrongBookList();
                    return;
                }
                
                // 删除按钮
                if (target.classList.contains('wrongbook-action-btn-small') && target.classList.contains('danger')) {
                    const word = target.dataset.word;
                    const item = target.closest('.wrongbook-item');
                    
                    // 添加删除确认动画
                    if (item) {
                        item.classList.add('delete-confirm');
                        setTimeout(() => {
                            wrongBook.removeWrongWord(word);
                            this.renderWrongBookList();
                            this.showWrongbookNotification(`已删除: ${word}`, 'warning');
                        }, 300);
                    } else {
                        wrongBook.removeWrongWord(word);
                        this.renderWrongBookList();
                    }
                    return;
                }
            };
            
            // 卡片点击展开/收起详情
            listContainer.addEventListener('click', (e) => {
                const item = e.target.closest('.wrongbook-item');
                if (!item || e.target.closest('button')) return;
                
                // 切换卡片展开状态
                item.classList.toggle('expanded');
            });
        }
    }
    
    /**
     * 显示错题本通知
     */
    showWrongbookNotification(message, type = 'info') {
        // 移除现有通知
        const existing = document.querySelector('.wrongbook-notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = `wrongbook-notification wrongbook-notification-${type}`;
        notification.innerHTML = `
            <span class="wrongbook-notification-icon">${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️'}</span>
            <span class="wrongbook-notification-text">${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // 动画显示
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });
        
        // 自动隐藏
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Create global app instance
const app = new App();
window.app = app;

// Initialize app after page load
window.addEventListener('load', () => {
    app.init().catch(error => {
        console.error('App startup failed:', error);
    });
});

// Export module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { App, app };
}