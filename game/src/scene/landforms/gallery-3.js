import { Model } from '../scenery-kit.js';
import { spike } from './ground-3.js';

// 聽雪棧 only: the older plank road below the shelf. A hanging gallery is
// pinned to the east and west walls on beams socketed into the rock, with
// raking braces, a rope rail under snow and rags tied to its posts; lower
// spans cross the two notches that cut the shelf, one of them broken; empty
// beam sockets and snapped stubs mark where more of the road once ran.

const timber = 0x5f4c3e,
  weathered = 0x7b6a5a,
  pale = 0x96897a,
  rope = 0x8a7a5e,
  iron = 0x3e4549,
  snow = 0xeff3f3,
  snowShade = 0xd0dce3,
  ice = 0xcfe8ef,
  rag = [0x8b1d1a, 0xb7ab92, 0x5e1513];

// A beam running from a to b, square in section.
function beam(m, a, b, size, col) {
  m.tube(a, b, size * 0.7, size * 0.7, col, 4);
}

// A gallery hung on a wall: the wall line runs from (x0, z0) to (x1, z1), the
// gallery stands out along (nx, nz) at deck height y.
function hangingRun(m, x0, z0, x1, z1, nx, nz, y, salt) {
  const len = Math.hypot(x1 - x0, z1 - z0),
    tx = (x1 - x0) / len,
    tz = (z1 - z0) / len;
  const bays = Math.max(2, Math.round(len / 0.5)),
    width = 0.62;
  const at = (s, out, h) => [x0 + tx * s + nx * out, y + h, z0 + tz * s + nz * out];
  for (let i = 0; i <= bays; i++) {
    const s = (len * i) / bays;
    // The beam is socketed a hand into the wall; its brace rakes up from a
    // second socket lower down.
    beam(m, at(s, -0.06, -0.06), at(s, width + 0.1, -0.06), 0.08, timber);
    m.box(
      ...at(s, -0.005, -0.06),
      0.13 * Math.abs(tz) + 0.03,
      0.13,
      0.13 * Math.abs(tx) + 0.03,
      0x1c2226
    );
    beam(m, at(s, -0.04, -0.62), at(s, width * 0.7, -0.08), 0.05, weathered);
    // A post at the outer end of every other beam carries the rail.
    if (i % 2 === 0 || i === bays) {
      m.tube(at(s, width, -0.1), at(s, width, 0.52), 0.03, 0.026, timber, 5);
      m.box(...at(s, width, 0.545), 0.07, 0.03, 0.07, snow);
      if ((i + salt) % 3 === 1) {
        const p = at(s, width + 0.03, 0.36);
        const col = rag[(i + salt) % rag.length];
        m.face(
          [
            p,
            [p[0] + tx * 0.04, p[1] - 0.02, p[2] + tz * 0.04],
            [p[0] + tx * 0.07 + nx * 0.05, p[1] - 0.22, p[2] + tz * 0.07 + nz * 0.05],
            [p[0] - tx * 0.01 + nx * 0.04, p[1] - 0.17, p[2] - tz * 0.01 + nz * 0.04]
          ],
          col
        );
      }
    }
  }
  // Deck: planks laid across the beams, some gone, some sprung, snow on the rest.
  const planks = Math.round(len / 0.13);
  for (let k = 0; k < planks; k++) {
    if ((k * 7 + salt * 3) % 11 === 0) continue;
    const s = (len * (k + 0.5)) / planks,
      sprung = (k * 5 + salt) % 13 === 0 ? 0.03 : 0;
    const a = at(s, -0.02, 0.0),
      b = at(s, width + 0.04, sprung);
    m.tube(a, b, 0.05, 0.05, k % 3 ? weathered : pale, 4);
    if ((k + salt) % 4 !== 0) {
      const c = at(s, 0.04, 0.042),
        d = at(s, width * (0.55 + 0.35 * (((k * 3) % 5) / 5)), 0.042 + sprung);
      m.tube(c, d, 0.035, 0.035, k % 2 ? snow : snowShade, 4);
    }
    if (k % 3 === 1)
      spike(
        m,
        at(s, width + 0.03, -0.035),
        0.06 + 0.1 * (((k * 7) % 5) / 5),
        0.01,
        ice,
        4,
        0xf4fbfc
      );
  }
  // A sagging rope rail with snow lying along its top.
  const rail = [];
  for (let k = 0; k <= bays; k++) {
    const s = (len * k) / bays,
      sag = k % 2 ? -0.06 : 0;
    rail.push(at(s, width, 0.46 + sag));
  }
  m.line(rail, 0.012, rope, 4);
  m.line(
    rail.map((p) => [p[0], p[1] + 0.017, p[2]]),
    0.01,
    snow,
    3
  );
}

// A short span across a notch of the shelf, between two parallel walls.
function span(m, x, z0, z1, y, broken) {
  const width = 0.56;
  for (const s of [-1, 1]) {
    if (broken && s > 0) {
      // One stringer has torn out of its far socket and hangs down the gap.
      beam(
        m,
        [x + s * width * 0.5, y, z0 - 0.08],
        [x + s * width * 0.5 + 0.05, y - 0.62, z0 + (z1 - z0) * 0.55],
        0.075,
        timber
      );
      continue;
    }
    beam(
      m,
      [x + s * width * 0.5, y, z0 - 0.08],
      [x + s * width * 0.5, y, z1 + 0.08],
      0.075,
      timber
    );
  }
  for (const z of [z0, z1]) m.box(x, y, z, width + 0.16, 0.14, 0.03, 0x1c2226);
  const n = Math.round(Math.abs(z1 - z0) / 0.12);
  for (let k = 0; k < n; k++) {
    const z = z0 + ((z1 - z0) * (k + 0.5)) / n;
    if (broken && k > n * 0.45) {
      if (k % 3 === 0)
        // A plank still nailed at one end, hanging into the drop.
        beam(
          m,
          [x - width * 0.5, y + 0.04, z],
          [x - width * 0.5 + 0.1, y - 0.5, z + 0.04],
          0.04,
          weathered
        );
      continue;
    }
    m.box(x, y + 0.05, z, width + 0.08, 0.035, 0.1, k % 3 ? weathered : pale);
    m.box(x - 0.04, y + 0.075, z, width * 0.7, 0.018, 0.09, k % 2 ? snow : snowShade);
  }
  if (!broken) {
    for (const s of [-1, 1]) {
      const posts = [z0 + (z1 - z0) * 0.1, z0 + (z1 - z0) * 0.9];
      for (const z of posts)
        m.tube(
          [x + s * width * 0.5, y, z],
          [x + s * width * 0.5, y + 0.45, z],
          0.024,
          0.02,
          timber,
          5
        );
      m.line(
        [
          [x + s * width * 0.5, y + 0.42, posts[0]],
          [x + s * width * 0.5, y + 0.36, (posts[0] + posts[1]) / 2],
          [x + s * width * 0.5, y + 0.42, posts[1]]
        ],
        0.011,
        rope,
        4
      );
    }
  }
  for (let k = 0; k < 6; k++) {
    const z = z0 + ((z1 - z0) * (k + 0.5)) / 6;
    if (broken && k > 2) continue;
    spike(
      m,
      [x + (k % 2 ? 0.3 : -0.3), y - 0.035, z],
      0.08 + (0.12 * ((k * 3) % 4)) / 4,
      0.011,
      ice,
      4,
      0xf4fbfc
    );
  }
}

// A row of old sockets along a wall: square holes, a few with stubs in them.
function sockets(m, x0, z0, x1, z1, nx, nz, y) {
  const len = Math.hypot(x1 - x0, z1 - z0),
    n = Math.round(len / 0.48);
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n,
      x = x0 + (x1 - x0) * t,
      z = z0 + (z1 - z0) * t;
    m.box(x + nx * 0.02, y, z + nz * 0.02, 0.1 + Math.abs(nz) * 0.0, 0.1, 0.1, 0x161b1f);
    if (i % 3 !== 1) {
      const reach = 0.12 + (0.18 * ((i * 5) % 3)) / 2;
      beam(
        m,
        [x, y, z],
        [x + nx * reach, y - 0.02, z + nz * reach],
        0.07,
        i % 2 ? timber : weathered
      );
      m.box(
        x + nx * reach * 0.5,
        y + 0.06,
        z + nz * reach * 0.5,
        0.06 + Math.abs(nz) * reach,
        0.025,
        0.06 + Math.abs(nx) * reach,
        snow
      );
    }
  }
}

// A paper lantern in a niche: a dark hollow in the wall, the lantern on a hook.
function lantern(m, x, y, z, nx, nz) {
  m.box(x + nx * 0.02, y, z + nz * 0.02, 0.2, 0.26, 0.2, 0x161b1f);
  m.tube(
    [x + nx * 0.02, y + 0.1, z + nz * 0.02],
    [x + nx * 0.16, y + 0.1, z + nz * 0.16],
    0.008,
    0.008,
    iron,
    3
  );
  m.lathe(
    x + nx * 0.16,
    y - 0.12,
    z + nz * 0.16,
    [
      [0, 0.03],
      [0.02, 0.055],
      [0.1, 0.06],
      [0.17, 0.04],
      [0.19, 0.02]
    ],
    0xd9a35a,
    7
  );
  m.box(x + nx * 0.16, y + 0.08, z + nz * 0.16, 0.08, 0.02, 0.08, snow);
}

// A ladder from the gallery down to the next ledge.
function ladder(m, x, z, top, bottom, nx, nz) {
  const tx = -nz,
    tz = nx;
  for (const s of [-1, 1])
    m.tube(
      [x + tx * s * 0.13, bottom, z + tz * s * 0.13],
      [x + tx * s * 0.13 - nx * 0.05, top, z + tz * s * 0.13 - nz * 0.05],
      0.022,
      0.02,
      timber,
      4
    );
  for (let y = bottom + 0.15; y < top - 0.05; y += 0.2) {
    const k = (y - bottom) / (top - bottom);
    m.tube(
      [x - tx * 0.13 - nx * 0.05 * k, y, z - tz * 0.13 - nz * 0.05 * k],
      [x + tx * 0.13 - nx * 0.05 * k, y, z + tz * 0.13 - nz * 0.05 * k],
      0.013,
      0.013,
      weathered,
      4
    );
  }
}

function gallery3(T, surface) {
  const m = new Model(T, 39773);
  // East wall: tiles (5,1) and (5,2) end at x = 5.5 over the deepest drop.
  hangingRun(m, 5.5, 0.52, 5.5, 2.48, 1, 0, -1.55, 1);
  // ... and it turns the corner along the south face of (5,2), stepping down.
  hangingRun(m, 5.5, 2.5, 4.52, 2.5, 0, 1, -1.72, 2);
  ladder(m, 4.85, 3.16, -1.7, Math.max(surface(4.85, 3.3), -4.2), 0, 1);
  lantern(m, 5.5, -1.05, 1.5, 1, 0);
  // West wall: tiles (0,4) and (0,5) end at x = -5.5 above the west gorge.
  hangingRun(m, -5.5, -1.55, -5.5, -3.48, -1, 0, -1.4, 4);
  lantern(m, -5.5, -0.9, -2.5, -1, 0);
  // Lower spans: across the east notch between rows 4 and 6, one whole and
  // one broken, and across the meltwater gorge between rows 7 and 9.
  span(m, 3.55, -2.5, -1.5, -1.05, false);
  span(m, 1.75, -2.5, -1.5, -1.3, true);
  span(m, -2.75, 0.5, 1.5, -1.2, false);
  // Old sockets and stubs along the east walls of rows 6 and 7, and the west
  // walls of rows 10 and 11.
  sockets(m, 4.5, -1.48, 4.5, 0.48, 1, 0, -0.55);
  sockets(m, -5.5, 2.52, -5.5, 4.48, -1, 0, -0.6);
  return [m.finish('崖壁懸棧與舊樁')];
}

export { gallery3 };
