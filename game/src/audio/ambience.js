// A very quiet bed of sound under each battlefield: wind, water, a cave's drip. One
// Ambience plays at a time; it fades in when made and out when stopped.
import { note, sweep, hiss, pluck, block } from './instruments.js';

// For each map (by index, named in scene/maze-atmosphere.js):
//   wind: [centre Hz, Q, level] of a band of moving air, or null
//   water: level of slow lapping water, or 0
//   room: level of a low hum, or 0
//   events: [name, average seconds between them]
// The beds are in map order; the comment after each is the map's name.
const BEDS = [
  {
    wind: [700, 0.8, 0.5],
    water: 0.5,
    events: [
      ['knock', 9],
      ['lap', 5]
    ]
  }, // 青竹渡
  {
    wind: [900, 0.7, 0.6],
    water: 0,
    events: [
      ['gust', 7],
      ['bird', 13]
    ]
  }, // 紅楓驛
  {
    wind: [1500, 0.9, 0.45],
    water: 0.6,
    events: [
      ['lap', 4],
      ['plip', 6]
    ]
  }, // 蘆花汀
  {
    wind: [1100, 3, 0.55],
    water: 0,
    events: [
      ['gust', 6],
      ['chime', 16]
    ]
  }, // 聽雪棧
  {
    wind: [600, 0.8, 0.4],
    water: 0,
    events: [
      ['qin', 18],
      ['chime', 14]
    ]
  }, // 空山琴臺
  {
    wind: [1000, 0.7, 0.4],
    water: 0,
    events: [
      ['bird', 7],
      ['gust', 11]
    ]
  }, // 桃花石陣
  {
    wind: [380, 1, 0.6],
    water: 0,
    events: [
      ['rubble', 10],
      ['war', 20]
    ]
  }, // 襄陽殘垣
  {
    wind: null,
    water: 0,
    room: 0.6,
    events: [
      ['drip', 2.6],
      ['plip', 7]
    ]
  }, // 寒玉石室
  {
    wind: [1300, 1.2, 0.3],
    water: 0.35,
    room: 0.3,
    events: [
      ['chime', 9],
      ['plip', 8]
    ]
  }, // 倒影天街
  {
    wind: [500, 1.5, 0.25],
    water: 0,
    room: 0.5,
    events: [
      ['clock', 1.8],
      ['chime', 20]
    ]
  }, // 無刻漏臺
  {
    wind: [800, 0.8, 0.5],
    water: 0.55,
    events: [
      ['knock', 8],
      ['lap', 5]
    ]
  }, // 神龍竹堂
  {
    wind: [1000, 0.7, 0.35],
    water: 0,
    events: [
      ['bird', 8],
      ['gust', 12]
    ]
  }, // 絕情花徑
  {
    wind: [1400, 0.9, 0.4],
    water: 0.75,
    events: [
      ['lap', 3],
      ['plip', 6]
    ]
  }, // 鐵掌溪灘
  {
    wind: [1200, 1.2, 0.25],
    water: 0.3,
    room: 0.25,
    events: [
      ['chime', 11],
      ['plip', 9]
    ]
  }, // 西夏夜苑
  {
    wind: [900, 2, 0.45],
    water: 0,
    events: [
      ['bird', 9],
      ['chime', 17]
    ]
  }, // 黑木繡閣
  {
    // Falling water, the air moving in a deep valley, now and then a bird.
    wind: [450, 0.9, 0.35],
    water: 0.65,
    events: [
      ['gust', 12],
      ['bird', 17],
      ['plip', 9]
    ]
  }, // 谷底棋臺
  {
    // The stream far down in the ravine and its little fall, wind in the court's bamboo, birds
    // on the tea slopes and now and then the wind bell under the hall's eaves.
    wind: [850, 1.3, 0.32],
    water: 0.3,
    events: [
      ['bird', 11],
      ['plip', 14],
      ['chime', 21],
      ['knock', 27]
    ]
  }, // 石樑溫家
  {
    // Night in the temple court: the pagoda's eave bells in a cold wind, now and then a
    // wooden fish knocked in a hall, and a gust round the pagoda.
    wind: [1100, 1.1, 0.28],
    water: 0,
    room: 0.2,
    events: [
      ['chime', 8],
      ['knock', 17],
      ['gust', 15]
    ]
  }, // 萬安寺
  {
    // High wind over the bare summit and the banners before the hall; a hawk now and then.
    wind: [650, 1.6, 0.6],
    water: 0,
    events: [
      ['gust', 6],
      ['bird', 23]
    ]
  }, // 光明頂
  {
    // The sea washing in at both ends of the hall and lapping at the landing, the hall's own
    // hollow hum, water dripping from the roof, now and then the sea wind in the mouth.
    wind: [450, 0.9, 0.28],
    water: 0.6,
    room: 0.4,
    events: [
      ['lap', 4],
      ['drip', 6],
      ['plip', 9],
      ['gust', 16]
    ]
  } // 俠客島
];

// The sparse sounds that punctuate a bed. Each is scheduled into the bed's own voice.
const EVENTS = {
  // A bamboo stem knocking against another.
  knock(E, v, t) {
    block(E, v, t, { f: E.rand(380, 520), peak: 0.12, decay: 0.09 });
    if (E.rand() < 0.6)
      block(E, v, t + E.rand(0.12, 0.2), { f: E.rand(420, 560), peak: 0.08, decay: 0.08 });
  },
  lap(E, v, t) {
    hiss(E, v, t, {
      type: 'bandpass',
      f: E.rand(350, 700),
      to: 300,
      q: 1.2,
      attack: 0.35,
      peak: 0.1,
      decay: 0.6,
      over: 0.9
    });
  },
  plip(E, v, t) {
    sweep(E, v, t, {
      from: E.rand(700, 1100),
      to: E.rand(1400, 2100),
      glide: 0.03,
      attack: 0.002,
      peak: 0.06,
      decay: 0.05
    });
  },
  drip(E, v, t) {
    const hz = E.rand(1300, 2300);
    sweep(E, v, t, { from: hz * 0.7, to: hz, glide: 0.015, attack: 0.001, peak: 0.1, decay: 0.08 });
  },
  gust(E, v, t) {
    hiss(E, v, t, {
      type: 'bandpass',
      f: E.rand(500, 900),
      to: E.rand(1500, 2600),
      q: 0.8,
      attack: 0.9,
      peak: 0.12,
      decay: 1.2,
      over: 2
    });
  },
  bird(E, v, t) {
    const base = E.rand(2600, 3600),
      n = 2 + Math.floor(E.rand(0, 3));
    for (let i = 0; i < n; i++)
      sweep(E, v, t + i * 0.11, {
        from: base,
        to: base * E.rand(1.2, 1.45),
        glide: 0.05,
        attack: 0.004,
        peak: 0.035,
        decay: 0.06
      });
  },
  chime(E, v, t) {
    const d = 10 + Math.floor(E.rand(0, 5));
    sweep(E, v, t, { from: note(d), attack: 0.003, peak: 0.04, decay: 1.4 });
    sweep(E, v, t, { from: note(d) * 2.76, attack: 0.003, peak: 0.012, decay: 0.6 });
  },
  qin(E, v, t) {
    pluck(E, v, t, note(Math.floor(E.rand(-5, 0))), { timbre: 'qin', peak: 0.12, length: 2 });
  },
  rubble(E, v, t) {
    for (let i = 0; i < 4; i++)
      hiss(E, v, t + E.rand(0, 0.4), {
        type: 'lowpass',
        f: E.rand(500, 1200),
        q: 1.2,
        attack: 0.002,
        peak: 0.05,
        decay: 0.04
      });
  },
  // A war drum somewhere beyond the walls.
  war(E, v, t) {
    for (let i = 0; i < 3; i++)
      sweep(E, v, t + i * 0.55, {
        from: 110,
        to: 62,
        glide: 0.06,
        attack: 0.004,
        peak: 0.08,
        decay: 0.4
      });
  },
  // The water clock: one even drop.
  clock(E, v, t) {
    sweep(E, v, t, { from: 1050, to: 1500, glide: 0.012, attack: 0.001, peak: 0.07, decay: 0.12 });
  }
};

// The bed's overall level: well under everything else.
const LEVEL = 0.055;

class Ambience {
  constructor(E, index) {
    this.E = E;
    this.bed = BEDS[index] || BEDS[0];
    this.sources = [];
    this.next = this.bed.events.map(() => 0);
    const ctx = E.ctx,
      t = E.now;
    // All of the bed, events included, goes through one fader.
    this.voice = E.voice({ gain: 1, wet: 0.35 });
    this.fader = ctx.createGain();
    this.fader.gain.setValueAtTime(0, t);
    this.fader.gain.linearRampToValueAtTime(LEVEL, t + 2.5);
    this.fader.connect(this.voice.input);
    this.v = { input: this.fader, sources: 0, done() {} };
    const { wind, water, room } = this.bed;
    if (wind) this.wind(...wind);
    if (water) this.water(water);
    if (room) this.room(room);
  }
  // A slow oscillator added onto `param`, at `rate` Hz and `depth`.
  drift(param, rate, depth) {
    const ctx = this.E.ctx,
      lfo = ctx.createOscillator(),
      g = ctx.createGain();
    lfo.frequency.value = rate;
    g.gain.value = depth;
    lfo.connect(g).connect(param);
    this.start(lfo);
  }
  start(src, offset) {
    if (offset != null) src.start(this.E.now, offset);
    else src.start(this.E.now);
    this.sources.push(src);
  }
  wind(f, q, level) {
    const E = this.E,
      src = E.noiseSource(0.5),
      band = E.filter('bandpass', f, q),
      g = E.ctx.createGain();
    g.gain.value = level * 0.35;
    src.connect(band).connect(g).connect(this.fader);
    this.drift(band.frequency, 0.07, f * 0.35);
    this.drift(band.frequency, 0.19, f * 0.12);
    this.drift(g.gain, 0.05, level * 0.2);
    this.start(src, E.rand(0, 0.9));
  }
  water(level) {
    const E = this.E,
      src = E.noiseSource(0.7),
      low = E.filter('lowpass', 420, 0.9),
      g = E.ctx.createGain();
    g.gain.value = level * 0.3;
    src.connect(low).connect(g).connect(this.fader);
    this.drift(g.gain, 0.23, level * 0.18);
    this.drift(low.frequency, 0.13, 140);
    this.start(src, E.rand(0, 0.9));
  }
  room(level) {
    const E = this.E,
      ctx = E.ctx;
    for (const hz of [55, 82.4]) {
      const o = ctx.createOscillator(),
        g = ctx.createGain();
      o.frequency.value = hz;
      g.gain.value = level * 0.06;
      o.connect(g).connect(this.fader);
      this.drift(g.gain, 0.09, level * 0.03);
      this.start(o);
    }
  }
  // Schedules the bed's sparse sounds that fall between `from` and `to` (context time).
  schedule(from, to) {
    for (const [i, [name, every]] of this.bed.events.entries()) {
      if (!this.next[i]) this.next[i] = from + this.E.rand(0.5, every);
      while (this.next[i] < to) {
        if (this.next[i] >= from) EVENTS[name](this.E, this.v, this.next[i]);
        const regular = name === 'clock';
        this.next[i] += regular ? every : every * this.E.rand(0.5, 1.5);
      }
    }
  }
  // Keeps the events coming while the page is open: a look-ahead of half a second.
  run() {
    if (this.timer) return;
    const tick = () => {
      const now = this.E.now;
      this.schedule(Math.max(now, this.until || 0), now + 0.5);
      this.until = now + 0.5;
    };
    tick();
    this.timer = setInterval(tick, 250);
  }
  pause() {
    clearInterval(this.timer);
    this.timer = 0;
  }
  stop() {
    this.pause();
    const t = this.E.now;
    try {
      this.fader.gain.cancelScheduledValues(t);
      this.fader.gain.setValueAtTime(this.fader.gain.value, t);
      this.fader.gain.linearRampToValueAtTime(0, t + 0.6);
      for (const s of this.sources) s.stop(t + 0.65);
    } catch {}
    setTimeout(() => {
      try {
        this.voice.input.disconnect();
      } catch {}
    }, 800);
  }
}

export { Ambience, BEDS };
