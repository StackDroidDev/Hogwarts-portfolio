/** ============================================================
 *  soundControls.js — Sound on/off toggle + volume slider UI.
 *  ============================================================ */

import { setEnabled, isEnabled, setVolume, getVolume } from './audio.js';

let container = null;

export function createSoundControls(parent) {
  container = document.createElement('div');
  container.className = 'sound-controls';
  container.innerHTML = `
    <button class="sound-toggle" id="sound-toggle" aria-label="Toggle sound" title="Toggle sound">
      <span id="sound-icon">🔇</span>
    </button>
    <input type="range" class="volume-slider" id="volume-slider"
           min="0" max="100" value="50" aria-label="Volume" title="Volume" />
  `;
  parent.appendChild(container);

  const toggle = container.querySelector('#sound-toggle');
  const icon = container.querySelector('#sound-icon');
  const slider = container.querySelector('#volume-slider');

  function updateIcon() {
    icon.textContent = isEnabled() ? (getVolume() > 0.5 ? '🔊' : '🔉') : '🔇';
  }

  toggle.addEventListener('click', () => {
    setEnabled(!isEnabled());
    updateIcon();
  });

  slider.addEventListener('input', (e) => {
    const v = parseInt(e.target.value) / 100;
    setVolume(v);
    if (v > 0 && !isEnabled()) setEnabled(true);
    if (v === 0) setEnabled(false);
    updateIcon();
  });

  // Sync initial state
  slider.value = Math.round(getVolume() * 100);
  updateIcon();
}

export function updateSoundIcon() {
  if (!container) return;
  const icon = container.querySelector('#sound-icon');
  if (icon) icon.textContent = isEnabled() ? (getVolume() > 0.5 ? '🔊' : '🔉') : '🔇';
}
