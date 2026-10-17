// All static game content for Dragon Isles: elements, dragons, buildings, crops, rewards.

export const ELEMENTS = {
  fire:    { name: 'Fire',    icon: '🔥', color: '#ff5a36', strong: ['plant', 'metal'] },
  water:   { name: 'Water',   icon: '💧', color: '#2f8cff', strong: ['fire', 'earth'] },
  plant:   { name: 'Plant',   icon: '🌿', color: '#3cbf4a', strong: ['water', 'earth'] },
  earth:   { name: 'Earth',   icon: '🪨', color: '#b07d4f', strong: ['fire', 'storm'] },
  storm:   { name: 'Storm',   icon: '⚡', color: '#f5c518', strong: ['water', 'metal'] },
  ice:     { name: 'Ice',     icon: '❄️', color: '#7fd6ff', strong: ['plant', 'storm'] },
  metal:   { name: 'Metal',   icon: '⚙️', color: '#9aa4b1', strong: ['ice', 'war'] },
  shadow:  { name: 'Shadow',  icon: '🌑', color: '#7b4bb8', strong: ['light', 'ice'] },
  light:   { name: 'Light',   icon: '☀️', color: '#ffd84d', strong: ['shadow', 'war'] },
  war:     { name: 'War',     icon: '⚔️', color: '#c0392b', strong: ['light', 'shadow'] },
  mystic:  { name: 'Mystic',  icon: '✨', color: '#ff7ce5', strong: ['war', 'shadow', 'metal'] },
  ancient: { name: 'Ancient', icon: '🐲', color: '#ffb300', strong: ['mystic', 'ancient'] },
};

export const BASE_ELEMENTS = ['fire', 'water', 'plant', 'earth', 'storm', 'ice', 'metal', 'shadow', 'light', 'war'];

// Player level needed to buy that element's habitat (and its pure dragon egg).
export const ELEMENT_UNLOCK = {
  fire: 1, earth: 1, plant: 2, water: 3, storm: 4, ice: 5, metal: 6,
  shadow: 8, light: 8, war: 10, mystic: 15, ancient: 20,
};

export const RARITIES = {
  common:    { name: 'Common',    color: '#9fb3c8', hp: 100, atk: 20, gold: 3,  time: 60,       hatchXp: 20,   sell: 50,    weight: 50 },
  rare:      { name: 'Rare',      color: '#4fc3f7', hp: 130, atk: 26, gold: 6,  time: 5 * 60,   hatchXp: 60,   sell: 250,   weight: 40 },
  epic:      { name: 'Epic',      color: '#b388ff', hp: 170, atk: 34, gold: 12, time: 30 * 60,  hatchXp: 200,  sell: 1000,  weight: 12 },
  legendary: { name: 'Legendary', color: '#ffb74d', hp: 220, atk: 44, gold: 25, time: 2 * 3600, hatchXp: 600,  sell: 4000,  weight: 5 },
  mythic:    { name: 'Mythic',    color: '#ff5277', hp: 280, atk: 56, gold: 50, time: 6 * 3600, hatchXp: 1500, sell: 12000, weight: 2 },
};
export const RARITY_ORDER = ['common', 'rare', 'epic', 'legendary', 'mythic'];

export const MAX_DRAGON_LEVEL = 40;
export const BREED_MIN_LEVEL = 4;

// Each element has three attacks: tier 0 (always ready), tier 1 and tier 2 (cooldowns).
export const ATTACKS = {
  fire:    ['Ember Spit', 'Flame Burst', 'Inferno'],
  water:   ['Splash', 'Tidal Whip', 'Tsunami'],
  plant:   ['Vine Lash', 'Thorn Storm', 'Overgrowth'],
  earth:   ['Rock Throw', 'Landslide', 'Earthquake'],
  storm:   ['Zap', 'Thunderclap', 'Lightning Storm'],
  ice:     ['Frost Breath', 'Ice Shards', 'Blizzard'],
  metal:   ['Steel Claw', 'Iron Tail', 'Meteor Hammer'],
  shadow:  ['Shadow Bite', 'Night Veil', 'Void Rift'],
  light:   ['Flash', 'Radiant Beam', 'Supernova'],
  war:     ['Slash', 'War Cry Strike', 'Berserk'],
  mystic:  ['Arcane Bolt', 'Starfall', 'Wish Nova'],
  ancient: ['Primal Roar', 'Age Breaker', 'Genesis'],
};
export const TIER_POWER = [1.0, 1.6, 2.4];
export const TIER_COOLDOWN = [0, 2, 4];

// ---------------------------------------------------------------- dragons

const PURE = [
  ['emberjaw', 'Emberjaw', 'fire', 100],
  ['boulderhorn', 'Boulderhorn', 'earth', 100],
  ['mossback', 'Mossback', 'plant', 500],
  ['tidefin', 'Tidefin', 'water', 1000],
  ['sparkwing', 'Sparkwing', 'storm', 2000],
  ['rimeclaw', 'Rimeclaw', 'ice', 3000],
  ['ironscale', 'Ironscale', 'metal', 5000],
  ['duskfang', 'Duskfang', 'shadow', 8000],
  ['glimmer', 'Glimmer', 'light', 8000],
  ['warbrand', 'Warbrand', 'war', 12000],
];

const HYBRIDS = [
  ['steamcoil', 'Steamcoil', 'fire', 'water'],
  ['ashbloom', 'Ashbloom', 'fire', 'plant'],
  ['magmaw', 'Magmaw', 'fire', 'earth'],
  ['blazebolt', 'Blazebolt', 'fire', 'storm'],
  ['frostflare', 'Frostflare', 'fire', 'ice'],
  ['forgeheart', 'Forgeheart', 'fire', 'metal'],
  ['smoldermoon', 'Smoldermoon', 'fire', 'shadow'],
  ['solarion', 'Solarion', 'fire', 'light'],
  ['pyrolance', 'Pyrolance', 'fire', 'war'],
  ['lilyfin', 'Lilyfin', 'water', 'plant'],
  ['mudslinger', 'Mudslinger', 'water', 'earth'],
  ['thunderwave', 'Thunderwave', 'water', 'storm'],
  ['glacierfin', 'Glacierfin', 'water', 'ice'],
  ['anchorjaw', 'Anchorjaw', 'water', 'metal'],
  ['abyssal', 'Abyssal', 'water', 'shadow'],
  ['pearlwing', 'Pearlwing', 'water', 'light'],
  ['riptide', 'Riptide', 'water', 'war'],
  ['rootgrove', 'Rootgrove', 'plant', 'earth'],
  ['thornvolt', 'Thornvolt', 'plant', 'storm'],
  ['winterpine', 'Winterpine', 'plant', 'ice'],
  ['ironvine', 'Ironvine', 'plant', 'metal'],
  ['nightshade', 'Nightshade', 'plant', 'shadow'],
  ['sunpetal', 'Sunpetal', 'plant', 'light'],
  ['thornguard', 'Thornguard', 'plant', 'war'],
  ['quakebolt', 'Quakebolt', 'earth', 'storm'],
  ['permafrost', 'Permafrost', 'earth', 'ice'],
  ['orecrusher', 'Orecrusher', 'earth', 'metal'],
  ['cavernmaw', 'Cavernmaw', 'earth', 'shadow'],
  ['crystalback', 'Crystalback', 'earth', 'light'],
  ['golemfist', 'Golemfist', 'earth', 'war'],
  ['blizzardwing', 'Blizzardwing', 'storm', 'ice'],
  ['voltplate', 'Voltplate', 'storm', 'metal'],
  ['stormshade', 'Stormshade', 'storm', 'shadow'],
  ['aurora', 'Aurora', 'storm', 'light'],
  ['thunderknight', 'Thunderknight', 'storm', 'war'],
  ['chromefrost', 'Chromefrost', 'ice', 'metal'],
  ['wraithfrost', 'Wraithfrost', 'ice', 'shadow'],
  ['snowglow', 'Snowglow', 'ice', 'light'],
  ['frostblade', 'Frostblade', 'ice', 'war'],
  ['gloomgear', 'Gloomgear', 'metal', 'shadow'],
  ['mirrorscale', 'Mirrorscale', 'metal', 'light'],
  ['ironclad', 'Ironclad', 'metal', 'war'],
  ['eclipsar', 'Eclipsar', 'shadow', 'light'],
  ['dreadfang', 'Dreadfang', 'shadow', 'war'],
  ['paladrake', 'Paladrake', 'light', 'war'],
];

const EPICS = [
  ['volcanyx', 'Volcanyx', ['fire', 'earth', 'war']],
  ['tempestra', 'Tempestra', ['storm', 'water', 'ice']],
  ['verdantis', 'Verdantis', ['plant', 'light', 'earth']],
  ['obsidrake', 'Obsidrake', ['shadow', 'fire', 'metal']],
  ['cryonix', 'Cryonix', ['ice', 'metal', 'light']],
  ['thornwraith', 'Thornwraith', ['plant', 'shadow', 'war']],
  ['maelstrom', 'Maelstrom', ['water', 'storm', 'shadow']],
  ['sunforge', 'Sunforge', ['light', 'fire', 'metal']],
  ['gaiadon', 'Gaiadon', ['earth', 'plant', 'water']],
  ['stormbreaker', 'Stormbreaker', ['war', 'storm', 'metal']],
  ['moonfrost', 'Moonfrost', ['ice', 'shadow', 'light']],
  ['coralord', 'Coralord', ['water', 'plant', 'light']],
  ['embergale', 'Embergale', ['fire', 'storm', 'plant']],
  ['ironroot', 'Ironroot', ['metal', 'earth', 'plant']],
  ['bloodmoon', 'Bloodmoon', ['war', 'shadow', 'fire']],
];

const LEGENDARIES = [
  ['celestia', 'Celestia', ['mystic', 'light'], ['sunforge', 'moonfrost']],
  ['nyxara', 'Nyxara', ['mystic', 'shadow'], ['obsidrake', 'maelstrom']],
  ['aetherion', 'Aetherion', ['mystic', 'storm'], ['tempestra', 'stormbreaker']],
  ['floradin', 'Floradin', ['mystic', 'plant'], ['verdantis', 'gaiadon']],
  ['infernyx', 'Infernyx', ['mystic', 'fire'], ['volcanyx', 'embergale']],
  ['rimeking', 'Rimeking', ['mystic', 'ice'], ['cryonix', 'coralord']],
  ['ironwyrm', 'Ironwyrm', ['mystic', 'metal'], ['ironroot', 'sunforge']],
  ['valkyrax', 'Valkyrax', ['mystic', 'war'], ['thornwraith', 'bloodmoon']],
];

const MYTHICS = [
  ['primordius', 'Primordius', ['ancient', 'fire'], ['infernyx', 'rimeking']],
  ['chronodrake', 'Chronodrake', ['ancient', 'light'], ['celestia', 'nyxara']],
  ['terravore', 'Terravore', ['ancient', 'earth'], ['floradin', 'ironwyrm']],
  ['zephyros', 'Zephyros', ['ancient', 'storm'], ['aetherion', 'valkyrax']],
];

export const DRAGONS = {};
export const DRAGON_LIST = [];

function add(d) {
  DRAGONS[d.id] = d;
  DRAGON_LIST.push(d);
}
for (const [id, name, el, price] of PURE) {
  add({ id, name, elements: [el], rarity: 'common', price, unlock: ELEMENT_UNLOCK[el] });
}
for (const [id, name, a, b] of HYBRIDS) add({ id, name, elements: [a, b], rarity: 'rare' });
for (const [id, name, els] of EPICS) add({ id, name, elements: els, rarity: 'epic' });
for (const [id, name, els, recipe] of LEGENDARIES) add({ id, name, elements: els, rarity: 'legendary', recipe });
for (const [id, name, els, recipe] of MYTHICS) add({ id, name, elements: els, rarity: 'mythic', recipe });

export function howToGet(d) {
  const els = (list) => list.map((e) => ELEMENTS[e].name).join(' + ');
  switch (d.rarity) {
    case 'common':
      return `Buy its egg in the Shop (player level ${d.unlock}), or breed any dragon with ${ELEMENTS[d.elements[0]].name}.`;
    case 'rare':
      return `Breed two dragons that together have ${els(d.elements)}.`;
    case 'epic':
      return `Breed two dragons that together have ${els(d.elements)} (at least three elements between them).`;
    default:
      return `Breed ${DRAGONS[d.recipe[0]].name} + ${DRAGONS[d.recipe[1]].name}.`;
  }
}

// ---------------------------------------------------------------- buildings

export const HABITAT_COST = {
  fire: 100, earth: 100, plant: 300, water: 500, storm: 800, ice: 1200, metal: 1600,
  shadow: 2500, light: 2500, war: 4000, mystic: 25000, ancient: 100000,
};
export const HABITAT_LEVELS = [
  { capacity: 2, goldCap: 1500 },
  { capacity: 3, goldCap: 6000 },
  { capacity: 4, goldCap: 25000 },
];
export const HABITAT_UPGRADE_MULT = [0, 4, 16];
export const HABITAT_CAP_MULT = { mystic: 3, ancient: 5 };

export const FARM_COSTS = [0, 100, 600, 2500, 8000, 20000];
export const FARM_UNLOCK = [1, 1, 4, 8, 12, 16];

export const CROPS = [
  { id: 'berries', name: 'Ember Berries', icon: '🍓', time: 30, cost: 10, food: 20, unlock: 1 },
  { id: 'wheat', name: 'Sky Wheat', icon: '🌾', time: 5 * 60, cost: 100, food: 130, unlock: 3 },
  { id: 'melon', name: 'Moon Melons', icon: '🍈', time: 30 * 60, cost: 500, food: 750, unlock: 6 },
  { id: 'starfruit', name: 'Starfruit', icon: '⭐', time: 2 * 3600, cost: 2000, food: 3200, unlock: 10 },
  { id: 'dragonfruit', name: 'Dragonfruit', icon: '🐉', time: 8 * 3600, cost: 6000, food: 11000, unlock: 15 },
];

export const HATCHERY_LEVELS = [
  { slots: 2, cost: 0 },
  { slots: 3, cost: 1500, unlock: 3 },
  { slots: 4, cost: 8000, unlock: 7 },
  { slots: 6, cost: 40000, unlock: 14 },
];
export const SANCTUARY_LEVELS = [
  { slots: 1, cost: 0 },
  { slots: 2, cost: 20000, unlock: 10 },
  { slots: 3, cost: 120000, unlock: 20 },
];

export const TOTEM = { cost: 5000, unlock: 5, boost: 4 };

export const DECORATIONS = [
  { id: 'torch', name: 'Dragon Torch', icon: '🔦', cost: 800, bonus: 2, unlock: 2 },
  { id: 'fountain', name: 'Wish Fountain', icon: '⛲', cost: 4000, bonus: 5, unlock: 5 },
  { id: 'statue', name: 'Dragon Statue', icon: '🗿', cost: 15000, bonus: 8, unlock: 9 },
  { id: 'goldtree', name: 'Golden Tree', icon: '🌳', cost: 60000, bonus: 12, unlock: 14 },
  { id: 'crystal', name: 'Sky Crystal', icon: '💎', cost: 200000, bonus: 18, unlock: 20 },
];
export const MAX_DECO_BONUS = 60;

export const START_PLOTS = 9;
export const PLOT_EXPANSIONS = [1000, 3000, 8000, 20000, 50000, 100000, 200000, 400000];
export const PLOTS_PER_EXPANSION = 3;

// ---------------------------------------------------------------- progression

export const MAX_PLAYER_LEVEL = 50;
export const xpForLevel = (lvl) => Math.round(40 * Math.pow(lvl, 1.7));
export const foodForLevel = (lvl) => Math.round(8 * Math.pow(lvl, 1.6));

export const LOGIN_REWARDS = [
  { gold: 500 }, { food: 300 }, { gems: 3 }, { gold: 2000 }, { food: 1000 }, { gems: 5 }, { gems: 10 },
];

export const DAILY_QUESTS = [
  { id: 'collect', text: 'Collect gold from habitats', goal: 5 },
  { id: 'feed', text: 'Feed your dragons', goal: 10 },
  { id: 'breed', text: 'Start breeding', goal: 2 },
  { id: 'hatch', text: 'Hatch eggs', goal: 2 },
  { id: 'harvest', text: 'Harvest crops', goal: 3 },
  { id: 'win', text: 'Win battles', goal: 3 },
];
export const DAILY_QUEST_GEMS = 5;
export const DAILY_ALL_BONUS = 10;

export const ACHIEVEMENTS = [
  { id: 'collector', name: 'Collector', text: 'Own different dragon species', stat: 'species', tiers: [5, 15, 30, 50, 82], gems: [5, 10, 20, 40, 100] },
  { id: 'breeder', name: 'Breeder', text: 'Breed dragons', stat: 'bred', tiers: [5, 25, 100, 300], gems: [5, 10, 25, 50] },
  { id: 'trainer', name: 'Trainer', text: 'Get a dragon to level', stat: 'maxLevel', tiers: [10, 20, 30, 40], gems: [5, 10, 25, 50] },
  { id: 'fighter', name: 'Fighter', text: 'Win battles', stat: 'won', tiers: [10, 50, 200, 500], gems: [5, 15, 30, 60] },
  { id: 'tycoon', name: 'Tycoon', text: 'Collect gold', stat: 'goldCollected', tiers: [10000, 100000, 1000000, 10000000], gems: [5, 15, 30, 60] },
];

export const LEAGUES = [
  { name: 'Bronze', min: 0, gems: 0, icon: '🥉' },
  { name: 'Silver', min: 200, gems: 10, icon: '🥈' },
  { name: 'Gold', min: 500, gems: 20, icon: '🥇' },
  { name: 'Platinum', min: 900, gems: 30, icon: '🏆' },
  { name: 'Diamond', min: 1400, gems: 50, icon: '💠' },
  { name: 'Dragonlord', min: 2000, gems: 100, icon: '👑' },
];

export const CAMPAIGN_CHAPTERS = [
  { name: 'Ember Coast', icon: '🌋' },
  { name: 'Whispering Woods', icon: '🌲' },
  { name: 'Frozen Peaks', icon: '🏔️' },
  { name: 'Shadow Rift', icon: '🌌' },
];
export const STAGES_PER_CHAPTER = 10;

export const SPEEDS = [
  { id: 1, name: 'Normal' },
  { id: 5, name: 'Fast (5×)' },
  { id: 30, name: 'Turbo (30×)' },
  { id: 0, name: 'Instant' },
];

export const GEM_EXCHANGE = [
  { id: 'gold', gems: 5, label: 'gold', amount: (lvl) => 500 * lvl },
  { id: 'food', gems: 5, label: 'food', amount: (lvl) => 250 * lvl },
];
