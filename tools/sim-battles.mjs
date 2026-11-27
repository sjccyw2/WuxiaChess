// A headless player that fights the real boards with the real rules and the real enemy code,
// so the game's difficulty can be compared before and after a change.
//
//   node tools/sim-battles.mjs [--runs N] [--seed S] [--boards A-B] [--realm 1-5] [--json out.json]
//                              [--trace | --trace-map M] [--arts]
//
// Boards are 1 to 11. The eleventh is the last board (終局), which a run reaches only in 無劍境界
// after its ten are won: `--realm 5 --boards 1-11` plays whole runs to it. This player seldom
// gets that far in 無劍境界, so `--last [--level N]` measures the last board on its own: each run
// takes twelve heroes at level N (default 11, what the runs that do get there have), wins the
// tenth board at once, visits the shop with a test purse, and fights the last board.
//   node tools/sim-battles.mjs --compare before.json after.json
//   node tools/sim-battles.mjs --growth   (also: the levels and points of the team, the bench and
//                                          each recruit after every board won)
//
// Runs are built the way the game builds them (draw three heroes, start the run, deploy, settle
// a won board, take the reward, visit the shop, move on), so recruits join, levels accumulate and
// points are spent as in play. The hero side is a fixed, simple player: it asks the rules what
// it may do, scores every legal option with the rules' own `forecast`, and takes the best. It
// knows nothing about particular arts; it reads what forecast says an option will do.
import fs from 'node:fs';
import { G, R, TECHNIQUES } from './lib/skill-measure.mjs';
// The player itself (its weights, its reading of the board, its choices between boards) is
// tools/lib/hero-policy.mjs, which developer mode's 自動對弈 plays on screen too.
import { pickAction, glideSpot, deployPost, prepare, shop } from './lib/hero-policy.mjs';
const { mapLayout, MAP_LAYOUTS } = await import(new URL('../game/src/data/terrain.js', import.meta.url));

const COMPARE_FLAG = 0.1; // flag a board whose win rate moves by more than this
const STAGES = 11; // the ten boards of a run, and the last board after them in 無劍境界

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
// --last: only the last board, with a company as a run in 無劍境界 brings to it (see the header).
const LAST_ONLY = args.includes('--last');
const LEVEL = Math.max(1, Number(opt('--level', 11)) || 11);
// --arts also prints, per art, the boards it was equipped on and how often it was used there.
const ARTS = args.includes('--arts');
// --trace prints the battle log of the first run, board by board, to see how the player plays.
const TRACE = args.includes('--trace');
// --trace-map M prints the battle log of the first board fought on map M, in whichever run.
const TRACE_MAP = opt('--trace-map', null) == null ? null : Number(opt('--trace-map'));
const traced = new Set();
// --growth prints, after each board won, the levels and 武學點 of the heroes who fought it, of
// those on the bench, and of the hero who joins: how far a recruit and the bench trail the team.
const GROWTH_REPORT = args.includes('--growth');
const growthRows = [];

const hash = (a, b) => {
  let n = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b + 0x632be5ab, 0xc2b2ae35);
  n = Math.imul(n ^ (n >>> 15), 0x2c1b3c6d);
  return (n ^ (n >>> 12)) >>> 0;
};


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
  // Health lost by foes goes to the actor, health lost by heroes is what they took; health a hero
  // regains in the actor's own action is what the actor healed (himself included).
  for (const [v, hp] of before) {
    const lost = hp - v.hp;
    if (lost < 0 && v.side === 'ally' && actor && rec.heroes[actor] && G.living(v)) rec.heroes[actor].healed -= lost;
    if (lost <= 0) continue;
    if (v.side === 'ally') rec.heroes[v.id].taken += lost;
    else if (actor && rec.heroes[actor]) {
      rec.heroes[actor].dealt += lost;
      if (v.hp <= 0 && hp > 0) rec.heroes[actor].kills++;
    }
  }
}

// ── A board ─────────────────────────────────────────────────────────────
function allyPhase(s, rec) {
  const dosed = new Set();
  // Keep choosing until the rules say no hero can do anything more.
  for (let guard = 0; guard < 60 && !s.result; guard++) {
    const pick = pickAction(s, dosed);
    if (!pick) return;
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
// 回身: the simulated player's walk after the strike, or none (hero-policy.mjs glideSpot).
function glide(s, u) {
  const p = glideSpot(s, u);
  if (p) G.glideMove(s, u, p.x, p.y);
  else G.stopGlide(s, u);
}
function enemyPhase(s, rec) {
  if (!G.startEnemy(s)) return;
  for (let guard = 0; guard < 40 && !s.result; guard++) {
    const e = G.enemies(s).find((v) => G.living(v) && !v.acted);
    if (!e) break;
    const before = hpSnapshot(s);
    // 受制: what a turned foe does to its own side is the doing of the hero who turned it.
    const turner = G.charmed(e) ? rec.heroes[e.conditions.charm.source] : null;
    // 挑釁: the heroes this foe is bound to strike as it begins (the rules' own taunters).
    const bound = turner ? [] : G.taunters(s, e).map((v) => v.id);
    rec.coverLine = null;
    const effects = G.enemyAct(s, e);
    const target = effects[0] && G.find(s, effects[0][0]);
    if (turner) {
      for (const [v, hp] of before) if (v.side === 'enemy' && hp > v.hp) turner.turned += hp - v.hp;
      continue;
    }
    credit(rec, before, s, target?.side === 'ally' ? target.id : null);
    // A blow that landed on a hero: counted, and counted as drawn when a 挑釁 bound the foe to him
    // or he stepped in for a companion (代受's line in the log, by the coverer's name).
    if (target?.side === 'ally' && rec.heroes[target.id]) {
      const h = rec.heroes[target.id];
      h.struck++;
      if (bound.includes(target.id)) h.taunted++;
      else if (rec.coverLine === G.unitDetails(target).name) h.covered++;
    }
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
    rec.heroes[u.id] = { dealt: 0, taken: 0, kills: 0, healed: 0, turned: 0, struck: 0, taunted: 0, covered: 0, level: u.level, sp: u.sp, spent: spentPoints(u) };
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
    if (entry.phase === 'enemy' && /^挺身代.+受招。$/.test(entry.text)) rec.coverLine = entry.who;
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
  rec.leader = s.leader;
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
  const goal = ['slay', 'keep', 'yield'].includes(rec.kind) ? G.masterIds(s).map((id) => G.find(s, id)).filter(Boolean) : rec.kind === 'break' ? G.props(s) : G.enemies(s);
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
  ['ropeBroke', (e) => e.who === '星索'],
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
// The deployment step: the leader to the post the simulated player picks (hero-policy.mjs
// deployPost), then 開戰.
function deploy(s) {
  const { from, to } = deployPost(s);
  if (from >= 0 && to !== from && !R.swapStart(s, from, to)) throw new Error('could not swap the leader to post ' + to);
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
    if (GROWTH_REPORT && rec.won) noteGrowth(s);
    R.turnPage(s, true);
    if (s.run.last.terminal || s.run.stage + 1 >= LAST) break;
    shop(s);
    if (!R.advance(s)) throw new Error('could not advance, seed ' + seed);
  }
  return run;
}

// --growth: one row per board won, measured when it is settled (the recruit has just joined).
function noteGrowth(s) {
  const r = s.run,
    row = (growthRows[r.stage] ??= { n: 0, field: [0, 0], bench: [0, 0, 0], newcomer: [0, 0, 0] });
  const points = (u) => u.sp + spentPoints(u);
  const field = G.party(s),
    newcomer = r.bench.find((u) => u.id === r.last.recruit),
    bench = r.bench.filter((u) => u !== newcomer);
  row.n++;
  row.field[0] += field.reduce((n, u) => n + u.level, 0) / field.length;
  row.field[1] += field.reduce((n, u) => n + points(u), 0) / field.length;
  if (bench.length) {
    row.bench[0] += bench.reduce((n, u) => n + u.level, 0) / bench.length;
    row.bench[1] += bench.reduce((n, u) => n + points(u), 0) / bench.length;
    row.bench[2]++;
  }
  if (newcomer) {
    row.newcomer[0] += newcomer.level;
    row.newcomer[1] += points(newcomer);
    row.newcomer[2]++;
  }
}
function printGrowth() {
  const f = (v) => (Number.isFinite(v) ? v.toFixed(1) : '-').padStart(6);
  console.log('\nAfter board  won   field lv  pts   bench lv  pts   newcomer lv  pts');
  growthRows.forEach((row, stage) => {
    if (!row) return;
    console.log(
      String(stage + 1).padStart(11) +
        String(row.n).padStart(5) +
        '   ' + f(row.field[0] / row.n) + f(row.field[1] / row.n) +
        '   ' + f(row.bench[0] / row.bench[2]) + f(row.bench[1] / row.bench[2]) +
        '      ' + f(row.newcomer[0] / row.newcomer[2]) + f(row.newcomer[1] / row.newcomer[2])
    );
  });
}

// The last board alone (--last): the twelve heroes a run has by then (three drawn and one more
// for each of nine boards won), in a seeded order, the first four beside 無名.
function playLast(seed) {
  const ids = [...G.PARTY]
    .map((id, i) => [id, hash(seed, 100 + i)])
    .sort((a, b) => a[1] - b[1])
    .map(([id]) => id)
    .slice(0, 12);
  const s = R.devTestRun({ map: 9, realm: 5, heroes: ids, seed }, { ...R.LEGACY, realms: 5 });
  for (const u of G.company(s)) G.raiseLevel(u, LEVEL - u.level);
  R.devFinish(s, true);
  R.settle(s);
  R.turnPage(s, true);
  shop(s);
  if (!R.advance(s)) throw new Error('could not advance to the last board, seed ' + seed);
  const run = { seed, heroes: ids.slice(0, 4), leader: s.leader, boards: [] };
  R.turnPage(s, true);
  R.turnPage(s, true);
  prepare(s);
  if (!R.deployLineup(s)) throw new Error('could not deploy, seed ' + seed);
  deploy(s);
  run.boards.push(fight(s));
  R.settle(s);
  return run;
}

// ── Aggregation ─────────────────────────────────────────────────────────
function aggregate(runs) {
  const boards = Array.from({ length: STAGES }, (_, i) => ({
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
        totalDealt = Object.values(b.heroes).reduce((n, h) => n + h.dealt, 0),
        totalStruck = Object.values(b.heroes).reduce((n, h) => n + (h.struck || 0), 0);
      for (const [id, h] of Object.entries(b.heroes)) {
        const H = (heroes[id] ??= { boards: 0, dealt: 0, taken: 0, kills: 0, teamKills: 0, teamDealt: 0, healed: 0, turned: 0, struck: 0, taunted: 0, covered: 0, teamStruck: 0, led: 0, ledLost: 0, at: Array.from({ length: STAGES }, () => ({ n: 0, level: 0, sp: 0, spent: 0 })) });
        H.boards++;
        H.dealt += h.dealt;
        H.taken += h.taken;
        H.kills += h.kills;
        H.teamKills += totalKills;
        H.teamDealt += totalDealt;
        for (const k of ['healed', 'turned', 'struck', 'taunted', 'covered']) H[k] += h[k] || 0;
        H.teamStruck += totalStruck;
        // Boards he led, and those lost by the leader falling.
        if (b.leader === id) {
          H.led++;
          if (!b.won && b.leaderFell) H.ledLost++;
        }
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
    boards: boards.filter((B) => (LAST_ONLY ? B.board === STAGES : B.board >= FIRST && B.board <= LAST)).map((B) => {
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
          // What a support's or a guard's worth is: 氣血 restored, damage done by foes he turned
          // (受制), the enemy blows that landed on him, and of those the ones drawn by 挑釁 or 代受.
          healedPerBoard: r1(H.healed / H.boards),
          turnedPerBoard: r1(H.turned / H.boards),
          struckPerBoard: r2(H.struck / H.boards),
          struckShare: H.teamStruck ? r2(H.struck / H.teamStruck) : 0,
          tauntedPerBoard: r2(H.taunted / H.boards),
          coveredPerBoard: r2(H.covered / H.boards),
          drawn: H.taunted + H.covered,
          led: H.led,
          ledLostLeader: H.ledLost,
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
  console.log(pad('hero', 7) + pad('name', 5) + lpad('boards', 7) + lpad('dealt', 7) + lpad('taken', 7) + lpad('kills', 7) + lpad('dmg', 6) + '   level at board 1..' + STAGES + '  /  points spent at board 1..' + STAGES);
  for (const [id, h] of Object.entries(out.heroes))
    console.log(
      pad(id, 7) + pad(h.name, 5) + lpad(h.boards, 6) + lpad(h.dealtPerBoard, 7) + lpad(h.takenPerBoard, 7) + lpad(pc(h.killShare), 7) + lpad(pc(h.damageShare), 6) + '   ' +
        h.levelAt.map((v) => lpad(v == null ? '-' : Math.round(v), 2)).join(' ') + '  /  ' + h.spentAt.map((v) => lpad(v == null ? '-' : Math.round(v), 2)).join(' ')
    );
  console.log('\nPer hero, support and guard (per board fought: healed; turned = damage dealt by foes he turned (受制); struck = enemy blows landed on him, and his share of the team\'s; taunt, cover = of those, drawn by 挑釁 and by 代受; drawn = both, in all; led = boards he led, L:ldr = of those lost by the leader falling)');
  console.log(pad('hero', 9) + pad('name', 5) + lpad('healed', 7) + lpad('turned', 7) + lpad('struck', 7) + lpad('share', 6) + lpad('taunt', 7) + lpad('cover', 7) + lpad('drawn', 7) + lpad('led', 6) + lpad('L:ldr', 6));
  for (const [id, h] of Object.entries(out.heroes))
    console.log(
      pad(id, 9) + pad(h.name, 5) + lpad(h.healedPerBoard, 7) + lpad(h.turnedPerBoard, 7) + lpad(h.struckPerBoard, 7) + lpad(pc(h.struckShare), 6) + lpad(h.tauntedPerBoard, 7) + lpad(h.coveredPerBoard, 7) + lpad(h.drawn, 7) + lpad(h.led, 6) + lpad(h.ledLostLeader, 6)
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
  runs.push(LAST_ONLY ? playLast(hash(SEED, i)) : playRun(hash(SEED, i)));
  if (!QUIET && process.stderr.isTTY && i % 10 === 9) process.stderr.write('\r' + (i + 1) + '/' + RUNS + ' runs');
}
if (!QUIET && process.stderr.isTTY) process.stderr.write('\r');
const out = { meta: { runs: RUNS, seed: SEED, boards: LAST_ONLY ? '11-11' : FIRST + '-' + LAST, realm: LAST_ONLY ? 5 : REALM, seconds: Math.round((Date.now() - started) / 1000) }, ...aggregate(runs) };
print(out);
if (GROWTH_REPORT) printGrowth();
if (JSON_OUT) {
  fs.writeFileSync(JSON_OUT, JSON.stringify(out, null, 1) + '\n');
  console.log('\nWrote ' + JSON_OUT);
}
