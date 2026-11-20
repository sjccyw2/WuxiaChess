// 群敵錄: the two named opponents of each ferry stop, then the rank-and-file troop types.
import * as G from '../game-data.js';
import { cite, cites } from '../sources.js';
import { rows, links, link, gameArt } from './parts.js';

export const RANKS = ['守關人', '副將'];
export const stageName = (stage) => G.mapLayout(stage).name;
export const stageLinks = (stage) => [
  link('maps', stage, stageName(stage)),
  link('story', 'map-' + stage, stageName(stage) + '對白')
];
// Troop types: every unit description that is neither a hero nor a named opponent.
export const troopIds = () =>
  Object.keys(G.DETAILS).filter((id) => !G.PARTY.includes(id) && !G.DETAILS[id].rank);

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
    return {
      id,
      name: d.name,
      tag: '敵軍兵種',
      summary: d.school + ' · ' + d.role,
      image: gameArt(d.portraitFile),
      sections: [links('普攻', [link('skills', 'foe-' + id, d.basic)])],
      sources: cites(cite(d.name, 'src/rules/game.js'))
    };
  });
  return [...named, ...troops];
}
