import { btn, esc, titleHead, itemBonus } from './panels.js';
import { art } from './artwork.js';
import { icon } from './icons.js';
import { ITEMS } from '../rules/game.js';
import { TECHNIQUES } from '../data/martial-arts.js';
import { VISITOR, lotName, lotImage, GRADES, gradeOf, CHIP_PRICES, chipsOf, canLiftAgain, gambleOffer, canPeek, tokensOf, luckOf, LUCK_AT } from '../rules/ferry-market.js';
import { itemPicture } from './item-art.js';
const places = ['一', '二', '三'];
const picture = (file, cls = '') =>
  '<img class="' + cls + '" draggable="false" src="' + esc(art(file)) + '" alt="">';
// The shop's one row for the bowls: 「三盅通吃 · 免費揭一盅」 and the button that opens them; on a
// board with no table, the offer to open one for 籌碼 when the player has enough.
function visitorInvite(v, chips = 0, canOpen = false) {
  if (!v)
    return canOpen
      ? '<div class="lk-invite">' +
          picture(VISITOR.portrait) +
          '<p><strong>' +
          VISITOR.title +
          '</strong> · 這一局沒開盅 · 籌碼 ' +
          chips +
          '</p>' +
          btn('open-table', '開盅 · ' + CHIP_PRICES.open + ' 籌碼', 'mj-action') +
          '</div>'
      : '';
  return (
    '<div class="lk-invite">' +
    picture(VISITOR.portrait) +
    '<p><strong>' +
    VISITOR.title +
    '</strong> · ' +
    (v.phase === 'claimed' ? '已得' + (v.extra != null ? '兩物' : '一物') : v.paid ? '已付籌碼，揭一盅' : '免費揭一盅') +
    (chips ? ' · 籌碼 ' + chips : '') +
    '</p>' +
    btn(
      'meet-zhou',
      v.phase === 'claimed' ? '查看所得' : v.phase === 'hidden' ? '返回盅局' : '揭盅',
      'mj-action'
    ) +
    '</div>'
  );
}
// 連中: the gift 韋小寶 gave for three bets in a row, a row of the shop under the cups'.
function giftRow(gift) {
  if (!gift) return '';
  return (
    '<div class="lk-gift">' +
    (ITEMS[gift.id] ? itemPicture(gift.id) : picture(lotImage(gift.id))) +
    '<p><strong>連中彩頭</strong> · ' +
    esc(gift.name) +
    (gift.grade === 'secret' ? '（秘寶）' : '（珍品）') +
    '</p><small>' +
    esc(VISITOR.gift) +
    '</small></div>'
  );
}
// A face-up prize's grade, as a seal: 珍品 and 秘寶 only (常品 is what the shelf sells).
function gradeSeal(id) {
  const g = gradeOf(id);
  return g === 'common' ? '' : '<em class="lk-grade lk-grade-' + g + '">' + GRADES[g].name + '</em>';
}
function bowlsPage(s, mixing) {
  const r = s.run,
    v = r.last?.visit;
  if (!v) return '';
  const shown = v.phase === 'show',
    hidden = v.phase === 'hidden',
    done = v.phase === 'claimed',
    staking = v.phase === 'gamble',
    g = v.gamble,
    chips = chipsOf(r),
    again = canLiftAgain(s),
    offer = gambleOffer(s),
    peek = canPeek(s),
    won = (i) => done && !g && (i === v.pick || i === v.extra),
    chosen = done ? (g ? (g.won ? [g.up] : []) : [v.pick, v.extra].filter((i) => i != null).map((i) => v.cards[v.order[i]])) : [];
  const copy = shown
    ? v.lucky
      ? VISITOR.lucky
      : v.paid
        ? VISITOR.paid
        : VISITOR.reveal
    : hidden
      ? v.peek != null
        ? VISITOR.peek
        : VISITOR.blind
      : staking
        ? VISITOR.dare
        : g
          ? g.won
            ? VISITOR.gambleWon
            : VISITOR.gambleLost
          : v.extra != null
            ? VISITOR.again
            : VISITOR.win;
  // A face-up cup: what it holds (an item, a manual, or 見好就收's pebble), its grade and numbers.
  const face = (id, note = '') =>
    (id == null
      ? picture('lot-pebble.webp') + '<strong>一塊石頭</strong>'
      : (ITEMS[id] ? itemPicture(id) : picture(lotImage(id))) +
        gradeSeal(id) +
        '<strong>' +
        esc(note + lotName(id)) +
        '</strong>' +
        // What an item does, in numbers, as the shop's rows say it.
        (ITEMS[id] && ITEMS[id].kind !== 'token' ? '<b class="lk-bonus">' + esc(itemBonus(ITEMS[id])) + '</b>' : '') +
        '<small>' +
        esc(ITEMS[id]?.desc || (TECHNIQUES[id].secret ? '秘笈' : '武譜') + ' · 修習需 ' + TECHNIQUES[id].points + ' 武學點') +
        '</small>');
  const covered = (n) => picture('bowl-cover.webp') + '<strong>第' + n + '盅</strong>';
  const lot = (inner, cls = '') => '<div class="lk-lot ' + cls + '">' + inner + '</div>';
  const cards = places
    .map((n, i) => {
      const held = v.cards[v.order[i]];
      if (shown) return lot(face(v.cards[i]));
      // 見好就收: the prize staked, then the two cups (one the grade up, one a pebble).
      if (g) {
        if (i === v.pick) return lot(face(g.stake, '押上・'), 'lk-staked');
        if (staking) return btn('bowl-pick', covered(n), 'lk-lot lk-covered', 'data-id="' + i + '" aria-label="揭開第' + n + '盅"');
        return lot(face(i === g.at ? g.up : null), i === g.pick && g.won ? 'won' : i === g.pick ? 'lk-lost' : '');
      }
      if (won(i)) return lot(face(held), 'won');
      // 灌鉛骰子: the cup looked under shows what it holds, and can still be lifted.
      const seen = v.peek === i ? face(held, '看過・') : covered(n);
      if (done)
        return again
          ? btn(
              'bowl-pick',
              seen + '<small>花 ' + CHIP_PRICES.again + ' 籌碼再揭</small>',
              'lk-lot lk-covered lk-again',
              'data-id="' + i + '" aria-label="花 ' + CHIP_PRICES.again + ' 籌碼再揭第' + n + '盅"'
            )
          : lot(seen);
      // While the cups are shuffled each one goes to the middle, swirls there with the others and
      // comes back to its own place: the same path for all three, so none can be followed, and
      // nothing of which cup holds what (v.order) reaches the screen.
      const style = mixing ? 'style="--home:calc(' + (1 - i) + ' * (100% + var(--lot-gap)))"' : '';
      return btn(
        'bowl-pick',
        mixing ? covered(n) : seen,
        'lk-lot lk-covered' + (v.peek === i ? ' lk-peeked' : ''),
        'data-id="' + i + '" aria-label="揭開第' + n + '盅" ' + style + (mixing ? ' disabled' : '')
      );
    })
    .join('');
  const store = r.last.terminal ? '通吃坊替你寄存了' : '隊伍公庫已收下';
  const status = done
    ? g
      ? g.won
        ? store + esc(lotName(g.up)) + '。'
        : esc(lotName(g.stake)) + '歸了韋小寶。'
      : store +
        esc(chosen.map(lotName).join('與')) +
        '。' +
        (offer ? '見好就收；或押回' + esc(lotName(offer.stake)) + '，賭' + esc(lotName(offer.up)) + '，一半機會。' : '') +
        (again ? '再揭一盅需 ' + CHIP_PRICES.again + ' 籌碼（現有 ' + chips + '）。' : '')
    : staking
      ? esc(lotName(g.stake)) + '已押上。揭一盅：一盅是' + esc(lotName(g.up)) + '，一盅是石頭。'
      : shown
        ? '看清三樣東西後，扣盅換位。'
        : mixing
          ? '韋小寶正在換盅……'
          : '選擇一盅，揭開即領取。';
  // 莊家運: the tables in a row with no 秘寶 lifted, as tally sticks.
  const luck = luckOf(r),
    luckLine = v.lucky
      ? '<p class="lk-luck">莊家運到了：這一桌有一件秘寶。</p>'
      : luck
        ? '<p class="lk-luck">莊家運 ' + '|'.repeat(Math.min(luck, LUCK_AT)) + ' ' + Math.min(luck, LUCK_AT) + '／' + LUCK_AT + '：連 ' + LUCK_AT + ' 桌揭不出秘寶，下一桌必有一件。</p>'
        : '';
  // 灌鉛骰子: one button per cup, while the cups are down and none has been looked under.
  const peekRow =
    peek && !mixing
      ? '<div class="lk-peek">' +
        places.map((n, i) => btn('bowl-peek', '擲骰看第' + n + '盅', 'mj-action', 'data-id="' + i + '"')).join('') +
        '<small>灌鉛骰子 ' + tokensOf(r, 'loadedDice') + ' 枚</small></div>'
      : '';
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
    '</div>' +
    peekRow +
    '<p class="lk-status" role="status">' +
    status +
    '</p>' +
    luckLine +
    '<footer class="mj-footer">' +
    btn('back-shop', '返回通吃坊', 'mj-action') +
    (shown ? btn('bowl-shuffle', icon('spark', 16) + ' 扣盅換位', 'gold-btn') : '') +
    (offer ? btn('bowl-dare', '再賭一把', 'gold-btn') : '') +
    '</footer></section>'
  );
}

export { visitorInvite, giftRow, bowlsPage };
