/**
 * 常用短语浏览页
 * 纯浏览：小学 30 + 初中 30，覆盖上海 1-9 年级常用短语，每条配 1-2 个例句
 */

const PhrasesApp = {
    items: [],
    stage: 'all',
    keyword: ''
};

const PH_STAGE_ORDER = ['小学', '初中'];

const PH_CATEGORY_ORDER = {
    '小学': ['问候与礼貌', '课堂用语', '时间与日常', '家庭与生活', '购物与出行', '兴趣与活动'],
    '初中': ['表达观点', '提出建议', '学习与校园', '沟通与电话', '生活与做事', '固定搭配', '连接与过渡']
};

function escapePhraseHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

async function loadPhrasesData() {
    const [primary, junior] = await Promise.all([
        fetch('data/phrases-primary.json').then((r) => {
            if (!r.ok) throw new Error('小学短语数据加载失败: ' + r.status);
            return r.json();
        }),
        fetch('data/phrases-junior.json').then((r) => {
            if (!r.ok) throw new Error('初中短语数据加载失败: ' + r.status);
            return r.json();
        })
    ]);

    return primary.concat(junior);
}

function renderPhraseExample(ex) {
    const zh = ex.zh
        ? '<div class="ph-ex-zh">' + escapePhraseHtml(ex.zh) + '</div>'
        : '';

    return '' +
        '<div class="ph-ex">' +
            '<div class="ph-ex-en">' + escapePhraseHtml(ex.en) + '</div>' +
            zh +
        '</div>';
}

function renderPhraseCard(item) {
    const isJunior = item.stage === '初中';
    const gradeShort = String(item.grade || '').replace(/\s*年级$/, '');
    const examples = (item.examples || []).map(renderPhraseExample).join('');
    const note = item.note
        ? '<div class="ph-note"><span class="ph-note-icon">💡</span>' + escapePhraseHtml(item.note) + '</div>'
        : '';

    return '' +
        '<article class="ph-card ' + (isJunior ? 'is-junior' : 'is-primary') + '">' +
            '<div class="ph-card-head">' +
                '<div class="ph-phrase">' + escapePhraseHtml(item.phrase) + '</div>' +
                '<span class="ph-badge">' + escapePhraseHtml(gradeShort + ' 年级') + '</span>' +
            '</div>' +
            '<div class="ph-meaning">' + escapePhraseHtml(item.meaning) + '</div>' +
            '<div class="ph-examples">' +
                '<div class="ph-examples-label">例句</div>' +
                examples +
            '</div>' +
            note +
        '</article>';
}

function getFilteredPhrases() {
    const keyword = PhrasesApp.keyword.trim().toLowerCase();

    return PhrasesApp.items.filter((item) => {
        if (PhrasesApp.stage !== 'all' && item.stage !== PhrasesApp.stage) return false;
        if (!keyword) return true;

        const haystack = [
            item.phrase,
            item.meaning,
            item.category,
            item.stage,
            item.grade,
            item.note,
            (item.examples || []).map((ex) => ex.en + ' ' + ex.zh).join(' ')
        ].join(' ').toLowerCase();

        return haystack.indexOf(keyword) !== -1;
    });
}

function renderPhrases() {
    const body = document.getElementById('phBody');
    if (!body) return;

    const items = getFilteredPhrases();

    if (!items.length) {
        body.innerHTML = '<div class="ph-empty">没有找到匹配的短语，换个关键词试试</div>';
        return;
    }

    const sections = PH_STAGE_ORDER.map((stage) => {
        const stageItems = items.filter((i) => i.stage === stage);
        if (!stageItems.length) return '';

        const categories = PH_CATEGORY_ORDER[stage] || [];
        const groups = categories.map((category) => {
            const groupItems = stageItems.filter((i) => i.category === category);
            if (!groupItems.length) return '';

            return '' +
                '<div class="ph-group">' +
                    '<div class="ph-group-title">' +
                        escapePhraseHtml(category) +
                        '<span class="ph-group-count">' + groupItems.length + '</span>' +
                    '</div>' +
                    '<div class="ph-grid">' + groupItems.map(renderPhraseCard).join('') + '</div>' +
                '</div>';
        }).join('');

        return '' +
            '<section class="ph-section ' + (stage === '初中' ? 'is-junior' : 'is-primary') + '">' +
                '<div class="ph-section-head">' +
                    '<span class="ph-section-title">' + escapePhraseHtml(stage === '初中' ? '初中 6-9 年级' : '小学 1-5 年级') + '</span>' +
                    '<span class="ph-section-count">' + stageItems.length + ' 个短语</span>' +
                '</div>' +
                groups +
            '</section>';
    }).join('');

    body.innerHTML = sections;
}

function updatePhraseCounts() {
    const all = PhrasesApp.items;
    const primary = all.filter((i) => i.stage === '小学').length;
    const junior = all.filter((i) => i.stage === '初中').length;

    const stageMap = { all: all.length, '小学': primary, '初中': junior };
    document.querySelectorAll('#phStages .filter-btn').forEach((btn) => {
        const stage = btn.dataset.stage;
        const label = stage === 'all' ? '全部' : (stage === '小学' ? '小学 1-5' : '初中 6-9');
        btn.textContent = label + ' ' + (stageMap[stage] || 0);
    });

    const heroSub = document.getElementById('phHeroSub');
    if (heroSub) {
        heroSub.textContent = '小学 ' + primary + ' 个 · 初中 ' + junior + ' 个 · 每个短语配 1-2 个例句';
    }

    const headerPrimary = document.getElementById('headerPrimary');
    const headerJunior = document.getElementById('headerJunior');
    if (headerPrimary) headerPrimary.textContent = primary;
    if (headerJunior) headerJunior.textContent = junior;
}

function bindPhraseEvents() {
    const stages = document.getElementById('phStages');
    if (stages) {
        stages.addEventListener('click', (e) => {
            const btn = e.target.closest('.filter-btn');
            if (!btn) return;
            PhrasesApp.stage = btn.dataset.stage;
            stages.querySelectorAll('.filter-btn').forEach((b) => b.classList.toggle('active', b === btn));
            renderPhrases();
        });
    }

    const search = document.getElementById('phSearch');
    if (search) {
        let timer = null;
        search.addEventListener('input', () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                PhrasesApp.keyword = search.value;
                renderPhrases();
            }, 120);
        });
    }
}

async function initPhrases() {
    try {
        PhrasesApp.items = await loadPhrasesData();
    } catch (err) {
        console.error(err);
        const body = document.getElementById('phBody');
        if (body) body.innerHTML = '<div class="ph-empty">短语数据加载失败，请刷新重试</div>';
        return;
    }

    updatePhraseCounts();
    bindPhraseEvents();
    renderPhrases();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPhrases);
} else {
    initPhrases();
}