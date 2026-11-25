// 黑子對照: every black stone scored on five aspects, at the stage of each board it stands on and
// in each 境界, and every board's pieces summed into one figure: the counterpart of 俠客對照.
//
// No value is typed in here. Each piece is built as the game builds it (seatNumbers, pieceUnit and
// castBoard, with the 境界 through stageRows and inRealm), stands where the board sets it down,
// and is measured with the rules' own damage, stat, enemyTechnique, counterRatio, stanceCut,
// wardShare, traitsOf, standCells and strikeReach against an average hero of the board's stage, so
// a change in game/src/ moves every score. What is this page's own is the weighing (how often a
// trait's moment comes, what a step lost is worth beside a blow) and the levels the heroes have
// reached by each board; those constants are named below.
import * as G from '../game-data.js';
import { foePage, troopIds, TEN, FINAL } from './foes.js';
import { gameArt } from './parts.js';

const AXES = [
  { key: 'attack', name: '攻勢', hint: '一個敵方回合打在一名同局次普通俠客身上的傷害：普攻與每幾回合輪到一次的絕技，斬殘、孤行、夾衛、陰陽倒亂、分刺、五劍連擊等加成按成立的機會折算，再加上還擊。' },
  { key: 'tough', name: '耐打', hint: '同局次普通俠客要打幾下才能把他打倒：氣血與防禦，盾牆、沉樁、蓄勢、木劍的減傷，星索、挪移、不敗、唯無名傷得了他，以及身旁替他受招的門人。' },
  { key: 'reach', name: '出手範圍', hint: '開局時他一回合內走得到、打得到的格數，照遊戲的敵方範圍算：坐鎮把他拴在原地則少，水上飄、軟劍扯人、無劍閃到無名身旁則多。' },
  { key: 'hold', name: '牽制', hint: '他一個敵方回合加在俠客身上的狀態，折成擊數：攻勢受挫、破防、絆足、中毒、內傷、削內力、化功、擒拿扯人，與重劍震退。' },
  { key: 'command', name: '統御', hint: '他替自己一方做的事，折成擊數：盟令加攻、替同夥療傷、代受、叫來的援軍（按全局回合攤分）。' }
];
const KEYS = AXES.map((a) => a.key);
// 綜合: 攻勢 and 耐打 are what every piece has and what decides a fight with him, three tenths
// each; 出手範圍 two tenths; 牽制 and 統御, which most pieces have little or none of, a tenth each.
const WEIGHTS = { attack: 0.3, tough: 0.3, reach: 0.2, hold: 0.1, command: 0.1 };
export const REALM_LIST = G.REALMS.map((_, i) => i + 1);

// ── The page's weights (judgement, not game values) ─────────────────────────
// The level the fielded heroes have reached on each board of a run, by stage (0 = the first
// board): tools/sim-battles.mjs --growth, 100 runs, seed 1 (2026-11-25), rounded. The last
// board is measured at 11, as `sim-battles --last` plays it.
const LEVEL_AT = [1, 3, 4, 5, 6, 7, 8, 9, 9, 10];
const LAST_LEVEL = 11;
const ROUNDS = 8; // about the length of a late board (as 俠客對照)
const TAKEN = 1.5; // enemy blows a hero takes in an enemy phase (as 俠客對照)
// How often a conditional trait holds when the piece strikes, as 俠客對照's SHARE does for heroes.
const SHARE = {
  execute: 0.4, // 斬殘: the hero struck is at or below half
  lone: 0.5, // 孤行: no other black stone beside him
  pincer: 0.6, // 夾衛: another black stone beside the hero struck
  crowded: 0.4, // 近身失準: the hero is inside his weak distance
  stepPoison: 0.6 // 步裡藏毒: he walked before the blow
};
const NEIGHBOURS = 0.5; // other heroes beside the one struck (掃), or beside him (重劍)
const LINE = 0.3; // 穿行: a second hero in line behind the first
const SECOND = 0.7; // 分刺: another hero in his reach for the second needle
const STRUCK = 0.5; // the heroes' blows at one piece in a round, each drawing his counter
const MENDING = 0.5; // a due 接骨續筋 finds a hurt companion (else he strikes and keeps it)
const WOKE = 0.5; // a 坐鎮 that wakes is woken for about half the board
const PHASED = 0.5; // 變招 at half: the second half of his 氣血 is fought changed
const WARD_UP = 0.5; // 星索: of the posts' ward, on average half stands while he is struck
const COVER_UP = 0.5; // an escort stands beside the one it covers
const COVER = 1; // a blow taken for another each phase (as 俠客對照 counts 代受)
const KIN = 0.5; // 刀陣: the pair stand together and the healthier covers
const STANDING = 0.6; // of a board's other pieces, the share alive to take a 盟令
const STEP_WORTH = 0.15; // one step lost for a hero turn, in blows (as 俠客對照)
const DRAG = 0.3; // a hero dragged off his ground (擒拿), in blows
const SHOVE = 0.15; // a hero thrown a tile back (重劍), in blows
const PULL_REACH = 0.25; // 軟劍: a pulled hero stands where he strikes again; the ground he holds, a quarter more
const CONTACT_HITS = 1; // blows struck beside a 化功 piece in a round
const FLED = 0.5; // 遁走: he reaches the herbs and mends before he is caught
// A reinforcement counts toward its board for the share of the board it is there for.
const HALVED_AT = 0.5; // a wave called at half 氣血 comes about midway

const r1 = (n) => Math.round(n * 10) / 10;
const n0 = (n) => String(Math.round(n));
const pct = (n) => Math.round(n * 100) + '%';
const bites = (turns) => Math.max(1, (turns || 2) - 1); // hero turns a condition laid in the enemy phase lasts
const afterCut = (n, cut) => (cut ? Math.round((n * (100 - cut)) / 100) : n);

// ── The ground: four open tiles of a board, A beside B and C, D beside B and C ─
const open = (map, x, y) => G.tileInfo(x, y, map)?.defense === 0 && G.walkable(x, y, map);
const groundCache = new Map();
function ground(map) {
  if (!groundCache.has(map)) {
    let found = null;
    for (let y = 0; y < 20 && !found; y++)
      for (let x = 0; x < 20 && !found; x++)
        if (open(map, x, y) && open(map, x + 1, y) && open(map, x, y + 1) && open(map, x + 1, y + 1)) {
          // A tile further off, for a blow from beyond a weak distance (近身失準).
          const far = (d) => {
            for (let yy = 0; yy < 20; yy++)
              for (let xx = 0; xx < 20; xx++) if (Math.abs(xx - x) + Math.abs(yy - y) === d && open(map, xx, yy)) return { x: xx, y: yy };
            return { x: x + 1, y };
          };
          found = { A: { x, y }, B: { x: x + 1, y }, C: { x, y: y + 1 }, D: { x: x + 1, y: y + 1 }, far };
        }
    groundCache.set(map, found);
  }
  return groundCache.get(map);
}

// ── The average hero of a stage: every hero's numbers at that level, bare-handed ─
const ROUTE = Array.from({ length: 10 }, (_, i) => i);
const levelOf = (map, stage) => (map === FINAL ? LAST_LEVEL : LEVEL_AT[Math.min(stage, LEVEL_AT.length - 1)]);
const heroCache = new Map();
function averageHero(level) {
  if (!heroCache.has(level)) {
    const all = G.ROSTER.filter((id) => id !== G.YOUTH_ID).map((id) => {
      const u = { ...G.startingHero(id), weapon: null, gear: null };
      G.raiseLevel(u, level - 1);
      return u;
    });
    const mean = (k) => Math.round(all.reduce((n, u) => n + u[k], 0) / all.length);
    const base = all[0];
    heroCache.set(level, {
      all,
      unit: { ...base, maxHp: mean('maxHp'), hp: mean('maxHp'), maxMp: mean('maxMp'), mp: mean('maxMp'), atk: mean('atk'), def: mean('def'), step: mean('step'), range: 1, learned: [], conditions: {} }
    });
  }
  return heroCache.get(level);
}

// The yardsticks of a board at a stage and 境界: the stage's ordinary foe (the mean of the four
// seat rows, as 俠客對照 takes its foe), the blow he lands on the average hero (BLOW) and the hero
// on him (HIT), and what a point of 內力 buys a hero in damage (his starting art over his basic,
// per point: MPW).
const unitCache = new Map();
function units(map, stage, realm, run) {
  const k = map + ':' + stage + ':' + realm;
  if (unitCache.has(k)) return unitCache.get(k);
  const g = ground(map),
    { unit, all } = averageHero(levelOf(map, stage)),
    duel = (a, b) => ({ mapIndex: map, round: 3, phase: 'enemy', run, units: [a, b], logs: [], stats: {} });
  const rows = G.stageRows(G.hasFour(map) ? map : 0, stage, realm),
    mean = (i) => Math.round(G.SLOTS.reduce((n, slot) => n + rows[slot][i], 0) / G.SLOTS.length);
  const FOE = G.makeUnit('blade', 'enemy', g.A.x, g.A.y, mean(0), 0, mean(1), mean(2), mean(3), 1);
  const H = { ...unit, x: g.B.x, y: g.B.y, conditions: {} };
  const BLOW = G.damage(FOE, H, false, map, duel(FOE, H)),
    HIT = G.damage(H, FOE, false, map, duel(FOE, H));
  const MPW =
    all.reduce((n, h0) => {
      const h = { ...h0, x: g.B.x, y: g.B.y },
        s = duel(FOE, h),
        art = G.artFor(h, 'signature');
      if (G.targetType(art) !== 'enemy') return n;
      return n + Math.max(0, G.damage(h, FOE, true, map, s, art) - G.damage(h, FOE, false, map, s)) / Math.max(2, G.artCost(s, h, art));
    }, 0) / all.length;
  const out = { FOE, BLOW, HIT, MPW };
  unitCache.set(k, out);
  return out;
}

// ── A board as it opens, in a 境界 ───────────────────────────────────────────
// The fixed four, the board's own pieces and objects, then every reinforcement at its entry tile
// (each with its wave). The run is the boards in their own order, as the wiki reads the last board.
function boardScene(map, stage, realm) {
  const s = { mapIndex: map, round: 1, phase: 'enemy', run: { stage, realm, route: ROUTE, status: 'battle' }, units: [], logs: [], stats: {} };
  const keys = G.encounterKeys(map),
    layout = G.mapLayout(map),
    numbers = G.seatNumbers(map, stage, realm);
  G.fixedSlots(map).forEach((slot, i) => {
    const [hp, atk, def, step, range] = numbers[i],
      p = layout.enemies[i],
      u = G.makeUnit(G.slotId(map, slot), 'enemy', p.x, p.y, hp, 0, atk, def, step, range);
    if (i) u.encounterId = keys[i];
    s.units.push(u);
  });
  const board = G.castBoard(map, ROUTE),
    entries = [];
  for (const piece of board.pieces) {
    const u = G.pieceUnit(s, piece);
    s.units.push(u);
    entries.push({ u, piece, wave: null });
  }
  s.units.push(...G.propUnits(s));
  const start = new Set(s.units);
  for (const wave of board.waves)
    for (const piece of wave.pieces) entries.push({ u: G.pieceUnit(s, piece, wave.when.round ?? null), piece, wave });
  const fixed = s.units.filter((u) => start.has(u) && u.side === 'enemy' && !entries.some((e) => e.u === u)).map((u) => ({ u, piece: null, wave: null }));
  return { s, start, board, pieces: [...fixed, ...entries] };
}
// When a wave comes, as a share of the board it is there for.
function presence(wave) {
  if (!wave) return 1;
  const w = wave.when;
  if (w.round != null) return Math.max(0, Math.min(1, (ROUNDS - w.round + 1) / ROUNDS));
  if (w.halved) return HALVED_AT;
  if (w.stage != null) {
    const n = G.DETAILS[G.castBoard(FINAL).commander]?.traits?.stages?.length || 1;
    return (n - w.stage) / n;
  }
  return 1;
}
const waveWords = (wave) =>
  !wave ? '' : wave.when.round != null ? '第' + G.NUMERALS[wave.when.round - 1] + '回合援軍' : wave.when.halved ? '局主半血時援軍' : '換劍時援軍';

// ── One piece measured, at one stage and 境界 ─────────────────────────────────
// `due` puts his signature on its round or off it; the rules decide everything else.
function setDue(s, u, due) {
  const sig = G.enemyTechnique(u, s);
  delete u.signaturePush;
  if (!sig) return;
  u.signatureRound = due ? s.round - sig.cadence : s.round - 1;
}
// His states over a board: the stages of 五劍 (a fifth of his 氣血 each) or, for a master with a
// 變招, before and after it; each with its share.
function states(u0) {
  const t = G.traitsOf(u0),
    stages = t.stages;
  const phase = !u0.guest && G.DETAILS[G.pieceKey(u0)]?.traits?.phase;
  const changed = (u) => {
    const v = { ...u, phased: true };
    for (const k of ['atk', 'def', 'step', 'range']) v[k] += phase[k] || 0;
    if (phase.brace) v.brace = true;
    return v;
  };
  if (stages?.length)
    return stages.map((st, i) => {
      const hp = Math.max(2, Math.round(u0.maxHp * (1 - (i + 0.5) / stages.length)));
      const u = { ...u0, hp };
      return { u: phase && hp <= u0.maxHp / 2 ? changed(u) : u, share: 1 / stages.length, top: u0.maxHp * (1 - i / stages.length), span: u0.maxHp / stages.length, stage: st };
    });
  if (phase)
    return [
      { u: { ...u0 }, share: 1 - PHASED, span: u0.maxHp * (1 - PHASED) },
      { u: changed({ ...u0, hp: Math.floor(u0.maxHp / 2) }), share: PHASED, span: u0.maxHp * PHASED }
    ];
  return [{ u: { ...u0 }, share: 1, span: u0.maxHp }];
}

function measure(scene, entry, stage, realm) {
  const { s: board } = scene,
    map = board.mapIndex,
    level = levelOf(map, stage),
    { unit: H0 } = averageHero(level),
    g = ground(map),
    run = board.run,
    key = G.pieceKey(entry.u),
    d = G.DETAILS[key],
    T = G.traitsOf(entry.u);
  // A scene of two: the piece at A, the hero at B; `with` adds others.
  const duel = (u, h, extra = [], round = 3) => ({ mapIndex: map, round, phase: 'enemy', run, units: [u, h, ...extra], logs: [], stats: {} });
  const at = (v, p) => ({ ...v, x: p.x, y: p.y });
  const H = at({ ...H0, conditions: {} }, g.B);
  const companion = (p) => G.makeUnit('blade', 'enemy', p.x, p.y, 100, 0, 10, 5, 2, 1);
  const { FOE, BLOW, HIT, MPW } = units(map, stage, realm, run);

  const parts = { attack: [], tough: [], reach: [], hold: [], command: [] };
  const list = states(entry.u);
  const say = (axis, text) => parts[axis].includes(text) || parts[axis].push(text);

  // ── 攻勢 ──
  // One action's blow at the hero: the signature if due, with what rides on it, or the plain blow.
  const blowOf = (u, due, round = 3, hp = H.hp, place = g.B, others = []) => {
    const v = at({ ...u }, g.A),
      h = { ...at(H, place), hp },
      s = duel(v, h, others, round);
    setDue(s, v, due);
    const raw = G.damage(v, h, false, map, s),
      sig = due ? G.enemyTechnique(v, s) : null,
      art = sig?.strikes ? sig : null,
      power = art ? Math.round(raw * art.factor) : raw,
      st = G.stageOf(v);
    let n = power;
    if (st?.twice) n += Math.max(1, Math.round(power * st.twice)); // 利劍
    if (art?.style === 'sweep') n += Math.max(1, Math.round(power * art.sweep)) * NEIGHBOURS;
    if (art && (art.style === 'line' || art.extra === 'line')) n += Math.round(power / 2) * LINE;
    if (st?.round) n += Math.round(power * st.round) * NEIGHBOURS; // 重劍
    if (T.flurry) n += Math.round(power * T.flurry.share) * SECOND; // 分刺
    return { n, raw, power, art, ratio: G.counterRatio(s, v), counter: G.damage(v, h, false, map, s) };
  };
  // The plain blow with each conditional trait at its share (as 俠客對照 does for heroes).
  const conditional = (u, due, round) => {
    const lonely = !!T.lone;
    // 孤行 is off with a companion beside him; the plain case has one.
    const plainOthers = lonely ? [companion(g.C)] : [];
    const base = blowOf(u, due, round, H.hp, g.B, plainOthers);
    let n = base.n;
    const notes = [];
    if (T.execute) {
      const half = blowOf(u, due, round, Math.floor(H.maxHp / 2), g.B, plainOthers);
      n += SHARE.execute * (half.n - base.n);
      notes.push('斬殘 ＋' + n0(half.n - base.n) + '（按' + pct(SHARE.execute) + '計）');
    }
    if (lonely) {
      const alone = blowOf(u, due, round);
      n += SHARE.lone * (alone.n - base.n);
      notes.push('孤行 ＋' + n0(alone.n - base.n) + '（按' + pct(SHARE.lone) + '計）');
    }
    if (T.pincer) {
      const flanked = blowOf(u, due, round, H.hp, g.B, [companion(g.D)]);
      n += SHARE.pincer * (flanked.n - base.n);
      notes.push('夾衛 ＋' + n0(flanked.n - base.n) + '（按' + pct(SHARE.pincer) + '計）');
    }
    if (T.crowded) {
      const away = blowOf(u, due, round, H.hp, g.far(T.crowded.within + 1), plainOthers);
      // The plain case is close; from beyond his weak distance he strikes harder.
      n = (1 - SHARE.crowded) * (n + (away.n - base.n)) + SHARE.crowded * n;
      notes.push('近身失準 −' + n0(away.n - base.n) + '（按' + pct(SHARE.crowded) + '計）');
    }
    return { ...base, n, notes };
  };
  let attack = 0,
    sigBlow = 0,
    plainBlow = 0,
    cadence = 0;
  const attackNotes = [];
  for (const { u, share, stage: st } of list) {
    const s = duel(at({ ...u }, g.A), H);
    const sig = G.enemyTechnique(u, s);
    const p = sig ? 1 / sig.cadence : 0;
    // 陰陽倒亂: the sabre on odd rounds, the sword on even; both, half each.
    const rounds = T.twin ? [3, 4] : [3];
    let turn = 0;
    for (const round of rounds) {
      const plain = conditional(u, false, round),
        due = sig ? conditional(u, true, round) : null;
      // 接骨續筋 (a mend) is no blow: on a due round he mends when someone is hurt, else strikes.
      const dueBlow = !due ? 0 : sig.style === 'mend' ? (1 - MENDING) * plain.n : due.n;
      const counter = STRUCK * ((1 - p) * plain.ratio * plain.counter + p * (due ? due.ratio * due.counter : 0)) * (st?.twice ? 1 + st.twice : 1);
      turn += ((1 - p) * plain.n + p * dueBlow + counter) / rounds.length;
      plainBlow += (share * plain.power) / rounds.length;
      if (due?.art) sigBlow += (share * due.power) / rounds.length;
      for (const note of plain.notes) attackNotes.includes(note) || attackNotes.push(note);
    }
    cadence = sig?.cadence || cadence;
    // 木劍: he acts twice a round.
    attack += share * turn * (st?.turns || 1);
  }
  const sig0 = G.enemyTechnique(entry.u, duel(entry.u, H));
  say('attack', '普攻約 ' + n0(plainBlow));
  if (sig0?.strikes) say('attack', '絕技「' + sig0.name + '」約 ' + n0(sigBlow) + '（普攻的 ' + sig0.factor.toFixed(2) + ' 倍），每 ' + (sig0.cadence || 3) + ' 回合一次');
  else if (sig0) say('attack', '絕技「' + sig0.name + '」不傷人');
  for (const note of attackNotes) say('attack', note);
  if (T.twin) say('attack', '陰陽倒亂：單雙回合各半');
  if (T.flurry) say('attack', '分刺 ' + pct(T.flurry.share) + '（按' + pct(SECOND) + '計）');
  if (T.stages) say('attack', '五劍逐段平均（利劍連擊、重劍掃及身旁、木劍一回合兩動）');

  // ── 耐打 ──
  // A blow of the average hero on him, after his cut, in each of his states and parts of his 氣血.
  const struckBy = (u, hp = u.hp) => {
    const v = { ...u, hp },
      h = at(H, g.B),
      home = { ...v, x: entry.u.x, y: entry.u.y };
    const s = { ...board, units: board.units.map((w) => (w.id === entry.u.id ? home : w)) };
    // His cut is read where he stands on his board (盾牆 holds only on his post).
    const cut = (due) => {
      setDue(s, home, due);
      return G.stanceCut(s, home);
    };
    const sig = G.enemyTechnique(home, s),
      p = sig ? 1 / sig.cadence : 0;
    const raw = G.damage(h, at(v, g.A), false, map, duel(at(v, g.A), h));
    const blow = (1 - p) * afterCut(raw, cut(false)) + p * afterCut(raw, cut(true));
    return { raw, blow: Math.max(1, blow), cut: (1 - p) * cut(false) + p * cut(true) };
  };
  let blows = 0,
    cutSeen = 0;
  for (const { u, span, stage: st } of list) {
    // 沉樁: the part of his 氣血 below its line he takes less.
    const last = T.lastStand;
    const segments = last ? [[span * (1 - last.below), u.maxHp], [span * last.below, Math.floor(u.maxHp * last.below)]] : [[span, u.hp]];
    for (const [hp, at] of segments) {
      const b = struckBy(u, at);
      cutSeen = Math.max(cutSeen, b.cut);
      // 無劍: only 無名's blows touch him there; the others of the five strike for nothing.
      const solo = st?.solo ? G.mapLayout(map).allies.length : 1;
      blows += (hp / b.blow) * solo;
    }
  }
  const plainBlows = entry.u.maxHp / struckBy(entry.u).raw;
  say('tough', '氣血 ' + entry.u.maxHp + '、防禦 ' + entry.u.def);
  if (T.lastStand) say('tough', '沉樁：不過' + pct(T.lastStand.below) + '時減傷 ' + T.lastStand.cut + '%');
  else if (T.stance?.while === 'posted') say('tough', '盾牆：在原位減傷 ' + T.stance.cut + '%');
  else if (cutSeen > 0 && !T.stages) say('tough', '蓄勢時減傷');
  if (T.stages) say('tough', '木劍減傷 ' + Math.max(...T.stages.map((v) => v.cut || 0)) + '%，無劍唯無名傷得了他');
  // 星索: the posts that ward the master, half standing on average.
  const ward = G.wardShare(board, entry.u);
  if (ward) {
    blows /= 1 - (WARD_UP * ward) / 100;
    say('tough', '星索減傷 ' + ward + '%（按一半計）');
  }
  // 挪移 while charged: the first blow on that round lands nothing.
  if (T.redirect) {
    const c = sig0?.cadence || 3;
    blows += ROUNDS / c;
    say('tough', '挪移：每 ' + c + ' 回合化去一擊');
  }
  // 遁走: he mends on the herbs before he is caught.
  const flee = !entry.u.guest && d.traits?.phase?.flee;
  if (flee) {
    blows += (FLED * (flee.until - 0.5) * entry.u.maxHp) / struckBy(entry.u).raw;
    say('tough', '遁走：退到藥草地調息');
  }
  const own = blows;
  say('tough', '約挨得住 ' + r1(plainBlows) + ' 擊' + (Math.abs(blows - plainBlows) > 0.5 ? '，折算後約 ' + r1(blows) + ' 擊' : ''));

  // ── 出手範圍 ──
  // The tiles he can strike in his coming turn as the board opens, as the danger zone shows them:
  // every tile he may end on (standCells: 坐鎮's tether, 蓄勢's hold) and his reach from there.
  const walkableTiles = G.fieldCells(map).filter((c) => G.walkable(c.x, c.y, map)).length;
  const zone = (u, due, woke, round = 3) => {
    const s = { ...board, round, units: [...board.units.filter((w) => scene.start.has(w) && w.id !== entry.u.id), u] };
    const v = { ...u, x: entry.u.x, y: entry.u.y, woke };
    s.units[s.units.length - 1] = v;
    setDue(s, v, due);
    if (G.stageOf(v)?.blink) return walkableTiles; // 無劍: beside 無名 wherever he stands
    const tiles = new Set(),
      range = G.strikeReach(s, v);
    for (const c of G.standCells(s, v))
      for (let dx = -range; dx <= range; dx++) {
        const span = range - Math.abs(dx);
        for (let dy = -span; dy <= span; dy++) if (G.walkable(c.x + dx, c.y + dy, map)) tiles.add(G.key(c.x + dx, c.y + dy));
      }
    return tiles.size * (G.stageOf(v)?.pull ? 1 + PULL_REACH : 1);
  };
  const post = T.post;
  const wakes = post && post.wake !== false ? WOKE : post ? 0 : 1;
  let reach = 0;
  for (const { u, share } of list) {
    const sig = G.enemyTechnique(u, duel(u, H)),
      p = sig?.strikes ? 1 / sig.cadence : 0,
      rounds = T.twin ? [3, 4] : [3];
    for (const round of rounds) {
      const at = (woke) => (1 - p) * zone(u, false, woke, round) + p * zone(u, true, woke, round);
      reach += (share * ((1 - wakes) * (post ? at(false) : 0) + wakes * at(true))) / rounds.length;
    }
  }
  const step = G.stat(entry.u, 'step', board);
  say('reach', '移動 ' + step + ' 步、射程 ' + entry.u.range + ' 格' + (sig0?.reach ? '，絕技 ' + sig0.reach + ' 格' : ''));
  say('reach', '開局一回合約可打到 ' + n0(reach) + ' 格');
  if (post) say('reach', '坐鎮：' + (post.tether ? post.tether + ' 格內' : '守在原地') + (post.wake === false ? '，不離位' : '，離位追擊按一半計'));
  if (T.fleet) say('reach', '水上飄：踏水如平地');
  if (T.stages) say('reach', '軟劍扯人、重劍一步、無劍閃到無名身旁');

  // ── 牽制 ──
  // What he lays on a hero in an enemy phase, in blows' worth: a loss of attack in the hero's own
  // blows, a loss of 氣血 in the foe's blows, a step at STEP_WORTH.
  const holdOf = (u) => {
    const s = duel(at({ ...u }, g.A), H),
      sig = G.enemyTechnique(u, s),
      p = sig ? 1 / sig.cadence : 0,
      out = [];
    const add = (n, text) => n > 0 && out.push([n, text]);
    const weaker = (cond) => G.damage(H, FOE, false, map, duel(FOE, H)) - G.damage({ ...H, conditions: cond }, FOE, false, map, duel(FOE, { ...H, conditions: cond }));
    const opened = (cond) => G.damage(FOE, { ...H, conditions: cond }, false, map, duel(FOE, { ...H, conditions: cond })) - BLOW;
    const lay = (kind, power, turns, share, label) => {
      const c = { [kind]: { power, through: 99 } };
      if (kind === 'weak') add((share * weaker(c) * bites(turns)) / HIT, label);
      else if (kind === 'exposed') add((share * opened(c) * TAKEN * bites(turns)) / BLOW, label);
      else if (kind === 'pin') add(share * power * bites(turns) * STEP_WORTH, label);
      else if (kind === 'poison') add((share * power * turns) / BLOW, label);
      else if (kind === 'wound') add((share * power * bites(turns)) / BLOW, label);
    };
    if (sig?.strikes && !['sweep', 'line'].includes(sig.style)) {
      if (sig.style === 'drain') add((p * sig.power * MPW) / HIT, '削內力 ' + sig.power);
      else lay(sig.style, sig.power, sig.turns, p, G.CONDITION_NAMES[sig.style] + ' ' + sig.power);
      if (sig.extra === 'wound') lay('wound', 5, 2, p, '內傷');
      if (sig.extra === 'pin') lay('pin', 2, 2, p, '絆足 2');
      if (T.pull) add(p * DRAG, '擒拿扯人');
    }
    const half = Math.floor((run.stage || 0) / 2);
    if (T.basicPoison) lay('poison', T.basicPoison.power + half, T.basicPoison.turns, 1 - p, '普攻中毒');
    if (T.stepPoison) lay('poison', T.stepPoison.power + half, T.stepPoison.turns || 2, (1 - p) * SHARE.stepPoison, '步裡藏毒');
    if (T.snare) lay('pin', T.snare.power, T.snare.turns, 1 - p, '墜網絆足 ' + T.snare.power);
    if (T.contact) add((CONTACT_HITS * (T.contact.mp + G.traitStage(s, u)) * MPW) / HIT, '化功：貼身打他的人損內力');
    const st = G.stageOf(u);
    if (st?.shove) add((1 + NEIGHBOURS) * SHOVE, '重劍震退');
    return out;
  };
  let hold = 0;
  for (const { u, share, stage: st } of list) for (const [n, text] of holdOf(u)) {
    hold += share * n * (st?.turns || 1);
    say('hold', text);
  }
  if (!parts.hold.length) say('hold', '不加狀態');

  // ── 統御 ──
  let command = 0;
  // 盟令: every other piece of his board strikes harder while he stands.
  if (T.banner) {
    const others = scene.pieces.filter((e) => e.u.id !== entry.u.id).reduce((n, e) => n + presence(e.wave), 0);
    const v = at({ ...entry.u }, g.C),
      f = at({ ...FOE }, g.A),
      more = G.damage(f, H, false, map, duel(f, H, [v])) - G.damage(f, H, false, map, duel(f, H));
    command += (more * others * STANDING) / BLOW;
    say('command', '盟令：其餘 ' + r1(others) + ' 子每擊 ＋' + more);
  }
  // 接骨續筋: a due mend restores a hurt companion.
  if (sig0?.style === 'mend') {
    command += (sig0.heal * MENDING) / sig0.cadence / HIT;
    say('command', sig0.name + '：每 ' + sig0.cadence + ' 回合替同夥回復 ' + sig0.heal + ' 氣血');
  }
  // 代受: blows he takes for another.
  // (護樁, `ward`, only where the board has posts that ward its master.)
  const cover = T.cover === 'ward' && !G.props(board).some((v) => G.DETAILS[G.pieceKey(v)]?.traits?.ward) ? null : T.cover;
  if (cover === 'master' || cover === 'ward') {
    command += COVER * COVER_UP;
    say('command', cover === 'ward' ? '代受：守著星索樁替它受招' : '代受：替局主受招');
  } else if (cover === 'kin') {
    command += COVER * KIN;
    say('command', '代受：同門兩人互相補位');
  }
  if (entry.u.guest) {
    const stages = G.DETAILS[G.castBoard(FINAL).commander].traits.stages;
    const share = stages.filter((st) => st.guarded && !st.solo).length / stages.length;
    command += COVER * share;
    say('command', '代受：求敗換作木劍後守在他身旁');
  }
  return { key, d, own, blows, attack, reach, hold, command, parts, step, level, BLOW, HIT, raw: { attack, tough: blows, reach, hold, command } };
}

// Reinforcements a piece brings on: a wave the board sends when he is at half (`halved`), or as
// 求敗 changes swords (`stage`); worth the blows it takes to fell them, spread over the board.
function callers(board, map) {
  const out = new Map();
  for (const wave of board.waves) {
    const refs = wave.when.halved || (wave.when.stage != null ? [board.commander || 'master'] : null);
    if (!refs) continue;
    for (const ref of refs) {
      const id = G.refId(map, ref);
      out.set(id, [...(out.get(id) || []), { wave, share: 1 / refs.length }]);
    }
  }
  return out;
}

// ── The whole comparison ─────────────────────────────────────────────────────
// Beside the simulator (2026-11-25; `node tools/sim-battles.mjs --runs 100 --seed 1 --realm 1`
// and `--realm 5`, the share of each map won; the last board from README, `--last`). The wiki
// cannot run the simulator, so this is a note, not a column; re-measure both after a rebalance.
//   board       sum 利劍 / 無劍   won 利劍 / 無劍
//   青竹渡        62 /  67        100% / 100%
//   紅楓驛        72 /  79        100% / 100%
//   蘆花汀        79 /  85        100% / 100%
//   神龍竹堂      85 /  92        100% / 100%
//   聽雪棧        51 /  59        100% / 100%
//   空山琴臺     131 / 145         97% /  85%   (守: the qin is not a piece, and not counted)
//   絕情花徑     130 / 145        100% / 100%
//   桃花石陣     137 / 150        100% /  94%
//   襄陽殘垣     114 / 132         98% / 100%   (守)
//   鐵掌溪灘     141 / 156         98% /  97%
//   寒玉石室      88 / 100        100% / 100%
//   西夏夜苑     136 / 150        100% / 100%
//   倒影天街     216 / 244         92% /  69%
//   黑木繡閣     190 / 213         97% /  78%
//   無刻漏臺     197 / 227         90% /  80%   (破: the posts are not counted)
//   谷底棋臺       — / 267            — /  39%
// The three heaviest boards of a run are the three the simulated player loses most.
const BOARDS = [...TEN, FINAL];
const rowKey = (map, key, wave, mods) => map + ':' + key + ':' + (wave ? 'wave' : 'start') + ':' + JSON.stringify(mods || {});
const rankOf = (key, d, u) =>
  key === G.castBoard(FINAL).commander ? '對面的人' : u.guest ? '局主' : d.rank === 'boss' ? '局主' : d.rank === 'mini' ? '副手' : '兵卒';

function compute() {
  // Each board at each stage it can be met at, in each 境界; the last board once (無劍境界).
  const groups = new Map(),
    boards = [];
  for (const map of BOARDS) {
    const stages = G.mapStages(map),
      realms = map === FINAL ? [REALM_LIST.at(-1)] : REALM_LIST;
    const perRealm = {};
    for (const realm of realms) {
      const results = stages.map((stage) => {
        const scene = boardScene(map, stage, realm),
          called = callers(scene.board, map);
        const measured = scene.pieces.map((entry) => ({ entry, m: measure(scene, entry, stage, realm) }));
        // 代受 for the master: the escorts beside him take blows aimed at him, up to his own (on the
        // last board, the masters who guard 求敗 in the stages they can).
        const commander = G.commanderId(scene.s);
        for (const x of measured) {
          if (x.entry.u.id !== commander) continue;
          const stages = G.traitsOf(x.entry.u).stages,
            covered = stages ? stages.filter((st) => st.guarded && !st.solo).length / stages.length : 1,
            escorts = measured.filter((y) => y !== x && (G.traitsOf(y.entry.u).cover === 'master' || (y.entry.u.guest && stages)));
          if (!escorts.length) continue;
          const theirs = escorts.reduce((n, y) => n + y.m.own * presence(y.entry.wave), 0);
          x.m.raw.tough += COVER_UP * Math.min(theirs, x.m.own * covered);
          x.m.parts.tough.push('代受：身旁 ' + escorts.length + ' 子替他受招');
        }
        // The blows to fell what each caller brings on, spread over the board.
        for (const x of measured) {
          const calls = called.get(x.entry.u.id) || [];
          for (const { wave, share } of calls) {
            const sum = measured.filter((y) => y.entry.wave === wave).reduce((n, y) => n + y.m.own, 0);
            x.m.raw.command += (share * sum) / ROUNDS;
            x.m.parts.command.push('援軍：' + (wave.when.halved ? '半血時叫來 ' : '換劍時叫來 ') + wave.pieces.length + ' 子');
          }
        }
        return measured;
      });
      perRealm[realm] = results;
      // Rows: one per kind of piece on the board (its type, its mods, whether it comes later).
      results[0].forEach((x, i) => {
        const k = rowKey(map, x.m.key, x.entry.wave, x.entry.piece?.mods);
        if (!groups.has(k))
          groups.set(k, {
            id: k,
            map,
            key: x.m.key,
            u: x.entry.u,
            d: x.m.d,
            wave: x.entry.wave,
            mods: x.entry.piece?.mods,
            stages,
            byRealm: {}
          });
        const gr = groups.get(k);
        // Averaged over the stages the board can be met at.
        const avg = Object.fromEntries(KEYS.map((a) => [a, results.reduce((n, r) => n + r[i].m.raw[a], 0) / results.length]));
        gr.byRealm[realm] ??= { raw: avg, m: results.at(-1)[i].m, count: 0, presence: [] };
        gr.byRealm[realm].count++;
        gr.byRealm[realm].presence.push(presence(x.entry.wave));
      });
    }
    boards.push({ map, stages, realms });
  }
  const rows = [...groups.values()];
  // One ruler for every 境界: each axis's strongest piece, in any 境界, is 100.
  const scale = Object.fromEntries(KEYS.map((k) => [k, Math.max(...rows.flatMap((r) => Object.values(r.byRealm).map((b) => b.raw[k])))]));
  const score = (raw) => Object.fromEntries(KEYS.map((k) => [k, Math.max(0, Math.min(100, Math.round((100 * raw[k]) / scale[k])))]));
  const composite = (s) => Math.round(KEYS.reduce((n, k) => n + WEIGHTS[k] * s[k], 0));
  const pieces = rows.map((r) => {
    const realms = {};
    // The last board is met in 無劍境界 only and its numbers do not move with the 境界: the
    // other four show the same.
    for (const realm of REALM_LIST) r.byRealm[realm] ??= Object.values(r.byRealm)[0];
    for (const [realm, b] of Object.entries(r.byRealm)) {
      const scores = score(b.raw);
      realms[realm] = {
        scores,
        composite: composite(scores),
        raw: Object.fromEntries(KEYS.map((k) => [k, { value: r1(b.raw[k]), why: b.m.parts[k].slice(0, 4) }])),
        count: b.count,
        weight: b.presence.reduce((n, v) => n + v, 0) / (b.presence.length / b.count)
      };
    }
    const u = r.u;
    return {
      id: r.id.replace(/[^\w-]+/g, '-').replace(/-+$/, ''),
      key: r.key,
      name: r.d.name,
      page: foePage(r.key),
      map: r.map,
      board: G.mapLayout(r.map).name,
      stages: r.stages,
      rank: rankOf(r.key, r.d, u),
      troop: troopIds().includes(r.key) || !r.d.rank,
      wave: r.wave ? waveWords(r.wave) : '',
      count: Object.values(realms)[0].count,
      portrait: r.d.portraitFile ? gameArt(r.d.portraitFile) : '',
      realms
    };
  });
  // The boards as a run meets them: by the first stage each can be met at, then by map.
  const runOrder = [...boards].sort((a, b) => a.stages[0] - b.stages[0] || a.map - b.map).map((b) => b.map);
  const RANK_ORDER = ['對面的人', '局主', '副手', '兵卒'];
  pieces.forEach((p) => (p.order = runOrder.indexOf(p.map) * 100 + RANK_ORDER.indexOf(p.rank) * 10 + (p.wave ? 5 : 0)));
  const totals = boards.map(({ map, stages, realms }) => {
    const mine = pieces.filter((p) => p.map === map);
    const by = Object.fromEntries(
      REALM_LIST.map((realm) => [realm, realms.includes(realm) ? mine.reduce((n, p) => n + p.realms[realm].composite * p.realms[realm].weight, 0) : null])
    );
    return {
      map,
      order: runOrder.indexOf(map),
      name: G.mapLayout(map).name,
      stages,
      kind: G.BATTLES[map].kind,
      count: mine.reduce((n, p) => n + p.count, 0),
      later: mine.filter((p) => p.wave).reduce((n, p) => n + p.count, 0),
      totals: Object.fromEntries(Object.entries(by).map(([k, v]) => [k, v == null ? null : Math.round(v)]))
    };
  });
  return {
    axes: AXES.map((a) => ({ ...a, weight: WEIGHTS[a.key] })),
    realms: REALM_LIST,
    realmSwords: G.REALMS.map((r) => r.sword),
    notes: NOTES,
    pieces,
    boards: totals.sort((a, b) => a.order - b.order)
  };
}

const NOTES = [
  '每一子都照遊戲自己的算式在他所在的那一局量：局次照該局可能遇上的局次（一局若可能在兩個局次遇上，取兩者平均），境界照所選的境界。',
  '對手是同局次的普通俠客：二十位俠客在那一局時的平均氣血、攻擊與防禦，空手入局（不計兵器與裝備），站在無地形加成的平地上。各局的等級照模擬：第一局 ' + LEVEL_AT.join('、') + ' 級，終局 ' + LAST_LEVEL + ' 級。',
  '攻勢按一個敵方回合計：絕技按每幾回合一次輪到，斬殘、孤行、夾衛、近身失準、分刺、穿行、掃及身旁等按成立的機會折算，還擊按每回合挨 ' + STRUCK + ' 擊計。',
  '牽制與統御折成擊數：攻勢受挫與削內力折成俠客少打的擊數，破防、中毒、內傷折成黑子多打的擊數，一步按 ' + STEP_WORTH + ' 擊；代受一回合按一擊；援軍按把它們打倒所需的擊數攤到 ' + ROUNDS + ' 回合。',
  '有變招的局主，一半氣血按變招前、一半按變招後計；求敗的五劍各佔五分之一。',
  '五項各以全部境界中最強的一子為 100，五個境界同一把尺。綜合分是五項的加權平均：攻勢、耐打各佔三成，出手範圍兩成，牽制、統御各一成（多數黑子沒有這兩項）。',
  '各局合計：該局每一子的綜合分相加，援軍按在場的時間折算（第 r 回合到的按 ' + ROUNDS + ' 回合中剩下的比例，半血或換劍時叫來的另計）。終局只在無劍境界出現。各局的勝負條件、要守要破的器物不計在內。'
];

let cached = null;
export function foeCompareData() {
  return (cached ??= compute());
}
