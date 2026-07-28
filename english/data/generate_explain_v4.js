const fs = require('fs');
const path = require('path');

// Core definitions for grade 1-3 words (the most basic ones)
const defs = {
  "morning":"the early part of the day before noon",
  "afternoon":"the time between noon and evening",
  "evening":"the time when the sun goes down",
  "night":"the time when it is dark",
  "book":"a set of printed pages bound together for reading",
  "pen":"a tool for writing with ink",
  "pencil":"a writing tool with a graphite core",
  "ruler":"a straight tool for measuring or drawing lines",
  "eraser":"a small piece of rubber used to remove marks",
  "bag":"a container for carrying things",
  "desk":"a piece of furniture with a flat top for working",
  "chair":"a piece of furniture for sitting on",
  "school":"a place where students go to learn",
  "teacher":"a person who teaches students",
  "student":"a person who is learning at school",
  "friend":"a person you like and enjoy spending time with",
  "family":"a group of related people living together",
  "father":"a male parent",
  "mother":"a female parent",
  "brother":"a boy with the same parents as you",
  "sister":"a girl with the same parents as you",
  "child":"a young person",
  "boy":"a male child",
  "girl":"a female child",
  "baby":"a very young child",
  "man":"an adult male",
  "woman":"an adult female",
  "people":"persons in general",
  "person":"a human being",
  "head":"the top part of the body with the brain and face",
  "face":"the front part of the head",
  "eye":"an organ used for seeing",
  "ear":"an organ used for hearing",
  "nose":"the part of the face for smelling and breathing",
  "mouth":"the opening in the face for eating and speaking",
  "hand":"the part at the end of the arm with fingers",
  "foot":"the part at the end of the leg for standing",
  "leg":"the body part used for walking",
  "arm":"the body part from shoulder to hand",
  "body":"the physical structure of a person",
  "dog":"a common pet animal",
  "cat":"a small furry pet animal",
  "bird":"an animal with wings that can fly",
  "fish":"an animal that lives in water",
  "horse":"a large animal people ride on",
  "cow":"a large farm animal kept for milk",
  "pig":"a pink farm animal",
  "chicken":"a farm bird kept for eggs",
  "duck":"a water bird with a flat bill",
  "rabbit":"a small animal with long ears",
  "monkey":"an animal that climbs trees",
  "tiger":"a large wild cat with stripes",
  "lion":"a large wild cat with a mane",
  "elephant":"a very large gray animal with a trunk",
  "bear":"a large heavy animal with thick fur",
  "snake":"a long thin animal with no legs",
  "frog":"a small green animal that jumps",
  "apple":"a round fruit, usually red or green",
  "banana":"a long curved yellow fruit",
  "orange":"a round citrus fruit with sweet juice",
  "grape":"a small round fruit growing in bunches",
  "watermelon":"a large fruit with green skin and red flesh",
  "rice":"grains that are cooked and eaten",
  "bread":"a food made from flour and baked",
  "egg":"an oval object laid by a chicken",
  "milk":"a white liquid from mammals",
  "water":"a clear liquid essential for life",
  "tea":"a hot drink made from dried leaves",
  "juice":"a drink made from fruit liquid",
  "cake":"a sweet baked food",
  "candy":"a sweet food made from sugar",
  "car":"a road vehicle with four wheels",
  "bus":"a large vehicle carrying passengers",
  "train":"vehicles connected and running on rails",
  "airplane":"a vehicle with wings that flies",
  "bicycle":"a two-wheeled vehicle you pedal",
  "boat":"a small vehicle for traveling on water",
  "house":"a building where people live",
  "room":"a part of a building separated by walls",
  "door":"a movable barrier for entering or leaving",
  "window":"an opening in a wall for light and air",
  "table":"a piece of furniture with a flat top",
  "bed":"a piece of furniture for sleeping",
  "red":"the color of blood",
  "blue":"the color of the sky",
  "green":"the color of grass",
  "yellow":"the color of the sun",
  "white":"the color of snow",
  "black":"the color of coal",
  "sun":"the star that gives us light and heat",
  "moon":"the object that moves around the earth",
  "star":"a bright point of light in the sky",
  "sky":"the area above the earth",
  "tree":"a tall plant with a trunk and branches",
  "flower":"the colorful part of a plant",
  "grass":"a common plant with thin green leaves",
  "spring":"the season after winter",
  "summer":"the warmest season",
  "autumn":"the season when leaves fall",
  "winter":"the coldest season",
  "rain":"water falling from clouds",
  "snow":"frozen water falling from clouds",
  "wind":"moving air",
  "hot":"having a high temperature",
  "cold":"having a low temperature",
  "big":"large in size",
  "small":"little in size",
  "good":"of high quality",
  "bad":"of low quality",
  "happy":"feeling pleasure",
  "sad":"feeling sorrow",
  "fast":"moving quickly",
  "slow":"moving at low speed",
  "new":"recently made",
  "old":"having existed for a long time",
  "long":"measuring a great distance",
  "short":"measuring a small distance",
  "tall":"having great height",
  "run":"to move quickly on foot",
  "walk":"to move on foot at a regular speed",
  "jump":"to push yourself up into the air",
  "sit":"to rest with your weight on your bottom",
  "stand":"to be in an upright position",
  "sleep":"to rest with eyes closed",
  "eat":"to put food in your mouth and swallow",
  "drink":"to take liquid into your mouth",
  "see":"to notice with your eyes",
  "hear":"to notice sounds with your ears",
  "speak":"to say words or talk",
  "read":"to look at and understand written words",
  "write":"to form letters on a surface",
  "sing":"to make music with your voice",
  "play":"to do something for fun",
  "help":"to make something easier for someone",
  "give":"to hand something to someone",
  "take":"to get or receive something",
  "buy":"to get something by paying money",
  "like":"to find enjoyable",
  "want":"to desire something",
  "need":"to require something",
  "know":"to be aware of something",
  "think":"to use your mind",
  "go":"to move or travel somewhere",
  "come":"to move toward someone",
  "make":"to create or produce something",
  "put":"to place something somewhere",
  "get":"to obtain or receive",
  "find":"to discover something",
  "tell":"to give information to someone",
  "ask":"to request information",
  "work":"to do a job or task",
  "learn":"to gain knowledge",
  "teach":"to give instruction",
  "try":"to make an effort",
  "open":"to make no longer closed",
  "close":"to make no longer open",
  "start":"to begin",
  "stop":"to cease",
  "turn":"to move around",
  "show":"to let someone see",
  "call":"to phone or shout to",
  "carry":"to hold and take somewhere",
  "bring":"to take something to a place",
  "wait":"to stay until something happens",
  "look":"to direct your eyes toward",
  "use":"to do something with",
  "time":"the ongoing sequence of events",
  "day":"a period of 24 hours",
  "week":"a period of seven days",
  "month":"one of twelve parts of a year",
  "year":"a period of 365 days",
  "today":"this present day",
  "tomorrow":"the day after today",
  "yesterday":"the day before today",
  "homework":"schoolwork done at home",
  "exam":"a formal test of knowledge",
  "question":"something you ask",
  "answer":"a response to a question",
  "story":"an account of events",
  "game":"an activity done for fun",
  "music":"pleasant arranged sounds",
  "song":"a piece of music with words",
  "dance":"moving the body to music",
  "sport":"a physical activity or competition",
  "food":"things people eat",
  "drink":"a liquid for swallowing",
  "clothes":"things people wear",
  "hat":"a covering for the head",
  "shoes":"coverings for the feet",
  "street":"a public road in a town",
  "park":"a public area of grass and trees",
  "shop":"a place where goods are sold",
  "city":"a large town",
  "country":"a nation with its own government",
  "world":"the earth and everything on it",
  "number":"a word for counting",
  "one":"the number 1",
  "two":"the number 2",
  "three":"the number 3",
  "four":"the number 4",
  "five":"the number 5",
  "six":"the number 6",
  "seven":"the number 7",
  "eight":"the number 8",
  "nine":"the number 9",
  "ten":"the number 10",
  // Grade 4-6 common words
  "eleven":"the number 11",
  "twelve":"the number 12",
  "thirteen":"the number 13",
  "fourteen":"the number 14",
  "fifteen":"the number 15",
  "sixteen":"the number 16",
  "seventeen":"the number 17",
  "eighteen":"the number 18",
  "nineteen":"the number 19",
  "twenty":"the number 20",
  "thirty":"the number 30",
  "forty":"the number 40",
  "fifty":"the number 50",
  "sixty":"the number 60",
  "seventy":"the number 70",
  "eighty":"the number 80",
  "ninety":"the number 90",
  "hundred":"the number 100",
  "thousand":"the number 1,000",
  "million":"the number 1,000,000",
  "first":"coming before all others",
  "second":"coming after the first",
  "third":"coming after the second",
  "fourth":"coming after the third",
  "fifth":"coming after the fourth",
  "Monday":"the first day of the week",
  "Tuesday":"the second day of the week",
  "Wednesday":"the third day of the week",
  "Thursday":"the fourth day of the week",
  "Friday":"the fifth day of the week",
  "Saturday":"the sixth day of the week",
  "Sunday":"the seventh day of the week",
  "January":"the first month of the year",
  "February":"the second month of the year",
  "March":"the third month of the year",
  "April":"the fourth month of the year",
  "May":"the fifth month of the year",
  "June":"the sixth month of the year",
  "July":"the seventh month of the year",
  "August":"the eighth month of the year",
  "September":"the ninth month of the year",
  "October":"the tenth month of the year",
  "November":"the eleventh month of the year",
  "December":"the twelfth month of the year",
  "birthday":"the anniversary of the day someone was born",
  "Christmas":"a holiday on December 25th",
  "Halloween":"a holiday on October 31st",
  "Thanksgiving":"a holiday for giving thanks",
  "vacation":"a period of time for rest and travel",
  "homework":"schoolwork done at home",
  "test":"an examination of knowledge or ability",
  "exam":"a formal test of knowledge",
  "lesson":"a period of learning",
  "subject":"an area of knowledge studied in school",
  "Chinese":"the language spoken in China",
  "English":"the language spoken in England and America",
  "math":"the study of numbers and shapes",
  "science":"the study of the natural world",
  "history":"the study of past events",
  "geography":"the study of the earth's surface",
  "art":"the creation of beautiful things",
  "PE":"physical exercise and sports",
  "gym":"a place for physical exercise",
  "library":"a building where books are kept",
  "playground":"an outdoor area for children to play",
  "canteen":"a place where meals are served",
  "office":"a room where people work",
  "lab":"a room for scientific experiments",
  "grade":"a level of quality or rank",
  "class":"a group of students taught together",
  "row":"a line of people or things",
  "team":"a group of people working together",
  "group":"a number of people or things together",
  "pair":"two things that go together",
  "couple":"two people in a relationship",
  "crowd":"a large group of people",
  "neighbor":"a person who lives near you",
  "stranger":"a person you do not know",
  "guest":"a person who visits someone",
  "host":"a person who receives guests",
  "king":"a male ruler of a country",
  "queen":"a female ruler of a country",
  "prince":"the son of a king or queen",
  "princess":"the daughter of a king or queen",
  "president":"the leader of a country",
  "hero":"a person admired for bravery",
  "villain":"a character who does bad things",
  "character":"a person in a story or play",
  "actor":"a person who acts in plays or movies",
  "actress":"a female actor",
  "singer":"a person who sings",
  "dancer":"a person who dances",
  "painter":"a person who paints pictures",
  "writer":"a person who writes books",
  "poet":"a person who writes poems",
  "scientist":"a person who studies science",
  "inventor":"a person who creates new things",
  "explorer":"a person who travels to new places",
  "adventurer":"a person who has exciting experiences",
  "athlete":"a person who is good at sports",
  "champion":"the winner of a competition",
  "captain":"the leader of a team or ship",
  "soldier":"a person who serves in the army",
  "officer":"a person in a position of authority",
  "guard":"a person who protects something",
  "detective":"a person who investigates crimes",
  "pilot":"a person who flies an airplane",
  "driver":"a person who drives a vehicle",
  "farmer":"a person who works on a farm",
  "fisherman":"a person who catches fish",
  "hunter":"a person who catches animals",
  "cook":"a person who prepares food",
  "baker":"a person who makes bread and cakes",
  "waiter":"a person who serves food in a restaurant",
  "nurse":"a person who cares for sick people",
  "dentist":"a person who treats teeth",
  "vet":"a person who treats sick animals",
  "engineer":"a person who designs and builds things",
  "architect":"a person who designs buildings",
  "lawyer":"a person who practices law",
  "judge":"a person who makes decisions in court",
  "reporter":"a person who writes news stories",
  "journalist":"a person who writes for newspapers or magazines",
  "manager":"a person who controls or organizes",
  "boss":"a person in charge of others",
  "customer":"a person who buys things",
  "tourist":"a person who travels for pleasure",
  "volunteer":"a person who works without pay",
  "personality":"the qualities that make a person unique",
  "behavior":"the way a person acts",
  "appearance":"the way someone looks",
  "ability":"the power or skill to do something",
  "talent":"a natural ability to do something well",
  "skill":"the ability to do something well",
  "knowledge":"information and understanding",
  "experience":"something that happens to you",
  "education":"the process of learning",
  "culture":"the customs of a group of people",
  "tradition":"a custom passed down through generations",
  "language":"a system of communication",
  "communication":"the act of sharing information",
  "relationship":"the way people are connected",
  "friendship":"the state of being friends",
  "love":"a deep feeling of affection",
  "hate":"a strong feeling of dislike",
  "anger":"a strong feeling of displeasure",
  "fear":"the feeling of being afraid",
  "joy":"a feeling of great happiness",
  "surprise":"a feeling caused by something unexpected",
  "disappointment":"sadness because something did not happen",
  "excitement":"a feeling of great enthusiasm",
  "nervousness":"a feeling of worry or anxiety",
  "confidence":"belief in one's own abilities",
  "pride":"a feeling of satisfaction in achievements",
  "shame":"a painful feeling of disgrace",
  "jealousy":"the feeling of wanting what someone else has",
  "curiosity":"a strong desire to know or learn",
  "imagination":"the ability to create pictures in your mind",
  "memory":"the ability to remember things",
  "thought":"an idea or opinion",
  "idea":"a plan or suggestion",
  "opinion":"what a person thinks about something",
  "belief":"something a person thinks is true",
  "dream":"a series of images during sleep",
  "wish":"a desire for something",
  "hope":"a feeling that something will happen",
  "plan":"a detailed proposal for action",
  "goal":"an aim or desired result",
  "purpose":"the reason for doing something",
  "reason":"a cause or explanation",
  "cause":"something that makes something happen",
  "effect":"a result or consequence",
  "result":"what happens because of something",
  "success":"the achievement of a goal",
  "failure":"lack of success",
  "progress":"movement toward a destination",
  "development":"the process of growing or changing",
  "improvement":"the act of making something better",
  "change":"the act of becoming different",
  "difference":"the way things are not the same",
  "similarity":"the way things are alike",
  "advantage":"something that puts you in a better position",
  "disadvantage":"something that puts you in a worse position",
  "problem":"something difficult that needs solving",
  "solution":"a way to solve a problem",
  "answer":"a response to a question",
  "question":"something you ask to get information",
  "example":"something that shows what something is like",
  "fact":"something that is true",
  "truth":"the state of being true",
  "lie":"a statement that is not true",
  "secret":"something kept hidden",
  "mistake":"an incorrect action or decision",
  "choice":"the act of choosing",
  "decision":"a choice you make",
  "chance":"an opportunity to do something",
  "opportunity":"a good chance to do something",
  "luck":"good things that happen by chance",
  "fate":"the power that controls events",
  "future":"the time that is coming",
  "past":"the time that has gone",
  "present":"the current time",
  "beginning":"the start of something",
  "end":"the final part of something",
  "middle":"the center of something",
  "edge":"the outer boundary of something",
  "corner":"the point where two lines meet",
  "side":"a surface of something",
  "top":"the highest point",
  "bottom":"the lowest point",
  "front":"the forward-facing part",
  "back":"the rear part",
  "inside":"the inner part",
  "outside":"the outer part",
  "distance":"the amount of space between things",
  "height":"the measurement from base to top",
  "width":"the measurement from side to side",
  "length":"the measurement from end to end",
  "weight":"how heavy something is",
  "speed":"how fast something moves",
  "direction":"the course along which something moves",
  "position":"the place where something is",
  "location":"a particular place",
  "area":"a region or part of a town",
  "region":"a large area of land",
  "territory":"an area of land controlled by someone",
  "border":"the line that separates two areas",
  "boundary":"a line that marks the edge of an area",
  "surface":"the outside part of something",
  "shape":"the outer form of something",
  "size":"how big or small something is",
  "amount":"a quantity of something",
  "number":"a word or symbol for counting",
  "total":"the whole amount",
  "average":"the typical amount",
  "rate":"the speed at which something happens",
  "level":"a point on a scale",
  "standard":"a level of quality",
  "quality":"how good or bad something is",
  "value":"how much something is worth",
  "price":"the amount of money something costs",
  "cost":"the amount of money needed to buy something",
  "profit":"money gained from business",
  "loss":"the state of losing something",
  "income":"money received for work",
  "expense":"the cost of doing something",
  "budget":"a plan for spending money",
  "salary":"money earned for work",
  "wage":"money paid for work",
  "fee":"a payment for services",
  "rent":"money paid to use property",
  "tax":"money paid to the government",
  "debt":"money that is owed",
  "loan":"money borrowed that must be returned",
  "investme

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
  const def = defs[w];
  const cap = word.charAt(0).toUpperCase() + word.slice(1);
  
  // Helper: choose A/An
  const article = /^[aeiou]/i.test(w) ? 'An' : 'A';
  
  // If we have a definition, use it
  if (def) {
    switch (pos) {
      case 'n':
        if (difficulty <= 3) return `${article} ${w} is ${def}.`;
        return `${cap} is ${def}. Example: ${example}`;
      case 'v':
        if (difficulty <= 3) return `To ${w} means to ${def}.`;
        return `To ${w} means to ${def}. Example: ${example}`;
      case 'adj':
        if (difficulty <= 3) return `${cap} means ${def}.`;
        return `${cap} describes something that is ${def}. Example: ${example}`;
      case 'adv':
        return `${cap} means ${def}. Example: ${example}`;
      default:
        return `${cap} means ${def}. Example: ${example}`;
    }
  }
  
  // Fallback: create meaningful explanation from example
  if (!example) {
    // No example available, use generic explanation
    switch (pos) {
      case 'n': return `${cap} is a noun in English.`;
      case 'v': return `To ${w} is a verb in English.`;
      case 'adj': return `${cap} is an adjective in English.`;
      case 'adv': return `${cap} is an adverb in English.`;
      case 'phrase': return `"${word}" is an English expression.`;
      default: return `${cap} is an English word.`;
    }
  }
  
  // Use example to create a meaningful explanation
  // Extract the context from the example to explain the word
  const exampleShort = example.length > 80 ? example.substring(0, 77) + '...' : example;
  
  switch (pos) {
    case 'n':
      return `${cap} refers to ${meaning}, as shown in: "${exampleShort}"`;
    case 'v':
      return `To ${w} means ${meaning}, as shown in: "${exampleShort}"`;
    case 'adj':
      return `${cap} describes something that is ${meaning}, as in: "${exampleShort}"`;
    case 'adv':
      return `${cap} describes how something is done (${meaning}), as in: "${exampleShort}"`;
    case 'phrase':
      return `"${word}" is an expression meaning ${meaning}, as in: "${exampleShort}"`;
    case 'prep':
      return `${cap} is a preposition meaning ${meaning}, as in: "${exampleShort}"`;
    case 'conj':
      return `${cap} is a conjunction meaning ${meaning}, as in: "${exampleShort}"`;
    case 'pron':
      return `${cap} is a pronoun meaning ${meaning}, as in: "${exampleShort}"`;
    default:
      return `${cap} means ${meaning}, as in: "${exampleShort}"`;
  }
}

// Process files
const dataDir = __dirname;
const files = fs.readdirSync(dataDir).filter(f => f.match(/^grade\d+\.json$/)).sort();

console.log('=== Generating English explanations ===\n');
let total = 0, withDef = 0;

files.forEach(f => {
  const fp = path.join(dataDir, f);
  const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
  let count = 0;
  
  data.forEach(w => {
    w.explain = generateExplain(w.word, w.meaning, w.category, w.difficulty, w.example || '');
    total++;
    if (defs[w.word.toLowerCase()]) { count++; withDef++; }
  });
  
  fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
  console.log(`${f}: ${data.length} words (${count} with definitions)`);
});

console.log(`\nTotal: ${total} words, ${withDef} with English definitions`);
console.log(`${total - withDef} using Chinese meaning fallback`);