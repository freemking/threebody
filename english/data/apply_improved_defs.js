const fs = require('fs');

// Load definitions from the fixed file
const fixedContent = fs.readFileSync('generate_explain_v4_fixed.js', 'utf8');
const defsMatch = fixedContent.match(/const defs = \{([\s\S]*?)\};/);
if (!defsMatch) {
  console.error('Could not find defs in fixed file');
  process.exit(1);
}

// Parse the defs object
const defsStr = defsMatch[1];
const defs = {};
const lines = defsStr.split('\n');
for (const line of lines) {
  const match = line.match(/^\s*"([^"]+)":\s*"([^"]+)"/);
  if (match) {
    defs[match[1]] = match[2];
  }
}

console.log(`Loaded ${Object.keys(defs).length} definitions`);

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

let totalImproved = 0;

for (let g = 4; g <= 9; g++) {
  const file = 'grade' + g + '.json';
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  let improved = 0;
  
  data.forEach(w => {
    const wordLower = w.word.toLowerCase();
    
    // Only process words with generic explanations
    if (genericPatterns.some(p => w.explain.includes(p))) {
      // Check if we have a definition
      const def = defs[wordLower] || defs[w.word];
      if (def) {
        // Generate proper explanation
        const cap = w.word.charAt(0).toUpperCase() + w.word.slice(1);
        const article = /^[aeiou]/i.test(wordLower) ? 'An' : 'A';
        
        // Determine POS from category
        let pos = 'n';
        const category = w.category.toLowerCase();
        if (category.includes('adj') || category.includes('形容词')) pos = 'adj';
        else if (category.includes('v') || category.includes('动词')) pos = 'v';
        else if (category.includes('adv') || category.includes('副词')) pos = 'adv';
        else if (category.includes('prep') || category.includes('介词')) pos = 'prep';
        else if (category.includes('conj') || category.includes('连词')) pos = 'conj';
        else if (category.includes('pron') || category.includes('代词')) pos = 'pron';
        else if (category.includes('phrase') || category.includes('短语')) pos = 'phrase';
        
        // Generate explanation based on POS
        switch (pos) {
          case 'n':
            w.explain = `${article} ${wordLower} is ${def}.`;
            break;
          case 'v':
            w.explain = `To ${wordLower} means to ${def}.`;
            break;
          case 'adj':
            w.explain = `${cap} means ${def}.`;
            break;
          case 'adv':
            w.explain = `${cap} means ${def}.`;
            break;
          case 'prep':
            w.explain = `${cap} is a preposition meaning ${def}.`;
            break;
          case 'conj':
            w.explain = `${cap} is a conjunction meaning ${def}.`;
            break;
          case 'pron':
            w.explain = `${cap} is a pronoun meaning ${def}.`;
            break;
          case 'phrase':
            w.explain = `"${w.word}" is an expression meaning ${def}.`;
            break;
          default:
            w.explain = `${cap} means ${def}.`;
        }
        improved++;
      }
    }
  });
  
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  console.log(`${file}: improved ${improved} words`);
  totalImproved += improved;
}

console.log(`\nTotal improved: ${totalImproved} words`);

// Check remaining generic explanations
let remainingGeneric = 0;
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