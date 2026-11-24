// Each board's master and lieutenant. They did not answer an invitation: they were set
// down as black stones, and something from outside the board makes them fight. Stable actor
// IDs keep positions and health in earlier saves intact.
//
// `traits` is how one villain differs from another (SPEC-mechanics §7.1):
//   mods     { hp: multiplier, atk: added, def: added, step: set, range: set } on the stage numbers
//   sig      { reach, power, turns, cadence, sweep, extra: 'pin' | 'line' | 'wound', heal, note }
//   post     { tile: 'spawn' | 'master' | {x, y}, tether, wake: true | 'struck' | false, note }
//   phase    { name, atk, def, step, range, cadence, prefers, brace, holds, flee, log, note }
//   prefers, redirect, contact, banner, glide, basicPoison { power, turns, name }
//   stance   { while: 'charged' | 'posted', cut, holds }: 'posted' (盾牆) cuts only on its post
//   cover    'master' (takes blows for the board's master) | 'kin' (刀陣: for an adjacent piece
//            of its own type with less 氣血)
//   crowded  { within, atk }: 近身失準, its blows and counters on a hero that close are weaker
//   execute  { atk }: 斬殘, its blows and counters on a hero at or below half are stronger
//   ward     the share (percent) a living piece takes off its master's blows (星索護陣; today only
//            the board objects carry it, board-objects.js)
//   flurry   { share }: 分刺, after its blow a second on another hero in reach, at that share
//   bend     true: 轉折, its blows pass terrain defence and no 代受 can take them
//   pull     true: 擒拿, its signature drags the hero it lands on to the tile before it
//   fleet    true: 水上飄, every tile it can walk costs it one step
//   twin     { atk }: 陰陽倒亂, odd rounds the sabre (攻擊 up), even rounds the sword (射程 +1)
//   lone     { atk }: 獨行, stronger with no other black stone beside it
//   pincer   { atk }: 夾衛, stronger on a hero another black stone stands beside
//   stepPoison { power, turns }: 步裡藏毒, a blow struck after walking poisons
//   lastStand  { below, cut }: 沉樁, at or below that share of its 氣血 it takes less from blows
//   snare    { power, turns }: 墜網, its plain blow leaves the hero 絆足
//   unfelled 不敗: no blow, counter or poison brings its 氣血 below 1 (求敗, on the last board)
//   withdraw { below }: 退守, at or below that share of its 氣血 it falls back among its own
//   formless 無招: no 破招 answers it, whatever it holds
// A `note` is the villain's own words for the enemy page; {tile} is the post's tile. A villain
// without traits plays exactly as before the redesign. `phase.say` is a line the piece speaks as it
// changes, logged after `phase.log`.
import { MAZE_TALE } from './maze-tale.js';

function adversary(name, school, book, basic, skill, style, visual, bio, mini, robe, traits = {}) {
  return { name, school, book, basic, skill, style, visual, bio, mini, robe, traits };
}
const ENCOUNTERS = [
  [
    adversary(
      '余滄海',
      '青城派',
      '笑傲江湖',
      '松風劍法',
      '摧心掌',
      'weak',
      'guard',
      '青城派掌門，為奪林家辟邪劍譜，結下滿門血仇。如今守著橋頭，心中只剩「誰上橋便打誰」，一記森冷掌力，能壓住對手攻勢。',
      'chief',
      '',
    {
      post: {
        tile: 'spawn',
        tether: 0,
        wake: true,
        note: '守在橋頭不動；有俠客踏入他的攻擊範圍，或他受到攻擊後，才離位追擊。'
      }
    }
    ),
    adversary(
      '木高峰',
      '塞北明駝',
      '笑傲江湖',
      '駝劍',
      '駝峰毒霧',
      'poison',
      'duan',
      '塞北明駝也在追奪辟邪劍譜，向與余滄海不睦。這回卻同受戰意驅使，站定橋尾，連駝杖也收不回。',
      'bandit',
      'sepia(.22)',
    {
      post: {
        tile: 'spawn',
        tether: 0,
        wake: true,
        note: '守在橋尾不動；有俠客踏入攻擊範圍或受到攻擊後，才離位追擊。'
      }
    }
    )
  ],
  [
    adversary(
      '田歸農',
      '天龍門北宗',
      '飛狐外傳',
      '天龍劍法',
      '天龍快劍',
      'exposed',
      'hero',
      '天龍門北宗掌門，沒有把握的仗從來不打。如今雙腳自行向前，快劍仍照舊專破對手守勢，進退卻輪不到他選。',
      'hero',
      'sepia(.38) saturate(.8)',
    { mods: { hp: 0.9, def: 2, step: 3, range: 1 } }
    ),
    adversary(
      '閻基',
      '閻府',
      '飛狐外傳',
      '奪手刀',
      '接骨續筋',
      'mend',
      'guard',
      '原是跌打醫生，靠暗中下藥起家；搭得出自己沒有中藥，卻尋不到心裡催戰的病根。動手出於受逼，替受傷同夥接骨續筋，倒是他的老本行。',
      'bandit',
      'hue-rotate(15deg) saturate(.7)',
    { mods: { hp: 0.9, atk: -3, step: 2, range: 1 }, sig: { heal: 'stage' } }
    )
  ],
  [
    adversary(
      '丁春秋',
      '星宿派',
      '天龍八部',
      '星宿掌',
      '化功大法',
      'drain',
      'medic',
      '星宿老怪，向來只有他化人內力，如今心中卻添了別人的念頭。他認得出，也掙不開，袖下的化功大法仍在削人內力。',
      'murong',
      'sepia(.22) hue-rotate(85deg)',
    { mods: { range: 2 }, contact: { mp: 8 } }
    ),
    adversary(
      '摘星子',
      '星宿派',
      '天龍八部',
      '摘星掌',
      '星宿毒焰',
      'poison',
      'guo',
      '星宿派大弟子，只道師父有意顯威，頌揚得格外起勁。毒焰藏在中空的蘆稈中，順稈游走。',
      'zhang',
      'hue-rotate(55deg) saturate(.8)',
    { sig: { reach: 3 } }
    )
  ],
  [
    adversary(
      '血刀老祖',
      '血刀門',
      '連城訣',
      '血刀刀法',
      '血刀奇襲',
      'sweep',
      'xiao',
      '血刀門第四代掌門，一生只打划算的架。心裡催他出刀，他三番不理，卻三番都是刀先動，索性任它橫掃棧道兩側。',
      'hu',
      'sepia(.25) hue-rotate(-30deg) saturate(1.4)',
    {
      mods: { atk: 2, def: -2, step: 3, range: 1 },
      sig: { sweep: 0.33 },
      phase: {
        name: '遁走',
        flee: { turns: 3, herbs: 0.08, until: 0.75 },
        log: '血刀老祖忽收刀勢，踏雪退往藥草地。這半醒之間，他已算定：傷先養好，人留著再砍。',
        note: '氣血過半後退向最近的藥草地，三回合內只打身邊的人；在藥草地每回合回復最大氣血的 8%，回到七成五即止。'
      }
    }
    ),
    adversary(
      '寶象',
      '血刀門',
      '連城訣',
      '血刀刀法',
      '血刀連斬',
      'exposed',
      'hu',
      '血刀門僧，與來人無仇，血刀卻自行出鞘。冰雪沿坡而下，正好替他遮掩刀鋒。',
      'guard',
      'sepia(.4) saturate(1.15)',
    {
      mods: { hp: 1.1, step: 3, range: 1 },
      prefers: 'wounded',
      post: { tile: 'spawn', tether: 1, wake: false, note: '守在棧口{tile}一格內，不離位。' }
    }
    )
  ],
  [
    adversary(
      '左冷禪',
      '嵩山派',
      '笑傲江湖',
      '嵩山劍法',
      '寒冰真氣',
      'pin',
      'duan',
      '嵩山掌門、五嶽盟主，每出一掌都算過利害。今日未及算計，寒氣已到掌心，仍能沿斷絃侵入人的經脈。',
      'chief',
      'saturate(.48) hue-rotate(135deg)',
    {
      mods: { hp: 1.1, def: 2, step: 3, range: 2 },
      banner: { atk: 1 },
      post: {
        tile: 'spawn',
        tether: 2,
        wake: 'struck',
        note: '守在琴臺{tile}兩格內；受到攻擊後才離臺。'
      }
    }
    ),
    adversary(
      '費彬',
      '嵩山派',
      '笑傲江湖',
      '嵩山掌法',
      '大嵩陽神掌',
      'sweep',
      'guo',
      '大嵩陽手守住上臺石階，心裡催他出手的，竟比掌門號令更難違。一掌落下，兩邊石座一齊作響。',
      'guo',
      'sepia(.32) hue-rotate(-12deg)',
    {
      mods: { hp: 1.2, def: 3, step: 2, range: 1 },
      post: {
        tile: 'spawn',
        tether: 1,
        wake: false,
        note: '守在石階{tile}一格內，不離位；被牽離後會走回。'
      }
    }
    )
  ],
  [
    adversary(
      '歐陽鋒',
      '白駝山',
      '射鵰英雄傳',
      '靈蛇杖法',
      '蛤蟆功',
      'sweep',
      'guo',
      '西毒贏到了天下第一，卻忘了自己是誰，所以分不出哪個念頭是自己的。他伏在陣心蓄勢；石陣能分開蛇群，緊挨的同伴卻容易被掌風一併震傷。',
      'murong',
      'sepia(.15) hue-rotate(28deg)',
    {
      mods: { range: 2 },
      stance: { while: 'charged', cut: 0, holds: true },
      phase: {
        name: '逆練',
        atk: 6,
        def: -4,
        step: 1,
        cadence: 2,
        prefers: 'nearest',
        holds: false,
        log: '歐陽鋒逆運經脈，身形愈見狂亂。人醒了一半，露出來的卻仍是那個瘋了的自己。',
        note: '攻擊 ＋6、防禦 −4、移動 ＋1，絕技每兩回合一次，不再原地等待，見人就撲。'
      }
    }
    ),
    adversary(
      '歐陽克',
      '白駝山',
      '射鵰英雄傳',
      '靈蛇拳',
      '靈蛇拳法',
      'pin',
      'guard',
      '白駝山少主明知催他動手的不是自己，摺扇卻仍向前指。蛇奴奉扇而行，一撥撥從桃溪趕來。',
      'duan',
      'sepia(.2) saturate(.6)',
    { mods: { atk: -4, range: 2 } }
    )
  ],
  [
    adversary(
      '金輪國師',
      '蒙古國師',
      '神鵰俠侶',
      '五輪大轉',
      '龍象般若功',
      'line',
      'guo',
      '蒙古國師，立功只肯憑手中五輪。如今給一股勁道推著出手，心中不服，五輪卻仍旋轉不休，連對手身旁的人也會受傷。',
      'guo',
      'sepia(.65) saturate(1.3)',
    {
      mods: { hp: 1.1, def: 2, step: 2, range: 2 },
      sig: {
        reach: 3,
        note: '輪勢穿過目標，再以一半威力擊中其後兩格內首名俠客（危險範圍不顯示穿透）。'
      }
    }
    ),
    adversary(
      '霍都',
      '蒙古王子',
      '神鵰俠侶',
      '摺扇點穴',
      '狂風迅雷功',
      'weak',
      'xiao',
      '蒙古王子，師承金輪國師，向來一見勢危便走。今日雙腳困在門洞，只好揮動摺扇，照舊專取人的弱處。',
      'duan',
      'sepia(.25) hue-rotate(-32deg)',
    {
      mods: { hp: 0.9, step: 4, range: 2 },
      prefers: 'isolated',
      post: { tile: 'spawn', tether: 1, wake: false, note: '守在門洞{tile}一格內，不離位。' }
    }
    )
  ],
  [
    adversary(
      '李莫愁',
      '赤練仙子',
      '神鵰俠侶',
      '拂塵',
      '冰魄銀針',
      'poison',
      'duan',
      '赤練仙子每次殺人，心裡總有那個人。今日連恨也非出自本心，冰魄銀針卻照舊扣在指間。',
      'xiao',
      'sepia(.4) hue-rotate(-43deg) saturate(1.45)',
    {
      mods: { def: -2, range: 2 },
      sig: { reach: 3, extra: 'wound' },
      prefers: 'healer'
    }
    ),
    adversary(
      '洪凌波',
      '赤練門下',
      '神鵰俠侶',
      '拂塵手',
      '赤練掌法',
      'exposed',
      'xiao',
      '李莫愁的弟子，守住寒玉室出口。心中那聲催促不歇，明明不願打，拂塵卻放不下。',
      'medic',
      'sepia(.32) hue-rotate(26deg)',
    {
      mods: { def: 2, range: 2 },
      post: {
        tile: { x: 5, y: 3 },
        tether: 1,
        wake: false,
        note: '守在石頸北口{tile}一格內，不離位。'
      }
    }
    )
  ],
  [
    adversary(
      '岳不群',
      '華山派',
      '笑傲江湖',
      '華山劍法',
      '辟邪劍法',
      'exposed',
      'hero',
      '華山掌門號君子劍，每次出手必先占理。今日名目未立，劍已出鞘，仍專破對手守勢。',
      'hero',
      'hue-rotate(-48deg) saturate(.7)',
    {
      mods: { range: 1 },
      glide: 2,
      phase: {
        name: '辟邪現形',
        step: 2,
        def: -3,
        cadence: 2,
        log: '岳不群身形陡快，臉上的君子神氣再也遮不住了。半醒之間，先露出本來面目。',
        note: '移動 ＋2、防禦 −3，絕技每兩回合一次。'
      }
    }
    ),
    adversary(
      '勞德諾',
      '嵩山密探',
      '笑傲江湖',
      '華山劍式',
      '嵩山快劍',
      'weak',
      'hu',
      '嵩山埋在華山的耳目，慣於聽兩頭號令。今日心中那聲催促，竟不出於任何一頭。',
      'bandit',
      'sepia(.2) hue-rotate(55deg)',
    { mods: { step: 4 }, prefers: 'leader' }
    )
  ],
  [
    adversary(
      '慕容博',
      '姑蘇慕容',
      '天龍八部',
      '參合指',
      '斗轉星移',
      'mirror',
      'duan',
      '姑蘇慕容氏半生暗中撥弄旁人相鬥，今日也成了盤上之子。兩股星索從盤外垂下，各繫銅樁再牽到他身上，每樁旁有一名守索人。毀一樁，便卸去三成半護勁。',
      'murong',
      '',
    {
      redirect: { while: 'charged', keep: 0, back: 0.5 },
      phase: {
        atk: 5,
        range: 1,
        brace: true,
        log: '慕容博半醒，斗轉星移倒轉銅漏：攻擊增加 5、防禦增加 4，射程擴至三格。',
        note: '攻擊 ＋5、防禦 ＋4、射程擴至三格。'
      }
    }
    ),
    adversary(
      '鳩摩智',
      '大輪明王',
      '天龍八部',
      '小無相功',
      '火焰刀',
      'drain',
      'guo',
      '吐蕃國師大輪明王，讀遍武學經卷，也不識壓住自己心神的那道戰意。身雖受制，心卻貪戀，一雙翻經的手仍能催出火焰刀。',
      'zhang',
      'sepia(.65) hue-rotate(-8deg) saturate(1.25)',
    { sig: { reach: 4 }, prefers: 'mp' }
    )
  ],
  // The boards built round one villain (maps 10 on): the villain is the 局主 and there is no
  // lieutenant; the other three of the fixed four are his troop type (GARRISONS).
  [
    adversary(
      '洪安通',
      '神龍教',
      '鹿鼎記',
      '神龍擒拿',
      '鎖脈擒龍',
      'drain',
      'guard',
      '神龍教主聽慣了「仙福永享，壽與天齊」，今日卻有一道號令越過他，直使喚他雙手。他的擒拿能隔數步扯人到身前，鎖住脈門，削去內力。',
      'hongAn',
      '',
      {
        mods: { hp: 1.15, step: 3, range: 1 },
        sig: { reach: 3 },
        pull: true,
        post: {
          tile: 'spawn',
          tether: 2,
          wake: 'struck',
          note: '守在臺前{tile}兩格內，叫教眾上前；受到攻擊後才下臺。'
        }
      }
    )
  ],
  [
    adversary(
      '公孫止',
      '絕情谷',
      '神鵰俠侶',
      '金刀黑劍',
      '陰陽倒亂刃法',
      'weak',
      'hu',
      '絕情谷主左手金刀、右手黑劍，一向替旁人作主，今日反被別人的念頭驅使，連笑臉也掛不住。刀使劍招，劍使刀招，一回合重、一回合長，令人難料。',
      'gongSun',
      '',
      { mods: { hp: 1.5, atk: 6, def: 2, range: 1 }, twin: { atk: 7 } }
    )
  ],
  [
    adversary(
      '裘千仞',
      '鐵掌幫',
      '射鵰英雄傳',
      '鐵掌探手',
      '鐵掌',
      'exposed',
      'guo',
      '鐵掌幫主號稱鐵掌水上飄，能裂石破守，也能踏水如平地，平生只認強弱。給戰意逼著出掌，他雖不服，心底卻漸有另一句話：這掌該不該打？',
      'qiuRen',
      '',
      { mods: { hp: 1.4, atk: 8, def: 2, step: 4, range: 1 }, fleet: true }
    )
  ],
  [
    adversary(
      '李秋水',
      '逍遙派・西夏宮廷',
      '天龍八部',
      '逍遙掌',
      '白虹掌力',
      'sweep',
      'guo',
      '逍遙派高手、西夏皇太妃，常以白綢遮面；同師姊鬥了一世，為的卻是心裡另有旁人的人。今夜逼她出手的念頭與他無關，白虹掌力仍能轉折，繞過欄杆花樹，連旁人也擋不住。',
      'liQiu',
      '',
      {
        mods: { hp: 1.2, atk: 3, step: 4, range: 2 },
        sig: { reach: 3, sweep: 0.4 },
        bend: true,
        prefers: 'sheltered'
      }
    )
  ],
  [
    adversary(
      '東方不敗',
      '日月神教',
      '笑傲江湖',
      '繡針疾刺',
      '葵花飛針',
      'pin',
      'duan',
      '日月神教主練成《葵花寶典》，再無抗手，便只在花園小舍繡花；旁人求的不敗，於他不過名字。人影鬼魅般一閃，一枚繡花針已分刺兩人。',
      'dongFang',
      '',
      {
        mods: { hp: 1.5, atk: 6, step: 5, range: 2 },
        sig: { reach: 3 },
        flurry: { share: 0.8 }
      }
    )
  ]
];
// The troop type that fills the other three fixed seats of a board built round one villain, by
// map index. Those boards have no lieutenant, archer or scout of their own.
const GARRISONS = { 10: 'shenLong', 11: 'netHand', 12: 'ironPalm', 13: 'xiaGuard', 14: 'heiMuGuard' };
// The rank and file of each board, by board: { bow: {...}, scout: {...} }, each with the fields
// of a DETAILS entry (name, role, school, mini, basic, bio) and optionally `traits` (only `mods`,
// `post`, `cover`, `prefers`, `basicPoison`, `glide`, `crowded`, `execute` and `stance` with
// `while: 'posted'` apply to them). A board left empty keeps the shared 黑子 pieces.
const RANKS = [
  // ── board 0
  // Board 0: the 青城 archer and scout keep the shared pieces' text.
  { bow: {}, scout: {} },
  // ── board 1
  {
    bow: {
      name: '天龍門弟子',
      role: '弓手',
      school: '天龍門北宗',
      mini: 'archer',
      basic: '天龍連珠箭',
      bio: '替掌門守住驛道口的弟子，箭隨人走，專射趕路的人。'
    },
    scout: {
      name: '驛站打手',
      role: '打手',
      school: '閻府',
      mini: 'bandit',
      basic: '短棍',
      bio: '閻基花錢雇來的打手，搶先堵住岔路。'
    }
  },
  // ── board 2
  {
    bow: {
      name: '星宿弟子',
      role: '毒鏢',
      school: '星宿派',
      mini: 'archer',
      basic: '星宿毒鏢',
      bio: '口裡唱著「星宿老仙」，身子總擋在師父前面。',
      traits: {
        mods: { atk: -2 },
        cover: 'master',
        post: { tile: 'master', tether: 1, wake: false }
      }
    },
    scout: {
      name: '星宿弟子',
      role: '護法',
      school: '星宿派',
      mini: 'bandit',
      basic: '抽髓掌',
      bio: '師父一皺眉，他便搶上一步替師父挨打。',
      traits: {
        mods: { atk: -2 },
        cover: 'master',
        post: { tile: 'master', tether: 1, wake: false }
      }
    }
  },
  // ── board 3
  {
    bow: {
      name: '血刀門弓僧',
      role: '弓手',
      school: '血刀門',
      mini: 'archer',
      basic: '雪坡冷箭',
      bio: '伏在北面崖棧上，雪樑一動便放箭。',
      traits: {
        post: { tile: 'spawn', tether: 1, wake: false, note: '守在崖棧{tile}一格內，不離位。' }
      }
    },
    scout: {
      name: '血刀門僧',
      role: '遊僧',
      school: '血刀門',
      mini: 'bandit',
      basic: '血刀',
      bio: '踏著下層棧道繞到人背後。'
    }
  },
  // ── board 4
  {
    bow: {
      name: '嵩山弟子',
      role: '弓手',
      school: '嵩山派',
      mini: 'archer',
      basic: '嵩山連弩',
      bio: '聽盟主號令放箭，盟主一倒，手便慢了。'
    },
    scout: {
      name: '嵩山弟子',
      role: '劍手',
      school: '嵩山派',
      mini: 'bandit',
      basic: '嵩山快劍',
      bio: '從兩翼繞上琴臺的嵩山劍手。'
    }
  },
  // ── board 5
  {
    bow: {
      name: '白駝山蛇奴',
      role: '蛇奴',
      school: '白駝山',
      mini: 'archer',
      basic: '放蛇',
      bio: '趕著蛇群穿過石陣的奴僕，蛇牙帶毒。',
      traits: { basicPoison: { power: 2, turns: 2, name: '蛇毒' } }
    },
    scout: {
      name: '白駝山蛇奴',
      role: '蛇奴',
      school: '白駝山',
      mini: 'bandit',
      basic: '蛇杖',
      bio: '杖頭盤著活蛇，打中便留下毒牙。',
      traits: { basicPoison: { power: 2, turns: 2, name: '蛇毒' } }
    }
  },
  // ── board 6
  {
    bow: {
      name: '蒙古箭手',
      role: '弓手',
      school: '蒙古軍',
      mini: 'archer',
      basic: '強弓',
      bio: '伏在東牆缺口，射城下奔走的人。',
      traits: {
        post: { tile: 'spawn', tether: 1, wake: false, note: '守在東牆{tile}一格內，不離位。' }
      }
    },
    scout: {
      name: '蒙古鐵騎',
      role: '遊騎',
      school: '蒙古軍',
      mini: 'bandit',
      basic: '馬刀',
      bio: '從牆缺直衝陣後的輕騎。',
      traits: { mods: { step: 5 } }
    }
  },
  // ── board 7
  {
    bow: {
      name: '赤練門下',
      role: '弓手',
      school: '赤練門下',
      mini: 'archer',
      basic: '赤練針',
      bio: '守北洞的女弟子，針上也淬了毒。'
    },
    scout: {
      name: '赤練門下',
      role: '弟子',
      school: '赤練門下',
      mini: 'bandit',
      basic: '拂塵手',
      bio: '在寒玉壁間來回巡看的弟子。'
    }
  },
  // ── board 8
  {
    bow: {
      name: '華山弟子',
      role: '弓手',
      school: '華山派',
      mini: 'archer',
      basic: '華山連箭',
      bio: '守在橋頭的華山弟子，認得每一條水道。',
      traits: {
        post: { tile: 'spawn', tether: 1, wake: false, note: '守在橋頭{tile}一格內，不離位。' }
      }
    },
    scout: {
      name: '嵩山密探',
      role: '密探',
      school: '嵩山派',
      mini: 'bandit',
      basic: '短刃',
      bio: '混在街坊裡的嵩山耳目。'
    }
  },
  // ── board 9
  {
    bow: {
      name: '守索人',
      role: '護陣',
      school: '姑蘇慕容',
      mini: 'archer',
      basic: '星索',
      bio: '守著一根索樁的人。樁不倒，繫在慕容博身上的那股星索便不斷。',
      traits: { post: { tile: 'spawn', tether: 1, wake: false, note: '守在索樁一格內，不離位。' } }
    },
    scout: {
      name: '守索人',
      role: '護陣',
      school: '姑蘇慕容',
      mini: 'bandit',
      basic: '星索',
      bio: '守著另一根索樁的人。',
      traits: { post: { tile: 'spawn', tether: 1, wake: false, note: '守在索樁一格內，不離位。' } }
    }
  },
  // ── boards 10 to 14: their rank and file are the villain's troop type (GARRISONS)
  {},
  {},
  {},
  {},
  {}
];
// How strong a signature's status is at each stage of the run. At stage 0 these are the numbers
// every villain used before the redesign.
const STATUS_POWER = {
  weak: (stage) => 3 + Math.floor(stage / 2),
  exposed: (stage) => 3 + Math.floor(stage / 2),
  poison: (stage) => 3 + stage,
  drain: (stage) => 6 + 2 * stage,
  pin: () => 2,
  sweep: () => 0,
  line: () => 0,
  mend: () => 0,
  mirror: () => 0
};
const lasting = (turns) => (turns === 2 ? '持續至下回合。' : '持續 ' + turns + ' 回合。');
const SHARES = { 2: '二', 3: '三', 4: '四', 5: '五' };
// A share as the text says it: 三分之一 for a third or a quarter, 四成 for a share that is no such
// fraction (0.4).
function shareOf(share) {
  const parts = Math.round(1 / share);
  if (SHARES[parts] && Math.abs(1 / parts - share) < 0.02) return SHARES[parts] + '分之一';
  return '一二三四五六七八九'[Math.round(share * 10) - 1] + '成';
}
// What a signature's rider adds to its note (`sig.extra`, or the style itself).
const EXTRAS = {
  wound: '，並受內傷：療傷減半，每次出手後自損 5 氣血，持續至下回合。',
  pin: '，並令目標絆足，移動減 2，持續至下回合。',
  line: '，並穿過目標，以一半威力擊中其後兩格內首名俠客。'
};
const riding = (text, extra) => (extra ? text.replace(/。$/, '') + EXTRAS[extra] : text);
// Each style's note, from the numbers of the stage it is met at.
const SIGNATURE_RULES = {
  weak: ({ power, turns, extra }) => riding('令目標攻擊降低 ' + power + '，' + lasting(turns), extra),
  exposed: ({ power, turns, extra }) =>
    riding('令目標防禦降低 ' + power + '，' + lasting(turns), extra),
  poison: ({ power, turns, extra }) =>
    riding('令目標中毒，' + (turns === 2 ? '兩' : turns) + '次毒發各損 ' + power + ' 氣血。', extra),
  drain: ({ power, extra }) => riding('另外削去目標 ' + power + ' 點內力。', extra),
  sweep: ({ sweep, extra }) =>
    riding(
      '相鄰的其他我方俠客也會受到' + shareOf(sweep) + '傷害。',
      extra
    ),
  pin: ({ power, turns, extra }) =>
    riding('令目標絆足，移動減 ' + power + '，' + lasting(turns), extra),
  line: () => '穿過目標，再以一半威力擊中其後兩格內首名俠客（危險範圍不顯示穿透）。',
  mend: ({ heal }) =>
    '蓄勢時替三格內氣血不足七成的同夥回復 ' +
    heal +
    ' 點氣血，此回合不出手；無人受傷時改以普攻出手，蓄勢保留。',
  mirror: () => '蓄勢時，第一次受到的直接攻擊全數不中，反震一半給出手者（封穴時無效）。'
};

// Damage is measured against the same foe's normal strike after the target's defenses.
const VILLAIN_FORMS = {
  摧心掌: [1.16, 'breakPalm'],
  駝峰毒霧: [1.04, 'blackNeedle'],
  天龍快劍: [1.2, 'breakSword'],
  接骨續筋: [0, 'silkwormPalm'], // 續命: no blow, so no strength
  化功大法: [1.1, 'northernSea'],
  星宿毒焰: [1.09, 'holyFireTurn'],
  血刀奇襲: [1.29, 'bloodAtPass'],
  血刀連斬: [1.18, 'foxTwinChange'],
  寒冰真氣: [1.15, 'lesserMarsh'],
  大嵩陽神掌: [1.22, 'vacantFist'],
  蛤蟆功: [1.4, 'toadLunge'],
  靈蛇拳法: [1.12, 'beggarBind'],
  龍象般若功: [1.3, 'flyingDragon'],
  狂風迅雷功: [1.14, 'foxFeint'],
  冰魄銀針: [1.08, 'iceSoulNeedle'],
  赤練掌法: [1.15, 'softPalm'],
  辟邪劍法: [1.32, 'shangYang'],
  嵩山快劍: [1.21, 'snowPursuit'],
  斗轉星移: [0, 'universeCanopy'],
  火焰刀: [1.27, 'tideBreaker'],
  橫棍封橋: [1.15, 'beggarBind'],
  凝碧截腕: [1.18, 'shangYang'],
  趙府令旗: [1.1, 'foxFeint'],
  金蠶蠱毒: [1.12, 'blackNeedle'],
  唐詩劍法: [1.2, 'snowPursuit'],
  鎖脈擒龍: [1.12, 'beggarBind'],
  陰陽倒亂刃法: [1.22, 'foxTwinChange'],
  鐵掌: [1.34, 'breakPalm'],
  白虹掌力: [1.24, 'vacantFist'],
  葵花飛針: [1.28, 'iceSoulNeedle'],
  無劍勝有劍: [1.35, 'ninefoldIntent']
};

// The villains added to the existing boards (battles.js). `rank` 'boss' is a 局主, 'mini' a 副手;
// `row` the stage row their numbers come from (game.js stageRows); `map` the one board each
// stands on. The five villains with boards of their own are in ENCOUNTERS instead.
const VILLAINS = {
  fengTiannan: {
    map: 0,
    rank: 'mini',
    row: 'lieutenant',
    ...adversary('鳳天南', '佛山五虎門', '飛狐外傳', '五虎棍', '橫棍封橋', 'pin', 'guard',
      '佛山五虎門掌門，霸住一鎮，出了自己地頭便不肯出頭。如今無端守著渡口，長棍橫出，專絆過路人的腳步。', 'fengTiannan', '', { mods: { step: 3 } })
  },
  zhaoZhong: {
    map: 1,
    rank: 'mini',
    row: 'lieutenant',
    ...adversary('張召重', '武當派・清廷', '書劍恩仇錄', '武當劍術', '凝碧截腕', 'weak', 'hero',
      '武當出身的清廷武官，素來奉令才動手，如今沒見印信也得聽命。他守在東院，專尋為首的人，一劍截向手腕。', 'zhaoZhong', '', {
        mods: { def: 2, step: 3 },
        prefers: 'leader',
        post: { tile: 'spawn', tether: 2, wake: 'struck', note: '守在東院{tile}兩格內；受到攻擊後才離位。' }
      })
  },
  wanYan: {
    map: 6,
    rank: 'boss', // the board's second 局主 now that it is a 守 board (Q-N28)
    row: 'lieutenant',
    ...adversary('完顏洪烈', '金國趙王府', '射鵰英雄傳', '王府侍從截擊', '趙府令旗', 'exposed', 'guo',
      '金國趙王，延攬豪傑只為國事，從不親自衝陣。今日令旗自行舉起，弓手卻仍照旗所指，把箭射向那人。', 'wanYan', '', { mods: { hp: 0.9, atk: -2 }, sig: { reach: 3 } })
  },
  xianYu: {
    map: 8,
    rank: 'boss',
    row: 'master',
    ...adversary('鮮于通', '華山派', '倚天屠龍記', '摺扇點穴', '金蠶蠱毒', 'poison', 'duan',
      '華山掌門號神機子，出手前總留退路。如今未及佈後著，摺扇便已揚起，扇中蠱毒照舊專取傷重之人。', 'xianYu', '', {
        mods: { hp: 0.7, def: -2, step: 3, range: 1 },
        prefers: 'wounded'
      })
  },
  wanZhen: {
    map: 9,
    rank: 'mini',
    row: 'lieutenant',
    ...adversary('萬震山', '荊州萬門', '連城訣', '萬門劍式', '唐詩劍法', 'exposed', 'hero',
      '荊州萬門之師夜夜夢遊，身睡而手不睡，總在砌牆。受戰意驅使，於他並不稀奇，出劍仍專取傷重之人。', 'wanZhen', '', { mods: { def: 1 }, prefers: 'wounded' })
  },
  // 求敗 himself, on the last board only (battles.js, the entry marked `last`). He stands at 天元
  // with a dry twig and is never felled: the board ends when he is brought to 1 氣血. What he
  // says is the spine's (maze-tale.js).
  qiubai: {
    map: 15,
    rank: 'boss',
    row: 'master',
    role: '對面的人',
    ...adversary('求敗', '無門無派', '神鵰俠侶、笑傲江湖', '折枝為劍', '無劍勝有劍', 'sweep', 'hero',
      '世人稱他求敗，本名早忘；利劍、軟劍、重劍、木劍逐一放下，四十歲後已不擇草木竹石。幾百年來只肯坐在盤外看，此刻放下棋子，手持枯枝，自己站到了天元。', 'qiubai', '', {
        sig: { reach: 2, sweep: 0.5, cadence: 3 },
        unfelled: true,
        formless: true,
        withdraw: { below: 0.25 },
        prefers: 'leader',
        post: { tile: 'spawn', tether: 0, wake: true, note: '立在天元{tile}；有俠客踏入攻擊範圍或受到攻擊後，才離位。' },
        phase: {
          atk: 4,
          step: 1,
          log: '求敗枯枝一振，劍勢陡盛：攻擊增加 4，移動增加 1。',
          say: MAZE_TALE.finale.half,
          note: '攻擊 ＋4、移動 ＋1。'
        }
      })
  }
};
// Troop types that follow those villains. `row` as above; only the traits listed in the RANKS
// comment apply to them.
const TROOPS = {
  fiveTiger: {
    row: 'scout',
    name: '五虎門棍徒',
    role: '長棍',
    school: '佛山五虎門',
    mini: 'fiveTiger',
    basic: '隔步掃棍',
    bio: '鳳天南念中的門徒，仗著人多棍長，隔一步打得最準。一給貼身，長棍便施展不開。',
    traits: { mods: { step: 3, range: 2 }, crowded: { within: 1, atk: 6 } }
  },
  qingShield: {
    row: 'scout',
    name: '清營刀盾兵',
    role: '刀盾',
    school: '清營',
    mini: 'qingShield',
    basic: '抵盾短刀',
    bio: '張召重念中的營兵，刀盾並持，堵住門口。站定便像一堵牆，離位反而護不住自身。',
    traits: {
      mods: { hp: 1.2, def: 3, step: 2, range: 1 },
      stance: { while: 'posted', cut: 40 },
      post: { tile: 'spawn', tether: 0, wake: false, note: '守在東院門前{tile}，不離位；被推離後會走回。' }
    }
  },
  jinBow: {
    row: 'bow',
    name: '趙王府弓手',
    role: '弓手',
    school: '金國趙王府',
    mini: 'jinBow',
    basic: '城外勁箭',
    bio: '完顏洪烈念中的府兵，見旗便放箭。隔得遠準頭足，給逼近便亂了。',
    traits: { mods: { range: 4 }, crowded: { within: 2, atk: 8 } }
  },
  huaBlade: {
    row: 'scout',
    name: '華山刀陣弟子',
    role: '陣刀',
    school: '華山派',
    mini: 'huaBlade',
    basic: '合步斜刀',
    bio: '鮮于通念中的弟子，兩人一組合使刀法。並肩時彼此補位，刀陣方全。',
    traits: { mods: { hp: 0.75, atk: -2, range: 1 }, cover: 'kin' }
  },
  wanDisciple: {
    row: 'scout',
    name: '萬門劍徒',
    role: '追劍',
    school: '荊州萬門',
    mini: 'wanDisciple',
    basic: '連步遞劍',
    bio: '萬震山念中的門下弟子。見對手傷重，出劍便更狠。',
    traits: { mods: { hp: 0.8, range: 1 }, execute: { atk: 6 }, prefers: 'wounded' }
  },
  // The troop types of the boards built round one villain (GARRISONS).
  shenLong: {
    row: 'scout',
    name: '神龍教青龍門眾',
    role: '短刃',
    school: '神龍教青龍門',
    mini: 'shenLong',
    basic: '青龍短刀',
    bio: '洪安通念中的教眾，口祝仙福，腳下已搶步向前。袖底毒藥須趁移步抹上刀口，站定接戰時反而用不上。',
    traits: { mods: { step: 3, range: 1 }, stepPoison: { power: 2, turns: 2 } }
  },
  netHand: {
    row: 'scout',
    name: '絕情谷網手',
    role: '漁網',
    school: '絕情谷',
    mini: 'netHand',
    basic: '張網罩身',
    bio: '公孫止念中的綠衣網手，腳步雖慢，網卻能撒出兩步遠。網角各繫鉛墜，一落便貼地罩住人。',
    traits: { mods: { hp: 1.15, atk: -1, step: 2, range: 2 }, snare: { power: 2, turns: 2 } }
  },
  ironPalm: {
    row: 'scout',
    name: '鐵掌幫拳手',
    role: '拳手',
    school: '鐵掌幫',
    mini: 'ironPalm',
    basic: '踏樁掌',
    bio: '裘千仞念中的幫眾，沉樁功夫練在溪石上。氣血一折半，便將餘勁沉住胸前，硬接來招。',
    traits: { mods: { hp: 1.2, def: 1, range: 1 }, lastStand: { below: 0.5, cut: 50 } }
  },
  xiaGuard: {
    row: 'scout',
    name: '西夏宮禁衛',
    role: '近衛',
    school: '西夏宮廷',
    mini: 'xiaGuard',
    basic: '護駕短刺',
    bio: '李秋水念中的禁衛，一個撥兵刃，一個趁隙進刺。兩人前後相應，落單便難尋角度。',
    traits: { mods: { hp: 1.1, def: 2, range: 1 }, pincer: { atk: 8 } }
  },
  heiMuGuard: {
    row: 'scout',
    name: '黑木崖侍衛',
    role: '游衛',
    school: '日月神教',
    mini: 'heiMuGuard',
    basic: '窄刀切腕',
    bio: '東方不敗念中的侍衛，慣獨繞花園，專切人持械的手腕。同伴一擠到身旁，刀路反而窄了。',
    traits: { mods: { step: 4, range: 1 }, lone: { atk: 8 } }
  }
};
// One line per villain and troop type, by DETAILS key: the rule each plays by, never story. The
// briefing lists them under 敵情 and 兵力.
const GISTS = {
  chief: '守在橋頭；有俠客踏入攻擊範圍或打他，才離位追擊。',
  'lieutenant-0': '守在橋尾；有俠客踏入攻擊範圍或打他，才離位追擊。',
  courier: '快劍令目標防禦降低。',
  'lieutenant-1': '同夥傷重時替他接骨續筋，回復氣血。',
  reed: '身旁弟子替他受招；貼身打中他會被化去內力。',
  'lieutenant-2': '毒焰隔三格傷人，令目標中毒。',
  snow: '一刀掃及兩旁；半血後退向藥草地調息。',
  'lieutenant-3': '守在棧口一格內，專挑傷重者。',
  qin: '存活時其餘敵人攻擊提升；受到攻擊才離開琴臺。',
  'lieutenant-4': '守在石階一格內，一掌波及兩旁。',
  peach: '蓄勢時原地不動，近身打他必遭全力還擊；半血後逆練撲人。',
  'lieutenant-5': '摺扇令目標絆足。',
  wall: '五輪穿過目標，再傷其後一人。',
  'lieutenant-6': '守在門洞一格內，專挑落單者。',
  jadeHall: '冰魄銀針令目標中毒並受內傷；專挑療傷者。',
  'lieutenant-7': '守在石頸北口一格內。',
  mirror: '出手後退開；半血後身法更快。',
  'lieutenant-8': '專挑領隊。',
  murong: '蓄勢時第一下直接攻擊被反震；星索樁立著時替他減傷。',
  'lieutenant-9': '火焰刀隔四格傷人並削去內力；專挑內力深厚者。',
  fengTiannan: '長棍令目標絆足。',
  zhaoZhong: '守在東院兩格內，受擊才離位；截腕令目標攻擊降低；專挑領隊。',
  wanYan: '令旗指處，目標防禦降低；絕技隔三格出手。',
  xianYu: '扇中藏蠱，令目標中毒；專挑傷重者。',
  wanZhen: '劍法令目標防禦降低；專挑傷重者。',
  'bow-2': '回到丁春秋身旁，替他受招。',
  'scout-2': '回到丁春秋身旁，替他受招。',
  'bow-3': '守在崖棧一格內。',
  'bow-5': '普攻令目標中毒。',
  'scout-5': '普攻令目標中毒。',
  'bow-6': '守在東牆一格內。',
  'scout-6': '移動五步。',
  'bow-8': '守在橋頭一格內。',
  'bow-9': '守在一根星索樁旁，不離位。',
  'scout-9': '守在另一根星索樁旁，不離位。',
  fiveTiger: '隔一格出棍；有俠客貼身時攻擊減弱。',
  qingShield: '守在門前不動；站在原位時受到的傷害減四成。',
  jinBow: '射程四格；兩格以內的目標打得較輕。',
  huaBlade: '相鄰的同門中，氣血較多者替對方受招。',
  wanDisciple: '對氣血不過半者出手更重；專挑傷重者。',
  hongAn: '守在臺前，受擊才下臺；擒拿手隔三格將人扯到身前，並削去內力。',
  gongSun: '單數回合使金刀，攻擊提高；雙數回合使黑劍，射程多一格；絕技令目標攻擊降低。',
  qiuRen: '踏水如平地，移動不受地形拖累；鐵掌令目標防禦降低。',
  liQiu: '掌力轉折，無視地形防禦，旁人代受不了；絕技波及身旁；專挑倚仗掩體或有人代受的人。',
  dongFang: '每次出手之後，再刺射程內另一人；飛針隔三格令目標絆足。',
  shenLong: '走動之後出手，令目標中毒；站定出手則否。',
  netHand: '隔兩格撒網，普攻令目標絆足。',
  ironPalm: '氣血不過半時，受到的傷害減半。',
  xiaGuard: '目標身旁另有黑子時，出手更重。',
  heiMuGuard: '身旁沒有同夥時，出手更重。',
  qiubai: '立在天元，有人近身或打他才離位；專挑領隊；氣血不會低於 1，任何破招對他都不成。氣血過半，兩位局主趕到他身旁，此後身旁的局主替他受招；只剩四分之一，再來三位，他退到眾人身後。'
};
// The same for a board's master as a guest on the last board, where he keeps no post, has no men
// of his own and does not change at half: only what he still does there. A master with no entry
// here is briefed by his own board's line.
const GUEST_GISTS = {
  chief: '摧心掌令目標攻擊降低。',
  courier: '快劍令目標防禦降低。',
  reed: '貼身打中他會被化去內力。',
  snow: '一刀掃及兩旁。',
  qin: '存活時其餘敵人攻擊提升。',
  peach: '蓄勢時在他攻擊範圍內打他，必遭全力還擊。',
  wall: '五輪穿過目標，再傷其後一人。',
  jadeHall: '冰魄銀針令目標中毒並受內傷；專挑療傷者。',
  mirror: '出手後退開。',
  murong: '蓄勢時第一下直接攻擊被反震。',
  hongAn: '擒拿手隔三格將人扯到身前，並削去內力。',
  gongSun: '單數回合使金刀，攻擊提高；雙數回合使黑劍，射程多一格；絕技令目標攻擊降低。',
  qiuRen: '踏水如平地，移動不受地形拖累；鐵掌令目標防禦降低。',
  liQiu: '掌力轉折，無視地形防禦，旁人代受不了；絕技波及身旁；專挑倚仗掩體或有人代受的人。',
  dongFang: '每次出手之後，再刺射程內另一人；飛針隔三格令目標絆足。'
};
// What each enemy fights with, by DETAILS key: the kind of weapon one of 無名's nine forms answers
// (破招, game.js strikeFactor). Archers and dart-throwers are answered by reach, not by this, so
// they have none (東方不敗's needles among them); nor has 完顏洪烈, who points a banner, or 求敗,
// whose twig no form answers. 公孫止 holds a sabre and a sword: he is listed by the sabre, and on
// the rounds he fights with the sword it is the sword that is answered (game.js armOf).
const ARM_NAMES = { sword: '劍', blade: '刀', pole: '長兵', mace: '短兵', soft: '軟兵', hand: '拳掌' };
const ARMS = {
  sword: ['chief', 'blade', 'lieutenant-0', 'courier', 'qin', 'mirror', 'lieutenant-8', 'scout-4', 'zhaoZhong', 'wanZhen', 'wanDisciple'],
  blade: ['scout', 'scout-0', 'lieutenant-1', 'snow', 'lieutenant-3', 'echoBlade', 'echoScout', 'scout-3', 'scout-6', 'qingShield', 'huaBlade', 'gongSun', 'shenLong', 'heiMuGuard'],
  // 長槍、大戟、棍、杖
  pole: ['peach', 'scout-5', 'fengTiannan', 'fiveTiger'],
  // 鋼鞭、鐵鐧、點穴橛、摺扇、短棍、匕首、短刺、輪
  mace: ['wall', 'lieutenant-6', 'xianYu', 'scout-1', 'scout-8', 'xiaGuard'],
  // 長索、軟鞭、拂塵、漁網
  soft: ['jadeHall', 'lieutenant-7', 'scout-7', 'scout-9', 'netHand'],
  // 拳、腳、指、掌
  hand: ['reed', 'lieutenant-2', 'lieutenant-4', 'lieutenant-5', 'murong', 'lieutenant-9', 'scout-2', 'hongAn', 'qiuRen', 'liQiu', 'ironPalm']
};
const ARM_OF = Object.fromEntries(Object.entries(ARMS).flatMap(([arm, keys]) => keys.map((key) => [key, arm])));

export { ENCOUNTERS, RANKS, GARRISONS, STATUS_POWER, SIGNATURE_RULES, VILLAIN_FORMS, VILLAINS, TROOPS, GISTS, GUEST_GISTS, ARM_NAMES, ARM_OF };
