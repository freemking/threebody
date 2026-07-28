const fs = require('fs');

// Read all existing good definitions from grade1-3 (already fixed)
const existingGoodDefs = {};
for (let g = 1; g <= 3; g++) {
  const data = JSON.parse(fs.readFileSync(`grade${g}.json`, 'utf8'));
  data.forEach(w => {
    if (!w.explain.includes('is a noun in English') &&
        !w.explain.includes('is a verb in English') &&
        !w.explain.includes('is an adjective in English') &&
        !w.explain.includes('is an English word')) {
      existingGoodDefs[w.word.toLowerCase()] = w.explain;
    }
  });
}

// Smart generator based on Chinese meaning
function generateExplain(word, meaning, category) {
  const w = word;
  const m = meaning;
  const cat = (category || '').toLowerCase();
  
  // Check if we already have a good definition
  if (existingGoodDefs[w.toLowerCase()]) {
    return existingGoodDefs[w.toLowerCase()];
  }
  
  // Handle phrases
  if (w.includes(' ')) {
    const parts = w.split(' ');
    if (parts[0] === 'play') return `To ${w} means to take part in the sport or game of ${parts.slice(1).join(' ')}.`;
    if (parts[0] === 'have') return `To ${w} means to ${m}.`;
    if (parts[0] === 'be') return `To ${w} means to ${m}.`;
    if (parts[0] === 'make') return `To ${w} means to ${m}.`;
    if (parts[0] === 'get') return `To ${w} means to ${m}.`;
    if (parts[0] === 'turn') return `To ${w} means to ${m}.`;
    if (parts[0] === 'wake') return `To ${w} means to ${m}.`;
    if (parts[0] === 'look') return `To ${w} means to ${m}.`;
    if (parts[0] === 'put') return `To ${w} means to ${m}.`;
    if (parts[0] === 'take') return `To ${w} means to ${m}.`;
    if (parts[0] === 'go') return `To ${w} means to ${m}.`;
    if (parts[0] === 'come') return `To ${w} means to ${m}.`;
    if (parts[0] === 'give') return `To ${w} means to ${m}.`;
    if (parts[0] === 'show') return `To ${w} means to ${m}.`;
    if (parts[0] === 'set') return `To ${w} means to ${m}.`;
    if (parts[0] === 'clean') return `To ${w} means to ${m}.`;
    if (parts[0] === 'tidy') return `To ${w} means to ${m}.`;
    if (parts[0] === 'watch') return `To ${w} means to ${m}.`;
    if (parts[0] === 'brush') return `To ${w} means to ${m}.`;
    if (parts[0] === 'wash') return `To ${w} means to ${m}.`;
    if (parts[0] === 'write') return `To ${w} means to ${m}.`;
    if (parts[0] === 'read') return `To ${w} means to ${m}.`;
    if (parts[0] === 'drive') return `To ${w} means to ${m}.`;
    if (parts[0] === 'try') return `To ${w} means to ${m}.`;
    if (parts[0] === 'throw') return `To ${w} means to ${m}.`;
    if (parts[0] === 'find') return `To ${w} means to ${m}.`;
    if (parts[0] === 'a' || parts[0] === 'an') return `${w} means ${m}.`;
    if (parts[0] === 'the') return `${w} refers to ${m}.`;
    // Default for other phrases
    return `${w} means ${m}.`;
  }
  
  // POS detection
  const isVerb = cat.includes('v') || cat.includes('动作') ||
                 m.startsWith('做') || m.startsWith('使') || m.startsWith('让') ||
                 m.includes('去做') || m.includes('进行');
  const isAdj = cat.includes('adj') || cat.includes('天气') ||
                m.endsWith('的') && !m.includes('人');
  const isAdv = cat.includes('adv') || m.includes('地');
  
  if (isVerb) {
    const cleanMeaning = m.replace(/^(to|去|使|让|进行)/, '').trim();
    return `To ${w} means to ${cleanMeaning}.`;
  } else if (isAdj) {
    const cleanMeaning = m.replace(/的$/, '').trim();
    return `${w.charAt(0).toUpperCase() + w.slice(1)} describes something that is ${cleanMeaning}.`;
  } else if (isAdv) {
    return `${w.charAt(0).toUpperCase() + w.slice(1)} means ${m}, describing how something is done.`;
  } else {
    // Noun or other
    const article = /^[aeiou]/i.test(w) ? 'An' : 'A';
    if (cat.includes('职业') || cat.includes('人')) {
      return `${article} ${w} is a person who ${m}.`;
    } else if (cat.includes('动物')) {
      return `${article} ${w} is an animal that is ${m}.`;
    } else if (cat.includes('食物')) {
      return `${article} ${w} is a food that is ${m}.`;
    } else if (cat.includes('地点')) {
      return `${article} ${w} is a place where you can ${m}.`;
    } else if (cat.includes('身体')) {
      return `${article} ${w} is a part of the body, specifically ${m}.`;
    } else if (cat.includes('节日')) {
      return `${w} is a celebration or festival, meaning ${m}.`;
    } else if (cat.includes('乐器')) {
      return `${article} ${w} is a musical instrument, specifically ${m}.`;
    } else if (cat.includes('服装')) {
      return `${article} ${w} is a piece of clothing, specifically ${m}.`;
    } else if (cat.includes('家具')) {
      return `${article} ${w} is a piece of furniture, specifically ${m}.`;
    } else if (cat.includes('数字')) {
      return `${w} means ${m}.`;
    } else if (cat.includes('天气')) {
      return `${w} describes weather that is ${m}.`;
    } else if (cat.includes('交通')) {
      return `${article} ${w} is related to transportation, specifically ${m}.`;
    } else {
      return `${article} ${w} is ${m}.`;
    }
  }
}

// Process grade 4-9
for (let g = 4; g <= 9; g++) {
  const file = `grade${g}.json`;
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  let updated = 0;
  
  data.forEach(w => {
    if (w.explain.includes('is a noun in English') || 
        w.explain.includes('is a verb in English') ||
        w.explain.includes('is an adjective in English') ||
        w.explain.includes('is an English word')) {
      w.explain = generateExplain(w.word, w.meaning, w.category);
      updated++;
    }
  });
  
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Updated ${file}: ${updated} explanations improved`);
}

console.log('Done!');