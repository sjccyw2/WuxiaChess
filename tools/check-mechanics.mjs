// Checks the redesign's new mechanics against SPEC-mechanics.md, on small game states built with
// the real rules: what each condition does from the moment it is applied until it is gone, each
// conditional bonus on and off, each use restriction allowing and refusing, saves from before the
// redesign, and villains built from their traits.
//
//   node tools/check-mechanics.mjs
//
// Prints one line per check and exits 1 if any fails. Each mechanic has its own block below the
// helpers; a new mechanic adds a block. Test arts are put into the catalogue in memory only.
const root = new URL('../game/src/', import.meta.url);
const load = (file) => import(new URL(file, root));
const G = await load('rules/game.js');
const R = await load('rules/journey.js');
const BM = await load('rules/battle-mastery.js');
const FR = await load('rules/form-rules.js');
const { TECHNIQUES, MANUAL_PRICES } = await load('data/martial-arts.js');

// ── Helpers ──────────────────────────────────────────────────────────────
let failures = 0;
function check(name, ok, detail = '') {
  console.log((ok ? 'ok    ' : 'FAIL  ') + name + (!ok && detail !== '' ? '  (' + detail + ')' : ''));
  if (!ok) failures++;
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function section(title) {
  console.log('\n── ' + title);
}
const copy = (value) => JSON.parse(JSON.stringify(value));

// Board 0 of a fresh run, in the fight, with these heroes (the first leads). Every unit starts
// parked in the far corner, out of everyone's reach; a check puts the pieces it needs on the
// open ground of rows 3 and 7 (x 3–8) with `put`.
const PARKING = [
  [2, 0],
  [3, 0],
  [0, 2],
  [0, 3],
  [0, 4],
  [1, 4],
  [0, 7]
];
function board(ids = ['hero', 'medic', 'guard'], seed = 7) {
  const s = R.startRun(R.drawLots(seed), R.LEGACY);
  const heroes = ids.map((id) =>
    Object.assign(G.startingHero(id), {
      learned: [],
      guides: [],
      mastery: BM.blankRecord(),
      slots: ['signature', null, null],
      activeArt: 'signature'
    })
  );
  s.units = [...heroes, ...G.enemies(s)];
  s.leader = s.selected = ids[0];
  s.run.next = [...ids];
  s.run.pool = G.PARTY.filter((id) => !ids.includes(id));
  s.run.scene = 'fight';
  s.run.formationOpen = false;
  s.units.forEach((u, i) => Object.assign(u, { x: PARKING[i][0], y: PARKING[i][1] }));
  return s;
}
const unit = (s, id) => G.find(s, id);
function put(s, id, x, y) {
  const u = unit(s, id);
  if (!G.walkable(x, y, s.mapIndex) || (G.at(s, x, y) && G.at(s, x, y) !== u))
    throw new Error('cannot put ' + id + ' at ' + x + ',' + y);
  u.x = x;
  u.y = y;
  return u;
}
// A throwaway art in the catalogue, taught to the hero and made his active art.
let artSerial = 0;
function defineArt(fields = {}) {
  const id = 'testArt' + ++artSerial;
  TECHNIQUES[id] = {
    name: '試招' + artSerial,
    kind: 'active',
    tier: 1,
    points: 1,
    mp: 4,
    range: 1,
    icon: 'sword',
    factor: 1.5,
    forms: [],
    ...fields
  };
  return id;
}
function teach(u, id, slot = 1) {
  u.learned.push(id);
  u.slots[slot] = id;
  u.activeArt = id;
  return id;
}
// Run the enemy phase through to the start of the next ally phase.
function enemyTurn(s) {
  G.startEnemy(s);
  for (const e of G.enemies(s)) G.enemyAct(s, e);
  G.nextRound(s);
}
// Win the board and walk through the camp to the next one.
function nextBoard(s) {
  unit(s, G.commanderId(s)).hp = 0;
  G.check(s);
  R.settle(s);
  R.turnPage(s, true);
  return R.advance(s);
}

// ── Save migration (§0.5, §0.6) ──────────────────────────────────────────
section('save migration');
{
  const s = board();
  const plain = R.restoreRun(copy(s));
  check('a save with none of the new fields restores', !!plain);
  check('the migration tables start empty of removed ids', !Object.keys(R.TECHNIQUES_REMOVED).length);

  // A removed art: learned, slotted and active in the save, unknown to the catalogue now.
  const hero = unit(s, 'hero');
  const old = teach(hero, defineArt());
  hero.sp = 3;
  const raw = copy(s);
  delete TECHNIQUES[old];
  check('without the table, an unknown learned id fails the save', R.restoreRun(copy(raw)) === null);
  const restored = R.restoreRun(R.migrateSave(copy(raw), { [old]: { points: 2 } }));
  const h = restored && unit(restored, 'hero');
  check('with the removed id in the table, the save restores', !!restored);
  check('the removed id leaves the learned list', h && !h.learned.includes(old));
  check('its slot is emptied', h && same(h.slots, ['signature', null, null]), h && h.slots);
  check('the active art falls back to the first filled slot', h?.activeArt === 'signature');
  check('its points are refunded', h?.sp === 5, h?.sp);
  const lines = restored?.logs.filter((l) => l.text === '武學譜重修：已失傳的招式退還武學點數。');
  check('the refund is logged once, by 武學傳承', lines?.length === 1 && lines[0].who === '武學傳承');

  // nineYang → yijinjing, once the catalogue has made the rename.
  const t = board(['medic', 'hero', 'guard']);
  const medic = unit(t, 'medic');
  medic.guides.push('nineYang');
  medic.learned.push('nineYang');
  medic.slots[1] = 'nineYang';
  t.run.manuals.push('nineYang');
  t.run.chronicle.parcel.manuals.push('nineYang');
  t.run.shop.push({ id: 'nineYang', price: 48, left: 1 });
  const kept = R.restoreRun(copy(t));
  check('while nineYang is in the catalogue it is kept', unit(kept, 'medic').learned.includes('nineYang'));
  const saved = { art: TECHNIQUES.nineYang, price: MANUAL_PRICES.nineYang };
  TECHNIQUES.yijinjing = saved.art;
  MANUAL_PRICES.yijinjing = saved.price;
  delete TECHNIQUES.nineYang;
  delete MANUAL_PRICES.nineYang;
  const renamed = R.restoreRun(copy(t));
  const m = renamed && unit(renamed, 'medic');
  check('once renamed, the save restores', !!renamed);
  check(
    'learned, guides and slots carry yijinjing',
    m && m.learned.includes('yijinjing') && m.guides.includes('yijinjing') && m.slots[1] === 'yijinjing'
  );
  check(
    'the run’s manuals, parcel and shop carry yijinjing',
    renamed &&
      renamed.run.manuals.includes('yijinjing') &&
      renamed.run.chronicle.parcel.manuals.includes('yijinjing') &&
      renamed.run.shop.some((o) => o.id === 'yijinjing') &&
      !JSON.stringify(renamed.run).includes('nineYang')
  );
  check('a rename alone writes no refund line', !renamed?.logs.some((l) => l.text.startsWith('武學譜重修')));
  TECHNIQUES.nineYang = saved.art;
  MANUAL_PRICES.nineYang = saved.price;
  delete TECHNIQUES.yijinjing;
  delete MANUAL_PRICES.yijinjing;

  // The new bookkeeping: tolerated, tidied on restore, cleared between boards.
  const z = board();
  const zh = unit(z, 'hero');
  Object.assign(zh, { struckRound: 1, hurtRound: 1, usedOnce: ['x'], cooldowns: { x: 4 } });
  unit(z, 'medic').usedOnce = 'broken';
  z.zones = [
    { owner: 'medic', tiles: [{ x: 4, y: 7 }], through: z.round + 1 },
    { owner: 'guard', tiles: [{ x: 4, y: 3 }], through: z.round - 1 }
  ];
  const back = R.restoreRun(copy(z));
  check('a save with the new fields restores', !!back);
  check('restore keeps live zones and drops spent ones', same(back?.zones.map((v) => v.owner), ['medic']));
  check('restore drops a malformed field rather than the save', back && !('usedOnce' in unit(back, 'medic')));
  check('restore keeps well-formed marks', same(unit(back, 'hero').cooldowns, { x: 4 }));
  check('the next board is built', nextBoard(z));
  check(
    'advance clears every hero’s per-board marks',
    G.company(z).every((u) => R.BOARD_MARKS.every((k) => !(k in u)))
  );
  check('advance clears the zones', !('zones' in z));
}

// ─────────────────────────────────────────────────────────────────────────
console.log(failures ? '\n' + failures + ' check(s) failed.' : '\nAll mechanics checks passed.');
process.exit(failures ? 1 : 0);
