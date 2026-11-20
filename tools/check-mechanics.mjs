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
function withTraits(key, traits, body) {
  const had = Object.hasOwn(G.DETAILS, key),
    prior = G.DETAILS[key]?.traits;
  G.DETAILS[key] = { ...(G.DETAILS[key] || {}), traits };
  try {
    return body();
  } finally {
    if (had) G.DETAILS[key].traits = prior;
    else delete G.DETAILS[key];
  }
}
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
  check('today’s arts put nothing on their caster', Object.values(TECHNIQUES).every((a) => !BM.selfEffectsOf(a).length));

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
  nextBoard(first);
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
  check('a RANKS entry names the piece; without one the shared piece is used', named === '試射手' && G.unitDetails(unit(second, 'echoBow')).name === G.DETAILS.echoBow.name);

  // Status strength by stage, only once a villain's traits are written.
  const s = board();
  s.run.stage = 4;
  const chief = unit(s, 'chief');
  const style = G.DETAILS.chief.style;
  check('without traits a signature keeps the flat stage-0 strength', G.enemyTechnique(chief, s).power === 3);
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
  const expected = [
    '絕技射程 3 格',
    '絕技絆足 · 中招者移動 −2，2 回合',
    '坐鎮 · 守在（' + (spawn.x + 1) + '，' + (spawn.y + 1) + '）1 格內；有俠客踏入攻擊範圍才出手，受擊或出手後離位追擊',
    '專挑傷重者',
    '化功 · 貼身打中他的俠客損失 8 內力',
    '盟令 · 存活時其餘敵人攻擊 ＋1',
    '游擊 · 出手後退開至多 2 步',
    '毒手 · 普攻令目標中毒，兩次毒發各損 2 氣血'
  ];
  check('the enemy page lists each trait', same(lines, expected), JSON.stringify(lines));
  const html = withTraits('chief', { glide: 2 }, () => P.enemyPage(page, 'chief'));
  check('the enemy page shows the step and the trait lines', html.includes('移動 <b>') && html.includes('游擊 · 出手後退開至多 2 步'));
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

// ─────────────────────────────────────────────────────────────────────────
console.log(failures ? '\n' + failures + ' check(s) failed.' : '\nAll mechanics checks passed.');
process.exit(failures ? 1 : 0);
