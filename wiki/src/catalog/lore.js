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
const RUN_SECTIONS = {
  0: ['scope', '協作須知', '這份文件管甚麼、不管甚麼，對世界觀設定作了哪兩處更動，以及現有版本有哪些玩法原樣沿用。'],
  1: ['loop', '核心設定', '一輪遊戲的故事梗概，與四條設計原則。'],
  2: ['memory', '核心設定', '新的記憶規則：人每輪都忘，劍境卻留著痕。誰記得多少，似曾相識是甚麼、不是甚麼。'],
  3: ['boy', '核心設定', '玩家角色：不知道自己是誰的少年。名字的由來，為何由他號令，領隊為何是「眼」。'],
  4: ['motive', '核心設定', '英雄、少年、局主與劍仙，各自在一輪之內非走下去不可的理由，以及每一局裡要救的「局中影」。'],
  5: ['flow', '流程', '一輪從醒來到留痕的十一個段落，逐段對應現有環節，附開場與夜話的示例對白。'],
  6: ['arrivals', '人物與十局', '現有十位英雄各自從原著哪一瞬被請來、以為自己在哪裡、回去要面對甚麼。'],
  7: ['boards', '人物與十局', '現有十張地圖與十組局主各代表哪一種「執」，每局待救的是誰，哪三局對少年特別要緊。'],
  8: ['dejavu', '輪迴', '似曾相識何時出現、一輪出現多少，以及十位英雄各自的說法。'],
  9: ['endings', '輪迴', '勝與敗兩種結尾、少年留在石上的五道記號，以及第五輪起的抉擇。'],
  10: ['ladder', '輪迴', '劇中人每輪都忘，玩家卻越看越懂：逐輪多出甚麼，與五卷主線如何分工。'],
  11: ['mapping', '機制', '現有每一項機制的新說法、世界內的解釋，以及要改的是文字、美術還是程式。'],
  12: ['art', '美術', '這套故事需要新畫的圖，各用在哪裡、甚麼尺寸。'],
  13: ['open', '未定案', '要請製作人拿主意的問題。'],
  14: ['terms', '名詞表', '本文件在世界觀名詞表之外新增的用語。']
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
    note: '一輪遊戲裡發生的故事，逐項對應現有機制。提案稿，內含全部主線真相。',
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
