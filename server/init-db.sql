-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(20) NOT NULL UNIQUE COMMENT '手机号（用户名）',
    nickname VARCHAR(100) NOT NULL COMMENT '昵称',
    password VARCHAR(255) NOT NULL COMMENT '密码（加密存储）',
    role ENUM('admin', 'user') DEFAULT 'user' COMMENT '角色：admin-管理员，user-普通用户',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_phone (phone),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 错题本数据表
CREATE TABLE IF NOT EXISTS wrong_book (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    word VARCHAR(100) NOT NULL,
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
    error_type VARCHAR(50) DEFAULT 'all',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY idx_user_word (user_id, word),
    INDEX idx_user_id (user_id),
    INDEX idx_word (word),
    INDEX idx_mastered (mastered),
    INDEX idx_deleted (deleted),
    INDEX idx_last_wrong_time (last_wrong_time),
    INDEX idx_error_type (error_type),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 数学游戏排行榜数据表
CREATE TABLE IF NOT EXISTS math_leaderboard (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    entry_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    score INT NOT NULL,
    correct INT NOT NULL,
    time INT NOT NULL,
    date VARCHAR(20),
    mode VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_entry_id (entry_id),
    INDEX idx_mode (mode),
    INDEX idx_name_mode (name, mode),
    INDEX idx_score (score),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 英语游戏排行榜数据表（单词大富翁、单词配对、单词大爆炸共用）
CREATE TABLE IF NOT EXISTS english_leaderboard (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    entry_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    score INT NOT NULL,
    level INT DEFAULT 1,
    combo INT DEFAULT 0,
    time INT NOT NULL,
    grade VARCHAR(20),
    unit VARCHAR(20) DEFAULT 'all',
    type VARCHAR(20) NOT NULL,
    date VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_entry_id (entry_id),
    INDEX idx_type (type),
    INDEX idx_name_type (name, type),
    INDEX idx_score (score),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 每日记单词记录表
CREATE TABLE IF NOT EXISTS vocabulary_daily_record (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    word VARCHAR(100) NOT NULL,
    study_date DATE NOT NULL,
    study_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    correct TINYINT(1) DEFAULT 0,
    response_time INT DEFAULT 0 COMMENT '回答时间(毫秒)',
    remembered TINYINT(1) DEFAULT 0 COMMENT '是否已记住(0-未记住, 1-已记住)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_word (word),
    INDEX idx_study_date (study_date),
    INDEX idx_word_date (word, study_date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 总体记单词记录表
CREATE TABLE IF NOT EXISTS vocabulary_total_record (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    word VARCHAR(100) NOT NULL,
    first_study_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_study_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    study_count INT DEFAULT 0,
    correct_count INT DEFAULT 0,
    mastered TINYINT(1) DEFAULT 0,
    mastered_time DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY idx_user_word (user_id, word),
    INDEX idx_user_id (user_id),
    INDEX idx_word (word),
    INDEX idx_mastered (mastered),
    INDEX idx_mastered_time (mastered_time),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 用户等级和成就表
CREATE TABLE IF NOT EXISTS vocabulary_user_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    level INT DEFAULT 1,
    total_words_learned INT DEFAULT 0,
    total_words_mastered INT DEFAULT 0,
    total_study_days INT DEFAULT 0,
    consecutive_days INT DEFAULT 0,
    max_consecutive_days INT DEFAULT 0,
    last_study_date DATE,
    achievements JSON,
    level_up_history JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY idx_user_id (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 学习成就表
CREATE TABLE IF NOT EXISTS vocabulary_achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    achievement_id VARCHAR(50) NOT NULL,
    achievement_name VARCHAR(100) NOT NULL,
    achievement_desc TEXT,
    unlocked_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    progress INT DEFAULT 0,
    target INT DEFAULT 1,
    unlocked TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY idx_user_achievement (user_id, achievement_id),
    INDEX idx_user_id (user_id),
    INDEX idx_unlocked (unlocked),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 注意：如果是从旧版本升级，需要手动执行以下 SQL：
-- 1. 创建用户表
-- 2. 给现有表添加 user_id 字段
-- 3. 创建默认管理员用户
-- 4. 更新现有数据的 user_id

-- 创建默认管理员用户（密码：admin123，实际使用时需要修改）
-- INSERT INTO users (phone, nickname, password, role) VALUES ('13800138000', '管理员', '$2b$10$...加密后的密码...', 'admin');
