const fs = require('fs');

// Generic patterns to replace
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

// Helper function to generate English definition from Chinese meaning
function generateDefinition(word, meaning, category) {
  // Remove Chinese characters and clean up
  const cleanMeaning = meaning.replace(/[\u4e00-\u9fff]/g, '').trim();
  
  // If meaning is empty after cleaning, use a generic approach
  if (!cleanMeaning) {
    return `a common English word`;
  }
  
  // Determine POS from category
  let pos = 'n';
  const categoryLower = category.toLowerCase();
  if (categoryLower.includes('adj') || categoryLower.includes('形容词')) pos = 'adj';
  else if (categoryLower.includes('v') || categoryLower.includes('动词')) pos = 'v';
  else if (categoryLower.includes('adv') || categoryLower.includes('副词')) pos = 'adv';
  else if (categoryLower.includes('prep') || categoryLower.includes('介词')) pos = 'prep';
  else if (categoryLower.includes('conj') || categoryLower.includes('连词')) pos = 'conj';
  else if (categoryLower.includes('pron') || categoryLower.includes('代词')) pos = 'pron';
  else if (categoryLower.includes('phrase') || categoryLower.includes('短语')) pos = 'phrase';
  
  // Generate definition based on POS and meaning
  switch (pos) {
    case 'n':
      if (cleanMeaning.includes('的')) {
        // Remove 的 and treat as adjective-like meaning
        const adjMeaning = cleanMeaning.replace(/的/g, '').trim();
        return `something that is ${adjMeaning}`;
      }
      return cleanMeaning;
    case 'v':
      // For verbs, try to make it infinitive
      if (cleanMeaning.startsWith('to ')) return cleanMeaning;
      return `to ${cleanMeaning}`;
    case 'adj':
      // For adjectives, try to make it descriptive
      if (cleanMeaning.includes('的')) {
        return cleanMeaning.replace(/的/g, '').trim();
      }
      return cleanMeaning;
    case 'adv':
      return cleanMeaning;
    case 'prep':
      return cleanMeaning;
    case 'conj':
      return cleanMeaning;
    case 'pron':
      return cleanMeaning;
    case 'phrase':
      return cleanMeaning;
    default:
      return cleanMeaning;
  }
}

// Process files
let totalImproved = 0;
let remainingGeneric = 0;

for (let g = 4; g <= 9; g++) {
  const file = 'grade' + g + '.json';
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  let improved = 0;
  
  data.forEach(w => {
    const wordLower = w.word.toLowerCase();
    const cap = w.word.charAt(0).toUpperCase() + w.word.slice(1);
    const article = /^[aeiou]/i.test(wordLower) ? 'An' : 'A';
    
    // Only process words with generic explanations
    if (genericPatterns.some(p => w.explain.includes(p))) {
      // Generate definition from Chinese meaning
      const definition = generateDefinition(w.word, w.meaning, w.category);
      
      // Determine POS from category
      let pos = 'n';
      const categoryLower = w.category.toLowerCase();
      if (categoryLower.includes('adj') || categoryLower.includes('形容词')) pos = 'adj';
      else if (categoryLower.includes('v') || categoryLower.includes('动词')) pos = 'v';
      else if (categoryLower.includes('adv') || categoryLower.includes('副词')) pos = 'adv';
      else if (categoryLower.includes('prep') || categoryLower.includes('介词')) pos = 'prep';
      else if (categoryLower.includes('conj') || categoryLower.includes('连词')) pos = 'conj';
      else if (categoryLower.includes('pron') || categoryLower.includes('代词')) pos = 'pron';
      else if (categoryLower.includes('phrase') || categoryLower.includes('短语')) pos = 'phrase';
      
      // Generate explanation based on POS
      switch (pos) {
        case 'n':
          w.explain = `${article} ${wordLower} is ${definition}.`;
          break;
        case 'v':
          w.explain = `To ${wordLower} means ${definition}.`;
          break;
        case 'adj':
          w.explain = `${cap} means ${definition}.`;
          break;
        case 'adv':
          w.explain = `${cap} means ${definition}.`;
          break;
        case 'prep':
          w.explain = `${cap} is a preposition meaning ${definition}.`;
          break;
        case 'conj':
          w.explain = `${cap} is a conjunction meaning ${definition}.`;
          break;
        case 'pron':
          w.explain = `${cap} is a pronoun meaning ${definition}.`;
          break;
        case 'phrase':
          w.explain = `"${w.word}" is an expression meaning ${definition}.`;
          break;
        default:
          w.explain = `${cap} means ${definition}.`;
      }
      improved++;
    }
  });
  
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  console.log(`${file}: improved ${improved} words`);
  totalImproved += improved;
}

console.log(`\nTotal improved: ${totalImproved} words`);

// Check remaining generic explanations
for (let g = 4; g <= 9; g++) {
  const file = 'grade' + g + '.json';
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  
  data.forEach(w => {
    if (genericPatterns.some(p => w.explain.includes(p))) {
      remainingGeneric++;
    }
  });
}

console.log(`Remaining generic explanations: ${remainingGeneric}`);
console.log(`Percentage remaining: ${(remainingGeneric / 1836 * 100).toFixed(1)}%`);

// Also check for Chinese characters
let chineseCount = 0;
for (let g = 1; g <= 9; g++) {
  const file = 'grade' + g + '.json';
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  
  data.forEach(w => {
    if (/[\u4e00-\u9fff]/.test(w.explain)) {
      chineseCount++;
    }
  });
}

console.log(`Chinese characters in explanations: ${chineseCount}`);