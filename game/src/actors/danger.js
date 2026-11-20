// Danger zone: every tile an enemy could strike on its coming turn, shaded on the board.
// Follows what the enemy turn itself does: walk to any tile it may end on (G.standCells), then
// strike within range (a due signature's own range when it has one).
import { POLISH } from '../polish.js';
import * as G from '../rules/game.js';

const SIDES = [
  [0, -1, 0, 1], // the neighbour at (dx, dy) shares the edge between corners a and b
  [1, 0, 1, 2],
  [0, 1, 2, 3],
  [-1, 0, 3, 0]
];
let memo = { mark: '', tiles: new Set() };

function dangerTiles(s) {
  const alive = s.units.filter(G.living);
  const mark =
    s.mapIndex +
    '|' +
    alive
      .map((u) =>
        [
          u.id,
          u.x,
          u.y,
          G.ally(u) ? 0 : G.strikeReach(s, u),
          G.ally(u) ? 0 : G.stat(u, 'step', s),
          u.conditions?.daze ? 1 : 0,
          // 坐鎮 and a charged hold clip where it can stand; waking or the charge changes that.
          G.ally(u) ? '' : JSON.stringify(G.holdOf(s, u)),
          u.phased ? 1 : 0,
          u.fleeThrough ?? ''
        ].join(':')
      )
      .join(';') +
    // 布陣 stops an enemy's walk, so where formations lie changes where it can get to.
    '|' +
    (s.zones || []).map((z) => z.tiles.map((p) => p.x + ',' + p.y).join(' ')).join('/');
  if (mark === memo.mark) return memo.tiles;
  const tiles = new Set();
  for (const u of alive) {
    // A dazed enemy will not act this turn, so it threatens nothing.
    if (G.ally(u) || u.conditions?.daze) continue;
    // Only where it will actually end its action: a posted piece within its tether, a charged
    // 蓄勢反擊 on its own tile, a fleeing master where its flight takes it.
    const stands = G.standCells(s, u).map((c) => [c.x, c.y]);
    const range = G.strikeReach(s, u);
    for (const [cx, cy] of stands)
      for (let dx = -range; dx <= range; dx++) {
        const span = range - Math.abs(dx);
        for (let dy = -span; dy <= span; dy++) {
          const x = cx + dx,
            y = cy + dy;
          if (G.walkable(x, y, s.mapIndex)) tiles.add(G.key(x, y));
        }
      }
  }
  memo = { mark, tiles };
  return tiles;
}

// Painted under the move and strike tiles: one wash over the whole zone, one line round its edge.
function drawDanger(layer) {
  const s = layer.state;
  if (!POLISH.dangerZone || !layer.prefs.danger || !s || s.result || s.phase !== 'ally') return;
  if (s.run?.scene && s.run.scene !== 'fight') return;
  const tiles = dangerTiles(s);
  if (!tiles.size) return;
  const c = layer.ctx,
    fill = new Path2D(),
    edge = new Path2D();
  for (const k of tiles) {
    const [x, y] = k.split(',').map(Number);
    const q = layer.tile(x, y, 0.5);
    fill.moveTo(q[0].x, q[0].y);
    for (let i = 1; i < 4; i++) fill.lineTo(q[i].x, q[i].y);
    fill.closePath();
    for (const [dx, dy, a, b] of SIDES)
      if (!tiles.has(G.key(x + dx, y + dy))) {
        edge.moveTo(q[a].x, q[a].y);
        edge.lineTo(q[b].x, q[b].y);
      }
  }
  c.save();
  c.fillStyle = 'rgba(132,44,118,.25)';
  c.fill(fill);
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.strokeStyle = 'rgba(38,10,34,.55)';
  c.lineWidth = 3.6;
  c.stroke(edge);
  c.strokeStyle = 'rgba(246,160,226,.92)';
  c.lineWidth = 1.6;
  c.stroke(edge);
  c.restore();
}

export { dangerTiles, drawDanger };
