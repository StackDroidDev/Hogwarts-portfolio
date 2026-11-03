import * as THREE from 'three';
import { content } from '../content.js';

export class GreatHallScene {
  constructor(scene, houseThemeManager) {
    this.scene = scene;
    this.houseTheme = houseThemeManager;

    this.group = new THREE.Group();
    // Positioned along Z leading straight toward the Divination orbs
    this.group.position.set(0, 0, -95);
    this.scene.add(this.group);

    this.candlesInstanced = null;
    this.candleCount = 180;
    this.candleData = [];
    this.flamePoints = null;
    this.houseBanners = [];
    this.portraitFrames = [];
    this.hallLights = [];
    this.skyMesh = null;

    this.init();
    this.initUI();
    this.setupThemeListener();
  }

  init() {
    this.buildHallArchitecture();
    this.buildEnchantedCeiling();
    this.buildGlowingPortraitFrames();
    this.buildHouseTables();
    this.buildHangingHouseBanners();
    this.buildFastInstancedCandles();
  }

    buildHallArchitecture() {
    // 1. Weathered Stone Material with elevated brightness
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x2e3547,
      roughness: 0.65,
      metalness: 0.18,
      emissive: 0x161c28,
      emissiveIntensity: 0.4
    });

    // Floor with warm golden candlelight bounce
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x222a3a,
      roughness: 0.45,
      metalness: 0.25,
      emissive: 0x18140c,
      emissiveIntensity: 0.35
    });

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(32, 84), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -3.2;
    floor.receiveShadow = true;
    this.group.add(floor);

    // Side Walls
    const wallGeo = new THREE.PlaneGeometry(84, 22);
    const wallL = new THREE.Mesh(wallGeo, stoneMat);
    wallL.position.set(-14.0, 7.0, 0);
    wallL.rotation.y = Math.PI / 2;
    this.group.add(wallL);

    const wallR = new THREE.Mesh(wallGeo, stoneMat);
    wallR.position.set(14.0, 7.0, 0);
    wallR.rotation.y = -Math.PI / 2;
    this.group.add(wallR);

    // Stone Architectural Piers along the sides
    const pierGeo = new THREE.BoxGeometry(0.8, 22, 1.4);
    for (let z = -36; z <= 36; z += 12) {
      const pierL = new THREE.Mesh(pierGeo, stoneMat);
      pierL.position.set(-13.7, 7.0, z);
      this.group.add(pierL);

      const pierR = new THREE.Mesh(pierGeo, stoneMat);
      pierR.position.set(13.7, 7.0, z);
      this.group.add(pierR);
    }

    // 2. Open Grand Gothic Archway at Far End (Z = -41.5) leading to Divination Orbs
    // Keeps center completely open while framing the passage
    const archPillarGeo = new THREE.BoxGeometry(3.6, 22, 1.8);
    
    // Left arch jamb
    const archL = new THREE.Mesh(archPillarGeo, stoneMat);
    archL.position.set(-9.5, 7.0, -41.5);
    this.group.add(archL);

    // Right arch jamb
    const archR = new THREE.Mesh(archPillarGeo, stoneMat);
    archR.position.set(9.5, 7.0, -41.5);
    this.group.add(archR);

    // Overhead vaulted lintel
    const archHeader = new THREE.Mesh(new THREE.BoxGeometry(16, 7.5, 1.8), stoneMat);
    archHeader.position.set(0, 14.25, -41.5);
    this.group.add(archHeader);

    // Distant portal glow lighting the entryway to the Divination chamber
    const portalAura = new THREE.PointLight(0xa855f7, 3.5, 28, 1.2);
    portalAura.position.set(0, 2.5, -42.0);
    this.group.add(portalAura);

    // 3. Global Hall Illumination (Balanced ambient light across the hall)
    const ambientHall = new THREE.AmbientLight(0xffecd0, 2.8);
    this.group.add(ambientHall);

    const hemiLight = new THREE.HemisphereLight(0x3e587e, 0x6e461f, 1.8);
    this.group.add(hemiLight);

    // Distributed Overhead Candle Aura Lights
    const highLightPositions = [
      { x: 0, y: 7.0, z: 24 },
      { x: 0, y: 7.0, z: 0 },
      { x: 0, y: 7.0, z: -24 }
    ];

    highLightPositions.forEach(pos => {
      const highLight = new THREE.PointLight(0xffbe58, 4.2, 45, 1.1);
      highLight.position.set(pos.x, pos.y, pos.z);
      this.group.add(highLight);
      this.hallLights.push(highLight);
    });
  }


  buildEnchantedCeiling() {
    const skyGeo = new THREE.PlaneGeometry(32, 84);
    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = 1024;
    skyCanvas.height = 1024;
    const ctx = skyCanvas.getContext('2d');

    const skyGrad = ctx.createLinearGradient(0, 0, 0, 1024);
    skyGrad.addColorStop(0, '#040714');
    skyGrad.addColorStop(0.5, '#101938');
    skyGrad.addColorStop(1, '#050a1c');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 1024, 1024);

    ctx.fillStyle = 'rgba(60, 95, 180, 0.22)';
    ctx.beginPath();
    ctx.arc(512, 512, 400, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 350; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const r = Math.random() * 1.5 + 0.3;
      ctx.globalAlpha = Math.random() * 0.75 + 0.25;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    const skyTex = new THREE.CanvasTexture(skyCanvas);
    const skyMat = new THREE.MeshBasicMaterial({ map: skyTex });
    this.skyMesh = new THREE.Mesh(skyGeo, skyMat);
    this.skyMesh.rotation.x = Math.PI / 2;
    this.skyMesh.position.y = 13.5;
    this.group.add(this.skyMesh);

    // Medieval Rafter Tie Beams
    const woodBeamMat = new THREE.MeshStandardMaterial({
      color: 0x3d2416,
      roughness: 0.55,
      metalness: 0.12,
      emissive: 0x1b0e07,
      emissiveIntensity: 0.3
    });

    const beamGeo = new THREE.BoxGeometry(28, 0.45, 0.6);
    for (let z = -36; z <= 36; z += 12) {
      const beam = new THREE.Mesh(beamGeo, woodBeamMat);
      beam.position.set(0, 11.2, z);
      this.group.add(beam);
    }
  }

  buildGlowingPortraitFrames() {
    const currentTheme = this.houseTheme.getThemeData() || {
      glow: '#2ecc71',
      primary: '#1a472a',
      accentHex: 0xd4af37
    };

    // 1. Polished Reflective Gold Outer Border
    const goldBorderMat = new THREE.MeshStandardMaterial({
      color: 0xe5b842,
      roughness: 0.22,
      metalness: 0.92,
      emissive: 0x5a3d08,
      emissiveIntensity: 0.45
    });

    // 2. Glowing Inner Canvas in House Color
    const canvasColor = new THREE.Color(currentTheme.glow || currentTheme.primary);
    const innerCanvasMat = new THREE.MeshStandardMaterial({
      color: canvasColor,
      emissive: canvasColor,
      emissiveIntensity: 0.65,
      roughness: 0.4,
      metalness: 0.2
    });

    const frameOuterGeo = new THREE.BoxGeometry(0.14, 3.8, 2.6);
    const frameInnerGeo = new THREE.BoxGeometry(0.16, 3.2, 2.0);

    for (let z = -30; z <= 30; z += 12.0) {
      // Left Wall Frame
      const fL = new THREE.Mesh(frameOuterGeo, goldBorderMat);
      fL.position.set(-13.85, 4.4, z);
      const cL = new THREE.Mesh(frameInnerGeo, innerCanvasMat);
      cL.position.copy(fL.position);
      this.group.add(fL, cL);

      // Right Wall Frame
      const fR = new THREE.Mesh(frameOuterGeo, goldBorderMat);
      fR.position.set(13.85, 4.4, z);
      const cR = new THREE.Mesh(frameInnerGeo, innerCanvasMat);
      cR.position.copy(fR.position);
      this.group.add(fR, cR);

      this.portraitFrames.push({ fL, cL, fR, cR, innerMat: innerCanvasMat });
    }
  }

  buildHouseTables() {
    // Bright, polished warm oak table surface (clearly visible)
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0x7a4322,
      roughness: 0.35,
      metalness: 0.18,
      emissive: 0x361c0c,
      emissiveIntensity: 0.52 // Guarantees strong visibility
    });

    const benchMat = new THREE.MeshStandardMaterial({
      color: 0x5a3018,
      roughness: 0.45,
      metalness: 0.12,
      emissive: 0x241206,
      emissiveIntensity: 0.4
    });

    // Brilliant golden plates with specular highlights
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0xffd269,
      roughness: 0.15,
      metalness: 0.94,
      emissive: 0x6e4a0a,
      emissiveIntensity: 0.65
    });

    const tableX = [-5.2, -1.8, 1.8, 5.2];
    const tableLength = 68;

    tableX.forEach(x => {
      // Tabletop
      const top = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.22, tableLength), tableMat);
      top.position.set(x, -2.0, 0);
      top.receiveShadow = true;
      this.group.add(top);

      // Flanking Benches
      [-1.12, 1.12].forEach(bOffset => {
        const bench = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.16, tableLength), benchMat);
        bench.position.set(x + bOffset, -2.4, 0);
        this.group.add(bench);
      });

      // Feast plates along the table
      const plateGeo = new THREE.CylinderGeometry(0.25, 0.21, 0.04, 16);
      for (let z = -28; z <= 28; z += 3.6) {
        const p1 = new THREE.Mesh(plateGeo, plateMat);
        p1.position.set(x - 0.42, -1.87, z);
        const p2 = new THREE.Mesh(plateGeo, plateMat);
        p2.position.set(x + 0.42, -1.87, z);
        this.group.add(p1, p2);
      }
    });
  }

  buildHangingHouseBanners() {
    const currentTheme = this.houseTheme.getThemeData() || {
      glow: '#2ecc71',
      accentHex: 0xd4af37,
      primary: '#1a472a'
    };

    const houseGlowColor = new THREE.Color(currentTheme.glow || '#2ecc71');
    const trimColor = new THREE.Color(currentTheme.accentHex || 0xd4af37);

    // Glowing silk velvet banners in respective house color
    const bannerMat = new THREE.MeshStandardMaterial({
      color: houseGlowColor,
      emissive: houseGlowColor,
      emissiveIntensity: 0.85, // Vibrant house glow
      roughness: 0.35,
      metalness: 0.15,
      side: THREE.DoubleSide
    });

    const trimMat = new THREE.MeshStandardMaterial({
      color: trimColor,
      emissive: 0x5a3d08,
      emissiveIntensity: 0.4,
      roughness: 0.25,
      metalness: 0.88
    });

    const bannerGeo = new THREE.PlaneGeometry(1.4, 3.2);
    const xOffsets = [-5.2, 5.2];
    const zOffsets = [-25, -12, 0, 12, 25];

    xOffsets.forEach(x => {
      zOffsets.forEach(z => {
        const bannerGroup = new THREE.Group();
        bannerGroup.position.set(x, 7.6, z);

        const banner = new THREE.Mesh(bannerGeo, bannerMat);
        banner.position.y = -1.6;
        bannerGroup.add(banner);

        const fringe = new THREE.Mesh(new THREE.BoxGeometry(1.44, 0.12, 0.04), trimMat);
        fringe.position.set(0, -3.2, 0.01);
        bannerGroup.add(fringe);

        this.group.add(bannerGroup);
        this.houseBanners.push({ bannerMat, trimMat });
      });
    });
  }

  buildFastInstancedCandles() {
    const candleGeo = new THREE.CylinderGeometry(0.04, 0.048, 0.75, 8);
    const candleMat = new THREE.MeshStandardMaterial({
      color: 0xf5dfb3,
      emissive: 0xffa41c,
      emissiveIntensity: 0.85,
      roughness: 0.4
    });

    this.candlesInstanced = new THREE.InstancedMesh(candleGeo, candleMat, this.candleCount);
    this.candlesInstanced.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    const dummy = new THREE.Object3D();
    const flameGeo = new THREE.BufferGeometry();
    const flamePos = new Float32Array(this.candleCount * 3);

    for (let i = 0; i < this.candleCount; i++) {
      const x = (Math.random() - 0.5) * 16;
      const y = 2.8 + Math.random() * 5.2;
      const z = -32 + Math.random() * 64;

      dummy.position.set(x, y, z);
      dummy.updateMatrix();
      this.candlesInstanced.setMatrixAt(i, dummy.matrix);

      flamePos[i * 3] = x;
      flamePos[i * 3 + 1] = y + 0.42;
      flamePos[i * 3 + 2] = z;

      this.candleData.push({
        baseX: x,
        baseY: y,
        baseZ: z,
        speed: 1.0 + Math.random() * 1.5,
        offset: Math.random() * Math.PI * 2
      });
    }

    this.candlesInstanced.instanceMatrix.needsUpdate = true;
    this.group.add(this.candlesInstanced);

    flameGeo.setAttribute('position', new THREE.BufferAttribute(flamePos, 3));
    const flameMat = new THREE.PointsMaterial({
      color: 0xffe484,
      size: 0.14,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });

    this.flamePoints = new THREE.Points(flameGeo, flameMat);
    this.group.add(this.flamePoints);
  }

  setupThemeListener() {
    this.houseTheme.onThemeChange((houseId, data) => {
      if (!data) return;

      const activeGlow = new THREE.Color(data.glow || data.primary);
      const activeTrim = new THREE.Color(data.accentHex || 0xd4af37);

      // 1. Update banners to house glow
      this.houseBanners.forEach(item => {
        item.bannerMat.color.copy(activeGlow);
        item.bannerMat.emissive.copy(activeGlow);
        item.trimMat.color.copy(activeTrim);
      });

      // 2. Update wall portrait frames to house glow
      this.portraitFrames.forEach(item => {
        item.innerMat.color.copy(activeGlow);
        item.innerMat.emissive.copy(activeGlow);
      });

      // 3. Hall ambient light shift
      this.hallLights.forEach(light => {
        light.color.set(data.glow);
      });
    });
  }

  initUI() {
    let el = document.getElementById('great-hall-ui');
    if (!el) {
      el = document.createElement('div');
      el.id = 'great-hall-ui';
      document.body.appendChild(el);
    }
    el.className = 'great-hall-ui hidden';
    el.innerHTML = `
      <div class="great-hall-banner">
        <h2 class="hall-title">${content.greatHall.welcomeTitle}</h2>
        <p class="hall-statement">${content.greatHall.introStatement}</p>
        <span class="hall-subhint">${content.greatHall.scrollContinue}</span>
      </div>
    `;
  }

  onEnterRoom() {
    const ui = document.getElementById('great-hall-ui');
    if (ui) ui.classList.remove('hidden');
  }

  onLeaveRoom() {
    const ui = document.getElementById('great-hall-ui');
    if (ui) ui.classList.add('hidden');
  }


  update(time, mouseParallax) {
    if (!this.group.visible) return;

    const pX = mouseParallax ? mouseParallax.x * 0.35 : 0;
    const pY = mouseParallax ? mouseParallax.y * 0.2 : 0;

    // Interactive shimmering of the wall portrait canvases on mouse movement
    if (mouseParallax && this.portraitFrames.length > 0) {
      const pulse = 0.65 + Math.sin(time * 4.0 + mouseParallax.x * 3.0) * 0.25;
      this.portraitFrames.forEach(item => {
        item.innerMat.emissiveIntensity = pulse;
      });
    }

    if (this.skyMesh) {
      this.skyMesh.position.z = Math.sin(time * 0.1) * 0.4;
    }

    if (this.candlesInstanced && this.flamePoints) {
      const dummy = new THREE.Object3D();
      const fPos = this.flamePoints.geometry.attributes.position.array;

      for (let i = 0; i < this.candleCount; i++) {
        const d = this.candleData[i];
        const floatY = d.baseY + Math.sin(time * d.speed + d.offset) * 0.12 + pY;
        const posX = d.baseX + pX;

        dummy.position.set(posX, floatY, d.baseZ);
        dummy.updateMatrix();
        this.candlesInstanced.setMatrixAt(i, dummy.matrix);

        fPos[i * 3] = posX;
        fPos[i * 3 + 1] = floatY + 0.42;
        fPos[i * 3 + 2] = d.baseZ;
      }
      this.candlesInstanced.instanceMatrix.needsUpdate = true;
      this.flamePoints.geometry.attributes.position.needsUpdate = true;
    }
  }
}
