const express = require('express');
const router = express.Router();
const { queryWithRetry } = require('../db');
const { authenticateToken } = require('./auth');

// Alias for convenience
const db = { query: queryWithRetry };

// ==================== 字母组合数据接口 ====================

/**
 * 获取所有字母组合数据
 */
router.get('/', async (req, res) => {
  try {
    const { category, subcategory, gradeRange } = req.query;
    
    let query = `
      SELECT c.*, 
             GROUP_CONCAT(CONCAT_WS('||', ce.word, ce.phonetic, ce.meaning) SEPARATOR '##') as examples_data
      FROM combinations c
      LEFT JOIN combination_examples ce ON c.id = ce.combination_id
    `;
    
    const conditions = [];
    const params = [];
    
    if (category) {
      conditions.push('c.category = ?');
      params.push(category);
    }
    if (subcategory) {
      conditions.push('c.subcategory = ?');
      params.push(subcategory);
    }
    if (gradeRange) {
      conditions.push('c.grade_range LIKE ?');
      params.push(`%${gradeRange}%`);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' GROUP BY c.id ORDER BY c.category, c.difficulty, c.id';
    
    const [rows] = await db.query(query, params);
    
    // 解析示例数据
    const combinations = rows.map(row => {
      const examples = row.examples_data ? 
        row.examples_data.split('##').map(example => {
          const [word, phonetic, meaning] = example.split('||');
          return { word, phonetic, meaning };
        }) : [];
      
      return {
        id: row.id,
        pattern: row.pattern,
        category: row.category,
        subcategory: row.subcategory,
        pronunciation: row.pronunciation,
        description: row.description,
        gradeRange: row.grade_range,
        difficulty: row.difficulty,
        examples
      };
    });
    
    res.json({
      success: true,
      data: { combinations }
    });
  } catch (error) {
    console.error('获取字母组合数据失败:', error);
    res.status(500).json({ success: false, message: '获取字母组合数据失败' });
  }
});

// ==================== 用户学习进度接口 ====================

/**
 * 获取用户学习进度
 */
router.get('/progress', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [rows] = await db.query(
      `SELECT combination_id, mastery_level, study_count, quiz_count, correct_count, last_studied_at
       FROM user_combinations_progress 
       WHERE user_id = ? 
       ORDER BY last_studied_at DESC`,
      [userId]
    );
    
    // 按类别统计进度
    const [categoryStats] = await db.query(
      `SELECT 
         c.category,
         COUNT(DISTINCT c.id) as total_combinations,
         COUNT(DISTINCT ucp.combination_id) as studied_combinations,
         SUM(CASE WHEN ucp.mastery_level = 2 THEN 1 ELSE 0 END) as mastered_combinations
       FROM combinations c
       LEFT JOIN user_combinations_progress ucp ON c.id = ucp.combination_id AND ucp.user_id = ?
       GROUP BY c.category`,
      [userId]
    );
    
    res.json({
      success: true,
      data: {
        progress: rows,
        categoryStats
      }
    });
  } catch (error) {
    console.error('获取用户学习进度失败:', error);
    res.status(500).json({ success: false, message: '获取用户学习进度失败' });
  }
});

/**
 * 更新用户学习进度
 */
router.post('/progress', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { combinationId, masteryLevel } = req.body;
    
    if (!combinationId) {
      return res.status(400).json({ success: false, message: '缺少组合ID' });
    }
    
    // 检查是否已有进度记录
    const [existing] = await db.query(
      'SELECT id FROM user_combinations_progress WHERE user_id = ? AND combination_id = ?',
      [userId, combinationId]
    );
    
    if (existing.length > 0) {
      // 更新现有记录
      await db.query(
        `UPDATE user_combinations_progress 
         SET mastery_level = ?, 
             study_count = study_count + 1,
             last_studied_at = CURRENT_TIMESTAMP
         WHERE user_id = ? AND combination_id = ?`,
        [masteryLevel || 1, userId, combinationId]
      );
    } else {
      // 插入新记录
      await db.query(
        `INSERT INTO user_combinations_progress (user_id, combination_id, mastery_level, study_count, last_studied_at)
         VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)`,
        [userId, combinationId, masteryLevel || 1]
      );
    }
    
    // 返回更新后的进度
    const [rows] = await db.query(
      `SELECT combination_id, mastery_level, study_count, quiz_count, correct_count
       FROM user_combinations_progress 
       WHERE user_id = ?`,
      [userId]
    );
    
    res.json({
      success: true,
      data: { progress: rows }
    });
  } catch (error) {
    console.error('更新用户学习进度失败:', error);
    res.status(500).json({ success: false, message: '更新用户学习进度失败' });
  }
});

// ==================== 测验接口 ====================

/**
 * 获取测验题目
 */
router.get('/quiz', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, category, count } = req.query;
    
    let combinations = [];
    let questions = [];
    const questionCount = parseInt(count) || 5;
    
    // 根据类型获取组合数据
    if (type === '随堂小测') {
      // 单组合随堂小测，需要指定组合ID
      const { combinationId } = req.query;
      if (!combinationId) {
        return res.status(400).json({ success: false, message: '随堂小测需要指定组合ID' });
      }
      
      const [comboRows] = await db.query(
        `SELECT c.*, GROUP_CONCAT(CONCAT_WS('||', ce.word, ce.phonetic, ce.meaning) SEPARATOR '##') as examples_data
         FROM combinations c
         LEFT JOIN combination_examples ce ON c.id = ce.combination_id
         WHERE c.id = ?
         GROUP BY c.id`,
        [combinationId]
      );
      
      if (comboRows.length === 0) {
        return res.status(404).json({ success: false, message: '组合不存在' });
      }
      
      combinations = comboRows.map(row => {
        const examples = row.examples_data ? 
          row.examples_data.split('##').map(example => {
            const [word, phonetic, meaning] = example.split('||');
            return { word, phonetic, meaning };
          }) : [];
        
        return {
          id: row.id,
          pattern: row.pattern,
          category: row.category,
          pronunciation: row.pronunciation,
          examples
        };
      });
    } else if (type === '单元专项测') {
      // 单元专项测，按类别
      if (!category) {
        return res.status(400).json({ success: false, message: '单元专项测需要指定类别' });
      }
      
      const [comboRows] = await db.query(
        `SELECT c.*, GROUP_CONCAT(CONCAT_WS('||', ce.word, ce.phonetic, ce.meaning) SEPARATOR '##') as examples_data
         FROM combinations c
         LEFT JOIN combination_examples ce ON c.id = ce.combination_id
         WHERE c.category = ?
         GROUP BY c.id
         ORDER BY RAND()`,
        [category]
      );
      
      combinations = comboRows.map(row => {
        const examples = row.examples_data ? 
          row.examples_data.split('##').map(example => {
            const [word, phonetic, meaning] = example.split('||');
            return { word, phonetic, meaning };
          }) : [];
        
        return {
          id: row.id,
          pattern: row.pattern,
          category: row.category,
          pronunciation: row.pronunciation,
          examples
        };
      });
    } else if (type === '综合结业测') {
      // 综合结业测，混合所有类别
      const [comboRows] = await db.query(
        `SELECT c.*, GROUP_CONCAT(CONCAT_WS('||', ce.word, ce.phonetic, ce.meaning) SEPARATOR '##') as examples_data
         FROM combinations c
         LEFT JOIN combination_examples ce ON c.id = ce.combination_id
         GROUP BY c.id
         ORDER BY RAND()`
      );
      
      combinations = comboRows.map(row => {
        const examples = row.examples_data ? 
          row.examples_data.split('##').map(example => {
            const [word, phonetic, meaning] = example.split('||');
            return { word, phonetic, meaning };
          }) : [];
        
        return {
          id: row.id,
          pattern: row.pattern,
          category: row.category,
          pronunciation: row.pronunciation,
          examples
        };
      });
    }
    
    // 生成题目
    for (let i = 0; i < Math.min(questionCount, combinations.length); i++) {
      const combo = combinations[i];
      if (combo.examples.length < 3) continue; // 需要至少3个示例才能生成题目
      
      // 随机选择题型
      const questionTypes = ['看组合选单词', '看单词选组合', '单词中文配对'];
      const questionType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
      
      let question = null;
      
      if (questionType === '看组合选单词') {
        // 题目：显示字母组合，选择正确的单词
        const correctExample = combo.examples[Math.floor(Math.random() * combo.examples.length)];
        const otherExamples = combo.examples.filter(ex => ex.word !== correctExample.word);
        
        // 从其他组合获取干扰选项
        const [distractorRows] = await db.query(
          `SELECT ce.word FROM combination_examples ce
           WHERE ce.combination_id != ?
           ORDER BY RAND() LIMIT 3`,
          [combo.id]
        );
        
        const options = [correctExample.word];
        distractorRows.forEach(row => options.push(row.word));
        
        // 打乱选项顺序
        const shuffledOptions = options.sort(() => Math.random() - 0.5);
        
        question = {
          type: questionType,
          combinationId: combo.id,
          combinationPattern: combo.pattern,
          questionText: `选择包含字母组合 "${combo.pattern}" 的单词`,
          options: shuffledOptions,
          correctAnswer: correctExample.word,
          explanation: `字母组合 "${combo.pattern}" 发音为 ${combo.pronunciation}，例如 "${correctExample.word}" (${correctExample.meaning})`
        };
      } else if (questionType === '看单词选组合') {
        // 题目：显示单词，选择正确的字母组合
        const correctExample = combo.examples[Math.floor(Math.random() * combo.examples.length)];
        
        // 获取其他组合作为干扰选项
        const [distractorRows] = await db.query(
          `SELECT pattern FROM combinations WHERE id != ? ORDER BY RAND() LIMIT 3`,
          [combo.id]
        );
        
        const options = [combo.pattern];
        distractorRows.forEach(row => options.push(row.pattern));
        
        const shuffledOptions = options.sort(() => Math.random() - 0.5);
        
        question = {
          type: questionType,
          combinationId: combo.id,
          combinationPattern: combo.pattern,
          questionText: `单词 "${correctExample.word}" 中包含哪个字母组合？`,
          options: shuffledOptions,
          correctAnswer: combo.pattern,
          explanation: `单词 "${correctExample.word}" 中包含字母组合 "${combo.pattern}"，发音为 ${combo.pronunciation}`
        };
      } else if (questionType === '单词中文配对') {
        // 题目：显示单词，选择正确的中文释义
        const correctExample = combo.examples[Math.floor(Math.random() * combo.examples.length)];
        
        // 从其他示例获取干扰选项
        const otherExamples = combo.examples.filter(ex => ex.word !== correctExample.word);
        const [distractorRows] = await db.query(
          `SELECT meaning FROM combination_examples 
           WHERE combination_id != ? AND meaning != ?
           ORDER BY RAND() LIMIT 3`,
          [combo.id, correctExample.meaning]
        );
        
        const options = [correctExample.meaning];
        distractorRows.forEach(row => options.push(row.meaning));
        
        const shuffledOptions = options.sort(() => Math.random() - 0.5);
        
        question = {
          type: questionType,
          combinationId: combo.id,
          combinationPattern: combo.pattern,
          questionText: `选择单词 "${correctExample.word}" 的正确中文释义`,
          options: shuffledOptions,
          correctAnswer: correctExample.meaning,
          explanation: `单词 "${correctExample.word}" 的意思是 "${correctExample.meaning}"`
        };
      }
      
      if (question) {
        questions.push(question);
      }
    }
    
    res.json({
      success: true,
      data: {
        quizType: type,
        category: category || '综合',
        questions,
        totalQuestions: questions.length
      }
    });
  } catch (error) {
    console.error('获取测验题目失败:', error);
    res.status(500).json({ success: false, message: '获取测验题目失败' });
  }
});

/**
 * 提交测验结果
 */
router.post('/quiz', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { quizType, category, questions, answers, timeSpent } = req.body;
    
    if (!quizType || !questions || !answers) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }
    
    // 计算得分
    let correctCount = 0;
    const wrongAnswers = [];
    const weakCombinations = new Set();
    
    questions.forEach((question, index) => {
      const userAnswer = answers[index];
      const isCorrect = userAnswer === question.correctAnswer;
      
      if (isCorrect) {
        correctCount++;
      } else {
        wrongAnswers.push({
          question,
          userAnswer
        });
        weakCombinations.add(question.combinationId);
      }
    });
    
    const score = (correctCount / questions.length) * 100;
    
    // 保存测验历史
    await db.query(
      `INSERT INTO combinations_quiz_history (user_id, quiz_type, category, total_questions, correct_answers, score, time_spent, weak_combinations)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, quizType, category, questions.length, correctCount, score, timeSpent, JSON.stringify([...weakCombinations])]
    );
    
    // 保存错题到错题本
    for (const wrong of wrongAnswers) {
      await db.query(
        `INSERT INTO combinations_wrong_answers (user_id, combination_id, question_type, question_data, user_answer, correct_answer)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userId,
          wrong.question.combinationId,
          wrong.question.type,
          JSON.stringify(wrong.question),
          wrong.userAnswer,
          wrong.question.correctAnswer
        ]
      );
      
      // 更新用户进度中的测验计数
      await db.query(
        `INSERT INTO user_combinations_progress (user_id, combination_id, quiz_count, correct_count)
         VALUES (?, ?, 1, ?)
         ON DUPLICATE KEY UPDATE
           quiz_count = quiz_count + 1,
           correct_count = correct_count + ?`,
        [userId, wrong.question.combinationId, wrong.userAnswer === wrong.question.correctAnswer ? 1 : 0, wrong.userAnswer === wrong.question.correctAnswer ? 1 : 0]
      );
    }
    
    res.json({
      success: true,
      data: {
        score,
        totalQuestions: questions.length,
        correctAnswers: correctCount,
        wrongAnswers: wrongAnswers.length,
        weakCombinations: [...weakCombinations],
        timeSpent
      }
    });
  } catch (error) {
    console.error('提交测验结果失败:', error);
    res.status(500).json({ success: false, message: '提交测验结果失败' });
  }
});

/**
 * 获取测验历史
 */
router.get('/quiz-history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [rows] = await db.query(
      `SELECT id, quiz_type, category, total_questions, correct_answers, score, time_spent, weak_combinations, created_at
       FROM combinations_quiz_history 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
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

// ==================== 错题本接口 ====================

/**
 * 获取错题本
 */
router.get('/wrong-answers', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { combinationId, mastered } = req.query;
    
    let query = `
      SELECT cwa.*, c.pattern, c.category, c.pronunciation
      FROM combinations_wrong_answers cwa
      JOIN combinations c ON cwa.combination_id = c.id
      WHERE cwa.user_id = ?
    `;
    
    const params = [userId];
    
    if (combinationId) {
      query += ' AND cwa.combination_id = ?';
      params.push(combinationId);
    }
    
    if (mastered === 'true') {
      query += ' AND cwa.is_mastered = TRUE';
    } else if (mastered === 'false') {
      query += ' AND cwa.is_mastered = FALSE';
    }
    
    query += ' ORDER BY cwa.created_at DESC';
    
    const [rows] = await db.query(query, params);
    
    // 按组合分组
    const groupedByCombination = {};
    rows.forEach(row => {
      if (!groupedByCombination[row.combination_id]) {
        groupedByCombination[row.combination_id] = {
          combinationId: row.combination_id,
          pattern: row.pattern,
          category: row.category,
          pronunciation: row.pronunciation,
          wrongAnswers: []
        };
      }
      groupedByCombination[row.combination_id].wrongAnswers.push(row);
    });
    
    res.json({
      success: true,
      data: {
        wrongAnswers: rows,
        groupedByCombination: Object.values(groupedByCombination)
      }
    });
  } catch (error) {
    console.error('获取错题本失败:', error);
    res.status(500).json({ success: false, message: '获取错题本失败' });
  }
});

/**
 * 标记错题为已掌握
 */
router.post('/wrong-answers/master', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { wrongAnswerId } = req.body;
    
    if (!wrongAnswerId) {
      return res.status(400).json({ success: false, message: '缺少错题ID' });
    }
    
    await db.query(
      `UPDATE combinations_wrong_answers 
       SET is_mastered = TRUE, mastered_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [wrongAnswerId, userId]
    );
    
    res.json({
      success: true,
      message: '标记为已掌握成功'
    });
  } catch (error) {
    console.error('标记错题失败:', error);
    res.status(500).json({ success: false, message: '标记错题失败' });
  }
});

/**
 * 重做错题
 */
router.post('/wrong-answers/retry', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { wrongAnswerId, userAnswer } = req.body;
    
    if (!wrongAnswerId || !userAnswer) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }
    
    // 获取错题信息
    const [wrongRows] = await db.query(
      'SELECT * FROM combinations_wrong_answers WHERE id = ? AND user_id = ?',
      [wrongAnswerId, userId]
    );
    
    if (wrongRows.length === 0) {
      return res.status(404).json({ success: false, message: '错题不存在' });
    }
    
    const wrongAnswer = wrongRows[0];
    const isCorrect = userAnswer === wrongAnswer.correct_answer;
    
    if (isCorrect) {
      // 标记为已掌握
      await db.query(
        `UPDATE combinations_wrong_answers 
         SET is_mastered = TRUE, mastered_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [wrongAnswerId]
      );
      
      // 更新用户进度
      await db.query(
        `UPDATE user_combinations_progress 
         SET correct_count = correct_count + 1
         WHERE user_id = ? AND combination_id = ?`,
        [userId, wrongAnswer.combination_id]
      );
    }
    
    res.json({
      success: true,
      data: {
        isCorrect,
        correctAnswer: wrongAnswer.correct_answer,
        explanation: JSON.parse(wrongAnswer.question_data).explanation
      }
    });
  } catch (error) {
    console.error('重做错题失败:', error);
    res.status(500).json({ success: false, message: '重做错题失败' });
  }
});

/**
 * 获取单个字母组合详情
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [combinationRows] = await db.query(
      'SELECT * FROM combinations WHERE id = ?',
      [id]
    );
    
    if (combinationRows.length === 0) {
      return res.status(404).json({ success: false, message: '字母组合不存在' });
    }
    
    const [exampleRows] = await db.query(
      'SELECT * FROM combination_examples WHERE combination_id = ?',
      [id]
    );
    
    const combination = combinationRows[0];
    combination.examples = exampleRows;
    combination.gradeRange = combination.grade_range;
    
    res.json({
      success: true,
      data: { combination }
    });
  } catch (error) {
    console.error('获取字母组合详情失败:', error);
    res.status(500).json({ success: false, message: '获取字母组合详情失败' });
  }
});

module.exports = router;