import { ART_FORMS, WEAPON_FORMS } from '../data/form-catalog.js';
import {
  actionForms,
  contactPlan,
  forcedStep,
  secondaryTargets,
  supportEntry,
  weaponFormText,
  AILMENTS
} from './form-rules.js';
import {
  ENCOUNTERS,
  RANKS,
  STATUS_POWER,
  SIGNATURE_RULES,
  VILLAIN_FORMS,
  VILLAINS,
  TROOPS
} from '../data/encounters.js';
import { BATTLES } from '../data/battles.js';
import { BOARD_OBJECTS } from '../data/board-objects.js';
import { NEW_HEROES } from '../data/new-heroes.js';
import { inRealm } from '../data/realms.js';
import { rosterPortrait } from '../data/roster-art.js';
import {
  COMMANDS,
  commandBonus,
  effectsOf,
  selfEffectsOf,
  applyCondition,
  CONDITION_NAMES,
  progress
} from './battle-mastery.js';
import { FIELD_SIZE, fieldCells, mapLayout, validTile, tileInfo } from '../data/terrain.js';
import { TECHNIQUES, WARES, CAPTAINS } from '../data/martial-arts.js';
import { CHAMBER_TALES, MAZE_TALE, QIUBAI, YOUTH } from '../data/maze-tale.js';
import { ENCOUNTER_SCRIPT } from '../data/encounter-script.js';
const SIZE = FIELD_SIZE;
const FIELD_EDITION = 1;
const LIMIT = 12;
// Round and board numbers as the text says them; rounds run to LIMIT.
const NUMERALS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
const ORIGINAL_PARTY = ['hero', 'medic', 'guard'];
const PARTY = [...ORIGINAL_PARTY, 'guo', 'xiao', 'duan', ...Object.keys(NEW_HEROES)];
const BOOKS = {
  ...Object.fromEntries(Object.entries(NEW_HEROES).map(([id, h]) => [id, h.book])),
  hero: '笑傲江湖',
  medic: '笑傲江湖',
  guard: '笑傲江湖',
  guo: '射鵰英雄傳、神鵰俠侶',
  xiao: '神鵰俠侶',
  duan: '天龍八部'
};
const leader = (s) => s.leader || 'hero';
const key = (x, y) => x + ',' + y;
const fromKey = (k) => {
  const [x, y] = k.split(',').map(Number);
  return { x, y };
};
const distance = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const living = (u) => u.hp > 0;
const ally = (u) => u.side === 'ally';
const at = (s, x, y) => s.units.find((u) => living(u) && u.x === x && u.y === y);
const find = (s, id) =>
  s.units.find((u) => u.id === id) || s.run?.bench?.find((u) => u.id === id);
const party = (s) => s.units.filter(ally);
const company = (s) => [...party(s), ...(s.run?.bench || [])];
const commanderId = (s) => (s.run ? CAPTAINS[s.mapIndex][0] : 'chief');
const enemies = (s) => s.units.filter((u) => u.side === 'enemy');
// Board objects (board-objects.js, battles.js `objects`) are units of side 'prop': on the board,
// with 氣血, taking no turn, and neither the heroes' nor the black stones'.
const isProp = (u) => u?.side === 'prop';
const propKind = (u) => (isProp(u) ? BOARD_OBJECTS[u.encounterId || u.id]?.kind || null : null);
const props = (s) => (s?.units || []).filter(isProp);
// Whether u may strike t: a piece of the other side, or a board object u's side is there to break
// (a hero, a 'break' object; a black stone, a 'keep' one). An object strikes no one.
function hostile(u, t) {
  if (!u || !t || isProp(u)) return false;
  if (isProp(t)) return propKind(t) === (ally(u) ? 'break' : 'keep');
  return t.side !== u.side;
}
// While the heroes are being deployed (journey.js deployLineup) nobody acts; swaps only.
const canAct = (s, u) =>
  !!u &&
  (!s.run?.scene || s.run.scene === 'fight') &&
  !s.run?.deploying &&
  s.phase === 'ally' &&
  !s.result &&
  ally(u) &&
  living(u) &&
  !u.acted &&
  s.units.includes(u);
const canPrepare = (s, u) =>
  canAct(s, u) || (!!u && managesCompany(s) && ally(u) && company(s).includes(u));
const managesCompany = (s) =>
  s.run?.scene === 'prep' || (s.run?.scene === 'shop' && !s.run.last?.terminal);
const valid = validTile;
const terrainInfo = tileInfo;
const terrain = (x, y, map = 0) => tileInfo(x, y, map)?.name;
const cover = (x, y, map = 0) => (tileInfo(x, y, map)?.defense || 0) > 0;
const walkable = (x, y, map = 0) => Number.isFinite(tileInfo(x, y, map)?.cost);

const ITEMS = {
  jadeCane: {
    name: '青竹棒',
    kind: 'weapon',
    owner: 'huang',
    atk: 5,
    icon: 'sword',
    desc: '竹節勻直，棒頭輕靈。'
  },
  tombSword: {
    name: '古墓長劍',
    kind: 'weapon',
    owner: 'yang',
    atk: 5,
    icon: 'sword',
    desc: '古墓派的輕劍，劍身細窄，出手極快。'
  },
  darkIron: {
    name: '玄鐵重劍',
    kind: 'weapon',
    owner: 'yang',
    atk: 8,
    icon: 'sword',
    desc: '獨臂也能揮動的玄鐵劍，威勢沉雄。'
  },
  mingSash: {
    name: '明教護腕',
    kind: 'weapon',
    owner: 'zhang',
    atk: 4,
    icon: 'hand',
    desc: '厚布束腕，便於運轉掌力。'
  },
  foxSaber: {
    name: '胡家單刀',
    kind: 'weapon',
    owner: 'hu',
    atk: 6,
    icon: 'sword',
    desc: '關外長刀，利於翻腕連斬。'
  },
  // Held for these two since the item art came in (ROADMAP Q-N25): 袁承志 finds the sword on
  // 韋小寶's shelf once he is in the company; 狄雲 arrives wearing the coat (STARTING_GEAR).
  goldSerpentBlade: {
    name: '金蛇劍',
    kind: 'weapon',
    owner: 'chengZhi',
    atk: 8,
    icon: 'sword',
    desc: '劍身彎曲如蛇，劍尖分叉，金光之中隱隱透著一道血痕。'
  },
  silkwormCoat: {
    name: '烏蠶衣',
    kind: 'gear',
    owner: 'diYun',
    def: 5,
    icon: 'shield',
    desc: '大雪山烏蠶絲所織的貼身軟甲，刀劍不入。防禦增加 5。'
  },
  ...WARES,
  pine: {
    name: '華山長劍',
    kind: 'weapon',
    icon: 'sword',
    owner: 'hero',
    atk: 4,
    desc: '華山弟子所佩的長劍，劍鍔已被手掌磨亮。'
  },
  staff: {
    name: '綠竹短簫',
    kind: 'weapon',
    icon: 'leaf',
    owner: 'medic',
    atk: 3,
    desc: '盈盈珍藏的短簫，簫聲清越，適合調息。'
  },
  pole: {
    name: '精鋼軟鞭',
    kind: 'weapon',
    icon: 'sword',
    owner: 'guard',
    atk: 4,
    desc: '向問天的防身軟鞭，收放之間變化難測。'
  },
  wraps: {
    name: '布纏護手',
    kind: 'weapon',
    icon: 'hand',
    owner: 'guo',
    atk: 3,
    desc: '一雙護住指節的舊布纏，隨郭靖走過草原與中原。'
  },
  twins: {
    name: '古墓雙劍',
    kind: 'weapon',
    icon: 'swords',
    owner: 'xiao',
    atk: 4,
    desc: '輕靈的兩口長劍，可分使兩路劍招。'
  },
  fan: {
    name: '大理摺扇',
    kind: 'weapon',
    icon: 'feather',
    owner: 'duan',
    atk: 2,
    desc: '扇骨刻著山茶，持扇點指，進退從容。'
  },
  frost: {
    name: '寒潭短劍',
    kind: 'weapon',
    icon: 'sword',
    owner: 'hero',
    atk: 7,
    desc: '劍短而輕，鋒口泛著一線寒青。'
  },
  bracer: {
    name: '玄鐵護腕',
    kind: 'gear',
    icon: 'shield',
    def: 3,
    desc: '皮革內縫有薄鐵片，能替佩者卸勁。'
  },
  jade: {
    name: '青玉佩',
    kind: 'gear',
    icon: 'diamond',
    power: 7,
    desc: '溫玉貼身，能助運氣行功。'
  },
  remedy: {
    name: '金創藥',
    kind: 'use',
    icon: 'bottle',
    hp: 48,
    desc: '為使用者回復 48 點氣血。每次用去一份。'
  },
  elixir: {
    name: '回氣丹',
    kind: 'use',
    icon: 'drop',
    mp: 30,
    desc: '為使用者回復 30 點內力。每次用去一份。'
  }
};
for (const [id, forms] of Object.entries(WEAPON_FORMS)) {
  const item = ITEMS[id];
  ITEMS[id] = { ...item, forms, desc: item.desc + ' ' + weaponFormText(forms) };
}
const TALENTS = {
  force: { name: '淬鋒', icon: 'sword', desc: '每重提升 3 點攻擊。' },
  guard: { name: '固本', icon: 'shield', desc: '每重提升 2 點防禦。' },
  breath: { name: '凝氣', icon: 'drop', desc: '每重提升 5 點絕技威力，並減少 2 點內力消耗。' }
};
const DETAILS = {
  ...NEW_HEROES,
  hero: {
    name: '令狐冲',
    role: '劍客',
    school: '華山派',
    mini: 'hero',
    portrait: 'hero',
    epithet: '華山浪子',
    bio: '華山派大弟子，生性灑脫而重情義，思過崖上曾得風清揚指點劍法。入局之時他一身濕氣，手上只剩華山劍法與石壁上瞧來的幾招；那一路有進無退的劍法，要在局中一式一式想起。',
    basic: '華山劍法',
    skill: '石壁劍招',
    skillIcon: 'sword',
    skillDesc: '依思過崖石壁所刻的五嶽劍招出劍，可攻擊兩格內的一名敵人。',
    skillRange: 2,
    cost: 9
  },
  medic: {
    name: '任盈盈',
    role: '琴師',
    school: '日月神教',
    mini: 'medic',
    portrait: 'medic',
    epithet: '綠竹知音',
    bio: '日月神教聖姑，精於琴簫，在洛陽綠竹巷以琴音為令狐冲療傷，兩人由一卷曲譜結緣。入局之時她手上只剩一柄短劍與清心普善咒；琴簫合奏的那一曲，要到最後方才想起。',
    basic: '日月短劍',
    skill: '清心普善咒',
    skillIcon: 'leaf',
    skillDesc: '奏清心普善咒，為三格內一位友軍回復氣血並解除不良狀態，也可為自己施術。',
    skillRange: 3,
    cost: 10
  },
  guard: {
    name: '向問天',
    role: '豪俠',
    school: '日月神教',
    mini: 'guard',
    portrait: 'guard',
    epithet: '天王老子',
    bio: '人稱「天王老子」，是任我行的親信，曾與令狐冲並肩脫險，兩人從此肝膽相照。入局之時他雙手猶帶鐐銬，手上只剩一條鐵鞭與卸力入地的粗淺功夫。',
    basic: '鐵鞭橫江',
    skill: '吸功入地小法',
    skillIcon: 'spark',
    skillDesc: '卸去相鄰敵人的來勁並還擊，此擊免受還擊；至下回合受到的傷害減三成，還擊改以全力計算。',
    skillRange: 1,
    cost: 9
  },
  guo: {
    name: '郭靖',
    role: '掌俠',
    school: '江南七怪門下',
    mini: 'guo',
    portrait: 'guo',
    epithet: '大漠俠士',
    bio: '自幼長於漠北，後隨洪七公學掌，鎮守襄陽多年。有人呼救，他是定要去的。入局之時他手上只剩江南七位恩師所授的掌法與分筋錯骨手；降龍十八掌要從頭一掌想起。',
    basic: '南山掌法',
    skill: '分筋錯骨手',
    skillIcon: 'hand',
    skillDesc: '扣住相鄰敵人的關節一扭，攻擊降低 4 點，持續兩回合。',
    skillRange: 1,
    cost: 9
  },
  xiao: {
    name: '小龍女',
    role: '雙劍',
    school: '古墓派',
    mini: 'xiao',
    portrait: 'xiao',
    epithet: '古墓清影',
    bio: '古墓派傳人，性子清冷，言語極少。入局之時她手上只剩古墓入門的天羅地網勢；一人分使兩柄劍，是很後來的事，要在局中想起。',
    basic: '玉女劍法',
    skill: '天羅地網勢',
    skillIcon: 'feather',
    skillDesc: '雙掌織成羅網擊中相鄰敵人，本回合與下一回合敵人移動減 2。',
    skillRange: 1,
    cost: 9
  },
  duan: {
    name: '段譽',
    role: '劍氣',
    school: '大理段氏',
    mini: 'duan',
    portrait: 'duan',
    epithet: '大理公子',
    bio: '大理段氏子弟，是個書獃子，將這趟稀奇的際遇當作又一場白日夢，照樣向人人作揖。入局之時他手上只剩無量山洞中學來的北冥神功；六脈神劍時靈時不靈，要一脈一脈想起。',
    basic: '點指截脈',
    skill: '北冥神功',
    skillIcon: 'drop',
    skillDesc: '貼身以北冥神功化去敵勁，此擊免受還擊；吸取 8 點內力，並使其絕技延後一回合。',
    skillRange: 1,
    cost: 6
  },
  chief: {
    name: '余滄海',
    role: '掌門',
    school: '青城派',
    mini: 'chief',
    portrait: 'chief',
    epithet: '青城掌門',
    bio: '青城派掌門，松風劍法陰狠凌厲。為奪辟邪劍譜不擇手段，親自封橋截人。',
    basic: '松風劍法'
  },
  blade: { name: '青城劍徒', role: '刀客', school: '青城派', mini: 'bandit', basic: '青城劍式' },
  bow: { name: '青城弓手', role: '弓手', school: '青城派', mini: 'archer', basic: '穿林箭' },
  scout: { name: '青城斥候', role: '弟子', school: '青城派', mini: 'bandit', basic: '快刀' }
};
for (const [index, [boss, second]] of ENCOUNTERS.entries()) {
  const id = CAPTAINS[index][0];
  DETAILS[id] = {
    ...DETAILS[id],
    ...boss,
    role: index === 9 ? '最後一局・局主' : '局主',
    portraitFile: 'captain-' + index + '.webp',
    rank: 'boss'
  };
  DETAILS['lieutenant-' + index] = {
    ...second,
    role: '副手',
    portraitFile: 'lieutenant-' + index + '.webp',
    rank: 'mini'
  };
}
// The DETAILS keys of a board's four enemies, in the order of its layout's spawn tiles.
function encounterKeys(map) {
  return [CAPTAINS[map][0], 'lieutenant-' + map, 'bow-' + map, 'scout-' + map];
}
// Actor ids never change, so saves stay valid; what each piece is on this board is recomputed.
// A troop copy ('fiveTiger#1', 'bow-2#1') is the DETAILS entry named before its '#'.
function identifyEncounter(s) {
  if (!s.run) return;
  const keys = encounterKeys(s.mapIndex);
  for (const u of s.units) {
    if (ally(u)) continue;
    const role = ['blade', 'bow', 'scout'].indexOf(u.id.replace(/^echo/, '').toLowerCase());
    if (role >= 0) u.encounterId = keys[role + 1];
    else if (u.id.includes('#')) u.encounterId = u.id.split('#')[0];
  }
}
// ── Boards (battles.js) ───────────────────────────────────────────────────
// The fixed four of a board by slot, and the actor ids they have always had.
const SLOTS = ['master', 'lieutenant', 'bow', 'scout'];
function slotId(map, slot) {
  const ids = map ? [CAPTAINS[map][0], 'echoBlade', 'echoBow', 'echoScout'] : FOES;
  return ids[SLOTS.indexOf(slot)];
}
// The DETAILS key of an actor id on this board, whether or not the piece is on it yet.
const pieceKeyOf = (s, id) => {
  const u = s.units?.find((v) => v.id === id);
  if (u) return pieceKey(u);
  const slot = SLOTS.find((k) => slotId(s.mapIndex, k) === id);
  return slot ? encounterKeys(s.mapIndex)[SLOTS.indexOf(slot)] : id.split('#')[0];
};
// The DETAILS key of a piece ref of board data (a slot or an extra id).
const refKey = (map, ref) => (SLOTS.includes(ref) ? encounterKeys(map)[SLOTS.indexOf(ref)] : ref.split('#')[0]);
// A piece ref in board data: a slot of the fixed four, or an extra piece's own id.
const refId = (map, ref) => (SLOTS.includes(ref) ? slotId(map, ref) : ref);
// The DETAILS key a piece is described by.
const pieceKey = (u) => u.encounterId || u.id.split('#')[0];
// A board saved mid-fight before boards had kinds finishes as it began: its master, its four.
const LEGACY_BOARD = Object.freeze({
  kind: 'slay',
  masters: ['master'],
  pieces: [],
  waves: [],
  sides: []
});
// The board being played. Every board rule reads the board through here.
const boardOf = (s) => (!s.run || s.run.legacyBoard ? LEGACY_BOARD : BATTLES[s.mapIndex]);
// The kind the board is played as. A save from before its board had objects (none on the board)
// finishes under the kind it began with.
function boardKind(s) {
  const board = boardOf(s);
  return board.objects?.length && !props(s).length ? board.legacyKind : board.kind;
}
// A board object as a unit: its 氣血 a share of its stage row's, its 防禦 that row's and its own.
function propUnit(s, obj) {
  const key = obj.id.split('#')[0],
    info = BOARD_OBJECTS[key];
  const row = stageRows(s.mapIndex, s.run?.stage || 0)[info.row];
  const hp = Math.round(row[0] * info.hp);
  const u = makeUnit(obj.id, 'prop', obj.at[0], obj.at[1], hp, 0, 0, row[2] + (info.def || 0), 0, 0);
  if (obj.id.includes('#')) u.encounterId = key;
  return u;
}
const propUnits = (s) => (boardOf(s).objects || []).map((obj) => propUnit(s, obj));
// Every 局主 of the board, in the board's order; `commanderId` stays the one the text names.
const masterIds = (s) => boardOf(s).masters.map((ref) => refId(s.mapIndex, ref));
// The data entry of an extra piece (a starting piece or a wave's), and its wave if it has one.
function pieceDef(s, id) {
  const board = boardOf(s);
  const start = board.pieces.find((p) => p.id === id);
  if (start) return { def: start, wave: null };
  for (const wave of board.waves) {
    const def = wave.pieces.find((p) => p.id === id);
    if (def) return { def, wave };
  }
  return null;
}
// An extra piece's home: its starting tile, or its wave's entry tile. Null for the fixed four.
function homeTile(s, u) {
  const found = pieceDef(s, u.id);
  return found ? { x: found.def.at[0], y: found.def.at[1] } : null;
}
// The four stage rows every enemy's numbers come from ([hp, atk, def, step, range] each), in the
// run's 境界 (data/realms.js; the first 境界 changes nothing). Board 0 met first has the numbers the
// first board has always had.
function stageRows(map, depth, realm = 1) {
  const rows = stageBase(map, depth);
  for (const slot of Object.keys(rows)) rows[slot] = inRealm(rows[slot], realm);
  return rows;
}
function stageBase(map, depth) {
  if (map === 0 && depth === 0)
    return {
      master: [104, 25, 12, 2, 1],
      lieutenant: [56, 20, 7, 2, 1],
      bow: [48, 18, 5, 2, 3],
      scout: [56, 19, 8, 3, 1]
    };
  const boss = map === 9,
    veteran = Math.max(0, depth - 4),
    seasoned = Math.max(0, depth - 3);
  return {
    master: [
      99 + depth * 32 + seasoned * 40 + (boss ? 240 : 0),
      23 + veteran * 3 + Math.round(depth * 3.2 + veteran * 5.3),
      10 + Math.round(depth * 1.6),
      depth >= 7 ? 4 : depth >= 3 ? 3 : 2,
      boss || depth >= 6 || [2, 4, 8].includes(map) ? 2 : 1
    ],
    lieutenant: [
      55 + depth * 12 + seasoned * 29,
      19 + veteran * 3 + Math.round(depth * 2.2 + seasoned * 5.4),
      7 + depth,
      depth >= 3 ? 3 : 2,
      depth >= 6 ? 2 : 1
    ],
    bow: [
      48 + depth * 11 + seasoned * 29,
      17 + veteran * 1 + Math.round(depth * 2.2 + seasoned * 5.4),
      5 + depth,
      depth >= 4 ? 3 : 2,
      depth >= 6 ? 4 : 3
    ],
    scout: [
      51 + depth * 11 + seasoned * 29,
      18 + Math.round(depth * 2.2 + seasoned * 5.4),
      7 + depth,
      depth >= 5 ? 4 : 3,
      depth >= 7 ? 2 : 1
    ]
  };
}
// An extra piece as a unit, from its data entry: its type's stage row with the type's mods, then
// the piece's own. A wave piece is built with the round it entered (`entered`).
function pieceUnit(s, piece, entered = null) {
  const key = piece.id.split('#')[0],
    info = DETAILS[key];
  const row = stageRows(s.mapIndex, s.run?.stage || 0, s.run?.realm)[info.row];
  const [hp, atk, def, step, range] = withMods(withMods(row, info.traits?.mods), piece.mods);
  const u = makeUnit(piece.id, 'enemy', piece.at[0], piece.at[1], hp, 0, atk, def, step, range);
  if (piece.id.includes('#')) u.encounterId = key;
  if (entered != null) u.enteredRound = entered;
  return u;
}
// A villain's `mods` on the stage numbers: health scaled, attack and defence added, step and
// range set outright.
function withMods([hp, atk, def, step, range], mods = {}) {
  return [
    Math.round(hp * (mods.hp ?? 1)),
    atk + (mods.atk || 0),
    def + (mods.def || 0),
    mods.step ?? step,
    mods.range ?? range
  ];
}
for (const id of ['blade', 'bow', 'scout']) DETAILS[id].portraitFile = 'npc-' + id + '.webp';
function unitDetails(u) {
  return DETAILS[u?.encounterId] || DETAILS[u?.id];
}
// A villain whose traits are written uses the stage-scaled status strengths; one without plays
// with the flat numbers of stage 0, as every villain did before the redesign.
function enemyTechnique(u, s) {
  const info = unitDetails(u);
  if (!info?.rank) return null;
  const sig = traitsOf(u).sig || {},
    stage = Object.keys(info.traits || {}).length ? s?.run?.stage || 0 : 0;
  const status = {
    power: sig.power ?? STATUS_POWER[info.style]?.(stage),
    turns: sig.turns ?? 2,
    sweep: sig.sweep ?? 0.25,
    extra: sig.extra || null,
    // 續命: what 接骨續筋 restores at this stage.
    heal: sig.heal === 'stage' ? 20 + 5 * stage : sig.heal || 0
  };
  return {
    ...status,
    // A mend or a mirror is a signature that is not a blow: it has no strike of its own.
    strikes: !['mend', 'mirror'].includes(info.style),
    reach: sig.reach || 0,
    cadence: sig.cadence || 3,
    name: info.skill,
    factor: VILLAIN_FORMS[info.skill][0],
    stroke: VILLAIN_FORMS[info.skill][1],
    visual: info.visual,
    tier: info.rank === 'boss' ? 4 : 3,
    style: info.style,
    family:
      info.style === 'poison'
        ? 'poison'
        : ['weak', 'exposed', 'pin'].includes(info.style)
          ? 'debuff'
          : null,
    note: sig.note || SIGNATURE_RULES[info.style]?.(status) || '',
    offset: info.rank === 'boss' ? 0 : 1
  };
}
// `signaturePush` counts the rounds a hero's 吸勁 has put the signature back since it last fired.
function roundsToSignature(s, u) {
  const art = enemyTechnique(u, s);
  if (!art) return null;
  // Counted from the round the piece came onto the board: round 1, or a reinforcement's entry.
  const first = (u.enteredRound ?? 1) + (art.offset > 0 || s.run?.stage >= 5 ? 1 : 2);
  const next = Number.isInteger(u.signatureRound) ? u.signatureRound + art.cadence : first;
  return Math.max(0, next + (u.signaturePush || 0) - s.round);
}
const signatureDue = (s, u) =>
  !!s?.run && !u.conditions?.seal && roundsToSignature(s, u) === 0;
// 吸勁 (§5): a blow that lands draws 8 內力 back to the striker and puts the target's signature
// back one round, at most once per enemy per round and never two rounds running on a master.
// A blow a shield caught still landed. Read from the strike's forecast `f`, after its 內力 is paid.
function siphonPlan(s, u, t, f) {
  if (!f.forms.includes('siphon') || !f.rawHits.some((n) => n > 0)) return null;
  const mp = Math.min(8, Math.max(0, u.maxMp - (u.mp - f.mpCost))),
    gain = '吸勁 · 內力 ＋' + mp;
  if (!s || !enemyTechnique(t, s) || f.amount >= t.hp) return { mp, delay: false, note: gain };
  if (t.lastSiphonRound === s.round) return { mp, delay: false, note: gain + '（本回合已延後過）' };
  if (unitDetails(t).rank === 'boss' && t.lastSiphonRound === s.round - 1)
    return { mp, delay: false, note: gain + '（局主已換氣，未能延後）' };
  return { mp, delay: true, note: gain + '，' + unitDetails(t).name + '絕技延後一回合' };
}
// The target as it stands once 吸勁 has put its signature back: a charged reaction is spent.
const afterSiphon = (t, plan) =>
  plan?.delay ? { ...t, signaturePush: (t.signaturePush || 0) + 1 } : t;
function applySiphon(s, u, t, plan) {
  if (!plan) return;
  u.mp = Math.min(u.maxMp, u.mp + plan.mp);
  if (plan.mp) log(s, 'combat', '吸勁回復 ' + plan.mp + ' 點內力。', unitDetails(u).name);
  if (!plan.delay || !living(t)) return;
  t.signaturePush = (t.signaturePush || 0) + 1;
  t.lastSiphonRound = s.round;
  log(s, 'combat', '勁力被吸，絕技延後一回合。', unitDetails(t).name);
}
// How far a unit strikes and counters. Every test of an enemy's range goes through here, so 纏械
// only has to set its condition.
function reach(s, u) {
  return u.conditions?.disarm ? 1 : u.range;
}
// How far an enemy strikes this turn: when its signature is due, with the signature's own reach.
function strikeReach(s, u) {
  const sig = signatureDue(s, u) ? enemyTechnique(u, s) : null;
  return u.conditions?.disarm ? 1 : Math.max(reach(s, u), sig?.reach || 0);
}
// The share of a full basic strike a counter carries: none while 無守; full under 卸勁, or for a
// villain whose 蓄勢反擊 is charged; a learned 後發 sets its own; otherwise 0.55.
function counterRatio(s, defender) {
  const c = defender.conditions || {};
  if (c.unguarded) return 0;
  if (c.stance || (unitDetails(defender)?.traits?.stance && signatureDue(s, defender))) return 1;
  return basicFor(defender).retort || 0.55;
}
// 卸勁's cut, in percent, on the damage a unit takes from its foes' blows and counters: a hero's
// stance condition; a villain's 蓄勢反擊 cuts by its own `cut` while charged.
function stanceCut(s, v) {
  if (v.conditions?.stance) return v.conditions.stance.power;
  const stance = unitDetails(v)?.traits?.stance;
  return stance && stanceHolds(s, v) ? stance.cut || 0 : 0;
}
// Whether a villain's `stance` is up now: 'charged' while its signature is due; 'posted' (盾牆)
// while it stands exactly on its post, unwoken. A push off the tile ends it until it walks back.
function stanceHolds(s, v) {
  const t = unitDetails(v)?.traits;
  if (!t?.stance) return false;
  if (t.stance.while !== 'posted') return signatureDue(s, v);
  const tile = t.post && !v.woke && s?.units ? postTile(s, v, t.post) : null;
  return !!tile && v.x === tile.x && v.y === tile.y;
}
// 代受: who would take a direct blow aimed at t, if not t. A hero under the cover condition takes
// it for any companion beside him; a piece with `cover: 'master'`, for its board's master. Of
// several, the one with most 氣血, then the earlier in the unit list. A coverer is never covered.
function coverer(s, t) {
  if (!s?.units || !t?.id) return null;
  let best = null;
  for (const v of s.units) {
    if (v === t || !living(v) || v.side !== t.side || distance(v, t) !== 1) continue;
    const cover = !ally(v) && unitDetails(v)?.traits?.cover;
    // 刀陣 ('kin'): one of a pair of the same type, the healthier taking the blow for the other.
    const covers = ally(v)
      ? !!v.conditions?.cover
      : (cover === 'master' && t.id === commanderId(s)) ||
        (cover === 'kin' && pieceKey(v) === pieceKey(t) && v.hp > t.hp);
    if (covers && (!best || v.hp > best.hp)) best = v;
  }
  return best;
}
// 閃身 after the blow it made miss: the condition is used up.
function dodge(s, v, effects) {
  delete v.conditions.evade;
  effects.push([v.id, CONDITION_NAMES.evade, 'status']);
  log(s, 'combat', '閃身避開，這一擊落空。', unitDetails(v).name);
}
// The blow aimed at t lands on its coverer, if it has one; a hero who covers counts it.
function takeCover(s, t) {
  const v = coverer(s, t);
  if (!v) return t;
  if (ally(v)) progress(v, 'protects', 1);
  log(s, 'combat', '挺身代' + unitDetails(t).name + '受招。', unitDetails(v).name);
  return v;
}
const afterCut = (n, cut) => (cut ? Math.round((n * (100 - cut)) / 100) : n);
// 挪移: how a unit about to take a direct blow turns part of it back, or null. A hero's ward keeps
// half, returns half up to its cap, and he still counters; a villain's 斗轉星移, while charged,
// keeps and returns by its trait and does not counter.
function redirectOf(s, v) {
  const ward = v.conditions?.redirect;
  if (ward) return { keep: 0.5, back: 0.5, cap: ward.power, counters: true, source: ward.source };
  const mirror = unitDetails(v)?.traits?.redirect;
  if (!mirror || !signatureDue(s, v)) return null;
  return { keep: mirror.keep ?? 0, back: mirror.back ?? 0.5, cap: Infinity, counters: false };
}
// What a direct blow does to the unit that receives it, hit by hit, before shields (§6 steps
// 2–4). Poison, 亂氣 and reflected damage never come through here. `back` is what a 挪移 turns
// on the striker; `void` means nothing of the blow lands, its effects included; `silent`, that
// the receiver does not counter it.
function received(s, v, raws) {
  // 閃身: the whole action misses, effects and counter included.
  if (v.conditions?.evade)
    return { hits: raws.map(() => 0), ward: null, back: 0, void: true, silent: true, evaded: true };
  const ward = redirectOf(s, v);
  let hits = raws,
    back = 0;
  if (ward) {
    // The blow is one total; the share kept is spread over its hits in proportion.
    let sum = 0,
      kept = 0;
    hits = raws.map((n) => {
      sum += n;
      const k = Math.round(sum * ward.keep) - kept;
      kept += k;
      return k;
    });
    back = Math.min(ward.cap, Math.round(sum * ward.back));
  }
  const cut = stanceCut(s, v);
  return {
    hits: hits.map((n) => afterCut(n, cut)),
    ward,
    back,
    void: !!ward && !ward.keep,
    silent: !!ward && !ward.counters
  };
}
// 挪移 after the blow: the ward is used up (a hero's) or the charge spent (a villain's), and the
// share turned back lands on the striker, through his shield. It may fell an enemy; it never
// takes a hero below 1 氣血.
function turnBack(s, striker, bearer, blow, effects) {
  const ward = blow.ward,
    source = ward.source ? find(s, ward.source) : bearer;
  if (ward.source) {
    if (bearer.conditions) delete bearer.conditions.redirect;
    progress(source, 'protects', 1);
  } else {
    bearer.signatureRound = s.round;
    if (bearer.signaturePush) bearer.signaturePush = 0;
    noteFired(s, 'mirror'); // a villain's 斗轉星移 turned a blow
  }
  if (!blow.back || !living(striker)) return;
  let n = afterWard(blow.back, wardPercent(s, striker));
  if (ally(striker)) n = Math.min(n, (striker.conditions?.shield?.power || 0) + striker.hp - 1);
  const dealt = n > 0 ? blowing({ how: 'reflect' }, () => wound(s, striker, n, source)) : 0;
  effects.push([striker.id, '−' + dealt]);
  const verb = (ward.source ? '挪移' : '斗轉星移') + '反震' + unitDetails(striker).name;
  log(s, 'combat', verb + '，造成 ' + dealt + ' 點傷害。', unitDetails(bearer).name);
}
// ── Villain behaviour (SPEC-mechanics §7) ─────────────────────────────────
// A villain's traits as they stand now: once its 變招 has fired, the phase's cadence, preference
// and hold replace those it began the board with.
function traitsOf(u) {
  const t = unitDetails(u)?.traits || {},
    p = u?.phased ? t.phase : null;
  if (!p) return t;
  return {
    ...t,
    sig: p.cadence ? { ...t.sig, cadence: p.cadence } : t.sig,
    prefers: p.prefers || t.prefers,
    stance: t.stance && p.holds === false ? { ...t.stance, holds: false } : t.stance
  };
}
// 坐鎮: the tile a posted piece guards — its spawn on this board, a tile its traits name, or its
// board master's tile as its own action begins ('master'; none once the master has fallen).
function postTile(s, u, post) {
  if (post.tile === 'master') {
    const m = find(s, commanderId(s));
    return m && living(m) && m !== u ? { x: m.x, y: m.y } : null;
  }
  if (post.tile === 'spawn') {
    const home = homeTile(s, u);
    if (home) return home;
    const i = encounterKeys(s.mapIndex).indexOf(u.encounterId || u.id);
    return mapLayout(s.mapIndex).enemies[i] || null;
  }
  return post.tile || null;
}
// Where an enemy is held this turn, or null: an un-woken 坐鎮, to within its tether of the post;
// a 蓄勢反擊 that holds, while charged, to its own tile, striking only from there.
function holdOf(s, u) {
  const t = traitsOf(u);
  if (t.stance?.holds && signatureDue(s, u)) return { tile: { x: u.x, y: u.y }, tether: 0 };
  if (!t.post || u.woke) return null;
  const tile = postTile(s, u, t.post);
  return tile ? { tile, tether: t.post.tether || 0 } : null;
}
// Where an enemy can stand as its action begins: its own tile (n 0) and every tile its walk
// reaches, each with the steps to it.
function walkCells(s, u, field = availableField(s, u)) {
  return [{ x: u.x, y: u.y, n: 0 }, ...Array.from(field.costs, ([k, n]) => ({ ...fromKey(k), n }))];
}
// The tiles an enemy may end its action on: the ones it can walk to, clipped to its hold (its own
// tile is always kept, so a piece pulled off its post can still strike, or walk back). The
// enemy turn and the danger zone both read this, so the zone never shows a strike the piece
// will not make.
function standCells(s, u, all = walkCells(s, u)) {
  const flight = fleeStep(s, u, all); // 遁走: the one tile its flight takes it to
  if (flight) return [flight];
  const hold = holdOf(s, u);
  if (!hold) return all;
  return all.filter((c, i) => !i || distance(c, hold.tile) <= hold.tether);
}
// A held piece with no one to strike walks back toward its post: to the tile it can reach with
// the least walk still to make to the post's ground, then the fewest steps.
function homeward(s, u, all, hold) {
  const ground = fieldCells(s.mapIndex).filter(
    (c) => walkable(c.x, c.y, s.mapIndex) && distance(c, hold.tile) <= hold.tether
  );
  const back = movementField(s, u, ground, Infinity, true).costs;
  const left = (c) => back.get(key(c.x, c.y)) ?? Infinity;
  return all.reduce((best, c) =>
    left(c) < left(best) || (left(c) === left(best) && c.n < best.n) ? c : best
  );
}
// 坐鎮 ends for good as its trait says: `wake: true` once a hero strikes the piece or it strikes
// a hero; 'struck' only once a hero strikes it; false never.
function wakePost(s, u, struck) {
  const post = unitDetails(u)?.traits?.post;
  if (!post || u.woke || !living(u) || !(post.wake === true || (post.wake === 'struck' && struck)))
    return;
  u.woke = true;
  log(s, 'combat', '離位追擊。', unitDetails(u).name);
}
const PREFERS = {
  wounded: '專挑傷重者',
  isolated: '專挑落單者',
  leader: '專挑領隊',
  healer: '專挑療傷者',
  mp: '專挑內力深厚者',
  nearest: '見人就撲'
};
const tileName = (p) => '（' + (p.x + 1) + '，' + (p.y + 1) + '）';
const COUNTS = ['', '一', '兩', '三', '四', '五'];
const WAKES = {
  true: '有俠客踏入攻擊範圍或受到攻擊後，才離位追擊。',
  struck: '受到攻擊後才離位。',
  false: '不離位。'
};
// A trait's own words from the data, with {tile} filled in.
const fill = (text, vars) => text.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
// The lines under an enemy's signature: what it does, with this stage's numbers, and its reach.
function signatureLines(s, u) {
  const sig = enemyTechnique(u, s);
  if (!sig) return [];
  return [sig.note, ...(sig.reach ? ['絕技射程 ' + sig.reach + ' 格。'] : [])].filter(Boolean);
}
// The enemy page's lines for a board's piece as the board opens, with no game in progress (the
// wiki reads these): seat 0 the master, 1 the lieutenant, 2 the archer, 3 the scout.
function boardLines(map, seat, stage) {
  return pieceLines(map, SLOTS[seat], stage);
}
// The same for any piece ref of the board (battles.js): every piece the board opens with, and
// the ref's own wave piece as it enters, stand as ghosts at their tiles.
function pieceLines(map, ref, stage) {
  const s = { mapIndex: map, round: 1, run: { stage }, units: [] };
  const rows = stageRows(map, stage),
    keys = encounterKeys(map),
    layout = mapLayout(map);
  SLOTS.forEach((slot, i) => {
    const [hp, atk, def, step, range] = withMods(rows[slot], DETAILS[keys[i]]?.traits?.mods);
    const p = layout.enemies[i];
    const u = makeUnit(slotId(map, slot), 'enemy', p.x, p.y, hp, 0, atk, def, step, range);
    if (i) u.encounterId = keys[i];
    s.units.push(u);
  });
  const board = BATTLES[map];
  s.units.push(...board.pieces.map((piece) => pieceUnit(s, piece)));
  const id = refId(map, ref);
  let u = s.units.find((v) => v.id === id);
  if (!u) {
    const found = pieceDef(s, id);
    if (!found) return [];
    u = pieceUnit(s, found.def, found.wave.when.round ?? null);
    s.units.push(u);
  }
  return [...signatureLines(s, u), ...enemyTraitLines(s, u)];
}
// The reach an enemy strikes with once its signature is due.
function strikeReachWhenDue(s, u) {
  const sig = enemyTechnique(u, s);
  return u.conditions?.disarm ? 1 : Math.max(reach(s, u), sig?.strikes ? sig.reach || 0 : 0);
}
// The enemy page's account of how this piece differs from the others: one line per trait, each
// '【name】words', in the villain's own words where its data gives them (SPEC-villains).
function enemyTraitLines(s, u) {
  const info = unitDetails(u),
    t = traitsOf(u),
    stage = s.run?.stage || 0,
    lines = [];
  const say = (label, text) => lines.push('【' + label + '】' + text);
  const master = unitDetails(find(s, commanderId(s)))?.name;
  const others = enemies(s).filter((v) => v !== u && living(v));
  const named = (list) => [...new Set(list.map((v) => unitDetails(v).name))].join('、');
  if (t.banner) say('盟令', '存活時其餘敵人攻擊 ＋' + (t.banner.atk + stage) + '。');
  const guards = others.filter((v) => unitDetails(v)?.traits?.cover === 'master');
  if (u.id === commanderId(s) && guards.length)
    say(
      '門人代受',
      '相鄰的' +
        named(guards) +
        '替他承受俠客的直接攻擊（氣血較多者先上）；波及、穿行、走勁與毒傷仍會落在他身上。'
    );
  if (t.post?.tile === 'master' || t.cover === 'master')
    say(
      '護駕',
      [
        t.post?.tile === 'master' ? '每回合先回到' + master + '身旁' : '',
        t.cover === 'master' ? (t.post?.tile === 'master' ? '與他' : '與' + master) + '相鄰時替他受招' : ''
      ]
        .filter(Boolean)
        .join('；') + '。'
    );
  else if (t.post && u.woke) say('坐鎮', '已離位追擊。');
  else if (t.post) {
    const tile = postTile(s, u, t.post);
    const words = t.post.note
      ? fill(t.post.note, { tile: tile ? tileName(tile) : '' })
      : '守在' +
        (tile ? tileName(tile) : '原地') +
        (t.post.tether ? COUNTS[t.post.tether] + '格內' : '不動') +
        '；' +
        WAKES[t.post.wake];
    say('坐鎮', words);
  }
  if (t.contact)
    say('化功', '貼身打中他的俠客損失 ' + (t.contact.mp + stage) + ' 點內力（封穴時無效）。');
  if (t.stance?.while === 'posted') {
    const tile = t.post && postTile(s, u, t.post);
    say('盾牆', '站在原位' + (tile ? tileName(tile) : '') + '時，受到的傷害減 ' + t.stance.cut + '%；被推離原位便失去盾牆，走回後恢復。');
  } else if (t.stance) {
    const r = COUNTS[strikeReachWhenDue(s, u)];
    say(
      '蓄勢反擊',
      (t.stance.holds ? '蓄勢時原地不動，只打' + r + '格內的人；' : '蓄勢時') +
        r +
        '格內打他，必遭全力還擊（免受還擊之招與封穴除外）。'
    );
  }
  // A mirror that is the villain's signature is told in the signature's own lines.
  if (t.redirect && info.style !== 'mirror')
    say('挪移', '蓄勢時，第一次受到的直接攻擊全數不中，反震一半給出手者（封穴時無效）。');
  // A board object (星索樁) can carry the ward as well as a piece.
  const wards = [...others, ...props(s).filter(living)].filter((v) => unitDetails(v)?.traits?.ward);
  if (u.id === commanderId(s) && wards.length)
    say(
      '星索護陣',
      (wards.every(isProp) ? '每根立著的' : '每名存活的') +
        named(wards) +
        '替他抵擋 ' +
        unitDetails(wards[0]).traits.ward +
        '% 傷害。'
    );
  if (t.ward && master && u.id !== commanderId(s))
    say('護陣', '存活時替' + master + '抵擋 ' + t.ward + '% 傷害。');
  if (t.glide) say('游擊', '出手後退開至多 ' + t.glide + ' 步，離俠客越遠越好。');
  if (t.basicPoison)
    say(
      t.basicPoison.name || '毒手',
      '普攻令目標中毒，' +
        (t.basicPoison.turns === 2 ? '兩' : t.basicPoison.turns) +
        '次毒發各損 ' +
        (t.basicPoison.power + Math.floor(stage / 2)) +
        ' 氣血。'
    );
  if (t.crowded)
    say(
      '近身失準',
      (t.crowded.within === 1 ? '對相鄰的俠客' : '對 ' + t.crowded.within + ' 格以內的俠客') +
        '出手或還擊時，攻擊 −' + t.crowded.atk + '。'
    );
  if (t.execute) say('斬殘', '對氣血不過半的俠客出手或還擊時，攻擊 ＋' + executeBonus(s, t) + '。');
  if (t.cover === 'kin') say('刀陣', '相鄰的另一名' + info.name + '氣血較多時，替他承受俠客的直接攻擊。');
  if (t.prefers) say('偏好', PREFERS[t.prefers] + '。');
  const phase = info.traits?.phase;
  if (phase)
    say(
      (u.phased ? '已變招' : '半血變招') + (phase.name ? ' · ' + phase.name : ''),
      phase.note || phase.log || ''
    );
  if (fleeing(s, u))
    say(
      '遁走中',
      '至第 ' + u.fleeThrough + ' 回合，或氣血回到 ' + Math.round(phase.flee.until * u.maxHp) + ' 為止。'
    );
  const masters = s.units ? masterIds(s) : [];
  if (masters.length > 1 && masters.includes(u.id)) {
    const other = masters.filter((id) => id !== u.id).map((id) => DETAILS[pieceKeyOf(s, id)]?.name);
    say(
      '雙局主',
      '與' +
        other.join('、') +
        '同為局主，兩人都倒下才算取勝' +
        (boardKind(s) === 'keep' ? '（守滿回合亦勝）' : '') +
        '。'
    );
  }
  const wave = u.enteredRound != null && s.units && pieceDef(s, u.id)?.wave;
  if (wave) say('援軍', '第' + NUMERALS[u.enteredRound - 1] + '回合自' + wave.place + '入場。');
  return lines;
}
DETAILS.echoBlade = {
  portraitFile: 'npc-echoBlade.webp',
  name: '執燈刀影',
  role: '近衛',
  school: '黑子',
  mini: 'bandit',
  basic: '分燈斬'
};
DETAILS.echoBow = {
  portraitFile: 'npc-echoBow.webp',
  name: '巡臺弓影',
  role: '弓手',
  school: '黑子',
  mini: 'archer',
  basic: '逐聲箭'
};
DETAILS.echoScout = {
  portraitFile: 'npc-echoScout.webp',
  name: '逆風斥候',
  role: '遊騎',
  school: '黑子',
  mini: 'bandit',
  basic: '掠影刀'
};
for (const [map, ranks] of RANKS.entries())
  for (const [role, info] of Object.entries(ranks)) {
    const base = map ? 'echo' + role[0].toUpperCase() + role.slice(1) : role;
    DETAILS[role + '-' + map] = { ...DETAILS[base], ...info };
  }
// The villains and troop types added to the boards (battles.js). Their portraits follow their
// sprites, below.
for (const [id, v] of Object.entries(VILLAINS))
  DETAILS[id] = { ...v, role: v.rank === 'boss' ? '局主' : '副手' };
for (const [id, t] of Object.entries(TROOPS)) DETAILS[id] = { ...t };
// The board objects, with their pictures as their portraits.
for (const [id, o] of Object.entries(BOARD_OBJECTS))
  DETAILS[id] = { ...o, object: true, portraitFile: 'object-' + o.art + '.webp' };
// The stage row each board's own pieces take their numbers from (stageRows).
for (let map = 0; map < CAPTAINS.length; map++) {
  DETAILS[CAPTAINS[map][0]].row = 'master';
  DETAILS['lieutenant-' + map].row = 'lieutenant';
  DETAILS['bow-' + map].row = 'bow';
  DETAILS['scout-' + map].row = 'scout';
}
DETAILS.blade.row = 'lieutenant';
DETAILS.bow.row = 'bow';
DETAILS.scout.row = 'scout';
// A piece drawn as one of the painted roster characters wears that character's portrait,
// whatever seat it fills: the face follows the sprite (data/roster-art.js).
for (const d of Object.values(DETAILS))
  if (rosterPortrait(d.mini)) d.portraitFile = rosterPortrait(d.mini);
const STORIES = [
  {
    place: '洛陽 · 綠竹巷',
    speaker: '令狐冲',
    face: 'hero',
    text: '我只道琴譜該由懂琴的人來看。偏偏這江湖上，看不懂的人，比誰都想搶到手。',
    note: '令狐冲曾受曲洋、劉正風臨終所託，攜《笑傲江湖》曲譜尋覓知音。這一夕，綠竹巷外又來了不速之客。'
  },
  {
    place: '竹渡 · 琴聲',
    speaker: '任盈盈',
    face: 'medic',
    text: '你聽，渡口少了兩聲船篙，倒多了四個人的腳步。向叔叔，勞你把船家請到亭後。',
    note: '秋雨剛停，任盈盈收起竹簫。向問天一拂衣袖，把纜繩從一名青城弟子的劍下奪了回來。'
  },
  {
    place: '古亭 · 攔江',
    speaker: '余滄海',
    face: 'chief',
    text: '琴譜也好，劍譜也罷。讓我翻過一遍，你們要往哪裡去，余某絕不攔阻。',
    note: '余滄海認定譜中藏有辟邪劍法。令狐冲橫劍一笑，與兩名知己並肩立在石坪上。'
  },
  {
    place: '渡口 · 曲終',
    speaker: '任盈盈',
    face: 'medic',
    text: '這一頁，你方才連拿都拿反了。余掌門，天下若真有這般倒著練的劍法，又有誰敢教你呢？',
    note: '風將末頁吹到余滄海腳邊。紙上只有工尺譜字，他盯了良久，終於拂袖領著弟子退去。'
  },
  {
    place: '洛水 · 歸舟',
    speaker: '令狐冲',
    face: 'hero',
    text: '盈盈，你來吹簫，我來划船。這回咱們走慢些，好好聽完這一支曲子。',
    note: '向問天解纜，一葉小舟離開青竹渡。岸上的劍痕漸被雨水填平，江心那縷簫聲卻傳了很遠。'
  }
];

const VOICES = {
  ...Object.fromEntries(Object.entries(NEW_HEROES).map(([id, h]) => [id, h.voice])),
  hero: '琴譜不是劍譜。想聽曲子，余掌門大可到船頭坐下；想搜身，還得問我這柄劍。',
  medic: '這一頁寫的是吹簫的氣口。余掌門只知奪譜，連曲子從哪裡起都沒看清。',
  guard: '一張紙，值得你把船家的活路都截了？今日這條纜繩，我偏要解。',
  guo: '我不懂琴譜，卻看得出誰在欺負船家。想帶走這封譜，先叫你的弟子把劍收起來。',
  xiao: '我只來聽簫。你們的劍太響，把曲子遮住了。',
  duan: '若是劍譜，自該寫招式；這裡卻是工尺。余先生莫非還打算用松風劍法來奏曲？'
};
function chapterScenes(s) {
  if (party(s).every((u) => ORIGINAL_PARTY.includes(u.id))) return STORIES;
  const [a, b, c] = party(s);
  return [
    {
      place: '洛水 · 霧合',
      speaker: '任盈盈',
      face: 'medic',
      note: '一夜江霧，把不同年代的渡口接在了一起。綠竹巷失散的曲譜，偏偏落進這一葉小船。',
      text: party(s).some((u) => u.id === 'medic')
        ? '這是曲洋與劉正風留下的譜子。船家只管解纜，船頭由我們三人守著。'
        : '這是曲洋與劉正風留下的譜子。勞三位護住船頭，我去扶船家解纜。'
    },
    {
      place: '青竹渡 · 群俠',
      speaker: DETAILS[b.id].name,
      face: b.id,
      note:
        DETAILS[a.id].name +
        '、' +
        DETAILS[b.id].name +
        '與' +
        DETAILS[c.id].name +
        '沿不同的江路踏上同一方石坪。霧外傳來青城派的喝聲。',
      text: VOICES[b.id]
    },
    {
      place: '古亭 · 攔江',
      speaker: '余滄海',
      face: 'chief',
      note: '余滄海按劍而出。他只知有人攜著秘譜過江，這回連船舫都封了。',
      text: '曲譜也好，劍譜也罷。留下讓我翻過一遍，這條水路便還給你們。'
    },
    {
      place: '渡口 · 曲終',
      speaker: DETAILS[c.id].name,
      face: c.id,
      note: '風將譜頁送到余滄海跟前。滿紙工尺字，他看了半晌，終究領著弟子退去。',
      text: '劍已收了，這裡的事，就交還給江水吧。'
    },
    {
      place: '洛水 · 分津',
      speaker: DETAILS[a.id].name,
      face: a.id,
      note: '簫聲落定，四方的水路各自顯出。三位俠客記住了彼此的姓名，船燈一盞盞隱入晨霧。',
      text: '同船一程，也算相識。青竹渡的這支曲子，來日再聽。'
    }
  ];
}
function makeUnit(id, side, x, y, hp, mp, atk, def, step, range, weapon = null) {
  return {
    id,
    side,
    x,
    y,
    hp,
    maxHp: hp,
    mp,
    maxMp: mp,
    atk,
    def,
    step,
    range,
    weapon,
    gear: null,
    level: 1,
    xp: side === 'ally' ? 20 : 0,
    sp: side === 'ally' ? 1 : 0,
    talents: { force: 0, guard: 0, breath: 0 },
    moved: false,
    acted: false,
    origin: null,
    brace: false
  };
}
const HERO_STATS = {
  huang: [96, 74, 20, 8, 4, 2, 'jadeCane'],
  yang: [128, 54, 27, 10, 4, 1, 'tombSword'],
  zhang: [132, 76, 22, 14, 3, 1, 'mingSash'],
  hu: [110, 58, 25, 9, 5, 1, 'foxSaber'],
  hero: [112, 48, 27, 10, 3, 1, 'pine'],
  medic: [94, 76, 18, 7, 3, 2, 'staff'],
  guard: [148, 44, 23, 17, 3, 1, 'pole'],
  guo: [146, 50, 23, 15, 3, 1, 'wraps'],
  xiao: [102, 66, 23, 9, 4, 1, 'twins'],
  duan: [92, 82, 20, 7, 4, 2, 'fan'],
  // The ten from the roster pack carry no weapon of their own yet (ROADMAP, open questions): the
  // slot starts empty. Their attack sits a little above the first ten's bare numbers and below
  // their armed ones, since the first weapon they buy adds its whole bonus.
  qiaoFeng: [146, 50, 25, 13, 4, 1],
  xuZhu: [122, 80, 21, 12, 3, 1],
  hongQi: [128, 60, 25, 12, 4, 1],
  yaoShi: [102, 80, 22, 9, 4, 2],
  sanFeng: [136, 72, 23, 15, 3, 1],
  zhaoMin: [100, 62, 24, 8, 5, 1],
  lingSu: [90, 84, 19, 7, 4, 2],
  diYun: [136, 54, 28, 9, 4, 1],
  chengZhi: [112, 60, 23, 10, 5, 1],
  aQing: [90, 58, 24, 6, 5, 1]
};
// What a hero arrives wearing, beside the weapon in HERO_STATS.
const STARTING_GEAR = { diYun: 'silkwormCoat' };
const FOES = ['chief', 'blade', 'bow', 'scout'];
const startingHero = (id) => ({
  ...makeUnit(id, 'ally', 0, 0, ...HERO_STATS[id]),
  gear: STARTING_GEAR[id] || null
});
function newGame(ids = ORIGINAL_PARTY) {
  if (ids.length !== 3 || new Set(ids).size !== 3 || !ids.every((id) => PARTY.includes(id)))
    throw new Error('請選擇三位不同的俠客。');
  const layout = mapLayout(0),
    posts = layout.allies.map(({ x, y }) => [x, y]);
  const foes = layout.enemies.map(({ x, y }) => [x, y]);
  const s = {
    version: 3,
    fieldEdition: FIELD_EDITION,
    leader: ids[0],
    round: 1,
    phase: 'ally',
    result: null,
    reason: '',
    selected: ids[0],
    foreshadow: false,
    stock: { frost: 1, bracer: 1, jade: 1, remedy: 3, elixir: 2, pine: 0, staff: 0, pole: 0 },
    logs: [],
    stats: { damage: 0, healed: 0, kills: 0 },
    units: [
      ...ids.map((id, index) => ({ ...startingHero(id), x: posts[index][0], y: posts[index][1] })),
      ...SLOTS.map((slot) => stageRows(0, 0)[slot]).map((numbers, i) => {
        const [hp, atk, def, step, range] = withMods(
          numbers,
          DETAILS[encounterKeys(0)[i]]?.traits?.mods
        );
        return makeUnit(FOES[i], 'enemy', ...foes[i], hp, 0, atk, def, step, range);
      })
    ]
  };
  log(s, 'story', '與同伴會合，接下護譜之託。', DETAILS[ids[0]].name);
  log(s, 'story', '率青城門人封鎖了渡口。', '余滄海');
  log(s, 'system', '三位俠客已就位。', '我方回合');
  return s;
}
// Reserve all legal positions before moving anyone off a former stretch of shore.
function fitFormation(units, map = 0, inset = 0) {
  const shift = (p) => ({ x: p.x + inset, y: p.y + inset });
  const placed = units.map((u) => ({
    ...u,
    ...shift(u),
    origin: u.origin ? shift(u.origin) : null
  }));
  const legal = (p) => walkable(p.x, p.y, map);
  const occupied = new Set(placed.filter((u) => living(u) && legal(u)).map((u) => key(u.x, u.y)));
  for (const u of placed)
    if (living(u) && u.origin && legal(u.origin)) occupied.add(key(u.origin.x, u.origin.y));
  function nearest(p) {
    let best = null;
    for (const tile of fieldCells(map)) {
      if (!legal(tile) || occupied.has(key(tile.x, tile.y))) continue;
      if (!best || distance(tile, p) < distance(best, p)) best = tile;
    }
    return { x: best.x, y: best.y };
  }
  for (const u of placed) {
    if (!legal(u)) {
      Object.assign(u, nearest(u));
      if (living(u)) occupied.add(key(u.x, u.y));
    }
    if (u.route?.some((p) => !legal(p))) delete u.route;
  }
  for (const u of placed)
    if (u.origin && !legal(u.origin)) {
      u.origin = nearest(u.origin);
      occupied.add(key(u.origin.x, u.origin.y));
      delete u.route;
    }
  return placed;
}
function restoreGame(s) {
  if (
    !s ||
    ![1, 2, 3].includes(s.version) ||
    !Number.isInteger(s.round) ||
    s.round < 1 ||
    s.round > LIMIT ||
    !['ally', 'enemy', 'done'].includes(s.phase) ||
    !Array.isArray(s.units) ||
    s.units.length !== 7 ||
    !s.units.every((u) => u && typeof u === 'object') ||
    !s.stock ||
    !s.stats ||
    !Array.isArray(s.logs)
  )
    return null;
  const ids = party(s).map((u) => u.id);
  if (
    ids.length !== 3 ||
    new Set(ids).size !== 3 ||
    !ids.every((id) => PARTY.includes(id)) ||
    !ids.includes(s.selected) ||
    !ids.includes(leader(s)) ||
    !['chief', 'blade', 'bow', 'scout'].every((id) => find(s, id)?.side === 'enemy')
  )
    return null;
  const legacyWidth = s.version < 3 ? 7 : SIZE;
  const legalPosition = (p) =>
    Number.isInteger(p.x) &&
    Number.isInteger(p.y) &&
    p.x >= 0 &&
    p.y >= 0 &&
    p.x < legacyWidth &&
    p.y < legacyWidth &&
    (s.version < 3 || walkable(p.x, p.y) || (!s.fieldEdition && !valid(p.x, p.y)));
  if (
    !s.units.every(
      (u) =>
        DETAILS[u.id] &&
        legalPosition(u) &&
        (!u.origin || legalPosition(u.origin)) &&
        Number.isFinite(u.hp) &&
        u.maxHp > 0 &&
        u.talents &&
        Number.isSafeInteger(u.xp) &&
        u.xp >= 0
    )
  )
    return null;
  for (const u of party(s)) settleExperience(s, u);
  return {
    ...s,
    version: 3,
    leader: leader(s),
    fieldEdition: FIELD_EDITION,
    units:
      s.version < 3 || !s.fieldEdition
        ? fitFormation(s.units, 0, s.version < 3 ? (SIZE - 7) / 2 : 0)
        : s.units
  };
}
function log(s, type, text, who = '') {
  s.logs.push({ round: s.round, phase: s.phase, type, text, who });
  if (s.logs.length > 250) s.logs.shift();
}
// The 布陣 laid over a tile, if any.
function zoneAt(s, p) {
  if (!s?.zones?.length) return null;
  return s.zones.find((z) => z.tiles.some((q) => q.x === p.x && q.y === p.y)) || null;
}
// A hero standing in a companion's 布陣 is harder to hit; enemies only find it harder to walk.
function onZone(s, u) {
  return ally(u) && !!zoneAt(s, u);
}
// 布陣 (§6): an enemy that starts its action on a formation tile moves 2 less (never below 1)...
const zoneSlows = (s, u) => !ally(u) && !!zoneAt(s, u);
// ...and an enemy walking onto one must stop there. Heroes walk through freely.
const zoneHalts = (s, u, p) => !ally(u) && !!zoneAt(s, p);
// The tiles of a formation: its centre and the centre's walkable orthogonal neighbours.
function zoneTiles(s, centre) {
  return [[0, 0], ...adjacent]
    .map(([dx, dy]) => ({ x: centre.x + dx, y: centre.y + dy }))
    .filter((p) => walkable(p.x, p.y, s.mapIndex));
}
// One formation per owner: laying another replaces hers. Laid in ally phase r, it holds until
// the end of enemy phase r + 1.
function layZone(s, u, centre) {
  const zones = (s.zones || []).filter((z) => z.owner !== u.id);
  zones.push({ owner: u.id, tiles: zoneTiles(s, centre), through: s.round + 1 });
  s.zones = zones;
  log(s, 'combat', '於' + tileName(centre) + '布下陣勢。', unitDetails(u).name);
}
function expireZones(s) {
  if (!s.zones) return;
  s.zones = s.zones.filter((z) => z.through > s.round);
  if (!s.zones.length) delete s.zones;
}
// 失神 (§5): whether this strike takes the target's next action. `daze: 'setup'` needs the target
// disarmed or standing in a formation as the blow lands; a master who lost an action last round
// shakes off a second (the rule 封穴 follows). A strike at a piece already dazed says it will
// not act; whether it counters is the counter line's to say (a dazed piece still does).
function dazePlan(s, u, t, art, result) {
  const name = unitDetails(t).name;
  if (t.conditions?.daze) result.notes.push('失神 · ' + name + '本回合不會行動');
  if (!art?.daze) return;
  const drop = () => (result.effects = result.effects.filter((e) => e.kind !== 'daze'));
  if (art.daze === 'setup' && !(t.conditions?.disarm || zoneAt(s, t))) {
    drop();
    result.notes.push('條件未成 · 未能失神');
    return;
  }
  if (unitDetails(t).rank === 'boss' && t.lastDazeRound === s?.round - 1) {
    drop();
    result.notes.push('局主已換氣，本回合抵抗失神');
    return;
  }
  if (!result.effects.some((e) => e.kind === 'daze'))
    result.effects.push({ kind: 'daze', power: 1, turns: 1 });
  result.notes.push('失神 · ' + name + '失去下一次行動');
}
// 失神 in the enemy phase: the dazed piece does nothing this turn and the condition is spent.
// A signature that was due stays due.
function loseAction(s, u) {
  u.acted = true;
  delete u.conditions.daze;
  log(s, 'combat', '失神，錯過了這一手。', unitDetails(u).name);
  return [[u.id, '失神', 'status']];
}
// Chips the panels derive from where a piece stands, not stored as conditions.
function standingLines(s, u) {
  const lines = [];
  // 盟令: the commander's bonus on every other enemy while he lives.
  const banner = living(u) && bannerBonus(s, u);
  if (banner) lines.push('盟令 ＋' + banner);
  const zone = living(u) && zoneAt(s, u);
  if (!zone) return lines;
  const owner = unitDetails(find(s, zone.owner))?.name || '';
  return [...lines, ally(u) ? '陣中 · 防禦 ＋4（' + owner + '布陣）' : '陣中 · 移動 −2'];
}
// The preview's line for an art that lays a formation where it is aimed.
function zoneNote(s, u, art, t, result) {
  if (!art?.zone || !s) return;
  result.zone = zoneTiles(s, t);
  const old = s.zones?.some((z) => z.owner === u.id);
  result.notes.push(
    '布陣 · ' + COUNTS[result.zone.length] + '格，至下一敵方回合結束' + (old ? '（舊陣撤去）' : '')
  );
}
// 盟令: while its bearer lives, every other enemy strikes harder. Derived, never stored.
function bannerBonus(s, u) {
  if (!s?.units || ally(u)) return 0;
  let bonus = 0;
  for (const v of s.units) {
    const banner = v !== u && living(v) && !ally(v) && unitDetails(v)?.traits?.banner;
    if (banner) bonus = Math.max(bonus, banner.atk + (s.run?.stage || 0));
  }
  return bonus;
}
function stat(u, k, s) {
  const items = [ITEMS[u.weapon], ITEMS[u.gear]].filter(Boolean);
  const talent =
    k === 'atk'
      ? u.talents.force * 3
      : k === 'def'
        ? u.talents.guard * 2
        : k === 'power'
          ? u.talents.breath * 5
          : 0;
  const c = u.conditions || {};
  const modifier =
    k === 'atk'
      ? (c.rally?.power || 0) - (c.weak?.power || 0) - (c.disarm?.power || 0) + bannerBonus(s, u)
      : k === 'def'
        ? -(c.exposed?.power || 0) - (c.recoil?.power || 0) + (onZone(s, u) ? 4 : 0)
        : k === 'step'
          ? (c.haste?.power || 0) - (c.pin?.power || 0) - (zoneSlows(s, u) ? 2 : 0)
          : 0;
  // 絆足 and 布陣 never hold a piece below one step, alone or together.
  return Math.max(
    k === 'step' && (c.pin || zoneSlows(s, u)) ? 1 : 0,
    (u[k] || 0) +
      talent +
      items.reduce((sum, item) => sum + (item[k] || 0), 0) +
      modifier +
      commandBonus(s, u, k)
  );
}
const SIGNATURE_RULES_BY_HERO = {
  hero: { factor: 1.35 },
  medic: { heal: 30 },
  guard: { factor: 1.15, safe: true, stance: 30 },
  guo: { factor: 1.28, debuff: { stat: 'atk', power: 4, turns: 2 } },
  xiao: { factor: 1.25 },
  duan: { factor: 1.1, safe: true },
  huang: { factor: 1.15, visual: 'guard' },
  yang: { factor: 1.32, visual: 'guo' },
  zhang: { visual: 'medic', heal: 30, target: 'ally' },
  hu: { factor: 1.3, visual: 'xiao' },
  qiaoFeng: { factor: 1.2, push: true, visual: 'guo' },
  xuZhu: { factor: 1.3, visual: 'guo' },
  hongQi: { factor: 1.2, safe: true, visual: 'guo' },
  yaoShi: { factor: 1.25, visual: 'guo' },
  sanFeng: { factor: 1.2, stance: 20, visual: 'guo' },
  zhaoMin: { factor: 1.2, pierce: 0.5, visual: 'hero' },
  lingSu: { visual: 'medic', heal: 28, target: 'ally' },
  diYun: { factor: 1.3, visual: 'hero' },
  chengZhi: { factor: 1.25, visual: 'guo' },
  aQing: { factor: 1.25, visual: 'xiao' }
};
function artFor(u, key = u.activeArt || 'signature') {
  if (u.learned?.includes(key) && TECHNIQUES[key]) return TECHNIQUES[key];
  const info = unitDetails(u);
  return {
    name: info.skill,
    tier: 0,
    desc: info.skillDesc,
    icon: info.skillIcon,
    range: info.skillRange,
    mp: info.cost,
    visual: u.id,
    forms: ART_FORMS['signature:' + u.id] || [],
    ...SIGNATURE_RULES_BY_HERO[u.id]
  };
}
function rangeFor(u, skill) {
  return skill ? artFor(u).range : u.range;
}
const commandDiscount = (s, u) => commandBonus(s, u, 'economy');
function cost(u, s, id = u.activeArt || 'signature') {
  return artCost(s, u, artFor(u, id));
}
function artCost(s, u, art) {
  return Math.max(2, (art.mp || 0) - 2 * u.talents.breath - commandDiscount(s, u));
}
function basicFor(u) {
  const upgrade = u.learned?.map((id) => TECHNIQUES[id]).find((a) => a?.kind === 'basic');
  return upgrade || { name: unitDetails(u).basic, basicBonus: 0 };
}
function equippedArts(u) {
  return u.slots ? u.slots.filter(Boolean) : [u.activeArt || 'signature'];
}
function targetType(art) {
  return art.target || (art.heal ? 'ally' : 'enemy');
}
// Whether an equipped art may be used now (§2, §3) and, if not, the reason the arts list shows.
// 內力 and 氣血 are left to canPay, whose refusal the list already shows its own way.
function artReady(s, u, id = u.activeArt || 'signature') {
  const art = artFor(u, id),
    c = u.conditions || {},
    ready = u.cooldowns?.[id] || 0;
  const no = (reason) => ({ ok: false, reason });
  if (c.spent) return no('曲終 · 本回合不能施展絕技');
  if (c.rooted && targetType(art) === 'ground' && !art.zone) return no('立樁 · 本回合不能移動');
  if (art.once && u.usedOnce?.includes(id)) return no('壓箱 · 本局已用');
  if (s.round < ready) return no('調息 · 還須 ' + (ready - s.round) + ' 回合');
  // A strike earlier this same round (after 連環 or 號令) does not count against 留力.
  if (art.poised && u.struckRound === s.round - 1) return no('留力 · 上回合已出手');
  if (art.consume === 'shield' && !c.shield) return no('轉護 · 自身須有護盾');
  return { ok: true, reason: '' };
}
function canPay(s, u, id = u.activeArt || 'signature') {
  return (
    equippedArts(u).includes(id) &&
    artReady(s, u, id).ok &&
    u.mp >= cost(u, s, id) &&
    u.hp > (artFor(u, id).hpCost || 0)
  );
}
const isSupport = (art) => ['ally', 'self'].includes(targetType(art));
function canConfigure(s, u) {
  return !s.run
    ? canAct(s, u)
    : (managesCompany(s) && company(s).includes(u)) ||
        (s.run.status === 'battle' && s.run.formationOpen && canAct(s, u)) ||
        (!!s.run.deploying && party(s).includes(u)); // arts may be re-slotted while deploying
}

const adjacent = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1]
];
// Shortest paths are weighted by the terrain entered. A reverse search from
// attack positions also lets the enemy approach around an obstruction.
function movementField(s, u, origins, limit = Infinity, reverse = false) {
  const costs = new Map(),
    parents = new Map(),
    queue = [];
  for (const p of origins) {
    costs.set(key(p.x, p.y), 0);
    queue.push({ x: p.x, y: p.y, n: 0 });
  }
  // 布陣: an enemy's walk may end on a formation tile but never goes on from one. The reverse
  // search measures how far a tile is from striking over several turns: to it, going on through
  // a formation costs a turn (the walk stops there), and a turn begun on one starts 2 short.
  const pause = reverse && s.zones?.length ? stat(u, 'step', s) : 0;
  for (const p of queue) {
    if (p.n !== costs.get(key(p.x, p.y))) continue;
    const halted = p.n > 0 && zoneHalts(s, u, p);
    if (halted && !reverse) continue;
    for (const [dx, dy] of adjacent) {
      const x = p.x + dx,
        y = p.y + dy,
        k = key(x, y);
      if (!walkable(x, y, s.mapIndex)) continue;
      const n =
        p.n +
        (halted ? pause : 0) +
        (pause && zoneHalts(s, u, { x, y }) ? 2 : 0) +
        (reverse ? tileInfo(p.x, p.y, s.mapIndex).cost : tileInfo(x, y, s.mapIndex).cost);
      if (n > limit || n >= (costs.get(k) ?? Infinity)) continue;
      const occupant = at(s, x, y);
      if (occupant && occupant.side !== u.side) continue;
      costs.set(k, n);
      parents.set(k, { x: p.x, y: p.y });
      queue.push({ x, y, n });
    }
  }
  return { costs, parents };
}
function availableField(s, u) {
  const field = movementField(s, u, [u], stat(u, 'step', s));
  for (const v of s.units.filter(living)) field.costs.delete(key(v.x, v.y));
  return field;
}
function reachable(s, u) {
  return availableField(s, u).costs;
}
function tracePath({ parents, costs }, to) {
  if (!costs.has(key(to.x, to.y))) return [];
  const path = [];
  for (let p = { x: to.x, y: to.y }; p; p = parents.get(key(p.x, p.y))) path.push(p);
  return path.reverse();
}
function movementPath(s, u, from, to) {
  return tracePath(movementField(s, u, [from]), to);
}
function routeConnects(path, from, to, map = 0) {
  return (
    Array.isArray(path) &&
    path.length >= 2 &&
    path.length <= fieldCells(map).length &&
    path.every((p, i) => p && walkable(p.x, p.y, map) && (!i || distance(path[i - 1], p) === 1)) &&
    distance(path[0], from) === 0 &&
    distance(path.at(-1), to) === 0
  );
}
function followRoute(u, path) {
  // Keep the committed route for playback and for an exact retreat, even after a save.
  u.route = path;
  const end = path.at(-1);
  u.x = end.x;
  u.y = end.y;
}
// 立樁 holds a hero where he stands for his whole next turn.
function canMove(s, u) {
  return canAct(s, u) && !u.moved && !u.conditions?.rooted;
}
function move(s, u, x, y) {
  if (!canMove(s, u) || !valid(x, y, s.mapIndex)) return false;
  const field = availableField(s, u),
    path = tracePath(field, { x, y });
  if (path.length < 2) return false;
  if (s.run) s.run.formationOpen = false;
  u.origin = { x: u.x, y: u.y };
  followRoute(u, path);
  u.moved = true;
  u.walked = field.costs.get(key(x, y)); // 回身 walks on with the steps this left
  log(
    s,
    'move',
    '移至' + terrain(x, y, s.mapIndex) + '（' + (x + 1) + '，' + (y + 1) + '）。',
    unitDetails(u).name
  );
  return true;
}
function undo(s, u) {
  if (!canAct(s, u) || !u.moved || !u.origin || at(s, u.origin.x, u.origin.y)) return false;
  // A companion's palm strike can push an enemy into a previously clear retreat.
  const clear =
    routeConnects(u.route, u.origin, u, s.mapIndex) &&
    u.route.every((p) => {
      const occupant = at(s, p.x, p.y);
      return !occupant || occupant.side === u.side;
    });
  const path = clear ? u.route.slice().reverse() : movementPath(s, u, u, u.origin);
  if (path.length < 2) return false;
  followRoute(u, path);
  u.origin = null;
  u.moved = false;
  delete u.walked;
  if (s.run && s.round === 1 && party(s).every((v) => !v.moved && !v.acted))
    s.run.formationOpen = true;
  log(s, 'move', '撤回移動，重整步法。', unitDetails(u).name);
  return true;
}
// 回身: after a glide art a hero may walk on once, with the steps his move this turn left unspent.
// The walk follows the ordinary rules, cannot be taken back, and is lost when the turn ends.
function canGlide(s, u) {
  return (
    !!u &&
    (!s.run?.scene || s.run.scene === 'fight') &&
    s.phase === 'ally' &&
    !s.result &&
    ally(u) &&
    living(u) &&
    u.acted &&
    u.glideLeft > 0 &&
    !u.conditions?.rooted &&
    s.units.includes(u)
  );
}
function glideField(s, u) {
  const field = movementField(s, u, [u], u.glideLeft);
  for (const v of s.units.filter(living)) field.costs.delete(key(v.x, v.y));
  return field;
}
function glideMove(s, u, x, y) {
  if (!canGlide(s, u) || !valid(x, y, s.mapIndex)) return false;
  const path = tracePath(glideField(s, u), { x, y });
  if (path.length < 2) return false;
  followRoute(u, path);
  u.glideLeft = 0;
  holdObjective(s, u);
  progress(u, 'steps', path.length - 1);
  log(
    s,
    'move',
    '回身移至' + terrain(x, y, s.mapIndex) + tileName({ x, y }) + '。',
    unitDetails(u).name
  );
  return true;
}
// Declining the walk: the hero is done for the turn.
function stopGlide(s, u) {
  if (!canGlide(s, u)) return false;
  u.glideLeft = 0;
  return true;
}
// What a glide art leaves to walk once it has struck (stance, pin and 立樁 already in `step`).
const glideSteps = (s, u) => (u.conditions?.rooted ? 0 : stat(u, 'step', s) - (u.walked || 0));
function affectedFriends(s, caster, target, art) {
  if (!art.aura) return [target];
  return party(s).filter((v) => living(v) && distance(v, target) <= art.aura);
}
function targetOK(s, u, t, skill) {
  if (!canAct(s, u) || !t || !valid(t.x, t.y, s.mapIndex) || distance(u, t) > rangeFor(u, skill))
    return false;
  if (t.id && !s.units.includes(t)) return false;
  if (!skill) return !!t.id && living(t) && hostile(u, t);
  if (!canPay(s, u)) return false;
  const art = artFor(u),
    type = targetType(art);
  if (type === 'ground') return !t.id && walkable(t.x, t.y, s.mapIndex) && !at(s, t.x, t.y);
  if (!t.id || !living(t)) return false;
  if (type === 'enemy') return hostile(u, t);
  if (!ally(t) || (type === 'self' && t.id !== u.id)) return false;
  // 號令: a companion who has acted this turn, never the caster.
  if (art.order) return t.id !== u.id && !!t.acted;
  if (effectsOf(art).length) return true;
  const forms = formsFor(u, art);
  if (forms.includes('riposte')) return true;
  const power = art.heal ? healingPower(u, s, art) : 0;
  return affectedFriends(s, u, t, art).some((v) => {
    const entry = supportEntry(forms, u, v, healAmount(v, power));
    return entry.amount || entry.mp || entry.clean.length || entry.overflow;
  });
}
// Partners: each one's 合璧 arts are strongest with the other beside them.
// Who a hero's 合璧 art is strongest beside. Only 楊過 and 小龍女 name each other; the rest are
// one-way, read by the one art of theirs that carries `paired`.
const PARTNERS = {
  xiao: 'yang',
  yang: 'xiao',
  zhaoMin: 'zhang',
  lingSu: 'hu',
  xuZhu: 'qiaoFeng'
};
const ANSWERS = { close: '近身兵刃', ranged: '遠攻', master: '首領' };
const plus = (n) => '＋' + n.toFixed(2);
// An art's factor for one strike: its own, with every conditional bonus that holds added (§4).
// Read where the pieces stand as the blow lands, before its push or pull. The forecast, the strike
// itself, splash and counters all go through attackPower, so they all see the same number.
function strikeFactor(s, u, art, t = null) {
  const notes = [];
  let factor = art.factor ?? 1.5,
    extra = 0;
  const add = (n, note) => {
    extra += n;
    notes.push(note);
  };
  if (art.surge) {
    factor = Math.min(art.surge.cap, factor + art.surge.rate * u.mp);
    notes.push('傾力 · 耗內力 ' + u.mp + '，倍率 ' + factor.toFixed(2));
  }
  if (art.answer && t) {
    const rank = unitDetails(t)?.rank,
      span = reach(s, t);
    const hit = { close: span === 1, ranged: span >= 2, master: rank === 'boss' || rank === 'mini' };
    if (hit[art.answer]) add(0.3, '破招 · ' + ANSWERS[art.answer] + ' ＋0.30');
  }
  const beside = (s?.units || []).filter(
    (v) => v !== u && living(v) && v.side === u.side && distance(v, u) === 1
  );
  if (art.lone) {
    if (!beside.length) add(art.lone, '孤行 ' + plus(art.lone));
    else notes.push('孤行未成 · ' + beside.map((v) => unitDetails(v).name).join('、') + '在旁');
  }
  if (art.paired) {
    const partner = beside.find((v) => v.id === PARTNERS[u.id]);
    // 左右互搏: a hero who has learned it is her own second sword.
    const self = u.learned?.some((id) => TECHNIQUES[id]?.pairsSelf);
    const { any, partner: most } = art.paired;
    if (partner) add(most, '合璧 · ' + unitDetails(partner).name + '在旁 ' + plus(most));
    else if (beside.length) add(any, '合璧 ' + plus(any));
    else if (self) add(any, '合璧 · 左右互搏 ' + plus(any));
  }
  if (art.dire) {
    const h = u.hp - (art.hpCost || 0);
    const n = Math.round(art.dire * Math.min(1, (1 - h / u.maxHp) / 0.75) * 100) / 100;
    if (n > 0) add(n, '黯然 ' + plus(n) + '（氣血 ' + h + '／' + u.maxHp + '）');
  }
  if (art.avenge && s && u.hurtRound === s.round - 1) add(art.avenge, '還報 ' + plus(art.avenge));
  if (art.execute && t && t.hp <= t.maxHp / 2) add(art.execute, '斬殘 ' + plus(art.execute));
  if (extra) factor = Math.round((factor + extra) * 1e6) / 1e6;
  return { factor, notes };
}
// `struckHp` is the target's 氣血 as the blow lands, where that differs from now (a counter
// comes after the striker has paid for his action).
function attackPower(s, u, art, basic = basicFor(u), target = null, struckHp = target?.hp) {
  const base = art
    ? stat(u, 'power', s) + 4
    : (basic.basicBonus || 0) + commandBonus(s, u, 'basic');
  const pursuit = target && target.hp <= target.maxHp / 2 ? commandBonus(s, u, 'pursuit') : 0;
  const atk = stat(u, 'atk', s) - traitEdge(s, u, target, struckHp);
  return atk * (art ? strikeFactor(s, u, art, target).factor : 1) + base + pursuit;
}
// What a villain's own traits take off (+) or add to (−) its attack against this hero, blows and
// counters alike: 近身失準 (`crowded`) when the hero stands within its distance, 斬殘 (`execute`)
// when the hero is at or below half.
function traitEdge(s, u, target, struckHp = target?.hp) {
  if (!target || ally(u) || !ally(target)) return 0;
  const t = traitsOf(u);
  let edge = 0;
  if (t.crowded && distance(u, target) <= t.crowded.within) edge += t.crowded.atk;
  if (t.execute && struckHp <= target.maxHp / 2) edge -= executeBonus(s, t);
  return edge;
}
const executeBonus = (s, t) => t.execute.atk + Math.floor((s?.run?.stage || 0) / 2);
function damage(
  u,
  t,
  skill = false,
  map = 0,
  s,
  art = skill ? artFor(u) : null,
  basic = basicFor(u),
  struckHp = t.hp
) {
  const protection = stat(t, 'def', s) + tileInfo(t.x, t.y, map).defense + (t.brace ? 4 : 0);
  const pierce = art ? art.pierce || 0 : commandBonus(s, u, 'pierce') / 100;
  return Math.max(
    3,
    Math.round(attackPower(s, u, art, basic, t, struckHp) - protection * 0.65 * (1 - pierce))
  );
}
// 內傷 (§5): a wounded unit gets half of every heal, rounded down, before the cap at its missing
// 氣血. Shields are not heals and are not halved.
const healAmount = (v, n) => (v?.conditions?.wound ? Math.floor(n / 2) : n);
// 內傷: after each direct attack it makes (never a counter), its bearer loses the condition's
// power in 氣血, not below 1 and not through a shield.
function woundSelfLoss(s, u, effects) {
  const hurt = living(u) && u.conditions?.wound;
  const n = hurt ? Math.min(hurt.power, u.hp - 1) : 0;
  if (n <= 0) return;
  u.hp -= n;
  if (s.tally && u.id === s.leader) s.tally.leaderHurt += n; // 內傷 is an enemy's doing
  effects.push([u.id, '−' + n, 'sacrifice']);
  log(s, 'combat', '內傷發作，損失 ' + n + ' 點氣血。', unitDetails(u).name);
}
// The heal preview's amounts are already halved; it says so for whoever is wounded.
function woundedHealNotes(t, friends, result) {
  const hurt = friends.filter((v) => v.conditions?.wound);
  if (!hurt.length) return;
  if (hurt.length === 1 && hurt[0] === t) result.notes.push('內傷 · 療效減半');
  else result.notes.push('內傷 · ' + hurt.map((v) => unitDetails(v).name).join('、') + '療效減半');
}
// What an action goes on to cost its own caster's 氣血 once it is over (內傷 after an attack,
// then a 反噬 burst), counted from where the preview leaves him; shown on his bar as `selfLoss`.
function selfLoss(s, u, art, result, attack) {
  let left = u.hp - result.hpCost + result.selfHeal - result.counter - (result.rebound || 0);
  result.selfLoss = 0;
  const hurt = attack && u.conditions?.wound;
  if (hurt && left > 1) {
    const n = Math.min(hurt.power, left - 1);
    result.selfLoss += n;
    left -= n;
    result.notes.push('內傷 · 出手後自損 ' + n + ' 氣血');
  }
  if (art?.backlash) {
    const layers = (u.conditions?.backlash?.power || 0) + 1;
    if (layers < 3) result.notes.push('反噬 · 亂氣 ' + layers + '／3');
    else {
      const n = left > 1 ? Math.min(backlashLoss(u), left - 1) : 0;
      result.selfLoss += n;
      left -= n;
      result.notes.push('反噬 · 亂氣滿三層，自損 ' + n + ' 氣血');
    }
  }
  return left;
}
// 反噬 (§3): the burst is a fifth of the caster's greatest 氣血, rounded up.
const backlashLoss = (u) => Math.ceil(u.maxHp * 0.2);
// 反噬: each use of a 反噬 art lays a layer of 亂氣; the use that would lay the third bursts
// instead, costing a fifth of the caster's greatest 氣血 (not below 1, not through a shield) and
// clearing the layers. Answers the caster effects still to put on him.
function backlashBurst(s, u, own, effects) {
  if (!own.some((e) => e.kind === 'backlash') || !(u.conditions?.backlash?.power >= 2)) return own;
  const n = Math.min(backlashLoss(u), u.hp - 1);
  delete u.conditions.backlash;
  if (n > 0) {
    u.hp -= n;
    effects.push([u.id, '−' + n, 'sacrifice']);
  }
  log(s, 'combat', '亂氣滿三層，反噬自身，損失 ' + n + ' 點氣血。', unitDetails(u).name);
  return own.filter((e) => e.kind !== 'backlash');
}
function healingPower(u, s, art) {
  return (art.heal || 35) + stat(u, 'power', s) + (u.level - 1) * 4;
}
function healing(u, t, s, art = artFor(u)) {
  return Math.min(t.maxHp - t.hp, healAmount(t, healingPower(u, s, art)));
}
function formsFor(u, art, basic = basicFor(u)) {
  return actionForms(ITEMS[u.weapon], art, basic);
}
function pushCell(s, u, t, art = artFor(u)) {
  return forcedStep(s, u, t, art, formsFor(u, art), walkable);
}
// 星索護陣: the living pieces whose `ward` trait shields their board's master.
function wardEscorts(s) {
  if (!s?.units) return [];
  return s.units.filter((u) => !ally(u) && living(u) && unitDetails(u)?.traits?.ward);
}
// The share, in percent, the master's living escorts (or those of `escorts`) take off a blow.
function wardShare(s, target, escorts = wardEscorts(s)) {
  if (!s?.units || target.id !== commanderId(s)) return 0;
  return escorts.reduce((n, v) => n + unitDetails(v).traits.ward, 0);
}
const wardPercent = (s, target) => wardShare(s, target);
const afterWard = (power, percent) =>
  percent ? Math.max(1, Math.round((power * (100 - percent)) / 100)) : power;
function forecast(u, t, skill, s, art = skill ? artFor(u) : null, basic = basicFor(u)) {
  const type = art ? targetType(art) : 'enemy';
  const support = type === 'self' || type === 'ally',
    heal = support && !!art.heal;
  // 代受: a blow at a covered piece is worked out on its coverer from here on (§6).
  const aimed = t,
    guard = type === 'enemy' ? coverer(s, t) : null;
  if (guard) t = guard;
  const ward = t.id ? wardPercent(s, t) : 0;
  const result = {
    type,
    support,
    heal,
    ward,
    amount: 0,
    counter: 0,
    counterRaw: 0,
    hits: [],
    rawHits: [],
    push: null,
    shielded: 0,
    recipients: [],
    splash: [],
    effects: effectsOf(art),
    hpCost: art?.hpCost || 0,
    forms: formsFor(u, art, basic),
    notes: [],
    landing: [],
    selfHeal: 0,
    reflected: 0,
    // 傾力 spends everything the caster has; any other art its price.
    mpCost: art ? (art.surge ? u.mp : artCost(s, u, art)) : 0
  };
  if (type === 'ground') {
    if (s && result.forms.includes('landing')) {
      result.landing = party(s)
        .filter((v) => living(v) && (v === u || distance(t, v) <= 1))
        .map((v) => v.id);
      result.notes.push(
        '落步成陣 · ' +
          result.landing.map((id) => unitDetails(find(s, id)).name).join('、') +
          ' 得 8 護盾'
      );
    }
    zoneNote(s, u, art, t, result); // 布陣 on a ground art: its tiles and its line
    selfLoss(s, u, art, result, false);
    result.notes.push(...guardNotes(art), ...priceNotes(art));
    return result;
  }
  if (support) {
    const friends = s ? affectedFriends(s, u, t, art) : [t];
    const power = heal ? healingPower(u, s, art) : 0;
    result.recipients = friends.map((v) => supportEntry(result.forms, u, v, healAmount(v, power)));
    if (heal) woundedHealNotes(t, friends, result);
    if (result.forms.includes('riposte'))
      result.effects.push({ kind: 'riposte', power: 9, turns: 1 });
    for (const entry of result.recipients) {
      const name = unitDetails(friends.find((v) => v.id === entry.id)).name;
      if (entry.clean.length)
        result.notes.push(name + '解去' + entry.clean.map((k) => CONDITION_NAMES[k]).join('、'));
      if (entry.mp) result.notes.push(name + '內力 ＋' + entry.mp);
      if (entry.overflow) result.notes.push(name + '餘氣護盾 ' + entry.overflow);
    }
    result.amount = result.recipients.find((entry) => entry.id === t.id)?.amount || 0;
    // 轉護: the caster's own shield, up to 24, passes to every recipient.
    if (art.consume === 'shield' && u.conditions?.shield) {
      result.passed = Math.min(24, u.conditions.shield.power);
      result.notes.push(
        '轉護 · 移出自身護盾 ' + u.conditions.shield.power + '，各人得 ' + result.passed + ' 護盾'
      );
    }
    if (art.order)
      result.notes.push('號令 · ' + unitDetails(t).name + '可再移動並出手一次（本局僅一次）');
    selfLoss(s, u, art, result, false);
    result.notes.push(...guardNotes(art), ...priceNotes(art));
    return result;
  }
  if (isProp(t)) return propForecast(s, u, t, skill, art, basic, result);
  const single = damage(u, t, skill, s?.mapIndex, s, art, basic);
  const step = forcedStep(s, u, t, art, result.forms, walkable);
  const plan = contactPlan(s, u, t, art, result.forms, step, unitDetails(t)?.rank === 'boss');
  result.plan = plan;
  result.notes = plan.notes;
  if (guard) {
    result.coveredBy = guard.id;
    result.notes.unshift('代受 · ' + unitDetails(guard).name + '代' + unitDetails(aimed).name + '受招');
  }
  if (art) result.notes.push(...strikeFactor(s, u, art, t).notes);
  result.effects.push(...plan.effects);
  dazePlan(s, u, t, art, result); // 失神: a setup to meet, a master to resist
  const baseHits = (art?.hits || [1]).map(
    (part, i) => Math.round(single * part) + (i === 0 ? plan.extra : 0)
  );
  result.rawHits = baseHits.map((hit) => afterWard(hit, ward));
  // The receiver's own defences, before its shield.
  const blow = received(s, t, result.rawHits);
  result.rawHits = blow.hits;
  const wall = unitDetails(t)?.traits?.stance;
  if (wall?.while === 'posted' && !blow.void && stanceHolds(s, t)) result.notes.push('盾牆 · 傷害 −' + wall.cut + '%');
  let shield = t.conditions?.shield?.power || 0;
  result.hits = result.rawHits.map((hit) => {
    const stopped = Math.min(hit, shield);
    shield -= stopped;
    result.shielded += stopped;
    return hit - stopped;
  });
  result.amount = result.hits.reduce((sum, n) => sum + n, 0);
  result.push = t.hp > result.amount ? step : null;
  // 閃身, 挪移: what the receiver's guard did to the blow as a whole.
  if (blow.ward || blow.void) answerBlow(s, u, t, blow, result);
  if (result.plan.partnerMp)
    result.notes.push(unitDetails(find(s, plan.partner)).name + '內力 ＋' + plan.partnerMp);
  if (result.plan.clearPoison) result.notes.push('以毒解毒 · 解除自身中毒');
  if (result.forms.includes('leech')) {
    result.selfHeal = Math.min(
      healAmount(u, Math.min(9, Math.floor(Math.min(t.hp, result.amount) / 4))),
      u.maxHp - u.hp + result.hpCost
    );
    if (result.selfHeal) result.notes.push('回生 · 自身氣血 ＋' + result.selfHeal);
  }
  // 化功: what touching the receiver costs the striker in 內力.
  result.contact = contactLoss(s, u, t, result);
  if (result.contact) result.notes.push('化功 · 內力 −' + result.contact);
  // 吸勁: decided as the blow lands, before the counter it may un-charge.
  result.siphon = siphonPlan(s, u, t, result);
  if (result.siphon) result.notes.push(result.siphon.note);
  const share = counterRatio(s, afterSiphon(t, result.siphon));
  if (
    share &&
    !plan.safe &&
    !blow.silent &&
    t.hp > result.amount &&
    distance(u, result.push || t) <= reach(s, t)
  ) {
    const reply =
      art?.debuff?.stat === 'atk'
        ? {
            ...t,
            conditions: {
              ...t.conditions,
              weak: { power: Math.max(t.conditions?.weak?.power || 0, art.debuff.power) }
            }
          }
        : t;
    // The counter comes once the striker has paid his action's 氣血.
    const after = u.hp - result.hpCost;
    result.counterRaw = afterCut(
      Math.max(2, Math.round(damage(reply, u, false, s?.mapIndex, s, null, basicFor(reply), after) * share)),
      stanceCut(s, u)
    );
    result.counter = Math.max(0, result.counterRaw - (u.conditions?.shield?.power || 0));
    if (share === 1 && !t.conditions?.stance) result.notes.push('蓄勢反擊 · 還擊全力');
    const traits = traitsOf(t);
    if (traits.crowded && distance(t, u) <= traits.crowded.within)
      result.notes.push('近身失準 · 還擊攻擊 −' + traits.crowded.atk);
    if (traits.execute && after <= u.maxHp / 2)
      result.notes.push('斬殘 · 還擊攻擊 ＋' + executeBonus(s, traits));
  }
  if (s && (art?.splash || result.forms.includes('line') || result.forms.includes('arc'))) {
    const targets = secondaryTargets(s, u, t, result.push || t, art, result.forms, walkable);
    const guards = new Set(wardEscorts(s));
    if (result.amount >= t.hp) guards.delete(t);
    const power = baseHits.reduce((a, b) => a + b, 0);
    for (const [v, ratio] of targets) {
      const raw = afterWard(Math.max(4, Math.round(power * ratio)), wardShare(s, v, [...guards]));
      const amount = Math.min(v.hp, Math.max(0, raw - (v.conditions?.shield?.power || 0)));
      if (amount >= v.hp) guards.delete(v);
      result.splash.push({ id: v.id, raw, amount });
    }
  }
  if (
    u.conditions?.riposte &&
    result.counter > 0 &&
    u.hp - result.hpCost + result.selfHeal > result.counter
  ) {
    const guards = wardEscorts(s).filter(
      (g) => !result.splash.some((hit) => hit.id === g.id && hit.amount >= g.hp)
    );
    const raw = afterWard(
      Math.min(u.conditions.riposte.power, result.counter),
      wardShare(s, t, guards)
    );
    result.reflected = Math.min(t.hp - result.amount, Math.max(0, raw - shield));
    result.notes.push('借勁 · 還擊後反震 ' + result.reflected + ' 氣血');
  }
  // 反刺: the counter comes from beside the wearer, so it pricks the one who makes it.
  if (result.counterRaw > 0 && barbsOf(u) && distance(u, result.push || t) === 1) {
    const guards = wardEscorts(s).filter(
      (g) => !result.splash.some((hit) => hit.id === g.id && hit.amount >= g.hp)
    );
    result.barbs = afterWard(barbsOf(u), wardShare(s, t, guards));
    result.notes.push(
      '反刺 · 還擊者被軟蝟甲扎傷 ' +
        Math.min(t.hp - result.amount - result.reflected, Math.max(0, result.barbs - shield)) +
        ' 氣血'
    );
  }
  if (result.forms.includes('glide') && art && glideSteps(s, u) > 0)
    result.notes.push('回身 · 出招後尚可走 ' + glideSteps(s, u) + ' 步');
  if (result.forms.includes('again') && u.againRound !== s?.round)
    result.notes.push(
      result.amount >= t.hp ? '連環 · 此擊可擊倒，本回合可再出手' : '連環 · 擊倒則可再出手'
    );
  zoneNote(s, u, art, t, result); // 布陣 rider: the tiles round the target's feet
  selfLoss(s, u, art, result, true); // 內傷 and 反噬: what the strike costs its caster after
  result.notes.push(...guardNotes(art), ...priceNotes(art));
  return result;
}
// A blow at a board object: its hits on the object's 防禦 and ground, and nothing else. An object
// does not counter, guard, dodge or move, and takes no condition, so the art's riders, pushes and
// splash do not come with it; the art's own price still does.
function propForecast(s, u, t, skill, art, basic, result) {
  const single = damage(u, t, skill, s?.mapIndex, s, art, basic);
  result.plan = { extra: 0, effects: [], notes: [] };
  result.effects = [];
  result.rawHits = (art?.hits || [1]).map((part) => Math.round(single * part));
  result.hits = [...result.rawHits];
  result.amount = result.hits.reduce((sum, n) => sum + n, 0);
  result.notes = [];
  if (art) result.notes.push(...strikeFactor(s, u, art, t).notes);
  result.notes.push(OBJECT_NOTE);
  if (result.forms.includes('again') && u.againRound !== s?.round)
    result.notes.push(result.amount >= t.hp ? '連環 · 此擊可擊毀，本回合可再出手' : '連環 · 擊毀則可再出手');
  selfLoss(s, u, art, result, true);
  result.notes.push(...priceNotes(art));
  return result;
}
const OBJECT_NOTE = '器物 · 不還擊、不閃避，招式附帶之效不及其身';
// 化功 (§7.7): a hero whose direct blow lands on a villain with `contact` from the tile beside him
// loses contact.mp + stage 內力 (never below 0), unless the villain is sealed before or by this
// blow. 免受還擊 does not spare him; a disciple who took the blow for his master has no 化功.
function contactLoss(s, u, t, result) {
  const c = traitsOf(t).contact;
  if (!c || !ally(u) || distance(u, t) !== 1 || t.conditions?.seal) return 0;
  if (result.effects.some((e) => e.kind === 'seal')) return 0;
  return Math.min(c.mp + (s?.run?.stage || 0), Math.max(0, u.mp - result.mpCost));
}
// The preview of a blow the receiver's guard answers: one that does not land carries none of its
// effects or push; what a 挪移 turns back is shown on the striker, never below 1 氣血.
function answerBlow(s, u, t, blow, result) {
  if (blow.void) {
    result.void = true;
    result.effects = [];
    // 失神 rides on the blow: a blow that does not land takes no action away.
    result.notes = result.notes.filter((n) => !n.endsWith('失去下一次行動'));
    result.push = null;
    result.plan = {
      ...result.plan,
      effects: [],
      spentMark: false,
      spentPoison: false,
      partnerMp: 0,
      clearPoison: false
    };
  }
  if (blow.evaded) {
    result.evaded = true;
    result.notes.push('閃身 · ' + unitDetails(t).name + '閃開此擊，不還擊');
  }
  if (!blow.ward) return;
  result.turned = { ward: blow.ward, back: blow.back };
  const left = Math.max(0, blow.back - (u.conditions?.shield?.power || 0));
  result.rebound = Math.min(left, Math.max(0, u.hp - result.hpCost - 1));
  const name = unitDetails(t).name,
    keep = blow.ward.keep;
  const kept = blow.ward.source
    ? '挪移 · ' + name + '受擊減半'
    : '斗轉星移 · ' + name + (keep ? '只受' + tenths(keep * 100) : '不受此擊');
  result.notes.push(kept + '，反震 ' + blow.back);
}
// What using the art costs its caster beyond 內力 and 氣血, as the preview states it.
function priceNotes(art) {
  const notes = [];
  if (art?.recoil && art.openGuard) notes.push('有攻無守 · 至下回合不還擊，防禦 −' + art.recoil);
  else if (art?.recoil) notes.push('露空 · 出招後防禦 −' + art.recoil + ' 至下回合');
  else if (art?.openGuard) notes.push('無守 · 出招後至下回合不還擊');
  if (art?.rooted) notes.push('立樁 · 下回合不能移動');
  if (art?.spent) notes.push('曲終 · 下回合不能施展絕技');
  if (art?.once) notes.push('壓箱 · 每局一次');
  if (art?.cooldown) notes.push('調息 · 施展後隔 ' + art.cooldown + ' 回合');
  return notes;
}
// 35 → 三成半: a share as the ward lines say it.
const shareWords = (n) => (n % 10 === 5 && n > 5 ? tenths(n - 5) + '半' : tenths(n));
const tenths = (n) => (n % 10 ? n + '%' : '一二三四五六七八九'[n / 10 - 1] + '成');
// The guard an art leaves on its caster until his next turn, as the preview states it.
function guardNotes(art) {
  const notes = [];
  if (art?.stance) notes.push('卸勁 · 至下回合受擊減' + tenths(art.stance) + '，還擊全力');
  if (art?.cover) notes.push('代受 · 至下回合，敵人對相鄰同伴的直接攻擊改由自己承受');
  if (art?.evade) notes.push('閃身 · 下一次直接攻擊落空');
  if (art?.taunt)
    notes.push(
      '挑釁 · 至下回合，' + (art.taunt === 2 ? '兩' : art.taunt) + '格內可攻到他的敵人只能攻擊他'
    );
  return notes;
}
// Experience and level numbers. The wiki's rules page reads these.
const GROWTH = {
  levelXp: 100, // experience needed for each level
  basicXp: 36, // earned by a basic attack
  skillXp: 44, // earned by a signature art
  killXp: 30, // extra for each foe felled by the action
  seasoned: 3, // from this level on, action experience is scaled down
  drag: 38 // percent added to the divisor for each level above `seasoned`
};
function raiseLevel(u, levels) {
  const novice = Math.min(levels, Math.max(0, 3 - u.level));
  const veteran = levels - novice;
  const vitality = 12 * novice + 8 * veteran;
  u.level += levels;
  u.atk += 3 * novice + 2 * veteran;
  u.def += 2 * novice + veteran;
  u.maxHp += vitality;
  if (living(u)) u.hp = Math.min(u.maxHp, u.hp + vitality);
  u.maxMp += 6 * levels;
  u.mp = Math.min(u.maxMp, u.mp + 6 * levels);
}
function settleExperience(s, u) {
  if (!Number.isSafeInteger(u.xp) || u.xp < GROWTH.levelXp) return false;
  const levels = Math.floor(u.xp / GROWTH.levelXp);
  u.xp %= GROWTH.levelXp;
  u.sp += levels;
  raiseLevel(u, levels);
  log(s, 'grow', '升至等級 ' + u.level + '，獲得 ' + levels + ' 點武學點數。', unitDetails(u).name);
  return true;
}
function exp(s, u, n) {
  if (!Number.isSafeInteger(n) || n < 0) return false;
  n = Math.round((n * 100) / (100 + GROWTH.drag * Math.max(0, u.level - GROWTH.seasoned)));
  u.xp += n;
  log(s, 'grow', '獲得 ' + n + ' 點歷練。', unitDetails(u).name);
  return settleExperience(s, u);
}
function wound(s, u, n, source) {
  if (!living(u)) return 0;
  const shield = u.conditions?.shield;
  if (shield) {
    const absorbed = Math.min(shield.power, n);
    n -= absorbed;
    shield.power -= absorbed;
    if (!shield.power) delete u.conditions.shield;
  }
  const d = Math.min(n, u.hp);
  u.hp -= d;
  if (!living(u)) delete u.conditions;
  // 領隊無傷 counts what enemies take from the leader, through any blow, counter or poison.
  if (s.tally && u.id === s.leader && d > 0 && source && !ally(source)) s.tally.leaderHurt += d;
  if (isProp(u)) {
    if (d > 0) propStruck(s, u);
    if (!living(u)) propBroken(s, u);
  } else if (!ally(u)) {
    s.stats.damage += d;
    if (!living(u)) {
      noteFall(s, u, source);
      s.stats.kills++;
      progress(source, 'kills', 1);
    }
  }
  if (!ally(u) && !living(u) && unitDetails(u)?.traits?.ward) {
    const master = find(s, commanderId(s)),
      left = wardShare(s, master);
    const name = unitDetails(master).name;
    log(
      s,
      'combat',
      left
        ? '一條星索斷了。' + name + '的護勁降至' + shareWords(left) + '。'
        : '星索皆斷，' + name + '的護陣已破。',
      '星索護陣'
    );
  }
  return d;
}
// ── Board objects in the fight ───────────────────────────────────────────
// A board object's own line for a moment (encounter-script.js `objects`): 'hit' the first time it
// is struck, 'half' the first time it is at half, 'broken', and 'held' (a 'keep' board held to
// its last round). Logged as its speaker says it; nothing when the board has no line.
function objectBeat(s, u, moment) {
  const beat = s.run && ENCOUNTER_SCRIPT[s.mapIndex]?.objects?.[pieceKey(u)]?.[moment];
  if (!beat) return null;
  const speaker =
    beat.who === 'youth'
      ? YOUTH.role
      : unitDetails(find(s, refId(s.mapIndex, { boss: 'master', mini: 'lieutenant' }[beat.who] || beat.who)))?.name;
  return { ...beat, speaker: speaker || YOUTH.role };
}
function sayObject(s, u, moment) {
  const beat = objectBeat(s, u, moment);
  if (beat) log(s, 'story', beat.text, beat.speaker);
}
function propStruck(s, u) {
  const who = propKind(u) === 'keep' ? '守物' : '破物';
  if (!u.struck) {
    u.struck = true;
    log(s, 'combat', unitDetails(u).name + '受創。', who);
    sayObject(s, u, 'hit');
  }
  if (!u.halved && living(u) && u.hp <= u.maxHp / 2) {
    u.halved = true;
    log(s, 'combat', unitDetails(u).name + '氣血過半。', who);
    sayObject(s, u, 'half');
  }
}
function propBroken(s, u) {
  const name = unitDetails(u).name;
  if (propKind(u) === 'break') {
    const left = props(s).filter((v) => propKind(v) === 'break' && living(v)).length;
    log(s, 'combat', left ? name + '倒了，尚餘 ' + left + ' 根。' : name + '盡數倒了。', '破物');
  } else log(s, 'combat', name + '毀了。', '守物');
  sayObject(s, u, 'broken');
}
// The lamp's tile, when this run's secondary is to light it.
function objectiveTile(s) {
  return s.run?.side?.kind === 'lamp' ? s.run.objectivePos || mapLayout(s.mapIndex).objective : null;
}
function unclaimedObjectiveTile(s) {
  return s.run?.status === 'battle' && !s.run.marked ? objectiveTile(s) : null;
}
function holdObjective(s, u) {
  const marker = unclaimedObjectiveTile(s);
  if (marker && ally(u) && living(u) && distance(u, marker) === 0) {
    s.run.marked = true;
    log(s, 'story', '點亮了引路燈。盤外瞧這一局，瞧得清清楚楚了。', unitDetails(u).name);
  }
}
function commitSteps(u) {
  if (u.moved && u.origin && u.route?.length) progress(u, 'steps', u.route.length - 1);
  u.origin = null;
}
function finishAction(s, u) {
  if (s.run) s.run.formationOpen = false;
  holdObjective(s, u);
  commitSteps(u);
  u.acted = true;
}
function putEffects(s, caster, target, specs, effects) {
  for (const effect of specs) {
    applyCondition(s, target, effect, caster);
    effects.push([target.id, CONDITION_NAMES[effect.kind], 'status']);
    log(
      s,
      'combat',
      '獲得「' + CONDITION_NAMES[effect.kind] + '」' + effect.turns + ' 回合。',
      unitDetails(target).name
    );
  }
}
function reflectStrike(s, victim, attacker, dealt, effects) {
  const stance = victim.conditions?.riposte;
  if (!stance || !dealt || !living(victim) || !living(attacker)) return;
  delete victim.conditions.riposte;
  const source = find(s, stance.source) || victim;
  const amount = blowing({ how: 'reflect' }, () =>
    wound(s, attacker, afterWard(Math.min(stance.power, dealt), wardPercent(s, attacker)), source)
  );
  effects.push([attacker.id, '−' + amount]);
  log(
    s,
    'combat',
    '借勁反震' + unitDetails(attacker).name + '，造成 ' + amount + ' 點傷害。',
    unitDetails(victim).name
  );
}
// 反刺 (軟蝟甲): a piece that strikes the wearer from the tile beside her, with a blow or a counter
// that lands, is pricked for the gear's barbs. Defence does not cut it; the striker's own shield
// takes it first, and a master's escorts share it as they share any blow. A blow 閃身 or 挪移
// voids never touches her. The wearer's own strike shows the pricking of its counter in the
// forecast (`barbs`).
const barbsOf = (v) => ITEMS[v?.gear]?.barbs || 0;
function barbStrike(s, wearer, striker, raw, effects) {
  if (!raw || !living(striker)) return;
  const amount = wound(s, striker, raw, wearer);
  effects.push([striker.id, '−' + amount]);
  log(
    s,
    'combat',
    '軟蝟甲的倒刺扎傷' + unitDetails(striker).name + '，造成 ' + amount + ' 點傷害。',
    unitDetails(wearer).name
  );
}
function restoreHealth(s, caster, target, n, effects) {
  if (!n) return;
  target.hp += n;
  s.stats.healed += n;
  progress(caster, 'heals', n);
  effects.push([target.id, '+' + n]);
  log(s, 'combat', '回復 ' + n + ' 點氣血。', unitDetails(target).name);
}
function resolve(s, u, t, skill) {
  if (!targetOK(s, u, t, skill)) return null;
  const f = forecast(u, t, skill, s),
    id = u.activeArt || 'signature',
    art = skill ? artFor(u, id) : null;
  // 代受: from here on the strike is on the coverer the forecast found.
  if (f.coveredBy) t = takeCover(s, t);
  const verb = art?.name || basicFor(u).name,
    who = unitDetails(u).name;
  const effects = [],
    oldKills = s.stats.kills,
    from = { x: u.x, y: u.y };
  let felled = false; // the main target, by the blow itself (not its splash)
  if (skill) {
    u.mp -= f.mpCost;
    progress(u, 'casts', 1);
  }
  if (f.hpCost) {
    u.hp -= f.hpCost;
    effects.push([u.id, '−' + f.hpCost, 'sacrifice']);
  }
  // Ordinary movement is counted once when confirmed. Lightness skills move instantaneously.
  // 布陣 is laid where it is aimed; its caster stays where she is.
  if (f.type === 'ground' && art.zone) layZone(s, u, t);
  else if (f.type === 'ground') {
    commitSteps(u);
    u.x = t.x;
    u.y = t.y;
    u.moved = true;
    delete u.route;
    u.blinkSerial = (u.blinkSerial || 0) + 1;
    log(
      s,
      'move',
      '施展「' + verb + '」移至第 ' + (t.x + 1) + ' 列、第 ' + (t.y + 1) + ' 行。',
      who
    );
  }
  for (const id of f.landing) {
    putEffects(s, u, find(s, id), [{ kind: 'shield', power: 8, turns: 1 }], effects);
    progress(u, 'protects', 1);
  }
  if (f.support) {
    log(s, 'combat', '施展「' + verb + '」。', who);
    if (f.passed) delete u.conditions.shield;
    for (const entry of f.recipients) {
      const v = find(s, entry.id);
      for (const k of entry.clean) delete v.conditions[k];
      v.mp += entry.mp;
      restoreHealth(s, u, v, entry.amount, effects);
      if (entry.overflow)
        putEffects(s, u, v, [{ kind: 'shield', power: entry.overflow, turns: 1 }], effects);
      if (f.passed) putEffects(s, u, v, [{ kind: 'shield', power: f.passed, turns: 2 }], effects);
      const shields = entry.overflow || f.passed || f.effects.some((e) => e.kind === 'shield');
      if (shields || (v !== u && (f.effects.length || entry.clean.length)))
        progress(u, 'protects', 1);
      putEffects(s, u, v, f.effects, effects);
    }
    if (art.order) giveOrder(s, t); // 號令
  } else if (f.type === 'enemy') {
    // 留力 asks whether the hero struck last round; a counter or a support art is no strike.
    if (ally(u)) u.struckRound = s.round;
    let total = 0;
    const facts = {
      how: skill ? 'art' : 'basic',
      art: skill ? id : null,
      combo: !!(f.plan.spentMark || f.plan.spentPoison || f.plan.partner),
      answered: !!art?.answer && strikeFactor(s, u, art, t).notes.some((n) => n.startsWith('破招'))
    };
    blowing(facts, () => {
      for (const power of f.rawHits) {
        if (!living(t)) break;
        const dealt = wound(s, t, power, u);
        total += dealt;
        effects.push([t.id, '−' + dealt]);
      }
    });
    felled = !living(t);
    log(
      s,
      'combat',
      '以「' + verb + '」擊中' + unitDetails(t).name + '，造成 ' + total + ' 點傷害。',
      who
    );
    // 閃身 is used up by the blow it made miss; 挪移 turns its share back on the striker.
    if (!ally(t)) wakePost(s, t, true); // 坐鎮: a struck piece may leave its post
    if (f.evaded) dodge(s, t, effects);
    if (f.turned) turnBack(s, u, t, f.turned, effects);
    // 布陣 rider: centred where the target stood when struck; a blow that did not land lays none.
    if (art?.zone && !f.void) layZone(s, u, t);
    if (living(t)) {
      if (f.plan.spentMark) delete t.conditions.mark;
      if (f.plan.spentPoison) delete t.conditions.poison;
      if (f.effects.some((e) => e.kind === 'seal')) t.lastSealRound = s.round;
      if (f.effects.some((e) => e.kind === 'daze') && unitDetails(t).rank === 'boss')
        t.lastDazeRound = s.round;
      putEffects(s, u, t, f.effects, effects);
    } else log(s, 'combat', '失去戰力。', unitDetails(t).name);
    // 吸勁 lands before the counter, so a signature it puts back is no longer charged for it.
    applySiphon(s, u, t, f.siphon);
    if (f.contact) {
      u.mp = Math.max(0, u.mp - f.contact); // 化功
      log(s, 'combat', '被化功大法化去 ' + f.contact + ' 點內力。', who);
    }
    if (f.plan.partnerMp) find(s, f.plan.partner).mp += f.plan.partnerMp;
    if (f.plan.clearPoison) delete u.conditions.poison;
    restoreHealth(s, u, u, f.selfHeal, effects);
    if (f.push) {
      followRoute(t, [{ x: t.x, y: t.y }, f.push]);
      log(s, 'move', art?.push ? '被掌力震退一格。' : '被牽近一格。', unitDetails(t).name);
    }
    if (art?.recover) u.mp = Math.min(u.maxMp, u.mp + art.recover);
    for (const other of f.splash) {
      const v = find(s, other.id),
        dealt = blowing({ how: 'splash', art: skill ? id : null }, () => wound(s, v, other.raw, u));
      effects.push([v.id, '−' + dealt]);
      log(s, 'combat', '受到氣勁波及，損失 ' + dealt + ' 點氣血。', unitDetails(v).name);
      if (!ally(v)) wakePost(s, v, true);
    }
    if (f.counterRaw) {
      const dealt = wound(s, u, f.counterRaw, t);
      effects.push([u.id, '−' + dealt, 'counter']);
      log(s, 'combat', '還擊' + who + '，造成 ' + dealt + ' 點傷害。', unitDetails(t).name);
      reflectStrike(s, u, t, dealt, effects);
      barbStrike(s, u, t, f.barbs, effects); // 反刺
    }
    woundSelfLoss(s, u, effects); // 內傷: the attacker pays once the exchange is over
  }
  if (art?.once) (u.usedOnce ??= []).push(id);
  if (art?.cooldown) (u.cooldowns ??= {})[id] = s.round + art.cooldown + 1;
  if (art && living(u)) {
    const own = selfEffectsOf(art).map((e) =>
      e.kind === 'backlash' ? { ...e, turns: LIMIT - s.round + 1 } : e
    );
    putEffects(s, u, u, backlashBurst(s, u, own, effects), effects); // 反噬: the third layer bursts
  }
  finishAction(s, u);
  // 回身: the steps left to walk after the strike.
  if (art && f.forms.includes('glide') && living(u) && glideSteps(s, u) > 0)
    u.glideLeft = glideSteps(s, u);
  // 連環: felling the main target gives one more action this round.
  const again = f.forms.includes('again') && felled && chainAgain(s, u);
  if (f.notes.length) log(s, 'combat', '氣勁變化。' + f.notes.join('。'), who);
  const leveled = living(u) && exp(
      s,
      u,
      (skill ? GROWTH.skillXp : GROWTH.basicXp) + (s.stats.kills - oldKills) * GROWTH.killXp
    );
  check(s);
  return {
    effects,
    leveled,
    counter: f.counterRaw > 0,
    hits: f.hits.length,
    from,
    glide: canGlide(s, u) ? u.glideLeft : 0,
    again,
    ordered: art?.order ? t.id : null
  };
}
// 號令: the companion gets a whole move and a whole action again this round; a brace he already
// has stays. Every limit on his arts still holds.
function giveOrder(s, t) {
  Object.assign(t, { acted: false, moved: false, origin: null, walked: 0, glideLeft: 0 });
  t.orderedRound = s.round;
  log(s, 'combat', '奉號令，可再移動並出手一次。', unitDetails(t).name);
}
// 連環: once per hero per round, whatever triggered it. He acts again from where he stands (or
// moves first, if he had not); the move already made is committed, so it cannot be taken back.
function chainAgain(s, u) {
  if (!living(u) || u.againRound === s.round) return false;
  u.acted = false;
  u.againRound = s.round;
  log(s, 'combat', '連環 · 擊倒對手，本回合可再出手一次。', unitDetails(u).name);
  return true;
}
function waitUnit(s, u) {
  if (!canAct(s, u)) return false;
  u.brace = true;
  finishAction(s, u);
  log(s, 'combat', '凝神待命，防禦暫時提升 4 點。', unitDetails(u).name);
  return true;
}
function canUseMedicine(s, u) {
  if (!u || !ally(u)) return false;
  if (managesCompany(s)) return company(s).includes(u);
  return (
    (!s.run?.scene || s.run.scene === 'fight') &&
    !s.result &&
    s.phase === 'ally' &&
    living(u) &&
    s.units.includes(u)
  );
}
// What a dose would do for `u` now: the ailments it lifts, then the 氣血 and 內力 it restores. A
// lifted 內傷 no longer halves the healing that follows it.
function medicineFor(u, item) {
  const clean = item?.cleanse ? AILMENTS.filter((k) => u.conditions?.[k]) : [];
  const hp = item?.hp
    ? Math.min(clean.includes('wound') ? item.hp : healAmount(u, item.hp), u.maxHp - u.hp)
    : 0;
  const mp = item?.mp ? Math.min(item.mp, u.maxMp - u.mp) : 0;
  return { clean, hp: Math.max(0, hp), mp: Math.max(0, mp), helps: clean.length + hp + mp > 0 };
}
function consume(s, u, id) {
  const item = ITEMS[id];
  if (item?.kind !== 'use' || !canUseMedicine(s, u) || !(s.stock[id] > 0)) return false;
  const dose = medicineFor(u, item);
  if (!dose.helps) return false;
  for (const k of dose.clean) delete u.conditions[k];
  u.hp += dose.hp;
  u.mp += dose.mp;
  s.stock[id]--;
  if (s.tally && s.run?.scene === 'fight') s.tally.doses++; // 不假丹藥
  s.stats.healed += dose.hp;
  const parts = [
    dose.clean.length && '解除' + dose.clean.map((k) => CONDITION_NAMES[k]).join('、'),
    (dose.hp || dose.mp) &&
      '回復 ' +
        [dose.hp && dose.hp + ' 點氣血', dose.mp && dose.mp + ' 點內力'].filter(Boolean).join('與')
  ].filter(Boolean);
  log(s, 'item', '服用' + item.name + '，' + parts.join('，') + '。', unitDetails(u).name);
  return true;
}
function equip(s, u, id) {
  const item = ITEMS[id];
  if (!canPrepare(s, u) || !item || item.kind === 'use' || (item.owner && item.owner !== u.id))
    return false;
  const slot = item.kind === 'weapon' ? 'weapon' : 'gear',
    old = u[slot];
  if (old === id) {
    s.stock[id] = (s.stock[id] || 0) + 1;
    u[slot] = null;
    log(s, 'item', '卸下' + item.name + '。', unitDetails(u).name);
    return true;
  }
  if (!s.stock[id]) return false;
  if (old) s.stock[old] = (s.stock[old] || 0) + 1;
  s.stock[id]--;
  u[slot] = id;
  log(s, 'item', '裝備' + item.name + '。', unitDetails(u).name);
  return true;
}
function transferEquipment(s, recipient, holder, id) {
  const item = ITEMS[id],
    slot = item?.kind;
  if (
    !managesCompany(s) ||
    !canConfigure(s, recipient) ||
    !company(s).includes(holder) ||
    recipient === holder ||
    !['weapon', 'gear'].includes(slot) ||
    holder[slot] !== id ||
    recipient[slot] === id ||
    (item.owner && item.owner !== recipient.id)
  )
    return false;
  const old = recipient[slot];
  if (old) s.stock[old] = (s.stock[old] || 0) + 1;
  holder[slot] = null;
  recipient[slot] = id;
  log(
    s,
    'item',
    unitDetails(holder).name + '移交了' + item.name + '。',
    unitDetails(recipient).name
  );
  return true;
}
function train(s, u, k) {
  if (!canPrepare(s, u) || !Object.hasOwn(TALENTS, k) || u.sp < 1 || u.talents[k] >= 3)
    return false;
  u.sp--;
  u.talents[k]++;
  log(
    s,
    'grow',
    '將「' + TALENTS[k].name + '」修習至第 ' + u.talents[k] + ' 重。',
    unitDetails(u).name
  );
  return true;
}
// How each kind of board is won (battles.js `kind`). The leader's fall and the round limit end
// every kind the same way, in `check`.
const KIND_RULES = {
  // 斬將: every master has fallen, whoever else stands.
  slay: { won: (s) => masterIds(s).every((id) => fallen(s, id)) },
  // 殲滅: no enemy stands and none is still to come.
  rout: { won: (s) => !enemies(s).some(living) && wavesLeft(s) === 0 },
  // 守: every master has fallen, or the objects still stand when the last round to hold is over;
  // a master still to come has not fallen. An object broken loses it (check).
  keep: { won: (s) => masterIds(s).every((id) => fallen(s, id)) || heldOut(s) },
  // 破: every object is broken, whoever stands.
  break: { won: (s) => props(s).length > 0 && !props(s).some(living) }
};
// 守: the enemy phase of the board's last round to hold is over, every enemy having acted or fallen.
function heldOut(s) {
  const hold = boardOf(s).hold;
  return !!hold && s.round >= hold && s.phase === 'enemy' && enemies(s).every((e) => !living(e) || e.acted);
}
// The rounds still to hold on a 'keep' board, this one included; null on any other.
function holdLeft(s) {
  const hold = boardKind(s) === 'keep' ? boardOf(s).hold : null;
  return hold ? Math.max(0, hold - s.round + (s.phase === 'enemy' && heldOut(s) ? 0 : 1)) : null;
}
// The 'keep' object that has been broken, if any: the board is lost.
const brokenKeep = (s) =>
  boardKind(s) === 'keep' ? props(s).find((u) => propKind(u) === 'keep' && !living(u)) || null : null;
const fallen = (s, id) => {
  const u = s.units.find((v) => v.id === id);
  return !!u && !living(u);
};
function check(s) {
  if (s.result) return;
  if (!living(find(s, leader(s)))) {
    s.result = 'loss';
    s.reason =
      DETAILS[leader(s)].name +
      (s.run ? '倒下，這一輪的眼破了。' : '負傷倒下，曲譜落入青城弟子手中。');
  } else {
    markHalved(s); // 變招, and reinforcements that wait on a master's half
    const broken = brokenKeep(s);
    if (broken) {
      s.result = 'loss';
      s.reason =
        (s.run && ENCOUNTER_SCRIPT[s.mapIndex]?.objects?.[pieceKey(broken)]?.lost) ||
        unitDetails(broken).name + '毀了，這一局輸了。';
    } else if (KIND_RULES[boardKind(s)].won(s)) {
      s.result = 'win';
      // 守 held to its last round: the board's own line first, then the board's victory.
      if (boardKind(s) === 'keep' && !masterIds(s).every((id) => fallen(s, id)))
        for (const u of props(s)) sayObject(s, u, 'held');
      s.reason = s.run ? CHAMBER_TALES[s.mapIndex].victory : '余滄海收劍退開，渡口的船燈再度亮起。';
    } else if (s.round > LIMIT) {
      s.result = 'loss';
      s.reason = s.run ? '十二合已過。拓來的一念撐不住，散了。' : '十二回合已過，霧中的末班渡船已經離岸。';
      s.round = LIMIT;
    }
  }
  if (s.result) {
    s.phase = 'done';
    log(s, 'story', s.reason, s.result === 'win' ? '破關' : '敗退');
  }
}
// Each master's half-health moment, once: `halved` is set, the commander's also sets
// `s.foreshadow`, and a living master changes as its `phase` says. A master felled from above
// half is marked as it falls, for the reinforcements that wait on it, but changes nothing.
function markHalved(s) {
  for (const id of masterIds(s)) {
    const m = s.units.find((v) => v.id === id);
    if (!m || m.halved || m.hp > m.maxHp / 2) continue;
    m.halved = true;
    if (id === commanderId(s)) s.foreshadow = true;
    if (living(m)) shiftPhase(s, m);
    fireHalved(s, id);
  }
}
// Where the board's objective stands: the masters still living, the enemies still standing, and
// the wave pieces still able to come. The interface and the simulator read progress here.
function objectiveLeft(s) {
  return {
    masters: masterIds(s).filter((id) => !fallen(s, id)),
    foes: enemies(s).filter(living).length,
    waiting: wavesLeft(s),
    // The board's objects as they stand, and on a 'keep' board the rounds still to hold.
    objects: props(s).map((u) => ({ id: u.id, kind: propKind(u), hp: Math.max(0, u.hp), maxHp: u.maxHp, broken: !living(u) })),
    hold: holdLeft(s)
  };
}
// Whether the board would be won if exactly these enemies fell now, everyone else as they are.
function winsIfFalls(s, ids) {
  const gone = new Set(ids);
  const down = (id) => gone.has(id) || fallen(s, id);
  const kind = boardKind(s);
  if (kind === 'slay' || kind === 'keep') return masterIds(s).every(down);
  if (kind === 'break') return props(s).every((u) => down(u.id));
  if (enemies(s).some((u) => living(u) && !gone.has(u.id))) return false;
  // A master felled now marks his half and may call a wave.
  const halved = (id) => gone.has(id) || !!s.units.find((v) => v.id === id)?.halved;
  return wavesLeft(s, halved) === 0;
}
// ── Facts a secondary objective reads (journey.js SIDE_KINDS) ────────────
// `s.tally` is kept from the moment a run's board is set up; a game without one records nothing.
const blankTally = () => ({
  falls: [], // every enemy fall, in order: { id, by, how, art, combo, answered, round, phase }
  doses: 0, // medicine taken in the fight scene, deployment included
  leaderHurt: 0, // 氣血 the leader lost to enemies
  fired: {}, // villain behaviours that happened: { mirror, mend, herbs }
  crossed: false // a wave piece stood inside the secondary's holdLine zone
});
// What the blow being resolved is, for the fall it may cause: set just before its wounds, put
// back to 'other' just after.
let blowNow = { how: 'other' };
function blowing(facts, body) {
  blowNow = facts;
  try {
    return body();
  } finally {
    blowNow = { how: 'other' };
  }
}
function noteFall(s, u, source) {
  s.tally?.falls.push({
    id: u.id,
    by: source && ally(source) ? source.id : null,
    how: blowNow.how,
    art: blowNow.art ?? null,
    combo: !!blowNow.combo,
    answered: !!blowNow.answered,
    round: s.round,
    phase: s.phase
  });
}
const noteFired = (s, behaviour) => {
  if (s.tally) s.tally.fired[behaviour] = (s.tally.fired[behaviour] || 0) + 1;
};
// A tile inside a zone of board data ({ x: [from, to] } and/or { y: [from, to] }).
const inZone = (zone, p) =>
  (!zone.x || (zone.x[0] <= p.x && p.x <= zone.x[1])) && (!zone.y || (zone.y[0] <= p.y && p.y <= zone.y[1]));
// Where an enemy came to stand: a wave piece inside the secondary's line, a fleeing master on herbs.
function noteStanding(s, u) {
  const side = s.run?.side;
  if (s.tally && side?.kind === 'holdLine' && u.enteredRound != null && living(u) && inZone(side.zone, u))
    s.tally.crossed = true;
  if (fleeing(s, u) && tileInfo(u.x, u.y, s.mapIndex)?.heal) noteFired(s, 'herbs');
}
// ── Reinforcements (battles.js `waves`) ───────────────────────────────────
// `s.arrivals` holds, for each wave that is due and not yet all on the board, the round it
// enters. A wave piece has entered once its id is among the units, living or not.
const entered = (s, id) => s.units.some((u) => u.id === id);
const waveDue = (s, w) => s.arrivals?.[w.id];
// The masters a half-health wave waits on, as actor ids.
const triggerIds = (s, w) => (w.when.halved || []).map((ref) => refId(s.mapIndex, ref));
// A half-health wave has fired once any master it waits on has been at half.
const waveFired = (s, w, halved) => triggerIds(s, w).some(halved);
// Wave pieces still to come: those of scheduled waves, and every piece of a half-health wave
// that has not fired. `halved` lets winsIfFalls ask as if some masters were already marked.
function wavesLeft(s, halved = (id) => !!s.units.find((v) => v.id === id)?.halved) {
  let n = 0;
  for (const w of boardOf(s).waves) {
    const waiting = w.pieces.filter((p) => !entered(s, p.id)).length;
    if (waveDue(s, w) != null) n += waiting;
    else if (w.when.halved && !waveFired(s, w, halved)) n += waiting;
  }
  return n;
}
// Schedules the round waves of a board as it is set up (journey.js setUpBoard).
function scheduleWaves(s) {
  s.arrivals = {};
  for (const w of boardOf(s).waves) if (w.when.round) s.arrivals[w.id] = w.when.round;
}
// How a wave is named in every line about it: its leader, then its troops by name and count
// (鳳天南率五虎門棍徒兩名; 嵩山弟子兩名; types joined with 、).
function waveList(defs) {
  const named = (def) => DETAILS[def.id.split('#')[0]];
  const lead = defs[0] && named(defs[0]).rank ? named(defs[0]).name : '';
  const counts = new Map();
  for (const def of lead ? defs.slice(1) : defs) {
    const name = named(def).name;
    counts.set(name, (counts.get(name) || 0) + 1);
  }
  const troops = [...counts].map(([name, n]) => name + COUNTS[n] + '名').join('、');
  return lead ? lead + (troops ? '率' + troops : '') : troops;
}
// The tile a wave piece enters on now: its own if no one stands there, else the nearest free
// walkable tile within two (by distance, then lower y, then lower x); null if there is none.
// `taken` are tiles already promised to pieces entering before it.
function entryTile(s, piece, taken = []) {
  const free = (p) =>
    walkable(p.x, p.y, s.mapIndex) && !at(s, p.x, p.y) && !taken.some((q) => q.x === p.x && q.y === p.y);
  const own = { x: piece.at[0], y: piece.at[1] };
  if (free(own)) return own;
  const near = fieldCells(s.mapIndex)
    .filter((c) => distance(c, own) <= 2 && distance(c, own) > 0 && free(c))
    .sort((a, b) => distance(a, own) - distance(b, own) || a.y - b.y || a.x - b.x);
  return near[0] ? { x: near[0].x, y: near[0].y } : null;
}
// The pieces of the waves due in `round` as they would enter if they entered now: built where
// `arrive` would put them, with their entry round, and not on the board. The danger zone and the
// enemy page of a pending wave read these.
function arrivalGhosts(s, round) {
  const ghosts = [],
    taken = [];
  for (const w of boardOf(s).waves) {
    if (waveDue(s, w) !== round) continue;
    for (const piece of w.pieces) {
      if (entered(s, piece.id)) continue;
      const tile = entryTile(s, piece, taken);
      if (!tile) continue;
      taken.push(tile);
      ghosts.push(pieceUnit(s, { ...piece, at: [tile.x, tile.y] }, round));
    }
  }
  return ghosts;
}
// The waves scheduled and not yet all on the board, with the tiles and pieces still to enter.
function pendingWaves(s) {
  return boardOf(s)
    .waves.filter((w) => waveDue(s, w) != null)
    .map((wave) => {
      const defs = wave.pieces.filter((p) => !entered(s, p.id));
      return { wave, due: waveDue(s, wave), tiles: defs.map((p) => ({ x: p.at[0], y: p.at[1] })), defs };
    });
}
// The waves the player has been told of: those that enter at the start of next round. Until a
// wave is announced nothing on the screen gives it away (the producer's ruling of 2026-11-21:
// reinforcements come as a surprise); the interface reads this, never pendingWaves.
const announcedWaves = (s) => pendingWaves(s).filter((p) => p.due <= s.round + 1);
// The start of a round: every wave due now enters, in data order, piece by piece. A piece whose
// entry tile is taken enters beside it; one with nowhere to stand waits a round. They enter
// unhurt and unacted, after every piece already on the board, so they act last.
function arrive(s) {
  for (const w of boardOf(s).waves) {
    if (waveDue(s, w) !== s.round) continue;
    const came = [];
    let held = false;
    for (const piece of w.pieces) {
      if (entered(s, piece.id)) continue;
      const name = DETAILS[piece.id.split('#')[0]].name;
      const tile = entryTile(s, piece);
      if (!tile) {
        held = true;
        log(s, 'system', name + '入場受阻，延至下一回合。', '敵援');
        continue;
      }
      const u = pieceUnit(s, { ...piece, at: [tile.x, tile.y] }, s.round);
      s.units.push(u);
      came.push(piece);
      if (tile.x !== piece.at[0] || tile.y !== piece.at[1])
        log(s, 'system', name + '入場處有人，改由' + tileName(tile) + '入場。', '敵援');
      noteStanding(s, u);
    }
    if (came.length) log(s, 'system', waveList(came) + '自' + w.place + '入場。', '敵援');
    for (const piece of came) strangerSteps(s, piece.id);
    if (held && s.round < LIMIT) s.arrivals[w.id] = s.round + 1;
    else delete s.arrivals[w.id];
  }
}
// A named black stone steps on during the battle: what he says, what a stone already there says
// to that, and what a fielded hero from his series of books answers (encounter-script.js extras).
function strangerSteps(s, id) {
  const lines = s.run && ENCOUNTER_SCRIPT[s.mapIndex]?.extras?.[id];
  if (!lines?.enter) return;
  log(s, 'story', lines.enter, DETAILS[id].name);
  const other = lines.reply && find(s, refId(s.mapIndex, { boss: 'master', mini: 'lieutenant' }[lines.reply.who] || lines.reply.who));
  if (other && living(other)) log(s, 'story', lines.reply.text, unitDetails(other).name);
  for (const u of party(s))
    if (living(u) && lines.heroes?.[u.id]) log(s, 'story', lines.heroes[u.id], DETAILS[u.id].name);
}
// One round ahead of a wave: the log says who comes next round and from where.
function announce(s) {
  for (const w of boardOf(s).waves) {
    if (waveDue(s, w) !== s.round + 1) continue;
    const defs = w.pieces.filter((p) => !entered(s, p.id));
    // A half-health wave that fired during the enemy phase just ended has said this already.
    if (w.when.halved && s.logs.some((l) => l.who === '敵援' && l.round === s.round - 1 && l.text.endsWith(fireLine(s, w))))
      continue;
    if (defs.length) {
      // 求敗 sets a stone down: the sound comes a round before the person.
      if (s.run) log(s, 'story', MAZE_TALE.clack, QIUBAI.name);
      log(s, 'system', '下一回合，' + waveList(defs) + '自' + w.place + '入場。', '敵援');
    }
  }
}
const fireLine = (s, w) =>
  '第' + NUMERALS[waveDue(s, w) - 1] + '回合，' + waveList(w.pieces.filter((p) => !entered(s, p.id))) + '自' + w.place + '入場。';
// A master marked at half calls the half-health waves that wait on him, if no master they wait
// on was at half before: due two rounds on. A wave that could no longer enter is not called.
function fireHalved(s, id) {
  for (const w of boardOf(s).waves) {
    const ids = triggerIds(s, w);
    if (!ids.includes(id) || waveDue(s, w) != null) continue;
    if (ids.some((other) => other !== id && s.units.find((v) => v.id === other)?.halved)) continue;
    if (s.round + 2 > LIMIT || !s.arrivals) continue;
    s.arrivals[w.id] = s.round + 2;
    const name = unitDetails(find(s, id)).name;
    // 求敗 answers a stone in danger.
    if (s.run) log(s, 'story', MAZE_TALE.clackSave, QIUBAI.name);
    log(s, 'system', name + '氣血過半。' + fireLine(s, w), '敵援');
  }
}
// 變招 (§7.4): the first time the board's master falls to half 氣血, its `phase` changes it for
// the rest of the board. Its numbers go onto the unit itself (so a save keeps them, and the danger
// zone, which reads step and reach, redraws); its cadence, preference and hold are read through
// traitsOf once `phased` is set. The phase's own line is logged for the player; a master with no
// phase changes nothing and says nothing.
function shiftPhase(s, u) {
  const p = unitDetails(u)?.traits?.phase;
  if (!p || u.phased || !living(u)) return;
  u.phased = true;
  for (const k of ['atk', 'def', 'step', 'range']) u[k] += p[k] || 0;
  if (p.brace) u.brace = true;
  // 遁走: the flight covers its next `turns` actions, so from this round if it has yet to act.
  if (p.flee) u.fleeThrough = s.round + p.flee.turns - (s.phase === 'enemy' && u.acted ? 0 : 1);
  log(s, 'combat', p.log || '', unitDetails(u).name);
}
function restOnHerbs(s, units) {
  for (const u of units.filter(living)) {
    const herb = tileInfo(u.x, u.y, s.mapIndex).heal || 0;
    // 遁走: a fleeing master on herbs recovers its flight's share of its greatest 氣血.
    const share = herb && fleeing(s, u) ? Math.round(unitDetails(u).traits.phase.flee.herbs * u.maxHp) : 0;
    const healed = Math.min(u.maxHp - u.hp, healAmount(u, share || herb));
    if (healed <= 0) continue;
    u.hp += healed;
    if (ally(u)) s.stats.healed += healed;
    log(s, 'terrain', '在藥草地調息，回復 ' + healed + ' 點氣血。', unitDetails(u).name);
  }
}
function startEnemy(s) {
  if (s.phase !== 'ally' || s.result || (s.run?.scene && s.run.scene !== 'fight') || s.run?.deploying)
    return false;
  if (s.run) s.run.formationOpen = false;
  for (const u of party(s).filter(living)) {
    holdObjective(s, u);
    commitSteps(u);
    const recovery = Math.min(u.maxHp - u.hp, healAmount(u, commandBonus(s, u, 'renew')));
    if (recovery) {
      u.hp += recovery;
      s.stats.healed += recovery;
      progress(find(s, s.leader), 'heals', recovery);
      log(s, 'combat', '綠竹清音回復 ' + recovery + ' 點氣血。', unitDetails(u).name);
    }
  }
  restOnHerbs(s, party(s));
  s.phase = 'enemy';
  for (const e of enemies(s)) {
    e.acted = false;
    e.moved = false;
  }
  for (const u of party(s)) u.origin = null;
  log(s, 'system', '守關敵軍開始行動。', '敵方回合');
  return true;
}
// 挑釁: the taunting heroes enemy u is bound to strike this turn — each one whose radius u starts
// its action within and whom it can strike from a tile it can stand on (`cells`, with `range`).
function taunters(s, u, cells = null, range = strikeReach(s, u)) {
  if (u.conditions?.daze) return []; // 失神: it will not act at all
  cells ??= [u, ...Array.from(reachable(s, u).keys(), (k) => fromKey(k))];
  return party(s).filter(
    (t) =>
      living(t) &&
      t.conditions?.taunt &&
      distance(u, t) <= t.conditions.taunt.power &&
      cells.some((c) => distance(c, t) <= range)
  );
}
// How little an enemy wants to strike hero t: lower is the better target. A hero under 卸勁 counts
// his 氣血 as the cut makes it last. A covered hero is scored as the one who would take the blow.
function aimCost(s, u, t, friends, walk) {
  const lean = preference(s, u, t, friends, walk); // 偏好: whom this villain looks for
  t = coverer(s, t) || t;
  const hp = t.hp / (1 - stanceCut(s, t) / 100);
  if (!(s.run?.stage >= 6)) return hp * 0.6 + wariness(s, u, t) + lean;
  const protectedByAlly = friends.some((v) => v !== t && distance(v, t) === 1);
  const cover = tileInfo(t.x, t.y, s.mapIndex).defense > 0;
  const exposedLeader = t.id === s.leader && !protectedByAlly && !cover;
  const vitality = hp + (t.conditions?.shield?.power || 0);
  return (
    vitality * 0.28 +
    (35 * vitality) / t.maxHp -
    (exposedLeader ? 28 : 0) +
    wariness(s, u, t) +
    lean
  );
}
// How little an enemy wants to strike an object the heroes keep, on aimCost's scale: its 氣血, less
// the object's lure, and less again for a blow that would break it. Taunts and preferences are for
// heroes; an object neither dodges nor turns a blow back.
function objectCost(s, u, t) {
  const raw = damage(u, t, false, s.mapIndex, s),
    art = strikingSignature(s, u);
  const blow = art ? Math.round(raw * art.factor) : raw;
  // The same scale as a hero's cost at this stage (aimCost), without the hero's terms.
  const base = s.run?.stage >= 6 ? t.hp * 0.28 + (35 * t.hp) / t.maxHp : t.hp * 0.6;
  return base - objectLure(t) - (blow >= t.hp ? 200 : 0);
}
const objectLure = (t) => BOARD_OBJECTS[pieceKey(t)]?.lure || 0;
// 偏好 (§7.5): the term a villain's preference adds to the cost of striking hero t (lower is
// wanted more), at every stage; it is read for the hero chosen, before any 代受 moves the blow.
// `walk` is the walk this villain still needs to strike t from where it stands.
function preference(s, u, t, friends, walk = 20) {
  switch (traitsOf(u).prefers) {
    case 'wounded':
      return -40 * (1 - t.hp / t.maxHp);
    case 'isolated':
      return friends.some((v) => v !== t && living(v) && distance(v, t) === 1) ? 0 : -30;
    case 'leader':
      return t.id === s.leader ? -40 : 0;
    case 'healer':
      return equippedArts(t).some((id) => isSupport(artFor(t, id)) && artFor(t, id).heal) ? -40 : 0;
    case 'mp':
      return -0.5 * t.mp;
    case 'nearest':
      return -8 * (20 - Math.min(20, walk));
    default:
      return 0;
  }
}
// What an enemy holds against striking hero t beyond his 氣血: under 閃身 the blow is wasted, and
// a 挪移 ward would turn up to half of it back.
function wariness(s, u, t) {
  let cost = t.conditions?.evade ? 200 : 0;
  const ward = redirectOf(s, t);
  if (ward) {
    const art = strikingSignature(s, u),
      raw = damage(u, t, false, s.mapIndex, s);
    cost += Math.min(ward.cap, (art ? Math.round(raw * art.factor) : raw) / 2) * 1.5;
  }
  return cost;
}
function enemyAct(s, u) {
  if (s.phase !== 'enemy' || s.result || ally(u) || !living(u) || u.acted) return [];
  const effects = enemyAction(s, u);
  noteStanding(s, u); // where it ended: a wave piece over the line, a fleeing master on herbs
  return effects;
}
function enemyAction(s, u) {
  if (u.conditions?.daze) return loseAction(s, u); // 失神: the action is lost, not the reflexes
  const step = stat(u, 'step', s); // as the action begins, before any formation it walks onto
  const friends = party(s).filter(living);
  const field = availableField(s, u);
  const all = walkCells(s, u, field);
  // 坐鎮, and a 蓄勢反擊 that holds: where this piece may end its action.
  const cells = standCells(s, u, all);
  // 續命: a due mend restores a hurt companion in its reach instead of striking.
  const mend = mendPlan(s, u, cells);
  if (mend) return mendAct(s, u, field, mend);
  let best = null;
  const range = strikeReach(s, u);
  const lineDue = !!lineKind(strikingSignature(s, u));
  const crowded = traitsOf(u).crowded;
  // 守: the objects the heroes keep are targets as well as the heroes.
  const kept = props(s).filter((v) => living(v) && hostile(u, v));
  const approach = new Map(
    [...friends, ...kept].map((target) => {
      const positions = fieldCells(s.mapIndex).filter((cell) => {
        const occ = at(s, cell.x, cell.y);
        return (
          walkable(cell.x, cell.y, s.mapIndex) &&
          (!occ || occ === u) &&
          distance(cell, target) <= range
        );
      });
      return [target.id, movementField(s, u, positions, Infinity, true).costs];
    })
  );
  const targetCost = new Map([
    ...friends.map((t) => [
      t.id,
      aimCost(s, u, t, friends, approach.get(t.id).get(key(u.x, u.y)) ?? Infinity)
    ]),
    ...kept.map((t) => [t.id, objectCost(s, u, t)])
  ]);
  // 挑釁: a taunter it can strike this turn is all it may choose from.
  const bound = taunters(s, u, cells, range),
    prey = bound.length ? bound : [...friends, ...kept];
  for (const c of cells)
    for (const t of prey) {
      const d = distance(c, t),
        can = d <= range,
        score =
          (can ? 1000 - targetCost.get(t.id) : 0) -
          (can ? 0 : (approach.get(t.id).get(key(c.x, c.y)) ?? fieldCells(s.mapIndex).length + d)) *
            40 -
          c.n * 2 +
          tileInfo(c.x, c.y, s.mapIndex).defense * 0.4 +
          // 穿行: a line signature looks for a tile with a second hero straight behind its mark.
          (can && lineDue && lineVictim(s, c, t) ? 30 : 0) -
          // 近身失準: it would rather strike from beyond its weak distance.
          (can && crowded && d <= crowded.within ? crowded.atk * 4 : 0) +
          // 守: the 戰意 is aimed at a kept object, so the walk is drawn to it: it counts as nearer
          // by its `pull` in steps (a step weighs 40 here).
          (!can && isProp(t) ? (BOARD_OBJECTS[pieceKey(t)]?.pull || 0) * 40 : 0);
      if (!best || score > best.score) best = { c, t, can, score };
    }
  u.acted = true;
  if (!best) return [];
  // 坐鎮: a held piece with no one to strike from its ground walks back toward its post.
  const hold = !best.can && holdOf(s, u);
  if (hold) best.c = homeward(s, u, all, hold);
  u.moved = distance(u, best.c) > 0;
  if (u.moved) followRoute(u, tracePath(field, best.c));
  if (!best.can) {
    if (fleeing(s, u)) log(s, 'move', '退向藥草地。', unitDetails(u).name);
    else if (!hold) log(s, 'move', '逼近我方陣地。', unitDetails(u).name);
    else if (u.moved) log(s, 'move', '退回崗位。', unitDetails(u).name);
    return [];
  }
  wakePost(s, u, false); // 坐鎮: a piece that wakes on striking leaves its post for good
  // 代受: the piece it chose may have someone beside it who takes the blow instead.
  const t = isProp(best.t) ? best.t : takeCover(s, best.t);
  if (t.conditions?.taunt) progress(t, 'protects', 1); // 挑釁: the blow he drew
  const art = strikingSignature(s, u);
  const raw = damage(u, t, false, s.mapIndex, s);
  const strikePower = art ? Math.round(raw * art.factor) : raw;
  const blow = received(s, t, [strikePower]);
  const n = wound(s, t, blow.hits[0], u);
  // 還報 counts only 氣血 an enemy's own action took, never what a shield caught.
  if (n) t.hurtRound = s.round;
  const effects = [[t.id, '−' + n]];
  effects.signature = !!art; // for the board: a signature blow or a plain one
  const attack = art?.name || basicFor(u).name;
  log(
    s,
    'combat',
    '以「' + attack + '」擊中' + unitDetails(t).name + '，造成 ' + n + ' 點傷害。',
    unitDetails(u).name
  );
  // 閃身 is used up by the blow it made miss; 挪移 turns its share back on the striker.
  if (blow.evaded) dodge(s, t, effects);
  if (blow.ward) turnBack(s, u, t, blow, effects);
  if (art) {
    u.signatureRound = s.round;
    if (u.signaturePush) u.signaturePush = 0;
    if (art.style === 'sweep') {
      // The share its chips take is the signature's own (a quarter unless it says otherwise).
      for (const other of friends.filter((v) => v !== t && living(v) && distance(v, t) === 1)) {
        const chip = wound(
          s,
          other,
          afterCut(Math.max(1, Math.round(strikePower * art.sweep)), stanceCut(s, other)),
          u
        );
        if (chip) other.hurtRound = s.round;
        effects.push([other.id, '−' + chip]);
        log(s, 'combat', '被餘勁掃中，損失 ' + chip + ' 點氣血。', unitDetails(other).name);
      }
    } else if (living(t) && !blow.void && !isProp(t)) {
      if (art.style === 'drain') t.mp = Math.max(0, t.mp - art.power);
      else if (art.style !== 'line')
        applyCondition(s, t, { kind: art.style, power: art.power, turns: art.turns }, u);
      // The signature's rider: 內傷 or 絆足 as well.
      if (art.extra === 'wound') applyCondition(s, t, { kind: 'wound', power: 5, turns: 2 }, u);
      if (art.extra === 'pin') applyCondition(s, t, { kind: 'pin', power: 2, turns: 2 }, u);
      log(s, 'combat', art.note, unitDetails(u).name);
    }
    if (lineKind(art)) lineThrough(s, u, t, strikePower, effects); // 穿行
  } else if (living(t) && !blow.void && !isProp(t)) basicPoison(s, u, t, effects); // 蛇毒
  reflectStrike(s, t, u, n, effects);
  if (barbsOf(t) && !blow.void && distance(u, t) === 1)
    barbStrike(s, t, u, afterWard(barbsOf(t), wardPercent(s, u)), effects); // 反刺
  const share = isProp(t) ? 0 : counterRatio(s, t);
  if (!living(t) && !isProp(t)) log(s, 'combat', '負傷退場。', unitDetails(t).name);
  else if (
    living(u) &&
    !blow.silent &&
    !t.conditions?.seal &&
    distance(u, t) <= reach(s, t) &&
    share
  ) {
    const power = Math.max(2, Math.round(damage(t, u, false, s.mapIndex, s) * share));
    const hit = blowing({ how: 'counter' }, () =>
      wound(s, u, afterCut(afterWard(power, wardPercent(s, u)), stanceCut(s, u)), t)
    );
    effects.push([u.id, '−' + hit]);
    log(s, 'combat', '還擊，造成 ' + hit + ' 點傷害。', unitDetails(t).name);
    exp(s, t, living(u) ? 12 : 35);
  }
  woundSelfLoss(s, u, effects); // 內傷: the attacker pays once the exchange is over
  // 游擊: having struck, it walks off with what steps it has left.
  if (unitDetails(u)?.traits?.glide) glideAway(s, u, best.c.n, step);
  check(s);
  return effects;
}
// 續命 (§7.9): when its mend is due, the companion (itself included) it will restore — the lowest
// share of 氣血 below seven tenths among those it can stand within three tiles of — and the tile
// it restores from: out of the heroes' reach if it can be, then as far from them as it can, then
// the fewest steps. Null when no one is hurt enough: it strikes plainly and keeps the charge.
function mendPlan(s, u, cells) {
  const sig = signatureDue(s, u) ? enemyTechnique(u, s) : null;
  if (sig?.style !== 'mend') return null;
  let best = null;
  for (const v of enemies(s)) {
    if (!living(v) || v.hp >= v.maxHp * 0.7) continue;
    const near = cells.filter((c) => v === u || distance(c, v) <= 3);
    if (near.length && (!best || v.hp / v.maxHp < best.v.hp / best.v.maxHp)) best = { v, near };
  }
  if (!best) return null;
  const heroes = party(s).filter(living);
  const threat = (c) => heroes.some((h) => distance(c, h) <= stat(h, 'step', s) + heroReach(h));
  const gap = (c) => Math.min(99, ...heroes.map((h) => distance(c, h)));
  const rank = (c) => [threat(c) ? 1 : 0, -gap(c), c.n];
  const better = (a, b) => {
    const [x, y] = [rank(a), rank(b)];
    return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
  };
  const c = best.near.reduce((a, b) => (better(b, a) < 0 ? b : a));
  return { patient: best.v, c, heal: sig.heal, name: sig.name };
}
// How far a hero can strike from where he stands: his weapon, or his longest enemy-aimed art.
function heroReach(h) {
  return Math.max(
    reach(null, h),
    ...equippedArts(h)
      .map((id) => artFor(h, id))
      .filter((a) => targetType(a) === 'enemy')
      .map((a) => a.range ?? 1)
  );
}
// The mend itself: it walks to its tile, restores the patient (halved by 內傷) and does not
// strike; the signature is spent.
function mendAct(s, u, field, { patient, c, heal, name }) {
  u.acted = true;
  u.moved = distance(u, c) > 0;
  if (u.moved) followRoute(u, tracePath(field, c));
  const n = Math.min(patient.maxHp - patient.hp, healAmount(patient, heal));
  patient.hp += n;
  noteFired(s, 'mend');
  u.signatureRound = s.round;
  if (u.signaturePush) u.signaturePush = 0;
  log(s, 'combat', '施展「' + name + '」，替' + unitDetails(patient).name + '接骨續筋。', unitDetails(u).name);
  log(s, 'combat', '回復 ' + n + ' 點氣血。', unitDetails(patient).name);
  const effects = [[patient.id, '+' + n]];
  effects.signature = true;
  return effects;
}
// 遁走 (§7.4): while a phase's flight lasts (its turns, from the round it fired) and the master
// is still below `until` of its 氣血, it heads for the nearest herbs no one else stands on.
function fleeing(s, u) {
  const flee = unitDetails(u)?.traits?.phase?.flee;
  return !!flee && u.fleeThrough >= s.round && u.hp < flee.until * u.maxHp;
}
// Where a fleeing master's walk this turn ends: the tile it can reach that leaves the least walk
// to the nearest free herb tile (then the fewest steps). Null if it is not fleeing, or if every
// herb tile is taken or out of reach: then it fights where it stands as any piece would.
function fleeStep(s, u, all) {
  if (!fleeing(s, u)) return null;
  const route = movementField(s, u, [u]).costs;
  let herb = null;
  for (const c of fieldCells(s.mapIndex)) {
    const occupant = at(s, c.x, c.y);
    if (!tileInfo(c.x, c.y, s.mapIndex)?.heal || (occupant && occupant !== u)) continue;
    const n = route.get(key(c.x, c.y)) ?? (c.x === u.x && c.y === u.y ? 0 : Infinity);
    if (n < Infinity && (!herb || n < herb.n)) herb = { ...c, n };
  }
  if (!herb) return null;
  const back = movementField(s, u, [herb], Infinity, true).costs;
  const left = (c) => (c.x === herb.x && c.y === herb.y ? 0 : back.get(key(c.x, c.y)) ?? Infinity);
  return all.reduce((a, c) => (left(c) < left(a) || (left(c) === left(a) && c.n < a.n) ? c : a));
}
// The signature an enemy strikes with this turn, if it is due and is a blow at all (a mend or a
// mirror is not: on its turn such a villain makes its plain strike).
function strikingSignature(s, u) {
  const art = signatureDue(s, u) ? enemyTechnique(u, s) : null;
  return art?.strikes ? art : null;
}
const lineKind = (art) =>
  !art ? null : art.style === 'line' ? 'line' : art.extra === 'line' ? 'extra:line' : null;
// 穿行 (§7.2): the hero a line signature goes on to — the first within two tiles behind its mark,
// straight on from where the striker stands along their shared row or column. Ground that cannot
// be walked stops it; a striker not in line with its mark sends nothing through.
function lineVictim(s, from, t) {
  const dx = Math.sign(t.x - from.x),
    dy = Math.sign(t.y - from.y);
  if (dx && dy) return null;
  for (let i = 1; i <= 2; i++) {
    const p = { x: t.x + dx * i, y: t.y + dy * i };
    if (!walkable(p.x, p.y, s.mapIndex)) return null;
    const v = at(s, p.x, p.y);
    if (v && ally(v)) return v;
  }
  return null;
}
// The second hero takes half the blow: a pass-through, so no 代受, 閃身 or 挪移 meets it, but his
// 卸勁 and shield do.
function lineThrough(s, u, t, strikePower, effects) {
  const v = lineVictim(s, u, t);
  if (!v) return;
  const n = wound(s, v, afterCut(Math.max(1, Math.round(strikePower * 0.5)), stanceCut(s, v)), u);
  if (n) v.hurtRound = s.round;
  effects.push([v.id, '−' + n]);
  log(s, 'combat', '被穿透的勁力擊中，損失 ' + n + ' 點氣血。', unitDetails(v).name);
}
// 蛇毒 (§7.2): a piece with `basicPoison` poisons with its plain strike, stronger by half the stage.
function basicPoison(s, u, t, effects) {
  const venom = traitsOf(u).basicPoison;
  if (!venom) return;
  const power = venom.power + Math.floor((s.run?.stage || 0) / 2);
  putEffects(s, u, t, [{ kind: 'poison', power, turns: venom.turns || 2 }], effects);
}
// 游擊: a villain with `glide: n` walks, after its blow, up to n of the steps it has left (out of
// `step`, its step as the action began) to the free tile farthest from the nearest hero (then the
// fewer steps, then the better cover). The walk draws no counter. A walk that ended on a 布陣
// tile has stopped there and does not go on.
function glideAway(s, u, walked, step) {
  const heroes = party(s).filter(living),
    budget = Math.min(unitDetails(u).traits.glide, step - walked);
  if (!living(u) || !heroes.length || budget <= 0 || (walked > 0 && zoneHalts(s, u, u))) return;
  const field = movementField(s, u, [u], budget);
  const gap = (p) => Math.min(...heroes.map((h) => distance(p, h)));
  const cover = (p) => tileInfo(p.x, p.y, s.mapIndex).defense || 0;
  let best = { x: u.x, y: u.y, n: 0 };
  for (const [k, n] of field.costs) {
    const p = { ...fromKey(k), n };
    if (at(s, p.x, p.y)) continue;
    if ((gap(p) - gap(best) || best.n - n || cover(p) - cover(best)) > 0) best = p;
  }
  if (!best.n) return;
  const path = tracePath(field, best);
  // One route for the turn, so the walk in and the walk off play as one.
  followRoute(u, u.moved && u.route?.length ? [...u.route, ...path.slice(1)] : path);
  u.moved = true;
  log(s, 'move', '出手後退開 ' + best.n + ' 步。', unitDetails(u).name);
}
function nextRound(s) {
  if (s.result || s.phase !== 'enemy' || enemies(s).some((e) => living(e) && !e.acted))
    return false;
  for (const u of s.units) {
    if (!living(u)) {
      delete u.conditions;
      continue;
    }
    const poison = u.conditions?.poison;
    if (poison) {
      const amount = blowing({ how: 'poison' }, () =>
        wound(s, u, afterWard(poison.power, wardPercent(s, u)), find(s, poison.source))
      );
      log(s, 'combat', '毒發，損失 ' + amount + ' 點氣血。', unitDetails(u).name);
    }
    for (const [kind, condition] of Object.entries(u.conditions || {}))
      if (condition.through <= s.round) delete u.conditions[kind];
  }
  expireZones(s); // 布陣 ends with the enemy phase after the one it was laid before
  check(s);
  if (s.result) return false;
  restOnHerbs(s, enemies(s));
  s.round++;
  s.phase = 'ally';
  arrive(s); // reinforcements due this round enter before the heroes move
  announce(s); // and those due next round are named
  check(s);
  if (s.result) return false;
  for (const u of party(s).filter(living)) {
    u.moved = false;
    u.acted = false;
    u.origin = null;
    u.brace = false;
    delete u.walked;
    delete u.glideLeft;
    u.mp = Math.min(u.maxMp, u.mp + 6 + commandBonus(s, u, 'restoreMp'));
  }
  s.selected = leader(s);
  log(s, 'system', '俠客重整步法，內力各回復 6 點。', '我方回合');
  const boon = COMMANDS[s.leader];
  if (boon?.stat === 'restoreMp' && s.run?.status === 'battle')
    log(
      s,
      'combat',
      boon.name + '：領隊與兩格內友軍額外回復 ' + boon.power + ' 點內力。',
      DETAILS[s.leader].name
    );
  return true;
}

export { isProp, propKind, props, hostile, boardKind, propUnit, propUnits, holdLeft, brokenKeep, OBJECT_NOTE, announcedWaves, refKey, pieceLines, traitEdge, stanceHolds, KIND_RULES, objectiveLeft, winsIfFalls, wavesLeft, scheduleWaves, waveList, entryTile, arrivalGhosts, pendingWaves, arrive, announce, blankTally, inZone, SLOTS, NUMERALS, slotId, refId, pieceKey, LEGACY_BOARD, boardOf, masterIds, pieceDef, homeTile, stageRows, pieceUnit, boardLines, fleeing, mendPlan, lineVictim, wardShare, preference, traitsOf, holdOf, postTile, standCells, walkCells, signatureLines, strikeReachWhenDue, SIZE, FIELD_EDITION, LIMIT, GROWTH, ORIGINAL_PARTY, PARTY, BOOKS, leader, key, distance, living, ally, at, find, party, company, commanderId, enemies, canAct, canPrepare, managesCompany, valid, terrainInfo, terrain, cover, walkable, ITEMS, TALENTS, DETAILS, encounterKeys, identifyEncounter, withMods, unitDetails, enemyTechnique, roundsToSignature, signatureDue, siphonPlan, reach, zoneAt, zoneTiles, layZone, standingLines, strikeReach, counterRatio, stanceCut, coverer, redirectOf, taunters, canGlide, glideField, glideMove, stopGlide, enemyTraitLines, STORIES, chapterScenes, makeUnit, startingHero, newGame, fitFormation, restoreGame, log, stat, artFor, rangeFor, commandDiscount, cost, artCost, basicFor, equippedArts, targetType, artReady, canPay, isSupport, canConfigure, reachable, movementPath, routeConnects, canMove, move, undo, affectedFriends, targetOK, PARTNERS, strikeFactor, priceNotes, guardNotes, attackPower, damage, healingPower, healing, healAmount, woundSelfLoss, formsFor, pushCell, wardEscorts, forecast, raiseLevel, settleExperience, exp, objectiveTile, unclaimedObjectiveTile, holdObjective, resolve, waitUnit, canUseMedicine, consume, equip, transferEquipment, train, check, startEnemy, enemyAct, nextRound, medicineFor };
