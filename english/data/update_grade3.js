const fs = require('fs');

// Grade 3 specific definitions for words that need improvement
const grade3Defs = {
  "Miss": "a title used before a girl's or unmarried woman's name",
  "Mr": "a title used before a man's name",
  "Mrs": "a title used before a married woman's name",
  "fat": "having too much body weight",
  "thin": "having very little body weight",
  "grandfather": "the father of your father or mother",
  "grandmother": "the mother of your father or mother",
  "me": "the person who is speaking (the first person pronoun)",
  "hair": "the thin threads that grow on your head and body",
  "toilet": "a bowl for sitting on when you go to the bathroom",
  "hall": "a large room or building for meetings or events",
  "classroom": "a room where students have lessons",
  "an apple": "a round fruit with red, yellow, or green skin",
  "an orange": "a round citrus fruit with thick orange skin",
  "a banana": "a long curved fruit with yellow skin",
  "a peach": "a soft round fruit with sweet yellow or red flesh",
  "apples": "plural of apple",
  "oranges": "plural of orange",
  "bananas": "plural of banana",
  "peaches": "plural of peach",
  "balloon": "a thin rubber bag that you fill with air or gas",
  "kite": "a toy made of light material flown in the wind at the end of a string",
  "ladybird": "a small red insect with black spots",
  "bee": "a black and yellow flying insect that makes honey",
  "butterfly": "a flying insect with large colorful wings",
  "ant": "a small insect that lives in large groups",
  "chick": "a young bird, especially a young chicken",
  "hen": "a female chicken",
  "leaves": "the flat green parts of a plant or tree",
  "branch": "a part of a tree that grows out from the trunk",
  "trunk": "the thick main stem of a tree",
  "roots": "the part of a plant that grows underground",
  "aeroplane": "a vehicle that flies in the air with wings and engines",
  "ship": "a large boat that travels on the sea",
  "pineapple": "a large tropical fruit with sweet yellow flesh",
  "glass": "a transparent material used for windows and drinking vessels",
  "sweet": "a small piece of candy or chocolate",
  "lemon": "a yellow citrus fruit with a sour taste",
  "sour": "having a sharp taste like a lemon",
  "salt": "a white substance used to flavor food",
  "salty": "containing or tasting of salt",
  "coffee": "a hot drink made from roasted coffee beans",
  "bitter": "having a sharp unpleasant taste",
  "panda": "a large black and white animal from China that looks like a bear",
  "toy train": "a small train used as a toy for children",
  "doll": "a toy that looks like a small person or baby",
  "skateboard": "a short board with wheels for riding on",
  "robot": "a machine that can do work automatically",
  "scarf": "a piece of cloth worn around the neck for warmth",
  "jacket": "a short coat for the upper body",
  "a pair of gloves": "two matching gloves for both hands",
  "a pair of socks": "two matching socks for both feet",
  "a pair of shoes": "two matching shoes for both feet",
  "circle": "a perfectly round shape",
  "square": "a shape with four equal sides and four right angles",
  "triangle": "a shape with three sides and three angles",
  "rectangle": "a shape with four sides and four right angles",
  "sea": "a large area of salt water",
  "mountain": "a very high area of land",
  "river": "a long natural stream of water",
  "plant": "a living thing that grows in the ground and has leaves and roots",
  "picnic": "a meal eaten outdoors",
  "ice-skate": "to move on ice wearing special boots with blades",
  "ski": "to move on snow wearing long flat pieces on your feet",
  "finger": "one of the five parts at the end of your hand",
  "knee": "the joint in the middle of your leg",
  "shoulder": "the part of your body between your neck and arm",
  "cinema": "a place where you go to watch films",
  "zoo": "a place where wild animals are kept for people to see"
};

// Read grade3.json
const data = JSON.parse(fs.readFileSync('grade3.json', 'utf8'));

// Update explain fields
data.forEach(word => {
  const wordLower = word.word.toLowerCase();
  const def = grade3Defs[wordLower] || grade3Defs[word.word];
  
  if (def) {
    // Check if current explain is a template explanation
    if (word.explain.includes('is a noun in English') || 
        word.explain.includes('is a verb in English') ||
        word.explain.includes('is an adjective in English') ||
        word.explain.includes('is an English word')) {
      
      // Determine part of speech based on category and word
      const category = word.category || '';
      const isVerb = ['aeroplane', 'ice-skate', 'ski'].includes(word.word.toLowerCase());
      const isAdjective = ['fat', 'thin', 'sour', 'salty', 'bitter'].includes(word.word.toLowerCase());
      const isPlural = word.word.endsWith('s') && !['Miss', 'Mr', 'Mrs'].includes(word.word);
      
      if (isVerb) {
        word.explain = `To ${word.word.toLowerCase()} means to ${def}.`;
      } else if (isAdjective) {
        word.explain = `${word.word.charAt(0).toUpperCase() + word.word.slice(1)} means ${def}.`;
      } else if (isPlural) {
        word.explain = `${word.word} are ${def}.`;
      } else {
        // For nouns and others
        const article = /^[aeiou]/i.test(word.word.toLowerCase()) ? 'An' : 'A';
        if (word.word.startsWith('a ') || word.word.startsWith('an ') || word.word.startsWith('a pair')) {
          word.explain = `${word.word.charAt(0).toUpperCase() + word.word.slice(1)} is ${def}.`;
        } else {
          word.explain = `${article} ${word.word.toLowerCase()} is ${def}.`;
        }
      }
    }
  }
});

// Write updated file
fs.writeFileSync('grade3.json', JSON.stringify(data, null, 2), 'utf8');

console.log('Updated grade3.json with improved explanations');
console.log(`Processed ${data.length} words`);