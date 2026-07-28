const fs = require('fs');
const path = require('path');

// 中文类别到英文词性的映射
const categoryToPOS = {
  '时间': 'n.',
  '学习用品': 'n.',
  '身体部位': 'n.',
  '动作': 'v.',
  '家庭': 'n.',
  '其他': 'n.',
  '数字': 'n.',
  '食物': 'n.',
  '动物': 'n.',
  '颜色': 'adj.',
  '玩具': 'n.',
  '饮料': 'n.',
  '天气': 'n.',
  '季节': 'n.',
  '服装': 'n.',
  '职业': 'n.',
  '家具': 'n.',
  '交通': 'n.',
  '地点': 'n.',
  '学科': 'n.',
  '节日': 'n.',
  '乐器': 'n.'
};

// 词性检测函数
function detectPOS(category, meaning) {
  // 如果已经是英文词性，直接返回
  if (category.match(/^(n\.|v\.|adj\.|adv\.|pron\.|prep\.|conj\.|abbr\.|phrase|modal v\.|det & pron|v & n|n & v|adj & pron|det & adj)$/)) {
    return category.replace(/\.$/, '').toLowerCase();
  }
  
  // 如果是中文类别，尝试映射
  if (categoryToPOS[category]) {
    return categoryToPOS[category].replace(/\.$/, '').toLowerCase();
  }
  
  // 如果还是无法确定，根据meaning猜测
  if (meaning.includes('的') && !meaning.includes('地') && !meaning.includes('得')) {
    return 'adj';
  }
  if (meaning.includes('地') || meaning.includes('得')) {
    return 'adv';
  }
  if (meaning.includes('做') || meaning.includes('进行') || meaning.includes('是') || meaning.includes('有')) {
    return 'v';
  }
  
  // 默认返回名词
  return 'n';
}

// 生成解释的函数 - 改进版本，生成真正的英语解释
function generateExplain(word, meaning, category, difficulty, example) {
  const pos = detectPOS(category, meaning);
  const meaningEn = meaning.split(/[；;，,]/)[0].trim(); // 取第一个意思
  
  // 创建基于单词的简单英语定义
  let definition = '';
  
  // 根据词性和难度生成不同的解释
  if (difficulty <= 3) {
    // 简单词汇，用简单模板
    switch (pos) {
      case 'n':
        definition = `A ${word} is something that people use or see in daily life.`;
        break;
      case 'v':
        definition = `To ${word} is an action that people do.`;
        break;
      case 'adj':
        definition = `${word} is a word that describes something.`;
        break;
      case 'adv':
        definition = `${word} is a word that describes how something is done.`;
        break;
      default:
        definition = `${word} is a common English word.`;
    }
  } else if (difficulty <= 6) {
    // 中级词汇，用更详细的模板
    switch (pos) {
      case 'n':
        definition = `A ${word} is a thing or concept that people refer to.`;
        break;
      case 'v':
        definition = `To ${word} means to perform a specific action.`;
        break;
      case 'adj':
        definition = `${word} describes a quality or characteristic of something.`;
        break;
      case 'adv':
        definition = `${word} describes the manner in which something is done.`;
        break;
      default:
        definition = `${word} is an English word with a specific meaning.`;
    }
  } else {
    // 高级词汇，用更专业的模板
    switch (pos) {
      case 'n':
        definition = `A ${word} is a concept or entity with a specific meaning.`;
        break;
      case 'v':
        definition = `To ${word} means to engage in a particular action or process.`;
        break;
      case 'adj':
        definition = `${word} describes a specific quality or state.`;
        break;
      case 'adv':
        definition = `${word} modifies a verb, adjective, or other adverb.`;
        break;
      default:
        definition = `${word} is a term with a specific meaning in English.`;
    }
  }
  
  return definition;
}

// 处理单个文件
function processFile(filePath) {
  console.log(`Processing ${path.basename(filePath)}...`);
  
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let processedCount = 0;
  
  data.forEach(word => {
    // 生成explain字段（覆盖现有的）
    word.explain = generateExplain(
      word.word,
      word.meaning,
      word.category,
      word.difficulty,
      word.example
    );
    processedCount++;
  });
  
  // 写回文件
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`  Added ${processedCount} explain fields`);
  
  return processedCount;
}

// 主函数
function main() {
  const dataDir = __dirname;
  const files = fs.readdirSync(dataDir)
    .filter(file => file.match(/^grade\d+\.json$/))
    .sort();
  
  let totalProcessed = 0;
  
  console.log('=== Adding explain fields to grade JSON files ===\n');
  
  files.forEach(file => {
    const filePath = path.join(dataDir, file);
    totalProcessed += processFile(filePath);
  });
  
  console.log(`\n=== Summary ===`);
  console.log(`Total files processed: ${files.length}`);
  console.log(`Total explain fields added: ${totalProcessed}`);
  console.log('Done!');
}

// 运行主函数
main();