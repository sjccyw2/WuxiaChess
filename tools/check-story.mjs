// Plays many runs through the story, without a browser, to make sure it holds together
// whichever heroes are drawn and whatever order the boards come in.
//
//   node tools/check-story.mjs
//
// For each run it walks every scene (before and after each board, won or lost), and fails if
// a line has no speaker or no text, if a hero is missing one of their own lines, if a board's
// script leans on another board, if 求敗 or 韋小寶 misses a line the story promises (what he
// says after a board, the side bet, 請回吧), or if a save made mid-run no longer loads. Runs in
// 無劍境界 go on to the last board (終局), won and lost; after one is won the next runs are new game
// plus, with 無名 a piece from the first board.
import { existsSync } from 'node:fs';
const root = new URL('../game/src/', import.meta.url);
const load = (file) => import(new URL(file, root));
const R = await load('rules/journey.js');
const G = await load('rules/game.js');
const { ENCOUNTER_SCRIPT } = await load('data/encounter-script.js');
const { ENCOUNTERS, VILLAINS } = await load('data/encounters.js');
const { MAZE_TALE, CHAMBER_TALES, SIDE_TALES, SIDE_PAY, SIDE_MISS, QIUBAI, WEI } = await load('data/maze-tale.js');
const { WORLD, WAKES, FRAGMENTS, NO_MARK } = await load('data/wake-tale.js');
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
// The spine: 求敗 has a line after each of the first nine boards in each of the five 境界, a close
// for each 境界, and a greeting for each; 韋小寶 has a line for every kind of pay.
if (MAZE_TALE.after.length !== WAKES.length || MAZE_TALE.close.length !== WAKES.length)
  fail('求敗 does not have lines for all five 境界');
MAZE_TALE.after.forEach((lines, i) => {
  if (lines.length !== 9 || lines.some((line) => !line.text)) fail('境界 ' + (i + 1) + ': 求敗 needs a line after each of nine boards');
});
// Every close but the fifth sends the youth home; the fifth leads on to the last board.
MAZE_TALE.close.forEach((lines, i) => {
  const last = i === WAKES.length - 1,
    home = lines.at(-1).text.includes('請回吧');
  if (!last && !home) fail('境界 ' + (i + 1) + ': the close does not end with 請回吧');
  if (last && home) fail('境界 ' + (i + 1) + ': the close sends the youth home, but the last board follows it');
});
if (MAZE_TALE.prologue.again.greeting.length !== WAKES.length) fail('求敗 needs a greeting for each 境界');
// The last board and the ending (MAZE_TALE.finale): every part is there, every spoken line has a
// speaker the spine owns (求敗 where none is named, the youth, 韋小寶) and words, the loss sends
// the youth home, and the ending's words are whole, with the film's files in the game.
const finaleTale = MAZE_TALE.finale;
for (const part of ['again', 'invite', 'before', 'after', 'lost']) {
  if (!finaleTale?.[part]?.length) fail('the last board has no lines for ' + part);
  for (const line of finaleTale?.[part] || [])
    if (!line.text || ![undefined, 'qiu', 'youth', 'wei'].includes(line.who)) fail('the last board, ' + part + ': a line has no speaker or no text');
}
if (!finaleTale.lost.some((line) => !line.who && line.text.includes('請回吧'))) fail('a lost last board does not end with 請回吧');
for (const key of ['walkOn', 'half', 'muster', 'missed', 'epilogue', 'name']) if (!finaleTale[key]) fail('the last board has no ' + key);
for (const key of ['title', 'text', 'joins', 'draw']) if (!finaleTale.plus?.[key]) fail('new game plus has no ' + key);
if (!finaleTale.ending?.length || finaleTale.ending.some((line) => !line.note && !line.text)) fail('the ending has a line with no words');
// What the producer fixed for the ending: 求敗 thanks the youth, knows him in one line, and leaves.
const endingWords = finaleTale.ending.map((line) => (line.note || '') + (line.text || '')).join('');
for (const word of ['多謝', '原來是你', '撒手而去，不知所終', '鵰']) if (!endingWords.includes(word)) fail('the ending does not say ' + word);
for (const cut of ['tall', 'wide'])
  for (const key of ['file', 'poster'])
    if (!finaleTale.film?.[cut]?.[key] || !existsSync(new URL('../assets/' + finaleTale.film[cut][key], root)))
      fail('the ending film has no ' + cut + ' ' + key + ' in game/assets');
// 韋小寶 tells one truth in the whole story, and it is at the close of the fifth 境界.
if (!MAZE_TALE.close.at(-1).some((line) => line.who === 'wei' && line.text === '走進來的啊。你又沒關門。')) fail('韋小寶 does not say his one true line');
// 破碎虛空 is 黃易's phrase and is not used (Q-N69); he 撒手而去. 仙 itself is the producer's own
// addition to the world and is allowed (Q-N78).
for (const word of ['破碎虛空'])
  if (JSON.stringify(MAZE_TALE).includes(word)) fail('the spine says ' + word);
// A profile from before the 境界 could be picked: one more than the runs won is open, the rest won.
{
  const old = { ...R.LEGACY, wins: 3, returns: 4 };
  delete old.realms, delete old.cleared, delete old.finale;
  for (const [pick, expect] of [[undefined, 4], [2, 2], [5, 4]]) {
    const s = R.startRun({ ...R.drawLots(7), realm: pick }, old);
    if (s.run.realm !== expect) fail('an old profile with 3 runs won starts in 境界 ' + s.run.realm + ' when ' + pick + ' is picked');
    if (s.run.chronicle.realms !== 4 || s.run.chronicle.cleared.join() !== '1,2,3') fail('an old profile with 3 runs won is not brought up to date');
  }
}

if (MAZE_TALE.unseen.length !== WAKES.length) fail('求敗 needs a line about the empty spot for each 境界');
for (const reward of SIDE_REWARDS) if (!SIDE_PAY[reward]) fail('韋小寶 has no line for a bet paid in ' + reward);
if (!SIDE_MISS) fail('韋小寶 has no line for a bet missed');
if (ENCOUNTER_SCRIPT.length !== BATTLES.length || CHAMBER_TALES.length !== BATTLES.length) fail('a board has no script or no tale');
ENCOUNTER_SCRIPT.forEach((script, map) => {
  const here = CHAMBER_TALES[map].name,
    lastBoard = map === G.LAST_MAP,
    master = ENCOUNTERS[map]?.[0];
  // A hero only has a line of their own on a board whose master is from their series.
  for (const id of Object.keys(script.heroLines || {}))
    if (!master || !sameSeries(G.BOOKS[id], master.book))
      fail(here + ': ' + G.DETAILS[id].name + ' has a line but is not from ' + master?.book);
  // Every board's master has a line for the last board, where he stands of his own accord; the
  // last board itself has none, and only the youth speaks in its own script (the rest is the spine's).
  if (!lastBoard && !script.guest) fail(here + ': its master has no line for the last board');
  if (lastBoard && (script.guest || script.heroLines || script.extras)) fail(here + ': the last board has lines that belong to another layer');
  // A board is a closed scene: it must not name any other board.
  const text = JSON.stringify(script) + JSON.stringify(CHAMBER_TALES[map]);
  CHAMBER_TALES.forEach((other, j) => {
    if (j !== map && text.includes(other.name)) fail(here + ': mentions another board, ' + other.name);
  });
  // The named black stones 求敗 set down beside the master and his lieutenant.
  // (On the last board every piece is a guest from another board or 求敗 himself, whose lines
  // are the spine's: none is named in its own script.)
  const board = G.castBoard(map),
    standing = board.pieces.map((p) => p.id),
    arriving = board.waves.flatMap((w) => w.pieces.map((p) => p.id)),
    named = lastBoard ? [] : [...standing, ...arriving].filter((id) => VILLAINS[id]);
  if (lastBoard)
    for (const id of [...standing, ...arriving])
      if (id !== board.commander && !G.guestLine(id)) fail(here + ': ' + G.DETAILS[id].name + ' has nothing to say there');
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
      if (!((lastBoard ? ['youth'] : ['boss', 'mini', 'youth', 'leader', 'ally']).includes(beat.who) || script.extras?.[beat.who]) || !beat.text)
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
const story = JSON.stringify([MAZE_TALE, CHAMBER_TALES, SIDE_TALES, SIDE_PAY, SIDE_MISS, WORLD, WAKES, FRAGMENTS, NO_MARK, ENCOUNTER_SCRIPT, HERO_VOICES, VISITOR]);
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
  if (side.kind === 'double') {
    const two = G.hasFour(map) ? ['lieutenant', 'bow'] : G.boardOf(s).pieces.slice(1, 3).map((p) => p.id);
    for (const ref of two) fall(ref);
  }
  if (side.kind === 'combo') fall('bow', { combo: true });
  if (side.kind === 'answer') fall('bow', { by: side.hero, answered: true });
}
// A tiny seeded generator so a failure can be reproduced from the seed.
const dice = (seed) => () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);

let runs = 0,
  scenes = 0,
  echoes = 0,
  finales = 0,
  lastWon = 0,
  lastLost = 0,
  plusRuns = 0;
const realms = new Set(),
  trios = new Set(),
  routes = new Set(),
  leaders = new Set();
for (let player = 0; player < 60; player++) {
  const roll = dice(player * 7919 + 11);
  let legacy = R.LEGACY;
  // Every sixth player plays on: twelve runs, so the last board is reached more than once.
  const span = player % 6 === 0 ? 12 : 7;
  // Each player plays several runs in a row, so later runs can carry deja vu. Before each run the
  // player picks a 境界: some always the highest open, some any open one, some one not yet open
  // (which the run must refuse, starting in the highest open instead).
  for (let run = 1; run <= span; run++) {
    const draw = R.drawLots(Math.floor(roll() * 4294967296));
    draw.leaderId = draw.ids[Math.floor(roll() * 3)];
    const open = R.openRealms(legacy),
      habit = player % 3;
    draw.realm = habit === 0 ? open : habit === 1 ? 1 + Math.floor(roll() * open) : 1 + Math.floor(roll() * 5);
    const wanted = draw.realm <= open ? draw.realm : open,
      clearedBefore = [...(legacy.cleared || [])],
      finaleBefore = legacy.finale || 0,
      endedBefore = legacy.ended || 0;
    const s = R.startRun(draw, legacy),
      r = s.run,
      label = 'seed ' + draw.seed + ' run ' + run;
    runs++;
    trios.add([...draw.ids].sort().join());
    routes.add(r.route.join());
    leaders.add(draw.leaderId);
    if (R.youthName(s) !== '無名') fail(label + ': the youth is not 無名');
    if (r.voyage !== run) fail(label + ': run counter is ' + r.voyage);
    // New game plus: once the ending has been seen, 無名 is a fourth piece from the first board.
    const plus = endedBefore > 0,
      youthThere = G.party(s).some((u) => u.id === G.YOUTH_ID);
    if (!!r.plus !== plus || youthThere !== plus || G.party(s).length !== (plus ? 4 : 3))
      fail(label + ': ' + (plus ? 'new game plus without 無名 on the board' : '無名 on the board before the ending'));
    if (plus) plusRuns++;
    // The first time the last board is reached it is lost; the next time it is won.
    const lastWins = finaleBefore > 0;
    let tenWon = false,
      sawFinale = false,
      opened = 0;
    // The 境界 is the one picked, if it is open.
    if (r.realm !== wanted) fail(label + ': 境界 is ' + r.realm + ', picked ' + draw.realm + ' with ' + open + ' open');
    const realm = r.realm;
    // How far this run gets: some lose early, some reach the end.
    // Every sixth player wins every run, so the fifth 境界, the last battle and the runs after it
    // are played too.
    const reach = run % 3 === 0 || player % 6 === 0 ? 10 : 1 + Math.floor(roll() * 10);
    realms.add(r.realm);
    for (;;) {
      const at = label + ' board ' + (r.stage + 1) + ' ' + CHAMBER_TALES[s.mapIndex].name;
      const before = checkScene(s, 'before', at + ' before');
      scenes++;
      const company = G.company(s);
      const onLast = r.stage === R.LAST_STAGE;
      if (r.stage === 0) {
        for (const u of company.filter((v) => HERO_VOICES[v.id]))
          if (!before.some((line) => line.text === HERO_VOICES[u.id].arrival.text))
            fail(at + ': ' + G.DETAILS[u.id].name + ' did not arrive');
        if (!before.some((line) => line.text === HERO_VOICES[s.leader].obey)) fail(at + ': leader did not answer');
        if (!before.some((line) => line.speaker === WEI.name && line.text === MAZE_TALE.ruleTold)) fail(at + ': nobody made the rule plain');
        // From the second 境界 the heroes are told that they are copies.
        const told = before.some((line) => [...MAZE_TALE.told.cold, ...MAZE_TALE.told.plain].some((b) => b.text === line.text));
        if (told !== realm >= 2) fail(at + ': 境界 ' + realm + (told ? ' tells' : ' does not tell') + ' the heroes what they are');
      }
      if (r.stage === 4 && !before.some((line) => line.text === HERO_VOICES[line.person?.id]?.night[realm >= 2 ? 1 : 0]))
        fail(at + ': no night talk for 境界 ' + realm);
      // A named black stone who stands on the board from the start has his say before the battle.
      for (const piece of onLast ? [] : BATTLES[s.mapIndex].pieces)
        if (VILLAINS[piece.id] && !before.some((line) => line.person?.id === piece.id))
          fail(at + ': ' + VILLAINS[piece.id].name + ' stands there and says nothing');
      // The last board: 無名 leads it and cannot be benched or replaced; every stone knows its whole
      // tree; 求敗 and the youth speak, and so does each master who stands there from the start.
      if (onLast) {
        if (s.mapIndex !== G.LAST_MAP || s.leader !== G.YOUTH_ID || r.next[0] !== G.YOUTH_ID) fail(at + ': 無名 does not lead the last board');
        if (R.toggleSeat(s, G.YOUTH_ID) || R.appointLeader(s, r.next[1])) fail(at + ': 無名 can be taken off the last board or out of its lead');
        for (const u of company)
          if (!HERO_PATHS[u.id].layout.flat().filter(Boolean).every((id) => u.learned.includes(id)))
            fail(at + ': ' + G.DETAILS[u.id].name + ' does not remember every art');
        for (const beat of MAZE_TALE.finale.before)
          if (!before.some((line) => line.text === beat.text)) fail(at + ': a line before the last board is missing');
        const masters = r.route.map((m) => G.castBoard(m).masters).length;
        const guests = G.enemies(s).filter((u) => u.guest);
        if (guests.length !== 4 || G.boardOf(s).waves.flatMap((w) => w.pieces).length !== 6 || masters !== 10) fail(at + ': the ten masters of the run are not all on the last board');
        const cast = [...G.boardOf(s).pieces, ...G.boardOf(s).waves.flatMap((w) => w.pieces)].slice(1).map((p) => p.id);
        if (cast.join() !== r.route.map((m) => G.castBoard(m).commander || G.refId(m, 'master')).join()) fail(at + ': the last board is not cast from the run\u2019s ten boards in the order met');
        for (const u of guests) if (!before.some((line) => line.person?.id === u.id)) fail(at + ': ' + G.unitDetails(u).name + ' stands there and says nothing');
      }
      const deja = before.filter((line) => HERO_VOICES[line.person?.id]?.echoes.includes(line.text));
      echoes += deja.length;
      if (deja.length > 1) fail(at + ': more than one deja vu line');
      if (deja.length && (run === 1 || !legacy.seen.includes(s.mapIndex) || !legacy.walked[deja[0].person.id]))
        fail(at + ': deja vu without having been here before');
      if (!R.turnPage(s, true) || !R.turnPage(s, true) || !R.deployLineup(s) || !R.beginBattle(s)) {
        fail(at + ': could not deploy');
        break;
      }
      const won = onLast ? lastWins : r.stage + 1 <= reach;
      s.result = won ? 'win' : 'loss';
      s.reason = won ? CHAMBER_TALES[s.mapIndex].victory : '';
      if (won && onLast) G.find(s, G.commanderId(s)).hp = 1;
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
      // (After the last board he says only which way the bet went: the ending is at hand.)
      if (won && r.last.optional && !(weiSays(SIDE_TALES[r.side.kind] || SIDE_TALES.done) && (onLast || weiSays(SIDE_PAY[r.last.side.reward]))))
        fail(at + ': 韋小寶 did not settle the bet ' + r.side.kind);
      if (won && !r.last.optional && !weiSays(SIDE_MISS)) fail(at + ': nothing said about the bet missed');
      // 求敗 speaks after every board: what he makes of a win, 請回吧 at the end of the run.
      const qiu = after.filter((line) => line.speaker === QIUBAI.name);
      if (!qiu.length) fail(at + ': 求敗 says nothing');
      // (The last board won ends on the ending film instead: he is gone, and sends no one home.)
      const ending = onLast && won,
        tenth = r.stage === R.TENTH;
      if (r.last.terminal && !ending && !qiu.at(-1).text.includes('請回吧')) fail(at + ': the run does not end with 請回吧');
      if (!!r.last.ended !== ending) fail(at + ': the ending ' + (ending ? 'did not follow' : 'followed') + ' the board');
      const said = (beat) => after.some((line) => line.text === beat.text.replaceAll('{name}', R.youthName(s)));
      // The last board: won, 求敗 lowers the twig; lost, something is still missing.
      if (onLast) for (const beat of won ? MAZE_TALE.finale.after : MAZE_TALE.finale.lost) if (!said(beat)) fail(at + ': a line after the last board is missing');
      // A run won ends on what 求敗 saw in this 境界.
      if (r.last.terminal && won && !onLast)
        for (const beat of MAZE_TALE.close[realm - 1])
          if (!said(beat)) fail(at + ': the close of 境界 ' + r.realm + ' is incomplete');
      // Ten boards won in 無劍境界: the run goes on. He says what he saw (in short, if the youth has
      // been brought this far before), sends no one home, and asks every stone to stay.
      if (won && tenth) {
        tenWon = true;
        sawFinale = !!r.last.finale;
        opened = r.last.opened || 0;
        if (r.last.terminal !== (realm < WAKES.length)) fail(at + ': the tenth board ' + (r.last.terminal ? 'ended' : 'did not end') + ' a run in 境界 ' + realm);
        if (!r.last.terminal) {
          for (const beat of [...(finaleBefore > 0 ? MAZE_TALE.finale.again : MAZE_TALE.close[realm - 1]), ...MAZE_TALE.finale.invite])
            if (!said(beat)) fail(at + ': 求敗\u2019s lines before the last board are incomplete');
          if (after.some((line) => line.text === MAZE_TALE.release.text || line.text.includes('請回吧'))) fail(at + ': the stones are sent home before the last board');
        }
      }
      if (won && !r.last.terminal && !tenth && !qiu.some((line) => line.text === MAZE_TALE.after[realm - 1][r.stage].text))
        fail(at + ': 求敗 has the wrong line for 境界 ' + realm + ' board ' + (r.stage + 1));
      if (won && !r.last.terminal && !tenth && !r.last.recruit && r.pool.length > 0)
        fail(at + ': a win brought no hero');
      if (r.last.terminal && won && !onLast)
        for (const u of G.party(s).filter((v) => HERO_VOICES[v.id]))
          if (!after.some((line) => line.text === HERO_VOICES[u.id].farewell))
            fail(at + ': ' + G.DETAILS[u.id].name + ' left without a farewell');
      if (onLast) won ? lastWon++ : lastLost++;
      R.turnPage(s, true);
      // The last board won has no shop after it: the run is over on the ending.
      if (ending && r.status !== 'ended') fail(at + ': the run did not end on the ending');
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
    // A run won marks its 境界 won; won in the highest open 境界, it opens the next; won in the
    // fifth, the last battle follows. A run lost changes none of it.
    // (A run is won when its ten boards are, whatever becomes of the last board after them.)
    const runWon = tenWon;
    const opens = runWon && realm === open && open < WAKES.length ? open + 1 : 0;
    if (R.openRealms(legacy) !== (opens || open)) fail(label + ': ' + R.openRealms(legacy) + ' 境界 open after a run in 境界 ' + realm + ' with ' + open + ' open');
    if (opened !== opens) fail(label + ': the ending says 境界 ' + opened + ' opened, not ' + opens);
    const clearedNow = runWon ? [...new Set([...clearedBefore, realm])].sort() : clearedBefore;
    if (legacy.cleared.join() !== clearedNow.join()) fail(label + ': 境界 won are ' + legacy.cleared + ', not ' + clearedNow);
    const finale = runWon && realm === WAKES.length;
    if (sawFinale !== finale || !!r.last.lastBoard !== finale || legacy.finale !== finaleBefore + (finale ? 1 : 0)) fail(label + ': the last board ' + (finale ? 'did not follow' : 'followed') + ' a run in 境界 ' + realm);
    if (finale) finales++;
    // The ending is counted when the last board is won, and only then.
    if (legacy.ended !== endedBefore + (finale && lastWins ? 1 : 0)) fail(label + ': the ending was counted ' + (legacy.ended - endedBefore) + ' times');
    for (const u of G.company(s)) if (!legacy.walked[u.id]) fail(label + ': ' + names([u.id]) + ' not recorded as having walked');
    if (!R.restoreRun(JSON.parse(JSON.stringify(s)))) fail(label + ': the finished run does not load');
  }
}

console.log(
  runs + ' runs · ' + scenes + ' scenes · ' + trios.size + ' different trios · ' +
    routes.size + ' board orders · ' + leaders.size + ' leaders · ' + echoes + ' deja vu lines · 境界 ' + [...realms].sort((a, b) => a - b).join(' ') +
    ' · ' + finales + ' last boards (' + lastWon + ' won, ' + lastLost + ' lost) · ' + plusRuns + ' runs with 無名 on the board'
);
if (!finales) fail('no run reached the last board');
if (!lastWon || !lastLost) fail('the last board was not both won and lost');
if (!plusRuns) fail('no run was played after the ending, with 無名 on the board');
if (problems.size) {
  console.error('\n' + problems.size + ' problem(s):\n  ' + [...problems].slice(0, 40).join('\n  '));
  process.exit(1);
}
console.log('OK');
