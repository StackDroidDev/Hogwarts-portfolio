import * as THREE from 'three';
import gsap from 'gsap';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { content } from '../content.js';

export class Part1Hall {
  constructor(scene, camera, lighting) {
    this.scene = scene;
    this.camera = camera;
    this.lighting = lighting;

    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.candles = [];
    this.candleGroup = new THREE.Group();
    this.group.add(this.candleGroup);

    this.solidTextGroup = null;
    this.canvasPlane = null;
    this.wandGroup = null;
    this.wandTipLight = null;
    this.flashLight = null;
    this.cursorLight = null;
    this.dustParticles = null;
    this.timeline = null;

    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.init();
  }

  init() {
    this.buildCanvasStrokePlane();
    this.build3DReflectiveText();
    this.buildWand();
    this.buildCandles();
    this.buildDustParticles();
    this.buildCursorLight();
  }

  buildCanvasStrokePlane() {
    this.drawCanvas = document.createElement('canvas');
    this.drawCanvas.width = 2048;
    this.drawCanvas.height = 1024;
    this.drawCtx = this.drawCanvas.getContext('2d');

    this.canvasTexture = new THREE.CanvasTexture(this.drawCanvas);
    this.canvasTexture.minFilter = THREE.LinearFilter;
    this.canvasTexture.magFilter = THREE.LinearFilter;

    const planeMat = new THREE.MeshBasicMaterial({
      map: this.canvasTexture,
      transparent: true,
      opacity: 0,
      depthWrite: false
    });

    this.canvasPlane = new THREE.Mesh(new THREE.PlaneGeometry(9.5, 4.75), planeMat);
    this.canvasPlane.position.set(0, 0, 0.05);
    this.group.add(this.canvasPlane);
  }

  build3DReflectiveText() {
    this.solidTextGroup = new THREE.Group();
    this.solidTextGroup.position.set(0, 0, 0);

    // Highly reflective physical gold material that gleams under the cursor light
    this.goldTextMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.88,
      roughness: 0.16,
      emissive: 0x3d2906,
      emissiveIntensity: 0.28,
      transparent: true,
      opacity: 0
    });

    const loader = new FontLoader();
    loader.load(
      'https://threejs.org/examples/fonts/helvetiker_bold.typeface.json',
      (font) => {
        const textGeo = new TextGeometry(content.name.toUpperCase(), {
          font: font,
          size: 0.92,
          height: 0.16,
          curveSegments: 12,
          bevelEnabled: true,
          bevelThickness: 0.04,
          bevelSize: 0.02,
          bevelSegments: 5
        });

        textGeo.computeBoundingBox();
        const centerOffset = -0.5 * (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x);
        textGeo.translate(centerOffset, -0.4, 0);

        const textMesh = new THREE.Mesh(textGeo, this.goldTextMat);
        this.solidTextGroup.add(textMesh);
      },
      undefined,
      () => {
        // Fallback canvas-rendered 3D plane if webfont network fails
        const fallbackCanvas = document.createElement('canvas');
        fallbackCanvas.width = 2048;
        fallbackCanvas.height = 512;
        const fCtx = fallbackCanvas.getContext('2d');
        fCtx.fillStyle = '#d4af37';
        fCtx.font = "bold 150px 'Cinzel', serif";
        fCtx.textAlign = 'center';
        fCtx.fillText(content.name.toUpperCase(), 1024, 300);

        const tex = new THREE.CanvasTexture(fallbackCanvas);
        const mesh = new THREE.Mesh(
          new THREE.PlaneGeometry(9.0, 2.25),
          new THREE.MeshStandardMaterial({
            map: tex,
            transparent: true,
            metalness: 0.85,
            roughness: 0.2
          })
        );
        mesh.position.set(0, 0, 0);
        this.solidTextGroup.add(mesh);
      }
    );

    this.group.add(this.solidTextGroup);
  }

  buildWand() {
    this.wandGroup = new THREE.Group();

    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x2b1810,
      roughness: 0.6,
      metalness: 0.1
    });

    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.045, 1.4, 12), woodMat);
    shaft.rotation.z = Math.PI / 3;
    this.wandGroup.add(shaft);

    this.wandTipLight = new THREE.PointLight(0xfff1c2, 0, 4.5, 1.2);
    this.wandTipLight.position.set(0.6, 0.35, 0);
    this.wandGroup.add(this.wandTipLight);

    this.flashLight = new THREE.PointLight(0xfffae6, 0, 16.0, 1.0);
    this.flashLight.position.set(0, 0, 1.2);
    this.group.add(this.flashLight);

    this.group.add(this.wandGroup);
  }

  buildCandles() {
    this.candles = [];
    this.candleGroup.clear();

    const waxMat = new THREE.MeshStandardMaterial({
      color: 0xf5eedb,
      roughness: 0.35,
      metalness: 0.05,
      emissive: 0x221a0f,
      emissiveIntensity: 0.2
    });

    const flameMat = new THREE.MeshBasicMaterial({
      color: 0xffdf78,
      transparent: true,
      opacity: 0.95
    });

    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xffa41c,
      transparent: true,
      opacity: 0.38,
      blending: THREE.AdditiveBlending
    });

    const candleCount = 42;

    for (let i = 0; i < candleCount; i++) {
      const g = new THREE.Group();

      // Symmetrical distribution (-6.5 to +6.5) so candles are not skewed to the right
      const u = (i / (candleCount - 1)) - 0.5;
      const spreadX = u * 13.0 + (Math.random() - 0.5) * 1.2;
      const spreadY = -0.5 + Math.random() * 3.4;
      const spreadZ = -1.5 + (Math.random() - 0.5) * 3.2;

      g.position.set(spreadX, spreadY, spreadZ);

      const height = 0.5 + Math.random() * 0.7;
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, height, 10), waxMat);
      g.add(body);

      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.14, 8), flameMat);
      flame.position.y = height / 2 + 0.08;
      g.add(flame);

      const halo = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), haloMat);
      halo.position.copy(flame.position);
      g.add(halo);

      this.candleGroup.add(g);

      this.candles.push({
        group: g,
        baseY: spreadY,
        speed: 1.2 + Math.random() * 1.4,
        offset: Math.random() * Math.PI * 2
      });
    }
  }

    buildDustParticles() {
    // Generate smooth circular particle disc texture on canvas (eliminates square pixel blocks)
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 64;
    pCanvas.height = 64;
    const pCtx = pCanvas.getContext('2d');

    const grad = pCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 230, 160, 1.0)');
    grad.addColorStop(0.35, 'rgba(232, 176, 74, 0.6)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    pCtx.fillStyle = grad;
    pCtx.beginPath();
    pCtx.arc(32, 32, 32, 0, Math.PI * 2);
    pCtx.fill();

    const pTex = new THREE.CanvasTexture(pCanvas);

    const count = 280;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
      pos[i] = (Math.random() - 0.5) * 16;
      pos[i + 1] = (Math.random() - 0.5) * 8;
      pos[i + 2] = -2.0 + (Math.random() - 0.5) * 14;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const mat = new THREE.PointsMaterial({
      map: pTex,
      size: 0.14,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.dustParticles = new THREE.Points(geo, mat);
    this.group.add(this.dustParticles);
  }


  buildCursorLight() {
    // Lumos cursor light that illuminates the 3D gold letters as you hover
    this.cursorLight = new THREE.PointLight(0xffbe58, 8.5, 7.5, 1.2);
    this.cursorLight.position.set(0, 0, 0.95);
    this.group.add(this.cursorLight);
  }

  renderWritingStroke(progress) {
    const ctx = this.drawCtx;
    if (!ctx) return;

    ctx.clearRect(0, 0, 2048, 1024);

    const text = content.name.toUpperCase();
    ctx.font = "bold 150px 'Cinzel', serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Glowing spark trail
    ctx.shadowColor = '#ffe484';
    ctx.shadowBlur = 24;
    ctx.strokeStyle = '#f8d27a';
    ctx.lineWidth = 14;

    const totalLen = text.length;
    const currentChars = Math.min(Math.floor(progress * totalLen) + 1, totalLen);
    const partialText = text.substring(0, currentChars);

    ctx.strokeText(partialText, 1024, 512);

    // Wand tip follows character progress
    const wandX = -3.8 + (progress * 7.6);
    const wandY = 0.0 + Math.sin(progress * Math.PI * 4) * 0.15;
    if (this.wandGroup) {
      this.wandGroup.position.set(wandX, wandY, 0.45);
    }

    this.canvasTexture.needsUpdate = true;
  }

  startSequence() {
    if (this.timeline) this.timeline.kill();

    const roleEl = document.getElementById('role-subtitle');
    const hintEl = document.getElementById('scroll-hint');
    const hintText = hintEl?.querySelector('.hint-text');

    if (roleEl) roleEl.textContent = content.role || "APP DEVELOPER • PHOTOGRAPHER";
    if (hintText) hintText.textContent = content.navigationHint || "Scroll to meet the Sorting Hat";

    if (this.isReducedMotion) {
      this.camera.position.set(0, 0, 7.5);
      this.camera.lookAt(0, 0, 0);
      if (this.goldTextMat) this.goldTextMat.opacity = 1;
      if (this.canvasPlane) this.canvasPlane.material.opacity = 0;
      if (roleEl) gsap.to(roleEl, { opacity: 1, y: 0, duration: 0.5 });
      if (hintEl) gsap.to(hintEl, { opacity: 1, y: 0, duration: 0.5, delay: 0.2 });
      return;
    }

    this.drawCtx.clearRect(0, 0, 2048, 1024);
    this.canvasTexture.needsUpdate = true;
    this.canvasPlane.material.opacity = 1;
    if (this.goldTextMat) this.goldTextMat.opacity = 0;

    const startX = -4.0;
    this.wandGroup.position.set(startX, 0.0, 0.45);
    this.wandGroup.scale.set(0.001, 0.001, 0.001);
    this.wandTipLight.intensity = 0;

    if (roleEl) gsap.set(roleEl, { opacity: 0, y: 14 });
    if (hintEl) gsap.set(hintEl, { opacity: 0, y: 14 });

    this.camera.position.set(0, 0, 8.5);
    this.camera.lookAt(0, 0, 0);

    const tl = gsap.timeline();
    this.timeline = tl;

    // Camera push-in begins immediately
    tl.to(this.camera.position, {
      z: 7.5,
      duration: 1.4,
      ease: 'power2.out'
    }, 0);

    // Wand appears instantly and ignites
    tl.to(this.wandGroup.scale, {
      x: 1, y: 1, z: 1,
      duration: 0.2,
      ease: 'power2.out'
    }, 0);

    tl.to(this.wandTipLight, {
      intensity: 3.2,
      duration: 0.2,
      ease: 'power2.out'
    }, 0.05);

    // Wand spontaneously writes the name
    const writeProgress = { t: 0 };
    tl.to(writeProgress, {
      t: 1,
      duration: 1.6,
      ease: 'power1.inOut',
      onUpdate: () => {
        this.renderWritingStroke(writeProgress.t);
      }
    }, 0.1);

    // Flash burst and reveal of 3D reflective gold letters
    tl.to(this.flashLight, {
      intensity: 7.0,
      duration: 0.12,
      ease: 'power2.in'
    }, 1.7);

    tl.to(this.canvasPlane.material, { opacity: 0, duration: 0.2 }, 1.8);

    tl.to(this.goldTextMat, {
      opacity: 1,
      duration: 0.25,
      ease: 'power1.out',
      onComplete: () => {
        if (this.solidTextGroup) this.solidTextGroup.visible = true;
      }
    }, 1.8);

    tl.to(this.flashLight, {
      intensity: 0,
      duration: 0.5,
      ease: 'power2.out'
    }, 1.82);

    tl.to(this.wandGroup.scale, {
      x: 0, y: 0, z: 0,
      duration: 0.3,
      ease: 'power2.in'
    }, 1.85);

    // Role Subtitle fades in ("APP DEVELOPER • PHOTOGRAPHER")
    if (roleEl) {
      tl.to(roleEl, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power2.out'
      }, 1.95);
    }

    // Scroll Hint fades in ("Scroll to meet the Sorting Hat")
    if (hintEl) {
      tl.to(hintEl, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power2.out'
      }, 2.15);
    }
  }

  skipToEnd() {
    if (this.timeline) this.timeline.kill();

    this.camera.position.set(0, 0, 7.5);
    this.camera.lookAt(0, 0, 0);

    if (this.canvasPlane) this.canvasPlane.material.opacity = 0;
    if (this.goldTextMat) this.goldTextMat.opacity = 1;
    if (this.wandGroup) this.wandGroup.scale.set(0, 0, 0);
    if (this.flashLight) this.flashLight.intensity = 0;

    const roleEl = document.getElementById('role-subtitle');
    const hintEl = document.getElementById('scroll-hint');

    if (roleEl) gsap.to(roleEl, { opacity: 1, y: 0, duration: 0.3 });
    if (hintEl) gsap.to(hintEl, { opacity: 1, y: 0, duration: 0.3 });
  }

  update(delta, time, mouseParallax) {
    // 1. Floating Candles
    if (this.candles && Array.isArray(this.candles)) {
      for (let i = 0; i < this.candles.length; i++) {
        const c = this.candles[i];
        if (!c || !c.group) continue;
        
        const baseY = c.baseY ?? c.group.position.y ?? 0;
        const speed = c.speed ?? 1.2;
        const offset = c.offset ?? i;

        c.group.position.y = baseY + Math.sin(time * speed + offset) * 0.12;
      }
    }

    // 2. Floating Dust
    if (this.dustParticles) {
      this.dustParticles.rotation.y = time * 0.02;
    }

    // 3. Mouse Parallax & Wand Cursor Specular Reflection
    if (mouseParallax) {
      if (this.cursorLight) {
        const targetLightX = mouseParallax.x * 4.6;
        const targetLightY = mouseParallax.y * 1.5;

        this.cursorLight.position.x += (targetLightX - this.cursorLight.position.x) * 0.1;
        this.cursorLight.position.y += (targetLightY - this.cursorLight.position.y) * 0.1;
        // Keep Z close to the letters (Z = 0.95) so the light gleams across the metallic letters
        this.cursorLight.position.z = 0.95;
        this.cursorLight.intensity = 9.5 + Math.sin(time * 10.0) * 0.8;
      }

      const targetCamX = mouseParallax.x * 1.4;
      const targetCamY = mouseParallax.y * 0.8;
      this.camera.position.x += (targetCamX - this.camera.position.x) * 0.05;
      this.camera.position.y += (targetCamY - this.camera.position.y) * 0.05;
      this.camera.lookAt(0, 0, 0);
    }
  }
}
