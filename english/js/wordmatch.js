/**
 * 单词配对游戏 - WordMatch
 * 左右两列中英文配对，消除后随机出现新对，倒计时模式，难度递增
 */
function wmShuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / (0xFFFFFFFF / (i + 1) + 1) * (i + 1));
    if (j <= i) [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

class WordMatchGame {
  constructor() {
    this.s = {
      grade: null, unit: 'all',
      theme: 'magic',
      score: 0, combo: 0, maxCombo: 0,
      totalWords: 0,       // 总单词数
      matchedWords: 0,     // 已匹配数
      timeLeft: 0, timeLimit: 0,
      playing: false, paused: false,
      sel: null
    };
    this.pairs = [];        // 当前显示的5对
    this.wordPool = [];     // 完整的单词池（所有要匹配的单词）
    this.remainingPool = []; // 剩余未显示的单词
    this.usedWords = new Set(); // 当前显示中的单词
    this.tmr = null;
    this.VEIL_MS = 600;
    this.PAIRS_DISPLAY = 5; // 每次显示的配对数
    this.SECONDS_PER_WORD = 5; // 每个单词给的秒数
  }

  async init() { return true; }
  switchScene() { this.showSetup(); }

  // ─── 计算时间配置 ───
  calcTimeLimit(wordCount) {
    // 根据单词数量计算时间：每词5秒，最少60秒，最多300秒
    const time = Math.max(60, Math.min(300, wordCount * this.SECONDS_PER_WORD));
    return time;
  }

  // ─── 设置界面（参考大富翁风格） ───
  showSetup() {
    const c = document.getElementById('game-canvas-container');
    if (!c) return;
    c.innerHTML = '';
    // 不覆盖容器样式，保持全局CSS的#game-canvas-container样式

    // 创建wrapper包裹所有内容（参考大富翁的grade-sel-wrap）
    const wrapper = document.createElement('div');
    wrapper.className = 'wm-setup-wrap';

    // 游戏头部（返回按钮）
    const header = document.createElement('div');
    header.className = 'game-header';
    header.innerHTML = `
      <button class="back-btn" id="wm-back-btn">← ${t('back')}</button>
      <div class="game-title clickable-title" data-i18n="leaderboardTitle">${t('leaderboardTitle')}</div>
    `;
    wrapper.appendChild(header);
    header.querySelector('#wm-back-btn').onclick = () => {
      audioManager.playClick();
      window.app.showMainMenu();
    };
    // 点击header标题显示排行榜
    header.querySelector('.clickable-title').onclick = () => {
      audioManager.playClick();
      if (window.app && window.app.showLeaderboard) {
        window.app.showLeaderboard('wordmatch');
      }
    };

    // 设置页标题
    const setupHeader = document.createElement('div');
    setupHeader.className = 'setup-header';
    setupHeader.innerHTML = `
      <h2 class="game-title clickable-title" data-i18n="wordmatchTitle">${t('wordmatchTitle')}</h2>
      <p class="setup-subtitle">挑战你的单词记忆极限，配对消除，限时闯关！</p>
    `;
    wrapper.appendChild(setupHeader);
    // 点击标题显示排行榜
    setupHeader.querySelector('.clickable-title').onclick = () => {
      audioManager.playClick();
      if (window.app && window.app.showLeaderboard) {
        window.app.showLeaderboard('wordmatch');
      }
    };

    // 设置内容区
    const setupContent = document.createElement('div');
    setupContent.className = 'setup-content';

    // 年级选择
    setupContent.innerHTML += `
      <div class="setup-section">
        <h3 class="section-title">📚 ${t('wordSource')}</h3>
        <div class="grade-path">
          <div class="grade-grid" id="wm-grade-grid">
            ${[1,2,3,4,5,6,7,8,9].map(g =>
              `<button class="grade-btn" data-grade="${g}">${t('grade')} ${g}</button>`
            ).join('')}
            <button class="grade-btn" data-grade="all">${t('allGrades')}</button>
          </div>
        </div>
      </div>
      
      <!-- 单元选择 -->
      <div class="setup-section" id="wm-unit-section">
        <h3 class="section-title">📖 ${t('selectUnit')}</h3>
        <div class="unit-grid" id="wm-unit-grid">
          <button class="unit-btn active" data-unit="all">${t('allUnits')}</button>
        </div>
      </div>

    `;
    wrapper.appendChild(setupContent);

    // 开始按钮
    const setupButtons = document.createElement('div');
    setupButtons.className = 'setup-buttons';
    setupButtons.innerHTML = `<button id="wm-go" class="menu-btn">${t('startGame')}</button>`;
    wrapper.appendChild(setupButtons);

    // 将wrapper添加到容器
    c.appendChild(wrapper);

    // 年级选择事件
    setupContent.querySelectorAll('#wm-grade-grid .grade-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        setupContent.querySelectorAll('#wm-grade-grid .grade-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.s.grade = btn.dataset.grade === 'all' ? 'all' : parseInt(btn.dataset.grade);
        this._updateWmUnits();
        audioManager.playClick();
      });
    });

    // 开始游戏事件
    document.getElementById('wm-go').onclick = () => {
      if (!this.s.grade) {
        const firstGrade = setupContent.querySelector('#wm-grade-grid .grade-btn');
        if (firstGrade) {
          firstGrade.classList.add('active');
          this.s.grade = firstGrade.dataset.grade === 'all' ? 'all' : parseInt(firstGrade.dataset.grade);
          this._updateWmUnits();
        }
      }
      audioManager.playClick();
      this.startGame();
    };

    this._updateWmUnits();
  }

  _updateWmUnits() {
    const grid = document.getElementById('wm-unit-grid');
    if (!grid) return;
    const grade = this.s.grade;
    let html = `<button class="unit-btn active" data-unit="all">${t('allUnits')}</button>`;
    if (grade && grade !== 'all') {
      const units = wordData.getUnitsByGrade(parseInt(grade));
      units.forEach(u => {
        html += `<button class="unit-btn" data-unit="${u}">${t('selectUnit')} ${u}</button>`;
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
    // 计算时间：根据总单词数
    this.s.totalWords = this.wordPool.length;
    this.s.timeLimit = this.calcTimeLimit(this.s.totalWords);
    this.s.timeLeft = this.s.timeLimit;
    this.initPairs();
    this.render();
    this.begin();
  }

  resetS() {
    if (this.tmr) { clearInterval(this.tmr); this.tmr = null; }
    this.s.score = 0; this.s.combo = 0; this.s.maxCombo = 0;
    this.s.totalWords = 0; this.s.matchedWords = 0;
    this.s.playing = false; this.s.paused = false;
    this.s.sel = null;
    this.pairs = [];
    this.wordPool = [];
    this.remainingPool = [];
    this.usedWords = new Set();
  }

  loadWordPool() {
    let ws = wordData.getWordsByGrade(this.s.grade, this.s.unit);
    if (!ws.length) ws = wordData.getWordsByGrade('all', 'all');
    this.wordPool = wmShuffle([...ws]);
    this.remainingPool = wmShuffle([...ws]); // 剩余未显示的单词
    this.usedWords = new Set();
  }

  drawWord() {
    // 从剩余池中抽取
    if (this.remainingPool.length > 0) {
      const w = this.remainingPool.pop();
      this.usedWords.add(w.word);
      return w;
    }
    // 所有单词都已显示过（不应该发生，因为游戏应在所有单词匹配完后结束）
    return null;
  }

  initPairs() {
    this.pairs = [];
    for (let i = 0; i < this.PAIRS_DISPLAY; i++) {
      const w = this.drawWord();
      if (w) this.pairs.push({ id: i, word: w.word, meaning: w.meaning, phonetic: w.phonetic || '', rootAffix: w.rootAffix || '', example: w.example || '', active: true });
    }
  }

  render() {
    const c = document.getElementById('game-canvas-container');
    if (!c) return;
    c.innerHTML = '';
    c.style.cssText = 'width:100%;height:calc(100vh-120px);display:flex;flex-direction:column;align-items:center;overflow-y:auto;padding:12px;box-sizing:border-box;';
    // 应用主题
    const theme = this.s.theme || 'default';
    c.className = `wm-theme-${theme}`;

    // 信息栏
    const info = document.createElement('div');
    info.className = 'wm-info-bar';
    const mkS = (id, l, v, ic) => `<div class="wm-stat"><span class="wm-stat-icon">${ic}</span><div class="wm-stat-body"><span class="wm-stat-label">${l}</span><span class="wm-stat-val" id="${id}">${v}</span></div></div>`;
    info.innerHTML =
      mkS('wm-progress', '进度', `${this.s.matchedWords}/${this.s.totalWords}`, '📋') +
      mkS('wm-tmr', t('time'), `${this.s.timeLeft}s`, '⏱') +
      mkS('wm-score', t('score'), '0', '⭐') +
      mkS('wm-combo', t('combo'), '0x', '🔥');
    c.appendChild(info);

    // 两列配对区域
    const board = document.createElement('div');
    board.className = 'wm-board';

    // 标签行
    const header = document.createElement('div');
    header.className = 'wm-board-header';
    header.innerHTML = `
      <div class="wm-col-label">🔤 English</div>
      <div class="wm-col-label">📖 中文</div>
    `;
    c.appendChild(header);

    // 左列：英文（随机顺序）
    const leftCol = document.createElement('div');
    leftCol.className = 'wm-left-col';
    // 右列：中文（随机顺序）
    const rightCol = document.createElement('div');
    rightCol.className = 'wm-right-col';

    // 生成随机顺序的索引
    const leftOrder = wmShuffle([0,1,2,3,4]);
    const rightOrder = wmShuffle([0,1,2,3,4]);

    leftOrder.forEach(i => {
      const pair = this.pairs[i];
      if (!pair) return;
      const el = this.mkItem(pair, 'left', i);
      leftCol.appendChild(el);
    });

    rightOrder.forEach(i => {
      const pair = this.pairs[i];
      if (!pair) return;
      const el = this.mkItem(pair, 'right', i);
      rightCol.appendChild(el);
    });

    board.appendChild(leftCol);
    board.appendChild(rightCol);
    c.appendChild(board);

    // 控制按钮
    const ctrls = document.createElement('div');
    ctrls.className = 'wm-controls';
    [
      { t: `⏸ ${t('pause')}`, cls: 'wm-ctrl-pause', fn: () => this.togglePause() },
      { t: `🔄 ${t('restart')}`, cls: 'wm-ctrl-restart', fn: () => this.restart() },
      { t: `💡 ${t('hint')}`, cls: 'wm-ctrl-hint', fn: () => this.hint() },
      { t: `🏠 ${t('back')}`, cls: 'wm-ctrl-back', fn: () => this.showSetup() }
    ].forEach(b => {
      const btn = document.createElement('button');
      btn.className = `wm-ctrl-btn ${b.cls}`;
      btn.textContent = b.t;
      btn.onclick = () => { audioManager.playClick(); b.fn(); };
      ctrls.appendChild(btn);
    });
    c.appendChild(ctrls);
  }

  mkItem(pair, side, posIndex) {
    const el = document.createElement('div');
    const isActive = pair.active;
    const isLeft = side === 'left';
    const txt = isLeft ? pair.word : pair.meaning;
    const fs = isLeft ? 'calc(1em + 2px)' : '1em';

    el.className = `wm-item ${isLeft ? 'wm-left-item' : 'wm-right-item'} ${!isActive ? 'wm-inactive' : ''}`;
    el.dataset.side = side;
    el.dataset.index = posIndex;
    el.dataset.pairId = pair.id;
    el.innerHTML = `
      <span class="wm-item-text" style="font-size:${fs}">${txt}</span>
    `;

    el.addEventListener('click', () => {
      if (!pair.active) return;
      if (isLeft) this.onLeftClick(pair, el);
      else this.onRightClick(pair, el);
    });
    return el;
  }

  // ─── 交互逻辑 ───

  onLeftClick(pair, el) {
    if (!this.s.playing || this.s.paused) return;
    
    // 如果点击的是已选中的元素，取消选中
    if (el.classList.contains('selected')) {
      el.classList.remove('selected');
      this.s.sel = null;
      audioManager.playClick();
      return;
    }
    
    // 播放选中音效 + 朗读英文单词
    audioManager.playSelect();
    audioManager.speak(pair.word, 'en-US');
    
    // 清除之前的选中
    document.querySelectorAll('.wm-item.selected').forEach(e => {
      e.classList.remove('selected');
    });
    
    // 添加选中效果
    el.classList.add('selected');
    
    // 添加选中粒子特效
    this.createSelectParticles(el);
    
    this.s.sel = { side: 'left', pairId: pair.id, el };
  }

  onRightClick(pair, el) {
    if (!this.s.playing || this.s.paused) return;
    if (!this.s.sel || this.s.sel.side !== 'left') {
      // 没选左边，直接选右边也没用
      return;
    }
    audioManager.playClick();
    const leftPairId = this.s.sel.pairId;
    const leftEl = this.s.sel.el;

    // 检查匹配
    if (leftPairId === pair.id) {
      // 匹配成功
      this.onMatch(leftPairId, leftEl, el);
    } else {
      // 匹配失败
      this.onFail(leftEl, el);
    }
    this.s.sel = null;
    document.querySelectorAll('.wm-item.selected').forEach(e => {
      e.classList.remove('selected');
    });
  }

  onMatch(pairId, leftEl, rightEl) {
    this.s.combo++;
    this.s.maxCombo = Math.max(this.s.maxCombo, this.s.combo);
    this.s.matchedWords++;
    let pts = 100 * Math.min(this.s.combo, 10);
    this.s.score += pts;
    
    // 音效：基础成功音效
    audioManager.playMatchSuccess();
    
    // 连击音效
    if (this.s.combo >= 3) {
      this.showComboEffect(this.s.combo);
      audioManager.playComboSound(this.s.combo);
    }

    this.float(`+${pts}`, '#5B8C5A');

    // 成功闪光效果
    leftEl.classList.add('wm-success-flash');
    rightEl.classList.add('wm-success-flash');

    // 分数弹出
    this.showScorePopup(leftEl, `+${pts}`);

    // 卡片提前消失（0.3秒后碎片效果开始）
    leftEl.style.transition = 'opacity 0.5s ease-out';
    leftEl.style.opacity = '0';
    
    // 右侧卡片延迟消失
    setTimeout(() => {
      rightEl.style.transition = 'opacity 0.5s ease-out';
      rightEl.style.opacity = '0';
    }, 80);

    // 碎片爆炸特效（延迟0.3秒，让卡片先开始消失）
    setTimeout(() => {
      this.createFragmentExplosion(leftEl, '#667eea');
    }, 300);
    setTimeout(() => {
      this.createFragmentExplosion(rightEl, '#3b82f6');
    }, 380);

    setTimeout(() => {
      // 标记为不活跃
      const pair = this.pairs.find(p => p.id === pairId);
      if (pair) {
        pair.active = false;
        this.usedWords.delete(pair.word);
      }

      // 从剩余池抽取新单词
      const newWord = this.drawWord();
      if (newWord && pair) {
        pair.word = newWord.word;
        pair.meaning = newWord.meaning;
        pair.active = true;
      }

      // 重新渲染配对区域
      this.renderPairs();
      this.updHUD();
    }, this.VEIL_MS);

    this.updHUD();

    // 检查是否所有单词都匹配完成
    if (this.s.matchedWords >= this.s.totalWords) {
      setTimeout(() => this.endGame(true), 800);
    }
  }

  onFail(leftEl, rightEl) {
    this.s.combo = 0;
    audioManager.playMatchError();
    
    // 记录到错题本
    if (typeof wrongBook !== 'undefined') {
      const failedPair = this.pairs.find(p => p.id === this.s.sel.pairId);
      if (failedPair) {
        wrongBook.addWrongWord({
          word: failedPair.word,
          meaning: failedPair.meaning || '',
          example: failedPair.example || '',
          rootAffix: failedPair.rootAffix || '',
          phonetic: failedPair.phonetic || '',
          from: 'wordmatch',
          grade: this.config ? this.config.grade : 'all'
        }).catch(err => console.error('保存错题失败:', err));
      }
    }
    
    this.float(t('tryAgain'), '#D47B5A');
    // 匹配失败动画
    leftEl.classList.add('match-fail');
    rightEl.classList.add('match-fail');
    leftEl.classList.add('wm-fail');
    rightEl.classList.add('wm-fail');
    setTimeout(() => {
      leftEl.classList.remove('match-fail', 'wm-fail');
      rightEl.classList.remove('match-fail', 'wm-fail');
    }, 600);
    this.updHUD();
  }

  renderPairs() {
    const leftCol = document.querySelector('.wm-left-col');
    const rightCol = document.querySelector('.wm-right-col');
    if (!leftCol || !rightCol) return;

    leftCol.innerHTML = '';
    rightCol.innerHTML = '';

    const indices = Array.from({length: this.pairs.length}, (_, i) => i);
    const leftOrder = wmShuffle([...indices]);
    const rightOrder = wmShuffle([...indices]);

    leftOrder.forEach((i, idx) => {
      const pair = this.pairs[i];
      if (!pair) return;
      const el = this.mkItem(pair, 'left', i);
      // 新卡片入场动画
      el.style.animation = `wmSectionEnter 0.3s ease-out ${idx * 0.05}s both`;
      leftCol.appendChild(el);
    });

    rightOrder.forEach((i, idx) => {
      const pair = this.pairs[i];
      if (!pair) return;
      const el = this.mkItem(pair, 'right', i);
      // 新卡片入场动画
      el.style.animation = `wmSectionEnter 0.3s ease-out ${idx * 0.05}s both`;
      rightCol.appendChild(el);
    });
  }

  begin() {
    this.s.playing = true;
    // 确保AudioContext已恢复（现代浏览器需要用户交互后才能播放音频）
    if (audioManager.audioContext && audioManager.audioContext.state === 'suspended') {
      audioManager.audioContext.resume();
    }
    this.startTmr();
    this.float(`开始配对！共 ${this.s.totalWords} 个单词`, '#5B8C5A');
    this.updHUD();
  }

  startTmr() {
    if (this.tmr) clearInterval(this.tmr);
    this.tmr = setInterval(() => {
      if (this.s.paused || !this.s.playing) return;
      this.s.timeLeft--;
      const el = document.getElementById('wm-tmr');
      if (el) {
        el.textContent = `${this.s.timeLeft}s`;
        if (this.s.timeLeft <= 10) {
          el.style.color = '#D47B5A';
          this.updateTimeUrgency();
        } else {
          el.style.color = '';
          el.classList.remove('wm-time-urgent');
        }
      }
      if (this.s.timeLeft <= 0) this.endGame(false);
    }, 1000);
  }

  // 不再需要nextLevel，所有单词在一局内完成

  endGame(won) {
    this.s.playing = false;
    if (this.tmr) { clearInterval(this.tmr); this.tmr = null; }
    const c = document.getElementById('game-canvas-container');
    if (!c) return;

    const stars = won ? (this.s.combo >= 5 ? 3 : this.s.combo >= 2 ? 2 : 1) : 0;
    const overlay = document.createElement('div');
    overlay.className = 'wm-overlay';
    const box = document.createElement('div');
    box.className = 'wm-result-box';
    box.innerHTML = `
      <div class="wm-result-emoji">${won ? '🎉' : '😢'}</div>
      <h2 class="wm-result-title" style="color:${won ? '#5B8C5A' : '#D47B5A'}">${won ? '恭喜过关！' : '时间到！'}</h2>
      <div class="wm-result-stars">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
      <div class="wm-result-sub">${stars}星评价</div>
      <div class="wm-result-stats">
        <div class="wm-result-stat"><span class="wm-stat-num" style="color:#D47B5A">${this.s.score}</span><span class="wm-stat-lbl">总分</span></div>
        <div class="wm-result-stat"><span class="wm-stat-num" style="color:#D4944D">${this.s.maxCombo}x</span><span class="wm-stat-lbl">最大连击</span></div>
        <div class="wm-result-stat"><span class="wm-stat-num" style="color:#3D5A80">${this.s.matchedWords}/${this.s.totalWords}</span><span class="wm-stat-lbl">配对完成</span></div>
      </div>
      <div class="wm-result-actions">
        <button class="wm-result-btn wm-result-retry">🔄 再来一局</button>
        <button class="wm-result-btn wm-result-back">🏠 返回</button>
      </div>`;
    overlay.appendChild(box);
    c.appendChild(overlay);
    if (won) audioManager.playComplete(); else audioManager.playError();
    const retryBtn = overlay.querySelector('.wm-result-retry');
    const backBtn = overlay.querySelector('.wm-result-back');
    retryBtn.onclick = () => { overlay.remove(); this.restart(); };
    backBtn.onclick = () => { overlay.remove(); this.showSetup(); };

    // 保存排行榜成绩
    if (window.app && window.app.saveEnglishLeaderboard) {
      // 保存中：按钮显示loading，不可点击
      [retryBtn, backBtn].forEach(btn => {
        btn.disabled = true;
        btn.classList.add('wm-btn-loading');
      });
      const timeUsed = (this.s.timeLimit || 0) - (this.s.timeLeft || 0);
      window.app.saveEnglishLeaderboard('wordmatch', {
        score: this.s.score || 0,
        level: this.s.totalWords || 0,
        combo: this.s.maxCombo || 0,
        time: timeUsed > 0 ? timeUsed : (this.s.timeLimit || 0),
        grade: this.s.grade || 'all'
      }).finally(() => {
        // 保存完成后恢复按钮
        [retryBtn, backBtn].forEach(btn => {
          btn.disabled = false;
          btn.classList.remove('wm-btn-loading');
        });
      });
    }
  }

  // ─── HUD ───

  updHUD() {
    const se = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    se('wm-score', this.s.score);
    se('wm-combo', this.s.combo + 'x');
    se('wm-progress', `${this.s.matchedWords}/${this.s.totalWords}`);
    // 更新时间显示
    const tmrEl = document.getElementById('wm-tmr');
    if (tmrEl) {
      tmrEl.textContent = `${this.s.timeLeft}s`;
      if (this.s.timeLeft <= 10) {
        tmrEl.style.color = '#D47B5A';
        this.updateTimeUrgency();
      } else {
        tmrEl.style.color = '';
        tmrEl.classList.remove('wm-time-urgent');
      }
    }
  }

  // ─── 控制 ───

  togglePause() {
    this.s.paused = !this.s.paused;
    if (this.s.paused) {
      this.float('⏸ 已暂停', '#3D5A80');
    } else {
      this.float('▶ 继续', '#5B8C5A');
    }
  }

  restart() { this.startGame(); }

  hint() {
    if (!this.s.playing || this.s.paused) return;
    // 高亮一对可匹配的
    const activePairs = this.pairs.filter(p => p.active);
    if (!activePairs.length) return;
    const p = activePairs[Math.floor(Math.random() * activePairs.length)];
    document.querySelectorAll('.wm-item').forEach(el => {
      if (parseInt(el.dataset.pairId) === p.id) {
        el.classList.add('wm-hint');
        setTimeout(() => {
          el.classList.remove('wm-hint');
        }, 2000);
      }
    });
  }

  float(txt, color = '#D4944D') {
    const el = document.createElement('div');
    el.textContent = txt;
    el.className = 'wm-float';
    el.style.background = color;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  }

  // 粒子效果
  spawnParticles(el, color) {
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    for (let i = 0; i < 8; i++) {
      const p = document.createElement('div');
      p.className = 'wm-particle';
      p.style.left = cx + 'px';
      p.style.top = cy + 'px';
      p.style.background = color;
      const angle = (Math.PI * 2 * i) / 8;
      const dist = 30 + Math.random() * 30;
      p.style.setProperty('--tx', Math.cos(angle) * dist + 'px');
      p.style.setProperty('--ty', Math.sin(angle) * dist + 'px');
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 800);
    }
  }

  // 碎片爆炸特效
  createFragmentExplosion(el, color) {
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const width = rect.width;
    const height = rect.height;
    
    // 碎片网格大小
    const cols = 5;
    const rows = 4;
    const fragmentWidth = width / cols;
    const fragmentHeight = height / rows;
    
    // 获取元素的计算样式
    const computedStyle = window.getComputedStyle(el);
    const bgColor = computedStyle.backgroundColor;
    const borderColor = computedStyle.borderColor;
    const borderRadius = computedStyle.borderRadius;
    
    // 创建碎片容器
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = rect.left + 'px';
    container.style.top = rect.top + 'px';
    container.style.width = width + 'px';
    container.style.height = height + 'px';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '1000';
    container.style.overflow = 'visible';
    
    // 创建碎片
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const fragment = document.createElement('div');
        fragment.className = 'wm-fragment';
        
        // 设置碎片位置和大小（加入轻微随机偏移，让碎片不完全规则）
        const left = col * fragmentWidth + (Math.random() - 0.5) * 3;
        const top = row * fragmentHeight + (Math.random() - 0.5) * 3;
        const fw = fragmentWidth + (Math.random() - 0.5) * 4;
        const fh = fragmentHeight + (Math.random() - 0.5) * 4;
        fragment.style.left = left + 'px';
        fragment.style.top = top + 'px';
        fragment.style.width = fw + 'px';
        fragment.style.height = fh + 'px';
        
        // 设置碎片样式
        fragment.style.background = bgColor;
        fragment.style.borderColor = borderColor;
        // 随机圆角，让碎片形状更自然不规则
        const randRadius = [
          Math.random() * 8,
          Math.random() * 8,
          Math.random() * 8,
          Math.random() * 8,
        ];
        fragment.style.borderRadius = `${randRadius[0]}px ${randRadius[1]}px ${randRadius[2]}px ${randRadius[3]}px`;
        
        // 计算碎片飞散方向（从中心向外）
        const fragmentCx = left + fragmentWidth / 2;
        const fragmentCy = top + fragmentHeight / 2;
        const dx = fragmentCx - width / 2;
        const dy = fragmentCy - height / 2;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        
        // 设置飞散距离（随机化，边缘碎片飞得更远）
        const baseDistance = 60 + Math.random() * 40;
        const edgeFactor = 1 + (distance / (Math.sqrt(width * width + height * height) / 2)) * 0.5;
        const flyDistance = baseDistance * edgeFactor;
        
        // 计算飞散方向（添加随机偏移）
        const randomAngle = angle + (Math.random() - 0.5) * 0.5;
        const tx = Math.cos(randomAngle) * flyDistance;
        
        // 垂直方向：大部分向上飞，但添加重力效果
        const tyBase = Math.sin(randomAngle) * flyDistance;
        const gravityEffect = 50 + Math.random() * 30; // 重力效果
        const ty = tyBase - gravityEffect; // 向上飞
        
        // 设置旋转角度（边缘碎片旋转更多）
        const rotation = (Math.random() - 0.5) * 360 * edgeFactor;
        
        // 设置CSS变量
        fragment.style.setProperty('--tx20', (tx * 0.15) + 'px');
        fragment.style.setProperty('--ty20', (ty * 0.15) + 'px');
        fragment.style.setProperty('--rot20', (rotation * 0.15) + 'deg');
        fragment.style.setProperty('--tx100', tx + 'px');
        fragment.style.setProperty('--ty100', ty + 'px');
        fragment.style.setProperty('--rot100', rotation + 'deg');
        
        // 添加随机延迟，让碎片不同时飞散
        const delay = Math.random() * 100;
        fragment.style.animationDelay = delay + 'ms';
        
        // 添加碎片内容（显示部分文本）
        const content = document.createElement('div');
        content.className = 'wm-fragment-content';
        
        // 获取原始文本
        const textEl = el.querySelector('.wm-item-text');
        if (textEl) {
          const text = textEl.textContent;
          // 根据碎片位置显示不同部分的文本
          const charIndex = Math.floor((col / cols) * text.length);
          const charCount = Math.ceil(text.length / cols);
          content.textContent = text.substring(charIndex, charIndex + charCount);
        }
        
        fragment.appendChild(content);
        
        container.appendChild(fragment);
        
        // 碎片飞散后移除
        setTimeout(() => {
          fragment.remove();
        }, 1000);
      }
    }
    
    // 添加火花粒子效果
    this.createSparkParticles(container, width, height, color);
    
    document.body.appendChild(container);
    
    // 容器移除（等待所有碎片动画完成）
    setTimeout(() => {
      container.remove();
    }, 1200);
  }

  // 创建火花粒子效果
  createSparkParticles(container, width, height, color) {
    const sparkCount = 8;
    
    for (let i = 0; i < sparkCount; i++) {
      const spark = document.createElement('div');
      spark.style.position = 'absolute';
      spark.style.width = '3px';
      spark.style.height = '3px';
      spark.style.borderRadius = '50%';
      spark.style.background = '#FFD700';
      spark.style.boxShadow = '0 0 6px #FFD700, 0 0 12px rgba(255, 215, 0, 0.5)';
      spark.style.pointerEvents = 'none';
      
      // 随机位置（在碎片区域内）
      const startX = Math.random() * width;
      const startY = Math.random() * height;
      spark.style.left = startX + 'px';
      spark.style.top = startY + 'px';
      
      // 随机飞散方向
      const angle = Math.random() * Math.PI * 2;
      const distance = 50 + Math.random() * 50;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance - 20; // 向上偏移
      
      // 设置动画
      spark.style.animation = `wmSparkFly 0.6s ease-out forwards`;
      spark.style.setProperty('--tx', tx + 'px');
      spark.style.setProperty('--ty', ty + 'px');
      
      // 随机延迟
      spark.style.animationDelay = (Math.random() * 200) + 'ms';
      
      container.appendChild(spark);
      
      // 移除火花
      setTimeout(() => {
        spark.remove();
      }, 800);
    }
  }

  // 选中粒子特效
  createSelectParticles(el) {
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    
    // 创建选中粒子容器
    const container = document.createElement('div');
    container.className = 'wm-select-particles';
    container.style.left = cx + 'px';
    container.style.top = cy + 'px';
    
    // 创建多个小粒子
    for (let i = 0; i < 8; i++) {
      const p = document.createElement('div');
      p.className = 'wm-select-particle';
      p.style.background = '#667eea';
      const angle = (Math.PI * 2 * i) / 8 + (Math.random() - 0.5) * 0.5;
      const dist = 20 + Math.random() * 25;
      p.style.setProperty('--tx', Math.cos(angle) * dist + 'px');
      p.style.setProperty('--ty', Math.sin(angle) * dist + 'px');
      p.style.animationDelay = `${Math.random() * 0.1}s`;
      container.appendChild(p);
    }
    
    // 创建中心光点
    const center = document.createElement('div');
    center.className = 'wm-select-center';
    center.style.background = '#667eea';
    container.appendChild(center);
    
    document.body.appendChild(container);
    setTimeout(() => container.remove(), 600);
  }

  // 连击特效 - 显示在 header 行
  showComboEffect(combo) {
    const header = document.querySelector('.wm-board-header');
    if (!header) return;
    const rect = header.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = 'wm-combo-effect';
    el.textContent = `🔥 ${combo}x COMBO!`;
    // 定位在 header 行的上方中央
    el.style.position = 'fixed';
    el.style.left = (rect.left + rect.width / 2) + 'px';
    el.style.top = (rect.top + rect.height / 2) + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  }

  // 分数弹出
  showScorePopup(el, text) {
    const popup = document.createElement('div');
    popup.className = 'wm-score-popup';
    popup.textContent = text;
    el.appendChild(popup);
    setTimeout(() => popup.remove(), 1000);
  }

  // 关卡过渡动画（不再需要）

  // 时间紧迫动画
  updateTimeUrgency() {
    const tmrEl = document.getElementById('wm-tmr');
    if (!tmrEl) return;
    if (this.s.timeLeft <= 10) {
      tmrEl.classList.add('wm-time-urgent');
    } else {
      tmrEl.classList.remove('wm-time-urgent');
    }
  }

  handleResize() {}
}

const wordMatchGame = new WordMatchGame();
if (typeof module !== 'undefined' && module.exports) module.exports = { WordMatchGame, wordMatchGame };
