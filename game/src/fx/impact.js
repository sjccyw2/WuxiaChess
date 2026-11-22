// Combat feel for the actor layer. Each part answers to one switch in polish.js, and all
// of them stand down when the motion setting is off.
import { POLISH } from '../polish.js';
import * as G from '../rules/game.js';
import { CELL_HEIGHT, FOOT_Y } from '../actors/sprite-sheets.js';
import { showCutIn, warmCutIn } from '../ui/cut-in.js';

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const mix = (a, b, t) => a + (b - a) * t;
const easeOut = (t) => 1 - (1 - t) * (1 - t) * (1 - t);

// Milliseconds the action clock holds when a blow lands, by technique rank (0 is a plain blow).
const STOP = [46, 52, 62, 84, 108];
// Pixels of camera kick at a 900px-tall view. Light blows do not shake the screen.
const KICK = [0, 0, 2.5, 6, 9];
// Milliseconds the action waits behind the portrait cut-in, by technique rank.
const CUT_IN_STALL = { 3: 320, 4: 440 };
// The original fade of a defeated piece spans the last 200ms before its exit time.
const FADE = 200;
const BURST_LIFE = 470;

const TONES = {
  // [top, bottom, outline, size factor]
  hurt: ['#fffaf0', '#ffd27a', '#2b1410', 1],
  heavy: ['#fff6d6', '#ff9a3d', '#30110a', 1.18],
  kill: ['#ffffff', '#ff5a36', '#3a0906', 1.38],
  heal: ['#f3fff4', '#72e6a0', '#0d3323', 1],
  cost: ['#f0e9ff', '#b9a3e8', '#231a36', 0.86],
  word: ['#fff7e2', '#f0cf8d', '#2a1c12', 0.74]
};

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

  // ---- high-tier techniques ----------------------------------------------------------
  // A rank 3 or 4 technique is on its way: fetch the portrait before it is needed.
  prepare(actor) {
    if (POLISH.skillCutIn && this.motion) warmCutIn(actor);
  }
  // A rank 3 or 4 technique announces itself.
  herald(e) {
    if (!this.motion || e.rank < 3) return;
    const layer = this.layer;
    // The action waits a beat behind the portrait cut-in.
    const unit = G.find(layer.state, e.actor);
    if (POLISH.skillCutIn && unit) {
      const stall = CUT_IN_STALL[e.rank];
      this.hold(stall);
      showCutIn(unit, e.name, e.rank, stall + 280);
    }
    // The camera leans toward the blow.
    if (POLISH.cameraFollow)
      e.leaned = layer.view.lean?.(
        (e.from.x + e.to.x) / 2,
        (e.from.y + e.to.y) / 2,
        e.rank === 4 ? 1.1 : 1.06,
        420
      );
  }
  // The blow has landed (or the technique is over): let the camera settle back.
  conclude(e, delay = 0) {
    if (!e.leaned) return;
    e.leaned = false;
    this.layer.view.settle(360, delay);
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
  // transform. Paints the white flash, and starts the break-up of a defeated piece.
  sprite(c, u, pos, sheet, frame, row, w, h, flip) {
    if (!this.motion) return;
    const layer = this.layer;
    if (POLISH.koBurst && u.hp <= 0) {
      const track = layer.tracks.get(u.id);
      if (track?.exit && !track.burst && layer.time >= track.exit - FADE) {
        track.burst = true;
        this.breakUp(u, pos, sheet, frame, row, flip, h / (layer.scaleAt(pos.x, pos.y) || h));
      }
    }
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

  // ---- defeat ------------------------------------------------------------------------
  // Cuts the sprite's last frame into slips, which scatter as ink while the sprite fades.
  breakUp(u, pos, sheet, frame, row, flip, tall) {
    const layer = this.layer;
    this.flashes.set(u.id, { born: this.clock, hold: 60, fade: 150, peak: 1 });
    const ink = this.silhouette(sheet, frame, row, G.ally(u) ? '#16302b' : '#2a1512');
    const cols = 6,
      rows = 9,
      cw = ink.width / cols,
      ch = ink.height / rows;
    // One small read of the alpha channel finds which cells hold any of the figure.
    let alpha = null;
    try {
      alpha = ink.getContext('2d').getImageData(0, 0, ink.width, ink.height).data;
    } catch {
      alpha = null;
    }
    const covered = (cx, cy) => {
      if (!alpha) return cx > 1 && cx < cols - 2 && cy > 1;
      let hits = 0;
      for (let j = 0; j < 4; j++)
        for (let i = 0; i < 4; i++) {
          const px = Math.floor((cx + (i + 0.5) / 4) * cw),
            py = Math.floor((cy + (j + 0.5) / 4) * ch);
          if (alpha[(py * ink.width + px) * 4 + 3] > 60) hits++;
        }
      return hits >= 4;
    };
    const random = scatter(u.id.charCodeAt(0) * 977 + frame * 31 + 7);
    const pieces = [];
    for (let cy = 0; cy < rows; cy++)
      for (let cx = 0; cx < cols; cx++) {
        if (!covered(cx, cy)) continue;
        // Position inside the sprite cell, as fractions measured from the foot anchor.
        const fx = (cx + 0.5) / cols - 0.5,
          fy = ((cy + 0.5) * ch) / ink.height - FOOT_Y / CELL_HEIGHT;
        const angle = Math.atan2(fy + 0.42, fx) + (random() - 0.5) * 0.9;
        const speed = 0.06 + random() * 0.34;
        pieces.push({
          sx: cx * cw,
          sy: cy * ch,
          fx,
          fy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.22 - random() * 0.2,
          spin: (random() - 0.5) * 5,
          // The figure comes apart from the head down.
          delay: (cy / rows) * 0.24 + random() * 0.08,
          paper: random() < 0.25
        });
      }
    layer.effects.push({
      kind: 'burst',
      target: u.id,
      x: pos.x,
      y: pos.y,
      flip,
      tall,
      ink,
      paper: this.silhouette(sheet, frame, row, '#f4ead2'),
      ring: G.ally(u) ? '#16302b' : '#2a1512',
      cw,
      ch,
      cols,
      pieces,
      start: layer.time,
      end: layer.time + BURST_LIFE
    });
  }
  // Draws one break-up. `e.x`/`e.y` are board coordinates, so the slips follow the camera.
  burst(c, e, now) {
    const layer = this.layer,
      t = clamp((now - e.start) / (e.end - e.start), 0, 1);
    const p = layer.point(e.x, e.y),
      scale = layer.scaleAt(e.x, e.y);
    if (!scale) return;
    const h = scale * e.tall,
      w = (h * e.ink.width) / e.ink.height;
    const pw = (w / e.cols) * 1.12,
      ph = ((h * e.ch) / e.ink.height) * 1.12;
    // An ink ring spreads on the ground where the piece stood.
    c.save();
    c.globalAlpha = (1 - t) * 0.55;
    layer.circle(e.x, e.y, 0.26 + 0.5 * easeOut(t), 0.1);
    c.strokeStyle = e.ring;
    c.lineWidth = Math.max(1, scale * 0.045 * (1 - t));
    c.stroke();
    c.restore();
    c.save();
    c.translate(p.x, p.y);
    if (e.flip) c.scale(-1, 1);
    for (const piece of e.pieces) {
      const k = (t - piece.delay) / (1 - piece.delay);
      if (k <= 0 || k >= 1) continue;
      const travel = easeOut(k);
      const size = 1 - 0.6 * k;
      c.save();
      c.globalAlpha = k < 0.12 ? k / 0.12 : Math.min(1, (1 - k) * 2.4);
      c.translate(
        (piece.fx + piece.vx * travel) * w,
        (piece.fy + piece.vy * travel + 0.1 * k * k) * h
      );
      c.rotate(piece.spin * travel);
      c.drawImage(
        piece.paper ? e.paper : e.ink,
        piece.sx,
        piece.sy,
        e.cw,
        e.ch,
        (-pw * size) / 2,
        (-ph * size) / 2,
        pw * size,
        ph * size
      );
      c.restore();
    }
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

  // ---- damage numbers ----------------------------------------------------------------
  tone(value, reason, ratio, rank, kill) {
    if (value.startsWith('+')) return 'heal';
    if (!value.startsWith('−')) return 'word';
    if (reason === 'sacrifice') return 'cost';
    if (kill) return 'kill';
    return ratio >= 0.3 || rank >= 3 ? 'heavy' : 'hurt';
  }
  // Renders a number once into its own small canvas: outline, gradient fill and shadow.
  label(text, tone) {
    const layer = this.layer,
      [top, bottom, outline, factor] = TONES[tone];
    const ratio = layer.canvas.width / layer.width;
    const px = clamp(layer.height * 0.042, 19, 30) * factor;
    const word = tone === 'word';
    const font =
      (word ? '700 ' : 'italic 900 ') +
      px * ratio +
      'px ' +
      (word
        ? 'RiverSerif, "Noto Serif TC", "Songti TC", serif'
        : 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif');
    const canvas = document.createElement('canvas');
    let c = canvas.getContext('2d');
    c.font = font;
    const edge = Math.max(2, px * 0.105) * ratio,
      pad = edge + px * 0.2 * ratio;
    const metrics = c.measureText(text);
    canvas.width = Math.ceil(metrics.width + pad * 2 + px * 0.2 * ratio);
    canvas.height = Math.ceil(px * ratio * 1.2 + pad * 2);
    c = canvas.getContext('2d');
    c.font = font;
    c.textBaseline = 'alphabetic';
    c.lineJoin = 'round';
    const x = pad,
      y = pad + px * ratio * 0.96;
    // A dark outline with a soft drop shadow, then the lit face.
    c.shadowColor = 'rgba(8,6,5,.6)';
    c.shadowBlur = px * 0.12 * ratio;
    c.shadowOffsetY = px * 0.07 * ratio;
    c.strokeStyle = outline;
    c.lineWidth = edge * 2;
    c.strokeText(text, x, y);
    c.shadowColor = 'transparent';
    const face = c.createLinearGradient(0, pad, 0, pad + px * ratio * 1.05);
    face.addColorStop(0.18, top);
    face.addColorStop(0.92, bottom);
    c.fillStyle = face;
    c.fillText(text, x, y);
    return { canvas, w: canvas.width / ratio, h: canvas.height / ratio, px };
  }
  // Draws one number effect. Its age runs on the unheld clock, so it pops during the hit-stop.
  number(c, e, unit) {
    const layer = this.layer;
    if (e.born == null) {
      e.born = this.clock;
      e.label = this.label(e.value, e.tone);
    }
    const age = this.clock - e.born,
      life = e.tone === 'kill' ? 980 : 880;
    if (age >= life) {
      e.done = true;
      e.label = null;
      return;
    }
    const pos = layer.location(unit, layer.time);
    const anchor = layer.point(pos.x, pos.y, 1.52),
      { canvas, w, h, px } = e.label;
    const strong = e.tone === 'kill' || e.tone === 'heavy';
    const peak = e.tone === 'kill' ? 1.55 : strong ? 1.4 : 1.28;
    const scale =
      age < 90
        ? mix(0.45, peak, easeOut(age / 90))
        : age < 230
          ? mix(peak, 1, easeOut((age - 90) / 140))
          : 1;
    // A quick hop off the head, then a slow drift. A second number on the same piece
    // stacks above the first; a status word sits beside the numbers, not on them.
    const base = px / TONES[e.tone][3];
    const rise = base * (0.45 * easeOut(Math.min(1, age / 220)) + 0.35 * (age / life));
    const x = anchor.x + (e.tone === 'word' ? base * 2.3 : 0),
      level = anchor.y - rise - (e.tone === 'word' ? 0 : (e.lane || 0) * base * 1.15);
    // Numbers over pieces that stand close on screen (side by side, or one behind the other)
    // would print on top of one another. As a number appears it is lifted clear of the numbers
    // already showing where it would land; the lift is decided once, so it never jumps.
    if (e.lift == null) {
      e.lift = 0;
      if (e.tone !== 'word')
        for (let pass = 0; pass < 4; pass++) {
          const top = level - e.lift - h * 0.52,
            bottom = top + h * 0.7;
          const under = layer.effects.find(
            (o) =>
              o !== e &&
              o.kind === 'number' &&
              o.box &&
              !o.done &&
              Math.abs(o.box.x - x) < (o.box.w + w) * 0.4 &&
              o.box.top < bottom &&
              o.box.top + o.box.h > top
          );
          if (!under) break;
          e.lift += bottom - under.box.top + 2;
        }
    }
    const y = level - e.lift;
    // Where this number sits, for the ones that come after it.
    if (e.tone !== 'word') e.box = { x, top: y - h * 0.52, w, h: h * 0.7 };
    c.save();
    c.globalAlpha = Math.min(1, age / 50, (life - age) / 200);
    c.translate(x, y);
    if (e.tone === 'kill' && age < 150) {
      // A killing blow rattles for a moment before it settles.
      const jolt = (1 - age / 150) * px * 0.09;
      c.translate(Math.sin(age * 0.21) * jolt, Math.cos(age * 0.27) * jolt);
    }
    c.scale(scale, scale);
    c.drawImage(canvas, -w / 2, -h * 0.62, w, h);
    c.restore();
  }
}

export { Impact };
