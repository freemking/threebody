const mysql = require('mysql2/promise');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

// 读取数据库配置
function loadConfig() {
    const configPath = path.join(__dirname, '..', 'conf.yaml');
    const fileContents = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(fileContents);
    return config.database;
}

// 创建连接池
let pool = null;

async function getPool() {
    if (!pool) {
        const config = loadConfig();
        pool = mysql.createPool({
            host: config.host,
            port: config.port,
            user: config.user,
            password: config.password,
            database: config.dbname,
            charset: config.charset || 'utf8mb4',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
    }
    return pool;
}

module.exports = { getPool };
