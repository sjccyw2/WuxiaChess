// 世界觀設定: the world view, written by hand in wiki/content/世界觀設定.md.
//
// This is the one part of the wiki that is not read from the game. Edit the Markdown
// file and reload the page; there is nothing to rebuild. Each "## N. 標題" in the file
// becomes one page.

export const LORE_FILE = '世界觀設定.md';
const LORE_PATH = 'wiki/content/' + LORE_FILE;

// Address, category and a one-line guide for each numbered section. The guide only says
// what the section covers. A section that is not listed here still appears, using its
// first paragraph as the guide.
const SECTIONS = {
  0: ['brief', '協作須知', '哪些設定已定案、哪些已否決、哪些尚待決定，以及補白而不改寫的寫作原則。'],
  1: ['premise', '機制', '世界觀要解釋的機制前提：一輪十張地圖、開局隨機三人、五人上場、養成、經濟與局外主線。'],
  2: ['logline', '核心設定', '把整個世界觀濃縮成一句話。'],
  3: ['dugu', '核心設定', '從無名少年到卡住的劍仙：獨孤求敗如何無敵、劍解成仙，又為何開出劍境、設下十局。'],
  4: ['rules', '核心設定', '劍境為何能跨越時代，三條仙規與兩個例外，記憶與功力如何留存，英雄與反派為何而戰。'],
  5: ['player', '核心設定', '玩家的身分、造就獨孤求敗的因果閉環、這個設定的三層意思，以及玩家在盤上的位置。'],
  6: ['mechanics', '機制', '每一項遊戲機制在世界內的解釋，附「了緣」條件示例，以及裝備這第一個破綻。'],
  7: ['npcs', '人物與主線', '神鵰、韋小寶與劍仙本人：不上場作戰的人物各自的身分與作用。'],
  8: ['volumes', '人物與主線', '玩家在多輪遊玩中揭開真相的五卷主線、卷四的伏筆、跨代對話、第十一局與結局。'],
  9: ['open', '未定案', '尚待製作人決定的問題，由遊戲名稱到金庸以外的人物。'],
  10: ['rights', '協作須知', '金庸人物的授權提醒，以及無法取得授權時的替代方案。'],
  11: ['glossary', '名詞表', '劍境、一念、劍解、了緣、絕位等專有名詞的釋義。']
};
// Sections shown on the home page.
export const FEATURED = ['dugu', 'rules', 'player', 'mechanics', 'npcs', 'volumes'];

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

let source = '',
  doc = null;

// reader(path) -> Promise<string>, path relative to the repository root.
export async function loadLore(reader) {
  const read =
    reader ||
    (async () => {
      const r = await fetch(new URL('../../content/' + LORE_FILE, import.meta.url));
      if (!r.ok) throw Error('無法讀取 ' + LORE_FILE);
      return r.text();
    });
  source = await read(LORE_PATH);
  doc = parseMarkdown(source);
  if (!doc.title || !doc.sections.length) throw Error('原稿缺少標題或章節');
}

export function lore() {
  if (!doc) return [];
  const entries = doc.sections.map((s) => {
    const [id, tag, guide] = SECTIONS[s.num] || ['sec-' + s.num, '設定', null];
    return {
      id,
      num: s.num,
      name: s.name,
      tag,
      summary: guide || firstParagraph(s),
      sections: s.sections,
      sources: [{ file: LORE_PATH, line: s.line, endLine: s.endLine }]
    };
  });
  if (new Set(entries.map((e) => e.id)).size !== entries.length) throw Error('原稿有重複的節號');
  return entries;
}

export function worldview() {
  if (!doc) return null;
  const two = doc.sections.find((s) => s.num === 2);
  return {
    title: doc.title,
    meta: doc.meta,
    logline: two ? firstParagraph(two) : '',
    source: LORE_FILE,
    markdown: source
  };
}
