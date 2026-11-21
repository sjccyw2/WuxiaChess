// Plays many runs through the story, without a browser, to make sure it holds together
// whichever heroes are drawn and whatever order the boards come in.
//
//   node tools/check-story.mjs
//
// For each run it walks every scene (before and after each board, won or lost), and fails if
// a line has no speaker or no text, if a hero is missing one of their own lines, if a board's
// script leans on another board, or if a save made mid-run no longer loads.
const root = new URL('../game/src/', import.meta.url);
const load = (file) => import(new URL(file, root));
const R = await load('rules/journey.js');
const G = await load('rules/game.js');
const { ENCOUNTER_SCRIPT } = await load('data/encounter-script.js');
const { ENCOUNTERS } = await load('data/encounters.js');
const { MAZE_TALE, CHAMBER_TALES, SIDE_TALES } = await load('data/maze-tale.js');
const { WORLD, WAKES, FATES, FRAGMENTS } = await load('data/wake-tale.js');
const { HERO_VOICES, sameSeries } = await load('data/hero-voices.js');
const { VISITOR } = await load('rules/ferry-market.js');

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
}
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
  for (const part of ['before', 'win', 'loss'])
    for (const beat of script[part])
      if (!['boss', 'mini', 'youth', 'leader', 'ally'].includes(beat.who) || !beat.text)
        fail(here + ' ' + part + ': a line has no speaker or no text');
  if (!CHAMBER_TALES[map].arrival || !CHAMBER_TALES[map].victory) fail(here + ': missing arrival or victory');
  // Whatever the side objective is here, there is a line for having done it.
  if (!SIDE_TALES[R.mapGoalType(map)]) fail(here + ': no line for its side objective');
  // The boards are about masters made to fight, not about bystanders to be saved.
  for (const word of ['影子', '救下', '執念']) if (text.includes(word)) fail(here + ': still speaks of ' + word);
});
if (!MAZE_TALE.unlit) fail('no line for a won board whose side objective was not done');
// Nothing in the story may give away who set the boards, or fall back on the old ferry.
const story = JSON.stringify([MAZE_TALE, CHAMBER_TALES, SIDE_TALES, WORLD, WAKES, FATES, FRAGMENTS, ENCOUNTER_SCRIPT, HERO_VOICES, VISITOR]);
for (const word of ['劍塚', '劍仙', '獨孤', '求敗', '桑婆婆', '回牒', '歸印', '渡船', '船娘', '周伯通'])
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
    if (!line.person && !line.portrait) fail(label + ' line ' + (i + 1) + ': speaker has no picture');
  });
  if (!R.restoreRun(JSON.parse(JSON.stringify(s)))) fail(label + ': a save made here does not load');
  return lines;
}
// A tiny seeded generator so a failure can be reproduced from the seed.
const dice = (seed) => () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);

let runs = 0,
  scenes = 0,
  echoes = 0;
const trios = new Set(),
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
    // How far this run gets: some lose early, some reach the end.
    const reach = run % 3 === 0 ? 10 : 1 + Math.floor(roll() * 10);
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
      }
      if (r.stage === 4 && !before.some((line) => HERO_VOICES[line.person?.id]?.night.includes(line.text)))
        fail(at + ': no night talk');
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
      // Sometimes the side objective is done, which brings a new hero.
      if (won && roll() < 0.7) {
        r.marked = true;
        s.round = 3;
      } else s.round = 9;
      if (!R.settle(s)) {
        fail(at + ': could not settle');
        break;
      }
      const after = checkScene(s, 'after', at + ' after');
      scenes++;
      if (r.last.recruit && !after.some((line) => line.person?.id === r.last.recruit))
        fail(at + ': ' + G.DETAILS[r.last.recruit].name + ' joined without a word');
      if (won && !after.some((line) => line.text === (r.last.optional ? SIDE_TALES[r.goal] : MAZE_TALE.unlit)))
        fail(at + ': nothing said about the side objective');
      if (r.last.terminal && won)
        for (const u of G.party(s))
          if (!after.some((line) => line.text === HERO_VOICES[u.id].farewell))
            fail(at + ': ' + G.DETAILS[u.id].name + ' left without a farewell');
      R.turnPage(s, true);
      if (r.last.terminal) {
        if (!R.closingFor(r.voyage, won)) fail(at + ': nothing to close his eyes on');
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
    routes.size + ' board orders · ' + leaders.size + ' leaders · ' + echoes + ' deja vu lines'
);
if (problems.size) {
  console.error('\n' + problems.size + ' problem(s):\n  ' + [...problems].slice(0, 40).join('\n  '));
  process.exit(1);
}
console.log('OK');
