#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const yaml = require('js-yaml');

// 加载配置文件
function loadConfig() {
    try {
        const configPath = path.join(__dirname, '..', 'conf.yaml');
        const configFile = fs.readFileSync(configPath, 'utf8');
        return yaml.load(configFile);
    } catch (e) {
        console.error('读取配置文件失败:', e.message);
        return null;
    }
}

async function importCombinations() {
    const config = loadConfig();
    if (!config) {
        console.error('无法加载配置文件');
        process.exit(1);
    }

    let connection;
    try {
        // 创建数据库连接
        connection = await mysql.createConnection({
            host: config.database.host,
            port: config.database.port,
            user: config.database.user,
            password: config.database.password,
            database: config.database.dbname,
            charset: 'utf8mb4'
        });

        console.log('数据库连接成功');

        // 读取组合数据
        const combinationsPath = path.join(__dirname, '..', 'english', 'data', 'combinations.json');
        const combinationsData = JSON.parse(fs.readFileSync(combinationsPath, 'utf8'));

        console.log(`读取到 ${combinationsData.length} 个字母组合`);

        // 清空现有数据（可选，根据需求决定）
        // await connection.execute('DELETE FROM combination_examples');
        // await connection.execute('DELETE FROM combinations');

        // 插入组合数据
        for (const combo of combinationsData) {
            // 插入主表
            await connection.execute(
                `INSERT INTO combinations (id, pattern, category, subcategory, pronunciation, description, grade_range, difficulty)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                    pattern = VALUES(pattern),
                    category = VALUES(category),
                    subcategory = VALUES(subcategory),
                    pronunciation = VALUES(pronunciation),
                    description = VALUES(description),
                    grade_range = VALUES(grade_range),
                    difficulty = VALUES(difficulty)`,
                [combo.id, combo.pattern, combo.category, combo.subcategory, combo.pronunciation, combo.description, combo.gradeRange, combo.difficulty]
            );

            // 插入示例单词
            for (const example of combo.examples) {
                await connection.execute(
                    `INSERT INTO combination_examples (combination_id, word, phonetic, meaning)
                     VALUES (?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                        word = VALUES(word),
                        phonetic = VALUES(phonetic),
                        meaning = VALUES(meaning)`,
                    [combo.id, example.word, example.phonetic, example.meaning]
                );
            }

            console.log(`导入成功: ${combo.id} - ${combo.pattern}`);
        }

        console.log('所有字母组合数据导入完成');

    } catch (error) {
        console.error('导入失败:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('数据库连接已关闭');
        }
    }
}

// 运行导入
importCombinations();