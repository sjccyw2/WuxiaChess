// The manuscripts: pages written by hand in wiki/content/, one Markdown file per wiki
// category.
//
// This is the one part of the wiki that is not read from the game. Edit a Markdown file
// and reload the page; there is nothing to rebuild. Each "## N. 標題" in a file becomes
// one page.
//
// For each manuscript:
//   file      the Markdown file in wiki/content/
//   note      shown under the title on its index page
//   logline   the numbered section whose first paragraph is the one-line summary
//   featured  sections shown on the home page
//   sections  address, category and a one-line guide for each numbered section. The guide
//             only says what the section covers. A section that is not listed still
//             appears, using its first paragraph as the guide.
const CONTENT = 'wiki/content/';
const LORE_SECTIONS = {
  0: ['brief', '協作須知', '哪些設定已定案、哪些已否決、v1.0 推翻了哪些舊定案，以及補白而不改寫、金庸筆法的寫作原則。'],
  1: ['premise', '機制', '世界觀要解釋的機制前提：一輪十張地圖、開局隨機三人、五人上場、養成、經濟與局外主線。'],
  2: ['logline', '核心設定', '把整個世界觀濃縮成一句話。'],
  3: ['dugu', '核心設定', '從無名少年到成了仙仍放不下的劍客：獨孤求敗如何無敵、劍解成仙，又為何把千年武功拓進一盤棋裡，自己同自己下了幾百年。'],
  4: ['rules', '核心設定', '劍境為何能跨越時代，三條仙規與一個例外，記憶與功力，白子與黑子（戰意、半醒、念中人），為何是一盤棋，以及韋小寶為何來去自如。'],
  5: ['player', '核心設定', '玩家的身分、少年與求敗互為師徒的因果閉環、這個設定的三層意思、玩家在盤上的位置，以及入夢與夢醒。'],
  6: ['mechanics', '機制', '每一項遊戲機制在世界內的解釋，附「了緣」條件示例，以及裝備這個破綻。'],
  7: ['npcs', '人物與主線', '求敗、神鵰與韋小寶：不上場作戰的人物各自的身分與作用。'],
  8: ['volumes', '人物與主線', '跨輪主線五重境界：求敗怎樣一輪一輪鬆手，「放下」為何是武學的奧義，終局、結局與伏筆。'],
  9: ['open', '未定案', '製作人已確認的各項，以及仍待決定的問題。'],
  10: ['rights', '協作須知', '金庸人物的授權提醒，以及無法取得授權時的替代方案。'],
  11: ['glossary', '名詞表', '劍境、一念、戰意、局規、五重境界、盤口等專有名詞的釋義。']
};
const RUN_SECTIONS = {
  0: ['scope', '協作須知', '這份文件管甚麼、不管甚麼，製作人已定案的事，以及現有版本有哪些玩法原樣沿用。'],
  1: ['loop', '核心設定', '一輪遊戲的故事梗概，與五條設計原則。'],
  2: ['memory', '核心設定', '誰記得多少：求敗全都記得，少年醒了只剩影子，英雄每輪都是新拓的一份。似曾相識不是甚麼。'],
  3: ['boy', '核心設定', '玩家角色：在睡夢裡闖進來的少年。名字、為何由他號令、領隊為何是「眼」，以及入夢與夢醒。'],
  4: ['motive', '核心設定', '求敗、少年、英雄與黑子各自所求；韋小寶的盤口與來歷；以及劍客為何擺棋。'],
  5: ['flow', '流程', '一輪從入夢到夢醒的各個段落，開場與夜話的示例；對白為何分成骨架、局、人三層。'],
  6: ['arrivals', '人物與十局', '現有十位英雄各自拓自原著哪一瞬、以為自己在哪裡、入境時手上最熟的是甚麼。'],
  7: ['boards', '人物與十局', '現有十局：戰意壓在哪裡、黑子怎樣覺出身不由己、後來才落的黑子，以及醒來的第一件事。'],
  8: ['dejavu', '輪迴', '似曾相識的來由是棋盤，何時出現、一輪出現多少，以及各人的說法。'],
  9: ['endings', '輪迴', '勝與敗兩種收局、夢醒的五段，以及求敗刻在棋臺邊的五行字。'],
  10: ['ladder', '輪迴', '五重境界：求敗每一重境界的開場與收局、第二境界起的說破、一輪之內他的話，以及第五境界收局時看見韋小寶。'],
  11: ['mapping', '機制', '每一項機制的說法與世界內的解釋，以及哪些已在遊戲裡、哪些尚未做。'],
  12: ['art', '美術', '這套故事需要新畫的圖，各用在哪裡。'],
  13: ['open', '未定案', '要請製作人拿主意的問題。'],
  14: ['terms', '名詞表', '本文件在世界觀名詞表之外新增的用語。'],
  15: ['style', '協作須知', '金庸筆法的寫作守則：旁白、對白、粵語朗讀、對照與回目。']
};
export const MANUSCRIPTS = {
  lore: {
    file: '世界觀設定.md',
    note: '本分類揭露全部主線真相與結局。',
    logline: 2,
    featured: ['dugu', 'rules', 'player', 'mechanics', 'npcs', 'volumes'],
    sections: LORE_SECTIONS
  },
  run: {
    file: '單輪劇本.md',
    note: '一輪遊戲裡發生的故事，已寫進遊戲。內含全部主線真相。',
    logline: 1,
    featured: ['loop', 'boy', 'motive', 'arrivals', 'boards', 'dejavu'],
    sections: RUN_SECTIONS
  }
};

const plain = (text) => text.replaceAll('**', '');

// The subset of Markdown the manuscript uses: headings, the opening quote block,
// paragraphs, lists and tables.
export function parseMarkdown(source) {
  const lines = source.split('\n'),
    doc = { title: '', meta: [], sections: [] };
  const cells = (row) => row.trim().replace(/^\|+|\|+$/g, '').split('|').map((c) => c.trim());
  let section = null,
    part = null,
    i = 0;
  const add = (block) => {
    if (!part) throw Error('原稿第 ' + (i + 1) + ' 行：內容出現在第一個「## 節」之前');
    part.blocks.push(block);
  };
  while (i < lines.length) {
    const line = lines[i].trimEnd();
    let m;
    if (!line.trim() || /^-{3,}$/.test(line.trim())) i++;
    else if ((m = line.match(/^# (.+)/))) {
      doc.title = m[1].trim();
      i++;
    } else if (!section && line.startsWith('>')) {
      doc.meta.push(line.replace(/^[> ]+/, '').trim());
      i++;
    } else if ((m = line.match(/^## (\d+)\. (.+)/))) {
      if (section) section.endLine = i;
      part = { blocks: [] };
      section = { num: +m[1], name: m[2].trim(), line: i + 1, sections: [part] };
      doc.sections.push(section);
      i++;
    } else if ((m = line.match(/^### (.+)/))) {
      part = { title: m[1].trim(), blocks: [] };
      section.sections.push(part);
      i++;
    } else if (line.startsWith('|')) {
      const table = [];
      while (i < lines.length && lines[i].startsWith('|')) table.push(cells(lines[i++]));
      if (table.length < 2 || !table[1].every((c) => /^:?-+:?$/.test(c)))
        throw Error('原稿第 ' + i + ' 行：表格缺少表頭分隔列');
      add({ table: { head: table[0], rows: table.slice(2) } });
    } else {
      const list = [
        ['ul', /^- (.+)/],
        ['ol', /^\d+\. (.+)/]
      ].find(([, pattern]) => pattern.test(line));
      if (list) {
        const [kind, pattern] = list,
          items = [];
        while (i < lines.length && (m = lines[i].trimEnd().match(pattern))) {
          items.push(m[1].trim());
          i++;
        }
        add({ [kind]: items });
      } else {
        add({ p: line.trim() });
        i++;
      }
    }
  }
  if (section) section.endLine = lines.length;
  for (const s of doc.sections) {
    s.sections = s.sections.filter((p) => p.blocks.length || p.title);
    while (['', '---'].includes(lines[s.endLine - 1].trim())) s.endLine--;
  }
  return doc;
}

const firstParagraph = (section) =>
  plain(section.sections.flatMap((p) => p.blocks).find((b) => b.p)?.p ?? '');

const loaded = {};

// reader(path) -> Promise<string>, path relative to the repository root.
export async function loadManuscripts(reader) {
  const read =
    reader ||
    (async (path) => {
      const file = path.slice(CONTENT.length);
      const r = await fetch(new URL('../../content/' + file, import.meta.url));
      if (!r.ok) throw Error('無法讀取 ' + file);
      return r.text();
    });
  await Promise.all(
    Object.entries(MANUSCRIPTS).map(async ([group, { file }]) => {
      const source = await read(CONTENT + file),
        doc = parseMarkdown(source);
      if (!doc.title || !doc.sections.length) throw Error(file + ' 缺少標題或章節');
      loaded[group] = { source, doc };
    })
  );
}

// The pages of one manuscript, as catalog entries.
export function pages(group) {
  if (!loaded[group]) return [];
  const { file, sections } = MANUSCRIPTS[group];
  const entries = loaded[group].doc.sections.map((s) => {
    const [id, tag, guide] = sections[s.num] || ['sec-' + s.num, '設定', null];
    return {
      id,
      num: s.num,
      name: s.name,
      tag,
      summary: guide || firstParagraph(s),
      sections: s.sections,
      sources: [{ file: CONTENT + file, line: s.line, endLine: s.endLine }]
    };
  });
  if (new Set(entries.map((e) => e.id)).size !== entries.length) throw Error(file + ' 有重複的節號');
  return entries;
}

// What the index page and the download need to know about one manuscript.
export function manuscript(group) {
  if (!loaded[group]) return null;
  const { file, note, logline, featured } = MANUSCRIPTS[group],
    { source, doc } = loaded[group],
    lead = doc.sections.find((s) => s.num === logline);
  return {
    title: doc.title,
    meta: doc.meta,
    note,
    logline: lead ? firstParagraph(lead) : '',
    featured,
    source: file,
    markdown: source
  };
}
