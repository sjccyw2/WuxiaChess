// A headless player that fights the real boards with the real rules and the real enemy code,
// so the game's difficulty can be compared before and after a change.
//
//   node tools/sim-battles.mjs [--runs N] [--seed S] [--boards A-B] [--json out.json]
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
const { mapLayout, fieldCells, tileInfo } = await import(new URL('../game/src/data/terrain.js', import.meta.url));

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
  foeEffectDefault: 1.2,
  allyEffect: { rally: 1.2, haste: 3 },
  allyEffectDefault: 0.8,
  medicineAt: 0.4, // drink medicine below this fraction of health (leader: + 0.15)
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
const QUIET = args.includes('--quiet');
// --trace prints the battle log of the first run, board by board, to see how the player plays.
const TRACE = args.includes('--trace');

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
function threatMap(s) {
  return G.enemies(s)
    .filter(G.living)
    .map((e) => {
      // Where the rules say it may end its action (a posted or charged piece stays put).
      const stand = G.standCells(s, e);
      const hits = new Set(),
        range = G.strikeReach(s, e);
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
function boardContext(s) {
  const boss = G.find(s, G.commanderId(s));
  const marker = G.unclaimedObjectiveTile(s);
  const ctx = {
    threats: threatMap(s),
    boss,
    bossField: boss && G.living(boss) ? fieldFrom(s.mapIndex, boss) : null,
    marker,
    markerField: marker ? fieldFrom(s.mapIndex, marker) : null,
    speed: s.run.goal === 'speed',
    escorts: new Set(G.wardEscorts(s)),
    runner: null
  };
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
function placeScore(s, u, ctx, hpAfter, gone) {
  const leader = u.id === s.leader;
  const d = dangerAt(s, u, ctx.threats, gone);
  let score = -d.expected * W.danger * (leader ? W.leaderCare : 1);
  if (d.total >= hpAfter) score -= leader ? W.leaderLethal : W.lethal + u.maxHp / 2;
  else if (leader && d.total >= hpAfter * 0.75) score -= W.leaderLethal / 20;
  score += (tileInfo(u.x, u.y, s.mapIndex)?.defense || 0) * W.cover;
  const heal = tileInfo(u.x, u.y, s.mapIndex)?.heal || 0;
  if (heal) score += Math.min(heal, u.maxHp - hpAfter) * 0.8;
  if (ctx.bossField && !gone.has(ctx.boss)) {
    const steps = Math.max(0, (ctx.bossField.get(key(u.x, u.y)) ?? 30) - reachOf(u));
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
  return score;
}
function foeValue(s, t, ctx) {
  let v = 1;
  if (t === ctx.boss) v = W.bossDamage * (ctx.speed ? W.speedBoss : 1);
  if (ctx.escorts.has(t)) v = W.escort;
  return v;
}
// What an option is worth, read entirely from the rules' forecast.
function strikeScore(s, u, t, f, ctx, mp) {
  let score = -mp * W.mp - f.hpCost * W.hpCost;
  const gone = new Set();
  const leader = u.id === s.leader;
  const dealt = Math.min(f.amount, t.hp);
  score += dealt * foeValue(s, t, ctx);
  if (f.amount >= t.hp) {
    gone.add(t);
    score += t === ctx.boss ? W.win : W.killBase + t.atk + (ctx.escorts.has(t) ? 40 : 0);
  } else
    for (const e of f.effects) score += (W.foeEffect[e.kind] ?? W.foeEffectDefault) * (e.power || 1) * Math.min(e.turns || 1, 2);
  for (const hit of f.splash) {
    const v = G.find(s, hit.id);
    if (!v || !G.living(v)) continue;
    score += Math.min(hit.amount, v.hp) * foeValue(s, v, ctx);
    if (hit.amount >= v.hp) {
      gone.add(v);
      score += v === ctx.boss ? W.win : W.killBase + v.atk;
    }
  }
  score += (f.reflected || 0) * 0.8 + (f.selfHeal || 0) * 0.8;
  const hpAfter = u.hp - f.hpCost - f.counter + (f.selfHeal || 0);
  score -= f.counter * W.counter * (leader ? W.leaderCare : 1);
  if (hpAfter <= 0) score -= leader ? W.leaderLethal * 10 : W.lethal * 3;
  return { score, hpAfter, gone };
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
    for (const e of f.effects)
      if (e.kind !== 'shield') score += (W.allyEffect[e.kind] ?? W.allyEffectDefault) * (e.power || 1) * Math.min(e.turns || 1, 2);
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
  const foes = G.enemies(s).filter(G.living),
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
      consider({ score: r.score + placeScore(s, u, ctx, r.hpAfter, r.gone), P, act: 'basic', t });
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
        r = f.support ? supportScore(s, u, t, f, ctx, mp) : strikeScore(s, u, t, f, ctx, mp);
        consider({ score: r.score + placeScore(s, u, ctx, r.hpAfter, r.gone), P, act: 'art', id, t });
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
  if (u.hp < u.maxHp * (W.medicineAt + (leader ? 0.15 : 0))) {
    const missing = u.maxHp - u.hp;
    const order = Object.entries(G.ITEMS)
      .filter(([id, it]) => it.kind === 'use' && it.hp && s.stock[id] > 0)
      .sort((a, b) => Math.abs(a[1].hp - missing) - Math.abs(b[1].hp - missing));
    if (order.length) G.consume(s, u, order[0][0]);
  }
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
  for (const u of G.party(s))
    rec.heroes[u.id] = { dealt: 0, taken: 0, kills: 0, level: u.level, sp: u.sp, spent: spentPoints(u) };
  if (TRACE) s.logs = [];
  while (!s.result) {
    allyPhase(s, rec);
    if (s.result) break;
    enemyPhase(s, rec);
  }
  const team = G.party(s);
  rec.won = s.result === 'win';
  rec.rounds = s.round;
  rec.hpLeft = team.reduce((n, u) => n + Math.max(0, u.hp), 0) / team.reduce((n, u) => n + u.maxHp, 0);
  rec.downed = team.filter((u) => !G.living(u)).length;
  rec.side = R.objective(s).done;
  rec.leaderFell = !G.living(G.find(s, s.leader));
  if (TRACE && tracing) {
    console.log('\n== board ' + (rec.stage + 1) + ' (map ' + s.mapIndex + ', ' + s.run.goal + ') ' + (rec.won ? 'won' : 'lost') + ' in ' + rec.rounds + ' rounds');
    for (const l of s.logs) if (l.type !== 'grow') console.log('  r' + l.round + ' ' + l.phase + ' ' + l.who + ': ' + l.text);
  }
  return rec;
}

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
  return { job: p.job, value: (amount / base) * scale };
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

// ── A run ───────────────────────────────────────────────────────────────
function playRun(seed) {
  const draw = R.drawLots(seed);
  const s = R.startRun(draw, R.LEGACY);
  const run = { seed, heroes: [...draw.ids], leader: s.leader, boards: [] };
  for (;;) {
    R.turnPage(s, true);
    prepare(s);
    if (!R.deployLineup(s)) throw new Error('could not deploy, seed ' + seed);
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
  const heroes = {};
  // The same, by map: each board's villains fight their own way, whichever stage meets them.
  const maps = Array.from({ length: 10 }, (_, i) => ({ map: i, reached: 0, wins: 0, rounds: 0, hpLeft: 0, stages: {} }));
  let misfires = 0;
  for (const run of runs)
    for (const b of run.boards) {
      const M = maps[b.map];
      M.reached++;
      M.stages[b.stage + 1] = (M.stages[b.stage + 1] || 0) + 1;
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
      hpLeft: M.wins ? r2(M.hpLeft / M.wins) : null
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
    misfires
  };
}

// ── Printing ────────────────────────────────────────────────────────────
const pad = (v, n) => String(v ?? '-').padEnd(n);
const lpad = (v, n) => String(v ?? '-').padStart(n);
const pc = (v) => (v == null ? '-' : Math.round(v * 100) + '%');
function print(out) {
  console.log('Simulated ' + out.meta.runs + ' runs, seed ' + out.meta.seed + ', boards ' + out.meta.boards + '.');
  console.log('\nPer board (won: rounds and health left are over won boards; usage is the share of hero actions)');
  console.log(pad('board', 6) + lpad('runs', 5) + lpad('win', 6) + lpad('rnds', 6) + lpad('hp', 6) + lpad('down', 6) + lpad('side', 6) + lpad('L:ldr', 6) + lpad('L:time', 7) + '   usage: ' + ['basic', 'start', 'tier1', 'tier2', 'tier3', 'tier4', 'manual', 'wait'].map((k) => pad(k, 7)).join(''));
  for (const b of out.boards)
    console.log(
      pad(b.board, 6) + lpad(b.reached, 5) + lpad(pc(b.winRate), 6) + lpad(b.avgRounds, 6) + lpad(pc(b.hpLeft), 6) + lpad(b.downed, 6) + lpad(pc(b.sideRate), 6) + lpad(b.lossLeader, 6) + lpad(b.lossTime, 7) + '          ' +
        ['basic', 'start', 'tier1', 'tier2', 'tier3', 'tier4', 'manual', 'wait'].map((k) => pad(pc(b.usage[k]), 7)).join('')
    );
  console.log('\nPer map (whichever stage it was met at; stages listed with their counts)');
  console.log(pad('map', 4) + pad('name', 6) + lpad('runs', 5) + lpad('win', 6) + lpad('rnds', 6) + lpad('hp', 6) + '   stages');
  for (const m of out.maps || [])
    console.log(pad(m.map, 4) + pad(m.name, 6) + lpad(m.reached, 5) + lpad(pc(m.winRate), 6) + lpad(m.avgRounds, 6) + lpad(pc(m.hpLeft), 6) + '   ' + Object.entries(m.stages).map(([k, n]) => k + ':' + n).join(' '));
  console.log('\nPer hero (per board fought; shares are of the team on the boards the hero fought)');
  console.log(pad('hero', 7) + pad('name', 5) + lpad('boards', 7) + lpad('dealt', 7) + lpad('taken', 7) + lpad('kills', 7) + lpad('dmg', 6) + '   level at board 1..10  /  points spent at board 1..10');
  for (const [id, h] of Object.entries(out.heroes))
    console.log(
      pad(id, 7) + pad(h.name, 5) + lpad(h.boards, 6) + lpad(h.dealtPerBoard, 7) + lpad(h.takenPerBoard, 7) + lpad(pc(h.killShare), 7) + lpad(pc(h.damageShare), 6) + '   ' +
        h.levelAt.map((v) => lpad(v == null ? '-' : Math.round(v), 2)).join(' ') + '  /  ' + h.spentAt.map((v) => lpad(v == null ? '-' : Math.round(v), 2)).join(' ')
    );
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
const out = { meta: { runs: RUNS, seed: SEED, boards: FIRST + '-' + LAST, seconds: Math.round((Date.now() - started) / 1000) }, ...aggregate(runs) };
print(out);
if (JSON_OUT) {
  fs.writeFileSync(JSON_OUT, JSON.stringify(out, null, 1) + '\n');
  console.log('\nWrote ' + JSON_OUT);
}
