// 遊戲原文: every line of text the game can show, gathered from its source files as they
// are right now. Nothing here is saved between visits.
import * as G from '../game-data.js';
import { sourceFiles, sourceText } from '../sources.js';
import { extract } from './extract.js';
import { GROUPS, FILE_GROUP, PLACES } from './sections.js';

const STORY = '劇情、對白與旁白',
  ATLAS = '地圖與地形';
const SCENE_PARTS = {
  before: '戰前',
  win: '勝後',
  loss: '敗後',
  heroLines: '指定俠客應答'
};
const rootOf = (context) => context.split(' / ')[0].split(/[.[]/)[0];

// [group, heading] for a line found at `context` in `file`.
export function classify(file, context) {
  // Per-stop tables are named after the stop, whatever it is called today.
  const scene = context.match(/^ENCOUNTER_SCRIPT\[(\d+)\]\.(\w+)/);
  if (scene) return [STORY, G.mapLayout(+scene[1]).name + '・' + (SCENE_PARTS[scene[2]] || scene[2])];
  const field = context.match(/^fields\[(\d+)\]/);
  if (field) return [ATLAS, G.mapLayout(+field[1]).name];

  const places = PLACES[file] || {};
  return (
    places[context] ||
    places[rootOf(context)] || [FILE_GROUP[file] || GROUPS[GROUPS.length - 1], rootOf(context)]
  );
}

// A short, stable id for a line of text, so links to it survive reloads.
function textId(text) {
  let a = 0xdeadbeef,
    b = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    a = Math.imul(a ^ c, 2654435761);
    b = Math.imul(b ^ c, 1597334677);
  }
  a = Math.imul(a ^ (a >>> 16), 2246822507) ^ Math.imul(b ^ (b >>> 13), 3266489909);
  b = Math.imul(b ^ (b >>> 16), 2246822507) ^ Math.imul(a ^ (a >>> 13), 3266489909);
  return 'txt-' + (b >>> 0).toString(16).padStart(8, '0') + (a >>> 0).toString(16).padStart(8, '0');
}

export function buildCorpus() {
  const byText = new Map();
  for (const file of sourceFiles()) {
    let found;
    try {
      found = extract(file, sourceText(file));
    } catch (error) {
      console.warn('遊戲原文：無法解析 ' + file, error);
      continue;
    }
    for (const line of found) {
      const [group, section] = classify(file, line.context);
      const ref = { file, line: line.line, endLine: line.endLine, context: line.context, group, section };
      const entry = byText.get(line.text);
      if (entry) entry.refs.push(ref);
      else byText.set(line.text, { id: textId(line.text), group, section, text: line.text, kind: line.kind, refs: [ref] });
    }
  }
  const entries = [...byText.values()];
  const groups = Object.fromEntries(GROUPS.map((g) => [g, 0]));
  for (const entry of entries) {
    entry.groups = [...new Set(entry.refs.map((r) => r.group))];
    entry.sections = [...new Set(entry.refs.map((r) => r.section))];
    for (const g of entry.groups) groups[g] = (groups[g] || 0) + 1;
  }
  return { language: 'zh-Hant', placeholders: '〔　〕標出執行時填入的人名、數值及其他文字。', groups, entries };
}
