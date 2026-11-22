// 群俠列傳: one page per playable hero: the ten the box holds, and 無名, who takes the field
// himself on the last board and in every run after the ending.
import * as G from '../game-data.js';
import { cite, cites } from '../sources.js';
import { rows, speech, links, link, cells, gameArt } from './parts.js';

// A hero painted in the roster pack wears that portrait (DETAILS[id].portraitFile), and 無名 the
// picture his lines have always worn; the first ten have a portraits-<name>.webp.
export const heroPortrait = (id) =>
  gameArt(G.DETAILS[id]?.portraitFile || 'portraits-' + G.portraits[id] + '.webp');

// What each level adds, read from the game's own growth tables (rules/game.js).
const named = (row, sign) =>
  [['攻擊', row[0]], ['防禦', row[1]], ['氣血', row[2]], ['內力', row[3]]]
    .filter(([, n]) => n)
    .map(([k, n]) => k + ' ' + (sign ? '＋' : '') + Math.abs(n))
    .join('、');
const gains = (row) => named(row, true);
function growthRows(id) {
  const pace = G.growthOf(id),
    common = G.LEVEL_GAINS;
  if (!pace)
    return rows('成長', [
      ['步調', '尋常'],
      ['二、三級', '每級 ' + gains(common.novice)],
      ['四級起', '每級 ' + gains(common.veteran)]
    ]);
  return rows('成長', [
    ['步調', pace.name + '：' + pace.desc],
    ['緣由', G.GROWTH_PROFILES[id].why],
    ['一級', '比尋常' + (pace.start.some((n) => n < 0) ? '少 ' : '多 ') + named(pace.start, false) + '（已算在初始屬性裡）'],
    ...pace.levels.map((row, i) => [G.NUMERALS[i + 1] + '級', gains(row)]),
    ['到十二級', '屬性與照尋常成長時相同；此後每級 ' + gains(common.veteran)]
  ]);
}

export function heroes() {
  return G.ROSTER.map((id) => {
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
          id === G.YOUTH_ID ? ['出處', '本作《' + G.BOOKS[id] + '》（暫名）；金庸原著沒有交代他的少年時代'] : ['原著', G.BOOKS[id]],
          ['門派', d.school],
          partner && ['合璧之人', G.DETAILS[partner].name + '：相鄰時，合璧之招倍率更高'],
          // 無名 is in no box: when he is a piece at all.
          id === G.YOUTH_ID && ['何時上盤', '終局：他是那一局的眼，同行俠客與他自己的九式全都在手。勝過終局之後：' + G.MAZE_TALE.finale.plus.text.replaceAll('{name}', d.name)]
        ]),
        rows('初始屬性', [
          ['氣血', unit.maxHp],
          ['內力', unit.maxMp],
          ['攻擊', unit.atk],
          ['防禦', unit.def],
          ['移動', cells(unit.step)],
          ['普攻射程', cells(unit.range)]
        ]),
        growthRows(id),
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
          // The ten from the roster pack arrive with an empty weapon slot; 狄雲 wears his coat.
          ...[unit.weapon, unit.gear].filter(Boolean).map((item) => link('items', item, G.ITEMS[item].name)),
          ...Object.entries(G.TALENTS).map(([key, t]) => link('skills', key, t.name))
        ]),
        partner && links('合璧', [link('heroes', partner, G.DETAILS[partner].name), link('rules', 'paired', G.RULE_TERMS.paired.name)]),
        speech(id === G.YOUTH_ID ? '九式從何而來' : '想起武學', path.recall || G.RECALL_NOTE),
        id === G.YOUTH_ID && links('相關', [link('folk', 'youth', '少年（執子之人）'), link('story', 'finale', '終局與放下'), link('rules', 'answer', G.RULE_TERMS.answer.name)])
      ].filter(Boolean),
      sources: cites(
        cite(d.name, 'src/data/new-heroes.js', 'src/rules/game.js'),
        cite(path.title, 'src/data/mastery-catalog.js'),
        cite(command.name, 'src/rules/battle-mastery.js')
      )
    };
  });
}
