// Saves pictures of one battlefield from a set of camera angles, using tools/map-preview.html.
//
//   node tools/shoot-map.mjs <map 0-9> <output folder> [--bare] [--size 1440x900]
//                            [--only name,name] [--view name:yaw:pitch:zoom[:x,y]]
//
// It needs Playwright with Chromium, and no web server: the page's requests are answered
// straight from the files of this checkout. Each picture is named map-<n>-<view>.png and the
// line printed beside it gives the draw calls and triangles of that frame. Page errors are
// printed and make the script exit with a failure, so a broken scenery module is noticed.
//
// --view adds a camera of your own, e.g. --view gate:2.2:0.5:2:9,3 looks at tile 9,3 from
// yaw 2.2, pitch 0.5, zoom 2. It may be given more than once.
import { mkdirSync, existsSync, statSync } from 'node:fs';
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
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

const args = process.argv.slice(2);
const flags = (name) => args.flatMap((a, i) => (a === '--' + name ? [args[i + 1]] : []));
const flag = (name, fallback = null) => flags(name)[0] ?? fallback;
const map = Number(args[0]),
  out = args[1];
if (!Number.isInteger(map) || map < 0 || map > 9 || !out || out.startsWith('--')) {
  console.error('usage: node tools/shoot-map.mjs <map 0-9> <output folder> [--bare] [--only a,b]');
  process.exit(2);
}
const bare = args.includes('--bare'),
  [width, height] = flag('size', '1440x900').split('x').map(Number),
  only = flag('only')?.split(',');

// The game opens on `opening`; the others are what a player sees by turning and zooming.
const views = [
  ['opening', {}],
  ['turn-east', { yaw: 0.69 + Math.PI / 2 }],
  ['turn-back', { yaw: 0.69 + Math.PI }],
  ['turn-west', { yaw: 0.69 - Math.PI / 2 }],
  ['low', { pitch: 0.42 }],
  ['low-back', { pitch: 0.42, yaw: 0.69 + Math.PI }],
  ['overhead', { pitch: 1.33 }],
  ['wide', { zoom: 0.78 }],
  ['close', { zoom: 2.0 }],
  // The title screen stands on the first battlefield, seen from a low camera.
  ...(map === 0 ? [['title', { title: '' }]] : [])
].filter(([name]) => !only || only.includes(name));
for (const spec of flags('view')) {
  const [name, yaw, pitch, zoom, tile] = spec.split(':');
  const view = {};
  if (yaw) view.yaw = yaw;
  if (pitch) view.pitch = pitch;
  if (zoom) view.zoom = zoom;
  if (tile) view.tile = tile;
  views.push([name, view]);
}

mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
const problems = [];
page.on('pageerror', (e) => problems.push(String(e.stack || e)));
page.on('console', (m) => {
  if (m.type() === 'error') problems.push(m.text());
});
await page.route(origin + '/**', (route) => {
  const path = normalize(join(root, decodeURIComponent(new URL(route.request().url()).pathname)));
  if (!path.startsWith(root) || !existsSync(path) || !statSync(path).isFile())
    return route.fulfill({ status: 404, body: 'not found' });
  return route.fulfill({ path, contentType: types[extname(path)] || 'application/octet-stream' });
});
for (const [name, view] of views) {
  const query = new URLSearchParams({ map, ...view });
  if (bare) query.set('bare', '');
  await page.goto(`${origin}/tools/map-preview.html?${query}`);
  await page.waitForFunction(() => window.preview?.ready, null, { timeout: 60000 });
  await page.evaluate(
    () =>
      new Promise((done) => {
        const { board } = window.preview;
        let frames = 0;
        const tick = () => {
          board.changed();
          if (++frames < 4) requestAnimationFrame(tick);
          else setTimeout(done, 250);
        };
        requestAnimationFrame(tick);
      })
  );
  const info = await page.evaluate(() => {
    const { board } = window.preview;
    const r = board.renderer?.info;
    return {
      webgl: Boolean(board.renderer),
      calls: r?.render.calls,
      triangles: r?.render.triangles,
      geometries: r?.memory.geometries
    };
  });
  const file = join(out, `map-${map}-${name}.png`);
  await page.screenshot({ path: file });
  console.log(file, JSON.stringify(info));
}
await browser.close();
if (problems.length) {
  console.error('Page errors:\n' + [...new Set(problems)].join('\n'));
  process.exit(1);
}
