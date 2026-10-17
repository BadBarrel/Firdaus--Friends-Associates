// Tiny synthesized sound effects (no audio files). iOS only allows audio after a tap,
// so the context is created on the first touch.
import * as G from './game.js';

let ctx = null;
document.addEventListener('pointerdown', () => {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { /* no audio */ }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
}, { capture: true });

function tone(freq, start, dur, { type = 'sine', vol = 0.18, slide = 0 } = {}) {
  const t = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slide) osc.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function noise(start, dur, vol = 0.2) {
  const t = ctx.currentTime + start;
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = ctx.createBufferSource();
  const gain = ctx.createGain();
  gain.gain.value = vol;
  src.buffer = buf;
  src.connect(gain).connect(ctx.destination);
  src.start(t);
}

const SOUNDS = {
  coin: () => { tone(988, 0, 0.08, { type: 'square', vol: 0.08 }); tone(1319, 0.07, 0.16, { type: 'square', vol: 0.08 }); },
  harvest: () => { tone(523, 0, 0.1, { type: 'triangle' }); tone(784, 0.08, 0.16, { type: 'triangle' }); },
  tap: () => tone(660, 0, 0.05, { type: 'triangle', vol: 0.08 }),
  build: () => { noise(0, 0.08, 0.15); tone(330, 0.05, 0.12, { type: 'triangle' }); tone(440, 0.14, 0.14, { type: 'triangle' }); },
  hatch: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.22, { type: 'triangle' })),
  crack: () => noise(0, 0.06, 0.25),
  level: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.08, 0.3, { type: 'square', vol: 0.07 })),
  breed: () => { tone(587, 0, 0.18, { type: 'sine' }); tone(740, 0.12, 0.25, { type: 'sine' }); },
  hit: () => { noise(0, 0.12, 0.3); tone(180, 0, 0.12, { type: 'sawtooth', vol: 0.1, slide: 0.5 }); },
  strong: () => { noise(0, 0.18, 0.35); tone(240, 0, 0.2, { type: 'sawtooth', vol: 0.14, slide: 0.4 }); },
  win: () => [659, 784, 988, 1319].forEach((f, i) => tone(f, i * 0.12, 0.35, { type: 'triangle' })),
  lose: () => [392, 330, 262].forEach((f, i) => tone(f, i * 0.16, 0.35, { type: 'triangle' })),
};

export function play(name) {
  if (!ctx || !G.S.settings.sound || !SOUNDS[name]) return;
  try {
    SOUNDS[name]();
  } catch (e) { /* ignore */ }
}
