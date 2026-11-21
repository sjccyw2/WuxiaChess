// What a board of the battles redesign marks on the ground, under the pieces:
// - the deployment step's five posts, lit in gold with their numerals (一 … 五), filled where a
//   hero stands and open where none does; the picked hero's post pulses (battleMarks);
// - the tiles reinforcements enter on: a faint banner with the round while they are further off,
//   a red 援 the round before they come (battleMarks);
// - the edge of the secondary's line (拒敵於外), a dashed cyan line (battleMarks).
// The posts are part of the deployment step itself and are drawn with the switch off; the rest
// is presentation and goes with polish switch battleMarks.
import { mapLayout, fieldCells } from '../data/terrain.js';
import { POLISH } from '../polish.js';
import * as G from '../rules/game.js';

const POSTS = ['一', '二', '三', '四', '五'];
const SIDES = [
  [0, -1, 0, 1],
  [1, 0, 1, 2],
  [0, 1, 2, 3],
  [-1, 0, 3, 0]
];
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

// A numeral on a small disc at the tile's front corner, where a standing piece leaves it seen.
function badge(layer, x, y, text, { fill, ink, edge }, scale = 1) {
  const c = layer.ctx,
    q = layer.tile(x, y, 0.42);
  const front = q.reduce((a, b) => (b.y > a.y ? b : a));
  const r = clamp(layer.scaleAt(x, y) * 0.16, 8.5, 15) * scale;
  c.save();
  c.beginPath();
  c.arc(front.x, front.y - r * 0.2, r, 0, Math.PI * 2);
  c.fillStyle = fill;
  c.fill();
  c.lineWidth = 1.4;
  c.strokeStyle = edge;
  c.stroke();
  c.fillStyle = ink;
  c.font = '700 ' + Math.round(r * 1.25) + 'px RiverSerif, "Noto Serif TC", serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(text, front.x, front.y - r * 0.15);
  c.restore();
}

function paintPosts(layer) {
  const s = layer.state;
  if (!s?.run?.deploying || s.run.scene !== 'fight' || s.result) return;
  const c = layer.ctx,
    pulse = POLISH.battleMarks && layer.prefs.motion ? 0.5 + 0.5 * Math.sin(performance.now() / 260) : 1;
  mapLayout(s.mapIndex).allies.forEach(({ x, y }, i) => {
    const hero = G.at(s, x, y);
    const picked = hero && hero.id === layer.pick;
    layer.path(layer.tile(x, y, 0.45));
    c.fillStyle = picked
      ? 'rgba(255,214,120,' + (0.25 + 0.22 * pulse) + ')'
      : hero
        ? 'rgba(242,200,110,.28)'
        : 'rgba(242,200,110,.13)';
    c.fill();
    c.save();
    if (!hero) c.setLineDash([6, 4]);
    c.lineJoin = 'round';
    c.strokeStyle = 'rgba(40,26,8,.6)';
    c.lineWidth = picked ? 5.5 : 4.4;
    c.stroke();
    c.strokeStyle = picked ? 'rgba(255,240,180,' + (0.65 + 0.35 * pulse) + ')' : '#f3cd73';
    c.lineWidth = picked ? 3 : 2.3;
    c.stroke();
    c.restore();
    badge(layer, x, y, POSTS[i], hero ? { fill: '#f0c86e', ink: '#2b1d0b', edge: '#fff2c4' } : { fill: 'rgba(24,30,26,.82)', ink: '#f0c86e', edge: '#f0c86e' });
  });
}

function paintEntries(layer) {
  const s = layer.state;
  if (!POLISH.battleMarks || !s?.run || s.run.status !== 'battle' || s.result) return;
  const c = layer.ctx;
  for (const p of G.pendingWaves(s)) {
    const soon = p.due === s.round + 1;
    for (const t of p.tiles) {
      if (G.at(s, t.x, t.y)) continue;
      layer.path(layer.tile(t.x, t.y, 0.42));
      c.save();
      c.lineJoin = 'round';
      if (soon) {
        c.fillStyle = 'rgba(176,40,30,.30)';
        c.fill();
        c.strokeStyle = 'rgba(255,140,110,.95)';
        c.lineWidth = 2;
      } else {
        c.setLineDash([3, 4]);
        c.strokeStyle = 'rgba(232,190,160,.55)';
        c.lineWidth = 1.3;
      }
      c.stroke();
      c.restore();
      if (soon) badge(layer, t.x, t.y, '援', { fill: '#a8281e', ink: '#fff0e0', edge: '#ffc2a8' }, 1.15);
      else {
        // A small banner on its pole, with the round it comes.
        const foot = layer.point(t.x, t.y, 0.02),
          r = clamp(layer.scaleAt(t.x, t.y) * 0.13, 6, 11);
        c.save();
        c.globalAlpha = 0.72;
        c.strokeStyle = '#3a2418';
        c.lineWidth = 1.4;
        c.beginPath();
        c.moveTo(foot.x - r * 0.9, foot.y);
        c.lineTo(foot.x - r * 0.9, foot.y - r * 2.6);
        c.stroke();
        c.fillStyle = '#7c3a28';
        c.fillRect(foot.x - r * 0.9, foot.y - r * 2.6, r * 1.9, r * 1.3);
        c.fillStyle = '#ffe9d0';
        c.font = '700 ' + Math.round(r * 1.05) + 'px RiverSerif, "Noto Serif TC", serif';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText(G.NUMERALS[p.due - 1] || String(p.due), foot.x + r * 0.05, foot.y - r * 1.93);
        c.restore();
      }
    }
  }
}

function paintHoldLine(layer) {
  const s = layer.state,
    side = s?.run?.side;
  if (!POLISH.battleMarks || side?.kind !== 'holdLine' || s.run.status !== 'battle' || s.result) return;
  const c = layer.ctx,
    edge = new Path2D();
  for (const { x, y } of fieldCells(s.mapIndex)) {
    if (!G.inZone(side.zone, { x, y })) continue;
    const q = layer.tile(x, y, 0.5);
    for (const [dx, dy, a, b] of SIDES) {
      const n = { x: x + dx, y: y + dy };
      if (!G.valid(n.x, n.y, s.mapIndex) || G.inZone(side.zone, n)) continue;
      edge.moveTo(q[a].x, q[a].y);
      edge.lineTo(q[b].x, q[b].y);
    }
  }
  c.save();
  c.lineCap = 'round';
  c.setLineDash([7, 5]);
  c.strokeStyle = 'rgba(8,30,36,.6)';
  c.lineWidth = 3.6;
  c.stroke(edge);
  c.strokeStyle = 'rgba(120,226,240,.92)';
  c.lineWidth = 1.7;
  c.stroke(edge);
  c.restore();
}

function paintBattleMarks(layer) {
  paintHoldLine(layer);
  paintEntries(layer);
  paintPosts(layer);
}

export { paintBattleMarks };
