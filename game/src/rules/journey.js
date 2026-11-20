import { WAKES, FATES, closingFor } from '../data/wake-tale.js';
import { random, shuffled } from './lots.js';
import { makeOffers, makeVisit, validVisit, grantLot } from './ferry-market.js';
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
import { mapLayout } from '../data/terrain.js';
import { TECHNIQUES, MANUAL_PRICES, CAPTAINS } from '../data/martial-arts.js';
import { MAZE_TALE, CHAMBER_TALES, SIDE_TALES, YOUTH, WEI } from '../data/maze-tale.js';
import { HERO_VOICES } from '../data/hero-voices.js';

const NUMERALS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
const goals = [
  'beacon',
  'speed',
  'herbs',
  'safe',
  'beacon',
  'cache',
  'safe',
  'herbs',
  'speed',
  'beacon'
];
const goalNames = {
  beacon: '點亮引路燈',
  cache: '尋回姓名籤',
  herbs: '接應傷者',
  speed: '搶在限時之前',
  safe: '全員生還'
};
const mapGoalType = (index) => goals[index];
const mapGoalName = (index) => goalNames[goals[index]];
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
    voyage: chronicle.returns + 1,
    priorFate: chronicle.lastFate,
    seed,
    route: routeFor(seed),
    stage: 0,
    status: 'battle',
    scene: 'before',
    openingCast: ids.slice(0, 2),
    beat: 0,
    goal: goals[0],
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
  G.identifyEncounter(s);
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
// 青鋒劍 left the shop when its place went to 楊過's 古墓長劍. A save still holding one gets its
// price back: the hero who carried it takes up their own weapon, and it leaves shelf and stores.
const ITEMS_REMOVED = Object.freeze({ blueEdge: 33 });
function dropRemovedItems(s) {
  const r = s.run;
  for (const [id, price] of Object.entries(ITEMS_REMOVED)) {
    let count = 0;
    for (const u of [...s.units, ...(Array.isArray(r.bench) ? r.bench : [])]) {
      if (u?.weapon !== id) continue;
      const own = G.startingHero(u.id).weapon;
      if (s.stock?.[own] > 0) s.stock[own]--;
      u.weapon = own;
      count++;
    }
    for (const stock of [s.stock, r.chronicle?.parcel?.stock])
      if (stock && id in stock) {
        count += Number.isInteger(stock[id]) && stock[id] > 0 ? stock[id] : 0;
        delete stock[id];
      }
    if (Array.isArray(r.shop)) r.shop = r.shop.filter((o) => o?.id !== id);
    if (count && Number.isInteger(r.coins)) r.coins += count * price;
  }
}
function migrateSave(s, removed = TECHNIQUES_REMOVED, renamed = TECHNIQUES_RENAMED) {
  const r = s?.run;
  if (!r || !Array.isArray(s.units)) return s;
  dropRemovedItems(s);
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
const ROUND_MARKS = [...BOARD_MARKS.slice(0, 6), 'signaturePush', 'lastSiphonRound', 'lastDazeRound'];
// Older saves have none of these fields; a malformed one is dropped rather than failing the save.
function tidyMarks(s) {
  for (const u of [...s.units, ...s.run.bench]) {
    for (const k of ROUND_MARKS) if (u[k] != null && !Number.isFinite(u[k])) delete u[k];
    for (const k of ['woke', 'phased']) if (u[k] != null && typeof u[k] !== 'boolean') delete u[k];
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
          (z) => z && Number.isInteger(z.through) && z.through >= s.round && Array.isArray(z.tiles)
        )
      : [];
    if (zones.length) s.zones = zones;
    else delete s.zones;
  }
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
    r.goal !== goals[s.mapIndex] ||
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
        G.DETAILS[u.id] &&
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
    battle: ['before', 'prep', 'fight'],
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
    beats.push({ who: 'youth', text: r.last?.optional ? script.rescue : script.missed });
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
function turnPage(s, skip = false) {
  const r = s.run;
  if (!['before', 'after'].includes(r.scene)) return false;
  if (!skip && r.beat < dialogue(s).length - 1) {
    r.beat++;
    return true;
  }
  r.scene = r.scene === 'before' ? 'prep' : 'shop';
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
  G.log(s, 'system', active.map((u) => G.unitDetails(u).name).join('、') + '出陣。', '整備');
  return true;
}
function mapMission(map, marker) {
  const goal = goals[map],
    stationed = ['beacon', 'herbs', 'cache'].includes(goal);
  const tile = stationed ? marker || mapLayout(map).objective : null;
  const instruction = tile
    ? '於第 ' +
      (tile.x + 1) +
      ' 列、第 ' +
      (tile.y + 1) +
      ' 行的燈記結束一名俠客的行動，且該俠客仍須生還。'
    : goal === 'safe'
      ? '擊敗局主時，全體出戰俠客仍須生還。'
      : '在第五回合結束前擊敗局主。';
  const boss = G.DETAILS[CAPTAINS[map][0]].name;
  return {
    goal,
    name: goalNames[goal],
    boss,
    tile,
    instruction,
    win: '在第 ' + G.LIMIT + ' 回合結束前擊敗' + boss + '。',
    loss: '領隊倒下，或回合用盡。'
  };
}
function objective(s) {
  const r = s.run,
    mission = mapMission(s.mapIndex, G.objectiveTile(s)),
    stationed = !!mission.tile;
  const done =
    r.status === 'battle'
      ? stationed
        ? r.marked
        : s.result === 'win' && (r.goal === 'safe' ? G.party(s).every(G.living) : s.round <= 5)
      : r.last.optional;
  return { ...mission, done };
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
// Silver paid after a won battle. The wiki's mission pages read these.
const REWARDS = {
  clear: 36, // for winning the first stop
  perStage: 5, // added for each later stop
  side: 19 // extra when the side objective is also done
};
function settle(s) {
  const r = s.run;
  if (!s.result || r.status !== 'battle' || r.scene !== 'fight') return false;
  const won = s.result === 'win',
    optional = won && objective(s).done,
    terminal = !won || r.stage === 9;
  const reward = won
    ? REWARDS.clear + REWARDS.perStage * r.stage + (optional ? REWARDS.side : 0)
    : 0;
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
  const newcomer = optional && !terminal ? recruit(s) : '';
  r.last = {
    won,
    optional,
    terminal,
    reward,
    recruit: newcomer,
    survivors: G.party(s).filter(G.living).length
  };
  r.shop = makeOffers(s);
  r.last.visit = makeVisit(s);
  r.status = 'camp';
  r.scene = 'after';
  r.beat = 0;
  if (won && r.stage === 0) G.log(s, 'story', MAZE_TALE.shop, WEI.name);
  if (won) G.log(s, 'grow', '分得彩頭 ' + reward + ' 兩，同行俠客各得 1 武學點。', '通吃坊');
  return true;
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
function defenders(s) {
  const depth = s.run.stage,
    map = s.mapIndex,
    layout = mapLayout(map);
  const boss = map === 9,
    chief = CAPTAINS[map][0],
    units = [];
  const ids = [chief, 'echoBlade', 'echoBow', 'echoScout'];
  const veteran = Math.max(0, depth - 4);
  const seasoned = Math.max(0, depth - 3);
  const stats = [
    [
      99 + depth * 32 + seasoned * 40 + (boss ? 240 : 0),
      23 + veteran * 3 + Math.round(depth * 3.2 + veteran * 5.3),
      10 + Math.round(depth * 1.6),
      depth >= 7 ? 4 : depth >= 3 ? 3 : 2,
      boss || depth >= 6 || [2, 4, 8].includes(map) ? 2 : 1
    ],
    [
      55 + depth * 12 + seasoned * 29,
      19 + veteran * 3 + Math.round(depth * 2.2 + seasoned * 5.4),
      7 + depth,
      depth >= 3 ? 3 : 2,
      depth >= 6 ? 2 : 1
    ],
    [
      48 + depth * 11 + seasoned * 29,
      17 + veteran * 1 + Math.round(depth * 2.2 + seasoned * 5.4),
      5 + depth,
      depth >= 4 ? 3 : 2,
      depth >= 6 ? 4 : 3
    ],
    [
      51 + depth * 11 + seasoned * 29,
      18 + Math.round(depth * 2.2 + seasoned * 5.4),
      7 + depth,
      depth >= 5 ? 4 : 3,
      depth >= 7 ? 2 : 1
    ]
  ];
  const keys = G.encounterKeys(map);
  for (const [i, id] of ids.entries()) {
    const [hp, atk, def, step, range] = G.withMods(stats[i], G.DETAILS[keys[i]]?.traits?.mods),
      p = layout.enemies[i];
    units.push(G.makeUnit(id, 'enemy', p.x, p.y, hp, 0, atk, def, step, range));
  }
  return units;
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
  s.phase = 'ally';
  s.result = null;
  s.reason = '';
  s.foreshadow = false;
  r.goal = goals[s.mapIndex];
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
    label =
      mapLayout(gate.map).name +
      ' · ' +
      goalNames[goals[gate.map]] +
      '（' +
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
    objective: last.optional ? SIDE_TALES[r.goal] : '這一局沒有救下局中的影子。',
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

export { TECHNIQUES_RENAMED, TECHNIQUES_REMOVED, migrateSave, BOARD_MARKS, NUMERALS, REWARDS, mapGoalType, mapGoalName, LEGACY, cleanName, youthName, closingFor, newSeed, drawLots, parcelCount, startRun, restoreRun, dialogue, turnPage, deployLineup, mapMission, objective, settle, chooseFate, buy, canPlaceHero, placeHero, toggleSeat, appointLeader, advance, acceptsGuide, giveGuide, guideInventory, studyState, learn, setSlot, readyArt, treeModel, campModel };
