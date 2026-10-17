// Game state and rules. No DOM code here: the UI calls these functions and
// listens for 'change' / 'toast' events.
import * as D from './data.js';

const SAVE_KEY = 'dragon-isles-save-v1';
const listeners = {};
export let S = null;

export const now = () => Date.now();

export function on(evt, fn) {
  (listeners[evt] ||= []).push(fn);
}
function emit(evt, ...args) {
  for (const fn of listeners[evt] || []) fn(...args);
}
export function changed() {
  emit('change');
  scheduleSave();
}
export function toast(msg) {
  emit('toast', msg);
}

// ---------------------------------------------------------------- save / load

function newState() {
  const t = now();
  const s = {
    v: 1,
    created: t,
    nextId: 1,
    player: { level: 1, xp: 0, gold: 600, food: 100, gems: 10 },
    settings: { speed: 1, sound: true },
    expansions: 0,
    buildings: [],
    dragons: [],
    eggs: [],
    breeding: [],
    book: {},
    wish: null,
    campaign: {},
    arena: { trophies: 0, bestLeague: 0 },
    tower: { best: 0 },
    daily: { day: '', quests: [], bonusClaimed: false, streak: 0, lastLogin: '', loginClaimed: false },
    stats: { bred: 0, hatched: 0, won: 0, goldCollected: 0, maxLevel: 1 },
    achievements: {},
  };
  S = s;
  // Plots 0-15 form a 4x4 grid on the main island; start everything near the middle.
  addBuilding('hatchery', { level: 0 }, 1);
  addBuilding('sanctuary', { level: 0 }, 2);
  addBuilding('habitat', { element: 'fire', level: 0, stored: 0, last: t }, 5);
  addBuilding('farm', { crop: null }, 6);
  s.eggs.push({ uid: nid(), sp: 'emberjaw', readyAt: t + 5000 });
  return s;
}

export function load() {
  let raw = null;
  try {
    raw = localStorage.getItem(SAVE_KEY);
  } catch (e) { /* storage blocked */ }
  if (raw) {
    try {
      S = JSON.parse(raw);
    } catch (e) {
      S = null;
    }
  }
  if (!S || S.v !== 1) newState();
  checkDaily();
  return S;
}

let saveTimer = null;
function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, 500);
}
export function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(S));
  } catch (e) { /* storage blocked */ }
}
export function exportSave() {
  return btoa(unescape(encodeURIComponent(JSON.stringify(S))));
}
export function importSave(text) {
  const parsed = JSON.parse(decodeURIComponent(escape(atob(text.trim()))));
  if (!parsed || parsed.v !== 1 || !parsed.player) throw new Error('Not a Dragon Isles save');
  S = parsed;
  save();
  changed();
}
export function resetGame() {
  newState();
  checkDaily();
  save();
  changed();
}

function nid() {
  return S.nextId++;
}

// ---------------------------------------------------------------- currencies & xp

export function canAfford(cost) {
  return Object.entries(cost).every(([k, v]) => S.player[k] >= v);
}
export function spend(cost) {
  if (!canAfford(cost)) {
    const missing = Object.keys(cost).find((k) => S.player[k] < cost[k]);
    toast(`Not enough ${missing}`);
    return false;
  }
  for (const [k, v] of Object.entries(cost)) S.player[k] -= v;
  return true;
}
export function give(reward) {
  for (const k of ['gold', 'food', 'gems']) if (reward[k]) S.player[k] += reward[k];
  if (reward.xp) addXp(reward.xp);
}

export function addXp(n) {
  const p = S.player;
  if (p.level >= D.MAX_PLAYER_LEVEL) return;
  p.xp += Math.round(n);
  while (p.level < D.MAX_PLAYER_LEVEL && p.xp >= D.xpForLevel(p.level)) {
    p.xp -= D.xpForLevel(p.level);
    p.level++;
    p.gems += 3;
    p.gold += 100 * p.level;
    emit('levelup', p.level);
  }
}

// ---------------------------------------------------------------- timers

export function duration(seconds) {
  const sp = S.settings.speed;
  return sp === 0 ? 0 : (seconds * 1000) / sp;
}

export function setSpeed(speed) {
  const old = S.settings.speed;
  if (old === speed) return;
  const t = now();
  const rescale = (at) => {
    if (at <= t) return at;
    if (speed === 0) return t;
    const remaining = at - t;
    return t + (old === 0 ? 0 : (remaining * old) / speed);
  };
  for (const e of S.eggs) e.readyAt = rescale(e.readyAt);
  for (const b of S.breeding) b.readyAt = rescale(b.readyAt);
  for (const f of buildingsOf('farm')) if (f.crop) f.crop.readyAt = rescale(f.crop.readyAt);
  S.settings.speed = speed;
  changed();
}

export function speedUpCost(readyAt) {
  const mins = (readyAt - now()) / 60000;
  return mins <= 0 ? 0 : Math.max(1, Math.ceil(mins / 3));
}

// ---------------------------------------------------------------- buildings

function addBuilding(type, props, plot) {
  const b = { id: nid(), type, plot, ...props };
  S.buildings.push(b);
  return b;
}
export const buildingById = (id) => S.buildings.find((b) => b.id === id);
export const buildingsOf = (type) => S.buildings.filter((b) => b.type === type);
export const plotCount = () => D.START_PLOTS + S.expansions * D.PLOTS_PER_EXPANSION;
export const buildingAt = (plot) => S.buildings.find((b) => b.plot === plot);

export function expandCost() {
  return D.PLOT_EXPANSIONS[S.expansions] ?? null;
}
export function expand() {
  const cost = expandCost();
  if (cost == null || !spend({ gold: cost })) return;
  S.expansions++;
  addXp(cost / 50);
  toast(`Island expanded! +${D.PLOTS_PER_EXPANSION} plots`);
  changed();
}

export function habitatCost(element) {
  return D.HABITAT_COST[element];
}
export function farmCost() {
  return D.FARM_COSTS[buildingsOf('farm').length] ?? null;
}
export function farmUnlock() {
  return D.FARM_UNLOCK[buildingsOf('farm').length] ?? 999;
}

// What can be built on an empty plot, with cost and lock state.
export function buildOptions() {
  const lvl = S.player.level;
  const opts = [];
  for (const el of Object.keys(D.HABITAT_COST)) {
    opts.push({ key: `habitat:${el}`, type: 'habitat', element: el, cost: habitatCost(el), unlock: D.ELEMENT_UNLOCK[el] });
  }
  const fc = farmCost();
  if (fc != null) opts.push({ key: 'farm', type: 'farm', cost: fc, unlock: farmUnlock() });
  if (!buildingsOf('totem').length) opts.push({ key: 'totem', type: 'totem', cost: D.TOTEM.cost, unlock: D.TOTEM.unlock });
  for (const d of D.DECORATIONS) opts.push({ key: `deco:${d.id}`, type: 'deco', deco: d.id, cost: d.cost, unlock: d.unlock });
  for (const o of opts) o.locked = lvl < o.unlock;
  return opts;
}

export function build(opt, plot) {
  if (buildingAt(plot) || opt.locked) return null;
  if (!spend({ gold: opt.cost })) return null;
  let b;
  if (opt.type === 'habitat') {
    b = addBuilding('habitat', { element: opt.element, level: 0, stored: 0, last: now() }, plot);
  } else if (opt.type === 'farm') {
    b = addBuilding('farm', { crop: null }, plot);
  } else if (opt.type === 'totem') {
    b = addBuilding('totem', {}, plot);
  } else if (opt.type === 'deco') {
    settleAll();
    b = addBuilding('deco', { deco: opt.deco }, plot);
  }
  addXp(Math.max(5, opt.cost / 20));
  changed();
  return b;
}

export function moveBuilding(b, plot) {
  if (buildingAt(plot) || plot >= plotCount()) return;
  b.plot = plot;
  changed();
}

export function sellBuilding(b) {
  if (b.type === 'hatchery' || b.type === 'sanctuary') return;
  if (b.type === 'habitat' && dragonsIn(b).length) {
    toast('Move the dragons out first');
    return;
  }
  if (b.type === 'habitat') collect(b, true);
  if (b.type === 'deco') settleAll();
  S.buildings = S.buildings.filter((x) => x !== b);
  changed();
}

// --- habitats

export function habitatCapacity(h) {
  return D.HABITAT_LEVELS[h.level].capacity;
}
export function habitatGoldCap(h) {
  return D.HABITAT_LEVELS[h.level].goldCap * (D.HABITAT_CAP_MULT[h.element] || 1);
}
export function habitatUpgradeCost(h) {
  const next = h.level + 1;
  if (next >= D.HABITAT_LEVELS.length) return null;
  return Math.max(500 * next, habitatCost(h.element) * D.HABITAT_UPGRADE_MULT[next]);
}
export function upgradeHabitat(h) {
  const cost = habitatUpgradeCost(h);
  if (cost == null || !spend({ gold: cost })) return;
  settle(h);
  h.level++;
  addXp(cost / 20);
  toast('Habitat upgraded!');
  changed();
}
export const dragonsIn = (h) => S.dragons.filter((d) => d.hab === h.id);

export function decoBonus() {
  let pct = 0;
  for (const b of buildingsOf('deco')) pct += D.DECORATIONS.find((d) => d.id === b.deco).bonus;
  return Math.min(D.MAX_DECO_BONUS, pct);
}
function habitatRatePerMs(h) {
  const perMin = dragonsIn(h).reduce((sum, d) => sum + stats(d).gold, 0);
  return (perMin * (1 + decoBonus() / 100)) / 60000;
}
export function habitatGoldPerMin(h) {
  return habitatRatePerMs(h) * 60000;
}
export function habitatGold(h) {
  const t = now();
  return Math.min(habitatGoldCap(h), h.stored + habitatRatePerMs(h) * (t - h.last));
}
function settle(h) {
  h.stored = habitatGold(h);
  h.last = now();
}
function settleAll() {
  for (const h of buildingsOf('habitat')) settle(h);
}
export function collect(h, silent = false) {
  const g = Math.floor(habitatGold(h));
  h.stored = habitatGold(h) - g;
  h.last = now();
  if (g <= 0) return 0;
  S.player.gold += g;
  S.stats.goldCollected += g;
  addXp(g / 50);
  quest('collect');
  if (!silent) changed();
  return g;
}
export function collectAll() {
  let total = 0;
  for (const h of buildingsOf('habitat')) total += collect(h, true);
  if (total > 0) toast(`+${fmt(total)} gold`);
  changed();
  return total;
}

// --- farms

export function plant(farm, cropId) {
  const crop = D.CROPS.find((c) => c.id === cropId);
  if (farm.crop || S.player.level < crop.unlock || !spend({ gold: crop.cost })) return;
  farm.crop = { id: cropId, readyAt: now() + duration(crop.time) };
  changed();
}
export function harvest(farm) {
  if (!farm.crop || farm.crop.readyAt > now()) return 0;
  const crop = D.CROPS.find((c) => c.id === farm.crop.id);
  farm.crop = null;
  S.player.food += crop.food;
  addXp(crop.food / 20);
  quest('harvest');
  changed();
  return crop.food;
}
export function harvestAll() {
  let total = 0;
  for (const f of buildingsOf('farm')) {
    if (f.crop && f.crop.readyAt <= now()) {
      const crop = D.CROPS.find((c) => c.id === f.crop.id);
      f.crop = null;
      total += crop.food;
      quest('harvest');
    }
  }
  if (total) {
    S.player.food += total;
    addXp(total / 20);
    toast(`+${fmt(total)} food`);
    changed();
  }
  return total;
}

// --- hatchery & sanctuary

export function hatcherySlots() {
  return D.HATCHERY_LEVELS[buildingsOf('hatchery')[0].level].slots;
}
export function sanctuarySlots() {
  return D.SANCTUARY_LEVELS[buildingsOf('sanctuary')[0].level].slots;
}
export function upgradeCost(b) {
  const table = b.type === 'hatchery' ? D.HATCHERY_LEVELS : D.SANCTUARY_LEVELS;
  return table[b.level + 1] || null;
}
export function upgradeSpecial(b) {
  const next = upgradeCost(b);
  if (!next) return;
  if (S.player.level < next.unlock) {
    toast(`Reach level ${next.unlock} first`);
    return;
  }
  if (!spend({ gold: next.cost })) return;
  b.level++;
  addXp(next.cost / 20);
  toast('Upgraded!');
  changed();
}

export function buyEgg(spId) {
  const sp = D.DRAGONS[spId];
  if (S.player.level < sp.unlock) return;
  if (S.eggs.length >= hatcherySlots()) {
    toast('Hatchery is full');
    return;
  }
  if (!spend({ gold: sp.price })) return;
  S.eggs.push({ uid: nid(), sp: spId, readyAt: now() + duration(D.RARITIES[sp.rarity].time) });
  toast(`${sp.name} egg is in the Hatchery`);
  changed();
}

export function eligibleHabitats(sp) {
  return buildingsOf('habitat').filter((h) => sp.elements.includes(h.element) && dragonsIn(h).length < habitatCapacity(h));
}

// habId null puts the dragon in the Dragon Den (storage, earns no gold).
export function hatch(egg, habId) {
  if (egg.readyAt > now()) return null;
  const sp = D.DRAGONS[egg.sp];
  if (habId != null) {
    const h = buildingById(habId);
    if (!h || !eligibleHabitats(sp).includes(h)) return null;
    settle(h);
  }
  S.eggs = S.eggs.filter((e) => e !== egg);
  const d = { uid: nid(), sp: egg.sp, lvl: 1, hab: habId };
  S.dragons.push(d);
  const firstTime = S.book[egg.sp] !== 2;
  S.book[egg.sp] = 2;
  S.stats.hatched++;
  addXp(D.RARITIES[sp.rarity].hatchXp);
  quest('hatch');
  changed();
  return { dragon: d, firstTime };
}

export function breedPool(a, b) {
  const U = new Set([...a.elements, ...b.elements].filter((e) => D.BASE_ELEMENTS.includes(e)));
  const normal = [];
  const special = [];
  for (const d of D.DRAGON_LIST) {
    if (d.recipe) {
      const [x, y] = d.recipe;
      if ((x === a.id && y === b.id) || (x === b.id && y === a.id)) special.push(d);
    } else if (d.elements.every((e) => U.has(e))) {
      normal.push(d);
    }
  }
  const wish = S.wish && buildingsOf('totem').length ? S.wish : null;
  const weight = (d) => D.RARITIES[d.rarity].weight * (d.id === wish ? D.TOTEM.boost : 1);
  const total = normal.reduce((s, d) => s + weight(d), 0);
  const out = [];
  let specialShare = 0;
  for (const d of special) {
    let p = d.rarity === 'mythic' ? 0.12 : 0.2;
    if (d.id === wish) p = Math.min(0.5, p * 2);
    specialShare += p;
    out.push({ sp: d, chance: p });
  }
  for (const d of normal) out.push({ sp: d, chance: (weight(d) / total) * (1 - specialShare) });
  out.sort((x, y) => y.chance - x.chance);
  return out;
}

export function canBreed(d) {
  return d.lvl >= D.BREED_MIN_LEVEL && !S.breeding.some((b) => b.a === d.uid || b.b === d.uid);
}

export function startBreed(da, db) {
  if (da === db || !canBreed(da) || !canBreed(db)) return null;
  if (S.breeding.length >= sanctuarySlots()) {
    toast('Breeding Sanctuary is busy');
    return null;
  }
  const pool = breedPool(D.DRAGONS[da.sp], D.DRAGONS[db.sp]);
  let r = Math.random();
  let pick = pool[pool.length - 1].sp;
  for (const o of pool) {
    if ((r -= o.chance) <= 0) {
      pick = o.sp;
      break;
    }
  }
  const slot = { uid: nid(), a: da.uid, b: db.uid, sp: pick.id, readyAt: now() + duration(D.RARITIES[pick.rarity].time) };
  S.breeding.push(slot);
  S.stats.bred++;
  if (!S.book[pick.id]) S.book[pick.id] = 1;
  addXp(10);
  quest('breed');
  changed();
  return slot;
}

// Finished breeding becomes an egg in the hatchery (hatch timer = breed timer, like the original).
export function collectBreed(slot) {
  if (slot.readyAt > now()) return false;
  if (S.eggs.length >= hatcherySlots()) {
    toast('Hatchery is full: hatch an egg first');
    return false;
  }
  const sp = D.DRAGONS[slot.sp];
  S.breeding = S.breeding.filter((b) => b !== slot);
  S.eggs.push({ uid: nid(), sp: slot.sp, readyAt: now() + duration(D.RARITIES[sp.rarity].time) });
  toast(`${sp.name} egg moved to the Hatchery!`);
  changed();
  return true;
}

export function speedUp(item) {
  const cost = speedUpCost(item.readyAt);
  if (cost <= 0 || !spend({ gems: cost })) return;
  item.readyAt = now();
  changed();
}

export function setWish(spId) {
  S.wish = spId;
  changed();
}

// --- dragons

export function stats(d) {
  return statsFor(D.DRAGONS[d.sp], d.lvl);
}
export function statsFor(sp, lvl) {
  const r = D.RARITIES[sp.rarity];
  return {
    hp: Math.round(r.hp * (1 + 0.12 * (lvl - 1))),
    atk: Math.round(r.atk * (1 + 0.1 * (lvl - 1))),
    gold: r.gold * (1 + 0.2 * (lvl - 1)),
  };
}
export function power(d) {
  const s = stats(d);
  return Math.round((s.hp * s.atk) / 20);
}

export function attacksFor(sp, lvl) {
  const e = sp.elements;
  const slots = [
    { el: e[0], tier: 0, lvl: 1 },
    e[1] ? { el: e[1], tier: 0, lvl: 4 } : { el: 'neutral', tier: 0, lvl: 4 },
    { el: e[0], tier: 1, lvl: 10 },
    { el: e[2] || e[1] || e[0], tier: 2, lvl: 20 },
  ];
  return slots.map((s) => ({
    ...s,
    name: s.el === 'neutral' ? 'Headbutt' : D.ATTACKS[s.el][s.tier],
    power: s.el === 'neutral' ? 1.15 : D.TIER_POWER[s.tier],
    cooldown: D.TIER_COOLDOWN[s.tier],
    unlocked: lvl >= s.lvl,
  }));
}

export function feedCost(d) {
  return d.lvl >= D.MAX_DRAGON_LEVEL ? null : D.foodForLevel(d.lvl);
}
export function feed(d) {
  const cost = feedCost(d);
  if (cost == null || !spend({ food: cost })) return false;
  const h = d.hab != null ? buildingById(d.hab) : null;
  if (h) settle(h);
  d.lvl++;
  S.stats.maxLevel = Math.max(S.stats.maxLevel, d.lvl);
  addXp(cost / 10);
  quest('feed');
  changed();
  return true;
}

export function moveDragon(d, habId) {
  const sp = D.DRAGONS[d.sp];
  if (habId != null) {
    const h = buildingById(habId);
    if (!eligibleHabitats(sp).includes(h)) return;
    settle(h);
  }
  const old = d.hab != null ? buildingById(d.hab) : null;
  if (old) settle(old);
  d.hab = habId;
  changed();
}

export function sellPrice(d) {
  return Math.round(D.RARITIES[D.DRAGONS[d.sp].rarity].sell * (1 + 0.1 * (d.lvl - 1)));
}
export function sellDragon(d) {
  if (S.breeding.some((b) => b.a === d.uid || b.b === d.uid)) {
    toast('This dragon is breeding');
    return;
  }
  if (S.dragons.length <= 1) {
    toast("You can't sell your last dragon");
    return;
  }
  const old = d.hab != null ? buildingById(d.hab) : null;
  if (old) settle(old);
  S.dragons = S.dragons.filter((x) => x !== d);
  S.player.gold += sellPrice(d);
  changed();
}

export const dragonByUid = (uid) => S.dragons.find((d) => d.uid === uid);
export function dragonName(d) {
  return d.nick || D.DRAGONS[d.sp].name;
}
export function renameDragon(d, name) {
  d.nick = name.trim().slice(0, 18) || undefined;
  changed();
}

export function ownedSpeciesCount() {
  return Object.values(S.book).filter((v) => v === 2).length;
}

// ---------------------------------------------------------------- daily, quests, achievements

const dayKey = () => new Date().toDateString();

export function checkDaily() {
  const d = S.daily;
  const today = dayKey();
  if (d.day === today) return;
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  d.streak = d.lastLogin === yesterday ? d.streak + 1 : 1;
  d.lastLogin = today;
  d.day = today;
  d.loginClaimed = false;
  d.bonusClaimed = false;
  const pool = [...D.DAILY_QUESTS].sort(() => Math.random() - 0.5).slice(0, 3);
  d.quests = pool.map((q) => ({ id: q.id, progress: 0, claimed: false }));
}

export function loginReward() {
  return D.LOGIN_REWARDS[(S.daily.streak - 1) % D.LOGIN_REWARDS.length];
}
export function claimLogin() {
  if (S.daily.loginClaimed) return;
  S.daily.loginClaimed = true;
  give(loginReward());
  changed();
}

function quest(id, n = 1) {
  for (const q of S.daily.quests) if (q.id === id) q.progress += n;
}
export function claimQuest(q) {
  const def = D.DAILY_QUESTS.find((x) => x.id === q.id);
  if (q.claimed || q.progress < def.goal) return;
  q.claimed = true;
  S.player.gems += D.DAILY_QUEST_GEMS;
  changed();
}
export function claimDailyBonus() {
  if (S.daily.bonusClaimed || !S.daily.quests.every((q) => q.claimed)) return;
  S.daily.bonusClaimed = true;
  S.player.gems += D.DAILY_ALL_BONUS;
  changed();
}

export function statValue(stat) {
  return stat === 'species' ? ownedSpeciesCount() : S.stats[stat] || 0;
}
export function achievementState(a) {
  const tier = S.achievements[a.id] || 0;
  const goal = a.tiers[tier];
  return { tier, goal, done: tier >= a.tiers.length, claimable: goal != null && statValue(a.stat) >= goal };
}
export function claimAchievement(a) {
  const st = achievementState(a);
  if (!st.claimable) return;
  S.player.gems += a.gems[st.tier];
  S.achievements[a.id] = st.tier + 1;
  toast(`+${a.gems[st.tier]} gems`);
  changed();
}

export function exchange(opt) {
  if (!spend({ gems: opt.gems })) return;
  S.player[opt.label] += opt.amount(S.player.level);
  changed();
}

// ---------------------------------------------------------------- battle results

export function leagueIndex(trophies = S.arena.trophies) {
  let idx = 0;
  D.LEAGUES.forEach((l, i) => {
    if (trophies >= l.min) idx = i;
  });
  return idx;
}

export function recordBattle(mode, result) {
  const { won, info, fainted } = result;
  const rewards = { gold: 0, xp: 0, gems: 0 };
  if (won) {
    S.stats.won++;
    quest('win');
  }
  if (mode === 'campaign') {
    const s = info.stage;
    if (won) {
      const stars = fainted === 0 ? 3 : fainted === 1 ? 2 : 1;
      const prev = S.campaign[s] || 0;
      if (!prev) rewards.gems = info.boss ? 10 : 3;
      S.campaign[s] = Math.max(prev, stars);
      rewards.gold = 60 * (s + 1);
      rewards.xp = 15 * (s + 1);
      rewards.stars = stars;
    }
  } else if (mode === 'arena') {
    const delta = won ? info.trophies : -10;
    S.arena.trophies = Math.max(0, S.arena.trophies + delta);
    rewards.trophies = delta;
    if (won) {
      rewards.gold = 200 + 150 * leagueIndex();
      rewards.xp = 30;
    }
    const li = leagueIndex();
    if (li > S.arena.bestLeague) {
      for (let i = S.arena.bestLeague + 1; i <= li; i++) rewards.gems += D.LEAGUES[i].gems;
      S.arena.bestLeague = li;
      rewards.league = D.LEAGUES[li].name;
    }
  } else if (mode === 'tower') {
    const f = info.floor;
    if (won) {
      rewards.gold = 80 * f;
      rewards.xp = 10 * f;
      if (f > S.tower.best) {
        if (f % 5 === 0) rewards.gems = 5;
        S.tower.best = f;
      }
    }
  }
  give(rewards);
  changed();
  return rewards;
}

// ---------------------------------------------------------------- helpers

export function fmt(n) {
  n = Math.floor(n);
  if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, '') + 'M';
  if (n >= 1e4) return (n / 1e3).toFixed(n >= 1e5 ? 0 : 1).replace(/\.0$/, '') + 'K';
  return n.toLocaleString('en-US');
}
export function fmtTime(ms) {
  if (ms <= 0) return 'Ready!';
  const s = Math.ceil(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${sec}s`;
  return `${sec}s`;
}

// The next thing a new player should do, shown as a hint on the island.
export function nextGoal() {
  const ready = S.eggs.find((e) => e.readyAt <= now());
  if (ready) return 'Tap the Hatchery to hatch your egg!';
  if (!S.dragons.length) return 'Your first egg is hatching in the Hatchery...';
  if (S.dragons.length < 2) {
    if (!buildingsOf('habitat').some((h) => h.element === 'earth')) return 'Tap an empty plot and build an Earth Habitat.';
    if (!S.eggs.length) return 'Open the Shop and buy a Boulderhorn egg.';
    return 'Wait for your new egg to hatch.';
  }
  const breedable = S.dragons.filter((d) => d.lvl >= D.BREED_MIN_LEVEL).length;
  if (breedable < 2) return 'Plant crops on your Farm, then feed two dragons to level 4.';
  if (!S.stats.bred) return 'Open the Breeding Sanctuary and breed two dragons!';
  return null;
}
