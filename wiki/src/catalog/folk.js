// 江湖人物: those who are never on the board (the youth, the great bird and 韋小寶), and
// the shadow waiting to be saved on each board.
import * as G from '../game-data.js';
import { cite, cites } from '../sources.js';
import { rows, speech, links, link, gameArt } from './parts.js';
import { stageLinks } from './foes.js';
import { missionLabel } from './missions.js';
import { YOUTH_NAME, TITLES } from './story.js';

const said = (speaker, text, note) => ({ ...(note ? { note } : {}), speaker, text });

function youth() {
  const t = G.MAZE_TALE;
  return {
    id: 'youth',
    name: YOUTH_NAME,
    tag: G.YOUTH.role,
    summary: t.prologue.scenes[2],
    image: gameArt(G.YOUTH.portrait),
    sections: [
      rows('人物誌', [
        ['身分', '玩家所扮的角色。他不上盤，只落子。'],
        ['名字', '第一輪由玩家輸入，此後每一輪都是同一個。未輸入時叫「' + G.YOUTH.name + '」。']
      ]),
      speech('為何由他執子', said(YOUTH_NAME, t.command.text, t.command.note)),
      speech('石上給他的一行字', t.prologue.board),
      links('相關', [
        link('story', 'opening', TITLES.opening),
        link('story', 'world', TITLES.world),
        link('story', 'return', TITLES.return)
      ])
    ],
    sources: cites(cite(t.command.text, 'src/data/maze-tale.js'))
  };
}

function eagle() {
  const t = G.MAZE_TALE;
  return {
    id: 'eagle',
    name: G.EAGLE.name,
    tag: G.EAGLE.role,
    summary: t.prologue.scenes[1],
    image: gameArt(G.EAGLE.portrait),
    sections: [
      rows('人物誌', [['身分', '守在石臺旁的一隻大鳥。牠不說話，遊戲裡也不給牠別的名字。']]),
      speech('少年睜眼所見', t.prologue.scenes[1]),
      speech('一輪落敗之後', t.loss),
      links('相關', [link('story', 'opening', TITLES.opening), link('story', 'return', TITLES.return)])
    ],
    sources: cites(cite(G.EAGLE.name, 'src/data/maze-tale.js'))
  };
}

function shopkeeper() {
  const v = G.VISITOR,
    t = G.MAZE_TALE;
  return {
    id: 'wei',
    name: v.name,
    tag: v.alias,
    summary: v.bio,
    image: gameArt(v.portrait),
    sections: [
      rows('人物誌', [
        ['原著', v.book],
        ['賭局', v.title]
      ]),
      speech('開張', said(v.name, t.opened.text, t.opened.note)),
      speech('貨架', G.MARKET_RULES),
      speech('賭局何時出現', v.rules),
      speech(
        '只有他記得',
        said(v.name, t.prologue.greeting.first, '第一輪，少年睜眼時。'),
        said(v.name, t.prologue.greeting.again, '第二輪起。'),
        said(v.name, t.prologue.reply.again, '少年又說出同一個名字。'),
        said(v.name, t.scatter.text, '這一輪落敗時。')
      ),
      links('全部對白', [link('story', 'shop', TITLES.shop), link('story', 'opening', TITLES.opening)])
    ],
    sources: cites(cite(v.name, 'src/rules/ferry-market.js'))
  };
}

function traveller([name, caption], stage) {
  const script = G.ENCOUNTER_SCRIPT[stage];
  return {
    id: 'tale-' + stage,
    name,
    tag: '局中影',
    summary: caption,
    image: gameArt('npc-tale-' + stage + '.webp'),
    sections: [
      speech(
        '兩種結局',
        { speaker: '救下', text: script.rescue },
        { speaker: '錯過', text: script.missed }
      ),
      rows('這一局', [['局主的執念', G.CHAMBER_TALES[stage].obsession]]),
      links('出現地點', [...stageLinks(stage), link('missions', 'map-' + stage, missionLabel(stage))])
    ],
    sources: cites(
      cite(name, 'src/ui/company-views.js'),
      cite(script.rescue, 'src/data/encounter-script.js')
    )
  };
}

export function folk() {
  return [youth(), eagle(), shopkeeper(), ...G.taleCaptions.map(traveller)];
}
