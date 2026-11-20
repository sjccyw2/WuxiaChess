// The instruments: each one schedules a single note or stroke into a voice and returns
// the time it falls silent. `E` is the Engine, `v` the voice, `t` the start time.

// The gong mode of the Chinese pentatonic on D: 宮 商 角 徵 羽.
const STEPS = [0, 2, 4, 7, 9];
const BASE = 293.66;
// Scale degree to pitch; degree 5 is the next octave's 宮, negative degrees go down.
function note(degree, base = BASE) {
  const octave = Math.floor(degree / 5),
    step = STEPS[((degree % 5) + 5) % 5];
  return base * 2 ** (octave + step / 12);
}

// A tone with a pitch glide: the plain oscillator sound, used for bodies and sparks.
function sweep(
  E,
  v,
  t,
  { type = 'sine', from, to = from, glide = 0.05, attack = 0.003, peak, decay, detune = 0 }
) {
  const ctx = E.ctx,
    osc = ctx.createOscillator();
  osc.type = type;
  osc.detune.value = detune;
  osc.frequency.setValueAtTime(from, t);
  if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, t + glide);
  const { node, end } = E.amp(v.input, t, attack, peak, decay);
  osc.connect(node);
  E.play(v, osc, t, end);
  return end;
}

// Filtered noise with its own envelope and an optional sweep of the filter.
function hiss(
  E,
  v,
  t,
  {
    type = 'bandpass',
    f,
    to = f,
    q = 1,
    attack = 0.003,
    peak,
    decay,
    hold = 0,
    over = null,
    rate = 1
  }
) {
  const src = E.noiseSource(rate);
  const filter = E.filter(type, f, q);
  if (to !== f) {
    filter.frequency.setValueAtTime(f, t);
    filter.frequency.exponentialRampToValueAtTime(to, t + (over ?? attack + hold + decay));
  }
  const { node, end } = E.amp(v.input, t, attack, peak, decay, hold);
  src.connect(filter).connect(node);
  E.startNoise(v, src, t, end);
  return end;
}

// 箏, 琵琶 or 琴 string. `bend` is a slide in semitones after the attack (a pressed note).
function pluck(
  E,
  v,
  t,
  hz,
  { timbre = 'zheng', peak = 0.5, bend = 0, bendAt = 0.12, bendTime = 0.18, length = null }
) {
  const ctx = E.ctx,
    src = ctx.createBufferSource();
  src.buffer = E.string(hz, timbre);
  if (bend) {
    src.playbackRate.setValueAtTime(1, t + bendAt);
    src.playbackRate.linearRampToValueAtTime(2 ** (bend / 12), t + bendAt + bendTime);
  }
  const g = ctx.createGain();
  const dur = Math.min(length ?? Infinity, src.buffer.duration);
  // A string cut short is damped by the hand: it fades over the last third, not at once.
  const fade = dur < src.buffer.duration - 0.05 ? dur * 0.35 : 0.03;
  g.gain.setValueAtTime(peak, t);
  g.gain.setValueAtTime(peak, t + dur - fade);
  g.gain.linearRampToValueAtTime(0, t + dur);
  // A little body: the soundboard rounds off the very top.
  const tone = E.filter('lowpass', timbre === 'qin' ? 2600 : 6500, 0.5);
  src.connect(tone).connect(g).connect(v.input);
  E.play(v, src, t, t + dur + 0.01);
  return t + dur + 0.01;
}

// 笛 (bright, with the membrane's buzz) or 簫 (low and breathy). A sine with a few
// harmonics, a breath of noise tuned to the note, a chiff at the start and late vibrato.
function flute(E, v, t, hz, dur, { kind = 'di', peak = 0.2, scoop = 0.4, vibrato = 0.6 }) {
  const ctx = E.ctx,
    xiao = kind === 'xiao';
  const attack = xiao ? 0.09 : 0.05;
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(peak, t + attack);
  env.gain.setValueAtTime(peak, t + Math.max(attack, dur - 0.16));
  env.gain.linearRampToValueAtTime(0, t + dur);
  env.connect(v.input);
  const lfo = ctx.createOscillator(),
    depth = ctx.createGain();
  lfo.frequency.value = xiao ? 4.6 : 5.6;
  depth.gain.setValueAtTime(0, t);
  depth.gain.linearRampToValueAtTime(0, t + Math.min(0.22, dur * 0.4));
  depth.gain.linearRampToValueAtTime(18 * vibrato, t + Math.min(0.5, dur * 0.8));
  lfo.connect(depth);
  const parts = xiao
    ? [
        [1, 1],
        [2, 0.12],
        [3, 0.04]
      ]
    : [
        [1, 1],
        [2, 0.28],
        [3, 0.12],
        [4, 0.05]
      ];
  for (const [k, level] of parts) {
    const o = ctx.createOscillator(),
      g = ctx.createGain();
    o.frequency.setValueAtTime(hz * k * 2 ** (-scoop / 12), t);
    o.frequency.exponentialRampToValueAtTime(hz * k, t + 0.07);
    depth.connect(o.detune);
    g.gain.value = level * 0.6;
    o.connect(g).connect(env);
    E.play(v, o, t, t + dur + 0.01);
  }
  E.play(v, lfo, t, t + dur + 0.01);
  // Breath tuned to the note, stronger for the 簫.
  const breath = E.noiseSource(),
    band = E.filter('bandpass', hz * (xiao ? 1 : 2), xiao ? 4 : 6),
    bg = ctx.createGain();
  bg.gain.value = xiao ? 0.9 : 0.35;
  breath.connect(band).connect(bg).connect(env);
  E.startNoise(v, breath, t, t + dur + 0.01);
  // The membrane of a 笛 adds a reedy edge high up.
  if (!xiao) {
    const buzz = E.noiseSource(),
      high = E.filter('bandpass', Math.min(9000, hz * 5), 3),
      hg = ctx.createGain();
    hg.gain.value = 0.12;
    buzz.connect(high).connect(hg).connect(env);
    E.startNoise(v, buzz, t, t + dur + 0.01);
  }
  hiss(E, v, t, { type: 'highpass', f: 2500, peak: peak * (xiao ? 0.5 : 0.35), decay: 0.06 });
  return t + dur + 0.01;
}

// 堂鼓: a skin that drops in pitch, a slap of the stick, and a short boom.
function drum(E, v, t, { f = 105, peak = 0.7, decay = 0.38, slap = 0.25 }) {
  sweep(E, v, t, { from: f * 2.1, to: f, glide: 0.045, attack: 0.002, peak, decay });
  sweep(E, v, t, {
    type: 'triangle',
    from: f * 3.1,
    to: f * 1.5,
    glide: 0.03,
    attack: 0.001,
    peak: peak * 0.25,
    decay: decay * 0.4
  });
  hiss(E, v, t, {
    type: 'lowpass',
    f: 1800,
    q: 0.6,
    attack: 0.001,
    peak: peak * slap,
    decay: 0.05
  });
  return t + decay + 0.02;
}

// Inharmonic partials of a hand gong. `glide` bends the whole sound: 大鑼 falls, 小鑼 rises.
const GONG = [
  [1, 1, 1],
  [1.48, 0.55, 0.8],
  [2.02, 0.42, 0.62],
  [2.47, 0.3, 0.5],
  [3.03, 0.22, 0.4],
  [3.66, 0.14, 0.32],
  [4.41, 0.09, 0.25]
];
function gong(
  E,
  v,
  t,
  { f = 140, peak = 0.4, decay = 2.4, glide = -0.03, bloom = 0.04, partials = GONG.length }
) {
  let end = t;
  for (const [ratio, level, life] of GONG.slice(0, partials)) {
    const hz = f * ratio;
    // Higher partials bloom a moment later, the shimmer of a struck gong.
    const attack = 0.004 + bloom * ratio * 0.5;
    end = Math.max(
      end,
      sweep(E, v, t, {
        from: hz,
        to: hz * (1 + glide),
        glide: decay * 0.45,
        attack,
        peak: peak * level * 0.5,
        decay: decay * life,
        detune: E.rand(-6, 6)
      })
    );
  }
  hiss(E, v, t, { type: 'lowpass', f: 900, q: 0.5, attack: 0.002, peak: peak * 0.35, decay: 0.12 });
  return end;
}

// 鈸: a bright splash of noise with two metallic bands that ring a little longer.
function cymbal(E, v, t, { peak = 0.35, decay = 0.9, bright = 1 }) {
  hiss(E, v, t, { type: 'highpass', f: 5200 * bright, q: 0.5, attack: 0.002, peak, decay });
  hiss(E, v, t, {
    type: 'bandpass',
    f: 3400 * bright,
    q: 4,
    attack: 0.002,
    peak: peak * 0.8,
    decay: decay * 0.7
  });
  hiss(E, v, t, {
    type: 'bandpass',
    f: 7300 * bright,
    q: 6,
    attack: 0.003,
    peak: peak * 0.6,
    decay: decay * 1.15
  });
  return t + decay * 1.15 + 0.02;
}

// 梆子 or 木魚: two quick resonances and a click.
function block(E, v, t, { f = 880, peak = 0.3, decay = 0.07 }) {
  sweep(E, v, t, { from: f * 1.04, to: f, glide: 0.01, attack: 0.001, peak, decay });
  sweep(E, v, t, { from: f * 2.71, attack: 0.001, peak: peak * 0.3, decay: decay * 0.5 });
  hiss(E, v, t, {
    type: 'bandpass',
    f: f * 3.5,
    q: 2,
    attack: 0.001,
    peak: peak * 0.4,
    decay: 0.012
  });
  return t + decay + 0.02;
}

// A sword blade ringing: the free-bar modes of a strip of steel, a slow beat between two
// close fundamentals, and the bright tick of contact.
function ring(E, v, t, { f = 2400, peak = 0.16, decay = 1.1, tick = 0.5 }) {
  let end = t;
  for (const [ratio, level, life] of [
    [1, 1, 1],
    [1.004, 0.7, 1],
    [2.76, 0.5, 0.6],
    [5.4, 0.25, 0.35]
  ]) {
    const hz = f * ratio;
    if (hz > 15000) continue;
    end = Math.max(
      end,
      sweep(E, v, t, { from: hz, attack: 0.001, peak: peak * level, decay: decay * life })
    );
  }
  hiss(E, v, t, {
    type: 'highpass',
    f: 4000,
    q: 0.7,
    attack: 0.001,
    peak: peak * tick * 2,
    decay: 0.03
  });
  return end;
}

// Steel along steel: a narrow band of noise that slides and chatters.
function scrape(E, v, t, dur, { from = 2600, to = 5200, peak = 0.12 }) {
  const ctx = E.ctx;
  const chatter = ctx.createOscillator(),
    depth = ctx.createGain(),
    am = ctx.createGain();
  chatter.type = 'square';
  chatter.frequency.value = 55;
  depth.gain.value = 0.45;
  am.gain.value = 0.55;
  chatter.connect(depth).connect(am.gain);
  am.connect(v.input);
  const src = E.noiseSource(),
    band = E.filter('bandpass', from, 9);
  band.frequency.setValueAtTime(from, t);
  band.frequency.exponentialRampToValueAtTime(to, t + dur);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(peak * 2.4, t + dur * 0.25);
  env.gain.linearRampToValueAtTime(0, t + dur);
  src.connect(band).connect(env).connect(am);
  E.startNoise(v, src, t, t + dur + 0.01);
  E.play(v, chatter, t, t + dur + 0.01);
  return t + dur + 0.01;
}

// Air or cloth cut by a fast movement: a band of noise that swells and slides.
function whoosh(E, v, t, dur, { from = 400, to = 2200, peak = 0.25, q = 1.4 }) {
  const ctx = E.ctx,
    src = E.noiseSource();
  const band = E.filter('bandpass', from, q);
  band.frequency.setValueAtTime(from, t);
  band.frequency.exponentialRampToValueAtTime(to, t + dur * 0.7);
  band.frequency.exponentialRampToValueAtTime(Math.max(120, to * 0.6), t + dur);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(peak, t + dur * 0.62);
  env.gain.linearRampToValueAtTime(0, t + dur);
  src.connect(band).connect(env).connect(v.input);
  E.startNoise(v, src, t, t + dur + 0.01);
  return t + dur + 0.01;
}

// A body taking a blow: a low drop and a muffled burst.
function thud(E, v, t, { f = 68, peak = 0.7, decay = 0.22, crack = 0.3 }) {
  sweep(E, v, t, { from: f * 2.4, to: f, glide: 0.06, attack: 0.002, peak, decay });
  hiss(E, v, t, {
    type: 'lowpass',
    f: 700,
    q: 0.8,
    attack: 0.002,
    peak: peak * 0.6,
    decay: decay * 0.5
  });
  if (crack)
    hiss(E, v, t, {
      type: 'bandpass',
      f: 2200,
      q: 1.2,
      attack: 0.001,
      peak: peak * crack,
      decay: 0.035
    });
  return t + decay + 0.02;
}

// Bright little bells in the high register, scattered: the shimmer of healing.
function shimmer(E, v, t, dur, { peak = 0.06, count = 7, low = 10, high = 15 }) {
  let end = t;
  for (let i = 0; i < count; i++) {
    const at = t + (i / count) * dur * 0.8 + E.rand(0, 0.03);
    const hz = note(Math.floor(E.rand(low, high + 1)));
    end = Math.max(
      end,
      sweep(E, v, at, { from: hz, attack: 0.002, peak: peak * E.rand(0.6, 1), decay: 0.5 })
    );
    sweep(E, v, at, { from: hz * 2.01, attack: 0.002, peak: peak * 0.25, decay: 0.25 });
  }
  return end;
}

export {
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
};
