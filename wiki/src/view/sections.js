// Draws the parts of a catalog entry: fact tables, dialogue, link pills, the terrain
// board and the art tree. catalog/parts.js builds these shapes.
import { esc, goLink } from './html.js';

function board(m) {
  const allies = new Map(m.allies.map((p, i) => [p.x + ',' + p.y, i + 1])),
    enemies = new Map(m.enemies.map((p, i) => [p.x + ',' + p.y, i + 1])),
    entries = new Map((m.entries || []).map((p) => [p.x + ',' + p.y, p.place]));
  const cells = m.cells
    .map((c) => {
      const key = c.x + ',' + c.y,
        objective = m.objective?.x === c.x && m.objective?.y === c.y;
      const piece = allies.has(key)
        ? '我方陣位 ' + allies.get(key)
        : enemies.has(key)
          ? '敵方陣位 ' + enemies.get(key)
          : entries.has(key)
            ? '援軍入場格（' + entries.get(key) + '）'
            : '';
      const text =
        '第 ' +
        (c.x + 1) +
        ' 列、第 ' +
        (c.y + 1) +
        ' 行 · ' +
        m.legend[c.kind] +
        (piece ? ' · ' + piece : '') +
        (objective ? ' · 支線燈記' : '');
      return (
        '<button type="button" class="cell k-' +
        esc(c.kind) +
        '" style="grid-column:' +
        (c.x + 1) +
        ';grid-row:' +
        (c.y + 1) +
        '" title="' +
        esc(text) +
        '" aria-label="' +
        esc(text) +
        '" data-cell="' +
        esc(text) +
        '">' +
        (objective ? '燈' : allies.has(key) ? '俠' : enemies.has(key) ? '敵' : entries.has(key) ? '援' : '') +
        '</button>'
      );
    })
    .join('');
  return (
    '<div class="map-board" role="group" aria-label="可查詢地形的地圖" style="--w:' +
    m.width +
    ';--h:' +
    m.height +
    '">' +
    cells +
    '</div><div class="map-key">' +
    Object.entries(m.legend)
      .map(([k, v]) => '<span><i class="k-' + esc(k) + '"></i>' + esc(v) + '</span>')
      .join('') +
    '</div><div class="map-info" data-map-readout aria-live="polite">點選地格可查位置、地形與陣位。</div>'
  );
}
function section(s) {
  if (s.rows)
    return (
      '<dl class="fact">' +
      s.rows.map(([k, v]) => '<div><dt>' + esc(k) + '</dt><dd>' + esc(v) + '</dd></div>').join('') +
      '</dl>'
    );
  if (s.speeches)
    return s.speeches
      .map(
        (line) =>
          '<div class="line">' +
          (line.note ? '<p class="stage">' + esc(line.note) + '</p>' : '') +
          (line.speaker ? '<b>' + esc(line.speaker) + '</b>' : '') +
          (line.text ? '<p>' + esc(line.text) + '</p>' : '') +
          '</div>'
      )
      .join('');
  if (s.links) return '<div class="pills">' + s.links.map(goLink).join('') + '</div>';
  if (s.map) return board(s.map);
  if (s.tree)
    return (
      '<div class="tree">' +
      s.tree
        .map(
          (row, i) =>
            '<div class="tree-row" aria-label="第 ' +
            (i + 1) +
            ' 階">' +
            row.map((l) => '<div class="tree-cell">' + (l ? goLink(l) : '') + '</div>').join('') +
            '</div>'
        )
        .join('') +
      '</div>'
    );
  return '';
}
export function toggleSection(s, i, g) {
  const open = i === 0 || (g === 'maps' && s.map) || (g === 'skills' && i === 1);
  return (
    '<details' +
    (open ? ' open' : '') +
    '><summary>' +
    esc(s.title) +
    '</summary><div class="box-body">' +
    section(s) +
    '</div></details>'
  );
}
