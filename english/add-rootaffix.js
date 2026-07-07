const fs = require('fs');
const path = require('path');

// 读取所有docs文件
const docsDir = path.join(__dirname, 'docs');
const docFiles = ['1.md', '2.md', '3.md'];

// 构建单词到词根词缀的映射表
function buildRootAffixMap() {
  const rootAffixMap = {};
  
  for (const docFile of docFiles) {
    const filePath = path.join(docsDir, docFile);
    if (!fs.existsSync(filePath)) {
      console.log(`文件不存在: ${filePath}`);
      continue;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // 匹配 "结构分析：word=..." 格式
      const match = line.match(/结构分析[：:]\s*(\w+)\s*[=＝]\s*(.+)/);
      if (match) {
        const word = match[1].toLowerCase().trim();
        const analysis = match[2].trim();
        
        // 如果单词还没有记录，或者新记录更详细，则更新
        if (!rootAffixMap[word] || analysis.length > rootAffixMap[word].length) {
          rootAffixMap[word] = analysis;
        }
      }
    }
  }
  
  return rootAffixMap;
}

// 处理单个grade文件
function processGradeFile(filePath, rootAffixMap) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let updatedCount = 0;
  let alreadyHasCount = 0;
  
  data.forEach(item => {
    const word = item.word.toLowerCase().trim();
    
    // 跳过已经有rootAffix的单词
    if (item.rootAffix) {
      alreadyHasCount++;
      return;
    }
    
    if (rootAffixMap[word]) {
      item.rootAffix = rootAffixMap[word];
      updatedCount++;
    }
  });
  
  // 写回文件
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  
  return { updatedCount, alreadyHasCount, totalCount: data.length };
}

// 主函数
function main() {
  console.log('开始构建词根词缀映射表...');
  const rootAffixMap = buildRootAffixMap();
  console.log(`找到 ${Object.keys(rootAffixMap).length} 个单词的词根词缀信息`);
  
  // 处理所有grade文件
  const dataDir = path.join(__dirname, 'data');
  const gradeFiles = fs.readdirSync(dataDir)
    .filter(file => file.startsWith('grade') && file.endsWith('.json'))
    .sort();
  
  console.log(`\n找到 ${gradeFiles.length} 个grade文件\n`);
  
  let totalUpdated = 0;
  let totalAlreadyHas = 0;
  let totalWords = 0;
  
  for (const gradeFile of gradeFiles) {
    const filePath = path.join(dataDir, gradeFile);
    console.log(`处理 ${gradeFile}...`);
    
    const result = processGradeFile(filePath, rootAffixMap);
    console.log(`  总单词: ${result.totalCount}, 新增: ${result.updatedCount}, 已有: ${result.alreadyHasCount}`);
    
    totalUpdated += result.updatedCount;
    totalAlreadyHas += result.alreadyHasCount;
    totalWords += result.totalCount;
  }
  
  console.log('\n=== 统计 ===');
  console.log(`总单词数: ${totalWords}`);
  console.log(`已有词根词缀: ${totalAlreadyHas}`);
  console.log(`本次新增: ${totalUpdated}`);
  console.log(`无词根词缀: ${totalWords - totalAlreadyHas - totalUpdated}`);
  console.log(`覆盖率: ${((totalAlreadyHas + totalUpdated) / totalWords * 100).toFixed(2)}%`);
}

main();
