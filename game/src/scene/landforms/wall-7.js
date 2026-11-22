import { Model, circle } from '../scenery-kit.js';
import { lightField } from './cave-7.js';
import {
  rgb,
  blend,
  smooth,
  waterLine,
  toViewer,
  wallHeight,
  wallFace,
  onWall,
  passageLights,
  drip
} from './kit-7.js';

// Dressing hung on the cave wall of 寒玉石室: stalactites under its courses,
// seams of cold jade running through the grey rock, rime on every ledge,
// glowing moss at the waterline, the side passages that lead off from the
// lake into the dark, a lower gallery cut along the back wall, a frozen
// cascade where a spring once came down the rock, and the old columns that
// have grown up from the lake to meet the wall.
//
// The wall is drawn from inside only, so that it vanishes whenever the camera
// stands behind it; everything here is pinned to the part of the wall it hangs
// on and vanishes with it (see pinned below).

// Bearings kept clear of stalactites and veins for the larger works.
const passages = passageLights.filter(([a]) => a !== -1.62).map(([a]) => a);
const gallery = { a: -1.62, span: 0.21, floor: 1.42 };
const cascade = { a: -2.5, span: 0.075, top: 4.6 };
const clear = (a, pad = 0) => {
  const near = (b, w) => Math.abs(((a - b + circle * 1.5) % circle) - Math.PI) < w + pad;
  return !(
    passages.some((b) => near(b, 0.1)) ||
    near(gallery.a, gallery.span + 0.04) ||
    near(cascade.a, cascade.span + 0.04)
  );
};

// Records, for every vertex drawn inside `at`, the wall face it belongs to.
class Pins {
  constructor(m) {
    this.m = m;
    this.centre = [[], []];
    this.facing = [[], []];
  }
  at(spot, draw) {
    const parts = this.m.parts,
      before = parts.map((p) => p.p.length / 3);
    draw();
    parts.forEach((p, k) => {
      for (let v = before[k]; v < p.p.length / 3; v++) {
        this.centre[k].push(...spot.p);
        this.facing[k].push(...spot.n);
      }
    });
  }
}
// The same test as the wall's own (drawnFromInside in cave-7.js), made with
// the face each piece hangs on, so that a stalactite goes when its wall goes.
// As there, the software renderer gets a collapsed copy of the stone; the
// glowing part keeps its true shape so the halo layer can find it.
function pinned(T, group, pins) {
  group.traverse((mesh) => {
    if (!mesh.isMesh) return;
    const k = mesh.material.name === 'Maze_Luminous' ? 1 : 0,
      g = mesh.geometry,
      shape = g.attributes.position;
    g.setAttribute('caveShape', shape);
    g.setAttribute('caveCentre', new T.Float32BufferAttribute(pins.centre[k], 3));
    g.setAttribute('caveFacing', new T.Float32BufferAttribute(pins.facing[k], 3));
    if (!k) {
      const hidden = new Float32Array(shape.count * 3);
      for (let i = 1; i < hidden.length; i += 3) hidden[i] = -400;
      g.setAttribute('position', new T.Float32BufferAttribute(hidden, 3));
      g.boundingSphere = new T.Sphere(new T.Vector3(0, 3, 0), 30);
    }
    const mat = mesh.material;
    mat.fog = false;
    // The glowing seams light themselves from their own colours, but with no
    // emissive set on the material: the halo layer, which cannot tell when a
    // wall is hidden, would otherwise hang their halos in the open air.
    if (k) mat.emissive.setHex(0);
    mat.onBeforeCompile = (shader) => {
      if (k)
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <emissivemap_fragment>',
          '#include <emissivemap_fragment>\n totalEmissiveRadiance += vColor.rgb * .62;'
        );
      shader.vertexShader =
        'attribute vec3 caveShape, caveCentre, caveFacing;\n' +
        shader.vertexShader
          .replace('#include <begin_vertex>', 'vec3 transformed = caveShape;')
          .replace(
            '#include <project_vertex>',
            `#include <project_vertex>
            vec3 caveEye = normalize(cameraPosition - (modelMatrix * vec4(caveCentre, 1.)).xyz);
            vec3 caveTurn = normalize(mat3(modelMatrix) * caveFacing);
            if (dot(caveTurn, caveEye) < .2) gl_Position = vec4(2., 2., 2., 1.);`
          );
    };
  });
}

// Wall colour at a height, as caveWall paints it, before the light field.
function rockTone(a, y) {
  const band = 0.5 + 0.5 * Math.sin(y * 2.9 + 0.7 * Math.sin(a * 4));
  let c = blend(rgb(0x223236), rgb(0x3d5253), 0.2 + 0.6 * band);
  return blend(c, rgb(0x0b1316), 0.85 * smooth(1.0, wallHeight(a), y));
}

// ---------------------------------------------------------------------------
// Stalactites: clustered under the courses, longest at the back of the cave.
function stalactites(m, pins, lit) {
  const r = m.rng,
    frost = rgb(0xb7cec9);
  let a = 0;
  while (a < circle) {
    a += r.range(0.025, 0.07);
    if (!clear(a, 0.03)) continue;
    const facing = Math.cos(a) * toViewer[0] + Math.sin(a) * toViewer[1],
      back = smooth(-0.3, 0.8, -facing),
      H = wallHeight(a);
    const y = r.range(0.3, H * (0.45 + 0.3 * back));
    const big = r.next() < 0.18 + 0.2 * back;
    const len = (big ? r.range(0.7, 1.9) : r.range(0.18, 0.7)) * (0.7 + 0.5 * back);
    const rad = big ? r.range(0.14, 0.3) : r.range(0.05, 0.13);
    const brood = big ? 2 + Math.floor(r.next() * 3) : 0;
    for (let j = 0; j <= brood; j++) {
      const b = a + (j ? r.range(-0.03, 0.03) : 0),
        yy = y + (j ? r.range(-0.15, 0.1) : 0),
        rr = j ? rad * r.range(0.3, 0.55) : rad,
        ll = j ? len * r.range(0.25, 0.6) : len;
      const spot = onWall(b, yy, rr * 0.55);
      const base = rockTone(b, yy);
      const tip = lit(spot.p[0], yy - ll, spot.p[2], blend(base, frost, 0.75));
      pins.at(spot, () =>
        drip(m, spot.p, -ll, rr, lit(spot.p[0], yy, spot.p[2], base), tip, rr > 0.12 ? 7 : 5)
      );
    }
  }
}

// Seams of cold jade wandering down the bedding, with a nodule here and there.
function jadeVeins(m, pins) {
  const r = m.rng;
  const core = rgb(0x6fd9b3),
    pale = rgb(0xc2f2dd),
    deep = rgb(0x2f8f78);
  for (let v = 0; v < 44; v++) {
    let a = r.range(0, circle),
      y = r.range(-0.4, 4.6);
    if (!clear(a, 0.05)) continue;
    const steps = 10 + Math.floor(r.next() * 22),
      dip = r.range(-0.9, 0.9),
      phase = r.range(0, circle),
      width = r.range(0.018, 0.05);
    let prev;
    for (let i = 0; i <= steps; i++) {
      const R = wallFace(a, y);
      const da = 0.22 / R,
        dy = 0.22 * (dip + 0.22 * Math.sin(i * 0.37 + phase) + r.range(-0.3, 0.3));
      const spot = onWall(a, y, 0.045);
      const w = width * (0.35 + Math.abs(Math.sin((Math.PI * i) / steps)) ** 0.6);
      const up = [0, 1, 0];
      // Across the seam: the wall's up direction leaned with the face.
      const side = [up[0] * w, up[1] * w, up[2] * w];
      const now = [
        spot.p.map((q, k) => q + side[k]),
        spot.p.map((q, k) => q - side[k])
      ];
      if (prev && y > waterLine + 0.4 && clear(a, 0.02)) {
        const t = 0.5 + 0.5 * Math.sin(i * 0.9 + phase);
        const c = blend(core, pale, 0.35 * t);
        pins.at(spot, () =>
          m.glow(() => m.face([prev[0], now[0], now[1], prev[1]], [deep, c, c, deep]))
        );
        if (i % 7 === 3)
          pins.at(spot, () =>
            m.glow(() =>
              m.frame(spot.p[0], spot.p[1], spot.p[2], -a + Math.PI / 2, 1, () =>
                m.crystal(0, -0.02, 0, w * 1.4, w * 4.5, 0x2f8f78, 0xc2f2dd, 5, 0),
                1.25
              )
            )
          );
      }
      prev = now;
      a += da;
      y += dy;
    }
  }
}

// Hoarfrost along the courses: a pale band with a fringe of tiny teeth.
function rime(m, pins, lit) {
  const r = m.rng,
    frost = rgb(0xc9dcd8),
    blue = rgb(0x9bb8b6);
  for (let s = 0; s < 70; s++) {
    const a0 = r.range(0, circle),
      span = r.range(0.12, 0.55),
      H = wallHeight(a0);
    const k = 1 + Math.floor(r.next() * 7);
    const y = waterLine + 0.36 + (k / 11) * (H - waterLine - 0.36);
    if (y > 5.2) continue;
    const n = Math.ceil(span / 0.035);
    let prev;
    for (let i = 0; i <= n; i++) {
      const a = a0 + (span * i) / n;
      if (!clear(a)) {
        prev = null;
        continue;
      }
      const thick = 0.04 + 0.05 * Math.abs(Math.sin((Math.PI * i) / n)) ** 0.5;
      const hi = onWall(a, y + thick * 0.6, 0.035),
        lo = onWall(a, y - thick, 0.035);
      const c = lit(hi.p[0], y, hi.p[2], blend(blue, frost, 0.5 + 0.5 * Math.sin(i * 1.7)));
      const now = { hi: hi.p, lo: lo.p, c };
      if (prev) {
        pins.at(hi, () => {
          m.face([prev.lo, lo.p, hi.p, prev.hi], [prev.c, c, c, prev.c]);
          if (i % 2) {
            const tip = onWall(a - 0.012, y - thick - r.range(0.05, 0.16), 0.05).p;
            m.face([prev.lo, tip, lo.p], [c, frost, c]);
          }
        });
      }
      prev = now;
    }
  }
}

// Luminous moss and pale lime crust on the talus just above the black water.
function waterMoss(m, pins) {
  const r = m.rng;
  for (let s = 0; s < 150; s++) {
    const a = r.range(0, circle);
    if (!clear(a)) continue;
    const y = waterLine + r.range(0.03, 0.3),
      spot = onWall(a, y, 0.03);
    const n = 5 + Math.floor(r.next() * 3),
      size = r.range(0.05, 0.14);
    const tang = [-Math.sin(a), 0, Math.cos(a)];
    const glowy = r.next() < 0.6;
    const col = glowy ? blend(rgb(0x4fbf8e), rgb(0x9fe6c0), r.next()) : rgb(0x9fb7ad);
    const ring = [];
    for (let j = 0; j < n; j++) {
      const t = (j * circle) / n,
        q = size * r.range(0.6, 1.1),
        u = Math.cos(t) * q * 1.6,
        v = Math.sin(t) * q * 0.7;
      ring.push([
        spot.p[0] + tang[0] * u + spot.in[0] * 0.02 * Math.sin(t),
        spot.p[1] + v,
        spot.p[2] + tang[2] * u + spot.in[2] * 0.02 * Math.sin(t)
      ]);
    }
    pins.at(spot, () => (glowy ? m.glow(() => m.face(ring, col)) : m.face(ring, col)));
  }
}

// ---------------------------------------------------------------------------
// A dressed doorway at the water's edge, its passage running into the dark,
// one stone leaf shut and the other ajar, the stair going down into the lake.
function doorway(m, pins, lit, a, salt) {
  const r = m.rng,
    top = 1.15;
  // The porch stands clear of the leaning face all the way up the jambs.
  let face = 99;
  for (let y = waterLine + 0.4; y <= top + 0.4; y += 0.1) face = Math.min(face, wallFace(a, y));
  const back = face - 0.06,
    ca = Math.cos(a),
    sa = Math.sin(a);
  const x0 = ca * back,
    z0 = sa * back,
    yaw = Math.atan2(-ca, -sa);
  const spot = onWall(a, 0, 0.2);
  const floor = -0.62;
  const dressed = 0x6c827d,
    pale = 0x95ab9f,
    dark = 0x3b4e50,
    black = 0x040809;
  pins.at(spot, () =>
    m.frame(x0, floor, z0, yaw, 1, () => {
      // Plinth, reaching back under the wall's foot, and the stair.
      m.box(0, -0.35, 0.05, 2.05, 0.7, 1.3, dark);
      m.box(0, 0.02, 0.2, 1.9, 0.05, 0.95, 0x7f948c);
      for (let s = 0; s < 5; s++)
        m.box(0, -0.1 - s * 0.13, 0.82 + s * 0.24, 1.32 - s * 0.03, 0.13, 0.26, s % 2 ? 0x748a83 : 0x6a807a);
      // The jambs, a deep reveal and the black of the passage.
      for (const s of [-1, 1]) {
        m.box(s * 0.66, 0.92, 0.06, 0.26, 1.8, 0.4, dressed);
        m.box(s * 0.66, 0.08, 0.1, 0.34, 0.12, 0.48, pale);
        m.box(s * 0.5, 0.86, -0.03, 0.06, 1.62, 0.3, dark);
        // A carved panel of cloud bands down each jamb.
        for (let j = 0; j < 4; j++)
          m.box(s * 0.66, 0.42 + j * 0.34, 0.265, 0.16 - (j % 2) * 0.05, 0.05, 0.02, pale);
      }
      m.face(
        [
          [-0.53, 0.05, -0.09],
          [0.53, 0.05, -0.09],
          [0.53, 1.7, -0.09],
          [-0.53, 1.7, -0.09]
        ],
        black
      );
      // Paving of the passage floor going back into the dark.
      for (let j = 0; j < 3; j++)
        m.box(0, 0.05, 0.02 - j * 0.03, 1.0, 0.02, 0.06, blend(rgb(0x3e5252), rgb(black), j / 3));
      // Lintel with a frieze of bosses and an inscribed plaque above it.
      m.box(0, 1.94, 0.08, 1.86, 0.3, 0.46, dressed);
      m.box(0, 2.12, 0.1, 2.0, 0.07, 0.52, pale);
      for (let j = 0; j < 7; j++)
        m.box(-0.72 + j * 0.24, 1.94, 0.32, 0.1, 0.1, 0.03, j % 2 ? pale : 0x58706b);
      m.box(0, 2.42, 0.06, 0.62, 0.42, 0.08, 0x5b716c);
      m.box(0, 2.42, 0.105, 0.5, 0.32, 0.02, 0x86a094);
      for (let j = 0; j < 3; j++) m.box(0, 2.53 - j * 0.1, 0.12, 0.08, 0.06, 0.01, 0x324446);
      // The stone leaves: one shut, one swung half open on its pivot.
      m.box(0.26, 0.88, -0.02, 0.5, 1.62, 0.09, 0x5f7671);
      m.box(0.26, 0.88, 0.03, 0.4, 1.4, 0.01, 0x6f8781);
      m.hoop(0.07, 0.86, 0.04, 0.05, 0.01, 0x2f3638, 8, 'xy');
      m.frame(-0.5, 0.88, -0.02, -0.85 - 0.25 * Math.sin(salt), 1, () => {
        m.box(0.25, 0, 0, 0.5, 1.62, 0.09, 0x5f7671);
        m.box(0.25, 0, 0.05, 0.4, 1.4, 0.01, 0x6f8781);
        m.hoop(0.44, -0.02, 0.06, 0.05, 0.01, 0x2f3638, 8, 'xy');
      });
      // Icicles off the lintel and the plaque.
      for (let j = 0; j < 9; j++) {
        const x = -0.85 + j * 0.21 + r.range(-0.04, 0.04);
        drip(m, [x, 1.79, 0.29 + r.range(-0.03, 0.03)], -r.range(0.08, 0.32), r.range(0.015, 0.03), rgb(0xa9c3c0), rgb(0xe3f0ef), 5);
      }
      m.box(0, 2.165, 0.12, 1.96, 0.012, 0.42, 0xd2e2df);
      // A jade lamp far down the passage, and a nearer one at its mouth.
      m.glow(() => {
        m.crystal(0.18, 0.62, -0.08, 0.025, 0.07, 0x3b9c80, 0xbff0da, 5, 0);
        m.crystal(-0.92, 0.95, 0.38, 0.05, 0.16, 0x3b9c80, 0xc8f4e0, 6, 0);
      });
      m.lathe(-0.92, 0.72, 0.38, [[0, 0.07], [0.06, 0.1], [0.18, 0.08], [0.23, 0.11], [0.25, 0.02]], 0x6e8a80, 8);
      m.box(-0.92, 0.5, 0.38, 0.14, 0.44, 0.14, dark);
    })
  );
}

// The lower gallery: a ledge cut along the back wall with arched bays, a
// balustrade and a stair running down along the rock to the water.
function lowerGallery(m, pins, lit) {
  const { a, span, floor } = gallery,
    bays = 6,
    stone = rgb(0x5d736f),
    pale = rgb(0x91a89c),
    black = rgb(0x040809);
  const sample = (b, y, off) => onWall(b, y, off);
  // The ledge, carried on corbels, its front edge and balustrade.
  const n = 24;
  for (let i = 0; i < n; i++) {
    const b0 = a - span + (2 * span * i) / n,
      b1 = a - span + (2 * span * (i + 1)) / n;
    const s0 = sample(b0, floor + 1.6, 0.04),
      s1 = sample(b1, floor + 1.6, 0.04);
    const inner0 = sample(b0, floor, 0).p,
      inner1 = sample(b1, floor, 0).p;
    const out = (s, d) => [s.p[0] + s.in[0] * d, floor, s.p[2] + s.in[2] * d];
    const o0 = out(s0, 0.75),
      o1 = out(s1, 0.75);
    const lip = (p, dy) => [p[0], p[1] + dy, p[2]];
    pins.at(s0, () => {
      m.face([lip(inner0, 0.02), lip(inner1, 0.02), lip(o1, 0.02), lip(o0, 0.02)].reverse(), lit(o0[0], floor, o0[2], pale));
      m.face([lip(o0, 0.02), lip(o1, 0.02), lip(o1, -0.16), lip(o0, -0.16)], lit(o0[0], floor, o0[2], stone));
      m.face([lip(o0, -0.16), lip(o1, -0.16), lip(inner1, -0.3), lip(inner0, -0.3)], blend(stone, black, 0.4));
      if (i % 4 === 0) {
        // Corbel and a baluster with a frosted rail.
        const c = out(s0, 0.4);
        m.box(c[0], floor - 0.42, c[2], 0.16, 0.36, 0.16, 0x4b605e);
        m.box(o0[0], floor + 0.2, o0[2], 0.08, 0.38, 0.08, 0x8ea497);
      }
      const r0 = lip(o0, 0.4),
        r1 = lip(o1, 0.4);
      m.tube(r0, r1, 0.03, 0.03, 0x87a094, 5);
      m.tube(lip(r0, 0.035), lip(r1, 0.035), 0.012, 0.012, 0xd0e1dd, 4);
    });
  }
  // Arched bays: pillars standing in front of black openings.
  for (let j = 0; j <= bays; j++) {
    const b = a - span + (2 * span * j) / bays;
    const s = sample(b, floor + 1.5, 0.08);
    const base = [s.p[0], floor, s.p[2]];
    pins.at(s, () => {
      m.tube(base, [base[0], floor + 1.18, base[2]], 0.085, 0.075, 0x6c827c, 8);
      m.box(base[0], floor + 0.05, base[2], 0.24, 0.1, 0.24, 0x8ea497);
      m.box(base[0], floor + 1.22, base[2], 0.22, 0.08, 0.22, 0x8ea497);
    });
    if (j === bays) break;
    const c = a - span + (2 * span * (j + 0.5)) / bays,
      w = span / bays;
    const arch = [];
    for (let k = 0; k <= 8; k++) {
      const t = (Math.PI * k) / 8,
        bb = c - Math.cos(t) * w * 0.86;
      const y = floor + 0.9 + Math.sin(t) * 0.36;
      arch.push(sample(bb, y, 0.03).p);
    }
    const sill0 = sample(c - w * 0.86, floor + 0.02, 0.03).p,
      sill1 = sample(c + w * 0.86, floor + 0.02, 0.03).p;
    const sc = sample(c, floor + 1.0, 0.03);
    pins.at(sc, () => {
      m.face([sill1, ...arch.slice().reverse(), sill0], black);
      // A voussoir ring round the arch.
      for (let k = 0; k < 8; k++) {
        const p0 = arch[k],
          p1 = arch[k + 1];
        const up = (p, d) => [p[0] + sc.in[0] * 0.02, p[1] + d, p[2] + sc.in[2] * 0.02];
        m.face([p0, p1, up(p1, 0.09), up(p0, 0.09)], k % 2 ? 0x8aa196 : 0x6f877f);
      }
    });
  }
  // Jade lamps at each end of the ledge.
  for (const side of [-1, 1]) {
    const s = sample(a + side * span * 0.82, floor + 1.2, 0.45);
    pins.at(s, () => {
      m.lathe(s.p[0], floor, s.p[2], [[0, 0.09], [0.08, 0.06], [0.42, 0.04], [0.46, 0.1], [0.52, 0.08]], 0x6e8a80, 8);
      m.glow(() => m.crystal(s.p[0], floor + 0.5, s.p[2], 0.06, 0.2, 0x3b9c80, 0xc8f4e0, 6, 0));
    });
  }
  // The stair: blocks set into the rock, running down to the lake.
  for (let k = 0; k < 13; k++) {
    const b = a + span + 0.03 + k * 0.022,
      y = floor - 0.12 - k * 0.165;
    if (y < waterLine - 0.25) break;
    const s = sample(b, y + 1.0, 0.0);
    const p = [s.p[0] + s.in[0] * 0.35, y, s.p[2] + s.in[2] * 0.35];
    pins.at(s, () =>
      m.frame(p[0], y, p[2], Math.atan2(-Math.cos(b), -Math.sin(b)), 1, () => {
        m.box(0, -0.12, 0.0, 0.34, 0.24, 0.9, k % 2 ? 0x6c837c : 0x627974);
        m.box(0, 0.005, 0.1, 0.32, 0.012, 0.6, 0xc7d9d5);
      })
    );
  }
}

// A frozen cascade: ribbed ice poured down the rock into a mound at the water.
function frozenFall(m, pins, lit) {
  const { a, span, top } = cascade,
    cols = 18,
    rows = 16;
  const ice = rgb(0xa6c8cb),
    white = rgb(0xe2f0f0),
    shade = rgb(0x5f8790);
  const grid = [];
  for (let i = 0; i <= cols; i++) {
    const u = i / cols,
      b = a - span + 2 * span * u;
    const edge = Math.abs(Math.sin(Math.PI * u)) ** 0.5;
    const rib = 0.06 + 0.07 * Math.abs(Math.sin(i * 1.9));
    const col = [];
    for (let k = 0; k <= rows; k++) {
      const t = k / rows,
        y = top - (top - waterLine + 0.05) * t;
      // Narrow at the lip, spreading as it falls, and thick where it ponds.
      const width = 0.45 + 0.55 * t;
      const bb = a + (b - a) * width;
      const thick = (0.03 + rib * edge) * (0.6 + 0.8 * t) + 0.25 * smooth(0.82, 1, t) * edge;
      const s = onWall(bb, y, thick + 0.02);
      const c = blend(blend(shade, ice, 0.4 + 0.6 * edge), white, (i % 2 ? 0.45 : 0.15) * (1 - t * 0.5));
      col.push({ p: s.p, c: lit(s.p[0], y, s.p[2], c), s });
    }
    grid.push(col);
  }
  for (let i = 0; i < cols; i++)
    for (let k = 0; k < rows; k++) {
      const A = grid[i][k],
        B = grid[i + 1][k],
        C = grid[i + 1][k + 1],
        D = grid[i][k + 1];
      pins.at(A.s, () => m.face([A.p, D.p, C.p, B.p], [A.c, D.c, C.c, B.c]));
    }
  // Icicles fringing the lip above, and a scatter of ice at the foot.
  const r = m.rng;
  for (let j = 0; j < 14; j++) {
    const b = a + r.range(-span * 0.6, span * 0.6),
      s = onWall(b, top + 0.05, 0.05);
    pins.at(s, () => drip(m, s.p, -r.range(0.2, 0.7), r.range(0.03, 0.07), ice, white, 5));
  }
  for (let j = 0; j < 7; j++) {
    const b = a + r.range(-span * 1.4, span * 1.4),
      s = onWall(b, waterLine, r.range(0.5, 1.2));
    pins.at(s, () =>
      m.rock(s.p[0], waterLine - 0.1, s.p[2], r.range(0.12, 0.3), r.range(0.15, 0.32), r.range(0.12, 0.25), 0x9fc1c4, 0xe0eeee, 6)
    );
  }
}

// Columns: a stalagmite and its stalactite met long ago, the shaft fluted
// and ringed, leaning back to flare into the wall above the lake.
function columns(m, pins) {
  const wet = rgb(0x354a4d),
    stone = rgb(0x50696a),
    pale = rgb(0xa9beb6);
  for (const a of [-2.7, -2.3, -0.72, 3.05, 2.42, -1.08]) {
    const foot = wallFace(a, waterLine) - 0.95,
      x = Math.cos(a) * foot,
      z = Math.sin(a) * foot;
    const top = onWall(a, 6.2, -0.25).p,
      spot = onWall(a, 2.0, 0);
    const n = 10,
      rings = 16;
    let prev;
    pins.at(spot, () => {
      for (let k = 0; k <= rings; k++) {
        const t = k / rings,
          y = waterLine - 0.06 + (top[1] - waterLine + 0.06) * t;
        const cx = x + (top[0] - x) * t ** 2.4,
          cz = z + (top[2] - z) * t ** 2.4;
        const waist = 0.24 + 0.42 * (1 - t) ** 3 + 0.5 * t ** 4 + (k % 2 ? 0.035 : 0);
        let c = blend(blend(wet, stone, smooth(0, 0.2, t)), pale, 0.4 * Math.sin(t * Math.PI));
        c = blend(c, rgb(0x0e181b), smooth(2.5, 6.5, y));
        const ring = [];
        for (let j = 0; j < n; j++) {
          const q = (j * circle) / n,
            flute = 1 + 0.12 * Math.sin(q * 5 + t * 3);
          ring.push([cx + Math.cos(q) * waist * flute, y, cz + Math.sin(q) * waist * flute]);
        }
        if (prev)
          for (let j = 0; j < n; j++) {
            const q = (j + 1) % n;
            m.face([prev.ring[j], ring[j], ring[q], prev.ring[q]], [prev.c, c, c, prev.c]);
          }
        prev = { ring, c };
      }
      m.lathe(x, waterLine + 0.008, z, [[0, 0.82], [0.014, 0.72], [0.024, 0.64]], 0x7f9c96, 14);
    });
  }
}

function wallDressing(T, layout) {
  const lit = lightField(layout),
    m = new Model(T, 770412),
    pins = new Pins(m);
  stalactites(m, pins, lit);
  rime(m, pins, lit);
  jadeVeins(m, pins);
  waterMoss(m, pins);
  passages.forEach((a, k) => doorway(m, pins, lit, a, k));
  lowerGallery(m, pins, lit);
  frozenFall(m, pins, lit);
  columns(m, pins);
  const group = m.finish('洞壁鐘乳、玉脈與側道', { cast: false });
  pinned(T, group, pins);
  return group;
}

export { wallDressing };
