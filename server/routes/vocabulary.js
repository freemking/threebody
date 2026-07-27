const express = require('express');
const router = express.Router();
const { queryWithRetry } = require('../db');
const { calculateLevel, checkAchievements, calculateConsecutiveDays, LEVEL_CONFIG } = require('../vocabulary-levels');
const { authenticateToken } = require('./auth');

/**
 * 获取本地日期字符串（YYYY-MM-DD格式）
 * 使用服务器本地时区，避免UTC时区问题
 */
function getLocalDate(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 获取记单词词库列表（直接使用错题本数据）
router.get('/list', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await queryWithRetry(
            'SELECT * FROM wrong_book WHERE user_id = ? AND deleted = 0 ORDER BY last_wrong_time DESC',
            [userId]
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
router.post('/add', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { word, meaning, phonetic, example, rootAffix, grade, source } = req.body;

        if (!word) {
            return res.json({ success: false, error: '单词不能为空' });
        }

        const now = new Date();

        // 检查是否已存在（包括已软删除的）
        const [existing] = await queryWithRetry(
            'SELECT * FROM wrong_book WHERE user_id = ? AND word = ?', [userId, word]
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
                WHERE user_id = ? AND word = ?`,
                [meaning || '', meaning || '', phonetic || '', phonetic || '', example || '', example || '', rootAffix || '', rootAffix || '', grade || '', grade || '', userId, word]
            );
        } else {
            // 新增
            await queryWithRetry(
                `INSERT INTO wrong_book 
                    (user_id, word, meaning, phonetic, example, root_affix, grade, from_source, from_list, wrong_count, first_wrong_time, last_wrong_time, mastered, error_type)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, 0, 'all')`,
                [userId, word, meaning || '', phonetic || '', example || '', rootAffix || '', grade || '', source || 'manual', JSON.stringify([source || 'manual']), now, now]
            );
        }

        // 同时添加到总体记录表
        const [totalExisting] = await queryWithRetry(
            'SELECT * FROM vocabulary_total_record WHERE user_id = ? AND word = ?', [userId, word]
        );

        if (totalExisting.length === 0) {
            await queryWithRetry(
                `INSERT INTO vocabulary_total_record 
                    (user_id, word, first_study_time, last_study_time, study_count, correct_count, mastered)
                VALUES (?, ?, ?, ?, 0, 0, 0)`,
                [userId, word, now, now]
            );
        }

        res.json({ success: true });
    } catch (error) {
        console.error('添加单词到词库失败:', error);
        res.json({ success: false, error: error.message });
    }
});

// 批量添加单词到记单词词库（直接操作错题本）
router.post('/add-batch', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
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
                'SELECT * FROM wrong_book WHERE user_id = ? AND word = ?', [userId, item.word]
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
                    WHERE user_id = ? AND word = ?`,
                    [item.meaning || '', item.meaning || '', item.phonetic || '', item.phonetic || '', item.example || '', item.example || '', item.rootAffix || '', item.rootAffix || '', item.grade || '', item.grade || '', userId, item.word]
                );
                updated++;
            } else {
                // 新增
                await queryWithRetry(
                    `INSERT INTO wrong_book 
                        (user_id, word, meaning, phonetic, example, root_affix, grade, from_source, from_list, wrong_count, first_wrong_time, last_wrong_time, mastered, error_type)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, 0, 'all')`,
                    [userId, item.word, item.meaning || '', item.phonetic || '', item.example || '', item.rootAffix || '', item.grade || '', item.source || 'manual', JSON.stringify([item.source || 'manual']), now, now]
                );
                added++;
            }

            // 同时添加到总体记录表
            const [totalExisting] = await queryWithRetry(
                'SELECT * FROM vocabulary_total_record WHERE user_id = ? AND word = ?', [userId, item.word]
            );

            if (totalExisting.length === 0) {
                await queryWithRetry(
                    `INSERT INTO vocabulary_total_record 
                        (user_id, word, first_study_time, last_study_time, study_count, correct_count, mastered)
                    VALUES (?, ?, ?, ?, 0, 0, 0)`,
                    [userId, item.word, now, now]
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
router.post('/remove', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { word } = req.body;

        if (!word) {
            return res.json({ success: false, error: '单词不能为空' });
        }

        await queryWithRetry('UPDATE wrong_book SET deleted = 1 WHERE user_id = ? AND word = ?', [userId, word]);
        res.json({ success: true });
    } catch (error) {
        console.error('删除单词失败:', error);
        res.json({ success: false, error: error.message });
    }
});

// 标记/取消掌握
router.post('/mastered', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { word, mastered } = req.body;

        if (!word) {
            return res.json({ success: false, error: '单词不能为空' });
        }

        await queryWithRetry(
            'UPDATE wrong_book SET mastered = ? WHERE user_id = ? AND word = ?',
            [mastered ? 1 : 0, userId, word]
        );

        // 同时更新总体记录
        if (mastered) {
            await queryWithRetry(
                'UPDATE vocabulary_total_record SET mastered = 1, mastered_time = NOW() WHERE user_id = ? AND word = ?',
                [userId, word]
            );
        } else {
            await queryWithRetry(
                'UPDATE vocabulary_total_record SET mastered = 0, mastered_time = NULL WHERE user_id = ? AND word = ?',
                [userId, word]
            );
        }

        res.json({ success: true });
    } catch (error) {
        console.error('更新掌握状态失败:', error);
        res.json({ success: false, error: error.message });
    }
});

// 清除已掌握的单词（软删除）
router.post('/clear-mastered', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        await queryWithRetry('UPDATE wrong_book SET deleted = 1 WHERE user_id = ? AND mastered = 1 AND deleted = 0', [userId]);
        res.json({ success: true });
    } catch (error) {
        console.error('清除已掌握单词失败:', error);
        res.json({ success: false, error: error.message });
    }
});

// 清空词库（软删除）
router.post('/clear-all', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        await queryWithRetry('UPDATE wrong_book SET deleted = 1 WHERE user_id = ? AND deleted = 0', [userId]);
        res.json({ success: true });
    } catch (error) {
        console.error('清空词库失败:', error);
        res.json({ success: false, error: error.message });
    }
});

// 获取今日记单词（每天5个，从vocabulary_daily_record读取，不存在则初始化）
// 如果存在历史单词，先根据记忆曲线复习之前的单词
router.get('/today', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const today = getLocalDate();
        
        // 从 vocabulary_daily_record 查询今天已学习的单词（包含remembered字段）
        const [todayRecords] = await queryWithRetry(
            `SELECT d.word, d.correct, d.response_time, d.remembered, 
                    w.meaning, w.phonetic, w.example, w.root_affix, w.grade
             FROM vocabulary_daily_record d
             JOIN wrong_book w ON d.word = w.word AND d.user_id = w.user_id
             WHERE d.user_id = ? AND d.study_date = ? AND w.deleted = 0
             ORDER BY d.study_time DESC`,
            [userId, today]
        );
        
        // 如果今天已有5个记录，直接返回
        if (todayRecords.length >= 5) {
            const data = todayRecords.map(row => ({
                word: row.word,
                meaning: row.meaning,
                phonetic: row.phonetic,
                example: row.example,
                rootAffix: row.root_affix,
                grade: row.grade,
                remembered: row.remembered || 0
            }));
            
            return res.json({ 
                success: true, 
                data, 
                studied: todayRecords.length,
                total: 5,
                completed: true,
                hasReview: false
            });
        }
        
        // 计算剩余名额
        const remainingSlots = 5 - todayRecords.length;
        
        // 优先选择全新单词，然后再补充复习单词
        const studiedWords = todayRecords.map(r => r.word);
        
        // 获取所有历史学过的单词（排除今天），确保新单词是真正全新的
        const [allHistoryRecords] = await queryWithRetry(
            `SELECT DISTINCT word FROM vocabulary_daily_record WHERE user_id = ? AND study_date != ?`,
            [userId, today]
        );
        const allHistoryWords = allHistoryRecords.map(r => r.word);
        
        // 合并需要排除的单词（今天已学习的 + 所有历史学过的）
        const excludeWords = [...new Set([...studiedWords, ...allHistoryWords])];
        
        // 第一步：优先选择全新单词（最多5个，或者剩余名额）
        let newWords = [];
        if (remainingSlots > 0) {
            const placeholders = excludeWords.length > 0 
                ? `AND word NOT IN (${excludeWords.map(() => '?').join(',')})` 
                : '';
            const params = excludeWords.length > 0 
                ? [userId, ...excludeWords, remainingSlots] 
                : [userId, remainingSlots];
            
            const [rows] = await queryWithRetry(
                `SELECT * FROM wrong_book 
                 WHERE user_id = ? AND mastered = 0 AND deleted = 0 ${placeholders}
                 ORDER BY RAND() LIMIT ?`,
                params
            );
            newWords = rows;
            
            // 将新选择的单词初始化到vocabulary_daily_record表
            for (const word of newWords) {
                await queryWithRetry(
                    `INSERT INTO vocabulary_daily_record (user_id, word, study_date, correct, response_time, remembered) 
                     VALUES (?, ?, ?, 0, 0, 0)`,
                    [userId, word.word, today]
                );
            }
        }
        
        // 第二步：如果新单词不足5个，用复习单词补充剩余名额
        // 复习单词选择策略：排除最近2天内学过的单词，按记忆曲线间隔选择需要复习的单词
        const newWordList = newWords.map(w => w.word);
        const reviewSlots = remainingSlots - newWords.length;
        let reviewWords = [];
        
        if (reviewSlots > 0) {
            // 获取最近2天的日期，排除这些日期的单词（避免连续重复）
            const twoDaysAgo = new Date();
            twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
            const twoDaysAgoStr = getLocalDate(twoDaysAgo);
            
            // 选择需要复习的单词：排除今天和最近2天学过的，按记忆曲线间隔（优先复习间隔最久的）
            const excludeForReview = [...new Set([...studiedWords, ...newWordList])];
            const excludeReviewPlaceholders = excludeForReview.length > 0 
                ? `AND d.word NOT IN (${excludeForReview.map(() => '?').join(',')})` 
                : '';
            
            const [reviewRecords] = await queryWithRetry(
                `SELECT d.word, MAX(d.study_date) as last_study_date,
                        w.meaning, w.phonetic, w.example, w.root_affix, w.grade,
                        DATEDIFF(?, MAX(d.study_date)) as days_since_study
                 FROM vocabulary_daily_record d
                 JOIN wrong_book w ON d.word = w.word AND d.user_id = w.user_id
                 WHERE d.user_id = ? AND d.study_date < ? AND d.study_date <= ? AND w.deleted = 0 ${excludeReviewPlaceholders}
                 GROUP BY d.word
                 HAVING days_since_study >= 2
                 ORDER BY days_since_study DESC
                 LIMIT ?`,
                [today, userId, today, twoDaysAgoStr, ...excludeForReview, reviewSlots]
            );
            
            reviewWords = reviewRecords.map(row => ({
                word: row.word,
                meaning: row.meaning,
                phonetic: row.phonetic,
                example: row.example,
                rootAffix: row.root_affix,
                grade: row.grade,
                remembered: 0,
                isReview: true
            }));
            
            // 将复习单词也保存到今天的记录中，防止重复加载
            for (const word of reviewWords) {
                const [existingToday] = await queryWithRetry(
                    'SELECT * FROM vocabulary_daily_record WHERE user_id = ? AND word = ? AND study_date = ?',
                    [userId, word.word, today]
                );
                if (existingToday.length === 0) {
                    await queryWithRetry(
                        `INSERT INTO vocabulary_daily_record (user_id, word, study_date, correct, response_time, remembered) 
                         VALUES (?, ?, ?, 0, 0, 0)`,
                        [userId, word.word, today]
                    );
                }
            }
        }
        
        // 合并已有记录、复习单词和新插入的记录，返回完整数据
        const allWords = [
            ...reviewWords,
            ...todayRecords.map(row => ({
                word: row.word,
                meaning: row.meaning,
                phonetic: row.phonetic,
                example: row.example,
                rootAffix: row.root_affix,
                grade: row.grade,
                remembered: row.remembered || 0,
                isReview: false
            })),
            ...newWords.map(row => ({
                word: row.word,
                meaning: row.meaning,
                phonetic: row.phonetic,
                example: row.example,
                rootAffix: row.root_affix,
                grade: row.grade,
                remembered: 0,
                isReview: false
            }))
        ];
        
        res.json({ 
            success: true, 
            data: allWords, 
            studied: todayRecords.length,
            total: 5,
            completed: false,
            hasReview: reviewWords.length > 0,
            reviewCount: reviewWords.length
        });
    } catch (error) {
        console.error('获取今日记单词失败:', error);
        res.json({ success: false, error: error.message });
    }
});

// 记录学习单词
router.post('/study', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { word, correct, responseTime } = req.body;

        if (!word) {
            return res.json({ success: false, error: '单词不能为空' });
        }

        const today = getLocalDate();
        const now = new Date();

        // 检查今天是否已经学习过这个单词
        const [existing] = await queryWithRetry(
            'SELECT * FROM vocabulary_daily_record WHERE user_id = ? AND word = ? AND study_date = ?',
            [userId, word, today]
        );

        if (existing.length > 0) {
            // 更新学习记录
            await queryWithRetry(
                `UPDATE vocabulary_daily_record SET 
                    study_time = ?,
                    correct = ?,
                    response_time = ?
                WHERE user_id = ? AND word = ? AND study_date = ?`,
                [now, correct ? 1 : 0, responseTime || 0, userId, word, today]
            );
        } else {
            // 新增学习记录
            await queryWithRetry(
                `INSERT INTO vocabulary_daily_record 
                    (user_id, word, study_date, study_time, correct, response_time)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [userId, word, today, now, correct ? 1 : 0, responseTime || 0]
            );
        }

        // 更新错题本的学习次数
        await queryWithRetry(
            'UPDATE wrong_book SET wrong_count = wrong_count + 1, last_wrong_time = ? WHERE user_id = ? AND word = ?',
            [now, userId, word]
        );

        // 更新总体记录
        await queryWithRetry(
            `UPDATE vocabulary_total_record SET 
                study_count = study_count + 1,
                correct_count = correct_count + ?,
                last_study_time = ?
            WHERE user_id = ? AND word = ?`,
            [correct ? 1 : 0, now, userId, word]
        );

        // 检查是否已掌握（连续答对3次）
        if (correct) {
            const [totalRecord] = await queryWithRetry(
                'SELECT * FROM vocabulary_total_record WHERE user_id = ? AND word = ?',
                [userId, word]
            );

            if (totalRecord.length > 0) {
                const record = totalRecord[0];
                const accuracy = record.study_count > 0 ? (record.correct_count / record.study_count) : 0;
                
                // 如果连续答对3次且正确率超过80%，标记为已掌握
                if (record.correct_count >= 3 && accuracy >= 0.8) {
                    await queryWithRetry(
                        'UPDATE wrong_book SET mastered = 1 WHERE user_id = ? AND word = ?',
                        [userId, word]
                    );
                    await queryWithRetry(
                        'UPDATE vocabulary_total_record SET mastered = 1, mastered_time = NOW() WHERE user_id = ? AND word = ?',
                        [userId, word]
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

// 更新单词记忆状态
router.post('/remembered', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { word, remembered } = req.body;

        if (!word) {
            return res.json({ success: false, error: '单词不能为空' });
        }

        const today = getLocalDate();

        // 检查今天是否已有记录
        const [existing] = await queryWithRetry(
            'SELECT * FROM vocabulary_daily_record WHERE user_id = ? AND word = ? AND study_date = ?',
            [userId, word, today]
        );

        if (existing.length > 0) {
            // 更新记忆状态
            await queryWithRetry(
                'UPDATE vocabulary_daily_record SET remembered = ? WHERE user_id = ? AND word = ? AND study_date = ?',
                [remembered ? 1 : 0, userId, word, today]
            );
        } else {
            // 如果不存在记录，插入新记录
            await queryWithRetry(
                `INSERT INTO vocabulary_daily_record (user_id, word, study_date, correct, response_time, remembered) 
                 VALUES (?, ?, ?, 0, 0, ?)`,
                [userId, word, today, remembered ? 1 : 0]
            );
        }

        res.json({ success: true });
    } catch (error) {
        console.error('更新记忆状态失败:', error);
        res.json({ success: false, error: error.message });
    }
});

// 获取每日学习记录
router.get('/daily-record', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { date } = req.query;
        // 确保queryDate是字符串格式，防止传入对象导致SQL错误
        const queryDate = (typeof date === 'string' && date.trim()) ? date.trim() : getLocalDate();
        
        const [rows] = await queryWithRetry(
            `SELECT dr.*, wb.meaning, wb.phonetic, wb.example, wb.root_affix 
             FROM vocabulary_daily_record dr 
             LEFT JOIN wrong_book wb ON dr.word = wb.word AND dr.user_id = wb.user_id AND wb.deleted = 0
             WHERE dr.user_id = ? AND dr.study_date = ? 
             ORDER BY dr.study_time DESC`,
            [userId, queryDate]
        );
        
        const data = rows.map(row => ({
            word: row.word,
            meaning: row.meaning,
            phonetic: row.phonetic,
            example: row.example,
            rootAffix: row.root_affix,
            studyTime: row.study_time,
            correct: !!row.correct,
            responseTime: row.response_time,
            remembered: row.remembered || 0
        }));
        
        console.log(`daily-record API 返回数据 (${queryDate}):`, JSON.stringify(data.slice(0, 3), null, 2));
        
        res.json({ success: true, data });
    } catch (error) {
        console.error('获取每日学习记录失败:', error);
        res.json({ success: false, error: error.message });
    }
});

// 获取总体学习记录
router.get('/total-record', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await queryWithRetry(
            `SELECT tr.*, wb.meaning, wb.phonetic 
             FROM vocabulary_total_record tr 
             LEFT JOIN wrong_book wb ON tr.word = wb.word AND tr.user_id = wb.user_id AND wb.deleted = 0
             WHERE tr.user_id = ?
             ORDER BY tr.last_study_time DESC`,
            [userId]
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

// 辅助函数：将UTC日期转换为本地日期字符串 (YYYY-MM-DD)
function utcDateToLocalString(date) {
    if (typeof date === 'string') {
        return date.split('T')[0];
    }
    // 使用本地时区偏移，将UTC时间转换为本地时间
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().split('T')[0];
}

// 获取历史学习日期列表
router.get('/history-dates', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await queryWithRetry(
            `SELECT DISTINCT study_date, 
                    COUNT(DISTINCT word) as word_count,
                    SUM(CASE WHEN correct = 1 THEN 1 ELSE 0 END) as correct_count,
                    COUNT(*) as total_count
             FROM vocabulary_daily_record 
             WHERE user_id = ? AND word IS NOT NULL AND word != ''
             GROUP BY study_date 
             HAVING COUNT(DISTINCT word) > 0
             ORDER BY study_date DESC`,
            [userId]
        );
        
        const data = rows.map(row => ({
            date: utcDateToLocalString(row.study_date),
            wordCount: row.word_count,
            correctCount: row.correct_count,
            totalCount: row.total_count,
            accuracy: row.total_count > 0 ? (row.correct_count / row.total_count * 100).toFixed(1) : 0
        }));
        
        // 额外过滤：确保返回的数据中wordCount大于0
        const filteredData = data.filter(d => d.wordCount > 0);
        
        res.json({ success: true, data: filteredData });
    } catch (error) {
        console.error('获取历史学习日期失败:', error);
        res.json({ success: false, error: error.message });
    }
});

// 获取最近7天学习的单词（用于周末测验）
router.get('/weekly-quiz-words', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const today = getLocalDate();
        
        // 计算7天前的日期
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const sevenDaysAgoStr = getLocalDate(sevenDaysAgo);
        
        // 获取最近7天学习的所有不重复单词
        const [rows] = await queryWithRetry(
            `SELECT DISTINCT d.word, 
                    w.meaning, w.phonetic, w.example, w.root_affix, w.grade,
                    MAX(d.study_date) as last_study_date,
                    COUNT(*) as study_count,
                    SUM(CASE WHEN d.correct = 1 THEN 1 ELSE 0 END) as correct_count
             FROM vocabulary_daily_record d
             JOIN wrong_book w ON d.word = w.word AND d.user_id = w.user_id
             WHERE d.user_id = ? AND d.study_date >= ? AND d.study_date <= ? AND w.deleted = 0
             GROUP BY d.word, w.meaning, w.phonetic, w.example, w.root_affix, w.grade
             ORDER BY RAND()`,
            [userId, sevenDaysAgoStr, today]
        );
        
        const words = rows.map(row => ({
            word: row.word,
            meaning: row.meaning,
            phonetic: row.phonetic,
            example: row.example,
            rootAffix: row.root_affix,
            grade: row.grade,
            lastStudyDate: utcDateToLocalString(row.last_study_date),
            studyCount: row.study_count,
            correctCount: row.correct_count,
            accuracy: row.study_count > 0 ? Math.round(row.correct_count / row.study_count * 100) : 0
        }));
        
        res.json({ 
            success: true, 
            data: words,
            totalWords: words.length,
            dateRange: {
                start: sevenDaysAgoStr,
                end: today
            }
        });
    } catch (error) {
        console.error('获取周末测验单词失败:', error);
        res.json({ success: false, error: error.message });
    }
});

// 获取学习统计
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const today = getLocalDate();
        
        // 获取用户统计信息（从 vocabulary_user_stats 表）
        const [userStats] = await queryWithRetry(
            'SELECT * FROM vocabulary_user_stats WHERE user_id = ?',
            [userId]
        );
        
        // 获取今日学习单词数
        const [todayStudied] = await queryWithRetry(
            'SELECT COUNT(DISTINCT word) as count FROM vocabulary_daily_record WHERE user_id = ? AND study_date = ?',
            [userId, today]
        );
        
        // 获取今日正确率
        const [todayAccuracy] = await queryWithRetry(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN correct = 1 THEN 1 ELSE 0 END) as correct
             FROM vocabulary_daily_record 
             WHERE user_id = ? AND study_date = ?`,
            [userId, today]
        );
        
        // 获取总学习次数
        const [totalStudies] = await queryWithRetry(
            'SELECT SUM(study_count) as count FROM vocabulary_total_record WHERE user_id = ?',
            [userId]
        );
        
        const stats = {
            totalWords: userStats.length > 0 ? userStats[0].total_words_learned : 0,
            masteredWords: userStats.length > 0 ? userStats[0].total_words_mastered : 0,
            unmasteredWords: (userStats.length > 0 ? userStats[0].total_words_learned : 0) - (userStats.length > 0 ? userStats[0].total_words_mastered : 0),
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
router.get('/weekly-chart', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const dates = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            dates.push(getLocalDate(date));
        }
        
        const chartData = [];
        
        for (const date of dates) {
            const [count] = await queryWithRetry(
                'SELECT COUNT(DISTINCT word) as count FROM vocabulary_daily_record WHERE user_id = ? AND study_date = ?',
                [userId, date]
            );
            
            const [accuracy] = await queryWithRetry(
                `SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN correct = 1 THEN 1 ELSE 0 END) as correct
                 FROM vocabulary_daily_record 
                 WHERE user_id = ? AND study_date = ?`,
                [userId, date]
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
router.get('/user-stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // 获取用户统计信息
        const [userStats] = await queryWithRetry(
            'SELECT * FROM vocabulary_user_stats WHERE user_id = ?',
            [userId]
        );
        
        // 获取总学习单词数（从每日学习记录）
        const [totalWords] = await queryWithRetry(
            'SELECT COUNT(DISTINCT word) as count FROM vocabulary_daily_record WHERE user_id = ?',
            [userId]
        );
        
        // 获取已掌握单词数（从每日学习记录）
        const [masteredWords] = await queryWithRetry(
            'SELECT COUNT(DISTINCT word) as count FROM vocabulary_daily_record WHERE user_id = ? AND remembered = 1',
            [userId]
        );
        
        // 获取今日学习统计
        const today = getLocalDate();
        const [todayStats] = await queryWithRetry(
            `SELECT 
                COUNT(DISTINCT word) as studied,
                SUM(CASE WHEN correct = 1 THEN 1 ELSE 0 END) as correct,
                COUNT(*) as total
             FROM vocabulary_daily_record 
             WHERE user_id = ? AND study_date = ?`,
            [userId, today]
        );
        
        // 获取总学习次数
        const [totalStudies] = await queryWithRetry(
            'SELECT SUM(study_count) as count FROM vocabulary_total_record WHERE user_id = ?',
            [userId]
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
router.post('/update-stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { word, correct, responseTime } = req.body;
        
        if (!word) {
            return res.json({ success: false, error: '单词不能为空' });
        }
        
        const today = getLocalDate();
        
        // 更新连续学习天数
        const [userStats] = await queryWithRetry(
            'SELECT * FROM vocabulary_user_stats WHERE user_id = ?',
            [userId]
        );
        
        // 获取总学习单词数和已掌握单词数（从每日学习记录）
        const [totalWords] = await queryWithRetry(
            'SELECT COUNT(DISTINCT word) as count FROM vocabulary_daily_record WHERE user_id = ?',
            [userId]
        );
        
        const [masteredWords] = await queryWithRetry(
            'SELECT COUNT(DISTINCT word) as count FROM vocabulary_daily_record WHERE user_id = ? AND remembered = 1',
            [userId]
        );
        
        // 计算等级
        const levelInfo = calculateLevel(totalWords[0].count);
        
        if (userStats.length > 0) {
            const consecutiveInfo = calculateConsecutiveDays(userStats[0].last_study_date, userStats[0].consecutive_days);
            
            // 合并为一个UPDATE语句，确保数据一致性
            await queryWithRetry(
                `UPDATE vocabulary_user_stats SET 
                    level = ?,
                    total_words_learned = ?,
                    total_words_mastered = ?,
                    consecutive_days = ?,
                    max_consecutive_days = GREATEST(max_consecutive_days, ?),
                    last_study_date = ?,
                    total_study_days = total_study_days + ?,
                    updated_at = NOW()
                WHERE user_id = ?`,
                [
                    levelInfo.level,
                    totalWords[0].count,
                    masteredWords[0].count,
                    consecutiveInfo.consecutiveDays,
                    consecutiveInfo.consecutiveDays,
                    today,
                    consecutiveInfo.isNewStreak ? 1 : 0,
                    userId
                ]
            );
        } else {
            // 创建用户记录
            await queryWithRetry(
                `INSERT INTO vocabulary_user_stats 
                    (user_id, level, total_words_learned, total_words_mastered, total_study_days, consecutive_days, max_consecutive_days, last_study_date)
                VALUES (?, ?, ?, ?, 1, 1, 1, ?)`,
                [userId, levelInfo.level, totalWords[0].count, masteredWords[0].count, today]
            );
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('更新学习统计失败:', error);
        res.json({ success: false, error: error.message });
    }
});

module.exports = router;
