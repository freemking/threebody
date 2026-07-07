$file = "d:\QBY\game\English\js\game.js"
$content = Get-Content $file -Raw -Encoding UTF8

# Board cell names
$content = $content -replace "'起点'", "'Start'"
$content = $content -replace "'幸运'", "'Lucky'"
$content = $content -replace "'机遇'", "'Chance'"
$content = $content -replace "'纳税'", "'Tax'"
$content = $content -replace "name: '起点'", "name: 'Start'"
$content = $content -replace "name: '幸运'", "name: 'Lucky'"
$content = $content -replace "name: '机遇'", "name: 'Chance'"
$content = $content -replace "name: '纳税'", "name: 'Tax'"

# UI elements
$content = $content.Replace("掷骰子", "Roll Dice")
$content = $content.Replace("你的回合", "Your Turn")
$content = $content.Replace("占领: ", "Owned: ")
$content = $content.Replace("占领:", "Owned:")
$content = $content.Replace("破产", "Bankrupt")
$content = $content.Replace("事件记录", "Event Log")
$content = $content.Replace("回合", "Round")

# Panel titles
$content = $content.Replace("🎯 回合", "🎯 Round")
$content = $content.Replace("🎩 玩家", "🎩 Player")
$content = $content.Replace("📋 事件记录", "📋 Event Log")

# AI names
$content = $content -replace "'电脑(\d+)'", "'AI `$1'"
$content = $content -replace "name: '电脑'", "name: 'AI'"

# Difficulty names
$diffHash = @{70='Easy';80='Normal';90='Hard';100='Expert'}
$content = $content.Replace("'简单'", "'Easy'")
$content = $content.Replace("'普通'", "'Normal'")
$content = $content.Replace("'高级'", "'Hard'")
$content = $content.Replace("'无敌'", "'Expert'")
$content = $content.Replace(", '普通'}", ", 'Normal'}")

# Challenge titles
$content = $content.Replace("① 挑出正确单词", "① Pick the correct word")
$content = $content.Replace("② 选择中文释义", "② Choose the meaning")
$content = $content.Replace("③ 补全缺失字母", "③ Fill in missing letters")
$content = $content.Replace("④ 选择正确句子", "④ Choose the correct sentence")

# Challenge UI
$content = $content.Replace("选出对应的英文单词", "Pick the matching English word")
$content = $content.Replace("用键盘输入缺失字母", "Type the missing letters with keyboard")
$content = $content.Replace(">确认</button>", ">Confirm</button>")
$content = $content.Replace(">跳过</div>", ">Skip</div>")
$content = $content.Replace("进度: ", "Progress: ")
$content = $content.Replace("选出包含 `"", "Pick the sentence with `"")

# Game messages
$content = $content.Replace("正确!", "Correct!")
$content = $content.Replace("错误!", "Wrong!")
$content = $content.Replace("占领成功!", "Occupied!")
$content = $content.Replace("占领失败!", "Occupation failed!")
$content = $content.Replace("升级成功!", "Upgrade success!")
$content = $content.Replace("升级失败!", "Upgrade failed!")
$content = $content.Replace("挑战成功!", "Challenge won!")
$content = $content.Replace("答错!", "Wrong!")
$content = $content.Replace("答对", "Correct")
$content = $content.Replace("答错", "Wrong")
$content = $content.Replace("自动升级!", "auto-upgraded!")
$content = $content.Replace("自动升级", "auto-upgraded")
$content = $content.Replace("已达到最大升级次数", "Max upgrades reached")
$content = $content.Replace("金钱不足，需要", "Not enough money, need")
$content = $content.Replace("金钱不足，无法升级", "Not enough money to upgrade")
$content = $content.Replace("经过起点", "Passed Start")
$content = $content.Replace("起点", "Start")
$content = $content.Replace("升级格子", "Upgrade Cell")
$content = $content.Replace("当前等级:", "Current Level:")
$content = $content.Replace("当前价格:", "Current Price:")
$content = $content.Replace("升级费用:", "Upgrade Cost:")
$content = $content.Replace("升级次数:", "Upgrades:")
$content = $content.Replace("你的地盘", "Your Property")
$content = $content.Replace("租金:", "Rent:")
$content = $content.Replace("卖掉 (+$", "Sell (+$")
$content = $content.Replace("保留", "Keep")
$content = $content.Replace("卖掉", "Sold")
$content = $content.Replace("付租金", "pay rent")
$content = $content.Replace("付双倍租金", "pay double rent")
$content = $content.Replace("付租金给", "pay rent to")
$content = $content.Replace("付双倍租金给", "pay double rent to")
$content = $content.Replace("升级", "Upgrade")
$content = $content.Replace("玩家", "Player")
$content = $content.Replace("纳税", "Tax")

# Disaster names
$content = $content.Replace("台风", "Typhoon")
$content = $content.Replace("陨石", "Meteor")
$content = $content.Replace("寒潮", "Cold Wave")
$content = $content.Replace("来袭!", " strikes!")
$content = $content.Replace("变为无主!", "became unowned!")
$content = $content.Replace("变为无主", "became unowned")
$content = $content.Replace("变为无主格", "became unowned")
$content = $content.Replace("变为无主", "became unowned")
$content = $content.Replace("降为", "downgraded to")
$content = $content.Replace("仍属", "still belongs to")
$content = $content.Replace("释放", "released")
$content = $content.Replace("块格子", " cells")

# Event log patterns
$content = $content.Replace("机遇降落占领", "Chance landing occupied")
$content = $content.Replace("机遇降落占领失败，罚款", "Chance landing occupation failed, fine")
$content = $content.Replace("机遇降落自动升级", "Chance landing auto-upgrade")
$content = $content.Replace("机遇降落: ", "Chance landing: ")
$content = $content.Replace("从", "from")
$content = $content.Replace("降为", "downgraded to")
$content = $content.Replace("获得额外回合!", "gets an extra turn!")
$content = $content.Replace("掷出", "rolled")
$content = $content.Replace("点", "")

# Bankruptcy
$content = $content.Replace("破产了!", " went bankrupt!")
$content = $content.Replace("破产!", "Bankrupt!")

# Misc
$content = $content.Replace("已占领", "Already owned")
$content = $content.Replace("的概率决定是否占领", " chance to occupy")
$content = $content.Replace("未找到单词数据", "No word data found")

# Final cleanup of leftover Chinese
$content = $content.Replace("需付租金", "Rent to pay")
$content = $content.Replace("等级", "Level")

Set-Content $file -Value $content -Encoding UTF8 -NoNewline
Write-Host "Translation complete!"
