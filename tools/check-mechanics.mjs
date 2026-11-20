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

// ─────────────────────────────────────────────────────────────────────────
console.log(failures ? '\n' + failures + ' check(s) failed.' : '\nAll mechanics checks passed.');
process.exit(failures ? 1 : 0);
