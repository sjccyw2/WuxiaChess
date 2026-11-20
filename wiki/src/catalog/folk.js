// 江湖人物: the ferrywoman, the wandering visitor, and the traveller waiting at each stop.
import * as G from '../game-data.js';
import { cite, cites } from '../sources.js';
import { rows, speech, links, link, gameArt } from './parts.js';
import { stageLinks } from './foes.js';
import { missionLabel } from './missions.js';
import { FERRYWOMAN, TITLES } from './story.js';

function ferrywoman() {
  const t = G.MAZE_TALE;
  return {
    id: 'sang',
    name: FERRYWOMAN,
    tag: '渡船人',
    summary: t.opening[1],
    image: gameArt('npc-sang.webp'),
    sections: [
      speech('借刻鋪掌櫃', t.shop),
      speech('貨架', G.MARKET_RULES),
      speech('船上的話', t.opening[2], t.deploy),
      links('渡口紀事', [link('story', 'opening', TITLES.opening), link('story', 'ferry', TITLES.ferry)])
    ],
    sources: cites(cite(t.shop, 'src/data/maze-tale.js'))
  };
}

function visitor() {
  const v = G.VISITOR;
  return {
    id: 'zhou',
    name: v.name,
    tag: v.alias,
    summary: v.bio,
    image: gameArt(v.portrait),
    sections: [
      rows('人物誌', [
        ['原著', v.book],
        ['奇遇', v.title]
      ]),
      speech('出現與贈物', v.rules),
      links('全部對白', [link('story', 'ferry', TITLES.ferry)])
    ],
    sources: cites(cite(v.name, 'src/rules/ferry-market.js'))
  };
}

function traveller([name, caption], stage) {
  const script = G.ENCOUNTER_SCRIPT[stage];
  return {
    id: 'tale-' + stage,
    name,
    tag: '渡中人',
    summary: caption,
    image: gameArt('npc-tale-' + stage + '.webp'),
    sections: [
      speech(
        '渡客的兩種結局',
        { speaker: '接應成功', text: script.rescue },
        { speaker: '錯過接應', text: script.missed }
      ),
      links('出現地點', [...stageLinks(stage), link('missions', 'map-' + stage, missionLabel(stage))])
    ],
    sources: cites(
      cite(name, 'src/ui/company-views.js'),
      cite(script.rescue, 'src/data/encounter-script.js')
    )
  };
}

export function folk() {
  return [ferrywoman(), visitor(), ...G.taleCaptions.map(traveller)];
}
