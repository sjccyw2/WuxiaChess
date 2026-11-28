// Flat bonuses are applied once per action, before wards and shields.
//
// [name, rule]. Most names are rule words (破綻, 截勁, 牽引 …). The ones in PLAIN_FORMS are not:
// their name is a short plain phrase, and a card prints their rule as a sentence, not as a word
// to learn (the producer, Q-N132 and Q-N161).
const FORM_RULES = {
  mark: ['破綻', '命中後在目標身上留下兩回合破綻。同一擊若已乘破綻，便不重留。'],
  exploit: ['破綻', '乘目標已有的破綻出手，首段威力加 9，該敵無法還擊，破綻隨之收去。'],
  pin: ['絆足', '本回合與下一回合，目標移動減 2，最低仍可走 1 步。'],
  seal: ['截勁', '本回合敵人不能還擊，也不能施展絕技。局主受過後，下一回合可抵抗。'],
  cleanse: ['解厄', '先替受術者解除中毒、攻勢受挫、破防、絆足、破綻、截勁、亂氣、內傷與纏械。'],
  channel: ['同伴各回復 6 內力', '每位受術同伴各回復 6 內力，施術者自身除外。'],
  overflow: ['溢出的療傷化為護盾', '溢出的療傷量化為一回合護盾，至多 12 點；護盾取較強者。'],
  riposte: ['反震', '受術者本回合首次承受敵方直接傷害並存活時，震回所失氣血，最多 9 點。'],
  pull: ['牽引', '將存活目標沿主軸向施術者牽近一格，落腳處須空置可行。'],
  line: [
    '濺射 身後兩格 45%',
    '在同一橫列或直行出招時濺射身後：餘勢穿過主目標，再擊其後兩格內首名敵人，威力 45%。阻地或友軍截斷餘勢。'
  ],
  arc: ['餘勁躍向兩格內另一敵人', '餘勁躍向主目標兩格內最近的另一敵人，威力 32%。等距時取靠北、再靠西者。'],
  distill: ['引爆目標的餘毒', '引爆目標身上每一層餘毒：尚未發作的毒傷全數加進這一擊，沒有上限，舊毒消散。'],
  leech: ['吸回損血的四分之一', '依主目標實際損血回復四分之一氣血，捨去小數，每次最多 9 點。'],
  landing: ['落地護住身旁同伴', '落地時自己與相鄰同伴各得 8 點護盾，持續至本回合結束。'],
  // 擊退 has this in its own rule (a push that is blocked gains 7); two pull arts keep it as a
  // plain sentence (Q-N132: 撞關 is no longer a word).
  collision: ['牽引受阻時首段 ＋7', '牽引的去路受阻、拉不動時，首段威力加 7。'],
  antidote: ['擊中中毒者解自身毒', '擊中已有中毒的敵人時，解去施術者自身中毒。'],
  again: ['連環', '此招擊倒主目標時，本回合可再出手一次；每回合限一次。'],
  glide: ['回身', '出招後仍可走完本回合未用的步數，走後不能撤步。'],
  siphon: [
    '回復 8 內力，延後目標絕技',
    '命中後回復 8 點內力，並使目標的絕技延後一回合；同一敵人每回合只延一次，局主不能連續兩回合被延。'
  ]
};
// Forms whose name is a plain phrase, not a rule word: the card and the weapon's text print
// their rule as it stands. (濺射 身後兩格 is the 濺射 term's, worded with its shape.)
const PLAIN_FORMS = new Set(['channel', 'overflow', 'line', 'arc', 'distill', 'leech', 'landing', 'collision', 'antidote', 'siphon']);
// A form as a card's detail prints it: 「破綻 · rule」, or a plain form's rule alone.
const formRule = (id) => (PLAIN_FORMS.has(id) ? FORM_RULES[id][1] : FORM_RULES[id].join(' · '));
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
  'disarm'
];
const supportForms = new Set(['cleanse', 'channel', 'overflow', 'riposte']);
function weaponFormText(forms) {
  return forms
    .map(
      (id) =>
        (supportForms.has(id) ? '護持招式' : '普攻') +
        (PLAIN_FORMS.has(id) ? '：' : '【' + FORM_RULES[id][0] + '】') +
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
    notes.push('乘破綻 · 首段 ＋9，封住還擊');
  }
  if (spentPoison) {
    // Every layer's bites still to come, with no cap (the producer, 2026-11-28, Q-N179); a poison
    // saved before layers is one (battle-mastery.js poisonLeft says the same).
    const round = s?.round ?? 1,
      layers = Array.isArray(c.poison.layers) ? c.poison.layers : [c.poison];
    const n = layers.reduce((sum, l) => sum + l.power * Math.max(0, l.through - round + 1), 0);
    extra += n;
    notes.push('餘毒轉成 ' + n + ' 威力');
  }
  // 擊退: a push whose way is blocked lands harder; so does a pull that carries the plain form.
  if (!step && (art?.push || (has('collision') && has('pull')))) {
    extra += 7;
    notes.push((art?.push ? '擊退' : '牽引') + '受阻 · 首段 ＋7');
  }
  const effects = [];
  if (has('mark') && !spentMark) effects.push({ kind: 'mark', power: 1, turns: 2 });
  if (has('pin')) effects.push({ kind: 'pin', power: 2, turns: 2 });
  const sealed = has('seal') && !(boss && t.lastSealRound === s?.round - 1);
  if (sealed) effects.push({ kind: 'seal', power: 1, turns: 1 });
  else if (has('seal')) notes.push('局主已換氣，本回合抵抗截勁');
  return {
    extra,
    spentMark,
    spentPoison,
    clearPoison: !!(has('antidote') && c.poison && u.conditions?.poison),
    safe: !!(art?.safe || spentMark || sealed || c.seal),
    effects,
    notes
  };
}
// 濺射's reach: how far a splash reaches from the impact — its four neighbours, or every tile within
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

export { FORM_RULES, PLAIN_FORMS, formRule, AILMENTS, splashRadius, inSplash, weaponFormText, actionForms, forcedStep, contactPlan, secondaryTargets, supportEntry };
