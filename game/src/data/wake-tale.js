// What carries over from one run to the next. The heroes are copied afresh each run and the
// youth wakes with only a shadow of the dream; 求敗 remembers every stone. Each run the youth
// wins is one 境界, and for each 求敗 cuts a line in the stone beside the table: the story of one
// of the swords he laid down.
//
// WORLD is what the youth can read and work out for himself, in the journal.
const WORLD = [
  {
    name: '局規',
    text: '棋臺沿上刻著兩行字：白子勝滿十局，放還本尊；中道而敗，收子入盒。姓韋的說得更白：贏足十場放你們回去，輸了統統收進盒子裡。'
  },
  {
    name: '不同年月的人',
    text: '棋盒裡的白子黑子，各是一位高手。子一沾棋盤，子上便立起人來。他們都說，來之前那一瞬，自己正走到絕處。開局抓三枚；每勝一局，對面的老伯便再借出一枚白子。'
  },
  {
    name: '執子之人',
    text: '入了盤的人只瞧得見身邊幾步，盤外的人才瞧得見全局，所以由盤外的人來說往哪裡走。先落的一枚是「眼」；眼破，全盤皆輸。盤上至多五枚白子。倒下的人只是離盤一局，下一局再落。'
  },
  {
    name: '對面的人',
    text: '他自稱求敗，說自己的姓名早已忘了。這盤棋他左手同右手下了幾百年。黑子是他落的：他落子之時，將一道戰意按在他們眉心，叫他們見人便打。他們不服，卻掙不開。勝了這一局，戰意才散。棋臺上「嗒」的一聲，便是他又落了一子。'
  },
  {
    name: '忘與不忘',
    text: '少年醒了便忘，只剩一點影子，手卻記得。對面的老伯一手也沒有忘。那個姓韋的也記得，問他，他就賴。'
  },
  {
    name: '臺邊的五行字',
    text: '少年在已開的最高境界每勝一輪，求敗便在臺邊的石上刻一行字，是他從前一柄劍的來歷。輸掉的一輪，或重下已勝過的境界，石上不添字。'
  },
  {
    name: '十局之後',
    text: '贏滿十局，同行的人放還本尊。求敗說一聲「好棋」，請少年回去。少年便醒了。'
  },
  {
    name: '韋小寶的盤口',
    text: '那個姓韋的每一局都另開一個盤口，押少年贏得出甚麼花樣。押中了分紅：銀子、一卷武譜，或是一場打得太好、叫手自己記起來的仗。對面的老伯瞧不見他，也聽不見他。'
  }
];

// What he wakes to at the end of a run, by 境界: his real life, where he has been lying asleep.
// Sound, smell and touch, and what his hands do before he remembers anything.
const FRAGMENTS = [
  '有甚麼濕熱的東西在舔他的臉，一下，又一下。是家裡的狗。夢只剩一點影子：一張棋臺，一個老人。他的手指還拈著，像拈著一枚棋子。',
  '鍋鏟碰著鐵鍋，嚓，嚓。有飯香。娘在灶前做飯。他拾起灶邊一根柴枝，不知怎地，手腕一抖，挽了個劍花。',
  '娘在喊他起來，喊的是他的名字。這兩個字他聽了十幾年，此刻聽來竟有些生疏，倒似有人一直叫他別的甚麼。他到屋後翻出一柄生了鏽的舊劍。',
  '雞啼了，窗紙發白，被窩外頭好冷。他不想起來：他想回去把那盤棋下完。那柄劍已經磨亮了，擱在枕邊。',
  '被窩裡，他的手還握著，像剛握過許多人的手。他握住枕邊的劍，走到屋外，天還沒有亮。'
];
const CLOSING = {
  win: '那一聲「請回吧」猶在耳邊。少年醒了。',
  loss: '盒蓋合上的那一聲猶在耳邊。少年醒了。'
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
      text: '我覺得我是在學劍，只是劍不在我手上。……各位贏了回去，要做甚麼？'
    },
    carve: '少年臨去回頭，見求敗取過一柄舊劍，在臺邊石上刻了一行字，刻的是他少年時一柄利劍的來歷。刻完，他對著那行字瞧了很久。'
  }),
  wake(2, {
    name: '第二行・軟劍',
    sword: '軟劍',
    title: '棄劍容易棄子難',
    mark: '軟劍：誤傷義士，棄之深谷',
    echo: {
      note: '燈下，少年將求敗那句話又想了一遍。',
      text: '老伯說各位只是拓下來的一份。我不信一張拓片會口渴、會想家。……各位聽了，惱不惱？'
    },
    carve: '求敗在石上刻了第二行，刻的是一柄軟劍：誤傷義士，棄之深谷。刻到「棄」字，他的手停了一停。'
  }),
  wake(3, {
    name: '第三行・重劍',
    sword: '重劍',
    title: '始聞盤上不平聲',
    mark: '重劍：重劍無鋒，大巧不工',
    echo: {
      note: '燈下，少年望了望棋臺那邊。求敗閉著眼，眉頭卻沒有鬆開。',
      text: '適才那位對手說，那念頭不是他的。老伯頭一回抬頭瞧了他一眼。……各位給人拓了來，惱不惱？'
    },
    carve: '求敗在石上刻了第三行，刻的是一柄重劍：重劍無鋒，大巧不工。這一行他刻得極輕，石屑也沒有落下多少。'
  }),
  wake(4, {
    name: '第四行・木劍',
    sword: '木劍',
    title: '草木竹石皆可劍',
    mark: '木劍：不滯於物，草木竹石均可為劍',
    echo: {
      note: '燈下，少年數了數身邊的人。',
      text: '老伯問我，怎地抓著誰便用誰。我說，來的都是好朋友，哪有得揀的。……各位是拓來的也好，是本人也好，我一樣當各位是朋友。'
    },
    carve: '求敗在石上刻了第四行，刻的是一柄木劍：不滯於物，草木竹石均可為劍。刻罷，他將那柄刻字的劍橫在膝上，沒有收起。'
  }),
  wake(5, {
    name: '第五行・無劍',
    sword: '無劍',
    title: '無劍猶握一枰棋',
    mark: '最後一行，他沒有刻',
    echo: {
      note: '燈下，少年將每個人的臉都瞧了一遍。',
      text: '老伯說這是最後一盤。下完了，各位回各位的年月，我回我的被窩。……我記性不好，醒了多半要忘。各位莫怪。'
    },
    carve: '石上還空著一行的地方。求敗提起那柄刻字的劍，瞧了一瞧，沒有刻，將劍輕輕放在石旁。最後一行，他沒有刻。'
  })
];
// A lost run cuts no line.
const NO_MARK = '這一輪沒有下完。臺邊的石上，沒有多一行字。';

export { WORLD, WAKES, FRAGMENTS, NO_MARK, closingFor, fragmentArt };
