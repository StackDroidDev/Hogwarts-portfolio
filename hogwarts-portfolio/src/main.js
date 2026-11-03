import * as THREE from 'three';
import { WandCursor } from './systems/cursor.js';
import { HallLighting } from './systems/lighting.js';
import { createPostProcessing } from './systems/postprocessing.js';
import { Part1Hall } from './scenes/part1-hall.js';
import { HouseThemeManager } from './systems/houseTheme.js';
import { ScrollManager } from './systems/scrollManager.js';
import { SortingHatScene } from './scenes/sortingHat.js';
import { GreatHallScene } from './scenes/greatHall.js';
import { AboutScene } from './scenes/about.js';
import { TimelineScene } from './scenes/timeline.js';
import { SkillsCorridorScene } from './scenes/skills/corridor.js';
import { ProjectsScene } from './scenes/projects.js';
import { ArenaScene } from './scenes/arena.js';
import { ResumeScene } from './scenes/resume.js';
import { ContactScene } from './scenes/contact.js';
import { FooterScene } from './scenes/footer.js';
import { content } from './content.js';

class App {
  constructor() {
    this.container = document.getElementById('webgl-container');
    this.mouse = { x: 0, y: 0 };
    this.clock = new THREE.Clock();

    this.initLoader();
    this.initCore();
    this.initSystems();
    this.initGlobalPolishUI();
    this.bindEvents();
    this.animate();
  }

  initCore() {
    this.scene = new THREE.Scene();

    // Warm castle navy background (eliminates pitch black)
    this.scene.background = new THREE.Color(0x10172a);

    // Light atmospheric mist: keeps distance visible without harsh clipping
    this.scene.fog = new THREE.FogExp2(0x10172a, 0.0035);

    // Castle-wide ambient bounce
    const ambientLight = new THREE.AmbientLight(0xdbe4f0, 1.4);
    this.scene.add(ambientLight);

    const hemisphereLight = new THREE.HemisphereLight(0x405b82, 0x1f1812, 1.2);
    this.scene.add(hemisphereLight);

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      650
    );
    this.camera.position.set(0, 0, 7.5);
    this.camera.lookAt(0, 0, 0);

    const isMobile = window.innerWidth < 768;
    this.renderer = new THREE.WebGLRenderer({
      antialias: !isMobile,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.shadowMap.enabled = false;

    this.container.appendChild(this.renderer.domElement);
  }

  initSystems() {
    this.cursor = new WandCursor();
    this.lighting = new HallLighting(this.scene);
    this.post = createPostProcessing(this.renderer, this.scene, this.camera);

    this.hallScene = new Part1Hall(this.scene, this.camera, this.lighting);
    this.houseTheme = new HouseThemeManager();
    this.scrollManager = new ScrollManager(this.camera, this.scene);
    this.sortingHatScene = new SortingHatScene(this.scene, this.houseTheme, this.scrollManager);
    this.greatHallScene = new GreatHallScene(this.scene, this.houseTheme);
    this.aboutScene = new AboutScene(this.scene, this.camera, this.houseTheme);
    this.divinationScene = this.aboutScene; // Safely alias so either property references the orbs
    this.timelineScene = new TimelineScene(this.scene, this.camera, this.houseTheme);
    this.skillsScene = new SkillsCorridorScene(this.scene, this.camera, this.houseTheme);
    this.projectsScene = new ProjectsScene(this.scene, this.camera, this.houseTheme);
    this.arenaScene = new ArenaScene(this.scene, this.camera, this.houseTheme);
    this.resumeScene = new ResumeScene(this.scene, this.camera, this.houseTheme);
    this.contactScene = new ContactScene(this.scene, this.camera, this.houseTheme);
    this.footerScene = new FooterScene(this.scene, this.camera, this.houseTheme);

    window.app = this;

    // Initial state: Hat is visible down the corridor in Room 0; everything else remains hidden
    this.sortingHatScene.group.visible = true;
    this.greatHallScene.group.visible = false;
    this.aboutScene.group.visible = false;
    this.timelineScene.group.visible = false;
    this.skillsScene.group.visible = false;
    this.projectsScene.group.visible = false;
    this.arenaScene.group.visible = false;
    this.resumeScene.group.visible = false;
    this.contactScene.group.visible = false;
    this.footerScene.group.visible = false;

    this.scrollManager.onRoomChange((roomIndex) => {
      const p1Role = document.getElementById('role-subtitle');
      const p1Hint = document.getElementById('scroll-hint');

      // Soft Lumos cursor light restricted strictly to Room 0
      if (this.hallScene && this.hallScene.cursorLight) {
        this.hallScene.cursorLight.intensity = (roomIndex === 0) ? 0.9 : 0;
        this.hallScene.cursorLight.visible = (roomIndex === 0);
      }

      // --- Room 0: Name Reveal ---
      if (this.hallScene.canvasPlane) {
        this.hallScene.canvasPlane.visible = (roomIndex === 0);
      }
      if (this.hallScene.solidTextGroup) {
        this.hallScene.solidTextGroup.visible = (roomIndex === 0);
      }
      if (p1Role) p1Role.style.display = (roomIndex === 0) ? 'block' : 'none';
      if (p1Hint) p1Hint.style.display = (roomIndex === 0) ? 'flex' : 'none';

      // --- Room 1: Sorting Hat ---
      this.sortingHatScene.group.visible = (roomIndex === 0 || roomIndex === 1);
      if (roomIndex === 1) {
        this.sortingHatScene.onEnterRoom();
      } else {
        document.getElementById('sorting-hat-ui')?.classList.add('hidden');
      }

      // --- Room 2 & 3: The Great Hall & Divination Chamber ---
      const inHallChamber = (roomIndex === 2 || roomIndex === 3);
      this.greatHallScene.group.visible = inHallChamber;

      const greatHallUI = document.getElementById('great-hall-ui');
      if (roomIndex === 2) {
        if (greatHallUI) greatHallUI.classList.remove('hidden');
      } else {
        if (greatHallUI) greatHallUI.classList.add('hidden');
      }

      // --- Room 3: Divination Orbs ---
      const showOrbs = (roomIndex === 2 || roomIndex === 3);
      this.aboutScene.group.visible = showOrbs;

      if (roomIndex === 3) {
        this.aboutScene.onEnterRoom();
      } else {
        this.aboutScene.onLeaveRoom();
      }

      // --- Room 4: Grand Staircase Timeline ---
      const showTimeline = (roomIndex === 3 || roomIndex === 4);
      this.timelineScene.group.visible = showTimeline;

      if (roomIndex === 4) {
        this.timelineScene.onEnterRoom();
      } else {
        this.timelineScene.onLeaveRoom();
      }

      // --- Room 5: Skills Corridor ---
      this.skillsScene.group.visible = (roomIndex === 5);
      if (roomIndex === 5) {
        this.skillsScene.onEnterRoom();
      } else {
        this.skillsScene.onLeaveRoom();
      }

      // --- Room 6: Projects Gallery ---
      this.projectsScene.group.visible = (roomIndex === 6);
      if (roomIndex === 6) {
        this.projectsScene.onEnterRoom();
      } else {
        this.projectsScene.onLeaveRoom();
      }

      // --- Room 7: Triwizard Arena ---
      this.arenaScene.group.visible = (roomIndex === 7);
      if (roomIndex === 7) {
        this.arenaScene.onEnterRoom();
      } else {
        this.arenaScene.onLeaveRoom();
      }

      // --- Room 8: Resume Scroll (Direct transition from Arena) ---
      this.resumeScene.group.visible = (roomIndex === 8);
      if (roomIndex === 8) {
        this.resumeScene.enter();
      } else {
        this.resumeScene.exit();
      }

      // --- Room 9: Owlery Tower Contact ---
      this.contactScene.group.visible = (roomIndex === 9);
      if (roomIndex === 9) {
        this.contactScene.enter();
      } else {
        this.contactScene.exit();
      }

      // --- Room 10: Mischief Managed Footer ---
      this.footerScene.group.visible = (roomIndex === 10);
      if (roomIndex === 10) {
        this.footerScene.enter();
      } else {
        this.footerScene.exit();
      }
    });
  }

  initGlobalPolishUI() {
    let topBar = document.getElementById('global-polish-bar');
    if (!topBar) {
      topBar = document.createElement('div');
      topBar.id = 'global-polish-bar';
      document.body.appendChild(topBar);
    }

    topBar.innerHTML = `
      <div id="global-scroll-progress" class="global-progress-bar"></div>
      
      <div class="top-nav-controls">
        <button id="btn-open-rooms-menu" class="nav-icon-btn" aria-label="Open Rooms Navigator">
          <span class="btn-icon">🏰</span>
          <span>Rooms</span>
        </button>

        <button id="btn-toggle-motion" class="nav-icon-btn" aria-label="Toggle Reduced Motion">
          <span id="motion-icon">🌀</span>
          <span id="motion-text">Motion</span>
        </button>
      </div>

      <div id="rooms-drawer-modal" class="rooms-drawer-modal hidden" role="dialog" aria-modal="true">
        <div class="drawer-header">
          <h3 class="drawer-title">Marauder's Map // Chambers</h3>
          <button id="btn-close-drawer" class="ghost-btn" aria-label="Close rooms menu">✕</button>
        </div>
        <ul class="rooms-nav-list">
          ${content.rooms.map(r => `
            <li>
              <button class="room-jump-btn" data-scroll="${r.scroll}">
                <span class="room-id">0${r.id}</span>
                <span class="room-name">${r.name}</span>
              </button>
            </li>
          `).join('')}
        </ul>
      </div>
    `;

    const drawer = document.getElementById('rooms-drawer-modal');
    document.getElementById('btn-open-rooms-menu')?.addEventListener('click', () => {
      drawer?.classList.remove('hidden');
    });

    document.getElementById('btn-close-drawer')?.addEventListener('click', () => {
      drawer?.classList.add('hidden');
    });

    document.querySelectorAll('.room-jump-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const scrollTarget = parseFloat(btn.getAttribute('data-scroll'));
        this.scrollManager.scrollToRoom(scrollTarget, 2.0);
        drawer?.classList.add('hidden');
      });
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer && !drawer.classList.contains('hidden')) {
        drawer.classList.add('hidden');
      }
    });

    let isReduced = false;
    document.getElementById('btn-toggle-motion')?.addEventListener('click', () => {
      isReduced = !isReduced;
      const motionText = document.getElementById('motion-text');
      if (motionText) motionText.textContent = isReduced ? "Reduced" : "Motion";
      document.body.classList.toggle('prefers-reduced-motion', isReduced);
    });
  }

  initLoader() {
    let progress = 0;
    const bar = document.getElementById('progress-bar');
    const text = document.getElementById('progress-text');
    const actions = document.getElementById('loader-actions');
    const loader = document.getElementById('loader');

    if (!bar || !text || !loader) return;

    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 8) + 3;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        bar.style.width = '100%';
        text.textContent = '100%';
        if (actions) actions.classList.remove('hidden');
      } else {
        bar.style.width = `${progress}%`;
        text.textContent = `${progress}%`;
      }
    }, 35);

    const dismissLoader = () => {
      loader.classList.add('fade-out');
      setTimeout(() => this.hallScene.startSequence(), 300);
    };

    document.getElementById('btn-enter')?.addEventListener('click', dismissLoader);
    document.getElementById('btn-skip-loader')?.addEventListener('click', dismissLoader);
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.post.resize(window.innerWidth, window.innerHeight);
    });

    window.addEventListener('pointermove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    document.getElementById('btn-replay')?.addEventListener('click', () => {
      this.scrollManager.scrollToRoom(0, 1.0);
      this.hallScene.startSequence();
    });

    document.getElementById('btn-skip-intro')?.addEventListener('click', () => {
      this.hallScene.skipToEnd();
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    this.lighting.update(time);
    this.hallScene.update(delta, time, this.mouse);

    this.scrollManager.update(this.mouse);
    this.sortingHatScene.update(time);
    this.greatHallScene.update(time, this.mouse);
    this.aboutScene.update(time);
    this.timelineScene.update(time, this.mouse);
    this.skillsScene.update(time, delta, this.mouse, this.scrollManager.scrollProgress);
    this.projectsScene.update(time, delta, this.mouse);
    this.arenaScene.update(time, delta, this.mouse, this.scrollManager.scrollProgress);
    this.resumeScene.update(time, delta, this.mouse);
    this.contactScene.update(time, delta, this.mouse);
    this.footerScene.update(time, delta, this.mouse);

    this.post.composer.render();
  }
}

new App();
