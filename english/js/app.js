/**
 * Main application module
 * Handles initialization, user interaction, and game state management
 */

// ===== 国际化翻译文本 =====
const i18nTexts = {
    zh: {
        menuTitle: '📚 英语单词大冒险',
        menuSubtitle: '选择学习模式，开始你的英语之旅！',
        btnVocabulary: '📚 记单词',
        btnMonopoly: '🏠 单词大富翁',
        btnWordmatch: '🃏 单词配对',
        btnWordblast: '✏️ 单词填空',
        playerName: '小学霸',
        playerLevel: '等级: 1',
        playerExp: '经验: 0/100',
        langLabel: '中/EN',
        // 游戏设置页
        setupTitle: '单词大富翁',
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
        btnExitGame: '退出游戏',
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
        // 单词库
        wrongbookTitle: '📖 单词库',
        btnWrongbook: '📖 单词库',
        filterAll: '全部',
        filterUnmastered: '未掌握',
        filterMastered: '已掌握',
        btnClearMastered: '清除已掌握',
        btnClearAll: '清空全部',
        wrongbookEmpty: '暂无错题，继续努力！',
        wrongbookFromMonopoly: '大富翁',
        wrongbookFromWordmatch: '配对',
        wrongbookFromWordblast: '填空',
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
        // 大富翁事件日志
        logPlayerRolled: '玩家掷了 {steps}',
        logPlayerPassedStart: '玩家经过起点 +$100',
        logPlayerOccupied: '玩家占领了 "{word}" +$100',
        logPlayerOccupiedFail: '玩家占领失败，罚款 -$100',
        logPlayerChallengeWon: '玩家赢得挑战，支付租金 -{price}',
        logPlayerUpgradeSuccess: '玩家升级了 "{word}" → Lv.{level} -{cost}',
        logPlayerUpgradeFail: '玩家升级失败 "{word}" 罚款 -{fine}',
        logPlayerWrong: '玩家答错了，罚款 -$100',
        logPlayerWrongDoubleRent: '玩家答错了，支付双倍租金 -${price}',
        logAiRolled: '{name} 掷了 {steps}',
        logAiPassedStart: '{name} 经过起点 +$100',
        logAiOccupied: '{name} 占领了 "{word}" +$100',
        logAiOccupiedFail: '{name} 占领失败，罚款 $100',
        logAiAnswerCorrect: '{name} 答对了，支付租金给 {recipient} {price}',
        logAiAnswerWrong: '{name} 答错了，支付双倍租金给 {recipient} {price}',
        logAiUpgradeSuccess: '{name} 升级了 "{word}" → Lv.{level} -{cost}',
        logAiUpgradeFail: '{name} 升级失败 "{word}" 罚款 -{fine}',
        logAiMaxUpgrades: '{name} "{word}" 已达到最大升级',
        logAiInsufficientFunds: '{name} 资金不足无法升级 "{word}"',
        logAiTax: '{name} 缴税 -{amount}',
        logDisasterStrike: '{emoji} {name} 来袭！',
        logDisasterPlayerUnowned: '{name}: 玩家的 "{word}" 变为无主',
        logDisasterPlayerDowngraded: '{name}: 玩家的 "{word}" 降级到 Lv.{level}',
        logDisasterAiUnowned: '{name}: {ai}的 "{word}" 变为无主',
        logDisasterAiDowngraded: '{name}: {ai}的 "{word}" 降级到 Lv.{level}',
        logPlayerBankrupt: '玩家破产！',
        logAiBankrupt: '{name} 破产！释放了 {count} 个格子',
        logAllAiBankrupt: '所有AI破产，玩家获胜！',
        logAutoUpgrade: '{name} 自动升级了 "{word}" → Lv.{level}',
        logChanceUnowned: '机会降落: "{word}" 从 {owner} 变为无主',
        logChanceDowngraded: '机会降落: "{word}" 从 {owner} 降级到 Lv.{level}',
        logPlayerTax: '玩家缴税 -{amount}',
        logPlayerSold: '玩家出售了 "{word}" +{price}',
        logPlayerSellFail: '玩家出售失败 "{word}" 罚款 -{fine}',
        yourProperty: '你的地产',
        upgradeCost: '升级费用',
        afterUpgrade: '升级后',
        sellPrice: '售价',
        rent: '租金',
        level: '等级',
        // 单词大爆炸
        wbTitle: '单词填空',
        wbDesc: '看中文意思和英文句子，输入对应的英文单词！支持发音和自动朗读句子！',
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
        wbTotalScore: '答对数量',
        wbMaxCombo: '答错数量',
        wbReachedLevel: '到达关卡',
        wbPlayAgain: '🔄 再来一局',
        wbPaused: '⏸ 已暂停',
        wbResumed: '▶ 继续',
        wbGradeX: '年级 {grade}',
        wbUnitX: '单元 {unit}',
        wbLevelUp: '🎉 第{level}关！时间缩短了！',
        wbInputPlaceholder: '输入对应的英文单词...',
        wbSubmit: '提交',
        wbTryAgain: '再试试！',
        wbSkip: '跳过',
        wbSkipHint: '跳过此单词并计入单词库',
        wbCorrect: '答对',
        wbWrong: '答错',
        wbPlayWord: '读单词',
        wbPlaySentence: '读句子',
        // 排行榜
        leaderboard: '排行榜',
        leaderboardTitle: '🏆 排行榜',
        lbMonopoly: '大富翁',
        lbWordmatch: '配对',
        lbWordblast: '大爆炸',
        lbRank: '排名',
        lbName: '玩家',
        lbScore: '分数',
        lbGrade: '年级',
        lbUnit: '单元',
        lbCombo: '连击',
        lbTime: '用时',
        lbDate: '日期',
        lbNoData: '暂无排行数据',
        lbEnterName: '请输入你的名字：',
        lbSaved: '成绩已保存到排行榜！',
        lbSaveScore: '保存成绩'
    },
    en: {
        menuTitle: '📚 English Word Adventure',
        menuSubtitle: 'Choose your learning mode and start your English journey!',
        btnVocabulary: '📚 Vocabulary',
        btnMonopoly: '🏠 Word Monopoly',
        btnWordmatch: '🃏 Word Match',
        btnWordblast: '✏️ Word Fill',
        playerName: 'Little Scholar',
        playerLevel: 'Level: 1',
        playerExp: 'EXP: 0/100',
        langLabel: '中/EN',
        // Game Setup
        setupTitle: 'Word Monopoly',
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
        btnExitGame: 'Exit Game',
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
        // Word Library
        wrongbookTitle: '📖 Word Library',
        btnWrongbook: '📖 Word Library',
        filterAll: 'All',
        filterUnmastered: 'Unmastered',
        filterMastered: 'Mastered',
        btnClearMastered: 'Clear Mastered',
        btnClearAll: 'Clear All',
        wrongbookEmpty: 'No errors yet, keep up the good work!',
        wrongbookFromMonopoly: 'Monopoly',
        wrongbookFromWordmatch: 'Match',
        wrongbookFromWordblast: 'Fill',
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
        // Monopoly Event Log
        logPlayerRolled: 'Player rolled {steps}',
        logPlayerPassedStart: 'Player passed Start +$100',
        logPlayerOccupied: 'Player occupied "{word}" +$100',
        logPlayerOccupiedFail: 'Player occupation failed, fined -$100',
        logPlayerChallengeWon: 'Player won challenge, pay rent -{price}',
        logPlayerUpgradeSuccess: 'Player upgraded "{word}" → Lv.{level} -{cost}',
        logPlayerUpgradeFail: 'Player upgrade failed "{word}" fined -{fine}',
        logPlayerWrong: 'Player answered wrong, fine -$100',
        logPlayerWrongDoubleRent: 'Player answered wrong, pay double rent -{price}',
        logAiRolled: '{name} rolled {steps}',
        logAiPassedStart: '{name} passed Start +$100',
        logAiOccupied: '{name} occupied "{word}" +$100',
        logAiOccupiedFail: '{name} occupation failed, fined $100',
        logAiAnswerCorrect: '{name} answered correctly, pay rent to {recipient} {price}',
        logAiAnswerWrong: '{name} answered wrong, pay double rent to {recipient} {price}',
        logAiUpgradeSuccess: '{name} upgraded "{word}" → Lv.{level} -{cost}',
        logAiUpgradeFail: '{name} upgrade failed "{word}" fined -{fine}',
        logAiMaxUpgrades: '{name} "{word}" max upgrades reached',
        logAiInsufficientFunds: '{name} insufficient funds to upgrade "{word}"',
        logAiTax: '{name} tax -{amount}',
        logDisasterStrike: '{emoji} {name} strikes!',
        logDisasterPlayerUnowned: '{name}: Player\'s "{word}" became unowned',
        logDisasterPlayerDowngraded: '{name}: Player\'s "{word}" downgraded to Lv.{level}',
        logDisasterAiUnowned: '{name}: {ai}\'s "{word}" became unowned',
        logDisasterAiDowngraded: '{name}: {ai}\'s "{word}" downgraded to Lv.{level}',
        logPlayerBankrupt: 'Player bankrupt!',
        logAiBankrupt: '{name} bankrupt! Released {count} cells',
        logAllAiBankrupt: 'All AIs bankrupt, player wins!',
        logAutoUpgrade: '{name} auto-upgraded "{word}" → Lv.{level}',
        logChanceUnowned: 'Chance landing: "{word}" from {owner} becomes unowned',
        logChanceDowngraded: 'Chance landing: "{word}" from {owner} downgraded to Lv.{level}',
        logPlayerTax: 'Player paid tax -{amount}',
        logPlayerSold: 'Player sold "{word}" +{price}',
        logPlayerSellFail: 'Player sell failed "{word}" -{fine}',
        yourProperty: 'Your Property',
        upgradeCost: 'Upgrade Cost',
        afterUpgrade: 'After Upgrade',
        sellPrice: 'Sell Price',
        rent: 'Rent',
        level: 'Level',
        // Word Fill
        wbTitle: 'Word Fill',
        wbDesc: 'See the Chinese meaning and English sentence, then type the matching English word! With pronunciation and auto-read!',
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
        wbTotalScore: 'Correct Count',
        wbMaxCombo: 'Wrong Count',
        wbReachedLevel: 'Level Reached',
        wbPlayAgain: '🔄 Play Again',
        wbPaused: '⏸ Paused',
        wbResumed: '▶ Resumed',
        wbGradeX: 'Grade {grade}',
        wbUnitX: 'Unit {unit}',
        wbLevelUp: '🎉 Level {level}! Time reduced!',
        wbInputPlaceholder: 'Type the English word...',
        wbSubmit: 'Submit',
        wbTryAgain: 'Try again!',
        wbSkip: 'Skip',
        wbSkipHint: 'Skip this word and add to wrong book',
        wbCorrect: 'Correct',
        wbWrong: 'Wrong',
        wbPlayWord: 'Play Word',
        wbPlaySentence: 'Play Sentence',
        // Leaderboard
        leaderboard: 'Leaderboard',
        leaderboardTitle: '🏆 Leaderboard',
        lbMonopoly: 'Monopoly',
        lbWordmatch: 'Match',
        lbWordblast: 'Blast',
        lbRank: 'Rank',
        lbName: 'Player',
        lbScore: 'Score',
        lbGrade: 'Grade',
        lbUnit: 'Unit',
        lbCombo: 'Combo',
        lbTime: 'Time',
        lbDate: 'Date',
        lbNoData: 'No leaderboard data yet',
        lbEnterName: 'Enter your name:',
        lbSaved: 'Score saved to leaderboard!',
        lbSaveScore: 'Save Score'
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
        
        // Update game title - 保持标题为排行榜，不修改
        // const gameTitle = document.querySelector('.game-title');
        // if (gameTitle) {
        //     if (mode === 'wordmatch') gameTitle.textContent = this.t('gameTitleWordmatch');
        //     else if (mode === 'wordblast') gameTitle.textContent = this.t('wbTitle');
        //     else gameTitle.textContent = this.t('gameTitleMonopoly');
        // }
        
        // 根据游戏模式显示或隐藏外部的game-header
        const gameHeader = gameScreen.querySelector('.game-header');
        if (gameHeader) {
            gameHeader.style.display = 'none';
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
        
        // 记单词按钮
        const vocabularyBtn = document.getElementById('btn-vocabulary');
        if (vocabularyBtn) vocabularyBtn.addEventListener('click', () => this.showVocabulary());
        
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
        
        // 监听错题本数据从数据库加载完成事件
        window.addEventListener('wrongbook-loaded', async () => {
            // 如果当前在记单词页面且显示错题本模块，刷新列表
            if (this.currentScreen === 'vocabulary-screen' && this.currentVocabularyModule === 'wrong-book') {
                await this.renderVocabularyWrongBook();
            }
        });
        
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

        // 排行榜按钮
        const lbBtn1 = document.getElementById('monopoly-leaderboard-btn');
        const lbBtn2 = document.getElementById('monopoly-leaderboard-btn2');
        const showLB = () => { audioManager.playClick(); this.showLeaderboard('monopoly'); };
        if (lbBtn1) lbBtn1.onclick = showLB;
        if (lbBtn2) lbBtn2.onclick = showLB;
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

        // 保存AI配置、年级和单元选择到gameEngine
        if (this.gameEngine) {
            this.gameEngine.aiConfigs = aiConfigs;
            this.gameEngine.gameState.currentGrade = this.selectedGrade === 'all' ? 'all' : parseInt(this.selectedGrade);
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
        
        // 更新游戏标题（如果在游戏界面）- 保持标题为排行榜，不修改
        // if (this.currentScreen === 'game-screen') {
        //     const gameTitle = document.querySelector('.game-title');
        //     if (gameTitle) {
        //         if (this.selectedMode === 'wordmatch') gameTitle.textContent = texts.gameTitleWordmatch;
        //         else if (this.selectedMode === 'wordblast') gameTitle.textContent = texts.wbTitle;
        //         else gameTitle.textContent = texts.gameTitleMonopoly;
        //     }
        // }
        
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
     * 处理键盘按键 - 全局快捷键体系
     */
    handleKeyPress(e) {
        // Ctrl+B: 收起/展开侧边栏
        if (e.ctrlKey && e.key === 'b') {
            e.preventDefault();
            this.toggleSidebar();
            return;
        }
        
        // 训练模式中的快捷键
        if (this.trainingMode) {
            this.handleTrainingKeyPress(e);
            return;
        }
        
        // 听写模式中的快捷键
        if (this.dictationMode) {
            this.handleDictationKeyPress(e);
            return;
        }
        
        switch (e.key) {
            case 'Escape':
                this.closeModal();
                // 关闭历史/添加/成就面板
                this.toggleHistoryPanel(false);
                this.toggleAddPanel(false);
                this.toggleAchievementsPanel(false);
                break;
        }
    }
    
    /**
     * 训练模式键盘快捷键
     */
    handleTrainingKeyPress(e) {
        switch (e.key) {
            case '1': case '2': case '3': case '4':
                // 选择选项
                const optionIndex = parseInt(e.key) - 1;
                const options = document.querySelectorAll('.recognition-option');
                if (options[optionIndex] && !options[optionIndex].classList.contains('disabled')) {
                    options[optionIndex].click();
                }
                break;
            case 'Enter':
                // 确认/下一步
                if (this.trainingAnswered) {
                    this.nextTrainingWord();
                }
                break;
            case ' ':
                e.preventDefault();
                // 播放发音
                this.playCurrentTrainingWord();
                break;
            case 'r': case 'R':
                // 重播发音
                this.playCurrentTrainingWord();
                break;
            case 'Escape':
                // 退出训练
                this.exitTraining();
                break;
        }
    }
    
    /**
     * 听写模式键盘快捷键
     */
    handleDictationKeyPress(e) {
        switch (e.key) {
            case 'Enter':
                // 提交答案
                const input = document.getElementById('dictation-input');
                if (input && document.activeElement === input) {
                    this.submitDictationAnswer();
                }
                break;
            case ' ':
                // 播放发音（仅当输入框未聚焦时）
                if (document.activeElement.tagName !== 'INPUT') {
                    e.preventDefault();
                    this.playDictationWord();
                }
                break;
            case 'r': case 'R':
                // 重播发音
                if (document.activeElement.tagName !== 'INPUT') {
                    this.playDictationWord();
                }
                break;
            case 'Escape':
                // 退出听写
                this.exitDictation();
                break;
        }
    }
    
    /**
     * 切换侧边栏
     */
    toggleSidebar() {
        const sidebar = document.getElementById('vocabulary-sidebar');
        if (sidebar) {
            sidebar.classList.toggle('collapsed');
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
     * 显示排行榜界面
     */
    showLeaderboard(type = 'monopoly', showTabs = false) {
        // 移除旧的排行榜弹窗
        const old = document.getElementById('english-leaderboard-modal');
        if (old) old.remove();

        const API_BASE = (location.port === '8080') ? 'http://localhost:3000' : '';

        // 获取游戏名称
        const gameNames = {
            monopoly: this.t('lbMonopoly'),
            wordmatch: this.t('lbWordmatch'),
            wordblast: this.t('lbWordblast')
        };
        const titleText = showTabs ? this.t('leaderboardTitle') : `🏆 ${gameNames[type] || this.t('leaderboard')}`;

        const modal = document.createElement('div');
        modal.className = 'english-lb-modal';
        modal.id = 'english-leaderboard-modal';
        modal.innerHTML = `
            <div class="english-lb-box">
                <div class="english-lb-header">
                    <h2 class="english-lb-title">${titleText}</h2>
                    <button class="english-lb-close" id="english-lb-close">&times;</button>
                </div>
                ${showTabs ? `
                <div class="english-lb-tabs" id="english-lb-tabs">
                    <button class="english-lb-tab active" data-type="monopoly">${this.t('lbMonopoly')}</button>
                    <button class="english-lb-tab" data-type="wordmatch">${this.t('lbWordmatch')}</button>
                    <button class="english-lb-tab" data-type="wordblast">${this.t('lbWordblast')}</button>
                </div>
                ` : ''}
                <div class="english-lb-content" id="english-lb-content">
                    <div class="english-lb-loading">Loading...</div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('active'));

        // 关闭按钮
        document.getElementById('english-lb-close').onclick = () => modal.remove();
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        // Tab切换（仅在显示Tab时）
        if (showTabs) {
            const tabs = modal.querySelectorAll('.english-lb-tab');
            tabs.forEach(tab => {
                tab.onclick = () => {
                    tabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    this._fetchAndRenderLeaderboard(tab.dataset.type, API_BASE);
                };
            });
        }

        // 加载初始数据
        this._fetchAndRenderLeaderboard(type, API_BASE);
    }

    /**
     * 获取并渲染排行榜数据
     */
    async _fetchAndRenderLeaderboard(type, API_BASE) {
        const content = document.getElementById('english-lb-content');
        if (!content) return;
        content.innerHTML = '<div class="english-lb-loading">Loading...</div>';

        try {
            const resp = await fetch(`${API_BASE}/api/english-leaderboard/list?type=${type}&limit=10`);
            const result = await resp.json();
            if (!result.success || !result.data.length) {
                content.innerHTML = `<div class="english-lb-empty">${this.t('lbNoData')}</div>`;
                return;
            }

            const data = result.data;
            let html = `<table class="english-lb-table">
                <thead><tr>
                    <th>${this.t('lbRank')}</th>
                    <th>${this.t('lbName')}</th>
                    <th>${this.t('lbScore')}</th>
                    <th>${this.t('lbGrade')}</th>
                    <th>${this.t('lbUnit')}</th>
                    <th>${this.t('lbCombo')}</th>
                    <th>${this.t('lbTime')}</th>
                    <th>${this.t('lbDate')}</th>
                </tr></thead><tbody>`;

            data.forEach((item, i) => {
                const rankIcon = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1);
                const timeStr = item.time >= 60 ? `${Math.floor(item.time / 60)}m${item.time % 60}s` : `${item.time}s`;
                const dateStr = item.date ? item.date.split(' ')[0] : '';
                const gradeStr = item.grade === 'all' ? this.t('allGrades') : `${this.t('grade')} ${item.grade}`;
                const unitStr = !item.unit || item.unit === 'all' ? this.t('allUnits') : `${this.t('unit')} ${item.unit}`;
                html += `<tr class="english-lb-row${i < 3 ? ' english-lb-top3' : ''}">
                    <td class="english-lb-rank">${rankIcon}</td>
                    <td class="english-lb-name">${item.name}</td>
                    <td class="english-lb-score">${item.score}</td>
                    <td class="english-lb-grade">${gradeStr}</td>
                    <td class="english-lb-unit">${unitStr}</td>
                    <td class="english-lb-combo">${item.combo || '-'}</td>
                    <td class="english-lb-time">${timeStr}</td>
                    <td class="english-lb-date">${dateStr}</td>
                </tr>`;
            });

            html += '</tbody></table>';
            content.innerHTML = html;
        } catch (err) {
            console.error('获取排行榜失败:', err);
            content.innerHTML = `<div class="english-lb-empty">${this.t('lbNoData')}</div>`;
        }
    }

    /**
     * 保存成绩到英语排行榜
     * @param {string} type - 游戏类型 (monopoly/wordmatch/wordblast)
     * @param {object} data - { score, level, combo, time, grade }
     */
    async saveEnglishLeaderboard(type, data) {
        // 防重复提交
        if (this._savingLeaderboard) return;
        this._savingLeaderboard = true;

        const API_BASE = (location.port === '8080') ? 'http://localhost:3000' : '';
        
        // 获取玩家名字（从localStorage读取或提示输入）
        let name = localStorage.getItem('english_lb_name');
        if (!name) {
            name = prompt(this.t('lbEnterName'));
            if (!name || !name.trim()) {
                this._savingLeaderboard = false;
                return;
            }
            name = name.trim();
            localStorage.setItem('english_lb_name', name);
        }

        const entry = {
            id: crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
                const r = Math.random() * 16 | 0;
                return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            }),
            name: name,
            score: data.score || 0,
            level: data.level || 1,
            combo: data.combo || 0,
            time: data.time || 0,
            grade: data.grade || 'all',
            unit: data.unit || 'all',
            type: type,
            date: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };

        try {
            await fetch(`${API_BASE}/api/english-leaderboard/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entry)
            });
            this.showFloat(this.t('lbSaved'), '#27AE60');
        } catch (err) {
            console.error('保存排行榜成绩失败:', err);
        } finally {
            this._savingLeaderboard = false;
        }
    }


    
    /**
     * 显示记单词界面
     */
    async showVocabulary() {
        this.hideAllScreens();
        const screen = document.getElementById('vocabulary-screen');
        if (screen) screen.classList.remove('hidden');
        this.currentScreen = 'vocabulary-screen';
        this.currentVocabularyModule = 'memory-training';
        this.trainingMode = null;
        this.dictationMode = false;
        
        await vocabulary.init();
        await wrongBook.init(); // 同时加载错题本数据
        this.renderVocabularyList();
        this.setupVocabularyListeners();
        this.setupVocabularySidebar();
        this.updateVocabularyHeaderStats();
    }
    
    /**
     * 设置侧边栏导航
     */
    setupVocabularySidebar() {
        // 导航项点击事件
        document.querySelectorAll('.nav-item').forEach(item => {
            item.onclick = async (e) => {
                const module = e.currentTarget.dataset.module;
                await this.switchVocabularyModule(module);
            };
        });
        
        // 切换侧边栏按钮
        const toggleBtn = document.getElementById('btn-toggle-sidebar');
        if (toggleBtn) toggleBtn.onclick = () => this.toggleSidebar();
        
        // 设置按钮
        const settingsBtn = document.getElementById('btn-settings');
        if (settingsBtn) settingsBtn.onclick = async () => await this.switchVocabularyModule('settings');
        
        // 训练配置
        this.setupTrainingConfig();
        
        // 听写配置（已整合到单词训练中）
        // this.setupDictationConfig();
        
        // 错题本模块监听
        this.setupVocabularyWrongBookListeners();
        
        // 系统设置监听
        this.setupSettingsListeners();
    }
    
    /**
     * 切换模块
     */
    async switchVocabularyModule(moduleName) {
        this.currentVocabularyModule = moduleName;
        
        // 更新导航高亮
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.module === moduleName);
        });
        
        // 更新模块显示
        document.querySelectorAll('.vocabulary-module').forEach(mod => {
            mod.classList.toggle('active', mod.id === `${moduleName}-module`);
        });
        
        // 更新标题
        const titleMap = {
            'memory-training': '单词训练',
            'history-words': '历史单词',
            'wrong-book': '单词库',
            'learning-data': '学习数据',
            'achievements': '成就徽章',
            'settings': '系统设置'
        };
        const headerTitle = document.getElementById('header-title');
        if (headerTitle) headerTitle.textContent = titleMap[moduleName] || moduleName;
        
        // 根据模块触发对应的渲染
        if (moduleName === 'achievements') {
            this.renderAchievements();
        } else if (moduleName === 'learning-data') {
            this.renderLearningData();
        } else if (moduleName === 'wrong-book') {
            await this.renderVocabularyWrongBook();
        } else if (moduleName === 'history-words') {
            this.renderHistoryWords();
        }
    }
    
    /**
     * 更新顶部状态栏统计
     */
    async updateVocabularyHeaderStats() {
        const stats = vocabulary.getStats();
        if (!stats) return;
        
        const totalEl = document.getElementById('header-total-words');
        const masteredEl = document.getElementById('header-mastered-words');
        const progressFill = document.getElementById('header-progress-fill');
        const progressText = document.getElementById('header-progress-text');
        const sidebarLevel = document.getElementById('sidebar-user-level');
        
        if (totalEl) totalEl.textContent = stats.totalWords;
        if (masteredEl) masteredEl.textContent = stats.masteredWords;
        
        const todayStudied = stats.todayStudied || 0;
        const progressPercent = Math.min((todayStudied / 5) * 100, 100);
        if (progressFill) progressFill.style.width = `${progressPercent}%`;
        if (progressText) progressText.textContent = `${todayStudied}/5`;
        
        // 更新侧边栏等级
        try {
            const userStats = await vocabulary.getUserStats();
            if (userStats && userStats.levelInfo && sidebarLevel) {
                sidebarLevel.innerHTML = `
                    <span class="level-icon">${userStats.levelInfo.icon}</span>
                    <span class="level-text">Lv.${userStats.levelInfo.level} ${userStats.levelInfo.title}</span>
                `;
            }
        } catch (e) { /* ignore */ }
    }
    
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
    }
    
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
    }
    

    
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
    
    /**
     * 渲染词汇模块内的错题本
     */
    async renderVocabularyWrongBook() {
        const listContainer = document.getElementById('vocabulary-wrongbook-list');
        const statsContainer = document.getElementById('vocabulary-wrongbook-stats');
        if (!listContainer || !statsContainer) return;
        
        // 如果缓存为空，先从数据库加载
        if (wrongBook.getAll().length === 0) {
            await wrongBook.refresh();
        }
        
        const timeFilter = document.getElementById('wrongbook-time-filter');
        const errorFilter = document.getElementById('wrongbook-error-filter');
        const masteryFilter = document.getElementById('wrongbook-mastery-filter');
        
        let words = wrongBook.getAll();
        const stats = wrongBook.getStats();
        const timeVal = timeFilter ? timeFilter.value : 'all';
        const errorVal = errorFilter ? errorFilter.value : 'all';
        const masteryVal = masteryFilter ? masteryFilter.value : 'all';
        
        // 时间筛选
        if (timeVal !== 'all') {
            const now = new Date();
            words = words.filter(w => {
                const t = new Date(w.lastWrongTime || w.firstWrongTime);
                if (timeVal === 'today') return t.toDateString() === now.toDateString();
                if (timeVal === 'week') return (now - t) < 7 * 24 * 60 * 60 * 1000;
                if (timeVal === 'month') return (now - t) < 30 * 24 * 60 * 60 * 1000;
                return true;
            });
        }
        
        // 错因筛选
        if (errorVal !== 'all') {
            words = words.filter(w => w.errorType === errorVal);
        }
        
        // 掌握度筛选
        if (masteryVal === 'mastered') {
            words = words.filter(w => w.mastered);
        } else if (masteryVal === 'high') {
            words = words.filter(w => (w.wrongCount || 1) >= 3);
        } else if (masteryVal === 'review') {
            words = words.filter(w => !w.mastered);
        }
        
        // 计算掌握率
        const masteryRate = stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0;
        
        // 渲染统计卡片
        statsContainer.innerHTML = `
            <div class="wrongbook-stat-card">
                <div class="wrongbook-stat-number">${stats.total}</div>
                <div class="wrongbook-stat-label">总计</div>
                <div class="wrongbook-stat-progress">
                    <div class="wrongbook-progress-bar">
                        <div class="wrongbook-progress-fill" style="width: ${masteryRate}%"></div>
                    </div>
                    <span class="wrongbook-progress-text">${masteryRate}%</span>
                </div>
            </div>
            <div class="wrongbook-stat-card">
                <div class="wrongbook-stat-number">${stats.unmastered}</div>
                <div class="wrongbook-stat-label">未掌握</div>
                <div class="wrongbook-stat-icon">📚</div>
            </div>
            <div class="wrongbook-stat-card">
                <div class="wrongbook-stat-number">${stats.mastered}</div>
                <div class="wrongbook-stat-label">已掌握</div>
                <div class="wrongbook-stat-icon">✅</div>
            </div>
        `;
        
        if (words.length === 0) {
            listContainer.innerHTML = `
                <div class="wrongbook-empty">
                    <div class="wrongbook-empty-icon">📖</div>
                    <div class="wrongbook-empty-text">暂无匹配的错题</div>
                    <div class="wrongbook-empty-hint">去游戏中挑战单词吧！</div>
                </div>`;
            return;
        }
        
        const sourceNames = { 
            monopoly: '单词大富翁', 
            wordmatch: '单词配对', 
            wordblast: '单词填空' 
        };
        
        // 渲染错题卡片
        listContainer.innerHTML = words.map((w, index) => {
            const mc = w.mastered ? ' mastered' : '';
            const mt = w.mastered ? '取消掌握' : '标记掌握';
            const mi = w.mastered ? '✅' : '⬜';
            
            // 音标和朗读按钮
            const phoneticHtml = w.phonetic ? `
                <div class="wrongbook-phonetic">
                    <span>${w.phonetic}</span>
                    <button class="wrongbook-speak-btn" data-word="${w.word}" title="朗读单词">🔊</button>
                </div>` : `
                <div class="wrongbook-phonetic">
                    <button class="wrongbook-speak-btn" data-word="${w.word}" title="朗读单词">🔊</button>
                </div>`;
            
            // 词根词缀
            const rootAffixHtml = w.rootAffix ? `
                <div class="wrongbook-rootAffix">
                    <span class="wrongbook-rootAffix-label">词根词缀:</span> 
                    ${w.rootAffix}
                </div>` : '';
            
            // 例句
            const exampleHtml = w.example ? `
                <div class="wrongbook-example">"${w.example}"</div>` : '';
            
            // 错误次数进度条
            const wrongCount = w.wrongCount || 1;
            const maxWrong = 10; // 假设最大错误次数为10
            const wrongPercent = Math.min((wrongCount / maxWrong) * 100, 100);
            
            // 时间格式化
            const lastWrongTime = w.lastWrongTime ? new Date(w.lastWrongTime).toLocaleDateString() : '';
            
            return `
                <div class="wrongbook-item${mc}" data-word="${w.word}" style="animation-delay: ${index * 0.05}s">
                    <div class="wrongbook-item-header">
                        <label class="vocabulary-checkbox">
                            <input type="checkbox" class="wrongbook-checkbox" data-word="${w.word}" data-meaning="${w.meaning}" data-phonetic="${w.phonetic || ''}" data-example="${w.example || ''}" data-root-affix="${w.rootAffix || ''}" data-grade="${w.grade || ''}">
                            <span class="vocabulary-checkbox-mark"></span>
                        </label>
                        <div class="wrongbook-word${w.mastered ? ' mastered-text' : ''}">${w.word}</div>
                        <div class="wrongbook-badges">
                            <span class="wrongbook-badge from-${w.from}">${sourceNames[w.from] || w.from}</span>
                            ${w.mastered ? '<span class="wrongbook-badge mastered-badge">已掌握</span>' : ''}
                        </div>
                    </div>
                    ${phoneticHtml}
                    <div class="wrongbook-meaning">${w.meaning}</div>
                    ${rootAffixHtml}
                    ${exampleHtml}
                    <div class="wrongbook-meta">
                        <div class="wrongbook-wrong-info">
                            <span class="wrongbook-count">错误次数: ${wrongCount}</span>
                            <div class="wrongbook-wrong-bar">
                                <div class="wrongbook-wrong-fill" style="width: ${wrongPercent}%"></div>
                            </div>
                        </div>
                        ${lastWrongTime ? `<span class="wrongbook-time">${lastWrongTime}</span>` : ''}
                    </div>
                    <div class="wrongbook-actions-cell">
                        <button class="wrongbook-action-btn-small success" data-word="${w.word}" data-mastered="${w.mastered}">
                            ${mi} ${mt}
                        </button>
                        <button class="wrongbook-action-btn-small danger" data-word="${w.word}">
                            🗑️ 删除
                        </button>
                    </div>
                </div>`;
        }).join('');
    }
    
    /**
     * 设置词汇模块内错题本的事件监听
     */
    setupVocabularyWrongBookListeners() {

        
        // 测验模式切换按钮
        const quizToggleBtn = document.getElementById('btn-quiz-toggle');
        if (quizToggleBtn) {
            quizToggleBtn.onclick = () => {
                this.quizMode = !this.quizMode;
                const container = document.querySelector('.wrongbook-content');
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
                        const list = document.getElementById('vocabulary-wrongbook-list');
                        if (list) list.parentNode.insertBefore(hint, list);
                    }
                    
                    this.showVocabularyNotification('测验开始！只显示单词和音标', 'info');
                } else {
                    // 关闭测验模式
                    container.classList.remove('quiz-mode');
                    quizToggleBtn.classList.remove('active');
                    btnText.textContent = '开始测验';
                    
                    // 移除测验提示
                    const hint = document.querySelector('.wrongbook-quiz-hint');
                    if (hint) hint.remove();
                    
                    this.showVocabularyNotification('测验结束！所有内容已恢复显示', 'success');
                }
            };
        }
        
        // 开始复习按钮
        const reviewBtn = document.getElementById('btn-start-wrongbook-review');
        if (reviewBtn) {
            reviewBtn.onclick = async () => {
                await this.switchVocabularyModule('memory-training');
                this.startTraining();
            };
        }
        

        

        

        
        // 列表事件委托
        const listContainer = document.getElementById('vocabulary-wrongbook-list');
        if (listContainer) {
            listContainer.onclick = async (e) => {
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
                        await wrongBook.unmarkMastered(word);
                        this.showVocabularyNotification(`已取消掌握: ${word}`, 'info');
                    } else {
                        await wrongBook.markMastered(word);
                        // 添加掌握成功动画
                        if (item) {
                            item.classList.add('mastered-success');
                            setTimeout(() => item.classList.remove('mastered-success'), 500);
                        }
                        this.showVocabularyNotification(`已掌握: ${word}`, 'success');
                    }
                    await this.renderVocabularyWrongBook();
                    return;
                }
                
                // 删除按钮
                if (target.classList.contains('wrongbook-action-btn-small') && target.classList.contains('danger')) {
                    const word = target.dataset.word;
                    const item = target.closest('.wrongbook-item');
                    
                    // 添加删除确认动画
                    if (item) {
                        item.classList.add('delete-confirm');
                        setTimeout(async () => {
                            await wrongBook.removeWrongWord(word);
                            await this.renderVocabularyWrongBook();
                            this.showVocabularyNotification(`已删除: ${word}`, 'warning');
                        }, 300);
                    } else {
                        await wrongBook.removeWrongWord(word);
                        await this.renderVocabularyWrongBook();
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
        
        // 勾选框事件
        this.setupWrongbookCheckboxListeners();
    }
    
    /**
     * 设置错题本勾选框监听器
     */
    setupWrongbookCheckboxListeners() {
        const batchBar = document.getElementById('vocabulary-batch-bar');
        const batchCount = document.getElementById('vocabulary-batch-count');
        const addToVocabBtn = document.getElementById('btn-add-to-vocabulary');
        const clearSelectionBtn = document.getElementById('btn-clear-selection');
        
        // 勾选框变化事件
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('wrongbook-checkbox')) {
                this.updateWrongbookSelection();
            }
        });
        
        // 添加到记单词按钮
        if (addToVocabBtn) {
            addToVocabBtn.onclick = async () => {
                const checkboxes = document.querySelectorAll('.wrongbook-checkbox:checked');
                const words = [];
                
                checkboxes.forEach(cb => {
                    words.push({
                        word: cb.dataset.word,
                        meaning: cb.dataset.meaning,
                        phonetic: cb.dataset.phonetic,
                        example: cb.dataset.example,
                        rootAffix: cb.dataset.rootAffix,
                        grade: cb.dataset.grade,
                        source: 'wrongbook'
                    });
                });
                
                if (words.length === 0) {
                    this.showVocabularyNotification('请先勾选单词', 'warning');
                    return;
                }
                
                // 批量添加到记单词词库
                await vocabulary.addWordsBatch(words);
                
                // 取消所有勾选
                checkboxes.forEach(cb => {
                    cb.checked = false;
                });
                
                // 隐藏批量操作栏
                this.updateWrongbookSelection();
                
                this.showVocabularyNotification(`已添加 ${words.length} 个单词到记单词词库`, 'success');
            };
        }
        
        // 取消选择按钮
        if (clearSelectionBtn) {
            clearSelectionBtn.onclick = () => {
                document.querySelectorAll('.wrongbook-checkbox').forEach(cb => {
                    cb.checked = false;
                });
                this.updateWrongbookSelection();
            };
        }
    }
    
    /**
     * 更新错题本选择状态
     */
    updateWrongbookSelection() {
        const batchBar = document.getElementById('vocabulary-batch-bar');
        const batchCount = document.getElementById('vocabulary-batch-count');
        const checkboxes = document.querySelectorAll('.wrongbook-checkbox:checked');
        
        if (batchBar) {
            batchBar.style.display = checkboxes.length > 0 ? 'flex' : 'none';
        }
        
        if (batchCount) {
            batchCount.textContent = checkboxes.length;
        }
    }
    
    /**
     * 导出错题本为文本
     */
    exportWrongBook() {
        const words = wrongBook.getAll();
        if (!words || words.length === 0) {
            this.showVocabularyNotification('单词库为空，无法导出', 'warning');
            return;
        }
        
        const text = words.map(w => 
            `${w.word}\t${w.meaning || ''}\t${w.phonetic || ''}\t错${w.wrongCount || 1}次`
        ).join('\n');
        
        const header = '单词\t释义\t音标\t错误次数\n';
        const blob = new Blob([header + text], { type: 'text/tab-separated-values;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `单词库_${new Date().toISOString().split('T')[0]}.tsv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showVocabularyNotification('单词库已导出', 'success');
    }
    
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
        document.querySelectorAll('[data-setting="listening-interval"]').forEach(btn => {
            btn.onclick = (e) => {
                document.querySelectorAll('[data-setting="listening-interval"]').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.showVocabularyNotification(`单词间隔已设置为${e.target.dataset.value}秒`, 'success');
            };
        });
        
        document.querySelectorAll('[data-setting="listening-play-count"]').forEach(btn => {
            btn.onclick = (e) => {
                document.querySelectorAll('[data-setting="listening-play-count"]').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.showVocabularyNotification(`播放次数已设置为${e.target.dataset.value}次`, 'success');
            };
        });
    }
    
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
    }
    
    /**
     * 启动护眼提醒
     */
    startEyeProtectionTimer() {
        this.stopEyeProtectionTimer();
        this._eyeProtectionTimer = setInterval(() => {
            this.showVocabularyNotification('您已学习40分钟，建议休息一下眼睛 👀', 'warning');
        }, 40 * 60 * 1000);
    }
    
    /**
     * 停止护眼提醒
     */
    stopEyeProtectionTimer() {
        if (this._eyeProtectionTimer) {
            clearInterval(this._eyeProtectionTimer);
            this._eyeProtectionTimer = null;
        }
    }
    
    /**
     * 设置训练配置交互
     */
    setupTrainingConfig() {
        // 新词比例滑块
        const ratioSlider = document.getElementById('new-word-ratio');
        if (ratioSlider) {
            ratioSlider.oninput = (e) => {
                document.getElementById('new-ratio-value').textContent = e.target.value;
                document.getElementById('review-ratio-value').textContent = 100 - e.target.value;
            };
        }
        
        // 开始训练按钮（配置区内）
        const startBtn = document.getElementById('btn-start-training');
        if (startBtn) {
            startBtn.onclick = () => this.startTraining();
        }

        
        // 检查昨天训练情况并更新按钮状态
        this.updateTrainingButtons();
    }
    
    /**
     * 更新训练按钮状态
     */
    async updateTrainingButtons() {
        const yesterdayPassed = await this.checkYesterdayTraining();
        
        const startBtn = document.getElementById('btn-start-training');
        const lock = document.getElementById('training-lock');
        
        if (!yesterdayPassed) {
            // 显示锁定状态
            if (startBtn) {
                startBtn.disabled = true;
                startBtn.classList.add('disabled');
            }
            if (lock) lock.classList.remove('hidden');
        } else {
            // 隐藏锁定状态
            if (startBtn) {
                startBtn.disabled = false;
                startBtn.classList.remove('disabled');
            }
            if (lock) lock.classList.add('hidden');
        }
    }
    
    /**
     * 设置听写配置
     */
    setupDictationConfig() {
        // 听写范围
        document.querySelectorAll('#dictation-training-module .config-option[data-range]').forEach(btn => {
            btn.onclick = (e) => {
                document.querySelectorAll('#dictation-training-module .config-option[data-range]').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            };
        });
        
        // 间隔选项
        document.querySelectorAll('.interval-option').forEach(btn => {
            btn.onclick = (e) => {
                document.querySelectorAll('.interval-option').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            };
        });
        
        // 播放次数
        document.querySelectorAll('.play-count-option').forEach(btn => {
            btn.onclick = (e) => {
                document.querySelectorAll('.play-count-option').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            };
        });
        
        // 开始听写按钮（配置区内）
        const startBtn = document.getElementById('btn-start-dictation');
        if (startBtn) {
            startBtn.onclick = () => this.startDictation();
        }

        // 快速开始按钮（Hero区）
        const quickStartBtn = document.getElementById('btn-quick-start-dictation');
        if (quickStartBtn) {
            quickStartBtn.onclick = () => this.startDictation();
        }
    }
    

    

    

    

    
    /**
     * 渲染记单词列表
     */
    async renderVocabularyList() {
        const todayWordsContainer = document.getElementById('vocabulary-today-words');
        const progressText = document.getElementById('today-progress-text');
        const progressFill = document.getElementById('today-progress-fill');
        
        const stats = vocabulary.getStats();
        const todayWords = vocabulary.getTodayWords();
        
        // 更新今日记单词进度
        if (progressText && progressFill) {
            const todayStudied = stats ? stats.todayStudied : 0;
            const progressPercent = Math.min((todayStudied / 5) * 100, 100);
            progressText.textContent = `${todayStudied}/5`;
            progressFill.style.width = `${progressPercent}%`;
        }
        
        // 更新今日记单词列表
        if (todayWordsContainer) {
            if (todayWords.length === 0) {
                todayWordsContainer.innerHTML = `
                    <div class="vocabulary-empty">
                        <span class="vocabulary-empty-icon">📖</span>
                        <div class="vocabulary-empty-text">今日暂无记单词</div>
                    </div>`;
            } else {
                todayWordsContainer.innerHTML = todayWords.map(word => `
                    <div class="vocabulary-word-card ${word.remembered ? 'remembered' : ''}" data-word="${word.word}">
                        <div class="vocabulary-word-header">
                            <div>
                                <div class="vocabulary-word-text">${word.word}</div>
                                <div class="vocabulary-word-phonetic">
                                    <span>${word.phonetic || ''}</span>
                                    <button class="btn-pronunciation" data-word="${word.word}" title="朗读单词">🔊</button>
                                </div>
                            </div>
                            <button class="btn-remembered ${word.remembered ? 'active' : ''}" 
                                    data-word="${word.word}" 
                                    title="${word.remembered ? '取消记住' : '标记为已记住'}">
                                ${word.remembered ? '✅' : '⬜'}
                            </button>
                        </div>
                        <div class="vocabulary-word-meaning">${word.meaning}</div>
                        ${word.example ? `<div class="vocabulary-word-example">"${word.example}"</div>` : ''}
                    </div>
                `).join('');
                
                // 添加记忆按钮事件监听
                todayWordsContainer.querySelectorAll('.btn-remembered').forEach(btn => {
                    btn.onclick = async (e) => {
                        e.stopPropagation();
                        const word = btn.dataset.word;
                        const isRemembered = btn.classList.contains('active');
                        const newRemembered = !isRemembered;
                        
                        const success = await vocabulary.toggleRemembered(word, newRemembered);
                        if (success) {
                            // 更新UI
                            btn.classList.toggle('active', newRemembered);
                            btn.innerHTML = newRemembered ? '✅' : '⬜';
                            btn.title = newRemembered ? '取消记住' : '标记为已记住';
                            
                            // 更新卡片样式
                            const card = btn.closest('.vocabulary-word-card');
                            if (card) {
                                card.classList.toggle('remembered', newRemembered);
                            }
                        }
                    };
                });
                
                // 添加发音按钮事件监听
                todayWordsContainer.querySelectorAll('.btn-pronunciation').forEach(btn => {
                    btn.onclick = async (e) => {
                        e.stopPropagation();
                        const word = btn.dataset.word;
                        if (word && typeof audioManager !== 'undefined') {
                            btn.classList.add('playing');
                            try {
                                await audioManager.speak(word, 'en-US');
                            } catch (err) {
                                console.error('发音失败:', err);
                            }
                            btn.classList.remove('playing');
                        }
                    };
                });
            }
        }
    }
    
    /**
     * 设置记单词事件监听器
     */
    setupVocabularyListeners() {
        const backBtn = document.getElementById('btn-back-vocabulary');
        if (backBtn) backBtn.onclick = () => this.showMainMenu();
        

        
        // 设置面板标签切换
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.onclick = (e) => {
                const tabName = e.currentTarget.dataset.tab;
                document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
                e.currentTarget.classList.add('active');
                document.querySelectorAll('.settings-panel').forEach(p => p.classList.add('hidden'));
                const panel = document.getElementById(`${tabName}-settings`);
                if (panel) panel.classList.remove('hidden');
            };
        });
        
        // 设置面板：历史记录和成就面板保留
        const historyBtn = document.getElementById('btn-history');
        if (historyBtn) historyBtn.onclick = () => this.toggleHistoryPanel();
        
        const closeHistoryBtn = document.getElementById('btn-close-history');
        if (closeHistoryBtn) closeHistoryBtn.onclick = () => this.toggleHistoryPanel(false);
        
        const loadHistoryBtn = document.getElementById('btn-load-history');
        if (loadHistoryBtn) loadHistoryBtn.onclick = () => this.loadHistory();
    }
    
    /**
     * 检查昨天单词的训练情况
     * 返回 true 表示昨天已完成训练，false 表示未完成
     */
    async checkYesterdayTraining() {
        try {
            // 获取历史日期列表
            const historyDates = await vocabulary.getHistoryDates();
            
            // 如果没有历史记录，说明是新用户，允许训练
            if (!historyDates || historyDates.length === 0) {
                return true;
            }
            
            // 获取今天的日期字符串
            const today = new Date().toISOString().split('T')[0];
            
            // 过滤掉今天的日期，只保留历史日期
            const pastDates = historyDates.filter(date => date !== today);
            
            // 如果没有历史日期（只有今天的记录），允许训练
            if (pastDates.length === 0) {
                return true;
            }
            
            // 按日期降序排序（最近的在前）
            pastDates.sort((a, b) => new Date(b) - new Date(a));
            
            // 获取最近的有记录的日期
            const mostRecentDate = pastDates[0];
            
            // 获取该日期的记录
            const records = await vocabulary.getDailyRecord(mostRecentDate);
            
            // 如果没有记录（理论上不应该发生），允许训练
            if (!records || records.length === 0) {
                return true;
            }
            
            // 检查是否达到了每日目标（默认5个单词）
            const dailyTarget = parseInt(document.getElementById('daily-word-count')?.value || 5);
            const correctWords = records.filter(r => r.correct).length;
            
            // 如果正确单词数量达到每日目标，则认为通过
            return correctWords >= dailyTarget;
        } catch (error) {
            console.error('检查昨天训练情况失败:', error);
            // 出错时默认允许训练
            return true;
        }
    }
    
    /**
     * 开始训练（根据配置选择模式）
     */
    async startTraining() {
        // 检查昨天单词的训练情况
        const yesterdayPassed = await this.checkYesterdayTraining();
        if (!yesterdayPassed) {
            this.showVocabularyNotification('请先完成昨天的单词训练才能开始今天的学习', 'warning');
            return;
        }
        
        // 获取听写高级设置（从系统设置中读取）
        let listeningInterval = 5000; // 默认5秒
        let listeningPlayCount = 2; // 默认2次
        let listeningShowChinese = true; // 默认显示中文释义
        let listeningShowFirstLetter = false; // 默认不显示首字母
        
        const intervalBtn = document.querySelector('[data-setting="listening-interval"].active');
        listeningInterval = intervalBtn ? parseInt(intervalBtn.dataset.value) * 1000 : 5000;
        
        const playCountBtn = document.querySelector('[data-setting="listening-play-count"].active');
        listeningPlayCount = playCountBtn ? parseInt(playCountBtn.dataset.value) : 2;
        
        listeningShowChinese = document.getElementById('listening-show-chinese-hint')?.checked || false;
        listeningShowFirstLetter = document.getElementById('listening-show-first-letter')?.checked || false;
        
        // 读取每天学习单词数量设置
        const totalWords = parseInt(document.getElementById('daily-word-count')?.value || 5);
        
        // 优先使用今日单词（从API获取的今日要记的单词）
        let words = vocabulary.getTodayWords();
        
        // 如果今日单词为空，则使用配置生成单词列表
        if (!words || words.length === 0) {
            console.log('今日单词为空，使用配置生成单词列表');
            
            // 读取新词/复习比例设置
            const newRatio = parseInt(document.getElementById('new-word-ratio')?.value || 70);
            const newWordCount = Math.round(totalWords * newRatio / 100);
            const reviewWordCount = totalWords - newWordCount;
            
            // 获取新词（来自记单词库中未在错题本中的单词）
            const allVocabularyWords = vocabulary.getAll();
            const wrongBookWords = new Set(wrongBook.getAll().map(w => w.word));
            const newWords = allVocabularyWords.filter(w => !wrongBookWords.has(w.word) && !w.mastered)
                .sort(() => Math.random() - 0.5)
                .slice(0, newWordCount)
                .map(w => ({
                    word: w.word,
                    meaning: w.meaning,
                    phonetic: w.phonetic || ''
                }));
            
            // 获取复习词（来自错题本中未掌握的单词）
            const unmasteredWords = wrongBook.getUnmasteredWords();
            const reviewWords = unmasteredWords
                .sort(() => Math.random() - 0.5)
                .slice(0, reviewWordCount)
                .map(w => ({
                    word: w.word,
                    meaning: w.meaning,
                    phonetic: w.phonetic || ''
                }));
            
            // 合并新词和复习词
            words = [...newWords, ...reviewWords];
        } else {
            console.log(`使用今日单词进行训练: ${words.length} 个单词`);
        }
        
        if (words.length === 0) {
            this.showVocabularyNotification('没有可学习的单词', 'warning');
            return;
        }
        
        // 启动多模式训练
        this.trainingModes = ['recognition', 'spelling', 'listening']; // 三种模式依次进行
        this.trainingModeIndex = 0; // 当前模式索引
        this.trainingMode = this.trainingModes[0]; // 当前模式
        this.trainingWords = words;
        this.trainingIndex = 0;
        this.trainingCorrect = 0;
        this.trainingStartTime = Date.now();
        this.trainingAnswered = false;
        this.trainingErrors = [];
        
        // 多模式训练结果跟踪
        this.trainingMultiModeResults = {
            recognition: { correct: 0, errors: [] },
            spelling: { correct: 0, errors: [] },
            listening: { correct: 0, errors: [] }
        };
        this.trainingWordResults = {}; // 跟踪每个单词在每种模式下的结果
        
        // 听写模式设置
        this.listeningInterval = listeningInterval;
        this.listeningPlayCount = listeningPlayCount;
        this.listeningShowChinese = listeningShowChinese;
        this.listeningShowFirstLetter = listeningShowFirstLetter;
        
        // 显示训练界面
        const trainingInterface = document.getElementById('training-interface');
        if (trainingInterface) {
            trainingInterface.classList.remove('hidden');
            trainingInterface.classList.add('active');
        }
        
        // 设置退出按钮
        const exitBtn = document.getElementById('btn-exit-training');
        if (exitBtn) exitBtn.onclick = () => this.exitTraining();
        
        // 设置发音按钮
        const speakBtn = document.getElementById('btn-training-speak');
        if (speakBtn) speakBtn.onclick = () => this.playCurrentTrainingWord();
        
        // 设置导航按钮
        const prevBtn = document.getElementById('btn-training-prev');
        const nextBtn = document.getElementById('btn-training-next');
        if (prevBtn) prevBtn.onclick = () => this.prevTrainingWord();
        if (nextBtn) nextBtn.onclick = () => this.nextTrainingWord();
        
        // 更新模式指示器
        this.updateTrainingModeIndicator();
        
        // 显示第一个单词
        this.showTrainingWord();
    }
    
    /**
     * 更新训练模式指示器
     */
    updateTrainingModeIndicator() {
        const indicator = document.getElementById('training-mode-indicator');
        if (!indicator) return;
        
        const modeInfo = {
            recognition: { icon: '👁️', name: '认读模式' },
            spelling: { icon: '✍️', name: '拼写模式' },
            listening: { icon: '🎧', name: '听音模式' }
        };
        
        const currentMode = this.trainingModes[this.trainingModeIndex];
        const info = modeInfo[currentMode];
        if (info) {
            indicator.querySelector('.mode-icon').textContent = info.icon;
            indicator.querySelector('.mode-name').textContent = info.name;
        }
    }
    
    /**
     * 记录单词在特定模式下的结果
     */
    recordWordResult(word, mode, isCorrect) {
        if (!this.trainingWordResults[word]) {
            this.trainingWordResults[word] = {};
        }
        this.trainingWordResults[word][mode] = isCorrect;
        
        // 更新模式结果统计
        if (this.trainingMultiModeResults[mode]) {
            if (isCorrect) {
                this.trainingMultiModeResults[mode].correct++;
            } else {
                this.trainingMultiModeResults[mode].errors.push(word);
            }
        }
    }
    
    /**
     * 显示训练单词
     */
    showTrainingWord() {
        const word = this.trainingWords[this.trainingIndex];
        if (!word) return;
        
        this.trainingAnswered = false;
        
        // 更新进度
        const progressFill = document.getElementById('training-progress-fill');
        const progressText = document.getElementById('training-progress-text');
        const progress = ((this.trainingIndex + 1) / this.trainingWords.length) * 100;
        if (progressFill) progressFill.style.width = `${progress}%`;
        if (progressText) progressText.textContent = `${this.trainingIndex + 1}/${this.trainingWords.length}`;
        
        // 更新导航按钮
        const prevBtn = document.getElementById('btn-training-prev');
        const nextBtn = document.getElementById('btn-training-next');
        if (prevBtn) prevBtn.disabled = this.trainingIndex === 0;
        if (nextBtn) {
            nextBtn.disabled = true;
            nextBtn.querySelector('span:last-child').textContent = '下一个';
        }
        
        // 渲染内容
        const content = document.getElementById('training-content');
        if (!content) return;
        
        if (this.trainingMode === 'recognition') {
            this.renderRecognitionMode(word, content);
        } else if (this.trainingMode === 'spelling') {
            this.renderSpellingMode(word, content);
        } else if (this.trainingMode === 'listening') {
            this.renderListeningMode(word, content);
        }
        
        // 自动播放发音
        setTimeout(() => this.playCurrentTrainingWord(), 300);
    }
    
    /**
     * 认读模式渲染
     */
    renderRecognitionMode(word, container) {
        const allWords = vocabulary.getAll();
        const options = [word.meaning];
        const otherWords = allWords.filter(w => w.word !== word.word)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);
        otherWords.forEach(w => options.push(w.meaning));
        options.sort(() => Math.random() - 0.5);
        
        container.innerHTML = `
            <div class="recognition-card">
                <div class="recognition-word" id="training-word">${word.word}</div>
                <div class="recognition-phonetic">${word.phonetic || ''}</div>
                <div class="recognition-options" id="training-options">
                    ${options.map((opt, i) => `
                        <button class="recognition-option" data-meaning="${opt}" data-index="${i}">
                            <span class="option-key">${i + 1}</span>
                            ${opt}
                        </button>
                    `).join('')}
                </div>
                <div class="recognition-detail" id="recognition-detail" style="display:none"></div>
            </div>
        `;
        
        // 选项点击事件
        container.querySelectorAll('.recognition-option').forEach(btn => {
            btn.onclick = () => this.handleRecognitionAnswer(btn, word);
        });
    }
    
    /**
     * 处理认读模式答案
     */
    async handleRecognitionAnswer(btn, word) {
        if (this.trainingAnswered) return;
        this.trainingAnswered = true;
        
        const selectedMeaning = btn.dataset.meaning;
        const isCorrect = selectedMeaning === word.meaning;
        
        // 记录学习结果
        await vocabulary.studyWord(word.word, isCorrect);
        await vocabulary.updateStudyStats(word.word, isCorrect);
        
        // 记录多模式训练结果
        this.recordWordResult(word.word, 'recognition', isCorrect);
        
        if (isCorrect) {
            this.trainingCorrect++;
            btn.classList.add('correct');
            this.showVocabularyNotification('正确！', 'success');
        } else {
            btn.classList.add('wrong');
            // 高亮正确选项
            document.querySelectorAll('.recognition-option').forEach(b => {
                if (b.dataset.meaning === word.meaning) b.classList.add('correct');
            });
            this.showVocabularyNotification('错误！', 'error');
            this.trainingErrors.push(word);
            
            // 自动添加到错题本
            wrongBook.addWrongWord({
                word: word.word,
                meaning: word.meaning,
                phonetic: word.phonetic || '',
                fromList: 'vocabulary-recognition'
            });
        }
        
        // 显示单词详情
        const detail = document.getElementById('recognition-detail');
        if (detail) {
            detail.style.display = 'block';
            detail.innerHTML = `
                <div class="detail-meaning">${word.meaning}</div>
                <div class="detail-phonetic">${word.phonetic || ''}</div>
                ${word.example ? `<div class="detail-example">"${word.example}"</div>` : ''}
            `;
        }
        
        // 禁用所有选项
        document.querySelectorAll('.recognition-option').forEach(b => b.classList.add('disabled'));
        
        // 启用下一个按钮
        const nextBtn = document.getElementById('btn-training-next');
        if (nextBtn) nextBtn.disabled = false;
    }
    
    /**
     * 拼写模式渲染
     */
    renderSpellingMode(word, container) {
        container.innerHTML = `
            <div class="spelling-card">
                <div class="spelling-prompt">${word.meaning}</div>
                <div class="spelling-phonetic">${word.phonetic || ''}</div>
                <div class="spelling-input-area">
                    <input type="text" class="spelling-input" id="spelling-input" 
                           placeholder="请输入单词" autocomplete="off" autofocus>
                </div>
                <button class="spelling-hint-btn" id="btn-spelling-hint">显示提示</button>
                <div class="spelling-feedback" id="spelling-feedback"></div>
            </div>
        `;
        
        const input = document.getElementById('spelling-input');
        if (input) {
            input.focus();
            input.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    this.checkSpellingAnswer(word);
                }
            };
        }
        
        const hintBtn = document.getElementById('btn-spelling-hint');
        if (hintBtn) {
            hintBtn.onclick = () => {
                const firstLetter = word.word[0];
                const hint = firstLetter + '_ '.repeat(word.word.length - 1);
                hintBtn.textContent = `提示: ${hint}`;
                hintBtn.disabled = true;
            };
        }
    }
    
    /**
     * 检查拼写答案
     */
    async checkSpellingAnswer(word) {
        if (this.trainingAnswered) return;
        
        const input = document.getElementById('spelling-input');
        if (!input) return;
        
        const userAnswer = input.value.trim().toLowerCase();
        if (!userAnswer) {
            input.classList.add('input-shake');
            setTimeout(() => input.classList.remove('input-shake'), 300);
            return;
        }
        
        this.trainingAnswered = true;
        const isCorrect = userAnswer === word.word.toLowerCase();
        
        // 记录学习结果
        await vocabulary.studyWord(word.word, isCorrect);
        await vocabulary.updateStudyStats(word.word, isCorrect);
        
        // 记录多模式训练结果
        this.recordWordResult(word.word, 'spelling', isCorrect);
        
        const feedback = document.getElementById('spelling-feedback');
        
        if (isCorrect) {
            this.trainingCorrect++;
            input.classList.add('correct');
            this.showVocabularyNotification('正确！', 'success');
            if (feedback) feedback.innerHTML = `<div class="correct-word">✓ ${word.word}</div>`;
        } else {
            input.classList.add('wrong');
            input.classList.add('input-shake');
            this.showVocabularyNotification('错误！', 'error');
            this.trainingErrors.push(word);
            
            // 自动添加到错题本
            wrongBook.addWrongWord({
                word: word.word,
                meaning: word.meaning,
                phonetic: word.phonetic || '',
                fromList: 'vocabulary-spelling'
            });
            
            // 显示正确拼写，错误字母标红
            if (feedback) {
                let diffHtml = '';
                for (let i = 0; i < word.word.length; i++) {
                    const correctChar = word.word[i];
                    const userChar = userAnswer[i] || '';
                    if (correctChar.toLowerCase() === userChar.toLowerCase()) {
                        diffHtml += `<span class="correct-letter">${correctChar}</span>`;
                    } else {
                        diffHtml += `<span class="wrong-letter">${correctChar}</span>`;
                    }
                }
                feedback.innerHTML = `
                    <div class="wrong-word">你的答案: ${userAnswer}</div>
                    <div class="correct-word">正确拼写: ${diffHtml}</div>
                `;
            }
        }
        
        input.disabled = true;
        
        // 启用下一个按钮
        const nextBtn = document.getElementById('btn-training-next');
        if (nextBtn) nextBtn.disabled = false;
    }
    
    /**
     * 听音模式渲染
     */
    renderListeningMode(word, container) {
        container.innerHTML = `
            <div class="spelling-card">
                <div class="spelling-prompt">听发音，写单词</div>
                <div class="spelling-phonetic" id="listening-hint"></div>
                <button class="training-speak-btn" id="btn-listening-play" style="margin-bottom:var(--vb-space-xl)">
                    <span>🔊</span>
                    <span>点击播放发音</span>
                </button>
                <div class="spelling-input-area">
                    <input type="text" class="spelling-input" id="listening-input" 
                           placeholder="请输入单词" autocomplete="off">
                </div>
                <button class="spelling-hint-btn" id="btn-listening-hint">显示提示</button>
                <div class="spelling-feedback" id="listening-feedback"></div>
            </div>
        `;
        
        const playBtn = document.getElementById('btn-listening-play');
        if (playBtn) playBtn.onclick = () => this.playCurrentTrainingWord();
        
        const input = document.getElementById('listening-input');
        if (input) {
            input.focus();
            input.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    this.checkListeningAnswer(word);
                }
            };
        }
        
        const hintBtn = document.getElementById('btn-listening-hint');
        if (hintBtn) {
            hintBtn.onclick = () => {
                const hintEl = document.getElementById('listening-hint');
                if (hintEl) hintEl.textContent = word.meaning;
                hintBtn.textContent = `首字母: ${word.word[0]}`;
                hintBtn.disabled = true;
            };
        }
    }
    
    /**
     * 检查听音答案
     */
    async checkListeningAnswer(word) {
        if (this.trainingAnswered) return;
        
        const input = document.getElementById('listening-input');
        if (!input) return;
        
        const userAnswer = input.value.trim().toLowerCase();
        if (!userAnswer) {
            input.classList.add('input-shake');
            setTimeout(() => input.classList.remove('input-shake'), 300);
            return;
        }
        
        this.trainingAnswered = true;
        const isCorrect = userAnswer === word.word.toLowerCase();
        
        await vocabulary.studyWord(word.word, isCorrect);
        await vocabulary.updateStudyStats(word.word, isCorrect);
        
        // 记录多模式训练结果
        this.recordWordResult(word.word, 'listening', isCorrect);
        
        const feedback = document.getElementById('listening-feedback');
        
        if (isCorrect) {
            this.trainingCorrect++;
            input.classList.add('correct');
            this.showVocabularyNotification('正确！', 'success');
            if (feedback) feedback.innerHTML = `<div class="correct-word">✓ ${word.word}</div>`;
        } else {
            input.classList.add('wrong');
            input.classList.add('input-shake');
            this.showVocabularyNotification('错误！', 'error');
            this.trainingErrors.push(word);
            
            // 自动添加到错题本
            wrongBook.addWrongWord({
                word: word.word,
                meaning: word.meaning,
                phonetic: word.phonetic || '',
                fromList: 'vocabulary-listening'
            });
            
            if (feedback) {
                let diffHtml = '';
                for (let i = 0; i < word.word.length; i++) {
                    const correctChar = word.word[i];
                    const userChar = userAnswer[i] || '';
                    if (correctChar.toLowerCase() === userChar.toLowerCase()) {
                        diffHtml += `<span class="correct-letter">${correctChar}</span>`;
                    } else {
                        diffHtml += `<span class="wrong-letter">${correctChar}</span>`;
                    }
                }
                feedback.innerHTML = `
                    <div class="wrong-word">你的答案: ${userAnswer}</div>
                    <div class="correct-word">正确拼写: ${diffHtml}</div>
                `;
            }
        }
        
        input.disabled = true;
        
        const nextBtn = document.getElementById('btn-training-next');
        if (nextBtn) nextBtn.disabled = false;
    }
    
    /**
     * 播放当前训练单词发音
     */
    playCurrentTrainingWord() {
        const word = this.trainingWords[this.trainingIndex];
        if (!word) return;
        
        if (typeof audioManager !== 'undefined' && audioManager.speak) {
            audioManager.speak(word.word, 'en-US');
        }
    }
    
    /**
     * 下一个训练单词
     */
    nextTrainingWord() {
        this.trainingIndex++;
        if (this.trainingIndex >= this.trainingWords.length) {
            // 当前模式完成，检查是否还有下一个模式
            this.trainingModeIndex++;
            if (this.trainingModeIndex < this.trainingModes.length) {
                // 切换到下一个模式
                this.trainingMode = this.trainingModes[this.trainingModeIndex];
                this.trainingIndex = 0;
                this.trainingCorrect = 0;
                this.trainingErrors = [];
                this.trainingAnswered = false;
                
                // 更新模式指示器
                this.updateTrainingModeIndicator();
                
                // 显示模式切换提示
                const modeNames = { recognition: '认读', spelling: '拼写', listening: '听音' };
                this.showVocabularyNotification(`${modeNames[this.trainingMode]}模式开始`, 'info');
                
                // 显示第一个单词
                setTimeout(() => this.showTrainingWord(), 500);
            } else {
                // 所有模式完成，显示结果
                this.showTrainingResult();
            }
        } else {
            this.showTrainingWord();
        }
    }
    
    /**
     * 上一个训练单词
     */
    prevTrainingWord() {
        if (this.trainingIndex > 0) {
            this.trainingIndex--;
            this.showTrainingWord();
        }
    }
    
    /**
     * 退出训练
     */
    exitTraining() {
        this.trainingMode = null;
        this.trainingModes = null;
        this.trainingModeIndex = 0;
        this.trainingMultiModeResults = null;
        this.trainingWordResults = null;
        
        const trainingInterface = document.getElementById('training-interface');
        if (trainingInterface) {
            trainingInterface.classList.remove('active');
            trainingInterface.classList.add('hidden');
        }
        this.renderVocabularyList();
        this.updateVocabularyHeaderStats();
    }
    
    /**
     * 显示训练结果
     */
    async showTrainingResult() {
        this.trainingMode = null;
        
        // 隐藏训练界面
        const trainingInterface = document.getElementById('training-interface');
        if (trainingInterface) {
            trainingInterface.classList.remove('active');
            trainingInterface.classList.add('hidden');
        }
        
        // 显示结果界面
        const resultInterface = document.getElementById('training-result');
        if (resultInterface) {
            resultInterface.classList.remove('hidden');
            resultInterface.classList.add('active');
        }
        
        // 计算多模式统计数据
        const duration = Math.round((Date.now() - this.trainingStartTime) / 60000);
        const totalWords = this.trainingWords.length;
        const totalAttempts = totalWords * 3; // 每个单词3种模式
        
        // 计算总正确数（所有模式）
        let totalCorrect = 0;
        let allModeErrors = new Set();
        
        Object.values(this.trainingMultiModeResults).forEach(modeResult => {
            totalCorrect += modeResult.correct;
            modeResult.errors.forEach(word => allModeErrors.add(word));
        });
        
        const accuracy = totalAttempts > 0 
            ? Math.round((totalCorrect / totalAttempts) * 100) 
            : 0;
        
        // 计算完全掌握的单词数（三种模式全部通过）
        let fullyMasteredCount = 0;
        let partiallyMasteredWords = [];
        
        Object.entries(this.trainingWordResults).forEach(([word, modes]) => {
            const allCorrect = modes.recognition && modes.spelling && modes.listening;
            if (allCorrect) {
                fullyMasteredCount++;
            } else {
                partiallyMasteredWords.push(word);
            }
        });
        
        // 更新结果数据
        const timeEl = document.getElementById('result-time');
        const newWordsEl = document.getElementById('result-new-words');
        const reviewWordsEl = document.getElementById('result-review-words');
        const accuracyEl = document.getElementById('result-accuracy');
        
        if (timeEl) timeEl.textContent = `${duration}分钟`;
        if (newWordsEl) newWordsEl.textContent = `${fullyMasteredCount}/${totalWords}`;
        if (reviewWordsEl) reviewWordsEl.textContent = `${partiallyMasteredWords.length}个需复习`;
        if (accuracyEl) accuracyEl.textContent = `${accuracy}%`;
        
        // 更新标题
        const resultTitle = document.querySelector('.result-title');
        if (resultTitle) {
            resultTitle.textContent = `训练完成 - ${fullyMasteredCount}个单词完全掌握`;
        }
        
        // 显示错误单词（部分掌握的单词）
        const errorList = document.getElementById('error-words-list');
        if (errorList && partiallyMasteredWords.length > 0) {
            errorList.innerHTML = `
                <div class="error-section-title">未完全掌握的单词（需复习）</div>
                ${partiallyMasteredWords.map(word => {
                    const modes = this.trainingWordResults[word] || {};
                    const modeStatus = [];
                    if (modes.recognition === false) modeStatus.push('认读');
                    if (modes.spelling === false) modeStatus.push('拼写');
                    if (modes.listening === false) modeStatus.push('听音');
                    return `
                        <div class="error-word-item">
                            <div class="word">${word}</div>
                            <div class="meaning">${modeStatus.join('、')}错误</div>
                        </div>
                    `;
                }).join('')}
            `;
        } else if (errorList) {
            errorList.innerHTML = '<div style="color:var(--vb-text-muted)">全部掌握，太棒了！🎉</div>';
        }
        
        // 按钮事件
        const viewErrorsBtn = document.getElementById('btn-view-errors');
        const practiceAgainBtn = document.getElementById('btn-practice-again');
        const backHomeBtn = document.getElementById('btn-back-home');
        
        if (viewErrorsBtn) {
            viewErrorsBtn.onclick = async () => {
                resultInterface.classList.remove('active');
                resultInterface.classList.add('hidden');
                await this.switchVocabularyModule('wrong-book');
            };
        }
        
        if (practiceAgainBtn) {
            practiceAgainBtn.onclick = () => {
                resultInterface.classList.remove('active');
                resultInterface.classList.add('hidden');
                this.startTraining();
            };
        }
        
        if (backHomeBtn) {
            backHomeBtn.onclick = () => {
                resultInterface.classList.remove('active');
                resultInterface.classList.add('hidden');
                this.renderVocabularyList();
                this.updateVocabularyHeaderStats();
            };
        }
        
        // 刷新数据
        await vocabulary.refresh();
        this.renderVocabularyList();
        this.updateVocabularyHeaderStats();
    }
    
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
    }
    
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
        
        // 设置倒计时
        this.dictationTimer = this.dictationInterval / 1000;
        const timerEl = document.getElementById('dictation-timer');
        if (timerEl) timerEl.textContent = `${this.dictationTimer}s`;
        
        if (this.dictationCountdown) clearInterval(this.dictationCountdown);
        this.dictationCountdown = setInterval(() => {
            this.dictationTimer--;
            if (timerEl) timerEl.textContent = `${this.dictationTimer}s`;
            if (this.dictationTimer <= 0) {
                clearInterval(this.dictationCountdown);
                this.dictationIndex++;
                if (this.dictationIndex >= this.dictationWords.length) {
                    this.showTrainingResult();
                } else {
                    this.showDictationWord();
                }
            }
        }, 1000);
    }
    
    /**
     * 播放听写单词
     */
    playDictationWord() {
        const word = this.dictationWords[this.dictationIndex];
        if (!word) return;
        
        if (typeof audioManager !== 'undefined' && audioManager.speak) {
            audioManager.speak(word.word, 'en-US');
        }
    }
    
    /**
     * 提交听写答案
     */
    submitDictationAnswer() {
        if (this.dictationCountdown) clearInterval(this.dictationCountdown);
        
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
            vocabulary.studyWord(word.word, true);
        } else {
            input.classList.add('wrong');
            vocabulary.studyWord(word.word, false);
            this.dictationResults.push({ word, userAnswer });
        }
        
        // 自动跳转下一个
        setTimeout(() => {
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
        }, 1000);
    }
    
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
    
    /**
     * 显示记单词通知
     */
    showVocabularyNotification(message, type = 'info') {
        // 移除现有通知
        const existing = document.querySelector('.vocabulary-notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = `vocabulary-notification vocabulary-notification-${type}`;
        notification.innerHTML = `
            <span class="vocabulary-notification-icon">${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : type === 'error' ? '❌' : 'ℹ️'}</span>
            <span class="vocabulary-notification-text">${message}</span>
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
    
    /**
     * 切换历史记录面板
     */
    toggleHistoryPanel(show = null) {
        const panel = document.getElementById('vocabulary-history-panel');
        if (!panel) return;
        
        if (show === null) {
            show = panel.classList.contains('hidden');
        }
        
        if (show) {
            panel.classList.remove('hidden');
            // 设置默认日期为今天
            const today = new Date().toISOString().split('T')[0];
            const dateInput = document.getElementById('history-date');
            if (dateInput) dateInput.value = today;
            this.loadHistory();
        } else {
            panel.classList.add('hidden');
        }
    }
    
    /**
     * 加载历史记录
     */
    async loadHistory() {
        const dateInput = document.getElementById('history-date');
        const summaryContainer = document.getElementById('history-summary');
        const listContainer = document.getElementById('history-list');
        
        if (!dateInput || !summaryContainer || !listContainer) return;
        
        const date = dateInput.value;
        if (!date) {
            this.showVocabularyNotification('请选择日期', 'warning');
            return;
        }
        
        try {
            const records = await vocabulary.getDailyRecord(date);
            
            if (!records || records.length === 0) {
                summaryContainer.innerHTML = `
                    <div class="history-empty">
                        <div class="history-empty-icon">📅</div>
                        <div class="history-empty-text">该日无学习记录</div>
                    </div>
                `;
                listContainer.innerHTML = '';
                return;
            }
            
            // 计算统计信息
            const totalWords = records.length;
            const correctWords = records.filter(r => r.correct).length;
            const accuracy = totalWords > 0 ? Math.round((correctWords / totalWords) * 100) : 0;
            
            summaryContainer.innerHTML = `
                <div class="history-stats">
                    <div class="history-stat-item">
                        <div class="history-stat-value">${totalWords}</div>
                        <div class="history-stat-label">学习单词</div>
                    </div>
                    <div class="history-stat-item">
                        <div class="history-stat-value">${correctWords}</div>
                        <div class="history-stat-label">正确</div>
                    </div>
                    <div class="history-stat-item">
                        <div class="history-stat-value">${accuracy}%</div>
                        <div class="history-stat-label">正确率</div>
                    </div>
                </div>
            `;
            
            // 渲染记录列表
            listContainer.innerHTML = records.map(record => `
                <div class="history-record-item ${record.correct ? 'correct' : 'wrong'}">
                    <div class="history-record-header">
                        <div class="history-record-word">${record.word}</div>
                        <div class="history-record-status ${record.correct ? 'correct' : 'wrong'}">
                            ${record.correct ? '✅' : '❌'}
                        </div>
                    </div>
                    <div class="history-record-meaning">${record.meaning || ''}</div>
                    ${record.phonetic ? `<div class="history-record-phonetic">${record.phonetic}</div>` : ''}
                    <div class="history-record-time">
                        学习时间: ${new Date(record.studyTime).toLocaleTimeString('zh-CN')}
                    </div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('加载历史记录失败:', error);
            this.showVocabularyNotification('加载历史记录失败', 'error');
        }
    }
    
    /**
     * 切换成就徽章面板
     */
    async toggleAchievementsPanel(show = null) {
        const panel = document.getElementById('vocabulary-achievements');
        if (!panel) return;
        
        if (show === null) {
            show = panel.classList.contains('hidden');
        }
        
        if (show) {
            panel.classList.remove('hidden');
            await this.renderAchievements();
        } else {
            panel.classList.add('hidden');
        }
    }
    
    /**
     * 渲染成就徽章
     */
    async renderAchievements() {
        const gridContainer = document.getElementById('achievements-grid');
        if (!gridContainer) return;
        
        try {
            const userStats = await vocabulary.getUserStats();
            if (!userStats) {
                gridContainer.innerHTML = `
                    <div class="achievements-empty">
                        <div class="achievements-empty-icon">🏆</div>
                        <div class="achievements-empty-text">加载成就信息失败</div>
                    </div>
                `;
                return;
            }
            
            const achievements = userStats.achievements || [];
            const levelConfig = userStats.levelConfig || [];
            
            // 创建等级成就
            const levelAchievements = levelConfig.map(level => {
                const isUnlocked = userStats.levelInfo.level >= level.level;
                return {
                    id: `level_${level.level}`,
                    name: level.title,
                    desc: `达到${level.title}等级`,
                    icon: level.icon,
                    unlocked: isUnlocked,
                    progress: isUnlocked ? 100 : Math.min((userStats.stats.totalWordsLearned / level.minWords) * 100, 100),
                    target: level.minWords,
                    isLevel: true
                };
            });
            
            // 合并所有成就
            const allAchievements = [...levelAchievements, ...achievements.map(a => ({
                ...a,
                unlocked: a.unlocked || false,
                progress: a.progress || 0,
                target: a.target || 1,
                isLevel: false
            }))];
            
            // 按解锁状态和进度排序
            allAchievements.sort((a, b) => {
                if (a.unlocked && !b.unlocked) return -1;
                if (!a.unlocked && b.unlocked) return 1;
                return b.progress - a.progress;
            });
            
            gridContainer.innerHTML = allAchievements.map(achievement => {
                const progressPercent = achievement.target > 0 
                    ? Math.min((achievement.progress / achievement.target) * 100, 100) 
                    : 0;
                
                return `
                    <div class="achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}">
                        <div class="achievement-icon">${achievement.icon}</div>
                        <div class="achievement-info">
                            <div class="achievement-name">${achievement.name}</div>
                            <div class="achievement-desc">${achievement.desc}</div>
                            ${!achievement.unlocked ? `
                                <div class="achievement-progress">
                                    <div class="achievement-progress-bar">
                                        <div class="achievement-progress-fill" style="width: ${progressPercent}%"></div>
                                    </div>
                                    <div class="achievement-progress-text">
                                        ${achievement.isLevel 
                                            ? `${userStats.stats.totalWordsLearned}/${achievement.target}个单词` 
                                            : `${achievement.progress}/${achievement.target}`
                                        }
                                    </div>
                                </div>
                            ` : `
                                <div class="achievement-unlocked-time">
                                    ${achievement.unlockedTime ? `解锁于 ${new Date(achievement.unlockedTime).toLocaleDateString('zh-CN')}` : '已解锁'}
                                </div>
                            `}
                        </div>
                    </div>
                `;
            }).join('');
            
        } catch (error) {
            console.error('渲染成就徽章失败:', error);
            gridContainer.innerHTML = `
                <div class="achievements-empty">
                    <div class="achievements-empty-icon">❌</div>
                    <div class="achievements-empty-text">加载成就信息失败</div>
                </div>
            `;
        }
    }
    
    /**
     * 切换添加单词面板
     */
    toggleAddPanel(show = null) {
        const panel = document.getElementById('vocabulary-add-panel');
        if (!panel) return;
        
        if (show === null) {
            show = panel.classList.contains('hidden');
        }
        
        if (show) {
            panel.classList.remove('hidden');
            // 清空表单
            document.getElementById('add-word').value = '';
            document.getElementById('add-meaning').value = '';
            document.getElementById('add-phonetic').value = '';
            document.getElementById('add-example').value = '';
            document.getElementById('add-rootAffix').value = '';
            document.getElementById('add-grade').value = '';
        } else {
            panel.classList.add('hidden');
        }
    }
    
    /**
     * 提交新单词
     */
    async submitNewWord() {
        const word = document.getElementById('add-word').value.trim();
        const meaning = document.getElementById('add-meaning').value.trim();
        const phonetic = document.getElementById('add-phonetic').value.trim();
        const example = document.getElementById('add-example').value.trim();
        const rootAffix = document.getElementById('add-rootAffix').value.trim();
        const grade = document.getElementById('add-grade').value;
        
        if (!word) {
            this.showVocabularyNotification('请输入单词', 'warning');
            return;
        }
        
        if (!meaning) {
            this.showVocabularyNotification('请输入释义', 'warning');
            return;
        }
        
        try {
            await vocabulary.addWord({
                word,
                meaning,
                phonetic,
                example,
                rootAffix,
                grade,
                source: 'manual'
            });
            
            this.showVocabularyNotification(`单词 "${word}" 已添加`, 'success');
            this.toggleAddPanel(false);
            this.renderVocabularyList();
        } catch (error) {
            console.error('添加单词失败:', error);
            this.showVocabularyNotification('添加单词失败', 'error');
        }
    }
    
    /**
     * 切换历史单词面板（保留兼容性）
     */
    async toggleHistoryWords() {
        await this.switchVocabularyModule('history-words');
    }
    
    /**
     * 渲染历史单词列表
     */
    async renderHistoryWords() {
        const historyList = document.getElementById('history-list');
        const historyStats = document.getElementById('history-stats');
        if (!historyList || !historyStats) return;
        
        try {
            // 获取历史日期列表
            const historyDates = await vocabulary.getHistoryDates();
            
            if (historyDates.length === 0) {
                historyStats.innerHTML = `
                    <div class="history-empty">
                        <div class="empty-icon">📚</div>
                        <div class="empty-text">暂无学习记录</div>
                        <div class="empty-subtext">开始训练后，历史记录将显示在这里</div>
                    </div>
                `;
                historyList.innerHTML = '';
                return;
            }
            
            // 显示统计信息
            const totalDays = historyDates.length;
            const totalWords = historyDates.reduce((sum, date) => sum + date.wordCount, 0);
            const avgAccuracy = historyDates.reduce((sum, date) => sum + parseFloat(date.accuracy), 0) / totalDays;
            
            historyStats.innerHTML = `
                <div class="history-stats-grid">
                    <div class="history-stat-card">
                        <div class="stat-icon">📅</div>
                        <div class="stat-value">${totalDays}</div>
                        <div class="stat-label">学习天数</div>
                    </div>
                    <div class="history-stat-card">
                        <div class="stat-icon">📝</div>
                        <div class="stat-value">${totalWords}</div>
                        <div class="stat-label">学习单词数</div>
                    </div>
                    <div class="history-stat-card">
                        <div class="stat-icon">🎯</div>
                        <div class="stat-value">${avgAccuracy.toFixed(1)}%</div>
                        <div class="stat-label">平均正确率</div>
                    </div>
                </div>
            `;
            
            // 按日期分组显示历史单词
            let historyHtml = '';
            
            for (const dateInfo of historyDates) {
                const date = dateInfo.date;
                const formattedDate = this.formatDate(date);
                
                historyHtml += `
                    <div class="history-date-group">
                        <div class="history-date-header">
                            <div class="date-label">
                                <span class="date-icon">📅</span>
                                <span class="date-text">${formattedDate}</span>
                            </div>
                            <div class="date-stats">
                                <span class="date-stat">${dateInfo.wordCount} 个单词</span>
                                <span class="date-stat">正确率: ${dateInfo.accuracy}%</span>
                            </div>
                        </div>
                        <div class="history-date-words" id="history-words-${date}">
                            <div class="loading-words">加载中...</div>
                        </div>
                    </div>
                `;
            }
            
            historyList.innerHTML = historyHtml;
            
            // 异步加载每个日期的单词
            for (const dateInfo of historyDates) {
                const date = dateInfo.date;
                const words = await vocabulary.getDailyRecord(date);
                const wordsContainer = document.getElementById(`history-words-${date}`);
                
                if (wordsContainer && words.length > 0) {
                    wordsContainer.innerHTML = words.map(word => `
                        <div class="history-word-item ${word.correct ? 'correct' : 'incorrect'}">
                            <div class="word-info">
                                <div class="word-text">${word.word}</div>
                                <div class="word-phonetic">${word.phonetic || ''}</div>
                            </div>
                            <div class="word-meaning">${word.meaning || ''}</div>
                            <div class="word-status">
                                <span class="status-icon">${word.correct ? '✅' : '❌'}</span>
                                <span class="status-text">${word.correct ? '正确' : '错误'}</span>
                            </div>
                        </div>
                    `).join('');
                } else if (wordsContainer) {
                    wordsContainer.innerHTML = '<div class="no-words">暂无记录</div>';
                }
            }
            
        } catch (error) {
            console.error('渲染历史单词失败:', error);
            historyList.innerHTML = `
                <div class="history-error">
                    <div class="error-icon">⚠️</div>
                    <div class="error-text">加载历史记录失败</div>
                    <div class="error-subtext">${error.message}</div>
                </div>
            `;
        }
    }
    
    /**
     * 格式化日期
     */
    formatDate(dateStr) {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (dateStr === today.toISOString().split('T')[0]) {
            return '今天';
        } else if (dateStr === yesterday.toISOString().split('T')[0]) {
            return '昨天';
        } else {
            return date.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'short'
            });
        }
    }
    
    /**
     * 显示编辑单词模态框
     */
    showEditWordModal(word) {
        const item = vocabulary.getAll().find(w => w.word === word);
        if (!item) return;
        
        // 创建模态框
        const modal = document.createElement('div');
        modal.className = 'vocabulary-edit-modal';
        modal.innerHTML = `
            <div class="edit-modal-content">
                <div class="edit-modal-header">
                    <h3>编辑单词: ${word}</h3>
                    <button class="edit-modal-close">&times;</button>
                </div>
                <div class="edit-modal-body">
                    <div class="form-group">
                        <label>单词</label>
                        <input type="text" id="edit-word" class="form-input" value="${item.word}" readonly>
                    </div>
                    <div class="form-group">
                        <label>释义 *</label>
                        <input type="text" id="edit-meaning" class="form-input" value="${item.meaning || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>音标</label>
                        <input type="text" id="edit-phonetic" class="form-input" value="${item.phonetic || ''}">
                    </div>
                    <div class="form-group">
                        <label>例句</label>
                        <textarea id="edit-example" class="form-textarea" rows="2">${item.example || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>词根词缀</label>
                        <input type="text" id="edit-rootAffix" class="form-input" value="${item.rootAffix || ''}">
                    </div>
                    <div class="form-group">
                        <label>年级</label>
                        <select id="edit-grade" class="form-select">
                            <option value="" ${!item.grade ? 'selected' : ''}>选择年级</option>
                            <option value="小学" ${item.grade === '小学' ? 'selected' : ''}>小学</option>
                            <option value="初中" ${item.grade === '初中' ? 'selected' : ''}>初中</option>
                            <option value="高中" ${item.grade === '高中' ? 'selected' : ''}>高中</option>
                            <option value="四级" ${item.grade === '四级' ? 'selected' : ''}>四级</option>
                            <option value="六级" ${item.grade === '六级' ? 'selected' : ''}>六级</option>
                            <option value="考研" ${item.grade === '考研' ? 'selected' : ''}>考研</option>
                            <option value="托福" ${item.grade === '托福' ? 'selected' : ''}>托福</option>
                            <option value="雅思" ${item.grade === '雅思' ? 'selected' : ''}>雅思</option>
                        </select>
                    </div>
                </div>
                <div class="edit-modal-footer">
                    <button class="edit-modal-cancel">取消</button>
                    <button class="edit-modal-save">保存</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 关闭按钮事件
        modal.querySelector('.edit-modal-close').onclick = () => modal.remove();
        modal.querySelector('.edit-modal-cancel').onclick = () => modal.remove();
        
        // 保存按钮事件
        modal.querySelector('.edit-modal-save').onclick = async () => {
            const meaning = document.getElementById('edit-meaning').value.trim();
            const phonetic = document.getElementById('edit-phonetic').value.trim();
            const example = document.getElementById('edit-example').value.trim();
            const rootAffix = document.getElementById('edit-rootAffix').value.trim();
            const grade = document.getElementById('edit-grade').value;
            
            if (!meaning) {
                this.showVocabularyNotification('请输入释义', 'warning');
                return;
            }
            
            try {
                // 使用addWord接口更新（已存在时会自动更新）
                await vocabulary.addWord({
                    word,
                    meaning,
                    phonetic,
                    example,
                    rootAffix,
                    grade,
                    source: item.source || 'manual'
                });
                
                this.showVocabularyNotification(`单词 "${word}" 已更新`, 'success');
                modal.remove();
                this.renderVocabularyList();
            } catch (error) {
                console.error('更新单词失败:', error);
                this.showVocabularyNotification('更新单词失败', 'error');
            }
        };
        
        // 点击模态框外部关闭
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
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