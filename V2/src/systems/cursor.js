/** ============================================================
 *  cursor.js — Glowing wand-tip cursor with spark trail.
 *  Desktop only (hidden on touch devices via CSS).
 *  ============================================================ */

const dot = document.getElementById('cursor-dot');
const glow = document.getElementById('cursor-glow');
const sparkCanvas = document.getElementById('spark-canvas');
const sparkCtx = sparkCanvas ? sparkCanvas.getContext('2d') : null;

let mouseX = -100, mouseY = -100;
let dotX = -100, dotY = -100;
let glowX = -100, glowY = -100;
let sparks = [];
let raf = null;
let active = false;

const isTouchDevice = () => window.matchMedia('(pointer: coarse)').matches;

function resize() {
  if (!sparkCanvas) return;
  sparkCanvas.width = window.innerWidth;
  sparkCanvas.height = window.innerHeight;
}

function onMouseMove(e) {
  mouseX = e.clientX;
  mouseY = e.clientY;
  // Spawn sparks
  if (Math.random() < 0.4) {
    sparks.push({
      x: mouseX,
      y: mouseY,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2 - 1,
      life: 1,
      size: Math.random() * 2.5 + 1,
    });
  }
}

function loop() {
  if (!active) return;
  // Lerp cursor
  dotX += (mouseX - dotX) * 0.25;
  dotY += (mouseY - dotY) * 0.25;
  glowX += (mouseX - glowX) * 0.12;
  glowY += (mouseY - glowY) * 0.12;

  if (dot) dot.style.transform = `translate(${dotX}px, ${dotY}px) translate(-50%, -50%)`;
  if (glow) glow.style.transform = `translate(${glowX}px, ${glowY}px) translate(-50%, -50%)`;

  // Draw sparks
  if (sparkCtx) {
    sparkCtx.clearRect(0, 0, sparkCanvas.width, sparkCanvas.height);
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.04; // gravity
      s.life -= 0.025;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      sparkCtx.save();
      sparkCtx.globalAlpha = s.life;
      sparkCtx.fillStyle = `hsl(${38 + Math.random() * 10}, 85%, ${65 + s.life * 20}%)`;
      sparkCtx.shadowColor = '#e8b04a';
      sparkCtx.shadowBlur = 6;
      sparkCtx.beginPath();
      sparkCtx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
      sparkCtx.fill();
      sparkCtx.restore();
    }
  }

  raf = requestAnimationFrame(loop);
}

export function initCursor() {
  if (isTouchDevice()) {
    if (dot) dot.style.display = 'none';
    if (glow) glow.style.display = 'none';
    if (sparkCanvas) sparkCanvas.style.display = 'none';
    return;
  }

  document.body.style.cursor = 'none';
  active = true;
  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', onMouseMove, { passive: true });
  loop();
}

export function destroyCursor() {
  active = false;
  if (raf) cancelAnimationFrame(raf);
  window.removeEventListener('resize', resize);
  window.removeEventListener('mousemove', onMouseMove);
  document.body.style.cursor = '';
}
