// The first few seconds: decides when the title screen is whole, lifts the loading veil
// that index.html paints over the page (switch: loadingVeil), and then fetches the font
// the first dialog needs while the player is still looking at the title.
//
// index.html loads this before app.js so that it is watching when the board first draws.
import { POLISH } from './polish.js';
import { artArriving } from './actors/sprite-sheets.js';

const root = document.documentElement;
const frame = () => new Promise((done) => requestAnimationFrame(done));
const pause = (ms) => new Promise((done) => setTimeout(done, ms));

// How long the veil stays for a late font or late fighters once the scene itself is up.
const GRACE = 2000;

// The board sizes its two canvases in the same task as its first render, so the first
// change to their size means a frame of scenery has just been drawn.
const sceneDrawn = new Promise((done) => {
  const scene = document.getElementById('scene');
  const watch = new MutationObserver(() => {
    watch.disconnect();
    done();
  });
  watch.observe(scene, { subtree: true, attributes: true, attributeFilter: ['width', 'height'] });
});

// The title is set in RiverSerif. A font that fails is not worth waiting for.
async function titleFont() {
  const title = document.getElementById('game-title');
  const style = getComputedStyle(title);
  const font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  try {
    if (!document.fonts.check(font, title.textContent))
      await document.fonts.load(font, title.textContent);
  } catch {}
}

// Every sheet the board has asked for is in. If any was still on its way when the scene
// drew, the board repaints as it lands: give that frame its turn.
async function fighters() {
  if (!artArriving()) return;
  while (artArriving()) await pause(50);
  await frame();
}

// In the usual case everything is already in when the scene first draws. None of these
// waits then yields to another task, so the veil starts to lift in that very frame.
const whole = sceneDrawn.then(titleFont).then(fighters);

if (root.classList.contains('veil')) {
  if (!POLISH.loadingVeil) root.classList.remove('veil');
  else
    Promise.race([whole, sceneDrawn.then(() => pause(GRACE))]).then(() =>
      root.classList.add('veil-lift')
    );
}

// The dialogs are set in RiverSans, which the title does not use. Without this the first
// one opens in a fallback face and changes a moment later. Asking for the font once the
// title's own files are in keeps it out of their way.
Promise.race([whole, pause(20000)])
  .then(() => document.fonts.load('1em RiverSans', 'A'))
  .catch(() => {});
