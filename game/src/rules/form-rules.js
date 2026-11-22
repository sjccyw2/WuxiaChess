// Flat bonuses are applied once per action, before wards and shields.
const FORM_RULES = {
  mark: ['留隙', '命中後留下兩回合破綻。同一擊若已收隙，便不重留。'],
  exploit: ['收隙', '收去目標已有的破綻，首段威力加 9，該敵無法還擊。'],
  pin: ['絆足', '本回合與下一回合，目標移動減 2，最低仍可走 1 步。'],
  seal: ['封穴', '本回合阻止還擊與敵方絕技。局主受封後，下一回合可抵抗再封。'],
  cleanse: ['解厄', '先替受術者解除中毒、攻勢受挫、破防、絆足、破綻、封穴、亂氣、內傷、失神與纏械。'],
  channel: ['渡氣', '每位受術同伴各回復 6 內力，施術者自身除外。'],
  overflow: ['餘氣護身', '溢出的療傷量轉成一回合護盾，上限 12。護盾取較強者。'],
  riposte: ['借勁還手', '受術者本回合首次承受敵方直接傷害並存活時，震回所失氣血，最多 9 點。'],
  pull: ['牽引', '將存活目標沿主軸向施術者牽近一格，落腳處須空置可行。'],
  line: [
    '穿行',
    '在同一橫列或直行出招時，餘勢穿過主目標，再擊其後兩格內首名敵人，威力 45%。阻地或友軍截斷餘勢。'
  ],
  arc: ['走勁', '餘勁躍向主目標兩格內最近的另一敵人，威力 32%。等距時取靠北、再靠西者。'],
  distill: ['催毒', '引爆目標已有的餘毒，一次加上尚餘毒量，最多 16 威力，舊毒消散。'],
  flank: ['夾擊', '與同伴隔敵同軸，且同伴緊貼敵人背面時，首段威力加 7，同伴回復 4 內力。'],
  leech: ['回生', '依主目標實際損血回復四分之一氣血，捨去小數，每次最多 9 點。'],
  landing: ['落步成陣', '落地時自己與相鄰同伴得 8 點護盾，持續至本回合結束。'],
  still: ['定勢', '本回合未移動，首段威力加 5。'],
  collision: ['撞關', '牽引或擊退的去路受阻時，首段威力加 7。'],
  antidote: ['以毒解毒', '擊中已有中毒的敵人時，解去施術者自身中毒。'],
  again: ['連環', '此招擊倒主目標時，本回合可再出手一次；每回合限一次。'],
  glide: ['回身', '出招後仍可走完本回合未用的步數，走後不能撤步。'],
  siphon: [
    '吸勁',
    '命中後回復 8 點內力，並使目標的絕技延後一回合；同一敵人每回合只延一次，局主不能連續兩回合被延。'
  ]
};
// What 解厄 lifts. The prices of a summit (露空, 無守, 立樁, 曲終) are left out on purpose, so a
// companion cannot erase them.
const AILMENTS = [
  'poison',
  'weak',
  'exposed',
  'pin',
  'mark',
  'seal',
  'backlash',
  'wound',
  'daze',
  'disarm'
];
const supportForms = new Set(['cleanse', 'channel', 'overflow', 'riposte']);
function weaponFormText(forms) {
  return forms
    .map(
      (id) =>
        (supportForms.has(id) ? '護持招式' : '普攻') +
        '【' +
        FORM_RULES[id][0] +
        '】' +
        FORM_RULES[id][1]
    )
    .join(' ');
}
function actionForms(weapon, art, basic) {
  const support = art && (art.target === 'ally' || art.target === 'self' || art.heal);
  const fromWeapon = (weapon?.forms || []).filter((id) =>
    art ? support && supportForms.has(id) && (id !== 'overflow' || art.heal) : !supportForms.has(id)
  );
  return [...new Set([...(art ? art.forms || [] : basic?.forms || []), ...fromWeapon])];
}
const distance = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const standing = (s, x, y) => s.units.find((v) => v.hp > 0 && v.x === x && v.y === y);
function forcedStep(s, u, t, art, forms, passable) {
  if (!s || (!art?.push && !forms.includes('pull'))) return null;
  const x = t.x - u.x,
    y = t.y - u.y,
    dir = art?.push ? 1 : -1;
  const dest = {
    x: t.x + (Math.abs(x) >= Math.abs(y) ? Math.sign(x) * dir : 0),
    y: t.y + (Math.abs(y) > Math.abs(x) ? Math.sign(y) * dir : 0)
  };
  return passable(dest.x, dest.y, s.mapIndex) && !standing(s, dest.x, dest.y) ? dest : null;
}
function contactPlan(s, u, t, art, forms, step, boss) {
  const has = (id) => forms.includes(id),
    c = t.conditions || {},
    notes = [];
  const spentMark = !!(has('exploit') && c.mark),
    spentPoison = !!(has('distill') && c.poison);
  let extra = 0;
  if (spentMark) {
    extra += 9;
    notes.push('收隙 · 首段 ＋9，封住還擊');
  }
  if (spentPoison) {
    const n = Math.min(16, Math.max(0, c.poison.through - (s?.round ?? 1) + 1) * c.poison.power);
    extra += n;
    notes.push('催毒 · 餘毒轉成 ' + n + ' 威力');
  }
  if (has('still') && !u.moved) {
    extra += 5;
    notes.push('定勢 · 首段 ＋5');
  }
  if (has('collision') && (art?.push || has('pull')) && !step) {
    extra += 7;
    notes.push('撞關 · 去路受阻，首段 ＋7');
  }
  let partner = null;
  if (has('flank') && s && (u.x === t.x || u.y === t.y)) {
    const other = standing(s, t.x + Math.sign(t.x - u.x), t.y + Math.sign(t.y - u.y));
    if (other && other !== u && other.side === u.side) {
      partner = other;
      extra += 7;
      notes.push('夾擊 · 首段 ＋7');
    }
  }
  const effects = [];
  if (has('mark') && !spentMark) effects.push({ kind: 'mark', power: 1, turns: 2 });
  if (has('pin')) effects.push({ kind: 'pin', power: 2, turns: 2 });
  const sealed = has('seal') && !(boss && t.lastSealRound === s?.round - 1);
  if (sealed) effects.push({ kind: 'seal', power: 1, turns: 1 });
  else if (has('seal')) notes.push('局主已換氣，本回合抵抗封穴');
  return {
    extra,
    partner: partner?.id,
    partnerMp: partner ? Math.min(4, partner.maxMp - partner.mp) : 0,
    spentMark,
    spentPoison,
    clearPoison: !!(has('antidote') && c.poison && u.conditions?.poison),
    safe: !!(art?.safe || spentMark || sealed || c.seal),
    effects,
    notes
  };
}
// 廣及: how far a splash reaches from the impact — its four neighbours, or every tile within
// `radius` (counted in steps along the grid).
const splashRadius = (art) => (art?.radius > 1 ? Math.floor(art.radius) : 1);
// Whether a piece at p is within the splash of an impact at `center`.
const inSplash = (art, center, p) => {
  const d = distance(center, p);
  return d >= 1 && d <= splashRadius(art);
};
// A piece under 受制 fights for the heroes for now: no collateral of theirs falls on it.
const swayed = (v) => !!v.conditions?.charm;
// All collateral is simultaneous around the impact; a foe struck by two patterns takes the stronger blow once.
function secondaryTargets(s, u, t, center, art, forms, passable) {
  const targets = new Map(),
    add = (v, ratio) => {
      if (v && v !== t && v.side !== u.side && v.side !== 'prop' && v.hp > 0 && !swayed(v))
        targets.set(v, Math.max(targets.get(v) || 0, ratio));
    };
  if (art?.splash) for (const v of s.units) if (inSplash(art, center, v)) add(v, art.splash);
  if (forms.includes('line') && (u.x === t.x || u.y === t.y)) {
    const dx = Math.sign(t.x - u.x),
      dy = Math.sign(t.y - u.y);
    for (let n = 1; n <= 2; n++) {
      const x = t.x + n * dx,
        y = t.y + n * dy;
      if (!passable(x, y, s.mapIndex)) break;
      const v = standing(s, x, y);
      if (v) {
        add(v, 0.45);
        break;
      }
    }
  }
  if (forms.includes('arc')) {
    const near = s.units.filter(
      (v) =>
        v !== t && v.side !== u.side && v.side !== 'prop' && v.hp > 0 && !swayed(v) && distance(t, v) <= 2
    );
    near.sort((a, b) => distance(t, a) - distance(t, b) || a.y - b.y || a.x - b.x);
    add(near[0], 0.32);
  }
  return targets;
}
function supportEntry(forms, u, v, power) {
  const amount = Math.min(v.maxHp - v.hp, power);
  return {
    id: v.id,
    amount,
    clean: forms.includes('cleanse') ? AILMENTS.filter((k) => v.conditions?.[k]) : [],
    mp: forms.includes('channel') && u !== v ? Math.min(6, v.maxMp - v.mp) : 0,
    overflow: forms.includes('overflow') ? Math.min(12, power - amount) : 0
  };
}

export { FORM_RULES, AILMENTS, splashRadius, inSplash, weaponFormText, actionForms, forcedStep, contactPlan, secondaryTargets, supportEntry };
