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
    const response = await fetch('data/phonetics.json');
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

    return '' +
        '<div class="ph-card' + (isVowel ? '' : ' consonant') + '">' +
            '<div class="ph-card-head">' +
                '<div class="ph-symbol">' + escapeHtml(item.symbol) + '</div>' +
                '<button class="ph-speak" data-word="' + escapeHtml(ex.word || '') + '" title="朗读例词" aria-label="朗读 ' + escapeHtml(ex.word || '') + '">🔊</button>' +
            '</div>' +
            '<div class="ph-cn">' +
                '<span class="ph-cn-main">' + escapeHtml(item.cn) + '</span>' + note +
            '</div>' +
            '<div class="ph-mouth">' + escapeHtml(item.mouth) + '</div>' +
            '<div class="ph-example">' +
                '<span class="ph-example-word">' + escapeHtml(ex.word || '') + '</span>' +
                '<span class="ph-example-phonetic">' + escapeHtml(ex.phonetic || '') + '</span>' +
                '<span class="ph-example-mean">' + escapeHtml(ex.meaning || '') + '</span>' +
            '</div>' +
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
            item.example && item.example.meaning
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

function speakPhonetic(word) {
    if (!word) return;

    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }

    if (window.audioManager && typeof window.audioManager.speak === 'function') {
        window.audioManager.speak(word, 'en-US');
        return;
    }

    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-US';
        utterance.rate = 0.8;
        window.speechSynthesis.speak(utterance);
    }
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
            const btn = e.target.closest('.ph-speak');
            if (!btn) return;
            speakPhonetic(btn.dataset.word);
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