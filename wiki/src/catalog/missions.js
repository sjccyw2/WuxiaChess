// 任務簿: each board's battle (how it is won, who is on it, its pool of secondaries) and each
// hero's capstone trial. The shared rules of growth are a page of 戰鬥規則 (rules.js).
import * as G from '../game-data.js';
import { cite, cites } from '../sources.js';
import { rows, speech, links, link, wikiArt } from './parts.js';
import { heroPortrait } from './heroes.js';
import { stageName, namedOn, foeLink } from './foes.js';
import { NOTES } from './notes.js';

const STAGES = G.MAP_LAYOUTS.map((_, stage) => stage);

// A board's secondary is drawn per run from its pool, so the board's entry is its 支線 page.
export const missionLabel = () => '支線';
const sideTale = (kind) => G.SIDE_TALES[kind] || G.SIDE_TALES.done;

// A secondary as its board states it. Where the hero is drawn at the start of the run, the
// game's own sentence is asked for with a stand-in hero, whose name is then replaced.
const DRAWN = '抽定的一位出陣俠客';
export function sideText(map, entry) {
  const kind = G.SIDE_KINDS[entry.kind],
    standIn = G.PARTY[0],
    side = entry.hero === '*' ? { ...entry, hero: standIn } : entry;
  const detail = kind.detail(null, side, map);
  return entry.hero === '*' ? detail.replaceAll(G.DETAILS[standIn].name, DRAWN) : detail;
}
// The secondaries a board's pool holds: { kind, name, detail, reward }.
export function sidePool(map) {
  const stage = G.mapStages(map)[0],
    named = G.boardBrief(map, stage).pool; // the same entries, in the same order, with their names
  return G.BATTLES[map].sides.map((entry, i) => ({
    kind: entry.kind,
    name: named[i].name,
    detail: sideText(map, entry),
    reward: G.rewardText(entry, stage)
  }));
}

function stageMission(stage) {
  const m = G.boardBrief(stage, G.mapStages(stage)[0]),
    pool = sidePool(stage);
  return {
    id: 'map-' + stage,
    name: stageName(stage) + ' · ' + m.kindName,
    tag: '戰局',
    summary: m.battle,
    image: wikiArt('map-' + stage + '.webp'),
    sections: [
      rows('勝負與獎勵', [
        ['勝利', m.win],
        ['敗退', m.loss],
        ['兵力', m.force.line],
        ...(m.waves.length ? m.waves.map((w) => ['援軍', w.line]) : [['援軍', m.noWaves]]),
        ['通關獎勵', NOTES.clearReward(G.REWARDS)]
      ]),
      rows('敵方', [
        ...m.foes.map((f) => [f.rank + ' · ' + f.name, f.gist || NOTES.noGist]),
        ...m.force.chips.map((c) => [c.name + ' × ' + c.count, c.gist || NOTES.noGist])
      ]),
      rows('支線（每輪抽出一道）', [
        ...pool.map((side) => [side.name, side.detail + '獎勵：' + side.reward + '。']),
        ['支線獎勵', NOTES.sideReward(G.REWARDS)]
      ]),
      speech('支線紀事', ...[...new Set(pool.map((side) => sideTale(side.kind)))]),
      links('同局條目', [
        link('maps', stage, stageName(stage)),
        ...namedOn(stage).map(foeLink),
        link('rules', m.kind, m.kindName),
        ...pool.map((side) => link('rules', 'side-' + side.kind, side.name)),
        link('story', 'map-' + stage, stageName(stage) + '對白')
      ])
    ],
    sources: cites(
      cite('function boardModel', 'src/rules/journey.js'),
      cite('function settle', 'src/rules/journey.js'),
      cite('const BATTLES', 'src/data/battles.js')
    )
  };
}

// A trial as the game states it, without a particular hero's progress.
function trialText(gate) {
  const text =
    gate.metric === 'side'
      ? stageName(gate.map) + ' · ' + missionLabel(gate.map) + '（出戰並生還）'
      : G.GATE_LABELS[gate.metric] + ' ' + gate.atLeast;
  return gate.or ? text + '，或' + trialText(gate.or) : text;
}
export const trialOf = (art) => (art.gate ? trialText(art.gate) : '');

function trial([id, art]) {
  const text = trialText(art.gate),
    hero = art.owner;
  return {
    id: 'trial-' + id,
    name: art.name + ' · 歷練',
    tag: '俠客試煉',
    summary: text,
    image: heroPortrait(hero),
    sections: [
      rows('參悟條件', [
        ['歷練', text],
        ['階位', art.tier],
        ['武學點', art.points]
      ]),
      links('解鎖對象', [
        link('heroes', hero, G.DETAILS[hero].name),
        link('skills', id, art.name),
        art.gate.metric === 'side' &&
          link('missions', 'map-' + art.gate.map, missionLabel(art.gate.map))
      ])
    ],
    sources: cites(cite(art.name, 'src/data/mastery-catalog.js'))
  };
}

// What one level adds, measured by asking the game to raise a blank hero.
function levelGain(fromLevel) {
  const unit = { ...G.startingHero(G.PARTY[0]), level: fromLevel },
    before = { ...unit };
  G.raiseLevel(unit, 1);
  return {
    atk: unit.atk - before.atk,
    def: unit.def - before.def,
    hp: unit.maxHp - before.maxHp,
    mp: unit.maxMp - before.maxMp
  };
}

export function development() {
  const growth = G.GROWTH;
  return {
    id: 'development',
    name: '回合、歷練與武學點',
    tag: '養成',
    summary: NOTES.levelling(growth),
    image: null,
    sections: [
      rows('俠客成長', [
        ['二、三級', NOTES.levelGain(levelGain(1))],
        ['四級起', NOTES.levelGain(levelGain(growth.seasoned)) + NOTES.reserveGrowth],
        ['出招歷練', NOTES.actionXp(growth)],
        ['戰中參悟', NOTES.midBattleStudy],
        ['後段敵情', NOTES.lateFoes]
      ])
    ],
    sources: cites(
      cite('function raiseLevel', 'src/rules/game.js'),
      cite('function enemyAct', 'src/rules/game.js'),
      cite('function defenders', 'src/rules/journey.js')
    )
  };
}

export function missions() {
  return [
    ...STAGES.map(stageMission),
    ...Object.entries(G.MASTERY_ARTS).filter(([, art]) => art.gate).map(trial)
  ];
}
