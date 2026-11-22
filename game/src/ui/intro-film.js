// The game's two films: the opening one (the first visit's prologue, a 45-second manga film from
// asset-gen/prologue-video, in place of its first pages) and the ending one (asset-gen/finale-video,
// after the last board is won). A film fills the screen above everything else. There are two cuts on one timeline: 9:16 for a screen taller than wide, 16:9 otherwise; a
// screen that turns mid-film switches cuts and keeps its place. 略過 leaves at any time; at the end
// it offers 重看 and 繼續.
import { art } from './artwork.js';
import { icon } from './icons.js';

const TALL = '(orientation: portrait)';

let layer = null,
  unturn = null;

// tall, wide: { file, poster }, picture names in game/assets, for each cut; label: what the film
// is, for a screen reader; onDone(shown): called once, with true when the player skips or
// continues and false when the file cannot play.
// The film starts with its sound on even though the game's own sound starts off: the music is
// half of it. A button in the corner mutes it.
function playFilm({ tall, wide, onDone, label = '序幕影片' }) {
  closeFilm();
  const doc = globalThis.document;
  layer = doc.createElement('div');
  layer.className = 'intro-film';
  layer.setAttribute('role', 'dialog');
  layer.setAttribute('aria-modal', 'true');
  layer.setAttribute('aria-label', label);
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
  const media = globalThis.matchMedia?.(TALL);
  const cut = () => (media?.matches ? tall : wide);
  let showing = cut();
  video.poster = art(showing.poster);
  video.src = art(showing.file);
  // Turned mid-film: the other cut, from the same moment.
  const turn = () => {
    const next = cut();
    if (!layer || next === showing) return;
    const at = video.currentTime,
      playing = !video.paused && !video.ended;
    showing = next;
    video.poster = art(next.poster);
    video.src = art(next.file);
    video.addEventListener(
      'loadedmetadata',
      () => {
        video.currentTime = at;
        if (playing) video.play()?.catch?.(() => {});
      },
      { once: true }
    );
  };
  media?.addEventListener?.('change', turn);
  unturn = () => media?.removeEventListener?.('change', turn);
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
  unturn?.();
  unturn = null;
  const v = layer?.querySelector('video');
  if (v) {
    v.pause();
    v.removeAttribute('src');
    v.load();
  }
  layer?.remove();
  layer = null;
}

export { playFilm, closeFilm };
