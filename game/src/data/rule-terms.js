// The game's rule words, one sentence each, and the paragraphs of the in-game guide.
//
// A rule is worded here once. The in-game guide (ui/panels.js, helpPage) and the wiki's 規則
// section both read this file. An art's or an enemy's own page still gives that art's or that
// enemy's numbers (rules/move-facts.js; enemyTraitLines in rules/game.js); a term here states the
// rule without them.
//
// When you add a mechanic, add its term here, or, if one art, item or enemy carries it and it
// leaves no state of its own to track, list its field in PLAIN_FIELDS and have the card say the
// rule in a plain sentence: a word is kept only if the player meets it often (the producer,
// Q-N132 and Q-N152). `node tools/check-wiki.mjs` fails if an art carries a field, or an enemy a
// trait, that no term and no entry of PLAIN_FIELDS accounts for.
//
// A term: { id, name, text, ... } with one or more of these, which say who carries the rule
// (the wiki uses them to list the arts, items and enemies on the term's page):
//   art        a field of a technique (TECHNIQUES), a list of fields, or a test of the technique
//   form       a key of FORM_RULES (or a list); its sentence may be taken from there. The other
//              entries of FORM_RULES (破綻, 截勁, 牽引 …) are rule words too and are worded there,
//              except PLAIN_FORMS, whose card prints a plain sentence
//   condition  a condition an art can put on someone (effectsOf / selfEffectsOf kinds), or a list
//   item       a field of an item (ITEMS)
//   trait      a field of an enemy's traits, or a test of the traits
//   style      an enemy signature's style
// `text` has no closing 。; the guide and the wiki add it.
//
// The in-game guide teaches the words in tiers (Q-N152): FIRST_TIER below first, as the basics;
// then, in a battle, only the other words something on the board carries (rules/rule-words.js);
// the rest one tap away, under 其餘規則.
import { FORM_RULES, PLAIN_FORMS } from '../rules/form-rules.js';

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
      {
        id: 'splash',
        name: '濺射',
        art: 'splash',
        form: 'line',
        text: '主目標四鄰的其他敵人也受到一部分傷害；寫明兩格、三格的，主目標該距離之內的其他敵人都受波及；寫明身後的，沿出招的橫直穿過主目標，及於其後兩格內第一名敵人'
      },
      { id: 'push', name: '擊退', art: 'push', text: '把存活的目標推開一格，背後須有空位；去路受阻則推不動，首段威力 ＋7' },
      { id: 'heal', name: '療傷', art: 'heal', text: '替友軍或自身回復氣血；內傷者所受療傷減半' },
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
      { id: 'again', name: '連環', form: 'again', text: form('again') },
      { id: 'glide', name: '回身', form: 'glide', text: form('glide') }
    ]
  },
  {
    id: 'price',
    title: '絕技的代價',
    icon: 'danger',
    terms: [
      {
        id: 'cost',
        name: '代價',
        art: ['recoil', 'openGuard', 'rooted', 'spent'],
        text: '有些絕技要出招者自己付出代價，至多延續到他的下一回合：防禦降低、不能還擊、不能移動，或不能施展絕技（仍可普攻），招式上寫明是哪一種。棋子上這個記號帶一把鎖：這不是傷病，解厄解不掉'
      },
      {
        id: 'backlash',
        name: '亂氣',
        art: 'backlash',
        text: '每次施展積一層，第三層時自損兩成最大氣血並清空；亂氣留到發作或本局結束'
      }
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
        text: '每一式專破一路：近身、遠攻、局主與副手，或一類兵刃（刀、長兵、短兵、軟兵、拳掌）。目標合於所破的一路時，倍率 ＋0.30'
      },
      {
        id: 'paired',
        name: '合璧',
        art: 'paired',
        text: '出手時有同伴相鄰，倍率提高；相鄰的是命定的那一人時更高。有的招式只認那一人'
      }
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
        text: '至下回合，敵人對相鄰同伴的直接攻擊改由自己承受'
      },
      {
        id: 'taunt',
        name: '挑釁',
        art: 'taunt',
        text: '至下回合，兩格內能攻到自己的敵人只能攻擊自己，兩格從出招後所站之處算起，預覽時棋盤會框出範圍'
      },
      {
        id: 'zone',
        name: '布陣',
        art: 'zone',
        text: '以落點為中心布下五格陣勢，至下一敵方回合結束；敵人踏入即須停步，回合開始時站在陣中移動減 2，我方站在陣中防禦 ＋4'
      },
      { id: 'stance', name: '卸勁', art: 'stance', text: '至下回合受到的傷害減少，還擊改以全力' },
      { id: 'evade', name: '閃身', art: 'evade', text: '下一次受到的直接攻擊落空' },
      { id: 'redirect', name: '挪移', art: 'redirect', text: '下一次受擊傷害減半，並把一部分反震給出手者' },
      { id: 'shield', name: '護盾', condition: 'shield', text: '替受術者吸收一定傷害，到期消散；多重護盾取較強者' },
      {
        id: 'immune',
        name: '金剛',
        art: 'immune',
        condition: 'immune',
        text: '至所定的敵方回合結束，敵人的攻擊、還擊與波及都傷不了受術者，也附不上狀態；毒傷與自身的代價照舊'
      }
    ]
  },
  {
    id: 'condition',
    title: '附加狀態',
    icon: 'pin',
    terms: [
      { id: 'wound', name: '內傷', art: 'wound', condition: 'wound', text: '療傷減半，每次出手攻擊後自損氣血' },
      { id: 'disarm', name: '纏械', art: 'disarm', condition: 'disarm', text: '攻擊降低，普攻與絕技只能攻擊相鄰一格' },
      { id: 'freeze', name: '定身', art: 'freeze', condition: 'freeze', text: '數回合不能移動、出手、施展絕技或還擊；局主只受一回合，下一回合可抵抗' },
      { id: 'mute', name: '閉穴', art: 'mute', condition: 'mute', text: '數回合不能出手、施展絕技或還擊，仍可移動；局主只受一回合，下一回合可抵抗' },
      {
        id: 'charm',
        name: '受制',
        art: 'charm',
        condition: 'charm',
        text: '尋常敵人倒戈數個敵方回合，走向最近的同夥以普攻出手；我方不攻擊他，他仍算敵人。局主與副手不受制，改為定身一回合'
      },
      { id: 'poison', name: '中毒', art: 'poison', condition: 'poison', text: '每回合失去氣血，到期自解' },
      {
        id: 'shift',
        name: '升降',
        art: ['rally', 'haste', 'fortify'],
        condition: ['weak', 'exposed', 'rally', 'haste', 'fortify'],
        form: 'pin',
        text: '有些招式讓攻擊、防禦或移動升降數回合，到期恢復；同一種取較強者。振奮、固守、輕身是升，攻勢受挫、破防、絆足是降。棋子上的記號寫攻、防、移，角上三角朝上是升，朝下是降；降的可用解厄解去'
      },
      { id: 'cleanse', name: '解厄', form: 'cleanse', item: 'cleanse', text: form('cleanse') }
    ]
  },
  {
    id: 'gear',
    title: '器物',
    terms: [
      {
        id: 'barbs',
        name: '反震',
        item: 'barbs',
        form: 'riposte',
        text: '打中自己的敵人反受其傷：軟蝟甲扎傷以攻擊或還擊打中佩者的相鄰敵人，不計防禦；有的護持招式讓受術者把本回合首次所受的直接傷害震回出手者，有上限'
      },
      { id: 'medicine', name: '服藥', text: '藥箱全隊共用。每次扣一份，不耗移動或行動，一回合內可連用。交戰中只能服藥：兵器、護具與武譜只在整備時更換' }
    ]
  },
  {
    // The leader boons (rules/battle-mastery.js COMMANDS). Each hero's own is on his page, in a line
    // that carries its whole rule; this is the rule all of them share.
    id: 'lead',
    title: '領隊陣法',
    icon: 'flag',
    terms: [
      {
        id: 'command',
        name: '領隊陣法',
        text: '每位俠客領隊時各有一種陣法，作用於自身與兩格內的友軍；軟筋餘香反過來削弱領隊兩格內的敵人。領隊倒下，陣法即失效；整備時按各人的起陣格計算'
      }
    ]
  },
  {
    // What many enemies share. Everything else an enemy does is a sentence on its own page
    // (enemyTraitLines in rules/game.js), not a word to learn (Q-N152, P1).
    id: 'enemy',
    title: '敵方行事',
    terms: [
      {
        id: 'signature',
        name: '蓄勢',
        text: '局主與副手的絕技須先蓄勢數回合；蓄滿後保持，能出擊才施展，施展後須隔數回合再蓄。截勁時無法施展；有的招式可使它延後一回合'
      },
      {
        id: 'post',
        name: '坐鎮',
        trait: (t) => !!t.post && t.post.tile !== 'master',
        text: '守著一格或一小片地方，不主動追擊。有的在俠客踏入攻擊範圍或受到攻擊後才離位，有的始終不離位'
      },
      {
        id: 'phase',
        name: '變招',
        trait: 'phase',
        text: '氣血首次降到一半時改變打法，絕技的間隔也可能改變；各人怎麼變，寫在他的條目'
      }
    ]
  },
  {
    id: 'battle',
    title: '戰局',
    terms: [
      {
        id: 'outcome',
        name: '勝負',
        text: '每局的勝法寫在軍情裡：斬將，擊敗局主；殲滅，擊敗全部敵人，援軍也算；守，守住守物；破，擊毀全部破物；問劍，把終局對面那人的氣血削至 1 點。領隊倒下，或回合用盡仍未取勝，便是敗退'
      },
      {
        id: 'waves',
        name: '援軍',
        text: '援軍事先不會寫在軍情裡。入場前一整回合才有通報，並標出入場格。有的按回合入場，有的在局主氣血首次過半後兩回合入場。入場格被佔時改落在兩格內最近的空格，都沒有空位便延後一回合。入場當回合，援軍排在敵方最後行動'
      },
      {
        id: 'side',
        name: '支線',
        text: '每局從該局的支線池抽出一道，是韋小寶另開的盤口。達成並取勝可得獎勵：賞銀、出陣生還者各 1 武學點，或武譜一卷。支線不影響勝負，也不影響俠客入局'
      }
    ]
  }
];

// 勝負, line by line: each kind of board (`kind` in data/battles.js) and the loss. The wiki gives
// each its own page under 勝負; the briefing states the board's own.
const OUTCOMES = [
  { kind: 'slay', name: '斬將', text: '擊敗局主即勝，其餘敵人不必全滅；有兩名局主的局，兩人都倒下才算取勝' },
  { kind: 'rout', name: '殲滅', text: '場上敵人須全數擊敗，尚未入場的援軍也算在內' },
  {
    kind: 'keep',
    name: '守',
    text: '盤上有一件我方的東西（守物），黑子要毀它。守到該局指定的回合結束，或擊敗局主，便勝；守物一毀，這一局便輸。守物不行動、不還擊，推不動，也不受招式附帶之效'
  },
  {
    kind: 'break',
    name: '破',
    text: '戰意釘在盤上的東西（破物）上。把破物盡數擊毀便勝，局主倒不倒都一樣。破物不還擊、不閃避，招式的附帶之效與波及都不及其身'
  },
  {
    kind: 'yield',
    name: '問劍',
    text: '終局的打法。對面的人不敗，不會倒下；把他的氣血削至 1 點便勝，其餘的人不必擊敗。無名是這一局的眼，他倒下便輸'
  },
  { kind: 'loss', name: '敗退', text: '領隊倒下，或第十二回合結束仍未取勝，這一輪便結束；無刻漏臺寬限到第十五回合' }
];

// Fields of a technique, an item or an enemy's traits that are plain data, not rules: a name, a
// number every art has, or something its own page already shows as a figure; and the mechanics
// folded out of the glossary (Q-N132, Q-N152), which the card, the item or the enemy's page states
// in a plain sentence of its own (rules/move-facts.js, enemyTraitLines in rules/game.js).
const PLAIN_FIELDS = {
  // debuff and shield are carried by the terms 升降 and 護盾 through the state they leave;
  // radius is the reach of a 濺射, which that term's sentence covers.
  art: [
    ...['name', 'family', 'owner', 'root', 'kind', 'tier', 'needs', 'points', 'icon', 'visual', 'basicBonus', 'desc', 'source', 'forms', 'mp', 'range', 'target', 'factor', 'gate', 'debuff', 'shield', 'price', 'stock', 'manual', 'radius'],
    // Folded: 連擊, 身法, 範圍, 回氣, 吸元, 自耗氣血, 號令, 留力, 壓箱, 調息, 轉護, 傾力, 後發,
    // 孤行, 黯然, 還報, 斬殘.
    ...['hits', 'blink', 'aura', 'recover', 'drain', 'hpCost', 'order', 'poised', 'once', 'cooldown', 'consume', 'surge', 'retort', 'lone', 'dire', 'avenge', 'execute']
  ],
  item: ['name', 'kind', 'owner', 'atk', 'icon', 'desc', 'forms', 'power', 'def', 'step', 'hp', 'mp'],
  // mods and sig are numbers; post is read by 坐鎮's test. The rest are one enemy's way each,
  // told on its own page.
  trait: ['mods', 'sig', 'cover', 'stance', 'post', 'prefers', 'contact', 'banner', 'redirect', 'ward', 'glide', 'basicPoison', 'crowded', 'execute', 'flurry', 'bend', 'pull', 'fleet', 'twin', 'lone', 'pincer', 'stepPoison', 'lastStand', 'snare', 'unfelled', 'formless', 'withdraw'],
  // 戰鬥效果 whose name is a plain phrase (rules/form-rules.js PLAIN_FORMS).
  form: [...PLAIN_FORMS]
};

const RULE_TERMS = Object.fromEntries(
  RULE_GROUPS.flatMap((group) => group.terms.map((term) => [term.id, { ...term, group: group.id }]))
);

// The 戰鬥效果 that are rule words (破綻, 截勁, 牽引): the forms of FORM_RULES that are neither plain
// (PLAIN_FORMS) nor a term's own. One word per name, worded by its forms' rules.
const termForms = new Set(RULE_GROUPS.flatMap((g) => g.terms.flatMap((t) => [].concat(t.form ?? []))));
const FORM_WORDS = [];
for (const [key, [name, rule]] of Object.entries(FORM_RULES)) {
  if (PLAIN_FORMS.has(key) || termForms.has(key)) continue;
  const word = FORM_WORDS.find((w) => w.name === name);
  if (word) word.forms.push(key);
  else FORM_WORDS.push({ id: key, name, forms: [key], text: '' });
  (word || FORM_WORDS.at(-1)).text += rule;
}
for (const word of FORM_WORDS) word.text = word.text.replace(/。$/, '');

// Every word the in-game guide can name, by id: the terms, then the 戰鬥效果 that are words.
// `group` is the title it is listed under among 其餘規則.
const GUIDE_WORDS = [
  ...RULE_GROUPS.flatMap((g) => g.terms.map((t) => ({ id: t.id, name: t.name, text: t.text, group: g.title }))),
  ...FORM_WORDS.map((w) => ({ id: w.id, name: w.name, text: w.text, group: '戰鬥效果', forms: w.forms }))
];
const WORD = Object.fromEntries(GUIDE_WORDS.map((w) => [w.id, w]));

// The first tier (Q-N152, T1): the words of the first boards, shown first in the guide as the
// basics and named by the first board's tutorial where it reaches them (data/tutorial-text.js).
// 點穴 is one idea in three steps, each heavier than the last: 截勁 (a 戰鬥效果), 閉穴, 定身.
const FIRST_TIER = [
  'counter',
  'safe',
  'splash',
  'push',
  'heal',
  'brace',
  'again',
  { id: 'acupoint', name: '點穴', text: '截勁、閉穴、定身是點穴的三步，一步重過一步', steps: ['seal', 'mute', 'freeze'] },
  'poison',
  'shield',
  'command',
  'outcome'
].map((entry) => (typeof entry === 'string' ? WORD[entry] : { ...entry, steps: entry.steps.map((id) => WORD[id]) }));
// The ids of the words in the first tier, the steps of 點穴 included.
const FIRST_TIER_IDS = new Set(FIRST_TIER.flatMap((w) => (w.steps ? w.steps.map((step) => step.id) : [w.id])));

// Words as one paragraph: 「名：句。」, a ladder's steps after it.
const wordsText = (words) =>
  words.map((w) => w.name + '：' + w.text + '。' + (w.steps ? wordsText(w.steps) : '')).join('');

// The in-game guide: [icon, title, text, words?]. `actionFlow` is the presentation switch of that
// name: off, the four-button bar is back and a hero waits by a button.
//
// The rule words come first (Q-N152): 基本規則, the first tier; in a battle, 本局所見, the other
// words something on the board carries (`carried`, a set of word ids from rules/rule-words.js);
// and 其餘規則, the rest, under the titles of their groups. An entry of words has a fourth part,
// { lead, words, grouped }, for a page that lists them one by one; its text is the lead and the
// same words as one paragraph.
function guideEntries({ actionFlow = true, carried = null } = {}) {
  const others = GUIDE_WORDS.filter((w) => !FIRST_TIER_IDS.has(w.id)),
    shown = carried ? others.filter((w) => carried.has(w.id)) : [],
    rest = others.filter((w) => !shown.includes(w));
  const words = (ic, title, list, lead = '', grouped = false) => [ic, title, lead + wordsText(list), { lead, words: list, grouped }];
  return [
    words('book', '基本規則', FIRST_TIER, '頭幾局就會遇上的規則。'),
    ...(shown.length ? [words('eye', '本局所見', shown, '這一局盤上的招式、器物、敵人或狀態帶著的規則。')] : []),
    words('scroll', '其餘規則', rest, carried ? '這一局盤上沒有人帶著的規則，留著備查。' : '', true),
    [
      'grid',
      '棋格與面板',
      '點地名查看目標。隊伍可分配物資與武譜，點俠客肖像可查小傳、屬性與武學樹。右上角的棋格圖示可開關地格邊線。'
    ],
    [
      'scroll',
      '一念江湖',
      '你在夢裡同求敗對弈。每一輪開局抓五枚白子，留下三枚，三位俠客入局，由你執子。十局各有局主，給求敗的一道戰意壓著心神，非戰不可；勝了，他才醒得過來。白子勝滿十局，放還本尊。每局另有一道支線，是韋小寶另開的盤口，達成並取勝另有獎賞。不是最後一局時，每勝一局，求敗便再借出一位同伴。每局至多五人上盤。領隊是這一輪的「眼」，倒下便結束這一輪；其他人倒下，下一局仍會回來。'
    ],
    [
      'bag',
      '通吃坊與武譜',
      '每局結束可到韋小寶的通吃坊購物。每冊武譜限授一人。受授後在「授業武譜」花武學點修習，再裝入三格之一。過關與升級各得一點。戰中剛修習的絕技可即時裝上一次。'
    ],
    [
      'people',
      '選擇俠客',
      '點選戰盤上的俠客，點身上或腳下的底座都行；或在「隊伍」選擇俠客後按「操控此俠客」。青玉底座屬我方，朱紅底座屬敵方。棋子重疊時，在同一處再點一下，改選後面的一位。'
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
        '選普攻或已攜帶的武學，再點目標可預覽實際傷害。選好招式之後，戰盤才標出它的射程。按住一招不放，或以滑鼠指著，可看它的完整效果。射程只算橫直，斜角不算相鄰；點到射程外的敵人，戰盤上會說明原因，再點一次才查探敵情。' +
        (actionFlow
          ? '還沒走位就選了招式，按招式表的「走位」或點一下空地，可回到走位。'
          : '還沒移動就選了招式，按「移動」或點一下空地，可回到移動。') +
        '射程內的敵人若仍存活便會還擊。療傷、護盾與助勢的武學施於友軍或自身，同樣先預覽再施展。'
    ],
    [
      'tree',
      '想起武學',
      '俠客入局時只帶著手上最熟的一招，放在武學樹的根基一行。其餘的招式要花武學點一招一招修習，越往上越近他的成名絕學。成名的那一招排在最後，並帶著代價。'
    ],
    [
      'scroll',
      '軍情',
      '每局整備之前先看軍情：戰盤的佈置、這一局的勝法與敗退條件、抽定的支線與獎勵，以及取勝後求敗借出哪一位俠客。敵人怎麼打、援軍何時到，要在盤上自己看出來。'
    ],
    [
      'people',
      '起陣',
      '開戰前可在戰盤上調換起陣格：點選一位俠客，再點另一位俠客互換位置，或點亮起的空格移過去。調好後按「開戰」，或按 E、Enter，開始第一回合。整備的陣位順序跟著改，下一局照此起陣。'
    ],
    [
      'flag',
      '敵援',
      '求敗在局中也落子：棋臺上「嗒」的一聲，下一回合援軍便到。援軍入場前一整個回合，入場處標出「援」字，戰場紀錄與地名牌也會提醒。入場處有人佔著，援軍便從近旁入場。按盤面右上角的警示鈕或 D 鍵，棋盤標出敵方下一回合可能攻到的所有地格（敵方範圍）；開著時，金黃虛線另框出援軍入場後第一手打得到的地格。這是照眼下各人的站位推算的，人一走動便會變。'
    ],
    [
      'diamond',
      '支線',
      '每局的支線在入局時抽定，是韋小寶另開的盤口，「軍情」與「目標」都看得到。點了名的支線，那位俠客須出陣。達成支線並取勝，另得賞銀、武學點或武譜；支線成也好、不成也好，只要取勝，求敗便再借出一位尚未入局的俠客，等級與上陣諸人相近，並帶著相應的武學點；最後一局之後不再借。'
    ],
    [
      'end',
      '回合與養成',
      (actionFlow
        ? '每人每回合可移動一次，並出招一次。未出招的俠客在回合結束時自動待命，防禦暫時提升 4 點。'
        : '每人每回合可移動一次，並出招或待命一次。') +
        '服藥每次扣一份，可連用並保留移動與行動。領隊陣法作用於自身與兩格內的友軍，也有削弱兩格內敵人的；領隊倒下即失效。結束回合後敵方會行動。每滿 100 歷練升一級，獲 1 武學點。三級後出招所得歷練逐級遞減。每勝一局，場下的俠客也得歷練，補上與上陣諸人差距的一半。'
    ]
  ];
}

export { RULE_GROUPS, RULE_TERMS, OUTCOMES, PLAIN_FIELDS, FORM_WORDS, GUIDE_WORDS, FIRST_TIER, FIRST_TIER_IDS, guideEntries };
