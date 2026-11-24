/**
 * 单词闪卡模块
 * 按年级和单元筛选单词，以正反面卡片形式背诵
 * 依赖：data.js (wordData), audio.js (audioManager)
 */

(function () {
    'use strict';

    const STORAGE_KEY = 'starEnglish.flashcards.mastered.v1';
    const DAILY_STORAGE_KEY = 'starEnglish.flashcards.daily.v1';
    const SETTINGS_KEY = 'vocabulary_settings';
    const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const DAILY_TARGETS = [5, 10, 15, 20];

    const initialProgress = wordData.getSchoolProgress();

    const state = {
        grade: initialProgress.grade,
        unit: initialProgress.unit,
        mode: 'daily',
        autoFill: false,
        words: [],
        index: 0,
        flipped: false,
        shuffle: false,
        hideMastered: false,
        autoSpeak: true,
        mastered: loadMastered(),
        daily: loadDaily(),
        speakToken: 0,
        hintTimer: null,
        blastStarted: false,
        searchActive: false,
        searchQuery: '',
        searchResults: [],
        searchVisible: [],
        modeBeforeSearch: 'daily'
    };

    const $ = id => document.getElementById(id);
    const SEARCH_RESULT_LIMIT = 80;
    let allWordsCache = null;
    let searchTimer = null;

    /* ---------- 音节划分（从后往前、一元一辅，用于正面拼读展示） ---------- */
    const SYLLABLE_VOWELS = 'aeiou';
    // 二合字母：整体归到一个音节（mo-ther / teach-er）
    const SYLLABLE_DIGRAPHS = new Set(['th', 'sh', 'ch', 'ph', 'wh', 'qu']);
    // 可作音节开头的辅音组合，用于拆分三连及以上辅音（mon-ster / in-struct）
    const SYLLABLE_ONSETS_2 = new Set([
        'bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr',
        'sc', 'sk', 'sl', 'sm', 'sn', 'sp', 'st', 'sw', 'tr', 'tw',
        'th', 'sh', 'ch', 'ph', 'wh', 'qu'
    ]);
    const SYLLABLE_ONSETS_3 = new Set(['scr', 'spr', 'str', 'spl', 'shr', 'squ', 'thr', 'chr', 'phr']);

    // 常见词尾后缀：单独成音节（hope-less / move-ment）
    const SYLLABLE_SUFFIXES = [
        'ation', 'ition', 'cious', 'tious', 'sion', 'tion', 'ture', 'sure',
        'ment', 'ness', 'less', 'able', 'ible', 'ous', 'ful', 'ly'
    ];
    // 常见复合词词尾：先拆词根（home-work / note-book）
    const SYLLABLE_COMPOUND_TAILS = [
        'ground', 'berry', 'melon', 'paper', 'board', 'light', 'night',
        'house', 'thing', 'work', 'book', 'room', 'side', 'time', 'land',
        'mate', 'shop', 'cake', 'card', 'ball', 'body', 'noon', 'day',
        'bag', 'box', 'one'
    ];

    function isSyllableVowel(word, index) {
        const ch = word[index];
        if (!ch) return false;
        if (ch === 'u' && word[index - 1] === 'q') return false; // qu 中的 u 作辅音
        if (SYLLABLE_VOWELS.includes(ch)) return true;
        const prev = word[index - 1] || '';
        if (ch === 'w') return Boolean(prev) && SYLLABLE_VOWELS.includes(prev); // ow / aw 双元音
        if (ch === 'y') return Boolean(prev); // play / happy 的 y 作元音，词首作辅音
        return false;
    }

    function collectVowelGroups(word) {
        const groups = [];
        let i = 0;
        while (i < word.length) {
            if (/[a-z]/.test(word[i]) && isSyllableVowel(word, i)) {
                let j = i;
                while (j + 1 < word.length && /[a-z]/.test(word[j + 1]) && isSyllableVowel(word, j + 1)) {
                    if (word[j] === 'w' || word[j] === 'y') break; // flow-er / play-er / snow-y
                    j += 1;
                }
                groups.push([i, j]);
                i = j + 1;
            } else {
                i += 1;
            }
        }
        return groups;
    }

    // 每个音节取多少个辅音作“声母”：从后往前看两个元音之间的辅音簇
    function pickOnsetLength(between, prevGroup) {
        const count = between.length;
        if (!count) return 0;
        if (count === 1) return 1; // wa-ter / ex-it
        if (count === 2) {
            if (between === 'ck') return 0; // pock-et
            if (SYLLABLE_DIGRAPHS.has(between)) {
                // 前一个音节是字母组合元音时整体归前（teach-er），否则作后一音节声母（mo-ther）
                const width = prevGroup[1] - prevGroup[0] + 1;
                return width >= 2 ? 0 : 2;
            }
            return 1; // bas-ket / win-ter
        }
        // 三连及以上辅音：尽量让能作声母的组合进入后一个音节（mon-ster / in-struct）
        for (let len = Math.min(3, count - 1); len >= 1; len -= 1) {
            const candidate = between.slice(-len);
            if (len === 1
                || (len === 2 && SYLLABLE_ONSETS_2.has(candidate))
                || (len === 3 && SYLLABLE_ONSETS_3.has(candidate))) {
                return len;
            }
        }
        return 1;
    }

    // 从后往前、一元一辅切分：先定最后一个音节，再逐个向左补“声母”，
    // 例如 computer → com-pu-ter、banana → ba-na-na、music → mu-sic
    function splitByVowelGroups(word) {
        if (word.length <= 3) return [word];
        const groups = collectVowelGroups(word);
        if (groups.length <= 1) return [word];

        const starts = new Array(groups.length);
        starts[0] = 0;
        for (let i = groups.length - 1; i >= 1; i -= 1) {
            const prevEnd = groups[i - 1][1];
            const nucleusStart = groups[i][0];
            const between = word.slice(prevEnd + 1, nucleusStart);
            starts[i] = nucleusStart - pickOnsetLength(between, groups[i - 1]);
        }

        const parts = [];
        for (let i = 0; i < starts.length; i += 1) {
            const end = i + 1 < starts.length ? starts[i + 1] : word.length;
            parts.push(word.slice(starts[i], end));
        }
        return parts.filter(Boolean);
    }

    function appendToLastPart(parts, tail) {
        if (!tail) return parts;
        const last = parts.pop();
        return parts.concat(last + tail);
    }

    function splitEnglishWord(lower) {
        if (lower.length <= 3) return [lower];

        // 复合词先拆词根（home-work / class-mate）
        for (const tailWord of SYLLABLE_COMPOUND_TAILS) {
            const stemLength = lower.length - tailWord.length;
            if (stemLength >= 3 && lower.endsWith(tailWord)) {
                return splitEnglishWord(lower.slice(0, stemLength)).concat(splitEnglishWord(tailWord));
            }
        }

        // 后缀自成音节（hope-less / bea-ti-ful / sta-tion）
        for (const suffix of SYLLABLE_SUFFIXES) {
            const stemLength = lower.length - suffix.length;
            if (stemLength >= 3 && lower.endsWith(suffix)) {
                return splitEnglishWord(lower.slice(0, stemLength)).concat(splitEnglishWord(suffix));
            }
        }

        // 词尾 -le：辅音 + le 自成音节（ta-ble / lit-tle）
        if (/([bcdfgklmnprstvz])le$/.test(lower) && lower.length >= 5) {
            return splitByVowelGroups(lower.slice(0, lower.length - 3)).concat(lower.slice(-3));
        }

        let core = lower;
        let tail = '';
        if (/[^td]ed$/.test(lower) && lower.length >= 5 && !/[^aeiou]r$/.test(lower.slice(0, -2))) {
            // played / opened：ed 不单独成音节
            core = lower.slice(0, -2);
            tail = lower.slice(-2);
        } else if (/([^aeiou])es$/.test(lower) && lower.length >= 5) {
            // likes / makes：es 并入前一音节；watches / boxes：es 自成音节
            core = lower.slice(0, -2);
            if (/(?:s|x|z|ch|sh|c|g)$/.test(core)) {
                return splitEnglishWord(core).concat(lower.slice(-2));
            }
            tail = lower.slice(-2);
        } else if (/([^aeiou])e$/.test(lower) && lower.length >= 4) {
            // 词尾不发音的 e（make / compute）
            core = lower.slice(0, -1);
            tail = lower.slice(-1);
        }

        return appendToLastPart(splitByVowelGroups(core), tail);
    }

    // 返回带音节分隔符的文本，如 com/pu/ter；短语按空格/连字符分段
    function syllableText(word) {
        return String(word || '')
            .split(/([^A-Za-z']+)/)
            .map(token => {
                if (!/^[A-Za-z']+$/.test(token)) return token;
                const parts = splitEnglishWord(token.toLowerCase());
                let offset = 0;
                return parts.map(part => {
                    const segment = token.slice(offset, offset + part.length);
                    offset += part.length;
                    return segment;
                }).join('/');
            })
            .join('');
    }

    function loadMastered() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {};
        } catch (error) {
            console.warn('读取闪卡掌握记录失败:', error);
            return {};
        }
    }

    function saveMastered() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state.mastered));
        } catch (error) {
            console.warn('保存闪卡掌握记录失败:', error);
        }
    }

    function todayStr(date = new Date()) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function yesterdayStr() {
        const date = new Date();
        date.setDate(date.getDate() - 1);
        return todayStr(date);
    }

    function normalizeTarget(value) {
        const number = Number(value);
        if (!Number.isFinite(number)) return DAILY_TARGETS[0];
        return DAILY_TARGETS.find(target => target >= number) || DAILY_TARGETS[DAILY_TARGETS.length - 1];
    }

    function getConfiguredTarget() {
        try {
            const raw = localStorage.getItem(SETTINGS_KEY);
            const value = raw ? parseInt(JSON.parse(raw).dailyWordCount, 10) : DAILY_TARGETS[0];
            if (!Number.isNaN(value)) return normalizeTarget(value);
        } catch (error) {
            console.warn('读取每日目标失败:', error);
        }
        return DAILY_TARGETS[0];
    }

    function saveConfiguredTarget(target) {
        try {
            const raw = localStorage.getItem(SETTINGS_KEY);
            const settings = raw ? JSON.parse(raw) : {};
            settings.dailyWordCount = target;
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch (error) {
            console.warn('保存每日目标失败:', error);
        }
    }

    function saveDailyRecord(record) {
        try {
            localStorage.setItem(DAILY_STORAGE_KEY, JSON.stringify(record));
        } catch (error) {
            console.warn('保存每日闪卡进度失败:', error);
        }
    }

    function loadDaily() {
        const fallback = {
            date: todayStr(),
            target: getConfiguredTarget(),
            studiedKeys: [],
            completed: false,
            streak: 0
        };

        let record;
        try {
            record = JSON.parse(localStorage.getItem(DAILY_STORAGE_KEY) || 'null');
        } catch (error) {
            console.warn('读取每日闪卡进度失败:', error);
        }
        if (!record || typeof record !== 'object') return fallback;

        if (record.date !== todayStr()) {
            const streak = record.date === yesterdayStr() ? (record.streak || 0) + 1 : 0;
            const fresh = {
                date: todayStr(),
                target: getConfiguredTarget(),
                studiedKeys: [],
                completed: false,
                streak
            };
            saveDailyRecord(fresh);
            return fresh;
        }

        record.studiedKeys = Array.isArray(record.studiedKeys) ? record.studiedKeys : [];
        record.target = normalizeTarget(record.target || getConfiguredTarget());
        return record;
    }

    function saveDaily() {
        state.daily.date = todayStr();
        saveDailyRecord(state.daily);
        saveConfiguredTarget(state.daily.target);
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[char]);
    }

    function highlightWord(text, word) {
        const safeText = escapeHtml(text);
        if (!word) return safeText;

        const base = escapeHtml(word).toLowerCase();
        const patterns = new Set([base]);
        const suffixes = ['s', 'es', 'ed', 'd', 'ing', 'er', 'est', 'ly', 'tion', 'sion', 'ment', 'ness', 'ful', 'less', 'ous', 'ive', 'able', 'ible', 'al', 'y'];
        suffixes.forEach(suffix => patterns.add(base + suffix));
        if (base.endsWith('y')) {
            patterns.add(base.slice(0, -1) + 'ies');
            patterns.add(base.slice(0, -1) + 'ied');
        }
        if (base.endsWith('e')) {
            patterns.add(base.slice(0, -1) + 'ing');
        }
        if (base.length >= 3 && /[aeiou][^aeiou]$/.test(base)) {
            const last = base[base.length - 1];
            patterns.add(base + last + 'ed');
            patterns.add(base + last + 'ing');
        }

        const alternation = [...patterns]
            .map(pattern => pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
            .sort((a, b) => b.length - a.length)
            .join('|');
        if (!alternation) return safeText;

        const regex = new RegExp(`(?<![\\w-])(?:${alternation})(?![\\w-])`, 'gi');
        return safeText.replace(regex, match => `<mark class="wf-word-highlight">${match}</mark>`);
    }

    /* ---------- 全词库搜索 ---------- */
    function getAllWords() {
        if (allWordsCache) return allWordsCache;
        const result = [];
        GRADES.forEach(grade => {
            (wordData.getWordsByGrade(grade) || []).forEach(word => {
                result.push(Object.assign({}, word, { _grade: grade }));
            });
        });
        allWordsCache = result;
        return result;
    }

    function highlightQuery(text, query) {
        const safe = escapeHtml(text == null ? '' : text);
        if (!query) return safe;
        const pattern = escapeHtml(query).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return safe.replace(new RegExp(pattern, 'gi'), match => `<mark class="wf-search-mark">${match}</mark>`);
    }

    function scoreWord(word, query, lowerQuery) {
        const name = String(word.word || '').toLowerCase();
        if (name === lowerQuery) return 100;
        if (name.startsWith(lowerQuery)) return 80;
        if (name.includes(lowerQuery)) return 60;
        if (String(word.meaning || '').includes(query)) return 50;
        if (String(word.category || '').includes(query)) return 40;
        if (String(word.phonetic || '').toLowerCase().includes(lowerQuery)) return 30;
        if (String(word.example || '').toLowerCase().includes(lowerQuery)) return 20;
        if (String(word.explain || '').toLowerCase().includes(lowerQuery)) return 10;
        return 0;
    }

    function runSearch(query) {
        const summary = $('wf-search-summary');
        const resultsBox = $('wf-search-results');
        const emptyBox = $('wf-search-empty');
        const trimmed = (query || '').trim();
        state.searchQuery = trimmed;

        if (!trimmed) {
            state.searchResults = [];
            state.searchVisible = [];
            resultsBox.innerHTML = '';
            resultsBox.classList.add('hidden');
            emptyBox.classList.add('hidden');
            summary.textContent = '输入关键词，可在 1-9 年级全部单词中搜索';
            return;
        }

        const lowerQuery = trimmed.toLowerCase();
        const matches = [];
        getAllWords().forEach(word => {
            const score = scoreWord(word, trimmed, lowerQuery);
            if (score > 0) matches.push({ word, score });
        });
        matches.sort((a, b) => b.score - a.score
            || a.word._grade - b.word._grade
            || (a.word.unit || 0) - (b.word.unit || 0)
            || String(a.word.word).localeCompare(String(b.word.word)));

        state.searchResults = matches.map(item => item.word);
        state.searchVisible = state.searchResults.slice(0, SEARCH_RESULT_LIMIT);

        if (!state.searchResults.length) {
            resultsBox.innerHTML = '';
            resultsBox.classList.add('hidden');
            emptyBox.textContent = `没有找到与「${trimmed}」匹配的单词，试试其他关键词。`;
            emptyBox.classList.remove('hidden');
            summary.textContent = '未找到匹配单词';
            return;
        }

        emptyBox.classList.add('hidden');
        summary.textContent = `找到 ${state.searchResults.length} 个匹配单词（搜索范围：1-9 年级全部单词），点击结果即可翻卡复习`;
        resultsBox.innerHTML = state.searchVisible.map((word, index) => `
            <button type="button" class="wf-search-item" data-search-index="${index}">
                <span class="wf-search-item-word">
                    <strong>${highlightQuery(word.word, trimmed)}</strong>
                    <span class="wf-search-item-phonetic">${escapeHtml(word.phonetic || '')}</span>
                </span>
                <span class="wf-search-item-meaning">${highlightQuery(word.meaning || '暂无释义', trimmed)}</span>
                <span class="wf-search-item-meta">${word._grade} 年级 · ${unitLabel(word.unit)}</span>
            </button>
        `).join('') + (state.searchResults.length > state.searchVisible.length
            ? `<div class="wf-search-more">仅显示前 ${SEARCH_RESULT_LIMIT} 条，点击任一结果可依次复习全部 ${state.searchResults.length} 个匹配单词</div>`
            : '');
        resultsBox.classList.remove('hidden');
    }

    function startSearchStudy(index) {
        const word = state.searchVisible[index];
        if (!word || !state.searchResults.length) return;
        stopSpeaking();
        if (!state.searchActive) state.modeBeforeSearch = state.mode;
        state.searchActive = true;
        state.mode = 'free';
        state.words = state.searchResults.slice();
        state.index = Math.max(0, state.words.indexOf(word));
        state.blastStarted = false;
        $('wf-setup').classList.add('hidden');
        $('wf-study').classList.remove('hidden');
        renderMode();
        renderCard();
    }

    function wordKey(word) {
        return word.id || `${word.word}-${word.unit || ''}`;
    }

    function isMastered(word) {
        return !!state.mastered[wordKey(word)];
    }

    function isStudiedToday(word) {
        return state.daily.studiedKeys.includes(wordKey(word));
    }

    function markStudied(word) {
        if (state.mode !== 'daily' || !word) return;
        const key = wordKey(word);
        if (state.daily.studiedKeys.includes(key)) {
            updateDailyUI();
            return;
        }
        state.daily.studiedKeys.push(key);
        if (!state.daily.streak) state.daily.streak = 1;
        state.daily.completed = state.daily.studiedKeys.length >= state.daily.target;
        saveDaily();
        updateDailyUI();
    }

    function updateDailyUI() {
        const studied = state.daily.studiedKeys.length;
        const target = state.daily.target;
        const streak = state.daily.streak || 0;

        const dailyCount = $('wf-daily-count');
        if (dailyCount) {
            dailyCount.classList.toggle('hidden', state.mode !== 'daily');
            dailyCount.textContent = `今日 ${studied} / ${target} · 连续 ${streak} 天`;
        }

        const dailyFill = $('wf-daily-fill');
        if (dailyFill) {
            dailyFill.style.width = `${target ? Math.min((studied / target) * 100, 100) : 0}%`;
        }

        const dailyStatus = $('wf-daily-status');
        if (dailyStatus) {
            dailyStatus.textContent = `已学 ${studied}/${target} · 连续 ${streak} 天${state.daily.completed ? ' · 已完成' : ''}`;
        }

        const dailyTitle = $('wf-daily-title');
        if (dailyTitle) dailyTitle.textContent = `今日目标 ${target} 词`;
    }

    function renderMode() {
        document.querySelectorAll('#wf-mode-grid [data-mode]').forEach(button => {
            button.classList.toggle('active', button.dataset.mode === state.mode);
        });
        document.querySelectorAll('#wf-target-grid [data-target]').forEach(button => {
            button.classList.toggle('active', parseInt(button.dataset.target, 10) === state.daily.target);
        });
        $('wf-daily-panel').classList.toggle('hidden', state.mode !== 'daily');
        const startLabels = {
            daily: '开始今日闪卡 →',
            free: '开始自由背诵 →',
            blast: '开始单词填空 →'
        };
        $('wf-start').textContent = startLabels[state.mode] || '开始';
        const autoFill = $('wf-auto-fill');
        if (autoFill) autoFill.checked = state.autoFill;
        updateDailyUI();
    }

    function addUniqueWords(source, targetList, seen) {
        source.forEach(word => {
            const key = wordKey(word);
            if (targetList.length >= state.daily.target || seen.has(key)) return;
            seen.add(key);
            targetList.push(word);
        });
    }

    function buildDailyWords() {
        const seen = new Set();
        const selected = [];
        const pools = [wordData.getWordsByGrade(state.grade, state.unit)];

        // 自动补充只在“具体年级 + 具体单元”时扩展到本年级其他单元，绝不跨年级；
        // 未开启时严格使用用户选择的年级/单元范围。
        if (state.autoFill && state.grade !== 'all' && state.unit !== 'all') {
            pools.push(wordData.getWordsByGrade(state.grade, 'all'));
        }

        pools.forEach(pool => addUniqueWords(pool.filter(word => isStudiedToday(word)), selected, seen));
        pools.forEach(pool => addUniqueWords(pool.filter(word => !isMastered(word) && !isStudiedToday(word)), selected, seen));
        pools.forEach(pool => addUniqueWords(pool.filter(word => isMastered(word) && !isStudiedToday(word)), selected, seen));

        return selected;
    }

    function gradeLabel(grade) {
        return grade === 'all' ? '全部年级' : `${grade} 年级`;
    }

    function unitLabel(unit) {
        return unit === 'all' || unit == null ? '全部单元' : `Unit ${unit}`;
    }

    function getUnitsForGrade(grade) {
        if (grade === 'all') {
            const units = new Set();
            GRADES.forEach(g => wordData.getUnitsByGrade(g).forEach(unit => units.add(unit)));
            return [...units].sort((a, b) => a - b);
        }
        return wordData.getUnitsByGrade(grade);
    }

    function renderGrades() {
        const values = [...GRADES, 'all'];
        $('wf-grade-grid').innerHTML = values.map(grade => `
            <button type="button" class="wf-chip ${String(grade) === String(state.grade) ? 'active' : ''}" data-grade="${grade}">
                ${grade === 'all' ? '全部年级' : `Grade ${grade}`}
            </button>
        `).join('');
    }

    function renderUnits() {
        const units = getUnitsForGrade(state.grade);
        const values = ['all', ...units];
        $('wf-unit-grid').innerHTML = values.map(unit => `
            <button type="button" class="wf-chip ${String(unit) === String(state.unit) ? 'active' : ''}" data-unit="${unit}">
                ${unitLabel(unit)}
            </button>
        `).join('');
    }

    function renderCount() {
        const count = wordData.getWordsByGrade(state.grade, state.unit).length;
        let text = `当前范围：${gradeLabel(state.grade)} · ${unitLabel(state.unit)} · 共 ${count} 个单词`;
        if (state.mode === 'daily' && count < state.daily.target) {
            text += `（少于今日目标 ${state.daily.target} 词，可开启自动补充）`;
        }
        $('wf-word-count').textContent = text;
        $('wf-setup-empty').classList.toggle('hidden', count > 0);
    }

    function shuffleArray(list) {
        const result = list.slice();
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    function detailBlock(title, content, full = false) {
        return `
            <div class="wf-detail${full ? ' full' : ''}">
                <h4>${escapeHtml(title)}</h4>
                ${content}
            </div>
        `;
    }

    function renderList(items, word) {
        return `<ul>${items.map(item => `<li>${word ? highlightWord(item, word) : escapeHtml(item)}</li>`).join('')}</ul>`;
    }

    function buildDetails(word) {
        const blocks = [];

        if (word.explain) {
            blocks.push(detailBlock('英文释义', `<p>${highlightWord(word.explain, word.word)}</p>`));
        }
        if (word.example) {
            blocks.push(detailBlock('例句', `<p>${highlightWord(word.example, word.word)}</p>`));
        }
        if (Array.isArray(word.usage) && word.usage.length) {
            blocks.push(detailBlock('常用用法', renderList(word.usage, word.word)));
        }
        if (Array.isArray(word.wordForms) && word.wordForms.length) {
            blocks.push(detailBlock('词形变化', renderList(word.wordForms)));
        }
        if (word.rootAffix) {
            blocks.push(detailBlock('词根词缀', `<p>${escapeHtml(word.rootAffix)}</p>`, true));
        }

        if (!blocks.length) {
            blocks.push(detailBlock('学习提示', '<p>该词暂无更多详情，可结合例句记忆。</p>', true));
        }

        return blocks.join('');
    }

    function stopSpeaking() {
        state.speakToken += 1;
        if (typeof audioManager !== 'undefined' && typeof audioManager.stopSpeaking === 'function') {
            audioManager.stopSpeaking();
        }
    }

    async function speakWord(text) {
        if (!text || typeof audioManager === 'undefined') return;
        const token = ++state.speakToken;
        try {
            await audioManager.speak(text, 'en-US');
        } catch (error) {
            console.warn('闪卡发音失败:', error);
        }
        if (token !== state.speakToken && typeof audioManager.stopSpeaking === 'function') {
            audioManager.stopSpeaking();
        }
    }

    function speakCurrentWord() {
        const word = state.words[state.index];
        if (word) speakWord(word.word);
    }

    function currentWord() {
        return state.words[state.index];
    }

    function updateMasteredButton() {
        const word = currentWord();
        const button = $('wf-mastered');
        if (!word || !button) return;
        const mastered = isMastered(word);
        button.classList.toggle('active', mastered);
        button.textContent = mastered ? '✅ 已掌握（点击取消）' : '⭐ 标记为已掌握';
    }

    function showFlashcardHint(message) {
        const hint = $('wf-hint-message');
        if (!hint) return;
        hint.textContent = message;
        hint.classList.remove('hidden');
        if (state.hintTimer) window.clearTimeout(state.hintTimer);
        state.hintTimer = window.setTimeout(() => hint.classList.add('hidden'), 2400);
    }

    function isInWrongBook(word) {
        if (!word || typeof wrongBook === 'undefined') return false;
        const list = wrongBook.getAll();
        return Array.isArray(list) && list.some(item => item.word === word.word);
    }

    function updateWrongBookButton() {
        const button = $('wf-add-wrong');
        const word = currentWord();
        if (!button || !word) return;
        const added = isInWrongBook(word);
        button.classList.toggle('active', added);
        button.textContent = added ? '✓ 已在错题库' : '📌 加入错题库';
        button.disabled = added;
    }

    async function addCurrentToWrongBook() {
        const word = currentWord();
        if (!word) return;
        if (typeof wrongBook === 'undefined') {
            showFlashcardHint('错题库暂不可用，请刷新页面重试');
            return;
        }
        if (isInWrongBook(word)) {
            showFlashcardHint(`「${word.word}」已在错题库中`);
            return;
        }

        const button = $('wf-add-wrong');
        if (button) {
            button.disabled = true;
            button.textContent = '加入中…';
        }
        try {
            await wrongBook.addWrongWord({
                word: word.word,
                meaning: word.meaning || '',
                phonetic: word.phonetic || '',
                example: word.example || '',
                rootAffix: word.rootAffix || '',
                grade: word._grade ? String(word._grade) : (state.grade === 'all' ? '' : String(state.grade)),
                from: 'flashcards',
                errorType: 'all'
            });
            showFlashcardHint(`「${word.word}」已加入错题库`);
        } catch (error) {
            console.error('加入错题库失败:', error);
            showFlashcardHint('加入失败，请重试');
        }
        updateWrongBookButton();
    }

    function updateMasteredCount() {
        const mastered = state.words.filter(isMastered).length;
        $('wf-mastered-count').textContent = `已掌握 ${mastered} / ${state.words.length}`;
    }

    function updateNavButtons() {
        $('wf-prev').disabled = state.index <= 0;
        $('wf-next').textContent = state.index >= state.words.length - 1 ? '完成本轮 ✓' : '下一个 →';
    }

    function updateProgress() {
        const total = state.words.length;
        const current = total ? state.index + 1 : 0;
        $('wf-progress-text').textContent = `${current} / ${total}`;
        $('wf-progress-fill').style.width = `${total ? (current / total) * 100 : 0}%`;
        $('wf-progress-label').textContent = state.searchActive
            ? `搜索「${state.searchQuery}」· 共 ${state.words.length} 词`
            : `${gradeLabel(state.grade)} · ${unitLabel(state.unit)}`;
        updateMasteredCount();
        updateDailyUI();
    }

    function renderCard() {
        if (state.index >= state.words.length) {
            showSummary();
            return;
        }

        stopSpeaking();
        const word = currentWord();
        state.flipped = false;
        $('wf-card').classList.remove('flipped');
        $('wf-flip').textContent = '翻转卡片';
        $('wf-summary').classList.add('hidden');
        $('wf-card-wrap').classList.remove('hidden');
        $('wf-controls').classList.remove('hidden');

        const wordGrade = word._grade ? `${word._grade} 年级` : gradeLabel(state.grade);
        $('wf-front-meta').textContent = `${wordGrade} · ${unitLabel(word.unit)} · ${word.category || '词汇'}`;
        $('wf-word').textContent = word.word || '';
        $('wf-phonetic').textContent = word.phonetic || '';
        $('wf-syllables').textContent = syllableText(word.word);
        $('wf-syllable-row').classList.toggle('hidden', !$('wf-syllables').textContent);
        $('wf-meaning').textContent = word.meaning || '暂无释义';
        $('wf-details').innerHTML = buildDetails(word);

        updateProgress();
        updateMasteredButton();
        updateWrongBookButton();
        updateNavButtons();

        if (state.autoSpeak) {
            window.setTimeout(speakCurrentWord, 180);
        }
    }

    function flipCard() {
        if (!$('wf-summary').classList.contains('hidden')) return;
        const wasFlipped = state.flipped;
        state.flipped = !state.flipped;
        if (state.flipped && !wasFlipped) {
            markStudied(currentWord());
        }
        $('wf-card').classList.toggle('flipped', state.flipped);
        $('wf-flip').textContent = state.flipped ? '翻回正面' : '翻转卡片';
    }

    function goPrev() {
        if (state.index > 0) {
            state.index -= 1;
            renderCard();
        }
    }

    function goNext() {
        if (state.index < state.words.length - 1) {
            state.index += 1;
            renderCard();
        } else {
            showSummary();
        }
    }

    function startDirectBlast() {
        stopSpeaking();
        const words = wordData.getWordsByGrade(state.grade, state.unit);
        if (!words.length) {
            $('wf-setup-empty').textContent = '当前范围暂无单词，请切换年级或单元。';
            $('wf-setup-empty').classList.remove('hidden');
            return;
        }

        const container = $('game-canvas-container');
        if (!container || typeof wordBlastGame === 'undefined') return;

        $('wf-setup').classList.add('hidden');
        $('wf-study').classList.add('hidden');
        container.classList.remove('hidden');
        wordBlastGame.onExit = () => {
            container.classList.add('hidden');
            container.innerHTML = '';
            $('wf-setup').classList.remove('hidden');
            renderCount();
        };
        wordBlastGame.startWithWords(words, { grade: state.grade, unit: state.unit });
    }

    function startBlastPhase() {
        state.blastStarted = true;
        $('wf-card-wrap').classList.add('hidden');
        $('wf-controls').classList.add('hidden');
        $('wf-summary').classList.add('hidden');
        $('wf-study').classList.add('hidden');

        const container = $('game-canvas-container');
        if (!container || typeof wordBlastGame === 'undefined') {
            showSummary();
            return;
        }

        container.classList.remove('hidden');
        wordBlastGame.onExit = () => {
            container.classList.add('hidden');
            container.innerHTML = '';
            $('wf-study').classList.remove('hidden');
            showSummary();
        };
        wordBlastGame.startWithWords(state.words, { grade: state.grade, unit: state.unit });
    }

    function showSummary() {
        stopSpeaking();
        if (state.words.length && !state.blastStarted && !state.searchActive) {
            startBlastPhase();
            return;
        }
        state.blastStarted = false;
        $('wf-card-wrap').classList.add('hidden');
        $('wf-controls').classList.add('hidden');
        $('wf-summary').classList.remove('hidden');

        const mastered = state.words.filter(isMastered).length;
        let summaryText = `本轮共 ${state.words.length} 个单词，已掌握 ${mastered} 个。`;
        if (state.mode === 'daily') {
            const studied = state.daily.studiedKeys.length;
            const target = state.daily.target;
            summaryText = `今日已学 ${studied}/${target} 词，连续 ${state.daily.streak || 0} 天。本轮掌握 ${mastered} 个。`;
        }
        $('wf-summary-text').textContent = summaryText;
        $('wf-summary-dashboard').classList.toggle('hidden', state.mode !== 'daily');
    }

    function startStudy() {
        if (state.mode === 'blast') {
            startDirectBlast();
            return;
        }

        let words;
        if (state.mode === 'daily') {
            words = buildDailyWords();
        } else {
            words = wordData.getWordsByGrade(state.grade, state.unit);
            if (state.hideMastered) {
                words = words.filter(word => !isMastered(word));
            }
        }

        if (!words.length) {
            $('wf-setup-empty').textContent = state.mode === 'daily'
                ? '当前范围暂无可背单词，请切换年级或单元。'
                : '该范围暂无单词，请切换年级或单元。';
            $('wf-setup-empty').classList.remove('hidden');
            return;
        }

        state.words = state.shuffle ? shuffleArray(words) : words.slice();
        state.index = 0;
        state.blastStarted = false;
        $('wf-setup').classList.add('hidden');
        $('wf-study').classList.remove('hidden');
        renderCard();
    }

    function backToSetup() {
        stopSpeaking();
        state.blastStarted = false;
        if (state.searchActive) {
            state.searchActive = false;
            state.mode = state.modeBeforeSearch;
            renderMode();
        }
        $('wf-study').classList.add('hidden');
        $('wf-setup').classList.remove('hidden');
        renderCount();
    }

    function toggleMastered() {
        const word = currentWord();
        if (!word) return;
        const key = wordKey(word);
        if (state.mastered[key]) {
            delete state.mastered[key];
        } else {
            state.mastered[key] = true;
        }
        saveMastered();
        updateMasteredButton();
        updateMasteredCount();
    }

    function clearMastered() {
        if (!window.confirm('确定要清除所有单词闪卡的掌握记录吗？')) return;
        state.mastered = {};
        saveMastered();
        if (!$('wf-study').classList.contains('hidden')) {
            updateMasteredButton();
            updateMasteredCount();
        }
    }

    function bindEvents() {
        $('wf-grade-grid').addEventListener('click', event => {
            const button = event.target.closest('[data-grade]');
            if (!button) return;
            state.grade = button.dataset.grade === 'all' ? 'all' : parseInt(button.dataset.grade, 10);
            state.unit = 'all';
            renderGrades();
            renderUnits();
            renderCount();
        });

        $('wf-unit-grid').addEventListener('click', event => {
            const button = event.target.closest('[data-unit]');
            if (!button) return;
            state.unit = button.dataset.unit === 'all' ? 'all' : parseInt(button.dataset.unit, 10);
            renderUnits();
            renderCount();
        });

        $('wf-mode-grid').addEventListener('click', event => {
            const button = event.target.closest('[data-mode]');
            if (!button) return;
            state.mode = button.dataset.mode;
            renderMode();
            renderCount();
        });

        $('wf-target-grid').addEventListener('click', event => {
            const button = event.target.closest('[data-target]');
            if (!button) return;
            state.daily.target = parseInt(button.dataset.target, 10);
            state.daily.completed = state.daily.studiedKeys.length >= state.daily.target;
            saveDaily();
            renderMode();
            renderCount();
        });

        $('wf-auto-fill').addEventListener('change', event => {
            state.autoFill = event.target.checked;
            renderCount();
        });

        $('wf-shuffle').addEventListener('change', event => {
            state.shuffle = event.target.checked;
        });
        $('wf-hide-mastered').addEventListener('change', event => {
            state.hideMastered = event.target.checked;
        });
        $('wf-auto-speak').addEventListener('change', event => {
            state.autoSpeak = event.target.checked;
            if (!state.autoSpeak) stopSpeaking();
        });

        $('wf-start').addEventListener('click', startStudy);
        $('wf-back-setup').addEventListener('click', backToSetup);
        $('wf-summary-back').addEventListener('click', backToSetup);
        $('wf-summary-dashboard').addEventListener('click', () => {
            window.location.href = 'index.html';
        });
        $('wf-restart').addEventListener('click', startStudy);
        $('wf-card').addEventListener('click', flipCard);
        $('wf-card').addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                flipCard();
            }
        });
        $('wf-flip').addEventListener('click', flipCard);
        $('wf-prev').addEventListener('click', goPrev);
        $('wf-next').addEventListener('click', goNext);
        $('wf-mastered').addEventListener('click', toggleMastered);
        $('wf-add-wrong').addEventListener('click', addCurrentToWrongBook);
        $('wf-reset-mastered').addEventListener('click', clearMastered);

        const searchInput = $('wf-search-input');
        searchInput.addEventListener('input', () => {
            window.clearTimeout(searchTimer);
            searchTimer = window.setTimeout(() => runSearch(searchInput.value), 120);
        });
        $('wf-search-clear').addEventListener('click', () => {
            searchInput.value = '';
            window.clearTimeout(searchTimer);
            runSearch('');
            searchInput.focus();
        });
        $('wf-search-results').addEventListener('click', event => {
            const button = event.target.closest('[data-search-index]');
            if (button) startSearchStudy(parseInt(button.dataset.searchIndex, 10));
        });
        $('wf-study-search').addEventListener('click', () => {
            backToSetup();
            searchInput.focus();
            searchInput.select();
        });

        $('wf-speak-front').addEventListener('click', event => {
            event.stopPropagation();
            const word = currentWord();
            if (word) speakWord(word.word);
        });
        $('wf-speak-back').addEventListener('click', event => {
            event.stopPropagation();
            const word = currentWord();
            if (word) speakWord(word.word);
        });

        document.addEventListener('keydown', event => {
            const inField = ['INPUT', 'TEXTAREA'].includes(event.target.tagName);
            if (event.key === '/' && !inField && !$('wf-setup').classList.contains('hidden')) {
                event.preventDefault();
                searchInput.focus();
                return;
            }
            if (event.key === 'Escape' && event.target === searchInput) {
                searchInput.value = '';
                window.clearTimeout(searchTimer);
                runSearch('');
                return;
            }
            if ($('wf-study').classList.contains('hidden')) return;
            if (!$('wf-summary').classList.contains('hidden')) return;
            if (inField) return;

            if (event.key === 'ArrowRight') {
                event.preventDefault();
                goNext();
            } else if (event.key === 'ArrowLeft') {
                event.preventDefault();
                goPrev();
            } else if (event.key === ' ') {
                event.preventDefault();
                flipCard();
            }
        });
    }

    async function init() {
        bindEvents();
        renderMode();

        if (typeof wordData === 'undefined') {
            $('wf-word-count').textContent = '词库加载失败，请刷新页面重试。';
            $('wf-search-summary').textContent = '词库加载失败，暂无法搜索，请刷新页面重试。';
            $('wf-search-input').disabled = true;
            $('wf-start').disabled = true;
            return;
        }

        try {
            if (!wordData.loaded) {
                await wordData.init();
            }
        } catch (error) {
            console.error('闪卡词库初始化失败:', error);
        }
        allWordsCache = null;

        const progress = wordData.getSchoolProgress();
        state.grade = progress.grade;
        state.unit = progress.unit;

        renderGrades();
        renderUnits();
        renderCount();
        if ($('wf-search-input').value.trim()) runSearch($('wf-search-input').value);

        if (typeof wrongBook !== 'undefined') {
            try {
                await wrongBook.init();
            } catch (error) {
                console.warn('闪卡加载错题库失败:', error);
            }
        }
    }

    init();
})();
