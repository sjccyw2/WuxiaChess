// Saves a contact sheet of each character's sprite sheet as the game draws it on a real board:
// every frame of every row, with outline, beside a piece already in the game for scale. Uses
// tools/roster-preview.html.
//
//   node tools/shoot-roster.mjs <output folder> [--ids a,b] [--beside chief] [--map 0]
//                               [--size 1440x900] [--mobile] [--zoom 2.2] [--side enemy]
//
// For each id it writes roster-<id>.png: five rows (idle, walk, strike, hurt, special) of eight
// frames, cut from the screen at the given zoom with the piece on the right and the --beside
// piece on its left; then board-<row>.png: the whole screen at the game's opening zoom with
// every id standing on the board, in the middle frame of each row. It needs Playwright with
// Chromium, and no web server. Page errors are printed and make the script exit with a failure.
import { mkdirSync, existsSync, statSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'http://wuxiachess.preview';
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.woff2': 'font/woff2'
};

const args = process.argv.slice(2);
const flag = (name, fallback = null) => {
  const i = args.indexOf('--' + name);
  return i >= 0 ? args[i + 1] : fallback;
};
const out = args[0];
if (!out || out.startsWith('--')) {
  console.error('usage: node tools/shoot-roster.mjs <output folder> [--ids a,b] [--beside chief]');
  process.exit(2);
}
const ids = flag('ids', '').split(',').filter(Boolean),
  beside = flag('beside', 'chief'),
  map = Number(flag('map', 0)),
  zoom = Number(flag('zoom', 2.2)),
  side = flag('side', 'enemy'),
  mobile = args.includes('--mobile'),
  [width, height] = flag('size', mobile ? '390x844' : '1440x900').split('x').map(Number);
const ROWS = ['idle', 'walk', 'strike', 'hurt', 'special'];

mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width, height },
  deviceScaleFactor: mobile ? 2 : 1,
  isMobile: mobile,
  hasTouch: mobile
});
const page = await context.newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(String(e.stack || e)));
page.on('console', (m) => {
  if (m.type() === 'error') problems.push(m.text());
});
await context.route(origin + '/**', (route) => {
  const path = normalize(join(root, decodeURIComponent(new URL(route.request().url()).pathname)));
  if (!path.startsWith(root) || !existsSync(path) || !statSync(path).isFile())
    return route.fulfill({ status: 404, body: 'not found' });
  return route.fulfill({ path, contentType: types[extname(path)] || 'application/octet-stream' });
});
await page.goto(`${origin}/tools/roster-preview.html?map=${map}&row=0&frame=0`);
await page.waitForFunction(() => window.preview?.ready, null, { timeout: 60000 });

// Puts pieces on the board, waits for their sheets and one frame of scenery.
async function stand(options) {
  await page.evaluate((o) => window.preview.show(o), options);
  await page
    .waitForFunction(
      () => [...window.preview.board.layers.images.values()].every((image) => image.complete),
      null,
      { timeout: 30000 }
    )
    .catch(() => {});
  await settle();
}
// Draws a pose and waits until it is on screen.
async function pose(row, frame) {
  await page.evaluate(([row, frame]) => window.preview.pose(row, frame), [row, frame]);
  await settle();
}
const settle = () =>
  page.evaluate(
    () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(() => done())))
  );

// One contact sheet per character: the piece beside the reference, close up.
for (const id of ids) {
  await stand({ ids: [beside, id], side, row: 0, frame: 0, zoom: 1, tile: null });
  const [a, b] = await page.evaluate(() => window.preview.state.units.map((u) => [u.x, u.y]));
  await stand({ tile: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], zoom });
  const r = await page.evaluate(() => window.preview.box());
  const clip = {
    x: Math.max(0, Math.floor(r.left)),
    y: Math.max(0, Math.floor(r.top)),
    width: Math.min(width, Math.ceil(r.right)) - Math.max(0, Math.floor(r.left)),
    height: Math.min(height, Math.ceil(r.bottom)) - Math.max(0, Math.floor(r.top))
  };
  const cells = [];
  for (let row = 0; row < ROWS.length; row++)
    for (let frame = 0; frame < 8; frame++) {
      await pose(row, frame);
      cells.push((await page.screenshot({ clip })).toString('base64'));
    }
  const file = join(out, `roster-${id}.png`);
  await sheet(cells, clip, file, `${id} beside ${beside}`);
  console.log(file);
}

// The whole board at the opening zoom, every id standing on it.
if (ids.length) {
  await stand({ ids: [beside, ...ids], side, row: 0, frame: 0, zoom: 1, tile: null });
  for (let row = 0; row < ROWS.length; row++) {
    await pose(row, 4);
    const file = join(out, `board-${row}-${ROWS[row]}.png`);
    await page.screenshot({ path: file });
    console.log(file);
  }
}

// Lays the cut-outs in a grid of five rows of eight, labelled.
async function sheet(cells, clip, file, title) {
  const w = clip.width,
    h = clip.height;
  // Its own page, not a phone's, so the grid is laid out at exactly the size of its cut-outs.
  const grid = await browser.newPage({
    viewport: { width: 8 * w + 60, height: 100 },
    deviceScaleFactor: mobile ? 2 : 1
  });
  await grid.setContent(
    `<style>body{margin:0;background:#111;color:#ddd;font:12px monospace}
    div{display:grid;grid-template-columns:60px repeat(8,${w}px)}
    img{width:${w}px;height:${h}px;display:block}span{padding:4px}</style>
    <p style="margin:4px">${title}</p><div>` +
      cells
        .map(
          (data, i) =>
            (i % 8 ? '' : `<span>${ROWS[i / 8]}</span>`) +
            `<img src="data:image/png;base64,${data}">`
        )
        .join('') +
      '</div>'
  );
  await grid.screenshot({ path: file, fullPage: true });
  await grid.close();
}

await browser.close();
if (problems.length) {
  console.error('Page errors:\n' + [...new Set(problems)].join('\n'));
  process.exit(1);
}
