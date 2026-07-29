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

const wordSet = new Set();
const wordList = [];

for (let g = 4; g <= 9; g++) {
  const file = 'grade' + g + '.json';
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  
  data.forEach(w => {
    if (genericPatterns.some(p => w.explain.includes(p))) {
      const word = w.word.toLowerCase();
      if (!wordSet.has(word)) {
        wordSet.add(word);
        wordList.push({
          word: w.word,
          grade: g,
          meaning: w.meaning,
          currentExplain: w.explain
        });
      }
    }
  });
}

console.log(`Found ${wordList.length} unique words with generic explanations`);

// Save to file
fs.writeFileSync('words_needing_definitions.json', JSON.stringify(wordList, null, 2));
console.log('Saved to words_needing_definitions.json');

// Also show some examples
console.log('\nFirst 20 words:');
wordList.slice(0, 20).forEach((w, i) => {
  console.log(`${i+1}. ${w.word} (grade${w.grade}): ${w.meaning}`);
});