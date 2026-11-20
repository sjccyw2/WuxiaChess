// Combat feel for the actor layer. Each part answers to one switch in polish.js, and all
// of them stand down when the motion setting is off.
import { POLISH } from '../polish.js';
import * as G from '../rules/game.js';

// Milliseconds the action clock holds when a blow lands, by technique rank (0 is a plain blow).
const STOP = [46, 52, 62, 84, 108];

class Impact {
  constructor(layer) {
    this.layer = layer;
    this.reset();
  }
  reset() {
    this.clock = 0; // runs with the layer clock but is never held by a hit-stop
    this.stop = 0;
    this.blows = [];
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
  }
}

export { Impact };
