// Finds every piece of player-facing Chinese text in one game source file.
//
// JavaScript files are parsed properly (vendor/acorn.js) so each string comes with the
// line it is written on and the function or data table it belongs to. Text joined with
// values at run time ('獲得 ' + n + ' 點歷練。') is kept as one line with 〔　〕 where a
// value goes.
import { parse } from '../../vendor/acorn.js';

export const SLOT = '〔　〕';
const CJK = /[㐀-鿿]/;
const TAG = /<[^>]*>/g;

// One entry per piece of text: {text, kind, line, endLine, context}.
export function extract(file, source) {
  return file.endsWith('.html') ? fromHtml(source) : fromScript(source);
}

function tidy(text) {
  return text.replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}
// A built string may carry markup. Each run of text between tags is its own line, and so
// is each label written into an attribute that players see or hear.
const LABEL = /\s(?:aria-label|title|alt|placeholder)="([^"]*)"/g;
function pieces(text) {
  const labels = text.includes('<') || text.includes('="') ? [...text.matchAll(LABEL)].map((m) => m[1]) : [];
  return [...labels, ...text.replace(LABEL, ' ').split(TAG)].map(tidy).filter((part) => CJK.test(part));
}
const kindOf = (text) => (text.includes(SLOT) ? '動態模板' : '原文');

function fromHtml(source) {
  const out = [],
    body = source.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/g, (m) =>
      m.replace(/[^\n]/g, ' ')
    );
  const lineOf = (index) => body.slice(0, index).split('\n').length;
  const add = (text, index) => {
    const clean = tidy(text);
    if (CJK.test(clean)) out.push({ text: clean, kind: '原文', line: lineOf(index), endLine: lineOf(index), context: 'index' });
  };
  // Attribute values, then the text between tags.
  for (const m of body.matchAll(/\s(?:aria-label|title|alt|placeholder|content)="([^"]*)"/g))
    add(m[1], m.index);
  for (const m of body.matchAll(/>([^<>]+)</g)) add(m[1], m.index + 1);
  return out.sort((a, b) => a.line - b.line);
}

function fromScript(source) {
  const ast = parse(source, { ecmaVersion: 'latest', sourceType: 'module', locations: true });
  const out = [];
  const emit = (text, node, context, last = node) => {
    for (const part of pieces(text))
      if (part.replaceAll(SLOT, '').trim())
        out.push({ text: part, kind: kindOf(part), line: node.loc.start.line, endLine: last.loc.end.line, context });
  };

  // a + b + c, flattened left to right.
  const chain = (node, list = []) => {
    if (node.type === 'BinaryExpression' && node.operator === '+') {
      chain(node.left, list);
      chain(node.right, list);
    } else list.push(node);
    return list;
  };
  const isText = (node) => node.type === 'Literal' && typeof node.value === 'string';
  const templateText = (node) =>
    node.quasis.map((q, i) => q.value.cooked + (i < node.expressions.length ? SLOT : '')).join('');

  function visit(node, trail) {
    if (!node || typeof node.type !== 'string') return;
    const context = trail.join(' / ') || 'module';

    if (node.type === 'BinaryExpression' && node.operator === '+') {
      const parts = chain(node);
      if (parts.some((p) => isText(p) || p.type === 'TemplateLiteral')) {
        const text = parts
          .map((p) => (isText(p) ? p.value : p.type === 'TemplateLiteral' ? templateText(p) : SLOT))
          .join('');
        if (CJK.test(text)) emit(text, parts[0], context, parts[parts.length - 1]);
        // Strings tucked inside the joined values are separate lines of their own.
        for (const p of parts) {
          if (p.type === 'TemplateLiteral') p.expressions.forEach((e) => visit(e, trail));
          else if (!isText(p)) visit(p, trail);
        }
        return;
      }
    }
    if (isText(node)) {
      if (CJK.test(node.value)) emit(node.value, node, context);
      return;
    }
    if (node.type === 'TemplateLiteral') {
      const text = templateText(node);
      if (CJK.test(text)) emit(text, node, context);
      node.expressions.forEach((e) => visit(e, trail));
      return;
    }
    if (node.type === 'ImportDeclaration') return;

    for (const [key, value] of Object.entries(node)) {
      if (key === 'loc' || key === 'type' || !value || typeof value !== 'object') continue;
      if (Array.isArray(value)) value.forEach((child, i) => visit(child, step(node, key, child, i, trail)));
      else visit(value, step(node, key, value, null, trail));
    }
  }

  // The name that locates a child: a function, a declared table, a key or an index.
  const named = (key) => (key.type === 'Identifier' ? key.name : String(key.value));
  function step(parent, key, child, index, trail) {
    if (!child || typeof child.type !== 'string') return trail;
    const last = trail[trail.length - 1],
      join = (suffix) => [...trail.slice(0, -1), (last ?? '') + suffix];
    if (child.type === 'FunctionDeclaration' && child.id) return [...trail, child.id.name];
    if (child.type === 'VariableDeclarator' && child.id.type === 'Identifier') return [...trail, child.id.name];
    if (child.type === 'MethodDefinition' && !child.computed) return [...trail, named(child.key)];
    if (child.type === 'ClassDeclaration' && child.id) return [...trail, child.id.name];
    if (child.type === 'Property' && !child.computed && trail.length) return join('.' + named(child.key));
    if (parent.type === 'ArrayExpression' && trail.length) return join('[' + index + ']');
    return trail;
  }

  visit(ast, []);
  return out;
}
