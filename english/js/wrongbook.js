/**
 * 错题本管理模块 - WrongBook
 * 收集游戏中答错的单词，支持复习和删除
 */

class WrongBook {
    constructor() {
        this.STORAGE_KEY = 'wrongBook';
        this.MAX_WRONG_WORDS = 200; // 最多保存200个错词
    }

    /**
     * 获取所有错题
     * @returns {Array} 错题列表
     */
    getAll() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.warn('Failed to load wrong book:', error);
            return [];
        }
    }

    /**
     * 保存错题列表
     * @param {Array} words - 错题列表
     */
    _save(words) {
        try {
            // 限制数量，保留最新的
            if (words.length > this.MAX_WRONG_WORDS) {
                words = words.slice(-this.MAX_WRONG_WORDS);
            }
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(words));
        } catch (error) {
            console.warn('Failed to save wrong book:', error);
        }
    }

    /**
     * 添加错题
     * @param {Object} wordData - 单词数据
     * @param {string} wordData.word - 英文单词
     * @param {string} wordData.meaning - 中文释义
     * @param {string} wordData.example - 例句（可选）
     * @param {string} wordData.from - 来源游戏 ('monopoly', 'wordmatch', 'wordblast')
     * @param {string} wordData.grade - 年级（可选）
     * @param {string} wordData.rootAffix - 词根词缀信息（可选）
     * @param {string} wordData.phonetic - 音标（可选）
     */
    addWrongWord(wordData) {
        if (!wordData || !wordData.word) return;

        const words = this.getAll();
        const now = new Date().toISOString();

        // 检查是否已存在该单词
        const existingIndex = words.findIndex(w => w.word === wordData.word);
        
        if (existingIndex !== -1) {
            // 已存在，更新错题次数和时间
            words[existingIndex].wrongCount = (words[existingIndex].wrongCount || 1) + 1;
            words[existingIndex].lastWrongTime = now;
            // 更新来源信息
            if (wordData.from && !words[existingIndex].fromList) {
                words[existingIndex].fromList = [words[existingIndex].from];
            }
            if (wordData.from && words[existingIndex].fromList) {
                if (!words[existingIndex].fromList.includes(wordData.from)) {
                    words[existingIndex].fromList.push(wordData.from);
                }
            }
            // 更新词根词缀信息（如果有新的）
            if (wordData.rootAffix && !words[existingIndex].rootAffix) {
                words[existingIndex].rootAffix = wordData.rootAffix;
            }
            // 更新音标信息（如果有新的）
            if (wordData.phonetic && !words[existingIndex].phonetic) {
                words[existingIndex].phonetic = wordData.phonetic;
            }
        } else {
            // 不存在，添加新错题
            words.push({
                word: wordData.word,
                meaning: wordData.meaning || '',
                example: wordData.example || '',
                rootAffix: wordData.rootAffix || '',
                phonetic: wordData.phonetic || '',
                from: wordData.from || 'unknown',
                fromList: [wordData.from || 'unknown'],
                grade: wordData.grade || '',
                wrongCount: 1,
                firstWrongTime: now,
                lastWrongTime: now,
                mastered: false
            });
        }

        this._save(words);
    }

    /**
     * 删除错题
     * @param {string} word - 要删除的单词
     */
    removeWrongWord(word) {
        const words = this.getAll();
        const filtered = words.filter(w => w.word !== word);
        this._save(filtered);
    }

    /**
     * 标记已掌握
     * @param {string} word - 单词
     */
    markMastered(word) {
        const words = this.getAll();
        const item = words.find(w => w.word === word);
        if (item) {
            item.mastered = true;
            this._save(words);
        }
    }

    /**
     * 取消掌握标记
     * @param {string} word - 单词
     */
    unmarkMastered(word) {
        const words = this.getAll();
        const item = words.find(w => w.word === word);
        if (item) {
            item.mastered = false;
            this._save(words);
        }
    }

    /**
     * 清除已掌握的错题
     */
    clearMastered() {
        const words = this.getAll();
        const filtered = words.filter(w => !w.mastered);
        this._save(filtered);
    }

    /**
     * 获取未掌握的错题
     * @returns {Array} 未掌握的错题列表
     */
    getUnmasteredWords() {
        return this.getAll().filter(w => !w.mastered);
    }

    /**
     * 获取已掌握的错题
     * @returns {Array} 已掌握的错题列表
     */
    getMasteredWords() {
        return this.getAll().filter(w => w.mastered);
    }

    /**
     * 清空错题本
     */
    clearAll() {
        this._save([]);
    }

    /**
     * 获取错题统计
     * @returns {Object} 统计信息
     */
    getStats() {
        const words = this.getAll();
        return {
            total: words.length,
            mastered: words.filter(w => w.mastered).length,
            unmastered: words.filter(w => !w.mastered).length,
            fromMonopoly: words.filter(w => w.from === 'monopoly' || (w.fromList && w.fromList.includes('monopoly'))).length,
            fromWordmatch: words.filter(w => w.from === 'wordmatch' || (w.fromList && w.fromList.includes('wordmatch'))).length,
            fromWordblast: words.filter(w => w.from === 'wordblast' || (w.fromList && w.fromList.includes('wordblast'))).length
        };
    }
}

// 创建全局实例
const wrongBook = new WrongBook();

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WrongBook, wrongBook };
}
