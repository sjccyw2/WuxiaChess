// The wiki's own wording.
//
// Almost everything in the catalog is read from the game. The few sentences here explain
// rules that the game enforces in code but never spells out as a single line of text.
// If one of these rules changes in the game, this is the only wiki file to revisit.
export const NOTES = {
  itemUse: {
    weapon: '拖到俠客、身形圖或兵器欄。',
    gear: '拖到俠客、身形圖或護具欄。',
    use: '共用藥箱。每次扣一份，服藥不耗移動或行動，沒有每回合次數限制。'
  },
  manualUse: '每冊只授一人，授予後仍須滿足先修。',
  manualSource: '通吃坊購得，或三盅賭局所得。將武譜交給指定俠客後，才會出現在其授譜頁。',
  bossSignature:
    '首五局第三回合起蓄勢，後五局從第二回合起。蓄滿後保持，能出擊才施展。施展後相隔三回合可再用。封穴時無法施展。',
  secondSignature:
    '第二回合起蓄勢。蓄滿後保持，能出擊才施展。施展後相隔三回合可再用。封穴時無法施展。',
  mendSignature:
    '第二回合起蓄勢。蓄滿後保持，三格內有同夥氣血不足七成才施展，否則以普攻出手。施展後相隔三回合可再用。封穴時無法施展。',
  mirrorSignature:
    '首五局第三回合起蓄勢，後五局從第二回合起。蓄滿後保持，直到第一次受到直接攻擊；吸勁可使它延後。封穴時無效。',
  phaseCadence: (n) => '半血變招後改為相隔' + '一二三四五'[n - 1] + '回合。',

  // Sentences built around numbers the game exports (REWARDS, GROWTH, raiseLevel).
  sideReward: (r) => '額外 ' + r.side + ' 兩。不是最後一局、且仍有未應帖的俠客時，另有一人應帖而來。',
  clearReward: (r) =>
    r.clear + ' ＋ ' + r.perStage + ' ×（第幾局 − 1）兩，全體同行俠客各 1 武學點。',
  levelling: (g) => '每滿 ' + g.levelXp + ' 歷練升一級，每級與每次過關各得 1 武學點。',
  levelGain: (d) =>
    '每級攻擊加 ' + d.atk + '、防禦加 ' + d.def + '、氣血加 ' + d.hp + '、內力加 ' + d.mp + '。',
  actionXp: (g) =>
    '普攻 ' +
    g.basicXp +
    '，絕技 ' +
    g.skillXp +
    '。每擊倒一人額外 ' +
    g.killXp +
    '。三級以後的出招所得乘以 100 ÷（100 ＋ ' +
    g.drag +
    ' × 超過三級的級數），四捨五入。',

  // Plain statements of behaviour that lives in code only.
  reserveGrowth: '候補入隊沿用同一成長。',
  midBattleStudy: '剛參悟的絕技會填入空格。三格皆滿時，可選一格替換一次。',
  lateFoes:
    '第七局起，敵軍會衡量現有護盾，並留意身旁無人且沒有地形掩護的領隊。第八局起局主可走四步，斥候能攻兩格。'
};
