// Small pieces every page uses: escaping, links, pictures, the current address.
export const categories = {
  lore: ['世界觀設定', '念', '節'],
  run: ['單輪劇本', '局', '節'],
  story: ['局中紀事', '卷', '章'],
  heroes: ['群俠列傳', '俠', '人'],
  folk: ['江湖人物', '人', '人'],
  foes: ['群敵錄', '敵', '員'],
  skills: ['武學總譜', '武', '式'],
  items: ['百物譜', '物', '件'],
  missions: ['任務簿', '令', '項'],
  rules: ['戰鬥規則', '則', '條'],
  maps: ['十局輿圖', '圖', '圖'],
  text: ['遊戲原文', '文', '條']
};
export const $ = (id) => document.getElementById(id);
export const content = $('content');
export const esc = (v) =>
  String(v ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
export const href = (group, id = '', params = {}) => {
  const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null));
  return (
    '#' +
    encodeURIComponent(group) +
    (id ? '/' + encodeURIComponent(id) : '') +
    (q.size ? '?' + q : '')
  );
};
export const anchor = (to, label, cls = '') =>
  '<a class="' + cls + '" href="' + esc(to) + '">' + label + '</a>';
const safeDecode = (value) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};
export const route = () => {
  const [raw, q] = location.hash.slice(1).split(/\?(.*)/s),
    [g, id] = String(raw || 'home').split('/');
  return {
    group: safeDecode(g || 'home'),
    id: safeDecode(id || ''),
    p: new URLSearchParams(q || '')
  };
};
export const image = (src, cls = '', eager = false) =>
  src
    ? '<img src="' +
      esc(src) +
      '" alt="" class="' +
      cls +
      '" ' +
      (eager ? 'fetchpriority="high"' : 'loading="lazy"') +
      ' decoding="async">'
    : '';
export const goLink = ({ group, id, label }) => anchor(href(group, id), esc(label));
export const crumb = (g, n = '') =>
  '<nav class="crumb" aria-label="目前位置">' +
  anchor('#home', '總覽') +
  ' <span>／</span> ' +
  (n
    ? anchor(href(g), esc(categories[g][0])) + ' <span>／</span> ' + esc(n)
    : esc(categories[g]?.[0] || g)) +
  '</nav>';
export const srcText = (s) =>
  (s.file.startsWith('wiki/') ? '' : 'game/') + s.file + ':' + s.line + (s.endLine && s.endLine !== s.line ? '–' + s.endLine : '');
