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
  GARRISONS,
  STATUS_POWER,
  SIGNATURE_RULES,
  VILLAIN_FORMS,
  VILLAINS,
  TROOPS,
  ARM_NAMES,
  ARM_OF
} from '../data/encounters.js';
import { BATTLES, FINAL_MAP, LAST_MAP } from '../data/battles.js';
import { BOARD_OBJECTS } from '../data/board-objects.js';
import { NEW_HEROES } from '../data/new-heroes.js';
import { inRealm } from '../data/realms.js';
import { rosterPortrait } from '../data/roster-art.js';
import {
  COMMANDS,
  HELD_KINDS,
  LINGER_KINDS,
  commandBonus,
  commandAura,
  leaderBoon,
  prepPost,
  effectsOf,
  selfEffectsOf,
  applyCondition,
  CONDITION_NAMES,
  progress,
  poisonLayers,
  grownPoison,
  grownEffects
} from './battle-mastery.js';
import { FIELD_SIZE, fieldCells, mapLayout, validTile, tileInfo } from '../data/terrain.js';
import { TECHNIQUES, WARES, CAPTAINS } from '../data/martial-arts.js';
import { CHAMBER_TALES, MAZE_TALE, QIUBAI, YOUTH, acrossTable, shade } from '../data/maze-tale.js';
import { ENCOUNTER_SCRIPT } from '../data/encounter-script.js';
const SIZE = FIELD_SIZE;
const FIELD_EDITION = 1;
// Rounds a board runs to, unless its entry in battles.js sets `rounds` (無刻漏臺: 15).
const LIMIT = 12;
const MAX_ROUNDS = Math.max(LIMIT, ...BATTLES.map((b) => b.rounds || 0));
const roundLimit = (s) => BATTLES[s?.mapIndex]?.rounds || LIMIT;
// Round and board numbers as the text says them; rounds run to MAX_ROUNDS.
const NUMERALS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五'];
const ORIGINAL_PARTY = ['hero', 'medic', 'guard'];
const PARTY = [...ORIGINAL_PARTY, 'guo', 'xiao', 'duan', ...Object.keys(NEW_HEROES)];
// The youth as a piece: 無名 takes the field himself on the last board, and from the first board of
// every run once the ending has been seen. He is never in the box the heroes are drawn from.
const YOUTH_ID = 'youth';
// Everyone who can be a white stone.
const ROSTER = [...PARTY, YOUTH_ID];
const BOOKS = {
  ...Object.fromEntries(Object.entries(NEW_HEROES).map(([id, h]) => [id, h.book])),
  hero: '笑傲江湖',
  medic: '笑傲江湖',
  guard: '笑傲江湖',
  guo: '射鵰英雄傳、神鵰俠侶',
  xiao: '神鵰俠侶',
  duan: '天龍八部',
  // He is from no book the heroes or the black stones know.
  youth: '一念江湖'
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
// The piece a board's text names as its master: its own on the last board (battles.js).
const commanderId = (s) => (s.run ? BATTLES[s.mapIndex]?.commander || CAPTAINS[s.mapIndex][0] : 'chief');
const enemies = (s) => s.units.filter((u) => u.side === 'enemy');
// Board objects (board-objects.js, battles.js `objects`) are units of side 'prop': on the board,
// with 氣血, taking no turn, and neither the heroes' nor the black stones'.
const isProp = (u) => u?.side === 'prop';
const propKind = (u) => (isProp(u) ? BOARD_OBJECTS[u.encounterId || u.id]?.kind || null : null);
const props = (s) => (s?.units || []).filter(isProp);
// 受制: a black stone charmed by a hero's art fights for the heroes until it wears off. It stays an
// enemy for every count (殲滅 still needs it down), but it is no one's target and walks with the
// heroes' side; `sideOf` is the side it acts for now.
const charmed = (u) => !!u?.conditions?.charm && u.hp > 0;
const sideOf = (u) => (charmed(u) ? 'ally' : u?.side);
// Whether u may strike t: a piece of the other side, or a board object u's side is there to break
// (a hero, a 'break' object; a black stone, a 'keep' one). An object strikes no one.
function hostile(u, t) {
  if (!u || !t || isProp(u)) return false;
  if (isProp(t)) return propKind(t) === (ally(u) ? 'break' : 'keep');
  return sideOf(t) !== sideOf(u);
}
// 金剛: a direct attack of any kind takes nothing off its holder and puts nothing on him.
const immuneTo = (v) => !!v?.conditions?.immune;
// 無劍: whether v is in a stage only one hero can hurt him in (`solo`), and u is not that hero. Blows,
// counters, splash and poison from anyone else take nothing off him.
function untouched(u, v) {
  const st = stageOf(v);
  return !!st?.solo && !!u && u.id !== st.solo;
}
// Whether an enemy will strike no hero on its coming turn: 定身 and 閉穴 keep its hand
// still, and under 受制 it strikes its own side. The danger zone and 挑釁 leave such a piece out.
function holdsFire(u) {
  const c = u?.conditions || {};
  return !!(c.freeze || c.mute || c.charm);
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
// Gear is put on, taken off and handed over, and manuals given, only in 整備 (and the shop's team
// page), never in battle; in battle only medicine is used (the producer, 2026-11-25).
const canOutfit = (s, u) => (s.run ? managesCompany(s) && !!u && company(s).includes(u) : canPrepare(s, u));
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
    atk: 9,
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
    atk: 7,
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
  // 利劍, the first sword of the tomb: 無名 draws it from its rock on the last board.
  keenSword: {
    name: '利劍',
    kind: 'weapon',
    owner: 'youth',
    atk: 6,
    icon: 'sword',
    desc: '凌厲剛猛，無堅不摧。求敗弱冠之前所用，插在棋枰一角的石上。'
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
    atk: 4,
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
    bio: '華山大弟子灑脫重義，曾在思過崖得風清揚授劍。如今帶著一身濕氣入局，手裡只餘華山與石壁劍招；有進無退的九劍，須在局中逐式想回。',
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
    bio: '日月神教聖姑精通琴簫，曾在洛陽綠竹巷替令狐冲奏琴療傷，以一卷曲譜結緣。如今手裡只留短劍與清心普善咒，合奏的那一曲須待最後才想得全。',
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
    bio: '任我行的親信，江湖稱「天王老子」，曾同令狐冲並肩脫險，自此肝膽相照。入局雙腕仍帶鐐銬，只記得鐵鞭與卸力入地的粗淺功夫。',
    basic: '鐵鞭橫江',
    skill: '吸功入地小法',
    skillIcon: 'spark',
    skillDesc: '卸去相鄰敵人的來勁並還擊，此擊免受還擊；至下回合自身防禦增加 10 點。',
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
    bio: '自幼長於漠北，得洪七公傳掌，後來久守襄陽；聽見有人呼救，便非去不可。入局只餘江南七位恩師教的掌法、分筋錯骨手，降龍十八掌得從頭想起。',
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
    bio: '古墓傳人，性冷話少。入局只記得天羅地網勢，一人分使兩劍的本事還在後頭，須逐步想起。',
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
    bio: '大理段氏的書獃公子，把這番奇遇當作白日夢，見人仍不忘作揖。手中只餘無量山洞所得的北冥神功，六脈神劍忽靈忽不靈，須逐脈想回。',
    basic: '點指截脈',
    skill: '北冥神功',
    skillIcon: 'drop',
    skillDesc: '貼身以北冥神功化去敵勁，此擊免受還擊；吸取 8 點內力，並使其絕技延後一回合。',
    skillRange: 1,
    cost: 6
  },
  // 無名, the youth who holds the stones (maze-tale.js YOUTH), as a piece. His portrait is the one
  // his lines have always worn.
  youth: {
    name: '無名',
    role: '執子之人',
    school: '無門無派',
    mini: 'youth',
    portrait: 'youth',
    portraitFile: 'npc-youth.webp',
    epithet: '入夢少年',
    book: '一念江湖',
    bio: '鄉間少年一覺醒在谷底棋臺邊，忘了本名，便自稱無名。雖無半點功夫，卻在盤外看過千百局、千年招數。及至上盤，並無哪招得自師授，只看對手兵刃，手中劍便尋向空處。',
    basic: '直刺',
    // 總訣式 is the art 令狐冲 learns as a node: one art, one effect, whoever has it.
    skill: TECHNIQUES.ninefoldFormula.name,
    skillIcon: 'sword',
    skillDesc: TECHNIQUES.ninefoldFormula.desc,
    skillRange: TECHNIQUES.ninefoldFormula.range,
    cost: TECHNIQUES.ninefoldFormula.mp
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
    role: '局主',
    portraitFile: 'captain-' + index + '.webp',
    rank: 'boss'
  };
  // A board built round one villain has no lieutenant (GARRISONS).
  if (second)
    DETAILS['lieutenant-' + index] = {
      ...second,
      role: '副手',
      portraitFile: 'lieutenant-' + index + '.webp',
      rank: 'mini'
    };
}
// The DETAILS keys of a board's four enemies, in the order of its layout's spawn tiles.
// The last board has no fixed four: every piece on it is named in battles.js.
const hasFour = (map) => !BATTLES[map]?.last;
// On a board built round one villain the other three are his troop type.
function encounterKeys(map) {
  if (!hasFour(map)) return [];
  const troop = GARRISONS[map];
  return troop
    ? [CAPTAINS[map][0], troop, troop, troop]
    : [CAPTAINS[map][0], 'lieutenant-' + map, 'bow-' + map, 'scout-' + map];
}
// The fixed seat (0 to 3) an actor id fills on a board, or -1 for an extra piece.
const seatOf = (map, id) => SLOTS.findIndex((slot) => slotId(map, slot) === id);
// The stage row a fixed seat's numbers come from: the seat's own, or its troop type's.
const seatRow = (map, i) => DETAILS[encounterKeys(map)[i]]?.row || SLOTS[i];
// The numbers of a board's fixed four at a stage and 境界, each with its type's mods. The last
// board has no fixed four, so none.
function seatNumbers(map, depth, realm = 1) {
  if (!hasFour(map)) return [];
  const rows = stageRows(map, depth, realm),
    keys = encounterKeys(map);
  return SLOTS.map((_, i) => withMods(rows[seatRow(map, i)], DETAILS[keys[i]]?.traits?.mods));
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
  if (!hasFour(map)) return null;
  const ids = map ? [CAPTAINS[map][0], 'echoBlade', 'echoBow', 'echoScout'] : FOES;
  return ids[SLOTS.indexOf(slot)];
}
// The fixed four a board has, as slots: none on the last board.
const fixedSlots = (map) => (hasFour(map) ? SLOTS : []);
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
// The last board's guests (battles.js `guest: n`): the master of the run's n-th board, on the
// 'guest' row of the last board's numbers. `route` is the run's ten boards in the order met; with
// none (the wiki, a briefing with no run) the boards in their own order stand in.
const DEFAULT_ROUTE = CAPTAINS.map((_, map) => map);
const castCache = new Map();
function castBoard(map, route = DEFAULT_ROUTE) {
  const board = BATTLES[map];
  if (!board?.last) return board;
  const key = map + ':' + route.join(',');
  if (!castCache.has(key)) {
    const cast = (piece) =>
      piece.guest == null ? piece : { ...piece, id: CAPTAINS[route[piece.guest] ?? DEFAULT_ROUTE[piece.guest]][0], row: 'guest' };
    castCache.set(key, {
      ...board,
      pieces: board.pieces.map(cast),
      waves: board.waves.map((w) => ({ ...w, pieces: w.pieces.map(cast) }))
    });
  }
  return castCache.get(key);
}
// The board being played. Every board rule reads the board through here.
const boardOf = (s) =>
  !s.run || s.run.legacyBoard ? LEGACY_BOARD : castBoard(s.mapIndex, Array.isArray(s.run.route) ? s.run.route : DEFAULT_ROUTE);
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
  // The last board is met in one 境界 and at one depth only, so its numbers are written as played.
  if (!hasFour(map)) return { ...LAST_ROWS };
  const rows = stageBase(map, depth);
  for (const slot of Object.keys(rows)) rows[slot] = inRealm(rows[slot], realm);
  return rows;
}
// The last board's two rows: 求敗 himself ('master'), and each of the run's ten masters as he
// stands there ('guest'): no 戰意 on him and no men of his own, a good deal less than on his own
// board. A guest's own `mods` still apply. Measured with `node tools/sim-battles.mjs --last`: with
// these the simulated player, who is far weaker than a person, wins about two boards in five in
// some ten rounds at hero level 11 (22%, 39% and 54% at levels 10, 11 and 12, with a company of
// twelve drawn from the twenty heroes), losing about as often by 無名 falling as by the round
// limit. The board is meant to be a challenge (the producer, 2026-11-22: an even chance or less).
// These are the numbers for the board as the producer set it that day: all ten masters come
// (five, then two and three at 求敗's side), they guard him, he falls back, and 無名 is stronger
// (journey.js LAST_BOON). At 求敗 1600 / 60 and each master 260 / 56 the same player won 68%.
// With his five stages (五劍, 2026-11-25; the producer's target: a third to a half) the numbers
// stayed and the stages were tuned instead (encounters.js): 39% over 200 runs, seed 1 (35% and 50%
// at seeds 2 and 3), against 44% before them.
const LAST_ROWS = {
  master: [1700, 64, 28, 3, 2],
  guest: [280, 60, 20, 3, 1]
};
function stageBase(map, depth) {
  if (map === 0 && depth === 0)
    return {
      master: [104, 25, 12, 2, 1],
      // 副手 a step above the men (the producer, 2026-11-26), gently on the tutorial's board.
      lieutenant: [64, 20, 8, 2, 1],
      bow: [48, 18, 5, 2, 3],
      scout: [56, 19, 8, 3, 1]
    };
  const boss = map === FINAL_MAP,
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
    // 副手 (the producer, 2026-11-26): his own art and ways were always a master's man's, but his
    // body was a scout's (the same 防禦, a few more 氣血). Now 氣血 ×1.2 and 防禦 +2, between the
    // men and the master; 攻擊 was already near the master's and stays.
    lieutenant: [
      Math.round((55 + depth * 12 + seasoned * 29) * 1.2),
      19 + veteran * 3 + Math.round(depth * 2.2 + seasoned * 5.4),
      9 + depth,
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
  const row = stageRows(s.mapIndex, s.run?.stage || 0, s.run?.realm)[piece.row || info.row];
  const [hp, atk, def, step, range] = withMods(withMods(row, info.traits?.mods), piece.mods);
  const u = makeUnit(piece.id, 'enemy', piece.at[0], piece.at[1], hp, 0, atk, def, step, range);
  if (piece.id.includes('#')) u.encounterId = key;
  if (entered != null) u.enteredRound = entered;
  // A master away from his own board (the last board's guests) keeps no post there.
  if (piece.row === 'guest') u.guest = true;
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
// The stage a piece's traits scale by: the run's, or for a guest on the last board the stage at
// which this run met his own board, so each master's signature, banner and drain are as strong
// there as they were when the youth first faced him.
function traitStage(s, u) {
  const stage = s?.run?.stage || 0;
  if (!u?.guest || !Array.isArray(s?.run?.route)) return stage;
  const home = s.run.route.indexOf(CAPTAINS.findIndex(([captain]) => captain === u.id));
  return home >= 0 ? home : stage;
}
// A villain whose traits are written uses the stage-scaled status strengths; one without plays
// with the flat numbers of stage 0, as every villain did before the redesign.
function enemyTechnique(u, s) {
  const info = unitDetails(u);
  if (!info?.rank) return null;
  const sig = traitsOf(u).sig || {},
    stage = Object.keys(info.traits || {}).length ? traitStage(s, u) : 0;
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
// The round a signature next comes due, before any 吸勁 push; null for a piece with none.
function signatureNext(s, u) {
  const art = enemyTechnique(u, s);
  if (!art) return null;
  // Counted from the round the piece came onto the board: round 1, or a reinforcement's entry.
  const first = (u.enteredRound ?? 1) + (art.offset > 0 || s.run?.stage >= 5 ? 1 : 2);
  return Number.isInteger(u.signatureRound) ? u.signatureRound + art.cadence : first;
}
function roundsToSignature(s, u) {
  const next = signatureNext(s, u);
  return next === null ? null : Math.max(0, next + (u.signaturePush || 0) - s.round);
}
// The push 吸勁 leaves on a signature: due one round after the round it would come due, or, for a
// charge that has waited past its round (no hero in reach, or held), one round after this one.
function siphonPush(s, u) {
  const push = u.signaturePush || 0,
    next = signatureNext(s, u);
  return next === null ? push + 1 : Math.max(push + 1, s.round + 1 - next);
}
// 截勁, 定身, 閉穴 and 受制 keep a charged signature from firing (and from guarding); it stays charged.
const signatureDue = (s, u) =>
  !!s?.run &&
  !['seal', 'freeze', 'mute', 'charm'].some((k) => u.conditions?.[k]) &&
  roundsToSignature(s, u) === 0;
// 吸勁 (§5): a blow that lands draws 8 內力 back to the striker and puts the target's signature
// back one round, at most once per enemy per round and never two rounds running on a master.
// A blow a shield caught still landed. Read from the strike's forecast `f`, after its 內力 is paid.
function siphonPlan(s, u, t, f) {
  if (!f.forms.includes('siphon') || !f.rawHits.some((n) => n > 0)) return null;
  const mp = Math.min(8, Math.max(0, u.maxMp - (u.mp - f.mpCost))),
    gain = '內力 ＋' + mp;
  if (!s || !enemyTechnique(t, s) || f.amount >= t.hp) return { mp, delay: false, note: gain };
  if (t.lastSiphonRound === s.round) return { mp, delay: false, note: gain + '（本回合已延後過）' };
  if (unitDetails(t).rank === 'boss' && t.lastSiphonRound === s.round - 1)
    return { mp, delay: false, note: gain + '（局主已換氣，未能延後）' };
  return { mp, delay: true, note: gain + '，' + unitDetails(t).name + '絕技延後一回合' };
}
// The target as it stands once 吸勁 has put its signature back: a charged reaction is spent.
const afterSiphon = (s, t, plan) => (plan?.delay ? { ...t, signaturePush: siphonPush(s, t) } : t);
function applySiphon(s, u, t, plan) {
  if (!plan) return;
  u.mp = Math.min(u.maxMp, u.mp + plan.mp);
  if (plan.mp) log(s, 'combat', '吸回 ' + plan.mp + ' 點內力。', unitDetails(u).name);
  if (!plan.delay || !living(t)) return;
  t.signaturePush = siphonPush(s, t);
  t.lastSiphonRound = s.round;
  log(s, 'combat', '勁力被吸，絕技延後一回合。', unitDetails(t).name);
}
// How far a unit strikes and counters. Every test of an enemy's range goes through here, so 纏械
// only has to set its condition.
function reach(s, u) {
  // 軟劍: 求敗's reach in that stage.
  const far = Math.max(u.range, stageOf(u)?.reach || 0);
  return u.conditions?.disarm ? 1 : far + (twinForm(s, u) === 'sword' ? 1 : 0);
}
// 陰陽倒亂: which of its two weapons a `twin` villain leads with this round — the sabre on odd
// rounds, the sword on even ones. Null for anyone else, or with no game to count rounds in.
function twinForm(s, u) {
  if (!s?.round || !u || ally(u) || !unitDetails(u)?.traits?.twin) return null;
  return s.round % 2 ? 'sabre' : 'sword';
}
// How far an enemy strikes this turn: when its signature is due, with the signature's own reach.
function strikeReach(s, u) {
  const sig = signatureDue(s, u) ? enemyTechnique(u, s) : null;
  return u.conditions?.disarm ? 1 : Math.max(reach(s, u), sig?.reach || 0);
}
// The share of a full basic strike a counter carries: none while 無守; full for a villain whose
// 蓄勢反擊 is charged; a learned 後發 sets its own; otherwise 0.55. (A hero's 卸勁, which also gave
// a full counter, became 固守 in 0.50.)
// 太極圓轉 (the leader's boon) adds its share, up to a full counter.
function counterRatio(s, defender) {
  const c = defender.conditions || {};
  if (c.unguarded || c.freeze || c.mute) return 0; // 無守; 定身 and 閉穴 do not counter
  if (unitDetails(defender)?.traits?.stance && signatureDue(s, defender)) return 1;
  const share = basicFor(defender).retort || 0.55,
    more = commandBonus(s, defender, 'retort') / 100;
  return more ? Math.min(1, Math.round((share + more) * 100) / 100) : share;
}
// The cut, in percent, on the damage an enemy piece takes from the heroes' blows and counters: a
// villain's 蓄勢反擊 or 盾牆 by its own `cut` while it holds, 沉樁 below its share of 氣血. (Heroes
// have no cut since 卸勁 became 固守, a flat 防禦, in 0.50.)
function stanceCut(s, v) {
  const traits = unitDetails(v)?.traits,
    stance = traits?.stance;
  const held = stance && stanceHolds(s, v) ? stance.cut || 0 : 0;
  // 沉樁: at or below its share of 氣血 a piece with `lastStand` takes less from every blow.
  const last = traits?.lastStand;
  // 木劍: 求敗 takes his stage's cut off every blow in it.
  const stage = !ally(v) && traits?.stages ? stageOf(v)?.cut || 0 : 0;
  return Math.max(held, stage, last && !ally(v) && v.hp <= v.maxHp * last.below ? last.cut : 0);
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
// The last board's master once he is in a stage they guard him in (五劍 `guarded`, from 木劍 on):
// from then on the masters who stand with him guard him (coverer, enemyAction).
function pressed(s) {
  if (!boardOf(s)?.last) return null;
  const m = find(s, commanderId(s));
  return m && living(m) && stageOf(m)?.guarded ? m : null;
}
// A board object that wards a master, once another such object has fallen (護樁: 慕容博 then
// guards the one still standing, and takes the blows aimed at it).
const wardLeft = (s, t) =>
  isProp(t) && !!unitDetails(t)?.traits?.ward && props(s).some((v) => v !== t && unitDetails(v)?.traits?.ward && !living(v));
function coverer(s, t) {
  if (!s?.units || !t?.id) return null;
  let best = null;
  for (const v of s.units) {
    const cover = !ally(v) && unitDetails(v)?.traits?.cover;
    // 護樁: a piece with `cover: 'ward'` beside the last object that wards him takes its blows.
    const guard = cover === 'ward' && wardLeft(s, t);
    // 受制 gives and takes no cover; under 定身 a piece cannot step in.
    if (v === t || !living(v) || (v.side !== t.side && !guard) || distance(v, t) !== 1) continue;
    if (charmed(v) || charmed(t) || v.conditions?.freeze) continue;
    // 刀陣 ('kin'): one of a pair of the same type, the healthier taking the blow for the other.
    const covers = ally(v)
      ? !!v.conditions?.cover
      : guard ||
        (cover === 'master' && t.id === commanderId(s)) ||
        (cover === 'kin' && pieceKey(v) === pieceKey(t) && v.hp > t.hp) ||
        // 護駕 (the last board): once the masters guard 求敗, one beside him takes the blow.
        (!!v.guest && pressed(s) === t);
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
function received(s, v, raws, striker = null) {
  // 金剛: nothing lands, its effects included; the holder still counters. A 閃身 is kept for later.
  if (immuneTo(v))
    return { hits: raws.map(() => 0), ward: null, back: 0, void: true, silent: false, immune: true };
  // 無劍: only one hero's blows touch him; anyone else's lands nothing, and he still counters.
  if (untouched(striker, v))
    return { hits: raws.map(() => 0), ward: null, back: 0, void: true, silent: false, solo: true };
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
  let t = unitDetails(u)?.traits || {};
  // A guest on the last board is his own man: no 戰意 holds him to the post he keeps on his own
  // board, to the spot where he charges, or half-asleep until his 變招 (半醒), so none of the
  // three is his here.
  if (u?.guest && (t.post || t.phase || t.stance?.holds))
    t = { ...t, post: null, phase: null, stance: t.stance?.holds ? { ...t.stance, holds: false } : t.stance };
  const p = u?.phased ? t.phase : null;
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
  // 'ward': no post while every board object that wards him stands; once one has broken, the
  // nearest still standing (慕容博 falls back to guard the last 星索樁).
  if (post.tile === 'ward') {
    const wards = props(s).filter((v) => unitDetails(v)?.traits?.ward);
    if (!wards.some((v) => !living(v))) return null;
    const left = wards.filter(living).sort((a, b) => distance(a, u) - distance(b, u))[0];
    return left ? { x: left.x, y: left.y } : null;
  }
  if (post.tile === 'master') {
    const m = find(s, commanderId(s));
    return m && living(m) && m !== u ? { x: m.x, y: m.y } : null;
  }
  if (post.tile === 'spawn') {
    const home = homeTile(s, u);
    if (home) return home;
    return mapLayout(s.mapIndex).enemies[seatOf(s.mapIndex, u.id)] || null;
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
  const post = traitsOf(u).post;
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
  nearest: '見人就撲',
  sheltered: '專挑倚仗掩體或有人代受的俠客'
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
  const keys = encounterKeys(map),
    layout = mapLayout(map),
    numbers = seatNumbers(map, stage);
  fixedSlots(map).forEach((slot, i) => {
    const [hp, atk, def, step, range] = numbers[i];
    const p = layout.enemies[i];
    const u = makeUnit(slotId(map, slot), 'enemy', p.x, p.y, hp, 0, atk, def, step, range);
    if (i) u.encounterId = keys[i];
    s.units.push(u);
  });
  const board = castBoard(map);
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
    stage = traitStage(s, u),
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
        '替他承受俠客的直接攻擊（氣血較多者先上）；濺射、餘勁與毒傷仍會落在他身上。'
    );
  if (t.post?.tile === 'master' || t.cover === 'master')
    say(
      '代受',
      [
        t.post?.tile === 'master' ? '每回合先回到' + master + '身旁' : '',
        t.cover === 'master' ? (t.post?.tile === 'master' ? '與他' : '與' + master) + '相鄰時替他受招' : ''
      ]
        .filter(Boolean)
        .join('；') + '。'
    );
  else if (t.post && u.woke) say('坐鎮', '已離位追擊。');
  else if (t.post?.tile === 'ward') {
    const tile = postTile(s, u, t.post),
      within = COUNTS[t.post.tether] + '格內';
    say(
      '坐鎮',
      (tile
        ? '退守' + unitDetails(at(s, tile.x, tile.y)).name + tileName(tile) + within + '。'
        : '星索樁倒下一根，便退到另一根旁守著，守在' + within + '。') +
        (t.cover === 'ward' ? '與那根樁相鄰時，替它承受俠客的直接攻擊。' : '') +
        (t.cover === 'ward' && t.post.wake === 'struck' ? '直接打他，他才離位追擊。' : WAKES[t.post.wake])
    );
  } else if (t.post) {
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
  if (t.unfelled) say('不敗', '氣血不會低於 1 點，他不會倒下；削至 1 點，這一局便完了。');
  // The last board: who comes to 求敗's side as he changes swords, and who guards him.
  if (boardOf(s)?.last && u.id === commanderId(s))
    say('代受', '換作木劍時，兩位局主趕到他身旁；換作無劍時，再來三位。木劍起，與他相鄰的局主替他承受俠客的直接攻擊（氣血較多者先上），唯獨到了無劍，無名的招無人替他擋；濺射、餘勁與毒傷仍會落在他身上。');
  if (boardOf(s)?.last && u.guest && master)
    say('代受', master + '換作木劍之後，守在他身旁，相鄰時替他受招（無劍時無名的招除外）。');
  if (t.formless) say('無招', '手中只是一根枯枝，沒有招式可破：任何一式的破招對他都不成。');
  // What he fights with, for the forms that answer a kind of weapon: said once 無名 is on the board.
  if (armOf(u, s) && party(s).some((v) => v.id === YOUTH_ID)) say('兵刃', ARM_NAMES[armOf(u, s)] + '。');
  if (t.contact)
    say('化功', '貼身打中他的俠客損失 ' + (t.contact.mp + stage) + ' 點內力（截勁時無效）。');
  if (t.stance?.while === 'posted') {
    const tile = t.post && postTile(s, u, t.post);
    say('盾牆', '站在原位' + (tile ? tileName(tile) : '') + '時，受到的傷害減 ' + t.stance.cut + '%；被推離原位便失去盾牆，走回後恢復。');
  } else if (t.stance) {
    const r = COUNTS[strikeReachWhenDue(s, u)];
    say(
      '蓄勢反擊',
      (t.stance.holds ? '蓄勢時原地不動，只打' + r + '格內的人；' : '蓄勢時') +
        r +
        '格內打他，必遭全力還擊（免受還擊之招與截勁除外）。'
    );
  }
  // A mirror that is the villain's signature is told in the signature's own lines.
  if (t.redirect && info.style !== 'mirror')
    say('挪移', '蓄勢時，第一次受到的直接攻擊全數不中，反震一半給出手者（截勁時無效）。');
  // A board object (星索樁) can carry the ward as well as a piece.
  const wards = [...others, ...props(s).filter(living)].filter((v) => unitDetails(v)?.traits?.ward);
  if (u.id === commanderId(s) && wards.length)
    say(
      '星索',
      (wards.every(isProp) ? '每根立著的' : '每名存活的') +
        named(wards) +
        '替他抵擋 ' +
        unitDetails(wards[0]).traits.ward +
        '% 傷害。'
    );
  if (t.ward && master && u.id !== commanderId(s))
    say('星索', '存活時替' + master + '抵擋 ' + t.ward + '% 傷害。');
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
  if (t.cover === 'kin') say('代受', '相鄰的另一名' + info.name + '氣血較多時，替他承受俠客的直接攻擊。');
  if (t.flurry)
    say(
      '分刺',
      '每次出手之後，針影再刺射程內另一名俠客，威力為前一擊的 ' +
        Math.round(t.flurry.share * 100) +
        '%；這一刺無人可代受，閃身與挪移也攔不住，且不受還擊。'
    );
  if (t.bend) say('轉折', '掌力曲直如意：無視目標所在地形的防禦加成，旁人也無法替目標代受。');
  if (t.pull) say('擒拿', '絕技命中後，將目標扯到自己身旁最近的空格；已在身旁或無空格時不動。');
  if (t.fleet) say('水上飄', '踏水如履平地：每一格只消耗 1 步，不受地形拖累。');
  if (t.twin) {
    const form = twinForm(s, u);
    say(
      '陰陽倒亂',
      '單數回合使金刀，攻擊 ＋' +
        (t.twin.atk + halfStage(s)) +
        '；雙數回合使黑劍，射程 ＋1。' +
        (form && s.units?.includes(u) && s.logs ? '本回合：' + (form === 'sabre' ? '金刀' : '黑劍') + '。' : '')
    );
  }
  if (t.lone)
    say(
      '孤行',
      '身旁沒有其他敵人時，出手或還擊攻擊 ＋' +
        (t.lone.atk + halfStage(s)) +
        '。' +
        (s.logs ? (alone(s, u) ? '此刻孤身。' : '此刻有同夥在旁。') : '')
    );
  if (t.pincer)
    say('夾衛', '目標身旁另有敵人時，出手或還擊攻擊 ＋' + (t.pincer.atk + halfStage(s)) + '。');
  if (t.stepPoison)
    say(
      '步裡藏毒',
      '走動之後的普攻令目標中毒，' +
        (t.stepPoison.turns === 2 || !t.stepPoison.turns ? '兩' : t.stepPoison.turns) +
        '次毒發各損 ' +
        (t.stepPoison.power + halfStage(s)) +
        ' 氣血；原地出手與還擊不帶毒。'
    );
  if (t.lastStand)
    say(
      '沉樁',
      '氣血不過' +
        (t.lastStand.below === 0.5 ? '半' : Math.round(t.lastStand.below * 100) + '%') +
        '時，受到的傷害減 ' +
        t.lastStand.cut +
        '%。' +
        (s.logs && u.hp <= u.maxHp * t.lastStand.below ? '現已沉樁。' : '')
    );
  if (t.snare)
    say('墜網', '普攻令目標絆足，移動減 ' + t.snare.power + '，持續至下回合；還擊不帶網。');
  if (t.prefers) say('偏好', PREFERS[t.prefers] + '。');
  if (t.stages)
    say(
      '五劍',
      '氣血分作' + t.stages.map((v) => v.name).join('、') + '五段，各佔五分之一，一段削盡便換下一段，一段比一段難纏。' +
        (s.units && u.maxHp ? '現為' + stageOf(u).name + '：' + stageNote(stageOf(u)) + '。' : '')
    );
  const phase = u.guest ? null : info.traits?.phase;
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
  DETAILS[id] = { ...v, role: v.role || (v.rank === 'boss' ? '局主' : '副手') };
for (const [id, t] of Object.entries(TROOPS)) DETAILS[id] = { ...t };
// The board objects, with their pictures as their portraits.
for (const [id, o] of Object.entries(BOARD_OBJECTS))
  DETAILS[id] = { ...o, object: true, portraitFile: 'object-' + o.art + '.webp' };
// The stage row each board's own pieces take their numbers from (stageRows).
for (let map = 0; map < CAPTAINS.length; map++) {
  DETAILS[CAPTAINS[map][0]].row = 'master';
  if (GARRISONS[map]) continue; // its other three are a troop type, with that type's row
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
// What each enemy fights with (encounters.js ARM_OF), for the forms that answer a kind of weapon.
for (const [key, arm] of Object.entries(ARM_OF)) if (DETAILS[key]) DETAILS[key].arm = arm;
// 求敗 wears the portrait his lines have always worn.
DETAILS.qiubai.portraitFile = QIUBAI.portrait;
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
  huang: [70, 40, 16, 8, 3, 2, 'jadeCane'],
  yang: [184, 76, 26, 14, 5, 1, 'tombSword'],
  zhang: [166, 92, 21, 19, 3, 1, 'mingSash'],
  hu: [104, 36, 17, 9, 5, 1, 'foxSaber'],
  hero: [148, 74, 25, 11, 4, 1, 'pine'],
  medic: [64, 46, 15, 7, 3, 2, 'staff'],
  guard: [166, 60, 19, 16, 3, 1, 'pole'], // 內力 34 → 60 (0.50): enough to taunt every round
  guo: [180, 76, 24, 19, 3, 1, 'wraps'],
  xiao: [102, 66, 21, 9, 4, 1, 'twins'],
  duan: [76, 70, 17, 7, 4, 2, 'fan'],
  // The ten from the roster pack carry no weapon of their own yet (ROADMAP, open questions): the
  // slot starts empty. Their attack sits a little above the first ten's bare numbers and below
  // their armed ones, since the first weapon they buy adds its whole bonus.
  qiaoFeng: [156, 60, 23, 13, 4, 1],
  xuZhu: [134, 100, 18, 12, 3, 1],
  hongQi: [146, 60, 27, 12, 5, 1],
  yaoShi: [102, 80, 20, 9, 4, 2],
  sanFeng: [136, 96, 27, 19, 4, 1],
  zhaoMin: [70, 34, 13, 7, 4, 1],
  lingSu: [72, 42, 16, 7, 3, 2],
  diYun: [176, 82, 25, 13, 4, 1],
  chengZhi: [86, 38, 18, 10, 5, 1],
  aQing: [130, 78, 25, 9, 5, 1],
  youth: [104, 70, 26, 9, 4, 1, 'keenSword']
};
// What a hero arrives wearing, beside the weapon in HERO_STATS.
const STARTING_GEAR = { diYun: 'silkwormCoat' };
// What reaching a level adds, as [攻擊, 防禦, 氣血, 內力]: levels two and three add more, later
// ones less (raiseLevel). The wiki's hero pages read these and GROWTH_PACES.
const LEVEL_GAINS = { novice: [3, 2, 12, 6], veteran: [2, 1, 8, 6] };
// Paces of growth other than the common one (the producer's request, 2026-11-22). A hero on one
// reaches the same numbers at level 12 as LEVEL_GAINS gives him, only at another pace: `start`
// is what he already has at level 1 beyond his HERO_STATS (or, below zero, still lacks), and
// `levels` what reaching each level from two to twelve adds, both as [攻擊, 防禦, 氣血, 內力].
// So `start` and the eleven rows add up to the common growth's 24, 13, 96 and 66. Past level 12
// he grows by LEVEL_GAINS.veteran.
const GROWTH_PACES = {
  // A whole art learned in youth: most of the growth is there by level 4, then very little.
  early: {
    name: '早成',
    desc: '一級起便比尋常強，四級以前長得快，此後每級只添少許。',
    start: [10, 5, 40, 26],
    levels: [
      [6, 3, 24, 16], [4, 2, 16, 10], [2, 1, 8, 6], [2, 2, 1, 1], [0, 0, 1, 1], [0, 0, 1, 1],
      [0, 0, 1, 1], [0, 0, 1, 1], [0, 0, 1, 1], [0, 0, 1, 1], [0, 0, 1, 1]
    ]
  },
  // Slow to learn: below the common numbers to level 4, then a great deal each level from 5 to 9,
  // so the payoff comes within the levels a run reaches (a slow learner also earns less 歷練).
  late: {
    name: '晚成',
    desc: '四級以前比尋常弱，每級只長一點；五級起每級長得多，九級前後追上尋常。',
    start: [-6, -3, -24, -16],
    levels: [
      [1, 0, 4, 3], [1, 1, 4, 3], [1, 0, 4, 3], [4, 2, 16, 10], [5, 3, 20, 13],
      [5, 3, 20, 13], [4, 2, 16, 11], [3, 2, 12, 9], [3, 1, 12, 8], [2, 1, 8, 6], [1, 1, 4, 3]
    ]
  },
  // Behind until a single level makes it all up at once, then the common growth.
  surge: {
    name: '驟進',
    desc: '五級以前比尋常弱，升上六級時一次補足，此後照常成長。',
    start: [-5, -3, -20, -14],
    levels: [
      [1, 0, 2, 1], [0, 0, 2, 1], [1, 0, 2, 1], [0, 0, 2, 1], [15, 10, 60, 40],
      [2, 1, 8, 6], [2, 1, 8, 6], [2, 1, 8, 6], [2, 1, 8, 6], [2, 1, 8, 6], [2, 1, 8, 6]
    ]
  }
};
// Who grows at which pace, and why (the wiki's hero page shows both). A hero not listed grows by
// LEVEL_GAINS; take an entry out and that hero grows as everyone does.
const GROWTH_PROFILES = {
  hu: { pace: 'early', why: '胡家刀譜他自小照著練全。' },
  chengZhi: { pace: 'early', why: '金蛇秘笈他少年時在石洞中練全。' },
  duan: { pace: 'late', why: '他本不會武功，六脈神劍時靈時不靈，到後來方才收發由心。' },
  guo: { pace: 'late', why: '他資質魯鈍，學得極慢；降龍十八掌練成之後，方成中流砥柱。' },
  xuZhu: { pace: 'surge', why: '無崖子一次將七十年內力傳入他體內。' }
};
const growthOf = (id) => GROWTH_PACES[GROWTH_PROFILES[id]?.pace] || null;
const FOES = ['chief', 'blade', 'bow', 'scout'];
const startingHero = (id) => {
  const u = { ...makeUnit(id, 'ally', 0, 0, ...HERO_STATS[id]), gear: STARTING_GEAR[id] || null },
    start = growthOf(id)?.start;
  if (start) addGrowth(u, start);
  return u;
};
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
    s.round > roundLimit(s) ||
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
// 木劍: the holds a stage of 求敗's shrugs off (`unheld`) come off this strike, with their lines,
// and the preview says so.
function unheldPlan(t, result) {
  const st = stageOf(t),
    kinds = st?.unheld?.filter((k) => result.effects.some((e) => e.kind === k)) || [];
  if (!kinds.length) return;
  result.effects = result.effects.filter((e) => !kinds.includes(e.kind));
  const words = kinds.map((k) => CONDITION_NAMES[k]);
  const gone = (n) => words.some((w) => n.startsWith(w + ' · ')) || words.some((w) => n.includes('改為' + w));
  result.riders = result.riders.filter((n) => !gone(n));
  result.notes = result.notes.filter((n) => !gone(n));
  result.notes.push(st.name + ' · ' + words.join('、') + '皆不受');
}
// 定身 and 閉穴: a held piece loses each of its own turns until the condition runs out (`turns`
// enemy phases from the strike). A master is held for one turn at most, and the round after one
// shakes off another of the same kind (the rule 截勁 follows). 失神 is 定身 for one round now
// (Q-N132), so its arts share 定身's resistance.
const CONTROLS = {
  freeze: { word: '定身', verb: '不能行動', mark: 'lastFreezeRound' },
  mute: { word: '閉穴', verb: '不能出手', mark: 'lastMuteRound' }
};
// What this strike's 定身, 閉穴 and 受制 put on its target, with the preview's lines. A 定身 with
// `setup` (絆字訣) needs the target disarmed or standing in a formation as the blow lands. 受制
// takes only rank-and-file pieces: on a master or a lieutenant (any piece of rank 'boss' or
// 'mini') the art holds it in 定身 for one round instead. The lines a blow that does not land
// would not keep are listed in `result.riders`. A strike at a piece already held says so.
function controlPlan(s, u, t, art, result) {
  const info = unitDetails(t),
    name = info.name,
    boss = info.rank === 'boss';
  if (t.conditions?.freeze) result.notes.push('定身 · ' + name + '本回合不能行動，不還擊');
  else if (t.conditions?.mute) result.notes.push('閉穴 · ' + name + '本回合不能出手，不還擊');
  if (!art) return;
  const rider = (note) => {
    result.notes.push(note);
    result.riders.push(note);
  };
  const drop = (kind) => (result.effects = result.effects.filter((e) => e.kind !== kind));
  for (const [kind, c] of Object.entries(CONTROLS)) {
    if (!art[kind]) continue;
    if (art[kind].setup && !(t.conditions?.disarm || zoneAt(s, t))) {
      drop(kind);
      result.notes.push('條件未成 · 未能' + c.word);
      continue;
    }
    if (boss && t[c.mark] === s?.round - 1) {
      drop(kind);
      rider('局主已換氣，本回合抵抗' + c.word);
      continue;
    }
    const asked = art[kind].turns || 1,
      turns = boss ? 1 : asked;
    result.effects = result.effects.map((e) => (e.kind === kind ? { ...e, turns } : e));
    rider(c.word + ' · ' + turns + ' 回合' + c.verb + (boss && asked > 1 ? '（局主只受一回合）' : ''));
  }
  if (!art.charm) return;
  if (info.rank !== 'boss' && info.rank !== 'mini') {
    rider('受制 · 倒戈 ' + (art.charm.turns || 1) + ' 回合');
    return;
  }
  drop('charm');
  rider((boss ? '局主' : '副手') + '不受制，改為定身一回合');
  if (boss && t.lastFreezeRound === s?.round - 1) {
    // An art with 定身 of its own has said so already.
    if (!result.notes.includes('局主已換氣，本回合抵抗定身')) rider('局主已換氣，本回合抵抗定身');
    return;
  }
  if (result.effects.some((e) => e.kind === 'freeze')) return;
  result.effects.push({ kind: 'freeze', power: 1, turns: 1 });
  rider('定身 · 1 回合不能行動');
}
// 定身 in the enemy phase: the piece does nothing, and the condition stays until it runs out. A
// signature that was due stays due.
function frozenTurn(s, u) {
  u.acted = true;
  log(s, 'combat', '定身，動彈不得。', unitDetails(u).name);
  return [[u.id, '定身', 'status']];
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
  if (!s?.units || ally(u) || charmed(u)) return 0; // 受制 takes no 盟令 and gives none
  let bonus = 0;
  for (const v of s.units) {
    const banner = v !== u && living(v) && !ally(v) && !charmed(v) && unitDetails(v)?.traits?.banner;
    if (banner) bonus = Math.max(bonus, banner.atk + traitStage(s, v));
  }
  return bonus;
}
// 聚賢豪氣: the leader's boon, for each foe beside the hero (in 整備, beside his seat's post).
function throngBonus(s, u) {
  const per = commandBonus(s, u, 'throng');
  if (!per) return 0;
  const at = s.run?.scene === 'prep' ? prepPost(s, u.id) : u;
  const near = s.units.filter(
    (v) => v.side === 'enemy' && living(v) && !charmed(v) && distance(v, at) === 1
  ).length;
  return per * Math.min(near, leaderBoon(s)?.most || 3);
}
// 鴛鴦刀 (仁者無敵): a hero holding one of the pair, with a living companion holding the other
// beside him, gains the pair's 攻擊 and 防禦; in 整備, beside his seat's post.
function pairBonus(s, u, k) {
  const pair = ITEMS[u?.weapon]?.pair;
  if (!pair || !s?.units || !ally(u) || !living(u)) return 0;
  const prep = s.run?.scene === 'prep',
    at = prep ? prepPost(s, u.id) : u;
  if (!at) return 0;
  const near = s.units.some((v) => {
    if (v.id === u.id || !ally(v) || !living(v) || v.weapon !== pair.with) return false;
    const there = prep ? prepPost(s, v.id) : v;
    return !!there && distance(there, at) === 1;
  });
  return near ? pair[k] || 0 : 0;
}
function stat(u, k, s) {
  // 重劍, 木劍: in those stages 求敗's step is the stage's, whatever else is on him.
  const fixed = k === 'step' && u.side === 'enemy' ? stageOf(u)?.step : null;
  if (fixed != null) return fixed;
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
      ? (c.rally?.power || 0) -
        (c.weak?.power || 0) -
        (c.disarm?.power || 0) +
        bannerBonus(s, u) +
        pairBonus(s, u, 'atk') +
        sabreBonus(s, u) +
        throngBonus(s, u) -
        commandAura(s, u, 'sap')
      : k === 'def'
        ? -(c.exposed?.power || 0) -
          (c.recoil?.power || 0) +
          (c.fortify?.power || 0) +
          pairBonus(s, u, 'def') +
          (onZone(s, u) ? 4 : 0)
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
  guard: { factor: 1.15, safe: true, fortify: { power: 10, turns: 1 } }, // 卸勁 became 固守 (0.50)
  guo: { factor: 1.28, debuff: { stat: 'atk', power: 4, turns: 2 } },
  xiao: { factor: 1.25 },
  duan: { factor: 1.1, safe: true },
  huang: { factor: 1.05, mute: { turns: 1 }, visual: 'guard' },
  yang: { factor: 1.32, visual: 'guo' }, // 定勢 gone; its share (6 of 65 blows) rounds to nothing
  zhang: { visual: 'medic', heal: 40, target: 'ally' },
  hu: { factor: 1.3, visual: 'xiao' },
  qiaoFeng: { factor: 1.2, push: true, visual: 'guo' },
  xuZhu: { factor: 1.4, visual: 'guo' },
  hongQi: { factor: 1.2, safe: true, visual: 'guo' },
  yaoShi: { factor: 1.25, visual: 'guo' },
  sanFeng: { factor: 1.2, fortify: { power: 7, turns: 1 }, visual: 'guo' }, // 卸勁 became 固守 (0.50)
  zhaoMin: { factor: 1.2, pierce: 0.5, visual: 'hero' },
  lingSu: { visual: 'medic', heal: 22, target: 'ally' },
  diYun: { factor: 1.3, visual: 'hero' },
  chengZhi: { factor: 1.25, visual: 'guo' },
  aQing: { factor: 1.25, visual: 'xiao' },
  youth: { factor: TECHNIQUES.ninefoldFormula.factor, visual: 'hero' }
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
  if (c.spent) return no('代價 · 本回合不能施展絕技');
  if (c.rooted && targetType(art) === 'ground' && !art.zone) return no('代價 · 本回合不能移動');
  if (art.once && u.usedOnce?.includes(id)) return no('每局一次 · 本局已用');
  if (s.round < ready) return no('還須 ' + (ready - s.round) + ' 回合才能再用');
  // A strike earlier this same round (after 連環 or a companion's order) does not count against
  // `poised` (it was 留力).
  if (art.poised && u.struckRound === s.round - 1) return no('上一回合已出手，本回合不能施展');
  if (art.consume === 'shield' && !c.shield) return no('自身須有護盾才能施展');
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
  // 水上飄: a `fleet` villain pays one step for every tile it can walk.
  const fleet = !ally(u) && !!unitDetails(u)?.traits?.fleet;
  const toll = (x, y) => (fleet ? 1 : tileInfo(x, y, s.mapIndex).cost);
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
        (reverse ? toll(p.x, p.y) : toll(x, y));
      if (n > limit || n >= (costs.get(k) ?? Infinity)) continue;
      const occupant = at(s, x, y);
      if (occupant && sideOf(occupant) !== sideOf(u)) continue;
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
  // A 回身 earned before this walk (連環 gave a second action) keeps only the steps still left.
  if (u.glideLeft) u.glideLeft = glideSteps(s, u);
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
    const entry = supportEntry(forms, u, v, supportHeal(forms, v, power));
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
// What a 破招 form answers: a way of fighting (by reach or rank), or a kind of weapon (the enemy's
// `arm`, encounters.js ARM_OF).
const ANSWERS = {
  close: '近身兵刃',
  ranged: '遠攻',
  master: '首領',
  ...Object.fromEntries(Object.entries(ARM_NAMES).map(([arm, name]) => [arm, name]))
};
// The kind of weapon an enemy fights with, if any form answers it.
// 公孫止 (陰陽倒亂) fights with the sword on even rounds, whatever he is listed by.
const armOf = (u, s = null) => (twinForm(s, u) === 'sword' ? 'sword' : u?.arm || unitDetails(u)?.arm || null);
// Whether a form that answers `kind` answers this target. 無招 is answered by nothing.
function answers(s, kind, t) {
  if (traitsOf(t).formless) return false;
  if (ARM_NAMES[kind]) return armOf(t, s) === kind;
  const rank = unitDetails(t)?.rank,
    span = reach(s, t);
  return { close: span === 1, ranged: span >= 2, master: rank === 'boss' || rank === 'mini' }[kind] || false;
}
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
    notes.push('耗內力 ' + u.mp + ' · 倍率 ' + factor.toFixed(2));
  }
  if (art.answer && t) {
    if (answers(s, art.answer, t)) add(0.3, '破招 · ' + ANSWERS[art.answer] + ' ＋0.30');
    else if (traitsOf(t).formless) notes.push('無招 · 破招不成');
    else notes.push('破招未成 · 目標不是' + ANSWERS[art.answer]);
  }
  const beside = (s?.units || []).filter(
    (v) => v !== u && living(v) && v.side === u.side && distance(v, u) === 1
  );
  if (art.lone) {
    if (!beside.length) add(art.lone, '四鄰無同伴 ' + plus(art.lone));
    else notes.push(beside.map((v) => unitDetails(v).name).join('、') + '在旁，倍率不加');
  }
  if (art.paired) {
    const partner = beside.find((v) => v.id === PARTNERS[u.id]);
    // An art with no `any` (小龍女's two) counts only her partner (左右互搏 is gone, Q-N132).
    const { any = 0, partner: most } = art.paired;
    if (partner) add(most, '合璧 · ' + unitDetails(partner).name + '在旁 ' + plus(most));
    else if (any && beside.length) add(any, '合璧 ' + plus(any));
    else if (any) notes.push('合璧未成 · 四鄰沒有同伴');
    else notes.push('合璧未成 · ' + DETAILS[PARTNERS[u.id]]?.name + '不在身旁');
  }
  // 黯然, one step (Q-N132): 氣血 after the art's own cost at three quarters or less.
  if (art.dire) {
    const h = u.hp - (art.hpCost || 0);
    if (h <= u.maxHp * 0.75) add(art.dire, '氣血不過四分之三 ' + plus(art.dire) + '（氣血 ' + h + '／' + u.maxHp + '）');
    else notes.push('氣血尚逾四分之三，倍率不加');
  }
  if (art.avenge && s) {
    if (u.hurtRound === s.round - 1) add(art.avenge, '上回合受創 ' + plus(art.avenge));
    else notes.push('上一個敵方回合未曾受創，倍率不加');
  }
  if (art.execute && t) {
    if (t.hp <= t.maxHp / 2) add(art.execute, '目標氣血不過半 ' + plus(art.execute));
    else notes.push('目標氣血過半，倍率不加');
  }
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
  const held = heldBonus(s, u, target);
  const atk = stat(u, 'atk', s) - traitEdge(s, u, target, struckHp);
  return atk * (art ? strikeFactor(s, u, art, target).factor : 1) + base + pursuit + held;
}
// 打狗陣法: the leader's boon on a foe already held (絆足, 截勁, 纏械, 定身, 閉穴).
const heldBonus = (s, u, t) =>
  t && HELD_KINDS.some((k) => t.conditions?.[k]) ? commandBonus(s, u, 'held') : 0;
// What a villain's own traits take off (+) or add to (−) its attack against this hero, blows and
// counters alike: 近身失準 (`crowded`) when the hero stands within its distance, 斬殘 (`execute`)
// when the hero is at or below half.
function traitEdge(s, u, target, struckHp = target?.hp) {
  if (!target || ally(u) || !ally(target)) return 0;
  const t = traitsOf(u);
  let edge = 0;
  if (t.crowded && distance(u, target) <= t.crowded.within) edge += t.crowded.atk;
  if (t.execute && struckHp <= target.maxHp / 2) edge -= executeBonus(s, t);
  if (t.lone && alone(s, u)) edge -= t.lone.atk + halfStage(s);
  if (t.pincer && flanked(s, u, target)) edge -= t.pincer.atk + halfStage(s);
  return edge;
}
// 陰陽倒亂: on a sabre round the villain's 攻擊 itself is higher (its page shows it), as on a sword
// round its 射程 is (reach).
const sabreBonus = (s, u) =>
  twinForm(s, u) === 'sabre' ? unitDetails(u).traits.twin.atk + halfStage(s) : 0;
const halfStage = (s) => Math.floor((s?.run?.stage || 0) / 2);
// 獨行: no other living black stone stands beside this one.
// (Compared by id: the forecast asks with a copy of the piece.)
const alone = (s, u) =>
  !(s?.units || []).some(
    (v) => v.id !== u.id && living(v) && v.side === 'enemy' && distance(v, u) === 1
  );
// 夾衛: another living black stone stands beside the hero this one strikes.
const flanked = (s, u, target) =>
  (s?.units || []).some(
    (v) => v.id !== u.id && living(v) && v.side === 'enemy' && distance(v, target) === 1
  );
const executeBonus = (s, t) => t.execute.atk + Math.floor((s?.run?.stage || 0) / 2);
// 轉折: whether u's blows pass the ground's defence and every 代受 — a `bend` villain's, or a
// hero's under the leader's 金蛇轉鋒.
const bends = (s, u) =>
  ally(u) ? !!commandBonus(s, u, 'bend') : !!unitDetails(u)?.traits?.bend;
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
  // 轉折: a `bend` villain's blows pass the defence the ground gives; so do a hero's under 金蛇轉鋒.
  const ground = bends(s, u) ? 0 : tileInfo(t.x, t.y, map).defense;
  // 重劍: 固守's 防禦 does not count against 求敗's blows in that stage.
  const firm = !ally(u) && stageOf(u)?.pierce ? t.conditions?.fortify?.power || 0 : 0;
  const protection = stat(t, 'def', s) - firm + ground + (t.brace ? 4 : 0);
  // A weapon that passes 防禦 (削鐵匕首) does so for the basic attack and the counter only.
  const pierce = art
    ? art.pierce || 0
    : Math.min(1, commandBonus(s, u, 'pierce') / 100 + (ITEMS[u.weapon]?.pierce || 0));
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
// An art's heal on one friend: 解厄 lifts a 內傷 first, so the heal that follows is not halved
// (as with a dose, medicineFor).
const supportHeal = (forms, v, n) => (forms.includes('cleanse') ? n : healAmount(v, n));
function woundedHealNotes(t, friends, result) {
  const hurt = friends.filter((v) => v.conditions?.wound);
  if (!hurt.length) return;
  if (hurt.length === 1 && hurt[0] === t) result.notes.push('內傷 · 療效減半');
  else result.notes.push('內傷 · ' + hurt.map((v) => unitDetails(v).name).join('、') + '療效減半');
}
// What an action goes on to cost its own caster's 氣血 once it is over (內傷 after an attack,
// then a 亂氣 burst), counted from where the preview leaves him; shown on his bar as `selfLoss`.
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
    if (layers < 3) result.notes.push('亂氣 · ' + layers + '／3 層');
    else {
      const n = left > 1 ? Math.min(backlashLoss(u), left - 1) : 0;
      result.selfLoss += n;
      left -= n;
      result.notes.push('亂氣 · 滿三層，自損 ' + n + ' 氣血');
    }
  }
  return left;
}
// 亂氣 (§3): the burst is a fifth of the caster's greatest 氣血, rounded up.
const backlashLoss = (u) => Math.ceil(u.maxHp * 0.2);
// 亂氣: each use of a 亂氣 art (`backlash`) lays a layer of 亂氣; the use that would lay the third bursts
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
  log(s, 'combat', '亂氣滿三層，自損 ' + n + ' 點氣血。', unitDetails(u).name);
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
// 星索 (the ward): the living pieces whose `ward` trait shields their board's master.
function wardEscorts(s) {
  if (!s?.units) return [];
  return s.units.filter((u) => !ally(u) && living(u) && !charmed(u) && unitDetails(u)?.traits?.ward);
}
// The share, in percent, the master's living escorts (or those of `escorts`) take off a blow.
function wardShare(s, target, escorts = wardEscorts(s)) {
  if (!s?.units || target.id !== commanderId(s)) return 0;
  return escorts.reduce((n, v) => n + unitDetails(v).traits.ward, 0);
}
const wardPercent = (s, target) => wardShare(s, target);
// 吸元: `drain` is a share of what the main target loses, or { share, cap }; the cap is 30 unless
// the art says otherwise.
function drainOf(art) {
  const d = art?.drain;
  if (!d) return null;
  return typeof d === 'number' ? { share: d, cap: 30 } : { share: d.share || 0, cap: d.cap ?? 30 };
}
const afterWard = (power, percent) =>
  percent ? Math.max(1, Math.round((power * (100 - percent)) / 100)) : power;
// The leader's boon on a hero's blow at a foe, worked out for the forecast (so the strike does
// the same): 碧蠶毒蠱's poison and 桃花迷陣's longer conditions on the foe, and the lines of
// 打狗陣法 and 金蛇轉鋒 where they bear on this blow. A blow that does not land keeps none of it.
function boonPlan(s, u, t, result) {
  if (!ally(u) || !s?.run) return;
  const name = leaderBoon(s)?.name,
    rider = (note) => {
      result.notes.push(note);
      result.riders.push(note);
    };
  const venom = grownPoison(u, commandBonus(s, u, 'venom'));
  if (venom) {
    // A layer of its own beside the art's (0.71), grown with the striker as any hero's poison.
    const turns = leaderBoon(s).turns;
    result.effects.push({ kind: 'poison', power: venom, turns });
    rider(name + ' · 中毒 ' + venom + '，' + turns + ' 回合');
  }
  const linger = commandBonus(s, u, 'linger'),
    kept = result.effects.filter((e) => LINGER_KINDS.includes(e.kind));
  if (linger && kept.length) {
    result.effects = result.effects.map((e) => (kept.includes(e) ? { ...e, turns: e.turns + linger } : e));
    rider(name + ' · ' + kept.map((e) => CONDITION_NAMES[e.kind]).join('、') + '多留 ' + linger + ' 回合');
  }
  const held = heldBonus(s, u, t);
  if (held) result.notes.push(name + ' · 傷害 ＋' + held);
  if (bends(s, u) && tileInfo(t.x, t.y, s.mapIndex)?.defense)
    result.notes.push(name + ' · 無視地形防禦');
}
// 越女試劍: whether this hero's blow is the round's first under the boon that would draw a counter.
const opens = (s, u) =>
  ally(u) && !!s?.tally && s.tally.opened !== s.round && !!commandBonus(s, u, 'opening');
// 雪谷回生: whether the boon would keep this hero standing now (once a board, for anyone it covers).
const spares = (s, u) => ally(u) && !!s?.tally && !s.tally.spared && !!commandBonus(s, u, 'spare');
function forecast(u, t, skill, s, art = skill ? artFor(u) : null, basic = basicFor(u)) {
  const type = art ? targetType(art) : 'enemy';
  const support = type === 'self' || type === 'ally',
    heal = support && !!art.heal;
  // 代受: a blow at a covered piece is worked out on its coverer from here on (§6).
  // 金蛇轉鋒: no one takes the blow for its target (a 轉折).
  // 無劍: no one takes 無名's blows for 求敗 (the last stage is a duel).
  const aimed = t,
    guard = type === 'enemy' && !bends(s, u) && stageOf(t)?.solo !== u.id ? coverer(s, t) : null;
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
    roar: [], // 獅子吼: companions near the striker it hurts, as { id, amount }
    effects: grownEffects(u, effectsOf(art)), // poison a hero lays grows with the hero (0.71)
    hpCost: art?.hpCost || 0,
    forms: formsFor(u, art, basic),
    notes: [],
    landing: [],
    riders: [], // lines of this strike's 定身, 閉穴 and 受制, dropped if the blow does not land
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
        result.landing.map((id) => unitDetails(find(s, id)).name).join('、') + '落地各得 8 護盾'
      );
    }
    zoneNote(s, u, art, t, result); // 布陣 on a ground art: its tiles and its line
    selfLoss(s, u, art, result, false);
    result.notes.push(...guardNotes(art), ...priceNotes(art));
    return result;
  }
  if (support) {
    const friends = s ? affectedFriends(s, u, t, art) : [t];
    // 靈鷲慈心 (a leader's boon): a heal by the leader or a hero within two tiles of him restores more.
    const mercy = heal && s ? commandBonus(s, u, 'mercy') : 0;
    if (mercy) result.notes.push(leaderBoon(s).name + ' · 療傷 ＋' + mercy);
    const power = heal ? healingPower(u, s, art) + mercy : 0;
    // 化符 (`purge`): each ailment its 解厄 lifts from a recipient adds to the heal on him.
    const lifted = (v) =>
      art.purge && result.forms.includes('cleanse') ? AILMENTS.filter((k) => v.conditions?.[k]).length : 0;
    result.recipients = friends.map((v) =>
      supportEntry(result.forms, u, v, supportHeal(result.forms, v, power + lifted(v) * (art.purge || 0)))
    );
    for (const v of friends)
      if (lifted(v))
        result.notes.push(unitDetails(v).name + '每化去一種多回 ' + art.purge + ' · ＋' + lifted(v) * art.purge);
    if (heal && !result.forms.includes('cleanse')) woundedHealNotes(t, friends, result);
    if (result.forms.includes('riposte'))
      result.effects.push({ kind: 'riposte', power: 9, turns: 1 });
    for (const entry of result.recipients) {
      const name = unitDetails(friends.find((v) => v.id === entry.id)).name;
      if (entry.clean.length)
        result.notes.push(name + '解去' + entry.clean.map((k) => CONDITION_NAMES[k]).join('、'));
      if (entry.mp) result.notes.push(name + '內力 ＋' + entry.mp);
      if (entry.overflow) result.notes.push(name + '溢出的療傷化為護盾 ' + entry.overflow);
    }
    result.amount = result.recipients.find((entry) => entry.id === t.id)?.amount || 0;
    // 轉護: the caster's own shield, up to 24, passes to every recipient.
    if (art.consume === 'shield' && u.conditions?.shield) {
      result.passed = Math.min(24, u.conditions.shield.power);
      result.notes.push(
        '移出自身護盾 ' + u.conditions.shield.power + '，各人得 ' + result.passed + ' 護盾'
      );
    }
    if (art.order)
      result.notes.push('再動 · ' + unitDetails(t).name + '可再移動並出手一次（本局僅一次）');
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
  controlPlan(s, u, t, art, result); // 定身 (with a setup to meet), 閉穴, 受制
  boonPlan(s, u, t, result); // the leader's boon on this blow
  unheldPlan(t, result); // 木劍: nothing holds 求敗
  const baseHits = (art?.hits || [1]).map(
    (part, i) => Math.round(single * part) + (i === 0 ? plan.extra : 0)
  );
  result.rawHits = baseHits.map((hit) => afterWard(hit, ward));
  // The receiver's own defences, before its shield.
  const blow = received(s, t, result.rawHits, u);
  result.rawHits = blow.hits;
  const wall = unitDetails(t)?.traits?.stance;
  if (wall?.while === 'posted' && !blow.void && stanceHolds(s, t)) result.notes.push('盾牆 · 傷害 −' + wall.cut + '%');
  // 沉樁: told when it is what cuts this blow.
  const last = !ally(t) && unitDetails(t)?.traits?.lastStand;
  if (last && !blow.void && t.hp <= t.maxHp * last.below) result.notes.push('沉樁 · 傷害 −' + last.cut + '%');
  const stage = !ally(t) && stageOf(t);
  if (stage?.cut && !blow.void) result.notes.push(stage.name + ' · 所受傷害' + (stage.cut === 50 ? '減半' : '減' + shareWords(stage.cut)));
  // What his own blows do in this stage, when he strikes in the enemy phase.
  if (stage?.pull) result.notes.push(stage.name + ' · 射程 ' + reach(s, t) + ' 格，他的招擊中誰，便把誰' + pullWords(stage.pull));
  if (stage?.round)
    result.notes.push(stage.name + ' · 他出手時，身旁每位俠客挨' + shareWords(Math.round(stage.round * 100)) + '力' + (stage.shove ? '並震退一格' : ''));
  let shield = t.conditions?.shield?.power || 0;
  result.hits = result.rawHits.map((hit) => {
    const stopped = Math.min(hit, shield);
    shield -= stopped;
    result.shielded += stopped;
    return hit - stopped;
  });
  result.amount = result.hits.reduce((sum, n) => sum + n, 0);
  // 不敗: the blow takes him no lower than 1 氣血.
  if (traitsOf(t).unfelled && result.amount >= t.hp) {
    let room = Math.max(0, t.hp - 1);
    result.hits = result.hits.map((hit) => {
      const taken = Math.min(hit, room);
      room -= taken;
      return taken;
    });
    result.amount = result.hits.reduce((sum, n) => sum + n, 0);
    result.notes.push('不敗 · 氣血不低於 1');
  }
  // 問劍: the blow that leaves the board's master at his last point ends the board.
  if (s?.run && boardKind(s) === 'yield' && masterIds(s).includes(t.id) && t.hp - result.amount <= 1)
    result.notes.push('問劍 · 此擊之後，這一局便完了');
  result.push = t.hp > result.amount ? step : null;
  // 閃身, 挪移: what the receiver's guard did to the blow as a whole.
  if (blow.ward || blow.void) answerBlow(s, u, t, blow, result);
  if (result.plan.clearPoison) result.notes.push('擊中中毒者，解除自身中毒');
  if (result.forms.includes('leech')) {
    result.selfHeal = Math.min(
      healAmount(u, Math.min(9, Math.floor(Math.min(t.hp, result.amount) / 4))),
      u.maxHp - u.hp + result.hpCost
    );
    if (result.selfHeal) result.notes.push('自身氣血 ＋' + result.selfHeal);
  }
  // 吸元: a share of what the main target loses to this blow, up to its cap, through 內傷 like any
  // heal and never past the caster's greatest 氣血. Splash gives nothing.
  const drain = drainOf(art);
  if (drain) {
    const lost = Math.min(t.hp, result.amount),
      want = Math.min(drain.cap, Math.floor(drain.share * lost + 1e-9));
    const n = Math.min(healAmount(u, want), u.maxHp - u.hp + result.hpCost - result.selfHeal);
    if (n > 0) {
      result.selfHeal += n;
      result.notes.push('吸回 ' + n + ' 氣血');
    }
  }
  // 化功: what touching the receiver costs the striker in 內力.
  result.contact = contactLoss(s, u, t, result);
  if (result.contact) result.notes.push('化功 · 內力 −' + result.contact);
  // 吸勁: decided as the blow lands, before the counter it may un-charge.
  result.siphon = siphonPlan(s, u, t, result);
  if (result.siphon) result.notes.push(result.siphon.note);
  const share = counterRatio(s, afterSiphon(s, t, result.siphon));
  // 定身, 閉穴 and 受制 land with the blow: a piece this strike holds does not answer it. (A master
  // who resists is not held, and answers as usual.)
  const held = result.effects.find((e) => ['freeze', 'mute', 'charm'].includes(e.kind));
  if (held && share && !plan.safe && !blow.silent && t.hp > result.amount)
    result.notes.push(CONDITION_NAMES[held.kind] + ' · 無從還擊');
  const answered =
    share &&
    !held &&
    !plan.safe &&
    !blow.silent &&
    t.hp > result.amount &&
    // 不敗: the blow that brings him to 1 氣血 ends it, as a felling blow would: he does not answer it.
    !(traitsOf(t).unfelled && t.hp - result.amount <= 1) &&
    distance(u, result.push || t) <= reach(s, t);
  // 越女試劍: the first blow each round that would draw a counter draws none.
  if (answered && opens(s, u)) {
    result.opening = true;
    result.notes.push(leaderBoon(s).name + ' · 本回合頭一次，敵人不能還擊');
  } else if (answered) {
    // A 攻勢受挫 or 纏械 the blow puts on him weakens his answer to it (纏械: the producer,
    // 2026-11-25; its −攻擊 only, the reach he answers from is his as the blow came).
    const disarm = !immuneTo(t) && result.effects.find((e) => e.kind === 'disarm');
    const reply =
      art?.debuff?.stat === 'atk' || disarm
        ? {
            ...t,
            conditions: {
              ...t.conditions,
              ...(art?.debuff?.stat === 'atk' && {
                weak: { power: Math.max(t.conditions?.weak?.power || 0, art.debuff.power) }
              }),
              ...(disarm && {
                disarm: { power: Math.max(t.conditions?.disarm?.power || 0, disarm.power) }
              })
            }
          }
        : t;
    if (disarm) result.notes.push('纏械 · 還擊攻擊 −' + reply.conditions.disarm.power);
    // The counter comes once the striker has paid his action's 氣血.
    const after = u.hp - result.hpCost;
    const power = Math.max(2, Math.round(damage(reply, u, false, s?.mapIndex, s, null, basicFor(reply), after) * share));
    result.counterRaw = afterCut(power, stanceCut(s, u));
    // 利劍: his counter lands twice as well.
    const twice = stageOf(t)?.twice;
    if (twice) {
      const second = afterCut(Math.max(1, Math.round(power * twice)), stanceCut(s, u));
      result.counterHits = [result.counterRaw, second];
      result.counterRaw += second;
      result.notes.push(stageOf(t).name + ' · 還擊連出兩下（' + result.counterHits.join(' ＋ ') + '）');
    }
    result.counter = Math.max(0, result.counterRaw - (u.conditions?.shield?.power || 0));
    if (share === 1) result.notes.push('蓄勢反擊 · 還擊全力');
    const traits = traitsOf(t);
    if (traits.crowded && distance(t, u) <= traits.crowded.within)
      result.notes.push('近身失準 · 還擊攻擊 −' + traits.crowded.atk);
    if (traits.execute && after <= u.maxHp / 2)
      result.notes.push('斬殘 · 還擊攻擊 ＋' + executeBonus(s, traits));
    if (traits.lone && alone(s, t)) result.notes.push('孤行 · 還擊攻擊 ＋' + (traits.lone.atk + halfStage(s)));
    if (traits.pincer && flanked(s, t, u))
      result.notes.push('夾衛 · 還擊攻擊 ＋' + (traits.pincer.atk + halfStage(s)));
    if (traits.twin && twinForm(s, t) === 'sabre')
      result.notes.push('陰陽倒亂 · 金刀 · 還擊攻擊 ＋' + (traits.twin.atk + halfStage(s)));
    // The sword's extra tile is what lets it answer a blow from there.
    if (traits.twin && twinForm(s, t) === 'sword' && distance(t, u) === reach(s, t))
      result.notes.push('陰陽倒亂 · 黑劍 · 射程 ＋1，還擊得到');
    if (commandAura(s, t, 'sap'))
      result.notes.push(leaderBoon(s).name + ' · 還擊攻擊 −' + commandAura(s, t, 'sap'));
    // 金剛 on the striker: the counter comes, and takes nothing off him.
    if (immuneTo(u)) {
      result.counterRaw = result.counter = 0;
      result.notes.push('金剛 · 還擊無功');
    }
    // 雪谷回生: a counter that would fell him leaves him at 1 氣血, once a board.
    const standing = u.hp - result.hpCost + result.selfHeal - (result.rebound || 0);
    if (result.counter >= standing && spares(s, u)) {
      result.counter = Math.max(0, standing - 1);
      result.notes.push(leaderBoon(s).name + ' · 留住 1 點氣血（每局一次）');
    }
  }
  if (s && (art?.splash || result.forms.includes('line') || result.forms.includes('arc'))) {
    const targets = secondaryTargets(s, u, t, result.push || t, art, result.forms, walkable);
    const guards = new Set(wardEscorts(s));
    if (result.amount >= t.hp) guards.delete(t);
    const power = baseHits.reduce((a, b) => a + b, 0);
    for (const [v, ratio] of targets) {
      const raw = immuneTo(v) || untouched(u, v)
        ? 0
        : afterWard(Math.max(4, Math.round(power * ratio)), wardShare(s, v, [...guards]));
      const amount = Math.min(v.hp, Math.max(0, raw - (v.conditions?.shield?.power || 0)));
      if (amount >= v.hp) guards.delete(v);
      result.splash.push({ id: v.id, raw, amount });
    }
  }
  // 獅子吼 (`roar`): every other hero within `roar.radius` of the striker loses `roar.hp` 氣血,
  // never below 1; 固守 keeps it off.
  if (s && art?.roar) {
    for (const v of s.units) {
      if (v.id === u.id || !ally(v) || !living(v) || distance(v, u) > art.roar.radius) continue;
      const amount = v.conditions?.fortify ? 0 : Math.min(art.roar.hp, v.hp - 1);
      if (amount > 0) result.roar.push({ id: v.id, amount });
    }
    if (result.roar.length)
      result.notes.push(art.name + ' · ' + result.roar.map((h) => unitDetails(find(s, h.id)).name).join('、') + '各損 ' + art.roar.hp + ' 氣血');
  }
  // The board ends the moment it is won (the producer, 2026-11-25): when the blow's splash fells
  // the last of what must fall, the one it struck has no time to answer.
  if (
    s &&
    result.counterRaw > 0 &&
    ally(u) &&
    winsIfFalls(s, result.splash.filter((hit) => hit.amount >= find(s, hit.id).hp).map((hit) => hit.id))
  ) {
    result.counterRaw = result.counter = 0;
    result.notes.push('一擊定局 · 局已勝，不及還擊');
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
    result.notes.push('反震 · 還擊後震回 ' + result.reflected + ' 氣血');
  }
  // 反震 (軟蝟甲): the counter comes from beside the wearer, so it pricks the one who makes it.
  if (result.counterRaw > 0 && barbsOf(u) && distance(u, result.push || t) === 1) {
    const guards = wardEscorts(s).filter(
      (g) => !result.splash.some((hit) => hit.id === g.id && hit.amount >= g.hp)
    );
    result.barbs = afterWard(barbsOf(u), wardShare(s, t, guards));
    result.notes.push(
      '反震 · 還擊者被軟蝟甲扎傷 ' +
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
  selfLoss(s, u, art, result, true); // 內傷 and 亂氣: what the strike costs its caster after
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
  return Math.min(c.mp + traitStage(s, t), Math.max(0, u.mp - result.mpCost));
}
// The preview of a blow the receiver's guard answers: one that does not land carries none of its
// effects or push; what a 挪移 turns back is shown on the striker, never below 1 氣血.
function answerBlow(s, u, t, blow, result) {
  if (blow.void) {
    result.void = true;
    result.effects = [];
    // 定身, 閉穴 and 受制 ride on the blow: a blow that does not land puts none of them on.
    result.notes = result.notes.filter(
      (n) => !n.endsWith('失去下一次行動') && !result.riders.includes(n)
    );
    result.push = null;
    result.plan = {
      ...result.plan,
      effects: [],
      spentMark: false,
      spentPoison: false,
      clearPoison: false
    };
  }
  if (blow.evaded) {
    result.evaded = true;
    result.notes.push('閃身 · ' + unitDetails(t).name + '閃開此擊，不還擊');
  }
  if (blow.immune) {
    result.immune = true;
    result.notes.push('金剛 · 此擊無功');
  }
  if (blow.solo) {
    result.solo = true;
    result.notes.push(stageOf(t).name + ' · 唯' + DETAILS[stageOf(t).solo].name + '傷得了他，此擊無功');
  }
  if (!blow.ward) return;
  result.turned = { ward: blow.ward, back: blow.back };
  const left = immuneTo(u) ? 0 : Math.max(0, blow.back - (u.conditions?.shield?.power || 0));
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
  // 代價: the price the caster pays until his next turn, one word for all four (Q-N161, P4).
  if (art?.recoil && art.openGuard) notes.push('代價 · 至下回合不能還擊，防禦 −' + art.recoil);
  else if (art?.recoil) notes.push('代價 · 至下回合防禦 −' + art.recoil);
  else if (art?.openGuard) notes.push('代價 · 至下回合不能還擊');
  if (art?.rooted) notes.push('代價 · 下回合不能移動');
  if (art?.spent) notes.push('代價 · 下回合不能施展絕技');
  if (art?.once) notes.push('每局一次');
  if (art?.cooldown) notes.push('施展後隔 ' + art.cooldown + ' 回合');
  return notes;
}
// 35 → 三成半: a share as the ward lines say it.
const shareWords = (n) => (n % 10 === 5 && n > 5 ? tenths(n - 5) + '半' : tenths(n));
const tenths = (n) => (n % 10 ? n + '%' : '一二三四五六七八九'[n / 10 - 1] + '成');
// The guard an art leaves on its caster until his next turn, as the preview states it.
function guardNotes(art) {
  const notes = [];
  if (art?.cover) notes.push('代受 · 至下回合，敵人對相鄰同伴的直接攻擊改由自己承受');
  if (art?.evade) notes.push('閃身 · 下一次直接攻擊落空');
  // 固守 and 金剛 on an art that is not aimed at a companion or himself guard its caster.
  if (art && !isSupport(art)) {
    const until = (n = 1) => (n > 1 ? COUNTS[n] + '個敵方回合內' : '至下回合');
    if (art.fortify)
      notes.push('固守 · ' + until(art.fortify.turns) + '，自身防禦 ＋' + art.fortify.power);
    if (art.immune) notes.push('金剛 · ' + until(art.immune.turns) + '，敵人的直接攻擊對自己無功');
  }
  if (art?.taunt)
    notes.push(
      '挑釁 · 至下回合，' + (COUNTS[art.taunt] || art.taunt) + '格內可攻到他的敵人只能攻擊他'
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
function levelGain(id, level) {
  const row = growthOf(id)?.levels[level - 2];
  return row || (level <= 3 ? LEVEL_GAINS.novice : LEVEL_GAINS.veteran);
}
function addGrowth(u, [atk, def, hp, mp]) {
  u.atk += atk;
  u.def += def;
  u.maxHp += hp;
  if (living(u)) u.hp = Math.min(u.maxHp, u.hp + hp);
  u.maxMp += mp;
  u.mp = Math.min(u.maxMp, u.mp + mp);
}
// Level by level, by the level being reached, so raising several levels at once gives the same
// numbers as raising them one at a time.
function raiseLevel(u, levels) {
  for (let i = 0; i < levels; i++) {
    u.level += 1;
    addGrowth(u, levelGain(u.id, u.level));
  }
}
function settleExperience(s, u) {
  if (!Number.isSafeInteger(u.xp) || u.xp < GROWTH.levelXp) return false;
  const levels = Math.floor(u.xp / GROWTH.levelXp);
  u.xp %= GROWTH.levelXp;
  u.sp += levels;
  raiseLevel(u, levels);
  log(s, 'grow', '升至等級 ' + u.level + '，獲得 ' + levels + ' 武學點。', unitDetails(u).name);
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
  // 金剛: every blow, counter, splash and reflection comes to nothing; poison still bites.
  if (immuneTo(u) && blowNow.how !== 'poison') n = 0;
  if (untouched(source, u)) n = 0; // 無劍: only 無名 can bring this last bar down
  const shield = u.conditions?.shield;
  if (shield) {
    const absorbed = Math.min(shield.power, n);
    n -= absorbed;
    shield.power -= absorbed;
    if (!shield.power) delete u.conditions.shield;
  }
  // 不敗: nothing takes him below 1 氣血.
  let d = Math.min(n, traitsOf(u).unfelled ? Math.max(0, u.hp - 1) : u.hp);
  // 雪谷回生: the first hero it covers who would fall this board is left at 1 氣血.
  if (d > 0 && d >= u.hp && spares(s, u)) {
    d = u.hp - 1;
    s.tally.spared = u.id;
    log(s, 'combat', leaderBoon(s).name + '：留住一口氣，氣血剩 1。', unitDetails(u).name);
  }
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
        ? '一條星索斷了。' + name + '的遮護降至' + shareWords(left) + '。'
        : '星索皆斷，' + name + '再無遮護。',
      '星索'
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
    log(s, 'story', '點亮了引路燈。', unitDetails(u).name);
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
    if (applyCondition(s, target, effect, caster) === false) continue;
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
    '反震' + unitDetails(attacker).name + '，造成 ' + amount + ' 點傷害。',
    unitDetails(victim).name
  );
}
// 反震 (軟蝟甲, `barbs`): a piece that strikes the wearer from the tile beside her, with a blow or a counter
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
  // 護樁: a blow taken for the post it guards does not send its guard off; one aimed at him does.
  const guarding = f.coveredBy && isProp(t);
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
      fresh: t.hp >= t.maxHp, // 一擊斃命: the blow began on a piece at full 氣血
      combo: !!(f.plan.spentMark || f.plan.spentPoison),
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
    if (!ally(t) && !guarding) wakePost(s, t, true); // 坐鎮: a struck piece may leave its post
    if (f.evaded) dodge(s, t, effects);
    if (f.turned) turnBack(s, u, t, f.turned, effects);
    // 布陣 rider: centred where the target stood when struck; a blow that did not land lays none.
    if (art?.zone && !f.void) layZone(s, u, t);
    if (living(t)) {
      if (f.plan.spentMark) delete t.conditions.mark;
      if (f.plan.spentPoison) delete t.conditions.poison;
      if (f.effects.some((e) => e.kind === 'seal')) t.lastSealRound = s.round;
      for (const [kind, c] of Object.entries(CONTROLS))
        if (f.effects.some((e) => e.kind === kind) && unitDetails(t).rank === 'boss')
          t[c.mark] = s.round;
      putEffects(s, u, t, f.effects, effects);
    } else log(s, 'combat', '失去戰力。', unitDetails(t).name);
    // 吸勁 lands before the counter, so a signature it puts back is no longer charged for it.
    applySiphon(s, u, t, f.siphon);
    if (f.contact) {
      u.mp = Math.max(0, u.mp - f.contact); // 化功
      log(s, 'combat', '被化功大法化去 ' + f.contact + ' 點內力。', who);
    }
    if (f.plan.clearPoison) delete u.conditions.poison;
    restoreHealth(s, u, u, f.selfHeal, effects);
    if (f.push) {
      followRoute(t, [{ x: t.x, y: t.y }, f.push]);
      log(s, 'move', art?.push ? '被掌力震退一格。' : '被牽近一格。', unitDetails(t).name);
    }
    if (art?.recover) u.mp = Math.min(u.maxMp, u.mp + art.recover);
    if (f.opening) s.tally.opened = s.round; // 越女試劍 is spent for the round
    for (const other of f.splash) {
      const v = find(s, other.id),
        dealt = blowing({ how: 'splash', art: skill ? id : null }, () => wound(s, v, other.raw, u));
      effects.push([v.id, '−' + dealt]);
      log(s, 'combat', '受到氣勁波及，損失 ' + dealt + ' 點氣血。', unitDetails(v).name);
      if (!ally(v)) wakePost(s, v, true);
    }
    for (const hit of f.roar || []) {
      const v = find(s, hit.id);
      if (!v || !living(v)) continue;
      const lost = Math.min(hit.amount, v.hp - 1);
      if (lost <= 0) continue;
      v.hp -= lost;
      effects.push([v.id, '−' + lost]);
      log(s, 'combat', '被' + art.name + '震得氣血翻湧，損失 ' + lost + ' 點氣血。', unitDetails(v).name);
    }
    // The board ends the moment it is won: nothing that comes after the blow can lose it.
    if (!s.result && KIND_RULES[boardKind(s)].won(s)) check(s);
    if (f.counterRaw && !s.result) {
      const dealt = wound(s, u, f.counterRaw, t);
      effects.push([u.id, '−' + dealt, 'counter']);
      log(s, 'combat', '還擊' + who + '，造成 ' + dealt + ' 點傷害。', unitDetails(t).name);
      reflectStrike(s, u, t, dealt, effects);
      barbStrike(s, u, t, f.barbs, effects); // 反震 (軟蝟甲)
    }
    woundSelfLoss(s, u, effects); // 內傷: the attacker pays once the exchange is over
  }
  if (art?.once) (u.usedOnce ??= []).push(id);
  if (art?.cooldown) (u.cooldowns ??= {})[id] = s.round + art.cooldown + 1;
  if (art && living(u)) {
    const own = selfEffectsOf(art).map((e) =>
      e.kind === 'backlash' ? { ...e, turns: roundLimit(s) - s.round + 1 } : e
    );
    putEffects(s, u, u, backlashBurst(s, u, own, effects), effects); // 亂氣: the third layer bursts
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
  if (!canOutfit(s, u) || !item || !['weapon', 'gear'].includes(item.kind) || (item.owner && item.owner !== u.id))
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
  break: { won: (s) => props(s).length > 0 && !props(s).some(living) },
  // 問劍: every master is at his last point of 氣血. He is 不敗 and does not fall; whoever else
  // stands, the board is over.
  yield: { won: (s) => masterIds(s).every((id) => spent(s, id)) }
};
// 五劍: the stage a piece with `stages` (求敗) is in at `hp` 氣血, or null for any other piece: the
// stage's own fields (its name, colour and what it does, encounters.js) with where it stands.
// Each stage is an equal share of his greatest 氣血, and a bar that empties hands over at once: at
// 80% the second is full. `share` is how full the current bar is; `floor` and `top` are the 氣血
// it runs between. Every rule of the five stages reads the stage through here.
function stageOf(u, hp = u?.hp) {
  const stages = unitDetails(u)?.traits?.stages;
  if (!stages?.length || !(u.maxHp > 0)) return null;
  const n = stages.length,
    left = Math.max(0, Math.min(u.maxHp, hp)),
    index = Math.min(n - 1, Math.floor(((u.maxHp - left) * n) / u.maxHp)),
    span = u.maxHp / n,
    floor = u.maxHp - span * (index + 1);
  return { ...stages[index], index, count: n, share: (left - floor) / span, floor, top: floor + span };
}
// 軟劍's pull in words: to his side (true), or so many tiles nearer.
const pullWords = (pull) => (pull === true ? '扯到身旁' : '扯近 ' + pull + ' 格');
// What a stage does, in one plain line built from its numbers, so the words cannot drift from the
// rule: the tip as he changes swords, his enemy page and the guide's wiki read it.
function stageNote(st) {
  const parts = [];
  if (st.twice) parts.push('每一擊連出兩下，還擊亦然，第二下' + shareWords(Math.round(st.twice * 100)) + '力');
  if (st.reach) parts.push('射程 ' + st.reach + ' 格' + (st.pull ? '，擊中便把人' + pullWords(st.pull) : ''));
  if (st.step != null && !st.turns) parts.push('每回合只走 ' + st.step + ' 步');
  if (st.round)
    parts.push(
      '每一擊都掃及身旁每位俠客（' + shareWords(Math.round(st.round * 100)) + '力）' + (st.shove ? '，並把他們震退一格' : '')
    );
  if (st.pierce) parts.push('代受與固守都擋不住');
  if (st.turns)
    parts.push(
      '每回合行動' + COUNTS[st.turns] + '次' + (st.step === 0 ? '，站定不走，每次出一招' : st.step != null ? '，每次走 ' + st.step + ' 步' : '')
    );
  if (st.unheld) parts.push(st.unheld.map((k) => CONDITION_NAMES[k]).join('、') + '皆不受');
  if (st.cut) parts.push('所受傷害' + (st.cut === 50 ? '減半' : '減' + shareWords(st.cut)));
  if (st.blink) parts.push('每回合出手前，身形一晃便到' + DETAILS[st.solo || YOUTH_ID].name + '身旁');
  if (st.solo) parts.push('唯' + DETAILS[st.solo].name + '傷得了他');
  return parts.join('；');
}
// A master who can be brought no lower: on the board, at 1 氣血 or less.
const spent = (s, id) => {
  const u = s.units.find((v) => v.id === id);
  return !!u && u.hp <= 1;
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
    unhold(s); // 木劍: nothing holds 求敗
    rally(s); // 護駕: those who come to the master's side as his 氣血 falls
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
    } else if (s.round > roundLimit(s)) {
      const n = NUMERALS[roundLimit(s) - 1];
      s.result = 'loss';
      s.reason = s.run ? n + '合已過。拓來的一念撐不住，散了。' : n + '回合已過，霧中的末班渡船已經離岸。';
      s.round = roundLimit(s);
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
// 木劍: whatever held 求敗 as he came to a stage that shrugs it off (`unheld`) comes off him.
function unhold(s) {
  for (const u of enemies(s)) {
    const st = living(u) && u.conditions ? stageOf(u) : null;
    for (const k of st?.unheld || []) if (u.conditions[k]) delete u.conditions[k];
  }
}
function markHalved(s) {
  for (const id of masterIds(s)) {
    const m = s.units.find((v) => v.id === id);
    if (!m || m.halved || m.hp > m.maxHp / 2) continue;
    m.halved = true;
    if (id === commanderId(s)) s.foreshadow = true;
    // 問劍: a master brought from above half straight to his last point does not change; it is over.
    if (living(m) && !(boardKind(s) === 'yield' && spent(s, id))) shiftPhase(s, m);
    fireHalved(s, id);
  }
}
// Where the board's objective stands: the masters still living, the enemies still standing, and
// the wave pieces still able to come. The interface and the simulator read progress here.
function objectiveLeft(s) {
  return {
    masters: masterIds(s).filter((id) => !fallen(s, id) && !(boardKind(s) === 'yield' && spent(s, id))),
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
  // 問劍: no one falls; whether a blow ends it is asked of the 氣血 it would leave (winsIfLeft).
  if (kind === 'yield') return masterIds(s).every((id) => spent(s, id));
  if (kind === 'break') return props(s).every((u) => down(u.id));
  if (enemies(s).some((u) => living(u) && !gone.has(u.id))) return false;
  // A master felled now marks his half and may call a wave.
  const halved = (id) => gone.has(id) || !!s.units.find((v) => v.id === id)?.halved;
  return wavesLeft(s, halved) === 0;
}
// ── Facts a secondary objective reads (journey.js SIDE_KINDS) ────────────
// `s.tally` is kept from the moment a run's board is set up; a game without one records nothing.
const blankTally = () => ({
  falls: [], // every enemy fall, in order: { id, by, how, art, combo, answered, fresh, round, phase }
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
    fresh: !!blowNow.fresh,
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
  // A wave of masters only (the last board's) is named man by man: 血刀老祖、歐陽鋒.
  if (defs.length > 1 && defs.every((def) => named(def).rank === 'boss')) return defs.map((def) => named(def).name).join('、');
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
// 護駕 (the last board): a wave that waits on the board's master (`when.stage`, a stage of his
// 五劍) enters the moment he comes to it, on the free tiles nearest him (those nearer the
// heroes first), unhurt and unacted, so its pieces act in the enemy phase that follows. A piece
// with nowhere to stand within three tiles comes at the next check. No round announces them.
function besideTile(s, m) {
  const heroes = party(s).filter(living);
  const near = (c) => Math.min(99, ...heroes.map((h) => distance(c, h)));
  return (
    fieldCells(s.mapIndex)
      .filter((c) => walkable(c.x, c.y, s.mapIndex) && !at(s, c.x, c.y) && distance(c, m) >= 1 && distance(c, m) <= 3)
      .sort((a, b) => distance(a, m) - distance(b, m) || near(a) - near(b) || a.y - b.y || a.x - b.x)[0] || null
  );
}
function rally(s) {
  const m = find(s, commanderId(s));
  if (s.result || !m || !living(m) || (boardKind(s) === 'yield' && spent(s, m.id))) return;
  let told = false; // one blow past both shares calls both waves, with the story line said once
  for (const w of boardOf(s).waves) {
    if (w.when.stage == null || !((stageOf(m)?.index ?? -1) >= w.when.stage)) continue;
    const came = [];
    for (const piece of w.pieces) {
      if (entered(s, piece.id)) continue;
      const tile = besideTile(s, m);
      if (!tile) break;
      const u = pieceUnit(s, { ...piece, at: [tile.x, tile.y] }, s.round);
      s.units.push(u);
      came.push(piece);
      noteStanding(s, u);
    }
    if (!came.length) continue;
    if (s.run && boardOf(s).last && !told) log(s, 'story', MAZE_TALE.finale.rally, YOUTH.role);
    told = true;
    log(s, 'system', waveList(came) + '趕到' + unitDetails(m).name + '身旁。', '敵援');
    for (const piece of came) strangerSteps(s, piece.id);
  }
}
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
    if (held && s.round < roundLimit(s)) s.arrivals[w.id] = s.round + 1;
    else delete s.arrivals[w.id];
  }
}
// A named black stone steps on during the battle: what he says, what a stone already there says
// to that, and what a fielded hero from his series of books answers (encounter-script.js extras).
function strangerSteps(s, id) {
  if (s.run && boardOf(s).last) {
    const line = guestLine(id);
    if (line) log(s, 'story', line, DETAILS[id].name);
    return;
  }
  const lines = s.run && ENCOUNTER_SCRIPT[s.mapIndex]?.extras?.[id];
  if (!lines?.enter) return;
  log(s, 'story', lines.enter, DETAILS[id].name);
  const other = lines.reply && find(s, refId(s.mapIndex, { boss: 'master', mini: 'lieutenant' }[lines.reply.who] || lines.reply.who));
  if (other && living(other)) log(s, 'story', lines.reply.text, unitDetails(other).name);
  for (const u of party(s))
    if (living(u) && lines.heroes?.[u.id]) log(s, 'story', lines.heroes[u.id], DETAILS[u.id].name);
}
// What a board's master says on the last board, where he stands of his own accord: his own
// board's line (encounter-script.js `guest`), so a new board brings its master's with it.
function guestLine(id) {
  const map = CAPTAINS.findIndex(([captain]) => captain === id);
  return (map >= 0 && ENCOUNTER_SCRIPT[map]?.guest) || '';
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
      // 求敗 sets a stone down: the sound comes a round before the person. (The last board has
      // no such waves: those who come there walk on of their own accord, at once: rally.)
      if (s.run) log(s, 'story', shade(MAZE_TALE.clack, s.run.plus), acrossTable(s.run.plus).name);
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
    if (s.round + 2 > roundLimit(s) || !s.arrivals) continue;
    s.arrivals[w.id] = s.round + 2;
    const name = unitDetails(find(s, id)).name;
    // 求敗 answers a stone in danger.
    if (s.run) log(s, 'story', shade(MAZE_TALE.clackSave, s.run.plus), acrossTable(s.run.plus).name);
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
  if (p.say) log(s, 'story', p.say, unitDetails(u).name);
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
// The radius is measured from where the taunter stands as u begins to act, not where he cast it:
// a taunter pulled or pushed in the enemy phase binds from his new tile.
function taunters(s, u, cells = null, range = strikeReach(s, u)) {
  if (holdsFire(u)) return []; // 定身, 閉穴: it strikes no one; 受制: none of the heroes
  cells ??= [u, ...Array.from(reachable(s, u).keys(), (k) => fromKey(k))];
  return party(s).filter(
    (t) =>
      living(t) &&
      t.conditions?.taunt &&
      distance(u, t) <= t.conditions.taunt.power &&
      cells.some((c) => distance(c, t) <= range)
  );
}
// How little an enemy wants to strike hero t: lower is the better target. A piece that cuts the
// blows it takes counts its 氣血 as the cut makes it last. A covered hero is scored as the one who would take the blow.
function aimCost(s, u, t, friends, walk) {
  const lean = preference(s, u, t, friends, walk); // 偏好: whom this villain looks for
  // 轉折, and 重劍's pierce: no one takes its blow for another.
  t = (!traitsOf(u).bend && !stageOf(u)?.pierce && coverer(s, t)) || t;
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
    case 'sheltered':
      return tileInfo(t.x, t.y, s.mapIndex).defense > 0 || coverer(s, t) ? -35 : 0;
    default:
      return 0;
  }
}
// What an enemy holds against striking hero t beyond his 氣血: under 閃身 the blow is wasted, and
// a 挪移 ward would turn up to half of it back.
function wariness(s, u, t) {
  let cost = t.conditions?.evade || immuneTo(t) ? 200 : 0; // 閃身, 金剛: the blow is wasted
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
  // 木劍: 求敗 acts again at once, a whole move and a whole strike, once a round.
  if ((stageOf(u)?.turns || 1) > 1 && living(u) && !s.result && u.againRound !== s.round) {
    u.againRound = s.round;
    u.acted = false;
    u.moved = false;
    log(s, 'combat', stageOf(u).name + '在手，再走一手。', unitDetails(u).name);
  }
  return effects;
}
// 無劍: before he acts, 求敗 is beside 無名 at once: on the free tile beside him with the fewest
// other heroes beside it (then the most of his own, then the nearest the top of the board, then
// the left); if none is free, on the free tile nearest 無名 by the same order. Already beside him,
// he stays. A move, not a walk: nothing on the way stops him, and it is his once a round.
function blinkTile(s, u, st) {
  const mark = find(s, st.solo || YOUTH_ID);
  if (!mark || !living(mark) || distance(u, mark) <= 1) return null;
  const heroes = party(s).filter((v) => v !== mark && living(v)),
    own = enemies(s).filter((v) => v !== u && living(v));
  const order = (c) => [
    distance(c, mark),
    heroes.filter((v) => distance(v, c) === 1).length,
    -own.filter((v) => distance(v, c) === 1).length,
    c.y,
    c.x
  ];
  let best = null;
  for (const c of fieldCells(s.mapIndex)) {
    if (!walkable(c.x, c.y, s.mapIndex) || at(s, c.x, c.y)) continue;
    const rank = order(c);
    if (!best || before(rank, best.rank)) best = { x: c.x, y: c.y, rank };
  }
  return best;
}
function blink(s, u, st) {
  if (u.blinkRound === s.round) return;
  u.blinkRound = s.round;
  const to = blinkTile(s, u, st);
  if (!to) return;
  if (s.run && boardOf(s).last && !u.blinked) log(s, 'story', MAZE_TALE.finale.blink, YOUTH.role);
  u.blinked = true;
  delete u.route;
  u.x = to.x;
  u.y = to.y;
  u.blinkSerial = (u.blinkSerial || 0) + 1;
  log(s, 'move', '身形一晃，已到了' + unitDetails(find(s, st.solo || YOUTH_ID)).name + '身旁。', unitDetails(u).name);
}
function enemyAction(s, u) {
  if (u.conditions?.freeze) return frozenTurn(s, u); // 定身: no move, no blow
  if (charmed(u)) return charmAction(s, u); // 受制: it fights its own side
  // 五劍: the stage 求敗 is in as his action begins decides how it goes.
  const st = stageOf(u);
  if (st?.blink) blink(s, u, st); // 無劍: to 無名's side first
  const muted = !!u.conditions?.mute; // 閉穴: it walks as its kind does, and strikes no one
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
  // 護駕 (the last board): once the masters guard 求敗 (木劍 on), they keep to his side.
  const liege = u.guest ? pressed(s) : null;
  // 挑釁: a taunter it can strike this turn is all it may choose from.
  const bound = taunters(s, u, cells, range),
    prey = bound.length ? bound : [...friends, ...kept];
  for (const c of cells)
    for (const t of prey) {
      const d = distance(c, t),
        can = !muted && d <= range,
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
          // 護駕: beside the one it guards, or failing that a step away.
          (liege ? [0, 320, 120][distance(c, liege)] || 0 : 0) +
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
    else if (liege) log(s, 'move', '守在' + unitDetails(liege).name + '身旁。', unitDetails(u).name);
    else if (!hold) log(s, 'move', '逼近我方陣地。', unitDetails(u).name);
    else if (u.moved) log(s, 'move', '退回崗位。', unitDetails(u).name);
    return [];
  }
  wakePost(s, u, false); // 坐鎮: a piece that wakes on striking leaves its post for good
  // 代受: the piece it chose may have someone beside it who takes the blow instead.
  // 轉折: a `bend` villain's blow lands on the one it chose; so does 求敗's in 重劍.
  const t = isProp(best.t) || traitsOf(u).bend || st?.pierce ? best.t : takeCover(s, best.t);
  if (t.conditions?.taunt) progress(t, 'protects', 1); // 挑釁: the blow he drew
  const art = strikingSignature(s, u);
  const raw = damage(u, t, false, s.mapIndex, s);
  const strikePower = art ? Math.round(raw * art.factor) : raw;
  // 利劍: 求敗's strike lands twice, the second at the stage's share.
  const twice = st?.twice && !isProp(t) ? Math.max(1, Math.round(strikePower * st.twice)) : 0;
  const blow = received(s, t, twice ? [strikePower, twice] : [strikePower], u);
  // An enemy blow that reaches a hero (not one 閃身 makes miss) counts toward 'struck', the
  // record 向問天's summit is gated on (0.50).
  if (ally(t) && !blow.evaded) progress(t, 'struck', 1);
  const effects = [];
  let n = 0;
  for (const hit of blow.hits) {
    if (!living(t)) break;
    const dealt = wound(s, t, hit, u);
    n += dealt;
    effects.push([t.id, '−' + dealt]);
  }
  // 還報 counts only 氣血 an enemy's own action took, never what a shield caught.
  if (n) t.hurtRound = s.round;
  effects.signature = !!art; // for the board: a signature blow or a plain one
  let drag = false;
  const attack = art?.name || basicFor(u).name;
  log(
    s,
    'combat',
    '以「' + attack + '」擊中' + unitDetails(t).name + (twice ? '，' + st.name + '連出兩下' : '') + '，造成 ' + n + ' 點傷害。',
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
      // (In 重劍 those beside 求敗 himself take his stage's sweep instead, below.)
      const round = (v) => st?.round && distance(v, u) === 1;
      for (const other of friends.filter((v) => v !== t && living(v) && distance(v, t) === 1 && !round(v))) {
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
      drag = !!traitsOf(u).pull; // 擒拿: once the exchange is over
    }
    if (lineKind(art)) lineThrough(s, u, t, strikePower, effects); // 穿行
  } else if (living(t) && !blow.void && !isProp(t)) {
    basicPoison(s, u, t, effects); // 蛇毒
    basicRiders(s, u, t, effects); // 步裡藏毒, 墜網
  }
  if (st?.round) roundSweep(s, u, t, strikePower, st, friends, effects); // 重劍
  reflectStrike(s, t, u, n, effects);
  if (barbsOf(t) && !blow.void && distance(u, t) === 1)
    barbStrike(s, t, u, afterWard(barbsOf(t), wardPercent(s, u)), effects); // 反震 (軟蝟甲)
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
  // 分刺: the second needle, once the first blow's exchange is over (and only if it still stands).
  secondNeedle(s, u, t, strikePower, friends, effects);
  woundSelfLoss(s, u, effects); // 內傷: the attacker pays once the exchange is over
  // 擒拿: the hero is dragged in after his counter and 軟蝟甲 were judged from where he was struck.
  // 軟劍: so is anyone 求敗's blow lands on in that stage.
  if (drag) dragNear(s, u, t);
  else if (st?.pull && !blow.void && !isProp(t)) dragNear(s, u, t, st.name, st.pull === true ? Infinity : st.pull);
  // 重劍: then everyone beside him is thrown back a tile.
  if (st?.shove) shoveAll(s, u, friends);
  // 游擊: having struck, it walks off with what steps it has left.
  if (unitDetails(u)?.traits?.glide) glideAway(s, u, best.c.n, step);
  check(s);
  return effects;
}
// Whether ranking a comes before ranking b: the first term that differs decides.
function before(a, b) {
  const i = a.findIndex((n, j) => n !== b[j]);
  return i >= 0 && a[i] < b[i];
}
// 受制 in the enemy phase: the piece strikes, with its plain attack, the nearest uncharmed enemy
// it can reach this turn (the nearest as the crow flies, then the fewest steps, then north, then
// west); with none in reach it walks toward the nearest it can get to; with none left, or no way
// to any, it stands. The piece struck counters by the ordinary rules. Under 閉穴 too it only walks.
function charmAction(s, u) {
  u.acted = true;
  const foes = enemies(s).filter((v) => v !== u && living(v) && !charmed(v));
  if (!foes.length) return [];
  const field = availableField(s, u),
    cells = walkCells(s, u, field),
    range = reach(s, u),
    muted = !!u.conditions?.mute;
  let best = null;
  for (const v of foes) {
    const posts = fieldCells(s.mapIndex).filter((c) => {
      const occ = at(s, c.x, c.y);
      return walkable(c.x, c.y, s.mapIndex) && (!occ || occ === u) && distance(c, v) <= range;
    });
    const left = movementField(s, u, posts, Infinity, true).costs;
    for (const c of cells) {
      const can = !muted && distance(c, v) <= range;
      const rank = [
        can ? 0 : 1,
        can ? distance(u, v) : (left.get(key(c.x, c.y)) ?? Infinity),
        c.n,
        v.y,
        v.x
      ];
      if (!best || before(rank, best.rank)) best = { c, v, can, rank };
    }
  }
  const name = unitDetails(u).name;
  if (!best || (!best.can && best.rank[1] === Infinity)) return [];
  u.moved = distance(u, best.c) > 0;
  if (u.moved) followRoute(u, tracePath(field, best.c));
  if (!best.can) {
    log(s, 'move', '受制倒戈，走向' + unitDetails(best.v).name + '。', name);
    return [];
  }
  const t = best.v;
  const blow = received(s, t, [damage(u, t, false, s.mapIndex, s)]);
  const n = wound(s, t, blow.hits[0], u);
  const effects = [[t.id, '−' + n]];
  effects.signature = false;
  log(s, 'combat', '受制倒戈，以「' + basicFor(u).name + '」擊中' + unitDetails(t).name + '，造成 ' + n + ' 點傷害。', name);
  if (blow.evaded) dodge(s, t, effects);
  if (blow.ward) turnBack(s, u, t, blow, effects);
  const share = counterRatio(s, t);
  if (!living(t)) log(s, 'combat', '失去戰力。', unitDetails(t).name);
  else if (living(u) && !blow.silent && !t.conditions?.seal && distance(u, t) <= reach(s, t) && share) {
    const power = Math.max(2, Math.round(damage(t, u, false, s.mapIndex, s) * share));
    const hit = blowing({ how: 'counter' }, () =>
      wound(s, u, afterCut(afterWard(power, wardPercent(s, u)), stanceCut(s, u)), t)
    );
    effects.push([u.id, '−' + hit]);
    log(s, 'combat', '還擊，造成 ' + hit + ' 點傷害。', unitDetails(t).name);
  }
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
    if (!living(v) || charmed(v) || v.hp >= v.maxHp * 0.7) continue;
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
// shield does.
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
// 步裡藏毒 (`stepPoison`): a plain blow struck after walking poisons, stronger by half the stage; one
// struck from where the piece stood does not. 墜網 (`snare`): a plain blow leaves the hero 絆足.
// Neither rides a counter or a signature.
function basicRiders(s, u, t, effects) {
  const { stepPoison, snare } = traitsOf(u);
  if (stepPoison && u.moved)
    putEffects(
      s,
      u,
      t,
      [{ kind: 'poison', power: stepPoison.power + halfStage(s), turns: stepPoison.turns || 2 }],
      effects
    );
  if (snare) putEffects(s, u, t, [{ kind: 'pin', power: snare.power, turns: snare.turns || 2 }], effects);
}
// 分刺 (`flurry`): after its blow, plain or signature, the villain strikes one more hero within its
// reach of where it stands — the one it would rather strike, never the one just struck — for its
// share of the first blow. Like a blow that passes through, no 代受, 閃身 or 挪移 meets it and it
// draws no counter; the hero's shield does meet it.
function secondNeedle(s, u, first, strikePower, friends, effects) {
  const flurry = traitsOf(u).flurry;
  if (!flurry || !living(u)) return;
  const range = reach(s, u);
  const others = friends.filter((v) => v !== first && living(v) && distance(u, v) <= range);
  if (!others.length) return;
  const v = others.reduce((a, b) => (aimCost(s, u, b, friends, 0) < aimCost(s, u, a, friends, 0) ? b : a));
  const n = wound(
    s,
    v,
    afterCut(Math.max(1, Math.round(strikePower * flurry.share)), stanceCut(s, v)),
    u
  );
  if (n) v.hurtRound = s.round;
  effects.push([v.id, '−' + n]);
  noteFired(s, 'flurry');
  log(s, 'combat', '針影一分，再刺' + unitDetails(v).name + '，造成 ' + n + ' 點傷害。', unitDetails(u).name);
  if (!living(v)) log(s, 'combat', '負傷退場。', unitDetails(v).name);
}
// 擒拿 (`pull`): the signature drags the hero it landed on to the free tile beside the villain that
// is nearest where the hero stood. A hero already beside it, or with no free tile to come to, stays.
// It comes after the exchange: whether he counters is judged from where he was struck. The board
// plays the drag along his walk there when that is nearly straight, and as a jump otherwise.
function dragNear(s, u, t, how = '', most = Infinity) {
  if (!living(t) || !living(u) || distance(u, t) <= 1) return;
  // 軟劍 (`most` tiles at most): the free tile that far from where he stood that is nearest the
  // villain, then nearest where he stood; 擒拿, the free tile beside the villain nearest him.
  const near = Number.isFinite(most);
  const tiles = near
    ? fieldCells(s.mapIndex).filter((p) => distance(p, t) <= most && distance(p, u) >= 1 && distance(p, u) < distance(t, u))
    : adjacent.map(([dx, dy]) => ({ x: u.x + dx, y: u.y + dy }));
  let best = null;
  for (const p of tiles) {
    if (!walkable(p.x, p.y, s.mapIndex) || at(s, p.x, p.y)) continue;
    if (!best || (distance(p, u) - distance(best, u) || distance(p, t) - distance(best, t)) < 0) best = { x: p.x, y: p.y };
  }
  if (!best) return;
  const from = { x: t.x, y: t.y },
    path = movementPath(s, t, from, best);
  if (routeConnects(path, from, best, s.mapIndex) && path.length - 1 <= distance(from, best) + 2)
    followRoute(t, path);
  else {
    delete t.route;
    t.x = best.x;
    t.y = best.y;
  }
  noteFired(s, 'pull');
  const name = unitDetails(u).name;
  log(
    s,
    'combat',
    how
      ? how + '一捲，' + (distance(t, u) === 1 ? '給扯到' + name + '身前。' : '給扯近' + distance(from, t) + '格。')
      : '給一把扯到' + name + '身前。',
    unitDetails(t).name
  );
}
// 重劍: 求敗's blow also strikes every other hero beside him, at the stage's share of it, through
// 代受 like any blow of his in that stage; each one's 固守 and 護盾 still meet it.
function roundSweep(s, u, t, strikePower, st, friends, effects) {
  for (const v of friends.filter((v) => v !== t && living(v) && distance(v, u) === 1)) {
    const n = wound(s, v, afterCut(Math.max(1, Math.round(strikePower * st.round)), stanceCut(s, v)), u);
    if (n) v.hurtRound = s.round;
    effects.push([v.id, '−' + n]);
    log(s, 'combat', '被' + st.name + '的劍勢掃中，損失 ' + n + ' 點氣血。', unitDetails(v).name);
    if (!living(v)) log(s, 'combat', '負傷退場。', unitDetails(v).name);
  }
}
// 重劍: after the exchange every hero beside 求敗 is thrown a tile straight back from him, if that
// tile is open ground and free; one with his back to a wall or a piece stays.
function shoveAll(s, u, friends) {
  if (!living(u)) return;
  for (const v of friends.filter((v) => living(v) && distance(v, u) === 1)) {
    const to = { x: v.x + Math.sign(v.x - u.x), y: v.y + Math.sign(v.y - u.y) };
    if (!walkable(to.x, to.y, s.mapIndex) || at(s, to.x, to.y)) continue;
    followRoute(v, [{ x: v.x, y: v.y }, to]);
    log(s, 'move', '被劍勢震退一格。', unitDetails(v).name);
  }
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
    // 中毒: the layers still running bite once, together; the newest layer's caster is credited.
    if (poison) {
      poison.layers = poisonLayers(poison).filter((l) => l.through >= s.round);
      poison.power = poison.layers.reduce((n, l) => n + l.power, 0);
      poison.source = poison.layers.at(-1)?.source ?? poison.source;
    }
    if (poison?.power > 0) {
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

export { stageOf, stageNote, traitStage, YOUTH_ID, ROSTER, LAST_MAP, hasFour, fixedSlots, castBoard, armOf, answers, guestLine, spent, wound, ARM_NAMES };
export { charmed, sideOf, immuneTo, holdsFire, drainOf, controlPlan, isProp, propKind, props, hostile, boardKind, propUnit, propUnits, holdLeft, brokenKeep, OBJECT_NOTE, announcedWaves, refKey, pieceLines, traitEdge, stanceHolds, KIND_RULES, objectiveLeft, winsIfFalls, wavesLeft, scheduleWaves, waveList, entryTile, arrivalGhosts, pendingWaves, arrive, announce, blankTally, inZone, SLOTS, NUMERALS, slotId, refId, pieceKey, LEGACY_BOARD, boardOf, masterIds, pieceDef, homeTile, stageRows, pieceUnit, boardLines, fleeing, mendPlan, lineVictim, wardShare, preference, traitsOf, holdOf, postTile, standCells, walkCells, signatureLines, strikeReachWhenDue, SIZE, FIELD_EDITION, LIMIT, MAX_ROUNDS, roundLimit, GROWTH, ORIGINAL_PARTY, PARTY, BOOKS, leader, key, distance, living, ally, at, find, party, company, commanderId, enemies, canAct, canPrepare, canOutfit, managesCompany, valid, terrainInfo, terrain, cover, walkable, ITEMS, TALENTS, DETAILS, encounterKeys, identifyEncounter, withMods, unitDetails, enemyTechnique, roundsToSignature, signatureDue, siphonPlan, reach, zoneAt, zoneTiles, layZone, standingLines, strikeReach, counterRatio, stanceCut, coverer, redirectOf, taunters, canGlide, glideField, glideMove, stopGlide, enemyTraitLines, STORIES, chapterScenes, makeUnit, startingHero, newGame, fitFormation, restoreGame, log, stat, artFor, rangeFor, commandDiscount, cost, artCost, basicFor, equippedArts, targetType, artReady, canPay, isSupport, canConfigure, reachable, movementPath, routeConnects, canMove, move, undo, affectedFriends, targetOK, PARTNERS, strikeFactor, priceNotes, guardNotes, attackPower, damage, healingPower, healing, healAmount, woundSelfLoss, formsFor, pushCell, wardEscorts, forecast, raiseLevel, settleExperience, exp, LEVEL_GAINS, GROWTH_PACES, GROWTH_PROFILES, growthOf, levelGain, objectiveTile, unclaimedObjectiveTile, holdObjective, resolve, waitUnit, canUseMedicine, consume, equip, transferEquipment, train, check, startEnemy, enemyAct, nextRound, medicineFor, seatOf, seatRow, seatNumbers, twinForm };
