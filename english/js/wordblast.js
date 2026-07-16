/**
 * 单词填空游戏 - WordBlast (V3)
 * 显示中文意思、音标和英文句子（单词留空），用户输入对应的英文单词
 * 支持单词读音按钮和自动朗读句子
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
      currentIdx: 0,  // 当前题目索引
      correctCount: 0,
      wrongCount: 0,
      totalQuestions: 0
    };
    this.wordPool = [];
    this.questions = []; // {id, word, meaning, sentence, blankedSentence}
    this.tmr = null;
    this.BLAST_MS = 500;

    // 动态时间配置
    this.SECONDS_PER_WORD = 8; // 每个单词的基础时间（秒），输入模式需要更多时间
    this.MIN_TIME = 30;
    this.MAX_TIME = 360;
    this.TIME_DECREASE_RATIO = 0.15;

    // 监听语言变更事件
    document.addEventListener('languageChanged', () => {
      const setupEl = document.getElementById('wb-back-btn');
      const resultBox = document.querySelector('.wb-result-box');
      if (setupEl || resultBox) {
        this.showSetup();
      } else if (this.s.playing) {
        this._renderQuestion();
      }
    });
  }

  async init() { return true; }
  switchScene() { this.showSetup(); }

  // 动态计算时间
  calcTimeForLevel(level, wordCount) {
    if (level === 1) {
      const baseTime = wordCount * this.SECONDS_PER_WORD;
      const doubledTime = baseTime * 2;
      return Math.max(this.MIN_TIME, Math.min(this.MAX_TIME, doubledTime));
    }
    const baseTime = this.calcTimeForLevel(1, wordCount);
    const decrease = Math.pow(1 - this.TIME_DECREASE_RATIO, level - 1);
    return Math.max(this.MIN_TIME, Math.floor(baseTime * decrease));
  }

  /**
   * 将句子中的目标单词替换为下划线
   */
  _blankWord(sentence, word) {
    if (!sentence || !word) return sentence || '';

    // 常见词形变化后缀，按长度降序排列优先匹配
    const suffixes = ['', 's', 'es', 'ed', 'd', 'ing', 'er', 'est', 'ly', 'tion', 'sion', 'ment', 'ness', 'ful', 'less', 'ous', 'ive', 'able', 'ible', 'al', 'ial', 'y', 'ily', 'ty', 'ity', 'ance', 'ence', 'ant', 'ent', 'ually', 'ally'];

    // 构建匹配所有词形变化的模式
    const patterns = [];
    patterns.push(word);
    for (const suffix of suffixes) {
      if (suffix) patterns.push(word + suffix);
    }
    // y -> ies
    if (word.endsWith('y')) {
      patterns.push(word.slice(0, -1) + 'ies');
      patterns.push(word.slice(0, -1) + 'ied');
      patterns.push(word.slice(0, -1) + 'ier');
    }
    // e 结尾的去 e 加后缀
    if (word.endsWith('e')) {
      patterns.push(word.slice(0, -1) + 'ing');
      patterns.push(word.slice(0, -1) + 'able');
    }
    // 双写辅音
    if (word.length >= 3 && /[aeiou][^aeiou]$/.test(word)) {
      const last = word[word.length - 1];
      patterns.push(word + last + 'ed');
      patterns.push(word + last + 'ing');
    }

    // 去重并按长度降序排列，优先匹配更长的词
    const unique = [...new Set(patterns.map(p => p.toLowerCase()))];
    unique.sort((a, b) => b.length - a.length);

    // 直接用 replace 尝试每种模式，避免 regex.test() 的 lastIndex 问题
    for (const pat of unique) {
      const escaped = pat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // 如果单词包含句点，则不使用单词边界，因为 \b 无法正确处理句点
      const useWordBoundary = !pat.includes('.');
      let regex;
      if (useWordBoundary) {
        regex = new RegExp('\\b' + escaped + '\\b', 'gi');
      } else {
        // 对于包含句点的单词，使用更宽松的匹配：允许单词前后有非单词字符或字符串边界
        regex = new RegExp('(?:(?<=\\W)|^)' + escaped + '(?=\\W|$)', 'gi');
      }
      const replaced = sentence.replace(regex, (match) => '_'.repeat(Math.max(match.length, 3)));
      if (replaced !== sentence) {
        return replaced;
      }
    }

    // 最终兜底：原句（不应发生）
    console.warn('无法在句子中找到单词:', word, sentence);
    return sentence;
  }

  // ─── 设置界面 ───
  showSetup() {
    const c = document.getElementById('game-canvas-container');
    if (!c) return;
    c.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'wb-setup-wrap';

    const tx = (k) => (window.app && window.app.t) ? window.app.t(k) : t(k);

    // 游戏头部
    const header = document.createElement('div');
    header.className = 'game-header';
    header.innerHTML = `
      <button class="back-btn" id="wb-back-btn">← ${tx('back')}</button>
      <div class="game-title clickable-title" data-i18n="leaderboardTitle">${tx('leaderboardTitle')}</div>
    `;
    wrapper.appendChild(header);
    header.querySelector('#wb-back-btn').onclick = () => {
      audioManager.playClick();
      if (this.tmr) { clearInterval(this.tmr); this.tmr = null; }
      this.s.playing = false;
      this.s.paused = false;
      window.app.showMainMenu();
    };
    header.querySelector('.clickable-title').onclick = () => {
      audioManager.playClick();
      if (window.app && window.app.showLeaderboard) {
        window.app.showLeaderboard('wordblast');
      }
    };

    // 设置页标题
    const setupHeader = document.createElement('div');
    setupHeader.className = 'setup-header';
    setupHeader.innerHTML = `
      <h2 class="game-title clickable-title" data-i18n="wbTitle">${tx('wbTitle')}</h2>
      <p class="setup-subtitle">${tx('wbDesc')}</p>
    `;
    wrapper.appendChild(setupHeader);
    setupHeader.querySelector('.clickable-title').onclick = () => {
      audioManager.playClick();
      if (window.app && window.app.showLeaderboard) {
        window.app.showLeaderboard('wordblast');
      }
    };

    // 设置内容区
    const setupContent = document.createElement('div');
    setupContent.className = 'setup-content';

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
    this.initQuestions();

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
    this.s.currentIdx = 0;
    this.s.correctCount = 0;
    this.s.wrongCount = 0;
    this.s.totalQuestions = 0;
    this.wordPool = [];
    this.questions = [];
  }

  loadWordPool() {
    let ws = wordData.getWordsByGrade(this.s.grade, this.s.unit);
    if (!ws.length) ws = wordData.getWordsByGrade('all', 'all');
    this.wordPool = wbShuffle(ws);
  }

  initQuestions() {
    this.questions = [];
    const words = [...this.wordPool];
    words.forEach((w, i) => {
      const sentence = w.example || '';
      const blankedSentence = this._blankWord(sentence, w.word);
      this.questions.push({
        id: i,
        word: w.word.toLowerCase(),
        meaning: w.meaning || '',
        phonetic: w.phonetic || '',
        rootAffix: w.rootAffix || '',
        example: sentence,
        blankedSentence: blankedSentence
      });
    });
    this.s.totalQuestions = this.questions.length;
    this.s.currentIdx = 0;
    this.s.correctCount = 0;
    this.s.wrongCount = 0;
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
      mkS('wb-time-remaining', tx('wbTime'), `${this.s.timeLeft}s/${this.s.timeLimit}s`, '⏱') +
      mkS('wb-correct', tx('wbCorrect'), '0', '✅') +
      mkS('wb-wrong', tx('wbWrong'), '0', '❌') +
      mkS('wb-progress', tx('wbRemaining'), `${this.s.totalQuestions - this.s.currentIdx}`, '🎯');
    c.appendChild(info);

    // 题目卡片区域
    const cardArea = document.createElement('div');
    cardArea.className = 'wb-card-area';
    cardArea.id = 'wb-card-area';
    c.appendChild(cardArea);

    // 渲染第一题
    this._renderQuestion();

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

  _renderQuestion() {
    const cardArea = document.getElementById('wb-card-area');
    if (!cardArea) return;

    const tx = (k) => (window.app && window.app.t) ? window.app.t(k) : t(k);

    // 检查是否已完成所有题目
    if (this.s.currentIdx >= this.questions.length) {
      setTimeout(() => this.nextLevel(), 300);
      return;
    }

    const q = this.questions[this.s.currentIdx];
    cardArea.innerHTML = '';

    // 题目卡片
    const card = document.createElement('div');
    card.className = 'wb-card';
    card.id = 'wb-current-card';

    // 中文意思
    const meaningEl = document.createElement('div');
    meaningEl.className = 'wb-card-meaning';
    meaningEl.textContent = q.meaning;
    card.appendChild(meaningEl);

    // 音标显示
    if (q.phonetic) {
      const phoneticEl = document.createElement('div');
      phoneticEl.className = 'wb-card-phonetic';
      phoneticEl.textContent = q.phonetic;
      card.appendChild(phoneticEl);
    }

    // 发音按钮区域
    const audioBtnWrap = document.createElement('div');
    audioBtnWrap.className = 'wb-audio-btn-wrap';

    // 单词发音按钮
    const wordAudioBtn = document.createElement('button');
    wordAudioBtn.className = 'wb-audio-btn wb-word-audio-btn';
    wordAudioBtn.innerHTML = '🔊 ' + tx('wbPlayWord');
    wordAudioBtn.onclick = (e) => {
      e.preventDefault();
      audioManager.playClick();
      audioManager.speak(q.word, 'en-US');
    };
    audioBtnWrap.appendChild(wordAudioBtn);

    // 句子朗读按钮
    if (q.example) {
      const sentenceAudioBtn = document.createElement('button');
      sentenceAudioBtn.className = 'wb-audio-btn wb-sentence-audio-btn';
      sentenceAudioBtn.innerHTML = '🗣️ ' + tx('wbPlaySentence');
      sentenceAudioBtn.onclick = (e) => {
        e.preventDefault();
        audioManager.playClick();
        audioManager.playSentence(q.example);
      };
      audioBtnWrap.appendChild(sentenceAudioBtn);
    }

    card.appendChild(audioBtnWrap);

    // 英文句子（单词留空）
    const sentenceEl = document.createElement('div');
    sentenceEl.className = 'wb-card-sentence';
    sentenceEl.textContent = q.blankedSentence;
    card.appendChild(sentenceEl);

    // 输入区域
    const inputWrap = document.createElement('div');
    inputWrap.className = 'wb-input-wrap';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'wb-input';
    input.id = 'wb-input';
    input.placeholder = tx('wbInputPlaceholder');
    input.autocomplete = 'off';
    input.autocapitalize = 'off';
    input.spellcheck = false;
    inputWrap.appendChild(input);

    const submitBtn = document.createElement('button');
    submitBtn.className = 'wb-submit-btn';
    submitBtn.textContent = '✓';
    submitBtn.title = tx('wbSubmit');
    inputWrap.appendChild(submitBtn);

    card.appendChild(inputWrap);

    // 跳过按钮（右上角）
    const skipBtn = document.createElement('button');
    skipBtn.className = 'wb-skip-btn wb-skip-btn-top';
    skipBtn.textContent = tx('wbSkip');
    skipBtn.title = tx('wbSkipHint');
    skipBtn.onclick = (e) => {
      e.preventDefault();
      audioManager.playClick();
      this._skipQuestion(q, card);
    };
    card.appendChild(skipBtn);

    // 反馈区域
    const feedbackEl = document.createElement('div');
    feedbackEl.className = 'wb-feedback';
    feedbackEl.id = 'wb-feedback';
    card.appendChild(feedbackEl);

    cardArea.appendChild(card);

    // 绑定事件
    const handleSubmit = () => {
      if (!this.s.playing || this.s.paused) return;
      const answer = input.value.trim();
      if (!answer) return;
      this._checkAnswer(q, answer, card);
    };

    submitBtn.onclick = handleSubmit;
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    });

    // 自动聚焦
    setTimeout(() => input.focus(), 100);

    // 自动朗读句子
    if (q.example && !this.s.paused) {
      setTimeout(() => {
        audioManager.playSentence(q.example);
      }, 100);
    }
  }

  _checkAnswer(q, answer, card) {
    const isCorrect = answer.toLowerCase() === q.word;
    const feedbackEl = document.getElementById('wb-feedback');
    const input = document.getElementById('wb-input');
    const tx = (k) => (window.app && window.app.t) ? window.app.t(k) : t(k);

    if (isCorrect) {
      // 正确
      this.s.combo++;
      this.s.maxCombo = Math.max(this.s.maxCombo, this.s.combo);
      this.s.correctCount++;

      let pts = 100 + (this.s.combo - 1) * 50;
      this.s.score += pts;

      audioManager.playMatchSuccess();
      this._float(`+${pts}`, '#FFD700');
      if (this.s.combo >= 3) this._float(`🔥 ${this.s.combo}连击！`, '#FF6B6B');

      if (feedbackEl) {
        feedbackEl.className = 'wb-feedback wb-feedback-correct';
        feedbackEl.textContent = '✓ ' + q.word;
      }

      // 禁用输入
      if (input) {
        input.disabled = true;
        input.className = 'wb-input wb-input-correct';
      }

      // 爆炸动画后进入下一题
      setTimeout(() => {
        this.s.currentIdx++;
        this.updHUD();
        this._renderQuestion();
      }, 800);

    } else {
      // 错误
      this.s.combo = 0;
      this.s.wrongCount++;
      audioManager.playMatchError();

      // 记录到错题本
      if (typeof wrongBook !== 'undefined') {
        wrongBook.addWrongWord({
          word: q.word,
          meaning: q.meaning || '',
          example: q.example || '',
          rootAffix: q.rootAffix || '',
          phonetic: q.phonetic || '',
          from: 'wordblast',
          grade: this.s.grade || 'all'
        }).catch(err => console.error('保存错题失败:', err));
      }

      if (feedbackEl) {
        feedbackEl.className = 'wb-feedback wb-feedback-wrong';
        feedbackEl.textContent = '✗ ' + tx('wbTryAgain');
      }

      if (input) {
        input.className = 'wb-input wb-input-wrong';
        input.focus();
        // 当用户开始输入时，清除错误样式
        const clearErrorOnInput = () => {
          input.className = 'wb-input';
          if (feedbackEl) {
            feedbackEl.className = 'wb-feedback';
            feedbackEl.textContent = '';
          }
          input.removeEventListener('input', clearErrorOnInput);
        };
        input.addEventListener('input', clearErrorOnInput);
      }




    }

    this.updHUD();
  }

  _skipQuestion(q, card) {
    if (!this.s.playing || this.s.paused) return;

    const feedbackEl = document.getElementById('wb-feedback');
    const input = document.getElementById('wb-input');
    const tx = (k) => (window.app && window.app.t) ? window.app.t(k) : t(k);

    // 记录到错题本
    if (typeof wrongBook !== 'undefined') {
      wrongBook.addWrongWord({
        word: q.word,
        meaning: q.meaning || '',
        example: q.example || '',
        rootAffix: q.rootAffix || '',
        phonetic: q.phonetic || '',
        from: 'wordblast',
        grade: this.s.grade || 'all'
      }).catch(err => console.error('保存错题失败:', err));
    }

    // combo归零，增加错误计数
    this.s.combo = 0;
    this.s.wrongCount++;

    // 显示跳过反馈
    if (feedbackEl) {
      feedbackEl.className = 'wb-feedback wb-feedback-skip';
      feedbackEl.textContent = q.word;
    }

    // 禁用输入
    if (input) {
      input.disabled = true;
      input.className = 'wb-input wb-input-skip';
    }

    // 禁用跳过按钮
    const skipBtn = card.querySelector('.wb-skip-btn');
    if (skipBtn) {
      skipBtn.disabled = true;
    }

    // 跳过动画后进入下一题
    setTimeout(() => {
      this.s.currentIdx++;
      this.updHUD();
      this._renderQuestion();
    }, 800);
  }

  begin() {
    this.s.playing = true;
    if (audioManager.audioContext && audioManager.audioContext.state === 'suspended') {
      audioManager.audioContext.resume();
    }
    this.startTmr();
    this.updHUD();
  }

  startTmr() {
    if (this.tmr) clearInterval(this.tmr);
    this.tmr = setInterval(() => {
      if (this.s.paused || !this.s.playing) return;
      this.s.timeLeft--;
      const el = document.getElementById('wb-time-remaining');
      if (el) {
        el.textContent = `${this.s.timeLeft}s/${this.s.timeLimit}s`;
        if (this.s.timeLeft <= 10) el.style.color = '#FF6B6B';
        else el.style.color = '';
      }
      if (this.s.timeLeft <= 0) this.endGame(false);
    }, 1000);
  }

  nextLevel() {
    this.s.level++;
    this.s.currentIdx = 0;
    this.s.correctCount = 0;
    this.s.wrongCount = 0;

    const wordCount = this.wordPool.length;
    this.s.timeLimit = this.calcTimeForLevel(this.s.level, wordCount);
    this.s.timeLeft = this.s.timeLimit;

    this.initQuestions();
    this.render();
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
        <div class="wb-result-stat"><span class="wb-stat-num" style="color:#48BB78">${this.s.correctCount}</span><span class="wb-stat-lbl">${tx('wbTotalScore')}</span></div>
        <div class="wb-result-stat"><span class="wb-stat-num" style="color:#FF6B6B">${this.s.wrongCount}</span><span class="wb-stat-lbl">${tx('wbMaxCombo')}</span></div>
      </div>
      <div class="wb-result-actions">
        <button class="wb-result-btn wb-result-retry">${tx('wbPlayAgain')}</button>
        <button class="wb-result-btn wb-result-back">${tx('wbBack')}</button>
      </div>`;
    overlay.appendChild(box);
    c.appendChild(overlay);
    if (won) audioManager.playComplete(); else audioManager.playError();
    const retryBtn = overlay.querySelector('.wb-result-retry');
    const backBtn = overlay.querySelector('.wb-result-back');
    retryBtn.onclick = () => { overlay.remove(); this.restart(); };
    backBtn.onclick = () => { overlay.remove(); this.showSetup(); };

    if (window.app && window.app.saveEnglishLeaderboard) {
      // 保存中：按钮显示loading，不可点击
      [retryBtn, backBtn].forEach(btn => {
        btn.disabled = true;
        btn.classList.add('wb-btn-loading');
      });
      const timeUsed = (this.s.timeLimit || 0) - (this.s.timeLeft || 0);
      window.app.saveEnglishLeaderboard('wordblast', {
        score: this.s.correctCount || 0,
        level: this.s.level || 1,
        combo: this.s.wrongCount || 0,
        time: timeUsed > 0 ? timeUsed : (this.s.timeLimit || 0),
        grade: this.s.grade || 'all'
      }).finally(() => {
        // 保存完成后恢复按钮
        [retryBtn, backBtn].forEach(btn => {
          btn.disabled = false;
          btn.classList.remove('wb-btn-loading');
        });
      });
    }
  }

  // ─── HUD ───
  updHUD() {
    const se = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    se('wb-time-remaining', `${this.s.timeLeft}s/${this.s.timeLimit}s`);
    se('wb-correct', this.s.correctCount);
    se('wb-wrong', this.s.wrongCount);
    se('wb-progress', `${this.s.totalQuestions - this.s.currentIdx}`);
    
    // 时间警告样式
    const timeEl = document.getElementById('wb-time-remaining');
    if (timeEl) {
      if (this.s.timeLeft <= 10) timeEl.style.color = '#FF6B6B';
      else timeEl.style.color = '';
    }
  }

  // ─── 控制 ───
  togglePause() {
    const tx = (k) => (window.app && window.app.t) ? window.app.t(k) : t(k);
    this.s.paused = !this.s.paused;
    if (this.s.paused) {
      this._float(tx('wbPaused'), '#A78BFA');
      // 暂停时禁用输入
      const input = document.getElementById('wb-input');
      if (input) input.disabled = true;
    } else {
      this._float(tx('wbResumed'), '#48BB78');
      // 恢复时启用输入
      const input = document.getElementById('wb-input');
      if (input) { input.disabled = false; input.focus(); }
    }
  }

  restart() { this.startGame(); }

  _float(txt, color = '#FFD700') {
    const el = document.createElement('div');
    el.textContent = txt;
    el.className = 'wb-float';
    el.style.background = color;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 750);
  }
}

const wordBlastGame = new WordBlastGame();
if (typeof module !== 'undefined' && module.exports) module.exports = { WordBlastGame, wordBlastGame };
