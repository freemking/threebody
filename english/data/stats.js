const fs = require('fs');
const path = require('path');

const dataDir = __dirname;
const files = fs.readdirSync(dataDir).filter(file => file.match(/^grade\d+\.json$/));

let totalWords = 0;
const stats = {};

files.forEach(file => {
  const filePath = path.join(dataDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const count = data.length;
  totalWords += count;
  stats[file] = {
    count,
    difficulty: data[0]?.difficulty || 'unknown',
    sampleWord: data[0]?.word || 'none',
    categories: [...new Set(data.map(w => w.category))]
  };
});

console.log('=== Grade JSON Files Statistics ===');
console.log(`Total files: ${files.length}`);
console.log(`Total words: ${totalWords}`);
console.log('');

files.sort().forEach(file => {
  const info = stats[file];
  console.log(`${file}: ${info.count} words, difficulty ${info.difficulty}`);
  console.log(`  Sample: "${info.sampleWord}"`);
  console.log(`  Categories: ${info.categories.join(', ')}`);
  console.log('');
});

// Save stats to file for reference
fs.writeFileSync(path.join(dataDir, 'stats.json'), JSON.stringify(stats, null, 2));
console.log('Stats saved to stats.json');