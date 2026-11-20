import { ART_FORMS, WEAPON_FORMS } from '../data/form-catalog.js';
import {
  actionForms,
  contactPlan,
  forcedStep,
  secondaryTargets,
  supportEntry,
  weaponFormText
} from './form-rules.js';
import { ENCOUNTERS, RANKS, STATUS_POWER, SIGNATURE_RULES, VILLAIN_FORMS } from '../data/encounters.js';
import { NEW_HEROES } from '../data/new-heroes.js';
import {
  commandBonus,
  effectsOf,
  selfEffectsOf,
  applyCondition,
  CONDITION_NAMES,
  progress
} from './battle-mastery.js';
import { FIELD_SIZE, fieldCells, mapLayout, validTile, tileInfo } from '../data/terrain.js';
import { TECHNIQUES, WARES, CAPTAINS } from '../data/martial-arts.js';
import { CHAMBER_TALES } from '../data/maze-tale.js';
const SIZE = FIELD_SIZE;
const FIELD_EDITION = 1;
const LIMIT = 12;
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
const distance = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const living = (u) => u.hp > 0;
const ally = (u) => u.side === 'ally';
const at = (s, x, y) => s.units.find((u) => living(u) && u.x === x && u.y === y);
const find = (s, id) =>
  s.units.find((u) => u.id === id) || s.run?.bench?.find((u) => u.id === id);
const party = (s) => s.units.filter(ally);
const company = (s) => [...party(s), ...(s.run?.bench || [])];
const commanderId = (s) => (s.run ? CAPTAINS[s.mapIndex][0] : 'chief');
const enemies = (s) => s.units.filter((u) => !ally(u));
const canAct = (s, u) =>
  !!u &&
  (!s.run?.scene || s.run.scene === 'fight') &&
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
    bio: '華山派大弟子，生性灑脫而重情義。思過崖上得風清揚指點，以獨孤九劍擇人劍勢中的破綻。',
    basic: '華山劍法',
    skill: '獨孤九劍',
    skillIcon: 'sword',
    skillDesc: '看破劍勢，搶步直取破綻，可攻擊兩格內的一名敵人。',
    skillRange: 2,
    cost: 14
  },
  medic: {
    name: '任盈盈',
    role: '琴師',
    school: '日月神教',
    mini: 'medic',
    portrait: 'medic',
    epithet: '綠竹知音',
    bio: '日月神教聖姑，精於琴簫。她在洛陽綠竹巷以琴音為令狐冲療傷，兩人由一卷曲譜結緣。',
    basic: '日月短劍',
    skill: '清心普善咒',
    skillIcon: 'leaf',
    skillDesc: '為三格內一位友軍回復氣血，也可為自己施術。',
    skillRange: 3,
    cost: 12
  },
  guard: {
    name: '向問天',
    role: '豪俠',
    school: '日月神教',
    mini: 'guard',
    portrait: 'guard',
    epithet: '天王老子',
    bio: '人稱「天王老子」，是任我行的親信。他使鞭剛猛，曾與令狐冲並肩脫險，兩人從此肝膽相照。',
    basic: '鐵鞭橫江',
    skill: '吸功入地小法',
    skillIcon: 'spark',
    skillDesc: '借力卸勁，重擊相鄰敵人。餘勁波及目標身旁敵軍，本次交鋒免受反擊。',
    skillRange: 1,
    cost: 16
  },
  guo: {
    name: '郭靖',
    role: '掌俠',
    school: '江南七怪門下',
    mini: 'guo',
    portrait: 'guo',
    epithet: '大漠俠士',
    bio: '自幼長於漠北，後隨洪七公修習降龍十八掌，鎮守襄陽多年。他應帖的理由很簡單：有人喊救命。',
    basic: '南山掌法',
    skill: '降龍十八掌',
    skillIcon: 'hand',
    skillDesc: '使一招亢龍有悔。擊中兩格內敵人後，若身後地格空置，將其擊退一格再判定還擊。',
    skillRange: 2,
    cost: 17
  },
  xiao: {
    name: '小龍女',
    role: '雙劍',
    school: '古墓派',
    mini: 'xiao',
    portrait: 'xiao',
    epithet: '古墓清影',
    bio: '古墓派傳人。習得左右互搏後，她能以雙手合使玉女素心劍法，一人分擔兩條劍路。',
    basic: '玉女劍法',
    skill: '玉女素心劍法',
    skillIcon: 'swords',
    skillDesc: '以雙劍各擊一次，每劍獨立扣除氣血。目標撐過兩劍才有機會還擊。',
    skillRange: 1,
    cost: 15
  },
  duan: {
    name: '段譽',
    role: '劍氣',
    school: '大理段氏',
    mini: 'duan',
    portrait: 'duan',
    epithet: '大理公子',
    bio: '大理段氏子弟，擅凌波微步與六脈神劍。他把這趟稀奇的際遇當作又一場白日夢，照樣向人人作揖。',
    basic: '點指截脈',
    skill: '六脈神劍',
    skillIcon: 'spark',
    skillDesc: '以指發出無形劍氣，可攻擊四格內敵人，並穿透一半防禦。',
    skillRange: 4,
    cost: 20
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
function identifyEncounter(s) {
  if (!s.run) return;
  const keys = encounterKeys(s.mapIndex);
  for (const u of s.units) {
    const role = ['blade', 'bow', 'scout'].indexOf(u.id.replace(/^echo/, '').toLowerCase());
    if (!ally(u) && role >= 0) u.encounterId = keys[role + 1];
  }
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
  const sig = info.traits?.sig || {},
    stage = Object.keys(info.traits || {}).length ? s?.run?.stage || 0 : 0;
  const status = {
    power: sig.power ?? STATUS_POWER[info.style]?.(stage),
    turns: sig.turns ?? 2
  };
  return {
    ...status,
    reach: sig.reach || 0,
    cadence: sig.cadence || 3,
    extra: sig.extra || null,
    name: info.skill,
    factor: VILLAIN_FORMS[info.skill][0],
    stroke: VILLAIN_FORMS[info.skill][1],
    visual: info.visual,
    tier: info.rank === 'boss' ? 4 : 3,
    style: info.style,
    family:
      info.style === 'poison'
        ? 'poison'
        : info.style === 'weak' || info.style === 'exposed'
          ? 'debuff'
          : null,
    note: SIGNATURE_RULES[info.style]?.(status) || '',
    offset: info.rank === 'boss' ? 0 : 1
  };
}
// `signaturePush` counts the rounds a hero's 吸勁 has put the signature back since it last fired.
function roundsToSignature(s, u) {
  const art = enemyTechnique(u, s);
  if (!art) return null;
  const first = art.offset > 0 || s.run?.stage >= 5 ? 2 : 3;
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
const PREFERS = {
  wounded: '專挑傷重者',
  isolated: '專挑落單者',
  leader: '專挑領隊',
  healer: '專挑療傷者',
  mp: '專挑內力深厚者',
  nearest: '見人就撲'
};
const tileName = (p) => '（' + (p.x + 1) + '，' + (p.y + 1) + '）';
// The enemy page's account of how this piece differs from the others: one line per trait.
function enemyTraitLines(s, u) {
  const info = unitDetails(u),
    t = info?.traits || {},
    stage = s.run?.stage || 0,
    lines = [];
  const master = unitDetails(find(s, commanderId(s)))?.name;
  const sig = enemyTechnique(u, s);
  if (sig?.reach) lines.push('絕技射程 ' + sig.reach + ' 格');
  if (sig?.extra === 'pin') lines.push('絕技絆足 · 中招者移動 −2，2 回合');
  if (sig?.extra === 'wound') lines.push('絕技內傷 · 中招者療傷減半，出手後自損 5，2 回合');
  if (sig?.extra === 'line') lines.push('絕技穿行 · 目標身後兩格內首名俠客受一半傷害（危險區不顯示）');
  if (t.post?.tile === 'master') lines.push('護駕 · 每回合先回到' + master + '身旁');
  else if (t.post && !u.woke) {
    const index = encounterKeys(s.mapIndex).indexOf(u.encounterId || u.id);
    const tile = t.post.tile === 'spawn' ? mapLayout(s.mapIndex).enemies[index] : t.post.tile;
    lines.push(
      '坐鎮 · 守在' +
        tileName(tile) +
        (t.post.tether ? t.post.tether + ' 格內' : '') +
        '；有俠客踏入攻擊範圍才出手' +
        (t.post.wake ? '，受擊或出手後離位追擊' : '')
    );
  }
  if (t.phase) lines.push('半血變招 · ' + (t.phase.note || t.phase.log || ''));
  if (t.prefers) lines.push(PREFERS[t.prefers]);
  if (t.stance)
    lines.push('蓄勢反擊 · 蓄勢時兩格內受擊必以全力還擊' + (t.stance.holds ? '，且原地不動' : ''));
  if (t.redirect) lines.push('斗轉星移 · 蓄勢時第一次受到的直接攻擊全數反震一半給出手者');
  if (t.contact) lines.push('化功 · 貼身打中他的俠客損失 ' + (t.contact.mp + stage) + ' 內力');
  if (t.banner) lines.push('盟令 · 存活時其餘敵人攻擊 ＋' + (t.banner.atk + stage));
  if (t.cover === 'master') lines.push('代受 · 相鄰的' + master + '受到直接攻擊時，由他代受');
  const guards = enemies(s).filter(
    (v) => v !== u && living(v) && unitDetails(v)?.traits?.cover === 'master'
  );
  if (u.id === commanderId(s) && guards.length)
    lines.push(
      '代受 · 身旁的' + [...new Set(guards.map((v) => unitDetails(v).name))].join('、') + '替他承受直接攻擊'
    );
  if (t.glide) lines.push('游擊 · 出手後退開至多 ' + t.glide + ' 步');
  if (t.basicPoison)
    lines.push(
      '毒手 · 普攻令目標中毒，兩次毒發各損 ' +
        (t.basicPoison.power + Math.floor(stage / 2)) +
        ' 氣血'
    );
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
  huang: [99, 70, 21, 9, 4, 2, 'jadeCane'],
  yang: [137, 57, 26, 12, 4, 1, 'darkIron'],
  zhang: [125, 78, 21, 14, 3, 1, 'mingSash'],
  hu: [116, 61, 24, 9, 4, 1, 'foxSaber'],
  hero: [120, 60, 25, 11, 3, 1, 'pine'],
  medic: [92, 72, 19, 7, 3, 2, 'staff'],
  guard: [142, 48, 24, 16, 3, 1, 'pole'],
  guo: [136, 56, 26, 13, 3, 1, 'wraps'],
  xiao: [103, 66, 24, 9, 4, 1, 'twins'],
  duan: [95, 78, 20, 8, 4, 2, 'fan']
};
const FOES = ['chief', 'blade', 'bow', 'scout'];
const startingHero = (id) => makeUnit(id, 'ally', 0, 0, ...HERO_STATS[id]);
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
      ...ids.map((id, index) => makeUnit(id, 'ally', ...posts[index], ...HERO_STATS[id])),
      ...[
        [104, 25, 12, 2, 1],
        [56, 20, 7, 2, 1],
        [48, 18, 5, 2, 3],
        [56, 19, 8, 3, 1]
      ].map((numbers, i) => {
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
// A hero standing in a companion's 布陣 is harder to hit; enemies only find it harder to walk.
function onZone(s, u) {
  return (
    !!s?.zones?.length &&
    ally(u) &&
    s.zones.some((z) => z.tiles.some((p) => p.x === u.x && p.y === u.y))
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
          ? (c.haste?.power || 0) - (c.pin?.power || 0)
          : 0;
  return Math.max(
    k === 'step' && c.pin ? 1 : 0,
    (u[k] || 0) +
      talent +
      items.reduce((sum, item) => sum + (item[k] || 0), 0) +
      modifier +
      commandBonus(s, u, k)
  );
}
const SIGNATURE_RULES_BY_HERO = {
  hero: { factor: 1.82 },
  medic: { heal: 39 },
  guard: { factor: 1.42, splash: 0.45, safe: true },
  guo: { factor: 1.74, push: true },
  xiao: { factor: 1.44, hits: [0.65, 0.65] },
  duan: { factor: 1.62, pierce: 0.5 },
  huang: { factor: 1.36, visual: 'guard', safe: true, debuff: { stat: 'atk', power: 4, turns: 2 } },
  yang: { factor: 2.04, visual: 'guo', hpCost: 9 },
  zhang: { visual: 'medic', shield: { power: 32, turns: 2 }, target: 'ally' },
  hu: { factor: 1.27, visual: 'xiao', hits: [0.68, 0.68] }
};
function artFor(u, key = u.activeArt || 'signature') {
  if (u.learned?.includes(key) && TECHNIQUES[key]) return TECHNIQUES[key];
  const info = unitDetails(u);
  return {
    name: info.skill,
    tier: 3,
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
        (s.run.status === 'battle' && s.run.formationOpen && canAct(s, u));
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
  for (const p of queue) {
    if (p.n !== costs.get(key(p.x, p.y))) continue;
    for (const [dx, dy] of adjacent) {
      const x = p.x + dx,
        y = p.y + dy,
        k = key(x, y);
      if (!walkable(x, y, s.mapIndex)) continue;
      const n =
        p.n + (reverse ? tileInfo(p.x, p.y, s.mapIndex).cost : tileInfo(x, y, s.mapIndex).cost);
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
  const path = tracePath(availableField(s, u), { x, y });
  if (path.length < 2) return false;
  if (s.run) s.run.formationOpen = false;
  u.origin = { x: u.x, y: u.y };
  followRoute(u, path);
  u.moved = true;
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
  if (s.run && s.round === 1 && party(s).every((v) => !v.moved && !v.acted))
    s.run.formationOpen = true;
  log(s, 'move', '撤回移動，重整步法。', unitDetails(u).name);
  return true;
}
function affectedFriends(s, caster, target, art) {
  if (!art.aura) return [target];
  return party(s).filter((v) => living(v) && distance(v, target) <= art.aura);
}
function targetOK(s, u, t, skill) {
  if (!canAct(s, u) || !t || !valid(t.x, t.y, s.mapIndex) || distance(u, t) > rangeFor(u, skill))
    return false;
  if (t.id && !s.units.includes(t)) return false;
  if (!skill) return !!t.id && living(t) && !ally(t);
  if (!canPay(s, u)) return false;
  const art = artFor(u),
    type = targetType(art);
  if (type === 'ground') return !t.id && walkable(t.x, t.y, s.mapIndex) && !at(s, t.x, t.y);
  if (!t.id || !living(t)) return false;
  if (type === 'enemy') return !ally(t);
  if (!ally(t) || (type === 'self' && t.id !== u.id)) return false;
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
const PARTNERS = { xiao: 'yang', yang: 'xiao' };
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
function attackPower(s, u, art, basic = basicFor(u), target = null) {
  const base = art
    ? stat(u, 'power', s) + 4
    : (basic.basicBonus || 0) + commandBonus(s, u, 'basic');
  const pursuit = target && target.hp <= target.maxHp / 2 ? commandBonus(s, u, 'pursuit') : 0;
  return stat(u, 'atk', s) * (art ? strikeFactor(s, u, art, target).factor : 1) + base + pursuit;
}
function damage(
  u,
  t,
  skill = false,
  map = 0,
  s,
  art = skill ? artFor(u) : null,
  basic = basicFor(u)
) {
  const protection = stat(t, 'def', s) + tileInfo(t.x, t.y, map).defense + (t.brace ? 4 : 0);
  const pierce = art ? art.pierce || 0 : commandBonus(s, u, 'pierce') / 100;
  return Math.max(
    3,
    Math.round(attackPower(s, u, art, basic, t) - protection * 0.65 * (1 - pierce))
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
// What an action goes on to cost its own caster's 氣血 once it is over (內傷 after an attack),
// counted from where the preview leaves him; the preview shows it on his bar as `selfLoss`.
function selfLoss(s, u, art, result, attack) {
  let left = u.hp - result.hpCost + result.selfHeal - result.counter;
  result.selfLoss = 0;
  const hurt = attack && u.conditions?.wound;
  if (hurt && left > 1) {
    const n = Math.min(hurt.power, left - 1);
    result.selfLoss += n;
    left -= n;
    result.notes.push('內傷 · 出手後自損 ' + n + ' 氣血');
  }
  return left;
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
function wardEscorts(s) {
  if (s?.mapIndex !== 9) return [];
  return s.units.filter((u) => (u.id === 'echoBow' || u.id === 'echoScout') && living(u));
}
const wardPercent = (s, target) => (target.id === 'murong' ? wardEscorts(s).length * 35 : 0);
const afterWard = (power, percent) =>
  percent ? Math.max(1, Math.round((power * (100 - percent)) / 100)) : power;
function forecast(u, t, skill, s, art = skill ? artFor(u) : null, basic = basicFor(u)) {
  const type = art ? targetType(art) : 'enemy';
  const support = type === 'self' || type === 'ally',
    heal = support && !!art.heal;
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
    selfLoss(s, u, art, result, false);
    result.notes.push(...priceNotes(art));
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
    selfLoss(s, u, art, result, false);
    result.notes.push(...priceNotes(art));
    return result;
  }
  const single = damage(u, t, skill, s?.mapIndex, s, art, basic);
  const step = forcedStep(s, u, t, art, result.forms, walkable);
  const plan = contactPlan(s, u, t, art, result.forms, step, unitDetails(t)?.rank === 'boss');
  result.plan = plan;
  result.notes = plan.notes;
  if (art) result.notes.push(...strikeFactor(s, u, art, t).notes);
  result.effects.push(...plan.effects);
  const baseHits = (art?.hits || [1]).map(
    (part, i) => Math.round(single * part) + (i === 0 ? plan.extra : 0)
  );
  result.rawHits = baseHits.map((hit) => afterWard(hit, ward));
  let shield = t.conditions?.shield?.power || 0;
  result.hits = result.rawHits.map((hit) => {
    const stopped = Math.min(hit, shield);
    shield -= stopped;
    result.shielded += stopped;
    return hit - stopped;
  });
  result.amount = result.hits.reduce((sum, n) => sum + n, 0);
  result.push = t.hp > result.amount ? step : null;
  if (plan.partnerMp)
    result.notes.push(unitDetails(find(s, plan.partner)).name + '內力 ＋' + plan.partnerMp);
  if (plan.clearPoison) result.notes.push('以毒解毒 · 解除自身中毒');
  if (result.forms.includes('leech')) {
    result.selfHeal = Math.min(
      healAmount(u, Math.min(9, Math.floor(Math.min(t.hp, result.amount) / 4))),
      u.maxHp - u.hp + result.hpCost
    );
    if (result.selfHeal) result.notes.push('回生 · 自身氣血 ＋' + result.selfHeal);
  }
  // 吸勁: decided as the blow lands, before the counter it may un-charge.
  result.siphon = siphonPlan(s, u, t, result);
  if (result.siphon) result.notes.push(result.siphon.note);
  const share = counterRatio(s, afterSiphon(t, result.siphon));
  if (
    share &&
    !plan.safe &&
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
    result.counterRaw = Math.max(2, Math.round(damage(reply, u, false, s?.mapIndex, s) * share));
    result.counter = Math.max(0, result.counterRaw - (u.conditions?.shield?.power || 0));
    if (share === 1 && !t.conditions?.stance) result.notes.push('蓄勢反擊 · 還擊全力');
  }
  if (s && (art?.splash || result.forms.includes('line') || result.forms.includes('arc'))) {
    const targets = secondaryTargets(s, u, t, result.push || t, art, result.forms, walkable);
    const guards = new Set(wardEscorts(s).map((v) => v.id));
    if (result.amount >= t.hp) guards.delete(t.id);
    const power = baseHits.reduce((a, b) => a + b, 0);
    for (const [v, ratio] of targets) {
      const raw = afterWard(
        Math.max(4, Math.round(power * ratio)),
        v.id === 'murong' ? guards.size * 35 : 0
      );
      const amount = Math.min(v.hp, Math.max(0, raw - (v.conditions?.shield?.power || 0)));
      if (amount >= v.hp) guards.delete(v.id);
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
      t.id === 'murong' ? guards.length * 35 : 0
    );
    result.reflected = Math.min(t.hp - result.amount, Math.max(0, raw - shield));
    result.notes.push('借勁 · 還擊後反震 ' + result.reflected + ' 氣血');
  }
  selfLoss(s, u, art, result, true); // 內傷 and 反噬: what the strike costs its caster after
  result.notes.push(...priceNotes(art));
  return result;
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
  if (!ally(u)) {
    s.stats.damage += d;
    if (!living(u)) {
      s.stats.kills++;
      progress(source, 'kills', 1);
      if (s.mapIndex === 9 && (u.id === 'echoBow' || u.id === 'echoScout')) {
        const left = wardEscorts(s).length;
        log(
          s,
          'combat',
          left ? '一條星索斷了。慕容博的護勁降至三成半。' : '兩條星索皆斷，慕容博的護陣已破。',
          '星索護陣'
        );
      }
    }
  }
  return d;
}
function objectiveTile(s) {
  return ['beacon', 'cache', 'herbs'].includes(s.run?.goal)
    ? s.run.objectivePos || mapLayout(s.mapIndex).objective
    : null;
}
function unclaimedObjectiveTile(s) {
  return s.run?.status === 'battle' && !s.run.marked ? objectiveTile(s) : null;
}
function holdObjective(s, u) {
  const marker = unclaimedObjectiveTile(s);
  if (marker && ally(u) && living(u) && distance(u, marker) === 0) {
    s.run.marked = true;
    const discoveries = {
      beacon: '點亮了引路燈',
      herbs: '循燈找到傷者，把藥送到他手裡',
      cache: '在燈下尋回一枚姓名籤'
    };
    log(s, 'story', discoveries[s.run.goal] + '。局裡那個影子抬起了頭。', unitDetails(u).name);
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
  const amount = wound(
    s,
    attacker,
    afterWard(Math.min(stance.power, dealt), wardPercent(s, attacker)),
    source
  );
  effects.push([attacker.id, '−' + amount]);
  log(
    s,
    'combat',
    '借勁反震' + unitDetails(attacker).name + '，造成 ' + amount + ' 點傷害。',
    unitDetails(victim).name
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
  const verb = art?.name || basicFor(u).name,
    who = unitDetails(u).name;
  const effects = [],
    oldKills = s.stats.kills,
    from = { x: u.x, y: u.y };
  if (skill) {
    u.mp -= f.mpCost;
    progress(u, 'casts', 1);
  }
  if (f.hpCost) {
    u.hp -= f.hpCost;
    effects.push([u.id, '−' + f.hpCost, 'sacrifice']);
  }
  // Ordinary movement is counted once when confirmed. Lightness skills move instantaneously.
  if (f.type === 'ground') {
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
  } else if (f.type === 'enemy') {
    // 留力 asks whether the hero struck last round; a counter or a support art is no strike.
    if (ally(u)) u.struckRound = s.round;
    let total = 0;
    for (const power of f.rawHits) {
      if (!living(t)) break;
      const dealt = wound(s, t, power, u);
      total += dealt;
      effects.push([t.id, '−' + dealt]);
    }
    log(
      s,
      'combat',
      '以「' + verb + '」擊中' + unitDetails(t).name + '，造成 ' + total + ' 點傷害。',
      who
    );
    if (living(t)) {
      if (f.plan.spentMark) delete t.conditions.mark;
      if (f.plan.spentPoison) delete t.conditions.poison;
      if (f.effects.some((e) => e.kind === 'seal')) t.lastSealRound = s.round;
      putEffects(s, u, t, f.effects, effects);
    } else log(s, 'combat', '失去戰力。', unitDetails(t).name);
    // 吸勁 lands before the counter, so a signature it puts back is no longer charged for it.
    applySiphon(s, u, t, f.siphon);
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
        dealt = wound(s, v, other.raw, u);
      effects.push([v.id, '−' + dealt]);
      log(s, 'combat', '受到氣勁波及，損失 ' + dealt + ' 點氣血。', unitDetails(v).name);
    }
    if (f.counterRaw) {
      const dealt = wound(s, u, f.counterRaw, t);
      effects.push([u.id, '−' + dealt, 'counter']);
      log(s, 'combat', '還擊' + who + '，造成 ' + dealt + ' 點傷害。', unitDetails(t).name);
      reflectStrike(s, u, t, dealt, effects);
    }
    woundSelfLoss(s, u, effects); // 內傷: the attacker pays once the exchange is over
  }
  if (art?.once) (u.usedOnce ??= []).push(id);
  if (art?.cooldown) (u.cooldowns ??= {})[id] = s.round + art.cooldown + 1;
  if (art && living(u)) {
    const own = selfEffectsOf(art).map((e) =>
      e.kind === 'backlash' ? { ...e, turns: LIMIT - s.round + 1 } : e
    );
    putEffects(s, u, u, own, effects);
  }
  finishAction(s, u);
  if (f.notes.length) log(s, 'combat', '氣勁變化。' + f.notes.join('。'), who);
  const leveled = living(u) && exp(
      s,
      u,
      (skill ? GROWTH.skillXp : GROWTH.basicXp) + (s.stats.kills - oldKills) * GROWTH.killXp
    );
  check(s);
  return { effects, leveled, counter: f.counterRaw > 0, hits: f.hits.length, from };
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
function consume(s, u, id) {
  const item = ITEMS[id];
  if (item?.kind !== 'use' || !canUseMedicine(s, u) || !(s.stock[id] > 0)) return false;
  const k = item.hp ? 'hp' : 'mp',
    cap = k === 'hp' ? 'maxHp' : 'maxMp',
    n = Math.min(k === 'hp' ? healAmount(u, item.hp) : item.mp, u[cap] - u[k]);
  if (n <= 0) return false;
  u[k] += n;
  s.stock[id]--;
  if (k === 'hp') s.stats.healed += n;
  log(
    s,
    'item',
    '服用' + item.name + '，回復 ' + n + ' 點' + (k === 'hp' ? '氣血' : '內力') + '。',
    unitDetails(u).name
  );
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
function check(s) {
  if (s.result) return;
  const chief = find(s, commanderId(s));
  if (!living(find(s, leader(s)))) {
    s.result = 'loss';
    s.reason =
      DETAILS[leader(s)].name +
      (s.run ? '倒下，這一輪的眼破了。' : '負傷倒下，曲譜落入青城弟子手中。');
  } else if (!living(chief)) {
    s.result = 'win';
    s.reason = s.run ? CHAMBER_TALES[s.mapIndex].victory : '余滄海收劍退開，渡口的船燈再度亮起。';
  } else if (s.round > LIMIT) {
    s.result = 'loss';
    s.reason = s.run ? '十二合已過。借來的一念撐不住，散了。' : '十二回合已過，霧中的末班渡船已經離岸。';
    s.round = LIMIT;
  } else if (!s.foreshadow && chief.hp <= chief.maxHp / 2) {
    s.foreshadow = true;
    if (chief.id === 'murong') {
      chief.atk += 5;
      chief.range += 1;
      chief.brace = true;
      log(s, 'combat', '斗轉星移倒轉銅漏，攻擊增加 5、防禦增加 4，射程擴至三格。', '慕容博');
    } else log(s, 'story', '收勢退了半步，重整陣腳。', DETAILS[chief.id].name);
  }
  if (s.result) {
    s.phase = 'done';
    log(s, 'story', s.reason, s.result === 'win' ? '破關' : '敗退');
  }
}
function restOnHerbs(s, units) {
  for (const u of units.filter(living)) {
    const healed = Math.min(
      u.maxHp - u.hp,
      healAmount(u, tileInfo(u.x, u.y, s.mapIndex).heal || 0)
    );
    if (healed <= 0) continue;
    u.hp += healed;
    if (ally(u)) s.stats.healed += healed;
    log(s, 'terrain', '在藥草地調息，回復 ' + healed + ' 點氣血。', unitDetails(u).name);
  }
}
function startEnemy(s) {
  if (s.phase !== 'ally' || s.result || (s.run?.scene && s.run.scene !== 'fight')) return false;
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
function enemyAct(s, u) {
  if (s.phase !== 'enemy' || s.result || ally(u) || !living(u) || u.acted) return [];
  const friends = party(s).filter(living);
  const field = availableField(s, u);
  const cells = [
    { x: u.x, y: u.y, n: 0 },
    ...Array.from(field.costs, ([k, n]) => {
      const [x, y] = k.split(',').map(Number);
      return { x, y, n };
    })
  ];
  let best = null;
  const range = strikeReach(s, u);
  const approach = new Map(
    friends.map((target) => {
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
  const targetCost = new Map(
    friends.map((t) => {
      if (!(s.run?.stage >= 6)) return [t.id, t.hp * 0.6];
      const protectedByAlly = friends.some((v) => v !== t && distance(v, t) === 1);
      const cover = tileInfo(t.x, t.y, s.mapIndex).defense > 0;
      const exposedLeader = t.id === s.leader && !protectedByAlly && !cover;
      const vitality = t.hp + (t.conditions?.shield?.power || 0);
      return [t.id, vitality * 0.28 + (35 * vitality) / t.maxHp - (exposedLeader ? 28 : 0)];
    })
  );
  for (const c of cells)
    for (const t of friends) {
      const d = distance(c, t),
        can = d <= range,
        score =
          (can ? 1000 - targetCost.get(t.id) : 0) -
          (can ? 0 : (approach.get(t.id).get(key(c.x, c.y)) ?? fieldCells(s.mapIndex).length + d)) *
            40 -
          c.n * 2 +
          tileInfo(c.x, c.y, s.mapIndex).defense * 0.4;
      if (!best || score > best.score) best = { c, t, can, score };
    }
  u.acted = true;
  if (!best) return [];
  u.moved = distance(u, best.c) > 0;
  if (u.moved) followRoute(u, tracePath(field, best.c));
  if (!best.can) {
    log(s, 'move', '逼近我方陣地。', unitDetails(u).name);
    return [];
  }
  const t = best.t;
  const art = signatureDue(s, u) ? enemyTechnique(u, s) : null;
  const raw = damage(u, t, false, s.mapIndex, s);
  const strikePower = art ? Math.round(raw * art.factor) : raw;
  const n = wound(s, t, strikePower, u);
  // 還報 counts only 氣血 an enemy's own action took, never what a shield caught.
  if (n) t.hurtRound = s.round;
  const effects = [[t.id, '−' + n]];
  const attack = art?.name || basicFor(u).name;
  log(
    s,
    'combat',
    '以「' + attack + '」擊中' + unitDetails(t).name + '，造成 ' + n + ' 點傷害。',
    unitDetails(u).name
  );
  if (art) {
    u.signatureRound = s.round;
    if (u.signaturePush) u.signaturePush = 0;
    if (art.style === 'sweep') {
      for (const other of friends.filter((v) => v !== t && living(v) && distance(v, t) === 1)) {
        const chip = wound(s, other, Math.max(1, Math.round(strikePower / 4)), u);
        if (chip) other.hurtRound = s.round;
        effects.push([other.id, '−' + chip]);
        log(s, 'combat', '被餘勁掃中，損失 ' + chip + ' 點氣血。', unitDetails(other).name);
      }
    } else if (living(t)) {
      if (art.style === 'drain') t.mp = Math.max(0, t.mp - art.power);
      else applyCondition(s, t, { kind: art.style, power: art.power, turns: art.turns }, u);
      log(s, 'combat', art.note, unitDetails(u).name);
    }
  }
  reflectStrike(s, t, u, n, effects);
  const share = counterRatio(s, t);
  if (!living(t)) log(s, 'combat', '負傷退場。', unitDetails(t).name);
  else if (living(u) && !t.conditions?.seal && distance(u, t) <= reach(s, t) && share) {
    const power = Math.max(2, Math.round(damage(t, u, false, s.mapIndex, s) * share));
    const hit = wound(s, u, afterWard(power, wardPercent(s, u)), t);
    effects.push([u.id, '−' + hit]);
    log(s, 'combat', '還擊，造成 ' + hit + ' 點傷害。', unitDetails(t).name);
    exp(s, t, living(u) ? 12 : 35);
  }
  woundSelfLoss(s, u, effects); // 內傷: the attacker pays once the exchange is over
  check(s);
  return effects;
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
      const amount = wound(
        s,
        u,
        afterWard(poison.power, wardPercent(s, u)),
        find(s, poison.source)
      );
      log(s, 'combat', '毒發，損失 ' + amount + ' 點氣血。', unitDetails(u).name);
    }
    for (const [kind, condition] of Object.entries(u.conditions || {}))
      if (condition.through <= s.round) delete u.conditions[kind];
  }
  check(s);
  if (s.result) return false;
  restOnHerbs(s, enemies(s));
  s.round++;
  s.phase = 'ally';
  check(s);
  if (s.result) return false;
  for (const u of party(s).filter(living)) {
    u.moved = false;
    u.acted = false;
    u.origin = null;
    u.brace = false;
    u.mp = Math.min(u.maxMp, u.mp + 6 + commandBonus(s, u, 'restoreMp'));
  }
  s.selected = leader(s);
  log(s, 'system', '俠客重整步法，內力各回復 6 點。', '我方回合');
  if (s.leader === 'zhang' && s.run?.status === 'battle')
    log(s, 'combat', '九陽護元：領隊與兩格內友軍額外回復 5 點內力。', DETAILS.zhang.name);
  return true;
}

export { SIZE, FIELD_EDITION, LIMIT, GROWTH, ORIGINAL_PARTY, PARTY, BOOKS, leader, key, distance, living, ally, at, find, party, company, commanderId, enemies, canAct, canPrepare, managesCompany, valid, terrainInfo, terrain, cover, walkable, ITEMS, TALENTS, DETAILS, encounterKeys, identifyEncounter, withMods, unitDetails, enemyTechnique, roundsToSignature, signatureDue, siphonPlan, reach, strikeReach, counterRatio, enemyTraitLines, STORIES, chapterScenes, makeUnit, startingHero, newGame, fitFormation, restoreGame, log, stat, artFor, rangeFor, commandDiscount, cost, artCost, basicFor, equippedArts, targetType, artReady, canPay, isSupport, canConfigure, reachable, movementPath, routeConnects, canMove, move, undo, affectedFriends, targetOK, PARTNERS, strikeFactor, priceNotes, attackPower, damage, healingPower, healing, healAmount, woundSelfLoss, formsFor, pushCell, wardEscorts, forecast, raiseLevel, settleExperience, exp, objectiveTile, unclaimedObjectiveTile, holdObjective, resolve, waitUnit, canUseMedicine, consume, equip, transferEquipment, train, check, startEnemy, enemyAct, nextRound };
