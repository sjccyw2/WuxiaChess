// Plays many runs through the story, without a browser, to make sure it holds together
// whichever heroes are drawn and whatever order the boards come in.
//
//   node tools/check-story.mjs
//
// For each run it walks every scene (before and after each board, won or lost), and fails if
// a line has no speaker or no text, if a hero is missing one of their own lines, if a board's
// script leans on another board, if 求敗 or 韋小寶 misses a line the story promises (what he
// says after a board, the side bet, 請回吧), or if a save made mid-run no longer loads.
const root = new URL('../game/src/', import.meta.url);
const load = (file) => import(new URL(file, root));
const R = await load('rules/journey.js');
const G = await load('rules/game.js');
const { ENCOUNTER_SCRIPT } = await load('data/encounter-script.js');
const { ENCOUNTERS, VILLAINS } = await load('data/encounters.js');
const { MAZE_TALE, CHAMBER_TALES, SIDE_TALES, SIDE_PAY, SIDE_MISS, QIUBAI, WEI } = await load('data/maze-tale.js');
const { WORLD, WAKES, FRAGMENTS, NO_MARK, FULL_MARK } = await load('data/wake-tale.js');
const { HERO_VOICES, sameSeries } = await load('data/hero-voices.js');
const { VISITOR } = await load('rules/ferry-market.js');
const { BATTLES, SIDE_REWARDS } = await load('data/battles.js');
const { HERO_PATHS } = await load('data/mastery-catalog.js');

const problems = new Set();
const fail = (message) => problems.add(message);
const names = (ids) => ids.map((id) => G.DETAILS[id].name).join('、');

// ── The written lines themselves ─────────────────────────────────────────
for (const id of G.PARTY) {
  const v = HERO_VOICES[id];
  if (!v) {
    fail(id + ': no lines of their own');
    continue;
  }
  if (!v.arrival?.note || !v.arrival?.text) fail(id + ': arrival is incomplete');
  if (!v.obey || !v.farewell) fail(id + ': missing obey or farewell');
  if (v.echoes?.length < 2 || v.echoes.some((line) => !line)) fail(id + ': needs two deja vu lines');
  if (v.night?.length !== 2 || v.night.some((line) => !line)) fail(id + ': needs two night-talk lines');
  // The art that made their name comes back last, and they say what it cost.
  if (!v.summit) fail(id + ': no line for the top art');
  if (!HERO_PATHS[id]?.layout.at(-1).find(Boolean)) fail(id + ': the tree has no top art');
}
// The spine: 求敗 has a line after each of the first nine boards in each of the five 境, a close
// for each 境, and a greeting for each; 韋小寶 has a line for every kind of pay.
if (MAZE_TALE.after.length !== WAKES.length || MAZE_TALE.close.length !== WAKES.length)
  fail('求敗 does not have lines for all five 境');
MAZE_TALE.after.forEach((lines, i) => {
  if (lines.length !== 9 || lines.some((line) => !line.text)) fail('境 ' + (i + 1) + ': 求敗 needs a line after each of nine boards');
});
MAZE_TALE.close.forEach((lines, i) => {
  if (!lines.at(-1).text.includes('請回吧')) fail('境 ' + (i + 1) + ': the close does not end with 請回吧');
});
if (MAZE_TALE.prologue.again.greeting.length !== WAKES.length) fail('求敗 needs a greeting for each 境');
if (MAZE_TALE.unseen.length !== WAKES.length) fail('求敗 needs a line about the empty spot for each 境');
for (const reward of SIDE_REWARDS) if (!SIDE_PAY[reward]) fail('韋小寶 has no line for a bet paid in ' + reward);
if (!SIDE_MISS) fail('韋小寶 has no line for a bet missed');
ENCOUNTER_SCRIPT.forEach((script, map) => {
  const here = CHAMBER_TALES[map].name,
    master = ENCOUNTERS[map][0];
  // A hero only has a line of their own on a board whose master is from their series.
  for (const id of Object.keys(script.heroLines || {}))
    if (!sameSeries(G.BOOKS[id], master.book))
      fail(here + ': ' + G.DETAILS[id].name + ' has a line but is not from ' + master.book);
  // A board is a closed scene: it must not name any other board.
  const text = JSON.stringify(script) + JSON.stringify(CHAMBER_TALES[map]);
  CHAMBER_TALES.forEach((other, j) => {
    if (j !== map && text.includes(other.name)) fail(here + ': mentions another board, ' + other.name);
  });
  // The named black stones 求敗 set down beside the master and his lieutenant.
  const board = BATTLES[map],
    standing = board.pieces.map((p) => p.id),
    arriving = board.waves.flatMap((w) => w.pieces.map((p) => p.id)),
    named = [...standing, ...arriving].filter((id) => VILLAINS[id]);
  for (const id of named) if (!script.extras?.[id]) fail(here + ': ' + VILLAINS[id].name + ' has no lines');
  for (const [id, extra] of Object.entries(script.extras || {})) {
    if (!named.includes(id)) {
      fail(here + ': lines for ' + id + ', who is not on this board');
      continue;
    }
    const who = VILLAINS[id].name;
    // One who arrives later speaks as he steps on; one who stands there speaks before the battle.
    if (arriving.includes(id) && !extra.enter) fail(here + ': ' + who + ' says nothing as he steps on');
    if (standing.includes(id) && !script.before.some((beat) => beat.who === id)) fail(here + ': ' + who + ' says nothing before the battle');
    if (extra.reply && (!['boss', 'mini'].includes(extra.reply.who) || !extra.reply.text)) fail(here + ': the reply to ' + who + ' has no speaker or text');
    // A hero answers a named black stone only if they are from the same series of books.
    for (const hero of Object.keys(extra.heroes || {}))
      if (!sameSeries(G.BOOKS[hero], VILLAINS[id].book))
        fail(here + ': ' + G.DETAILS[hero].name + ' has a line against ' + who + ' but is not from ' + VILLAINS[id].book);
  }
  // The board's objects (battles.js `objects`): each has its lines, and only those on the board.
  const objectKeys = [...new Set((board.objects || []).map((o) => o.id.split('#')[0]))];
  for (const key of objectKeys) {
    const lines = script.objects?.[key],
      name = G.DETAILS[key].name,
      keep = G.DETAILS[key].kind === 'keep';
    if (!lines) {
      fail(here + ': ' + name + ' has no lines');
      continue;
    }
    for (const moment of ['hit', 'broken', ...(keep ? ['held'] : [])]) {
      const beat = lines[moment];
      if (!beat?.text || !(['boss', 'mini', 'youth'].includes(beat.who) || script.extras?.[beat.who]))
        fail(here + ': ' + name + ' has no speaker or text when ' + moment);
    }
    if (keep && !lines.lost) fail(here + ': ' + name + ' breaking has no reason for the loss');
  }
  for (const key of Object.keys(script.objects || {}))
    if (!objectKeys.includes(key)) fail(here + ': lines for ' + key + ', which is not on this board');
  for (const part of ['before', 'win', 'loss'])
    for (const beat of script[part])
      if (!(['boss', 'mini', 'youth', 'leader', 'ally'].includes(beat.who) || script.extras?.[beat.who]) || !beat.text)
        fail(here + ' ' + part + ': a line has no speaker or no text');
  if (!CHAMBER_TALES[map].arrival || !CHAMBER_TALES[map].victory) fail(here + ': missing arrival or victory');
  // Whatever secondary is drawn here, there is a line for having done it.
  for (const side of BATTLES[map].sides)
    if (!(SIDE_TALES[side.kind] || SIDE_TALES.done)) fail(here + ': no line for its secondary ' + side.kind);
  // The boards are about masters made to fight, not about bystanders to be saved.
  for (const word of ['影子', '救下', '執念']) if (text.includes(word)) fail(here + ': still speaks of ' + word);
});
// Nothing in the story may fall back on the old ferry, on the letter that heroes once answered,
// or on the old name of the force on the black stones; and nothing may use a modern word for
// what the heroes are.
const story = JSON.stringify([MAZE_TALE, CHAMBER_TALES, SIDE_TALES, SIDE_PAY, SIDE_MISS, WORLD, WAKES, FRAGMENTS, NO_MARK, FULL_MARK, ENCOUNTER_SCRIPT, HERO_VOICES, VISITOR]);
for (const word of ['桑婆婆', '回牒', '歸印', '渡船', '船娘', '周伯通', '劍意', '應帖', '英雄帖', '持帖', '複本', '複製', '模擬'])
  if (story.includes(word)) fail('story text contains ' + word);

// ── Whole runs ───────────────────────────────────────────────────────────
function checkScene(s, scene, label) {
  let lines;
  try {
    lines = R.dialogue(s, scene);
  } catch (e) {
    fail(label + ': ' + e.message);
    return [];
  }
  lines.forEach((line, i) => {
    if (!line.speaker || !line.text) fail(label + ' line ' + (i + 1) + ': no speaker or no text');
    if ((line.text + line.note).includes('{')) fail(label + ' line ' + (i + 1) + ': a name was not filled in');
    if (!line.person && !line.portrait) fail(label + ' line ' + (i + 1) + ': speaker has no picture');
  });
  if (!R.restoreRun(JSON.parse(JSON.stringify(s)))) fail(label + ': a save made here does not load');
  return lines;
}
// Sets the facts that meet the drawn secondary of a won board.
function forceSide(s) {
  const r = s.run,
    side = r.side,
    map = s.mapIndex,
    fall = (ref, extra = {}) =>
      s.tally.falls.push({ id: G.refId(map, ref), by: null, how: 'basic', round: 2, phase: 'ally', ...extra });
  if (side.kind === 'lamp') r.marked = true;
  if (side.kind === 'swift') s.round = side.by;
  if (side.kind === 'lastBlow') fall(side.target, { by: side.hero });
  if (side.kind === 'order') fall(side.first);
  if (side.kind === 'double') fall('lieutenant'), fall('bow');
  if (side.kind === 'combo') fall('bow', { combo: true });
  if (side.kind === 'answer') fall('bow', { by: side.hero, answered: true });
}
// A tiny seeded generator so a failure can be reproduced from the seed.
const dice = (seed) => () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);

let runs = 0,
  scenes = 0,
  echoes = 0;
const realms = new Set(),
  trios = new Set(),
  routes = new Set(),
  leaders = new Set();
for (let player = 0; player < 60; player++) {
  const roll = dice(player * 7919 + 11);
  let legacy = R.LEGACY;
  // Each player plays several runs in a row, so later runs can carry deja vu.
  for (let run = 1; run <= 7; run++) {
    const draw = R.drawLots(Math.floor(roll() * 4294967296));
    draw.leaderId = draw.ids[Math.floor(roll() * 3)];
    if (run === 1) draw.name = '阿' + player;
    const s = R.startRun(draw, legacy),
      r = s.run,
      label = 'seed ' + draw.seed + ' run ' + run;
    runs++;
    trios.add([...draw.ids].sort().join());
    routes.add(r.route.join());
    leaders.add(draw.leaderId);
    if (R.youthName(s) !== '阿' + player) fail(label + ': the name was not kept');
    if (r.voyage !== run) fail(label + ': run counter is ' + r.voyage);
    // The 境 is one more than the runs won before this one.
    if (r.realm !== legacy.wins + 1) fail(label + ': 境 is ' + r.realm + ' after ' + legacy.wins + ' runs won');
    const realm = Math.min(WAKES.length, r.realm);
    // How far this run gets: some lose early, some reach the end.
    // Every sixth player wins every run, so the fifth 境 and the runs after it are played too.
    const reach = run % 3 === 0 || player % 6 === 0 ? 10 : 1 + Math.floor(roll() * 10);
    realms.add(r.realm);
    for (;;) {
      const at = label + ' board ' + (r.stage + 1) + ' ' + CHAMBER_TALES[s.mapIndex].name;
      const before = checkScene(s, 'before', at + ' before');
      scenes++;
      const company = G.company(s);
      if (r.stage === 0) {
        for (const u of company)
          if (!before.some((line) => line.text === HERO_VOICES[u.id].arrival.text))
            fail(at + ': ' + G.DETAILS[u.id].name + ' did not arrive');
        if (!before.some((line) => line.text === HERO_VOICES[s.leader].obey)) fail(at + ': leader did not answer');
        if (!before.some((line) => line.speaker === WEI.name && line.text === MAZE_TALE.ruleTold)) fail(at + ': nobody made the rule plain');
        // From the second 境 the heroes are told that they are copies.
        const told = before.some((line) => [...MAZE_TALE.told.cold, ...MAZE_TALE.told.plain].some((b) => b.text === line.text));
        if (told !== realm >= 2) fail(at + ': 境 ' + realm + (told ? ' tells' : ' does not tell') + ' the heroes what they are');
      }
      if (r.stage === 4 && !before.some((line) => line.text === HERO_VOICES[line.person?.id]?.night[realm >= 2 ? 1 : 0]))
        fail(at + ': no night talk for 境 ' + realm);
      // A named black stone who stands on the board from the start has his say before the battle.
      for (const piece of BATTLES[s.mapIndex].pieces)
        if (VILLAINS[piece.id] && !before.some((line) => line.person?.id === piece.id))
          fail(at + ': ' + VILLAINS[piece.id].name + ' stands there and says nothing');
      const deja = before.filter((line) => HERO_VOICES[line.person?.id]?.echoes.includes(line.text));
      echoes += deja.length;
      if (deja.length > 1) fail(at + ': more than one deja vu line');
      if (deja.length && (run === 1 || !legacy.seen.includes(s.mapIndex) || !legacy.walked[deja[0].person.id]))
        fail(at + ': deja vu without having been here before');
      if (!R.turnPage(s, true) || !R.turnPage(s, true) || !R.deployLineup(s) || !R.beginBattle(s)) {
        fail(at + ': could not deploy');
        break;
      }
      const won = r.stage + 1 <= reach;
      s.result = won ? 'win' : 'loss';
      s.reason = won ? CHAMBER_TALES[s.mapIndex].victory : '';
      // Sometimes the secondary is done, which pays a bonus; every win brings a hero.
      s.round = 9;
      const forced = won && roll() < 0.7;
      if (forced) forceSide(s);
      if (!R.settle(s)) {
        fail(at + ': could not settle');
        break;
      }
      if (forced && !r.last.optional) fail(at + ': the secondary ' + r.side.kind + ' was not done');
      const after = checkScene(s, 'after', at + ' after');
      scenes++;
      if (r.last.recruit && !after.some((line) => line.person?.id === r.last.recruit))
        fail(at + ': ' + G.DETAILS[r.last.recruit].name + ' joined without a word');
      // 韋小寶 settles his side bet: met, by its kind and its pay; missed, one short line.
      const weiSays = (text) => after.some((line) => line.speaker === WEI.name && line.text === text);
      if (won && r.last.optional && !(weiSays(SIDE_TALES[r.side.kind] || SIDE_TALES.done) && weiSays(SIDE_PAY[r.last.side.reward])))
        fail(at + ': 韋小寶 did not settle the bet ' + r.side.kind);
      if (won && !r.last.optional && !weiSays(SIDE_MISS)) fail(at + ': nothing said about the bet missed');
      // 求敗 speaks after every board: what he makes of a win, 請回吧 at the end of the run.
      const qiu = after.filter((line) => line.speaker === QIUBAI.name);
      if (!qiu.length) fail(at + ': 求敗 says nothing');
      if (r.last.terminal && !qiu.at(-1).text.includes('請回吧')) fail(at + ': the run does not end with 請回吧');
      // A run won ends on what 求敗 saw in this 境; past the fifth, on the line that waits for the last battle.
      if (r.last.terminal && won)
        for (const beat of r.realm > WAKES.length ? MAZE_TALE.closeAgain : MAZE_TALE.close[realm - 1])
          if (!after.some((line) => line.text === beat.text.replaceAll('{name}', R.youthName(s))))
            fail(at + ': the close of 境 ' + r.realm + ' is incomplete');
      if (won && !r.last.terminal && !qiu.some((line) => line.text === MAZE_TALE.after[realm - 1][r.stage].text))
        fail(at + ': 求敗 has the wrong line for 境 ' + realm + ' board ' + (r.stage + 1));
      if (won && !r.last.terminal && !r.last.recruit && r.pool.length > 0)
        fail(at + ': a win brought no hero');
      if (r.last.terminal && won)
        for (const u of G.party(s))
          if (!after.some((line) => line.text === HERO_VOICES[u.id].farewell))
            fail(at + ': ' + G.DETAILS[u.id].name + ' left without a farewell');
      R.turnPage(s, true);
      if (r.last.terminal) {
        if (!R.closingFor(realm, won)) fail(at + ': nothing to wake to');
        break;
      }
      if (!R.advance(s)) {
        fail(at + ': could not advance');
        break;
      }
    }
    legacy = r.chronicle;
    if (legacy.returns !== run) fail(label + ': the run was not counted');
    for (const u of G.company(s)) if (!legacy.walked[u.id]) fail(label + ': ' + names([u.id]) + ' not recorded as having walked');
    if (!R.restoreRun(JSON.parse(JSON.stringify(s)))) fail(label + ': the finished run does not load');
  }
}

console.log(
  runs + ' runs · ' + scenes + ' scenes · ' + trios.size + ' different trios · ' +
    routes.size + ' board orders · ' + leaders.size + ' leaders · ' + echoes + ' deja vu lines · 境 ' + [...realms].sort((a, b) => a - b).join(' ')
);
if (problems.size) {
  console.error('\n' + problems.size + ' problem(s):\n  ' + [...problems].slice(0, 40).join('\n  '));
  process.exit(1);
}
console.log('OK');
