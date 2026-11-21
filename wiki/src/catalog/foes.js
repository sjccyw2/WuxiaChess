// 群敵錄: the two named opponents of each ferry stop, then the rank-and-file troop types.
import * as G from '../game-data.js';
import { cite, cites } from '../sources.js';
import { rows, links, link, gameArt } from './parts.js';

export const RANKS = ['局主', '副手'];
// What a board's piece does, as its enemy page says it, at each stage the board can be met at:
// one line where the stages agree, a line per stage where its numbers grow.
export function behaviour(map, seat) {
  const stages = G.mapStages(map),
    pages = stages.map((stage) => G.boardLines(map, seat, stage));
  const lines = [];
  for (const [i, line] of pages[0].entries()) {
    const all = pages.map((p) => p[i]);
    if (all.every((l) => l === line)) lines.push(line);
    else lines.push(...all.map((l, j) => '第' + G.NUMERALS[stages[j]] + '局：' + l));
  }
  return lines.map((line) => {
    const [, label, text] = line.match(/^【(.+?)】(.*)$/) || [null, '', line];
    return [label || '絕技', text];
  });
}
// The rank-and-file entries a board gives its own names to (bow-1 … scout-9); board 0's two
// keep the shared 青城 pieces' text and are not listed twice.
const ownTroop = (id) => /^(bow|scout)-\d$/.test(id) && G.DETAILS[id].name !== G.DETAILS[id.split('-')[0]]?.name;
export const stageName = (stage) => G.mapLayout(stage).name;
export const stageLinks = (stage) => [
  link('maps', stage, stageName(stage)),
  link('story', 'map-' + stage, stageName(stage) + '對白')
];
// Troop types: every unit description that is neither a hero nor a named opponent.
export const troopIds = () =>
  Object.keys(G.DETAILS).filter(
    (id) => !G.PARTY.includes(id) && !G.DETAILS[id].rank && (!id.includes('-') || ownTroop(id))
  );
// Where a troop entry is written: a board's own pieces in its RANKS, the shared ones in game.js.
export const troopSource = (id) =>
  id.includes('-') || G.TROOPS[id] ? 'src/data/encounters.js' : 'src/rules/game.js';
// A troop type's picture. The new troop types' portraits (foe-<id>.webp) are not in game/assets
// yet; until they are, their pages go without one.
export const troopArt = (id) => (G.TROOPS[id] ? null : gameArt(G.DETAILS[id].portraitFile));

export function foes() {
  const named = G.ENCOUNTERS.flatMap((pair, stage) =>
    pair.map((foe, seat) => ({
      id: 'enc-' + stage + '-' + seat,
      name: foe.name,
      tag: RANKS[seat],
      summary: foe.bio,
      image: gameArt((seat ? 'lieutenant-' : 'captain-') + stage + '.webp'),
      sections: [
        rows('人物誌', [
          ['門派', foe.school],
          ['原著', foe.book],
          ['身分', RANKS[seat]]
        ]),
        rows('行事', behaviour(stage, seat)),
        links('招式', [
          link('skills', 'foe-' + stage + '-' + seat + '-basic', foe.basic),
          link('skills', 'foe-' + stage + '-' + seat, foe.skill)
        ]),
        links('出現地點', stageLinks(stage))
      ],
      sources: cites(cite(foe.name, 'src/data/encounters.js'))
    }))
  );
  const troops = troopIds().map((id) => {
    const d = G.DETAILS[id];
    const [role, map] = id.split('-');
    const acts = map != null ? behaviour(Number(map), role === 'bow' ? 2 : 3) : [];
    return {
      id,
      name: d.name,
      tag: '敵軍兵種',
      summary: d.bio || d.school + ' · ' + d.role,
      image: troopArt(id),
      sections: [
        rows('人物誌', [['門派', d.school], ['身分', d.role], map != null && ['出現地點', stageName(Number(map))]]),
        acts.length && rows('行事', acts),
        links('普攻', [link('skills', 'foe-' + id, d.basic)])
      ].filter(Boolean),
      sources: cites(cite(d.name, troopSource(id)))
    };
  });
  return [...named, ...troops];
}
