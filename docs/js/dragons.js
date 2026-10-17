// Dragons tab, Dragon Book tab, and the dragon / species / element-chart sheets.
import * as D from './data.js';
import * as G from './game.js';
import { dragonSVG, elementIcon } from './art.js';
import { act, view, openSheet, closeSheet, toast, elChip, rarityChip, dragonArt, cost, esc } from './ui.js';

const S = () => G.S;
let sortBy = 'power';
let bookFilter = 'all';

// ---------------------------------------------------------------- dragons tab

view('dragons', () => {
  const list = [...S().dragons];
  const rank = (d) => D.RARITY_ORDER.indexOf(D.DRAGONS[d.sp].rarity);
  if (sortBy === 'power') list.sort((a, b) => G.power(b) - G.power(a));
  if (sortBy === 'level') list.sort((a, b) => b.lvl - a.lvl);
  if (sortBy === 'rarity') list.sort((a, b) => rank(b) - rank(a) || b.lvl - a.lvl);
  if (sortBy === 'den') list.sort((a, b) => (a.hab == null ? 0 : 1) - (b.hab == null ? 0 : 1));
  const tab = (k, label) => `<button class="pill ${sortBy === k ? 'on' : ''}" data-act="sort" data-k="${k}">${label}</button>`;
  return `<h1>My Dragons <small>${list.length}</small></h1>
    <div class="pills">${tab('power', 'Power')}${tab('level', 'Level')}${tab('rarity', 'Rarity')}${tab('den', 'In Den')}</div>
    <div class="cards">${list.map((d) => {
      const sp = D.DRAGONS[d.sp];
      return `<button class="dcard" data-act="dragon" data-uid="${d.uid}" style="--r:${D.RARITIES[sp.rarity].color}">
        ${dragonArt(d)}<b>${esc(G.dragonName(d))}</b>
        <small>Lv ${d.lvl} · ${sp.elements.map((x) => D.ELEMENTS[x].icon).join('')}${d.hab == null ? ' · 🏚️' : ''}</small>
        <small class="pow">⚔️ ${G.fmt(G.power(d))}</small></button>`;
    }).join('') || '<p class="muted">No dragons yet. Your first egg is in the Hatchery!</p>'}</div>`;
});
act('sort', (d) => {
  sortBy = d.k;
  G.changed();
});

// ---------------------------------------------------------------- dragon sheet

export function openDragon(uid) {
  openSheet(() => {
    const d = G.dragonByUid(uid);
    return d ? dragonSheet(d) : null;
  });
}

function dragonSheet(d) {
  const sp = D.DRAGONS[d.sp];
  const st = G.stats(d);
  const fc = G.feedCost(d);
  const hab = d.hab != null ? G.buildingById(d.hab) : null;
  const breeding = S().breeding.some((b) => b.a === d.uid || b.b === d.uid);
  return `<div class="center">${dragonArt(d, 'hero')}</div>
    <h2 class="center">${esc(G.dragonName(d))} <button class="link" data-act="rename" data-uid="${d.uid}">✏️</button></h2>
    <p class="center">${rarityChip(sp.rarity)} ${sp.elements.map((x) => elChip(x)).join(' ')}</p>
    ${d.nick ? `<p class="center muted small">${sp.name}</p>` : ''}
    <div class="stat-row">
      <div><small>Level</small><b>${d.lvl}/${D.MAX_DRAGON_LEVEL}</b></div>
      <div><small>HP</small><b>❤️ ${st.hp}</b></div>
      <div><small>Attack</small><b>⚔️ ${st.atk}</b></div>
      <div><small>Gold</small><b>🪙 ${G.fmt(st.gold * 60)}/h</b></div>
    </div>
    ${fc != null
      ? `<button class="btn wide gold" data-act="feed" data-uid="${d.uid}" ${G.canAfford({ food: fc }) ? '' : 'disabled'}>Feed to Lv ${d.lvl + 1} · ${cost({ food: fc })}</button>`
      : '<p class="center">⭐ Max level!</p>'}
    <h3>Attacks</h3>
    ${attackRows(sp, d.lvl)}
    <h3>Home</h3>
    <div class="row static"><span class="row-icon">${hab ? D.ELEMENTS[hab.element].icon : '🏚️'}</span>
      <span class="row-main"><b>${hab ? D.ELEMENTS[hab.element].name + ' Habitat' : 'Dragon Den'}</b><small>${hab ? 'Earning gold' : 'In storage, not earning gold'}</small></span>
      <button class="btn" data-act="move" data-uid="${d.uid}">Move</button></div>
    <button class="btn wide ghost" data-act="species" data-id="${sp.id}">📖 Dragon Book entry</button>
    <button class="btn wide ghost danger" data-act="sell-dragon" data-uid="${d.uid}" ${breeding ? 'disabled' : ''}>Sell for ${cost({ gold: G.sellPrice(d) })}</button>`;
}

function attackRows(sp, lvl) {
  return G.attacksFor(sp, lvl).map((a) => {
    const e = a.el === 'neutral' ? { icon: '👊', color: '#9e9e9e', name: 'Neutral' } : D.ELEMENTS[a.el];
    return `<div class="atk ${a.unlocked ? '' : 'locked'}" style="--c:${e.color}">
      <span>${elementIcon(a.el, 24)}</span><b>${a.name}</b>
      <small>Power ${a.power}×${a.cooldown ? ` · cooldown ${a.cooldown}` : ''}${a.unlocked ? '' : ` · 🔒 Lv ${a.lvl}`}</small></div>`;
  }).join('');
}

act('feed', (d) => G.feed(G.dragonByUid(+d.uid)));
act('rename', (d) => {
  const dr = G.dragonByUid(+d.uid);
  const name = prompt('Name your dragon', G.dragonName(dr));
  if (name != null) G.renameDragon(dr, name);
});
act('sell-dragon', (d) => {
  const dr = G.dragonByUid(+d.uid);
  if (confirm(`Sell ${G.dragonName(dr)} for ${G.sellPrice(dr)} gold? This can't be undone.`)) {
    G.sellDragon(dr);
    if (!G.dragonByUid(dr.uid)) closeSheet();
  }
});

act('move', (d) => openSheet(() => moveSheet(+d.uid)));
function moveSheet(uid) {
  const dr = G.dragonByUid(uid);
  if (!dr) return null;
  const sp = D.DRAGONS[dr.sp];
  const habs = G.eligibleHabitats(sp).filter((h) => h.id !== dr.hab);
  return `<h2>Move ${esc(G.dragonName(dr))}</h2>
    ${habs.map((h) => `<button class="row" data-act="move-to" data-uid="${uid}" data-hab="${h.id}">
      <span class="row-icon">${D.ELEMENTS[h.element].icon}</span>
      <span class="row-main"><b>${D.ELEMENTS[h.element].name} Habitat</b><small>${G.dragonsIn(h).length}/${G.habitatCapacity(h)} dragons</small></span></button>`).join('')}
    ${habs.length ? '' : `<p class="muted">No other habitat with space for ${sp.elements.map((x) => D.ELEMENTS[x].name).join('/')} dragons.</p>`}
    ${dr.hab != null ? `<button class="row" data-act="move-to" data-uid="${uid}" data-hab=""><span class="row-icon">🏚️</span>
      <span class="row-main"><b>Dragon Den</b><small>Storage, no gold</small></span></button>` : ''}`;
}
act('move-to', (d) => {
  G.moveDragon(G.dragonByUid(+d.uid), d.hab === '' ? null : +d.hab);
  closeSheet();
  toast('Moved!');
});

// ---------------------------------------------------------------- dragon book

view('book', () => {
  const owned = G.ownedSpeciesCount();
  const list = D.DRAGON_LIST.filter((d) => bookFilter === 'all' || d.rarity === bookFilter);
  const tab = (k, label) => `<button class="pill ${bookFilter === k ? 'on' : ''}" data-act="book-filter" data-k="${k}">${label}</button>`;
  return `<h1>Dragon Book <small>${owned}/${D.DRAGON_LIST.length}</small></h1>
    <button class="btn wide" data-act="chart">🔥💧🌿 Element chart</button>
    <div class="pills">${tab('all', 'All')}${D.RARITY_ORDER.map((r) => tab(r, D.RARITIES[r].name)).join('')}</div>
    <div class="cards">${list.map((sp) => {
      const has = S().book[sp.id] === 2;
      return `<button class="dcard ${has ? '' : 'dim'}" data-act="species" data-id="${sp.id}" style="--r:${D.RARITIES[sp.rarity].color}">
        ${dragonSVG(sp, { cls: has ? '' : 'unowned' })}<b>${sp.name}</b>
        <small>${sp.elements.map((x) => D.ELEMENTS[x].icon).join('')}${has ? ' ✅' : ''}</small></button>`;
    }).join('')}</div>`;
});
act('book-filter', (d) => {
  bookFilter = d.k;
  G.changed();
});

export function openSpecies(id) {
  openSheet(() => speciesSheet(D.DRAGONS[id]));
}

function speciesSheet(sp) {
  const has = S().book[sp.id] === 2;
  const base = G.statsFor(sp, 1);
  const max = G.statsFor(sp, D.MAX_DRAGON_LEVEL);
  const totem = G.buildingsOf('totem').length;
  const usedIn = D.DRAGON_LIST.filter((x) => x.recipe && x.recipe.includes(sp.id));
  const canBuy = sp.price && S().player.level >= sp.unlock;
  return `<div class="center">${dragonSVG(sp, { cls: 'hero' })}</div>
    <h2 class="center">${sp.name} ${has ? '✅' : ''}</h2>
    <p class="center">${rarityChip(sp.rarity)} ${sp.elements.map((x) => elChip(x)).join(' ')}</p>
    <h3>How to get</h3><p>${D.howToGet(sp)}</p>
    ${usedIn.length ? `<p class="small">Parent of: ${usedIn.map((x) => `<button class="link" data-act="species" data-id="${x.id}">${x.name}</button>`).join(', ')}</p>` : ''}
    <div class="stat-row">
      <div><small>HP</small><b>${base.hp} → ${max.hp}</b></div>
      <div><small>Attack</small><b>${base.atk} → ${max.atk}</b></div>
      <div><small>Gold/h</small><b>${G.fmt(base.gold * 60)} → ${G.fmt(max.gold * 60)}</b></div>
    </div>
    <p class="small muted">Breed/hatch time: ${G.fmtTime(D.RARITIES[sp.rarity].time * 1000)} each (at Normal speed).</p>
    <h3>Attacks</h3>${attackRows(sp, D.MAX_DRAGON_LEVEL)}
    <h3>Strong / weak</h3>${matchup(sp.elements[0])}
    ${canBuy ? `<button class="btn wide gold" data-act="buy-egg" data-id="${sp.id}">Buy egg · ${cost({ gold: sp.price })}</button>` : ''}
    ${totem && sp.rarity !== 'common' ? `<button class="btn wide" data-act="wish-set" data-id="${sp.id}">🗿 Set as wish</button>` : ''}`;
}

function matchup(el) {
  const strong = D.ELEMENTS[el].strong;
  const weak = Object.keys(D.ELEMENTS).filter((k) => D.ELEMENTS[k].strong.includes(el));
  return `<p class="small">Its ${D.ELEMENTS[el].name} attacks deal <b>2×</b> to: ${strong.map((x) => elChip(x)).join(' ') || '—'}</p>
    <p class="small">It takes <b>2×</b> damage from: ${weak.map((x) => elChip(x)).join(' ') || '—'}</p>`;
}

act('chart', () => openSheet(() => `<h2>Element chart</h2>
  <p class="muted small">Attacks deal 2× damage to dragons whose main (first) element they are strong against, and ½ damage when the defender is strong against them.</p>
  ${Object.keys(D.ELEMENTS).map((el) => {
    const weak = Object.keys(D.ELEMENTS).filter((k) => D.ELEMENTS[k].strong.includes(el));
    return `<div class="chart-row"><div>${elChip(el)}</div>
      <div><small>Strong vs</small>${D.ELEMENTS[el].strong.map((x) => elChip(x, false)).join('')}</div>
      <div><small>Weak to</small>${weak.map((x) => elChip(x, false)).join('') || '—'}</div></div>`;
  }).join('')}`));

act('buy-egg', (d) => G.buyEgg(d.id));
