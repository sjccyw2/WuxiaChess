import { WORLD, WAKES, FATES, FATE_PROMPT } from '../data/wake-tale.js';
import { art } from './artwork.js';
import { titleHead, btn, esc } from './panels.js';

function wakeJournal(profile, voyage, expanded = false) {
  const returns = profile.returns ?? profile.wins ?? 0;
  const opened = Math.min(returns, WAKES.length);
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
  const history = (profile.fates || [])
    .map((id) => FATES.find((fate) => fate.id === id))
    .filter(Boolean);
  const outcomes = history
    .map(
      (f) => '<details><summary>' + esc(f.name) + '</summary><p>' + esc(f.ending) + '</p></details>'
    )
    .join('');
  // How each mark came to be there. Only marks already on the stone are told.
  const known = WAKES.slice(0, opened)
    .map(
      (w) => '<details><summary>' + esc(w.name) + '</summary><p>' + esc(w.carve) + '</p></details>'
    )
    .join('');
  return (
    '<details class="hud-disclosure wake-journal"' +
    (expanded ? ' open' : '') +
    '><summary>石上的痕<span>' +
    opened +
    '／5 道</span></summary><div class="wake-leaf">' +
    '<img src="' +
    esc(art('stone-marks-' + opened + '.webp')) +
    '" alt="石臺旁的石壁，' +
    (opened ? '上面留著少年刻下的 ' + opened + ' 道記號' : '上面甚麼也沒有') +
    '">' +
    '<ol aria-label="石上的痕">' +
    holes +
    '</ol><p>' +
    esc(WORLD[5].text) +
    '</p>' +
    known +
    outcomes +
    '<details><summary>帖上與石上讀到的事</summary>' +
    WORLD.filter((v, i) => i !== 5)
      .map((v) => '<p><strong>' + esc(v.name) + '</strong>　' + esc(v.text) + '</p>')
      .join('') +
    '</details></div></details>'
  );
}

function journalPage(s) {
  return titleHead('scroll', '石上的痕') + wakeJournal(s.run.chronicle, s.run.voyage, true);
}

function fatePage(s) {
  const r = s.run;
  if (!r.last?.won || r.voyage < 5) return '';
  const chosen = FATES.find((f) => f.id === r.last.fate);
  if (chosen)
    return (
      '<section class="wake-choice"><h3>' +
      esc(chosen.name) +
      '</h3><p>' +
      esc(chosen.ending) +
      '</p></section>'
    );
  return (
    '<section class="wake-choice"><h3>' +
    esc(FATE_PROMPT) +
    '</h3><div>' +
    FATES.map((f) =>
      btn(
        'choose-fate',
        '<strong>' + esc(f.name) + '</strong><span>' + esc(f.desc) + '</span>',
        'outline-btn',
        'data-id="' + f.id + '"'
      )
    ).join('') +
    '</div></section>'
  );
}

export { wakeJournal, journalPage, fatePage };
