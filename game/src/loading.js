// The first few seconds: works out when the title screen is whole, then fetches the font
// the first dialog needs while the player is still looking at the title.
//
// index.html loads this before app.js so that it is watching when the board first draws.
import { artArriving } from './actors/sprite-sheets.js';

const frame = () => new Promise((done) => requestAnimationFrame(done));
const pause = (ms) => new Promise((done) => setTimeout(done, ms));

// The board sizes its two canvases in the same task as its first render, so the first
// change to their size means a frame of scenery exists; a frame later it is on screen.
const sceneDrawn = new Promise((done) => {
  const scene = document.getElementById('scene');
  const watch = new MutationObserver(() => {
    watch.disconnect();
    frame().then(done);
  });
  watch.observe(scene, { subtree: true, attributes: true, attributeFilter: ['width', 'height'] });
});

// The title is set in RiverSerif. A failed font is not worth waiting for.
function titleFont() {
  const title = document.getElementById('game-title');
  const style = getComputedStyle(title);
  return document.fonts
    .load(`${style.fontWeight} ${style.fontSize} ${style.fontFamily}`, title.textContent)
    .then(() => document.fonts.ready)
    .catch(() => {});
}

// Every sheet the board has asked for is in, and the board has had a frame to draw them.
async function fightersDrawn() {
  while (artArriving()) await pause(50);
  await frame();
}

const whole = sceneDrawn.then(titleFont).then(fightersDrawn);

// The dialogs are set in RiverSans, which the title does not use. Without this the first
// one opens in a fallback face and changes a moment later. Asking for the font once the
// title's own files are in keeps it out of their way.
Promise.race([whole, pause(20000)])
  .then(() => document.fonts.load('1em RiverSans', 'A'))
  .catch(() => {});
