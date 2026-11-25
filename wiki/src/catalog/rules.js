// 戰鬥規則: the game's rule words, the kinds of battle and of secondary objective, the shared
// rules of growth, and the in-game guide.
//
// The words and their sentences are the game's own (data/rule-terms.js, which the in-game guide
// reads too). Each word's page lists the arts, items and enemies that carry it, worked out from
// the game's data, so a new art with an old rule appears here without anyone listing it.
import * as G from '../game-data.js';
import { cite, cites } from '../sources.js';
import { rows, speech, links, link } from './parts.js';
import { artLink } from './skills.js';
import { foePage, stageName } from './foes.js';
import { development, sidePool } from './missions.js';
import { artTerms, itemTerms, traitTerms } from './terms.js';
import { NOTES } from './notes.js';

const FILE = 'src/data/rule-terms.js';
const STAGES = [...G.MAP_LAYOUTS.keys()];
const sentence = (text) => text + '。';
const groupPage = (group) => link('rules', 'group-' + group.id, group.title);

// Every art a hero can use: each hero's starting art, then the trees and the manuals.
const arts = () => [
  ...G.ROSTER.map((hero) => ({
    to: artLink('signature', hero),
    art: G.artFor(G.startingHero(hero), 'signature'),
    forms: G.ART_FORMS['signature:' + hero] || []
  })),
  ...Object.entries(G.TECHNIQUES).map(([id, art]) => ({ to: artLink(id), art, forms: G.ART_FORMS[id] || [] }))
];
// Every enemy entry, one per wiki page.
function enemies() {
  const pages = new Map();
  for (const key of Object.keys(G.DETAILS)) {
    if (G.ROSTER.includes(key)) continue;
    const id = foePage(key);
    if (!pages.has(id)) pages.set(id, { to: link('foes', id, G.DETAILS[key].name), details: G.DETAILS[key] });
  }
  return [...pages.values()];
}
const boardLinks = (maps) => maps.map((map) => link('missions', 'map-' + map, stageName(map)));
// The boards of a kind with objects, and what stands on each.
const objectRows = (kind) =>
  STAGES.filter((map) => G.BATTLES[map].kind === kind).map((map) => {
    const board = G.BATTLES[map],
      names = board.objects.map((o) => G.DETAILS[o.id.split('#')[0]].name);
    return [stageName(map), names.join('、') + (board.hold ? '，守到第' + G.NUMERALS[board.hold - 1] + '回合結束' : '')];
  });

// Rows a few words add to their page from numbers the game exports.
const EXTRA = {
  signature: () =>
    rows('何時施展', [
      ['局主', NOTES.bossSignature],
      ['副手', NOTES.secondSignature],
      ['續命', NOTES.mendSignature],
      ['挪移', NOTES.mirrorSignature],
      ['援軍', NOTES.waveSignature]
    ]),
  side: () =>
    rows('獎勵', [
      ['支線獎勵', NOTES.sideReward(G.REWARDS)],
      ['通關獎勵', NOTES.clearReward(G.REWARDS)]
    ]),
  // 勝負: a line for each way a board is won, and for the loss, then the round limits.
  outcome: () =>
    rows('勝負', [
      ...G.OUTCOMES.map((o) => [o.name, sentence(o.text)]),
      ['回合上限', '第' + G.NUMERALS[G.LIMIT - 1] + '回合'],
      ...G.BATTLES.flatMap((b, map) => (b.rounds ? [[G.mapLayout(map).name, '第' + G.NUMERALS[b.rounds - 1] + '回合']] : []))
    ]),
  // 守 and 破: each board's objects and, on 守, how long they must stand.
  // 破招: what each kind of weapon is, and who fights with it. Five of 無名's forms answer by
  // weapon; 破劍式, which is 令狐冲's art too, answers whoever fights at reach 1, so 劍 is listed
  // here for the enemy page only.
  answer: () =>
    rows(
      '兵刃各類',
      [
        ...Object.entries(G.ARM_NAMES).map(([arm, name]) => [
          name,
          [...new Set(Object.values(G.DETAILS).filter((d) => d.arm === arm).map((d) => d.name))].join('、')
        ]),
        ['說明', '弓手與發暗器的，由破箭式按射程來破，不列兵刃；完顏洪烈與求敗也不列。使劍的記在這裡，眼下卻沒有哪一式按「劍」來破：破劍式破的是只能攻擊相鄰的對手。']
      ]
    ),
  keep: () => rows('各局守物', objectRows('keep')),
  break: () => rows('各局破物', objectRows('break')),
  counter: () =>
    rows('例外', [
      ['代價', '付了「至下回合不能還擊」這一代價的人，至下回合不還擊；定身、閉穴的人也不還擊。'],
      ['還擊加重', '有的普攻修習後，還擊不按五成半，改按招式所寫的比例計算。']
    ])
};
// Boards a battle word, or a way of winning, applies to.
const BOARDS = {
  slay: () => STAGES.filter((map) => G.BATTLES[map].kind === 'slay'),
  rout: () => STAGES.filter((map) => G.BATTLES[map].kind === 'rout'),
  keep: () => STAGES.filter((map) => G.BATTLES[map].kind === 'keep'),
  break: () => STAGES.filter((map) => G.BATTLES[map].kind === 'break'),
  yield: () => STAGES.filter((map) => G.BATTLES[map].kind === 'yield'),
  waves: () => STAGES.filter((map) => G.BATTLES[map].waves.length)
};

function termPage(term, group, carriers) {
  const same = (t) => t.id === term.id;
  const withArt = carriers.arts.filter((a) => artTerms(a.art, a.forms).some(same)),
    withItem = Object.keys(G.ITEMS).filter((id) => itemTerms(id).some(same)),
    withTrait = carriers.enemies.filter((e) => traitTerms(e.details).some(same)),
    boards = BOARDS[term.id]?.() || [];
  return {
    id: term.id,
    name: term.name,
    tag: group.title,
    summary: sentence(term.text),
    image: null,
    // The rule itself is the page's summary; the sections say who carries it.
    sections: [
      EXTRA[term.id]?.(),
      withArt.length && links('具備此規則的武學', withArt.map((a) => a.to)),
      withItem.length && links('具備此規則的器物', withItem.map((id) => link('items', id, G.ITEMS[id].name))),
      withTrait.length && links('具備此規則的敵人', withTrait.map((e) => e.to)),
      boards.length && links('相關戰局', boardLinks(boards)),
      links('相關條目', [
        groupPage(group),
        ...[].concat(term.form ?? []).map((form) => link('skills', 'form-' + form, G.FORM_RULES[form][0] + '（戰鬥效果）')),
        term.id === 'side' && link('rules', 'group-sides', '支線種類'),
        ...(term.id === 'outcome' ? G.OUTCOMES.map((o) => link('rules', o.kind, o.name)) : [])
      ])
    ].filter(Boolean),
    sources: cites(cite(term.name, FILE))
  };
}

function groupEntry(group) {
  return {
    id: 'group-' + group.id,
    name: group.title,
    tag: '規則總覽',
    summary: group.terms.map((t) => t.name).join('、') + '。',
    image: null,
    sections: [
      rows(group.title, group.terms.map((t) => [t.name, sentence(t.text)])),
      links('各條', group.terms.map((t) => link('rules', t.id, t.name)))
    ],
    sources: cites(cite(group.title, FILE))
  };
}

// 戰鬥效果 are rule words too; each has its page in 武學總譜, listed here so they can be found.
// The plain ones (PLAIN_FIELDS.form) are not words to learn: the card says what they do.
function formsEntry() {
  const all = Object.entries(G.FORM_RULES),
    plain = all.filter(([id]) => G.PLAIN_FIELDS.form.includes(id)),
    list = all.filter(([id]) => !G.PLAIN_FIELDS.form.includes(id));
  return {
    id: 'group-forms',
    name: '戰鬥效果',
    tag: '規則總覽',
    summary: [...new Set(list.map(([, [name]]) => name))].join('、') + '。',
    image: null,
    sections: [
      rows('戰鬥效果', list.map(([, [name, rule]]) => [name, rule])),
      rows('寫在招式上的效果', plain.map(([, [name, rule]]) => [name, rule])),
      links('各條', all.map(([id, [name]]) => link('skills', 'form-' + id, name)))
    ],
    sources: cites(cite(list[0][1][0], 'src/rules/form-rules.js'))
  };
}

// One page per kind of secondary, with every board whose pool holds it.
function sides() {
  const kinds = new Map();
  for (const map of STAGES)
    for (const side of sidePool(map)) {
      if (!kinds.has(side.kind)) kinds.set(side.kind, { name: side.name, boards: [] });
      kinds.get(side.kind).boards.push({ map, ...side });
    }
  const pages = [...kinds].map(([kind, { name, boards }]) => ({
    id: 'side-' + kind,
    name,
    tag: '支線',
    summary: boards[0].detail,
    image: null,
    sections: [
      rows('各局的條件與獎勵', boards.map((b) => [stageName(b.map), b.detail + '獎勵：' + b.reward + '。'])),
      speech('達成時的紀事', G.SIDE_TALES[kind] || G.SIDE_TALES.done),
      links('相關條目', [...boardLinks(boards.map((b) => b.map)), link('rules', 'side', G.RULE_TERMS.side.name)])
    ],
    sources: cites(cite(name, 'src/rules/journey.js'), cite('const BATTLES', 'src/data/battles.js'))
  }));
  const index = {
    id: 'group-sides',
    name: '支線種類',
    tag: '規則總覽',
    summary: sentence(G.RULE_TERMS.side.text),
    image: null,
    sections: [
      rows('支線種類', pages.map((p) => [p.name, p.summary])),
      links('各條', pages.map((p) => link('rules', p.id, p.name)))
    ],
    sources: cites(cite('const SIDE_KINDS', 'src/rules/journey.js'))
  };
  return [index, ...pages];
}

// One page for each way a board is won and for the loss: the lines of 勝負.
function outcomes() {
  const term = G.RULE_TERMS.outcome;
  return G.OUTCOMES.map((o) => ({
    id: o.kind,
    name: o.name,
    tag: term.name,
    summary: sentence(o.text),
    image: null,
    sections: [
      EXTRA[o.kind]?.(),
      BOARDS[o.kind] && links('相關戰局', boardLinks(BOARDS[o.kind]())),
      links('相關條目', [link('rules', term.id, term.name), groupPage(G.RULE_GROUPS.find((g) => g.id === 'battle'))])
    ].filter(Boolean),
    sources: cites(cite(o.name, FILE))
  }));
}

// Rule words a guide paragraph is about, by the paragraph's title.
const GUIDE_TERMS = { 軍情: ['outcome'], 敵援: ['waves'], 支線: ['side'], 回合與養成: ['brace', 'medicine'] };
// A word the guide lists: a term's page, or a 戰鬥效果's in 武學總譜; 點穴, its three steps.
const wordLinks = (w) =>
  w.steps
    ? w.steps.flatMap(wordLinks)
    : [G.RULE_TERMS[w.id] ? link('rules', w.id, w.name) : link('skills', 'form-' + w.forms[0], w.name)];
// The in-game guide, paragraph by paragraph, and its line of keys. Outside a battle it lists the
// first tier (基本規則) and every other word (其餘規則); in one, 本局所見 comes between them.
function guide() {
  const pages = G.guideEntries().map(([, title, body, list], i) => ({
    id: 'guide-' + (i + 1),
    name: title,
    tag: '操作指南',
    summary: body,
    image: null,
    sections: [
      speech('指南原文', body),
      links('相關條目', [
        ...G.RULE_GROUPS.filter((g) => g.title === title).map(groupPage),
        ...(GUIDE_TERMS[title] || []).map((id) => link('rules', id, G.RULE_TERMS[id].name)),
        ...(list ? list.words.flatMap(wordLinks) : []),
        link('rules', 'keys', '按鍵')
      ])
    ],
    sources: cites(cite(title, FILE))
  }));
  // 「<kbd>1</kbd>–<kbd>4</kbd> 招式 <kbd>G</kbd> 棋格」: runs of keys, each followed by what they do.
  const keys = [...(G.flowHotkeys + G.extraHotkeys()).matchAll(/((?:<kbd>[^<]*<\/kbd>[–\s]*)+)([^<]+)/g)].map(
    ([, run, label]) => [label.trim(), run.replace(/<\/?kbd>/g, '').trim()]
  );
  return [
    ...pages,
    {
      id: 'keys',
      name: '按鍵',
      tag: '操作指南',
      summary: keys.map(([label, key]) => key + ' ' + label).join('、') + '。',
      image: null,
      sections: [rows('鍵盤', keys), links('相關條目', pages.filter((p) => p.name === '敵援').map((p) => link('rules', p.id, '敵方範圍')))],
      sources: cites(cite('<kbd>E</kbd> 結束回合', 'src/ui/action-flow.js'))
    },
    // The one-character marks beside a piece on the board, and the state each stands for; a mark
    // with an arrow in its corner is written 「攻（升）」.
    {
      id: 'signs',
      name: '棋子上的記號',
      tag: '操作指南',
      summary: Object.keys(G.STATUS_SIGNS).map(G.signLabel).join('、') + '。',
      image: null,
      sections: [
        rows(
          '記號',
          Object.keys(G.STATUS_SIGNS).map((kind) => [G.signLabel(kind), G.CONDITION_NAMES[kind] || G.RULE_TERMS.zone.name])
        ),
        // The states that hold a piece also change how it looks on the board.
        rows(
          '棋上的樣貌',
          Object.entries(G.STATUS_LOOKS).map(([kind, look]) => [G.CONDITION_NAMES[kind], look])
        ),
        links('相關條目', [groupPage(G.RULE_GROUPS.find((g) => g.id === 'condition')), link('rules', 'group-forms', '戰鬥效果')])
      ],
      sources: cites(cite('const STATUS_SIGNS', 'src/actors/tokens.js'), cite('const STATUS_LOOKS', 'src/actors/tokens.js'))
    }
  ];
}

export function rules() {
  const carriers = { arts: arts(), enemies: enemies() };
  return [
    ...G.RULE_GROUPS.map(groupEntry),
    formsEntry(),
    ...G.RULE_GROUPS.flatMap((group) => group.terms.map((term) => termPage(term, group, carriers))),
    ...outcomes(),
    ...sides(),
    development(),
    ...guide()
  ];
}
