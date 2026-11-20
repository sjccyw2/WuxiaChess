import { fieldCells } from '../data/terrain.js';
import { drawDanger } from './danger.js';
import { paintMasteryFlourish } from '../fx/mastery-vfx.js';
// Animated billboard art is painted after the ground. Only the ground ray can accept a move.
import * as G from '../rules/game.js';
import { art } from '../ui/artwork.js';
import { paintTechniqueStroke } from '../fx/technique-strokes.js';
import { paintTechniqueTier } from '../fx/technique-tiers.js';
import { paintSkillEffect } from '../fx/skill-effects.js';
import { planFootwork, sampleFootwork } from './footwork.js';
import {
  compactImage,
  compactSheetName,
  spriteSheet,
  FRAMES,
  CELL_WIDTH,
  CELL_HEIGHT,
  FOOT_Y
} from './sprite-sheets.js';
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const openingActors = [
  { id: 'hero', x: 5.1, y: 5.25, side: 'ally', hp: 1 },
  { id: 'xiao', x: 7.0, y: 3.45, side: 'ally', hp: 1 },
  { id: 'guo', x: 7.4, y: 6.5, side: 'ally', hp: 1 }
];
const drive = [-0.025, -0.045, -0.058, -0.025, 0.11, 0.15, 0.076, 0];
const recoil = [0, -0.03, -0.073, -0.105, -0.089, -0.054, -0.024, 0];
const stepLift = [0, 0.04, 0.07, 0.035, 0, 0.035, 0.065, 0.03];
class ActorLayer {
  constructor(canvas, view, notify, onTechnique) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.view = view;
    this.notify = notify;
    this.onTechnique = onTechnique;
    this.images = new Map();
    this.tracks = new Map();
    this.snapshot = new Map();
    this.headings = new Map();
    this.waiters = new Set();
    this.latestMoves = new Map();
    this.imageFailures = new Set();
    this.width = this.height = 1;
    this.prefs = { motion: true, grid: true };
    this.reset();
  }
  image(filename) {
    if (!this.images.has(filename)) {
      const img = new Image();
      this.images.set(filename, img);
      img.decoding = 'async';
      if (filename === 'battle-poses') img.fetchPriority = 'high';
      img.onload = () => this.notify();
      const fail = () => {
        this.imageFailures.add(filename);
        this.notify();
      };
      if (filename === 'battle-poses') compactImage(img, fail);
      else {
        img.onerror = fail;
        img.src = art(filename + (filename.startsWith('poses-') ? '.png' : '.webp'));
      }
      img.decode?.().then(
        () => this.notify(),
        () => {}
      );
    }
    return this.images.get(filename);
  }
  warm(ids) {
    this.image('battle-poses');
    for (const id of new Set(ids)) {
      this.image('motion-' + id);
      if (compactSheetName(id) !== 'battle-poses') this.image(compactSheetName(id));
    }
  }
  sheet(id) {
    return spriteSheet(id, (name) => this.image(name));
  }
  reset() {
    for (const e of this.effects || [])
      if (e.kind === 'technique' && e.announced) this.onTechnique?.(e.skill, 'end');
    this.exchange = null;
    this.preview = null;
    this.waitingForArt = false;
    this.time = 0;
    this.until = 0;
    this.lastPaint = null;
    this.snapshot.clear();
    this.tracks.clear();
    this.headings.clear();
    this.latestMoves.clear();
    this.effects = [];
    this.boxes = [];
    this.settle();
  }
  get playing() {
    return this.time < this.until;
  }
  finished() {
    if (!this.playing) return Promise.resolve();
    return new Promise((resolve) => this.waiters.add(resolve));
  }
  settle() {
    for (const resolve of this.waiters) resolve();
    this.waiters.clear();
  }
  track(id) {
    if (!this.tracks.has(id)) this.tracks.set(id, { clips: [], impacts: [], exit: 0 });
    return this.tracks.get(id);
  }
  tail(id, except = null) {
    return this.track(id).clips.reduce(
      (end, clip) => (clip === except ? end : Math.max(end, clip.end)),
      this.time
    );
  }
  hold(end) {
    if (!this.playing) this.lastPaint = null;
    this.until = Math.max(this.until, end);
  }
  addClip(id, clip) {
    this.hold(clip.end);
    this.track(id).clips.push(clip);
    return clip;
  }
  advance(now, covered) {
    this.waitingForArt = false;
    const previous = this.lastPaint;
    this.lastPaint = now;
    if (covered) {
      this.lastPaint = null;
      return;
    }
    if (this.playing) {
      // Do not spend an action's frames on an idle placeholder or a background tab.
      const waiting = [...this.tracks].some(([id, track]) => {
        if (!track.clips.some((clip) => clip.end > this.time && clip.start <= this.time + 60))
          return false;
        const artId = (G.unitDetails(this.state && G.find(this.state, id)) || G.DETAILS[id]).mini;
        if (this.sheet(artId)) return false;
        return [compactSheetName(artId), 'motion-' + artId].some((name) => {
          const image = this.image(name);
          return !this.imageFailures.has(name) && !(image.complete && image.naturalWidth > 0);
        });
      });
      if (waiting) {
        this.waitingForArt = true;
        this.lastPaint = null;
        return;
      }
    }
    if (previous !== null) {
      // A slow scenery render can extend playback, but cannot erase an entire pose.
      const dt = Math.max(0, now - previous);
      this.time += this.playing ? Math.min(dt, 40) : dt;
    }
  }
  sync(state, mode, prefs) {
    this.state = state;
    this.mode = mode;
    this.prefs = prefs;
    this.preview = null;
    this.warm(state.units.filter(G.living).map((u) => G.unitDetails(u).mini));
    this.latestMoves.clear();
    for (const u of state.units) {
      const old = this.snapshot.get(u.id);
      if (
        old &&
        (old.blinkSerial || 0) === (u.blinkSerial || 0) &&
        (old.x !== u.x || old.y !== u.y)
      ) {
        const path = G.routeConnects(u.route, old, u, state.mapIndex)
            ? u.route
            : G.movementPath(state, u, old, u),
          start = this.tail(u.id);
        if (path.length > 1) {
          const { legs, duration } = planFootwork(path, prefs.motion, state.mapIndex);
          const walk = this.addClip(u.id, { row: 1, start, end: start + duration, path, legs });
          this.latestMoves.set(u.id, walk);
        }
      }
      if (old && old.hp > 0 && u.hp <= 0) {
        // pose() extends this through the killing blow and any preceding walk.
        this.track(u.id).exit = this.time + (prefs.motion ? 600 : 280);
      }
      this.snapshot.set(u.id, { x: u.x, y: u.y, hp: u.hp, blinkSerial: u.blinkSerial });
    }
  }
  pose(actor, target, kind, origin = actor) {
    const full = this.prefs.motion;
    const pushed =
      kind === 'signature-hit' || kind === 'basic-hit' ? this.latestMoves.get(target.id) : null;
    const start = Math.max(this.tail(actor.id), this.tail(target.id, pushed));
    const blink = kind === 'blink',
      friendly = blink || kind === 'healing' || kind === 'support';
    const hostile = kind === 'villain-skill';
    const special = hostile || friendly || kind === 'signature-hit';
    const art = special ? (hostile ? G.enemyTechnique(actor) : G.artFor(actor)) : null;
    const rank = art ? Math.max(1, Math.min(4, art.tier || 2)) : 0;
    const duration = full ? [736, 980, 1240, 1540, 1860][rank] : 480;
    const hit = start + duration * 0.52;
    const contact = pushed ? pushed.path[0] : target;
    const direction = [contact.x - origin.x, contact.y - origin.y];
    this.addClip(actor.id, {
      row: 2,
      start,
      end: start + duration,
      direction,
      ...(blink ? { blinkFrom: origin, blinkAt: hit } : {})
    });
    let end = start + duration;
    if (!friendly) {
      const hurtEnd = hit + (full ? 535 : 420);
      this.addClip(target.id, { row: 3, start: hit, end: hurtEnd });
      end = Math.max(end, hurtEnd);
      if (pushed) {
        pushed.knockback = true;
        pushed.start = hit;
        pushed.end = hit + (full ? 265 : 105);
        this.hold(pushed.end);
      }
      if (target.hp <= 0) {
        this.track(target.id).exit = hurtEnd + (full ? 210 : 60);
        this.hold(this.track(target.id).exit);
      }
    }
    this.exchange = { actor: actor.id, target: target.id, start, hit, end };
    if (special) {
      const flourish = art.blink
        ? 'blink'
        : art.poison
          ? 'poison'
          : art.debuff
            ? 'debuff'
            : art.hpCost
              ? 'sacrifice'
              : art.rally
                ? 'rally'
                : art.shield
                  ? 'shield'
                  : art.haste
                    ? 'haste'
                    : null;
      this.effects.push({
        flourish,
        rank,
        family: hostile ? 'enemy' : art,
        kind: 'technique',
        skill: actor.id,
        techniqueId: hostile
          ? art.stroke
          : actor.activeArt && actor.activeArt !== 'signature'
            ? actor.activeArt
            : 'signature:' + actor.id,
        visual:
          { huang: 'guard', yang: 'guo', zhang: 'medic', hu: 'xiao' }[art.visual] || art.visual,
        name: art.name,
        actor: actor.id,
        target: target.id,
        from: { x: origin.x, y: origin.y },
        to: { x: contact.x, y: contact.y },
        start,
        end: start + duration
      });
    } else if (full)
      this.effects.push({
        kind,
        actor: actor.id,
        target: target.id,
        start: hit - 105,
        end: hit + 350
      });
    this.notify();
  }
  numbers(items) {
    const exchange = this.exchange,
      full = this.prefs.motion;
    for (const [index, [id, value, reason]] of items.entries()) {
      let start = (exchange?.hit ?? this.time) + index * (full ? 105 : 32);
      if (exchange && id === exchange.actor && value.startsWith('−') && reason !== 'sacrifice') {
        const reply = exchange.end + (full ? 35 : 15);
        const initiator = G.find(this.state, exchange.target),
          recipient = G.find(this.state, id);
        const direction = [recipient.x - initiator.x, recipient.y - initiator.y];
        this.addClip(initiator.id, {
          row: 2,
          start: reply,
          end: reply + (full ? 680 : 440),
          direction
        });
        start = reply + (full ? 345 : 220);
        const end = start + (full ? 504 : 400);
        this.addClip(id, { row: 3, start, end });
        if (recipient.hp <= 0) {
          this.track(id).exit = end + (full ? 200 : 60);
          this.hold(this.track(id).exit);
        }
        if (full)
          this.effects.push({
            kind: 'basic-hit',
            actor: initiator.id,
            target: id,
            start: start - 90,
            end: start + 255
          });
      } else if (
        exchange &&
        id !== exchange.target &&
        value.startsWith('−') &&
        reason !== 'sacrifice'
      ) {
        const end = start + (full ? 504 : 400);
        this.addClip(id, { row: 3, start, end });
        if (G.find(this.state, id).hp <= 0) {
          this.track(id).exit = end + (full ? 180 : 60);
          this.hold(this.track(id).exit);
        }
      }
      // Rules commit and save immediately. The on-board gauge changes when
      // the corresponding blow, second sword, counter or healing note lands.
      const amount = Number(value.replace('−', '-'));
      if (Number.isFinite(amount)) this.track(id).impacts.push({ at: start, amount });
      if (full) this.effects.push({ kind: 'number', target: id, value, start, end: start + 800 });
    }
    this.exchange = null;
    this.notify();
  }
  size(w, h, ratio) {
    this.width = w;
    this.height = h;
    this.canvas.width = Math.round(w * ratio);
    this.canvas.height = Math.round(h * ratio);
    this.ctx.setTransform(this.canvas.width / w, 0, 0, this.canvas.height / h, 0, 0);
  }
  point(x, y, h) {
    const p = this.view.tile(x, y, h);
    return { x: p.x * this.width, y: p.y * this.height, z: p.z };
  }
  scaleAt(x, y) {
    const camera = this.view.camera,
      me = camera.matrixWorldInverse.elements;
    const depth = -(
      me[2] * (x - this.view.centerX) +
      me[6] * 0.09 +
      me[10] * (y - this.view.centerZ) +
      me[14]
    );
    return depth > 0.3 ? (this.height * camera.projectionMatrix.elements[5]) / (2 * depth) : 0;
  }
  path(points) {
    const c = this.ctx;
    c.beginPath();
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      if (i) c.lineTo(p.x, p.y);
      else c.moveTo(p.x, p.y);
    }
    c.closePath();
  }
  tile(x, y, r = 0.49) {
    return [
      [-r, -r],
      [r, -r],
      [r, r],
      [-r, r]
    ].map(([dx, dy]) => this.point(x + dx, y + dy));
  }
  circle(x, y, r, level) {
    const points = [];
    for (let i = 0; i < 32; i++) {
      const a = (i * Math.PI) / 16;
      points.push(this.point(x + Math.cos(a) * r, y + Math.sin(a) * r, level));
    }
    this.path(points);
  }
  drawRoute(path, ally) {
    if (path.length < 2) return;
    const c = this.ctx,
      last = path.at(-1);
    const pts = path.map((p) => this.point(p.x, p.y, 0.12));
    const width = clamp(this.scaleAt(last.x, last.y) * 0.052, 1.35, 3.5);
    const ink = ally ? '#153d38' : '#512d24',
      line = ally ? '#b9f5d4' : '#ffd3a1';
    c.save();
    c.lineCap = c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(pts[0].x, pts[0].y);
    for (const p of pts.slice(1)) c.lineTo(p.x, p.y);
    c.strokeStyle = ink;
    c.lineWidth = width * 2.3;
    c.stroke();
    c.lineWidth = width;
    c.strokeStyle = line;
    c.stroke();
    for (let i = 1; i < path.length - 1; i++) {
      const prev = path[i - 1],
        next = path[i + 1];
      if (prev.x === next.x || prev.y === next.y) continue;
      this.circle(path[i].x, path[i].y, 0.087, 0.125);
      c.fillStyle = ink;
      c.fill();
      c.stroke();
    }
    // A hollow diamond marks the exact landing tile, including on touch screens.
    this.path(
      [
        [0, -0.17],
        [0.17, 0],
        [0, 0.17],
        [-0.17, 0]
      ].map(([x, y]) => this.point(last.x + x, last.y + y, 0.13))
    );
    c.fillStyle = ink;
    c.fill();
    c.strokeStyle = ally ? '#fff1bc' : line;
    c.stroke();
    c.restore();
  }
  drawWard(s) {
    const guards = G.wardEscorts(s),
      boss = G.find(s, 'murong');
    if (!guards.length || !G.living(boss)) return;
    const c = this.ctx,
      center = this.location(boss, this.time);
    const phase = this.prefs.motion ? this.time / 1700 : 0.37;
    c.save();
    for (const [i, guard] of guards.entries()) {
      const from = this.location(guard, this.time);
      const star = (t) =>
        this.point(
          from.x + (center.x - from.x) * t,
          from.y + (center.y - from.y) * t,
          0.24 + Math.sin(Math.PI * t) * 0.38
        );
      const start = star(0);
      c.beginPath();
      c.moveTo(start.x, start.y);
      for (let step = 1; step <= 20; step++) {
        const p = star(step / 20);
        c.lineTo(p.x, p.y);
      }
      c.strokeStyle = 'rgba(70,32,59,.7)';
      c.lineWidth = 3;
      c.stroke();
      c.strokeStyle = '#e7acd4';
      c.lineWidth = 1.15;
      c.stroke();
      for (let k = 0; k < 3; k++) {
        const p = star((phase + k / 3 + i / 5) % 1);
        this.path([
          { x: p.x, y: p.y - 3.8 },
          { x: p.x + 2.2, y: p.y },
          { x: p.x, y: p.y + 3.8 },
          { x: p.x - 2.2, y: p.y }
        ]);
        c.fillStyle = '#ffe5ab';
        c.fill();
      }
    }
    this.circle(center.x, center.y, 0.48, 0.16);
    c.strokeStyle = '#eac0df';
    c.lineWidth = 1.8;
    c.stroke();
    c.restore();
  }
  floor(reach, hover) {
    const c = this.ctx,
      s = this.state,
      u = G.find(s, s.selected);
    const can = G.canAct(s, u),
      cast = ['attack', 'skill'].includes(this.mode) && can;
    drawDanger(this); // Polish (dangerZone): the enemy's strike zone, under everything else
    const art = cast && this.mode === 'skill' ? G.artFor(u) : null;
    const range = cast ? (art ? art.range : u.range) : 0;
    const heal = art && (G.isSupport(art) || art.blink);
    const canBlink = art?.blink && G.canPay(s, u);
    for (const { x, y } of fieldCells(s.mapIndex)) {
      const walk = this.mode === 'move' && can && !u.moved && reach.has(G.key(x, y));
      const aim =
        cast &&
        G.distance(u, { x, y }) <= range &&
        G.walkable(x, y, s.mapIndex) &&
        (!art?.blink || (canBlink && !G.at(s, x, y)));
      if (!this.prefs.grid && !walk && !aim) continue;
      this.path(this.tile(x, y));
      c.lineJoin = 'round';
      if (walk || aim) {
        c.fillStyle = walk
          ? 'rgba(27,141,118,.34)'
          : heal
            ? 'rgba(86,160,118,.28)'
            : 'rgba(175,71,47,.24)';
        c.fill();
        c.strokeStyle = walk ? 'rgba(195,250,217,.82)' : heal ? '#b2edbd' : 'rgba(255,198,163,.8)';
        c.lineWidth = 1.15;
      } else {
        c.strokeStyle = 'rgba(42,57,53,.40)';
        c.lineWidth = 0.85;
      }
      c.stroke();
      if (this.prefs.grid && G.cover(x, y, s.mapIndex)) {
        const p = this.point(x - 0.32, y + 0.29);
        c.fillStyle = '#495f4d';
        c.font = 'bold ' + Math.max(8, this.height * 0.017) + 'px serif';
        c.fillText('◇', p.x, p.y);
      }
    }
    const mark = hover && this.mode === 'skill' && G.at(s, hover.x, hover.y);
    if (mark && G.targetOK(s, u, mark, true)) {
      const f = G.forecast(u, mark, true, s);
      const nearby = f.support ? f.recipients : f.splash;
      c.save();
      c.lineWidth = 2.2;
      for (const { id } of nearby) {
        const piece = G.find(s, id);
        this.path(this.tile(piece.x, piece.y, 0.41));
        c.fillStyle = f.support ? 'rgba(108,196,148,.23)' : 'rgba(232,126,64,.27)';
        c.strokeStyle = f.support ? '#b8edca' : '#ffe3a3';
        c.fill();
        c.stroke();
      }
      c.restore();
    }
    if (s.mapIndex === 9) this.drawWard(s);
    const lamp = G.unclaimedObjectiveTile(s);
    if (lamp) {
      const point = this.point(lamp.x, lamp.y, 0.18);
      const radius = clamp(this.scaleAt(lamp.x, lamp.y) * 0.19, 5, 12);
      this.circle(lamp.x, lamp.y, 0.38, 0.12);
      c.strokeStyle = '#ffdc8a';
      c.lineWidth = 2;
      c.stroke();
      c.save();
      c.translate(point.x, point.y);
      c.scale(radius, radius);
      this.path([
        { x: 0, y: -1.6 },
        { x: 0.6, y: -0.82 },
        { x: 0.43, y: -0.2 },
        { x: 0, y: 0.02 },
        { x: -0.43, y: -0.2 },
        { x: -0.6, y: -0.82 }
      ]);
      c.fillStyle = '#875222';
      c.fill();
      c.lineWidth = 0.12;
      c.strokeStyle = '#ffe69b';
      c.stroke();
      c.beginPath();
      c.moveTo(0, -1.3);
      c.lineTo(0, -0.28);
      c.stroke();
      c.restore();
    }
    if (hover) {
      this.path(this.tile(hover.x, hover.y, 0.47));
      c.fillStyle = 'rgba(250,232,172,.19)';
      c.fill();
      c.strokeStyle = '#fff0af';
      c.lineWidth = 2.3;
      c.stroke();
    }
    let selectedInMotion = false;
    for (const unit of s.units) {
      const walk = this.tracks
        .get(unit.id)
        ?.clips.find(
          (clip) => clip.path && !clip.knockback && clip.start <= this.time && this.time < clip.end
        );
      if (!walk) continue;
      const p = sampleFootwork(walk, this.time);
      this.drawRoute([p, ...walk.path.slice(p.index + 1)], G.ally(unit));
      if (unit === u) selectedInMotion = true;
    }
    if (
      hover &&
      !selectedInMotion &&
      this.mode === 'move' &&
      can &&
      !u.moved &&
      reach.has(G.key(hover.x, hover.y))
    ) {
      if (this.preview?.x !== hover.x || this.preview?.y !== hover.y)
        this.preview = { ...hover, path: G.movementPath(s, u, u, hover) };
      this.drawRoute(this.preview.path, true);
    }
  }
  location(u, now) {
    const blink = this.tracks.get(u.id)?.clips.find((c) => c.blinkFrom && now < c.blinkAt);
    if (blink) return blink.blinkFrom;
    const walk = this.tracks.get(u.id)?.clips.find((c) => c.path && c.end > now);
    return walk ? sampleFootwork(walk, now) : { x: u.x, y: u.y };
  }
  healthAt(u, now) {
    let hp = u.hp;
    for (const impact of this.tracks.get(u.id)?.impacts || []) {
      if (impact.at > now) hp -= impact.amount;
    }
    return clamp(hp, 0, u.maxHp);
  }
  actor(u, pos, now, title) {
    const c = this.ctx,
      p = this.point(pos.x, pos.y),
      scale = this.scaleAt(pos.x, pos.y);
    if (!scale) return;
    const h = scale * (title ? 1.85 : 1.68),
      w = (h * CELL_WIDTH) / CELL_HEIGHT;
    const tr = title ? {} : this.tracks.get(u.id) || {},
      human = u.side === 'ally',
      selected = !title && u.id === this.state.selected;
    const left = p.x - w / 2,
      top = p.y - (h * FOOT_Y) / CELL_HEIGHT;
    const seed = u.id.charCodeAt(0) * 41;
    const alpha =
      !title && u.hp <= 0
        ? clamp(((tr.exit || 0) - now) / (this.prefs.motion ? 200 : 60), 0, 1)
        : 1;
    if (alpha <= 0) return;
    c.save();
    c.globalAlpha = alpha;
    this.circle(pos.x + 0.055, pos.y + 0.035, title ? 0.25 : 0.33, 0.094);
    c.fillStyle = 'rgba(27,32,25,.32)';
    c.fill();
    if (!title) {
      this.circle(pos.x, pos.y, 0.308, 0.099);
      c.fillStyle = human ? '#254b41bb' : '#692e25bb';
      c.fill();
      c.strokeStyle = selected ? '#ffe1a0' : human ? '#b7ebc4' : '#f2ac86';
      c.lineWidth = selected ? 2.4 : 1.4;
      c.stroke();
      if (selected) {
        this.circle(pos.x, pos.y, 0.392, 0.101);
        c.strokeStyle = '#f9cd78';
        c.lineWidth = 1.2;
        c.stroke();
      }
    }
    let row = 0,
      frame = this.prefs.motion ? Math.floor((now + seed) / 148) % FRAMES : 0;
    const active = title
      ? []
      : (tr.clips || []).filter((clip) => now >= clip.start && now < clip.end);
    const clip =
      active.filter((clip) => !clip.path).at(-1) || active.find((clip) => !clip.knockback);
    let dir = this.headings.get(u.id) || (human ? [0.4, -1] : [-0.4, 1]);
    if (clip) {
      row = clip.row;
      const fraction = clamp((now - clip.start) / (clip.end - clip.start), 0, 0.99999);
      frame = Math.floor(fraction * FRAMES);
      if (clip.direction && clip.direction.some(Boolean)) dir = clip.direction;
      if (clip.path) {
        dir = pos.direction;
        frame = pos.frame;
      }
      this.headings.set(u.id, dir);
    }
    if (title) dir = u.id === 'hero' ? [1, -0.5] : [-1, 0.6];
    const flip = dir[0] * Math.cos(this.view.yaw) - dir[1] * Math.sin(this.view.yaw) < 0;
    const details = G.unitDetails(u),
      id = details.mini,
      sheet = this.sheet(id);
    c.save();
    if (details.robe) c.filter = details.robe;
    c.translate(p.x, p.y);
    if (flip) c.scale(-1, 1);
    if (this.prefs.motion) {
      if (row === 2) c.translate(scale * drive[frame], 0);
      if (row === 3) c.translate(scale * recoil[frame], 0);
    }
    if (!title && u.acted && human && u.hp > 0 && !tr.clips?.some((clip) => clip.end > now))
      c.globalAlpha *= 0.82;
    if (sheet) {
      c.drawImage(
        sheet.image,
        sheet.x + frame * sheet.w,
        sheet.y + row * sheet.h,
        sheet.w,
        sheet.h,
        -w / 2,
        (-h * FOOT_Y) / CELL_HEIGHT,
        w,
        h
      );
    } else {
      const still = this.image('mini-' + id);
      if (still.complete && still.naturalWidth) {
        const ph = h * 0.78,
          pw = (ph * still.naturalWidth) / still.naturalHeight;
        // Keep the action readable if the browser rejects both sheet formats.
        if (row === 2) c.rotate(drive[frame]);
        if (row === 3) c.rotate(recoil[frame] * 1.4);
        if (row === 1) c.translate(0, -scale * stepLift[frame]);
        c.drawImage(still, -pw / 2, -ph, pw, ph);
      }
    }
    c.restore();
    const visibleHP = title ? 0 : this.healthAt(u, now);
    if (!title && visibleHP > 0) {
      if (u.hp > 0)
        this.boxes.push({
          id: u.id,
          left: left + w * 0.17,
          right: left + w * 0.84,
          top: top + h * 0.15,
          bottom: p.y
        });
      const len = clamp(scale * 0.49, 15, 34),
        y = top + h * 0.135;
      c.fillStyle = '#17241fe8';
      c.fillRect(p.x - len / 2 - 1, y - 1, len + 2, 4);
      c.fillStyle = human ? '#abe9c4' : '#ffa280';
      c.fillRect(p.x - len / 2, y, (len * visibleHP) / u.maxHp, 2);
      if (selected) {
        c.fillStyle = '#ffe0a0';
        c.beginPath();
        c.moveTo(p.x - 4, y - 9);
        c.lineTo(p.x + 4, y - 9);
        c.lineTo(p.x, y - 4);
        c.closePath();
        c.fill();
      }
      const commandRank = G.unitDetails(u).rank;
      if (commandRank) {
        const boss = commandRank === 'boss',
          bx = p.x + len / 2 + 4;
        c.fillStyle = boss ? '#6a291e' : '#473238';
        c.fillRect(bx - 1, y - 7, 13, 14);
        c.fillStyle = boss ? '#ffda8e' : '#f6c4ab';
        c.font = 'bold 10px serif';
        c.textAlign = 'center';
        c.fillText(boss ? '主' : '副', bx + 5.5, y + 3.5);
      }
      if (u.id === this.state.leader) {
        c.fillStyle = '#f5cf77';
        c.strokeStyle = '#553e24';
        c.lineWidth = 1;
        this.path([
          { x: p.x - len / 2 - 7, y: y - 4 },
          { x: p.x - len / 2 - 2, y: y - 2 },
          { x: p.x - len / 2 - 7, y: y + 1 }
        ]);
        c.fill();
        c.stroke();
      }
      const colors = {
        mark: '#fbcb8d',
        pin: '#c3dcaf',
        seal: '#d7b7e9',
        riposte: '#a9d6e9',
        poison: '#bda0ef',
        shield: '#e2c176',
        rally: '#ff9274',
        haste: '#8ee3cb',
        weak: '#ec91ae',
        exposed: '#e8a781'
      };
      const signs = {
        mark: '隙',
        pin: '縛',
        seal: '穴',
        riposte: '返',
        poison: '毒',
        shield: '護',
        rally: '振',
        haste: '疾',
        weak: '弱',
        exposed: '破'
      };
      const statuses = Object.keys(u.conditions || {});
      const size = clamp(scale * 0.235, 10, 15);
      for (const [i, kind] of statuses.entries()) {
        const px = p.x + (i - (statuses.length - 1) / 2) * (size + 1);
        c.fillStyle = '#243830';
        c.fillRect(px - size / 2, y - size - 3, size, size);
        c.fillStyle = colors[kind];
        c.font = 'bold ' + (size - 1) + 'px serif';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText(signs[kind], px, y - size / 2 - 2);
      }
    }
    c.restore();
  }
  drawEffects(now, visible) {
    const c = this.ctx;
    for (const e of this.effects) {
      if (now >= e.end) {
        if (e.kind === 'technique' && e.announced) this.onTechnique?.(e.skill, 'end');
        continue;
      }
      if (now < e.start) continue;
      const u = G.find(this.state, e.target);
      if (!u) continue;
      const f = (now - e.start) / (e.end - e.start);
      if (e.kind === 'technique') {
        if (!e.announced && visible && f >= 0.035) {
          e.announced = true;
          this.onTechnique?.(e.skill, 'gather', e.name, e.visual, e.rank);
        }
        if (!e.struck && visible && f >= 0.52) {
          e.struck = true;
          this.onTechnique?.(e.skill, 'impact', e.name, e.visual, e.rank);
        }
        const from = this.point(e.from.x, e.from.y, 0.78);
        const to = this.point(e.to.x, e.to.y, 0.76);
        if (e.flourish) {
          paintMasteryFlourish(
            c,
            e.flourish,
            this.point(e.from.x, e.from.y, 0.11),
            this.point(e.to.x, e.to.y, 0.11),
            f,
            this.scaleAt(e.to.x, e.to.y),
            !this.prefs.motion
          );
        } else
          paintSkillEffect(c, {
            id: e.visual || e.skill,
            progress: f,
            from,
            to,
            ground: this.point(e.to.x, e.to.y, 0.11),
            scale: this.scaleAt(e.to.x, e.to.y),
            reduced: !this.prefs.motion,
            facing: to.x < from.x ? -1 : 1
          });
        paintTechniqueTier(
          c,
          from,
          to,
          f,
          this.scaleAt(e.to.x, e.to.y),
          e.rank,
          e.family,
          e.visual,
          !this.prefs.motion
        );
        if (e.techniqueId)
          paintTechniqueStroke(
            c,
            e.techniqueId,
            from,
            to,
            f,
            this.scaleAt(e.to.x, e.to.y),
            !this.prefs.motion
          );
        continue;
      }
      if (!this.prefs.motion) continue;
      const pos = this.location(u, now);
      const to = this.point(pos.x, pos.y, 0.72),
        glow =
          e.kind === 'healing' ? '#bbffd0' : e.kind === 'signature-hit' ? '#ffe4a0' : '#ffc6a0';
      c.save();
      c.globalAlpha = Math.sin(Math.min(1, f * 4) * Math.PI * 0.5) * Math.min(1, (1 - f) * 4);
      if (e.kind === 'number') {
        const p = this.point(pos.x, pos.y, 1.6 + f * 0.45);
        c.textAlign = 'center';
        c.font = 'bold ' + clamp(this.height * 0.046, 16, 30) + 'px Georgia, serif';
        c.strokeStyle = '#34251e';
        c.lineWidth = 3;
        c.strokeText(e.value, p.x, p.y);
        c.fillStyle = e.value.startsWith('+') ? '#c0ffd6' : '#ffe0a8';
        c.fillText(e.value, p.x, p.y);
      } else if (e.actor) {
        const a = G.find(this.state, e.actor),
          from = this.point(a.x, a.y, 0.72),
          t = clamp(f * 2.7, 0, 1);
        c.lineWidth = 2.5;
        c.shadowBlur = 9;
        c.shadowColor = glow;
        c.strokeStyle = glow;
        c.beginPath();
        c.moveTo(
          from.x + (to.x - from.x) * Math.max(0, t - 0.46),
          from.y + (to.y - from.y) * Math.max(0, t - 0.46)
        );
        c.lineTo(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t);
        c.stroke();
        if (f > 0.27) {
          this.circle(pos.x, pos.y, 0.19 + f * 0.36, 0.29);
          c.strokeStyle = glow;
          c.lineWidth = 1.9 * (1 - f) + 0.5;
          c.stroke();
        }
      }
      c.restore();
    }
    this.effects = this.effects.filter((e) => now < e.end);
  }
  draw(realTime, title, reach, hover, covered = false) {
    this.advance(realTime, covered);
    const time = this.time;
    const c = this.ctx;
    c.clearRect(0, 0, this.width, this.height);
    this.boxes = [];
    if (!title && !this.state) return;
    if (!title) this.floor(reach, hover);
    const units = (title ? openingActors : this.state.units)
      .map((u) => {
        const p = title ? u : this.location(u, time);
        const d = this.point(p.x, p.y);
        return { u, p, z: d.z };
      })
      .sort((a, b) => b.z - a.z);
    for (const { u, p } of units) this.actor(u, p, time, title);
    if (!title) this.drawEffects(time, !covered && !this.waitingForArt);
    for (const tr of this.tracks.values()) {
      tr.clips = tr.clips.filter((clip) => clip.end > time);
      tr.impacts = tr.impacts.filter((impact) => impact.at > time);
    }
    if (!this.playing) this.settle();
  }
  body(px, py) {
    return [...this.boxes]
      .reverse()
      .find((b) => px >= b.left && px <= b.right && py >= b.top && py <= b.bottom)?.id;
  }
}

export { ActorLayer };
