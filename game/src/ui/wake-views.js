import { WORLD, WAKES } from '../data/wake-tale.js';
import { art } from './artwork.js';
import { titleHead, esc } from './panels.js';

// The stone beside the table: one line for each 境界 won, and what the youth has worked out.
// The lines are cut for the 境界 won, in order: as many as the 境界 won.
const linesCut = (profile) => Math.min(profile.cleared?.length ?? profile.wins ?? 0, WAKES.length);
const lineCount = (opened) => opened + '／5 行';
function journalLeaf(profile) {
  const opened = linesCut(profile);
  const holes = WAKES.map(
    (wake, i) =>
      '<li class="' +
      (i < opened ? 'known' : '') +
      '"><span>' +
      '一二三四五'[i] +
      '</span><strong>' +
      (i < opened ? esc(wake.mark) : '未刻') +
      '</strong></li>'
  ).join('');
  // How each line came to be there. Only lines already on the stone are told.
  const known = WAKES.slice(0, opened)
    .map(
      (w) => '<details><summary>' + esc(w.name) + '</summary><p>' + esc(w.carve) + '</p></details>'
    )
    .join('');
  return (
    '<div class="wake-leaf">' +
    '<img src="' +
    esc(art('stone-marks-' + opened + '.webp')) +
    '" alt="棋臺旁的石壁，' +
    (opened ? '上面刻著 ' + opened + ' 行字' : '上面甚麼也沒有') +
    '">' +
    '<ol aria-label="臺邊的五行字">' +
    holes +
    '</ol><p>' +
    esc(WORLD[5].text) +
    '</p>' +
    known +
    '<details><summary>少年在棋臺邊瞧明白的事</summary>' +
    WORLD.filter((v, i) => i !== 5)
      .map((v) => '<p><strong>' + esc(v.name) + '</strong>　' + esc(v.text) + '</p>')
      .join('') +
    '</details></div>'
  );
}
// The stone as a fold on another page (抓子, the run's last page).
function wakeJournal(profile) {
  return (
    '<details class="hud-disclosure wake-journal"><summary>臺邊的五行字<span>' +
    lineCount(linesCut(profile)) +
    '</span></summary>' +
    journalLeaf(profile) +
    '</details>'
  );
}

// 石刻, the stone's own page: its contents at once, the count beside the title.
function journalPage(s) {
  const profile = s.run.chronicle;
  return (
    titleHead('scroll', '臺邊的五行字<small class="wake-count">' + lineCount(linesCut(profile)) + '</small>') +
    '<div class="wake-journal">' +
    journalLeaf(profile) +
    '</div>'
  );
}

export { wakeJournal, journalPage };
