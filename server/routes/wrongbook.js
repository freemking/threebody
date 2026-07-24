const express = require('express');
const router = express.Router();
const { queryWithRetry } = require('../db');

// 获取所有错题
router.get('/list', async (req, res) => {
    try {
        const [rows] = await queryWithRetry(
            'SELECT * FROM wrong_book WHERE deleted = 0 ORDER BY last_wrong_time DESC'
        );
        // 转换字段名为驼峰
        const data = rows.map(row => {
            let fromList = [];
            try {
                fromList = JSON.parse(row.from_list || '[]');
                if (!Array.isArray(fromList)) {
                    fromList = [fromList];
                }
            } catch (e) {
                // 如果解析失败，将原始值作为数组元素
                fromList = row.from_list ? [row.from_list] : [];
            }
            
            return {
                word: row.word,
                meaning: row.meaning,
                example: row.example,
                rootAffix: row.root_affix,
                phonetic: row.phonetic,
                from: row.from_source,
                fromList: fromList,
                grade: row.grade,
                wrongCount: row.wrong_count,
                firstWrongTime: row.first_wrong_time,
                lastWrongTime: row.last_wrong_time,
                mastered: !!row.mastered,
                errorType: row.error_type || 'all'
            };
        });
        res.json({ success: true, data });
    } catch (error) {
        console.error('获取错题列表失败:', error);
        res.json({ success: false, error: error.message });
    }
});

// 添加错题
router.post('/add', async (req, res) => {
    try {
        const { word, meaning, example, rootAffix, phonetic, from, grade, errorType } = req.body;

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
            const item = existing[0];
            let fromList = JSON.parse(item.from_list || '[]');
            if (from && !fromList.includes(from)) {
                fromList.push(from);
            }

            await queryWithRetry(
                `UPDATE wrong_book SET 
                    wrong_count = wrong_count + 1,
                    last_wrong_time = ?,
                    from_list = ?,
                    meaning = IF(? != '', ?, meaning),
                    example = IF(? != '', ?, example),
                    root_affix = IF(? != '', ?, root_affix),
                    phonetic = IF(? != '', ?, phonetic),
                    error_type = IF(? != '', ?, error_type),
                    deleted = 0
                WHERE word = ?`,
                [now, JSON.stringify(fromList), meaning || '', meaning || '', example || '', example || '', rootAffix || '', rootAffix || '', phonetic || '', phonetic || '', errorType || '', errorType || '', word]
            );
        } else {
            // 新增
            await queryWithRetry(
                `INSERT INTO wrong_book 
                    (word, meaning, example, root_affix, phonetic, from_source, from_list, grade, wrong_count, first_wrong_time, last_wrong_time, mastered, error_type)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, 0, ?)`,
                [word, meaning || '', example || '', rootAffix || '', phonetic || '', from || 'unknown', JSON.stringify([from || 'unknown']), grade || '', now, now, errorType || 'all']
            );
        }

        res.json({ success: true });
    } catch (error) {
        console.error('添加错题失败:', error);
        res.json({ success: false, error: error.message });
    }
});

// 删除错题（软删除）
router.post('/remove', async (req, res) => {
    try {
        const { word } = req.body;

        if (!word) {
            return res.json({ success: false, error: '单词不能为空' });
        }

        await queryWithRetry('UPDATE wrong_book SET deleted = 1 WHERE word = ?', [word]);
        res.json({ success: true });
    } catch (error) {
        console.error('删除错题失败:', error);
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
        res.json({ success: true });
    } catch (error) {
        console.error('更新掌握状态失败:', error);
        res.json({ success: false, error: error.message });
    }
});

// 清除已掌握（软删除）
router.post('/clear-mastered', async (req, res) => {
    try {
        await queryWithRetry('UPDATE wrong_book SET deleted = 1 WHERE mastered = 1 AND deleted = 0');
        res.json({ success: true });
    } catch (error) {
        console.error('清除已掌握错题失败:', error);
        res.json({ success: false, error: error.message });
    }
});

// 清空全部（软删除）
router.post('/clear-all', async (req, res) => {
    try {
        await queryWithRetry('UPDATE wrong_book SET deleted = 1 WHERE deleted = 0');
        res.json({ success: true });
    } catch (error) {
        console.error('清空错题本失败:', error);
        res.json({ success: false, error: error.message });
    }
});

// 恢复已删除的错题
router.post('/restore', async (req, res) => {
    try {
        const { word } = req.body;

        if (!word) {
            return res.json({ success: false, error: '单词不能为空' });
        }

        const [result] = await queryWithRetry(
            'UPDATE wrong_book SET deleted = 0 WHERE word = ? AND deleted = 1',
            [word]
        );
        res.json({ success: true, restored: result.affectedRows > 0 });
    } catch (error) {
        console.error('恢复错题失败:', error);
        res.json({ success: false, error: error.message });
    }
});

// 获取已删除的错题列表
router.get('/list-deleted', async (req, res) => {
    try {
        const [rows] = await queryWithRetry(
            'SELECT * FROM wrong_book WHERE deleted = 1 ORDER BY updated_at DESC'
        );
        const data = rows.map(row => ({
            word: row.word,
            meaning: row.meaning,
            phonetic: row.phonetic,
            deletedAt: row.updated_at
        }));
        res.json({ success: true, data });
    } catch (error) {
        console.error('获取已删除错题失败:', error);
        res.json({ success: false, error: error.message });
    }
});

// 从localStorage同步到数据库
router.post('/sync', async (req, res) => {
    try {
        const { words } = req.body;

        if (!Array.isArray(words)) {
            return res.json({ success: false, error: '数据格式错误' });
        }

        let synced = 0;
        for (const item of words) {
            if (!item.word) continue;

            const [existing] = await queryWithRetry(
                'SELECT id, deleted FROM wrong_book WHERE word = ?', [item.word]
            );

            if (existing.length === 0) {
                // 新增
                await queryWithRetry(
                    `INSERT INTO wrong_book 
                        (word, meaning, example, root_affix, phonetic, from_source, from_list, grade, wrong_count, first_wrong_time, last_wrong_time, mastered)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        item.word,
                        item.meaning || '',
                        item.example || '',
                        item.rootAffix || '',
                        item.phonetic || '',
                        item.from || 'unknown',
                        JSON.stringify(item.fromList || [item.from || 'unknown']),
                        item.grade || '',
                        item.wrongCount || 1,
                        item.firstWrongTime || new Date(),
                        item.lastWrongTime || new Date(),
                        item.mastered ? 1 : 0
                    ]
                );
                synced++;
            } else if (existing[0].deleted === 1) {
                // 已软删除，恢复并更新
                await queryWithRetry(
                    `UPDATE wrong_book SET 
                        deleted = 0,
                        meaning = ?,
                        example = ?,
                        root_affix = ?,
                        phonetic = ?,
                        mastered = ?
                    WHERE word = ?`,
                    [
                        item.meaning || '',
                        item.example || '',
                        item.rootAffix || '',
                        item.phonetic || '',
                        item.mastered ? 1 : 0,
                        item.word
                    ]
                );
                synced++;
            }
        }

        res.json({ success: true, synced });
    } catch (error) {
        console.error('同步错题失败:', error);
        res.json({ success: false, error: error.message });
    }
});

module.exports = router;
