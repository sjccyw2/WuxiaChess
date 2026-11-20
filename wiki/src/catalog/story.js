// 局中紀事: every scripted scene, read from the game's own story tables.
// The wiki only supplies page titles and section headings.
import * as G from '../game-data.js';
import { cite, cites } from '../sources.js';
import { rows, speech, links, link, gameArt, wikiArt } from './parts.js';
import { heroPortrait } from './heroes.js';
import { stageName, stageLinks } from './foes.js';
import { missionLabel } from './missions.js';

export const YOUTH_NAME = '少年';
export const TITLES = {
  opening: '睜眼',
  shop: '通吃坊與三盅通吃',
  voices: '十位俠客自己的話',
  return: '階盡與眼破',
  archive: '霧鎖青竹渡',
  world: '帖上與石上讀到的事'
};
const LAST = G.MAP_LAYOUTS.length - 1;
const said = (speaker, text, note) => ({ ...(note ? { note } : {}), ...(speaker ? { speaker } : {}), text });

// Who a line of a board's script belongs to.
function speakerOf(who, stage) {
  const [boss, second] = G.ENCOUNTERS[stage];
  return { youth: YOUTH_NAME, boss: boss.name, mini: second.name, leader: '當局領隊', ally: '當局同行俠客' }[who];
}
const beats = (list, stage) => list.map((b) => said(speakerOf(b.who, stage), b.text, b.note));

// The prologue, the invitation and the first board's opening: the same every run.
function opening() {
  const t = G.MAZE_TALE,
    p = t.prologue,
    wei = G.WEI.name;
  return {
    id: 'opening',
    name: TITLES.opening,
    tag: '序幕',
    summary: p.scenes[2],
    image: gameArt(G.YOUTH.portrait),
    sections: [
      speech(
        '少年睜開眼',
        p.scenes,
        said(wei, p.greeting.first, '第一輪'),
        said(wei, p.greeting.again, '第二輪起'),
        said('', p.naming),
        said(YOUTH_NAME, '我叫〔玩家輸入的名字〕。', p.named),
        said(wei, p.reply.first, '第一輪'),
        said(wei, p.reply.again, '第二輪起'),
        p.board,
        p.stones
      ),
      speech('英雄帖', t.draw, '「' + t.letter + '」'),
      speech('第一局之前', said(YOUTH_NAME, t.command.text, t.command.note), t.deploy),
      links('接下來', [
        link('story', 'voices', TITLES.voices),
        link('story', 'wake-1', G.WAKES[0].name),
        link('folk', 'wei', wei)
      ])
    ],
    sources: cites(cite(p.scenes[0], 'src/data/maze-tale.js'))
  };
}

function shop() {
  const t = G.MAZE_TALE,
    v = G.VISITOR;
  return {
    id: 'shop',
    name: TITLES.shop,
    tag: '局與局之間',
    summary: v.arrival,
    image: gameArt(v.portrait),
    sections: [
      speech('開張（第一局勝後）', said(v.name, t.opened.text, t.opened.note), t.shop),
      speech(v.title, v.arrival, said(v.name, v.reveal), said(v.name, v.blind), said(v.name, v.win)),
      speech('落敗時', said(v.name, t.scatter.text, t.scatter.note)),
      links('人物', [link('folk', 'wei', v.name)])
    ],
    sources: cites(cite(v.name, 'src/rules/ferry-market.js'), cite(t.shop, 'src/data/maze-tale.js'))
  };
}

// Lines that belong to a hero rather than to a board, so they hold whoever is drawn.
function voices() {
  return {
    id: 'voices',
    name: TITLES.voices,
    tag: '不隨局、不隨次序',
    summary: '俠客是隨機應帖的，局的次序也會變。這些話跟著人走：入境的第一句、聽見由少年執子時的回答、似曾相識、夜話，與臨別。',
    image: heroPortrait(G.PARTY[0]),
    sections: [
      ...G.PARTY.map((id) => {
        const v = G.HERO_VOICES[id],
          name = G.DETAILS[id].name;
        return speech(
          name,
          said(name, v.arrival.text, '入境。' + v.arrival.note),
          said(name, v.obey, '作領隊時，聽見由少年執子。'),
          v.echoes.map((line) => said(name, line, '似曾相識。只在第二輪起、到過的局裡出現。')),
          said(name, v.night[0], '夜話，第一、二輪。'),
          said(name, v.night[1], '夜話，第三輪起。'),
          said(name, v.farewell, '走完十局，臨別。')
        );
      }),
      links('相關', [link('story', 'opening', TITLES.opening), link('story', 'return', TITLES.return)])
    ],
    sources: cites(cite(G.HERO_VOICES[G.PARTY[0]].obey, 'src/data/hero-voices.js'))
  };
}

function homecoming() {
  const t = G.MAZE_TALE;
  return {
    id: 'return',
    name: TITLES.return,
    tag: '結局',
    summary: t.win,
    image: gameArt('captain-' + LAST + '.webp'),
    sections: [
      speech('階盡（走完十局）', t.win, t.winAgain),
      speech('眼破（中途落敗）', t.loss, said(G.WEI.name, t.scatter.text, t.scatter.note)),
      speech('闔眼：真實世界的碎片', G.FRAGMENTS),
      links('最後一局', [stageLinks(LAST)[1], stageLinks(LAST)[0]])
    ],
    sources: cites(cite(t.win, 'src/data/maze-tale.js'))
  };
}

// The first chapter the game was built around. Its scenes change with the three heroes
// on board, so the page asks the game for the scenes of several crews.
function archive() {
  const scene = (b) => said(b.speaker, b.text, b.note);
  const crew = (...ids) => G.chapterScenes({ units: ids.map((id) => ({ id, side: 'ally', hp: 1 })) });
  const [first, second, third] = G.ORIGINAL_PARTY,
    others = G.PARTY.filter((id) => !G.ORIGINAL_PARTY.includes(id));
  const crews = [
    [others[0], first, second],
    [others[0], first, third],
    ...G.PARTY.filter((id) => id !== first && id !== others[0]).map((id) => [
      others[0],
      id,
      id === second ? third : second
    ]),
    [others[1], others[0], second]
  ];
  const seen = new Set(),
    variants = [];
  for (const ids of crews)
    for (const b of crew(...ids).map(scene)) {
      const key = JSON.stringify(b);
      if (!seen.has(key) && seen.add(key)) variants.push(b);
    }
  return {
    id: 'archive',
    name: TITLES.archive,
    tag: '舊章・遊戲內已不顯示',
    summary: G.STORIES[0].note,
    image: heroPortrait(first),
    sections: [...G.STORIES.map((b) => speech(b.place, scene(b))), speech('異陣容對白', variants)],
    sources: cites(cite(G.STORIES[0].place, 'src/rules/game.js'))
  };
}

// One board. It is a closed scene, so it reads the same wherever it falls in the run.
function stage(i) {
  const script = G.ENCOUNTER_SCRIPT[i],
    tale = G.CHAMBER_TALES[i],
    [boss, second] = G.ENCOUNTERS[i];
  return {
    id: 'map-' + i,
    name: stageName(i) + ' · 局中對白',
    tag: i === LAST ? '最後一局' : '可抽換的局',
    summary: tale.arrival,
    image: wikiArt('map-' + i + '.webp'),
    sections: [
      rows('這一局', [
        ['局主的執念', tale.obsession],
        ['局中影', tale.shade]
      ]),
      speech('戰前', beats(script.before, i)),
      speech(
        '同書俠客的專屬臺詞',
        Object.entries(script.heroLines).map(([id, line]) => said(G.DETAILS[id].name, line))
      ),
      speech('戰後 · 勝', beats(script.win, i)),
      speech('局中影 · 救下 / 錯過', said('救下', script.rescue), said('錯過', script.missed)),
      speech('戰後 · 敗', beats(script.loss, i)),
      speech('局的紀事', tale.arrival, tale.victory),
      links('同局條目', [
        link('maps', i, stageName(i)),
        link('foes', 'enc-' + i + '-0', boss.name),
        link('foes', 'enc-' + i + '-1', second.name),
        link('missions', 'map-' + i, missionLabel(i))
      ])
    ],
    sources: cites(cite(script.rescue, 'src/data/encounter-script.js'), cite(tale.arrival, 'src/data/maze-tale.js'))
  };
}

const wakeId = (i) => 'wake-' + (i + 1);
const fateId = (f) => 'fate-' + f.id;
const worldLink = () => link('story', 'world', TITLES.world);

// What the youth can read for himself in the game: the invitation and the stone.
function world() {
  return {
    id: 'world',
    name: TITLES.world,
    tag: '遊戲內的說法',
    summary: G.WORLD[0].text,
    image: gameArt('stone-marks.webp'),
    sections: [
      ...G.WORLD.map((w) => speech(w.name, w.text)),
      links('石上的五道痕', G.WAKES.map((w, i) => link('story', wakeId(i), w.name))),
      links('第五輪起的抉擇', G.FATES.map((f) => link('story', fateId(f), f.name)))
    ],
    sources: cites(cite(G.WORLD[0].name, 'src/data/wake-tale.js'))
  };
}

function wake(w, i) {
  const next = G.WAKES[i + 1];
  return {
    id: wakeId(i),
    name: w.name,
    tag: '第 ' + (i + 1) + ' 輪・石上的痕',
    summary: w.mark,
    image: gameArt('stone-marks.webp'),
    sections: [
      speech(
        '睜眼所見（第一局前）',
        said(YOUTH_NAME, w.opening.text, w.opening.note),
        w.openingLater && said(YOUTH_NAME, w.openingLater.text, '第六輪起。' + w.openingLater.note)
      ),
      speech('夜話（第五局前）', said(YOUTH_NAME, w.echo.text, w.echo.note)),
      speech('留痕', w.carve),
      speech('闔眼 · 勝', w.afterWin),
      speech('闔眼 · 敗', w.afterLoss),
      links('相關', [
        worldLink(),
        ...(next
          ? [link('story', wakeId(i + 1), next.name)]
          : G.FATES.map((f) => link('story', fateId(f), f.name)))
      ])
    ],
    sources: cites(cite(w.name, 'src/data/wake-tale.js'))
  };
}

function fate(f) {
  const last = G.WAKES.length - 1;
  return {
    id: fateId(f),
    name: f.name,
    tag: '第五輪後・劇透',
    summary: f.desc,
    image: gameArt('stone-marks.webp'),
    sections: [
      speech(G.FATE_PROMPT, f.desc),
      speech('這樣選了之後', f.ending),
      speech('下一輪睜眼所見', f.echo),
      links('來處', [link('story', wakeId(last), G.WAKES[last].name)])
    ],
    sources: cites(cite(f.name, 'src/data/wake-tale.js'))
  };
}

export function story() {
  return [
    opening(),
    voices(),
    shop(),
    homecoming(),
    archive(),
    ...G.MAP_LAYOUTS.map((_, i) => stage(i)),
    world(),
    ...G.WAKES.map(wake),
    ...G.FATES.map(fate)
  ];
}
