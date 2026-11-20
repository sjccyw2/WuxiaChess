// Decides how often the idle scene may redraw the 3D world.
//
// The 2D layer costs about a millisecond a frame; the world costs a whole WebGL
// frame, and how long that takes is only visible as the wait until the next
// animation frame arrives. So the pacer times those waits: the gap after a frame
// that drew the world is the world's cost, the gap after one that did not is the
// display's own interval. From the two it picks one of three behaviours:
//
//   fluid   the world fits inside a display frame: animate it every frame, and
//           keep it moving while units act if their frames still fit as well
//   shared  it does not: give it about half the time, and none during actions
//   still   it takes a quarter of a second or more: leave the water still and
//           look again every few seconds in case the device has recovered
//
// A single odd reading (a tab switch, shader compilation, a collector pause) is
// set aside; two in a row that agree are believed at once.
const START = 1000 / 60;

class Estimate {
  constructor(value) {
    this.value = value;
    this.odd = 0;
  }
  add(sample) {
    const now = this.value,
      ratio = sample / now;
    if (ratio <= 2 && ratio >= 0.5) {
      this.value += (sample - now) * 0.2;
      this.odd = 0;
    } else if (this.odd && this.odd > now === sample > now) {
      this.value = sample > now ? Math.min(sample, this.odd) : Math.max(sample, this.odd);
      this.odd = 0;
    } else this.odd = sample;
  }
}

class FramePacer {
  constructor() {
    this.display = new Estimate(START); // interval between frames that only repaint the 2D layer
    this.world = new Estimate(START); // interval after a frame that also drew the world
    this.action = new Estimate(START); // the same, measured while units were acting
    this.actionFits = true;
    this.retryAction = 0;
    this.burst = 0; // frames left in a trial of per-frame repainting
    this.retrySmooth = 0;
    this.last = null; // the previous frame: when, whether it drew the world, whether it asked for this one
    this.lastWorld = -Infinity;
    this.settling = 3;
    this.fluid = true;
    this.still = false;
  }
  // New scenery compiles shaders and bakes shadows on its first frames; do not judge by them.
  settle() {
    this.settling = 3;
    this.world.odd = 0;
    this.action = new Estimate(START);
    this.actionFits = true;
  }
  begin(now) {
    const last = this.last;
    this.last = null;
    if (this.burst > 0) this.burst--;
    else if (this.display.value > 40 && now > this.retrySmooth) {
      // The 2D layer was too slow to repaint every frame; try a few frames again now and then.
      this.burst = 5;
      this.retrySmooth = now + 5000;
    }
    if (!last?.chained) return;
    const gap = now - last.time;
    if (!(gap > 0) || gap > 15000) return;
    if (!last.world) this.display.add(Math.min(gap, 250));
    else if (this.settling > 0) this.settling--;
    else if (last.playing) this.action.add(gap);
    else this.world.add(gap);
    const cost = this.world.value,
      frame = Math.max(4, this.display.value);
    this.fluid = cost <= frame * (this.fluid ? 1.75 : 1.35);
    this.still = cost > (this.still ? 180 : 250);
    // Unit animation is never traded for water: one slow pair of frames ends it for a while.
    if (this.actionFits && this.action.value > frame * 1.35) {
      this.actionFits = false;
      this.retryAction = now + 30000;
    } else if (!this.actionFits && now > this.retryAction) {
      this.action = new Estimate(Math.min(cost, frame));
      this.actionFits = true;
    }
  }
  // May this frame redraw the world although nothing in it changed?
  worldDue(now, playing) {
    if (playing) return this.fluid && this.actionFits;
    if (this.fluid) return true;
    const since = now - this.lastWorld;
    // A reading that disagrees with the estimate is checked on the very next frame.
    if (this.still) return this.world.odd > 0 || since > 10000;
    return since >= this.world.value * 1.8;
  }
  // Whether the idle 2D layer can repaint on every animation frame.
  get smooth() {
    return this.display.value <= 40 || this.burst > 0;
  }
  end(now, world, playing) {
    if (world) this.lastWorld = now;
    this.last = { time: now, world, playing, chained: false };
  }
  chain() {
    if (this.last) this.last.chained = true;
  }
}

export { FramePacer };
