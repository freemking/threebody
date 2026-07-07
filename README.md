# 三体学习空间

一个基于三体主题的多学科学习游戏网站，包含英语单词、数学口算和数独挑战。

## 项目结构

```
首页/
├── index.html          # 主页入口
├── style.css           # 主页样式
├── script.js           # 主页脚本
├── nginx.conf          # Nginx部署配置
├── start-dev.bat       # 本地开发启动脚本
├── README.md           # 项目说明
├── english/            # 英语单词游戏
│   ├── index.html      # 英语游戏入口
│   ├── package.json    # Node.js配置
│   ├── js/             # JavaScript文件
│   ├── css/            # 样式文件
│   ├── data/           # 单词数据(JSON)
│   └── assets/         # 资源文件
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
- 📚 单词大富翁（Monopoly）
- 🃏 单词配对（Word Match）
- 💣 单词大爆炸（Word Blast）
- 📓 错题本
- 支持1-9年级，每个年级10个单元
- AI对手系统

### 数学口算游戏
- ➗ 除法口算练习
- 多种难度级别

### 数独挑战游戏
- 🧩 经典数独
- 魔法数独变体

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