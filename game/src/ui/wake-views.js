import { WORLD, WAKES } from '../data/wake-tale.js';
import { art } from './artwork.js';
import { titleHead, esc } from './panels.js';

// The stone beside the table: one line for each 境 won, and what the youth has worked out.
function wakeJournal(profile, voyage, expanded = false) {
  // The lines are cut for the 境 won, in order: as many as the 境 won.
  const opened = Math.min(profile.cleared?.length ?? profile.wins ?? 0, WAKES.length);
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
    '<details class="hud-disclosure wake-journal"' +
    (expanded ? ' open' : '') +
    '><summary>臺邊的五行字<span>' +
    opened +
    '／5 行</span></summary><div class="wake-leaf">' +
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
    '</details></div></details>'
  );
}

function journalPage(s) {
  return titleHead('scroll', '臺邊的五行字') + wakeJournal(s.run.chronicle, s.run.voyage, true);
}

export { wakeJournal, journalPage };
