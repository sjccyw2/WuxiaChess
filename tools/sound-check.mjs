// Renders every game sound through an OfflineAudioContext in Chromium and checks it.
//
//   node tools/sound-check.mjs [output folder]
//
// Each sound in game/src/audio/sounds.js is played once through the game's own signal chain
// (game/src/audio/engine.js) and measured: peak level, loudness (the loudest 150 ms, weighted
// as in ITU-R BS.1770, in LUFS), length until silence, and the first and last samples. It fails if a sound
// has NaN samples, peaks at or above -1 dBFS, does not start and end at silence, or is far
// louder or quieter than its group. A worst case is stacked as well: a rank 4 technique
// landing with several blows, a defeat and the enemy phase sound on top. Ambience beds are
// rendered for ten seconds each. With an output folder, every render is saved as a WAV there.
//
// It needs Playwright with Chromium and no web server: requests are answered from this checkout.
import { mkdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'http://wuxiachess.sound';
const out = process.argv[2];
if (out) mkdirSync(out, { recursive: true });

// [name, sound kind, details, group]. Groups are compared for loudness among themselves.
const CASES = [
  ['tap', 'tap', {}, 'ui'],
  ['select', 'select', {}, 'ui'],
  ['page', 'page', {}, 'ui'],
  ['buy', 'buy', {}, 'ui'],
  ['equip', 'equip', {}, 'ui'],
  ['seat', 'seat', {}, 'ui'],
  ['wait', 'wait', {}, 'ui'],
  ['deny', 'deny', {}, 'ui'],
  ['move', 'move', {}, 'ui'],
  ['undo', 'undo', {}, 'ui'],
  ['ready', 'ready', {}, 'ui'],
  ['bowl', 'bowl', {}, 'ui'],
  ['chime', 'chime', {}, 'ui'],
  ['heal', 'heal', {}, 'reward'],
  ['grow', 'grow', {}, 'reward'],
  ['level', 'level', {}, 'reward'],
  ['turn', 'turn', {}, 'phase'],
  ['enemy', 'enemy', {}, 'phase'],
  ['win', 'win', {}, 'phase'],
  ['loss', 'loss', {}, 'phase'],
  ['step-stone', 'step', { ground: 'plain' }, 'step'],
  ['step-wood', 'step', { ground: 'bridge', foot: 1 }, 'step'],
  ['step-water', 'step', { ground: 'reeds' }, 'step'],
  ['step-leaves', 'step', { ground: 'bamboo' }, 'step'],
  ['step-grass', 'step', { ground: 'herbs' }, 'step'],
  ['swing', 'swing', {}, 'combat'],
  ['blow-light', 'blow', { ratio: 0.1, rank: 0, lead: true }, 'combat'],
  ['blow-heavy', 'blow', { ratio: 0.4, rank: 0, lead: true }, 'combat'],
  ['blow-kill', 'blow', { ratio: 0.5, rank: 0, lead: true, kill: true }, 'combat'],
  ['blow-counter', 'blow', { ratio: 0.15, rank: 0, counter: true, lead: true }, 'combat'],
  ['blow-art', 'blow', { ratio: 0.2, rank: 2, lead: true }, 'combat'],
  ['block', 'block', {}, 'combat'],
  ['cost', 'cost', {}, 'combat'],
  ['mend', 'mend', {}, 'combat'],
  ['status-good', 'status', { friendly: true }, 'combat'],
  ['status-bad', 'status', { friendly: false }, 'combat'],
  ['fall', 'fall', {}, 'combat'],
  ['fall-ally', 'fall', { ally: true }, 'combat'],
  ['skid', 'skid', {}, 'combat']
];
for (const visual of ['hero', 'guo', 'xiao', 'duan', 'medic', 'guard'])
  for (const rank of [1, 2, 3, 4])
    for (const phase of ['gather', 'impact'])
      CASES.push([
        `art-${visual}-${rank}-${phase}`,
        'technique',
        { visual, rank, phase },
        'art-' + phase
      ]);
for (const flourish of ['blink', 'poison', 'debuff', 'sacrifice', 'rally', 'shield', 'haste'])
  for (const phase of ['gather', 'impact'])
    CASES.push([
      `flourish-${flourish}-${phase}`,
      'technique',
      { visual: 'hero', rank: 2, flourish, phase },
      'art-' + phase
    ]);
CASES.push([
  'foe-guo-3-gather',
  'technique',
  { visual: 'guo', rank: 3, phase: 'gather', foe: true },
  'art-gather'
]);
CASES.push([
  'foe-guo-3-impact',
  'technique',
  { visual: 'guo', rank: 3, phase: 'impact', foe: true },
  'art-impact'
]);

const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript' };
const browser = await chromium.launch();
const page = await browser.newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(String(e.stack || e)));
await page.route(origin + '/**', (route) => {
  const path = decodeURIComponent(new URL(route.request().url()).pathname);
  if (path === '/')
    return route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>sound</title>' });
  const file = normalize(join(root, path));
  if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile())
    return route.fulfill({ status: 404, body: '' });
  route.fulfill({
    contentType: types[extname(file)] || 'application/octet-stream',
    body: readFileSync(file)
  });
});
await page.goto(origin + '/');

// Runs in the page: renders a list of plays and returns measurements and 16-bit samples.
const render = async ({ plays, seconds, ambience }) => {
  const { Engine } = await import('/game/src/audio/engine.js');
  const { SOUNDS } = await import('/game/src/audio/sounds.js');
  const { Ambience } = await import('/game/src/audio/ambience.js');
  const rate = 48000,
    ctx = new OfflineAudioContext(2, Math.ceil(rate * seconds), rate);
  const E = new Engine(ctx);
  if (ambience != null) {
    const bed = new Ambience(E, ambience);
    bed.schedule(0, seconds - 3.5);
    bed.fader.gain.setValueAtTime(0.055, seconds - 3);
    bed.fader.gain.linearRampToValueAtTime(0, seconds - 2.2);
  }
  for (const [kind, details, at] of plays) SOUNDS[kind].run(E, at, details);
  const buffer = await ctx.startRendering();
  const L = buffer.getChannelData(0),
    R = buffer.getChannelData(1),
    n = L.length;
  let peak = 0,
    nan = 0,
    lastLoud = 0;
  for (let i = 0; i < n; i++) {
    const a = Math.max(Math.abs(L[i]), Math.abs(R[i]));
    if (!Number.isFinite(L[i]) || !Number.isFinite(R[i])) nan++;
    else if (a > peak) peak = a;
    if (a > 0.001) lastLoud = i;
  }
  // Loudness as the ear weighs it (the K filter of ITU-R BS.1770 at 48 kHz): the loudest
  // 150 ms window, which suits short clicks and long stingers alike, stepped by 25 ms.
  const weigh = (x) => {
    const y = new Float32Array(n);
    let a1 = 0,
      a2 = 0,
      b1 = 0,
      b2 = 0,
      c1 = 0,
      c2 = 0,
      d1 = 0,
      d2 = 0;
    for (let i = 0; i < n; i++) {
      const v = x[i] || 0;
      const s =
        1.53512485958697 * v -
        2.69169618940638 * a1 +
        1.19839281085285 * a2 +
        1.69065929318241 * b1 -
        0.73248077421585 * b2;
      a2 = a1;
      a1 = v;
      b2 = b1;
      b1 = s;
      const h = s - 2 * c1 + c2 + 1.99004745483398 * d1 - 0.99007225036621 * d2;
      c2 = c1;
      c1 = s;
      d2 = d1;
      d1 = h;
      y[i] = h;
    }
    return y;
  };
  const KL = weigh(L),
    KR = weigh(R);
  const win = Math.floor(rate * 0.15),
    hop = Math.floor(rate * 0.025);
  let loud = 0;
  for (let s = 0; s + win <= n; s += hop) {
    let sum = 0;
    for (let i = s; i < s + win; i++) sum += KL[i] * KL[i] + KR[i] * KR[i];
    loud = Math.max(loud, sum / win);
  }
  const pcm = new Int16Array(n * 2);
  for (let i = 0; i < n; i++) {
    pcm[2 * i] = Math.max(-1, Math.min(1, L[i] || 0)) * 32767;
    pcm[2 * i + 1] = Math.max(-1, Math.min(1, R[i] || 0)) * 32767;
  }
  let text = '';
  const bytes = new Uint8Array(pcm.buffer);
  for (let i = 0; i < bytes.length; i += 0x8000)
    text += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return {
    peak,
    nan,
    loud: -0.691 + 10 * Math.log10(loud + 1e-12),
    length: lastLoud / rate,
    first: Math.max(Math.abs(L[0]), Math.abs(R[0])),
    last: Math.max(Math.abs(L[n - 1]), Math.abs(R[n - 1])),
    pcm: btoa(text),
    rate
  };
};

function wav(base64, rate) {
  const data = Buffer.from(base64, 'base64'),
    head = Buffer.alloc(44);
  head.write('RIFF', 0);
  head.writeUInt32LE(36 + data.length, 4);
  head.write('WAVEfmt ', 8);
  head.writeUInt32LE(16, 16);
  head.writeUInt16LE(1, 20);
  head.writeUInt16LE(2, 22);
  head.writeUInt32LE(rate, 24);
  head.writeUInt32LE(rate * 4, 28);
  head.writeUInt16LE(4, 32);
  head.writeUInt16LE(16, 34);
  head.write('data', 36);
  head.writeUInt32LE(data.length, 40);
  return Buffer.concat([head, data]);
}

const db = (x) => (20 * Math.log10(x + 1e-12)).toFixed(1);
const failures = [];
const results = [];
async function check(name, job, group) {
  const r = await page.evaluate(render, job);
  if (out) writeFileSync(join(out, name + '.wav'), wav(r.pcm, r.rate));
  const line = { name, group, peak: r.peak, loud: r.loud, length: r.length };
  results.push(line);
  console.log(
    name.padEnd(26),
    'peak',
    db(r.peak).padStart(6),
    'dBFS  loud',
    r.loud.toFixed(1).padStart(6),
    'LUFS  length',
    r.length.toFixed(2).padStart(5),
    's'
  );
  if (r.nan) failures.push(name + ': ' + r.nan + ' NaN samples');
  if (r.peak >= 0.89) failures.push(name + ': peak ' + db(r.peak) + ' dBFS');
  if (r.first > 1e-4 || r.last > 1e-4) failures.push(name + ': does not start and end silent');
  if (r.peak < 0.003) failures.push(name + ': silent');
  return r;
}

for (const [name, kind, details, group] of CASES)
  await check(name, { plays: [[kind, details, 0.02]], seconds: 6.5 }, group);

// The worst realistic stack: a rank 4 art gathers and lands with three blows, the last a
// killing one; the defeat follows, and the enemy phase sound starts on top of it all.
const stack = [
  ['technique', { visual: 'guo', rank: 4, phase: 'gather' }, 0.02],
  ['technique', { visual: 'guo', rank: 4, phase: 'impact' }, 0.95],
  ['blow', { ratio: 0.35, rank: 4, lead: true }, 0.95],
  ['blow', { ratio: 0.3, rank: 4, lead: false }, 1.055],
  ['blow', { ratio: 0.4, rank: 4, lead: false, kill: true }, 1.16],
  ['blow', { ratio: 0.2, rank: 3, lead: false }, 1.16],
  ['technique', { visual: 'hero', rank: 4, phase: 'impact' }, 1.0],
  ['fall', {}, 1.6],
  ['fall', { ally: true }, 1.62],
  ['enemy', {}, 1.7],
  ['win', {}, 1.8]
];
const worst = await check('stack-worst', { plays: stack, seconds: 8 }, 'stack');
for (let map = 0; map < 16; map++) // every board's bed (audio/ambience.js)
  await check('ambience-' + map, { plays: [], seconds: 10, ambience: map }, 'ambience');

// Loudness balance: within each group nothing should sit far from the group's median.
const spread = {
  ui: 7,
  step: 5,
  combat: 8,
  reward: 6,
  phase: 6,
  'art-gather': 8,
  'art-impact': 7,
  ambience: 9
};
const groups = {};
for (const r of results) (groups[r.group] ||= []).push(r);
console.log('\ngroup medians (loudest 150 ms, LUFS):');
for (const [group, list] of Object.entries(groups)) {
  const sorted = list.map((r) => r.loud).sort((a, b) => a - b),
    median = sorted[Math.floor(sorted.length / 2)];
  console.log(
    '  ' + group.padEnd(12),
    median.toFixed(1),
    'dB  (' + sorted[0].toFixed(1) + ' to ' + sorted.at(-1).toFixed(1) + ')'
  );
  if (spread[group])
    for (const r of list)
      if (Math.abs(r.loud - median) > spread[group])
        failures.push(
          r.name +
            ': ' +
            r.loud.toFixed(1) +
            ' dB, ' +
            (r.loud - median).toFixed(1) +
            ' dB from its group'
        );
}
console.log('worst stack peak', db(worst.peak), 'dBFS');
await browser.close();
for (const p of problems) failures.push('page error: ' + p);
if (failures.length) {
  console.error('\n' + failures.join('\n'));
  process.exit(1);
}
console.log('\nall sounds pass');
