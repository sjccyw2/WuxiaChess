// Bronze instruments of the terrace and the stepped water-clock. Each stands
// on a dressed stone plinth set into the flags (terrace face at y -0.29) and
// is its own occluder group, so the cutaway can fade it on its own.
// Bronze is dark in the body, green where water and rain collect, and worn
// bright on the edges hands and weather touch.
import { Model, circle } from '../scenery-kit.js';

const body = 0x4a4330,
  bronze = 0x6e5f3a,
  worn = 0xb7975a,
  verdigris = 0x4d8a78,
  stone = 0x667069,
  stoneLight = 0x858b83,
  stoneDark = 0x3f4a4a,
  water = 0x7fa9a4;
// Polar axis: celestial north is toward -z, at the latitude of the terrace.
const latitude = 0.61;
const pole = [0, Math.sin(latitude), -Math.cos(latitude)];

const add = (a, b, k = 1) => a.map((v, i) => v + b[i] * k);
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0]
];
const unit = (a) => {
  const l = Math.hypot(...a) || 1;
  return a.map((v) => v / l);
};

// Faces are wound so their normal points along `hint`; the shadow's normal
// offset pushes a face wound the other way into its own shadow.
function put(m, pts, col, hint) {
  const [a, b, c] = pts,
    u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]],
    v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const n = cross(u, v);
  if (n[0] * hint[0] + n[1] * hint[1] + n[2] * hint[2] < 0) {
    pts = [...pts].reverse();
    if (Array.isArray(col) && Array.isArray(col[0])) col = [...col].reverse();
  }
  m.face(pts, col);
}

// A dressed stone block with a bevelled, paler top arris.
function block(m, x, z, y0, y1, w, d, tone = stone, bevel = 0.035) {
  const top = m.mix(tone, stoneLight, 0.35),
    arris = m.mix(tone, 0xa6a99b, 0.45);
  const l = x - w / 2,
    r = x + w / 2,
    b = z - d / 2,
    f = z + d / 2;
  const hi = y1 - bevel;
  m.face(
    [
      [l + bevel, y1, b + bevel],
      [l + bevel, y1, f - bevel],
      [r - bevel, y1, f - bevel],
      [r - bevel, y1, b + bevel]
    ],
    top
  );
  const ring = [
    [l, b],
    [l, f],
    [r, f],
    [r, b]
  ];
  const inset = [
    [l + bevel, b + bevel],
    [l + bevel, f - bevel],
    [r - bevel, f - bevel],
    [r - bevel, b + bevel]
  ];
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    m.face(
      [
        [ring[i][0], hi, ring[i][1]],
        [ring[j][0], hi, ring[j][1]],
        [inset[j][0], y1, inset[j][1]],
        [inset[i][0], y1, inset[i][1]]
      ],
      arris
    );
    m.face(
      [
        [ring[i][0], y0, ring[i][1]],
        [ring[j][0], y0, ring[j][1]],
        [ring[j][0], hi, ring[j][1]],
        [ring[i][0], hi, ring[i][1]]
      ],
      [m.mix(tone, stoneDark, 0.45), m.mix(tone, stoneDark, 0.45), m.rgb(tone), m.rgb(tone)]
    );
  }
}
// A two-course plinth rising from the flags to `top`.
function plinth(m, w, d, top = 0.02, tone = stone) {
  const mid = -0.29 + (top + 0.29) * 0.48;
  block(m, 0, 0, -0.36, mid, w + 0.26, d + 0.26, m.mix(tone, stoneDark, 0.2));
  block(m, 0, 0, mid - 0.02, top, w, d, tone);
}
// A flat bronze ring of rectangular section in the plane of unit vectors u, v.
// `thick` is radial, `width` is across the plane. Broad faces stay dark and
// gather verdigris low down; the inner and outer rims are worn bright.
function band(m, c, u, v, radius, thick, width, n = 40, tint = bronze) {
  const normal = unit(cross(u, v));
  const point = (a, dr, dw) => {
    const cs = Math.cos(a),
      sn = Math.sin(a),
      rr = radius + dr;
    return add(add(add(c, u, cs * rr), v, sn * rr), normal, dw);
  };
  for (let i = 0; i < n; i++) {
    const a = (i * circle) / n,
      b = ((i + 1) * circle) / n;
    const low = (s) => {
      const y = u[1] * Math.cos(s) + v[1] * Math.sin(s);
      return m.mix(tint, verdigris, Math.max(0, -y) * 0.75);
    };
    const t = thick / 2,
      w = width / 2;
    const m0 = (a + b) / 2,
      radial = add(add([0, 0, 0], u, Math.cos(m0)), v, Math.sin(m0));
    const faces = [
      [[t, -w], [t, w], worn, radial],
      [[-t, w], [-t, -w], m.mix(worn, tint, 0.45), radial.map((x) => -x)],
      [[t, w], [-t, w], null, normal],
      [[-t, -w], [t, -w], null, normal.map((x) => -x)]
    ];
    for (const [[r0, w0], [r1, w1], col, hint] of faces) {
      const pa = point(a, r0, w0),
        pb = point(b, r0, w0),
        qb = point(b, r1, w1),
        qa = point(a, r1, w1);
      put(m, [pa, pb, qb, qa], col || [low(a), low(b), low(b), low(a)], hint);
    }
  }
}
// A turned vessel: profile rows are [height, radius, colour].
function turned(m, x, y, z, rows, n = 18) {
  let last;
  for (const [h, r, col] of rows) {
    const ring = [];
    for (let j = 0; j < n; j++) {
      const a = (j * circle) / n;
      ring.push([x + Math.cos(a) * r, y + h, z + Math.sin(a) * r]);
    }
    if (last)
      for (let j = 0; j < n; j++) {
        const q = (j + 1) % n;
        m.face([last.ring[j], ring[j], ring[q], last.ring[q]], [
          m.rgb(last.col),
          m.rgb(col),
          m.rgb(col),
          m.rgb(last.col)
        ]);
      }
    last = { ring, col };
  }
  return last;
}
function disc(m, x, y, z, r, col, n = 18) {
  const ring = [];
  for (let j = n - 1; j >= 0; j--) {
    const a = (j * circle) / n;
    ring.push([x + Math.cos(a) * r, y, z + Math.sin(a) * r]);
  }
  m.face(ring, col);
}

// 渾儀: a cross base with four pillars, the fixed horizon and meridian rings,
// the equatorial ring, the ecliptic, and the turning declination ring with
// its sighting tube about the polar axis.
function armillary(m) {
  plinth(m, 1.7, 1.7);
  for (const turn of [0, Math.PI / 2])
    m.frame(0, 0, 0, turn, 1, () => {
      block(m, 0, 0, 0.02, 0.15, 1.56, 0.15, bronze, 0.02);
      // The water-level channel along the top of the cross.
      m.box(0, 0.152, 0, 1.4, 0.004, 0.05, 0x5e8c84);
      for (const s of [-0.72, 0.72]) block(m, s, 0, 0.02, 0.2, 0.2, 0.22, body, 0.025);
    });
  const c = [0, 1.02, 0];
  for (const [x, z] of [
    [0.72, 0],
    [-0.72, 0],
    [0, 0.72],
    [0, -0.72]
  ]) {
    const k = 0.79 / 0.72;
    m.line(
      [
        [x, 0.2, z],
        [x * 0.96, 0.6, z * 0.96],
        [x * k, 1.0, z * k]
      ],
      0.042,
      verdigris,
      6
    );
    m.box(x * k, 1.0, z * k, 0.1, 0.06, 0.1, worn);
  }
  // A short cloud-shaped post carries the foot of the meridian ring.
  m.tube([0, 0.15, 0], [0, 0.28, 0], 0.07, 0.05, body, 6);
  band(m, c, [1, 0, 0], [0, 0, 1], 0.8, 0.13, 0.04, 44); // horizon
  band(m, c, [0, 0, 1], [0, 1, 0], 0.75, 0.06, 0.06, 44); // meridian
  const east = [1, 0, 0],
    up = unit(cross(pole, east));
  band(m, c, east, up, 0.68, 0.05, 0.05, 40, m.mix(bronze, worn, 0.15)); // equator
  const tilt = 0.41,
    eclipticUp = unit(add(add([0, 0, 0], up, Math.cos(tilt)), pole, Math.sin(tilt)));
  band(m, c, east, eclipticUp, 0.63, 0.04, 0.04, 40); // ecliptic
  const swing = 0.7,
    across = unit(add(add([0, 0, 0], east, Math.cos(swing)), up, Math.sin(swing)));
  band(m, c, pole, across, 0.55, 0.05, 0.035, 36, body); // declination
  m.tube(add(c, pole, -0.8), add(c, pole, 0.8), 0.022, 0.022, worn, 6);
  const sight = unit(add(add([0, 0, 0], pole, Math.cos(1.05)), across, Math.sin(1.05)));
  m.tube(add(c, sight, -0.53), add(c, sight, 0.53), 0.03, 0.03, bronze, 7);
  for (const s of [-1, 1]) m.tube(add(c, sight, s * 0.5), add(c, sight, s * 0.56), 0.036, 0.036, worn, 7);
}

// 圭表: a long stone scale laid north from a bronze gnomon column, with water
// channels to level it and a bronze strip down the middle bearing no marks.
function gnomon(m) {
  block(m, 0, -0.15, -0.36, -0.08, 0.98, 3.2, m.mix(stone, stoneDark, 0.2));
  block(m, 0, -0.2, -0.1, 0.13, 0.66, 2.9, stone);
  for (const x of [-0.25, 0.25]) m.box(x, 0.132, -0.3, 0.035, 0.004, 2.5, 0x5e8c84);
  m.box(0, 0.133, -0.45, 0.09, 0.004, 2.2, m.mix(bronze, worn, 0.4));
  block(m, 0, 1.05, 0.11, 0.42, 0.5, 0.46, stoneLight);
  block(m, 0, 1.05, 0.4, 0.5, 0.3, 0.3, body, 0.02);
  m.box(0, 1.47, 1.05, 0.15, 1.94, 0.15, bronze);
  for (const s of [-1, 1]) m.box(s * 0.078, 1.47, 1.05, 0.012, 1.94, 0.16, worn);
  m.box(0, 2.47, 1.05, 0.7, 0.07, 0.1, worn);
  for (const s of [-0.3, 0.3]) m.tube([s, 2.5, 1.05], [s, 2.62, 1.05], 0.03, 0.018, bronze, 6);
  // Two stays brace the column from the plinth.
  for (const s of [-1, 1])
    m.tube([s * 0.24, 0.42, 1.05], [s * 0.05, 1.3, 1.05], 0.025, 0.02, verdigris, 5);
}

// 日晷: a stone dial set parallel to the equator on a pedestal, the bronze pin
// along the polar axis. The face is left smooth.
function sundial(m) {
  plinth(m, 1.1, 1.1);
  block(m, 0, 0, 0.0, 0.8, 0.46, 0.46, stone);
  block(m, 0, 0, 0.78, 0.88, 0.62, 0.62, stoneLight);
  block(m, 0, 0.1, 0.86, 1.02, 0.3, 0.3, stone);
  const c = [0, 1.32, 0];
  const east = [1, 0, 0],
    up = unit(cross(pole, east));
  const n = 28,
    r = 0.6,
    t = 0.05;
  const rimA = [],
    rimB = [];
  for (let i = 0; i < n; i++) {
    const a = (i * circle) / n,
      p = add(add(c, east, Math.cos(a) * r), up, Math.sin(a) * r);
    rimA.push(add(p, pole, t));
    rimB.push(add(p, pole, -t));
  }
  m.face(rimA, m.mix(stoneLight, 0xa6a99b, 0.4));
  m.face([...rimB].reverse(), stone);
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    m.face([rimA[i], rimB[i], rimB[j], rimA[j]], stoneDark);
  }
  band(m, add(c, pole, t + 0.004), east, up, r - 0.02, 0.035, 0.012, 28, worn);
  m.tube(add(c, pole, -0.4), add(c, pole, 0.42), 0.017, 0.012, worn, 6);
}

// 渾象: the bronze star globe on its polar pins inside the meridian ring, the
// horizon ring held at the globe's waist by four bowed legs.
function globe(m) {
  plinth(m, 1.5, 1.5);
  const c = [0, 1.0, 0];
  for (const [x, z] of [
    [0.55, 0.55],
    [-0.55, 0.55],
    [-0.55, -0.55],
    [0.55, -0.55]
  ]) {
    m.box(x, 0.06, z, 0.18, 0.08, 0.18, body);
    m.line(
      [
        [x, 0.08, z],
        [x * 1.08, 0.5, z * 1.08],
        [x * 0.86, 0.96, z * 0.86]
      ],
      0.04,
      verdigris,
      6
    );
  }
  band(m, c, [1, 0, 0], [0, 0, 1], 0.72, 0.14, 0.035, 44); // horizon
  band(m, c, [0, 0, 1], [0, 1, 0], 0.6, 0.05, 0.05, 40); // meridian
  m.tube([0, 0.06, 0], [0, 0.4, 0], 0.08, 0.06, body, 6);
  const rows = [];
  for (let k = 0; k <= 10; k++) {
    const t = (k / 10) * Math.PI;
    const h = -Math.cos(t) * 0.52,
      r = Math.sin(t) * 0.52;
    rows.push([h, r, m.mix(verdigris, body, Math.min(1, k / 5))]);
  }
  m.frame(c[0], c[1], c[2], 0, 1, () => {
    m.frame(0, 0, 0, 0, 1, () => turned(m, 0, 0, 0, rows, 18), latitude - Math.PI / 2);
  });
  // Star studs.
  const r = m.rng;
  for (let i = 0; i < 26; i++) {
    const a = r.next() * circle,
      y = r.range(-0.2, 0.95);
    const s = Math.sqrt(1 - y * y);
    const p = add(c, [Math.cos(a) * s * 0.525, y * 0.525, Math.sin(a) * s * 0.525]);
    m.box(p[0], p[1], p[2], 0.022, 0.022, 0.022, 0xd8bd7a);
  }
  m.tube(add(c, pole, -0.66), add(c, pole, 0.66), 0.02, 0.02, worn, 6);
}

// 無字碑: a stele on a moulded base, its panel left without a word.
function stele(m) {
  plinth(m, 1.5, 0.86, 0.04, 0x5a666a);
  block(m, 0, 0, 0.02, 0.18, 1.32, 0.66, 0x56646a);
  block(m, 0, 0, 0.16, 0.34, 1.16, 0.5, 0x5f6c70);
  const slab = 0x55656c;
  block(m, 0, 0, 0.32, 2.25, 0.98, 0.3, slab, 0.03);
  // The blank panel sits a hair proud, framed by a narrow worn border.
  for (const s of [-1, 1]) {
    m.face(
      [
        [-0.36, 0.55, s * 0.152],
        [0.36, 0.55, s * 0.152],
        [0.36, 2.05, s * 0.152],
        [-0.36, 2.05, s * 0.152]
      ].map(([x, y, z]) => (s > 0 ? [x, y, z] : [-x, y, z])),
      m.mix(slab, 0x7c878a, 0.35)
    );
  }
  // Rounded head with coiled bands where dragons would be carved.
  const head = [];
  for (let i = 0; i <= 10; i++) {
    const a = (i / 10) * Math.PI;
    head.push([Math.cos(a) * 0.52, 2.25 + Math.sin(a) * 0.42]);
  }
  for (const s of [-1, 1])
    m.face(
      (s > 0 ? head : [...head].reverse()).map(([x, y]) => [x, y, s * 0.16]),
      m.mix(slab, 0x7c878a, 0.15)
    );
  for (let i = 0; i < head.length - 1; i++) {
    const [x0, y0] = head[i],
      [x1, y1] = head[i + 1];
    put(
      m,
      [
        [x0, y0, 0.16],
        [x1, y1, 0.16],
        [x1, y1, -0.16],
        [x0, y0, -0.16]
      ],
      m.mix(slab, 0x9aa19b, 0.3),
      [x0 + x1, y0 + y1 - 4.5, 0]
    );
  }
  for (const k of [0.62, 0.8])
    m.line(
      head.slice(1, -1).map(([x, y]) => [x * k, 2.25 + (y - 2.25) * k, 0.168]),
      0.02,
      m.mix(slab, 0x9aa19b, 0.25),
      4
    );
}

// 漏刻: three supply vessels on a stepped stone stand, each pouring through a
// dragon spout into the one below, and the receiving vessel whose float rod
// rises beside a bronze scale that bears no marks. In the clock's own frame
// the water runs toward +z, where the conduit takes the overflow.
function clock(m) {
  const x = -0.33;
  block(m, x, -0.45, -0.38, -0.1, 3.1, 3.2, m.mix(stone, stoneDark, 0.25));
  block(m, x, -0.45, -0.12, 0.02, 2.82, 2.92, stone);
  // Stand: three dressed piers, each a step higher toward the back.
  const tiers = [
    [0, 1.0, 0.0],
    [1.6, 1.6, -0.7],
    [2.2, 2.2, -1.4]
  ];
  for (const [, top, z] of tiers) {
    block(m, x, z, 0.0, top - 0.07, 1.2, 0.7, stone, 0.03);
    block(m, x, z, top - 0.09, top, 1.34, 0.8, stoneLight, 0.025);
    m.face(
      [
        [x - 0.42, 0.18, z + 0.352],
        [x + 0.42, 0.18, z + 0.352],
        [x + 0.42, top - 0.22, z + 0.352],
        [x - 0.42, top - 0.22, z + 0.352]
      ],
      m.mix(stone, stoneDark, 0.4)
    );
  }
  // Attendants' steps up the side of the stand.
  for (let i = 0; i < 7; i++)
    block(m, x + 0.86, 0.45 - i * 0.28, 0.0, 0.3 + i * 0.3, 0.5, 0.3, m.mix(stone, stoneLight, (i % 2) * 0.3), 0.02);
  const vessels = [
    [2.2, -1.4, 0.36, 0.6],
    [1.6, -0.7, 0.33, 0.55],
    [1.0, 0.0, 0.3, 0.5],
    [0.02, 0.62, 0.32, 1.0]
  ];
  vessels.forEach(([y, z, r, h], i) => {
    turned(m, x, y, z, [
      [0, r * 0.84, body],
      [0.05, r * 0.9, verdigris],
      [0.09, r, bronze],
      [h * 0.5, r * 1.02, body],
      [h - 0.08, r, bronze],
      [h - 0.05, r * 1.08, worn],
      [h, r * 1.08, worn],
      [h, r * 0.96, bronze],
      [h - 0.06, r * 0.94, verdigris]
    ]);
    disc(m, x, y + h - 0.07, z, r * 0.94, water);
    // Raised bands hold the handles.
    for (const s of [-1, 1]) m.tube([x + s * r, y + h * 0.62, z], [x + s * (r + 0.07), y + h * 0.62, z], 0.035, 0.035, worn, 5);
    if (i < 3) {
      // Siphon spout with a dragon head, pouring into the next vessel.
      const [ny, nz, , nh] = vessels[i + 1];
      const from = [x, y + 0.14, z + r * 0.95],
        mouth = [x, y + 0.1, nz - 0.08];
      m.tube(from, mouth, 0.032, 0.03, bronze, 6);
      m.tube(mouth, [x, mouth[1] - 0.02, mouth[2] + 0.07], 0.05, 0.03, worn, 6);
      m.tube([x, mouth[1] + 0.03, mouth[2]], [x, mouth[1] + 0.09, mouth[2] - 0.05], 0.014, 0.008, worn, 4);
      m.line(
        [
          [x, mouth[1] - 0.04, mouth[2] + 0.06],
          [x, ny + nh - 0.07, mouth[2] + 0.08]
        ],
        0.011,
        0xa8cfca,
        4
      );
    }
  });
  // Receiving vessel: lid, float rod, and the blank scale in its frame.
  const [ry, rz, rr, rh] = vessels[3];
  disc(m, x, ry + rh + 0.005, rz, rr * 1.08, bronze);
  m.tube([x, ry + rh, rz], [x, ry + rh + 0.06, rz], 0.06, 0.05, worn, 6);
  m.tube([x, ry + rh, rz], [x, 2.66, rz], 0.02, 0.018, worn, 6);
  m.box(x + 0.09, 2.0, rz, 0.13, 1.6, 0.022, m.mix(bronze, worn, 0.55));
  for (const s of [-1, 1]) m.box(x + 0.09 + s * 0.067, 2.0, rz, 0.012, 1.62, 0.03, worn);
  for (const s of [-1, 1]) m.tube([x + s * 0.28, ry + rh, rz - 0.06], [x + s * 0.28, 2.84, rz - 0.06], 0.026, 0.022, body, 6);
  m.box(x, 2.86, rz - 0.06, 0.66, 0.06, 0.07, worn);
  m.box(x + 0.09, 2.8, rz, 0.17, 0.05, 0.05, bronze);
  // Overflow to the conduit.
  m.tube([x, 0.93, rz + rr * 0.95], [x, 0.93, 1.2], 0.05, 0.05, bronze, 6);
  // A pair of stone lanterns lights the clock from in front.
  for (const sx of [-1.55, 0.95]) {
    block(m, x + sx + 0.33, 0.85, 0.02, 0.12, 0.34, 0.34, stone);
    m.box(x + sx + 0.33, 0.45, 0.85, 0.16, 0.66, 0.16, stone);
    m.box(x + sx + 0.33, 0.8, 0.85, 0.3, 0.05, 0.3, stoneLight);
    m.glow(() => m.box(x + sx + 0.33, 0.93, 0.85, 0.16, 0.18, 0.16, 0xf2c98a));
    m.lathe(x + sx + 0.33, 1.02, 0.85, [[0, 0.23], [0.04, 0.19], [0.16, 0.04], [0.2, 0]], 0x5d6662, 4);
  }
}
// World positions of the clock's two lanterns, for the painted lamplight.
const clockPose = { x: -9.8, z: 5.33, yaw: 0.94, scale: 1.02 };
function clockLamps() {
  const { x, z, yaw, scale } = clockPose,
    c = Math.cos(yaw),
    s = Math.sin(yaw);
  return [-1.55, 0.95].map((sx) => {
    const lx = sx,
      lz = 0.85;
    return [x + scale * (lx * c + lz * s), 0.93 * scale, z + scale * (-lx * s + lz * c)];
  });
}

function instruments9(T) {
  const out = [];
  const make = (name, seed, x, z, yaw, draw, scale = 1) => {
    const m = new Model(T, seed);
    draw(m);
    const g = m.finish(name, { occluder: true });
    g.position.set(x, 0, z);
    g.rotation.y = yaw;
    g.scale.setScalar(scale);
    out.push(g);
  };
  make('古銅四時漏刻', 9101, clockPose.x, clockPose.z, clockPose.yaw, clock, clockPose.scale);
  make('東臺渾儀', 9102, 8.47, -3.12, 0, armillary);
  make('北臺圭表', 9103, 6.11, -8.72, 0, gnomon);
  make('西北日晷', 9104, -7.32, -8.39, 0, sundial);
  make('西臺渾象', 9105, -8.5, -1.45, 0, globe);
  make('無字碑', 9106, 0.52, -9.11, 0, stele);
  return out;
}

export { instruments9, clockLamps };
