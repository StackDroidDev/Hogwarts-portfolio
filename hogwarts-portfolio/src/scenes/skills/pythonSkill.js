import * as THREE from 'three';
import gsap from 'gsap';
import { SkillBase } from './skillBase.js';

export class PythonSkill extends SkillBase {
  init(alcovePosition) {
    this.group.position.copy(alcovePosition);
    this.group.visible = false;

    this.snakeCurve = null;
    this.snakeMesh = null;
    this.snakeMat = null;
    this.eyeL = null;
    this.eyeR = null;
    this.tongue = null;
    this.titleMesh = null;
    this.spotLight = null;

    this.isHovered = false;
    this.curvePoints = [];
    this.pointCount = 40;

    this.buildPythonPedestal();
    this.buildSerpentGeometry();
    this.buildWordAnchor();
    this.buildSerpentLighting();
    this.setupInteraction();
  }

  buildPythonPedestal() {
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x1f2922,
      roughness: 0.65,
      metalness: 0.15,
      emissive: 0x09140c,
      emissiveIntensity: 0.3
    });

    const dais = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.7, 0.4, 24), stoneMat);
    dais.position.y = -1.2;
    this.group.add(dais);
  }

  buildSerpentGeometry() {
    // Generate initial snake curve
    this.curvePoints = [];
    for (let i = 0; i < this.pointCount; i++) {
      const t = i / (this.pointCount - 1);
      const angle = t * Math.PI * 4.0;
      const radius = 0.5 + t * 0.45;
      const x = Math.cos(angle) * radius;
      const y = -0.8 + t * 1.8;
      const z = Math.sin(angle) * radius;
      this.curvePoints.push(new THREE.Vector3(x, y, z));
    }

    this.snakeCurve = new THREE.CatmullRomCurve3(this.curvePoints);

    // Realistic emerald green snake scale pattern shader
    this.snakeMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uGlowColor: { value: new THREE.Color(0x2ecc71) },
        uBaseColor: { value: new THREE.Color(0x0a2916) }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uGlowColor;
        uniform vec3 uBaseColor;
        varying vec2 vUv;
        varying vec3 vNormal;

        void main() {
          // Hexagonal serpentine scale pattern
          vec2 p = vUv * vec2(28.0, 7.0);
          float scalePattern = sin(p.x * 3.1415) * sin(p.y * 3.1415);
          scalePattern = smoothstep(0.05, 0.5, abs(scalePattern));

          float rim = 1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0);
          vec3 col = mix(uBaseColor, uGlowColor, scalePattern * 0.75 + rim * 0.4);
          col += uGlowColor * pow(rim, 2.5) * 0.6;
          gl_FragColor = vec4(col, 1.0);
        }
      `
    });

    const tubeGeo = new THREE.TubeGeometry(this.snakeCurve, 64, 0.11, 10, false);
    this.snakeMesh = new THREE.Mesh(tubeGeo, this.snakeMat);
    this.group.add(this.snakeMesh);

    // Snake Head & glowing eyes
    this.headGroup = new THREE.Group();
    const headMat = new THREE.MeshStandardMaterial({
      color: 0x164627,
      roughness: 0.35,
      metalness: 0.2
    });

    const headGeo = new THREE.ConeGeometry(0.18, 0.45, 10);
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.rotation.x = Math.PI / 2;
    this.headGroup.add(headMesh);

    const eyeGeo = new THREE.SphereGeometry(0.045, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x82ff9e });

    this.eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    this.eyeL.position.set(-0.11, 0.05, 0.08);

    this.eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    this.eyeR.position.set(0.11, 0.05, 0.08);

    this.headGroup.add(this.eyeL, this.eyeR);

    // Flicking forked tongue
    const tongueGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.25);
    const tongueMat = new THREE.MeshBasicMaterial({ color: 0xff3b30 });
    this.tongue = new THREE.Mesh(tongueGeo, tongueMat);
    this.tongue.rotation.x = Math.PI / 2;
    this.tongue.position.set(0, -0.02, 0.32);
    this.tongue.scale.set(0, 0, 0);
    this.headGroup.add(this.tongue);

    const headPos = this.curvePoints[this.curvePoints.length - 1];
    this.headGroup.position.copy(headPos);
    this.group.add(this.headGroup);
  }

  buildWordAnchor() {
    // 3D Anchor Plaque "PYTHON" that the serpent winds around
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#06130b';
    ctx.fillRect(0, 0, 512, 180);
    ctx.strokeStyle = '#2ecc71';
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, 496, 164);

    ctx.font = "900 85px 'Cinzel', serif";
    ctx.fillStyle = '#58f78f';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#2ecc71';
    ctx.shadowBlur = 18;
    ctx.fillText("PYTHON", 256, 120);

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.2,
      metalness: 0.6,
      emissive: 0x124722,
      emissiveIntensity: 0.45
    });

    this.titleMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.85), mat);
    this.titleMesh.position.set(0, 0.3, 0);
    this.group.add(this.titleMesh);
  }

  buildSerpentLighting() {
    this.spotLight = new THREE.PointLight(0x2ecc71, 4.0, 9.0, 1.2);
    this.spotLight.position.set(0, 1.5, 2.0);
    this.group.add(this.spotLight);
  }

  setupInteraction() {
    const el = document.getElementById('webgl-container');
    if (!el) return;

    el.addEventListener('pointerdown', () => {
      if (this.isEntered) {
        this.flickTongue();
      }
    });
  }

  flickTongue() {
    if (!this.tongue) return;
    gsap.timeline()
      .to(this.tongue.scale, { x: 1, y: 1.5, z: 1, duration: 0.12 })
      .to(this.tongue.scale, { x: 0, y: 0, z: 0, duration: 0.16 });
  }

  enter() {
    super.enter();
    this.group.visible = true;

    // Serpent uncoiling grow animation
    this.snakeMesh.scale.set(0.001, 0.001, 0.001);
    gsap.to(this.snakeMesh.scale, {
      x: 1, y: 1, z: 1,
      duration: 1.6,
      ease: 'power2.out'
    });

    this.headGroup.scale.set(0.001, 0.001, 0.001);
    gsap.to(this.headGroup.scale, {
      x: 1, y: 1, z: 1,
      duration: 1.2,
      delay: 0.4,
      ease: 'back.out(1.4)',
      onComplete: () => this.flickTongue()
    });
  }

  update(time, delta, mouse) {
    if (!this.isEntered) return;

    if (this.snakeMat) {
      this.snakeMat.uniforms.uTime.value = time;
    }

    // Sinusoidal body oscillation
    for (let i = 0; i < this.pointCount; i++) {
      const t = i / (this.pointCount - 1);
      const wave = Math.sin(time * 2.8 + t * 6.0) * 0.14;
      this.curvePoints[i].x += (Math.cos(t * Math.PI * 4.0 + time * 1.5) * (0.5 + t * 0.45) + wave - this.curvePoints[i].x) * 0.12;
    }

    // Rebuild procedural tube along live curve
    this.snakeCurve.points = this.curvePoints;
    const newGeo = new THREE.TubeGeometry(this.snakeCurve, 48, 0.11, 8, false);
    this.snakeMesh.geometry.dispose();
    this.snakeMesh.geometry = newGeo;

    // Head tracks cursor
    if (this.headGroup) {
      const headPos = this.curvePoints[this.curvePoints.length - 1];
      this.headGroup.position.copy(headPos);

      if (mouse) {
        this.headGroup.rotation.y = mouse.x * 0.6;
        this.headGroup.rotation.x = -mouse.y * 0.4 + Math.PI / 8;
      }
    }
  }
}