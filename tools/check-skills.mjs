// Checks every hero's skill tree against the redesign's own rules (R2, R4, R5, R8, R9 and the
// tree's structure), measuring each art with the game's own forecast.
//
//   node tools/check-skills.mjs            print each tree and its problems; exit 1 if any fail
//   node tools/check-skills.mjs --report   the same, but always exit 0
//   node tools/check-skills.mjs --verbose  also say why each comparison passed
//   node tools/check-skills.mjs hero guo   only these heroes
//
// Every number comes from `forecast` on a small scene laid out on a real board, against the
// enemies the rules put on real boards (tools/lib/skill-measure.mjs). An art is read through
// its fields only: a field that is not listed as bookkeeping there counts as a mechanic, so new
// mechanics are picked up without changing this file.
import {
  G, TECHNIQUES, HERO_PATHS, MASTERY_ARTS, TRADE_MANUALS, profile, classify, mainMeasure,
  measureName, effectKeys, costKeys, strikeEquivalent, heroTree, ancestors, artOf, FAMILY, JOB_NAMES,
  boardFoes
} from './lib/skill-measure.mjs';

// ── Thresholds: every judgement call in one place ──────────────────────────
const T = {
  // Where an art is measured: board depth (0-based stage, which sets the enemy numbers) and the
  // hero level a hero typically has there (from tools/sim-battles.mjs on today's data).
  REFERENCE: [
    { label: 'early', stage: 0, level: 1 },
    { label: 'mid', stage: 4, level: 4 },
    { label: 'late', stage: 8, level: 7 }
  ],
  // R2: a node is "weaker" than an ancestor if its main measure is below the ancestor's by more
  // than this fraction.
  WEAKER_MARGIN: 0.03,
  // R2: what counts as a lower cost: this much less 內力, or dropping a price the ancestor pays.
  LOWER_COST_MP: 2,
  // R2 (advisory): warn when a node is this much weaker and only a form tag saves it.
  FORM_ONLY_MARGIN: 0.15,
  // Classification: an enemy-targeted art that leaves a condition and hits for less than this
  // multiple of the hero's basic attack is a debuff, not a strike.
  DEBUFF_BELOW_BASIC: 1.1,
  // R4: a later strike that out-reaches the starting art by at least this many tiles is only
  // warned about, not failed, when the starting art out-damages it.
  R4_REACH_EXCUSE: 2,
  // R5: twins have reach within this many tiles and main measures within this fraction.
  TWIN_REACH: 1,
  TWIN_MEASURE: 0.1,
  // R8: total points in a tree, and nodes in it (the basic upgrade included).
  POINTS_BAND: [11, 15],
  NODE_BAND: [6, 7],
  // The summit must cost at least as much as any other node (true: a tie is enough).
  SUMMIT_TIE_OK: true,
  // R9: plain-strike-equivalent bands per tier ('start' is the starting art), from FRAMEWORK.md.
  STRIKE_BANDS: { start: [1.25, 1.45], 1: [1.3, 1.5], 2: [1.45, 1.7], 3: [1.65, 1.95], 4: [2.0, 2.5] },
  // R9: heal plus shield, times people (aura counts as AURA_PEOPLE). Start and summit are from
  // FRAMEWORK.md; tiers 1 to 3 are this tool's interpolation.
  SUPPORT_BANDS: { start: [28, 34], 1: [30, 40], 2: [36, 46], 3: [42, 54], 4: [50, 60] },
  STRIKE_SLACK: 0.1, // "well outside": this far past the band edge
  SUPPORT_SLACK: 6,
  PRICES: {
    safe: 0.15, pierceHalf: 0.15, reachTile: 0.1, splash: 0.25, push: 0.1, debuffTwoTurns: 0.15,
    hpCost: 0.25, auraPeople: 2
  },
  // Shop manuals: a manual duplicates a node of its likely buyer when the jobs match, reach is
  // within TWIN_REACH and the main measures are within this fraction.
  MANUAL_DUPLICATE: 0.1
};

const args = process.argv.slice(2);
const REPORT = args.includes('--report'),
  VERBOSE = args.includes('--verbose');
const only = args.filter((a) => !a.startsWith('--'));
const heroes = Object.keys(HERO_PATHS).filter((id) => !only.length || only.includes(id));

const name = (heroId, id) =>
  id === 'signature' ? G.DETAILS[heroId].skill : id === 'basic' ? G.DETAILS[heroId].basic : TECHNIQUES[id]?.name || id;
const pct = (a, b) => (b ? Math.round(((a - b) / b) * 100) : 0);
const fmt = (n) => (n == null ? '-' : String(n));
const pad = (v, n) => String(v).padEnd(n);
const lpad = (v, n) => String(v).padStart(n);

let failures = 0,
  warnings = 0;
const cache = new Map();
function prof(heroId, id) {
  const k = heroId + '/' + id;
  if (!cache.has(k)) {
    const p = profile(heroId, id, T.REFERENCE);
    const art = id === 'basic' ? null : artOf(heroId, id);
    p.art = art;
    p.cls = classify(art, p, T);
    p.job = p.cls.job;
    p.measure = mainMeasure(p.job, p);
    p.mp = art && art.kind !== 'basic' ? art.mp || 0 : 0;
    p.effects = effectKeys(art);
    p.costs = costKeys(art);
    p.safe = p.type === 'enemy' && p.mid.counter === 0 && p.counterIfOpen > 0;
    cache.set(k, p);
  }
  return cache.get(k);
}

// What `node` has that `anc` lacks, as reasons a weaker node may still be worth buying.
function additions(node, anc) {
  const adds = [];
  if (node.reach > anc.reach) adds.push('reach ' + node.reach + ' vs ' + anc.reach);
  if (node.safe && !anc.safe) adds.push('no counter');
  const fx = [...node.effects].filter((k) => !anc.effects.has(k));
  if (fx.length) adds.push('adds ' + fx.join(', '));
  if (anc.job !== 'basic' && node.mp <= anc.mp - T.LOWER_COST_MP) adds.push('mp ' + node.mp + ' vs ' + anc.mp);
  const dropped = [...anc.costs].filter((k) => !node.costs.has(k));
  if (dropped.length) adds.push('drops ' + dropped.join(', '));
  return { adds, formOnly: adds.length > 0 && adds.length === 1 && fx.length > 0 && fx.every((k) => k.startsWith('form:')) && !adds[0].startsWith('reach') };
}
const describe = (heroId, id, p) =>
  id + ' ' + name(heroId, id) + ' (' + JOB_NAMES[p.job] + ', ' + p.measure + ')';

function checkHero(heroId) {
  const path = HERO_PATHS[heroId];
  const out = [],
    fail = (rule, text) => out.push(['FAIL', rule, text]),
    warn = (rule, text) => out.push(['warn', rule, text]),
    note = (rule, text) => VERBOSE && out.push(['ok', rule, text]);
  const ids = heroTree(heroId);
  const lastRow = path.layout.length;

  // ── Structure ──
  path.layout.forEach((row, i) => {
    if (row.length > 3) fail('structure', 'tier ' + (i + 1) + ' has ' + row.length + ' lanes (at most 3)');
    for (const id of row.filter(Boolean)) {
      const a = MASTERY_ARTS[id];
      if (!a) fail('structure', id + ' is in the layout but not in MASTERY_ARTS');
      else if (a.owner !== heroId) fail('structure', id + ' is in the layout but belongs to ' + a.owner);
      else if (a.tier !== i + 1) fail('structure', id + ' sits in tier row ' + (i + 1) + ' but says tier ' + a.tier);
    }
  });
  for (const [id, a] of Object.entries(MASTERY_ARTS))
    if (a.owner === heroId && !ids.includes(id)) fail('structure', id + ' belongs to ' + heroId + ' but is not in the layout');
  const present = ids.filter((id) => MASTERY_ARTS[id]?.owner === heroId);
  for (const id of present) {
    const a = MASTERY_ARTS[id];
    for (const p of a.needs || []) {
      if (p === 'signature' || G.TALENTS[p]) continue;
      if (!MASTERY_ARTS[p] || MASTERY_ARTS[p].owner !== heroId) fail('structure', id + ' needs ' + p + ', which is not in this tree');
      else if (MASTERY_ARTS[p].tier >= a.tier)
        fail('structure', id + ' (tier ' + a.tier + ') needs ' + p + ' (tier ' + MASTERY_ARTS[p].tier + '): prerequisites must sit in an earlier tier');
    }
    if (!(a.needs || []).length && a.kind !== 'basic')
      fail('structure', id + ' has no prerequisite: every node should hang from the starting art or the basic upgrade');
    if (a.gate && !['kills', 'casts', 'heals', 'protects', 'steps', 'side', 'level'].includes(a.gate.metric))
      warn('structure', id + ' has a gate on an unknown measure "' + a.gate.metric + '"');
  }
  const known = new Set(['signature', ...Object.keys(G.TALENTS)]);
  for (let changed = true; changed; ) {
    changed = false;
    for (const id of present)
      if (!known.has(id) && (MASTERY_ARTS[id].needs || []).every((p) => known.has(p))) {
        known.add(id);
        changed = true;
      }
  }
  for (const id of present) if (!known.has(id)) fail('structure', id + ' can never be learned: a prerequisite is missing or circular');
  const basics = present.filter((id) => MASTERY_ARTS[id].kind === 'basic');
  if (basics.length !== 1) fail('structure', basics.length + ' basic-attack upgrades (kind basic); there must be exactly one');
  const top = (path.layout[lastRow - 1] || []).filter(Boolean);
  let summit = null;
  if (top.length !== 1) fail('structure', 'the last tier holds ' + top.length + ' nodes; it must hold exactly one');
  else {
    summit = top[0];
    const a = MASTERY_ARTS[summit];
    if (a && !a.gate) fail('structure', 'the summit ' + summit + ' has no gate');
    const dearer = present.filter((id) => id !== summit && (T.SUMMIT_TIE_OK ? MASTERY_ARTS[id].points > a.points : MASTERY_ARTS[id].points >= a.points));
    if (a && dearer.length) fail('structure', 'the summit costs ' + a.points + ' but ' + dearer.join(', ') + ' cost as much or more');
  }
  const total = present.reduce((n, id) => n + (MASTERY_ARTS[id].points || 0), 0);
  if (total < T.POINTS_BAND[0] || total > T.POINTS_BAND[1])
    fail('structure', 'total ' + total + ' points, outside ' + T.POINTS_BAND.join('-'));
  if (present.length < T.NODE_BAND[0] || present.length > T.NODE_BAND[1])
    warn('structure', present.length + ' nodes; the framework asks for ' + T.NODE_BAND.join(' or ') + ' (basic upgrade included)');

  // ── Measures ──
  const arts = ['signature', ...present];
  const P = Object.fromEntries(arts.map((id) => [id, prof(heroId, id)]));
  const basicPlain = prof(heroId, 'basic');

  // ── R2: nothing downstream is weaker at its ancestor's own job ──
  for (const id of present) {
    if (MASTERY_ARTS[id].kind === 'basic') continue;
    const n = P[id];
    for (const aid of ancestors(id)) {
      const a = aid === 'signature' ? P.signature : P[aid] || (TECHNIQUES[aid]?.kind === 'basic' ? prof(heroId, aid) : null);
      if (!a || FAMILY[a.job] !== FAMILY[n.job]) continue;
      const mine = mainMeasure(a.job, n),
        theirs = mainMeasure(a.job, a);
      const label = name(heroId, aid) + ' at ' + JOB_NAMES[a.job] + ' (' + measureName(a.job) + ')';
      if (mine >= theirs * (1 - T.WEAKER_MARGIN)) {
        note('R2', id + ' >= ' + aid + ': ' + mine + ' vs ' + theirs);
        continue;
      }
      const { adds, formOnly } = additions(n, a);
      const gap = mine + ' vs ' + theirs + ' (' + pct(mine, theirs) + '%)';
      if (!adds.length)
        fail('R2', id + ' ' + name(heroId, id) + ' is weaker than its ancestor ' + aid + ' ' + label + ': ' + gap + ', and adds no reach, safety, effect or lower cost');
      else if (formOnly && mine < theirs * (1 - T.FORM_ONLY_MARGIN))
        warn('R2', id + ' ' + name(heroId, id) + ' is weaker than ' + aid + ' ' + label + ': ' + gap + '; only its form tag (' + adds.join('; ') + ') keeps it from failing');
      else note('R2', id + ' weaker than ' + aid + ' (' + gap + ') but ' + adds.join('; '));
    }
  }

  // ── R4: the summit is the best; the starting art is not stronger than later strikes ──
  if (summit && P[summit]) {
    const s = P[summit];
    for (const id of arts) {
      if (id === summit || FAMILY[P[id].job] !== FAMILY[s.job] || P[id].job === 'basic') continue;
      const theirs = mainMeasure(s.job, P[id]);
      if (theirs > s.measure)
        fail('R4', 'the summit ' + describe(heroId, summit, s) + ' is beaten at its own job by ' + id + ' ' + name(heroId, id) + ': ' + theirs + ' vs ' + s.measure + ' ' + measureName(s.job));
    }
  }
  const start = P.signature;
  for (const id of present) {
    const n = P[id];
    if (n.job === 'basic' || n.job === 'debuff') continue;
    const strike = FAMILY[n.job] === 'strike';
    if (!(strike ? start.type === 'enemy' : FAMILY[start.job] === FAMILY[n.job])) continue;
    // Each compared on the later node's own job: an area strike by its total with splash.
    const mine = n.measure,
      theirs = mainMeasure(n.job, start);
    if (theirs <= mine) continue;
    const text = 'the starting art ' + name(heroId, 'signature') + ' out-' + (strike ? 'damages' : 'does') + ' the later ' + describe(heroId, id, n) + ': ' + theirs + ' vs ' + mine + ' (' + measureName(n.job) + ')';
    if (n.reach >= start.reach + T.R4_REACH_EXCUSE) warn('R4', text + '; it does reach ' + n.reach + ' vs ' + start.reach);
    else fail('R4', text);
  }

  // ── R5: no twins ──
  const pool = ['signature', ...present.filter((id) => MASTERY_ARTS[id].kind !== 'basic')];
  for (let i = 0; i < pool.length; i++)
    for (let j = i + 1; j < pool.length; j++) {
      const [x, y] = [pool[i], pool[j]],
        a = P[x],
        b = P[y];
      if (ancestors(x).has(y) || ancestors(y).has(x)) continue;
      if (a.job !== b.job || a.type !== b.type || Math.abs(a.reach - b.reach) > T.TWIN_REACH) continue;
      const hi = Math.max(a.measure, b.measure),
        lo = Math.min(a.measure, b.measure);
      if (hi && (hi - lo) / hi > T.TWIN_MEASURE) continue;
      const diff = [...a.effects].filter((k) => !b.effects.has(k)).concat([...b.effects].filter((k) => !a.effects.has(k)));
      const text = x + ' ' + name(heroId, x) + ' and ' + y + ' ' + name(heroId, y) + ' are both ' + JOB_NAMES[a.job] + ', reach ' + a.reach + '/' + b.reach + ', ' + a.measure + ' vs ' + b.measure;
      if (!diff.length) fail('R5', text + ', with no differing effect: one will crowd the other out');
      else if (diff.every((k) => k.startsWith('form:'))) warn('R5', text + '; they differ only in form tags (' + diff.join(', ') + ')');
    }

  // ── R9: power budget (advisory) ──
  const budget = {};
  for (const id of arts) {
    const art = P[id].art,
      tier = id === 'signature' ? 'start' : art.tier;
    const e = strikeEquivalent(art, T.PRICES);
    let band = null,
      off = null,
      shown = e.note || '-';
    if (e.note?.startsWith('basic')) shown = e.note.slice(6);
    if (e.value != null) {
      band = T.STRIKE_BANDS[tier];
      shown = e.value.toFixed(2);
      if (band && (e.value < band[0] - T.STRIKE_SLACK || e.value > band[1] + T.STRIKE_SLACK)) off = e.value < band[0] ? 'low' : 'high';
    } else if (e.support != null) {
      band = T.SUPPORT_BANDS[tier];
      shown = String(e.support);
      if (band && (e.support < band[0] - T.SUPPORT_SLACK || e.support > band[1] + T.SUPPORT_SLACK)) off = e.support < band[0] ? 'low' : 'high';
    }
    budget[id] = { shown, band: band ? band.join('-') : '-', off, unpriced: e.unpriced };
    if (off)
      warn('R9', id + ' ' + name(heroId, id) + ' is ' + shown + ', well ' + (off === 'low' ? 'below' : 'above') + ' the tier-' + tier + ' band ' + band.join('-') + (e.unpriced.length ? ' (unpriced: ' + e.unpriced.join(', ') + ')' : ''));
  }

  // ── Print ──
  const hdr = G.DETAILS[heroId].name + ' ' + heroId + ' · ' + path.title + ' · ' + total + ' points (band ' + T.POINTS_BAND.join('-') + ') · summit ' + (summit || '?');
  console.log('\n' + hdr);
  console.log(
    '  ' + pad('id', 18) + pad('T', 3) + lpad('pts', 3) + lpad('mp', 4) + lpad('rng', 4) + '  ' + pad('job', 9) +
      lpad('early', 6) + lpad('mid', 5) + lpad('late', 5) + lpad('area', 6) + lpad('ctr', 5) + lpad('main', 6) + lpad('PSE', 6) + '  ' + pad('band', 10) + 'name / notes'
  );
  const row = (id, p, tier, pts) => {
    const hard = p.points.map((pt) => (p.type === 'enemy' ? pt.hard.damage : p.type === 'ground' ? '-' : pt.hard.heal + pt.hard.shield + pt.hard.buff));
    const b = budget[id] || { shown: '-', band: '-' };
    const notes = [];
    if (p.conditional) notes.push('conditional: ' + p.conditional.damage + ' (+' + p.conditional.gain + ') when ' + p.conditional.label + ' (' + p.conditional.at + ')');
    if (p.short) notes.push('measured at a shorter reach than it has');
    if (b.off) notes.push('budget ' + b.off);
    console.log(
      '  ' + pad(id, 18) + pad(tier, 3) + lpad(fmt(pts), 3) + lpad(p.mp || '-', 4) + lpad(p.reach, 4) + '  ' + pad(p.job, 9) +
        lpad(hard[0], 6) + lpad(hard[1], 5) + lpad(hard[2], 5) + lpad(p.type === 'enemy' ? p.avgArea : '-', 6) + lpad(p.type === 'enemy' ? p.mid.counter : '-', 5) +
        lpad(p.measure, 6) + lpad(b.shown, 6) + '  ' + pad(b.band, 10) + name(heroId, id) + (notes.length ? '  · ' + notes.join(' · ') : '')
    );
  };
  row('basic', basicPlain, '-', null);
  row('signature', P.signature, 0, null);
  for (const id of present) row(id, P[id], MASTERY_ARTS[id].tier, MASTERY_ARTS[id].points);
  for (const [level, rule, text] of out) {
    if (level === 'FAIL') failures++;
    else if (level === 'warn') warnings++;
    console.log('  ' + pad(level, 5) + pad(rule, 10) + text);
  }
  const fails = out.filter((o) => o[0] === 'FAIL').length;
  return { heroId, fails, warns: out.filter((o) => o[0] === 'warn').length, P };
}

// ── The shop manuals ────────────────────────────────────────────────────
function checkManuals(results) {
  console.log('\nShop manuals (TRADE_MANUALS), measured for the hero who gets the most out of each');
  console.log('  ' + pad('id', 15) + pad('buyer', 7) + lpad('pts', 3) + lpad('mp', 4) + lpad('rng', 4) + '  ' + pad('job', 9) + lpad('early', 6) + lpad('mid', 5) + lpad('late', 5) + lpad('main', 6) + lpad('PSE', 6) + '  name / notes');
  const lines = [];
  for (const [id, book] of Object.entries(TRADE_MANUALS)) {
    // The likely buyer: the hero for whom it measures highest; a tie goes to the hero its
    // `visual` names, then to the first hero in party order.
    let best = null;
    for (const h of G.PARTY) {
      const p = prof(h, id);
      const score = p.measure + (book.visual === h ? 0.5 : 0);
      if (!best || score > best.score) best = { h, p, score };
    }
    const { h, p } = best;
    const tree = results.find((r) => r.heroId === h)?.P || {};
    const dupes = [],
      already = [];
    for (const [nid, n] of Object.entries(tree)) {
      if (n.job !== p.job || n.type !== p.type || Math.abs(n.reach - p.reach) > T.TWIN_REACH) continue;
      const hi = Math.max(n.measure, p.measure);
      if (hi && Math.abs(n.measure - p.measure) / hi <= T.MANUAL_DUPLICATE) dupes.push(nid + ' ' + name(h, nid) + ' (' + n.measure + ')');
      else if (n.measure > p.measure) already.push(nid + ' ' + name(h, nid) + ' (' + n.measure + ')');
    }
    const e = strikeEquivalent(book, T.PRICES);
    const hard = p.points.map((pt) => (p.type === 'enemy' ? pt.hard.damage : p.type === 'ground' ? '-' : pt.hard.heal + pt.hard.shield + pt.hard.buff));
    const notes = [];
    if (p.conditional) notes.push('conditional: ' + p.conditional.damage + ' when ' + p.conditional.label);
    if (already.length) notes.push(G.DETAILS[h].name + ' already has stronger: ' + already.join(', '));
    console.log(
      '  ' + pad(id, 15) + pad(h, 7) + lpad(book.points, 3) + lpad(book.mp || '-', 4) + lpad(p.reach, 4) + '  ' + pad(p.job, 9) + lpad(hard[0], 6) + lpad(hard[1], 5) + lpad(hard[2], 5) +
        lpad(p.measure, 6) + lpad(e.value != null ? e.value.toFixed(2) : e.support ?? '-', 6) + '  ' + book.name + (notes.length ? '  · ' + notes.join(' · ') : '')
    );
    if (dupes.length) lines.push('  warn manual   ' + id + ' ' + book.name + ' duplicates, for ' + G.DETAILS[h].name + ', ' + dupes.join(', ') + ' (' + JOB_NAMES[p.job] + ', main measure within ' + T.MANUAL_DUPLICATE * 100 + '%)');
  }
  for (const l of lines) {
    warnings++;
    console.log(l);
  }
}

// ── Run ──
const foes = boardFoes();
console.log('Skill trees against the redesign rules. Measured with forecast on open ground, no talents, gear as the hero starts.');
console.log(
  'Reference foes: ' +
    T.REFERENCE.map((r) => {
      const b = foes[r.stage];
      return r.label + ' = board ' + (r.stage + 1) + ', hero level ' + r.level + ', soft ' + b.soft.id + ' def ' + b.soft.def + ', hard ' + b.boss.id + ' def ' + b.boss.def;
    }).join('; ')
);
console.log('Columns: early/mid/late = damage to the hard foe (support: heal+shield+buff on the cluster); area = avg damage incl. splash on two neighbours; ctr = counter taken at full reach (mid); main = the job\'s main measure; PSE = plain strike equivalent (support: heal+shield x people) beside its R9 band.');
const results = heroes.map(checkHero);
if (!only.length) checkManuals(results);
console.log('\nSummary');
for (const r of results) console.log('  ' + pad(r.heroId, 7) + pad(G.DETAILS[r.heroId].name, 5) + ' ' + r.fails + ' fail, ' + r.warns + ' warn');
console.log(failures + ' failure(s), ' + warnings + ' warning(s)');
if (failures && !REPORT) process.exit(1);
if (!failures) console.log('OK');
