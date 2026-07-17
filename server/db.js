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
            queueLimit: 0,
            enableKeepAlive: true,
            keepAliveInitialDelay: 10000
        });
    }
    return pool;
}

// 带重试的查询方法（自动处理 ECONNRESET 等断连错误）
async function queryWithRetry(sql, params, maxRetries = 2) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const pool = await getPool();
            return await pool.query(sql, params);
        } catch (error) {
            const retryableCodes = ['ECONNRESET', 'PROTOCOL_CONNECTION_LOST', 'ETIMEDOUT', 'EPIPE'];
            if (attempt < maxRetries && (retryableCodes.includes(error.code) || error.fatal)) {
                console.warn(`数据库查询失败 (尝试 ${attempt + 1}/${maxRetries + 1}): ${error.code || error.message}，正在重试...`);
                // 重置连接池，强制重新创建连接
                if (pool) {
                    try { await pool.end(); } catch (_) {}
                    pool = null;
                }
                continue;
            }
            throw error;
        }
    }
}

module.exports = { getPool, queryWithRetry };
