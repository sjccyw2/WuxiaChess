// How a piece reads on the board: a team base under its feet and a gauge over its head.
//
// The base is drawn once per look onto an offscreen canvas and laid on the ground with one
// drawImage; the gauge is a handful of pixel-snapped rectangles. Nothing here sets a
// canvas filter or builds a gradient while painting.
import { CONDITION_NAMES } from '../rules/battle-mastery.js';

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const TAU = Math.PI * 2;

// Jade for the player's side and vermilion for the enemy, pushed brighter than the HUD
// tints so they hold against olive stone and grey water.
const TEAMS = {
  ally: {
    rim: '#8ff5d3',
    rimLow: '#3fb394',
    core: 'rgba(38,128,108,.80)',
    deep: 'rgba(8,44,40,.93)',
    bar: '#4fdcae',
    barTop: '#b9ffe6',
    frame: '#061d1a'
  },
  enemy: {
    rim: '#ff8763',
    rimLow: '#c2462c',
    core: 'rgba(150,52,36,.80)',
    deep: 'rgba(58,14,10,.93)',
    bar: '#ff6a4a',
    barTop: '#ffc1ad',
    frame: '#240b07'
  },
  // statusLooks: an enemy under 受制, fighting for the heroes for now (green-gold, its barbs kept).
  turned: {
    rim: '#e4ef8a',
    rimLow: '#9aa83a',
    core: 'rgba(118,132,40,.80)',
    deep: 'rgba(36,42,8,.93)',
    bar: '#cfe05a',
    barTop: '#f4ffc0',
    frame: '#1b2006'
  },
  // A hero who has acted this turn.
  spent: {
    rim: '#93a39d',
    rimLow: '#5d6b66',
    core: 'rgba(70,82,78,.66)',
    deep: 'rgba(22,28,27,.84)',
    bar: '#7fa397',
    barTop: '#b4c9c1',
    frame: '#101615'
  }
};
const GOLD = '#ffe2a2';
const LOW = { bar: '#ffc247', barTop: '#fff0bd' };
const INK = '#07110f';

function makeCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w));
  canvas.height = Math.max(1, Math.round(h));
  return canvas;
}

// ---------------------------------------------------------------------------------------
// Team bases. One round texture per look, laid flat on the ground through an affine map.

const BASE_PIXELS = 224; // texture pixels across one whole tile
const bases = new Map();

function baseTexture(team, selected) {
  const name = team + (selected ? '+' : '');
  if (bases.has(name)) return bases.get(name);
  const tone = TEAMS[team],
    canvas = makeCanvas(BASE_PIXELS, BASE_PIXELS),
    c = canvas.getContext('2d'),
    disc = (r) => {
      c.beginPath();
      c.arc(0, 0, r, 0, TAU);
    };
  c.translate(BASE_PIXELS / 2, BASE_PIXELS / 2);
  c.scale(BASE_PIXELS, BASE_PIXELS); // one unit is one tile from here on
  // Contact shadow, thrown a little toward the viewer's right as before.
  const shade = c.createRadialGradient(0.04, 0.03, 0.2, 0.04, 0.03, 0.47);
  shade.addColorStop(0, 'rgba(10,16,13,.55)');
  shade.addColorStop(0.62, 'rgba(10,16,13,.34)');
  shade.addColorStop(1, 'rgba(10,16,13,0)');
  c.fillStyle = shade;
  disc(0.47);
  c.fill();
  // Enemy bases carry four barbs, so the two sides differ in shape as well as colour.
  if (team === 'enemy' || team === 'turned') {
    for (let i = 0; i < 4; i++) {
      c.save();
      c.rotate((i * TAU) / 4 + TAU / 8);
      c.beginPath();
      c.moveTo(0.3, -0.125);
      c.lineTo(0.49, 0);
      c.lineTo(0.3, 0.125);
      c.closePath();
      c.fillStyle = INK;
      c.fill();
      c.beginPath();
      c.moveTo(0.32, -0.082);
      c.lineTo(0.452, 0);
      c.lineTo(0.32, 0.082);
      c.closePath();
      c.fillStyle = tone.rim;
      c.fill();
      c.restore();
    }
  }
  disc(0.378);
  c.fillStyle = INK;
  c.fill();
  const rim = c.createLinearGradient(-0.25, -0.3, 0.25, 0.3);
  rim.addColorStop(0, selected ? '#fff4cf' : tone.rim);
  rim.addColorStop(1, selected ? '#e9b860' : tone.rimLow);
  disc(0.352);
  c.fillStyle = rim;
  c.fill();
  disc(0.288);
  c.fillStyle = INK;
  c.fill();
  const well = c.createRadialGradient(0, 0, 0.02, 0, 0, 0.27);
  well.addColorStop(0, tone.core);
  well.addColorStop(1, tone.deep);
  c.globalCompositeOperation = 'destination-out';
  disc(0.27);
  c.fill();
  c.globalCompositeOperation = 'source-over';
  c.fillStyle = well;
  c.fill();
  disc(0.205);
  c.strokeStyle = selected ? GOLD : tone.rim;
  c.globalAlpha = 0.34;
  c.lineWidth = 0.014;
  c.stroke();
  bases.set(name, canvas);
  return canvas;
}

// Lays the unit square of one tile, centred on a board position, onto the screen. A piece's
// footprint is small enough that the perspective inside it does not show.
function onGround(layer, c, x, y, level) {
  const o = layer.point(x, y, level),
    ax = layer.point(x + 0.5, y, level),
    ay = layer.point(x, y + 0.5, level);
  c.transform((ax.x - o.x) * 2, (ax.y - o.y) * 2, (ay.x - o.x) * 2, (ay.y - o.y) * 2, o.x, o.y);
}

function paintBase(layer, u, pos, now, look) {
  const c = layer.ctx,
    motion = layer.prefs.motion,
    team = look.spent ? 'spent' : look.human ? 'ally' : look.turned ? 'turned' : 'enemy';
  c.save();
  onGround(layer, c, pos.x, pos.y, 0.099);
  c.drawImage(baseTexture(team, look.selected), -0.5, -0.5, 1, 1);
  if (!look.selected) {
    c.restore();
    return;
  }
  // The chosen piece breathes: one ring that swells, one that travels outward and fades.
  const beat = motion ? 0.5 + 0.5 * Math.sin(now / 290) : 0.5,
    ping = motion ? (now % 1500) / 1500 : 2;
  c.beginPath();
  c.arc(0, 0, 0.425 + beat * 0.022, 0, TAU);
  const near = c.getTransform();
  c.restore();
  // Stroked after the ground map is dropped, so the line keeps one width all the way round.
  c.save();
  c.lineWidth = 3.4;
  c.strokeStyle = 'rgba(40,26,8,.62)';
  c.stroke();
  c.lineWidth = 1.7;
  c.strokeStyle = GOLD;
  c.globalAlpha *= 0.72 + beat * 0.28;
  c.stroke();
  c.restore();
  if (ping < 1) {
    c.save();
    c.setTransform(near);
    c.beginPath();
    c.arc(0, 0, 0.43 + ping * 0.2, 0, TAU);
    c.restore();
    c.save();
    c.globalAlpha *= (1 - ping) * (1 - ping) * 0.8;
    c.lineWidth = 1.5;
    c.strokeStyle = GOLD;
    c.stroke();
    c.restore();
  }
}

// 五劍: 求敗's own ring on the ground, outside the barbs every enemy base carries, in the colour
// of the bar he is on, so he stands out among the masters around him (G.stageOf).
function paintStageRing(layer, pos, stage) {
  const c = layer.ctx;
  c.save();
  onGround(layer, c, pos.x, pos.y, 0.099);
  c.beginPath();
  c.arc(0, 0, 0.5, 0, TAU);
  c.restore();
  // Stroked after the ground map is dropped, so the line keeps one width all the way round.
  c.save();
  c.lineWidth = 4;
  c.strokeStyle = 'rgba(10,6,16,.72)';
  c.stroke();
  c.lineWidth = 2;
  c.strokeStyle = stage.colour;
  c.stroke();
  c.restore();
}

// ---------------------------------------------------------------------------------------
// The gauge: health with a draining ghost of the last wound, command marks and conditions.

const STATUS_COLOURS = {
  mark: '#fbcb8d',
  pin: '#c3dcaf',
  seal: '#d7b7e9',
  riposte: '#a9d6e9',
  poison: '#bda0ef',
  shield: '#e2c176',
  rally: '#ff9274',
  haste: '#8ee3cb',
  weak: '#ec91ae',
  exposed: '#e8a781',
  cover: '#9fc6e8',
  redirect: '#b9a6e6',
  evade: '#c9ecf5',
  taunt: '#f2a07a',
  wound: '#d9796a',
  freeze: '#bfe8ff',
  mute: '#ff8f7a',
  charm: '#d6e27a',
  immune: '#ffd45e',
  fortify: '#d8c7a0',
  formation: '#ffd98c'
};
// Every condition has a sign of its own, taken from its name; a stat that only went up or down
// (升降) shows the stat (攻, 防, 移) with an arrow in the badge's corner (STATUS_MARKS), a price
// (代價) what it holds back with a lock, which 解厄 cannot lift, and 亂氣 its layers.
const STATUS_SIGNS = {
  mark: '綻',
  pin: '移',
  seal: '截',
  riposte: '反',
  poison: '毒',
  shield: '護',
  rally: '攻',
  haste: '移',
  weak: '攻',
  exposed: '防',
  cover: '代',
  redirect: '挪',
  evade: '閃',
  taunt: '挑',
  wound: '傷',
  freeze: '定',
  mute: '閉',
  charm: '制',
  immune: '金',
  fortify: '防',
  recoil: '防',
  unguarded: '還',
  rooted: '移',
  spent: '招',
  backlash: '亂',
  disarm: '纏',
  formation: '陣' // derived: the piece has a 布陣 on the board
};
// The corners of a badge: 'up' or 'down' for a stat that went up or down, 'lock' for a price.
const STATUS_MARKS = {
  rally: ['up'],
  haste: ['up'],
  fortify: ['up'],
  weak: ['down'],
  exposed: ['down'],
  pin: ['down'],
  recoil: ['down', 'lock'],
  unguarded: ['lock'],
  rooted: ['lock'],
  spent: ['lock']
};
// A badge as words, for the wiki's list of signs: 「攻（升）」, 「防（降、鎖）」.
const MARK_WORDS = { up: '升', down: '降', lock: '鎖' };
const signLabel = (kind) =>
  STATUS_SIGNS[kind] +
  (STATUS_MARKS[kind] ? '（' + STATUS_MARKS[kind].map((m) => MARK_WORDS[m]).join('、') + '）' : '');

// Per layer: what each bar last showed, so a wound can linger as a pale segment and drain.
const memories = new WeakMap();
function memory(layer) {
  if (!memories.has(layer)) memories.set(layer, new Map());
  return memories.get(layer);
}

function ghostHealth(layer, u, shown, now) {
  const ghosts = memory(layer);
  let g = ghosts.get(u.id);
  // A new battle reuses ids; the layer's clock restarting marks the change.
  if (!g || g.unit !== u || now < g.seen || !layer.prefs.motion) {
    g = { unit: u, shown, value: shown, hold: 0, seen: now };
    ghosts.set(u.id, g);
    return shown;
  }
  if (shown < g.shown) g.hold = now + 260;
  if (shown >= g.value) g.value = shown;
  else if (now >= g.hold)
    g.value = Math.max(shown, g.value - ((now - Math.max(g.seen, g.hold)) / 520) * u.maxHp * 0.55);
  g.shown = shown;
  g.seen = now;
  return g.value;
}

// The marks in a badge's corners: an arrow top right, a small triangle light on a dark rim; a
// lock top left.
function paintMark(c, marks = [], sx, sy, size, one) {
  if (marks.includes('lock')) paintLock(c, sx, sy, size, one);
  const mark = marks.find((m) => m === 'up' || m === 'down');
  if (!mark) return;
  const w = Math.max(4, size * 0.4),
    h = w * 0.75,
    right = sx + size,
    top = sy,
    up = mark === 'up';
  const tri = (grow) => {
    c.beginPath();
    if (up) {
      c.moveTo(right - w / 2, top - grow);
      c.lineTo(right + grow, top + h + grow * 0.6);
      c.lineTo(right - w - grow, top + h + grow * 0.6);
    } else {
      c.moveTo(right - w / 2, top + h + grow);
      c.lineTo(right + grow, top - grow * 0.6);
      c.lineTo(right - w - grow, top - grow * 0.6);
    }
    c.closePath();
  };
  tri(one * 1.4);
  c.fillStyle = INK;
  c.fill();
  tri(0);
  c.fillStyle = up ? '#9ff0a8' : '#ff9a86';
  c.fill();
}

function paintLock(c, sx, sy, size, one) {
  const w = Math.max(3.5, size * 0.32),
    h = w * 0.72,
    x = sx,
    y = sy - h * 0.15;
  // The shackle, then the body, each on a dark rim.
  c.lineWidth = Math.max(one * 1.2, w * 0.18);
  c.strokeStyle = INK;
  c.beginPath();
  c.arc(x + w / 2, y, w * 0.3, Math.PI, 0);
  c.stroke();
  c.fillStyle = INK;
  c.fillRect(x - one, y - one, w + one * 2, h + one * 2);
  c.lineWidth = Math.max(one * 0.8, w * 0.12);
  c.strokeStyle = '#e8d29a';
  c.beginPath();
  c.arc(x + w / 2, y, w * 0.3, Math.PI, 0);
  c.stroke();
  c.fillStyle = '#e8d29a';
  c.fillRect(x, y, w, h);
}

function paintGauge(layer, u, g) {
  const c = layer.ctx,
    ratio = layer.canvas.width / layer.width || 1,
    snap = (v) => Math.round(v * ratio) / ratio,
    one = Math.max(1, Math.round(ratio)) / ratio, // one crisp line
    tone = TEAMS[g.spent ? 'spent' : g.human ? 'ally' : g.turned ? 'turned' : 'enemy'],
    motion = layer.prefs.motion;
  const len = snap(clamp(g.scale * 0.68, 20, 50)),
    tall = snap(g.scale >= 36 ? 5 : 4),
    left = snap(g.x - len / 2),
    top = snap(g.y - tall / 2),
    // 五劍: a piece with stages shows only the bar it is on, full as it begins and empty at its
    // end, in that stage's colour (never the amber of a low bar: the stage says how far it is).
    stage = g.stage,
    floor = stage ? stage.floor : 0,
    span = stage ? stage.top - stage.floor : u.maxHp,
    share = clamp((g.shown - floor) / span, 0, 1),
    ghost = clamp((ghostHealth(layer, u, g.shown, g.now) - floor) / span, 0, 1),
    low = !stage && share <= 0.34 && !g.spent;
  // Frame: a dark plate, a hairline in the team colour, then the trough.
  if (g.scale >= 30) {
    // The soft outer plate is dropped on small pieces (phones), where it only adds bulk.
    c.fillStyle = 'rgba(4,10,9,.5)';
    c.fillRect(left - one * 2, top - one * 2, len + one * 4, tall + one * 4);
  }
  c.fillStyle = tone.frame;
  c.fillRect(left - one, top - one, len + one * 2, tall + one * 2);
  c.fillStyle = '#2b3531';
  c.fillRect(left, top, len, tall);
  const fill = Math.max(share > 0 ? one : 0, snap(len * share));
  if (ghost > share) {
    c.fillStyle = '#fff3d6';
    c.fillRect(left + fill, top, Math.max(one, snap(len * ghost) - fill), tall);
  }
  c.fillStyle = stage ? stage.colour : low ? LOW.bar : tone.bar;
  c.fillRect(left, top, fill, tall);
  c.fillStyle = stage ? 'rgba(255,255,255,.55)' : low ? LOW.barTop : tone.barTop;
  c.fillRect(left, top, fill, one);
  c.fillStyle = 'rgba(0,0,0,.22)';
  c.fillRect(left, top + tall - one, fill, one);
  const mid = top + tall / 2;

  if (stage) {
    // The bars still to come, his own included, as ticks under the bar in their colours: the
    // count reads without the colours.
    const tick = snap(clamp(len / 9, 2, 4)),
      gap = snap(tick * 0.6),
      ty = snap(top + tall + one * 2);
    for (let i = stage.index; i < stage.count; i++) {
      const tx = snap(left + (i - stage.index) * (tick + gap));
      c.fillStyle = INK;
      c.fillRect(tx - one, ty - one, tick + one * 2, tick * 0.75 + one * 2);
      c.fillStyle = g.stages[i].colour;
      c.fillRect(tx, ty, tick, tick * 0.75);
    }
  }
  const rank = g.rank;
  if (stage) {
    // His own seal in place of the 主 every master carries: a round 求 in the colour of his bar.
    const size = snap(g.scale >= 36 ? 15 : 13),
      cx = snap(left + len + one * 2 + 2 + size / 2),
      r = size / 2;
    c.beginPath();
    c.arc(cx, mid, r + one, 0, TAU);
    c.fillStyle = INK;
    c.fill();
    c.beginPath();
    c.arc(cx, mid, r, 0, TAU);
    c.fillStyle = stage.colour;
    c.fill();
    c.fillStyle = INK;
    c.font = 'bold ' + (size - 4) + 'px serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(g.seal, cx, mid + 0.5);
    c.textBaseline = 'alphabetic';
  } else if (rank) {
    const boss = rank === 'boss',
      size = snap(g.scale >= 36 ? 14 : 12),
      bx = snap(left + len + one * 2 + 2),
      by = snap(mid - size / 2);
    c.fillStyle = INK;
    c.fillRect(bx - one, by - one, size + one * 2, size + one * 2);
    c.fillStyle = boss ? '#7a2a1c' : '#4a3038';
    c.fillRect(bx, by, size, size);
    c.fillStyle = boss ? '#ffb38a' : '#b98f8a';
    c.fillRect(bx, by, size, one);
    c.fillStyle = boss ? '#ffe3a0' : '#f8cdb6';
    c.font = 'bold ' + (size - 3) + 'px serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(boss ? '主' : '副', bx + size / 2, by + size / 2 + 0.5);
    c.textBaseline = 'alphabetic';
  }
  if (g.leader) {
    // A gold pennant on a short staff, planted at the bar's left end.
    const k = clamp(g.scale / 40, 0.72, 1),
      fx = snap(left - one * 2 - 3 * k),
      ft = snap(mid - 8 * k),
      staff = snap(13 * k);
    c.fillStyle = INK;
    c.fillRect(fx - one, ft - one, one * 3, staff + one * 2);
    c.beginPath();
    c.moveTo(fx, ft - 1.6);
    c.lineTo(fx - 8.4 * k - 2.4, ft + 3.2 * k);
    c.lineTo(fx, ft + 6.4 * k + 1.6);
    c.closePath();
    c.fill();
    c.fillStyle = '#ffd77e';
    c.fillRect(fx, ft, one, staff);
    c.beginPath();
    c.moveTo(fx, ft);
    c.lineTo(fx - 8.4 * k, ft + 3.2 * k);
    c.lineTo(fx, ft + 6.4 * k);
    c.closePath();
    c.fill();
  }
  const statuses = [...Object.keys(u.conditions || {}), ...(g.formation ? ['formation'] : [])];
  const size = snap(clamp(g.scale * 0.235, 10, 15));
  let roof = top - one * 2;
  if (statuses.length) {
    const sy = snap(roof - size - 2);
    for (const [i, kind] of statuses.entries()) {
      const sx = snap(g.x + (i - statuses.length / 2) * (size + 2) + 1);
      c.fillStyle = INK;
      c.fillRect(sx - one, sy - one, size + one * 2, size + one * 2);
      c.fillStyle = '#1d2f29';
      c.fillRect(sx, sy, size, size);
      c.fillStyle = STATUS_COLOURS[kind] || '#e9dcc0';
      c.fillRect(sx, sy + size - one, size, one);
      // A badge with a corner mark draws its character a little smaller, off the corner.
      const marks = STATUS_MARKS[kind] || [],
        right = kind === 'backlash' || marks.some((m) => m !== 'lock'),
        left = marks.includes('lock'),
        marked = right || left,
        shift = size * 0.12 * ((left ? 1 : 0) - (right ? 1 : 0)),
        drop = marked ? size * 0.12 : 0;
      c.font = 'bold ' + (size - (marked ? 3 : 2)) + 'px serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      // A condition with no sign of its own shows the first character of its name.
      c.fillText(
        STATUS_SIGNS[kind] || CONDITION_NAMES[kind]?.[0] || '',
        sx + size / 2 + shift,
        sy + size / 2 + drop
      );
      paintMark(c, marks, sx, sy, size, one);
      // 亂氣: the layers it has laid, small in the lower corner.
      if (kind === 'backlash' && u.conditions.backlash?.power) {
        const n = String(u.conditions.backlash.power),
          k = Math.max(6, Math.round(size * 0.5));
        c.font = 'bold ' + k + 'px sans-serif';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillStyle = INK;
        c.fillRect(sx + size - k * 0.75, sy - one, k * 0.75 + one, k * 0.9 + one);
        c.fillStyle = '#ffe3a0';
        c.fillText(n, sx + size - k * 0.375 + one / 2, sy + k * 0.45);
        c.textAlign = 'center';
        c.textBaseline = 'middle';
      }
    }
    c.textBaseline = 'alphabetic';
    roof = sy - one;
  }
  if (g.selected) {
    // A chevron bobbing over the chosen piece.
    const bob = motion ? Math.sin(g.now / 250) * 2.2 : 0,
      tip = roof - 4 + bob,
      half = clamp(g.scale * 0.13, 5, 7.5);
    const chevron = (grow) => {
      c.beginPath();
      c.moveTo(g.x, tip + grow);
      c.lineTo(g.x + half + grow, tip - half * 0.95 - grow * 0.4);
      c.lineTo(g.x + half * 0.42, tip - half * 0.95 - grow);
      c.lineTo(g.x, tip - half * 0.5 - grow * 0.2);
      c.lineTo(g.x - half * 0.42, tip - half * 0.95 - grow);
      c.lineTo(g.x - half - grow, tip - half * 0.95 - grow * 0.4);
      c.closePath();
    };
    chevron(1.6);
    c.fillStyle = 'rgba(38,24,6,.86)';
    c.fill();
    chevron(0);
    c.fillStyle = GOLD;
    c.fill();
  }
}

// How the states that hold a piece look on the board (statusLooks, actors/status-looks.js).
const STATUS_LOOKS = {
  freeze: '身形凝在中途，通體霜白，腳下結冰；解凍時冰屑四散',
  mute: '手邊懸一道點穴符，人照走，卻不出手；解穴時符紙飛散',
  charm: '底座、輪廓與氣血條轉為青金，腳下青金弧光繞行；受制一解，便轉回赤色',
  immune: '腳下金環，身上金光流轉；受擊不傷，跳出「無功」並響起金色波紋',
  fortify: '固守加身時，腳下升起一圈六角石紋'
};

export { paintBase, paintGauge, paintStageRing, STATUS_SIGNS, STATUS_MARKS, STATUS_LOOKS, signLabel };
