/** ============================================================
 *  main.js — Entry point. Orchestrates loading → name reveal.
 *  ============================================================ */

import { initRenderer, startLoop } from './systems/renderer.js';
import { initAudio } from './systems/audio.js';
import { initCursor } from './systems/cursor.js';
import { createLoadingScreen, simulateProgress, onEnter } from './systems/loading.js';
import { createSoundControls, updateSoundIcon } from './systems/soundControls.js';
import { createNameRevealScene, playNameReveal } from './scenes/nameReveal.js';

/* ---------- Boot ---------- */
function boot() {
  const canvasContainer = document.getElementById('canvas-container');
  const uiOverlay = document.getElementById('ui-overlay');

  // 1. Cursor
  initCursor();

  // 2. Three.js renderer
  initRenderer(canvasContainer);

  // 3. Prepare name reveal scene (pre-build while loading)
  createNameRevealScene();

  // 4. Loading screen
  createLoadingScreen(uiOverlay);
  const progress = simulateProgress();

  // Simulate heavy loading then complete
  setTimeout(() => progress.complete(), 2800);

  // 5. On enter
  onEnter((withSound) => {
    // Init audio
    initAudio(withSound);

    // Sound controls
    createSoundControls(document.body);
    updateSoundIcon();

    // Start render loop
    startLoop();

    // Start name reveal
    playNameReveal(uiOverlay, () => {
      // Name reveal complete — ready for next scene (Part 2)
    });
  });
}

// Wait for DOM + fonts
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
