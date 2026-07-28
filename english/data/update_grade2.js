const fs = require('fs');

// Grade 2 specific definitions for words that need improvement
const grade2Defs = {
  "swim": "to move through water using your arms and legs",
  "fly": "to move through the air using wings",
  "young": "having lived for only a short time",
  "hair": "the thin threads that grow on your head and body",
  "slide": "a smooth surface for sliding down, often in a playground",
  "swing": "a seat hanging from ropes or chains for swinging on",
  "seesaw": "a long board balanced in the middle for two people to sit on and move up and down",
  "box": "a container with four straight sides and a lid",
  "bowl": "a round container for holding food or liquid",
  "plate": "a flat dish for serving food",
  "spoon": "a tool with a round end for eating or stirring food",
  "chopsticks": "two thin sticks used for eating food, especially in Asian countries",
  "fox": "a wild animal with a bushy tail that looks like a small dog",
  "hippo": "a large African animal with a big mouth that lives near water",
  "meat": "the flesh of animals used as food",
  "purple": "a color that is a mix of red and blue",
  "pink": "a pale red color",
  "brown": "a dark color like chocolate or earth",
  "watch": "a small clock worn on your wrist",
  "soft": "easy to press or bend, not hard",
  "hard": "firm and difficult to press or bend",
  "rough": "not smooth, with an uneven surface",
  "smooth": "having an even surface without bumps",
  "van": "a large vehicle for carrying goods or people",
  "ship": "a large boat that travels on the sea",
  "skate": "to move on ice or smooth surfaces wearing special shoes",
  "hop": "to jump on one foot",
  "skip": "to move forward by jumping on one foot then the other",
  "ride a bicycle": "to sit on and control a bicycle",
  "salad": "a cold dish of raw vegetables",
  "carrot": "a long orange vegetable that grows underground",
  "giraffe": "a very tall African animal with a long neck and legs",
  "zebra": "a wild African animal like a horse with black and white stripes",
  "cool": "slightly cold, pleasantly cool",
  "trousers": "a piece of clothing covering the body from the waist to the ankles",
  "sweater": "a warm knitted piece of clothing covering the upper body",
  "shirt": "a piece of clothing for the upper body with a collar and buttons",
  "coat": "a long piece of clothing worn over other clothes for warmth",
  "play football": "to kick a ball and try to score goals",
  "play basketball": "to throw a ball through a hoop",
  "play ping-pong": "to hit a small ball over a net with paddles",
  "play cards": "to play games using a deck of cards",
  "letter": "a written message sent to someone",
  "balloon": "a thin rubber bag that you fill with air or gas",
  "carnation": "a flower with a sweet smell, often given as a gift",
  "hungry": "feeling that you want to eat food",
  "thirsty": "feeling that you want to drink something"
};

// Read grade2.json
const data = JSON.parse(fs.readFileSync('grade2.json', 'utf8'));

// Update explain fields
data.forEach(word => {
  const wordLower = word.word.toLowerCase();
  const def = grade2Defs[wordLower] || grade2Defs[word.word];
  
  if (def) {
    // Check if current explain is a template explanation
    if (word.explain.includes('is a noun in English') || 
        word.explain.includes('is a verb in English') ||
        word.explain.includes('is an adjective in English') ||
        word.explain.includes('is an English word')) {
      
      // Determine part of speech based on category and word
      const category = word.category || '';
      const isVerb = ['swim', 'fly', 'slide', 'swing', 'seesaw', 'skate', 'hop', 'skip'].includes(word.word.toLowerCase());
      const isAdjective = ['young', 'purple', 'pink', 'brown', 'soft', 'hard', 'rough', 'smooth', 'cool', 'hungry', 'thirsty'].includes(word.word.toLowerCase());
      const isActivity = word.word.startsWith('play ') || word.word.startsWith('ride ');
      
      if (isVerb) {
        word.explain = `To ${word.word.toLowerCase()} means to ${def}.`;
      } else if (isAdjective) {
        word.explain = `${word.word.charAt(0).toUpperCase() + word.word.slice(1)} means ${def}.`;
      } else if (isActivity) {
        word.explain = `To ${word.word.toLowerCase()} means to ${def}.`;
      } else {
        // For nouns and others
        const article = /^[aeiou]/i.test(word.word.toLowerCase()) ? 'An' : 'A';
        word.explain = `${article} ${word.word.toLowerCase()} is ${def}.`;
      }
    }
  }
});

// Write updated file
fs.writeFileSync('grade2.json', JSON.stringify(data, null, 2), 'utf8');

console.log('Updated grade2.json with improved explanations');
console.log(`Processed ${data.length} words`);