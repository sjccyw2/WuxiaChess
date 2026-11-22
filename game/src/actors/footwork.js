import { tileInfo } from '../data/terrain.js';
import { FRAMES } from './sprite-sheets.js';

// Distances are in board squares. Corners have a short planted step so even a
// slow display paints the exact center before either foot starts the next edge.
// PACE scales every leg and planted step: 0.8 walks a quarter faster than the first
// timings below (the producer's choice, 2026-11-22). Strikes and other actions keep theirs.
const PACE = 0.8;
function planFootwork(path, full, map = 0) {
  const legs = [];
  let duration = 0;
  for (let i = 1; i < path.length; i++) {
    const from = path[i - 1], to = path[i], next = path[i + 1];
    const direction = [to.x - from.x, to.y - from.y];
    const turn = next && (next.x - to.x !== direction[0] || next.y - to.y !== direction[1]);
    const plant = Boolean(turn || !next);
    const rough = tileInfo(to.x, to.y, map).cost > 1;
    const travel = Math.round(PACE * (full ? (rough ? 460 : 360) : (rough ? 392 : 336)));
    const resume = duration + travel + Math.round(PACE * (plant ? (full ? 72 : 52) : 0));
    legs.push({ from, to, direction, start: duration, travel, resume, plant });
    duration = resume;
  }
  return { legs, duration };
}

function sampleFootwork(walk, now) {
  if (walk.knockback) {
    const [a, b] = walk.path;
    const t = Math.max(0, Math.min(1, (now - walk.start) / (walk.end - walk.start)));
    const f = 1 - (1 - t) ** 3;
    return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
  }
  const time = now - walk.start, legs = walk.legs;
  let index = legs.findIndex((leg) => time < leg.resume);
  if (index < 0) index = legs.length - 1;
  const leg = legs[index], previous = legs[index - 1], next = legs[index + 1];
  const t = Math.max(0, Math.min(1, (time - leg.start) / leg.travel));
  // Share physical speed at straight joins, even between paving and shallows.
  // Both sides of a planted step have zero speed.
  const departure = previous && !previous.plant ? 2 * leg.travel / (previous.travel + leg.travel) : 0;
  const arrival = next && !leg.plant ? 2 * leg.travel / (leg.travel + next.travel) : 0;
  const f = t + (departure - 1) * t * (1 - t) ** 2 + (1 - arrival) * t ** 2 * (1 - t);
  return {
    x: leg.from.x + leg.direction[0] * f,
    y: leg.from.y + leg.direction[1] * f,
    direction: leg.direction,
    frame: Math.min(FRAMES - 1, Math.floor(t * FRAMES)),
    index
  };
}

export { planFootwork, sampleFootwork };
