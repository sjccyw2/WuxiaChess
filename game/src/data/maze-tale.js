// The story of one run, in three layers that never depend on one another:
//
//   the spine   MAZE_TALE: what happens at a position in the run (opening his eyes, the
//               first board, the night talk, the end). Told by the youth, 韋小寶 and narration,
//               who are present whoever was drawn.
//   the boards  CHAMBER_TALES here, ENCOUNTER_SCRIPT in encounter-script.js: one board and
//               its master, who is made to fight by something pressing on his mind from
//               outside the board. A board never refers to another board or to its place
//               in the order, so boards can be shuffled.
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
  join: '盤邊多亮了一枚白子。又有人應帖而來。',
  // Once said after a won board whose side objective was not done. Unused since every win brings
  // a hero; kept for the story agent.
  unlit: '這一局贏了。盤邊的白子，沒有多亮一枚。',
  joined: '應帖而來。',
  closing: '他闔上眼。'
};

// One entry per board: what is seen on arriving, and what changes when the board is won.
const CHAMBER_TALES = [
  {
    name: '青竹渡',
    arrival: '石橋橫在淺水上。橋頭與橋尾各立著一個人，一動不動，像兩枚落定的黑子。',
    victory: '橋頭的鐵鏈鬆了。兩人眉心的劍意一散，各退了半步，橋下的水重新流過橋孔。'
  },
  {
    name: '紅楓驛',
    arrival: '雨把驛桌洗得發亮。桌旁兩個人手按兵刃，眼睛卻望著別處，像在聽一句旁人聽不見的話。',
    victory: '驛鈴又響了。兩個人醒過來，頭一件事是各自往後退了一步。'
  },
  {
    name: '蘆花汀',
    arrival: '蘆葉齊齊向西點頭。蘆叢裡立著一老一少，衣袖無風自動。',
    victory: '蘆花各往各的方向散開。壓在灘頭的那道劍意散了，水面的小蜉蝣跟著一跳。'
  },
  {
    name: '聽雪棧',
    arrival: '棧橋下的鈴舌結了冰。兩個僧人背靠崖壁立在棧道當中，刀已經出了鞘。',
    victory: '崖口的冰鈴終於響了。兩柄血刀各自回鞘，這一回沒有再彈出來。'
  },
  {
    name: '空山琴臺',
    arrival: '臺上的琴沒有人彈。石階上一高一低立著兩個人，掌心都凝著勁。',
    victory: '石階上的霜化了。兩個人收了掌，琴絃給山風撥了一下，自己響了一聲。'
  },
  {
    name: '桃花石陣',
    arrival: '桃瓣落在石上，沒有人去拂。陣心伏著一個人，嘴裡反覆問著同一句話。',
    victory: '陣心的勁道平了。一片桃花從石縫裡鑽出來，沾了鞋尖才落地。'
  },
  {
    name: '襄陽殘垣',
    arrival: '襄陽東門的門洞下立著兩個人。更鼓不響，城頭無人，他們卻像在等一聲號令。',
    victory: '城頭的鼓槌終於落下。門洞裡那股勁道散了，五隻金輪停在地上，不再轉。'
  },
  {
    name: '寒玉石室',
    arrival: '寒玉壁上結滿了霜。壁前立著兩個女子，年長的那個指間扣著三枚銀針。',
    victory: '霜融開一掌寬。銀針落在玉上，叮的一聲，再沒有人去拾。'
  },
  {
    name: '倒影天街',
    arrival: '長街上店門都閂著。街心立著兩個人，一個青衫佩劍，一個垂手在後。',
    victory: '長劍歸鞘，這一回沒有再滑出來。街邊有一扇窗，悄悄推開了一道縫。'
  },
  {
    name: '無刻漏臺',
    arrival: '銅漏的最後一滴水懸在半空。兩股星索從盤外垂下來，繫在臺心一位老者身上。',
    victory: '兩股星索斷了，縮回盤外。懸了許久的那滴水終於落下，銅漏響了一聲。'
  }
];

// Said when the secondary objective was done, by its kind (journey.js SIDE_KINDS), so it reads
// true on any board; a kind without a line of its own takes `done`, the tail the others share.
const LAMP_TALE = '引路燈亮了。盤外持帖的人，望得見入局的路了。';
const SIDE_TALES = {
  lamp: LAMP_TALE,
  swift: '這一局贏得快。盤外持帖觀望的人，看在眼裡。',
  intact: '點過出戰的人，一個也沒少。盤外持帖觀望的人，看在眼裡。',
  done: '盤外持帖觀望的人，看在眼裡。'
};

export { MAZE_TALE, CHAMBER_TALES, SIDE_TALES, YOUTH, WEI, EAGLE };
