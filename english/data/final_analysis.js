const fs = require('fs');

const genericPatterns = [
  'is a common English word',
  'is a common English phrase',
  'is an adjective describing',
  'is a noun referring',
  'is an adverb describing',
  'is the past tense',
  'is the present participle',
  'is an English expression',
  'is a verb meaning',
  'is a preposition meaning',
  'is a conjunction meaning'
];

const templatePattern = /is a (noun|verb|adjective|adverb) in English/;

const remaining = [];
const wordMap = new Map();

for (let g = 1; g <= 9; g++) {
  const file = 'grade' + g + '.json';
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  
  data.forEach(w => {
    if (genericPatterns.some(p => w.explain.includes(p)) || templatePattern.test(w.explain)) {
      const wordLower = w.word.toLowerCase();
      if (!wordMap.has(wordLower)) {
        wordMap.set(wordLower, {
          word: w.word,
          grade: g,
          meaning: w.meaning,
          category: w.category,
          explain: w.explain
        });
        remaining.push(wordMap.get(wordLower));
      }
    }
  });
}

console.log(`Remaining generic/template explanations: ${remaining.length}`);

// Save to file for further processing
fs.writeFileSync('remaining_generic.json', JSON.stringify(remaining, null, 2));
console.log('Saved to remaining_generic.json');

// Check for Chinese characters
let chineseCount = 0;
for (let g = 1; g <= 9; g++) {
  const file = 'grade' + g + '.json';
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  data.forEach(w => {
    if (/[\u4e00-\u9fff]/.test(w.explain)) chineseCount++;
  });
}
console.log(`Chinese characters in explanations: ${chineseCount}`);

// Overall summary
let totalWords = 0;
let goodExplanations = 0;
for (let g = 1; g <= 9; g++) {
  const file = 'grade' + g + '.json';
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  totalWords += data.length;
  data.forEach(w => {
    if (!genericPatterns.some(p => w.explain.includes(p)) && 
        !templatePattern.test(w.explain) &&
        !/[\u4e00-\u9fff]/.test(w.explain)) {
      goodExplanations++;
    }
  });
}

console.log(`\n=== Overall Summary ===`);
console.log(`Total words: ${totalWords}`);
console.log(`Good explanations: ${goodExplanations}`);
console.log(`Percentage: ${(goodExplanations / totalWords * 100).toFixed(1)}%`);