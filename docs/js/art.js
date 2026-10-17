// Procedural SVG art for dragons and eggs. Every species gets a stable look
// derived from its elements, rarity and a hash of its id.
import { ELEMENTS, RARITIES } from './data.js';

let uid = 0;

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const t = amt < 0 ? 0 : 255;
  const p = Math.abs(amt);
  r = Math.round((t - r) * p + r);
  g = Math.round((t - g) * p + g);
  b = Math.round((t - b) * p + b);
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

// Small element emblems, drawn centred on (x, y).
function accent(el, x, y, s = 1) {
  const t = `transform="translate(${x} ${y}) scale(${s})"`;
  switch (el) {
    case 'fire':
      return `<g ${t}><path d="M0 12 C-12 2 -6 -8 0 -18 C6 -8 12 2 0 12Z" fill="#ffb02e"/><path d="M0 10 C-6 4 -3 -3 0 -9 C3 -3 6 4 0 10Z" fill="#ff4d1f"/></g>`;
    case 'water':
      return `<g ${t}><path d="M-12 8 Q-4 -14 12 -16 Q4 -2 10 10 Q0 4 -12 8Z" fill="#5fb0ff" stroke="#1d5fbf" stroke-width="1.5"/></g>`;
    case 'plant':
      return `<g ${t}><path d="M-12 8 Q-10 -12 12 -14 Q10 6 -12 8Z" fill="#4fd65c" stroke="#257a2e" stroke-width="1.5"/><path d="M-10 6 L8 -10" stroke="#257a2e" stroke-width="1.5"/></g>`;
    case 'earth':
      return `<g ${t}><path d="M-11 6 L-8 -8 L2 -13 L11 -4 L9 8 Z" fill="#9b6b43" stroke="#5e3e24" stroke-width="1.5"/><path d="M-3 -6 L3 0" stroke="#5e3e24" stroke-width="1.5"/></g>`;
    case 'storm':
      return `<g ${t}><path d="M3 -16 L-9 2 L-1 2 L-5 16 L9 -3 L1 -3 Z" fill="#ffe14d" stroke="#b38f00" stroke-width="1.5" stroke-linejoin="round"/></g>`;
    case 'ice':
      return `<g ${t}><path d="M0 -16 L8 0 L0 14 L-8 0 Z" fill="#c8f1ff" stroke="#4aa8d8" stroke-width="1.5"/><path d="M0 -16 L0 14 M-8 0 L8 0" stroke="#ffffff" stroke-width="1"/></g>`;
    case 'metal':
      return `<g ${t}><path d="M0 -15 L4 -6 L14 -4 L6 3 L9 13 L0 7 L-9 13 L-6 3 L-14 -4 L-4 -6Z" fill="#c9d1db" stroke="#5c6670" stroke-width="1.5"/><circle r="4" fill="#5c6670"/></g>`;
    case 'shadow':
      return `<g ${t}><circle r="11" fill="#3a1f5c"/><path d="M-6 -2 Q0 -12 7 -3 Q2 -6 -1 0 Q4 4 0 8 Q-8 6 -6 -2Z" fill="#b38cff"/></g>`;
    case 'light':
      return `<g ${t}><path d="M0 -16 L4 -5 L15 -5 L6 2 L10 13 L0 6 L-10 13 L-6 2 L-15 -5 L-4 -5Z" fill="#fff07a" stroke="#d9a400" stroke-width="1.5" stroke-linejoin="round"/></g>`;
    case 'war':
      return `<g ${t}><path d="M-3 12 L-3 -10 L0 -17 L3 -10 L3 12 Z" fill="#e6e9ee" stroke="#5c6670" stroke-width="1.2"/><rect x="-9" y="4" width="18" height="4" rx="2" fill="#c0392b"/></g>`;
    case 'mystic':
      return `<g ${t}><path d="M0 -17 Q2 -2 17 0 Q2 2 0 17 Q-2 2 -17 0 Q-2 -2 0 -17Z" fill="#ffc2f3" stroke="#e040c0" stroke-width="1.5"/></g>`;
    case 'ancient':
      return `<g ${t}><path d="M0 -15 L11 -4 L7 12 L-7 12 L-11 -4Z" fill="#ffcf4d" stroke="#b36b00" stroke-width="1.5"/><path d="M0 -15 L0 12 M-11 -4 L11 -4" stroke="#fff3c4" stroke-width="1"/></g>`;
    default:
      return '';
  }
}

const WINGS = [
  'M95 102 L58 36 Q66 56 74 60 Q70 42 84 34 Q86 56 94 60 Q98 44 112 44 Z',
  'M95 104 Q46 74 52 26 Q82 42 114 72 Z',
  'M95 104 Q70 50 38 54 Q66 68 72 82 Q56 78 46 94 Q78 98 98 112 Z',
];

const HORNS = [
  (c) => `<path d="M122 50 Q112 26 118 18 Q124 34 132 46Z" fill="${c}"/><path d="M142 44 Q140 20 150 14 Q150 32 152 44Z" fill="${c}"/>`,
  (c) => `<path d="M124 48 Q100 40 104 22 Q114 38 134 44Z" fill="${c}"/><path d="M144 44 Q132 26 142 12 Q148 30 154 42Z" fill="${c}"/>`,
  (c) => `<path d="M126 46 L120 24 L134 42Z" fill="${c}"/><path d="M140 42 L140 16 L150 40Z" fill="${c}"/><path d="M152 46 L160 26 L160 48Z" fill="${c}"/>`,
  (c) => `<path d="M120 52 Q96 50 100 30 Q108 44 128 46Z" fill="${c}"/><path d="M150 46 Q170 34 166 16 Q160 34 144 42Z" fill="${c}"/>`,
];

export function dragonColors(species) {
  let els = species.elements;
  // Mystic/Ancient dragons wear their second element as body colour so they stay distinct.
  if (els[1] && (els[0] === 'mystic' || els[0] === 'ancient')) els = [els[1], els[0], ...els.slice(2)];
  const c1 = ELEMENTS[els[0]].color;
  const c2 = els[1] ? ELEMENTS[els[1]].color : shade(c1, -0.25);
  const c3 = els[2] ? ELEMENTS[els[2]].color : els[1] ? shade(c2, -0.2) : shade(c1, 0.35);
  return { c1, c2, c3 };
}

// stage: 'baby' | 'young' | 'adult'
export function dragonSVG(species, { stage = 'adult', cls = '' } = {}) {
  const id = ++uid;
  const h = hash(species.id);
  const { c1, c2, c3 } = dragonColors(species);
  const dark = shade(c1, -0.3);
  const belly = shade(c1, 0.55);
  const wing = WINGS[h % WINGS.length];
  const horn = HORNS[(h >>> 3) % HORNS.length];
  const pattern = (h >>> 6) % 3;
  const hornColor = (h >>> 9) % 2 ? '#f6ead0' : shade(c3, 0.2);
  const iris = (h >>> 11) % 2 ? shade(c2, -0.2) : '#3b2a1a';
  const rarity = species.rarity;
  const baby = stage === 'baby';
  const young = stage === 'young';
  const bodyScale = baby ? 0.72 : young ? 0.86 : 1;
  const wingScale = baby ? 0.45 : young ? 0.75 : 1;

  let aura = '';
  if (rarity === 'epic' || rarity === 'legendary' || rarity === 'mythic') {
    const ac = rarity === 'mythic' ? '#ffd54f' : rarity === 'legendary' ? '#ffb74d' : RARITIES.epic.color;
    aura = `<defs><radialGradient id="au${id}"><stop offset="0" stop-color="${ac}" stop-opacity=".55"/><stop offset="1" stop-color="${ac}" stop-opacity="0"/></radialGradient></defs>
      <circle cx="100" cy="112" r="92" fill="url(#au${id})"/>`;
  }

  let spots = '';
  if (pattern === 1) {
    spots = `<circle cx="80" cy="120" r="7" fill="${dark}" opacity=".45"/><circle cx="68" cy="138" r="5" fill="${dark}" opacity=".45"/><circle cx="90" cy="104" r="4" fill="${dark}" opacity=".45"/>`;
  } else if (pattern === 2) {
    spots = `<path d="M70 108 Q78 118 72 130 M82 100 Q92 112 86 126 M60 124 Q68 134 62 146" stroke="${dark}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".45"/>`;
  }

  const spikes = [[66, 106], [78, 97], [91, 92]]
    .map(([x, y]) => `<path d="M${x - 7} ${y + 6} L${x} ${y - 9} L${x + 7} ${y + 4}Z" fill="${c3}"/>`)
    .join('');

  let extras = '';
  if (rarity === 'legendary' || rarity === 'mythic') {
    extras += [[30, 40, 1], [176, 130, 0.8], [40, 170, 0.7], [172, 30, 0.6]]
      .map(([x, y, s]) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -10 Q1 -1 10 0 Q1 1 0 10 Q-1 1 -10 0 Q-1 -1 0 -10Z" fill="#fffbe0"/>`)
      .join('');
  }
  let crown = '';
  if (rarity === 'mythic' && !baby) {
    crown = `<path d="M124 40 L128 24 L136 34 L142 20 L148 34 L156 24 L156 42 Z" fill="#ffd54f" stroke="#b37a00" stroke-width="2" stroke-linejoin="round"/><circle cx="142" cy="34" r="3" fill="#ff5277"/>`;
  }

  const headAccent = species.elements[1] && !baby ? accent(species.elements[1], 112, 50, 0.8) : '';

  return `<svg class="dragon-art ${cls}" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  ${aura}
  <ellipse cx="100" cy="186" rx="${60 * bodyScale}" ry="8" fill="#000" opacity=".18"/>
  <g transform="translate(100 190) scale(${bodyScale}) translate(-100 -190)">
    <g transform="translate(95 104) scale(${wingScale}) translate(-95 -104)">
      <path d="${wing}" transform="translate(-14 6)" fill="${shade(c2, -0.25)}"/>
    </g>
    <path d="M64 128 C34 138 14 126 20 94 C26 114 42 124 68 152 Z" fill="${c1}"/>
    ${accent(species.elements[0], 20, 90, 0.9)}
    ${spikes}
    <ellipse cx="98" cy="134" rx="46" ry="40" fill="${c1}"/>
    ${spots}
    <ellipse cx="114" cy="142" rx="24" ry="28" fill="${belly}"/>
    <path d="M96 128 Q114 134 132 128 M94 142 Q114 148 134 142 M98 156 Q114 162 130 156" stroke="${shade(belly, -0.15)}" stroke-width="2" fill="none"/>
    <ellipse cx="74" cy="164" rx="15" ry="13" fill="${dark}"/>
    <ellipse cx="124" cy="168" rx="12" ry="11" fill="${dark}"/>
    <circle cx="66" cy="174" r="3" fill="#fff"/><circle cx="74" cy="176" r="3" fill="#fff"/><circle cx="82" cy="174" r="3" fill="#fff"/>
    <circle cx="118" cy="177" r="2.6" fill="#fff"/><circle cx="125" cy="178" r="2.6" fill="#fff"/><circle cx="132" cy="176" r="2.6" fill="#fff"/>
    <g transform="translate(95 104) scale(${wingScale}) translate(-95 -104)">
      <path d="${wing}" fill="${c2}" stroke="${shade(c2, -0.3)}" stroke-width="2" stroke-linejoin="round"/>
    </g>
    <g transform="translate(130 96) scale(${baby ? 1.25 : young ? 1.1 : 1}) translate(-130 -96)">
      <ellipse cx="122" cy="100" rx="22" ry="28" fill="${c1}"/>
      ${baby ? '' : horn(hornColor)}
      ${headAccent}
      <circle cx="138" cy="72" r="30" fill="${c1}"/>
      <ellipse cx="162" cy="84" rx="21" ry="15" fill="${c1}"/>
      <ellipse cx="166" cy="90" rx="14" ry="7" fill="${belly}" opacity=".7"/>
      <circle cx="172" cy="80" r="2.4" fill="${dark}"/><circle cx="164" cy="79" r="2.4" fill="${dark}"/>
      <path d="M150 94 Q160 100 174 94" stroke="${dark}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <ellipse cx="144" cy="66" rx="10" ry="11" fill="#fff"/>
      <circle cx="147" cy="67" r="6.5" fill="${iris}"/>
      <circle cx="148" cy="67" r="3.2" fill="#111"/>
      <circle cx="150" cy="63" r="2.2" fill="#fff"/>
      <ellipse cx="134" cy="84" rx="6" ry="3.5" fill="#ff7aa8" opacity=".45"/>
      ${crown}
    </g>
  </g>
  ${extras}
</svg>`;
}

export function eggSVG(species, cls = '') {
  const { c1, c2 } = dragonColors(species);
  const ring = RARITIES[species.rarity].color;
  return `<svg class="egg-art ${cls}" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="50" cy="112" rx="30" ry="5" fill="#000" opacity=".18"/>
  <ellipse cx="50" cy="64" rx="36" ry="46" fill="${c1}" stroke="${shade(c1, -0.3)}" stroke-width="2"/>
  <circle cx="34" cy="50" r="7" fill="${c2}" opacity=".85"/>
  <circle cx="62" cy="38" r="5" fill="${c2}" opacity=".85"/>
  <circle cx="66" cy="78" r="8" fill="${c2}" opacity=".85"/>
  <circle cx="38" cy="86" r="5" fill="${c2}" opacity=".85"/>
  <path d="M16 66 Q50 76 84 66" stroke="${ring}" stroke-width="5" fill="none"/>
  <ellipse cx="36" cy="36" rx="7" ry="11" fill="#fff" opacity=".35" transform="rotate(-20 36 36)"/>
</svg>`;
}

export function stageFor(level) {
  return level < 4 ? 'baby' : level < 10 ? 'young' : 'adult';
}
