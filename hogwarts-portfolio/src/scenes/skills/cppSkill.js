import * as THREE from 'three';
import gsap from 'gsap';
import { SkillBase } from './skillBase.js';

export class CppSkill extends SkillBase {
  init(alcovePosition) {
    this.group.position.copy(alcovePosition);
    this.group.visible = false;

    this.boxBottom = null;
    this.boxLid = null;
    this.wandMesh = null;
    this.cppSymbolGroup = null;
    this.sparks = null;
    this.shockwave = null;
    this.wandLight = null;

    this.sparkPositions = null;
    this.sparkCount = 80;

    this.buildOllivanderBox();
    this.buildCarvedWand();
    this.build3DCppSymbols();
    this.buildGoldSparks();
    this.buildShockwaveMesh();
    this.setupClickShockwave();
  }

  buildOllivanderBox() {
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x221309,
      roughness: 0.55,
      metalness: 0.15
    });

    const velvetMat = new THREE.MeshStandardMaterial({
      color: 0x4a0e17,
      roughness: 0.85,
      emissive: 0x1f0407,
      emissiveIntensity: 0.3
    });

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.9,
      roughness: 0.25
    });

    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.5, 0.4, 24),
      new THREE.MeshStandardMaterial({ color: 0x1c212d, roughness: 0.7 })
    );
    pedestal.position.y = -1.2;
    this.group.add(pedestal);

    this.boxBottom = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.25, 1.1), woodMat);
    this.boxBottom.position.set(0, -0.65, 0);

    const velvetLining = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.15, 0.9), velvetMat);
    velvetLining.position.set(0, -0.58, 0);

    this.boxLid = new THREE.Mesh(new THREE.BoxGeometry(3.65, 0.16, 1.12), woodMat);
    this.boxLid.position.set(0, -0.52, -0.55);

    const label = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), goldMat);
    label.position.set(0, -0.42, 0.56);
    this.group.add(this.boxBottom, velvetLining, this.boxLid, label);
  }

  buildCarvedWand() {
    const wandGroup = new THREE.Group();

    const rosewoodMat = new THREE.MeshStandardMaterial({
      color: 0x3d1f0f,
      roughness: 0.4,
      metalness: 0.15
    });

    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xf3c14b,
      metalness: 0.92,
      roughness: 0.2,
      emissive: 0x4a3205,
      emissiveIntensity: 0.4
    });

    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.06, 2.6, 14),
      rosewoodMat
    );
    shaft.rotation.z = Math.PI / 2;
    wandGroup.add(shaft);

    const grip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.075, 0.75, 12),
      rosewoodMat
    );
    grip.rotation.z = Math.PI / 2;
    grip.position.x = -0.95;
    wandGroup.add(grip);

    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.15, 12), brassMat);
    tip.rotation.z = -Math.PI / 2;
    tip.position.x = 1.35;
    wandGroup.add(tip);

    const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), brassMat);
    pommel.position.x = -1.35;
    wandGroup.add(pommel);

    wandGroup.position.set(0, -0.5, 0);
    this.wandMesh = wandGroup;
    this.group.add(this.wandMesh);

    this.wandLight = new THREE.PointLight(0xffbe54, 4.0, 7.0, 1.2);
    this.wandLight.position.set(0, 0.2, 0.8);
    this.group.add(this.wandLight);
  }

  build3DCppSymbols() {
    this.cppSymbolGroup = new THREE.Group();

    const goldGlowMat = new THREE.MeshStandardMaterial({
      color: 0xffd152,
      emissive: 0xffa41c,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.85
    });

    // 1. 3D "C" Symbol: Torus with cut gap opening to the RIGHT toward "++"
    const cMesh = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.08, 12, 32, Math.PI * 1.55), goldGlowMat);
    cMesh.position.set(-0.75, 0.7, 0);
    // Rotate so the solid backbone curves along the left and the open gap faces the two plus signs (+X)
    cMesh.rotation.z = Math.PI * 0.25;
    this.cppSymbolGroup.add(cMesh);


    // 2. First 3D "+" symbol
    const barGeo = new THREE.BoxGeometry(0.08, 0.45, 0.08);
    const p1H = new THREE.Mesh(barGeo, goldGlowMat);
    p1H.rotation.z = Math.PI / 2;
    const p1V = new THREE.Mesh(barGeo, goldGlowMat);
    const plus1 = new THREE.Group();
    plus1.add(p1H, p1V);
    plus1.position.set(0.1, 0.7, 0);
    this.cppSymbolGroup.add(plus1);

    // 3. Second 3D "+" symbol
    const p2H = new THREE.Mesh(barGeo, goldGlowMat);
    p2H.rotation.z = Math.PI / 2;
    const p2V = new THREE.Mesh(barGeo, goldGlowMat);
    const plus2 = new THREE.Group();
    plus2.add(p2H, p2V);
    plus2.position.set(0.65, 0.7, 0);
    this.cppSymbolGroup.add(plus2);

    this.group.add(this.cppSymbolGroup);
  }

  buildGoldSparks() {
    const geo = new THREE.BufferGeometry();
    this.sparkPositions = new Float32Array(this.sparkCount * 3);

    for (let i = 0; i < this.sparkCount; i++) {
      this.sparkPositions[i * 3] = (Math.random() - 0.5) * 2.8;
      this.sparkPositions[i * 3 + 1] = -0.2 + (Math.random() - 0.5) * 0.8;
      this.sparkPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(this.sparkPositions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xffd369,
      size: 0.08,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });

    this.sparks = new THREE.Points(geo, mat);
    this.group.add(this.sparks);
  }

  buildShockwaveMesh() {
    const geo = new THREE.RingGeometry(0.1, 0.35, 32);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffd97d,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    this.shockwave = new THREE.Mesh(geo, mat);
    this.shockwave.position.set(0, 0.1, 0.2);
    this.group.add(this.shockwave);
  }

  setupClickShockwave() {
    const el = document.getElementById('webgl-container');
    if (!el) return;

    el.addEventListener('pointerdown', () => {
      if (this.isEntered) {
        this.triggerShockwave();
      }
    });
  }

  triggerShockwave() {
    if (!this.shockwave) return;

    this.shockwave.scale.set(1, 1, 1);
    this.shockwave.material.opacity = 0.95;

    gsap.timeline()
      .to(this.shockwave.scale, { x: 18, y: 18, duration: 1.1, ease: 'power2.out' })
      .to(this.shockwave.material, { opacity: 0, duration: 1.1, ease: 'power2.out' }, 0);

    if (this.wandLight) {
      gsap.timeline()
        .to(this.wandLight, { intensity: 10.0, duration: 0.15 })
        .to(this.wandLight, { intensity: 4.0, duration: 0.8, ease: 'power1.out' });
    }
  }

  enter() {
    super.enter();
    this.group.visible = true;

    if (this.boxLid) {
      gsap.to(this.boxLid.rotation, {
        x: -Math.PI / 1.7,
        duration: 1.2,
        ease: 'power2.out'
      });
    }

    if (this.wandMesh) {
      gsap.to(this.wandMesh.position, {
        y: 0.35,
        duration: 1.6,
        delay: 0.3,
        ease: 'power2.out'
      });
    }

    if (this.cppSymbolGroup) {
      this.cppSymbolGroup.scale.set(0.01, 0.01, 0.01);
      gsap.to(this.cppSymbolGroup.scale, {
        x: 1, y: 1, z: 1,
        duration: 1.2,
        delay: 0.4,
        ease: 'back.out(1.5)'
      });
    }
  }

  exit() {
    super.exit();
    if (this.boxLid) {
      gsap.to(this.boxLid.rotation, { x: 0, duration: 0.6 });
    }
    if (this.wandMesh) {
      gsap.to(this.wandMesh.position, { y: -0.5, duration: 0.6 });
    }
  }

  update(time, delta, mouse) {
    if (!this.isEntered) return;

    if (this.wandMesh) {
      this.wandMesh.rotation.y = time * 0.45;
      this.wandMesh.rotation.z = Math.sin(time * 0.8) * 0.08;
    }

    if (this.cppSymbolGroup) {
      this.cppSymbolGroup.position.y = Math.sin(time * 1.5) * 0.08;
      this.cppSymbolGroup.rotation.y = Math.sin(time * 0.8) * 0.2;
    }

    if (this.sparks && mouse) {
      const pos = this.sparks.geometry.attributes.position.array;
      for (let i = 0; i < this.sparkCount; i++) {
        pos[i * 3 + 1] += Math.sin(time * 3.0 + i) * 0.005;
        pos[i * 3] += (mouse.x * 1.5 - pos[i * 3]) * 0.02;
      }
      this.sparks.geometry.attributes.position.needsUpdate = true;
    }
  }
}