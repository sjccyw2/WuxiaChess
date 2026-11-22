// 棋局輿圖: each battlefield, drawn from the game's layout tables.
import * as G from '../game-data.js';
import { cite, cites } from '../sources.js';
import { rows, links, link, wikiArt } from './parts.js';
import { stageName, namedOn, foeLink, extraPieces } from './foes.js';
import { missionLabel } from './missions.js';

// The tenth board is the last of the ten a run shuffles; the last board (終局) follows it in 無劍境界.
const orderOf = (stage) =>
  stage === G.LAST_MAP ? '終局：無劍境界十局皆勝之後' : stage === 0 ? '第一局' : stage === G.LAST_MAP - 1 ? '第十局，十局之末' : '中間的局，次序每輪不同';
const point = ({ x, y }) => ({ x, y });

function map(stage) {
  const layout = G.mapLayout(stage),
    types = G.terrainTypes(stage);
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
          enemies: [
            ...layout.enemies.map(point),
            ...extraPieces(stage).filter((e) => !e.wave).map((e) => ({ x: e.piece.at[0], y: e.piece.at[1] }))
          ],
          entries: extraPieces(stage).filter((e) => e.wave).map((e) => ({ x: e.piece.at[0], y: e.piece.at[1], place: e.wave.place })),
          objective: G.BATTLES[stage].sides.some((side) => side.kind === 'lamp') ? point(layout.objective) : null,
          legend: Object.fromEntries(Object.entries(types).map(([kind, t]) => [kind, t.name]))
        }
      },
      rows(
        '地形手冊',
        [...counts].map(([kind, n]) => [types[kind].name + ' · ' + n + ' 格', types[kind].note])
      ),
      links('人物與任務', [
        ...namedOn(stage).map(foeLink),
        link('missions', 'map-' + stage, '戰局與' + missionLabel(stage)),
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
