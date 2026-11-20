// The game's sound. app.js calls these few functions; nothing else touches Web Audio.
//
//   setEnabled(on)       follow the sound preference. Off closes the audio context, so no
//                        node exists or runs while sound is off.
//   play(kind, details)  one sound from sounds.js ('tap', 'turn', 'win', ...)
//   technique(phase, visual, rank, details)   a technique gathering or landing
//   cue(cue)             a timed event from the board (step, swing, blow, fall, ...)
//   scene(map)           the battlefield whose ambience should play, or null for none
//
// The context is only made once the page has had a user gesture (browsers refuse to
// start audio before one), and every call fails silently if audio is unavailable.
import { Engine } from './engine.js';
import { SOUNDS } from './sounds.js';
import { Ambience } from './ambience.js';

// Polyphony budget, in the `cost` units of sounds.js. Small sounds give way first.
const BUDGET = 20;
// The same sound asked for twice within this many seconds plays once.
const REPEAT = 0.03;
const AMBIENCE = true;

let enabled = false,
  ctx = null,
  engine = null,
  ambience = null,
  wanted = null;
const last = new Map();

const gestured = () => globalThis.navigator?.userActivation?.hasBeenActive ?? true;

function ready() {
  if (!enabled || globalThis.document?.hidden) return null;
  try {
    if (!ctx) {
      const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AC || !gestured()) return null;
      ctx = new AC();
      engine = new Engine(ctx);
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return engine;
  } catch {
    ctx = engine = null;
    return null;
  }
}

function setEnabled(on) {
  on = !!on;
  if (on === enabled) return;
  enabled = on;
  if (on) {
    syncAmbience();
    return;
  }
  stopAmbience();
  const old = ctx;
  ctx = engine = null;
  last.clear();
  try {
    old?.close?.().catch?.(() => {});
  } catch {}
}

function play(kind, details = {}) {
  const sound = SOUNDS[kind];
  const E = sound && ready();
  if (!E) return false;
  try {
    const now = E.now;
    const key = kind + (details.phase || '');
    if (kind !== 'step' && kind !== 'blow' && now - (last.get(key) ?? -1) < REPEAT) return false;
    const important = sound.cost >= 3 || kind === 'technique';
    const limit = important ? BUDGET * 1.5 : sound.cost <= 1 ? BUDGET * 0.6 : BUDGET;
    if (!E.claim(sound.cost, now + sound.life, limit)) return false;
    last.set(key, now);
    sound.run(E, now + 0.012, details);
    syncAmbience();
    return true;
  } catch {
    return false;
  }
}

function technique(phase, visual, rank, details = {}) {
  if (phase !== 'gather' && phase !== 'impact') return false;
  return play('technique', { ...details, phase, visual, rank });
}

// Board cues carry their own type; they map one to one onto sounds.
function cue(c) {
  return c && SOUNDS[c.type] ? play(c.type, c) : false;
}

function scene(map) {
  wanted = Number.isInteger(map) ? map : null;
  syncAmbience();
}

function stopAmbience() {
  ambience?.stop();
  ambience = null;
}
function syncAmbience() {
  if (!AMBIENCE) return;
  const index = enabled && !globalThis.document?.hidden ? wanted : null;
  if (ambience && ambience.index === index) return;
  stopAmbience();
  // Never make the context for ambience alone: it waits for the first real sound.
  if (index == null || !ctx || ctx.state === 'closed') return;
  const E = ready();
  if (!E) return;
  try {
    ambience = new Ambience(E, index);
    ambience.index = index;
    ambience.run();
  } catch {
    ambience = null;
  }
}

// A hidden tab is silent: the context is suspended and the ambience let go.
globalThis.document?.addEventListener('visibilitychange', () => {
  if (!ctx) return;
  try {
    if (document.hidden) {
      stopAmbience();
      ctx.suspend?.().catch?.(() => {});
    } else if (enabled) {
      ctx.resume().catch(() => {});
      syncAmbience();
    }
  } catch {}
});

export { setEnabled, play, technique, cue, scene };
