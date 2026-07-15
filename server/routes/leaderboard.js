const express = require('express');
const router = express.Router();
const { getPool } = require('../db');

// 获取排行榜列表（按模式）
router.get('/list', async (req, res) => {
    try {
        const pool = await getPool();
        const mode = req.query.mode || 'normal';
        const limit = parseInt(req.query.limit) || 10;
        
        const [rows] = await pool.query(
            'SELECT * FROM math_leaderboard WHERE mode = ? ORDER BY score DESC, time ASC LIMIT ?',
            [mode, limit]
        );
        
        // 转换字段名为驼峰
        const data = rows.map(row => ({
            id: row.entry_id,
            name: row.name,
            score: row.score,
            correct: row.correct,
            time: row.time,
            date: row.date,
            mode: row.mode,
            createdAt: row.created_at
        }));
        
        res.json({ success: true, data });
    } catch (error) {
        console.error('获取排行榜失败:', error);
        res.json({ success: false, error: error.message });
    }
});

// 保存成绩
router.post('/save', async (req, res) => {
    try {
        const pool = await getPool();
        const { id, name, score, correct, time, date, mode } = req.body;
        
        if (!name || score === undefined || time === undefined || !mode) {
            return res.json({ success: false, error: '缺少必要参数' });
        }
        
        // 检查同一用户在同一模式下是否已有记录
        const [existing] = await pool.query(
            'SELECT * FROM math_leaderboard WHERE name = ? AND mode = ?',
            [name, mode]
        );
        
        if (existing.length > 0) {
            // 已存在记录，检查是否需要更新
            const existingRecord = existing[0];
            // 如果新成绩更好（分数更高，或分数相同但用时更短），则更新
            if (score > existingRecord.score || (score === existingRecord.score && time < existingRecord.time)) {
                await pool.query(
                    'UPDATE math_leaderboard SET entry_id = ?, score = ?, correct = ?, time = ?, date = ? WHERE id = ?',
                    [id, score, correct, time, date, existingRecord.id]
                );
            }
            // 否则保留原记录
        } else {
            // 新记录
            await pool.query(
                'INSERT INTO math_leaderboard (entry_id, name, score, correct, time, date, mode) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [id, name, score, correct, time, date, mode]
            );
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('保存成绩失败:', error);
        res.json({ success: false, error: error.message });
    }
});

// 删除记录
router.post('/delete', async (req, res) => {
    try {
        const pool = await getPool();
        const { id } = req.body;
        
        if (!id) {
            return res.json({ success: false, error: '缺少记录ID' });
        }
        
        await pool.query('DELETE FROM math_leaderboard WHERE entry_id = ?', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error('删除记录失败:', error);
        res.json({ success: false, error: error.message });
    }
});

// 清空指定模式的排行榜
router.post('/clear', async (req, res) => {
    try {
        const pool = await getPool();
        const { mode } = req.body;
        
        if (!mode) {
            return res.json({ success: false, error: '缺少模式参数' });
        }
        
        await pool.query('DELETE FROM math_leaderboard WHERE mode = ?', [mode]);
        res.json({ success: true });
    } catch (error) {
        console.error('清空排行榜失败:', error);
        res.json({ success: false, error: error.message });
    }
});

// 获取用户在所有模式下的最佳成绩
router.get('/user-best', async (req, res) => {
    try {
        const pool = await getPool();
        const name = req.query.name;
        
        if (!name) {
            return res.json({ success: false, error: '缺少用户名' });
        }
        
        const [rows] = await pool.query(
            'SELECT * FROM math_leaderboard WHERE name = ? ORDER BY score DESC, time ASC',
            [name]
        );
        
        // 按模式分组，只保留每个模式的最佳成绩
        const bestByMode = {};
        for (const row of rows) {
            if (!bestByMode[row.mode] || row.score > bestByMode[row.mode].score || 
                (row.score === bestByMode[row.mode].score && row.time < bestByMode[row.mode].time)) {
                bestByMode[row.mode] = {
                    id: row.entry_id,
                    name: row.name,
                    score: row.score,
                    correct: row.correct,
                    time: row.time,
                    date: row.date,
                    mode: row.mode
                };
            }
        }
        
        res.json({ success: true, data: Object.values(bestByMode) });
    } catch (error) {
        console.error('获取用户最佳成绩失败:', error);
        res.json({ success: false, error: error.message });
    }
});

module.exports = router;