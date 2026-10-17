// Shop tab, settings, profile and level-up sheets.
import * as D from './data.js';
import * as G from './game.js';
import { dragonSVG } from './art.js';
import { act, view, openSheet, closeSheet, toast, elChip, cost, lockNote } from './ui.js';

const S = () => G.S;

view('shop', () => {
  const lvl = S().player.level;
  const eggs = D.DRAGON_LIST.filter((d) => d.price);
  const ex = G.expandCost();
  return `<h1>Shop</h1>
    <p class="muted small">Everything here costs in-game currency only. There's nothing to buy with real money.</p>
    <h3>Dragon eggs</h3>
    <div class="cards">${eggs.map((sp) => {
      const locked = lvl < sp.unlock;
      return `<button class="dcard ${locked ? 'locked' : ''}" data-act="${locked ? 'species' : 'buy-egg'}" data-id="${sp.id}" style="--r:${D.RARITIES.common.color}">
        ${dragonSVG(sp, { stage: 'baby', cls: locked ? 'unowned' : '' })}<b>${sp.name}</b>
        <small>${elChip(sp.elements[0], false)} ${locked ? lockNote(sp.unlock) : cost({ gold: sp.price })}</small></button>`;
    }).join('')}</div>
    <p class="muted small">Hybrid, Epic, Legendary and Mythic dragons come from breeding. See the Dragon Book for recipes.</p>
    <h3>Gem exchange</h3>
    ${D.GEM_EXCHANGE.map((o) => `<button class="row" data-act="exchange" data-id="${o.id}">
      <span class="row-icon">${o.label === 'gold' ? '🪙' : '🍖'}</span>
      <span class="row-main"><b>${G.fmt(o.amount(lvl))} ${o.label}</b><small>Grows with your level</small></span>
      <span class="row-side">💎 ${o.gems}</span></button>`).join('')}
    <h3>Island</h3>
    ${ex != null ? `<button class="row" data-act="expand"><span class="row-icon">🏝️</span>
      <span class="row-main"><b>Expand island</b><small>+${D.PLOTS_PER_EXPANSION} building plots (now ${G.plotCount()})</small></span>
      <span class="row-side">${cost({ gold: ex })}</span></button>` : '<p class="muted">Island fully expanded!</p>'}
    <h3>Earn gems</h3>
    <p class="small">💎 Level ups (+3) · daily login · daily quests · achievements · Adventure first clears · Arena promotions · Tower every 5 floors.</p>`;
});

act('exchange', (d) => {
  const o = D.GEM_EXCHANGE.find((x) => x.id === d.id);
  G.exchange(o);
});

// ---------------------------------------------------------------- settings

act('settings', () => openSheet(settingsSheet));

function settingsSheet() {
  const sp = S().settings.speed;
  return `<h2>⚙️ Settings</h2>
    <h3>Game speed</h3>
    <p class="muted small">Speeds up breeding, hatching and crops. It's your game, play it how you like.</p>
    <div class="pills">${D.SPEEDS.map((s) => `<button class="pill ${sp === s.id ? 'on' : ''}" data-act="speed-set" data-v="${s.id}">${s.name}</button>`).join('')}</div>
    <h3>Backup</h3>
    <p class="muted small">Your save lives only on this phone. Copy a backup code now and then to be safe.</p>
    <button class="btn wide" data-act="export">📋 Copy backup code</button>
    <button class="btn wide" data-act="import">📥 Restore from backup code</button>
    <h3>Danger zone</h3>
    <button class="btn wide ghost danger" data-act="reset">Start a new game</button>
    <p class="muted small center">Dragon Isles · free forever, no ads, no purchases.</p>`;
}

act('speed-set', (d) => {
  G.setSpeed(+d.v);
  toast('Speed updated');
});

act('export', async () => {
  const code = G.exportSave();
  try {
    await navigator.clipboard.writeText(code);
    toast('Backup code copied!');
  } catch (e) {
    openSheet(() => `<h2>Backup code</h2><p class="small">Select all and copy:</p><textarea class="code" readonly>${code}</textarea>`);
  }
});
act('import', () => {
  openSheet(() => `<h2>Restore</h2><p class="small">Paste your backup code. This replaces your current game.</p>
    <textarea class="code" id="import-code" placeholder="Paste code here"></textarea>
    <button class="btn wide gold" data-act="import-go">Restore</button>`);
});
act('import-go', () => {
  try {
    G.importSave(document.getElementById('import-code').value);
    closeSheet();
    closeSheet();
    toast('Game restored!');
  } catch (e) {
    toast("That code didn't work");
  }
});
act('reset', () => {
  if (confirm('Delete your island and start over? This cannot be undone.')) {
    G.resetGame();
    closeSheet();
  }
});

// ---------------------------------------------------------------- profile & level up

act('profile', () => openSheet(() => {
  const p = S().player;
  const st = S().stats;
  return `<h2>Level ${p.level}</h2>
    <p>${p.level >= D.MAX_PLAYER_LEVEL ? 'Max level!' : `XP ${G.fmt(p.xp)} / ${G.fmt(D.xpForLevel(p.level))}`}</p>
    <div class="stat-row">
      <div><small>Dragons</small><b>${S().dragons.length}</b></div>
      <div><small>Species</small><b>${G.ownedSpeciesCount()}/${D.DRAGON_LIST.length}</b></div>
      <div><small>Bred</small><b>${st.bred}</b></div>
      <div><small>Battles won</small><b>${st.won}</b></div>
    </div>
    <h3>Coming up</h3>${unlocksBetween(p.level + 1, p.level + 5) || '<p class="muted">Everything is unlocked!</p>'}`;
}));

function unlocksAt(lvl) {
  const out = [];
  for (const [el, l] of Object.entries(D.ELEMENT_UNLOCK)) if (l === lvl) out.push(`${elChip(el)} habitat${D.DRAGON_LIST.some((d) => d.price && d.elements[0] === el) ? ' + egg' : ''}`);
  for (const c of D.CROPS) if (c.unlock === lvl) out.push(`${c.icon} ${c.name}`);
  for (const d of D.DECORATIONS) if (d.unlock === lvl) out.push(`${d.icon} ${d.name}`);
  D.FARM_UNLOCK.forEach((l, i) => i > 1 && l === lvl && out.push(`🌱 Farm #${i + 1}`));
  if (D.TOTEM.unlock === lvl) out.push('🗿 Wish Totem');
  D.HATCHERY_LEVELS.forEach((h) => h.unlock === lvl && out.push(`🥚 Hatchery ${h.slots} slots`));
  D.SANCTUARY_LEVELS.forEach((h) => h.unlock === lvl && out.push(`💞 Breeding slot ${h.slots}`));
  if (lvl === 4) out.push('🏟️ Arena');
  if (lvl === 8) out.push('🗼 Tower of Trials');
  return out;
}
function unlocksBetween(a, b) {
  let html = '';
  for (let l = a; l <= Math.min(b, D.MAX_PLAYER_LEVEL); l++) {
    const u = unlocksAt(l);
    if (u.length) html += `<p class="small"><b>Lv ${l}:</b> ${u.join(' · ')}</p>`;
  }
  return html;
}

export function levelUpSheet(from, to) {
  const u = [];
  let gold = 0;
  for (let l = from; l <= to; l++) {
    u.push(...unlocksAt(l));
    gold += 100 * l;
  }
  const levels = to - from + 1;
  openSheet(() => `<div class="reveal">
    <div class="big-icon">🎉</div>
    <h2>Level ${to}!</h2>
    <p>💎 +${3 * levels} gems · 🪙 +${G.fmt(gold)} gold</p>
    ${u.length ? `<h3>Unlocked</h3><p>${u.join('<br>')}</p>` : ''}
    <button class="btn wide gold" data-act="close-sheet">Nice!</button></div>`, { cls: 'celebrate' });
}
