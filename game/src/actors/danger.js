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
  const alive = s.units.filter((u) => G.living(u) && !G.isProp(u)); // an object threatens nothing
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
          G.holdsFire(u) ? 1 : 0,
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
    // A frozen, muted or charmed enemy strikes no hero this turn, so it threatens nothing.
    if (G.ally(u) || G.holdsFire(u)) continue;
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

// The tiles the reinforcements entering next round could strike in their first action: each
// built where it would enter if it entered now (G.arrivalGhosts), with everyone where they
// stand now. An estimate, and the help page says so.
let arrivalMemo = { mark: '', tiles: new Set() };
function arrivalTiles(s) {
  const ghosts = G.arrivalGhosts(s, s.round + 1);
  if (!ghosts.length) return new Set();
  const mark =
    s.mapIndex +
    '|' +
    ghosts.map((g) => g.id + ':' + g.x + ':' + g.y).join(';') +
    '|' +
    s.units
      .filter(G.living)
      .map((u) => u.id + ':' + u.x + ':' + u.y)
      .join(';');
  if (mark === arrivalMemo.mark) return arrivalMemo.tiles;
  const tiles = new Set();
  const seen = { ...s, units: [...s.units, ...ghosts] };
  for (const g of ghosts) {
    const range = G.strikeReach(seen, g);
    for (const c of G.standCells(seen, g))
      for (let dx = -range; dx <= range; dx++) {
        const span = range - Math.abs(dx);
        for (let dy = -span; dy <= span; dy++)
          if (G.walkable(c.x + dx, c.y + dy, s.mapIndex)) tiles.add(G.key(c.x + dx, c.y + dy));
      }
  }
  arrivalMemo = { mark, tiles };
  return tiles;
}
// One region's outline: the sides of its tiles that face a tile outside it.
function outline(layer, tiles, fill) {
  const edge = new Path2D();
  for (const k of tiles) {
    const [x, y] = k.split(',').map(Number);
    const q = layer.tile(x, y, 0.5);
    if (fill) {
      fill.moveTo(q[0].x, q[0].y);
      for (let i = 1; i < 4; i++) fill.lineTo(q[i].x, q[i].y);
      fill.closePath();
    }
    for (const [dx, dy, a, b] of SIDES)
      if (!tiles.has(G.key(x + dx, y + dy))) {
        edge.moveTo(q[a].x, q[a].y);
        edge.lineTo(q[b].x, q[b].y);
      }
  }
  return edge;
}
// Painted under the move and strike tiles: one wash over the whole zone, one line round its edge.
// While deploying the zone is drawn whatever the D setting. Under it, a dashed amber outline for
// the reinforcements due next round (battleMarks).
function drawDanger(layer) {
  const s = layer.state;
  const lit = layer.prefs.danger || (s?.run?.deploying && s.run.scene === 'fight');
  if (!POLISH.dangerZone || !lit || !s || s.result || s.phase !== 'ally') return;
  if (s.run?.scene && s.run.scene !== 'fight') return;
  const c = layer.ctx;
  if (POLISH.battleMarks && s.run?.status === 'battle') {
    const coming = arrivalTiles(s);
    if (coming.size) {
      c.save();
      c.lineCap = 'round';
      c.setLineDash([6, 5]);
      c.strokeStyle = 'rgba(240,170,60,.9)';
      c.lineWidth = 2;
      c.stroke(outline(layer, coming));
      c.restore();
    }
  }
  const tiles = dangerTiles(s);
  if (!tiles.size) return;
  const fill = new Path2D(),
    edge = outline(layer, tiles, fill);
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

export { dangerTiles, arrivalTiles, drawDanger };
