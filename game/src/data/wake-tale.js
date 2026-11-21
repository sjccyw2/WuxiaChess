// What carries over from one run to the next. People forget; the stone keeps what the
// youth leaves on it, one mark at the end of each run, won or lost.
//
// WORLD is what the youth can read for himself: the invitation and the stone. It says
// nothing of who set the boards.
const WORLD = [
  {
    name: '帖上的話',
    text: '帖上說：借一念入局，同下十局。十局皆勝，還君此刻，另贈一悟。中道而敗，原念奉還，無損，亦無得。帖末沒有落款。'
  },
  {
    name: '不同年月的人',
    text: '應帖的人各自從自己的年月來。有人方才還在城牆上，有人方才還在黑牢裡。他們都說，來之前那一瞬，自己正走到絕處。帖發了許多張，還有人持帖在盤外觀望：哪一局點亮了引路燈，或是贏得快、贏得一人不倒，便多一人肯來。'
  },
  {
    name: '執子之人',
    text: '入了盤的人只看得見身邊幾步，盤外的人才看得見全局，所以由盤外的人落子。先落的一枚是「眼」；眼破，全盤皆輸。盤上至多五枚白子。倒下的人只是離盤一局，下一局再落。'
  },
  {
    name: '對面的人',
    text: '黑子是另一個人落的。每一局他落下一位局主、一位副手。他們也是從自己的年月裡來的，卻沒有收過帖：一道劍意從盤外壓在他們心頭，叫他們非戰不可，自己也說不出緣由。勝了這一局，劍意便散，他們各自醒來。'
  },
  {
    name: '忘與不忘',
    text: '走出這個地方，人會把這裡的事忘掉。石頭不會，器物不會，那個姓韋的也不會。'
  },
  {
    name: '石上的痕',
    text: '每一輪臨去，在石上留一道記號。贏的一輪留，輸的一輪也留。下一回睜眼，認不得人，還認得自己的痕。'
  },
  {
    name: '十局之後',
    text: '走完十局，同行的人各自回去，帶走一悟。執子的人可以登上階頂，去見刻字的那個人。'
  }
];

// The last thing he senses each run, after closing his eyes: his real life, where he lies
// asleep. Sound, smell and touch only. They come in order, then repeat.
const FRAGMENTS = [
  '有甚麼濕熱的東西在舔他的臉。一下，又一下。是一條狗。',
  '鍋鏟碰著鐵鍋，嚓，嚓。有飯香。灶前有人在做飯，是娘。',
  '娘在喊他起來。喊的是他的名字。偏偏那兩個字，他怎麼也聽不清。',
  '雞啼了。窗紙發白，被窩外頭很冷。他不想起來。他想回谷裡去，雖然他已經不記得谷裡有誰。',
  '被窩裡，他的手還握著，像剛握過誰的手。不止一個人的手。'
];
const CLOSING = {
  win: '那句「還不夠」還在耳邊。他闔上眼。',
  loss: '眾人散去的背影還在眼前。他闔上眼。'
};
// One picture per fragment, in the same order (asset-gen/prompts.md, B6).
const FRAGMENT_ART = FRAGMENTS.map((_, i) => 'fragment-' + (i + 1) + '.webp');
// voyage counts from 1.
const fragmentAt = (voyage) => (Math.max(1, voyage) - 1) % FRAGMENTS.length;
const closingFor = (voyage, won) => (won ? CLOSING.win : CLOSING.loss) + FRAGMENTS[fragmentAt(voyage)];
const fragmentArt = (voyage) => FRAGMENT_ART[fragmentAt(voyage)];

// Index 0 is the first run (no marks yet). Index 4 is also used on later runs.
//   opening   what he finds on the stone when he opens his eyes (first board)
//   echo      what he says at the night talk (fifth board)
//   mark      the mark this run leaves; carve tells how
//   afterWin / afterLoss   closing his eyes
const wake = (voyage, entry) => ({
  ...entry,
  afterWin: closingFor(voyage, true),
  afterLoss: closingFor(voyage, false)
});
const WAKES = [
  wake(1, {
    name: '第一道・劍痕',
    mark: '一道劍痕',
    opening: {
      note: '石臺旁有一面石壁，平整，乾淨，上頭甚麼也沒有。',
      text: '好乾淨的一面石頭。……我為甚麼會留意一面石頭？'
    },
    echo: {
      note: '谷口的月亮三天沒有動過。',
      text: '石上那行字說，贏了他，我就知道自己是誰。你們呢？贏了回去，要做甚麼？'
    },
    carve: '臨去，韋小寶教他一個乖：在石頭上劃一道，下回好認。他不懂甚麼叫下回，還是拔劍劃了。'
  }),
  wake(2, {
    name: '第二道・兩點',
    mark: '兩個點，一深一淺',
    opening: {
      note: '石壁上有一道新痕。',
      text: '這是劍尖劃的。我拔劍比了比……是我這柄劍。我幾時來過？'
    },
    echo: {
      note: '燈下，他把石上那道劍痕的事說了。沒有人信。',
      text: '我疑心我來過這裡。……算了，當我沒說。你們贏了回去，要做甚麼？'
    },
    carve: '他用劍尖在那道痕旁邊點了兩下，一深一淺。這一回，是他自己要留的。'
  }),
  wake(3, {
    name: '第三道・一行字',
    mark: '一行字：「你又忘了。照舊走十局。」',
    opening: {
      note: '他想也沒想，用劍尖在石上敲了兩下，一深一淺。然後才看見，石上早有這樣兩個點。',
      text: '我的手記得，我不記得。……那就別靠記性。'
    },
    echo: {
      note: '燈下，他把石上的痕一道一道指給眾人看。',
      text: '這幾道都是我的劍尖留的，我卻不記得。我想，我們來過。不止一回。'
    },
    carve: '他在石上刻了一行字，刻得很深：「你又忘了。照舊走十局。」'
  }),
  wake(4, {
    name: '第四道・並排',
    mark: '兩行字並排，筆跡相同',
    opening: {
      note: '石上有一行字，是他的筆跡：「你又忘了。照舊走十局。」',
      text: '是我寫的。寫給我自己。……好，照舊。'
    },
    echo: {
      note: '燈下，他把石上那行字唸了一遍。',
      text: '這是我寫給自己的。我們來過。我想問的是另一件事：對面下棋的那個人，是誰？'
    },
    carve: '他把這行字再刻一遍，刻在臺沿那行舊字旁邊。兩行並排，他才看出來：筆跡是一樣的，只是舊的那行老得多。'
  }),
  wake(5, {
    name: '第五道・掌印',
    mark: '同行者的掌印',
    opening: {
      note: '兩行字並排刻在石上。「勝我者，得其名。」「你又忘了。照舊走十局。」同一手筆跡，一行老，一行新。',
      text: '是刻字的人學我的字，還是我學他的？……先走完十局再說。'
    },
    // From the sixth run on, the palm prints are already there.
    openingLater: {
      note: '石上兩行字底下，疊著幾個大小不一的掌印。',
      text: '這些手印不是我的。有人陪我來過。……不止一個。'
    },
    echo: {
      note: '燈下，他數了數石上的痕，又數了數眼前的人。',
      text: '我們來過，不止一回。每一回都有人陪我走到這裡。我只想記住這一件事。'
    },
    carve: '同行的人各在石上按了一個掌印。大大小小，疊在他那兩行字底下。'
  })
];

// From the fifth run on, a won run ends with a choice about the palm prints. Either one is
// permanent; it only changes what the next run opens on.
const FATE_PROMPT = '石上這些掌印，留還是不留？';
const FATES = [
  {
    id: 'witness',
    name: '留名',
    desc: '把同行者的名字刻在掌印旁邊。下一輪睜眼，你讀得到是誰陪你走過。這些名字從此留在這座谷裡。',
    ending:
      '你把同行的人的名字，一個一個刻在掌印旁邊。刻到最後一個，石屑落在手背上。往後每一輪睜眼，你都會先讀到這些名字，再想起自己沒有名字。',
    echo: '石上的掌印旁邊刻著幾個名字，是他的筆跡。他一個也不認得，唸出來卻很順口。'
  },
  {
    id: 'return',
    name: '還名',
    desc: '把石上的掌印抹平，讓每個人只帶走自己那一悟。谷仍是無名之谷。',
    ending:
      '你用掌根把那些手印一個一個抹平。石頭又乾淨了。他們各自帶著一悟回去，誰也不欠這座谷甚麼。',
    echo: '石上很乾淨。韋小寶多說了一句：「上回那幾位，走得很乾淨。」問他甚麼上回，他又賴了。'
  }
];

export { WORLD, WAKES, FATES, FATE_PROMPT, FRAGMENTS, closingFor, fragmentArt };
