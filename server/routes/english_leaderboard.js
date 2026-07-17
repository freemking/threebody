const express = require('express');
const router = express.Router();
const { queryWithRetry } = require('../db');

// 获取排行榜列表（按游戏类型）
router.get('/list', async (req, res) => {
    try {
        const type = req.query.type || 'monopoly';
        const limit = parseInt(req.query.limit) || 10;
        
        const [rows] = await queryWithRetry(
            'SELECT * FROM english_leaderboard WHERE type = ? ORDER BY score DESC, time ASC LIMIT ?',
            [type, limit]
        );
        
        const data = rows.map(row => ({
            id: row.entry_id,
            name: row.name,
            score: row.score,
            level: row.level,
            combo: row.combo,
            time: row.time,
            grade: row.grade,
            unit: row.unit || 'all',
            type: row.type,
            date: row.date,
            createdAt: row.created_at
        }));
        
        res.json({ success: true, data });
    } catch (error) {
        console.error('获取英语排行榜失败:', error);
        res.json({ success: false, error: error.message });
    }
});

// 保存成绩
router.post('/save', async (req, res) => {
    try {
        const { id, name, score, level, combo, time, grade, unit, type, date } = req.body;
        
        if (!name || score === undefined || time === undefined || !type) {
            return res.json({ success: false, error: '缺少必要参数' });
        }
        
        // 检查同一用户在同一类型下是否已有记录
        const [existing] = await queryWithRetry(
            'SELECT * FROM english_leaderboard WHERE name = ? AND type = ?',
            [name, type]
        );
        
        if (existing.length > 0) {
            const existingRecord = existing[0];
            // 如果新成绩更好（分数更高，或分数相同但用时更短），则更新
            if (score > existingRecord.score || (score === existingRecord.score && time < existingRecord.time)) {
                await queryWithRetry(
                    'UPDATE english_leaderboard SET entry_id = ?, score = ?, level = ?, combo = ?, time = ?, grade = ?, unit = ?, date = ? WHERE id = ?',
                    [id, score, level || 1, combo || 0, time, grade, unit || 'all', date, existingRecord.id]
                );
            }
        } else {
            await queryWithRetry(
                'INSERT INTO english_leaderboard (entry_id, name, score, level, combo, time, grade, unit, type, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [id, name, score, level || 1, combo || 0, time, grade, unit || 'all', type, date]
            );
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('保存英语排行榜成绩失败:', error);
        res.json({ success: false, error: error.message });
    }
});

// 删除记录
router.post('/delete', async (req, res) => {
    try {
        const { id } = req.body;
        
        if (!id) {
            return res.json({ success: false, error: '缺少记录ID' });
        }
        
        await queryWithRetry('DELETE FROM english_leaderboard WHERE entry_id = ?', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error('删除英语排行榜记录失败:', error);
        res.json({ success: false, error: error.message });
    }
});

// 清空指定类型的排行榜
router.post('/clear', async (req, res) => {
    try {
        const { type } = req.body;
        
        if (!type) {
            return res.json({ success: false, error: '缺少类型参数' });
        }
        
        await queryWithRetry('DELETE FROM english_leaderboard WHERE type = ?', [type]);
        res.json({ success: true });
    } catch (error) {
        console.error('清空英语排行榜失败:', error);
        res.json({ success: false, error: error.message });
    }
});

module.exports = router;
