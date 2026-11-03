import * as THREE from 'three';
import gsap from 'gsap';
import { SkillBase } from './skillBase.js';

export class KotlinSkill extends SkillBase {
  init(alcovePosition) {
    this.group.position.copy(alcovePosition);
    this.group.visible = false;

    this.owlGroup = new THREE.Group();
    this.leftWingGroup = new THREE.Group();
    this.rightWingGroup = new THREE.Group();
    this.letterGroup = new THREE.Group();
    this.phoneGroup = new THREE.Group();
    this.moonMesh = null;
    this.appCanvasTex = null;
    this.appCanvas = null;
    this.appCtx = null;
    this.isLanded = false;
    this.flightProgress = { val: 0 };
    this.flightCurve = null;
    this.isPhoneOpen = false;

    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.isMobile = window.innerWidth < 768;

    this.buildAlcoveArchitecture();
    this.buildPerchAndMoon();
    this.buildArticulatedOwl();
    this.buildSealedLetter();
    this.buildFloating3DPhone();
    this.setupInteraction();
  }

  buildAlcoveArchitecture() {
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x221a30,
      roughness: 0.75,
      metalness: 0.15,
      emissive: 0x10081c,
      emissiveIntensity: 0.35
    });

    const dais = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.7, 0.4, 24), stoneMat);
    dais.position.y = -1.2;
    this.group.add(dais);

    // Deep starry night sky backdrop inside the alcove arch
    const skyMat = new THREE.MeshBasicMaterial({ color: 0x090616 });
    const skyBackdrop = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 7.0), skyMat);
    skyBackdrop.position.set(0, 1.8, -1.8);
    this.group.add(skyBackdrop);

    // Soft Purple and Night Sky Lighting
    const ambient = new THREE.AmbientLight(0x7352a8, 1.2);
    this.group.add(ambient);

    const purpleGlow = new THREE.PointLight(0xa36bf0, 4.5, 12, 1.2);
    purpleGlow.position.set(0, 2.2, 1.4);
    this.group.add(purpleGlow);
  }

  buildPerchAndMoon() {
    // Glowing Full Moon in background
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xf4edff });
    this.moonMesh = new THREE.Mesh(new THREE.CircleGeometry(0.85, 32), moonMat);
    this.moonMesh.position.set(1.4, 3.2, -1.7);
    this.group.add(this.moonMesh);

    // Carved oak tree branch perch
    const branchMat = new THREE.MeshStandardMaterial({
      color: 0x3d2719,
      roughness: 0.8,
      metalness: 0.05
    });

    const perch = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 3.2, 12), branchMat);
    perch.rotation.z = Math.PI / 2;
    perch.position.set(0, -0.15, 0.2);
    this.group.add(perch);
  }

  buildArticulatedOwl() {
    const featherMat = new THREE.MeshStandardMaterial({
      color: 0xeae6df,
      roughness: 0.65,
      metalness: 0.05
    });

    const darkFeatherMat = new THREE.MeshStandardMaterial({
      color: 0x8a7765,
      roughness: 0.7
    });

    const beakMat = new THREE.MeshStandardMaterial({
      color: 0xd4a038,
      roughness: 0.35,
      metalness: 0.5
    });

    // Body
    const bodyGeo = new THREE.ConeGeometry(0.32, 0.9, 14);
    const body = new THREE.Mesh(bodyGeo, featherMat);
    body.rotation.x = Math.PI;
    this.owlGroup.add(body);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), featherMat);
    head.position.set(0, 0.52, 0.05);
    this.owlGroup.add(head);

    // Beak
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.14, 8), beakMat);
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, 0.48, 0.28);
    this.owlGroup.add(beak);

    // Big glowing nocturnal eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffdf6d });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

    [-0.09, 0.09].forEach(x => {
      const eye = new THREE.Mesh(new THREE.CircleGeometry(0.065, 12), eyeMat);
      eye.position.set(x, 0.55, 0.24);
      const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.035, 12), pupilMat);
      pupil.position.z = 0.01;
      eye.add(pupil);
      this.owlGroup.add(eye);
    });

    // Articulated Wings (Left)
    this.leftWingGroup.position.set(-0.25, 0.25, 0);
    const wingGeo = new THREE.BoxGeometry(0.65, 0.35, 0.04);
    const lWing = new THREE.Mesh(wingGeo, darkFeatherMat);
    lWing.position.x = -0.32;
    this.leftWingGroup.add(lWing);
    this.owlGroup.add(this.leftWingGroup);

    // Articulated Wings (Right)
    this.rightWingGroup.position.set(0.25, 0.25, 0);
    const rWing = new THREE.Mesh(wingGeo, darkFeatherMat);
    rWing.position.x = 0.32;
    this.rightWingGroup.add(rWing);
    this.owlGroup.add(this.rightWingGroup);

    // Flight spline path originating from night sky down to perch
    this.flightCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(2.2, 4.0, -1.6),
      new THREE.Vector3(1.2, 2.5, -0.6),
      new THREE.Vector3(0.4, 1.2, 0.4),
      new THREE.Vector3(0.0, 0.4, 0.2) // Perch landing pos
    ]);

    this.owlGroup.position.copy(this.flightCurve.getPoint(0));
    this.group.add(this.owlGroup);
  }

  buildSealedLetter() {
    const parchmentMat = new THREE.MeshStandardMaterial({
      color: 0xf5eedb,
      roughness: 0.6
    });

    const waxMat = new THREE.MeshStandardMaterial({
      color: 0x9e1b26,
      roughness: 0.3,
      metalness: 0.3,
      emissive: 0x3d070b,
      emissiveIntensity: 0.4
    });

    const envelope = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.24, 0.03), parchmentMat);
    this.letterGroup.add(envelope);

    this.waxSeal = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.02, 12), waxMat);
    this.waxSeal.rotation.x = Math.PI / 2;
    this.waxSeal.position.z = 0.02;
    this.letterGroup.add(this.waxSeal);

    this.letterGroup.position.set(0, 0.1, 0.2);
    this.group.add(this.letterGroup);
  }

  buildFloating3DPhone() {
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x181822,
      roughness: 0.25,
      metalness: 0.85
    });

    const edgeGlowMat = new THREE.MeshStandardMaterial({
      color: 0xa36bf0,
      emissive: 0x7b32e6,
      emissiveIntensity: 0.7,
      roughness: 0.2,
      metalness: 0.9
    });

    // Sleek smartphone chassis
    const phoneBody = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.7, 0.08), bodyMat);
    this.phoneGroup.add(phoneBody);

    const edgeRim = new THREE.Mesh(new THREE.BoxGeometry(1.44, 2.74, 0.06), edgeGlowMat);
    this.phoneGroup.add(edgeRim);

    // Live Animated Canvas Screen (Jetpack Compose Card List)
    this.appCanvas = document.createElement('canvas');
    this.appCanvas.width = 512;
    this.appCanvas.height = 960;
    this.appCtx = this.appCanvas.getContext('2d');
    this.renderComposeScreen(0);

    this.appCanvasTex = new THREE.CanvasTexture(this.appCanvas);
    this.appCanvasTex.minFilter = THREE.LinearFilter;
    this.appCanvasTex.magFilter = THREE.LinearFilter;

    const screenMat = new THREE.MeshBasicMaterial({ map: this.appCanvasTex });
    const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 2.58), screenMat);
    screenMesh.position.z = 0.045;
    this.phoneGroup.add(screenMesh);

    this.phoneGroup.position.set(0, 0.35, 0.4);
    this.phoneGroup.scale.set(0.001, 0.001, 0.001);
    this.group.add(this.phoneGroup);
  }

  renderComposeScreen(activeCard = 0) {
    const ctx = this.appCtx;
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#0f111a';
    ctx.fillRect(0, 0, 512, 960);

    // Compose TopAppBar
    ctx.fillStyle = '#1e1c2e';
    ctx.fillRect(0, 0, 512, 110);
    ctx.fillStyle = '#a36bf0';
    ctx.font = "bold 34px 'Cinzel', sans-serif";
    ctx.fillText("Compose Components", 32, 70);

    // Component Cards List
    const cards = [
      { title: "LazyColumn()", state: "Smooth Scrolling List" },
      { title: "ElevatedCard()", state: "Material 3 Theme" },
      { title: "Scaffold & TopBar", state: "State-driven Architecture" },
      { title: "AnimatedVisibility", state: "Smooth Spring Physics" }
    ];

    cards.forEach((c, idx) => {
      const y = 140 + idx * 160;
      const isSelected = (idx === activeCard);

      ctx.fillStyle = isSelected ? '#332354' : '#191b28';
      ctx.strokeStyle = isSelected ? '#a36bf0' : '#2b2d42';
      ctx.lineWidth = isSelected ? 4 : 2;

      ctx.beginPath();
      ctx.roundRect(28, y, 456, 130, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isSelected ? '#ffffff' : '#e0d8f0';
      ctx.font = "bold 32px sans-serif";
      ctx.fillText(c.title, 56, y + 54);

      ctx.fillStyle = '#948bad';
      ctx.font = "24px sans-serif";
      ctx.fillText(c.state, 56, y + 96);
    });

    // Bottom Animated Action Button
    ctx.fillStyle = '#a36bf0';
    ctx.beginPath();
    ctx.roundRect(40, 820, 432, 90, 24);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = "bold 32px sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText("Tap to Recompose ✦", 256, 876);
    ctx.textAlign = 'start';

    if (this.appCanvasTex) this.appCanvasTex.needsUpdate = true;
  }

  setupInteraction() {
    const el = document.getElementById('webgl-container');
    if (!el) return;

    el.addEventListener('pointerdown', (e) => {
      if (!this.isEntered) return;
      // Cycle through active Compose Cards on tap
      this.cardTapIndex = ((this.cardTapIndex || 0) + 1) % 4;
      this.renderComposeScreen(this.cardTapIndex);

      // Bounce phone haptically
      gsap.timeline()
        .to(this.phoneGroup.scale, { x: 1.06, y: 1.06, z: 1.06, duration: 0.1 })
        .to(this.phoneGroup.scale, { x: 1, y: 1, z: 1, duration: 0.2 });
    });
  }

  enter() {
    super.enter();
    this.group.visible = true;
    this.flightProgress.val = 0;
    this.isLanded = false;
    this.isPhoneOpen = false;

    // Reset components
    this.phoneGroup.scale.set(0.001, 0.001, 0.001);
    this.letterGroup.position.set(0, 0.4, 0.2);
    this.waxSeal.scale.set(1, 1, 1);

    if (this.isReducedMotion) {
      this.owlGroup.position.copy(this.flightCurve.getPoint(1.0));
      this.phoneGroup.scale.set(1, 1, 1);
      this.isLanded = true;
      return;
    }

    // Owl curved flight animation
    gsap.to(this.flightProgress, {
      val: 1.0,
      duration: 2.2,
      ease: 'power2.out',
      onUpdate: () => {
        const pt = this.flightCurve.getPoint(this.flightProgress.val);
        this.owlGroup.position.copy(pt);
      },
      onComplete: () => {
        this.isLanded = true;
        // Break seal and unfold into 3D phone
        gsap.timeline()
          .to(this.letterGroup.position, { y: -0.15, duration: 0.8, ease: 'bounce.out' })
          .to(this.waxSeal.scale, { x: 0, y: 0, z: 0, duration: 0.3 })
          .to(this.letterGroup.scale, { x: 0.01, y: 0.01, duration: 0.3 })
          .to(this.phoneGroup.scale, { x: 1, y: 1, z: 1, duration: 1.0, ease: 'back.out(1.6)' });
      }
    });
  }

  exit() {
    super.exit();
    this.phoneGroup.scale.set(0.001, 0.001, 0.001);
  }

  update(time, delta, mouse) {
    if (!this.isEntered) return;

    // Flapping wings during flight
    if (!this.isLanded) {
      const flap = Math.sin(time * 16.0) * 0.7;
      this.leftWingGroup.rotation.z = flap;
      this.rightWingGroup.rotation.z = -flap;
    } else {
      // Folded wings breathing on perch
      this.leftWingGroup.rotation.z = -0.2 + Math.sin(time * 2.0) * 0.05;
      this.rightWingGroup.rotation.z = 0.2 - Math.sin(time * 2.0) * 0.05;
      this.owlGroup.position.y = 0.4 + Math.sin(time * 2.5) * 0.02;
    }

    // Phone interactive tilt with mouse/device
    if (mouse && this.phoneGroup.scale.x > 0.5) {
      this.phoneGroup.rotation.y = mouse.x * 0.4;
      this.phoneGroup.rotation.x = -mouse.y * 0.3;
      this.phoneGroup.position.y = 0.35 + Math.sin(time * 1.8) * 0.05;
    }
  }
}