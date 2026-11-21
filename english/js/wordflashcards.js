/**
 * 单词闪卡模块
 * 按年级和单元筛选单词，以正反面卡片形式背诵
 * 依赖：data.js (wordData), audio.js (audioManager)
 */

(function () {
    'use strict';

    const STORAGE_KEY = 'starEnglish.flashcards.mastered.v1';
    const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    const state = {
        grade: 1,
        unit: 'all',
        words: [],
        index: 0,
        flipped: false,
        shuffle: false,
        hideMastered: false,
        autoSpeak: true,
        mastered: loadMastered(),
        speakToken: 0
    };

    const $ = id => document.getElementById(id);

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

    function escapeHtml(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[char]);
    }

    function wordKey(word) {
        return word.id || `${word.word}-${word.unit || ''}`;
    }

    function isMastered(word) {
        return !!state.mastered[wordKey(word)];
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
        $('wf-word-count').textContent = `当前范围：${gradeLabel(state.grade)} · ${unitLabel(state.unit)} · 共 ${count} 个单词`;
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

    function renderList(items) {
        return `<ul>${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
    }

    function buildDetails(word) {
        const blocks = [];

        if (word.explain) {
            blocks.push(detailBlock('英文释义', `<p>${escapeHtml(word.explain)}</p>`));
        }
        if (word.example) {
            blocks.push(detailBlock('例句', `<p>${escapeHtml(word.example)}</p>`));
        }
        if (Array.isArray(word.usage) && word.usage.length) {
            blocks.push(detailBlock('常用用法', renderList(word.usage)));
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
        $('wf-progress-label').textContent = `${gradeLabel(state.grade)} · ${unitLabel(state.unit)}`;
        updateMasteredCount();
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

        $('wf-front-meta').textContent = `${gradeLabel(state.grade)} · ${unitLabel(word.unit)} · ${word.category || '词汇'}`;
        $('wf-word').textContent = word.word || '';
        $('wf-phonetic').textContent = word.phonetic || '';
        $('wf-meaning').textContent = word.meaning || '暂无释义';
        $('wf-details').innerHTML = buildDetails(word);

        updateProgress();
        updateMasteredButton();
        updateNavButtons();

        if (state.autoSpeak) {
            window.setTimeout(speakCurrentWord, 180);
        }
    }

    function flipCard() {
        if (!$('wf-summary').classList.contains('hidden')) return;
        state.flipped = !state.flipped;
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

    function showSummary() {
        stopSpeaking();
        $('wf-card-wrap').classList.add('hidden');
        $('wf-controls').classList.add('hidden');
        $('wf-summary').classList.remove('hidden');
        const mastered = state.words.filter(isMastered).length;
        $('wf-summary-text').textContent = `本轮共 ${state.words.length} 个单词，已掌握 ${mastered} 个。`;
    }

    function startStudy() {
        let words = wordData.getWordsByGrade(state.grade, state.unit);
        if (state.hideMastered) {
            words = words.filter(word => !isMastered(word));
        }

        if (!words.length) {
            $('wf-setup-empty').classList.remove('hidden');
            return;
        }

        state.words = state.shuffle ? shuffleArray(words) : words.slice();
        state.index = 0;
        $('wf-setup').classList.add('hidden');
        $('wf-study').classList.remove('hidden');
        renderCard();
    }

    function backToSetup() {
        stopSpeaking();
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
        $('wf-reset-mastered').addEventListener('click', clearMastered);

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
            if ($('wf-study').classList.contains('hidden')) return;
            if (!$('wf-summary').classList.contains('hidden')) return;
            if (['INPUT', 'TEXTAREA'].includes(event.target.tagName)) return;

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

        if (typeof wordData === 'undefined') {
            $('wf-word-count').textContent = '词库加载失败，请刷新页面重试。';
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

        renderGrades();
        renderUnits();
        renderCount();
    }

    init();
})();
