import * as THREE from 'three';
import gsap from 'gsap';
import { SkillBase } from './skillBase.js';

export class WebSkill extends SkillBase {
  init(alcovePosition) {
    this.group.position.copy(alcovePosition);
    this.group.visible = false;

    this.potionBottles = [];
    this.bubbles = [];
    this.pageGroup = new THREE.Group();
    this.cauldronLight = null;
    this.cauldronLiquidMat = null;
    this.pageCanvas = null;
    this.pageCtx = null;
    this.pageTex = null;
    this.activeTheme = 0;

    this.themes = [
      { name: "Pink Spell", hex: 0xff5e7e, cssH: "#ff5e7e", cssB: "#3d1320" },
      { name: "Teal Elixir", hex: 0x00d2d3, cssH: "#00d2d3", cssB: "#092f33" },
      { name: "Purple Draught", hex: 0xa55eea, cssH: "#a55eea", cssB: "#27123d" }
    ];

    this.buildPotionsTable();
    this.buildCauldronAndBubbles();
    this.buildInteractivePotionPhials();
    this.buildAssemblingHoloWebpage();
    this.setupPotionClickEvents();
  }

  buildPotionsTable() {
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x2e1910,
      roughness: 0.75,
      metalness: 0.1
    });

    const dais = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.7, 0.4, 24), woodMat);
    dais.position.y = -1.2;
    this.group.add(dais);

    const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 0.16, 24), woodMat);
    tableTop.position.y = -0.55;
    this.group.add(tableTop);
  }

  buildCauldronAndBubbles() {
    const ironMat = new THREE.MeshStandardMaterial({
      color: 0x18181f,
      roughness: 0.85,
      metalness: 0.5
    });

    // Cast iron cauldron
    const cauldron = new THREE.Mesh(new THREE.SphereGeometry(0.72, 24, 20, 0, Math.PI * 2, 0, Math.PI / 1.4), ironMat);
    cauldron.rotation.x = Math.PI;
    cauldron.position.set(0, -0.15, 0);
    this.group.add(cauldron);

    // Swirling cauldron liquid
    this.cauldronLiquidMat = new THREE.MeshStandardMaterial({
      color: this.themes[0].hex,
      emissive: this.themes[0].hex,
      emissiveIntensity: 0.85,
      roughness: 0.2
    });

    const liquid = new THREE.Mesh(new THREE.CircleGeometry(0.64, 24), this.cauldronLiquidMat);
    liquid.rotation.x = -Math.PI / 2;
    liquid.position.set(0, -0.05, 0);
    this.group.add(liquid);

    // Rising potion bubbles
    const bubbleGeo = new THREE.SphereGeometry(0.045, 8, 8);
    const bubbleMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 });

    for (let i = 0; i < 18; i++) {
      const b = new THREE.Mesh(bubbleGeo, bubbleMat);
      b.position.set((Math.random() - 0.5) * 0.8, -0.05, (Math.random() - 0.5) * 0.8);
      b.userData = {
        speed: 0.8 + Math.random() * 1.2,
        origY: -0.05,
        wobble: Math.random() * Math.PI * 2
      };
      this.group.add(b);
      this.bubbles.push(b);
    }

    this.cauldronLight = new THREE.PointLight(this.themes[0].hex, 4.5, 8.0, 1.2);
    this.cauldronLight.position.set(0, 0.4, 0);
    this.group.add(this.cauldronLight);
  }

  buildInteractivePotionPhials() {
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.9,
      opacity: 1.0,
      transparent: true,
      roughness: 0.1,
      ior: 1.45,
      thickness: 1.2
    });

    this.themes.forEach((th, idx) => {
      const g = new THREE.Group();
      const x = -1.1 + idx * 1.1;
      const z = -0.75;
      g.position.set(x, -0.3, z);

      // Glass Bottle
      const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.55, 16), glassMat);
      bottle.userData = { themeIdx: idx };
      g.add(bottle);

      // Colored potion fluid inside
      const liquidMat = new THREE.MeshStandardMaterial({
        color: th.hex,
        emissive: th.hex,
        emissiveIntensity: 0.75,
        roughness: 0.3
      });
      const fluid = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 0.42, 14), liquidMat);
      fluid.position.y = -0.05;
      g.add(fluid);

      // Cork stopper
      const cork = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.07, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x6e452a, roughness: 0.9 })
      );
      cork.position.y = 0.3;
      g.add(cork);

      this.group.add(g);
      this.potionBottles.push({ group: g, bottle, data: th });
    });
  }

  buildAssemblingHoloWebpage() {
    this.pageGroup.position.set(0, 1.35, 0);
    this.pageGroup.scale.set(0.001, 0.001, 0.001);

    this.pageCanvas = document.createElement('canvas');
    this.pageCanvas.width = 720;
    this.pageCanvas.height = 480;
    this.pageCtx = this.pageCanvas.getContext('2d');
    this.renderWebpageCanvas();

    this.pageTex = new THREE.CanvasTexture(this.pageCanvas);
    const screenMat = new THREE.MeshBasicMaterial({
      map: this.pageTex,
      transparent: true,
      opacity: 0.95
    });

    const pageMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.6), screenMat);
    this.pageGroup.add(pageMesh);

    this.group.add(this.pageGroup);
  }

  renderWebpageCanvas() {
    const ctx = this.pageCtx;
    if (!ctx) return;
    const th = this.themes[this.activeTheme];

    // Web Browser Window Frame
    ctx.fillStyle = '#0a0d18';
    ctx.fillRect(0, 0, 720, 480);

    // Browser Chrome Bar
    ctx.fillStyle = '#161b2a';
    ctx.fillRect(0, 0, 720, 44);

    // Window control buttons
    ['#ff5f56', '#ffbd2e', '#27c93f'].forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(24 + i * 22, 22, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    // Hero Section with dynamic stylesheet colors
    ctx.fillStyle = th.cssB;
    ctx.fillRect(30, 70, 660, 200);

    ctx.fillStyle = th.cssH;
    ctx.font = "bold 38px 'Cinzel', serif";
    ctx.fillText("Nirman Project", 60, 140);

    ctx.fillStyle = '#ffffff';
    ctx.font = "20px 'Lora', serif";
    ctx.fillText("Dynamic stylesheet compiled from cauldron brew.", 60, 185);

    // Live CSS Styled Button
    ctx.fillStyle = th.cssH;
    ctx.beginPath();
    ctx.roundRect(60, 210, 180, 44, 8);
    ctx.fill();

    ctx.fillStyle = '#0a0d18';
    ctx.font = "bold 18px sans-serif";
    ctx.fillText("Inspect Element", 82, 238);

    // CSS Code Snippet below
    ctx.fillStyle = '#101422';
    ctx.fillRect(30, 290, 660, 160);

    ctx.fillStyle = '#61afef';
    ctx.font = "18px monospace";
    ctx.fillText(":root {", 50, 325);
    ctx.fillStyle = th.cssH;
    ctx.fillText(`  --accent-glow: ${th.cssH};`, 50, 355);
    ctx.fillText(`  --theme-bg: ${th.cssB};`, 50, 385);
    ctx.fillStyle = '#61afef';
    ctx.fillText("}", 50, 415);

    if (this.pageTex) this.pageTex.needsUpdate = true;
  }

  setupPotionClickEvents() {
    const el = document.getElementById('webgl-container');
    if (!el) return;

    const raycaster = new THREE.Raycaster();
    const mousePos = new THREE.Vector2();

    el.addEventListener('pointerdown', (e) => {
      if (!this.isEntered) return;
      mousePos.x = (e.clientX / window.innerWidth) * 2 - 1;
      mousePos.y = -(e.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mousePos, this.camera);
      const meshes = this.potionBottles.map(p => p.bottle);
      const hits = raycaster.intersectObjects(meshes);

      if (hits.length > 0) {
        const nextTheme = hits[0].object.userData.themeIdx;
        this.switchPotionColor(nextTheme);
      }
    });
  }

  switchPotionColor(themeIdx) {
    this.activeTheme = themeIdx;
    const th = this.themes[themeIdx];

    // Cauldron fluid color shift
    gsap.to(this.cauldronLiquidMat.color, {
      r: (th.hex >> 16 & 255) / 255,
      g: (th.hex >> 8 & 255) / 255,
      b: (th.hex & 255) / 255,
      duration: 0.8
    });
    gsap.to(this.cauldronLight.color, {
      r: (th.hex >> 16 & 255) / 255,
      g: (th.hex >> 8 & 255) / 255,
      b: (th.hex & 255) / 255,
      duration: 0.8
    });

    // Update webpage hologram
    this.renderWebpageCanvas();
    gsap.timeline()
      .to(this.pageGroup.scale, { x: 1.1, y: 1.1, duration: 0.15 })
      .to(this.pageGroup.scale, { x: 1.0, y: 1.0, duration: 0.3 });
  }

  enter() {
    super.enter();
    this.group.visible = true;

    // Assembling webpage hologram emerges out of bubbling cauldron smoke
    this.pageGroup.scale.set(0.001, 0.001, 0.001);
    gsap.to(this.pageGroup.scale, {
      x: 1, y: 1, z: 1,
      duration: 1.4,
      delay: 0.3,
      ease: 'back.out(1.4)'
    });
  }

  exit() {
    super.exit();
    this.pageGroup.scale.set(0.001, 0.001, 0.001);
  }

  update(time, delta, mouse) {
    if (!this.isEntered) return;

    // Rising cauldron bubbles
    this.bubbles.forEach(b => {
      b.position.y += delta * b.userData.speed;
      b.position.x += Math.sin(time * 3.0 + b.userData.wobble) * 0.005;

      if (b.position.y > 0.85) {
        b.position.y = b.userData.origY;
      }
    });

    // Wobbling potion bottles
    this.potionBottles.forEach((p, i) => {
      p.group.rotation.z = Math.sin(time * 2.0 + i) * 0.04;
    });

    // Webpage floating gently in smoke
    this.pageGroup.position.y = 1.35 + Math.sin(time * 1.8) * 0.06;
  }
}