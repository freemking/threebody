const fs = require('fs');
const path = require('path');

// Read generate_explain_v4.js to extract defs object
const v4Path = path.join(__dirname, 'generate_explain_v4.js');
const v4Content = fs.readFileSync(v4Path, 'utf8');

// Simple extraction of defs object (it's a large object literal)
const defsMatch = v4Content.match(/const defs = \{([\s\S]*?)\};/);
if (!defsMatch) {
  console.log('Could not find defs object');
  process.exit(1);
}

// Parse the defs object (it's a JS object, not JSON)
const defsStr = '{' + defsMatch[1] + '}';
// Convert to valid JSON by adding quotes around keys
const defsJson = defsStr.replace(/(\w+):/g, '"$1":').replace(/'/g, '"');
let defs;
try {
  defs = JSON.parse(defsJson);
} catch (e) {
  console.log('Error parsing defs:', e.message);
  // Fallback: count lines that look like "word":"definition"
  const lines = defsMatch[1].split('\n').filter(line => line.match(/^\s*"?\w+"?\s*:/));
  console.log('Approximate word count from pattern matching:', lines.length);
  process.exit(1);
}

const defWords = Object.keys(defs);
console.log('Words in defs object:', defWords.length);

// Read all grade JSON files
const dataDir = __dirname;
const files = fs.readdirSync(dataDir).filter(f => f.match(/^grade\d+\.json$/)).sort();

let totalWords = 0;
let wordsWithDefs = 0;
let wordsWithoutDefs = [];
let templateExplanations = 0;

files.forEach(f => {
  const fp = path.join(dataDir, f);
  const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
  
  data.forEach(w => {
    totalWords++;
    const wordLower = w.word.toLowerCase();
    if (defs[wordLower]) {
      wordsWithDefs++;
    } else {
      wordsWithoutDefs.push({ word: w.word, file: f, category: w.category, meaning: w.meaning });
    }
    
    // Check for template explanations
    if (w.explain && (
      w.explain.includes('is a noun in English') ||
      w.explain.includes('is a verb in English') ||
      w.explain.includes('is an adjective in English') ||
      w.explain.includes('is an adverb in English') ||
      w.explain.includes('is an English word') ||
      w.explain.includes('is an English expression')
    )) {
      templateExplanations++;
    }
  });
});

console.log('\n=== Summary ===');
console.log('Total words in all grades:', totalWords);
console.log('Words with definitions in defs:', wordsWithDefs);
console.log('Words without definitions:', wordsWithoutDefs.length);
console.log('Coverage:', (wordsWithDefs / totalWords * 100).toFixed(1) + '%');
console.log('Template explanations (current):', templateExplanations);

// Show sample of words without definitions
console.log('\n=== Sample words without definitions (first 20) ===');
wordsWithoutDefs.slice(0, 20).forEach(item => {
  console.log(`${item.word} (${item.file}): ${item.meaning}`);
});

// Save full list to file
fs.writeFileSync(path.join(__dirname, 'words_without_defs.json'), JSON.stringify(wordsWithoutDefs, null, 2));
console.log(`\nFull list saved to words_without_defs.json (${wordsWithoutDefs.length} words)`);