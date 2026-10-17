// Island view: plots, buildings and their sheets (habitats, farms, hatchery, breeding, totem).
import * as D from './data.js';
import * as G from './game.js';
import { dragonSVG, eggSVG } from './art.js';
import { act, view, openSheet, closeSheet, toast, elChip, rarityChip, dragonArt, cost, lockNote, esc } from './ui.js';
import { openDragon, openSpecies } from './dragons.js';

const S = () => G.S;

// ---------------------------------------------------------------- island view

view('island', () => {
  const goal = G.nextGoal();
  const n = G.plotCount();
  const plots = [];
  for (let i = 0; i < n; i++) plots.push(tile(i));
  const expandCost = G.expandCost();
  const readyCrops = G.buildingsOf('farm').filter((f) => f.crop && f.crop.readyAt <= G.now()).length;
  const questBadge = questsClaimable();
  return `
  ${goal ? `<div class="goal">💡 ${goal}</div>` : ''}
  ${!S().daily.loginClaimed ? `<button class="banner" data-act="quests">🎁 Daily reward ready! Day ${S().daily.streak}</button>` : ''}
  <div class="quick">
    <button class="btn" data-act="collect-all">🪙 Collect all</button>
    <button class="btn" data-act="harvest-all" ${readyCrops ? '' : 'disabled'}>🍖 Harvest${readyCrops ? ` (${readyCrops})` : ''}</button>
    <button class="btn" data-act="quests">📜 Quests${questBadge ? ` <b class="badge">${questBadge}</b>` : ''}</button>
  </div>
  <div class="island">${plots.join('')}</div>
  ${expandCost != null ? `<button class="btn wide expand" data-act="expand">🏝️ Expand island (+${D.PLOTS_PER_EXPANSION} plots) · ${cost({ gold: expandCost })}</button>` : ''}
  `;
});

function questsClaimable() {
  let n = S().daily.loginClaimed ? 0 : 1;
  n += S().daily.quests.filter((q) => !q.claimed && q.progress >= D.DAILY_QUESTS.find((x) => x.id === q.id).goal).length;
  n += D.ACHIEVEMENTS.filter((a) => G.achievementState(a).claimable).length;
  return n;
}

function tile(i) {
  const b = G.buildingAt(i);
  if (!b) return `<button class="plot empty" data-act="build" data-plot="${i}">＋</button>`;
  const open = `data-act="open-b" data-id="${b.id}"`;
  switch (b.type) {
    case 'habitat': {
      const e = D.ELEMENTS[b.element];
      const ds = G.dragonsIn(b);
      const gold = G.habitatGold(b);
      const full = gold >= G.habitatGoldCap(b);
      return `<div class="plot hab" style="--c:${e.color}" ${open}>
        <div class="plot-title">${e.icon} ${e.name}<small>Lv ${b.level + 1}</small></div>
        <div class="minis">${ds.map((d) => dragonArt(d, 'mini')).join('') || '<span class="muted">empty</span>'}</div>
        <div class="plot-foot">🐉 ${ds.length}/${G.habitatCapacity(b)}</div>
        ${ds.length || gold >= 1 ? `<button class="bubble ${full ? 'full' : ''}" data-act="collect" data-id="${b.id}">🪙 <span data-hgold="${b.id}">${G.fmt(gold)}</span></button>` : ''}
      </div>`;
    }
    case 'farm': {
      const c = b.crop && D.CROPS.find((x) => x.id === b.crop.id);
      const ready = c && b.crop.readyAt <= G.now();
      return `<div class="plot farm" ${open}>
        <div class="plot-title">🌱 Farm</div>
        <div class="big">${c ? c.icon : '🟫'}</div>
        <div class="plot-foot">${c ? (ready ? 'Ready!' : `<span data-until="${b.crop.readyAt}"></span>`) : 'Tap to plant'}</div>
        ${ready ? `<button class="bubble" data-act="harvest" data-id="${b.id}">🍖 +${c.food}</button>` : ''}
      </div>`;
    }
    case 'hatchery': {
      const ready = S().eggs.filter((e) => e.readyAt <= G.now()).length;
      return `<div class="plot special hatch" ${open}>
        <div class="plot-title">🥚 Hatchery</div>
        <div class="minis eggs">${S().eggs.map((e) => eggSVG(D.DRAGONS[e.sp], 'mini')).join('') || '<span class="muted">no eggs</span>'}</div>
        <div class="plot-foot">${S().eggs.length}/${G.hatcherySlots()} eggs</div>
        ${ready ? `<span class="bubble">✨ ${ready} ready</span>` : ''}
      </div>`;
    }
    case 'sanctuary': {
      const slots = S().breeding;
      const ready = slots.filter((x) => x.readyAt <= G.now()).length;
      const next = slots.filter((x) => x.readyAt > G.now()).sort((x, y) => x.readyAt - y.readyAt)[0];
      return `<div class="plot special breed" ${open}>
        <div class="plot-title">💞 Breeding</div>
        <div class="big">${slots.length ? '🥚' : '💞'}</div>
        <div class="plot-foot">${next ? `<span data-until="${next.readyAt}"></span>` : slots.length ? 'Done!' : `${slots.length}/${G.sanctuarySlots()} busy`}</div>
        ${ready ? `<span class="bubble">✨ ${ready} ready</span>` : ''}
      </div>`;
    }
    case 'totem': {
      const w = S().wish && D.DRAGONS[S().wish];
      return `<div class="plot special totem" ${open}>
        <div class="plot-title">🗿 Wish Totem</div>
        <div class="minis">${w ? dragonSVG(w, { cls: 'mini' }) : '<span class="big">🌠</span>'}</div>
        <div class="plot-foot">${w ? esc(w.name) : 'No wish'}</div>
      </div>`;
    }
    case 'deco': {
      const d = D.DECORATIONS.find((x) => x.id === b.deco);
      return `<div class="plot deco" ${open}>
        <div class="plot-title">${d.name}</div>
        <div class="big">${d.icon}</div>
        <div class="plot-foot">+${d.bonus}% gold</div>
      </div>`;
    }
  }
  return '';
}

act('collect', (d) => {
  const g = G.collect(G.buildingById(+d.id));
  if (g) toast(`+${G.fmt(g)} gold`);
});
act('collect-all', () => G.collectAll());
act('harvest', (d) => {
  const f = G.harvest(G.buildingById(+d.id));
  if (f) toast(`+${G.fmt(f)} food`);
});
act('harvest-all', () => G.harvestAll());
act('expand', () => G.expand());

act('open-b', (d) => {
  const b = G.buildingById(+d.id);
  const open = { habitat: habitatSheet, farm: farmSheet, hatchery: hatcherySheet, sanctuary: sanctuarySheet, totem: totemSheet, deco: decoSheet }[b.type];
  openSheet(() => (G.buildingById(b.id) ? open(b) : null));
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
act('up-hab', (d) => G.upgradeHabitat(G.buildingById(+d.id)));

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
        : `<p class="center">Ready in <b data-until="${f.crop.readyAt}"></b></p>
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
          <small>${ready ? 'Ready to hatch!' : `Hatching in <b data-until="${e.readyAt}"></b>`}</small></div>
        ${ready
          ? `<button class="btn gold" data-act="hatch" data-uid="${e.uid}">Hatch</button>`
          : `<button class="btn" data-act="speed" data-kind="egg" data-id="${e.uid}">💎 ${G.speedUpCost(e.readyAt)}</button>`}
      </div>`;
    }).join('')}
    ${next ? `<button class="btn wide" data-act="up-special" data-id="${b.id}">${S().player.level < next.unlock ? `Upgrade to ${next.slots} slots ${lockNote(next.unlock)}` : `Upgrade to ${next.slots} slots · ${cost({ gold: next.cost })}`}</button>` : ''}`;
}
act('up-special', (d) => G.upgradeSpecial(G.buildingById(+d.id)));

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
  const sp = D.DRAGONS[res.dragon.sp];
  if (res.firstTime) {
    openSheet(() => `<div class="reveal">
      <p class="muted">New dragon discovered!</p>
      ${dragonSVG(sp, { cls: 'hero' })}
      <h2>${sp.name}</h2>
      <p>${rarityChip(sp.rarity)} ${sp.elements.map((x) => elChip(x)).join(' ')}</p>
      <button class="btn wide gold" data-act="close-sheet">Awesome!</button></div>`, { cls: 'celebrate' });
  } else {
    toast(`${sp.name} hatched!`);
  }
});

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
          <small>${ready ? 'Move it to the Hatchery' : `Ready in <b data-until="${x.readyAt}"></b>`}</small></div>
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
  if (G.startBreed(A, B)) {
    sel.a = sel.b = null;
    toast('Breeding started! 💞');
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
