// 任務簿: the side objective of each ferry stop, each hero's capstone trial, and the
// shared rules of growth.
import * as G from '../game-data.js';
import { cite, cites } from '../sources.js';
import { rows, speech, links, link, wikiArt } from './parts.js';
import { heroPortrait } from './heroes.js';
import { stageName } from './foes.js';
import { NOTES } from './notes.js';

const STAGES = G.MAP_LAYOUTS.map((_, stage) => stage);

export const missionLabel = (stage) => G.mapMission(stage).name;

function stageMission(stage) {
  const m = G.mapMission(stage);
  return {
    id: 'map-' + stage,
    name: stageName(stage) + ' · ' + m.name,
    tag: '支線',
    summary: m.instruction,
    image: wikiArt('map-' + stage + '.webp'),
    sections: [
      rows('勝負與獎勵', [
        ['勝利', m.win],
        ['敗退', m.loss],
        ['支線', m.instruction],
        ['支線獎勵', NOTES.sideReward(G.REWARDS)],
        ['通關獎勵', NOTES.clearReward(G.REWARDS)]
      ]),
      speech('支線紀事', G.SIDE_TALES[m.goal]),
      links('同局條目', [
        link('maps', stage, stageName(stage)),
        link('foes', 'enc-' + stage + '-0', m.boss),
        link('story', 'map-' + stage, stageName(stage) + '對白')
      ])
    ],
    sources: cites(
      cite('function mapMission', 'src/rules/journey.js'),
      cite('function settle', 'src/rules/journey.js')
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

function development() {
  const growth = G.GROWTH;
  return {
    id: 'development',
    name: '回合、歷練與武學點',
    tag: '戰鬥規則',
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
    ...Object.entries(G.MASTERY_ARTS).filter(([, art]) => art.gate).map(trial),
    development()
  ];
}
