import * as THREE from 'three';
import gsap from 'gsap';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { content } from '../content.js';

export class PhotographyScene {
  constructor(scene, camera, houseThemeManager) {
    this.scene = scene;
    this.camera = camera;
    this.houseTheme = houseThemeManager;

    this.group = new THREE.Group();
    // Positioned along the path at Z = -450 (between Arena and Resume)
    this.group.position.set(0, 0, -450);
    this.scene.add(this.group);

    this.cameraRig = new THREE.Group();
    this.shutterButton = null;
    this.flashLight = null;
    this.roomAmbient = null;
    this.snitchCamera = null;

    this.photosOnWall = [];
    this.activePhotoIndex = -1;
    this.hoveredPhoto = null;
    this.currentPage = 0;
    this.pageSize = 8;
    this.currentGroup = "All";

    this.isLumosActive = false;
    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.isMobile = window.innerWidth < 768;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.init();
    this.initUI();
    this.setupEvents();
  }

  init() {
    this.buildDarkStudioChamber();
    this.loadOrBuildVintageCamera();
    this.buildTinyWingedSnitchCamera();
  }

  buildDarkStudioChamber() {
    // 1. Procedural Fine Ashlar Stone Texture for Darkroom Studio Walls & Floor
    const stoneCanvas = document.createElement('canvas');
    stoneCanvas.width = 512;
    stoneCanvas.height = 512;
    const ctx = stoneCanvas.getContext('2d');

    ctx.fillStyle = '#1c2230';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = 'rgba(10, 14, 22, 0.45)';
    ctx.lineWidth = 3;
    for (let y = 0; y < 512; y += 42) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();

      const offset = (y / 42) % 2 === 0 ? 0 : 35;
      for (let x = offset; x < 512; x += 70) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 42);
        ctx.stroke();
      }
    }

    const stoneTex = new THREE.CanvasTexture(stoneCanvas);
    stoneTex.wrapS = THREE.RepeatWrapping;
    stoneTex.wrapT = THREE.RepeatWrapping;
    stoneTex.repeat.set(5, 5);

    const wallMat = new THREE.MeshStandardMaterial({
      map: stoneTex,
      roughness: 0.72,
      metalness: 0.1,
      side: THREE.BackSide,
      emissive: 0x141a26,
      emissiveIntensity: 0.38 // Visible stone masonry studio walls
    });

    const floorMat = new THREE.MeshStandardMaterial({
      map: stoneTex,
      roughness: 0.55,
      metalness: 0.16,
      emissive: 0x101520,
      emissiveIntensity: 0.32 // Soft ground sheen
    });

    // Dark moody photography studio chamber (18 x 12 x 36)
    const roomBox = new THREE.Mesh(new THREE.BoxGeometry(18, 12, 36), wallMat);
    roomBox.position.y = 3.6;
    this.group.add(roomBox);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 36), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.38;
    floor.receiveShadow = true;
    this.group.add(floor);

    // 2. Comprehensive Atmospheric Studio Lighting (Cures pitch black void)
    this.roomAmbient = new THREE.AmbientLight(0xdce6f5, 1.85);
    this.group.add(this.roomAmbient);

    const hemi = new THREE.HemisphereLight(0x3a4d6b, 0x5a3c26, 1.35);
    this.group.add(hemi);

    // Dedicated key light placed directly in front of the vintage camera
    const cameraFrontLight = new THREE.PointLight(0xffecd4, 4.2, 14, 1.1);
    cameraFrontLight.position.set(0, 2.6, 3.2);
    this.group.add(cameraFrontLight);

    // Warm darkroom amber overhead safelight
    const safelight = new THREE.PointLight(0xff8833, 3.2, 22, 1.2);
    safelight.position.set(0, 5.8, -2.0);
    this.group.add(safelight);

    // High-output single-shot flash light
    this.flashLight = new THREE.PointLight(0xfff7e6, 0.0, 32, 1.0);
    this.flashLight.position.set(0, 1.8, 0.8);
    this.group.add(this.flashLight);
  }

  loadOrBuildVintageCamera() {
    const loader = new GLTFLoader();
    loader.load(
      '/models/camera.glb',
      (gltf) => {
        const model = gltf.scene;
        model.scale.set(1.4, 1.4, 1.4);
        model.position.set(0, 1.4, 0);
        this.cameraRig.add(model);
        this.finishCameraSetup();
      },
      undefined,
      () => {
        this.buildProceduralVintageCamera();
        this.finishCameraSetup();
      }
    );
  }

  buildProceduralVintageCamera() {
    // 1. Black Pebble Leatherette Body with warm edge highlight
    const leatherMat = new THREE.MeshStandardMaterial({
      color: 0x222226,
      roughness: 0.65,
      metalness: 0.15,
      emissive: 0x111115,
      emissiveIntensity: 0.35
    });

    // 2. Brushed Brass & Chrome Trim
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0xf5cf58,
      roughness: 0.22,
      metalness: 0.92,
      emissive: 0x5a3e08,
      emissiveIntensity: 0.45
    });

    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xe8ecf2,
      roughness: 0.15,
      metalness: 0.95,
      emissive: 0x242a36,
      emissiveIntensity: 0.25
    });

    // 3. Multi-Element Optical Glass Lens
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.92,
      opacity: 1.0,
      transparent: true,
      roughness: 0.05,
      ior: 1.54,
      thickness: 1.5,
      specularIntensity: 1.0
    });

    // Camera Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.9, 0.65), leatherMat);
    body.position.set(0, 1.4, 0);
    this.cameraRig.add(body);

    // Top Chrome Deck & Viewfinder Pyramid
    const topPlate = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.18, 0.66), chromeMat);
    topPlate.position.set(0, 1.94, 0);

    const prism = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.3, 4), chromeMat);
    prism.rotation.y = Math.PI / 4;
    prism.position.set(0, 2.18, 0.05);
    this.cameraRig.add(topPlate, prism);

    // Vintage Brass Dials
    const dial1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 16), metalMat);
    dial1.position.set(-0.48, 2.08, 0);

    const dial2 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.1, 16), metalMat);
    dial2.position.set(0.48, 2.08, 0);
    this.cameraRig.add(dial1, dial2);

    // Shutter Button (Click Target)
    const shutterGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.09, 12);
    this.shutterButton = new THREE.Mesh(shutterGeo, metalMat);
    this.shutterButton.position.set(0.58, 2.08, 0.14);
    this.cameraRig.add(this.shutterButton);

    // Lens Barrel (Stepped Cylinders)
    const barrel1 = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.45, 0.28, 24), chromeMat);
    barrel1.rotation.x = Math.PI / 2;
    barrel1.position.set(0, 1.4, 0.44);

    const barrel2 = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.4, 0.22, 24), metalMat);
    barrel2.rotation.x = Math.PI / 2;
    barrel2.position.set(0, 1.4, 0.66);

    // Glass Front Element
    const lensGlass = new THREE.Mesh(new THREE.SphereGeometry(0.32, 20, 16, 0, Math.PI * 2, 0, Math.PI / 2.2), glassMat);
    lensGlass.rotation.x = -Math.PI / 2;
    lensGlass.position.set(0, 1.4, 0.76);

    this.cameraRig.add(barrel1, barrel2, lensGlass);

    // Polished Wooden Camera Stand & Brass Mounting Collar
    const standMat = new THREE.MeshStandardMaterial({
      color: 0x4a2e1c,
      roughness: 0.45,
      metalness: 0.15,
      emissive: 0x1f1208,
      emissiveIntensity: 0.35
    });
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.15, 0.3, 24), standMat);
    stand.position.set(0, -0.6, 0);
    this.group.add(stand);

    const standLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.7, 14), metalMat);
    standLeg.position.set(0, 0.35, 0);
    this.group.add(standLeg);
  }

  finishCameraSetup() {
    this.cameraRig.userData = { isCamera: true };
    this.group.add(this.cameraRig);
  }

  buildTinyWingedSnitchCamera() {
    if (this.isMobile) return;

    this.snitchCamera = new THREE.Group();
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.95,
      roughness: 0.18,
      emissive: 0x5a4100,
      emissiveIntensity: 0.5
    });

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), goldMat);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.08, 12), goldMat);
    lens.rotation.x = Math.PI / 2;
    lens.position.z = 0.12;
    this.snitchCamera.add(body, lens);

    const wingMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
    this.snitchWingL = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.08), wingMat);
    this.snitchWingL.position.set(-0.18, 0.06, 0);

    this.snitchWingR = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.08), wingMat);
    this.snitchWingR.position.set(0.18, 0.06, 0);

    this.snitchCamera.add(this.snitchWingL, this.snitchWingR);
    this.snitchCamera.position.set(0, 2.0, 2.0);
    this.group.add(this.snitchCamera);
  }

  triggerCameraFlash() {
    if (this.shutterButton) {
      gsap.timeline()
        .to(this.shutterButton.position, { y: 2.02, duration: 0.08 })
        .to(this.shutterButton.position, { y: 2.08, duration: 0.14 });
    }

    const flashEl = document.getElementById('camera-flash-overlay');
    if (flashEl) {
      gsap.timeline()
        .set(flashEl, { opacity: 0.95 })
        .to(flashEl, { opacity: 0, duration: 0.42, ease: 'power2.out' });
    }

    if (this.flashLight) {
      gsap.timeline()
        .to(this.flashLight, { intensity: 16.0, duration: 0.06 })
        .to(this.flashLight, { intensity: 0.0, duration: 0.38, ease: 'power2.out' });
    }

    this.currentPage++;
    this.spawnPhotoWallBatch();
  }

  spawnPhotoWallBatch() {
    this.photosOnWall.forEach(p => {
      gsap.to(p.mesh.scale, {
        x: 0.001, y: 0.001, z: 0.001, duration: 0.35,
        onComplete: () => this.group.remove(p.mesh)
      });
    });
    this.photosOnWall = [];

    const list = (this.currentGroup === "All")
      ? content.photography.photos
      : content.photography.photos.filter(p => p.group === this.currentGroup);

    const startIndex = (this.currentPage * this.pageSize) % Math.max(list.length, 1);
    const activeSlice = list.slice(startIndex, startIndex + this.pageSize);

    // Wall frame layout angled cleanly toward the center path
    const wallSlots = [
      { side: -1, x: -8.4, y: 4.2, z: -8.0 },
      { side: -1, x: -8.4, y: 4.2, z: 2.0 },
      { side: -1, x: -8.4, y: 1.2, z: -8.0 },
      { side: -1, x: -8.4, y: 1.2, z: 2.0 },
      { side:  1, x:  8.4, y: 4.2, z: -8.0 },
      { side:  1, x:  8.4, y: 4.2, z: 2.0 },
      { side:  1, x:  8.4, y: 1.2, z: -8.0 },
      { side:  1, x:  8.4, y: 1.2, z: 2.0 }
    ];

    activeSlice.forEach((photoData, idx) => {
      const slot = wallSlots[idx % wallSlots.length];
      const photoGroup = new THREE.Group();
      photoGroup.position.set(0, 1.4, 0.8);
      photoGroup.scale.set(0.01, 0.01, 0.01);

      const frameMat = new THREE.MeshStandardMaterial({
        color: 0xfcfaf2,
        roughness: 0.45,
        metalness: 0.08,
        emissive: 0x3d382d,
        emissiveIntensity: 0.25
      });
      const polaroid = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.6, 0.04), frameMat);
      photoGroup.add(polaroid);

      const photoTexture = this.loadPhotoTextureWithFallback(photoData);

      const developMat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uProgress: { value: 0.0 },
          uTexture: { value: photoTexture },
          uLivingShimmer: { value: 0.0 }
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
          uniform float uProgress;
          uniform float uLivingShimmer;
          uniform sampler2D uTexture;
          varying vec2 vUv;

          void main() {
            vec4 col = texture2D(uTexture, vUv);
            col.rgb += vec3(sin(vUv.x * 10.0 + uTime * 0.8) * 0.04 * uLivingShimmer);

            vec3 rawFilm = vec3(0.92, 0.88, 0.78);
            vec3 developed = col.rgb;
            vec3 finalColor = mix(rawFilm, developed, smoothstep(0.0, 1.0, uProgress));

            gl_FragColor = vec4(finalColor, 1.0);
          }
        `
      });

      const picture = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.9), developMat);
      picture.position.set(0, 0.22, 0.025);
      picture.userData = { photoData, photoIndex: idx };
      photoGroup.add(picture);

      this.group.add(photoGroup);

      const settleRotY = slot.side < 0 ? Math.PI / 2 : -Math.PI / 2;
      const arcMidX = slot.side * (2.5 + Math.random() * 2.0);

      gsap.timeline()
        .to(photoGroup.position, {
          x: arcMidX,
          y: 2.5 + (Math.random() - 0.5) * 1.5,
          z: (Math.random() - 0.5) * 4.0,
          duration: 0.6,
          ease: 'power2.out'
        })
        .to(photoGroup.scale, { x: 1, y: 1, z: 1, duration: 0.5 }, 0)
        .to(photoGroup.position, {
          x: slot.x,
          y: slot.y,
          z: slot.z,
          duration: 0.9,
          ease: 'power3.inOut'
        })
        .to(photoGroup.rotation, { y: settleRotY, duration: 0.9, ease: 'power3.inOut' }, '<')
        .to(developMat.uniforms.uProgress, {
          value: 1.0,
          duration: 2.2,
          ease: 'power1.inOut'
        }, '+=0.2');

      this.photosOnWall.push({
        mesh: photoGroup,
        picture,
        mat: developMat,
        slotPos: new THREE.Vector3(slot.x, slot.y, slot.z),
        slotRotY: settleRotY,
        data: photoData
      });
    });
  }

  loadPhotoTextureWithFallback(photoData) {
    const loader = new THREE.TextureLoader();
    let tex = null;

    if (photoData.src) {
      tex = loader.load(
        photoData.src,
        () => {},
        undefined,
        () => {
          const fallbackCanvas = this.createProceduralNatureCanvas(photoData.title, photoData.group);
          tex.image = fallbackCanvas;
          tex.needsUpdate = true;
        }
      );
    } else {
      const fallbackCanvas = this.createProceduralNatureCanvas(photoData.title, photoData.group);
      tex = new THREE.CanvasTexture(fallbackCanvas);
    }

    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }

  createProceduralNatureCanvas(title, group) {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 640;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 640, 640);
    if (group === "Monochrome") {
      grad.addColorStop(0, '#2b2b2b');
      grad.addColorStop(1, '#0f0f0f');
    } else if (group === "Atmosphere") {
      grad.addColorStop(0, '#1c2847');
      grad.addColorStop(1, '#3b1f3c');
    } else {
      grad.addColorStop(0, '#1d3e2c');
      grad.addColorStop(1, '#0e2318');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 640, 640);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.moveTo(0, 480);
    ctx.lineTo(240, 280);
    ctx.lineTo(460, 410);
    ctx.lineTo(640, 320);
    ctx.lineTo(640, 640);
    ctx.lineTo(0, 640);
    ctx.fill();

    ctx.fillStyle = 'rgba(248, 210, 122, 0.25)';
    ctx.beginPath();
    ctx.arc(440, 180, 70, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = "bold 32px 'Cinzel', serif";
    ctx.fillStyle = '#f3e9d2';
    ctx.textAlign = 'center';
    ctx.fillText(title, 320, 560);

    return canvas;
  }

  initUI() {
    let el = document.getElementById('photography-ui');
    if (!el) {
      el = document.createElement('div');
      el.id = 'photography-ui';
      document.body.appendChild(el);
    }

    const groups = content.photography.groups || ["All"];

    el.className = 'photography-ui hidden';
    el.innerHTML = `
      <div id="camera-flash-overlay" class="camera-flash-overlay"></div>

      <!-- Top Header pushed down to prevent collision with top nav -->
      <div class="photo-top-bar">
        <div class="photo-header-text">
          <h2 class="photo-title">${content.photography.title}</h2>
          <p class="photo-subtitle">${content.photography.subtitle}</p>
        </div>

        <div class="photo-toggles">
          <button id="btn-toggle-lumos" class="lumos-toggle-btn" aria-label="Toggle Lumos Mode">
            <span class="lumos-wand-icon">✨</span>
            <span id="lumos-status-text">Lumos Mode: OFF</span>
          </button>
        </div>
      </div>

      <div id="camera-click-hint" class="camera-click-hint">
        <span class="click-pulse-dot"></span>
        <span>${content.photography.cameraHint}</span>
      </div>

      ${groups.length > 1 ? `
        <nav class="photo-groups-selector" aria-label="Photo Collections">
          ${groups.map((g, i) => `
            <button class="photo-group-btn ${i === 0 ? 'active' : ''}" data-group="${g}">
              ${g}
            </button>
          `).join('')}
        </nav>
      ` : ''}

      <div id="photo-dive-modal" class="photo-dive-modal hidden" role="dialog" aria-modal="true">
        <button id="btn-close-dive" class="ghost-btn close-dive-btn" aria-label="Close Lightbox">✕ Back</button>

        <div class="dive-content-wrapper">
          <div class="dive-viewport">
            <div id="before-after-container" class="before-after-container">
              <div id="ba-original-layer" class="ba-layer ba-original">
                <canvas id="canvas-original-img"></canvas>
                <span class="ba-tag">ORIGINAL</span>
              </div>
              <div id="ba-edited-layer" class="ba-layer ba-edited">
                <canvas id="canvas-edited-img"></canvas>
                <span class="ba-tag">EDITED // VIBE</span>
              </div>
              <div id="ba-wand-divider" class="ba-wand-divider">
                <div class="wand-handle-grip">✦</div>
              </div>
            </div>
          </div>

          <aside class="dive-story-drawer">
            <span id="dive-place" class="dive-place"></span>
            <h3 id="dive-title" class="dive-title"></h3>
            <p id="dive-story" class="dive-story"></p>

            <div class="dive-controls">
              <button id="btn-prev-photo" class="icon-nav-btn" aria-label="Previous Photo">←</button>
              <span id="dive-counter" class="dive-counter">1 / 8</span>
              <button id="btn-next-photo" class="icon-nav-btn" aria-label="Next Photo">→</button>
            </div>
          </aside>
        </div>
      </div>
    `;

    this.bindUIEventListeners();
  }

  bindUIEventListeners() {
    const lumosBtn = document.getElementById('btn-toggle-lumos');
    lumosBtn?.addEventListener('click', () => {
      this.isLumosActive = !this.isLumosActive;
      document.getElementById('lumos-status-text').textContent =
        this.isLumosActive ? "Lumos Mode: ON" : "Lumos Mode: OFF";
      lumosBtn.classList.toggle('active', this.isLumosActive);

      gsap.to(this.roomAmbient, {
        intensity: this.isLumosActive ? 0.15 : 1.85,
        duration: 0.8
      });
    });

    document.querySelectorAll('.photo-group-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.photo-group-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentGroup = btn.getAttribute('data-group');
        this.triggerCameraFlash();
      });
    });

    document.getElementById('btn-close-dive')?.addEventListener('click', () => this.closeDiveInside());
    document.getElementById('btn-prev-photo')?.addEventListener('click', () => this.cycleDivePhoto(-1));
    document.getElementById('btn-next-photo')?.addEventListener('click', () => this.cycleDivePhoto(1));

    window.addEventListener('keydown', (e) => {
      if (this.activePhotoIndex === -1) return;
      if (e.key === 'Escape') this.closeDiveInside();
      else if (e.key === 'ArrowRight') this.cycleDivePhoto(1);
      else if (e.key === 'ArrowLeft') this.cycleDivePhoto(-1);
    });

    this.setupBeforeAfterWandDrag();
  }

  setupBeforeAfterWandDrag() {
    const container = document.getElementById('before-after-container');
    const divider = document.getElementById('ba-wand-divider');
    const editedLayer = document.getElementById('ba-edited-layer');

    if (!container || !divider || !editedLayer) return;

    let isDragging = false;

    const setPosition = (clientX) => {
      const rect = container.getBoundingClientRect();
      let x = clientX - rect.left;
      x = THREE.MathUtils.clamp(x, 0, rect.width);
      const percent = (x / rect.width) * 100;

      divider.style.left = `${percent}%`;
      editedLayer.style.clipPath = `polygon(${percent}% 0, 100% 0, 100% 100%, ${percent}% 100%)`;
    };

    divider.addEventListener('pointerdown', () => { isDragging = true; });
    window.addEventListener('pointerup', () => { isDragging = false; });
    window.addEventListener('pointermove', (e) => {
      if (isDragging) setPosition(e.clientX);
    });

    container.addEventListener('touchmove', (e) => {
      if (e.touches[0]) setPosition(e.touches[0].clientX);
    }, { passive: true });
  }

  setupEvents() {
    window.addEventListener('pointermove', (e) => {
      this.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.handleHover();
    });

    window.addEventListener('click', (e) => {
      if (e.target.closest('#photography-ui button, #photography-ui input, #photo-dive-modal')) return;
      this.handleClick();
    });
  }

  handleHover() {
    if (this.activePhotoIndex !== -1) return;

    this.raycaster.setFromCamera(this.pointer, this.camera);

    const cameraHits = this.raycaster.intersectObjects(this.cameraRig.children, true);
    if (cameraHits.length > 0) {
      document.body.style.cursor = 'pointer';
      gsap.to(this.cameraRig.scale, { x: 1.08, y: 1.08, z: 1.08, duration: 0.3 });
      return;
    } else {
      gsap.to(this.cameraRig.scale, { x: 1.0, y: 1.0, z: 1.0, duration: 0.3 });
    }

    const photoTargets = this.photosOnWall.map(p => p.picture);
    const photoHits = this.raycaster.intersectObjects(photoTargets);

    if (photoHits.length > 0) {
      document.body.style.cursor = 'pointer';
      const hitMesh = photoHits[0].object;
      const hovered = this.photosOnWall.find(p => p.picture === hitMesh);

      if (hovered && this.hoveredPhoto !== hovered) {
        if (this.hoveredPhoto) this.unAccioPhoto(this.hoveredPhoto);
        this.hoveredPhoto = hovered;
        this.accioPhoto(hovered);
      }
    } else {
      document.body.style.cursor = 'default';
      if (this.hoveredPhoto) {
        this.unAccioPhoto(this.hoveredPhoto);
        this.hoveredPhoto = null;
      }
    }
  }

  accioPhoto(photoObj) {
    const forwardPos = new THREE.Vector3(
      photoObj.slotPos.x * 0.35,
      2.0,
      photoObj.slotPos.z * 0.65
    );

    gsap.to(photoObj.mesh.position, {
      x: forwardPos.x,
      y: forwardPos.y,
      z: forwardPos.z,
      duration: 0.6,
      ease: 'power2.out'
    });
    gsap.to(photoObj.mesh.scale, { x: 1.6, y: 1.6, z: 1.6, duration: 0.6 });
    gsap.to(photoObj.mesh.rotation, { y: 0, duration: 0.6 });
    photoObj.mat.uniforms.uLivingShimmer.value = 1.0;
  }

  unAccioPhoto(photoObj) {
    gsap.to(photoObj.mesh.position, {
      x: photoObj.slotPos.x,
      y: photoObj.slotPos.y,
      z: photoObj.slotPos.z,
      duration: 0.5,
      ease: 'power2.inOut'
    });
    gsap.to(photoObj.mesh.scale, { x: 1.0, y: 1.0, z: 1.0, duration: 0.5 });
    gsap.to(photoObj.mesh.rotation, { y: photoObj.slotRotY, duration: 0.5 });
    photoObj.mat.uniforms.uLivingShimmer.value = 0.0;
  }

  handleClick() {
    this.raycaster.setFromCamera(this.pointer, this.camera);

    const cameraHits = this.raycaster.intersectObjects(this.cameraRig.children, true);
    if (cameraHits.length > 0) {
      this.triggerCameraFlash();
      return;
    }

    const photoTargets = this.photosOnWall.map(p => p.picture);
    const photoHits = this.raycaster.intersectObjects(photoTargets);

    if (photoHits.length > 0) {
      const hitMesh = photoHits[0].object;
      const clicked = this.photosOnWall.find(p => p.picture === hitMesh);
      if (clicked) {
        const globalIdx = content.photography.photos.indexOf(clicked.data);
        this.openDiveInside(globalIdx >= 0 ? globalIdx : 0);
      }
    }
  }

  openDiveInside(photoIdx) {
    this.activePhotoIndex = photoIdx;
    const data = content.photography.photos[photoIdx];
    if (!data) return;

    this.renderBeforeAfterCanvases(data);

    document.getElementById('dive-title').textContent = data.title;
    document.getElementById('dive-place').textContent = `📍 ${data.place || "Secret Location"}`;
    document.getElementById('dive-story').textContent = data.story || "A moment captured in silence.";
    document.getElementById('dive-counter').textContent = `${photoIdx + 1} / ${content.photography.photos.length}`;

    const divider = document.getElementById('ba-wand-divider');
    const editedLayer = document.getElementById('ba-edited-layer');
    if (divider && editedLayer) {
      divider.style.left = '50%';
      editedLayer.style.clipPath = 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)';
    }

    const modal = document.getElementById('photo-dive-modal');
    modal?.classList.remove('hidden');

    if (!this.isReducedMotion) {
      gsap.fromTo(modal,
        { opacity: 0, scale: 0.85, rotate: -4 },
        { opacity: 1, scale: 1.0, rotate: 0, duration: 0.45, ease: 'power2.out' }
      );
    }
  }

  closeDiveInside() {
    this.activePhotoIndex = -1;
    document.getElementById('photo-dive-modal')?.classList.add('hidden');
  }

  cycleDivePhoto(dir) {
    let next = (this.activePhotoIndex + dir) % content.photography.photos.length;
    if (next < 0) next = content.photography.photos.length - 1;
    this.openDiveInside(next);
  }

  renderBeforeAfterCanvases(photoData) {
    const origCanvas = document.getElementById('canvas-original-img');
    const editCanvas = document.getElementById('canvas-edited-img');
    if (!origCanvas || !editCanvas) return;

    origCanvas.width = 960;
    origCanvas.height = 720;
    editCanvas.width = 960;
    editCanvas.height = 720;

    const oCtx = origCanvas.getContext('2d');
    const eCtx = editCanvas.getContext('2d');

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = photoData.src;

    const drawProcessed = (sourceImage) => {
      oCtx.drawImage(sourceImage, 0, 0, 960, 720);

      eCtx.filter = 'contrast(1.22) saturate(1.35) brightness(1.05)';
      eCtx.drawImage(sourceImage, 0, 0, 960, 720);
      eCtx.filter = 'none';

      const tint = eCtx.createRadialGradient(480, 360, 100, 480, 360, 600);
      tint.addColorStop(0, 'rgba(232, 176, 74, 0.12)');
      tint.addColorStop(1, 'rgba(10, 12, 24, 0.45)');
      eCtx.fillStyle = tint;
      eCtx.fillRect(0, 0, 960, 720);
    };

    img.onload = () => drawProcessed(img);
    img.onerror = () => {
      const fallback = this.createProceduralNatureCanvas(photoData.title, photoData.group);
      drawProcessed(fallback);
    };
  }

  enter() {
    this.group.visible = true;
    document.getElementById('photography-ui')?.classList.remove('hidden');

    if (this.photosOnWall.length === 0) {
      this.spawnPhotoWallBatch();
    }
  }

  exit() {
    this.closeDiveInside();
    document.getElementById('photography-ui')?.classList.add('hidden');
    this.group.visible = false;
  }

  update(time, delta, mouse) {
    if (!this.group.visible) return;

    this.cameraRig.position.y = 1.4 + Math.sin(time * 1.5) * 0.08;
    this.cameraRig.rotation.y = Math.sin(time * 0.8) * 0.12;

    if (this.snitchCamera && mouse) {
      this.snitchCamera.position.x += (mouse.x * 2.5 - this.snitchCamera.position.x) * 0.08;
      this.snitchCamera.position.y += (1.8 + mouse.y * 1.5 - this.snitchCamera.position.y) * 0.08;

      const flutter = Math.sin(time * 30.0) * 0.8;
      this.snitchWingL.rotation.y = flutter;
      this.snitchWingR.rotation.y = -flutter;
    }

    this.photosOnWall.forEach(p => {
      p.mat.uniforms.uTime.value = time;
    });
  }
}
