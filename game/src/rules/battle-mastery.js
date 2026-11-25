import { seatsFor } from './formation.js';
import { mapLayout } from '../data/terrain.js';
// Combat mastery is saved on the hero. Formation bonuses are derived from the living board.
const COMMANDS = {
  hero: {
    name: '料敵先機',
    stat: 'basic',
    power: 6,
    text: '普攻與還擊的基礎傷害增加 6。',
    icon: 'sword'
  },
  medic: {
    name: '綠竹清音',
    stat: 'renew',
    power: 8,
    text: '我方回合結束時回復 8 點氣血。',
    icon: 'leaf'
  },
  guard: { name: '肝膽相照', stat: 'def', power: 5, text: '防禦增加 5。', icon: 'shield' },
  guo: { name: '襄陽軍聲', stat: 'atk', power: 4, text: '攻擊增加 4。', icon: 'flag' },
  xiao: { name: '古墓輕身', stat: 'step', power: 1, text: '移動力增加 1 步。', icon: 'feather' },
  huang: { name: '奇門布陣', stat: 'power', power: 7, text: '絕技威力增加 7。', icon: 'star' },
  yang: {
    name: '重劍開路',
    stat: 'pierce',
    power: 30,
    text: '普攻與還擊穿透三成防禦。',
    icon: 'sword'
  },
  zhang: {
    name: '九陽護元',
    stat: 'restoreMp',
    power: 5,
    text: '我方新回合額外回復 5 點內力。',
    icon: 'drop'
  },
  hu: {
    name: '雪野追鋒',
    stat: 'pursuit',
    power: 8,
    text: '擊中氣血不過半的敵人時，傷害增加 8。',
    icon: 'target'
  },
  duan: {
    name: '無量清風',
    stat: 'economy',
    power: 3,
    text: '出招少耗 3 點內力，最低消耗 2 點。',
    icon: 'drop'
  },
  // The ten who came later each lead in a way of their own.
  // 聚賢莊: the more foes press round him, the harder he hits.
  qiaoFeng: {
    name: '聚賢豪氣',
    stat: 'throng',
    power: 3,
    most: 2,
    text: '每有一名敵人相鄰，攻擊增加 3，至多增加 6。',
    icon: 'flag'
  },
  xuZhu: {
    name: '北冥真氣',
    stat: 'absorb',
    power: 3,
    text: '出手擊中敵人時，回復 3 點內力。',
    icon: 'drop'
  },
  hongQi: {
    name: '打狗陣法',
    stat: 'held',
    power: 8,
    text: '擊中絆足、截勁、纏械、定身或閉穴的敵人時，傷害增加 8。',
    icon: 'target'
  },
  yaoShi: {
    name: '桃花迷陣',
    stat: 'linger',
    power: 2,
    text: '出手加在敵人身上的中毒、攻勢受挫、破防、絆足、破綻、內傷與纏械，多留 2 回合。',
    icon: 'star'
  },
  sanFeng: {
    name: '太極圓轉',
    stat: 'retort',
    power: 20,
    text: '還擊的比例加兩成，至多全力。',
    icon: 'shield'
  },
  // 十香軟筋散: it is the foes near her who are weakened, so the boon names them (commandDescription).
  zhaoMin: { name: '軟筋餘香', stat: 'sap', power: 3, foes: true, text: '攻擊減少 3。', icon: 'drop' },
  lingSu: {
    name: '碧蠶毒蠱',
    stat: 'venom',
    power: 4,
    turns: 2,
    text: '出手擊中的敵人中毒兩回合，每回合失去 4 氣血。',
    icon: 'leaf'
  },
  diYun: {
    name: '雪谷回生',
    stat: 'spare',
    power: 1,
    text: '將要倒下時留住 1 點氣血，毒發也算；每局只救頭一個。',
    icon: 'shield'
  },
  chengZhi: {
    name: '金蛇轉鋒',
    stat: 'bend',
    power: 1,
    text: '出手與還擊無視目標所在地形的防禦，旁人也不能替目標代受。',
    icon: 'sword'
  },
  aQing: {
    name: '越女試劍',
    stat: 'opening',
    power: 1,
    text: '每回合頭一次會招來還擊的出手，敵人不能還擊；本來就不受還擊的出手不算。',
    icon: 'feather'
  },
  // 無名: he does not give up a stone.
  youth: { name: '不棄一子', stat: 'def', power: 4, text: '防禦增加 4。', icon: 'shield' }
};
// What 打狗陣法 counts as a held foe, and what 桃花迷陣 keeps on a foe longer (by its power).
const HELD_KINDS = ['pin', 'seal', 'disarm', 'freeze', 'mute'];
const LINGER_KINDS = ['poison', 'weak', 'exposed', 'pin', 'mark', 'wound', 'disarm'];
function commandDescription(id) {
  return (COMMANDS[id].foes ? '距離領隊兩格內的敵人' : '領隊與距離兩格內的友軍') + COMMANDS[id].text;
}
const apart = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
// Where a hero stands for the boon in 整備: his seat's post, since the posts are not yet walked.
function prepPost(s, id) {
  const seat = seatsFor(s.run).indexOf(id);
  return seat < 0 ? null : mapLayout(s.mapIndex).allies[seat];
}
// The leader's boon and where it is centred: in 整備 the first seat's post, in the fight the
// living leader. Null when no boon is in force.
function boonSource(s) {
  if (s?.run?.scene === 'prep') {
    const boon = COMMANDS[s.run.next[0]],
      at = boon && prepPost(s, s.run.next[0]);
    return at ? { boon, at } : null;
  }
  if (s?.run?.status !== 'battle') return null;
  const captain = s.units.find((v) => v.id === s.leader && v.hp > 0);
  return captain && COMMANDS[captain.id] ? { boon: COMMANDS[captain.id], at: captain } : null;
}
// The boon in force now, or null.
const leaderBoon = (s) => boonSource(s)?.boon || null;
// What the leader's boon gives this hero for `stat`: its power if he is the leader or within two
// tiles of him, else 0.
function commandBonus(s, unit, stat) {
  const prep = s?.run?.scene === 'prep';
  if (!prep && (unit.side !== 'ally' || unit.hp <= 0 || !s?.units?.includes(unit))) return 0;
  const from = boonSource(s);
  if (!from || from.boon.stat !== stat || from.boon.foes) return 0;
  const at = prep ? prepPost(s, unit.id) : unit;
  return at && apart(from.at, at) <= 2 ? from.boon.power : 0;
}
// What a boon that names the foes (軟筋餘香) takes off this enemy for `stat`: its power while he
// stands within two tiles of the leader. Asked of a copy of the piece too (a forecast's counter).
function commandAura(s, foe, stat) {
  if (foe?.side !== 'enemy' || foe.hp <= 0) return 0;
  const from = boonSource(s);
  return from?.boon.foes && from.boon.stat === stat && apart(from.at, foe) <= 2 ? from.boon.power : 0;
}
const CONDITION_NAMES = {
  poison: '中毒',
  weak: '攻勢受挫',
  exposed: '破防',
  shield: '護盾',
  rally: '振奮',
  haste: '輕身',
  mark: '破綻',
  pin: '絆足',
  seal: '截勁',
  riposte: '反震',
  stance: '卸勁',
  cover: '代受',
  taunt: '挑釁',
  evade: '閃身',
  redirect: '挪移',
  // The four prices of a summit go by one word, 代價; the state says which (Q-N152, P4).
  recoil: '代價',
  unguarded: '代價',
  rooted: '代價',
  spent: '代價',
  backlash: '亂氣',
  wound: '內傷',
  disarm: '纏械',
  fortify: '固守',
  immune: '金剛',
  freeze: '定身',
  mute: '閉穴',
  charm: '受制'
};
// Whether an art is aimed at a companion or at its caster (rules/game.js targetType says the same).
const supportArt = (art) => art.target === 'ally' || art.target === 'self' || (!art.target && !!art.heal);
// 固守 and 金剛 guard whoever a support art reaches; on any other art they guard its caster
// (selfEffectsOf), never the foe it strikes.
const GUARDS = ['fortify', 'immune'];
// What an art puts on whoever receives it.
function effectsOf(art) {
  if (!art) return [];
  const effects = [];
  for (const kind of ['poison', 'shield', 'rally', 'haste', 'wound', 'disarm']) {
    if (art[kind]) effects.push({ kind, ...art[kind] });
  }
  if (art.debuff)
    effects.push({ kind: art.debuff.stat === 'def' ? 'exposed' : 'weak', ...art.debuff });
  if (art.redirect) effects.push({ kind: 'redirect', power: art.redirect.cap, turns: 1 });
  if (supportArt(art)) for (const kind of GUARDS) if (art[kind]) effects.push(guardEffect(art, kind));
  // 定身, 閉穴 and 受制 as the art's page states them; the strike decides what a master takes, and
  // whether a 定身 with a setup lands (rules/game.js controlPlan).
  for (const kind of ['freeze', 'mute', 'charm'])
    if (art[kind]) effects.push({ kind, power: 1, turns: art[kind].turns || 1 });
  return effects;
}
// 金剛 has no strength of its own: its power is 1, kept so a save's condition check passes.
const guardEffect = (art, kind) => ({
  kind,
  power: kind === 'immune' ? 1 : art[kind].power,
  turns: art[kind].turns || 1
});
// What an art puts on its caster once it resolves, whatever it was aimed at. One turn lasts until
// the caster's next turn; two turns cover that next turn too. 亂氣 lasts the rest of the board, so
// its `turns` is left for the caller, who knows the round limit.
function selfEffectsOf(art) {
  if (!art) return [];
  const effects = [],
    put = (kind, power = 1, turns = 1) => effects.push({ kind, power, turns });
  if (art.stance) put('stance', art.stance);
  if (art.cover) put('cover');
  if (art.taunt) put('taunt', art.taunt);
  if (art.evade) put('evade');
  if (art.recoil) put('recoil', art.recoil);
  if (art.openGuard) put('unguarded');
  if (art.rooted) put('rooted', 1, 2);
  if (art.spent) put('spent', 1, 2);
  if (art.backlash) put('backlash', 1, null);
  if (!supportArt(art))
    for (const kind of GUARDS) if (art[kind]) effects.push(guardEffect(art, kind));
  return effects;
}
function effectDescription(kind, power, turns) {
  const effect = {
    poison: '每回合失去 ' + power + ' 氣血',
    weak: '攻擊 −' + power,
    exposed: '防禦 −' + power,
    shield: '可吸收 ' + power + ' 傷害',
    rally: '攻擊 ＋' + power,
    haste: '移動 ＋' + power,
    mark: '可乘破綻接招',
    pin: '移動 −' + power,
    seal: '停用還擊及敵方絕技',
    riposte: '下次受傷震回最多 ' + power,
    stance: '受敵傷害減 ' + power + '%，還擊全力',
    cover: '代相鄰同伴承受直接攻擊',
    taunt: power + ' 格內可攻到自己的敵人只能攻擊自己',
    evade: '下一次直接攻擊落空',
    redirect: '下次受擊減半，反震最多 ' + power,
    recoil: '防禦 −' + power,
    unguarded: '不能還擊',
    rooted: '不能移動',
    spent: '不能施展絕技',
    backlash: power + '／3 層',
    wound: '療傷減半，出手後自損 ' + power,
    disarm: '攻擊 −' + power + '，只能攻擊相鄰',
    fortify: '防禦 ＋' + power,
    immune: '直接攻擊無功，不受其附帶之效',
    freeze: '不能移動、出手、施展絕技或還擊',
    mute: '不能出手、施展絕技或還擊，仍可移動',
    charm: '倒戈，以普攻攻擊同夥'
  };
  // 亂氣 stays until it bursts or the board ends; a count of rounds would mislead.
  const span = kind === 'backlash' ? '本局' : turns + ' 回合';
  return CONDITION_NAMES[kind] + ' · ' + effect[kind] + ' · ' + span;
}
function activeEffects(unit, round) {
  return Object.entries(unit.conditions || {}).map(([kind, c]) =>
    effectDescription(kind, c.power, Math.max(1, c.through - round + 1))
  );
}
function applyCondition(s, target, effect, caster) {
  if (target?.side === 'prop') return; // a board object takes no condition
  const { kind, power, turns } = effect;
  const held = (target.conditions ??= {});
  const old = held[kind];
  // 金剛: a foe's blow puts nothing on its holder (its own and its companions' effects still do).
  if (held.immune && caster && caster !== target && caster.side !== target.side) return;
  const extra = ['haste', 'rally', 'fortify'].includes(kind) && target.acted ? 1 : 0;
  const through = s.round + turns - 1 + extra;
  const owner = old && old.power > power ? old.source : caster.id;
  // 亂氣 counts casts: each application adds a layer instead of keeping the stronger.
  held[kind] = {
    power: kind === 'backlash' ? (old?.power || 0) + power : Math.max(power, old?.power || 0),
    through: Math.max(through, old?.through || 0),
    source: owner
  };
}
function blankRecord() {
  return { kills: 0, casts: 0, heals: 0, protects: 0, steps: 0, sides: [] };
}
function progress(unit, metric, delta) {
  if (unit?.mastery && delta > 0) unit.mastery[metric] += delta;
}

export { COMMANDS, HELD_KINDS, LINGER_KINDS, commandDescription, commandBonus, commandAura, leaderBoon, prepPost, CONDITION_NAMES, effectsOf, selfEffectsOf, effectDescription, activeEffects, applyCondition, blankRecord, progress };
