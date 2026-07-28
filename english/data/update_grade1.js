const fs = require('fs');

// Grade 1 specific definitions for words that need improvement
const grade1Defs = {
  "rubber": "a small piece of rubber used to remove pencil marks from paper",
  "draw": "to make a picture using a pencil, pen, or crayons",
  "grandmother": "the mother of your father or mother",
  "grandfather": "the father of your father or mother",
  "me": "the person who is speaking (the first person pronoun)",
  "fat": "having too much body weight",
  "thin": "having very little body weight",
  "pear": "a sweet yellow or green fruit with a round bottom and narrow top",
  "peach": "a soft round fruit with sweet yellow or red flesh",
  "hamburger": "a round flat piece of minced beef cooked and eaten in a bread roll",
  "pizza": "a flat round bread topped with tomatoes, cheese, and other foods",
  "pie": "a baked food with a filling covered by pastry",
  "chick": "a young bird, especially a young chicken",
  "panda": "a large black and white animal from China that looks like a bear",
  "bee": "a black and yellow flying insect that makes honey",
  "sheep": "a farm animal with thick wool that gives us meat and wool",
  "hen": "a female chicken",
  "soup": "a hot liquid food made by boiling meat, vegetables, or fish in water",
  "noodles": "long thin strips of pasta cooked in boiling water",
  "ball": "a round object used for throwing, hitting, or kicking in games",
  "doll": "a toy that looks like a small person or baby",
  "kite": "a toy made of light material flown in the wind at the end of a string",
  "jelly": "a soft sweet food made from fruit juice and sugar",
  "ice cream": "a sweet frozen food made from milk and cream",
  "sweet": "a small piece of candy or chocolate",
  "biscuit": "a small flat dry cake that is sweet or savory",
  "cola": "a sweet brown fizzy drink",
  "warm": "having a pleasant temperature, not too hot or too cold",
  "sunny": "having a lot of sunshine",
  "cloudy": "covered with clouds",
  "rainy": "having a lot of rain",
  "windy": "having a lot of wind",
  "T-shirt": "a short-sleeved casual top made of cotton",
  "dress": "a piece of clothing for women or girls that covers the top of the body and skirts",
  "shorts": "short trousers that end above the knee",
  "blouse": "a shirt for women, usually with a collar and buttons",
  "ride": "to sit on and control an animal or vehicle",
  "skip": "to move forward by jumping on one foot then the other",
  "fly": "to move through the air using wings",
  "gift": "something you give to someone, especially on a special occasion",
  "card": "a flat piece of thick paper used for writing messages",
  "firecracker": "a small explosive device that makes a loud noise when lit",
  "firework": "a device that explodes in the air to make colorful lights and patterns",
  "wolf": "a wild animal that looks like a large dog and hunts in groups"
};

// Read grade1.json
const data = JSON.parse(fs.readFileSync('grade1.json', 'utf8'));

// Update explain fields
data.forEach(word => {
  const wordLower = word.word.toLowerCase();
  const def = grade1Defs[wordLower] || grade1Defs[word.word];
  
  if (def) {
    // Check if current explain is a template explanation
    if (word.explain.includes('is a noun in English') || 
        word.explain.includes('is a verb in English') ||
        word.explain.includes('is an adjective in English') ||
        word.explain.includes('is an English word')) {
      
      // Determine part of speech based on category and word
      const category = word.category || '';
      const isVerb = word.word === 'draw' || word.word === 'ride' || 
                     word.word === 'skip' || word.word === 'fly';
      const isAdjective = word.word === 'fat' || word.word === 'thin' || 
                         word.word === 'warm' || word.word === 'sunny' ||
                         word.word === 'cloudy' || word.word === 'rainy' || 
                         word.word === 'windy';
      
      if (isVerb) {
        word.explain = `To ${word.word.toLowerCase()} means to ${def}.`;
      } else if (isAdjective) {
        word.explain = `${word.word.charAt(0).toUpperCase() + word.word.slice(1)} means ${def}.`;
      } else {
        // For nouns and others
        const article = /^[aeiou]/i.test(word.word.toLowerCase()) ? 'An' : 'A';
        word.explain = `${article} ${word.word.toLowerCase()} is ${def}.`;
      }
    }
  }
});

// Write updated file
fs.writeFileSync('grade1.json', JSON.stringify(data, null, 2), 'utf8');

console.log('Updated grade1.json with improved explanations');
console.log(`Processed ${data.length} words`);