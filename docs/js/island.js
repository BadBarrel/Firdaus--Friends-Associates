// Island view: plots, buildings and their sheets (habitats, farms, hatchery, breeding, totem).
import * as D from './data.js';
import * as G from './game.js';
import { dragonSVG, eggSVG, eggInner } from './art.js';
import * as W from './world.js';
import { designFor } from './designs.js';
import { act, view, openSheet, closeSheet, toast, elChip, rarityChip, dragonArt, cost, lockNote, esc } from './ui.js';
import { openDragon, openSpecies } from './dragons.js';
import { play } from './sound.js';

const S = () => G.S;

// ---------------------------------------------------------------- island world view

// World layout: the main island holds plots 0-15 in a 4x4 isometric grid; every expansion adds
// a small floating island with 3 plots. Coordinates are world pixels around ORIGIN.
const ORIGIN = { x: 1500, y: 1150 };
const WORLD = { w: 3000, h: 2400 };
const MAIN_HULL = [[0, -232], [250, -142], [425, 0], [250, 142], [0, 232], [-250, 142], [-425, 0], [-250, -142]];
// Trees and flowers on the back rim of the main island (front ones would hide buildings).
const MAIN_DECOR = [['pine', 0, -200, 1.05], ['tree', -86, -196, 0.95], ['tree', 96, -190, 0.9], ['pine', -330, -36, 0.95], ['tree', 340, -30, 0.95], ['flowers', -210, -124], ['flowers', 196, -130], ['pine', -390, 8, 0.8], ['bush', 384, 12, 1.1], ['bush', -40, -214, 0.85], ['flowers', -300, -70], ['bush', 290, -84, 0.9]];
const SMALL_HULL = [[-240, -46], [-104, -128], [14, -72], [122, -16], [240, 46], [104, 128], [-14, 72], [-122, 16]];
const SMALL_ISLANDS = [[640, -430], [-640, -430], [640, 460], [-640, 460], [0, -760], [0, 800], [1140, 10], [-1140, 10]];

function plotPos(i) {
  if (i < D.START_PLOTS) {
    const r = Math.floor(i / 4), c = i % 4;
    return { x: (c - r) * W.TILE_W, y: (c + r - 3) * W.TILE_H };
  }
  const k = Math.floor((i - D.START_PLOTS) / D.PLOTS_PER_EXPANSION);
  const j = (i - D.START_PLOTS) % D.PLOTS_PER_EXPANSION;
  const [ix, iy] = SMALL_ISLANDS[k];
  return { x: ix + (j - 1) * W.TILE_W, y: iy + (j - 1) * W.TILE_H };
}

const cam = { x: null, y: null, z: 0.6 };
let builtPlots = -1;
const slotCache = new Map();

function islandsHTML() {
  let html = `<div class="isl" style="left:${ORIGIN.x}px;top:${ORIGIN.y}px"><svg viewBox="-440 -250 880 700" style="left:-440px;top:-250px;width:880px;height:700px">${W.islandArt(MAIN_HULL, 230, { waterfall: true })}${W.rimDecor(MAIN_DECOR)}</svg></div>`;
  for (let k = 0; k < S().expansions; k++) {
    const [x, y] = SMALL_ISLANDS[k];
    html += `<div class="isl" style="left:${ORIGIN.x + x}px;top:${ORIGIN.y + y}px"><svg viewBox="-260 -150 520 400" style="left:-260px;top:-150px;width:520px;height:400px">${W.islandArt(SMALL_HULL, 120, { seed: k + 2 })}</svg></div>`;
  }
  const next = G.expandCost();
  if (next != null) {
    const [x, y] = SMALL_ISLANDS[S().expansions];
    html += `<div class="isl ghost" style="left:${ORIGIN.x + x}px;top:${ORIGIN.y + y}px"><svg viewBox="-260 -150 520 400" style="left:-260px;top:-150px;width:520px;height:400px">${W.islandArt(SMALL_HULL, 120, { ghost: true, seed: S().expansions + 2 })}</svg>
      <button class="expand-sign" data-act="expand">🏝️ New island<br><b>🪙 ${G.fmt(next)}</b></button></div>`;
  }
  return html;
}

function cloudsHTML() {
  const spots = [[180, 0.9, 110], [520, 1.4, 150], [930, 1.1, 130], [1380, 1.6, 170], [1820, 1, 120], [2150, 1.3, 160]];
  return spots.map(([y, s, dur], i) => `<div class="cloud" style="top:${y}px;animation-duration:${dur}s;animation-delay:-${(i * 37) % dur}s">${W.cloudArt(s)}</div>`).join('');
}

const svgBox = (inner, cls = '') => `<svg class="bsvg ${cls}" viewBox="${W.BOX.x} ${W.BOX.y} ${W.BOX.w} ${W.BOX.h}" style="left:${W.BOX.x}px;top:${W.BOX.y}px;width:${W.BOX.w}px;height:${W.BOX.h}px">${inner}</svg>`;

const FLOATERS = new Set(['serpent', 'sea', 'sprite', 'wraith']);
// Start points chosen so start + walk path (about +-20, +-10) stays well inside the plot diamond.
const WALK_SPOTS = [[0, 0], [12, -5], [-12, 5], [-4, -9]];

function walkers(h) {
  const t = G.now() / 1000;
  return G.dragonsIn(h).map((d, i) => {
    const sp = D.DRAGONS[d.sp];
    const [x, y] = WALK_SPOTS[i % WALK_SPOTS.length];
    const dur = 9 + ((d.uid * 7) % 7);
    // Negative delays keep each dragon's position continuous when the slot is redrawn.
    const delay = -((t + d.uid * 3.7) % dur).toFixed(2);
    const path = d.uid % 2 ? 'A' : 'B';
    const fly = FLOATERS.has(designFor(sp).body) ? ' fly' : '';
    const timing = `animation-duration:${dur}s;animation-delay:${delay}s`;
    return `<div class="walk walk${path}${fly}" style="left:${x}px;top:${y}px;--d:${-((d.uid * 0.77) % 3).toFixed(2)}s;${timing}"><div class="dshadow"></div><div class="flip flip${path}" style="${timing}"><div class="dhop${fly}">${dragonArt(d)}</div></div></div>`;
  }).join('');
}

let upgraded = { id: null, until: 0 };
export function markUpgraded(id) {
  upgraded = { id, until: G.now() + 1600 };
}

function slotInner(i) {
  const b = G.buildingAt(i);
  if (b && b.id === upgraded.id && G.now() < upgraded.until) return slotBody(i, b).replace('class="slot-in"', 'class="slot-in upgraded"') + '<div class="dust"></div>';
  return slotBody(i, b);
}

function slotBody(i, b) {
  if (!b) return `<div class="slot-in${moving ? ' target' : ''}" data-act="${moving ? 'move-here' : 'build'}" data-plot="${i}">${svgBox(W.emptyArt(), 'faint')}</div>`;
  const open = `data-act="open-b" data-id="${b.id}"`;
  switch (b.type) {
    case 'habitat': {
      const gold = G.habitatGold(b);
      const full = gold >= G.habitatGoldCap(b);
      // Like Dragon City: a coin only pops up once a fair amount has built up.
      const showCoin = gold >= Math.max(1, G.habitatGoldCap(b) * 0.2);
      return `<div class="slot-in" ${open}>${svgBox(W.habitatBack(b.element, b.level))}
        <div class="walkers">${walkers(b)}</div>${svgBox(W.habitatFront(b.element, b.level), 'front')}
        ${showCoin ? `<button class="wcoin ${full ? 'full' : ''}" data-act="collect" data-id="${b.id}" aria-label="Collect gold">🪙</button>` : ''}</div>`;
    }
    case 'farm': {
      const c = b.crop && D.CROPS.find((x) => x.id === b.crop.id);
      const ready = c && b.crop.readyAt <= G.now();
      let progress = -1;
      if (c) {
        const total = G.duration(c.time) || 1;
        progress = Math.min(1, 1 - (b.crop.readyAt - G.now()) / total);
      }
      return `<div class="slot-in" ${open}>${svgBox(W.farmArt(progress, c ? c.icon : '', ready))}
        ${ready ? `<button class="wcoin food" data-act="harvest" data-id="${b.id}" aria-label="Harvest">🍖</button>` : c ? `<span class="wtimer" data-until="${b.crop.readyAt}">${G.fmtTime(b.crop.readyAt - G.now())}</span>` : `<span class="wtimer idle">Plant!</span>`}</div>`;
    }
    case 'hatchery': {
      const eggs = S().eggs.slice(0, 4).map((e, k) => `<g transform="translate(${-30 + k * 20} ${-36 + (k % 2) * 6}) scale(.3)">${eggInner(D.DRAGONS[e.sp])}</g>`).join('');
      const ready = S().eggs.filter((e) => e.readyAt <= G.now()).length;
      const next = S().eggs.filter((e) => e.readyAt > G.now()).sort((x, y) => x.readyAt - y.readyAt)[0];
      return `<div class="slot-in" ${open}>${svgBox(W.hatcheryArt(eggs))}
        ${ready ? `<span class="wbub egg">🥚 ${ready}!</span>` : next ? `<span class="wtimer" data-until="${next.readyAt}">${G.fmtTime(next.readyAt - G.now())}</span>` : ''}</div>`;
    }
    case 'sanctuary': {
      const slots = S().breeding;
      const ready = slots.filter((x) => x.readyAt <= G.now()).length;
      const next = slots.filter((x) => x.readyAt > G.now()).sort((x, y) => x.readyAt - y.readyAt)[0];
      return `<div class="slot-in" ${open}>${svgBox(W.sanctuaryArt(slots.length > 0))}
        ${ready ? `<span class="wbub love">💞 Egg!</span>` : next ? `<span class="wtimer" data-until="${next.readyAt}">${G.fmtTime(next.readyAt - G.now())}</span>` : ''}</div>`;
    }
    case 'totem': {
      const w = S().wish && D.DRAGONS[S().wish];
      return `<div class="slot-in" ${open}>${svgBox(W.totemArt(''))}${w ? `<div class="totem-pic">${dragonSVG(w)}</div>` : ''}</div>`;
    }
    case 'deco':
      return `<div class="slot-in" ${open}>${svgBox(W.decoArt(b.deco))}</div>`;
  }
  return '';
}

function hudHTML() {
  if (moving) {
    return `<div class="goal move-hint">✋ Tap a free spot to move the building <button class="btn small" data-act="move-cancel">Cancel</button></div>`;
  }
  const goal = G.nextGoal();
  // The goal hint shrinks to a small chip after a few seconds; tap it to read it again.
  if (goal !== goalText) {
    goalText = goal;
    goalAt = G.now();
  }
  const goalMini = !goalOpen && G.now() - goalAt > 6000;
  const readyCrops = G.buildingsOf('farm').filter((f) => f.crop && f.crop.readyAt <= G.now()).length;
  const qb = questsClaimable();
  return `${goal ? (goalMini ? `<button class="goal-chip" data-act="goal-open">💡</button>` : `<div class="goal">💡 ${goal}</div>`) : ''}
    ${!S().daily.loginClaimed ? `<button class="banner" data-act="quests">🎁 Daily reward ready! Day ${S().daily.streak}</button>` : ''}
    <div class="hud-col">
      <button class="hud-btn" data-act="collect-all" aria-label="Collect all gold">🪙<small>Collect</small></button>
      <button class="hud-btn" data-act="harvest-all" ${readyCrops ? '' : 'disabled'} aria-label="Harvest all">🍖<small>Harvest</small>${readyCrops ? `<b class="badge">${readyCrops}</b>` : ''}</button>
      <button class="hud-btn" data-act="quests" aria-label="Quests">📜<small>Quests</small>${qb ? `<b class="badge">${qb}</b>` : ''}</button>
      <button class="hud-btn" data-act="build-any" aria-label="Build">🔨<small>Build</small></button>
    </div>`;
}

let goalText = null, goalAt = 0, goalOpen = false;
act('goal-open', () => {
  goalOpen = true;
  goalAt = G.now();
  G.changed();
  setTimeout(() => (goalOpen = false), 6000);
});

function renderIsland() {
  builtPlots = G.plotCount();
  slotCache.clear();
  let slots = '';
  for (let i = 0; i < builtPlots; i++) {
    const p = plotPos(i);
    const html = slotInner(i);
    slotCache.set(i, html);
    slots += `<div class="slot" id="slot-${i}" style="left:${ORIGIN.x + p.x}px;top:${ORIGIN.y + p.y}px;z-index:${Math.round(1000 + p.y)}">${html}</div>`;
  }
  return `<div id="world"><div id="world-inner" style="width:${WORLD.w}px;height:${WORLD.h}px">
      <div class="clouds">${cloudsHTML()}</div>${islandsHTML()}${slots}</div></div>
    <div id="hud">${hudHTML()}</div>`;
}

function updateIsland(el) {
  if (G.plotCount() !== builtPlots) {
    el.innerHTML = renderIsland();
    mountIsland(el);
    return;
  }
  for (let i = 0; i < builtPlots; i++) {
    const html = slotInner(i);
    if (slotCache.get(i) !== html) {
      slotCache.set(i, html);
      const slot = el.querySelector(`#slot-${i}`);
      if (slot) slot.innerHTML = html;
    }
  }
  const hud = el.querySelector('#hud');
  const h = hudHTML();
  if (hud && hud.dataset.html !== h) {
    hud.innerHTML = h;
    hud.dataset.html = h;
  }
}

// Pan with one finger, pinch or wheel to zoom. Taps still reach buildings unless you dragged.
function mountIsland(el) {
  const world = el.querySelector('#world');
  const inner = el.querySelector('#world-inner');
  const vw = world.clientWidth, vh = world.clientHeight;
  if (cam.x == null) {
    cam.z = Math.max(0.45, Math.min(1.2, vw / 520));
    cam.x = vw / 2 - ORIGIN.x * cam.z;
    cam.y = vh / 2 - (ORIGIN.y - 20) * cam.z;
  }
  const clamp = () => {
    cam.z = Math.max(0.3, Math.min(1.6, cam.z));
    const ww = WORLD.w * cam.z, wh = WORLD.h * cam.z;
    cam.x = Math.min(vw * 0.5, Math.max(vw * 0.5 - ww, cam.x));
    cam.y = Math.min(vh * 0.5, Math.max(vh * 0.5 - wh, cam.y));
  };
  const apply = () => {
    clamp();
    inner.style.transform = `translate(${cam.x}px, ${cam.y}px) scale(${cam.z})`;
    // Bubbles and timers keep a steady on-screen size whatever the zoom.
    inner.style.setProperty('--iz', Math.min(1.6, Math.max(0.7, 1 / cam.z)).toFixed(3));
    // Far zoomed out, parts stop animating to save battery.
    inner.classList.toggle('calm', cam.z < 0.5);
  };
  apply();
  const pts = new Map();
  let moved = 0, last = null, suppress = false;
  let vel = { x: 0, y: 0 }, lastT = 0, glide = 0;
  const mid = () => {
    const a = [...pts.values()];
    return a.length === 1 ? { x: a[0].x, y: a[0].y, d: 0 } : { x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2, d: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) };
  };
  world.addEventListener('pointerdown', (e) => {
    cancelAnimationFrame(glide);
    vel = { x: 0, y: 0 };
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 1) moved = 0;
    last = mid();
  });
  world.addEventListener('pointermove', (e) => {
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const m = mid();
    const r = world.getBoundingClientRect();
    if (pts.size === 2 && last.d) {
      const nz = cam.z * (m.d / last.d);
      const k = Math.max(0.3, Math.min(1.6, nz)) / cam.z;
      cam.x = m.x - r.left - (m.x - r.left - cam.x) * k;
      cam.y = m.y - r.top - (m.y - r.top - cam.y) * k;
      cam.z *= k;
    }
    cam.x += m.x - last.x;
    cam.y += m.y - last.y;
    const now = performance.now();
    const dt = Math.max(8, now - lastT);
    lastT = now;
    if (pts.size === 1) vel = { x: (m.x - last.x) / dt, y: (m.y - last.y) / dt };
    moved += Math.abs(m.x - last.x) + Math.abs(m.y - last.y);
    if (moved > 10 && !suppress) {
      suppress = true;
      try { world.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    }
    last = m;
    apply();
  });
  const up = (e) => {
    pts.delete(e.pointerId);
    last = pts.size ? mid() : null;
    if (!pts.size) {
      setTimeout(() => (suppress = false), 0);
      // Flick momentum: keep gliding and slow down.
      if (moved > 10 && performance.now() - lastT < 80) {
        let v = { x: vel.x * 16, y: vel.y * 16 };
        const step = () => {
          v = { x: v.x * 0.92, y: v.y * 0.92 };
          cam.x += v.x;
          cam.y += v.y;
          apply();
          if (Math.abs(v.x) + Math.abs(v.y) > 0.5) glide = requestAnimationFrame(step);
        };
        glide = requestAnimationFrame(step);
      }
    }
  };
  world.addEventListener('pointerup', up);
  world.addEventListener('pointercancel', up);
  world.addEventListener('click', (e) => {
    if (suppress || moved > 10) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, true);
  world.addEventListener('wheel', (e) => {
    e.preventDefault();
    const r = world.getBoundingClientRect();
    const k = Math.max(0.3, Math.min(1.6, cam.z * (e.deltaY < 0 ? 1.1 : 0.9))) / cam.z;
    cam.x = e.clientX - r.left - (e.clientX - r.left - cam.x) * k;
    cam.y = e.clientY - r.top - (e.clientY - r.top - cam.y) * k;
    cam.z *= k;
    apply();
  }, { passive: false });
}

view('island', { full: true, render: renderIsland, mount: mountIsland, update: updateIsland });

function questsClaimable() {
  let n = S().daily.loginClaimed ? 0 : 1;
  n += S().daily.quests.filter((q) => !q.claimed && q.progress >= D.DAILY_QUESTS.find((x) => x.id === q.id).goal).length;
  n += D.ACHIEVEMENTS.filter((a) => G.achievementState(a).claimable).length;
  return n;
}

// Floating "+123" text that rises from where you tapped.
function floatText(t, text) {
  const r = t.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'float-text';
  el.textContent = text;
  el.style.left = `${r.left + r.width / 2}px`;
  el.style.top = `${r.top}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1100);
}

// Coins (or food) fly from where you tapped to the counter in the top bar, which then bumps.
function flyTo(t, icon, target) {
  const from = t.getBoundingClientRect();
  const to = document.querySelector(target)?.getBoundingClientRect();
  if (!to) return;
  for (let i = 0; i < 7; i++) {
    const el = document.createElement('div');
    el.className = 'fly-coin';
    el.textContent = icon;
    el.style.left = `${from.left + from.width / 2 + (Math.random() - 0.5) * 30}px`;
    el.style.top = `${from.top + (Math.random() - 0.5) * 20}px`;
    document.body.appendChild(el);
    const dx = to.left + 12 - parseFloat(el.style.left), dy = to.top + 6 - parseFloat(el.style.top);
    el.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.3 + (Math.random() - 0.5) * 60}px, ${dy * 0.3 - 40}px) scale(1.2)`, offset: 0.35 },
      { transform: `translate(${dx}px, ${dy}px) scale(.6)`, opacity: 0.9 },
    ], { duration: 650 + i * 50, easing: 'ease-in', fill: 'forwards' }).onfinish = () => el.remove();
  }
  setTimeout(() => {
    const pill = document.querySelector(target);
    pill?.classList.remove('bump');
    void pill?.offsetWidth;
    pill?.classList.add('bump');
  }, 700);
}

act('collect', (d, t) => {
  const g = G.collect(G.buildingById(+d.id));
  if (g) {
    floatText(t, `+${G.fmt(g)}`);
    flyTo(t, '🪙', '#topbar .gold');
    play('coin');
  }
});
act('collect-all', (d, t) => {
  if (G.collectAll()) {
    flyTo(t, '🪙', '#topbar .gold');
    play('coin');
  }
});
act('harvest', (d, t) => {
  const f = G.harvest(G.buildingById(+d.id));
  if (f) {
    floatText(t, `+${G.fmt(f)}`);
    flyTo(t, '🍖', '#topbar .food');
    play('harvest');
  }
});
act('harvest-all', (d, t) => {
  if (G.harvestAll()) {
    flyTo(t, '🍖', '#topbar .food');
    play('harvest');
  }
});

// Moving buildings: pick "Move" in a building's sheet, then tap a free spot.
let moving = null;
act('move-b', (d) => {
  moving = +d.id;
  closeSheet();
  G.changed();
});
act('move-here', (d) => {
  const b = G.buildingById(moving);
  moving = null;
  if (b) {
    G.moveBuilding(b, +d.plot);
    play('build');
  }
  G.changed();
});
act('move-cancel', () => {
  moving = null;
  G.changed();
});
act('expand', () => G.expand());
act('build-any', () => {
  for (let i = 0; i < G.plotCount(); i++) {
    if (!G.buildingAt(i)) {
      openSheet(() => buildSheet(i));
      return;
    }
  }
  toast('No free space: expand to a new island!');
});

act('open-b', (d) => {
  const b = G.buildingById(+d.id);
  const open = { habitat: habitatSheet, farm: farmSheet, hatchery: hatcherySheet, sanctuary: sanctuarySheet, totem: totemSheet, deco: decoSheet }[b.type];
  play('tap');
  openSheet(() => (G.buildingById(b.id) ? open(b) + `<button class="btn wide ghost" data-act="move-b" data-id="${b.id}">✋ Move building</button>` : null));
});

// ---------------------------------------------------------------- build menu

act('build', (d) => openSheet(() => buildSheet(+d.plot)));

function buildSheet(plot) {
  if (G.buildingAt(plot)) return null;
  const opts = G.buildOptions();
  const row = (o) => {
    let icon, name, desc;
    if (o.type === 'habitat') {
      const e = D.ELEMENTS[o.element];
      icon = e.icon;
      name = `${e.name} Habitat`;
      desc = `Home for ${e.name} dragons. Holds 2, upgrades to 4.`;
    } else if (o.type === 'farm') {
      icon = '🌱';
      name = 'Farm';
      desc = 'Grow food to level up dragons.';
    } else if (o.type === 'totem') {
      icon = '🗿';
      name = 'Wish Totem';
      desc = 'Pick a dragon you want. Breeding gives it 4× more often.';
    } else {
      const dd = D.DECORATIONS.find((x) => x.id === o.deco);
      icon = dd.icon;
      name = dd.name;
      desc = `+${dd.bonus}% gold from all habitats.`;
    }
    const afford = G.canAfford({ gold: o.cost });
    return `<button class="row ${o.locked ? 'locked' : ''}" data-act="do-build" data-key="${o.key}" data-plot="${plot}" ${o.locked ? 'disabled' : ''}>
      <span class="row-icon">${icon}</span>
      <span class="row-main"><b>${name}</b><small>${desc}</small></span>
      <span class="row-side ${afford ? '' : 'short'}">${o.locked ? lockNote(o.unlock) : o.cost ? cost({ gold: o.cost }) : 'Free'}</span>
    </button>`;
  };
  const group = (title, list) => (list.length ? `<h3>${title}</h3>${list.map(row).join('')}` : '');
  return `<h2>Build</h2>
    ${group('Habitats', opts.filter((o) => o.type === 'habitat'))}
    ${group('Food', opts.filter((o) => o.type === 'farm'))}
    ${group('Special', opts.filter((o) => o.type === 'totem'))}
    ${group('Decorations', opts.filter((o) => o.type === 'deco'))}
    <p class="muted small">Decoration bonus is capped at +${D.MAX_DECO_BONUS}%.</p>`;
}

act('do-build', (d) => {
  const opt = G.buildOptions().find((o) => o.key === d.key);
  if (opt && G.build(opt, +d.plot)) {
    closeSheet();
    play('build');
    toast('Built!');
  }
});

act('sell-b', (d) => {
  const b = G.buildingById(+d.id);
  if (confirm('Remove this building? You get nothing back.')) {
    G.sellBuilding(b);
    if (!G.buildingById(b.id)) closeSheet();
  }
});

// ---------------------------------------------------------------- habitat

function habitatSheet(h) {
  const e = D.ELEMENTS[h.element];
  const ds = G.dragonsIn(h);
  const up = G.habitatUpgradeCost(h);
  return `<h2>${e.icon} ${e.name} Habitat <small>Lv ${h.level + 1}</small></h2>
    <div class="stat-row">
      <div><small>Gold</small><b>🪙 <span data-hgold="${h.id}">${G.fmt(G.habitatGold(h))}</span> / ${G.fmt(G.habitatGoldCap(h))}</b></div>
      <div><small>Income</small><b>${G.fmt(G.habitatGoldPerMin(h) * 60)}/h</b></div>
    </div>
    <button class="btn wide gold" data-act="collect" data-id="${h.id}">Collect gold</button>
    <h3>Dragons (${ds.length}/${G.habitatCapacity(h)})</h3>
    <div class="cards">${ds.map(dragonCard).join('') || '<p class="muted">No dragons here yet. Hatch or move a dragon with ' + e.name + ' element.</p>'}</div>
    <h3>Habitat</h3>
    ${up != null ? `<button class="btn wide" data-act="up-hab" data-id="${h.id}">Upgrade: ${D.HABITAT_LEVELS[h.level + 1].capacity} dragons, ${G.fmt(D.HABITAT_LEVELS[h.level + 1].goldCap * (D.HABITAT_CAP_MULT[h.element] || 1))} gold cap · ${cost({ gold: up })}</button>` : '<p class="muted">Max level</p>'}
    <button class="btn wide ghost danger" data-act="sell-b" data-id="${h.id}">Remove habitat</button>`;
}
act('up-hab', (d) => {
  const h = G.buildingById(+d.id);
  const lvl = h.level;
  G.upgradeHabitat(h);
  if (h.level > lvl) {
    markUpgraded(h.id);
    play('level');
    closeSheet();
  }
});

export function dragonCard(d) {
  const sp = D.DRAGONS[d.sp];
  return `<button class="dcard" data-act="dragon" data-uid="${d.uid}" style="--r:${D.RARITIES[sp.rarity].color}">
    ${dragonArt(d)}
    <b>${esc(G.dragonName(d))}</b>
    <small>Lv ${d.lvl} · ${sp.elements.map((x) => D.ELEMENTS[x].icon).join('')}</small>
  </button>`;
}
act('dragon', (d) => openDragon(+d.uid));

// ---------------------------------------------------------------- farm

function farmSheet(f) {
  if (f.crop) {
    const c = D.CROPS.find((x) => x.id === f.crop.id);
    const ready = f.crop.readyAt <= G.now();
    return `<h2>🌱 Farm</h2>
      <div class="center big-icon">${c.icon}</div>
      <p class="center"><b>${c.name}</b> · 🍖 ${G.fmt(c.food)} food</p>
      ${ready
        ? `<button class="btn wide gold" data-act="harvest" data-id="${f.id}">Harvest 🍖 ${G.fmt(c.food)}</button>`
        : `<p class="center">Ready in <b data-until="${f.crop.readyAt}">${G.fmtTime(f.crop.readyAt - G.now())}</b></p>
           <button class="btn wide" data-act="speed" data-kind="farm" data-id="${f.id}">Finish now · 💎 ${G.speedUpCost(f.crop.readyAt)}</button>`}
      <button class="btn wide ghost danger" data-act="sell-b" data-id="${f.id}">Remove farm</button>`;
  }
  const lvl = S().player.level;
  return `<h2>🌱 Farm</h2><p class="muted">Choose a crop to plant.</p>
    ${D.CROPS.map((c) => {
      const locked = lvl < c.unlock;
      return `<button class="row ${locked ? 'locked' : ''}" data-act="plant" data-id="${f.id}" data-crop="${c.id}" ${locked ? 'disabled' : ''}>
        <span class="row-icon">${c.icon}</span>
        <span class="row-main"><b>${c.name}</b><small>🍖 ${G.fmt(c.food)} food · ⏱ ${G.fmtTime(G.duration(c.time) || 1)}</small></span>
        <span class="row-side">${locked ? lockNote(c.unlock) : cost({ gold: c.cost })}</span>
      </button>`;
    }).join('')}
    <button class="btn wide ghost danger" data-act="sell-b" data-id="${f.id}">Remove farm</button>`;
}
act('plant', (d) => {
  G.plant(G.buildingById(+d.id), d.crop);
  closeSheet();
});

act('speed', (d) => {
  let item;
  if (d.kind === 'farm') item = G.buildingById(+d.id).crop;
  if (d.kind === 'egg') item = S().eggs.find((e) => e.uid === +d.id);
  if (d.kind === 'breed') item = S().breeding.find((b) => b.uid === +d.id);
  if (item) G.speedUp(item);
});

// ---------------------------------------------------------------- hatchery

function hatcherySheet(b) {
  const next = G.upgradeCost(b);
  const eggs = S().eggs;
  return `<h2>🥚 Hatchery <small>${eggs.length}/${G.hatcherySlots()}</small></h2>
    ${eggs.length ? '' : '<p class="muted">No eggs. Buy eggs in the Shop or breed dragons.</p>'}
    ${eggs.map((e) => {
      const sp = D.DRAGONS[e.sp];
      const ready = e.readyAt <= G.now();
      return `<div class="egg-row">
        ${eggSVG(sp)}
        <div class="row-main"><b>${sp.name}</b>${rarityChip(sp.rarity)} ${sp.elements.map((x) => elChip(x, false)).join('')}
          <small>${ready ? 'Ready to hatch!' : `Hatching in <b data-until="${e.readyAt}">${G.fmtTime(e.readyAt - G.now())}</b>`}</small></div>
        ${ready
          ? `<button class="btn gold" data-act="hatch" data-uid="${e.uid}">Hatch</button>`
          : `<button class="btn" data-act="speed" data-kind="egg" data-id="${e.uid}">💎 ${G.speedUpCost(e.readyAt)}</button>`}
      </div>`;
    }).join('')}
    ${next ? `<button class="btn wide" data-act="up-special" data-id="${b.id}">${S().player.level < next.unlock ? `Upgrade to ${next.slots} slots ${lockNote(next.unlock)}` : `Upgrade to ${next.slots} slots · ${cost({ gold: next.cost })}`}</button>` : ''}`;
}
act('up-special', (d) => {
  const b = G.buildingById(+d.id);
  const lvl = b.level;
  G.upgradeSpecial(b);
  if (b.level > lvl) {
    markUpgraded(b.id);
    play('level');
  }
});

act('hatch', (d) => {
  const egg = S().eggs.find((e) => e.uid === +d.uid);
  if (egg) openSheet(() => placeSheet(egg.uid));
});

function placeSheet(eggUid) {
  const egg = S().eggs.find((e) => e.uid === eggUid);
  if (!egg) return null;
  const sp = D.DRAGONS[egg.sp];
  const habs = G.eligibleHabitats(sp);
  const needed = sp.elements.map((x) => D.ELEMENTS[x].name).join(' or ');
  return `<h2>Where should ${sp.name} live?</h2>
    <div class="center">${dragonSVG(sp, { stage: 'baby', cls: 'hero' })}</div>
    ${habs.map((h) => `<button class="row" data-act="place" data-egg="${eggUid}" data-hab="${h.id}">
        <span class="row-icon">${D.ELEMENTS[h.element].icon}</span>
        <span class="row-main"><b>${D.ELEMENTS[h.element].name} Habitat</b><small>${G.dragonsIn(h).length}/${G.habitatCapacity(h)} dragons</small></span>
      </button>`).join('')}
    ${habs.length ? '' : `<p class="muted">No free habitat. It needs a ${needed} habitat with space. You can build one on an empty plot, or keep the dragon in the Den for now.</p>`}
    <button class="row" data-act="place" data-egg="${eggUid}" data-hab="">
      <span class="row-icon">🏚️</span>
      <span class="row-main"><b>Dragon Den</b><small>Unlimited storage. Dragons here don't earn gold but can still battle and breed.</small></span>
    </button>`;
}

act('place', (d) => {
  const egg = S().eggs.find((e) => e.uid === +d.egg);
  const res = egg && G.hatch(egg, d.hab === '' ? null : +d.hab);
  if (!res) return;
  closeSheet();
  hatchReveal(D.DRAGONS[res.dragon.sp], res.firstTime);
});

// The egg wobbles, cracks three times, flashes and the baby pops out (CSS-timed, about 1.4s).
function hatchReveal(sp, firstTime) {
  const crack = '<svg class="cracks" viewBox="0 0 100 120"><path class="c1" d="M50 30 L44 44 L54 52" /><path class="c2" d="M54 52 L46 64 L58 74" /><path class="c3" d="M30 60 L40 66 L36 78 M70 50 L62 60 L72 66" /></svg>';
  const confetti = Array.from({ length: 12 }, (_, i) => `<i style="--a:${i * 30}deg;--c:${['#ffd54f', '#ff7aa8', '#7be06b', '#5fb0ff'][i % 4]}"></i>`).join('');
  openSheet(() => `<div class="reveal hatching">
      <div class="hatch-stage">
        <div class="egg-wob">${eggSVG(sp)}${crack}</div>
        <div class="flash"></div>
        <div class="born">${dragonSVG(sp, { stage: 'baby', cls: 'hero' })}</div>
        <div class="confetti">${confetti}</div>
      </div>
      <div class="hatch-text">
        <p class="muted">${firstTime ? '✨ New dragon discovered!' : 'Hatched!'}</p>
        <h2>${sp.name}</h2>
        <p>${rarityChip(sp.rarity)} ${sp.elements.map((x) => elChip(x)).join(' ')}</p>
        <button class="btn wide gold" data-act="close-sheet">${firstTime ? 'Awesome!' : 'Nice!'}</button>
      </div></div>`, { cls: 'celebrate' });
  [300, 650, 1000].forEach((ms) => setTimeout(() => play('crack'), ms));
  setTimeout(() => play('hatch'), 1250);
}

// ---------------------------------------------------------------- breeding sanctuary

const sel = { a: null, b: null };

function sanctuarySheet(b) {
  const next = G.upgradeCost(b);
  const slots = S().breeding;
  const free = slots.length < G.sanctuarySlots();
  for (const k of ['a', 'b']) {
    const dd = sel[k] && G.dragonByUid(sel[k]);
    if (!dd || !G.canBreed(dd)) sel[k] = null;
  }
  const A = sel.a && G.dragonByUid(sel.a);
  const B = sel.b && G.dragonByUid(sel.b);
  const parent = (k, d) => `<button class="parent" data-act="pick-parent" data-k="${k}">
      ${d ? `${dragonArt(d)}<b>${esc(G.dragonName(d))}</b><small>Lv ${d.lvl}</small>` : `<span class="big">＋</span><small>Choose dragon</small>`}
    </button>`;
  let pool = '';
  if (A && B) {
    const list = G.breedPool(D.DRAGONS[A.sp], D.DRAGONS[B.sp]);
    pool = `<h3>Possible results</h3><div class="pool">${list.map((o) => `<button class="pool-item" data-act="species" data-id="${o.sp.id}" style="--r:${D.RARITIES[o.sp.rarity].color}">
        ${dragonSVG(o.sp, { cls: 'mini' })}<b>${o.sp.name}</b><small>${(o.chance * 100).toFixed(o.chance < 0.1 ? 1 : 0)}%</small></button>`).join('')}</div>`;
  }
  return `<h2>💞 Breeding Sanctuary</h2>
    ${slots.map((x) => {
      const ready = x.readyAt <= G.now();
      const sp = D.DRAGONS[x.sp];
      const pa = G.dragonByUid(x.a), pb = G.dragonByUid(x.b);
      return `<div class="egg-row">
        ${ready ? eggSVG(sp) : '<div class="mystery">❓</div>'}
        <div class="row-main"><b>${ready ? sp.name + ' egg!' : 'Mystery egg'}</b>
          <small>${pa ? esc(G.dragonName(pa)) : '?'} + ${pb ? esc(G.dragonName(pb)) : '?'}</small>
          <small>${ready ? 'Move it to the Hatchery' : `Ready in <b data-until="${x.readyAt}">${G.fmtTime(x.readyAt - G.now())}</b>`}</small></div>
        ${ready
          ? `<button class="btn gold" data-act="breed-collect" data-uid="${x.uid}">Take egg</button>`
          : `<button class="btn" data-act="speed" data-kind="breed" data-id="${x.uid}">💎 ${G.speedUpCost(x.readyAt)}</button>`}
      </div>`;
    }).join('')}
    ${free ? `<p class="muted small">Pick two dragons of level ${D.BREED_MIN_LEVEL}+. Their combined elements decide the baby.</p>
      <div class="parents">${parent('a', A)}<span class="heart">❤️</span>${parent('b', B)}</div>
      ${pool}
      <button class="btn wide gold" data-act="breed" ${A && B ? '' : 'disabled'}>Breed!</button>`
      : '<p class="muted">All breeding slots are busy.</p>'}
    ${next ? `<button class="btn wide" data-act="up-special" data-id="${b.id}">${S().player.level < next.unlock ? `Add breeding slot ${lockNote(next.unlock)}` : `Add breeding slot · ${cost({ gold: next.cost })}`}</button>` : ''}`;
}

act('pick-parent', (d) => openSheet(() => parentPicker(d.k)));

function parentPicker(k) {
  const other = sel[k === 'a' ? 'b' : 'a'];
  const list = S().dragons
    .filter((d) => d.uid !== other)
    .sort((x, y) => y.lvl - x.lvl);
  return `<h2>Choose a parent</h2>
    <div class="cards">${list.map((d) => {
      const ok = G.canBreed(d);
      const sp = D.DRAGONS[d.sp];
      return `<button class="dcard ${ok ? '' : 'locked'}" data-act="set-parent" data-k="${k}" data-uid="${d.uid}" ${ok ? '' : 'disabled'} style="--r:${D.RARITIES[sp.rarity].color}">
        ${dragonArt(d)}<b>${esc(G.dragonName(d))}</b>
        <small>${ok ? `Lv ${d.lvl} · ${sp.elements.map((x) => D.ELEMENTS[x].icon).join('')}` : d.lvl < D.BREED_MIN_LEVEL ? `Needs Lv ${D.BREED_MIN_LEVEL}` : 'Breeding'}</small></button>`;
    }).join('')}</div>`;
}
act('set-parent', (d) => {
  sel[d.k] = +d.uid;
  closeSheet();
});

act('breed', () => {
  const A = G.dragonByUid(sel.a), B = G.dragonByUid(sel.b);
  if (!A || !B) return;
  const slot = G.startBreed(A, B);
  if (slot) {
    sel.a = sel.b = null;
    play('breed');
    // Parents lean in, a heart pops and the mystery egg drops.
    openSheet(() => `<div class="reveal breeding">
        <div class="breed-stage">
          <div class="pa">${dragonArt(A, 'hero')}</div><div class="pb">${dragonArt(B, 'hero')}</div>
          <div class="bheart">❤️</div><div class="begg">🥚</div>
        </div>
        <h2>Breeding started!</h2>
        <p class="muted">${esc(G.dragonName(A))} + ${esc(G.dragonName(B))} · ${slot.readyAt > G.now() ? `egg in ${G.fmtTime(slot.readyAt - G.now())}` : "egg ready now!"}</p>
        <button class="btn wide gold" data-act="close-sheet">OK</button></div>`, { cls: 'celebrate' });
  }
});
act('breed-collect', (d) => {
  const slot = S().breeding.find((x) => x.uid === +d.uid);
  if (slot) G.collectBreed(slot);
});

// ---------------------------------------------------------------- totem & decorations

function totemSheet(b) {
  const w = S().wish && D.DRAGONS[S().wish];
  return `<h2>🗿 Wish Totem</h2>
    <p class="muted">Make a wish for a dragon. When it's a possible result, breeding gives it ${D.TOTEM.boost}× more often (recipe dragons: 2×).</p>
    ${w ? `<div class="center">${dragonSVG(w, { cls: 'hero' })}<h3>${w.name}</h3><p class="small">${D.howToGet(w)}</p></div>` : ''}
    <button class="btn wide gold" data-act="wish-pick">${w ? 'Change wish' : 'Choose a dragon'}</button>
    ${w ? '<button class="btn wide ghost" data-act="wish-clear">Clear wish</button>' : ''}
    <button class="btn wide ghost danger" data-act="sell-b" data-id="${b.id}">Remove totem</button>`;
}
act('wish-pick', () => openSheet(wishPicker));
act('wish-clear', () => G.setWish(null));

function wishPicker() {
  const list = D.DRAGON_LIST.filter((d) => d.rarity !== 'common');
  return `<h2>Wish for...</h2><div class="cards">${list.map((sp) => `<button class="dcard" data-act="wish-set" data-id="${sp.id}" style="--r:${D.RARITIES[sp.rarity].color}">
      ${dragonSVG(sp, { cls: S().book[sp.id] === 2 ? '' : 'unowned' })}<b>${sp.name}</b><small>${sp.elements.map((x) => D.ELEMENTS[x].icon).join('')}</small></button>`).join('')}</div>`;
}
act('wish-set', (d) => {
  G.setWish(d.id);
  closeSheet();
});

function decoSheet(b) {
  const d = D.DECORATIONS.find((x) => x.id === b.deco);
  return `<h2>${d.icon} ${d.name}</h2>
    <p>Boosts gold from every habitat by <b>+${d.bonus}%</b>.</p>
    <p class="muted">Total decoration bonus: +${G.decoBonus()}% (max ${D.MAX_DECO_BONUS}%).</p>
    <button class="btn wide ghost danger" data-act="sell-b" data-id="${b.id}">Remove decoration</button>`;
}

// ---------------------------------------------------------------- quests & achievements

act('quests', () => openSheet(questsSheet));

function questsSheet() {
  const dd = S().daily;
  const reward = G.loginReward();
  return `<h2>📜 Quests</h2>
    <h3>Daily login · Day ${dd.streak}</h3>
    <div class="row static"><span class="row-icon">🎁</span><span class="row-main"><b>Login reward</b><small>${cost(reward)}</small></span>
      ${dd.loginClaimed ? '<span class="row-side">✅</span>' : '<button class="btn gold" data-act="claim-login">Claim</button>'}</div>
    <h3>Today's quests</h3>
    ${dd.quests.map((q, i) => {
      const def = D.DAILY_QUESTS.find((x) => x.id === q.id);
      const done = q.progress >= def.goal;
      return `<div class="row static"><span class="row-icon">${done ? '⭐' : '▫️'}</span>
        <span class="row-main"><b>${def.text}</b><small>${Math.min(q.progress, def.goal)}/${def.goal} · 💎 ${D.DAILY_QUEST_GEMS}</small></span>
        ${q.claimed ? '<span class="row-side">✅</span>' : `<button class="btn ${done ? 'gold' : ''}" data-act="claim-quest" data-i="${i}" ${done ? '' : 'disabled'}>Claim</button>`}</div>`;
    }).join('')}
    <div class="row static"><span class="row-icon">🏅</span><span class="row-main"><b>Finish all 3</b><small>💎 ${D.DAILY_ALL_BONUS}</small></span>
      ${dd.bonusClaimed ? '<span class="row-side">✅</span>' : `<button class="btn" data-act="claim-bonus" ${dd.quests.every((q) => q.claimed) ? '' : 'disabled'}>Claim</button>`}</div>
    <h3>Achievements</h3>
    ${D.ACHIEVEMENTS.map((a) => {
      const st = G.achievementState(a);
      return `<div class="row static"><span class="row-icon">🏆</span>
        <span class="row-main"><b>${a.name} ${'★'.repeat(st.tier)}</b><small>${st.done ? 'Completed!' : `${a.text}: ${G.fmt(G.statValue(a.stat))}/${G.fmt(st.goal)} · 💎 ${a.gems[st.tier]}`}</small></span>
        ${st.done ? '<span class="row-side">✅</span>' : `<button class="btn ${st.claimable ? 'gold' : ''}" data-act="claim-ach" data-id="${a.id}" ${st.claimable ? '' : 'disabled'}>Claim</button>`}</div>`;
    }).join('')}`;
}
act('claim-login', () => {
  G.claimLogin();
  toast('Daily reward claimed!');
});
act('claim-quest', (d) => G.claimQuest(S().daily.quests[+d.i]));
act('claim-bonus', () => G.claimDailyBonus());
act('claim-ach', (d) => G.claimAchievement(D.ACHIEVEMENTS.find((a) => a.id === d.id)));

act('species', (d) => openSpecies(d.id));
