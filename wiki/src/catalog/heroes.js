// 群俠列傳: one page per playable hero.
import * as G from '../game-data.js';
import { cite, cites } from '../sources.js';
import { rows, speech, links, link, cells, gameArt } from './parts.js';

export const heroPortrait = (id) => gameArt('portraits-' + G.portraits[id] + '.webp');

export function heroes() {
  return G.PARTY.map((id) => {
    const d = G.DETAILS[id],
      unit = G.startingHero(id),
      path = G.HERO_PATHS[id],
      command = G.COMMANDS[id],
      partner = G.PARTNERS[id];
    return {
      id,
      name: d.name,
      tag: d.school,
      summary: d.bio,
      image: heroPortrait(id),
      sections: [
        rows('人物誌', [
          ['稱號', d.epithet],
          ['原著', G.BOOKS[id]],
          ['門派', d.school],
          partner && ['合璧之人', G.DETAILS[partner].name + '：相鄰時，合璧之招倍率更高']
        ]),
        rows('初始屬性', [
          ['氣血', unit.maxHp],
          ['內力', unit.maxMp],
          ['攻擊', unit.atk],
          ['防禦', unit.def],
          ['移動', cells(unit.step)],
          ['普攻射程', cells(unit.range)]
        ]),
        speech('領隊陣法 · ' + command.name, G.commandDescription(id)),
        speech(path.title, path.origin),
        {
          title: '專屬武學樹',
          tree: path.layout.map((tier) =>
            tier.map((art) => (art ? link('skills', art, G.TECHNIQUES[art].name) : null))
          )
        },
        links('入門與武器', [
          link('skills', 'basic-' + id, d.basic),
          link('skills', 'signature-' + id, d.skill),
          link('items', unit.weapon, G.ITEMS[unit.weapon].name),
          ...Object.entries(G.TALENTS).map(([key, t]) => link('skills', key, t.name))
        ]),
        partner && links('合璧', [link('heroes', partner, G.DETAILS[partner].name), link('rules', 'paired', G.RULE_TERMS.paired.name)]),
        speech('想起武學', G.RECALL_NOTE)
      ].filter(Boolean),
      sources: cites(
        cite(d.name, 'src/data/new-heroes.js', 'src/rules/game.js'),
        cite(path.title, 'src/data/mastery-catalog.js'),
        cite(command.name, 'src/rules/battle-mastery.js')
      )
    };
  });
}
