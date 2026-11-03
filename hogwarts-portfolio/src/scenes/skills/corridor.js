import * as THREE from 'three';
import { content } from '../../content.js';
import { PythonSkill } from './pythonSkill.js';
import { CppSkill } from './cppSkill.js';
import { KotlinSkill } from './kotlinSkill.js';
import { AndroidSkill } from './androidSkill.js';
import { WebSkill } from './webSkill.js';

export class SkillsCorridorScene {
  constructor(scene, camera, houseThemeManager) {
    this.scene = scene;
    this.camera = camera;
    this.houseTheme = houseThemeManager;

    this.group = new THREE.Group();
    // Positioned directly after the Grand Staircase (Z = -165)
    this.group.position.set(0, 0, -200);
    this.scene.add(this.group);

    this.corridorLength = 95;
    this.activeSkillIndex = -1;
    this.skillScenes = [];
    this.hallTorches = [];

    // Five Alcove Z Offsets along the hallway
    this.alcoveZOffsets = [-10, -25, -45, -65, -80];

    this.init();
    this.initUI();
    this.setupThemeListener();
  }

  init() {
    this.buildCastleHallway();
    this.buildWallTorches();
    this.buildAlcovePortals();
    this.initAllSkillScenes();
  }

  buildCastleHallway() {
    // 1. Procedural Fine Ashlar Stone Texture for Corridor Walls & Pillars
    const stoneCanvas = document.createElement('canvas');
    stoneCanvas.width = 512;
    stoneCanvas.height = 512;
    const ctx = stoneCanvas.getContext('2d');

    ctx.fillStyle = '#222838';
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
    stoneTex.repeat.set(6, 2);

    const stoneMat = new THREE.MeshStandardMaterial({
      map: stoneTex,
      roughness: 0.68,
      metalness: 0.12,
      emissive: 0x181f2d,
      emissiveIntensity: 0.45 // Natural, visible stone walls
    });

    const floorMat = new THREE.MeshStandardMaterial({
      map: stoneTex,
      roughness: 0.52,
      metalness: 0.18,
      emissive: 0x141a26,
      emissiveIntensity: 0.38 // Reflects warm torchlight smoothly
    });

    // Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, this.corridorLength), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, -2.4, -this.corridorLength / 2);
    floor.receiveShadow = true;
    this.group.add(floor);

    // Ceiling
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(18, this.corridorLength), stoneMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, 9.0, -this.corridorLength / 2);
    this.group.add(ceiling);

    // Side Walls
    const wallGeo = new THREE.PlaneGeometry(this.corridorLength, 12);
    const wallL = new THREE.Mesh(wallGeo, stoneMat);
    wallL.position.set(-9.0, 3.6, -this.corridorLength / 2);
    wallL.rotation.y = Math.PI / 2;
    this.group.add(wallL);

    const wallR = new THREE.Mesh(wallGeo, stoneMat);
    wallR.position.set(9.0, 3.6, -this.corridorLength / 2);
    wallR.rotation.y = -Math.PI / 2;
    this.group.add(wallR);

    // Stone Archways repeating along corridor
    const archMat = new THREE.MeshStandardMaterial({
      map: stoneTex,
      roughness: 0.6,
      metalness: 0.15,
      emissive: 0x1c2436,
      emissiveIntensity: 0.42
    });

    const colGeo = new THREE.CylinderGeometry(0.65, 0.8, 12, 16);
    const beamGeo = new THREE.BoxGeometry(18, 0.75, 0.95);

    for (let z = 0; z >= -this.corridorLength; z -= 15) {
      const colL = new THREE.Mesh(colGeo, archMat);
      colL.position.set(-8.5, 3.6, z);
      this.group.add(colL);

      const colR = new THREE.Mesh(colGeo, archMat);
      colR.position.set(8.5, 3.6, z);
      this.group.add(colR);

      const beam = new THREE.Mesh(beamGeo, archMat);
      beam.position.set(0, 8.8, z);
      this.group.add(beam);
    }

    // 2. Controlled, Atmospheric Illumination (Lightens the corridor gently without over-exposure)
    const amb = new THREE.AmbientLight(0xdde6f5, 1.85);
    this.group.add(amb);

    const hemi = new THREE.HemisphereLight(0x42567a, 0x6e4a28, 1.35);
    this.group.add(hemi);

    // Warm overhead ceiling lanterns down the aisle
    for (let z = -8; z >= -this.corridorLength; z -= 16) {
      const light = new THREE.PointLight(0xffbe58, 3.8, 24, 1.2);
      light.position.set(0, 7.2, z);
      this.group.add(light);
    }
  }

  buildWallTorches() {
    for (let z = -5; z >= -this.corridorLength + 5; z -= 12) {
      [-8.2, 8.2].forEach(x => {
        // Soft torch glow reaching into the corridor
        const torch = new THREE.PointLight(0xffa83e, 3.2, 18, 1.2);
        torch.position.set(x > 0 ? x - 1.2 : x + 1.2, 3.0, z);
        this.group.add(torch);
        this.hallTorches.push(torch);

        const sconce = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06, 0.08, 0.85),
          new THREE.MeshStandardMaterial({ color: 0x3d281a, roughness: 0.35, metalness: 0.85 })
        );
        sconce.position.set(x > 0 ? x - 0.35 : x + 0.35, 2.6, z);
        this.group.add(sconce);
      });
    }
  }

  buildAlcovePortals() {
    const archMat = new THREE.MeshStandardMaterial({
      color: 0x3d475e,
      roughness: 0.6,
      emissive: 0x1a2130,
      emissiveIntensity: 0.35
    });

    content.skills.forEach((skill, idx) => {
      const z = this.alcoveZOffsets[idx];
      const isLeft = idx % 2 === 0;
      const x = isLeft ? -8.0 : 8.0;

      const portalGroup = new THREE.Group();
      portalGroup.position.set(x, 0.6, z);
      portalGroup.rotation.y = isLeft ? Math.PI / 2 : -Math.PI / 2;

      const frame = new THREE.Mesh(new THREE.BoxGeometry(4.4, 6.2, 0.4), archMat);
      portalGroup.add(frame);

      // Subtle, tasteful alcove glow (accentuates skill color without blowing out)
      const alcoveLight = new THREE.PointLight(new THREE.Color(skill.color), 2.2, 10, 1.4);
      alcoveLight.position.set(0, 1.0, 1.4);
      portalGroup.add(alcoveLight);

      this.group.add(portalGroup);
    });
  }

  initAllSkillScenes() {
    // 0: Python Scene
    const python = new PythonSkill(this.scene, this.camera, this.houseTheme, content.skills[0]);
    python.init(new THREE.Vector3(-5.2, 0.6, -210));
    this.skillScenes.push(python);

    // 1: C++ Scene
    const cpp = new CppSkill(this.scene, this.camera, this.houseTheme, content.skills[1]);
    cpp.init(new THREE.Vector3(5.2, 0.6, -225));
    this.skillScenes.push(cpp);

    // 2: Kotlin Scene (Owl Post)
    const kotlin = new KotlinSkill(this.scene, this.camera, this.houseTheme, content.skills[2]);
    kotlin.init(new THREE.Vector3(-5.2, 0.6, -245));
    this.skillScenes.push(kotlin);

    // 3: Android Studio Scene (Room of Requirement)
    const android = new AndroidSkill(this.scene, this.camera, this.houseTheme, content.skills[3]);
    android.init(new THREE.Vector3(5.2, 0.6, -265));
    this.skillScenes.push(android);

    // 4: HTML & CSS Scene (Potions Class)
    const web = new WebSkill(this.scene, this.camera, this.houseTheme, content.skills[4]);
    web.init(new THREE.Vector3(-5.2, 0.6, -280));
    this.skillScenes.push(web);
  }

  initUI() {
    let el = document.getElementById('skills-ui');
    if (!el) {
      el = document.createElement('div');
      el.id = 'skills-ui';
      document.body.appendChild(el);
    }
    el.className = 'skills-ui hidden';
    el.innerHTML = `
      <div id="skill-card-panel" class="skill-card-panel hidden">
        <span id="skill-subtitle" class="skill-subtitle"></span>
        <h2 id="skill-title" class="skill-title"></h2>
        <p id="skill-tagline" class="skill-tagline"></p>
        <p id="skill-desc" class="skill-desc"></p>
        <div class="skill-madewith-box">
          <span class="madewith-label">What I made with it:</span>
          <p id="skill-madewith" class="skill-madewith"></p>
        </div>
      </div>

      <nav class="skills-rune-tracker" aria-label="Skills Corridor Progress">
        ${content.skills.map((s, i) => `
          <button class="rune-step-btn" data-index="${i}" aria-label="${s.name}">
            <span class="rune-glyph">${s.rune}</span>
            <span class="rune-name">${s.name}</span>
          </button>
        `).join('')}
      </nav>
    `;

    this.bindUIEvents();
  }

  bindUIEvents() {
    document.querySelectorAll('.rune-step-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        // Direct 1-to-1 mapping to waypoints 9 (Python), 10 (C++), 11 (Kotlin), 12 (Android), 13 (HTML & CSS)
        const targetScroll = 9.0 + idx;
        if (window.app && window.app.scrollManager) {
          window.app.scrollManager.scrollToRoom(targetScroll);
        }
      });
    });
  }


  setupThemeListener() {
    this.houseTheme.onThemeChange((houseId, data) => {
      if (!data) return;
      this.hallTorches.forEach(t => t.color.set(data.glow));
    });
  }

  setActiveSkill(index) {
    if (this.activeSkillIndex === index) return;

    if (this.activeSkillIndex >= 0 && this.activeSkillIndex < this.skillScenes.length) {
      this.skillScenes[this.activeSkillIndex].exit();
    }

    this.activeSkillIndex = index;

    document.querySelectorAll('.rune-step-btn').forEach((btn, i) => {
      btn.classList.toggle('active', i === index);
    });

    const panel = document.getElementById('skill-card-panel');
    const skill = content.skills[index];

    if (!skill || !panel) {
      panel?.classList.add('hidden');
      return;
    }

    document.getElementById('skill-subtitle').textContent = skill.subtitle;
    document.getElementById('skill-title').textContent = skill.name;
    document.getElementById('skill-tagline').textContent = `"${skill.tagline}"`;
    document.getElementById('skill-desc').textContent = skill.description;
    document.getElementById('skill-madewith').textContent = skill.madeWith;

    panel.style.setProperty('--skill-glow', skill.color);

    const isSymbolOnLeft = (index % 2 === 0);
    panel.classList.toggle('dock-right', isSymbolOnLeft);
    panel.classList.toggle('dock-left', !isSymbolOnLeft);

    panel.classList.remove('hidden');

    if (index < this.skillScenes.length) {
      this.skillScenes[index].enter();
    }
  }

  onEnterRoom() {
    this.group.visible = true;
    document.getElementById('skills-ui')?.classList.remove('hidden');
  }

  onLeaveRoom() {
    document.getElementById('skills-ui')?.classList.add('hidden');
    this.group.visible = false;
    if (this.activeSkillIndex >= 0 && this.activeSkillIndex < this.skillScenes.length) {
      this.skillScenes[this.activeSkillIndex].exit();
    }
    this.activeSkillIndex = -1;
  }

  update(time, delta, mouse, scrollProgress) {
    if (!this.group.visible) return;

     if (scrollProgress >= 8.5 && scrollProgress <= 13.8) {
      const currentIdx = THREE.MathUtils.clamp(Math.round(scrollProgress - 9.0), 0, 4);
      this.setActiveSkill(currentIdx);
    }


    this.skillScenes.forEach((scene) => {
      if (scene.isEntered) {
        scene.update(time, delta, mouse);
      }
    });
  }
}
