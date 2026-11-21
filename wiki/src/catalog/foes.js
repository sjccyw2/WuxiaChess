// 群敵錄: the two named opponents of each ferry stop, the villains who join them, then the
// rank-and-file troop types.
import * as G from '../game-data.js';
import { cite, cites } from '../sources.js';
import { rows, links, link, gameArt } from './parts.js';
import { traitTerms, ruleLinks } from './terms.js';

export const RANKS = ['局主', '副手'];
// What a board's piece does, as its enemy page says it, at each stage the board can be met at:
// one line where the stages agree, a line per stage where its numbers grow.
export function behaviour(map, ref) {
  const stages = G.mapStages(map),
    pages = stages.map((stage) => G.pieceLines(map, typeof ref === 'number' ? G.SLOTS[ref] : ref, stage));
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
// Every piece a board fields beyond its fixed four, with the wave it comes in (if any).
export const extraPieces = (map) => [
  ...G.BATTLES[map].pieces.map((piece) => ({ piece, wave: null })),
  ...G.BATTLES[map].waves.flatMap((wave) => wave.pieces.map((piece) => ({ piece, wave })))
];
// The boards a troop type or villain stands on, with its first piece there.
export const boardsOf = (key) =>
  G.BATTLES.flatMap((_, map) => {
    const found = extraPieces(map).find(({ piece }) => piece.id.split('#')[0] === key);
    return found ? [{ map, ...found }] : [];
  });
// The wiki page of the enemy a DETAILS key describes.
export function foePage(key) {
  for (const stage of G.MAP_LAYOUTS.keys())
    for (const seat of [0, 1])
      if (G.refKey(stage, G.SLOTS[seat]) === key) return 'enc-' + stage + '-' + seat;
  if (G.VILLAINS[key]) return 'enc-' + key;
  return troopIds().includes(key) ? key : key.split('-')[0];
}
export const foeLink = (key) => link('foes', foePage(key), G.DETAILS[key].name);
// The named opponents of a board: its master and lieutenant, then any villain who joins them.
export const namedOn = (map) => [
  G.refKey(map, 'master'),
  G.refKey(map, 'lieutenant'),
  ...Object.keys(G.VILLAINS).filter((id) => G.VILLAINS[id].map === map)
];
export const villainRank = (id) => RANKS[G.VILLAINS[id].rank === 'boss' ? 0 : 1];
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
// A troop type's picture: its portrait.
export const troopArt = (id) => gameArt(G.DETAILS[id].portraitFile);

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
        ruleLinks(traitTerms(foe)),
        links('出現地點', stageLinks(stage))
      ].filter(Boolean),
      sources: cites(cite(foe.name, 'src/data/encounters.js'))
    }))
  );
  // The villains who join a board beside its fixed pair.
  const villains = Object.entries(G.VILLAINS).map(([id, foe]) => ({
    id: 'enc-' + id,
    name: foe.name,
    tag: villainRank(id),
    summary: foe.bio,
    image: gameArt(G.DETAILS[id].portraitFile),
    sections: [
      rows('人物誌', [
        ['門派', foe.school],
        ['原著', foe.book],
        ['身分', villainRank(id)],
        ['出現地點', stageName(foe.map)]
      ]),
      rows('行事', behaviour(foe.map, id)),
      links('招式', [
        link('skills', 'foe-' + id + '-basic', foe.basic),
        link('skills', 'foe-' + id, foe.skill)
      ]),
      ruleLinks(traitTerms(G.DETAILS[id])),
      links('出現地點', stageLinks(foe.map))
    ].filter(Boolean),
    sources: cites(cite(foe.name, 'src/data/encounters.js'))
  }));
  const troops = troopIds().map((id) => {
    const d = G.DETAILS[id];
    const [role, map] = id.split('-');
    const boards = boardsOf(id);
    // A board's own archer and scout are named after the board; the new troop types say where
    // they stand in the battles table.
    const acts = map != null ? behaviour(Number(map), role === 'bow' ? 2 : 3) : boards.length ? behaviour(boards[0].map, boards[0].piece.id) : [];
    const places = map != null ? [Number(map)] : boards.map((b) => b.map);
    return {
      id,
      name: d.name,
      tag: '敵軍兵種',
      summary: d.bio || d.school + ' · ' + d.role,
      image: gameArt(d.portraitFile),
      sections: [
        rows('人物誌', [['門派', d.school], ['身分', d.role], places.length && ['出現地點', places.map(stageName).join('、')]]),
        acts.length && rows('行事', acts),
        links('普攻', [link('skills', 'foe-' + id, d.basic)]),
        ruleLinks(traitTerms(d)),
        places.length && links('出現地點', places.flatMap(stageLinks))
      ].filter(Boolean),
      sources: cites(cite(d.name, troopSource(id)))
    };
  });
  return [...named, ...villains, ...troops];
}
