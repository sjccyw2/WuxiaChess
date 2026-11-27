// Developer mode's 自動對弈 and 自動整輪: the simulated player (tools/lib/hero-policy.mjs, the same
// player the balance tool measures the game with) plays on screen, at 1×, 2× or 4× speed, for
// watching how the game is played.
//
// 自動對弈 plays the board. From wherever it stands it goes on: the story's pages, 軍情, 整備 (where
// it spends the heroes' 武學點, puts on weapons and gear from the stock and picks each hero's three
// arts, as the balance tool does before every board), 出陣, the deployment step (the leader to the
// safest post), 開戰, and then every hero turn: medicine, a walk, a strike or an art, 回身, or
// bracing; the enemy phase is the game's own. It stops when the board is decided.
//
// 自動整輪 plays the run: each board as 自動對弈 does, and between boards the story after it, 韋小寶's
// shop (his dice cups, the first cup, when he has brought them; then the medicine and kit the
// balance tool buys, one purchase at a time) and 啟程 to the next board, until the run's last page
// (or the ending film, when the last board is won). It stops there.
//
// The player is deterministic: nothing in it is random, and the enemy's code is not either. A
// board played again from its 起陣 (重試此局) is played the same way, and so is a whole run started
// again from 試局 with the same fixed seed (dev-mode.js), board for board. A tap on the board while
// it plays is ignored (app.js), so nothing but the player changes the run; a page the player opens
// meanwhile (a hero's sheet, the log) pauses it until the page is closed.
//
// Everything on screen goes through the game's own steps, handed in by app.js as `hooks`:
//   view()               { state, screen, page, deploying, playing, bowlsBusy }: what is on screen
//   command(action, id)  a step's button (scene-skip, brief-next, field-deploy, battle-begin,
//                        meet-zhou, bowl-shuffle, bowl-pick, back-shop, buy, march)
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
const PAUSE = { page: 700, prep: 1200, deploy: 600, act: 260, wait: 120, buy: 500 };
// What each kind is called, for its lines.
const NAMES = { board: '自動對弈', run: '自動整輪' };
const PREPARED = '自動整備：已分配武學點、選定招式與裝備。',
  UNCHANGED = '自動整備：無需更動。';

function loadSpeed() {
  try {
    const n = Number(localStorage.getItem(SPEED_KEY));
    return SPEEDS.includes(n) ? n : 2;
  } catch {
    return 2;
  }
}

function createAutoplay(hooks, G) {
  let kind = null, // 'board' or 'run' while it plays
    speed = loadSpeed(),
    running = null, // the loop's promise while it runs
    policy = null, // tools/lib/hero-policy.mjs, loaded on first use
    prepped = null, // the board 整備 was done for (its mark)
    shopping = { at: null, buys: 0 }, // the shop visit being made, and the purchases made in it
    dosed = { round: -1, set: new Set() }; // who has had medicine this hero phase

  const sleep = (ms) => new Promise((done) => setTimeout(done, ms / speed));
  const mark = (s) => [s.run.seed, s.run.realm, s.run.voyage, s.run.stage].join(':');
  async function load() {
    // Only developer mode loads it, and only when it is first used (about 73 kB with what it
    // measures arts with). It loads the game's own rule modules, the ones already running.
    policy ??= await import('../../../tools/lib/hero-policy.mjs');
    return policy;
  }

  // 整備: what the balance tool does before every board.
  function prepare(P, s) {
    const look = () => JSON.stringify(G.company(s).map((u) => [u.learned, u.talents, u.slots, u.weapon, u.gear]));
    const before = look();
    P.prepare(s);
    prepped = mark(s);
    hooks.prepared();
    return before !== look();
  }

  // One step from what is on screen: true to go on, 'pause' when a page of the player's is open
  // (it goes on once that is closed), 'done' when there is nothing more for it to do.
  async function step(P) {
    const v = hooks.view(),
      s = v.state,
      r = s.run,
      whole = kind === 'run';
    if (v.screen !== 'battle' || r.status === 'ended' || r.scene === 'ended') return 'done';
    if (r.status === 'battle' && s.result) {
      if (!whole) return 'done';
      await sleep(PAUSE.wait); // the game shows the result once the last blow has played
      return true;
    }
    if (r.status !== 'battle' && !whole) return 'done';
    if (v.playing) {
      await hooks.finished();
      return true;
    }
    if (v.page === 'encounter') {
      await sleep(PAUSE.page);
      hooks.command('scene-skip');
      return true;
    }
    if (v.page === 'brief' && r.scene === 'brief') {
      await sleep(PAUSE.page);
      hooks.command('brief-next');
      return true;
    }
    if (v.page === 'team' && r.scene === 'prep') {
      if (prepped !== mark(s)) {
        hooks.said(prepare(P, s) ? PREPARED : UNCHANGED);
        await sleep(PAUSE.prep);
        return true;
      }
      hooks.command('field-deploy');
      await sleep(PAUSE.deploy);
      return true;
    }
    if (whole && v.page === 'camp' && r.scene === 'shop') return shop(P, s);
    if (whole && v.page === 'bowls') return bowls(s, v);
    if (v.page) return 'pause'; // any other page is the player's (a hero's sheet, the saves…)
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
    if (r.scene !== 'fight') return 'pause';
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

  // 韋小寶's shop (自動整輪): his dice cups when he has brought them and they are not yet opened,
  // then one purchase a step, as the balance tool buys (at most twelve a visit), then 啟程.
  async function shop(P, s) {
    const visit = s.run.last?.visit;
    if (visit && visit.phase !== 'claimed') {
      await sleep(PAUSE.page);
      hooks.command('meet-zhou');
      return true;
    }
    if (shopping.at !== mark(s)) shopping = { at: mark(s), buys: 0 };
    const id = shopping.buys < 12 && P.nextBuy(s);
    if (id) {
      shopping.buys++;
      await sleep(PAUSE.buy);
      hooks.command('buy', id);
      return true;
    }
    await sleep(PAUSE.page);
    hooks.command('march');
    return true;
  }
  // The dice cups: covered and shuffled, then the first cup, as the balance tool picks; back to
  // the shop once it is open.
  async function bowls(s, v) {
    const visit = s.run.last?.visit;
    if (v.bowlsBusy) {
      await sleep(PAUSE.wait);
      return true;
    }
    await sleep(PAUSE.page);
    if (visit?.phase === 'show') hooks.command('bowl-shuffle');
    else if (visit?.phase === 'hidden') hooks.command('bowl-pick', 0);
    else hooks.command('back-shop');
    return true;
  }

  async function loop() {
    let end = 'pause';
    try {
      const P = await load();
      for (end = true; kind && end === true; ) end = await step(P);
    } catch (e) {
      end = 'error';
      hooks.said(NAMES[kind] + '出錯，已停止。');
      console.error(e);
    } finally {
      running = null;
      if (kind && end !== 'pause') {
        const s = hooks.view().state,
          ended = kind === 'run' ? '此輪已終' : '此局已分勝負';
        if (end === 'done') hooks.said(NAMES[kind] + '：' + (s.result || s.run.status === 'ended' ? ended : '已停止') + '。');
        stop();
      }
    }
  }

  function start(how) {
    kind = how;
    hooks.rate(speed);
    hooks.changed();
    kick();
  }
  function stop() {
    kind = null;
    hooks.rate(1);
    hooks.changed();
  }
  // Called whenever the board may want the player again (a page the player opened is closed).
  function kick() {
    if (kind && !running) running = loop();
  }

  return {
    get on() {
      return !!kind;
    },
    get kind() {
      return kind;
    },
    get speed() {
      return speed;
    },
    // Starts the board (how: 'board') or the run ('run'); stops whichever is playing. True if on.
    toggle(how) {
      if (kind) stop();
      else start(how);
      return !!kind;
    },
    name: (how) => NAMES[how],
    cycleSpeed() {
      speed = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
      try {
        localStorage.setItem(SPEED_KEY, String(speed));
      } catch {}
      if (kind) hooks.rate(speed);
      hooks.changed();
      return speed;
    },
    // 自動整備 alone, in 整備: the same choices, without playing.
    async prepareNow() {
      const P = await load();
      const v = hooks.view();
      if (v.page !== 'team' || v.state.run.scene !== 'prep') return false;
      hooks.said(prepare(P, v.state) ? PREPARED : UNCHANGED);
      return true;
    },
    kick,
    // The pause the enemy phase takes between pieces, at this speed.
    paced: (ms) => (kind ? ms / speed : ms)
  };
}

export { createAutoplay, SPEEDS };
