// The signal chain every sound passes through, and the small building blocks the
// instruments are made of. Nothing here knows about the game.
//
//   voice ─┬─ dry ──────────────────────────┐
//          └─ send ─ high-pass ─ hall ─ wet ─┴─ master ─ glue ─ limiter ─ soft clip ─ out
//
// An Engine works on any BaseAudioContext, so tools can render through an
// OfflineAudioContext exactly what the game plays.

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

// Buffers that do not depend on the context are kept across contexts (sound off and on
// again closes the context). Plucked strings are rendered at a low rate to stay small.
const PLUCK_RATE = 24000;
const plucks = new Map();
const PLUCK_LIMIT = 36;

// One deterministic random sequence, so a rendered sound is the same every run.
function random(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// A curve that leaves the signal alone below 0.6 and bends smoothly to 0.98 above it.
function softClip() {
  const n = 1024,
    curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1,
      a = Math.abs(x);
    const y = a <= 0.6 ? a : 0.6 + 0.38 * Math.tanh((a - 0.6) / 0.38);
    curve[i] = Math.sign(x) * y;
  }
  return curve;
}

// A hall built in code: two channels of decaying noise that darken as they fade, with
// a few early reflections in front so it reads as a room rather than a wash.
function hall(ctx, seconds = 1.9) {
  const rate = ctx.sampleRate,
    length = Math.floor(rate * seconds);
  const buffer = ctx.createBuffer(2, length, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch),
      roll = random(7 + ch * 31);
    let low = 0;
    for (let i = 0; i < length; i++) {
      const t = i / rate;
      // The one-pole filter closes as the tail ages: bright at first, dull at the end.
      const k = 0.62 - 0.5 * Math.min(1, t / seconds);
      low += k * (roll() * 2 - 1 - low);
      const fadeIn = Math.min(1, t / 0.012);
      data[i] = low * Math.exp(-t * 3.3) * fadeIn;
    }
    for (const [ms, gain] of [
      [11, 0.5],
      [19, -0.36],
      [29, 0.28],
      [43, -0.2]
    ]) {
      const at = Math.floor(((ms + ch * 3.7) / 1000) * rate);
      if (at < length) data[at] += gain;
    }
    // Last few milliseconds go to zero so the tail never ends on a step.
    const tail = Math.floor(rate * 0.02);
    for (let i = 0; i < tail; i++) data[length - 1 - i] *= i / tail;
  }
  return buffer;
}

// Karplus-Strong string, rendered once per pitch and timbre and reused.
// `damp` is the loss per period, `bright` how much of the pick noise survives,
// `pick` where along the string it is plucked (a comb that shapes the overtones).
function renderString(hz, { seconds = 1.6, damp = 0.996, bright = 0.5, pick = 0.18, seed = 1 }) {
  const rate = PLUCK_RATE,
    length = Math.floor(rate * seconds);
  const out = new Float32Array(length);
  const period = rate / hz - 0.5;
  const whole = Math.max(2, Math.floor(period)),
    frac = period - whole;
  const c = (1 - frac) / (1 + frac); // all-pass coefficient for the fractional delay
  const line = new Float32Array(whole + 2);
  const roll = random(seed + Math.round(hz * 10));
  // Excitation: noise, low-passed by `bright`, then combed by the pick position.
  let lp = 0;
  for (let i = 0; i < whole; i++) {
    lp += (0.15 + bright * 0.85) * (roll() * 2 - 1 - lp);
    line[i] = lp;
  }
  const gap = Math.max(1, Math.round(whole * pick));
  const combed = line.slice(0, whole).map((v, i) => v - (i >= gap ? line[i - gap] : 0) * 0.9);
  line.set(combed);
  let mean = 0;
  for (let i = 0; i < whole; i++) mean += line[i] / whole;
  for (let i = 0; i < whole; i++) line[i] -= mean;
  let index = 0,
    prev = 0,
    apIn = 0,
    apOut = 0;
  for (let n = 0; n < length; n++) {
    const cur = line[index];
    const avg = damp * 0.5 * (cur + prev);
    prev = cur;
    // y = c*x + x[-1] - c*y[-1]
    const y = c * avg + apIn - c * apOut;
    apIn = avg;
    apOut = y;
    line[index] = y;
    index = (index + 1) % whole;
    out[n] = cur;
  }
  let peak = 1e-6;
  for (let n = 0; n < length; n++) peak = Math.max(peak, Math.abs(out[n]));
  const fade = Math.floor(rate * 0.05);
  for (let n = 0; n < length; n++) {
    out[n] /= peak;
    if (n < 24) out[n] *= n / 24;
    if (n >= length - fade) out[n] *= (length - n) / fade;
  }
  return out;
}

class Engine {
  constructor(ctx) {
    this.ctx = ctx;
    this.voices = [];
    this.serial = 0;
    const master = ctx.createGain();
    master.gain.value = 0.82;
    // Glue: gentle compression so layered hits sit together.
    const glue = ctx.createDynamicsCompressor();
    glue.threshold.value = -16;
    glue.knee.value = 10;
    glue.ratio.value = 3.5;
    glue.attack.value = 0.006;
    glue.release.value = 0.22;
    // Limiter: fast and hard, a few dB under full scale.
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -6;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.001;
    limiter.release.value = 0.1;
    const clip = ctx.createWaveShaper();
    clip.curve = softClip();
    master.connect(glue).connect(limiter).connect(clip).connect(ctx.destination);
    this.master = master;
    this.dry = ctx.createGain();
    this.dry.connect(master);
    // The hall is fed through a high-pass so drums and thuds stay dry and tight.
    this.send = ctx.createGain();
    const cut = ctx.createBiquadFilter();
    cut.type = 'highpass';
    cut.frequency.value = 240;
    const verb = ctx.createConvolver();
    verb.normalize = true;
    verb.buffer = hall(ctx);
    this.wet = ctx.createGain();
    this.wet.gain.value = 0.55;
    this.send.connect(cut).connect(verb).connect(this.wet).connect(master);
    // One second of white noise, read from random places by every noisy sound.
    const rate = ctx.sampleRate;
    this.noise = ctx.createBuffer(1, rate, rate);
    const data = this.noise.getChannelData(0),
      roll = random(99);
    for (let i = 0; i < rate; i++) data[i] = roll() * 2 - 1;
    this.roll = random(1234);
    this.strings = new Map();
  }
  get now() {
    return this.ctx.currentTime;
  }
  rand(a = 0, b = 1) {
    return a + (b - a) * this.roll();
  }
  // Polyphony: how many sounds are still ringing, weighted by what they cost.
  load(at = this.now) {
    this.voices = this.voices.filter((v) => v.end > at);
    return this.voices.reduce((sum, v) => sum + v.weight, 0);
  }
  claim(weight, end, limit) {
    if (this.load() + weight > limit) return false;
    this.voices.push({ weight, end });
    return true;
  }
  // A voice is one sound's own output: its level, place in the stereo field and how much
  // of it reaches the hall. Every node made for the sound ends up here.
  voice({ gain = 1, pan = 0, wet = 0.2 } = {}) {
    const ctx = this.ctx,
      input = ctx.createGain();
    input.gain.value = gain;
    let tail = input;
    if (pan && ctx.createStereoPanner) {
      const p = ctx.createStereoPanner();
      p.pan.value = clamp(pan, -1, 1);
      input.connect(p);
      tail = p;
    }
    tail.connect(this.dry);
    if (wet > 0) {
      const s = ctx.createGain();
      s.gain.value = wet;
      tail.connect(s).connect(this.send);
    }
    const voice = { input, sources: 0 };
    // When the voice's last source has ended its nodes are let go.
    voice.done = () => {
      if (--voice.sources > 0) return;
      try {
        input.disconnect();
        if (tail !== input) tail.disconnect();
      } catch {}
    };
    return voice;
  }
  // Starts a source at `t` and stops it at `stop`, counted against its voice.
  play(voice, source, t, stop) {
    voice.sources++;
    source.onended = voice.done;
    source.start(t);
    source.stop(stop);
  }
  // An envelope on a gain param: linear attack, exponential fall of 60 dB over `decay`,
  // and a short linear close to exactly zero. Returns when it is silent.
  envelope(param, t, attack, peak, decay, hold = 0) {
    param.setValueAtTime(0, t);
    param.linearRampToValueAtTime(peak, t + attack);
    if (hold) param.setValueAtTime(peak, t + attack + hold);
    const fall = t + attack + hold + decay;
    param.exponentialRampToValueAtTime(Math.max(1e-5, peak * 0.001), fall);
    param.linearRampToValueAtTime(0, fall + 0.008);
    return fall + 0.01;
  }
  // A gain with an envelope, feeding `to`.
  amp(to, t, attack, peak, decay, hold = 0) {
    const g = this.ctx.createGain();
    const end = this.envelope(g.gain, t, attack, peak, decay, hold);
    g.connect(to);
    return { node: g, end };
  }
  filter(type, frequency, q = 0.7, to = null) {
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = frequency;
    f.Q.value = q;
    if (to) f.connect(to);
    return f;
  }
  // A looping read of the shared noise from a random place.
  noiseSource(rate = 1) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    src.loopStart = 0;
    src.loopEnd = this.noise.duration;
    src.playbackRate.value = rate;
    return src;
  }
  startNoise(voice, src, t, stop) {
    voice.sources++;
    src.onended = voice.done;
    src.start(t, this.rand(0, 0.9));
    src.stop(stop);
  }
  string(hz, timbre = 'zheng') {
    const key = timbre + '|' + Math.round(hz * 4);
    const ready = this.strings.get(key);
    if (ready) return ready;
    let data = plucks.get(key);
    if (!data) {
      const spec = TIMBRES[timbre] || TIMBRES.zheng;
      data = renderString(hz, spec);
      if (plucks.size >= PLUCK_LIMIT) plucks.delete(plucks.keys().next().value);
      plucks.set(key, data);
    }
    const buffer = this.ctx.createBuffer(1, data.length, PLUCK_RATE);
    if (buffer.copyToChannel) buffer.copyToChannel(data, 0);
    else buffer.getChannelData(0).set(data);
    if (this.strings.size >= PLUCK_LIMIT) this.strings.delete(this.strings.keys().next().value);
    this.strings.set(key, buffer);
    return buffer;
  }
}

// Plucked strings. 箏 rings long and bright, 琵琶 is close and quick, 琴 is dark and soft.
const TIMBRES = {
  zheng: { seconds: 1.7, damp: 0.9975, bright: 0.62, pick: 0.14 },
  pipa: { seconds: 0.75, damp: 0.991, bright: 0.85, pick: 0.09 },
  qin: { seconds: 2, damp: 0.997, bright: 0.3, pick: 0.22 }
};

export { Engine, clamp };
