// Developer mode's 自動對弈: the simulated player (tools/lib/hero-policy.mjs, the same player the
// balance tool measures the game with) plays the board on screen, at 1×, 2× or 4× speed, for
// watching how a board is played.
//
// From wherever the board stands it goes on: the story's pages, 軍情, 整備 (where it spends the
// heroes' 武學點, puts on weapons and gear from the stock and picks each hero's three arts, as the
// balance tool does before every board), 出陣, the deployment step (the leader to the safest post),
// 開戰, and then every hero turn: medicine, a walk, a strike or an art, 回身, or bracing; the enemy
// phase is the game's own. It stops when the board is decided, or when it is turned off.
//
// The player is deterministic: nothing in it is random, and the enemy's code is not either, so the
// same board from the same 起陣 (重試此局) is played the same way every time. A tap on the board
// while it plays is ignored (app.js), so nothing but the player changes the board.
//
// Everything on screen goes through the game's own steps, handed in by app.js as `hooks`:
//   view()               { state, screen, page, deploying, playing }: what is on screen now
//   command(action)      a run step's button (scene-skip, brief-next, field-deploy, battle-begin)
//   swap(from, to)       two starting posts swapped, as a tap does
//   select(id)           a hero chosen, as a tap does
//   walk(u, x, y)        the hero walks there (true if he did)
//   strike(u, t, skill)  the blow or the art, with its effects, numbers and tips (true if struck)
//   brace(u)             the hero braces (waits)
//   glide(u, p)          回身: walks on to p, or stays (p null)
//   consume(s, u, id)    medicine taken, with its sound and line
//   endTurn()            the enemy phase begins
//   finished()           resolves when the board's motion has played out
//   prepared()           after 整備's choices: the panels redrawn
//   rate(n)              the board's motion at n times its speed
//   said(text)           a line for the player
//   changed()            the dev window's buttons redrawn
const SPEEDS = [1, 2, 4];
const SPEED_KEY = 'jianying.dev-auto-speed.v1';
// Pauses between steps at 1×, in milliseconds (divided by the speed).
const PAUSE = { page: 700, prep: 1200, deploy: 600, act: 260, wait: 120 };

function loadSpeed() {
  try {
    const n = Number(localStorage.getItem(SPEED_KEY));
    return SPEEDS.includes(n) ? n : 2;
  } catch {
    return 2;
  }
}

function createAutoplay(hooks, G) {
  let on = false,
    speed = loadSpeed(),
    running = null, // the loop's promise while it runs
    policy = null, // tools/lib/hero-policy.mjs, loaded on first use
    prepped = null, // the board 整備 was done for (its mark)
    dosed = { round: -1, set: new Set() }; // who has had medicine this hero phase

  const sleep = (ms) => new Promise((done) => setTimeout(done, ms / speed));
  const mark = (s) => [s.run.seed, s.run.realm, s.run.voyage, s.run.stage].join(':');
  async function load() {
    // Only developer mode loads it, and only when 自動對弈 is first used (about 73 kB with what it
    // measures arts with). It loads the game's own rule modules, the ones already running.
    policy ??= await import('../../../tools/lib/hero-policy.mjs');
    return policy;
  }

  // 整備: what the balance tool does before every board.
  function prepare(P, s) {
    const before = JSON.stringify(G.company(s).map((u) => [u.learned, u.talents, u.slots, u.weapon, u.gear]));
    P.prepare(s);
    const after = JSON.stringify(G.company(s).map((u) => [u.learned, u.talents, u.slots, u.weapon, u.gear]));
    prepped = mark(s);
    hooks.prepared();
    return before !== after;
  }

  // One step from what is on screen; false when there is nothing for it to do.
  async function step(P) {
    const v = hooks.view(),
      s = v.state;
    if (v.screen !== 'battle' || s.run.status !== 'battle') return false;
    if (s.result) return false;
    if (v.playing) {
      await hooks.finished();
      return true;
    }
    if (v.page === 'encounter') {
      await sleep(PAUSE.page);
      hooks.command('scene-skip');
      return true;
    }
    if (v.page === 'brief' && s.run.scene === 'brief') {
      await sleep(PAUSE.page);
      hooks.command('brief-next');
      return true;
    }
    if (v.page === 'team' && s.run.scene === 'prep') {
      if (prepped !== mark(s)) {
        hooks.said(prepare(P, s) ? '自動整備：已分配武學點、選定招式與裝備。' : '自動整備：無需更動。');
        await sleep(PAUSE.prep);
        return true;
      }
      hooks.command('field-deploy');
      await sleep(PAUSE.deploy);
      return true;
    }
    if (v.page) return false; // any other page is the player's (a hero's sheet, the saves…)
    if (v.deploying) {
      const { from, to } = P.deployPost(s);
      if (from >= 0 && to !== from) {
        hooks.swap(from, to);
        await sleep(PAUSE.deploy);
      }
      hooks.command('battle-begin');
      await sleep(PAUSE.deploy);
      return true;
    }
    if (s.run.scene !== 'fight') return false;
    if (s.phase !== 'ally') {
      await sleep(PAUSE.wait); // the enemy phase is the game's own; wait for it to hand back
      return true;
    }
    if (dosed.round !== s.round) dosed = { round: s.round, set: new Set() };
    const pick = P.pickAction(s, dosed.set, hooks.consume);
    if (!pick) {
      await sleep(PAUSE.act);
      hooks.endTurn();
      return true;
    }
    await act(P, s, pick);
    return true;
  }

  // One hero's action, as the player would make it: chosen, a walk, then the blow, art or brace.
  async function act(P, s, o) {
    const u = o.u;
    hooks.select(u.id);
    await sleep(PAUSE.act);
    let ok = true;
    if (o.P.x !== u.x || o.P.y !== u.y) {
      ok = hooks.walk(u, o.P.x, o.P.y);
      await hooks.finished();
      if (ok) await sleep(PAUSE.act);
    }
    if (ok && o.act === 'wait') ok = hooks.brace(u);
    else if (ok && o.act === 'basic') ok = hooks.strike(u, o.t, false);
    else if (ok && o.act === 'art') ok = hooks.strike(u, o.t, true, o.id);
    await hooks.finished();
    if (s.result) return;
    // 回身: the walk left after the strike, or none.
    if (ok && G.canGlide(s, u)) hooks.glide(u, P.glideSpot(s, u));
    // A choice the rules refused (none should be) must not be tried for ever.
    if (!ok && G.canAct(s, u)) hooks.brace(u);
  }

  async function loop() {
    try {
      const P = await load();
      while (on && (await step(P)));
    } catch (e) {
      hooks.said('自動對弈出錯，已停止。');
      console.error(e);
    } finally {
      running = null;
      const v = hooks.view();
      if (on && (v.state.result || v.screen !== 'battle' || v.state.run.status !== 'battle')) {
        stop();
        if (v.state.result) hooks.said('自動對弈：此局已分勝負。');
      }
    }
  }

  function start() {
    on = true;
    hooks.rate(speed);
    hooks.changed();
    kick();
  }
  function stop() {
    on = false;
    hooks.rate(1);
    hooks.changed();
  }
  // Called whenever the board may want the player again (a round handed back, a page shown).
  function kick() {
    if (on && !running) running = loop();
  }

  return {
    get on() {
      return on;
    },
    get speed() {
      return speed;
    },
    toggle() {
      if (on) stop();
      else start();
      return on;
    },
    cycleSpeed() {
      speed = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
      try {
        localStorage.setItem(SPEED_KEY, String(speed));
      } catch {}
      if (on) hooks.rate(speed);
      hooks.changed();
      return speed;
    },
    // 自動整備 alone, in 整備: the same choices, without playing.
    async prepareNow() {
      const P = await load();
      const v = hooks.view();
      if (v.page !== 'team' || v.state.run.scene !== 'prep') return false;
      hooks.said(prepare(P, v.state) ? '自動整備：已分配武學點、選定招式與裝備。' : '自動整備：無需更動。');
      return true;
    },
    kick,
    // The pause the enemy phase takes between pieces, at this speed.
    paced: (ms) => (on ? ms / speed : ms)
  };
}

export { createAutoplay, SPEEDS };
