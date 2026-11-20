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
    check('the master’s page names who covers him', G.enemyTraitLines(s, chief).includes('代受 · 身旁的' + names[0] + '替他承受直接攻擊'));
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

// ─────────────────────────────────────────────────────────────────────────
console.log(failures ? '\n' + failures + ' check(s) failed.' : '\nAll mechanics checks passed.');
process.exit(failures ? 1 : 0);
