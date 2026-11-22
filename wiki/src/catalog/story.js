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
  opening: '入夢',
  qiu: '求敗的話',
  shop: '通吃坊、盤口與三盅通吃',
  voices: '十位俠客自己的話',
  return: '請回吧與夢醒',
  archive: '霧鎖青竹渡',
  world: '少年在棋臺邊瞧明白的事',
  realms: '五重境界：選境界與開境界',
  finale: '最後一局與放下（暫代）'
};
const REALMS = '一二三四五';
// A 境界 is named for its sword: 利劍境界, 軟劍境界, ….
const realmName = (i) => G.WAKES[i].sword + '境界';
const LAST = G.FINAL_MAP;
const said = (speaker, text, note) => ({ ...(note ? { note } : {}), ...(speaker ? { speaker } : {}), text });

// Who a line of a board's script belongs to.
function speakerOf(who, stage) {
  const [boss, second] = G.ENCOUNTERS[stage];
  return (
    { youth: YOUTH_NAME, boss: boss.name, mini: second?.name, leader: '當局領隊', ally: '當局同行俠客', qiu: G.QIUBAI.name, wei: G.WEI.name }[who] ||
    G.VILLAINS[who]?.name
  );
}
// A line of the spine: 求敗 unless it says otherwise.
const spine = (b, note) => said(speakerOf(b.who || 'qiu', 0), b.text, [note, b.note].filter(Boolean).join('　'));
const beats = (list, stage) => list.map((b) => said(speakerOf(b.who, stage), b.text, b.note));

// The prologue and the first board's opening.
function opening() {
  const t = G.MAZE_TALE,
    p = t.prologue;
  return {
    id: 'opening',
    name: TITLES.opening,
    tag: '序幕',
    summary: p.first[1].note,
    image: gameArt(G.YOUTH.portrait),
    sections: [
      speech(
        '第一輪：少年闖進劍境',
        p.first.map((step) => (step.who ? said(speakerOf(step.who, 0), step.text, step.note) : step.note))
      ),
      speech(
        '第二輪起：又是你',
        p.again.note,
        p.again.greeting.map((line, i) => said(G.QIUBAI.name, line, '選了' + realmName(i))),
        said(YOUTH_NAME, p.again.youth),
        said(G.QIUBAI.name, p.again.reply)
      ),
      speech('抓子與局規', t.draw, '棋臺沿上刻著：「' + t.rule + '」'),
      speech(
        '第一局之前',
        said(YOUTH_NAME, t.ruleRead.text, t.ruleRead.note),
        said(G.WEI.name, t.ruleTold),
        said(YOUTH_NAME, t.command.text, t.command.note),
        said(G.WEI.name, t.recall.text, t.recall.note),
        t.deploy
      ),
      speech('說破：軟劍、重劍境界', t.told.cold.map((b) => spine(b))),
      speech('說破：木劍、無劍境界', t.told.plain.map((b) => spine(b))),
      links('接下來', [
        link('story', 'qiu', TITLES.qiu),
        link('story', 'voices', TITLES.voices),
        link('story', 'wake-1', G.WAKES[0].name),
        link('folk', 'qiu', G.QIUBAI.name)
      ])
    ],
    sources: cites(cite(p.first[0].note, 'src/data/maze-tale.js'))
  };
}

// Everything 求敗 says after a board, by 境界: the one person who changes from run to run.
function qiubai() {
  const t = G.MAZE_TALE;
  return {
    id: 'qiu',
    name: TITLES.qiu,
    tag: '隨境界而變',
    summary: t.after[0][8].text,
    image: gameArt(G.QIUBAI.portrait),
    sections: [
      ...t.after.map((lines, i) =>
        speech(
          realmName(i) + '：每勝一局之後',
          lines.map((line, n) => said(G.QIUBAI.name, line.text, '第' + G.NUMERALS[n] + '局勝後。' + (line.note || '')))
        )
      ),
      speech('添子', t.lend),
      speech('局中落子', t.clack, t.clackSave),
      speech('少年同韋小寶說話時', t.unseen.map((b, i) => said(G.QIUBAI.name, b.text, realmName(i) + '。' + b.note))),
      links('相關', [link('story', 'opening', TITLES.opening), link('story', 'return', TITLES.return), link('folk', 'qiu', G.QIUBAI.name)])
    ],
    sources: cites(cite(t.after[0][0].text, 'src/data/maze-tale.js'))
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
      speech(
        '他怎生來的：每輪一個大話',
        t.origins.tales.map((tale, i) => said(v.name, tale, i ? '' : t.origins.note))
      ),
      speech(
        '盤口：支線達成',
        Object.entries(G.SIDE_KINDS).map(([kind, k]) => said(v.name, G.SIDE_TALES[kind] || G.SIDE_TALES.done, kindName(kind, k)))
      ),
      speech(
        '盤口：賠彩與落空',
        said(v.name, G.SIDE_PAY.coins, '賞銀'),
        said(v.name, G.SIDE_PAY.manual, '武譜'),
        said(v.name, G.SIDE_PAY.points, '武學點'),
        said(v.name, G.SIDE_MISS, '這一局贏了，支線落空')
      ),
      speech(v.title, v.arrival, said(v.name, v.reveal), said(v.name, v.blind), said(v.name, v.win)),
      speech('落敗時', said(v.name, t.packUp.text)),
      links('人物', [link('folk', 'wei', v.name)])
    ],
    sources: cites(cite(v.name, 'src/rules/ferry-market.js'), cite(t.shop, 'src/data/maze-tale.js'))
  };
}
// A kind of secondary by the name the game shows; 斷其退路 and its two kin share one line.
const kindName = (kind, k) => {
  try {
    return kind === 'spare' ? '不容續命、斷其退路、不觸斗轉星移' : k.name({});
  } catch {
    return kind;
  }
};

// Lines that belong to a hero rather than to a board, so they hold whoever is drawn.
function voices() {
  return {
    id: 'voices',
    name: TITLES.voices,
    tag: '不隨局、不隨次序',
    summary: '俠客是隨手抓的，局的次序也會變。這些話跟著人走：入境的第一句、聽見由少年執子時的回答、似曾相識、夜話、想起成名絕學，與臨別。',
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
          said(name, v.night[0], '夜話，利劍境界。'),
          said(name, v.night[1], '夜話，軟劍境界起：得知自己是拓來的一份。'),
          said(name, v.summit, '想起成名絕學時。'),
          said(name, v.farewell, '勝滿十局，放還本尊之前。')
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
    tag: '一輪的收尾',
    summary: t.win,
    image: gameArt(G.QIUBAI.portrait),
    sections: [
      speech('放還（勝滿十局）', said(G.QIUBAI.name, t.release.text, t.release.note), t.win),
      ...t.close.map((lines, i) => speech(realmName(i) + '收局', lines.map((b) => spine(b)))),
      speech(
        '眼破（中途落敗）',
        said(G.QIUBAI.name, t.scatter.text[0], '利劍、軟劍境界。' + t.scatter.note),
        said(G.QIUBAI.name, t.scatter.text[1], '重劍境界起。'),
        said(G.WEI.name, t.packUp.text),
        t.loss,
        G.NO_MARK
      ),
      speech('夢醒：五重境界各一段', G.FRAGMENTS),
      links('最後一局', [stageLinks(LAST)[1], stageLinks(LAST)[0], link('story', 'finale', TITLES.finale)])
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
        ['局主', boss.name],
        // A board built round one villain has no lieutenant: his troop type fills the seats.
        second ? ['副手', second.name] : ['兵卒', G.DETAILS[G.GARRISONS[i]].name],
        ['支線', missionLabel(i)]
      ]),
      speech('戰前', beats(script.before, i)),
      speech(
        '同書俠客的專屬臺詞',
        Object.entries(script.heroLines).map(([id, line]) => said(G.DETAILS[id].name, line))
      ),
      // The named black stones 求敗 set down beside the master and his lieutenant.
      ...Object.entries(script.extras || {}).map(([id, extra]) =>
        speech(
          G.VILLAINS[id].name + '：後來才落的黑子',
          extra.enter && said(G.VILLAINS[id].name, extra.enter, '入場時。'),
          extra.reply && said(speakerOf(extra.reply.who, i), extra.reply.text),
          Object.entries(extra.heroes || {}).map(([hero, line]) => said(G.DETAILS[hero].name, line, '同書俠客在陣時。'))
        )
      ).filter((section) => section.speeches.length),
      speech('戰後 · 勝', beats(script.win, i)),
      speech(
        '韋小寶的盤口 · 押中',
        ...[...new Set(G.BATTLES[i].sides.map((side) => G.SIDE_TALES[side.kind] || G.SIDE_TALES.done))].map(
          (tale) => said(G.WEI.name, tale)
        )
      ),
      speech('戰後 · 敗', beats(script.loss, i)),
      speech('局的紀事', tale.arrival, tale.victory),
      links('同局條目', [
        link('maps', i, stageName(i)),
        link('foes', 'enc-' + i + '-0', boss.name),
        second ? link('foes', 'enc-' + i + '-1', second.name) : link('foes', G.GARRISONS[i], G.DETAILS[G.GARRISONS[i]].name),
        link('missions', 'map-' + i, missionLabel(i))
      ])
    ],
    sources: cites(cite(script.before[0].text, 'src/data/encounter-script.js'), cite(tale.arrival, 'src/data/maze-tale.js'))
  };
}

const wakeId = (i) => 'wake-' + (i + 1);
const worldLink = () => link('story', 'world', TITLES.world);

// What the youth can read and work out for himself in the game: the rule and the stone.
function world() {
  return {
    id: 'world',
    name: TITLES.world,
    tag: '遊戲內的說法',
    summary: G.WORLD[0].text,
    image: gameArt('stone-marks-' + G.WAKES.length + '.webp'),
    sections: [
      ...G.WORLD.map((w) => speech(w.name, w.text)),
      links('臺邊的五行字', G.WAKES.map((w, i) => link('story', wakeId(i), w.name)))
    ],
    sources: cites(cite(G.WORLD[0].name, 'src/data/wake-tale.js'))
  };
}

// One 境界: the line 求敗 cuts in the stone when the youth wins it, and what belongs to it.
function wake(w, i) {
  const next = G.WAKES[i + 1],
    t = G.MAZE_TALE;
  return {
    id: wakeId(i),
    name: w.name,
    tag: realmName(i) + '・' + w.title,
    summary: w.mark,
    // The stone as it stands once this line has been cut.
    image: gameArt('stone-marks-' + (i + 1) + '.webp'),
    sections: [
      rows('難度', [
        ['黑子', G.REALMS[i].note],
        ['何時開', i ? '勝了' + realmName(i - 1) + '（其時已開的最高一重境界）之後。' : '一開始便開。'],
        ['勝了之後', next ? '若此重境界是已開的最高一重境界，' + realmName(i + 1) + '便開。' : '五重境界皆勝，便有最後一局。']
      ]),
      speech('入夢時', said(G.QIUBAI.name, t.prologue.again.greeting[i], i ? '' : '第一輪另有開場；這一句是敗了再來時說的。')),
      speech('夜話（第五局前）', said(YOUTH_NAME, w.echo.text, t.night + w.echo.note)),
      speech('收局', t.close[i].map((b) => spine(b))),
      speech('石上多一行', w.carve),
      speech('夢醒 · 勝', w.afterWin),
      speech('夢醒 · 敗', w.afterLoss),
      links('相關', [worldLink(), link('story', 'qiu', TITLES.qiu), ...(next ? [link('story', wakeId(i + 1), next.name)] : [])])
    ],
    sources: cites(cite(w.name, 'src/data/wake-tale.js'))
  };
}

// The five 境界 as difficulty levels: what each changes, and how they open.
function realms() {
  const pct = (m) => (m === 1 ? '如常' : '×' + m);
  return {
    id: 'realms',
    name: TITLES.realms,
    tag: '難度',
    summary:
      '五重境界便是五級難度。每一輪入夢之前，從已開的境界裡選一重境界。利劍境界一開始便開；勝了已開的最高一重境界，下一重境界方開；勝了較低的境界，只是重下一遍，不開新境界。五重境界皆勝，便有最後一局。所選的境界，也定了這一輪求敗說的話。',
    sections: [
      rows(
        '各重境界的黑子',
        G.REALMS.map((r, i) => [
          r.sword + '境界',
          '氣血 ' + pct(r.hp) + '，攻擊 ' + pct(r.atk) + '，防禦 ' + (r.def ? '+' + r.def : '如常') + '。' + r.note
        ])
      ),
      links('五重境界', [...G.WAKES.map((w, i) => link('story', wakeId(i), w.name)), link('story', 'finale', TITLES.finale)])
    ],
    sources: cites(cite(G.REALMS[1].note, 'src/data/realms.js'))
  };
}

// The last battle and 求敗 letting go: placeholders until the producer designs them.
function finale() {
  const f = G.MAZE_TALE.finale;
  return {
    id: 'finale',
    name: TITLES.finale,
    tag: '五重境界皆勝之後',
    summary: '五重境界皆勝，無劍境界收局之後便是最後一局：一張新的棋盤，少年與求敗都親自上盤。這一局與求敗放下的終局動畫都尚未製成，遊戲裡暫以文字與簡單的動畫代之。',
    image: gameArt(G.QIUBAI.portrait),
    sections: [
      speech('第十一局（暫代）', f.board.map((b) => (b.who ? spine(b) : b.note))),
      speech('放下（暫代）', f.letGo.map((b) => (b.who ? spine(b) : b.note))),
      speech('夢醒', f.wake),
      links('相關', [link('story', 'realms', TITLES.realms), link('story', wakeId(G.WAKES.length - 1), G.WAKES.at(-1).name)])
    ],
    sources: cites(cite(f.wake, 'src/data/maze-tale.js'))
  };
}

export function story() {
  return [
    realms(),
    finale(),
    opening(),
    qiubai(),
    voices(),
    shop(),
    homecoming(),
    archive(),
    ...G.MAP_LAYOUTS.map((_, i) => stage(i)),
    world(),
    ...G.WAKES.map(wake)
  ];
}
