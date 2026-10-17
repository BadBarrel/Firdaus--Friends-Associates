// SVG art for the island world: floating islands, habitats, farms and special buildings.
// Building art uses a local frame centred on its plot: the plot is an isometric diamond
// from (-85,0) to (85,0) wide and (0,-42) to (0,42) tall. Everything is drawn in
// viewBox "-90 -140 180 190".
import { shade } from './art.js';

export const TILE_W = 85; // half-width of a plot diamond
export const TILE_H = 42; // half-height
export const BOX = { x: -90, y: -140, w: 180, h: 190 };

const D = `M0 ${-TILE_H} L${TILE_W} 0 L0 ${TILE_H} L${-TILE_W} 0Z`;
const dia = (k = 1, dy = 0) => `M0 ${-TILE_H * k + dy} L${TILE_W * k} ${dy} L0 ${TILE_H * k + dy} L${-TILE_W * k} ${dy}Z`;
// iso point: u along the right-down edge, v along the left-down edge, both -1..1
const iso = (u, v) => [((u - v) * TILE_W) / 2, ((u + v) * TILE_H) / 2];
const o = (c) => shade(c, -0.55);
const ol = (c, w = 2) => `stroke="${o(c)}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

function slab(top, side, k = 0.96, h = 9) {
  return `<path d="M${-TILE_W * k} 0 L0 ${TILE_H * k} L${TILE_W * k} 0 L${TILE_W * k} ${h} L0 ${TILE_H * k + h} L${-TILE_W * k} ${h}Z" fill="${side}"/>
    <path d="${dia(k)}" fill="${top}" ${ol(top, 2)}/>`;
}

// ---------------------------------------------------------------- props

// Tree with a gnarled trunk and a clustered, shaded canopy.
const tree = (x, y, s = 1, leaf = '#3cbf4a') => {
  const lf = shade(leaf, -0.15);
  const blobs = [[-12, -26, 10, -0.22], [12, -27, 11, -0.18], [0, -24, 12, -0.12], [-14, -38, 10, -0.05], [12, -40, 11, 0], [-2, -46, 12, 0.06], [0, -36, 13, 0.02]];
  return `<g transform="translate(${x} ${y}) scale(${s})">
  <path d="M-5 0 Q-3 -10 -4 -22 L-9 -28 M-4 -22 L4 -22 L8 -30 M4 -22 Q3 -10 5 0Z" fill="#6b4a2a" stroke="#4a3018" stroke-width="2" stroke-linejoin="round"/>
  <path d="M-6 0 Q-10 2 -12 4 M5 0 Q9 2 12 4" stroke="#4a3018" stroke-width="2" fill="none"/>
  ${blobs.map(([bx, by, r, k]) => `<circle cx="${bx}" cy="${by}" r="${r}" fill="${shade(lf, k)}" ${ol(lf, 1.8)}/>`).join('')}
  <path d="M-8 -48 Q-2 -54 6 -50" stroke="${shade(lf, 0.35)}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
};
const pine = (x, y, s = 1, col = '#2f7a4a', snow = false) => `<g transform="translate(${x} ${y}) scale(${s})">
  <rect x="-3" y="-8" width="6" height="9" fill="#7a4a2a"/>
  <path d="M0 -46 L14 -22 L8 -22 L18 -6 L-18 -6 L-8 -22 L-14 -22Z" fill="${col}" ${ol(col, 2)}/>
  ${snow ? '<path d="M0 -46 L7 -34 L-7 -34Z M-10 -22 L10 -22 L6 -18 L-6 -18Z" fill="#fff"/>' : ''}</g>`;
const boulder = (x, y, s = 1, col = '#9b8b7a') => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-12 2 L-10 -10 L0 -16 L12 -9 L13 2Z" fill="${col}" ${ol(col, 2)}/><path d="M-6 -10 L0 -4 L8 -8" stroke="${shade(col, 0.3)}" stroke-width="2" fill="none"/></g>`;
const crystalProp = (x, y, s = 1, col = '#aee7ff') => `<g transform="translate(${x} ${y}) scale(${s})">
  <path d="M-8 0 L-10 -18 L-5 -30 L0 -18 L-1 0Z" fill="${col}" ${ol(col, 1.6)}/><path d="M0 0 L2 -26 L8 -40 L12 -24 L10 0Z" fill="${shade(col, 0.2)}" ${ol(col, 1.6)}/>
  <path d="M8 -36 L8 -6" stroke="#fff" stroke-opacity=".7" stroke-width="1.5"/></g>`;
const flameProp = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><g class="flicker"><path d="M0 4 C-10 -2 -9 -12 -3 -18 C-3 -12 0 -10 1 -13 C2 -18 0 -22 3 -28 C10 -18 12 -8 8 -1 C6 3 3 4 0 4Z" fill="#ffb02e" ${ol('#ff7a1a', 1.5)}/><path d="M0 2 C-5 -2 -4 -7 -1 -10 C0 -7 2 -7 2 -10 C6 -6 5 0 0 2Z" fill="#fff0a0"/></g></g>`;
const flower = (x, y, col = '#ff7aa8') => `<g transform="translate(${x} ${y})"><path d="M0 0 L0 -7" stroke="#2e8b3a" stroke-width="1.5"/><circle cx="-2.5" cy="-8" r="2.4" fill="${col}"/><circle cx="2.5" cy="-8" r="2.4" fill="${col}"/><circle cx="0" cy="-10.5" r="2.4" fill="${col}"/><circle cx="0" cy="-6" r="2.4" fill="${col}"/><circle cx="0" cy="-8" r="1.6" fill="#ffe066"/></g>`;
const mushroom = (x, y, s = 1, cap = '#e5484d', glow = false) => `<g transform="translate(${x} ${y}) scale(${s})">${glow ? `<circle cy="-8" r="12" fill="${cap}" opacity=".25"/>` : ''}<path d="M-3 0 L-3 -6 L3 -6 L3 0Z" fill="#f4e6c4" ${ol('#c9b48a', 1.2)}/><path d="M-9 -5 Q-9 -16 0 -16 Q9 -16 9 -5Z" fill="${cap}" ${ol(cap, 1.5)}/><circle cx="-3" cy="-11" r="1.8" fill="#fff"/><circle cx="3" cy="-9" r="1.4" fill="#fff"/></g>`;
const bolt = (x, y, s = 1) => `<path transform="translate(${x} ${y}) scale(${s})" d="M2 -24 L-8 -6 L-1 -6 L-5 6 L8 -10 L1 -10 L5 -24Z" fill="#ffe14d" ${ol('#c9a400', 1.5)}/>`;
const cloud = (x, y, s = 1, col = '#ffffff') => `<path transform="translate(${x} ${y}) scale(${s})" d="M-22 6 Q-28 -6 -14 -9 Q-12 -22 2 -19 Q12 -28 20 -14 Q32 -12 28 6Z" fill="${col}" ${ol('#c8d6e5', 2)}/>`;
const gear = (x, y, s = 1, col = '#b8c2cc') => {
  let t = '';
  for (let i = 0; i < 8; i++) t += `<rect x="-3" y="-15" width="6" height="7" rx="1.5" transform="rotate(${i * 45})" fill="${col}" ${ol(col, 1.2)}/>`;
  return `<g transform="translate(${x} ${y}) scale(${s})"><g class="spin">${t}<circle r="10" fill="${col}" ${ol(col, 1.6)}/><circle r="4" fill="${shade(col, -0.4)}"/></g></g>`;
};
const pillar = (x, y, s = 1, col = '#f6f0e0') => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-7" y="-46" width="14" height="46" fill="${col}" ${ol(col, 1.8)}/><rect x="-10" y="-50" width="20" height="6" rx="1" fill="${col}" ${ol(col, 1.8)}/><rect x="-10" y="-3" width="20" height="5" rx="1" fill="${col}" ${ol(col, 1.8)}/><path d="M-2 -42 L-2 -6 M3 -42 L3 -6" stroke="${shade(col, -0.15)}" stroke-width="1.5"/></g>`;
const banner = (x, y, col = '#c0392b', icon = '') => `<g transform="translate(${x} ${y})"><path d="M0 0 L0 -50" stroke="#6b4a2a" stroke-width="3"/><path d="M0 -50 L22 -46 L18 -38 L22 -30 L0 -32Z" fill="${col}" ${ol(col, 1.5)} class="wave"/><text x="9" y="-36" font-size="9" text-anchor="middle">${icon}</text></g>`;
const sword = (x, y, r = 0) => `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M-2 0 L-2 -26 L0 -32 L2 -26 L2 0Z" fill="#e6e9ee" ${ol('#8a95a0', 1.2)}/><rect x="-6" y="-2" width="12" height="3" rx="1" fill="#c0392b"/><rect x="-1.5" y="1" width="3" height="7" fill="#6b4a2a"/></g>`;
const star = (x, y, s = 1, col = '#fff07a') => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -10 Q1 -1 10 0 Q1 1 0 10 Q-1 1 -10 0 Q-1 -1 0 -10Z" fill="${col}" class="twinkle"/>`;

// Low wall along the two front edges of the plot: stone blocks, or timber rails for farms.
function wall(col, k = 0.92) {
  const n = 7, blocks = [];
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    blocks.push([-TILE_W * k + TILE_W * k * t, TILE_H * k * t, 0.47]);
    blocks.push([TILE_W * k * t, TILE_H * k - TILE_H * k * t, -0.47]);
  }
  const w = (TILE_W * k) / n;
  return blocks.map(([x, y, sl], i) => {
    const c = shade(col, (i * 37) % 3 === 0 ? -0.08 : (i % 2 ? 0.05 : 0));
    const dy = sl * w;
    return `<path d="M${x - w / 2} ${y - dy / 2 - 9} L${x + w / 2} ${y + dy / 2 - 9} L${x + w / 2} ${y + dy / 2} L${x - w / 2} ${y - dy / 2}Z" fill="${c}" ${ol(col, 1.4)}/><path d="M${x - w / 2} ${y - dy / 2 - 9} L${x + w / 2} ${y + dy / 2 - 9}" stroke="${shade(col, 0.35)}" stroke-width="1.6"/>`;
  }).join('');
}
function fence(col, k = 0.92) {
  const pts = [];
  const steps = 6;
  for (let i = 0; i <= steps; i++) pts.push([-TILE_W * k + (TILE_W * k * i) / steps, (TILE_H * k * i) / steps]);
  for (let i = 1; i <= steps; i++) pts.push([(TILE_W * k * i) / steps, TILE_H * k - (TILE_H * k * i) / steps]);
  // Timber: squat posts every other point and two heavy rails.
  const posts = pts.filter((_, i) => i % 2 === 0).map(([x, y]) => `<rect x="${x - 3}" y="${y - 14}" width="6" height="15" rx="1" fill="${shade(col, -0.1)}" ${ol(col, 1.3)}/>`).join('');
  const line = (dy) => `M${pts.map(([x, y]) => `${x} ${y - dy}`).join(' L')}`;
  const rail = [5, 11].map((dy) => `<path d="${line(dy)}" fill="none" stroke="${o(col)}" stroke-width="5.5" stroke-linecap="round"/><path d="${line(dy)}" fill="none" stroke="${col}" stroke-width="3.2" stroke-linecap="round"/>`).join('');
  return rail + posts;
}

// ---------------------------------------------------------------- habitats

const HAB = {
  fire: {
    ground: '#5a3a33', side: '#3a2420',
    deco: () => `<path d="M-30 6 Q-14 -2 4 6 Q18 14 -4 18 Q-26 20 -30 6Z" fill="#ff7a1a" ${ol('#c0392b', 1.6)}/><path d="M-22 8 Q-8 4 2 9" stroke="#ffe066" stroke-width="2" fill="none"/>
      <path d="M8 -4 L18 -2 M-50 2 L-40 6 M30 10 L44 8" stroke="#ff7a1a" stroke-width="2.5" stroke-linecap="round"/>`,
    back: () => `<g transform="translate(-34 -14)"><path d="M-30 4 L-12 -34 L-2 -34 L16 4Z" fill="#6b4a40" ${ol('#5a3a33', 2)}/><path d="M-12 -34 Q-7 -30 -2 -34 L-4 -26 Q-7 -22 -10 -26Z" fill="#ff7a1a"/><path d="M-9 -30 Q-8 -20 -12 -12" stroke="#ff7a1a" stroke-width="3" fill="none"/>${flameProp(-7, -36, 0.8)}</g>${boulder(40, -12, 1, '#4a302b')}${flameProp(52, -16, 0.6)}`,
  },
  earth: {
    ground: '#b08a5c', side: '#7a5a3a',
    deco: () => `<path d="M-40 4 L-30 -2 M10 12 L22 8 L30 12 M-6 -14 L4 -18" stroke="#8a6a44" stroke-width="2" fill="none"/>`,
    back: () => `${boulder(-40, -12, 1.6, '#9b8b7a')}${boulder(-18, -24, 1.1, '#a89884')}${crystalProp(36, -14, 0.8, '#ffd27a')}${boulder(52, -2, 0.9)}`,
  },
  plant: {
    ground: '#6fcf55', side: '#4e9e36',
    deco: () => `${flower(-30, 10)}${flower(22, 16, '#ffd84d')}${flower(40, 2, '#b388ff')}${flower(-50, 0, '#ffd84d')}`,
    back: () => `${tree(-42, -8, 1.05)}${tree(-14, -26, 0.9, '#2fa34a')}${mushroom(44, -10, 1)}${tree(30, -22, 0.75, '#56c85a')}`,
  },
  water: {
    ground: '#f2dca4', side: '#c9ab6a',
    deco: () => `<ellipse cx="2" cy="2" rx="58" ry="27" fill="#2f8cff" ${ol('#2f8cff', 2)}/><ellipse cx="2" cy="0" rx="50" ry="22" fill="#5fb0ff"/><path d="M-26 -4 Q-18 -8 -10 -4 M10 8 Q18 4 26 8" stroke="#fff" stroke-width="2" fill="none" opacity=".7" class="ripple"/><ellipse cx="-30" cy="8" rx="7" ry="3.5" fill="#3cbf4a"/>`,
    back: () => `${boulder(-48, -10, 1.1, '#a8b0b8')}<path d="M44 -8 Q42 -30 46 -40 M50 -8 Q52 -28 56 -34 M38 -8 Q36 -24 32 -30" stroke="#3a9a4a" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  },
  storm: {
    ground: '#5c6b85', side: '#3d4a60',
    deco: () => `<path d="M-30 6 L-10 -2 L-2 8 L20 0" stroke="#ffe14d" stroke-width="2" fill="none" opacity=".7"/>`,
    back: () => `<g transform="translate(-40 -10)"><rect x="-4" y="-40" width="8" height="40" fill="#8a95a0" ${ol('#8a95a0', 1.5)}/><circle cy="-44" r="7" fill="#ffe14d" ${ol('#c9a400', 1.5)} class="pulse"/></g>
      <g transform="translate(40 -14)"><rect x="-4" y="-34" width="8" height="34" fill="#8a95a0" ${ol('#8a95a0', 1.5)}/><circle cy="-38" r="6" fill="#ffe14d" ${ol('#c9a400', 1.5)} class="pulse"/></g>
      <g class="zap">${bolt(0, -42, 1)}</g>${cloud(0, -66, 1, '#d6deea')}`,
  },
  ice: {
    ground: '#eaf7ff', side: '#a9cfe6',
    deco: () => `<path d="M-40 6 Q-20 0 0 8 Q20 16 40 6" stroke="#bfe6ff" stroke-width="3" fill="none"/>`,
    back: () => `<g transform="translate(-34 -12)"><path d="M-22 4 Q-22 -26 0 -26 Q22 -26 22 4Z" fill="#fff" ${ol('#a9cfe6', 2)}/><path d="M-6 4 Q-6 -8 0 -8 Q6 -8 6 4Z" fill="#7aa8c6"/><path d="M-20 -10 L20 -10 M-16 -20 L16 -20 M-10 -26 L-10 -10 M10 -26 L10 -10" stroke="#cfe6f5" stroke-width="1.5"/></g>${crystalProp(30, -16, 1)}${pine(52, -2, 0.7, '#2f7a4a', true)}`,
  },
  metal: {
    ground: '#9aa4b1', side: '#6b7480',
    deco: () => `<path d="${dia(0.55)}" fill="none" stroke="#7a8490" stroke-width="2"/><path d="M-46 0 L46 0 M0 -23 L0 23" stroke="#7a8490" stroke-width="1.5"/><circle cx="-30" cy="0" r="2" fill="#5c6670"/><circle cx="30" cy="0" r="2" fill="#5c6670"/>`,
    back: () => `${gear(-38, -26, 1.3)}${gear(-16, -34, 0.8, '#d6dde4')}<g transform="translate(36 -10)"><rect x="-6" y="-30" width="12" height="30" fill="#8a95a0" ${ol('#8a95a0', 1.5)}/><path d="M6 -24 L26 -24 L26 -6" fill="none" stroke="${o('#8a95a0')}" stroke-width="8"/><path d="M6 -24 L26 -24 L26 -6" fill="none" stroke="#b8c2cc" stroke-width="5"/><circle cx="0" cy="-34" r="4" fill="#9aa0aa" opacity=".6" class="puff"/></g>`,
  },
  shadow: {
    ground: '#4b2f6e', side: '#2f1c48',
    deco: () => `${mushroom(-30, 10, 0.8, '#c77dff', true)}${mushroom(30, 14, 0.7, '#7dfff0', true)}<path d="M-50 0 Q-30 -6 -10 2" stroke="#7b4bb8" stroke-width="2" fill="none"/>`,
    back: () => `<g transform="translate(-36 -10)"><path d="M-3 0 L-4 -26 Q-14 -34 -20 -44 M-4 -26 Q2 -38 10 -42 M-4 -18 Q-12 -20 -16 -26" fill="none" stroke="${o('#3a2a3a')}" stroke-width="7" stroke-linecap="round"/><path d="M-3 0 L-4 -26 Q-14 -34 -20 -44 M-4 -26 Q2 -38 10 -42 M-4 -18 Q-12 -20 -16 -26" fill="none" stroke="#3a2a3a" stroke-width="4" stroke-linecap="round"/></g>${mushroom(40, -14, 1.1, '#c77dff', true)}<circle cx="20" cy="-50" r="9" fill="#e9e1ff" opacity=".85"/><circle cx="24" cy="-53" r="8" fill="#4b2f6e"/>`,
  },
  light: {
    ground: '#fff6dc', side: '#e6cf93',
    deco: () => `<path d="${dia(0.6)}" fill="none" stroke="#ffd84d" stroke-width="2"/><circle r="6" fill="#ffe58a"/>`,
    back: () => `${pillar(-46, -4, 0.9)}${pillar(-14, -22, 0.9)}${pillar(18, -22, 0.9)}<g transform="translate(40 -40)"><g class="bob"><circle r="16" fill="#ffe58a" opacity=".35"/><circle r="10" fill="#fff07a" ${ol('#e6b800', 1.5)}/></g></g>`,
  },
  war: {
    ground: '#e3c088', side: '#b08a50',
    deco: () => `<ellipse cx="0" cy="2" rx="42" ry="20" fill="none" stroke="#c9a46a" stroke-width="2.5"/>`,
    back: () => `${banner(-50, -2, '#c0392b', '⚔')}${banner(48, -4, '#c0392b', '⚔')}<g transform="translate(-10 -26)"><rect x="-22" y="-2" width="44" height="5" fill="#6b4a2a"/>${sword(-14, 0, -8)}${sword(0, 0)}${sword(14, 0, 8)}</g>`,
  },
  mystic: {
    ground: '#ffc2f0', side: '#d48ac4',
    deco: () => `${star(-30, 6, 0.6)}${star(28, 14, 0.5, '#fff')}<path d="${dia(0.5)}" fill="none" stroke="#ff7ce5" stroke-width="2" stroke-dasharray="4 4"/>`,
    back: () => `${crystalProp(-40, -10, 1.2, '#ff9ee8')}${crystalProp(36, -16, 0.9, '#d9a6ff')}${star(-6, -50, 1)}${star(24, -62, 0.7, '#fff')}`,
  },
  ancient: {
    ground: '#e8c868', side: '#b08a30',
    deco: () => `<path d="${dia(0.6)}" fill="none" stroke="#b08a30" stroke-width="2"/><path d="M-26 -13 L26 13 M26 -13 L-26 13" stroke="#c9a040" stroke-width="1.5"/>`,
    back: () => `${pillar(-46, -4, 0.95, '#f0d070')}<g transform="translate(14 -24)"><path d="M-30 4 L-30 -40 Q0 -62 30 -40 L30 4 L20 4 L20 -34 Q0 -48 -20 -34 L-20 4Z" fill="#e8c868" ${ol('#e8c868', 2)}/><circle cy="-44" r="5" fill="#ff5277" ${ol('#a0203a', 1.2)}/></g>`,
  },
};

// Tall centrepieces shown on fully upgraded habitats (Lv 3), drawn at the back corner.
const CENTER = {
  fire: () => `<path d="M-38 6 L-12 -64 L12 -64 L38 6Z" fill="#6b4a40" ${ol('#5a3a33', 2.4)}/><path d="M-12 -64 Q0 -56 12 -64 L8 -52 Q0 -46 -8 -52Z" fill="#ff7a1a"/><path d="M-6 -56 Q-12 -30 -20 -6 M5 -54 Q10 -30 16 -4" stroke="#ff5a1a" stroke-width="4" fill="none" stroke-linecap="round"/>${flameProp(0, -66, 1.5)}<g class="puff"><circle cx="8" cy="-92" r="9" fill="#8a8a8a" opacity=".55"/><circle cx="-4" cy="-104" r="7" fill="#a0a0a0" opacity=".45"/></g>`,
  water: () => `${boulder(-14, -20, 2.2, '#a8b0b8')}${boulder(14, -30, 1.8, '#9aa2aa')}<path d="M2 -58 Q6 -30 4 -6" stroke="#8fd0ff" stroke-width="9" fill="none" class="ripple"/><path d="M2 -58 Q6 -30 4 -6" stroke="#fff" stroke-width="2.5" fill="none" opacity=".7"/>`,
  plant: () => tree(0, -18, 1.9, '#2fa34a') + flower(-20, -14, '#ff7aa8') + flower(18, -10, '#ffd84d'),
  earth: () => `${crystalProp(-10, -20, 2, '#ffd27a')}${boulder(18, -16, 1.6, '#9b8b7a')}`,
  storm: () => `<path d="M-10 0 L-4 -76 L4 -76 L10 0Z" fill="#8a95a0" ${ol('#8a95a0', 2)}/><path d="M-8 -20 L8 -20 M-6 -44 L6 -44" stroke="#5c6670" stroke-width="2"/><circle cx="0" cy="-84" r="11" fill="#ffe14d" ${ol('#c9a400', 2)} class="pulse"/><g class="zap">${bolt(-22, -70, 1.1)}${bolt(22, -64, 0.9)}</g>`,
  ice: () => `<path d="M-22 4 L-22 -52 L22 -52 L22 4Z" fill="#f2fbff" ${ol('#a9cfe6', 2.2)}/><path d="M-26 -52 L26 -52 L0 -86Z" fill="#bfe6ff" ${ol('#a9cfe6', 2.2)}/><path d="M-22 -52 l0 -8 l8 0 l0 8 M-6 -52 l0 -8 l8 0 l0 8 M10 -52 l0 -8 l8 0 l0 8" fill="#f2fbff" ${ol('#a9cfe6', 1.5)}/><path d="M-6 4 Q-6 -14 0 -14 Q6 -14 6 4Z" fill="#7aa8c6"/><rect x="-14" y="-40" width="7" height="10" rx="3" fill="#7aa8c6"/><rect x="7" y="-40" width="7" height="10" rx="3" fill="#7aa8c6"/>`,
  metal: () => `<rect x="-20" y="-60" width="40" height="62" fill="#8a95a0" ${ol('#8a95a0', 2)}/><rect x="8" y="-84" width="10" height="26" fill="#6b7480" ${ol('#6b7480', 1.5)}/>${gear(0, -36, 1.4, '#d6dde4')}<g class="puff"><circle cx="13" cy="-94" r="7" fill="#9aa0aa" opacity=".6"/><circle cx="20" cy="-106" r="5" fill="#b0b6be" opacity=".5"/></g>`,
  shadow: () => `<path d="M-14 4 L-8 -76 L0 -86 L8 -76 L14 4Z" fill="#2f1c48" ${ol('#2f1c48', 2)}/><path d="M-4 -60 L4 -60 L0 -52 L4 -44 L-4 -44" fill="none" stroke="#c77dff" stroke-width="2.5" class="pulse"/><circle cx="-26" cy="-80" r="12" fill="#e9e1ff" opacity=".9"/><circle cx="-21" cy="-84" r="11" fill="${'#4b2f6e'}"/>`,
  light: () => `${pillar(-26, 0, 1.25)}${pillar(26, 0, 1.25)}<path d="M-36 -62 Q0 -84 36 -62 L36 -56 L-36 -56Z" fill="#f6f0e0" ${ol('#f6f0e0', 2)}/><g transform="translate(0 -84)"><g class="bob"><circle r="22" fill="#ffe58a" opacity=".35"/><circle r="13" fill="#fff07a" ${ol('#e6b800', 2)}/></g></g>`,
  war: () => `<path d="M-18 4 L-14 -56 L14 -56 L18 4Z" fill="#a8743f" ${ol('#a8743f', 2)}/><path d="M-22 -56 L22 -56 L22 -66 L-22 -66Z" fill="#8a5a32" ${ol('#8a5a32', 2)}/><path d="M-22 -66 l0 -6 l8 0 l0 6 M-4 -66 l0 -6 l8 0 l0 6 M14 -66 l0 -6 l8 0 l0 6" fill="#8a5a32" ${ol('#8a5a32', 1.5)}/>${banner(0, -70, '#c0392b', '⚔')}`,
  mystic: () => `<g class="bob">${crystalProp(0, -40, 2.4, '#ff9ee8')}<ellipse cx="0" cy="-70" rx="34" ry="34" fill="#ff9ee8" opacity=".2"/></g>${star(-30, -86, 0.8)}${star(30, -70, 0.6, '#fff')}`,
  ancient: () => `<path d="M-40 4 L-40 -14 L40 -14 L40 4Z M-30 -14 L-30 -32 L30 -32 L30 -14Z M-18 -32 L-18 -50 L18 -50 L18 -32Z" fill="#e8c868" ${ol('#e8c868', 2)}/><circle cx="0" cy="-62" r="10" fill="#ff5277" ${ol('#a0203a', 2)} class="pulse"/>`,
};
const RIM = { fire: '#ff7a1a', water: '#5fb0ff', plant: '#ffd84d', earth: '#ffd27a', storm: '#ffe14d', ice: '#ffffff', metal: '#d6dde4', shadow: '#c77dff', light: '#ffd84d', war: '#c0392b', mystic: '#ff7ce5', ancient: '#ffd54f' };

// level is 0-based: Lv1 plain, Lv2 raised rim + fence, Lv3 adds a tall centrepiece.
export function habitatBack(element, level) {
  const t = HAB[element] || HAB.earth;
  const base = level >= 1
    ? `${slab(t.ground, t.side, 0.96, 15)}<path d="${dia(0.96)}" fill="none" stroke="${RIM[element] || '#fff'}" stroke-width="3" opacity=".8"/>`
    : slab(t.ground, t.side);
  const center = level >= 2 ? `<g transform="translate(0 -26)">${CENTER[element]()}</g>` : '';
  return `${base}${t.deco()}${center}${t.back()}${level >= 2 ? banner(-66, -6, shade(t.ground, -0.2), '★') : ''}<path class="hit" d="${D}" fill="transparent"/>`;
}
export function habitatFront(element, level) {
  const t = HAB[element] || HAB.earth;
  const WALL = { ice: '#d6ecff', metal: '#8a95a0', ancient: '#e8c868', fire: '#4a3a36', shadow: '#3a2a4a', light: '#efe6d0', mystic: '#d9a6e6', plant: '#9b8b6a', water: '#a8b0b8' };
  return level >= 1 ? wall(WALL[element] || '#9b8b7a') : '';
}

// ---------------------------------------------------------------- farm

// progress 0..1, crop icon shown when ready.
const CROP_ART = {
  berries: (x, y) => `<path d="M${x} ${y} q-2 -8 0 -12 M${x} ${y} q4 -6 6 -10" stroke="#2e8b3a" stroke-width="2.2" fill="none"/><circle cx="${x - 3}" cy="${y - 12}" r="3.4" fill="#d6283a" ${ol('#d6283a', 1)}/><circle cx="${x + 5}" cy="${y - 10}" r="3.4" fill="#e5484d" ${ol('#d6283a', 1)}/><circle cx="${x + 1}" cy="${y - 6}" r="3" fill="#c2182a" ${ol('#d6283a', 1)}/>`,
  wheat: (x, y) => [-4, 0, 4].map((dx) => `<path d="M${x + dx} ${y} L${x + dx * 1.6} ${y - 18}" stroke="#c9a040" stroke-width="2"/><ellipse cx="${x + dx * 1.6}" cy="${y - 20}" rx="2.6" ry="5" fill="#f0c860" ${ol('#c9a040', 1)}/>`).join(''),
  melon: (x, y) => `<path d="M${x - 8} ${y - 2} q8 -8 16 0" stroke="#2e8b3a" stroke-width="2" fill="none"/><ellipse cx="${x}" cy="${y - 5}" rx="8" ry="6" fill="#7bc95a" ${ol('#3f8f2e', 1.4)}/><path d="M${x - 5} ${y - 9} q5 4 10 0 M${x - 6} ${y - 5} q6 4 12 0" stroke="#3f8f2e" stroke-width="1.2" fill="none"/>`,
  starfruit: (x, y) => `<path d="M${x} ${y} L${x} ${y - 10}" stroke="#2e8b3a" stroke-width="2"/><path transform="translate(${x} ${y - 14}) scale(.6)" d="M0 -12 L3.5 -4 L12 -4 L5.5 2 L8 11 L0 6 L-8 11 L-5.5 2 L-12 -4 L-3.5 -4Z" fill="#ffd84d" ${ol('#c9a000', 1.6)}/>`,
  dragonfruit: (x, y) => `<path d="M${x} ${y} L${x} ${y - 6}" stroke="#2e8b3a" stroke-width="2"/><ellipse cx="${x}" cy="${y - 11}" rx="6" ry="8" fill="#e8408a" ${ol('#a01858', 1.4)}/><path d="M${x - 6} ${y - 12} l-4 -3 M${x + 6} ${y - 12} l4 -3 M${x} ${y - 19} l0 -4" stroke="#7bc95a" stroke-width="2" stroke-linecap="round"/>`,
};

export function farmArt(progress, crop, ready) {
  let rows = '';
  const plants = [];
  for (let u = -0.6; u <= 0.61; u += 0.4) for (let v = -0.6; v <= 0.61; v += 0.4) plants.push(iso(u, v));
  plants.sort((a, b) => a[1] - b[1]);
  for (let i = -2; i <= 2; i++) {
    const [x1, y1] = iso(-0.8, i * 0.3), [x2, y2] = iso(0.8, i * 0.3);
    rows += `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="#6b4a2a" stroke-width="3" stroke-linecap="round" opacity=".5"/>`;
  }
  const plant = ([x, y]) => {
    if (progress < 0) return '';
    if (ready) return (CROP_ART[crop] || CROP_ART.berries)(x, y);
    if (progress < 0.33) return `<ellipse cx="${x}" cy="${y}" rx="4" ry="2.5" fill="#5a3a22"/><path d="M${x} ${y} l0 -4" stroke="#56c85a" stroke-width="2"/>`;
    const h = progress < 0.66 ? 8 : 13;
    return `<path d="M${x} ${y} L${x} ${y - h} M${x} ${y - h * 0.6} q-6 -3 -8 -8 M${x} ${y - h * 0.6} q6 -3 8 -8 M${x} ${y - h} q-3 -6 0 -9 q3 3 0 9" stroke="#2e8b3a" stroke-width="2.4" fill="#56c85a" stroke-linecap="round"/>`;
  };
  return `${slab('#8a5a32', '#5e3a1c')}<path d="${dia(0.8)}" fill="#7a4a26"/>${rows}${plants.map(plant).join('')}${fence('#9a6a3a', 0.95)}<path class="hit" d="${D}" fill="transparent"/>`;
}

// ---------------------------------------------------------------- special buildings

export function hatcheryArt(eggs) {
  return `${slab('#7ccf5a', '#4e9e36')}
    <g transform="translate(0 -6)">
      <path d="M-56 0 L-56 -60 Q0 -96 56 -60 L56 0" fill="none" stroke="${o('#c98a4a')}" stroke-width="12"/>
      <path d="M-56 0 L-56 -60 Q0 -96 56 -60 L56 0" fill="none" stroke="#c98a4a" stroke-width="8"/>
      <path d="M-64 -58 Q0 -104 64 -58 L56 -50 Q0 -88 -56 -50Z" fill="#e5484d" ${ol('#e5484d', 2)}/>
      <ellipse cx="0" cy="-2" rx="50" ry="20" fill="#9a6a3a" ${ol('#9a6a3a', 2.2)}/>
      <ellipse cx="0" cy="-6" rx="40" ry="13" fill="#5e3a1c"/>
      <path d="M-46 -4 Q-30 6 -10 2 M10 2 Q30 6 46 -4 M-40 4 Q0 12 40 4" stroke="#c98a4a" stroke-width="2" fill="none"/>
      ${eggs}
    </g><path class="hit" d="${D}" fill="transparent"/><path class="hit" d="M-60 -2 L-60 -80 L60 -80 L60 -2Z" fill="transparent"/>`;
}

// A stone dragon statue sitting on a plinth (flip = -1 faces left).
const dragonStatue = (x, y, flip = 1, s = 1, col = '#a8a094') => `<g transform="translate(${x} ${y}) scale(${flip * s} ${s})">
  <path d="M-16 0 L-16 -12 L16 -12 L16 0Z" fill="${shade(col, -0.1)}" ${ol(col, 2)}/>
  <path d="M-12 -12 Q-16 -34 -2 -40 Q-4 -54 6 -62 Q18 -66 22 -56 L30 -54 L22 -50 Q20 -44 12 -44 Q16 -28 12 -12Z" fill="${col}" ${ol(col, 2)}/>
  <path d="M-4 -36 Q-26 -50 -28 -74 Q-16 -66 -10 -66 Q-12 -58 -4 -52" fill="${shade(col, -0.08)}" ${ol(col, 2)}/>
  <path d="M8 -62 L4 -72 L12 -64" fill="${col}" ${ol(col, 1.6)}/><circle cx="16" cy="-56" r="1.8" fill="#ffcf33"/></g>`;

export function sanctuaryArt(busy) {
  const stone = '#b8b0a4';
  return `${slab('#cfc6b6', '#9b9284')}
    <ellipse cx="0" cy="0" rx="58" ry="27" fill="#d9d0c0" ${ol(stone, 2)}/><ellipse cx="0" cy="-2" rx="44" ry="19" fill="#e6dfd0"/>
    <path d="M-36 -2 L36 -2 M0 -20 L0 16" stroke="#c8beac" stroke-width="1.4"/>
    ${dragonStatue(-44, -10, 1, 0.95, stone)}${dragonStatue(44, -10, -1, 0.95, stone)}
    <g transform="translate(0 -6)"><ellipse rx="22" ry="9" fill="#7a5a3a" ${ol('#7a5a3a', 2)}/><ellipse rx="16" ry="5" fill="#4a3018"/>
      <g class="pulse"><ellipse cx="0" cy="-12" rx="${busy ? 20 : 12}" ry="${busy ? 20 : 12}" fill="#ffd27a" opacity="${busy ? 0.5 : 0.25}"/></g>
      ${busy ? `<path d="M0 -30 C10 -30 13 -18 13 -12 C13 -4 7 0 0 0 C-7 0 -13 -4 -13 -12 C-13 -18 -10 -30 0 -30Z" fill="#fff6e0" ${ol('#7a5a3a', 2)}/><path d="M-6 -16 L0 -22 L6 -16" stroke="#c99a40" stroke-width="2" fill="none"/>` : ''}
    </g>
    <path d="M-40 -60 l2 -5 l2 5 l-2 5Z M38 -66 l2 -5 l2 5 l-2 5Z" fill="#ffd27a" class="twinkle"/>
    <path class="hit" d="${D}" fill="transparent"/><path class="hit" d="M-60 -2 L-60 -80 L60 -80 L60 -2Z" fill="transparent"/>`;
}

export function totemArt(portrait) {
  const stone = '#9b9284';
  const rune = (y) => `<path d="M-4 ${y - 5} L4 ${y - 5} L0 ${y} L4 ${y + 5} L-4 ${y + 5}" fill="none" stroke="#7dffcf" stroke-width="2" stroke-linecap="round" class="pulse"/>`;
  return `${slab('#7ccf5a', '#4e9e36', 0.6)}
    <path d="M-18 0 L-18 -10 L18 -10 L18 0Z" fill="${shade(stone, -0.15)}" ${ol(stone, 2)}/>
    <path d="M-12 -10 L-10 -84 L10 -84 L12 -10Z" fill="${stone}" ${ol(stone, 2.2)}/>
    <path d="M-10 -34 L10 -34 M-10 -60 L10 -60" stroke="${shade(stone, -0.3)}" stroke-width="2"/>
    ${rune(-22)}${rune(-47)}${rune(-72)}
    <g transform="translate(0 -84)"><path d="M-14 0 Q-16 -14 -4 -20 Q2 -30 14 -28 L26 -24 L16 -18 Q18 -8 12 0Z" fill="${shade(stone, 0.08)}" ${ol(stone, 2)}/><path d="M-2 -22 L-6 -34 L2 -26 M6 -26 L6 -38 L10 -27" fill="${stone}" ${ol(stone, 1.6)}/><circle cx="10" cy="-20" r="2" fill="#7dffcf"/>
      <path d="M-12 -6 Q-36 -16 -40 -36 Q-26 -30 -14 -18" fill="${shade(stone, -0.05)}" ${ol(stone, 2)}/></g>
    <g transform="translate(0 -128)"><g class="bob"><circle r="16" fill="#7dffcf" opacity=".28"/>${portrait || star(0, 0, 1.4, '#c8fff0')}</g></g>
    <path class="hit" d="${dia(0.6)}" fill="transparent"/><path class="hit" d="M-30 0 L-30 -140 L30 -140 L30 0Z" fill="transparent"/>`;
}

const DECO_ART = {
  torch: () => `<g transform="translate(0 0)"><path d="M-8 0 L-6 -40 L6 -40 L8 0Z" fill="#9b8b7a" ${ol('#9b8b7a', 2)}/><path d="M-12 -40 L12 -40 L8 -48 L-8 -48Z" fill="#6b5a4a" ${ol('#6b5a4a', 2)}/>${flameProp(0, -50, 1.1)}</g>`,
  fountain: () => `<ellipse cx="0" cy="0" rx="40" ry="17" fill="#c9d4de" ${ol('#c9d4de', 2)}/><ellipse cx="0" cy="-2" rx="33" ry="12" fill="#5fb0ff"/><rect x="-5" y="-38" width="10" height="36" fill="#c9d4de" ${ol('#c9d4de', 1.5)}/><ellipse cx="0" cy="-38" rx="16" ry="6" fill="#c9d4de" ${ol('#c9d4de', 1.5)}/><path d="M0 -44 Q-12 -58 -20 -30 M0 -44 Q12 -58 20 -30" stroke="#8fd0ff" stroke-width="3" fill="none" class="ripple"/>`,
  statue: () => `<path d="M-24 0 L-24 -14 L24 -14 L24 0Z" fill="#b8b0a4" ${ol('#b8b0a4', 2)}/><g transform="translate(0 -14)"><path d="M-14 0 Q-18 -24 -2 -30 Q-6 -40 4 -46 Q16 -48 18 -38 Q20 -30 10 -30 Q16 -16 14 0Z" fill="#a8a094" ${ol('#a8a094', 2)}/><path d="M-6 -24 Q-28 -40 -30 -60 Q-14 -50 -4 -34" fill="#a8a094" ${ol('#a8a094', 2)}/><circle cx="10" cy="-40" r="2" fill="#555"/></g>`,
  goldtree: () => tree(0, 0, 1.6, '#ffd54f') + `${star(-14, -64, 0.5)}${star(16, -50, 0.4, '#fff')}`,
  crystal: () => `<g class="bob"><ellipse cx="0" cy="-30" rx="26" ry="26" fill="#9fe3ff" opacity=".25"/>${crystalProp(0, -16, 1.6, '#9fe3ff')}</g><ellipse cx="0" cy="2" rx="22" ry="8" fill="#000" opacity=".15"/>`,
};

export function decoArt(id) {
  return `${slab('#7ccf5a', '#4e9e36', 0.55)}${(DECO_ART[id] || DECO_ART.torch)()}<path class="hit" d="${dia(0.6)}" fill="transparent"/><path class="hit" d="M-30 0 L-30 -80 L30 -80 L30 0Z" fill="transparent"/>`;
}

export function emptyArt() {
  return `<path d="${dia(0.9)}" fill="#ffffff" fill-opacity=".14" stroke="#fff" stroke-opacity=".6" stroke-width="2" stroke-dasharray="7 6"/><text x="0" y="8" font-size="26" text-anchor="middle" fill="#fff" opacity=".85" font-weight="300">+</text><path class="hit" d="${D}" fill="transparent"/>`;
}

// ---------------------------------------------------------------- islands

// Smooth closed curve through points (Catmull-Rom -> cubic Bezier).
function smooth(pts) {
  const n = pts.length;
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0]} ${p2[1]}`;
  }
  return d + 'Z';
}

// hull: points of the grassy top (centred on 0,0). Returns svg markup in local coords.
export function islandArt(hull, depth, { waterfall = false, ghost = false, seed = 1 } = {}) {
  const top = smooth(hull);
  const minX = Math.min(...hull.map((p) => p[0])), maxX = Math.max(...hull.map((p) => p[0]));
  const maxY = Math.max(...hull.map((p) => p[1]));
  const lower = hull.filter((p) => p[1] > -10).sort((a, b) => a[0] - b[0]);
  // rocky underside: from the lower rim down to a jagged point
  const under = [];
  under.push([minX, 10]);
  const steps = 7;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const x = minX + (maxX - minX) * t;
    const bulge = Math.sin(t * Math.PI);
    const jag = ((i * 37 + seed * 13) % 17) - 8;
    under.push([x, maxY * 0.6 + depth * bulge * (0.7 + (i % 2) * 0.25) + jag]);
  }
  under.push([maxX, 10]);
  const underD = smooth([...under, [maxX * 0.4, maxY * 0.5], [minX * 0.4, maxY * 0.5]]);
  const tipX = (minX + maxX) / 2;
  const rocks = `<path d="M${tipX - 30} ${maxY * 0.6 + depth * 0.8} L${tipX} ${maxY * 0.6 + depth * 1.18} L${tipX + 26} ${maxY * 0.6 + depth * 0.82}Z" fill="#6b5446"/>`;
  const strata = [0.35, 0.6, 0.85].map((k) => `<path d="M${minX * (1 - k * 0.5)} ${maxY * 0.6 + depth * k * 0.6} Q${tipX} ${maxY * 0.6 + depth * k * 0.85} ${maxX * (1 - k * 0.5)} ${maxY * 0.6 + depth * k * 0.6}" stroke="#5a4438" stroke-width="3" fill="none" opacity=".45"/>`).join('');
  const roots = lower.filter((_, i) => i % 2).map(([x, y]) => `<path d="M${x} ${y + 14} q-4 16 2 30 q4 10 -2 20" stroke="#6b4a2a" stroke-width="3" fill="none" opacity=".7"/>`).join('');
  const fall = waterfall ? `<g class="waterfall"><path d="M${maxX * 0.55} ${maxY * 0.55} L${maxX * 0.55 + 22} ${maxY * 0.55} L${maxX * 0.55 + 26} ${maxY + depth * 1.4} L${maxX * 0.55 - 4} ${maxY + depth * 1.4}Z" fill="url(#fallgrad)"/><path d="M${maxX * 0.55 + 6} ${maxY * 0.6} L${maxX * 0.55 + 8} ${maxY + depth}" stroke="#fff" stroke-width="2" opacity=".6" class="flow"/></g>` : '';
  const grassEdge = `<path d="${top}" fill="none" stroke="#3f8f2e" stroke-width="5" transform="translate(0 16)"/>`;
  return `<g ${ghost ? 'opacity=".45"' : ''}>
    <defs><linearGradient id="fallgrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd0ff"/><stop offset="1" stop-color="#8fd0ff" stop-opacity="0"/></linearGradient>
    <linearGradient id="rockgrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9b7a62"/><stop offset="1" stop-color="#5a4438"/></linearGradient>
    <radialGradient id="grassgrad" cx=".45" cy=".35" r=".75"><stop offset="0" stop-color="#a8e67e"/><stop offset=".7" stop-color="#7ccf5a"/><stop offset="1" stop-color="#5cb043"/></radialGradient></defs>
    ${roots}
    <path d="${underD}" fill="url(#rockgrad)" stroke="#4a362c" stroke-width="3"/>${rocks}${strata}${fall}
    <path d="${top}" fill="#8a6440" transform="translate(0 18)" stroke="#5e4028" stroke-width="3"/>
    ${grassEdge}
    <path d="${top}" fill="url(#grassgrad)" stroke="#3f8f2e" stroke-width="3"/>
  </g>`;
}

// Scenery placed on an island: [kind, x, y, scale].
export function rimDecor(items) {
  return items.map(([k, x, y, s = 1]) => {
    if (k === 'pine') return pine(x, y, s * 1.3);
    if (k === 'tree') return tree(x, y, s * 1.2, '#56c85a');
    if (k === 'bush') return `<g transform="translate(${x} ${y}) scale(${s})"><circle cx="-8" cy="-6" r="9" fill="#4fb84a" ${ol('#4fb84a', 2)}/><circle cx="6" cy="-8" r="11" fill="#5cc855" ${ol('#5cc855', 2)}/>${flower(0, -10, '#ff7aa8')}</g>`;
    return `${flower(x, y)}${flower(x + 12, y + 5, '#ffd84d')}${flower(x - 10, y + 6, '#b388ff')}`;
  }).join('');
}

export function cloudArt(s = 1) {
  return `<svg viewBox="-60 -30 120 50" width="${120 * s}" height="${50 * s}"><path d="M-50 14 Q-58 -2 -38 -4 Q-34 -24 -12 -18 Q0 -34 18 -20 Q40 -26 44 -4 Q60 0 52 14Z" fill="#fff" opacity=".9"/></svg>`;
}
