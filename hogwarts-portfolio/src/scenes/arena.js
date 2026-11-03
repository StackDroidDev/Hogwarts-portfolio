import * as THREE from 'three';
import gsap from 'gsap';
import { content } from '../content.js';

export class ArenaScene {
  constructor(scene, camera, houseThemeManager) {
    this.scene = scene;
    this.camera = camera;
    this.houseTheme = houseThemeManager;

    this.group = new THREE.Group();
    // Positioned out in the open night arena after Projects Gallery
    this.group.position.set(0, 0, -400);
    this.scene.add(this.group);

    this.gates = [];
    this.emeraldTorches = [];
    this.triwizardCup = null;
    this.cupGlow = null;
    this.activeGateIndex = -1;

    this.init();
    this.initUI();
    this.setupThemeListener();
  }

  init() {
    this.buildNightArenaSkyAndGround();
    this.buildGreenFireBraziers();
    this.buildHedgeMazeGates();
    this.buildTriwizardCupPedestal();
  }

  buildNightArenaSkyAndGround() {
    // 1. Procedural Fine Ashlar / Dark Rock Floor
    const stoneCanvas = document.createElement('canvas');
    stoneCanvas.width = 512;
    stoneCanvas.height = 512;
    const ctx = stoneCanvas.getContext('2d');

    ctx.fillStyle = '#141d1a';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = 'rgba(28, 48, 38, 0.45)';
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
    stoneTex.repeat.set(8, 8);

    // Midnight Stadium Ground
    const groundMat = new THREE.MeshStandardMaterial({
      map: stoneTex,
      roughness: 0.8,
      metalness: 0.1,
      emissive: 0x0c1410,
      emissiveIntensity: 0.35
    });

    const ground = new THREE.Mesh(new THREE.CircleGeometry(32, 48), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -2.4, -10);
    ground.receiveShadow = true;
    this.group.add(ground);

    // Surrounding Stone Stadium Colosseum Enclosure
    const wallGeo = new THREE.CylinderGeometry(32, 32, 22, 36, 1, true);
    const wallMat = new THREE.MeshStandardMaterial({
      map: stoneTex,
      roughness: 0.75,
      metalness: 0.12,
      side: THREE.BackSide,
      emissive: 0x0d1612,
      emissiveIntensity: 0.35
    });
    const stadiumWall = new THREE.Mesh(wallGeo, wallMat);
    stadiumWall.position.set(0, 8.5, -10);
    this.group.add(stadiumWall);

    // 2. Comprehensive Night Moonlit Illumination (Cures total darkness)
    const amb = new THREE.AmbientLight(0xd4e4f7, 1.85);
    this.group.add(amb);

    const hemi = new THREE.HemisphereLight(0x35526e, 0x1f3627, 1.3);
    this.group.add(hemi);

    // Moonlight directional key light
    const moonLight = new THREE.DirectionalLight(0xa5c9eb, 1.2);
    moonLight.position.set(10, 24, 15);
    this.group.add(moonLight);
  }

  buildGreenFireBraziers() {
    const bowlMat = new THREE.MeshStandardMaterial({
      color: 0x22262d,
      roughness: 0.5,
      metalness: 0.85,
      emissive: 0x11161d,
      emissiveIntensity: 0.25
    });

    const flameMat = new THREE.MeshBasicMaterial({
      color: 0x2ecc71,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending
    });

    const brazierPositions = [
      [-14, -1.0, 15],  [14, -1.0, 15],
      [-14, -1.0, -5],  [14, -1.0, -5],
      [-14, -1.0, -20], [14, -1.0, -20],
      [-14, -1.0, -35], [14, -1.0, -35]
    ];

    brazierPositions.forEach(([x, y, z]) => {
      const g = new THREE.Group();
      g.position.set(x, y, z);

      // Stone Plinth & Iron Bowl
      const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 1.4, 14), bowlMat);
      const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.7, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), bowlMat);
      bowl.position.y = 0.7;
      g.add(plinth, bowl);

      // Green Fire Flame Core
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.38, 1.25, 10), flameMat);
      flame.position.y = 1.25;
      g.add(flame);

      const fireLight = new THREE.PointLight(0x2ecc71, 3.8, 18, 1.2);
      fireLight.position.set(0, 1.5, 0);
      g.add(fireLight);

      this.group.add(g);
      this.emeraldTorches.push({ flame, light: fireLight });
    });
  }

  buildHedgeMazeGates() {
    const hedgeMat = new THREE.MeshStandardMaterial({
      color: 0x1b4028,
      roughness: 0.85,
      metalness: 0.05,
      emissive: 0x0c2114,
      emissiveIntensity: 0.35
    });

    // Repositioned further forward along Z so the camera NEVER clips into them
    const gateZPositions = [5, -16];

    content.hackathons.forEach((hack, idx) => {
      const z = gateZPositions[idx];
      const gateGroup = new THREE.Group();
      gateGroup.position.set(0, 0, z);

      // Shifting Hedge Maze Walls (Left & Right Wings)
      const wallGeo = new THREE.BoxGeometry(6.2, 5.8, 1.2);
      const wallL = new THREE.Mesh(wallGeo, hedgeMat);
      wallL.position.set(-5.5, 0.6, 0);
      const wallR = new THREE.Mesh(wallGeo, hedgeMat);
      wallR.position.set(5.5, 0.6, 0);
      gateGroup.add(wallL, wallR);

      // Stone Archway Framing
      const archMat = new THREE.MeshStandardMaterial({
        color: 0x3d4659,
        roughness: 0.65,
        metalness: 0.15,
        emissive: 0x151c27,
        emissiveIntensity: 0.3
      });
      const archBeam = new THREE.Mesh(new THREE.BoxGeometry(11.5, 0.6, 1.4), archMat);
      archBeam.position.set(0, 3.5, 0);
      gateGroup.add(archBeam);

      // Compact, Tasteful Hourglass (Cleanly elevated on the arch, well clear of camera)
      const isProgress = (hack.status === "in-progress");
      const hourglass = this.buildProceduralHourglass(isProgress);
      hourglass.scale.set(0.65, 0.65, 0.65);
      hourglass.position.set(0, 4.2, 0);
      gateGroup.add(hourglass);

      this.group.add(gateGroup);

      this.gates.push({
        group: gateGroup,
        wallL,
        wallR,
        hourglass,
        data: hack,
        zWorld: z,
        isOpened: false,
        isInProgress: isProgress
      });
    });
  }

  buildProceduralHourglass(isInProgress) {
    const g = new THREE.Group();

    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.22,
      metalness: 0.92,
      emissive: 0x5a3e08,
      emissiveIntensity: 0.4
    });

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.38,
      roughness: 0.1
    });

    const sandMat = new THREE.MeshBasicMaterial({
      color: isInProgress ? 0x2ecc71 : 0xffbe58
    });

    // Top and bottom plates
    const plateTop = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.06, 16), brassMat);
    plateTop.position.y = 0.5;
    const plateBot = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.06, 16), brassMat);
    plateBot.position.y = -0.5;
    g.add(plateTop, plateBot);

    // Double glass bulb
    const bulbTop = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.48, 14), glassMat);
    bulbTop.rotation.x = Math.PI;
    bulbTop.position.y = 0.24;

    const bulbBot = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.48, 14), glassMat);
    bulbBot.position.y = -0.24;
    g.add(bulbTop, bulbBot);

    // Glowing sand interior
    const sandTop = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.38, 10), sandMat);
    sandTop.rotation.x = Math.PI;
    sandTop.position.y = isInProgress ? 0.28 : 0.4;
    sandTop.scale.set(isInProgress ? 0.6 : 0.1, isInProgress ? 0.6 : 0.1, isInProgress ? 0.6 : 0.1);

    const sandBot = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.42, 10), sandMat);
    sandBot.position.y = -0.26;
    sandBot.scale.set(isInProgress ? 0.7 : 1.0, isInProgress ? 0.7 : 1.0, isInProgress ? 0.7 : 1.0);
    g.add(sandTop, sandBot);

    if (isInProgress) {
      const trickle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.5),
        sandMat
      );
      g.add(trickle);
    }

    const light = new THREE.PointLight(isInProgress ? 0x2ecc71 : 0xffbe58, 2.0, 7, 1.2);
    light.position.set(0, 0, 0.4);
    g.add(light);

    g.userData = { sandMat, light, isInProgress };
    return g;
  }

  buildTriwizardCupPedestal() {
    const plinthMat = new THREE.MeshStandardMaterial({
      color: 0x3d4757,
      roughness: 0.55,
      metalness: 0.2,
      emissive: 0x182230,
      emissiveIntensity: 0.35
    });

    const silverMat = new THREE.MeshStandardMaterial({
      color: 0xe0e6ed,
      metalness: 0.95,
      roughness: 0.15,
      emissive: 0x2a7590,
      emissiveIntensity: 0.45
    });

    const cupGroup = new THREE.Group();
    // Centered at Z = -32
    cupGroup.position.set(0, 0, -32);

    // Stepped Marble Base
    const step1 = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.7, 0.4, 24), plinthMat);
    step1.position.y = -2.2;
    const step2 = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.9, 0.4, 24), plinthMat);
    step2.position.y = -1.8;
    cupGroup.add(step1, step2);

    // Silver Goblet
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.24, 0.9, 14), silverMat);
    stem.position.y = -1.0;
    const bowl = new THREE.Mesh(new THREE.ConeGeometry(0.65, 0.85, 16), silverMat);
    bowl.position.y = -0.3;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.64, 0.05, 8, 24), silverMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.12;
    cupGroup.add(stem, bowl, rim);

    // Blue Radiant Core
    this.cupGlow = new THREE.PointLight(0x48dbfb, 6.0, 16, 1.1);
    this.cupGlow.position.set(0, 0.3, 0);
    cupGroup.add(this.cupGlow);

    this.group.add(cupGroup);
    this.triwizardCup = cupGroup;
  }

  setupThemeListener() {
    this.houseTheme.onThemeChange((houseId, data) => {
      if (!data) return;
      this.emeraldTorches.forEach(t => {
        t.light.color.set(data.glow);
      });
    });
  }

  initUI() {
    let el = document.getElementById('arena-ui');
    if (!el) {
      el = document.createElement('div');
      el.id = 'arena-ui';
      document.body.appendChild(el);
    }
    el.className = 'arena-ui hidden';
    el.innerHTML = `
      <div class="arena-header">
        <h2 class="arena-title">The Triwizard Arena</h2>
        <p class="arena-subtitle">Hackathons & Trials of Innovation</p>
      </div>

      <div id="hackathon-gate-card" class="hackathon-gate-card hidden">
        <div class="gate-status-pill" id="gate-status-pill">COMPLETED</div>
        <h3 class="gate-hack-title" id="gate-hack-title"></h3>
        <span class="gate-hack-partner" id="gate-hack-partner"></span>

        <div class="gate-info-block">
          <strong class="gate-label">What I built:</strong>
          <p class="gate-text" id="gate-built"></p>
        </div>

        <div class="gate-info-block">
          <strong class="gate-label">Problem / Goal:</strong>
          <p class="gate-text" id="gate-goal"></p>
        </div>

        <div class="gate-info-block">
          <strong class="gate-label">What I learned:</strong>
          <p class="gate-text" id="gate-learned"></p>
        </div>
      </div>

      ${content.trophies && content.trophies.length > 0 ? `
        <div class="trophies-shelf">
          ${content.trophies.map(t => `<div class="trophy-badge">${t}</div>`).join('')}
        </div>
      ` : ''}

      <div id="arena-cup-banner" class="arena-cup-banner hidden">
        <span class="cup-rune-glyph">🏆</span>
        <h3 class="cup-culmination-text">The next task is still being written.</h3>
      </div>
    `;
  }

  setActiveGate(index) {
    if (this.activeGateIndex === index) return;
    this.activeGateIndex = index;

    const card = document.getElementById('hackathon-gate-card');
    const cupBanner = document.getElementById('arena-cup-banner');

    if (index === -1) {
      card?.classList.add('hidden');
      cupBanner?.classList.add('hidden');
      return;
    }

    if (index === 99) {
      card?.classList.add('hidden');
      cupBanner?.classList.remove('hidden');
      return;
    }

    cupBanner?.classList.add('hidden');
    const gate = this.gates[index];
    if (!gate) return;

    if (!gate.isOpened) {
      gate.isOpened = true;
      gsap.to(gate.wallL.position, { x: -8.8, duration: 1.2, ease: 'power2.out' });
      gsap.to(gate.wallR.position, { x: 8.8, duration: 1.2, ease: 'power2.out' });
    }

    const data = gate.data;
    document.getElementById('gate-hack-title').textContent = data.name;
    document.getElementById('gate-hack-partner').textContent = data.partner || "";
    document.getElementById('gate-built').textContent = data.built;
    document.getElementById('gate-goal').textContent = data.goal;
    document.getElementById('gate-learned').textContent = data.learned;

    const pill = document.getElementById('gate-status-pill');
    if (gate.isInProgress) {
      pill.textContent = "IN PROGRESS ⏳";
      pill.className = "gate-status-pill in-progress";
    } else {
      pill.textContent = "COMPLETED ✦";
      pill.className = "gate-status-pill completed";
    }

    card?.classList.remove('hidden');
  }

  onEnterRoom() {
    this.group.visible = true;
    document.getElementById('arena-ui')?.classList.remove('hidden');
  }

  onLeaveRoom() {
    document.getElementById('arena-ui')?.classList.add('hidden');
    this.group.visible = false;
    this.setActiveGate(-1);
  }

  update(time, delta, mouse, scrollProgress) {
    if (!this.group.visible) return;

    // Pulse emerald fire braziers
    this.emeraldTorches.forEach((t, i) => {
      const flicker = Math.sin(time * 6.0 + i) * 0.16;
      t.flame.scale.set(1 + flicker, 1 + flicker * 1.4, 1 + flicker);
    });

    // Spin gate hourglasses on their arches
    this.gates.forEach((g) => {
      g.hourglass.rotation.y = time * 0.6;
      if (g.isInProgress) {
        const pulse = 1.8 + Math.sin(time * 4.0) * 1.0;
        g.hourglass.userData.light.intensity = pulse;
      }
    });

    // Goblet floating pulse
    if (this.triwizardCup) {
      this.triwizardCup.position.y = Math.sin(time * 1.8) * 0.08;
      this.cupGlow.intensity = 5.2 + Math.sin(time * 3.5) * 1.5;
    }

    // Scroll progress mapping for Arena (18.0 to 20.0)
    if (scrollProgress >= 17.5 && scrollProgress < 18.6) {
      this.setActiveGate(0);
    } else if (scrollProgress >= 18.6 && scrollProgress < 19.8) {
      this.setActiveGate(1);
    } else if (scrollProgress >= 19.8) {
      this.setActiveGate(99);
    } else {
      this.setActiveGate(-1);
    }
  }
}
