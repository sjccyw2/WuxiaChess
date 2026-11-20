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
const { ENCOUNTERS, RANKS, STATUS_POWER } = await load('data/encounters.js');
const { mapLayout } = await load('data/terrain.js');
const { dangerTiles } = await load('actors/danger.js');
const P = await load('ui/panels.js');

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

  // 青鋒劍 is gone from the game: a save holding one gets its price back and stays loadable.
  const armed = board(['hero', 'medic', 'guard']);
  unit(armed, 'hero').weapon = 'blueEdge';
  armed.stock.pine = 1;
  armed.stock.blueEdge = 1;
  armed.run.shop.push({ id: 'blueEdge', price: 33, left: 1 });
  const purse = armed.run.coins;
  const disarmed = R.restoreRun(copy(armed));
  check('a save holding the removed sword restores', !!disarmed);
  check('its bearer takes up his own weapon again', disarmed && unit(disarmed, 'hero').weapon === 'pine' && !disarmed.stock.pine);
  check('it leaves the stores and the shelf', disarmed && !('blueEdge' in disarmed.stock) && !disarmed.run.shop.some((o) => o.id === 'blueEdge'));
  check('both swords are paid for', disarmed?.run.coins === purse + 66, disarmed?.run.coins);
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
  check('RANKS has an entry per board', RANKS.length === 10 && RANKS.every((r) => r && typeof r === 'object'));

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
  check('the enemy page shows the step and the trait lines', html.includes('移動 <b>') && html.includes('<b>游擊</b>　出手後退開至多 2 步，離俠客越遠越好。'));
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
      s.run.scene = 'fight';
      s.run.formationOpen = false;
    } else {
      // board() parks every piece; put them back where board 0's layout sets them.
      const layout = mapLayout(0);
      foesOf(s).forEach((u, i) => Object.assign(u, layout.enemies[i]));
      G.party(s).forEach((u, i) => Object.assign(u, layout.allies[i]));
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
  check('stage ' + stage + ': half health starts the flight', xue.phased && G.fleeing(s, xue) && s.logs.at(-1).text === '血刀老祖刀勢一收，踏雪往藥草地退去。');
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

// ─────────────────────────────────────────────────────────────────────────
console.log(failures ? '\n' + failures + ' check(s) failed.' : '\nAll mechanics checks passed.');
process.exit(failures ? 1 : 0);
