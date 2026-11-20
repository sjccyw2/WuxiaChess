import { FORM_RULES } from './form-rules.js';
import { STROKE_NOTES } from '../fx/technique-strokes.js';
import * as G from './game.js';
import { TECHNIQUES } from '../data/martial-arts.js';
import { commandBonus, effectsOf, effectDescription } from './battle-mastery.js';

const percent = (fraction) => Math.round(fraction * 100) + '%';
const roots = { force: '攻擊 ＋3', guard: '防禦 ＋2', breath: '絕技威力 ＋5、內力消耗 −2' };

const plus = (n) => '＋' + n.toFixed(2);
const ANSWERED = { close: '近身（射程 1）', ranged: '遠攻（射程 2 以上）', master: '局主或副手' };
// The conditional bonuses of an art, as rules rather than as this strike's numbers.
function bonusLines(u, art) {
  const lines = [];
  if (art.answer) lines.push('破招 · 目標為' + ANSWERED[art.answer] + '時倍率 ＋0.30');
  if (art.lone) lines.push('孤行 · 四鄰沒有同伴時倍率 ' + plus(art.lone));
  if (art.paired) {
    const partner = G.DETAILS[G.PARTNERS[u.id]]?.name;
    lines.push(
      '合璧 · 有同伴相鄰 ' +
        plus(art.paired.any) +
        (partner ? '，' + partner + '相鄰 ' + plus(art.paired.partner) : '')
    );
  }
  if (art.pairsSelf) lines.push('左右互搏 · 習得後，合璧之招孤身出手也算有同伴相鄰');
  if (art.dire) lines.push('黯然 · 自身氣血越少倍率越高，剩四分之一以下時 ' + plus(art.dire));
  if (art.avenge) lines.push('還報 · 上一個敵方回合曾受敵人攻擊而損血時倍率 ' + plus(art.avenge));
  if (art.execute) lines.push('斬殘 · 目標氣血不過半時倍率 ' + plus(art.execute));
  if (art.surge)
    lines.push(
      '傾力 · 耗盡內力，每點倍率 ＋' + art.surge.rate + '，最高 ' + art.surge.cap.toFixed(2)
    );
  return lines;
}

// When the art may be used and what it costs beyond 內力 and 氣血.
function useLines(art) {
  const lines = [];
  if (art.poised) lines.push('留力 · 上回合未出手方可施展');
  if (art.consume === 'shield') lines.push('轉護 · 須自身帶有護盾，施展時護盾轉給受術者');
  return [...lines, ...G.priceNotes(art)];
}

// What the conditions stage's fields do, as rules: 反噬, a conditional 失神, 布陣.
function conditionLines(art) {
  const lines = [];
  if (art.backlash) lines.push('反噬 · 每次施展積一層亂氣，第三層時自損兩成最大氣血並清空');
  return lines;
}

function moveFacts(s, u, id = 'basic', target = null) {
  if (Object.hasOwn(roots, id)) {
    return {
      name: G.TALENTS[id].name,
      kind: 'passive',
      powerLabel: '每重增益',
      powerText: roots[id],
      shortEffect: '常駐 · 共三重',
      effectLines: ['習得後持續生效。'],
      range: 0,
      mp: 0,
      hpCost: 0
    };
  }
  const definition =
    id === 'basic' ? G.basicFor(u) : id === 'signature' ? G.artFor(u, id) : TECHNIQUES[id];
  if (!definition) return null;
  const basic = id === 'basic' || definition.kind === 'basic';
  const art = basic ? null : definition;
  const kind = basic ? 'basic' : G.targetType(art);
  const range = basic ? u.range : art.range;
  const hpCost = art?.hpCost || 0;
  const mp = art ? G.artCost(s, u, art) : 0;
  const lines = [];
  let powerLabel, powerText;
  const inReach =
    target && G.valid(target.x, target.y, s.mapIndex) && G.distance(u, target) <= range;
  const legal =
    inReach &&
    (kind === 'ground'
      ? !target.id && G.walkable(target.x, target.y, s.mapIndex) && !G.at(s, target.x, target.y)
      : !!target.id &&
        s.units.includes(target) &&
        G.living(target) &&
        (kind === 'self'
          ? target === u
          : kind === 'ally'
            ? target.side === u.side
            : target.side !== u.side));
  const forecast = legal
    ? G.forecast(u, target, !basic, s, art, basic ? definition : G.basicFor(u))
    : null;
  if (basic || kind === 'enemy') {
    const power = Math.max(
      3,
      Math.round(G.attackPower(s, u, art, basic ? definition : G.basicFor(u)))
    );
    const hits = (art?.hits || [1]).map((part) => Math.round(power * part));
    powerLabel = forecast ? '預估傷害' : '未扣防威力';
    powerText = forecast
      ? String(forecast.amount)
      : hits.every((n) => n === hits[0])
        ? String(hits[0]) + (hits.length > 1 ? ' × ' + hits.length : '')
        : hits.join(' ＋ ');
    if (hits.length > 1)
      lines.push(
        forecast ? '分段傷害 ' + forecast.hits.join(' ＋ ') : '連擊 ' + hits.length + ' 段'
      );
    const pierce = art ? art.pierce : commandBonus(s, u, 'pierce') / 100;
    if (pierce) lines.push('穿透 ' + percent(pierce) + ' 防禦');
    if (art?.splash) lines.push('四鄰濺射 ' + percent(art.splash));
    if (art?.push) lines.push('擊退 1 格，須有空位');
    if (art?.safe) lines.push('敵人無法反擊');
    if (art?.recover) lines.push('命中回復 ' + art.recover + ' 內力');
    const bonus = commandBonus(s, u, 'pursuit');
    if (bonus) lines.push('敵方半血以下威力 ＋' + bonus);
    if (basic && definition.basicBonus) lines.push('普攻威力 ＋' + definition.basicBonus);
    if (!lines.length && !effectsOf(art).length) lines.push('單體攻擊，射程內可受反擊');
  } else if (art.heal) {
    powerLabel = forecast ? '預估回復' : '療傷威力';
    powerText = (forecast ? forecast.amount : G.healingPower(u, s, art)) + ' 氣血';
    lines.push(art.aura ? '範圍療傷' : '單體療傷');
  } else if (kind === 'ground') {
    powerLabel = '身法距離';
    powerText = range + ' 格';
    lines.push('越障移至可站立的空格，結束行動');
  } else {
    const effect = effectsOf(art)[0];
    const entry = {
      shield: ['護盾', ' 傷害'],
      rally: ['攻擊增益', ' 攻擊'],
      haste: ['移動增益', ' 步']
    }[effect?.kind];
    powerLabel = entry?.[0] || '增益';
    powerText = effect ? String(effect.power) + (entry?.[1] || '') : '自身';
  }
  for (const effect of effectsOf(art))
    lines.push(effectDescription(effect.kind, effect.power, effect.turns));
  if (art) lines.push(...bonusLines(u, art), ...useLines(art), ...conditionLines(art));
  if (art?.aura) lines.push('目標及周圍 ' + art.aura + ' 格友軍');
  if (hpCost) lines.push('自耗 ' + hpCost + ' 氣血');
  const forms = G.formsFor(u, art, basic ? definition : undefined);
  if (forms.length) lines.push(forms.map((id) => FORM_RULES[id][0]).join('・'));
  const shortEffect = lines.join(' · ');
  return {
    name: definition.name,
    kind,
    powerLabel,
    powerText,
    shortEffect,
    factor: art?.factor,
    formRules: forms.map((id) => FORM_RULES[id].join(' · ')),
    animation: STROKE_NOTES[id === 'signature' ? 'signature:' + u.id : id],
    effectLines: lines,
    range,
    mp,
    hpCost
  };
}

export { moveFacts };
