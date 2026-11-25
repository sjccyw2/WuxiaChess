// The plan of a board as the briefing and the 整備 起陣圖 draw it: the terrain, the five ally
// posts with their numerals, the enemy pieces where they start (局主, 副手, the rest), the board's
// objects in their own pictures (守 ours, 破 to break), and the secondary's lamp or line.
// Reinforcements are not on it: they come as a surprise.
// Read from the board's data, so it needs no fight: the shop's look at the next board uses it too.
import * as G from '../rules/game.js';
import { mapLayout } from '../data/terrain.js';
import { art } from './artwork.js';

const POSTS = ['一', '二', '三', '四', '五'];
const keyOf = (id) => id.split('#')[0];
const place = (x, y) => 'grid-column:' + (x + 1) + ';grid-row:' + (y + 1);

// What stands where before round one. `s` is a run on this board (its drawn secondary, a
// legacy board's four), or null for a board seen ahead of time.
// `route`: the run's boards, so the last board seen ahead names the masters that run will bring.
function boardPlan(map, s = null, route = null) {
  const layout = mapLayout(map),
    board = s ? G.boardOf(s) : G.castBoard(map, route || undefined),
    keys = G.encounterKeys(map);
  const piece = (key, x, y) => {
    const rank = G.DETAILS[key]?.rank,
      stages = G.DETAILS[key]?.traits?.stages;
    // 求敗 (五劍) is his own mark, not one more 局主: in the colour of the bar he is on in the fight,
    // of his first before it.
    if (stages) {
      const u = s && G.find(s, key);
      return { x, y, name: G.DETAILS[key].name, rank: 'staged', colour: (u && G.stageOf(u)?.colour) || stages[0].colour };
    }
    return { x, y, name: G.DETAILS[key]?.name || '', rank: rank === 'boss' ? 'boss' : rank ? 'mini' : 'troop' };
  };
  const foes = [
    ...layout.enemies.slice(0, 4).map((p, i) => piece(keys[i], p.x, p.y)),
    ...board.pieces.map((p) => piece(keyOf(p.id), p.at[0], p.at[1]))
  ];
  const side = s?.run?.side;
  // A save from before its board had objects plays without them (G.boardKind), and shows none.
  const objects = s && !G.props(s).length ? [] : (board.objects || []).map((o) => {
    const d = G.DETAILS[keyOf(o.id)],
      u = s && G.find(s, o.id);
    const broken = !!u && !G.living(u);
    return { x: o.at[0], y: o.at[1], name: d.name, kind: d.kind, art: art('object-' + d.art + (broken ? '-broken' : '') + '.webp'), broken };
  });
  return {
    layout,
    foes,
    objects,
    lamp: s && side?.kind === 'lamp' ? G.objectiveTile(s) : null,
    zone: s && side?.kind === 'holdLine' ? side.zone : null
  };
}

// The plan as a grid. `posts(i, x, y)` draws post i (a 整備 button, or a plain numeral);
// `chief` is the post index of the leader.
function planGrid(plan, posts) {
  const { layout, zone } = plan;
  const cells = layout.cells
    .map(
      ({ x, y, kind }) =>
        '<i class="ft-' + kind + (zone && G.inZone(zone, { x, y }) ? ' plan-zone' : '') + '" style="' + place(x, y) + '"></i>'
    )
    .join('');
  const foes = plan.foes
    .map((f) =>
      f.rank === 'staged'
        ? '<b class="plan-foe staged" title="' + f.name + '" style="' + place(f.x, f.y) + ';--stage:' + f.colour + '">' + f.name[0] + '</b>'
        : '<b class="plan-foe ' + f.rank + '" title="' + f.name + '" style="' + place(f.x, f.y) + '"></b>'
    )
    .join('');
  const objects = (plan.objects || [])
    .map(
      (o) =>
        '<img class="plan-object ' + o.kind + (o.broken ? ' broken' : '') + '" src="' + o.art + '" alt="' + o.name + '" title="' + o.name + '" style="' + place(o.x, o.y) + '">'
    )
    .join('');
  const lamp = plan.lamp
    ? '<span class="wake-map-lamp" role="img" aria-label="支線燈記" style="' + place(plan.lamp.x, plan.lamp.y) + '">✦</span>'
    : '';
  return (
    '<div class="fo-map-grid plan-grid" style="--map-w:' +
    layout.width +
    ';--map-h:' +
    layout.height +
    '">' +
    cells +
    foes +
    objects +
    lamp +
    layout.allies.map(({ x, y }, i) => posts(i, x, y, place(x, y))).join('') +
    '</div>'
  );
}

// The key under a plan: only what this plan shows.
function planKey(plan) {
  const has = (rank) => plan.foes.some((f) => f.rank === rank);
  const staged = plan.foes.find((f) => f.rank === 'staged');
  return (
    '<p class="plan-key"><span><i class="plan-post-key"></i>起陣格</span>' +
    (staged ? '<span><b class="plan-foe staged" style="--stage:' + staged.colour + '"></b>' + staged.name + '</span>' : '') +
    (has('boss') ? '<span><b class="plan-foe boss"></b>局主</span>' : '') +
    (has('mini') ? '<span><b class="plan-foe mini"></b>副手</span>' : '') +
    (has('troop') ? '<span><b class="plan-foe troop"></b>敵方</span>' : '') +
    (plan.objects || [])
      .filter((o, i, all) => all.findIndex((x) => x.name === o.name) === i)
      .map((o) => '<span><img class="plan-object-key ' + o.kind + '" src="' + o.art + '" alt="">' + o.name + (o.kind === 'keep' ? '（守）' : '（破）') + '</span>')
      .join('') +
    (plan.lamp ? '<span><i class="wake-map-lamp">✦</i>支線燈記</span>' : '') +
    (plan.zone ? '<span><i class="plan-zone-key"></i>支線界線</span>' : '') +
    '</p>'
  );
}

export { POSTS, boardPlan, planGrid, planKey };
