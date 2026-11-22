// 群俠比較: every hero scored on seven aspects, at level 12 with the whole tree learned (the
// radar) and level by level as a run buys it (the growth curve).
//
// No value is typed in here. Each hero is built as the game builds him (startingHero,
// raiseLevel), learns his arts in the order tools/sim-battles.mjs buys them, and is measured
// with the rules' own forecast, damage, stat, artCost and healingPower against a foe made from
// the tenth board's numbers, so a rebalance in game/src/ moves every score. What is this page's
// own is the weighing: how much a shield is worth beside a blow, which constants are named below.
import * as G from '../game-data.js';
import { heroPortrait } from './heroes.js';

export const LEVELS = Array.from({ length: 12 }, (_, i) => i + 1);
const TOP = LEVELS.at(-1);

const AXES = [
  { key: 'melee', name: '近身攻擊', hint: '貼身出手的傷害：最強兩招（普攻也算）加還擊；射程兩格以上的招式貼身使用只算一半。' },
  { key: 'ranged', name: '遠程攻擊', hint: '兩格以外出手的傷害，射程越遠越高；濺射波及兩格以外的餘勁也算。' },
  { key: 'vitality', name: '氣血防禦', hint: '倒下前挨得住幾擊，再加護盾、固守、卸勁、金剛、自療、吸血與代受。' },
  { key: 'inner', name: '內力回氣', hint: '八回合內，內力上限加每回合回氣，夠施展幾次最耗內力的三招；凝氣、回氣與領隊減耗都算。' },
  { key: 'speed', name: '身法速度', hint: '移動步數，加輕身、越障身法與出招後回身。' },
  { key: 'support', name: '輔助同伴', hint: '替同伴療傷、護盾、振奮、輕身、固守、代受、號令，與壓制敵人；領隊陣法按三分之一計。' },
  { key: 'burst', name: '爆發閃避', hint: '暫代暴擊與閃避：條件全成立時的最高一擊，與閃身、金剛、免受還擊等避招之效，各佔一半。' }
];
const KEYS = AXES.map((a) => a.key);

// ── The page's weights (judgement, not game values) ─────────────────────────
const LEAD = 1 / 3; // a company of three has one leader: a boon counts for a third
const ROUNDS = 8; // about the length of a late board
const TAKEN = 1.5; // direct blows a hero takes in an enemy phase, for guards that last a phase
// How often a conditional bonus holds, as tools/lib/skill-measure.mjs CONDITIONAL counts it.
const SHARE = { answer: 0.5, lone: 0.6, paired: 0.7, dire: 0.4, avenge: 0.7, execute: 0.5, surge: 0 };
const FAR_UP_CLOSE = 0.5; // a long-reach art used on a neighbour: built for distance
const CROWD = (radius) => 0.5 + 0.5 * radius; // foes a splash finds: one beside the target, half more per ring
const RIDER = 0.15; // 穿行 and 走勁: a second foe is in line some of the time
const COUNTER_SHARE = 0.3; // counters a hero gives, beside the blows he chooses
const CONTROL = 0.8; // holding a foe helps companions less surely than mending them
const AURA = 0.75; // companions an aura finds, per tile of it
const STEP_WORTH = 0.15; // one step for one companion, in blows
const AGAIN = 0.3; // 連環: the kill that buys another action
const TWO = [0.65, 0.35],
  THREE = [1, 0.7, 0.5];
// Axes made of two halves, each scaled to its own best before they are added.
const HALVES = { ranged: ['damage', 'reach'], burst: ['spike', 'evasion'] };

// Availability: how much of the time an art can be the one used.
function uptime(art) {
  if (!art) return 1;
  let n = art.once ? 0.35 : art.cooldown ? 1 / (1 + art.cooldown / 2) : 1;
  if (art.poised) n *= 0.6;
  if (art.spent) n *= 0.75;
  if (art.backlash) n *= 0.85;
  return n;
}
const blend = (values, weights) =>
  [...values].sort((a, b) => b - a).slice(0, weights.length).reduce((n, v, i) => n + v * weights[i], 0);
const best = (list, f) => list.reduce((top, x) => (!top || f(x) > f(top) ? x : top), null);
const r1 = (n) => Math.round(n * 10) / 10;

// ── The scene: three open tiles on the first board, A beside B and C ─────────
const open = (x, y) => G.tileInfo(x, y, 0)?.defense === 0 && G.walkable(x, y, 0);
const [A, B, C] = (() => {
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++)
      if (open(x, y) && open(x + 1, y) && open(x, y + 1))
        return [{ x, y }, { x: x + 1, y }, { x, y: y + 1 }];
})();
// The foe: the mean of the tenth board's four fixed pieces, fighting at reach 1. He wears a
// troop type's details so the rules read him as an ordinary piece (no traits of his own).
const DEPTH = 9;
const FOE = (() => {
  const rows = G.stageRows(1, DEPTH),
    mean = (i) => Math.round(G.SLOTS.reduce((n, slot) => n + rows[slot][i], 0) / G.SLOTS.length);
  return G.makeUnit('blade', 'enemy', B.x, B.y, mean(0), 0, mean(1), mean(2), mean(3), 1);
})();
// A board master, for 破招 aimed at 局主.
const MASTER = Object.keys(G.DETAILS).find((k) => G.DETAILS[k].rank === 'boss' && !G.DETAILS[k].traits?.formless && !G.DETAILS[k].traits?.twin);
const companion = (id, partner) => ({ ...G.startingHero(partner ? G.PARTNERS[id] || G.ROSTER.find((v) => v !== id) : G.ROSTER.find((v) => v !== id)), x: C.x, y: C.y });

function scene(u, foe, lead, friend = null) {
  const s = { units: [u, foe], mapIndex: 0, round: 3, logs: [] };
  if (friend) s.units.push(friend);
  if (lead) Object.assign(s, { run: { status: 'battle', legacyBoard: true }, leader: u.id });
  return s;
}
// What the game adds each ally round, read off nextRound itself.
const REGEN = (() => {
  const u = { ...G.startingHero(G.ROSTER[0]), x: A.x, y: A.y, mp: 0 },
    s = { units: [u, { ...FOE, acted: true }], mapIndex: 0, round: 1, phase: 'enemy', logs: [], stats: {} };
  G.nextRound(s);
  return u.mp;
})();

function build(id, level, learned, talents) {
  const u = G.startingHero(id);
  G.raiseLevel(u, level - 1);
  return { ...u, learned: [...learned], talents: { ...talents }, x: A.x, y: A.y };
}

// ── One blow, with an art's conditions met or not ─────────────────────────────
// `held` names the conditional bonuses (SHARE) that hold; the scene is laid out so the rules
// themselves decide them, as skill-measure.mjs does.
function setUp(u0, art, held, lead, partner) {
  const u = { ...u0 },
    t = { ...FOE };
  const friend = art?.paired ? held.has('paired') : art?.lone ? !held.has('lone') : false;
  const s = scene(u, t, lead, friend ? companion(u.id, partner) : null);
  const kind = art?.answer;
  if (kind) {
    const yes = held.has('answer');
    if (kind === 'close') t.range = yes ? 1 : 2;
    else if (kind === 'ranged') t.range = yes ? 2 : 1;
    else if (kind === 'master') t.encounterId = yes ? MASTER : undefined;
    else t.arm = yes ? kind : null;
  }
  if (art?.dire && held.has('dire')) u.hp = Math.floor(u.maxHp / 4) + (art.hpCost || 0);
  if (art?.avenge && held.has('avenge')) u.hurtRound = s.round - 1;
  if (held.has('execute')) t.hp = Math.floor(t.maxHp / 2);
  if (art?.surge) u.mp = held.has('surge') ? u.maxMp : G.artCost(s, u, art);
  return { u, t, s };
}
function raw(u0, art, held, lead, partner = false) {
  const { u, t, s } = setUp(u0, art, held, lead, partner);
  const one = G.damage(u, t, !!art, 0, s, art, G.basicFor(u));
  return (art?.hits || [1]).reduce((n, part) => n + Math.round(one * part), 0);
}
// A strike's expected and peak damage. The forecast gives the plain case (its riders, the
// counter it draws and what it heals); each condition adds what the damage rule says it adds.
function strike(u, art, lead) {
  const keys = Object.keys(SHARE).filter((k) => art?.[k]);
  // 雪野追鋒 and its like: a foe below half is as often met as 斬殘's.
  if (lead && G.COMMANDS[u.id].stat === 'pursuit' && !keys.includes('execute')) keys.push('execute');
  const none = new Set(),
    { u: a, t, s } = setUp(u, art, none, lead);
  const f = G.forecast(a, t, !!art, s, art, G.basicFor(a));
  // 吸元 and 回生 heal only what is missing: read them from a hero at half 氣血.
  let selfHeal = 0;
  if (G.drainOf(art) || G.formsFor(a, art).includes('leech')) {
    const hurt = setUp(u, art, none, lead);
    hurt.u.hp = Math.ceil(hurt.u.maxHp / 2);
    selfHeal = G.forecast(hurt.u, hurt.t, !!art, hurt.s, art, G.basicFor(hurt.u)).selfHeal;
  }
  const poison = art?.poison ? art.poison.power * art.poison.turns : 0;
  const plain = raw(u, art, none, lead);
  const E = f.amount + poison + keys.reduce((n, k) => n + SHARE[k] * (raw(u, art, new Set([k]), lead) - plain), 0);
  const peak = f.amount + poison + raw(u, art, new Set(keys), lead, true) - plain;
  return { E, peak, counter: f.counter, selfHeal };
}

// ── A hero measured: every axis in its own units ──────────────────────────────
function measure(id, level, learned, talents, lead, unit) {
  const u = build(id, level, learned, talents),
    foe = { ...FOE },
    s = scene(u, foe, lead);
  const basic = G.basicFor(u);
  const known = ['signature', ...learned.filter((k) => G.TECHNIQUES[k]?.kind !== 'basic')].map((k) => ({ id: k, art: G.artFor(u, k) }));
  const type = (art) => G.targetType(art);
  const selfward = (art) => ['self', 'ally'].includes(type(art));
  const I = G.damage(foe, u, false, 0, s); // a blow the foe lands on him
  // A condition worn for one reading (on the piece itself, so a leader's boon still reaches it).
  const wearing = (v, cond, f) => {
    v.conditions = cond;
    const n = f();
    delete v.conditions;
    return n;
  };
  const guarded = (cond) => I - wearing(u, cond, () => G.damage(foe, u, false, 0, s));
  const weaker = (cond) => wearing(foe, cond, () => G.damage(u, foe, false, 0, s)) - G.damage(u, foe, false, 0, s);

  // Attacks: the basic attack and every art aimed at a foe.
  const attacks = [{ name: basic.name, art: null, range: u.range }, ...known.filter((k) => type(k.art) === 'enemy').map((k) => ({ name: k.art.name, art: k.art, range: k.art.range }))].map((a) => {
    const hit = strike(u, a.art, lead),
      radius = G.splashRadius(a.art),
      forms = G.formsFor(u, a.art, basic),
      area = (a.art?.splash ? hit.E * a.art.splash * CROWD(radius) : 0) + (forms.some((f) => f === 'line' || f === 'arc') ? hit.E * RIDER : 0),
      up = uptime(a.art);
    return {
      ...a,
      ...hit,
      forms,
      melee: (a.range <= 1 ? hit.E + (radius <= 1 ? area : 0) : hit.E * FAR_UP_CLOSE) * up,
      // Each tile of reach beyond one is worth less than the one before (2 → ×1, 3 → ×1.41, 5 → ×2).
      ranged: (a.range >= 2 ? hit.E * Math.sqrt(a.range - 1) + area : radius >= 2 ? area : 0) * up
    };
  });
  const plainBasic = attacks[0];
  const counter = G.damage(u, foe, false, 0, s) * G.counterRatio(s, u);

  // 近身攻擊 and 遠程攻擊
  const melee = blend(attacks.map((a) => a.melee), TWO) + COUNTER_SHARE * counter;
  // 遠程攻擊: what strikes from afar do, and how far he can strike at all (his basic reach and
  // his longest attack's).
  const ranged = {
    damage: blend(attacks.map((a) => a.ranged), TWO),
    reach: u.range + Math.max(...attacks.map((a) => a.range + (G.splashRadius(a.art) > 1 && a.art.splash ? G.splashRadius(a.art) - 1 : 0)))
  };

  // 氣血防禦: blows he can take, and what his arts add to that, in blows.
  const guard = (k) => {
    const art = k.art,
      mine = selfward(art) || !G.isSupport(art);
    let n = 0;
    if (selfward(art) && art.shield) n += art.shield.power / I;
    // A heal spent on himself is not spent on a companion, and mends only what is missing.
    if (selfward(art) && art.heal) n += ((type(art) === 'self' ? 0.8 : 0.4) * G.healingPower(u, s, art)) / I;
    if (mine && art.fortify) n += (guarded({ fortify: { power: art.fortify.power } }) * TAKEN * (art.fortify.turns || 1)) / I;
    if (mine && art.immune) n += TAKEN * (art.immune.turns || 1);
    if (art.stance) n += (TAKEN * art.stance) / 100;
    if (type(art) === 'ally' && art.redirect) n += 0.5;
    if (art.cover) n += 0.3;
    const a = attacks.find((x) => x.art === art);
    if (a?.selfHeal) n += a.selfHeal / I;
    return n * uptime(art);
  };
  const renew = (G.commandBonus(s, u, 'renew') * ROUNDS) / 2 / I;
  const vitality = u.maxHp / I + blend(known.map(guard), [1, 0.5]) + renew;

  // 內力回氣: casts of his three costliest arts that the pool and the rounds' regen pay for.
  const costs = known.map((k) => Math.max(1, G.artCost(s, u, k.art) - (k.art.recover || 0))).sort((a, b) => b - a).slice(0, 3);
  const cost = costs.reduce((a, b) => a + b, 0) / costs.length;
  const regen = REGEN + G.commandBonus(s, u, 'restoreMp');
  const inner = (u.maxMp + (ROUNDS - 1) * regen) / cost;

  // 身法速度
  const step = G.stat(u, 'step', s);
  const mobility = known.map((k) => {
    const art = k.art;
    let n = 0;
    if (selfward(art) && art.haste) n += (art.haste.power * Math.min(3, art.haste.turns || 1)) / 3 * 0.8;
    if (art.blink) n += 0.3 * art.range;
    return n * uptime(art);
  });
  if (attacks.some((a) => a.forms.includes('glide'))) mobility.push(0.8);
  const speed = step + blend(mobility, [1, 0.5]);

  // 輔助同伴, in blows' worth for companions.
  const BLOW = unit.blow;
  const help = (k) => {
    const art = k.art,
      forms = G.formsFor(u, art, basic),
      t = type(art),
      n = t === 'ally' ? 1 + AURA * (art.aura || 0) : t === 'self' ? AURA * (art.aura || 0) : 0;
    let v = 0,
      hold = 0;
    if (n) {
      if (art.heal) v += (0.8 * G.healingPower(u, s, art) * n) / BLOW;
      if (art.shield) v += (art.shield.power * n) / BLOW;
      if (art.rally) v += (art.rally.power * Math.min(3, art.rally.turns) * n * 1.3) / BLOW;
      if (art.haste) v += ((art.haste.power * Math.min(3, art.haste.turns)) / 3) * n * STEP_WORTH * 3;
      if (art.fortify) v += (guarded({ fortify: { power: art.fortify.power } }) * TAKEN * art.fortify.turns * n) / I;
      if (art.immune) v += TAKEN * art.immune.turns * n;
      if (art.redirect) v += 0.5 * n;
      if (art.order) v += 1.5;
      if (forms.includes('cleanse')) v += 0.3;
      if (forms.includes('channel')) v += 0.3 * n;
      if (forms.includes('riposte')) v += 0.2 * n;
      if (forms.includes('overflow')) v += 0.15;
    }
    if (art.cover) v += 1;
    if (art.taunt) v += 0.8;
    if (forms.includes('landing')) v += 0.3;
    // Holding foes back: fewer and weaker blows at his companions.
    if (art.freeze) hold += art.freeze.turns || 1;
    if (art.mute) hold += 0.9 * (art.mute.turns || 1);
    if (art.charm) hold += 1.5 * (art.charm.turns || 1);
    if (art.daze) hold += art.daze === true ? 1 : 0.5;
    if (art.debuff?.stat === 'atk') hold += (art.debuff.power * art.debuff.turns) / BLOW;
    if (art.debuff?.stat === 'def') hold += (weaker({ exposed: { power: art.debuff.power } }) * TAKEN * art.debuff.turns) / BLOW;
    if (art.wound) hold += (art.wound.power * art.wound.turns) / BLOW;
    if (art.disarm) hold += (art.disarm.power * art.disarm.turns) / BLOW + 0.3;
    if (art.zone) hold += 0.6;
    if (forms.includes('seal')) hold += 0.3;
    if (forms.includes('pin')) hold += 0.15;
    if (forms.includes('mark')) hold += 0.1;
    return (v + CONTROL * hold) * uptime(art);
  };
  const support = blend(known.map(help), THREE);

  // 爆發閃避: the highest blow, and blows made to miss.
  const top = best(attacks, (a) => a.peak * (a.forms.includes('again') ? 1 + AGAIN : 1));
  const spike = top.peak * (top.forms.includes('again') ? 1 + AGAIN : 1) + 0.5 * Math.max(0, ...attacks.map((a) => a.peak - a.E));
  const dodge = (k) => {
    const art = k.art;
    let n = 0;
    if (art.evade) n += 1;
    if ((selfward(art) || !G.isSupport(art)) && art.immune) n += TAKEN * (art.immune.turns || 1);
    if (type(art) === 'ally' && art.redirect) n += 0.5;
    if (art.blink) n += 0.3;
    const a = attacks.find((x) => x.art === art);
    if (a) n += Math.max(0, plainBasic.counter - a.counter) / I;
    return n * uptime(art);
  };
  const evasion = blend(known.map(dodge), THREE);

  const bestAttack = best(attacks, (a) => a.E);
  const healer = best(known.filter((k) => selfward(k.art) && k.art.heal), (k) => G.healingPower(u, s, k.art));
  return {
    u,
    s,
    I,
    step,
    regen,
    cost,
    counter,
    attacks,
    bestE: bestAttack.E,
    basicE: plainBasic.E,
    heal: healer ? G.healingPower(u, s, healer.art) : 0,
    axes: { melee, ranged, vitality, inner, speed, support, burst: { spike, evasion } },
    parts: { known, attacks, guard, help, dodge, mobility, top, spike, evasion, renew }
  };
}

// The leader boon, for a companion: what it adds to this hero's own numbers, as a proxy for
// what it adds to each of the two others, in blows' worth.
function boonWorth(plain, lead, unit) {
  const BLOW = unit.blow;
  return (
    (lead.bestE - plain.bestE + 0.5 * (lead.basicE - plain.basicE) + 0.5 * (lead.counter - plain.counter) + 0.5 * (lead.heal - plain.heal)) / BLOW +
    ((plain.I - lead.I) * TAKEN) / BLOW +
    (lead.step - plain.step) * STEP_WORTH +
    ((lead.regen - plain.regen + 0.6 * (plain.cost - lead.cost)) * unit.mpWorth) / BLOW +
    G.commandBonus(lead.s, lead.u, 'renew') / BLOW
  );
}

// Both ways of fighting, blended: led by someone else, and leading.
function profile(id, level, learned, talents, unit) {
  const plain = measure(id, level, learned, talents, false, unit),
    led = measure(id, level, learned, talents, true, unit);
  const mix = (a, b) => (1 - LEAD) * a + LEAD * b;
  const axes = {};
  for (const k of KEYS)
    axes[k] = HALVES[k] ? Object.fromEntries(HALVES[k].map((h) => [h, mix(plain.axes[k][h], led.axes[k][h])])) : mix(plain.axes[k], led.axes[k]);
  axes.support += LEAD * 2 * boonWorth(plain, led, unit);
  return { plain, led, axes };
}

// ── What a run buys, level by level (tools/sim-battles.mjs spendPoints, trials taken as met) ─
const treeOf = (id) => G.HERO_PATHS[id].layout.flat().filter(Boolean);
function ancestors(art) {
  const out = new Set(),
    stack = [...(G.TECHNIQUES[art]?.needs || [])];
  while (stack.length) {
    const p = stack.pop();
    if (out.has(p) || G.TALENTS[p] || p === 'signature') continue;
    out.add(p);
    stack.push(...(G.TECHNIQUES[p]?.needs || []));
  }
  return out;
}
const supportLean = (id) => G.isSupport(G.artFor(G.startingHero(id), 'signature'));
function train(id, talents) {
  const prefs = supportLean(id) ? ['breath', 'guard', 'force'] : ['force', 'guard', 'breath'];
  const k = [...prefs].sort((a, b) => talents[a] - talents[b] || prefs.indexOf(a) - prefs.indexOf(b))[0];
  if (talents[k] >= 3) return false;
  talents[k]++;
  return true;
}
function purchases(id) {
  const tree = treeOf(id),
    summit = G.HERO_PATHS[id].layout.at(-1).find(Boolean),
    toward = new Set([summit, ...ancestors(summit)]),
    T = G.TECHNIQUES;
  const order = (a, b) => T[a].points - T[b].points || T[a].tier - T[b].tier || tree.indexOf(a) - tree.indexOf(b);
  const learned = [],
    talents = { force: 0, guard: 0, breath: 0 },
    at = {},
    steps = [];
  let sp = 0;
  const ready = (k) => T[k].needs.every((p) => p === 'signature' || (G.TALENTS[p] ? talents[p] > 0 : learned.includes(p)));
  for (const level of LEVELS) {
    sp++;
    for (let guard = 0; guard < 30 && sp > 0; guard++) {
      const open = tree.filter((k) => !learned.includes(k) && ready(k));
      const pick = (list) => list.filter((k) => sp >= T[k].points).sort(order)[0];
      const next = pick(open.filter((k) => toward.has(k))) || (!open.some((k) => toward.has(k)) && pick(open));
      if (next) {
        learned.push(next);
        sp -= T[next].points;
        at[next] = level;
        continue;
      }
      if (open.some((k) => toward.has(k)) || !train(id, talents)) break;
      sp--;
    }
    steps.push({ level, points: level, learned: [...learned], talents: { ...talents } });
  }
  return { steps, at };
}
// The radar: the whole tree known at the top level; points left over go where the run puts them.
function summitSet(id) {
  const tree = treeOf(id),
    talents = { force: 0, guard: 0, breath: 0 };
  let spare = TOP - tree.reduce((n, k) => n + G.TECHNIQUES[k].points, 0);
  while (spare-- > 0 && train(id, talents));
  return { learned: tree, talents };
}

// ── Why-lines for the tooltips ───────────────────────────────────────────────
const n0 = (n) => String(Math.round(n));
function reasons(p, axes) {
  const { u, parts, I } = p;
  const name = (k) => k.art.name;
  const topBy = (list, f) => [...list].filter((x) => f(x) > 0).sort((a, b) => f(b) - f(a));
  const atk = (key) => topBy(parts.attacks, (a) => a[key]).slice(0, 2).map((a) => a.name + ' 約 ' + n0(a.E));
  const by = (f) => topBy(parts.known, f).slice(0, 2).map(name);
  return {
    melee: [...atk('melee'), '還擊 約 ' + n0(p.counter)].slice(0, 3),
    ranged: [...(atk('ranged').length ? atk('ranged') : ['沒有兩格以外的攻擊']), '最遠 ' + (p.axes.ranged.reach - u.range) + ' 格，普攻 ' + u.range + ' 格'],
    vitality: ['氣血 ' + u.maxHp + '、防禦 ' + G.stat(u, 'def', p.s), '約挨得住 ' + r1(u.maxHp / I) + ' 擊', ...by(parts.guard).map((n) => '另有' + n)].slice(0, 3),
    inner: ['內力 ' + u.maxMp + '，每回合回 ' + p.regen, '三招平均耗 ' + r1(p.cost), '八回合約施展 ' + r1(axes.inner) + ' 次'],
    speed: ['移動 ' + p.step + ' 步', ...by((k) => (k.art.haste && ['self', 'ally'].includes(G.targetType(k.art))) || k.art.blink ? 1 : 0), ...(parts.attacks.some((a) => a.forms.includes('glide')) ? ['出招後可回身'] : [])].slice(0, 3),
    support: by(parts.help).length ? by(parts.help) : ['沒有助人的招式'],
    burst: [parts.top.name + ' 最高 ' + n0(parts.top.peak), ...by(parts.dodge).map((n) => n + '可避招')].slice(0, 3)
  };
}

// ── The arts at the top level ────────────────────────────────────────────────
// The kinds as 武學總譜 (catalog/skills.js) labels them.
const KIND_NAMES = { basic: '基礎普攻', signature: '入門武學', upgrade: '普攻精進', active: '新招', refinement: '成名絕技' };
function artList(id, unit, at) {
  const d = G.DETAILS[id],
    state = { units: [unit], mapIndex: 0, round: 1 },
    bare = { ...unit, learned: unit.learned.filter((k) => G.TECHNIQUES[k]?.kind !== 'basic') },
    facts = (u, k) => G.moveFacts({ ...state, units: [u] }, u, k);
  const entry = (link, name, family, tier, kind, f, desc, learnedAt) => ({
    id: link,
    name,
    family,
    tier,
    kind,
    kindName: KIND_NAMES[kind],
    mp: f.mp,
    range: f.range,
    power: f.powerLabel + ' ' + f.powerText,
    desc,
    learnedAt
  });
  const tree = treeOf(id)
    .map((k, i) => [k, i])
    .sort(([a, i], [b, j]) => G.TECHNIQUES[a].tier - G.TECHNIQUES[b].tier || i - j)
    .map(([k]) => {
      const art = G.TECHNIQUES[k],
        kind = art.kind === 'basic' ? 'upgrade' : art.kind === 'refinement' ? 'refinement' : 'active';
      return entry(k, art.name, art.family || '', art.tier, kind, facts(unit, k), art.desc, at[k] ?? null);
    });
  return [
    entry('basic-' + id, d.basic, '', 0, 'basic', facts(bare, 'basic'), facts(bare, 'basic').shortEffect, 1),
    entry('signature-' + id, d.skill, '', 0, 'signature', facts(unit, 'signature'), d.skillDesc, 1),
    ...tree
  ];
}

// ── The whole comparison ─────────────────────────────────────────────────────
const NOTES = [
  '雷達圖：等級 12，本門武學樹全數學成，餘下的武學點照模擬的買法修習根基。',
  '成長曲線：每升一級多一點武學點，照模擬的買法（先買通往成名絕技最便宜的一招，買不到時修習根基）逐級學起，歷練門檻當作已過。',
  '每一項以等級 12 時全體俠客中最高者為 100；成長曲線用同一把尺，所以前期分數較低。綜合分是七項的平均。',
  '傷害、承傷、療傷與內力消耗都照遊戲本身的算式，對手取第十局四名守將的平均（氣血 ' + FOE.maxHp + '、攻擊 ' + FOE.atk + '、防禦 ' + FOE.def + '），站在無地形加成的平地上。',
  '破招、孤行、合璧、黯然、還報、斬殘這些條件加成，在近身與遠程兩項按成立的機會折算，在爆發一項按全部成立計。',
  '遊戲目前沒有暴擊與閃避的擲骰，一招打多少是定數；「爆發閃避」暫以最高一擊與閃身、金剛、免受還擊等避招之效代算，日後加入暴擊與閃避再改。',
  '領隊陣法只有一人能用，按三分之一計入本人各項，並計入「輔助同伴」。',
  '不計購得的裝備與丹藥，只有入局時手上的兵器；後來加入的十位俠客入局時尚無兵器（仍待定奪），攻擊一項因此略低。'
];

function compute() {
  // Two numbers every hero is weighed by: a blow the foe lands on an ordinary hero at the top
  // level, and what a point of 內力 buys over a basic attack there.
  const bare = G.ROSTER.map((id) => {
    const { learned, talents } = summitSet(id);
    return measure(id, TOP, learned, talents, false, { blow: 1, mpWorth: 0 });
  });
  const mean = (f) => bare.reduce((n, p) => n + f(p), 0) / bare.length;
  const unit = {
    blow: mean((p) => p.I),
    mpWorth: mean((p) => {
      const arts = p.attacks.filter((a) => a.art);
      const top = best(arts, (a) => a.E);
      return top ? Math.max(0, top.E - p.basicE) / Math.max(2, G.artCost(p.s, p.u, top.art)) : 0;
    })
  };
  const rows = G.ROSTER.map((id) => {
    const top = summitSet(id),
      radar = profile(id, TOP, top.learned, top.talents, unit),
      buy = purchases(id);
    return { id, top, radar, buy, curve: buy.steps.map((step) => ({ step, p: profile(id, step.level, step.learned, step.talents, unit) })) };
  });
  // The scale: the best hero at the radar's point on each axis (a two-half axis's halves each first).
  const half = Object.fromEntries(Object.entries(HALVES).map(([k, parts]) => [k, Object.fromEntries(parts.map((h) => [h, Math.max(...rows.map((r) => r.radar.axes[k][h]))]))]));
  const flat = (axes) => {
    const out = { ...axes };
    for (const [k, parts] of Object.entries(HALVES)) out[k] = parts.reduce((n, h) => n + (50 * axes[k][h]) / half[k][h], 0);
    return out;
  };
  const scale = Object.fromEntries(KEYS.map((k) => [k, Math.max(...rows.map((r) => flat(r.radar.axes)[k]))]));
  const score = (axes) => {
    const f = flat(axes);
    return Object.fromEntries(KEYS.map((k) => [k, Math.max(0, Math.min(100, Math.round((100 * f[k]) / scale[k])))]));
  };
  const composite = (scores) => Math.round(KEYS.reduce((n, k) => n + scores[k], 0) / KEYS.length);

  return {
    axes: AXES.map((a) => ({ ...a })),
    levels: LEVELS,
    notes: NOTES,
    heroes: rows.map(({ id, top, radar, buy, curve }) => {
      const d = G.DETAILS[id],
        p = radar.plain,
        u = p.u,
        scores = score(radar.axes),
        why = reasons(p, radar.axes),
        f = flat(radar.axes);
      return {
        id,
        name: d.name,
        school: d.school,
        epithet: d.epithet,
        portrait: heroPortrait(id),
        stats: { hp: u.maxHp, mp: u.maxMp, atk: G.stat(u, 'atk', p.s), def: G.stat(u, 'def', p.s), step: G.stat(u, 'step', p.s), range: u.range },
        scores,
        raw: Object.fromEntries(KEYS.map((k) => [k, { value: r1(f[k]), why: why[k] }])),
        composite: composite(scores),
        curve: curve.map(({ step, p: c }) => {
          const s = score(c.axes);
          return { level: step.level, points: step.points, composite: composite(s), scores: s };
        }),
        arts: artList(id, { ...u, learned: top.learned, talents: top.talents }, buy.at)
      };
    })
  };
}

let cached = null;
export function compareData() {
  return (cached ??= compute());
}
export { measure as _measure, summitSet as _summitSet };
