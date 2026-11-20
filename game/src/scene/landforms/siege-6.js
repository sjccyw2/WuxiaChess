// Siegeworks of Xiangyang: Song city walls (a rammed-earth core behind grey
// brick facing, battered courses, crenellated parapet), the ruined lines that
// cross the board, the camp, a counterweight trebuchet and the litter of a
// long fight. Everything draws into the caller's Model batch.
import { circle } from '../scenery-kit.js';
import { cargo, roof, banners } from '../maze-models.js';
import { mapLayout } from '../../data/terrain.js';

const clamp = (t) => Math.max(0, Math.min(1, t));
const smooth = (t) => {
  const u = clamp(t);
  return u * u * (3 - 2 * u);
};
// Fired grey brick, the warm rammed earth it faces, soot and timber.
const brick = [0x6b6c67, 0x777670, 0x83817a, 0x636567, 0x8b877e, 0x5d5f5c];
const earth = [0x8f8571, 0x827966, 0x998f79, 0x786f5e];
const soot = 0x2b2825,
  timber = 0x5d4936,
  oak = 0x7d6345,
  charred = 0x2e2823,
  iron = 0x4a4c4c,
  rope = 0x9d8d6a,
  canvas = 0xb8ad94,
  red = 0x9a3328;
// Wind a face so its normal points along `hint`. The shadow lookup is offset
// along the stored normal, so a face wound inward would shade itself.
function orient(m, pts, col, hint, light = 1) {
  let nx = 0,
    ny = 0,
    nz = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i],
      b = pts[(i + 1) % pts.length];
    nx += (a[1] - b[1]) * (a[2] + b[2]);
    ny += (a[2] - b[2]) * (a[0] + b[0]);
    nz += (a[0] - b[0]) * (a[1] + b[1]);
  }
  m.face(nx * hint[0] + ny * hint[1] + nz * hint[2] < 0 ? [...pts].reverse() : pts, col, light);
}
const wave = (u, a, b) => Math.sin(u * a + b) * Math.sin(u * a * 0.43 + b * 1.7 + 0.6);

// Courses of facing blocks laid along x on a face looking toward +z. at(y) is
// the face's distance from the core axis; reach(x) the height still standing.
function courses(m, x0, x1, foot, top, reach, at, tone, ch, deep = 0.085) {
  const r = m.rng;
  for (let k = 0; foot + k * ch < top; k++) {
    const lo = foot + k * ch,
      hi = lo + ch;
    let x = x0 - (k % 2) * ch * 1.15;
    while (x < x1) {
      const w = r.range(ch * 2.1, ch * 3.5),
        a = Math.max(x, x0),
        b = Math.min(x + w, x1);
      x += w;
      if (b - a < ch * 0.5) continue;
      const c = (a + b) / 2;
      if (hi > Math.min(reach(a + 0.01), reach(b - 0.01), reach(c))) continue;
      m.box(c, (lo + hi) / 2, at(hi) + deep / 2 - 0.025, b - a - 0.016, ch - 0.014, deep, tone(c, lo));
    }
  }
}

// Fallen blocks and earth spilled from a breach. Local frame: wall face at
// z = from, spilling toward +z for `reach` and spreading `spread` along x.
function rubbleFan(m, x, from, spread, reach, crest, ground, n = 18) {
  const r = m.rng,
    rings = [];
  for (let j = 0; j <= 3; j++) {
    const t = j / 3,
      ring = [];
    for (let k = 0; k <= 8; k++) {
      const a = (k / 8) * Math.PI,
        px = x + Math.cos(a) * spread * (0.42 + 0.58 * t),
        pz = from + Math.sin(a) * reach * t + (j ? 0 : -0.06),
        g = ground(px, pz);
      ring.push([px, g - 0.03 + (crest - g) * (1 - t) ** 1.5 + (j && j < 3 ? r.range(-0.03, 0.04) : 0), pz]);
    }
    rings.push(ring);
  }
  for (let j = 0; j < 3; j++)
    for (let k = 0; k < 8; k++)
      orient(
        m,
        [rings[j][k], rings[j + 1][k], rings[j + 1][k + 1], rings[j][k + 1]],
        m.mix(r.pick(earth), r.pick(brick), r.range(0.25, 0.7)),
        [0, 1, 0],
        0.9 + 0.1 * (k % 2)
      );
  for (let i = 0; i < n; i++) {
    const t = Math.sqrt(r.next()) * 0.95,
      a = r.range(0.15, Math.PI - 0.15),
      px = x + Math.cos(a) * spread * (0.42 + 0.58 * t),
      pz = from + Math.sin(a) * reach * t,
      g = ground(px, pz),
      y = g - 0.03 + (crest - g) * (1 - t) ** 1.5,
      s = r.range(0.09, 0.2);
    m.frame(
      px,
      y + s * 0.2,
      pz,
      r.range(0, circle),
      1,
      () => m.box(0, 0, 0, s * 1.7, s * 0.7, s, r.pick(brick)),
      r.range(-0.5, 0.5),
      r.range(-0.4, 0.4)
    );
  }
}

// A stretch of Song city wall along local x, outer face toward +z.
//   ground(u, v): ground height at a local point
//   breaches: [centre, width, floor, spill toward +z, spill toward -z]
function cityWall(m, o) {
  const {
    length: L,
    height: H,
    base = 1.1,
    top = 0.82,
    ground,
    breaches = [],
    loss = 0.3,
    burn = 0.3,
    phase = 0,
    ragged = 0,
    parapet = true,
    ends = [true, true],
    endFacing = false,
    course = 0.15,
    litter = 1
  } = o;
  const r = m.rng,
    half = (y) => (base - (base - top) * clamp(y / H)) / 2;
  const n = Math.max(2, Math.round(L / 0.42)),
    step = L / n;
  // Standing height at each joint along the wall; broken stretches slope.
  const joint = [];
  let foot = Infinity;
  for (let i = 0; i <= n; i++) {
    const u = -L / 2 + i * step;
    let t = H;
    for (const [c, w, floor] of breaches) {
      const d = Math.abs(u - c) / (w / 2);
      t = Math.min(t, floor + (H - floor) * smooth((d - 0.3) / 0.8));
    }
    if (t < H - 0.02) t -= r.range(0, 0.14) * (1 - t / H);
    if (ragged) t -= r.range(0, ragged);
    joint.push(t);
    for (const v of [-base / 2, 0, base / 2]) foot = Math.min(foot, ground(u, v));
  }
  foot -= 0.18;
  const whole = (i) => joint[i] >= H - 0.02 && joint[i + 1] >= H - 0.02;
  const topAt = (u) => {
    const q = clamp((u + L / 2) / L) * n,
      i = Math.min(n - 1, Math.floor(q));
    return joint[i] + (joint[i + 1] - joint[i]) * (q - i);
  };
  const burnAt = (u, y) =>
    burn * smooth((y - H * 0.4) / (H * 0.5)) * clamp(0.55 + 0.6 * wave(u, 1.1, phase + 2));
  const side = (x, y, s) => [x, y, s * half(y)];
  // Rammed-earth core in thin layers, visible wherever the facing has fallen.
  for (let i = 0; i < n; i++) {
    const a = -L / 2 + i * step,
      b = a + step,
      ta = joint[i],
      tb = joint[i + 1],
      lo = Math.min(ta, tb);
    let y0 = foot,
      k = 0;
    for (; y0 < lo - 0.03; y0 += 0.13, k++) {
      const y1 = Math.min(lo, y0 + 0.13),
        tone = m.mix(earth[(k + (i % 3 === 0 ? 1 : 0)) % 4], soot, burnAt(a, y1) * 0.6);
      for (const s of [-1, 1])
        orient(m, [side(a, y0, s), side(b, y0, s), side(b, y1, s), side(a, y1, s)], tone, [0, 0, s], s > 0 ? 1 : 0.93);
    }
    const crest = m.mix(earth[(k + 1) % 4], soot, burnAt(a, lo) * 0.6);
    for (const s of [-1, 1])
      orient(m, [side(a, y0, s), side(b, y0, s), side(b, tb, s), side(a, ta, s)], crest, [0, 0, s], s > 0 ? 1 : 0.93);
    const cap = whole(i)
      ? m.mix(0x7a766d, soot, burnAt(a, H) * 0.5)
      : m.mix(r.pick(earth), r.pick(brick), r.range(0.2, 0.55));
    orient(m, [[a, ta, -half(ta)], [b, tb, -half(tb)], [b, tb, half(tb)], [a, ta, half(ta)]], cap, [0, 1, 0]);
    // The wall's own ends, and loose brick lying on the broken crest.
    if (i === 0 && ends[0])
      orient(m, [side(a, foot, -1), side(a, foot, 1), side(a, ta, 1), side(a, ta, -1)], earth[1], [-1, 0, 0], 0.9);
    if (i === n - 1 && ends[1])
      orient(m, [side(b, foot, -1), side(b, foot, 1), side(b, tb, 1), side(b, tb, -1)], earth[1], [1, 0, 0], 0.9);
    if (!whole(i) && r.next() < 0.55) {
      const c = (a + b) / 2 + r.range(-0.08, 0.08),
        sz = Math.min(0.13, step * 0.3);
      m.frame(
        c,
        topAt(c) + sz * 0.3,
        r.range(-0.4, 0.4) * half(lo),
        r.range(-0.6, 0.6),
        1,
        () => m.box(0, 0, 0, sz * 1.7, sz * 0.7, sz, r.pick(brick)),
        0,
        Math.atan2(tb - ta, step)
      );
    }
  }
  // Grey brick facing; it holds at the battered foot and has fallen in patches above.
  for (const s of [1, -1]) {
    const reach = (u) => {
      const t = topAt(u) - 0.03,
        patch = wave(u, 0.83, phase + s * 1.9 + 0.4) + 0.35 * Math.sin(u * 3.1 + s);
      const broken = t < H - 0.05 ? t - 0.06 - 0.1 * Math.abs(Math.sin(u * 2.3)) : t;
      return patch > 1 - 2 * loss
        ? Math.min(broken, foot + 0.55 + H * 0.25 * (0.5 + 0.5 * Math.sin(u * 1.7 + phase)))
        : broken;
    };
    const tone = (u, y) => m.mix(r.pick(brick), soot, burnAt(u, y) * 0.85);
    m.frame(0, 0, 0, s > 0 ? 0 : Math.PI, 1, () =>
      courses(m, -L / 2, L / 2, foot, H, (x) => reach(s * x), half, tone, course)
    );
  }
  if (endFacing)
    for (const e of [-1, 1]) {
      const t = e < 0 ? joint[0] : joint[n],
        w0 = half(0);
      m.frame(e * (L / 2), 0, 0, (e * Math.PI) / 2, 1, () =>
        courses(
          m,
          -w0 - 0.05,
          w0 + 0.05,
          foot,
          H,
          (x) => Math.min(t - 0.03, (H * (w0 - Math.abs(x) + 0.04)) / Math.max(0.01, w0 - half(H))),
          () => 0,
          (u, y) => m.mix(r.pick(brick), soot, burnAt(u + e * 3, y) * 0.85),
          course
        )
      );
    }
  // Parapet: crenellated toward +z, a low guard wall behind.
  if (parapet)
    for (let i = 0; i < n; i++) {
      if (!whole(i)) continue;
      const a = -L / 2 + i * step,
        c = a + step / 2,
        z = half(H) - 0.07,
        tone = m.mix(r.pick(brick), soot, burnAt(c, H) * 0.9);
      m.box(c, H + 0.1, z, step + 0.004, 0.2, 0.14, tone);
      if (r.next() > 0.18)
        m.box(c, H + 0.31, z, step * 0.56, 0.23, 0.15, m.mix(r.pick(brick), soot, burnAt(c, H) * 0.9));
      m.box(c, H + 0.05, -half(H) + 0.05, step + 0.004, 0.1, 0.1, tone);
    }
  // Breach spill on both faces, and bricks fallen along the foot.
  for (const [c, w, floor, out = 0, inner = 0] of breaches) {
    if (out > 0) rubbleFan(m, c, half(0) - 0.05, w * 0.55, out, floor * 0.75 + 0.05, ground, 16);
    if (inner > 0)
      m.frame(0, 0, 0, Math.PI, 1, () =>
        rubbleFan(m, -c, half(0) - 0.05, w * 0.55, inner, floor * 0.75 + 0.05, (x, z) => ground(-x, -z), 10)
      );
  }
  for (let i = 0; i < L * 2.2 * litter; i++) {
    const u = r.range(-L / 2, L / 2),
      s = r.next() > 0.5 ? 1 : -1,
      v = s * (half(0) + r.range(0.02, 0.3)),
      size = r.range(0.07, 0.15);
    m.frame(
      u,
      ground(u, v) + size * 0.15,
      v,
      r.range(0, circle),
      1,
      () => m.box(0, 0, 0, size * 1.8, size * 0.7, size, r.pick(brick)),
      r.range(-0.4, 0.4),
      r.range(-0.3, 0.3)
    );
  }
  return { joint, foot, half };
}

// A wall in world space: centre, yaw, and the shared ground sampler.
function wallAt(m, height, x0, z0, yaw, o) {
  const c = Math.cos(yaw),
    s = Math.sin(yaw);
  const ground = (u, v) => height(x0 + c * u + s * v, z0 - s * u + c * v);
  let made;
  m.frame(x0, 0, z0, yaw, 1, () => (made = cityWall(m, { ...o, ground })));
  return made;
}

// A post-and-beam war shed (戰棚) on a tower top, burnt and half fallen.
function warShed(m, w, d, y) {
  for (const [x, z, h] of [
    [-w / 2, -d / 2, 1.0],
    [w / 2, -d / 2, 0.98],
    [-w / 2, d / 2, 0.56],
    [w / 2, d / 2, 1.02]
  ]) {
    m.box(x, y + h / 2, z, 0.1, h, 0.1, h < 0.8 ? charred : timber);
    if (h < 0.8)
      m.frame(x + 0.25, y + 0.07, z + 0.25, 0.8, 1, () => m.box(0, 0, 0, 0.6, 0.08, 0.08, charred), 0, 0.12);
  }
  m.box(0, y + 0.96, -d / 2, w + 0.12, 0.09, 0.1, timber);
  m.box(w / 2, y + 0.97, 0, 0.1, 0.09, d + 0.1, charred);
  m.frame(-w / 2 + 0.1, y + 0.78, 0, 0, 1, () => m.box(0, 0, 0, 0.09, 0.09, d + 0.1, charred), 0, -0.35);
  // Plank breastwork between the posts on the outer side, broken through.
  for (let i = 0; i < 7; i++) {
    const x = -w / 2 + 0.14 + i * ((w - 0.28) / 6);
    if (i === 2) continue;
    m.box(x, y + 0.27 + (i === 3 ? -0.08 : 0), d / 2, 0.12, i === 3 ? 0.36 : 0.52, 0.04, i % 3 ? oak : charred);
  }
  // The roof slumps toward the burnt corner.
  m.frame(0.08, y + 0.86, 0.04, 0, 1, () =>
    roof(m, w * 0.95, d * 0.9, 0.12, 0.42, [0x23201d, 0x3b3733, 0x585149]),
    0.2,
    -0.12
  );
}

// Counterweight trebuchet (回回砲), cocked, throwing toward local -z.
function trebuchet(m, ground) {
  const r = m.rng,
    g = ground(0, 0);
  m.frame(0, g, 0, 0, 1, () => {
    for (const x of [-0.56, 0.56]) {
      m.box(x, 0.08, 0.15, 0.13, 0.13, 2.7, timber);
      for (const z of [-0.95, 0.95])
        m.tube([x, 0.13, z], [x * 0.93, 1.78, 0], 0.06, 0.05, oak, 6);
      m.tube([x, 0.13, 0], [x * 0.95, 1.7, 0], 0.055, 0.05, oak, 6);
      m.box(x, 0.72, 0, 0.09, 0.08, 1.3, timber);
      m.tube([x, 0.15, -0.95], [x, 0.7, 0.55], 0.03, 0.03, timber, 5);
    }
    for (const z of [-1.1, 0, 1.2]) m.box(0, 0.08, z, 1.32, 0.11, 0.13, timber);
    m.tube([-0.66, 1.8, 0], [0.66, 1.8, 0], 0.06, 0.06, iron, 8);
    // Throwing arm: long end down in the trough, short end raised.
    const pivot = [0, 1.8, 0],
      tail = [0, 0.32, 2.75],
      dir = [0, pivot[1] - tail[1], pivot[2] - tail[2]],
      len = Math.hypot(dir[1], dir[2]),
      head = [0, pivot[1] + (dir[1] / len) * 0.92, (dir[2] / len) * 0.92];
    m.tube(tail, head, 0.05, 0.1, oak, 7);
    for (const t of [0.35, 0.6, 0.82])
      m.hoop(0, tail[1] + (head[1] - tail[1]) * t, tail[2] + (head[2] - tail[2]) * t, 0.085, 0.012, iron, 8, 'yz');
    // The weight box hangs from the short end on a pin.
    m.tube(head, [0, head[1] - 0.32, head[2]], 0.025, 0.025, iron, 5);
    const by = head[1] - 0.62;
    m.box(0, by, head[2], 0.66, 0.52, 0.56, 0x55473a);
    for (const dy of [-0.18, 0.18]) m.box(0, by + dy, head[2], 0.69, 0.05, 0.59, iron);
    for (let i = 0; i < 4; i++)
      m.rock(r.range(-0.22, 0.22), by + 0.24, head[2] + r.range(-0.18, 0.18), 0.1, 0.07, 0.09, 0x6c6a63, 0x87847b, 5);
    // Trough, sling and the stone it will throw.
    m.box(0, 0.06, 2.25, 0.34, 0.08, 2.0, timber);
    for (const x of [-0.16, 0.16]) m.box(x, 0.12, 2.25, 0.04, 0.08, 2.0, oak);
    m.line(
      [
        tail,
        [0.04, 0.16, 2.95],
        [0.05, 0.14, 3.2]
      ],
      0.012,
      rope,
      4
    );
    m.line(
      [
        tail,
        [-0.05, 0.16, 2.95],
        [-0.04, 0.14, 3.2]
      ],
      0.012,
      rope,
      4
    );
    m.rock(0, 0.12, 3.24, 0.15, 0.24, 0.15, 0x77756c, 0x96938a, 7);
    // Winch with handspikes; its rope holds the arm down.
    m.tube([-0.5, 0.36, 1.35], [0.5, 0.36, 1.35], 0.085, 0.085, oak, 8);
    for (const x of [-0.56, 0.56]) m.box(x, 0.24, 1.35, 0.1, 0.32, 0.18, timber);
    for (let i = 0; i < 4; i++) {
      const a = (i * circle) / 4 + 0.4;
      m.tube([0.52, 0.36, 1.35], [0.52, 0.36 + Math.sin(a) * 0.32, 1.35 + Math.cos(a) * 0.32], 0.017, 0.017, oak, 4);
    }
    m.line([[0, 0.4, 1.35], [0, 0.36, 2.05], [0, 0.33, 2.62]], 0.014, rope, 4);
  });
}

// A ridge tent of oiled canvas over two poles, guyed to pegs.
function tent(m, x, y, z, yaw, s = 1, trim = null) {
  const r = m.rng;
  m.frame(x, y, z, yaw, s, () => {
    const L = 0.62,
      W = 0.52,
      H = 0.78,
      sag = 0.05;
    const ridge = (u) => [u, H - sag * (1 - (u / L) ** 2), 0];
    const eave = (u, side) => [u * 1.04, 0.14, side * W];
    const hem = (u, side) => [u * 1.06, 0.0, side * (W + 0.07)];
    for (const side of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        const u0 = -L + (i * 2 * L) / 4,
          u1 = u0 + (2 * L) / 4,
          tone = m.mix(canvas, 0x8f8670, (i % 2) * 0.08 + (side > 0 ? 0 : 0.06));
        orient(m, [ridge(u0), ridge(u1), eave(u1, side), eave(u0, side)], tone, [0, 1, side]);
        orient(m, [eave(u0, side), eave(u1, side), hem(u1, side), hem(u0, side)], m.mix(canvas, 0x6a5f4c, 0.45), [0, 0.3, side]);
      }
      if (trim) m.box(0, 0.15, side * (W + 0.005), 2 * L, 0.05, 0.012, trim);
    }
    // Back wall closed; the door flap is tied open on the front end.
    orient(m, [ridge(-L), eave(-L, 1), hem(-L, 1), hem(-L, -1), eave(-L, -1)], m.mix(canvas, 0x8f8670, 0.2), [-1, 0, 0]);
    const door = [L, H - 0.02, 0];
    orient(m, [door, eave(L, 1), [L * 1.04, 0.0, W * 0.25]], m.mix(canvas, 0x8f8670, 0.12), [1, 0, 0]);
    orient(m, [door, [L * 1.04, 0.0, -W * 0.2], [L * 1.04, 0.0, W * 0.2]], 0x24211d, [1, 0, 0]);
    orient(m, [door, eave(L, -1), [L * 1.3, 0.05, -W * 0.85]], m.mix(canvas, 0x8f8670, 0.3), [1, 0, 0]);
    for (const u of [-L, L]) m.tube([u * 1.01, 0, 0], [u * 1.01, H + 0.08, 0], 0.016, 0.014, timber, 4);
    for (const e of [-1, 1]) {
      const peg = [e * (L + 0.42), 0.0, r.range(-0.05, 0.05)];
      m.line([[e * L, H - 0.01, 0], peg], 0.005, rope, 3);
      m.tube(peg, [peg[0], 0.07, peg[2]], 0.012, 0.008, oak, 3);
    }
  });
}

// A cold fire: ring of stones, ash, charred ends of logs, a pot on a tripod.
function deadFire(m, x, y, z, pot = false) {
  const r = m.rng;
  const ash = [];
  for (let k = 0; k < 9; k++) {
    const a = (k * circle) / 9;
    ash.push([x + Math.cos(a) * 0.24 * r.range(0.85, 1.1), y + 0.012, z + Math.sin(a) * 0.2 * r.range(0.85, 1.1)]);
  }
  orient(m, ash, 0x575450, [0, 1, 0]);
  orient(m, ash.map(([px, py, pz]) => [x + (px - x) * 0.55, py + 0.004, z + (pz - z) * 0.55]), 0x2c2926, [0, 1, 0]);
  for (let k = 0; k < 8; k++) {
    const a = (k * circle) / 8 + r.range(-0.1, 0.1);
    m.rock(x + Math.cos(a) * 0.3, y - 0.01, z + Math.sin(a) * 0.26, 0.06, 0.06, 0.05, 0x6b6861, 0x8a867d, 5);
  }
  for (let k = 0; k < 3; k++) {
    const a = k * 2.1 + r.range(-0.2, 0.2);
    m.tube(
      [x + Math.cos(a) * 0.2, y + 0.04, z + Math.sin(a) * 0.17],
      [x - Math.cos(a) * 0.05, y + 0.07, z - Math.sin(a) * 0.04],
      0.025,
      0.02,
      k ? charred : 0x463a2f,
      5
    );
  }
  if (pot) {
    for (let k = 0; k < 3; k++) {
      const a = (k * circle) / 3 + 0.3;
      m.tube([x + Math.cos(a) * 0.32, y, z + Math.sin(a) * 0.3], [x, y + 0.58, z], 0.013, 0.011, timber, 4);
    }
    m.tube([x, y + 0.58, z], [x, y + 0.36, z], 0.004, 0.004, iron, 3);
    m.lathe(x, y + 0.2, z, [[0, 0.06], [0.06, 0.11], [0.15, 0.1], [0.17, 0.08]], 0x3b3936, 8);
  }
}

// A round rattan shield; lying flat, leaning, or split.
function shield(m, x, y, z, yaw, tilt, s = 1, split = false) {
  m.frame(
    x,
    y,
    z,
    yaw,
    s,
    () => {
      m.lathe(0, 0, 0, [[0, 0.16], [0.02, 0.15], [0.035, 0.07], [0.04, 0.0]], 0x5c5243, split ? 6 : 9);
      m.lathe(0, 0.036, 0, [[0, 0.055], [0.012, 0.0]], 0x5a2b25, 6);
    },
    tilt,
    0
  );
}

function arrow(m, x, y, z, yaw, pitch, len = 0.34, stuck = true) {
  const dx = Math.cos(pitch) * Math.cos(yaw),
    dz = Math.cos(pitch) * Math.sin(yaw),
    dy = Math.sin(pitch);
  const tip = stuck ? [x, y - 0.02, z] : [x, y + 0.01, z],
    tail = [x + dx * len, y + dy * len, z + dz * len];
  m.tube(tip, tail, 0.005, 0.005, 0x8a7656, 3);
  const f = [tail[0] - dx * 0.07, tail[1] - dy * 0.07, tail[2] - dz * 0.07];
  m.face([tail, f, [f[0] - dz * 0.025, f[1] + 0.02, f[2] + dx * 0.025]], 0xd8d1bd);
  m.face([tail, f, [f[0] + dz * 0.025, f[1] + 0.02, f[2] - dx * 0.025]], 0xb3ab97);
}

// A rack of spears and halberds with two leaning shields.
function weaponRack(m, x, y, z, yaw) {
  const r = m.rng;
  m.frame(x, y, z, yaw, 1, () => {
    for (const u of [-0.42, 0.42]) {
      m.tube([u, 0, -0.14], [u, 0.52, 0], 0.02, 0.018, timber, 4);
      m.tube([u, 0, 0.14], [u, 0.52, 0], 0.02, 0.018, timber, 4);
    }
    m.tube([-0.5, 0.5, 0], [0.5, 0.5, 0], 0.022, 0.022, oak, 5);
    for (let i = 0; i < 6; i++) {
      const u = -0.33 + i * 0.13,
        foot = [u + r.range(-0.02, 0.02), 0, 0.2],
        top = [u + r.range(-0.04, 0.04), 1.05 + r.range(-0.06, 0.08), -0.12];
      m.tube(foot, top, 0.011, 0.01, 0x6f5a40, 4);
      m.tube(top, [top[0], top[1] + 0.12, top[2] - 0.03], 0.016, 0.001, i % 3 === 1 ? 0x8c8a82 : 0x76746d, 4);
      if (i % 3 === 0) m.box(top[0], top[1] - 0.03, top[2], 0.03, 0.08, 0.03, red);
    }
    shield(m, 0.62, 0.17, 0.12, -0.2, 1.25, 1.05);
    shield(m, -0.64, 0.16, 0.15, 0.25, 1.2, 0.95);
  });
}

// Cheval de frise (拒馬): a log pierced by crossed sharpened stakes.
function abatis(m, x, y, z, yaw, length = 1.4) {
  m.frame(x, y, z, yaw, 1, () => {
    m.tube([-length / 2, 0.22, 0], [length / 2, 0.22, 0], 0.05, 0.05, timber, 6);
    for (let i = 0; i <= Math.round(length / 0.3); i++) {
      const u = -length / 2 + 0.1 + i * 0.3;
      if (u > length / 2) break;
      for (const s of [-1, 1])
        m.tube([u, 0.22 - 0.24, -s * 0.24], [u, 0.22 + 0.3, s * 0.3], 0.022, 0.003, i % 2 ? oak : 0x6b5539, 4);
    }
  });
}

// A scaling ladder (雲梯 rungs on two poles), lying where it fell or leant on a wall.
function ladder(m, a, b, broken = 0) {
  const dx = b[0] - a[0],
    dz = b[2] - a[2],
    len = Math.hypot(dx, b[1] - a[1], dz),
    flat = Math.hypot(dx, dz) || 1,
    px = (-dz / flat) * 0.17,
    pz = (dx / flat) * 0.17;
  for (const s of [-1, 1]) {
    const end = s > 0 && broken ? 1 - broken : 1;
    m.tube(
      [a[0] + px * s, a[1], a[2] + pz * s],
      [a[0] + px * s + dx * end, a[1] + (b[1] - a[1]) * end, a[2] + pz * s + dz * end],
      0.025,
      0.022,
      s > 0 ? oak : 0x6d5438,
      4
    );
  }
  for (let t = 0.08; t < (broken ? 1 - broken - 0.05 : 0.97); t += 0.3 / len) {
    const c = [a[0] + dx * t, a[1] + (b[1] - a[1]) * t, a[2] + dz * t];
    m.tube([c[0] - px, c[1], c[2] - pz], [c[0] + px, c[1], c[2] + pz], 0.014, 0.014, timber, 4);
  }
}

// A palisade of sharpened stakes along a line of points, on the ground sampler.
function palisade(m, points, ground) {
  for (let s = 1; s < points.length; s++) {
    const [ax, az] = points[s - 1],
      [bx, bz] = points[s],
      n = Math.ceil(Math.hypot(bx - ax, bz - az) / 0.2);
    for (let i = 0; i < n; i++) {
      const x = ax + ((bx - ax) * i) / n,
        z = az + ((bz - az) * i) / n,
        y = ground(x, z),
        h = 0.62 + 0.08 * Math.sin(i * 2.7 + s);
      m.tube([x, y - 0.05, z], [x, y + h, z], 0.045, 0.04, i % 3 ? timber : oak, 5);
      m.tube([x, y + h, z], [x, y + h + 0.1, z], 0.04, 0.002, 0x8d7656, 5);
    }
    for (const h of [0.22, 0.48])
      m.tube([ax, ground(ax, az) + h, az], [bx, ground(bx, bz) + h, bz], 0.02, 0.02, 0x4f3e2e, 4);
  }
}

// Supply cart with sacks and a lashed crate.
function supplyCart(m, x, y, z, yaw) {
  m.frame(x, y, z, yaw, 1, () => {
    for (const q of [-1, 1]) {
      const az = q * 0.36,
        rad = 0.3;
      m.hoop(0, rad, az, rad, 0.03, 0x5c4a37, 14, 'xy');
      for (let j = 0; j < 8; j++) {
        const a = (circle * j) / 8;
        m.tube([0, rad, az], [Math.cos(a) * rad * 0.94, rad + Math.sin(a) * rad * 0.94, az], 0.014, 0.012, oak, 4);
      }
      m.tube([0, rad, az - 0.05], [0, rad, az + 0.05], 0.05, 0.045, timber, 6);
      m.tube([-0.55, 0.42, q * 0.27], [1.25, 0.1, q * 0.3], 0.03, 0.022, timber, 5);
    }
    m.tube([0, 0.3, -0.42], [0, 0.3, 0.42], 0.03, 0.03, iron, 6);
    m.box(-0.05, 0.43, 0, 1.0, 0.06, 0.62, 0x7b6346);
    for (const q of [-1, 1]) m.box(-0.05, 0.52, q * 0.3, 1.0, 0.13, 0.03, 0x6a543b);
    for (let i = 0; i < 4; i++)
      m.rock(-0.38 + (i % 2) * 0.28, 0.46, -0.14 + Math.floor(i / 2) * 0.28, 0.14, 0.15, 0.12, 0xa49478, 0xbbae92, 6);
    cargo(m, 0.28, 0.0, 0.34, 0x6b5640);
    m.frame(0.28, 0.4, 0, 0, 1, () => cargo(m, 0, 0, 0.34, 0x6b5640));
  });
}

// ---- Tiles of the board ---------------------------------------------------

const layout = mapLayout(6);
const kindAt = (col, row) => {
  if (layout.mask[row]?.[col] !== '#') return null;
  return layout.cells.find((c) => c.x === col && c.y === row)?.kind ?? null;
};
const wallRows = [3, 6];
// Which board cell the Model is drawing in: its frame sits on the tile centre.
function cellOf(m) {
  const e = m.matrix.elements;
  return [Math.round(e[12] + (layout.width - 1) / 2), Math.round(e[14] + (layout.height - 1) / 2)];
}
// A wall line continues into a neighbour that is rubble, cover or off the board.
function joins(col, row) {
  if (!wallRows.includes(row)) return false;
  const k = kindAt(col, row);
  return k === null || k === 'rock' || k === 'cover';
}
const flat = () => 0.035;

// Rock tiles (坍塌城磚): on the battlement lines, a broken stretch of wall;
// elsewhere a heap of brick and earth from a fallen merlon.
function ruinTile(m) {
  const r = m.rng,
    [col, row] = cellOf(m);
  if (wallRows.includes(row)) {
    const west = joins(col - 1, row),
      east = joins(col + 1, row);
    const x0 = west ? -0.5 : -0.3,
      x1 = east ? 0.5 : 0.3,
      zc = -0.06;
    let made;
    m.frame((x0 + x1) / 2, 0, zc, 0, 1, () => {
      made = cityWall(m, {
        length: x1 - x0,
        height: r.range(0.66, 0.84),
        base: 0.7,
        top: 0.52,
        ground: flat,
        loss: 0.22,
        burn: 0.15,
        phase: col * 1.7,
        ragged: 0.12,
        parapet: false,
        ends: [!west, !east],
        endFacing: false,
        course: 0.11,
        litter: 0
      });
    });
    // One merlon still stands on the north edge of some stretches.
    const crest = Math.min(...made.joint);
    if ((col + row) % 3 === 0 && crest > 0.5)
      m.box((x0 + x1) / 2, crest + 0.08, zc - 0.17, 0.24, 0.2, 0.13, r.pick(brick));
    for (const s of [-1, 1])
      for (let i = 0; i < 3; i++) {
        const sz = r.range(0.07, 0.12);
        m.frame(
          r.range(x0 + 0.05, x1 - 0.05),
          0.04 + sz * 0.2,
          zc + s * r.range(0.38, 0.45),
          r.range(0, circle),
          1,
          () => m.box(0, 0, 0, sz * 1.7, sz * 0.7, sz, r.pick(brick)),
          r.range(-0.3, 0.3)
        );
      }
    for (const [open, e] of [
      [!west, -1],
      [!east, 1]
    ])
      if (open)
        m.frame(e * 0.3, 0, zc, e > 0 ? Math.PI / 2 : -Math.PI / 2, 1, () =>
          rubbleFan(m, 0, 0.0, 0.3, 0.2, 0.32, flat, 6)
        );
    return;
  }
  m.rock(0, 0.02, -0.02, 0.42, 0.34, 0.36, 0x7f6a50, 0x8d7c62, 9);
  m.frame(0.02, 0.32, -0.05, 0.3, 1, () => m.box(0, 0, 0, 0.34, 0.24, 0.24, brick[2]), 0.25, 0.18);
  for (let i = 0; i < 9; i++) {
    const a = (i * circle) / 9 + r.range(-0.2, 0.2),
      d = r.range(0.12, 0.36),
      sz = r.range(0.08, 0.15);
    m.frame(
      Math.cos(a) * d,
      0.06 + (0.36 - d) * 0.7,
      Math.sin(a) * d * 0.85,
      r.range(0, circle),
      1,
      () => m.box(0, 0, 0, sz * 1.8, sz * 0.75, sz, m.mix(r.pick(brick), soot, r.next() * 0.3)),
      r.range(-0.5, 0.5),
      r.range(-0.4, 0.4)
    );
  }
  m.tube([-0.2, 0.2, 0.15], [0.32, 0.58, -0.2], 0.03, 0.025, charred, 5);
}

// Cover tiles (斷牆掩體): on the battlement lines the wall stands knee-high;
// elsewhere fallen merlons and a pavise make a breastwork at the back.
function breastwork(m) {
  const r = m.rng,
    [col, row] = cellOf(m);
  if (wallRows.includes(row)) {
    const west = joins(col - 1, row),
      east = joins(col + 1, row);
    const x0 = west ? -0.5 : -0.38,
      x1 = east ? 0.5 : 0.38;
    m.frame((x0 + x1) / 2, 0, -0.29, 0, 1, () =>
      cityWall(m, {
        length: x1 - x0,
        height: r.range(0.24, 0.3),
        base: 0.38,
        top: 0.32,
        ground: flat,
        loss: 0.2,
        burn: 0.25,
        phase: col,
        ragged: 0.05,
        parapet: false,
        ends: [!west, !east],
        course: 0.1,
        litter: 0
      })
    );
    for (let i = 0; i < 2; i++)
      m.frame(r.range(-0.3, 0.3), 0.33, -0.3, r.range(-0.4, 0.4), 1, () =>
        m.box(0, 0, 0, 0.18, 0.07, 0.1, r.pick(brick))
      );
    return;
  }
  for (let i = 0; i < 4; i++) {
    const x = -0.33 + 0.22 * i,
      z = -0.3 + 0.07 * Math.sin(i * 1.9 + col);
    m.frame(x, 0.04, z, r.range(-0.25, 0.25), 1, () => {
      m.box(0, 0.09, 0, 0.22, 0.18, 0.15, m.mix(r.pick(brick), soot, r.next() * 0.25));
      if (i % 2 === 0) m.box(0.01, 0.22, 0, 0.17, 0.09, 0.12, r.pick(brick));
    });
  }
  if ((col + row) % 2 === 0) {
    // A leaning pavise: planks, two battens and a painted face.
    m.frame(0.3, 0.04, -0.2, -0.35, 1, () => {
      for (let i = 0; i < 3; i++) m.box(-0.08 + i * 0.08, 0.17, 0, 0.075, 0.36, 0.025, i % 2 ? oak : 0x6c563c);
      for (const y of [0.08, 0.27]) m.box(0, y, -0.02, 0.25, 0.03, 0.02, timber);
      m.box(0, 0.2, 0.014, 0.12, 0.12, 0.006, red);
    }, -0.3, 0);
  } else shield(m, 0.32, 0.06, -0.12, 0.6, 0.15, 0.9, true);
  arrow(m, r.range(-0.3, 0.2), 0.12, -0.36, r.range(0, circle), 0.8, 0.26);
}

// Brush tiles (城根荒藤): bramble and dry vine at the wall roots.
function bramble(m) {
  const r = m.rng;
  const leaf = [0x4f5c34, 0x65693a, 0x7b7141, 0x5a5232, 0x7d6237];
  for (let j = 0; j < 8; j++) {
    const x = -0.36 + j * 0.1 + r.range(-0.04, 0.04),
      z = -0.3 + r.range(-0.08, 0.1),
      h = r.range(0.36, 0.64),
      lean = r.range(-0.12, 0.12);
    const stem = [
      [x, 0.04, z],
      [x + lean * 0.5, h * 0.6, z + 0.03],
      [x + lean, h, z + r.range(0.04, 0.12)],
      [x + lean * 1.6, h * 0.82, z + r.range(0.12, 0.2)]
    ];
    m.line(stem, 0.012, j % 2 ? 0x5a4632 : 0x6b5338, 4);
    for (let k = 0; k < 8; k++) {
      const t = 0.22 + k * 0.095,
        i = Math.min(2, Math.floor(t * 3)),
        f = t * 3 - i,
        a = stem[i],
        b = stem[i + 1],
        o = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f],
        ang = k * 2.4 + j,
        l = r.range(0.09, 0.15);
      m.leaf(o, [o[0] + Math.cos(ang) * l, o[1] + 0.03, o[2] + Math.sin(ang) * l], l * 0.34, r.pick(leaf), r.pick(leaf), 0.015);
    }
  }
  for (let k = 0; k < 7; k++) {
    const x = r.range(-0.4, 0.4),
      z = r.range(-0.42, -0.18),
      h = r.range(0.12, 0.24);
    orient(m, [[x - 0.02, 0.04, z], [x + 0.02, 0.04, z], [x + r.range(-0.06, 0.06), h, z + 0.03]], k % 2 ? 0x9c8c5a : 0x857a4c, [0, 0, 1]);
  }
}

// Crate tiles (軍械箱): arms chests, spears lashed against the stack.
function armsChest(m) {
  const r = m.rng;
  cargo(m, -0.075, -0.08, 0.72, 0x806a4f);
  m.frame(0.18, 0.59, 0.02, 0.17, 0.57, () => cargo(m, 0, 0, 0.68, 0x8b7354));
  for (let i = 0; i < 3; i++) {
    const x = -0.36 + i * 0.07;
    m.tube([x, 0.04, 0.24], [x + 0.05, 0.98 + r.range(0, 0.1), -0.22], 0.011, 0.01, 0x6f5a40, 4);
  }
  m.box(-0.075, 0.33, 0.215, 0.18, 0.1, 0.01, red);
}

// Plain tiles (城門甬道): worn grey flags, a few lost to the earth beneath,
// with the odd spent arrow in the joints.
function paving(m, x, z, p) {
  const r = m.rng;
  for (let j = 0; j < 3; j++) {
    const dz = z - 0.333 + j * 0.333,
      cuts = [0];
    let u = r.range(0.25, 0.45);
    while (u < 0.8) {
      cuts.push(u);
      u += r.range(0.28, 0.5);
    }
    cuts.push(1);
    for (let k = 0; k < cuts.length - 1; k++) {
      const a = x - 0.5 + cuts[k],
        b = x - 0.5 + cuts[k + 1],
        w = b - a - 0.016,
        cx = (a + b) / 2;
      if (r.next() < 0.05) {
        m.face(
          [
            [a + 0.01, 0.012, dz - 0.155],
            [a + 0.01, 0.012, dz + 0.155],
            [b - 0.01, 0.012, dz + 0.155],
            [b - 0.01, 0.012, dz - 0.155]
          ],
          0x6e6252
        );
        m.rock(cx + r.range(-0.05, 0.05), 0.01, dz, 0.04, 0.03, 0.03, 0x7a766d, 0x8f8b82, 5);
        continue;
      }
      const tone = m.mix(m.mix(p[0], p[1], r.next() * 0.6), r.pick([0x8c8577, 0x7d7b74, 0x958e7f]), r.next() * 0.35);
      flag(m, cx, dz, w, 0.318, tone, p[2], 0.035 - r.range(0, 0.008), r.range(0.02, 0.05));
    }
  }
  // Dry grass in a few of the joints.
  if (r.next() < 0.3)
    for (let k = 0; k < 3; k++) {
      const gx = x + r.range(-0.42, 0.42),
        gz = z - 0.5 + 0.333 * Math.ceil(r.range(0.01, 2.99)),
        h = r.range(0.05, 0.09);
      for (let b = 0; b < 3; b++)
        orient(
          m,
          [
            [gx + b * 0.025 - 0.035, 0.03, gz],
            [gx + b * 0.025 - 0.015, 0.03, gz],
            [gx + b * 0.03 - 0.03 + r.range(-0.02, 0.02), 0.03 + h, gz + r.range(-0.02, 0.02)]
          ],
          b % 2 ? 0x8a8458 : 0x6f7348,
          [0, 0, 1]
        );
    }
  if (r.next() < 0.22) {
    const ax = x + r.range(-0.35, 0.35),
      az = z + r.range(-0.35, 0.35);
    if (r.next() < 0.5) arrow(m, ax, 0.04, az, r.range(0, circle), r.range(0.6, 1.0), 0.2);
    else arrow(m, ax, 0.035, az, r.range(0, circle), 0.04, 0.3, false);
  }
}
function flag(m, x, z, w, d, top, base, hi, cut) {
  const a = w / 2,
    b = d / 2;
  const ring = [
    [-a + cut, -b],
    [-a, -b + cut],
    [-a, b - cut],
    [-a + cut, b],
    [a - cut, b],
    [a, b - cut],
    [a, -b + cut],
    [a - cut, -b]
  ];
  const cap = ring.map(([u, v]) => [x + u * 0.985, hi, z + v * 0.98]),
    low = ring.map(([u, v]) => [x + u, -0.04, z + v]);
  m.face(cap, top);
  const side = m.mix(top, base, 0.45);
  for (let i = 0; i < 8; i++) {
    const j = (i + 1) % 8;
    m.face([low[i], low[j], cap[j], cap[i]], side);
  }
}

export {
  orient,
  ladder,
  palisade,
  cityWall,
  wallAt,
  warShed,
  trebuchet,
  tent,
  deadFire,
  shield,
  arrow,
  weaponRack,
  abatis,
  supplyCart,
  ruinTile,
  breastwork,
  bramble,
  armsChest,
  paving,
  brick,
  earth,
  soot,
  timber,
  oak,
  charred,
  canvas,
  red
};
