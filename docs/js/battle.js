// Turn-based battle rules and enemy team generation (no DOM).
import * as D from './data.js';
import { statsFor, attacksFor, dragonName } from './game.js';

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function multiplier(attEl, defSp) {
  if (attEl === 'neutral') return 1;
  const def = defSp.elements[0];
  if (D.ELEMENTS[attEl].strong.includes(def)) return 2;
  if (D.ELEMENTS[def].strong.includes(attEl)) return 0.5;
  return 1;
}

export function fighter(sp, lvl, name) {
  const st = statsFor(sp, lvl);
  return {
    sp,
    lvl,
    name: name || sp.name,
    maxHp: st.hp,
    hp: st.hp,
    atk: st.atk,
    attacks: attacksFor(sp, lvl).filter((a) => a.unlocked).map((a) => ({ ...a, cd: 0 })),
  };
}
export const fighterFromDragon = (d) => fighter(D.DRAGONS[d.sp], d.lvl, dragonName(d));

export function createBattle(playerTeam, enemyTeam, mode, info) {
  return { mode, info, p: playerTeam, e: enemyTeam, pi: 0, ei: 0, over: false, won: false };
}

export const active = (b, side) => (side === 'p' ? b.p[b.pi] : b.e[b.ei]);

// Performs one attack. Returns an event describing what happened.
export function attack(b, side, idx) {
  const me = active(b, side);
  const foeSide = side === 'p' ? 'e' : 'p';
  const foe = active(b, foeSide);
  const a = me.attacks[idx];
  if (!a || a.cd > 0 || b.over) return null;
  for (const other of me.attacks) if (other.cd > 0) other.cd--;
  a.cd = a.cooldown;
  const mult = multiplier(a.el, foe.sp);
  const crit = Math.random() < 0.08;
  const dmg = Math.max(1, Math.round(me.atk * a.power * mult * (0.9 + Math.random() * 0.2) * (crit ? 1.5 : 1)));
  foe.hp = Math.max(0, foe.hp - dmg);
  const evt = { side, attack: a, dmg, mult, crit, fainted: foe.hp === 0, foeName: foe.name };
  if (evt.fainted) {
    if (foeSide === 'e') {
      if (b.ei + 1 < b.e.length) b.ei++;
      else finish(b, true);
    } else {
      if (b.pi + 1 < b.p.length) b.pi++;
      else finish(b, false);
    }
  }
  return evt;
}

function finish(b, won) {
  b.over = true;
  b.won = won;
}

export function faintedCount(b) {
  return b.p.filter((f) => f.hp === 0).length;
}

// Enemy picks the best expected damage, with a little randomness.
export function enemyChoice(b) {
  const me = active(b, 'e');
  const foe = active(b, 'p');
  let best = 0;
  let bestScore = -1;
  me.attacks.forEach((a, i) => {
    if (a.cd > 0) return;
    const score = a.power * multiplier(a.el, foe.sp) * (0.75 + Math.random() * 0.5);
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  });
  return best;
}

// ---------------------------------------------------------------- enemy teams

const THEMES = [
  ['fire', 'earth', 'war'],
  ['plant', 'water', 'storm'],
  ['ice', 'metal', 'light'],
  ['shadow', 'mystic', 'ancient'],
];

function pick(rand, rarity, theme) {
  const all = D.DRAGON_LIST.filter((d) => d.rarity === rarity);
  const themed = theme ? all.filter((d) => theme.includes(d.elements[0]) || theme.includes(d.elements[1])) : [];
  const list = themed.length && rand() < 0.7 ? themed : all;
  return list[Math.floor(rand() * list.length)];
}

function team(rand, size, lvl, rarities, theme) {
  const out = [];
  for (let i = 0; i < size; i++) {
    const rarity = rarities[Math.floor(rand() * rarities.length)];
    const sp = pick(rand, rarity, theme);
    out.push(fighter(sp, Math.min(D.MAX_DRAGON_LEVEL, Math.max(1, lvl + Math.floor(rand() * 3) - 1))));
  }
  return out;
}

export const CAMPAIGN_STAGES = D.CAMPAIGN_CHAPTERS.length * D.STAGES_PER_CHAPTER;

export function campaignStage(stage) {
  const rand = rng(stage * 7919 + 13);
  const chapter = Math.floor(stage / D.STAGES_PER_CHAPTER);
  const boss = stage % D.STAGES_PER_CHAPTER === D.STAGES_PER_CHAPTER - 1;
  const lvl = Math.round(1 + stage * 0.8) + (boss ? 2 : 0);
  const size = stage < 4 ? 1 : stage < 14 ? 2 : 3;
  let rarities =
    stage < 8 ? ['common'] : stage < 16 ? ['common', 'rare'] : stage < 26 ? ['rare', 'epic'] : stage < 36 ? ['epic', 'epic', 'legendary'] : ['legendary', 'mythic'];
  const enemies = team(rand, size, lvl, rarities, THEMES[chapter]);
  if (boss) {
    const top = D.RARITY_ORDER[Math.min(4, D.RARITY_ORDER.indexOf(rarities[rarities.length - 1]) + 1)];
    enemies[enemies.length - 1] = fighter(pick(rand, top, THEMES[chapter]), lvl + 1);
  }
  return { stage, chapter, boss, enemies, lvl };
}

export function towerFloor(f) {
  const rand = rng(f * 104729 + 7);
  const lvl = Math.min(D.MAX_DRAGON_LEVEL, 1 + Math.round(f * 1.1));
  const rarities =
    f < 10 ? ['common', 'rare'] : f < 20 ? ['rare', 'epic'] : f < 30 ? ['epic'] : f < 40 ? ['epic', 'legendary'] : ['legendary', 'mythic'];
  return { floor: f, enemies: team(rand, f < 3 ? 2 : 3, lvl, rarities), lvl };
}

const RIVALS = ['Kael', 'Mira', 'Juno', 'Rook', 'Sana', 'Dax', 'Lyra', 'Orin', 'Tessa', 'Bram', 'Nia', 'Vex', 'Zara', 'Ivo', 'Hana', 'Pip'];
const LEAGUE_RARITIES = [
  ['common', 'rare'], ['rare'], ['rare', 'epic'], ['epic'], ['epic', 'legendary'], ['legendary', 'mythic'],
];

export function arenaOpponents(baseLevel, league) {
  const rand = rng(Math.floor(Math.random() * 1e9));
  return [
    { diff: 'Easy', delta: -3, trophies: 15 },
    { diff: 'Normal', delta: 0, trophies: 25 },
    { diff: 'Hard', delta: 3, trophies: 40 },
  ].map((o) => ({
    ...o,
    name: 'Rider ' + RIVALS[Math.floor(rand() * RIVALS.length)],
    enemies: team(rand, 3, Math.max(1, baseLevel + o.delta), LEAGUE_RARITIES[league]),
  }));
}
