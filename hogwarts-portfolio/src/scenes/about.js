import * as THREE from 'three';
import gsap from 'gsap';
import { content } from '../content.js';

export class AboutScene {
  constructor(scene, camera, houseThemeManager) {
    this.scene = scene;
    this.camera = camera;
    this.houseTheme = houseThemeManager;

    this.group = new THREE.Group();
    // Positioned seamlessly after the Great Hall at Z = -128
    this.group.position.set(0, 0, -128);
    this.scene.add(this.group);

    this.crystalBalls = [];
    this.activeBallIndex = -1;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.init();
    this.initUI();
    this.setupEventListeners();
  }

  init() {
    this.buildDivinationChamber();
    this.buildThreeCrystalBalls();
  }

  buildDivinationChamber() {
    // Open circular arch platform (no back wall so transition to timeline is completely seamless)
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x3d1a33,
      roughness: 0.6,
      emissive: 0x1f0b1d,
      emissiveIntensity: 0.25
    });

    const floor = new THREE.Mesh(new THREE.CircleGeometry(9, 32), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.2;
    this.group.add(floor);

    // Warm atmospheric purple and gold ambient fill
    const ambient = new THREE.AmbientLight(0x754e99, 1.4);
    this.group.add(ambient);

    const centerWarm = new THREE.PointLight(0xffbe54, 5.0, 20, 1.1);
    centerWarm.position.set(0, 3.5, 0);
    this.group.add(centerWarm);

    const purpleUplight = new THREE.PointLight(0xb868f7, 4.0, 16, 1.2);
    purpleUplight.position.set(0, -1.0, 1.0);
    this.group.add(purpleUplight);
  }

    buildThreeCrystalBalls() {
    this.crystalBalls = [];

    const orbConfigs = [
      { id: 'student', x: -3.2, y: 1.2, z: 0.0, color: 0xa855f7 },
      { id: 'developer', x: 0.0, y: 1.5, z: -0.5, color: 0x22c55e },
      { id: 'creator', x: 3.2, y: 1.2, z: 0.0, color: 0xf59e0b }
    ];

    const standMat = new THREE.MeshStandardMaterial({
      color: 0xdfab43,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x6e4808,
      emissiveIntensity: 0.45
    });

    const tableMat = new THREE.MeshStandardMaterial({
      color: 0x4a2816,
      roughness: 0.5,
      metalness: 0.15,
      emissive: 0x241208,
      emissiveIntensity: 0.35
    });

    orbConfigs.forEach((cfg, idx) => {
      const orbGroup = new THREE.Group();
      orbGroup.position.set(cfg.x, cfg.y, cfg.z);

      // Table & Stand
      const table = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.12, 24), tableMat);
      table.position.set(cfg.x, cfg.y - 1.1, cfg.z);
      this.group.add(table);

      const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 1.6, 12), tableMat);
      tableLeg.position.set(cfg.x, cfg.y - 1.9, cfg.z);
      this.group.add(tableLeg);

      const stand = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.08, 12, 24), standMat);
      stand.rotation.x = Math.PI / 2;
      stand.position.y = -0.48;
      orbGroup.add(stand);

      // 1. Core Glowing Energy Core (Ensures visibility from long distance)
      const coreMat = new THREE.MeshBasicMaterial({
        color: cfg.color,
        transparent: true,
        opacity: 0.85
      });
      const coreMesh = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 16), coreMat);
      orbGroup.add(coreMesh);

      // 2. Swirling Nebula Shader
      const fogMat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uSwirl: { value: 1.2 },
          uColor: { value: new THREE.Color(cfg.color) },
          uRipple: { value: 0.0 }
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vPos;
          void main() {
            vNormal = normal;
            vPos = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform float uSwirl;
          uniform vec3 uColor;
          uniform float uRipple;
          varying vec3 vNormal;
          varying vec3 vPos;

          void main() {
            float n = sin(vPos.x * 5.0 + uTime * uSwirl) *
                      cos(vPos.y * 5.0 - uTime * uSwirl) *
                      sin(vPos.z * 5.0 + uTime);
            float rim = 1.0 - max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0)));
            float alpha = (n * 0.4 + 0.6) * 0.75 + rim * 0.55;
            alpha *= (1.0 - uRipple);
            gl_FragColor = vec4(uColor + vec3(rim * 0.6), min(alpha, 0.9));
          }
        `
      });

      const fogMesh = new THREE.Mesh(new THREE.SphereGeometry(0.82, 24, 24), fogMat);
      orbGroup.add(fogMesh);

      // 3. Polished Crystal Glass Outer Shell
      const glassMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.05,
        metalness: 0.2,
        transparent: true,
        opacity: 0.45,
        depthWrite: false
      });

      const glassMesh = new THREE.Mesh(new THREE.SphereGeometry(0.92, 32, 32), glassMat);
      glassMesh.userData = { orbIndex: idx, id: cfg.id };
      orbGroup.add(glassMesh);

      // Mini Scene inside
      const miniScene = this.buildMiniScene ? this.buildMiniScene(idx) : new THREE.Group();
      orbGroup.add(miniScene);

      // Dedicated Inner Radiant Light
      const innerLight = new THREE.PointLight(cfg.color, 5.5, 12.0, 1.1);
      innerLight.position.set(0, 0.1, 0);
      orbGroup.add(innerLight);

      this.group.add(orbGroup);

      this.crystalBalls.push({
        group: orbGroup,
        glass: glassMesh,
        fogMat: fogMat,
        core: coreMesh,
        light: innerLight,
        miniScene: miniScene,
        baseY: cfg.y,
        data: content.divination.crystals[idx]
      });
    });
  }


  buildMiniScene(typeIndex) {
    const mini = new THREE.Group();

    if (typeIndex === 0) {
      const book = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.08, 0.58),
        new THREE.MeshStandardMaterial({ color: 0x9e2432 })
      );
      const pages = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.09, 0.55),
        new THREE.MeshBasicMaterial({ color: 0xfffbe6 })
      );
      mini.add(book, pages);

      for (let s = 0; s < 4; s++) {
        const star = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.05),
          new THREE.MeshBasicMaterial({ color: 0xffea78 })
        );
        const a = (s * Math.PI) / 2;
        star.position.set(Math.cos(a) * 0.4, 0.2, Math.sin(a) * 0.4);
        mini.add(star);
      }
    } else if (typeIndex === 1) {
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x58f78f, wireframe: true });
      const r1 = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.02, 6, 16), ringMat);
      const r2 = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.02, 6, 16), ringMat);
      r2.rotation.x = Math.PI / 2;
      const core = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.14),
        new THREE.MeshBasicMaterial({ color: 0x9effbf })
      );
      mini.add(r1, r2, core);
    } else {
      const camMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 });
      const lensMat = new THREE.MeshStandardMaterial({ color: 0x2471a3 });
      const goldMat = new THREE.MeshBasicMaterial({ color: 0xffd152 });

      const body = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.25, 0.18), camMat);
      const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.1, 14), lensMat);
      lens.rotation.x = Math.PI / 2;
      lens.position.z = 0.1;
      mini.add(body, lens);

      const note = new THREE.Mesh(new THREE.SphereGeometry(0.05), goldMat);
      note.position.set(0.22, 0.16, 0);
      mini.add(note);
    }

    return mini;
  }

  initUI() {
    let el = document.getElementById('divination-ui');
    if (!el) {
      el = document.createElement('div');
      el.id = 'divination-ui';
      document.body.appendChild(el);
    }

    el.className = 'divination-ui hidden';
    el.innerHTML = `
      <div class="divination-header">
        <p class="divination-intro">${content.divination.intro}</p>
        <span class="divination-hint">${content.divination.instructions}</span>
      </div>

      <nav class="divination-tabs" aria-label="Crystal Ball Visions">
        ${content.divination.crystals.map((c, i) => `
          <button class="orb-tab-btn" data-index="${i}" tabindex="0">${c.title}</button>
        `).join('')}
      </nav>

      <div id="crystal-story-modal" class="crystal-story-modal hidden" role="dialog" aria-modal="true">
        <button id="btn-close-crystal" class="ghost-btn close-btn" aria-label="Close vision">✕ Back</button>
        <div class="story-content">
          <span id="story-subtitle" class="story-subtitle"></span>
          <h2 id="story-title" class="story-title"></h2>
          <div id="story-lines" class="story-lines"></div>
        </div>
        <div class="story-carousel-nav">
          <button id="btn-prev-crystal" class="icon-nav-btn" aria-label="Previous Vision">←</button>
          <span id="story-counter" class="story-counter">1 / 3</span>
          <button id="btn-next-crystal" class="icon-nav-btn" aria-label="Next Vision">→</button>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    window.addEventListener('pointermove', (e) => {
      this.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.handleHover();
    });

    window.addEventListener('click', (e) => {
      if (e.target.closest('#divination-ui button, #divination-ui input')) return;
      this.handleClick();
    });

    document.querySelectorAll('.orb-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        this.selectBall(idx);
      });
    });

    document.getElementById('btn-close-crystal')?.addEventListener('click', () => this.closeActiveBall());
    document.getElementById('btn-prev-crystal')?.addEventListener('click', () => this.cycleBall(-1));
    document.getElementById('btn-next-crystal')?.addEventListener('click', () => this.cycleBall(1));

    window.addEventListener('keydown', (e) => {
      const ui = document.getElementById('divination-ui');
      if (!ui || ui.classList.contains('hidden')) return;

      if (e.key === 'Escape') {
        this.closeActiveBall();
      } else if (e.key === 'ArrowRight' && this.activeBallIndex !== -1) {
        this.cycleBall(1);
      } else if (e.key === 'ArrowLeft' && this.activeBallIndex !== -1) {
        this.cycleBall(-1);
      }
    });
  }

  handleHover() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const meshes = this.crystalBalls.map(b => b.glass);
    const intersects = this.raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      document.body.style.cursor = 'pointer';
      const hoveredIdx = intersects[0].object.userData.orbIndex;
      this.crystalBalls.forEach((b, i) => {
        if (i === hoveredIdx) {
          b.fogMat.uniforms.uSwirl.value = 3.5;
          b.light.intensity = 5.0;
        } else if (i !== this.activeBallIndex) {
          b.fogMat.uniforms.uSwirl.value = 1.2;
          b.light.intensity = 3.2;
        }
      });
    } else {
      document.body.style.cursor = 'default';
      this.crystalBalls.forEach((b, i) => {
        if (i !== this.activeBallIndex) {
          b.fogMat.uniforms.uSwirl.value = 1.2;
          b.light.intensity = 3.2;
        }
      });
    }
  }

  handleClick() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const meshes = this.crystalBalls.map(b => b.glass);
    const intersects = this.raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const idx = intersects[0].object.userData.orbIndex;
      this.selectBall(idx);
    }
  }

  selectBall(index) {
    this.activeBallIndex = index;
    const target = this.crystalBalls[index];
    const data = target.data;

    // Shift all 3 orbs safely into the left side of the screen
    // so the card on the right never covers the 3rd orb!
    gsap.to(this.group.position, {
      x: -1.6,
      duration: 0.7,
      ease: 'power2.out'
    });

    document.querySelectorAll('.orb-tab-btn').forEach((btn, i) => {
      btn.classList.toggle('active', i === index);
    });

    const modal = document.getElementById('crystal-story-modal');
    const title = document.getElementById('story-title');
    const subtitle = document.getElementById('story-subtitle');
    const linesBox = document.getElementById('story-lines');
    const counter = document.getElementById('story-counter');

    if (modal && title && linesBox) {
      title.textContent = data.title;
      subtitle.textContent = data.subtitle;
      counter.textContent = `${index + 1} / 3`;
      linesBox.innerHTML = data.lines.map(l => `<p class="story-line">${l}</p>`).join('');
      modal.classList.remove('hidden');
    }
  }

  closeActiveBall() {
    if (this.activeBallIndex === -1) return;
    const prev = this.crystalBalls[this.activeBallIndex];
    if (prev) {
      gsap.to(prev.fogMat.uniforms.uRipple, { value: 0.0, duration: 0.5 });
    }

    // Glide the orbs back to the center of the hall
    gsap.to(this.group.position, {
      x: 0,
      duration: 0.7,
      ease: 'power2.out'
    });

    this.activeBallIndex = -1;
    document.querySelectorAll('.orb-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('crystal-story-modal')?.classList.add('hidden');
  }



  closeActiveBall() {
    if (this.activeBallIndex === -1) return;
    const prev = this.crystalBalls[this.activeBallIndex];
    if (prev) {
      gsap.to(prev.fogMat.uniforms.uRipple, { value: 0.0, duration: 0.5 });
    }

    this.activeBallIndex = -1;
    document.querySelectorAll('.orb-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('crystal-story-modal')?.classList.add('hidden');
  }

  cycleBall(dir) {
    let next = (this.activeBallIndex + dir) % this.crystalBalls.length;
    if (next < 0) next = this.crystalBalls.length - 1;
    this.selectBall(next);
  }

  onEnterRoom() {
    this.group.visible = true;
    document.getElementById('divination-ui')?.classList.remove('hidden');
  }

  onLeaveRoom() {
    this.closeActiveBall();
    this.group.position.x = 0;
    document.getElementById('divination-ui')?.classList.add('hidden');
  }


  update(time, delta) {
    if (this.crystalBalls && Array.isArray(this.crystalBalls)) {
      this.crystalBalls.forEach((orb, i) => {
        if (orb.fogMat && orb.fogMat.uniforms && orb.fogMat.uniforms.uTime) {
          orb.fogMat.uniforms.uTime.value = time;
        }
        if (orb.group) {
          orb.group.position.y = orb.baseY + Math.sin(time * 1.5 + i * 1.8) * 0.08;
        }
      });
    }
  }

}