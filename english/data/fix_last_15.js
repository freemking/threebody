const fs = require('fs');
const defs = {
  "each other":"used to show that each of two people does something to the other",
  "a lot of":"a large number or amount of something",
  "in front of":"at a position ahead of someone or something",
  "show...around":"to guide someone through a place showing them what is there",
  "next to":"beside or very close to something",
  "far away":"at a great distance",
  "best wishes":"a friendly way of expressing hope for someone's happiness",
  "not...at all":"used to emphasize that something is not true in any way",
  "in the future":"at a time that will come",
  "cave":"a large underground chamber",
  "run away":"to leave quickly by running",
  "of course":"certainly, naturally",
  "for example":"used to introduce an illustration",
  "Japan":"an island country in East Asia",
  "all over the world":"in every country, everywhere globally"
};
const genericPatterns = ['is a common English word','is a common English phrase','is an adjective describing','is a noun referring','is an adverb describing','is the past tense','is the present participle','is an English expression','is a verb meaning','is a preposition meaning','is a conjunction meaning'];
const templatePattern = /is a (noun|verb|adjective|adverb) in English/;
let totalImproved = 0;
for (let g = 1; g <= 9; g++) {
  const file = 'grade' + g + '.json';
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  let improved = 0;
  data.forEach(w => {
    const isGeneric = genericPatterns.some(p => w.explain.includes(p)) || templatePattern.test(w.explain);
    if (!isGeneric) return;
    // Try multiple matching strategies
    const wordLower = w.word.toLowerCase();
    const def = defs[wordLower] || defs[w.word] || defs[w.word.toLowerCase()] || defs[w.word.charAt(0).toUpperCase() + w.word.slice(1)];
    if (!def) return;
    const cap = w.word.charAt(0).toUpperCase() + w.word.slice(1);
    const article = /^[aeiou]/i.test(wordLower) ? 'An' : 'A';
    let pos = 'phrase';
    const cat = w.category.toLowerCase();
    if (cat.includes('prep') || cat.includes('介词')) pos = 'prep';
    else if (cat.includes('adv') || cat.includes('副词')) pos = 'adv';
    else if (cat.includes('n') || cat.includes('名词')) pos = 'n';
    switch(pos) {
      case 'prep': w.explain = `${cap} is used to mean ${def}.`; break;
      case 'adv': w.explain = `${cap} means ${def}.`; break;
      case 'n': w.explain = `${cap} is ${def}.`; break;
      default: w.explain = `"${w.word}" means ${def}.`;
    }
    improved++;
  });
  if (improved > 0) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    console.log(`${file}: improved ${improved} words`);
  }
  totalImproved += improved;
}
console.log(`\nTotal improved: ${totalImproved}`);
// Check remaining
let remaining = 0;
for (let g = 1; g <= 9; g++) {
  const data = JSON.parse(fs.readFileSync('grade' + g + '.json', 'utf8'));
  data.forEach(w => {
    if (genericPatterns.some(p => w.explain.includes(p)) || templatePattern.test(w.explain)) remaining++;
  });
}
console.log(`Remaining generic/template: ${remaining}`);
