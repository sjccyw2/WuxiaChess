// A headless player that fights the real boards with the real rules and the real enemy code,
// so the game's difficulty can be compared before and after a change.
//
//   node tools/sim-battles.mjs [--runs N] [--seed S] [--boards A-B] [--realm 1-5] [--json out.json]
//                              [--trace | --trace-map M] [--arts]
//   node tools/sim-battles.mjs --compare before.json after.json
//
// Runs are built the way the game builds them (draw three heroes, start the run, deploy, settle
// a won board, take the reward, visit the shop, move on), so recruits join, levels accumulate and
// points are spent as in play. The hero side is a fixed, simple player: it asks the rules what
// it may do, scores every legal option with the rules' own `forecast`, and takes the best. It
// knows nothing about particular arts; it reads what forecast says an option will do.
import fs from 'node:fs';
import { G, R, TECHNIQUES, HERO_PATHS, profile, classify, mainMeasure, FAMILY, heroTree, ancestors } from './lib/skill-measure.mjs';
const FM = await import(new URL('../game/src/rules/ferry-market.js', import.meta.url));
const { mapLayout, fieldCells, tileInfo, MAP_LAYOUTS } = await import(new URL('../game/src/data/terrain.js', import.meta.url));

// ── Policy weights: the player's whole character in one place ─────────────
const W = {
  bossDamage: 1.4, // a point of damage on the board's master, relative to any other foe
  speedBoss: 1.4, // extra multiplier on the master when the board is won by speed
  escort: 1.5, // a foe whose death the rules say weakens the master (G.wardEscorts)
  killBase: 30, // felling a foe, plus its attack (what it would have done next turn)
  win: 1e6,
  mp: 0.5, // per point of 內力 spent
  hpCost: 0.8, // per point of the hero's own health spent
  counter: 1.0, // per point of counter damage taken (leader: x leaderCare)
  leaderCare: 2.2,
  danger: 0.8, // per point of expected damage where the hero ends the turn
  lethal: 140, // ending where the threat could fell the hero (plus half their max health)
  leaderLethal: 20000, // ...the leader (losing the leader loses the run)
  cover: 1.5, // per point of terrain defence at the end tile
  approach: 2.4, // per tile still to walk to strike the master (grows with the round)
  leaderApproach: 0.9,
  objective: 7, // per tile the designated runner still has to walk to the board's marker
  onObjective: 160,
  guardLeader: 6, // a companion ending beside a threatened leader
  heal: 1.0, // per point healed, times urgency
  shieldAgainstThreat: 0.9, // per point of shield that will be tested
  shieldIdle: 0.15,
  channelMp: 0.4,
  cleanse: 6,
  foeEffect: { seal: 8, mark: 3, weak: 1.5, exposed: 1.2 }, // per power x turns; others default
  breakCharge: 40, // spending a foe's charged reaction (a mirror) with a blow it turns back
  delaySignature: 6, // putting a foe's signature back a round
  foeEffectDefault: 1.2,
  allyEffect: { rally: 1.2, haste: 3 },
  allyEffectDefault: 0.8,
  // 失神, 定身, 閉穴, 受制: per point of the blow the held foe would have struck, per turn it is held
  // beyond what already holds it (a 閉穴 foe still walks, so a little less); a 受制 one also strikes
  // its own side, for this share of its blow. Its first turn on the striker himself is in his
  // place score instead (the danger where he ends leaves the held foe out).
  hold: { freeze: 1.0, daze: 1.0, charm: 1.0, mute: 0.85 },
  holdIdle: 0.4, // ...of the blow it could strike on someone, when it has no hero in reach now
  turncoat: 0.6,
  // 金剛 and 固守 on whoever a support art reaches: per point of the next enemy phase's expected
  // damage voided (金剛) or taken off by the 防禦 (固守); later turns count at holdLater.
  immune: 1.0,
  fortify: 0.9,
  holdLater: 0.5,
  equipHold: 0.5, // choosing arts: a turn a foe is held, in basic attacks (W.hold weights the kinds)
  medicineAt: 0.4, // drink medicine below this fraction of health (leader: + 0.15)
  // 守: the object the heroes keep
  keepThreat: 1.7, // a point of damage on a foe that could strike the kept object next turn
  keepNear: 5, // per tile a hero stands beyond two of the kept object (the leader: half)
  keepBlock: 10, // a hero standing on a tile beside the kept object
  // Spending between boards
  reserveSummitUntilStage: 7
};
const COMPARE_FLAG = 0.1; // flag a board whose win rate moves by more than this

// ── Arguments ───────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const COMPARING = args.includes('--compare');
const RUNS = Number(opt('--runs', 100));
const SEED = Number(opt('--seed', 1));
const [FIRST, LAST] = String(opt('--boards', '1-10')).split('-').map(Number).concat([NaN]).map((v, i, a) => (i === 1 && Number.isNaN(v) ? a[0] : v));
const JSON_OUT = opt('--json', null);
// --realm N plays every run in the Nth 境界 (data/realms.js), as if it were open.
const REALM = Math.min(5, Math.max(1, Number(opt('--realm', 1)) || 1));
const QUIET = args.includes('--quiet');
// --arts also prints, per art, the boards it was equipped on and how often it was used there.
const ARTS = args.includes('--arts');
// --trace prints the battle log of the first run, board by board, to see how the player plays.
const TRACE = args.includes('--trace');
// --trace-map M prints the battle log of the first board fought on map M, in whichever run.
const TRACE_MAP = opt('--trace-map', null) == null ? null : Number(opt('--trace-map'));
const traced = new Set();

const hash = (a, b) => {
  let n = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b + 0x632be5ab, 0xc2b2ae35);
  n = Math.imul(n ^ (n >>> 15), 0x2c1b3c6d);
  return (n ^ (n >>> 12)) >>> 0;
};
const key = (x, y) => x + ',' + y;
const unkey = (k) => {
  const [x, y] = k.split(',').map(Number);
  return { x, y };
};

// ── Map distances (terrain costs, units ignored) ───────────────────────────
function distanceField(map, from) {
  const cost = new Map([[key(from.x, from.y), 0]]),
    queue = [{ ...from, n: 0 }];
  while (queue.length) {
    queue.sort((a, b) => a.n - b.n);
    const p = queue.shift();
    if (p.n !== cost.get(key(p.x, p.y))) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = p.x + dx,
        y = p.y + dy,
        t = tileInfo(x, y, map);
      if (!t || !Number.isFinite(t.cost)) continue;
      const n = p.n + t.cost;
      if (n < (cost.get(key(x, y)) ?? Infinity)) {
        cost.set(key(x, y), n);
        queue.push({ x, y, n });
      }
    }
  }
  return cost;
}
const fieldCache = new Map();
function fieldFrom(map, p) {
  const k = map + ':' + key(p.x, p.y);
  if (!fieldCache.has(k)) fieldCache.set(k, distanceField(map, p));
  return fieldCache.get(k);
}

// ── What the enemies threaten ─────────────────────────────────────────────
// For each living foe: the tiles it could strike next enemy phase, and how hard its next blow is.
// Reinforcements due next round count as threats from the tiles they would enter on now
// (G.arrivalGhosts), as the danger zone draws them.
function threatMap(s) {
  const ghosts = G.arrivalGhosts(s, s.round + 1);
  const seen = ghosts.length ? { ...s, units: [...s.units, ...ghosts] } : s;
  // A piece held by 失神, 定身, 閉穴 or 受制 strikes no hero next enemy phase (G.holdsFire).
  return [...G.enemies(s).filter((e) => G.living(e) && !G.holdsFire(e)), ...ghosts]
    .map((e) => {
      // Where the rules say it may end its action (a posted or charged piece stays put).
      const stand = G.standCells(seen, e);
      const hits = new Set(),
        range = G.strikeReach(seen, e);
      for (const p of stand)
        for (let dx = -range; dx <= range; dx++)
          for (let dy = -range + Math.abs(dx); dy <= range - Math.abs(dx); dy++) hits.add(key(p.x + dx, p.y + dy));
      const art = G.signatureDue(s, e) ? G.enemyTechnique(e, s) : null;
      return { e, hits, factor: art ? art.factor : 1 };
    });
}
// Expected damage to u if it ends the turn at its current (hypothetical) position.
function dangerAt(s, u, threats, gone = new Set()) {
  let total = 0,
    top = 0;
  for (const th of threats) {
    if (gone.has(th.e) || !th.hits.has(key(u.x, u.y))) continue;
    const d = Math.round(G.damage(th.e, u, false, s.mapIndex, s) * th.factor);
    total += d;
    top = Math.max(top, d);
  }
  // Foes spread their blows, so the expectation is the worst blow plus half the rest.
  return { total, expected: top + (total - top) / 2 };
}

// ── Scoring ─────────────────────────────────────────────────────────────
// The pieces whose fall wins the board: the masters still standing on 斬將, every living enemy
// on 殲滅 (G.objectiveLeft). The approach is measured to the nearest of them.
// On 破 it is the objects still standing; on 守 every living enemy, as on 殲滅 (the player keeps
// the object by meeting what comes for it, see placeScore and foeValue).
function objectiveTargets(s) {
  const kind = G.boardKind(s);
  if (kind === 'slay')
    return G.objectiveLeft(s)
      .masters.map((id) => G.find(s, id))
      .filter((u) => u && G.living(u));
  if (kind === 'break') return breakables(s);
  return G.enemies(s).filter(G.living);
}
// The board objects a hero may strike, and those the heroes keep.
const breakables = (s) => G.props(s).filter((v) => G.living(v) && G.propKind(v) === 'break');
const keeps = (s) => G.props(s).filter((v) => G.living(v) && G.propKind(v) === 'keep');
function nearestField(map, targets) {
  if (!targets.length) return null;
  if (targets.length === 1) return fieldFrom(map, targets[0]);
  const field = new Map();
  for (const t of targets)
    for (const [k, n] of fieldFrom(map, t)) if (n < (field.get(k) ?? Infinity)) field.set(k, n);
  return field;
}
function boardContext(s) {
  const targets = objectiveTargets(s);
  const marker = G.unclaimedObjectiveTile(s);
  const side = s.run.side && R.sideState(s) === 'open' ? s.run.side : null;
  const ctx = {
    threats: threatMap(s),
    targets: new Set(targets),
    targetField: nearestField(s.mapIndex, targets),
    // The secondary still to play for, and its policy row (SIDE_POLICY).
    side,
    sidePolicy: side ? SIDE_POLICY[side.kind] || {} : {},
    marker,
    markerField: marker ? fieldFrom(s.mapIndex, marker) : null,
    escorts: new Set(G.wardEscorts(s)),
    // 守: the objects to keep, and the foes that could strike one next turn.
    keeps: keeps(s),
    raiders: new Set(),
    runner: null
  };
  for (const th of ctx.threats) if (ctx.keeps.some((o) => th.hits.has(key(o.x, o.y)))) ctx.raiders.add(th.e);
  ctx.speed = !!ctx.sidePolicy.speed;
  if (marker) {
    // The runner: whichever living hero not leading is nearest the marker (the leader if alone).
    const pool = G.party(s).filter(G.living);
    const others = pool.filter((u) => u.id !== s.leader);
    const pick = (others.length ? others : pool).sort((a, b) => (ctx.markerField.get(key(a.x, a.y)) ?? 99) - (ctx.markerField.get(key(b.x, b.y)) ?? 99))[0];
    ctx.runner = pick?.id;
  }
  return ctx;
}
function reachOf(u) {
  let r = u.range;
  for (const id of G.equippedArts(u)) {
    const art = G.artFor(u, id);
    if (G.targetType(art) === 'enemy') r = Math.max(r, art.range ?? 1);
  }
  return r;
}
// Where the hero ends: danger, cover, the way to the master and to the marker.
// `after` is what the option itself changes about the coming enemy phase: the foes it holds
// (`held`, left out of the danger like the fallen) and the guard it leaves on the hero (`guard`:
// 金剛 voids the blows, 固守's 防禦 is counted in them).
function placeScore(s, u, ctx, hpAfter, gone, after = null) {
  const leader = u.id === s.leader;
  const d = guardedDanger(s, u, ctx.threats, after?.held ? new Set([...gone, ...after.held]) : gone, after?.guard);
  let score = -d.expected * W.danger * (leader ? leaderCare(ctx) : 1);
  if (d.total >= hpAfter) score -= leader ? W.leaderLethal : W.lethal * (ctx.sidePolicy.lethal || 1) + u.maxHp / 2;
  else if (leader && d.total >= hpAfter * 0.75) score -= W.leaderLethal / 20;
  score += (tileInfo(u.x, u.y, s.mapIndex)?.defense || 0) * W.cover;
  const heal = tileInfo(u.x, u.y, s.mapIndex)?.heal || 0;
  if (heal) score += Math.min(heal, u.maxHp - hpAfter) * 0.8;
  if (ctx.targetField && [...ctx.targets].some((v) => !gone.has(v))) {
    const steps = Math.max(0, (ctx.targetField.get(key(u.x, u.y)) ?? 30) - reachOf(u));
    const urgency = 1 + s.round / 6 + (ctx.speed ? 0.8 : 0);
    score -= steps * (leader ? W.leaderApproach : W.approach) * urgency;
  }
  if (ctx.marker && ctx.runner === u.id) {
    const steps = ctx.markerField.get(key(u.x, u.y)) ?? 30;
    score -= steps * W.objective;
    if (!steps) score += W.onObjective;
  }
  const lead = G.find(s, s.leader);
  if (!leader && lead && G.living(lead) && G.distance(u, lead) === 1 && dangerAt(s, lead, ctx.threats, gone).total > 0) score += W.guardLeader;
  // 守: stay by what is kept, and stand in the way of the blows aimed at it.
  for (const o of ctx.keeps) {
    const d = G.distance(u, o);
    score -= Math.max(0, d - 2) * W.keepNear * (leader ? 0.5 : 1);
    if (d === 1 && !leader) score += W.keepBlock;
  }
  if (ctx.sidePolicy.place) score += ctx.sidePolicy.place(s, ctx.side, u);
  return score;
}
const leaderCare = (ctx) => W.leaderCare * (ctx.sidePolicy.leaderDanger || 1);
// The danger on u with a guard laid on him for the coming enemy phase: under 金剛 the direct
// blows do nothing; 固守 is a condition the rules' damage reads, so it is laid on for the count.
function guardedDanger(s, u, threats, gone, guard) {
  if (guard?.immune) return { total: 0, expected: 0 };
  if (!guard?.fortify) return dangerAt(s, u, threats, gone);
  const had = u.conditions;
  u.conditions = { ...(had || {}), fortify: { power: Math.max(guard.fortify, had?.fortify?.power || 0), through: s.round + 1 } };
  try {
    return dangerAt(s, u, threats, gone);
  } finally {
    u.conditions = had;
  }
}
// The guard an art leaves on its own caster (rules/battle-mastery.js selfEffectsOf: 金剛 and
// 固守 on a strike guard the striker).
function selfGuard(art) {
  if (!art || G.isSupport(art)) return null;
  if (!art.immune && !art.fortify) return null;
  return { immune: !!art.immune, fortify: art.fortify?.power || 0 };
}
// The blow foe t would strike next enemy phase: on the hero it would hurt most among those it can
// reach (`except` left out), or, with none in reach, a share of its blow on the softest hero.
function foeBlow(s, t, ctx, except = null) {
  const th = ctx.threats.find((x) => x.e === t);
  let best = 0,
    any = 0;
  for (const v of G.party(s).filter(G.living)) {
    const d = Math.round(G.damage(t, v, false, s.mapIndex, s) * (th?.factor || 1));
    any = Math.max(any, d);
    if (v !== except && th?.hits.has(key(v.x, v.y))) best = Math.max(best, d);
  }
  return { reach: best, idle: any * W.holdIdle };
}
// The last round t is held through already (失神 lasts until its next action).
function heldThrough(s, t) {
  const c = t.conditions || {};
  let n = s.round - 1;
  for (const k of ['freeze', 'mute', 'charm']) if (c[k]) n = Math.max(n, c[k].through);
  if (c.daze) n = Math.max(n, s.round);
  return n;
}
// What holding t is worth: the blows it is kept from, per turn beyond what holds it already. The
// first turn's blow on the striker is left to his place score (placeScore's `held`).
function holdValue(s, u, t, f, ctx) {
  const was = heldThrough(s, t);
  let best = 0;
  for (const e of f.effects) {
    if (!(e.kind in W.hold)) continue;
    const through = e.kind === 'daze' ? s.round : s.round + (e.turns || 1) - 1;
    const turns = Math.max(0, through - was);
    if (!turns) continue;
    const first = s.round > was; // the coming enemy phase is newly held
    const blow = foeBlow(s, t, ctx, u),
      later = foeBlow(s, t, ctx);
    const now = first ? blow.reach || (later.reach ? 0 : blow.idle) : 0;
    const rest = (turns - (first ? 1 : 0)) * (later.reach || later.idle);
    let v = (now + rest) * W.hold[e.kind];
    if (e.kind === 'charm') v += turns * (later.reach || later.idle) * W.turncoat;
    best = Math.max(best, v * foeValue(s, t, ctx));
  }
  return best;
}

// ── Secondary objectives: one policy row per kind (journey.js SIDE_KINDS), never per board ──
// A row may give: `fell(s, side, blow)` → { score, holdWin } for a blow that fells `blow.gone`
// (the struck piece is `blow.main`); `hit(s, side, v)` added when a blow lands on v; `place(s,
// side, u)` added where a hero ends; `breakCharge(s, side, v)` in place of W.breakCharge;
// `lethal` and `leaderDanger` multipliers; `speed`; `medicine(s, side, u)` whether medicine may be
// taken. A row only plays while its secondary is open (R.sideState).
const SIDE_W = {
  lastBlow: 60, lastBlowOther: -80, orderEarly: -80, lateRound: 10, double: 25, mirrorCharge: -60,
  mendValue: 30, herbsValue: 30, combo: 40, holdLineKill: 30, holdLinePlace: 8, holdLineReach: 2, answer: 50,
  unhurtDanger: 4, intactLethal: 3
};
const piece = (s, ref) => G.find(s, G.refId(s.mapIndex, ref));
const standing = (s, id) => {
  const v = G.find(s, id);
  return !!v && G.living(v);
};
// Steps from a tile to a zone of board data (0 inside).
function zoneSteps(zone, p) {
  const off = (r, v) => (!r ? 0 : v < r[0] ? r[0] - v : v > r[1] ? v - r[1] : 0);
  return off(zone.x, p.x) + off(zone.y, p.y);
}
const SIDE_POLICY = {
  // The lamp runner (boardContext) and the speed term were the player's already.
  lamp: {},
  swift: { speed: true },
  intact: { lethal: SIDE_W.intactLethal },
  unhurt: { leaderDanger: SIDE_W.unhurtDanger },
  // Medicine only when the leader would otherwise fall.
  noMedicine: {
    medicine: (s, side, u) => u.id === s.leader && dangerAt(s, u, threatMap(s)).total >= u.hp
  },
  lastBlow: {
    fell: (s, side, blow) => {
      const target = piece(s, side.target);
      if (!target || !blow.gone.has(target) || !standing(s, side.hero)) return { score: 0 };
      // (any of the hero's own blows counts, its splash included: the rules credit the striker)
      if (blow.u.id === side.hero) return { score: SIDE_W.lastBlow };
      if (blow.wins && s.round >= SIDE_W.lateRound) return { score: 0 };
      return { score: SIDE_W.lastBlowOther, holdWin: true };
    }
  },
  order: {
    fell: (s, side, blow) => {
      const first = piece(s, side.first);
      if (!first || !G.living(first) || blow.gone.has(first) || s.round >= SIDE_W.lateRound) return { score: 0 };
      if (!G.masterIds(s).some((id) => [...blow.gone].some((v) => v.id === id))) return { score: 0 };
      return { score: SIDE_W.orderEarly, holdWin: true };
    }
  },
  double: {
    fell: (s, side, blow) => {
      const now = (s.tally?.falls || []).filter((f) => f.phase === 'ally' && f.round === s.round).length;
      return { score: now < 2 && now + blow.gone.size >= 2 ? SIDE_W.double : 0 };
    }
  },
  spare: {
    // A charged 斗轉星移 stays charged until a direct blow is turned, so sparing it means never
    // striking its bearer directly; like lastBlow and order, the player lets the secondary go
    // late in the board rather than lose it.
    breakCharge: (s, side, v) =>
      side.behaviour === 'mirror' && piece(s, side.piece) === v && s.round < SIDE_W.lateRound ? SIDE_W.mirrorCharge : W.breakCharge,
    hit: (s, side, v) => {
      if (piece(s, side.piece) !== v) return 0;
      if (side.behaviour === 'mend') return SIDE_W.mendValue;
      if (side.behaviour === 'herbs' && !v.halved) return SIDE_W.herbsValue;
      return 0;
    }
  },
  combo: { fell: (s, side, blow) => ({ score: blow.main && blow.combo ? SIDE_W.combo : 0 }) },
  holdLine: {
    fell: (s, side, blow) => ({ score: [...blow.gone].filter((v) => v.enteredRound != null).length * SIDE_W.holdLineKill }),
    place: (s, side, u) => {
      const n = zoneSteps(side.zone, u);
      return n > 0 && n <= SIDE_W.holdLineReach ? SIDE_W.holdLinePlace : 0;
    }
  },
  answer: {
    fell: (s, side, blow) => ({ score: blow.main && blow.u.id === side.hero && blow.answered ? SIDE_W.answer : 0 })
  }
};
function foeValue(s, t, ctx) {
  let v = 1;
  if (ctx.targets.has(t)) v = W.bossDamage * (ctx.speed ? W.speedBoss : 1);
  if (ctx.escorts.has(t)) v = W.escort;
  if (ctx.raiders.has(t)) v = Math.max(v, W.keepThreat);
  return v;
}
// What an option is worth, read entirely from the rules' forecast. A blow at a covered piece
// lands on its coverer (forecast's coveredBy), so that is the piece it may fell.
function strikeScore(s, u, t, f, ctx, mp, art = null) {
  let score = -mp * W.mp - f.hpCost * W.hpCost;
  const gone = new Set();
  const leader = u.id === s.leader;
  const victim = (f.coveredBy && G.find(s, f.coveredBy)) || t;
  const dealt = Math.min(f.amount, victim.hp);
  score += dealt * foeValue(s, victim, ctx);
  if (dealt > 0 && ctx.sidePolicy.hit) score += ctx.sidePolicy.hit(s, ctx.side, victim);
  const held = new Set();
  if (f.amount >= victim.hp) gone.add(victim);
  else if (!G.immuneTo(victim)) {
    for (const e of f.effects)
      if (!(e.kind in W.hold)) score += (W.foeEffect[e.kind] ?? W.foeEffectDefault) * (e.power || 1) * Math.min(e.turns || 1, 2);
    const hold = holdValue(s, u, victim, f, ctx);
    score += hold;
    if (hold > 0 || f.effects.some((e) => e.kind in W.hold)) held.add(victim);
  }
  for (const hit of f.splash) {
    const v = G.find(s, hit.id);
    if (!v || !G.living(v) || gone.has(v)) continue;
    score += Math.min(hit.amount, v.hp) * foeValue(s, v, ctx);
    if (hit.amount > 0 && ctx.sidePolicy.hit) score += ctx.sidePolicy.hit(s, ctx.side, v);
    if (hit.amount >= v.hp) gone.add(v);
  }
  // The falls: the board is won if the rules say so with these gone; otherwise each is a kill.
  if (gone.size) {
    const blow = {
      u,
      main: gone.has(victim) ? victim : null,
      gone,
      wins: G.winsIfFalls(s, [...gone].map((v) => v.id)),
      combo: !!(f.plan?.spentMark || f.plan?.spentPoison || f.plan?.partner),
      answered: !!art?.answer && G.strikeFactor(s, u, art, victim).notes.some((n) => n.startsWith('破招'))
    };
    const side = ctx.sidePolicy.fell ? ctx.sidePolicy.fell(s, ctx.side, blow) : { score: 0 };
    score += side.score;
    const kills = [...gone].reduce((n, v) => n + W.killBase + v.atk + (ctx.escorts.has(v) ? 40 : 0), 0);
    // A secondary may hold back a winning blow (by the wrong hand, in the wrong order) until late.
    score += blow.wins && !side.holdWin ? W.win : kills;
  }
  // 吸元 and 回生: forecast already caps the heal at what the caster is missing; it is worth more
  // the more he is hurt, as a heal is (supportScore).
  score += (f.reflected || 0) * 0.8 + (f.selfHeal || 0) * W.heal * (0.6 + 1.6 * (1 - u.hp / u.maxHp));
  // A blow a charged reaction turns back (斗轉星移) does nothing to the foe but spends the charge,
  // which opens it to the blows after; the share turned back is paid like a counter.
  if (f.turned && !f.turned.ward.source) score += (ctx.sidePolicy.breakCharge?.(s, ctx.side, victim) ?? W.breakCharge) * foeValue(s, victim, ctx);
  // 吸勁 putting a foe's signature back is worth something too.
  if (f.siphon?.delay) score += W.delaySignature * foeValue(s, victim, ctx);
  const hpAfter = u.hp - f.hpCost - f.counter - (f.rebound || 0) + (f.selfHeal || 0);
  score -= (f.rebound || 0) * W.counter * (leader ? leaderCare(ctx) : 1);
  score -= f.counter * W.counter * (leader ? leaderCare(ctx) : 1);
  if (hpAfter <= 0) score -= leader ? W.leaderLethal * 10 : W.lethal * 3 * (ctx.sidePolicy.lethal || 1);
  return { score, hpAfter, gone, after: { held, guard: selfGuard(art) } };
}
function supportScore(s, u, t, f, ctx, mp) {
  let score = -mp * W.mp - f.hpCost * W.hpCost;
  for (const r of f.recipients) {
    const v = G.find(s, r.id) || u;
    const vLeader = v.id === s.leader;
    const threat = dangerAt(s, v, ctx.threats).total;
    const urgency = 0.6 + 1.6 * (1 - v.hp / v.maxHp) + (threat >= v.hp ? 1 : 0);
    score += r.amount * W.heal * urgency * (vLeader ? 1.8 : 1);
    score += (r.mp || 0) * W.channelMp + (r.clean?.length || 0) * W.cleanse;
    const shield = (r.overflow || 0) + f.effects.filter((e) => e.kind === 'shield').reduce((n, e) => n + e.power, 0);
    if (shield) score += Math.min(shield, threat) * W.shieldAgainstThreat * (vLeader ? 1.6 : 1) + shield * W.shieldIdle;
    for (const e of f.effects) {
      if (e.kind === 'shield') continue;
      // 金剛 and 固守: what they take off the blows coming at this recipient where it stands.
      if (e.kind === 'immune' || e.kind === 'fortify') {
        const d = dangerAt(s, v, ctx.threats).expected;
        const cut = e.kind === 'immune' ? d : d - guardedDanger(s, v, ctx.threats, new Set(), { fortify: e.power }).expected;
        const turns = Math.max(1, e.turns || 1);
        score += cut * W[e.kind] * (1 + (turns - 1) * W.holdLater) * (vLeader ? 1.6 : 1);
        continue;
      }
      score += (W.allyEffect[e.kind] ?? W.allyEffectDefault) * (e.power || 1) * Math.min(e.turns || 1, 2);
    }
  }
  return { score, hpAfter: u.hp - f.hpCost, gone: new Set() };
}

// Every legal option for u this moment, best first. Hypotheses are tried by placing u on the
// tile and asking the rules (targetOK, forecast); everything is put back afterwards.
function bestOption(s, u, ctx) {
  const home = { x: u.x, y: u.y, moved: u.moved, route: u.route, activeArt: u.activeArt, brace: u.brace };
  const tiles = [{ x: u.x, y: u.y }];
  // The rules say whether he may walk (立樁 holds him; a hero who has moved has moved).
  if (G.canMove(s, u)) for (const k of G.reachable(s, u).keys()) tiles.push(unkey(k));
  // 破: the objects to break are struck like foes (the rules' forecast says how).
  const foes = [...G.enemies(s).filter(G.living), ...breakables(s)],
    friends = G.party(s).filter(G.living);
  let best = null,
    bestWait = null;
  const consider = (o) => {
    if (!best || o.score > best.score) best = o;
  };
  for (const P of tiles) {
    u.x = P.x;
    u.y = P.y;
    const walked = P.x !== home.x || P.y !== home.y;
    u.moved = home.moved || walked;
    u.route = walked ? G.movementPath(s, u, home, P) : home.route;
    // Wait (brace) here.
    u.brace = true;
    const wait = { score: placeScore(s, u, ctx, u.hp, new Set()), P, act: 'wait' };
    u.brace = home.brace;
    consider(wait);
    if (!bestWait || wait.score > bestWait.score) bestWait = wait;
    // The basic attack.
    for (const t of foes) {
      if (!G.targetOK(s, u, t, false)) continue;
      const f = G.forecast(u, t, false, s);
      const r = strikeScore(s, u, t, f, ctx, 0);
      consider({ score: r.score + placeScore(s, u, ctx, r.hpAfter, r.gone, r.after), P, act: 'basic', t });
    }
    // Every equipped art the rules let the hero pay for, on every target the rules accept.
    for (const id of G.equippedArts(u)) {
      u.activeArt = id;
      if (!G.canPay(s, u, id)) continue;
      const art = G.artFor(u, id),
        type = G.targetType(art),
        mp = G.cost(u, s, id);
      const reach = art.range ?? 1;
      let targets;
      if (type === 'ground') {
        targets = [];
        for (const c of fieldCells(s.mapIndex)) if (G.distance(c, u) <= reach) targets.push({ x: c.x, y: c.y });
      } else targets = (type === 'enemy' ? foes : friends).filter((v) => G.distance(v, u) <= reach);
      for (const t of targets) {
        if (!G.targetOK(s, u, t, true)) continue;
        const f = G.forecast(u, t, true, s);
        let r;
        // 布陣 is laid where it is aimed and leaves its caster standing: scored as standing there.
        if (type === 'ground' && art.zone) {
          r = { score: -mp * W.mp + (f.zone?.length || 0), hpAfter: u.hp - f.hpCost, gone: new Set() };
          consider({ score: r.score + placeScore(s, u, ctx, r.hpAfter, r.gone), P, act: 'art', id, t });
          continue;
        }
        if (type === 'ground') {
          const keep = { x: u.x, y: u.y };
          u.x = t.x;
          u.y = t.y;
          r = { score: -mp * W.mp + f.landing.length * 4, hpAfter: u.hp - f.hpCost, gone: new Set() };
          r.score += placeScore(s, u, ctx, r.hpAfter, r.gone);
          u.x = keep.x;
          u.y = keep.y;
          consider({ score: r.score, P, act: 'art', id, t });
          continue;
        }
        r = f.support ? supportScore(s, u, t, f, ctx, mp) : strikeScore(s, u, t, f, ctx, mp, art);
        consider({ score: r.score + placeScore(s, u, ctx, r.hpAfter, r.gone, r.after), P, act: 'art', id, t });
      }
    }
  }
  Object.assign(u, home);
  return { ...best, margin: best.score - bestWait.score, u };
}

// ── Records ─────────────────────────────────────────────────────────────
function usageKey(u, o) {
  if (o.act === 'wait') return 'wait';
  if (o.act === 'basic') return 'basic';
  if (o.id === 'signature') return 'start';
  const art = TECHNIQUES[o.id];
  if (art?.manual) return 'manual';
  return 'tier' + art.tier;
}
function hpSnapshot(s) {
  return new Map(s.units.map((v) => [v, v.hp]));
}
function credit(rec, before, s, actor) {
  // Health lost by foes goes to the actor, health lost by heroes is what they took.
  for (const [v, hp] of before) {
    const lost = hp - v.hp;
    if (lost <= 0) continue;
    if (v.side === 'ally') rec.heroes[v.id].taken += lost;
    else if (actor && rec.heroes[actor]) {
      rec.heroes[actor].dealt += lost;
      if (v.hp <= 0 && hp > 0) rec.heroes[actor].kills++;
    }
  }
}

// ── A board ─────────────────────────────────────────────────────────────
function useMedicine(s, u) {
  const leader = u.id === s.leader;
  // A secondary may forbid medicine except to keep the leader standing (SIDE_POLICY).
  const side = s.run.side && R.sideState(s) === 'open' ? s.run.side : null;
  const rule = side && SIDE_POLICY[side.kind]?.medicine;
  if (rule && !rule(s, side, u)) return;
  if (rule || u.hp < u.maxHp * (W.medicineAt + (leader ? 0.15 : 0))) {
    const missing = u.maxHp - u.hp;
    const order = Object.entries(G.ITEMS)
      .filter(([id, it]) => it.kind === 'use' && it.hp && s.stock[id] > 0)
      .sort((a, b) => Math.abs(a[1].hp - missing) - Math.abs(b[1].hp - missing));
    if (order.length) G.consume(s, u, order[0][0]);
  }
  if (rule) return;
  const cheapest = Math.min(...G.equippedArts(u).map((id) => G.cost(u, s, id)));
  if (Number.isFinite(cheapest) && u.mp < cheapest) {
    const mpItem = Object.entries(G.ITEMS).find(([id, it]) => it.kind === 'use' && it.mp && s.stock[id] > 0);
    if (mpItem && s.round <= G.LIMIT - 2) G.consume(s, u, mpItem[0]);
  }
}
function allyPhase(s, rec) {
  const dosed = new Set();
  // Keep choosing until the rules say no hero can do anything more.
  for (let guard = 0; guard < 60 && !s.result; guard++) {
    const actors = G.party(s).filter((u) => G.canAct(s, u));
    if (!actors.length) return;
    for (const u of actors) if (!dosed.has(u.id)) (dosed.add(u.id), useMedicine(s, u));
    const ctx = boardContext(s);
    let pick = null;
    for (const u of actors) {
      const o = bestOption(s, u, ctx);
      if (!pick || o.margin > pick.margin) pick = o;
    }
    execute(s, pick, rec);
  }
  for (const u of G.party(s)) if (G.canAct(s, u)) G.waitUnit(s, u);
}
function execute(s, o, rec) {
  const u = o.u,
    before = hpSnapshot(s);
  let ok = true;
  if (o.P.x !== u.x || o.P.y !== u.y) ok = G.move(s, u, o.P.x, o.P.y);
  if (ok && o.act === 'basic') ok = !!G.resolve(s, u, o.t, false);
  else if (ok && o.act === 'art') ok = R.readyArt(s, u, o.id) && !!G.resolve(s, u, o.t, true);
  if (ok && o.act === 'wait') ok = G.waitUnit(s, u);
  if (ok && G.canGlide(s, u)) glide(s, u);
  if (!ok) {
    rec.misfires++;
    if (G.canAct(s, u)) G.waitUnit(s, u);
  }
  rec.usage[ok ? usageKey(u, o) : 'wait']++;
  if (ok && o.act === 'art') {
    const A = (rec.arts[u.id + '/' + o.id] ??= { equipped: 0, used: 0 });
    A.used++;
  }
  credit(rec, before, s, u.id);
}
// 回身: a hero the rules still let walk after his strike takes the best place within the steps
// left, or stays where he stands if that is better.
function glide(s, u) {
  const ctx = boardContext(s),
    home = { x: u.x, y: u.y };
  let best = { score: placeScore(s, u, ctx, u.hp, new Set()), p: null };
  for (const k of G.glideField(s, u).costs.keys()) {
    const p = unkey(k);
    if (G.at(s, p.x, p.y)) continue;
    Object.assign(u, p);
    const score = placeScore(s, u, ctx, u.hp, new Set());
    if (score > best.score) best = { score, p };
  }
  Object.assign(u, home);
  if (best.p) G.glideMove(s, u, best.p.x, best.p.y);
  else G.stopGlide(s, u);
}
function enemyPhase(s, rec) {
  if (!G.startEnemy(s)) return;
  for (let guard = 0; guard < 40 && !s.result; guard++) {
    const e = G.enemies(s).find((v) => G.living(v) && !v.acted);
    if (!e) break;
    const before = hpSnapshot(s);
    const effects = G.enemyAct(s, e);
    const target = effects[0] && G.find(s, effects[0][0]);
    credit(rec, before, s, target?.side === 'ally' ? target.id : null);
  }
  if (s.result) return;
  const before = hpSnapshot(s);
  const sources = new Map(G.enemies(s).map((v) => [v, v.conditions?.poison?.source]));
  G.nextRound(s);
  for (const [v, hp] of before) {
    const lost = hp - v.hp;
    if (lost <= 0) continue;
    if (v.side === 'ally') rec.heroes[v.id].taken += lost;
    else if (rec.heroes[sources.get(v)]) {
      rec.heroes[sources.get(v)].dealt += lost;
      if (v.hp <= 0) rec.heroes[sources.get(v)].kills++;
    }
  }
}
function fight(s) {
  const rec = { stage: s.run.stage, map: s.mapIndex, usage: { basic: 0, start: 0, tier1: 0, tier2: 0, tier3: 0, tier4: 0, manual: 0, wait: 0 }, heroes: {}, misfires: 0 };
  rec.arts = {};
  for (const u of G.party(s)) {
    rec.heroes[u.id] = { dealt: 0, taken: 0, kills: 0, level: u.level, sp: u.sp, spent: spentPoints(u) };
    for (const id of G.equippedArts(u)) (rec.arts[u.id + '/' + id] ??= { equipped: 0, used: 0 }).equipped = 1;
  }
  // The battle log keeps only its last lines; a traced board keeps its own copy.
  const lines = (TRACE && tracing) || (TRACE_MAP === s.mapIndex && !traced.has(s.mapIndex)) ? [] : null;
  // What the villains did, read from the battle log as it is written (the log keeps only its
  // last lines): whether each board's defining behaviour shows up at all.
  rec.events = {};
  // (any piece's phase line: a piece that enters later may have one too)
  const phaseLines = new Set(Object.values(G.DETAILS).map((d) => d.traits?.phase?.log).filter(Boolean));
  // The secondary's state is read after every log line: the moment it fails is an event.
  let sideNow = R.sideState(s);
  s.logs.push = function (entry) {
    for (const [name, test] of EVENTS) if (test(entry, phaseLines)) rec.events[name] = (rec.events[name] || 0) + 1;
    const n = Array.prototype.push.call(this, entry);
    lines?.push(entry);
    const state = s.result ? sideNow : R.sideState(s);
    if (state !== sideNow && state === 'failed') {
      rec.events.sideFailed = (rec.events.sideFailed || 0) + 1;
      rec.sideFailedRound = s.round;
    }
    sideNow = state;
    return n;
  };
  while (!s.result) {
    allyPhase(s, rec);
    if (s.result) break;
    enemyPhase(s, rec);
  }
  const team = G.party(s);
  delete s.logs.push;
  rec.won = s.result === 'win';
  rec.rounds = s.round;
  rec.hpLeft = team.reduce((n, u) => n + Math.max(0, u.hp), 0) / team.reduce((n, u) => n + u.maxHp, 0);
  rec.downed = team.filter((u) => !G.living(u)).length;
  rec.side = R.sideDone(s);
  rec.leaderFell = !G.living(G.find(s, s.leader));
  // What kind of board it was, and what came onto it.
  const board = G.boardOf(s);
  rec.kind = G.boardKind(s);
  rec.sideKind = s.run.side?.kind || null;
  rec.sideState = R.sideState(s);
  const wavePieces = board.waves.flatMap((w) => w.pieces.map((p) => p.id));
  rec.arrived = wavePieces.filter((id) => s.units.some((u) => u.id === id)).length;
  rec.enemies = G.enemies(s).length + wavePieces.length - rec.arrived;
  rec.blocked = rec.events.blocked || 0;
  // How much of the objective still stood at the end (masters on 斬將, every enemy on 殲滅).
  // (守 and 破: the objects still standing; on 守 a share left is good, so it is reported as is.)
  const goal = ['slay', 'keep'].includes(rec.kind) ? G.masterIds(s).map((id) => G.find(s, id)).filter(Boolean) : rec.kind === 'break' ? G.props(s) : G.enemies(s);
  rec.objectLost = !!G.brokenKeep(s);
  rec.heldOut = rec.won && rec.kind === 'keep' && !G.masterIds(s).every((id) => !G.living(G.find(s, id) || { hp: 0 }));
  rec.objectLeft = G.props(s).length ? G.props(s).reduce((n, u) => n + Math.max(0, u.hp), 0) / G.props(s).reduce((n, u) => n + u.maxHp, 0) : null;
  rec.goalLeft = goal.reduce((n, u) => n + Math.max(0, u.hp), 0) / Math.max(1, goal.reduce((n, u) => n + u.maxHp, 0));
  const show = () => {
    for (const l of lines) if (l.type !== 'grow') console.log('  r' + l.round + ' ' + l.phase + ' ' + l.who + ': ' + l.text);
  };
  if (lines && TRACE_MAP === s.mapIndex && !traced.has(s.mapIndex)) {
    traced.add(s.mapIndex);
    console.log('\n== map ' + s.mapIndex + ' (board ' + (rec.stage + 1) + ', ' + rec.kind + ', side ' + rec.sideKind + ' ' + rec.sideState + ') ' + (rec.won ? 'won' : 'lost') + ' in ' + rec.rounds + ' rounds: ' + (s.reason || ''));
    console.log('  heroes: ' + G.party(s).map((u) => G.unitDetails(u).name + ' ' + Math.max(0, u.hp) + '/' + u.maxHp).join(', '));
    console.log('  enemies: ' + G.enemies(s).map((u) => G.unitDetails(u).name + '@' + u.x + ',' + u.y + ' ' + Math.max(0, u.hp) + '/' + u.maxHp).join(', '));
    show();
  } else if (lines) {
    console.log('\n== board ' + (rec.stage + 1) + ' (map ' + s.mapIndex + ', ' + s.run.side?.kind + ') ' + (rec.won ? 'won' : 'lost') + ' in ' + rec.rounds + ' rounds');
    show();
  }
  return rec;
}

// Rule events in the battle log, by what the log line says.
const EVENTS = [
  ['woke', (e) => e.text === '離位追擊。'],
  ['walkedBack', (e) => e.text === '退回崗位。'],
  ['covered', (e) => e.phase === 'ally' && /^挺身代.+受招。$/.test(e.text)],
  ['dissolved', (e) => e.text.startsWith('被化功大法化去')],
  ['mended', (e) => e.text.includes('接骨續筋。') && e.text.startsWith('施展')],
  ['phased', (e, lines) => lines.has(e.text)],
  ['fled', (e) => e.text === '退向藥草地。'],
  ['lineHit', (e) => e.text.startsWith('被穿透的勁力擊中')],
  ['mirrored', (e) => e.text.startsWith('斗轉星移反震')],
  ['ropeBroke', (e) => e.who === '星索護陣'],
  ['objectBroke', (e) => (e.who === '守物' || e.who === '破物') && /(毀了|倒了|盡數倒了)/.test(e.text)],
  ['glidedOff', (e) => /^出手後退開/.test(e.text)],
  ['dragged', (e) => e.text.startsWith('給一把扯到')],
  ['secondNeedle', (e) => e.text.startsWith('針影一分')],
  // Reinforcements: a wave entering, and a piece whose entry tile was taken (moved or delayed).
  ['arrive', (e) => e.who === '敵援' && /自.+入場。$/.test(e.text) && !/^(下一回合|第.+回合，)/.test(e.text) && !e.text.includes('氣血過半') && !e.text.includes('入場處有人')],
  ['blocked', (e) => e.who === '敵援' && (e.text.endsWith('入場受阻，延至下一回合。') || e.text.includes('入場處有人，改由'))]
  // (sideFailed is counted in fight, from the secondary's state)
];
// ── Between boards ──────────────────────────────────────────────────────
function spentPoints(u) {
  return (u.learned || []).reduce((n, id) => n + (TECHNIQUES[id]?.points || 0), 0) + Object.values(u.talents).reduce((a, b) => a + b, 0);
}
const profCache = new Map();
function artProfile(heroId, id, level) {
  const k = heroId + '/' + id + '/' + level;
  if (!profCache.has(k)) {
    const p = profile(heroId, id, [{ label: 'now', stage: Math.min(9, Math.max(0, level - 1)), level }]);
    const art = id === 'basic' ? null : id === 'signature' ? G.artFor(G.startingHero(heroId), 'signature') : TECHNIQUES[id];
    p.cls = classify(art, p, { DEBUFF_BELOW_BASIC: 1.1 });
    p.job = p.cls.job;
    p.measure = mainMeasure(p.job, p);
    profCache.set(k, p);
  }
  return profCache.get(k);
}
// One common scale across jobs: how many basic attacks' worth the art is.
function worth(heroId, id, level) {
  const p = artProfile(heroId, id, level),
    base = Math.max(1, artProfile(heroId, 'basic', level).avgDamage);
  const scale = { strike: 1, safe: 1.05, ranged: 1, area: 0.9, debuff: 0.9, heal: 0.8, shield: 0.6, buff: 0.5, mobility: 0.4 }[p.job] ?? 0.5;
  const amount = p.job === 'mobility' ? base : p.job === 'debuff' ? p.avgDamage + p.mid.foeEffect : p.measure;
  // 失神, 定身, 閉穴, 受制: the turns a foe is kept from striking, which the damage measure leaves out.
  const art = id === 'basic' ? null : id === 'signature' ? G.artFor(G.startingHero(heroId), 'signature') : TECHNIQUES[id];
  let held = art?.daze ? W.hold.daze : 0;
  for (const k of ['freeze', 'mute', 'charm']) if (art?.[k]) held += (art[k].turns || 1) * W.hold[k] * (k === 'charm' ? 1 + W.turncoat : 1);
  return { job: p.job, value: (amount / base) * scale + held * W.equipHold };
}
function equipArts(s, u) {
  const known = ['signature', ...u.learned.filter((id) => TECHNIQUES[id] && TECHNIQUES[id].kind !== 'basic')];
  const ranked = known.map((id) => ({ id, ...worth(u.id, id, u.level) })).sort((a, b) => b.value - a.value);
  const chosen = [],
    jobs = new Set();
  for (const a of ranked) if (chosen.length < 3 && !jobs.has(a.job)) (chosen.push(a.id), jobs.add(a.job));
  for (const a of ranked) if (chosen.length < 3 && !chosen.includes(a.id)) chosen.push(a.id);
  for (let i = 0; i < 3; i++) R.setSlot(s, u, i, chosen[i] ?? null);
}
function spendPoints(s, u) {
  const path = HERO_PATHS[u.id];
  if (!path) return;
  const tree = heroTree(u.id);
  const summit = path.layout.at(-1).find(Boolean);
  const toward = new Set([summit, ...ancestors(summit)]);
  const order = (a, b) => TECHNIQUES[a].points - TECHNIQUES[b].points || TECHNIQUES[a].tier - TECHNIQUES[b].tier || tree.indexOf(a) - tree.indexOf(b);
  for (let guard = 0; guard < 30 && u.sp > 0; guard++) {
    const state = (id) => R.studyState(s, u, id);
    const open = tree.filter((id) => !u.learned.includes(id));
    const onPath = open.filter((id) => toward.has(id));
    const buyable = onPath.filter((id) => state(id)?.canLearn).sort(order);
    if (buyable.length) {
      R.learn(s, u, buyable[0]);
      continue;
    }
    // Save up when the next step toward the summit is only short of points.
    const waiting = onPath.filter((id) => state(id)?.status === '武學點不足');
    const summitGated = onPath.includes(summit) && state(summit)?.status === '待完成歷練';
    if (waiting.length || (summitGated && s.run.stage < W.reserveSummitUntilStage && u.sp <= TECHNIQUES[summit].points)) break;
    const other = open.filter((id) => state(id)?.canLearn).sort(order);
    if (other.length) {
      R.learn(s, u, other[0]);
      continue;
    }
    if (summitGated && s.run.stage < W.reserveSummitUntilStage && u.sp <= TECHNIQUES[summit].points) break;
    // Spare points into talents: the hero's lean first, then defence, then the other.
    const support = ['heal', 'shield', 'buff'].includes(worth(u.id, 'signature', u.level).job);
    const prefs = support ? ['breath', 'guard', 'force'] : ['force', 'guard', 'breath'];
    const talent = prefs.sort((a, b) => u.talents[a] - u.talents[b] || prefs.indexOf(a) - prefs.indexOf(b))[0];
    if (!G.train(s, u, talent)) break;
  }
}
function itemGain(s, u, id) {
  const it = G.ITEMS[id],
    now = G.ITEMS[u[it.kind === 'weapon' ? 'weapon' : 'gear']] || {};
  if (it.owner && it.owner !== u.id) return -Infinity;
  const support = ['heal', 'shield', 'buff'].includes(worth(u.id, 'signature', u.level).job);
  const val = (x) => (x.atk || 0) * (support ? 0.4 : 1) + (x.power || 0) * (support ? 1 : 0.4) + (x.def || 0) * (u.id === s.leader ? 1.6 : 0.8) + (x.step || 0) * 4;
  return val(it) - val(now);
}
function equipItems(s) {
  for (let guard = 0; guard < 10; guard++) {
    let best = null;
    for (const [id, n] of Object.entries(s.stock)) {
      const it = G.ITEMS[id];
      if (!(n > 0) || !it || it.kind === 'use') continue;
      for (const u of G.company(s)) {
        const g = itemGain(s, u, id);
        if (g > 0.5 && (!best || g > best.g)) best = { u, id, g };
      }
    }
    if (!best || !G.equip(s, best.u, best.id)) return;
  }
}
function shop(s) {
  const r = s.run;
  if (r.last?.visit && FM.coverBowls(s)) FM.pickBowl(s, 0);
  const healing = () => Object.entries(s.stock).filter(([id, n]) => G.ITEMS[id]?.kind === 'use' && G.ITEMS[id].hp).reduce((a, [, n]) => a + n, 0);
  for (let guard = 0; guard < 12; guard++) {
    const offers = r.shop.filter((o) => o.left > 0 && o.price <= r.coins && G.ITEMS[o.id]);
    const meds = offers.filter((o) => G.ITEMS[o.id].kind === 'use' && G.ITEMS[o.id].hp).sort((a, b) => a.price - b.price);
    if (healing() < 4 && meds.length) {
      R.buy(s, meds[0].id);
      continue;
    }
    const kit = offers
      .filter((o) => G.ITEMS[o.id].kind !== 'use' && r.coins - o.price >= 10)
      .map((o) => ({ o, g: Math.max(...G.company(s).map((u) => itemGain(s, u, o.id))) }))
      .filter((x) => x.g > 1)
      .sort((a, b) => b.g / b.o.price - a.g / a.o.price);
    if (kit.length) {
      R.buy(s, kit[0].o.id);
      continue;
    }
    break;
  }
}
function prepare(s) {
  for (const u of G.company(s)) spendPoints(s, u);
  equipItems(s);
  for (const u of G.company(s)) equipArts(s, u);
}

// The deployment step: the leader takes the post where the least could strike him (danger
// total, reinforcements due next round included; ties: farthest from the nearest enemy), the
// others swap as that needs, then 開戰.
function deploy(s) {
  const lead = G.find(s, s.leader),
    posts = mapLayout(s.mapIndex).allies,
    threats = threatMap(s),
    foes = G.enemies(s).filter(G.living),
    home = { x: lead.x, y: lead.y };
  const from = posts.findIndex((p) => p.x === lead.x && p.y === lead.y);
  let best = null;
  posts.forEach((p, i) => {
    Object.assign(lead, { x: p.x, y: p.y });
    const danger = dangerAt(s, lead, threats).total,
      room = Math.min(...foes.map((e) => G.distance(e, p)));
    if (!best || danger < best.danger || (danger === best.danger && room > best.room)) best = { i, danger, room };
  });
  Object.assign(lead, home);
  if (from >= 0 && best.i !== from && !R.swapStart(s, from, best.i)) throw new Error('could not swap the leader to post ' + best.i);
  if (!R.beginBattle(s)) throw new Error('could not begin the battle');
}

// ── A run ───────────────────────────────────────────────────────────────
function playRun(seed) {
  const draw = R.drawLots(seed);
  const s = R.startRun({ ...draw, realm: REALM }, { ...R.LEGACY, realms: REALM });
  const run = { seed, heroes: [...draw.ids], leader: s.leader, boards: [] };
  for (;;) {
    R.turnPage(s, true); // the story
    R.turnPage(s, true); // the briefing
    prepare(s);
    if (!R.deployLineup(s)) throw new Error('could not deploy, seed ' + seed);
    deploy(s);
    const rec = fight(s);
    run.boards.push(rec);
    R.settle(s);
    R.turnPage(s, true);
    if (s.run.last.terminal || s.run.stage + 1 >= LAST) break;
    shop(s);
    if (!R.advance(s)) throw new Error('could not advance, seed ' + seed);
  }
  return run;
}

// ── Aggregation ─────────────────────────────────────────────────────────
function aggregate(runs) {
  const boards = Array.from({ length: 10 }, (_, i) => ({
    board: i + 1, reached: 0, wins: 0, rounds: 0, hpLeft: 0, downed: 0, side: 0, leaderFell: 0, timeout: 0,
    usage: { basic: 0, start: 0, tier1: 0, tier2: 0, tier3: 0, tier4: 0, manual: 0, wait: 0 }, maps: {}
  }));
  const heroes = {},
    arts = {};
  // The same, by map: each board's villains fight their own way, whichever stage meets them.
  const maps = Array.from({ length: MAP_LAYOUTS.length }, (_, i) => ({ map: i, reached: 0, wins: 0, rounds: 0, hpLeft: 0, stages: {}, events: {}, kind: null, sides: {}, side: 0, arrived: 0, enemies: 0, blocked: 0, lossLeader: 0, lossTime: 0, goalLeft: 0, objectLeft: 0, objectLost: 0, heldOut: 0 }));
  let misfires = 0;
  for (const run of runs)
    for (const b of run.boards) {
      const M = maps[b.map];
      M.reached++;
      for (const [k, n] of Object.entries(b.events || {})) M.events[k] = (M.events[k] || 0) + n;
      M.stages[b.stage + 1] = (M.stages[b.stage + 1] || 0) + 1;
      M.kind = b.kind;
      if (!b.won) {
        if (b.leaderFell) M.lossLeader++;
        else if (!b.objectLost) M.lossTime++;
        M.goalLeft += b.goalLeft;
      }
      if (b.objectLeft != null) M.objectLeft += b.objectLeft;
      if (b.objectLost) M.objectLost++;
      if (b.heldOut) M.heldOut++;
      M.arrived += b.arrived;
      M.enemies += b.enemies;
      M.blocked += b.blocked;
      if (b.side) M.side++;
      // The secondary by kind: drawn, met (won with it met), and how the rest ended.
      const S = (M.sides[b.sideKind || '-'] ??= { drawn: 0, met: 0, failed: 0, open: 0 });
      S.drawn++;
      if (b.side) S.met++;
      else if (b.sideState === 'failed') S.failed++;
      else S.open++;
      if (b.won) {
        M.wins++;
        M.rounds += b.rounds;
        M.hpLeft += b.hpLeft;
      }
      const B = boards[b.stage];
      B.reached++;
      B.maps[b.map] = (B.maps[b.map] || 0) + 1;
      misfires += b.misfires;
      if (b.won) {
        B.wins++;
        B.rounds += b.rounds;
        B.hpLeft += b.hpLeft;
      } else if (b.leaderFell) B.leaderFell++;
      else B.timeout++;
      B.downed += b.downed;
      if (b.side) B.side++;
      for (const [k, n] of Object.entries(b.usage)) B.usage[k] += n;
      for (const [k, a] of Object.entries(b.arts || {})) {
        const A = (arts[k] ??= { equipped: 0, used: 0 });
        A.equipped += a.equipped;
        A.used += a.used;
      }
      const totalKills = Object.values(b.heroes).reduce((n, h) => n + h.kills, 0),
        totalDealt = Object.values(b.heroes).reduce((n, h) => n + h.dealt, 0);
      for (const [id, h] of Object.entries(b.heroes)) {
        const H = (heroes[id] ??= { boards: 0, dealt: 0, taken: 0, kills: 0, teamKills: 0, teamDealt: 0, at: Array.from({ length: 10 }, () => ({ n: 0, level: 0, sp: 0, spent: 0 })) });
        H.boards++;
        H.dealt += h.dealt;
        H.taken += h.taken;
        H.kills += h.kills;
        H.teamKills += totalKills;
        H.teamDealt += totalDealt;
        const A = H.at[b.stage];
        A.n++;
        A.level += h.level;
        A.sp += h.sp;
        A.spent += h.spent;
      }
    }
  const r1 = (n) => Math.round(n * 10) / 10,
    r2 = (n) => Math.round(n * 100) / 100;
  return {
    boards: boards.filter((B) => B.board >= FIRST && B.board <= LAST).map((B) => {
      const acts = Object.values(B.usage).reduce((a, b) => a + b, 0) || 1;
      return {
        board: B.board,
        maps: B.maps,
        reached: B.reached,
        winRate: B.reached ? r2(B.wins / B.reached) : null,
        avgRounds: B.wins ? r1(B.rounds / B.wins) : null,
        hpLeft: B.wins ? r2(B.hpLeft / B.wins) : null,
        downed: B.reached ? r2(B.downed / B.reached) : null,
        sideRate: B.reached ? r2(B.side / B.reached) : null,
        lossLeader: B.leaderFell,
        lossTime: B.timeout,
        usage: Object.fromEntries(Object.entries(B.usage).map(([k, n]) => [k, r2(n / acts)]))
      };
    }),
    maps: maps.filter((M) => M.reached).map((M) => ({
      map: M.map,
      name: mapLayout(M.map).name,
      stages: M.stages,
      reached: M.reached,
      winRate: r2(M.wins / M.reached),
      avgRounds: M.wins ? r1(M.rounds / M.wins) : null,
      hpLeft: M.wins ? r2(M.hpLeft / M.wins) : null,
      lossLeader: M.lossLeader,
      lossTime: M.lossTime,
      goalLeftInLoss: M.lossLeader + M.lossTime ? r2(M.goalLeft / (M.lossLeader + M.lossTime)) : null,
      events: Object.fromEntries(Object.entries(M.events).map(([k, n]) => [k, r1(n / M.reached)])),
      kind: M.kind,
      sideRate: r2(M.side / M.reached),
      sides: Object.fromEntries(Object.entries(M.sides).sort().map(([k, S]) => [k, { ...S, rate: r2(S.met / S.drawn) }])),
      arrived: r1(M.arrived / M.reached),
      enemies: r1(M.enemies / M.reached),
      blocked: r1(M.blocked / M.reached),
      // Boards with objects: the share of their 氣血 left at the end, boards lost to one broken
      // (守), and boards won by holding to the last round rather than felling the masters.
      ...(['keep', 'break'].includes(M.kind) ? { objectLeft: r2(M.objectLeft / M.reached), lossObject: M.objectLost, heldOut: M.heldOut } : {})
    })),
    heroes: Object.fromEntries(
      Object.entries(heroes).sort().map(([id, H]) => [
        id,
        {
          name: G.DETAILS[id].name,
          boards: H.boards,
          dealtPerBoard: r1(H.dealt / H.boards),
          takenPerBoard: r1(H.taken / H.boards),
          killShare: H.teamKills ? r2(H.kills / H.teamKills) : 0,
          damageShare: H.teamDealt ? r2(H.dealt / H.teamDealt) : 0,
          levelAt: H.at.map((A) => (A.n ? r1(A.level / A.n) : null)),
          spentAt: H.at.map((A) => (A.n ? r1(A.spent / A.n) : null)),
          unspentAt: H.at.map((A) => (A.n ? r1(A.sp / A.n) : null))
        }
      ])
    ),
    // Per hero and art: boards it was equipped on, and uses per such board.
    arts: Object.fromEntries(
      Object.entries(arts).sort().map(([k, A]) => {
        const [hero, id] = k.split('/');
        const name = id === 'signature' ? G.DETAILS[hero].skill : TECHNIQUES[id]?.name || id;
        return [k, { name, equipped: A.equipped, used: A.used, perBoard: A.equipped ? r1(A.used / A.equipped) : null }];
      })
    ),
    misfires
  };
}

// ── Printing ────────────────────────────────────────────────────────────
const pad = (v, n) => String(v ?? '-').padEnd(n);
const lpad = (v, n) => String(v ?? '-').padStart(n);
const pc = (v) => (v == null ? '-' : Math.round(v * 100) + '%');
function print(out) {
  console.log('Simulated ' + out.meta.runs + ' runs, seed ' + out.meta.seed + ', boards ' + out.meta.boards + ', 境界 ' + (out.meta.realm || 1) + '.');
  console.log('\nPer board (won: rounds and health left are over won boards; usage is the share of hero actions)');
  console.log(pad('board', 6) + lpad('runs', 5) + lpad('win', 6) + lpad('rnds', 6) + lpad('hp', 6) + lpad('down', 6) + lpad('side', 6) + lpad('L:ldr', 6) + lpad('L:time', 7) + '   usage: ' + ['basic', 'start', 'tier1', 'tier2', 'tier3', 'tier4', 'manual', 'wait'].map((k) => pad(k, 7)).join(''));
  for (const b of out.boards)
    console.log(
      pad(b.board, 6) + lpad(b.reached, 5) + lpad(pc(b.winRate), 6) + lpad(b.avgRounds, 6) + lpad(pc(b.hpLeft), 6) + lpad(b.downed, 6) + lpad(pc(b.sideRate), 6) + lpad(b.lossLeader, 6) + lpad(b.lossTime, 7) + '          ' +
        ['basic', 'start', 'tier1', 'tier2', 'tier3', 'tier4', 'manual', 'wait'].map((k) => pad(pc(b.usage[k]), 7)).join('')
    );
  console.log('\nPer map (whichever stage it was met at; stages listed with their counts)');
  console.log('(L:ldr, L:time: losses by the leader falling and by the round limit; goal: share of the objective\'s health still standing in a loss)');
  console.log(pad('map', 4) + pad('name', 6) + lpad('runs', 5) + lpad('win', 6) + lpad('rnds', 6) + lpad('hp', 6) + lpad('L:ldr', 6) + lpad('L:time', 7) + lpad('goal', 6) + '   stages');
  for (const m of out.maps || [])
    console.log(
      pad(m.map, 4) + pad(m.name, 6) + lpad(m.reached, 5) + lpad(pc(m.winRate), 6) + lpad(m.avgRounds, 6) + lpad(pc(m.hpLeft), 6) + lpad(m.lossLeader, 6) + lpad(m.lossTime, 7) + lpad(pc(m.goalLeftInLoss), 6) + '   ' +
        Object.entries(m.stages).map(([k, n]) => k + ':' + n).join(' ')
    );
  console.log('\nKinds, secondaries and reinforcements per map (side: met over drawn, by kind; arr: wave pieces that entered, of all enemies)');
  console.log(pad('map', 4) + pad('name', 6) + pad('kind', 6) + lpad('side', 6) + lpad('arr', 6) + lpad('foes', 6) + lpad('blkd', 6) + '   by kind (met/failed/open of drawn; open: never met, or the board was lost)');
  for (const m of out.maps || [])
    console.log(
      pad(m.map, 4) + pad(m.name, 6) + pad(m.kind, 6) + lpad(pc(m.sideRate), 6) + lpad(m.arrived, 6) + lpad(m.enemies, 6) + lpad(m.blocked, 6) + '   ' +
        Object.entries(m.sides || {}).map(([k, S]) => k + ' ' + pc(S.rate) + ' (' + S.met + '/' + S.failed + '/' + S.open + ' of ' + S.drawn + ')').join(', ')
    );
  const objects = out.maps.filter((m) => m.objectLeft != null);
  if (objects.length) {
    console.log('\nBoards with objects (obj: share of their 氣血 left at the end; L:obj lost to one broken; held: won by holding)');
    for (const m of objects) console.log(pad(m.map, 4) + pad(m.name, 8) + pad(m.kind, 7) + lpad(pc(m.winRate), 6) + '  obj ' + lpad(pc(m.objectLeft), 5) + '  L:obj ' + lpad(m.lossObject, 3) + '  held ' + lpad(m.heldOut, 3) + ' of ' + m.reached);
  }
  console.log('\nVillain behaviour per board fought (log events per board, averaged over its runs)');
  for (const m of out.maps || [])
    console.log(pad(m.map, 4) + pad(m.name, 6) + '  ' + (Object.entries(m.events || {}).map(([k, n]) => k + ' ' + n).join(', ') || '-'));
  console.log('\nPer hero (per board fought; shares are of the team on the boards the hero fought)');
  console.log(pad('hero', 7) + pad('name', 5) + lpad('boards', 7) + lpad('dealt', 7) + lpad('taken', 7) + lpad('kills', 7) + lpad('dmg', 6) + '   level at board 1..10  /  points spent at board 1..10');
  for (const [id, h] of Object.entries(out.heroes))
    console.log(
      pad(id, 7) + pad(h.name, 5) + lpad(h.boards, 6) + lpad(h.dealtPerBoard, 7) + lpad(h.takenPerBoard, 7) + lpad(pc(h.killShare), 7) + lpad(pc(h.damageShare), 6) + '   ' +
        h.levelAt.map((v) => lpad(v == null ? '-' : Math.round(v), 2)).join(' ') + '  /  ' + h.spentAt.map((v) => lpad(v == null ? '-' : Math.round(v), 2)).join(' ')
    );
  if (ARTS && out.arts) {
    console.log('\nPer art (boards fought with it equipped, uses, uses per such board)');
    for (const [k, a] of Object.entries(out.arts)) console.log(pad(k, 28) + pad(a.name, 8) + lpad(a.equipped, 5) + lpad(a.used, 6) + lpad(a.perBoard, 6));
  }
  if (out.misfires) console.log('\n' + out.misfires + ' chosen option(s) the rules then refused (counted as waits).');
}
function compare(a, b) {
  console.log('Comparing ' + a.meta.runs + ' runs (seed ' + a.meta.seed + ') with ' + b.meta.runs + ' runs (seed ' + b.meta.seed + ').');
  const d = (x, y, f = (v) => v) => (x == null || y == null ? '-' : (y - x >= 0 ? '+' : '') + f(Math.round((y - x) * 100) / 100));
  console.log('\n' + pad('board', 6) + lpad('win a', 7) + lpad('win b', 7) + lpad('Δ', 7) + lpad('rnds a', 8) + lpad('rnds b', 8) + lpad('Δ', 6) + lpad('hp a', 6) + lpad('hp b', 6) + lpad('Δ', 7) + '  flag');
  for (const A of a.boards) {
    const B = b.boards.find((x) => x.board === A.board);
    if (!B) continue;
    const moved = A.winRate != null && B.winRate != null && Math.abs(B.winRate - A.winRate) > COMPARE_FLAG;
    console.log(
      pad(A.board, 6) + lpad(pc(A.winRate), 7) + lpad(pc(B.winRate), 7) + lpad(d(A.winRate, B.winRate, (v) => Math.round(v * 100) + 'pt'), 7) +
        lpad(A.avgRounds, 8) + lpad(B.avgRounds, 8) + lpad(d(A.avgRounds, B.avgRounds), 6) + lpad(pc(A.hpLeft), 6) + lpad(pc(B.hpLeft), 6) + lpad(d(A.hpLeft, B.hpLeft, (v) => Math.round(v * 100) + 'pt'), 7) +
        (moved ? '  << win rate moved more than ' + COMPARE_FLAG * 100 + 'pt' : '')
    );
  }
  console.log('\n' + pad('map', 4) + pad('name', 6) + lpad('win a', 7) + lpad('win b', 7) + lpad('side a', 8) + lpad('side b', 8) + lpad('Δ', 7) + '  flag');
  for (const A of a.maps || []) {
    const B = (b.maps || []).find((x) => x.map === A.map);
    if (!B) continue;
    const moved = A.sideRate != null && B.sideRate != null && Math.abs(B.sideRate - A.sideRate) > COMPARE_FLAG;
    console.log(
      pad(A.map, 4) + pad(A.name, 6) + lpad(pc(A.winRate), 7) + lpad(pc(B.winRate), 7) + lpad(pc(A.sideRate), 8) + lpad(pc(B.sideRate), 8) + lpad(d(A.sideRate, B.sideRate, (v) => Math.round(v * 100) + 'pt'), 7) +
        (moved ? '  << secondary success moved more than ' + COMPARE_FLAG * 100 + 'pt' : '')
    );
  }
  console.log('\n' + pad('hero', 7) + pad('name', 5) + lpad('dmg a', 7) + lpad('dmg b', 7) + lpad('Δ', 7) + lpad('dealt a', 9) + lpad('dealt b', 9) + lpad('kills a', 9) + lpad('kills b', 9));
  for (const [id, A] of Object.entries(a.heroes)) {
    const B = b.heroes[id];
    if (!B) continue;
    console.log(pad(id, 7) + pad(A.name, 5) + lpad(pc(A.damageShare), 7) + lpad(pc(B.damageShare), 7) + lpad(d(A.damageShare, B.damageShare, (v) => Math.round(v * 100) + 'pt'), 7) + lpad(A.dealtPerBoard, 9) + lpad(B.dealtPerBoard, 9) + lpad(pc(A.killShare), 9) + lpad(pc(B.killShare), 9));
  }
}

// ── Main ────────────────────────────────────────────────────────────────
if (COMPARING) {
  const i = args.indexOf('--compare');
  compare(JSON.parse(fs.readFileSync(args[i + 1], 'utf8')), JSON.parse(fs.readFileSync(args[i + 2], 'utf8')));
  process.exit(0);
}
const started = Date.now();
const runs = [];
let tracing = false;
for (let i = 0; i < RUNS; i++) {
  tracing = TRACE && i === 0;
  runs.push(playRun(hash(SEED, i)));
  if (!QUIET && process.stderr.isTTY && i % 10 === 9) process.stderr.write('\r' + (i + 1) + '/' + RUNS + ' runs');
}
if (!QUIET && process.stderr.isTTY) process.stderr.write('\r');
const out = { meta: { runs: RUNS, seed: SEED, boards: FIRST + '-' + LAST, realm: REALM, seconds: Math.round((Date.now() - started) / 1000) }, ...aggregate(runs) };
print(out);
if (JSON_OUT) {
  fs.writeFileSync(JSON_OUT, JSON.stringify(out, null, 1) + '\n');
  console.log('\nWrote ' + JSON_OUT);
}
