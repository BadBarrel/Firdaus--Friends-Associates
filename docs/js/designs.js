// One hand-picked design per dragon species: body plan, head, horns, crests, wings, tail and
// markings. art.js turns these into SVG. Colours come from the elements unless overridden.
//
// body:    classic | beast | wyvern | serpent | golem | sea | bird | sprite | knight | wraith | hydra | crystal
// head:    round | long | beak | blunt | serpent | fish | helm | skull | crystal
// eyes:    cute | fierce | glow | sleepy | happy          mouth: smile | fang | grin | roar | tusk
// horns:   nub | spike | curve | ram | antler | crescent | antenna | crystal | branch | rhino | none
// crest:   flame | leaves | icicles | fins | feathers | smoke | rocks | bolts | gears | mane | frill | petals | cloud | halo
// back:    volcano | spikes | plates | leaves | flames | crystals | rocks | gears | thorns | mane | bolts | feathers | fins
// wings:   bat | feather | angel | leaf | fin | crystal | butterfly | mech | tattered | flame | cloud | none
// tail:    flame | leaf | fin | club | blade | crystal | wisp | spade | bolt | star | gem | plume | bulb | anchor | gear | none
// curve:   1 | 2 | 3 (serpent pose)      plume / helmWings: extras for helm heads
// pattern: spots | stripes | lava | runes | stars | scales | circuit | gems | moss | frost | rings | cracks

export const DESIGNS = {
  // ---------------------------------------------------------------- common
  emberjaw:    { body: 'beast', head: 'round', eyes: 'cute', mouth: 'fang', horns: 'curve', crest: 'flame', back: 'spikes', wings: 'bat', tail: 'flame', accent: '#ffcf33', wing: '#ff9a2a' },
  boulderhorn: { body: 'beast', head: 'blunt', eyes: 'sleepy', mouth: 'tusk', horns: 'rhino', back: 'rocks', wings: 'none', tail: 'club', pattern: 'cracks' },
  mossback:    { body: 'beast', head: 'round', eyes: 'happy', mouth: 'smile', horns: 'branch', back: 'leaves', wings: 'none', tail: 'leaf', pattern: 'moss', tone: -0.1 },
  tidefin:     { body: 'sea', head: 'fish', eyes: 'cute', mouth: 'smile', horns: 'none', crest: 'fins', back: 'fins', wings: 'none', pattern: 'scales', wing: '#7fd6ff' },
  sparkwing:   { body: 'wyvern', head: 'long', eyes: 'fierce', mouth: 'grin', horns: 'spike', crest: 'bolts', back: 'bolts', wings: 'bat', tail: 'bolt', pattern: 'stripes', wing: '#3a3f52' },
  rimeclaw:    { body: 'crystal', head: 'crystal', eyes: 'fierce', mouth: 'fang', horns: 'crystal', crest: 'icicles', back: 'crystals', wings: 'crystal', tail: 'crystal', pattern: 'frost' },
  ironscale:   { body: 'knight', head: 'helm', eyes: 'fierce', mouth: 'smile', horns: 'spike', back: 'plates', wings: 'mech', tail: 'blade', accent: '#e5484d' },
  duskfang:    { body: 'wraith', head: 'skull', eyes: 'glow', horns: 'crescent', crest: 'smoke', wings: 'tattered', tail: 'wisp', pattern: 'stars' },
  glimmer:     { body: 'bird', head: 'beak', eyes: 'cute', horns: 'none', crest: 'halo', back: 'feathers', wings: 'angel', pattern: 'stars', accent: '#fff3b0' },
  warbrand:    { body: 'beast', head: 'long', eyes: 'fierce', mouth: 'roar', horns: 'ram', crest: 'mane', back: 'spikes', wings: 'none', tail: 'spade', pattern: 'stripes', accent: '#5a2a1f' },

  // ---------------------------------------------------------------- rare hybrids
  steamcoil:    { body: 'serpent', head: 'serpent', eyes: 'sleepy', mouth: 'smile', horns: 'curve', crest: 'smoke', back: 'fins', wings: 'none', tail: 'flame', pattern: 'rings' },
  ashbloom:     { body: 'sprite', head: 'round', eyes: 'happy', mouth: 'smile', horns: 'antenna', crest: 'petals', wings: 'butterfly', tail: 'leaf', accent: '#ffcf33' },
  magmaw:       { body: 'golem', head: 'blunt', eyes: 'glow', mouth: 'tusk', horns: 'ram', crest: 'flame', back: 'rocks', wings: 'none', tail: 'club', pattern: 'lava', main: '#5a3a33' },
  blazebolt:    { body: 'wyvern', head: 'long', eyes: 'fierce', mouth: 'roar', horns: 'spike', crest: 'bolts', back: 'flames', wings: 'flame', tail: 'bolt', pattern: 'stripes' },
  frostflare:   { body: 'crystal', head: 'crystal', eyes: 'cute', mouth: 'fang', horns: 'crystal', crest: 'flame', back: 'crystals', wings: 'crystal', tail: 'flame', pattern: 'frost' },
  forgeheart:   { body: 'knight', head: 'blunt', eyes: 'glow', mouth: 'grin', horns: 'spike', crest: 'flame', back: 'flames', wings: 'mech', tail: 'blade', pattern: 'lava' },
  smoldermoon:  { body: 'wyvern', head: 'skull', eyes: 'glow', horns: 'crescent', crest: 'flame', wings: 'tattered', tail: 'flame', pattern: 'lava', glow: '#ffcf33' },
  solarion:     { body: 'bird', head: 'beak', eyes: 'fierce', horns: 'none', crest: 'flame', back: 'flames', wings: 'flame', pattern: 'runes', accent: '#ffe066' },
  pyrolance:    { body: 'wyvern', head: 'long', eyes: 'fierce', mouth: 'grin', horns: 'spike', crest: 'flame', back: 'plates', wings: 'bat', tail: 'blade', pattern: 'stripes' },
  lilyfin:      { body: 'sea', head: 'fish', eyes: 'happy', mouth: 'smile', horns: 'none', crest: 'petals', back: 'leaves', wings: 'none', pattern: 'spots', accent: '#ff9ed2', main: '#4fb8c2' },
  mudslinger:   { body: 'beast', head: 'blunt', eyes: 'sleepy', mouth: 'smile', horns: 'nub', back: 'rocks', wings: 'none', tail: 'club', pattern: 'cracks', main: '#7a6248', belly: '#9fd0ff', crest: 'leaves' },
  thunderwave:  { body: 'serpent', head: 'serpent', eyes: 'fierce', mouth: 'grin', horns: 'spike', crest: 'bolts', back: 'fins', wings: 'cloud', tail: 'bolt', pattern: 'stripes', curve: 2 },
  glacierfin:   { body: 'sea', head: 'fish', eyes: 'cute', mouth: 'smile', horns: 'crystal', crest: 'icicles', back: 'crystals', wings: 'none', pattern: 'frost', main: '#8fdcff' },
  anchorjaw:    { body: 'golem', head: 'helm', eyes: 'cute', mouth: 'grin', horns: 'none', back: 'fins', wings: 'fin', tail: 'anchor', pattern: 'scales', accent: '#e5484d' },
  abyssal:      { body: 'sea', head: 'fish', eyes: 'glow', mouth: 'grin', horns: 'antenna', crest: 'fins', back: 'spikes', wings: 'none', pattern: 'stars', main: '#1f3f7a', glow: '#7dfff0' },
  pearlwing:    { body: 'sprite', head: 'round', eyes: 'cute', mouth: 'smile', horns: 'antenna', crest: 'fins', wings: 'butterfly', tail: 'gem', pattern: 'scales', accent: '#fff3d6' },
  riptide:      { body: 'wyvern', head: 'long', eyes: 'fierce', mouth: 'fang', horns: 'spike', crest: 'fins', back: 'fins', wings: 'fin', tail: 'blade', pattern: 'stripes' },
  rootgrove:    { body: 'beast', head: 'blunt', eyes: 'sleepy', mouth: 'smile', horns: 'antler', back: 'leaves', wings: 'none', tail: 'leaf', pattern: 'moss', main: '#5f8a3c', horn: '#8a5a32' },
  thornvolt:    { body: 'wyvern', head: 'long', eyes: 'fierce', mouth: 'grin', horns: 'spike', crest: 'bolts', back: 'thorns', wings: 'leaf', tail: 'spade', pattern: 'stripes' },
  winterpine:   { body: 'beast', head: 'round', eyes: 'cute', mouth: 'smile', horns: 'antler', crest: 'icicles', back: 'leaves', wings: 'none', tail: 'crystal', pattern: 'frost', main: '#2f7a4a' },
  ironvine:     { body: 'knight', head: 'helm', eyes: 'cute', mouth: 'smile', horns: 'branch', back: 'leaves', wings: 'leaf', tail: 'leaf', pattern: 'moss' },
  nightshade:   { body: 'sprite', head: 'long', eyes: 'glow', horns: 'branch', crest: 'leaves', wings: 'leaf', tail: 'leaf', pattern: 'spots', glow: '#b6ff6a' },
  sunpetal:     { body: 'sprite', head: 'round', eyes: 'happy', mouth: 'smile', horns: 'antenna', crest: 'petals', wings: 'leaf', tail: 'star', accent: '#ffd84d' },
  thornguard:   { body: 'golem', head: 'blunt', eyes: 'fierce', mouth: 'tusk', horns: 'spike', crest: 'leaves', back: 'thorns', wings: 'none', tail: 'club', pattern: 'moss' },
  quakebolt:    { body: 'wyvern', head: 'blunt', eyes: 'fierce', mouth: 'grin', horns: 'rhino', crest: 'bolts', back: 'rocks', wings: 'none', tail: 'bolt', pattern: 'cracks', main: '#8a7a5a' },
  permafrost:   { body: 'golem', head: 'blunt', eyes: 'sleepy', mouth: 'tusk', horns: 'crystal', crest: 'icicles', back: 'crystals', wings: 'none', tail: 'crystal', pattern: 'frost', main: '#8fb2c4' },
  orecrusher:   { body: 'beast', head: 'blunt', eyes: 'fierce', mouth: 'tusk', horns: 'spike', crest: 'rocks', back: 'crystals', wings: 'none', tail: 'club', pattern: 'gems', accent: '#7fd6ff', main: '#6d6f7a' },
  cavernmaw:    { body: 'beast', head: 'skull', eyes: 'glow', horns: 'curve', crest: 'rocks', back: 'crystals', wings: 'tattered', tail: 'spade', pattern: 'cracks', main: '#6a5a4a' },
  crystalback:  { body: 'crystal', head: 'crystal', eyes: 'cute', mouth: 'smile', horns: 'crystal', back: 'crystals', wings: 'none', tail: 'gem', pattern: 'gems', accent: '#ffe58a' },
  golemfist:    { body: 'golem', head: 'helm', eyes: 'fierce', mouth: 'grin', horns: 'spike', back: 'rocks', wings: 'none', tail: 'club', pattern: 'stripes', accent: '#c0392b' },
  blizzardwing: { body: 'bird', head: 'beak', eyes: 'fierce', horns: 'none', crest: 'icicles', back: 'crystals', wings: 'cloud', pattern: 'frost', accent: '#c8f1ff', main: '#e3edf8', accent: '#ffd84d' },
  voltplate:    { body: 'knight', head: 'helm', eyes: 'glow', mouth: 'grin', horns: 'antenna', crest: 'bolts', back: 'plates', wings: 'mech', tail: 'bolt', pattern: 'circuit', glow: '#fff35a' },
  stormshade:   { body: 'serpent', head: 'skull', eyes: 'glow', horns: 'crescent', crest: 'bolts', wings: 'cloud', tail: 'bolt', pattern: 'stars', glow: '#fff35a', main: '#3d3a5c', curve: 3 },
  aurora:       { body: 'serpent', head: 'serpent', eyes: 'cute', mouth: 'smile', horns: 'antler', crest: 'halo', back: 'feathers', wings: 'angel', tail: 'star', pattern: 'stars', accent: '#9effd9', curve: 3 },
  thunderknight:{ body: 'knight', head: 'helm', eyes: 'fierce', mouth: 'fang', horns: 'spike', crest: 'bolts', back: 'bolts', wings: 'bat', tail: 'spade', pattern: 'stripes', main: '#3b4a7a' },
  chromefrost:  { body: 'crystal', head: 'crystal', eyes: 'fierce', mouth: 'fang', horns: 'spike', crest: 'gears', back: 'crystals', wings: 'mech', tail: 'blade', pattern: 'circuit' },
  wraithfrost:  { body: 'wraith', head: 'crystal', eyes: 'glow', horns: 'crystal', crest: 'icicles', wings: 'tattered', tail: 'crystal', pattern: 'frost', glow: '#b8f1ff' },
  snowglow:     { body: 'sprite', head: 'round', eyes: 'cute', mouth: 'smile', horns: 'crystal', crest: 'icicles', wings: 'crystal', tail: 'star', pattern: 'frost' },
  frostblade:   { body: 'wyvern', head: 'long', eyes: 'fierce', mouth: 'grin', horns: 'spike', crest: 'icicles', back: 'crystals', wings: 'bat', tail: 'blade', pattern: 'frost' },
  gloomgear:    { body: 'golem', head: 'blunt', eyes: 'glow', mouth: 'grin', horns: 'spike', crest: 'gears', back: 'gears', wings: 'tattered', tail: 'gear', pattern: 'circuit' },
  mirrorscale:  { body: 'bird', head: 'beak', eyes: 'cute', horns: 'none', crest: 'halo', back: 'plates', wings: 'mech', pattern: 'scales', accent: '#ffe066' },
  ironclad:     { body: 'golem', head: 'helm', eyes: 'fierce', mouth: 'grin', horns: 'ram', back: 'plates', wings: 'none', tail: 'club', pattern: 'stripes', accent: '#c0392b', plume: true, main: '#7a8494' },
  eclipsar:     { body: 'hydra', head: 'long', eyes: 'glow', mouth: 'fang', horns: 'crescent', crests: ['smoke', 'halo'], back: 'spikes', wings: 'bat', tail: 'star', pattern: 'stars' },
  dreadfang:    { body: 'beast', head: 'skull', eyes: 'glow', horns: 'ram', crest: 'mane', back: 'spikes', wings: 'tattered', tail: 'spade', pattern: 'stripes', accent: '#2a1838' },
  paladrake:    { body: 'knight', head: 'helm', eyes: 'cute', mouth: 'smile', horns: 'none', crest: 'halo', back: 'feathers', wings: 'angel', tail: 'blade', pattern: 'runes', glow: '#fff3a0', main: '#fff1c4', plume: true },

  // ---------------------------------------------------------------- epic
  volcanyx:     { body: 'golem', head: 'blunt', eyes: 'glow', mouth: 'roar', horns: 'ram', crest: 'flame', back: 'volcano', wings: 'bat', tail: 'club', pattern: 'lava', main: '#3a2a2a', gem: true },
  tempestra:    { body: 'serpent', head: 'serpent', eyes: 'fierce', mouth: 'roar', horns: 'antler', crest: 'cloud', back: 'bolts', wings: 'cloud', tail: 'fin', pattern: 'rings' },
  verdantis:    { body: 'beast', head: 'long', eyes: 'cute', mouth: 'smile', horns: 'antler', crest: 'halo', back: 'leaves', wings: 'leaf', tail: 'leaf', pattern: 'runes', glow: '#fff3a0', gem: true },
  obsidrake:    { body: 'wyvern', head: 'long', eyes: 'glow', mouth: 'roar', horns: 'curve', crest: 'flame', back: 'spikes', wings: 'tattered', tail: 'blade', pattern: 'lava', main: '#3a2a4a' },
  cryonix:      { body: 'serpent', head: 'serpent', eyes: 'glow', mouth: 'fang', horns: 'crystal', crest: 'icicles', back: 'crystals', wings: 'crystal', tail: 'crystal', pattern: 'circuit', glow: '#b8f1ff', gem: true, curve: 3 },
  thornwraith:  { body: 'wraith', head: 'long', eyes: 'glow', horns: 'branch', crest: 'leaves', back: 'thorns', wings: 'leaf', tail: 'spade', pattern: 'moss', glow: '#b6ff6a' },
  maelstrom:    { body: 'hydra', head: 'serpent', eyes: 'fierce', mouth: 'roar', horns: 'curve', crests: ['bolts', 'fins'], back: 'fins', wings: 'fin', tail: 'fin', pattern: 'rings' },
  sunforge:     { body: 'knight', head: 'helm', eyes: 'glow', mouth: 'grin', horns: 'spike', crest: 'flame', back: 'flames', wings: 'flame', tail: 'blade', pattern: 'runes', glow: '#ffe066', gem: true, main: '#ffb84d' },
  gaiadon:      { body: 'beast', head: 'blunt', eyes: 'sleepy', mouth: 'tusk', horns: 'branch', crest: 'leaves', back: 'leaves', wings: 'none', tail: 'club', pattern: 'moss', main: '#4f8a7a' },
  stormbreaker: { body: 'wyvern', head: 'long', eyes: 'fierce', mouth: 'roar', horns: 'ram', crest: 'bolts', back: 'plates', wings: 'mech', tail: 'blade', pattern: 'circuit', glow: '#fff35a' },
  moonfrost:    { body: 'bird', head: 'beak', eyes: 'glow', horns: 'crescent', crest: 'icicles', back: 'crystals', wings: 'crystal', pattern: 'stars', glow: '#d6c2ff' },
  coralord:     { body: 'sea', head: 'fish', eyes: 'cute', mouth: 'smile', horns: 'branch', crest: 'halo', back: 'leaves', wings: 'none', pattern: 'gems', horn: '#ff8a7a', accent: '#ff8ab0', gem: true, main: '#ff9f8a' },
  embergale:    { body: 'serpent', head: 'serpent', eyes: 'fierce', horns: 'spike', crest: 'bolts', back: 'flames', wings: 'cloud', pattern: 'stripes', accent: '#7be06b', tail: 'flame', curve: 2, main: '#ff9a3a' },
  ironroot:     { body: 'beast', head: 'helm', eyes: 'sleepy', mouth: 'smile', horns: 'antler', crest: 'leaves', back: 'gears', wings: 'leaf', tail: 'gear', pattern: 'moss' },
  bloodmoon:    { body: 'beast', head: 'skull', eyes: 'glow', horns: 'crescent', crests: ['flame', 'mane'], back: 'spikes', wings: 'tattered', tail: 'spade', pattern: 'lava', glow: '#ff5a5a', accent: '#2a1838', main: '#5a1a2a', crest: 'flame' },

  // ---------------------------------------------------------------- legendary
  celestia:     { body: 'serpent', head: 'serpent', eyes: 'cute', mouth: 'smile', horns: 'antler', crest: 'halo', back: 'feathers', wings: 'angel', wings2: 'angel', tail: 'star', pattern: 'stars', horn: '#ffe066', main: '#fff4d6', curve: 2 },
  nyxara:       { body: 'wraith', head: 'long', eyes: 'glow', mouth: 'fang', horns: 'crescent', crest: 'smoke', wings: 'butterfly', wings2: 'tattered', tail: 'star', pattern: 'stars', accent: '#ff7ce5', gem: true },
  aetherion:    { body: 'wyvern', head: 'long', eyes: 'glow', mouth: 'roar', horns: 'antler', crest: 'bolts', back: 'bolts', wings: 'cloud', wings2: 'bat', tail: 'bolt', pattern: 'runes', glow: '#fff35a', main: '#6b7cff' },
  floradin:     { body: 'sprite', head: 'round', eyes: 'cute', mouth: 'smile', horns: 'antler', crest: 'petals', wings: 'butterfly', wings2: 'leaf', tail: 'leaf', pattern: 'runes', accent: '#ff9ed2', horn: '#8a5a32' },
  infernyx:     { body: 'sprite', head: 'long', eyes: 'glow', horns: 'crescent', crest: 'flame', back: 'none', wings: 'flame', wings2: 'butterfly', pattern: 'lava', accent: '#ffcf33', glow: '#fff3a0', mouth: 'roar', main: '#ff8a2a' },
  rimeking:     { body: 'golem', head: 'crystal', eyes: 'glow', mouth: 'roar', horns: 'crystal', crest: 'icicles', back: 'crystals', wings: 'crystal', wings2: 'crystal', tail: 'crystal', pattern: 'runes', gem: true },
  ironwyrm:     { body: 'serpent', head: 'helm', eyes: 'glow', mouth: 'grin', horns: 'spike', crest: 'gears', back: 'plates', wings: 'mech', tail: 'blade', pattern: 'circuit', accent: '#ff7ce5', curve: 1 },
  valkyrax:     { body: 'knight', head: 'helm', eyes: 'fierce', mouth: 'roar', horns: 'curve', crest: 'feathers', back: 'feathers', wings: 'angel', wings2: 'angel', tail: 'blade', pattern: 'runes', accent: '#ff7ce5', helmWings: true },

  // ---------------------------------------------------------------- mythic
  primordius:   { body: 'hydra', head: 'long', eyes: 'glow', mouth: 'roar', horns: 'ram', crests: ['icicles', 'flame'], back: 'flames', wings: 'flame', tail: 'flame', pattern: 'lava', gem: true },
  chronodrake:  { body: 'serpent', head: 'serpent', eyes: 'glow', mouth: 'smile', horns: 'antler', crest: 'gears', back: 'gears', wings: 'angel', wings2: 'mech', tail: 'gear', pattern: 'runes', glow: '#fff3a0', gem: true, main: '#d9a441', curve: 3 },
  terravore:    { body: 'beast', head: 'long', eyes: 'glow', mouth: 'roar', horns: 'ram', crest: 'rocks', back: 'crystals', wings: 'bat', tail: 'club', pattern: 'runes', main: '#7a5a3a', glow: '#ffcf33', gem: true },
  zephyros:     { body: 'bird', head: 'beak', eyes: 'glow', horns: 'antler', crest: 'bolts', back: 'bolts', wings: 'cloud', wings2: 'angel', pattern: 'runes', glow: '#fff35a', gem: true },
};

const FALLBACK = { body: 'classic', head: 'round', eyes: 'cute', mouth: 'smile', horns: 'curve', back: 'spikes', wings: 'bat', tail: 'spade' };

export function designFor(species) {
  return DESIGNS[species.id] || FALLBACK;
}
