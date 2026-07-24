const express = require('express');
const router = express.Router();
const { queryWithRetry } = require('../db');
const { calculateLevel, checkAchievements, calculateConsecutiveDays, LEVEL_CONFIG } = require('../vocabulary-levels');

// 获取记单词词库列表（直接使用错题本数据）
router.get('/list', async (req, res) => {
    try {
        const [rows] = await queryWithRetry(
            'SELECT * FROM wrong_book WHERE deleted = 0 ORDER BY last_wrong_time DESC'
        );
        // 转换字段名为驼峰
        const data = rows.map(row => ({
            id: row.id,
            word: row.word,
            meaning: row.meaning,
            phonetic: row.phonetic,
            example: row.example,
            rootAffix: row.root_affix,
            grade: row.grade,
            source: row.from_source,
            addedTime: row.first_wrong_time,
            lastStudyTime: row.last_wrong_time,
            mastered: !!row.mastered,
            studyCount: row.wrong_count
        }));
        res.json({ success: true, data });
    } catch (error) {
        console.error('获取记单词词库失败:', error);
        res.json({ success: false, error: error.message });
    }
});

// 添加单词到记单词词库（直接操作错题本）
router.post('/add', async (req, res) => {
    try {
        const { word, meaning, phonetic, example, rootAffix, grade, source } = req.body;

        if (!word) {
            return res.json({ success: false, error: '单词不能为空' });
        }

        const now = new Date();

        // 检查是否已存在（包括已软删除的）
        const [existing] = await queryWithRetry(
            'SELECT * FROM wrong_book WHERE word = ?', [word]
        );

        if (existing.length > 0) {
            // 已存在，更新（如果是软删除的则恢复）
            await queryWithRetry(
                `UPDATE wrong_book SET 
                    meaning = IF(? != '', ?, meaning),
                    phonetic = IF(? != '', ?, phonetic),
                    example = IF(? != '', ?, example),
                    root_affix = IF(? != '', ?, root_affix),
                    grade = IF(? != '', ?, grade),
                    deleted = 0
                WHERE word = ?`,
                [meaning || '', meaning || '', phonetic || '', phonetic || '', example || '', example || '', rootAffix || '', rootAffix || '', grade || '', grade || '', word]
            );
        } else {
            // 新增
            await queryWithRetry(
                `INSERT INTO wrong_book 
                    (word, meaning, phonetic, example, root_affix, grade, from_source, from_list, wrong_count, first_wrong_time, last_wrong_time, mastered, error_type)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, 0, 'all')`,
                [word, meaning || '', phonetic || '', example || '', rootAffix || '', grade || '', source || 'manual', JSON.stringify([source || 'manual']), now, now]
            );
        }

        // 同时添加到总体记录表
        const [totalExisting] = await queryWithRetry(
            'SELECT * FROM vocabulary_total_record WHERE word = ?', [word]
        );

        if (totalExisting.length === 0) {
            await queryWithRetry(
                `INSERT INTO vocabulary_total_record 
                    (word, first_study_time, last_study_time, study_count, correct_count, mastered)
                VALUES (?, ?, ?, 0, 0, 0)`,
                [word, now, now]
            );
        }

        res.json({ success: true });
    } catch (error) {
        console.error('添加单词到词库失败:', error);
        res.json({ success: false, error: error.message });
    }
});

// 批量添加单词到记单词词库（直接操作错题本）
router.post('/add-batch', async (req, res) => {
    try {
        const { words } = req.body;

        if (!Array.isArray(words)) {
            return res.json({ success: false, error: '数据格式错误' });
        }

        let added = 0;
        let updated = 0;

        for (const item of words) {
            if (!item.word) continue;

            const now = new Date();

            // 检查是否已存在
            const [existing] = await queryWithRetry(
                'SELECT * FROM wrong_book WHERE word = ?', [item.word]
            );

            if (existing.length > 0) {
                // 已存在，更新
                await queryWithRetry(
                    `UPDATE wrong_book SET 
                        meaning = IF(? != '', ?, meaning),
                        phonetic = IF(? != '', ?, phonetic),
                        example = IF(? != '', ?, example),
                        root_affix = IF(? != '', ?, root_affix),
                        grade = IF(? != '', ?, grade),
                        deleted = 0
                    WHERE word = ?`,
                    [item.meaning || '', item.meaning || '', item.phonetic || '', item.phonetic || '', item.example || '', item.example || '', item.rootAffix || '', item.rootAffix || '', item.grade || '', item.grade || '', item.word]
                );
                updated++;
            } else {
                // 新增
                await queryWithRetry(
                    `INSERT INTO wrong_book 
                        (word, meaning, phonetic, example, root_affix, grade, from_source, from_list, wrong_count, first_wrong_time, last_wrong_time, mastered, error_type)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, 0, 'all')`,
                    [item.word, item.meaning || '', item.phonetic || '', item.example || '', item.rootAffix || '', item.grade || '', item.source || 'manual', JSON.stringify([item.source || 'manual']), now, now]
                );
                added++;
            }

            // 同时添加到总体记录表
            const [totalExisting] = await queryWithRetry(
                'SELECT * FROM vocabulary_total_record WHERE word = ?', [item.word]
            );

            if (totalExisting.length === 0) {
                await queryWithRetry(
                    `INSERT INTO vocabulary_total_record 
                        (word, first_study_time, last_study_time, study_count, correct_count, mastered)
                    VALUES (?, ?, ?, 0, 0, 0)`,
                    [item.word, now, now]
                );
            }
        }

        res.json({ success: true, added, updated });
    } catch (error) {
        console.error('批量添加单词失败:', error);
        res.json({ success: false, error: error.message });
    }
});

// 删除单词（软删除）
router.post('/remove', async (req, res) => {
    try {
        const { word } = req.body;

        if (!word) {
            return res.json({ success: false, error: '单词不能为空' });
        }

        await queryWithRetry('UPDATE wrong_book SET deleted = 1 WHERE word = ?', [word]);
        res.json({ success: true });
    } catch (error) {
        console.error('删除单词失败:', error);
        res.json({ success: false, error: error.message });
    }
});

// 标记/取消掌握
router.post('/mastered', async (req, res) => {
    try {
        const { word, mastered } = req.body;

        if (!word) {
            return res.json({ success: false, error: '单词不能为空' });
        }

        await queryWithRetry(
            'UPDATE wrong_book SET mastered = ? WHERE word = ?',
            [mastered ? 1 : 0, word]
        );

        // 同时更新总体记录
        if (mastered) {
            await queryWithRetry(
                'UPDATE vocabulary_total_record SET mastered = 1, mastered_time = NOW() WHERE word = ?',
                [word]
            );
        } else {
            await queryWithRetry(
                'UPDATE vocabulary_total_record SET mastered = 0, mastered_time = NULL WHERE word = ?',
                [word]
            );
        }

        res.json({ success: true });
    } catch (error) {
        console.error('更新掌握状态失败:', error);
        res.json({ success: false, error: error.message });
    }
});

// 清除已掌握的单词（软删除）
router.post('/clear-mastered', async (req, res) => {
    try {
        await queryWithRetry('UPDATE wrong_book SET deleted = 1 WHERE mastered = 1 AND deleted = 0');
        res.json({ success: true });
    } catch (error) {
        console.error('清除已掌握单词失败:', error);
        res.json({ success: false, error: error.message });
    }
});

// 清空词库（软删除）
router.post('/clear-all', async (req, res) => {
    try {
        await queryWithRetry('UPDATE wrong_book SET deleted = 1 WHERE deleted = 0');
        res.json({ success: true });
    } catch (error) {
        console.error('清空词库失败:', error);
        res.json({ success: false, error: error.message });
    }
});

// 获取今日记单词（每天5个）
router.get('/today', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // 获取今天已经学习过的单词
        const [studiedToday] = await queryWithRetry(
            'SELECT DISTINCT word FROM vocabulary_daily_record WHERE study_date = ?',
            [today]
        );
        const studiedWords = studiedToday.map(row => row.word);
        
        // 获取错题本中未掌握的单词
        const [unmasteredWords] = await queryWithRetry(
            'SELECT * FROM wrong_book WHERE mastered = 0 AND deleted = 0 ORDER BY RAND() LIMIT 5'
        );
        
        // 如果今天已经学了5个，返回已学习的单词
        if (studiedWords.length >= 5) {
            const [todayWords] = await queryWithRetry(
                'SELECT DISTINCT word, meaning, phonetic, example, root_affix, grade FROM wrong_book WHERE word IN (?) AND deleted = 0',
                [studiedWords]
            );
            
            const data = todayWords.map(row => ({
                word: row.word,
                meaning: row.meaning,
                phonetic: row.phonetic,
                example: row.example,
                rootAffix: row.root_affix,
                grade: row.grade
            }));
            
            return res.json({ 
                success: true, 
                data, 
                studied: studiedWords.length,
                total: 5,
                completed: true
            });
        }
        
        // 否则返回未学习的单词
        const data = unmasteredWords.map(row => ({
            word: row.word,
            meaning: row.meaning,
            phonetic: row.phonetic,
            example: row.example,
            rootAffix: row.root_affix,
            grade: row.grade
        }));
        
        res.json({ 
            success: true, 
            data, 
            studied: studiedWords.length,
            total: 5,
            completed: false
        });
    } catch (error) {
        console.error('获取今日记单词失败:', error);
        res.json({ success: false, error: error.message });
    }
});

// 记录学习单词
router.post('/study', async (req, res) => {
    try {
        const { word, correct, responseTime } = req.body;

        if (!word) {
            return res.json({ success: false, error: '单词不能为空' });
        }

        const today = new Date().toISOString().split('T')[0];
        const now = new Date();

        // 检查今天是否已经学习过这个单词
        const [existing] = await queryWithRetry(
            'SELECT * FROM vocabulary_daily_record WHERE word = ? AND study_date = ?',
            [word, today]
        );

        if (existing.length > 0) {
            // 更新学习记录
            await queryWithRetry(
                `UPDATE vocabulary_daily_record SET 
                    study_time = ?,
                    correct = ?,
                    response_time = ?
                WHERE word = ? AND study_date = ?`,
                [now, correct ? 1 : 0, responseTime || 0, word, today]
            );
        } else {
            // 新增学习记录
            await queryWithRetry(
                `INSERT INTO vocabulary_daily_record 
                    (word, study_date, study_time, correct, response_time)
                VALUES (?, ?, ?, ?, ?)`,
                [word, today, now, correct ? 1 : 0, responseTime || 0]
            );
        }

        // 更新错题本的学习次数
        await queryWithRetry(
            'UPDATE wrong_book SET wrong_count = wrong_count + 1, last_wrong_time = ? WHERE word = ?',
            [now, word]
        );

        // 更新总体记录
        await queryWithRetry(
            `UPDATE vocabulary_total_record SET 
                study_count = study_count + 1,
                correct_count = correct_count + ?,
                last_study_time = ?
            WHERE word = ?`,
            [correct ? 1 : 0, now, word]
        );

        // 检查是否已掌握（连续答对3次）
        if (correct) {
            const [totalRecord] = await queryWithRetry(
                'SELECT * FROM vocabulary_total_record WHERE word = ?',
                [word]
            );

            if (totalRecord.length > 0) {
                const record = totalRecord[0];
                const accuracy = record.study_count > 0 ? (record.correct_count / record.study_count) : 0;
                
                // 如果连续答对3次且正确率超过80%，标记为已掌握
                if (record.correct_count >= 3 && accuracy >= 0.8) {
                    await queryWithRetry(
                        'UPDATE wrong_book SET mastered = 1 WHERE word = ?',
                        [word]
                    );
                    await queryWithRetry(
                        'UPDATE vocabulary_total_record SET mastered = 1, mastered_time = NOW() WHERE word = ?',
                        [word]
                    );
                }
            }
        }

        res.json({ success: true });
    } catch (error) {
        console.error('记录学习单词失败:', error);
        res.json({ success: false, error: error.message });
    }
});

// 获取每日学习记录
router.get('/daily-record', async (req, res) => {
    try {
        const { date } = req.query;
        const queryDate = date || new Date().toISOString().split('T')[0];
        
        const [rows] = await queryWithRetry(
            `SELECT dr.*, wb.meaning, wb.phonetic, wb.example 
             FROM vocabulary_daily_record dr 
             LEFT JOIN wrong_book wb ON dr.word = wb.word AND wb.deleted = 0
             WHERE dr.study_date = ? 
             ORDER BY dr.study_time DESC`,
            [queryDate]
        );
        
        const data = rows.map(row => ({
            word: row.word,
            meaning: row.meaning,
            phonetic: row.phonetic,
            example: row.example,
            studyTime: row.study_time,
            correct: !!row.correct,
            responseTime: row.response_time
        }));
        
        res.json({ success: true, data });
    } catch (error) {
        console.error('获取每日学习记录失败:', error);
        res.json({ success: false, error: error.message });
    }
});

// 获取总体学习记录
router.get('/total-record', async (req, res) => {
    try {
        const [rows] = await queryWithRetry(
            `SELECT tr.*, wb.meaning, wb.phonetic 
             FROM vocabulary_total_record tr 
             LEFT JOIN wrong_book wb ON tr.word = wb.word AND wb.deleted = 0
             ORDER BY tr.last_study_time DESC`
        );
        
        const data = rows.map(row => ({
            word: row.word,
            meaning: row.meaning,
            phonetic: row.phonetic,
            firstStudyTime: row.first_study_time,
            lastStudyTime: row.last_study_time,
            studyCount: row.study_count,
            correctCount: row.correct_count,
            accuracy: row.study_count > 0 ? (row.correct_count / row.study_count * 100).toFixed(1) : 0,
            mastered: !!row.mastered,
            masteredTime: row.mastered_time
        }));
        
        res.json({ success: true, data });
    } catch (error) {
        console.error('获取总体学习记录失败:', error);
        res.json({ success: false, error: error.message });
    }
});

// 获取历史学习日期列表
router.get('/history-dates', async (req, res) => {
    try {
        const [rows] = await queryWithRetry(
            `SELECT DISTINCT study_date, 
                    COUNT(DISTINCT word) as word_count,
                    SUM(CASE WHEN correct = 1 THEN 1 ELSE 0 END) as correct_count,
                    COUNT(*) as total_count
             FROM vocabulary_daily_record 
             GROUP BY study_date 
             ORDER BY study_date DESC`
        );
        
        const data = rows.map(row => ({
            date: row.study_date,
            wordCount: row.word_count,
            correctCount: row.correct_count,
            totalCount: row.total_count,
            accuracy: row.total_count > 0 ? (row.correct_count / row.total_count * 100).toFixed(1) : 0
        }));
        
        res.json({ success: true, data });
    } catch (error) {
        console.error('获取历史学习日期失败:', error);
        res.json({ success: false, error: error.message });
    }
});

// 获取学习统计
router.get('/stats', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // 获取词库总数（从错题本中）
        const [totalWords] = await queryWithRetry(
            'SELECT COUNT(*) as count FROM wrong_book WHERE deleted = 0'
        );
        
        // 获取已掌握单词数
        const [masteredWords] = await queryWithRetry(
            'SELECT COUNT(*) as count FROM wrong_book WHERE mastered = 1 AND deleted = 0'
        );
        
        // 获取今日学习单词数
        const [todayStudied] = await queryWithRetry(
            'SELECT COUNT(DISTINCT word) as count FROM vocabulary_daily_record WHERE study_date = ?',
            [today]
        );
        
        // 获取今日正确率
        const [todayAccuracy] = await queryWithRetry(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN correct = 1 THEN 1 ELSE 0 END) as correct
             FROM vocabulary_daily_record 
             WHERE study_date = ?`,
            [today]
        );
        
        // 获取总学习次数
        const [totalStudies] = await queryWithRetry(
            'SELECT SUM(study_count) as count FROM vocabulary_total_record'
        );
        
        const stats = {
            totalWords: totalWords[0].count,
            masteredWords: masteredWords[0].count,
            unmasteredWords: totalWords[0].count - masteredWords[0].count,
            todayStudied: todayStudied[0].count,
            todayTarget: 5,
            todayAccuracy: todayAccuracy[0].total > 0 
                ? Math.round(todayAccuracy[0].correct / todayAccuracy[0].total * 100) 
                : 0,
            totalStudies: totalStudies[0].count || 0
        };
        
        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('获取学习统计失败:', error);
        res.json({ success: false, error: error.message });
    }
});

// 获取最近30天的学习记录（用于图表）
router.get('/weekly-chart', async (req, res) => {
    try {
        const dates = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            dates.push(date.toISOString().split('T')[0]);
        }
        
        const chartData = [];
        
        for (const date of dates) {
            const [count] = await queryWithRetry(
                'SELECT COUNT(DISTINCT word) as count FROM vocabulary_daily_record WHERE study_date = ?',
                [date]
            );
            
            const [accuracy] = await queryWithRetry(
                `SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN correct = 1 THEN 1 ELSE 0 END) as correct
                 FROM vocabulary_daily_record 
                 WHERE study_date = ?`,
                [date]
            );
            
            chartData.push({
                date,
                count: count[0].count,
                accuracy: accuracy[0].total > 0 
                    ? (accuracy[0].correct / accuracy[0].total * 100).toFixed(1) 
                    : 0
            });
        }
        
        res.json({ success: true, data: chartData });
    } catch (error) {
        console.error('获取月记录失败:', error);
        res.json({ success: false, error: error.message });
    }
});

// 获取用户等级和成就信息
router.get('/user-stats', async (req, res) => {
    try {
        const userId = req.query.userId || 'default';
        
        // 获取用户统计信息
        const [userStats] = await queryWithRetry(
            'SELECT * FROM vocabulary_user_stats WHERE user_id = ?',
            [userId]
        );
        
        // 获取总学习单词数（从错题本）
        const [totalWords] = await queryWithRetry(
            'SELECT COUNT(*) as count FROM wrong_book WHERE deleted = 0'
        );
        
        // 获取已掌握单词数
        const [masteredWords] = await queryWithRetry(
            'SELECT COUNT(*) as count FROM wrong_book WHERE mastered = 1 AND deleted = 0'
        );
        
        // 获取今日学习统计
        const today = new Date().toISOString().split('T')[0];
        const [todayStats] = await queryWithRetry(
            `SELECT 
                COUNT(DISTINCT word) as studied,
                SUM(CASE WHEN correct = 1 THEN 1 ELSE 0 END) as correct,
                COUNT(*) as total
             FROM vocabulary_daily_record 
             WHERE study_date = ?`,
            [today]
        );
        
        // 获取总学习次数
        const [totalStudies] = await queryWithRetry(
            'SELECT SUM(study_count) as count FROM vocabulary_total_record'
        );
        
        // 获取用户成就
        const [achievements] = await queryWithRetry(
            'SELECT * FROM vocabulary_achievements WHERE user_id = ?',
            [userId]
        );
        
        const stats = {
            totalWordsLearned: totalWords[0].count,
            totalWordsMastered: masteredWords[0].count,
            totalStudies: totalStudies[0].count || 0,
            todayStudied: todayStats[0].studied || 0,
            todayAccuracy: todayStats[0].total > 0 
                ? Math.round(todayStats[0].correct / todayStats[0].total * 100) 
                : 0,
            consecutiveDays: userStats.length > 0 ? userStats[0].consecutive_days : 0,
            maxConsecutiveDays: userStats.length > 0 ? userStats[0].max_consecutive_days : 0,
            lastStudyDate: userStats.length > 0 ? userStats[0].last_study_date : null
        };
        
        // 计算等级
        const levelInfo = calculateLevel(stats.totalWordsLearned);
        
        // 检查新成就
        const unlockedAchievementIds = achievements.map(a => a.achievement_id);
        const newAchievements = checkAchievements(stats, unlockedAchievementIds);
        
        // 如果有新成就，保存到数据库
        if (newAchievements.length > 0) {
            for (const achievement of newAchievements) {
                await queryWithRetry(
                    `INSERT INTO vocabulary_achievements 
                        (user_id, achievement_id, achievement_name, achievement_desc, unlocked_time, progress, target, unlocked)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
                    ON DUPLICATE KEY UPDATE 
                        unlocked_time = VALUES(unlocked_time),
                        progress = VALUES(progress),
                        unlocked = 1`,
                    [userId, achievement.id, achievement.name, achievement.desc, achievement.unlockedTime, achievement.target, achievement.target]
                );
            }
        }
        
        // 更新用户统计信息
        if (userStats.length > 0) {
            const consecutiveInfo = calculateConsecutiveDays(stats.lastStudyDate, stats.consecutiveDays);
            await queryWithRetry(
                `UPDATE vocabulary_user_stats SET 
                    level = ?,
                    total_words_learned = ?,
                    total_words_mastered = ?,
                    total_study_days = ?,
                    consecutive_days = ?,
                    max_consecutive_days = ?,
                    last_study_date = ?,
                    updated_at = NOW()
                WHERE user_id = ?`,
                [
                    levelInfo.level,
                    stats.totalWordsLearned,
                    stats.totalWordsMastered,
                    userStats[0].total_study_days + (consecutiveInfo.isNewStreak ? 1 : 0),
                    consecutiveInfo.consecutiveDays,
                    Math.max(stats.maxConsecutiveDays, consecutiveInfo.consecutiveDays),
                    today,
                    userId
                ]
            );
        } else {
            // 创建用户记录
            await queryWithRetry(
                `INSERT INTO vocabulary_user_stats 
                    (user_id, level, total_words_learned, total_words_mastered, total_study_days, consecutive_days, max_consecutive_days, last_study_date)
                VALUES (?, ?, ?, ?, 1, 1, 1, ?)`,
                [userId, levelInfo.level, stats.totalWordsLearned, stats.totalWordsMastered, today]
            );
        }
        
        // 映射数据库字段为前端期望的格式
        const getAchievementIcon = (achievementId) => {
            const achievement = LEVEL_CONFIG.achievements.find(a => a.id === achievementId);
            return achievement ? achievement.icon : '🏆';
        };
        
        const mappedAchievements = achievements.map(a => ({
            id: a.achievement_id,
            name: a.achievement_name,
            desc: a.achievement_desc,
            icon: getAchievementIcon(a.achievement_id),
            unlocked: !!a.unlocked,
            progress: a.progress || 0,
            target: a.target || 1,
            unlockedTime: a.unlocked_time
        }));
        
        res.json({
            success: true,
            data: {
                levelInfo,
                stats,
                achievements: mappedAchievements.concat(newAchievements),
                newAchievements,
                levelConfig: LEVEL_CONFIG.thresholds
            }
        });
    } catch (error) {
        console.error('获取用户统计信息失败:', error);
        res.json({ success: false, error: error.message });
    }
});

// 获取等级配置信息
router.get('/level-config', async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                levels: LEVEL_CONFIG.thresholds,
                achievements: LEVEL_CONFIG.achievements
            }
        });
    } catch (error) {
        console.error('获取等级配置失败:', error);
        res.json({ success: false, error: error.message });
    }
});

// 更新学习统计（学习单词时调用）
router.post('/update-stats', async (req, res) => {
    try {
        const { word, correct, responseTime } = req.body;
        const userId = req.body.userId || 'default';
        
        if (!word) {
            return res.json({ success: false, error: '单词不能为空' });
        }
        
        const today = new Date().toISOString().split('T')[0];
        
        // 更新连续学习天数
        const [userStats] = await queryWithRetry(
            'SELECT * FROM vocabulary_user_stats WHERE user_id = ?',
            [userId]
        );
        
        if (userStats.length > 0) {
            const consecutiveInfo = calculateConsecutiveDays(userStats[0].last_study_date, userStats[0].consecutive_days);
            
            await queryWithRetry(
                `UPDATE vocabulary_user_stats SET 
                    consecutive_days = ?,
                    max_consecutive_days = GREATEST(max_consecutive_days, ?),
                    last_study_date = ?,
                    total_study_days = total_study_days + ?,
                    updated_at = NOW()
                WHERE user_id = ?`,
                [
                    consecutiveInfo.consecutiveDays,
                    consecutiveInfo.consecutiveDays,
                    today,
                    consecutiveInfo.isNewStreak ? 1 : 0,
                    userId
                ]
            );
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('更新学习统计失败:', error);
        res.json({ success: false, error: error.message });
    }
});

module.exports = router;
