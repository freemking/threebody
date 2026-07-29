const express = require('express');
const cors = require('cors');
const path = require('path');
const { queryWithRetry } = require('./db');
const wrongbookRouter = require('./routes/wrongbook');
const leaderboardRouter = require('./routes/leaderboard');
const englishLeaderboardRouter = require('./routes/english_leaderboard');
const vocabularyRouter = require('./routes/vocabulary');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 认证路由
app.use('/api/auth', authRouter.router);

// API路由
app.use('/api/wrongbook', wrongbookRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/english-leaderboard', englishLeaderboardRouter);
app.use('/api/vocabulary', vocabularyRouter);

// 静态文件服务（指向项目根目录）
app.use(express.static(path.join(__dirname, '..')));

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// 数据库迁移：给vocabulary_daily_record添加UNIQUE约束并清理重复数据
async function runMigrations() {
    try {
        console.log('执行数据库迁移...');
        
        // 1. 清理重复记录（保留最早的一条）
        await queryWithRetry(`
            DELETE t1 FROM vocabulary_daily_record t1
            INNER JOIN vocabulary_daily_record t2
            WHERE t1.user_id = t2.user_id 
              AND t1.word = t2.word 
              AND t1.study_date = t2.study_date 
              AND t1.id > t2.id
        `);
        console.log('已清理重复的daily_record记录');
        
        // 2. 检查UNIQUE约束是否已存在
        const [indexes] = await queryWithRetry(`
            SHOW INDEX FROM vocabulary_daily_record WHERE Key_name = 'idx_user_word_date'
        `);
        
        if (indexes.length === 0) {
            // 添加UNIQUE约束
            await queryWithRetry(`
                ALTER TABLE vocabulary_daily_record 
                ADD UNIQUE INDEX idx_user_word_date (user_id, word, study_date)
            `);
            console.log('已添加UNIQUE约束: idx_user_word_date');
        } else {
            console.log('UNIQUE约束已存在，跳过');
        }
        
        console.log('数据库迁移完成');
    } catch (error) {
        console.error('数据库迁移失败:', error.message);
        // 迁移失败不阻止服务器启动
    }
}

// 启动服务器
app.listen(PORT, async () => {
    console.log(`服务器已启动: http://localhost:${PORT}`);
    console.log(`API接口: http://localhost:${PORT}/api/wrongbook`);
    console.log(`排行榜接口: http://localhost:${PORT}/api/leaderboard`);
    console.log(`英语排行榜接口: http://localhost:${PORT}/api/english-leaderboard`);
    console.log(`记单词接口: http://localhost:${PORT}/api/vocabulary`);
    console.log(`认证接口: http://localhost:${PORT}/api/auth`);
    
    // 执行迁移
    await runMigrations();
});
