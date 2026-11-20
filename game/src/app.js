// Polish: sets the html.polish-* classes that styles/12 and 13 key off, before first paint.
import './polish.js';
// Polish: the owner-approved control additions (danger zone, Tab to the next hero, forecast dock).
import * as X from './ui/field-extras.js';
// Polish (actionFlow): the redesigned hero turn, with no command bar.
import * as F from './ui/action-flow.js';
import { journalPage } from './ui/wake-views.js';
import { bowlsPage } from './ui/bowl-views.js';
import { coverBowls, pickBowl } from './rules/ferry-market.js';
import { panelDrag } from './ui/panel-drag.js';
import { canPlaceEquipment, equipmentPlacement } from './ui/armory-views.js';
import { moveFacts } from './rules/move-facts.js';
import { teamPage, dossier, encounterPage } from './ui/company-views.js';
import * as G from './rules/game.js';
import * as P from './ui/panels.js';
import { BattleBoard } from './scene/board.js';
import { FieldHud } from './ui/field-hud.js';
import { icon } from './ui/icons.js';
import { codexPage } from './ui/gates.js';
import * as R from './rules/journey.js';
import { rollView, prologuePage, prologueSteps } from './ui/run-views.js';
import { campView, frameDialog } from './ui/mastery-views.js';
import { equippedMoves, journeyEnding } from './ui/journey-pages.js';
import { mapLayout } from './data/terrain.js';
import { showPhase, phaseLead } from './ui/phase-banner.js';

const $ = (id) => document.getElementById(id);
const saveKey = 'jianying.qingzhudu.chapter1.v1',
  prefKey = 'jianying.qingzhudu.preferences.v1';
function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}
const drawKey = 'jianying.tenfold.pending-lots.v1';
const saved = R.restoreRun(read(saveKey, null));
let hasSave = !!saved,
  screen = 'title';
let state = saved || R.startRun(R.drawLots(0));
let draft = null,
  codexId = 'hero';
// The prologue shown before the draw: which page it is on, and the name typed so far.
let prologue = { step: 0, name: '' };
let prefs = Object.assign(
  {
    sound: false,
    grid: false,
    motion: !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  },
  read(prefKey, {})
);
let mode = 'move',
  dialogState = null,
  viewId = state.selected,
  logFilter = 'all',
  storyIndex = 0,
  subjectId = 'chief',
  strikeData = null;
let studyUI = { tab: 'school', node: null, slot: 0 };
let teamUI = { tab: 'line', slot: 0 };
let heroParent = null,
  archiveScene = 'before',
  archiveReturn = null;
const personalPages = ['sheet', 'skills', 'inventory'];

let bowlUntil = 0;
let selectionVersion = 0;
let aiRun = 0,
  soundCtx = null,
  toastTimer = 0,
  terrainTimer = 0,
  transientTip = false;
const dialog = $('modal');
let returnControl = '';
const navItems = [
  ['team', 'people', '隊伍'],
  ['sheet', 'person', '當前俠客'],
  ['goals', 'flag', '目標'],
  ['logs', 'scroll', '紀錄'],
  ['story', 'book', '章回'],
  ['wake', 'scroll', '石刻'],
  ['settings', 'settings', '設定'],
  ['title-help', 'help', '指南']
];
$('nav').innerHTML = navItems
  .map(([action, symbol, label]) =>
    P.btn(action, icon(symbol, 18) + '<span>' + label + '</span>', 'menu-choice')
  )
  .join('');
document.querySelectorAll('[data-icon]').forEach((el) => {
  el.innerHTML = icon(el.dataset.icon);
});
function save() {
  hasSave = true;
  try {
    localStorage.setItem(saveKey, JSON.stringify(state));
    $('save-state').textContent = '進度已自動保存';
  } catch {
    $('save-state').textContent = '本次進度僅保留於此頁';
  }
}
function savePrefs() {
  try {
    localStorage.setItem(prefKey, JSON.stringify(prefs));
  } catch {}
}
function tone(wave, startHz, endHz, offset, duration, volume) {
  const start = soundCtx.currentTime + offset;
  const oscillator = soundCtx.createOscillator(),
    envelope = soundCtx.createGain();
  oscillator.type = wave;
  oscillator.frequency.setValueAtTime(startHz, start);
  oscillator.frequency.exponentialRampToValueAtTime(endHz, start + duration);
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(volume, start + 0.013);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(envelope).connect(soundCtx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.015);
}
// The impact is triggered by the painted hit, independently of the opening melody.
const impactVoices = {
  hero: [
    ['triangle', 1250, 470, 0, 0.31, 0.085],
    ['sine', 1760, 1318, 0.03, 0.55, 0.056]
  ],
  guo: [
    ['sine', 150, 45, 0, 0.5, 0.23],
    ['triangle', 240, 82, 0.055, 0.42, 0.13],
    ['sine', 76, 42, 0.16, 0.48, 0.12]
  ],
  xiao: [
    ['sine', 1175, 988, 0, 0.44, 0.11],
    ['triangle', 1568, 1319, 0.11, 0.44, 0.065]
  ],
  duan: [
    ['triangle', 740, 392, 0, 0.25, 0.09],
    ['sine', 988, 587, 0.045, 0.3, 0.09],
    ['sine', 1480, 988, 0.095, 0.48, 0.065]
  ],
  medic: [
    ['sine', 392, 391, 0, 0.68, 0.09],
    ['sine', 587, 586, 0.05, 0.8, 0.075],
    ['sine', 988, 987, 0.12, 0.75, 0.06]
  ],
  guard: [
    ['triangle', 132, 43, 0, 0.48, 0.19],
    ['sine', 174, 61, 0.09, 0.37, 0.13],
    ['triangle', 86, 44, 0.17, 0.49, 0.09]
  ]
};
function audio(kind = 'tap', impact = false) {
  if (!prefs.sound) return;
  try {
    soundCtx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (soundCtx.state === 'suspended') soundCtx.resume().catch(() => {});
    if (impact) {
      for (const voice of impactVoices[kind]) tone(...voice);
      return;
    }
    const motifs = {
      tap: [392],
      step: [294, 392],
      strike: [196, 147],
      heal: [392, 494, 587],
      hero: [587, 784, 880, 1175],
      guo: [110, 147, 220, 294],
      xiao: [659, 988, 880, 1319],
      duan: [392, 494, 587, 659, 784, 988],
      medic: [330, 392, 494, 587, 494],
      guard: [220, 196, 147, 98],
      turn: [262, 330, 392],
      enemy: [196, 165],
      grow: [392, 494, 587, 784],
      win: [330, 392, 494, 587],
      loss: [294, 247, 196]
    };
    const notes = motifs[kind] || motifs.tap;
    const technique = G.PARTY.includes(kind);
    const pace = kind === 'duan' ? 0.053 : kind === 'medic' ? 0.132 : 0.105;
    const wave = ['strike', 'hero', 'guo', 'guard'].includes(kind) ? 'triangle' : 'sine';
    for (const [i, hz] of notes.entries())
      tone(wave, hz, hz * 0.997, i * pace, 0.42, kind === 'tap' || technique ? 0.075 : 0.13);
  } catch {}
}
function notice(msg) {
  const t = $('toast');
  clearTimeout(toastTimer);
  t.textContent = msg;
  t.classList.add('visible');
  if (dialog.open) {
    dialog.querySelector('.modal-shell').append(t);
  } else if (screen === 'battle') $('field').append(t);
  else document.body.append(t);
  toastTimer = setTimeout(() => t.classList.remove('visible'), 2650);
}
function mapTip(msg, ms = 2200) {
  clearTimeout(terrainTimer);
  transientTip = !!msg;
  const t = $('board-tip');
  t.textContent = msg;
  t.classList.toggle('show', !!msg);
  if (msg)
    terrainTimer = setTimeout(() => {
      transientTip = false;
      t.classList.remove('show');
    }, ms);
}
function refreshSound() {
  const label = prefs.sound ? '關閉音效' : '開啟音效';
  const button = $('title-sound');
  button.innerHTML = icon(prefs.sound ? 'volume' : 'mute', 18);
  button.title = label;
  button.setAttribute('aria-label', label);
  button.setAttribute('aria-pressed', String(prefs.sound));
  document.body.classList.toggle('no-motion', !prefs.motion);
}
const board = new BattleBoard({
  canvas: $('board'),
  tactics: $('tactics'),
  hits: $('board-hits'),
  scene: $('scene'),
  frame: $('board-frame'),
  onCamera: syncZoom,
  onTechnique(id, phase, name, visual, rank) {
    const caption = $('technique-caption');
    if (phase === 'end') {
      if (caption.dataset.artist === id) caption.hidden = true;
      return;
    }
    if (phase === 'gather') {
      caption.dataset.artist = id;
      caption.dataset.tier = rank || 1;
      caption.dataset.side = G.find(state, id)?.side || ''; // combat feel: enemy tint
      caption.querySelector('span').textContent =
        G.unitDetails(G.find(state, id))?.name || G.DETAILS[id].name;
      caption.querySelector('strong').textContent = name || G.DETAILS[id].skill;
      caption.hidden = false;
    }
    audio(visual || id, phase === 'impact');
    if (prefs.sound && phase === 'impact' && rank >= 3 && soundCtx) {
      tone('sine', rank === 4 ? 176 : 264, 110, 0.03, 0.32, 0.07);
      if (rank === 4) tone('sine', 880, 660, 0.16, 0.38, 0.045);
    }
  },
  covered: () => dialog.open,
  onCell: cellClick,
  onUnit: unitClick,
  onHover(x, y) {
    if (screen !== 'battle') return;
    const t = $('board-tip');
    if (x != null && ['skill', 'attack'].includes(mode)) {
      const u = selected(),
        target = G.at(state, x, y),
        skill = mode === 'skill';
      if (target && G.targetOK(state, u, target, skill)) {
        const facts = moveFacts(state, u, skill ? u.activeArt || 'signature' : 'basic', target);
        const guard = !G.ally(target) && G.coverer(state, target); // 代受: the figure is the coverer's
        t.textContent =
          uName(target) +
          (guard ? '（' + uName(guard) + '代受）' : '') +
          ' · ' +
          facts.powerLabel +
          ' ' +
          facts.powerText;
        t.classList.add('show');
        return;
      }
    }
    if (transientTip) return;
    if (x == null) {
      t.classList.remove('show');
      return;
    }
    const place = G.terrainInfo(x, y, state.mapIndex),
      steps = board.reach?.get(G.key(x, y));
    const goal = G.unclaimedObjectiveTile(state);
    if (!place) {
      t.classList.remove('show');
      return;
    }
    let info = '';
    if (goal && goal.x === x && goal.y === y) info = '支線燈記';
    else if (mode === 'move' && steps) info = steps + ' 步';
    else if (place.defense) info = '防禦 ＋' + place.defense;
    t.textContent = place.name + (info ? ' · ' + info : '');
    t.classList.add('show');
  }
});
const hud = new FieldHud(document, () => board.resize(), notice);
function selected() {
  return G.find(state, state.selected);
}
function paint() {
  if (screen === 'title') {
    board.prefs = prefs;
    board.layers.prefs = prefs;
    board.draw();
    refreshSound();
    return;
  }
  const prior = !dialog.open && document.activeElement;
  const priorGroup = prior?.closest?.('#commander, #field-arts');
  const grid = $('grid-toggle');
  grid.setAttribute('aria-pressed', String(Boolean(prefs.grid)));
  grid.title = grid.ariaLabel = prefs.grid ? '隱藏棋格' : '顯示棋格';
  grid.setAttribute('aria-label', grid.title);
  X.syncDangerButton($('danger-toggle'), prefs.danger);
  const path = mapLayout(state.mapIndex);
  $('medicine-button').disabled = !G.canUseMedicine(state, selected());
  $('chapter-number').textContent = '第' + R.NUMERALS[state.run.stage] + '局';
  $('map-name').textContent = path.name;
  $('trip-ledger').setAttribute(
    'aria-label',
    path.name + '，第' + state.round + '回合，查看戰役目標'
  );
  $('scene').setAttribute('aria-label', path.name + '，可旋轉的立體戰棋地圖');
  const side = state.result ? '戰役結束' : state.phase === 'enemy' ? '敵方行動' : '我方行動';
  const phase = `<small>第 <b>${state.round}</b> 回合</small><strong class="${state.phase === 'enemy' ? 'enemy' : ''}">${side}</strong>`;
  if ($('round-badge').dataset.phase !== phase) {
    $('round-badge').innerHTML = phase;
    $('round-badge').dataset.phase = phase;
  }
  const u = selected();
  $('active-hero').innerHTML = P.activeHero(state);
  $('active-hero').setAttribute(
    'aria-label',
    uName(u) +
      '，等級 ' +
      u.level +
      '，氣血 ' +
      u.hp +
      '／' +
      u.maxHp +
      '，內力 ' +
      u.mp +
      '／' +
      u.maxMp +
      '。查看俠客資料'
  );
  $('commander').innerHTML = P.commander(state, mode);
  $('field-arts').innerHTML = equippedMoves(state, u) + F.undoRow(state, u);
  F.markReady($('field-arts'), state, u, mode);
  if (hud.panel === 'arts' && !G.canAct(state, u)) hud.closePanel();
  hud.syncPanelButtons();
  if (priorGroup && !priorGroup.closest('[hidden]')) {
    const next = [...priorGroup.querySelectorAll('[data-do]')].find(
      (b) => b.dataset.do === prior.dataset.do && b.dataset.id === prior.dataset.id && !b.disabled
    );
    next?.focus({ preventScroll: true });
  }
  board.sync(state, mode, prefs);
  refreshSound();
  syncZoom();
}
function syncZoom() {
  let z = board.zoom;
  $('zoom-value').textContent = Math.round(z * 100) + '%';
  $('zoom-out').disabled = z <= 0.781;
  $('zoom-in').disabled = z >= 2.399;
  const high = board.view.pitch >= 1.12;
  $('camera').innerHTML = icon('cube', 16) + '<span>' + (high ? '斜視' : '俯視') + '</span>';
  $('camera').setAttribute('aria-pressed', String(high));
  const compass = document.querySelector('.compass');
  compass?.style.setProperty('--bearing', -board.view.yaw + 'rad');
}
function update() {
  save();
  paint();
}
function choose(id, quiet = false) {
  const u = G.find(state, id);
  if (!u || !G.ally(u)) return;
  selectionVersion++;
  state.selected = id;
  viewId = id;
  // A hero held by 立樁 is treated as one who has already moved: straight to his arts.
  const placed = u.moved || !!u.conditions?.rooted;
  mode = placed && !u.acted ? 'attack' : 'move';
  update();
  if (!quiet) audio('tap');
  if (F.ON && placed && G.canAct(state, u)) openArts();
}
// Polish (actionFlow): the arts list, opened without a button and kept beside the hero.
function openArts(keyboard = false) {
  if (!F.ON || screen !== 'battle' || dialog.open || !G.canAct(state, selected())) return;
  if (hud.panel !== 'arts') hud.togglePanel('arts', keyboard);
  F.followHero($('arts-panel'), board.layers, () =>
    hud.panel === 'arts' && screen === 'battle' ? { hero: selected(), state } : null
  );
}
function cellClick(x, y) {
  if (screen !== 'battle' || dialog.open || state.run.scene !== 'fight') return;
  const occ = G.at(state, x, y);
  if (occ) {
    unitClick(occ.id);
    return;
  }
  if (state.result || state.phase !== 'ally') return;
  if (!G.walkable(x, y, state.mapIndex)) {
    const place = G.terrainInfo(x, y, state.mapIndex);
    if (place) mapTip(place.name + ' · ' + place.note);
    return;
  }
  const u = selected();
  if (!G.canAct(state, u)) {
    mapTip('請選擇一位尚可行動的俠客');
    return;
  }
  if (mode === 'skill' && G.artFor(u).blink) {
    if (G.targetOK(state, u, { x, y }, true)) {
      strikeData = { source: u.id, target: { x, y }, skill: true };
      openPage('attack-preview');
    } else mapTip('請選擇範圍內的空地');
    return;
  }
  if (mode === 'move') {
    if (G.move(state, u, x, y)) {
      mode = 'attack';
      audio('step');
      update();
      mapTip('已移動');
      if (F.ON) {
        const version = selectionVersion;
        board.finished().then(() => {
          if (version === selectionVersion && state.selected === u.id && u.moved) openArts();
        });
      }
    } else
      mapTip(
        u.conditions?.rooted
          ? '立樁 · 本回合不能移動'
          : u.moved
            ? '本回合已移動，可在出招前撤步'
            : G.terrain(x, y, state.mapIndex) + ' · 本回合無法抵達。'
      );
  } else mapTip(mode === 'skill' ? targetHint(G.artFor(u)) : '請選擇範圍內的敵方棋子');
}
function unitClick(id) {
  if (screen !== 'battle' || dialog.open || state.run.scene !== 'fight') return;
  const u = selected(),
    t = G.find(state, id),
    skill = mode === 'skill';
  if ((mode === 'attack' || skill) && G.targetOK(state, u, t, skill)) {
    strikeData = { source: u.id, target: id, skill };
    openPage('attack-preview');
    return;
  }
  if (F.ON && t === u && G.canAct(state, u)) {
    openArts(document.activeElement?.matches?.('.key-cell:focus-visible'));
    return;
  }
  if (G.ally(t)) {
    if (skill && (G.isSupport(G.artFor(u)) || G.artFor(u).blink) && G.canAct(state, u)) {
      mapTip(targetHint(G.artFor(u)));
      return;
    }
    choose(id);
    return;
  }
  if (skill && (G.isSupport(G.artFor(u)) || G.artFor(u).blink)) {
    mapTip(targetHint(G.artFor(u)));
    return;
  }
  if (G.canAct(state, u) && ['attack', 'skill'].includes(mode)) {
    if (!skill || !G.artFor(u).heal) {
      notice('目標在招式範圍外，可先移動或查探敵情。');
    }
  }
  subjectId = id;
  openPage('enemy-info');
}
function targetHint(art) {
  return {
    ground: '點選射程內的空地，可越過阻礙',
    self: '選擇施術者自身',
    ally:
      art.heal && !(art.shield || art.rally || art.haste)
        ? '選擇範圍內負傷的友軍'
        : '選擇範圍內的友軍',
    enemy: '選擇範圍內的敵人'
  }[G.targetType(art)];
}
function pageHtml() {
  switch (dialogState) {
    case 'wake':
      return journalPage(state);
    case 'prologue':
      return prologuePage(state.run.chronicle, prologue.step, prologue.name);
    case 'formation':
      return rollView(
        draft.ids,
        { ...state.run.chronicle, parcelCount: R.parcelCount(state.run.chronicle) },
        hasSave,
        draft.leaderId
      );
    case 'encounter':
      return encounterPage(state, state.run.scene, state.run.beat);
    case 'team':
      return teamPage(state, G.find(state, viewId), teamUI);
    case 'bowls':
      return bowlsPage(state, Date.now() < bowlUntil);
    case 'camp':
      return campView(R.campModel(state));
    case 'codex':
      return codexPage(codexId);
    case 'sheet':
    case 'skills':
    case 'inventory':
      return dossier(state, G.find(state, viewId), dialogState, studyUI, heroParent);
    case 'story':
      return encounterPage(state, archiveScene, storyIndex, true);
    case 'logs':
      return P.logPage(state, logFilter);
    case 'goals':
      return P.goalsPage(state);
    case 'help':
      return P.helpPage();
    case 'terrain':
      return P.terrainPage(state);
    case 'settings':
      return P.settingsPage(prefs, screen === 'battle');
    case 'end':
      return P.endPage(state);
    case 'result':
      return journeyEnding(state);
    case 'enemy-info':
      return P.enemyPage(state, subjectId);
    case 'attack-preview':
      return P.attackPage(state, strikeData.source, strikeData.target, strikeData.skill);
    default:
      return '';
  }
}
function drawModal(keepScroll = false) {
  cancelPanelDrag?.();
  const top = dialog.querySelector('.mj-scroll')?.scrollTop || 0;
  const keepPlan = keepScroll && dialog.querySelector('.fo-map-plan')?.hasAttribute('open');
  const active = dialog.contains(document.activeElement) ? document.activeElement.dataset : null;
  $('modal-content').innerHTML = pageHtml();
  const body = frameDialog($('modal-content'));
  if (keepPlan) dialog.querySelector('.fo-map-plan')?.setAttribute('open', '');
  if (active?.do) {
    const equivalent = [...dialog.querySelectorAll('[data-do]')].find(
      (b) =>
        b.dataset.do === active.do &&
        b.dataset.id === active.id &&
        b.dataset.slot === active.slot &&
        b.dataset.unit === active.unit &&
        b.dataset.owner === active.owner &&
        b.dataset.dest === active.dest &&
        b.dataset.delta === active.delta
    );
    const next =
      equivalent && !equivalent.disabled
        ? equivalent
        : dialog.querySelector(
            '[data-do="scene-next"],.fy-tabs [aria-selected="true"],[data-do="close"]'
          );
    next?.focus({ preventScroll: true });
  }
  const close = dialog.querySelector('.modal-head [data-do="close"]');
  if (close) {
    const label =
      personalPages.includes(dialogState) && heroParent === 'team'
        ? state.run.scene === 'prep'
          ? '返回整備'
          : '返回隊伍'
        : dialogState === 'team' && state.run.scene === 'shop'
          ? '返回通吃坊'
          : (dialogState === 'team' && state.run.scene === 'prep') ||
              dialogState === 'camp' ||
              dialogState === 'result'
            ? '返回主畫面'
            : '關閉視窗';
    close.title = label;
    close.setAttribute('aria-label', label);
  }
  const heading = dialog.querySelector('h2');
  if (heading) {
    heading.id = 'open-title';
    dialog.setAttribute('aria-labelledby', 'open-title');
  }
  if (body) body.scrollTop = keepScroll ? top : 0;
  dialog.scrollTop = 0;
  // Polish (uiChrome): mark a redraw that shows another page, tab or line of dialogue, so the
  // stylesheet eases only those in and leaves in-place refreshes still.
  if (document.documentElement.classList.contains('polish-ui-chrome')) {
    const shown = [dialogState, ...dialog.querySelectorAll('[role="tab"][aria-selected="true"], .fy-reading')]
      .map((part) => part.textContent ?? part)
      .join('|');
    dialog.classList.toggle('ui-turn', !dialog.open || shown !== dialog.dataset.shown);
    dialog.dataset.shown = shown;
  }
  X.dockForecast(dialog, board?.layers, state, strikeData, dialogState);
}
function openPage(name, heroId) {
  if (!dialog.open) {
    returnControl = hud.panel ? hud.button(hud.panel)?.id : document.activeElement?.id;
    hud.closePanel();
  }
  if (name === 'team' && dialogState !== 'team' && !personalPages.includes(dialogState)) {
    viewId = state.selected;
    teamUI = { tab: 'line', slot: 0 };
  }
  if (personalPages.includes(name)) {
    if (dialogState === 'team') heroParent = 'team';
    else if (!personalPages.includes(dialogState)) {
      heroParent = null;
      viewId = state.selected;
    }
    if (name === 'skills' && dialogState !== 'skills')
      studyUI = { tab: 'school', node: null, slot: 0 };
  }
  if (heroId && G.company(state).some((u) => u.id === heroId)) viewId = heroId;
  dialogState = name;
  drawModal();
  if (!dialog.open) {
    dialog.showModal();
    (
      dialog.querySelector('[data-do="scene-next"]') ||
      dialog.querySelector('.mj-tabs [aria-selected="true"]') ||
      dialog.querySelector('[data-do="close"]') ||
      dialog.querySelector('button')
    )?.focus({ preventScroll: true });
  }
}
function closePage() {
  if (dialog.open) dialog.close();
  else dialogState = null;
}
function dismissLayer() {
  if (dialogState === 'bowls') {
    openPage('camp');
    return;
  }
  if (personalPages.includes(dialogState) && heroParent === 'team') {
    openPage('team', viewId);
    return;
  }
  if (dialogState === 'story' && archiveReturn === 'camp') {
    openPage('camp');
    return;
  }
  if (dialogState === 'team' && state.run.scene === 'shop') {
    openPage('camp');
    return;
  }
  if (
    ['team', 'encounter', 'camp', 'result'].includes(dialogState) &&
    state.run.scene !== 'fight'
  ) {
    openTitle();
    return;
  }
  closePage();
}
function showScene() {
  const page = {
    before: 'encounter',
    prep: 'team',
    after: 'encounter',
    shop: 'camp',
    ended: 'result'
  }[state.run.scene];
  if (page) openPage(page);
  return !!page;
}
dialog.addEventListener('cancel', (e) => {
  e.preventDefault();
  dismissLayer();
});
dialog.addEventListener('close', () => {
  if (dialog.open) return;
  dialogState = null;
  board.uncover();
  (screen === 'battle' ? $('field') : document.body).append($('toast'));
  const opener = returnControl && $(returnControl);
  if (opener && !opener.disabled && !opener.closest('[hidden]'))
    opener.focus({ preventScroll: true });
  returnControl = '';
});
dialog.addEventListener('click', (e) => {
  if (e.target === dialog) {
    const r = dialog.getBoundingClientRect();
    if (e.clientX < r.left || e.clientY < r.top || e.clientX > r.right || e.clientY > r.bottom)
      dismissLayer();
  }
});
function result(afterMotion = false) {
  if (!state.result) return false;
  const outcome = state,
    token = aiRun;
  const reveal = () => {
    if (screen !== 'battle' || state !== outcome || token !== aiRun) return;
    if (R.settle(state)) {
      update();
      audio(state.result === 'win' ? 'win' : 'loss');
    }
    showScene();
  };
  if (afterMotion) board.finished().then(reveal);
  else reveal();
  return true;
}
function autoSelect() {
  if (state.result || state.phase !== 'ally') return;
  const n = F.ON ? F.nextToAct(state) : G.party(state).find((u) => G.canAct(state, u));
  if (n) {
    state.selected = n.id;
    mode = n.moved ? 'attack' : 'move';
  } else mode = '';
}
function finishAlly() {
  autoSelect();
  update();
  if (!result() && !(F.ON ? F.anyIdle(state) : G.party(state).some((u) => G.canAct(state, u))))
    mapTip('我方已全數行動，可結束回合', 3200);
}
function advanceAfterStrike(id) {
  if (state.result) {
    result(true);
    return;
  }
  const run = aiRun,
    selection = selectionVersion;
  board.finished().then(() => {
    if (
      screen === 'battle' &&
      state.phase === 'ally' &&
      aiRun === run &&
      selection === selectionVersion &&
      state.selected === id
    )
      finishAlly();
  });
}
function doCommand(action, selectedArt = false, keyboard = false) {
  const u = selected();
  if (!G.canAct(state, u)) return;
  if (action === 'skill' && !selectedArt) {
    hud.togglePanel('arts', keyboard);
    return;
  }
  // Polish (actionFlow): picking an art leaves the list open, so another can be picked instead.
  if (!(F.ON && hud.panel === 'arts' && ['attack', 'skill'].includes(action))) hud.closePanel();
  if (action === 'move' && u.moved) {
    if (G.undo(state, u)) {
      mode = 'move';
      audio('step');
      update();
      mapTip('移動已撤回');
    } else notice('退路受阻，暫時無法撤步。');
    return;
  }
  if (action === 'wait') {
    G.waitUnit(state, u);
    audio('tap');
    finishAlly();
    return;
  }
  if (action === 'skill' && !G.canPay(state, u)) {
    notice(G.artReady(state, u).reason || '施展此招的氣血或內力不足。');
    return;
  }
  mode = action;
  paint();
  audio('tap');
  mapTip(
    action === 'move'
      ? '點選青綠色地格移動'
      : action === 'attack'
        ? G.basicFor(u).name + ' · 未扣防威力 ' + moveFacts(state, u).powerText + ' · 選擇敵人'
        : G.artFor(u).name +
          ' · ' +
          moveFacts(state, u, u.activeArt || 'signature').powerText +
          ' · ' +
          targetHint(G.artFor(u))
  );
}
function useItem(id) {
  const u = G.find(state, viewId),
    item = G.ITEMS[id];
  if (!item) return;
  const used = item.kind === 'use',
    ok = used ? G.consume(state, u, id) : G.equip(state, u, id);
  if (!ok) {
    notice('此刻無法使用這件物品。');
    return;
  }
  audio(used ? 'heal' : 'tap');
  update();
  drawModal(true);
  notice(
    used
      ? uName(u) + '已服用' + item.name + '。'
      : uName(u) + (u.weapon === id || u.gear === id ? '裝備了' : '卸下了') + item.name + '。'
  );
}
const uName = (u) => G.unitDetails(u).name;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function runEnemy() {
  const token = ++aiRun;
  await board.finished();
  await sleep(prefs.motion ? 240 : 60);
  await phaseLead(); // combat feel: let the phase banner land before the first enemy moves
  while (token === aiRun && screen === 'battle' && state.phase === 'enemy' && !state.result) {
    const e = G.enemies(state).find((u) => G.living(u) && !u.acted);
    if (!e) {
      G.nextRound(state);
      mode = 'move';
      update();
      board.watch(false); // combat feel: hand the camera back
      if (!result()) {
        audio('turn');
        mapTip('第 ' + state.round + ' 回合 · 我方行動');
        showPhase('ally', state.round, prefs.motion);
      }
      return;
    }
    const effects = G.enemyAct(state, e);
    audio(effects.length ? 'strike' : 'step');
    update();
    board.follow(e, effects[0] && G.find(state, effects[0][0])); // combat feel: camera
    if (effects[0])
      board.strikeEffect(
        e,
        G.find(state, effects[0][0]),
        e.signatureRound === state.round ? 'villain-skill' : 'enemy-hit'
      );
    board.showEffects(effects);
    if (result(true)) return;
    await board.finished();
    await sleep(prefs.motion ? 150 : 45);
  }
}
function beginEnemy() {
  F.braceTheRest(state); // Polish (actionFlow): what the wait button did, for whoever is left
  if (!G.startEnemy(state)) return;
  closePage();
  mode = '';
  audio('enemy');
  update();
  showPhase('enemy', state.round, prefs.motion); // combat feel: phase banner
  board.watch(true); // combat feel: the camera may follow enemy actions
  mapTip('守關敵軍開始行動');
  runEnemy();
}
function askEnd() {
  if (state.run.scene !== 'fight') {
    showScene();
    return;
  }
  if (state.result) {
    result(true);
    return;
  }
  if (state.phase !== 'ally') return;
  if (F.ON ? F.shouldConfirmEnd(state) : G.party(state).some((u) => G.canAct(state, u)))
    openPage('end');
  else beginEnemy();
}
function openFormation() {
  const source = hasSave ? state.run.seed : 'first';
  const pending = read(drawKey, null);
  if (!draft || draft.source !== source) {
    const seed =
      pending?.source === source && Number.isInteger(pending.seed) ? pending.seed : R.newSeed();
    draft = { ...R.drawLots(seed), source };
    draft.leaderId =
      pending?.source === source && pending.seed === seed && draft.ids.includes(pending.leaderId)
        ? pending.leaderId
        : draft.ids[0];
    try {
      localStorage.setItem(drawKey, JSON.stringify({ source, seed, leaderId: draft.leaderId }));
    } catch {}
  }
  openPage('formation');
}
// A new run starts with the youth opening his eyes, then the draw.
function openPrologue() {
  prologue = { step: 0, name: prologue.name };
  openPage('prologue');
}
// Keeps what was typed when the page is redrawn or left.
function keepName() {
  const field = $('youth-name');
  if (field) prologue.name = R.cleanName(field.value);
}
function openTitle() {
  ++aiRun;
  closePage();
  mapTip(null);
  screen = 'title';
  hud.closePanel();
  document.body.classList.remove('in-battle');
  document.body.append(dialog);
  $('start-screen').hidden = false;
  $('main').hidden = true;
  $('start-world').prepend($('scene'));
  board.present(true);
  $('scene').setAttribute('aria-label', '可拖曳旋轉的立體場景');
  $('start-primary').querySelector('strong').textContent = hasSave
    ? state.run.scene === 'after'
      ? '繼續戰後劇情'
      : state.run.scene === 'prep'
        ? '繼續整備'
        : state.run.status === 'camp'
          ? '返回通吃坊'
          : state.run.status === 'ended'
            ? '查看本局結局'
            : '繼續第' + R.NUMERALS[state.run.stage] + '局'
    : '睜眼';
  $('title-new').hidden = !hasSave;
  window.scrollTo({ top: 0, behavior: 'instant' });
  paint();
  syncZoom();
}
function enterBattle(fresh) {
  closePage();
  screen = 'battle';
  hud.closePanel();
  document.body.classList.add('in-battle');
  $('field').append(dialog);
  $('start-screen').hidden = true;
  $('main').hidden = false;
  $('field').prepend($('scene'));
  board.present(false);
  if (state.run.scene === 'fight' && state.phase === 'ally' && !G.canAct(state, selected()))
    autoSelect();
  viewId = state.selected;
  mode = state.phase === 'ally' ? (selected().moved && !selected().acted ? 'attack' : 'move') : '';
  window.scrollTo({ top: 0, behavior: 'instant' });
  update();
  if (fresh) {
    storyIndex = 0;
    audio('turn');
  }
  if (state.result && state.run.status === 'battle') result();
  else if (!showScene() && state.phase === 'enemy') runEnemy();
}
function toggleSound() {
  prefs.sound = !prefs.sound;
  savePrefs();
  refreshSound();
  audio('turn');
  notice(prefs.sound ? '遊戲音效已開啟' : '遊戲音效已關閉');
}
function armState() {
  return dialogState === 'team' ? teamUI : studyUI;
}
function gearDestination(source, destination) {
  const id = destination.startsWith('hero-') ? destination.slice(5) : viewId;
  const slot =
    destination === 'auto' || destination.startsWith('hero-')
      ? G.ITEMS[source.id]?.kind
      : destination;
  return { hero: G.company(state).find((u) => u.id === id), slot };
}
function allowedDrop(source, destination) {
  if (source.kind === 'hero')
    return (
      dialogState === 'team' &&
      teamUI.tab === 'line' &&
      R.canPlaceHero(state, source.id, Number(destination))
    );
  if (!(dialogState === 'inventory' || (dialogState === 'team' && teamUI.tab === 'stores')))
    return false;
  const { hero, slot } = gearDestination(source, destination);
  return canPlaceEquipment(state, hero, source.id, source.owner, slot);
}
function panelPlacement(source, destination) {
  if (!allowedDrop(source, destination)) return false;
  if (source.kind === 'hero') {
    if (!R.placeHero(state, source.id, Number(destination))) return false;
    viewId = source.id;
    teamUI.pickedHero = null;
  } else {
    const { hero, slot } = gearDestination(source, destination);
    if (!equipmentPlacement(state, hero, source.id, source.owner, slot)) return false;
    viewId = hero.id;
    Object.assign(armState(), { item: source.id, owner: slot === 'stock' ? 'stock' : hero.id });
  }
  audio('tap');
  update();
  drawModal(true);
  return true;
}
const cancelPanelDrag = panelDrag(dialog, panelPlacement, allowedDrop);
function command(action, id, data = {}, keyboard = false) {
  if (['move', 'attack', 'skill', 'wait'].includes(action)) {
    doCommand(action, false, keyboard);
    return;
  }
  switch (action) {
    case 'formation-pick':
      if (
        dialogState === 'team' &&
        teamUI.tab === 'line' &&
        G.company(state).some((v) => v.id === id)
      ) {
        viewId = id;
        teamUI.pickedHero = teamUI.pickedHero === id ? null : id;
        drawModal(true);
      }
      break;
    case 'place-post': {
      if (dialogState !== 'team' || teamUI.tab !== 'line') break;
      if (!teamUI.pickedHero) {
        notice('先選一張俠客牌。');
        break;
      }
      if (!panelPlacement({ kind: 'hero', id: teamUI.pickedHero }, id)) notice('此陣位無法放置。');
      break;
    }
    case 'arm-filter':
      if (['all', 'weapon', 'gear', 'use'].includes(id)) {
        Object.assign(armState(), { filter: id, item: null, owner: null });
        drawModal(true);
      }
      break;
    case 'arm-pick':
      Object.assign(armState(), { item: id, owner: data.owner });
      drawModal(true);
      break;
    case 'arm-slot':
    case 'arm-stock': {
      const ui = armState(),
        dest = action === 'arm-stock' ? 'stock' : id;
      if (ui.item && panelPlacement({ kind: 'equipment', id: ui.item, owner: ui.owner }, dest))
        break;
      const u = G.find(state, viewId);
      if (action === 'arm-slot' && ['weapon', 'gear'].includes(id)) {
        const current = u[id];
        Object.assign(ui, { filter: id, item: current || null, owner: current ? u.id : null });
        drawModal(true);
      } else notice('選擇已穿戴的兵器或護具，可收回公庫。');
      break;
    }
    case 'arm-place':
      panelPlacement({ kind: 'equipment', id, owner: data.owner }, data.dest);
      break;
    case 'field-medicine':
      openPage('inventory', state.selected);
      Object.assign(studyUI, { filter: 'use', item: null, owner: null });
      drawModal();
      break;
    case 'hud-panel':
      hud.togglePanel(id, keyboard);
      break;
    // Polish (actionFlow): the chip that names the ready art opens and closes the arts list.
    case 'arts-open':
      if (hud.panel === 'arts') hud.closePanel(true);
      else openArts(keyboard);
      break;
    case 'hud-close':
      hud.closePanel(true);
      break;
    case 'field-grid':
      prefs.grid = !prefs.grid;
      savePrefs();
      paint();
      break;
    // Polish (dangerZone): show or hide the tiles the enemy can strike next turn.
    case 'field-danger':
      prefs.danger = !prefs.danger;
      savePrefs();
      paint();
      audio('tap');
      break;
    case 'fullscreen':
      hud.fullscreen();
      break;
    case 'wake':
      openPage('wake');
      break;
    case 'choose-fate':
      if (dialogState === 'result' && R.chooseFate(state, id)) {
        save();
        drawModal();
        audio('turn');
      }
      break;
    case 'field-loadout':
      openPage('skills', state.selected);
      studyUI.tab = 'loadout';
      drawModal();
      break;
    case 'logs':
      logFilter = 'all';
      openPage('logs');
      break;
    case 'story':
      archiveReturn = dialogState;
      archiveScene = id === 'after' && state.result ? 'after' : 'before';
      storyIndex = 0;
      openPage('story');
      break;
    case 'home':
      openTitle();
      break;
    case 'start-primary':
      if (hasSave) enterBattle(false);
      else openPrologue();
      break;
    case 'title-new':
      openPrologue();
      break;
    case 'prologue-prev':
    case 'prologue-next':
    case 'prologue-skip': {
      if (dialogState !== 'prologue') break;
      keepName();
      const steps = prologueSteps(state.run.chronicle, prologue.name),
        ask = steps.findIndex((step) => step.ask);
      if (action === 'prologue-prev') prologue.step = Math.max(0, prologue.step - 1);
      // Skipping still stops at the name the first time, since it has to be given once.
      else if (action === 'prologue-skip' && ask > prologue.step) prologue.step = ask;
      else if (action === 'prologue-skip' || prologue.step >= steps.length - 1) {
        openFormation();
        break;
      } else prologue.step++;
      drawModal();
      $('youth-name')?.focus({ preventScroll: true });
      audio('tap');
      break;
    }
    case 'title-help':
      openPage('help');
      break;
    case 'settings':
      openPage('settings');
      break;
    case 'codex':
      openPage('codex');
      break;
    case 'codex-pick':
      if (G.PARTY.includes(id)) {
        codexId = id;
        drawModal(true);
        audio('tap');
      }
      break;
    case 'sound-toggle':
      toggleSound();
      break;
    case 'orbit-left':
      board.rotate(-1);
      break;
    case 'orbit-right':
      board.rotate(1);
      break;
    case 'lead-lot':
      if (dialogState === 'formation' && draft?.ids.includes(id)) {
        draft.leaderId = id;
        try {
          localStorage.setItem(
            drawKey,
            JSON.stringify({ source: draft.source, seed: draft.seed, leaderId: id })
          );
        } catch {}
        drawModal(true);
        audio('tap');
      }
      break;
    case 'deploy':
      if (dialogState !== 'formation' || !draft) break;
      ++aiRun;
      state = R.startRun({ ...draft, name: prologue.name }, state.run.chronicle);
      prologue = { step: 0, name: '' };
      draft = null;
      try {
        localStorage.removeItem(drawKey);
      } catch {}
      strikeData = null;
      logFilter = 'all';
      enterBattle(true);
      break;
    case 'team':
      if (screen === 'battle')
        openPage('team', personalPages.includes(dialogState) ? viewId : undefined);
      break;
    case 'team-guides':
      if (personalPages.includes(dialogState)) {
        openPage('team', viewId);
        teamUI.tab = 'arts';
        drawModal();
      }
      break;
    case 'team-tab':
      if (dialogState === 'team' && ['line', 'stores', 'arts'].includes(id)) {
        teamUI.tab = id;
        drawModal();
      }
      break;
    case 'person-tab':
      if (personalPages.includes(dialogState) && personalPages.includes(id)) openPage(id, viewId);
      break;
    case 'hero-details':
    case 'hero-school':
      if (dialogState === 'team') openPage(action === 'hero-school' ? 'skills' : 'sheet', id);
      break;
    case 'field-control':
      if (
        dialogState === 'team' &&
        state.run.scene === 'fight' &&
        G.party(state).some((v) => v.id === id && G.living(v))
      ) {
        closePage();
        choose(id);
        board.focusSelected();
      }
      break;
    case 'field-deploy':
      if (dialogState === 'team' && R.deployLineup(state)) {
        mode = 'move';
        viewId = state.selected;
        closePage();
        update();
        audio('turn');
        mapTip('我方行動');
        showPhase('ally', state.round, prefs.motion); // combat feel: phase banner
      }
      break;
    case 'scene-prev':
      if (dialogState === 'encounter') {
        state.run.beat = Math.max(0, state.run.beat - 1);
        save();
        drawModal();
      }
      if (dialogState === 'story') {
        storyIndex = Math.max(0, storyIndex - 1);
        drawModal();
      }
      break;
    case 'scene-next':
    case 'scene-skip':
      if (dialogState === 'encounter' && R.turnPage(state, action === 'scene-skip')) {
        save();
        showScene();
        audio('tap');
      } else if (dialogState === 'story') {
        if (storyIndex < R.dialogue(state, archiveScene).length - 1) {
          storyIndex++;
          drawModal();
        } else dismissLayer();
      }
      break;
    case 'teach-guide': {
      if (dialogState !== 'team' || data.unit !== viewId) break;
      const u = G.find(state, viewId);
      if (R.giveGuide(state, u, id)) {
        update();
        drawModal(true);
        audio('grow');
        notice(uName(u) + '已獲授《' + R.studyState(state, u, id).name + '》。');
      }
      break;
    }
    case 'transfer': {
      if (!['team', 'inventory'].includes(dialogState)) break;
      const u = G.find(state, viewId);
      const changed = G.transferEquipment(state, u, G.find(state, data.unit), id);
      if (changed) {
        update();
        drawModal(true);
        audio('tap');
      }
      break;
    }
    case 'lineup':
      if (dialogState === 'team' && R.toggleSeat(state, id)) {
        update();
        drawModal(true);
        audio('step');
      }
      break;
    case 'appoint':
      if (dialogState === 'team' && R.appointLeader(state, id)) {
        update();
        drawModal(true);
        audio('step');
      }
      break;
    case 'meet-zhou':
      if (dialogState === 'camp' && state.run.scene === 'shop' && state.run.last?.visit)
        openPage('bowls');
      break;
    case 'back-shop':
      if (dialogState === 'bowls') openPage('camp');
      break;
    case 'bowl-shuffle': {
      if (dialogState !== 'bowls' || !coverBowls(state)) break;
      const delay = prefs.motion ? 1200 : 0;
      bowlUntil = Date.now() + delay;
      const visit = state.run.last.visit;
      update();
      drawModal(true);
      audio('step');
      const ready = () => {
        if (
          dialogState === 'bowls' &&
          state.run.last?.visit === visit &&
          visit.phase === 'hidden'
        ) {
          bowlUntil = 0;
          drawModal(true);
          dialog.querySelector('[data-do="bowl-pick"]')?.focus({ preventScroll: true });
        }
      };
      if (delay) setTimeout(ready, delay);
      else ready();
      break;
    }
    case 'bowl-pick':
      if (dialogState === 'bowls' && Date.now() >= bowlUntil && pickBowl(state, Number(id))) {
        update();
        drawModal(true);
        audio('grow');
      }
      break;
    case 'buy':
      if (dialogState === 'camp' && R.buy(state, id)) {
        update();
        drawModal(true);
        audio('tap');
        notice(
          state.run.last.terminal
            ? '已寄在通吃坊，下一輪取用。'
            : G.ITEMS[id]
              ? '已收入隊伍行囊。'
              : '抄本已入公庫，可在「隊伍・武譜招式」授予俠客。'
        );
      }
      break;
    case 'march':
      if (dialogState !== 'camp' || !R.advance(state)) break;
      ++aiRun;
      strikeData = null;
      if (state.run.status === 'ended') {
        update();
        openPage('result');
      } else enterBattle(true);
      break;
    case 'skill-tab':
      if (dialogState === 'skills' && ['school', 'guides', 'loadout'].includes(id)) {
        studyUI.tab = id;
        studyUI.node = null;
        drawModal();
      }
      break;
    case 'skill-node':
      if (dialogState === 'skills') {
        studyUI.node = id;
        drawModal(true);
      }
      break;
    case 'learn': {
      const u = G.find(state, viewId);
      if (['skills', 'team'].includes(dialogState) && R.learn(state, u, id)) {
        const chooseSlot = u.unplacedArts?.includes(id);
        if (chooseSlot && dialogState === 'skills') studyUI.tab = 'loadout';
        update();
        drawModal(!chooseSlot);
        audio('grow');
        notice(
          chooseSlot
            ? '新招已悟，請選一格帶入此戰。'
            : u.slots.includes(id)
              ? '新招已悟，已裝入空格。'
              : '修習有成。'
        );
      }
      break;
    }
    case 'slot-select':
      if (['team', 'skills'].includes(dialogState) && [0, 1, 2].includes(Number(id))) {
        (dialogState === 'team' ? teamUI : studyUI).slot = Number(id);
        drawModal(true);
      }
      break;
    case 'slot-set':
    case 'slot-clear': {
      const u = G.find(state, viewId),
        index = Number(action === 'slot-clear' ? id : data.slot);
      if (
        ['skills', 'team'].includes(dialogState) &&
        R.setSlot(state, u, index, action === 'slot-clear' ? null : id)
      ) {
        update();
        drawModal(true);
        audio('step');
        notice(action === 'slot-clear' ? '已卸下此格招式。' : '招式配置已更新。');
      }
      break;
    }
    case 'quick-art':
      if (!dialog.open && G.canPay(state, selected(), id) && R.readyArt(state, selected(), id)) {
        if (!F.ON) hud.closePanel(true);
        update();
        doCommand('skill', true);
        if (keyboard) $('arts-toggle')?.focus({ preventScroll: true });
      }
      break;
    case 'goals':
      openPage('goals');
      break;
    case 'battle':
      closePage();
      break;
    case 'view-unit':
      if (!G.company(state).some((u) => u.id === id)) break;
      viewId = id;
      Object.assign(armState(), { item: null, owner: null, pickedHero: null });
      studyUI.node = null;
      studyUI.slot = teamUI.slot = 0;
      drawModal(false);
      audio('tap');
      break;
    case 'sheet':
    case 'inventory':
    case 'skills':
      if (screen !== 'battle') break;
      openPage(action);
      break;
    case 'end':
      askEnd();
      break;
    case 'end-confirm':
      beginEnemy();
      break;
    case 'close':
      dismissLayer();
      break;
    case 'item':
      useItem(id);
      break;
    case 'train': {
      const u = G.find(state, viewId);
      if (G.train(state, u, id)) {
        audio('grow');
        update();
        drawModal(true);
        notice(uName(u) + '已修習「' + G.TALENTS[id].name + '」');
      }
      break;
    }
    case 'log-filter':
      logFilter = id;
      drawModal(true);
      break;
    case 'result':
      result(true);
      break;
    case 'strike': {
      if (!strikeData || state.run.scene !== 'fight') return;
      const { source, target, skill } = strikeData;
      const u = G.find(state, source),
        t = typeof target === 'string' ? G.find(state, target) : target;
      const hit = G.resolve(state, u, t, skill);
      if (!hit) return;
      strikeData = null;
      closePage();
      if (!skill) audio('strike');
      mode = '';
      update();
      board.strikeEffect(
        u,
        skill && G.artFor(u).blink ? u : t,
        skill && G.artFor(u).blink
          ? 'blink'
          : skill && G.isSupport(G.artFor(u))
            ? 'healing'
            : skill
              ? 'signature-hit'
              : 'basic-hit',
        hit.from
      );
      board.showEffects(hit.effects);
      advanceAfterStrike(u.id);
      if (hit.leveled) {
        audio('grow');
        notice(uName(u) + '升至等級 ' + u.level + '，武學點數 +1');
      } else if (!state.result && !skill) notice(uName(u) + '施展「' + G.basicFor(u).name + '」');
      break;
    }
    case 'pref':
      prefs[id] = !prefs[id];
      savePrefs();
      paint();
      drawModal(true);
      audio('tap');
      break;
    case 'reset-ask':
      openTitle();
      openFormation();
      break;
  }
}
// Enter in the name field moves on, except while an input method is still composing.
dialog.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.id === 'youth-name' && !e.isComposing) {
    e.preventDefault();
    command('prologue-next');
  }
});
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-do]');
  if (b && !b.disabled) command(b.dataset.do, b.dataset.id, b.dataset, e.detail === 0);
});
const bind = (id, fn) => $(id).addEventListener('click', fn);
bind('terrain-guide', () => openPage('terrain'));
bind('focus-piece', () => {
  board.focusSelected();
  hud.closePanel(true);
});
bind('zoom-in', () => board.setZoom(board.zoom + 0.16));
bind('zoom-out', () => board.setZoom(board.zoom - 0.16));
bind('zoom-value', () => board.resetCamera());
bind('camera', () => {
  board.toggleCamera();
  audio('tap');
});
bind('rotate-left', () => board.rotate(-1));
bind('rotate-right', () => board.rotate(1));
document.addEventListener('keydown', (e) => {
  if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.repeat || dialog.open) return;
  const k = e.key.toLowerCase();
  if (k === '[' || k === ']') {
    e.preventDefault();
    board.rotate(k === '[' ? -1 : 1);
    return;
  }
  if (screen === 'title') {
    if (k === 'escape' && hud.fallback) hud.setFallback(false);
    if (k === '?') openPage('help');
    return;
  }
  if (k === 'escape') {
    // Polish (actionFlow): Esc takes back the move while the hero has not yet struck.
    const u = screen === 'battle' && F.ON && state.phase === 'ally' ? selected() : null;
    if (u?.moved && G.canAct(state, u) && (!hud.panel || hud.panel === 'arts')) doCommand('move');
    else if (hud.panel) hud.closePanel(true);
    else if (hud.fallback) hud.setFallback(false);
    else {
      mode = 'move';
      paint();
    }
    return;
  }
  if (k === '?') {
    openPage('help');
    return;
  }
  if (k === 'e') {
    e.preventDefault();
    askEnd();
    return;
  }
  if (k === 'g') {
    e.preventDefault();
    command('field-grid');
    return;
  }
  // Polish (dangerZone): D toggles the enemy's strike zone.
  if (k === 'd' && !$('danger-toggle')?.hidden) {
    e.preventDefault();
    command('field-danger');
    return;
  }
  // Polish (nextHeroKey): Tab picks the next hero who can still act, unless the keyboard focus
  // is showing on a control, in which case Tab moves between controls as it always did.
  if (k === 'tab' && screen === 'battle' && X.tabIsFree()) {
    const id = X.nextHero(state, e.shiftKey ? -1 : 1);
    if (id) {
      e.preventDefault();
      choose(id);
    }
    return;
  }
  // Polish (actionFlow): 1 to 4 pick an entry of the selected hero's arts list.
  if (F.ON) {
    const entry = '1234'.includes(k) && k ? $('field-arts').querySelectorAll('.field-art')[k - 1] : null;
    if (entry && !entry.disabled) {
      e.preventDefault();
      entry.click();
    }
    return;
  }
  const act = { 1: 'move', 2: 'skill', 3: 'wait' }[k];
  if (act) {
    e.preventDefault();
    doCommand(act, false, true);
  }
});
openTitle();

export {};
