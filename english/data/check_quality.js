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

const chinesePattern = /[\u4e00-\u9fff]/;

let totalGeneric = 0;
let totalChinese = 0;
let totalWords = 0;

for (let g = 1; g <= 9; g++) {
  const file = 'grade' + g + '.json';
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  
  let genericCount = 0;
  let chineseCount = 0;
  
  data.forEach(w => {
    totalWords++;
    
    // Check for generic patterns
    if (genericPatterns.some(p => w.explain.includes(p))) {
      genericCount++;
    }
    
    // Check for Chinese characters
    if (chinesePattern.test(w.explain)) {
      chineseCount++;
    }
  });
  
  console.log(`${file}: ${data.length} words, ${genericCount} generic, ${chineseCount} Chinese`);
  totalGeneric += genericCount;
  totalChinese += chineseCount;
}

console.log(`\nTotal: ${totalWords} words`);
console.log(`Generic explanations: ${totalGeneric}`);
console.log(`Chinese in explanations: ${totalChinese}`);
console.log(`Good explanations: ${totalWords - totalGeneric - totalChinese}`);
console.log(`Percentage improved: ${((totalWords - totalGeneric - totalChinese) / totalWords * 100).toFixed(1)}%`);

// Also check for "is a noun in English" template (from grade1-3)
const templatePattern = /is a (noun|verb|adjective|adverb) in English/;
let templateCount = 0;
for (let g = 1; g <= 9; g++) {
  const file = 'grade' + g + '.json';
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  data.forEach(w => {
    if (templatePattern.test(w.explain)) {
      templateCount++;
    }
  });
}
console.log(`\nTemplate explanations (is a X in English): ${templateCount}`);