import { fieldCells } from '../data/terrain.js';
import { drawDanger } from './danger.js';
import { paintBattleMarks } from './battle-marks.js';
import { paintMasteryFlourish } from '../fx/mastery-vfx.js';
// Animated billboard art is painted after the ground. Only the ground ray can accept a move.
import * as G from '../rules/game.js';
import { art } from '../ui/artwork.js';
import { paintTechniqueStroke } from '../fx/technique-strokes.js';
import { paintTechniqueTier } from '../fx/technique-tiers.js';
import { paintSkillEffect } from '../fx/skill-effects.js';
import { paintPaintedEffect } from '../fx/painted-effects.js';
import { Impact } from '../fx/impact.js';
import { paintCursor } from './cursor.js';
import { figuresAt } from './figure-pick.js';
import { planFootwork, sampleFootwork } from './footwork.js';
import { watchArt } from './sprite-sheets.js';
import {
  paintField,
  paintReticles,
  paintFormations,
  paintFormationAim,
  paintTauntAim,
  paintSplashAim,
  reachPulse
} from './zones.js';
import {
  compactImage,
  compactSheetName,
  spriteSheet,
  sheetRow,
  STRIKE_ROW,
  SPECIAL_ROW,
  FRAMES,
  CELL_WIDTH,
  CELL_HEIGHT,
  FOOT_Y
} from './sprite-sheets.js';
import { POLISH } from '../polish.js';
import { paintFrame } from './sprite-frames.js';
import { paintBase, paintGauge } from './tokens.js';
import { spentAmount } from './spent.js';
import {
  statusWord,
  voidBlow,
  drainFlow,
  statusLook,
  heldFrame,
  paintUnder,
  paintOver,
  paintBursts
} from './status-looks.js';
import { inSplash } from '../rules/form-rules.js';
import { CONDITION_NAMES } from '../rules/battle-mastery.js';
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
// The title scene stands empty: the board is shown without fighters (producer, 2026-11-22).
const openingActors = [];
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
    this.impact = new Impact(this);
    this.reset();
  }
  image(filename) {
    if (!this.images.has(filename)) {
      const img = new Image();
      this.images.set(filename, img);
      watchArt(img); // loading: lets the title wait for its fighters (see sprite-sheets.js)
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
  // A piece whose own sheets and still have all failed to load (art not yet in game/assets) is
  // drawn with the shared rank-and-file sheet, archer or swordsman, rather than not at all.
  standIn(details) {
    const id = details.mini;
    const own = ['motion-' + id, compactSheetName(id), 'mini-' + id];
    for (const name of own) this.image(name);
    if (!own.every((name) => this.imageFailures.has(name))) return null;
    return this.sheet(details.row === 'bow' ? 'archer' : 'bandit');
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
    this.cues = [];
    this.impact.reset();
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
      // A landed blow may hold the action clock for a few frames (hit-stop). Held time is
      // only postponed: `until`, the health-bar impacts and finished() all still arrive.
      this.time += this.impact.tick(this.playing ? Math.min(dt, 40) : dt, dt);
    }
  }
  sync(state, mode, prefs, hideAim = false) {
    this.state = state;
    this.mode = mode;
    this.hideAim = hideAim;
    this.prefs = prefs;
    this.preview = null;
    this.warm(state.units.filter((u) => G.living(u) && !G.isProp(u)).map((u) => G.unitDetails(u).mini));
    // Board objects: both pictures, so the broken one is ready when it breaks.
    for (const u of G.props(state)) {
      const art = 'object-' + G.unitDetails(u).art;
      this.image(art);
      this.image(art + '-broken');
    }
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
          // Sound: a footfall on each half of every leg, on the square underfoot.
          for (const leg of legs)
            for (const [foot, at, tile] of [
              [0, 0.08, leg.from],
              [1, 0.58, leg.to]
            ])
              this.cue(start + leg.start + leg.travel * at, {
                type: 'step',
                id: u.id,
                foot,
                ground: this.ground(tile),
                walk
              });
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
    // A target that changed tile with this blow was moved by it: a hero's push, or a villain's
    // 擒拿 dragging a hero in. Its move plays at the impact, not as a walk before it.
    const pushed =
      kind === 'signature-hit' || kind === 'basic-hit' || kind === 'villain-skill'
        ? this.latestMoves.get(target.id)
        : null;
    const start = Math.max(this.tail(actor.id), this.tail(target.id, pushed));
    const blink = kind === 'blink',
      friendly = blink || kind === 'healing' || kind === 'support';
    const hostile = kind === 'villain-skill';
    const special = hostile || friendly || kind === 'signature-hit';
    const art = special ? (hostile ? G.enemyTechnique(actor) : G.artFor(actor)) : null;
    // How grand the cut-in is: 0 for a basic attack, then the art's tier. The starting art is
    // tier 0, the 根基; it presents as the least of the arts, level with a tier-1 art, so what a
    // hero begins with never looks grander than what he learns. An art with no tier counts as 2.
    const rank = art ? clamp(art.tier ?? 2, 1, 4) : 0;
    const duration = full ? [736, 980, 1240, 1540, 1860][rank] : 480;
    const hit = start + duration * 0.52;
    const contact = pushed ? pushed.path[0] : target;
    const direction = [contact.x - origin.x, contact.y - origin.y];
    // A villain's signature and every art a hero uses (a strike, a mend, a formation, a
    // glide) play the special pose; a plain blow, and the counter to it, play the strike.
    this.addClip(actor.id, {
      row: special ? SPECIAL_ROW : STRIKE_ROW,
      start,
      end: start + duration,
      direction,
      ...(blink ? { blinkFrom: origin, blinkAt: hit } : {})
    });
    let end = start + duration;
    if (!friendly) {
      const hurtEnd = hit + (full ? 535 : 420);
      // statusLooks: 金剛 stands unmoved under the blow.
      if (!(POLISH.statusLooks && G.immuneTo(target)))
        this.addClip(target.id, { row: 3, start: hit, end: hurtEnd });
      end = Math.max(end, hurtEnd);
      if (pushed) {
        this.cue(hit, { type: 'skid', id: target.id });
        pushed.knockback = true;
        // A drag may cover more than one tile: it slides straight from where the piece stood.
        pushed.path = [pushed.path[0], pushed.path.at(-1)];
        pushed.start = hit;
        pushed.end = hit + (full ? (hostile ? 380 : 265) : 105);
        this.hold(pushed.end);
      }
      if (target.hp <= 0) {
        this.track(target.id).exit = hurtEnd + (full ? 210 : 60);
        this.hold(this.track(target.id).exit);
      }
    }
    this.exchange = { actor: actor.id, target: target.id, start, hit, end, rank };
    if (rank >= 3) this.impact.prepare(actor);
    if (!special) this.cue(hit - (full ? 150 : 110), { type: 'swing', id: actor.id });
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
    // The last blow against a piece that has fallen is the killing blow.
    const lastBlow = new Map();
    const lanes = new Map();
    const words = new Map();
    for (const [index, [id, value, reason]] of items.entries())
      if (value.startsWith('−') && reason !== 'sacrifice') lastBlow.set(id, index);
    for (const [index, [id, value, reason]] of items.entries()) {
      let start = (exchange?.hit ?? this.time) + index * (full ? 105 : 32);
      const counter =
        exchange && id === exchange.actor && value.startsWith('−') && reason !== 'sacrifice';
      if (counter) {
        const reply = exchange.end + (full ? 35 : 15);
        const initiator = G.find(this.state, exchange.target),
          recipient = G.find(this.state, id);
        const direction = [recipient.x - initiator.x, recipient.y - initiator.y];
        this.addClip(initiator.id, {
          row: STRIKE_ROW,
          start: reply,
          end: reply + (full ? 680 : 440),
          direction
        });
        start = reply + (full ? 345 : 220);
        this.cue(start - (full ? 150 : 110), { type: 'swing', id: initiator.id });
        const end = start + (full ? 504 : 400);
        if (!(POLISH.statusLooks && G.immuneTo(recipient))) this.addClip(id, { row: 3, start, end });
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
        if (!(POLISH.statusLooks && G.immuneTo(G.find(this.state, id))))
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
      const struck = G.find(this.state, id),
        hurt = !!struck && amount < 0 && reason !== 'sacrifice',
        kill = hurt && struck.hp <= 0 && lastBlow.get(id) === index,
        rank = counter ? 0 : exchange?.rank || 0;
      // Sound: what this number sounds like, when it lands.
      if (hurt)
        this.cue(start, {
          type: 'blow',
          id,
          ratio: -amount / struck.maxHp,
          rank,
          kill,
          counter,
          lead: counter || index === 0
        });
      else if (value.startsWith('−'))
        this.cue(start, { type: reason === 'sacrifice' ? 'cost' : 'block', id });
      else if (value.startsWith('+')) this.cue(start, { type: 'mend', id });
      else if (struck)
        this.cue(start, {
          type: 'status',
          id,
          friendly: struck.side === G.find(this.state, exchange?.actor)?.side
        });
      // Hit-stop, flash and shake are released when the action clock reaches this blow.
      if (hurt)
        this.impact.blow({
          at: start,
          target: id,
          from: counter ? exchange.target : exchange?.actor,
          amount: -amount,
          rank,
          lead: counter || index === 0,
          kill
        });
      // statusLooks: a status word starts its look as it pops; a blow 金剛 voided says 無功, not
      // −0; a 吸元 draws its health over from the piece struck.
      statusWord(this, id, value, start);
      const voided = POLISH.statusLooks && value === '−0' && G.immuneTo(struck);
      if (voided) voidBlow(this, id, start);
      if (
        POLISH.statusLooks &&
        exchange &&
        value.startsWith('+') &&
        id === exchange.actor &&
        exchange.target !== id &&
        struck?.activeArt &&
        G.drainOf(G.artFor(struck))
      )
        drainFlow(this, exchange.target, id, start - (full ? 260 : 60));
      // statusLooks: two states laid by one blow (截勁 and 閉穴) share one word, not one spot.
      const word = POLISH.statusLooks && full && reason === 'status' && words.get(id);
      if (word) {
        word.value += '・' + value;
        continue;
      }
      if (full) {
        const shown = voided ? '無功' : value;
        const number = { kind: 'number', target: id, value: shown, start, end: start + 800 };
        if (reason === 'status') words.set(id, number);
        if (POLISH.damagePop) {
          number.tone = this.impact.tone(
            shown,
            reason,
            hurt ? -amount / struck.maxHp : 0,
            rank,
            kill
          );
          number.lane = lanes.get(id) || 0;
          if (number.tone !== 'word') lanes.set(id, number.lane + 1);
          number.end = start + 1100;
        }
        this.effects.push(number);
      }
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
      boss = G.find(s, G.commanderId(s));
    if (!guards.length || !G.living(boss)) return;
    const c = this.ctx,
      center = this.location(boss, this.time);
    const phase = this.prefs.motion ? this.time / 1700 : 0.37;
    c.save();
    for (const [i, guard] of guards.entries()) {
      const from = this.location(guard, this.time);
      // A star post's rope leaves from the knot on the post as drawn (object(), the frame before);
      // the path is eased from there onto the arc a piece's rope takes from its waist.
      const knot = G.isProp(guard) ? this.knots?.get(guard.id) : null,
        waist = knot && this.point(from.x, from.y, 0.24);
      const star = (t) => {
        const q = this.point(
          from.x + (center.x - from.x) * t,
          from.y + (center.y - from.y) * t,
          0.24 + Math.sin(Math.PI * t) * 0.38
        );
        if (!knot) return q;
        const k = (1 - t) * (1 - t);
        return { ...q, x: q.x + (knot.x - waist.x) * k, y: q.y + (knot.y - waist.y) * k };
      };
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
      cast = ['attack', 'skill'].includes(this.mode) && can && !this.hideAim;
    drawDanger(this); // Polish (dangerZone): the enemy's strike zone, under everything else
    const art = cast && this.mode === 'skill' ? G.artFor(u) : null;
    const range = cast ? (art ? art.range : u.range) : 0;
    const ground = !!art && G.targetType(art) === 'ground';
    const heal = art && (G.isSupport(art) || ground);
    const canBlink = ground && G.canPay(s, u);
    // rangeTiles: zones.js paints the grid and the regions (one outer edge, a strike fringe)
    // and answers true; the tile-by-tile loop below then has nothing left to do.
    const zoned = paintField(this, reach, this.time);
    for (const { x, y } of zoned ? [] : fieldCells(s.mapIndex)) {
      const walk =
        ((this.mode === 'move' && can && !u.moved) || (this.mode === 'glide' && G.canGlide(s, u))) &&
        reach.has(G.key(x, y));
      const aim =
        cast &&
        G.distance(u, { x, y }) <= range &&
        G.walkable(x, y, s.mapIndex) &&
        (!ground || (canBlink && !G.at(s, x, y)));
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
      // The reach pulse (zones.js), tile by tile: the answer to a tap on an enemy out of reach.
      const pulse = aim ? reachPulse(this) : 0;
      if (pulse) {
        c.strokeStyle = 'rgba(255,243,230,' + (0.35 + 0.65 * pulse).toFixed(3) + ')';
        c.lineWidth = 1.15 + 2.2 * pulse;
        c.stroke();
      }
      if (this.prefs.grid && G.cover(x, y, s.mapIndex)) {
        const p = this.point(x - 0.32, y + 0.29);
        c.fillStyle = '#495f4d';
        c.font = 'bold ' + Math.max(8, this.height * 0.017) + 'px serif';
        c.fillText('◇', p.x, p.y);
      }
    }
    // 布陣: the formations laid on the board, over the regions and under the pieces; while a
    // formation art is aimed, the tiles it would cover.
    paintFormations(this, this.time);
    paintFormationAim(this, this.formationAim(s, u, art, hover), this.time);
    paintTauntAim(this, this.tauntAim(s, u, art, hover), this.time);
    paintSplashAim(this, this.splashAim(s, u, art, hover), this.time);
    // The deployment step's posts, reinforcements' entry tiles and the secondary's line.
    paintBattleMarks(this);
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
    // tileCursor: cursor.js paints animated brackets and answers true.
    if (hover && !paintCursor(this, hover, this.time)) {
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
      ((this.mode === 'move' && can && !u.moved) || (this.mode === 'glide' && G.canGlide(s, u))) &&
      reach.has(G.key(hover.x, hover.y))
    ) {
      if (this.preview?.x !== hover.x || this.preview?.y !== hover.y)
        this.preview = { ...hover, path: G.movementPath(s, u, u, hover) };
      this.drawRoute(this.preview.path, true);
    }
    // rangeTiles: a reticle on every piece the pending strike or art can be used on.
    paintReticles(this, reach, hover, this.time);
  }
  // Where a 布陣 art being aimed would lay its formation: the tile under the pointer, or the
  // target of the preview the player has open (`aim`, set by the app).
  formationAim(s, u, art, hover) {
    if (!art?.zone) return null;
    const aim = this.aim ? (this.aim.id ? G.find(s, this.aim.id) : this.aim) : hover;
    if (!aim) return null;
    const spot = G.targetType(art) === 'ground' ? { x: aim.x, y: aim.y } : G.at(s, aim.x, aim.y);
    return spot && G.targetOK(s, u, spot, true) ? G.zoneTiles(s, spot) : null;
  }
  // 濺射 with reach: the tiles a splash reaching 2 or 3 tiles would catch, round the piece aimed at (the
  // preview open, else the one under the pointer), from where the forecast puts the impact.
  splashAim(s, u, art, hover) {
    if (!art?.splash || !(art.radius > 1)) return null;
    const aim = this.aim?.id ? G.find(s, this.aim.id) : hover && G.at(s, hover.x, hover.y);
    if (!aim || !G.targetOK(s, u, aim, true)) return null;
    const f = G.forecast(u, aim, true, s),
      center = f.push || aim;
    return fieldCells(s.mapIndex).filter(
      (p) => inSplash(art, center, p) && G.walkable(p.x, p.y, s.mapIndex)
    );
  }
  // 挑釁 (SPEC-mechanics §6): the radius is counted from where the hero stands when the art
  // resolves: his own tile, or for an art that carries him to the ground, the tile aimed at.
  tauntAim(s, u, art, hover) {
    if (!art?.taunt) return null;
    let from = u;
    if (G.targetType(art) === 'ground' && art.blink) {
      const aim = this.aim && !this.aim.id ? this.aim : hover;
      if (!aim || !G.targetOK(s, u, { x: aim.x, y: aim.y }, true)) return null;
      from = aim;
    }
    return fieldCells(s.mapIndex).filter(
      (p) => G.distance(p, from) <= art.taunt && G.walkable(p.x, p.y, s.mapIndex)
    );
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
  // A board object (G.isProp): its painted picture standing on its tile, the broken one once it
  // has broken; a gauge and a mark saying whose it is (守 ours, 破 to break) while it stands. It
  // shakes while a blow lands, and never fades: a broken thing stays on the board.
  object(u, pos, now) {
    const c = this.ctx,
      p = this.point(pos.x, pos.y),
      scale = this.scaleAt(pos.x, pos.y);
    if (!scale) return;
    const d = G.unitDetails(u),
      keep = G.propKind(u) === 'keep',
      shown = this.healthAt(u, now),
      broken = shown <= 0;
    const tr = this.tracks.get(u.id) || {};
    const hurt = (tr.clips || []).find((clip) => clip.row === 3 && now >= clip.start && now < clip.end);
    const shake = hurt && this.prefs.motion ? Math.sin((now - hurt.start) / 22) * scale * 0.035 * (1 - (now - hurt.start) / (hurt.end - hurt.start)) : 0;
    c.save();
    // Its shadow, and a ring in the colour of the side it belongs to.
    this.circle(pos.x + 0.05, pos.y + 0.035, 0.38, 0.094);
    c.fillStyle = 'rgba(27,32,25,.34)';
    c.fill();
    if (!broken) {
      this.circle(pos.x, pos.y, 0.36, 0.099);
      c.strokeStyle = keep ? '#b7ebc4cc' : '#f2ac86cc';
      c.lineWidth = 1.6;
      c.setLineDash([4, 3]);
      c.stroke();
      c.setLineDash([]);
    }
    const img = this.image('object-' + d.art + (broken ? '-broken' : ''));
    let top = p.y - scale;
    if (img.complete && img.naturalWidth) {
      // Its height a share of a fighter's, and never wider than about a tile and a half.
      let h = scale * 1.68 * (d.size || 0.8),
        w = (h * img.naturalWidth) / img.naturalHeight;
      const most = scale * 1.6;
      if (w > most) {
        h *= most / w;
        w = most;
      }
      top = p.y - h * 0.93;
      c.drawImage(img, p.x - w / 2 + shake, top, w, h);
      // Where a rope tied to it starts (drawWard): the knot, a little above the middle.
      (this.knots ??= new Map()).set(u.id, { x: p.x, y: top + h * 0.36 });
      if (!broken)
        this.boxes.push({ id: u.id, left: p.x - w / 2, right: p.x + w / 2, top: top + h * 0.1, bottom: p.y + scale * 0.08 });
    }
    if (!broken) {
      const len = clamp(scale * 0.62, 20, 42),
        y = top - 5;
      c.fillStyle = '#17241fe8';
      c.fillRect(p.x - len / 2 - 1, y - 1, len + 2, 5);
      c.fillStyle = keep ? '#abe9c4' : '#ffa280';
      c.fillRect(p.x - len / 2, y, (len * shown) / u.maxHp, 3);
      const bx = p.x + len / 2 + 4;
      c.fillStyle = keep ? '#254b41' : '#6a291e';
      c.fillRect(bx - 1, y - 6, 13, 14);
      c.fillStyle = keep ? '#d8f5df' : '#ffda8e';
      c.font = 'bold 10px serif';
      c.textAlign = 'center';
      c.textBaseline = 'alphabetic';
      c.fillText(keep ? '守' : '破', bx + 5.5, y + 4.5);
    }
    c.restore();
  }
  actor(u, pos, now, title) {
    if (G.isProp(u)) {
      if (!title) this.object(u, pos, now);
      return;
    }
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
    // unitTokens: the team base, the outlined sprite and the gauge are painted by tokens.js
    // and sprite-frames.js in place of the plain shadow, disc, sprite and bar below.
    const tokens = POLISH.unitTokens && !title;
    // A hero who has acted and is standing still. actedDim draws it grey for the rest of
    // the player's turn (`grey` runs 0 to 1 as it fades); without the switch it is faint.
    const spent =
      !title && u.acted && human && u.hp > 0 && !tr.clips?.some((clip) => clip.end > now);
    const grey =
      POLISH.actedDim && !title
        ? spentAmount(this, u, spent && this.state.phase === 'ally', now)
        : 0;
    // statusLooks: what 定身, 閉穴, 受制 and 金剛 look like on this piece now (null for none).
    const look = title ? null : statusLook(this, u, now),
      turned = !!look?.charm;
    if (tokens) paintBase(this, u, pos, now, { human, selected, spent: grey > 0.5, turned });
    else this.circle(pos.x + 0.055, pos.y + 0.035, title ? 0.25 : 0.33, 0.094);
    c.fillStyle = 'rgba(27,32,25,.32)';
    if (!tokens) c.fill();
    if (!title && !tokens) {
      this.circle(pos.x, pos.y, 0.308, 0.099);
      c.fillStyle = human ? '#254b41bb' : turned ? '#5a6420bb' : '#692e25bb';
      c.fill();
      c.strokeStyle = selected ? '#ffe1a0' : human ? '#b7ebc4' : turned ? '#e4ef8a' : '#f2ac86';
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
    paintUnder(this, u, pos, now, look);
    // 定身: with no blow to play, the figure stays on the frame it was caught on.
    if (look?.freeze && !clip) {
      row = 0;
      frame = heldFrame(this, u, frame);
    }
    if (title) dir = u.id === 'hero' ? [1, -0.5] : [-1, 0.6];
    const flip = dir[0] * Math.cos(this.view.yaw) - dir[1] * Math.sin(this.view.yaw) < 0;
    const details = G.unitDetails(u),
      id = details.mini,
      sheet = this.sheet(id) || this.standIn(details);
    // A sheet without the special pose, and the still, play the strike in its place.
    row = sheet ? sheetRow(sheet, row) : row === SPECIAL_ROW ? STRIKE_ROW : row;
    const striking = row === STRIKE_ROW || row === SPECIAL_ROW;
    c.save();
    // The cached copy of a frame already carries the robe tint, so with unitTokens no
    // canvas filter is set while painting.
    const cached = sheet && (tokens || grey > 0 || !!look?.freeze || !!look?.immune);
    if (details.robe && !tokens && !cached) c.filter = details.robe;
    c.translate(p.x, p.y);
    if (flip) c.scale(-1, 1);
    if (this.prefs.motion) {
      if (striking) c.translate(scale * drive[frame], 0);
      if (row === 3) c.translate(scale * recoil[frame], 0);
    }
    if (spent && !POLISH.actedDim) c.globalAlpha *= 0.82;
    if (cached) {
      const copy = {
        robe: details.robe,
        team: tokens ? (turned ? 'turned' : u.side) : null,
        finish: look?.freeze ? 'frost' : null
      };
      if (grey < 1) paintFrame(this, sheet, row, frame, w, h, copy);
      // The grey copy is laid over the coloured one while the fade runs.
      if (grey > 0) paintFrame(this, sheet, row, frame, w, h, { ...copy, grey: true }, grey);
      // 金剛: a gold copy of the figure, added over it, comes and goes.
      if (look?.immune) {
        c.globalCompositeOperation = 'lighter';
        const sheen = this.prefs.motion ? 0.34 + 0.18 * Math.sin(now / 320) : 0.4;
        paintFrame(this, sheet, row, frame, w, h, { robe: details.robe, team: null, finish: 'gold' }, sheen);
        c.globalCompositeOperation = 'source-over';
      }
      // Combat feel: the hit flash and the defeat break-up, over the cached frame as well.
      if (!title) this.impact.sprite(c, u, pos, sheet, frame, row, w, h, flip);
    } else if (sheet) {
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
      // Combat feel: fx/impact.js paints over the sprite it has just drawn.
      if (!title) this.impact.sprite(c, u, pos, sheet, frame, row, w, h, flip);
    } else {
      const still = this.image('mini-' + id);
      if (still.complete && still.naturalWidth) {
        const ph = h * 0.78,
          pw = (ph * still.naturalWidth) / still.naturalHeight;
        // Keep the action readable if the browser rejects both sheet formats.
        if (striking) c.rotate(drive[frame]);
        if (row === 3) c.rotate(recoil[frame] * 1.4);
        if (row === 1) c.translate(0, -scale * stepLift[frame]);
        c.drawImage(still, -pw / 2, -ph, pw, ph);
      }
    }
    c.restore();
    paintOver(this, u, p, scale, h, now, look);
    const visibleHP = title ? 0 : this.healthAt(u, now);
    if (!title && visibleHP > 0) {
      if (u.hp > 0)
        this.boxes.push({
          id: u.id,
          left: left + w * 0.17,
          right: left + w * 0.84,
          top: top + h * 0.15,
          bottom: p.y,
          // The figure as drawn, for a tap on it (figure-pick.js): the frame showing, where its
          // cell stands, and the gauge over its head.
          x: p.x,
          y: p.y,
          w,
          h,
          flip,
          sheet,
          row,
          frame,
          bar: { y: top + h * 0.135, half: scale * 0.34 }
        });
      if (tokens) {
        paintGauge(this, u, {
          x: p.x,
          y: top + h * 0.135,
          scale,
          now,
          human,
          turned,
          selected,
          shown: visibleHP,
          spent: grey > 0.5,
          rank: details.rank,
          leader: u.id === this.state.leader,
          formation: !!this.state.zones?.some((z) => z.owner === u.id)
        });
        c.restore();
        return;
      }
      const len = clamp(scale * 0.49, 15, 34),
        y = top + h * 0.135;
      c.fillStyle = '#17241fe8';
      c.fillRect(p.x - len / 2 - 1, y - 1, len + 2, 4);
      c.fillStyle = human ? '#abe9c4' : turned ? '#d6e27a' : '#ffa280';
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
        exposed: '#e8a781',
        cover: '#9fc6e8',
        redirect: '#b9a6e6',
        evade: '#c9ecf5',
        taunt: '#f2a07a',
        wound: '#d9796a',
        formation: '#ffd98c'
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
        exposed: '破',
        cover: '代',
        redirect: '挪',
        evade: '閃',
        taunt: '挑',
        wound: '傷',
        formation: '陣'
      };
      const statuses = [
        ...Object.keys(u.conditions || {}),
        ...(this.state.zones?.some((z) => z.owner === u.id) ? ['formation'] : [])
      ];
      const size = clamp(scale * 0.235, 10, 15);
      for (const [i, kind] of statuses.entries()) {
        const px = p.x + (i - (statuses.length - 1) / 2) * (size + 1);
        c.fillStyle = '#243830';
        c.fillRect(px - size / 2, y - size - 3, size, size);
        c.fillStyle = colors[kind] || '#e9dcc0';
        c.font = 'bold ' + (size - 1) + 'px serif';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText(signs[kind] || CONDITION_NAMES[kind]?.[0] || '', px, y - size / 2 - 2);
      }
    }
    c.restore();
  }
  drawEffects(now, visible) {
    const c = this.ctx;
    this.impact.paintSparks(c);
    for (const e of this.effects) {
      if (now >= e.end) {
        if (e.kind === 'technique' && e.announced) {
          this.onTechnique?.(e.skill, 'end');
          this.impact.conclude(e);
        }
        continue;
      }
      if (now < e.start) continue;
      const u = G.find(this.state, e.target);
      if (!u) continue;
      const f = (now - e.start) / (e.end - e.start);
      if (e.kind === 'technique') {
        if (!e.announced && visible && f >= 0.035) {
          e.announced = true;
          this.onTechnique?.(e.skill, 'gather', e.name, e.visual, e.rank, e.flourish);
          this.impact.herald(e);
        }
        if (!e.struck && visible && f >= 0.52) {
          e.struck = true;
          this.onTechnique?.(e.skill, 'impact', e.name, e.visual, e.rank, e.flourish);
          this.impact.conclude(e, 250);
        }
        const from = this.point(e.from.x, e.from.y, 0.78);
        const to = this.point(e.to.x, e.to.y, 0.76);
        // A famous art with a hand-painted sheet draws it in place of the ink effect and stroke.
        if (paintPaintedEffect(c, e, now, from, to, this.scaleAt(e.to.x, e.to.y), !this.prefs.motion))
          continue;
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
      if (e.kind === 'burst') {
        this.impact.burst(c, e, now);
        continue;
      }
      if (e.tone) {
        this.impact.number(c, e, u);
        continue;
      }
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
    // A restyled number lives on the unheld clock and says itself when it is done.
    this.effects = this.effects.filter((e) => (e.tone && e.born != null ? !e.done : now < e.end));
  }
  draw(realTime, title, reach, hover, covered = false) {
    this.advance(realTime, covered);
    if (!title && this.state && !covered && !this.waitingForArt) {
      this.impact.land(this.time);
      this.releaseCues();
    }
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
    if (!title) paintBursts(this, time); // statusLooks: a state starting, ending, a blow voided
    for (const tr of this.tracks.values()) {
      tr.clips = tr.clips.filter((clip) => clip.end > time);
      tr.impacts = tr.impacts.filter((impact) => impact.at > time);
    }
    if (!this.playing) this.settle();
  }
  // ---- sound cues: timed events handed to onCue when the action clock reaches them ----
  cue(at, data) {
    if (this.onCue) this.cues.push({ at, ...data });
  }
  ground(tile) {
    return fieldCells(this.state.mapIndex).find((c) => c.x === tile.x && c.y === tile.y)?.kind;
  }
  releaseCues() {
    if (!this.onCue) return;
    const now = this.time,
      due = this.cues.filter((c) => c.at <= now);
    if (due.length) this.cues = this.cues.filter((c) => c.at > now);
    // A piece is defeated when its ink starts to scatter (see fx/impact.js).
    for (const [id, track] of this.tracks)
      if (track.exit && !track.fell && now >= track.exit - 200) {
        const u = G.find(this.state, id);
        if (u && u.hp <= 0) {
          track.fell = true;
          due.push({ type: 'fall', id, ally: u.side === 'ally' });
        }
      }
    for (const c of due) {
      // A walk turned into a knockback has no footfalls; a cue far behind is dropped.
      if (c.walk?.knockback || now - (c.at ?? now) > 600) continue;
      const u = G.find(this.state, c.id),
        at = u && this.location(u, now),
        p = at && this.point(at.x, at.y);
      const pan = p ? clamp((p.x / this.width) * 2 - 1, -1, 1) * 0.55 : 0;
      try {
        this.onCue({ ...c, walk: undefined, pan });
      } catch {}
    }
  }
  // The pieces whose drawn figure a tap is on or within `slack` pixels of, nearest first.
  figures(px, py, slack) {
    return figuresAt(this.boxes, px, py, slack);
  }
}

export { ActorLayer };
