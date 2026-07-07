/**
 * 单词大爆炸游戏 - WordBlast
 * 所有单词的中文和英文随机分布，点击配对即炸掉，有倒计时，难度递增
 */
function wbShuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const range = i + 1;
    const limit = Math.floor(0x100000000 / range) * range;
    let r;
    do {
      r = crypto.getRandomValues(new Uint32Array(1))[0];
    } while (r >= limit);
    const j = r % range;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

class WordBlastGame {
  constructor() {
    this.s = {
      grade: null, unit: 'all',
      score: 0, combo: 0, maxCombo: 0,
      level: 1,
      timeLeft: 0, timeLimit: 60,
      playing: false, paused: false,
      sel: null, // {type:'cn'|'en', id, el}
      clearedPairs: 0,
      totalPairs: 0
    };
    this.wordPool = [];
    this.bubbles = []; // {id, word, meaning, cnActive:true, enActive:true}
    this.tmr = null;
    this.BLAST_MS = 500;

    // 动态时间配置
    this.SECONDS_PER_WORD = 5; // 每个单词的基础时间（秒）
    this.MIN_TIME = 30;        // 最小时间（秒）
    this.MAX_TIME = 360;       // 最大时间（秒）- 加倍以支持第一关2倍时间
    this.TIME_DECREASE_RATIO = 0.15; // 每关时间递减比例（15%）

    // 监听语言变更事件，重新渲染当前页面
    document.addEventListener('languageChanged', () => {
      const setupEl = document.getElementById('wb-back-btn');
      const resultBox = document.querySelector('.wb-result-box');
      if (setupEl || resultBox) {
        this.showSetup();
      } else if (this.s.playing) {
        this.render();
      }
    });
  }

  async init() { return true; }
  switchScene() { this.showSetup(); }

  // 动态计算时间
  calcTimeForLevel(level, wordCount) {
    // 第一关：基于单词数量计算基础时间，调整为2倍
    if (level === 1) {
      const baseTime = wordCount * this.SECONDS_PER_WORD;
      const doubledTime = baseTime * 2; // 第一关时间调整为2倍
      return Math.max(this.MIN_TIME, Math.min(this.MAX_TIME, doubledTime));
    }
    
    // 后续关卡：在上一关基础上递减
    const baseTime = this.calcTimeForLevel(1, wordCount);
    const decrease = Math.pow(1 - this.TIME_DECREASE_RATIO, level - 1);
    return Math.max(this.MIN_TIME, Math.floor(baseTime * decrease));
  }

  // ─── 设置界面 ───
  showSetup() {
    const c = document.getElementById('game-canvas-container');
    if (!c) return;
    c.innerHTML = '';
    // 不覆盖容器样式，保持全局CSS的#game-canvas-container样式

    // 创建wrapper包裹所有内容（参考大富翁的grade-sel-wrap）
    const wrapper = document.createElement('div');
    wrapper.className = 'wb-setup-wrap';

    const tx = (k) => (window.app && window.app.t) ? window.app.t(k) : t(k);

    // 游戏头部（返回按钮）
    const header = document.createElement('div');
    header.className = 'game-header';
    header.innerHTML = `
      <button class="back-btn" id="wb-back-btn">← ${tx('back')}</button>
      <div class="game-title">${tx('wbTitle')}</div>
    `;
    wrapper.appendChild(header);
    header.querySelector('#wb-back-btn').onclick = () => {
      audioManager.playClick();
      window.app.showMainMenu();
    };

    // 设置页标题
    const setupHeader = document.createElement('div');
    setupHeader.className = 'setup-header';
    setupHeader.innerHTML = `
      <h2 data-i18n="setupTitle">${tx('wbTitle')}</h2>
      <p class="setup-subtitle">${tx('wbDesc')}</p>
    `;
    wrapper.appendChild(setupHeader);

    // 设置内容区
    const setupContent = document.createElement('div');
    setupContent.className = 'setup-content';

    // 年级选择
    setupContent.innerHTML += `
      <div class="setup-section">
        <h3 class="section-title">📚 ${tx('wbWordSource')}</h3>
        <div class="grade-path">
          <div class="grade-grid" id="wb-grade-grid">
            ${[1,2,3,4,5,6,7,8,9].map(g =>
              `<button class="grade-btn" data-grade="${g}">${tx('wbGradeX').replace('{grade}', g)}</button>`
            ).join('')}
            <button class="grade-btn" data-grade="all">${tx('wbAllGrades')}</button>
          </div>
        </div>
      </div>
      
      <!-- 单元选择 -->
      <div class="setup-section" id="wb-unit-section">
        <h3 class="section-title">📖 ${tx('wbSelectUnit')}</h3>
        <div class="unit-grid" id="wb-unit-grid">
          <button class="unit-btn active" data-unit="all">${tx('wbAllUnits')}</button>
        </div>
      </div>
    `;
    wrapper.appendChild(setupContent);

    // 开始按钮
    const setupButtons = document.createElement('div');
    setupButtons.className = 'setup-buttons';
    setupButtons.innerHTML = `<button id="wb-go" class="menu-btn">${tx('wbStartBtn')}</button>`;
    wrapper.appendChild(setupButtons);

    // 将wrapper添加到容器
    c.appendChild(wrapper);

    // 年级选择事件
    setupContent.querySelectorAll('#wb-grade-grid .grade-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        setupContent.querySelectorAll('#wb-grade-grid .grade-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.s.grade = btn.dataset.grade === 'all' ? 'all' : parseInt(btn.dataset.grade);
        this._updateUnits();
        audioManager.playClick();
      });
    });

    // 开始游戏事件
    document.getElementById('wb-go').onclick = () => {
      if (!this.s.grade) {
        const firstGrade = setupContent.querySelector('#wb-grade-grid .grade-btn');
        if (firstGrade) {
          firstGrade.classList.add('active');
          this.s.grade = firstGrade.dataset.grade === 'all' ? 'all' : parseInt(firstGrade.dataset.grade);
          this._updateUnits();
        }
      }
      audioManager.playClick();
      this.startGame();
    };

    this._updateUnits();
  }

  _updateUnits() {
    const grid = document.getElementById('wb-unit-grid');
    if (!grid) return;
    const grade = this.s.grade;
    const tx = (k) => (window.app && window.app.t) ? window.app.t(k) : t(k);
    let html = `<button class="unit-btn active" data-unit="all">${tx('wbAllUnits')}</button>`;
    if (grade && grade !== 'all') {
      const units = wordData.getUnitsByGrade(parseInt(grade));
      units.forEach(u => {
        html += `<button class="unit-btn" data-unit="${u}">${tx('wbUnitX').replace('{unit}', u)}</button>`;
      });
    }
    grid.innerHTML = html;
    grid.querySelectorAll('.unit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        grid.querySelectorAll('.unit-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.s.unit = btn.dataset.unit;
        audioManager.playClick();
      });
    });
  }

  // ─── 游戏循环 ───
  startGame() {
    this.resetS();
    this.loadWordPool();
    
    // 使用所有单词
    this.initBubbles();
    
    // 计算第一关的时间
    const wordCount = this.wordPool.length;
    this.s.timeLimit = this.calcTimeForLevel(1, wordCount);
    this.s.timeLeft = this.s.timeLimit;
    
    this.render();
    this.begin();
  }

  resetS() {
    if (this.tmr) { clearInterval(this.tmr); this.tmr = null; }
    this.s.score = 0; this.s.combo = 0; this.s.maxCombo = 0;
    this.s.level = 1;
    this.s.playing = false; this.s.paused = false;
    this.s.sel = null;
    this.s.clearedPairs = 0;
    this.s.totalPairs = 0;
    this.wordPool = [];
    this.bubbles = [];
  }

  loadWordPool() {
    let ws = wordData.getWordsByGrade(this.s.grade, this.s.unit);
    if (!ws.length) ws = wordData.getWordsByGrade('all', 'all');
    this.wordPool = wbShuffle(ws);
  }

  initBubbles() {
    this.bubbles = [];
    // 使用所有单词，不再限制数量
    const words = [...this.wordPool];
    words.forEach((w, i) => {
      this.bubbles.push({
        id: i,
        word: w.word,
        meaning: w.meaning,
        phonetic: w.phonetic || '',
        rootAffix: w.rootAffix || '',
        example: w.example || '',
        cnActive: true,
        enActive: true
      });
    });
    this.s.totalPairs = this.bubbles.length;
    this.s.clearedPairs = 0;
  }

  render() {
    const c = document.getElementById('game-canvas-container');
    if (!c) return;
    c.innerHTML = '';
    c.style.cssText = 'width:100%;height:calc(100vh-120px);background:linear-gradient(135deg,#0F0C29,#302B63,#24243E);display:flex;flex-direction:column;align-items:center;overflow-y:auto;padding:12px;box-sizing:border-box;position:relative;';

    const tx = (k) => (window.app && window.app.t) ? window.app.t(k) : t(k);
    // 信息栏
    const info = document.createElement('div');
    info.className = 'wb-info-bar';
    info.style.position = 'relative';
    info.style.zIndex = '10';
    const mkS = (id, l, v, ic) => `<div class="wb-stat"><span class="wb-stat-icon">${ic}</span><div class="wb-stat-body"><span class="wb-stat-label">${l}</span><span class="wb-stat-val" id="${id}">${v}</span></div></div>`;
    info.innerHTML =
      mkS('wb-level', tx('wbLevel'), `${this.s.level}`, '💥') +
      mkS('wb-tmr', tx('wbTime'), `${this.s.timeLeft}s`, '⏱') +
      mkS('wb-limit', tx('wbLimit'), `${this.s.timeLimit}s`, '⏳') +
      mkS('wb-score', tx('wbScore'), '0', '⭐') +
      mkS('wb-combo', tx('wbCombo'), '0x', '🔥') +
      mkS('wb-pairs', tx('wbRemaining'), `${this.s.totalPairs - this.s.clearedPairs}/${this.s.totalPairs}`, '🎯');
    c.appendChild(info);

    // 爆炸容器 - 词云区域
    const blastArea = document.createElement('div');
    blastArea.className = 'wb-blast-area';
    blastArea.id = 'wb-blast-area';

    // 创建所有气泡元素，然后打乱顺序
    const allBubbleEls = [];
    this.bubbles.forEach(bubble => {
      if (!bubble.cnActive && !bubble.enActive) return;
      if (bubble.cnActive) allBubbleEls.push(this._mkBubble(bubble, 'cn'));
      if (bubble.enActive) allBubbleEls.push(this._mkBubble(bubble, 'en'));
    });
    // 打乱所有气泡元素的顺序，让中英文随机分布
    wbShuffle(allBubbleEls).forEach(el => blastArea.appendChild(el));
    c.appendChild(blastArea);

    // 控制按钮
    const ctrls = document.createElement('div');
    ctrls.className = 'wb-controls';
    ctrls.style.position = 'relative';
    ctrls.style.zIndex = '10';
    [
      { t: tx('wbPause'), cls: 'wb-ctrl-pause', fn: () => this.togglePause() },
      { t: tx('wbRestart'), cls: 'wb-ctrl-restart', fn: () => this.restart() },
      { t: tx('wbBack'), cls: 'wb-ctrl-back', fn: () => this.showSetup() }
    ].forEach(b => {
      const btn = document.createElement('button');
      btn.className = `wb-ctrl-btn ${b.cls}`;
      btn.textContent = b.t;
      btn.onclick = () => { audioManager.playClick(); b.fn(); };
      ctrls.appendChild(btn);
    });
    c.appendChild(ctrls);
  }

  _mkBubble(bubble, type) {
    const isCn = type === 'cn';
    const text = isCn ? bubble.meaning : bubble.word;
    const isActive = isCn ? bubble.cnActive : bubble.enActive;

    const el = document.createElement('div');
    el.className = `wb-bubble wb-bubble-${type}`;
    el.dataset.id = bubble.id;
    el.dataset.type = type;

    // 统一大小，不根据文本长度调整
    el.classList.add('wb-size-md');

    // 随机动画延迟，让气泡依次出现
    el.style.animationDelay = `${Math.random() * 0.3}s`;

    el.innerHTML = `
      <div class="wb-bubble-inner">
        <span class="wb-bubble-text">${text}</span>
      </div>
    `;

    if (!isActive) {
      el.style.display = 'none';
    }

    el.addEventListener('click', () => {
      if (!this.s.playing || this.s.paused) return;
      if (!isActive) return;
      this._onBubbleClick(bubble, type, el);
    });

    return el;
  }

  _onBubbleClick(bubble, type, el) {
    // 如果点击的是同类型（都选了中文或都选了英文），切换选中
    if (this.s.sel && this.s.sel.type === type) {
      // 取消之前的选中
      this.s.sel.el.classList.remove('wb-selected');
      // 选中新的
      el.classList.add('wb-selected');
      this.s.sel = { type, id: bubble.id, el };
      audioManager.playClick();
      // 点击英文单词时播放发音
      if (type === 'en') {
        audioManager.speak(bubble.word, 'en-US');
      }
      return;
    }

    // 如果没有选中任何东西
    if (!this.s.sel) {
      el.classList.add('wb-selected');
      this.s.sel = { type, id: bubble.id, el };
      audioManager.playClick();
      // 点击英文单词时播放发音
      if (type === 'en') {
        audioManager.speak(bubble.word, 'en-US');
      }
      return;
    }

    // 已有不同类型选中，尝试配对
    const prevSel = this.s.sel;
    const prevBubble = this.bubbles.find(b => b.id === prevSel.id);

    if (prevSel.id === bubble.id) {
      // 配对成功！
      this._onMatch(bubble, prevSel.el, el);
      prevSel.el.classList.remove('wb-selected');
      this.s.sel = null;
    } else {
      // 配对失败
      this._onFail(prevSel.el, el);
      prevSel.el.classList.remove('wb-selected');
      this.s.sel = null;
    }
  }

  _onMatch(bubble, el1, el2) {
    this.s.combo++;
    this.s.maxCombo = Math.max(this.s.maxCombo, this.s.combo);
    this.s.clearedPairs++;

    // 分数计算：基础100 + 连击加成
    let pts = 100 + (this.s.combo - 1) * 50;
    this.s.score += pts;

    audioManager.playMatchSuccess();
    this._float(`+${pts}`, '#FFD700');
    if (this.s.combo >= 3) this._float(`🔥 ${this.s.combo}连击！`, '#FF6B6B');

    // 爆炸动画
    this._blast(el1);
    this._blast(el2);

    // 标记不活跃
    bubble.cnActive = false;
    bubble.enActive = false;

    // 更新显示
    setTimeout(() => {
      el1.style.display = 'none';
      el2.style.display = 'none';
      this.updHUD();
    }, this.BLAST_MS);

    this.updHUD();

    // 检查关卡完成
    if (this.s.clearedPairs >= this.s.totalPairs) {
      setTimeout(() => this.nextLevel(), 800);
    }
  }

  _onFail(el1, el2) {
    this.s.combo = 0;
    audioManager.playMatchError();
    
    // 记录到错题本
    if (typeof wrongBook !== 'undefined') {
      const failedBubble = this.bubbles.find(b => b.id === this.s.sel.id);
      if (failedBubble) {
        wrongBook.addWrongWord({
          word: failedBubble.word,
          meaning: failedBubble.meaning || '',
          example: failedBubble.example || '',
          rootAffix: failedBubble.rootAffix || '',
          phonetic: failedBubble.phonetic || '',
          from: 'wordblast',
          grade: this.config ? this.config.grade : 'all'
        });
      }
    }
    
    this._float('再试试！', '#FF6B6B');

    // 闪烁红色
    [el1, el2].forEach(el => {
      el.classList.add('wb-shake');
      el.style.boxShadow = '0 0 20px #FF6B6B';
      setTimeout(() => {
        el.classList.remove('wb-shake');
        el.style.boxShadow = '';
      }, 600);
    });
    this.updHUD();
  }

  _blast(el) {
    el.classList.add('wb-blasting');

    // 创建爆炸粒子效果
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    for (let i = 0; i < 12; i++) {
      const particle = document.createElement('div');
      particle.className = 'wb-particle';
      const angle = (i / 12) * Math.PI * 2;
      const dist = 40 + Math.random() * 60;
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist;
      particle.style.cssText = `
        position:fixed;left:${cx}px;top:${cy}px;
        width:8px;height:8px;border-radius:50%;
        background:${['#FFD700','#FF6B6B','#FF8E53','#48BB78','#A78BFA'][Math.floor(Math.random()*5)]};
        pointer-events:none;z-index:9999;
        transform:translate(-50%,-50%);
        transition:all 0.5s cubic-bezier(0.25,0.46,0.45,0.94);
        opacity:1;
      `;
      document.body.appendChild(particle);
      requestAnimationFrame(() => {
        particle.style.transform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0)`;
        particle.style.opacity = '0';
      });
      setTimeout(() => particle.remove(), 600);
    }
  }

  begin() {
    this.s.playing = true;
    // 确保AudioContext已恢复（现代浏览器需要用户交互后才能播放音频）
    if (audioManager.audioContext && audioManager.audioContext.state === 'suspended') {
      audioManager.audioContext.resume();
    }
    this.startTmr();
    this._float(`💥 第${this.s.level}关 开始！`, '#FFD700');
    this.updHUD();
  }

  startTmr() {
    if (this.tmr) clearInterval(this.tmr);
    this.tmr = setInterval(() => {
      if (this.s.paused || !this.s.playing) return;
      this.s.timeLeft--;
      const el = document.getElementById('wb-tmr');
      if (el) {
        el.textContent = `${this.s.timeLeft}s`;
        if (this.s.timeLeft <= 10) el.style.color = '#FF6B6B';
        else el.style.color = '';
      }
      if (this.s.timeLeft <= 0) this.endGame(false);
    }, 1000);
  }

  nextLevel() {
    this.s.level++;
    this.s.clearedPairs = 0;
    
    // 计算新关卡的时间（递减）
    const wordCount = this.wordPool.length;
    this.s.timeLimit = this.calcTimeForLevel(this.s.level, wordCount);
    this.s.timeLeft = this.s.timeLimit;
    
    // 重新初始化气泡（使用相同的单词）
    this.initBubbles();
    this.render();
    const tx = (k) => (window.app && window.app.t) ? window.app.t(k) : t(k);
    this._float(tx('wbLevelUp').replace('{level}', this.s.level), '#A78BFA');
    this.begin();
  }

  endGame(won) {
    this.s.playing = false;
    if (this.tmr) { clearInterval(this.tmr); this.tmr = null; }
    const c = document.getElementById('game-canvas-container');
    if (!c) return;

    const tx = (k) => (window.app && window.app.t) ? window.app.t(k) : t(k);
    const stars = won ? (this.s.combo >= 5 ? 3 : this.s.combo >= 2 ? 2 : 1) : 0;
    const overlay = document.createElement('div');
    overlay.className = 'wb-overlay';
    const box = document.createElement('div');
    box.className = 'wb-result-box';
    box.innerHTML = `
      <div class="wb-result-emoji">${won ? '🎉' : '⏰'}</div>
      <h2 class="wb-result-title" style="color:${won ? '#48BB78' : '#FF6B6B'}">${won ? tx('wbWin') : tx('wbTimeUp')}</h2>
      <div class="wb-result-stars">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
      <div class="wb-result-sub">${stars}${tx('wbStarRating')}</div>
      <div class="wb-result-stats">
        <div class="wb-result-stat"><span class="wb-stat-num" style="color:#FFD700">${this.s.score}</span><span class="wb-stat-lbl">${tx('wbTotalScore')}</span></div>
        <div class="wb-result-stat"><span class="wb-stat-num" style="color:#FF6B6B">${this.s.maxCombo}x</span><span class="wb-stat-lbl">${tx('wbMaxCombo')}</span></div>
        <div class="wb-result-stat"><span class="wb-stat-num" style="color:#A78BFA">${this.s.level}</span><span class="wb-stat-lbl">${tx('wbReachedLevel')}</span></div>
      </div>
      <div class="wb-result-actions">
        <button class="wb-result-btn wb-result-retry">${tx('wbPlayAgain')}</button>
        <button class="wb-result-btn wb-result-back">${tx('wbBack')}</button>
      </div>`;
    overlay.appendChild(box);
    c.appendChild(overlay);
    if (won) audioManager.playComplete(); else audioManager.playError();
    overlay.querySelector('.wb-result-retry').onclick = () => { overlay.remove(); this.restart(); };
    overlay.querySelector('.wb-result-back').onclick = () => { overlay.remove(); this.showSetup(); };
  }

  // ─── HUD ───
  updHUD() {
    const se = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    se('wb-score', this.s.score);
    se('wb-combo', this.s.combo + 'x');
    se('wb-level', this.s.level);
    se('wb-limit', `${this.s.timeLimit}s`);
    se('wb-pairs', `${this.s.totalPairs - this.s.clearedPairs}/${this.s.totalPairs}`);
    const tmrEl = document.getElementById('wb-tmr');
    if (tmrEl) {
      tmrEl.textContent = `${this.s.timeLeft}s`;
      if (this.s.timeLeft <= 10) tmrEl.style.color = '#FF6B6B';
      else tmrEl.style.color = '';
    }
  }

  // ─── 控制 ───
  togglePause() {
    const tx = (k) => (window.app && window.app.t) ? window.app.t(k) : t(k);
    this.s.paused = !this.s.paused;
    if (this.s.paused) {
      this._float(tx('wbPaused'), '#A78BFA');
    } else {
      this._float(tx('wbResumed'), '#48BB78');
    }
  }

  restart() { this.startGame(); }

  _float(txt, color = '#FFD700') {
    const el = document.createElement('div');
    el.textContent = txt;
    el.className = 'wb-float';
    el.style.background = color;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  }
}

const wordBlastGame = new WordBlastGame();
if (typeof module !== 'undefined' && module.exports) module.exports = { WordBlastGame, wordBlastGame };
