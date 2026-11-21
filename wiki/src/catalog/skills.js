// 武學總譜: every technique in the game.
//
// Numbers are not stored here. Each page asks the game's own moveFacts() to describe the
// technique for a plain baseline fighter (attack 30, no equipment, no leader bonus), which
// is the same text the game shows in battle.
import * as G from '../game-data.js';
import { cite, cites } from '../sources.js';
import { rows, speech, links, link, cells, gameArt } from './parts.js';
import { heroPortrait } from './heroes.js';
import { stageName, troopIds, troopSource, troopArt, RANKS } from './foes.js';
import { trialOf } from './missions.js';
import { NOTES } from './notes.js';

export const BASELINE_ATTACK = 30;
const TARGETS = { basic: '普攻', enemy: '敵軍', ally: '友軍', self: '自身', ground: '空地', passive: '被動' };
const SLOT = { basic: '普攻槽', art: '佔一個絕技槽，最多攜帶三招', root: '習成即生效' };
const heroFile = (id) => (G.NEW_HEROES[id] ? 'src/data/new-heroes.js' : 'src/rules/game.js');

// A hero stripped to the comparison baseline, alone on the first map.
function baseline(heroId) {
  const unit = { ...G.startingHero(heroId), atk: BASELINE_ATTACK, weapon: null, gear: null, learned: [] };
  return { unit, state: { units: [unit], mapIndex: 0, round: 1 } };
}
function facts(heroId, id) {
  const { unit, state } = baseline(heroId);
  return G.moveFacts(state, unit, id);
}
const share = (part) => Math.round(part * 100) + '%';
// `art` is the game's definition of the technique, when it has one beyond a plain attack.
const figures = (f, art) =>
  rows('招式數值', [
    [f.powerLabel, f.powerText],
    ['對象', TARGETS[f.kind]],
    f.kind !== 'passive' && ['距離', cells(f.range)],
    f.kind !== 'passive' && ['內力', f.mp],
    f.hpCost && ['氣血消耗', f.hpCost],
    f.factor && ['攻擊倍率', '× ' + f.factor],
    art?.hits && ['連擊分段', art.hits.map(share).join(' ＋ ')],
    f.effectLines.length && ['招式效果', f.effectLines.join('。')]
  ]);
const triggers = (f) => f.formRules.length && speech('招式觸發條件與效果', f.formRules);
const motion = (f) => f.animation && speech('招式動作', f.animation);
const ownerLink = (id) => links('所屬俠客', [link('heroes', id, G.DETAILS[id].name)]);

// A catalog link for an art id as the game writes it ('signature:hero', 'force', 'breakSword').
export function artLink(id, owner) {
  if (id === 'signature') return link('skills', 'signature-' + owner, G.DETAILS[owner].skill);
  if (id.startsWith('signature:')) return artLink('signature', id.slice(10));
  if (G.TALENTS[id]) return link('skills', id, G.TALENTS[id].name);
  return link('skills', id, G.TECHNIQUES[id].name);
}

function starting(heroId) {
  const d = G.DETAILS[heroId],
    basic = facts(heroId, 'basic'),
    signature = facts(heroId, 'signature'),
    known = (slot) => rows('參悟條件', [['層級', '起手即會'], ['武學點', 0], ['來源', d.name + '專屬'], ['攜帶', slot]]),
    sources = cites(cite(d.name, heroFile(heroId)));
  return [
    {
      id: 'basic-' + heroId,
      name: d.basic,
      tag: '基礎普攻',
      summary: basic.shortEffect,
      image: heroPortrait(heroId),
      sections: [figures(basic), known(SLOT.basic), ownerLink(heroId)],
      sources
    },
    {
      id: 'signature-' + heroId,
      name: d.skill,
      tag: '天生絕技',
      summary: d.skillDesc,
      image: heroPortrait(heroId),
      sections: [figures(signature, G.artFor(baseline(heroId).unit, 'signature')), known(SLOT.art), triggers(signature), motion(signature), ownerLink(heroId)].filter(Boolean),
      sources
    }
  ];
}

function learned([id, art]) {
  const manual = !!G.TRADE_MANUALS[id],
    owner = art.owner,
    f = facts(owner || G.PARTY[0], id),
    trial = trialOf(art);
  return {
    id,
    name: art.name,
    tag: manual ? '授譜武學' : art.kind === 'basic' ? '普攻進階' : '門派武學',
    summary: art.desc,
    image: manual ? gameArt('guide-cover.webp') : heroPortrait(owner),
    sections: [
      figures(f, art),
      rows('參悟條件', [
        ['層級', art.tier + ' 階'],
        ['武學點', art.points],
        ['來源', manual ? NOTES.manualSource : G.DETAILS[owner].name + '專屬'],
        trial && ['歷練門檻', trial],
        ['攜帶', art.kind === 'basic' ? SLOT.basic : SLOT.art]
      ]),
      triggers(f),
      art.needs?.length && links('先修武學', art.needs.map((need) => artLink(need, owner))),
      trial && links('解鎖任務', [link('missions', 'trial-' + id, trial)]),
      art.source && speech('武學淵源', art.source),
      motion(f),
      manual ? links('對應武譜', [link('items', 'guide-' + id, '《' + art.name + '》')]) : ownerLink(owner)
    ].filter(Boolean),
    sources: cites(cite(art.name, 'src/data/mastery-catalog.js'))
  };
}

function root(id) {
  const f = facts(G.PARTY[0], id);
  return {
    id,
    name: f.name,
    tag: '根基心法',
    summary: G.TALENTS[id].desc,
    image: null,
    sections: [
      figures(f),
      rows('參悟條件', [['層級', '共三重'], ['武學點', '每重 1 點'], ['來源', '全體俠客'], ['攜帶', SLOT.root]])
    ],
    sources: cites(cite(f.name, 'src/rules/game.js'))
  };
}

// When a villain's signature comes: the board's ordinary rule, or a mend's or a mirror's own;
// then a phase that changes how often, and the reach it strikes with.
function signatureTrigger(art, seat, phase) {
  const base = art.style === 'mirror' ? NOTES.mirrorSignature : art.style === 'mend' ? NOTES.mendSignature : seat ? NOTES.secondSignature : NOTES.bossSignature;
  return base + (phase?.cadence ? NOTES.phaseCadence(phase.cadence) : '');
}
function opponent(stage, seat) {
  const foe = G.ENCOUNTERS[stage][seat],
    unitId = seat ? 'lieutenant-' + stage : G.CAPTAINS[stage][0],
    // At the first stage the board can be met at; the numbers that grow with the stage are on
    // the opponent's own page (行事).
    art = G.enemyTechnique({ id: unitId }, { run: { stage: G.mapStages(stage)[0] } }),
    image = gameArt((seat ? 'lieutenant-' : 'captain-') + stage + '.webp'),
    where = [link('foes', 'enc-' + stage + '-' + seat, foe.name), link('maps', stage, stageName(stage))];
  return [
    {
      id: 'foe-' + stage + '-' + seat,
      name: art.name,
      tag: '敵方絕技',
      summary: art.note,
      image,
      sections: [
        rows('施展規則', [
          ['使用者', foe.name],
          ['位階', G.NUMERALS[art.tier - 1] + '階'],
          ['觸發', signatureTrigger(art, seat, foe.traits?.phase)],
          // A mend or a mirror is no blow: it has no strength against the normal strike.
          art.strikes && ['普攻傷害倍率', '× ' + art.factor],
          art.reach && ['絕技射程', art.reach + ' 格'],
          [art.strikes ? '附加效果' : '效果', art.note]
        ]),
        links('關聯', where)
      ],
      sources: cites(cite(foe.name, 'src/data/encounters.js'), cite('function roundsToSignature', 'src/rules/game.js'))
    },
    {
      id: 'foe-' + stage + '-' + seat + '-basic',
      name: foe.basic,
      tag: '敵方普攻',
      summary: foe.name + '的通常攻擊。',
      image,
      sections: [rows('招式資料', [['使用者', foe.name], ['門派', foe.school]]), links('交手地點', where)],
      sources: cites(cite(foe.name, 'src/data/encounters.js'))
    }
  ];
}

function troop(id) {
  const d = G.DETAILS[id];
  return {
    id: 'foe-' + id,
    name: d.basic,
    tag: '敵方普攻',
    summary: d.name + '的通常攻擊。',
    image: troopArt(id),
    sections: [links('使用者', [link('foes', id, d.name)])],
    sources: cites(cite(d.name, troopSource(id)))
  };
}

function form([id, [name, rule]]) {
  const arts = Object.entries(G.ART_FORMS).filter(([, forms]) => forms.includes(id)),
    weapons = Object.entries(G.WEAPON_FORMS).filter(([, forms]) => forms.includes(id));
  return {
    id: 'form-' + id,
    name,
    tag: '戰鬥效果',
    summary: rule,
    image: null,
    sections: [
      speech('規則', rule),
      links('具備此效果的武學', arts.map(([art]) => artLink(art))),
      links('具備此效果的兵器', weapons.map(([item]) => link('items', item, G.ITEMS[item].name)))
    ],
    sources: cites(cite(name, 'src/rules/form-rules.js'))
  };
}

function combination(combo, i) {
  return {
    id: 'combination-' + (i + 1),
    name: combo.name,
    tag: '戰術配合',
    summary: combo.text,
    image: null,
    sections: [
      links('出招', combo.skills.map((art) => artLink(art))),
      links('兵器', combo.weapons.map((item) => link('items', item, G.ITEMS[item].name)))
    ],
    sources: cites(cite(combo.name, 'src/data/form-catalog.js'))
  };
}

export function skills() {
  return [
    ...G.PARTY.flatMap(starting),
    ...Object.entries(G.TECHNIQUES).map(learned),
    ...Object.keys(G.TALENTS).map(root),
    ...G.ENCOUNTERS.flatMap((pair, stage) => pair.flatMap((_, seat) => opponent(stage, seat))),
    ...troopIds().map(troop),
    ...Object.entries(G.FORM_RULES).map(form),
    ...G.COMBINATIONS.map(combination)
  ];
}
