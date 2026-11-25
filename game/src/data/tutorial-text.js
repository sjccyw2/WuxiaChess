// The words of the first board's tutorial (ui/tutorial.js), all in one place.
//
// This is interface text, in the in-game guide's register and with its words (data/rule-terms.js):
// 俠客, 領隊, 氣血, 招式, 射程, 撤步, 走位, 起陣, 交鋒預覽. It is not story text and nobody speaks it.
// Where a step shows one of the first tier's rule words on the screen (FIRST_TIER in rule-terms.js:
// 還擊 in 交鋒預覽, 待命 at the end of the turn, 勝負 and 領隊陣法 with the leader), its card names it,
// and the last card sends the player to the guide's 基本規則 (Q-N161, T1).
//
// A card has room for two short sentences. On a phone held sideways it is a strip of two lines
// between the unit tools and 結束回合: a step fits in two lines there up to about 40 characters,
// and the four that show beside the ready art's chip (arts, aim, aimNone, stuck) up to about 35.
//
// Two marks are filled in when a card is drawn:
//   {name}     the hero the step is about (the one selected, or the 領隊)
//   {danger}   the danger-zone button's own icon (the warning triangle), drawn in the line
const TUTORIAL_TEXT = {
  // The card's accessible name, its counter and its buttons.
  label: '新手指引',
  count: '指引 {n}／{total}',
  ok: '知道了',
  finish: '完成',
  skip: '略過指引',
  // What {danger} is read out as (the danger-zone button's own name).
  dangerName: '敵方攻擊範圍',
  // The message after 略過指引.
  skipped: '指引已略過。想重看，可到選單的「指南」。',
  // The control in the in-battle guide (遊玩指南) that plays the tutorial again on this board.
  replay: '重看新手指引',
  steps: {
    // 起陣, until 開戰.
    deploy: '起陣：點一位俠客，再點另一位俠客或亮起的空格，可互換位置。排好後按「開戰」。',
    // The selected hero has not walked yet.
    move: '金框標出的{name}由你指揮。青綠地格是這回合走得到的地方，點一格走過去。',
    // The hero has walked: the arts list, and 撤步.
    arts: '招式表寫著各招的射程與威力；按住一招不放，可看它的完整效果。選好招式，戰盤才標出射程。走錯了可按「撤步」。',
    // An art is ready and an enemy stands in its reach.
    aim: '紅色地格是這招的範圍：只算橫直，斜角不算相鄰。點範圍內的敵人。',
    // An art is ready and nobody stands in its reach.
    aimNone: '紅色地格是這招的範圍，斜角不算相鄰。打不到人很平常，可換人或結束回合。',
    // An art was picked before walking and nobody is in reach: how to get the walk back (the
    // list's 走位 row; a tap on open ground does the same).
    stuck: '還沒走位就選了招式。要先走位，按招式表的「走位」，或點一下空地。',
    // 敵情查探 opened by tapping an enemy: before any art is ready; and with one ready, which
    // takes a second tap on an enemy out of reach (the first only shows the reach on the board).
    profile: '這是敵情查探，只看資料，不算出招。要出招：先走位、選招式，再點紅色地格上的敵人。',
    profileArmed: '這是敵情查探，不算出招。射程外的敵人，點第一下只亮出射程，再點一下才開這一頁。',
    // 交鋒預覽, and the preview of an art that is not a blow at an enemy.
    preview: '這是交鋒預覽：雙方氣血的前後變化、預計傷害與敵方還擊。看清楚了，按「確認出招」。',
    previewOther: '出招前先看預覽：對象、效果與消耗。看清楚了，按右下角的按鈕施展。',
    // The first hero is done and others are still to act.
    others: '每位俠客每回合可走位一次、出招一次。要換人，點另一位俠客。',
    // Ending the turn.
    turn: '都安排好了就按「結束回合」。未出招的俠客會自動待命，防禦暫時提升。',
    // From the second round: the danger zone, the view, the goal and the leader, the guide.
    danger: '按右上角的 {danger}，會標出敵方下一回合打得到的地格，走位前先看一眼。',
    viewTouch: '雙指開合可縮放，單指拖曳可旋轉戰場。「視角」裡可切換俯視、重設視角。',
    viewMouse: '滾輪可縮放，拖曳可旋轉戰場。「視角」裡可切換俯視、重設視角。',
    goal: '點地名牌看本局勝負。領隊{name}倒下，這一輪便結束；他的領隊陣法及於兩格內的友軍。',
    guide: '基本規則和本局用得上的規則都在「選單」的「指南」裡，也可在那裡重看指引。'
  }
};

export { TUTORIAL_TEXT };
