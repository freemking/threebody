const express = require('express');
const router = express.Router();
const { queryWithRetry } = require('../db');
const { authenticateToken } = require('./auth');

// 音标学习进度相关接口

/**
 * 获取用户已学习的音标列表
 */
router.get('/progress', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await queryWithRetry(
      'SELECT phonetic_id, learned_at FROM phonetics_learning_progress WHERE user_id = ? ORDER BY learned_at DESC',
      [userId]
    );
    
    const learnedPhonetics = rows.map(row => row.phonetic_id);
    
    res.json({
      success: true,
      data: {
        learnedPhonetics,
        lastUpdated: rows.length > 0 ? rows[0].learned_at : null
      }
    });
  } catch (error) {
    console.error('获取音标学习进度失败:', error);
    res.status(500).json({ success: false, message: '获取音标学习进度失败' });
  }
});

/**
 * 更新音标学习进度（添加或移除已学习的音标）
 */
router.post('/progress', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { phoneticId, action } = req.body; // action: 'add' 或 'remove'
    
    if (!phoneticId || !action) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }
    
    if (action === 'add') {
      // 添加到已学习列表
      await queryWithRetry(
        'INSERT IGNORE INTO phonetics_learning_progress (user_id, phonetic_id) VALUES (?, ?)',
        [userId, phoneticId]
      );
    } else if (action === 'remove') {
      // 从已学习列表移除
      await queryWithRetry(
        'DELETE FROM phonetics_learning_progress WHERE user_id = ? AND phonetic_id = ?',
        [userId, phoneticId]
      );
    } else {
      return res.status(400).json({ success: false, message: '无效的操作类型' });
    }
    
    // 返回更新后的学习进度
    const [rows] = await queryWithRetry(
      'SELECT phonetic_id FROM phonetics_learning_progress WHERE user_id = ?',
      [userId]
    );
    
    const learnedPhonetics = rows.map(row => row.phonetic_id);
    
    res.json({
      success: true,
      data: { learnedPhonetics }
    });
  } catch (error) {
    console.error('更新音标学习进度失败:', error);
    res.status(500).json({ success: false, message: '更新音标学习进度失败' });
  }
});

// 音标测验历史相关接口

/**
 * 获取测验历史
 */
router.get('/quiz-history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await queryWithRetry(
      'SELECT id, quiz_type, quiz_date, score, total, percentage FROM phonetics_quiz_history WHERE user_id = ? ORDER BY quiz_date DESC',
      [userId]
    );
    
    res.json({
      success: true,
      data: { quizHistory: rows }
    });
  } catch (error) {
    console.error('获取测验历史失败:', error);
    res.status(500).json({ success: false, message: '获取测验历史失败' });
  }
});

/**
 * 保存测验记录
 */
router.post('/quiz-history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, date, score, total, percentage } = req.body;
    
    if (!type || score === undefined || total === undefined || percentage === undefined) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }
    
    const [result] = await queryWithRetry(
      'INSERT INTO phonetics_quiz_history (user_id, quiz_type, quiz_date, score, total, percentage) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, type, date || new Date(), score, total, percentage]
    );
    
    res.json({
      success: true,
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('保存测验记录失败:', error);
    res.status(500).json({ success: false, message: '保存测验记录失败' });
  }
});

/**
 * 删除测验记录
 */
router.delete('/quiz-history/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const quizId = req.params.id;
    
    const [result] = await queryWithRetry(
      'DELETE FROM phonetics_quiz_history WHERE id = ? AND user_id = ?',
      [quizId, userId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: '测验记录不存在' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('删除测验记录失败:', error);
    res.status(500).json({ success: false, message: '删除测验记录失败' });
  }
});

// 音标错题本相关接口

/**
 * 获取错题本
 */
router.get('/wrong-answers', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await queryWithRetry(
      'SELECT phonetic_id, quiz_type, correct_answer, wrong_time FROM phonetics_wrong_answers WHERE user_id = ? ORDER BY wrong_time DESC',
      [userId]
    );
    
    res.json({
      success: true,
      data: { wrongPhonetics: rows }
    });
  } catch (error) {
    console.error('获取错题本失败:', error);
    res.status(500).json({ success: false, message: '获取错题本失败' });
  }
});

/**
 * 保存错题
 */
router.post('/wrong-answers', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { phoneticId, type, correctAnswer } = req.body;
    
    if (!phoneticId || !type || !correctAnswer) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }
    
    await queryWithRetry(
      'INSERT INTO phonetics_wrong_answers (user_id, phonetic_id, quiz_type, correct_answer) VALUES (?, ?, ?, ?)',
      [userId, phoneticId, type, correctAnswer]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('保存错题失败:', error);
    res.status(500).json({ success: false, message: '保存错题失败' });
  }
});

/**
 * 删除错题
 */
router.delete('/wrong-answers/:phoneticId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const phoneticId = req.params.phoneticId;
    
    const [result] = await queryWithRetry(
      'DELETE FROM phonetics_wrong_answers WHERE user_id = ? AND phonetic_id = ?',
      [userId, phoneticId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: '错题记录不存在' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('删除错题失败:', error);
    res.status(500).json({ success: false, message: '删除错题失败' });
  }
});

/**
 * 清空错题本
 */
router.delete('/wrong-answers', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    await queryWithRetry(
      'DELETE FROM phonetics_wrong_answers WHERE user_id = ?',
      [userId]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('清空错题本失败:', error);
    res.status(500).json({ success: false, message: '清空错题本失败' });
  }
});

/**
 * 获取学习统计信息
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 获取已学习音标数量
    const [learnedRows] = await queryWithRetry(
      'SELECT COUNT(*) as count FROM phonetics_learning_progress WHERE user_id = ?',
      [userId]
    );
    
    // 获取测验次数
    const [quizRows] = await queryWithRetry(
      'SELECT COUNT(*) as count FROM phonetics_quiz_history WHERE user_id = ?',
      [userId]
    );
    
    // 获取错题数量
    const [wrongRows] = await queryWithRetry(
      'SELECT COUNT(*) as count FROM phonetics_wrong_answers WHERE user_id = ?',
      [userId]
    );
    
    // 获取平均正确率
    const [avgRows] = await queryWithRetry(
      'SELECT AVG(percentage) as avg_percentage FROM phonetics_quiz_history WHERE user_id = ?',
      [userId]
    );
    
    res.json({
      success: true,
      data: {
        learnedCount: learnedRows[0].count,
        quizCount: quizRows[0].count,
        wrongCount: wrongRows[0].count,
        averagePercentage: avgRows[0].avg_percentage || 0
      }
    });
  } catch (error) {
    console.error('获取学习统计失败:', error);
    res.status(500).json({ success: false, message: '获取学习统计失败' });
  }
});

module.exports = router;