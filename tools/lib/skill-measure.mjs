// Measures arts with the game's own arithmetic, for tools/check-skills.mjs and tools/sim-battles.mjs.
//
// Nothing here re-derives the damage formula: every number comes out of the rules' `forecast`,
// on a small scene laid out on a real board, against enemy numbers taken from real boards.
// Nothing here knows the names of today's arts or mechanics either: an art is read through its
// fields, and any field that is not bookkeeping (BOOKKEEPING below) counts as a mechanic.
const root = new URL('../../game/src/', import.meta.url);
const load = (file) => import(new URL(file, root));
export const G = await load('rules/game.js');
export const R = await load('rules/journey.js');
const { TECHNIQUES } = await load('data/martial-arts.js');
const { HERO_PATHS, MASTERY_ARTS, TRADE_MANUALS } = await load('data/mastery-catalog.js');
const { mapLayout, fieldCells, tileInfo } = await load('data/terrain.js');
export { TECHNIQUES, HERO_PATHS, MASTERY_ARTS, TRADE_MANUALS };

// ── Field families ────────────────────────────────────────────────────────
// Pure bookkeeping: never a mechanic. Add a field here only if it says nothing about play.
export const BOOKKEEPING = new Set([
  'name', 'owner', 'tier', 'needs', 'points', 'icon', 'visual', 'desc', 'source', 'root', 'kind',
  'mp', 'range', 'target', 'gate', 'price', 'stock', 'manual', 'requires', 'forms', 'lane'
]);
// Mechanics whose whole worth already shows in the measured numbers (damage, healing, people
// reached), so they are compared by measurement rather than counted as "adds an effect".
export const MEASURED = new Set(['factor', 'pierce', 'hits', 'basicBonus', 'aura', 'heal']);
// Prices the art pays rather than effects it adds. A node that adds one of these does not
// thereby "add an effect"; one that drops one has a lower cost. Unknown fields are not prices.
export const TRADE_OFFS = new Set([
  'hpCost', 'recoil', 'rooted', 'spent', 'openGuard', 'backlash', 'consume', 'once', 'cooldown',
  'poised'
]);

// What an art does besides its measured numbers: every mechanic field and every form tag.
// Object fields with a `stat` (debuff) are split by stat, so lowering attack and lowering
// defence count as different effects.
export function effectKeys(art) {
  const keys = new Set();
  if (!art) return keys;
  for (const [k, v] of Object.entries(art)) {
    if (BOOKKEEPING.has(k) || MEASURED.has(k) || TRADE_OFFS.has(k)) continue;
    if (v === false || v === null || v === undefined || v === 0) continue;
    keys.add(v && typeof v === 'object' && !Array.isArray(v) && v.stat ? k + ':' + v.stat : k);
  }
  for (const f of art.forms || []) keys.add('form:' + f);
  return keys;
}
export function costKeys(art) {
  return new Set(Object.keys(art || {}).filter((k) => TRADE_OFFS.has(k) && art[k]));
}

// ── Reference targets from the real boards ──────────────────────────────
// Plays a run through without fighting, settling each board as won, and records the enemies
// the rules put on each board. Enemy numbers depend on the depth of the board in the run.
let foeCache = null;
export function boardFoes() {
  if (foeCache) return foeCache;
  const s = R.startRun(R.drawLots(12345), R.LEGACY);
  const out = [];
  for (let stage = 0; stage < 10; stage++) {
    R.turnPage(s, true);
    R.deployLineup(s);
    const foes = G.enemies(s).map((e) => ({ ...e, conditions: undefined }));
    const boss = foes.find((e) => e.id === G.commanderId(s));
    const soft = foes.filter((e) => e !== boss).sort((a, b) => a.def - b.def)[0];
    out.push({ stage, map: s.mapIndex, boss, soft, foes });
    if (stage === 9) break;
    s.result = 'win';
    s.round = 9;
    R.settle(s);
    R.turnPage(s, true);
    R.advance(s);
  }
  return (foeCache = out);
}

// ── A scene on a real board ───────────────────────────────────────────────
// Attacker A on the same row as target T at distance d, B directly behind T (for splash and
// anything that runs through), S beside T, and H beside A (for "a companion near the hero").
// All on open ground with no terrain defence.
const sceneCache = new Map();
function open(map, x, y) {
  const t = tileInfo(x, y, map);
  return !!t && Number.isFinite(t.cost) && !t.defense && !t.heal;
}
export function sceneFor(d) {
  if (sceneCache.has(d)) return sceneCache.get(d);
  let best = null;
  for (let map = 0; map < 10 && !best; map++)
    for (const c of fieldCells(map)) {
      const { x, y } = c;
      const need = [[x, y], [x + 1, y], [x, y + 1], [x - d, y], [x - d, y - 1]];
      for (let i = 1; i < d; i++) need.push([x - i, y]);
      if (need.every(([a, b]) => open(map, a, b))) {
        best = {
          map,
          T: { x, y },
          B: { x: x + 1, y },
          S: { x, y: y + 1 },
          A: { x: x - d, y },
          H: { x: x - d, y: y - 1 }
        };
        break;
      }
    }
  if (!best && d > 1) best = { ...sceneFor(d - 1), short: true };
  sceneCache.set(d, best);
  return best;
}

// A hero as the game builds one, raised to a level, with nothing bought.
export function heroAt(id, level, learned = []) {
  const u = G.startingHero(id);
  if (level > 1) G.raiseLevel(u, level - 1);
  u.hp = u.maxHp;
  u.mp = u.maxMp;
  u.learned = [...learned];
  u.slots = ['signature', null, null];
  u.activeArt = 'signature';
  u.mastery = { kills: 0, casts: 0, heals: 0, protects: 0, steps: 0, sides: [] };
  return u;
}
function dummyFoe(base, id, at) {
  // Plenty of health so nothing is felled and every hit is counted in full.
  // It keeps the real foe's id, so the rules can look up its details (its counter, its name).
  return { ...base, ref: id, x: at.x, y: at.y, hp: 999, maxHp: 999, conditions: undefined, brace: false, acted: false };
}
function dummyFriend(u, id, at) {
  const v = G.makeUnit(u.id, 'ally', at.x, at.y, u.maxHp, u.maxMp, u.atk, u.def, u.step, u.range);
  // Hurt enough that any heal lands in full.
  v.maxHp = 600;
  v.hp = 300;
  v.dummy = id;
  return v;
}

// Favourable situations an art may be built for. Each is tried on its own; the best is
// reported as the art's conditional ceiling. None of them names a mechanic: they only change
// the situation, and the rules decide whether that matters.
const SITUATIONS = [
  ['stood still', (c) => { c.u.moved = false; delete c.u.route; }],
  ['walked far', (c) => {
    c.u.moved = true;
    c.u.route = Array.from({ length: 6 }, (_, i) => ({ x: c.u.x - 5 + i, y: c.u.y }));
  }],
  ['target at half health', (c) => { c.t.maxHp = 1998; c.t.hp = 999; }],
  ['target marked and poisoned', (c) => {
    c.t.conditions = {
      mark: { power: 1, through: 9, source: c.u.id },
      poison: { power: 6, through: 3, source: c.u.id }
    };
  }],
  ['companion behind the target', (c) => {
    const b = c.s.units.find((v) => v.ref === 'refB');
    if (b) Object.assign(b, { side: 'ally', talents: b.talents });
  }],
  ['companion beside the hero', (c) => {
    c.s.units.push(dummyFriend(c.u, 'nearH', c.sc.H));
  }],
  ['hero at a third of health', (c) => { c.u.hp = Math.ceil(c.u.maxHp / 3); }],
  ['hero struck last turn', (c) => { c.u.struck = true; c.u.lastHitRound = 1; }]
];

// Build a scene: hero u at A, the primary at T (enemy or companion), the others at B and S.
function build(u, art, ref, distance) {
  const sc = sceneFor(Math.max(1, distance));
  const type = art ? G.targetType(art) : 'enemy';
  const hero = { ...u, x: sc.A.x, y: sc.A.y, moved: true, conditions: undefined };
  const s = {
    mapIndex: sc.map,
    round: 1,
    phase: 'ally',
    result: null,
    stats: { damage: 0, healed: 0, kills: 0 },
    logs: [],
    stock: {},
    units: [hero],
    leader: hero.id
  };
  let t;
  if (type === 'enemy') {
    t = dummyFoe(ref, 'refT', sc.T);
    s.units.push(t, dummyFoe(ref, 'refB', sc.B), dummyFoe(ref, 'refS', sc.S));
  } else if (type === 'self') {
    hero.maxHp += 300; // hurt enough that a self-heal lands in full
    t = hero;
    s.units.push(dummyFriend(u, 'f1', sc.H));
  } else if (type === 'ground') {
    t = { x: sc.T.x, y: sc.T.y };
  } else {
    t = dummyFriend(u, 'refT', sc.T);
    s.units.push(t, dummyFriend(u, 'refB', sc.B), dummyFriend(u, 'refS', sc.S));
  }
  if (type === 'self') hero.hp = hero.maxHp - 300;
  return { s, u: hero, t, sc, type };
}

// Read what forecast says into a few numbers.
function readForecast(f, type) {
  if (!f) return null;
  const out = { damage: 0, area: 0, counter: 0, heal: 0, shield: 0, buff: 0, foeEffect: 0, people: 0 };
  const effectWorth = (e) => (e.power || 0) * (e.turns || 1);
  if (type === 'enemy') {
    out.damage = f.amount;
    out.area = f.amount + f.splash.reduce((n, h) => n + h.amount, 0);
    out.splashCount = f.splash.length;
    out.counter = f.counter;
    out.selfHeal = f.selfHeal || 0;
    out.foeEffect = f.effects.reduce((n, e) => n + effectWorth(e), 0);
    out.foeEffects = f.effects.map((e) => e.kind);
  } else if (type === 'ally' || type === 'self') {
    out.people = f.recipients.length;
    out.heal = f.recipients.reduce((n, r) => n + (r.amount || 0), 0);
    const shieldEach = f.effects.filter((e) => e.kind === 'shield').reduce((n, e) => n + e.power, 0);
    out.shield = shieldEach * f.recipients.length + f.recipients.reduce((n, r) => n + (r.overflow || 0), 0);
    out.buff =
      f.effects.filter((e) => e.kind !== 'shield').reduce((n, e) => n + effectWorth(e), 0) *
      f.recipients.length;
  }
  return out;
}

// Measure one art (or the basic attack, art = null with basic given) for hero u against a
// reference foe. Returns the plain case, plus the best favourable situation if one helps.
export function measure(u, art, ref, basic = null) {
  const reach = art ? art.range ?? 1 : u.range;
  const c = build(u, art, ref, reach);
  if (c.type === 'ground') return { plain: { reach }, type: 'ground' };
  const run = (ctx) => {
    try {
      return readForecast(
        G.forecast(ctx.u, ctx.t, !!art, ctx.s, art, basic || G.basicFor(ctx.u)),
        ctx.type
      );
    } catch (e) {
      return { error: e.message };
    }
  };
  const plain = run(c);
  let best = null;
  if (c.type === 'enemy')
    for (const [label, apply] of SITUATIONS) {
      const ctx = build(u, art, ref, reach);
      apply({ ...ctx, sc: ctx.sc });
      const m = run(ctx);
      if (m && !m.error && m.damage > (best?.m.damage ?? plain.damage)) best = { label, m };
    }
  return { plain, type: c.type, best, short: c.sc.short };
}

// ── Classification ──────────────────────────────────────────────────────
export const JOB_NAMES = {
  basic: 'basic attack',
  strike: 'single-target strike',
  safe: 'strike without counter',
  ranged: 'ranged strike (reach > 2)',
  area: 'area strike',
  debuff: 'debuff',
  heal: 'heal',
  shield: 'shield',
  buff: 'buff',
  mobility: 'mobility'
};
// Jobs that are compared with one another in R2 and R4 (a safe strike is still a strike;
// what it adds is safety, which R2 credits).
export const FAMILY = {
  basic: 'strike', strike: 'strike', safe: 'strike', ranged: 'strike', area: 'strike',
  debuff: 'debuff', heal: 'heal', shield: 'shield', buff: 'buff', mobility: 'mobility'
};

// `m` is a measured profile from profile(); `basicDamage` the hero's plain basic attack at the
// same reference, used to tell a strike from a debuff that happens to deal some damage.
export function classify(art, m, opts) {
  if (!art) return { job: 'basic', why: 'the basic attack' };
  if (art.kind === 'basic') return { job: 'basic', why: 'kind basic: upgrades the basic attack' };
  const type = G.targetType(art);
  if (type === 'ground') return { job: 'mobility', why: 'targets the ground' };
  if (type === 'ally' || type === 'self') {
    const { heal, shield, buff } = m.mid;
    if (heal >= shield && heal >= buff && heal > 0) return { job: 'heal', why: 'heals ' + heal };
    if (shield >= buff && shield > 0) return { job: 'shield', why: 'shields ' + shield };
    if (buff > 0) return { job: 'buff', why: 'grants conditions worth ' + buff };
    return { job: 'buff', why: 'targets a companion' };
  }
  const plainRatio = m.mid.damage / Math.max(1, m.basicMid);
  if (m.mid.foeEffect > 0 && plainRatio < opts.DEBUFF_BELOW_BASIC)
    return {
      job: 'debuff',
      why: 'leaves ' + m.mid.foeEffects.join('/') + ' and hits for only ' + Math.round(plainRatio * 100) + '% of a basic attack'
    };
  if (m.mid.splashCount > 0) return { job: 'area', why: 'reaches ' + m.mid.splashCount + ' more foes' };
  if ((art.range ?? 1) > 2) return { job: 'ranged', why: 'reach ' + art.range };
  if (m.mid.counter === 0 && m.counterIfOpen > 0)
    return { job: 'safe', why: 'no counter where a plain strike would take one' };
  return { job: 'strike', why: 'single target, reach ' + (art.range ?? 1) };
}

// The number a job is judged by.
export function mainMeasure(job, m) {
  switch (FAMILY[job]) {
    case 'strike':
      return job === 'area' ? m.avgArea : m.avgDamage;
    case 'debuff':
      return m.mid.foeEffect;
    case 'heal':
      return m.mid.heal;
    case 'shield':
      return m.mid.shield;
    case 'buff':
      return m.mid.buff;
    case 'mobility':
      return m.reach;
  }
  return 0;
}
export const MEASURE_NAMES = {
  strike: 'damage (avg of soft and hard foe, early/mid/late)',
  area: 'damage incl. splash on two neighbours (avg)',
  debuff: 'condition power x turns on the foe',
  heal: 'health restored on a cluster of three hurt companions (mid level)',
  shield: 'shield on a cluster of three companions (mid level)',
  buff: 'condition power x turns x people (mid level)',
  mobility: 'reach in tiles'
};
export const measureName = (job) => MEASURE_NAMES[job] || MEASURE_NAMES[FAMILY[job]];

// A full profile of one art for hero `id`: plain and favourable numbers at each reference.
// refs: [{label, stage, level}]
export function profile(id, artId, refs, learnedExtra = []) {
  const foes = boardFoes();
  const isBasicNode = artId !== 'signature' && artId !== 'basic' && TECHNIQUES[artId]?.kind === 'basic';
  const out = { id: artId, points: [], conditional: null };
  let sumDmg = 0,
    sumArea = 0,
    n = 0;
  for (const ref of refs) {
    const learned = [...learnedExtra, ...(isBasicNode ? [artId] : [])];
    const u = heroAt(id, ref.level, learned);
    const art =
      artId === 'basic' || isBasicNode ? null : artId === 'signature' ? G.artFor(u, 'signature') : TECHNIQUES[artId];
    const basic = isBasicNode ? TECHNIQUES[artId] : G.basicFor(heroAt(id, ref.level));
    const board = foes[Math.min(ref.stage, foes.length - 1)];
    const soft = measure(u, art, board.soft, basic),
      hard = measure(u, art, board.boss, basic);
    const plainBasic = measure(heroAt(id, ref.level), null, board.boss, G.basicFor(heroAt(id, ref.level)));
    const row = { label: ref.label, soft: soft.plain, hard: hard.plain, basicHard: plainBasic.plain.damage };
    out.points.push(row);
    out.type = hard.type;
    out.short ||= hard.short;
    if (hard.type === 'enemy') {
      sumDmg += (soft.plain.damage + hard.plain.damage) / 2;
      sumArea += (soft.plain.area + hard.plain.area) / 2;
      n++;
      if (hard.best && hard.best.m.damage >= hard.plain.damage + 2) {
        const gain = hard.best.m.damage - hard.plain.damage;
        if (!out.conditional || gain > out.conditional.gain)
          out.conditional = { gain, label: hard.best.label, at: ref.label, damage: hard.best.m.damage };
      }
    }
  }
  const mid = out.points[Math.floor(out.points.length / 2)];
  out.mid = mid.hard;
  out.basicMid = mid.basicHard;
  out.avgDamage = n ? Math.round(sumDmg / n) : 0;
  out.avgArea = n ? Math.round(sumArea / n) : 0;
  // The counter a plain basic attack at reach 1 would take at mid level: tells "safe" apart.
  const u = heroAt(id, refs[Math.floor(refs.length / 2)].level);
  const board = foes[Math.min(refs[Math.floor(refs.length / 2)].stage, foes.length - 1)];
  out.counterIfOpen = measure(u, null, board.boss, G.basicFor(u)).plain.counter;
  out.reach = artId === 'basic' || isBasicNode ? u.range : (TECHNIQUES[artId] || G.artFor(u, 'signature')).range ?? 1;
  return out;
}

// The art object for a hero's node id, with 'signature' the starting art.
export function artOf(heroId, artId) {
  if (artId === 'signature') return G.artFor(heroAt(heroId, 1), 'signature');
  return TECHNIQUES[artId];
}

// Plain strike equivalent, priced with the framework's R9 table. Unpriced mechanics are listed.
export function strikeEquivalent(art, prices) {
  if (!art) return { value: 1, unpriced: [] };
  if (art.kind === 'basic') return { value: null, note: 'basic +' + (art.basicBonus || 0), unpriced: [] };
  const type = G.targetType(art);
  const unpriced = [];
  if (type === 'ally' || type === 'self') {
    const people = art.aura ? prices.auraPeople : 1;
    const amount = ((art.heal || 0) + (art.shield?.power || 0)) * people;
    for (const k of effectKeys(art)) if (!['shield'].includes(k)) unpriced.push(k);
    return { support: amount ? Math.round(amount) : null, unpriced };
  }
  if (type === 'ground') return { value: null, note: 'mobility', unpriced: [] };
  const hits = (art.hits || [1]).reduce((a, b) => a + b, 0);
  let v = (art.factor ?? 1.5) * hits;
  if (art.safe) v += prices.safe;
  if (art.pierce) v += (prices.pierceHalf * art.pierce) / 0.5;
  if ((art.range ?? 1) > 2) v += prices.reachTile * ((art.range ?? 1) - 2);
  if (art.splash) v += (prices.splash * art.splash) / 0.5;
  if (art.push) v += prices.push;
  if (art.debuff) v += (prices.debuffTwoTurns * (art.debuff.turns || 2)) / 2;
  if (art.poison) v += (prices.debuffTwoTurns * (art.poison.turns || 2)) / 2;
  if (art.hpCost) v -= prices.hpCost;
  for (const k of effectKeys(art))
    if (!['safe', 'splash', 'push', 'debuff:atk', 'debuff:def', 'poison'].includes(k) && !k.startsWith('form:'))
      unpriced.push(k);
  for (const k of costKeys(art)) if (k !== 'hpCost') unpriced.push(k);
  return { value: Math.round(v * 100) / 100, unpriced };
}

export function heroTree(id) {
  const path = HERO_PATHS[id];
  const ids = [];
  path.layout.forEach((row) => row.forEach((cell) => cell && ids.push(cell)));
  return ids;
}
// Every id reached by following `needs` upward from artId ('signature' included, talents not).
export function ancestors(artId) {
  const out = new Set(),
    stack = [...(TECHNIQUES[artId]?.needs || [])];
  while (stack.length) {
    const p = stack.pop();
    if (out.has(p) || G.TALENTS[p]) continue;
    out.add(p);
    if (p !== 'signature') stack.push(...(TECHNIQUES[p]?.needs || []));
  }
  return out;
}
