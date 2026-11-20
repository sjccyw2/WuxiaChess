// Danger zone: every tile an enemy could strike on its coming turn, shaded on the board.
// Follows what the enemy turn itself does: walk anywhere within reach, then strike within range.
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
    alive.map((u) => [u.id, u.x, u.y, u.range, G.ally(u) ? 0 : G.stat(u, 'step', s)].join(':')).join(';');
  if (mark === memo.mark) return memo.tiles;
  const tiles = new Set();
  for (const u of alive) {
    if (G.ally(u)) continue;
    const stands = [[u.x, u.y], ...Array.from(G.reachable(s, u).keys(), (k) => k.split(',').map(Number))];
    for (const [cx, cy] of stands)
      for (let dx = -u.range; dx <= u.range; dx++) {
        const span = u.range - Math.abs(dx);
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
