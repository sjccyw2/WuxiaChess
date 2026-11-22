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
const FM = await load('rules/ferry-market.js');
const { TECHNIQUES, MANUAL_PRICES } = await load('data/martial-arts.js');
const { ENCOUNTERS, RANKS, STATUS_POWER } = await load('data/encounters.js');
const { mapLayout } = await load('data/terrain.js');
const { MAZE_TALE } = await load('data/maze-tale.js');
const { dangerTiles } = await load('actors/danger.js');
const P = await load('ui/panels.js');
const { seatsFor } = await load('rules/formation.js');

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

// Board 0 of a fresh run, in the fight, with three heroes (the first leads). Every piece starts
// parked on the west edge, no hero beside an enemy; a check puts the pieces it needs on the open
// ground of rows 3 and 7 (x 3–8) with `put`, and acts only with those, since a parked enemy left
// to act would walk in.
const PARKING = {
  ally: [
    [2, 0],
    [3, 0],
    [0, 2]
  ],
  enemy: [
    [0, 4],
    [1, 4],
    [1, 6],
    [0, 7]
  ]
};
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
  s.arrivals = {}; // a small battle of its own: board 0's reinforcements stay away
  for (const side of ['ally', 'enemy'])
    s.units
      .filter((u) => u.side === side)
      .forEach((u, i) => Object.assign(u, { x: PARKING[side][i][0], y: PARKING[side][i][1] }));
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
// A throwaway art in the catalogue (fields over a plain one-tile strike); returns its id.
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
// Learn it, put it in a slot and make it the active art.
function teach(u, id, slot = 1) {
  u.learned.push(id);
  u.slots[slot] = id;
  u.activeArt = id;
  return id;
}
// A villain's traits (by DETAILS key: a master's id, 'lieutenant-' + map, 'bow-' + map,
// 'scout-' + map), in force while `body` runs.
// The entry is put back whole afterwards, so a check may also rename the piece inside.
function withTraits(key, traits, body) {
  const had = Object.hasOwn(G.DETAILS, key),
    prior = G.DETAILS[key];
  G.DETAILS[key] = { ...(prior || {}), traits };
  try {
    return body();
  } finally {
    if (had) G.DETAILS[key] = prior;
    else delete G.DETAILS[key];
  }
}
// Board 0's master and lieutenant hold the bridge (坐鎮, SPEC-villains board 0). Checks of other
// mechanics that need them to walk run them without their traits.
const loose = (body) => withTraits('chief', {}, () => withTraits('lieutenant-0', {}, body));
// Run the enemy phase through to the start of the next ally phase.
function enemyTurn(s) {
  G.startEnemy(s);
  for (const e of G.enemies(s)) G.enemyAct(s, e);
  G.nextRound(s);
}
// The same, with every enemy standing still: only the round's bookkeeping runs.
function quietTurn(s) {
  G.startEnemy(s);
  for (const e of G.enemies(s)) e.acted = true;
  return G.nextRound(s);
}
// Win the board (every enemy down, none still to come) and walk through the camp to the next one.
function nextBoard(s) {
  for (const e of G.enemies(s)) e.hp = 0;
  // 破: its objects broken too; 守: held to its last round (a master still to come never falls).
  for (const o of G.props(s)) if (G.propKind(o) === 'break') o.hp = 0;
  if (G.boardKind(s) === 'keep') {
    s.round = G.boardOf(s).hold;
    s.phase = 'enemy';
  }
  s.arrivals = {};
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
  check(
    'the migration table holds the old trees, the twelve removed nodes among them',
    Object.keys(R.TECHNIQUES_REMOVED).length === 60 && R.TECHNIQUES_REMOVED.breakPalm?.points === 2
  );

  // A removed art: learned, slotted and active in the save, unknown to the catalogue now.
  const hero = unit(s, 'hero');
  const old = teach(hero, defineArt());
  hero.sp = 3;
  const raw = copy(s);
  delete raw.run.trees; // a save from before the redesign
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

  // nineYang → yijinjing: the manual was replaced, and a save holding the old id follows it.
  const t = board(['medic', 'hero', 'guard']);
  const medic = unit(t, 'medic');
  medic.guides.push('nineYang');
  medic.learned.push('nineYang');
  medic.slots[1] = 'nineYang';
  t.run.manuals.push('nineYang');
  t.run.chronicle.parcel.manuals.push('nineYang');
  t.run.shop.push({ id: 'nineYang', price: 48, left: 1 });
  const renamed = R.restoreRun(copy(t));
  const m = renamed && unit(renamed, 'medic');
  check('a save holding the old manual id restores', !!renamed);
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

  // A save from before the redesign: every node of the old trees is given back, kept ids too,
  // because their prices and prerequisites changed; a save made since keeps what it learned.
  const before = board(['hero', 'medic', 'guard']);
  const swordsman = unit(before, 'hero');
  swordsman.learned.push('mountainOpening', 'breakSword');
  swordsman.slots = ['signature', 'breakSword', null];
  swordsman.sp = 0;
  const since = R.restoreRun(copy(before));
  check(
    'a save made under the new trees keeps its learned nodes',
    since && unit(since, 'hero').learned.includes('breakSword') && unit(since, 'hero').sp === 0
  );
  swordsman.learned.push('breakPalm');
  swordsman.slots[2] = 'breakPalm';
  swordsman.activeArt = 'breakPalm';
  delete before.run.trees;
  const respec = R.restoreRun(copy(before));
  const sw = respec && unit(respec, 'hero');
  check('a save from before the redesign restores', !!respec);
  check('kept and removed nodes alike leave the learned list', sw && sw.learned.length === 0, sw?.learned);
  check('their slots empty and the active art falls back', sw && same(sw.slots, ['signature', null, null]) && sw.activeArt === 'signature');
  check('every point paid under the old prices comes back', sw?.sp === 5, sw?.sp);
  check('the save is marked as migrated', respec?.run.trees === 2);
  const again = R.restoreRun(copy(respec));
  check('loading it again refunds nothing more', again && unit(again, 'hero').sp === 5);

  // 青鋒劍 left the game on 2026-11-20 (saves holding one were refunded) and is back. A save from
  // before it left keeps the sword where it was; a save that was refunded keeps its coins.
  const armed = board(['hero', 'medic', 'guard']);
  unit(armed, 'hero').weapon = 'blueEdge';
  armed.stock.pine = 1;
  armed.stock.blueEdge = 1;
  armed.run.shop.push({ id: 'blueEdge', price: 33, left: 1 });
  const purse = armed.run.coins;
  const kept = R.restoreRun(copy(armed));
  check('a save holding 青鋒劍 restores', !!kept);
  check('its bearer still holds it', kept && unit(kept, 'hero').weapon === 'blueEdge' && kept.stock.pine === 1);
  check('the stores and the shelf keep it', kept?.stock.blueEdge === 1 && kept.run.shop.some((o) => o.id === 'blueEdge'));
  check('no coins are paid out for it', kept?.run.coins === purse, kept?.run.coins);
  const refunded = board(['hero', 'medic', 'guard']);
  refunded.run.coins += 66; // what the old migration paid for two swords
  const after = R.restoreRun(copy(refunded));
  check('a save that was refunded restores with its coins', after?.run.coins === refunded.run.coins && unit(after, 'hero').weapon === 'pine');
  check('青鋒劍 is a weapon again, on the shelf from the first board', G.ITEMS.blueEdge?.kind === 'weapon' && same(FM.MARKET_STOCK.blueEdge, [33, 1]) && G.ITEMS.blueEdge.atk === 10 && same(G.ITEMS.blueEdge.forms, ['exploit']));
  check('楊過 starts with the 古墓 sword', G.startingHero('yang').weapon === 'tombSword' && G.ITEMS.tombSword.owner === 'yang');

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

// ── Condition plumbing (§0.4) ────────────────────────────────────────────
section('conditions');
{
  const CHIPS = {
    stance: '卸勁',
    cover: '代受',
    taunt: '挑釁',
    evade: '閃身',
    redirect: '挪移',
    recoil: '露空',
    unguarded: '無守',
    rooted: '立樁',
    spent: '曲終',
    backlash: '亂氣',
    wound: '內傷',
    daze: '失神',
    disarm: '纏械'
  };
  const CLEANSED = ['backlash', 'wound', 'daze', 'disarm'];
  for (const [kind, name] of Object.entries(CHIPS)) {
    const text = BM.effectDescription(kind, 3, 2);
    check(kind + ' is known as ' + name, BM.CONDITION_NAMES[kind] === name);
    check(kind + ' has a description', text.startsWith(name + ' · ') && !text.includes('undefined'), text);
  }
  check(
    'AILMENTS is the spec’s list',
    same(FR.AILMENTS, ['poison', 'weak', 'exposed', 'pin', 'mark', 'seal', ...CLEANSED]),
    FR.AILMENTS
  );

  // Target effects and caster effects, read off an art.
  const target = BM.effectsOf({
    wound: { power: 5, turns: 2 },
    disarm: { power: 5, turns: 2 },
    daze: true,
    redirect: { cap: 24 }
  });
  check(
    'effectsOf gives wound, disarm, daze and redirect',
    same(target, [
      { kind: 'wound', power: 5, turns: 2 },
      { kind: 'disarm', power: 5, turns: 2 },
      { kind: 'daze', power: 1, turns: 1 },
      { kind: 'redirect', power: 24, turns: 1 }
    ]),
    JSON.stringify(target)
  );
  check('effectsOf leaves a setup daze to the strike', !BM.effectsOf({ daze: 'setup' }).length);
  const own = BM.selfEffectsOf({
    stance: 30,
    cover: true,
    taunt: 2,
    evade: true,
    recoil: 6,
    openGuard: true,
    rooted: true,
    spent: true,
    backlash: true
  });
  check(
    'selfEffectsOf gives each caster condition with its power and turns',
    same(
      own.map((e) => [e.kind, e.power, e.turns]),
      [
        ['stance', 30, 1],
        ['cover', 1, 1],
        ['taunt', 2, 1],
        ['evade', 1, 1],
        ['recoil', 6, 1],
        ['unguarded', 1, 1],
        ['rooted', 1, 2],
        ['spent', 1, 2],
        ['backlash', 1, null]
      ]
    ),
    JSON.stringify(own)
  );
  // The redesigned trees: each of these summits leaves its price on the caster.
  const prices = (id) => BM.selfEffectsOf(TECHNIQUES[id]).map((e) => e.kind).sort().join();
  check('獨孤九劍 leaves 露空 and 無守 on 令狐冲', prices('ninefoldIntent') === 'recoil,unguarded', prices('ninefoldIntent'));
  check('涼亭鐵鏈 leaves 立樁 on 向問天', prices('earthThroughChain').includes('rooted'), prices('earthThroughChain'));
  check('笑傲江湖 leaves 曲終 on 任盈盈', prices('clearHeartCoda').includes('spent'), prices('clearHeartCoda'));

  // Life of a caster condition: applied by the art, visible, and gone when the spec says.
  const s = board();
  const hero = put(s, 'hero', 4, 7);
  put(s, 'chief', 5, 7);
  const def = G.stat(hero, 'def', s);
  teach(hero, defineArt({ recoil: 6, rooted: true, mp: 2 }));
  const f = G.forecast(hero, unit(s, 'chief'), true, s);
  check('the preview names the prices', f.notes.includes('露空 · 出招後防禦 −6 至下回合') && f.notes.includes('立樁 · 下回合不能移動'), f.notes);
  G.resolve(s, hero, unit(s, 'chief'), true);
  check('露空 lands on the caster until his next turn', hero.conditions?.recoil?.through === 1);
  check('立樁 lands on the caster through his next turn', hero.conditions?.rooted?.through === 2);
  check('露空 lowers defence', G.stat(hero, 'def', s) === def - 6, G.stat(hero, 'def', s) + ' vs ' + def);
  check('the chips show both', BM.activeEffects(hero, s.round).some((t) => t.startsWith('露空')) && BM.activeEffects(hero, s.round).some((t) => t.startsWith('立樁')));
  check('a save with them restores', !!R.restoreRun(copy(s)));
  G.startEnemy(s);
  check('露空 holds through the enemy phase', !!hero.conditions?.recoil);
  for (const e of G.enemies(s)) e.acted = true;
  G.nextRound(s);
  check('露空 is gone when his next turn begins', !hero.conditions?.recoil);
  check('立樁 is still there on his next turn', !!hero.conditions?.rooted);
  quietTurn(s);
  check('立樁 is gone the turn after', !hero.conditions?.rooted);

  // A both-sides condition put on an enemy by an art lasts its turns, then expires.
  const t = board();
  const striker = put(t, 'hero', 4, 7);
  const chief = put(t, 'chief', 5, 7);
  const atk = G.stat(chief, 'atk', t);
  teach(striker, defineArt({ disarm: { power: 5, turns: 2 }, wound: { power: 5, turns: 2 }, safe: true, mp: 2 }));
  G.resolve(t, striker, chief, true);
  check('纏械 and 內傷 land on the target', chief.conditions?.disarm?.through === 2 && chief.conditions?.wound?.through === 2);
  check('纏械 lowers attack', G.stat(chief, 'atk', t) === atk - 5, G.stat(chief, 'atk', t) + ' vs ' + atk);
  quietTurn(t);
  check('they hold into the second enemy phase', !!chief.conditions?.disarm && !!chief.conditions?.wound);
  quietTurn(t);
  check('and are gone after it', !chief.conditions?.disarm && !chief.conditions?.wound);

  // 解厄 lifts the ailments and leaves the prices and stances.
  const c = board();
  const medic = unit(c, 'medic');
  const all = Object.fromEntries(Object.keys(CHIPS).map((k) => [k, { power: 1, through: 3, source: 'medic' }]));
  const patient = Object.assign(unit(c, 'guard'), { conditions: copy(all) });
  const entry = FR.supportEntry(['cleanse'], medic, patient, 10);
  check('解厄 lifts 亂氣, 內傷, 失神 and 纏械 only', same(entry.clean, CLEANSED), entry.clean);

  // 亂氣 counts layers and lasts the board.
  const b = board();
  const caster = put(b, 'hero', 4, 7);
  put(b, 'chief', 5, 7);
  teach(caster, defineArt({ backlash: true, safe: true, mp: 2 }));
  G.resolve(b, caster, unit(b, 'chief'), true);
  check('亂氣 starts at one layer for the rest of the board', caster.conditions?.backlash?.power === 1 && caster.conditions.backlash.through === G.LIMIT);
  BM.applyCondition(b, caster, { kind: 'backlash', power: 1, turns: 1 }, caster);
  check('a second cast adds a layer', caster.conditions.backlash.power === 2);

  // 布陣 and 盟令 in stat.
  const z = board();
  const guard = put(z, 'guard', 4, 7);
  const foe = put(z, 'chief', 6, 7);
  const before = [G.stat(guard, 'def', z), G.stat(foe, 'def', z)];
  z.zones = [{ owner: 'medic', tiles: [{ x: 4, y: 7 }, { x: 6, y: 7 }], through: 2 }];
  check('a hero on a zone tile has defence +4', G.stat(guard, 'def', z) === before[0] + 4);
  check('an enemy on a zone tile does not', G.stat(foe, 'def', z) === before[1]);
  const details = G.DETAILS.chief,
    prior = details.traits;
  const blade = unit(z, 'blade');
  const plain = [G.stat(foe, 'atk', z), G.stat(blade, 'atk', z)];
  details.traits = { banner: { atk: 1 } };
  check('盟令 raises the other enemies’ attack by its number plus the stage', G.stat(blade, 'atk', z) === plain[1] + 1);
  check('盟令 does not raise its bearer', G.stat(foe, 'atk', z) === plain[0]);
  foe.hp = 0;
  check('盟令 ends with its bearer', G.stat(blade, 'atk', z) === plain[1]);
  details.traits = prior;
}

// ── Villain traits (§7.1, §7.2) ──────────────────────────────────────────
section('villain traits');
{
  check('every villain has a traits object', ENCOUNTERS.flat().every((v) => v.traits && typeof v.traits === 'object'));
  check('RANKS has an entry per board', RANKS.length === ENCOUNTERS.length && RANKS.every((r) => r && typeof r === 'object'));

  // mods on board 0's hard-coded numbers and on a later board's stage numbers.
  const plain = G.newGame(['hero', 'medic', 'guard']);
  const modded = withTraits('chief', { mods: { hp: 1.5, atk: 2, def: -1, step: 4, range: 2 } }, () =>
    G.newGame(['hero', 'medic', 'guard'])
  );
  const a = unit(plain, 'chief'),
    b = unit(modded, 'chief');
  check(
    'board 0 applies its master’s mods',
    b.maxHp === Math.round(a.maxHp * 1.5) && b.atk === a.atk + 2 && b.def === a.def - 1 && b.step === 4 && b.range === 2,
    [b.maxHp, b.atk, b.def, b.step, b.range].join(',')
  );
  const first = board(),
    second = board();
  const map = first.run.route[1];
  // Measured against the same piece with no traits (its board's data may give it mods of its own).
  withTraits('bow-' + map, {}, () => nextBoard(first));
  withTraits('bow-' + map, { mods: { hp: 0.5, atk: -3, range: 4 } }, () => nextBoard(second));
  const [p, q] = [unit(first, 'echoBow'), unit(second, 'echoBow')];
  check(
    'a later board applies a rank-and-file piece’s mods',
    q.maxHp === Math.round(p.maxHp * 0.5) && q.atk === p.atk - 3 && q.range === 4 && q.def === p.def,
    [q.maxHp, q.atk, q.range].join(',')
  );
  check('the other pieces keep the stage numbers', ['murong', 'echoBlade', 'echoScout', G.commanderId(second)].every((id) => {
    const [x, y] = [unit(first, id), unit(second, id)];
    return !x || (x.maxHp === y.maxHp && x.atk === y.atk && x.range === y.range);
  }));
  check('rank and file carry their board’s encounter ids', unit(second, 'echoBow').encounterId === 'bow-' + map && unit(second, 'echoScout').encounterId === 'scout-' + map);
  check('board 0’s archer is bow-0', unit(board(), 'bow').encounterId === 'bow-0');
  const named = withTraits('bow-' + map, {}, () => {
    G.DETAILS['bow-' + map].name = '試射手';
    return G.unitDetails(unit(second, 'echoBow')).name;
  });
  const entry = G.DETAILS['bow-' + map];
  delete G.DETAILS['bow-' + map];
  const shared = G.unitDetails(unit(second, 'echoBow')).name;
  G.DETAILS['bow-' + map] = entry;
  check('a RANKS entry names the piece; without one the shared piece is used', named === '試射手' && shared === G.DETAILS.echoBow.name && G.unitDetails(unit(second, 'echoBow')).name === RANKS[map].bow.name);

  // Status strength by stage, only once a villain's traits are written.
  const s = board();
  s.run.stage = 4;
  const chief = unit(s, 'chief');
  const style = G.DETAILS.chief.style;
  check('without traits a signature keeps the flat stage-0 strength', loose(() => G.enemyTechnique(chief, s).power === 3));
  withTraits('chief', { mods: {} }, () => {
    const art = G.enemyTechnique(chief, s);
    check('with traits weak/exposed scale as 3 + ⌊stage/2⌋', style === 'weak' && art.power === 5, art.power);
    check('the signature note prints the real number', art.note.includes('降低 5'), art.note);
  });
  check('poison scales as 3 + stage, drain as 6 + 2 × stage', STATUS_POWER.poison(4) === 7 && STATUS_POWER.drain(4) === 14 && STATUS_POWER.weak(0) === 3);
  withTraits('chief', { sig: { power: 9, turns: 3 } }, () => {
    const art = G.enemyTechnique(chief, s);
    check('sig.power and sig.turns override', art.power === 9 && art.turns === 3);
  });

  // Cadence and 吸勁's push in the countdown.
  const c = board();
  const boss = unit(c, 'chief');
  c.round = 4;
  boss.signatureRound = 2;
  check('the default cadence is three rounds', G.roundsToSignature(c, boss) === 1);
  withTraits('chief', { sig: { cadence: 2 } }, () =>
    check('sig.cadence changes the gap', G.roundsToSignature(c, boss) === 0)
  );
  boss.signaturePush = 1;
  check('signaturePush puts the signature back', G.roundsToSignature(c, boss) === 2);
  delete boss.signatureRound;
  c.round = 4;
  check('the push also delays a first signature', G.roundsToSignature(c, boss) === 0);
  put(c, 'chief', 4, 7);
  const target = put(c, 'guard', 5, 7);
  const hp = target.hp;
  G.startEnemy(c);
  G.enemyAct(c, boss);
  check('the signature fires and clears the push', boss.signatureRound === 4 && boss.signaturePush === 0 && target.hp < hp);

  // The signature's own reach: planned, struck and drawn with when due.
  const r = board();
  const far = put(r, 'chief', 3, 7);
  const mark = put(r, 'guard', 8, 7);
  r.round = 3;
  withTraits('chief', { sig: { reach: 4 } }, () => {
    check('a due signature strikes with its own reach', G.strikeReach(r, far) === 4);
    const tiles = dangerTiles(r);
    check('the danger zone draws the due signature’s reach', tiles.has(G.key(8, 7)), [...tiles].length);
    const life = mark.hp;
    G.startEnemy(r);
    G.enemyAct(r, far);
    check('the master strikes from three tiles away', mark.hp < life && G.distance(far, mark) > 1 && G.distance(far, mark) <= 4, G.distance(far, mark));
    r.round = 4;
    check('when not due it strikes with its weapon’s reach', G.strikeReach(r, far) === far.range);
  });

  // The enemy page: one line per trait.
  const page = board();
  const lines = withTraits('chief', {
    sig: { reach: 3, extra: 'pin' },
    post: { tile: 'spawn', tether: 1, wake: true },
    prefers: 'wounded',
    contact: { mp: 8 },
    banner: { atk: 1 },
    glide: 2,
    basicPoison: { power: 2, turns: 2 }
  }, () => G.enemyTraitLines(page, unit(page, 'chief')));
  const spawn = mapLayout(0).enemies[0];
  // In the spec's words (SPEC-villains §0.5): '【name】' and the villain's line. The signature's
  // reach and rider are told under the signature itself (signatureLines).
  const expected = [
    '【盟令】存活時其餘敵人攻擊 ＋1。',
    '【坐鎮】守在（' + (spawn.x + 1) + '，' + (spawn.y + 1) + '）一格內；有俠客踏入攻擊範圍或受到攻擊後，才離位追擊。',
    '【化功】貼身打中他的俠客損失 8 點內力（封穴時無效）。',
    '【游擊】出手後退開至多 2 步，離俠客越遠越好。',
    '【毒手】普攻令目標中毒，兩次毒發各損 2 氣血。',
    '【偏好】專挑傷重者。'
  ];
  const sigLines = withTraits('chief', { sig: { reach: 3, extra: 'pin' } }, () => G.signatureLines(page, unit(page, 'chief')));
  check('the signature lines carry its rider and its reach', same(sigLines, ['令目標攻擊降低 3，持續至下回合，並令目標絆足，移動減 2，持續至下回合。', '絕技射程 3 格。']), JSON.stringify(sigLines));
  check('the enemy page lists each trait', same(lines, expected), JSON.stringify(lines));
  const html = withTraits('chief', { glide: 2 }, () => P.enemyPage(page, 'chief'));
  check('the enemy page shows the step and the trait lines', html.includes('移動 <b>') && html.includes('<b class="trait-name">游擊</b>　出手後退開至多 2 步，離俠客越遠越好。'));
}

// ── Reach and the counter ratio (§5 disarm, §6 counterRatio) ─────────────
section('reach and counters');
{
  const disarm = (u) => BM.applyCondition({ round: 1 }, u, { kind: 'disarm', power: 5, turns: 2 }, u);
  const s = board();
  const bow = put(s, 'bow', 6, 7);
  check('reach is the weapon’s range', G.reach(s, bow) === bow.range && bow.range === 3);
  const hero = put(s, 'hero', 4, 7);
  teach(hero, defineArt({ range: 2, factor: 0.5 }));
  const shot = G.forecast(hero, bow, true, s);
  check('an archer two tiles off counters', shot.counterRaw > 0);
  disarm(bow);
  check('纏械 holds reach to one tile', G.reach(s, bow) === 1 && G.strikeReach(s, bow) === 1);
  check('a disarmed archer two tiles off does not counter', G.forecast(hero, bow, true, s).counterRaw === 0);
  check('the enemy page says why', P.enemyPage(s, 'bow').includes('1 格（纏械）'));

  // A disarmed archer plans with reach 1: it closes in instead of shooting.
  const a = board();
  const archer = put(a, 'bow', 3, 7),
    prey = put(a, 'guard', 7, 7);
  const zone = dangerTiles(a);
  disarm(archer);
  const narrow = dangerTiles(a);
  check('the danger zone shrinks under 纏械', narrow.size < zone.size && !narrow.has(G.key(7, 7)) && zone.has(G.key(7, 7)));
  const hp = prey.hp;
  G.startEnemy(a);
  G.enemyAct(a, archer);
  check('a disarmed archer cannot shoot from afar', prey.hp === hp && G.distance(archer, prey) > 1);

  // The ratio itself.
  const r = board();
  const guard = unit(r, 'guard'),
    chief = unit(r, 'chief');
  const cond = (u, kind) => BM.applyCondition(r, u, { kind, power: kind === 'stance' ? 30 : 1, turns: 1 }, u);
  check('a counter is 0.55 of a basic strike', G.counterRatio(r, guard) === 0.55);
  const retort = defineArt({ kind: 'basic', name: '試後發', retort: 0.8 });
  guard.learned.push(retort);
  check('a learned 後發 sets 0.8', G.counterRatio(r, guard) === 0.8);
  cond(guard, 'stance');
  check('卸勁 gives 1.0', G.counterRatio(r, guard) === 1);
  cond(guard, 'unguarded');
  check('無守 gives 0 whatever else holds', G.counterRatio(r, guard) === 0);
  r.round = 3;
  check('a villain without 蓄勢反擊 counters at 0.55 when due', G.counterRatio(r, chief) === 0.55);
  withTraits('chief', { stance: { while: 'charged', cut: 0, holds: true } }, () => {
    check('a charged villain with 蓄勢反擊 counters at 1.0', G.counterRatio(r, chief) === 1);
    chief.signatureRound = 3;
    r.round = 4;
    check('and at 0.55 once the signature has fired', G.counterRatio(r, chief) === 0.55);
    delete chief.signatureRound;
    r.round = 3;
    put(r, 'chief', 5, 7);
    const striker = put(r, 'hero', 4, 7);
    striker.activeArt = 'signature';
    const f = G.forecast(striker, chief, false, r);
    const full = Math.max(2, Math.round(G.damage(chief, striker, false, r.mapIndex, r)));
    check('the preview counts the full counter', f.counterRaw === full, f.counterRaw + ' vs ' + full);
    check('and says so', f.notes.includes('蓄勢反擊 · 還擊全力'));
  });

  // In the enemy phase: the hero's counter follows his ratio.
  function counterOf(kind) {
    const e = board();
    const foe = put(e, 'blade', 4, 7),
      tank = put(e, 'guard', 5, 7);
    if (kind) BM.applyCondition(e, tank, { kind, power: kind === 'stance' ? 30 : 1, turns: 1 }, tank);
    G.startEnemy(e);
    const life = foe.hp;
    G.enemyAct(e, foe);
    return { taken: life - foe.hp, expected: Math.round(G.damage(tank, foe, false, e.mapIndex, e)) };
  }
  const usual = counterOf(null),
    stanced = counterOf('stance'),
    open = counterOf('unguarded');
  check('an enemy-phase counter is 0.55 of the hero’s basic', usual.taken === Math.max(2, Math.round(usual.expected * 0.55)), usual.taken);
  check('under 卸勁 it is the full basic', stanced.taken === Math.max(2, stanced.expected), stanced.taken);
  check('under 無守 there is none', open.taken === 0, open.taken);
}

// ── Conditional power: strikeFactor (§4) ─────────────────────────────────
section('conditional power');
{
  const MF = await load('rules/move-facts.js');
  // One strike's factor and notes, and whether the preview and the power agree with it.
  function strike(s, u, t, fields) {
    const id = teach(u, defineArt({ range: 3, mp: 2, ...fields }), 2);
    const art = TECHNIQUES[id];
    const sf = G.strikeFactor(s, u, art, t);
    const f = G.forecast(u, t, true, s);
    const power = G.attackPower(s, u, art, G.basicFor(u), t);
    const expected = G.stat(u, 'atk', s) * sf.factor + G.stat(u, 'power', s) + 4 + (t.hp <= t.maxHp / 2 ? BM.commandBonus(s, u, 'pursuit') : 0);
    return { ...sf, f, consistent: Math.abs(power - expected) < 1e-9, facts: MF.moveFacts(s, u, id) };
  }
  const near = (a, b) => Math.abs(a - b) < 1e-9;

  // 破招: by the target's class at the moment of the strike.
  const s = board();
  const hero = put(s, 'hero', 4, 7);
  const blade = put(s, 'blade', 5, 7),
    bow = put(s, 'bow', 6, 7);
  const close = strike(s, hero, put(s, 'scout', 4, 6), { answer: 'close' });
  check('破招 close ＋0.30 on a one-tile fighter', near(close.factor, 1.8) && close.f.notes.includes('破招 · 近身兵刃 ＋0.30'), close.factor);
  check('strikeFactor feeds attackPower', close.consistent);
  check('moveFacts states the class', close.facts.effectLines.includes('破招 · 目標為近身（射程 1）時倍率 ＋0.30'), close.facts.effectLines);
  const missed = strike(s, hero, bow, { answer: 'close' });
  check('破招 close gives nothing on an archer, and says nothing', near(missed.factor, 1.5) && !missed.f.notes.some((n) => n.startsWith('破招')));
  check('破招 ranged on the archer', near(strike(s, hero, bow, { answer: 'ranged' }).factor, 1.8));
  const tied = board();
  const archer = put(tied, 'bow', 6, 7);
  put(tied, 'hero', 4, 7);
  BM.applyCondition(tied, archer, { kind: 'disarm', power: 5, turns: 2 }, archer);
  check('a disarmed archer counts as close', near(strike(tied, unit(tied, 'hero'), archer, { answer: 'close' }).factor, 1.8));
  const master = strike(s, hero, blade, { answer: 'master' });
  check('破招 master on the lieutenant', near(master.factor, 1.8) && master.f.notes.includes('破招 · 首領 ＋0.30'));
  check('the basic attack never takes a bonus', !G.forecast(hero, blade, false, s).notes.some((n) => n.startsWith('破招')));

  // 孤行 and 合璧, with the partner table and 左右互搏.
  const p = board(['yang', 'xiao', 'hero']);
  const yang = put(p, 'yang', 4, 7),
    foe = put(p, 'blade', 5, 7);
  const alone = strike(p, yang, foe, { lone: 0.25 });
  check('孤行 ＋0.25 with no companion beside him', near(alone.factor, 1.75) && alone.f.notes.includes('孤行 ＋0.25'));
  put(p, 'hero', 4, 6);
  const crowded = strike(p, yang, foe, { lone: 0.25 });
  check('孤行 fails with a companion beside, and names him', near(crowded.factor, 1.5) && crowded.f.notes.includes('孤行未成 · 令狐冲在旁'), crowded.f.notes);
  const any = strike(p, yang, foe, { paired: { any: 0.2, partner: 0.4 } });
  check('合璧 ＋0.20 with any companion beside', near(any.factor, 1.7) && any.f.notes.includes('合璧 ＋0.20'));
  put(p, 'xiao', 3, 7);
  const pair = strike(p, yang, foe, { paired: { any: 0.2, partner: 0.4 } });
  check('合璧 ＋0.40 with his partner beside', near(pair.factor, 1.9) && pair.f.notes.includes('合璧 · 小龍女在旁 ＋0.40'), pair.f.notes);
  check('moveFacts names the partner', pair.facts.effectLines.includes('合璧 · 有同伴相鄰 ＋0.20，小龍女相鄰 ＋0.40'), pair.facts.effectLines);
  const lone = board(['xiao', 'yang', 'hero']);
  const xiao = put(lone, 'xiao', 4, 7),
    target = put(lone, 'blade', 5, 7);
  check('合璧 alone gives nothing', near(strike(lone, xiao, target, { paired: { any: 0.2, partner: 0.4 } }).factor, 1.5));
  xiao.learned.push(defineArt({ pairsSelf: true }));
  const self = strike(lone, xiao, target, { paired: { any: 0.2, partner: 0.4 } });
  check('左右互搏 counts as a companion', near(self.factor, 1.7) && self.f.notes.includes('合璧 · 左右互搏 ＋0.20'));

  // 黯然, after the art's own price.
  const d = board(['yang', 'hero', 'medic']);
  const hurt = Object.assign(put(d, 'yang', 4, 7), { hp: 70, maxHp: 128 });
  const dire = strike(d, hurt, put(d, 'blade', 5, 7), { dire: 0.6, hpCost: 9 });
  const n = Math.round(0.6 * Math.min(1, (1 - 61 / 128) / 0.75) * 100) / 100;
  check('黯然 reads 氣血 after the price', near(dire.factor, 1.5 + n) && dire.f.notes.includes('黯然 ＋' + n.toFixed(2) + '（氣血 61／128）'), dire.f.notes);
  hurt.hp = 20;
  check('黯然 is at most its number', near(strike(d, hurt, unit(d, 'blade'), { dire: 0.6 }).factor, 2.1));

  // 斬殘 at half 氣血.
  const e = board(['hu', 'hero', 'medic']);
  const hu = put(e, 'hu', 4, 7),
    prey = put(e, 'blade', 5, 7);
  check('斬殘 gives nothing above half', near(strike(e, hu, prey, { execute: 0.5 }).factor, 1.5));
  prey.hp = Math.floor(prey.maxHp / 2);
  const kill = strike(e, hu, prey, { execute: 0.5 });
  check('斬殘 ＋0.50 at half or below', near(kill.factor, 2) && kill.f.notes.includes('斬殘 ＋0.50') && kill.consistent);

  // 還報 and the bookkeeping behind it.
  const a = board(['guard', 'hero', 'medic']);
  const guard = put(a, 'guard', 4, 7),
    attacker = put(a, 'blade', 5, 7);
  G.startEnemy(a);
  G.enemyAct(a, attacker);
  check('an enemy blow that draws blood stamps hurtRound', guard.hurtRound === 1);
  for (const v of G.enemies(a)) v.acted = true;
  G.nextRound(a);
  const avenge = strike(a, guard, attacker, { avenge: 0.4 });
  check('還報 ＋0.40 the round after', near(avenge.factor, 1.9) && avenge.f.notes.includes('還報 ＋0.40'));
  quietTurn(a);
  check('還報 is gone a round later', near(strike(a, guard, attacker, { avenge: 0.4 }).factor, 1.5));
  const shielded = board(['guard', 'hero', 'medic']);
  const wall = put(shielded, 'guard', 4, 7);
  BM.applyCondition(shielded, wall, { kind: 'shield', power: 999, turns: 2 }, wall);
  G.startEnemy(shielded);
  G.enemyAct(shielded, put(shielded, 'blade', 5, 7));
  check('a blow a shield caught does not', wall.hurtRound === undefined);
  const b = board();
  const striker = put(b, 'hero', 4, 7);
  put(b, 'blade', 5, 7);
  G.resolve(b, striker, unit(b, 'blade'), false);
  check('a basic attack stamps struckRound', striker.struckRound === 1);
  const helper = put(b, 'medic', 3, 6);
  const patient = put(b, 'guard', 3, 7);
  patient.hp -= 20;
  check('a support art does not', !!G.resolve(b, helper, patient, true) && helper.struckRound === undefined);
  G.waitUnit(b, unit(b, 'guard'));
  check('nor does waiting', unit(b, 'guard').struckRound === undefined);

  // 傾力: spends all 內力, factor by formula, then other bonuses.
  const g = board(['duan', 'hero', 'medic']);
  const duan = Object.assign(put(g, 'duan', 4, 7), { mp: 40 });
  const surgeFields = { factor: 0.8, surge: { rate: 0.015, cap: 1.55 }, mp: 10 };
  const surge = strike(g, duan, put(g, 'blade', 6, 7), surgeFields);
  check('傾力 factor is min(cap, factor + rate × 內力)', near(surge.factor, 1.4) && surge.f.notes.includes('傾力 · 耗內力 40，倍率 1.40'), surge.f.notes);
  check('the preview’s cost is all the 內力', surge.f.mpCost === 40);
  duan.mp = 80;
  check('傾力 stops at its cap', near(strike(g, duan, unit(g, 'blade'), surgeFields).factor, 1.55));
  const low = unit(g, 'blade');
  low.hp = Math.floor(low.maxHp / 2);
  check('and other bonuses add on top', near(strike(g, duan, low, { ...surgeFields, execute: 0.5 }).factor, 2.05));
  check('moveFacts states the rate and cap', surge.facts.effectLines.includes('傾力 · 耗盡內力，每點倍率 ＋0.015，最高 1.55'), surge.facts.effectLines);
  G.resolve(g, duan, unit(g, 'blade'), true);
  check('resolving it leaves no 內力', duan.mp === 0);
}

// ── Use restrictions and prices: artReady (§2, §3, §9.5) ─────────────────
section('use restrictions');
{
  const J = await load('ui/journey-pages.js');
  const MF = await load('rules/move-facts.js');
  // A hero facing an enemy two tiles off, with a test art in slot 2.
  function setup(fields, id = 'hero') {
    const s = board([id, 'medic', 'guard']);
    const u = put(s, id, 4, 7);
    const foe = put(s, 'chief', 6, 7);
    const art = teach(u, defineArt({ range: 2, mp: 2, safe: true, ...fields }), 2);
    u.mp = u.maxMp;
    return { s, u, foe, art };
  }
  const reason = (s, u, art) => G.artReady(s, u, art).reason;
  const next = (s, u) => {
    quietTurn(s);
    u.mp = u.maxMp;
  };

  // 留力
  {
    const { s, u, foe, art } = setup({ poised: true });
    check('留力 is usable on the board’s first round', G.canPay(s, u, art));
    put(s, 'chief', 5, 7);
    check('a basic strike lands', !!G.resolve(s, u, foe, false));
    u.acted = false;
    check('a strike earlier the same round does not block it', G.artReady(s, u, art).ok);
    next(s, u);
    check('留力 refuses the round after a strike', !G.canPay(s, u, art) && reason(s, u, art) === '留力 · 上回合已出手');
    check('and the target test refuses with it', !G.targetOK(s, u, foe, true));
    G.waitUnit(s, u);
    next(s, u);
    check('after a turn without striking it is usable again', G.canPay(s, u, art));
    check('moveFacts states the rule', MF.moveFacts(s, u, art).effectLines.includes('留力 · 上回合未出手方可施展'));
  }
  // 壓箱
  {
    const { s, u, foe, art } = setup({ once: true });
    check('壓箱 is noted in the preview', G.forecast(u, foe, true, s).notes.includes('壓箱 · 每局一次'));
    G.resolve(s, u, foe, true);
    next(s, u);
    check('壓箱 refuses after its one use', !G.canPay(s, u, art) && reason(s, u, art) === '壓箱 · 本局已用');
    check('the arts list shows the reason on a disabled entry', /data-id="testArt\d+" disabled/.test(J.equippedMoves(s, u)) && J.equippedMoves(s, u).includes('壓箱 · 本局已用'));
    nextBoard(s);
    check('the next board gives it back', G.artReady(s, u, art).ok && !u.usedOnce);
  }
  // 調息
  {
    const { s, u, foe, art } = setup({ cooldown: 2 });
    s.round = 3;
    G.resolve(s, u, foe, true);
    check('調息 records the round it is ready', u.cooldowns[art] === 6);
    next(s, u);
    check('調息 refuses on round 4 with two to go', reason(s, u, art) === '調息 · 還須 2 回合');
    next(s, u);
    check('and on round 5 with one', reason(s, u, art) === '調息 · 還須 1 回合');
    next(s, u);
    check('and allows it on round 6', G.canPay(s, u, art));
    check('moveFacts states the gap', MF.moveFacts(s, u, art).effectLines.includes('調息 · 施展後隔 2 回合'));
  }
  // 曲終
  {
    const { s, u, foe, art } = setup({ spent: true });
    G.resolve(s, u, foe, true);
    next(s, u);
    check('曲終 refuses every art on the next turn', ['signature', art].every((id) => reason(s, u, id) === '曲終 · 本回合不能施展絕技'));
    put(s, 'chief', 5, 7);
    check('the basic attack is still allowed', G.targetOK(s, u, foe, false));
    next(s, u);
    check('the turn after, arts are back', G.canPay(s, u, art));
  }
  // 立樁
  {
    const { s, u, foe, art } = setup({ rooted: true });
    const blink = defineArt({ target: 'ground', blink: true, range: 3, mp: 2 });
    G.resolve(s, u, foe, true);
    u.slots[1] = blink;
    u.learned.push(blink);
    next(s, u);
    check('立樁 forbids moving on the next turn', !G.canMove(s, u) && !G.move(s, u, 3, 7));
    check('and the 輕功 arts, with the reason', reason(s, u, blink) === '立樁 · 本回合不能移動');
    check('but not his other arts', G.canPay(s, u, art));
    const page = J.equippedMoves(s, u);
    check('the arts list shows it', page.includes('立樁 · 本回合不能移動'));
    next(s, u);
    check('the turn after he moves again', G.canMove(s, u) && G.move(s, u, 3, 7));
  }
  // 轉護
  {
    const { s, u, art } = setup({ consume: 'shield', target: 'ally', range: 3, aura: 1, redirect: { cap: 24 } }, 'zhang');
    const friend = put(s, 'medic', 4, 6);
    check('轉護 refuses without a shield', reason(s, u, art) === '轉護 · 自身須有護盾');
    BM.applyCondition(s, u, { kind: 'shield', power: 30, turns: 2 }, u);
    const f = G.forecast(u, friend, true, s);
    check('with one it is usable, and the preview says what passes', G.canPay(s, u, art) && f.notes.includes('轉護 · 移出自身護盾 30，各人得 24 護盾'), f.notes);
    G.resolve(s, u, friend, true);
    check('each recipient gets the shield, capped at 24, for two turns', friend.conditions?.shield?.power === 24 && friend.conditions.shield.through === 2);
    check('the caster, a recipient too, holds 24 in place of 30', u.conditions?.shield?.power === 24);
  }
}

// One enemy blow at a hero in the enemy phase: the 氣血 it took, and the blow's size before any
// defence of the hero's own (his def, tile and brace are in it).
function blowAt(s, foeId, heroId) {
  const foe = unit(s, foeId),
    hero = unit(s, heroId);
  if (s.phase === 'ally') G.startEnemy(s);
  const raw = G.damage(foe, hero, false, s.mapIndex, s);
  const life = hero.hp;
  G.enemyAct(s, foe);
  return { taken: life - hero.hp, raw };
}

// ── 卸勁 stance: the cut (§6) ────────────────────────────────────────────
section('stance');
{
  const stance = (u, s) => BM.applyCondition(s, u, { kind: 'stance', power: 30, turns: 1 }, u);
  // The art: the guard lands on the caster, and the preview and the art's facts say so.
  const s = board(['guard', 'hero', 'medic']);
  const guard = put(s, 'guard', 4, 7);
  const foe = put(s, 'blade', 5, 7);
  const art = teach(guard, defineArt({ stance: 30, safe: true, mp: 2 }));
  const MF = await load('rules/move-facts.js');
  check('the preview names the guard', G.forecast(guard, foe, true, s).notes.includes('卸勁 · 至下回合受擊減三成，還擊全力'));
  check('the art’s facts name it too', MF.moveFacts(s, guard, art).effectLines.includes('卸勁 · 至下回合受擊減三成，還擊全力'));
  G.resolve(s, guard, foe, true);
  check('卸勁 lands on the caster until his next turn', guard.conditions?.stance?.power === 30 && guard.conditions.stance.through === 1);
  check('a save with it restores', unit(R.restoreRun(copy(s)), 'guard').conditions?.stance?.power === 30);
  check('G.stanceCut reads it', G.stanceCut(s, guard) === 30);
  const hit = blowAt(s, 'blade', 'guard');
  check('an enemy blow is cut by three tenths, rounded half up', hit.taken === Math.round(hit.raw * 0.7), hit.taken + ' of ' + hit.raw);
  check('the counter is at full ratio', foe.hp < foe.maxHp);

  // Plain, then with a shield: the cut comes first, the shield takes what is left.
  const plain = board(['guard', 'hero', 'medic']);
  put(plain, 'guard', 4, 7);
  put(plain, 'blade', 5, 7);
  const bare = blowAt(plain, 'blade', 'guard');
  check('without it the blow is whole', bare.taken === bare.raw, bare.taken + ' of ' + bare.raw);
  const sh = board(['guard', 'hero', 'medic']);
  const wall = put(sh, 'guard', 4, 7);
  put(sh, 'blade', 5, 7);
  stance(wall, sh);
  BM.applyCondition(sh, wall, { kind: 'shield', power: 2, turns: 1 }, wall);
  const shielded = blowAt(sh, 'blade', 'guard');
  check('the shield absorbs after the cut', shielded.taken === Math.round(shielded.raw * 0.7) - 2, shielded.taken + ' of ' + shielded.raw);

  // A counter in the ally phase is enemy damage too: the preview and the strike both cut it.
  const c = board(['guard', 'hero', 'medic']);
  const striker = put(c, 'guard', 4, 7);
  const target = put(c, 'blade', 5, 7);
  const whole = G.forecast(striker, target, false, c).counterRaw;
  stance(striker, c);
  const f = G.forecast(striker, target, false, c);
  check('the preview cuts the counter it shows', f.counterRaw === Math.round(whole * 0.7) && f.counterRaw < whole, f.counterRaw + ' / ' + whole);
  const life = striker.hp;
  G.resolve(c, striker, target, false);
  check('and the strike takes what the preview showed', life - striker.hp === f.counter);

  // Poison is no blow: the tick is whole.
  const p = board(['guard', 'hero', 'medic']);
  const sick = unit(p, 'guard');
  stance(sick, p);
  BM.applyCondition(p, sick, { kind: 'poison', power: 10, turns: 2 }, sick);
  const before = sick.hp;
  quietTurn(p);
  check('poison is not cut', before - sick.hp === 10, before - sick.hp);

  // A sweep's chip on a stanced neighbour is cut.
  const w = board(['guard', 'hero', 'medic']);
  put(w, 'chief', 4, 7);
  put(w, 'hero', 5, 7);
  const side = put(w, 'guard', 5, 6);
  stance(side, w);
  w.round = 3;
  const styled = G.DETAILS.chief.style;
  G.DETAILS.chief.style = 'sweep';
  try {
    for (const v of G.party(w)) if (v !== unit(w, 'hero')) v.hp = v.maxHp;
    unit(w, 'hero').hp = 30; // the cheapest target, so the sweep centres on him
    G.startEnemy(w);
    const raw = Math.round(G.damage(unit(w, 'chief'), unit(w, 'hero'), false, w.mapIndex, w) * G.enemyTechnique(unit(w, 'chief'), w).factor);
    const was = side.hp;
    G.enemyAct(w, unit(w, 'chief'));
    check('a sweep chip on a stanced hero is cut', was - side.hp === Math.round(Math.max(1, Math.round(raw / 4)) * 0.7), was - side.hp);
  } finally {
    G.DETAILS.chief.style = styled;
  }

  // The enemy weighs the cut: a stanced hero counts as sturdier than he is.
  const ai = (stanced) => {
    const a = board(['guard', 'hero', 'medic']);
    put(a, 'blade', 5, 7);
    Object.assign(put(a, 'hero', 4, 7), { hp: 100 });
    const g = Object.assign(put(a, 'guard', 6, 7), { hp: 80 });
    if (stanced) stance(g, a);
    G.startEnemy(a);
    G.enemyAct(a, unit(a, 'blade'));
    return g.hp < 80 ? 'guard' : unit(a, 'hero').hp < 100 ? 'hero' : 'none';
  };
  check('without the guard the enemy strikes the weaker hero', ai(false) === 'guard');
  check('with it, 80 under 卸勁 weighs more than 100, and the other is struck', ai(true) === 'hero');

  // A villain's 蓄勢反擊 with a written cut, while charged.
  const v = board();
  const hero = put(v, 'hero', 4, 7);
  const boss = put(v, 'chief', 5, 7);
  const open = G.forecast(hero, boss, false, v).amount;
  v.round = 3;
  withTraits('chief', { stance: { while: 'charged', cut: 50, holds: true } }, () => {
    check('a charged villain’s cut halves the blow', G.forecast(hero, boss, false, v).amount === Math.round(open * 0.5));
    v.round = 2;
    check('and does nothing while not charged', G.forecast(hero, boss, false, v).amount === open);
  });
}

// ── 代受 cover (§6, §8) ──────────────────────────────────────────────────
section('cover');
{
  const cover = (u, s) => BM.applyCondition(s, u, { kind: 'cover', power: 1, turns: 1 }, u);
  // 郭靖's art: the condition is his, and its facts say what it does.
  const a = board(['guo', 'medic', 'hero']);
  const guo = put(a, 'guo', 4, 7);
  put(a, 'blade', 5, 7);
  const art = teach(guo, defineArt({ cover: true, safe: true, mp: 2 }));
  const note = '代受 · 至下回合，敵人對相鄰同伴的直接攻擊改由自己承受';
  check('the preview names the guard', G.forecast(guo, unit(a, 'blade'), true, a).notes.includes(note));
  G.resolve(a, guo, unit(a, 'blade'), true);
  check('代受 lands on the caster until his next turn', guo.conditions?.cover?.through === 1);
  check('a save with it restores', !!unit(R.restoreRun(copy(a)), 'guo').conditions?.cover);
  quietTurn(a);
  check('it is gone when his next turn begins', !guo.conditions?.cover);

  // In the enemy phase: a blow at a companion beside him lands on him, worked out on him.
  // The attacker has reach 2 and stands still, so both heroes are in reach and the companion,
  // first in the line and scored as her coverer, is the one it picks.
  function guarded(setup) {
    const s = board(['medic', 'guo', 'hero']);
    const foe = Object.assign(put(s, 'blade', 6, 7), { step: 0, range: 2 });
    const medic = put(s, 'medic', 4, 7),
      guo = put(s, 'guo', 5, 7);
    setup?.(s);
    G.startEnemy(s);
    const raw = G.damage(foe, guo, false, s.mapIndex, s);
    const life = { medic: medic.hp, guo: guo.hp, foe: foe.hp, protects: guo.mastery.protects };
    G.enemyAct(s, foe);
    return { s, foe, medic, guo, raw, life };
  }
  const g = guarded((s) => cover(unit(s, 'guo'), s));
  check('the companion is untouched', g.medic.hp === g.life.medic);
  check('he takes the blow, at his own defence', g.life.guo - g.guo.hp === g.raw, g.life.guo - g.guo.hp + ' of ' + g.raw);
  check('he counters, the attacker being in his reach', g.foe.hp < g.life.foe);
  check('the blow counts as protecting', g.guo.mastery.protects === g.life.protects + 1);
  check('the log says who took it', g.s.logs.some((l) => l.text === '挺身代任盈盈受招。' && l.who === '郭靖'));
  const open = guarded(null);
  check('without it the companion is struck', open.medic.hp < open.life.medic && open.guo.hp === open.life.guo);
  const apart = guarded((s) => {
    cover(unit(s, 'guo'), s);
    put(s, 'guo', 5, 6);
  });
  check('he covers only a companion beside him', apart.medic.hp < apart.life.medic && apart.guo.hp === apart.life.guo);
  check('a companion beside him shows the derived chip', P.profileContents(g.s, 'medic').includes('受護 · 郭靖在旁代受直接攻擊'));
  check('one apart does not', !P.profileContents(apart.s, 'medic').includes('受護'));

  // Of two coverers the one with more 氣血; on a tie the earlier; no chains.
  const two = board(['medic', 'guo', 'guard']);
  const m = put(two, 'medic', 4, 7);
  const c1 = Object.assign(put(two, 'guo', 4, 6), { hp: 100 }),
    c2 = Object.assign(put(two, 'guard', 4, 8), { hp: 120 });
  cover(c1, two);
  cover(c2, two);
  check('the coverer with more 氣血 is chosen', G.coverer(two, m) === c2);
  c2.hp = 100;
  check('on a tie, the earlier in the unit list', G.coverer(two, m) === c1);
  check('a coverer is not covered in turn', G.coverer(two, c1) === null);
  c1.hp = 0;
  check('a fallen coverer covers no one', G.coverer(two, m) === c2);

  // The enemy scores a covered hero as his coverer, and goes for someone else.
  const pick = (covered) => {
    const s = board(['medic', 'guo', 'hero']);
    const foe = Object.assign(put(s, 'blade', 6, 7), { step: 0, range: 2 });
    const weak = Object.assign(put(s, 'medic', 4, 7), { hp: 30 });
    const g = put(s, 'guo', 4, 6);
    const other = Object.assign(put(s, 'hero', 8, 7), { hp: 80 });
    if (covered) cover(g, s);
    G.startEnemy(s);
    const hp = [weak.hp, g.hp, other.hp];
    G.enemyAct(s, foe);
    return weak.hp < hp[0] || g.hp < hp[1] ? 'medic' : other.hp < hp[2] ? 'hero' : 'none';
  };
  check('uncovered, the weakest is struck', pick(false) === 'medic');
  check('covered, she weighs as 郭靖 and another is struck', pick(true) === 'hero');

  // Disciples covering their master (`cover: 'master'`), when a hero strikes him.
  const scoutKey = 'scout-0';
  withTraits(scoutKey, { cover: 'master' }, () => {
    // Board 0 has no RANKS entry yet: give the key the scout's details under a disciple's name.
    Object.assign(G.DETAILS[scoutKey], { ...G.DETAILS.scout, name: '星宿弟子', traits: { cover: 'master' } });
    const s = board();
    const hero = put(s, 'hero', 4, 7),
      chief = put(s, 'chief', 5, 7),
      scout = put(s, 'scout', 6, 7);
    const plain = G.forecast(hero, scout, false, s);
    const f = G.forecast(hero, chief, false, s);
    check('the forecast substitutes the disciple', f.coveredBy === 'scout' && f.amount === plain.amount);
    const names = [G.unitDetails(scout).name, G.unitDetails(chief).name];
    check('and says so', f.notes[0] === '代受 · ' + names[0] + '代' + names[1] + '受招', f.notes[0]);
    check('reach is the master’s, so the strike is legal', G.targetOK(s, hero, chief, false));
    check('the disciple two tiles off cannot counter', f.counterRaw === 0);
    const page = P.attackPage(s, 'hero', 'chief', false);
    check('the preview shows the disciple opposite, with a 代受 line', page.includes('<strong>' + names[0] + '</strong>') && page.includes('<span>代受</span><b class="">' + names[0] + '代' + names[1] + '受招'));
    check('the master’s page names who covers him', G.enemyTraitLines(s, chief).includes('【門人代受】相鄰的' + names[0] + '替他承受俠客的直接攻擊（氣血較多者先上）；波及、穿行、走勁與毒傷仍會落在他身上。'));
    const life = [chief.hp, scout.hp];
    G.resolve(s, hero, chief, false);
    check('the strike lands on the disciple only', chief.hp === life[0] && life[1] - scout.hp === f.amount);

    // Its effects and push land on the coverer; splash centres on him.
    const t = board();
    const h = put(t, 'hero', 4, 7),
      boss = put(t, 'chief', 5, 7),
      d = put(t, 'scout', 6, 7);
    teach(h, defineArt({ splash: 0.5, safe: true, mp: 2 }));
    check('the splash centres on him and reaches the master', G.forecast(h, boss, true, t).splash.some((v) => v.id === 'chief'));
    teach(h, defineArt({ push: true, debuff: { stat: 'atk', power: 3, turns: 2 }, safe: true, mp: 2 }), 2);
    d.hp = d.maxHp = 200;
    const pf = G.forecast(h, boss, true, t);
    check('the coverer is pushed along the line from the striker', pf.coveredBy === 'scout' && pf.push?.x === 7 && pf.push?.y === 7, JSON.stringify(pf.push));
    G.resolve(t, h, boss, true);
    check('the debuff lands on the coverer', !!d.conditions?.weak && !boss.conditions?.weak);
    check('and he is pushed', d.x === 7 && d.y === 7);

    // Sealed or dazed, a disciple still covers; he covers the master only.
    const q = board();
    const sc = put(q, 'scout', 5, 8);
    put(q, 'chief', 5, 7);
    BM.applyCondition(q, sc, { kind: 'seal', power: 1, turns: 1 }, sc);
    BM.applyCondition(q, sc, { kind: 'daze', power: 1, turns: 1 }, sc);
    check('a sealed, dazed disciple still covers', G.coverer(q, unit(q, 'chief')) === sc);
    put(q, 'chief', 0, 4);
    put(q, 'blade', 5, 7);
    check('he does not cover the lieutenant', G.coverer(q, unit(q, 'blade')) === null);
  });
}

// ── 挪移 redirect: the hero ward and the villain mirror (§6, §7.6) ───────
section('redirect');
{
  // 張無忌's ward on a companion.
  const s = board(['zhang', 'medic', 'hero']);
  const zhang = put(s, 'zhang', 3, 7),
    medic = put(s, 'medic', 4, 7);
  const art = teach(zhang, defineArt({ target: 'ally', range: 3, mp: 2, redirect: { cap: 24 }, factor: undefined }));
  const f = G.forecast(zhang, medic, true, s);
  check('the ward is a legal target and shows as an effect', G.targetOK(s, zhang, medic, true) && f.effects.some((e) => e.kind === 'redirect' && e.power === 24));
  G.resolve(s, zhang, medic, true);
  check('挪移 lands on the recipient until the next turn', medic.conditions?.redirect?.power === 24 && medic.conditions.redirect.through === 1);
  check('a save with it restores', unit(R.restoreRun(copy(s)), 'medic').conditions?.redirect?.power === 24);

  // An enemy blow at a warded hero: half kept, half (at most the cap) back; she still counters.
  function warded(cap, setup) {
    const e = board(['medic', 'zhang', 'hero']);
    const foe = put(e, 'blade', 5, 7),
      bearer = put(e, 'medic', 4, 7);
    BM.applyCondition(e, bearer, { kind: 'redirect', power: cap, turns: 1 }, unit(e, 'zhang'));
    setup?.(e, foe, bearer);
    G.startEnemy(e);
    const raw = G.damage(foe, bearer, false, e.mapIndex, e);
    const life = { foe: foe.hp, bearer: bearer.hp, protects: unit(e, 'zhang').mastery.protects };
    G.enemyAct(e, foe);
    return { e, foe, bearer, raw, life, counter: Math.max(2, Math.round(G.damage(bearer, foe, false, e.mapIndex, e) * 0.55)) };
  }
  const w = warded(24);
  check('the bearer takes half', w.life.bearer - w.bearer.hp === Math.round(w.raw * 0.5), w.life.bearer - w.bearer.hp + ' of ' + w.raw);
  check('the striker takes the other half, and her counter', w.life.foe - w.foe.hp === Math.round(w.raw * 0.5) + w.counter, w.life.foe - w.foe.hp);
  check('the ward is used up', !w.bearer.conditions?.redirect);
  check('it counts as 張無忌 protecting', unit(w.e, 'zhang').mastery.protects === w.life.protects + 1);
  const capped = warded(1);
  check('what is turned back is at most the cap', capped.life.foe - capped.foe.hp === 1 + capped.counter, capped.life.foe - capped.foe.hp);
  const felled = warded(24, (e, foe) => (foe.hp = 2));
  check('the turned share can fell the striker', felled.foe.hp === 0 && felled.bearer.hp === felled.life.bearer - Math.round(felled.raw * 0.5));
  const cut = warded(24, (e, foe, b) => BM.applyCondition(e, b, { kind: 'stance', power: 30, turns: 1 }, b));
  check('the kept half is then cut by 卸勁', cut.life.bearer - cut.bearer.hp === Math.round(Math.round(cut.raw * 0.5) * 0.7));

  // A signature on a warded hero still puts its effect on her.
  const sig = board(['medic', 'zhang', 'hero']);
  put(sig, 'chief', 5, 7);
  const target = put(sig, 'medic', 4, 7);
  BM.applyCondition(sig, target, { kind: 'redirect', power: 24, turns: 1 }, unit(sig, 'zhang'));
  sig.round = 3;
  G.startEnemy(sig);
  G.enemyAct(sig, unit(sig, 'chief'));
  check('the signature’s effect still lands on the bearer', !!target.conditions?.weak && !target.conditions?.redirect);

  // With 代受, the coverer's own guard counts, not the companion's.
  const cv = warded(24, (e) => {
    const guo = put(e, 'zhang', 4, 6);
    BM.applyCondition(e, guo, { kind: 'cover', power: 1, turns: 1 }, guo);
  });
  check('a covered companion keeps her ward', !!cv.bearer.conditions?.redirect && cv.bearer.hp === cv.life.bearer);

  // The enemy dislikes striking a warded hero.
  const choose = (ward) => {
    const a = board(['medic', 'hero', 'zhang']);
    const foe = Object.assign(put(a, 'blade', 6, 7), { step: 0, range: 2 });
    const m = Object.assign(put(a, 'medic', 4, 7), { hp: 60 });
    const h = Object.assign(put(a, 'hero', 8, 7), { hp: 70 });
    if (ward) BM.applyCondition(a, m, { kind: 'redirect', power: 24, turns: 1 }, unit(a, 'zhang'));
    G.startEnemy(a);
    const hp = [m.hp, h.hp];
    G.enemyAct(a, foe);
    return m.hp < hp[0] ? 'medic' : h.hp < hp[1] ? 'hero' : 'none';
  };
  check('unwarded, the weaker is struck', choose(false) === 'medic');
  check('warded, the other is', choose(true) === 'hero');

  // The villain's 斗轉星移, while charged.
  const mirror = { redirect: { while: 'charged', keep: 0, back: 0.5 } };
  withTraits('chief', mirror, () => {
    const v = board();
    const hero = put(v, 'hero', 4, 7),
      boss = put(v, 'chief', 5, 7);
    teach(hero, defineArt({ debuff: { stat: 'def', power: 3, turns: 2 }, mp: 2 }));
    const open = G.forecast(hero, boss, true, v);
    v.round = 3;
    const f = G.forecast(hero, boss, true, v);
    const back = Math.round(open.rawHits.reduce((a, b) => a + b, 0) * 0.5);
    check('charged, the preview shows no damage, no effect, no counter', f.amount === 0 && !f.effects.length && f.counterRaw === 0);
    check('and says what comes back', f.notes.includes('斗轉星移 · 余滄海不受此擊，反震 ' + back) && f.rebound === back, f.notes);
    check('the self bar takes it', P.attackPage(v, 'hero', 'chief', true).includes('→ ' + (hero.hp - back)));
    const life = [hero.hp, boss.hp];
    G.resolve(v, hero, boss, true);
    check('the master takes nothing and gets no effect', boss.hp === life[1] && !boss.conditions?.exposed);
    check('the striker takes half', life[0] - hero.hp === back, life[0] - hero.hp);
    check('the charge is spent', boss.signatureRound === 3 && G.roundsToSignature(v, boss) > 0);
    check('the log says so', v.logs.some((l) => l.text.startsWith('斗轉星移反震令狐冲')));

    // Never below 1; shields first; not when uncharged or sealed.
    const low = board();
    const weak = Object.assign(put(low, 'hero', 4, 7), { hp: 5 });
    put(low, 'chief', 5, 7);
    low.round = 3;
    G.resolve(low, weak, unit(low, 'chief'), false);
    check('it never takes a hero below 1', weak.hp === 1);
    const sh = board();
    const guarded = put(sh, 'hero', 4, 7);
    put(sh, 'chief', 5, 7);
    BM.applyCondition(sh, guarded, { kind: 'shield', power: 4, turns: 1 }, guarded);
    sh.round = 3;
    const sf = G.forecast(guarded, unit(sh, 'chief'), false, sh);
    check('the hero’s shield takes it first', sf.rebound === sf.turned.back - 4);
    v.round = 4;
    check('not charged, the blow lands as usual', G.forecast(hero, boss, false, v).amount > 0);
    const sealed = board();
    const sb = put(sealed, 'chief', 5, 7);
    put(sealed, 'hero', 4, 7);
    sealed.round = 3;
    BM.applyCondition(sealed, sb, { kind: 'seal', power: 1, turns: 1 }, sb);
    check('a sealed master cannot mirror', G.forecast(unit(sealed, 'hero'), sb, false, sealed).amount > 0);
  });
}

// ── 閃身 evade (§6, §8) ──────────────────────────────────────────────────
section('evade');
{
  const evade = (u, s) => BM.applyCondition(s, u, { kind: 'evade', power: 1, turns: 1 }, u);
  // 段譽's art, a ground one: he steps, and the condition is his once he lands.
  const s = board(['duan', 'hero', 'medic']);
  const duan = put(s, 'duan', 4, 7);
  teach(duan, defineArt({ target: 'ground', blink: true, range: 2, mp: 2, evade: true, factor: undefined }));
  const f = G.forecast(duan, { x: 6, y: 7 }, true, s);
  check('the preview names it', f.notes.includes('閃身 · 下一次直接攻擊落空'));
  G.resolve(s, duan, { x: 6, y: 7 }, true);
  check('閃身 lands on the caster after the step', duan.x === 6 && duan.conditions?.evade?.through === 1);
  check('a save with it restores', !!unit(R.restoreRun(copy(s)), 'duan').conditions?.evade);

  // The next enemy blow misses whole: no damage, no effect, no counter; the next one lands.
  const e = board(['duan', 'hero', 'medic']);
  const d = put(e, 'duan', 4, 7);
  const boss = put(e, 'chief', 5, 7),
    blade = put(e, 'blade', 4, 8);
  evade(d, e);
  e.round = 3;
  G.startEnemy(e);
  const life = [d.hp, boss.hp];
  G.enemyAct(e, boss);
  check('the blow misses', d.hp === life[0]);
  check('its signature effect does not land', !d.conditions?.weak);
  check('he does not counter it', boss.hp === life[1]);
  check('閃身 is used up', !d.conditions?.evade && e.logs.some((l) => l.text === '閃身避開，這一擊落空。'));
  G.enemyAct(e, blade);
  check('the next blow lands', d.hp < life[0]);

  // A hero's strike at an evading piece: every hit misses, the splash does not, and it stays
  // for the splash.
  const h = board();
  const hero = put(h, 'hero', 4, 7);
  const a = put(h, 'chief', 5, 7),
    b = put(h, 'scout', 5, 8);
  evade(a, h);
  evade(b, h);
  teach(hero, defineArt({ hits: [0.6, 0.6], splash: 0.5, mp: 2, debuff: { stat: 'def', power: 3, turns: 2 } }));
  const hf = G.forecast(hero, a, true, h);
  check('every hit of the action misses', hf.amount === 0 && hf.rawHits.every((n) => n === 0) && hf.counterRaw === 0 && !hf.effects.length);
  check('the preview says so', hf.notes.includes('閃身 · 余滄海閃開此擊，不還擊'));
  check('the splash still lands', hf.splash.some((v) => v.id === 'scout' && v.amount > 0));
  const bl = b.hp;
  G.resolve(h, hero, a, true);
  check('the evader is untouched and its 閃身 spent', a.hp === a.maxHp && !a.conditions?.evade && !a.conditions?.exposed);
  check('splash neither misses nor spends it', b.hp < bl && !!b.conditions?.evade);

  // 代受 first: the coverer's 閃身 counts; the companion's own is not touched.
  const c = board(['medic', 'guo', 'hero']);
  const foe = Object.assign(put(c, 'blade', 6, 7), { step: 0, range: 2 });
  const m = put(c, 'medic', 4, 7),
    guo = put(c, 'guo', 5, 7);
  BM.applyCondition(c, guo, { kind: 'cover', power: 1, turns: 1 }, guo);
  evade(guo, c);
  evade(m, c);
  G.startEnemy(c);
  G.enemyAct(c, foe);
  check('the coverer’s 閃身 takes the blow', guo.hp === guo.maxHp && !guo.conditions?.evade);
  check('the companion’s is left for later', !!m.conditions?.evade && m.hp === m.maxHp);

  // The enemy prefers any other target; with none, it strikes and wastes the action.
  const ai = (evading, alone) => {
    const a = board(['medic', 'hero', 'guard']);
    const foe = Object.assign(put(a, 'blade', 6, 7), { step: 0, range: 2 });
    const weak = Object.assign(put(a, 'medic', 4, 7), { hp: 30 });
    const other = alone ? null : put(a, 'hero', 8, 7);
    if (evading) evade(weak, a);
    G.startEnemy(a);
    const hp = [weak.hp, other?.hp];
    G.enemyAct(a, foe);
    return { weak: weak.hp < hp[0], other: other && other.hp < hp[1], left: !!weak.conditions?.evade };
  };
  check('it strikes the weakest when she has no 閃身', ai(false).weak);
  const shy = ai(true);
  check('it goes for another when she has', !shy.weak && shy.other && shy.left);
  const only = ai(true, true);
  check('with no other, it strikes her and wastes the blow', !only.weak && !only.left);
}

// ── 挑釁 taunt (§6, §8) ──────────────────────────────────────────────────
section('taunt');
{
  const taunt = (u, s) => BM.applyCondition(s, u, { kind: 'taunt', power: 2, turns: 1 }, u);
  const s = board(['guard', 'hero', 'medic']);
  const guard = put(s, 'guard', 4, 7);
  put(s, 'blade', 5, 7);
  teach(guard, defineArt({ taunt: 2, safe: true, mp: 2 }));
  check('the preview names it', G.forecast(guard, unit(s, 'blade'), true, s).notes.includes('挑釁 · 至下回合，兩格內可攻到他的敵人只能攻擊他'));
  G.resolve(s, guard, unit(s, 'blade'), true);
  check('挑釁 lands on the caster until his next turn', guard.conditions?.taunt?.power === 2 && guard.conditions.taunt.through === 1);
  check('a save with it restores', unit(R.restoreRun(copy(s)), 'guard').conditions?.taunt?.power === 2);

  // An enemy that starts within two tiles and can reach him must strike him, though another
  // hero is the cheaper target; one that starts farther, or cannot reach him, acts as usual.
  function scene(foeId, foeAt, guardAt, setup) {
    return loose(() => looseScene(foeId, foeAt, guardAt, setup));
  }
  function looseScene(foeId, foeAt, guardAt, setup) {
    const e = board(['guard', 'hero', 'medic']);
    const foe = put(e, foeId, ...foeAt);
    const g = put(e, 'guard', ...guardAt);
    const weak = Object.assign(put(e, 'hero', 5, 6), { hp: 20 });
    taunt(g, e);
    setup?.(e, foe, g);
    G.startEnemy(e);
    const hp = [g.hp, weak.hp, g.mastery.protects];
    const bound = G.taunters(e, foe).map((v) => v.id);
    G.enemyAct(e, foe);
    return { e, foe, bound, guard: g.hp < hp[0], weak: weak.hp < hp[1], protects: g.mastery.protects - hp[2] };
  }
  const near = scene('blade', [5, 7], [3, 7]);
  check('within two tiles and able to reach him, it is bound', same(near.bound, ['guard']));
  check('it strikes the taunter, not the weaker hero', near.guard && !near.weak);
  check('drawing the blow counts as protecting', near.protects === 1);
  const page = board(['guard', 'hero', 'medic']);
  put(page, 'blade', 5, 7);
  taunt(put(page, 'guard', 3, 7), page);
  check('the enemy page of a bound enemy says whom it must strike', P.enemyPage(page, 'blade').includes('受挑釁 · 本回合須攻擊向問天'));
  check('one out of radius says nothing', !P.enemyPage(page, 'chief').includes('受挑釁'));
  const far = scene('blade', [6, 7], [3, 7]);
  check('three tiles off at the start of its action, it is not bound', !far.bound.length && far.weak && !far.guard);
  const stuck = scene('blade', [5, 7], [3, 7], (e, foe) => (foe.step = 0));
  check('unable to reach him this turn, it is not bound', !stuck.bound.length && stuck.weak);
  const boss = scene('chief', [5, 7], [3, 7]);
  check('a master obeys it too', boss.guard && !boss.weak);
  // 代受 still applies after: the taunter's coverer takes the blow.
  const covered = scene('blade', [5, 7], [3, 7], (e) => {
    const guo = put(e, 'medic', 2, 7);
    BM.applyCondition(e, guo, { kind: 'cover', power: 1, turns: 1 }, guo);
    guo.hp = guo.maxHp = 300;
  });
  check('a coverer beside the taunter takes the blow', !covered.guard && !covered.weak && unit(covered.e, 'medic').hp < 300);
}

// ── 回身 glide (§2, §9.4) ────────────────────────────────────────────────
section('glide');
{
  const F = await load('ui/action-flow.js');
  const MF = await load('rules/move-facts.js');
  check('回身 is a form with the spec’s rule', same(FR.FORM_RULES.glide, ['回身', '出招後仍可走完本回合未用的步數，走後不能撤步。']));
  // The steps walked are the terrain cost of the path, cleared by undo.
  const w = board(['hero', 'xiao', 'medic']);
  const xiao = put(w, 'xiao', 5, 7);
  check('xiao walks four', G.stat(xiao, 'step', w) === 4);
  G.move(w, xiao, 4, 8);
  check('a move records its terrain cost', xiao.walked === 3, xiao.walked);
  G.undo(w, xiao);
  check('undo clears it', !('walked' in xiao));

  // A glide art: struck, then the rest of the steps to walk once.
  const s = board(['hero', 'xiao', 'medic']);
  const x = put(s, 'xiao', 3, 7);
  put(s, 'blade', 6, 7);
  const art = teach(x, defineArt({ forms: ['glide'], mp: 2 }));
  G.move(s, x, 5, 7);
  const f = G.forecast(x, unit(s, 'blade'), true, s);
  check('the preview says how far he may walk after', f.notes.includes('回身 · 出招後尚可走 2 步'), f.notes);
  check('the art’s facts name the form', MF.moveFacts(s, x, art).effectLines.includes('回身'));
  const hit = G.resolve(s, x, unit(s, 'blade'), true);
  check('resolve reports the steps left', hit.glide === 2 && x.glideLeft === 2);
  check('he has acted, and may glide', x.acted && !G.canAct(s, x) && G.canGlide(s, x));
  const field = G.glideField(s, x);
  check('the glide field is bounded by the steps left', field.costs.has(G.key(5, 6)) && !field.costs.has(G.key(8, 7)) && [...field.costs.values()].every((n) => n <= 2));
  check('nor ends on another piece', !field.costs.has(G.key(6, 7)));
  const back = R.restoreRun(copy(s));
  check('a save mid-glide restores it', G.canGlide(back, unit(back, 'xiao')));
  const rows = F.glideRows(s, x);
  check('his list offers only the walk and staying', rows.includes('回身 2 步') && rows.includes('data-do="glide-stop"') && rows.includes('不走了') && !rows.includes('撤步'));
  check('no other hero’s list does', !F.glideRows(s, unit(s, 'hero')));
  F.braceTheRest(s);
  check('the end-of-turn brace leaves a gliding hero alone', !x.brace && G.canGlide(s, x));
  check('nor is a gliding hero the next to act', F.nextToAct(s) !== x);
  check('a tile out of reach is refused', !G.glideMove(s, x, 8, 7) && x.glideLeft === 2);
  const steps = x.mastery.steps;
  check('the walk is taken', G.glideMove(s, x, 4, 6) && x.x === 4 && x.y === 6);
  check('it is spent, with no way back', x.glideLeft === 0 && !G.canGlide(s, x) && !x.origin && !G.undo(s, x));
  check('its steps count', x.mastery.steps === steps + 2);
  check('only once', !G.glideMove(s, x, 4, 7));

  // Not moving first leaves the whole step; declining ends it; the turn's end loses it.
  const t = board(['hero', 'xiao', 'medic']);
  const y = put(t, 'xiao', 5, 7);
  put(t, 'blade', 6, 7);
  teach(y, defineArt({ forms: ['glide'], mp: 2 }));
  check('without a move the whole step is left', G.resolve(t, y, unit(t, 'blade'), true).glide === 4);
  check('declining the walk ends it', G.stopGlide(t, y) && y.glideLeft === 0 && !G.canGlide(t, y));
  const lost = board(['hero', 'xiao', 'medic']);
  const z = put(lost, 'xiao', 5, 7);
  put(lost, 'blade', 6, 7);
  teach(z, defineArt({ forms: ['glide'], mp: 2, safe: true }));
  G.resolve(lost, z, unit(lost, 'blade'), true);
  quietTurn(lost);
  check('the turn’s end loses it', !('glideLeft' in z) && !('walked' in z) && !G.canGlide(lost, z));

  // 立樁 forbids it; 絆足 shortens it; a walk that used every step leaves none.
  const r = board(['hero', 'xiao', 'medic']);
  const rooted = put(r, 'xiao', 5, 7);
  put(r, 'blade', 6, 7);
  teach(rooted, defineArt({ forms: ['glide'], mp: 2, safe: true }));
  BM.applyCondition(r, rooted, { kind: 'rooted', power: 1, turns: 1 }, rooted);
  check('under 立樁 the preview offers no walk', !G.forecast(rooted, unit(r, 'blade'), true, r).notes.some((n) => n.startsWith('回身')));
  check('and the strike leaves none', !G.resolve(r, rooted, unit(r, 'blade'), true).glide && !G.canGlide(r, rooted));
  const p = board(['hero', 'xiao', 'medic']);
  const pinned = put(p, 'xiao', 5, 7);
  put(p, 'blade', 6, 7);
  teach(pinned, defineArt({ forms: ['glide'], mp: 2, safe: true }));
  BM.applyCondition(p, pinned, { kind: 'pin', power: 2, turns: 1 }, pinned);
  check('絆足 shortens it', G.resolve(p, pinned, unit(p, 'blade'), true).glide === 2);
  const full = board(['hero', 'xiao', 'medic']);
  const h = put(full, 'hero', 3, 7);
  put(full, 'blade', 7, 7);
  teach(h, defineArt({ forms: ['glide'], mp: 2, safe: true }));
  G.move(full, h, 6, 7);
  check('a hero who walked every step has none left', !G.resolve(full, h, unit(full, 'blade'), true).glide && !('glideLeft' in h));

  // The villain's 游擊: after its blow it walks off, as far from the heroes as it can.
  withTraits('chief', { glide: 2 }, () => {
    const v = board();
    const boss = put(v, 'chief', 5, 7);
    const hero = put(v, 'hero', 4, 7);
    G.startEnemy(v);
    const life = [hero.hp, boss.hp];
    G.enemyAct(v, boss);
    check('it strikes from where it stands', hero.hp < life[0]);
    check('then walks off two steps, as far from the heroes as it can', boss.x === 7 && boss.y === 7 && same(boss.route, [{ x: 5, y: 7 }, { x: 6, y: 7 }, { x: 7, y: 7 }]), [boss.x, boss.y]);
    check('the log says so', v.logs.some((l) => l.text === '出手後退開 2 步。'));
    const tight = board();
    const b2 = put(tight, 'chief', 6, 7);
    put(tight, 'hero', 4, 7);
    G.startEnemy(tight);
    G.enemyAct(tight, b2);
    check('steps spent walking in are not walked again', b2.x === 6 && b2.y === 7 && same(tight.units.find((u) => u.id === 'chief').route, [{ x: 6, y: 7 }, { x: 5, y: 7 }, { x: 6, y: 7 }]), JSON.stringify(b2.route));
  });
}

// ── 連環 again (§2, §8, §9.2) ────────────────────────────────────────────
section('again');
{
  const F = await load('ui/action-flow.js');
  const MF = await load('rules/move-facts.js');
  check('連環 is a form with the spec’s rule', same(FR.FORM_RULES.again, ['連環', '此招擊倒主目標時，本回合可再出手一次；每回合限一次。']));
  function setup(fields = {}, hp = 5) {
    const s = board(['hu', 'hero', 'medic']);
    const hu = put(s, 'hu', 3, 7);
    const prey = Object.assign(put(s, 'blade', 5, 7), { hp });
    const art = teach(hu, defineArt({ forms: ['again'], mp: 2, ...fields }));
    hu.mp = hu.maxMp;
    return { s, hu, prey, art };
  }
  // Felling the main target after a move: he acts again from where he stands.
  const { s, hu, prey, art } = setup();
  G.move(s, hu, 4, 7);
  const f = G.forecast(hu, prey, true, s);
  check('the preview says this blow fells and frees another action', f.notes.includes('連環 · 此擊可擊倒，本回合可再出手'));
  check('the art’s facts name the form', MF.moveFacts(s, hu, art).effectLines.includes('連環'));
  const hit = G.resolve(s, hu, prey, true);
  check('felling the target gives another action', hit.again === true && G.canAct(s, hu) && hu.againRound === 1);
  check('he stays moved, and cannot move or take the move back', hu.moved && !G.canMove(s, hu) && !G.undo(s, hu) && !F.undoRow(s, hu));
  check('he can strike again', G.targetOK(s, hu, put(s, 'scout', 4, 6), false));
  const back = R.restoreRun(copy(s));
  check('a save keeps the second action', G.canAct(back, unit(back, 'hu')) && unit(back, 'hu').againRound === 1);
  const kill2 = Object.assign(unit(s, 'scout'), { hp: 1 });
  const second = G.resolve(s, hu, kill2, true);
  check('a second felling the same round gives nothing more', !second.again && !G.canAct(s, hu));
  // The note when the blow will not fell.
  const tough = setup({}, 200);
  put(tough.s, 'hu', 4, 7);
  check('when it will not fell, the preview says what would', G.forecast(tough.hu, tough.prey, true, tough.s).notes.includes('連環 · 擊倒則可再出手'));
  check('and no second action comes', !G.resolve(tough.s, tough.hu, tough.prey, true).again && !G.canAct(tough.s, tough.hu));
  // Not moved first: he may still move.
  const still = setup();
  put(still.s, 'hu', 4, 7);
  G.resolve(still.s, still.hu, still.prey, true);
  check('one who had not moved may still move', G.canMove(still.s, still.hu) && G.move(still.s, still.hu, 3, 6));
  // A splash kill does not count; any hit of a multi-hit does.
  const sp = setup({ splash: 0.9 }, 200);
  put(sp.s, 'hu', 4, 7);
  const side = Object.assign(put(sp.s, 'scout', 5, 6), { hp: 1 });
  G.resolve(sp.s, sp.hu, sp.prey, true);
  check('a splash kill does not count', side.hp === 0 && !G.canAct(sp.s, sp.hu));
  const multi = setup({ hits: [0.6, 0.6] }, 3);
  put(multi.s, 'hu', 4, 7);
  check('the first of two hits felling counts', G.resolve(multi.s, multi.hu, multi.prey, true).again);
  // Restrictions apply to the second action: a once-a-board art cannot go twice.
  const once = setup({ once: true });
  put(once.s, 'hu', 4, 7);
  G.resolve(once.s, once.hu, once.prey, true);
  check('the second action obeys 壓箱', G.canAct(once.s, once.hu) && G.artReady(once.s, once.hu, once.art).reason === '壓箱 · 本局已用');
  // Once per round, and back the next round; the end-of-turn brace takes a hero who declines.
  const r = setup();
  put(r.s, 'hu', 4, 7);
  G.resolve(r.s, r.hu, r.prey, true);
  check('used, the note no longer offers it this round', !G.forecast(r.hu, put(r.s, 'scout', 5, 7), true, r.s).notes.some((n) => n.startsWith('連環')));
  F.braceTheRest(r.s);
  check('a hero who declines the second action is braced', r.hu.brace && r.hu.acted);
  quietTurn(r.s);
  r.hu.mp = r.hu.maxMp;
  const fresh = Object.assign(put(r.s, 'chief', 3, 7), { hp: 1 });
  check('next round it is offered again', G.resolve(r.s, r.hu, fresh, true)?.again === true);
}

// ── 號令 order (§2, §8, §9.1, §9.3) ──────────────────────────────────────
section('order');
{
  const F = await load('ui/action-flow.js');
  const MF = await load('rules/move-facts.js');
  function setup() {
    const s = board(['medic', 'hero', 'guard']);
    const medic = put(s, 'medic', 3, 7),
      hero = put(s, 'hero', 4, 7),
      guard = put(s, 'guard', 5, 6);
    const art = teach(medic, defineArt({ target: 'ally', range: 3, mp: 8, order: true, once: true, factor: undefined }));
    medic.mp = medic.maxMp;
    return { s, medic, hero, guard, art };
  }
  const { s, medic, hero, guard, art } = setup();
  check('a companion who has not acted is no target', !G.targetOK(s, medic, hero, true));
  put(s, 'blade', 5, 7);
  G.move(s, hero, 5, 8);
  G.resolve(s, hero, unit(s, 'blade'), false);
  check('one who has acted is', G.targetOK(s, medic, hero, true));
  check('the caster never is', !G.targetOK(s, medic, medic, true));
  G.waitUnit(s, guard);
  put(s, 'guard', 7, 7);
  check('nor one out of range', !G.targetOK(s, medic, guard, true));
  const f = G.forecast(medic, hero, true, s);
  check('the preview lists him and says what he gets', same(f.recipients.map((e) => e.id), ['hero']) && f.notes.includes('號令 · 令狐冲可再移動並出手一次（本局僅一次）') && f.notes.includes('壓箱 · 每局一次'), f.notes);
  const facts = MF.moveFacts(s, medic, art);
  check('the art’s facts state the rule', facts.powerLabel === '號令' && facts.effectLines.includes('號令 · 令一位本回合已行動的同伴重新移動並出手一次'));
  check('the support preview page names him', P.attackPage(s, 'medic', 'hero', true).includes('<span>號令</span><b class="">令狐冲可再移動並出手一次'));
  hero.brace = true;
  const hit = G.resolve(s, medic, hero, true);
  check('resolve reports whom it ordered', hit.ordered === 'hero');
  check('he may move and act again', G.canAct(s, hero) && G.canMove(s, hero) && !hero.moved && hero.origin === null);
  check('his walk is reset and he is marked', hero.walked === 0 && hero.glideLeft === 0 && hero.orderedRound === 1);
  check('a brace he had stays', hero.brace === true);
  check('the caster’s action is spent', medic.acted && !G.canAct(s, medic));
  check('and the art is used for the board', G.artReady(s, medic, art).reason === '壓箱 · 本局已用');
  const back = R.restoreRun(copy(s));
  check('a save keeps it', G.canAct(back, unit(back, 'hero')) && unit(back, 'hero').orderedRound === 1);
  check('an ordered hero is the next to act', F.nextToAct(s) === hero);
  check('he can move for real', G.move(s, hero, 4, 8) && hero.walked === 2);
  // Declining the order: no free brace; others are braced as usual.
  F.braceTheRest(s);
  check('an ordered hero who declines gets no brace', !hero.acted);
  // The brace he had before stays from his first action; a fresh order on an unbraced hero:
  const t = setup();
  put(t.s, 'blade', 5, 7);
  G.resolve(t.s, t.hero, unit(t.s, 'blade'), false);
  G.resolve(t.s, t.medic, t.hero, true);
  F.braceTheRest(t.s);
  check('declined, he is not braced', !t.hero.brace && !t.hero.acted);
  check('the hero who never acted is', t.guard.brace && t.guard.acted);

  // With 連環: an ordered hero may still trigger it; restrictions apply.
  const a = setup();
  const prey = Object.assign(put(a.s, 'blade', 5, 7), { hp: 200 });
  G.resolve(a.s, a.hero, prey, false);
  G.resolve(a.s, a.medic, a.hero, true);
  const chain = teach(a.hero, defineArt({ forms: ['again'], mp: 2 }));
  prey.hp = 1;
  check('an ordered hero may trigger 連環', G.resolve(a.s, a.hero, prey, true).again === true && G.canAct(a.s, a.hero));
  check('and the ordered action obeys the art’s limits', G.canPay(a.s, a.hero, chain));

  // 立樁: an order gives him an action but no move.
  const r = setup();
  put(r.s, 'blade', 5, 7);
  G.resolve(r.s, r.hero, unit(r.s, 'blade'), false);
  BM.applyCondition(r.s, r.hero, { kind: 'rooted', power: 1, turns: 1 }, r.hero);
  G.resolve(r.s, r.medic, r.hero, true);
  check('a rooted hero ordered may act but not move', G.canAct(r.s, r.hero) && !G.canMove(r.s, r.hero));
}

// ── 吸勁 siphon (§5) ─────────────────────────────────────────────────────
section('siphon');
{
  // A hero beside the master with a 吸勁 art; `mp` is set so the gain is not capped.
  function setup(foe = 'chief') {
    const s = board();
    const u = put(s, 'hero', 4, 7);
    const t = put(s, foe, 5, 7);
    const art = teach(u, defineArt({ forms: ['siphon'], mp: 4, factor: 0.3 }));
    u.mp = 20;
    return { s, u, t, art };
  }
  check('吸勁 has its player rule', same(FR.FORM_RULES.siphon, ['吸勁', '命中後回復 8 點內力，並使目標的絕技延後一回合；同一敵人每回合只延一次，局主不能連續兩回合被延。']));
  {
    const { s, u, t } = setup();
    const before = G.roundsToSignature(s, t);
    const f = G.forecast(u, t, true, s);
    check('the preview names the gain and the delay', f.notes.includes('吸勁 · 內力 ＋8，余滄海絕技延後一回合'), f.notes);
    G.resolve(s, u, t, true);
    check('a blow that lands gives 8 內力 after the art’s price', u.mp === 20 - f.mpCost + 8, u.mp);
    check('and puts the signature back one round', G.roundsToSignature(s, t) === before + 1 && t.signaturePush === 1 && t.lastSiphonRound === 1);
    check('the enemy page counts down to the later round', P.enemyPage(s, 'chief').includes('距蓄勢 ' + (before + 1) + ' 回合'));
    const back = R.restoreRun(copy(s));
    check('the push and the round survive a save', unit(back, 'chief').signaturePush === 1 && unit(back, 'chief').lastSiphonRound === 1);
    // A second 吸勁 the same round (as after 連環 or 號令): 內力 yes, delay no.
    u.acted = false;
    const again = G.forecast(u, t, true, s);
    check('the same enemy is put back only once a round', !again.siphon.delay && again.notes.includes('吸勁 · 內力 ＋8（本回合已延後過）'), again.notes);
    G.resolve(s, u, t, true);
    check('so the push stays at one', t.signaturePush === 1);
    quietTurn(s);
    u.mp = 20;
    const next = G.forecast(u, t, true, s);
    check('a master is not put back two rounds running', !next.siphon.delay && next.notes.includes('吸勁 · 內力 ＋8（局主已換氣，未能延後）'), next.notes);
    G.resolve(s, u, t, true);
    check('nor is the push raised', t.signaturePush === 1 && t.lastSiphonRound === 1);
    quietTurn(s);
    u.mp = 20;
    check('the round after that he can be again', G.forecast(u, t, true, s).siphon.delay);
  }
  {
    const { s, u, t } = setup('blade');
    G.resolve(s, u, t, true);
    quietTurn(s);
    u.mp = 20;
    check('a lieutenant may be put back two rounds running', G.forecast(u, t, true, s).siphon.delay);
    G.resolve(s, u, t, true);
    check('and is', t.signaturePush === 2);
  }
  {
    const { s, u, t } = setup('scout');
    const f = G.forecast(u, t, true, s);
    check('a piece with no signature gives 內力 only', !f.siphon.delay && f.notes.includes('吸勁 · 內力 ＋8'), f.notes);
    u.mp = u.maxMp - 2;
    check('the gain is capped at full 內力', G.forecast(u, t, true, s).siphon.mp === Math.min(8, 2 + G.forecast(u, t, true, s).mpCost));
  }
  {
    const { s, u, t } = setup();
    BM.applyCondition(s, t, { kind: 'shield', power: 999, turns: 2 }, t);
    const f = G.forecast(u, t, true, s);
    check('a blow a shield caught still landed', f.amount === 0 && f.siphon?.mp === 8 && f.siphon.delay);
  }
  {
    const { s, u, t } = setup();
    t.hp = 1;
    const f = G.forecast(u, t, true, s);
    G.resolve(s, u, t, true);
    check('a felled target gives 內力 and is not put back', f.siphon.mp === 8 && !f.siphon.delay && !t.signaturePush);
  }
  {
    // A charged reaction (蓄勢反擊) is un-charged by the delay, so this blow's counter is ordinary.
    const { s, u, t } = setup();
    s.round = 3;
    withTraits('chief', { stance: { while: 'charged', cut: 0, holds: true } }, () => {
      const plain = G.forecast(u, t, false, s);
      check('the master is charged: a basic blow draws a full counter', G.counterRatio(s, t) === 1 && plain.notes.includes('蓄勢反擊 · 還擊全力'));
      const f = G.forecast(u, t, true, s);
      const usual = Math.max(2, Math.round(G.damage(t, u, false, s.mapIndex, s) * 0.55));
      check('吸勁 un-charges him before he counters', f.counterRaw === usual && !f.notes.includes('蓄勢反擊 · 還擊全力'), f.counterRaw + ' vs ' + usual);
      const hp = u.hp;
      G.resolve(s, u, t, true);
      check('and the counter struck at the ordinary ratio', hp - u.hp === usual, hp - u.hp);
      check('he is charged no longer', G.counterRatio(s, t) === 0.55 && G.roundsToSignature(s, t) === 1);
    });
  }
  {
    const { s, u, t } = setup();
    check('the basic attack does not siphon', !G.forecast(u, t, false, s).siphon);
    const MF = await load('rules/move-facts.js');
    check('moveFacts shows the form', MF.moveFacts(s, u, u.activeArt).effectLines.includes('吸勁'));
  }
}

// ── 內傷 wound (§5) ──────────────────────────────────────────────────────
section('wound');
{
  const hurt = (s, u, power = 5) => BM.applyCondition(s, u, { kind: 'wound', power, turns: 2 }, u);
  // Heals of every kind are halved, rounded down, before the cap at missing 氣血.
  {
    const s = board(['medic', 'hero', 'guard']);
    const medic = put(s, 'medic', 4, 7),
      patient = put(s, 'guard', 5, 7);
    const art = teach(medic, defineArt({ target: 'ally', heal: 30, range: 2, mp: 2, factor: undefined }));
    patient.hp = 20;
    const full = G.forecast(medic, patient, true, s).amount;
    hurt(s, patient);
    const f = G.forecast(medic, patient, true, s);
    check('a heal on a wounded ally is halved, rounded down', f.amount === Math.floor(full / 2) && full > 1, f.amount + ' of ' + full);
    check('the preview says so', f.notes.includes('內傷 · 療效減半'), f.notes);
    G.resolve(s, medic, patient, true);
    check('and the heal itself is halved', patient.hp === 20 + Math.floor(full / 2), patient.hp);
    const power = G.healingPower(medic, s, TECHNIQUES[art]);
    patient.hp = patient.maxHp - 5;
    check('halved before the cap at missing 氣血', FR.supportEntry([], medic, patient, G.healAmount(patient, power)).amount === 5);
    const over = FR.supportEntry(['overflow'], medic, patient, G.healAmount(patient, power));
    check('餘氣護身 is the halved power less the heal, still at most 12', over.overflow === Math.min(12, Math.floor(power / 2) - 5), over.overflow);
    const aura = board(['medic', 'hero', 'guard']);
    const caster = put(aura, 'medic', 4, 7),
      a = put(aura, 'hero', 5, 7),
      b = put(aura, 'guard', 5, 6);
    teach(caster, defineArt({ target: 'ally', heal: 30, range: 2, aura: 1, mp: 2 }));
    a.hp = b.hp = 20;
    hurt(aura, b);
    const g = G.forecast(caster, a, true, aura);
    check('an aura names the wounded companion', g.notes.includes('內傷 · 向問天療效減半'), g.notes);
    const shield = board(['zhang', 'hero', 'guard']);
    const z = put(shield, 'zhang', 4, 7),
      ward = put(shield, 'hero', 5, 7);
    teach(z, defineArt({ target: 'ally', shield: { power: 32, turns: 2 }, range: 3, mp: 2 }));
    hurt(shield, ward);
    G.resolve(shield, z, ward, true);
    check('a shield is not halved', ward.conditions?.shield?.power === 32, ward.conditions?.shield?.power);
  }
  {
    const s = board(['medic', 'hero', 'guard']);
    const hero = put(s, 'hero', 8, 8),
      guard = put(s, 'guard', 4, 3);
    s.run.leader = s.leader = 'medic';
    put(s, 'medic', 4, 4);
    hero.hp = guard.hp = 40;
    hurt(s, hero);
    hurt(s, guard);
    const herb = G.terrainInfo(8, 8, s.mapIndex).heal;
    G.startEnemy(s);
    check('herbs heal a wounded hero by half', hero.hp === 40 + Math.floor(herb / 2), hero.hp);
    check('so does the leader’s renew', guard.hp === 40 + Math.floor(BM.COMMANDS.medic.power / 2), guard.hp);
    const e = board();
    const foe = put(e, 'scout', 3, 2);
    foe.hp = 20;
    hurt(e, foe);
    quietTurn(e);
    check('herbs heal a wounded enemy by half', foe.hp === 20 + Math.floor(G.terrainInfo(3, 2, 0).heal / 2), foe.hp);
    const m = board();
    const h = unit(m, 'hero');
    h.hp = 20;
    hurt(m, h);
    G.consume(m, h, 'remedy');
    check('金創藥 heals a wounded hero by half', h.hp === 20 + Math.floor(G.ITEMS.remedy.hp / 2), h.hp);
  }
  {
    // 回生 is a heal too.
    const s = board();
    const u = put(s, 'hero', 4, 7);
    const t = put(s, 'chief', 5, 7);
    teach(u, defineArt({ forms: ['leech'], factor: 2, mp: 2, safe: true }));
    u.hp = 50;
    const full = G.forecast(u, t, true, s).selfHeal;
    hurt(s, u);
    check('回生 is halved on a wounded caster', G.forecast(u, t, true, s).selfHeal === Math.floor(full / 2) && full > 1);
  }
  // After each attack it makes, the bearer loses the power in 氣血: heroes and enemies alike.
  {
    const s = board();
    const u = put(s, 'hero', 4, 7);
    const t = put(s, 'chief', 5, 7);
    teach(u, defineArt({ mp: 2, safe: true }));
    hurt(s, u, 5);
    const f = G.forecast(u, t, true, s);
    check('the preview tells a wounded striker what he will lose', f.selfLoss === 5 && f.notes.includes('內傷 · 出手後自損 5 氣血'), f.notes);
    const shield = 30;
    BM.applyCondition(s, u, { kind: 'shield', power: shield, turns: 2 }, u);
    const hp = u.hp;
    G.resolve(s, u, t, true);
    check('a wounded hero loses 5 after his art, through no shield', u.hp === hp - 5 && u.conditions.shield.power === shield, u.hp + ' / ' + hp);
    const b = board();
    const v = put(b, 'hero', 4, 7);
    const foe = put(b, 'blade', 5, 7);
    hurt(b, v, 5);
    BM.applyCondition(b, foe, { kind: 'seal', power: 1, turns: 1 }, v);
    v.hp = 3;
    const g = G.forecast(v, foe, false, b);
    G.resolve(b, v, foe, false);
    check('after a basic attack too, never below 1', v.hp === 1 && g.selfLoss === 2 && !g.counterRaw, v.hp + ' ' + g.selfLoss);
    const sup = board(['medic', 'hero', 'guard']);
    const medic = put(sup, 'medic', 4, 7);
    const friend = put(sup, 'guard', 5, 7);
    friend.hp -= 30;
    hurt(sup, medic);
    const life = medic.hp;
    G.resolve(sup, medic, friend, true);
    check('a support art is no attack', medic.hp === life);
  }
  {
    const s = board();
    const foe = put(s, 'blade', 4, 7),
      tank = put(s, 'guard', 5, 7);
    hurt(s, foe, 5);
    G.startEnemy(s);
    const before = foe.hp;
    G.enemyAct(s, foe);
    const counter = Math.max(2, Math.round(G.damage(tank, foe, false, s.mapIndex, s) * 0.55));
    check('a wounded enemy loses 5 after it strikes, on top of the counter', before - foe.hp === counter + 5 && s.logs.some((l) => l.text === '內傷發作，損失 5 點氣血。'), before - foe.hp);
    const quiet = board();
    const walker = put(quiet, 'blade', 3, 7);
    put(quiet, 'guard', 8, 3);
    hurt(quiet, walker);
    G.startEnemy(quiet);
    const hp = walker.hp;
    G.enemyAct(quiet, walker);
    check('one that only walks loses nothing', walker.hp === hp);
    const c = board();
    const h = put(c, 'hero', 4, 7),
      target = put(c, 'chief', 5, 7);
    hurt(c, target);
    const life = target.hp;
    const f = G.forecast(h, target, false, c);
    G.resolve(c, h, target, false);
    check('a counter is no attack', target.hp === life - f.amount, target.hp + ' vs ' + (life - f.amount));
  }
}

// ── 反噬 backlash (§3) ───────────────────────────────────────────────────
section('backlash');
{
  const s = board(['hero', 'medic', 'guard']);
  const u = put(s, 'hero', 4, 7);
  const t = put(s, 'chief', 5, 7);
  teach(u, defineArt({ backlash: true, safe: true, mp: 2, factor: 0.2 }));
  const cast = () => {
    u.acted = false;
    u.mp = u.maxMp;
    const f = G.forecast(u, t, true, s);
    G.resolve(s, u, t, true);
    return f;
  };
  const first = cast();
  check('the first use lays one layer and says so', u.conditions.backlash.power === 1 && first.notes.includes('反噬 · 亂氣 1／3') && !first.selfLoss, first.notes);
  const second = cast();
  check('the second lays two', u.conditions.backlash.power === 2 && second.notes.includes('反噬 · 亂氣 2／3'));
  const back = R.restoreRun(copy(s));
  check('the layers survive a save', unit(back, 'hero').conditions.backlash.power === 2);
  BM.applyCondition(s, u, { kind: 'shield', power: 50, turns: 2 }, u);
  u.acted = false;
  u.mp = u.maxMp;
  const loss = Math.ceil(u.maxHp * 0.2);
  const third = G.forecast(u, t, true, s);
  check('the preview warns of the burst before the third use', third.notes.includes('反噬 · 亂氣滿三層，自損 ' + loss + ' 氣血') && third.selfLoss === loss, third.notes);
  check('and the caster’s bar in the preview includes it', P.attackPage(s, 'hero', 'chief', true).includes('→ ' + (u.hp - loss) + '／'));
  const hp = u.hp;
  G.resolve(s, u, t, true);
  check('the third use bursts for a fifth of greatest 氣血, rounded up', u.hp === hp - loss, hp - u.hp + ' vs ' + loss);
  check('not through a shield', u.conditions.shield.power === 50);
  check('and clears the layers', !u.conditions.backlash);
  cast();
  check('the next use starts again at one', u.conditions.backlash.power === 1);
  cast();
  u.hp = 5;
  const low = cast();
  check('a burst never takes him below 1', u.hp === 1 && low.selfLoss === 4, u.hp);
  // A support art with 反噬 counts too: the layer comes whether or not anything was struck.
  const h = board(['medic', 'hero', 'guard']);
  const medic = put(h, 'medic', 4, 7);
  teach(medic, defineArt({ target: 'self', range: 0, shield: { power: 5, turns: 1 }, backlash: true, mp: 2 }));
  G.resolve(h, medic, medic, true);
  check('a support art with it lays a layer too', medic.conditions.backlash?.power === 1);
  // 解厄 clears the layers.
  const c = board(['medic', 'hero', 'guard']);
  const healer = put(c, 'medic', 4, 7),
    sick = put(c, 'hero', 5, 7);
  BM.applyCondition(c, sick, { kind: 'backlash', power: 2, turns: 12 }, sick);
  sick.hp -= 10;
  teach(healer, defineArt({ target: 'ally', heal: 5, range: 2, mp: 2, forms: ['cleanse'] }));
  G.resolve(c, healer, sick, true);
  check('解厄 clears the layers', !sick.conditions?.backlash);
  // The layers last the board, and go with it.
  const b = board();
  const v = put(b, 'hero', 4, 7);
  BM.applyCondition(b, v, { kind: 'backlash', power: 1, turns: G.LIMIT - b.round + 1 }, v);
  for (let i = 0; i < 4; i++) quietTurn(b);
  check('they last round after round', v.conditions?.backlash?.power === 1);
  nextBoard(b);
  check('and are gone on the next board', !v.conditions?.backlash);
  const MF = await load('rules/move-facts.js');
  check('moveFacts states the rule', MF.moveFacts(s, u, u.activeArt).effectLines.includes('反噬 · 每次施展積一層亂氣，第三層時自損兩成最大氣血並清空'), MF.moveFacts(s, u, u.activeArt).effectLines);
}

// ── 布陣 zone (§6) ───────────────────────────────────────────────────────
section('zone');
{
  const MF = await load('rules/move-facts.js');
  const tiles = (list) => list.map((p) => p.x + ',' + p.y).sort().join(' ');
  const inZone = (s, p) => !!G.zoneAt(s, p);
  // 任盈盈 with a ground art that lays a formation three tiles off.
  function setup() {
    const s = board(['medic', 'hero', 'guard']);
    const u = put(s, 'medic', 3, 7);
    const art = teach(u, defineArt({ target: 'ground', zone: true, range: 3, mp: 2, factor: undefined }));
    return { s, u, art };
  }
  {
    const { s, u, art } = setup();
    check('a formation is aimed at an empty walkable tile', G.targetOK(s, u, { x: 5, y: 7 }, true));
    put(s, 'hero', 6, 7);
    check('not at an occupied one', !G.targetOK(s, u, { x: 6, y: 7 }, true));
    check('nor at one that cannot be stood on', !G.targetOK(s, u, { x: 4, y: 5 }, true) && !G.walkable(4, 5, 0));
    const f = G.forecast(u, { x: 5, y: 7 }, true, s);
    check('the preview gives the five tiles', tiles(f.zone) === '4,7 5,6 5,7 5,8 6,7', tiles(f.zone));
    check('and the line', f.notes.includes('布陣 · 五格，至下一敵方回合結束'), f.notes);
    const page = P.attackPage(s, 'medic', { x: 5, y: 7 }, true);
    check('the preview page is titled 布陣 with its own button', page.includes('布陣') && page.includes('布下陣勢') && page.includes('陣眼') && !page.includes('輕功落點'));
    check('moveFacts states the rule', MF.moveFacts(s, u, art).effectLines.some((l) => l.startsWith('布陣 · 以落點為中心布下五格陣勢')));
    G.resolve(s, u, { x: 5, y: 7 }, true);
    check('laying it does not move the caster', u.x === 3 && u.y === 7 && !u.moved && u.acted);
    check('the formation is on the game: owner, tiles, through the next enemy phase', s.zones.length === 1 && s.zones[0].owner === 'medic' && tiles(s.zones[0].tiles) === tiles(f.zone) && s.zones[0].through === 2);
    check('only walkable neighbours count', G.zoneTiles(s, { x: 6, y: 7 }).length === 3);
  }
  {
    // One formation per owner; another hero's stands beside it.
    const { s, u } = setup();
    G.resolve(s, u, { x: 5, y: 7 }, true);
    const guard = put(s, 'guard', 4, 3);
    teach(guard, defineArt({ target: 'ground', zone: true, range: 3, mp: 2 }));
    G.resolve(s, guard, { x: 5, y: 3 }, true);
    check('a second owner’s formation stands beside the first', s.zones.length === 2);
    quietTurn(s);
    const f = G.forecast(u, { x: 3, y: 6 }, true, s);
    check('casting again says the old one goes', f.notes.includes('布陣 · 五格，至下一敵方回合結束（舊陣撤去）'), f.notes);
    G.resolve(s, u, { x: 3, y: 6 }, true);
    const mine = s.zones.filter((z) => z.owner === 'medic');
    check('and replaces it', mine.length === 1 && inZone(s, { x: 3, y: 6 }) && !inZone(s, { x: 5, y: 7 }) && mine[0].through === 3);
    check('the other stays', s.zones.some((z) => z.owner === 'guard'));
  }
  {
    // Expiry: laid in ally phase 1, it holds through enemy phase 2.
    const { s, u } = setup();
    G.resolve(s, u, { x: 5, y: 7 }, true);
    G.startEnemy(s);
    check('it holds in the enemy phase it was laid before', inZone(s, { x: 5, y: 7 }));
    for (const e of G.enemies(s)) e.acted = true;
    G.nextRound(s);
    check('and through the next ally phase', inZone(s, { x: 5, y: 7 }));
    const back = R.restoreRun(copy(s));
    check('a save keeps it', back && tiles(back.zones[0].tiles) === tiles(s.zones[0].tiles));
    G.startEnemy(s);
    check('and the enemy phase after', inZone(s, { x: 5, y: 7 }));
    for (const e of G.enemies(s)) e.acted = true;
    G.nextRound(s);
    check('it is gone when ally phase 3 begins', !s.zones);
    const bad = copy(back);
    bad.zones.push({ owner: 'guard', tiles: [{ x: 'a' }], through: 9 });
    check('a malformed formation in a save is dropped, the save kept', same(R.restoreRun(bad)?.zones.map((z) => z.owner), ['medic']));
  }
  {
    // As a rider on a strike: centred where the target stood, before it is pushed.
    const s = board(['medic', 'hero', 'guard']);
    const u = put(s, 'hero', 4, 7);
    const t = put(s, 'chief', 5, 7);
    teach(u, defineArt({ zone: true, push: true, mp: 2, factor: 0.3 }));
    const f = G.forecast(u, t, true, s);
    check('the strike’s preview gives the tiles round the target', tiles(f.zone) === tiles(G.zoneTiles(s, { x: 5, y: 7 })) && f.notes.includes('布陣 · 五格，至下一敵方回合結束') && !!f.push);
    G.resolve(s, u, t, true);
    check('laid round the tile it was struck on', inZone(s, { x: 5, y: 7 }) && t.x === 6 && s.zones[0].owner === 'hero');
    check('moveFacts says it is laid at the target’s feet', MF.moveFacts(s, u, u.activeArt).effectLines.some((l) => l.startsWith('布陣 · 以目標腳下為中心')));
    const k = board();
    const h = put(k, 'hero', 4, 7);
    const v = put(k, 'scout', 5, 7);
    teach(h, defineArt({ zone: true, mp: 2 }));
    v.hp = 1;
    G.resolve(k, h, v, true);
    check('laid even when the target falls', inZone(k, { x: 5, y: 7 }));
  }
  {
    // Enemy walking: onto a formation tile, never on from one; a start on one is 2 steps short.
    const s = board();
    const scout = put(s, 'scout', 3, 7);
    const open = G.reachable(s, scout);
    s.zones = [{ owner: 'medic', tiles: G.zoneTiles(s, { x: 5, y: 7 }), through: 2 }];
    const field = G.reachable(s, scout);
    check('without it the scout could pass along the row', open.has('6,7'));
    check('with it he may step onto it', field.has('4,7'));
    check('but not beyond it', !field.has('6,7') && !field.has('5,7'));
    const through = [...field.keys()].every((k) => {
      const [x, y] = k.split(',').map(Number);
      return G.movementPath(s, scout, scout, { x, y }).slice(1, -1).every((p) => !inZone(s, p));
    });
    check('no path he can take crosses a formation tile', through);
    check('a hero walks through freely', G.reachable(s, put(s, 'hero', 4, 6)).has('6,7'));
    check('and can move across it', G.move(s, unit(s, 'hero'), 6, 7));
    put(s, 'scout', 4, 7);
    check('a scout starting on it moves 2 less', G.stat(scout, 'step', s) === scout.step - 2);
    BM.applyCondition(s, scout, { kind: 'pin', power: 2, turns: 2 }, scout);
    check('with 絆足 as well, still at least 1', G.stat(scout, 'step', s) === 1);
    const blade = put(s, 'blade', 5, 7);
    check('a two-step blade on it keeps one step', G.stat(blade, 'step', s) === 1);
    check('the enemy page says so', P.enemyPage(s, 'blade').includes('陣中 · 移動 −2'));
    check('a hero on it is shown its defence', G.standingLines(s, unit(s, 'hero')).includes('陣中 · 防禦 ＋4（任盈盈布陣）'));
    check('off it nothing is shown', !G.standingLines(s, put(s, 'guard', 8, 3)).length);
  }
  {
    // In the enemy phase: the scout walks in and stops.
    const s = board(['guard', 'hero', 'medic']);
    unit(s, 'hero').hp = unit(s, 'medic').hp = 0;
    const scout = put(s, 'scout', 3, 7);
    put(s, 'guard', 8, 7);
    s.zones = [{ owner: 'medic', tiles: G.zoneTiles(s, { x: 5, y: 7 }), through: 2 }];
    G.startEnemy(s);
    G.enemyAct(s, scout);
    check('an enemy whose only way runs through it stops on it', inZone(s, scout), scout.x + ',' + scout.y);
    check('its route enters no formation tile before the last', (scout.route || []).slice(1, -1).every((p) => !inZone(s, p)));
  }
  {
    // The approach search (board 1, an open plain): a formation ahead is walked round when a way
    // round is shorter than stopping in it, and walked into when it closes the only way.
    function plain(zone) {
      const s = board(['guard', 'hero', 'medic']);
      s.mapIndex = 1;
      unit(s, 'chief').id = G.commanderId(s);
      const spots = [[10, 8], [11, 8], [12, 8], [13, 8], [11, 9], [12, 9], [11, 10]];
      s.units.forEach((u, i) => Object.assign(u, { x: spots[i][0], y: spots[i][1] }));
      unit(s, 'hero').hp = unit(s, 'medic').hp = 0;
      const scout = put(s, 'scout', 6, 5);
      put(s, 'guard', 12, 5);
      if (zone) s.zones = [{ owner: 'medic', tiles: G.zoneTiles(s, zone), through: 9 }];
      G.startEnemy(s);
      G.enemyAct(s, scout);
      return { s, scout };
    }
    const straight = plain(null).scout;
    check('on open ground the scout comes straight along the row', straight.x === 9 && straight.y === 5);
    const round = plain({ x: 10, y: 5 });
    check('with a formation ahead it takes the way round', round.scout.y !== 5 && !inZone(round.s, round.scout), round.scout.x + ',' + round.scout.y);
    const shut = plain({ x: 7, y: 5 });
    check('where the formation shuts the way it walks into it and stops', inZone(shut.s, shut.scout) && shut.scout.x === 7, shut.scout.x + ',' + shut.scout.y);
  }
  {
    // The danger zone with a formation in the way.
    const s = board();
    put(s, 'scout', 3, 7);
    const before = dangerTiles(s);
    s.zones = [{ owner: 'medic', tiles: G.zoneTiles(s, { x: 4, y: 7 }), through: 2 }];
    const after = dangerTiles(s);
    check('the danger zone redraws for a formation', before !== after && after.size < before.size);
    check('it reaches no tile past the formation the scout cannot get to', before.has('7,7') && !after.has('7,7'));
    // Exact: every tile drawn is in reach of somewhere an enemy can stand this turn, and back.
    const stands = G.enemies(s).flatMap((e) =>
      [{ x: e.x, y: e.y }, ...[...G.reachable(s, e).keys()].map((k) => ({ x: +k.split(',')[0], y: +k.split(',')[1] }))].map((p) => ({ ...p, e }))
    );
    const exact = [...after].every((k) => {
      const [x, y] = k.split(',').map(Number);
      return stands.some((p) => G.distance(p, { x, y }) <= G.strikeReach(s, p.e));
    }) && stands.every((p) => after.has(p.x + ',' + p.y));
    check('and every tile it draws is one an enemy can strike', exact);
    s.zones = null;
    check('it forgets the formation once it is gone', dangerTiles(s).size === before.size);
  }
}

// ── 失神 daze (§5) ───────────────────────────────────────────────────────
section('daze');
{
  const MF = await load('rules/move-facts.js');
  function setup(daze, foe = 'chief') {
    const s = board();
    const u = put(s, 'hero', 4, 7);
    const t = put(s, foe, 5, 7);
    const art = teach(u, defineArt({ daze, safe: true, mp: 2, factor: 0.2 }));
    return { s, u, t, art };
  }
  {
    const { s, u, t } = setup(true);
    const f = G.forecast(u, t, true, s);
    check('the preview says the target loses its next action', f.notes.includes('失神 · 余滄海失去下一次行動') && f.effects.some((e) => e.kind === 'daze'), f.notes);
    G.resolve(s, u, t, true);
    check('失神 lands until the end of this enemy phase', t.conditions?.daze?.through === 1 && t.lastDazeRound === 1);
    check('the chip shows it', BM.activeEffects(t, s.round).some((l) => l.startsWith('失神')));
    check('the enemy page says he will not strike this turn', P.enemyPage(s, 'chief').includes('本回合失神，不會出手'));
    check('a save keeps it', !!unit(R.restoreRun(copy(s)), 'chief').conditions?.daze && unit(R.restoreRun(copy(s)), 'chief').lastDazeRound === 1);
    // A second hero strikes the dazed master: he still counters, and the preview says both.
    const guard = put(s, 'guard', 5, 6);
    const g = G.forecast(guard, t, false, s);
    check('a dazed enemy still counters, and the preview says it will not act', g.counterRaw > 0 && g.notes.includes('失神 · 余滄海本回合不會行動'), g.notes);
    const dazed = new Set(dangerTiles(s));
    const daze = t.conditions.daze;
    delete t.conditions.daze;
    const awake = new Set(dangerTiles(s));
    t.conditions.daze = daze;
    check('the danger zone leaves out a dazed enemy', awake.has('6,7') && !dazed.has('6,7') && dazed.size < awake.size);
    const hp = [u.hp, guard.hp],
      at = [t.x, t.y];
    G.startEnemy(s);
    const effects = G.enemyAct(s, t);
    check('in the enemy phase it does nothing', t.x === at[0] && t.y === at[1] && u.hp === hp[0] && guard.hp === hp[1] && t.acted);
    check('the condition is spent, and the action reports it', !t.conditions?.daze && same(effects, [['chief', '失神', 'status']]));
    check('the log says so', s.logs.at(-1).text === '失神，錯過了這一手。' && s.logs.at(-1).who === '余滄海');
  }
  {
    // His signature, if due, stays due.
    const { s, u, t } = setup(true);
    s.round = 3;
    check('the master’s signature is due', G.signatureDue(s, t));
    G.resolve(s, u, t, true);
    G.startEnemy(s);
    G.enemyAct(s, t);
    for (const e of G.enemies(s)) e.acted = true;
    G.nextRound(s);
    check('after losing his action it is still due', G.signatureDue(s, t) && !Number.isInteger(t.signatureRound));
  }
  {
    // A master shakes off a daze the round after one; a lieutenant does not.
    const { s, u, t } = setup(true);
    G.resolve(s, u, t, true);
    quietTurn(s);
    u.mp = u.maxMp;
    const f = G.forecast(u, t, true, s);
    check('the round after, the master resists', !f.effects.some((e) => e.kind === 'daze') && f.notes.includes('局主已換氣，本回合抵抗失神'), f.notes);
    G.resolve(s, u, t, true);
    check('and is not dazed', !t.conditions?.daze && t.lastDazeRound === 1);
    quietTurn(s);
    u.mp = u.maxMp;
    G.resolve(s, u, t, true);
    check('the round after that he can be again', !!t.conditions?.daze && t.lastDazeRound === 3);
    const l = setup(true, 'blade');
    G.resolve(l.s, l.u, l.t, true);
    quietTurn(l.s);
    l.u.mp = l.u.maxMp;
    G.resolve(l.s, l.u, l.t, true);
    check('a lieutenant is dazed two rounds running', !!l.t.conditions?.daze);
  }
  {
    // 'setup': only on a disarmed target, or one standing in a formation.
    const { s, u, t, art } = setup('setup', 'blade');
    const f = G.forecast(u, t, true, s);
    check('without the setup it does not daze, and says so', !f.effects.some((e) => e.kind === 'daze') && f.notes.includes('條件未成 · 未能失神'), f.notes);
    G.resolve(s, u, t, true);
    check('nor does the strike', !t.conditions?.daze);
    check('moveFacts states the setup', MF.moveFacts(s, u, art).effectLines.includes('失神 · 目標兵刃遭纏或站在陣中時，失去下一次行動'));
    quietTurn(s);
    u.mp = u.maxMp;
    BM.applyCondition(s, t, { kind: 'disarm', power: 5, turns: 2 }, u);
    const g = G.forecast(u, t, true, s);
    check('on a disarmed target it dazes', g.effects.some((e) => e.kind === 'daze') && g.notes.includes('失神 · ' + G.unitDetails(t).name + '失去下一次行動'));
    G.resolve(s, u, t, true);
    check('and the strike lands it', !!t.conditions?.daze);
    const z = setup('setup', 'blade');
    z.s.zones = [{ owner: 'medic', tiles: G.zoneTiles(z.s, { x: 5, y: 7 }), through: 2 }];
    G.resolve(z.s, z.u, z.t, true);
    check('on a target standing in a formation it dazes', !!z.t.conditions?.daze);
  }
  {
    // Not consumed (it never got to act): gone at the end of the enemy phase all the same.
    const { s, u, t } = setup(true);
    G.resolve(s, u, t, true);
    quietTurn(s);
    check('a daze never spent is gone by the next ally phase', !t.conditions?.daze);
  }
}

// ── Where the two stages meet (§8) ───────────────────────────────────────
section('interactions');
{
  const cond = (s, u, kind, power = 1, turns = 1) => BM.applyCondition(s, u, { kind, power, turns }, u);
  const formation = (s, centre, owner = 'medic') =>
    (s.zones = [{ owner, tiles: G.zoneTiles(s, centre), through: s.round + 1 }]);

  // 代受 with 吸勁 and 失神: the blow, and what rides on it, lands on the coverer.
  withTraits('scout-0', { cover: 'master' }, () => {
    Object.assign(G.DETAILS['scout-0'], { ...G.DETAILS.scout, name: '星宿弟子', traits: { cover: 'master' } });
    const s = board();
    const hero = put(s, 'hero', 4, 7),
      chief = put(s, 'chief', 5, 7),
      scout = put(s, 'scout', 6, 7);
    scout.hp = scout.maxHp = 300;
    teach(hero, defineArt({ forms: ['siphon'], daze: true, mp: 4, factor: 0.3 }));
    hero.mp = 20;
    const push = chief.signaturePush || 0;
    const f = G.forecast(hero, chief, true, s);
    check('a covered blow is planned on the coverer, daze and all', f.coveredBy === 'scout' && f.effects.some((e) => e.kind === 'daze') && f.notes.includes('失神 · 星宿弟子失去下一次行動'), f.notes);
    G.resolve(s, hero, chief, true);
    check('the coverer is dazed, not the master', !!scout.conditions?.daze && !chief.conditions?.daze);
    check('吸勁 draws 內力 from the coverer’s blow', hero.mp === 20 - f.mpCost + 8, hero.mp);
    check('and does not put back the master’s signature', (chief.signaturePush || 0) === push && chief.lastSiphonRound === undefined);
    // A dazed disciple still covers, though it will not act; one in reach of a taunter is not bound.
    G.startEnemy(s);
    check('dazed, it still covers', G.coverer(s, chief) === scout);
    cond(s, put(s, 'guard', 7, 7), 'taunt', 2);
    check('dazed, no taunt binds it', !G.taunters(s, scout).length);
    const life = unit(s, 'guard').hp;
    G.enemyAct(s, scout);
    check('dazed, it does nothing, and the taunter draws no blow', unit(s, 'guard').hp === life && !scout.conditions?.daze);
  });

  // 挪移 and 閃身 with 吸勁, 內傷 and 反噬: a blow that does not land carries none of its riders,
  // but the striker still pays what striking costs him.
  withTraits('chief', { redirect: { while: 'charged', keep: 0, back: 0.5 } }, () => {
    const s = board();
    const hero = put(s, 'hero', 4, 7),
      chief = put(s, 'chief', 5, 7);
    s.round = 3;
    teach(hero, defineArt({ forms: ['siphon'], daze: true, backlash: true, mp: 4, factor: 0.3 }));
    hero.mp = 20;
    cond(s, hero, 'wound', 5, 2);
    const f = G.forecast(hero, chief, true, s);
    check('mirrored, there is no 吸勁 and no 失神', !f.siphon && !f.effects.length && !f.notes.some((n) => n.startsWith('失神') || n.startsWith('吸勁')), f.notes);
    check('the self bar counts the rebound and then 內傷', f.rebound > 0 && f.selfLoss === 5);
    const hp = hero.hp;
    G.resolve(s, hero, chief, true);
    check('the striker takes the rebound and his 內傷', hp - hero.hp === f.rebound + 5, hp - hero.hp);
    check('no 內力 came back, the signature was spent by the mirror, not put back', hero.mp === 20 - f.mpCost && chief.signatureRound === 3 && !chief.signaturePush && !chief.conditions?.daze);
    check('反噬 lays its layer all the same', hero.conditions?.backlash?.power === 1);
  });
  {
    const s = board();
    const hero = put(s, 'hero', 4, 7),
      chief = put(s, 'chief', 5, 7);
    cond(s, chief, 'evade');
    teach(hero, defineArt({ forms: ['siphon'], daze: true, mp: 4, factor: 0.3 }));
    hero.mp = 20;
    cond(s, hero, 'wound', 5, 2);
    const f = G.forecast(hero, chief, true, s);
    check('evaded, no 吸勁 and no 失神 are planned', !f.siphon && !f.effects.length && f.selfLoss === 5);
    const hp = hero.hp;
    G.resolve(s, hero, chief, true);
    check('evaded: no 內力, no delay, no daze; the striker still bleeds', hero.mp === 20 - f.mpCost && !chief.signaturePush && !chief.conditions?.daze && !chief.conditions?.evade && hp - hero.hp === 5);
  }
  // A hero's ward with an enemy who is wounded: the turned share and its own 內傷 both land.
  {
    const s = board(['medic', 'zhang', 'hero']);
    const foe = put(s, 'blade', 5, 7),
      bearer = put(s, 'medic', 4, 7);
    BM.applyCondition(s, bearer, { kind: 'redirect', power: 24, turns: 1 }, unit(s, 'zhang'));
    cond(s, foe, 'wound', 5, 2);
    G.startEnemy(s);
    const raw = G.damage(foe, bearer, false, s.mapIndex, s);
    const counter = Math.max(2, Math.round(G.damage(bearer, foe, false, s.mapIndex, s) * 0.55));
    const life = foe.hp;
    G.enemyAct(s, foe);
    check('a wounded striker of a ward takes the turned half, the counter and its 內傷', life - foe.hp === Math.round(raw * 0.5) + counter + 5, life - foe.hp);
  }

  // 卸勁 and 內傷: the cut is on enemy blows, never on what the wound costs.
  {
    const s = board(['guard', 'hero', 'medic']);
    const guard = put(s, 'guard', 4, 7);
    const foe = put(s, 'blade', 5, 7);
    cond(s, guard, 'stance', 30);
    cond(s, guard, 'wound', 5, 2);
    const f = G.forecast(guard, foe, false, s);
    check('a stanced, wounded striker’s 內傷 is whole in the preview', f.selfLoss === 5);
    const hp = guard.hp;
    G.resolve(s, guard, foe, false);
    check('and in the strike', hp - guard.hp === f.counter + 5, hp - guard.hp);
    const e = board(['guard', 'hero', 'medic']);
    const tank = put(e, 'guard', 4, 7),
      blade = put(e, 'blade', 5, 7);
    cond(e, tank, 'stance', 30);
    cond(e, blade, 'wound', 5, 2);
    G.startEnemy(e);
    const raw = G.damage(blade, tank, false, e.mapIndex, e);
    const [a, b] = [tank.hp, blade.hp];
    G.enemyAct(e, blade);
    const counter = Math.max(2, Math.round(G.damage(tank, blade, false, e.mapIndex, e)));
    check('a wounded enemy’s blow on a stanced hero is cut; its 內傷 is not', a - tank.hp === Math.round(raw * 0.7) && b - blade.hp === counter + 5, [a - tank.hp, b - blade.hp]);
  }

  // 挑釁 and 布陣: bound only if it can strike the taunter this turn, formations included.
  {
    const scene = (zoned, start = [6, 7]) => {
      const s = board(['guard', 'hero', 'medic']);
      const scout = put(s, 'scout', ...start);
      const guard = put(s, 'guard', 2, 7);
      cond(s, guard, 'taunt', 4);
      if (zoned) formation(s, { x: 4, y: 7 });
      return { s, scout, guard };
    };
    const open = scene(false);
    check('with the way clear it is bound', G.taunters(open.s, open.scout).length === 1);
    const shut = scene(true);
    check('a formation it must stop in keeps it from him: not bound', !G.taunters(shut.s, shut.scout).length);
    check('so its page says nothing of it', !P.enemyPage(shut.s, 'scout').includes('受挑釁'));
    // The taunter himself stands in a formation: tiles beside him are formation tiles, which may
    // be stepped onto.
    const s = board(['guard', 'hero', 'medic']);
    const foe = put(s, 'blade', 5, 7);
    const guard = put(s, 'guard', 3, 7);
    Object.assign(put(s, 'hero', 5, 6), { hp: 20 });
    cond(s, guard, 'taunt', 2);
    formation(s, { x: 3, y: 7 });
    check('a taunter in a formation still binds an enemy that can step into it', G.taunters(s, foe).length === 1);
    G.startEnemy(s);
    const hp = guard.hp;
    loose(() => G.enemyAct(s, foe));
    check('which strikes him from the formation’s edge', guard.hp < hp && G.zoneAt(s, foe));
    // Starting on a formation, it has two steps less to reach him with.
    const slow = scene(false, [5, 7]);
    formation(slow.s, { x: 5, y: 7 });
    check('starting in a formation, a taunter three tiles beyond its step is out of reach', !G.taunters(slow.s, slow.scout).length, G.stat(slow.scout, 'step', slow.s));
  }

  // 回身 through 布陣: heroes walk through freely; a villain stops in one.
  {
    const s = board(['hero', 'xiao', 'medic']);
    const x = put(s, 'xiao', 3, 7);
    put(s, 'blade', 6, 7);
    teach(x, defineArt({ forms: ['glide'], mp: 2, safe: true }));
    G.move(s, x, 5, 7);
    G.resolve(s, x, unit(s, 'blade'), true);
    formation(s, { x: 4, y: 7 });
    check('a hero’s glide walks through a formation', G.glideField(s, x).costs.has(G.key(3, 7)) && G.glideMove(s, x, 3, 7));
  }
  withTraits('chief', { glide: 2 }, () => {
    const run = (zoneAt, start = [5, 7]) => {
      const v = board();
      const boss = put(v, 'chief', ...start);
      put(v, 'hero', 4, 7);
      if (zoneAt) formation(v, zoneAt);
      G.startEnemy(v);
      G.enemyAct(v, boss);
      return boss;
    };
    const free = run(null);
    check('in the open the villain walks off two steps', free.x === 7 && free.y === 7);
    const stopped = run({ x: 7, y: 7 });
    check('its walk off stops on the first formation tile', stopped.x === 6 && stopped.y === 7, [stopped.x, stopped.y]);
    const caught = run({ x: 5, y: 7 }, [6, 7]);
    check('having walked into a formation to strike, it does not walk off', caught.x === 5 && caught.y === 7, [caught.x, caught.y]);
    const walkedIn = withTraits('scout-0', { glide: 2 }, () => {
      Object.assign(G.DETAILS['scout-0'], { ...G.DETAILS.scout, traits: { glide: 2 } });
      const v = board();
      const scout = put(v, 'scout', 7, 7);
      put(v, 'hero', 4, 7);
      formation(v, { x: 5, y: 6 });
      G.startEnemy(v);
      G.enemyAct(v, scout);
      return scout;
    });
    check('a step left over after walking into a formation is not walked', walkedIn.x === 5 && walkedIn.y === 7, [walkedIn.x, walkedIn.y]);
    const begun = run({ x: 5, y: 7 }, [5, 7]);
    check('begun in one, its step as the action began (two less, so one) bounds the walk off', begun.x === 6 && begun.y === 7, [begun.x, begun.y]);
  });
}

// ── 坐鎮 post (§7.3), and a 蓄勢反擊 that holds (§7.6) ─────────────────────
section('post');
{
  // Board 0's open row 3: the post on (5,3); heroes put east of it.
  const posted = (traits, setup) =>
    withTraits('chief', traits, () => {
      const s = board();
      const chief = put(s, 'chief', 5, 3);
      setup?.(s, chief);
      return { s, chief };
    });
  const act = (s, u) => {
    G.startEnemy(s);
    return G.enemyAct(s, u);
  };
  const post = (tether, wake, more = {}) => ({ post: { tile: { x: 5, y: 3 }, tether, wake, ...more } });

  withTraits('chief', post(1, true), () => {
    const s = board();
    const chief = put(s, 'chief', 5, 3);
    const hero = put(s, 'hero', 8, 3);
    const life = hero.hp;
    act(s, chief);
    check('no hero within reach of its ground: it stays on its post', chief.x === 5 && chief.y === 3 && hero.hp === life, [chief.x, chief.y]);
    check('and it is not woken', !chief.woke);
    check('it does not claim to close in', !s.logs.some((l) => l.text === '逼近我方陣地。' && l.who === '余滄海'));
  });
  withTraits('chief', post(1, true), () => {
    const s = board();
    const chief = put(s, 'chief', 5, 3);
    const hero = put(s, 'hero', 7, 3);
    const life = hero.hp;
    act(s, chief);
    check('a hero strikable from within the tether is struck', hero.hp < life && G.distance(chief, { x: 5, y: 3 }) <= 1, [chief.x, chief.y]);
    check('wake: true — striking wakes it for good', chief.woke === true && s.logs.some((l) => l.text === '離位追擊。'));
    const saved = R.restoreRun(copy(s));
    check('a save keeps the woken post', saved && unit(saved, 'chief').woke === true);
    put(s, 'hero', 8, 7);
    for (const id of ['medic', 'guard']) unit(s, id).hp = 0; // only the hero to chase
    G.nextRound(s);
    s.phase = 'ally';
    const from = { x: chief.x, y: chief.y };
    act(s, chief);
    check('once woken it is held no more and goes after the hero', !G.holdOf(s, chief) && G.distance(chief, from) > 0, [chief.x, chief.y]);
    check('its page says it has left', G.enemyTraitLines(s, chief).includes('【坐鎮】已離位追擊。'));
  });
  // wake 'struck' and false: striking keeps the post; being struck drops only 'struck'.
  for (const [wake, after] of [['struck', true], [false, false]])
    withTraits('chief', post(1, wake), () => {
      const s = board();
      const chief = put(s, 'chief', 5, 3);
      const hero = put(s, 'hero', 7, 3);
      act(s, chief);
      check('wake ' + JSON.stringify(wake) + ': its own blow keeps it on post', !chief.woke && hero.hp < hero.maxHp);
      s.phase = 'ally';
      hero.acted = hero.moved = false;
      G.resolve(s, hero, chief, false);
      check('wake ' + JSON.stringify(wake) + ': struck by a hero, ' + (after ? 'it wakes' : 'it holds'), !!chief.woke === after);
    });
  withTraits('chief', post(0, false), () => {
    const s = board();
    const chief = put(s, 'chief', 7, 3);
    put(s, 'hero', 8, 7);
    act(s, chief);
    check('pulled off its post, it walks back', chief.x === 5 && chief.y === 3, [chief.x, chief.y]);
    check('and says so', s.logs.some((l) => l.text === '退回崗位。'));
  });
  withTraits('chief', post(0, false), () => {
    const s = board();
    const chief = put(s, 'chief', 8, 3);
    put(s, 'hero', 8, 7);
    s.zones = [{ owner: 'medic', tiles: [{ x: 7, y: 3 }], through: s.round + 1 }];
    act(s, chief);
    check('a formation in front of its post stops the walk back', chief.x === 7 && chief.y === 3, [chief.x, chief.y]);
  });
  // The danger zone: what it can strike from its ground, not from anywhere it could walk.
  {
    const alone = (s) => G.enemies(s).filter((e) => e.id !== 'chief').forEach((e) => (e.hp = 0));
    const lone = () => {
      const s = board();
      alone(s);
      return s;
    };
    const open = loose(() => {
      const free = lone();
      put(free, 'chief', 5, 3);
      return new Set(dangerTiles(free));
    });
    const held = withTraits('chief', post(0, false), () => {
      const s = lone();
      put(s, 'chief', 5, 3);
      return new Set(dangerTiles(s));
    });
    check('unposted, the zone reaches three tiles out', open.has(G.key(8, 3)));
    check('posted with tether 0, only the tiles beside it', held.has(G.key(6, 3)) && held.has(G.key(4, 3)) && !held.has(G.key(7, 3)), [...held].join(' '));
    const tethered = withTraits('chief', post(1, false), () => {
      const s = lone();
      put(s, 'chief', 5, 3);
      return new Set(dangerTiles(s));
    });
    check('with tether 1, two tiles out and no further', tethered.has(G.key(7, 3)) && !tethered.has(G.key(8, 3)));
    const woken = withTraits('chief', post(0, true), () => {
      const s = lone();
      const c = put(s, 'chief', 5, 3);
      dangerTiles(s);
      c.woke = true;
      return dangerTiles(s);
    });
    check('a woken post draws its whole walk again (the memo sees the change)', woken.has(G.key(8, 3)));
  }
  // 挑釁: a taunter it can strike from its ground binds it; one it cannot is ignored.
  withTraits('chief', post(1, false), () => {
    const s = board();
    const chief = put(s, 'chief', 5, 3);
    const hero = put(s, 'hero', 4, 3);
    const guard = put(s, 'guard', 7, 3);
    guard.conditions = { taunt: { power: 2, through: s.round, source: 'guard' } };
    act(s, chief);
    check('a taunt answerable from inside the tether binds it', guard.hp < guard.maxHp && hero.hp === hero.maxHp);
  });
  withTraits('chief', post(0, false), () => {
    const s = board();
    const chief = put(s, 'chief', 5, 3);
    const hero = put(s, 'hero', 4, 3);
    const guard = put(s, 'guard', 7, 3);
    guard.conditions = { taunt: { power: 2, through: s.round, source: 'guard' } };
    act(s, chief);
    check('a taunt it cannot answer from its post is ignored', hero.hp < hero.maxHp && guard.hp === guard.maxHp && chief.x === 5);
  });
  // A post on its master: rank and file keep beside him.
  withTraits('scout-0', { post: { tile: 'master', tether: 1, wake: false } }, () => {
    Object.assign(G.DETAILS['scout-0'], { ...G.DETAILS.scout, traits: { post: { tile: 'master', tether: 1, wake: false } } });
    const s = board();
    put(s, 'chief', 5, 3);
    const scout = put(s, 'scout', 8, 3);
    put(s, 'hero', 8, 7);
    act(s, scout);
    check('a piece posted on its master walks to his side', G.distance(scout, { x: 5, y: 3 }) === 1, [scout.x, scout.y]);
    check('its page says so', G.enemyTraitLines(s, scout).includes('【護駕】每回合先回到余滄海身旁。'));
  });
  // The page, generic and in the villain's own words.
  withTraits('chief', post(2, 'struck'), () => {
    const s = board();
    check('the generic post line', G.enemyTraitLines(s, unit(s, 'chief'))[0] === '【坐鎮】守在（6，4）兩格內；受到攻擊後才離位。', G.enemyTraitLines(s, unit(s, 'chief'))[0]);
  });
  withTraits('chief', post(1, false, { note: '守在石階{tile}一格內，不離位。' }), () => {
    const s = board();
    check('a post line in the villain’s words, its tile filled in', G.enemyTraitLines(s, unit(s, 'chief'))[0] === '【坐鎮】守在石階（6，4）一格內，不離位。');
  });

  // 蓄勢反擊 that holds: while charged it stays and strikes only from where it stands.
  const crouch = { stance: { while: 'charged', cut: 0, holds: true } };
  withTraits('chief', crouch, () => {
    const s = board();
    const chief = put(s, 'chief', 5, 3);
    const hero = put(s, 'hero', 7, 3);
    s.round = 3; // board 0's master is charged from round 3
    check('charged, it is held', G.signatureDue(s, chief) && !!G.holdOf(s, chief));
    const zone = dangerTiles(s);
    check('charged, the danger zone is its own tile’s reach only', zone.has(G.key(6, 3)) && !zone.has(G.key(7, 3)));
    act(s, chief);
    check('charged, it does not walk to a hero out of reach', chief.x === 5 && hero.hp === hero.maxHp);
    const t = board();
    const c2 = put(t, 'chief', 5, 3);
    const h2 = put(t, 'hero', 7, 3);
    t.round = 2;
    act(t, c2);
    check('not charged, it walks in and strikes', h2.hp < h2.maxHp && c2.x === 6);
  });
}

// ── 偏好 prefers (§7.5) ─────────────────────────────────────────────────
section('prefers');
{
  // Two heroes beside the master on row 3; which one it strikes, with and without its preference.
  const struck = (prefers, setup, stage = 0) =>
    withTraits('chief', prefers ? { prefers } : {}, () => {
      const s = board();
      s.run.stage = stage;
      const chief = put(s, 'chief', 5, 3);
      setup(s);
      const before = new Map(G.party(s).map((v) => [v.id, v.hp]));
      G.startEnemy(s);
      G.enemyAct(s, chief);
      return G.party(s).find((v) => v.hp < before.get(v.id))?.id;
    });
  const wounded = (s) => {
    put(s, 'medic', 4, 3);
    put(s, 'guard', 6, 3).hp = 110;
  };
  check('without a preference, the frailer full-health medic is struck', struck(null, wounded) === 'medic');
  check('wounded: the hero who has lost most is struck', struck('wounded', wounded) === 'guard');
  check('wounded: the same at a late stage, where the AI weighs differently', struck('wounded', wounded, 7) === 'guard');
  const lonely = (s) => {
    put(s, 'medic', 4, 3);
    put(s, 'hero', 4, 4);
    put(s, 'guard', 6, 3).hp = 120;
  };
  check('without a preference, the medic', struck(null, lonely) === 'medic');
  check('isolated: the hero with no companion beside him', struck('isolated', lonely) === 'guard');
  const leading = (s) => {
    put(s, 'hero', 4, 3);
    put(s, 'medic', 6, 3);
  };
  check('without a preference, not the leader', struck(null, leading) === 'medic');
  check('leader: the leader', struck('leader', leading) === 'hero');
  const healing = (s) => {
    put(s, 'medic', 4, 3);
    put(s, 'guard', 6, 3).hp = 70;
  };
  check('without a preference, the hurt guard', struck(null, healing) === 'guard');
  check('healer: the hero with a healing art', struck('healer', healing) === 'medic');
  const deep = (s) => {
    put(s, 'medic', 4, 3);
    Object.assign(put(s, 'guard', 6, 3), { hp: 70, mp: 0 });
  };
  check('mp: the hero with most 內力', struck(null, deep) === 'guard' && struck('mp', deep) === 'medic');
  // The terms themselves.
  withTraits('chief', { prefers: 'nearest' }, () => {
    const s = board();
    const c = unit(s, 'chief'),
      h = unit(s, 'hero');
    check('nearest: −8 per tile short of 20 to walk', G.preference(s, c, h, [], 3) === -136 && G.preference(s, c, h, [], 40) === 0);
  });
  withTraits('chief', { prefers: 'wounded' }, () => {
    const s = board();
    const h = unit(s, 'hero');
    h.hp = h.maxHp / 2;
    check('wounded: −40 × the share lost', G.preference(s, unit(s, 'chief'), h, []) === -20);
    check('the page names it', G.enemyTraitLines(s, unit(s, 'chief')).includes('【偏好】專挑傷重者。'));
  });
}

// ── 變招 phase (§7.4) ───────────────────────────────────────────────────
section('phase');
{
  const mad = {
    stance: { while: 'charged', cut: 0, holds: true },
    prefers: 'wounded',
    phase: { name: '逆練', atk: 6, def: -4, step: 1, cadence: 2, prefers: 'nearest', holds: false, log: '試變招。', note: '試變招說明。' }
  };
  withTraits('chief', mad, () => {
    const s = board();
    const chief = unit(s, 'chief');
    const before = { atk: chief.atk, def: chief.def, step: chief.step, range: chief.range };
    check('the page shows the phase from the start', G.enemyTraitLines(s, chief).includes('【半血變招 · 逆練】試變招說明。'));
    chief.hp = Math.floor(chief.maxHp / 2) + 1;
    G.check(s);
    check('above half nothing happens', !chief.phased && chief.atk === before.atk);
    chief.hp = Math.floor(chief.maxHp / 2);
    G.check(s);
    check('at half the phase fires', chief.phased === true && s.foreshadow === true);
    check('its numbers go onto the unit', chief.atk === before.atk + 6 && chief.def === before.def - 4 && chief.step === before.step + 1 && chief.range === before.range);
    check('its line is logged', s.logs.at(-1).text === '試變招。' && s.logs.at(-1).who === '余滄海');
    check('cadence and preference are the phase’s now', G.traitsOf(chief).sig.cadence === 2 && G.traitsOf(chief).prefers === 'nearest');
    s.round = 3;
    check('holds: false — charged, it is no longer held', G.signatureDue(s, chief) && !G.holdOf(s, chief));
    check('…but still counters at full force', G.counterRatio(s, chief) === 1);
    chief.signatureRound = 3;
    s.round = 5;
    check('the countdown uses the phase’s cadence', G.roundsToSignature(s, chief) === 0);
    check('the page says it has changed', G.enemyTraitLines(s, chief).includes('【已變招 · 逆練】試變招說明。') && G.enemyTraitLines(s, chief).includes('【偏好】見人就撲。'));
    G.check(s);
    check('it fires once', chief.atk === before.atk + 6);
    const saved = R.restoreRun(copy(s));
    const c2 = saved && unit(saved, 'chief');
    check('a save keeps the change', c2?.phased === true && c2.atk === chief.atk && G.traitsOf(c2).prefers === 'nearest');
  });
  {
    const s = board();
    const chief = unit(s, 'chief');
    const atk = chief.atk;
    chief.hp = Math.floor(chief.maxHp / 2);
    const lines = s.logs.length;
    G.check(s);
    check('a master without a phase changes nothing and logs nothing', !chief.phased && chief.atk === atk && s.logs.length === lines);
    check('the old false line is gone', !s.logs.some((l) => l.text === '收勢退了半步，重整陣腳。'));
  }
  // A multi-hit that crosses half health: the whole action lands before the phase fires.
  withTraits('chief', { phase: { def: -4, log: '試變招。' } }, () => {
    const s = board();
    const hero = put(s, 'hero', 4, 3),
      chief = put(s, 'chief', 5, 3);
    teach(hero, defineArt({ hits: [0.5, 0.5], factor: 2 }));
    hero.mp = 40;
    chief.hp = Math.floor(chief.maxHp / 2) + 10;
    const f = G.forecast(hero, chief, true, s);
    const life = chief.hp;
    G.resolve(s, hero, chief, true);
    check('a multi-hit lands as forecast, every hit before the change', life - chief.hp === f.amount && f.hits.length === 2, [life - chief.hp, f.amount]);
    check('then the phase fires once', chief.phased && s.logs.filter((l) => l.text === '試變招。').length === 1);
  });
  // In the enemy phase: a counter that takes the master to half.
  withTraits('chief', { phase: { atk: 1, log: '試變招。' } }, () => {
    const s = board();
    const chief = put(s, 'chief', 5, 3);
    put(s, 'guard', 4, 3);
    chief.hp = Math.floor(chief.maxHp / 2) + 1;
    G.startEnemy(s);
    G.enemyAct(s, chief);
    check('a counter that brings it to half fires the phase in the enemy phase', chief.phased === true);
  });
}

// ── 化功 contact, 盟令 banner, 蛇毒 basicPoison, signature riders, 星索 wards (§7.2, 7.7, 7.8) ─
section('contact, banner, riders and wards');
{
  // A villain's style for the length of a test (its traits stay as given).
  function withStyle(key, style, traits, body) {
    const prior = G.DETAILS[key].style;
    G.DETAILS[key].style = style;
    try {
      return withTraits(key, traits, body);
    } finally {
      G.DETAILS[key].style = prior;
    }
  }
  const scoutAs = (traits) => Object.assign(G.DETAILS['scout-0'], { ...G.DETAILS.scout, name: '試弟子', traits });

  withTraits('chief', { contact: { mp: 8 } }, () => {
    const s = board();
    s.run.stage = 1;
    const hero = put(s, 'hero', 4, 3),
      chief = put(s, 'chief', 5, 3);
    const f = G.forecast(hero, chief, false, s);
    check('化功: a blow from beside him costs 8 + stage 內力', f.contact === 9 && f.notes.includes('化功 · 內力 −9'), f.contact);
    check('the preview gives it its own row', P.attackPage(s, 'hero', 'chief', false).includes('<span>化功</span><b class="">內力 −9'));
    const mp = hero.mp;
    G.resolve(s, hero, chief, false);
    check('and the strike takes it', hero.mp === mp - 9, hero.mp);
    check('his page says so', G.enemyTraitLines(s, chief).includes('【化功】貼身打中他的俠客損失 9 點內力（封穴時無效）。'));
    const medic = put(s, 'medic', 7, 3);
    check('a blow from two tiles off costs nothing', !G.forecast(medic, chief, false, s).contact);
    chief.conditions = { seal: { power: 1, through: s.round, source: 'hero' } };
    hero.acted = false;
    check('sealed, he dissolves nothing', !G.forecast(hero, chief, false, s).contact);
    delete chief.conditions;
    teach(hero, defineArt({ safe: true }));
    hero.mp = 40;
    check('免受還擊 does not spare the striker', G.forecast(hero, chief, true, s).contact === 9);
    hero.mp = 3;
    hero.activeArt = 'signature';
    check('never more than he has', G.forecast(hero, chief, false, s).contact === 3);
  });
  withTraits('scout-0', { cover: 'master' }, () =>
    withTraits('chief', { contact: { mp: 8 } }, () => {
      scoutAs({ cover: 'master' });
      const s = board();
      const hero = put(s, 'hero', 4, 3);
      put(s, 'chief', 5, 3);
      put(s, 'scout', 5, 4);
      const f = G.forecast(hero, unit(s, 'chief'), false, s);
      check('a disciple who takes the blow for him has no 化功', f.coveredBy === 'scout' && !f.contact);
    })
  );

  withTraits('chief', { banner: { atk: 1 } }, () => {
    const s = board();
    s.run.stage = 3;
    const blade = unit(s, 'blade'),
      chief = unit(s, 'chief');
    const base = blade.atk;
    check('盟令: every other enemy strikes harder by 1 + stage', G.stat(blade, 'atk', s) === base + 4 && G.stat(chief, 'atk', s) === chief.atk);
    check('and shows a chip', G.standingLines(s, blade).includes('盟令 ＋4') && !G.standingLines(s, chief).length);
    check('the bearer’s page says so', G.enemyTraitLines(s, chief).includes('【盟令】存活時其餘敵人攻擊 ＋4。'));
    chief.hp = 0;
    check('with the bearer fallen it is gone', G.stat(blade, 'atk', s) === base && !G.standingLines(s, blade).length);
  });

  withTraits('scout-0', { basicPoison: { power: 2, turns: 2, name: '蛇毒' } }, () => {
    scoutAs({ basicPoison: { power: 2, turns: 2, name: '蛇毒' } });
    const s = board();
    s.run.stage = 5;
    const scout = put(s, 'scout', 5, 3),
      hero = put(s, 'hero', 4, 3);
    G.startEnemy(s);
    G.enemyAct(s, scout);
    check('蛇毒: its plain strike poisons with 2 + ⌊stage/2⌋', hero.conditions?.poison?.power === 4 && hero.conditions.poison.through === s.round + 1);
    check('its page says so', G.enemyTraitLines(s, scout).includes('【蛇毒】普攻令目標中毒，兩次毒發各損 4 氣血。'));
  });

  // Signature styles and riders, struck when due (board 0's master: round 3).
  // The checks run inside, while the style and traits hold.
  const due = (style, traits, setup, checks) =>
    withStyle('chief', style, traits, () => {
      const s = board();
      s.round = 3;
      const chief = put(s, 'chief', 3, 3);
      // Only the heroes the setup puts are in play.
      for (const id of ['medic', 'guard']) unit(s, id).hp = 0;
      setup(s);
      G.startEnemy(s);
      const effects = G.enemyAct(s, chief);
      checks({ s, chief, effects });
    });
  due('pin', { mods: {} }, (s) => put(s, 'hero', 4, 3), ({ s }) => {
    const pin = unit(s, 'hero').conditions?.pin;
    check('pin: the struck hero is 絆足 2 until his next turn is over', pin?.power === 2 && pin.through === s.round + 1);
    check('its note', G.enemyTechnique(unit(s, 'chief'), s).note === '令目標絆足，移動減 2，持續至下回合。');
  });
  due('poison', { mods: {}, sig: { extra: 'wound' } }, (s) => put(s, 'hero', 4, 3), ({ s }) => {
    const c = unit(s, 'hero').conditions || {};
    check('poison with extra wound: poison and 內傷 both', c.poison?.power === 3 && c.wound?.power === 5);
    check('its note names both', G.enemyTechnique(unit(s, 'chief'), s).note === '令目標中毒，兩次毒發各損 3 氣血，並受內傷：療傷減半，每次出手後自損 5 氣血，持續至下回合。');
  });
  due(
    'line',
    { mods: {} },
    (s) => {
      put(s, 'hero', 4, 3);
      Object.assign(put(s, 'medic', 6, 3), { hp: 94 });
    },
    ({ s, effects }) => {
      const hit = effects.find((e) => e[0] === 'hero'),
        through = effects.find((e) => e[0] === 'medic');
      check('line: the hero two behind takes half the blow', !!through && Math.abs(Number(through[1].slice(1)) - Math.round(Number(hit[1].slice(1)) / 2)) <= 2, JSON.stringify(effects));
      check('line: no condition on the target', !unit(s, 'hero').conditions || !Object.keys(unit(s, 'hero').conditions).length);
      check('line note says the danger zone does not show it', G.enemyTechnique(unit(s, 'chief'), s).note.includes('（危險範圍不顯示穿透）'));
      unit(s, 'medic').x = 7;
      check('three tiles behind is too far', !G.lineVictim(s, { x: 3, y: 3 }, unit(s, 'hero')));
      unit(s, 'medic').x = 5;
      check('one behind is in it', G.lineVictim(s, { x: 3, y: 3 }, unit(s, 'hero'))?.id === 'medic');
      check('a striker off the row sends nothing through', !G.lineVictim(s, { x: 3, y: 4 }, unit(s, 'hero')));
    }
  );
  due(
    'sweep',
    { mods: {}, sig: { sweep: 0.33 } },
    (s) => {
      put(s, 'hero', 4, 3);
      Object.assign(put(s, 'medic', 5, 3), { hp: 94 });
    },
    ({ s, effects }) => {
      const hit = Number(effects.find((e) => e[0] === 'hero')[1].slice(1)),
        chip = Number(effects.find((e) => e[0] === 'medic')[1].slice(1));
      check('sweep share: chips take the signature’s third', chip >= Math.round(hit * 0.33) - 2 && chip <= Math.round(hit * 0.33) + 2, [hit, chip]);
      check('its note says a third', G.enemyTechnique(unit(s, 'chief'), s).note === '相鄰的其他我方俠客也會受到三分之一傷害。');
    }
  );
  {
    const plain = (() => {
      const s = board();
      s.round = 2;
      const chief = put(s, 'chief', 3, 3),
        hero = put(s, 'hero', 4, 3);
      for (const id of ['medic', 'guard']) unit(s, id).hp = 0;
      G.startEnemy(s);
      G.enemyAct(s, chief);
      return hero.maxHp - hero.hp;
    })();
    due('mirror', { redirect: { while: 'charged', keep: 0, back: 0.5 } }, (s) => put(s, 'hero', 4, 3), ({ s, chief, effects }) => {
      const hero = unit(s, 'hero');
      check('mirror: charged, it strikes with its plain blow', hero.maxHp - hero.hp === plain && !effects.signature, [hero.maxHp - hero.hp, plain]);
      check('and keeps its charge', chief.signatureRound === undefined && G.signatureDue(s, chief));
      s.phase = 'ally';
      const page = P.enemyPage(s, 'chief');
      check('its page has no strength line, and the mirror’s words', page.includes('蓄勢時，第一次受到的直接攻擊全數不中') && !page.includes('普攻傷害 ×'));
      check('charged, the page warns of the mirror', page.includes('蓄勢已成 · 第一下直接攻擊將被反震'));
    });
  }
  // 吸勁 against a charged 蓄勢反擊: the blow that delays it is answered at the ordinary share.
  withTraits('chief', { stance: { while: 'charged', cut: 0, holds: true } }, () => {
    const s = board();
    s.round = 3;
    const hero = put(s, 'hero', 4, 3),
      chief = put(s, 'chief', 5, 3);
    const plainCounter = G.forecast(hero, chief, false, s).counterRaw;
    teach(hero, defineArt({ forms: ['siphon'], factor: 1 }));
    hero.mp = 40;
    const f = G.forecast(hero, chief, true, s);
    check('charged, a plain blow draws the full counter', G.counterRatio(s, chief) === 1 && plainCounter > 0);
    check('吸勁 un-charges it: the counter is the ordinary share', f.siphon?.delay && f.counterRaw < plainCounter, [f.counterRaw, plainCounter]);
    G.resolve(s, hero, chief, true);
    check('…and it is no longer held', !G.signatureDue(s, chief) && !G.holdOf(s, chief));
  });

  // 星索護陣: the wards are data now.
  withTraits('scout-0', { ward: 35 }, () => {
    scoutAs({ ward: 35 });
    const s = board();
    const hero = put(s, 'hero', 4, 3),
      chief = put(s, 'chief', 5, 3),
      scout = put(s, 'scout', 7, 3);
    check('a living ward takes 35% off the master', G.forecast(hero, chief, false, s).ward === 35 && G.wardEscorts(s).length === 1);
    check('and not off anyone else', !G.forecast(hero, scout, false, s).ward);
    check('the master’s page', G.enemyTraitLines(s, chief).includes('【星索護陣】每名存活的試弟子替他抵擋 35% 傷害。'));
    check('the ward’s page', G.enemyTraitLines(s, scout).includes('【護陣】存活時替余滄海抵擋 35% 傷害。'));
    scout.hp = 1;
    put(s, 'medic', 8, 3);
    G.resolve(s, unit(s, 'medic'), scout, false);
    check('felled, its rope breaks and says so', !G.wardEscorts(s).length && s.logs.some((l) => l.text === '星索皆斷，余滄海的護陣已破。'));
  });
}

// ── 續命 mend (§7.9) ────────────────────────────────────────────────────
section('mend');
{
  // Board 0's master as the physician, due in round 3; the lieutenant hurt beside him.
  const physician = (setup, checks, stage = 1) => {
    const prior = G.DETAILS.chief.style;
    G.DETAILS.chief.style = 'mend';
    try {
      withTraits('chief', { sig: { heal: 'stage' } }, () => {
        const s = board();
        s.run.stage = stage;
        s.round = 3;
        for (const id of ['medic', 'guard']) unit(s, id).hp = 0;
        const chief = put(s, 'chief', 5, 3);
        setup(s, chief);
        G.startEnemy(s);
        const effects = G.enemyAct(s, chief);
        checks(s, chief, effects);
      });
    } finally {
      G.DETAILS.chief.style = prior;
    }
  };
  physician(
    (s) => {
      put(s, 'blade', 7, 3).hp = 20;
      put(s, 'hero', 4, 3);
    },
    (s, chief, effects) => {
      const blade = unit(s, 'blade');
      check('a hurt companion within reach is restored by 20 + 5 × stage', blade.hp === 45 && same(effects[0], ['blade', '+25']), blade.hp);
      check('it does not strike', unit(s, 'hero').hp === unit(s, 'hero').maxHp);
      check('the signature is spent', chief.signatureRound === 3 && !G.signatureDue(s, chief) && effects.signature);
      check('it says so', s.logs.some((l) => l.text.includes('接骨續筋') && l.who === '余滄海'));
      check('its page note gives the number, with no strength line', G.signatureLines(s, chief)[0] === '蓄勢時替三格內氣血不足七成的同夥回復 25 點氣血，此回合不出手；無人受傷時改以普攻出手，蓄勢保留。');
    }
  );
  physician(
    (s) => {
      const blade = put(s, 'blade', 7, 3);
      blade.hp = 20;
      blade.conditions = { wound: { power: 5, through: s.round + 1, source: 'hero' } };
      put(s, 'hero', 4, 3);
    },
    (s) => check('內傷 halves the mend', unit(s, 'blade').hp === 32, unit(s, 'blade').hp)
  );
  physician(
    (s, chief) => {
      chief.hp = 30;
      put(s, 'hero', 4, 3);
    },
    (s, chief) => check('it mends itself', chief.hp === 55 && unit(s, 'hero').hp === unit(s, 'hero').maxHp)
  );
  physician(
    (s) => {
      put(s, 'blade', 7, 3).hp = 50; // above seven tenths
      put(s, 'hero', 4, 3);
    },
    (s, chief, effects) => {
      check('no one hurt enough: it strikes plainly', unit(s, 'hero').hp < unit(s, 'hero').maxHp && !effects.signature);
      check('…and keeps the charge', G.signatureDue(s, chief));
    }
  );
  physician(
    (s) => {
      put(s, 'blade', 1, 9).hp = 10; // far off: no tile within three of him this turn
      put(s, 'hero', 4, 3);
    },
    (s, chief) => check('a companion out of its reach is not mended', unit(s, 'blade').hp === 10 && G.signatureDue(s, chief))
  );
  physician(
    (s) => {
      put(s, 'blade', 5, 7).hp = 20;
      put(s, 'hero', 8, 3);
    },
    (s, chief) => {
      const h = unit(s, 'hero');
      check('it mends from as far from the heroes as it can', G.distance(chief, unit(s, 'blade')) <= 3 && G.distance(chief, h) >= 4, [chief.x, chief.y]);
    }
  );
}

// ── 遁走 flee (§7.4) ────────────────────────────────────────────────────
section('flee');
{
  // Board 0's herbs: (3,2), (1,6), (8,8).
  const herbs = fieldCellsWithHerbs(0);
  function fieldCellsWithHerbs(map) {
    return mapLayout(map).cells.filter((c) => G.terrainInfo(c.x, c.y, map)?.heal).map((c) => c.x + ',' + c.y);
  }
  check('board 0 has the herbs these checks use', ['3,2', '1,6', '8,8'].every((k) => herbs.includes(k)), herbs.join(' '));
  const flight = { phase: { name: '遁走', flee: { turns: 3, herbs: 0.08, until: 0.75 }, log: '試遁走。', note: '試遁走說明。' } };
  const fled = (setup, checks) =>
    withTraits('chief', flight, () => {
      const s = board();
      for (const id of ['medic', 'guard']) unit(s, id).hp = 0;
      const chief = put(s, 'chief', 5, 3);
      setup?.(s, chief);
      chief.hp = Math.floor(chief.maxHp / 2);
      G.check(s);
      checks(s, chief);
    });
  fled(null, (s, chief) => {
    check('the phase starts the flight: its turns from this round', chief.fleeThrough === s.round + 2 && G.fleeing(s, chief));
    check('the page says so', G.enemyTraitLines(s, chief).includes('【遁走中】至第 3 回合，或氣血回到 ' + Math.round(chief.maxHp * 0.75) + ' 為止。'));
    put(s, 'hero', 8, 7);
    const zone = dangerTiles(s);
    const stand = G.standCells(s, chief);
    check('the danger zone draws only where its flight ends', stand.length === 1 && zone.has(G.key(stand[0].x, stand[0].y)) && !zone.has(G.key(8, 3)));
    const turn = () => {
      G.startEnemy(s);
      G.enemyAct(s, chief);
      for (const e of G.enemies(s)) e.acted = true;
    };
    turn();
    check('it heads for the nearest herbs', G.distance(chief, { x: 3, y: 2 }) < G.distance({ x: 5, y: 3 }, { x: 3, y: 2 }), [chief.x, chief.y]);
    check('and says so', s.logs.some((l) => l.text === '退向藥草地。'));
    G.nextRound(s);
    turn();
    check('a round later it is on them', chief.x === 3 && chief.y === 2, [chief.x, chief.y]);
    const life = chief.hp;
    G.nextRound(s);
    check('on herbs it recovers 8% of its greatest 氣血, not the tile’s flat 12', chief.hp - life === Math.round(chief.maxHp * 0.08), chief.hp - life);
    const saved = R.restoreRun(copy(s));
    check('a save keeps the flight', unit(saved, 'chief').fleeThrough === chief.fleeThrough);
    chief.hp = Math.ceil(chief.maxHp * 0.75);
    check('it ends early once back at three quarters', !G.fleeing(s, chief));
  });
  fled(
    (s) => put(s, 'hero', 3, 2),
    (s, chief) => {
      G.startEnemy(s);
      G.enemyAct(s, chief);
      check('herbs a hero holds are passed over for the next nearest', G.distance(chief, { x: 3, y: 2 }) > 0 && G.standCells(s, chief).length === 1);
    }
  );
  fled(
    (s) => {
      put(s, 'hero', 3, 2);
      put(s, 'blade', 8, 8); // the archer is parked on (1,6)
    },
    (s, chief) => {
      check('every herb tile taken: it fights where it can, as any piece', G.standCells(s, chief).length > 1);
      const hero = unit(s, 'hero');
      put(s, 'hero', 4, 3);
      G.startEnemy(s);
      G.enemyAct(s, chief);
      check('…striking whoever is in reach', hero.hp < hero.maxHp);
    }
  );
  fled(null, (s, chief) => {
    put(s, 'chief', 3, 2);
    chief.conditions = { wound: { power: 5, through: s.round + 1, source: 'hero' } };
    G.startEnemy(s);
    chief.acted = true;
    for (const e of G.enemies(s)) e.acted = true;
    const life = chief.hp;
    G.nextRound(s);
    check('內傷 halves the herbs', chief.hp - life === Math.floor(Math.round(chief.maxHp * 0.08) / 2), chief.hp - life);
  });
}

// ── The ten boards, built with the real data on their real maps (SPEC-villains) ──────────────
// Each block below builds a board as a run reaches it, at a stage it can be met at, and checks
// that its villains carry the spec's traits and numbers and that what defines them happens there.
// The run's map `map`, reached at `stage` (a seed whose route puts it there), in the fight with
// the three original heroes at their spawn tiles.
function realBoard(map, stage) {
  for (let n = 1; n < 400; n++) {
    const s = board(['hero', 'medic', 'guard'], Math.imul(n, 2654435761) >>> 0);
    if (s.run.route[stage] !== map) continue;
    for (let i = 0; i < stage; i++) {
      s.run.scene = 'fight';
      if (!nextBoard(s)) throw new Error('could not reach board ' + map);
    }
    if (stage) {
      // Through the story and the briefing to 整備, onto the board, and past the deployment step.
      R.turnPage(s, true);
      R.turnPage(s, true);
      R.deployLineup(s);
      R.beginBattle(s);
      s.run.formationOpen = false;
    } else {
      // board() parks every piece; put them back where board 0's layout sets them.
      const layout = mapLayout(0);
      foesOf(s).forEach((u, i) => Object.assign(u, layout.enemies[i]));
      G.party(s).forEach((u, i) => Object.assign(u, layout.allies[i]));
      G.scheduleWaves(s); // and board 0's reinforcements come again
    }
    return s;
  }
  throw new Error('no route puts board ' + map + ' at stage ' + stage);
}
// The board's four enemies by their place in the layout: master, lieutenant, archer, scout.
const foesOf = (s) => {
  const ids = s.mapIndex ? [G.commanderId(s), 'echoBlade', 'echoBow', 'echoScout'] : ['chief', 'blade', 'bow', 'scout'];
  return ids.map((id) => unit(s, id));
};
const numbersOf = (u) => [u.maxHp, u.atk, u.def, u.step, u.range];
// Every post on a board is on walkable ground a hero can walk to from his side's spawn.
function postsReachable(s) {
  const from = mapLayout(s.mapIndex).allies[0];
  return foesOf(s).every((u) => {
    const post = G.traitsOf(u).post;
    if (!post || post.tile === 'master') return true;
    const tile = G.postTile(s, u, post);
    const ghost = { ...unit(s, s.leader), x: from.x, y: from.y, side: 'ally' };
    return G.walkable(tile.x, tile.y, s.mapIndex) && G.movementPath({ ...s, units: [] }, ghost, from, tile).length > 0;
  });
}
// The page lines a piece shows now.
const pageOf = (s, u) => [...G.signatureLines(s, u), ...G.enemyTraitLines(s, u)];
// One enemy turn with every other enemy standing still; the heroes are where they are.
function soloTurn(s, u) {
  G.startEnemy(s);
  for (const e of G.enemies(s)) if (e !== u) e.acted = true;
  const effects = G.enemyAct(s, u);
  return effects;
}
// The end of the enemy phase and the start of the next ally phase.
function closeRound(s) {
  for (const e of G.enemies(s)) e.acted = true;
  G.nextRound(s);
}

section('board 0 青竹渡: the bridge wardens');
{
  const s = realBoard(0, 0);
  const [chief, blade, bow, scout] = foesOf(s);
  check('余滄海 and 木高峰 have the spec’s numbers', same(numbersOf(chief), [104, 25, 12, 2, 1]) && same(numbersOf(blade), [56, 20, 7, 2, 1]), numbersOf(chief) + ' / ' + numbersOf(blade));
  check('archer and scout keep the stage curve and their 青城 names', same(numbersOf(bow), [48, 18, 5, 2, 3]) && G.unitDetails(bow).name === '青城弓手' && G.unitDetails(scout).name === '青城斥候', numbersOf(bow) + G.unitDetails(bow).name + G.unitDetails(scout).name);
  check('both hold their spawn, tether 0, waking', ['chief', 'lieutenant-0'].every((k) => same(G.DETAILS[k].traits.post && { ...G.DETAILS[k].traits.post, note: 0 }, { tile: 'spawn', tether: 0, wake: true, note: 0 })));
  check('余滄海’s page', same(pageOf(s, chief).slice(1), ['【坐鎮】守在橋頭不動；有俠客踏入他的攻擊範圍，或他受到攻擊後，才離位追擊。']), JSON.stringify(pageOf(s, chief)));
  check('木高峰’s page', same(pageOf(s, blade).slice(1), ['【坐鎮】守在橋尾不動；有俠客踏入攻擊範圍或受到攻擊後，才離位追擊。']), JSON.stringify(pageOf(s, blade)));
  check('their posts are ground the heroes can walk to', postsReachable(s));
  check('the danger zone shows them where they stand only', G.standCells(s, chief).length === 1 && G.standCells(s, blade).length === 1);
  const at = [chief, blade].map((u) => [u.x, u.y]);
  G.startEnemy(s);
  for (const e of G.enemies(s)) G.enemyAct(s, e);
  check('the heroes far off, neither moves in the first enemy turn', same([chief, blade].map((u) => [u.x, u.y]), at));
  closeRound(s);
  // A hero steps beside 余滄海: he strikes and leaves the bridgehead.
  const p = [chief.x - 1, chief.y];
  if (!G.walkable(...p, 0) || G.at(s, ...p)) p[0] += 2;
  const hero = put(s, 'hero', ...p);
  soloTurn(s, chief);
  check('a hero beside him is struck, and he wakes', hero.hp < hero.maxHp && chief.woke === true);
}

section('board 1 紅楓驛: the physician');
for (const stage of [1, 2]) {
  const s = realBoard(1, stage);
  const [tian, yan, bow, scout] = foesOf(s);
  const want = { 1: [[118, 26, 14, 3, 1], [60, 18, 8, 2, 1]], 2: [[147, 29, 15, 3, 1], [71, 20, 9, 2, 1]] }[stage];
  check('stage ' + stage + ': 田歸農 and 閻基 have the spec’s numbers', same(numbersOf(tian), want[0]) && same(numbersOf(yan), want[1]), numbersOf(tian) + ' / ' + numbersOf(yan));
  check('stage ' + stage + ': 閻基 knows 接骨續筋, a mend', G.unitDetails(yan).skill === '接骨續筋' && G.enemyTechnique(yan, s).style === 'mend' && !G.enemyTechnique(yan, s).strikes);
  const heal = 20 + 5 * stage;
  check('stage ' + stage + ': his page', same(pageOf(s, yan), ['蓄勢時替三格內氣血不足七成的同夥回復 ' + heal + ' 點氣血，此回合不出手；無人受傷時改以普攻出手，蓄勢保留。']), JSON.stringify(pageOf(s, yan)));
  check('stage ' + stage + ': 天龍快劍 at 1.20', G.enemyTechnique(tian, s).factor === 1.2);
  check('stage ' + stage + ': the rank and file are named', G.unitDetails(bow).name === '天龍門弟子' && G.unitDetails(scout).name === '驛站打手' && G.unitDetails(scout).school === '閻府');
  // His mend is due from round 2; the archer, hurt, stands near enough on the real map.
  s.round = 2;
  bow.hp = Math.floor(bow.maxHp / 3);
  const life = bow.hp;
  const effects = soloTurn(s, yan);
  check('stage ' + stage + ': in round 2 he mends the hurt archer on this map', bow.hp === Math.min(bow.maxHp, life + heal) && effects.signature && G.distance(yan, bow) <= 3, [bow.hp, life, yan.x, yan.y]);
}

section('board 2 蘆花汀: the dissolver and his disciples');
for (const stage of [1, 2]) {
  const s = realBoard(2, stage);
  const [ding, zhai, bow, scout] = foesOf(s);
  const want = { 1: [[131, 26, 12, 2, 2], [67, 21, 8, 2, 1]], 2: [[163, 29, 13, 2, 2], [79, 23, 9, 2, 1]] }[stage];
  check('stage ' + stage + ': 丁春秋 and 摘星子 have the spec’s numbers', same(numbersOf(ding), want[0]) && same(numbersOf(zhai), want[1]), numbersOf(ding) + ' / ' + numbersOf(zhai));
  check('stage ' + stage + ': 化功大法 drains 6 + 2 × stage at 1.10', G.enemyTechnique(ding, s).factor === 1.1 && G.enemyTechnique(ding, s).power === 6 + 2 * stage);
  check('stage ' + stage + ': 摘星子’s signature reaches 3', G.enemyTechnique(zhai, s).reach === 3 && pageOf(s, zhai).includes('絕技射程 3 格。'));
  check('stage ' + stage + ': the disciples are on the stage curve less 2 attack', [bow, scout].every((u) => G.unitDetails(u).name === '星宿弟子' && G.unitDetails(u).traits.cover === 'master'));
  check('stage ' + stage + ': 丁春秋’s page', same(pageOf(s, ding).slice(1), ['【門人代受】相鄰的星宿弟子替他承受俠客的直接攻擊（氣血較多者先上）；波及、穿行、走勁與毒傷仍會落在他身上。', '【化功】貼身打中他的俠客損失 ' + (8 + stage) + ' 點內力（封穴時無效）。']), JSON.stringify(pageOf(s, ding)));
  check('stage ' + stage + ': a disciple’s page', same(G.enemyTraitLines(s, bow), ['【護駕】每回合先回到丁春秋身旁；與他相鄰時替他受招。']), JSON.stringify(G.enemyTraitLines(s, bow)));
  // Two enemy turns with the heroes at their spawn: the disciples gather beside him.
  for (let r = 0; r < 2; r++) {
    G.startEnemy(s);
    for (const e of G.enemies(s)) G.enemyAct(s, e);
    G.nextRound(s);
  }
  check('stage ' + stage + ': after two turns both disciples stand beside him', G.distance(bow, ding) === 1 && G.distance(scout, ding) === 1, [ding.x, ding.y, bow.x, bow.y, scout.x, scout.y]);
  // A hero beside him: the disciple with more 氣血 takes the blow, and 化功 does not touch him.
  const spot = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => ({ x: ding.x + dx, y: ding.y + dy })).find((p) => G.walkable(p.x, p.y, s.mapIndex) && !G.at(s, p.x, p.y));
  if (!spot) {
    check('stage ' + stage + ': a free tile beside him to strike from', false);
    continue;
  }
  const hero = put(s, 'hero', spot.x, spot.y);
  bow.hp -= 5;
  const f = G.forecast(hero, ding, false, s);
  check('stage ' + stage + ': the blow goes to the disciple with more 氣血, without 化功', f.coveredBy === 'echoScout' && !f.contact && f.notes[0] === '代受 · 星宿弟子代丁春秋受招', JSON.stringify([f.coveredBy, f.contact, f.notes[0]]));
  // §8: cover first decides the receiver; the master's own 閃身 is untouched.
  ding.conditions = { evade: { power: 1, through: s.round, source: ding.id } };
  const life = [ding.hp, scout.hp];
  G.resolve(s, hero, ding, false);
  check('stage ' + stage + ': with him evading, the disciple still takes it and his 閃身 stays', ding.hp === life[0] && scout.hp < life[1] && !!ding.conditions.evade);
}

section('board 3 聽雪棧: the survivor and the scavenger');
for (const stage of [3, 4]) {
  const s = realBoard(3, stage);
  const [xue, bao, bow, scout] = foesOf(s);
  const want = { 3: [[195, 35, 13, 3, 1], [100, 26, 10, 3, 1]], 4: [[267, 38, 14, 3, 1], [145, 33, 11, 3, 1]] }[stage];
  check('stage ' + stage + ': 血刀老祖 and 寶象 have the spec’s numbers', same(numbersOf(xue), want[0]) && same(numbersOf(bao), want[1]), numbersOf(xue) + ' / ' + numbersOf(bao));
  check('stage ' + stage + ': his sweep takes a third', G.enemyTechnique(xue, s).sweep === 0.33 && pageOf(s, xue)[0] === '相鄰的其他我方俠客也會受到三分之一傷害。');
  check('stage ' + stage + ': 血刀老祖’s page', pageOf(s, xue).includes('【半血變招 · 遁走】氣血過半後退向最近的藥草地，三回合內只打身邊的人；在藥草地每回合回復最大氣血的 8%，回到七成五即止。'), JSON.stringify(pageOf(s, xue)));
  check('stage ' + stage + ': 寶象 holds the trestle mouth and hunts the wounded (RULINGS F)', same(G.enemyTraitLines(s, bao), ['【坐鎮】守在棧口（7，4）一格內，不離位。', '【偏好】專挑傷重者。']), JSON.stringify(G.enemyTraitLines(s, bao)));
  check('stage ' + stage + ': the archer-monk holds the north ledge', same(G.enemyTraitLines(s, bow), ['【坐鎮】守在崖棧（9，2）一格內，不離位。']) && G.unitDetails(scout).name === '血刀門僧', JSON.stringify(G.enemyTraitLines(s, bow)));
  check('stage ' + stage + ': the posts are ground the heroes can walk to', postsReachable(s));
  // At half health he runs for the herbs nearest him, and gets there.
  const herbs = mapLayout(3).cells.filter((c) => G.terrainInfo(c.x, c.y, 3)?.heal);
  check('stage ' + stage + ': the map has herbs', herbs.length >= 2);
  xue.hp = Math.floor(xue.maxHp / 2);
  G.check(s);
  check('stage ' + stage + ': half health starts the flight', xue.phased && G.fleeing(s, xue) && s.logs.at(-1).text === G.unitDetails(xue).traits.phase.log);
  for (let r = 0; r < 2 && !G.terrainInfo(xue.x, xue.y, 3).heal; r++) {
    soloTurn(s, xue);
    closeRound(s);
  }
  check('stage ' + stage + ': within two turns he stands on herbs', !!G.terrainInfo(xue.x, xue.y, 3).heal, [xue.x, xue.y]);
  const life = xue.hp;
  soloTurn(s, xue);
  closeRound(s);
  check('stage ' + stage + ': there he recovers 8% a round', xue.hp - life === Math.round(xue.maxHp * 0.08), xue.hp - life);
  // 寶象 holds the mouth: with no one in reach he does not leave it.
  const at = [bao.x, bao.y];
  soloTurn(s, bao);
  check('stage ' + stage + ': 寶象 stays at the trestle mouth with no one in reach', G.distance(bao, { x: 6, y: 3 }) <= 1 && same([bao.x, bao.y], at));
}

section('board 4 空山琴臺: the commander behind the gate');
for (const stage of [3, 4]) {
  const s = realBoard(4, stage);
  const [zuo, fei, bow, scout] = foesOf(s);
  const want = { 3: [[215, 33, 17, 3, 2], [109, 26, 13, 2, 1]], 4: [[294, 36, 18, 3, 2], [158, 33, 14, 2, 1]] }[stage];
  check('stage ' + stage + ': 左冷禪 and 費彬 have the spec’s numbers', same(numbersOf(zuo), want[0]) && same(numbersOf(fei), want[1]), numbersOf(zuo) + ' / ' + numbersOf(fei));
  const n = 1 + stage;
  check('stage ' + stage + ': 盟令 gives every other enemy ＋' + n, [fei, bow, scout].every((u) => G.stat(u, 'atk', s) === u.atk + n && G.standingLines(s, u).includes('盟令 ＋' + n)) && G.stat(zuo, 'atk', s) === zuo.atk);
  check('stage ' + stage + ': 寒冰真氣 pins, at 1.15', G.enemyTechnique(zuo, s).style === 'pin' && G.enemyTechnique(zuo, s).factor === 1.15);
  check('stage ' + stage + ': 左冷禪’s page', same(pageOf(s, zuo), ['令目標絆足，移動減 2，持續至下回合。', '【盟令】存活時其餘敵人攻擊 ＋' + n + '。', '【坐鎮】守在琴臺（7，12）兩格內；受到攻擊後才離臺。']), JSON.stringify(pageOf(s, zuo)));
  check('stage ' + stage + ': 費彬’s page', same(G.enemyTraitLines(s, fei), ['【坐鎮】守在石階（6，7）一格內，不離位；被牽離後會走回。']), JSON.stringify(G.enemyTraitLines(s, fei)));
  check('stage ' + stage + ': the posts are ground the heroes can walk to', postsReachable(s));
  // A whole enemy phase with the heroes at their spawn: the two stay on their ground.
  for (let r = 0; r < 2; r++) {
    G.startEnemy(s);
    for (const e of G.enemies(s)) G.enemyAct(s, e);
    G.nextRound(s);
  }
  check('stage ' + stage + ': after two turns 左冷禪 is within two of the terrace and 費彬 on his step', G.distance(zuo, { x: 6, y: 11 }) <= 2 && G.distance(fei, { x: 5, y: 6 }) <= 1, [zuo.x, zuo.y, fei.x, fei.y]);
  // His own blow keeps him on the terrace; a hero's drops it.
  const spot = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => ({ x: zuo.x + dx, y: zuo.y + dy })).find((p) => G.walkable(p.x, p.y, s.mapIndex) && !G.at(s, p.x, p.y));
  const hero = put(s, 'guard', spot.x, spot.y);
  soloTurn(s, zuo);
  check('stage ' + stage + ': striking a hero does not wake him', !zuo.woke && hero.hp < hero.maxHp);
  closeRound(s);
  G.resolve(s, hero, zuo, false);
  check('stage ' + stage + ': struck, he leaves the terrace', zuo.woke === true);
}

section('board 5 桃花石陣: the coiled beast');
for (const stage of [5, 6]) {
  const s = realBoard(5, stage);
  const [ou, ke, bow, scout] = foesOf(s);
  const want = { 5: [[339, 47, 18, 3, 2], [173, 40, 12, 3, 2]], 6: [[411, 59, 20, 3, 2], [214, 50, 13, 3, 2]] }[stage];
  check('stage ' + stage + ': 歐陽鋒 and 歐陽克 have the spec’s numbers', same(numbersOf(ou), want[0]) && same(numbersOf(ke), want[1]), numbersOf(ou) + ' / ' + numbersOf(ke));
  check('stage ' + stage + ': 蛤蟆功 at 1.40; 靈蛇拳法 pins at 1.12', G.enemyTechnique(ou, s).factor === 1.4 && G.enemyTechnique(ke, s).style === 'pin' && G.enemyTechnique(ke, s).factor === 1.12);
  check('stage ' + stage + ': 歐陽鋒’s page', same(pageOf(s, ou).slice(1), ['【蓄勢反擊】蓄勢時原地不動，只打兩格內的人；兩格內打他，必遭全力還擊（免受還擊之招與封穴除外）。', '【半血變招 · 逆練】攻擊 ＋6、防禦 −4、移動 ＋1，絕技每兩回合一次，不再原地等待，見人就撲。']), JSON.stringify(pageOf(s, ou)));
  const venom = 2 + Math.floor(stage / 2);
  check('stage ' + stage + ': the snake slaves’ page', [bow, scout].every((u) => same(G.enemyTraitLines(s, u), ['【蛇毒】普攻令目標中毒，兩次毒發各損 ' + venom + ' 氣血。'])), JSON.stringify(G.enemyTraitLines(s, bow)));
  // Charged from round 2: he does not move, and the danger zone is his own tile's diamond.
  s.round = 2;
  check('stage ' + stage + ': charged in round 2, he is held to his tile', G.signatureDue(s, ou) && G.standCells(s, ou).length === 1);
  const at = [ou.x, ou.y];
  soloTurn(s, ou);
  check('stage ' + stage + ': with no one within two tiles he waits', same([ou.x, ou.y], at));
  closeRound(s);
  // At half: mad.
  ou.hp = Math.floor(ou.maxHp / 2);
  G.check(s);
  check('stage ' + stage + ': at half he goes mad', ou.phased && ou.atk === want[0][1] + 6 && ou.def === want[0][2] - 4 && ou.step === 4 && s.logs.at(-1).text === G.unitDetails(ou).traits.phase.log);
  check('stage ' + stage + ': mad, he no longer waits while charged', G.signatureDue(s, ou) && !G.holdOf(s, ou) && G.standCells(s, ou).length > 1);
  check('stage ' + stage + ': …and his signature comes every two rounds', G.enemyTechnique(ou, s).cadence === 2);
  // A snake slave's bite.
  const p = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => ({ x: scout.x + dx, y: scout.y + dy })).find((q) => G.walkable(q.x, q.y, s.mapIndex) && !G.at(s, q.x, q.y));
  const hero = put(s, 'guard', p.x, p.y);
  soloTurn(s, scout);
  check('stage ' + stage + ': a snake slave’s strike poisons', hero.conditions?.poison?.power === venom);
}

section('board 6 襄陽殘垣: the siege engine and the picker');
for (const stage of [5, 6]) {
  const s = realBoard(6, stage);
  const [jin, huo, bow, scout] = foesOf(s);
  const want = { 5: [[373, 47, 20, 2, 2], [156, 44, 12, 4, 2]], 6: [[452, 59, 22, 2, 2], [193, 54, 13, 4, 2]] }[stage];
  check('stage ' + stage + ': 金輪國師 and 霍都 have the spec’s numbers', same(numbersOf(jin), want[0]) && same(numbersOf(huo), want[1]), numbersOf(jin) + ' / ' + numbersOf(huo));
  check('stage ' + stage + ': 龍象般若功 is a line at 1.30 reaching 3', G.enemyTechnique(jin, s).style === 'line' && G.enemyTechnique(jin, s).factor === 1.3 && G.enemyTechnique(jin, s).reach === 3);
  check('stage ' + stage + ': 金輪國師’s page', same(pageOf(s, jin), ['輪勢穿過目標，再以一半威力擊中其後兩格內首名俠客（危險範圍不顯示穿透）。', '絕技射程 3 格。', '【雙局主】與完顏洪烈同為局主，兩人都倒下才算取勝（守滿回合亦勝）。']), JSON.stringify(pageOf(s, jin)));
  check('stage ' + stage + ': 霍都 holds the gateway (RULINGS F) and picks the lone hero', same(G.enemyTraitLines(s, huo), ['【坐鎮】守在門洞（6，5）一格內，不離位。', '【偏好】專挑落單者。']), JSON.stringify(G.enemyTraitLines(s, huo)));
  check('stage ' + stage + ': the archer holds the east wall; the horseman rides five', same(G.enemyTraitLines(s, bow), ['【坐鎮】守在東牆（15，6）一格內，不離位。']) && scout.step === 5);
  check('stage ' + stage + ': the posts are ground the heroes can walk to', postsReachable(s));
  // 霍都 from his gateway: of two heroes in his reach, the one standing alone.
  const ring = (c, d) => mapLayout(6).cells.filter((p) => G.distance(p, c) === d && G.walkable(p.x, p.y, 6) && !G.at(s, p.x, p.y));
  const near = ring(huo, 2);
  const lone = near[0],
    pair = near.find((p) => G.distance(p, lone) > 3 && ring(p, 1).some((q) => G.distance(q, huo) >= 2 && G.distance(q, lone) > 1));
  if (pair) {
    const friend = ring(pair, 1).find((q) => G.distance(q, huo) >= 2 && G.distance(q, lone) > 1);
    put(s, 'medic', lone.x, lone.y);
    put(s, 'guard', pair.x, pair.y).hp = 90;
    put(s, 'hero', friend.x, friend.y);
    const before = unit(s, 'medic').hp;
    soloTurn(s, huo);
    check('stage ' + stage + ': 霍都 strikes the hero alone, and stays at the gateway', unit(s, 'medic').hp < before && G.distance(huo, { x: 5, y: 4 }) <= 1);
    closeRound(s);
  } else check('stage ' + stage + ': room by the gateway for the preference check', false);
  // The wheels: in line, the hero behind takes half.
  s.round = 2;
  const p = [[1, 0], [-1, 0], [0, 1], [0, -1]].find(([dx, dy]) => [1, 2, 3].every((i) => G.walkable(jin.x + dx * i, jin.y + dy * i, 6) && !G.at(s, jin.x + dx * i, jin.y + dy * i)));
  if (p) {
    for (const v of G.party(s)) if (['hero', 'medic', 'guard'].includes(v.id)) Object.assign(v, { x: -9, y: -9 }); else v.hp = 0; // the three are put again below; a recruit sits out
    const front = put(s, 'guard', jin.x + p[0] * 2, jin.y + p[1] * 2);
    const back = put(s, 'medic', jin.x + p[0] * 3, jin.y + p[1] * 3);
    put(s, 'hero', mapLayout(6).allies[0].x, mapLayout(6).allies[0].y);
    const life = back.hp;
    soloTurn(s, jin);
    check('stage ' + stage + ': the wheel goes through to the hero behind', back.hp < life, [jin.x, jin.y, front.x, front.y, back.x, back.y]);
  } else check('stage ' + stage + ': a straight run of ground by 金輪國師', false);
}

section('board 7 寒玉石室: the venom that stops the healing');
{
  const s = realBoard(7, 7);
  const [li, hong, bow, scout] = foesOf(s);
  check('李莫愁 and 洪凌波 have the spec’s numbers', same(numbersOf(li), [483, 70, 19, 4, 2]) && same(numbersOf(hong), [255, 65, 16, 3, 2]), numbersOf(li) + ' / ' + numbersOf(hong));
  check('冰魄銀針: poison 10 and 內傷, reach 3', G.enemyTechnique(li, s).power === 10 && G.enemyTechnique(li, s).extra === 'wound' && G.enemyTechnique(li, s).reach === 3);
  check('李莫愁’s page', same(pageOf(s, li), ['令目標中毒，兩次毒發各損 10 氣血，並受內傷：療傷減半，每次出手後自損 5 氣血，持續至下回合。', '絕技射程 3 格。', '【偏好】專挑療傷者。']), JSON.stringify(pageOf(s, li)));
  check('洪凌波’s post is (6,4), walkable', G.walkable(5, 3, 7) && same(G.enemyTraitLines(s, hong), ['【坐鎮】守在石頸北口（6，4）一格內，不離位。']), JSON.stringify(G.enemyTraitLines(s, hong)));
  check('the posts are ground the heroes can walk to', postsReachable(s));
  check('the rank and file are 赤練門下', G.unitDetails(bow).name === '赤練門下' && G.unitDetails(scout).name === '赤練門下');
  // Her needles on a healer: poison and 內傷, and the healer's heal is halved.
  s.round = 2;
  const ring = mapLayout(7).cells.filter((p) => G.distance(p, li) === 3 && G.walkable(p.x, p.y, 7) && !G.at(s, p.x, p.y));
  for (const v of G.party(s)) if (['hero', 'medic', 'guard'].includes(v.id)) Object.assign(v, { x: -9, y: -9 }); else v.hp = 0; // the three are put again below; a recruit sits out
  put(s, 'medic', ring[0].x, ring[0].y);
  const guardAt = ring.find((p) => G.distance(p, ring[0]) > 2);
  put(s, 'guard', guardAt.x, guardAt.y).hp = 60;
  put(s, 'hero', mapLayout(7).allies[0].x, mapLayout(7).allies[0].y);
  soloTurn(s, li);
  const medic = unit(s, 'medic');
  check('she picks the healer over a more hurt hero', medic.conditions?.poison?.power === 10 && medic.conditions?.wound?.power === 5, JSON.stringify(medic.conditions));
  closeRound(s);
  const f = G.forecast(medic, medic, true, s);
  check('wounded, the healer’s own heal is halved', f.notes.includes('內傷 · 療效減半'));
  // 洪凌波 stays at the neck.
  soloTurn(s, hong);
  check('洪凌波 stays within one of the neck', G.distance(hong, { x: 5, y: 3 }) <= 1);
}

section('board 8 倒影天街: the masked duelist');
{
  const s = realBoard(8, 8);
  const [yue, lao, bow, scout] = foesOf(s);
  check('岳不群 and 勞德諾 have the spec’s numbers', same(numbersOf(yue), [555, 82, 23, 4, 1]) && same(numbersOf(lao), [296, 76, 15, 4, 2]), numbersOf(yue) + ' / ' + numbersOf(lao));
  check('岳不群’s page', same(pageOf(s, yue).slice(1), ['【游擊】出手後退開至多 2 步，離俠客越遠越好。', '【半血變招 · 辟邪現形】移動 ＋2、防禦 −3，絕技每兩回合一次。', '【雙局主】與鮮于通同為局主，兩人都倒下才算取勝。']), JSON.stringify(pageOf(s, yue)));
  check('勞德諾 hunts the leader', same(G.enemyTraitLines(s, lao), ['【偏好】專挑領隊。']));
  check('the archer holds the footbridge', same(G.enemyTraitLines(s, bow), ['【坐鎮】守在橋頭（13，5）一格內，不離位。']) && G.unitDetails(scout).name === '嵩山密探');
  check('the posts are ground the heroes can walk to', postsReachable(s));
  // Strike, then walk off.
  for (const v of G.party(s)) if (!['hero', 'medic', 'guard'].includes(v.id)) v.hp = 0;
  const spot = mapLayout(8).cells.find((p) => G.distance(p, yue) === 3 && G.walkable(p.x, p.y, 8) && !G.at(s, p.x, p.y));
  const hero = put(s, 'guard', spot.x, spot.y);
  soloTurn(s, yue);
  check('he strikes and walks off from the hero', hero.hp < hero.maxHp && G.distance(yue, hero) >= 2, [yue.x, yue.y, hero.x, hero.y]);
  closeRound(s);
  yue.hp = Math.floor(yue.maxHp / 2);
  G.check(s);
  check('at half the mask comes off', yue.phased && yue.step === 6 && yue.def === 20 && G.enemyTechnique(yue, s).cadence === 2 && s.logs.slice(-3).some((l) => l.text === G.unitDetails(yue).traits.phase.log), JSON.stringify([yue.phased, yue.step, yue.def, s.logs.slice(-3)]));
}

section('board 9 無刻漏臺: the mirror');
{
  const s = realBoard(9, 9);
  const [mu, jiu, bow, scout] = foesOf(s);
  check('慕容博 and 鳩摩智 have the spec’s numbers', same(numbersOf(mu), [867, 93, 24, 4, 2]) && same(numbersOf(jiu), [337, 86, 16, 3, 2]), numbersOf(mu) + ' / ' + numbersOf(jiu));
  check('斗轉星移 is the mirror, no blow', G.enemyTechnique(mu, s).style === 'mirror' && !G.enemyTechnique(mu, s).strikes);
  check('慕容博’s page', same(pageOf(s, mu), ['蓄勢時，第一次受到的直接攻擊全數不中，反震一半給出手者（封穴時無效）。', '【星索護陣】每根立著的星索樁替他抵擋 35% 傷害。', '【半血變招】攻擊 ＋5、防禦 ＋4、射程擴至三格。']), JSON.stringify(pageOf(s, mu)));
  check('鳩摩智’s page', same(pageOf(s, jiu), ['另外削去目標 24 點內力。', '絕技射程 4 格。', '【偏好】專挑內力深厚者。']), JSON.stringify(pageOf(s, jiu)));
  check('the rope-holders’ page', [bow, scout].every((u) => same(G.enemyTraitLines(s, u), ['【坐鎮】守在索樁一格內，不離位。'])), JSON.stringify(G.enemyTraitLines(s, bow)));
  check('the posts are ground the heroes can walk to', postsReachable(s));
  check('two standing star posts take 70% off him', G.wardShare(s, mu) === 70);
  // The mirror: charged in round 2, the first direct blow does him nothing and turns half back.
  for (const v of G.party(s)) if (!['hero', 'medic', 'guard'].includes(v.id)) v.hp = 0;
  s.round = 2;
  const spot = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => ({ x: mu.x + dx, y: mu.y + dy })).find((p) => G.walkable(p.x, p.y, 9) && !G.at(s, p.x, p.y));
  const guard = put(s, 'guard', spot.x, spot.y);
  guard.acted = guard.moved = false;
  const f = G.forecast(guard, mu, false, s);
  const life = [mu.hp, guard.hp];
  G.resolve(s, guard, mu, false);
  check('the first blow does him nothing and turns back on the striker', mu.hp === life[0] && guard.hp < life[1] && f.amount === 0 && f.notes.some((n) => n.startsWith('斗轉星移 · 慕容博不受此擊')));
  check('the charge is spent; he did not counter', mu.signatureRound === 2 && !G.signatureDue(s, mu) && f.counterRaw === 0);
  mu.hp = Math.floor(mu.maxHp / 2);
  const atk = mu.atk;
  G.check(s);
  check('at half his phase is the data’s', mu.phased && mu.atk === atk + 5 && mu.range === 3 && mu.brace && s.logs.at(-1).text === G.unitDetails(mu).traits.phase.log);
  // A rope breaks: a hero fells the post it is tied to.
  const post = unit(s, 'starPost#1');
  post.hp = 1;
  const reach = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => ({ x: post.x + dx, y: post.y + dy })).find((p) => G.walkable(p.x, p.y, 9) && !G.at(s, p.x, p.y));
  const hero = put(s, 'hero', reach.x, reach.y);
  hero.acted = hero.moved = false;
  G.resolve(s, hero, post, false);
  check('one rope down: the ward is 35% and the log says so', G.wardShare(s, mu) === 35 && s.logs.some((l) => l.text === '一條星索斷了。慕容博的護勁降至三成半。'));
}

// ── Board objects (roadmap 0.11 stage two): 守 the qin and the drum, 破 the star posts ─────
section('board objects: 守 and 破');
const { BOARD_OBJECTS } = await load('data/board-objects.js');
const { ENCOUNTER_SCRIPT } = await load('data/encounter-script.js');
{
  // Every hero off the board but the leader, who is parked where no enemy will reach this turn.
  const clearHeroes = (s) => {
    for (const v of G.party(s)) if (v.id !== s.leader) v.hp = 0;
  };
  const s = realBoard(4, 3);
  const qin = unit(s, 'guqin'),
    zuo = unit(s, G.commanderId(s));
  const row = G.stageRows(4, 3).master;
  check('空山琴臺 is a 守 board, its qin on a 琴座 stone east of the steps', G.boardKind(s) === 'keep' && qin && qin.side === 'prop' && qin.x === 8 && qin.y === 5 && G.terrainInfo(8, 5, 4).name === '琴座矮石');
  check('the qin’s 氣血 and 防禦 come from the stage’s master row', qin.maxHp === Math.round(row[0] * BOARD_OBJECTS.guqin.hp) && qin.def === row[2] + BOARD_OBJECTS.guqin.def, [qin.maxHp, qin.def]);
  check('it is no hero’s and no foe’s piece', !G.party(s).includes(qin) && !G.enemies(s).includes(qin) && G.props(s).includes(qin));
  const hero = unit(s, s.leader);
  const spot = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => ({ x: qin.x + dx, y: qin.y + dy })).find((p) => G.walkable(p.x, p.y, 4) && !G.at(s, p.x, p.y));
  put(s, s.leader, spot.x, spot.y);
  hero.acted = hero.moved = false;
  check('a hero may not strike the qin, with a plain blow or an art', !G.targetOK(s, hero, qin, false) && !G.targetOK(s, hero, qin, true));
  check('a black stone may', G.hostile(zuo, qin) && !G.hostile(zuo, zuo));
  check('nobody walks onto or through its tile', !G.reachable(s, hero).has(G.key(qin.x, qin.y)));
  BM.applyCondition(s, qin, { kind: 'pin', power: 2, turns: 2 }, zuo);
  check('it takes no condition', !qin.conditions?.pin);
  const live = R.briefing(s, { live: true });
  check('軍情 names the kind, the hold and the qin', live.kindName === '守' && live.win.includes('七弦琴') && live.win.includes('第八回合') && live.objects.length === 1 && live.objects[0].art === 'object-qin.webp');
  check('and the goals page has its 氣血 and the rounds to hold', live.live.objects[0].hp === qin.hp && live.live.hold === '尚須守 8 回合', JSON.stringify(live.live));
  // A black stone beside it with no hero in reach strikes the qin, and the board says so once.
  const raider = G.enemies(s).find((v) => v.id !== G.commanderId(s) && !G.traitsOf(v).post);
  const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => ({ x: qin.x + dx, y: qin.y + dy })).find((p) => G.walkable(p.x, p.y, 4) && !G.at(s, p.x, p.y));
  Object.assign(raider, near);
  hero.x = mapLayout(4).allies[0].x;
  hero.y = mapLayout(4).allies[0].y;
  clearHeroes(s);
  G.party(s).forEach((v) => v.hp > 0 && Object.assign(v, { x: 3, y: 0 }));
  const before = qin.hp;
  soloTurn(s, raider);
  check('a black stone with the qin in reach strikes it', qin.hp < before, [before, qin.hp, raider.id, raider.x, raider.y]);
  check('the first blow on it is told by the board', s.logs.some((l) => l.text === ENCOUNTER_SCRIPT[4].objects.guqin.hit.text));
  check('it gave no counter and the striker is unhurt', raider.hp === raider.maxHp);
  // Holding: not won in round 7, won once round 8's enemy phase is over.
  const hold = copy(s);
  hold.round = 7;
  hold.phase = 'enemy';
  for (const e of G.enemies(hold)) e.acted = true;
  G.check(hold);
  check('round 7 held is not yet a win', hold.result === null);
  hold.round = 8;
  G.check(hold);
  check('round 8 held: won, the board says the thought ran out', hold.result === 'win' && hold.logs.some((l) => l.text === ENCOUNTER_SCRIPT[4].objects.guqin.held.text));
  const early = copy(s);
  early.round = 8;
  early.phase = 'ally';
  G.check(early);
  check('round 8 is not held until its enemy phase is over', early.result === null);
  // Felling every master wins too; the qin breaking loses, whatever else.
  const slay = copy(s);
  unit(slay, G.commanderId(slay)).hp = 0;
  G.check(slay);
  check('felling 左冷禪 wins the 守 board', slay.result === 'win');
  const lost = copy(s);
  unit(lost, 'guqin').hp = 1;
  const breaker = G.enemies(lost).find((v) => v.id === raider.id);
  for (const e of G.enemies(lost)) e.acted = e !== breaker;
  G.enemyAct(lost, breaker);
  check('the qin broken loses the board, with the board’s own reason', lost.result === 'loss' && lost.reason === ENCOUNTER_SCRIPT[4].objects.guqin.lost, lost.reason);
  check('and its breaking is no fall in the tally', !lost.tally.falls.some((f) => f.id === 'guqin'));
  // A save keeps it; a save from before boards had objects plays the board as it began.
  const kept = R.restoreRun(copy(s));
  check('a save keeps the qin', !!kept && G.props(kept).length === 1 && G.find(kept, 'guqin').hp === qin.hp);
  const old = copy(s);
  old.units = old.units.filter((u) => u.side !== 'prop');
  const restored = R.restoreRun(old);
  check('a save from before the qin loads and plays as 斬將', !!restored && G.boardKind(restored) === 'slay');
  // The danger zone: the qin threatens nothing, and its tile is shaded when a black stone reaches it.
  const zone = dangerTiles(s);
  check('the danger zone shades the qin’s tile', zone.has(G.key(qin.x, qin.y)));
}
{
  const s = realBoard(6, 5);
  const drum = unit(s, 'warDrum');
  check('襄陽殘垣 is a 守 board, its drum where the passage south opens, held through round 9', G.boardKind(s) === 'keep' && drum && drum.x === 6 && drum.y === 9 && G.boardOf(s).hold === 9);
  const jin = unit(s, G.commanderId(s));
  jin.hp = 0;
  G.check(s);
  check('felling 金輪國師 while 完顏洪烈 has not come is no win', s.result === null && G.objectiveLeft(s).masters.includes('wanYan'));
}
{
  const s = realBoard(9, 9);
  const [a, b] = ['starPost#1', 'starPost#2'].map((id) => unit(s, id));
  check('無刻漏臺 is a 破 board with two star posts beside the rope-keepers', G.boardKind(s) === 'break' && a && b && G.distance(a, unit(s, 'echoBow')) === 1 && G.distance(b, unit(s, 'echoScout')) === 1);
  const hero = unit(s, s.leader);
  const spot = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => ({ x: a.x + dx, y: a.y + dy })).find((p) => G.walkable(p.x, p.y, 9) && !G.at(s, p.x, p.y));
  put(s, s.leader, spot.x, spot.y);
  hero.acted = hero.moved = false;
  const f = G.forecast(hero, a, false, s);
  check('a hero may strike a post: a plain blow, no counter, no push, no rider', G.targetOK(s, hero, a, false) && f.amount > 0 && f.counterRaw === 0 && !f.push && !f.effects.length && f.notes.includes(G.OBJECT_NOTE));
  check('no black stone strikes a post', !G.hostile(unit(s, G.commanderId(s)), a));
  check('splash and arcs pass the posts by', !FR.secondaryTargets(s, hero, unit(s, 'echoBow'), unit(s, 'echoBow'), { splash: 1 }, ['arc'], G.walkable).has(a));
  a.hp = 1;
  G.resolve(s, hero, a, false);
  check('one post down: no result yet, the ward halves, the board speaks', !s.result && G.wardShare(s, unit(s, 'murong')) === 35 && s.logs.some((l) => l.text === ENCOUNTER_SCRIPT[9].objects.starPost.broken.text));
  check('a post broken is no kill', s.stats.kills === 0 || !s.tally.falls.some((x) => x.id.startsWith('starPost')));
  b.hp = 0;
  G.check(s);
  check('both down: the 破 board is won, 慕容博 standing', s.result === 'win' && G.living(unit(s, 'murong')));
}

// ── The shop's new items: 屠龍刀, 軟蝟甲 (反刺), 九花玉露丸, 玉蜂漿 ──────────
section('items');
{
  // 反刺: a foe that strikes the wearer from beside her loses the barbs on top of whatever else
  // happens, measured against the same exchange without the vest.
  const exchange = (vest, { reach = 1, evade = false } = {}) => {
    const s = board();
    const hero = put(s, 'hero', 4, 7);
    hero.gear = vest ? 'hedgehogVest' : null;
    const foe = Object.assign(put(s, 'blade', 4 + reach, 7), { step: 0, range: reach });
    if (evade) BM.applyCondition(s, hero, { kind: 'evade', power: 1, turns: 1 }, hero);
    G.startEnemy(s);
    G.enemyAct(s, foe);
    return { foe: foe.hp, s };
  };
  const plain = exchange(false),
    pricked = exchange(true);
  check('a foe striking the wearer from beside her loses 7 more', plain.foe - pricked.foe === G.ITEMS.hedgehogVest.barbs && G.ITEMS.hedgehogVest.barbs === 7, plain.foe - pricked.foe);
  check('the log names the barbs', pricked.s.logs.some((l) => l.text.startsWith('軟蝟甲的倒刺扎傷')));
  check('a foe striking from two tiles away is not pricked', exchange(false, { reach: 2 }).foe === exchange(true, { reach: 2 }).foe);
  check('a blow 閃身 makes miss does not touch her', exchange(false, { evade: true }).foe === exchange(true, { evade: true }).foe);
  // Her own strike: the counter it draws from beside her is pricked, and the forecast says so.
  const s = board();
  const hero = put(s, 'hero', 4, 7);
  hero.gear = 'hedgehogVest';
  const foe = put(s, 'blade', 5, 7);
  const f = G.forecast(hero, foe, false, s);
  check('the forecast shows the counter pricked', f.counterRaw > 0 && f.barbs === 7 && f.notes.includes('反刺 · 還擊者被軟蝟甲扎傷 7 氣血'), JSON.stringify(f.notes));
  const before = foe.hp;
  G.resolve(s, hero, foe, false);
  check('the strike deals what the forecast said, barbs included', before - foe.hp === f.amount + 7, before - foe.hp);
  hero.gear = null;
  check('without the vest the forecast has no barbs', !G.forecast(hero, foe, false, s).barbs);

  // 九花玉露丸 lifts every ailment, then heals in full even through 內傷; with nothing to do it is kept.
  const pill = G.ITEMS.nineFlowerPill;
  check('its text names every ailment it lifts', FR.AILMENTS.every((k) => pill.desc.includes(BM.CONDITION_NAMES[k])));
  const m = board();
  const h = unit(m, 'hero');
  h.hp = 20;
  for (const kind of ['wound', 'poison', 'daze']) BM.applyCondition(m, h, { kind, power: 3, turns: 2 }, h);
  m.stock.nineFlowerPill = 1;
  check('九花玉露丸 is taken', G.consume(m, h, 'nineFlowerPill') && !m.stock.nineFlowerPill);
  check('it lifts 內傷, 中毒 and 失神', !h.conditions.wound && !h.conditions.poison && !h.conditions.daze);
  check('its healing is not halved by the 內傷 it lifted', h.hp === 20 + pill.hp, h.hp);
  m.stock.nineFlowerPill = 1;
  h.hp = h.maxHp;
  check('a hale hero is not given one', !G.consume(m, h, 'nineFlowerPill') && m.stock.nineFlowerPill === 1);

  // 玉蜂漿 restores both, and is worth taking when either is short.
  const nectar = G.ITEMS.beeNectar;
  h.hp = 40;
  h.mp = 5;
  m.stock.beeNectar = 2;
  check('玉蜂漿 restores 氣血 and 內力 at once', G.consume(m, h, 'beeNectar') && h.hp === 40 + nectar.hp && h.mp === Math.min(h.maxMp, 5 + nectar.mp));
  h.hp = h.maxHp;
  h.mp = 0;
  check('it is taken for 內力 alone when 氣血 is full', G.consume(m, h, 'beeNectar') && h.mp === Math.min(h.maxMp, nectar.mp));
  check('金創藥 is unchanged', (() => {
    h.hp = 10;
    m.stock.remedy = 1;
    return G.consume(m, h, 'remedy') && h.hp === 10 + G.ITEMS.remedy.hp && m.logs.at(-1).text === '服用金創藥，回復 48 點氣血。';
  })());

  // 屠龍刀: the most attack of any weapon, one step less, 定勢 on the basic attack.
  const w = board();
  const bearer = unit(w, 'guard');
  const step = G.stat(bearer, 'step', w),
    atk = G.stat(bearer, 'atk', w);
  bearer.weapon = 'dragonSaber';
  check('屠龍刀 adds 17 attack and costs a step', G.stat(bearer, 'atk', w) === atk - (G.ITEMS[G.startingHero('guard').weapon].atk || 0) + 17 && G.stat(bearer, 'step', w) === step - 1);
  check('its basic attack carries 定勢', G.formsFor(bearer, null).includes('still'));
  check('no shop weapon out-hits it', Object.entries(G.ITEMS).every(([id, it]) => it.kind !== 'weapon' || id === 'dragonSaber' || (it.atk || 0) < 17));

  // Taking an item out of the shop is one line: off the table, never on the shelf or under a cup.
  const offered = (id) => {
    for (let seed = 1; seed <= 40; seed++) {
      const c = board();
      c.run.seed = seed;
      c.run.stage = 5;
      c.run.last = { won: true, terminal: false };
      if (FM.makeOffers(c).some((o) => o.id === id)) return true;
    }
    return false;
  };
  check('屠龍刀 reaches the shelf in later stages', offered('dragonSaber'));
  const line = FM.MARKET_STOCK.dragonSaber;
  delete FM.MARKET_STOCK.dragonSaber;
  check('deleting its line keeps it off the shelf', !offered('dragonSaber'));
  check('and out of the cups', !FM.validVisit({ cards: ['dragonSaber', 'remedy', 'jade'], order: [0, 1, 2], phase: 'show', pick: null }));
  FM.MARKET_STOCK.dragonSaber = line;
}

// ── Boards that differ in kind (SPEC-battles) ─────────────────────────────────────────────────
// The battles table on the real maps, the kinds of win, two masters, reinforcements, the four
// troop traits, the deployment step, the facts a secondary reads, the secondaries, rewards and
// recruitment, and saves. Each block builds its boards with the real rules.
const { BATTLES, SIDE_REWARDS } = await load('data/battles.js');
const { VILLAINS, TROOPS, GISTS } = await load('data/encounters.js');
const piecesOf = (s) => G.enemies(s);
const at2 = (p) => ({ x: p[0], y: p[1] });
const ADJ = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// Every tile a hero could walk to from post 0, through any piece.
function reachableTiles(map) {
  const start = mapLayout(map).allies[0],
    seen = new Set([start.x + ',' + start.y]),
    queue = [start];
  for (const p of queue)
    for (const [dx, dy] of ADJ) {
      const q = { x: p.x + dx, y: p.y + dy };
      if (!seen.has(q.x + ',' + q.y) && G.walkable(q.x, q.y, map)) {
        seen.add(q.x + ',' + q.y);
        queue.push(q);
      }
    }
  return seen;
}
const allPieces = (b) => [...b.pieces, ...b.waves.flatMap((w) => w.pieces)];
const numbersAt = (map, stage, piece) => numbersOf(G.pieceUnit({ mapIndex: map, run: { stage }, units: [] }, piece));
// A run at the deployment step of `map` at `stage`, through story and briefing.
function deployedBoard(map, stage) {
  const s = realBoard(map, stage);
  return s;
}
// The old enemy numbers, as journey.js `defenders` computed them before stageRows.
function oldRows(map, depth) {
  const boss = map === 9,
    veteran = Math.max(0, depth - 4),
    seasoned = Math.max(0, depth - 3);
  return [
    [99 + depth * 32 + seasoned * 40 + (boss ? 240 : 0), 23 + veteran * 3 + Math.round(depth * 3.2 + veteran * 5.3), 10 + Math.round(depth * 1.6), depth >= 7 ? 4 : depth >= 3 ? 3 : 2, boss || depth >= 6 || [2, 4, 8].includes(map) ? 2 : 1],
    [55 + depth * 12 + seasoned * 29, 19 + veteran * 3 + Math.round(depth * 2.2 + seasoned * 5.4), 7 + depth, depth >= 3 ? 3 : 2, depth >= 6 ? 2 : 1],
    [48 + depth * 11 + seasoned * 29, 17 + veteran * 1 + Math.round(depth * 2.2 + seasoned * 5.4), 5 + depth, depth >= 4 ? 3 : 2, depth >= 6 ? 4 : 3],
    [51 + depth * 11 + seasoned * 29, 18 + Math.round(depth * 2.2 + seasoned * 5.4), 7 + depth, depth >= 5 ? 4 : 3, depth >= 7 ? 2 : 1]
  ];
}
// Board data changed for one check, put back afterwards.
function withBoard(map, change, body) {
  const before = JSON.stringify(BATTLES[map]);
  change(BATTLES[map]);
  try {
    return body();
  } finally {
    Object.assign(BATTLES[map], JSON.parse(before));
  }
}
const logged = (s, text, who) => s.logs.some((l) => l.text === text && (!who || l.who === who));

section('battle data');
{
  const kept = ['dongFang', 'liQiu', 'hongAn', 'qiuRen', 'gongSun', 'heiMuGuard', 'xiaGuard', 'shenLong', 'ironPalm', 'netHand'];
  const newHeroes = ['qiaoFeng', 'xuZhu', 'hongQi', 'yaoShi', 'sanFeng', 'zhaoMin', 'lingSu', 'diYun', 'chengZhi', 'aQing'];
  // The five villains kept for new stages stand on the boards built round them (10 to 14) and
  // nowhere on the first ten (the producer's ruling of 2026-11-21); the new heroes are nowhere.
  const firstTen = JSON.stringify([BATTLES.slice(0, 10), VILLAINS]),
    text = JSON.stringify([BATTLES, VILLAINS, TROOPS]);
  check('no villain or troop kept for new stages appears on the first ten boards', kept.every((id) => !firstTen.includes(id)));
  check('no new hero appears in the boards or the villain tables', newHeroes.every((id) => !text.includes(id)));
  check('fifteen boards, each slay, rout, keep or break, masters led by the board master', BATTLES.length === 15 && BATTLES.every((b) => ['slay', 'rout', 'keep', 'break'].includes(b.kind) && b.masters[0] === 'master'));
  check('a board with objects has a kind for saves from before them, and a keep board a hold', BATTLES.every((b) => !b.objects || (['slay', 'rout'].includes(b.legacyKind) && (b.kind !== 'keep' || (b.hold > 0 && b.hold < G.LIMIT)))));
  for (const [map, b] of BATTLES.entries()) {
    const layout = mapLayout(map),
      reach = reachableTiles(map);
    const k = (p) => p[0] + ',' + p[1];
    const posts = new Set(layout.allies.map((p) => p.x + ',' + p.y)),
      spawns = new Set(layout.enemies.map((p) => p.x + ',' + p.y)),
      lamp = layout.objective.x + ',' + layout.objective.y;
    const fixedIds = G.SLOTS.map((slot) => G.slotId(map, slot));
    const ids = allPieces(b).map((p) => p.id);
    const tileOk = (p) => G.walkable(p[0], p[1], map) && reach.has(k(p)) && !posts.has(k(p)) && !spawns.has(k(p)) && k(p) !== lamp;
    const starts = b.pieces.map((p) => k(p.at));
    check('map ' + map + ': every piece’s tile is walkable, reachable, and no post, spawn or lamp', allPieces(b).every((p) => tileOk(p.at)), JSON.stringify(allPieces(b).filter((p) => !tileOk(p.at)).map((p) => p.id)));
    check('map ' + map + ': starting pieces have tiles of their own; entry tiles miss them', new Set(starts).size === starts.length && b.waves.every((w) => w.pieces.every((p) => !starts.includes(k(p.at)))));
    check('map ' + map + ': entry tiles are distinct in their wave, with two walkable tiles within two', b.waves.every((w) => new Set(w.pieces.map((p) => k(p.at))).size === w.pieces.length && w.pieces.every((p) => layout.cells.filter((c) => G.walkable(c.x, c.y, map) && G.distance(c, at2(p.at)) >= 1 && G.distance(c, at2(p.at)) <= 2).length >= 2)));
    check('map ' + map + ': round waves come in rounds 2 to 11; half-health waves name masters', b.waves.every((w) => (w.when.round ? w.when.round >= 2 && w.when.round <= G.LIMIT - 1 : w.when.halved.every((ref) => b.masters.includes(ref)))));
    check('map ' + map + ': ids are unique and none is a hero’s or a fixed piece’s', new Set([...ids, ...b.waves.map((w) => 'wave:' + w.id)]).size === ids.length + b.waves.length && ids.every((id) => !G.PARTY.includes(id) && !fixedIds.includes(id)));
    check('map ' + map + ': every piece is described, with a stage row, and a gist if it has traits', ids.every((id) => {
      const d = G.DETAILS[id.split('#')[0]];
      return d && d.row && (!Object.keys(d.traits || {}).length || GISTS[id.split('#')[0]]);
    }));
    check('map ' + map + ': no holdLine zone holds an entry tile; holdLine only with waves', b.sides.filter((e) => e.kind === 'holdLine').every((e) => b.waves.length && b.waves.every((w) => w.pieces.every((p) => !G.inZone(e.zone, at2(p.at))))));
    check('map ' + map + ': a pool of 3–4 secondaries, each a known kind and reward', b.sides.length >= 3 && b.sides.length <= 4 && b.sides.every((e) => R.SIDE_KINDS[e.kind] && SIDE_REWARDS.includes(e.reward)));
    check('map ' + map + ': no spare names a piece without that behaviour, no order names a master', b.sides.every((e) => e.kind !== 'order' || !b.masters.includes(e.first)) && b.sides.every((e) => e.kind !== 'spare' || ({ mend: 'lieutenant-1', herbs: 'snow', mirror: 'murong' }[e.behaviour] === (G.SLOTS.includes(e.piece) ? G.encounterKeys(map)[G.SLOTS.indexOf(e.piece)] : e.piece))));
    for (const key of G.encounterKeys(map)) if (Object.keys(G.DETAILS[key].traits || {}).length && !GISTS[key]) check('map ' + map + ': ' + key + ' has a gist', false);
  }
  for (const [id, v] of Object.entries(VILLAINS)) {
    const maps = BATTLES.map((b, map) => (allPieces(b).some((p) => p.id === id) ? map : -1)).filter((m) => m >= 0);
    check(G.DETAILS[id].name + ' stands on exactly his board, ' + v.map, same(maps, [v.map]), maps);
  }
  check('every troop type stands on one board only', Object.keys(TROOPS).every((key) => BATTLES.filter((b) => allPieces(b).some((p) => p.id.split('#')[0] === key)).length === 1));
  check('every villain and troop type has a gist', [...Object.keys(VILLAINS), ...Object.keys(TROOPS)].every((k) => GISTS[k]));
  check('the 局主 and 副手 roles follow rank', Object.keys(VILLAINS).every((id) => G.DETAILS[id].role === (VILLAINS[id].rank === 'boss' ? '局主' : '副手')));
}

section('stage rows');
{
  check('stageRows(0, 0) is the first board’s fixed numbers', same(G.SLOTS.map((k) => G.stageRows(0, 0)[k]), [[104, 25, 12, 2, 1], [56, 20, 7, 2, 1], [48, 18, 5, 2, 3], [56, 19, 8, 3, 1]]));
  let all = true;
  for (let map = 1; map < 10; map++) for (const d of R.mapStages(map)) if (!same(G.SLOTS.map((k) => G.stageRows(map, d)[k]), oldRows(map, d))) all = false;
  check('stageRows equals the old defenders’ numbers for every board at every stage it is met', all);
  const want = {
    0: { 0: { fengTiannan: [56, 20, 7, 3, 1], 'fiveTiger#1': [56, 19, 8, 3, 2] } },
    1: { 1: { zhaoZhong: [67, 21, 10, 3, 1], 'qingShield#1': [74, 20, 11, 2, 1] }, 2: { zhaoZhong: [79, 23, 11, 3, 1], 'qingShield#2': [88, 22, 12, 2, 1] } },
    2: { 1: { 'bow-2#1': [59, 17, 6, 2, 3], 'scout-2#1': [62, 18, 8, 3, 1] }, 2: { 'bow-2#2': [70, 19, 7, 2, 3], 'scout-2#2': [73, 20, 9, 3, 1] } },
    3: { 3: { 'scout-3#1': [84, 25, 10, 3, 1] }, 4: { 'scout-3#2': [124, 32, 11, 3, 1] } },
    4: { 3: { 'bow-4#1': [81, 24, 8, 2, 3], 'scout-4#1': [84, 25, 10, 3, 1] }, 4: { 'bow-4#2': [121, 31, 9, 3, 3], 'scout-4#2': [124, 32, 11, 3, 1] } },
    5: { 5: { 'bow-5#1': [113, 40, 10, 3, 3], 'scout-5#2': [115, 40, 12, 4, 1] }, 6: { 'bow-5#3': [141, 48, 11, 3, 4], 'scout-5#1': [143, 47, 13, 4, 1] } },
    6: { 5: { 'scout-6#1': [123, 40, 12, 5, 1], wanYan: [156, 42, 12, 3, 1], 'jinBow#1': [161, 40, 10, 3, 4] }, 6: { 'scout-6#4': [153, 47, 13, 5, 1], wanYan: [193, 52, 13, 3, 2], 'jinBow#2': [201, 48, 11, 3, 4] } },
    8: { 8: { xianYu: [389, 82, 21, 3, 1], 'huaBlade#3': [213, 61, 15, 4, 1] } },
    9: { 9: { wanZhen: [337, 86, 17, 3, 2], 'wanDisciple#2': [259, 70, 16, 4, 1] } }
  };
  for (const [map, stages] of Object.entries(want))
    for (const [stage, pieces] of Object.entries(stages))
      for (const [id, n] of Object.entries(pieces)) {
        const piece = allPieces(BATTLES[map]).find((p) => p.id === id);
        check('map ' + map + ' stage ' + stage + ': ' + id + ' has the spec’s numbers ' + n.join('/'), same(numbersAt(+map, +stage, piece), n), numbersAt(+map, +stage, piece));
      }
}

section('kinds');
{
  const won = (s) => (G.check(s), s.result);
  // 斬將, one master: he falls, the others stand.
  let s = realBoard(0, 0);
  unit(s, 'chief').hp = 0;
  check('slay, one master: his fall wins with the others standing', won(s) === 'win' && piecesOf(s).filter(G.living).length === 3);
  // 斬將, two masters.
  s = realBoard(8, 8);
  unit(s, 'mirror').hp = 0;
  check('slay, two masters: one fallen is no result', won(s) === null && same(G.objectiveLeft(s).masters, ['xianYu']));
  check('…and winsIfFalls says the other’s fall would win', G.winsIfFalls(s, ['xianYu']) && !G.winsIfFalls(s, ['echoBlade']));
  unit(s, 'xianYu').hp = 0;
  check('slay, two masters: both fallen win', won(s) === 'win');
  // 殲滅.
  s = realBoard(2, 1);
  const foes = piecesOf(s);
  check('rout: the board opens with eight', foes.length === 8);
  for (const e of foes.slice(1)) e.hp = 0;
  check('rout: the master fallen is not enough… (here: all but him fallen) no result', won(s) === null && G.objectiveLeft(s).foes === 1);
  check('rout: winsIfFalls with the last one', G.winsIfFalls(s, ['reed']));
  unit(s, 'reed').hp = 0;
  check('rout: the last one down wins', won(s) === 'win');
  s = realBoard(2, 1);
  unit(s, 'reed').hp = 0;
  check('rout: 丁春秋 fallen with a disciple standing is no result', won(s) === null);
  // 殲滅 with a wave due: no win until it has entered and fallen.
  withBoard(2, (b) => b.waves.push({ id: 'test', when: { round: 2 }, place: '測試', pieces: [{ id: 'bow-2#9', at: [6, 6] }] }), () => {
    const t = realBoard(2, 1);
    t.arrivals = { test: 2 };
    for (const e of piecesOf(t)) e.hp = 0;
    check('rout with a wave still due: no win', won(t) === null && G.wavesLeft(t) === 1 && !G.winsIfFalls(t, []));
    quietTurn(t);
    const w = unit(t, 'bow-2#9');
    check('…the wave enters at the start of round 2', !!w && G.living(w) && t.round === 2 && !t.result);
    w.hp = 0;
    check('…and once it falls the board is won', won(t) === 'win');
  });
  // The leader's fall and the round limit, on each kind.
  for (const [map, stage, label] of [[0, 0, 'slay'], [8, 8, 'slay, two masters'], [2, 1, 'rout']]) {
    let t = realBoard(map, stage);
    unit(t, t.leader).hp = 0;
    check(label + ': the leader’s fall is a loss', won(t) === 'loss');
    t = realBoard(map, stage);
    t.round = G.LIMIT + 1;
    check(label + ': round 13 is a loss', won(t) === 'loss' && t.round === G.LIMIT);
  }
}

section('half health');
{
  let s = realBoard(8, 8);
  const yue = unit(s, 'mirror'),
    xian = unit(s, 'xianYu');
  check('倒影天街 has its half-health wave waiting: two pieces still to come', G.wavesLeft(s) === 2 && !s.arrivals.pair);
  yue.hp = Math.floor(yue.maxHp / 2);
  G.check(s);
  check('岳不群 at half: halved, his 辟邪現形, the commander’s foreshadow', yue.halved && yue.phased && s.foreshadow);
  check('…and the wave is called for two rounds on, with its line', s.arrivals.pair === s.round + 2 && logged(s, '岳不群氣血過半。第' + G.NUMERALS[s.round + 1] + '回合，華山刀陣弟子兩名自中街入場。', '敵援'));
  const due = s.arrivals.pair;
  xian.hp = Math.floor(xian.maxHp / 2);
  G.check(s);
  check('鮮于通 at half later: halved, no phase, no second call', xian.halved && !xian.phased && s.arrivals.pair === due);
  G.check(s);
  check('each is halved once: checking again changes nothing', s.logs.filter((l) => l.who === '敵援').length === 1);
  // 鮮于通 first: his half alone calls the wave.
  s = realBoard(8, 8);
  unit(s, 'xianYu').hp = Math.floor(unit(s, 'xianYu').maxHp / 2);
  G.check(s);
  check('鮮于通 first at half calls the wave and changes nothing in him', s.arrivals.pair === s.round + 2 && !unit(s, 'xianYu').phased && !s.foreshadow);
  // Felled from above half: halved as he falls, the wave called, no phase.
  s = realBoard(8, 8);
  unit(s, 'mirror').hp = 0;
  G.check(s);
  check('a master felled from full is halved, calls the wave, gets no phase', unit(s, 'mirror').halved && !unit(s, 'mirror').phased && s.arrivals.pair === s.round + 2 && !s.result);
  // A call that could not enter before the limit is not made.
  s = realBoard(8, 8);
  s.round = 11;
  unit(s, 'mirror').hp = Math.floor(unit(s, 'mirror').maxHp / 2);
  G.check(s);
  check('a half in round 11 calls no wave (it could not enter)', !s.arrivals.pair && G.wavesLeft(s) === 0);
}

section('reinforcements');
{
  let s = realBoard(0, 0);
  G.scheduleWaves(s);
  check('the ferry wave is scheduled for round 3', same(s.arrivals, { ferry: 3 }));
  const pend = G.pendingWaves(s);
  check('pendingWaves reports its round, tiles and pieces', pend.length === 1 && pend[0].due === 3 && same(pend[0].tiles, [{ x: 8, y: 9 }, { x: 7, y: 9 }, { x: 8, y: 10 }]) && pend[0].defs.length === 3);
  quietTurn(s);
  check('round 2 begins with the announcement', s.round === 2 && logged(s, '下一回合，鳳天南率五虎門棍徒兩名自南渡口入場。', '敵援'));
  const ghosts = G.arrivalGhosts(s, 3);
  check('arrivalGhosts: three, at their tiles, entering in round 3, not on the board', ghosts.length === 3 && same(ghosts.map((u) => [u.id, u.x, u.y, u.enteredRound]), [['fengTiannan', 8, 9, 3], ['fiveTiger#1', 7, 9, 3], ['fiveTiger#2', 8, 10, 3]]) && ghosts.every((u) => !s.units.includes(u)));
  const zone = [...dangerTiles(s)].sort().join();
  const ghosted = { ...s, units: [...s.units, ...ghosts] };
  const reach = ghosts.flatMap((u) => G.standCells(ghosted, u).filter((c) => G.walkable(c.x, c.y, 0)));
  check('the danger zone is unchanged by ghosts; their own reach is not empty', [...dangerTiles(s)].sort().join() === zone && reach.length > 0 && ghosts.every((u) => G.strikeReach(ghosted, u) >= 1));
  const before = s.units.length;
  quietTurn(s);
  const came = s.units.slice(before);
  check('round 3: the three enter before the heroes move, appended in data order', s.round === 3 && s.phase === 'ally' && same(came.map((u) => u.id), ['fengTiannan', 'fiveTiger#1', 'fiveTiger#2']));
  check('…on their tiles, unhurt and unacted, with their entry round', same(came.map((u) => [u.x, u.y]), [[8, 9], [7, 9], [8, 10]]) && came.every((u) => u.hp === u.maxHp && !u.acted && u.enteredRound === 3));
  check('…the entry is logged and the wave is no longer due', logged(s, '鳳天南率五虎門棍徒兩名自南渡口入場。', '敵援') && !('ferry' in s.arrivals) && G.wavesLeft(s) === 0);
  check('鳳天南’s first signature is in round 4 (entry + 1)', G.roundsToSignature(s, unit(s, 'fengTiannan')) === 1);
  check('his page says when and where he came', G.enemyTraitLines(s, unit(s, 'fengTiannan')).includes('【援軍】第三回合自南渡口入場。'));
  // They act in the enemy phase of round 3, after everyone already on the board.
  G.startEnemy(s);
  const order = [];
  for (const e of G.enemies(s)) if (G.living(e) && !e.acted) order.push(e.id), G.enemyAct(s, e);
  check('in enemy phase 3 they act, last, in the order they entered', same(order.slice(-3), ['fengTiannan', 'fiveTiger#1', 'fiveTiger#2']) && came.every((u) => u.acted) && came.some((u) => u.moved));
  // An occupied entry tile.
  s = realBoard(0, 0);
  G.scheduleWaves(s);
  quietTurn(s);
  put(s, 'guard', 8, 9);
  const near = mapLayout(0).cells.filter((c) => G.walkable(c.x, c.y, 0) && !G.at(s, c.x, c.y) && G.distance(c, { x: 8, y: 9 }) <= 2 && G.distance(c, { x: 8, y: 9 }) > 0).sort((a, b) => G.distance(a, { x: 8, y: 9 }) - G.distance(b, { x: 8, y: 9 }) || a.y - b.y || a.x - b.x)[0];
  quietTurn(s);
  const feng = unit(s, 'fengTiannan');
  check('a taken entry tile: he enters on the nearest free tile (distance, then y, then x)', feng && feng.x === near.x && feng.y === near.y, [feng?.x, feng?.y, near.x, near.y]);
  check('…and the log says where', logged(s, '鳳天南入場處有人，改由（' + (near.x + 1) + '，' + (near.y + 1) + '）入場。', '敵援'));
  // Nowhere to stand: the whole wave waits a round.
  s = realBoard(0, 0);
  G.scheduleWaves(s);
  quietTurn(s);
  let n = 0;
  for (const c of mapLayout(0).cells)
    if (G.walkable(c.x, c.y, 0) && !G.at(s, c.x, c.y) && BATTLES[0].waves[0].pieces.some((p) => G.distance(c, at2(p.at)) <= 2)) {
      const block = G.makeUnit('scout-0#' + (90 + n++), 'enemy', c.x, c.y, 10, 0, 1, 1, 1, 1);
      block.encounterId = 'scout-0';
      s.units.push(block);
    }
  quietTurn(s);
  check('every entry blocked: no one enters; each is logged; the wave is due a round later', !unit(s, 'fengTiannan') && s.arrivals.ferry === 4 && logged(s, '鳳天南入場受阻，延至下一回合。', '敵援') && logged(s, '五虎門棍徒入場受阻，延至下一回合。', '敵援'));
  check('…and named again for next round', s.logs.filter((l) => l.text === '下一回合，鳳天南率五虎門棍徒兩名自南渡口入場。').length === 2);
  for (const u of s.units) if (u.id.startsWith('scout-0#9')) u.hp = 0;
  quietTurn(s);
  check('the room cleared, they enter in round 4 with that entry round', unit(s, 'fengTiannan')?.enteredRound === 4 && G.roundsToSignature(s, unit(s, 'fengTiannan')) === 1);
  // A blocked wave in round 12 never enters.
  s = realBoard(0, 0);
  s.arrivals = { ferry: G.LIMIT };
  s.round = G.LIMIT;
  for (const c of mapLayout(0).cells)
    if (G.walkable(c.x, c.y, 0) && !G.at(s, c.x, c.y) && BATTLES[0].waves[0].pieces.some((p) => G.distance(c, at2(p.at)) <= 2))
      s.units.push(Object.assign(G.makeUnit('scout-0#' + (90 + n++), 'enemy', c.x, c.y, 10, 0, 1, 1, 1, 1), { encounterId: 'scout-0' }));
  G.arrive(s);
  check('blocked in the last round: the wave is dropped', !('ferry' in s.arrivals));
}

section('troop traits');
{
  // 近身失準 on board 0's open ground: a 五虎門棍徒 beside a hero and two away.
  const s = board();
  const tiger = G.pieceUnit(s, { id: 'fiveTiger#1', at: [5, 3] });
  s.units.push(tiger);
  const hero = put(s, 'hero', 6, 3);
  const near = G.attackPower(s, tiger, null, G.basicFor(tiger), hero);
  put(s, 'hero', 7, 3);
  const far = G.attackPower(s, tiger, null, G.basicFor(tiger), hero);
  check('crowded: his attack is 6 lower on an adjacent hero', far - near === 6, [near, far]);
  check('crowded: never on a hero’s own blow', G.traitEdge(s, hero, tiger) === 0);
  put(s, 'hero', 6, 3);
  hero.acted = hero.moved = false;
  const f = G.forecast(hero, tiger, false, s);
  const plain = withTraits('fiveTiger', { mods: { step: 3, range: 2 } }, () => G.forecast(hero, tiger, false, s));
  check('crowded: his counter on an adjacent striker is weaker, and the forecast says so', f.counterRaw < plain.counterRaw && f.notes.includes('近身失準 · 還擊攻擊 −6'), [f.counterRaw, plain.counterRaw]);
  // He prefers to strike from two tiles off.
  Object.assign(tiger, { x: 3, y: 7 });
  put(s, 'hero', 7, 7);
  G.startEnemy(s);
  for (const e of G.enemies(s)) if (e !== tiger) e.acted = true;
  G.enemyAct(s, tiger);
  check('crowded: he strikes from beyond his weak distance when he can', G.distance(tiger, hero) === 2 && hero.hp < hero.maxHp, [tiger.x, tiger.y]);
  // 趙王府弓手: two tiles is still too close.
  const t = board();
  const bow = G.pieceUnit(t, { id: 'jinBow#1', at: [3, 3] });
  t.units.push(bow);
  const h = put(t, 'hero', 5, 3);
  const close = G.attackPower(t, bow, null, G.basicFor(bow), h);
  put(t, 'hero', 6, 3);
  check('crowded within 2: an archer two off is 8 weaker, three off not', G.attackPower(t, bow, null, G.basicFor(bow), h) - close === 8);
  // 斬殘.
  const e = board();
  const sword = G.pieceUnit(e, { id: 'wanDisciple#1', at: [5, 3] });
  e.units.push(sword);
  const v = put(e, 'hero', 6, 3);
  const whole = G.attackPower(e, sword, null, G.basicFor(sword), v);
  v.hp = Math.floor(v.maxHp / 2);
  check('execute: +6 (stage 0) on a hero at or below half', G.attackPower(e, sword, null, G.basicFor(sword), v) - whole === 6);
  v.hp = Math.floor(v.maxHp / 2) + 1;
  check('execute: nothing above half', G.attackPower(e, sword, null, G.basicFor(sword), v) === whole);
  v.hp = Math.floor(v.maxHp / 2) + 5;
  v.acted = v.moved = false;
  sword.hp = sword.maxHp = 500; // so it stands to counter
  const costly = teach(v, defineArt({ hpCost: 10, mp: 2 }));
  const fc = G.forecast(v, sword, true, e);
  v.activeArt = 'signature';
  const fb = G.forecast(v, sword, false, e);
  check('execute on a counter: read after the striker’s own cost', fc.notes.includes('斬殘 · 還擊攻擊 ＋6') && !fb.notes.some((n) => n.startsWith('斬殘')), costly);
  // 盾牆 on 紅楓驛.
  const r = realBoard(1, 1);
  const shield = unit(r, 'qingShield#1');
  check('posted stance: on its post (10,5) it cuts 40%', shield.x === 10 && shield.y === 5 && G.stanceCut(r, shield) === 40);
  check('…and never makes a full counter', G.counterRatio(r, shield) === 0.55);
  const striker = G.party(r)[0];
  const spot = ADJ.map(([dx, dy]) => ({ x: shield.x + dx, y: shield.y + dy })).find((p) => G.walkable(p.x, p.y, 1) && !G.at(r, p.x, p.y));
  Object.assign(striker, spot, { acted: false, moved: false });
  check('the forecast says 盾牆', G.forecast(striker, shield, false, r).notes.includes('盾牆 · 傷害 −40%'));
  const off = ADJ.map(([dx, dy]) => ({ x: shield.x + dx, y: shield.y + dy })).find((p) => G.walkable(p.x, p.y, 1) && !G.at(r, p.x, p.y));
  Object.assign(shield, off);
  check('pushed off its post the cut is gone', G.stanceCut(r, shield) === 0);
  Object.assign(striker, { x: mapLayout(1).allies[0].x, y: mapLayout(1).allies[0].y });
  soloTurn(r, shield);
  check('it walks back on its own action, and the cut returns', shield.x === 10 && shield.y === 5 && G.stanceCut(r, shield) === 40, [shield.x, shield.y]);
  // 刀陣 on 倒影天街.
  const k = realBoard(8, 8);
  const [a, b] = ['huaBlade#1', 'huaBlade#2'].map((id) => unit(k, id));
  a.hp -= 20;
  check('kin cover: the healthier of two adjacent blades covers the other', G.coverer(k, a) === b && G.coverer(k, b) === null);
  a.hp = b.hp;
  check('kin cover: not between equals', G.coverer(k, a) === null);
  a.hp -= 20;
  check('kin cover: never for another kind of piece beside it', G.coverer(k, unit(k, 'xianYu')) === null);
  const ax = a.x;
  a.x = 5;
  check('kin cover: not when apart', G.coverer(k, a) === null);
  a.x = ax;
  for (const u of G.party(k)) u.hp = u.maxHp;
  const hit = G.party(k)[0];
  const side = ADJ.map(([dx, dy]) => ({ x: a.x + dx, y: a.y + dy })).find((p) => G.walkable(p.x, p.y, 8) && !G.at(k, p.x, p.y));
  Object.assign(hit, side, { acted: false, moved: false });
  a.conditions = { evade: { power: 1, through: k.round, source: a.id } };
  const twice = teach(hit, defineArt({ hits: [0.5, 0.5], mp: 2 }));
  const life = [a.hp, b.hp];
  G.resolve(k, hit, a, true);
  check('kin cover: an evading blade’s partner still takes both hits; the 閃身 stays', a.hp === life[0] && b.hp < life[1] && !!a.conditions?.evade, twice);
}

section('deployment');
{
  const s = R.startRun(R.drawLots(41), R.LEGACY);
  R.turnPage(s, true);
  check('the story leads to the briefing, the briefing to 整備', s.run.scene === 'brief' && R.turnPage(s) && s.run.scene === 'prep');
  check('deployLineup opens the deployment step', R.deployLineup(s) && s.run.deploying === true);
  const lead = G.find(s, s.leader);
  check('while deploying no one acts, moves or ends the turn', !G.canAct(s, lead) && !G.move(s, lead, lead.x + 1, lead.y) && !G.startEnemy(s) && !G.waitUnit(s, lead));
  check('arts may be re-slotted', G.canConfigure(s, lead));
  const seats = seatsFor(s.run),
    posts = mapLayout(0).allies;
  check('swapStart exchanges two heroes’ posts', R.swapStart(s, 0, 1) && same(seatsFor(s.run), [seats[1], seats[0], ...seats.slice(2)]) && same(s.run.posts, seatsFor(s.run)));
  check('…and puts each on his post', G.party(s).every((u) => G.distance(u, posts[seatsFor(s.run).indexOf(u.id)]) === 0));
  const mover = seatsFor(s.run)[2];
  check('swapStart to an empty post moves the hero there', R.swapStart(s, 2, 4) && seatsFor(s.run)[4] === mover && seatsFor(s.run)[2] === null && G.distance(G.find(s, mover), posts[4]) === 0);
  check('swapStart from an empty post, or to itself, is refused', !R.swapStart(s, 2, 0) && !R.swapStart(s, 0, 0) && !R.swapStart(s, 0, 7));
  const saved = R.restoreRun(copy(s));
  check('a save made while deploying restores into it', saved?.run.deploying === true && !G.canAct(saved, G.find(saved, saved.leader)));
  check('beginBattle ends the step and logs it', R.beginBattle(s) && s.run.deploying === false && logged(s, '起陣已定。', '我方回合') && G.canAct(s, lead));
  check('no swap after the battle has begun', !R.swapStart(s, 0, 1) && !R.beginBattle(s));
}

section('facts');
{
  // A fall, by a hero's plain strike, art, splash; by a counter; by poison; by a reflection.
  const s = board();
  const hero = put(s, 'hero', 4, 3);
  const bow = put(s, 'bow', 5, 3);
  bow.hp = 1;
  G.resolve(s, hero, bow, false);
  const last = () => s.tally.falls.at(-1);
  check('a basic strike’s fall: by the hero, how basic, in the ally phase', same([last().id, last().by, last().how, last().phase, last().round], ['bow', 'hero', 'basic', 'ally', 1]));
  hero.acted = false;
  const scout = put(s, 'scout', 5, 7);
  put(s, 'hero', 4, 7);
  scout.hp = 1;
  const art = teach(hero, defineArt({ mp: 2 }));
  G.resolve(s, hero, scout, true);
  check('an art’s fall: how art, with the art', last().how === 'art' && last().art === art && !last().combo);
  // Splash.
  const t = board();
  const h2 = put(t, 'hero', 4, 3);
  put(t, 'bow', 5, 3);
  const behind = put(t, 'scout', 6, 3);
  behind.hp = 1;
  teach(h2, defineArt({ mp: 2, splash: 0.5 }));
  G.resolve(t, h2, unit(t, 'bow'), true);
  check('a splash fall: how splash', t.tally.falls.some((f) => f.id === 'scout' && f.how === 'splash' && f.by === 'hero'), JSON.stringify(t.tally.falls));
  // Counter: the enemy strikes a hero and the hero's counter fells it.
  const c = board();
  const guard = put(c, 'guard', 4, 3);
  const foe = put(c, 'scout', 5, 3);
  foe.hp = 1;
  G.startEnemy(c);
  for (const e of G.enemies(c)) if (e !== foe) e.acted = true;
  G.enemyAct(c, foe);
  check('a counter’s fall: how counter, by the hero, in the enemy phase', c.tally.falls.some((f) => f.id === 'scout' && f.how === 'counter' && f.by === 'guard' && f.phase === 'enemy'), JSON.stringify(c.tally.falls));
  // Poison laid by a hero.
  const p = board();
  const poisoned = put(p, 'scout', 5, 7);
  poisoned.hp = 2;
  poisoned.conditions = { poison: { power: 5, through: 3, source: 'medic' } };
  quietTurn(p);
  check('a poison fall: how poison, by the hero who laid it', p.tally.falls.some((f) => f.id === 'scout' && f.how === 'poison' && f.by === 'medic'));
  // A reflection: 借勁 turns a blow back.
  const q = board();
  const g = put(q, 'guard', 4, 3);
  const striker = put(q, 'scout', 5, 3);
  striker.hp = 3;
  g.conditions = { riposte: { power: 9, through: 2, source: 'guard' } };
  G.startEnemy(q);
  for (const e of G.enemies(q)) if (e !== striker) e.acted = true;
  G.enemyAct(q, striker);
  check('a reflected fall: how reflect', q.tally.falls.some((f) => f.id === 'scout' && f.how === 'reflect' && f.by === 'guard'), JSON.stringify(q.tally.falls));
  // A combination: a mark spent by 收隙.
  const m = board();
  const mh = put(m, 'hero', 4, 3);
  const mf = put(m, 'bow', 5, 3);
  mf.hp = 5;
  mf.conditions = { mark: { power: 1, through: 2, source: 'medic' } };
  teach(mh, defineArt({ mp: 2 }));
  const exploit = defineArt({ mp: 2 });
  TECHNIQUES[exploit].forms = ['exploit'];
  teach(mh, exploit);
  G.resolve(m, mh, mf, true);
  check('a fall by a combination: combo', m.tally.falls.at(-1)?.combo === true, JSON.stringify(m.tally.falls));
  // An answered blow.
  const a = board();
  const ah = put(a, 'hero', 4, 3);
  const af = put(a, 'scout', 5, 3);
  af.hp = 3;
  teach(ah, defineArt({ mp: 2, answer: 'close' }));
  G.resolve(a, ah, af, true);
  check('a fall by a 破招 that held: answered', a.tally.falls.at(-1)?.answered === true);
  // Medicine: counted in the fight only.
  const d = board();
  const dh = unit(d, 'hero');
  dh.hp -= 30;
  d.run.scene = 'prep';
  G.consume(d, dh, 'remedy');
  check('medicine before the fight is not counted', d.tally.doses === 0);
  d.run.scene = 'fight';
  dh.hp -= 30;
  G.consume(d, dh, 'remedy');
  check('medicine in the fight is', d.tally.doses === 1);
  // The leader's hurt: a blow, poison, 內傷; not his own cost.
  const l = board();
  const leader = put(l, 'hero', 4, 3);
  put(l, 'scout', 5, 3);
  const life = leader.hp;
  G.startEnemy(l);
  for (const e of G.enemies(l)) if (e.id !== 'scout') e.acted = true;
  G.enemyAct(l, unit(l, 'scout'));
  check('leaderHurt counts an enemy’s blow', l.tally.leaderHurt === life - leader.hp && l.tally.leaderHurt > 0);
  const o = board();
  const ol = unit(o, 'hero');
  ol.conditions = { poison: { power: 4, through: 3, source: 'bow' } };
  quietTurn(o);
  check('…poison an enemy laid', o.tally.leaderHurt === 4, o.tally.leaderHurt);
  const w = board();
  const wl = put(w, 'hero', 4, 3);
  put(w, 'bow', 5, 3).hp = 500;
  unit(w, 'bow').maxHp = 500;
  wl.conditions = { wound: { power: 5, through: 2, source: 'bow' } };
  teach(wl, defineArt({ mp: 2, hpCost: 6 }));
  const was = w.tally.leaderHurt;
  G.resolve(w, wl, unit(w, 'bow'), true);
  const counter = w.logs.filter((x) => x.text.startsWith('還擊')).length;
  check('…內傷, and not his own art’s cost', w.tally.leaderHurt - was >= 5 && w.tally.leaderHurt - was < 5 + 6 + (counter ? 999 : 0));
  // Behaviours: the mend, the mirror, the herbs.
  const r1 = realBoard(1, 1);
  r1.round = 2;
  unit(r1, 'echoBow').hp = 10;
  soloTurn(r1, unit(r1, 'echoBlade'));
  check('閻基’s mend is recorded', r1.tally.fired.mend === 1);
  const r9 = realBoard(9, 9);
  for (const v of G.party(r9)) if (!['hero', 'medic', 'guard'].includes(v.id)) v.hp = 0;
  r9.round = 2;
  const mu = unit(r9, 'murong');
  const spot = ADJ.map(([dx, dy]) => ({ x: mu.x + dx, y: mu.y + dy })).find((pp) => G.walkable(pp.x, pp.y, 9) && !G.at(r9, pp.x, pp.y));
  const gd = put(r9, 'guard', spot.x, spot.y);
  gd.acted = gd.moved = false;
  G.resolve(r9, gd, mu, false);
  check('慕容博’s mirror is recorded', r9.tally.fired.mirror === 1);
  const r3 = realBoard(3, 3);
  const xue = unit(r3, 'snow');
  xue.hp = Math.floor(xue.maxHp / 2);
  G.check(r3);
  for (let i = 0; i < 2 && !r3.tally.fired.herbs; i++) {
    soloTurn(r3, xue);
    closeRound(r3);
  }
  check('血刀老祖 reaching herbs in flight is recorded', r3.tally.fired.herbs >= 1);
  // A wave piece over the line.
  const z = realBoard(0, 0);
  z.run.side = { kind: 'holdLine', zone: { x: [0, 6] }, place: '西岸與兩座木橋', reward: 'manual' };
  G.scheduleWaves(z);
  quietTurn(z);
  quietTurn(z);
  check('a wave piece standing outside the zone: not crossed', z.tally.crossed === false && !!unit(z, 'fiveTiger#1'));
  const fixed = unit(z, 'scout');
  Object.assign(fixed, { x: 3, y: 3 });
  G.startEnemy(z);
  for (const e of G.enemies(z)) e.acted = true;
  fixed.acted = false;
  G.enemyAct(z, fixed);
  check('a starting piece in the zone does not count', z.tally.crossed === false);
  const tiger = unit(z, 'fiveTiger#1');
  Object.assign(tiger, { x: 6, y: 7, acted: false });
  G.enemyAct(z, tiger);
  check('a wave piece ending its action in the zone does', z.tally.crossed === (tiger.x <= 6), [tiger.x, tiger.y]);
}

section('secondaries');
{
  // Each kind's state from crafted facts.
  const s = realBoard(0, 0);
  const st = (side) => R.sideState(s, side);
  const fall = (id, extra = {}) => s.tally.falls.push({ id, by: null, how: 'basic', round: s.round, phase: 'ally', ...extra });
  const reset = () => {
    s.tally = G.blankTally();
    s.result = null;
    s.run.marked = false;
    s.round = 1;
  };
  const won = (side) => {
    s.result = 'win';
    const out = st(side);
    s.result = null;
    return out;
  };
  reset();
  check('lamp: open, then met when lit', st({ kind: 'lamp' }) === 'open' && ((s.run.marked = true), st({ kind: 'lamp' }) === 'met'));
  reset();
  check('swift: open by its round, failed after; met at a win in time', st({ kind: 'swift', by: 5 }) === 'open' && won({ kind: 'swift', by: 5 }) === 'met' && ((s.round = 6), st({ kind: 'swift', by: 5 }) === 'failed'));
  reset();
  check('intact: met at a win with everyone up; failed once a hero falls', won({ kind: 'intact' }) === 'met' && ((unit(s, 'medic').hp = 0), st({ kind: 'intact' }) === 'failed' && R.sideLost(s, { kind: 'intact' }) === '任盈盈倒下'));
  unit(s, 'medic').hp = 50;
  reset();
  const lb = { kind: 'lastBlow', hero: 'hero', target: 'master' };
  check('lastBlow: open; met when he fells the master; failed when another does', st(lb) === 'open' && (fall('chief', { by: 'hero' }), st(lb) === 'met') && (reset(), fall('chief', { by: 'medic' }), st(lb) === 'failed') && R.sideLost(s, lb) === '余滄海由他人擊倒');
  reset();
  const ord = { kind: 'order', first: 'lieutenant' };
  check('order: met when the lieutenant falls first; failed when the master falls first', (fall('blade'), st(ord) === 'met') && (reset(), fall('chief'), st(ord) === 'failed') && R.sideLost(s, ord) === '余滄海先於木高峰倒下');
  reset();
  check('double: two falls in one ally phase meet it; one in each of two rounds does not; enemy-phase falls do not count', (fall('bow'), fall('scout', { round: 2 }), st({ kind: 'double' }) === 'open') && (fall('blade', { phase: 'enemy', round: 2 }), st({ kind: 'double' }) === 'open') && (fall('chief', { round: 2 }), st({ kind: 'double' }) === 'met'));
  for (const behaviour of ['mirror', 'mend', 'herbs']) {
    reset();
    const sp = { kind: 'spare', behaviour, piece: 'master' };
    check('spare ' + behaviour + ': met at a win if it never happened; failed once it did', won(sp) === 'met' && ((s.tally.fired[behaviour] = 1), st(sp) === 'failed'));
  }
  reset();
  check('combo: met by a combination fall only', (fall('bow'), st({ kind: 'combo' }) === 'open') && (fall('scout', { combo: true }), st({ kind: 'combo' }) === 'met'));
  reset();
  check('noMedicine: met at a win without a dose; failed with one', won({ kind: 'noMedicine' }) === 'met' && ((s.tally.doses = 1), st({ kind: 'noMedicine' }) === 'failed'));
  reset();
  check('unhurt: failed once the leader is hurt', won({ kind: 'unhurt' }) === 'met' && ((s.tally.leaderHurt = 3), st({ kind: 'unhurt' }) === 'failed'));
  reset();
  const hl = { kind: 'holdLine', zone: { x: [0, 6] }, place: '西岸與兩座木橋' };
  check('holdLine: failed once a wave piece crossed', won(hl) === 'met' && ((s.tally.crossed = true), st(hl) === 'failed' && R.sideLost(s, hl) === '援軍踏入西岸與兩座木橋'));
  reset();
  const an = { kind: 'answer', hero: 'hero' };
  check('answer: met only by the named hero’s answered fall', (fall('bow', { by: 'medic', answered: true }), st(an) === 'open') && (fall('scout', { by: 'hero', answered: true }), st(an) === 'met'));
  reset();
  check('a reach kind still open at the win is not done', won({ kind: 'lamp' }) === 'open');
  // A named hero benched before the fight: the warning, and the side fails.
  const b = R.startRun(R.drawLots(5), R.LEGACY);
  R.turnPage(b, true);
  R.turnPage(b, true);
  b.run.side = { kind: 'lastBlow', hero: b.run.next[1], target: 'master', reward: 'points' };
  check('named and fielded: open, no warning', R.sideState(b) === 'open' && R.briefing(b).side.warning === '');
  R.toggleSeat(b, b.run.next[1]);
  check('benched in 整備: failed, and the briefing warns', R.sideState(b) === 'failed' && R.briefing(b).side.warning === G.DETAILS[b.run.side.hero].name + '未在出陣名單中，此支線無法達成。');
  // The draw.
  let stable = true,
    named = true,
    kinds = new Set();
  for (let seed = 0; seed < 50; seed++) {
    const one = R.startRun(R.drawLots(seed * 977 + 3), R.LEGACY),
      two = R.startRun(R.drawLots(seed * 977 + 3), R.LEGACY);
    if (!same(one.run.side, two.run.side) || !same(R.drawSide(one), one.run.side)) stable = false;
    if (one.run.side.hero && !one.run.next.includes(one.run.side.hero)) named = false;
    kinds.add(one.run.side.kind);
  }
  check('the draw is the same for the same seed and lineup, 50 seeds', stable);
  check('it never names a hero outside the lineup', named);
  check('board 0’s whole pool is drawn over 50 seeds', same([...kinds].sort(), ['holdLine', 'intact', 'lamp', 'lastBlow']), [...kinds]);
  // answer and combo need their arts.
  const n = realBoard(8, 8);
  const hero = G.find(n, 'hero');
  n.run.next = ['hero', 'medic', 'guard'];
  hero.learned = hero.learned.filter((id) => !TECHNIQUES[id]?.answer);
  check('answer is not eligible without a 破X式', !R.SIDE_KINDS.answer.eligible(n, { hero: 'hero' }));
  hero.learned.push(Object.keys(TECHNIQUES).find((id) => TECHNIQUES[id].answer && TECHNIQUES[id].owner === 'hero'));
  check('…and is with one learned', R.SIDE_KINDS.answer.eligible(n, { hero: 'hero' }));
  n.run.next = ['guard'];
  check('combo is not eligible for a lineup without a 合招 form', !R.SIDE_KINDS.combo.eligible(n, {}) && ((n.run.next = ['hero']), R.SIDE_KINDS.combo.eligible(n, {})));
  check('holdLine is never eligible on a board without waves', !R.SIDE_KINDS.holdLine.eligible(realBoard(7, 7), {}));
  // The forecast's line.
  const fc = realBoard(0, 0);
  fc.run.side = { kind: 'lastBlow', hero: G.party(fc)[1].id, target: 'master', reward: 'points' };
  const chief = unit(fc, 'chief');
  chief.hp = 1;
  const other = G.party(fc)[0];
  const beside = ADJ.map(([dx, dy]) => ({ x: chief.x + dx, y: chief.y + dy })).find((pp) => G.walkable(pp.x, pp.y, 0) && !G.at(fc, pp.x, pp.y));
  Object.assign(other, beside, { acted: false, moved: false });
  check('sideForecast: another hero’s killing blow would fail lastBlow', R.sideForecast(fc, other, chief, G.forecast(other, chief, false, fc)) === '支線 · 此擊將使支線失敗');
  fc.run.side.hero = other.id;
  check('…the named hero’s would meet it', R.sideForecast(fc, other, chief, G.forecast(other, chief, false, fc)) === '支線 · 此擊可達成');
  chief.hp = chief.maxHp;
  check('…a blow that does not fell says nothing', R.sideForecast(fc, other, chief, G.forecast(other, chief, false, fc)) === '');
}

section('rewards and recruit');
{
  const win = (s, side, stage = s.run.stage) => {
    s.run.side = side;
    s.run.stage = stage;
    for (const e of G.enemies(s)) e.hp = 0;
    s.arrivals = {};
    G.check(s);
    const before = { coins: s.run.coins, sp: G.party(s).map((u) => u.sp), pool: s.run.pool.length, manuals: [...s.run.manuals], parcel: [...s.run.chronicle.parcel.manuals] };
    R.settle(s);
    return before;
  };
  let s = realBoard(0, 0);
  let b = win(s, { kind: 'intact', reward: 'coins' });
  check('coins: 36 for the board and 24 for the secondary at stage 0', s.run.coins - b.coins === 36 + 24 && s.run.last.reward === 60 && same(s.run.last.side, { kind: 'intact', reward: 'coins', amount: 24, manual: null }));
  check('…logged as the secondary’s reward', logged(s, '支線達成，賞銀 24 兩。', '支線'));
  check('a win brings the next hero', !!s.run.last.recruit && s.run.pool.length === b.pool - 1);
  s = realBoard(0, 0);
  unit(s, 'medic').hp = 0;
  b = win(s, { kind: 'intact', reward: 'points' });
  check('a failed secondary pays nothing more, and still a hero comes', !s.run.last.optional && s.run.coins - b.coins === 36 && !!s.run.last.recruit);
  s = realBoard(0, 0);
  unit(s, 'medic').hp = 0;
  b = win(s, { kind: 'noMedicine', reward: 'points' });
  const party = G.party(s);
  check('points: one to each fielded hero standing (plus the board’s own one to all)', party.every((u, i) => u.sp - b.sp[i] === (G.living(u) ? 2 : 1)) && s.run.last.side.amount === 2);
  s = realBoard(0, 0);
  b = win(s, { kind: 'noMedicine', reward: 'manual' });
  const got = s.run.last.side.manual;
  check('manual: one manual into the store, named in the log', !!got && s.run.manuals.length === b.manuals.length + 1 && s.run.manuals.includes(got) && logged(s, '支線達成，《' + TECHNIQUES[got].name + '》一卷，已入公庫。', '支線'));
  const again = realBoard(0, 0);
  win(again, { kind: 'noMedicine', reward: 'manual' });
  check('…the same manual for the same run', again.run.last.side.manual === got);
  check('…one the shelf could carry after this board', FM.manualStage(got) <= 1);
  s = realBoard(0, 0);
  b = win(s, { kind: 'noMedicine', reward: 'points' }, 9);
  check('points on the last board pay silver (24 + 27)', s.run.last.side.reward === 'coins' && s.run.last.side.amount === 51 && s.run.coins - b.coins === 36 + 45 + 51);
  check('the last board brings no hero', !s.run.last.recruit);
  s = realBoard(0, 0);
  b = win(s, { kind: 'noMedicine', reward: 'manual' }, 9);
  check('a manual on the last board goes to the parcel', s.run.chronicle.parcel.manuals.length === b.parcel.length + 1 && same(s.run.manuals, b.manuals));
  s = realBoard(0, 0);
  unit(s, s.leader).hp = 0;
  G.check(s);
  const pool = s.run.pool.length;
  R.settle(s);
  check('a loss never recruits', !s.run.last.recruit && s.run.pool.length === pool);
  check('rewardText says each kind', R.rewardText({ reward: 'coins' }, 3) === '賞銀 33 兩' && R.rewardText({ reward: 'points' }, 3) === '出陣生還的俠客各 1 武學點' && R.rewardText({ reward: 'points' }, 9) === '賞銀 51 兩' && R.rewardText({ reward: 'manual' }, 3) === '武譜一卷（入公庫）');
}

section('saves');
{
  // Everything new survives a save.
  const s = realBoard(8, 8);
  unit(s, 'mirror').hp = Math.floor(unit(s, 'mirror').maxHp / 2);
  G.check(s);
  s.tally.doses = 2;
  s.tally.falls.push({ id: 'echoBow', by: 'hero', how: 'basic', art: null, combo: false, answered: false, round: 1, phase: 'ally' });
  quietTurn(s);
  quietTurn(s);
  const back = R.restoreRun(copy(s));
  check('a save with every new field restores them', !!back && same(back.arrivals, s.arrivals) && same(back.tally, s.tally) && same(back.run.side, s.run.side) && unit(back, 'mirror').halved === true && unit(back, 'huaBlade#3')?.enteredRound === s.round && back.run.battles === 1);
  check('…its # ids restore with their kind', G.unitDetails(unit(back, 'huaBlade#1')).name === '華山刀陣弟子');
  // Malformed fields.
  const bad = copy(s);
  bad.arrivals = { pair: 'soon', nope: 4 };
  bad.tally = { falls: 'x' };
  bad.run.side = { kind: 'lamp', reward: 'gold' };
  bad.run.deploying = 'yes';
  bad.run.legacyBoard = 1;
  const tidy = R.restoreRun(bad);
  check('malformed arrivals, tally, side, deploying and legacy flag are dropped or redrawn', !!tidy && same(tidy.arrivals, {}) && same(tidy.tally, G.blankTally()) && same(tidy.run.side, R.drawSide(tidy)) && !('deploying' in tidy.run) && !('legacyBoard' in tidy.run));
  const off = copy(s);
  off.run.side = { kind: 'lastBlow', hero: 'hero', target: 'master', reward: 'points' };
  const offBack = R.restoreRun(copy(off));
  check('a side not from the board’s pool is redrawn', !!offBack && !same(offBack.run.side, off.run.side), JSON.stringify(offBack?.run.side));
  const pastDue = copy(s);
  pastDue.arrivals = { pair: pastDue.round - 1 };
  check('an arrival already past is dropped', same(R.restoreRun(pastDue).arrivals, {}));
  // A save from before this change, in the fight on 倒影天街.
  const old = copy(realBoard(8, 8));
  old.units = old.units.filter((u) => !['xianYu', 'huaBlade#1', 'huaBlade#2'].includes(u.id));
  delete old.run.battles;
  delete old.run.side;
  delete old.arrivals;
  delete old.tally;
  old.run.goal = 'speed';
  old.foreshadow = true;
  const mid = R.restoreRun(old);
  check('a pre-edition save in the fight restores as a legacy board with its four', !!mid && mid.run.legacyBoard === true && piecesOf(mid).length === 4 && G.masterIds(mid).length === 1 && mid.run.battles === 1 && !('goal' in mid.run));
  check('…its old goal becomes the secondary, its foreshadow the commander’s half', same(mid.run.side, { kind: 'swift', by: 5, reward: 'coins' }) && unit(mid, 'mirror').halved === true && same(mid.arrivals, {}));
  unit(mid, 'mirror').hp = 0;
  G.check(mid);
  check('…and is won by its master’s fall, as before', mid.result === 'win');
  const midRestore = R.restoreRun(copy(mid));
  check('…a legacy board saves and loads as one', midRestore?.run.legacyBoard === true);
  // Before the fight: rebuilt with the new pieces.
  for (const scene of ['before', 'prep']) {
    const pre = copy(realBoard(8, 8));
    pre.units = pre.units.filter((u) => u.side === 'ally' || ['mirror', 'echoBlade', 'echoBow', 'echoScout'].includes(u.id));
    pre.run.scene = scene;
    delete pre.run.battles;
    delete pre.run.side;
    delete pre.arrivals;
    delete pre.tally;
    pre.run.goal = 'speed';
    const re = R.restoreRun(pre);
    check('a pre-edition save at ' + scene + ' is rebuilt with the board’s new pieces', !!re && !re.run.legacyBoard && piecesOf(re).length === 7 && !!unit(re, 'xianYu') && !!re.run.side && same(re.tally, G.blankTally()));
  }
  // In camp: r.last kept.
  const camp = realBoard(0, 0);
  for (const e of G.enemies(camp)) e.hp = 0;
  G.check(camp);
  R.settle(camp);
  const was = copy(camp);
  delete was.run.battles;
  was.run.goal = 'beacon';
  const kept = R.restoreRun(was);
  check('a pre-edition camp save keeps its settled board', !!kept && same(kept.run.last, camp.run.last) && kept.run.status === 'camp');
}

section('the ten boards, as stage one builds them');
for (const [map, b] of BATTLES.entries())
  for (const stage of R.mapStages(map)) {
    const s = realBoard(map, stage),
      tag = 'map ' + map + ' stage ' + stage + ': ';
    const start = 4 + b.pieces.length,
      total = start + b.waves.reduce((n, w) => n + w.pieces.length, 0);
    check(tag + 'opens with ' + start + ', ' + total + ' in all', piecesOf(s).length === start && G.wavesLeft(s) === total - start);
    check(tag + 'each extra piece on its tile with its numbers', b.pieces.every((p) => {
      const u = unit(s, p.id);
      return u && u.x === p.at[0] && u.y === p.at[1] && same(numbersOf(u), numbersAt(map, stage, p));
    }));
    check(tag + 'kind ' + b.kind + ', masters ' + G.masterIds(s).join('、'), G.boardOf(s).kind === b.kind && same(G.masterIds(s), b.masters.map((ref) => G.refId(map, ref))));
    check(tag + 'the drawn secondary is one of the pool', b.sides.some((e) => e.kind === s.run.side.kind));
    check(tag + 'the briefing model is complete', (() => {
      const m = R.briefing(s);
      return m.battle && m.win && m.loss && m.side?.name && m.side.detail && m.waves.length === b.waves.length && m.force.line === '開局 ' + start + ' 名，援軍 ' + (total - start) + ' 名，共 ' + total + ' 名。' && !JSON.stringify(m).includes('undefined');
    })());
    // Played forward quietly: every round wave enters on its round on its tiles.
    for (const v of G.party(s)) Object.assign(v, mapLayout(map).allies[G.party(s).indexOf(v)]);
    const entries = [];
    // (A wave's tile still held by an earlier wave standing still: it enters beside it.)
    for (let round = s.round; round < 8 && !s.result; round++) {
      const held = (p) => !!G.at(s, p.at[0], p.at[1]);
      const due = b.waves.filter((w) => w.when.round === s.round + 1).map((w) => w.pieces.map(held));
      quietTurn(s);
      b.waves
        .filter((w) => w.when.round === s.round)
        .forEach((w, i) =>
          entries.push(w.pieces.every((p, j) => {
            const u = unit(s, p.id);
            const near = u && G.distance(u, at2(p.at)) <= (due[i][j] ? 2 : 0);
            return u && u.enteredRound === s.round && near && (due[i][j] || (u.x === p.at[0] && u.y === p.at[1]));
          }))
        );
    }
    if (b.waves.some((w) => w.when.round)) check(tag + 'every round wave enters on its round on its tiles', entries.length === b.waves.filter((w) => w.when.round && w.when.round < 8).length && entries.every(Boolean), entries);
  }
{
  // What defines each board.
  const s0 = realBoard(0, 0);
  check('青竹渡: the briefing names the ferry wave', R.briefing(s0).waves[0].line === '第三回合，鳳天南率五虎門棍徒兩名自南渡口入場。');
  check('青竹渡: 鳳天南’s page', same(G.pieceLines(0, 'fengTiannan', 0), ['令目標絆足，移動減 2，持續至下回合。', '【援軍】第三回合自南渡口入場。']));
  check('青竹渡: a 棍徒’s page', same(G.pieceLines(0, 'fiveTiger#1', 0), ['【近身失準】對相鄰的俠客出手或還擊時，攻擊 −6。', '【援軍】第三回合自南渡口入場。']));
  for (const stage of [1, 2]) {
    const s1 = realBoard(1, stage);
    for (let i = 0; i < 2; i++) {
      G.startEnemy(s1);
      for (const e of G.enemies(s1)) G.enemyAct(s1, e);
      G.nextRound(s1);
    }
    check('紅楓驛 stage ' + stage + ': after two enemy turns the shields hold their tiles and cut', ['qingShield#1', 'qingShield#2'].every((id) => {
      const u = unit(s1, id),
        home = G.homeTile(s1, u);
      return u.x === home.x && u.y === home.y && G.stanceCut(s1, u) === 40;
    }));
    check('紅楓驛 stage ' + stage + ': 張召重’s page', same(G.pieceLines(1, 'zhaoZhong', stage), ['令目標攻擊降低 ' + (3 + Math.floor(stage / 2)) + '，持續至下回合。', '【坐鎮】守在東院（12，7）兩格內；受到攻擊後才離位。', '【偏好】專挑領隊。']));
  }
  check('紅楓驛: a shield’s page', same(G.pieceLines(1, 'qingShield#2', 1), ['【坐鎮】守在東院門前（11，7），不離位；被推離後會走回。', '【盾牆】站在原位（11，7）時，受到的傷害減 40%；被推離原位便失去盾牆，走回後恢復。']));
  check('蘆花汀: six disciples, all covering their master', piecesOf(realBoard(2, 1)).filter((u) => G.unitDetails(u).traits?.cover === 'master').length === 6);
  // 倒影天街 played forward: both must fall.
  const s8 = realBoard(8, 8);
  check('倒影天街: the briefing says both must fall', R.briefing(s8).battle === '斬將 · ' + MAZE_TALE.brief.slayTwo && R.briefing(s8).win === '在第十二回合結束前擊敗岳不群與鮮于通。');
  check('倒影天街: the trigger wave line', R.briefing(s8).waves[0].line === '岳不群或鮮于通氣血首次過半，兩回合後，華山刀陣弟子兩名自中街入場。');
  unit(s8, 'xianYu').hp = 0;
  G.check(s8);
  check('倒影天街: 鮮于通 down is no win, and calls the pair', !s8.result && s8.arrivals.pair === s8.round + 2);
  quietTurn(s8);
  quietTurn(s8);
  check('倒影天街: the pair enters two rounds on, on its tiles', ['huaBlade#3', 'huaBlade#4'].every((id, i) => unit(s8, id)?.x === [5, 6][i] && unit(s8, id)?.y === 7));
  unit(s8, 'mirror').hp = 0;
  G.check(s8);
  check('倒影天街: with 岳不群 down too, the board is won', s8.result === 'win');
  // 蘆花汀 played forward: not won until everyone is down.
  const s2 = realBoard(2, 1);
  const order = piecesOf(s2);
  let early = false;
  for (const u of order) {
    u.hp = 0;
    G.check(s2);
    if (s2.result && u !== order.at(-1)) early = true;
  }
  check('蘆花汀: not won until the last of the eight is down', !early && s2.result === 'win');
  const s9 = realBoard(9, 9);
  check('無刻漏臺: the wards still read 35% each', G.wardShare(s9, unit(s9, 'murong')) === 70);
  check('無刻漏臺: 萬門劍徒’s page', same(G.pieceLines(9, 'wanDisciple#1', 9), ['【斬殘】對氣血不過半的俠客出手或還擊時，攻擊 ＋10。', '【偏好】專挑傷重者。']));
  check('襄陽殘垣: 完顏洪烈 is its second 局主, leading the round-4 wave', R.boardBrief(6, 5).foes.some((f) => f.name === '完顏洪烈' && f.rank === '局主' && f.note === '（第四回合入場）') && BATTLES[6].masters.includes('wanYan'));
  check('寒玉石室 stays lean: four pieces, no waves, no lamp in its pool', BATTLES[7].pieces.length === 0 && !BATTLES[7].waves.length && !BATTLES[7].sides.some((e) => e.kind === 'lamp'));
}

// ── Boards built round one villain (maps 10 to 14) ────────────────────────
section('boards built round one villain');
{
  const { GARRISONS } = await load('data/encounters.js');
  const { CAPTAINS } = await load('data/martial-arts.js');
  const { FINAL_MAP } = await load('data/battles.js');
  const NEW = [10, 11, 12, 13, 14];
  const TIERS = { 1: [1, 2, 10], 2: [1, 2, 10], 3: [3, 4, 11], 4: [3, 4, 11], 5: [5, 6, 12], 6: [5, 6, 12], 7: [7, 13], 8: [8, 14] };

  // The route: ten of fifteen, the first and the last fixed, each stage from its tier.
  const routes = Array.from({ length: 600 }, (_, n) => R.routeFor((Math.imul(n, 2654435761) + 17) >>> 0));
  check('a route is ten different boards, 青竹渡 first and 無刻漏臺 last', routes.every((r) => r.length === 10 && new Set(r).size === 10 && r[0] === 0 && r[9] === FINAL_MAP && FINAL_MAP === 9));
  check('every other stage draws from its tier', routes.every((r) => r.slice(1, 9).every((map, i) => TIERS[i + 1].includes(map))));
  check('every board built round a villain is met in some runs, and none in every run', NEW.every((map) => routes.some((r) => r.includes(map)) && routes.some((r) => !r.includes(map))));
  const share = (map) => routes.filter((r) => r.includes(map)).length / routes.length;
  check('a board of a three-board tier is in about two runs of three, of a two-board tier in about one of two', [1, 2, 10, 3, 4, 11, 5, 6, 12].every((m) => Math.abs(share(m) - 2 / 3) < 0.07) && [7, 13, 8, 14].every((m) => Math.abs(share(m) - 0.5) < 0.07), [1, 10, 11, 12, 13, 14].map((m) => share(m).toFixed(2)).join(' '));
  const old = Array.from({ length: 200 }, (_, n) => R.routeFor(n * 7919 + 1, 1));
  check('the first edition’s route holds the first ten boards only, in its three shuffled pairs', old.every((r) => r.length === 10 && r.every((m) => m < 10) && r[0] === 0 && same([...r.slice(1, 3)].sort(), [1, 2]) && same([...r.slice(3, 5)].sort(), [3, 4]) && same([...r.slice(5, 7)].sort(), [5, 6]) && same(r.slice(7), [7, 8, 9])));
  check('mapStages: each new board at its tier’s stages', same(NEW.map((m) => R.mapStages(m)), [[1, 2], [3, 4], [5, 6], [7], [8]]));

  // Saves: a run saved before the new boards keeps the route its seed made then.
  {
    const s = board();
    check('a new run is marked with the route edition and restores', s.run.routes === 2 && !!R.restoreRun(copy(s)));
    const before = copy(s);
    delete before.run.routes;
    before.run.route = R.routeFor(before.run.seed, 1);
    check('a run saved before the new boards restores on its old route', !!R.restoreRun(copy(before)) && same(R.restoreRun(copy(before)).run.route, before.run.route));
    const forged = copy(before);
    forged.run.route = R.routeFor(forged.run.seed, 2);
    const differs = forged.run.route.some((m, i) => m !== before.run.route[i]);
    check('an old save with a route of the new edition is refused', !differs || R.restoreRun(forged) === null);
    const unknown = copy(s);
    unknown.run.routes = 3;
    check('an unknown route edition is refused', R.restoreRun(unknown) === null);
    check('the profile may have seen any of the fifteen boards', (() => {
      const t = copy(s);
      t.run.chronicle.seen = [0, 10, 14];
      return !!R.restoreRun(t);
    })());
  }

  // Seats: the villain is the 局主, there is no lieutenant, the other three are his troop type.
  for (const map of NEW) {
    const stage = R.mapStages(map)[0],
      troop = GARRISONS[map],
      master = CAPTAINS[map][0],
      name = mapLayout(map).name;
    check(name + ': one named opponent, the 局主, and no lieutenant entry', ENCOUNTERS[map].length === 1 && G.DETAILS[master].rank === 'boss' && G.DETAILS[master].role === '局主' && !G.DETAILS['lieutenant-' + map] && !G.DETAILS['bow-' + map]);
    check(name + ': the fixed four are the master and three of his troop type', same(G.encounterKeys(map), [master, troop, troop, troop]) && !!TROOPS[troop] && !G.DETAILS[troop].rank);
    check(name + ': he wears his own portrait and sprite', G.DETAILS[master].mini === master && G.DETAILS[master].portraitFile === 'npc-' + master + '.webp' && G.DETAILS[troop].portraitFile === 'npc-' + troop + '.webp');
    const s = realBoard(map, stage);
    const fixed = G.SLOTS.map((slot) => unit(s, G.slotId(map, slot)));
    check(name + ': on the board the three are that troop type, with no rank', fixed.slice(1).every((u) => u && G.pieceKey(u) === troop && !G.unitDetails(u).rank) && G.unitDetails(fixed[0]).name === ENCOUNTERS[map][0].name);
    const extra = G.pieceUnit(s, { id: troop + '#99', at: [0, 0] });
    check(name + ': a troop in a fixed seat has the numbers of any other of its type', fixed.slice(1).every((u) => same([u.maxHp, u.atk, u.def, u.step, u.range], [extra.maxHp, extra.atk, extra.def, extra.step, extra.range])));
    check(name + ': the master is its only 局主; felling him alone wins a slay board', same(G.masterIds(s), [master]) && (BATTLES[map].kind !== 'slay' || (() => {
      const t = copy(s);
      unit(t, master).hp = 0;
      G.check(t);
      return t.result === 'win';
    })()));
    const brief = R.boardBrief(map, stage);
    check(name + ': the briefing names one 局主 and no 副手', brief.foes.filter((f) => f.rank === '局主').length === 1 && !brief.foes.some((f) => f.rank === '副手'), brief.foes.map((f) => f.rank + f.name).join(' '));
    let lines = [];
    const t = realBoard(map, stage);
    t.run.scene = 'before';
    try {
      lines = R.dialogue(t, 'before');
    } catch (e) {
      lines = [];
    }
    check(name + ': the scene before it has the master’s lines and no line without a speaker', lines.length >= 3 && lines.every((l) => l.speaker && l.text) && lines.some((l) => l.speaker === ENCOUNTERS[map][0].name));
    check(name + ': a save made on it restores', !!R.restoreRun(copy(s)));
  }
  // 坐鎮 on a seat: each of the three guards its own spawn tile, not the first seat's.
  withTraits('xiaGuard', { post: { tile: 'spawn', tether: 0, wake: false } }, () => {
    const s = realBoard(13, 7),
      layout = mapLayout(13);
    check('a posted troop in each fixed seat guards its own spawn tile', [1, 2, 3].every((i) => same(G.postTile(s, unit(s, G.slotId(13, G.SLOTS[i])), { tile: 'spawn' }), layout.enemies[i])));
  });
  check('絕情花徑 is not won until every net hand is down', (() => {
    const s = realBoard(11, 3);
    unit(s, 'gongSun').hp = 0;
    G.check(s);
    const early = s.result;
    for (const e of G.enemies(s)) e.hp = 0;
    G.check(s);
    return !early && s.result === 'win';
  })());
  check('神龍竹堂: 洪安通 holds the dais until struck', (() => {
    const s = realBoard(10, 1),
      m = unit(s, 'hongAn'),
      hold = G.holdOf(s, m);
    return !!hold && hold.tether === 2 && same(hold.tile, mapLayout(10).enemies[0]) && G.DETAILS.hongAn.traits.post.wake === 'struck';
  })());

  // ── The ten traits. Small battles on board 0: its master as the villain, its scout as the troop.
  const troopAs = (traits, body) =>
    withTraits('scout-0', traits, () => {
      Object.assign(G.DETAILS['scout-0'], { ...G.DETAILS.scout, name: '試卒', traits });
      return body();
    });
  const only = (s, ...ids) => {
    for (const u of G.party(s)) if (!ids.includes(u.id)) u.hp = 0;
  };
  const held = (x, y) => ({ tile: { x, y }, tether: 0, wake: false });

  // 獨行 and 夾擊
  troopAs({ lone: { atk: 6 } }, () => {
    const s = board();
    s.run.stage = 4;
    const scout = put(s, 'scout', 5, 3),
      hero = put(s, 'hero', 4, 3);
    check('獨行: alone, its attack on a hero is 6 + ⌊stage/2⌋ higher', G.traitEdge(s, scout, hero) === -8);
    check('獨行: its page says so', G.enemyTraitLines(s, scout).includes('【獨行】身旁沒有其他敵人時，出手或還擊攻擊 ＋8。'));
    put(s, 'blade', 5, 4);
    check('獨行: with another black stone beside it, nothing', G.traitEdge(s, scout, hero) === 0);
    unit(s, 'blade').hp = 0;
    check('獨行: a fallen neighbour does not count', G.traitEdge(s, scout, hero) === -8);
  });
  troopAs({ pincer: { atk: 8 } }, () => {
    const s = board();
    const scout = put(s, 'scout', 5, 3),
      hero = put(s, 'hero', 4, 3);
    check('夾擊: a hero with no other black stone beside him is struck plainly', G.traitEdge(s, scout, hero) === 0);
    put(s, 'blade', 4, 2);
    check('夾擊: with another beside the hero, attack ＋8', G.traitEdge(s, scout, hero) === -8);
    check('夾擊: its page says so', G.enemyTraitLines(s, scout).includes('【夾擊】目標身旁另有敵人時，出手或還擊攻擊 ＋8。'));
    const plain = withTraits('scout-0', {}, () => G.damage(scout, hero, false, 0, s));
    check('夾擊: the blow is that much heavier', G.damage(scout, hero, false, 0, s) === plain + 8);
  });

  // 步裡藏毒 and 墜網
  troopAs({ stepPoison: { power: 2, turns: 2 } }, () => {
    const walk = board();
    walk.run.stage = 4;
    only(walk, 'hero');
    const scout = put(walk, 'scout', 7, 3),
      hero = put(walk, 'hero', 4, 3);
    G.startEnemy(walk);
    G.enemyAct(walk, scout);
    check('步裡藏毒: a blow struck after walking poisons, 2 + ⌊stage/2⌋', scout.moved && G.distance(scout, hero) === 1 && hero.conditions?.poison?.power === 4, JSON.stringify(hero.conditions || {}));
    const stand = board();
    only(stand, 'hero');
    const still = put(stand, 'scout', 5, 3),
      target = put(stand, 'hero', 4, 3);
    G.startEnemy(stand);
    G.enemyAct(stand, still);
    check('步裡藏毒: a blow struck from where it stood does not', !still.moved && target.hp < target.maxHp && !target.conditions?.poison);
    check('步裡藏毒: its page says so', G.enemyTraitLines(stand, still).includes('【步裡藏毒】走動之後的普攻令目標中毒，兩次毒發各損 2 氣血；原地出手與還擊不帶毒。'));
  });
  troopAs({ snare: { power: 2, turns: 2 } }, () => {
    const s = board();
    only(s, 'hero');
    const scout = put(s, 'scout', 5, 3),
      hero = put(s, 'hero', 4, 3);
    G.startEnemy(s);
    G.enemyAct(s, scout);
    const pin = hero.conditions?.pin;
    check('墜網: its plain blow leaves the hero 絆足 2 until his next turn is over', pin?.power === 2 && pin.through === s.round + 1);
    check('墜網: its page says so', G.enemyTraitLines(s, scout).includes('【墜網】普攻令目標絆足，移動減 2，持續至下回合；還擊不帶網。'));
    const c = board();
    only(c, 'hero');
    const quiet = put(c, 'scout', 5, 3),
      striker = put(c, 'hero', 4, 3);
    striker.activeArt = null;
    G.resolve(c, striker, quiet, false);
    check('墜網: its counter carries no net', quiet.hp < quiet.maxHp && !striker.conditions?.pin);
  });

  // 沉樁
  troopAs({ lastStand: { below: 0.5, cut: 40 } }, () => {
    const s = board();
    const scout = put(s, 'scout', 5, 3),
      hero = put(s, 'hero', 4, 3);
    hero.activeArt = null;
    const full = G.forecast(hero, scout, false, s).amount;
    check('沉樁: above half it takes blows whole', G.stanceCut(s, scout) === 0);
    scout.hp = Math.floor(scout.maxHp / 2);
    check('沉樁: at half or below, 40% less', G.stanceCut(s, scout) === 40 && G.forecast(hero, scout, false, s).amount === Math.round((full * 60) / 100), full + ' → ' + G.forecast(hero, scout, false, s).amount);
    check('沉樁: its page says so', G.enemyTraitLines(s, scout).includes('【沉樁】氣血不過半時，受到的傷害減 40%。'));
  });

  // 分刺
  withTraits('chief', { flurry: { share: 0.5 }, post: held(3, 3) }, () => {
    const s = board();
    only(s, 'hero', 'medic');
    const chief = put(s, 'chief', 3, 3),
      hero = put(s, 'hero', 4, 3),
      medic = put(s, 'medic', 3, 4);
    const raw = { hero: G.damage(chief, hero, false, 0, s), medic: G.damage(chief, medic, false, 0, s) };
    const before = { hero: hero.hp, medic: medic.hp };
    G.startEnemy(s);
    const effects = G.enemyAct(s, chief);
    const first = effects[0][0],
      second = first === 'hero' ? 'medic' : 'hero';
    const lost = (id) => before[id] - unit(s, id).hp;
    check('分刺: the first blow lands whole, the second on the other hero at its share', lost(first) === raw[first] && lost(second) === Math.max(1, Math.round(raw[first] * 0.5)), JSON.stringify(effects));
    check('分刺: only the hero first struck counters', effects.filter((e) => e[0] === 'chief').length <= 1 && s.logs.filter((l) => l.text.startsWith('還擊')).length <= 1);
    check('分刺: the log tells it, and the board’s tally counts it', s.logs.some((l) => l.text.startsWith('針影一分')) && s.tally.fired.flurry === 1);
    check('分刺: its page says so', G.enemyTraitLines(s, chief).some((l) => l.startsWith('【分刺】') && l.includes('50%')));
    const one = board();
    only(one, 'hero');
    const lone = put(one, 'chief', 3, 3);
    put(one, 'hero', 4, 3);
    G.startEnemy(one);
    const single = G.enemyAct(one, lone);
    check('分刺: with no second hero in reach there is one blow', single.filter((e) => e[0] !== 'chief').length === 1 && !one.tally.fired.flurry);
  });

  // 轉折
  {
    const s = board();
    only(s, 'hero', 'guard');
    const chief = put(s, 'chief', 3, 3),
      hero = put(s, 'hero', 4, 3);
    const onPlain = withTraits('chief', {}, () => G.damage(chief, hero, false, 0, s));
    put(s, 'hero', 2, 3); // 疏竹林: 防禦 ＋5
    const sheltered = withTraits('chief', {}, () => G.damage(chief, hero, false, 0, s));
    const bent = withTraits('chief', { bend: true }, () => G.damage(chief, hero, false, 0, s));
    check('轉折: the ground’s defence does not count against it', sheltered < onPlain && bent === onPlain, [onPlain, sheltered, bent].join(' '));
    const guard = put(s, 'guard', 2, 2);
    BM.applyCondition(s, guard, { kind: 'cover', power: 1, turns: 2 }, guard);
    check('（代受 would take a plain villain’s blow）', G.coverer(s, hero) === guard);
    withTraits('chief', { bend: true, post: held(3, 3) }, () => {
      const [a, b] = [hero.hp, guard.hp];
      G.startEnemy(s);
      G.enemyAct(s, chief);
      check('轉折: no one takes its blow for another', hero.hp < a && guard.hp === b);
      check('轉折: its page says so', G.enemyTraitLines(s, chief).some((l) => l.startsWith('【轉折】')));
    });
    withTraits('chief', { prefers: 'sheltered' }, () => {
      const t = board();
      const c = put(t, 'chief', 3, 3),
        h = put(t, 'hero', 2, 3),
        m = put(t, 'medic', 4, 3);
      check('偏好 · 倚仗掩體: a hero on defensive ground is wanted more', G.preference(t, c, h, G.party(t)) === -35 && G.preference(t, c, m, G.party(t)) === 0);
    });
  }

  // 擒拿
  {
    const prior = G.DETAILS.chief.style;
    G.DETAILS.chief.style = 'drain';
    try {
      withTraits('chief', { sig: { reach: 3 }, pull: true, post: held(3, 3) }, () => {
        const s = board();
        s.round = 3;
        only(s, 'hero');
        const chief = put(s, 'chief', 3, 3),
          hero = put(s, 'hero', 6, 3),
          mp = hero.mp;
        G.startEnemy(s);
        G.enemyAct(s, chief);
        check('擒拿: the signature drags the hero to the tile beside the villain nearest where he stood', hero.x === 4 && hero.y === 3 && s.tally.fired.pull === 1, hero.x + ',' + hero.y);
        check('擒拿: and takes his 內力 as its style says', hero.mp < mp);
        check('擒拿: the walk is recorded for the board to play', Array.isArray(hero.route) && same(hero.route.at(-1), { x: 4, y: 3 }));
        check('擒拿: its page says so', G.enemyTraitLines(s, chief).some((l) => l.startsWith('【擒拿】')));
        const near = board();
        near.round = 3;
        only(near, 'hero');
        const c = put(near, 'chief', 3, 3),
          h = put(near, 'hero', 4, 3);
        G.startEnemy(near);
        G.enemyAct(near, c);
        check('擒拿: a hero already beside him stays', h.x === 4 && h.y === 3 && !near.tally.fired.pull);
      });
    } finally {
      G.DETAILS.chief.style = prior;
    }
  }

  // 水上飄
  {
    const s = board();
    const chief = put(s, 'chief', 3, 3); // 疏竹林 at (2,3) costs two steps; his step is 2
    const far = (traits) => withTraits('chief', traits, () => G.reachable(s, chief).has('1,3'));
    check('水上飄: every tile costs one step', !far({}) && far({ fleet: true }));
    check('水上飄: its page says so', withTraits('chief', { fleet: true }, () => G.enemyTraitLines(s, chief).some((l) => l.startsWith('【水上飄】'))));
    const hero = put(s, 'hero', 3, 2);
    check('水上飄: a hero’s walk is as before', withTraits('chief', { fleet: true }, () => !G.reachable(s, hero).has('1,3') || G.stat(hero, 'step', s) >= 4));
  }

  // 陰陽倒亂
  withTraits('chief', { twin: { atk: 5 } }, () => {
    const s = board();
    s.run.stage = 3;
    const chief = put(s, 'chief', 3, 3),
      hero = put(s, 'hero', 4, 3);
    check('陰陽倒亂: an odd round is the sabre’s: attack ＋5 + ⌊stage/2⌋, reach as it is', G.twinForm(s, chief) === 'sabre' && G.traitEdge(s, chief, hero) === -6 && G.reach(s, chief) === chief.range);
    s.round = 2;
    check('陰陽倒亂: an even round is the sword’s: reach ＋1, attack as it is', G.twinForm(s, chief) === 'sword' && G.traitEdge(s, chief, hero) === 0 && G.reach(s, chief) === chief.range + 1 && G.strikeReach(s, chief) === chief.range + 1);
    check('陰陽倒亂: its page says which is up', G.enemyTraitLines(s, chief).some((l) => l.startsWith('【陰陽倒亂】') && l.endsWith('本回合：黑劍。')));
    check('陰陽倒亂: a hero has no such rounds', G.twinForm(s, hero) === null && G.reach(s, hero) === hero.range);
  });
  withTraits('chief', { twin: { atk: 5 }, post: held(3, 3) }, () => {
    const s = board();
    for (const e of G.enemies(s)) if (e.id !== 'chief') e.hp = 0;
    put(s, 'chief', 3, 3);
    const odd = new Set(dangerTiles(s));
    s.round = 2;
    const even = new Set(dangerTiles(s));
    check('陰陽倒亂: the danger zone reaches one tile further on a sword round', !odd.has('5,3') && odd.has('4,3') && even.has('5,3'));
  });
}

// ─────────────────────────────────────────────────────────────────────────
console.log(failures ? '\n' + failures + ' check(s) failed.' : '\nAll mechanics checks passed.');
process.exit(failures ? 1 : 0);
