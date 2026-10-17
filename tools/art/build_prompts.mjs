// Builds tools/art/prompts.json: one image prompt per dragon (and stage), written from the
// dragon's design in docs/js/designs.js so the painted art matches the game's designs.
// Usage: node tools/art/build_prompts.mjs
import fs from 'node:fs';
import path from 'node:path';
import { DRAGON_LIST, ELEMENTS } from '../../docs/js/data.js';
import { designFor } from '../../docs/js/designs.js';

const here = path.dirname(new URL(import.meta.url).pathname);

// Shared style, so all 82 dragons look like one set.
export const STYLE = 'single original fantasy dragon creature, full body visible, three-quarter side view facing right, ' +
  'hand-painted digital illustration, polished mobile game character art, soft painterly shading, clean thin dark lineart, ' +
  'rich saturated colors, detailed scales and belly plates, glossy eyes, centered, isolated on a plain flat white background';
export const NEGATIVE = 'text, letters, watermark, signature, logo, frame, border, multiple creatures, duplicate, cropped, cut off, ' +
  'background scenery, landscape, floor, shadow on background, human, rider, blurry, lowres, deformed, extra heads, extra legs';

const BODY = {
  rest: 'dragon lying down resting, chest raised, forelegs stretched forward, tail curled around the front',
  classic: 'sturdy dragon sitting proudly on its haunches',
  beast: 'powerful four-legged dragon standing, muscular legs, raised chest, long S-curved neck',
  wyvern: 'two-legged wyvern standing upright, strong hind legs, small clawed arms',
  serpent: 'long serpentine eastern dragon with a coiled snake-like body and small clawed legs, floating',
  golem: 'hulking hunched titan dragon with massive armored shoulders and huge fists',
  sea: 'aquatic sea dragon with fins instead of legs and a fish-like tail fin, swimming pose',
  bird: 'phoenix-like feathered dragon standing on long bird legs, sweeping tail plume',
  sprite: 'small slender fairy dragon hovering, delicate body, long thin tail',
  knight: 'upright armored knight dragon wearing a metal chest plate and helmet',
  wraith: 'ghostly spectral dragon whose lower body fades into smoke, long reaching claws, floating',
  hydra: 'two-headed dragon with two long necks',
  crystal: 'crystalline dragon with an angular faceted gemstone body',
};
// Babies keep the body type's idea but stay small and soft.
const BABY_BODY = {
  rest: 'lying down', serpent: 'small coiled serpent-like body', sea: 'little finned sea dragon body', bird: 'fluffy feathered chick-like body',
  sprite: 'tiny hovering fairy body', wraith: 'small ghostly body fading into wisps', golem: 'stocky little rocky body', hydra: 'two small heads',
  crystal: 'small crystalline body', knight: 'tiny armored body', wyvern: 'standing on two stubby legs',
};
const HEAD = {
  round: 'rounded head', long: 'long elegant snout', beak: 'hooked bird-like beak', blunt: 'heavy blunt jaw',
  serpent: 'long whiskered eastern-dragon face', fish: 'finned fish-like face', helm: 'head in a knight helmet',
  skull: 'skull-like bony face with glowing eyes', crystal: 'angular crystal head',
};
const HORNS = {
  spike: 'two straight spiked horns', curve: 'two curved swept-back horns', ram: 'curling ram horns',
  antler: 'branching antlers', crescent: 'crescent-moon horns', antenna: 'two thin antennae',
  crystal: 'crystal horns', branch: 'small branch-like horns with leaves', rhino: 'a big rhino horn on its snout',
};
const CREST = {
  flame: 'a mane of flames', leaves: 'a crest of leaves', icicles: 'a crest of icicles', fins: 'spiky fin crest with webbing',
  feathers: 'a crest of long feathers', smoke: 'wisps of smoke around its head', rocks: 'rocky plates on its head',
  bolts: 'a crest of lightning bolts', gears: 'a gear-shaped crest', mane: 'a shaggy mane', frill: 'a wide neck frill',
  petals: 'a ring of flower petals around its head', cloud: 'a small storm cloud crest', halo: 'a glowing golden halo',
};
const BACK = {
  volcano: 'a small smoking volcano on its back', spikes: 'a row of spikes along its back', plates: 'armor plates along its spine',
  leaves: 'leaves growing along its back', flames: 'flames along its spine', crystals: 'crystal shards along its spine',
  rocks: 'rocks along its back', gears: 'gears along its spine', thorns: 'thorny vines along its back', mane: 'a furry mane down its back',
  bolts: 'lightning-shaped spines', feathers: 'feathers along its back', fins: 'webbed fin spines along its back',
};
const WINGS = {
  bat: 'large leathery dragon wings with a glowing membrane', feather: 'large feathered wings', angel: 'large white feathered angel wings',
  leaf: 'wings made of giant leaves', fin: 'fin-like wings', crystal: 'wings of crystal shards', butterfly: 'translucent dragonfly-like wings with eye spots',
  mech: 'mechanical riveted metal wings', tattered: 'tattered torn bat wings', flame: 'wings made of fire', cloud: 'storm-cloud wings crackling with lightning',
};
const TAIL = {
  flame: 'tail tipped with a flame', leaf: 'leaf-tipped tail', fin: 'finned tail', club: 'spiked club tail', blade: 'blade-tipped tail',
  crystal: 'crystal-tipped tail', wisp: 'tail fading into smoke', spade: 'spade-tipped tail', bolt: 'lightning-bolt tail tip',
  star: 'star-tipped tail', gem: 'gem-tipped tail', plume: 'long feathered tail plume', bulb: 'glowing anglerfish lure on its tail',
  anchor: 'anchor-shaped tail tip', gear: 'gear-tipped tail',
};
const PATTERN = {
  spots: 'spotted markings', stripes: 'bold tiger-stripe markings', lava: 'glowing lava cracks across its body', runes: 'glowing rune markings',
  stars: 'starry speckled markings like a night sky', scales: 'fine detailed scales', circuit: 'glowing circuit-line markings', gems: 'gems embedded in its hide',
  moss: 'patches of moss', frost: 'frosty snowflake markings', rings: 'ring markings', cracks: 'cracked stone-like texture', swirls: 'glowing swirling tribal markings',
};
const ELEMENT_LOOK = {
  fire: 'fiery red and orange', water: 'ocean blue', plant: 'leaf green', earth: 'earthy brown and sandstone', storm: 'electric yellow',
  ice: 'icy pale blue and white', metal: 'steel grey and silver', shadow: 'deep violet and black', light: 'radiant gold and white',
  war: 'crimson and dark iron', mystic: 'magenta and pink with sparkles', ancient: 'ancient gold and bronze',
};
const RARITY = {
  common: '', rare: '',
  epic: 'ornate and impressive, faint magical aura',
  legendary: 'majestic legendary creature, gem on its forehead, golden horns, radiant glowing aura',
  mythic: 'mythic god-like dragon, crown of golden horn spikes, glowing rune circle behind it, divine aura',
};

// Nearest named colour for a design's custom hex colours.
const NAMED = [['#1d2a5c', 'midnight navy'], ['#3fd0e0', 'bright cyan'], ['#ff7a1a', 'orange'], ['#ff5a36', 'red-orange'], ['#c0392b', 'crimson'],
  ['#2f8cff', 'blue'], ['#3cbf4a', 'green'], ['#b07d4f', 'brown'], ['#f5c518', 'yellow'], ['#7fd6ff', 'pale blue'], ['#9aa4b1', 'grey'],
  ['#7b4bb8', 'purple'], ['#ffd84d', 'gold'], ['#ff7ce5', 'pink'], ['#ffffff', 'white'], ['#1a1a1a', 'black'], ['#5a3a33', 'dark brown'],
  ['#fff1c4', 'cream'], ['#ff9f8a', 'coral'], ['#4fb8c2', 'teal'], ['#3b4a7a', 'slate blue'], ['#6b7cff', 'periwinkle'], ['#d9a441', 'bronze'],
  ['#e8203a', 'red'], ['#5fe8f0', 'glowing cyan'], ['#7fe6f0', 'light cyan'], ['#2a1838', 'very dark purple'], ['#ff9a2a', 'bright orange']];
function colorName(hex) {
  const n = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [r, g, b] = n(hex);
  let best = NAMED[0][1], bd = Infinity;
  for (const [h, name] of NAMED) {
    const [r2, g2, b2] = n(h);
    const d = (r - r2) ** 2 + (g - g2) ** 2 + (b - b2) ** 2;
    if (d < bd) [bd, best] = [d, name];
  }
  return best;
}

export function describe(sp, stage = 'adult') {
  const d = designFor(sp);
  const els = sp.elements;
  const parts = [];
  if (stage === 'baby') parts.push('cute baby hatchling dragon, chubby body, big head, big round eyes, small horn nubs');
  parts.push(stage === 'baby' ? BABY_BODY[d.body] || 'sitting on four stubby legs' : BODY[d.body] || BODY.beast);
  parts.push(`${d.main ? colorName(d.main) : ELEMENT_LOOK[els[0]]} body${els[1] ? ` with ${ELEMENT_LOOK[els[1]]} accents` : ''}${d.belly ? `, ${colorName(d.belly)} belly plates` : ', lighter belly plates'}`);
  if (els.length > 1) parts.push(`${els.map((e) => ELEMENTS[e].name.toLowerCase()).join(' and ')} elemental theme`);
  else parts.push(`${ELEMENTS[els[0]].name.toLowerCase()} elemental theme`);
  if (stage !== 'baby') {
    if (HEAD[d.head]) parts.push(HEAD[d.head]);
    if (HORNS[d.horns]) parts.push(HORNS[d.horns]);
    for (const c of d.crests || [d.crest]) if (CREST[c]) parts.push(CREST[c]);
    if (BACK[d.back]) parts.push(BACK[d.back]);
  }
  if (WINGS[d.wings]) parts.push((stage === 'baby' ? 'tiny ' + WINGS[d.wings].replace('large ', '') : WINGS[d.wings]) + (d.wing ? ` (${colorName(d.wing)})` : ''));
  else parts.push('no wings');
  if (TAIL[d.tail]) parts.push(TAIL[d.tail]);
  if (PATTERN[d.pattern]) parts.push(d.accent ? `${PATTERN[d.pattern]} in ${colorName(d.accent)}` : PATTERN[d.pattern]);
  if (d.iris) parts.push(`${colorName(d.iris)} eyes`);
  if (stage !== 'baby' && RARITY[sp.rarity]) parts.push(RARITY[sp.rarity]);
  return `${STYLE}, ${parts.join(', ')}`;
}

const out = [];
for (const sp of DRAGON_LIST) {
  for (const stage of ['adult', 'baby']) out.push({ id: sp.id, name: sp.name, rarity: sp.rarity, stage, prompt: describe(sp, stage), negative: NEGATIVE });
}
fs.writeFileSync(path.join(here, 'prompts.json'), JSON.stringify(out, null, 1) + '\n');
console.log(`wrote ${out.length} prompts to tools/art/prompts.json`);
