// Screenshot the main screens of Dragon Isles at iPhone size, with a rich test save.
// Usage: node tools/shots.mjs [out-dir]   (run from the repo root)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.resolve(process.argv[2] || 'shots');
fs.mkdirSync(out, { recursive: true });

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  ({ chromium } = createRequire(import.meta.url)('/opt/node-tools/node_modules/playwright'));
}

// Tiny static server for the repo, so tools/gallery.html can import docs/js.
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => {
  const file = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('dialog', (d) => d.accept());
const shot = async (name) => {
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(out, `${name}.png`) });
  console.log('wrote', `${name}.png`);
};
const closeAll = async () => {
  while (await page.locator('.sheet').count()) {
    await page.locator('.sheet-x').click({ force: true });
    await page.waitForTimeout(150);
  }
};

await page.goto(`${base}/docs/index.html`);
await page.waitForTimeout(800);
await shot('01-new-game');

// A mid-game island: several habitats with dragons, farms, eggs and breeding.
await page.evaluate(async () => {
  const G = await import('/docs/js/game.js');
  const S = G.S;
  Object.assign(S.player, { level: 22, gold: 900000, food: 90000, gems: 300 });
  S.expansions = 2;
  S.daily.loginClaimed = true;
  S.buildings.find((b) => b.type === 'sanctuary').level = 1;
  const now = Date.now();
  [['earth', 2], ['plant', 5], ['water', 6], ['storm', 7], ['ice', 8]].forEach(([e, plot], i) =>
    S.buildings.push({ id: 900 + i, type: 'habitat', element: e, level: i % 3, stored: 300, last: now - 600000, plot }));
  S.buildings.push({ id: 950, type: 'farm', crop: { id: 'wheat', readyAt: now + 100000 }, plot: 9 });
  S.buildings.push({ id: 951, type: 'farm', crop: { id: 'berries', readyAt: now - 1 }, plot: 10 });
  S.buildings.push({ id: 952, type: 'totem', plot: 11 });
  S.wish = 'celestia';
  S.buildings.push({ id: 953, type: 'deco', deco: 'fountain', plot: 12 });
  S.buildings.push({ id: 954, type: 'habitat', element: 'mystic', level: 2, stored: 0, last: now, plot: 13 });
  const put = (sp, hab, lvl) => {
    S.dragons.push({ uid: S.nextId++, sp, lvl, hab });
    S.book[sp] = 2;
  };
  const fire = S.buildings.find((b) => b.type === 'habitat' && b.element === 'fire');
  put('emberjaw', fire.id, 12); put('magmaw', fire.id, 6);
  put('boulderhorn', 900, 15); put('orecrusher', 900, 3);
  put('mossback', 901, 9); put('ashbloom', 901, 20);
  put('tidefin', 902, 10); put('abyssal', 902, 2);
  put('sparkwing', 903, 14); put('aurora', 903, 11);
  put('rimeclaw', 904, 8);
  put('celestia', 954, 30); put('nyxara', 954, 25);
  put('volcanyx', null, 18); put('primordius', null, 35);
  S.eggs.push({ uid: S.nextId++, sp: 'volcanyx', readyAt: now + 50000 });
  S.breeding.push({ uid: S.nextId++, a: S.dragons[0].uid, b: S.dragons[1].uid, sp: 'steamcoil', readyAt: now + 60000 });
  G.changed();
});
await page.waitForTimeout(1200);
await shot('02-island');
await page.mouse.move(195, 420);
for (let i = 0; i < 6; i++) await page.mouse.wheel(0, -100);
await shot('03-island-zoomed');
for (let i = 0; i < 12; i++) await page.mouse.wheel(0, 100);
await shot('04-island-zoomed-out');
for (let i = 0; i < 6; i++) await page.mouse.wheel(0, -100);

const open = async (type) => {
  // Click the building directly, whatever bubbles or neighbours overlap it at this zoom.
  await page.evaluate(async (t) => {
    const plot = (await import('/docs/js/game.js')).buildingsOf(t)[0].plot;
    document.querySelector(`#slot-${plot} .hit`).dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }, type);
};
await open('habitat');
await shot('05-habitat-sheet');
await closeAll();
await open('sanctuary');
await page.locator('[data-act=pick-parent][data-k=a]').click();
await page.locator('[data-act=set-parent]').first().click();
await page.locator('[data-act=pick-parent][data-k=b]').click();
await page.locator('[data-act=set-parent]').nth(1).click();
await shot('06-breeding');
await closeAll();

await page.locator('[data-tab=dragons]').click();
await shot('07-dragons');
await page.locator('[data-act=dragon]').first().click();
await shot('08-dragon-detail');
await closeAll();
await page.locator('[data-tab=book]').click();
await shot('09-book');
await page.locator('[data-tab=battle]').click();
await shot('10-battle-modes');
await page.locator('[data-act=mode][data-mode=campaign]').click();
await page.locator('[data-act=stage]').first().click();
await page.locator('[data-act=pick-team]').click();
await page.locator('[data-act=fight]').click();
await page.waitForTimeout(400);
await page.locator('.move').first().click();
await page.waitForTimeout(350);
await shot('11-battle');
await page.locator('[data-act=forfeit]').click();
await page.locator('[data-act=battle-exit]').click();
await page.locator('[data-tab=shop]').click();
await shot('12-shop');

// Every dragon, adults then the three growth stages of a few.
const gallery = await ctx.newPage();
await gallery.setViewportSize({ width: 1400, height: 900 });
await gallery.goto(`${base}/tools/gallery.html?cols=10`);
await gallery.waitForTimeout(800);
await gallery.screenshot({ path: path.join(out, '13-all-dragons.png'), fullPage: true });
console.log('wrote 13-all-dragons.png');
await gallery.goto(`${base}/tools/gallery.html?cols=6&stage=all&ids=emberjaw,tidefin,sparkwing,duskfang,celestia,volcanyx`);
await gallery.waitForTimeout(800);
await gallery.screenshot({ path: path.join(out, '14-growth-stages.png'), fullPage: true });
console.log('wrote 14-growth-stages.png');

if (errors.length) console.log('PAGE ERRORS:', errors);
await browser.close();
server.close();
