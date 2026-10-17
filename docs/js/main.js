// Entry point: load the save, wire game events to the UI, start the clock.
import * as G from './game.js';
import { refresh, renderView, renderTop, show, tick, toast, currentView } from './ui.js';
import './island.js';
import './dragons.js';
import { inBattle } from './battleui.js';
import { levelUpSheet } from './shop.js';
import { play } from './sound.js';
import { setArtManifest } from './art.js';

G.load();

// Re-render after the current action finishes, so actions can close their own sheet first.
let queued = false;
G.on('change', () => {
  if (queued) return;
  queued = true;
  queueMicrotask(() => {
    queued = false;
    renderTop();
    if (!inBattle()) refresh();
  });
});
G.on('toast', toast);
// Several level-ups at once (e.g. a big battle reward) show a single sheet.
let levelFrom = null;
G.on('levelup', (lvl) => {
  if (levelFrom == null) {
    levelFrom = lvl;
    setTimeout(() => {
      levelUpSheet(levelFrom, G.S.player.level);
      play('level');
      levelFrom = null;
    }, 300);
  }
});

show('island');
renderTop();
// Painted dragon images, if any have been generated; the drawn art shows until then.
fetch('art/manifest.json', { cache: 'no-cache' })
  .then((r) => (r.ok ? r.json() : {}))
  .then((m) => {
    if (Object.keys(m).length) {
      setArtManifest(m);
      refresh();
    }
  })
  .catch(() => {});
let seconds = 0;
setInterval(() => {
  if (inBattle()) return;
  tick();
  // The island patches only what changed, so refresh it now and then for new coin bubbles.
  if (++seconds % 2 === 0 && currentView() === 'island' && !document.querySelector('#sheets .sheet')) renderView();
}, 1000);

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    G.save();
  } else {
    G.checkDaily();
    renderView();
  }
});
window.addEventListener('pagehide', () => G.save());

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
