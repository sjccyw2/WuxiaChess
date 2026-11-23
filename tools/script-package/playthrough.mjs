// A sample playthrough for the script package: three runs played by the game's own rules
// (journey.js startRun, dialogue, settle, advance), printed scene by scene as a player meets them,
// with each line's id from the package. The scenes are assembled at run time from three layers
// (spine, boards, heroes), so this is the only place an editor can read how one line follows
// another.
//
// Ids are cited as ［S012］, not 〔S012〕, so that `--apply` never reads this file as an edit.
const root = new URL('../../game/src/', import.meta.url);
const load = (file) => import(new URL(file, root));

export async function playthrough(manifest) {
  const R = await load('rules/journey.js');
  const G = await load('rules/game.js');
  const { MAZE_TALE, CHAMBER_TALES } = await load('data/maze-tale.js');
  const { WAKES, NO_MARK } = await load('data/wake-tale.js');

  // Which ids a shown line is made of: the whole line if one entry matches it, else the entries
  // it is joined from (a narration line is sometimes two put together).
  const pattern = (text) => text.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\\?\{\w+\\?\}/g, '.+?');
  const entries = manifest
    .map((e) => ({ ...e, whole: new RegExp('^' + pattern(e.text) + '$'), part: new RegExp(pattern(e.text)) }))
    .sort((a, b) => b.text.length - a.text.length);
  const ids = (text) => {
    if (!text) return '';
    const whole = entries.find((e) => e.whole.test(text));
    if (whole) return '［' + whole.id + '］';
    let rest = text;
    const found = [];
    for (const e of entries)
      if (e.text.length >= 4 && e.part.test(rest)) {
        found.push([rest.search(e.part), e.id]);
        rest = rest.replace(e.part, (m) => '\u0000'.repeat(m.length));
      }
    return found.length ? found.sort((a, b) => a[0] - b[0]).map(([, id]) => '［' + id + '］').join('') : '［—］';
  };
  const out = [];
  const say = (speaker, text, note) => {
    if (note) out.push('> ' + ids(note) + note, '');
    if (text) out.push('**' + speaker + '**：' + ids(text) + text);
    out.push('');
  };
  const page = (text) => text && out.push('> ' + ids(text) + text, '');
  const scene = (s, which, title) => {
    out.push('#### ' + title, '');
    for (const line of R.dialogue(s, which)) say(line.speaker, line.text, line.note);
  };

  // One run. `reach` boards are won, then one is lost; 10 or more wins the run (in the fifth
  // 境界 it goes on to the last board, `lastWins` deciding it).
  function play(legacy, { seed, realm, reach = 10, lastWins = true, print = true, title }) {
    const draw = { ...R.drawLots(seed), realm };
    draw.leaderId = draw.ids[0];
    const s = R.startRun(draw, legacy),
      r = s.run;
    const quiet = out.length;
    const names = (list) => list.map((id) => G.DETAILS[id].name).join('、');
    out.push('## ' + title, '', '> 抓出的五人：' + names(draw.ids) + '；留下：' + names(G.party(s).map((u) => u.id)) + '（領隊：' + G.DETAILS[s.leader].name + '）。境界：' + WAKES[r.realm - 1].sword + '。這一輪的十局：' + r.route.map((m) => CHAMBER_TALES[m].name).join('、') + '。', '');
    out.push('### 入夢', '');
    const pro = MAZE_TALE.prologue;
    if (r.voyage === 1) for (const step of pro.first) say(step.who === 'qiu' ? '求敗' : '無名', step.text, step.note);
    else {
      page(pro.again.note);
      say('求敗', pro.again.greeting[r.realm - 1].replaceAll('{name}', R.youthName(s)));
      say('無名', pro.again.youth);
      say('求敗', pro.again.reply);
    }
    page(MAZE_TALE.draw);
    for (;;) {
      const onLast = r.stage === R.LAST_STAGE;
      out.push('### ' + (onLast ? '終局' : '第' + G.NUMERALS[r.stage] + '局') + '　' + CHAMBER_TALES[s.mapIndex].name, '');
      out.push('（戰場紀錄）' + ids(CHAMBER_TALES[s.mapIndex].arrival) + CHAMBER_TALES[s.mapIndex].arrival, '');
      scene(s, 'before', '開打之前');
      R.turnPage(s, true);
      R.turnPage(s, true);
      R.deployLineup(s);
      R.beginBattle(s);
      const won = onLast ? lastWins : r.stage < reach;
      s.result = won ? 'win' : 'loss';
      s.reason = won ? CHAMBER_TALES[s.mapIndex].victory : '';
      if (won && onLast) G.find(s, G.commanderId(s)).hp = 1;
      s.round = 9;
      R.settle(s);
      out.push('（' + (won ? '勝' : '敗') + '）' + (won ? ids(s.reason) + s.reason : ''), '');
      scene(s, 'after', won ? '勝後' : '敗後');
      R.turnPage(s, true);
      if (r.last.terminal) {
        out.push('### 一輪最後一頁', '');
        if (r.last.ended) for (const step of MAZE_TALE.finale.ending) say('求敗', step.text, step.note);
        else if (won) {
          page(MAZE_TALE.win);
          page(WAKES[r.realm - 1].carve);
        } else {
          page(MAZE_TALE.loss);
          page(NO_MARK);
        }
        if (!r.last.ended) page(R.closingFor(r.realm, won));
        break;
      }
      if (!R.advance(s)) throw new Error('could not advance the sample run');
    }
    if (!print) out.length = quiet;
    return r.chronicle;
  }

  out.push(
    '# 試玩劇本（sample playthrough, for reading only）',
    '',
    'Three runs played by the game itself, printed as a player meets them. Every scene here is put together at run time from the three script files, so this is where to judge whether one line follows from the last. **Do not edit this file**: make your changes in `10`–`12`, using the id after each line (［S012］ is 〔S012〕 there). ［—］ marks text that is not in the package (names, or text the game builds).',
    '',
    'Battles are skipped: each board is simply won or lost, and the side bet goes whichever way the skipped battle leaves it. 韋小寶’s other side-bet lines, the lines heard only during a battle (「嗒」, villains stepping on, objects, 變招), and the lines of heroes not drawn here are in `10`–`12`. `>` marks narration.',
    ''
  );
  let legacy = R.LEGACY;
  legacy = play(legacy, { seed: 20261123, realm: 1, title: '第一輪：利劍境界，十局皆勝' });
  legacy = play(legacy, { seed: 7, realm: 2, reach: 3, title: '第二輪：軟劍境界，第四局落敗' });
  // Played but not printed: the second, third and fourth 境界 won, to open the fifth.
  for (const [realm, seed] of [[2, 11], [3, 12], [4, 13]]) legacy = play(legacy, { seed, realm, print: false, title: '' });
  play(legacy, { seed: 99, realm: 5, title: '第六輪：無劍境界，十局皆勝，直到終局與結局' });
  return out.join('\n');
}
