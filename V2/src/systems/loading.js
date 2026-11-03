/** ============================================================
 *  loading.js — Platform 9¾ loading screen with real progress.
 *  ============================================================ */

import { LOADING } from '../content.js';

let onEnterCallback = null;
let progressBar = null;
let progressText = null;
let enterButtons = null;
let screen = null;

export function createLoadingScreen(container) {
  screen = document.createElement('div');
  screen.id = 'loading-screen';
  screen.innerHTML = `
    <h1>${LOADING.title}</h1>
    <p class="subtitle">${LOADING.subtitle}</p>
    <div class="progress-wrap">
      <div class="progress-bar" id="progress-bar"></div>
    </div>
    <p class="progress-text" id="progress-text">0%</p>
    <div class="enter-buttons" id="enter-buttons">
      <button class="btn-magic primary" id="btn-enter-sound">${LOADING.enterSound}</button>
      <button class="btn-magic" id="btn-enter-silent">${LOADING.enterSilent}</button>
    </div>
    <button class="btn-skip" id="btn-skip-load">${LOADING.skip}</button>
  `;
  container.appendChild(screen);

  progressBar = screen.querySelector('#progress-bar');
  progressText = screen.querySelector('#progress-text');
  enterButtons = screen.querySelector('#enter-buttons');

  screen.querySelector('#btn-enter-sound').addEventListener('click', () => dismiss(true));
  screen.querySelector('#btn-enter-silent').addEventListener('click', () => dismiss(false));
  screen.querySelector('#btn-skip-load').addEventListener('click', () => dismiss(false));
}

export function setProgress(pct) {
  const v = Math.min(100, Math.max(0, Math.round(pct)));
  if (progressBar) progressBar.style.width = v + '%';
  if (progressText) progressText.textContent = v + '%';
  if (v >= 100 && enterButtons) {
    enterButtons.classList.add('visible');
    if (progressText) progressText.style.display = 'none';
  }
}

export function onEnter(cb) {
  onEnterCallback = cb;
}

function dismiss(withSound) {
  if (screen) {
    screen.classList.add('hidden');
    setTimeout(() => {
      if (screen) { screen.remove(); screen = null; }
    }, 900);
  }
  if (onEnterCallback) onEnterCallback(withSound);
}

export function simulateProgress() {
  let current = 0;
  const interval = setInterval(() => {
    const remaining = 100 - current;
    const increment = Math.max(0.5, remaining * 0.06 + Math.random() * 3);
    current = Math.min(100, current + increment);
    setProgress(current);
    if (current >= 100) clearInterval(interval);
  }, 60);
  return {
    complete: () => {
      clearInterval(interval);
      setProgress(100);
    }
  };
}
