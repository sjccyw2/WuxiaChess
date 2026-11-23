// Builds a script package: everything a writer (or another LLM) needs to rewrite the story's
// prose, and a way to bring the rewrite back into the game.
//
//   node tools/script-package.mjs                  writes script-package/ from the game's sources
//   node tools/script-package.mjs --apply DIR      reads the edited script files in DIR and writes
//                                                  each changed line back into the game's sources
//   node tools/script-package.mjs --apply DIR --dry   the same, but only reports what would change
//
// Every editable line is a string literal in a game data file. The package lists each one with a
// short id (S001, B001, H001) in a Markdown script, grouped into scenes and labelled with who says
// it and when. manifest.json maps each id to its file, its place in the file (a path such as
// MAZE_TALE.after[2][4].text) and the text as exported. --apply finds the literal by that path in
// the current source, checks it still holds the exported text, and replaces it. Only lines whose
// text changed are touched; nothing else in the source moves.
//
// The hand-written parts of the package (the brief for the editor and the mechanics overview)
// are in tools/script-package/. The two design documents are copied from wiki/content/.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '../wiki/vendor/acorn.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'script-package');
const HAND = path.join(ROOT, 'tools/script-package');
const CJK = /[㐀-鿿]/;
const at = (p) => path.join(ROOT, p);

// ── Reading string literals out of a source file, by path ─────────────────────────────────────

// The positional fields of encounters.js `adversary(...)`.
const ADVERSARY = ['name', 'school', 'book', 'basic', 'skill', 'style', 'visual', 'bio', 'mini', 'robe', 'traits'];

// Every string literal reachable from the named top-level constants, in walk order:
// { path, key, value, start, end, quote, who }. `who` is the `who` of the object holding it.
// An identifier naming another top-level constant of the same file is followed once, under that
// constant's own name, so a shared object (YOUTH_FORGETS) is listed once, where it is first used.
function literals(file, roots) {
  const source = fs.readFileSync(at(file), 'utf8');
  const ast = parse(source, { ecmaVersion: 'latest', sourceType: 'module' });
  const top = new Map();
  for (const node of ast.body) {
    const decl = node.type === 'ExportNamedDeclaration' ? node.declaration : node;
    if (decl?.type === 'VariableDeclaration')
      for (const d of decl.declarations) if (d.id.type === 'Identifier' && d.init) top.set(d.id.name, d.init);
  }
  const out = [],
    seen = new Set(),
    skipped = [];
  const keyOf = (prop) => (prop.key.type === 'Identifier' ? prop.key.name : String(prop.key.value));
  const step = (p, k) => (/^\d+$/.test(k) ? p + '[' + k + ']' : p + '.' + k);
  function visit(node, p, key, who) {
    if (!node) return;
    if (node.type === 'Literal' && typeof node.value === 'string') {
      if (CJK.test(node.value))
        out.push({ path: p, key, value: node.value, start: node.start, end: node.end, quote: source[node.start], who });
    } else if (node.type === 'TemplateLiteral') {
      if (node.expressions.length === 0 && CJK.test(node.quasis[0].value.cooked))
        out.push({ path: p, key, value: node.quasis[0].value.cooked, start: node.start, end: node.end, quote: '`', who });
      else if (node.quasis.some((q) => CJK.test(q.value.cooked))) skipped.push(p);
    } else if (node.type === 'BinaryExpression') {
      if (CJK.test(source.slice(node.start, node.end))) skipped.push(p);
    } else if (node.type === 'ObjectExpression') {
      const whoProp = node.properties.find((q) => q.type === 'Property' && keyOf(q) === 'who');
      const here = whoProp?.value.type === 'Literal' ? whoProp.value.value : undefined;
      for (const prop of node.properties) {
        if (prop.type === 'SpreadElement') visit(prop.argument, p, key, who);
        else if (keyOf(prop) !== 'who') visit(prop.value, step(p, keyOf(prop)), keyOf(prop), here);
      }
    } else if (node.type === 'ArrayExpression') {
      node.elements.forEach((el, i) => visit(el, step(p, String(i)), key, who));
    } else if (node.type === 'Identifier') {
      if (top.has(node.name) && !seen.has(node.name)) {
        seen.add(node.name);
        visit(top.get(node.name), node.name, node.name, undefined);
      }
    } else if (node.type === 'CallExpression') {
      const callee = node.callee.type === 'Identifier' ? node.callee.name : '';
      if (callee === 'adversary') node.arguments.forEach((a, i) => visit(a, step(p, ADVERSARY[i]), ADVERSARY[i], who));
      else if (callee === 'wake') visit(node.arguments[1], p, key, who);
    }
  }
  for (const name of roots) {
    if (!top.has(name)) throw new Error(file + ': no top-level constant ' + name);
    if (seen.has(name)) continue;
    seen.add(name);
    visit(top.get(name), name, name, undefined);
  }
  return { source, list: out, skipped };
}

// ── What goes in the package ──────────────────────────────────────────────────────────────────

// Fields that are names, labels or rule text, never prose to rewrite.
const LOCKED_KEYS = new Set(['name', 'role', 'school', 'book', 'basic', 'skill', 'epithet', 'alias', 'sword', 'file', 'poster', 'portrait', 'picture', 'mini', 'robe', 'style', 'visual', 'skillDesc', 'rules', 'voice', 'boon', 'signature', 'word', 'verb', 'place']);
const LOCKED_PATHS = new Set(['MAZE_TALE.title', 'MAZE_TALE.brief.next', 'MAZE_TALE.finale.name', 'MAZE_TALE.finale.plus.title', 'VISITOR.title']);
const prose = (e) => !LOCKED_KEYS.has(e.key) && !LOCKED_PATHS.has(e.path) && !/\.(name|title)$/.test(e.path.replace(/^WAKES\[\d\]\.title$/, ''));

// Each source file: the constants to read, and which of their strings to export.
const SOURCES = {
  spine: [
    { file: 'game/src/data/maze-tale.js', roots: ['MAZE_TALE', 'SIDE_TALES', 'SIDE_PAY', 'SIDE_MISS'], keep: prose },
    { file: 'game/src/data/wake-tale.js', roots: ['WORLD', 'WAKES', 'NO_MARK', 'CLOSING', 'FRAGMENTS'], keep: prose },
    { file: 'game/src/rules/ferry-market.js', roots: ['VISITOR'], keep: (e) => ['bio', 'arrival', 'reveal', 'blind', 'win'].includes(e.key) }
  ],
  boards: [
    { file: 'game/src/data/maze-tale.js', roots: ['CHAMBER_TALES'], keep: prose },
    { file: 'game/src/data/encounter-script.js', roots: ['ENCOUNTER_SCRIPT'], keep: prose },
    {
      file: 'game/src/data/encounters.js',
      roots: ['ENCOUNTERS', 'RANKS', 'VILLAINS', 'TROOPS'],
      keep: (e) => e.key === 'bio' || /\.phase\.log$/.test(e.path)
    }
  ],
  heroes: [
    { file: 'game/src/data/mastery-catalog.js', roots: ['RECALL_NOTE', 'HERO_PATHS'], keep: (e) => e.key === 'RECALL_NOTE' || e.key === 'origin' },
    // DETAILS also holds the shared black-stone pieces (chief, blade …); only the heroes' bios are here.
    { file: 'game/src/rules/game.js', roots: ['DETAILS'], keep: (e) => e.key === 'bio' && /^DETAILS\.(hero|medic|guard|guo|xiao|duan|youth)\./.test(e.path) },
    { file: 'game/src/data/new-heroes.js', roots: ['NEW_HEROES'], keep: (e) => e.key === 'bio' },
    { file: 'game/src/data/hero-voices.js', roots: ['HERO_VOICES'], keep: prose }
  ]
};

function collect() {
  const lines = { spine: [], boards: [], heroes: [] };
  for (const [layer, sources] of Object.entries(SOURCES))
    for (const src of sources) {
      const { list } = literals(src.file, src.roots);
      for (const e of list) if (src.keep(e)) lines[layer].push({ ...e, file: src.file });
    }
  // Ids are given later, in the order the lines are read in the scripts.
  let n = 0;
  for (const e of Object.values(lines).flat()) {
    e.n = n++;
    if (/[\n\r]/.test(e.value)) throw new Error(e.file + ' ' + e.path + ' holds a line break');
  }
  return lines;
}

// ── Writing the package ───────────────────────────────────────────────────────────────────────

async function build() {
  const G = await import('../game/src/rules/game.js');
  const E = await import('../game/src/data/encounters.js');
  const B = await import('../game/src/data/battles.js');
  const T = await import('../game/src/data/maze-tale.js');
  const W = await import('../game/src/data/wake-tale.js');
  const J = await import('../game/src/rules/journey.js');
  const R = await import('../game/src/data/rule-terms.js');
  const lines = collect();

  const REALM = (i) => '第' + '一二三四五'[i] + '重・' + W.WAKES[i].sword + '境界';
  const heroName = (id) => G.DETAILS[id]?.name || id;
  const villainName = (id) => E.VILLAINS[id]?.name || G.DETAILS[id]?.name || id;
  // Lines kept in the data that the game does not show at present (producer's rulings of 2026-11-23).
  const UNSHOWN = new Set(['MAZE_TALE.inHand', 'MAZE_TALE.deploy']);
  const tag = (e) => '〔@' + e.n + '〕' + e.value;
  const row = (label, e) => '- ' + (label ? '**' + label + (UNSHOWN.has(e.path) ? '（現時遊戲未顯示）' : '') + '**　' : '') + tag(e);
  // Turns the placeholders of one script into ids numbered in reading order.
  const all = Object.values(lines).flat();
  const number = (text, prefix) => {
    let k = 0;
    return text.replace(/〔@(\d+)〕/g, (m, n) => {
      const e = all[+n];
      if (e.id) throw new Error(e.path + ' is listed twice');
      e.id = prefix + String(++k).padStart(3, '0');
      return '〔' + e.id + '〕';
    });
  };

  // Who says a line of the spine.
  function spineSpeaker(e) {
    if (e.key === 'note' || e.key === 'carve' || e.path.startsWith('WORLD') || e.path.startsWith('FRAGMENTS') || e.path.startsWith('CLOSING') || e.path === 'NO_MARK') return '旁白';
    if (e.who) return { youth: '無名', qiu: '求敗', wei: '韋小寶' }[e.who] || e.who;
    const p = e.path;
    if (/^(SIDE_|VISITOR)/.test(p) && e.key !== 'bio' && e.key !== 'arrival') return '韋小寶';
    if (/^MAZE_TALE\.(ruleTold|opened\.text|origins\.tales|recall\.text|packUp\.text)/.test(p)) return '韋小寶';
    if (/^MAZE_TALE\.(ruleRead\.text|command\.text|prologue\.again\.youth|prologue\.shadow\.youth)/.test(p) || /^WAKES\[\d\]\.echo\.text/.test(p)) return '無名';
    if (/^MAZE_TALE\.prologue\.shadow\.reply/.test(p)) return '求敗的影子';
    if (/^MAZE_TALE\.(prologue\.again\.(greeting|reply)|unseen|after|scatter\.text|release\.text|close|finale\.(again|invite|before|after|lost|ending|half))/.test(p)) return '求敗';
    if (/^WAKES\[\d\]\.mark/.test(p)) return '石上刻字';
    if (/^WAKES\[\d\]\.title/.test(p)) return '回目';
    return '旁白';
  }

  // The spine, scene by scene: [heading, explanation, path test].
  const SPINE_SCENES = [
    ['序幕・第一輪', '第一次遊玩。首次進入時先播片頭影片（影片的字幕不在此包內），影片演到「抓三枚」為止，之後少年想不起名字（〈我叫……〉兩句），頁面從標 ★ 的「我不會下棋」接上。影片不能播放時，整段都以頁面顯示。', /^(MAZE_TALE\.prologue\.first|YOUTH_FORGETS|YOUTH_NAMES)/],
    ['序幕・第二輪起', '少年又睡著、又回到棋臺邊。求敗的招呼按玩家所選的境界取一句（第一句為第一重境界，依次類推）。{name} 為少年的名字（無名）。', /^MAZE_TALE\.prologue\.again/],
    ['序幕・勝過終局之後', '終局勝過以後，求敗已撒手而去，棋臺邊只剩他的影子。招呼仍用所選境界那一句。', /^MAZE_TALE\.prologue\.shadow/],
    ['局規與抓子', '刻在棋臺沿上的局規，與抓子頁的旁白：伸手抓五枚、留三枚。', /^MAZE_TALE\.(rule|draw)$/],
    ['第一局之前', '三位俠客入局後、第一局開打之前依次出現：少年唸局規 → 韋小寶說白 → 少年說由他執子 → 韋小寶說「手上最熟的那一樣還在」 → 旁白說「眼」。', /^MAZE_TALE\.(ruleRead|ruleTold|command|recall|deploy)/],
    ['說破：拓來的一份', '第二重境界起，第一局之前多一段：第二、三重由求敗冷冷說破（cold）；第四、五重由少年自己說破（plain）。', /^MAZE_TALE\.told/],
    ['起陣與局中落子', 'inHand：起陣時的提示。clack：求敗局中落子、下一回合來援軍時。clackSave：黑子危急、求敗補一手時。', /^MAZE_TALE\.(inHand|clack|clackSave)/],
    ['通吃坊開張', '第一局勝後，韋小寶擺攤。shop 是戰場紀錄裡的一句；opened 是開張那一幕的旁白與韋小寶的話。', /^MAZE_TALE\.(shop|opened)/],
    ['韋小寶的來歷', '少年問他怎生來的，每一輪說一個不同的大話（按輪次取一句）。', /^MAZE_TALE\.origins/],
    ['求敗瞧不見韋小寶', '少年同韋小寶說話時，求敗按境界各說一句（unseen 第一句為第一重境界）。unseenAgain：無劍境界收局見過韋小寶之後、終局未勝之前。', /^MAZE_TALE\.unseen/],
    ['夜話', '第五局之前，求敗長考，眾人圍燈坐下。少年的開口在下方〈五重境界〉的 echo 一欄；各俠客的回答在俠客劇本。', /^MAZE_TALE\.night/],
    ['求敗每勝一局之後', '按境界分五組，每組九句：第一句是第一局勝後，第九句是第九局勝後（第十局有收局）。他從不點出是哪一局、哪一位俠客。勝過終局之後，說話的是他的影子，旁白裡的「求敗」換成「那道影子」。', /^MAZE_TALE\.after/],
    ['添子', '勝一局（最後一局除外），求敗借出一位新俠客；三句輪用。{hero} 為新俠客的名字。', /^MAZE_TALE\.lend/],
    ['勝局與敗局的過場', 'step：每勝一局，眾人各想起一點。fade：斬將局局主醒來，他帶來的人淡去。scatter：一局落敗，白子收回盒中（兩句擇一）。packUp：落敗時韋小寶收攤。', /^MAZE_TALE\.(step|fade|scatter|packUp)/],
    ['放還', '第十局勝後，依局規放還白子。', /^MAZE_TALE\.release/],
    ['收局', '第十局勝後，求敗說這一輪他看見了甚麼，然後請少年回去。按境界分五組；第五組（無劍境界）他第一次瞧見韋小寶。', /^MAZE_TALE\.close/],
    ['終局', '第五重境界的十局勝完，求敗再留一局：谷底棋臺。again：已到過終局、再到時取代第五組收局。invite：再留一局。before：上盤、開打之前。rally：更多局主搶上他身旁（半血與四分之一血時）。withdraw：他退到眾人身後。half：他半血時說的話。after：勝後、片尾影片之前。lost：終局落敗。ending：片尾影片的字幕（影片不能播放時以頁面顯示；改了這裡，影片不會跟著改）。missed／closed／epilogue：一輪最後一頁。muster：上終局時的戰場紀錄。plus：勝過終局之後「無名入盤」的說明。', /^MAZE_TALE\.finale/],
    ['一輪最後一頁', 'win：十局勝完。winNote：買下的東西寄存。loss：一輪落敗。', /^MAZE_TALE\.(win|winNote|loss)$/],
    ['韋小寶的盤口', '每局的支線是韋小寶另開的盤口。取勝且支線達成時，按支線種類說一句（done 為沒有專屬台詞的種類）；再按賠彩說一句（coins 賞銀、manual 武譜、points 武學點）。SIDE_MISS：局勝了、支線落空。', /^SIDE_/],
    ['三盅通吃', '韋小寶的另一個小攤：有時在局與局之間出現，三隻盅揭一隻。bio 是江湖誌〈江湖人物〉裡他的小傳。', /^VISITOR/],
    ['少年的手記', '少年在棋臺邊自己瞧明白的事，顯示在手記頁。每條的標題不改。', /^WORLD/],
    ['五重境界', '每一重境界一組：title 是這一輪的回目；mark 是勝下這一重時求敗在臺邊石上刻的那一行；echo 是夜話時少年的開口；carve 是勝後旁白說他怎樣刻字。NO_MARK：一輪落敗，石上不添字。', /^(WAKES|NO_MARK)/],
    ['夢醒', '一輪結束，少年醒來。先接 CLOSING 一句（勝：請回吧；敗：盒蓋合上），再接按境界取的一段 FRAGMENTS（第一段為第一重境界）。', /^(CLOSING|FRAGMENTS)/]
  ];
  const realmLabel = (p) => {
    const m = p.match(/^MAZE_TALE\.(after|close|unseen|prologue\.again\.greeting)\[(\d)\]/) || p.match(/^(WAKES|FRAGMENTS)\[(\d)\]/);
    return m ? REALM(+m[2]) : null;
  };

  function spineFile() {
    const out = [header('主線劇本（the spine）', '跟著「一輪中的位置」與「境界」走的台詞：序幕、局規、求敗每局之後的話、收局、終局、夢醒，以及韋小寶的一切。這一層從不點出是哪一局、哪一位俠客。')];
    const used = new Set();
    for (const [title, note, test] of SPINE_SCENES) {
      const list = lines.spine.filter((e) => !used.has(e) && test.test(e.path));
      if (!list.length) continue;
      list.forEach((e) => used.add(e));
      out.push('## ' + title, '', '> ' + note, '');
      let group = null;
      for (const e of list) {
        const g = realmLabel(e.path) || subGroup(e.path);
        if (g !== group) {
          if (g) out.push('', '### ' + g, '');
          else if (group) out.push('', '### 各境界共用', '');
          group = g;
        }
        const film = /prologue\.first\[(\d+)\]/.exec(e.path);
        const star = film && T.MAZE_TALE.prologue.first[+film[1]]?.afterFilm ? '★ ' : '';
        const won = /^MAZE_TALE\.after\[\d\]\[(\d)\]\.text$/.exec(e.path);
        const when = won ? '・第' + '一二三四五六七八九'[+won[1]] + '局勝後' : '';
        out.push(row(star + spineSpeaker(e) + when, e));
      }
      out.push('');
    }
    const rest = lines.spine.filter((e) => !used.has(e));
    if (rest.length) out.push('## 其他', '', ...rest.map((e) => row(spineSpeaker(e), e)), '');
    return out.join('\n');
  }
  // A heading inside a scene for lists that are not by 境界.
  function subGroup(p) {
    const m = p.match(/^MAZE_TALE\.finale\.(\w+)/);
    if (m) return { again: '再到終局（again）', invite: '再留一局（invite）', before: '開打之前（before）', rally: '局中（rally・withdraw・half）', withdraw: '局中（rally・withdraw・half）', half: '局中（rally・withdraw・half）', after: '勝後（after）', lost: '落敗（lost）', ending: '片尾影片的字幕（ending）', missed: '最後一頁（missed・closed・epilogue・muster）', closed: '最後一頁（missed・closed・epilogue・muster）', epilogue: '最後一頁（missed・closed・epilogue・muster）', muster: '最後一頁（missed・closed・epilogue・muster）', plus: '無名入盤（plus）' }[m[1]] || m[1];
    const s = p.match(/^SIDE_(TALES|PAY|MISS)/);
    if (s) return { TALES: '支線達成（按種類）', PAY: '賠彩（按獎賞）', MISS: '支線落空' }[s[1]];
    const w = p.match(/^WAKES\[(\d)\]/);
    if (w) return REALM(+w[1]);
    if (/^MAZE_TALE\.unseenAgain/.test(p)) return '無劍境界收局見過韋小寶之後、終局未勝之前（unseenAgain）';
    if (/^MAZE_TALE\.told\.cold/.test(p)) return '第二、三重境界：求敗說破（cold）';
    if (/^MAZE_TALE\.told\.plain/.test(p)) return '第四、五重境界：少年說破（plain）';
    return null;
  }

  // Boards, one section each, in the order a run meets their tiers.
  function boardsFile() {
    const out = [header('十五局與終局的劇本（the boards）', '每一局自成一場：局主與他身旁的黑子都給求敗按下一道戰意，非打不可，打醒了才散。各局次序每輪打亂，所以一局的台詞絕不提到別的局或它排第幾。')];
    out.push('## 說話的人', '', '- **局主**、**副手**：這一局的黑子頭領。', '- **無名**：少年，在盤外看得見全局。', '- **領隊**、**同行**：這一局出陣的俠客中任一人（隨機抽到誰都要說得通）。若同書的俠客出陣，會換成下方「同書俠客應答」的那一句。', '- 其他名字：求敗另外落在盤上的黑子。', '');
    const order = [0, 1, 2, 10, 3, 4, 11, 5, 6, 12, 7, 13, 8, 14, 9, 15];
    const where = { 0: '必為第一局', 1: '第二、三局之一', 2: '第二、三局之一', 10: '第二、三局之一', 3: '第四、五局之一', 4: '第四、五局之一', 11: '第四、五局之一', 5: '第六、七局之一', 6: '第六、七局之一', 12: '第六、七局之一', 7: '第八局', 13: '第八局', 8: '第九局', 14: '第九局', 9: '必為第十局', 15: '終局（第五重境界十局之後）' };
    const KIND = J.KIND_NAMES;
    const KIND_NOTE = { slay: '擊倒所有局主即勝', rout: '擊倒所有敵人（含援軍）', keep: '守住盤上之物到指定回合，或先擊倒局主', break: '打碎盤上所有之物', yield: '把求敗打到只剩 1 點氣血（他不會倒下）' };
    for (const map of order) {
      const name = T.CHAMBER_TALES[map].name,
        battle = B.BATTLES[map],
        [boss, mini] = E.ENCOUNTERS[map] || [];
      const extras = Object.entries(E.VILLAINS).filter(([, v]) => v.map === map).map(([, v]) => v.name);
      out.push('## ' + name + (boss ? '　局主：' + boss.name : ''), '');
      const facts = [where[map], '勝法：' + KIND[battle.kind] + '（' + KIND_NOTE[battle.kind] + '）'];
      if (mini) facts.push('副手：' + mini.name);
      if (extras.length) facts.push('另有黑子：' + extras.join('、'));
      if (boss?.book) facts.push('出自：' + boss.book);
      out.push('> ' + facts.join('。') + '。', '');
      const speaker = (e) => {
        if (e.key === 'note' || /\.(lost|held)$/.test(e.path)) return '旁白';
        const hl = e.path.match(/\.heroLines\.(\w+)$/);
        if (hl) return heroName(hl[1]) + '（同書俠客應答，取代領隊／同行那一句）';
        const xh = e.path.match(/\.extras\.(\w+)\.heroes\.(\w+)$/);
        if (xh) return heroName(xh[2]) + '（答' + villainName(xh[1]) + '）';
        const xe = e.path.match(/\.extras\.(\w+)\.enter$/);
        if (xe) return villainName(xe[1]) + '（上場時）';
        if (/\.guest$/.test(e.path)) return (boss?.name || '局主') + '（終局時）';
        const w = e.who;
        return { boss: '局主・' + (boss?.name || ''), mini: '副手・' + (mini?.name || ''), youth: '無名', leader: '領隊', ally: '同行', qiu: '求敗', wei: '韋小寶' }[w] || (w ? villainName(w) : '旁白');
      };
      const section = (title, list, label = speaker) => {
        if (!list.length) return;
        out.push('### ' + title, '', ...list.map((e) => row(label(e), e)), '');
      };
      const own = (re) => lines.boards.filter((e) => re.test(e.path));
      section('景象', own(new RegExp('^CHAMBER_TALES\\[' + map + '\\]\\.')), (e) => (e.key === 'arrival' ? '旁白（到局時所見）' : '旁白（勝後景象）'));
      const S = 'ENCOUNTER_SCRIPT\\[' + map + '\\]';
      section('開打之前', own(new RegExp('^' + S + '\\.before')));
      section('同書俠客應答', own(new RegExp('^' + S + '\\.heroLines')));
      section('另落的黑子', own(new RegExp('^' + S + '\\.extras')));
      section('盤上之物', own(new RegExp('^' + S + '\\.objects')), (e) => {
        const m = e.path.match(/\.objects\.(\w+)\.(\w+)/);
        const moment = { hit: '初次受擊', half: '半毀', broken: '毀去', lost: '毀去而敗（旁白）', held: '守到最後（旁白）' }[m[2]] || m[2];
        return speaker(e) + '・' + m[1] + '・' + moment;
      });
      section('勝後', own(new RegExp('^' + S + '\\.win')));
      section('敗後', own(new RegExp('^' + S + '\\.loss')));
      section('終局時（他自己走上谷底棋臺，沒有戰意壓著）', own(new RegExp('^' + S + '\\.guest')));
      // The cast's bios and their 變招 lines.
      const castPaths = [new RegExp('^ENCOUNTERS\\[' + map + '\\]\\['), new RegExp('^RANKS\\[' + map + '\\]\\.')];
      const villainKeys = Object.entries(E.VILLAINS).filter(([, v]) => v.map === map).map(([k]) => k);
      const cast = lines.boards.filter((e) => castPaths.some((re) => re.test(e.path)) || villainKeys.some((k) => e.path.startsWith('VILLAINS.' + k + '.')));
      section('人物小傳與變招', cast, (e) => {
        const who = castWho(e, map);
        return who + (e.key === 'bio' ? '・小傳' : '・變招（半血時的戰場紀錄，數字照舊）');
      });
    }
    const troops = lines.boards.filter((e) => e.path.startsWith('TROOPS.'));
    if (troops.length) {
      out.push('## 雜兵', '', '> 有名有姓的黑子帶上盤來的兵，各局共用。小傳顯示在敵情查探與江湖誌〈群敵錄〉。', '');
      out.push(...troops.map((e) => row(E.TROOPS[e.path.split('.')[1]].name + '・小傳', e)), '');
    }
    return out.join('\n');
  }
  function castWho(e, map) {
    const m = e.path.match(/^ENCOUNTERS\[\d+\]\[(\d)\]/);
    if (m) return E.ENCOUNTERS[map][+m[1]].name + (m[1] === '0' ? '（局主）' : '（副手）');
    const r = e.path.match(/^RANKS\[\d+\]\.(\w+)/);
    if (r) return E.RANKS[map][r[1]].name;
    const v = e.path.match(/^VILLAINS\.(\w+)/);
    if (v) return E.VILLAINS[v[1]].name;
    return '';
  }

  // Heroes: bio and tree origin, then their own six kinds of line.
  function heroesFile() {
    const out = [header('俠客劇本（the heroes）', '跟著人走的話：不論抽到誰、走到哪一局都說得通。一句話裡不可假定還有誰在場、是哪一局。')];
    const recall = lines.heroes.find((e) => e.path === 'RECALL_NOTE');
    if (recall) out.push('## 武學樹上方的總說明', '', '> 為何成名的高手入局時只帶著一招。現時顯示在江湖誌的俠客頁。', '', row('旁白', recall), '');
    const FIELD = {
      bio: '小傳（俠客圖鑑與隊伍頁）',
      origin: '武學樹的入境說明',
      'arrival.note': '入境・旁白',
      'arrival.text': '入境・第一句話（抽到時，或後來借出時）',
      obey: '作領隊時，聽見由少年執子',
      echoes: '似曾相識（第二輪起，到過的局）',
      'night[0]': '夜話・第一重境界：回去要做甚麼',
      'night[1]': '夜話・第二重境界起：得知自己是拓來的一份',
      summit: '想起成名絕學時',
      farewell: '勝滿十局，放還本尊之前'
    };
    const label = (e) => {
      const p = e.path;
      if (e.key === 'bio') return FIELD.bio;
      if (e.key === 'origin') return FIELD.origin;
      const m = p.match(/^HERO_VOICES\.\w+\.(.+)$/)[1];
      return FIELD[m] || FIELD[m.replace(/\[\d+\]$/, '')] || m;
    };
    const ids = [...G.PARTY, 'youth'];
    for (const id of ids) {
      const d = G.DETAILS[id];
      const mine = lines.heroes.filter((e) => new RegExp('^(DETAILS|NEW_HEROES|HERO_PATHS|HERO_VOICES)\\.' + id + '\\.').test(e.path));
      if (!mine.length) continue;
      out.push('## ' + d.name + (d.epithet ? '・' + d.epithet : ''), '', '> 出自《' + (G.BOOKS[id] || d.book || '').replace(/、/g, '》《') + '》。' + (id === 'youth' ? '少年在終局與「無名入盤」時才上盤；他沒有俠客層的台詞，他的話都在主線。' : ''), '');
      out.push(...mine.map((e) => row(label(e), e)), '');
    }
    return out.join('\n');
  }

  function header(title, lead) {
    return ['# ' + title, '', lead, '', '格式：每一行 `〔編號〕` 之後到行尾是可改的文字；編號與編號之前的標籤不可改。詳見 README。', ''].join('\n');
  }

  // The glossary of rule words, from the game's own table.
  function glossary() {
    const out = ['', '## Appendix: rule words as the game states them (rule-terms.js)', '', 'These are the in-game definitions, one sentence each. They are not part of the script and are not to be edited here; they are listed so the writer knows what a word in a line refers to.', ''];
    for (const g of R.RULE_GROUPS) {
      out.push('### ' + g.title, '');
      for (const t of g.terms) out.push('- **' + t.name + '**：' + t.text + '。');
      out.push('');
    }
    out.push('## Appendix: the in-game guide', '');
    for (const [, title, text] of R.guideEntries()) out.push('**' + title + '**　' + text, '');
    return out.join('\n');
  }

  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  const write = (name, text) => fs.writeFileSync(path.join(OUT, name), text.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n');
  const counts = Object.fromEntries(Object.entries(lines).map(([k, v]) => [k, v.length]));
  const total = counts.spine + counts.boards + counts.heroes;
  const chars = Object.values(lines).flat().reduce((n, e) => n + e.value.length, 0);
  write('README.md', fs.readFileSync(path.join(HAND, 'brief.md'), 'utf8').replace('{{COUNTS}}', 'S' + '001–S' + String(counts.spine).padStart(3, '0') + ' (' + counts.spine + ' lines), B001–B' + String(counts.boards).padStart(3, '0') + ' (' + counts.boards + '), H001–H' + String(counts.heroes).padStart(3, '0') + ' (' + counts.heroes + '): ' + total + ' lines, about ' + Math.round(chars / 1000) + ',000 characters'));
  write('01-世界觀設定.md', fs.readFileSync(at('wiki/content/世界觀設定.md'), 'utf8'));
  write('02-單輪劇本.md', fs.readFileSync(at('wiki/content/單輪劇本.md'), 'utf8'));
  write('03-遊戲機制.md', fs.readFileSync(path.join(HAND, 'mechanics.md'), 'utf8') + glossary());
  write('10-主線劇本.md', number(spineFile(), 'S'));
  write('11-各局劇本.md', number(boardsFile(), 'B'));
  write('12-俠客劇本.md', number(heroesFile(), 'H'));
  const lost = all.filter((e) => !e.id);
  if (lost.length) throw new Error('not placed in any script: ' + lost.map((e) => e.file + ' ' + e.path).join(', '));
  all.sort((a, b) => (a.id < b.id ? -1 : 1));
  const manifest = {
    note: 'Maps each 〔id〕 in 10–12 to the string literal it came from. Used by `node tools/script-package.mjs --apply`. Editors: do not change this file.',
    made: new Date().toISOString().slice(0, 10),
    lines: all.map((e) => ({ id: e.id, file: e.file, path: e.path, text: e.value }))
  };
  write('manifest.json', JSON.stringify(manifest, null, 1));
  // Every exported id must appear exactly once in the scripts.
  const scripts = ['10-主線劇本.md', '11-各局劇本.md', '12-俠客劇本.md'].map((f) => fs.readFileSync(path.join(OUT, f), 'utf8')).join('\n');
  for (const e of manifest.lines) {
    const n = scripts.split('〔' + e.id + '〕').length - 1;
    if (n !== 1) throw new Error(e.id + ' appears ' + n + ' times in the scripts');
  }
  console.log('script-package/: ' + total + ' editable lines (spine ' + counts.spine + ', boards ' + counts.boards + ', heroes ' + counts.heroes + '), ' + chars + ' characters.');
}

// ── Bringing an edited package back ───────────────────────────────────────────────────────────

const quoteAs = (text, quote) => {
  if (quote === '`') return '`' + text.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${') + '`';
  const q = quote === '"' ? '"' : "'";
  return q + text.replace(/\\/g, '\\\\').replace(new RegExp(q, 'g'), '\\' + q) + q;
};
const slots = (text) => (text.match(/\{\w+\}/g) || []).sort().join(' ');

function apply(dir, dry) {
  const manifestFile = fs.existsSync(path.join(dir, 'manifest.json')) ? path.join(dir, 'manifest.json') : path.join(OUT, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  const byId = new Map(manifest.lines.map((e) => [e.id, e]));
  const edited = new Map(),
    problems = [];
  const files = fs.readdirSync(dir).filter((f) => /\.(md|txt)$/.test(f) && f !== 'README.md');
  for (const f of files)
    fs.readFileSync(path.join(dir, f), 'utf8')
      .split('\n')
      .forEach((line, n) => {
        for (const m of line.matchAll(/〔([SBH]\d{3,})〕/g)) {
          const id = m[1];
          const rest = line.slice(m.index + m[0].length);
          const text = rest.split(/〔[SBH]\d{3,}〕/)[0].trim();
          if (!byId.has(id)) problems.push(f + ':' + (n + 1) + ' unknown id ' + id);
          else if (edited.has(id) && edited.get(id) !== text) problems.push(id + ' appears twice with different text');
          else edited.set(id, text);
        }
      });
  const missing = manifest.lines.filter((e) => !edited.has(e.id)).map((e) => e.id);
  const changes = [];
  for (const [id, text] of edited) {
    const e = byId.get(id);
    if (text === e.text) continue;
    if (!text) problems.push(id + ' is empty: kept as it was');
    else if (slots(text) !== slots(e.text)) problems.push(id + ' placeholders changed (' + (slots(e.text) || 'none') + ' → ' + (slots(text) || 'none') + '): kept as it was');
    else changes.push({ ...e, next: text });
  }
  // Group by file and replace from the end so earlier offsets hold.
  const byFile = new Map();
  for (const c of changes) byFile.set(c.file, [...(byFile.get(c.file) || []), c]);
  let applied = 0;
  for (const [file, list] of byFile) {
    const roots = [...new Set(list.map((c) => c.path.match(/^[A-Z_]+/)[0]))];
    const { source, list: found } = literals(file, roots);
    const at2 = new Map(found.map((e) => [e.path, e]));
    const edits = [];
    for (const c of list) {
      const lit = at2.get(c.path);
      if (!lit) problems.push(c.id + ' ' + c.path + ' is no longer in ' + file + ': not applied');
      else if (lit.value !== c.text) problems.push(c.id + ' ' + c.path + ' has changed in ' + file + ' since the package was made: not applied');
      else edits.push({ ...lit, next: c.next, id: c.id });
    }
    edits.sort((a, b) => b.start - a.start);
    let text = source;
    for (const e of edits) text = text.slice(0, e.start) + quoteAs(e.next, e.quote) + text.slice(e.end);
    if (!dry && edits.length) fs.writeFileSync(at(file), text);
    applied += edits.length;
    console.log((dry ? 'would change ' : 'changed ') + edits.length + ' line(s) in ' + file);
  }
  if (missing.length) console.log(missing.length + ' id(s) not found in the edited files (left as they are): ' + missing.slice(0, 20).join(' ') + (missing.length > 20 ? ' …' : ''));
  for (const p of problems) console.log('! ' + p);
  console.log((dry ? 'Dry run: ' : '') + applied + ' of ' + changes.length + ' changed line(s) ' + (dry ? 'would be' : 'were') + ' written back.' + (applied && !dry ? ' Now run node tools/check-story.mjs, node tools/check-wiki.mjs and python3 tools/extra-fonts.py --check.' : ''));
  if (problems.length) process.exitCode = 1;
}

const args = process.argv.slice(2);
const i = args.indexOf('--apply');
if (i >= 0) {
  if (!args[i + 1]) throw new Error('--apply needs the folder that holds the edited scripts');
  apply(path.resolve(args[i + 1]), args.includes('--dry'));
} else await build();
