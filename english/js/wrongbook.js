/**
 * 错题本管理模块 - WrongBook
 * 数据只保存到MySQL数据库，不使用localStorage
 */

class WrongBook {
    constructor() {
        this.MAX_WRONG_WORDS = 200;
        // 自动检测API地址：本地开发用3000端口，生产环境用相对路径
        this.API_BASE = window.location.port === '8080' 
            ? 'http://localhost:3000/api/wrongbook' 
            : '/api/wrongbook';
        this._cache = []; // 内存缓存，从数据库加载
        this._loaded = false;
        this._loading = false;
    }

    /**
     * 初始化：从数据库加载数据
     */
    async init() {
        if (this._loading) return;
        this._loading = true;
        try {
            await this._loadFromDatabase();
        } finally {
            this._loading = false;
        }
    }

    /**
     * API请求封装
     */
    async _apiRequest(endpoint, method = 'GET', body = null) {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (body) options.body = JSON.stringify(body);
        
        const url = `${this.API_BASE}${endpoint}`;
        console.log(`API请求: ${method} ${url}`);
        
        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`API响应错误: ${response.status} ${response.statusText}`);
        }
        
        const text = await response.text();
        if (!text || text.trim() === '') {
            throw new Error('API响应为空');
        }
        
        return JSON.parse(text);
    }

    /**
     * 从数据库加载数据到内存缓存
     */
    async _loadFromDatabase() {
        try {
            const result = await this._apiRequest('/list');
            if (result && result.success && Array.isArray(result.data)) {
                this._cache = result.data;
                this._loaded = true;
                console.log(`从数据库加载了 ${this._cache.length} 条错题`);
                return this._cache;
            }
        } catch (error) {
            console.error('从数据库加载错题失败:', error);
        }
        return [];
    }

    /**
     * 获取所有错题（同步，从内存缓存）
     */
    getAll() {
        return this._cache;
    }

    /**
     * 添加错题
     */
    async addWrongWord(wordData) {
        if (!wordData || !wordData.word) return;

        const now = new Date().toISOString();
        const existingIndex = this._cache.findIndex(w => w.word === wordData.word);

        if (existingIndex !== -1) {
            // 已存在，更新缓存
            this._cache[existingIndex].wrongCount = (this._cache[existingIndex].wrongCount || 1) + 1;
            this._cache[existingIndex].lastWrongTime = now;
            if (wordData.from && !this._cache[existingIndex].fromList) {
                this._cache[existingIndex].fromList = [this._cache[existingIndex].from];
            }
            if (wordData.from && this._cache[existingIndex].fromList) {
                if (!this._cache[existingIndex].fromList.includes(wordData.from)) {
                    this._cache[existingIndex].fromList.push(wordData.from);
                }
            }
            if (wordData.meaning && !this._cache[existingIndex].meaning) {
                this._cache[existingIndex].meaning = wordData.meaning;
            }
            if (wordData.example && !this._cache[existingIndex].example) {
                this._cache[existingIndex].example = wordData.example;
            }
            if (wordData.rootAffix && !this._cache[existingIndex].rootAffix) {
                this._cache[existingIndex].rootAffix = wordData.rootAffix;
            }
            if (wordData.phonetic && !this._cache[existingIndex].phonetic) {
                this._cache[existingIndex].phonetic = wordData.phonetic;
            }
        } else {
            // 新增到缓存头部
            this._cache.unshift({
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

            // 限制最大数量
            if (this._cache.length > this.MAX_WRONG_WORDS) {
                this._cache = this._cache.slice(0, this.MAX_WRONG_WORDS);
            }
        }

        // 保存到数据库
        try {
            await this._apiRequest('/add', 'POST', {
                word: wordData.word,
                meaning: wordData.meaning || '',
                example: wordData.example || '',
                rootAffix: wordData.rootAffix || '',
                phonetic: wordData.phonetic || '',
                from: wordData.from || 'unknown',
                grade: wordData.grade || ''
            });
            console.log(`错题已保存到数据库: ${wordData.word}`);
        } catch (error) {
            console.error('保存错题到数据库失败:', error);
            // API失败时回滚缓存（可选：保持乐观更新）
        }
    }

    /**
     * 删除错题（软删除，可恢复）
     */
    async removeWrongWord(word) {
        this._cache = this._cache.filter(w => w.word !== word);

        try {
            await this._apiRequest('/remove', 'POST', { word });
            console.log(`错题已软删除: ${word}`);
        } catch (error) {
            console.error('删除错题失败:', error);
        }
    }

    /**
     * 标记已掌握
     */
    async markMastered(word) {
        const item = this._cache.find(w => w.word === word);
        if (item) {
            item.mastered = true;
        }

        try {
            await this._apiRequest('/mastered', 'POST', { word, mastered: true });
        } catch (error) {
            console.error('更新掌握状态失败:', error);
        }
    }

    /**
     * 取消掌握标记
     */
    async unmarkMastered(word) {
        const item = this._cache.find(w => w.word === word);
        if (item) {
            item.mastered = false;
        }

        try {
            await this._apiRequest('/mastered', 'POST', { word, mastered: false });
        } catch (error) {
            console.error('更新掌握状态失败:', error);
        }
    }

    /**
     * 清除已掌握的错题
     */
    async clearMastered() {
        this._cache = this._cache.filter(w => !w.mastered);

        try {
            await this._apiRequest('/clear-mastered', 'POST');
        } catch (error) {
            console.error('清除已掌握错题失败:', error);
        }
    }

    /**
     * 获取未掌握的错题
     */
    getUnmasteredWords() {
        return this._cache.filter(w => !w.mastered);
    }

    /**
     * 获取已掌握的错题
     */
    getMasteredWords() {
        return this._cache.filter(w => w.mastered);
    }

    /**
     * 清空错题本
     */
    async clearAll() {
        this._cache = [];

        try {
            await this._apiRequest('/clear-all', 'POST');
        } catch (error) {
            console.error('清空错题本失败:', error);
        }
    }

    /**
     * 获取错题统计
     */
    getStats() {
        return {
            total: this._cache.length,
            mastered: this._cache.filter(w => w.mastered).length,
            unmastered: this._cache.filter(w => !w.mastered).length,
            fromMonopoly: this._cache.filter(w => w.from === 'monopoly' || (w.fromList && w.fromList.includes('monopoly'))).length,
            fromWordmatch: this._cache.filter(w => w.from === 'wordmatch' || (w.fromList && w.fromList.includes('wordmatch'))).length,
            fromWordblast: this._cache.filter(w => w.from === 'wordblast' || (w.fromList && w.fromList.includes('wordblast'))).length
        };
    }

    /**
     * 恢复已删除的错题
     */
    async restoreWrongWord(word) {
        try {
            const result = await this._apiRequest('/restore', 'POST', { word });
            if (result.success) {
                // 重新加载数据
                await this._loadFromDatabase();
                return result.restored;
            }
            return false;
        } catch (error) {
            console.error('恢复错题失败:', error);
            return false;
        }
    }

    /**
     * 获取已删除的错题列表
     */
    async getDeletedWords() {
        try {
            const result = await this._apiRequest('/list-deleted');
            if (result && result.success) {
                return result.data;
            }
        } catch (error) {
            console.error('获取已删除错题失败:', error);
        }
        return [];
    }

    /**
     * 刷新缓存（从数据库重新加载）
     */
    async refresh() {
        return await this._loadFromDatabase();
    }
}

// 创建全局实例
const wrongBook = new WrongBook();

// 页面加载后初始化
window.addEventListener('load', async () => {
    try {
        await wrongBook.init();
        console.log('错题本初始化完成，从数据库加载数据');
        // 触发自定义事件，通知app.js刷新错题本列表
        window.dispatchEvent(new CustomEvent('wrongbook-loaded', { detail: wrongBook.getAll() }));
    } catch (error) {
        console.error('错题本初始化失败:', error);
    }
});

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WrongBook, wrongBook };
}
