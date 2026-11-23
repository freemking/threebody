/**
 * Minecraft 风格像素图标
 * 把页面里的 emoji 图标替换成 8x8 像素画（保持原 emoji 字符以兼容 textContent 逻辑）
 */
(function () {
    'use strict';

    // 每种图标：8 行 x 8 列，字符 -> 颜色
    const ICONS = {
        // 书本
        book: {
            palette: { d: '#2b4a16', g: '#4f8a2b', l: '#6cbf32', w: '#efe6cf', s: '#b9ad92' },
            rows: [
                'dddddddd',
                'dllllggd',
                'dlwwwwgd',
                'dlwsswgd',
                'dlwwwwgd',
                'dlwsswgd',
                'dggggggd',
                'dddddddd'
            ]
        },
        // 卡片
        cards: {
            palette: { c: '#2f6f8f', l: '#5fc8e8', w: '#f0f4f6', r: '#8f2f2f' },
            rows: [
                '........',
                '.cccccc.',
                '.cwwwwc.',
                '.cwwwwc.',
                '.cccrrc.',
                '.cwwwwc.',
                '.cccccc.',
                '........'
            ]
        },
        // 字母方块
        letters: {
            palette: { a: '#b03a3a', b: '#3a6fb0', c: '#c9a227', w: '#ffffff' },
            rows: [
                '........',
                '.aa..bb.',
                '.aw..bw.',
                '.aa..bb.',
                '........',
                '.cc..cc.',
                '.cw..cw.',
                '.cc..cc.'
            ]
        },
        // 房子
        house: {
            palette: { r: '#a83a2a', d: '#7c2a1e', w: '#c9a26b', b: '#6b4a2a', g: '#3a3a3a' },
            rows: [
                '...rr...',
                '..rrrr..',
                '.rrrrrr.',
                'rrrrrrrr',
                '.wwwwww.',
                '.wbbbbw.',
                '.wbbbbw.',
                '.gggggg.'
            ]
        },
        // 骰子
        dice: {
            palette: { w: '#f2f2f2', d: '#b8b8b8', k: '#2b2b2b' },
            rows: [
                '........',
                '.wwwwww.',
                '.wkwwkw.',
                '.wwwwww.',
                '.wwkkww.',
                '.wkwwkw.',
                '.wwwwww.',
                '.dddddd.'
            ]
        },
        // 铅笔
        pencil: {
            palette: { y: '#e8c33a', d: '#b8912a', k: '#3a3a3a', e: '#e8a0a0' },
            rows: [
                '......kk',
                '.....kyk',
                '....kyyk',
                '...kyyk.',
                '..kyyk..',
                '.kyyk...',
                '.kyk....',
                'ekk.....'
            ]
        },
        // 喇叭
        speaker: {
            palette: { g: '#c8c8c8', d: '#8a8a8a', w: '#f0f0f0', n: '#8ae05a' },
            rows: [
                '........',
                '..gg....',
                '.ggg..n.',
                'gggg.n.n',
                'gggg.n.n',
                '.ggg..n.',
                '..gg....',
                '........'
            ]
        },
        // 刷新
        refresh: {
            palette: { g: '#8ae05a', d: '#4f8a2b' },
            rows: [
                '..gggg..',
                '.g....g.',
                'g..gg..g',
                'g.g..g..',
                'g.g..g..',
                'g..gg..g',
                '.g....g.',
                '..gggg..'
            ]
        },
        // 勾选
        check: {
            palette: { g: '#5fa83f', d: '#3d7027', w: '#ffffff' },
            rows: [
                'gggggggg',
                'ggggggwg',
                'gggggwwg',
                'gwggwwgg',
                'gwwwwggg',
                'ggwwgggg',
                'gggggggg',
                'dddddddd'
            ]
        },
        // 叉
        cross: {
            palette: { r: '#b23a3a', d: '#7f2828', w: '#ffffff' },
            rows: [
                'rrrrrrrr',
                'rwwrrwwr',
                'rrwrrwrr',
                'rrrwwrrr',
                'rrrwwrrr',
                'rrwrrwrr',
                'rwwrrwwr',
                'dddddddd'
            ]
        },
        // 图表
        chart: {
            palette: { b: '#2b2b2b', g: '#5fa83f', y: '#d4a12a', c: '#3a9fb0' },
            rows: [
                'bbbbbbb.',
                'b....g.b',
                'b....g.b',
                'b.y..g.b',
                'b.y..g.b',
                'b.yc.g.b',
                'b.yc.g.b',
                'bbbbbbbb'
            ]
        },
        // 清单
        clipboard: {
            palette: { b: '#8a5a2b', w: '#f0ead8', k: '#3a3a3a', g: '#6cbf32' },
            rows: [
                '..kkk...',
                '.bbbbb..',
                '.bwwwb..',
                '.bwggb..',
                '.bwwwb..',
                '.bwggb..',
                '.bwwwb..',
                '.bbbbb..'
            ]
        },
        // 齿轮
        gear: {
            palette: { g: '#b8b8b8', d: '#7a7a7a', k: '#3a3a3a' },
            rows: [
                '..g..g..',
                '.gggggg.',
                'gg.kk.gg',
                'ggkkkkgg',
                'ggkkkkgg',
                'gg.kk.gg',
                '.gggggg.',
                '..g..g..'
            ]
        },
        // 菜单
        menu: {
            palette: { w: '#f0f0f0', d: '#b0b0b0' },
            rows: [
                '........',
                'wwwwwwww',
                'dddddddd',
                '........',
                'wwwwwwww',
                'dddddddd',
                '........',
                '........'
            ]
        },
        // 奖杯
        trophy: {
            palette: { y: '#e8c33a', d: '#b8912a', b: '#8a6b1e' },
            rows: [
                '.yyyyyy.',
                'yyyyyyyy',
                '.yyyyyy.',
                '..yyyy..',
                '...yy...',
                '..yyyy..',
                '.bbbbbb.',
                'bbbbbbbb'
            ]
        },
        // 靶心
        target: {
            palette: { r: '#c0392b', w: '#f2f2f2', k: '#2b2b2b' },
            rows: [
                '..rrrr..',
                '.rwwwwr.',
                'rwwrrwwr',
                'rwrrrrwr',
                'rwrrrrwr',
                'rwwrrwwr',
                '.rwwwwr.',
                '..rrrr..'
            ]
        },
        // 星星
        star: {
            palette: { y: '#f2d24a', d: '#c9a227' },
            rows: [
                '...yy...',
                '...yy...',
                '.yyyyyy.',
                'yyyyyyyy',
                '.yyyyyy.',
                '..yyyy..',
                '.yy..yy.',
                '.y....y.'
            ]
        },
        // 机器人
        robot: {
            palette: { g: '#b8bec4', d: '#7a8086', n: '#8ae05a', k: '#2b2b2b' },
            rows: [
                '...nn...',
                '.gggggg.',
                '.gkkkkg.',
                '.gnnngg.',
                '.gkkkkg.',
                '.gggggg.',
                '.d.dd.d.',
                '........'
            ]
        },
        // 金币
        coin: {
            palette: { y: '#f2c94a', d: '#b8912a', w: '#fff2b8' },
            rows: [
                '..yyyy..',
                '.ywwwwy.',
                'ywyyyywy',
                'ywywwywy',
                'ywywwywy',
                'ywyyyywy',
                '.ywwwwy.',
                '..dddd..'
            ]
        },
        // 骷髅
        skull: {
            palette: { w: '#e8e8e0', d: '#a8a89c', k: '#2b2b2b' },
            rows: [
                '..wwww..',
                '.wwwwww.',
                'wwkwwkww',
                'wwkwwkww',
                'wwwwwwww',
                '.wwkkww.',
                '..w.w.w.',
                '........'
            ]
        },
        // 笑脸
        smile: {
            palette: { y: '#f2c94a', d: '#c9a227', k: '#3a3a3a' },
            rows: [
                '..yyyy..',
                '.yyyyyy.',
                'yykyykyy',
                'yyyyyyyy',
                'yykyykyy',
                'yyykkyyy',
                '.yyyyyy.',
                '..dddd..'
            ]
        },
        // 火焰
        fire: {
            palette: { o: '#e8802a', y: '#f2c94a', r: '#c0392b' },
            rows: [
                '...o....',
                '..oyo...',
                '.ooyoo..',
                '.oyyyo..',
                'ooyyyoo.',
                'ooyyyoo.',
                '.ooyoo..',
                '..ooo...'
            ]
        },
        // 火箭
        rocket: {
            palette: { w: '#e8e8e8', d: '#a8a8a8', r: '#c0392b', y: '#f2c94a' },
            rows: [
                '...ww...',
                '..wwww..',
                '..wwww..',
                '..wwww..',
                '.rwwwwr.',
                '.r.ww.r.',
                '...yy...',
                '..y..y..'
            ]
        },
        // 日历
        calendar: {
            palette: { w: '#f0f0f0', r: '#c0392b', d: '#a8a8a8', k: '#3a3a3a' },
            rows: [
                '.r.r.r..',
                'wwwwwwww',
                'wwwwwwww',
                'wkkkkkkw',
                'wwwwwwww',
                'wkkkwkkw',
                'wwwwwwww',
                'dddddddd'
            ]
        },
        // 灯泡
        bulb: {
            palette: { y: '#f2d24a', w: '#fff6c8', d: '#b8b8b8' },
            rows: [
                '..yyyy..',
                '.ywwwwy.',
                'ywyyyywy',
                'ywyyyywy',
                '.yyyyyy.',
                '..yyyy..',
                '..dddd..',
                '..dddd..'
            ]
        },
        // 锁
        lock: {
            palette: { y: '#e8c33a', d: '#b8912a', k: '#3a3a3a' },
            rows: [
                '..kkkk..',
                '.k....k.',
                '.k....k.',
                'yyyyyyyy',
                'yyykkyyy',
                'yykkkkyy',
                'yyykkyyy',
                'dddddddd'
            ]
        },
        // 警告
        warn: {
            palette: { y: '#e8c33a', k: '#3a3a3a' },
            rows: [
                '...y....',
                '...y....',
                '..yyy...',
                '..yky...',
                '.yykyy..',
                '.yyyyy..',
                'yyyyyyy.',
                'yyyykyy.'
            ]
        },
        // 钻石
        diamond: {
            palette: { c: '#4fd6d6', l: '#a8f2f2', d: '#2f8f8f' },
            rows: [
                '..cccc..',
                '.cllllc.',
                'clllllll',
                'ccllllcc',
                '.cccccc.',
                '..cccc..',
                '...cc...',
                '........'
            ]
        },
        // 垃圾桶
        trash: {
            palette: { g: '#b8b8b8', d: '#7a7a7a', k: '#3a3a3a' },
            rows: [
                '..kkkk..',
                '........',
                '.gggggg.',
                '.g.gg.g.',
                '.g.gg.g.',
                '.g.gg.g.',
                '.gggggg.',
                '..dddd..'
            ]
        },
        // 地球
        globe: {
            palette: { b: '#3a7fb0', g: '#5fa83f', l: '#8ae05a' },
            rows: [
                '..bbbb..',
                '.bgbgbb.',
                'bggbbgbb',
                'bbgbbgbb',
                'bbbgbbbb',
                'bggbbgbb',
                '.bbbbbb.',
                '..bbbb..'
            ]
        },
        // 汽车
        car: {
            palette: { r: '#c0392b', w: '#a8d8e8', k: '#2b2b2b', d: '#8a2820' },
            rows: [
                '........',
                '..rrrr..',
                '.rrrrrr.',
                'rwwwwwwr',
                'rrrrrrrr',
                '.k....k.',
                '........',
                '........'
            ]
        },
        // 学士帽
        cap: {
            palette: { k: '#2b2b2b', y: '#e8c33a', d: '#4a4a4a' },
            rows: [
                '........',
                '...yy...',
                '..kkkk..',
                '.kkkkkk.',
                'kkkkkkkk',
                '..kkkk..',
                '..kkkk..',
                '..dddd..'
            ]
        },
        // 幼苗
        sprout: {
            palette: { g: '#5fa83f', l: '#8ae05a', b: '#8a5a2b', d: '#3d7027' },
            rows: [
                '........',
                '..l..g..',
                '.lgg.dg.',
                '..gggg..',
                '...bb...',
                '...bb...',
                '..dbbd..',
                '...dd...'
            ]
        },
        // 加号
        plus: {
            palette: { g: '#5fa83f', d: '#3d7027', w: '#ffffff' },
            rows: [
                '........',
                '...ww...',
                '...ww...',
                '.wwwwww.',
                '.wwwwww.',
                '...ww...',
                '...ww...',
                '........'
            ]
        },
        // 图钉
        pin: {
            palette: { r: '#c0392b', w: '#f2f2f2', d: '#7f2828' },
            rows: [
                '...rr...',
                '..rwwr..',
                '..rwwr..',
                '..rrrr..',
                '...rr...',
                '...rr...',
                '...rr...',
                '...dd...'
            ]
        },
        // 链接
        link: {
            palette: { g: '#9aa4ab', d: '#6b757c' },
            rows: [
                '........',
                '..gg.g..',
                '.g..gg..',
                '.g..g.g.',
                'g.gg..g.',
                'g..g..g.',
                '.ggg.gg.',
                '........'
            ]
        },
        // 游戏手柄
        gamepad: {
            palette: { g: '#4a4a4a', d: '#2b2b2b', n: '#8ae05a' },
            rows: [
                '........',
                '.gggggg.',
                'gg.nn.gg',
                'gggnnggg',
                '.gggggg.',
                '..d..d..',
                '........',
                '........'
            ]
        },
        // 闪电
        bolt: {
            palette: { y: '#f2d24a', d: '#c9a227' },
            rows: [
                '....yy..',
                '...yy...',
                '..yy....',
                '.yyyyyy.',
                '...yy...',
                '..yy....',
                '.yy.....',
                '........'
            ]
        },
        // 眼睛
        eye: {
            palette: { w: '#f2f2f2', b: '#3a7fb0', k: '#2b2b2b' },
            rows: [
                '........',
                '..wwww..',
                '.wwwwww.',
                'wwbbbbww',
                'wwbkkbww',
                '.wwwwww.',
                '..wwww..',
                '........'
            ]
        }
    };

    // emoji -> 图标
    const MAP = {
        '📚': 'book', '📖': 'book', '📕': 'book', '📗': 'book', '📘': 'book', '📙': 'book',
        '🗂': 'cards', '🗂️': 'cards', '🃏': 'cards', '🃟': 'cards',
        '🔤': 'letters', '🔡': 'letters', '🔠': 'letters', '🅰': 'letters',
        '🏠': 'house', '🏡': 'house', '🏘': 'house',
        '🎲': 'dice', '⚀': 'dice', '⚁': 'dice', '⚂': 'dice', '⚃': 'dice', '⚄': 'dice', '⚅': 'dice',
        '✏': 'pencil', '✏️': 'pencil', '✍': 'pencil', '✍️': 'pencil', '📝': 'pencil',
        '🔊': 'speaker', '🎧': 'speaker', '🎤': 'speaker', '🗣': 'speaker', '👂': 'speaker',
        '🔄': 'refresh', '🔁': 'refresh', '↻': 'refresh',
        '✅': 'check', '✔': 'check', '✓': 'check',
        '❌': 'cross', '✕': 'cross', '✗': 'cross', '❎': 'cross',
        '📊': 'chart', '📈': 'chart', '📉': 'chart',
        '📋': 'clipboard', '🗒': 'clipboard', '📄': 'clipboard',
        '⚙': 'gear', '⚙️': 'gear', '🔧': 'gear',
        '☰': 'menu', '≡': 'menu',
        '🏆': 'trophy', '🥇': 'trophy', '🥈': 'trophy', '🥉': 'trophy', '🎖': 'trophy',
        '🎯': 'target', '🎳': 'target',
        '⭐': 'star', '⭐️': 'star', '★': 'star', '☆': 'star', '✨': 'star', '🌟': 'star',
        '🤖': 'robot',
        '💰': 'coin', '🪙': 'coin', '💵': 'coin', '💎': 'diamond',
        '💀': 'skull', '☠': 'skull',
        '😊': 'smile', '😎': 'smile', '🙂': 'smile', '😢': 'smile', '😞': 'smile', '🥶': 'smile',
        '🔥': 'fire', '💥': 'fire',
        '🚀': 'rocket', '🚗': 'car', '🚙': 'car',
        '📅': 'calendar', '📆': 'calendar', '🗓': 'calendar',
        '💡': 'bulb', '🔔': 'bulb',
        '🔒': 'lock', '🔐': 'lock', '🔑': 'lock',
        '⚠': 'warn', '⚠️': 'warn',
        '🌐': 'globe', '🌍': 'globe', '🌏': 'globe',
        '🎓': 'cap', '🎩': 'cap',
        '🌱': 'sprout', '🌿': 'sprout', '🍀': 'sprout',
        '👁': 'eye', '👀': 'eye', '🗑': 'trash', '🗑️': 'trash',
        '➕': 'plus', '✚': 'plus', '＋': 'plus',
        '📌': 'pin', '📍': 'pin',
        '🎉': 'star', '🎊': 'star', '🌟': 'star',
        '🔗': 'link', '⚭': 'link',
        '🎮': 'gamepad', '🕹': 'gamepad',
        '⚡': 'bolt', '⚡️': 'bolt', '🌩': 'bolt'
    };

    const SVG_NS = 'http://www.w3.org/2000/svg';
    const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION', 'CODE', 'PRE', 'svg']);
    const iconCache = new Map();

    function buildSvg(name) {
        if (iconCache.has(name)) return iconCache.get(name).cloneNode(true);

        const def = ICONS[name];
        const svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('viewBox', '0 0 8 8');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
        svg.setAttribute('shape-rendering', 'crispEdges');

        if (def) {
            const { palette, rows } = def;
            for (let y = 0; y < rows.length; y++) {
                const row = rows[y];
                for (let x = 0; x < row.length; x++) {
                    const ch = row[x];
                    const fill = palette[ch];
                    if (!fill) continue;
                    const rect = document.createElementNS(SVG_NS, 'rect');
                    rect.setAttribute('x', String(x));
                    rect.setAttribute('y', String(y));
                    rect.setAttribute('width', '1');
                    rect.setAttribute('height', '1');
                    rect.setAttribute('fill', fill);
                    svg.appendChild(rect);
                }
            }
        }

        iconCache.set(name, svg.cloneNode(true));
        return svg;
    }

    const EMOJI_RE = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{2190}-\u{21FF}\u{2700}-\u{27BF}]/u;

    function makeIcon(ch, name) {
        const wrap = document.createElement('span');
        wrap.className = 'mc-i mc-i--' + name;
        wrap.appendChild(buildSvg(name));
        const src = document.createElement('span');
        src.className = 'mc-i__src';
        src.textContent = ch;
        wrap.appendChild(src);
        return wrap;
    }

    function processTextNode(node) {
        const text = node.nodeValue;
        if (!text || !EMOJI_RE.test(text)) return;
        const parent = node.parentNode;
        if (!parent || SKIP_TAGS.has(parent.tagName) || parent.closest('.mc-i')) return;

        const frag = document.createDocumentFragment();
        let buffer = '';
        let changed = false;

        for (const ch of text) {
            const name = MAP[ch] || MAP[ch.replace(/\uFE0F/g, '')];
            if (name) {
                if (buffer) {
                    frag.appendChild(document.createTextNode(buffer));
                    buffer = '';
                }
                frag.appendChild(makeIcon(ch, name));
                changed = true;
            } else {
                buffer += ch;
            }
        }

        if (!changed) return;
        if (buffer) frag.appendChild(document.createTextNode(buffer));
        parent.replaceChild(frag, node);
    }

    function walk(root) {
        if (!root || root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
        if (root.nodeType === 1 && (SKIP_TAGS.has(root.tagName) || root.closest('.mc-i'))) return;

        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode(n) {
                const p = n.parentNode;
                if (!p || SKIP_TAGS.has(p.tagName)) return NodeFilter.FILTER_REJECT;
                if (p.closest('.mc-i')) return NodeFilter.FILTER_REJECT;
                return EMOJI_RE.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
            }
        });

        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        nodes.forEach(processTextNode);
    }

    function init() {
        walk(document.body);

        const observer = new MutationObserver((records) => {
            for (const r of records) {
                if (r.type === 'childList') {
                    r.addedNodes.forEach((n) => {
                        if (n.nodeType === 1) walk(n);
                        else if (n.nodeType === 3) processTextNode(n);
                    });
                } else if (r.type === 'characterData') {
                    processTextNode(r.target);
                }
            }
        });
        observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();