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
// After the ending 求敗 has let go and left the world; he does not come back. In the runs that
// follow (無名入盤) the one at the table is what the board keeps of him: a shadow that plays the old
// games over, saying what he said. So it sees 韋小寶 only where he did, and forgets him as he did.
const QIUBAI_SHADOW = { name: '求敗的影子', role: '棋盤記得的人', portrait: 'npc-qiubai.webp' };
// Who sits across the table in a run: 求敗, or after the ending his shadow.
const acrossTable = (plus) => (plus ? QIUBAI_SHADOW : QIUBAI);
// Narration in a run after the ending: where it names 求敗, it is the shadow that moves.
const shade = (text, plus) => (plus ? String(text ?? '').replaceAll('求敗', '那道影子') : text);
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
    },
    // Every run after the ending: 求敗 is gone, and what greets the youth is his shadow. The
    // greeting is still the one for the 境界 picked.
    shadow: {
      note: '少年又睡著了。再睜開眼來，仍是那座山谷，那方青石棋臺。臺邊坐著的仍是那個老者，身形卻淡了，谷風吹過，他的衣袖竟不飄動。那頭大鵰瞧瞧他，又瞧瞧少年，沒有點頭。',
      youth: '老伯，你……你怎地淡了？你不是走了麼？',
      reply: '走了的是老夫。留在這裡的，是這盤棋記得的一道影子。坐，舊棋再下一遍。抓三枚。'
    }
  },
  // The rule cut into the edge of the table. Every stone that wins ten boards goes home.
  rule: '白子勝滿十局，放還本尊。中道而敗，收子入盒。',
  // 求敗 says 「抓三枚」 (the film says it too); the youth's hand comes up with five, and he keeps three.
  draw: '少年伸手入盒，一把抓起五枚白子，攤在盤上。五枚白子一沾棋盤，登時亮了，子上各自立起一個人影。求敗道：「說了三枚。留下三枚，餘下的放回盒裡。」',
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
  // The briefing (軍情). By the producer's ruling of 2026-11-23 this page states rules in plain
  // words, and the story's telling of them stays in the scenes before the board. How each kind
  // of board is won is put together from the board itself (journey.js boardModel, `win`).
  brief: {
    // Who comes if this board is won.
    next: '取勝後，{hero}加入。'
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
  // The same, once 求敗 has seen 韋小寶 (at the close of 無劍境界) and the last board is still to
  // be won: he holds stones again, and cannot see him again.
  unseenAgain: { note: '求敗向那塊空地瞧了許久。', text: '上一回分明瞧見了，今日又瞧不見了。……落子。' },
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
      { text: '老夫有一事不明。你留子之時，怎地不先掂掂子力？' },
      { text: '老夫揀子，向來只揀最強的。你揀子，倒像是在揀朋友。' },
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
      { text: '……還有一局。這一局，老夫不在盤外下了。' }
    ]
  ],
  // The last board (world view §8.4), which follows the tenth board of 無劍境界 in the same run, and
  // the ending. Everything here is the spine's: it names no board, no hero and no black stone.
  //   again    the close of 無劍境界 when the last board has been reached before: he has seen
  //            韋小寶 already, so `close[4]` is not said twice
  //   invite   after the close: he keeps every stone one board longer, sets the run's ten masters
  //            down with no 戰意 on them, and sends the youth onto the board with a sword
  //   before   on the board, before the first move
  //   rally    more of the ten masters step to 求敗's side (at half his 氣血, and at a quarter)
  //   withdraw 求敗 falls back among them (a quarter of his 氣血 left)
  //   half     求敗 at half his 氣血 (his 變招)
  //   after    the board won, before the film
  //   lost     the youth fell, or the twelve rounds ran out
  //   film     the ending film's two cuts (asset-gen/finale-video)
  //   ending   the film's words in order, as the film letters them: `note` a caption, `text` a
  //            balloon. Shown as pages when the film cannot play.
  //   name     the name that settles beside the youth in the last panel
  //   epilogue the page after the film; `plus` is what the ending opens
  finale: {
    again: [
      { text: '又到了這一步。利劍、軟劍、重劍、木劍，老夫再放一遍，手裡剩下的，仍是這盤棋。' },
      { text: '上一回你我到得盤上，還差著一點。小兄弟，再來。' }
    ],
    invite: [
      {
        note: '求敗依著局規，伸手要將盤上的白子一枚一枚翻轉，手到半途，卻停住了。',
        text: '十局皆勝，各位原該放還本尊。老夫卻有一事相求：再留一局，願留的便留。'
      },
      { who: 'youth', note: '盤邊眾人你瞧我，我瞧你，竟沒有一個肯走。', text: '老伯，他們都不走。' },
      {
        note: '求敗打開棋盒，將這一輪十位局主的黑子一一取出，擱在盤邊，手指卻不在子上按那一按。黑子上人影立起，個個神智清明，竟也無一人離去。',
        text: '老夫不按了。各位愛打便打，不愛打的，自管請便。'
      },
      { who: 'youth', text: '老伯，你也下去？你不是一向只在盤外瞧麼？' },
      { text: '那是手裡握著子的時候。' },
      { who: 'youth', text: '可是我不會武功。' },
      { text: '千年的武功，你在臺邊都瞧過了。手會記得。' },
      {
        note: '求敗向盤上一指。四角星位各有一塊大石，石上各插一劍。',
        text: '石上那柄利劍，是老夫弱冠之前所用。你拿去使。'
      },
      { who: 'wei', text: '多出來的這一局，我不開盤口了：莊家自己下了場，這盤口開不得。老爺子，你若要押，押誰？' },
      { text: '……老夫押這孩子。' }
    ],
    before: [
      {
        who: 'youth',
        note: '少年一腳踏上棋枰，石面冰涼。他伸手握住石上那柄利劍，一拔便出，倒似這柄劍已等了他許久。',
        text: '這劍……好生順手。'
      },
      {
        note: '求敗隨手折了一根枯枝，緩步走到天元，站定了。',
        text: '老夫四十歲後，不滯於物，草木竹石均可為劍。幾百年不曾同人動手，這一局，老夫不讓。'
      },
      { who: 'youth', text: '各位，這一回我也在盤上。我若倒了，這一局便輸了。……老伯，小心了！' },
      { text: '老夫求了一世的敗。今日瞧瞧，你給不給得起。' }
    ],
    // Later black stones walk on by themselves: no stone is set down, so there is no 「嗒」. They
    // come the moment 求敗 is hard pressed, and stand beside him.
    rally: '盤邊幾條人影搶上枰來，一言不發，逕自站到求敗身旁。',
    withdraw: '求敗枯枝一收，退了幾步，站到眾人身後。',
    half: '好。這一劍，老夫幾百年來不曾見過。……再來！',
    after: [
      { note: '求敗低頭瞧著手中的枯枝，瞧了很久。', text: '……好。' },
      { who: 'youth', text: '老伯，你還站著。我沒有贏。' },
      { text: '老夫求了一世的敗，原來不是要誰將老夫打倒。' }
    ],
    lost: [
      { note: '求敗瞧著自己手中的枯枝，半晌不語。', text: '還差著一點。……差的是甚麼，老夫也說不上來。' },
      // The ten boards were won, so the white stones go home as the rule says, lost board or not.
      {
        note: '白子上的人影一個一個淡了，各回本尊。',
        text: '那十局你再下一遍。下完了，老夫仍到這盤上來等你。請回吧。'
      },
      { who: 'wei', text: '不打緊，不打緊。差一點便是差一點，下回補上就是。東西照舊放我這兒。' }
    ],
    film: {
      tall: { file: 'finale-film.mp4', poster: 'finale-film.webp' },
      wide: { file: 'finale-film-wide.mp4', poster: 'finale-film-wide.webp' }
    },
    ending: [
      { note: '那根枯枝，求敗沒有再舉起來。' },
      { note: '他俯下身去，將枯枝輕輕擱在盤上。不是落子，是放下。', text: '夠了。' },
      { note: '盤上的黑子白子，一枚一枚亮了。盒中收了幾百年的子，也都亮了起來，各回各的年月。' },
      { text: '老夫求了一世，求的原來便是這一放。' },
      { text: '小兄弟，多謝你。' },
      { note: '韋小寶收了攤子，挑在肩上，自谷口走了出去。那道門，原來一直開著。' },
      { note: '少年提劍而立。求敗向他瞧了一眼，忽地一怔。', text: '……原來是你。' },
      { note: '他向少年拱了拱手，大袖飄飄，撒手而去，不知所終。那頭大鵰望著他的背影，沒有跟去。' },
      { note: '少年醒了。這一回，他沒有再睡回去。' },
      { note: '他提了枕邊那柄劍，到屋後練將起來。夢裡的事一件也記不起，手卻都記得。' },
      { note: '練罷抬頭，崖上立著一頭大鵰，正側過了頭瞧他。' },
      { note: '許多年後，他劍下再無一合之敵，給自己取了一個名字。' }
    ],
    name: '獨孤求敗',
    // A lost last board, on the run's last page.
    missed: '終局未成。求敗說還差著一點。同行的人各歸本尊；那十局須得再下一遍，方能再到這盤上來。',
    // The run's last page: `closed` under its heading, `epilogue` after the film's words.
    closed: '這盤棋下完了。',
    epilogue: '對面那個人撒手而去，再沒有回來。少年後來的事，都刻在劍塚的石上；只有這一場夢，他自己也記不清了。',
    // As the company goes onto the last board (the log).
    muster: '這一局{name}是眼。他是執子的人，不是拓來的一念，踏上棋枰，氣力比旁人都足。同行的人到了這裡，平生所學一招不缺，全都想了起來。',
    plus: {
      // The first board of a run after the ending (the log).
      joins: '這一回，{name}自己也在盤上。',
      // The draw page (抓子), under the three drawn.
      draw: '{name}自己也在盤上：連這三位，開局共是四人。',
      title: '無名入盤',
      text: '求敗撒手而去，再不回來。此後再入夢，棋臺邊坐著的只是這盤棋記得的一道影子，陪{name}將舊夢從頭再做一遍。這一回，{name}自己也是盤上一子：開局抓三枚，連他共是四人。他同旁人一樣從根長起，九式要一式一式使將出來。'
    }
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
    arrival: '海風裡夾著一股腥氣。竹堂之前的高臺上端坐一個白鬚老者，臺下教眾齊聲念誦，他卻皺著眉頭，一句也沒有聽進去。',
    victory: '念誦之聲止了。臺上那人眉心的戰意一散，五指緩緩鬆開，海風重又吹進竹堂。'
  },
  {
    name: '絕情花徑',
    arrival: '花香甜得發膩，枝上的小刺卻勾住了衣角。花徑盡頭立著一人，寬袍緩帶，一刀一劍都垂在身側。',
    victory: '漁網一張張落在花叢之上，給小刺勾住了，再也收不攏。花徑盡頭，石屋的門仍舊閂著。'
  },
  {
    name: '鐵掌溪灘',
    arrival: '溪水撞在石上，濺起一人來高的白沫。對岸山門之前立著一個老者，雙掌垂在身側，望著這一邊。',
    victory: '溪水照舊的流。那老者翻過右掌，瞧了半晌；一片白沫濺上鞋面，他也沒有去避。'
  },
  {
    name: '西夏夜苑',
    arrival: '宮燈一盞盞亮著，照得蓮池如鏡。殿階之前立著一個白衫女子，面上垂一幅白綢，池水裡也照不見她的容顏。',
    victory: '掌風斂了，池水重又平如鏡面。一盞宮燈的燈花爆了一下，再無別的聲息。'
  },
  {
    name: '黑木繡閣',
    arrival: '花香濃得化不開。梅樹下一間小舍，門前坐著一人，手持繃架，那枚繡花針卻懸在半空，不肯落下。',
    victory: '繡花針落回了繃架。園中的梅瓣這才紛紛落地，池裡一對鴛鴦游了開去。'
  },
  // The last board. Its victory is 求敗 lowering the twig: he does not fall.
  {
    name: '谷底棋臺',
    arrival: '青石棋枰縱橫十三路，四角星位各插一劍。枰上沒有一道戰意，天元空著。',
    victory: '求敗手中的枯枝垂了下來。他沒有倒下，也沒有再舉起那根枯枝。'
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

export { MAZE_TALE, CHAMBER_TALES, SIDE_TALES, SIDE_PAY, SIDE_MISS, YOUTH, WEI, EAGLE, QIUBAI, QIUBAI_SHADOW, acrossTable, shade, TALE_ART };
