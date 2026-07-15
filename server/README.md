# 三体学习空间 - 后端API服务

## 功能

提供错题本数据的数据库存储服务，支持MySQL数据库持久化。

## 安装

```bash
cd server
npm install
```

## 数据库初始化

1. 确保MySQL服务已启动
2. 执行初始化SQL创建表结构：

```bash
mysql -h 111.231.105.53 -u henry -p threebody < init-db.sql
```

## 启动服务

```bash
# 生产环境
npm start

# 开发环境（需要全局安装nodemon）
npm run dev
```

服务默认运行在 `http://localhost:3000`

## API接口

### 错题本接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/wrongbook/list` | GET | 获取所有错题 |
| `/api/wrongbook/add` | POST | 添加错题 |
| `/api/wrongbook/remove` | POST | 删除错题 |
| `/api/wrongbook/mastered` | POST | 标记/取消掌握 |
| `/api/wrongbook/clear-mastered` | POST | 清除已掌握错题 |
| `/api/wrongbook/clear-all` | POST | 清空全部错题 |
| `/api/wrongbook/sync` | POST | 从localStorage同步到数据库 |

### 排行榜接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/leaderboard/list?mode=<mode>&limit=<limit>` | GET | 获取指定模式排行榜 |
| `/api/leaderboard/save` | POST | 保存成绩 |
| `/api/leaderboard/delete` | POST | 删除记录 |
| `/api/leaderboard/clear` | POST | 清空指定模式排行榜 |
| `/api/leaderboard/user-best?name=<name>` | GET | 获取用户最佳成绩 |

### 其他接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/health` | GET | 健康检查 |

## 部署

### 方式一：直接运行

```bash
cd server
node server.js
```

### 方式二：使用PM2进程管理

```bash
# 安装PM2
npm install -g pm2

# 启动服务
pm2 start server.js --name threebody-api

# 设置开机自启
pm2 startup
pm2 save
```

### 方式三：使用systemd（Linux）

创建 `/etc/systemd/system/threebody-api.service`：

```ini
[Unit]
Description=ThreeBody Learning Space API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/threebodyspace/server
ExecStart=/usr/bin/node server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

启动服务：

```bash
sudo systemctl enable threebody-api
sudo systemctl start threebody-api
```

## Nginx配置

项目nginx.conf已包含API代理配置，会将 `/api/` 请求转发到本服务。

## 数据库配置

数据库配置在项目根目录的 `conf.yaml` 文件中。
