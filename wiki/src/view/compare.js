// 俠客對照: up to five heroes side by side. A radar of the seven measures, a table of the same
// numbers, how one measure grows from level 1 to 12, and every art each has at the last level.
//
// The choice lives in the address: #compare?h=guo,huang,xiao (&m=<measure> for the growth
// chart). Each place in that list is a colour slot, so a hero keeps its colour when another is
// removed: removing leaves an empty place (guo,,xiao) that the next hero added fills.
import { esc, href, anchor, image, crumb } from './html.js';
import { compareData } from '../catalog/compare.js';

const MAX = 5;
const DEFAULT = ['guo', 'huang', 'xiao'];
// Five colours for the wiki's paper (#fcf9f0), checked as a set for colour-blind separation
// across every pair, since the radar's shapes all overlap. Gold sits under 3:1 against the paper,
// so every value is also in the table, and each slot has its own marker and line pattern.
const SERIES = ['#2b7bd4', '#d6517f', '#3c740d', '#b8921c', '#64349f'];
const DASH = ['', '7 4', '0.5 4.5', '10 3.5 1 3.5', '3.5 3'];
const SHAPE = ['圓點', '方塊', '三角', '菱形', '倒三角'];
const STAT_NAMES = [
  ['hp', '氣血'],
  ['mp', '內力'],
  ['atk', '攻擊'],
  ['def', '防禦'],
  ['step', '移動', ' 格'],
  ['range', '射程', ' 格']
];

// ── the choice ──────────────────────────────────────────────────────────────
function lookup() {
  const data = compareData();
  if (!data._byId) Object.defineProperty(data, '_byId', { value: new Map(data.heroes.map((h) => [h.id, h])) });
  return data;
}
// URL → up to five slots (hero id or null). Unknown ids and repeats are dropped; a hero past
// the fifth place takes the first empty one.
export function readSlots(p) {
  const { _byId: byId } = lookup();
  if (!p.has('h')) return [...DEFAULT];
  const slots = [],
    late = [],
    seen = new Set();
  p.get('h')
    .split(',')
    .map((s) => s.trim())
    .forEach((id) => {
      if (!id) return slots.length < MAX && slots.push(null);
      if (!byId.has(id) || seen.has(id)) return;
      seen.add(id);
      if (slots.length < MAX) slots.push(id);
      else late.push(id);
    });
  for (const id of late) {
    const gap = slots.indexOf(null);
    if (gap >= 0) slots[gap] = id;
  }
  while (slots.length && slots[slots.length - 1] == null) slots.pop();
  return slots;
}
const measureOf = (p, axes) => (axes.some((a) => a.key === p.get('m')) ? p.get('m') : 'composite');
function addressOf(slots, measure) {
  const list = [...slots];
  while (list.length && list[list.length - 1] == null) list.pop();
  return (
    '#compare?h=' +
    list.map((id) => (id ? encodeURIComponent(id) : '')).join(',') +
    (measure && measure !== 'composite' ? '&m=' + encodeURIComponent(measure) : '')
  );
}
const withHero = (slots, id) => {
  const next = [...slots],
    gap = next.indexOf(null);
  if (gap >= 0) next[gap] = id;
  else next.push(id);
  return next;
};
const withoutHero = (slots, id) => slots.map((s) => (s === id ? null : s));
// The chosen heroes in slot order, each with its slot.
const chosen = (slots) => {
  const { _byId: byId } = lookup();
  return slots.map((id, slot) => id && { hero: byId.get(id), slot }).filter(Boolean);
};

// ── marks ───────────────────────────────────────────────────────────────────
function marker(slot, x, y, r = 4.5) {
  const c = SERIES[slot],
    ring = ' fill="' + c + '" stroke="var(--cmp-surface)" stroke-width="2"',
    f = (n) => n.toFixed(1);
  switch (slot) {
    case 1:
      return '<rect x="' + f(x - r) + '" y="' + f(y - r) + '" width="' + f(2 * r) + '" height="' + f(2 * r) + '"' + ring + '/>';
    case 2: {
      const s = r * 1.25;
      return '<path d="M' + f(x) + ' ' + f(y - s) + 'L' + f(x + s) + ' ' + f(y + s * 0.8) + 'L' + f(x - s) + ' ' + f(y + s * 0.8) + 'Z"' + ring + '/>';
    }
    case 3: {
      const s = r * 1.3;
      return '<path d="M' + f(x) + ' ' + f(y - s) + 'L' + f(x + s) + ' ' + f(y) + 'L' + f(x) + ' ' + f(y + s) + 'L' + f(x - s) + ' ' + f(y) + 'Z"' + ring + '/>';
    }
    case 4: {
      const s = r * 1.25;
      return '<path d="M' + f(x) + ' ' + f(y + s) + 'L' + f(x + s) + ' ' + f(y - s * 0.8) + 'L' + f(x - s) + ' ' + f(y - s * 0.8) + 'Z"' + ring + '/>';
    }
    default:
      return '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(r) + '"' + ring + '/>';
  }
}
// The key beside a name: a short stroke in the hero's pattern with the hero's marker on it.
const key = (slot) =>
  '<svg class="cmp-key" viewBox="0 0 30 14" width="30" height="14" aria-hidden="true"><line x1="2" y1="7" x2="28" y2="7" stroke="' +
  SERIES[slot] +
  '" stroke-width="2" stroke-linecap="round"' +
  (DASH[slot] ? ' stroke-dasharray="' + DASH[slot] + '"' : '') +
  '/>' +
  marker(slot, 15, 7, 4) +
  '</svg>';
const legend = (list) =>
  '<ul class="cmp-legend">' +
  list.map(({ hero, slot }) => '<li>' + key(slot) + esc(hero.name) + '</li>').join('') +
  '</ul>';

// ── radar ───────────────────────────────────────────────────────────────────
function radarSvg(list, axes, width = 420) {
  const w = Math.max(280, Math.min(width, 460)),
    // Room beside the circle for the labels: one line of four characters, or on a narrow
    // screen the side labels fold into two lines of two, so the circle can be larger.
    fold = w < 420,
    pad = fold ? 48 : 74,
    R = w / 2 - pad,
    cx = w / 2,
    cy = R + 34,
    h = cy + R + (fold ? 48 : 34),
    n = axes.length,
    at = (k, r) => {
      const a = -Math.PI / 2 + (2 * Math.PI * k) / n;
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    },
    pts = (fn) =>
      axes
        .map((a, k) => at(k, fn(a)).map((v) => v.toFixed(1)).join(','))
        .join(' ');
  const rings = [25, 50, 75, 100]
    .map((v) => '<polygon class="cmp-ring" points="' + pts(() => (R * v) / 100) + '"/>')
    .join('');
  const spokes = axes
    .map((a, k) => {
      const [x, y] = at(k, R);
      return '<line class="cmp-ring" x1="' + cx + '" y1="' + cy.toFixed(1) + '" x2="' + x.toFixed(1) + '" y2="' + y.toFixed(1) + '"/>';
    })
    .join('');
  const ringText = [25, 50, 75, 100]
    .map((v) => '<text class="cmp-tick" x="' + (cx + 4) + '" y="' + (cy - (R * v) / 100 + 11).toFixed(1) + '">' + v + '</text>')
    .join('');
  const labels = axes
    .map((a, k) => {
      const ang = -Math.PI / 2 + (2 * Math.PI * k) / n,
        cos = Math.cos(ang),
        sin = Math.sin(ang),
        [x, y] = at(k, R + 12),
        anchorAt = Math.abs(cos) < 0.25 ? 'middle' : cos > 0 ? 'start' : 'end',
        lines = fold && anchorAt !== 'middle' && a.name.length > 2
          ? [a.name.slice(0, Math.ceil(a.name.length / 2)), a.name.slice(Math.ceil(a.name.length / 2))]
          : [a.name],
        lift = lines.length > 1 && Math.abs(sin) <= 0.5 ? 8 : 0,
        dy = (sin < -0.5 ? -4 - (lines.length - 1) * 15 : sin > 0.5 ? 14 : 5) - lift,
        tw = Math.max(...lines.map((l) => l.length)) * 14 + 10,
        th = 24 + (lines.length - 1) * 15,
        rx = anchorAt === 'middle' ? x - tw / 2 : anchorAt === 'start' ? x - 5 : x - tw + 5;
      return (
        '<g class="cmp-axis" tabindex="0" role="button" data-cmp-axis="' +
        esc(a.key) +
        '" aria-label="' +
        esc(a.name + '：' + list.map(({ hero }) => hero.name + ' ' + hero.scores[a.key]).join('、')) +
        '"><rect x="' +
        rx.toFixed(1) +
        '" y="' +
        (y + dy - 17).toFixed(1) +
        '" width="' +
        tw +
        '" height="' +
        th +
        '" rx="3"/><text y="' +
        (y + dy).toFixed(1) +
        '" text-anchor="' +
        anchorAt +
        '">' +
        lines.map((l, i) => '<tspan x="' + x.toFixed(1) + '"' + (i ? ' dy="15"' : '') + '>' + esc(l) + '</tspan>').join('') +
        '</text></g>'
      );
    })
    .join('');
  const shapes = list
    .map(({ hero, slot }) => {
      const c = SERIES[slot];
      return (
        '<g class="cmp-series" data-slot="' +
        slot +
        '"><polygon class="cmp-poly" points="' +
        pts((a) => (R * hero.scores[a.key]) / 100) +
        '" fill="' +
        c +
        '" fill-opacity="0.1" stroke="' +
        c +
        '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"' +
        (DASH[slot] ? ' stroke-dasharray="' + DASH[slot] + '"' : '') +
        '/></g>'
      );
    })
    .join('');
  // Markers above every outline, then the touch targets above those.
  const dots = list
    .map(({ hero, slot }) =>
      axes
        .map((a, k) => {
          const [x, y] = at(k, (R * hero.scores[a.key]) / 100);
          return (
            '<g class="cmp-dot" data-slot="' +
            slot +
            '" data-cmp-point="' +
            esc(hero.id + ' ' + a.key) +
            '"><title>' +
            esc(hero.name + ' · ' + a.name + ' ' + hero.scores[a.key]) +
            '</title>' +
            marker(slot, x, y) +
            '<circle class="cmp-hit" cx="' +
            x.toFixed(1) +
            '" cy="' +
            y.toFixed(1) +
            '" r="11"/></g>'
          );
        })
        .join('')
    )
    .join('');
  return (
    '<svg class="cmp-radar" viewBox="0 0 ' +
    w +
    ' ' +
    h.toFixed(0) +
    '" width="' +
    w +
    '" height="' +
    h.toFixed(0) +
    '" role="group" aria-label="七項評分雷達圖，數值另見右方對照表">' +
    rings +
    spokes +
    ringText +
    shapes +
    dots +
    labels +
    '</svg>'
  );
}

// ── growth ──────────────────────────────────────────────────────────────────
const measureName = (axes, m) => (m === 'composite' ? '綜合' : axes.find((a) => a.key === m).name);
const valueAt = (c, m) => (m === 'composite' ? c.composite : c.scores[m]);
function growthSvg(list, data, measure, width = 640) {
  const w = Math.max(300, width),
    narrow = w < 480,
    h = narrow ? 230 : 270,
    m = { l: 34, r: 14, t: 16, b: 34 },
    pw = w - m.l - m.r,
    ph = h - m.t - m.b,
    levels = data.levels,
    lo = levels[0],
    hi = levels[levels.length - 1],
    X = (lv) => m.l + ((lv - lo) / (hi - lo)) * pw,
    Y = (v) => m.t + ph - (v / 100) * ph,
    f = (n) => n.toFixed(1);
  const grid = [0, 25, 50, 75, 100]
    .map(
      (v) =>
        '<line class="' +
        (v ? 'cmp-ring' : 'cmp-base') +
        '" x1="' +
        m.l +
        '" x2="' +
        (w - m.r) +
        '" y1="' +
        f(Y(v)) +
        '" y2="' +
        f(Y(v)) +
        '"/><text class="cmp-tick" x="' +
        (m.l - 6) +
        '" y="' +
        f(Y(v) + 4) +
        '" text-anchor="end">' +
        v +
        '</text>'
    )
    .join('');
  const xticks = levels
    .map(
      (lv) =>
        '<text class="cmp-tick" x="' + f(X(lv)) + '" y="' + (m.t + ph + 16) + '" text-anchor="middle">' + lv + '</text>'
    )
    .join('');
  const axisNames =
    '<text class="cmp-tick" x="' +
    (w - m.r) +
    '" y="' +
    (h - 3) +
    '" text-anchor="end">等級</text>';
  const lines = list
    .map(({ hero, slot }) => {
      const d = hero.curve.map((c, i) => (i ? 'L' : 'M') + f(X(c.level)) + ' ' + f(Y(valueAt(c, measure)))).join('');
      const last = hero.curve[hero.curve.length - 1];
      return (
        '<g class="cmp-series" data-slot="' +
        slot +
        '"><path d="' +
        d +
        '" fill="none" stroke="' +
        SERIES[slot] +
        '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"' +
        (DASH[slot] ? ' stroke-dasharray="' + DASH[slot] + '"' : '') +
        '/>' +
        marker(slot, X(last.level), Y(valueAt(last, measure))) +
        '</g>'
      );
    })
    .join('');
  const step = pw / (hi - lo);
  const columns = levels
    .map((lv, i) => {
      const x = X(lv),
        said = list.map(({ hero }) => hero.name + ' ' + valueAt(hero.curve[i], measure)).join('、');
      return (
        '<g class="cmp-col" data-cmp-level="' +
        i +
        '"><g class="cmp-cross"><line x1="' +
        f(x) +
        '" x2="' +
        f(x) +
        '" y1="' +
        m.t +
        '" y2="' +
        (m.t + ph) +
        '"/>' +
        list.map(({ hero, slot }) => marker(slot, x, Y(valueAt(hero.curve[i], measure)))).join('') +
        '</g><rect class="cmp-hit" tabindex="0" x="' +
        f(Math.max(m.l - 8, x - step / 2)) +
        '" y="' +
        m.t +
        '" width="' +
        f(Math.min(step, x - (m.l - 8) + step / 2, w - x + step / 2)) +
        '" height="' +
        ph +
        '" aria-label="' +
        esc('第 ' + lv + ' 級 · ' + said) +
        '"/></g>'
      );
    })
    .join('');
  return (
    '<svg class="cmp-growth" viewBox="0 0 ' +
    w +
    ' ' +
    h +
    '" width="' +
    w +
    '" height="' +
    h +
    '" role="group" aria-label="' +
    esc(measureName(data.axes, measure) + '隨等級的變化') +
    '">' +
    grid +
    xticks +
    axisNames +
    lines +
    columns +
    '</svg>'
  );
}

// ── table, readouts, arts ───────────────────────────────────────────────────
function scoreTable(list, axes) {
  const rows = [...axes.map((a) => [a.name, (h) => h.scores[a.key]]), ['綜合', (h) => h.composite]];
  return (
    '<div class="cmp-table-wrap"><table class="cmp-table"><caption class="sr">各俠客七項評分與綜合分數（0 至 100）</caption><thead><tr><th scope="col">項目</th>' +
    list.map(({ hero, slot }) => '<th scope="col">' + key(slot) + '<span>' + esc(hero.name) + '</span></th>').join('') +
    '</tr></thead><tbody>' +
    rows
      .map(([name, get], i) => {
        const values = list.map(({ hero }) => get(hero)),
          best = Math.max(...values);
        return (
          '<tr' +
          (i === rows.length - 1 ? ' class="cmp-total"' : '') +
          '><th scope="row">' +
          esc(name) +
          '</th>' +
          values
            .map((v) =>
              list.length > 1 && v === best
                ? '<td class="is-best">' + esc(v) + '<span class="sr">（最高）</span></td>'
                : '<td>' + esc(v) + '</td>'
            )
            .join('') +
          '</tr>'
        );
      })
      .join('') +
    '</tbody></table></div>'
  );
}
const why = (r) =>
  r?.why?.length ? '<span class="cmp-why">' + r.why.map(esc).join('；') + '</span>' : '';
function axisReadout(axis, list) {
  return (
    '<h3>' +
    esc(axis.name) +
    '</h3>' +
    (axis.hint ? '<p class="cmp-hint">' + esc(axis.hint) + '</p>' : '') +
    '<ul>' +
    [...list]
      .sort((a, b) => b.hero.scores[axis.key] - a.hero.scores[axis.key])
      .map(
        ({ hero, slot }) =>
          '<li>' +
          key(slot) +
          '<b>' +
          esc(hero.scores[axis.key]) +
          '</b><span class="cmp-who">' +
          esc(hero.name) +
          '</span>' +
          why(hero.raw?.[axis.key]) +
          '</li>'
      )
      .join('') +
    '</ul>'
  );
}
function heroReadout({ hero, slot }, axes, only) {
  return (
    '<h3>' +
    key(slot) +
    esc(hero.name) +
    ' <small>綜合 ' +
    esc(hero.composite) +
    '</small></h3><ul>' +
    axes
      .filter((a) => !only || a.key === only)
      .map(
        (a) =>
          '<li><b>' +
          esc(hero.scores[a.key]) +
          '</b><span class="cmp-who">' +
          esc(a.name) +
          '</span>' +
          why(hero.raw?.[a.key]) +
          '</li>'
      )
      .join('') +
    '</ul>'
  );
}
const READOUT_HINT = '<p class="cmp-hint">點選或移到軸名、圖上的點或上方的俠客名牌，可看分數由來。</p>';

function artCard(art) {
  const meta = [
    art.kindName,
    art.tier ? art.tier + ' 階' : null,
    art.mp ? '內力 ' + art.mp : null,
    art.range ? '射程 ' + art.range + ' 格' : null,
    art.power?.trim() || null
  ].filter(Boolean);
  return (
    '<article class="cmp-art">' +
    '<h4>' +
    anchor(href('skills', art.id), esc(art.name)) +
    '</h4><p class="cmp-art-meta">' +
    meta.map((s) => '<span>' + esc(s) + '</span>').join('') +
    '</p>' +
    // learnedAt is when the growth curve's way of spending points reaches the art; an art it
    // never reaches by the last level has none.
    '<p class="cmp-art-when">' +
    (art.learnedAt != null ? '第 ' + esc(art.learnedAt) + ' 級習得' : '成長模擬中十二級前未學') +
    '</p>' +
    (art.desc ? '<p class="cmp-art-desc">' + esc(art.desc) + '</p>' : '') +
    '</article>'
  );
}
function artsGrid(list) {
  const cols = list.length;
  const ordered = list.map(({ hero }) =>
    [...hero.arts].sort((a, b) => (a.learnedAt ?? 99) - (b.learnedAt ?? 99) || (a.tier ?? 0) - (b.tier ?? 0))
  );
  return (
    '<div class="cmp-arts-scroll" tabindex="0" role="region" aria-label="各俠客第十二級的武學"><div class="cmp-arts" style="--cols:' +
    cols +
    '">' +
    list
      .map(({ hero, slot }, c) => {
        const s = hero.stats || {};
        return (
          '<header class="cmp-art-head" style="grid-column:' +
          (c + 1) +
          ';border-top-color:' +
          SERIES[slot] +
          '">' +
          '<div class="cmp-art-who">' +
          image(hero.portrait) +
          '<div><strong>' +
          anchor(href('heroes', hero.id), esc(hero.name)) +
          '</strong><small>' +
          esc(hero.school) +
          '</small></div></div><dl class="cmp-stats">' +
          STAT_NAMES.map(
            ([k, name, unit = '']) =>
              '<div><dt>' + name + '</dt><dd>' + esc(s[k] ?? '—') + (s[k] != null ? unit : '') + '</dd></div>'
          ).join('') +
          '</dl><p class="cmp-art-count">' +
          key(slot) +
          hero.arts.length +
          ' 式</p></header>' +
          ordered[c]
            .map((art, r) => '<div class="cmp-art-cell" style="grid-column:' + (c + 1) + ';grid-row:' + (r + 2) + '">' + artCard(art) + '</div>')
            .join('')
        );
      })
      .join('') +
    '</div></div>'
  );
}

// ── the page ────────────────────────────────────────────────────────────────
function picker(data, slots, list, measure) {
  const full = list.length >= MAX,
    picked = new Set(list.map(({ hero }) => hero.id));
  const chips = list
    .map(
      ({ hero, slot }) =>
        '<li class="cmp-chip" style="--c:' +
        SERIES[slot] +
        '"><button type="button" data-cmp-hero="' +
        esc(hero.id) +
        '" aria-label="' +
        esc('看' + hero.name + '的分數由來') +
        '">' +
        image(hero.portrait) +
        key(slot) +
        '<span>' +
        esc(hero.name) +
        '</span></button><a class="cmp-x" data-cmp-key="h-' +
        esc(hero.id) +
        '" href="' +
        esc(addressOf(withoutHero(slots, hero.id), measure)) +
        '" aria-label="' +
        esc('移除' + hero.name) +
        '">×</a></li>'
    )
    .join('');
  const others = data.heroes
    .filter((h) => !picked.has(h.id))
    .map((h) =>
      full
        ? '<li><span class="cmp-pick is-off" aria-disabled="true">' + image(h.portrait) + '<span>' + esc(h.name) + '</span></span></li>'
        : '<li><a class="cmp-pick" data-cmp-key="h-' +
          esc(h.id) +
          '" href="' +
          esc(addressOf(withHero(slots, h.id), measure)) +
          '" aria-label="' +
          esc('加入' + h.name) +
          '">' +
          image(h.portrait) +
          '<span>' +
          esc(h.name) +
          '</span></a></li>'
    )
    .join('');
  return (
    '<div class="cmp-picker">' +
    (list.length
      ? '<ul class="cmp-chips" aria-label="已選俠客">' + chips + '</ul>'
      : '<p class="cmp-hint">尚未選人。從下方點選俠客加入，最多五位。</p>') +
    '<div class="cmp-add"><p class="cmp-add-title">' +
    (full ? '已選滿五位：先移除一位，才能再加入' : '加入俠客 <small>' + list.length + '／' + MAX + '</small>') +
    '</p><ul class="cmp-picks">' +
    others +
    '</ul></div></div>'
  );
}
export function comparePage(p) {
  const data = lookup(),
    slots = readSlots(p),
    list = chosen(slots),
    measure = measureOf(p, data.axes);
  const intro =
    '<p class="cmp-intro">並列最多五位俠客：七項評分、從第一級到第十二級的成長，與滿級時手上的每一式武學。</p>';
  const head =
    crumb('俠客對照') +
    '<div class="index-head"><h1>俠客對照</h1><span class="count">已選 ' +
    list.length +
    '／' +
    MAX +
    ' 人</span></div>' +
    intro +
    picker(data, slots, list, measure);
  if (!list.length) return '<div class="compare" data-compare>' + head + notesBox(data) + '</div>';
  return (
    '<div class="compare" data-compare>' +
    head +
    '<section class="cmp-block" aria-labelledby="cmp-radar-h"><h2 id="cmp-radar-h">七項評分</h2>' +
    '<div class="cmp-radar-row"><figure class="cmp-figure">' +
    legend(list) +
    '<div class="cmp-chart" data-cmp-chart="radar">' +
    radarSvg(list, data.axes) +
    '</div><div class="cmp-readout" data-cmp-readout aria-live="polite">' +
    READOUT_HINT +
    '</div></figure>' +
    '<div class="cmp-side"><h3 class="cmp-sub">對照表 <small>0–100，各項最高者標底色</small></h3>' +
    scoreTable(list, data.axes) +
    '</div></div></section>' +
    '<section class="cmp-block" aria-labelledby="cmp-growth-h"><div class="cmp-block-head"><h2 id="cmp-growth-h">成長曲線</h2>' +
    '<label class="cmp-measure"><span>比較項目</span><select data-cmp-measure>' +
    [['composite', '綜合'], ...data.axes.map((a) => [a.key, a.name])]
      .map(([k, v]) => '<option value="' + esc(k) + '"' + (k === measure ? ' selected' : '') + '>' + esc(v) + '</option>')
      .join('') +
    '</select></label></div>' +
    '<figure class="cmp-figure cmp-growth-fig">' +
    legend(list) +
    '<div class="cmp-chart cmp-growth-chart" data-cmp-chart="growth" data-measure="' +
    esc(measure) +
    '">' +
    growthSvg(list, data, measure) +
    '<div class="cmp-tip" data-cmp-tip hidden></div></div>' +
    '<figcaption class="cmp-hint">縱軸為所選項目的分數（0–100），橫軸為等級。移到或點選某一級，可看各人數值與當時的武學點。</figcaption></figure></section>' +
    '<section class="cmp-block" aria-labelledby="cmp-arts-h"><h2 id="cmp-arts-h">滿級武學</h2>' +
    '<p class="cmp-hint">第十二級的屬性，與每位俠客學齊的全部武學，依習得等級排列。</p>' +
    artsGrid(list) +
    '</section>' +
    notesBox(data) +
    '</div>'
  );
}
function notesBox(data) {
  return data.notes?.length
    ? '<aside class="cmp-notes" aria-labelledby="cmp-notes-h"><h2 id="cmp-notes-h">說明</h2><ul>' +
        data.notes.map((s) => '<li>' + esc(s) + '</li>').join('') +
        '</ul></aside>'
    : '';
}

// ── behaviour, attached to each rendered page ───────────────────────────────
let observer;
export function mountCompare(root) {
  observer?.disconnect();
  observer = null;
  const page = root.querySelector('[data-compare]');
  if (!page) return;
  const data = lookup(),
    p = new URLSearchParams(location.hash.split(/\?(.*)/s)[1] || ''),
    list = chosen(readSlots(p));
  if (!list.length) return;
  const readout = page.querySelector('[data-cmp-readout]'),
    radarBox = page.querySelector('[data-cmp-chart="radar"]'),
    growthBox = page.querySelector('[data-cmp-chart="growth"]'),
    tip = () => growthBox.querySelector('[data-cmp-tip]');
  let pinned = '';
  const focusSlot = (slot) => {
    const svg = radarBox.querySelector('svg');
    if (slot == null) svg.removeAttribute('data-focus');
    else svg.setAttribute('data-focus', slot);
  };
  const show = (el, pin) => {
    const axis = el.dataset.cmpAxis,
      heroId = el.dataset.cmpHero,
      point = el.dataset.cmpPoint;
    const id = axis ? 'a:' + axis : heroId ? 'h:' + heroId : 'p:' + point;
    if (pin) pinned = id;
    if (axis) {
      readout.innerHTML = axisReadout(data.axes.find((a) => a.key === axis), list);
      focusSlot(null);
    } else {
      const [hid, ax] = (heroId || point).split(' ');
      const it = list.find(({ hero }) => hero.id === hid);
      if (!it) return;
      readout.innerHTML = heroReadout(it, data.axes, ax);
      focusSlot(it.slot);
    }
  };
  const target = (e) => e.target.closest?.('[data-cmp-axis], [data-cmp-hero], [data-cmp-point]');
  page.addEventListener('click', (e) => {
    const el = target(e);
    if (el) show(el, true);
  });
  page.addEventListener('keydown', (e) => {
    const el = target(e);
    if (el && el.matches('[data-cmp-axis]') && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      show(el, true);
    }
  });
  page.addEventListener('focusin', (e) => {
    const el = target(e);
    if (el) show(el, true);
    const col = e.target.closest?.('[data-cmp-level]');
    if (col) level(col);
  });
  page.addEventListener('mouseover', (e) => {
    const el = target(e);
    if (el && el.closest('.cmp-radar')) show(el, false);
    const col = e.target.closest?.('[data-cmp-level]');
    if (col) level(col);
  });
  radarBox.addEventListener('mouseleave', () => {
    if (!pinned) {
      readout.innerHTML = READOUT_HINT;
      focusSlot(null);
      return;
    }
    const [kind, ...rest] = pinned.split(':'),
      v = rest.join(':');
    const el = page.querySelector(
      kind === 'a' ? '[data-cmp-axis="' + v + '"]' : kind === 'h' ? '[data-cmp-hero="' + v + '"]' : '[data-cmp-point="' + v + '"]'
    );
    if (el) show(el, false);
  });
  // Growth: a crosshair on the nearest level, with every hero's value there.
  const level = (col) => {
    const i = +col.dataset.cmpLevel,
      measure = growthBox.dataset.measure,
      svg = growthBox.querySelector('svg');
    svg.querySelectorAll('.cmp-col.on').forEach((g) => g.classList.remove('on'));
    col.classList.add('on');
    const lv = list[0].hero.curve[i].level,
      t = tip();
    t.innerHTML =
      '<strong>第 ' +
      esc(lv) +
      ' 級 · ' +
      esc(measureName(data.axes, measure)) +
      '</strong>' +
      [...list]
        .sort((a, b) => valueAt(b.hero.curve[i], measure) - valueAt(a.hero.curve[i], measure))
        .map(({ hero, slot }) => {
          const c = hero.curve[i];
          return (
            '<span>' +
            key(slot) +
            '<b>' +
            esc(valueAt(c, measure)) +
            '</b> ' +
            esc(hero.name) +
            (c.points != null ? ' <small>武學點 ' + esc(c.points) + '</small>' : '') +
            '</span>'
          );
        })
        .join('');
    t.hidden = false;
    // Beside the crosshair, on whichever side has room.
    const box = growthBox.getBoundingClientRect(),
      line = col.querySelector('line').getBoundingClientRect(),
      x = line.left - box.left,
      tw = t.offsetWidth;
    t.style.left = Math.max(0, Math.min(box.width - tw, x + 12 + tw > box.width ? x - tw - 12 : x + 12)) + 'px';
  };
  const hideLevel = () => {
    growthBox.querySelectorAll('.cmp-col.on').forEach((g) => g.classList.remove('on'));
    tip().hidden = true;
  };
  growthBox.addEventListener('mouseleave', hideLevel);
  growthBox.addEventListener('focusout', (e) => {
    if (!growthBox.contains(e.relatedTarget)) hideLevel();
  });
  page.addEventListener('change', (e) => {
    if (!e.target.matches('[data-cmp-measure]')) return;
    const measure = e.target.value;
    growthBox.dataset.measure = measure;
    drawGrowth();
    const q = new URLSearchParams(location.hash.split(/\?(.*)/s)[1] || '');
    history.replaceState(null, '', addressOf(readSlots(q), measure));
    // The add and remove links carry the measure too.
    page.querySelectorAll('a.cmp-pick, a.cmp-x').forEach((a) => {
      const u = new URLSearchParams(a.getAttribute('href').split('?')[1]);
      a.setAttribute('href', addressOf(readSlots(u), measure));
    });
  });
  // Redraw at the width the page gives, so the labels keep their size on a phone.
  const drawRadar = () => {
    const w = Math.round(radarBox.clientWidth);
    if (w && Math.abs(w - (+radarBox.dataset.w || 0)) > 4) {
      radarBox.dataset.w = w;
      const focus = radarBox.querySelector('svg')?.getAttribute('data-focus');
      radarBox.innerHTML = radarSvg(list, data.axes, w);
      if (focus != null) focusSlot(focus);
    }
  };
  const drawGrowth = (force = true) => {
    const w = Math.round(growthBox.clientWidth);
    if (!w || (!force && Math.abs(w - (+growthBox.dataset.w || 0)) <= 4)) return;
    growthBox.dataset.w = w;
    growthBox.querySelector('svg').outerHTML = growthSvg(list, data, growthBox.dataset.measure, w);
    tip().hidden = true;
  };
  drawRadar();
  drawGrowth();
  if (window.ResizeObserver) {
    observer = new ResizeObserver(() => {
      drawRadar();
      drawGrowth(false);
    });
    observer.observe(radarBox);
    observer.observe(growthBox);
  }
}
