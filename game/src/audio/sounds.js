// What each game event sounds like. Every entry is
//   kind: { cost, life, run(E, t, o) }
// where `cost` counts against the polyphony budget, `life` is roughly how long it rings
// (seconds) and `run` schedules it at time `t`. `o` carries the event's details.
import {
  note,
  sweep,
  hiss,
  pluck,
  flute,
  drum,
  gong,
  cymbal,
  block,
  ring,
  scrape,
  whoosh,
  thud,
  shimmer
} from './instruments.js';

// ---- interface ---------------------------------------------------------------------------

const UI = {
  // A small woodblock tick; three pitches so repeated taps do not drill.
  tap: {
    cost: 1,
    life: 0.12,
    run(E, t) {
      const v = E.voice({ gain: 0.978, wet: 0.08 });
      block(E, v, t, { f: [1180, 1320, 1480][Math.floor(E.rand(0, 3))], peak: 0.2, decay: 0.05 });
    }
  },
  // A hero picked: one high 箏 note.
  select: {
    cost: 1,
    life: 0.6,
    run(E, t) {
      const v = E.voice({ gain: 0.42, wet: 0.18 });
      pluck(E, v, t, note(7 + Math.floor(E.rand(0, 2))), { peak: 0.5, length: 0.6 });
      block(E, v, t, { f: 1400, peak: 0.08, decay: 0.03 });
    }
  },
  // Turning a page of dialogue: paper drawn across paper.
  page: {
    cost: 1,
    life: 0.25,
    run(E, t) {
      const v = E.voice({ gain: 0.199, wet: 0.06 });
      whoosh(E, v, t, 0.13, { from: 2400, to: 6200, peak: 0.3, q: 0.8 });
      whoosh(E, v, t + 0.07, 0.1, { from: 5000, to: 3000, peak: 0.18, q: 0.9 });
      hiss(E, v, t + 0.11, { type: 'lowpass', f: 500, peak: 0.12, decay: 0.04 });
    }
  },
  // A purchase: two coins and the click of an abacus bead.
  buy: {
    cost: 2,
    life: 0.5,
    run(E, t) {
      const v = E.voice({ gain: 0.319, wet: 0.14 });
      ring(E, v, t, { f: 3300, peak: 0.09, decay: 0.22, tick: 0.3 });
      ring(E, v, t + 0.075, { f: 4150, peak: 0.08, decay: 0.26, tick: 0.3 });
      block(E, v, t + 0.17, { f: 1650, peak: 0.16, decay: 0.035 });
    }
  },
  // Gear changed hands: a cloth swish and a small clink.
  equip: {
    cost: 1,
    life: 0.4,
    run(E, t) {
      const v = E.voice({ gain: 0.337, wet: 0.1 });
      whoosh(E, v, t, 0.14, { from: 500, to: 1800, peak: 0.18 });
      ring(E, v, t + 0.11, { f: 1900, peak: 0.07, decay: 0.3, tick: 0.4 });
    }
  },
  // A seat, slot or leader changed: two woodblock ticks, low then high.
  seat: {
    cost: 1,
    life: 0.2,
    run(E, t) {
      const v = E.voice({ gain: 0.5, wet: 0.08 });
      block(E, v, t, { f: 760, peak: 0.18, decay: 0.05 });
      block(E, v, t + 0.07, { f: 1020, peak: 0.16, decay: 0.05 });
    }
  },
  // A hero stands and waits: one low, soft woodblock.
  wait: {
    cost: 1,
    life: 0.15,
    run(E, t) {
      const v = E.voice({ gain: 0.998, wet: 0.1 });
      block(E, v, t, { f: 540, peak: 0.22, decay: 0.08 });
    }
  },
  // Something cannot be done: a muted double knock.
  deny: {
    cost: 1,
    life: 0.2,
    run(E, t) {
      const v = E.voice({ gain: 0.5, wet: 0.04 });
      block(E, v, t, { f: 330, peak: 0.25, decay: 0.05 });
      block(E, v, t + 0.085, { f: 290, peak: 0.22, decay: 0.05 });
    }
  },
  // Setting off across the board: a light swish of robes (the feet follow on their own).
  move: {
    cost: 1,
    life: 0.25,
    run(E, t) {
      const v = E.voice({ gain: 0.42, wet: 0.08 });
      whoosh(E, v, t, 0.2, { from: 350, to: 1300, peak: 0.2, q: 0.9 });
    }
  },
  // A move taken back: the swish runs the other way.
  undo: {
    cost: 1,
    life: 0.25,
    run(E, t) {
      const v = E.voice({ gain: 0.42, wet: 0.08 });
      whoosh(E, v, t, 0.2, { from: 1600, to: 380, peak: 0.2, q: 0.9 });
    }
  },
  // Taking aim at a foe: a blade loosened in its scabbard.
  ready: {
    cost: 1,
    life: 0.25,
    run(E, t) {
      const v = E.voice({ gain: 0.895, wet: 0.1 });
      scrape(E, v, t, 0.16, { from: 3200, to: 5200, peak: 0.08 });
    }
  },
  // Medicine taken: a gentle 琴 note and a few bells.
  heal: {
    cost: 3,
    life: 1.2,
    run(E, t) {
      const v = E.voice({ gain: 0.315, wet: 0.4 });
      pluck(E, v, t, note(2), { timbre: 'qin', peak: 0.5, length: 1.1 });
      shimmer(E, v, t + 0.06, 0.5, { peak: 0.05, count: 5 });
    }
  },
  // Something learned or gained: a rising 箏 run that settles on a bell.
  grow: {
    cost: 3,
    life: 1.4,
    run(E, t) {
      const v = E.voice({ gain: 0.42, wet: 0.32 });
      for (let i = 0; i < 5; i++)
        pluck(E, v, t + i * 0.055, note(5 + i), { peak: 0.38, length: 0.9 });
      pluck(E, v, t + 0.3, note(10), { peak: 0.5, length: 1.3 });
      sweep(E, v, t + 0.3, { from: note(15), attack: 0.002, peak: 0.05, decay: 0.9 });
    }
  },
  // A hero reaches a new level: the run, crowned by a rising 小鑼.
  level: {
    cost: 4,
    life: 1.6,
    run(E, t) {
      UI.grow.run(E, t);
      const v = E.voice({ gain: 0.32, wet: 0.3 });
      gong(E, v, t + 0.3, { f: 560, peak: 0.36, decay: 0.8, glide: 0.1, partials: 4 });
    }
  },
  // The ferry bowls are covered: three ceramic clunks.
  bowl: {
    cost: 2,
    life: 0.5,
    run(E, t) {
      const v = E.voice({ gain: 0.354, wet: 0.14 });
      for (let i = 0; i < 3; i++) {
        const at = t + i * 0.11 + E.rand(0, 0.02);
        block(E, v, at, { f: 430 + i * 35, peak: 0.2, decay: 0.06 });
        ring(E, v, at, { f: 1350 + i * 90, peak: 0.04, decay: 0.2, tick: 0.2 });
      }
    }
  },
  // Sound switched on: one clear bell, so the player hears what they enabled.
  chime: {
    cost: 2,
    life: 1,
    run(E, t) {
      const v = E.voice({ gain: 0.318, wet: 0.3 });
      pluck(E, v, t, note(5), { peak: 0.45, length: 0.8 });
      pluck(E, v, t + 0.09, note(7), { peak: 0.4, length: 0.9 });
    }
  },
  // The player's turn: a rising 小鑼 and three 箏 notes.
  turn: {
    cost: 3,
    life: 1,
    run(E, t) {
      const v = E.voice({ gain: 0.45, wet: 0.25 });
      gong(E, v, t, { f: 600, peak: 0.32, decay: 0.7, glide: 0.14, partials: 4 });
      for (const [i, d] of [3, 4, 5].entries())
        pluck(E, v, t + 0.12 + i * 0.09, note(d), { peak: 0.38, length: 0.8 });
    }
  },
  // The enemy phase: an opera drum roll that crashes into the big gong and cymbals (倉).
  enemy: {
    cost: 5,
    life: 2.4,
    run(E, t) {
      const v = E.voice({ gain: 0.381, wet: 0.22 });
      const roll = [0, 0.11, 0.2, 0.27, 0.32, 0.36];
      for (const [i, at] of roll.entries())
        drum(E, v, t + at, { f: 120, peak: 0.25 + i * 0.07, decay: 0.16, slap: 0.35 });
      gong(E, v, t + 0.42, { f: 112, peak: 0.5, decay: 2, glide: -0.05 });
      cymbal(E, v, t + 0.42, { peak: 0.22, decay: 0.7 });
      drum(E, v, t + 0.42, { f: 80, peak: 0.6, decay: 0.4 });
    }
  },
  // Victory: three strokes of drum and cymbal, then a 笛 phrase rising over the 箏.
  win: {
    cost: 6,
    life: 3.4,
    run(E, t) {
      const v = E.voice({ gain: 0.42, wet: 0.3 });
      for (const at of [0, 0.22, 0.44]) {
        drum(E, v, t + at, { f: 96, peak: 0.45, decay: 0.3 });
        cymbal(E, v, t + at, { peak: 0.1, decay: 0.35 });
      }
      gong(E, v, t + 0.66, { f: 150, peak: 0.42, decay: 2.4, glide: -0.02 });
      const phrase = [
        [5, 0.22],
        [7, 0.22],
        [8, 0.22],
        [9, 0.3],
        [10, 1.1]
      ];
      let at = t + 0.7;
      for (const [d, len] of phrase) {
        flute(E, v, at, note(d), len + 0.04, { peak: 0.17, vibrato: len > 0.5 ? 1 : 0.3 });
        at += len;
      }
      for (let i = 0; i < 8; i++)
        pluck(E, v, t + 0.7 + i * 0.045, note(i), { peak: 0.24, length: 1.2 });
      pluck(E, v, at - 1.1, note(5), { peak: 0.35, length: 1.5 });
    }
  },
  // Defeat: a slow 簫 line falling, over a low gong left to fade.
  loss: {
    cost: 5,
    life: 3.6,
    run(E, t) {
      const v = E.voice({ gain: 0.379, wet: 0.4 });
      gong(E, v, t, { f: 86, peak: 0.42, decay: 3.2, glide: -0.06 });
      pluck(E, v, t + 0.05, note(-5), { timbre: 'qin', peak: 0.5, length: 2 });
      let at = t + 0.35;
      for (const [d, len] of [
        [4, 0.45],
        [3, 0.45],
        [1, 0.5],
        [0, 0.55],
        [-1, 1.3]
      ]) {
        flute(E, v, at, note(d), len + 0.05, { kind: 'xiao', peak: 0.26, vibrato: 0.8 });
        at += len;
      }
    }
  }
};

// ---- the board ---------------------------------------------------------------------------

// Footfalls by the ground under the foot.
const GROUND = {
  plain: 'stone',
  cover: 'stone',
  rock: 'stone',
  crate: 'wood',
  bridge: 'wood',
  reeds: 'water',
  bamboo: 'leaves',
  herbs: 'grass'
};

const BOARD = {
  step: {
    cost: 1,
    life: 0.15,
    run(E, t, o) {
      const ground = GROUND[o.ground] || 'stone',
        lift = o.foot ? 1.06 : 0.95;
      const v = E.voice({ gain: 0.46 * (o.level ?? 1), pan: o.pan, wet: 0.05 });
      if (ground === 'wood') {
        block(E, v, t, { f: 260 * lift, peak: 0.22, decay: 0.07 });
        hiss(E, v, t, { type: 'bandpass', f: 900, q: 1, attack: 0.002, peak: 0.08, decay: 0.03 });
      } else if (ground === 'water') {
        hiss(E, v, t, {
          type: 'bandpass',
          f: 1100 * lift,
          to: 600,
          q: 1.1,
          attack: 0.006,
          peak: 0.24,
          decay: 0.12
        });
        for (let i = 0; i < 2; i++)
          sweep(E, v, t + 0.03 + E.rand(0, 0.06), {
            from: E.rand(800, 1400),
            to: E.rand(1600, 2400),
            glide: 0.02,
            attack: 0.002,
            peak: 0.04,
            decay: 0.03
          });
      } else if (ground === 'leaves' || ground === 'grass') {
        hiss(E, v, t, {
          type: 'highpass',
          f: ground === 'leaves' ? 3000 : 2000,
          q: 0.7,
          attack: 0.004,
          peak: 0.12,
          decay: 0.08
        });
        hiss(E, v, t, { type: 'lowpass', f: 600, q: 0.7, attack: 0.002, peak: 0.12, decay: 0.04 });
      } else {
        hiss(E, v, t, {
          type: 'lowpass',
          f: 1400 * lift,
          q: 0.9,
          attack: 0.002,
          peak: 0.6,
          decay: 0.05
        });
        hiss(E, v, t, {
          type: 'bandpass',
          f: 2600 * lift,
          q: 1.5,
          attack: 0.001,
          peak: 0.12,
          decay: 0.02
        });
        sweep(E, v, t, {
          from: 150 * lift,
          to: 90,
          glide: 0.03,
          attack: 0.002,
          peak: 0.12,
          decay: 0.05
        });
      }
    }
  },
  // A plain blow on its way: the blade or fist cutting air just before it lands.
  swing: {
    cost: 1,
    life: 0.2,
    run(E, t, o) {
      const v = E.voice({ gain: 0.48, pan: o.pan, wet: 0.08 });
      whoosh(E, v, t, 0.17, { from: 320, to: 2800, peak: 0.32, q: 1.2 });
    }
  },
  // A blow lands. Light and heavy hits differ in body; a killing blow adds a cymbal.
  // Blows of a technique carry only the body: the technique has its own impact.
  blow: {
    cost: 2,
    life: 0.5,
    run(E, t, o) {
      const heavy = o.ratio >= 0.3 || o.rank >= 3,
        art = o.rank > 0;
      const v = E.voice({
        gain: (o.lead === false ? 0.62 : 0.85) * (art ? 0.75 : 1),
        pan: o.pan,
        wet: 0.1
      });
      if (heavy) {
        thud(E, v, t, { f: 56, peak: 0.75, decay: 0.34, crack: art ? 0.15 : 0.45 });
        drum(E, v, t, { f: 68, peak: 0.35, decay: 0.3, slap: 0.15 });
        hiss(E, v, t, { type: 'lowpass', f: 3200, q: 0.7, attack: 0.001, peak: 0.18, decay: 0.09 });
      } else thud(E, v, t, { f: 82, peak: 0.6, decay: 0.18, crack: art ? 0.12 : 0.38 });
      if (o.counter) ring(E, v, t, { f: 2700, peak: 0.07, decay: 0.35, tick: 0.6 });
      if (o.kill) {
        cymbal(E, v, t + 0.01, { peak: 0.16, decay: 0.55 });
        drum(E, v, t + 0.01, { f: 60, peak: 0.4, decay: 0.45 });
      }
    }
  },
  // A blow that does nothing: steel turned aside by steel.
  block: {
    cost: 2,
    life: 0.6,
    run(E, t, o) {
      const v = E.voice({ gain: 0.6, pan: o.pan, wet: 0.2 });
      ring(E, v, t, { f: 2950, peak: 0.12, decay: 0.55, tick: 0.8 });
      block(E, v, t, { f: 1250, peak: 0.12, decay: 0.03 });
    }
  },
  // Life paid for power: a heartbeat.
  cost: {
    cost: 2,
    life: 0.5,
    run(E, t, o) {
      const v = E.voice({ gain: 0.477, pan: o.pan, wet: 0.12 });
      thud(E, v, t, { f: 48, peak: 0.5, decay: 0.16, crack: 0 });
      thud(E, v, t + 0.17, { f: 44, peak: 0.38, decay: 0.2, crack: 0 });
    }
  },
  // Health given back: two high bells.
  mend: {
    cost: 2,
    life: 0.8,
    run(E, t, o) {
      const v = E.voice({ gain: 0.45, pan: o.pan, wet: 0.4 });
      sweep(E, v, t, { from: note(12), attack: 0.003, peak: 0.12, decay: 0.6 });
      sweep(E, v, t + 0.08, { from: note(14), attack: 0.003, peak: 0.1, decay: 0.7 });
      hiss(E, v, t, { type: 'highpass', f: 6000, attack: 0.08, peak: 0.03, decay: 0.3 });
    }
  },
  // A condition takes hold: a rising pair for a blessing, a bent falling 琵琶 for a curse.
  status: {
    cost: 1,
    life: 0.6,
    run(E, t, o) {
      const v = E.voice({ gain: 0.499, pan: o.pan, wet: 0.25 });
      if (o.friendly) {
        pluck(E, v, t, note(7), { peak: 0.35, length: 0.6 });
        pluck(E, v, t + 0.07, note(9), { peak: 0.32, length: 0.7 });
      } else
        pluck(E, v, t, note(4), {
          timbre: 'pipa',
          peak: 0.5,
          bend: -2,
          bendAt: 0.05,
          bendTime: 0.22
        });
    }
  },
  // A piece is defeated as its ink scatters: a falling breath of air, a low gong and a
  // sagging string. A fallen ally is mourned with a short 簫 note.
  fall: {
    cost: 4,
    life: 1.4,
    run(E, t, o) {
      const v = E.voice({ gain: 0.412, pan: o.pan, wet: 0.35 });
      whoosh(E, v, t, 0.5, { from: 3800, to: 500, peak: 0.22, q: 0.7 });
      gong(E, v, t + 0.04, { f: 98, peak: 0.25, decay: 1.2, glide: -0.05, partials: 4 });
      pluck(E, v, t + 0.04, note(-4), {
        timbre: 'pipa',
        peak: 0.4,
        bend: -1.5,
        bendAt: 0.05,
        bendTime: 0.4
      });
      if (o.ally) flute(E, v, t + 0.2, note(1), 0.9, { kind: 'xiao', peak: 0.16, vibrato: 0.8 });
    }
  },
  // Thrown back a square: feet dragged over the ground.
  skid: {
    cost: 1,
    life: 0.3,
    run(E, t, o) {
      const v = E.voice({ gain: 0.5, pan: o.pan, wet: 0.06 });
      hiss(E, v, t, {
        type: 'bandpass',
        f: 1400,
        to: 380,
        q: 1.1,
        attack: 0.01,
        peak: 1.6,
        decay: 0.22,
        over: 0.24
      });
      thud(E, v, t + 0.02, { f: 90, peak: 0.25, decay: 0.1, crack: 0 });
    }
  }
};

// ---- techniques --------------------------------------------------------------------------
// Six families, one per painted effect. Each has a gathering (while the stroke is drawn)
// and an impact (when the painted blow lands). `p` scales pitch: foes are lower.

const GATHER = {
  // 獨孤九劍: a blade drawn and a 琵琶 tremolo that climbs.
  hero(E, v, t, p) {
    scrape(E, v, t, 0.3, { from: 2000, to: 6000, peak: 0.09 });
    for (let i = 0; i < 7; i++)
      pluck(E, v, t + i * 0.045, note(7 + Math.floor(i / 3)) * p, {
        timbre: 'pipa',
        peak: 0.16 + i * 0.03,
        length: 0.3
      });
  },
  // 降龍十八掌: the drum quickens under a rising roar.
  guo(E, v, t, p) {
    for (const [i, at] of [0, 0.14, 0.25, 0.33].entries())
      drum(E, v, t + at, { f: 88 * p, peak: 0.25 + i * 0.1, decay: 0.2 });
    hiss(E, v, t, {
      type: 'lowpass',
      f: 180,
      to: 1100,
      q: 3,
      attack: 0.38,
      peak: 0.3,
      decay: 0.15,
      over: 0.45
    });
  },
  // 玉女素心劍: a breath on the 簫 and a light step of the blades.
  xiao(E, v, t, p) {
    flute(E, v, t, note(7) * p, 0.2, { kind: 'xiao', peak: 0.18, vibrato: 0 });
    flute(E, v, t + 0.18, note(9) * p, 0.3, { kind: 'xiao', peak: 0.2, vibrato: 0.5 });
    whoosh(E, v, t + 0.12, 0.22, { from: 900, to: 4000, peak: 0.12 });
  },
  // 六脈神劍: a fast 箏 run, one note for each meridian.
  duan(E, v, t, p) {
    for (let i = 0; i < 6; i++)
      pluck(E, v, t + i * 0.05, note(5 + i) * p, { peak: 0.3, length: 0.7 });
  },
  // 清心普善咒: three slow 琴 notes, the middle one pressed and slid.
  medic(E, v, t, p) {
    pluck(E, v, t, note(0) * p, { timbre: 'qin', peak: 0.5, length: 1.2 });
    pluck(E, v, t + 0.16, note(2) * p, {
      timbre: 'qin',
      peak: 0.45,
      bend: 1,
      bendAt: 0.08,
      bendTime: 0.15,
      length: 1.2
    });
    pluck(E, v, t + 0.32, note(4) * p, { timbre: 'qin', peak: 0.45, length: 1.4 });
  },
  // 吸功入地小法: the earth grinding under one deep drum.
  guard(E, v, t, p) {
    drum(E, v, t, { f: 58 * p, peak: 0.55, decay: 0.5 });
    hiss(E, v, t, {
      type: 'lowpass',
      f: 140,
      to: 520,
      q: 4,
      attack: 0.3,
      peak: 0.35,
      decay: 0.2,
      over: 0.5
    });
  }
};

const IMPACT = {
  // Two rings of a sword and the cut of the air.
  hero(E, v, t, p) {
    whoosh(E, v, t, 0.07, { from: 1400, to: 5200, peak: 0.3 });
    ring(E, v, t, { f: 2600 * p, peak: 0.13, decay: 1 });
    ring(E, v, t + 0.045, { f: 3480 * p, peak: 0.1, decay: 0.8 });
    cymbal(E, v, t, { peak: 0.1, decay: 0.3, bright: 1.2 });
  },
  // A palm like a falling bell: boom, gong and a blast of air.
  guo(E, v, t, p) {
    thud(E, v, t, { f: 44, peak: 0.9, decay: 0.6, crack: 0.3 });
    drum(E, v, t, { f: 66 * p, peak: 0.55, decay: 0.5 });
    gong(E, v, t, { f: 84 * p, peak: 0.42, decay: 2, glide: -0.05, partials: 5 });
    hiss(E, v, t, {
      type: 'lowpass',
      f: 2400,
      to: 260,
      q: 0.8,
      attack: 0.004,
      peak: 0.4,
      decay: 0.5,
      over: 0.5
    });
  },
  // Twin blades: two rings, the second a step lower, and a high grace note.
  xiao(E, v, t, p) {
    whoosh(E, v, t, 0.07, { from: 1800, to: 6000, peak: 0.2 });
    ring(E, v, t, { f: 3100 * p, peak: 0.12, decay: 0.9 });
    ring(E, v, t + 0.075, { f: 2750 * p, peak: 0.12, decay: 1 });
    flute(E, v, t + 0.1, note(12) * p, 0.35, { kind: 'di', peak: 0.08, vibrato: 0.6 });
  },
  // Six rays of qi: six quick falling sparks that end on a ring.
  duan(E, v, t, p) {
    for (let i = 0; i < 6; i++)
      sweep(E, v, t + i * 0.035, {
        from: 3400 * p,
        to: 700 * p,
        glide: 0.05,
        attack: 0.002,
        peak: 0.13,
        decay: 0.07
      });
    ring(E, v, t + 0.21, { f: 3900 * p, peak: 0.1, decay: 0.7 });
    hiss(E, v, t, { type: 'bandpass', f: 4500, q: 2, attack: 0.004, peak: 0.12, decay: 0.25 });
  },
  // A song that heals: a bell-like 琴 harmonic and a cloud of small bells.
  medic(E, v, t, p) {
    pluck(E, v, t, note(9) * p, { timbre: 'qin', peak: 0.45, length: 1.4 });
    shimmer(E, v, t, 0.7, { peak: 0.07, count: 8 });
    gong(E, v, t, { f: 700 * p, peak: 0.16, decay: 1.2, glide: 0, partials: 3, bloom: 0.01 });
  },
  // The ground answers: a deep blow and stones falling.
  guard(E, v, t, p) {
    thud(E, v, t, { f: 40, peak: 0.85, decay: 0.55, crack: 0.25 });
    drum(E, v, t, { f: 54 * p, peak: 0.45, decay: 0.45 });
    for (let i = 0; i < 8; i++)
      hiss(E, v, t + 0.02 + E.rand(0, 0.38), {
        type: 'lowpass',
        f: E.rand(500, 1400),
        q: 1.5,
        attack: 0.002,
        peak: E.rand(0.08, 0.18),
        decay: 0.04
      });
  }
};

// Mastered arts drawn with their own flourish sound like what they do.
const FLOURISH = {
  blink: [
    (E, v, t) => whoosh(E, v, t, 0.3, { from: 600, to: 3600, peak: 0.22, q: 2 }),
    (E, v, t) => {
      whoosh(E, v, t, 0.06, { from: 2400, to: 7000, peak: 0.25, q: 2 });
      thud(E, v, t + 0.03, { f: 90, peak: 0.3, decay: 0.12, crack: 0 });
    }
  ],
  poison: [
    (E, v, t) => {
      for (let i = 0; i < 6; i++)
        sweep(E, v, t + i * 0.06 + E.rand(0, 0.03), {
          from: E.rand(260, 420),
          to: E.rand(700, 1000),
          glide: 0.04,
          attack: 0.003,
          peak: 0.1,
          decay: 0.05
        });
    },
    (E, v, t) => {
      hiss(E, v, t, { type: 'highpass', f: 3200, q: 0.7, attack: 0.02, peak: 0.18, decay: 0.45 });
      for (let i = 0; i < 4; i++)
        sweep(E, v, t + i * 0.07, {
          from: E.rand(200, 380),
          to: E.rand(600, 900),
          glide: 0.05,
          attack: 0.003,
          peak: 0.08,
          decay: 0.06
        });
    }
  ],
  debuff: [
    (E, v, t, p) =>
      pluck(E, v, t, note(4) * p, {
        timbre: 'pipa',
        peak: 0.5,
        bend: -2,
        bendAt: 0.06,
        bendTime: 0.3
      }),
    (E, v, t, p) => {
      gong(E, v, t, { f: 190 * p, peak: 0.25, decay: 1, glide: -0.08, partials: 4 });
      pluck(E, v, t, note(1) * p, {
        timbre: 'pipa',
        peak: 0.4,
        bend: -1,
        bendAt: 0.04,
        bendTime: 0.3
      });
    }
  ],
  sacrifice: [
    (E, v, t) => {
      thud(E, v, t, { f: 48, peak: 0.45, decay: 0.15, crack: 0 });
      thud(E, v, t + 0.17, { f: 44, peak: 0.35, decay: 0.2, crack: 0 });
      sweep(E, v, t, { from: 55, to: 82, glide: 0.5, attack: 0.3, peak: 0.2, decay: 0.3 });
    },
    (E, v, t, p) => {
      thud(E, v, t, { f: 46, peak: 0.8, decay: 0.45, crack: 0.2 });
      pluck(E, v, t, note(-5) * p, { timbre: 'qin', peak: 0.5, length: 1.4 });
    }
  ],
  rally: [
    (E, v, t) => {
      for (const [i, at] of [0, 0.13, 0.26].entries())
        drum(E, v, t + at, { f: 92, peak: 0.35 + i * 0.1, decay: 0.25 });
    },
    (E, v, t, p) => {
      gong(E, v, t, { f: 300 * p, peak: 0.3, decay: 1.2, glide: 0.06, partials: 4 });
      cymbal(E, v, t, { peak: 0.14, decay: 0.6 });
      flute(E, v, t + 0.05, note(10) * p, 0.6, { peak: 0.12, vibrato: 0.8 });
    }
  ],
  shield: [
    (E, v, t) =>
      sweep(E, v, t, { from: 110, to: 220, glide: 0.4, attack: 0.25, peak: 0.12, decay: 0.2 }),
    (E, v, t, p) =>
      gong(E, v, t, { f: 330 * p, peak: 0.36, decay: 1.6, glide: 0, partials: 5, bloom: 0.01 })
  ],
  haste: [
    (E, v, t, p) => {
      for (let i = 0; i < 6; i++)
        flute(E, v, t + i * 0.06, note(i % 2 ? 9 : 8) * p, 0.07, {
          peak: 0.12,
          scoop: 0,
          vibrato: 0
        });
    },
    (E, v, t) => whoosh(E, v, t, 0.5, { from: 300, to: 4200, peak: 0.26, q: 1 })
  ]
};

// The upper tiers swell before they land and crash when they do.
function tierGather(E, v, t, rank) {
  if (rank < 3) return;
  // A cymbal heard backwards: noise that swells into the blow.
  hiss(E, v, t + 0.05, {
    type: 'highpass',
    f: 4200,
    q: 0.5,
    attack: rank === 4 ? 0.7 : 0.45,
    peak: 0.12,
    decay: 0.08
  });
  for (let i = 0; i < (rank === 4 ? 8 : 5); i++)
    drum(E, v, t + 0.1 + i * 0.07, { f: 130, peak: 0.08 + i * 0.03, decay: 0.12, slap: 0.4 });
  if (rank === 4)
    sweep(E, v, t, { from: 42, to: 64, glide: 0.8, attack: 0.6, peak: 0.25, decay: 0.3 });
}
function tierImpact(E, v, t, rank) {
  if (rank < 3) return;
  cymbal(E, v, t, { peak: rank === 4 ? 0.22 : 0.15, decay: rank === 4 ? 1.4 : 0.8 });
  drum(E, v, t, { f: 62, peak: 0.45, decay: 0.45 });
  if (rank === 4) gong(E, v, t + 0.02, { f: 96, peak: 0.45, decay: 3, glide: -0.05 });
}

// A foe's technique: lower, and with a dark, beating drone under the gathering.
function foeShadow(E, v, t) {
  sweep(E, v, t, { from: 73.4, attack: 0.15, peak: 0.12, decay: 0.6 });
  sweep(E, v, t, { from: 77.8, attack: 0.15, peak: 0.12, decay: 0.6 });
}

// [gathering, impact] gain of each family and flourish.
const TRIM = {
  hero: [1, 1],
  guo: [0.5, 0.82],
  xiao: [1, 1],
  duan: [1, 1.15],
  medic: [0.36, 1.55],
  guard: [1, 1],
  blink: [1.6, 2.4],
  poison: [2.4, 1.6],
  debuff: [1.25, 1.25],
  sacrifice: [0.65, 1],
  rally: [0.55, 1],
  shield: [1, 1],
  haste: [1.6, 1]
};

const technique = {
  cost: 6,
  life: 2,
  run(E, t, o) {
    const rank = Math.max(1, Math.min(4, o.rank || 1)),
      kind = GATHER[o.visual] ? o.visual : 'hero',
      p = o.foe ? 0.8 : 1;
    const level = [0, 0.75, 0.85, 1, 1.08][rank];
    const flourish = FLOURISH[o.flourish],
      gather = o.phase === 'gather';
    // Each family's own level, measured so that none stands out from the others.
    const trim = (flourish ? TRIM[o.flourish] : TRIM[kind])[gather ? 0 : 1];
    const v = E.voice({ gain: 0.6 * level * trim, pan: o.pan, wet: rank >= 3 ? 0.32 : 0.22 });
    const tier = E.voice({ gain: 0.5 * level, pan: o.pan, wet: 0.3 });
    if (gather) {
      if (flourish) flourish[0](E, v, t, p);
      else GATHER[kind](E, v, t, p);
      tierGather(E, tier, t, rank);
      if (o.foe) foeShadow(E, tier, t);
    } else {
      if (flourish) flourish[1](E, v, t, p);
      else IMPACT[kind](E, v, t, p);
      tierImpact(E, tier, t, rank);
    }
  }
};

const SOUNDS = { ...UI, ...BOARD, technique };

export { SOUNDS, GROUND };
