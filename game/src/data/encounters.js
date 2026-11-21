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
//   ward     the share (percent) a living rank-and-file piece takes off its master's blows
// A `note` is the villain's own words for the enemy page; {tile} is the post's tile. A villain
// without traits plays exactly as before the redesign.
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
      '青城派掌門，為林家的辟邪劍譜結下滿門血仇。他給落在橋頭，心裡只剩一個念頭：誰上橋便打誰。森冷一掌，能壓低對手的攻勢。',
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
      '塞北明駝，也在追尋辟邪劍譜。他與余滄海素來不和，此刻卻給同一道戰意按在橋尾，駝杖想收也收不回來。',
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
      '天龍門北宗掌門，一生不打沒有把握的仗。這一回由不得他，兩隻腳自己往前走。快劍專破對手的守勢。',
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
      '昔日的跌打醫生，靠暗中下藥起家。他搭得出自己沒有中藥，卻說不出心裡那個「戰」字是誰擱的。逼他動手的是戰意；同夥傷了，替人接骨續筋，卻是他自己的老本行。',
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
      '星宿老怪，向來只有他化旁人的功。他認得出心裡那個念頭不是自己的，偏偏掙不開，化功大法照舊削人內力。',
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
      '星宿派大弟子，只當師父是自己要大展神威。毒焰順著中空的蘆稈游走。',
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
      '血刀門第四代掌門，一生只打划算的架。他試過不理心裡那個念頭，三回都是刀先動，索性放手去砍。一刀掃過棧道兩側。',
      'hu',
      'sepia(.25) hue-rotate(-30deg) saturate(1.4)',
    {
      mods: { atk: 2, def: -2, step: 3, range: 1 },
      sig: { sweep: 0.33 },
      phase: {
        name: '遁走',
        flee: { turns: 3, herbs: 0.08, until: 0.75 },
        log: '血刀老祖刀勢一收，踏雪往藥草地退去。打到半醒，他那本算盤回來了：先養傷，再砍人。',
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
      '血刀門僧。他同來人無冤無仇，刀卻自己出了鞘，借坡下冰雪遮掩刀鋒。',
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
      '嵩山掌門、五嶽盟主，每出一掌都先算過值與不值。這一掌沒有算，寒氣已到掌心，能沿斷絃侵人經脈。',
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
      '大嵩陽手，替盟主守住上臺的石階。催他動手的聲音不是掌門的號令，卻比號令更難違抗。一掌落下，兩旁石座同時作響。',
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
        log: '歐陽鋒逆運經脈，狀若瘋狂。他醒了一半，醒過來的卻是那個瘋了的自己。',
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
      '白駝山少主。他明白心裡那個念頭不是自己的主意，摺扇卻照樣指使蛇奴，一撥一撥從桃溪趕將上來。',
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
      '蒙古國師，立功只肯憑自己的五隻輪子。此刻有一股勁道推著他動手，他不認這是自己的本意。五輪一轉，身旁的人也受波及。',
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
      '蒙古王子，拜金輪國師為師，向來見勢不妙便走。今日兩條腿給釘在門洞裡，只好摺扇一指，專挑對手的弱處下手。',
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
      '赤練仙子殺人，向來為的是心裡那個人。這一回連恨都不是她自己的，指間卻仍扣著冰魄銀針。',
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
      '李莫愁的徒弟，守著寒玉室的出口。她不想動手，心裡的聲音卻催得她放不下拂塵。',
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
      '華山掌門，人稱君子劍，與人動手向來先佔一個「理」字。今日無理可佔，劍已出鞘，專破對手的守勢。',
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
        log: '岳不群撕下君子面目，身形快得看不清。打到半醒，君子劍底下的那個人先露了出來。',
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
      '埋在華山多年的嵩山耳目，聽慣了兩頭的號令。心裡這一個，兩頭都不是。',
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
      '姑蘇慕容氏，半生躲在暗處撥弄旁人相鬥，如今自己成了旁人盤上的一枚子。兩股星索從盤外垂下，繫在他身上；兩名守索人各守一股，斷索可卸他的護勁。',
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
      '吐蕃國師，大輪明王，遍覽天下武學。壓在心頭的那道戰意不在任何一部經上，他身不由己，卻又捨不得它走。一雙手既能翻書，也能催出火焰刀。',
      'zhang',
      'sepia(.65) hue-rotate(-8deg) saturate(1.25)',
    { sig: { reach: 4 }, prefers: 'mp' }
    )
  ]
];
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
      bio: '繫住一股星索的人。索不斷，慕容博的護勁不散。',
      traits: { post: { tile: 'spawn', tether: 1, wake: false, note: '守在索樁一格內，不離位。' }, ward: 35 }
    },
    scout: {
      name: '守索人',
      role: '護陣',
      school: '姑蘇慕容',
      mini: 'bandit',
      basic: '星索',
      bio: '繫住另一股星索的人。',
      traits: { post: { tile: 'spawn', tether: 1, wake: false, note: '守在索樁一格內，不離位。' }, ward: 35 }
    }
  }
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
      '相鄰的其他我方俠客也會受到' + (SHARES[Math.round(1 / sweep)] || '') + '分之一傷害。',
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
  唐詩劍法: [1.2, 'snowPursuit']
};

// The villains added to the existing boards (battles.js). `rank` 'boss' is a 局主, 'mini' a 副手;
// `row` the stage row their numbers come from (game.js stageRows); `map` the one board each
// stands on. Their bios are placeholders that say who they are and how they fight, no story.
const VILLAINS = {
  fengTiannan: {
    map: 0,
    rank: 'mini',
    row: 'lieutenant',
    ...adversary('鳳天南', '佛山五虎門', '飛狐外傳', '五虎棍', '橫棍封橋', 'pin', 'guard',
      '佛山五虎門掌門，霸著一個鎮，離了自己的地頭從不出頭。今日給落在一處不相干的渡口，手中長棍自己橫了過來，專絆人腳步。', 'fengTiannan', '', { mods: { step: 3 } })
  },
  zhaoZhong: {
    map: 1,
    rank: 'mini',
    row: 'lieutenant',
    ...adversary('張召重', '武當派・清廷', '書劍恩仇錄', '武當劍術', '凝碧截腕', 'weak', 'hero',
      '武當出身的清廷武官，上頭有令方才動手。壓著他的這一道令沒有印信，他竟也照辦了，守著東院，專尋為首之人，一劍截其手腕。', 'zhaoZhong', '', {
        mods: { def: 2, step: 3 },
        prefers: 'leader',
        post: { tile: 'spawn', tether: 2, wake: 'struck', note: '守在東院{tile}兩格內；受到攻擊後才離位。' }
      })
  },
  wanYan: {
    map: 6,
    rank: 'mini',
    row: 'lieutenant',
    ...adversary('完顏洪烈', '金國趙王府', '射鵰英雄傳', '王府侍從截擊', '趙府令旗', 'exposed', 'guo',
      '金國趙王，一生延攬豪傑，為的是他的國家。他從不親自衝陣；今日令旗自己舉了起來，指著誰，弓手便射誰。', 'wanYan', '', { mods: { hp: 0.9, atk: -2 }, sig: { reach: 3 } })
  },
  xianYu: {
    map: 8,
    rank: 'boss',
    row: 'master',
    ...adversary('鮮于通', '華山派', '倚天屠龍記', '摺扇點穴', '金蠶蠱毒', 'poison', 'duan',
      '華山派掌門，人稱神機子，動手之前必先留下後著。今日連後著也來不及佈，只剩摺扇中的蠱毒，專尋已受傷的人下手。', 'xianYu', '', {
        mods: { hp: 0.7, def: -2, step: 3, range: 1 },
        prefers: 'wounded'
      })
  },
  wanZhen: {
    map: 9,
    rank: 'mini',
    row: 'lieutenant',
    ...adversary('萬震山', '荊州萬門', '連城訣', '萬門劍式', '唐詩劍法', 'exposed', 'hero',
      '荊州萬門的師父。他夜夜夢遊，人睡著了，手自己起來砌牆；給戰意按著動手，於他並不希奇。劍招專向傷重之人招呼。', 'wanZhen', '', { mods: { def: 1 }, prefers: 'wounded' })
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
    bio: '鳳天南念中的門徒。仗著人多棍長，隔一步出手最準，給人貼身便施展不開。',
    traits: { mods: { step: 3, range: 2 }, crowded: { within: 1, atk: 6 } }
  },
  qingShield: {
    row: 'scout',
    name: '清營刀盾兵',
    role: '刀盾',
    school: '清營',
    mini: 'qingShield',
    basic: '抵盾短刀',
    bio: '張召重念中的營兵。持盾執刀守住門口，站在原位方成一堵牆，離了位便護不住自己。',
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
    bio: '完顏洪烈念中的王府弓手。瞧著令旗放箭，隔得遠方才射得準，給人逼近便失了準頭。',
    traits: { mods: { range: 4 }, crowded: { within: 2, atk: 8 } }
  },
  huaBlade: {
    row: 'scout',
    name: '華山刀陣弟子',
    role: '陣刀',
    school: '華山派',
    mini: 'huaBlade',
    basic: '合步斜刀',
    bio: '鮮于通念中的華山弟子。兩人一組，合使刀法，並肩之時互相補位。',
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
  murong: '蓄勢時第一下直接攻擊被反震；守索人存活時替他減傷。',
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
  'bow-9': '存活時替慕容博減傷三成半。',
  'scout-9': '存活時替慕容博減傷三成半。',
  fiveTiger: '隔一格出棍；有俠客貼身時攻擊減弱。',
  qingShield: '守在門前不動；站在原位時受到的傷害減四成。',
  jinBow: '射程四格；兩格以內的目標打得較輕。',
  huaBlade: '相鄰的同門中，氣血較多者替對方受招。',
  wanDisciple: '對氣血不過半者出手更重；專挑傷重者。'
};

export { ENCOUNTERS, RANKS, STATUS_POWER, SIGNATURE_RULES, VILLAIN_FORMS, VILLAINS, TROOPS, GISTS };
