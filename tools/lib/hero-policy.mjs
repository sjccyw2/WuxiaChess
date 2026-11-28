// The simulated player: a fixed, simple player of the hero side, shared by the balance tool
// (tools/sim-battles.mjs, which measures the game with it) and developer mode's 自動對弈
// (game/src/ui/autoplay.js, which plays a board with it on screen), so both play the same way.
//
// It asks the rules what it may do, scores every legal option with the rules' own `forecast`, and
// takes the best. It knows nothing about particular arts; it reads what forecast says an option
// will do. Nothing here is random: the same board in the same state gets the same moves.
//
// Between boards it spends 武學點 toward each hero's summit (spendPoints), puts on the best
// weapons and gear in the stock (equipItems), picks three arts of different jobs (equipArts), and
// buys medicine and kit at the shop (shop).
//
// It loads only the game's own modules and ./skill-measure.mjs, so a browser can load it as it is.
import { G, R, TECHNIQUES, HERO_PATHS, profile, classify, mainMeasure, heroTree, ancestors } from './skill-measure.mjs';
const FM = await import(new URL('../../game/src/rules/ferry-market.js', import.meta.url));
const { mapLayout, fieldCells, tileInfo } = await import(new URL('../../game/src/data/terrain.js', import.meta.url));

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
  poisonLayer: 0.8, // a poison layer's damage to come, against a blow's damage now
  allyEffect: { rally: 1.2, haste: 3 },
  allyEffectDefault: 0.8,
  // 定身, 閉穴, 受制: per point of the blow the held foe would have struck, per turn it is held
  // beyond what already holds it (a 閉穴 foe still walks, so a little less); a 受制 one also strikes
  // its own side, for this share of its blow. Its first turn on the striker himself is in his
  // place score instead (the danger where he ends leaves the held foe out).
  hold: { freeze: 1.0, charm: 1.0, mute: 0.85 },
  holdIdle: 0.4, // ...of the blow it could strike on someone, when it has no hero in reach now
  turncoat: 0.6,
  // 金剛 and 固守 on whoever a support art reaches: per point of the next enemy phase's expected
  // damage voided (金剛) or taken off by the 防禦 (固守); later turns count at holdLater.
  immune: 1.0,
  fortify: 0.9,
  holdLater: 0.5,
  equipHold: 0.5, // choosing arts: a turn a foe is held, in basic attacks (W.hold weights the kinds)
  // 挑釁 and 代受: the enemy blows a guard draws onto himself from softer companions. In play the
  // gain is read from the threats (guardShift); choosing arts, a taunt is worth this many basic
  // attacks per tile of its radius, and a cover this many (it guards only those beside him).
  equipTaunt: 0.45,
  equipCover: 0.6,
  medicineAt: 0.4, // drink medicine below this fraction of health (leader: + 0.15)
  // 守: the object the heroes keep
  keepThreat: 1.7, // a point of damage on a foe that could strike the kept object next turn
  keepNear: 5, // per tile a hero stands beyond two of the kept object (the leader: half)
  keepBlock: 10, // a hero standing on a tile beside the kept object
  // Spending between boards
  reserveSummitUntilStage: 7
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
  // A piece held by 定身, 閉穴 or 受制 strikes no hero next enemy phase (G.holdsFire).
  return [...G.enemies(s).filter((e) => G.living(e) && !G.holdsFire(e)), ...ghosts].flatMap((e) => {
    // Where the rules say it may end its action (a posted or charged piece stays put).
    const stand = G.standCells(seen, e);
    // 五劍 (求敗's stages), which the danger zone does not draw: in 無劍 he is beside 無名 before he
    // acts, so he threatens round 無名 wherever he stands; in 利劍 each of his blows lands twice;
    // in 木劍 he acts twice, the second time after another walk, so that blow reaches farther.
    const st = G.stageOf(e),
      mark = st?.blink && G.find(s, st.solo);
    if (mark && G.living(mark)) stand.push({ x: mark.x, y: mark.y });
    const art = G.signatureDue(s, e) ? G.enemyTechnique(e, s) : null,
      factor = (art ? art.factor : 1) * (1 + (st?.twice || 0));
    const reach = G.strikeReach(seen, e) + (mark ? 1 : 0),
      walk = st?.step ?? G.stat(e, 'step', s);
    return Array.from({ length: st?.turns || 1 }, (_, turn) => {
      const hits = new Set(),
        range = reach + turn * walk;
      for (const p of stand)
        for (let dx = -range; dx <= range; dx++)
          for (let dy = -range + Math.abs(dx); dy <= range - Math.abs(dx); dy++) hits.add(key(p.x + dx, p.y + dy));
      return { e, hits, factor };
    });
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
  // 問劍 (the last board) is won on its master too, by bringing him to 1 氣血.
  if (kind === 'slay' || kind === 'yield')
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
  if (after?.guard?.taunt || after?.guard?.cover) score += guardShift(s, u, ctx, after.held ? new Set([...gone, ...after.held]) : gone, after.guard, hpAfter, d);
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
// 固守 on a strike guard the striker; 挑釁 and 代受 stand on the caster whatever the art aims at).
function selfGuard(art) {
  if (!art) return null;
  const strike = !G.isSupport(art);
  const guard = {
    immune: strike && !!art.immune,
    fortify: strike ? art.fortify?.power || 0 : 0,
    taunt: art.taunt || 0,
    cover: !!art.cover
  };
  return guard.immune || guard.fortify || guard.taunt || guard.cover ? guard : null;
}
// 挑釁 and 代受: what the guard u leaves for the coming enemy phase is worth, as blows moved.
// A taunt binds every foe within its radius that can strike him where he ends (G.taunters); a
// cover takes every direct blow aimed at a companion beside him. Worth the danger lifted off the
// companions (more for the leader, less for one who may still walk away), less what he takes on:
// every bound foe strikes him for certain, and a covered companion's foes may turn on him. `d` is
// his own danger before the guard, with his other guards counted (placeScore).
function guardShift(s, u, ctx, gone, guard, hpAfter, d) {
  const here = key(u.x, u.y),
    leader = u.id === s.leader;
  const drawn = guard.taunt
    ? ctx.threats.filter((th) => !gone.has(th.e) && G.distance(th.e, u) <= guard.taunt && th.hits.has(here)).map((th) => th.e)
    : [];
  const without = new Set([...gone, ...drawn]);
  let relief = 0;
  const turned = new Set(); // foes that would strike a covered companion
  for (const v of G.party(s)) {
    if (v === u || !G.living(v)) continue;
    const before = dangerAt(s, v, ctx.threats, gone);
    if (!before.total) continue;
    const covered = guard.cover && G.distance(u, v) === 1;
    const after = covered ? { total: 0, expected: 0 } : dangerAt(s, v, ctx.threats, without);
    const free = G.canAct(s, v); // he may still walk out of reach this turn
    relief += (before.expected - after.expected) * W.danger * (v.id === s.leader ? leaderCare(ctx) : 1) * (free ? 0.5 : 1);
    if (!free && before.total >= v.hp && after.total < v.hp) relief += v.id === s.leader ? W.leaderLethal / 20 : W.lethal;
    if (covered) for (const th of ctx.threats) if (!without.has(th.e) && th.hits.has(key(v.x, v.y)) && !th.hits.has(here)) turned.add(th.e);
  }
  if (guard.immune) return relief; // 金剛: nothing the guard draws lands on him
  // What lands on him: each bound foe's whole blow, the rest of his danger as before, and a
  // covered companion's foes as if they came for him.
  const blow = (th) => Math.round(G.damage(th.e, u, false, s.mapIndex, s) * th.factor);
  const fort = guard.fortify ? { fortify: guard.fortify } : null;
  const bound = withGuard(s, u, fort, () => ctx.threats.filter((th) => drawn.includes(th.e)).reduce((n, th) => n + blow(th), 0));
  const rest = withGuard(s, u, fort, () => dangerAt(s, u, ctx.threats.filter((th) => !drawn.includes(th.e)), gone));
  const extra = withGuard(s, u, fort, () => dangerAt(s, u, ctx.threats.filter((th) => turned.has(th.e)).map((th) => ({ ...th, hits: new Set([here]) })), gone));
  const expected = bound + rest.expected + extra.expected,
    total = d.total + extra.total;
  let score = relief - Math.max(0, expected - d.expected) * W.danger * (leader ? leaderCare(ctx) : 1);
  if (total >= hpAfter && d.total < hpAfter) score -= leader ? W.leaderLethal : W.lethal * (ctx.sidePolicy.lethal || 1) + u.maxHp / 2;
  return score;
}
// Runs fn with 固守's 防禦 laid on u for the count, as guardedDanger does.
function withGuard(s, u, guard, fn) {
  if (!guard?.fortify) return fn();
  const had = u.conditions;
  u.conditions = { ...(had || {}), fortify: { power: Math.max(guard.fortify, had?.fortify?.power || 0), through: s.round + 1 } };
  try {
    return fn();
  } finally {
    u.conditions = had;
  }
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
// The last round t is held through already.
function heldThrough(s, t) {
  const c = t.conditions || {};
  let n = s.round - 1;
  for (const k of ['freeze', 'mute', 'charm']) if (c[k]) n = Math.max(n, c[k].through);
  return n;
}
// What holding t is worth: the blows it is kept from, per turn beyond what holds it already. The
// first turn's blow on the striker is left to his place score (placeScore's `held`).
function holdValue(s, u, t, f, ctx) {
  const was = heldThrough(s, t);
  let best = 0;
  for (const e of f.effects) {
    if (!(e.kind in W.hold)) continue;
    const through = s.round + (e.turns || 1) - 1;
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
  unhurtDanger: 4, intactLethal: 3, spareLife: -80, oneBlow: 40, summit: 60, splashFell: 40
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
  },
  // 隔山打牛: a blow whose splash fells a piece other than the one it struck.
  splashFell: {
    fell: (s, side, blow) => ({ score: [...blow.gone].some((v) => v !== blow.struck) ? SIDE_W.splashFell : 0 })
  },
  // 一擊斃命: a blow that fells a piece from full 氣血.
  oneBlow: {
    fell: (s, side, blow) => ({ score: blow.main && blow.fresh ? SIDE_W.oneBlow : 0 })
  },
  // 絕技收官: the master felled by a 成名絕技; any other blow that would fell him waits, until late.
  summitFinish: {
    fell: (s, side, blow) => {
      if (![...blow.gone].some((v) => G.masterIds(s).includes(v.id))) return { score: 0 };
      if (blow.summit) return { score: SIDE_W.summit };
      return s.round >= SIDE_W.lateRound ? { score: 0 } : { score: SIDE_W.lastBlowOther, holdWin: true };
    }
  },
  // 留活口: never fell the piece named, unless late in the board, as for lastBlow and order.
  spareLife: {
    fell: (s, side, blow) => {
      const target = piece(s, side.target);
      if (!target || !blow.gone.has(target) || s.round >= SIDE_W.lateRound) return { score: 0 };
      return { score: SIDE_W.spareLife, holdWin: true };
    }
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
  // 問劍: the blow that leaves the board's master at 1 氣血 wins it; no one falls.
  if (G.boardKind(s) === 'yield' && G.masterIds(s).includes(victim.id) && victim.hp - dealt <= 1) score += W.win;
  const held = new Set();
  if (f.amount >= victim.hp) gone.add(victim);
  else if (!G.immuneTo(victim)) {
    for (const e of f.effects)
      if (e.kind === 'poison')
        // A poison layer (0.71) is worth the damage it will do, as a blow's is, up to what is left.
        score += Math.min(e.power * (e.turns || 1), victim.hp - dealt) * foeValue(s, victim, ctx) * W.poisonLayer;
      else if (!(e.kind in W.hold)) score += (W.foeEffect[e.kind] ?? W.foeEffectDefault) * (e.power || 1) * Math.min(e.turns || 1, 2);
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
      combo: !!(f.plan?.spentMark || f.plan?.spentPoison),
      answered: !!art?.answer && G.strikeFactor(s, u, art, victim).notes.some((n) => n.startsWith('破招 · ')),
      fresh: gone.has(victim) && victim.hp >= victim.maxHp,
      struck: victim,
      summit: art?.kind === 'refinement' && gone.has(victim)
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
        r.after ??= { guard: selfGuard(art) }; // a support art's 挑釁 or 代受 stands on its caster
        consider({ score: r.score + placeScore(s, u, ctx, r.hpAfter, r.gone, r.after), P, act: 'art', id, t });
      }
    }
  }
  Object.assign(u, home);
  return { ...best, margin: best.score - bestWait.score, u };
}

// ── A board ─────────────────────────────────────────────────────────────
// `consume` takes a dose: the rules' own by default; developer mode's 自動對弈 passes the game's,
// which also plays its sound and says so (game/src/ui/autoplay.js).
function useMedicine(s, u, consume = G.consume) {
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
    if (order.length) consume(s, u, order[0][0]);
  }
  if (rule) return;
  const cheapest = Math.min(...G.equippedArts(u).map((id) => G.cost(u, s, id)));
  if (Number.isFinite(cheapest) && u.mp < cheapest) {
    const mpItem = Object.entries(G.ITEMS).find(([id, it]) => it.kind === 'use' && it.mp && s.stock[id] > 0);
    if (mpItem && s.round <= G.roundLimit(s) - 2) consume(s, u, mpItem[0]);
  }
}

// One choice of the hero phase: every hero who can still act takes his medicine first (once a
// phase: `dosed` holds who has), then the hero whose best option beats waiting by the most acts.
// Null once the rules say no hero can do anything more.
function pickAction(s, dosed, consume = G.consume) {
  const actors = G.party(s).filter((u) => G.canAct(s, u));
  if (!actors.length) return null;
  for (const u of actors) if (!dosed.has(u.id)) (dosed.add(u.id), useMedicine(s, u, consume));
  const ctx = boardContext(s);
  let pick = null;
  for (const u of actors) {
    const o = bestOption(s, u, ctx);
    if (!pick || o.margin > pick.margin) pick = o;
  }
  return pick;
}
// 回身: a hero the rules still let walk after his strike takes the best place within the steps
// left (that tile), or stays where he stands if that is better (null).
function glideSpot(s, u) {
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
  return best.p;
}

// ── Between boards ──────────────────────────────────────────────────────
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
  // 定身, 閉穴, 受制: the turns a foe is kept from striking, which the damage measure leaves out.
  const art = id === 'basic' ? null : id === 'signature' ? G.artFor(G.startingHero(heroId), 'signature') : TECHNIQUES[id];
  let held = 0;
  for (const k of ['freeze', 'mute', 'charm']) if (art?.[k]) held += (art[k].turns || 1) * W.hold[k] * (k === 'charm' ? 1 + W.turncoat : 1);
  // 挑釁 and 代受: the blows drawn off softer companions, which the damage measure leaves out.
  const drawn = (art?.taunt || 0) * W.equipTaunt + (art?.cover ? W.equipCover : 0);
  return { job: p.job, value: (amount / base) * scale + held * W.equipHold + drawn };
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
// 韋小寶's shop: the dice cups first (the first cup, when he has brought them, or when 籌碼 can
// open them; then a second cup whenever 籌碼 allow), then purchases one at a time (nextBuy) until
// none is worth it, at most twelve.
function shop(s) {
  const r = s.run;
  if (FM.canOpenTable(s)) FM.openTable(s);
  if (r.last?.visit && FM.coverBowls(s)) FM.pickBowl(s, 0);
  if (FM.canLiftAgain(s)) FM.pickBowl(s, r.last.visit.pick === 0 ? 1 : 0);
  for (let guard = 0; guard < 12; guard++) {
    const id = nextBuy(s);
    if (!id) break;
    R.buy(s, id);
  }
}
// The next thing to buy, or null: the cheapest medicine while the stock holds fewer than four
// healing doses, else the weapon or gear that most raises a hero for its price, keeping 10 兩 back.
// (自動整輪 asks it once a purchase, so each shows on screen.)
function nextBuy(s) {
  const r = s.run;
  const healing = () => Object.entries(s.stock).filter(([id, n]) => G.ITEMS[id]?.kind === 'use' && G.ITEMS[id].hp).reduce((a, [, n]) => a + n, 0);
  const offers = r.shop.filter((o) => o.left > 0 && o.price <= r.coins && G.ITEMS[o.id]);
  const meds = offers.filter((o) => G.ITEMS[o.id].kind === 'use' && G.ITEMS[o.id].hp).sort((a, b) => a.price - b.price);
  if (healing() < 4 && meds.length) return meds[0].id;
  const kit = offers
    .filter((o) => G.ITEMS[o.id].kind !== 'use' && r.coins - o.price >= 10)
    .map((o) => ({ o, g: Math.max(...G.company(s).map((u) => itemGain(s, u, o.id))) }))
    .filter((x) => x.g > 1)
    .sort((a, b) => b.g / b.o.price - a.g / a.o.price);
  return kit.length ? kit[0].o.id : null;
}
function prepare(s) {
  for (const u of G.company(s)) spendPoints(s, u);
  equipItems(s);
  for (const u of G.company(s)) equipArts(s, u);
}

// The deployment step: the leader takes the post where the least could strike him (danger
// total, reinforcements due next round included; ties: farthest from the nearest enemy), the
// others swap as that needs. Answers the leader's post now (`from`, -1 if not on one) and the
// post to swap it with (`to`); the caller swaps and begins the battle (開戰).
function deployPost(s) {
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
  return { from, to: best.i };
}

export {
  W,
  SIDE_W,
  SIDE_POLICY,
  key,
  unkey,
  threatMap,
  dangerAt,
  boardContext,
  bestOption,
  useMedicine,
  pickAction,
  glideSpot,
  worth,
  spendPoints,
  equipItems,
  equipArts,
  prepare,
  shop,
  nextBuy,
  deployPost
};
