/**
 * 英语单词大富翁游戏引擎 - 纯DOM实现
 */

// 使用 crypto.getRandomValues 实现均匀分布的随机整数
function secureRandomInt(min, max) {
    const range = max - min + 1;
    const maxValid = Math.floor(0xFFFFFFFF / range) * range;
    let r;
    do {
        const arr = new Uint32Array(1);
        crypto.getRandomValues(arr);
        r = arr[0];
    } while (r >= maxValid);
    return min + (r % range);
}

// 使用 Fisher-Yates 洗牌算法 + crypto 随机源
function secureShuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = secureRandomInt(0, i);
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

class GameEngine {
    constructor() {
        this.currentScene = null;
        this.isInitialized = false;
        this.monopolyState = null;
        this.gameState = {
            currentGrade: null,
            currentUnit: 'all',
            score: 0,
            level: 1,
            experience: 0,
            wordsLearned: new Set(),
            achievements: new Set(),
            settings: { soundEnabled: true, voiceSpeed: 1.0 }
        };
        this._animTimers = [];
        this._floatQueue = [];
        this._floatTimer = null;
        
        // Player appearance config: blue theme
        this.playerAppearance = { emoji: '🎩', color: '#3498DB', lightColor: '#85C1E9', name: 'Player' };
        
        // AI appearance config: different emojis and colors for each AI
        this.aiAppearances = [
            { emoji: '🏠', color: '#E74C3C', lightColor: '#F1948A', name: 'AI 1' },
            { emoji: '💰', color: '#9B59B6', lightColor: '#C39BD3', name: 'AI 2' },
            { emoji: '🚗', color: '#F39C12', lightColor: '#F8C471', name: 'AI 3' }
        ];

        // Lucky grid events: extra roll, +100, +200, +300 each 25% chance
        this.luckyEvents = [
            { type: 'extra_turn', text: () => `${t('lucky')} - ${t('extraTurn')}!`, color: '#27AE60' },
            { type: 'gain', amount: () => 100, text: () => `${t('lucky')} +$100`, color: '#9B59B6' },
            { type: 'gain', amount: () => 200, text: () => `${t('lucky')} +$200`, color: '#9B59B6' },
            { type: 'gain', amount: () => 300, text: () => `${t('lucky')} +$300`, color: '#9B59B6' }
        ];
        // Chance grid events: random forward or backward 1-6 steps
        this.moveEvents = [
            { type: 'forward', amount: () => secureRandomInt(1, 6), text: (a) => `${t('chance')} - ${t('forward')} ${a} ${t('steps')}`, color: '#3498DB' },
            { type: 'backward', amount: () => secureRandomInt(1, 6), text: (a) => `${t('chance')} - ${t('backward')} ${a} ${t('steps')}`, color: '#E67E22' }
        ];
    }

    async init() {
        this.isInitialized = true;
        return true;
    }

    switchScene(mode) {
        // 清理上一个场景的语言切换监听器
        if (this._langChangeHandler) {
            document.removeEventListener('languageChanged', this._langChangeHandler);
            this._langChangeHandler = null;
        }

        // 清理动画定时器和骰子动画
        this._animTimers.forEach(t => clearTimeout(t));
        this._animTimers = [];
        if (this._diceInterval) {
            clearInterval(this._diceInterval);
            this._diceInterval = null;
        }
        if (this._floatTimer) {
            clearTimeout(this._floatTimer);
            this._floatTimer = null;
        }

        // 切换游戏时清除容器上的主题类，防止主题样式泄漏到其他游戏
        const container = document.getElementById('game-canvas-container');
        if (container) {
            container.className = '';
        }

        if (mode === 'monopoly') {
            this.createMonopolyScene();
        } else if (mode === 'wordmatch') {
            wordMatchGame.switchScene();
        } else if (mode === 'wordblast') {
            wordBlastGame.switchScene();
        }
    }

    // === 显示浮动提示（队列模式，间隔1秒） ===
    showFloat(text, color = '#FFD700') {
        this._floatQueue.push({ text, color });
        this._processFloatQueue();
    }

    _processFloatQueue() {
        if (this._floatTimer) return; // 已有定时器在运行
        this._showNextFloat();
    }

    _showNextFloat() {
        if (this._floatQueue.length === 0) {
            this._floatTimer = null;
            return;
        }
        const { text, color } = this._floatQueue.shift();
        const el = document.createElement('div');
        el.className = 'game-float';
        el.textContent = text;
        el.style.color = color;
        document.getElementById('game-canvas-container').appendChild(el);
        requestAnimationFrame(() => el.classList.add('active'));
        setTimeout(() => el.remove(), 2250);
        // 1秒后显示下一条
        this._floatTimer = setTimeout(() => {
            this._floatTimer = null;
            this._showNextFloat();
        }, 1000);
    }

    addExp(amount) {
        this.gameState.experience += amount;
        const needed = this.gameState.level * 100;
        if (this.gameState.experience >= needed) {
            this.gameState.level++;
            this.gameState.experience -= needed;
            this.showFloat(`Level up! Lv.${this.gameState.level}`, '#FF4081');
        }
    }

    // === 年级选择 ===
    showGradeSel() {
        const container = document.getElementById('game-canvas-container');
        container.innerHTML = '';
        const wrap = document.createElement('div');
        wrap.className = 'grade-sel-wrap';
        wrap.innerHTML = `
            <h2 class="grade-sel-title">${t('selectGrade')}</h2>
            <div class="grade-sel-grid">
                ${[{l:`${t('grade')} 1`,g:1},{l:`${t('grade')} 2`,g:2},{l:`${t('grade')} 3`,g:3},{l:`${t('grade')} 4`,g:4},{l:`${t('grade')} 5`,g:5},{l:`${t('grade')} 6`,g:6},{l:`${t('grade')} 7`,g:7},{l:`${t('grade')} 8`,g:8},{l:`${t('grade')} 9`,g:9},{l:t('allGrades'),g:'all'}].map(gr =>
                    `<div class="grade-sel-btn" data-grade="${gr.g}">${gr.l}</div>`
                ).join('')}
            </div>
            <div class="grade-sel-back">${t('btnBackMenu')}</div>
        `;
        container.appendChild(wrap);

        wrap.querySelectorAll('.grade-sel-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.gameState.currentGrade = btn.dataset.grade;
                this.showUnitSel(btn.dataset.grade);
            });
        });
        wrap.querySelector('.grade-sel-back').addEventListener('click', () => {
            if (window.app) window.app.showMainMenu();
        });
    }

    // === 单元选择 ===
    showUnitSel(grade) {
        const container = document.getElementById('game-canvas-container');
        container.innerHTML = '';
        
        const gradeName = grade === 'all' ? t('allGrades') : `${t('grade')} ${grade}`;
        
        let unitButtons = `<div class="grade-sel-btn unit-sel-btn active" data-unit="all">${t('allUnits')}</div>`;
        if (grade !== 'all') {
            const units = wordData.getUnitsByGrade(parseInt(grade));
            units.forEach(u => {
                unitButtons += `<div class="grade-sel-btn unit-sel-btn" data-unit="${u}">${t('selectUnit')} ${u}</div>`;
            });
        }
        
        const wrap = document.createElement('div');
        wrap.className = 'grade-sel-wrap';
        wrap.innerHTML = `
            <h2 class="grade-sel-title">${gradeName} - ${t('selectUnit')}</h2>
            <div class="grade-sel-grid unit-sel-grid">
                ${unitButtons}
            </div>
            <div class="grade-sel-back">← ${t('selectGrade')}</div>
        `;
        container.appendChild(wrap);

        wrap.querySelectorAll('.unit-sel-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.gameState.currentUnit = btn.dataset.unit;
                this.createMonopolyScene();
            });
        });
        wrap.querySelector('.grade-sel-back').addEventListener('click', () => {
            this.showGradeSel();
        });
    }

    // === 大富翁主场景 ===
    createMonopolyScene() {
        const grade = this.gameState.currentGrade || 1;
        const unit = this.gameState.currentUnit || 'all';
        const words = wordData.getWordsByGrade(grade, unit);
        if (!words || !words.length) {
            this.showFloat('No word data found', '#999');
            return;
        }

        // 清理旧动画
        this._animTimers.forEach(t => clearTimeout(t));
        this._animTimers = [];

        // Get AI config, default 1 normal difficulty AI
        const aiConfigs = this.aiConfigs || [{ name: 'AI', difficulty: 80 }];
        
        this.monopolyState = {
            playerPos: 0, playerMoney: 1000,
            ais: aiConfigs.map((config, i) => ({
                pos: 0,
                money: 1000,
                totalOwned: 0,
                name: config.name,
                difficulty: config.difficulty,
                index: i,
                bankrupt: false
            })),
            currentAiIndex: 0,
            cells: [], diceValue: 0,
            isRolling: false, isPlayerTurn: true,
            chalStep: 0, chalWord: null,
            totalOwned: 0,
            startTime: Date.now(), gameOver: false,
            round: 1,
            _logEntries: [] // 结构化事件日志（支持语言切换重渲染）
        };

        const cells = this._genBoard(words);
        this.monopolyState.cells = cells;

        const container = document.getElementById('game-canvas-container');
        container.innerHTML = '';

        // 构建DOM
        const gameWrap = document.createElement('div');
        gameWrap.className = 'monopoly-game';
        
        // 生成AI面板HTML
        const ms = this.monopolyState;
        let aiPanelsHtml = '';
        ms.ais.forEach((ai, i) => {
            const difficultyNames = {70: t('difficulty.easy'), 80: t('difficulty.normal'), 90: t('difficulty.hard'), 100: t('difficulty.expert')};
            const appear = this.aiAppearances[i % this.aiAppearances.length];
            aiPanelsHtml += `
                <div class="panel-section ai-section ai-color-${i}" data-ai-index="${i}">
                    <div class="panel-title">${appear.emoji} ${ai.name} (${difficultyNames[ai.difficulty] || t('difficulty.normal')})</div>
                    <div class="stat-row"><span class="stat-icon">💰</span><span class="ai-money" data-ai="${i}">${ai.money}</span></div>
                    <div class="stat-row"><span class="stat-icon">🏠</span><span class="ai-owned" data-ai="${i}">${t('owned')} ${ai.totalOwned}</span></div>
                </div>
            `;
        });
        
        gameWrap.innerHTML = `
            <div class="monopoly-left-panel">
                <button class="back-game-btn" id="btn-exit-monopoly">← ${t('btnExitGame')}</button>
                <div class="panel-section round-section">
                    <div class="panel-title">🎯 ${t('round')}</div>
                    <div class="stat-row"><span class="stat-icon">🔄</span><span id="round-count">${t('round')} 1</span></div>
                </div>
                <div class="panel-section player-section">
                    <div class="panel-title">🎩 ${t('player')}</div>
                    <div class="stat-row"><span class="stat-icon">💰</span><span id="p-money">1500</span></div>
                    <div class="stat-row"><span class="stat-icon">🏠</span><span id="p-owned">${t('owned')} 0</span></div>
                </div>
                ${aiPanelsHtml}
            </div>
            <div class="monopoly-left">
                <div class="monopoly-board" id="monopoly-board"></div>
            </div>
            <div class="monopoly-right">
                <div class="monopoly-panel">
                    <div class="panel-section event-log-section">
                        <div class="panel-title">📋 ${t('eventLog')}</div>
                        <div class="event-log-container" id="event-log-list"></div>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(gameWrap);

        // 绘制棋盘
        this._drawBoard(cells);

        // 绑定事件
        document.getElementById('roll-btn').addEventListener('click', () => {
            if (!this.monopolyState.isRolling && this.monopolyState.isPlayerTurn && !this.monopolyState.gameOver) {
                this._rollDice();
            }
        });

        // Enter键掷骰子
        this._rollKeyHandler = (e) => {
            if (e.key === 'Enter' && !this.monopolyState.isRolling && this.monopolyState.isPlayerTurn && !this.monopolyState.gameOver) {
                e.preventDefault();
                this._rollDice();
            }
        };
        document.addEventListener('keydown', this._rollKeyHandler);

        // 退出游戏按钮事件
        document.getElementById('btn-exit-monopoly').addEventListener('click', () => {
            audioManager.playClick();
            // 清理游戏状态
            if (this._langChangeHandler) {
                document.removeEventListener('languageChanged', this._langChangeHandler);
                this._langChangeHandler = null;
            }
            // 清理动画定时器
            this._animTimers.forEach(t => clearTimeout(t));
            this._animTimers = [];
            // 清理骰子动画定时器
            if (this._diceInterval) {
                clearInterval(this._diceInterval);
                this._diceInterval = null;
            }
            // 清理浮动提示定时器
            if (this._floatTimer) {
                clearTimeout(this._floatTimer);
                this._floatTimer = null;
            }
            // 清理掷骰子键盘监听
            if (this._rollKeyHandler) {
                document.removeEventListener('keydown', this._rollKeyHandler);
                this._rollKeyHandler = null;
            }
            // 重置游戏状态
            this.monopolyState = null;
            // 返回主菜单
            window.app.showMainMenu();
        });

        this._updateUI();

        // 监听语言切换事件，重渲染事件日志和更新按钮文本
        this._langChangeHandler = () => {
            this._reRenderEventLog();
            const exitBtn = document.getElementById('btn-exit-monopoly');
            if (exitBtn) exitBtn.textContent = `← ${t('btnExitGame')}`;
        };
        document.addEventListener('languageChanged', this._langChangeHandler);
    }

    _genBoard(words) {
        const cells = [];
        // 预先打乱单词列表，确保不重复
        const shuffledWords = secureShuffle(words);
        let wordIndex = 0;
        // 24格棋盘：底部6格 + 右侧6格 + 顶部6格 + 左侧6格
        for (let i = 0; i < 24; i++) {
            let type, name, color, word = null, owner = 'none', price = 0, rent = 0, amount = 0, bonusType = null;

            if (i === 0) {
                type = 'start'; name = t('start'); color = '#4CAF50';
            } else if (i === 6) {
                type = 'bonus'; bonusType = 'lucky'; name = t('lucky'); color = '#9C27B0';
            } else if (i === 18) {
                type = 'bonus'; bonusType = 'move'; name = t('chance'); color = '#3498DB';
            } else if (i === 12) {
                type = 'tax'; name = t('tax'); color = '#E74C3C';
                amount = 400; // tax amount
            } else {
                type = 'word';
                word = shuffledWords[wordIndex % shuffledWords.length];
                wordIndex++;
                name = word.meaning || word.word;
                color = '#1a5276';
                rent = 100 + secureRandomInt(0, 199);
                price = rent; // 价格=租金，用于收费
            }
            cells.push({ type, name, color, word, owner, price, rent, amount, bonusType, index: i, level: 0, upgradeCount: 0 });
        }
        return cells;
    }

    _drawBoard(cells) {
        const board = document.getElementById('monopoly-board');
        board.innerHTML = '';

        // 布局：24格棋盘路径（完整外围矩形）
        // 底部行: 0-6 (左→右，包含左下角和右下角)
        // 右侧列: 7-12 (下→上，包含右上角)
        // 顶部行: 13-18 (右→左，包含左上角)
        // 左侧列: 19-23 (上→下)
        const boardGrid = document.createElement('div');
        boardGrid.className = 'board-grid';

        // 创建9行7列的网格
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 7; col++) {
                const cellIndex = this._getCellIndex(row, col);
                const cellDiv = document.createElement('div');

                if (cellIndex !== -1) {
                    const cell = cells[cellIndex];
                    const side = this._getCellSide(cellIndex);
                    cellDiv.className = `board-cell cell-${cell.type}`;
                    cellDiv.dataset.index = cellIndex;
                    cellDiv.dataset.side = side;
                    cellDiv.style.setProperty('--cell-color', cell.color);
                    cellDiv.innerHTML = `
                        <div class="cell-level" id="cell-level-${cellIndex}"></div>
                        <div class="cell-name"><span class="cell-name-text">${cell.name}</span></div>
                        ${cell.type === 'word' && cell.rent ? `<div class="cell-price">$${cell.rent}</div>` : ''}
                        ${cell.type === 'tax' && cell.amount ? `<div class="cell-price">-$${cell.amount}</div>` : ''}
                        <div class="cell-owner" id="cell-owner-${cellIndex}"></div>
                        <div class="cell-word-display" id="cell-word-${cellIndex}"></div>
                        <div class="cell-tokens" id="cell-tokens-${cellIndex}"></div>
                    `;
                } else if (row >= 1 && row <= 7 && col >= 1 && col <= 5) {
                    // 中间区域
                    cellDiv.className = 'board-center';
                    if (row === 4 && col === 3) {
                        cellDiv.innerHTML = `
                            <div class="dice-section-center">
                                <div class="dice-scene" id="dice-scene">
                                    <div class="dice-cube" id="dice-cube">
                                        <div class="dice-face dice-face-1">
                                            <span class="dot dot-tl"></span><span class="dot dot-tc"></span><span class="dot dot-tr"></span>
                                            <span class="dot dot-ml"></span><span class="dot dot-mc"></span><span class="dot dot-mr"></span>
                                            <span class="dot dot-bl"></span><span class="dot dot-bc"></span><span class="dot dot-br"></span>
                                        </div>
                                        <div class="dice-face dice-face-2">
                                            <span class="dot dot-tl"></span><span class="dot dot-tc"></span><span class="dot dot-tr"></span>
                                            <span class="dot dot-ml"></span><span class="dot dot-mc"></span><span class="dot dot-mr"></span>
                                            <span class="dot dot-bl"></span><span class="dot dot-bc"></span><span class="dot dot-br"></span>
                                        </div>
                                        <div class="dice-face dice-face-3">
                                            <span class="dot dot-tl"></span><span class="dot dot-tc"></span><span class="dot dot-tr"></span>
                                            <span class="dot dot-ml"></span><span class="dot dot-mc"></span><span class="dot dot-mr"></span>
                                            <span class="dot dot-bl"></span><span class="dot dot-bc"></span><span class="dot dot-br"></span>
                                        </div>
                                        <div class="dice-face dice-face-4">
                                            <span class="dot dot-tl"></span><span class="dot dot-tc"></span><span class="dot dot-tr"></span>
                                            <span class="dot dot-ml"></span><span class="dot dot-mc"></span><span class="dot dot-mr"></span>
                                            <span class="dot dot-bl"></span><span class="dot dot-bc"></span><span class="dot dot-br"></span>
                                        </div>
                                        <div class="dice-face dice-face-5">
                                            <span class="dot dot-tl"></span><span class="dot dot-tc"></span><span class="dot dot-tr"></span>
                                            <span class="dot dot-ml"></span><span class="dot dot-mc"></span><span class="dot dot-mr"></span>
                                            <span class="dot dot-bl"></span><span class="dot dot-bc"></span><span class="dot dot-br"></span>
                                        </div>
                                        <div class="dice-face dice-face-6">
                                            <span class="dot dot-tl"></span><span class="dot dot-tc"></span><span class="dot dot-tr"></span>
                                            <span class="dot dot-ml"></span><span class="dot dot-mc"></span><span class="dot dot-mr"></span>
                                            <span class="dot dot-bl"></span><span class="dot dot-bc"></span><span class="dot dot-br"></span>
                                        </div>
                                    </div>
                                </div>
                                <button class="roll-btn" id="roll-btn">${t('rollDice')}</button>
                                <div class="turn-info" id="turn-info">${t('yourTurn')}</div>
                            </div>
                        `;
                    }
                } else {
                    cellDiv.className = 'board-empty';
                }

                boardGrid.appendChild(cellDiv);
            }
        }
        board.appendChild(boardGrid);

        // 检测格子名称宽度，添加跑马灯效果
        const checkMarquee = () => {
            document.querySelectorAll('.cell-name').forEach(nameEl => {
                const textEl = nameEl.querySelector('.cell-name-text');
                if (textEl) {
                    // 确保元素已渲染并有宽度
                    if (nameEl.clientWidth > 0 && textEl.scrollWidth > nameEl.clientWidth) {
                        textEl.classList.add('marquee');
                    } else {
                        textEl.classList.remove('marquee');
                    }
                }
            });
        };
        
        // 多个时间点重复检测，确保布局完成
        setTimeout(checkMarquee, 100);
        setTimeout(checkMarquee, 300);
        setTimeout(checkMarquee, 500);
        
        // 监听窗口大小变化，重新检测
        window.addEventListener('resize', () => {
            requestAnimationFrame(checkMarquee);
        });

        // 放置初始标记
        this._updateTokens();
    }

    _getCellIndex(row, col) {
        // 底部行: row=7, col 0-6 → cell 0-6 (7格，包含左下角和右下角)
        if (row === 7 && col >= 0 && col <= 6) return col;
        // 右侧列: col=6, row 6→1 → cell 7-12 (6格，包含右上角)
        if (col === 6 && row >= 1 && row <= 6) return 7 + (6 - row);
        // 顶部行: row=1, col 5→0 → cell 13-18 (6格，包含左上角)
        if (row === 1 && col >= 0 && col <= 5) return 13 + (5 - col);
        // 左侧列: col=0, row 2→6 → cell 19-23 (5格)
        if (col === 0 && row >= 2 && row <= 6) return 19 + (row - 2);
        return -1;
    }

    // 获取格子所在边：bottom / right / top / left
    _getCellSide(index) {
        if (index >= 0 && index <= 6) return 'bottom';
        if (index >= 7 && index <= 12) return 'right';
        if (index >= 13 && index <= 18) return 'top';
        if (index >= 19 && index <= 23) return 'left';
        return 'bottom';
    }

    _updateTokens() {
        // 清除所有标记
        document.querySelectorAll('.cell-tokens').forEach(el => el.innerHTML = '');

        const ms = this.monopolyState;
        const pTokens = document.getElementById(`cell-tokens-${ms.playerPos}`);
        const playerAppear = this.playerAppearance;
        if (pTokens) pTokens.innerHTML = `<span class="token token-player" style="color:${playerAppear.color};text-shadow:0 0 6px ${playerAppear.color}">${playerAppear.emoji}</span>`;
        
        // 显示所有AI的标记（破产的AI不显示）
        ms.ais.forEach((ai, i) => {
            if (ai.bankrupt) return; // 跳过破产的AI
            const aTokens = document.getElementById(`cell-tokens-${ai.pos}`);
            if (aTokens) {
                const appear = this.aiAppearances[i % this.aiAppearances.length];
                aTokens.innerHTML += `<span class="token token-ai" style="color:${appear.color};text-shadow:0 0 6px ${appear.color}">${appear.emoji}</span>`;
            }
        });
    }

    _updateUI() {
        const ms = this.monopolyState;
        document.getElementById('p-money').textContent = ms.playerMoney;
        document.getElementById('p-owned').textContent = `${t('owned')} ${ms.totalOwned}`;
        
        // 更新所有AI的显示
        ms.ais.forEach((ai, i) => {
            const moneyEl = document.querySelector(`.ai-money[data-ai="${i}"]`);
            const ownedEl = document.querySelector(`.ai-owned[data-ai="${i}"]`);
            if (moneyEl) moneyEl.textContent = ai.money;
            if (ownedEl) ownedEl.textContent = ai.bankrupt ? t('bankrupt') : `${t('owned')} ${ai.totalOwned}`;
            
            // 破产AI面板变灰
            const section = document.querySelector(`.ai-section[data-ai-index="${i}"]`);
            if (section) {
                if (ai.bankrupt) {
                    section.classList.add('ai-bankrupt');
                } else {
                    section.classList.remove('ai-bankrupt');
                }
            }
        });
        
        const roundEl = document.getElementById('round-count');
        if (roundEl) roundEl.textContent = `${t('round')} ${ms.round}`;
        
        // 高亮当前活跃的AI
        document.querySelectorAll('.ai-section').forEach((el, i) => {
            if (ms.isPlayerTurn) {
                el.classList.remove('ai-active', 'ai-active-color');
            } else {
                const isActive = i === ms.currentAiIndex;
                el.classList.toggle('ai-active', isActive);
                // 使用对应AI的颜色高亮
                if (isActive) {
                    const appear = this.aiAppearances[i % this.aiAppearances.length];
                    el.style.borderColor = appear.color;
                    el.style.boxShadow = `0 0 12px ${appear.color}66`;
                } else {
                    el.style.borderColor = '';
                    el.style.boxShadow = '';
                }
            }
        });
        document.querySelector('.player-section')?.classList.toggle('player-active', ms.isPlayerTurn);
        // 玩家活跃时使用玩家颜色高亮
        const playerSection = document.querySelector('.player-section');
        if (playerSection) {
            if (ms.isPlayerTurn) {
                playerSection.style.borderColor = this.playerAppearance.color;
                playerSection.style.boxShadow = `0 0 12px ${this.playerAppearance.color}66`;
            } else {
                playerSection.style.borderColor = '';
                playerSection.style.boxShadow = '';
            }
        }
    }

    // === Event Log ===
    _addEventLog(entry, type = 'info') {
        const logContainer = document.getElementById('event-log-list');
        if (!logContainer) return;

        // 支持两种调用方式：
        // 1. _addEventLog({ key, params, type }) — 结构化，支持语言切换
        // 2. _addEventLog(text, type) — 旧式纯文本
        if (typeof entry === 'object' && entry.key) {
            // 结构化日志
            if (this.monopolyState && this.monopolyState._logEntries) {
                this.monopolyState._logEntries.push({ ...entry, time: Date.now() });
                // 限制数量
                while (this.monopolyState._logEntries.length > 50) {
                    this.monopolyState._logEntries.shift();
                }
            }
            this._renderOneLog(entry, logContainer);
        } else {
            // 旧式纯文本日志
            const text = entry;
            const logItem = document.createElement('div');
            logItem.className = `event-log-item event-log-${type}`;
            const lang = (window.app && window.app.lang) || 'en';
            const time = new Date().toLocaleTimeString(lang === 'zh' ? 'zh-CN' : 'en-US', { hour: '2-digit', minute: '2-digit' });
            logItem.innerHTML = `<span class="event-log-time">${time}</span><span class="event-log-text">${text}</span>`;
            logContainer.insertBefore(logItem, logContainer.firstChild);
            while (logContainer.children.length > 50) {
                logContainer.removeChild(logContainer.lastChild);
            }
        }
    }

    // 渲染单条结构化日志
    _renderOneLog(entry, logContainer) {
        const { key, params, type } = entry;
        let text = t(key);
        if (params) {
            Object.entries(params).forEach(([k, v]) => {
                text = text.split(`{${k}}`).join(v);
            });
        }
        const logItem = document.createElement('div');
        logItem.className = `event-log-item event-log-${type || 'info'}`;
        const lang = (window.app && window.app.lang) || 'en';
        const time = new Date(entry.time || Date.now()).toLocaleTimeString(lang === 'zh' ? 'zh-CN' : 'en-US', { hour: '2-digit', minute: '2-digit' });
        logItem.innerHTML = `<span class="event-log-time">${time}</span><span class="event-log-text">${text}</span>`;
        logContainer.insertBefore(logItem, logContainer.firstChild);
    }

    // 语言切换时重渲染所有事件日志
    _reRenderEventLog() {
        const logContainer = document.getElementById('event-log-list');
        if (!logContainer || !this.monopolyState) return;
        logContainer.innerHTML = '';
        const entries = this.monopolyState._logEntries || [];
        // 从最新到最旧渲染（新条目插入顶部）
        for (let i = entries.length - 1; i >= 0; i--) {
            this._renderOneLog(entries[i], logContainer);
        }
    }

    _updateCellOwner(cell, animate = false) {
        const ownerEl = document.getElementById(`cell-owner-${cell.index}`);
        const wordEl = document.getElementById(`cell-word-${cell.index}`);
        const levelEl = document.getElementById(`cell-level-${cell.index}`);
        // 使用更精确的选择器，避免选到AI设置面板中同样有data-index的元素
        const cellEl = document.querySelector(`.board-cell[data-index="${cell.index}"]`);
        if (!ownerEl || !cellEl) return;

        // 更新等级显示
        if (levelEl) {
            const level = cell.level || 0;
            if (cell.owner && cell.owner !== 'none' && level > 0) {
                levelEl.textContent = `Lv${level}`;
                levelEl.style.display = 'block';
                // 触发升级动效
                if (animate) {
                    levelEl.classList.remove('level-up-animate');
                    void levelEl.offsetWidth; // 强制回流以重新触发动画
                    levelEl.classList.add('level-up-animate');
                }
            } else {
                levelEl.textContent = '';
                levelEl.style.display = 'none';
            }
        }

        // 更新租金显示
        if (cell.type === 'word') {
            const priceEl = cellEl.querySelector('.cell-price');
            if (priceEl) {
                priceEl.textContent = `$${cell.rent || 100}`;
                if (animate) {
                    priceEl.classList.remove('price-update-animate');
                    void priceEl.offsetWidth;
                    priceEl.classList.add('price-update-animate');
                }
            }
        }

        if (cell.owner === 'player') {
            ownerEl.textContent = this.playerAppearance.emoji;
            cellEl.classList.add('owned-player');
            // 移除所有AI相关类
            cellEl.classList.remove('owned-ai', 'owned-ai-0', 'owned-ai-1', 'owned-ai-2');
            // 显示英文单词
            if (wordEl && cell.word) {
                wordEl.textContent = cell.word.word;
                wordEl.className = 'cell-word-display cell-word-visible word-owner-player';
            }
        } else if (cell.owner && cell.owner.startsWith('ai')) {
            const aiIndex = parseInt(cell.owner.replace('ai', ''));
            const appear = this.aiAppearances[aiIndex % this.aiAppearances.length];
            ownerEl.textContent = appear.emoji;
            // 移除旧的AI颜色类，添加新的
            cellEl.classList.remove('owned-player', 'owned-ai', 'owned-ai-0', 'owned-ai-1', 'owned-ai-2');
            cellEl.classList.add('owned-ai', `owned-ai-${aiIndex}`);
            // 显示英文单词
            if (wordEl && cell.word) {
                wordEl.textContent = cell.word.word;
                wordEl.className = 'cell-word-display cell-word-visible word-owner-ai';
            }
        } else {
            // 清除所有权标记
            ownerEl.textContent = '';
            cellEl.classList.remove('owned-player', 'owned-ai', 'owned-ai-0', 'owned-ai-1', 'owned-ai-2');
            // 隐藏英文单词
            if (wordEl) {
                wordEl.textContent = '';
                wordEl.className = 'cell-word-display';
            }
        }
    }

    _flashCell(index) {
        const el = document.querySelector(`.board-cell[data-index="${index}"]`);
        if (!el) return;
        el.classList.add('cell-passing');
        setTimeout(() => el.classList.remove('cell-passing'), 450);
    }

    // === 骰子系统 ===
    _rollDice() {
        const ms = this.monopolyState;
        ms.isRolling = true;
        document.getElementById('roll-btn').style.display = 'none';

        // 确保AudioContext已恢复（现代浏览器需要用户交互后才能播放音频）
        if (audioManager.audioContext && audioManager.audioContext.state === 'suspended') {
            audioManager.audioContext.resume();
        }

        const cube = document.getElementById('dice-cube');
        if (!cube) { this._rollDiceFallback(); return; }

        // 生成结果（crypto级别均匀随机）
        const v = secureRandomInt(1, 6);
        ms.diceValue = v;

        // 开始3D滚动动画
        const scene = document.getElementById('dice-scene');
        scene.classList.remove('bounce-land');
        cube.classList.remove('bounce-land');
        cube.classList.add('rolling');

        // 动画结束后显示最终面
        setTimeout(() => {
            // 清除所有 dice-show-* 类
            for (let i = 1; i <= 6; i++) cube.classList.remove('dice-show-' + i);
            // 先设置最终transform，再移除rolling，避免闪回基础样式
            const finalTransforms = {
                1: 'rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
                2: 'rotateX(0deg) rotateY(180deg) rotateZ(0deg)',
                3: 'rotateX(0deg) rotateY(90deg) rotateZ(0deg)',
                4: 'rotateX(0deg) rotateY(-90deg) rotateZ(0deg)',
                5: 'rotateX(90deg) rotateY(0deg) rotateZ(0deg)',
                6: 'rotateX(-90deg) rotateY(0deg) rotateZ(0deg)'
            };
            // 临时禁用transition，防止动画到inline样式之间的过渡闪烁
            cube.style.transition = 'none';
            cube.style.transform = finalTransforms[v];
            // 强制浏览器应用inline样式后再移除动画类
            cube.offsetHeight;
            cube.classList.remove('rolling');
            // 恢复transition
            requestAnimationFrame(() => { cube.style.transition = ''; });
            // 弹跳着陆 - 应用在scene容器上，避免覆盖cube的旋转
            const scene = document.getElementById('dice-scene');
            setTimeout(() => {
                scene.classList.add('bounce-land');
                setTimeout(() => scene.classList.remove('bounce-land'), 750);
            }, 50);
            this._movePlayer(v);
        }, 1800);
    }

    // 后备方案：若3D结构不存在，用旧的文本方式
    _rollDiceFallback() {
        const ms = this.monopolyState;
        const faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
        const diceEl = document.getElementById('dice-display');
        let count = 0;
        this._diceInterval = setInterval(() => {
            diceEl.textContent = faces[Math.floor(Math.random() * 6)];
            count++;
            if (count >= 12) {
                clearInterval(this._diceInterval);
                this._diceInterval = null;
                const v = secureRandomInt(1, 6);
                ms.diceValue = v;
                diceEl.textContent = faces[v - 1];
                this._movePlayer(v);
            }
        }, 70);
    }

    _movePlayer(steps) {
        const ms = this.monopolyState;
        let moved = 0;
        
        // Log dice roll event
        this._addEventLog({ key: 'logPlayerRolled', params: { steps }, type: 'player' });

        const moveStep = () => {
            ms.playerPos = (ms.playerPos + 1) % ms.cells.length;
            this._updateTokens();
            this._flashCell(ms.playerPos);
            moved++;

            // 经过起点
            if (ms.playerPos === 0 && moved > 1) {
                ms.playerMoney += 100;
                this._updateUI();
                this.showFloat('Passed Start +$100', '#27AE60');
                this._addEventLog({ key: 'logPlayerPassedStart', type: 'gain' });
            }

            if (moved >= steps) {
                // 落地后立即高亮格子
                document.querySelectorAll('.board-cell').forEach(el => el.classList.remove('cell-active'));
                const cellEl = document.querySelector(`.board-cell[data-index="${ms.playerPos}"]`);
                if (cellEl) cellEl.classList.add('cell-active');
                
                const t2 = setTimeout(() => this._onPlayerLand(), 1500);
                this._animTimers.push(t2);
            } else {
                const t = setTimeout(moveStep, 750);
                this._animTimers.push(t);
            }
        };
        const t = setTimeout(moveStep, 600);
        this._animTimers.push(t);
    }

    _onPlayerLand() {
        const ms = this.monopolyState;
        const c = ms.cells[ms.playerPos];

        if (c.type === 'start') {
            ms.playerMoney += 100;
            this._updateUI();
            this.showFloat('Start +$100', '#27AE60');
            this._endTurn();
        } else if (c.type === 'bonus') {
            // 根据 bonusType 选择事件列表
            const events = c.bonusType === 'move' ? this.moveEvents : this.luckyEvents;
            const event = events[secureRandomInt(0, events.length - 1)];
            
            switch (event.type) {
                case 'gain': {
                    const amount = event.amount();
                    ms.playerMoney += amount;
                    this._updateUI();
                    this.showFloat(event.text(amount), event.color);
                    audioManager.playMatchSuccess();
                    this._endTurn();
                    break;
                }
                case 'extra_turn':
                    this.showFloat(event.text(), event.color);
                    audioManager.playMatchSuccess();
                    // 额外回合：不调用_endTurn，让玩家再掷一次
                    document.getElementById('roll-btn').style.display = 'block';
                    this.monopolyState.isRolling = false;
                    break;
                case 'forward': {
                    const amount = event.amount();
                    this.showFloat(event.text(amount), event.color);
                    audioManager.playMatchSuccess();
                    ms.playerPos = (ms.playerPos + amount) % ms.cells.length;
                    this._updateTokens();
                    setTimeout(() => this._applyBonusLanding('player'), 750);
                    break;
                }
                case 'backward': {
                    const amount = event.amount();
                    this.showFloat(event.text(amount), event.color);
                    audioManager.playMatchError();
                    ms.playerPos = (ms.playerPos - amount + ms.cells.length) % ms.cells.length;
                    this._updateTokens();
                    setTimeout(() => this._applyBonusLanding('player'), 750);
                    break;
                }
                default:
                    this._endTurn();
            }
        } else if (c.type === 'tax') {
            const taxAmount = c.amount || 400;
            ms.playerMoney -= taxAmount;
            this._updateUI();
            this.showFloat(`${t('tax')} -$${taxAmount}`, '#E74C3C');
            this._addEventLog({ key: 'logPlayerTax', params: { amount: `$${taxAmount}` }, type: 'player' });
            if (this._checkBankrupt()) return;
            this._endTurn();
        } else if (c.type === 'word') {
            if (c.owner === 'player') {
                // 走到自己的格子，显示升级选项
                this._showUpgradeOption(c);
            } else if (c.owner && c.owner.startsWith('ai')) {
                // 玩家落到电脑格子，需要挑战
                this._playerChallengeAiCell(c);
            } else {
                this._startChallenge(c);
            }
        }
    }

    // === 机遇格子着陆规则（前进/后退后的特殊处理） ===
    _applyBonusLanding(who) {
        const ms = this.monopolyState;
        const pos = who === 'player' ? ms.playerPos : ms.ais[parseInt(who.replace('ai', ''))].pos;
        const c = ms.cells[pos];

        // 非单词格子不处理，直接结束回合
        if (c.type !== 'word') {
            this._endTurn();
            return;
        }

        // 空格子：按正常规则处理
        if (c.owner === 'none' || !c.owner) {
            if (who === 'player') {
                this._startChallenge(c);
            } else {
                // AI落到空格子，按难度决定是否占领
                const aiIndex = parseInt(who.replace('ai', ''));
                const ai = ms.ais[aiIndex];
                if (secureRandomInt(1, 100) <= ai.difficulty) {
                    c.owner = who;
                    ai.totalOwned++;
                    ai.money += 100;
                    this._updateCellOwner(c);
                    this._updateUI();
                    this.showFloat(`${ai.name} occupied successfully!`, '#E74C3C');
                    this.showFloat('+$100', '#27AE60');
                    this._addEventLog({ key: 'logAiOccupied', params: { name: ai.name, word: c.word ? c.word.word : 'Unknown' }, type: 'ai' });
                } else {
                    ai.money -= 100;
                    this._updateUI();
                    this.showFloat(`${ai.name} occupation failed! -$100`, '#E74C3C');
                    this._addEventLog({ key: 'logAiOccupiedFail', params: { name: ai.name }, type: 'ai' });
                }
                this._endTurn();
            }
            return;
        }

        // 落到自己的格子：自动升1级（最多3级），不需要升级费
        if (c.owner === who) {
            const maxUpgrades = 3;
            if ((c.upgradeCount || 0) >= maxUpgrades) {
                this.showFloat(t('maxUpgradesReached'), '#E67E22');
                this._endTurn();
                return;
            }
            c.level = (c.level || 0) + 1;
            c.upgradeCount = (c.upgradeCount || 0) + 1;
            // 更新租金和价格（翻倍）
            c.rent = Math.floor((c.rent || 100) * 2);
            c.price = c.rent; // 保持同步
            this._updateCellOwner(c, true);
            this._updateUI();
            const whoName = who === 'player' ? t('player') : ms.ais[parseInt(who.replace('ai', ''))].name;
            this.showFloat(`${whoName} ${t('autoUpgraded')} Lv.${c.level}`, '#FFD700');
            this._addEventLog({ key: 'logAutoUpgrade', params: { name: whoName, word: c.word.word, level: c.level }, type: 'gain' });
            this._endTurn();
            return;
        }

        // 落到别人占领的格子：应用机遇着陆干扰规则
        if (c.level === 0) {
            // Initial level cell: becomes unowned
            const oldOwnerName = c.owner === 'player' ? 'Player' : ms.ais[parseInt(c.owner.replace('ai', ''))].name;
            // 递减原主人的 totalOwned
            if (c.owner === 'player') {
                ms.totalOwned--;
            } else if (c.owner && c.owner.startsWith('ai')) {
                const oldAi = ms.ais[parseInt(c.owner.replace('ai', ''))];
                if (oldAi) oldAi.totalOwned--;
            }
            c.owner = 'none';
            c.level = 0;
            c.upgradeCount = 0;
            this._updateCellOwner(c);
            this._updateUI();
            this.showFloat(`${t('chanceLanding')} "${c.word.word}" ${t('nowUnowned')}`, '#E67E22');
            this._addEventLog({ key: 'logChanceUnowned', params: { word: c.word.word, owner: oldOwnerName }, type: 'info' });
        } else {
            // High level cell: downgrade by 1 level
            c.level--;
            this._updateCellOwner(c);
            this._updateUI();
            const oldOwnerName = c.owner === 'player' ? t('player') : ms.ais[parseInt(c.owner.replace('ai', ''))].name;
            this.showFloat(`${t('chanceLanding')} "${c.word.word}" ${t('downgradedTo')} Lv.${c.level}, ${t('stillOwnedBy')} ${oldOwnerName}`, '#E67E22');
            this._addEventLog({ key: 'logChanceDowngraded', params: { word: c.word.word, owner: oldOwnerName, level: c.level }, type: 'info' });
        }
        this._endTurn();
    }

    // === 升级/出售格子选项 ===
    _showUpgradeOption(cell) {
        const ms = this.monopolyState;
        const word = cell.word ? cell.word.word : 'Unknown word';
        const currentLevel = cell.level || 0;
        const upgradeCount = cell.upgradeCount || 0;
        const maxUpgrades = 3;
        const currentRent = cell.rent || 50;
        
        // 升级费 = 当前租金
        const upgradeCost = currentRent;
        // 出售价格 = 租金的50%
        const sellPrice = Math.floor(currentRent * 0.5);
        
        // 检查是否已达到最大升级次数
        const canUpgrade = upgradeCount < maxUpgrades;
        
        // 移除旧的对话框
        const old = document.getElementById('upgrade-modal');
        if (old) old.remove();
        
        const modal = document.createElement('div');
        modal.className = 'challenge-modal';
        modal.id = 'upgrade-modal';
        modal.innerHTML = `
            <div class="challenge-box" style="max-width: 400px;">
                <div class="challenge-title">${t('yourProperty')}: ${word}</div>
                <div style="text-align: center; margin: 15px 0;">
                    <div style="color: #aaa; margin: 10px 0;">
                        ${t('level')}: ${currentLevel} ★ | ${t('rent')}: <span style="color: #FFD700; font-weight: bold;">$${currentRent}</span>
                    </div>
                    ${canUpgrade ? `
                    <div style="color: #aaa; margin: 10px 0;">
                        ${t('upgradeCost')}: <span style="color: #3498DB; font-weight: bold;">$${upgradeCost}</span>
                        <span style="font-size: 12px;"> (${t('afterUpgrade')}: $${currentRent * 2})</span>
                    </div>
                    ` : `
                    <div style="color: #E67E22; margin: 10px 0;">
                        ${t('maxUpgradesReached')}
                    </div>
                    `}
                    <div style="color: #aaa; margin: 10px 0;">
                        ${t('sellPrice')}: <span style="color: #E74C3C;">$${sellPrice}</span>
                    </div>
                </div>
                <div style="display: flex; gap: 10px; justify-content: center; margin-top: 15px;">
                    ${canUpgrade ? `
                    <button id="upgrade-btn" style="
                        padding: 10px 20px;
                        border: none;
                        border-radius: 10px;
                        background: linear-gradient(135deg, #3498DB, #2980B9);
                        color: white;
                        font-size: 16px;
                        cursor: pointer;
                        transition: transform 0.2s;
                    ">${t('upgrade')} ($${upgradeCost})</button>
                    ` : ''}
                    <button id="sell-btn" style="
                        padding: 10px 20px;
                        border: none;
                        border-radius: 10px;
                        background: linear-gradient(135deg, #E74C3C, #C0392B);
                        color: white;
                        font-size: 16px;
                        cursor: pointer;
                        transition: transform 0.2s;
                    ">${t('sell')} (+$${sellPrice})</button>
                    <button id="skip-btn" style="
                        padding: 10px 20px;
                        border: none;
                        border-radius: 10px;
                        background: linear-gradient(135deg, #95A5A6, #7F8C8D);
                        color: white;
                        font-size: 16px;
                        cursor: pointer;
                        transition: transform 0.2s;
                    ">${t('skip')}</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('active'));
        
        // 绑定升级按钮事件
        if (canUpgrade) {
            document.getElementById('upgrade-btn').addEventListener('click', () => {
                modal.remove();
                // 检查金钱
                if (ms.playerMoney < upgradeCost) {
                    this.showFloat(`${t('notEnoughMoney')} $${upgradeCost}`, '#E74C3C');
                    this._endTurn();
                    return;
                }
                // 开始升级问答
                this._startUpgradeChallenge(cell, upgradeCost);
            });
        }
        
        // 绑定出售按钮事件
        document.getElementById('sell-btn').addEventListener('click', () => {
            modal.remove();
            // 开始出售问答
            this._startSellChallenge(cell, sellPrice);
        });
        
        // 绑定跳过按钮事件
        document.getElementById('skip-btn').addEventListener('click', () => {
            modal.remove();
            this._endTurn();
        });
    }

    // === 开始升级问答 ===
    _startUpgradeChallenge(cell, upgradeCost) {
        this.monopolyState.chalStep = 0;
        this.monopolyState.chalWord = cell.word;
        this.monopolyState.chalMode = 'upgrade';
        this.monopolyState.upgradeCost = upgradeCost;
        this.monopolyState.upgradeCell = cell;
        // 升级答4道题
        this.monopolyState.maxChalStep = 4;
        this._showChallenge();
    }

    // === 开始出售问答 ===
    _startSellChallenge(cell, sellPrice) {
        this.monopolyState.chalStep = 0;
        this.monopolyState.chalWord = cell.word;
        this.monopolyState.chalMode = 'sell';
        this.monopolyState.sellPrice = sellPrice;
        this.monopolyState.sellCell = cell;
        // 出售答2道题
        this.monopolyState.maxChalStep = 2;
        this._showChallenge();
    }

    // === 挑战系统 ===
    _startChallenge(cell, mode = 'occupy') {
        this._chalProcessing = false; // 重置防重复锁
        this.monopolyState.chalStep = 0;
        this.monopolyState.chalWord = cell.word;
        this.monopolyState.chalMode = mode; // 'occupy' = 占领空格子, 'challenge' = 挑战电脑格子
        this.monopolyState.maxChalStep = 4;
        this._showChallenge();
    }

    _showChallenge() {
        this._chalProcessing = false; // 重置防重复锁，允许新步骤作答
        const ms = this.monopolyState;
        const w = ms.chalWord;
        const titles = ['① Pick the correct word', '② Choose the meaning', '③ Fill in missing letters', '④ Choose the correct sentence'];

        // 移除旧弹窗
        const old = document.getElementById('challenge-modal');
        if (old) old.remove();

        const modal = document.createElement('div');
        modal.className = 'challenge-modal';
        modal.id = 'challenge-modal';
        modal.innerHTML = `
            <div class="challenge-box">
                <div class="challenge-title">${titles[ms.chalStep]}</div>
                <div class="challenge-progress">Progress: ${ms.chalStep + 1}/${ms.maxChalStep || 4}</div>
                <div class="challenge-content" id="challenge-content"></div>
            </div>
        `;
        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('active'));

        const content = document.getElementById('challenge-content');

        if (ms.chalStep === 0) this._chalPickWord(content, w);
        else if (ms.chalStep === 1) this._chalMeaning(content, w);
        else if (ms.chalStep === 2) this._chalFillLetters(content, w);
        else this._chalSentence(content, w);

        // 自动朗读当前挑战的单词
        setTimeout(() => {
            audioManager.speak(w.word, 'en-US');
            // 句子挑战额外朗读例句
            if (ms.chalStep === 3) {
                const sentence = w.example || `I like ${w.word}.`;
                setTimeout(() => {
                    audioManager.speak(sentence, 'en-US');
                }, 800);
            }
        }, 400);
    }

    _chalMeaning(content, w) {
        content.innerHTML = `<div class="chal-word">${w.word}</div>`;

        let opts = [w.meaning];
        const all = wordData.getWordsByGrade(this.gameState.currentGrade || 1, this.gameState.currentUnit || 'all').filter(x => x.meaning !== w.meaning);
        const distr = secureShuffle(all).slice(0, 3);
        distr.forEach(x => opts.push(x.meaning));
        opts = secureShuffle(opts);

        const optsDiv = document.createElement('div');
        optsDiv.className = 'chal-options';
        const btns = [];
        let selectedIdx = 0;

        // 键盘导航
        const self = this;
        function cleanup() {
            document.removeEventListener('keydown', onKeydown);
        }
        function updateSelection() {
            btns.forEach((b, i) => b.classList.toggle('selected', i === selectedIdx));
        }

        opts.forEach(o => {
            const btn = document.createElement('div');
            btn.className = 'chal-option';
            btn.textContent = o;
            btn.addEventListener('click', () => {
                cleanup();
                // 点击时朗读英文单词
                audioManager.speak(w.word, 'en-US');
                if (o === w.meaning) self._onCorrect();
                else self._onWrong();
            });
            optsDiv.appendChild(btn);
            btns.push(btn);
        });
        content.appendChild(optsDiv);
        updateSelection();

        function onKeydown(e) {
            if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                e.preventDefault();
                selectedIdx = (selectedIdx - 1 + btns.length) % btns.length;
                updateSelection();
            } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                e.preventDefault();
                selectedIdx = (selectedIdx + 1) % btns.length;
                updateSelection();
            } else if (e.key >= '1' && e.key <= '4') {
                e.preventDefault();
                const idx = parseInt(e.key) - 1;
                if (idx < btns.length) {
                    selectedIdx = idx;
                    updateSelection();
                }
            } else if (e.key === 'Enter') {
                e.preventDefault();
                cleanup();
                audioManager.speak(w.word, 'en-US');
                if (opts[selectedIdx] === w.meaning) self._onCorrect();
                else self._onWrong();
            }
        }
        document.addEventListener('keydown', onKeydown);
    }

    _chalPickWord(content, w) {
        content.innerHTML = `
            <div class="chal-hint">${w.meaning}</div>
            <div class="chal-sub-hint">Pick the matching English word</div>
        `;

        let opts = [w.word];
        const all = wordData.getWordsByGrade(this.gameState.currentGrade || 1, this.gameState.currentUnit || 'all').filter(x => x.word !== w.word);
        const distr = secureShuffle(all).slice(0, 3);
        distr.forEach(x => opts.push(x.word));
        opts = secureShuffle(opts);

        const optsDiv = document.createElement('div');
        optsDiv.className = 'chal-options';
        const btns = [];
        let selectedIdx = 0;

        // 键盘导航
        const self = this;
        function cleanup() {
            document.removeEventListener('keydown', onKeydown);
        }
        function updateSelection() {
            btns.forEach((b, i) => b.classList.toggle('selected', i === selectedIdx));
        }

        opts.forEach(o => {
            const btn = document.createElement('div');
            btn.className = 'chal-option chal-option-green';
            btn.textContent = o;
            btn.addEventListener('click', () => {
                cleanup();
                // 点击时朗读该英文单词
                audioManager.speak(o, 'en-US');
                if (o === w.word) self._onCorrect();
                else self._onWrong();
            });
            optsDiv.appendChild(btn);
            btns.push(btn);
        });
        content.appendChild(optsDiv);
        updateSelection();

        function onKeydown(e) {
            if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                e.preventDefault();
                selectedIdx = (selectedIdx - 1 + btns.length) % btns.length;
                updateSelection();
            } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                e.preventDefault();
                selectedIdx = (selectedIdx + 1) % btns.length;
                updateSelection();
            } else if (e.key >= '1' && e.key <= '4') {
                e.preventDefault();
                const idx = parseInt(e.key) - 1;
                if (idx < btns.length) {
                    selectedIdx = idx;
                    updateSelection();
                }
            } else if (e.key === 'Enter') {
                e.preventDefault();
                cleanup();
                audioManager.speak(opts[selectedIdx], 'en-US');
                if (opts[selectedIdx] === w.word) self._onCorrect();
                else self._onWrong();
            }
        }
        document.addEventListener('keydown', onKeydown);
    }

    _chalFillLetters(content, w) {
        const word = w.word;
        const isPhrase = word.includes(' ');

        // Build display: letters as blanks, spaces as visible gaps
        let html = '<div class="chal-fill-word">';
        // blankIndices: 只记录需要填入的字母在word中的索引（跳过空格）
        const blankIndices = [];
        for (let i = 0; i < word.length; i++) {
            if (word[i] === ' ') {
                html += `<span class="chal-fill-space">&nbsp;</span>`;
            } else {
                html += `<span class="chal-fill-blank" data-blank-index="${blankIndices.length}" data-word-index="${i}">_</span>`;
                blankIndices.push(i);
            }
        }
        html += '</div>';

        const subHintText = isPhrase ? 'Type the full phrase with keyboard (use Space for spaces)' : 'Type the full word with keyboard';
        content.innerHTML = `
            <div class="chal-hint">${w.meaning}</div>
            ${html}
            <div class="chal-sub-hint">${subHintText}</div>
            <div class="chal-confirm-wrap">
                <button class="chal-confirm-btn" id="chal-confirm" disabled>Confirm</button>
            </div>
            <div class="chal-skip" id="chal-skip">Skip</div>
        `;

        // Track blank inputs - only for non-space characters
        const blankEls = content.querySelectorAll('.chal-fill-blank');
        const blankInputs = new Array(blankIndices.length).fill('');
        let activeBlank = 0; // currently focused blank index (among blanks only)

        // Highlight first blank
        if (blankEls.length > 0) blankEls[0].classList.add('blank-active');

        const confirmBtn = document.getElementById('chal-confirm');
        const self = this;

        function updateBlankDisplay() {
            blankEls.forEach((el, i) => {
                el.textContent = blankInputs[i] ? blankInputs[i] : '_';
                el.classList.toggle('blank-filled', !!blankInputs[i]);
            });
            // Enable confirm when all blanks filled
            const allFilled = blankInputs.every(v => v !== '');
            confirmBtn.disabled = !allFilled;
        }

        function focusBlank(idx) {
            blankEls.forEach(el => el.classList.remove('blank-active'));
            activeBlank = idx;
            if (blankEls[idx]) blankEls[idx].classList.add('blank-active');
        }

        // Click on blank to focus it
        blankEls.forEach((el, i) => {
            el.style.cursor = 'pointer';
            el.addEventListener('click', () => focusBlank(i));
        });

        // 构建正确的完整答案用于比对
        function buildResult() {
            let result = '';
            let blankIdx = 0;
            for (let i = 0; i < word.length; i++) {
                if (word[i] === ' ') {
                    result += ' ';
                } else {
                    result += blankInputs[blankIdx] || '';
                    blankIdx++;
                }
            }
            return result;
        }

        // Keyboard handler
        function onKeydown(e) {
            if (e.key === 'Escape') {
                cleanup();
                self._onWrong();
                return;
            }

            // Backspace: clear current blank and move back
            if (e.key === 'Backspace') {
                e.preventDefault();
                if (blankInputs[activeBlank]) {
                    blankInputs[activeBlank] = '';
                } else if (activeBlank > 0) {
                    activeBlank--;
                    blankInputs[activeBlank] = '';
                }
                focusBlank(activeBlank);
                updateBlankDisplay();
                return;
            }

            // Enter: confirm if all filled
            if (e.key === 'Enter') {
                e.preventDefault();
                const allFilled = blankInputs.every(v => v !== '');
                if (allFilled) {
                    cleanup();
                    const result = buildResult();
                    if (result === word) self._onCorrect();
                    else self._onWrong();
                }
                return;
            }

            // Space key: for phrases, auto-skip to next blank (no need to type space)
            if (e.key === ' ') {
                e.preventDefault();
                // Move to next unfilled blank
                if (activeBlank < blankInputs.length - 1) {
                    focusBlank(activeBlank + 1);
                }
                return;
            }

            // Letter input (allow letters and common punctuation)
            if (/^[a-zA-Z.\-'"!,?;:()\/\[\]]$/i.test(e.key)) {
                e.preventDefault();
                if (activeBlank < blankInputs.length) {
                    blankInputs[activeBlank] = e.key;
                    updateBlankDisplay();
                    // Move to next blank
                    if (activeBlank < blankInputs.length - 1) {
                        focusBlank(activeBlank + 1);
                    }
                }
            }
        }

        document.addEventListener('keydown', onKeydown);

        function cleanup() {
            document.removeEventListener('keydown', onKeydown);
        }

        // Confirm button
        confirmBtn.addEventListener('click', () => {
            cleanup();
            const result = buildResult();
            // 确认时朗读完整单词/词组
            audioManager.speak(word, 'en-US');
            if (result === word) self._onCorrect();
            else self._onWrong();
        });

        // Skip button
        document.getElementById('chal-skip').addEventListener('click', () => {
            cleanup();
            self._onWrong();
        });

    }

    _chalSentence(content, w) {
        // 获取正确句子：优先使用例句
        const correct = w.example || `I like ${w.word}.`;
        
        content.innerHTML = `
            <div class="chal-hint">Pick the sentence with "${w.word}"</div>
        `;

        // 获取当前年级的单词列表
        const grade = this.gameState.currentGrade || 1;
        const unit = this.gameState.currentUnit || 'all';
        const words = wordData.getWordsByGrade(grade, unit);
        
        // 生成错误选项：使用其他单词的例句，确保不含目标单词
        const errorSentences = [];
        const targetWordLower = w.word.toLowerCase();
        
        // 从当前年级/单元的其他单词例句中选取
        if (words && words.length > 1) {
            const otherWords = words.filter(x => x.word !== w.word && x.example);
            const shuffled = secureShuffle(otherWords);
            
            for (const word of shuffled) {
                if (errorSentences.length >= 3) break;
                const sentence = word.example;
                // 检查句子是否包含目标单词（不区分大小写，避免误匹配子串）
                const sentenceLower = sentence.toLowerCase();
                const words_in_sentence = sentenceLower.split(/\s+/);
                // 使用单词边界匹配，避免 "cat" 匹配 "category"
                if (!words_in_sentence.some(sw => sw.replace(/[^a-z]/g, '') === targetWordLower)) {
                    errorSentences.push(sentence);
                }
            }
        }
        
        // 如果不足3个，从其他年级的单词例句中补充
        if (errorSentences.length < 3) {
            const allWords = wordData.getWordsByGrade('all');
            const usedSentences = new Set(errorSentences);
            const otherGradeWords = allWords.filter(x => 
                x.word !== w.word && 
                x.example && 
                !usedSentences.has(x.example)
            );
            const shuffledAll = secureShuffle(otherGradeWords);
            
            for (const word of shuffledAll) {
                if (errorSentences.length >= 3) break;
                const sentence = word.example;
                const sentenceLower = sentence.toLowerCase();
                const words_in_sentence = sentenceLower.split(/\s+/);
                if (!words_in_sentence.some(sw => sw.replace(/[^a-z]/g, '') === targetWordLower)) {
                    errorSentences.push(sentence);
                }
            }
        }
        
        // 构建选项数组
        const optionTemplates = [
            { s: correct, ok: true },
            ...errorSentences.slice(0, 3).map(s => ({ s, ok: false }))
        ];
        
        const opts = secureShuffle(optionTemplates);

        const optsDiv = document.createElement('div');
        optsDiv.className = 'chal-options chal-sentences';
        const btns = [];
        let selectedIdx = 0;

        // 键盘导航
        const self = this;
        function cleanup() {
            document.removeEventListener('keydown', onKeydown);
        }
        function updateSelection() {
            btns.forEach((b, i) => b.classList.toggle('selected', i === selectedIdx));
        }

        opts.forEach(o => {
            const btn = document.createElement('div');
            btn.className = 'chal-option chal-option-purple';
            btn.textContent = o.s;
            btn.addEventListener('click', () => {
                cleanup();
                // 点击时朗读句子
                audioManager.speak(o.s, 'en-US');
                if (o.ok) self._onCorrect();
                else self._onWrong();
            });
            optsDiv.appendChild(btn);
            btns.push(btn);
        });
        content.appendChild(optsDiv);
        updateSelection();

        function onKeydown(e) {
            if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                e.preventDefault();
                selectedIdx = (selectedIdx - 1 + btns.length) % btns.length;
                updateSelection();
            } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                e.preventDefault();
                selectedIdx = (selectedIdx + 1) % btns.length;
                updateSelection();
            } else if (e.key >= '1' && e.key <= '4') {
                e.preventDefault();
                const idx = parseInt(e.key) - 1;
                if (idx < btns.length) {
                    selectedIdx = idx;
                    updateSelection();
                }
            } else if (e.key === 'Enter') {
                e.preventDefault();
                cleanup();
                audioManager.speak(opts[selectedIdx].s, 'en-US');
                if (opts[selectedIdx].ok) self._onCorrect();
                else self._onWrong();
            }
        }
        document.addEventListener('keydown', onKeydown);
    }

    _onCorrect() {
        // 防止重复调用（多个残留 keydown 监听器同时触发）
        if (this._chalProcessing) return;
        this._chalProcessing = true;

        audioManager.playMatchSuccess();
        this.showFloat('Correct!', '#27AE60');
        this.addExp(10);
        this.monopolyState.chalStep++;
        this._updateUI();

        if (this.monopolyState.chalStep >= (this.monopolyState.maxChalStep || 4)) {
            const ms = this.monopolyState;
            const c = ms.cells[ms.playerPos];
            
            if (ms.chalMode === 'challenge') {
                // 挑战电脑格子成功，付租金给对应的AI
                const price = c.price || 100;
                const aiIndex = parseInt(c.owner.replace('ai', ''));
                const ownerAi = ms.ais[aiIndex];
                ms.playerMoney -= price;
                if (ownerAi) ownerAi.money += price;
                this._updateUI();
                this.showFloat(`Challenge won! Pay rent -$${price}`, '#27AE60');
                this._addEventLog({ key: 'logPlayerChallengeWon', params: { price: `$${price}` }, type: 'player' });
                if (this._checkBankrupt()) return;
            } else if (ms.chalMode === 'upgrade') {
                // 升级格子成功
                const upgradeCost = ms.upgradeCost || 100;
                ms.playerMoney -= upgradeCost;
                c.level = (c.level || 0) + 1;
                c.upgradeCount = (c.upgradeCount || 0) + 1;
                c.rent = Math.floor((c.rent || 100) * 2);
                c.price = c.rent; // 保持同步
                this._updateCellOwner(c, true);
                this._updateUI();
                this.showFloat(`Upgrade success! Lv.${c.level}`, '#FFD700');
                audioManager.playComplete();
                this._addEventLog({ key: 'logPlayerUpgradeSuccess', params: { word: c.word.word, level: c.level, cost: `$${upgradeCost}` }, type: 'gain' });
                this._checkBankrupt();
            } else if (ms.chalMode === 'sell') {
                // 出售格子成功
                const sellPrice = ms.sellPrice || Math.floor((c.rent || 50) * 0.5);
                ms.playerMoney += sellPrice;
                ms.totalOwned--;
                c.owner = 'none';
                c.level = 0;
                c.upgradeCount = 0;
                this._updateCellOwner(c);
                this._updateUI();
                this.showFloat(`Sold! +$${sellPrice}`, '#FFD700');
                audioManager.playComplete();
                this._addEventLog({ key: 'logPlayerSold', params: { word: c.word.word, price: `$${sellPrice}` }, type: 'gain' });
            } else {
                // 占领空格子成功，奖励100
                c.owner = 'player';
                ms.totalOwned++;
                ms.playerMoney += 100;
                this._updateUI();
                this._updateCellOwner(c);
                this.showFloat('Occupied!', '#FFD700');
                this.showFloat('+$100', '#FFD700');
                audioManager.playComplete();
                this.gameState.wordsLearned.add(c.word.word);
                this._addEventLog({ key: 'logPlayerOccupied', params: { word: c.word.word }, type: 'gain' });
                
                this._checkWin();
            }

            const modal = document.getElementById('challenge-modal');
            if (modal) modal.remove();

            if (!ms.gameOver) this._endTurn();
        } else {
            this._showChallenge();
        }
    }

    _onWrong() {
        // 防止重复调用
        if (this._chalProcessing) return;
        this._chalProcessing = true;

        audioManager.playMatchError();
        
        // 记录到错题本
        const c = this.monopolyState.cells[this.monopolyState.playerPos];
        if (c && c.word && typeof wrongBook !== 'undefined') {
            wrongBook.addWrongWord({
                word: c.word.word,
                meaning: c.word.meaning || '',
                example: c.word.example || '',
                rootAffix: c.word.rootAffix || '',
                phonetic: c.word.phonetic || '',
                from: 'monopoly',
                grade: this.gameState.currentGrade || 'all'
            }).catch(err => console.error('保存错题失败:', err));
        }
        
        const ms = this.monopolyState;
        const modal = document.getElementById('challenge-modal');
        if (modal) modal.remove();
        
        if (ms.chalMode === 'challenge') {
            // 挑战电脑格子失败，付双倍租金给对应的AI
            const c = ms.cells[ms.playerPos];
            const price = c.price || 100;
            const doublePrice = price * 2;
            const aiIndex = parseInt(c.owner.replace('ai', ''));
            const ownerAi = ms.ais[aiIndex];
            ms.playerMoney -= doublePrice;
            if (ownerAi) ownerAi.money += doublePrice;
            this._updateUI();
            this.showFloat(`Wrong! Pay double rent -$${doublePrice}`, '#E74C3C');
            this._addEventLog({ key: 'logPlayerWrongDoubleRent', params: { price: `$${doublePrice}` }, type: 'player' });
        } else if (ms.chalMode === 'upgrade') {
            // 升级失败：罚款租金的价格（1倍租金）
            const c = ms.cells[ms.playerPos];
            const fine = c.rent || 100;
            ms.playerMoney -= fine;
            this._updateUI();
            this.showFloat(`Upgrade failed! -$${fine}`, '#E74C3C');
            this._addEventLog({ key: 'logPlayerUpgradeFail', params: { word: c.word.word, fine: `$${fine}` }, type: 'player' });
            if (this._checkBankrupt()) return;
        } else if (ms.chalMode === 'sell') {
            // 出售失败：罚款租金的50%
            const c = ms.cells[ms.playerPos];
            const fine = Math.floor((c.rent || 100) * 0.5);
            ms.playerMoney -= fine;
            this._updateUI();
            this.showFloat(`Sell failed! -$${fine}`, '#E74C3C');
            this._addEventLog({ key: 'logPlayerSellFail', params: { word: c.word.word, fine: `$${fine}` }, type: 'player' });
            if (this._checkBankrupt()) return;
        } else {
            // 占领空格子失败，罚款100
            ms.playerMoney -= 100;
            this._updateUI();
                this.showFloat('Wrong! -$100', '#E74C3C');
                this._addEventLog({ key: 'logPlayerWrong', type: 'player' });
        }
        
        if (this._checkBankrupt()) return;
        this._endTurn();
    }

    // === 玩家挑战电脑格子 ===
    _playerChallengeAiCell(cell) {
        this._startChallenge(cell, 'challenge');
    }

    // === 回合与AI ===
    _endTurn() {
        const ms = this.monopolyState;
        if (ms.gameOver) return;
        
        // 如果当前是玩家回合，切换到第一个非破产的AI
        if (ms.isPlayerTurn) {
            ms.isPlayerTurn = false;
            ms.currentAiIndex = 0;
            // 跳过破产的AI
            while (ms.currentAiIndex < ms.ais.length && ms.ais[ms.currentAiIndex].bankrupt) {
                ms.currentAiIndex++;
            }
            // 如果所有AI都破产，直接回到玩家回合
            if (ms.currentAiIndex >= ms.ais.length) {
                ms.isPlayerTurn = true;
                ms.currentAiIndex = 0;
                ms.round++;
                // 每10回合触发天灾
                if (ms.round % 10 === 0) this._triggerDisaster();
                // 检查是否达到40回合
                this._checkWin();
            }
        } else {
            // 如果当前是AI回合，切换到下一个非破产的AI或回到玩家
            ms.currentAiIndex++;
            // 跳过破产的AI
            while (ms.currentAiIndex < ms.ais.length && ms.ais[ms.currentAiIndex].bankrupt) {
                ms.currentAiIndex++;
            }
            if (ms.currentAiIndex >= ms.ais.length) {
                // 所有AI都行动过了，回到玩家
                ms.isPlayerTurn = true;
                ms.currentAiIndex = 0;
                ms.round++;
                // 每10回合触发天灾
                if (ms.round % 10 === 0) this._triggerDisaster();
                // 检查是否达到40回合
                this._checkWin();
            }
        }

        const turnInfo = document.getElementById('turn-info');
        const rollBtn = document.getElementById('roll-btn');
        const currentAi = ms.ais[ms.currentAiIndex];

        if (ms.isPlayerTurn) {
            this._updateUI();
            turnInfo.textContent = t('yourTurn');
            turnInfo.style.color = '#27AE60';
            rollBtn.textContent = t('rollDice');
            rollBtn.classList.remove('ai-turn');
            rollBtn.style.display = '';
            ms.isRolling = false;
        } else {
            this._updateUI();
            turnInfo.textContent = `${currentAi.name} ${t('aiTurn')}`;
            turnInfo.style.color = '#E74C3C';
            rollBtn.textContent = `${currentAi.name} ${t('rollDice')}`;
            rollBtn.classList.add('ai-turn');
            rollBtn.style.display = '';
            const aiTimer = setTimeout(() => this._aiTurn(), 1200);
            this._animTimers.push(aiTimer);
        }
    }

    _aiTurn() {
        const ms = this.monopolyState;
        if (ms.gameOver) return;
        const currentAi = ms.ais[ms.currentAiIndex];
        if (!currentAi || currentAi.bankrupt) {
            // 如果当前AI已破产，跳到下一个
            this._endTurn();
            return;
        }
        const v = secureRandomInt(1, 6);

        const cube = document.getElementById('dice-cube');

        if (cube) {
            // 3D骰子动画
            const scene = document.getElementById('dice-scene');
            scene.classList.remove('bounce-land');
            cube.classList.remove('bounce-land');
            for (let i = 1; i <= 6; i++) cube.classList.remove('dice-show-' + i);
            cube.classList.add('rolling');

            setTimeout(() => {
                for (let i = 1; i <= 6; i++) cube.classList.remove('dice-show-' + i);
                const finalTransforms = {
                    1: 'rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
                    2: 'rotateX(0deg) rotateY(180deg) rotateZ(0deg)',
                    3: 'rotateX(0deg) rotateY(90deg) rotateZ(0deg)',
                    4: 'rotateX(0deg) rotateY(-90deg) rotateZ(0deg)',
                    5: 'rotateX(90deg) rotateY(0deg) rotateZ(0deg)',
                    6: 'rotateX(-90deg) rotateY(0deg) rotateZ(0deg)'
                };
                cube.style.transition = 'none';
                cube.style.transform = finalTransforms[v];
                cube.offsetHeight;
                cube.classList.remove('rolling');
                requestAnimationFrame(() => { cube.style.transition = ''; });
                const scene = document.getElementById('dice-scene');
                setTimeout(() => {
                    scene.classList.add('bounce-land');
                    setTimeout(() => scene.classList.remove('bounce-land'), 750);
                }, 50);
                this.showFloat(`${currentAi.name} rolled ${v}`, '#E74C3C');
                this._addEventLog({ key: 'logAiRolled', params: { name: currentAi.name, steps: v }, type: 'ai' });
                this._aiMoveAfterRoll(v);
            }, 1800);
        } else {
            // 后备方案
            const faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
            const diceEl = document.getElementById('dice-display');
            if (diceEl) diceEl.textContent = faces[v - 1];
            this.showFloat(`${currentAi.name} rolled ${v}`, '#E74C3C');
            this._addEventLog({ key: 'logAiRolled', params: { name: currentAi.name, steps: v }, type: 'ai' });
            this._aiMoveAfterRoll(v);
        }
    }

    _aiMoveAfterRoll(v) {
        const ms = this.monopolyState;
        if (ms.gameOver) return;
        const currentAi = ms.ais[ms.currentAiIndex];
        let moved = 0;
        const moveStep = () => {
            if (ms.gameOver) return;
            currentAi.pos = (currentAi.pos + 1) % ms.cells.length;
            this._updateTokens();
            moved++;

            if (currentAi.pos === 0 && moved > 1) currentAi.money += 100;

            if (moved >= v) {
                // 落地后立即高亮格子
                document.querySelectorAll('.board-cell').forEach(el => el.classList.remove('cell-active'));
                const cellEl = document.querySelector(`.board-cell[data-index="${currentAi.pos}"]`);
                if (cellEl) cellEl.classList.add('cell-active');
                
                const t2 = setTimeout(() => this._onAiLand(), 1500);
                this._animTimers.push(t2);
            } else {
                const t = setTimeout(moveStep, 750);
                this._animTimers.push(t);
            }
        };
        const t = setTimeout(moveStep, 900);
        this._animTimers.push(t);
    }

    _onAiLand() {
        const ms = this.monopolyState;
        if (ms.gameOver) return;
        const currentAi = ms.ais[ms.currentAiIndex];
        const c = ms.cells[currentAi.pos];

        if (c.type === 'start') {
            currentAi.money += 100;
            this._updateUI();
        } else if (c.type === 'bonus') {
            // 根据 bonusType 选择事件列表
            const events = c.bonusType === 'move' ? this.moveEvents : this.luckyEvents;
            const event = events[secureRandomInt(0, events.length - 1)];
            
            switch (event.type) {
                case 'gain': {
                    const amount = event.amount();
                    currentAi.money += amount;
                    this._updateUI();
                    this.showFloat(`${currentAi.name} ${event.text(amount)}`, event.color);
                    break;
                }
                case 'extra_turn':
                    this.showFloat(`${currentAi.name} gets an extra turn!`, event.color);
                    setTimeout(() => this._aiTurn(), 1500);
                    return;
                case 'forward': {
                    const amount = event.amount();
                    this.showFloat(`${currentAi.name} ${event.text(amount)}`, event.color);
                    currentAi.pos = (currentAi.pos + amount) % ms.cells.length;
                    this._updateTokens();
                    setTimeout(() => this._applyBonusLanding(`ai${ms.currentAiIndex}`), 750);
                    return;
                }
                case 'backward': {
                    const amount = event.amount();
                    this.showFloat(`${currentAi.name} ${event.text(amount)}`, event.color);
                    currentAi.pos = (currentAi.pos - amount + ms.cells.length) % ms.cells.length;
                    this._updateTokens();
                    setTimeout(() => this._applyBonusLanding(`ai${ms.currentAiIndex}`), 750);
                    return;
                }
                default:
                    this._endTurn();
                    return;
            }
        } else if (c.type === 'tax') {
            const taxAmount = c.amount || 400;
            currentAi.money -= taxAmount;
            this._updateUI();
            this.showFloat(`${currentAi.name} tax -$${taxAmount}`, '#E74C3C');
            this._addEventLog({ key: 'logAiTax', params: { name: currentAi.name, amount: `$${taxAmount}` }, type: 'ai' });
            if (this._checkBankrupt()) return;
        } else if (c.type === 'word') {
            if (c.owner === `ai${ms.currentAiIndex}`) {
                // 已占领，50%概率尝试升级
                if (secureRandomInt(1, 100) <= 50) {
                    this._aiTryUpgrade(c);
                }
            } else if (c.owner && c.owner !== 'none') {
                // 格子已被占领（玩家或其他AI），进行挑战
                this._aiChallenge(c);
            } else if (secureRandomInt(1, 100) <= currentAi.difficulty) {
                c.owner = `ai${ms.currentAiIndex}`;
                currentAi.totalOwned++;
                currentAi.money += 100;
                this._updateCellOwner(c);
                this._updateUI();
                this.showFloat(`${currentAi.name} occupied!`, '#E74C3C');
                this.showFloat('+$100', '#27AE60');
                this._addEventLog({ key: 'logAiOccupied', params: { name: currentAi.name, word: c.word ? c.word.word : 'Unknown' }, type: 'ai' });
            } else {
                // 占领失败，罚款100
                currentAi.money -= 100;
                this._updateUI();
                this.showFloat(`${currentAi.name} occupation failed! -$100`, '#E74C3C');
                this._addEventLog({ key: 'logAiOccupiedFail', params: { name: currentAi.name }, type: 'ai' });
            }
        }

        this._updateUI();
        this._checkWin();
        if (!ms.gameOver) this._endTurn();
    }

    // === 电脑做题挑战 ===
    _aiChallenge(cell) {
        const ms = this.monopolyState;
        const currentAi = ms.ais[ms.currentAiIndex];
        const price = cell.price || 100;
        
        // 使用当前AI的难度作为答对概率
        const isCorrect = secureRandomInt(1, 100) <= currentAi.difficulty;
        
        // 确定租金接收者
        let recipientName = '';
        let recipientMoneyUpdate = null;
        
        if (cell.owner === 'player') {
            recipientName = 'Player';
            recipientMoneyUpdate = (amount) => { ms.playerMoney += amount; };
        } else if (cell.owner && cell.owner.startsWith('ai')) {
            const aiIndex = parseInt(cell.owner.replace('ai', ''));
            const ownerAi = ms.ais[aiIndex];
            if (ownerAi) {
                recipientName = ownerAi.name;
                recipientMoneyUpdate = (amount) => { ownerAi.money += amount; };
            }
        }
        
        if (isCorrect) {
            // 答对：付租金
            currentAi.money -= price;
            if (recipientMoneyUpdate) recipientMoneyUpdate(price);
            this._updateUI();
            this.showFloat(`${currentAi.name} answered correctly, pay rent to ${recipientName} +$${price}`, '#27AE60');
            this._addEventLog({ key: 'logAiAnswerCorrect', params: { name: currentAi.name, recipient: recipientName, price: `$${price}` }, type: 'ai' });
        } else {
            // 答错：付双倍租金
            const doublePrice = price * 2;
            currentAi.money -= doublePrice;
            if (recipientMoneyUpdate) recipientMoneyUpdate(doublePrice);
            this._updateUI();
            this.showFloat(`${currentAi.name} answered wrong, pay double rent to ${recipientName} +$${doublePrice}`, '#27AE60');
            this._addEventLog({ key: 'logAiAnswerWrong', params: { name: currentAi.name, recipient: recipientName, price: `$${doublePrice}` }, type: 'ai' });
        }
        this._checkBankrupt();
    }

    // === AI尝试升级 ===
    _aiTryUpgrade(cell) {
        const ms = this.monopolyState;
        const currentAi = ms.ais[ms.currentAiIndex];
        const upgradeCount = cell.upgradeCount || 0;
        const maxUpgrades = 3;
        
        // 检查是否已达到最大升级次数
        if (upgradeCount >= maxUpgrades) {
            this._addEventLog({ key: 'logAiMaxUpgrades', params: { name: currentAi.name, word: cell.word.word }, type: 'ai' });
            return;
        }
        
        // 升级费 = 当前租金
        const upgradeCost = cell.rent || 50;
        
        // 检查AI是否有足够金钱
        if (currentAi.money < upgradeCost) {
            this.showFloat(`${currentAi.name} insufficient funds to upgrade`, '#E67E22');
            this._addEventLog({ key: 'logAiInsufficientFunds', params: { name: currentAi.name, word: cell.word.word }, type: 'ai' });
            return;
        }
        
        // 使用AI难度作为成功概率
        const isSuccess = secureRandomInt(1, 100) <= currentAi.difficulty;
        
        if (isSuccess) {
            // 升级成功
            currentAi.money -= upgradeCost;
            cell.level = (cell.level || 0) + 1;
            cell.upgradeCount = upgradeCount + 1;
            cell.rent = Math.floor((cell.rent || 100) * 2);
            cell.price = cell.rent; // 保持同步
            this._updateCellOwner(cell, true);
            this._updateUI();
            this.showFloat(`${currentAi.name} upgrade success! Lv.${cell.level}`, '#FFD700');
            this._addEventLog({ key: 'logAiUpgradeSuccess', params: { name: currentAi.name, word: cell.word.word, level: cell.level, cost: `$${upgradeCost}` }, type: 'ai' });
        } else {
            // 升级失败：罚款租金的价格（1倍租金）
            const fine = cell.rent || 100;
            currentAi.money -= fine;
            this._updateUI();
            this.showFloat(`${currentAi.name} upgrade failed! -$${fine}`, '#E74C3C');
            this._addEventLog({ key: 'logAiUpgradeFail', params: { name: currentAi.name, word: cell.word.word, fine: `$${fine}` }, type: 'ai' });
        }
    }

    // === 天灾系统 ===
    async _triggerDisaster() {
        const ms = this.monopolyState;

        // 随机选择一种天灾类型
        const disasters = [
            { type: 'typhoon', name: 'Typhoon', emoji: '🌪️', color: '#3498DB', effect: 'disaster-typhoon' },
            { type: 'meteor', name: 'Meteor', emoji: '☄️', color: '#E74C3C', effect: 'disaster-meteor' },
            { type: 'coldwave', name: 'Cold Wave', emoji: '🥶', color: '#00BCD4', effect: 'disaster-coldwave' }
        ];
        const disaster = disasters[secureRandomInt(0, disasters.length - 1)];

        // 显示全屏特效
        this.showDisasterOverlay(disaster);
        this._addEventLog({ key: 'logDisasterStrike', params: { emoji: disaster.emoji, name: disaster.name }, type: 'info' });

        // 等待3秒
        await new Promise(resolve => setTimeout(resolve, 3000));

        // 移除全屏特效
        this.hideDisasterOverlay();

        // 收集所有被击中的格子
        const hitCells = [];

        // 处理玩家的格子
        const playerCells = ms.cells.filter(c => c.owner === 'player');
        if (playerCells.length > 0) {
            const target = playerCells[secureRandomInt(0, playerCells.length - 1)];
            if (target.level === 0) {
                target.owner = 'none';
                target.upgradeCount = 0;
                ms.totalOwned--;
                this._updateCellOwner(target);
                this.showFloat(`Your "${target.word.word}" became unowned!`, '#E74C3C');
                this._addEventLog({ key: 'logDisasterPlayerUnowned', params: { name: disaster.name, word: target.word.word }, type: 'player' });
            } else {
                target.level--;
                this._updateCellOwner(target);
                this.showFloat(`Your "${target.word.word}" downgraded to Lv.${target.level}!`, '#E67E22');
                this._addEventLog({ key: 'logDisasterPlayerDowngraded', params: { name: disaster.name, word: target.word.word, level: target.level }, type: 'player' });
            }
            hitCells.push(target.index);
        }

        // 处理每个AI的格子
        ms.ais.forEach((ai, i) => {
            if (ai.bankrupt) return;
            const aiOwner = `ai${i}`;
            const aiCells = ms.cells.filter(c => c.owner === aiOwner);
            if (aiCells.length > 0) {
                const target = aiCells[secureRandomInt(0, aiCells.length - 1)];
                if (target.level === 0) {
                    target.owner = 'none';
                    target.upgradeCount = 0;
                    ai.totalOwned--;
                    this._updateCellOwner(target);
                    this.showFloat(`${ai.name}'s "${target.word.word}" became unowned!`, '#E67E22');
                    this._addEventLog({ key: 'logDisasterAiUnowned', params: { name: disaster.name, ai: ai.name, word: target.word.word }, type: 'ai' });
                } else {
                    target.level--;
                    this._updateCellOwner(target);
                    this.showFloat(`${ai.name}'s "${target.word.word}" downgraded to Lv.${target.level}!`, '#E67E22');
                    this._addEventLog({ key: 'logDisasterAiDowngraded', params: { name: disaster.name, ai: ai.name, word: target.word.word, level: target.level }, type: 'ai' });
                }
                hitCells.push(target.index);
            }
        });

        // 给被击中的格子添加特效，3秒后移除
        hitCells.forEach(cellIndex => {
            const cellEl = document.querySelector(`.board-cell[data-index="${cellIndex}"]`);
            if (cellEl) {
                cellEl.classList.add(disaster.effect);
                setTimeout(() => {
                    cellEl.classList.remove(disaster.effect);
                }, 3000);
            }
        });

        this._updateUI();
        this._updateTokens();
    }

    // 显示天灾全屏特效
    showDisasterOverlay(disaster) {
        // 移除已存在的覆盖层
        this.hideDisasterOverlay();
        
        const overlay = document.createElement('div');
        overlay.className = 'disaster-overlay';
        overlay.id = 'disaster-overlay';
        overlay.innerHTML = `
            <div class="disaster-emoji">${disaster.emoji}</div>
            <div class="disaster-name">${disaster.name} strikes!</div>
            <div class="disaster-subtitle">Disaster strikes, cells damaged...</div>
        `;
        document.body.appendChild(overlay);
        
        // 触发动画
        requestAnimationFrame(() => {
            overlay.classList.add('active');
        });
    }

    // 隐藏天灾全屏特效
    hideDisasterOverlay() {
        const overlay = document.getElementById('disaster-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 500);
        }
    }

    // === 破产检测 ===
    _checkBankrupt() {
        const ms = this.monopolyState;
        let changed = false;

        // 检查AI破产
        ms.ais.forEach((ai, i) => {
            if (!ai.bankrupt && ai.money < 0) {
                ai.bankrupt = true;
                ai.money = 0;
                changed = true;

                // 清除该AI占领的所有格子
                let clearedCount = 0;
                ms.cells.forEach(cell => {
                    if (cell.owner === `ai${i}`) {
                        cell.owner = 'none';
                        cell.level = 0;
                        cell.upgradeCount = 0;
                        this._updateCellOwner(cell);
                        clearedCount++;
                    }
                });
                ai.totalOwned = 0;

                const appear = this.aiAppearances[i % this.aiAppearances.length];
                this.showFloat(`${appear.emoji} ${ai.name} bankrupt!`, '#E74C3C');
                this._addEventLog({ key: 'logAiBankrupt', params: { name: ai.name, count: clearedCount }, type: 'ai' });
            }
        });

        // 检查玩家破产
        if (ms.playerMoney < 0) {
            ms.gameOver = true;
            this.showFloat('You are bankrupt!', '#E74C3C');
            this._addEventLog({ key: 'logPlayerBankrupt', type: 'player' });
            const playerAssets = this._calcAssets('player');
            const aiAssets = ms.ais.filter(ai => !ai.bankrupt).map(ai => this._calcAssets(`ai-${ai.index}`));
            const maxAiAssets = Math.max(...aiAssets, 0);
            this._showGameOver(false, playerAssets, maxAiAssets);
            return true;
        }

        if (changed) {
            this._updateUI();
            this._updateTokens();
            // 检查是否所有AI都破产
            const allAiBankrupt = ms.ais.every(ai => ai.bankrupt);
            if (allAiBankrupt) {
                ms.gameOver = true;
                this._addEventLog({ key: 'logAllAiBankrupt', type: 'gain' });
                const playerAssets = this._calcAssets('player');
                const aiAssets = 0;
                this._showGameOver(true, playerAssets, aiAssets);
                return true;
            }
        }
        return ms.gameOver;
    }

    // === 胜利检测 ===
    _checkWin() {
        const ms = this.monopolyState;
        
        // 40回合后比较资产决定胜负
        if (ms.round >= 40) {
            const playerAssets = this._calcAssets('player');
            const aiAssets = ms.ais.filter(ai => !ai.bankrupt).map(ai => this._calcAssets(`ai-${ai.index}`));
            const maxAiAssets = Math.max(...aiAssets, 0);
            
            ms.gameOver = true;
            if (playerAssets >= maxAiAssets) {
                this._showGameOver(true, playerAssets, maxAiAssets);
            } else {
                this._showGameOver(false, playerAssets, maxAiAssets);
            }
        }
    }
    
    // 计算资产：金币 + 所有格子价格（升级格子用升级后的价格）
    _calcAssets(owner) {
        const ms = this.monopolyState;
        let assets = 0;
        
        // 计算金币
        if (owner === 'player') {
            assets += ms.playerMoney;
        } else {
            const aiIndex = parseInt(owner.split('-')[1]);
            const ai = ms.ais.find(a => a.index === aiIndex);
            if (ai) assets += ai.money;
        }
        
        // 计算格子价格总和
        ms.cells.forEach(cell => {
            if (cell.owner === owner && cell.type === 'word') {
                assets += cell.price || 100;
            }
        });
        
        return assets;
    }

    _showGameOver(win, playerAssets, aiAssets) {
        const elapsed = Math.floor((Date.now() - this.monopolyState.startTime) / 1000);
        const mins = Math.floor(elapsed / 60);
        const secs = elapsed % 60;

        const overlay = document.createElement('div');
        overlay.className = 'gameover-overlay';
        overlay.innerHTML = `
            <div class="gameover-box">
                <div class="gameover-icon">${win ? '🎉' : '😞'}</div>
                <div class="gameover-title" style="color:${win ? '#27AE60' : '#E74C3C'}">${win ? 'You Win!' : 'You Lose'}</div>
                <div class="gameover-stats">
                    Owned: ${this.monopolyState.totalOwned} | Coins: ${this.monopolyState.playerMoney}
                </div>
                <div class="gameover-assets">Your Assets: $${playerAssets} | AI Max: $${aiAssets}</div>
                <div class="gameover-time">Time: ${mins}m ${secs}s | Round: ${this.monopolyState.round}</div>
                <button class="gameover-btn" id="gameover-btn">Back to Menu</button>
            </div>
        `;
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('active'));

        const gameoverBtn = document.getElementById('gameover-btn');
        gameoverBtn.addEventListener('click', () => {
            this.monopolyState.gameOver = true;
            overlay.remove();
            if (window.app) window.app.showMainMenu();
        });

        if (win) {
            audioManager.playCelebration();
            this.addExp(50);
        }

        // 保存排行榜成绩
        if (window.app && window.app.saveEnglishLeaderboard) {
            // 保存中：按钮显示loading，不可点击
            gameoverBtn.disabled = true;
            gameoverBtn.classList.add('gameover-btn-loading');
            window.app.saveEnglishLeaderboard('monopoly', {
                score: playerAssets,
                level: this.monopolyState.round || 1,
                combo: 0,
                time: elapsed,
                grade: (this.gameState && this.gameState.currentGrade) || 'all'
            }).finally(() => {
                // 保存完成后恢复按钮
                gameoverBtn.disabled = false;
                gameoverBtn.classList.remove('gameover-btn-loading');
            });
        }
    }
}

// 创建全局实例
const gameEngine = new GameEngine();

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameEngine, gameEngine };
}
