// Combat feel for the actor layer. Each part answers to one switch in polish.js, and all
// of them stand down when the motion setting is off.
import { POLISH } from '../polish.js';
import * as G from '../rules/game.js';

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

// Milliseconds the action clock holds when a blow lands, by technique rank (0 is a plain blow).
const STOP = [46, 52, 62, 84, 108];
// Pixels of camera kick at a 900px-tall view. Light blows do not shake the screen.
const KICK = [0, 0, 2.5, 6, 9];

class Impact {
  constructor(layer) {
    this.layer = layer;
    this.reset();
  }
  reset() {
    this.clock = 0; // runs with the layer clock but is never held by a hit-stop
    this.stop = 0;
    this.blows = [];
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
}

export { Impact };
