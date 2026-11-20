// The story of one run, in three layers that never depend on one another:
//
//   the spine   MAZE_TALE: what happens at a position in the run (opening his eyes, the
//               first board, the night talk, the end). Told by the youth, 韋小寶 and narration,
//               who are present whoever was drawn.
//   the boards  CHAMBER_TALES here, ENCOUNTER_SCRIPT in encounter-script.js: one board, its
//               master's obsession and the shadow to be saved. A board never refers to
//               another board or to its place in the order, so boards can be shuffled.
//   the heroes  hero-voices.js: lines a hero says wherever they are.
//
// Nothing here names the one who set the boards. The invitation is unsigned.

// The two people who are always there but never on the board.
const YOUTH = { name: '無名', role: '執子之人', portrait: 'npc-youth.webp' };
const WEI = { name: '韋小寶', role: '通吃坊掌櫃', portrait: 'npc-wei.webp' };
// The great bird that waits by the stone table. It never speaks, and the game never gives
// it any other name.
const EAGLE = { name: '大鵰', role: '谷中的鵰', portrait: 'npc-eagle.webp' };

const MAZE_TALE = {
  title: '劍影江湖・一念江湖',
  // Shown before the draw. He thinks he is waking up; he has just fallen asleep.
  prologue: {
    scenes: [
      '一片黑。然後，少年睜開眼。',
      '谷底。天光從很高的地方漏下來。一隻大鵰蹲在石臺旁邊看著他，像是等了很久。',
      '他坐起來，以為自己剛睡醒。手先摸到腰間的劍，然後才發現，他想不起自己的名字。'
    ],
    // A picture shown beside a scene, by its place in the list above.
    pictures: { 1: EAGLE.portrait },
    greeting: {
      first: '來啦？……哦，你不認得我。行，那就當是頭一回。我姓韋，在這谷裡開一爿小店，買賣公道，童叟無欺。喂，你怎麼稱呼？',
      again: '來啦？……又不認得我了。行，老規矩，當是頭一回。我姓韋，谷裡那爿小店是我開的。喂，怎麼稱呼？'
    },
    naming: '他張了張口。一個名字自己到了嘴邊。',
    named: '說完他自己也愣住：這名字是哪裡來的？',
    reply: {
      first: '隨口取的罷？也成。我只管叫你無名小子。',
      again: '又是這個。你每回都說是隨口取的。'
    },
    board:
      '石臺上擺著一盤棋，黑子已經落了一枚。臺沿刻著一行字，落款磨得看不清：「勝我者，得其名。」',
    stones: '他伸手去碰白子。三枚白子自己亮了。'
  },
  // The invitation each hero received. It has no signature.
  letter:
    '君於此刻一念出神。借此一念，入此境中，同下十局。十局皆勝，還君此刻，另贈一悟，足解眼前之厄。中道而敗，原念奉還，無損，亦無得。入局者聽執子之人。',
  draw: '三枚白子亮了，三個人各自從自己的年月裡應帖而來。每人手裡都有一張同樣的帖，帖末沒有落款。',
  // First board, after the three have arrived.
  command: {
    note: '三個人互相打量，又一齊望向他。',
    text: '我也剛醒，不知道這是哪裡。可我看得見整盤棋，你們好像只看得見身邊幾步。帖上說，入局的人聽執子的人。……執子的人，好像是我。'
  },
  deploy: '盤上只有五個落子的位置。先落的一枚是「眼」；眼破，全盤皆輸。其餘的人在盤邊等著，下一局仍可換上。',
  // After the first win.
  shop: '第一局走完，韋小寶把攤子一字排開，掛出「通吃坊」的布招。藥按帖收錢，兵器隨你掂。武譜只得一份，交給哪位同伴、肯花多少心力練，是你們的事。攤上的東西新舊差了幾百年，有的銅綠未褪，有的樣式誰也沒見過。有人多看了兩眼，沒有作聲。',
  opened: {
    note: '韋小寶把攤子一字排開，掛出「通吃坊」的布招。攤上的東西新舊差了幾百年，有的銅綠未褪，有的樣式誰也沒見過。',
    text: '藥按帖收錢，兵器隨你掂。武譜只得一份，給誰練，你們自己商量。看甚麼？我這裡的貨，件件是真的。真得很。'
  },
  // Before the fifth board the company sits down by the shop's lamp.
  night: '這一局開始之前，眾人圍著通吃坊的燈坐下。',
  // After a lost board.
  scatter: {
    note: '白子一齊暗了。眾人像給人從夢裡叫醒，來不及說一句話，就不見了。',
    text: '收攤。買下的東西放我這兒，丟不了。下回早些來。'
  },
  win: '十級階走完，同行的人都回去了。階頂站著一個人，背對著他，手裡沒有劍。這一次，他可以走上去。他拔出劍。那人折了一根樹枝。只一招。「還不夠。」',
  winAgain: '他沒有得到名字。',
  loss: '這一輪的眼破了。盤上的白子一齊暗下去，石臺邊只剩他與那隻大鵰。',
  join: '救下一個影子，盤邊便多了一枚白子。又有人應帖而來。',
  joined: '應帖而來。',
  closing: '他闔上眼。'
};

// One entry per board. `obsession` is what its master cannot bear to lose; `shade` is the
// figure caught under that obsession, whom the side objective saves.
const CHAMBER_TALES = [
  {
    name: '青竹渡',
    obsession: '一本劍譜。別人有的，他要。',
    shade: '橋洞裡的孩子',
    arrival: '石橋橫在淺水上，兩頭都給人封了。橋孔裡露出半隻破草鞋，鞋底脫了三針。',
    victory: '橋頭的鐵鏈鬆了。兩個搶劍譜的人各退了半步，橋下的水重新流過橋孔。'
  },
  {
    name: '紅楓驛',
    obsession: '一樁舊事。他怕它見光。',
    shade: '受傷的信使',
    arrival: '雨把驛桌洗得發亮。楓葉下兩封信一模一樣，獨有一封在蠟裡留了拇指掐過的月牙。',
    victory: '驛馬再度起步。路邊那片紅楓頭一回給馬蹄踩破，沒再倒飛回樹上。'
  },
  {
    name: '蘆花汀',
    obsession: '一句好話。他要人人說他贏。',
    shade: '吹哨的採藥女',
    arrival: '蘆葉齊齊向西點頭，像一排奉承人的脖子。有人捂住芒草間的竹哨，掌心還在震。',
    victory: '蘆花各往各的方向散開。一聲真咳嗽從喝采的空隙傳出，水面的小蜉蝣也跟著一跳。'
  },
  {
    name: '聽雪棧',
    obsession: '一條命。只要自己活。',
    shade: '讓人先過的旅客',
    arrival: '棧橋下的鈴舌結了冰。雪面有兩行腳印去，一行腳印回，回來那行比去時每步都深。',
    victory: '崖口的冰鈴終於響了。山風穿過棧底，只剩一股洗淨油垢的粗麻味。'
  },
  {
    name: '空山琴臺',
    obsession: '一個盟。天下只許一個聲音。',
    shade: '隔谷吹簫的人',
    arrival: '琴腹裡壓著一枚銅片。每到該停手的地方，銅片就撞出尖音，把山那頭剛起的簫蓋住。',
    victory: '銅片取出，琴停的地方留下了一口氣的空白。有人在石凳上挪了半尺，給一位遲來的朋友留座。'
  },
  {
    name: '桃花石陣',
    obsession: '天下第一。贏到了，卻不知道贏的人是誰。',
    shade: '牆後的女子',
    arrival: '桃瓣沾上石壁就變作朱漆。牆裡的門閂年久發黑，拇指挨過的那一段卻磨得透亮。',
    victory: '沉了多年的門閂抬高半寸，裡外的風終於通了。一片桃花從門檻下鑽過，沾了鞋尖才落地。'
  },
  {
    name: '襄陽殘垣',
    obsession: '一座城。他要立不世之功。',
    shade: '守車的老伯',
    arrival: '襄陽東門橫著一塊車輪楔，刻滿過城的車數。城頭鼓槌就停在最後一道短痕上方。',
    victory: '車楔讓開，鼓槌落下。一枚原本朝人背心來的流矢，終於只釘在搬空的菜筐上。'
  },
  {
    name: '寒玉石室',
    obsession: '一個人。她輸不起的是情。',
    shade: '寒玉旁的傷者',
    arrival: '寒玉壁上結著半句話的霜。霜深處壓著一隻手，掌紋還在抖。',
    victory: '霜融開一掌寬。那半句話的後頭，原來一個字也沒有。'
  },
  {
    name: '倒影天街',
    obsession: '一個名聲。君子的名。',
    shade: '攥著銅錢的孩子',
    arrival: '華山與嵩山的旗號縫在一塊布的兩面。收旗的線從一枚方孔錢中穿過，街角的孩子已經舉酸了手。',
    victory: '兩層店旗在地上攤平。客人們認出夥計袖口補過的針腳，頭一回問起他自己的姓名。'
  },
  {
    name: '無刻漏臺',
    obsession: '一個國。他要把輸掉的贏回來。',
    shade: '望見家門的老人',
    arrival: '銅漏的最後一滴水懸在半空。兩根星索托住它，水滴裡含著一個沒能說完的「我」字。',
    victory: '那滴水落了下去。銅漏響了一聲，高臺第一次投下完整的影子。'
  }
];

// Said in the shop when the side objective was done. One per kind of objective, so it
// reads true on any board.
const SIDE_TALES = {
  speed: '你趕在限時之前取勝。局裡那個影子，來得及做完他要做的事。',
  safe: '點過出戰的人，一個也沒少。那個一直讓別人先走的影子，這才肯跟上來。',
  beacon: '引路燈亮了。燈下那個影子看清了路，也看清了來接他的人。',
  cache: '姓名籤回到了主人手裡。她把自己的名字唸了一遍，門便開了。',
  herbs: '藥送到了那隻發冷的手裡。影子緩過一口氣，握住了伸過來的手。'
};

export { MAZE_TALE, CHAMBER_TALES, SIDE_TALES, YOUTH, WEI, EAGLE };
