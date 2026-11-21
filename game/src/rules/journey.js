import { WAKES, FATES, closingFor } from '../data/wake-tale.js';
import { random, shuffled } from './lots.js';
import { makeOffers, makeVisit, validVisit, grantLot, bonusManual } from './ferry-market.js';
import { seatsFor } from './formation.js';
import { moveFacts } from './move-facts.js';
import { ENCOUNTER_SCRIPT } from '../data/encounter-script.js';
import {
  COMMANDS,
  commandDescription,
  blankRecord,
  CONDITION_NAMES
} from './battle-mastery.js';
import { HERO_PATHS, GATE_LABELS, CATALOG_NOTE, RECALL_NOTE } from '../data/mastery-catalog.js';
import * as G from './game.js';
import { NUMERALS } from './game.js';
import { mapLayout } from '../data/terrain.js';
import { TECHNIQUES, MANUAL_PRICES, CAPTAINS } from '../data/martial-arts.js';
import { MAZE_TALE, CHAMBER_TALES, SIDE_TALES, YOUTH, WEI } from '../data/maze-tale.js';
import { GISTS } from '../data/encounters.js';
import { BATTLES, SIDE_REWARDS } from '../data/battles.js';
import { WEAPON_FORMS } from '../data/form-catalog.js';
import { HERO_VOICES } from '../data/hero-voices.js';

const LEGACY = {
  best: 0,
  wins: 0,
  embers: 0,
  returns: 0,
  fates: [],
  lastFate: null,
  parcel: { stock: {}, manuals: [] },
  // The name the youth gives himself, and what earlier runs left behind for deja vu:
  // how many runs each hero has walked, and which boards have been reached.
  name: '',
  walked: {},
  seen: []
};
const MAPS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
// A name typed by the player: no spaces or line breaks, at most eight characters.
const cleanName = (value) => [...String(value ?? '').replace(/\s+/g, '')].slice(0, 8).join('');
const youthName = (s) => s.run?.chronicle?.name || YOUTH.name;
function fillProfile(chronicle) {
  chronicle.fates ??= [];
  chronicle.lastFate ??= null;
  chronicle.name ??= '';
  chronicle.walked ??= {};
  chronicle.seen ??= [];
  return chronicle;
}
const copy = (value) => JSON.parse(JSON.stringify(value));

function newSeed() {
  if (globalThis.crypto?.getRandomValues)
    return globalThis.crypto.getRandomValues(new Uint32Array(1))[0];
  return Math.floor(Math.random() * 4294967296);
}
function drawLots(seed = newSeed()) {
  return { seed, ids: shuffled(G.PARTY, random(seed)).slice(0, 3) };
}
function routeFor(seed) {
  const rand = random(seed ^ 0x79ac7d53);
  return [
    0,
    ...shuffled([1, 2], rand),
    ...shuffled([3, 4], rand),
    ...shuffled([5, 6], rand),
    7,
    8,
    9
  ];
}
// The stages at which a board can be met, over every route the draw can make.
function mapStages(map) {
  const seen = new Set();
  for (let seed = 0; seed < 64; seed++) seen.add(routeFor(seed * 7919 + 1).indexOf(map));
  return [...seen].filter((n) => n >= 0).sort((a, b) => a - b);
}
function parcelCount(profile) {
  return (
    Object.values(profile.parcel.stock).reduce((n, v) => n + v, 0) + profile.parcel.manuals.length
  );
}
function initialRun(ids, seed, legacy) {
  const chronicle = copy(legacy);
  chronicle.returns ??= chronicle.wins;
  fillProfile(chronicle);
  const run = {
    trees: TREES_EDITION,
    battles: BATTLES_EDITION,
    voyage: chronicle.returns + 1,
    priorFate: chronicle.lastFate,
    seed,
    route: routeFor(seed),
    stage: 0,
    status: 'battle',
    scene: 'before',
    openingCast: ids.slice(0, 2),
    beat: 0,
    formationOpen: true,
    marked: false,
    coins: 24 + Math.min(12, chronicle.embers) * 4,
    bench: [],
    next: [...ids],
    pool: shuffled(
      G.PARTY.filter((id) => !ids.includes(id)),
      random(seed ^ 0xb863c49)
    ),
    manuals: [...chronicle.parcel.manuals],
    shop: [],
    last: null,
    chronicle
  };
  run.chronicle.parcel = { stock: {}, manuals: [] };
  return run;
}
function prepareHero(u) {
  u.learned ??= [];
  u.guides ??= u.learned.filter((id) => !!TECHNIQUES[id]?.manual);
  u.mastery ??= blankRecord();
  if (!u.slots) {
    const previous = u.activeArt || 'signature';
    const known = [...new Set([previous, 'signature', ...u.learned])].filter(
      (id) => id === 'signature' || (TECHNIQUES[id] && TECHNIQUES[id].kind !== 'basic')
    );
    u.slots = [...known, null, null].slice(0, 3);
  }
  u.activeArt =
    u.slots.includes(u.activeArt) && u.activeArt ? u.activeArt : u.slots.find(Boolean) || null;
  return u;
}
function startRun(draw = drawLots(), legacy = LEGACY) {
  const lots = drawLots(draw.seed).ids;
  const ids = lots.includes(draw.leaderId)
    ? [draw.leaderId, ...lots.filter((id) => id !== draw.leaderId)]
    : lots;
  const s = G.newGame(ids);
  s.version = 5;
  s.mapIndex = 0;
  s.run = initialRun(ids, draw.seed, legacy);
  if (cleanName(draw.name)) s.run.chronicle.name = cleanName(draw.name);
  s.logs = [];
  s.stock = { remedy: 2 + (legacy.best >= 7 ? 1 : 0), elixir: 2, travelBlade: 1, bracer: 1 };
  s.run.manuals.push('softPalm');
  s.units.push(...G.boardOf(s).pieces.map((piece) => G.pieceUnit(s, piece)));
  G.identifyEncounter(s);
  setUpBoard(s);
  for (const [id, n] of Object.entries(legacy.parcel.stock)) s.stock[id] = (s.stock[id] || 0) + n;
  for (const u of G.party(s)) {
    prepareHero(u);
    u.sp += 2 + (legacy.best >= 4 ? 1 : 0);
  }
  G.log(s, 'story', MAZE_TALE.draw, '英雄帖');
  G.log(s, 'story', ids.map((id) => G.DETAILS[id].name).join('、') + '應帖而來。', '第一局');
  return s;
}
function validProfile(p) {
  return (
    p &&
    [p.best, p.wins, p.embers].every((v) => Number.isInteger(v) && v >= 0) &&
    p.best <= 10 &&
    (p.returns == null || (Number.isSafeInteger(p.returns) && p.returns >= p.wins)) &&
    (p.fates == null ||
      uniqueMembers(
        p.fates,
        FATES.map((f) => f.id)
      )) &&
    (p.lastFate == null || p.fates?.includes(p.lastFate)) &&
    (p.name == null || (typeof p.name === 'string' && p.name === cleanName(p.name))) &&
    (p.walked == null ||
      (typeof p.walked === 'object' &&
        Object.entries(p.walked).every(
          ([id, n]) => G.PARTY.includes(id) && Number.isSafeInteger(n) && n >= 0
        ))) &&
    (p.seen == null || uniqueMembers(p.seen, MAPS)) &&
    p.parcel?.stock &&
    Object.entries(p.parcel.stock).every(
      ([id, n]) => Object.hasOwn(G.ITEMS, id) && Number.isInteger(n) && n >= 0
    ) &&
    Array.isArray(p.parcel.manuals) &&
    p.parcel.manuals.every((id) => Object.hasOwn(MANUAL_PRICES, id))
  );
}
function uniqueMembers(ids, allowed) {
  return (
    Array.isArray(ids) &&
    new Set(ids).size === ids.length &&
    ids.every((id) => allowed.includes(id))
  );
}
// The skill redesign renamed some arts and removed others. Saves name arts by id, so a save's ids
// are brought up to date before it is checked: a renamed id keeps its meaning, and a removed id is
// forgotten and its points returned (from this table, since the catalogue no longer has it).
const TECHNIQUES_RENAMED = Object.freeze({ nineYang: 'yijinjing' });
// The hero trees as they stood before the redesign: every node and the points it cost. Prices,
// tiers and prerequisites changed throughout, and twelve nodes went, so a save from before it gives
// all of these back and the player buys again in the new trees. Shop manuals are not in the table.
const TREES_EDITION = 2;
const OLD_TREE_POINTS = {
  mountainOpening: 1, breakSword: 2, breakArrow: 1, breakPalm: 2, breakQi: 2, ninefoldIntent: 3,
  sheathedDagger: 1, returningSong: 2, blackNeedle: 2, bambooWard: 1, qinXiaoRally: 2,
  clearHeartCoda: 3, ironChainForm: 1, sweepingWhip: 2, reverseForce: 2, chainShelter: 1,
  bloodAtPass: 2, earthThroughChain: 3, southernStance: 1, vacantFist: 2, fieldDragonWard: 1,
  flyingDragon: 3, armyBookRally: 2, dragonReserve: 3, jadeThread: 1, sparrowSteps: 1,
  jadeNeedle: 2, pairedHands: 3, silkBell: 2, maidenHarmony: 3, fingerPrimer: 1, northernSea: 2,
  ripplingSteps: 2, shangYang: 2, lesserMarsh: 2, sixMeridians: 3, huangPetals: 1, peachWard: 1,
  orchidPoint: 2, beggarBind: 2, peachGate: 2, staffWithoutDogs: 3, darkIronEdge: 1,
  jadeFluteCut: 1, tideBreaker: 2, toadLunge: 2, mournfulCloud: 2, solitaryPalm: 3, taijiGate: 1,
  valleyPulse: 1, taijiSword: 2, nineYangMantle: 2, holyFireTurn: 2, universeCanopy: 3,
  huQuickDraw: 1, snowPursuit: 1, silkwormPalm: 2, foxFeint: 1, foxWrist: 2, foxTwinChange: 3
};
const TECHNIQUES_REMOVED = Object.freeze(
  Object.fromEntries(Object.entries(OLD_TREE_POINTS).map(([id, points]) => [id, { points }]))
);
function migrateSave(s, removed = TECHNIQUES_REMOVED, renamed = TECHNIQUES_RENAMED) {
  const r = s?.run;
  if (!r || !Array.isArray(s.units)) return s;
  // A save made under the new trees keeps what it learned; only renames still apply to it.
  if (r.trees === TREES_EDITION) removed = {};
  r.trees = TREES_EDITION;
  // A rename applies once the catalogue has the new id in place of the old one.
  const names = new Map(
    Object.entries(renamed).filter(([from, to]) => TECHNIQUES[to] && !TECHNIQUES[from])
  );
  const rename = (list) => (Array.isArray(list) ? list.map((id) => names.get(id) ?? id) : list);
  const gone = (id) => Object.hasOwn(removed, id);
  let refunded = false;
  const bench = Array.isArray(r.bench) ? r.bench : [];
  for (const u of [...s.units.filter((u) => u?.side === 'ally'), ...bench]) {
    if (!u) continue;
    for (const k of ['learned', 'guides', 'slots', 'unplacedArts']) u[k] = rename(u[k]);
    u.activeArt = names.get(u.activeArt) ?? u.activeArt;
    const lost = Array.isArray(u.learned) ? u.learned.filter(gone) : [];
    if (Array.isArray(u.slots)) u.slots = u.slots.map((id) => (gone(id) ? null : id));
    if (Array.isArray(u.unplacedArts)) u.unplacedArts = u.unplacedArts.filter((id) => !gone(id));
    if (gone(u.activeArt)) u.activeArt = u.slots?.find(Boolean) || null;
    if (!lost.length) continue;
    u.learned = u.learned.filter((id) => !gone(id));
    u.sp = (u.sp || 0) + lost.reduce((n, id) => n + removed[id].points, 0);
    refunded = true;
  }
  r.manuals = rename(r.manuals);
  if (r.chronicle?.parcel) r.chronicle.parcel.manuals = rename(r.chronicle.parcel.manuals);
  if (Array.isArray(r.shop))
    for (const o of r.shop) if (o && names.has(o.id)) o.id = names.get(o.id);
  if (refunded && Array.isArray(s.logs))
    G.log(s, 'system', '武學譜重修：已失傳的招式退還武學點數。', '武學傳承');
  return s;
}
// Per-board bookkeeping kept on a hero; `advance` clears it for the next board.
const BOARD_MARKS = [
  'struckRound',
  'hurtRound',
  'walked',
  'glideLeft',
  'againRound',
  'orderedRound',
  'usedOnce',
  'cooldowns'
];
const ROUND_MARKS = [
  ...BOARD_MARKS.slice(0, 6),
  'signaturePush',
  'lastSiphonRound',
  'lastDazeRound',
  'fleeThrough',
  'enteredRound'
];
// Older saves have none of these fields; a malformed one is dropped rather than failing the save.
function tidyMarks(s) {
  for (const u of [...s.units, ...s.run.bench]) {
    for (const k of ROUND_MARKS) if (u[k] != null && !Number.isFinite(u[k])) delete u[k];
    for (const k of ['woke', 'phased', 'halved'])
      if (u[k] != null && typeof u[k] !== 'boolean') delete u[k];
    const once = u.usedOnce,
      cool = u.cooldowns;
    if (once != null && !(Array.isArray(once) && once.every((id) => typeof id === 'string')))
      delete u.usedOnce;
    if (cool != null && !(typeof cool === 'object' && Object.values(cool).every(Number.isInteger)))
      delete u.cooldowns;
  }
  if (s.zones != null) {
    const zones = Array.isArray(s.zones)
      ? s.zones.filter(
          (z) =>
            z &&
            typeof z.owner === 'string' &&
            Number.isInteger(z.through) &&
            z.through >= s.round &&
            Array.isArray(z.tiles) &&
            z.tiles.every((p) => p && Number.isInteger(p.x) && Number.isInteger(p.y))
        )
      : [];
    if (zones.length) s.zones = zones;
    else delete s.zones;
  }
}
// Boards gained kinds, extra pieces and reinforcements in this edition of the save.
const BATTLES_EDITION = 1;
// A board as a run reaches it: its reinforcements scheduled and its facts blank. Called once
// its pieces are on the board (startRun, advance, and a migrated save not yet in the fight).
function setUpBoard(s) {
  const r = s.run;
  r.battles = BATTLES_EDITION;
  delete r.legacyBoard;
  G.scheduleWaves(s);
  s.tally = G.blankTally();
  r.side = drawSide(s);
}
// A save from before boards had kinds. A board already in the fight finishes under its old rules
// (its master, its four); one not yet fought is rebuilt with its new pieces. Nothing is logged:
// the player sees nothing change under him.
function migrateBattles(s) {
  const r = s.run;
  if (r.battles === BATTLES_EDITION) return;
  if (r.status === 'battle' && r.scene === 'fight') {
    r.legacyBoard = true;
    r.side = { ...(LEGACY_SIDES[r.goal] || LEGACY_SIDES.safe) };
    r.deploying = false;
    s.arrivals = {};
    s.tally = G.blankTally();
    const commander = G.find(s, G.commanderId(s));
    if (s.foreshadow && commander) commander.halved = true;
  } else if (r.status === 'battle') {
    s.units = [...G.party(s), ...defenders(s)];
    G.identifyEncounter(s);
    setUpBoard(s);
  }
  // A save in camp keeps its settled board; its old objective names the secondary it had.
  if (!r.side && LEGACY_SIDES[r.goal]) r.side = { ...LEGACY_SIDES[r.goal] };
  r.battles = BATTLES_EDITION;
  delete r.goal;
}
// The board fields of a save, each dropped or reset when malformed rather than failing the save.
function tidyBoard(s) {
  const r = s.run,
    board = G.boardOf(s);
  if (r.legacyBoard !== true) delete r.legacyBoard;
  if (r.deploying != null && typeof r.deploying !== 'boolean') delete r.deploying;
  const arrivals = s.arrivals && typeof s.arrivals === 'object' ? s.arrivals : {};
  s.arrivals = {};
  for (const w of r.status === 'battle' ? board.waves : []) {
    const due = arrivals[w.id];
    const waiting = w.pieces.some((p) => !s.units.some((u) => u.id === p.id));
    if (Number.isInteger(due) && due >= s.round && due <= G.LIMIT && waiting) s.arrivals[w.id] = due;
  }
  if (!validTally(s.tally)) s.tally = G.blankTally();
  if (r.status === 'battle' && !validSide(s, r.side)) r.side = drawSide(s);
  if (r.last?.side != null && typeof r.last.side !== 'object') delete r.last.side;
}
const count = (n) => Number.isSafeInteger(n) && n >= 0;
function validTally(t) {
  return (
    !!t &&
    typeof t === 'object' &&
    Array.isArray(t.falls) &&
    t.falls.every((f) => f && typeof f.id === 'string' && Number.isInteger(f.round)) &&
    count(t.doses) &&
    count(t.leaderHurt) &&
    !!t.fired &&
    typeof t.fired === 'object' &&
    Object.values(t.fired).every(count) &&
    typeof t.crossed === 'boolean'
  );
}
function restoreRun(raw) {
  if (!raw) return null;
  if ([4, 5].includes(raw.version)) migrateSave(raw);
  if (![4, 5].includes(raw.version)) {
    const s = G.restoreGame(raw);
    if (!s) return null;
    const ids = G.party(s).map((u) => u.id);
    s.version = 5;
    s.mapIndex = 0;
    s.run = initialRun(ids, newSeed(), LEGACY);
    for (const u of G.party(s)) prepareHero(u);
    s.run.scene = 'fight';
    // The classic board finishes as it began: its master, its four, no reinforcements.
    s.run.legacyBoard = true;
    s.run.side = { ...LEGACY_SIDES.beacon };
    s.arrivals = {};
    s.tally = G.blankTally();
    G.identifyEncounter(s);
    s.run.formationOpen =
      !s.result &&
      s.phase === 'ally' &&
      s.round === 1 &&
      G.party(s).every((u) => !u.moved && !u.acted);
    G.log(s, 'story', '舊日的棋局接上了這一盤，前面還有九局。', '石臺');
    return s;
  }
  const s = raw,
    r = s.run;
  const expectedRoute = r && routeFor(r.seed);
  const board = mapLayout(s.mapIndex);
  // Saves from the rectangular battlefields may occupy a tile now cut away.
  const canRestorePoint = (p) =>
    Number.isInteger(p.x) &&
    Number.isInteger(p.y) &&
    p.x >= 0 &&
    p.y >= 0 &&
    p.x < board.width &&
    p.y < board.height &&
    (G.walkable(p.x, p.y, s.mapIndex) || (!s.fieldEdition && !G.valid(p.x, p.y, s.mapIndex)));
  if (
    !r ||
    !Array.isArray(s.units) ||
    !Array.isArray(r.bench) ||
    !Array.isArray(s.logs) ||
    !s.stock ||
    !s.stats ||
    !Number.isInteger(r.seed) ||
    !Number.isInteger(r.stage) ||
    r.stage < 0 ||
    r.stage > 9 ||
    !Array.isArray(r.route) ||
    r.route.length !== 10 ||
    r.route.some((v, i) => v !== expectedRoute[i]) ||
    s.mapIndex !== r.route[r.stage] ||
    !['battle', 'camp', 'ended'].includes(r.status) ||
    !Number.isInteger(r.coins) ||
    r.coins < 0 ||
    !validProfile(r.chronicle) ||
    !Array.isArray(r.shop) ||
    !Array.isArray(r.manuals) ||
    r.manuals.some((id) => !Object.hasOwn(MANUAL_PRICES, id)) ||
    !Number.isInteger(s.round) ||
    s.round < 1 ||
    s.round > G.LIMIT ||
    !['ally', 'enemy', 'done'].includes(s.phase) ||
    ![null, 'win', 'loss'].includes(s.result) ||
    !s.units.every(
      (u) =>
        u &&
        typeof u.id === 'string' &&
        G.DETAILS[u.id.split('#')[0]] &&
        Number.isFinite(u.hp) &&
        u.maxHp > 0 &&
        canRestorePoint(u) &&
        (!u.origin || canRestorePoint(u.origin))
    )
  )
    return null;
  if (!s.fieldEdition) {
    const old = s.units;
    s.units = G.fitFormation(old, s.mapIndex);
    s.fieldEdition = G.FIELD_EDITION;
    if (s.units.some((u, i) => G.distance(u, old[i]) > 0))
      G.log(s, 'system', '河岸地勢已變，原在水面或崖外的棋子已移至最近的空地。', '地形圖');
  }
  const active = G.party(s),
    members = G.company(s),
    ids = members.map((u) => u?.id);
  if (
    active.length < 1 ||
    active.length > 5 ||
    !uniqueMembers(ids, G.PARTY) ||
    !active.some((u) => u.id === s.selected) ||
    !active.some((u) => u.id === s.leader) ||
    !s.units.some((u) => u.id === G.commanderId(s)) ||
    !members.every(
      (u) =>
        u &&
        u.side === 'ally' &&
        u.talents &&
        Number.isInteger(u.sp) &&
        u.sp >= 0 &&
        Array.isArray(u.learned) &&
        u.learned.every(
          (id) => TECHNIQUES[id] && (!TECHNIQUES[id].owner || TECHNIQUES[id].owner === u.id)
        ) &&
        (u.activeArt === null || u.activeArt === 'signature' || u.learned.includes(u.activeArt))
    ) ||
    !uniqueMembers(r.next, ids) ||
    r.next.length < 1 ||
    r.next.length > 5 ||
    !uniqueMembers(
      r.pool,
      G.PARTY.filter((id) => !ids.includes(id))
    ) ||
    (r.status !== 'battle' && (!s.result || !r.last)) ||
    r.shop.some(
      (o) =>
        !o ||
        !(G.ITEMS[o.id] || MANUAL_PRICES[o.id]) ||
        !Number.isInteger(o.price) ||
        o.price <= 0 ||
        !Number.isInteger(o.left) ||
        o.left < 0
    )
  )
    return null;
  if (raw.version === 4) {
    for (const u of members) prepareHero(u);
    r.pool.push(
      ...shuffled(
        G.PARTY.filter((id) => !ids.includes(id) && !r.pool.includes(id)),
        random(r.seed ^ 0x1d4063)
      )
    );
    r.formationOpen =
      r.status === 'battle' &&
      s.phase === 'ally' &&
      s.round === 1 &&
      active.every((u) => !u.moved && !u.acted);
    s.version = 5;
    G.log(
      s,
      'system',
      '昔日所習悉數保留。原已裝備的招式已排入三格，舊藏武譜可各授一人。',
      '武學傳承'
    );
  }
  if (!r.scene) {
    r.scene = r.status === 'ended' ? 'ended' : r.status === 'camp' ? 'shop' : 'fight';
    r.beat = 0;
    if (r.status === 'battle') {
      const [x, y] = [
        [8, 8],
        [3, 1],
        [10, 6],
        [10, 3],
        [0, 5],
        [8, 10],
        [9, 2],
        [0, 5],
        [1, 1],
        [1, 1]
      ][s.mapIndex];
      if (G.walkable(x, y, s.mapIndex)) r.objectivePos = { x, y };
    }
  }
  const allowedScenes = {
    battle: ['before', 'brief', 'prep', 'fight'],
    camp: ['after', 'shop'],
    ended: ['ended']
  };
  const closed = !!r.last?.terminal && r.status !== 'battle';
  r.chronicle.returns ??= r.chronicle.wins + (closed && !r.last.won ? 1 : 0);
  fillProfile(r.chronicle);
  r.voyage ??= Math.max(1, r.chronicle.returns + (closed ? 0 : 1));
  r.priorFate ??= null;
  if (
    !Number.isSafeInteger(r.voyage) ||
    r.voyage < 1 ||
    (r.priorFate && !r.chronicle.fates.includes(r.priorFate)) ||
    (r.last?.fate && !r.chronicle.fates.includes(r.last.fate))
  )
    return null;
  if (!allowedScenes[r.status].includes(r.scene) || !Number.isInteger(r.beat) || r.beat < 0)
    return null;
  // Before the shared medicine cabinet, each hero could carry separate doses.
  // Remove the old containers in the same restored snapshot as their transfer.
  for (const u of members) {
    if (!u.supplies) continue;
    for (const [id, n] of Object.entries(u.supplies)) {
      if (G.ITEMS[id]?.kind !== 'use' || !Number.isSafeInteger(n) || n < 0) return null;
      if (n) s.stock[id] = (s.stock[id] || 0) + n;
    }
    delete u.supplies;
  }
  if (r.last?.visit != null && !validVisit(r.last.visit)) return null;
  if (r.objectivePos && !G.walkable(r.objectivePos.x, r.objectivePos.y, s.mapIndex))
    delete r.objectivePos;
  G.identifyEncounter(s);
  migrateBattles(s);
  tidyBoard(s);
  const validHero = (u) =>
    Number.isSafeInteger(u.xp) &&
    u.xp >= 0 &&
    (!u.unplacedArts || uniqueMembers(u.unplacedArts, u.learned)) &&
    Array.isArray(u.slots) &&
    u.slots.length === 3 &&
    uniqueMembers(
      u.slots.filter((id) => id !== null),
      ['signature', ...u.learned.filter((id) => TECHNIQUES[id].kind !== 'basic')]
    ) &&
    (u.activeArt ? u.slots.includes(u.activeArt) : u.slots.every((id) => id === null)) &&
    uniqueMembers(u.guides, Object.keys(MANUAL_PRICES)) &&
    u.learned.every((id) => !TECHNIQUES[id].manual || u.guides.includes(id)) &&
    u.mastery &&
    ['heals', 'steps', 'protects', 'casts', 'kills'].every(
      (k) => Number.isInteger(u.mastery[k]) && u.mastery[k] >= 0
    ) &&
    uniqueMembers(u.mastery.sides, r.route);
  for (const u of s.units) if (!G.living(u)) delete u.conditions;
  const validConditions = (u) =>
    Object.entries(u.conditions || {}).every(
      ([k, v]) =>
        Object.hasOwn(CONDITION_NAMES, k) &&
        v &&
        Number.isInteger(v.power) &&
        v.power > 0 &&
        Number.isInteger(v.through) &&
        v.through >= s.round &&
        (G.PARTY.includes(v.source) || s.units.some((x) => x.id === v.source))
    );
  if (
    typeof r.formationOpen !== 'boolean' ||
    !members.every(validHero) ||
    !s.units.every(validConditions)
  )
    return null;
  tidyMarks(s);
  for (const u of members) {
    if (u.id === 'yang' && u.step === 3) u.step = 4;
    G.settleExperience(s, u);
  }
  return s;
}
// Deja vu: one line from a fielded hero who has walked an earlier run, on a board that an
// earlier run reached. Never on the first run, never on a board that is new, and only on
// some boards, so that it stays rare.
function echoBeat(s) {
  const r = s.run,
    past = r.chronicle;
  if (r.voyage < 2 || [0, 4, 9].includes(r.stage) || (r.stage + r.voyage) % 2) return null;
  if (!past.seen?.includes(s.mapIndex)) return null;
  const hero = G.party(s).find((u) => past.walked?.[u.id] && HERO_VOICES[u.id]);
  if (!hero) return null;
  const lines = HERO_VOICES[hero.id].echoes;
  return { who: hero.id, text: lines[(r.voyage + r.stage) % lines.length] };
}
// The lines of one scene: before a battle, or after it.
//
// Three layers are put together here, and none of them knows about the others:
//   the spine   what belongs to this position in the run (first board, night talk, the end)
//   the board   ENCOUNTER_SCRIPT for the map being played
//   the heroes  HERO_VOICES for whoever happens to be in the company
function dialogue(s, scene = s.run.scene) {
  const r = s.run,
    script = ENCOUNTER_SCRIPT[s.mapIndex];
  const before = scene === 'before';
  const wake = WAKES[Math.min(WAKES.length, r.voyage) - 1];
  const captain = G.find(s, (before && r.openingCast?.[0]) || s.leader);
  const ally =
    (before && G.find(s, r.openingCast?.[1])) || G.party(s).find((u) => u !== captain) || captain;
  const cast = {
    boss: G.find(s, G.commanderId(s)),
    mini: G.enemies(s).find((u) => u.encounterId?.startsWith('lieutenant-')),
    leader: captain,
    ally
  };
  const beats = [];
  if (before) {
    if (r.stage === 0) {
      const found = r.voyage > WAKES.length && wake.openingLater ? wake.openingLater : wake.opening;
      const prior = FATES.find((f) => f.id === r.priorFate);
      beats.push({ who: 'youth', note: found.note + (prior ? prior.echo : ''), text: found.text });
      for (const u of G.company(s)) beats.push({ who: u.id, ...HERO_VOICES[u.id].arrival });
      beats.push({ who: 'youth', ...MAZE_TALE.command });
      beats.push({ who: captain.id, text: HERO_VOICES[captain.id].obey });
    }
    if (r.stage === 4) {
      beats.push({ who: 'youth', note: MAZE_TALE.night + wake.echo.note, text: wake.echo.text });
      for (const u of G.party(s).slice(0, 3))
        beats.push({ who: u.id, text: HERO_VOICES[u.id].night[r.voyage >= 3 ? 1 : 0] });
    }
    // A hero from the same series of books as this board's master has a line of their own.
    for (const beat of script.before)
      beats.push(
        ['leader', 'ally'].includes(beat.who)
          ? { ...beat, text: script.heroLines?.[cast[beat.who]?.id] || beat.text }
          : beat
      );
    const echo = echoBeat(s);
    if (echo) beats.push(echo);
  } else if (s.result === 'win') {
    beats.push(...script.win);
    // A met secondary is told by its kind; a hero arrives on every win, so nothing is said of
    // one not met.
    if (r.last?.optional) beats.push({ who: 'youth', text: sideTale(r.side) });
    const who = r.last?.recruit;
    if (who) {
      const arrival = HERO_VOICES[who].arrival;
      beats.push({
        who,
        note: G.DETAILS[who].name + MAZE_TALE.joined + arrival.note,
        text: arrival.text
      });
    }
    if (r.stage === 0) beats.push({ who: 'wei', ...MAZE_TALE.opened });
    if (r.last?.terminal)
      for (const u of G.party(s)) beats.push({ who: u.id, text: HERO_VOICES[u.id].farewell });
  } else {
    beats.push(...script.loss);
    beats.push({ who: 'wei', ...MAZE_TALE.scatter });
  }
  const offBoard = { youth: { ...YOUTH, name: youthName(s) }, wei: WEI };
  return beats.map((beat) => {
    const off = offBoard[beat.who],
      person = off ? null : cast[beat.who] || G.company(s).find((u) => u.id === beat.who),
      info = person && G.unitDetails(person);
    return {
      speaker: off?.name || info?.name || '',
      // A hero's role label is not shown; enemies and off-board people keep theirs.
      role: off?.role || (person && G.ally(person) ? '' : info?.role) || '',
      person,
      portrait: off?.portrait || '',
      note: beat.note || '',
      text: beat.text
    };
  });
}
// Battle scenes run before → brief (the briefing) → prep (整備) → fight; camp ones after → shop.
const NEXT_SCENE = { before: 'brief', brief: 'prep', after: 'shop' };
function turnPage(s, skip = false) {
  const r = s.run;
  if (!NEXT_SCENE[r.scene]) return false;
  if (r.scene !== 'brief' && !skip && r.beat < dialogue(s).length - 1) {
    r.beat++;
    return true;
  }
  r.scene = NEXT_SCENE[r.scene];
  r.beat = 0;
  return true;
}
function deployLineup(s) {
  const r = s.run;
  if (r.scene !== 'prep' || r.status !== 'battle' || s.result) return false;
  const all = G.company(s),
    ids = r.next,
    posts = mapLayout(s.mapIndex).allies;
  if (
    !ids.length ||
    ids.length > 5 ||
    !uniqueMembers(
      ids,
      all.map((u) => u.id)
    )
  )
    return false;
  const active = ids.map((id) =>
    Object.assign(
      all.find((u) => u.id === id),
      posts[seatsFor(r).indexOf(id)]
    )
  );
  r.bench = all.filter((u) => !ids.includes(u.id));
  s.units = [...active, ...G.enemies(s)];
  s.selected = s.leader = ids[0];
  r.scene = 'fight';
  r.deploying = true; // the deployment step: swaps on the board until 開戰
  G.log(s, 'system', active.map((u) => G.unitDetails(u).name).join('、') + '出陣。', '整備');
  return true;
}
// Whether the opening tiles may still be swapped: deploying, before anyone has acted.
const deploying = (s) =>
  !!s.run?.deploying && s.run.status === 'battle' && s.run.scene === 'fight' && s.phase === 'ally' && s.round === 1 && !s.result;
// The deployment step's swap: the hero on post `a` (0–4) changes places with whoever is on post
// `b`, or moves there if it is empty. The seats of 整備 are written with it, so the next board
// opens from the same order.
function swapStart(s, a, b) {
  const r = s.run;
  if (!deploying(s) || ![a, b].every((n) => Number.isInteger(n) && n >= 0 && n < 5) || a === b)
    return false;
  const seats = seatsFor(r);
  if (!seats[a]) return false;
  [seats[a], seats[b]] = [seats[b], seats[a]];
  r.posts = seats;
  const posts = mapLayout(s.mapIndex).allies;
  for (const u of G.party(s)) Object.assign(u, posts[seats.indexOf(u.id)], { origin: null });
  return true;
}
// 開戰: the deployment step ends and round one begins; waves due in round two are named.
function beginBattle(s) {
  if (!deploying(s)) return false;
  s.run.deploying = false;
  G.log(s, 'system', '起陣已定。', '我方回合');
  G.announce(s);
  return true;
}
// ── Secondary objectives ─────────────────────────────────────────────────
// One is drawn per board per run from the board's pool (battles.js `sides`). Each kind reads the
// facts the game records in `s.tally` (game.js). A 'keep' kind fails on an event and is met at
// the win if it never failed; a 'reach' kind is met on an event and fails once it cannot be.
// A secondary is done when the board is won with it met.
const pieceName = (map, ref) => G.DETAILS[G.refKey(map, ref)]?.name || '';
const heroName = (id) => G.DETAILS[id]?.name || '';
const fallOf = (s, ref) => s.tally?.falls.find((f) => f.id === G.refId(s.mapIndex, ref));
const fallIndex = (s, id) => s.tally?.falls.findIndex((f) => f.id === id) ?? -1;
const masterNames = (map, board) => board.masters.map((ref) => pieceName(map, ref)).join('與');
// The heroes a secondary may name: the lineup as the board is built.
const lineup = (s) => s.run.next.map((id) => G.find(s, id)).filter(Boolean);
// Whether a hero can make a 合招: a form that spends a mark or poison, or strikes with a partner.
const COMBO_FORMS = ['exploit', 'distill', 'flank'];
function hasCombo(u) {
  const arts = ['signature', ...(u.learned || []).filter((id) => TECHNIQUES[id]?.kind !== 'basic')];
  const forms = [
    ...arts.flatMap((id) => G.formsFor(u, G.artFor(u, id))),
    ...G.formsFor(u, null),
    ...(WEAPON_FORMS[u.weapon] || [])
  ];
  return forms.some((f) => COMBO_FORMS.includes(f));
}
const SPARE = {
  mirror: { name: '不觸斗轉星移', detail: '全局不讓{n}的斗轉星移反震任何一擊。', lost: '{n}的斗轉星移已反震' },
  mend: { name: '不容續命', detail: '全局不讓{n}施展接骨續筋。', lost: '{n}已施展接骨續筋' },
  herbs: { name: '斷其退路', detail: '全局不讓{n}在遁走時踏上藥草地。', lost: '{n}已踏上藥草地' }
};
const named = (text, n) => text.replace('{n}', n);
const SIDE_KINDS = {
  lamp: {
    name: () => '點亮引路燈',
    sort: 'reach',
    eligible: () => true,
    detail: (s, side, map) => {
      const tile = (s && G.objectiveTile(s)) || mapLayout(map).objective;
      return '於第 ' + (tile.x + 1) + ' 列、第 ' + (tile.y + 1) + ' 行的燈記結束一名俠客的行動，且該俠客仍須生還。';
    },
    state: (s) => (s.run.marked ? 'met' : 'open'),
    progress: (s) => (s.run.marked ? '燈記已亮' : '燈記未亮'),
    lost: () => ''
  },
  swift: {
    name: () => '搶在限時之前',
    sort: 'keep',
    // On 殲滅 a wave due after the limit would make it impossible.
    eligible: (s, e) =>
      G.boardOf(s).kind !== 'rout' || !G.boardOf(s).waves.some((w) => w.when.round > e.by),
    detail: (s, side) => '在第' + NUMERALS[side.by - 1] + '回合結束前取勝。',
    state: (s, side) => (s.round > side.by ? 'failed' : 'open'),
    progress: (s, side) => '第 ' + s.round + '／' + side.by + ' 回合',
    lost: (s, side) => '已過第' + NUMERALS[side.by - 1] + '回合'
  },
  intact: {
    name: () => '全員生還',
    sort: 'keep',
    eligible: () => true,
    detail: () => '取勝時，全體出陣俠客仍須生還。',
    state: (s) => (G.party(s).some((u) => !G.living(u)) ? 'failed' : 'open'),
    progress: (s) => '生還 ' + G.party(s).filter(G.living).length + '／' + G.party(s).length,
    lost: (s) => heroName(G.party(s).find((u) => !G.living(u))?.id) + '倒下'
  },
  lastBlow: {
    name: () => '親手了斷',
    sort: 'reach',
    eligible: (s, e) => (e.hero === '*' ? s.run.next.length > 0 : s.run.next.includes(e.hero)),
    detail: (s, side, map) =>
      '由' + heroName(side.hero) + '給' + pieceName(map, side.target) + '最後一擊（招式、普攻、還擊或其所下的毒皆算）。',
    state: (s, side) => {
      const fall = fallOf(s, side.target);
      return !fall ? 'open' : fall.by === side.hero ? 'met' : 'failed';
    },
    progress: (s, side) => {
      const u = G.find(s, G.refId(s.mapIndex, side.target));
      return u ? pieceName(s.mapIndex, side.target) + '氣血 ' + Math.max(0, u.hp) + '／' + u.maxHp : '';
    },
    lost: (s, side) => pieceName(s.mapIndex, side.target) + '由他人擊倒'
  },
  order: {
    name: () => '先折羽翼',
    sort: 'reach',
    eligible: () => true,
    detail: (s, side, map) =>
      '先擊倒' + pieceName(map, side.first) + '，再擊倒' + masterNames(map, s ? G.boardOf(s) : BATTLES[map]) + '。',
    state: (s, side) => {
      const first = fallIndex(s, G.refId(s.mapIndex, side.first));
      const masters = G.masterIds(s).map((id) => fallIndex(s, id)).filter((i) => i >= 0);
      if (masters.some((i) => first < 0 || i < first)) return 'failed';
      return first >= 0 ? 'met' : 'open';
    },
    progress: (s, side) => pieceName(s.mapIndex, side.first) + '：' + (fallOf(s, side.first) ? '已倒' : '未倒'),
    lost: (s, side) => {
      const first = fallIndex(s, G.refId(s.mapIndex, side.first));
      const id = G.masterIds(s).find((m) => {
        const i = fallIndex(s, m);
        return i >= 0 && (first < 0 || i < first);
      });
      const ref = G.boardOf(s).masters.find((m) => G.refId(s.mapIndex, m) === id);
      return (ref ? pieceName(s.mapIndex, ref) : '') + '先於' + pieceName(s.mapIndex, side.first) + '倒下';
    }
  },
  double: {
    name: () => '一回合連下兩人',
    sort: 'reach',
    eligible: () => true,
    detail: () => '在我方同一回合內擊倒兩名敵人。',
    state: (s) => {
      const rounds = new Map();
      for (const f of s.tally?.falls || [])
        if (f.phase === 'ally') rounds.set(f.round, (rounds.get(f.round) || 0) + 1);
      return [...rounds.values()].some((n) => n >= 2) ? 'met' : 'open';
    },
    progress: (s) =>
      '本回合已擊倒 ' + (s.tally?.falls || []).filter((f) => f.phase === 'ally' && f.round === s.round).length,
    lost: () => ''
  },
  spare: {
    name: (side) => SPARE[side.behaviour].name,
    sort: 'keep',
    eligible: () => true,
    detail: (s, side, map) => named(SPARE[side.behaviour].detail, pieceName(map, side.piece)),
    state: (s, side) => (s.tally?.fired[side.behaviour] > 0 ? 'failed' : 'open'),
    progress: () => '尚未發生',
    lost: (s, side) => named(SPARE[side.behaviour].lost, pieceName(s.mapIndex, side.piece))
  },
  combo: {
    name: () => '合招制敵',
    sort: 'reach',
    eligible: (s) => lineup(s).some(hasCombo),
    detail: () => '以合招擊倒一名敵人：催毒、乘破綻或夾擊的一擊。',
    state: (s) => (s.tally?.falls.some((f) => f.combo) ? 'met' : 'open'),
    progress: () => '',
    lost: () => ''
  },
  noMedicine: {
    name: () => '不假丹藥',
    sort: 'keep',
    eligible: () => true,
    detail: () => '全局不服用任何丹藥。',
    state: (s) => (s.tally?.doses > 0 ? 'failed' : 'open'),
    progress: (s) => '丹藥 ' + (s.tally?.doses || 0) + ' 次',
    lost: () => '已服用丹藥'
  },
  unhurt: {
    name: () => '領隊無傷',
    sort: 'keep',
    eligible: () => true,
    detail: () => '全局領隊不因敵人損失氣血（自身招式的消耗不算）。',
    state: (s) => (s.tally?.leaderHurt > 0 ? 'failed' : 'open'),
    progress: (s) => (s.tally?.leaderHurt > 0 ? '領隊已受傷' : '領隊未受傷'),
    lost: () => '領隊受了傷'
  },
  holdLine: {
    name: () => '拒敵於外',
    sort: 'keep',
    eligible: (s) => G.boardOf(s).waves.length > 0,
    detail: (s, side) => '援軍不得踏入' + side.place + '。',
    state: (s) => (s.tally?.crossed ? 'failed' : 'open'),
    progress: (s) => (s.tally?.crossed ? '援軍已越線' : '援軍未越線'),
    lost: (s, side) => '援軍踏入' + side.place
  },
  answer: {
    name: () => '以招破招',
    sort: 'reach',
    eligible: (s, e) =>
      s.run.next.includes(e.hero) && !!G.find(s, e.hero)?.learned?.some((id) => TECHNIQUES[id]?.answer),
    detail: (s, side) => '由' + heroName(side.hero) + '以破招擊倒一名敵人（招式的破招加成須成立）。',
    state: (s, side) => (s.tally?.falls.some((f) => f.by === side.hero && f.answered) ? 'met' : 'open'),
    progress: () => '',
    lost: () => ''
  }
};
const sideName = (side) => (side ? SIDE_KINDS[side.kind].name(side) : '');
const sideTale = (side) => SIDE_TALES[side?.kind] || SIDE_TALES.done;
// Draws the board's secondary: the pool shuffled once by run seed and stage, the first entry the
// lineup can meet. The same seed, stage and lineup always give the same secondary; a named hero
// is drawn from the lineup as the board is built.
function drawSide(s) {
  const r = s.run,
    pool = G.boardOf(s).sides;
  const rand = random((r.seed ^ Math.imul(r.stage + 1, 0x2545f491) ^ 0x5eed51de) >>> 0);
  for (const i of shuffled(
    pool.map((_, i) => i),
    rand
  )) {
    const e = pool[i];
    if (!SIDE_KINDS[e.kind].eligible(s, e)) continue;
    const side = { ...e };
    if (e.hero === '*') side.hero = shuffled(r.next, rand)[0];
    return side;
  }
  return { kind: 'intact', reward: 'coins' }; // no pool of battles.js comes here
}
// A secondary that names a hero cannot be met without him: out of the lineup before the fight,
// not on the board in it.
function sideBenched(s, side = s.run.side) {
  if (!side?.hero) return false;
  return s.run.scene === 'fight'
    ? !G.party(s).some((u) => u.id === side.hero)
    : !s.run.next.includes(side.hero);
}
// 'open', 'met' or 'failed', now; a keep kind still open when the board is won is met.
function sideState(s, side = s.run.side) {
  if (!side) return 'open';
  if (s.run.status !== 'battle') return s.run.last?.optional ? 'met' : 'failed';
  if (sideBenched(s, side)) return 'failed';
  const kind = SIDE_KINDS[side.kind],
    state = kind.state(s, side);
  return state === 'open' && kind.sort === 'keep' && s.result === 'win' ? 'met' : state;
}
const sideDone = (s) => s.result === 'win' && sideState(s) === 'met';
// Why the secondary failed, as the tip and log say it.
function sideLost(s, side = s.run.side) {
  if (!side) return '';
  if (sideBenched(s, side)) return heroName(side.hero) + '未在出陣名單中';
  return SIDE_KINDS[side.kind].lost(s, side);
}
// The forecast's line when this blow would fell its target and so meet or fail the secondary.
function sideForecast(s, u, t, f) {
  const side = s.run?.side;
  if (!side || !s.tally || !['lastBlow', 'order', 'double', 'combo', 'answer'].includes(side.kind)) return '';
  const target = f.coveredBy ? G.find(s, f.coveredBy) : t;
  if (!target || f.type !== 'enemy' || f.amount < target.hp) return '';
  const art = f.mpCost ? G.artFor(u) : null;
  const fall = {
    id: target.id,
    by: u.id,
    how: art ? 'art' : 'basic',
    combo: !!(f.plan?.spentMark || f.plan?.spentPoison || f.plan?.partner),
    answered: !!art?.answer && G.strikeFactor(s, u, art, target).notes.some((n) => n.startsWith('破招')),
    round: s.round,
    phase: s.phase
  };
  const before = sideState(s, side),
    after = sideState({ ...s, tally: { ...s.tally, falls: [...s.tally.falls, fall] } }, side);
  if (before !== 'open' || after === before) return '';
  return after === 'met' ? '支線 · 此擊可達成' : '支線 · 此擊將使支線失敗';
}
// Old saves' side objectives, as the secondaries that say the same.
const LEGACY_SIDES = {
  beacon: { kind: 'lamp', reward: 'coins' },
  cache: { kind: 'lamp', reward: 'coins' },
  herbs: { kind: 'lamp', reward: 'coins' },
  speed: { kind: 'swift', by: 5, reward: 'coins' },
  safe: { kind: 'intact', reward: 'coins' }
};
// A saved secondary is one of the board's pool, with a hero in place of '*'.
function validSide(s, side) {
  if (!side || typeof side !== 'object' || !SIDE_KINDS[side.kind] || !SIDE_REWARDS.includes(side.reward))
    return false;
  if (side.hero != null && !G.PARTY.includes(side.hero)) return false;
  const pool = s.run.legacyBoard ? Object.values(LEGACY_SIDES) : G.boardOf(s).sides;
  return pool.some((e) =>
    [...new Set([...Object.keys(e), ...Object.keys(side)])].every((k) =>
      k === 'hero' && e.hero === '*'
        ? G.PARTY.includes(side.hero)
        : JSON.stringify(e[k]) === JSON.stringify(side[k])
    )
  );
}

// ── The briefing ─────────────────────────────────────────────────────────
// How a wave is announced in the briefing: by its round, or by the masters it waits on.
function waveLine(map, wave) {
  const list = G.waveList(wave.pieces);
  if (wave.when.round)
    return '第' + NUMERALS[wave.when.round - 1] + '回合，' + list + '自' + wave.place + '入場。';
  const masters = wave.when.halved.map((ref) => pieceName(map, ref)).join('或');
  return masters + '氣血首次過半，兩回合後，' + list + '自' + wave.place + '入場。';
}
const KIND_NAMES = { slay: '斬將', rout: '殲滅' };
const SIDE_MARKS = { open: '◇', met: '✓', failed: '✕' };
// Everything the briefing page shows, for a board at a stage. `s` is the run on this board
// (with its drawn secondary), or null for a look at a board without one (the wiki, the shop's
// look at the next board), which lists the pool instead. `live` adds the state of the fight.
function boardModel(map, stage, s = null, live = false) {
  const board = s ? G.boardOf(s) : BATTLES[map],
    layout = mapLayout(map),
    r = s?.run;
  const masters = board.masters.map((ref) => pieceName(map, ref));
  const kind = board.kind;
  const battle =
    kind === 'rout'
      ? '殲滅 · 場上敵人須全數擊敗。'
      : masters.length > 1
        ? '斬將 · 兩名局主都須倒下。'
        : '斬將 · 擊敗局主即勝，其餘敵人不必全滅。';
  const win =
    kind === 'rout'
      ? '在第十二回合結束前擊敗全部敵人。' + (board.waves.length ? '援軍亦須擊敗。' : '')
      : '在第十二回合結束前擊敗' + masters.join('與') + '。';
  const leader = s ? heroName(r.scene === 'fight' ? s.leader : r.next[0]) : '領隊';
  // 敵情: each 局主, then each 副手; the board's own first, then the leaders of its waves.
  const villain = (key) => G.DETAILS[key]?.rank;
  const row = (key, note = '') => ({
    key,
    rank: villain(key) === 'boss' ? '局主' : '副手',
    name: G.DETAILS[key].name,
    gist: GISTS[key] || '',
    note
  });
  const starts = [
    ...G.encounterKeys(map).slice(0, 2),
    ...board.pieces.map((p) => p.id.split('#')[0]).filter(villain)
  ];
  const leads = board.waves.flatMap((w) =>
    w.pieces
      .map((p) => p.id.split('#')[0])
      .filter(villain)
      .map((key) => [key, w.when.round ? '（第' + NUMERALS[w.when.round - 1] + '回合入場）' : '（援軍）'])
  );
  const foes = [];
  for (const rank of ['boss', 'mini']) {
    for (const key of starts) if (villain(key) === rank) foes.push(row(key));
    for (const [key, note] of leads) if (villain(key) === rank) foes.push(row(key, note));
  }
  // 兵力: how many open the board and come later, and the rank and file by name.
  const start = 4 + board.pieces.length,
    later = board.waves.reduce((n, w) => n + w.pieces.length, 0);
  const chips = new Map();
  for (const key of [
    ...G.encounterKeys(map).slice(2),
    ...[...board.pieces, ...board.waves.flatMap((w) => w.pieces)].map((p) => p.id.split('#')[0])
  ]) {
    if (villain(key)) continue;
    const n = G.DETAILS[key].name;
    if (!chips.has(n)) chips.set(n, { name: n, count: 0, gist: GISTS[key] || '' });
    chips.get(n).count++;
  }
  const sideRow = (entry, withState) => {
    const state = s ? sideState(s, entry) : 'open';
    const keep = SIDE_KINDS[entry.kind].sort === 'keep';
    return {
      kind: entry.kind,
      hero: entry.hero || null,
      name: SIDE_KINDS[entry.kind].name(entry),
      detail: s || entry.hero !== '*' ? SIDE_KINDS[entry.kind].detail(s, entry, map) : '',
      reward: entry.reward,
      rewardText: '勝利時另得' + rewardText(entry, stage) + '。',
      warning: s && entry.hero && sideBenched(s, entry) ? heroName(entry.hero) + '未在出陣名單中，此支線無法達成。' : '',
      ...(withState
        ? {
            state,
            mark: SIDE_MARKS[state],
            stateText: state === 'met' ? '已達成，取勝即得' : state === 'failed' ? '已失' : keep ? '保持中' : '未達成',
            progress: SIDE_KINDS[entry.kind].progress(s, entry),
            lost: state === 'failed' ? sideLost(s, entry) : ''
          }
        : {})
    };
  };
  const recruitId = r && r.stage < 9 ? r.pool[0] : null;
  const model = {
    map,
    stage,
    mapName: layout.name,
    heading: '第' + NUMERALS[stage] + '局 · ' + layout.name,
    kind,
    kindName: KIND_NAMES[kind],
    battle,
    win,
    loss: leader + '倒下，或第十二回合結束仍未取勝。',
    side: r?.side ? sideRow(r.side, live) : null,
    pool: s ? [] : board.sides.map((e) => sideRow(e, false)),
    sideNote: s ? '' : '支線於入局時抽定。',
    recruit: recruitId ? '取勝後，' + heroName(recruitId) + '應帖而來。' : '',
    foes,
    force: {
      start,
      later,
      line: '開局 ' + start + ' 名，援軍 ' + later + ' 名，共 ' + (start + later) + ' 名。',
      chips: [...chips.values()]
    },
    waves: board.waves.map((w) => ({ id: w.id, line: waveLine(map, w), round: w.when.round || null })),
    noWaves: board.waves.length ? '' : '本局沒有援軍。',
    terrain: layout.tactic,
    live: null
  };
  if (live && s) {
    const left = G.objectiveLeft(s);
    model.live = {
      line: '第 ' + s.round + '／' + G.LIMIT + ' 回合　領隊 ' + heroName(s.leader) + '　銀 ' + r.coins + ' 兩',
      masters: G.masterIds(s).map((id) => {
        const u = G.find(s, id),
          name = G.unitDetails(u)?.name || '';
        const hp = Math.max(0, u?.hp || 0);
        return { id, name, hp, maxHp: u?.maxHp || 0, fallen: !left.masters.includes(id), line: name + ' 氣血 ' + hp + '／' + (u?.maxHp || 0) };
      }),
      remaining: kind === 'rout' ? '尚餘敵人 ' + left.foes + ' 名' : '',
      waiting: kind === 'rout' && left.waiting ? '援軍未到 ' + left.waiting + ' 名' : ''
    };
    for (const w of model.waves) {
      const wave = board.waves.find((x) => x.id === w.id);
      w.status = wave.pieces.every((p) => s.units.some((u) => u.id === p.id))
        ? '已入場'
        : s.arrivals?.[w.id] === s.round + 1
          ? '下回合'
          : '';
    }
  }
  return model;
}
// The briefing of the board a run is on, with its drawn secondary; `live` during the fight.
function briefing(s, { live = false } = {}) {
  return boardModel(s.mapIndex, s.run.stage, s, live);
}
// The same for a board at a stage with no run: the secondary pool instead of a drawn one.
function boardBrief(map, stage) {
  return boardModel(map, stage);
}
function recruit(s) {
  const r = s.run,
    id = r.pool.shift();
  if (!id) return '';
  const u = prepareHero(G.startingHero(id)),
    tier = Math.floor(r.stage / 2);
  G.raiseLevel(u, tier);
  u.sp += 1 + r.stage;
  r.bench.push(u);
  if (r.next.length < 5) r.next.push(id);
  G.log(s, 'story', MAZE_TALE.join, G.DETAILS[id].name);
  return id;
}
// Silver paid after a won battle, and for a met secondary. The wiki's mission pages read these.
const REWARDS = {
  clear: 36, // for winning the first stop
  perStage: 5, // added for each later stop
  side: 24, // a secondary that pays silver, on the first stop
  sidePerStage: 3 // added for each later stop
};
function settle(s) {
  const r = s.run;
  if (!s.result || r.status !== 'battle' || r.scene !== 'fight') return false;
  const won = s.result === 'win',
    optional = won && sideDone(s),
    terminal = !won || r.stage === 9;
  let reward = won ? REWARDS.clear + REWARDS.perStage * r.stage : 0;
  r.next = G.party(s).map((u) => u.id);
  r.coins += reward;
  // Credits, stock, recruits and the receipt persist in the same saved transaction.
  if (won) {
    r.chronicle.best = Math.max(r.chronicle.best, r.stage + 1);
    r.chronicle.embers += r.stage === 9 ? 3 : 1;
    if (r.stage === 9) r.chronicle.wins++;
    for (const u of G.company(s)) u.sp++;
    if (optional)
      for (const u of G.party(s).filter(G.living))
        if (!u.mastery.sides.includes(s.mapIndex)) u.mastery.sides.push(s.mapIndex);
  }
  if (terminal) {
    // The run is over: count it, and note who walked it and which boards it reached.
    const past = fillProfile(r.chronicle);
    past.returns++;
    for (const u of G.company(s)) past.walked[u.id] = (past.walked[u.id] || 0) + 1;
    past.seen = MAPS.filter((map) => past.seen.includes(map) || r.route.indexOf(map) <= r.stage);
  }
  const bonus = optional ? paySide(s) : null;
  if (bonus?.reward === 'coins') reward += bonus.amount;
  // Every win but the last brings the next hero, whatever the secondary.
  const newcomer = won && !terminal ? recruit(s) : '';
  r.last = {
    won,
    optional,
    terminal,
    reward,
    recruit: newcomer,
    survivors: G.party(s).filter(G.living).length,
    ...(bonus ? { side: bonus } : {})
  };
  r.shop = makeOffers(s);
  r.last.visit = makeVisit(s);
  r.status = 'camp';
  r.scene = 'after';
  r.beat = 0;
  if (won && r.stage === 0) G.log(s, 'story', MAZE_TALE.shop, WEI.name);
  if (won)
    G.log(s, 'grow', '分得彩頭 ' + (reward - (bonus?.reward === 'coins' ? bonus.amount : 0)) + ' 兩，同行俠客各得 1 武學點。', '通吃坊');
  if (bonus) G.log(s, 'grow', '支線達成，' + rewardText(r.side, r.stage, bonus.manual) + '。', '支線');
  return true;
}
// The secondary's reward, paid as the board is settled: silver, a 武學點 to each fielded hero
// still standing (silver instead on the last board), or a manual into the store (the parcel for
// the next run, on the last board).
function paySide(s) {
  const r = s.run,
    kind = payKind(r.side.reward, r.stage);
  const paid = { kind: r.side.kind, reward: kind, amount: 0, manual: null };
  if (kind === 'coins') {
    paid.amount = REWARDS.side + REWARDS.sidePerStage * r.stage;
    r.coins += paid.amount;
  } else if (kind === 'points') {
    const standing = G.party(s).filter(G.living);
    for (const u of standing) u.sp += 1;
    paid.amount = standing.length;
  } else {
    paid.manual = bonusManual(s);
    if (paid.manual) {
      (r.stage === 9 ? r.chronicle.parcel.manuals : r.manuals).push(paid.manual);
      paid.amount = 1;
    }
  }
  return paid;
}
const payKind = (reward, stage) => (reward === 'points' && stage === 9 ? 'coins' : reward);
// A reward as the text says it; a manual by name once it has been paid.
function rewardText(side, stage, manual = null) {
  const kind = payKind(side?.reward, stage);
  if (kind === 'coins') return '賞銀 ' + (REWARDS.side + REWARDS.sidePerStage * stage) + ' 兩';
  if (kind === 'points') return '出陣生還的俠客各 1 武學點';
  return manual ? '《' + TECHNIQUES[manual].name + '》一卷，已入公庫' : '武譜一卷（入公庫）';
}
function chooseFate(s, id) {
  const r = s.run,
    fate = FATES.find((f) => f.id === id);
  if (
    !fate ||
    r.scene !== 'ended' ||
    !r.last?.terminal ||
    !r.last.won ||
    r.voyage < 5 ||
    r.last.fate
  )
    return false;
  r.last.fate = id;
  if (!r.chronicle.fates.includes(id)) r.chronicle.fates.push(id);
  r.chronicle.lastFate = id;
  G.log(s, 'story', fate.ending, fate.name);
  return true;
}
function buy(s, id) {
  const r = s.run;
  if (r.status !== 'camp' || r.scene !== 'shop') return false;
  const offer = r.shop.find((o) => o.id === id);
  if (!offer || offer.left < 1 || r.coins < offer.price) return false;
  r.coins -= offer.price;
  offer.left--;
  grantLot(s, id);
  G.log(
    s,
    'item',
    '花費 ' +
      offer.price +
      ' 兩，購入' +
      (G.ITEMS[id]?.name || '《' + TECHNIQUES[id].name + '》') +
      '。',
    '通吃坊'
  );
  return true;
}
function canPlaceHero(s, id, destination) {
  if (
    !G.managesCompany(s) ||
    !G.company(s).some((u) => u.id === id) ||
    !Number.isInteger(destination) ||
    destination < -1 ||
    destination >= 5
  )
    return false;
  return (
    seatsFor(s.run).indexOf(id) !== destination && !(destination === -1 && s.run.next.length === 1)
  );
}
function placeHero(s, id, destination) {
  if (!canPlaceHero(s, id, destination)) return false;
  const r = s.run,
    posts = seatsFor(r),
    origin = posts.indexOf(id);
  if (origin >= 0) posts[origin] = destination >= 0 ? posts[destination] : null;
  if (destination >= 0) posts[destination] = id;
  const members = posts.filter(Boolean);
  const captain = members.includes(r.next[0]) ? r.next[0] : members[0];
  r.next = [captain, ...members.filter((member) => member !== captain)];
  r.posts = posts;
  return true;
}
function toggleSeat(s, id) {
  if (!s.run) return false;
  const seats = seatsFor(s.run);
  const active = seats.includes(id);
  const dest = active ? -1 : seats.indexOf(null);
  return (active || dest >= 0) && placeHero(s, id, dest);
}
function appointLeader(s, id) {
  const r = s.run;
  if (!G.managesCompany(s) || r.next[0] === id || !r.next.includes(id)) return false;
  r.posts = seatsFor(r);
  r.next = [id, ...r.next.filter((member) => member !== id)];
  return true;
}
// The enemies a board opens with: its fixed four on their spawn tiles, with the stage's numbers,
// then the board's extra starting pieces (battles.js) in their data order.
function defenders(s) {
  const map = s.mapIndex,
    layout = mapLayout(map),
    rows = G.stageRows(map, s.run.stage),
    keys = G.encounterKeys(map);
  const fixed = G.SLOTS.map((slot, i) => {
    const [hp, atk, def, step, range] = G.withMods(rows[slot], G.DETAILS[keys[i]]?.traits?.mods),
      p = layout.enemies[i];
    return G.makeUnit(G.slotId(map, slot), 'enemy', p.x, p.y, hp, 0, atk, def, step, range);
  });
  return [...fixed, ...G.boardOf(s).pieces.map((piece) => G.pieceUnit(s, piece))];
}
function advance(s) {
  const r = s.run;
  if (r.status !== 'camp' || r.scene !== 'shop') return false;
  if (r.last.terminal) {
    r.status = r.scene = 'ended';
    return true;
  }
  const all = G.company(s),
    ids = r.next;
  if (
    !uniqueMembers(
      ids,
      all.map((u) => u.id)
    ) ||
    !ids.length ||
    ids.length > 5
  )
    return false;
  r.stage++;
  s.mapIndex = r.route[r.stage];
  const layout = mapLayout(s.mapIndex);
  for (const u of all) {
    u.hp = Math.min(u.maxHp, u.hp + Math.ceil(u.maxHp * 0.48));
    u.mp = Math.min(u.maxMp, u.mp + Math.ceil(u.maxMp * 0.55));
    u.acted = u.moved = u.brace = false;
    u.origin = null;
    delete u.route;
    delete u.conditions;
    delete u.blinkSerial;
    delete u.unplacedArts;
    for (const k of BOARD_MARKS) delete u[k];
  }
  delete s.zones;
  const line = ids.map((id) =>
    Object.assign(
      all.find((u) => u.id === id),
      layout.allies[seatsFor(r).indexOf(id)]
    )
  );
  r.bench = all.filter((u) => !ids.includes(u.id));
  s.units = [...line, ...defenders(s)];
  s.leader = s.selected = ids[0];
  s.round = 1;
  setUpBoard(s);
  s.phase = 'ally';
  s.result = null;
  s.reason = '';
  s.foreshadow = false;
  r.marked = false;
  r.status = 'battle';
  r.scene = 'before';
  r.openingCast = ids.slice(0, 2);
  r.beat = 0;
  delete r.objectivePos;
  G.identifyEncounter(s);
  r.formationOpen = true;
  r.shop = [];
  r.last = null;
  G.log(
    s,
    'story',
    CHAMBER_TALES[s.mapIndex].arrival,
    '第' + NUMERALS[r.stage] + '局・' + layout.name
  );
  return true;
}
function acceptsGuide(s, u, id) {
  return !!(
    u &&
    TECHNIQUES[id]?.manual &&
    s.run.manuals.includes(id) &&
    !u.guides.includes(id) &&
    G.canPrepare(s, u) &&
    !s.run.last?.terminal
  );
}
function giveGuide(s, u, id) {
  if (!acceptsGuide(s, u, id)) return false;
  s.run.manuals.splice(s.run.manuals.indexOf(id), 1);
  u.guides.push(id);
  G.log(
    s,
    'grow',
    '受授《' + TECHNIQUES[id].name + '》，可在「授業武譜」參悟。',
    G.DETAILS[u.id].name
  );
  return true;
}
function guideInventory(s) {
  const all = G.company(s);
  return [...new Set(s.run.manuals)].map((id) => ({
    id,
    name: TECHNIQUES[id].name,
    count: s.run.manuals.filter((v) => v === id).length,
    description: TECHNIQUES[id].desc,
    eligible: all.map((u) => ({
      id: u.id,
      name: G.DETAILS[u.id].name,
      canReceive: acceptsGuide(s, u, id),
      reason: u.guides.includes(id) ? '已受授' : '目前無法授予'
    }))
  }));
}
function milestone(u, gate) {
  if (!gate) return { met: true, label: '' };
  let met, label;
  if (gate.metric === 'side') {
    met = u.mastery.sides.includes(gate.map);
    // The secondary is drawn per run, so the gate names the board's secondary, not one kind.
    label =
      mapLayout(gate.map).name +
      ' · 支線（' +
      (met ? '已完成' : '須出戰生還') +
      '）';
  } else {
    const n = gate.metric === 'level' ? u.level : u.mastery[gate.metric];
    met = n >= gate.atLeast;
    label =
      (GATE_LABELS[gate.metric] || '等級') + ' ' + Math.min(n, gate.atLeast) + '／' + gate.atLeast;
  }
  if (gate.or) {
    const alt = milestone(u, gate.or);
    met ||= alt.met;
    label += ' 或 ' + alt.label;
  }
  return { met, label };
}
const eligibleArt = (u, id) =>
  id === 'signature' || (u.learned.includes(id) && TECHNIQUES[id]?.kind !== 'basic');
function canPlaceLearned(s, u, id) {
  return G.canConfigure(s, u) || (!!id && G.canAct(s, u) && !!u.unplacedArts?.includes(id));
}
function studyState(s, u, id) {
  if (!u) return null;
  const root = G.TALENTS[id],
    intrinsic = id === 'signature',
    a = intrinsic ? G.artFor(u, 'signature') : TECHNIQUES[id];
  if ((!a && !root) || (a?.owner && a.owner !== u.id) || (a?.manual && !u.guides.includes(id)))
    return null;
  const parents = a?.needs || [],
    rank = u.talents[id] || 0;
  const learned = intrinsic || (root ? rank >= 3 : u.learned.includes(id));
  const ready = parents.every(
    (p) => p === 'signature' || (G.TALENTS[p] ? u.talents[p] > 0 : u.learned.includes(p))
  );
  const trial = milestone(u, a?.gate),
    price = intrinsic ? 0 : root ? 1 : a.points;
  const requisites = parents.map((p) =>
    p === 'signature' ? G.DETAILS[u.id].skill : TECHNIQUES[p]?.name || G.TALENTS[p].name + '一重'
  );
  if (trial.label) requisites.push(trial.label);
  const allowed = G.canPrepare(s, u) && !s.run.last?.terminal;
  const source = a?.manual ? 'guides' : intrinsic ? 'signature' : 'school';
  const kind = intrinsic ? 'signature' : root ? 'root' : a.kind || 'active';
  return {
    id,
    name: (a || root).name,
    icon: (a || root).icon,
    kind,
    tier: a?.tier || 0,
    parents,
    source,
    sourceNote: a?.source || '',
    description: (a || root).desc,
    facts: moveFacts(s, u, id),
    cost: price,
    rank: root ? '第 ' + rank + '／3 重' : '',
    learned,
    canLearn: allowed && !learned && ready && trial.met && u.sp >= price,
    requirement: requisites.join('、'),
    status: learned
      ? root
        ? '已精通'
        : '已習得'
      : !ready
        ? '先修前式'
        : !trial.met
          ? '待完成歷練'
          : u.sp < price
            ? '武學點不足'
            : allowed
              ? '可參悟'
              : '整備時修習',
    canEquip: kind !== 'basic' && kind !== 'root' && learned && canPlaceLearned(s, u, id),
    equipped: u.slots.includes(id),
    range: a?.range,
    mp: a?.mp ? Math.max(2, a.mp - 2 * u.talents.breath - G.commandDiscount(s, u)) : 0,
    hpCost: a?.hpCost || 0
  };
}
function learn(s, u, id) {
  if (!s.run || !studyState(s, u, id)?.canLearn) return false;
  if (G.TALENTS[id]) return G.train(s, u, id);
  const art = TECHNIQUES[id];
  u.sp -= art.points;
  u.learned.push(id);
  if (art.kind !== 'basic' && G.canAct(s, u) && !G.canConfigure(s, u)) {
    (u.unplacedArts ??= []).push(id);
    const empty = u.slots.indexOf(null);
    if (empty >= 0) setSlot(s, u, empty, id);
  }
  G.log(
    s,
    'grow',
    (art.kind === 'basic' ? '普攻精進為「' : '參悟「') + art.name + '」。',
    G.DETAILS[u.id].name
  );
  return true;
}
function setSlot(s, u, index, id) {
  if (
    !canPlaceLearned(s, u, id) ||
    !Number.isInteger(index) ||
    index < 0 ||
    index > 2 ||
    (id !== null && !eligibleArt(u, id)) ||
    u.slots[index] === id
  )
    return false;
  const prior = u.slots.indexOf(id);
  if (id && prior >= 0) u.slots[prior] = u.slots[index];
  u.slots[index] = id;
  if (u.unplacedArts) u.unplacedArts = u.unplacedArts.filter((art) => art !== id);
  if (!u.activeArt || !u.slots.includes(u.activeArt)) u.activeArt = u.slots.find(Boolean) || null;
  return true;
}
function readyArt(s, u, id) {
  if (!G.canAct(s, u) || !G.equippedArts(u).includes(id) || !eligibleArt(u, id)) return false;
  u.activeArt = id;
  return true;
}
function treeModel(s, u) {
  const path = HERO_PATHS[u.id],
    company = G.company(s);
  const school = ['force', 'guard', 'breath', 'signature'].map((id, lane) => ({
    ...studyState(s, u, id),
    lane
  }));
  for (const row of path.layout)
    row.forEach((id, lane) => {
      if (id) school.push({ ...studyState(s, u, id), lane });
    });
  const guides = u.guides.map((id) => studyState(s, u, id));
  const library = [...school, ...guides].filter(
    (n) => n.learned && !['root', 'basic'].includes(n.kind)
  );
  return {
    id: u.id,
    name: G.DETAILS[u.id].name,
    book: path.book,
    pathTitle: path.title,
    origin: path.origin,
    originNote: CATALOG_NOTE,
    recallNote: RECALL_NOTE,
    sp: u.sp,
    camp: s.run.status === 'camp',
    leaderName: COMMANDS[u.id].name,
    leaderDesc: commandDescription(u.id),
    basicName: G.basicFor(u).name,
    basicFacts: moveFacts(s, u, 'basic'),
    school,
    guides,
    library,
    slots: [...u.slots],
    canConfigure: G.canConfigure(s, u),
    fieldStudy: !!u.unplacedArts?.length,
    unassignedCount: s.run.manuals.length,
    roster: company.map((v) => ({ id: v.id, name: G.DETAILS[v.id].name }))
  };
}
function campModel(s) {
  const r = s.run,
    last = r.last,
    final = last.terminal,
    library = final ? r.chronicle.parcel.manuals : r.manuals;
  return {
    visit: r.last.visit,
    stageName: mapLayout(s.mapIndex).name,
    nextName: final ? '' : mapLayout(r.route[r.stage + 1]).name,
    final,
    lost: !last.won,
    coins: r.coins,
    reward: last.reward,
    recruit: G.DETAILS[last.recruit]?.name || '',
    objective: !last.won
      ? ''
      : last.optional
        ? '支線達成：' + sideName(r.side) + '。' + rewardText(r.side, r.stage, last.side?.manual) + '。'
        : '支線未成：' + sideName(r.side) + '。',
    story: !last.won
      ? s.reason + MAZE_TALE.loss
      : r.stage === 9
        ? MAZE_TALE.win
        : CHAMBER_TALES[s.mapIndex].victory,
    offers: r.shop.map((o) => {
      const item = G.ITEMS[o.id],
        a = TECHNIQUES[o.id];
      const owned = item
        ? (final ? r.chronicle.parcel.stock : s.stock)[o.id] || 0
        : library.filter((id) => id === o.id).length;
      return {
        ...o,
        name: item?.name || '《' + a.name + '》',
        group: item?.kind || 'manual',
        icon: item?.icon || 'book',
        description: item?.desc || a.desc + '　每冊限授一人，另花 ' + a.points + ' 武學點參悟。',
        owned,
        canBuy: o.left > 0 && r.coins >= o.price
      };
    }),
    unassigned: final ? [] : guideInventory(s),
    roster: G.company(s).map((u) => ({
      boonName: COMMANDS[u.id].name,
      boonDesc: commandDescription(u.id),
      id: u.id,
      name: G.DETAILS[u.id].name,
      level: u.level,
      sp: u.sp,
      selected: r.next.includes(u.id),
      leader: r.next[0] === u.id
    })),
    deployCount: r.next.length,
    selectedValid: r.next.length > 0 && r.next.length <= 5
  };
}

export { SIDE_KINDS, LEGACY_SIDES, drawSide, sideState, sideDone, sideLost, sideForecast, sideBenched, rewardText, paySide, waveLine, briefing, boardBrief, swapStart, beginBattle, BATTLES_EDITION, setUpBoard, migrateBattles, defenders, mapStages, TECHNIQUES_RENAMED, TECHNIQUES_REMOVED, migrateSave, BOARD_MARKS, NUMERALS, REWARDS, LEGACY, cleanName, youthName, closingFor, newSeed, drawLots, parcelCount, startRun, restoreRun, dialogue, turnPage, deployLineup, settle, chooseFate, buy, canPlaceHero, placeHero, toggleSeat, appointLeader, advance, acceptsGuide, giveGuide, guideInventory, studyState, learn, setSlot, readyArt, treeModel, campModel };
