const fs = require('fs');

// Read the generate_explain_v4.js file
let content = fs.readFileSync('generate_explain_v4.js', 'utf8');

// Find the truncated definition and fix it
// The truncated line is: "investme
const truncatedLine = '"investme';
const fixedLine = '"investment":"money put into something to make more money",';

// Replace the truncated line
content = content.replace(truncatedLine, fixedLine);

// Also check for other potential truncations
// Let's add more definitions for common words that might be missing
const additionalDefs = {
  "camera":"a device for taking photographs",
  "cellphone":"a portable telephone",
  "laptop":"a portable computer",
  "printer":"a device that produces text or images on paper",
  "scanner":"a device that converts images to digital format",
  "headphones":"a device worn on the ears to listen to audio",
  "speaker":"a device that produces sound",
  "microphone":"a device for capturing sound",
  "battery":"a device that stores electrical energy",
  "charger":"a device for recharging batteries",
  "cable":"a thick rope of wire for transmitting electricity or signals",
  "plug":"a device for connecting electrical equipment",
  "socket":"a device for connecting electrical equipment to power",
  "switch":"a device for turning electricity on or off",
  "remote":"a device for controlling equipment from a distance",
  "key":"a device for opening a lock",
  "lock":"a device for securing a door",
  "wallet":"a small case for carrying money",
  "purse":"a small bag for carrying money",
  "backpack":"a bag carried on the back",
  "suitcase":"a case for carrying clothes when traveling",
  "umbrella":"a device for protection against rain",
  "sunglasses":"glasses with dark lenses to protect from sunlight",
  "watch":"a small clock worn on the wrist",
  "ring":"a piece of jewelry worn on the finger",
  "necklace":"a piece of jewelry worn around the neck",
  "bracelet":"a piece of jewelry worn around the wrist",
  "earring":"a piece of jewelry worn on the ear",
  "perfume":"a pleasant smelling liquid worn on the body",
  "shampoo":"a liquid for washing hair",
  "soap":"a substance for washing",
  "toothbrush":"a brush for cleaning teeth",
  "toothpaste":"a paste for cleaning teeth",
  "towel":"a piece of cloth for drying",
  "mirror":"a surface that reflects images",
  "comb":"a tool for arranging hair",
  "brush":"a tool with bristles for cleaning or painting",
  "scissors":"a tool for cutting",
  "knife":"a tool with a sharp blade for cutting",
  "fork":"a tool with points for eating",
  "spoon":"a tool for eating or cooking",
  "plate":"a flat dish for food",
  "bowl":"a round dish for food",
  "cup":"a small container for drinking",
  "glass":"a container for drinking",
  "bottle":"a container for liquids",
  "can":"a metal container for food or drink",
  "jar":"a glass container with a lid",
  "bag":"a container for carrying things",
  "box":"a container with a lid",
  "basket":"a container for holding things",
  "bucket":"a container for carrying water",
  "bowl":"a round dish for food",
  "plate":"a flat dish for food",
  "cup":"a small container for drinking",
  "glass":"a container for drinking",
  "bottle":"a container for liquids",
  "can":"a metal container for food or drink",
  "jar":"a glass container with a lid",
  "bag":"a container for carrying things",
  "box":"a container with a lid",
  "basket":"a container for holding things",
  "bucket":"a container for carrying water"
};

// Find the end of the defs object
const defsEnd = content.indexOf('};', content.indexOf('const defs = {'));
if (defsEnd !== -1) {
  // Insert additional definitions before the closing brace
  let defsContent = content.substring(content.indexOf('const defs = {'), defsEnd);
  
  // Add missing definitions
  let newDefs = '';
  for (const [word, def] of Object.entries(additionalDefs)) {
    if (!defsContent.includes(`"${word}":`)) {
      newDefs += `  "${word}":"${def}",\n`;
    }
  }
  
  if (newDefs) {
    content = content.substring(0, defsEnd) + newDefs + content.substring(defsEnd);
  }
}

// Write the fixed file
fs.writeFileSync('generate_explain_v4_fixed.js', content);
console.log('Fixed file saved as generate_explain_v4_fixed.js');

// Count definitions
const defsMatch = content.match(/const defs = \{([\s\S]*?)\};/);
if (defsMatch) {
  const defsStr = defsMatch[1];
  const defCount = (defsStr.match(/"/g) || []).length / 2;
  console.log(`Total definitions: ${defCount}`);
}