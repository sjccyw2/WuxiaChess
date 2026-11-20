// Each board's master and lieutenant. They did not answer an invitation: they were set
// down as black stones, and something from outside the board makes them fight. Stable actor
// IDs keep positions and health in earlier saves intact.
//
// `traits` is how one villain differs from another (SPEC-mechanics §7.1):
//   mods     { hp: multiplier, atk: added, def: added, step: set, range: set } on the stage numbers
//   sig      { reach, power, turns, cadence, extra: 'pin' | 'line' | 'wound', heal } for the signature
//   post, phase, prefers, stance, redirect, contact, cover, banner, glide, basicPoison
// A villain without traits plays exactly as before the redesign.
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
      ''
    ),
    adversary(
      '木高峰',
      '塞北明駝',
      '笑傲江湖',
      '駝劍',
      '駝峰毒霧',
      'poison',
      'duan',
      '塞北明駝，也在追尋辟邪劍譜。他與余滄海素來不和，此刻卻給同一道劍意按在橋尾，駝杖想收也收不回來。',
      'bandit',
      'sepia(.22)'
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
      'sepia(.38) saturate(.8)'
    ),
    adversary(
      '閻基',
      '閻府',
      '飛狐外傳',
      '奪手刀',
      '毒砂掌',
      'poison',
      'guard',
      '昔日的跌打醫生，靠暗中下藥起家。他搭得出自己沒有中藥，卻說不出心裡那個「戰」字是誰擱的。',
      'bandit',
      'hue-rotate(15deg) saturate(.7)'
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
      'sepia(.22) hue-rotate(85deg)'
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
      'hue-rotate(55deg) saturate(.8)'
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
      'sepia(.25) hue-rotate(-30deg) saturate(1.4)'
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
      'sepia(.4) saturate(1.15)'
    )
  ],
  [
    adversary(
      '左冷禪',
      '嵩山派',
      '笑傲江湖',
      '嵩山劍法',
      '寒冰真氣',
      'weak',
      'duan',
      '嵩山掌門、五嶽盟主，每出一掌都先算過值與不值。這一掌沒有算，寒氣已到掌心，能沿斷絃侵人經脈。',
      'chief',
      'saturate(.48) hue-rotate(135deg)'
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
      'sepia(.32) hue-rotate(-12deg)'
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
      'sepia(.15) hue-rotate(28deg)'
    ),
    adversary(
      '歐陽克',
      '白駝山',
      '射鵰英雄傳',
      '靈蛇拳',
      '靈蛇拳法',
      'poison',
      'guard',
      '白駝山少主。他明白心裡那個念頭不是自己的主意，摺扇卻照樣指使群蛇。',
      'duan',
      'sepia(.2) saturate(.6)'
    )
  ],
  [
    adversary(
      '金輪國師',
      '蒙古國師',
      '神鵰俠侶',
      '五輪大轉',
      '龍象般若功',
      'sweep',
      'guo',
      '蒙古國師，立功只肯憑自己的五隻輪子。此刻有一股勁道推著他動手，他不認這是自己的本意。五輪一轉，身旁的人也受波及。',
      'guo',
      'sepia(.65) saturate(1.3)'
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
      'sepia(.25) hue-rotate(-32deg)'
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
      'sepia(.4) hue-rotate(-43deg) saturate(1.45)'
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
      'sepia(.32) hue-rotate(26deg)'
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
      'hue-rotate(-48deg) saturate(.7)'
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
      'sepia(.2) hue-rotate(55deg)'
    )
  ],
  [
    adversary(
      '慕容博',
      '姑蘇慕容',
      '天龍八部',
      '參合指',
      '斗轉星移',
      'sweep',
      'duan',
      '姑蘇慕容氏，半生躲在暗處撥弄旁人相鬥，如今自己成了旁人盤上的一枚子。兩股星索從盤外垂下，繫在他身上；兩名守索人各守一股，斷索可卸他的護勁。',
      'murong',
      ''
    ),
    adversary(
      '鳩摩智',
      '大輪明王',
      '天龍八部',
      '小無相功',
      '火焰刀',
      'drain',
      'guo',
      '吐蕃國師，大輪明王，遍覽天下武學。壓在心頭的那道劍意不在任何一部經上，他身不由己，卻又捨不得它走。一雙手既能翻書，也能催出火焰刀。',
      'zhang',
      'sepia(.65) hue-rotate(-8deg) saturate(1.25)'
    )
  ]
];
// The rank and file of each board, by board: { bow: {...}, scout: {...} }, each with the fields
// of a DETAILS entry (name, role, school, mini, basic, bio) and optionally `traits` (only `mods`,
// `post`, `cover`, `prefers`, `basicPoison` and `glide` apply to them). A board left empty keeps
// the shared 黑子 pieces.
const RANKS = Array.from({ length: 10 }, () => ({}));
// How strong a signature's status is at each stage of the run. At stage 0 these are the numbers
// every villain used before the redesign.
const STATUS_POWER = {
  weak: (stage) => 3 + Math.floor(stage / 2),
  exposed: (stage) => 3 + Math.floor(stage / 2),
  poison: (stage) => 3 + stage,
  drain: (stage) => 6 + 2 * stage,
  sweep: () => 0
};
const lasting = (turns) => (turns === 2 ? '持續至下回合。' : '持續 ' + turns + ' 回合。');
const SIGNATURE_RULES = {
  weak: ({ power, turns }) => '令目標攻擊降低 ' + power + '，' + lasting(turns),
  exposed: ({ power, turns }) => '令目標防禦降低 ' + power + '，' + lasting(turns),
  poison: ({ power, turns }) =>
    '令目標中毒，' + (turns === 2 ? '兩' : turns) + '次毒發各損 ' + power + ' 氣血。',
  drain: ({ power }) => '另外削去目標 ' + power + ' 點內力。',
  sweep: () => '相鄰的其他我方俠客也會受到四分之一傷害。'
};

// Damage is measured against the same foe's normal strike after the target's defenses.
const VILLAIN_FORMS = {
  摧心掌: [1.16, 'breakPalm'],
  駝峰毒霧: [1.04, 'blackNeedle'],
  天龍快劍: [1.25, 'breakSword'],
  毒砂掌: [1.07, 'silkwormPalm'],
  化功大法: [1.03, 'northernSea'],
  星宿毒焰: [1.09, 'holyFireTurn'],
  血刀奇襲: [1.29, 'bloodAtPass'],
  血刀連斬: [1.18, 'foxTwinChange'],
  寒冰真氣: [1.12, 'lesserMarsh'],
  大嵩陽神掌: [1.22, 'vacantFist'],
  蛤蟆功: [1.33, 'toadLunge'],
  靈蛇拳法: [1.06, 'beggarBind'],
  龍象般若功: [1.39, 'flyingDragon'],
  狂風迅雷功: [1.14, 'foxFeint'],
  冰魄銀針: [1.08, 'iceSoulNeedle'],
  赤練掌法: [1.15, 'softPalm'],
  辟邪劍法: [1.32, 'shangYang'],
  嵩山快劍: [1.21, 'snowPursuit'],
  斗轉星移: [1.43, 'universeCanopy'],
  火焰刀: [1.27, 'tideBreaker']
};

export { ENCOUNTERS, RANKS, STATUS_POWER, SIGNATURE_RULES, VILLAIN_FORMS };
