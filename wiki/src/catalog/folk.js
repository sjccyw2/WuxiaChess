// 江湖人物: those who are never on the board (the youth, 求敗, the great bird and 韋小寶).
import * as G from '../game-data.js';
import { cite, cites } from '../sources.js';
import { rows, speech, links, link, gameArt } from './parts.js';
import { YOUTH_NAME, TITLES } from './story.js';

const said = (speaker, text, note) => ({ ...(note ? { note } : {}), speaker, text });

function youth() {
  const t = G.MAZE_TALE;
  return {
    id: 'youth',
    name: YOUTH_NAME,
    tag: G.YOUTH.role,
    summary: t.prologue.first[0].note,
    image: gameArt(G.YOUTH.portrait),
    sections: [
      rows('人物誌', [
        ['身分', '玩家所扮的角色。他是在睡夢裡闖進劍境的，不會武功。他不上盤，只落子。'],
        ['名字', '第一輪由玩家輸入，此後求敗一直記得。未輸入時叫「' + G.YOUTH.name + '」。']
      ]),
      speech('頭一句話', said(YOUTH_NAME, t.prologue.first[3].text)),
      speech('為何由他執子', said(YOUTH_NAME, t.command.text, t.command.note)),
      speech('棋臺沿上的局規', t.rule),
      speech('子還在手上', t.inHand),
      links('相關', [
        link('story', 'opening', TITLES.opening),
        link('story', 'world', TITLES.world),
        link('story', 'return', TITLES.return)
      ])
    ],
    sources: cites(cite(t.command.text, 'src/data/maze-tale.js'))
  };
}

function qiubai() {
  const t = G.MAZE_TALE,
    q = G.QIUBAI;
  return {
    id: 'qiu',
    name: q.name,
    tag: q.role,
    summary: t.prologue.first[1].note,
    image: gameArt(q.portrait),
    sections: [
      rows('人物誌', [
        ['身分', '設局的人。他坐在棋臺對面執黑，從第一幕便在場。'],
        ['所求', '武學的最終奧義。這盤棋他左手同右手下了幾百年。'],
        ['黑子', '他落子之時，將一道戰意按在黑子眉心，叫他們見人便打。']
      ]),
      speech('自稱', said(q.name, t.prologue.first[6].text), said(q.name, t.prologue.first[8].text)),
      speech('每一輪的最後', t.close[0].map((b) => said(q.name, b.text))),
      links('全部對白', [link('story', 'qiu', TITLES.qiu), link('story', 'opening', TITLES.opening), link('story', 'return', TITLES.return)])
    ],
    sources: cites(cite(q.name, 'src/data/maze-tale.js'))
  };
}

function eagle() {
  const t = G.MAZE_TALE;
  return {
    id: 'eagle',
    name: G.EAGLE.name,
    tag: G.EAGLE.role,
    summary: t.prologue.first[2].note,
    image: gameArt(G.EAGLE.portrait),
    sections: [
      rows('人物誌', [['身分', '蹲在棋臺旁的一頭大鵰。牠不說話，遊戲裡也不給牠別的名字。']]),
      speech('少年初見', t.prologue.first[2].note),
      speech('少年再來時', t.prologue.again.note),
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
      speech('把局規說穿', said(v.name, t.ruleTold)),
      speech('求敗瞧不見他', t.unseen.map((b) => said(G.QIUBAI.name, b.text, b.note))),
      speech('只有一句真話', t.close[4].filter((b) => b.who === 'wei').map((b) => said(v.name, b.text, '無劍境界收局，求敗終於瞧見他。'))),
      links('全部對白', [link('story', 'shop', TITLES.shop), link('story', 'opening', TITLES.opening)])
    ],
    sources: cites(cite(v.name, 'src/rules/ferry-market.js'))
  };
}

export function folk() {
  return [youth(), qiubai(), eagle(), shopkeeper()];
}
