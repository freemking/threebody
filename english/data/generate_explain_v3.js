const fs = require('fs');
const path = require('path');

// Compact Chinese keyword → English mapping for explanation generation
const zhToEn = {
  // Common nouns
  "时间":"time","上午":"morning","下午":"afternoon","晚上":"evening","早上":"morning","中午":"noon","夜晚":"night",
  "今天":"today","明天":"tomorrow","昨天":"yesterday","周末":"weekend","假期":"holiday","生日":"birthday",
  "春天":"spring","夏天":"summer","秋天":"autumn","冬天":"winter","季节":"season",
  "一月":"January","二月":"February","三月":"March","四月":"April","五月":"May","六月":"June",
  "七月":"July","八月":"August","九月":"September","十月":"October","十一月":"November","十二月":"December",
  "年":"year","月":"month","周":"week","天":"day","小时":"hour","分钟":"minute","秒":"second",
  "学校":"school","书本":"book","书包":"schoolbag","铅笔":"pencil","钢笔":"pen","尺子":"ruler",
  "橡皮":"eraser","纸":"paper","黑板":"blackboard","课桌":"desk","作业":"homework","考试":"exam",
  "课程":"course","学科":"subject","语文":"Chinese","数学":"math","英语":"English","科学":"science",
  "历史":"history","地理":"geography","音乐":"music","美术":"art","体育":"PE",
  "家":"home","家庭":"family","爸爸":"father","妈妈":"mother","爷爷":"grandfather","奶奶":"grandmother",
  "叔叔":"uncle","阿姨":"aunt","哥哥":"brother","姐姐":"sister","弟弟":"brother","妹妹":"sister",
  "孩子":"child","孩子（复数）":"children","孩子们":"children","婴儿":"baby","男孩":"boy","女孩":"girl",
  "男人":"man","女人":"woman","人":"person","人们":"people","朋友":"friend","同学":"classmate",
  "邻居":"neighbor","客人":"guest","国王":"king","女王":"queen","公主":"prince","王子":"prince",
  "英雄":"hero","人物":"figure","居民":"resident","先生":"Mr.","女士":"Ms.","教师":"teacher",
  "医生":"doctor","护士":"nurse","警察":"policeman","厨师":"cook","司机":"driver","农民":"farmer",
  "工人":"worker","科学家":"scientist","作家":"writer","艺术家":"artist","记者":"reporter","经理":"manager",
  "运动员":"athlete","飞行员":"pilot","士兵":"soldier","工程师":"engineer","律师":"lawyer",
  "动物":"animal","狗":"dog","猫":"cat","鸟":"bird","鱼":"fish","牛":"cow","马":"horse",
  "羊":"sheep","猪":"pig","鸡":"chicken","鸭":"duck","兔":"rabbit","老鼠":"mouse",
  "老虎":"tiger","狮子":"lion","大象":"elephant","猴子":"monkey","熊猫":"panda","熊":"bear",
  "蛇":"snake","青蛙":"frog","蝴蝶":"butterfly","蜜蜂":"bee","蚂蚁":"ant","蜘蛛":"spider",
  "袋鼠":"kangaroo","考拉":"koala","长颈鹿":"giraffe","河马":"hippo","北极熊":"polar bear",
  "海豚":"dolphin","鲨鱼":"shark","鲸鱼":"whale","企鹅":"penguin","老鹰":"eagle","鸽子":"dove",
  "松鼠":"squirrel","鹿":"deer","狼":"wolf","狐狸":"fox","孔雀":"peacock","鹦鹉":"parrot",
  "天鹅":"swan","乌鸦":"crow","乌龟":"turtle","鳄鱼":"crocodile","鹅":"goose",
  "食物":"food","米饭":"rice","面条":"noodle","面包":"bread","肉":"meat","鸡肉":"chicken",
  "鸡蛋":"egg","牛奶":"milk","果汁":"juice","茶":"tea","咖啡":"coffee","可乐":"cola",
  "水":"water","汽水":"soda","饮料":"drink","汤":"soup","沙拉":"salad","汉堡":"hamburger",
  "三明治":"sandwich","比萨":"pizza","蛋糕":"cake","饼干":"biscuit","巧克力":"chocolate",
  "冰淇淋":"ice cream","糖果":"candy","水果":"fruit","苹果":"apple","香蕉":"banana","橙子":"orange",
  "葡萄":"grape","西瓜":"watermelon","草莓":"strawberry","桃子":"peach","梨":"pear","芒果":"mango",
  "菠萝":"pineapple","樱桃":"cherry","柠檬":"lemon","椰子":"coconut",
  "蔬菜":"vegetable","胡萝卜":"carrot","土豆":"potato","西红柿":"tomato","黄瓜":"cucumber",
  "白菜":"Chinese cabbage","洋葱":"onion","辣椒":"chili","大蒜":"garlic","玉米":"corn",
  "豌豆":"pea","蘑菇":"mushroom","青菜":"green vegetables","菠菜":"spinach","西兰花":"broccoli",
  "卷心菜":"cabbage","豆腐":"tofu","盐":"salt","糖":"sugar","酱油":"soy sauce","醋":"vinegar",
  "油":"oil","黄油":"butter","蜂蜜":"honey","果酱":"jam","羊肉":"mutton",
  "房子":"house","家；房子":"home","房间":"room","厨房":"kitchen","卧室":"bedroom",
  "客厅":"living room","浴室":"bathroom","花园":"garden","门":"door","窗":"window",
  "桌子":"table","椅子":"chair","床":"bed","沙发":"sofa","柜子":"cupboard","书架":"bookshelf",
  "灯":"lamp","钟":"clock","镜子":"mirror","电话":"phone","电视":"TV","电脑":"computer",
  "冰箱":"fridge","洗衣机":"washing machine","空调":"air conditioner","地毯":"carpet",
  "窗帘":"curtain","照片":"photo","画":"painting","花瓶":"vase","盘子":"plate","碗":"bowl",
  "杯子":"cup","筷子":"chopsticks","刀":"knife","叉子":"fork","勺子":"spoon","钥匙":"key",
  "衣服":"clothes","衬衫":"shirt","T恤":"T-shirt","裤子":"pants","牛仔裤":"jeans",
  "短裤":"shorts","裙子":"skirt","连衣裙":"dress","外套":"coat","夹克":"jacket",
  "毛衣":"sweater","帽子":"hat","围巾":"scarf","手套":"gloves","袜子":"socks","鞋子":"shoes",
  "靴子":"boots","雨衣":"raincoat","睡衣":"pajamas","校服":"school uniform","泳衣":"swimsuit",
  "领带":"tie","眼镜":"glasses","制服":"uniform","旗袍":"cheongsam",
  "红色":"red","蓝色":"blue","绿色":"green","黄色":"yellow","白色":"white","黑色":"black",
  "粉色":"pink","紫色":"purple","橙色":"orange","灰色":"gray","棕色":"brown","彩虹":"rainbow",
  "天气":"weather","晴天":"sunny","多云":"cloudy","阴天":"overcast","下雨":"rain","下雪":"snow",
  "刮风":"wind","雾":"fog","暴风雨":"storm","台风":"typhoon","闪电":"lightning","雷":"thunder",
  "温度":"temperature","度":"degree","热":"hot","冷":"cold","温暖":"warm","凉爽":"cool",
  "潮湿":"humid","干燥":"dry",
  "汽车":"car","公共汽车":"bus","出租车":"taxi","火车":"train","飞机":"airplane","自行车":"bicycle",
  "摩托车":"motorcycle","地铁":"subway","轮船":"ship","船":"boat","小船":"small boat",
  "交通":"traffic","交通信号灯":"traffic light","人行道":"sidewalk","街道":"street","道路":"road",
  "城市":"city","国家":"country","世界":"world","东方":"east","南方":"south","西方":"west","北方":"north",
  "公园":"park","超市":"supermarket","商店":"shop","医院":"hospital","图书馆":"library","博物馆":"museum",
  "电影院":"cinema","餐厅":"restaurant","酒店":"hotel","银行":"bank","邮局":"post office",
  "动物园":"zoo","体育馆":"gym","操场":"playground","农场":"farm","机场":"airport","车站":"station",
  "博物馆":"museum","广场":"square","宫殿":"palace","城堡":"castle","寺庙":"temple",
  "计算机":"computer","互联网":"Internet","网站":"website","博客":"blog","程序":"program",
  "游戏":"game","动画片":"cartoon","电影":"movie","新闻":"news","广告":"advertisement",
  "音乐":"music","歌曲":"song","舞蹈":"dance","绘画":"painting","照片":"photo",
  "节日":"holiday","圣诞节":"Christmas","万圣节":"Halloween","感恩节":"Thanksgiving",
  "中秋节":"Mid-Autumn Festival","端午节":"Dragon Boat Festival","春节":"Spring Festival",
  "运动":"sport","足球":"football","篮球":"basketball","网球":"tennis","排球":"volleyball",
  "乒乓球":"table tennis","游泳":"swimming","跑步":"running","跳绳":"jump rope",
  "羽毛球":"badminton","棒球":"baseball","高尔夫":"golf","滑冰":"skating","滑雪":"skiing",
  "科学":"science","技术":"technology","数学":"math","物理":"physics","化学":"chemistry",
  "生物":"biology","地理":"geography","政治":"politics","经济":"economy",
  "艺术":"art","文学":"literature","哲学":"philosophy","心理学":"psychology",
  "环境":"environment","自然":"nature","地球":"earth","太阳":"sun","月亮":"moon",
  "星星":"star","天空":"sky","海洋":"sea","山":"mountain","河":"river","湖":"lake","森林":"forest",
  "沙漠":"desert","岛屿":"island","植物":"plant","树":"tree","花":"flower","草":"grass","叶子":"leaf",
  "种子":"seed","根":"root","果实":"fruit",
  "身体":"body","头":"head","脸":"face","眼睛":"eye","耳朵":"ear","鼻子":"nose","嘴":"mouth",
  "牙齿":"tooth","舌头":"tongue","头发":"hair","脖子":"neck","肩膀":"shoulder","胳膊":"arm",
  "手":"hand","手指":"finger","后背":"back","肚子":"stomach","腿":"leg","膝盖":"knee",
  "脚":"foot","心脏":"heart","骨头":"bone","肌肉":"muscle","皮肤":"skin",
  // Common verbs/actions
  "跑":"run","走":"walk","跳":"jump","坐":"sit","站":"stand","睡觉":"sleep","起床":"get up",
  "吃":"eat","喝":"drink","看":"watch/see","听":"listen","说":"speak","读":"read","写":"write",
  "唱":"sing","跳舞":"dance","游泳":"swim","画":"draw","玩":"play","工作":"work","学习":"study",
  "做饭":"cook","打扫":"clean","洗":"wash","穿":"wear","戴":"wear","打电话":"call",
  "骑":"ride","飞":"fly","爬":"climb","拉":"pull","推":"push","踢":"kick","扔":"throw",
  "接住":"catch","打":"hit","笑":"laugh","哭":"cry","叫":"shout","想":"think","知道":"know",
  "喜欢":"like","爱":"love","希望":"hope","需要":"need","开始":"start","停止":"stop",
  "帮助":"help","借":"lend","给":"give","拿":"take","带":"bring","带来":"bring","送":"send",
  "等待":"wait","找":"find","找到":"find","用":"use","打开":"open","关闭":"close",
  "买":"buy","卖":"sell","切":"cut","放":"put","出去":"go out","进来":"come in",
  "去":"go","来":"come","回":"return","到达":"arrive","离开":"leave","迟到":"late",
  "检查":"check","整理":"tidy","回答":"answer","休息":"rest","散步":"take a walk",
  "旅行":"travel","开车":"drive","锻炼":"exercise","刷牙":"brush teeth","洗脸":"wash face",
  "做准备活动":"warm up","迟到":"be late","聚会":"party","遇见":"meet","选择":"choose",
  "决定":"decide","相信":"believe","同意":"agree","讨论":"discuss","解释":"explain",
  "描述":"describe","比较":"compare","想象":"imagine","创造":"create","发明":"invent",
  "发现":"discover","发展":"develop","改变":"change","增加":"increase","减少":"decrease",
  "保护":"protect","节省":"save","浪费":"waste","污染":"pollute","回收":"recycle",
  "庆祝":"celebrate","准备":"prepare","组织":"organize","完成":"finish","成功":"succeed",
  "失败":"fail","尝试":"try","练习":"practice","改善":"improve","提高":"improve",
  "交流":"communicate","介绍":"introduce","邀请":"invite","接受":"accept","拒绝":"refuse",
  "道歉":"apologize","原谅":"forgive","感谢":"thank","祝福":"bless","鼓励":"encourage",
  "警告":"warn","建议":"suggest","命令":"order","要求":"require","允许":"allow","禁止":"forbid",
  "标记":"mark","记录":"record","报告":"report","宣布":"announce","确认":"confirm",
  // Common adjectives
  "好的":"good","坏的":"bad","大的":"big","小的":"small","快的":"fast","慢的":"slow",
  "热的":"hot","冷的":"cold","新的":"new","旧的":"old","长的":"long","短的":"short",
  "高的":"tall/high","矮的":"short","胖的":"fat","瘦的":"thin/slim","美丽的":"beautiful",
  "丑的":"ugly","聪明的":"smart","勇敢的":"brave","善良的":"kind","快乐的":"happy",
  "悲伤的":"sad","生气的":"angry","害怕的":"afraid","紧张的":"nervous","无聊的":"bored",
  "兴奋的":"excited","惊讶的":"surprised","累的":"tired","饿的":"hungry","渴的":"thirsty",
  "忙的":"busy","空闲的":"free","简单的":"easy","困难的":"hard/difficult","重要的":"important",
  "有趣的":"interesting","无聊的":"boring","危险的":"dangerous","安全的":"safe",
  "健康的":"healthy","生病的":"sick","干净的":"clean","脏的":"dirty","安静的":"quiet",
  "吵闹的":"noisy","明亮的":"bright","黑暗的":"dark","干燥的":"dry","潮湿的":"wet",
  "甜的":"sweet","酸的":"sour","苦的":"bitter","咸的":"salty","辣的":"spicy",
  "软的":"soft","硬的":"hard","厚的":"thick","薄的":"thin","光滑的":"smooth","粗糙的":"rough",
  "锋利的":"sharp","钝的":"blunt","宽的":"wide","窄的":"narrow","深的":"deep","浅的":"shallow",
  "满的":"full","空的":"empty","正确的":"correct","错误的":"wrong","真的":"true","假的":"false",
  "可能的":"possible","不可能的":"impossible","不同的":"different","相同的":"same",
  "特别的":"special","普通的":"ordinary","主要的":"main","基本的":"basic","完整的":"complete",
  "足够的":"enough","更多的":"more","更少的":"less","最好的":"best","最坏的":"worst",
  "自己的":"own","其他":"other","另一个":"another","几个":"several","许多":"many",
  "每一个":"each","所有的":"all","任何的":"any","没有的":"no","某些":"some",
  "在线的":"online","虚拟的":"virtual","真实的":"real","现代的":"modern","古代的":"ancient",
  "传统的":"traditional","国际的":"international","国家的":"national","全球的":"global",
  "本地的":"local","私人的":"private","公共的":"public","免费的":"free","付费的":"paid",
  "可再生的":"renewable","环保的":"eco-friendly","有机的":"organic","天然的":"natural",
  // Common adverbs
  "非常":"very","很":"very","太":"too","真":"really","好":"well","快":"quickly","慢":"slowly",
  "早":"early","晚":"late","经常":"often","有时":"sometimes","总是":"always","从不":"never",
  "已经":"already","还":"still","又":"again","再":"again","也":"also","都":"all","只":"only",
  "就":"just","才":"only","正":"just","在":"at","正在":"now","一起":"together","独自":"alone",
  "这里":"here","那里":"there","到处":"everywhere","哪里":"where","什么时候":"when","为什么":"why",
  "怎样":"how","多么":"how","如此":"so","这样":"like this","那样":"like that",
  // Common phrases and other
  "能够":"be able to","必须":"must","应该":"should","可以":"can/may","需要":"need",
  "想":"want to","打算":"plan to","准备":"be going to","将要":"will","会":"will/can",
  "正在":"be doing","已经":"have already","曾经":"once","曾经":"ever","从不":"never",
  "马上":"soon","立刻":"immediately","终于":"finally","突然":"suddenly","逐渐":"gradually",
  "渐渐":"gradually","慢慢":"slowly","悄悄":"quietly","偷偷":"secretly",
  "高兴":"happy","高兴地":"happily","勇敢地":"bravely","认真地":"carefully",
  "仔细地":"carefully","大声地":"loudly","轻声地":"quietly","迅速地":"quickly",
  "安静地":"quietly","努力地":"hard","容易地":"easily","简单地":"simply",
  "正确地":"correctly","错误地":"wrongly","成功地":"successfully",
  // More specific terms
  "好奇心":"curiosity","勇气":"courage","友谊":"friendship","爱":"love","恨":"hate",
  "希望":"hope","梦想":"dream","未来":"future","过去":"past","现在":"present",
  "成功":"success","失败":"failure","机会":"chance","挑战":"challenge","问题":"problem",
  "答案":"answer","方法":"way","知识":"knowledge","经验":"experience","技能":"skill",
  "能力":"ability","力量":"power","能量":"energy","速度":"speed","距离":"distance",
  "面积":"area","体积":"volume","重量":"weight","数量":"amount","价格":"price",
  "价值":"value","质量":"quality","效率":"efficiency","安全":"safety","健康":"health",
  "幸福":"happiness","和平":"peace","自由":"freedom","公平":"fairness","正义":"justice",
  "真相":"truth","美丽":"beauty","智慧":"wisdom","真理":"truth",
  "压力":"pressure","紧张":"tension","焦虑":"anxiety","恐惧":"fear","愤怒":"anger",
  "悲伤":"sadness","快乐":"joy","兴奋":"excitement","满足":"satisfaction",
  "龙舟赛":"dragon boat race","全息图":"hologram","虚拟现实":"virtual reality",
  "全球变暖":"global warming","石器时代":"Stone Age",
};

// Detect POS from category and meaning
function detectPOS(category, meaning) {
  const cat = category.toLowerCase().replace(/\.$/, '').trim();
  
  if (/^(adj|adj\.|adj & pron|det & adj|adj\.)$/.test(cat)) return 'adj';
  if (/^(n|n\.|n & v|det & pron|n\.)$/.test(cat)) return 'n';
  if (/^(v|v\.|v & n|v\.\/n\.|modal v|modal v\.)$/.test(cat)) return 'v';
  if (/^(adv|adv\.)$/.test(cat)) return 'adv';
  if (/^prep/.test(cat)) return 'prep';
  if (/^conj/.test(cat)) return 'conj';
  if (/^pron/.test(cat)) return 'pron';
  if (/^phrase/.test(cat)) return 'phrase';
  if (/^abbr/.test(cat)) return 'abbr';
  if (/^det/.test(cat)) return 'det';
  
  // Chinese categories - infer from meaning
  const cnCats = {
    '动作':'v','其他':'n','数字':'n','时间':'n','学习用品':'n','身体部位':'n',
    '家庭':'n','食物':'n','动物':'n','颜色':'adj','玩具':'n','饮料':'n',
    '天气':'n','季节':'n','服装':'n','职业':'n','家具':'n','交通':'n',
    '地点':'n','学科':'n','节日':'n','乐器':'n',
  };
  if (cnCats[category]) return cnCats[category];
  
  // Fallback: guess from meaning
  if (meaning.includes('的') && !meaning.includes('地')) return 'adj';
  if (meaning.includes('地')) return 'adv';
  if (/^(做|去|来|使|让|把)/.test(meaning)) return 'v';
  return 'n';
}

// Translate Chinese meaning to English using the dictionary
function translateMeaning(meaning) {
  // Try exact match first
  if (zhToEn[meaning]) return zhToEn[meaning];
  
  // Try first part before semicolons/commas
  const parts = meaning.split(/[；;,，、]/);
  for (const part of parts) {
    const trimmed = part.trim();
    if (zhToEn[trimmed]) return zhToEn[trimmed];
  }
  
  // Try to find any matching keyword in the meaning
  for (const [zh, en] of Object.entries(zhToEn)) {
    if (meaning.includes(zh)) return en;
  }
  
  return null;
}

// Generate English explanation for a word
function generateExplain(word, meaning, category, difficulty, example, rootAffix) {
  const pos = detectPOS(category, meaning);
  const enMeaning = translateMeaning(meaning);
  
  // Extract the main Chinese meaning (before any semicolons/commas)
  const mainMeaning = meaning.split(/[；;,，、]/)[0].trim();
  
  // If we have a good English translation, use it
  if (enMeaning) {
    switch (pos) {
      case 'n':
        if (difficulty <= 3) {
          return `A ${word} is ${enMeaning}. ${example ? 'For example: ' + example : ''}`.trim();
        } else if (difficulty <= 6) {
          return `${word.charAt(0).toUpperCase() + word.slice(1)} refers to ${enMeaning}. ${example ? 'Example: ' + example : ''}`.trim();
        } else {
          return `${word.charAt(0).toUpperCase() + word.slice(1)} means ${enMeaning}, often used in academic or formal contexts. ${example ? 'Example: ' + example : ''}`.trim();
        }
      case 'v':
        if (difficulty <= 3) {
          return `To ${word} means to ${enMeaning}. ${example ? 'For example: ' + example : ''}`.trim();
        } else if (difficulty <= 6) {
          return `To ${word} means to ${enMeaning}. ${example ? 'Example: ' + example : ''}`.trim();
        } else {
          return `To ${word} means to ${enMeaning}, commonly used in formal writing. ${example ? 'Example: ' + example : ''}`.trim();
        }
      case 'adj':
        if (difficulty <= 3) {
          return `${word.charAt(0).toUpperCase() + word.slice(1)} means ${enMeaning}. ${example ? 'For example: ' + example : ''}`.trim();
        } else if (difficulty <= 6) {
          return `${word.charAt(0).toUpperCase() + word.slice(1)} describes something that is ${enMeaning}. ${example ? 'Example: ' + example : ''}`.trim();
        } else {
          return `${word.charAt(0).toUpperCase() + word.slice(1)} describes something that is ${enMeaning}, used in more formal contexts. ${example ? 'Example: ' + example : ''}`.trim();
        }
      case 'adv':
        return `${word.charAt(0).toUpperCase() + word.slice(1)} means ${enMeaning}, describing how an action is performed. ${example ? 'Example: ' + example : ''}`.trim();
      case 'prep':
        return `${word.charAt(0).toUpperCase() + word.slice(1)} is a preposition meaning ${enMeaning}. ${example ? 'Example: ' + example : ''}`.trim();
      case 'conj':
        return `${word.charAt(0).toUpperCase() + word.slice(1)} is a conjunction meaning ${enMeaning}. ${example ? 'Example: ' + example : ''}`.trim();
      case 'pron':
        return `${word.charAt(0).toUpperCase() + word.slice(1)} is a pronoun meaning ${enMeaning}. ${example ? 'Example: ' + example : ''}`.trim();
      case 'phrase':
        return `"${word}" is an expression meaning ${enMeaning}. ${example ? 'Example: ' + example : ''}`.trim();
      case 'det':
        return `${word.charAt(0).toUpperCase() + word.slice(1)} is a determiner meaning ${enMeaning}. ${example ? 'Example: ' + example : ''}`.trim();
      default:
        return `${word.charAt(0).toUpperCase() + word.slice(1)} means ${enMeaning}. ${example ? 'Example: ' + example : ''}`.trim();
    }
  }
  
  // Fallback: construct from example and rootAffix
  let explain = '';
  
  if (pos === 'phrase') {
    explain = `"${word}" is an English expression.`;
  } else if (pos === 'v') {
    explain = `To ${word} is an action word in English.`;
  } else if (pos === 'adj') {
    explain = `${word.charAt(0).toUpperCase() + word.slice(1)} is a describing word in English.`;
  } else if (pos === 'adv') {
    explain = `${word.charAt(0).toUpperCase() + word.slice(1)} is an adverb that describes how something is done.`;
  } else if (pos === 'prep') {
    explain = `${word.charAt(0).toUpperCase() + word.slice(1)} is a preposition used to show relationships between words.`;
  } else if (pos === 'conj') {
    explain = `${word.charAt(0).toUpperCase() + word.slice(1)} is a conjunction used to connect words or phrases.`;
  } else if (pos === 'pron') {
    explain = `${word.charAt(0).toUpperCase() + word.slice(1)} is a pronoun used in place of a noun.`;
  } else if (pos === 'det') {
    explain = `${word.charAt(0).toUpperCase() + word.slice(1)} is a determiner used before a noun.`;
  } else {
    explain = `${word.charAt(0).toUpperCase() + word.slice(1)} is an English word.`;
  }
  
  if (example) {
    explain += ` Example: ${example}`;
  }
  
  if (rootAffix) {
    // Extract English etymology hint if possible
    const etymMatch = rootAffix.match(/→(.+)$/);
    if (etymMatch) {
      explain += ` (Related to: ${etymMatch[1].trim()})`;
    }
  }
  
  return explain.trim();
}

// Process a single file
function processFile(filePath) {
  const basename = path.basename(filePath);
  console.log(`Processing ${basename}...`);
  
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let successCount = 0;
  let fallbackCount = 0;
  
  data.forEach(word => {
    const enMeaning = translateMeaning(word.meaning);
    word.explain = generateExplain(
      word.word,
      word.meaning,
      word.category,
      word.difficulty,
      word.example,
      word.rootAffix
    );
    if (enMeaning) successCount++;
    else fallbackCount++;
  });
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`  ${successCount} with translation, ${fallbackCount} with fallback`);
  return { success: successCount, fallback: fallbackCount };
}

// Main
function main() {
  const dataDir = __dirname;
  const files = fs.readdirSync(dataDir)
    .filter(f => f.match(/^grade\d+\.json$/))
    .sort();
  
  console.log('=== Generating English explanations ===\n');
  
  let totalSuccess = 0, totalFallback = 0;
  files.forEach(f => {
    const r = processFile(path.join(dataDir, f));
    totalSuccess += r.success;
    totalFallback += r.fallback;
  });
  
  console.log(`\nTotal: ${totalSuccess} translated, ${totalFallback} fallback out of ${totalSuccess + totalFallback}`);
}

main();