// Procedural SVG dragons. Each species has a hand-picked design (designs.js) choosing a
// body plan, head, horns, crests, wings, tail and markings. Parts are drawn with merged dark
// outlines and gradient shading for a glossy, sticker-like look.
import { ELEMENTS, RARITIES } from './data.js';
import { designFor } from './designs.js';

// ---------------------------------------------------------------- colour + shared defs

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
function mix(a, b, t) {
  const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16);
  const ch = (s) => Math.round(((x >> s) & 255) * (1 - t) + ((y >> s) & 255) * t);
  return '#' + ((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1);
}

// Gradients live once in a hidden <svg> so every dragon can share them by colour.
let defsEl = null;
const made = new Set();
function def(id, markup) {
  if (made.has(id) || typeof document === 'undefined') return;
  made.add(id);
  if (!defsEl) {
    const holder = document.createElement('div');
    holder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    holder.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" aria-hidden="true"><defs></defs></svg>';
    document.body.prepend(holder);
    defsEl = holder.querySelector('defs');
  }
  const tmp = document.createElement('div');
  tmp.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg">${markup}</svg>`;
  defsEl.appendChild(tmp.firstChild.firstChild);
}
function grad(c) {
  const id = 'lg' + c.slice(1);
  def(id, `<linearGradient id="${id}" x1="0" y1="0" x2="0.25" y2="1"><stop offset="0" stop-color="${shade(c, 0.3)}"/><stop offset=".42" stop-color="${c}"/><stop offset="1" stop-color="${shade(c, -0.42)}"/></linearGradient>`);
  return `url(#${id})`;
}
function hornGrad(base, tip) {
  const id = 'hg' + base.slice(1) + tip.slice(1);
  def(id, `<linearGradient id="${id}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${base}"/><stop offset=".55" stop-color="${mix(base, tip, 0.6)}"/><stop offset="1" stop-color="${tip}"/></linearGradient>`);
  return `url(#${id})`;
}
function glowGrad(c) {
  const id = 'rg' + c.slice(1);
  def(id, `<radialGradient id="${id}"><stop offset="0" stop-color="${c}" stop-opacity=".75"/><stop offset=".55" stop-color="${c}" stop-opacity=".25"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`);
  return `url(#${id})`;
}

// ---------------------------------------------------------------- geometry helpers

const r1 = (n) => Math.round(n * 10) / 10;
function cubic(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ];
}
// A tapered tube along cubic segments, as overlapping circles.
function tube(segs, n = 12) {
  const out = [];
  segs.forEach((s, si) => {
    for (let i = si ? 1 : 0; i <= n; i++) {
      const t = i / n;
      const [x, y] = cubic(...s.p, t);
      out.push({ x, y, r: s.r[0] + (s.r[1] - s.r[0]) * t });
    }
  });
  return out;
}
const angleOf = (a, b) => (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;

// Silhouette group: an outline pass then a fill pass, so overlapping parts share one outline.
// Outline thickness: chunky for babies, finer (more detailed) for adults. Set per drawing.
let lineW = 3.2;
let adultNow = false;
function sil(items, outline, w = lineW) {
  let o = '', f = '';
  for (const it of items) {
    if (it.k === 'c') {
      for (const c of it.c) o += `<circle cx="${r1(c.x)}" cy="${r1(c.y)}" r="${r1(c.r + w)}" fill="${outline}"/>`;
      for (const c of it.c) f += `<circle cx="${r1(c.x)}" cy="${r1(c.y)}" r="${r1(c.r)}" fill="${it.f}"/>`;
      if (it.hl !== false && it.c.length > 2) {
        const pts = it.c.map((c) => `${r1(c.x - c.r * 0.12)},${r1(c.y - c.r * 0.42)}`).join(' ');
        const wmin = Math.min(...it.c.map((c) => c.r));
        f += `<polyline points="${pts}" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="${r1(Math.max(2, wmin * 0.55))}" stroke-linecap="round" stroke-linejoin="round"/>`;
      }
    } else {
      const shape = it.k === 'e'
        ? (attrs) => `<ellipse cx="${it.cx}" cy="${it.cy}" rx="${it.rx}" ry="${it.ry}"${it.rot ? ` transform="rotate(${it.rot} ${it.cx} ${it.cy})"` : ''} ${attrs}/>`
        : (attrs) => `<path d="${it.d}" ${attrs}/>`;
      o += shape(`fill="${outline}" stroke="${outline}" stroke-width="${w * 2}" stroke-linejoin="round"`);
      f += shape(`fill="${it.f}"`);
    }
  }
  return o + f;
}
// A single outlined shape (for details drawn on top).
const ol = (outline, w = 2.2) => `stroke="${outline}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const at = (x, y, rot = 0, s = 1) => `transform="translate(${r1(x)} ${r1(y)}) rotate(${r1(rot)}) scale(${r1(s * 100) / 100})"`;

// ---------------------------------------------------------------- small motifs (centred, pointing up)

function flame(C, s = 1) {
  return `<g transform="scale(${s})"><path d="M0 8 C-10 2 -9 -8 -3 -14 C-3 -8 0 -6 1 -9 C2 -14 0 -18 3 -24 C10 -14 12 -4 8 3 C6 7 3 8 0 8Z" fill="#ffb02e" ${ol(C.o, 1.6)}/><path d="M0 6 C-5 2 -4 -3 -1 -6 C0 -3 2 -3 2 -6 C6 -2 5 4 0 6Z" fill="#fff0a0"/></g>`;
}
function leaf(C, s = 1, col = '#4fd65c') {
  return `<g transform="scale(${s})"><path d="M0 4 C-10 -6 -8 -18 0 -26 C8 -18 10 -6 0 4Z" fill="${grad(col)}" ${ol(C.o, 1.6)}/><path d="M0 2 L0 -20" stroke="${shade(col, -0.35)}" stroke-width="1.3"/></g>`;
}
function shard(C, s = 1, col = '#c8f1ff') {
  return `<g transform="scale(${s})"><path d="M-6 4 L-4 -16 L0 -26 L5 -15 L6 4Z" fill="${grad(col)}" ${ol(C.o, 1.6)}/><path d="M0 -24 L0 2" stroke="#fff" stroke-opacity=".7" stroke-width="1.2"/></g>`;
}
function spike(C, s = 1, col) {
  return `<g transform="scale(${s})"><path d="M-7 4 Q-2 -10 0 -20 Q3 -8 7 4Z" fill="${grad(col)}" ${ol(C.o, 1.6)}/></g>`;
}
function plate(C, s = 1, col) {
  return `<g transform="scale(${s})"><path d="M-8 4 Q-9 -14 0 -20 Q9 -14 8 4Z" fill="${grad(col)}" ${ol(C.o, 1.6)}/><path d="M-3 -2 Q0 -12 3 -2" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1.4"/></g>`;
}
function rock(C, s = 1, col = '#9b6b43') {
  return `<g transform="scale(${s})"><path d="M-9 4 L-8 -8 L-1 -15 L8 -10 L9 4Z" fill="${grad(col)}" ${ol(C.o, 1.6)}/><path d="M-2 -12 L1 -4 L-3 2" fill="none" stroke="${shade(col, -0.4)}" stroke-width="1.2"/></g>`;
}
function bolt(C, s = 1) {
  return `<g transform="scale(${s})"><path d="M2 -24 L-8 -6 L-1 -6 L-5 6 L8 -10 L1 -10 L5 -24Z" fill="#ffe14d" ${ol(C.o, 1.6)}/></g>`;
}
function gear(C, s = 1, col = '#b8c2cc') {
  let teeth = '';
  for (let i = 0; i < 8; i++) teeth += `<rect x="-3" y="-15" width="6" height="7" rx="1.5" transform="rotate(${i * 45})" fill="${col}" ${ol(C.o, 1.4)}/>`;
  return `<g transform="scale(${s})">${teeth}<circle r="10" fill="${grad(col)}" ${ol(C.o, 1.6)}/><circle r="4" fill="${shade(col, -0.4)}"/></g>`;
}
function feather(C, s = 1, col) {
  return `<g transform="scale(${s})"><path d="M0 6 C-8 -4 -6 -20 0 -30 C6 -20 8 -4 0 6Z" fill="${grad(col)}" ${ol(C.o, 1.6)}/><path d="M0 4 L0 -26 M0 -8 L-4 -13 M0 -16 L4 -21 M0 -4 L4 -9" stroke="${shade(col, -0.35)}" stroke-width="1.1" fill="none"/></g>`;
}
function tuft(C, s = 1, col) {
  return `<g transform="scale(${s})"><path d="M-8 4 Q-10 -10 -2 -18 Q-2 -10 2 -8 Q2 -18 8 -22 Q12 -8 8 4Z" fill="${grad(col)}" ${ol(C.o, 1.6)}/></g>`;
}
function smoke(C, s = 1, col = '#5b4a7a') {
  return `<g transform="scale(${s})" opacity=".9"><circle cx="0" cy="-6" r="7" fill="${col}"/><circle cx="-5" cy="-14" r="5" fill="${shade(col, 0.15)}"/><circle cx="3" cy="-20" r="4" fill="${shade(col, 0.3)}"/></g>`;
}
function star(C, s = 1, col = '#fff07a') {
  return `<g transform="scale(${s})"><path d="M0 -14 L3.5 -4 L14 -4 L5.5 2 L9 12 L0 6 L-9 12 L-5.5 2 L-14 -4 L-3.5 -4Z" fill="${col}" ${ol(C.o, 1.5)}/></g>`;
}
function sparkle(s = 1, col = '#fffbe0') {
  return `<path transform="scale(${s})" d="M0 -10 Q1 -1 10 0 Q1 1 0 10 Q-1 1 -10 0 Q-1 -1 0 -10Z" fill="${col}"/>`;
}
function petal(C, s = 1, col) {
  return `<g transform="scale(${s})"><path d="M0 2 C-9 -6 -8 -18 0 -22 C8 -18 9 -6 0 2Z" fill="${grad(col)}" ${ol(C.o, 1.5)}/></g>`;
}
function cloudPuff(C, s = 1, col = '#e9f1fb') {
  return `<g transform="scale(${s})"><path d="M-14 4 Q-18 -6 -8 -8 Q-8 -18 2 -16 Q10 -22 14 -12 Q22 -10 18 4Z" fill="${grad(col)}" ${ol(C.o, 1.6)}/></g>`;
}

// ---------------------------------------------------------------- eyes, mouths, horns

function eye(C, type, x, y, size = 1) {
  // The lid is collapsed (scale 0) unless a CSS blink animation runs on it.
  const lid = type === 'happy' ? '' : `<g class="blink" transform="scale(1 0)"><ellipse rx="10" ry="11.5" fill="${C.main}" ${ol(C.o, 1.4)}/></g>`;
  const g = (inner) => `<g ${at(x, y, 0, size)}>${inner}${lid}</g>`;
  const iris = C.iris;
  switch (type) {
    case 'fierce':
      return g(`<path d="M-8 1 Q-2 -9 9 -4 Q7 6 -2 6 Q-7 5 -8 1Z" fill="#fff" ${ol(C.o, 1.6)}/><ellipse cx="2" cy="0" rx="4" ry="5" fill="${iris}"/><ellipse cx="2.3" cy="0" rx="1.4" ry="4.2" fill="#111"/><circle cx="4" cy="-2" r="1.3" fill="#fff"/><path d="M-10 -5 L10 -10" stroke="${C.o}" stroke-width="3.2" stroke-linecap="round"/>`);
    case 'glow':
      return g(`<ellipse cx="0" cy="0" rx="10" ry="10" fill="${glowGrad(C.glow)}"/><path d="M-7 1 Q-1 -8 8 -3 Q6 5 -1 5 Q-6 5 -7 1Z" fill="${C.glow}" ${ol(C.o, 1.4)}/><ellipse cx="1" cy="-1" rx="3" ry="2" fill="#fff" opacity=".9"/>`);
    case 'sleepy':
      return g(`<ellipse rx="7.5" ry="8.5" fill="#fff" ${ol(C.o, 1.6)}/><circle cx="1.5" cy="2" r="5" fill="${iris}"/><circle cx="1.8" cy="2.4" r="2.5" fill="#111"/><path d="M-8.5 -1 Q0 -11 8.5 -1 Z" fill="${C.main}" ${ol(C.o, 1.4)}/><circle cx="4" cy="3" r="1.3" fill="#fff"/>`);
    case 'happy':
      return g(`<path d="M-7 2 Q0 -8 7 2" fill="none" stroke="${C.o}" stroke-width="3.2" stroke-linecap="round"/>`);
    case 'calm': // almond reptile eye with a slit pupil
      return g(`<path d="M-9 2 Q-3 -8 9 -3 Q8 5 -1 6 Q-7 6 -9 2Z" fill="#fff8e0" ${ol(C.o, 1.6)}/><ellipse cx="2" cy="0" rx="4.6" ry="5" fill="${iris}"/><ellipse cx="2.4" cy="0" rx="1.3" ry="4.4" fill="#111"/><circle cx="4.2" cy="-2.2" r="1.2" fill="#fff"/>`);
    default:
      return g(`<ellipse rx="8.5" ry="10" fill="#fff" ${ol(C.o, 1.6)}/><circle cx="2" cy="1" r="6.2" fill="${iris}"/><circle cx="2.4" cy="1.3" r="3.3" fill="#111"/><circle cx="4.6" cy="-2.6" r="2.4" fill="#fff"/><circle cx="0" cy="4" r="1.2" fill="#fff"/>`);
  }
}

function mouth(C, type, x, y, w = 16) {
  switch (type) {
    case 'fang':
      return `<path d="M${x} ${y} q${w / 2} 5 ${w} -1" fill="none" ${ol(C.o, 2.2)}/><path d="M${x + w * 0.62} ${y + 2} l2.5 6 l2.5 -6.5Z" fill="#fff" ${ol(C.o, 1.1)}/>`;
    case 'grin':
      return `<path d="M${x} ${y - 1} q${w / 2} 9 ${w} -1 q-${w / 2} 2 -${w} 1Z" fill="#7a1f2b" ${ol(C.o, 2)}/><path d="M${x + 2} ${y} l2 3 l2 -3 l2 3 l2 -3 l2 3 l2 -3" fill="none" stroke="#fff" stroke-width="1.4"/>`;
    case 'roar':
      return `<path d="M${x - 2} ${y - 3} q${w / 2 + 2} -2 ${w + 4} 1 q-2 12 -${w / 2 + 2} 12 q-${w / 2} -2 -${w / 2 + 2} -13Z" fill="#7a1f2b" ${ol(C.o, 2)}/><ellipse cx="${x + w / 2}" cy="${y + 6}" rx="${w / 4}" ry="3" fill="#ff7a8a"/><path d="M${x + 1} ${y - 2} l2 5 l2 -5 M${x + w - 4} ${y - 2} l2 5 l2 -5" fill="#fff" stroke="#fff" stroke-width="1.2"/>`;
    case 'tusk':
      return `<path d="M${x} ${y} q${w / 2} 4 ${w} 0" fill="none" ${ol(C.o, 2.2)}/><path d="M${x + 2} ${y + 1} q-1 -9 4 -12 q-1 6 1 11Z M${x + w - 4} ${y + 1} q1 -9 5 -11 q-2 6 -1 11Z" fill="#fff6e0" ${ol(C.o, 1.2)}/>`;
    case 'jaw': // straight jaw line running back under the eye, two upper fangs and one lower
      return `<path d="M${x + w + 6} ${y - 2} L${x - 2} ${y + 1} Q${x - 8} ${y + 2} ${x - 11} ${y + 7}" fill="none" ${ol(C.o, 2.2)}/><path d="M${x + w} ${y - 1} l1.5 6 l2.5 -6.4Z M${x + w - 8} ${y} l1.4 5 l2.2 -5.2Z M${x + 4} ${y + 1} l1.6 -5 l2 5Z" fill="#fff6e0" ${ol(C.o, 1)}/>`;
    case 'snarl': // closed snarl: dark slot with zig-zag teeth
      return `<path d="M${x - 4} ${y} L${x + w + 4} ${y - 4} L${x + w + 2} ${y + 3} L${x - 2} ${y + 5}Z" fill="#2a1018" ${ol(C.o, 1.8)}/><path d="M${x - 2} ${y + 1} l3 2.5 l3 -3 l3 3 l3 -3.2 l3 3 l3 -3.3 l3 2.8" fill="none" stroke="#fff6e0" stroke-width="1.6" stroke-linejoin="round"/><path d="M${x - 11} ${y + 7} Q${x - 8} ${y + 3} ${x - 4} ${y + 2}" fill="none" ${ol(C.o, 2)}/>`;
    case 'beak':
      return '';
    default:
      return `<path d="M${x} ${y} q${w / 2} 6 ${w} -1" fill="none" ${ol(C.o, 2.2)}/>`;
  }
}

// Horns are drawn pointing up from (0,0); the head rotates them backwards.
function horn(C, type, col) {
  const f = adultNow ? hornGrad(shade(C.main, -0.5), col) : grad(col);
  const o = ol(C.o, 1.8);
  switch (type) {
    case 'spike': return `<path d="M-5 2 Q-2 -14 1 -26 Q4 -12 6 2Z" fill="${f}" ${o}/>`;
    case 'curve': return `<path d="M-5 2 Q-6 -16 -16 -26 Q-12 -20 -2 -16 Q4 -8 6 2Z" fill="${f}" ${o}/>`;
    // Ram horn: sweeps back from the skull and curls down behind it.
    case 'ram': return `<path d="M-5 2 Q-16 -10 -36 -12 Q-50 -8 -54 4 Q-44 -2 -34 0 Q-18 2 6 2Z" fill="${f}" ${o}/><path d="M-12 -7 L-10 1 M-22 -10 L-20 0 M-32 -11 L-31 -1 M-42 -8 L-41 0" stroke="${shade(col, -0.4)}" stroke-width="1.4"/>`;
    case 'antler': return `<path d="M0 2 L-2 -14 L-12 -22 M-2 -14 L-1 -26 L-8 -34 M-1 -26 L6 -34 M-2 -10 L8 -18" fill="none" stroke="${C.o}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M0 2 L-2 -14 L-12 -22 M-2 -14 L-1 -26 L-8 -34 M-1 -26 L6 -34 M-2 -10 L8 -18" fill="none" stroke="${col}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>`;
    case 'crescent': return `<path d="M-4 2 Q-14 -18 2 -32 Q-4 -16 6 2Z" fill="${f}" ${o}/>`;
    case 'antenna': return `<path d="M0 2 Q-4 -14 4 -26" fill="none" stroke="${C.o}" stroke-width="2.4"/><circle cx="4" cy="-28" r="4.5" fill="${grad(C.accent)}" ${ol(C.o, 1.5)}/>`;
    case 'crystal': return shard(C, 1, col);
    case 'branch': return `<path d="M0 2 Q-3 -12 -10 -20 M-4 -10 Q2 -16 4 -24" fill="none" stroke="${C.o}" stroke-width="6.5" stroke-linecap="round"/><path d="M0 2 Q-3 -12 -10 -20 M-4 -10 Q2 -16 4 -24" fill="none" stroke="#8a5a32" stroke-width="3.2" stroke-linecap="round"/>${`<g transform="translate(-10 -20) rotate(-40)">${leaf(C, 0.45)}</g><g transform="translate(4 -24) rotate(20)">${leaf(C, 0.45)}</g>`}`;
    default: return `<path d="M-5 2 Q-3 -8 0 -12 Q4 -8 5 2Z" fill="${f}" ${o}/>`; // nub
  }
}

// ---------------------------------------------------------------- heads (local coords, face right)

const HEADS = {
  round: { skull: (f) => [{ k: 'e', cx: 0, cy: 0, rx: 24, ry: 23, f }, { k: 'e', cx: 22, cy: 9, rx: 17, ry: 12.5, f }], eye: [8, -5, 1], mouth: [20, 15, 16], nose: [[30, 4], [36, 5]], horns: [[-14, -16, -35], [2, -22, -15]], back: [-20, -4] },
  long: { skull: (f) => [{ k: 'e', cx: -2, cy: 0, rx: 22, ry: 19, f }, { k: 'p', d: 'M6 -12 Q30 -14 48 -4 L50 4 Q46 12 36 14 L6 18Z', f }], eye: [6, -6, 0.95], mouth: [20, 14, 20], nose: [[42, 3]], horns: [[-14, -12, -50], [-2, -17, -30]], back: [-20, -2] },
  beak: { skull: (f) => [{ k: 'p', d: 'M-20 -6 Q-18 -22 0 -22 Q14 -20 18 -8 L18 10 Q4 18 -14 14 Q-22 6 -20 -6Z', f }], eye: [6, -5, 1], mouth: [0, 0, 0], beak: true, horns: [[-12, -16, -35], [2, -21, -15]], back: [-18, -4] },
  blunt: { skull: (f) => [{ k: 'p', d: 'M-24 -10 Q-24 -26 -6 -26 L14 -24 Q32 -22 34 -6 L36 14 Q32 26 14 26 L-14 24 Q-26 20 -24 4Z', f }], eye: [12, -9, 0.8], mouth: [12, 16, 20], nose: [[30, 2]], horns: [[-12, -22, -30], [8, -24, -5]], back: [-20, -6] },
  serpent: { skull: (f) => [{ k: 'e', cx: 0, cy: 0, rx: 21, ry: 18, f }, { k: 'p', d: 'M6 -11 Q38 -10 48 3 Q46 15 30 16 L4 16Z', f }], eye: [6, -6, 0.95], mouth: [22, 13, 20], nose: [[43, 2]], whiskers: true, horns: [[-12, -12, -60], [0, -16, -45]], back: [-18, -2] },
  fish: { skull: (f) => [{ k: 'e', cx: 4, cy: 0, rx: 27, ry: 21, f }, { k: 'e', cx: 28, cy: 9, rx: 9, ry: 7, f }], eye: [10, -6, 1.1], mouth: [22, 13, 12], horns: [[-6, -18, -30], [8, -20, -10]], back: [-18, 0] },
  helm: { skull: (f) => [{ k: 'e', cx: 0, cy: 2, rx: 23, ry: 22, f }, { k: 'e', cx: 22, cy: 10, rx: 16, ry: 11, f }], eye: [9, 0, 0.9], mouth: [22, 15, 14], nose: [[34, 7]], helm: true, horns: [[-12, -20, -40], [6, -24, -15]], back: [-20, 0] },
  skull: { skull: (f) => [{ k: 'p', d: 'M-22 -4 Q-22 -24 0 -24 Q24 -24 40 -6 Q46 4 38 12 L30 10 L28 18 L20 12 L16 20 L8 14 Q-10 22 -20 10Z', f }], eye: [8, -7, 1], mouth: [0, 0, 0], horns: [[-14, -18, -45], [0, -23, -25]], back: [-18, -2] },
  crystal: { skull: (f) => [{ k: 'p', d: 'M-22 8 L-18 -14 L0 -24 L20 -16 L42 0 L38 14 L8 18 L-12 18Z', f }], eye: [8, -6, 0.9], mouth: [22, 12, 14], facets: 'M0 -24 L4 -4 L-18 -14 M4 -4 L42 0 M4 -4 L8 18', horns: [[-12, -16, -40], [4, -22, -20]], back: [-18, 0] },
};

function headCrest(C, type, h) {
  const [bx, by] = h.back;
  const at3 = (arr, fn) => arr.map(([x, y, r, s]) => `<g ${at(bx + x, by + y, r, s)}>${fn(s)}</g>`).join('');
  switch (type) {
    case 'flame': return at3([[0, -10, -40, 1.05], [-6, 2, -75, 1], [-2, 14, -105, 0.85], [8, -18, -15, 0.9]], () => flame(C));
    case 'leaves': return at3([[0, -10, -40, 1], [-6, 2, -75, 1], [-2, 14, -105, 0.9], [10, -18, -10, 0.9]], () => leaf(C, 1, C.leafCol));
    case 'icicles': return at3([[0, -10, -45, 1], [-6, 2, -75, 0.9], [-2, 14, -105, 0.8], [10, -18, -15, 0.9]], () => shard(C, 1, '#c8f1ff'));
    case 'fins': return `<g ${at(bx + 4, by - 6, -30)}><path d="M0 4 L-26 -18 Q-20 -2 -30 4 Q-18 6 -24 16Z" fill="${grad(C.wing)}" ${ol(C.o, 1.8)}/><path d="M0 4 L-22 -12 M0 4 L-24 4 M0 4 L-20 12" stroke="${shade(C.wing, -0.35)}" stroke-width="1.2"/></g>`;
    case 'feathers': return at3([[2, -14, -30, 1], [-4, -6, -55, 0.95], [-6, 4, -80, 0.85]], () => feather(C, 1, C.accent));
    case 'smoke': return at3([[0, -12, -30, 1.2], [-8, 0, -70, 1.1], [-4, 12, -100, 1]], () => smoke(C, 1, C.smokeCol));
    case 'rocks': return at3([[2, -16, -20, 1], [-6, -6, -50, 1.1], [-6, 6, -80, 0.9]], () => rock(C, 1, C.rockCol));
    case 'bolts': return at3([[4, -18, -15, 0.9], [-4, -8, -45, 0.95], [-6, 4, -75, 0.85]], () => bolt(C));
    case 'gears': return `<g ${at(bx - 2, by - 10, 0, 0.95)}>${gear(C, 1, C.metalCol)}</g>`;
    case 'mane': return at3([[4, -18, -20, 1.1], [-4, -10, -45, 1.15], [-8, 0, -75, 1.15], [-6, 10, -100, 1.05], [-2, 18, -125, 0.95]], () => tuft(C, 1, C.accent));
    case 'frill': return `<g ${at(bx + 6, by + 2, 0)}><path d="M0 0 L-10 -30 Q-22 -26 -26 -16 Q-34 -6 -30 6 Q-30 18 -20 24 L0 0Z" fill="${grad(C.wing)}" ${ol(C.o, 1.8)}/><path d="M0 0 L-12 -26 M0 0 L-26 -12 M0 0 L-30 4 M0 0 L-22 20" stroke="${shade(C.wing, -0.35)}" stroke-width="1.3"/></g>`;
    case 'petals': {
      let p = '';
      for (let i = 0; i < 8; i++) p += `<g transform="rotate(${i * 45})"><g transform="translate(0 -24)">${petal(C, 1.15, i % 2 ? C.accent : shade(C.accent, 0.3))}</g></g>`;
      return `<g ${at(2, 0)}>${p}</g>`;
    }
    case 'cloud': return `<g ${at(bx - 4, by - 8, -20, 1.2)}>${cloudPuff(C)}</g>`;
    default: return '';
  }
}

function drawHead(C, spec0, stage, slot = 0) {
  const baby = stage === 'baby';
  const adult = stage === 'adult';
  // Babies stay cute; adults get a longer snout, reptile eyes, a fanged jaw and a brow ridge.
  const ADULT_HEAD = { round: 'long', fish: 'serpent' };
  const spec = adult && ADULT_HEAD[spec0.head] ? { ...spec0, head: ADULT_HEAD[spec0.head] } : spec0;
  const h = HEADS[spec.head] || HEADS.round;
  const f = grad(C.main);
  let out = '';
  // behind: crest + horns
  const crest = spec.crests ? spec.crests[slot] : spec.crest;
  if (!baby && crest) out += headCrest(C, crest, h);
  if (crest === 'halo' && !baby) out += `<ellipse cx="0" cy="-36" rx="18" ry="5" fill="none" stroke="${C.o}" stroke-width="6"/><ellipse cx="0" cy="-36" rx="18" ry="5" fill="none" stroke="#ffe066" stroke-width="3"/>`;
  const hornType = baby ? 'nub' : spec.horns;
  if (hornType && hornType !== 'none' && hornType !== 'rhino') {
    for (const [x, y, rot] of h.horns) out += `<g ${at(x, y, rot, baby ? 0.9 : adult ? 1.22 : 1)}>${horn(C, hornType, C.horn)}</g>`;
  }
  out += sil(h.skull(f), C.o);
  if (h.facets) out += `<path d="${h.facets}" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1.3"/>`;
  if (!adult) out += `<ellipse cx="-8" cy="-12" rx="9" ry="5" fill="#fff" opacity=".22" transform="rotate(-25 -8 -12)"/>`;
  // Adults: a dark crown-to-snout ridge and two jaw spikes pointing back.
  if (adult && !h.helm && !h.beak) {
    out += `<path d="M-14 -14 Q6 -24 34 -10" fill="none" stroke="${shade(C.main, -0.3)}" stroke-width="3" stroke-linecap="round" opacity=".5"/>`;
    out += [[-16, 10, -115], [-10, 16, -135]].map(([x, y, r]) => `<g ${at(x, y, r, 0.55)}>${spike(C, 1, C.horn)}</g>`).join('');
  }
  if (hornType === 'rhino' || (spec.horns === 'rhino' && !baby)) out += `<g ${at(28, -2, 20, 1.05)}>${horn(C, 'spike', C.horn)}</g>`;
  if (h.helm) {
    out += `<path d="M-25 4 Q-26 -28 2 -28 Q28 -27 32 -2 L22 -2 Q18 -6 10 -6 L-6 -6 Q-12 -2 -14 4Z" fill="${grad(C.metalCol)}" ${ol(C.o, 2.4)}/><path d="M-4 -26 Q4 -34 14 -27" fill="none" stroke="${C.accent}" stroke-width="5" stroke-linecap="round"/><circle cx="-14" cy="-12" r="2" fill="${shade(C.metalCol, -0.4)}"/><circle cx="-4" cy="-18" r="2" fill="${shade(C.metalCol, -0.4)}"/>`;
  }
  if (h.helm && spec.plume && !baby) {
    out += `<g ${at(2, -30, -20)}><path d="M0 0 C-6 -14 -24 -26 -40 -22 C-30 -14 -26 -6 -14 2Z" fill="${grad(C.accent)}" ${ol(C.o, 2)}/><path d="M-4 -2 C-12 -12 -24 -18 -34 -18" stroke="${shade(C.accent, -0.3)}" stroke-width="1.4" fill="none"/></g>`;
  }
  if (h.helm && spec.helmWings && !baby) {
    out += `<g ${at(-16, -18, -30, 0.36)}>${featherWing(C, '#fbfdff', 1)}</g>`;
  }
  if (h.whiskers && !baby) {
    out += `<path d="M40 8 Q58 8 64 22 Q66 32 58 36 M36 12 Q48 22 44 34" fill="none" stroke="${C.o}" stroke-width="3.6" stroke-linecap="round"/><path d="M40 8 Q58 8 64 22 Q66 32 58 36 M36 12 Q48 22 44 34" fill="none" stroke="${C.accent}" stroke-width="1.8" stroke-linecap="round"/>`;
  }
  if (h.beak && adult) {
    out += [[-14, 4, -110], [-16, 12, -125], [-12, 18, -140], [-18, -4, -95]].map(([x, y, r]) => `<g ${at(x, y, r, 0.75)}>${feather(C, 1, C.accent)}</g>`).join('');
    out += `<path d="M14 -8 Q44 -10 50 4 Q48 14 40 10 Q30 12 16 12Z" fill="${grad(C.beakCol)}" ${ol(C.o, 2)}/><path d="M18 4 Q32 4 46 6" stroke="${shade(C.beakCol, -0.45)}" stroke-width="1.5" fill="none"/>`;
  } else if (h.beak) out += `<path d="M14 -6 Q40 -4 46 10 Q34 14 16 12Z" fill="${grad(C.beakCol)}" ${ol(C.o, 2)}/><path d="M18 6 Q30 7 42 9" stroke="${shade(C.beakCol, -0.4)}" stroke-width="1.4" fill="none"/>`;
  if (spec.head === 'skull') out += `<path d="M28 10 L30 18 L32 10 M18 12 L20 20 L22 12" fill="#fff" ${ol(C.o, 1)}/>`;
  for (const [x, y] of h.nose || []) out += `<ellipse cx="${x}" cy="${y}" rx="2" ry="1.6" fill="${C.o}"/>`;
  const mouthType = baby ? 'smile' : spec.mouth || 'smile';
  const adultMouth = { smile: 'jaw', fang: 'jaw', grin: 'snarl', roar: 'snarl' };
  if (!h.beak && spec.head !== 'skull') out += mouth(C, adult ? adultMouth[mouthType] || mouthType : mouthType, ...h.mouth);
  let eyeType = baby && spec.eyes !== 'glow' ? 'cute' : spec.eyes || 'cute';
  if (adult && ['cute', 'happy', 'sleepy'].includes(eyeType)) eyeType = 'calm';
  const [ex, ey, es] = h.eye;
  out += eye(C, eyeType, ex, ey, es * (baby ? 1.2 : adult ? 0.9 : 1));
  if (adult && !h.helm && eyeType !== 'fierce') {
    out += `<path d="M${ex - 13} ${ey - 5} Q${ex - 2} ${ey - 17} ${ex + 13} ${ey - 11} L${ex + 11} ${ey - 6} Q${ex} ${ey - 11} ${ex - 11} ${ey - 1}Z" fill="${shade(C.main, -0.25)}" ${ol(C.o, 1.5)}/>`;
  }
  if (baby && spec.head !== 'skull' && spec.head !== 'crystal') out += `<ellipse cx="${ex - 4}" cy="${ey + 12}" rx="5" ry="3" fill="#ff7aa8" opacity=".38"/>`;
  if (spec.gem && !baby) out += `<path d="M-2 -20 L3 -26 L8 -20 L3 -14Z" fill="${C.accent}" ${ol(C.o, 1.4)}/>`;
  return out;
}

// ---------------------------------------------------------------- wings (root at 0,0, spread up-left)

// Feathered wing: smooth leading edge, scalloped feather tips along the trailing edge.
function featherWing(C, col, k) {
  const tip = [-76 * k, -66 * k], root = [-4, 8];
  const n = 6;
  let d = `M2 4 C${-8 * k} ${-34 * k} ${-40 * k} ${-64 * k} ${tip[0]} ${tip[1]}`;
  for (let i = 0; i < n; i++) {
    const t0 = i / n, t1 = (i + 1) / n;
    const x1 = tip[0] + (root[0] - tip[0]) * t1, y1 = tip[1] + (root[1] - tip[1]) * t1 + Math.sin(t1 * Math.PI) * 14 * k;
    const mx = tip[0] + (root[0] - tip[0]) * ((t0 + t1) / 2), my = tip[1] + (root[1] - tip[1]) * ((t0 + t1) / 2) + Math.sin(((t0 + t1) / 2) * Math.PI) * 14 * k;
    d += ` Q${r1(mx - 12 * k)} ${r1(my + 12 * k)} ${r1(x1)} ${r1(y1)}`;
  }
  d += 'Z';
  let lines = '';
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const x = tip[0] + (root[0] - tip[0]) * t, y = tip[1] + (root[1] - tip[1]) * t + Math.sin(t * Math.PI) * 14 * k;
    lines += `M${r1(x)} ${r1(y)} L${r1(x * 0.55)} ${r1(y * 0.55)} `;
  }
  return `<path d="${d}" fill="${grad(col)}" ${ol(C.o, 2.4)}/><path d="${lines}" stroke="${shade(col, -0.25)}" stroke-width="1.4" fill="none"/>`;
}

function wingShape(C, type, col) {
  const f = grad(col);
  const o = ol(C.o, 2.4);
  const dk = shade(col, -0.35);
  switch (type) {
    case 'feather':
    case 'angel': {
      const fc = type === 'angel' ? '#fbfdff' : col;
      return featherWing(C, fc, 1) + featherWing(C, shade(fc, 0.25), 0.62);
    }
    case 'leaf': if (adultNow) {
      // Leaf membrane: a green bat-style wing with leaf veins and leaf tips at each point.
      const tips = [[-72, -68, -40], [-50, -36, -20], [-30, -18, 0], [-12, 2, 20]];
      return `<path d="M0 4 C-6 -30 -34 -62 -72 -68 Q-62 -54 -66 -44 Q-56 -46 -50 -36 Q-46 -42 -38 -40 Q-40 -26 -30 -18 Q-26 -24 -18 -22 Q-20 -8 -12 2Z" fill="${grad('#3f9f45')}" ${o}/>` +
        `<path d="M-2 0 L-70 -66 M-4 -2 L-50 -36 M-6 -2 L-30 -18 M-24 -22 l-6 -12 M-40 -38 l-4 -12 M-36 -32 l-10 2" stroke="#1f5a26" stroke-width="1.8" fill="none"/>` +
        tips.map(([x, y, r]) => `<g ${at(x, y, r - 90, 0.55)}>${leaf(C, 1, '#7be06b')}</g>`).join('');
    }
      return `<g transform="rotate(-20)"><path d="M0 0 C-20 -10 -60 -20 -78 -50 C-50 -54 -16 -40 0 0Z" fill="${grad('#4fd65c')}" ${o}/><path d="M0 0 Q-40 -26 -74 -48" fill="none" stroke="#257a2e" stroke-width="1.8"/></g><g transform="rotate(15)"><path d="M0 0 C-16 -6 -50 -10 -66 -32 C-40 -38 -12 -28 0 0Z" fill="${grad('#7be06b')}" ${o}/><path d="M0 0 Q-34 -16 -62 -30" fill="none" stroke="#257a2e" stroke-width="1.6"/></g>`;
    case 'fin':
      return `<path d="M0 2 L-24 -58 Q-46 -50 -62 -30 Q-50 -26 -66 -10 Q-46 -6 -56 10 Q-30 10 0 2Z" fill="${f}" ${o}/><path d="M0 2 L-26 -52 M0 2 L-52 -28 M0 2 L-56 -8 M0 2 L-46 10" stroke="${dk}" stroke-width="1.6"/>`;
    case 'crystal':
      return `<path d="M0 0 L-22 -66 L-34 -28Z" fill="${grad('#d7f6ff')}" ${o}/><path d="M0 0 L-58 -56 L-50 -16Z" fill="${grad('#aee7ff')}" ${o}/><path d="M0 0 L-72 -20 L-44 4Z" fill="${grad('#c8f1ff')}" ${o}/><path d="M-22 -60 L-24 -30 M-54 -50 L-46 -18" stroke="#fff" stroke-width="1.4"/>`;
    case 'butterfly': if (adultNow) {
      // Long dragonfly wings with a vein network and dark ringed eye-spots.
      const blade = (rot, len, k) => `<g transform="rotate(${rot})"><path d="M0 0 C-${len * 0.3} -14 -${len * 0.8} -16 -${len} -4 C-${len * 0.8} 6 -${len * 0.3} 8 0 0Z" fill="${grad(col)}" fill-opacity=".85" ${o}/><path d="M0 0 L-${len - 6} -4 M-${len * 0.25} -1 l-8 -8 M-${len * 0.45} -2 l-8 -9 M-${len * 0.65} -3 l-7 -8 M-${len * 0.35} -1 l-6 7 M-${len * 0.55} -2 l-6 7" stroke="${shade(col, -0.45)}" stroke-width="1.1" fill="none"/><circle cx="-${len * 0.72}" cy="-5" r="${5 * k}" fill="${C.o}"/><circle cx="-${len * 0.72}" cy="-5" r="${2.6 * k}" fill="${C.accent}"/></g>`;
      return blade(48, 92, 1) + blade(20, 80, 0.85);
    }
      return `<path d="M0 0 C-10 -40 -50 -78 -78 -60 C-90 -40 -62 -16 0 0Z" fill="${f}" ${o}/><circle cx="-52" cy="-46" r="9" fill="${C.accent}" ${ol(C.o, 1.5)}/><circle cx="-52" cy="-46" r="4" fill="#fff" opacity=".8"/><path d="M0 0 C-30 -4 -60 6 -58 26 C-40 34 -14 18 0 0Z" fill="${grad(shade(col, 0.2))}" ${o}/><circle cx="-40" cy="16" r="5" fill="${C.accent}" opacity=".9"/>`;
    case 'mech': if (adultNow) {
      // Riveted metal finger-bones with a translucent membrane between them.
      const bones = [[-74, -64], [-82, -32], [-64, -4]];
      const mem = `M2 4 L${bones[0][0]} ${bones[0][1]} Q-58 -40 ${bones[1][0]} ${bones[1][1]} Q-62 -16 ${bones[2][0]} ${bones[2][1]} Q-30 0 2 4Z`;
      return `<path d="${mem}" fill="${C.accent}" fill-opacity=".45" ${o}/>` + bones.map(([x, y]) => `<path d="M0 0 L${x} ${y}" stroke="${C.o}" stroke-width="8" stroke-linecap="round"/><path d="M0 0 L${x} ${y}" stroke="${C.metalCol}" stroke-width="4.5" stroke-linecap="round"/>${[0.35, 0.65].map((t) => `<circle cx="${x * t}" cy="${y * t}" r="2.4" fill="${shade(C.metalCol, -0.45)}"/>`).join('')}`).join('') + `<circle r="7" fill="${grad(C.metalCol)}" ${ol(C.o, 2)}/>`;
    }
      return `<path d="M0 0 L-16 -56 L-24 -54 L-10 2Z" fill="${grad(C.metalCol)}" ${o}/><path d="M-14 -50 L-70 -58 L-64 -48 L-16 -40Z" fill="${grad(C.metalCol)}" ${o}/><path d="M-12 -42 L-62 -30 L-58 -20 L-10 -30Z" fill="${grad(shade(C.metalCol, -0.1))}" ${o}/><path d="M-8 -26 L-52 -6 L-46 2 L-4 -16Z" fill="${grad(shade(C.metalCol, -0.2))}" ${o}/><circle cx="-14" cy="-48" r="2.4" fill="${C.accent}"/><circle cx="-11" cy="-32" r="2.4" fill="${C.accent}"/>`;
    case 'tattered':
      return `<path d="M0 4 C-8 -28 -36 -62 -70 -70 L-62 -50 L-74 -44 L-56 -36 L-60 -24 L-42 -22 L-44 -8 L-26 -10 L-20 4Z" fill="${f}" ${o}/><path d="M0 4 L-66 -64 M-4 0 L-56 -34 M-6 2 L-40 -14" stroke="${dk}" stroke-width="2.2"/><circle cx="-40" cy="-38" r="3.5" fill="${C.o}" opacity=".7"/>`;
    case 'flame':
      return `<path d="M0 4 C-10 -30 -30 -56 -60 -70 C-50 -56 -56 -48 -44 -40 C-62 -42 -70 -30 -74 -22 C-58 -26 -52 -16 -48 -10 C-60 -6 -62 2 -58 10 C-40 2 -20 6 0 4Z" fill="${grad('#ffb02e')}" ${o}/><path d="M-6 -2 C-14 -24 -28 -40 -46 -50 C-40 -36 -44 -28 -34 -22 C-44 -18 -46 -10 -40 -4 C-26 -6 -16 -2 -6 -2Z" fill="#fff0a0" opacity=".85"/>`;
    case 'cloud': if (adultNow) {
      // Storm membrane: slate bat wing with lightning running along the bones and a cloudy trailing edge.
      const slate = '#4a5468';
      return `<path d="M0 4 C-6 -30 -34 -62 -76 -70 Q-64 -54 -68 -42 Q-56 -44 -50 -32 Q-44 -38 -36 -34 Q-38 -20 -28 -14 Q-22 -20 -14 -16 Q-16 -6 -8 4Z" fill="${grad(slate)}" ${o}/>` +
        `<path d="M-2 0 L-24 -26 L-20 -30 L-48 -50 L-44 -54 L-74 -68 M-4 -2 L-26 -18 L-24 -22 L-50 -34" fill="none" stroke="#ffe14d" stroke-width="2.4" stroke-linejoin="round"/>` +
        [[-60, -40, 0.7], [-36, -24, 0.6], [-16, -8, 0.55]].map(([x, y, k]) => `<g transform="translate(${x} ${y + 6}) scale(${k})">${cloudPuff(C, 1, '#c9d3e0')}</g>`).join('');
    }
      return `<g transform="translate(-30 -34)">${cloudPuff(C, 2.4, '#eef4fb')}</g><path d="M-18 -20 L-28 -2 L-22 -2 L-28 12 L-14 -6 L-20 -6 L-14 -20Z" fill="#ffe14d" ${ol(C.o, 1.5)}/>`;
    default: // bat
      return `<path d="M0 4 C-6 -30 -34 -62 -72 -68 Q-62 -54 -66 -44 Q-56 -46 -50 -36 Q-46 -42 -38 -40 Q-40 -26 -30 -18 Q-26 -24 -18 -22 Q-20 -8 -12 2Z" fill="${f}" ${o}/><path d="M-2 0 L-70 -66 M-4 -2 L-50 -36 M-6 -2 L-30 -18" stroke="${dk}" stroke-width="2"/><circle cx="-72" cy="-68" r="3" fill="${C.horn}" ${ol(C.o, 1.2)}/>`;
  }
}

// ---------------------------------------------------------------- tail tips (point along +x)

function tailTip(C, type) {
  const o = ol(C.o, 1.8);
  switch (type) {
    case 'flame': return `<g transform="rotate(90)">${flame(C, 1.15)}</g>`;
    case 'leaf': return `<g transform="rotate(90)">${leaf(C, 1.1, C.leafCol)}</g>`;
    case 'fin': return `<path d="M-4 0 L16 -18 Q10 0 16 18Z" fill="${grad(C.wing)}" ${o}/><path d="M-2 0 L12 -12 M-2 0 L12 12" stroke="${shade(C.wing, -0.35)}" stroke-width="1.3"/>`;
    case 'club': return `<circle cx="6" cy="0" r="10" fill="${grad(C.rockCol)}" ${o}/><path d="M6 -10 l-3 -6 l6 1Z M16 0 l6 -3 l-1 6Z M6 10 l-3 6 l6 -1Z" fill="${C.horn}" ${ol(C.o, 1.2)}/>`;
    case 'blade': return `<path d="M-4 -4 L24 -2 L30 0 L24 2 L-4 4Z" fill="${grad('#e6e9ee')}" ${o}/><rect x="-6" y="-8" width="5" height="16" rx="2" fill="${C.accent}" ${ol(C.o, 1.4)}/>`;
    case 'crystal': return `<g transform="rotate(90)">${shard(C, 1.15, '#c8f1ff')}</g>`;
    case 'wisp': return `<path d="M-2 0 Q10 -14 22 -6 Q12 -4 16 4 Q8 2 -2 6Z" fill="${C.smokeCol}" opacity=".9"/><circle cx="18" cy="-8" r="3" fill="${C.glow}"/>`;
    case 'spade': return `<path d="M-4 0 L6 -12 L24 0 L6 12Z" fill="${grad(C.accent)}" ${o}/>`;
    case 'bolt': return `<g transform="rotate(90)">${bolt(C, 1.1)}</g>`;
    case 'star': return `<g transform="translate(8 0)">${star(C, 1, '#fff07a')}</g>`;
    case 'gem': return `<path d="M-2 0 L8 -10 L20 0 L8 10Z" fill="${grad(C.accent)}" ${o}/><path d="M8 -10 L8 10 M-2 0 L20 0" stroke="#fff" stroke-opacity=".6" stroke-width="1.2"/>`;
    case 'plume': return [[-25, 1], [0, 1.15], [25, 1]].map(([r, s]) => `<g transform="rotate(${90 + r}) translate(0 2)">${feather(C, s, C.accent)}</g>`).join('');
    case 'bulb': return `<path d="M0 0 Q10 -14 18 -10" fill="none" stroke="${C.o}" stroke-width="2.4"/><circle cx="20" cy="-10" r="12" fill="${glowGrad(C.glow)}"/><circle cx="20" cy="-10" r="5.5" fill="${C.glow}" ${ol(C.o, 1.3)}/>`;
    case 'anchor': return `<path d="M0 0 L16 0 M16 -10 L16 10 M10 -14 Q26 -14 26 0 Q26 14 10 14" fill="none" stroke="${C.o}" stroke-width="6" stroke-linecap="round"/><path d="M0 0 L16 0 M16 -10 L16 10 M10 -14 Q26 -14 26 0 Q26 14 10 14" fill="none" stroke="${C.metalCol}" stroke-width="3" stroke-linecap="round"/>`;
    case 'gear': return `<g transform="translate(10 0)">${gear(C, 0.8, C.metalCol)}</g>`;
    default: return '';
  }
}

// ---------------------------------------------------------------- back crests along the spine

function backItem(C, type, i) {
  switch (type) {
    case 'spikes': return spike(C, 1, C.accent);
    case 'plates': return plate(C, 1.1, C.accent);
    case 'leaves': return leaf(C, 0.9, i % 2 ? C.leafCol : shade(C.leafCol, 0.2));
    case 'flames': return flame(C, 0.85);
    case 'crystals': return shard(C, 0.85, i % 2 ? '#c8f1ff' : '#e6faff');
    case 'rocks': return rock(C, 0.95, C.rockCol);
    case 'gears': return `<g transform="translate(0 -6)">${gear(C, 0.6, C.metalCol)}</g>`;
    case 'thorns': return `<path d="M-5 4 Q-2 -8 6 -16 Q2 -6 5 4Z" fill="${grad('#3f8f3a')}" ${ol(C.o, 1.5)}/>`;
    case 'mane': return tuft(C, 0.85, C.accent);
    case 'bolts': return bolt(C, 0.7);
    case 'feathers': return feather(C, 0.75, C.accent);
    case 'fins': return `<path d="M-8 4 Q-4 -14 6 -20 Q4 -6 8 4Z" fill="${grad(C.wing)}" ${ol(C.o, 1.5)}/>`;
    default: return '';
  }
}

// ---------------------------------------------------------------- markings

function markings(C, type, spots, col) {
  const dk = col || shade(C.main, -0.3);
  return spots.map(([x, y, s = 1], i) => {
    const g = (inner) => `<g ${at(x, y, (i * 37) % 60 - 30, s)}>${inner}</g>`;
    switch (type) {
      case 'spots': return g(`<circle r="${5 - (i % 2) * 1.5}" fill="${dk}" opacity=".45"/>`);
      case 'stripes': return g(`<path d="M-7 -3 Q0 3 7 -3" fill="none" stroke="${dk}" stroke-width="3.5" stroke-linecap="round" opacity=".55"/>`);
      case 'lava': return g(`<path d="M-8 -4 L-2 0 L-4 6 M-2 0 L6 -2 L9 4" fill="none" stroke="#ff5a1a" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M-8 -4 L-2 0 L-4 6 M-2 0 L6 -2 L9 4" fill="none" stroke="#ffe066" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`);
      case 'runes': return g(`<circle r="6" fill="${glowGrad(C.glow)}"/><path d="M-3 -5 L3 -5 L0 0 L3 5 L-3 5 M0 0 L-4 0" fill="none" stroke="${C.glow}" stroke-width="1.8" stroke-linecap="round"/>`);
      case 'stars': return g(sparkle(0.5, '#fffbe0'));
      case 'scales': return g(`<path d="M-6 0 Q-3 4 0 0 Q3 4 6 0 M-3 -5 Q0 -1 3 -5" fill="none" stroke="${dk}" stroke-width="1.6" opacity=".6"/>`);
      case 'circuit': return g(`<path d="M-8 0 L-2 0 L2 -5 L8 -5" fill="none" stroke="${C.glow}" stroke-width="1.8"/><circle cx="8" cy="-5" r="2" fill="${C.glow}"/><circle cx="-8" cy="0" r="1.6" fill="${C.glow}"/>`);
      case 'gems': return g(`<path d="M0 -6 L5 0 L0 6 L-5 0Z" fill="${C.accent}" ${ol(C.o, 1.2)}/><path d="M-1 -3 L1 -1" stroke="#fff" stroke-width="1"/>`);
      case 'moss': return g(`<path d="M-7 2 Q-6 -5 0 -4 Q4 -9 8 -2 Q10 4 -7 2Z" fill="#3f9f3a" opacity=".85"/>`);
      case 'frost': return g(`<path d="M0 -6 L0 6 M-5 -3 L5 3 M-5 3 L5 -3" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".85"/>`);
      case 'rings': return g(`<circle r="5" fill="none" stroke="${dk}" stroke-width="2" opacity=".5"/>`);
      case 'cracks': return g(`<path d="M-7 -4 L-1 0 L-3 6 M-1 0 L6 -3" fill="none" stroke="${shade(C.main, -0.45)}" stroke-width="1.8" stroke-linecap="round"/>`);
      default: return '';
    }
  }).join('');
}

// ---------------------------------------------------------------- body plans

// Each plan returns the shapes for the body silhouette plus anchors where parts attach.
const PLANS = {
  classic(C) {
    // Proud sitting pose: deep chest, muscular haunch, tapering neck and tail.
    const f = grad(C.main), d = grad(shade(C.main, -0.18)), dk = shade(C.main, -0.18);
    const tail = tube([{ p: [[66, 162], [30, 184], [6, 160], [16, 124]], r: [14, 3] }]);
    return {
      tail,
      far: sil([{ k: 'c', c: tube([{ p: [[106, 146], [107, 158], [108, 168], [110, 179]], r: [8, 6] }], 5), f: dk, hl: false }, { k: 'e', cx: 113, cy: 182, rx: 10, ry: 4.5, f: d }], C.o),
      body: [{ k: 'c', c: tail, f: C.main }, { k: 'e', cx: 80, cy: 152, rx: 26, ry: 24, f }, { k: 'e', cx: 110, cy: 124, rx: 30, ry: 36, rot: -12, f },
        { k: 'c', c: tube([{ p: [[114, 100], [122, 86], [132, 74], [144, 64]], r: [17, 10] }], 8), f: C.main, hl: false }],
      front: sil([{ k: 'c', c: tube([{ p: [[120, 138], [124, 150], [126, 160], [126, 170]], r: [11, 8] }], 5), f: C.main, hl: false },
        { k: 'c', c: tube([{ p: [[126, 168], [126, 173], [127, 177], [128, 180]], r: [7, 6] }], 3), f: C.main, hl: false },
        { k: 'e', cx: 90, cy: 181, rx: 19, ry: 6, f }, { k: 'e', cx: 131, cy: 182, rx: 11, ry: 5, f }], C.o) +
        `<path d="M66 140 Q78 132 92 140 M70 156 Q80 150 90 158" fill="none" stroke="${shade(C.main, -0.3)}" stroke-width="2" stroke-linecap="round" opacity=".6"/>`,
      belly: { k: 'e', cx: 120, cy: 132, rx: 16, ry: 27, rot: -12 },
      band: [[128, 96], [146, 128], [112, 168], 16, 7],
      claws: [[82, 184], [90, 185], [98, 184], [129, 185], [135, 185]],
      heads: [{ x: 150, y: 56, s: 1 }],
      wing: { x: 98, y: 104, s: 1 },
      back: [[70, 132, -60], [80, 114, -40], [94, 100, -25]],
      gloss: [100, 110],
      spots: [[82, 146], [94, 126, 0.8], [74, 160, 0.8]],
    };
  },
  beast(C) {
    // Four-legged: chest and hips with a tucked waist, digitigrade hind legs.
    const f = grad(C.main), d = grad(shade(C.main, -0.2)), dk = shade(C.main, -0.2);
    const tail = tube([{ p: [[52, 114], [22, 110], [6, 90], [14, 60]], r: [13, 3] }]);
    return {
      tail,
      far: sil([
        { k: 'c', c: tube([{ p: [[58, 124], [52, 136], [50, 146], [52, 156]], r: [12, 8] }], 5), f: dk, hl: false },
        { k: 'c', c: tube([{ p: [[52, 156], [56, 166], [56, 174], [54, 180]], r: [7, 5.5] }], 4), f: dk, hl: false },
        { k: 'c', c: tube([{ p: [[126, 128], [128, 146], [130, 164], [132, 180]], r: [10, 6.5] }], 6), f: dk, hl: false },
        { k: 'e', cx: 58, cy: 183, rx: 10, ry: 4.5, f: d }, { k: 'e', cx: 136, cy: 183, rx: 10, ry: 4.5, f: d }], C.o),
      body: [{ k: 'c', c: tail, f: C.main }, { k: 'e', cx: 92, cy: 122, rx: 40, ry: 21, f }, { k: 'e', cx: 66, cy: 118, rx: 25, ry: 23, f }, { k: 'e', cx: 120, cy: 116, rx: 29, ry: 28, f },
        { k: 'c', c: tube([{ p: [[132, 104], [142, 88], [150, 74], [160, 62]], r: [17, 10] }], 8), f: C.main, hl: false }],
      front: sil([
        { k: 'e', cx: 72, cy: 134, rx: 17, ry: 21, rot: 20, f },
        { k: 'c', c: tube([{ p: [[68, 150], [62, 160], [62, 170], [66, 180]], r: [9, 6.5] }], 5), f: C.main, hl: false },
        { k: 'c', c: tube([{ p: [[114, 128], [116, 146], [116, 164], [114, 180]], r: [12, 7.5] }], 6), f: C.main, hl: false },
        { k: 'e', cx: 72, cy: 183, rx: 12, ry: 5, f }, { k: 'e', cx: 118, cy: 183, rx: 12, ry: 5, f }], C.o) +
        `<path d="M108 108 Q120 100 132 110 M60 108 Q70 102 80 110" fill="none" stroke="${shade(C.main, -0.3)}" stroke-width="2" stroke-linecap="round" opacity=".55"/>`,
      belly: { k: 'e', cx: 104, cy: 134, rx: 28, ry: 9 },
      claws: [[76, 185], [82, 186], [120, 185], [126, 186]],
      heads: [{ x: 166, y: 54, s: 0.95 }],
      wing: { x: 100, y: 100, s: 0.95 },
      back: [[52, 102, -25], [70, 95, -8], [90, 99, 4], [110, 90, -5], [128, 86, -22]],
      gloss: [112, 102],
      spots: [[66, 112], [92, 114], [118, 110, 0.8], [56, 126, 0.8]],
    };
  },
  wyvern(C) {
    const f = grad(C.main);
    const tail = tube([{ p: [[86, 158], [56, 184], [20, 180], [6, 152]], r: [14, 3] }]);
    return {
      tail,
      far: sil([{ k: 'c', c: tube([{ p: [[112, 118], [122, 126], [128, 132], [134, 138]], r: [6, 5] }], 4), f: shade(C.main, -0.2), hl: false }], C.o),
      body: [{ k: 'c', c: tail, f: C.main }, { k: 'p', d: 'M78 152 Q64 118 84 96 Q102 80 122 92 Q134 108 126 132 Q118 152 100 160Z', f }, { k: 'c', c: tube([{ p: [[108, 94], [112, 80], [118, 70], [124, 62]], r: [16, 10] }], 7), f: C.main, hl: false }, { k: 'e', cx: 86, cy: 160, rx: 17, ry: 19, rot: 15, f }],
      front: sil([{ k: 'e', cx: 116, cy: 162, rx: 14, ry: 17, f }, { k: 'e', cx: 84, cy: 181, rx: 15, ry: 6.5, f }, { k: 'e', cx: 121, cy: 182, rx: 13, ry: 6, f }, { k: 'c', c: tube([{ p: [[116, 112], [124, 120], [130, 128], [136, 134]], r: [7, 5.5] }], 4), f: C.main, hl: false }], C.o),
      belly: { k: 'e', cx: 109, cy: 128, rx: 14, ry: 28, rot: 10 },
      band: [[118, 96], [134, 124], [106, 156], 15, 7],
      claws: [[76, 185], [84, 186], [92, 185], [116, 186], [124, 186], [137, 136]],
      heads: [{ x: 130, y: 52, s: 0.92 }],
      wing: { x: 92, y: 96, s: 1.18 },
      back: [[80, 96, -40], [74, 112, -70], [74, 128, -90]],
      gloss: [92, 104],
      spots: [[88, 114], [86, 134, 0.8], [96, 100, 0.7]],
    };
  },
  serpent(C, spec) {
    // Three poses so serpents don't all share one S-curve.
    const POSES = {
      1: { segs: [{ p: [[18, 140], [30, 190], [86, 192], [98, 150]], r: [5, 15] }, { p: [[98, 150], [106, 116], [146, 128], [150, 84]], r: [15, 15] }], head: [154, 70] },
      2: { segs: [{ p: [[36, 112], [6, 140], [40, 186], [86, 172]], r: [5, 14] }, { p: [[86, 172], [134, 158], [148, 124], [120, 112]], r: [14, 15] }, { p: [[120, 112], [96, 98], [116, 76], [146, 76]], r: [15, 15] }], head: [152, 66] },
      3: { segs: [{ p: [[12, 178], [58, 198], [100, 188], [110, 156]], r: [5, 14] }, { p: [[110, 156], [120, 126], [98, 102], [122, 78]], r: [14, 15] }], head: [130, 62] },
    };
    const pose = POSES[spec.curve] || POSES[1];
    const body = tube(pose.segs, 14);
    const pt = (f) => body[Math.round((body.length - 1) * f)];
    const belly = body.filter((_, i) => i > 4 && i < body.length - 3).map((c, i, a) => {
      const n = a[Math.min(i + 1, a.length - 1)], p = a[Math.max(i - 1, 0)];
      const ang = Math.atan2(n.y - p.y, n.x - p.x);
      return { x: c.x - Math.sin(ang) * -c.r * 0.45, y: c.y + Math.cos(ang) * c.r * 0.45, r: c.r * 0.5 };
    });
    const back = [];
    for (const f of [0.3, 0.45, 0.6, 0.75]) {
      const i = Math.round((body.length - 2) * f);
      const c = body[i], n = body[i + 1];
      const ang = Math.atan2(n.y - c.y, n.x - c.x);
      back.push([c.x + Math.sin(ang) * c.r * 0.8, c.y - Math.cos(ang) * c.r * 0.8, (ang * 180) / Math.PI]);
    }
    const leg = (c, dx) => tube([{ p: [[c.x, c.y + 6], [c.x + dx * 0.3, c.y + 12], [c.x + dx * 0.6, c.y + 16], [c.x + dx, c.y + 20]], r: [6, 5] }], 3);
    const l1 = pt(0.32), l2 = pt(0.8), w = pt(0.62);
    return {
      tail: body,
      floats: true,
      far: sil([{ k: 'c', c: leg(l1, -4), f: shade(C.main, -0.2), hl: false }], C.o),
      body: [{ k: 'c', c: body, f: C.main }],
      front: sil([{ k: 'c', c: leg(l2, 8), f: C.main, hl: false }], C.o),
      bellyChain: belly,
      claws: [[l1.x - 4, l1.y + 26], [l2.x + 8, l2.y + 26]],
      heads: [{ x: pose.head[0], y: pose.head[1], s: 0.95 }],
      wing: { x: w.x, y: w.y - 4, s: 0.85 },
      back,
      spots: [pt(0.25), pt(0.5), pt(0.72)].map((c, i) => [c.x, c.y, 0.8 + (i % 2) * 0.1]),
      gloss: [pt(0.55).x - 4, pt(0.55).y - 8],
    };
  },
  golem(C) {
    // Hunched rock titan: angular shoulders, armour plates, spiked fists.
    const f = grad(C.main), d = grad(shade(C.main, -0.18)), plate = grad(shade(C.main, 0.12));
    const fistSpikes = (x, y) => [[0, -14], [12, -6], [14, 8]].map(([dx, dy]) => `<g ${at(x + dx, y + dy, Math.atan2(dy, dx) * 57.3 + 90, 0.55)}>${spike(C, 1, C.horn)}</g>`).join('');
    return {
      tail: tube([{ p: [[66, 156], [48, 168], [36, 172], [24, 168]], r: [11, 4] }], 6),
      far: sil([{ k: 'c', c: tube([{ p: [[60, 108], [50, 128], [44, 144], [40, 156]], r: [15, 12] }], 6), f: shade(C.main, -0.18), hl: false }, { k: 'e', cx: 38, cy: 164, rx: 15, ry: 14, f: d }], C.o) + fistSpikes(36, 162),
      body: [{ k: 'p', d: 'M52 120 L60 96 Q80 74 106 80 Q134 74 150 98 L154 122 Q158 148 134 168 L70 168 Q46 148 52 120Z', f }, { k: 'e', cx: 82, cy: 172, rx: 17, ry: 12, f }, { k: 'e', cx: 120, cy: 172, rx: 17, ry: 12, f }],
      front: sil([{ k: 'c', c: tube([{ p: [[140, 106], [148, 126], [152, 142], [156, 154]], r: [16, 13] }], 6), f: C.main, hl: false }, { k: 'e', cx: 158, cy: 162, rx: 16, ry: 15, f }], C.o) + fistSpikes(158, 160) +
        sil([{ k: 'p', d: 'M126 88 L150 92 L156 112 L136 116Z', f: plate }, { k: 'p', d: 'M60 98 L80 86 L86 104 L64 112Z', f: plate }], C.o, 2) +
        `<path d="M66 128 L76 140 L70 152 M138 128 L130 142" fill="none" stroke="${shade(C.main, -0.35)}" stroke-width="2" stroke-linecap="round"/>`,
      belly: { k: 'p', d: 'M82 114 L104 106 L126 114 L124 150 L104 158 L84 150Z' },
      claws: [[74, 182], [82, 184], [90, 182], [114, 182], [122, 184], [130, 182]],
      heads: [{ x: 116, y: 84, s: 0.78 }],
      wing: { x: 82, y: 98, s: 0.8 },
      back: [[58, 104, -45], [70, 90, -30], [86, 82, -12]],
      gloss: [96, 96],
      spots: [[70, 128], [72, 152, 0.8], [134, 140, 0.8], [100, 96, 0.8]],
    };
  },
  sea(C) {
    const body = tube([{ p: [[24, 116], [44, 172], [120, 172], [146, 102]], r: [7, 26] }], 16).map((c, i, a) => ({ ...c, r: c.r * (i > a.length * 0.7 ? 0.92 : 1) }));
    return {
      tail: body,
      floats: true,
      far: `<g ${at(70, 150, 200, 0.6)}>${wingShape(C, 'fin', shade(C.wing, -0.15))}</g>` +
        `<path d="M56 140 Q70 100 96 118 Q112 92 132 106 L128 124 Q100 136 62 146Z" fill="${grad(C.wing)}" fill-opacity=".9" ${ol(C.o, 2)}/><path d="M64 140 L70 112 M80 134 L90 112 M98 130 L110 104 M114 124 L124 106" stroke="${shade(C.wing, -0.4)}" stroke-width="1.6"/>`,
      body: [{ k: 'c', c: body, f: C.main }],
      front: `<g ${at(110, 150, 170, 0.62)}>${wingShape(C, 'fin', C.wing)}</g>`,
      bellyChain: body.filter((_, i) => i > 3 && i < 15).map((c) => ({ x: c.x, y: c.y + c.r * 0.45, r: c.r * 0.48 })),
      claws: [],
      heads: [{ x: 152, y: 88, s: 0.92 }],
      wing: { x: 100, y: 130, s: 0.95 },
      back: [[64, 138, -40], [84, 140, -10], [104, 136, 10], [122, 124, 30]],
      gloss: [108, 136],
      spots: [[70, 152, 0.8], [100, 150], [126, 128, 0.8]],
      tailFin: true,
    };
  },
  bird(C) {
    // Raptor-phoenix: teardrop body, S-curved neck, long legs with talons, sweeping tail plume.
    const f = grad(C.main);
    const leg = (pts) => `<path d="${pts}" fill="none" stroke="${C.o}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/><path d="${pts}" fill="none" stroke="${C.beakCol}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`;
    const talons = (x, y) => `<path d="M${x} ${y} l10 2 M${x} ${y} l8 6 M${x} ${y} l-7 3" stroke="${C.o}" stroke-width="4" stroke-linecap="round"/><path d="M${x + 10} ${y + 2} q3 1 2 5 M${x + 8} ${y + 6} q2 2 0 5 M${x - 7} ${y + 3} q-2 2 -1 5" stroke="#2a2230" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    const tail = tube([{ p: [[66, 132], [44, 142], [28, 150], [14, 150]], r: [11, 4] }], 8);
    return {
      tail,
      plumeAt: [14, 150],
      far: leg('M98 142 L92 162 L98 180') + talons(98, 180),
      body: [{ k: 'c', c: tail, f: C.main }, { k: 'p', d: 'M56 130 Q66 100 102 96 Q132 94 138 116 Q140 138 112 146 Q82 152 56 130Z', f }, { k: 'c', c: tube([{ p: [[122, 104], [134, 90], [128, 76], [140, 62]], r: [13, 8] }], 8), f: C.main, hl: false }],
      front: leg('M112 144 L118 162 L112 180') + talons(112, 180) + sil([{ k: 'e', cx: 112, cy: 138, rx: 14, ry: 11, f }], C.o, 2),
      plume: true,
      belly: { k: 'e', cx: 120, cy: 124, rx: 15, ry: 14 },
      claws: [],
      heads: [{ x: 146, y: 54, s: 0.86 }],
      wing: { x: 100, y: 104, s: 1.15 },
      back: [[80, 100, -30], [96, 96, -10]],
      gloss: [96, 106],
      spots: [[84, 116, 0.8], [76, 132, 0.7], [100, 106, 0.6]],
    };
  },
  sprite(C) {
    const f = grad(C.main);
    const tail = tube([{ p: [[100, 142], [96, 170], [70, 186], [60, 162]], r: [13, 4] }], 12);
    return {
      tail,
      floats: true,
      far: '',
      body: [{ k: 'c', c: tail, f: C.main }, { k: 'e', cx: 102, cy: 128, rx: 26, ry: 25, f }, { k: 'c', c: tube([{ p: [[110, 110], [114, 100], [118, 92], [122, 84]], r: [12, 8] }], 6), f: C.main, hl: false }],
      front: sil([{ k: 'c', c: tube([{ p: [[118, 128], [124, 134], [128, 138], [132, 140]], r: [5.5, 4.5] }], 3), f: C.main, hl: false }], C.o),
      belly: { k: 'e', cx: 110, cy: 134, rx: 13, ry: 16 },
      band: [[116, 110], [128, 130], [110, 150], 12, 6],
      claws: [[134, 142]],
      heads: [{ x: 128, y: 74, s: 1 }],
      wing: { x: 96, y: 114, s: 1.15 },
      back: [[82, 112, -50], [90, 104, -30]],
      gloss: [96, 118],
      spots: [[92, 120, 0.7], [96, 140, 0.7]],
    };
  },
  knight(C) {
    const f = grad(C.main);
    const tail = tube([{ p: [[82, 158], [54, 180], [22, 178], [8, 156]], r: [14, 3] }]);
    const armor = grad(C.metalCol);
    return {
      tail,
      far: '',
      body: [{ k: 'c', c: tail, f: C.main }, { k: 'p', d: 'M72 154 Q58 116 80 94 Q102 78 126 90 Q142 108 132 136 Q122 158 100 164Z', f }, { k: 'c', c: tube([{ p: [[106, 94], [110, 82], [114, 74], [118, 66]], r: [17, 11] }], 6), f: C.main, hl: false }, { k: 'e', cx: 84, cy: 162, rx: 18, ry: 18, f }],
      front: sil([{ k: 'e', cx: 118, cy: 164, rx: 15, ry: 16, f }, { k: 'e', cx: 84, cy: 181, rx: 16, ry: 7, f: armor }, { k: 'e', cx: 122, cy: 182, rx: 14, ry: 6.5, f: armor }], C.o) +
        sil([{ k: 'p', d: 'M84 104 Q108 94 130 104 L128 146 Q108 160 86 146Z', f: armor }], C.o, 2.6) +
        `<path d="M107 100 L107 152 M88 124 Q107 132 128 124" stroke="${shade(C.metalCol, -0.3)}" stroke-width="2" fill="none"/><path d="M98 112 L116 112" stroke="#fff" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/>` +
        sil([{ k: 'e', cx: 82, cy: 100, rx: 16, ry: 12, f: armor }], C.o, 2.6) + `<circle cx="82" cy="100" r="3" fill="${C.accent}"/>`,
      belly: null,
      claws: [[76, 185], [84, 186], [92, 185], [116, 186], [124, 186]],
      heads: [{ x: 124, y: 56, s: 0.92 }],
      wing: { x: 86, y: 96, s: 1.05 },
      back: [[74, 102, -45], [68, 118, -75], [68, 134, -95]],
      gloss: [96, 104],
      spots: [[80, 132, 0.8]],
    };
  },
  wraith(C) {
    // Spectre: hunched torso on a neck, long reaching claws, a body that trails into wisps.
    const f = grad(C.main);
    const arm = (pts, r0) => ({ k: 'c', c: tube([{ p: pts, r: [r0, 3.5] }], 6), f: C.main, hl: false });
    const claw = (x, y) => `<path d="M${x} ${y} q8 2 10 10 M${x} ${y} q10 -2 14 4 M${x} ${y} q4 6 2 14" fill="none" stroke="${C.o}" stroke-width="3.6" stroke-linecap="round"/><path d="M${x} ${y} q8 2 10 10 M${x} ${y} q10 -2 14 4 M${x} ${y} q4 6 2 14" fill="none" stroke="${C.horn}" stroke-width="1.6" stroke-linecap="round"/>`;
    return {
      tail: [],
      floats: true,
      far: sil([arm([[112, 112], [128, 116], [138, 124], [146, 136]], 6)], C.o) + claw(146, 136),
      body: [{ k: 'p', d: 'M72 120 Q72 84 100 78 Q126 76 132 104 Q138 132 122 152 Q108 172 90 178 Q66 186 40 180 Q64 172 74 158 Q60 144 72 120Z', f },
        { k: 'c', c: tube([{ p: [[110, 92], [116, 80], [120, 70], [126, 60]], r: [13, 8] }], 6), f: C.main, hl: false }],
      front: sil([arm([[124, 118], [142, 122], [154, 132], [162, 146]], 7)], C.o) + claw(162, 146),
      belly: null,
      ribs: true,
      claws: [],
      heads: [{ x: 132, y: 52, s: 0.92 }],
      wing: { x: 84, y: 102, s: 1.1 },
      back: [[70, 106, -50], [82, 92, -30]],
      gloss: [92, 98],
      spots: [[82, 126, 0.8], [96, 156, 0.8], [118, 146, 0.7]],
      smokeTail: [40, 180],
    };
  },
  hydra(C) {
    const f = grad(C.main), d = grad(shade(C.main, -0.15));
    const tail = tube([{ p: [[66, 150], [34, 176], [10, 152], [22, 116]], r: [14, 4.5] }]);
    return {
      tail,
      far: sil([{ k: 'e', cx: 132, cy: 172, rx: 11, ry: 9, f: d }], C.o),
      body: [{ k: 'c', c: tail, f: C.main }, { k: 'e', cx: 76, cy: 160, rx: 20, ry: 18, f }, { k: 'p', d: 'M66 156 Q56 124 82 106 Q106 94 126 110 Q140 128 130 152 Q120 170 96 170Z', f },
        { k: 'c', c: tube([{ p: [[96, 108], [92, 84], [80, 62], [76, 44]], r: [14, 8] }], 9), f: C.main, hl: false },
        { k: 'c', c: tube([{ p: [[114, 110], [128, 88], [140, 70], [152, 56]], r: [15, 9] }], 9), f: C.main, hl: false }],
      front: sil([{ k: 'c', c: tube([{ p: [[120, 150], [122, 160], [124, 168], [126, 176]], r: [10, 9] }], 4), f: C.main, hl: false }, { k: 'e', cx: 80, cy: 178, rx: 17, ry: 7.5, f }, { k: 'e', cx: 130, cy: 180, rx: 12, ry: 6, f }], C.o),
      belly: { k: 'e', cx: 112, cy: 142, rx: 16, ry: 22 },
      band: [[124, 108], [140, 138], [112, 168], 15, 7],
      claws: [[70, 182], [78, 184], [86, 182], [126, 184], [133, 184]],
      heads: [{ x: 80, y: 38, s: 0.72 }, { x: 158, y: 48, s: 0.84 }],
      wing: { x: 90, y: 112, s: 0.95 },
      back: [[64, 120, -50], [72, 108, -35]],
      spots: [[78, 126], [70, 144, 0.8]],
    };
  },
  crystal(C) {
    const f = grad(C.main);
    return {
      tail: tube([{ p: [[60, 146], [40, 156], [24, 146], [18, 124]], r: [11, 4] }], 8),
      far: sil([{ k: 'p', d: 'M124 150 L130 176 L142 178 L136 150Z', f: grad(shade(C.main, -0.2)) }], C.o),
      body: [{ k: 'p', d: 'M54 142 L66 108 L102 92 L140 106 L150 142 L126 166 L72 166Z', f }, { k: 'p', d: 'M66 160 L62 180 L84 180 L86 160Z', f }],
      front: sil([{ k: 'p', d: 'M108 158 L104 182 L124 182 L126 158Z', f }, { k: 'p', d: 'M126 120 L132 98 L150 78 L158 92 L144 116Z', f }], C.o) +
        `<path d="M66 108 L96 126 L102 92 M96 126 L150 142 M96 126 L72 166 M96 126 L126 166" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1.6"/>`,
      belly: null,
      claws: [[66, 183], [76, 184], [108, 185], [118, 185]],
      heads: [{ x: 156, y: 74, s: 0.92 }],
      wing: { x: 92, y: 100, s: 1 },
      back: [[70, 104, -40], [86, 96, -20], [104, 92, 0]],
      gloss: [96, 112],
      spots: [[78, 132, 0.8], [120, 128, 0.8]],
    };
  },
};

// ---------------------------------------------------------------- colours per species

function idHash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

function palette(sp, spec) {
  let els = sp.elements;
  if (els[1] && (els[0] === 'mystic' || els[0] === 'ancient')) els = [els[1], els[0], ...els.slice(2)];
  // About half the hybrids wear their second element as body colour, so e.g. not every Fire hybrid is red.
  else if (sp.rarity === 'rare' && !spec.main && idHash(sp.id) % 2) els = [els[1], els[0]];
  const col = (e) => ELEMENTS[e].color;
  let main = spec.main || col(els[0]);
  if (spec.tone) main = shade(main, spec.tone);
  const second = els[1] ? col(els[1]) : shade(main, -0.22);
  const third = els[2] ? col(els[2]) : els[1] ? shade(second, 0.25) : shade(main, 0.35);
  const has = (e) => sp.elements.includes(e);
  return {
    main,
    o: shade(main, -0.62),
    belly: spec.belly || (els[1] ? mix(second, '#f3e3c0', 0.35) : mix(main, '#f3e3c0', 0.5)),
    wing: spec.wing || second,
    accent: spec.accent || third,
    horn: spec.horn || '#f4e6c4',
    iris: spec.iris || shade(second, -0.25),
    glow: spec.glow || (has('shadow') ? '#c77dff' : has('fire') ? '#ffcf33' : has('ice') ? '#b8f1ff' : '#7dffcf'),
    leafCol: has('plant') ? '#4fd65c' : '#7bd36b',
    rockCol: has('earth') ? '#9b6b43' : has('fire') ? '#5a3a33' : '#8d8f99',
    metalCol: '#b8c2cc',
    smokeCol: has('shadow') ? '#4b2f6e' : '#9aa0aa',
    beakCol: spec.beak || '#ffc44d',
  };
}

// ---------------------------------------------------------------- main renderer

export function dragonColors(species) {
  const { main, wing } = palette(species, designFor(species));
  return { c1: main, c2: wing };
}

// Drawings are pure functions of species + stage, so cache them (the island redraws often).
const cache = new Map();
export function dragonSVG(species, { stage = 'adult', cls = '' } = {}) {
  const key = `${species.id}|${stage}`;
  if (!cache.has(key)) cache.set(key, drawDragon(species, stage));
  return `<svg class="dragon-art ${cls}" viewBox="-24 -22 240 240" xmlns="http://www.w3.org/2000/svg">${cache.get(key)}</svg>`;
}

function drawDragon(species, stage) {
  const rarity = species.rarity;
  const fancy = rarity === 'legendary' || rarity === 'mythic';
  const base = designFor(species);
  // Higher rarities get extra ornament: second wing pair, forehead gem, gold horns.
  const spec = fancy ? { ...base, gem: true, wings2: base.wings2 || (base.wings !== 'none' ? base.wings : undefined) } : base;
  const C = palette(species, spec);
  if (fancy && !base.horn) C.horn = '#ffe08a';
  const baby = stage === 'baby';
  const young = stage === 'young';
  const adult = !baby && !young;
  adultNow = adult;
  // Adults: slightly deeper, less candy-like colours.
  if (adult && !base.main) {
    C.main = mix(C.main, '#2b2238', 0.1);
    C.o = shade(C.main, -0.62);
  }
  const plan = PLANS[spec.body] ? spec.body : 'classic';
  const P = PLANS[plan](C, spec);
  const scale = baby ? 0.7 : young ? 0.86 : 1;
  const wingScale = baby ? 0.42 : young ? 0.72 : 1.2;
  const headBoost = baby ? 1.3 : young ? 1.08 : 0.88;
  lineW = baby ? 3.2 : young ? 2.9 : 2.5;
  // Adults have amber reptile eyes unless the design picks a colour.
  if (adult && !base.iris) C.iris = '#e8a417';
  let s = '';

  // aura
  if (rarity !== 'common' && rarity !== 'rare') {
    const ac = rarity === 'mythic' ? '#ffd54f' : rarity === 'legendary' ? '#ffb74d' : RARITIES.epic.color;
    s += `<circle cx="100" cy="112" r="96" fill="${glowGrad(ac)}"/>`;
  }
  if (rarity === 'mythic' && !baby) {
    const glyphs = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<g transform="rotate(${i * 45}) translate(0 -88)"><path d="M-4 -4 L4 -4 L0 1 L4 5 L-4 5" fill="none" stroke="#ffd54f" stroke-width="2" stroke-linecap="round"/></g>`).join('');
    s += `<g transform="translate(100 118)"><g class="runering"><circle r="88" fill="none" stroke="#ffd54f" stroke-width="2.5" stroke-dasharray="5 9" opacity=".85"/>${glyphs}</g></g>`;
  }
  s += `<ellipse cx="100" cy="${P.floats ? 192 : 186}" rx="${(P.floats ? 40 : 58) * scale}" ry="${P.floats ? 5 : 8}" fill="#000" opacity="${P.floats ? 0.12 : 0.2}"/>`;

  let g = '';
  const wings = spec.wings && spec.wings !== 'none';
  const W = P.wing;
  const wingAt = (dx, dy, extra, col) => `<g ${at(W.x + dx, W.y + dy, extra, W.s * wingScale)}><g class="flap">${wingShape(C, spec.wings, col)}</g></g>`;
  if (wings) g += `<g opacity=".95">${wingAt(-12, 6, adult ? -26 : -14, shade(C.wing, -0.25))}</g>`;
  if (spec.wings2 && !baby) g += `<g ${at(W.x - 4, W.y + 18, 0, W.s * 0.7 * wingScale)}><g class="flap slow">${wingShape(C, spec.wings2, shade(C.wing, -0.1))}</g></g>`;
  if (!baby && spec.back === 'volcano') {
    const [x, y] = P.back[Math.floor(P.back.length / 2)];
    g += `<g ${at(x, y + 4, 0, young ? 0.8 : 1.1)}><path d="M-22 6 L-8 -26 L8 -26 L22 6Z" fill="${grad(C.rockCol)}" ${ol(C.o, 2)}/><path d="M-8 -26 Q0 -20 8 -26 L5 -18 Q0 -14 -5 -18Z" fill="#ff7a1a"/><path d="M-3 -22 Q-6 -8 -12 0 M3 -20 Q8 -8 10 2" stroke="#ff5a1a" stroke-width="2.6" fill="none" stroke-linecap="round"/><g transform="translate(0 -30)"><g class="flick">${flame(C, 1.1)}</g></g></g>`;
  } else if (!baby && spec.back) g += P.back.map(([x, y, r], i) => `<g ${at(x, y, r, young ? 0.8 : 1)}>${backItem(C, spec.back, i)}</g>`).join('');
  if (P.plume) {
    const [px, py] = P.plumeAt || [62, 130];
    g += [[-145, 1.7, C.accent], [-162, 2, shade(C.accent, 0.2)], [-178, 1.6, C.wing], [-192, 1.3, shade(C.wing, 0.2)]].map(([r, sc, col]) => `<g ${at(px, py, r + 90, sc * (baby ? 0.55 : young ? 0.8 : 1))}>${feather(C, 1, col)}</g>`).join('');
  }
  g += P.far;
  g += sil(P.body, C.o);
  // tail tip
  const tl = P.tail;
  if (P.tailFin) {
    const a = tl[1], b = tl[0];
    g += `<g ${at(b.x, b.y, angleOf(a, b), baby ? 0.8 : 1.25)}><g class="sway">${tailTip(C, 'fin')}</g></g>`;
  } else if (tl.length > 1 && spec.tail && spec.tail !== 'none' && !P.plumeAt) {
    const a = tl[tl.length - 2], b = tl[tl.length - 1];
    const first = plan === 'serpent' ? [tl[1], tl[0]] : [a, b];
    g += `<g ${at(first[1].x, first[1].y, angleOf(first[0], first[1]), baby ? 0.7 : 1)}><g class="sway">${tailTip(C, spec.tail)}</g></g>`;
  }
  // Adults: a tapering armoured band from throat to groin instead of a round tummy.
  if (adult && P.band) {
    const [p0, p1, p2, w0, w1] = P.band;
    const n = 9, L = [], R = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, u = 1 - t;
      const x = u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], y = u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1];
      const dx = 2 * u * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]), dy = 2 * u * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
      const len = Math.hypot(dx, dy) || 1, w = (w0 + (w1 - w0) * t) / 2;
      L.push([x - (dy / len) * w, y + (dx / len) * w]);
      R.push([x + (dy / len) * w, y - (dx / len) * w]);
    }
    const pts = [...L, ...R.reverse()].map(([x, y]) => `${r1(x)},${r1(y)}`).join(' ');
    g += `<polygon points="${pts}" fill="${grad(C.belly)}" stroke="${shade(C.belly, -0.35)}" stroke-width="1.2" stroke-linejoin="round"/>`;
    R.reverse();
    for (let i = 1; i < n; i++) g += `<path d="M${r1(L[i][0])} ${r1(L[i][1])} L${r1(R[i][0])} ${r1(R[i][1])}" stroke="${shade(C.belly, -0.35)}" stroke-width="1.6"/>`;
  } else if (P.belly) {
    const b = P.belly;
    const shape = b.k === 'e' ? `<ellipse cx="${b.cx}" cy="${b.cy}" rx="${b.rx}" ry="${b.ry}"${b.rot ? ` transform="rotate(${b.rot} ${b.cx} ${b.cy})"` : ''}` : `<path d="${b.d}"`;
    g += `${shape} fill="${grad(C.belly)}"/>`;
    if (b.k === 'e' && b.ry > 18) {
      const bands = adult ? [-0.66, -0.33, 0, 0.33, 0.66] : [-0.42, 0, 0.42];
      for (const k of bands) {
        const y = b.cy + k * b.ry;
        const w = b.rx * Math.sqrt(1 - k * k) * 0.92;
        g += `<path d="M${r1(b.cx - w)} ${r1(y)} Q${b.cx} ${r1(y + 5)} ${r1(b.cx + w)} ${r1(y)}" fill="none" stroke="${shade(C.belly, -0.3)}" stroke-width="${adult ? 2.2 : 1.8}"${b.rot ? ` transform="rotate(${b.rot} ${b.cx} ${b.cy})"` : ''}/>`;
      }
    }
  }
  if (P.bellyChain) g += P.bellyChain.map((c) => `<circle cx="${r1(c.x)}" cy="${r1(c.y)}" r="${r1(c.r)}" fill="${C.belly}"/>`).join('') +
    P.bellyChain.filter((_, i) => i % 2).map((c) => `<path d="M${r1(c.x - c.r * 0.7)} ${r1(c.y)} q${r1(c.r * 0.7)} ${r1(c.r * 0.4)} ${r1(c.r * 1.4)} 0" fill="none" stroke="${shade(C.belly, -0.2)}" stroke-width="1.4"/>`).join('');
  if (P.ribs) g += `<path d="M92 108 Q104 114 116 106 M90 120 Q104 126 118 118 M92 132 Q104 138 116 130" fill="none" stroke="${shade(C.main, -0.35)}" stroke-width="2.6" stroke-linecap="round"/>`;
  const second = C.wing !== C.main ? C.wing : null;
  if (spec.pattern && !baby) g += markings(C, spec.pattern, P.spots, adult && second && ['spots', 'stripes', 'rings'].includes(spec.pattern) ? shade(second, -0.1) : undefined);
  // Fine scale texture on adults.
  if (adult && spec.pattern !== 'scales') g += `<g opacity=".55">${markings(C, 'scales', P.spots.map(([x, y]) => [x + 9, y + 7, 0.75]))}</g>`;
  if (adult) {
    // Darker spine and a soft rim light along the back instead of a plastic shine.
    const spine = (k) => P.back.map(([x, y, r]) => `${r1(x - Math.sin((r * Math.PI) / 180) * k)},${r1(y + Math.cos((r * Math.PI) / 180) * k)}`).join(' ');
    if (P.back.length > 1) g += `<polyline points="${spine(10)}" fill="none" stroke="${shade(C.main, -0.3)}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" opacity=".28"/><polyline points="${spine(3.5)}" fill="none" stroke="${shade(C.main, 0.4)}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" opacity=".55"/>`;
  } else {
    const [gx, gy] = P.gloss || [88, 112];
    g += `<ellipse cx="${r1(gx)}" cy="${r1(gy)}" rx="13" ry="7" fill="#fff" opacity=".22" transform="rotate(-30 ${r1(gx)} ${r1(gy)})"/>`;
  }
  if (P.smokeTail) g += `<g ${at(P.smokeTail[0], P.smokeTail[1], 180, 1.1)}><g class="sway">${tailTip(C, 'wisp')}</g></g>`;
  if (P.wisps) g += `<path d="M76 176 q6 10 -4 20 q-6 6 -2 12 M96 184 q5 8 -3 16 M112 172 q8 10 2 22 q-3 6 2 10" fill="none" stroke="${C.main}" stroke-width="4.5" stroke-linecap="round" opacity=".5"/>`;
  g += P.front;
  // Adults: scalloped toes ending in dark hooked talons.
  g += P.claws.map(([x, y]) => (adult
    ? `<circle cx="${x - 1}" cy="${y - 3}" r="4.2" fill="${shade(C.main, -0.08)}" ${ol(C.o, 1.4)}/><path d="M${x} ${y - 4} Q${x + 7} ${y - 2} ${x + 7} ${y + 4} Q${x + 3} ${y + 1} ${x} ${y}Z" fill="#2a2230" stroke="#2a2230" stroke-width="1"/><path d="M${x + 5} ${y} l1.5 2.5" stroke="#d8cfc0" stroke-width="1.2"/>`
    : `<circle cx="${x}" cy="${y}" r="2.6" fill="#fff8e8" ${ol(C.o, 1.2)}/>`)).join('');
  if (wings) g += wingAt(0, 0, adult ? -14 : 0, C.wing);
  // heads (back to front)
  P.heads.forEach((h, i) => {
    const hs = h.s * headBoost;
    g += `<g ${at(h.x, h.y + (baby ? 6 : 0), h.rot || 0, hs)}><g class="hbob">${drawHead(C, spec, stage, i)}</g></g>`;
  });
  // rarity extras
  if ((rarity === 'legendary' || rarity === 'mythic') && !baby) {
    g += [[26, 40, 1], [176, 128, 0.8], [36, 172, 0.7], [178, 30, 0.6]].map(([x, y, sc]) => `<g ${at(x, y, 0, sc)}>${sparkle(1)}</g>`).join('');
  }
  if (rarity === 'mythic' && !baby) {
    // A gold diadem of swept-back horn spikes along the brow.
    const h = P.heads[P.heads.length - 1];
    const hs = h.s * headBoost;
    g += `<g ${at(h.x, h.y, 0, hs)}>${[[-16, -14, -70], [-10, -19, -55], [-3, -22, -40], [5, -22, -28], [12, -19, -16]].map(([x, y, r]) => `<g ${at(x, y, r, 0.7)}>${spike(C, 1, '#ffd54f')}</g>`).join('')}<path d="M-6 -22 L-1 -28 L4 -22 L-1 -17Z" fill="#ff5277" ${ol('#7a1030', 1.2)}/></g>`;
  }

  s += `<g transform="translate(100 190) scale(${scale}) translate(-100 -190)">${g}</g>`;
  return s;
}

export function eggSVG(species, cls = '') {
  return `<svg class="egg-art ${cls}" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">${eggInner(species)}</svg>`;
}

// Egg drawing in a 100x120 box, for embedding in other SVGs. The pattern comes from the
// main element; hybrids get a second-colour lower half; high rarities a gold band.
const EGG_SHELL = 'M50 16 C76 16 88 50 88 72 C88 96 72 110 50 110 C28 110 12 96 12 72 C12 50 24 16 50 16Z';
const EGG_PATTERN = {
  fire: (c) => `<path d="M22 96 Q26 74 34 84 Q36 62 46 78 Q50 56 58 76 Q66 60 68 82 Q76 72 78 94" fill="${c}" opacity=".9"/><path d="M36 94 Q40 80 46 88 Q50 76 56 88 Q62 80 64 94" fill="#ffe066" opacity=".9"/>`,
  water: (c) => `<path d="M14 54 Q26 46 38 54 Q50 62 62 54 Q74 46 86 54 M12 76 Q24 68 36 76 Q48 84 60 76 Q72 68 88 76" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round"/><circle cx="34" cy="38" r="4" fill="#fff" opacity=".6"/><circle cx="62" cy="96" r="3" fill="#fff" opacity=".6"/>`,
  plant: (c) => `<path d="M50 104 C30 90 28 60 50 34 C72 60 70 90 50 104Z" fill="${c}" opacity=".85"/><path d="M50 100 L50 40 M50 80 L38 68 M50 66 L62 54 M50 88 L62 78" stroke="#2e7a32" stroke-width="2" fill="none"/>`,
  earth: (c) => `<path d="M26 40 L38 52 L32 66 L44 78 M64 32 L58 50 L70 60 M58 84 L68 96" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"/><circle cx="72" cy="78" r="5" fill="${c}"/><circle cx="30" cy="90" r="4" fill="${c}"/>`,
  storm: (c) => `<path d="M14 64 L30 56 L40 70 L54 54 L64 70 L78 56 L88 64 L88 72 L78 66 L64 80 L54 64 L40 80 L30 66 L14 74Z" fill="${c}"/><path d="M54 28 L44 46 L52 46 L46 60 L62 40 L54 40 L60 28Z" fill="#ffe14d" stroke="#b38f00" stroke-width="1.2"/>`,
  ice: (c) => `<g stroke="${c}" stroke-width="3" stroke-linecap="round" fill="none"><path d="M36 50 L36 70 M27 55 L45 65 M27 65 L45 55"/><path d="M64 74 L64 92 M56 78 L72 88 M56 88 L72 78"/></g><path d="M60 30 L66 40 L60 50 L54 40Z" fill="#fff" opacity=".8"/>`,
  metal: (c) => `<path d="M12 64 L88 64" stroke="${c}" stroke-width="7"/>${[22, 38, 54, 70].map((x) => `<circle cx="${x + 4}" cy="64" r="2.4" fill="#fff" opacity=".8"/>`).join('')}<path d="M30 30 L70 30 M24 92 L76 92" stroke="${c}" stroke-width="3" opacity=".7"/>`,
  shadow: (c) => `<circle cx="58" cy="52" r="14" fill="#e9e1ff"/><circle cx="64" cy="48" r="13" fill="${c}"/>${[[30, 40], [36, 84], [70, 90], [26, 66]].map(([x, y]) => `<path transform="translate(${x} ${y}) scale(.45)" d="M0 -10 Q1 -1 10 0 Q1 1 0 10 Q-1 1 -10 0 Q-1 -1 0 -10Z" fill="#fff"/>`).join('')}`,
  light: (c) => `<circle cx="50" cy="62" r="13" fill="#fff6b0" stroke="${c}" stroke-width="2.5"/>${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<path transform="translate(50 62) rotate(${a})" d="M0 -18 L3 -26 L-3 -26Z" fill="${c}"/>`).join('')}`,
  war: (c) => `<path d="M20 44 L50 58 L80 44 M20 62 L50 76 L80 62 M22 80 L50 94 L78 80" fill="none" stroke="${c}" stroke-width="5" stroke-linejoin="round"/>`,
  mystic: (c) => [[34, 42, 0.9], [64, 56, 1.2], [40, 84, 0.8], [70, 92, 0.6]].map(([x, y, k]) => `<path transform="translate(${x} ${y}) scale(${k})" d="M0 -10 Q1 -1 10 0 Q1 1 0 10 Q-1 1 -10 0 Q-1 -1 0 -10Z" fill="${c}"/>`).join(''),
  ancient: (c) => `<g fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"><path d="M30 46 L40 46 L35 54 L40 62 L30 62"/><path d="M58 70 L70 70 M64 70 L64 84 M58 84 L70 84"/><circle cx="62" cy="44" r="6"/></g>`,
};
export function eggInner(species) {
  const spec = designFor(species);
  const C = palette(species, spec);
  let els = species.elements;
  if (els[1] && (els[0] === 'mystic' || els[0] === 'ancient')) els = [els[1], els[0]];
  const main = C.main;
  const o = shade(main, -0.55);
  const id = 'egg' + species.id;
  const second = els[1] ? ELEMENTS[els[1]].color : null;
  const fancy = species.rarity === 'legendary' || species.rarity === 'mythic';
  return `<defs><clipPath id="${id}"><path d="${EGG_SHELL}"/></clipPath></defs>
  <ellipse cx="50" cy="112" rx="30" ry="5" fill="#000" opacity=".18"/>
  <path d="${EGG_SHELL}" fill="${grad(main)}"/>
  <g clip-path="url(#${id})">
    ${second ? `<path d="M0 82 Q25 70 50 82 Q75 94 100 82 L100 130 L0 130Z" fill="${grad(second)}"/>` : ''}
    ${(EGG_PATTERN[els[0]] || EGG_PATTERN.earth)(shade(main, -0.28))}
    ${fancy ? `<path d="M0 60 L100 60 L100 68 L0 68Z" fill="${grad('#ffd54f')}"/><circle cx="50" cy="64" r="6" fill="${species.rarity === 'mythic' ? '#ff5277' : '#7fd6ff'}" stroke="#7a4a00" stroke-width="1.5"/>` : ''}
  </g>
  <path d="${EGG_SHELL}" fill="none" stroke="${o}" stroke-width="3"/>
  <ellipse cx="34" cy="36" rx="7" ry="12" fill="#fff" opacity=".42" transform="rotate(-20 34 36)"/>`;
}

// Attack projectile drawn from the same motifs as the dragons.
export function projectileSVG(el, big = false) {
  const C = { o: '#5a3a1a', accent: '#ff7ce5', wing: '#7fd6ff', leafCol: '#4fd65c', rockCol: '#9b6b43', metalCol: '#b8c2cc', smokeCol: '#5b4a7a', glow: '#fff35a' };
  const motif = {
    fire: () => flame(C, 1.6),
    water: () => `<path d="M0 -20 C10 -6 14 4 0 14 C-14 4 -10 -6 0 -20Z" fill="${grad('#5fb0ff')}" ${ol('#1d5fbf', 2)}/><ellipse cx="-4" cy="2" rx="3" ry="5" fill="#fff" opacity=".7"/>`,
    plant: () => `<g transform="rotate(30)">${leaf(C, 1.3)}</g><g transform="rotate(-40)">${leaf(C, 1)}</g>`,
    earth: () => rock(C, 1.6),
    storm: () => bolt(C, 1.5),
    ice: () => shard(C, 1.4),
    metal: () => gear(C, 1.1),
    shadow: () => `<circle r="14" fill="${glowGrad('#c77dff')}"/>${smoke(C, 1.6, '#4b2f6e')}`,
    light: () => `<circle r="16" fill="${glowGrad('#fff07a')}"/>${star(C, 1.2)}`,
    war: () => `<g transform="rotate(45)"><path d="M-3 12 L-3 -18 L0 -26 L3 -18 L3 12 Z" fill="#e6e9ee" ${ol('#5c6670', 1.5)}/><rect x="-9" y="6" width="18" height="4" rx="2" fill="#c0392b"/></g>`,
    mystic: () => `<circle r="16" fill="${glowGrad('#ff7ce5')}"/>${sparkle(1.6, '#ffc2f3')}`,
    ancient: () => `<circle r="18" fill="${glowGrad('#ffd54f')}"/>${star(C, 1.1, '#ffd54f')}`,
  }[el] || (() => `${sparkle(2, '#fff')}`);
  return `<svg viewBox="-32 -32 64 64" width="${big ? 74 : 54}" height="${big ? 74 : 54}">${motif()}</svg>`;
}

// Round element medallion (used instead of emoji in chips, attacks and buttons).
export function elementIcon(el, size = 18) {
  const col = el === 'neutral' ? '#9e9e9e' : ELEMENTS[el].color;
  const inner = projectileSVG(el, false).replace(/width="\d+" height="\d+"/, '');
  return `<svg class="el-ico" width="${size}" height="${size}" viewBox="-32 -32 64 64"><circle r="30" fill="${grad(shade(col, -0.25))}" stroke="${shade(col, -0.6)}" stroke-width="3"/><g transform="scale(.95)">${inner.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')}</g></svg>`;
}

export function stageFor(level) {
  return level < 4 ? 'baby' : level < 10 ? 'young' : 'adult';
}
