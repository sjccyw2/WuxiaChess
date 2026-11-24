// What carries over from one run to the next. The heroes are copied afresh each run and the
// youth wakes with only a shadow of the dream; 求敗 remembers every stone. Each run the youth
// wins is one 境界, and for each 求敗 cuts a line in the stone beside the table: the story of one
// of the swords he laid down.
//
// WORLD is what the youth can read and work out for himself, in the journal.
const WORLD = [
  {
    name: '局規',
    text: '棋臺上刻著：「白子勝滿十局，放還本尊。中道而敗，收子入盒。」姓韋的說，贏足十場便回家，輸了便全進盒子。'
  },
  {
    name: '不同年月的人',
    text: '黑白子各是一位高手，落盤便立起人影，個個都說自己來前正逢絕處。開局抓五枚留三枚，此後每勝一局，老伯便再借一枚白子。'
  },
  {
    name: '執子之人',
    text: '盤裡只看得見幾步，盤外才看得全，指路便由盤外的人來。白子至多上五枚，先落的一枚叫「眼」，它倒了便全盤皆輸。其餘的人倒下，只離盤一局，下局仍可再落。'
  },
  {
    name: '對面的人',
    text: '老伯自稱求敗，本名已忘，左右手對弈了幾百年。落黑子時，他把戰意按在人眉心，逼人交手；人雖不服，卻要等這局輸了才能掙開。聽見臺上「嗒」的一聲，便是他又添了子。'
  },
  {
    name: '忘與不忘',
    text: '夢醒人事便模糊，手上的功夫卻沒忘。老伯一手棋也記得；姓韋的明明也記得，一問便賴。'
  },
  {
    name: '臺邊的五行字',
    text: '在已開的最高境界勝一輪，老伯便刻下一柄舊劍的來歷。輸了，或重下已勝過的境界，石上都不添字。'
  },
  {
    name: '十局之後',
    text: '十局全勝，同行的人便回本尊那裡。老伯說了「好棋」，又說「請回吧」，少年便醒了。'
  },
  {
    name: '韋小寶的盤口',
    text: '姓韋的局局開盤口，押少年能贏出甚麼花樣。中注便分銀子、武譜，有時一場打得順手，賺的是人人又想起些功夫。老伯看不見這門生意，也聽不見。'
  }
];

// What he wakes to at the end of a run, by 境界: his real life, where he has been lying asleep.
// Sound, smell and touch, and what his hands do before he remembers anything.
const FRAGMENTS = [
  '一條濕熱的舌頭正舔著他的臉，是家裡的狗。谷中只剩一張棋臺、一個老人的模糊影子，手指卻還拈著，彷彿那枚子尚未落下。',
  '鍋鏟嚓嚓碰著鐵鍋，飯香從灶前飄來，娘正忙著做飯。他拾起灶邊一根柴枝，手腕一抖，竟挽出個劍花。',
  '娘喊他起身，那名字聽了十幾年，這時卻有些生疏，像是夢裡一直有人叫他另一個名字。他到屋後翻找，找出一柄生鏽的舊劍。',
  '雞啼聲起，窗紙已白，被窩外頭冷得很。他還想睡回去，把那盤棋下完；磨亮的劍，就擱在枕邊。',
  '被窩裡那隻手仍握著，彷彿還留著許多人掌心的暖意。他握住枕邊的劍，走出屋去，天尚未亮。'
];
const CLOSING = {
  win: '耳邊那聲「請回吧」未散，少年已醒。',
  loss: '耳邊合盒的聲音未散，少年已醒。'
};
// realm counts from 1.
const closingFor = (realm, won) =>
  (won ? CLOSING.win : CLOSING.loss) + FRAGMENTS[Math.min(FRAGMENTS.length, Math.max(1, realm)) - 1];
// One picture per fragment, in the same order (asset-gen/prompts.md, B6).
const fragmentArt = (realm) => 'fragment-' + Math.min(FRAGMENTS.length, Math.max(1, realm)) + '.webp';

// The five 境界. Index 0 is the first: no run won yet.
//   mark   the line cut in the stone when this 境界 is won
//   echo   what the youth says at the night talk (before the fifth board)
//   carve  how the line came to be cut, told when the run is won
const wake = (realm, entry) => ({
  ...entry,
  afterWin: closingFor(realm, true),
  afterLoss: closingFor(realm, false)
});
const WAKES = [
  wake(1, {
    name: '第一行・利劍',
    sword: '利劍',
    title: '深谷一枰逢稚子',
    mark: '利劍：弱冠之前所用',
    echo: {
      note: '谷口的月亮，三天沒有動過分毫。',
      text: '看各位動手，我倒像是在學劍，劍卻不在我手裡。等贏了回去，各位要做甚麼？'
    },
    carve: '少年臨走回頭，見求敗正持舊劍刻石，寫下弱冠前那柄利劍的來歷。刻完了，他仍望著那行字。'
  }),
  wake(2, {
    name: '第二行・軟劍',
    sword: '軟劍',
    title: '棄劍容易棄子難',
    mark: '軟劍：誤傷義士，棄之深谷',
    echo: {
      note: '燈光照著少年的臉，求敗說過的話又在他心頭轉了一遍。',
      text: '老伯說各位是拓來的。可哪有拓片會渴、會想家的？這話聽著惱不惱？'
    },
    carve: '第二行刻的是軟劍：「誤傷義士，棄之深谷。」劍尖行到「棄」字，停了一停。'
  }),
  wake(3, {
    name: '第三行・重劍',
    sword: '重劍',
    title: '始聞盤上不平聲',
    mark: '重劍：重劍無鋒，大巧不工',
    echo: {
      note: '少年從燈邊望去，求敗雙目雖閉，眉間仍皺著。',
      text: '對手一說那念頭不是他的，老伯便抬了頭。各位給人拓來，心裡又怎麼想？'
    },
    carve: '求敗刻下第三行：「重劍無鋒，大巧不工。」劍尖落得甚輕，只掉了些許石屑。'
  }),
  wake(4, {
    name: '第四行・木劍',
    sword: '木劍',
    title: '草木竹石皆可劍',
    mark: '木劍：不滯於物，草木竹石均可為劍',
    echo: {
      note: '少年在燈下一個個數過身邊的人。',
      text: '老伯問我怎麼不挑人，我說來的都是朋友。本人也好，拓來的也好，都一樣。各位怎麼想？'
    },
    carve: '第四行是木劍：「不滯於物，草木竹石均可為劍。」刻罷，求敗把劍橫在膝頭，沒有收起。'
  }),
  wake(5, {
    name: '第五行・無劍',
    sword: '無劍',
    title: '無劍猶握一枰棋',
    mark: '最後一行，他沒有刻',
    echo: {
      note: '想起求敗說這是最後一盤，少年在燈下把眾人的臉一張張看過，像要記牢些。',
      text: '下完各位歸本尊，我回被窩。醒了怕要忘，各位別怪。各位說是拓來的，心裡怎麼想？'
    },
    carve: '石上還餘一行空處，求敗提劍看了看，卻把劍輕輕放到石旁。那一行終究空著。'
  })
];
// A lost run cuts no line.
const NO_MARK = '這輪棋未下完，石上也未添字。';

export { WORLD, WAKES, FRAGMENTS, NO_MARK, closingFor, fragmentArt };
