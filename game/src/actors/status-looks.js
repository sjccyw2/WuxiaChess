// How the five holding conditions read on the board (polish switch statusLooks):
//   定身 freeze  the figure stops on the frame it was caught on and turns frost-white, ice at its feet
//   閉穴 mute    a sealed talisman hangs at its hands; it walks as before
//   受制 charm   base, outline and health bar turn green-gold, a ring of arcs turns round it
//   金剛 immune  a golden ring at the feet and a golden sheen on the figure; a void blow rings gold
//   固守 fortify a stone ward rises when it is laid (its chip 固 stays on the gauge)
// Each state starts to show when the word for it pops (numbers() in actors.js says when) and
// gives a short flourish as it starts and as it ends. The rules are never read here except
// through the piece's conditions; nothing is changed on the piece.
import * as G from '../rules/game.js';
import { POLISH } from '../polish.js';

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const TAU = Math.PI * 2;
const easeOut = (t) => 1 - (1 - t) * (1 - t) * (1 - t);
const KINDS = ['freeze', 'mute', 'charm', 'immune', 'fortify'];
const NAMES = { 定身: 'freeze', 閉穴: 'mute', 受制: 'charm', 金剛: 'immune', 固守: 'fortify' };
const ICE = '#dff4ff',
  ICE_DEEP = '#7fc2ec',
  GOLD = '#ffd45e',
  GOLD_PALE = '#fff1b8',
  TURNED = '#d6e27a',
  SEAL = '#b3261e',
  PAPER = '#f3dc8e',
  STONE = '#d8c7a0';
const LIFE = { on: 820, off: 760, void: 620, drain: 760 };

const memories = new WeakMap();
function memory(layer) {
  let m = memories.get(layer);
  if (!m) memories.set(layer, (m = { seen: new Map(), due: new Map(), held: new Map(), bursts: [], clock: 0 }));
  // A new battle restarts the layer's clock: everything remembered belongs to the old one.
  if (layer.time < m.clock) {
    m.seen.clear();
    m.due.clear();
    m.held.clear();
    m.bursts.length = 0;
  }
  m.clock = layer.time;
  return m;
}

// numbers() hands over each status word as it is scheduled: the look waits for its word.
function statusWord(layer, id, value, at) {
  const kind = NAMES[value];
  if (!POLISH.statusLooks || !kind) return;
  memory(layer).due.set(id + '|' + kind, at);
}
// A blow 金剛 turned to nothing, and a 吸元 drawing health from the target back to the striker.
function voidBlow(layer, id, at) {
  if (POLISH.statusLooks) memory(layer).bursts.push({ type: 'void', kind: 'immune', id, at });
}
function drainFlow(layer, from, to, at) {
  if (POLISH.statusLooks) memory(layer).bursts.push({ type: 'drain', id: to, from, at });
}

// What the piece shows now: { freeze, mute, charm, immune, fortify } as booleans, or null.
// Starting and ending a state is noticed here, and its flourish queued.
function statusLook(layer, u, now) {
  if (!POLISH.statusLooks || G.isProp(u)) return null;
  const m = memory(layer),
    c = u.conditions || {},
    look = {};
  for (const kind of KINDS) {
    const key = u.id + '|' + kind,
      due = m.due.get(key);
    if (!c[kind]) m.due.delete(key);
    else if (due != null && now >= due) m.due.delete(key);
    look[kind] = !!c[kind] && !(due != null && now < due);
  }
  let seen = m.seen.get(u.id);
  if (!seen || seen.unit !== u) {
    // First sight of this piece (a new board, a loaded game): it simply shows as it is.
    seen = { unit: u, look };
    m.seen.set(u.id, seen);
  } else if (u.hp > 0)
    for (const kind of KINDS)
      if (look[kind] !== seen.look[kind])
        m.bursts.push({ type: look[kind] ? 'on' : 'off', kind, id: u.id, at: now });
  seen.look = look;
  if (!look.freeze) m.held.delete(u.id);
  return KINDS.some((k) => look[k]) ? look : null;
}

// 定身: the frame the figure was caught on, kept until it thaws.
function heldFrame(layer, u, frame) {
  const m = memory(layer);
  if (!m.held.has(u.id)) m.held.set(u.id, frame);
  return m.held.get(u.id);
}

// ---- painting --------------------------------------------------------------------------

function star(c, x, y, r) {
  c.beginPath();
  c.moveTo(x, y - r);
  c.lineTo(x + r * 0.28, y - r * 0.28);
  c.lineTo(x + r, y);
  c.lineTo(x + r * 0.28, y + r * 0.28);
  c.lineTo(x, y + r);
  c.lineTo(x - r * 0.28, y + r * 0.28);
  c.lineTo(x - r, y);
  c.lineTo(x - r * 0.28, y - r * 0.28);
  c.closePath();
}
// A thin ice shard standing on (x, y), `tall` high, leaning by `lean` radians.
function shard(c, x, y, tall, lean) {
  c.save();
  c.translate(x, y);
  c.rotate(lean);
  c.beginPath();
  c.moveTo(-tall * 0.2, 0);
  c.lineTo(0, -tall);
  c.lineTo(tall * 0.2, 0);
  c.closePath();
  c.fillStyle = 'rgba(14,40,58,.7)';
  c.fill();
  c.beginPath();
  c.moveTo(-tall * 0.13, -tall * 0.04);
  c.lineTo(0, -tall * 0.9);
  c.lineTo(tall * 0.13, -tall * 0.04);
  c.closePath();
  c.fillStyle = ICE;
  c.fill();
  c.restore();
}
// A ring on the ground, round the piece's tile.
function groundRing(layer, pos, r, colour, width, ink = 'rgba(10,14,10,.55)') {
  const c = layer.ctx;
  layer.circle(pos.x, pos.y, r, 0.1);
  c.strokeStyle = ink;
  c.lineWidth = width + 2;
  c.stroke();
  c.strokeStyle = colour;
  c.lineWidth = width;
  c.stroke();
}
// Arcs of a ring on the ground (fractions of a turn), turned by `spin`.
function groundArcs(layer, pos, r, count, share, spin, colour, width) {
  const c = layer.ctx;
  for (let i = 0; i < count; i++) {
    const a0 = spin + (i * TAU) / count,
      a1 = a0 + (share * TAU) / count;
    c.beginPath();
    for (let k = 0; k <= 10; k++) {
      const a = a0 + ((a1 - a0) * k) / 10,
        q = layer.point(pos.x + Math.cos(a) * r, pos.y + Math.sin(a) * r, 0.1);
      if (k) c.lineTo(q.x, q.y);
      else c.moveTo(q.x, q.y);
    }
    c.lineCap = 'round';
    c.strokeStyle = 'rgba(16,20,6,.6)';
    c.lineWidth = width + 2;
    c.stroke();
    c.strokeStyle = colour;
    c.lineWidth = width;
    c.stroke();
  }
}

// Under the figure, over its base: ice on the ground, the ring of 受制, the ring of 金剛.
function paintUnder(layer, u, pos, now, look) {
  if (!look) return;
  const c = layer.ctx,
    motion = layer.prefs.motion,
    scale = layer.scaleAt(pos.x, pos.y);
  c.save();
  if (look.freeze) {
    layer.circle(pos.x, pos.y, 0.44, 0.1);
    c.fillStyle = 'rgba(196,232,255,.30)';
    c.fill();
    groundRing(layer, pos, 0.44, ICE, 1.4, 'rgba(20,50,70,.5)');
    // A crown of shards round the feet.
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU + 0.4,
        q = layer.point(pos.x + Math.cos(a) * 0.4, pos.y + Math.sin(a) * 0.4, 0.1);
      shard(c, q.x, q.y, clamp(scale * (0.13 + (i % 3) * 0.04), 5, 14), Math.cos(a) * 0.35);
    }
  }
  if (look.charm) {
    const spin = motion ? now / 1400 : 0;
    groundArcs(layer, pos, 0.47, 3, 0.62, spin, TURNED, clamp(scale * 0.035, 1.4, 2.4));
  }
  if (look.immune) {
    const beat = motion ? 0.5 + 0.5 * Math.sin(now / 320) : 0.6;
    c.globalAlpha *= 0.55 + beat * 0.45;
    groundRing(layer, pos, 0.43 + beat * 0.02, GOLD, clamp(scale * 0.04, 1.6, 2.8), 'rgba(60,36,4,.6)');
    c.globalAlpha = 1;
    groundArcs(layer, pos, 0.5, 4, 0.4, motion ? -now / 1800 : 0, GOLD_PALE, clamp(scale * 0.022, 1, 1.6));
  }
  c.restore();
}

// Over the figure, under the gauge: frost sparkles, the sealed talisman, golden motes.
// `p` is the foot point on screen, `h` the figure's height.
function paintOver(layer, u, p, scale, h, now, look) {
  if (!look) return;
  const c = layer.ctx,
    motion = layer.prefs.motion,
    seed = u.id.charCodeAt(0) * 0.37;
  c.save();
  if (look.freeze) {
    for (let i = 0; i < 3; i++) {
      const t = motion ? ((now / 900 + i / 3 + seed) % 1) : 0.5,
        glow = Math.sin(t * Math.PI);
      const x = p.x + Math.sin(i * 2.1 + seed) * scale * 0.2,
        y = p.y - h * (0.25 + 0.17 * i);
      c.globalAlpha = glow * 0.95;
      star(c, x, y, clamp(scale * 0.07, 3, 7) * (0.6 + glow * 0.5));
      c.fillStyle = '#ffffff';
      c.fill();
    }
    c.globalAlpha = 1;
  }
  if (look.mute) {
    // A yellow talisman with a red seal, tied at the hands, swinging a little.
    const tw = clamp(scale * 0.17, 8, 15),
      th = tw * 1.55,
      x = p.x + scale * 0.2,
      y = p.y - h * 0.42;
    c.translate(x, y);
    c.rotate(motion ? Math.sin(now / 420 + seed) * 0.12 : 0.05);
    c.fillStyle = 'rgba(30,8,6,.75)';
    c.fillRect(-tw / 2 - 1.5, -1.5, tw + 3, th + 3);
    c.fillStyle = PAPER;
    c.fillRect(-tw / 2, 0, tw, th);
    c.strokeStyle = SEAL;
    c.lineWidth = Math.max(1.2, tw * 0.13);
    c.strokeRect(-tw / 2 + tw * 0.14, tw * 0.14, tw * 0.72, th - tw * 0.28);
    c.beginPath();
    c.moveTo(-tw * 0.22, th * 0.3);
    c.lineTo(tw * 0.22, th * 0.7);
    c.moveTo(tw * 0.22, th * 0.3);
    c.lineTo(-tw * 0.22, th * 0.7);
    c.stroke();
    // The cord it hangs from.
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(-tw * 0.5, -tw * 0.45);
    c.lineTo(-tw * 1.1, -tw * 0.2);
    c.strokeStyle = SEAL;
    c.lineWidth = Math.max(1, tw * 0.1);
    c.stroke();
  }
  c.restore();
  if (look.immune && motion) {
    c.save();
    for (let i = 0; i < 4; i++) {
      const t = (now / 1300 + i / 4 + seed) % 1;
      c.globalAlpha = Math.sin(t * Math.PI) * 0.9;
      star(c, p.x + Math.sin(i * 1.7 + seed) * scale * 0.28, p.y - h * (0.08 + t * 0.7), clamp(scale * 0.05, 2.4, 5));
      c.fillStyle = GOLD_PALE;
      c.fill();
    }
    c.restore();
  }
}

// The flourishes: as a state starts, as it ends, a blow 金剛 voided, a 吸元 drawing health.
function paintBursts(layer, now) {
  if (!POLISH.statusLooks || !layer.state) return;
  const m = memory(layer),
    c = layer.ctx,
    motion = layer.prefs.motion;
  m.bursts = m.bursts.filter((b) => now < b.at + LIFE[b.type]);
  for (const b of m.bursts) {
    if (now < b.at) continue;
    const u = G.find(layer.state, b.id);
    if (!u) continue;
    const pos = layer.location(u, now),
      p = layer.point(pos.x, pos.y),
      scale = layer.scaleAt(pos.x, pos.y);
    if (!scale) continue;
    const f = clamp((now - b.at) / LIFE[b.type], 0, 1),
      fade = motion ? 1 - f : f < 0.6 ? 1 : 0,
      h = scale * 1.68,
      chest = p.y - h * 0.45;
    c.save();
    c.lineCap = c.lineJoin = 'round';
    if (b.type === 'void') {
      // Two golden rings ring out from where the blow met nothing, like a struck bell.
      for (let k = 0; k < 2; k++) {
        const g = clamp(f * 1.3 - k * 0.25, 0, 1);
        if (!g) continue;
        c.globalAlpha = (1 - g) * 0.95;
        c.beginPath();
        c.ellipse(p.x, chest, scale * (0.2 + g * 0.55), scale * (0.28 + g * 0.7), 0, 0, TAU);
        c.strokeStyle = 'rgba(60,36,4,.7)';
        c.lineWidth = 4;
        c.stroke();
        c.strokeStyle = k ? GOLD_PALE : GOLD;
        c.lineWidth = 2.2;
        c.stroke();
      }
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU,
          r = scale * (0.25 + easeOut(f) * 0.5);
        c.globalAlpha = fade;
        star(c, p.x + Math.cos(a) * r, chest + Math.sin(a) * r * 0.8, clamp(scale * 0.06, 2.5, 6) * (1 - f * 0.6));
        c.fillStyle = GOLD_PALE;
        c.fill();
      }
    } else if (b.type === 'drain') {
      // Crimson motes leave the struck piece and turn jade as they reach the striker.
      const src = G.find(layer.state, b.from);
      if (src) {
        const a = layer.location(src, now),
          from = layer.point(a.x, a.y, 0.7),
          to = layer.point(pos.x, pos.y, 0.7);
        for (let i = 0; i < 7; i++) {
          const t = clamp(f * 1.5 - i * 0.07, 0, 1);
          if (!t || t >= 1) continue;
          const x = from.x + (to.x - from.x) * easeOut(t),
            y = from.y + (to.y - from.y) * easeOut(t) - Math.sin(t * Math.PI) * scale * (0.35 + (i % 3) * 0.12);
          c.globalAlpha = Math.sin(t * Math.PI);
          c.beginPath();
          c.arc(x, y, clamp(scale * 0.045, 2, 4.5), 0, TAU);
          c.fillStyle = t < 0.5 ? '#ff8a7a' : '#a8ffd2';
          c.fill();
        }
        if (f > 0.55) {
          c.globalAlpha = (1 - f) * 2;
          layer.circle(pos.x, pos.y, 0.3 + (f - 0.55) * 0.6, 0.2);
          c.strokeStyle = '#a8ffd2';
          c.lineWidth = 2;
          c.stroke();
        }
      }
    } else if (b.kind === 'freeze') {
      if (b.type === 'on') {
        // Shards fly in from all round and lock on; a cold flash over the figure.
        for (let i = 0; i < 9; i++) {
          const a = (i / 9) * TAU,
            r = 0.95 - easeOut(Math.min(1, f * 1.6)) * 0.53,
            q = layer.point(pos.x + Math.cos(a) * r, pos.y + Math.sin(a) * r, 0.1);
          c.globalAlpha = Math.min(1, fade * 1.6);
          shard(c, q.x, q.y, clamp(scale * 0.3, 8, 26), Math.cos(a) * 0.5);
        }
        c.globalAlpha = Math.max(0, 1 - f * 1.8) * 0.85;
        c.beginPath();
        c.ellipse(p.x, chest, scale * 0.34, h * 0.42, 0, 0, TAU);
        c.fillStyle = ICE;
        c.fill();
        c.globalAlpha = fade;
        layer.circle(pos.x, pos.y, 0.42 + f * 0.5, 0.1);
        c.strokeStyle = ICE;
        c.lineWidth = 2;
        c.stroke();
      } else {
        // 解凍: the ice breaks off, falls outward and melts.
        for (let i = 0; i < 9; i++) {
          const a = (i / 9) * TAU + 0.2,
            out = scale * (0.25 + f * 0.6),
            x = p.x + Math.cos(a) * out,
            y = chest + Math.sin(a) * out * 0.5 + f * f * scale * 0.9;
          c.globalAlpha = fade;
          shard(c, x, y, clamp(scale * 0.14, 5, 12) * (1 - f * 0.5), a + f * 3);
        }
        c.globalAlpha = fade * 0.8;
        layer.circle(pos.x, pos.y, 0.44 - f * 0.2, 0.1);
        c.strokeStyle = ICE_DEEP;
        c.lineWidth = 1.6;
        c.stroke();
      }
    } else if (b.kind === 'mute') {
      const tw = clamp(scale * 0.17, 8, 15),
        x = p.x + scale * 0.2,
        y = p.y - h * 0.42;
      if (b.type === 'on') {
        // The talisman drops on and is stamped down; a red ripple at the hands.
        const drop = 1 - easeOut(Math.min(1, f * 2.4)),
          k = 1 + drop * 0.9;
        c.save();
        c.globalAlpha = Math.min(1, f * 5);
        c.translate(x, y - drop * scale * 0.8);
        c.scale(k, k);
        c.fillStyle = PAPER;
        c.fillRect(-tw / 2, 0, tw, tw * 1.55);
        c.strokeStyle = SEAL;
        c.lineWidth = 2;
        c.strokeRect(-tw / 2, 0, tw, tw * 1.55);
        c.restore();
        const g = clamp((f - 0.35) * 1.6, 0, 1);
        if (g > 0) {
          c.globalAlpha = 1 - g;
          c.beginPath();
          c.ellipse(x, y + tw * 0.7, tw * (0.6 + g * 2.2), tw * (0.35 + g * 1.2), 0, 0, TAU);
          c.strokeStyle = SEAL;
          c.lineWidth = 2.4;
          c.stroke();
        }
      } else {
        // 解穴: the talisman flutters up, its edge catching fire, and is gone.
        c.globalAlpha = fade;
        c.translate(x + Math.sin(f * 9) * tw * 0.4, y - f * scale * 0.9);
        c.rotate(f * 1.4);
        c.fillStyle = PAPER;
        c.fillRect(-tw / 2, 0, tw, tw * 1.55 * (1 - f * 0.6));
        c.strokeStyle = '#ff9a3c';
        c.lineWidth = 2;
        c.strokeRect(-tw / 2, 0, tw, tw * 1.55 * (1 - f * 0.6));
      }
    } else if (b.kind === 'charm') {
      if (b.type === 'on') {
        // Three green-gold streams wind up round the figure as it turns coat.
        for (let s = 0; s < 3; s++)
          for (let i = 0; i < 6; i++) {
            const t = clamp(f * 1.4 - i * 0.06, 0, 1);
            if (!t || t >= 1) continue;
            const a = (s / 3) * TAU + t * TAU * 1.2,
              x = p.x + Math.cos(a) * scale * 0.36 * (1 - t * 0.3),
              y = p.y - h * t * 0.95 + Math.sin(a) * scale * 0.12;
            c.globalAlpha = Math.sin(t * Math.PI);
            c.beginPath();
            c.arc(x, y, clamp(scale * 0.04, 2, 4), 0, TAU);
            c.fillStyle = i % 2 ? TURNED : GOLD_PALE;
            c.fill();
          }
        c.globalAlpha = fade;
        groundRing(layer, pos, 0.3 + easeOut(f) * 0.35, TURNED, 2.2);
      } else {
        // 受制已解: a vermilion ring closes in; it is the enemy's again.
        c.globalAlpha = fade;
        groundRing(layer, pos, 0.75 - easeOut(f) * 0.35, '#ff8763', 2.4);
      }
    } else if (b.kind === 'immune') {
      if (b.type === 'on') {
        // A column of gold light, and a ring that rings out along the ground.
        const g = Math.sin(Math.min(1, f * 1.4) * Math.PI);
        c.globalAlpha = g * 0.5;
        c.fillStyle = GOLD;
        c.beginPath();
        c.ellipse(p.x, p.y - h * 0.5, scale * (0.2 + f * 0.12), h * 0.62, 0, 0, TAU);
        c.fill();
        c.globalAlpha = g * 0.8;
        c.fillStyle = GOLD_PALE;
        c.fillRect(p.x - scale * 0.04, p.y - h * 1.15, scale * 0.08, h * 1.15);
        c.globalAlpha = fade;
        groundRing(layer, pos, 0.35 + easeOut(f) * 0.5, GOLD, 2.4, 'rgba(60,36,4,.6)');
      } else {
        c.globalAlpha = fade;
        groundRing(layer, pos, 0.45 - f * 0.25, GOLD_PALE, 1.6, 'rgba(60,36,4,.4)');
      }
    } else if (b.kind === 'fortify' && b.type === 'on') {
      // A six-sided stone ward rises round the feet and settles.
      const rise = easeOut(Math.min(1, f * 1.6));
      c.globalAlpha = fade;
      for (const lift of [0.1, 0.1 + rise * 0.5]) {
        c.beginPath();
        for (let i = 0; i <= 6; i++) {
          const a = (i / 6) * TAU + Math.PI / 6,
            q = layer.point(pos.x + Math.cos(a) * 0.46, pos.y + Math.sin(a) * 0.46, lift);
          if (i) c.lineTo(q.x, q.y);
          else c.moveTo(q.x, q.y);
        }
        c.strokeStyle = 'rgba(40,30,14,.6)';
        c.lineWidth = 4;
        c.stroke();
        c.strokeStyle = STONE;
        c.lineWidth = 2;
        c.stroke();
      }
    }
    c.restore();
  }
}

export { statusWord, voidBlow, drainFlow, statusLook, heldFrame, paintUnder, paintOver, paintBursts };
