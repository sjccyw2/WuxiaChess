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
  note: '少年記得自己方才還在家中睡覺，張口便要報名，那兩個字卻到了舌尖又縮了回去。他愣住了，竟連自己的名字也記不起來。',
  text: '我叫……我叫……'
};
const YOUTH_NAMES = {
  who: 'youth',
  text: '連名字也睡忘了。那就叫我「無名」罷。老伯，你叫甚麼？',
  names: true
};
const MAZE_TALE = {
  title: '劍影江湖・一念江湖',
  // Shown before the draw. A step is narration (note), a line (who, text), or both; `ask` marks
  // the page where the player types the youth's name, the first time only.
  prologue: {
    first: [
      { note: '少年睡得正沉，忽覺四下太靜，連一聲蟲鳴也聽不見。他睜開眼來，身下竟不是自家的床。' },
      {
        note: '但見四面峭壁如削，谷底一方青石棋臺，臺邊坐著個白鬚垂胸的老者。他左手拈黑，右手拈白，竟是自己同自己下棋。',
        picture: QIUBAI.portrait
      },
      {
        note: '再看那些棋子，頂上各有寸許高的人影，挺劍揮掌，正鬥得緊。臺畔一頭比人還高的大鵰側頭瞧了少年一眼，過了一會，又瞧一眼。',
        picture: EAGLE.portrait
      },
      { who: 'youth', text: '這……這是甚麼地方？我是不是死了？' },
      {
        who: 'qiu',
        note: '老者手中的黑子停住了。他緩緩抬頭，眼中微露詫異。',
        text: '劍境幾百年無人能入。你半點功夫也無，老夫怎會瞧得見？你是誰？'
      },
      // In the dream he cannot recall his own name, so he makes one up: the name the player types.
      YOUTH_FORGETS,
      YOUTH_NAMES,
      {
        who: 'qiu',
        text: '無名……有些耳熟。老夫的本名也忘了。世人叫老夫「求敗」。'
      },
      { who: 'youth', text: '求敗？老伯，你盼著打敗仗？' },
      {
        who: 'qiu',
        text: '求之不得。左右手下了幾百年，誰也瞞不過誰。再下一千年，也無新著。'
      },
      {
        who: 'qiu',
        note: '他將一隻烏木棋盒推過臺面。',
        text: '來了便坐。陪老夫下一盤。抓三枚。'
      },
      // The pages pick up here after the film (below).
      { who: 'youth', text: '我不會下棋。', afterFilm: true },
      { who: 'qiu', text: '這棋不難。子會走會打，你指路便是。' }
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
      note: '少年又在夢中睜開眼，眼前仍是那座山谷、那方棋臺。他想不起幾時來過，腳卻逕自走到臺前；大鵰看見他，點了點頭。',
      greeting: [
        '又來了，{name}。坐，隨便下一盤。',
        '又是你，{name}。坐。',
        '你來了。坐。這一輪，老夫不讓。',
        '{name}，老夫有一事要請教。先坐。棋罷再問。',
        '坐罷。這是最後一盤了。'
      ],
      youth: '老伯，這裡我像是來過。同你下過棋，是不是？',
      reply: '下過。你醒便忘，老夫一手未忘。抓三枚。'
    },
    // Every run after the ending: 求敗 is gone, and what greets the youth is his shadow. The
    // greeting is still the one for the 境界 picked.
    shadow: {
      note: '少年又在夢中回到谷底，青石棋臺邊仍坐著那個老者，身形卻淡了。谷風吹過，衣袖紋絲不動；大鵰瞧瞧老者，又瞧瞧少年，這回沒有點頭。',
      youth: '老伯，你怎麼淡了？你不是已經走了麼？',
      reply: '老夫已去，此乃棋中留影。坐下重下舊棋。抓三枚。'
    }
  },
  // The rule cut into the edge of the table. Every stone that wins ten boards goes home.
  rule: '白子勝滿十局，放還本尊。中道而敗，收子入盒。',
  // 求敗 says 「抓三枚」 (the film says it too); the youth's hand comes up with five, and he keeps three.
  draw: '少年伸手入盒，竟抓起五枚白子，往盤上一攤，五子齊亮，各立起一個人影。求敗道：「說了三枚，餘下兩枚放回去。」',
  // First board, after the three have arrived.
  ruleRead: {
    note: '棋臺沿上刻著兩行小字，筆劃深入石理：「白子勝滿十局，放還本尊。中道而敗，收子入盒。」',
    text: '這字刻得好深。……要贏滿十局才准走？'
  },
  ruleTold:
    '正是，贏足十場便回家。輸一場，統統裝盒子。上了賊船，只好划到對岸啦。',
  // From the second 境界 the heroes are told that they are copies: by 求敗, coldly, in the second
  // and third 境界; by the youth himself in the fourth and fifth.
  told: {
    cold: [
      {
        who: 'qiu',
        note: '求敗頭也不抬。',
        text: '不過是老夫拓來的一份，如碑上拓字。本尊仍在自己的年月裡，半點不知。你當他們是人？'
      },
      { who: 'youth', text: '可他們會痛，也會想家。老伯，一張紙會想家麼？' },
      { who: 'qiu', text: '……落子罷。' }
    ],
    plain: [
      {
        who: 'youth',
        text: '還有一件事得說明白：各位是老伯從本人身上拓來的一份。本尊仍在各自的年月裡。贏滿十局，便能回到本尊那裡。'
      },
      { who: 'qiu', note: '求敗抬眼看著少年，半晌沒有移開目光。', text: '對著子，也肯說實話。' }
    ]
  },
  command: {
    note: '盤上三人相互望了一眼，目光便都落到少年身上。',
    text: '我也是才到，好多事還不懂。各位只瞧得見幾步，我卻瞧得見全盤。信得過我，我來指路。'
  },
  // Why famous fighters arrive holding one art: said by the one man who has watched it before.
  recall: {
    note: '三人各自起手，招式才使到一半，便都停住了。',
    text: '別慌，最熟的功夫還在。後來學的，打幾場便想起了。個個都這樣……我說了「個個」麼？'
  },
  deploy: '盤上只有五個位置，先落的一枚是「眼」，眼一破便全盤皆輸。未上盤的人在旁等候，下一局仍可換上。',
  // Before round one the stones are still in his hand.
  inHand: '子在手上，尚可換位；按了「開戰」，便落子無悔。',
  // The briefing (軍情). By the producer's ruling of 2026-11-23 this page states rules in plain
  // words, and the story's telling of them stays in the scenes before the board. How each kind
  // of board is won is put together from the board itself (journey.js boardModel, `win`).
  brief: {
    // Who comes if this board is won.
    next: '取勝後，{hero}加入。'
  },
  // 求敗 sets stones down during a board too. The sound comes a round before the person.
  clack: '嗒，求敗又落一子。下一合便有人到。',
  clackSave: '嗒，眼見子危，求敗補了一手。',
  // After the first win.
  shop: '頭一局罷，韋小寶攤開貨物，掛起「通吃坊」的布招；貨色前後相差數百年，有的銅綠未褪，有的式樣無人見過。藥照價賣，兵器任掂量，武譜卻各只一份，給誰修習、花多少心力，須由客人自己商量。',
  opened: {
    note: '「通吃坊」的布招掛了起來，韋小寶將貨物一字排開。銅綠未褪的舊物旁，擺著誰也沒見過的式樣，前後竟隔了數百年。',
    text: '放心，這裡樣樣真貨。藥照價錢買，兵器隨你掂。武譜各只一份，給誰練可得商量好。'
  },
  // Asked how he came, he tells a different story each run. None of them is true.
  origins: {
    note: '少年看罷貨物，便問韋小寶怎麼到了這谷裡。',
    tales: [
      '來收租呀，玉皇大帝是我姐夫。這谷裡寸寸地皮都是我家的。你踩著的也是。',
      '這回說真的：三粒骰子擲出個一二三。啪，連人帶骰子便到這裡啦。',
      '我奉旨在廟裡做和尚。經念得太悶，打了個盹。睜眼便到這裡，省了盤纏。',
      '我是天上的賭神。贏了王母娘娘的蟠桃不肯還，罰我下來擺攤。你說冤不冤？',
      '家裡七個老婆，七張嘴一齊開。出來擺攤圖個清靜。賺不賺錢倒在其次。',
      '這回不騙你，我也不曉得。別再問啦。再問，我又要編了。'
    ]
  },
  // 求敗 cannot see or hear 韋小寶. What he says when the youth talks to him, by 境界.
  unseen: [
    { note: '求敗抬起頭來。', text: '你同誰說話？谷中除你我，只一頭鵰。睡糊塗了。' },
    { note: '求敗眼也不抬。', text: '又對空處說話。由你。' },
    { note: '求敗眼也不抬。', text: '又是那塊空地？……由你。' },
    { note: '求敗向那塊空地多瞧了一眼。', text: '那裡當真有人？罷了，落子。' },
    { note: '求敗向那塊空地瞧了許久。', text: '瞧不見的，未必沒有。落子。' }
  ],
  // The same, once 求敗 has seen 韋小寶 (at the close of 無劍境界) and the last board is still to
  // be won: he holds stones again, and cannot see him again.
  unseenAgain: { note: '求敗向那塊空地瞧了許久。', text: '上回分明瞧見了。今日怎又不見？……落子。' },
  // Before the fifth board 求敗 thinks long, and the company sits down by the shop's lamp.
  night: '求敗拈著黑子，遲遲不落，竟閉上了眼。韋小寶向燈邊一招手：「老兒有得想啦，過來坐坐。」',
  // What 求敗 says after a board is won, by 境界 and by how many boards have been won this run
  // (the last board has its own close). He never names a board or a hero, and never says the
  // player did something particular on it: a run may not have done it. An entry is one line of his,
  // or a short exchange (a list of lines; `who: 'youth'` for the youth's), so that what the youth
  // answers is said by the youth himself and not quoted by 求敗 (producer, 2026-11-24, Q-N138).
  // Until the last board he only presses the 戰意 more lightly; he lifts it there (Q-N136).
  after: [
    [
      { note: '求敗頭也不抬，隨手又落一子。', text: '僥倖。' },
      { note: '求敗仍不抬頭。', text: '又勝了。倒有幾分手氣。' },
      { note: '求敗低低「咦」了一聲，這才抬眼看少年。', text: '對手太弱，看不出棋。老夫添些分量。' },
      { text: '你的子比開局時強了。幾時學的？' },
      { text: '老夫算了半日你的去路。仍是沒算中。' },
      { text: '這一著，老夫左右手都未下過。……有趣。' },
      { text: '且慢收子。方才那幾步，你怎地想的？說來聽聽。' },
      { text: '幾百年了，竟猜不中你下一著。' },
      { text: '最後一局，老夫不留手。' }
    ],
    [
      { text: '你上回怎樣起手，老夫記得。今日換個下法。' },
      { text: '殘子該棄便棄。你肯麼？' },
      { text: '不答？老夫記下了。' },
      { text: '倒下的子，下局自會回來。何必掛心。' },
      { text: '你還同子商量？老夫落子，從不出聲。' },
      { text: '棄一子而全局活，三歲孩童皆知。你學是不學？' },
      { text: '一子不棄，竟也勝到這裡。' },
      { text: '老夫少年時，也曾不捨得棄。……落子。' },
      { text: '最後一局。一子不棄，試試。' }
    ],
    [
      { text: '老夫加了三分力。如何？' },
      { text: '力加了，子卻未強。怪。' },
      { text: '方才那枚黑子說甚麼？你聽得見？老夫竟未聽清。' },
      { text: '按得重，招數反倒死了。掙開那一刻，才像些樣子。' },
      { text: '盤上的子，近來像有話要說。幾百年了，老夫從不答子的話。……替老夫回一句：聽見了。' },
      { text: '「這念頭不是我的。」黑子都這般說，是不是？' },
      { text: '原來說了幾百年。今日才聽見。' },
      { text: '重劍無鋒，大巧不工。四十歲前恃此橫行，只道力大便有理。' },
      { text: '最後一局。聽聽他們還說甚麼。' }
    ],
    [
      { text: '抓了便留？你不掂子力？' },
      { text: '老夫只揀最強的。你倒像揀朋友。' },
      { text: '盒中強過這幾枚的，多的是。你抓著誰便用誰，也勝了。' },
      [{ text: '你不嫌他們弱麼？' }, { who: 'youth', text: '來的都是朋友。' }, { text: '……這句話，老夫幾百年沒聽人說過了。' }],
      { text: '今日按得輕些。他們倒比按著時打得好看。' },
      { text: '不滯於物，草木竹石均可為劍。這話，還是老夫說的。' },
      { text: '既不擇劍，何以擇子？……只懂了一半。' },
      [{ text: '落子之時，你心裡想些甚麼？' }, { who: 'youth', text: '想他們平安回去。' }, { text: '……嗯。' }],
      { text: '最後一局。老夫也隨手抓一把。' }
    ],
    [
      { text: '這回只輕輕一按。看他們還肯不肯打。' },
      { text: '按得這般輕，他們仍掙不開。是戰意，還是他們自己要打？' },
      { text: '少年那柄利劍，最是凌厲。那時只想贏，倒快活。' },
      { text: '後來換了軟劍。也棄了。' },
      { text: '重劍、木劍，也一一放下。放一柄，進一步。' },
      { text: '到了無劍，只道手中已空。' },
      { text: '可這枚子，還在指間。' },
      { text: '這麼拈了幾百年。小兄弟，你說重不重？' },
      { text: '最後一局。下完，老夫有話說。' }
    ]
  ],
  // A win brings a hero: 求敗 lends another white stone. {hero} is the newcomer's name.
  lend: [
    '求敗說了聲「再借你一子」，推過一枚白子，子一落盤，{hero}的人影便立了起來。',
    '求敗又推來一枚白子，口中道「對手太弱，無棋可看，再添一子」，子上隨即立起{hero}的身影。',
    '求敗拈起白子向少年一拋，問了聲「還要人麼」，便道「拿去」，子上立起的正是{hero}。'
  ],
  // Every hero gains a point for each board won.
  step: '這局一勝，眾人手上便各多想起一點功夫。',
  // On a 斬將 board the rest need not fall: they were only in the master's thought.
  fade: '局主醒轉，他那一念中帶來的人便逐個淡去。',
  // After a lost board: he gathers the white stones back into the box.
  scatter: {
    note: '白子一齊暗下，求敗逐枚拾起，放進盒中。盒蓋合上了，少年望著那隻盒子，喉頭一句話也說不出。',
    text: ['還差得遠。請回吧。', '……可惜。請回吧，改日再來。']
  },
  packUp: { text: '收攤啦，東西替你存著。丟不了。下回早些來。' },
  // After the tenth board: the white stones are sent home, as the rule says.
  release: {
    note: '索已斷盡，求敗依約逐枚翻轉白子。每翻過一枚，那子上的人影便淡了一分。',
    text: '十局皆勝。依約，放還本尊。'
  },
  // What 求敗 saw this run, by 境界; then he sends the youth home.
  close: [
    [{ text: '老夫的子仍是原樣，你的卻越鬥越強。好棋，容老夫想想這緣故。請回吧。' }],
    [
      { text: '這一輪，老夫幾回擺下可棄之子。棄一子，便快三步。你為何不棄？' },
      { who: 'youth', text: '他是我同伴。' },
      { text: '老夫那柄軟劍誤傷義士，便棄入深谷。棄劍容易……好棋，容老夫再想想。請回吧。' }
    ],
    [{ text: '「這念頭不是我的」……說了幾百年，老夫今日才聽見。好棋，容老夫想一想。請回吧。' }],
    [{ text: '你不擇子，老夫卻只要最強的。「不滯於物，草木竹石均可為劍」，老夫只懂一半。好棋，請回吧。' }],
    [
      { text: '利劍、軟劍、重劍、木劍，放一柄便進一步。到了無劍，只道再無可放。卻還握著這盤棋，幾百年了。' },
      {
        note: '求敗將黑子輕輕放回盒中，抬頭忽地怔住。棋臺旁竟有一方布攤，攤後那人翹著腳，兀自嗑瓜子。',
        text: '你是何人？幾時來的？'
      },
      { who: 'wei', text: '啊喲，總算瞧見我啦！我在這裡擺了多少日子的攤。老爺子，你眼皮可真沉。' },
      { text: '此境四面皆牆。你怎生進來的？' },
      { who: 'wei', text: '走進來的啊。你又沒關門。' },
      { text: '……你練的是哪一門功夫？' },
      { who: 'wei', text: '一門也不會。師父拜過好幾位，個個都肯教。是我懶得學。' },
      {
        note: '求敗怔了半晌，忽然放聲大笑，谷中落葉紛紛而下。大鵰側過頭來，跟了他幾百年，還是頭一回聽見這樣的笑聲。',
        text: '原來如此。老夫苦求幾百年，它倒在臺邊嗑瓜子。'
      },
      { text: '還有一局。這回，老夫下去。' }
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
      { text: '又到這一步了。四柄劍再放一遍，手裡仍剩這盤棋。' },
      { text: '上回到得盤上，還差一點。小兄弟，再來。' }
    ],
    invite: [
      {
        note: '求敗伸手要翻白子，到了半途卻停住。十局既勝，照他自己的規矩，便該放人。',
        text: '各位本該放還，老夫卻有一請。再留一局。願留便留。'
      },
      { who: 'youth', note: '眾人相互看看，仍站在盤邊，竟無一人肯走。', text: '老伯，他們都不走。' },
      {
        note: '求敗取出這一輪十位局主的黑子，一一擱在盤邊，這回沒有再往子上按。人影立起，眼中都已清明，卻也無人離去。',
        text: '不再按了。肯打的留下。不肯的，請便。'
      },
      { who: 'youth', text: '老伯，你也下去？你不是只在外頭看麼？' },
      { text: '那是手裡握著子的時候。' },
      { who: 'youth', text: '可是我不會武功。' },
      { text: '千年武功，都從你眼前過了。試試。手記得。' },
      {
        note: '求敗朝盤上一指。四角星位各有一塊大石，石上各插著一柄劍。',
        text: '那柄利劍，老夫弱冠前所用。拿去。'
      },
      { who: 'wei', text: '莊家也下場，這盤口開不得。這一局不押啦。老爺子，換了你會押誰？' },
      { text: '……老夫押這孩子。' }
    ],
    before: [
      {
        who: 'youth',
        note: '少年踏上棋枰，腳底一涼。他握住石上的利劍，輕輕一拔便出了，倒像這劍一直在等他的手。',
        text: '咦，這劍好順手。'
      },
      {
        note: '求敗隨手折了一根枯枝，緩步走到天元，站定了。',
        text: '四十歲後，草木竹石皆可為劍。幾百年未曾動手了。這一局，老夫不讓。'
      },
      { who: 'youth', text: '這回我也在盤上，倒了便全局都輸。各位幫我看著些。老伯，小心了！' },
      { text: '老夫求敗一世。看你給不給得起。' }
    ],
    // Later black stones walk on by themselves: no stone is set down, so there is no 「嗒」. They
    // come the moment 求敗 is hard pressed, and stand beside him.
    rally: '盤邊幾條人影搶上棋枰，未發一言，便站到了求敗身旁。',
    withdraw: '求敗收回枯枝，退了幾步，站到眾人身後。',
    half: '好劍！幾百年未見這一著。再來。',
    after: [
      { note: '求敗低下頭，看著那根垂在手中的枯枝，久久不動。', text: '……好。' },
      { who: 'youth', text: '老伯，你還站著呢。我沒贏。' },
      { text: '求了一世的敗，原來不須人來打倒。' }
    ],
    lost: [
      { note: '求敗望著手裡的枯枝，良久沒有開口。', text: '還差一點。差在哪裡，老夫也未明白。' },
      // The ten boards were won, so the white stones go home as the rule says, lost board or not.
      {
        note: '白子上的人影逐一淡去，仍依十局之約，各回本尊。',
        text: '重下那十局罷。下完，老夫仍到盤上等你。請回吧。'
      },
      { who: 'wei', text: '只差一點，下回補上便是。東西照舊替你存著。別愁啦。' }
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
    missed: '終局仍差一點，同行的人已依約各回本尊。那十局須得重下，方能再到盤上。',
    // The run's last page: `closed` under its heading, `epilogue` after the film's words.
    closed: '這盤棋下完了。',
    epilogue: '對面那人撒手而去，從此再未回來。少年往後的事都留在劍塚石上，唯獨這場夢，連他自己也記不清。',
    // As the company goes onto the last board (the log).
    muster: '這局以{name}為眼；他是執子之人，並非拓來的一念，上盤便比旁人氣力充足。同行諸人也已想起平生所學，一招不缺。',
    plus: {
      // The first board of a run after the ending (the log).
      joins: '這一回，{name}自己也在盤上。',
      // The draw page (抓子), under the three drawn.
      draw: '{name}自己也在盤上：連這三位，開局共是四人。',
      title: '無名入盤',
      text: '求敗已去，棋臺邊只餘棋中留影，陪{name}把舊夢從頭做過。這回{name}也成了盤上一子，抓來三位同伴，開局共四人。九式仍須從根長起，同旁人一般，一式一式使出。'
    }
  },
  // The run's last page.
  win: '十局已盡，同伴各回本尊，棋臺旁僅餘一老一少與大鵰。求敗望著空盤，說是好棋，要獨自再想一想，便請少年回去。',
  winNote: '通吃坊代存買下的東西，下回入夢便可取用。',
  loss: '白子盡暗，都收回了盒中。少年耳裡仍是那一聲「請回吧」。'
};

// One entry per board: what is seen on arriving, and what changes when the board is won.
const CHAMBER_TALES = [
  {
    name: '青竹渡',
    arrival: '淺水上橫著一道石橋，橋頭橋尾各立一人，動也不動，恰似兩枚落定的黑子。',
    victory: '橋頭鐵鏈已鬆，兩人眉間的戰意也散了，各自讓開半步。橋孔底下，流水又穿了過來。'
  },
  {
    name: '紅楓驛',
    arrival: '雨水把驛桌洗得發亮，桌旁幾人手按兵刃，目光卻偏向別處，像在聽人說話。',
    victory: '驛鈴又能響了。那幾人醒過神來，腳下都先向後退。'
  },
  {
    name: '蘆花汀',
    arrival: '蘆葉一齊向西低下，蘆叢裡一老一少衣袖無風自動。弟子圍在四下，頌揚之聲一陣高過一陣。',
    victory: '頌揚聲已止住，壓在灘頭的戰意也散了。蘆花不再倒向一處，各自隨風飄開。'
  },
  {
    name: '聽雪棧',
    arrival: '棧橋下的鈴舌結了冰。兩個僧人背靠崖壁，立在棧道當中，刀已出鞘。',
    victory: '崖口的冰鈴終於響了，聲音從空下來的棧道傳了出去。'
  },
  {
    name: '空山琴臺',
    arrival: '石階上一高一低立著兩人，掌中勁力已聚。臺上那張琴，卻無人撫弄。',
    victory: '階上霜已融，兩人也收了掌。山風拂過琴絃，輕輕一響。'
  },
  {
    name: '桃花石陣',
    arrival: '桃瓣落滿石面，無人去拂。陣心那人伏著，只管反覆問同一句話。',
    victory: '陣心勁力平息，桃瓣從石縫間飄出，沾住鞋尖，終於落下。'
  },
  {
    name: '襄陽殘垣',
    arrival: '襄陽東門下站著兩人，像在等一聲軍令。更鼓不響，城頭也不見人。',
    victory: '鼓槌已在城頭落下，門洞裡逼人的勁力也消了。五隻金輪停在地上，不再轉動。'
  },
  {
    name: '寒玉石室',
    arrival: '寒玉壁上結滿了霜。壁前立著兩個女子，年長的那個指間扣著三枚銀針。',
    victory: '霜融開了一掌之寬。銀針落在玉上，叮的一聲，再也無人去拾。'
  },
  {
    name: '倒影天街',
    arrival: '街上店門盡閉，一人青衫佩劍立在街心，一人在街尾搖扇。水中映出兩張一般儒雅的面孔。',
    victory: '劍已入鞘，扇也合起，這回都未再動。街旁一扇窗悄悄開了條縫。'
  },
  {
    name: '無刻漏臺',
    arrival: '銅漏的最後一滴水懸在半空。兩股星索從盤外垂將下來，繫在臺心一位老者身上。',
    victory: '兩股星索斷了，縮回盤外。懸了許久的那滴水終於落下，銅漏響了一聲。'
  },
  {
    name: '神龍竹堂',
    arrival: '海風帶腥，竹堂前的高臺上坐著一個白鬚老者。臺下頌聲不絕，他卻蹙著眉，竟似一句也沒聽入耳。',
    victory: '頌聲歇了，老者眉間也鬆開。海風重新穿堂而過。'
  },
  {
    name: '絕情花徑',
    arrival: '花香甜得發膩，枝上的小刺卻勾住了衣角。花徑盡頭立著一人，寬袍緩帶，一刀一劍都垂在身側。',
    victory: '漁網一張張落在花叢之上，給小刺勾住了，再也收不攏。花徑盡頭，石屋的門仍舊閂著。'
  },
  {
    name: '鐵掌溪灘',
    arrival: '湍溪撞石，白沫濺起一人多高。對岸山門前的老者垂著雙掌，直望這邊。',
    victory: '溪水仍照舊奔流，白沫濺到老者鞋面。他竟連避也不避。'
  },
  {
    name: '西夏夜苑',
    arrival: '宮燈照著平平的蓮池，殿階前一個白衫女子面垂白綢。連水中倒影，也看不見她的臉。',
    victory: '掌風已斂，蓮池又平了。一點燈花忽地爆開，隨即重歸寂靜。'
  },
  {
    name: '黑木繡閣',
    arrival: '梅樹下有間小舍，花香濃得不散。門前那人持著繃架，一枚繡花針懸在手中，遲遲不往繃子上落。',
    victory: '園中梅瓣紛紛落定，池裡那對鴛鴦也游開了。'
  },
  // The last board. Its victory is 求敗 lowering the twig: he does not fall.
  {
    name: '谷底棋臺',
    arrival: '青石棋枰縱橫十三路，四角星位各插一劍。此刻天元尚空，盤上也沒有半點戰意。',
    victory: '求敗仍立著，手中枯枝卻垂下了。那根枯枝，再未抬起。'
  }
];

// 韋小寶 opens a side bet (盤口) on every board: the secondary objective. He bets on the youth's
// side and shares what he wins. Said after a win, by the kind of bet (journey.js SIDE_KINDS),
// so that each reads true on any board; then one line by what is paid.
const SIDE_TALES = {
  lamp: '燈亮了，盤外看得清清楚楚。這口算你贏。',
  swift: '茶葉還沒泡開，你們便打完了？我押的就是個快。中啦！',
  intact: '一個也沒少，我數過了。上去幾個，回來幾個。',
  lastBlow: '點誰收局，便是誰收的。這面子給得足。',
  order: '翅膀先剪，正主後拿。次序半點不差，我押中了。',
  double: '一合放倒兩個！骰子擲一對，也沒你們這麼齊。',
  spare: '他那手絕活憋到散場，也沒使出來。這口「使不出」，算我押著啦。',
  combo: '同一招，你起手、我收尾。好一對！',
  noMedicine: '一粒藥也沒吃？藥賣不掉，這口還要賠你。兩頭蝕本！',
  unhurt: '你那隻「眼」連油皮也沒破。敢押毫髮無傷的，只有我。',
  holdLine: '後來那幾個，誰也沒越線。我在外頭數著呢。',
  answer: '他出一招，便給你們那位拆一招。拆得乾淨，這口中了。',
  // A kind without a line of its own.
  done: '這一口，你押中啦。'
};
const SIDE_PAY = {
  coins: '這是你那一份。點一點。',
  manual: '銀子一時轉不開，這卷武譜抵給你。真貨，放心。',
  points: '這口賺的比銀子好。瞧瞧他們，手上又想起功夫啦。'
};
// The board was won and the bet was not.
const SIDE_MISS = '這注沒中，倒也不必愁。棋是贏了的。';

export { MAZE_TALE, CHAMBER_TALES, SIDE_TALES, SIDE_PAY, SIDE_MISS, YOUTH, WEI, EAGLE, QIUBAI, QIUBAI_SHADOW, acrossTable, shade, TALE_ART };
