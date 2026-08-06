const express = require('express');
const router = express.Router();
const { queryWithRetry, getPool } = require('../db');
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

// 判断某一天的单词是否"全部学习完成且正确"（每个单词 correct=1 或 remembered=1）
// 用于控制历史单词/学习数据图表：只有当天单词全部学完且全对，才在历史/图表中展示该天。
// 与 /today 接口判定"已完成"的口径保持一致（correct===1 || remembered===1）。
async function isDayFullyCompleted(userId, date) {
    const [rows] = await queryWithRetry(
        `SELECT COUNT(*) AS total,
                SUM(CASE WHEN correct = 1 OR remembered = 1 THEN 1 ELSE 0 END) AS done
         FROM vocabulary_daily_record
         WHERE user_id = ? AND study_date = ? AND word IS NOT NULL`,
        [userId, date]
    );
    const r = rows[0] || {};
    const total = Number(r.total) || 0;
    const done = Number(r.done) || 0;
    return total > 0 && done === total;
}

// 完成复习并插入今日新单词（原子操作，避免重复插入）
router.post('/complete-review', authenticateToken, async (req, res) => {
    let connection = null;
    try {
        const userId = req.user.id;
        const today = getLocalDate();
        const yesterday = getLocalDate(new Date(Date.now() - 86400000));
        
        // 获取专用连接用于事务
        const { getPool } = require('../db');
        const pool = await getPool();
        connection = await pool.getConnection();
        
        await connection.beginTransaction();
        
        try {
            // 第一步：检查昨天的单词是否已全部复习（"必须全对才推进"）。
            // 逐词标记由前端调用 /reviewed 完成（只标记 3 种模式全对的单词），
            // 此处不强制标记。只要还有未复习的词，就不推进、不插入新词，
            // 这些词会在下次 /today 时继续以 review_yesterday 阶段出现。
            // 与 /today 阶段1 保持一致：只统计 wrong_book 中未软删除的单词，
            // 避免已被删除的词（用户无法再复习）永远阻止推进
            const [yesterdayRows] = await connection.execute(
                `SELECT d.word, d.reviewed
                 FROM vocabulary_daily_record d
                 JOIN wrong_book w ON d.word = w.word AND d.user_id = w.user_id
                 WHERE d.user_id = ? AND d.study_date = ? AND w.deleted = 0`,
                [userId, yesterday]
            );
            const unreviewedCount = yesterdayRows.filter(r => r.reviewed !== 1).length;
            if (unreviewedCount > 0) {
                await connection.rollback();
                return res.json({
                    success: true,
                    advanced: false,
                    remaining: unreviewedCount,
                    reviewedCount: yesterdayRows.length - unreviewedCount,
                    newWordsCount: 0,
                    todayTotalWords: 0,
                    newWords: []
                });
            }

            // 第二步：昨天已全部复习（或昨天无单词），确保今天已有 5 个全新单词（完全不存在于 vocabulary_daily_record 的）
            // 新词的选择标准：wrong_book 中未掌握、未删除、且 vocabulary_daily_record 中【任何日期】都不存在的单词
            const [newCountRows] = await connection.execute(
                `SELECT COUNT(DISTINCT d.word) as cnt FROM vocabulary_daily_record d
                 WHERE d.user_id = ? AND d.study_date = ?
                   AND d.word NOT IN (SELECT word FROM vocabulary_daily_record WHERE user_id = ? AND study_date < ?)`,
                [userId, today, userId, today]
            );
            const newWordsToday = (newCountRows[0] && newCountRows[0].cnt) || 0;
            const newRemaining = Math.max(0, 5 - newWordsToday);

            let newWords = [];
            if (newRemaining > 0) {
                // newRemaining 为 0~5 的安全整数，直接内联 LIMIT。
                // 不能用 LIMIT ? 占位符：部分 MySQL/MariaDB 版本下 mysql2 预处理语句
                // 会报 "Incorrect arguments to mysqld_stmt_execute"
                const [rows] = await connection.execute(
                    `SELECT wb.* FROM wrong_book wb
                     WHERE wb.user_id = ? AND wb.mastered = 0 AND wb.deleted = 0
                       AND wb.word NOT IN (SELECT word FROM vocabulary_daily_record WHERE user_id = ?)
                     ORDER BY RAND() LIMIT ${Number(newRemaining)}`,
                    [userId, userId]
                );
                newWords = rows;

                for (const word of newWords) {
                    await connection.execute(
                        `INSERT IGNORE INTO vocabulary_daily_record (user_id, word, study_date, correct, remembered) 
                         VALUES (?, ?, ?, 0, 0)`,
                        [userId, word.word, today]
                    );
                }
            }
            
            await connection.commit();
            
            res.json({ 
                success: true, 
                advanced: true,
                reviewedCount: yesterdayRows.length,
                newWordsCount: newWords.length,
                todayTotalWords: newWordsToday + newWords.length,
                newWords: newWords.map(w => w.word)
            });
            
        } catch (error) {
            if (connection) await connection.rollback();
            throw error;
        }
        
    } catch (error) {
        console.error('完成复习并插入新单词失败:', error);
        res.json({ success: false, error: error.message });
    } finally {
        if (connection) connection.release();
    }
});

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

// 更新学习进度（供React前端调用）
router.post('/progress', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { wordId, isCorrect } = req.body;

        if (!wordId) {
            return res.json({ success: false, message: 'wordId不能为空' });
        }

        // 获取单词信息
        const [words] = await queryWithRetry(
            'SELECT * FROM wrong_book WHERE id = ? AND user_id = ? AND deleted = 0',
            [wordId, userId]
        );

        if (words.length === 0) {
            return res.json({ success: false, message: '单词不存在' });
        }

        const word = words[0];

        if (isCorrect) {
            // 答对了，标记为已掌握
            await queryWithRetry(
                'UPDATE wrong_book SET mastered = 1, last_wrong_time = NOW() WHERE id = ?',
                [wordId]
            );
        } else {
            // 答错了，增加学习次数
            await queryWithRetry(
                'UPDATE wrong_book SET wrong_count = wrong_count + 1, mastered = 0, last_wrong_time = NOW() WHERE id = ?',
                [wordId]
            );
        }

        res.json({ success: true });
    } catch (error) {
        console.error('更新学习进度失败:', error);
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

// 获取今日记单词
// 流程：先判断昨天单词是否全部复习完(reviewed=1)
//   - 没复习完：只返回昨天未复习的单词，不插入任何新单词
//   - 已复习完：只处理今天的5个全新单词（wrong_book中不存在于vocabulary_daily_record的），不再插入历史复习单词
router.get('/today', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const today = getLocalDate();

        // ===== 阶段1：检查昨天单词是否全部复习完成 =====
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = getLocalDate(yesterday);

        const [yesterdayRecords] = await queryWithRetry(
            `SELECT d.word, d.remembered, d.reviewed,
                    w.meaning, w.phonetic, w.example, w.root_affix, w.grade
             FROM vocabulary_daily_record d
             JOIN wrong_book w ON d.word = w.word AND d.user_id = w.user_id
             WHERE d.user_id = ? AND d.study_date = ? AND w.deleted = 0`,
            [userId, yesterdayStr]
        );

        const yesterdayUnreviewed = yesterdayRecords.filter(r => r.reviewed !== 1);

        if (yesterdayUnreviewed.length > 0) {
            // 昨天还有未复习的单词，只返回这些单词，不插入任何新单词
            const data = yesterdayUnreviewed.map(row => ({
                word: row.word,
                meaning: row.meaning,
                phonetic: row.phonetic,
                example: row.example,
                rootAffix: row.root_affix,
                grade: row.grade,
                remembered: row.remembered || 0,
                isYesterday: true
            }));

            return res.json({
                success: true,
                data,
                studied: 0,
                total: data.length,
                completed: false,
                hasReview: true,
                reviewCount: data.length,
                phase: 'review_yesterday'
            });
        }

        // ===== 阶段2：昨天已全部复习完成，返回今天的记录（只读，不自动插入新单词） =====
        // 查询今天的记录（LEFT JOIN，避免 wrong_book 被软删除的单词被过滤掉导致数量不足）
        const [todayRecords] = await queryWithRetry(
            `SELECT d.word, d.correct, d.remembered, d.reviewed,
                    w.meaning, w.phonetic, w.example, w.root_affix, w.grade,
                    w.deleted as wb_deleted
             FROM vocabulary_daily_record d
             LEFT JOIN wrong_book w ON d.word = w.word AND d.user_id = w.user_id
             WHERE d.user_id = ? AND d.study_date = ?
             ORDER BY d.study_time DESC`,
            [userId, today]
        );

        // 过滤掉 wrong_book 已被软删除的单词，并从 daily_record 中清理这些无效记录
        const validTodayRecords = [];
        for (const row of todayRecords) {
            if (row.wb_deleted) {
                // wrong_book 已软删除，删除今天的无效记录，避免占用名额
                await queryWithRetry(
                    'DELETE FROM vocabulary_daily_record WHERE user_id = ? AND word = ? AND study_date = ?',
                    [userId, row.word, today]
                );
            } else {
                validTodayRecords.push(row);
            }
        }

        // 组装返回数据：仅返回今天尚未记住的单词（不自动插入新单词，避免污染数据库）
        const unlearnedWords = validTodayRecords.filter(r => !r.remembered);
        const learnedWords = validTodayRecords.filter(r => r.remembered);

        const allWords = unlearnedWords.map(row => ({
            word: row.word,
            meaning: row.meaning,
            phonetic: row.phonetic,
            example: row.example,
            rootAffix: row.root_affix,
            grade: row.grade,
            remembered: row.remembered || 0,
            isReview: false
        }));

        const total = allWords.length;
        // 今天有记录且全部记住才算完成；今天没有记录时视为尚未开始
        const completed = validTodayRecords.length > 0 && unlearnedWords.length === 0;

        res.json({
            success: true,
            data: allWords,
            studied: learnedWords.length,
            total,
            completed,
            hasReview: false,
            reviewCount: 0,
            phase: 'today_new'
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
        const { word, correct, meaning, phonetic, grade, unit } = req.body;

        if (!word) {
            return res.json({ success: false, error: '单词不能为空' });
        }

        const today = getLocalDate();
        const now = new Date();

        // 插入周测验记录（如果提供了单词详细信息）
        if (meaning !== undefined) {
            await queryWithRetry(
                `INSERT INTO word_quiz_records (user_id, word, meaning, phonetic, grade, unit, quiz_date, correct)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [userId, word, meaning || '', phonetic || '', grade || '', unit || '', today, correct ? 1 : 0]
            );
        }

        // 检查今天是否已经学习过这个单词
        const [existing] = await queryWithRetry(
            'SELECT * FROM vocabulary_daily_record WHERE user_id = ? AND word = ? AND study_date = ?',
            [userId, word, today]
        );

        if (existing.length > 0) {
            // 更新学习记录（reviewed 由 /reviewed 接口单独控制，不在 /study 中设置）
            await queryWithRetry(
                `UPDATE vocabulary_daily_record SET 
                    study_time = ?,
                    correct = ?
                WHERE user_id = ? AND word = ? AND study_date = ?`,
                [now, correct ? 1 : 0, userId, word, today]
            );
        } else {
            // 新增学习记录（reviewed 保持默认0）
            await queryWithRetry(
                `INSERT INTO vocabulary_daily_record 
                    (user_id, word, study_date, study_time, correct)
                VALUES (?, ?, ?, ?, ?)`,
                [userId, word, today, now, correct ? 1 : 0]
            );
        }

        // 更新错题本的学习次数
        await queryWithRetry(
            'UPDATE wrong_book SET wrong_count = wrong_count + 1, last_wrong_time = ? WHERE user_id = ? AND word = ?',
            [now, userId, word]
        );

        // 检查是否已掌握（基于每日学习记录：累计答对3次且正确率超过80%）
        if (correct) {
            const [studyStats] = await queryWithRetry(
                `SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN correct = 1 THEN 1 ELSE 0 END) as correct
                 FROM vocabulary_daily_record 
                 WHERE user_id = ? AND word = ?`,
                [userId, word]
            );

            if (studyStats.length > 0) {
                const record = studyStats[0];
                const total = Number(record.total) || 0;
                const correctCount = Number(record.correct) || 0;
                const accuracy = total > 0 ? (correctCount / total) : 0;

                if (correctCount >= 3 && accuracy >= 0.8) {
                    await queryWithRetry(
                        'UPDATE wrong_book SET mastered = 1 WHERE user_id = ? AND word = ?',
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
        const { word, remembered, date } = req.body;

        if (!word) {
            return res.json({ success: false, error: '单词不能为空' });
        }

        // 支持指定日期，默认为今天
        const targetDate = date || getLocalDate();

        // 检查是否已有记录
        const [existing] = await queryWithRetry(
            'SELECT * FROM vocabulary_daily_record WHERE user_id = ? AND word = ? AND study_date = ?',
            [userId, word, targetDate]
        );

        if (existing.length > 0) {
            // 更新记忆状态及正确率（reviewed 由 /reviewed 接口单独控制，不在 /remembered 中设置）
            await queryWithRetry(
                'UPDATE vocabulary_daily_record SET remembered = ?, correct = ? WHERE user_id = ? AND word = ? AND study_date = ?',
                [remembered ? 1 : 0, remembered ? 1 : 0, userId, word, targetDate]
            );
        } else {
            // 如果不存在记录，插入新记录（reviewed 保持默认0，correct 与 remembered 同步）
            await queryWithRetry(
                `INSERT INTO vocabulary_daily_record (user_id, word, study_date, correct, remembered) 
                 VALUES (?, ?, ?, ?, ?)`,
                [userId, word, targetDate, remembered ? 1 : 0, remembered ? 1 : 0]
            );
        }

        res.json({ success: true });
    } catch (error) {
        console.error('更新记忆状态失败:', error);
        res.json({ success: false, error: error.message });
    }
});

// 更新单词复习状态（仅标记为已复习，不改变remembered状态）
router.post('/reviewed', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { word, date } = req.body;

        if (!word) {
            return res.json({ success: false, error: '单词不能为空' });
        }

        // 支持指定日期，默认为今天
        const targetDate = date || getLocalDate();

        // 检查是否已有记录
        const [existing] = await queryWithRetry(
            'SELECT * FROM vocabulary_daily_record WHERE user_id = ? AND word = ? AND study_date = ?',
            [userId, word, targetDate]
        );

        if (existing.length > 0) {
            // 更新复习状态
            await queryWithRetry(
                'UPDATE vocabulary_daily_record SET reviewed = 1 WHERE user_id = ? AND word = ? AND study_date = ?',
                [userId, word, targetDate]
            );
        } else {
            // 如果不存在记录，插入新记录
            await queryWithRetry(
                `INSERT INTO vocabulary_daily_record (user_id, word, study_date, correct, remembered, reviewed) 
                 VALUES (?, ?, ?, 0, 0, 1)`,
                [userId, word, targetDate]
            );
        }

        res.json({ success: true });
    } catch (error) {
        console.error('更新复习状态失败:', error);
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
            remembered: row.remembered || 0,
            reviewed: row.reviewed || 0
        }));
        

        
        res.json({ success: true, data });
    } catch (error) {
        console.error('获取每日学习记录失败:', error);
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
        let filteredData = data.filter(d => d.wordCount > 0);

        // 今天必须"全部学习完成且正确"才在历史单词中显示；过往日期正常显示
        const today = getLocalDate();
        const todayComplete = await isDayFullyCompleted(userId, today);
        if (!todayComplete) {
            filteredData = filteredData.filter(d => d.date !== today);
        }

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
        
        // 获取今日学习单词数（统计真正学习过的：remembered=1 或通过 studyWord 记录过的）
        const [todayStudied] = await queryWithRetry(
            'SELECT COUNT(DISTINCT word) as count FROM vocabulary_daily_record WHERE user_id = ? AND study_date = ? AND (remembered = 1 OR study_time IS NOT NULL)',
            [userId, today]
        );
        
        // 获取今日正确率（统计真正学习过的，排除仅reviewed的记录）
        const [todayAccuracy] = await queryWithRetry(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN correct = 1 THEN 1 ELSE 0 END) as correct
             FROM vocabulary_daily_record 
             WHERE user_id = ? AND study_date = ? AND (remembered = 1 OR study_time IS NOT NULL)`,
            [userId, today]
        );
        
        // 获取总学习次数（基于每日学习记录中真正学习过的记录）
        const [totalStudies] = await queryWithRetry(
            'SELECT COUNT(*) as count FROM vocabulary_daily_record WHERE user_id = ? AND (remembered = 1 OR study_time IS NOT NULL)',
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

        // 今天必须"全部学习完成且正确"才在图表中显示柱状图；过往日期正常显示
        const today = getLocalDate();
        const todayComplete = await isDayFullyCompleted(userId, today);

        for (const date of dates) {
            // 今天尚未全部学完且全对时，不显示今天的柱状图
            if (date === today && !todayComplete) {
                chartData.push({ date, count: 0, accuracy: 0 });
                continue;
            }

            const [count] = await queryWithRetry(
                'SELECT COUNT(DISTINCT word) as count FROM vocabulary_daily_record WHERE user_id = ? AND study_date = ? AND (remembered = 1 OR study_time IS NOT NULL)',
                [userId, date]
            );
            
            const [accuracy] = await queryWithRetry(
                `SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN correct = 1 THEN 1 ELSE 0 END) as correct
                 FROM vocabulary_daily_record 
                 WHERE user_id = ? AND study_date = ? AND (remembered = 1 OR study_time IS NOT NULL)`,
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
        
        // 获取今日学习统计（统计真正学习过的：remembered=1 或通过 studyWord 记录过的）
        const today = getLocalDate();
        const [todayStats] = await queryWithRetry(
            `SELECT 
                COUNT(DISTINCT word) as studied,
                SUM(CASE WHEN correct = 1 THEN 1 ELSE 0 END) as correct,
                COUNT(*) as total
             FROM vocabulary_daily_record 
             WHERE user_id = ? AND study_date = ? AND (remembered = 1 OR study_time IS NOT NULL)`,
            [userId, today]
        );
        
        // 获取总学习次数（基于每日学习记录中真正学习过的记录）
        const [totalStudies] = await queryWithRetry(
            'SELECT COUNT(*) as count FROM vocabulary_daily_record WHERE user_id = ? AND (remembered = 1 OR study_time IS NOT NULL)',
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
        const { word, correct } = req.body;
        
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
