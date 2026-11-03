import * as THREE from 'three';
import gsap from 'gsap';
import { content } from '../content.js';

export class ProjectsScene {
  constructor(scene, camera, houseThemeManager) {
    this.scene = scene;
    this.camera = camera;
    this.houseTheme = houseThemeManager;

    this.group = new THREE.Group();
    // Positioned along the continuous Z-axis after Skills Corridor (Z = -305 to -345)
    this.group.position.set(0, 0, -325);
    this.scene.add(this.group);

    this.galleryLength = 55;
    this.paintings = [];
    this.activeProjectIndex = -1;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.inspectedModal3D = null;
    this.phoneScreenTex = null;
    this.phoneScreenCtx = null;
    this.touchStartX = 0;

    this.init();
    this.initUI();
    this.setupEvents();
  }

  init() {
    this.buildGrandGalleryHall();
    this.buildFramedProjectPaintings();
    this.build3DInspectionModal();
  }

  buildGrandGalleryHall() {
    // Rich Gothic Crimson Velvet Walls
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x4a121a,
      roughness: 0.85,
      metalness: 0.05,
      emissive: 0x1a060a,
      emissiveIntensity: 0.35,
      side: THREE.BackSide
    });

    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x221318,
      roughness: 0.6,
      metalness: 0.15
    });

    // Hall Box
    const hallGeo = new THREE.BoxGeometry(16, 12, this.galleryLength);
    const hallMesh = new THREE.Mesh(hallGeo, wallMat);
    hallMesh.position.y = 3.6;
    this.group.add(hallMesh);

    // Dark Herringbone Parquet Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, this.galleryLength), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.38;
    this.group.add(floor);

    // Warm Castle Chandelier & Wall Sconces
    const amb = new THREE.AmbientLight(0x73323c, 1.4);
    this.group.add(amb);

    for (let z = -20; z <= 20; z += 12) {
      const light = new THREE.PointLight(0xffbe58, 4.5, 18, 1.1);
      light.position.set(0, 7.5, z);
      this.group.add(light);

      // Sconces on left and right walls
      [-7.5, 7.5].forEach(x => {
        const sconce = new THREE.PointLight(0xff9a36, 2.5, 8, 1.3);
        sconce.position.set(x > 0 ? x - 0.6 : x + 0.6, 3.2, z);
        this.group.add(sconce);
      });
    }
  }

  buildFramedProjectPaintings() {
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.25,
      metalness: 0.9,
      emissive: 0x422d05,
      emissiveIntensity: 0.35
    });

    const crackShaderMat = (colorHex) => new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBaseColor: { value: new THREE.Color(colorHex) },
        uAwake: { value: 0.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uBaseColor;
        uniform float uAwake;
        varying vec2 vUv;

        // Cracked old oil-varnish procedural pattern
        float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float crackNoise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }

        void main() {
          float cracks = crackNoise(vUv * 36.0);
          cracks = smoothstep(0.48, 0.52, cracks) * 0.28;
          // When painting awakes, subtle cinematic living light washes over the canvas
          vec3 livingTone = uBaseColor + vec3(sin(vUv.x * 6.0 + uTime * 1.5) * 0.12 * uAwake);
          vec3 finalColor = (livingTone - vec3(cracks * (1.0 - uAwake * 0.6)));
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `
    });

    const paintingData = [
      { z: 12, side: -1, color: 0x1b4d3e, label: "NIRMAN" },
      { z: 0,  side:  1, color: 0x3d276b, label: "COMPOSE" },
      { z: -12, side: -1, color: 0x5a321a, label: "EDITH" }
    ];

    content.projects.forEach((proj, idx) => {
      const cfg = paintingData[idx];
      const pGroup = new THREE.Group();
      const x = cfg.side * 7.4;
      pGroup.position.set(x, 2.8, cfg.z);
      pGroup.rotation.y = cfg.side < 0 ? Math.PI / 2 : -Math.PI / 2;

      // Heavy Baroque Gilded Frame
      const frameGeo = new THREE.BoxGeometry(4.2, 5.4, 0.35);
      const frame = new THREE.Mesh(frameGeo, frameMat);
      pGroup.add(frame);

      // Cracked Oil Canvas
      const canvasMat = crackShaderMat(cfg.color);
      const canvas = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 4.8), canvasMat);
      canvas.position.z = 0.19;
      canvas.userData = { projectIndex: idx };
      pGroup.add(canvas);

      // Silhouette Figure that steps out when awake
      const silMat = new THREE.MeshBasicMaterial({
        color: 0x05060a,
        transparent: true,
        opacity: 0.95
      });
      const figure = new THREE.Group();
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), silMat);
      head.position.y = 0.9;
      const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.45, 1.2, 16), silMat);
      torso.position.y = 0.1;
      figure.add(head, torso);
      figure.position.set(0, 0, 0.22);
      pGroup.add(figure);

      // Frame Accent Spotlight
      const spot = new THREE.PointLight(0xffd175, 2.5, 7, 1.2);
      spot.position.set(0, 2.8, 1.4);
      pGroup.add(spot);

      this.group.add(pGroup);

      this.paintings.push({
        group: pGroup,
        canvas,
        figure,
        canvasMat,
        spot,
        data: proj,
        origZ: cfg.z,
        isAwake: false
      });
    });
  }

  build3DInspectionModal() {
    this.inspectedModal3D = new THREE.Group();
    this.inspectedModal3D.position.set(0, 2.2, 0);
    this.inspectedModal3D.scale.set(0.001, 0.001, 0.001);

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x11131c,
      roughness: 0.2,
      metalness: 0.9
    });

    const goldTrim = new THREE.MeshStandardMaterial({
      color: 0xe8b04a,
      roughness: 0.25,
      metalness: 0.9,
      emissive: 0x3d2906,
      emissiveIntensity: 0.35
    });

    // 3D Chassis (Adaptive: Phone / Tablet Slate)
    const phone = new THREE.Mesh(new THREE.BoxGeometry(2.5, 4.4, 0.12), bodyMat);
    this.inspectedModal3D.add(phone);

    const rim = new THREE.Mesh(new THREE.BoxGeometry(2.56, 4.46, 0.1), goldTrim);
    this.inspectedModal3D.add(rim);

    // Live Canvas Screen
    this.phoneScreenCanvas = document.createElement('canvas');
    this.phoneScreenCanvas.width = 640;
    this.phoneScreenCanvas.height = 1120;
    this.phoneScreenCtx = this.phoneScreenCanvas.getContext('2d');
    this.renderScreenMockup(0);

    this.phoneScreenTex = new THREE.CanvasTexture(this.phoneScreenCanvas);
    const screenMat = new THREE.MeshBasicMaterial({ map: this.phoneScreenTex });
    const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.36, 4.26), screenMat);
    screenMesh.position.z = 0.065;
    this.inspectedModal3D.add(screenMesh);

    this.group.add(this.inspectedModal3D);
  }

  renderScreenMockup(projIdx) {
    const ctx = this.phoneScreenCtx;
    if (!ctx) return;
    const proj = content.projects[projIdx] || content.projects[0];

    // Background
    ctx.fillStyle = '#0a0d18';
    ctx.fillRect(0, 0, 640, 1120);

    // App Bar Header
    ctx.fillStyle = '#161d30';
    ctx.fillRect(0, 0, 640, 120);

    ctx.fillStyle = '#e8b04a';
    ctx.font = "bold 34px 'Cinzel', serif";
    ctx.fillText(proj.name, 40, 75);

    // Hero Mockup Banner
    const gradient = ctx.createLinearGradient(40, 150, 600, 380);
    gradient.addColorStop(0, '#2d1838');
    gradient.addColorStop(1, '#13283b');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(40, 160, 560, 240, 20);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = "bold 32px 'Lora', serif";
    ctx.fillText("Interactive Live Showcase", 70, 240);

    ctx.fillStyle = '#f3e9d2';
    ctx.font = "20px 'Lora', serif";
    this.wrapText(ctx, proj.tagline, 70, 290, 500, 30);

    // Feature Cards
    for (let i = 0; i < 3; i++) {
      const y = 430 + i * 140;
      ctx.fillStyle = '#141a29';
      ctx.strokeStyle = 'rgba(232, 176, 74, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(40, y, 560, 115, 14);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#e8b04a';
      ctx.font = "bold 24px monospace";
      ctx.fillText(`0${i + 1} // ARCHITECTURE NODE`, 64, y + 46);

      ctx.fillStyle = '#c7c2b5';
      ctx.font = "20px sans-serif";
      const techLine = proj.tech ? proj.tech.join(" • ") : "Native Engineering";
      ctx.fillText(techLine, 64, y + 84);
    }

    // Bottom Action Hint
    ctx.fillStyle = '#e8b04a';
    ctx.beginPath();
    ctx.roundRect(40, 970, 560, 80, 20);
    ctx.fill();

    ctx.fillStyle = '#0a0d18';
    ctx.font = "bold 26px 'Cinzel', serif";
    ctx.textAlign = 'center';
    ctx.fillText("Touch / Tilt Device to Inspect", 320, 1020);
    ctx.textAlign = 'start';

    if (this.phoneScreenTex) this.phoneScreenTex.needsUpdate = true;
  }

  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    if (!text) return;
    const words = text.split(' ');
    let line = '';
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
  }

  initUI() {
    let el = document.getElementById('projects-ui');
    if (!el) {
      el = document.createElement('div');
      el.id = 'projects-ui';
      document.body.appendChild(el);
    }
    el.className = 'projects-ui hidden';
    el.innerHTML = `
      <div class="projects-gallery-header">
        <h2 class="gallery-title">The Portrait Gallery</h2>
        <p class="gallery-subtitle">Click portraits to Inspect</p>
      </div>

      <!-- Active Project Modal Card -->
      <div id="project-modal" class="project-modal hidden" role="dialog" aria-modal="true">
        <button id="btn-close-project" class="ghost-btn close-proj-btn" aria-label="Close project inspection">✕ Back</button>
        <div class="project-modal-body">
          <span id="proj-counter" class="proj-counter">1 / 3</span>
          <h3 id="proj-title" class="proj-title"></h3>
          <p id="proj-tagline" class="proj-tagline"></p>
          <p id="proj-desc" class="proj-desc"></p>
          
          <div class="proj-tech-row" id="proj-tech-tags"></div>

          <div class="proj-actions">
            <a id="proj-btn-github" class="action-btn github-btn" target="_blank" rel="noopener noreferrer">
              <span>GitHub</span> ↗
            </a>
            <a id="proj-btn-demo" class="action-btn demo-btn" target="_blank" rel="noopener noreferrer">
              <span>Live Demo</span> ↗
            </a>
          </div>
        </div>

        <div class="project-carousel-controls">
          <button id="btn-prev-proj" class="carousel-arrow" aria-label="Previous Project">←</button>
          <span class="carousel-hint">Use arrow keys or swipe</span>
          <button id="btn-next-proj" class="carousel-arrow" aria-label="Next Project">→</button>
        </div>
      </div>
    `;
  }

  setupEvents() {
    // 1. Raycast Click / Tap on 3D Paintings
    window.addEventListener('pointermove', (e) => {
      this.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.handleHover();
    });

    window.addEventListener('click', (e) => {
      if (e.target.closest('#projects-ui button, #projects-ui a')) return;
      this.handleClick();
    });

    // 2. Modal Carousel Controls
    document.getElementById('btn-close-project')?.addEventListener('click', () => this.closeProject());
    document.getElementById('btn-prev-proj')?.addEventListener('click', () => this.cycleProject(-1));
    document.getElementById('btn-next-proj')?.addEventListener('click', () => this.cycleProject(1));

    // 3. Touch Swipe on Phones
    window.addEventListener('touchstart', (e) => {
      this.touchStartX = e.touches[0].clientX;
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      if (this.activeProjectIndex === -1) return;
      const touchEndX = e.changedTouches[0].clientX;
      const diffX = this.touchStartX - touchEndX;
      if (Math.abs(diffX) > 45) {
        this.cycleProject(diffX > 0 ? 1 : -1);
      }
    }, { passive: true });

    // 4. Keyboard Arrow Navigation
    window.addEventListener('keydown', (e) => {
      if (this.activeProjectIndex === -1) return;
      if (e.key === 'Escape') this.closeProject();
      else if (e.key === 'ArrowRight') this.cycleProject(1);
      else if (e.key === 'ArrowLeft') this.cycleProject(-1);
    });
  }

  handleHover() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const meshes = this.paintings.map(p => p.canvas);
    const hits = this.raycaster.intersectObjects(meshes);

    if (hits.length > 0) {
      document.body.style.cursor = 'pointer';
      const idx = hits[0].object.userData.projectIndex;
      this.awakenPainting(idx);
    } else {
      document.body.style.cursor = 'default';
      this.sleepPaintings();
    }
  }

  handleClick() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const meshes = this.paintings.map(p => p.canvas);
    const hits = this.raycaster.intersectObjects(meshes);

    if (hits.length > 0) {
      const idx = hits[0].object.userData.projectIndex;
      this.openProject(idx);
    }
  }

  awakenPainting(index) {
    this.paintings.forEach((p, i) => {
      if (i === index && !p.isAwake) {
        p.isAwake = true;
        // Painted figure steps out of the canvas
        gsap.to(p.figure.position, { z: 0.95, duration: 0.8, ease: 'back.out(1.5)' });
        gsap.to(p.figure.scale, { x: 1.15, y: 1.15, duration: 0.8 });
        gsap.to(p.canvasMat.uniforms.uAwake, { value: 1.0, duration: 0.8 });
        gsap.to(p.spot, { intensity: 4.8, duration: 0.4 });
      }
    });
  }

  sleepPaintings() {
    this.paintings.forEach(p => {
      if (p.isAwake) {
        p.isAwake = false;
        gsap.to(p.figure.position, { z: 0.22, duration: 0.6 });
        gsap.to(p.figure.scale, { x: 1.0, y: 1.0, duration: 0.6 });
        gsap.to(p.canvasMat.uniforms.uAwake, { value: 0.0, duration: 0.6 });
        gsap.to(p.spot, { intensity: 2.5, duration: 0.4 });
      }
    });
  }

  openProject(index) {
    this.activeProjectIndex = index;
    const proj = content.projects[index];
    this.renderScreenMockup(index);

    // Move 3D modal screen in front of active painting
    const targetPainting = this.paintings[index];
    this.inspectedModal3D.position.set(0, 2.2, targetPainting.origZ);
    this.inspectedModal3D.rotation.y = 0;

    gsap.to(this.inspectedModal3D.scale, {
      x: 1, y: 1, z: 1,
      duration: 0.9,
      ease: 'back.out(1.5)'
    });

    // Populate UI Card
    const modal = document.getElementById('project-modal');
    document.getElementById('proj-counter').textContent = `${index + 1} / ${content.projects.length}`;
    document.getElementById('proj-title').textContent = proj.name;
    document.getElementById('proj-tagline').textContent = `"${proj.tagline}"`;
    document.getElementById('proj-desc').textContent = proj.description;

    // Tech Tags
    const techBox = document.getElementById('proj-tech-tags');
    techBox.innerHTML = (proj.tech || []).map(t => `<span class="tech-tag">${t}</span>`).join('');

    // Action Buttons: Hide if link is empty per spec
    const btnGithub = document.getElementById('proj-btn-github');
    const btnDemo = document.getElementById('proj-btn-demo');

    if (proj.github && proj.github.trim() !== "") {
      btnGithub.href = proj.github;
      btnGithub.style.display = 'inline-flex';
    } else {
      btnGithub.style.display = 'none';
    }

    if (proj.demo && proj.demo.trim() !== "") {
      btnDemo.href = proj.demo;
      btnDemo.style.display = 'inline-flex';
    } else {
      btnDemo.style.display = 'none';
    }

    modal?.classList.remove('hidden');
  }

  closeProject() {
    if (this.activeProjectIndex === -1) return;
    this.activeProjectIndex = -1;
    gsap.to(this.inspectedModal3D.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 0.4 });
    document.getElementById('project-modal')?.classList.add('hidden');
  }

  cycleProject(dir) {
    let next = (this.activeProjectIndex + dir) % content.projects.length;
    if (next < 0) next = content.projects.length - 1;
    this.openProject(next);
  }

  onEnterRoom() {
    this.group.visible = true;
    document.getElementById('projects-ui')?.classList.remove('hidden');
  }

  onLeaveRoom() {
    this.closeProject();
    document.getElementById('projects-ui')?.classList.add('hidden');
    this.group.visible = false;
  }

  update(time, delta, mouse) {
    if (!this.group.visible) return;

    this.paintings.forEach(p => {
      p.canvasMat.uniforms.uTime.value = time;
    });

    // Interactive 3D phone screen tilt parallax
    if (this.activeProjectIndex !== -1 && mouse) {
      this.inspectedModal3D.rotation.y = mouse.x * 0.35;
      this.inspectedModal3D.rotation.x = -mouse.y * 0.25;
      this.inspectedModal3D.position.y = 2.2 + Math.sin(time * 1.5) * 0.04;
    }
  }
}