// The game's rule words, one sentence each, and the paragraphs of the in-game guide.
//
// A rule is worded here once. The in-game guide (ui/panels.js, helpPage) and the wiki's 規則
// section both read this file. An art's or an enemy's own page still gives that art's or that
// enemy's numbers (rules/move-facts.js; enemyTraitLines in rules/game.js); a term here states the
// rule without them.
//
// When you add a mechanic, add its term here. `node tools/check-wiki.mjs` fails if an art carries
// a field, or an enemy a trait, that no term and no entry of PLAIN_FIELDS accounts for.
//
// A term: { id, name, text, ... } with one or more of these, which say who carries the rule
// (the wiki uses them to list the arts, items and enemies on the term's page):
//   art        a field of a technique (TECHNIQUES), or a test of the technique
//   form       a key of FORM_RULES; its sentence is taken from there. The other entries of
//              FORM_RULES (留隙, 收隙, 絆足, 封穴 …) are rule words too and are worded there
//   condition  a condition an art can put on someone (effectsOf / selfEffectsOf kinds)
//   item       a field of an item (ITEMS)
//   trait      a field of an enemy's traits, or a test of the traits
//   style      an enemy signature's style
//   guide      true when the in-game guide's paragraph names it
// `text` has no closing 。; the guide and the wiki add it.
import { FORM_RULES } from '../rules/form-rules.js';

const form = (id) => FORM_RULES[id][1].replace(/。$/, '');

const RULE_GROUPS = [
  {
    id: 'basics',
    title: '出招的基本',
    terms: [
      {
        id: 'counter',
        name: '還擊',
        text: '受到攻擊的一方若仍存活，且出手者在其射程內，便會還擊；還擊按普攻的五成半計算'
      },
      { id: 'safe', name: '免受還擊', art: 'safe', text: '此招出手，敵人無法還擊' },
      { id: 'pierce', name: '穿透', art: 'pierce', text: '計算傷害時無視目標一部分防禦' },
      { id: 'splash', name: '濺射', art: 'splash', text: '主目標四鄰的其他敵人也受到一部分傷害' },
      { id: 'hits', name: '連擊', art: 'hits', text: '一招分成數段，各段分別計算傷害' },
      { id: 'push', name: '擊退', art: 'push', text: '把存活的目標推開一格，背後須有空位' },
      { id: 'blink', name: '身法', art: 'blink', text: '越過障礙移至射程內可站立的空格，隨即結束行動' },
      { id: 'heal', name: '療傷', art: 'heal', text: '替友軍或自身回復氣血；內傷者所受療傷減半' },
      { id: 'aura', name: '範圍', art: 'aura', text: '效果及於目標及其周圍數格內的友軍' },
      { id: 'recover', name: '回氣', art: 'recover', text: '命中後回復自身內力' },
      { id: 'hpCost', name: '自耗氣血', art: 'hpCost', text: '施展時先扣自身氣血；氣血不足以支付時不能施展' },
      {
        id: 'brace',
        name: '待命',
        text: '未出招的俠客在回合結束時自動待命，至下一回合防禦暫時提升 4 點'
      }
    ]
  },
  {
    id: 'tempo',
    title: '出手節奏',
    icon: 'spark',
    terms: [
      { id: 'again', name: '連環', form: 'again', guide: true, text: form('again') },
      { id: 'glide', name: '回身', form: 'glide', guide: true, text: form('glide') },
      {
        id: 'order',
        name: '號令',
        art: 'order',
        guide: true,
        text: '令一位本回合已行動的同伴重新移動並出手一次'
      },
      { id: 'poised', name: '留力', art: 'poised', guide: true, text: '上一回合未曾普攻或攻擊敵人，方可施展' },
      { id: 'once', name: '壓箱', art: 'once', guide: true, text: '每局只能施展一次' },
      { id: 'cooldown', name: '調息', art: 'cooldown', guide: true, text: '施展後須隔數回合才能再用' }
    ]
  },
  {
    id: 'price',
    title: '絕技的代價',
    icon: 'danger',
    lead: '有些絕技要出招者自己付代價，至多延續到他的下一回合：',
    tail: '這是代價，不是傷病，解厄解不掉。',
    list: true, // the guide writes these as one sentence: 「露空，…；無守，…。」
    terms: [
      { id: 'recoil', name: '露空', art: 'recoil', guide: true, text: '至下回合防禦降低' },
      { id: 'openGuard', name: '無守', art: 'openGuard', guide: true, text: '至下回合不能還擊' },
      { id: 'rooted', name: '立樁', art: 'rooted', guide: true, text: '下一回合不能移動' },
      { id: 'spent', name: '曲終', art: 'spent', guide: true, text: '下一回合不能施展絕技，仍可普攻' },
      {
        id: 'backlash',
        name: '反噬',
        art: 'backlash',
        text: '每次施展積一層亂氣，第三層時自損兩成最大氣血並清空；亂氣留到發作或本局結束'
      },
      { id: 'consume', name: '轉護', art: 'consume', text: '須自身帶有護盾方可施展，施展時護盾轉給受術者' }
    ]
  },
  {
    id: 'power',
    title: '看準時機',
    terms: [
      {
        id: 'answer',
        name: '破招',
        art: 'answer',
        text: '每一式專破一路：近身、遠攻，或局主與副手。目標合於所破的一路時，倍率 ＋0.30'
      },
      { id: 'lone', name: '孤行', art: 'lone', text: '出手時四鄰沒有同伴，倍率提高' },
      {
        id: 'paired',
        name: '合璧',
        art: 'paired',
        text: '出手時有同伴相鄰，倍率提高；相鄰的是命定的那一人時更高'
      },
      {
        id: 'pairsSelf',
        name: '左右互搏',
        art: 'pairsSelf',
        text: '習得後，合璧之招孤身出手也算有同伴相鄰'
      },
      { id: 'dire', name: '黯然', art: 'dire', text: '自身氣血越少倍率越高，剩四分之一以下時最高' },
      { id: 'avenge', name: '還報', art: 'avenge', text: '上一個敵方回合曾受敵人攻擊而損血，倍率提高' },
      { id: 'execute', name: '斬殘', art: 'execute', text: '目標氣血不過半時，倍率提高' },
      { id: 'surge', name: '傾力', art: 'surge', text: '耗盡剩餘內力，耗去越多倍率越高，有上限' }
    ]
  },
  {
    id: 'guard',
    title: '護人與布陣',
    icon: 'shield',
    terms: [
      {
        id: 'cover',
        name: '代受',
        art: 'cover',
        guide: true,
        text: '至下回合，敵人對相鄰同伴的直接攻擊改由自己承受'
      },
      {
        id: 'taunt',
        name: '挑釁',
        art: 'taunt',
        guide: true,
        text: '至下回合，兩格內能攻到自己的敵人只能攻擊自己，兩格從出招後所站之處算起，預覽時棋盤會框出範圍'
      },
      {
        id: 'zone',
        name: '布陣',
        art: 'zone',
        guide: true,
        text: '以落點為中心布下五格陣勢，至下一敵方回合結束；敵人踏入即須停步，回合開始時站在陣中移動減 2，我方站在陣中防禦 ＋4'
      },
      { id: 'stance', name: '卸勁', art: 'stance', text: '至下回合受到的傷害減少，還擊改以全力' },
      { id: 'evade', name: '閃身', art: 'evade', text: '下一次受到的直接攻擊落空' },
      { id: 'redirect', name: '挪移', art: 'redirect', text: '下一次受擊傷害減半，並把一部分反震給出手者' },
      { id: 'retort', name: '後發', art: 'retort', text: '還擊不按五成半，改按此招所定的比例計算' },
      { id: 'shield', name: '護勁', condition: 'shield', text: '替受術者吸收一定傷害，到期消散；多重護勁取較強者' }
    ]
  },
  {
    id: 'condition',
    title: '附加狀態',
    icon: 'pin',
    terms: [
      { id: 'siphon', name: '吸勁', form: 'siphon', guide: true, text: form('siphon') },
      { id: 'wound', name: '內傷', art: 'wound', condition: 'wound', guide: true, text: '療傷減半，每次出手攻擊後自損氣血' },
      { id: 'daze', name: '失神', art: 'daze', condition: 'daze', guide: true, text: '失去下一次行動；局主受過後，下一回合可抵抗' },
      { id: 'disarm', name: '纏械', art: 'disarm', condition: 'disarm', guide: true, text: '攻擊降低，普攻與絕技只能攻擊相鄰一格' },
      { id: 'poison', name: '中毒', art: 'poison', condition: 'poison', text: '每回合失去氣血，到期自解' },
      { id: 'weak', name: '攻勢受挫', condition: 'weak', text: '攻擊降低，到期恢復' },
      { id: 'exposed', name: '破防', condition: 'exposed', text: '防禦降低，到期恢復' },
      { id: 'rally', name: '振奮', art: 'rally', condition: 'rally', text: '攻擊提高，到期恢復' },
      { id: 'haste', name: '輕身', art: 'haste', condition: 'haste', text: '移動提高，到期恢復' },
      { id: 'cleanse', name: '解厄', form: 'cleanse', item: 'cleanse', text: form('cleanse') }
    ]
  },
  {
    id: 'gear',
    title: '器物',
    terms: [
      {
        id: 'barbs',
        name: '反刺',
        item: 'barbs',
        text: '相鄰的敵人以攻擊或還擊打中佩者時，被倒刺扎傷，不計防禦'
      },
      { id: 'medicine', name: '服藥', text: '藥箱全隊共用。每次扣一份，不耗移動或行動，一回合內可連用' },
      { id: 'weaponForm', name: '兵器效果', text: '有些兵器替普攻或護持招式添上一種戰鬥效果，寫在各兵器的條目' }
    ]
  },
  {
    id: 'enemy',
    title: '敵方行事',
    terms: [
      {
        id: 'signature',
        name: '蓄勢',
        text: '局主與副手的絕技須先蓄勢數回合；蓄滿後保持，能出擊才施展，施展後須隔數回合再蓄。封穴時無法施展，吸勁可使它延後'
      },
      {
        id: 'post',
        name: '坐鎮',
        trait: (t) => !!t.post && t.post.tile !== 'master',
        text: '守著一格或一小片地方，不主動追擊。有的在俠客踏入攻擊範圍或受到攻擊後才離位，有的始終不離位'
      },
      {
        id: 'escort',
        name: '護駕',
        trait: (t) => t.cover === 'master' || t.post?.tile === 'master',
        text: '每回合先回到局主身旁；與局主相鄰時，俠客對局主的直接攻擊改由他承受，氣血較多者先上。波及、穿行、走勁與毒傷仍會落在局主身上'
      },
      {
        id: 'phase',
        name: '變招',
        trait: 'phase',
        text: '氣血首次降到一半時改變打法，絕技的間隔也可能改變；各人怎麼變，寫在他的條目'
      },
      {
        id: 'flee',
        name: '遁走',
        trait: (t) => !!t.phase?.flee,
        text: '變招後退往藥草地回復氣血，至限定的回合，或氣血回到一定程度為止'
      },
      {
        id: 'prefers',
        name: '偏好',
        trait: (t) => !!(t.prefers || t.phase?.prefers),
        text: '選擇目標時另有所好：傷重者、落單者、領隊、療傷者、內力深厚者，或離得最近的人'
      },
      { id: 'contact', name: '化功', trait: 'contact', text: '貼身打中他的俠客損失內力；封穴時無效' },
      { id: 'banner', name: '盟令', trait: 'banner', text: '存活時其餘敵人攻擊提高，倒下後即失效' },
      {
        id: 'mend',
        name: '續命',
        style: 'mend',
        text: '絕技不傷人：三格內有同夥氣血不足七成時替他療傷，否則以普攻出手'
      },
      {
        id: 'charged',
        name: '蓄勢反擊',
        trait: (t) => !!t.stance && t.stance.while !== 'posted',
        text: '絕技蓄滿時，在他攻擊範圍內打他必遭全力還擊；免受還擊之招與封穴除外'
      },
      {
        id: 'mirror',
        name: '借力',
        trait: 'redirect',
        style: 'mirror',
        text: '蓄勢時，第一次受到的直接攻擊全數不中，反震一半給出手者；封穴時無效'
      },
      {
        id: 'ward',
        name: '護陣',
        trait: 'ward',
        text: '存活時各替局主抵擋一部分傷害；擊倒一人，局主的護陣便弱一分'
      },
      { id: 'skirmish', name: '游擊', trait: 'glide', text: '出手後退開數步，離俠客越遠越好' },
      { id: 'venom', name: '毒手', trait: 'basicPoison', text: '普攻令目標中毒' },
      { id: 'crowded', name: '近身失準', trait: 'crowded', text: '對貼近的俠客出手或還擊時，攻擊降低' },
      { id: 'cull', name: '斬殘（敵）', trait: 'execute', text: '對氣血不過半的俠客出手或還擊時，攻擊提高' },
      {
        id: 'wall',
        name: '盾牆',
        trait: (t) => t.stance?.while === 'posted',
        text: '站在原位時受到的傷害減少；被推離原位便失去盾牆，走回後恢復'
      },
      {
        id: 'kin',
        name: '刀陣',
        trait: (t) => t.cover === 'kin',
        text: '相鄰的同袍氣血較多時，替他承受俠客的直接攻擊'
      }
    ]
  },
  {
    id: 'battle',
    title: '戰局',
    terms: [
      {
        id: 'slay',
        name: '斬將',
        kind: 'slay',
        text: '擊敗局主即勝，其餘敵人不必全滅；有兩名局主的局，兩人都倒下才算取勝'
      },
      { id: 'rout', name: '殲滅', kind: 'rout', text: '場上敵人須全數擊敗，尚未入場的援軍也算在內' },
      { id: 'loss', name: '敗退', text: '領隊倒下，或第十二回合結束仍未取勝，這一輪便結束' },
      {
        id: 'waves',
        name: '援軍',
        text: '援軍入場前一整回合先有通報，並標出入場格。有的按回合入場，有的在局主氣血首次過半後兩回合入場。入場格被佔時改落在兩格內最近的空格，都沒有空位便延後一回合。入場當回合，援軍排在敵方最後行動'
      },
      { id: 'brief', name: '軍情', text: '每局整備之前先看軍情：戰盤的佈置、主要目標、敗退條件、抽定的支線與獎勵，以及取勝後誰來應帖。敵人怎麼打、援軍何時到，要在盤上自己看出來' },
      {
        id: 'deploy',
        name: '開戰前布陣',
        text: '開戰前可在戰盤上互換兩位俠客的起陣格，或把俠客移到空著的起陣格；按「開戰」後才開始第一回合'
      },
      {
        id: 'side',
        name: '支線',
        text: '每局從該局的支線池抽出一道，達成並取勝可得獎勵：賞銀、出陣生還者各一點武學點，或武譜一卷。支線不影響勝負，也不影響俠客應帖'
      },
      { id: 'recruit', name: '應帖', text: '不是最後一局時，每勝一局便有一位尚未應帖的俠客前來，支線成敗不論' },
      { id: 'danger', name: '敵方範圍', text: '按盤面右上角的警示鈕或 D 鍵，棋盤會標出敵方下一回合可能攻到的所有地格' }
    ]
  }
];

// Fields of a technique, an item or an enemy's traits that are plain data, not rules: a name, a
// number every art has, or something its own page already shows as a figure.
const PLAIN_FIELDS = {
  // debuff and shield are carried by the terms 攻勢受挫, 破防 and 護勁 through the state they leave.
  art: ['name', 'owner', 'root', 'kind', 'tier', 'needs', 'points', 'icon', 'visual', 'basicBonus', 'desc', 'source', 'forms', 'mp', 'range', 'target', 'factor', 'gate', 'debuff', 'shield', 'price', 'stock', 'manual'],
  item: ['name', 'kind', 'owner', 'atk', 'icon', 'desc', 'forms', 'power', 'def', 'step', 'hp', 'mp'],
  // mods and sig are numbers; the rest are read by a term's own test above (護駕, 刀陣, 盾牆 …).
  trait: ['mods', 'sig', 'cover', 'stance', 'post', 'prefers']
};

const RULE_TERMS = Object.fromEntries(
  RULE_GROUPS.flatMap((group) => group.terms.map((term) => [term.id, { ...term, group: group.id }]))
);

// A group's paragraph as the in-game guide prints it: only the terms marked for the guide.
function guideParagraph(id) {
  const group = RULE_GROUPS.find((g) => g.id === id),
    terms = group.terms.filter((t) => t.guide);
  const body = group.list
    ? terms.map((t) => t.name + '，' + t.text).join('；') + '。'
    : terms.map((t) => t.name + '：' + t.text + '。').join('');
  return (group.lead || '') + body + (group.tail || '');
}

// The in-game guide: [icon, title, text]. `actionFlow` is the presentation switch of that name:
// off, the four-button bar is back and a hero waits by a button.
function guideEntries({ actionFlow = true } = {}) {
  const paragraph = (id) => {
    const group = RULE_GROUPS.find((g) => g.id === id);
    return [group.icon, group.title, guideParagraph(id)];
  };
  return [
    [
      'grid',
      '棋格與面板',
      '點地名查看目標。隊伍可分配物資與武譜，點俠客肖像可查小傳、屬性與武學樹。右上角的棋格圖示可開關地格邊線。'
    ],
    [
      'scroll',
      '一念江湖',
      '每一輪有三位俠客應帖，由你執子。十局各有局主，給一道劍意壓著心神，非戰不可；勝了，他才醒得過來。每局另有一道支線，達成並取勝另有獎賞。不是最後一局時，每勝一局便多一位同伴。每局至多五人上盤。領隊是這一輪的「眼」，倒下便結束這一輪；其他人倒下，下一局仍會回來。'
    ],
    [
      'bag',
      '通吃坊與武譜',
      '每局結束可到韋小寶的通吃坊購物。每冊武譜限授一人。受授後在「授業武譜」花點參悟，再裝入三格之一。過關與升級各得一點。戰中剛參悟的絕技可即時裝上一次。'
    ],
    [
      'people',
      '選擇俠客',
      '點選俠客腳下的底座，或在「隊伍」選擇俠客後按「操控此俠客」。青玉底座屬我方，朱紅底座屬敵方。'
    ],
    [
      'move',
      '走位與地形',
      '十局各有其形。深水、斷崖與天井沒有地格，須沿橋路繞行。指向青綠地格可預覽路線，點選後，俠客沿縱橫棋路逐格行走。可穿越友軍，遇敵軍、太湖石與茶箱須繞道。淺灘和竹林耗兩步，過木橋只耗一步。按「地形圖」查閱掩體與藥草，出招前按「撤步」可循原路返回。'
    ],
    [
      'target',
      '環視戰場',
      '拖曳可旋轉，滾輪或雙指開合可縮放。按住 Shift 拖曳可平移，觸控放大後以雙指平移。按準星可定位目前俠客，按縮放百分比可回到全圖。'
    ],
    [
      'swords',
      '攻擊與絕技',
      (actionFlow ? '移動後，或再點一次俠客，' : '打開「招式」，') +
        '選普攻或已攜帶的武學，再點目標可預覽實際傷害。射程內的敵人若仍存活便會還擊。療傷、護盾與助勢的武學施於友軍或自身，同樣先預覽再施展。'
    ],
    [
      'tree',
      '想起武學',
      '應帖而來的只是一念：俠客只帶著入門的功夫，放在武學樹的根基一行。後來所學，要在局中花武學點數一招一招想起來，越往上越近他的成名絕學。'
    ],
    paragraph('tempo'),
    paragraph('price'),
    paragraph('guard'),
    paragraph('condition'),
    [
      'people',
      '布陣',
      '開戰前可在戰盤上調換起陣格：點選一位俠客，再點另一位俠客互換位置，或點亮起的空格移過去。調好後按「開戰」或 E 開始第一回合。整備的陣位順序跟著改，下一局照此起陣。'
    ],
    [
      'flag',
      '敵援',
      '有的局會有援軍。援軍入場前一整個回合，入場處標出「援」字，戰場紀錄與地名牌也會提醒。敵方範圍開著時，金黃虛線框出援軍入場後第一手打得到的地格；這是照眼下各人的站位推算的，人一走動便會變。入場處有人佔著，援軍便從近旁入場。'
    ],
    [
      'diamond',
      '支線',
      '每局的支線在入局時抽定，「軍情」與「目標」都看得到。點了名的支線，那位俠客須出陣。達成支線並取勝，另得賞銀、武學點或武譜；支線成也好、不成也好，只要取勝，便有新俠客應帖而來。'
    ],
    [
      'end',
      '回合與養成',
      (actionFlow
        ? '每人每回合可移動一次，並出招一次。未出招的俠客在回合結束時自動待命，防禦暫時提升 4 點。'
        : '每人每回合可移動一次，並出招或待命一次。') +
        '服藥每次扣一份，可連用並保留移動與行動。領隊陣法作用於自身與兩格內的友軍。結束回合後敵方會行動。每滿 100 歷練升一級，獲 1 點武學點數。三級後出招所得歷練逐級遞減。'
    ]
  ];
}

export { RULE_GROUPS, RULE_TERMS, PLAIN_FIELDS, guideParagraph, guideEntries };
