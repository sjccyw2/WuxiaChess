// The first board's tutorial: coach marks on 青竹渡, shown the first time someone plays.
//
// It is not a scripted battle. A small card says what the step in hand is, a gold outline marks
// what to tap, and the step is worked out from the state of the game each frame, so a player who
// ignores the card plays as usual and the card catches up, and a reload resumes where it was.
// Nothing here changes a rule or blocks a tap.
//
//   - It runs once per browser (KEY below), for a player whose record has no board won and no run
//     finished, on the first board of an ordinary run, with the action flow on (not ?classic).
//   - 略過指引 ends it at once; so does the end of the board. The in-battle guide can play it again.
//   - The attack preview and the enemy page are modal dialogs in the browser's top layer, so
//     while one is open the card moves inside it, as the toast and the developer panel do.
//
// Every word it shows is in data/tutorial-text.js. Its styles are styles/18-tutorial.css.
import { POLISH } from '../polish.js';
import * as G from '../rules/game.js';
import { icon } from './icons.js';
import { TUTORIAL_TEXT as TEXT } from '../data/tutorial-text.js';

const KEY = 'jianying.tutorial.v1';
// The steps in the order they are taught. One shows when it is the first not yet seen that the
// state of the game has a use for; the counter is how many have been seen.
// (The danger-zone step goes with its button, which has a switch of its own.)
const ORDER = ['deploy', 'move', 'arts', 'aim', 'preview', 'others', 'turn', 'danger', 'view', 'goal', 'guide'].filter(
  (id) => id !== 'danger' || POLISH.dangerZone
);
// Steps with nothing to do but read: they have a 知道了 button.
const READ = ['arts', 'others', 'danger', 'view', 'goal', 'guide'];

// Every storage access may fail (private windows, blocked storage); then the record lasts only
// as long as the page.
function load() {
  try {
    const kept = JSON.parse(localStorage.getItem(KEY));
    return kept && typeof kept === 'object' ? kept : {};
  } catch {
    return {};
  }
}
function keep(record) {
  try {
    localStorage.setItem(KEY, JSON.stringify(record));
  } catch {}
}

// A record with no board won and no run finished, won or lost: someone new.
const newcomer = (p) => !(p?.returns > 0 || p?.wins > 0 || p?.best > 0 || p?.ended > 0);
// A board being fought (起陣 included) and not yet decided.
const fighting = (s) => !!s?.run && s.run.status === 'battle' && s.run.scene === 'fight' && !s.result;
const runOf = (s) => s.run.seed + ':' + s.run.stage;
// A tile from its key in the board's map of reachable tiles ('x,y').
const tileOf = (k) => {
  const [x, y] = k.split(',').map(Number);
  return { x, y };
};

// `view` answers what app.js holds: { state, screen, mode, page, strike, subject, prefs }, where
// page is the open dialog's name. `close` closes the dialog, `notice` raises the toast, and
// `ended` is called when the tutorial stops for good.
function installTutorial({ dialog, field, scene, board, view, close, notice, ended }) {
  let record = load();
  // 'first' (the first time, remembered) or 'replay' (asked for in the guide), or null.
  let on = null,
    run = '',
    seen = new Set(),
    frame = 0;
  // What the last frames saw, for the steps that end when something changes.
  let last = '',
    base = {},
    previewing = false,
    round = 0,
    walked = new Set(),
    quiet = 0;
  // What is drawn now.
  let drawn = '',
    step = null,
    glowing = [],
    bounds = '';

  const card = document.createElement('aside');
  card.className = 'tut-card';
  card.setAttribute('aria-label', TEXT.label);
  card.innerHTML =
    '<p class="tut-text"><small class="tut-count"></small><span aria-live="polite"></span></p>' +
    '<span class="tut-acts"><small class="tut-count"></small><button type="button" class="tut-ok"></button>' +
    '<button type="button" class="tut-skip">' +
    TEXT.skip +
    '</button></span>';
  // The HUD closes its open list on any press outside it; a press on the card is not one.
  card.addEventListener('pointerdown', (e) => e.stopPropagation());
  card.addEventListener('click', (e) => {
    if (e.target.closest('.tut-skip')) {
      end();
      notice(TEXT.skipped);
    } else if (e.target.closest('.tut-ok') && step) {
      if (step.id === 'guide') end();
      else mark(step.id);
    }
  });
  const NS = 'http://www.w3.org/2000/svg';
  const marks = document.createElementNS(NS, 'svg');
  marks.setAttribute('class', 'tut-marks');
  marks.setAttribute('aria-hidden', 'true');
  // One path per kind of outline; a piece's outline is drawn twice, a soft wide line under a
  // bright narrow one.
  const outlines = { walk: ['tut-walk'], hero: ['tut-halo', 'tut-hero'], foe: ['tut-halo tut-foe', 'tut-foe'] };
  for (const [kind, classes] of Object.entries(outlines))
    outlines[kind] = classes.map((name) => {
      const path = marks.appendChild(document.createElementNS(NS, 'path'));
      path.setAttribute('class', name);
      return path;
    });
  // The guide's control (helpRow below).
  document.addEventListener('click', (e) => {
    if (!e.target.closest?.('[data-tut="replay"]') || !replayable(view())) return;
    close();
    if (on !== 'first') on = 'replay';
    begin(view());
    sync();
  });

  const eligible = (v) =>
    POLISH.actionFlow &&
    !record.done &&
    v.screen === 'battle' &&
    fighting(v.state) &&
    v.state.run.stage === 0 &&
    v.state.mapIndex === 0 &&
    !v.state.run.devTest &&
    !v.state.run.plus &&
    newcomer(v.state.run.chronicle);
  const replayable = (v) => POLISH.actionFlow && v.screen === 'battle' && fighting(v.state);

  // From the top: nothing seen, on this board of this run.
  function begin(v) {
    run = runOf(v.state);
    seen = new Set();
    if (on === 'first') keep((record = { run, seen: [] }));
    last = '';
    previewing = false;
    round = v.state.round;
    walked = new Set();
    quiet = 0;
  }
  function mark(id) {
    if (seen.has(id)) return;
    seen.add(id);
    if (on === 'first') keep((record = { run, seen: [...seen] }));
  }
  function hide() {
    card.remove();
    marks.remove();
    for (const el of glowing) el.classList.remove('tut-glow');
    glowing = [];
    dialog.style.removeProperty('--tut-h');
    drawn = '';
    step = null;
  }
  // Put aside without being finished (the title screen, another run): it can come back.
  function pause() {
    cancelAnimationFrame(frame);
    frame = 0;
    hide();
  }
  // Finished, skipped, or the board is over: never again (a replay leaves the record as it was).
  function end() {
    if (on === 'first') keep((record = { done: true }));
    on = null;
    pause();
    ended?.();
  }

  // Called whenever the game repaints: starts the tutorial when it is due, and stops it when the
  // board it was teaching is over or gone.
  function sync() {
    const v = view();
    if (on && (!v.state.run || runOf(v.state) !== run)) {
      on = null;
      pause();
    }
    if (on && !fighting(v.state)) return end();
    if (!on && eligible(v)) {
      on = 'first';
      run = runOf(v.state);
      if (record.run === run && Array.isArray(record.seen)) {
        // The same board after a reload: on from what was already seen.
        seen = new Set(record.seen.filter((id) => ORDER.includes(id)));
        round = v.state.round;
      } else begin(v);
    }
    if (on && !frame) frame = requestAnimationFrame(tick);
  }
  function tick() {
    frame = 0;
    if (!on) return;
    const v = view();
    if (!v.state.run || runOf(v.state) !== run || !fighting(v.state)) return sync();
    if (v.screen !== 'battle') return hide(); // the next repaint of the board brings it back
    watch(v);
    if (!on) return;
    draw(pick(v), v);
    frame = requestAnimationFrame(tick);
  }

  // What the player has done since the last frame: steps are seen by doing what they teach.
  function watch(v) {
    const s = v.state,
      page = dialog.open ? v.page : null;
    if (!s.run.deploying) mark('deploy');
    const moved = new Set(G.party(s).filter((u) => u.moved).map((u) => u.id));
    if (moved.size) mark('move');
    // 撤步 used: a hero who had walked this round is back where he stood.
    if (s.round === round && s.phase === 'ally')
      for (const id of walked) if (!moved.has(id) && G.canAct(s, G.find(s, id))) mark('arts');
    walked = moved;
    if (page === 'attack-preview') {
      mark('arts');
      mark('aim');
      previewing = true;
    } else if (previewing) {
      previewing = false;
      if (!v.strike) mark('preview'); // confirmed, not taken back
    }
    if (s.phase === 'enemy' || s.round > round) mark('turn');
    round = s.round;
    // A second hero has been given something to do this turn (the game picks the next hero by
    // itself after a strike, so a change of selection alone says nothing).
    if (s.phase === 'ally' && G.party(s).filter((u) => u.moved || u.acted).length > 1) mark('others');
    if (last === 'danger' && !!v.prefs.danger !== base.danger) mark('danger');
    if (
      last === 'view' &&
      (Math.abs(board.zoom - base.zoom) > 0.03 ||
        Math.abs(board.view.yaw - base.yaw) > 0.06 ||
        Math.abs(board.view.pitch - base.pitch) > 0.06)
    )
      mark('view');
    if (last === 'goal' && page === 'goals') mark('goal');
    if (last === 'guide' && page === 'help') end();
  }

  // The step to show now: { id, key, name, read, glow, tiles }, or null for none.
  //   id     the step of ORDER it stands for ('' for a note that is not one)
  //   key    its sentence in TEXT.steps
  //   glow   selectors of the controls to mark; tiles: the board tiles to outline, by kind
  function pick(v) {
    const s = v.state,
      u = G.find(s, s.selected),
      page = dialog.open ? v.page : null,
      nameOf = (unit) => G.unitDetails(unit).name;
    const can = G.canAct(s, u),
      skill = v.mode === 'skill';
    // An art that strikes an enemy is ready, and the pieces it can strike from here.
    const armed =
      can && (v.mode === 'attack' || (skill && G.targetType(G.artFor(u)) === 'enemy'));
    const inReach = armed
      ? s.units.filter((t) => !G.ally(t) && G.living(t) && G.targetOK(s, u, t, skill))
      : [];
    if (page === 'attack-preview') {
      const target = typeof v.strike?.target === 'string' ? G.find(s, v.strike.target) : null;
      return {
        id: 'preview',
        key: target && !G.ally(target) ? 'preview' : 'previewOther',
        glow: ['#modal [data-do="strike"]']
      };
    }
    if (page === 'enemy-info') {
      const foe = G.find(s, v.subject);
      if (s.run.deploying || !foe || foe.side !== 'enemy' || !G.living(foe)) return null;
      if (armed) return { id: '', key: 'profileArmed' };
      return seen.has('preview') ? null : { id: '', key: 'profile' };
    }
    if (page === 'end')
      return seen.has('turn') ? null : { id: 'turn', key: 'turn', glow: ['#modal [data-do="end-confirm"]'] };
    if (page) return null; // any other page: out of the way
    if (s.run.deploying)
      return { id: 'deploy', key: 'deploy', glow: ['[data-do="battle-begin"]'], tiles: { hero: G.party(s) } };
    if (s.phase !== 'ally') return null;
    const others = G.party(s).filter((h) => h !== u && G.canAct(s, h));
    // An art picked before walking, and nothing it can be used on from here (no enemy in reach;
    // for an art cast on a friend, no friend it would do anything for): the list's 走位 row
    // brings the walk back (or, when the list is shut, the chip that opens it).
    const friendly = can && skill && ['ally', 'self'].includes(G.targetType(G.artFor(u)));
    const aimless = armed
      ? !inReach.length
      : friendly && !G.party(s).some((t) => G.living(t) && G.targetOK(s, u, t, true));
    if (aimless && G.canMove(s, u))
      return {
        id: '',
        key: 'stuck',
        glow: ['.field-walk', '#field:has(#arts-panel[hidden]) #arts-toggle']
      };
    const idle = G.party(s).filter((h) => G.canAct(s, h) && !h.moved);
    // The last card waits for the steps that need an enemy in reach, but not for ever.
    const rest = ORDER.slice(0, -1).filter((id) => !seen.has(id));
    if (rest.length && rest.every((id) => ['move', 'arts', 'aim', 'preview', 'others'].includes(id)))
      quiet ||= s.round + 2;
    const steps = {
      move: () =>
        can &&
        !u.moved &&
        v.mode === 'move' && {
          name: nameOf(u),
          tiles: { hero: [u], walk: [...board.reach.keys()].map(tileOf).filter((t) => !G.at(s, t.x, t.y)) }
        },
      // The list, and 撤步 in it; or, when it is shut, the chip that opens it.
      arts: () =>
        can &&
        u.moved && { glow: ['#arts-panel', '.field-undo', '#field:has(#arts-panel[hidden]) #arts-toggle'] },
      aim: () => armed && { key: inReach.length ? 'aim' : 'aimNone', tiles: { foe: inReach } },
      // Until one blow has been confirmed, a ready art is still explained.
      preview: () => armed && { key: inReach.length ? 'aim' : 'aimNone', tiles: { foe: inReach } },
      others: () => others.length > 0 && { tiles: { hero: others } },
      turn: () => ({ glow: idle.length ? [] : ['[data-do="end"]'], tiles: { hero: idle.filter((h) => h !== u) } }),
      danger: () => ({ glow: ['#danger-toggle'] }),
      view: () => ({
        key: matchMedia('(pointer: coarse)').matches ? 'viewTouch' : 'viewMouse',
        glow: ['#view-toggle']
      }),
      goal: () => ({ name: nameOf(G.find(s, G.leader(s))), glow: ['#trip-ledger'] }),
      guide: () => (!rest.length || (quiet && s.round >= quiet)) && { glow: ['#menu-toggle'] }
    };
    for (const id of ORDER) {
      const found = !seen.has(id) && steps[id]?.();
      if (found) return { id, key: id, read: READ.includes(id), ...found };
    }
    return null;
  }

  // The outline of a board tile on the screen, as an SVG path.
  function tilePath(t) {
    const L = board.layers;
    return (
      [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]]
        .map(([dx, dy], i) => {
          const p = L.point(t.x + dx, t.y + dy);
          return (i ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1);
        })
        .join('') + 'Z'
    );
  }
  function draw(next, v) {
    if (!next) {
      if (step) hide();
      return;
    }
    if (next.id && next.id !== last) {
      // What the step's own ending is measured against.
      last = next.id;
      base = {
        danger: !!v.prefs.danger,
        zoom: board.zoom,
        yaw: board.view.yaw,
        pitch: board.view.pitch
      };
    }
    step = next;
    const inDialog = dialog.open,
      host = inDialog ? dialog.querySelector('.modal-shell') : field;
    if (card.parentElement !== host) {
      if (inDialog) host.prepend(card);
      else host.append(card);
    }
    const line = TEXT.steps[next.key].replace('{name}', next.name || '');
    const now = [next.key, next.name, seen.size, next.read].join('|');
    if (now !== drawn) {
      drawn = now;
      card.dataset.step = next.key;
      // (The counter is in the card twice; the stylesheet shows the one the layout has room for.)
      // The word before the number is its own element: the sideways phone has no room for it.
      for (const count of card.querySelectorAll('.tut-count'))
        count.innerHTML = TEXT.count
          .replace(/^(.*?)\{n\}/, '<i>$1</i>{n}')
          .replace('{n}', Math.min(ORDER.length, seen.size + 1))
          .replace('{total}', ORDER.length);
      // {danger} is drawn as the danger-zone button's own icon.
      card.querySelector('.tut-text span').innerHTML = line
        .replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])
        .replace('{danger}', '<i class="tut-icon" role="img" aria-label="' + TEXT.dangerName + '">' + icon('danger', 15) + '</i>');
      const ok = card.querySelector('.tut-ok');
      ok.hidden = !next.read;
      ok.textContent = next.id === 'guide' ? TEXT.finish : TEXT.ok;
    }
    // The controls to mark are redrawn by the game, so they are found again each frame.
    const targets = (next.glow || [])
      .map((selector) => document.querySelector(selector))
      .filter((el) => el && !el.hidden && !el.closest('[hidden]'));
    for (const el of glowing) if (!targets.includes(el)) el.classList.remove('tut-glow');
    for (const el of targets) el.classList.add('tut-glow');
    glowing = targets;
    // The tiles to outline, where the camera has them now.
    const sized = !inDialog && board.layers.width > 1;
    if (sized && marks.parentElement !== scene) scene.append(marks);
    if (!sized) marks.remove();
    for (const [kind, paths] of Object.entries(outlines)) {
      const d = sized ? (next.tiles?.[kind] || []).map(tilePath).join('') : '';
      for (const path of paths) if (path.getAttribute('d') !== d) path.setAttribute('d', d);
    }
    if (inDialog) {
      // The dialog's reading area gives up the card's height, so its buttons stay in view.
      const h = card.offsetHeight + 'px';
      if (dialog.style.getPropertyValue('--tut-h') !== h) dialog.style.setProperty('--tut-h', h);
    } else {
      // Where the HUD leaves room, measured, since its boxes change size with what they say.
      //   sideways phone   between the unit tools and the turn button; where that is too narrow
      //                    to read in (a small phone, once the ready art's chip is in the row),
      //                    above the row instead, on the side away from the arts list
      //   elsewhere        under the map plaque and the tools (used where the card sits below them)
      const f = field.getBoundingClientRect(),
        edge = (selector, side) => field.querySelector(selector)?.getBoundingClientRect()[side];
      const left = edge('.unit-dock', 'right') - f.left + 6,
        right = f.right - edge('#commander', 'left') + 6,
        top = Math.max(edge('.field-heading', 'bottom'), edge('.hud-tools', 'bottom')) - f.top + 6;
      const edges = [left, right, top].map(Math.round).join(',');
      if (edges !== bounds && Number.isFinite(left + right + top)) {
        bounds = edges;
        card.style.setProperty('--tut-left', Math.round(left) + 'px');
        card.style.setProperty('--tut-right', Math.round(right) + 'px');
        card.style.setProperty('--tut-top', Math.round(top) + 'px');
      }
      const arts = field.querySelector('#arts-panel'),
        place = f.width - left - right >= 250 ? '' : !arts.hidden && arts.dataset.side === 'left' ? 'right' : 'left';
      if ((card.dataset.place || '') !== place) {
        if (place) card.dataset.place = place;
        else delete card.dataset.place;
      }
    }
  }

  return {
    sync,
    // True while the tutorial is teaching this board (its card says what the 起陣 tip says).
    running: () => !!on,
    // The guide's control that plays the tutorial again on the board being fought, or ''.
    helpRow: () =>
      replayable(view())
        ? '<p class="tut-replay"><button type="button" class="outline-btn" data-tut="replay">' +
          TEXT.replay +
          '</button></p>'
        : ''
  };
}

export { installTutorial };
