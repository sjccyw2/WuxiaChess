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
  }
};
function commandDescription(id) {
  return '領隊與距離兩格內的友軍' + COMMANDS[id].text;
}
function commandBonus(s, unit, stat) {
  if (s?.run?.scene === 'prep') {
    const seats = seatsFor(s.run),
      seat = seats.indexOf(unit.id),
      boon = COMMANDS[s.run.next[0]];
    if (seat < 0 || boon?.stat !== stat) return 0;
    const posts = mapLayout(s.mapIndex).allies,
      a = posts[seats.indexOf(s.run.next[0])],
      b = posts[seat];
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= 2 ? boon.power : 0;
  }
  if (
    s?.run?.status !== 'battle' ||
    unit.side !== 'ally' ||
    unit.hp <= 0 ||
    !s.units.includes(unit)
  )
    return 0;
  const captain = s.units.find((v) => v.id === s.leader && v.hp > 0);
  const boon = captain && COMMANDS[captain.id];
  return boon?.stat === stat && Math.abs(captain.x - unit.x) + Math.abs(captain.y - unit.y) <= 2
    ? boon.power
    : 0;
}
const CONDITION_NAMES = {
  poison: '中毒',
  weak: '攻勢受挫',
  exposed: '破防',
  shield: '護勁',
  rally: '振奮',
  haste: '輕身',
  mark: '破綻',
  pin: '絆足',
  seal: '封穴',
  riposte: '借勁'
};
function effectsOf(art) {
  if (!art) return [];
  const effects = [];
  for (const kind of ['poison', 'shield', 'rally', 'haste']) {
    if (art[kind]) effects.push({ kind, ...art[kind] });
  }
  if (art.debuff)
    effects.push({ kind: art.debuff.stat === 'def' ? 'exposed' : 'weak', ...art.debuff });
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
    mark: '可用收隙接招',
    pin: '移動 −' + power,
    seal: '停用還擊及敵方絕技',
    riposte: '下次受傷震回最多 ' + power
  };
  return CONDITION_NAMES[kind] + ' · ' + effect[kind] + ' · ' + turns + ' 回合';
}
function activeEffects(unit, round) {
  return Object.entries(unit.conditions || {}).map(([kind, c]) =>
    effectDescription(kind, c.power, Math.max(1, c.through - round + 1))
  );
}
function applyCondition(s, target, effect, caster) {
  const { kind, power, turns } = effect;
  const held = (target.conditions ??= {});
  const old = held[kind];
  const extra = (kind === 'haste' || kind === 'rally') && target.acted ? 1 : 0;
  const through = s.round + turns - 1 + extra;
  const owner = old && old.power > power ? old.source : caster.id;
  held[kind] = {
    power: Math.max(power, old?.power || 0),
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

export { COMMANDS, commandDescription, commandBonus, CONDITION_NAMES, effectsOf, effectDescription, activeEffects, applyCondition, blankRecord, progress };
