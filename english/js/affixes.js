/**
 * 前缀后缀浏览页
 * 纯浏览：前缀 26 + 后缀 25，覆盖上海 1-9 年级常用构词法
 */

const AffixesApp = {
    items: [],
    type: 'all',
    stage: 'all',
    keyword: ''
};

const AF_TYPE_ORDER = ['前缀', '后缀'];

const AF_CATEGORY_ORDER = {
    '前缀': ['否定前缀', '数量前缀', '时间·顺序前缀', '方位前缀', '程度·其他前缀'],
    '后缀': ['名词后缀', '形容词后缀', '动词后缀', '副词后缀']
};

function escapeAffixHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

async function loadAffixesData() {
    const [prefixes, suffixes] = await Promise.all([
        fetch('data/affixes-prefixes.json').then((r) => {
            if (!r.ok) throw new Error('前缀数据加载失败: ' + r.status);
            return r.json();
        }),
        fetch('data/affixes-suffixes.json').then((r) => {
            if (!r.ok) throw new Error('后缀数据加载失败: ' + r.status);
            return r.json();
        })
    ]);

    return prefixes.map((i) => ({ ...i, type: '前缀' }))
        .concat(suffixes.map((i) => ({ ...i, type: '后缀' })));
}

function renderAffixWord(row) {
    return '' +
        '<div class="af-word">' +
            '<span class="af-base">' + escapeAffixHtml(row.base) + '</span>' +
            '<span class="af-arrow">→</span>' +
            '<span class="af-derived">' + escapeAffixHtml(row.word) + '</span>' +
            '<span class="af-mean">' + escapeAffixHtml(row.mean) + '</span>' +
        '</div>';
}

function renderAffixCard(item) {
    const isSuffix = item.type === '后缀';
    const gradeShort = String(item.grade || '').replace(/\s*年级$/, '');
    const note = item.note
        ? '<div class="af-note">⚠ ' + escapeAffixHtml(item.note) + '</div>'
        : '';

    return '' +
        '<article class="af-card ' + (isSuffix ? 'is-suffix' : 'is-prefix') + '">' +
            '<div class="af-card-head">' +
                '<div class="af-affix">' + escapeAffixHtml(item.affix) + '</div>' +
                '<span class="af-badge">' + escapeAffixHtml(item.stage + ' ' + gradeShort) + '</span>' +
            '</div>' +
            '<div class="af-meaning">' + escapeAffixHtml(item.meaning) + '</div>' +
            '<div class="af-words">' + (item.words || []).map(renderAffixWord).join('') + '</div>' +
            note +
        '</article>';
}

function getFilteredAffixes() {
    const keyword = AffixesApp.keyword.trim().toLowerCase();

    return AffixesApp.items.filter((item) => {
        if (AffixesApp.type !== 'all' && item.type !== AffixesApp.type) return false;
        if (AffixesApp.stage !== 'all' && item.stage !== AffixesApp.stage) return false;
        if (!keyword) return true;

        const haystack = [
            item.affix,
            item.meaning,
            item.category,
            item.stage,
            item.grade,
            item.note,
            (item.words || []).map((w) => w.base + ' ' + w.word + ' ' + w.mean).join(' ')
        ].join(' ').toLowerCase();

        return haystack.indexOf(keyword) !== -1;
    });
}

function renderAffixes() {
    const body = document.getElementById('afBody');
    if (!body) return;

    const items = getFilteredAffixes();

    if (!items.length) {
        body.innerHTML = '<div class="af-empty">没有找到匹配的词缀，换个关键词试试</div>';
        return;
    }

    const sections = AF_TYPE_ORDER.map((type) => {
        const typeItems = items.filter((i) => i.type === type);
        if (!typeItems.length) return '';

        const categories = AF_CATEGORY_ORDER[type] || [];
        const groups = categories.map((category) => {
            const groupItems = typeItems.filter((i) => i.category === category);
            if (!groupItems.length) return '';

            return '' +
                '<div class="af-group">' +
                    '<div class="af-group-title">' +
                        escapeAffixHtml(category) +
                        '<span class="af-group-count">' + groupItems.length + '</span>' +
                    '</div>' +
                    '<div class="af-grid">' + groupItems.map(renderAffixCard).join('') + '</div>' +
                '</div>';
        }).join('');

        return '' +
            '<section class="af-section ' + (type === '后缀' ? 'is-suffix' : 'is-prefix') + '">' +
                '<div class="af-section-head">' +
                    '<span class="af-section-title">' + type + '</span>' +
                    '<span class="af-section-count">' + typeItems.length + ' 个</span>' +
                '</div>' +
                groups +
            '</section>';
    }).join('');

    body.innerHTML = sections;
}

function updateAffixCounts() {
    const all = AffixesApp.items;
    const prefixes = all.filter((i) => i.type === '前缀').length;
    const suffixes = all.filter((i) => i.type === '后缀').length;

    const typeMap = { all: all.length, '前缀': prefixes, '后缀': suffixes };
    document.querySelectorAll('#afTypes .filter-btn').forEach((btn) => {
        const label = btn.dataset.type === 'all' ? '全部' : btn.dataset.type;
        btn.textContent = label + ' ' + (typeMap[btn.dataset.type] || 0);
    });

    // 年级数量随「类型」筛选联动，避免数字对不上
    const typeScoped = AffixesApp.type === 'all'
        ? all
        : all.filter((i) => i.type === AffixesApp.type);
    const stageMap = {
        all: typeScoped.length,
        '小学': typeScoped.filter((i) => i.stage === '小学').length,
        '初中': typeScoped.filter((i) => i.stage === '初中').length
    };
    document.querySelectorAll('#afStages .filter-btn').forEach((btn) => {
        const stage = btn.dataset.stage;
        const label = stage === 'all' ? '全部年级' : (stage === '小学' ? '小学 1-5' : '初中 6-9');
        btn.textContent = label + ' ' + (stageMap[stage] || 0);
    });

    const heroSub = document.getElementById('afHeroSub');
    if (heroSub) {
        heroSub.textContent = '前缀 ' + prefixes + ' 个 · 后缀 ' + suffixes + ' 个 · 每个都配 2-4 个例词';
    }

    const headerPrefix = document.getElementById('headerPrefix');
    const headerSuffix = document.getElementById('headerSuffix');
    if (headerPrefix) headerPrefix.textContent = prefixes;
    if (headerSuffix) headerSuffix.textContent = suffixes;
}

function bindAffixEvents() {
    const types = document.getElementById('afTypes');
    if (types) {
        types.addEventListener('click', (e) => {
            const btn = e.target.closest('.filter-btn');
            if (!btn) return;
            AffixesApp.type = btn.dataset.type;
            types.querySelectorAll('.filter-btn').forEach((b) => b.classList.toggle('active', b === btn));
            updateAffixCounts();
            renderAffixes();
        });
    }

    const stages = document.getElementById('afStages');
    if (stages) {
        stages.addEventListener('click', (e) => {
            const btn = e.target.closest('.filter-btn');
            if (!btn) return;
            AffixesApp.stage = btn.dataset.stage;
            stages.querySelectorAll('.filter-btn').forEach((b) => b.classList.toggle('active', b === btn));
            renderAffixes();
        });
    }

    const search = document.getElementById('afSearch');
    if (search) {
        let timer = null;
        search.addEventListener('input', () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                AffixesApp.keyword = search.value;
                renderAffixes();
            }, 120);
        });
    }
}

async function initAffixes() {
    try {
        AffixesApp.items = await loadAffixesData();
    } catch (err) {
        console.error(err);
        const body = document.getElementById('afBody');
        if (body) body.innerHTML = '<div class="af-empty">词缀数据加载失败，请刷新重试</div>';
        return;
    }

    updateAffixCounts();
    bindAffixEvents();
    renderAffixes();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAffixes);
} else {
    initAffixes();
}