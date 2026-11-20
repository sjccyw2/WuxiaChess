// Combat feel for the actor layer. Each part answers to one switch in polish.js, and all
// of them stand down when the motion setting is off.
import { POLISH } from '../polish.js';
import * as G from '../rules/game.js';
import { CELL_HEIGHT, FOOT_Y } from '../actors/sprite-sheets.js';

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const mix = (a, b, t) => a + (b - a) * t;
const easeOut = (t) => 1 - (1 - t) * (1 - t) * (1 - t);

// Milliseconds the action clock holds when a blow lands, by technique rank (0 is a plain blow).
const STOP = [46, 52, 62, 84, 108];
// Pixels of camera kick at a 900px-tall view. Light blows do not shake the screen.
const KICK = [0, 0, 2.5, 6, 9];

// Deterministic scatter: the same blow always breaks the same way.
function scatter(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

class Impact {
  constructor(layer) {
    this.layer = layer;
    this.silhouettes = new Map();
    this.reset();
  }
  reset() {
    this.clock = 0; // runs with the layer clock but is never held by a hit-stop
    this.stop = 0;
    this.blows = [];
    this.flashes = new Map();
    this.sparks = [];
    this.shaking?.cancel();
    this.shaking = null;
    this.shakeUntil = 0;
  }
  get motion() {
    return !!this.layer.prefs.motion;
  }

  // ---- clock -------------------------------------------------------------------------
  // `step` is what the action clock would advance this frame (it is capped while a clip
  // plays); `real` is the true frame time. Returns how far the action clock may advance.
  // The hold is measured in real time, so a slow frame cannot stretch a hit-stop.
  tick(step, real = step) {
    this.clock += step;
    if (this.stop <= 0) return step;
    const held = Math.min(this.stop, real);
    this.stop -= held;
    return Math.min(step, real - held);
  }
  hold(ms) {
    if (this.motion) this.stop = Math.max(this.stop, ms);
  }

  // ---- blows -------------------------------------------------------------------------
  // Called when the rules have already resolved a blow; `at` is the action-clock time it lands.
  blow(event) {
    if (!this.motion) return;
    this.blows.push(event);
  }
  // Releases every blow the action clock has reached.
  land(time) {
    if (!this.blows.length) return;
    const due = this.blows.filter((b) => b.at <= time);
    if (!due.length) return;
    this.blows = this.blows.filter((b) => b.at > time);
    for (const b of due) this.strike(b);
  }
  strike({ target, from, amount, rank, lead, kill }) {
    const layer = this.layer,
      unit = G.find(layer.state, target);
    if (!unit) return;
    const ratio = amount / Math.max(1, unit.maxHp),
      big = ratio >= 0.3;
    if (POLISH.hitStop) {
      let ms = STOP[rank] + (big ? 24 : 0) + (kill ? 64 : 0);
      if (!lead) ms = Math.max(24, ms * 0.45);
      this.hold(Math.min(190, ms));
    }
    const here = layer.location(unit, layer.time);
    const attacker = from && G.find(layer.state, from);
    let dx = 0.8,
      dy = -0.6;
    if (attacker) {
      const a = layer.location(attacker, layer.time);
      const p = layer.point(a.x, a.y),
        q = layer.point(here.x, here.y);
      const length = Math.hypot(q.x - p.x, q.y - p.y);
      if (length > 1) {
        dx = (q.x - p.x) / length;
        dy = (q.y - p.y) / length;
      }
    }
    if (POLISH.hitFlash) {
      const random = scatter((target.charCodeAt(0) * 131 + Math.round(amount) * 17 + rank) | 0);
      this.flashes.set(target, {
        born: this.clock,
        hold: kill ? 70 : rank >= 3 || big ? 56 : 40,
        fade: kill ? 110 : 80,
        peak: kill || rank >= 3 || big ? 0.95 : 0.8
      });
      this.sparks.push({
        target,
        born: this.clock,
        life: kill || rank >= 3 ? 210 : 160,
        size: (kill ? 1.35 : big || rank >= 3 ? 1.15 : rank ? 0.95 : 0.8) * (lead ? 1 : 0.75),
        dx,
        dy,
        // Two rolls per shard, made once so no frame has to roll again.
        rolls: Array.from({ length: 16 }, random)
      });
    }
    if (POLISH.screenShake) {
      let power = KICK[rank];
      if (big) power = Math.max(power, 3.5) + 1;
      if (kill) power = Math.max(power, 5) + 2.5;
      if (!lead) power *= 0.5;
      if (power >= 2) this.shake(power, dx, dy);
    }
  }

  // ---- screen shake ------------------------------------------------------------------
  // One compositor animation on the scene container moves both canvases together. Each
  // keyframe scales up by exactly the distance it travels, so no edge is ever uncovered.
  shake(power, dx, dy) {
    const el = this.layer.canvas.parentElement;
    if (!el?.animate || !this.motion) return;
    const now = performance.now();
    if (now < this.shakeUntil && power <= this.shakePower) return;
    const w = this.layer.width,
      h = this.layer.height;
    const reach = power * clamp(Math.min(w, h) / 900, 0.6, 1.25);
    const frames = [1, -0.72, 0.46, -0.27, 0.13, -0.05, 0].map((k, i) => {
      // A quarter of the kick goes sideways so it does not read as a mechanical slide.
      const side = (i % 2 ? -0.25 : 0.25) * k;
      const x = (dx * k - dy * side) * reach,
        y = (dy * k + dx * side) * reach;
      const cover = 1 + 2 * Math.max(Math.abs(x) / w, Math.abs(y) / h) + (k ? 0.0006 : 0);
      return {
        transform: `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) scale(${cover.toFixed(5)})`
      };
    });
    const duration = 170 + power * 15;
    this.shaking?.cancel();
    this.shaking = el.animate(frames, { duration, easing: 'linear' });
    this.shakePower = power;
    this.shakeUntil = now + duration;
  }

  // ---- struck sprite -----------------------------------------------------------------
  // A flat-colour copy of one sprite frame, cut from its alpha. Built once per frame of art.
  silhouette(sheet, frame, row, colour) {
    const sx = sheet.x + frame * sheet.w,
      sy = sheet.y + row * sheet.h;
    const key = sheet.image.src + '|' + sx + '|' + sy + '|' + colour;
    let canvas = this.silhouettes.get(key);
    if (canvas) return canvas;
    canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(sheet.w));
    canvas.height = Math.max(1, Math.round(sheet.h));
    const c = canvas.getContext('2d');
    c.drawImage(sheet.image, sx, sy, sheet.w, sheet.h, 0, 0, canvas.width, canvas.height);
    c.globalCompositeOperation = 'source-in';
    c.fillStyle = colour;
    c.fillRect(0, 0, canvas.width, canvas.height);
    if (this.silhouettes.size >= 40) this.silhouettes.delete(this.silhouettes.keys().next().value);
    this.silhouettes.set(key, canvas);
    return canvas;
  }
  // Called by ActorLayer.actor() right after it draws a sprite, inside the sprite's own
  // transform. Paints the white flash.
  sprite(c, u, pos, sheet, frame, row, w, h, flip) {
    if (!this.motion) return;
    const flash = this.flashes.get(u.id);
    if (!flash) return;
    const age = this.clock - flash.born;
    if (age >= flash.hold + flash.fade) {
      this.flashes.delete(u.id);
      return;
    }
    const alpha = flash.peak * (age <= flash.hold ? 1 : 1 - (age - flash.hold) / flash.fade);
    c.save();
    c.filter = 'none';
    c.globalAlpha *= alpha;
    c.drawImage(
      this.silhouette(sheet, frame, row, '#ffffff'),
      -w / 2,
      (-h * FOOT_Y) / CELL_HEIGHT,
      w,
      h
    );
    c.restore();
  }

  // ---- sparks ------------------------------------------------------------------------
  // The moment of contact: a four-point glint, then shards thrown along the blow.
  // Paths only; nothing is allocated per frame.
  paintSparks(c) {
    if (!this.sparks.length) return;
    const layer = this.layer;
    let live = false;
    for (const s of this.sparks) {
      const age = this.clock - s.born;
      if (age >= s.life) continue;
      live = true;
      const unit = G.find(layer.state, s.target);
      if (!unit) continue;
      const here = layer.location(unit, layer.time),
        scale = layer.scaleAt(here.x, here.y);
      if (!scale) continue;
      const p = layer.point(here.x, here.y, 0.6),
        t = age / s.life,
        reach = scale * s.size;
      const heading = Math.atan2(s.dy, s.dx);
      c.save();
      // Contact is on the side the blow came from.
      c.translate(p.x - s.dx * scale * 0.14, p.y - s.dy * scale * 0.14);
      c.lineJoin = 'round';
      const fade = t < 0.45 ? 1 : (1 - t) / 0.55;
      for (let i = 0; i < 8; i++) {
        // Five shards fly on with the blow, three splash back.
        const forward = i < 5;
        const turn = s.rolls[i * 2] - 0.5,
          stretch = s.rolls[i * 2 + 1];
        const a = heading + (forward ? turn * 1.9 : Math.PI + turn * 1.5);
        const length = reach * (forward ? 0.62 + stretch * 0.5 : 0.36 + stretch * 0.26);
        const travel = easeOut(t),
          head = length * mix(0.3, 1, travel),
          tail = length * mix(0.02, 0.72, travel * travel);
        const half = scale * (forward ? 0.05 : 0.036) * s.size * (1 - t * 0.6);
        const cos = Math.cos(a),
          sin = Math.sin(a),
          waist = mix(tail, head, 0.62);
        c.beginPath();
        c.moveTo(cos * tail, sin * tail);
        c.lineTo(cos * waist - sin * half, sin * waist + cos * half);
        c.lineTo(cos * head, sin * head);
        c.lineTo(cos * waist + sin * half, sin * waist - cos * half);
        c.closePath();
        c.globalAlpha = fade * 0.5;
        c.strokeStyle = '#3b1a10';
        c.lineWidth = 2.5;
        c.stroke();
        c.globalAlpha = fade;
        c.fillStyle = i % 3 ? '#fffaea' : '#ffd986';
        c.fill();
      }
      if (t < 0.5) {
        // A hard four-point glint for the first frames.
        const k = t / 0.5,
          long = reach * mix(0.78, 0.5, k) * (1 - k * 0.35),
          short = long * 0.17;
        c.globalAlpha = 1 - k * k;
        c.rotate(heading * 0.5 + 0.4);
        c.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4,
            r = i % 2 ? short : i % 4 ? long * 0.62 : long;
          c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        c.closePath();
        c.fillStyle = '#fff6d8';
        c.strokeStyle = '#e39a4c';
        c.lineWidth = 1.5;
        c.stroke();
        c.fill();
      }
      c.restore();
    }
    if (!live) this.sparks.length = 0;
  }
}

export { Impact };
