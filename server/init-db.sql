-- 错题本数据表
CREATE TABLE IF NOT EXISTS wrong_book (
    id INT AUTO_INCREMENT PRIMARY KEY,
    word VARCHAR(100) NOT NULL UNIQUE,
    meaning TEXT,
    example TEXT,
    root_affix VARCHAR(255),
    phonetic VARCHAR(100),
    from_source VARCHAR(50),
    from_list JSON,
    grade VARCHAR(20),
    wrong_count INT DEFAULT 1,
    first_wrong_time DATETIME,
    last_wrong_time DATETIME,
    mastered TINYINT(1) DEFAULT 0,
    deleted TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_word (word),
    INDEX idx_mastered (mastered),
    INDEX idx_deleted (deleted),
    INDEX idx_last_wrong_time (last_wrong_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 如果是升级已有表，添加 deleted 字段
ALTER TABLE wrong_book ADD COLUMN IF NOT EXISTS deleted TINYINT(1) DEFAULT 0 AFTER mastered;
ALTER TABLE wrong_book ADD INDEX IF NOT EXISTS idx_deleted (deleted);

-- 数学游戏排行榜数据表
CREATE TABLE IF NOT EXISTS math_leaderboard (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entry_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    score INT NOT NULL,
    correct INT NOT NULL,
    time INT NOT NULL,
    date VARCHAR(20),
    mode VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_entry_id (entry_id),
    INDEX idx_mode (mode),
    INDEX idx_name_mode (name, mode),
    INDEX idx_score (score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 英语游戏排行榜数据表（单词大富翁、单词配对、单词大爆炸共用）
CREATE TABLE IF NOT EXISTS english_leaderboard (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entry_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    score INT NOT NULL,
    level INT DEFAULT 1,
    combo INT DEFAULT 0,
    time INT NOT NULL,
    grade VARCHAR(20),
    type VARCHAR(20) NOT NULL,
    date VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_entry_id (entry_id),
    INDEX idx_type (type),
    INDEX idx_name_type (name, type),
    INDEX idx_score (score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
