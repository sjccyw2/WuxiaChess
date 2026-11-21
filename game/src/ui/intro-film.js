// The opening film: on a phone held upright, the first visit's prologue is told by a 45-second
// manga film (asset-gen/prologue-video) instead of its first pages. It fills the screen above
// everything else. 略過 leaves at any time; at the end it offers 重看 and 繼續. Landscape phones
// and desktops keep the pages until a 16:9 cut exists.
import { art } from './artwork.js';
import { icon } from './icons.js';

// The same upright-phone test as styles/08-phone-portrait.css, without its narrow-landscape case.
const UPRIGHT = '(orientation: portrait) and (max-width: 800px)';
const filmFits = (win = globalThis) => !!win.matchMedia?.(UPRIGHT).matches;

let layer = null;

// file, poster: picture names in game/assets; onDone(shown):
// called once, with true when the player skips or continues and false when the file cannot play.
// The film starts with its sound on even though the game's own sound starts off: the music is
// half of it. A button in the corner mutes it.
function playFilm({ file, poster, onDone }) {
  closeFilm();
  const doc = globalThis.document;
  layer = doc.createElement('div');
  layer.className = 'intro-film';
  layer.setAttribute('role', 'dialog');
  layer.setAttribute('aria-modal', 'true');
  layer.setAttribute('aria-label', '序幕影片');
  layer.innerHTML =
    '<video playsinline webkit-playsinline preload="auto"></video>' +
    '<button type="button" class="film-skip" data-film="skip">略過</button>' +
    '<button type="button" class="film-sound" data-film="sound" aria-pressed="true"></button>' +
    '<button type="button" class="film-start" data-film="start" hidden>播放</button>' +
    '<div class="film-end" hidden><button type="button" class="film-replay" data-film="replay">重看</button>' +
    '<button type="button" class="film-continue" data-film="continue">繼續</button></div>';
  const video = layer.querySelector('video'),
    end = layer.querySelector('.film-end'),
    skip = layer.querySelector('.film-skip'),
    start = layer.querySelector('.film-start');
  video.poster = art(poster);
  video.src = art(file);
  const sound = layer.querySelector('.film-sound');
  const showSound = () => {
    sound.innerHTML = icon(video.muted ? 'mute' : 'volume', 20);
    sound.setAttribute('aria-label', video.muted ? '開啟聲音' : '關閉聲音');
    sound.setAttribute('aria-pressed', String(!video.muted));
  };
  showSound();
  let done = false;
  const finish = (shown = true) => {
    if (done) return;
    done = true;
    closeFilm();
    onDone?.(shown);
  };
  const run = () => {
    end.hidden = true;
    start.hidden = true;
    skip.hidden = false;
    video.play()?.catch?.(() => {
      // The browser wants a tap of its own before it plays with sound.
      start.hidden = false;
    });
  };
  video.addEventListener('ended', () => {
    end.hidden = false;
    skip.hidden = true;
    layer?.querySelector('.film-continue')?.focus({ preventScroll: true });
  });
  // A file that cannot be played must not keep the player from the game.
  video.addEventListener('error', () => finish(false));
  layer.addEventListener('click', (e) => {
    const what = e.target.closest('[data-film]')?.dataset.film;
    if (what === 'skip' || what === 'continue') finish();
    else if (what === 'replay') {
      video.currentTime = 0;
      run();
    } else if (what === 'start') run();
    else if (what === 'sound') {
      video.muted = !video.muted;
      showSound();
    }
  });
  layer.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      finish();
    }
  });
  doc.body.append(layer);
  skip.focus({ preventScroll: true });
  run();
}

function closeFilm() {
  const v = layer?.querySelector('video');
  if (v) {
    v.pause();
    v.removeAttribute('src');
    v.load();
  }
  layer?.remove();
  layer = null;
}

export { filmFits, playFilm, closeFilm };
