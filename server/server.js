const express = require('express');
const cors = require('cors');
const path = require('path');
const wrongbookRouter = require('./routes/wrongbook');
const leaderboardRouter = require('./routes/leaderboard');
const englishLeaderboardRouter = require('./routes/english_leaderboard');
const vocabularyRouter = require('./routes/vocabulary');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

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

// 启动服务器
app.listen(PORT, async () => {
console.log(`服务器已启动: http://localhost:${PORT}`);
console.log(`API接口: http://localhost:${PORT}/api/wrongbook`);
console.log(`排行榜接口: http://localhost:${PORT}/api/leaderboard`);
console.log(`英语排行榜接口: http://localhost:${PORT}/api/english-leaderboard`);
console.log(`记单词接口: http://localhost:${PORT}/api/vocabulary`);

});
