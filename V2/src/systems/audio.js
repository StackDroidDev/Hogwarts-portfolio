/** ============================================================
 *  audio.js — Synthesized sounds via Web Audio API (no files).
 *  Provides: ambient pad, candle crackle, wand sparkle, chime.
 *  ============================================================ */

let ctx = null;
let masterGain = null;
let _enabled = false;
let _volume = 0.5;
let ambientNodes = null;

function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = _volume;
    masterGain.connect(ctx.destination);
  }
  return ctx;
}

/* ---------- public API ---------- */

export function initAudio(enabled) {
  _enabled = enabled;
  if (enabled) {
    getCtx();
    if (ctx.state === 'suspended') ctx.resume();
  }
}

export function setEnabled(v) {
  _enabled = v;
  if (v) {
    getCtx();
    if (ctx.state === 'suspended') ctx.resume();
    masterGain.gain.setTargetAtTime(_volume, ctx.currentTime, 0.05);
  } else if (masterGain) {
    masterGain.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
  }
}

export function isEnabled() { return _enabled; }

export function setVolume(v) {
  _volume = Math.max(0, Math.min(1, v));
  if (masterGain && _enabled) {
    masterGain.gain.setTargetAtTime(_volume, ctx.currentTime, 0.05);
  }
}

export function getVolume() { return _volume; }

/* ---------- Ambient Pad ---------- */

export function startAmbientPad() {
  if (!_enabled || ambientNodes) return;
  const c = getCtx();
  const gain = c.createGain();
  gain.gain.value = 0;
  gain.connect(masterGain);

  // Soft pad: layered detuned oscillators
  const oscs = [];
  const freqs = [65.41, 98, 130.81, 196]; // C2, G2, C3, G3
  freqs.forEach((f, i) => {
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = f;
    osc.detune.value = (i - 1.5) * 4; // slight detune
    const g = c.createGain();
    g.gain.value = 0.06;
    osc.connect(g);
    g.connect(gain);
    osc.start();
    oscs.push(osc);
  });

  // LFO for gentle movement
  const lfo = c.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 0.15;
  const lfoGain = c.createGain();
  lfoGain.gain.value = 0.02;
  lfo.connect(lfoGain);
  lfoGain.connect(gain.gain);
  lfo.start();

  // Fade in
  gain.gain.setTargetAtTime(0.18, c.currentTime, 1.5);

  ambientNodes = { gain, oscs, lfo, lfoGain };
}

export function stopAmbientPad() {
  if (!ambientNodes) return;
  const c = getCtx();
  ambientNodes.gain.gain.setTargetAtTime(0, c.currentTime, 0.8);
  const nodes = ambientNodes;
  ambientNodes = null;
  setTimeout(() => {
    nodes.oscs.forEach(o => { try { o.stop(); } catch(e){} });
    try { nodes.lfo.stop(); } catch(e){}
  }, 3000);
}

/* ---------- Candle Ambience (crackle noise) ---------- */

let candleNodes = null;

export function startCandleAmbience() {
  if (!_enabled || candleNodes) return;
  const c = getCtx();
  // Brown noise via filtered white noise
  const bufSize = c.sampleRate * 2;
  const buf = c.createBuffer(1, bufSize, c.sampleRate);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < bufSize; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = (last + 0.02 * white) / 1.02;
    last = data[i];
    data[i] *= 3.5;
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 400;
  const gain = c.createGain();
  gain.gain.value = 0;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  src.start();
  gain.gain.setTargetAtTime(0.06, c.currentTime, 1.0);
  candleNodes = { src, filter, gain };
}

export function stopCandleAmbience() {
  if (!candleNodes) return;
  const c = getCtx();
  candleNodes.gain.gain.setTargetAtTime(0, c.currentTime, 0.5);
  const nodes = candleNodes;
  candleNodes = null;
  setTimeout(() => { try { nodes.src.stop(); } catch(e){} }, 2000);
}

/* ---------- One-shot: Wand sparkle ---------- */

export function playSparkle() {
  if (!_enabled) return;
  const c = getCtx();
  const now = c.currentTime;

  // High-pitched short sine blips
  for (let i = 0; i < 3; i++) {
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 2000 + Math.random() * 3000;
    const g = c.createGain();
    g.gain.value = 0;
    g.gain.setValueAtTime(0, now + i * 0.06);
    g.gain.linearRampToValueAtTime(0.08, now + i * 0.06 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.15);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(now + i * 0.06);
    osc.stop(now + i * 0.06 + 0.2);
  }
}

/* ---------- One-shot: Soft chime ---------- */

export function playChime() {
  if (!_enabled) return;
  const c = getCtx();
  const now = c.currentTime;
  const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

  freqs.forEach((f, i) => {
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = f;
    const g = c.createGain();
    g.gain.value = 0;
    const t = now + i * 0.12;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.1, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(t);
    osc.stop(t + 1.0);
  });
}

/* ---------- One-shot: Flash/shimmer ---------- */

export function playFlash() {
  if (!_enabled) return;
  const c = getCtx();
  const now = c.currentTime;
  // Noise burst + pitched ring
  const bufSize = c.sampleRate;
  const buf = c.createBuffer(1, bufSize, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const bpf = c.createBiquadFilter();
  bpf.type = 'bandpass';
  bpf.frequency.value = 3000;
  bpf.Q.value = 2;
  const g = c.createGain();
  g.gain.value = 0;
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.12, now + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
  src.connect(bpf);
  bpf.connect(g);
  g.connect(masterGain);
  src.start(now);
  src.stop(now + 0.8);

  // Pitched ring
  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 1318.5; // E6
  const g2 = c.createGain();
  g2.gain.value = 0;
  g2.gain.setValueAtTime(0, now);
  g2.gain.linearRampToValueAtTime(0.15, now + 0.01);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
  osc.connect(g2);
  g2.connect(masterGain);
  osc.start(now);
  osc.stop(now + 1.5);
}
