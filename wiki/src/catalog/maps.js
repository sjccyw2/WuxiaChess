// 十局輿圖: each battlefield, drawn from the game's layout tables.
import * as G from '../game-data.js';
import { cite, cites } from '../sources.js';
import { rows, links, link, wikiArt } from './parts.js';
import { stageName } from './foes.js';
import { missionLabel } from './missions.js';

const LAST = G.MAP_LAYOUTS.length - 1;
const orderOf = (stage) => (stage === 0 ? '第一局' : stage === LAST ? '最後一局' : '中間的局，次序每輪不同');
const point = ({ x, y }) => ({ x, y });

function map(stage) {
  const layout = G.mapLayout(stage),
    types = G.terrainTypes(stage),
    [boss, second] = G.ENCOUNTERS[stage],
    mission = G.mapMission(stage);
  const counts = new Map();
  for (const cell of layout.cells) counts.set(cell.kind, (counts.get(cell.kind) || 0) + 1);
  const standable = layout.cells.filter((c) => Number.isFinite(G.tileInfo(c.x, c.y, stage)?.cost));
  return {
    id: String(stage),
    name: layout.name,
    tag: layout.shapeName,
    summary: layout.tactic,
    image: wikiArt('map-' + stage + '.webp'),
    sections: [
      rows('輿圖', [
        ['形制', layout.shapeName],
        ['邊界', layout.width + ' × ' + layout.height],
        ['盤內地格', layout.cells.length],
        ['可站立', standable.length],
        ['次序', orderOf(stage)]
      ]),
      {
        title: '地形與位置',
        map: {
          width: layout.width,
          height: layout.height,
          cells: layout.cells.map((c) => ({ x: c.x, y: c.y, kind: c.kind })),
          allies: layout.allies.map(point),
          enemies: layout.enemies.map(point),
          objective: mission.tile ? point(mission.tile) : null,
          legend: Object.fromEntries(Object.entries(types).map(([kind, t]) => [kind, t.name]))
        }
      },
      rows(
        '地形手冊',
        [...counts].map(([kind, n]) => [types[kind].name + ' · ' + n + ' 格', types[kind].note])
      ),
      links('人物與任務', [
        link('foes', 'enc-' + stage + '-0', boss.name),
        link('foes', 'enc-' + stage + '-1', second.name),
        link('missions', 'map-' + stage, missionLabel(stage)),
        link('story', 'map-' + stage, stageName(stage) + '對白')
      ])
    ],
    sources: cites(
      cite(layout.name, 'src/data/terrain.js'),
      cite(G.ENCOUNTER_SCRIPT[stage].before[0].text, 'src/data/encounter-script.js')
    )
  };
}

export function maps() {
  return G.MAP_LAYOUTS.map((_, stage) => map(stage));
}
