// Shared UI plumbing: action delegation, views, bottom sheets, toasts, live timers.
import * as D from './data.js';
import * as G from './game.js';
import { dragonSVG, stageFor, elementIcon } from './art.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// ---------------------------------------------------------------- actions

const actions = {};
export function act(name, fn) {
  actions[name] = fn;
}
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-act]');
  if (!t || t.disabled) return;
  const fn = actions[t.dataset.act];
  if (!fn) return;
  e.preventDefault();
  e.stopPropagation();
  fn(t.dataset, t, e);
});

// ---------------------------------------------------------------- views

const views = {};
let current = 'island';
export function view(name, render) {
  views[name] = render;
}
export function show(name) {
  current = name;
  document.querySelectorAll('#tabs [data-tab]').forEach((b) => b.classList.toggle('on', b.dataset.tab === name));
  $('#view').scrollTop = 0;
  renderView();
}
act('tab', (d) => show(d.tab));

// A view is either a render function returning HTML, or { render, mount, update, full }
// for views that keep their DOM between updates (the island world).
export function renderView() {
  const el = $('#view');
  const v = views[current];
  if (typeof v === 'object' && v.update && el.dataset.view === current) {
    v.update(el);
    return;
  }
  const top = el.scrollTop;
  el.dataset.view = current;
  el.classList.toggle('full', typeof v === 'object' && !!v.full);
  el.innerHTML = typeof v === 'function' ? v() : v.render();
  if (typeof v === 'object' && v.mount) v.mount(el);
  el.scrollTop = top;
}
export const currentView = () => current;

// ---------------------------------------------------------------- sheets

const sheets = [];
export function openSheet(render, opts = {}) {
  sheets.push({ render, cls: opts.cls || '' });
  renderSheets(true);
}
export function closeSheet() {
  sheets.pop();
  renderSheets();
}
export function closeAllSheets() {
  sheets.length = 0;
  renderSheets();
}
// Replace the top sheet (e.g. moving from a picker back to the parent with a new selection).
export function replaceSheet(render) {
  sheets.pop();
  openSheet(render);
}
act('close-sheet', closeSheet);
document.addEventListener('click', (e) => {
  if (e.target.classList && e.target.classList.contains('backdrop')) closeSheet();
});

function renderSheets(opened = false) {
  const root = $('#sheets');
  if (!sheets.length) {
    root.innerHTML = '';
    return;
  }
  const s = sheets[sheets.length - 1];
  const body = root.querySelector('.sheet-body');
  const top = body && !opened ? body.scrollTop : 0;
  const html = s.render();
  if (html == null) {
    sheets.pop();
    renderSheets();
    return;
  }
  root.innerHTML = `<div class="backdrop"><div class="sheet ${s.cls} ${opened ? 'pop' : ''}">
    <button class="sheet-x" data-act="close-sheet" aria-label="Close">✕</button>
    <div class="sheet-body">${html}</div></div></div>`;
  root.querySelector('.sheet-body').scrollTop = top;
}

export function refresh() {
  renderTop();
  renderView();
  renderSheets();
}

// ---------------------------------------------------------------- top bar

export function renderTop() {
  const p = G.S.player;
  const need = D.xpForLevel(p.level);
  const pct = p.level >= D.MAX_PLAYER_LEVEL ? 100 : Math.min(100, (p.xp / need) * 100);
  $('#topbar').innerHTML = `
    <button class="lvl" data-act="profile"><span class="lvl-num">${p.level}</span><span class="xpbar"><i style="width:${pct}%"></i></span></button>
    <span class="cur gold">🪙 ${G.fmt(p.gold)}</span>
    <span class="cur food">🍖 ${G.fmt(p.food)}</span>
    <span class="cur gems">💎 ${G.fmt(p.gems)}</span>
    <button class="gear" data-act="settings" aria-label="Settings">⚙️</button>`;
}

// ---------------------------------------------------------------- toasts

export function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  $('#toasts').appendChild(el);
  setTimeout(() => el.classList.add('out'), 1800);
  setTimeout(() => el.remove(), 2300);
}

// ---------------------------------------------------------------- live timers

// Elements with data-until="<timestamp>" show a countdown; data-hgold="<habitat id>" show live gold.
// When a countdown finishes, everything re-renders so buttons switch to "Ready".
export function tick() {
  const t = G.now();
  let expired = false;
  document.querySelectorAll('[data-until]').forEach((el) => {
    const left = +el.dataset.until - t;
    if (left <= 0) expired = true;
    el.textContent = G.fmtTime(left);
  });
  document.querySelectorAll('[data-hgold]').forEach((el) => {
    const h = G.buildingById(+el.dataset.hgold);
    if (h) el.textContent = G.fmt(G.habitatGold(h));
  });
  if (expired) refresh();
}

// ---------------------------------------------------------------- small shared widgets

export function elChip(el, withName = true) {
  const e = D.ELEMENTS[el];
  return `<span class="el" style="--c:${e.color}">${elementIcon(el, 19)}${withName ? ' ' + e.name : ''}</span>`;
}
export function rarityChip(r) {
  return `<span class="rar" style="--c:${D.RARITIES[r].color}">${D.RARITIES[r].name}</span>`;
}
export function dragonArt(d, cls = '') {
  return dragonSVG(D.DRAGONS[d.sp], { stage: stageFor(d.lvl), cls });
}
export function cost(c) {
  const icons = { gold: '🪙', food: '🍖', gems: '💎' };
  return Object.entries(c)
    .map(([k, v]) => `${icons[k]} ${G.fmt(v)}`)
    .join(' ');
}
export function lockNote(lvl) {
  return `<span class="lock">🔒 Lv ${lvl}</span>`;
}
