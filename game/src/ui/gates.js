import * as G from '../rules/game.js';
import { btn, face, titleHead, bookCitation } from './panels.js';
import { icon } from './icons.js';
import { COMMANDS, commandDescription } from '../rules/battle-mastery.js';

function codexPage(id) {
  const h = G.DETAILS[id],
    u = G.startingHero(id);
  const list = G.PARTY.map((k) =>
    btn(
      'codex-pick',
      '<img src="' + face(k) + '" alt=""><span>' + G.DETAILS[k].name + '</span>',
      k === id ? 'picked' : '',
      'data-id="' + k + '" aria-pressed="' + (k === id) + '"'
    )
  ).join('');
  const stats = [
    ['氣血', u.hp],
    ['內力', u.mp],
    ['移動', u.step + ' 格'],
    ['絕技距離', G.rangeFor(u, true) + ' 格']
  ];
  return (
    titleHead(
      'book',
      '群俠列傳',
      '每一輪有三位俠客應帖。達成各局的支線並取勝，便有餘下的俠客應帖而來。每局至多五人上盤。'
    ) +
    '<div class="codex-nav">' +
    list +
    '</div><article class="codex-detail"><img src="' +
    face(id) +
    '" alt="' +
    h.name +
    '肖像"><div><span class="codex-book">' +
    bookCitation(G.BOOKS[id]) +
    '</span><h3>' +
    h.name +
    '</h3><div class="codex-school">' +
    h.school +
    '</div><p>' +
    h.bio +
    '</p><h4>' +
    icon(h.skillIcon, 15) +
    h.skill +
    '</h4><p>' +
    h.skillDesc +
    '</p><h4>' +
    icon('flag', 15) +
    '領隊・' +
    COMMANDS[id].name +
    '</h4><p>' +
    commandDescription(id) +
    '</p></div></article><div class="codex-stats">' +
    stats.map(([n, v]) => '<div><small>' + n + '</small><b>' + v + '</b></div>').join('') +
    '</div>'
  );
}
export { codexPage };
