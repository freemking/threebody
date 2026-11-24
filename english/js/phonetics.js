/**
 * 单词音标浏览页
 * 纯浏览：元音 20 + 辅音 28，每个音标带中文近似读法、口型提示和例词
 */

const PhoneticsApp = {
    data: [],
    filterType: 'all',
    keyword: ''
};

const PH_TYPE_ORDER = ['元音', '辅音'];
const PH_SUBTYPE_ORDER = {
    '元音': ['单元音', '双元音'],
    '辅音': ['清辅音', '浊辅音']
};

async function loadPhoneticsData() {
    const response = await fetch('data/phonetics.json?v=20261124b');
    if (!response.ok) throw new Error('音标数据加载失败: ' + response.status);
    return response.json();
}

function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

function renderPhoneticCard(item) {
    const isVowel = item.type === '元音';
    const ex = item.example || {};
    const note = item.cnNote ? '<span class="ph-cn-note">' + escapeHtml(item.cnNote) + '</span>' : '';
    const contrast = item.contrast
        ? '<div class="ph-contrast">⚠ ' + escapeHtml(item.contrast) + '</div>'
        : '';

    const exampleSpeak = ex.word
        ? '<button class="ph-speak-word" data-word="' + escapeHtml(ex.word) + '" title="朗读例词" aria-label="朗读例词 ' + escapeHtml(ex.word) + '">🔊</button>'
        : '';

    const spellingsHtml = (item.spellings && item.spellings.length)
        ? '<div class="ph-spellings">' +
            '<div class="ph-spellings-title">常见拼法</div>' +
            item.spellings.map(row => {
                const examples = Array.isArray(row.examples) ? row.examples : [];
                return '<div class="ph-spelling-row">' +
                    '<span class="ph-spelling-pattern">' + escapeHtml(row.pattern) + '</span>' +
                    examples.map(example =>
                        '<span class="ph-spelling-example">' +
                            '<span>' + escapeHtml(example.word) + '</span>' +
                            (example.word
                                ? '<button class="ph-speak-word" data-word="' + escapeHtml(example.word) + '" title="朗读 ' + escapeHtml(example.word) + '" aria-label="朗读 ' + escapeHtml(example.word) + '">🔊</button>'
                                : '') +
                            (example.meaning ? '<span class="ph-spelling-mean">' + escapeHtml(example.meaning) + '</span>' : '') +
                        '</span>'
                    ).join('') +
                '</div>';
            }).join('') +
          '</div>'
        : '';

    return '' +
        '<div class="ph-card' + (isVowel ? '' : ' consonant') + '">' +
            '<div class="ph-card-head">' +
                '<div class="ph-symbol">' + escapeHtml(item.symbol) + '</div>' +
                '<button class="ph-speak" data-audio="' + escapeHtml(item.audio || '') + '" data-cn="' + escapeHtml(item.cn || '') + '" title="发音标（标准发音）" aria-label="发音标 ' + escapeHtml(item.symbol || '') + '">🔊</button>' +
            '</div>' +
            '<div class="ph-cn">' +
                '<span class="ph-cn-main">' + escapeHtml(item.cn) + '</span>' + note +
            '</div>' +
            '<div class="ph-mouth">' + escapeHtml(item.mouth) + '</div>' +
            '<div class="ph-example">' +
                '<span class="ph-example-word">' + escapeHtml(ex.word || '') + '</span>' +
                exampleSpeak +
                '<span class="ph-example-phonetic">' + escapeHtml(ex.phonetic || '') + '</span>' +
                '<span class="ph-example-mean">' + escapeHtml(ex.meaning || '') + '</span>' +
            '</div>' +
            spellingsHtml +
            contrast +
        '</div>';
}

function renderPhonetics() {
    const body = document.getElementById('phBody');
    if (!body) return;

    const keyword = PhoneticsApp.keyword.trim().toLowerCase();

    const items = PhoneticsApp.data.filter((item) => {
        if (PhoneticsApp.filterType !== 'all' && item.type !== PhoneticsApp.filterType) return false;
        if (!keyword) return true;
        const haystack = [
            item.symbol,
            item.symbol.replace(/\//g, ''),
            item.cn,
            item.cnNote,
            item.mouth,
            item.example && item.example.word,
            item.example && item.example.meaning,
            JSON.stringify(item.spellings || [])
        ].join(' ').toLowerCase();
        return haystack.indexOf(keyword) !== -1;
    });

    if (!items.length) {
        body.innerHTML = '<div class="ph-empty">没有找到匹配的音标</div>';
        return;
    }

    const html = PH_TYPE_ORDER.map((type) => {
        const typeItems = items.filter((i) => i.type === type);
        if (!typeItems.length) return '';

        const subGroups = (PH_SUBTYPE_ORDER[type] || []).map((subtype) => {
            const subItems = typeItems.filter((i) => i.subtype === subtype);
            if (!subItems.length) return '';
            return '' +
                '<div class="ph-subgroup">' +
                    '<div class="ph-subgroup-title">' + escapeHtml(subtype) + ' · ' + subItems.length + '</div>' +
                    '<div class="ph-grid">' + subItems.map(renderPhoneticCard).join('') + '</div>' +
                '</div>';
        }).join('');

        return '' +
            '<section class="ph-group' + (type === '辅音' ? ' consonant' : '') + '">' +
                '<div class="ph-group-head">' +
                    '<span class="ph-group-title">' + escapeHtml(type) + '</span>' +
                    '<span class="ph-group-count">' + typeItems.length + ' 个</span>' +
                '</div>' +
                subGroups +
            '</section>';
    }).join('');

    body.innerHTML = html;
}

function speakText(text, lang, rate) {
    if (!text) return;

    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }

    if (window.audioManager && typeof window.audioManager.speak === 'function') {
        window.audioManager.speak(text, { lang: lang, rate: rate }).catch(() => {});
        return;
    }

    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = rate;
        window.speechSynthesis.speak(utterance);
    }
}

function speakPhoneticSound(cn) {
    const text = String(cn || '').replace(/[→➔➜]/g, '，').trim();
    speakText(text, 'zh-CN', 0.75);
}

let currentPhoneticAudio = null;

function playPhoneticAudio(audioFile, cn) {
    if (!audioFile || typeof Audio === 'undefined') {
        speakPhoneticSound(cn);
        return;
    }
    if (currentPhoneticAudio) {
        currentPhoneticAudio.pause();
        currentPhoneticAudio.currentTime = 0;
    }
    try {
        const audio = new Audio('data/phonetics-audio/' + audioFile);
        currentPhoneticAudio = audio;
        // 音频缺失时回退到中文近似音，仅作辅助
        audio.play().catch(() => {
            if (currentPhoneticAudio === audio) speakPhoneticSound(cn);
        });
    } catch (err) {
        speakPhoneticSound(cn);
    }
}

function speakExampleWord(word) {
    speakText(word, 'en-US', 0.8);
}

function updatePhoneticCounts() {
    const vowels = PhoneticsApp.data.filter((i) => i.type === '元音').length;
    const consonants = PhoneticsApp.data.filter((i) => i.type === '辅音').length;
    const all = PhoneticsApp.data.length;

    const tabs = document.querySelectorAll('#phTabs .filter-btn');
    tabs.forEach((btn) => {
        const map = { all: all, '元音': vowels, '辅音': consonants };
        const label = btn.dataset.type === 'all' ? '全部' : btn.dataset.type;
        btn.textContent = label + ' ' + (map[btn.dataset.type] || 0);
    });

    const vowelEl = document.getElementById('headerVowel');
    const consonantEl = document.getElementById('headerConsonant');
    if (vowelEl) vowelEl.textContent = vowels;
    if (consonantEl) consonantEl.textContent = consonants;
}

function bindPhoneticEvents() {
    const tabs = document.getElementById('phTabs');
    if (tabs) {
        tabs.addEventListener('click', (e) => {
            const btn = e.target.closest('.filter-btn');
            if (!btn) return;
            PhoneticsApp.filterType = btn.dataset.type;
            tabs.querySelectorAll('.filter-btn').forEach((b) => b.classList.toggle('active', b === btn));
            renderPhonetics();
        });
    }

    const search = document.getElementById('phSearch');
    if (search) {
        let timer = null;
        search.addEventListener('input', () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                PhoneticsApp.keyword = search.value;
                renderPhonetics();
            }, 120);
        });
    }

    const body = document.getElementById('phBody');
    if (body) {
        body.addEventListener('click', (e) => {
            const phoneticBtn = e.target.closest('.ph-speak');
            if (phoneticBtn) {
                playPhoneticAudio(phoneticBtn.dataset.audio, phoneticBtn.dataset.cn);
                return;
            }
            const wordBtn = e.target.closest('.ph-speak-word');
            if (wordBtn) speakExampleWord(wordBtn.dataset.word);
        });
    }
}

async function initPhonetics() {
    try {
        PhoneticsApp.data = await loadPhoneticsData();
    } catch (err) {
        console.error(err);
        const body = document.getElementById('phBody');
        if (body) body.innerHTML = '<div class="ph-empty">音标数据加载失败，请刷新重试</div>';
        return;
    }

    updatePhoneticCounts();
    bindPhoneticEvents();
    renderPhonetics();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPhonetics);
} else {
    initPhonetics();
}