# 三体学习空间

一个基于三体主题的多学科学习游戏网站，包含英语单词、数学口算和数独挑战。

## 项目结构

```
首页/
├── index.html          # 主页入口
├── style.css           # 主页样式（三体主题设计系统）
├── script.js           # 主页脚本
├── nginx.conf          # Nginx部署配置
├── start-dev.bat       # 本地开发启动脚本
├── README.md           # 项目说明
├── english/            # 英语单词游戏
│   ├── index.html      # 英语游戏入口
│   ├── package.json    # Node.js配置
│   ├── js/             # JavaScript文件
│   │   ├── app.js      # 主应用逻辑
│   │   ├── vocabulary.js # 记单词模块
│   │   ├── wrongbook.js # 错题本模块
│   │   └── ...         # 其他游戏模块
│   ├── css/            # 样式文件
│   │   ├── style.css   # 全局设计系统变量
│   │   ├── wrongbook.css # 错题本专用样式（统一管理）
│   │   ├── vocabulary.css # 记单词模块样式
│   │   └── ...         # 其他游戏样式
│   ├── data/           # 单词数据(JSON)
│   └── assets/         # 资源文件
├── server/             # 后端服务器
│   ├── server.js       # Express服务器主文件
│   ├── routes/         # API路由
│   │   ├── wrongbook.js # 错题本API
│   │   ├── vocabulary.js # 记单词API
│   │   └── ...         # 其他API
│   └── db.js           # 数据库连接配置
├── math/               # 数学口算游戏
│   └── index.html      # 数学游戏入口
└── sudoku/             # 数独挑战游戏
    └── magic-sudoku.html # 数独游戏入口
```

## 本地开发

### 方式一：使用批处理脚本（推荐）

1. 确保已安装 [Node.js](https://nodejs.org/)
2. 双击运行 `start-dev.bat`
3. 浏览器访问 http://localhost:8080

### 方式二：手动启动

1. 确保已安装 Node.js
2. 在 `首页` 目录下打开命令行
3. 运行以下命令：
   ```bash
   npx http-server . -p 8080 -c-1 --cors
   ```
4. 浏览器访问 http://localhost:8080

### 方式三：使用英语游戏独立服务器

1. 进入 `english` 目录
2. 运行 `npm start`
3. 浏览器访问 http://localhost:3000

## 部署到服务器

### 1. 上传文件

将整个 `首页` 目录上传到服务器，例如：`/data/www/game/首页`

### 2. 配置Nginx

将 `nginx.conf` 中的内容添加到Nginx配置：

```bash
# 复制配置文件
sudo cp nginx.conf /etc/nginx/sites-available/threebody.conf

# 创建软链接
sudo ln -s /etc/nginx/sites-available/threebody.conf /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
```

### 3. 修改域名

在 `nginx.conf` 中修改 `server_name` 为您的实际域名。

### 4. 修改根目录路径

在 `nginx.conf` 中修改 `root` 为实际部署路径。

## 功能特性

### 英语单词游戏
- 📚 **单词大富翁（Monopoly）**：经典大富翁游戏模式，通过掷骰子、回答单词问题来前进
- 🃏 **单词配对（Word Match）**：记忆翻牌游戏，匹配单词与释义
- 💣 **单词大爆炸（Word Blast）**：填空练习，巩固单词拼写和用法
- 📓 **错题本系统**：自动收集游戏中的错误单词，支持复习、测验、导出打印
- 📊 **记单词模块**：支持单词训练、听写训练、学习数据统计
- 🎮 **支持1-9年级**：每个年级10个单元，涵盖小学到初中英语词汇
- 🤖 **AI对手系统**：智能AI对手，提升游戏挑战性

### 数学口算游戏
- ➗ **除法口算练习**：多种难度级别，支持正整数除法和带余除法

### 数独挑战游戏
- 🧩 **经典数独**：标准9x9数独挑战
- ✨ **魔法数独变体**：创新数独玩法

## 数据说明

英语单词数据存储在 `english/data/` 目录下，格式为JSON：

```json
{
  "id": "g1_001",
  "word": "apple",
  "phonetic": "/ˈæp.əl/",
  "meaning": "苹果",
  "example": "I eat an apple every day.",
  "category": "食物",
  "difficulty": 1,
  "audio": "apple.mp3",
  "unit": 1
}
```

## 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 许可证

MIT License

## 技术说明

### CSS样式架构

本项目采用模块化CSS架构，遵循三体科幻主题设计系统：

#### 设计系统变量
- `style.css`：定义全局CSS变量，包括颜色、间距、圆角、字体、动画等
- 三体主题：使用青色（#00ffff）、品红色（#ff00ff）、金色（#FBBF24）作为主色调
- 响应式设计：支持移动端、平板、桌面端自适应

#### 样式文件组织
1. **全局样式**：`style.css` 包含所有模块共享的设计系统变量
2. **错题本样式**：`wrongbook.css` 统一管理错题本相关样式，避免重复
3. **记单词样式**：`vocabulary.css` 记单词模块专用样式
4. **游戏样式**：`wordmatch.css`、`monopoly.css`、`wordblast.css` 各游戏模块专用

#### 样式整合优化
- 错题本样式已统一到 `wrongbook.css`，消除了跨文件重复
- 所有错题本组件（卡片、统计、筛选、测验模式等）使用统一的CSS变量
- 样式文件按功能模块分离，便于维护和扩展

### 后端API

#### 错题本API
- `GET /api/wrongbook/list`：获取所有错题
- `POST /api/wrongbook/add`：添加错题
- `PUT /api/wrongbook/master/:id`：标记掌握
- `DELETE /api/wrongbook/:id`：删除错题

#### 记单词API
- `GET /api/vocabulary/list`：获取词库列表
- `POST /api/vocabulary/add`：添加单词
- `PUT /api/vocabulary/study/:id`：更新学习进度
- `GET /api/vocabulary/stats`：获取学习统计

### 数据库

使用MySQL数据库，主要表结构：
- `wrong_book`：错题本表（单词库直接使用此表数据）
- `vocabulary_daily_record`：每日学习记录表
- `vocabulary_total_record`：总体学习记录表
- `leaderboard`：排行榜表