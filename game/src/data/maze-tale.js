// The story of one run, in three layers that never depend on one another:
//
//   the spine   MAZE_TALE: what happens at a position in the run (falling asleep into the valley,
//               the first board, the night talk, the end) and in which 境界 (how many runs the
//               youth has won). Told by 求敗, the youth, 韋小寶 and narration, who are there
//               whoever was drawn. Everything 求敗 says is here.
//   the boards  CHAMBER_TALES here, ENCOUNTER_SCRIPT in encounter-script.js: one board and its
//               black stones, on whom 求敗 has pressed a 戰意 that makes them fight. A board never
//               refers to another board or to its place in the order, so boards can be shuffled.
//   the heroes  hero-voices.js: lines a hero says wherever they are.
//
// The writing follows 金庸's manner (wiki/content/單輪劇本.md §15): plain classical mixed with
// vernacular, forms of address that fit the speaker, no modern words.

// The people who are always there but never on the board.
// In the dream the youth cannot recall his name, so he calls himself 無名 (the prologue tells it).
const YOUTH = { name: '無名', role: '執子之人', portrait: 'npc-youth.webp' };
const WEI = { name: '韋小寶', role: '通吃坊掌櫃', portrait: 'npc-wei.webp' };
// The great bird beside the table. It never speaks, and the game gives it no other name.
const EAGLE = { name: '大鵰', role: '谷中的鵰', portrait: 'npc-eagle.webp' };
// The one who set the boards. He sits across the table from the first scene and plays black.
const QIUBAI = { name: '求敗', role: '對面的人', portrait: 'npc-qiubai.webp' };
// The spine's wide pictures (asset-gen/prompts.md, group B), kept apart from the text.
const TALE_ART = {
  wake: 'scene-open-eyes.webp', // above the prologue's first page, every run
  board: 'scene-board.webp', // the top of the draw page (抓子)
  loss: 'scene-dark-stones.webp' // a lost run: the white stones gone dark
};

// {name} in a line is replaced by the youth's name.
// The youth reaches for his name and cannot find it (in the dream he has forgotten it), and calls
// himself 無名. Shared by the pages and the pages after the film. `names` marks the line from which
// the pages call him 無名 rather than 少年.
const YOUTH_FORGETS = {
  who: 'youth',
  note: '少年張口便要報上名字，那兩個字卻似到了嘴邊，又滑了回去。在這夢裡，他竟記不起自己叫甚麼。',
  text: '我叫……我叫……'
};
const YOUTH_NAMES = {
  who: 'youth',
  text: '怪了，自己的名字，怎地想不起來？……既然想不起，便叫「無名」罷。我在家裡睡覺，一睜眼便到了這裡。老伯，你又是誰？',
  names: true
};
const MAZE_TALE = {
  title: '劍影江湖・一念江湖',
  // Shown before the draw. A step is narration (note), a line (who, text), or both; `ask` marks
  // the page where the player types the youth's name, the first time only.
  prologue: {
    first: [
      { note: '這一覺睡得好沉。少年也不知過了多久，忽覺四下裡靜得出奇，連蟲聲也無，睜開眼來，竟不在自家床上。' },
      {
        note: '但見好大一座山谷，四面峭壁如削。谷底一方青石棋臺，臺邊坐著一個老者，白鬚垂胸，左手拈一枚黑子，右手拈一枚白子，正自己同自己對弈。',
        picture: QIUBAI.portrait
      },
      {
        note: '棋子之上，各立著寸許高的人影，或挺劍，或揮掌，在盤上鬥得正緊。臺畔蹲著一頭大鵰，身形比人還高，側過頭來向少年瞧了一眼，隔了一會，又瞧了一眼。',
        picture: EAGLE.portrait
      },
      { who: 'youth', text: '這……這是甚麼地方？我是不是死了？' },
      {
        who: 'qiu',
        note: '那老者手中的黑子停在半空，緩緩抬起頭來，臉上微現詫異之色。',
        text: '咦。老夫這劍境之中，幾百年來不曾有人闖得進來。……奇了。你身上半點功夫也無，老夫怎地瞧得見你？你是甚麼人？'
      },
      // In the dream he cannot recall his own name, so he makes one up: the name the player types.
      YOUTH_FORGETS,
      YOUTH_NAMES,
      {
        who: 'qiu',
        text: '無名？……嘿，這名字倒有些耳熟。想不起自己的名字，也不打緊。老夫自己的姓名，也早已忘了。世人叫我「求敗」。'
      },
      { who: 'youth', text: '求敗？天下哪有人盼著打敗仗的？' },
      {
        who: 'qiu',
        text: '求之而不可得，那也無可如何。你瞧這一盤棋，老夫左手同右手，已下了幾百年。左手想的，右手盡知；右手要的，左手早防。再下一千年，也下不出一著新棋來。'
      },
      {
        who: 'qiu',
        note: '他將一隻烏木棋盒推過臺面。',
        text: '你既來了，也是緣法。坐下，陪老夫下一盤。抓三枚。'
      },
      // The pages pick up here after the film (below).
      { who: 'youth', text: '我不會下棋。', afterFilm: true },
      { who: 'qiu', text: '這不是尋常的棋。子自己會走，自己會打。你只須告訴他們往哪裡去。' }
    ],
    // Every later run: he has slept again. `greeting` is 求敗's by the 境界 the player picked
    // (index 0 is the first 境界, which may be picked again at any time).
    // The first visit opens with a film (asset-gen/prologue-video), in a 9:16 cut for screens taller
    // than wide and a 16:9 cut otherwise: it tells the pages above up to 「抓三枚」, and in it the
    // youth is cut off before he can say his name. So after it he finds he cannot recall it and calls
    // himself 無名 (`name`, `named`), and the pages resume at `afterFilm`.
    film: {
      tall: { file: 'prologue-film.mp4', poster: 'prologue-film.webp' },
      wide: { file: 'prologue-film-wide.mp4', poster: 'prologue-film-wide.webp' },
      name: YOUTH_FORGETS,
      named: YOUTH_NAMES
    },
    again: {
      note: '少年又睡著了。再睜開眼來，仍是那座山谷，那方青石棋臺。他說不出幾時來過，腳下卻自己認得路，逕自走到臺前。那頭大鵰向他點了點頭。',
      greeting: [
        '你又來了，{name}。坐，隨便下一盤。',
        '又是你，{name}。坐。',
        '你來了。坐。這一輪，老夫不讓。',
        '你來了，{name}。老夫有一事不明，要向你請教。先下棋，下完了再問。',
        '坐罷。這是最後一盤了。'
      ],
      youth: '老伯，我好像來過這裡。同你下過棋，是不是？',
      reply: '下過。你醒了便忘，老夫卻一手也沒有忘。抓三枚。'
    }
  },
  // The rule cut into the edge of the table. Every stone that wins ten boards goes home.
  rule: '白子勝滿十局，放還本尊。中道而敗，收子入盒。',
  draw: '少年伸手入盒，抓了三枚白子，放在盤上。三枚白子一沾棋盤，登時亮了，子上各自立起一個人影。',
  // First board, after the three have arrived.
  ruleRead: {
    note: '棋臺沿上刻著兩行小字，筆劃深入石理：「白子勝滿十局，放還本尊。中道而敗，收子入盒。」',
    text: '臺沿上刻得有字。……是這盤棋的規矩。'
  },
  ruleTold:
    '瞧不明白是不是？我說給你們聽。贏足十場，這老兒便放你們回去；輸了一場，統統收進盒子裡，不見天日。辣塊媽媽，這叫做上了賊船，要下船，只有划到對岸。',
  // From the second 境界 the heroes are told that they are copies: by 求敗, coldly, in the second
  // and third 境界; by the youth himself in the fourth and fifth.
  told: {
    cold: [
      {
        who: 'qiu',
        note: '求敗頭也不抬。',
        text: '你當他們是人？不過是老夫從各人身上拓下來的一份，同碑帖一般。本尊好端端在自己的年月裡，半點不知。'
      },
      { who: 'youth', text: '可是他們會痛，也會想家。老伯，拓下來的若只是一張紙，紙是不會想家的。' },
      { who: 'qiu', text: '……落子罷。' }
    ],
    plain: [
      {
        who: 'youth',
        text: '有一件事，我不瞞各位。各位是這位老伯從本人身上拓下來的一份，本尊還在各自的年月裡。贏滿十局，這一份便還給本尊。'
      },
      { who: 'qiu', note: '求敗抬起頭來，瞧了少年半晌。', text: '……你倒肯對子說實話。' }
    ]
  },
  command: {
    note: '三個人你瞧我，我瞧你，又一齊轉頭瞧著少年。',
    text: '我也是剛到，不知這是甚麼地方。可是整盤棋我瞧得見，各位似乎只瞧得見身邊幾步。各位若是信得過，往哪裡走，由我來說。'
  },
  // Why famous fighters arrive holding one art: said by the one man who has watched it before.
  recall: {
    note: '三個人各自起了個手勢，都只起到一半，便停住了。',
    text: '不用慌，個個來到都是這樣。手上最熟的那一樣還在，後來學的，打得幾場自己便回來了。……我說了「個個」麼？你聽錯啦。'
  },
  deploy: '盤上只有五個落子的位置。先落的一枚是「眼」；眼破，全盤皆輸。其餘的人在盤邊等著，下一局仍可換上。',
  // Before round one the stones are still in his hand.
  inHand: '子還在手上，換得。一按「開戰」，落子無悔。',
  // The briefing (軍情): the youth looks the board over from the table before anyone steps on.
  brief: {
    lead: '入盤之前，少年在棋臺邊將這一局先瞧了一遍。入了盤的人，只瞧得見身邊幾步。',
    slay: '這一局的戰意，只壓在一個人眉心。打醒了他，他心裡帶來的人自然散去。',
    slayTwo: '這一局的戰意壓著兩個人。醒了一個不算，須得兩個都醒。',
    rout: '這一局的戰意不在一人身上，散在每一個人身上。須得一個一個打醒。',
    // Boards whose 戰意 is in a thing (battles.js `objects`).
    keep: '這一局的戰意不壓在人身上，對著的是我們這邊的一件東西。守住它，撐到那一念自己散了；打醒了局主，也是一樣。',
    break: '這一局的戰意不壓在人身上，釘在東西上。毀了它，人人都醒。',
    side: '韋小寶另開盤口',
    // The white stone 求敗 has set by the board: who comes if this board is won.
    next: '盤邊擱著一枚白子：這一局勝了，求敗便借出{hero}。'
  },
  // 求敗 sets stones down during a board too. The sound comes a round before the person.
  clack: '嗒。求敗又落一子。下一合，人便到。',
  clackSave: '嗒。求敗見子危急，補了一手。',
  // After the first win.
  shop: '第一局下完，韋小寶將攤子一字排開，掛出「通吃坊」的布招。藥按價收錢，兵器隨你掂量。武譜只得一份，交給哪位同伴、肯花多少心力去練，是你們的事。攤上貨色新舊相差數百年，有的銅綠未褪，有的式樣誰也不曾見過。',
  opened: {
    note: '韋小寶將攤子一字排開，掛出「通吃坊」的布招。攤上貨色新舊相差數百年，有的銅綠未褪，有的式樣誰也不曾見過。',
    text: '藥按價收錢，兵器隨你掂量。武譜只得一份，給哪一位練，你們自己商量。瞧甚麼？我這裡的貨，件件是真的。真得很。'
  },
  // Asked how he came, he tells a different story each run. None of them is true.
  origins: {
    note: '少年問他是怎生到這谷裡來的。',
    tales: [
      '我麼？玉皇大帝是我姐夫，派我下來收租的。這谷裡的地皮，一寸一寸都是我家的。',
      '老實同你說，我是擲骰子擲進來的。三粒骰子擲出個「一二三」，啪的一聲，便到了這裡。',
      '我奉旨在廟裡做和尚，念經念得悶了，打個盹兒，便來了。',
      '我本是天上的賭神，只因贏了王母娘娘的蟠桃不肯還，給罰下來擺攤。',
      '家裡七個老婆，一開口便是七張嘴，吵得人頭也大了。我出來擺個攤，圖個耳根清靜。',
      '這一回我不騙你。……我也不曉得。你別問，問了我又要騙你。'
    ]
  },
  // 求敗 cannot see or hear 韋小寶. What he says when the youth talks to him, by 境界.
  unseen: [
    { note: '求敗抬起頭來。', text: '你同誰說話？……這谷中除了你我，便只一頭鵰。小孩子家，睡得迷糊了。' },
    { note: '求敗眼也不抬。', text: '又同那塊空地說話。……由得你。' },
    { note: '求敗眼也不抬。', text: '又同那塊空地說話。……由得你。' },
    { note: '求敗向那塊空地多瞧了一眼。', text: '那裡當真有人？……罷了。落子。' },
    { note: '求敗向那塊空地瞧了許久。', text: '老夫瞧不見，未必便是沒有。……落子。' }
  ],
  // Before the fifth board 求敗 thinks long, and the company sits down by the shop's lamp.
  night: '求敗拈著一枚黑子，久久不落，竟自閉上了眼。韋小寶道：「老兒要想上半天。來來來，都過來坐。」',
  // What 求敗 says after a board is won, by 境界 and by how many boards have been won this run
  // (the last board has its own close). He never names a board or a hero.
  after: [
    [
      { note: '求敗頭也不抬，隨手又落一子。', text: '僥倖。' },
      { note: '求敗仍不抬頭。', text: '又勝一局？小孩子家，手氣倒好。' },
      { note: '求敗「咦」的一聲，抬起頭來，向少年瞧了一眼。', text: '對手太弱，這棋瞧不出甚麼來。老夫認真些。' },
      { text: '你那幾枚子，適才可沒有這一手。幾時學的？' },
      { text: '老夫長考半日，算定你走左路。你偏走了右路。' },
      { text: '你這一手，老夫左手右手都不曾下過。……有點意思。' },
      { text: '且慢收子。適才那一合，你再說一遍：為何叫他退，不叫他進？' },
      { text: '幾百年來，老夫頭一回猜不中下一著。' },
      { text: '最後一局，老夫不留手。' }
    ],
    [
      { text: '上一輪你便是這般開局。今日老夫換一個下法。' },
      { text: '適才那一子已是殘子，你還分人去救。蠢。' },
      { text: '又救。……老夫記下了。' },
      { text: '你的子倒下，你皺甚麼眉頭？下一局他自會回來。' },
      { text: '你同子說話。老夫落子，從不出聲。' },
      { text: '棄一子而全局活，這個道理三歲孩童也懂。你偏不懂。' },
      { text: '不棄子，竟也勝了。這可奇了。' },
      { text: '老夫少年時，也有一樣東西捨不得棄。……不說這個。落子。' },
      { text: '最後一局。老夫倒要瞧瞧，你一子不棄，過不過得去。' }
    ],
    [
      { text: '這一輪老夫加了三分力。你覺得出來麼？' },
      { text: '力加了，子卻沒有強。怪事。' },
      { text: '適才那枚黑子開口說話。他說甚麼？……你聽得見，老夫怎地聽不見？' },
      { text: '老夫按得越重，他們打得越死板。倒是按不住的那一刻，招數活了。' },
      { text: '你那位同伴向老夫說話。老夫幾百年不曾答過子的話。……你替我回一句：老夫聽見了。' },
      { text: '「這念頭不是我的。」適才那黑子是這般說的，是不是？' },
      { text: '他說了幾百年，老夫今日方才聽見。' },
      { text: '重劍無鋒，大巧不工。老夫四十歲前恃之橫行天下，只道力大便是道理。' },
      { text: '最後一局。這一回，老夫想聽聽他們還說些甚麼。' }
    ],
    [
      { text: '老夫有一事不明。你抓子之時，怎地瞧也不瞧？' },
      { text: '老夫揀子，向來只揀最強的。你卻是抓著誰便用誰。' },
      { text: '適才那一子，老夫盒中有比他強十倍的。你用他，竟也勝了。' },
      { text: '你不嫌他弱？……「來的都是朋友。」這句話，老夫幾百年沒聽人說過。' },
      { text: '老夫今日鬆了手，由得黑子自己去打。他們倒打得比老夫按著時好看。' },
      { text: '不滯於物，草木竹石均可為劍。這句話是老夫自己說的。' },
      { text: '原來不滯於物，也是不滯於子。老夫只懂了一半。' },
      { text: '小兄弟，你下棋之時，心裡想些甚麼？……「想他們平安回去。」嗯。' },
      { text: '最後一局。這一回，老夫不揀子了，隨手抓。' }
    ],
    [
      { text: '這一輪老夫不按了。黑子愛怎麼打，便怎麼打。' },
      { text: '你瞧，他們自己要打。原來不必老夫來逼。' },
      { text: '老夫少年時用一柄利劍，凌厲剛猛。那時只求勝，倒也快活。' },
      { text: '後來有一柄軟劍。棄了。' },
      { text: '再後來是重劍，是木劍。一柄一柄放下，每放一柄，便進一步。' },
      { text: '到得無劍，老夫只道再無一物可放。' },
      { text: '可是老夫手裡，分明還拈著一枚子。' },
      { text: '拈了幾百年。……小兄弟，你說它重不重？' },
      { text: '最後一局了。下完這一局，老夫有一句話要說。' }
    ]
  ],
  // A win brings a hero: 求敗 lends another white stone. {hero} is the newcomer's name.
  lend: [
    '求敗推過一枚白子：「再借你一子。」白子一沾棋盤，子上立起一人，正是{hero}。',
    '求敗又推過一枚白子：「對手太弱，瞧不出甚麼。再添一子。」子上立起一人，正是{hero}。',
    '求敗拈起一枚白子，向少年一拋：「還要人麼？拿去。」子上立起一人，正是{hero}。'
  ],
  // Every hero gains a point for each board won.
  step: '又勝一局。同行的人，各自想起一點。',
  // On a 斬將 board the rest need not fall: they were only in the master's thought.
  fade: '局主一醒，他心裡帶來的人便一個一個淡了。',
  // After a lost board: he gathers the white stones back into the box.
  scatter: {
    note: '白子一齊暗了。求敗將盤上白子一枚一枚拾起，放回盒中，蓋上了盒蓋。少年瞧著，說不出話來。',
    text: ['還差得遠。請回吧。', '……可惜。請回吧，改日再來。']
  },
  packUp: { text: '收攤。買下的東西放我這兒，丟不了。下回早些來。' },
  // After the tenth board: the white stones are sent home, as the rule says.
  release: {
    note: '兩股索斷了。求敗依著局規，將白子一枚一枚翻轉。子上的人影漸漸淡了。',
    text: '十局皆勝。老夫說過的話算數：這幾位，放還本尊。'
  },
  // What 求敗 saw this run, by 境界; then he sends the youth home.
  close: [
    [{ text: '老夫的子，開局是多少斤兩，收局仍是多少斤兩。你的子卻是越鬥越強。這是甚麼道理？……好棋。容老夫想一想。請回吧。' }],
    [
      { text: '這一輪有一局，你若棄了一子，三步之內便勝。你為何不棄？' },
      { who: 'youth', text: '他是我同伴。' },
      { text: '……老夫少年時有一柄軟劍，誤傷了一位義士，老夫便將它棄之深谷。棄劍容易。……好棋。容老夫想一想。請回吧。' }
    ],
    [{ text: '那枚黑子說：「這念頭不是我的。」他說了幾百年，老夫今日方才聽見。……好棋。容老夫想一想。請回吧。' }],
    [{ text: '老夫揀子，向來只揀最強的。你卻是抓著誰便用誰，從不嫌手氣。「不滯於物，草木竹石均可為劍」，這句話是老夫自己說的，原來老夫也只懂了一半。……好棋。請回吧。' }],
    [
      { text: '利劍、軟劍、重劍、木劍，老夫一一放下，每放一樣，便進一步。到得無劍，只道再無一物可放。原來手裡還握著一樣，握了幾百年：便是這盤棋。' },
      {
        note: '求敗將手中一枚黑子輕輕放回盒中，抬起頭來，忽地一怔。棋臺之側，不知何時多了一個布攤，攤後一人翹著腳，正自嗑瓜子。',
        text: '你……你是何人？幾時到的？'
      },
      { who: 'wei', text: '啊喲，老爺子，你可瞧見我啦！我在這兒擺了不知多少日子的攤，你老人家眼皮也不抬一抬。' },
      { text: '老夫這劍境四面是牆，你是怎生進來的？' },
      { who: 'wei', text: '走進來的啊。你又沒關門。' },
      { text: '……你練的是哪一門功夫？' },
      { who: 'wei', text: '甚麼功夫也不會。師父倒拜過好幾位，個個要教，是我懶得學。' },
      {
        note: '求敗怔了半晌，突然間哈哈大笑，笑聲震得谷中落葉紛飛。那頭大鵰跟了他幾百年，從沒聽他這般笑過，不由得側過頭來。',
        text: '原來如此，原來如此！老夫求了幾百年的東西，便在臺邊嗑瓜子。'
      },
      { text: '小兄弟，多謝你。……還有最後一局，老夫要同你一齊下到盤上去。容老夫備一備。請回吧。' }
    ]
  ],
  // After the fifth 境界 is won (every 境界 won): the last battle, then 求敗 lets go. Both are
  // placeholders until the producer designs them (ROADMAP workstream 2): `board` stands for the
  // eleventh board, `letGo` for the ending film, `wake` for the youth's last waking.
  finale: {
    board: [
      { note: '五重境界走完。盤上的子一枚一枚收回盒中，棋盤空了。求敗站起身來，繞過棋臺，走到盤邊。' },
      { who: 'qiu', text: '這最後一局，老夫不在盤外下了。你也不在盤外。咱們兩個，都到盤上去。' },
      { who: 'youth', text: '到盤上去？……好，老伯，我陪你下。' }
    ],
    letGo: [
      { note: '一局下罷。求敗拈著最後一枚黑子，懸在盤上，良久不落。' },
      { note: '他將那枚子輕輕擱在盤邊。不是落子，是放下。' },
      { note: '盤上的黑子一枚一枚暗了，白子一枚一枚亮了。盒裡收了幾百年的子，也都亮了起來。' },
      { who: 'qiu', text: '原來如此。老夫求了一輩子，求的便是這一放。……{name}，多謝你。' },
      { who: 'qiu', text: '你這孩子，倒有幾分像老夫年輕時候。' },
      { note: '他向少年拱了拱手，轉身往谷口走去，大袖飄飄，撒手而去，不知所終。那頭大鵰望著他的背影，沒有跟去。' }
    ],
    wake: '少年醒了。天剛濛濛亮，他提了枕邊那柄劍，到屋後空地上練了一回。練罷抬頭，牆頭立著一頭大鵰，正側著頭瞧他。'
  },
  // The run's last page.
  win: '十局下完，同行的人各歸本尊。棋臺上只剩兩個人，一頭鵰。求敗望著空盤，說道：「好棋。容老夫想一想。請回吧。」',
  winNote: '買下的東西寄在通吃坊，下一輪照舊取用。',
  loss: '這一輪的眼破了。盤上的白子一齊暗了下去，收回盒中。求敗說道：「還差得遠。請回吧。」'
};

// One entry per board: what is seen on arriving, and what changes when the board is won.
const CHAMBER_TALES = [
  {
    name: '青竹渡',
    arrival: '一道石橋橫跨淺水，橋頭橋尾各立一人，凝然不動，便如兩枚落定了的黑子。',
    victory: '橋頭的鐵鏈鬆了。兩人眉心的戰意一散，各自退了半步，橋下流水重又穿過橋孔。'
  },
  {
    name: '紅楓驛',
    arrival: '雨水將驛桌洗得發亮。桌旁數人手按兵刃，眼光卻望著別處，似在傾聽一句旁人聽不見的言語。',
    victory: '驛鈴又響了。那幾人如夢初醒，頭一件事便是各自退後一步。'
  },
  {
    name: '蘆花汀',
    arrival: '蘆葉齊齊向西點頭。蘆叢中立著一老一少，衣袖無風自動，身周一群弟子高聲頌揚。',
    victory: '蘆花各往各的方向散開。壓在灘頭的那道戰意散了，頌揚之聲登時止歇。'
  },
  {
    name: '聽雪棧',
    arrival: '棧橋下的鈴舌結了冰。兩個僧人背靠崖壁，立在棧道當中，刀已出鞘。',
    victory: '崖口的冰鈴終於響了。兩柄血刀各自回鞘，這一回沒有再彈出來。'
  },
  {
    name: '空山琴臺',
    arrival: '臺上的琴無人彈奏。石階上一高一低立著兩人，掌心都凝著勁力。',
    victory: '石階上的霜化了。兩人收了掌，琴絃給山風一撥，自己響了一聲。'
  },
  {
    name: '桃花石陣',
    arrival: '桃瓣落在石上，無人去拂。陣心伏著一人，口中翻來覆去只問一句話。',
    victory: '陣心的勁道平了。一片桃花從石縫中鑽出，沾了鞋尖，這才落地。'
  },
  {
    name: '襄陽殘垣',
    arrival: '襄陽東門的門洞之下立著兩人。更鼓不響，城頭無人，他二人卻似在等一聲號令。',
    victory: '城頭的鼓槌終於落下。門洞裡那股勁道散了，五隻金輪停在地下，不再轉動。'
  },
  {
    name: '寒玉石室',
    arrival: '寒玉壁上結滿了霜。壁前立著兩個女子，年長的那個指間扣著三枚銀針。',
    victory: '霜融開了一掌之寬。銀針落在玉上，叮的一聲，再也無人去拾。'
  },
  {
    name: '倒影天街',
    arrival: '長街上店門都閂著。街心一人青衫佩劍，街尾一人輕搖摺扇，水中倒影，一般的儒雅。',
    victory: '長劍歸鞘，摺扇合攏，這一回都沒有再動。街邊有一扇窗，悄悄推開了一道縫。'
  },
  {
    name: '無刻漏臺',
    arrival: '銅漏的最後一滴水懸在半空。兩股星索從盤外垂將下來，繫在臺心一位老者身上。',
    victory: '兩股星索斷了，縮回盤外。懸了許久的那滴水終於落下，銅漏響了一聲。'
  },
  {
    name: '神龍竹堂',
    arrival: '海風裡夾著一股腥氣。竹堂之前的高臺上端坐一個白鬚老者，臺下教眾齊聲念誦，他卻皺著眉頭，似在傾聽另一個聲音。',
    victory: '念誦之聲止了。臺上那人眉心的戰意一散，五指緩緩鬆開，海風重又吹進竹堂。'
  },
  {
    name: '絕情花徑',
    arrival: '谷中遍地奇花，嬌艷無比，枝上卻生滿小刺。花徑盡頭一人寬袍緩帶，左手金刀，右手黑劍，臉上猶帶三分笑意。',
    victory: '漁網一張張落在花叢之上。那人眉心的戰意一散，整了整衣冠，卻先回頭望了一眼石屋的門。'
  },
  {
    name: '鐵掌溪灘',
    arrival: '一道湍溪橫在山前，水聲轟轟。溪心大石之上立著一個黃葛短衫的老者，雙掌垂在身側，腳下水花不濺。',
    victory: '溪水照舊的流。石上那人眉心的戰意散了，他翻過右掌來，瞧了半晌。'
  },
  {
    name: '西夏夜苑',
    arrival: '宮燈一盞盞亮著，蓮池無波。殿階之前立著一個白衫女子，面上垂一幅白綢，似在傾聽池水以外的甚麼聲音。',
    victory: '掌風斂了，宮燈不再搖晃。那女子眉心的戰意一散，抬手先按了按面上的白綢。'
  },
  {
    name: '黑木繡閣',
    arrival: '崖頂一座花園，紅梅翠竹，佈置得極是精雅。小舍門前坐著一人，手持繃架，那枚繡花針卻懸在半空，不肯落下。',
    victory: '繡花針落回了繃架。那人眉心的戰意一散，園中的梅瓣這才紛紛落地。'
  }
];

// 韋小寶 opens a side bet (盤口) on every board: the secondary objective. He bets on the youth's
// side and shares what he wins. Said after a win, by the kind of bet (journey.js SIDE_KINDS),
// so that each reads true on any board; then one line by what is paid.
const SIDE_TALES = {
  lamp: '燈點著啦。盤外瞧這一局，瞧得清清楚楚。這一口，算你贏。',
  swift: '這麼快？我這壺茶還沒泡開呢。我押你們快，押對啦。',
  intact: '上去幾個，下來幾個，我點過了，一個不少。',
  lastBlow: '我指明要哪一位收這一局，便是哪一位收的。夠面子。',
  order: '先剪翅膀，再拿正主。這個次序，我押中啦。',
  double: '一合之內倒了兩個。我擲骰子擲出一對，也沒有這般齊整。',
  spare: '他那手看家本領，從頭到尾沒使得出來。我押的就是「使不出」。',
  combo: '一個起手，一個收尾，兩個人打的是同一招。這叫做一對。',
  noMedicine: '一粒丸子也沒吃？我攤上的藥賣不出去，這一口還得賠給你。蝕本生意。',
  unhurt: '你那隻「眼」，連油皮也沒擦破一塊。押這一口的，只得我一個。',
  holdLine: '後來的那幾個，一步也沒踏過那條線。我在盤外替你數著的。',
  answer: '他出甚麼，你們那位便破甚麼。這不叫打架，叫拆招。',
  // A kind without a line of its own.
  done: '這一口，你押中啦。'
};
const SIDE_PAY = {
  coins: '這是你那一份。點一點。',
  manual: '銀子周轉不來，拿這卷譜抵數。貨真價實。',
  points: '這一口贏回來的不是銀子。瞧他們幾個的神氣，各自像是想起了點甚麼。'
};
// The board was won and the bet was not.
const SIDE_MISS = '這一口你沒押中。不打緊，局是贏了的。';

export { MAZE_TALE, CHAMBER_TALES, SIDE_TALES, SIDE_PAY, SIDE_MISS, YOUTH, WEI, EAGLE, QIUBAI, TALE_ART };
