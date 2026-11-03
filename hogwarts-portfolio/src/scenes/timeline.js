import * as THREE from 'three';
import { content } from '../content.js';

export class TimelineScene {
  constructor(scene, camera, houseThemeManager) {
    this.scene = scene;
    this.camera = camera;
    this.houseTheme = houseThemeManager;

    this.group = new THREE.Group();
    // Positioned directly after Divination room at Z = -165
    this.group.position.set(0, 0, -165);
    this.scene.add(this.group);

    this.portraits = [];
    this.milestonePlacards = [];
    this.towerHeight = 48;

    this.init();
    this.initUI();
    this.setupThemeListener();
  }

  init() {
    this.buildCastleTowerWalls();
    this.buildWatchingPortraits();
    this.buildMilestoneCards();
  }

  buildCastleTowerWalls() {
    // 1. Procedural Castle Stone Brick Texture for Tower Walls
    const stoneCanvas = document.createElement('canvas');
    stoneCanvas.width = 512;
    stoneCanvas.height = 512;
    const ctx = stoneCanvas.getContext('2d');

    // Deep castle masonry base tone
    ctx.fillStyle = '#161a24';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = 'rgba(8, 11, 18, 0.65)';
    ctx.lineWidth = 3;
    for (let y = 0; y < 512; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();

      const offset = (y / 40) % 2 === 0 ? 0 : 35;
      for (let x = offset; x < 512; x += 70) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 40);
        ctx.stroke();
      }
    }

    const stoneTex = new THREE.CanvasTexture(stoneCanvas);
    stoneTex.wrapS = THREE.RepeatWrapping;
    stoneTex.wrapT = THREE.RepeatWrapping;
    stoneTex.repeat.set(6, 6);

    const towerMat = new THREE.MeshStandardMaterial({
      map: stoneTex,
      roughness: 0.85,
      metalness: 0.1,
      side: THREE.BackSide,
      emissive: 0x0c0f17,
      emissiveIntensity: 0.2
    });

    // Cylindrical tower enclosure
    const towerGeo = new THREE.CylinderGeometry(18, 18, this.towerHeight, 32, 1, true);
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.y = this.towerHeight / 2 - 4;
    this.group.add(tower);

    // Tower Foundation Floor
    const floorMat = new THREE.MeshStandardMaterial({
      map: stoneTex,
      roughness: 0.7,
      metalness: 0.15,
      emissive: 0x0a0c14,
      emissiveIntensity: 0.2
    });
    const towerFloor = new THREE.Mesh(new THREE.CircleGeometry(18, 32), floorMat);
    towerFloor.rotation.x = -Math.PI / 2;
    towerFloor.position.y = -3.8;
    this.group.add(towerFloor);

    // 2. Controlled Ambient Lighting (Atmospheric castle gloom without pitch-black void)
    const amb = new THREE.AmbientLight(0xd4dcee, 0.95);
    this.group.add(amb);

    const hemi = new THREE.HemisphereLight(0x283852, 0x1f1610, 0.75);
    this.group.add(hemi);

    // Soft, distant warm torchlight along the tower shaft
    const levels = [2, 10, 18];
    levels.forEach((y) => {
      const centerLight = new THREE.PointLight(0xffbe58, 2.2, 32, 1.4);
      centerLight.position.set(0, y, 0);
      this.group.add(centerLight);
    });
  }

  buildWatchingPortraits() {
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0xc89b38,
      roughness: 0.35,
      metalness: 0.85,
      emissive: 0x3d2706,
      emissiveIntensity: 0.25
    });

    const canvasMat = new THREE.MeshStandardMaterial({
      color: 0x181e28,
      roughness: 0.85,
      emissive: 0x0a0e16,
      emissiveIntensity: 0.2
    });

    const portraitConfigs = [
      { pos: [-14.5, 4.0, -3.0], rotY: Math.PI / 2 },
      { pos: [14.5, 6.0, -2.0], rotY: -Math.PI / 2 },
      { pos: [-14.5, 12.0, 2.0], rotY: Math.PI / 2 },
      { pos: [14.5, 15.0, 3.0], rotY: -Math.PI / 2 },
      { pos: [0.0, 22.0, -14.5], rotY: 0 }
    ];

    portraitConfigs.forEach((cfg) => {
      const g = new THREE.Group();
      g.position.set(...cfg.pos);
      g.rotation.y = cfg.rotY;

      const frame = new THREE.Mesh(new THREE.BoxGeometry(3.6, 4.8, 0.2), frameMat);
      g.add(frame);

      const canvas = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 4.2), canvasMat);
      canvas.position.z = 0.12;
      g.add(canvas);

      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const pupilMat = new THREE.MeshBasicMaterial({ color: 0x070b1a });

      const eyeL = new THREE.Mesh(new THREE.CircleGeometry(0.12, 16), eyeMat);
      eyeL.position.set(-0.35, 0.6, 0.14);
      const pupilL = new THREE.Mesh(new THREE.CircleGeometry(0.055, 16), pupilMat);
      pupilL.position.set(0, 0, 0.01);
      eyeL.add(pupilL);

      const eyeR = new THREE.Mesh(new THREE.CircleGeometry(0.12, 16), eyeMat);
      eyeR.position.set(0.35, 0.6, 0.14);
      const pupilR = new THREE.Mesh(new THREE.CircleGeometry(0.055, 16), pupilMat);
      pupilR.position.set(0, 0, 0.01);
      eyeR.add(pupilR);

      g.add(eyeL, eyeR);
      this.group.add(g);
      this.portraits.push({ pupilL, pupilR });
    });
  }

  buildMilestoneCards() {
    const milestones = content.timeline.milestones;
    const layout = [
      { year: "2022", x: -2.4, y: 1.4,  z: 0.0, rotY: 0.15 },
      { year: "2023", x:  2.4, y: 5.4,  z: 0.0, rotY: -0.15 },
      { year: "2024", x: -2.4, y: 9.6,  z: 0.0, rotY: 0.15 },
      { year: "2025", x:  2.4, y: 13.8, z: 0.0, rotY: -0.15 },
      { year: "2026", x:  0.0, y: 18.0, z: 0.0, rotY: 0.0 }
    ];

    milestones.forEach((item, idx) => {
      const cfg = layout[idx];
      const cardGroup = new THREE.Group();
      cardGroup.position.set(cfg.x, cfg.y, cfg.z);
      cardGroup.rotation.y = cfg.rotY;

      // Solid stone landing platform
      const padMat = new THREE.MeshStandardMaterial({
        color: 0x2e3545,
        roughness: 0.6,
        metalness: 0.18,
        emissive: 0x121722,
        emissiveIntensity: 0.25
      });
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.35, 24), padMat);
      pad.position.y = -1.2;
      cardGroup.add(pad);

      // Milestone Placard Texture
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#0a0d18';
      ctx.fillRect(0, 0, 1024, 600);

      // Gold outer borders
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 14;
      ctx.strokeRect(18, 18, 988, 564);

      ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
      ctx.lineWidth = 4;
      ctx.strokeRect(32, 32, 960, 536);

      // Year Header (clean, sharp, no nuclear bloom blur)
      ctx.font = "900 110px 'Cinzel', serif";
      ctx.fillStyle = '#f5d275';
      ctx.textAlign = 'center';
      ctx.fillText(item.year, 512, 145);

      // Milestone Title
      ctx.font = "bold 52px 'Cinzel', serif";
      ctx.fillStyle = '#ffffff';
      ctx.fillText(item.title, 512, 250);

      // Accent gold divider line
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(362, 285, 300, 3);

      // Description text (high readability)
      ctx.font = "400 38px 'Lora', serif";
      ctx.fillStyle = '#e8dec5';
      this.wrapCanvasText(ctx, item.desc, 512, 370, 840, 54);

      const tex = new THREE.CanvasTexture(canvas);
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;

      // Matte, clear material with ZERO blinding specular reflection
      const cardMat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true
      });

      const cardMesh = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 2.9), cardMat);
      cardMesh.position.y = 0.6;
      cardGroup.add(cardMesh);

      this.group.add(cardGroup);
      this.milestonePlacards.push({
        group: cardGroup,
        mesh: cardMesh,
        yWorld: cfg.y
      });
    });
  }

  wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight) {
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

  setupThemeListener() {
    // Milestone cards now rely on pure clean parchment styling
    // to preserve razor-sharp legibility across all houses.
  }

  initUI() {
    let el = document.getElementById('timeline-ui');
    if (!el) {
      el = document.createElement('div');
      el.id = 'timeline-ui';
      document.body.appendChild(el);
    }
    el.className = 'timeline-ui hidden';
    el.innerHTML = `
      <div class="timeline-title-card">
        <h2 class="timeline-heading">${content.timeline.title}</h2>
        <p class="timeline-subheading">${content.timeline.subtitle}</p>
      </div>

      <ol class="timeline-screen-reader-list">
        ${content.timeline.milestones.map(m => `
          <li class="timeline-sr-item">
            <span class="sr-year">${m.year}</span>
            <strong class="sr-title">${m.title}</strong>
            <p class="sr-desc">${m.desc}</p>
          </li>
        `).join('')}
      </ol>
    `;
  }

  onEnterRoom() {
    this.group.visible = true;
    document.getElementById('timeline-ui')?.classList.remove('hidden');
  }

  onLeaveRoom() {
    document.getElementById('timeline-ui')?.classList.add('hidden');
    // Group visibility is managed smoothly across transitions by main.js
  }

  update(time, mouseParallax) {
    if (!this.group.visible) return;

    if (mouseParallax) {
      const pX = THREE.MathUtils.clamp(mouseParallax.x * 0.05, -0.05, 0.05);
      const pY = THREE.MathUtils.clamp(mouseParallax.y * 0.05, -0.05, 0.05);

      this.portraits.forEach(p => {
        p.pupilL.position.x = pX;
        p.pupilL.position.y = pY;
        p.pupilR.position.x = pX;
        p.pupilR.position.y = pY;
      });
    }

    const camY = this.camera.position.y;
    this.milestonePlacards.forEach(m => {
      const dist = Math.abs(camY - m.yWorld);
      // Subtle scaling focus without color distortion or text blinding
      const focus = THREE.MathUtils.clamp(1.0 - (dist / 6.0), 0.88, 1.0);
      m.mesh.scale.set(focus, focus, 1.0);
    });
  }
}
