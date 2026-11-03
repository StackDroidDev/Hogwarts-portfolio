import * as THREE from 'three';
import gsap from 'gsap';
import { content } from '../content.js';

export class FooterScene {
  constructor(scene, camera, houseThemeManager) {
    this.scene = scene;
    this.camera = camera;
    this.houseTheme = houseThemeManager;

    this.group = new THREE.Group();
    // Positioned at the very end of the journey at Z = -555
    this.group.position.set(0, 0, -555);
    this.scene.add(this.group);

    this.studyCandles = [];
    this.lastCandleLight = null;
    this.smokeParticles = [];

    this.init();
    this.initUI();
  }

  init() {
    this.buildDarkeningChamber();
    this.buildCandleCluster();
  }

  buildDarkeningChamber() {
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x11131a,
      roughness: 0.9,
      metalness: 0.05
    });

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), stoneMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.0;
    this.group.add(floor);
  }

  buildCandleCluster() {
    const waxMat = new THREE.MeshStandardMaterial({ color: 0xe8dfc8, roughness: 0.4 });
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffda73 });

    // 5 Candles on floor plinths
    const positions = [
      [-1.4, -1.6, 0.4],
      [1.4, -1.6, 0.4],
      [-0.7, -1.7, -0.6],
      [0.7, -1.7, -0.6],
      [0.0, -1.65, 0.0] // The last remaining candle
    ];

    positions.forEach(([x, y, z], idx) => {
      const g = new THREE.Group();
      g.position.set(x, y, z);

      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.7, 10), waxMat);
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.14, 8), flameMat);
      flame.position.y = 0.42;
      g.add(body, flame);

      const light = new THREE.PointLight(0xffbe58, 2.5, 6, 1.2);
      light.position.set(0, 0.5, 0);
      g.add(light);

      this.group.add(g);
      this.studyCandles.push({ group: g, flame, light, isExtinguished: false, isLast: (idx === 4) });

      if (idx === 4) {
        this.lastCandleLight = light;
      }
    });
  }

  extinguishCandlesSequence() {
    this.studyCandles.forEach((c, idx) => {
      if (!c.isLast) {
        gsap.delayedCall(0.5 + idx * 0.4, () => {
          c.isExtinguished = true;
          gsap.to(c.flame.scale, { x: 0, y: 0, z: 0, duration: 0.2 });
          gsap.to(c.light, { intensity: 0, duration: 0.3 });
        });
      } else {
        // Last candle stays softly illuminated
        gsap.to(c.light, { intensity: 3.5, duration: 1.0 });
      }
    });
  }

  initUI() {
    let el = document.getElementById('footer-ui');
    if (!el) {
      el = document.createElement('div');
      el.id = 'footer-ui';
      document.body.appendChild(el);
    }
    el.className = 'footer-ui hidden';
    el.innerHTML = `
      <div class="mischief-managed-card">
        <h2 class="mischief-title">${content.footer.mischief}</h2>
        <p class="thanks-msg">${content.footer.thanks}</p>
        
        <button id="btn-back-to-top" class="magic-gold-btn top-btn" aria-label="Return to Platform 9 3/4">
          ↑ ${content.footer.backToTop}
        </button>

        <span class="built-by-tag">${content.footer.builtBy}</span>
      </div>
    `;

    document.getElementById('btn-back-to-top')?.addEventListener('click', () => {
      if (window.app && window.app.scrollManager) {
        window.app.scrollManager.scrollToRoom(0.0, 2.8);
      }
    });
  }

  enter() {
    this.group.visible = true;
    document.getElementById('footer-ui')?.classList.remove('hidden');
    this.extinguishCandlesSequence();
  }

  exit() {
    document.getElementById('footer-ui')?.classList.add('hidden');
    this.group.visible = false;
  }

  update(time, delta, mouse) {
    if (!this.group.visible) return;

    // Gentle flicker on last candle
    if (this.lastCandleLight) {
      this.lastCandleLight.intensity = 3.2 + Math.sin(time * 8.0) * 0.4;
    }
  }
}