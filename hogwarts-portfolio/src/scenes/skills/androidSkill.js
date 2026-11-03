import * as THREE from 'three';
import gsap from 'gsap';
import { SkillBase } from './skillBase.js';

export class AndroidSkill extends SkillBase {
  init(alcovePosition) {
    this.group.position.copy(alcovePosition);
    this.group.visible = false;

    this.wallBricks = [];
    this.workshopGroup = new THREE.Group();
    this.monitor = null;
    this.codeCanvas = null;
    this.codeCtx = null;
    this.codeTex = null;
    this.emulatorCanvas = null;
    this.emulatorTex = null;
    this.doorLight = null;
    this.typingTimer = 0;
    this.codeLineIndex = 0;

    this.codeLines = [
      "package com.joel.odyssey",
      "",
      "@Composable",
      "fun RoomOfRequirementScreen() {",
      "    var isBuildPassed by remember { mutableStateOf(true) }",
      "    Scaffold(",
      "        topBar = { TopAppBar(title = { Text(\"Odyssey\") }) }",
      "    ) { padding ->",
      "        LazyColumn(modifier = Modifier.padding(padding)) {",
      "            items(componentsList) { item ->",
      "                ComponentCard(item = item)",
      "            }",
      "        }",
      "    }",
      "}"
    ];

    this.buildSlideBrickDoorway();
    this.buildWorkshopInterior();
    this.setupMonitorZoom();
  }

  buildSlideBrickDoorway() {
    const brickMat = new THREE.MeshStandardMaterial({
      color: 0x3b2a20,
      roughness: 0.85,
      metalness: 0.08
    });

    const rows = 8;
    const cols = 6;
    const brickW = 0.65;
    const brickH = 0.42;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const brick = new THREE.Mesh(new THREE.BoxGeometry(brickW, brickH, 0.25), brickMat);
        const x = (c - (cols - 1) / 2) * (brickW + 0.03);
        const y = (r - (rows - 1) / 2) * (brickH + 0.03) + 0.8;
        brick.position.set(x, y, 0.5);
        brick.userData = {
          origX: x,
          origY: y,
          slideDir: c < cols / 2 ? -1 : 1
        };
        this.group.add(brick);
        this.wallBricks.push(brick);
      }
    }

    // Warm orange light pouring from the room
    this.doorLight = new THREE.PointLight(0xff9f43, 0.0, 14, 1.1);
    this.doorLight.position.set(0, 1.2, 0.2);
    this.group.add(this.doorLight);
  }

  buildWorkshopInterior() {
    this.workshopGroup.position.set(0, 0, -1.2);
    this.workshopGroup.scale.set(0.001, 0.001, 0.001);

    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x4a2a18,
      roughness: 0.65
    });

    // 1. Oak Developer Desk
    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.18, 1.6), woodMat);
    deskTop.position.set(0, -0.4, 0);
    this.workshopGroup.add(deskTop);

    // Desk Legs
    [-1.6, 1.6].forEach(x => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.6), woodMat);
      leg.position.set(x, -1.2, 0);
      this.workshopGroup.add(leg);
    });

    // 2. Glowing IDE Code Editor Monitor
    const monitorFrameMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a24,
      metalness: 0.8,
      roughness: 0.2
    });
    this.monitor = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.25, 0.08), monitorFrameMat);
    this.monitor.position.set(-0.45, 0.45, 0);
    this.workshopGroup.add(this.monitor);

    // Live Syntax Canvas Texture
    this.codeCanvas = document.createElement('canvas');
    this.codeCanvas.width = 1024;
    this.codeCanvas.height = 640;
    this.codeCtx = this.codeCanvas.getContext('2d');
    this.renderIDECode();

    this.codeTex = new THREE.CanvasTexture(this.codeCanvas);
    const codeScreenMat = new THREE.MeshBasicMaterial({ map: this.codeTex });
    const codeScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.15), codeScreenMat);
    codeScreen.position.z = 0.045;
    this.monitor.add(codeScreen);

    // 3. Android Emulator Device Frame
    const emuFrame = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.45, 0.06), monitorFrameMat);
    emuFrame.position.set(1.15, 0.45, 0.1);
    this.workshopGroup.add(emuFrame);

    this.emulatorCanvas = document.createElement('canvas');
    this.emulatorCanvas.width = 360;
    this.emulatorCanvas.height = 720;
    this.renderEmulatorApp();

    this.emulatorTex = new THREE.CanvasTexture(this.emulatorCanvas);
    const emuScreenMat = new THREE.MeshBasicMaterial({ map: this.emulatorTex });
    const emuScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 1.38), emuScreenMat);
    emuScreen.position.z = 0.035;
    emuFrame.add(emuScreen);

    // 4. Book Shelves with arcane tomes and floating tools
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.12, 0.6), woodMat);
    shelf.position.set(0, 1.7, -0.6);
    this.workshopGroup.add(shelf);

    // Books
    const bookColors = [0x9e2b25, 0x1e3f66, 0x2e7d32, 0xd4a017];
    for (let b = 0; b < 6; b++) {
      const bMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.55, 0.42),
        new THREE.MeshStandardMaterial({ color: bookColors[b % bookColors.length] })
      );
      bMesh.position.set(-1.2 + b * 0.18, 2.05, -0.6);
      this.workshopGroup.add(bMesh);
    }

    // Warm Interior Ambient
    const intWarmth = new THREE.PointLight(0xffbe58, 4.5, 12, 1.1);
    intWarmth.position.set(0, 1.6, 0.8);
    this.workshopGroup.add(intWarmth);

    this.group.add(this.workshopGroup);
  }

  renderIDECode() {
    const ctx = this.codeCtx;
    if (!ctx) return;

    ctx.fillStyle = '#1e1f29';
    ctx.fillRect(0, 0, 1024, 640);

    // IDE Header Tabs
    ctx.fillStyle = '#2b2d3a';
    ctx.fillRect(0, 0, 1024, 50);
    ctx.fillStyle = '#ff9f43';
    ctx.font = "bold 22px monospace";
    ctx.fillText("MainScreen.kt", 24, 34);

    // Line Numbers & Typing Code
    ctx.font = "20px monospace";
    for (let i = 0; i <= this.codeLineIndex; i++) {
      const line = this.codeLines[i];
      if (line === undefined) continue;

      ctx.fillStyle = '#5c6370';
      ctx.fillText(String(i + 1).padStart(2, ' '), 20, 85 + i * 32);

      // Syntax Colors
      if (line.startsWith("@") || line.startsWith("package")) {
        ctx.fillStyle = '#e06c75';
      } else if (line.includes("fun ") || line.includes("val ")) {
        ctx.fillStyle = '#61afef';
      } else if (line.includes("\"")) {
        ctx.fillStyle = '#98c379';
      } else {
        ctx.fillStyle = '#abb2bf';
      }
      ctx.fillText(line, 75, 85 + i * 32);
    }

    // Green "BUILD SUCCESSFUL" Badge in footer
    ctx.fillStyle = '#162b1e';
    ctx.fillRect(0, 570, 1024, 70);
    ctx.fillStyle = '#2ecc71';
    ctx.font = "bold 26px monospace";
    ctx.fillText("✔ BUILD SUCCESSFUL in 1s 420ms (Android Gradle Plugin 8.3)", 32, 614);

    if (this.codeTex) this.codeTex.needsUpdate = true;
  }

  renderEmulatorApp() {
    const ctx = this.emulatorCanvas.getContext('2d');
    ctx.fillStyle = '#121212';
    ctx.fillRect(0, 0, 360, 720);

    ctx.fillStyle = '#1f1f1f';
    ctx.fillRect(0, 0, 360, 80);

    ctx.fillStyle = '#3ddc84';
    ctx.font = "bold 24px sans-serif";
    ctx.fillText("Odyssey Running", 24, 50);

    // Render 3 app mock cards
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = '#282828';
      ctx.beginPath();
      ctx.roundRect(20, 110 + i * 160, 320, 130, 12);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = "bold 20px sans-serif";
      ctx.fillText(`App Component 0${i + 1}`, 40, 160 + i * 160);

      ctx.fillStyle = '#888888';
      ctx.font = "16px sans-serif";
      ctx.fillText("Jetpack Compose Live Preview", 40, 200 + i * 160);
    }
  }

  setupMonitorZoom() {
    const el = document.getElementById('webgl-container');
    if (!el) return;

    el.addEventListener('pointermove', (e) => {
      if (!this.isEntered) return;
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;

      // Monitor interactive push-in on hover
      if (Math.abs(x) < 0.35 && Math.abs(y) < 0.35) {
        gsap.to(this.monitor.position, { z: 0.25, duration: 0.4 });
      } else {
        gsap.to(this.monitor.position, { z: 0, duration: 0.4 });
      }
    });
  }

  enter() {
    super.enter();
    this.group.visible = true;

    // Bricks slide apart and warm light pours out
    this.wallBricks.forEach(b => {
      gsap.to(b.position, {
        x: b.userData.origX + b.userData.slideDir * 2.8,
        z: -1.2,
        duration: 1.6,
        ease: 'power3.inOut'
      });
    });

    gsap.to(this.doorLight, { intensity: 5.5, duration: 1.4 });

    // Workshop room scales in
    gsap.to(this.workshopGroup.scale, {
      x: 1, y: 1, z: 1,
      duration: 1.5,
      delay: 0.4,
      ease: 'power2.out'
    });

    this.codeLineIndex = 0;
  }

  exit() {
    super.exit();
    // Bricks slide back together
    this.wallBricks.forEach(b => {
      gsap.to(b.position, {
        x: b.userData.origX,
        z: 0.5,
        duration: 0.8,
        ease: 'power2.in'
      });
    });

    gsap.to(this.doorLight, { intensity: 0, duration: 0.6 });
    gsap.to(this.workshopGroup.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 0.6 });
  }

  update(time, delta, mouse) {
    if (!this.isEntered) return;

    // Typing code simulator
    this.typingTimer += delta;
    if (this.typingTimer > 0.45 && this.codeLineIndex < this.codeLines.length - 1) {
      this.typingTimer = 0;
      this.codeLineIndex++;
      this.renderIDECode();
    }
  }
}