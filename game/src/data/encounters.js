// Each board's master and lieutenant. A master is called at the moment of his obsession,
// not of insight. Stable actor IDs keep positions and health in earlier saves intact.
function adversary(name, school, book, basic, skill, style, visual, bio, mini, robe) {
  return { name, school, book, basic, skill, style, visual, bio, mini, robe };
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
      '青城掌門。為了林家的辟邪劍譜，他封過別人的歸路。他被請來的那一念，正是封路的時候：森冷一掌，壓得橋鏈咯咯作響。',
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
      '塞北明駝也在追尋辟邪劍譜。他偏守橋尾，盯著鞋印，也盯著另一頭的余滄海，誰都休想叫他替自己跑腿。',
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
      '天龍門北宗掌門扣下急報，生怕一頁舊證詞重見天日。',
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
      '昔日跌打醫生靠暗中下藥起家，如今連封信的火漆也不肯放過。',
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
      '星宿老怪要眾弟子齊聲奉承。幾十叢蘆葦跟著應和，他在喝采裡仍聽得出哪一口氣最弱。',
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
      '星宿派大弟子搶佔上風，毒焰順著中空的蘆稈游走。',
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
      '血刀門第四代掌門熟知雪下伏路，一刀掃過棧道兩側。只要自己活得成，旁人的命他不放在心上。',
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
      '血刀門僧攔路索人，借坡下冰雪遮掩刀鋒。',
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
      '五嶽盟主聽見琴簫同奏，便想到天下有人寧認朋友也不認盟令。他守在琴臺，掌間寒氣能沿斷絃侵人經脈。',
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
      '大嵩陽手替盟主守住上臺的石階，一掌落下，兩旁石座同時作響。',
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
      '西毒贏到了天下第一，卻忘了自己是誰。他伏在潮線前蓄勢；石陣能分開蛇群，緊挨的同伴卻容易被掌風一併震傷。',
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
      '白駝少主用紙扇指使群蛇，將花徑看作自家獵場。',
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
      '國師要破襄陽，立不世之功。城上一聲更鼓，城下就是幾戶人家差半步的生路。',
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
      '蒙古王子霍都拜金輪國師為師。他守住襄陽東門的輪楔，摺扇一指，專挑守城人左右為難的地方下手。',
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
      '赤練仙子拂塵掠過，玉上霜花便一一碎開。她認得苦候一句話的滋味，指間卻仍扣著冰魄銀針。',
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
      '李莫愁的徒弟守著寒玉室出口，心裡仍記得霜底下那聲求援。',
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
      '華山掌門的劍藏在君子風度之下。天街給同一面旗縫了兩層字，他每翻一次，街坊便得再猜一次該向誰行禮。',
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
      '埋在華山多年的嵩山耳目，已把天街各個出口默記在心。',
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
      '慕容博握著燕國的玉璽，一生籌謀復國。他不讓銅漏的最後一滴水落下，只盼再聽一次兒子沒說完的話。兩名守索人各繫一股星索，斷索可卸他的護勁。',
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
      '吐蕃國師曾向慕容博談起六脈神劍。舊交在漏臺重逢，明王帶著當年求書的執念，一雙手既能翻書，也能催出火焰刀。',
      'zhang',
      'sepia(.65) hue-rotate(-8deg) saturate(1.25)'
    )
  ]
];
const SIGNATURE_RULES = {
  weak: '令目標攻擊降低 3，持續至下回合。',
  exposed: '令目標防禦降低 3，持續至下回合。',
  poison: '令目標中毒，兩次毒發各損 3 氣血。',
  drain: '另外削去目標 6 點內力。',
  sweep: '相鄰的其他我方俠客也會受到四分之一傷害。'
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

export { ENCOUNTERS, SIGNATURE_RULES, VILLAIN_FORMS };
