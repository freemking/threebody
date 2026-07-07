/**
 * 单词数据管理模块
 * 负责加载、存储和管理英语单词数据
 */

class WordData {
    constructor() {
        this.words = {};
        this.grades = [];
        this.currentGrade = null;
        this.loaded = false;
        
        // 示例数据 - 实际应用中需要完整的单词库
        this.sampleData = {
            grade1: [
                {
                    id: "g1_001",
                    word: "apple",
                    phonetic: "/ˈæp.əl/",
                    meaning: "苹果",
                    example: "I eat an apple every day.",
                    category: "食物",
                    difficulty: 1,
                    audio: "apple.mp3",
                    unit: 1
                },
                {
                    id: "g1_002",
                    word: "book",
                    phonetic: "/bʊk/",
                    meaning: "书",
                    example: "I read a book.",
                    category: "学习用品",
                    difficulty: 1,
                    audio: "book.mp3",
                    unit: 1
                },
                {
                    id: "g1_003",
                    word: "cat",
                    phonetic: "/kæt/",
                    meaning: "猫",
                    example: "The cat is sleeping.",
                    category: "动物",
                    difficulty: 1,
                    audio: "cat.mp3",
                    unit: 1
                },
                {
                    id: "g1_004",
                    word: "dog",
                    phonetic: "/dɒɡ/",
                    meaning: "狗",
                    example: "I have a dog.",
                    category: "动物",
                    difficulty: 1,
                    audio: "dog.mp3",
                    unit: 2
                },
                {
                    id: "g1_005",
                    word: "egg",
                    phonetic: "/eɡ/",
                    meaning: "鸡蛋",
                    example: "I want an egg.",
                    category: "食物",
                    difficulty: 1,
                    audio: "egg.mp3",
                    unit: 2
                }
            ],
            grade2: [
                {
                    id: "g2_001",
                    word: "family",
                    phonetic: "/ˈfæm.əl.i/",
                    meaning: "家庭",
                    example: "I love my family.",
                    category: "家庭",
                    difficulty: 2,
                    audio: "family.mp3",
                    unit: 1
                },
                {
                    id: "g2_002",
                    word: "friend",
                    phonetic: "/frend/",
                    meaning: "朋友",
                    example: "She is my friend.",
                    category: "人物",
                    difficulty: 2,
                    audio: "friend.mp3",
                    unit: 1
                },
                {
                    id: "g2_003",
                    word: "school",
                    phonetic: "/skuːl/",
                    meaning: "学校",
                    example: "I go to school.",
                    category: "地点",
                    difficulty: 2,
                    audio: "school.mp3",
                    unit: 1
                },
                {
                    id: "g2_004",
                    word: "teacher",
                    phonetic: "/ˈtiː.tʃər/",
                    meaning: "老师",
                    example: "My teacher is nice.",
                    category: "人物",
                    difficulty: 2,
                    audio: "teacher.mp3",
                    unit: 2
                },
                {
                    id: "g2_005",
                    word: "student",
                    phonetic: "/ˈstjuː.dənt/",
                    meaning: "学生",
                    example: "I am a student.",
                    category: "人物",
                    difficulty: 2,
                    audio: "student.mp3",
                    unit: 2
                }
            ],
            grade3: [
                {
                    id: "g3_001",
                    word: "weather",
                    phonetic: "/ˈweð.ər/",
                    meaning: "天气",
                    example: "The weather is nice today.",
                    category: "自然",
                    difficulty: 3,
                    audio: "weather.mp3"
                },
                {
                    id: "g3_002",
                    word: "season",
                    phonetic: "/ˈsiː.zən/",
                    meaning: "季节",
                    example: "Spring is my favorite season.",
                    category: "自然",
                    difficulty: 3,
                    audio: "season.mp3"
                },
                {
                    id: "g3_003",
                    word: "holiday",
                    phonetic: "/ˈhɒl.ə.deɪ/",
                    meaning: "假期",
                    example: "I like holidays.",
                    category: "时间",
                    difficulty: 3,
                    audio: "holiday.mp3"
                },
                {
                    id: "g3_004",
                    word: "birthday",
                    phonetic: "/ˈbɜːθ.deɪ/",
                    meaning: "生日",
                    example: "Today is my birthday.",
                    category: "时间",
                    difficulty: 3,
                    audio: "birthday.mp3"
                },
                {
                    id: "g3_005",
                    word: "subject",
                    phonetic: "/ˈsʌb.dʒɪkt/",
                    meaning: "科目",
                    example: "Math is my favorite subject.",
                    category: "学习",
                    difficulty: 3,
                    audio: "subject.mp3"
                }
            ],
            grade4: [
                {
                    id: "g4_001",
                    word: "environment",
                    phonetic: "/ɪnˈvaɪ.rən.mənt/",
                    meaning: "环境",
                    example: "We should protect the environment.",
                    category: "自然",
                    difficulty: 4,
                    audio: "environment.mp3"
                },
                {
                    id: "g4_002",
                    word: "technology",
                    phonetic: "/tekˈnɒl.ə.dʒi/",
                    meaning: "技术",
                    example: "Technology changes our life.",
                    category: "科技",
                    difficulty: 4,
                    audio: "technology.mp3"
                },
                {
                    id: "g4_003",
                    word: "experience",
                    phonetic: "/ɪkˈspɪə.ri.əns/",
                    meaning: "经验",
                    example: "I have a lot of experience.",
                    category: "抽象",
                    difficulty: 4,
                    audio: "experience.mp3"
                },
                {
                    id: "g4_004",
                    word: "opportunity",
                    phonetic: "/ˌɒp.əˈtjuː.nə.ti/",
                    meaning: "机会",
                    example: "This is a good opportunity.",
                    category: "抽象",
                    difficulty: 4,
                    audio: "opportunity.mp3"
                },
                {
                    id: "g4_005",
                    word: "responsibility",
                    phonetic: "/rɪˌspɒn.səˈbɪl.ə.ti/",
                    meaning: "责任",
                    example: "It is my responsibility.",
                    category: "抽象",
                    difficulty: 4,
                    audio: "responsibility.mp3"
                }
            ],
            grade5: [
                {
                    id: "g5_001",
                    word: "communication",
                    phonetic: "/kəˌmjuː.nɪˈkeɪ.ʃən/",
                    meaning: "交流",
                    example: "Communication is important.",
                    category: "抽象",
                    difficulty: 5,
                    audio: "communication.mp3"
                },
                {
                    id: "g5_002",
                    word: "development",
                    phonetic: "/dɪˈvel.əp.mənt/",
                    meaning: "发展",
                    example: "The development of technology.",
                    category: "抽象",
                    difficulty: 5,
                    audio: "development.mp3"
                },
                {
                    id: "g5_003",
                    word: "education",
                    phonetic: "/ˌedʒ.ʊˈkeɪ.ʃən/",
                    meaning: "教育",
                    example: "Education is very important.",
                    category: "抽象",
                    difficulty: 5,
                    audio: "education.mp3"
                },
                {
                    id: "g5_004",
                    word: "imagination",
                    phonetic: "/ɪˌmædʒ.ɪˈneɪ.ʃən/",
                    meaning: "想象力",
                    example: "Use your imagination.",
                    category: "抽象",
                    difficulty: 5,
                    audio: "imagination.mp3"
                },
                {
                    id: "g5_005",
                    word: "knowledge",
                    phonetic: "/ˈnɒl.ɪdʒ/",
                    meaning: "知识",
                    example: "Knowledge is power.",
                    category: "抽象",
                    difficulty: 5,
                    audio: "knowledge.mp3"
                }
            ],
            grade6: [
                {
                    id: "g6_001",
                    word: "achievement",
                    phonetic: "/əˈtʃiːv.mənt/",
                    meaning: "成就",
                    example: "This is a great achievement.",
                    category: "抽象",
                    difficulty: 6,
                    audio: "achievement.mp3"
                },
                {
                    id: "g6_002",
                    word: "challenge",
                    phonetic: "/ˈtʃæl.ɪndʒ/",
                    meaning: "挑战",
                    example: "I accept the challenge.",
                    category: "抽象",
                    difficulty: 6,
                    audio: "challenge.mp3"
                },
                {
                    id: "g6_003",
                    word: "creativity",
                    phonetic: "/ˌkriː.eɪˈtɪv.ə.ti/",
                    meaning: "创造力",
                    example: "Creativity is important.",
                    category: "抽象",
                    difficulty: 6,
                    audio: "creativity.mp3"
                },
                {
                    id: "g6_004",
                    word: "determination",
                    phonetic: "/dɪˌtɜː.mɪˈneɪ.ʃən/",
                    meaning: "决心",
                    example: "Determination leads to success.",
                    category: "抽象",
                    difficulty: 6,
                    audio: "determination.mp3"
                },
                {
                    id: "g6_005",
                    word: "perseverance",
                    phonetic: "/ˌpɜː.sɪˈvɪə.rəns/",
                    meaning: "毅力",
                    example: "Perseverance is the key to success.",
                    category: "抽象",
                    difficulty: 6,
                    audio: "perseverance.mp3"
                }
            ]
        };
    }
    
    /**
     * 初始化数据
     */
    async init() {
        try {
            // 从JSON文件加载数据
            const grades = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            const loadPromises = grades.map(grade => this.loadGradeData(grade));
            
            await Promise.all(loadPromises);
            
            this.grades = Object.keys(this.words);
            this.loaded = true;
            console.log('单词数据加载完成，共加载', this.grades.length, '个年级');
            return true;
        } catch (error) {
            console.error('加载单词数据失败:', error);
            // 如果加载失败，使用示例数据作为后备
            this.words = this.sampleData;
            this.grades = Object.keys(this.words);
            this.loaded = true;
            console.log('使用示例数据作为后备');
            return false;
        }
    }
    
    /**
     * 加载指定年级的单词数据
     * @param {number} grade 年级
     * @returns {Promise} 加载完成的Promise
     */
    async loadGradeData(grade) {
        try {
            const response = await fetch(`data/grade${grade}.json`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.words[`grade${grade}`] = data;
            console.log(`年级 ${grade} 数据加载完成，共 ${data.length} 个单词`);
            return true;
        } catch (error) {
            console.warn(`加载年级 ${grade} 数据失败:`, error);
            // 如果某个年级加载失败，使用示例数据中的对应年级
            if (this.sampleData[`grade${grade}`]) {
                this.words[`grade${grade}`] = this.sampleData[`grade${grade}`];
            }
            return false;
        }
    }
    
    /**
     * 获取指定年级的单词
     * @param {number|string} grade 年级（1-9 或 'all'）
     * @param {number|string} unit 单元号或 'all'（可选，默认 'all'）
     * @returns {Array} 单词数组
     */
    getWordsByGrade(grade, unit = 'all') {
        let words = [];
        if (grade === 'all') {
            for (let g = 1; g <= 9; g++) {
                const gradeKey = `grade${g}`;
                if (this.words[gradeKey]) {
                    words = words.concat(this.words[gradeKey]);
                }
            }
        } else {
            const gradeKey = `grade${grade}`;
            words = this.words[gradeKey] || [];
        }
        
        if (unit !== 'all' && unit !== null) {
            words = words.filter(w => w.unit === parseInt(unit));
        }
        
        return words;
    }
    
    /**
     * 获取指定年级的单元列表
     * @param {number|string} grade 年级（1-9）
     * @returns {Array} 单元号数组
     */
    getUnitsByGrade(grade) {
        const gradeKey = `grade${grade}`;
        const words = this.words[gradeKey] || [];
        const units = [...new Set(words.map(w => w.unit))].sort((a, b) => a - b);
        return units;
    }
    
    /**
     * 获取指定分类的单词
     * @param {string} category 分类名称
     * @returns {Array} 单词数组
     */
    getWordsByCategory(category) {
        let result = [];
        for (const gradeKey in this.words) {
            const gradeWords = this.words[gradeKey].filter(word => word.category === category);
            result = result.concat(gradeWords);
        }
        return result;
    }
    
    /**
     * 搜索单词
     * @param {string} query 搜索关键词
     * @returns {Array} 匹配的单词数组
     */
    searchWords(query) {
        const lowerQuery = query.toLowerCase();
        let result = [];
        
        for (const gradeKey in this.words) {
            const gradeWords = this.words[gradeKey].filter(word => 
                word.word.toLowerCase().includes(lowerQuery) ||
                word.meaning.includes(query) ||
                word.category.includes(query)
            );
            result = result.concat(gradeWords);
        }
        
        return result;
    }
    
    /**
     * 获取随机单词
     * @param {number} count 单词数量
     * @param {number|string} grade 年级（可选）
     * @returns {Array} 随机单词数组
     */
    getRandomWords(count = 1, grade = 'all') {
        const words = this.getWordsByGrade(grade);
        const shuffled = [...words].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }
    
    /**
     * 获取单词详情
     * @param {string} wordId 单词ID
     * @returns {Object|null} 单词对象
     */
    getWordById(wordId) {
        for (const gradeKey in this.words) {
            const word = this.words[gradeKey].find(w => w.id === wordId);
            if (word) return word;
        }
        return null;
    }
    
    /**
     * 获取所有分类
     * @returns {Array} 分类数组
     */
    getAllCategories() {
        const categories = new Set();
        for (const gradeKey in this.words) {
            this.words[gradeKey].forEach(word => categories.add(word.category));
        }
        return Array.from(categories);
    }
    
    /**
     * 获取单词统计信息
     * @returns {Object} 统计信息
     */
    getStats() {
        let totalWords = 0;
        const gradeStats = {};
        const categoryStats = {};
        
        for (let g = 1; g <= 6; g++) {
            const gradeKey = `grade${g}`;
            const gradeWords = this.words[gradeKey] || [];
            gradeStats[g] = gradeWords.length;
            totalWords += gradeWords.length;
            
            gradeWords.forEach(word => {
                categoryStats[word.category] = (categoryStats[word.category] || 0) + 1;
            });
        }
        
        return {
            totalWords,
            gradeStats,
            categoryStats
        };
    }
    
    /**
     * 添加新单词
     * @param {Object} wordData 单词数据
     * @returns {boolean} 是否添加成功
     */
    addWord(wordData) {
        try {
            const gradeKey = `grade${wordData.grade}`;
            if (!this.words[gradeKey]) {
                this.words[gradeKey] = [];
            }
            
            // 生成唯一ID
            const id = `g${wordData.grade}_${Date.now()}`;
            const newWord = {
                id,
                ...wordData,
                difficulty: wordData.grade
            };
            
            this.words[gradeKey].push(newWord);
            return true;
        } catch (error) {
            console.error('添加单词失败:', error);
            return false;
        }
    }
    
    /**
     * 更新单词
     * @param {string} wordId 单词ID
     * @param {Object} updates 更新数据
     * @returns {boolean} 是否更新成功
     */
    updateWord(wordId, updates) {
        try {
            for (const gradeKey in this.words) {
                const index = this.words[gradeKey].findIndex(w => w.id === wordId);
                if (index !== -1) {
                    this.words[gradeKey][index] = { ...this.words[gradeKey][index], ...updates };
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('更新单词失败:', error);
            return false;
        }
    }
    
    /**
     * 删除单词
     * @param {string} wordId 单词ID
     * @returns {boolean} 是否删除成功
     */
    deleteWord(wordId) {
        try {
            for (const gradeKey in this.words) {
                const index = this.words[gradeKey].findIndex(w => w.id === wordId);
                if (index !== -1) {
                    this.words[gradeKey].splice(index, 1);
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('删除单词失败:', error);
            return false;
        }
    }
    
    /**
     * 导出数据为JSON
     * @returns {string} JSON字符串
     */
    exportToJSON() {
        return JSON.stringify(this.words, null, 2);
    }
    
    /**
     * 从JSON导入数据
     * @param {string} jsonString JSON字符串
     * @returns {boolean} 是否导入成功
     */
    importFromJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            this.words = data;
            this.grades = Object.keys(data);
            return true;
        } catch (error) {
            console.error('导入数据失败:', error);
            return false;
        }
    }
}

// 创建全局实例
const wordData = new WordData();

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WordData, wordData };
}