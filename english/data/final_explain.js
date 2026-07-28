const fs = require('fs');
const path = require('path');

// POS detection
function detectPOS(category) {
  const c = category.toLowerCase().replace(/\./g, '').trim();
  if (/^(adj|adj & pron|det & adj)$/.test(c)) return 'adj';
  if (/^(n|n & v|det & pron)$/.test(c)) return 'n';
  if (/^(v|v & n|v\/n|modal v)$/.test(c)) return 'v';
  if (/^adv$/.test(c)) return 'adv';
  if (/^prep$/.test(c)) return 'prep';
  if (/^conj$/.test(c)) return 'conj';
  if (/^pron$/.test(c)) return 'pron';
  if (/^phrase$/.test(c)) return 'phrase';
  if (/^abbr$/.test(c)) return 'abbr';
  if (/^det$/.test(c)) return 'det';
  const cnMap = {
    '动作':'v','数字':'n','时间':'n','学习用品':'n','身体部位':'n',
    '家庭':'n','食物':'n','动物':'n','颜色':'adj','玩具':'n','饮料':'n',
    '天气':'n','季节':'n','服装':'n','职业':'n','家具':'n','交通':'n',
    '地点':'n','学科':'n','节日':'n','乐器':'n','其他':'n',
  };
  return cnMap[category] || 'n';
}

function generateExplain(word, meaning, category, difficulty, example) {
  const pos = detectPOS(category);
  const w = word.toLowerCase();
  const cap = word.charAt(0).toUpperCase() + word.slice(1);
  const article = /^[aeiou]/i.test(w) ? 'An' : 'A';
  const ex = example ? ` Example: ${example}` : '';
  
  // Use example to create a meaningful explanation with the Chinese meaning
  switch (pos) {
    case 'n':
      if (difficulty <= 3) {
        return `${article} ${w} is something called "${meaning}" in Chinese.${ex}`;
      } else {
        return `${cap} is a noun meaning "${meaning}"${ex}`;
      }
    case 'v':
      return `To ${w} means "${meaning}"${ex}`;
    case 'adj':
      return `${cap} is an adjective meaning "${meaning}"${ex}`;
    case 'adv':
      return `${cap} is an adverb meaning "${meaning}"${ex}`;
    case 'phrase':
      return `"${word}" is an expression meaning "${meaning}"${ex}`;
    case 'prep':
      return `${cap} is a preposition meaning "${meaning}"${ex}`;
    case 'conj':
      return `${cap} is a conjunction meaning "${meaning}"${ex}`;
    case 'pron':
      return `${cap} is a pronoun meaning "${meaning}"${ex}`;
    default:
      return `${cap} means "${meaning}"${ex}`;
  }
}

// Process files
const dataDir = __dirname;
const files = fs.readdirSync(dataDir).filter(f => f.match(/^grade\d+\.json$/)).sort();

console.log('=== Generating English explanations ===\n');
let total = 0;

files.forEach(f => {
  const fp = path.join(dataDir, f);
  const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
  
  data.forEach(w => {
    w.explain = generateExplain(w.word, w.meaning, w.category, w.difficulty, w.example || '');
    total++;
  });
  
  fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
  console.log(`${f}: ${data.length} words processed`);
});

console.log(`\nTotal: ${total} words processed`);
console.log('Done!');