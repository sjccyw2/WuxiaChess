// 渡中紀事: every scripted scene, read from the game's own story tables.
// The wiki only supplies page titles and section headings.
import * as G from '../game-data.js';
import { cite, cites } from '../sources.js';
import { speech, links, link, gameArt, wikiArt } from './parts.js';
import { heroPortrait } from './heroes.js';
import { stageName, stageLinks } from './foes.js';
import { missionLabel } from './missions.js';

export const FERRYWOMAN = '桑婆婆';
export const TITLES = {
  opening: '青竹渡的三支籤',
  ferry: '借刻鋪與三碗借時',
  return: '十漏歸時',
  archive: '霧鎖青竹渡',
  world: '十環回牒與五孔回水尺'
};
const LAST = G.MAP_LAYOUTS.length - 1;
const said = (speaker, text, note) => ({ ...(note ? { note } : {}), ...(speaker ? { speaker } : {}), text });

// Who a line of an encounter script belongs to.
function speakerOf(who, stage) {
  const [boss, second] = G.ENCOUNTERS[stage];
  return { boat: FERRYWOMAN, boss: boss.name, mini: second.name, leader: '當局領隊', ally: '當局同行俠客' }[who];
}
const beats = (list, stage) => list.map((b) => said(speakerOf(b.who, stage), b.text, b.note));

function opening() {
  const t = G.MAZE_TALE;
  return {
    id: 'opening',
    name: TITLES.opening,
    tag: '序章',
    summary: t.opening[0],
    image: gameArt('npc-sang.webp'),
    sections: [
      speech('銅漏倒轉', t.opening),
      speech('上船與整備', said(FERRYWOMAN, t.draw), said(FERRYWOMAN, t.deploy)),
      links('首渡', [stageLinks(0)[1], stageLinks(0)[0]])
    ],
    sources: cites(cite(t.opening[0], 'src/data/maze-tale.js'))
  };
}

function ferry() {
  const t = G.MAZE_TALE,
    v = G.VISITOR;
  return {
    id: 'ferry',
    name: TITLES.ferry,
    tag: '渡口奇遇',
    summary: v.arrival,
    image: gameArt(v.portrait),
    sections: [
      speech('借刻鋪', t.shop, v.arrival),
      speech(v.name + '的碗局', said(v.name, v.reveal), said(v.name, v.blind), said(v.name, v.win)),
      links('人物', [link('folk', 'sang', FERRYWOMAN), link('folk', 'zhou', v.name)])
    ],
    sources: cites(cite(v.name, 'src/rules/ferry-market.js'), cite(t.shop, 'src/data/maze-tale.js'))
  };
}

function homecoming() {
  const t = G.MAZE_TALE;
  return {
    id: 'return',
    name: TITLES.return,
    tag: '結局',
    summary: t.boss.line,
    image: gameArt('captain-' + LAST + '.webp'),
    sections: [
      speech('面對漏中身', said(t.boss.name, t.boss.line), said(FERRYWOMAN, t.boss.reply)),
      speech('決戰勝利', t.win, t.winAgain),
      speech('敗退', t.loss),
      links('終渡', [stageLinks(LAST)[1], stageLinks(LAST)[0]])
    ],
    sources: cites(cite(t.boss.line, 'src/data/maze-tale.js'))
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
    tag: '舊章',
    summary: G.STORIES[0].note,
    image: heroPortrait(first),
    sections: [...G.STORIES.map((b) => speech(b.place, scene(b))), speech('異陣容對白', variants)],
    sources: cites(cite(G.STORIES[0].place, 'src/rules/game.js'))
  };
}

function stage(i) {
  const script = G.ENCOUNTER_SCRIPT[i],
    tale = G.CHAMBER_TALES[i],
    [boss, second] = G.ENCOUNTERS[i];
  return {
    id: 'map-' + i,
    name: stageName(i) + ' · 臨陣與歸舟',
    tag: i === 0 ? '首渡' : i === LAST ? '終渡' : '中途渡口',
    summary: tale.arrival,
    image: wikiArt('map-' + i + '.webp'),
    sections: [
      speech('戰前 · 臨陣', beats(script.before, i)),
      speech(
        '戰前 · 特定俠客替代臺詞',
        Object.entries(script.heroLines).map(([id, line]) => said(G.DETAILS[id].name, line))
      ),
      speech('戰後 · 勝', beats(script.win, i)),
      speech('支線 · 完成 / 錯過', said('完成', script.rescue), said('錯過', script.missed)),
      speech('戰後 · 敗', beats(script.loss, i)),
      // Same order the game checks: later heroes' lines first, then the stop's own voice.
      speech(
        '關卡紀事',
        tale.arrival,
        [...(G.NEW_VOICES[i] || []), tale.voice].map((v) => said(G.DETAILS[v.id].name, v.line)),
        tale.victory
      ),
      links('同渡條目', [
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

function world() {
  return {
    id: 'world',
    name: TITLES.world,
    // The world view the current build was written to. The new one is 世界觀設定 (lore.js).
    tag: '舊世界觀',
    summary: G.WORLD[0].text,
    image: gameArt('wake-gauge.webp'),
    sections: [
      ...G.WORLD.map((w) => speech(w.name, w.text)),
      links('逐航手記', G.WAKES.map((w, i) => link('story', wakeId(i), w.name))),
      links('終局歸印', G.FATES.map((f) => link('story', fateId(f), f.name)))
    ],
    sources: cites(cite(G.WORLD[0].name, 'src/data/wake-tale.js'))
  };
}

function wake(w, i) {
  const next = G.WAKES[i + 1];
  return {
    id: wakeId(i),
    name: w.name,
    tag: '第' + (i + 1) + '航・跨航記憶',
    summary: w.mark,
    image: gameArt('wake-gauge.webp'),
    sections: [
      speech('抵達與航中', said('', w.opening.text, w.opening.note), said('', w.echo.text, w.echo.note)),
      speech('勝航回港', w.afterWin),
      speech('敗航回港', w.afterLoss),
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
    tag: '第五航後・劇透',
    summary: f.desc,
    image: gameArt('wake-gauge.webp'),
    sections: [
      speech('本牒的歸處', f.ending),
      speech('下一航的渡口', f.echo),
      links('來處', [link('story', wakeId(last), G.WAKES[last].name)])
    ],
    sources: cites(cite(f.name, 'src/data/wake-tale.js'))
  };
}

export function story() {
  return [
    opening(),
    ferry(),
    homecoming(),
    archive(),
    ...G.MAP_LAYOUTS.map((_, i) => stage(i)),
    world(),
    ...G.WAKES.map(wake),
    ...G.FATES.map(fate)
  ];
}
