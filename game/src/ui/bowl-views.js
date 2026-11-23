import { btn, esc, titleHead } from './panels.js';
import { art } from './artwork.js';
import { icon } from './icons.js';
import { ITEMS } from '../rules/game.js';
import { TECHNIQUES } from '../data/martial-arts.js';
import { VISITOR, lotName, lotImage } from '../rules/ferry-market.js';
import { itemPicture } from './item-art.js';
const places = ['一', '二', '三'];
const picture = (file, cls = '') =>
  '<img class="' + cls + '" draggable="false" src="' + esc(art(file)) + '" alt="">';
function visitorInvite(v) {
  if (!v) return '';
  return (
    '<div class="lk-invite">' +
    picture(VISITOR.portrait) +
    '<div><small>通吃坊開局</small><h3>' +
    VISITOR.title +
    '</h3><span>' +
    VISITOR.name +
    ' · ' +
    (v.phase === 'claimed' ? '已得一物' : '免費揭一盅') +
    '</span></div>' +
    btn(
      'meet-zhou',
      v.phase === 'claimed' ? '查看所得' : v.phase === 'hidden' ? '返回盅局' : '同他賭一手',
      'mj-action'
    ) +
    '</div>'
  );
}
function bowlsPage(s, mixing) {
  const v = s.run.last?.visit;
  if (!v) return '';
  const shown = v.phase === 'show',
    done = v.phase === 'claimed',
    chosen = done ? v.cards[v.order[v.pick]] : null;
  const copy = shown ? VISITOR.reveal : done ? VISITOR.win : VISITOR.blind;
  const cards = places
    .map((n, i) => {
      const face = shown || (done && i === v.pick);
      const id = shown ? v.cards[i] : face ? chosen : null;
      const label = face ? lotName(id) : '第' + n + '盅';
      // The cup that was won plays its item's loop.
      const content =
        (face && ITEMS[id] ? itemPicture(id) : picture(face ? lotImage(id) : 'bowl-cover.webp')) +
        '<strong>' +
        esc(label) +
        '</strong>' +
        (face
          ? '<small>' +
            esc(ITEMS[id]?.desc || '武譜 · 修習需 ' + TECHNIQUES[id].points + ' 武學點') +
            '</small>'
          : '');
      if (shown || done)
        return '<div class="lk-lot ' + (done && face ? 'won' : '') + '">' + content + '</div>';
      const from = v.order[i] - i,
        mid = ((v.order[i] + 1) % 3) - i,
        cross = ((v.order[i] + 2) % 3) - i;
      const offset = (d) => 'calc(' + d + ' * (100% + var(--lot-gap)))';
      const style = mixing
        ? 'style="--from:' +
          offset(from) +
          ';--mid:' +
          offset(mid) +
          ';--cross:' +
          offset(cross) +
          '"'
        : '';
      return btn(
        'bowl-pick',
        content,
        'lk-lot lk-covered',
        'data-id="' + i + '" aria-label="揭開第' + n + '盅" ' + style + (mixing ? ' disabled' : '')
      );
    })
    .join('');
  return (
    '<section class="mj-view lk-table">' +
    titleHead('spark', VISITOR.title) +
    '<div class="lk-guest">' +
    picture(VISITOR.portrait) +
    '<div><small>' +
    VISITOR.alias +
    '</small><h3>' +
    VISITOR.name +
    '</h3><blockquote>' +
    esc(copy) +
    '</blockquote></div></div>' +
    (shown
      ? '<details class="fo-lore"><summary>這些東西的來歷</summary><p>' +
        esc(VISITOR.arrival) +
        '</p></details>'
      : '') +
    '<div class="lk-lots' +
    (mixing ? ' mixing' : '') +
    '">' +
    cards +
    '</div><p class="lk-status" role="status">' +
    (done
      ? (s.run.last.terminal ? '通吃坊替你寄存了' : '隊伍公庫已收下') + esc(lotName(chosen)) + '。'
      : shown
        ? '看清三樣東西後，扣盅換位。'
        : mixing
          ? '韋小寶正在換盅……'
          : '選擇一盅，揭開即領取。') +
    '</p><footer class="mj-footer">' +
    btn('back-shop', '返回通吃坊', 'mj-action') +
    (shown ? btn('bowl-shuffle', icon('spark', 16) + ' 扣盅換位', 'gold-btn') : '') +
    '</footer></section>'
  );
}

export { visitorInvite, bowlsPage };
