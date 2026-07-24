/**
 * 背单词等级系统配置
 * 参考百词斩设计，根据背单词数量和学习天数划分等级
 */

// 等级配置
const LEVEL_CONFIG = {
    // 等级阈值（累计学习单词数）
    thresholds: [
        { level: 1, minWords: 0, title: '萌芽期', icon: '🌱', desc: '开始你的单词之旅' },
        { level: 2, minWords: 50, title: '入门期', icon: '📘', desc: '已经掌握基础词汇' },
        { level: 3, minWords: 100, title: '成长期', icon: '📖', desc: '词汇量稳步增长' },
        { level: 4, minWords: 200, title: '进阶期', icon: '📚', desc: '词汇量突破200大关' },
        { level: 5, minWords: 350, title: '熟练期', icon: '🎯', desc: '词汇运用更加熟练' },
        { level: 6, minWords: 500, title: '精通期', icon: '💎', desc: '词汇量达到新高度' },
        { level: 7, minWords: 800, title: '专家期', icon: '👑', desc: '词汇量超越大多数人' },
        { level: 8, minWords: 1200, title: '大师期', icon: '🏆', desc: '词汇大师级别' },
        { level: 9, minWords: 1800, title: '宗师期', icon: '🌟', desc: '词汇量接近母语者' },
        { level: 10, minWords: 2500, title: '传奇期', icon: '🔥', desc: '词汇量达到巅峰' }
    ],

    // 等级经验值计算（每个等级需要的经验值）
    expPerLevel: [0, 50, 150, 300, 500, 750, 1100, 1600, 2200, 3000],

    // 成就配置
    achievements: [
        {
            id: 'first_word',
            name: '第一步',
            desc: '学会你的第一个单词',
            icon: '⭐',
            condition: (stats) => stats.totalWordsLearned >= 1,
            target: 1
        },
        {
            id: 'ten_words',
            name: '初学者',
            desc: '学会10个单词',
            icon: '📚',
            condition: (stats) => stats.totalWordsLearned >= 10,
            target: 10
        },
        {
            id: 'fifty_words',
            name: '进步者',
            desc: '学会50个单词',
            icon: '📖',
            condition: (stats) => stats.totalWordsLearned >= 50,
            target: 50
        },
        {
            id: 'hundred_words',
            name: '单词猎人',
            desc: '学会100个单词',
            icon: '🎯',
            condition: (stats) => stats.totalWordsLearned >= 100,
            target: 100
        },
        {
            id: 'three_days',
            name: '坚持者',
            desc: '连续学习3天',
            icon: '📅',
            condition: (stats) => stats.consecutiveDays >= 3,
            target: 3
        },
        {
            id: 'seven_days',
            name: '勤奋者',
            desc: '连续学习7天',
            icon: '🔥',
            condition: (stats) => stats.consecutiveDays >= 7,
            target: 7
        },
        {
            id: 'thirty_days',
            name: '坚持不懈',
            desc: '连续学习30天',
            icon: '💪',
            condition: (stats) => stats.maxConsecutiveDays >= 30,
            target: 30
        },
        {
            id: 'five_hundred_words',
            name: '单词大师',
            desc: '学会500个单词',
            icon: '💎',
            condition: (stats) => stats.totalWordsLearned >= 500,
            target: 500
        },
        {
            id: 'perfect_day',
            name: '完美主义者',
            desc: '单日学习正确率100%（至少5个单词）',
            icon: '✨',
            condition: (stats) => stats.todayAccuracy === 100 && stats.todayStudied >= 5,
            target: 1
        },
        {
            id: 'thousand_studies',
            name: '学习达人',
            desc: '累计学习1000次',
            icon: '🎖️',
            condition: (stats) => stats.totalStudies >= 1000,
            target: 1000
        }
    ]
};

/**
 * 根据学习单词数计算等级
 * @param {number} totalWords - 总学习单词数
 * @returns {object} 等级信息
 */
function calculateLevel(totalWords) {
    const config = LEVEL_CONFIG.thresholds;
    
    // 从高等级往低等级检查
    for (let i = config.length - 1; i >= 0; i--) {
        if (totalWords >= config[i].minWords) {
            const nextLevel = i < config.length - 1 ? config[i + 1] : null;
            const progress = nextLevel 
                ? ((totalWords - config[i].minWords) / (nextLevel.minWords - config[i].minWords) * 100).toFixed(1)
                : 100;
            
            return {
                level: config[i].level,
                title: config[i].title,
                icon: config[i].icon,
                desc: config[i].desc,
                currentWords: totalWords,
                nextLevelWords: nextLevel ? nextLevel.minWords : null,
                progress: Math.min(parseFloat(progress), 100)
            };
        }
    }
    
    // 默认返回1级
    return {
        level: 1,
        title: config[0].title,
        icon: config[0].icon,
        desc: config[0].desc,
        currentWords: totalWords,
        nextLevelWords: config[1].minWords,
        progress: (totalWords / config[1].minWords * 100).toFixed(1)
    };
}

/**
 * 检查成就是否解锁
 * @param {object} stats - 用户统计数据
 * @param {Array} unlockedAchievements - 已解锁的成就ID列表
 * @returns {Array} 新解锁的成就列表
 */
function checkAchievements(stats, unlockedAchievements = []) {
    const newAchievements = [];
    
    for (const achievement of LEVEL_CONFIG.achievements) {
        // 如果已经解锁，跳过
        if (unlockedAchievements.includes(achievement.id)) {
            continue;
        }
        
        // 检查是否满足条件
        if (achievement.condition(stats)) {
            newAchievements.push({
                id: achievement.id,
                name: achievement.name,
                desc: achievement.desc,
                icon: achievement.icon,
                unlockedTime: new Date().toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '')
            });
        }
    }
    
    return newAchievements;
}

/**
 * 计算连续学习天数
 * @param {string} lastStudyDate - 上次学习日期 (YYYY-MM-DD)
 * @param {number} currentConsecutive - 当前连续天数
 * @returns {object} 连续天数信息
 */
function calculateConsecutiveDays(lastStudyDate, currentConsecutive) {
    if (!lastStudyDate) {
        return { consecutiveDays: 1, isNewStreak: true };
    }
    
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    if (lastStudyDate === today) {
        // 今天已经学习过
        return { consecutiveDays: currentConsecutive, isNewStreak: false };
    } else if (lastStudyDate === yesterday) {
        // 昨天学习过，连续天数+1
        return { consecutiveDays: currentConsecutive + 1, isNewStreak: true };
    } else {
        // 中断了，重新开始
        return { consecutiveDays: 1, isNewStreak: true };
    }
}

module.exports = {
    LEVEL_CONFIG,
    calculateLevel,
    checkAchievements,
    calculateConsecutiveDays
};
