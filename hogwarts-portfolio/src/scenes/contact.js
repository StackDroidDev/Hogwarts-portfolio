import * as THREE from 'three';
import gsap from 'gsap';
import { content } from '../content.js';

export class ContactScene {
  constructor(scene, camera, houseThemeManager) {
    this.scene = scene;
    this.camera = camera;
    this.houseTheme = houseThemeManager;

    this.group = new THREE.Group();
    // Positioned in the Owlery Tower at Z = -515
    this.group.position.set(0, 0, -515);
    this.scene.add(this.group);

    this.owlGroup = new THREE.Group();
    this.owlHead = null;
    this.owlWingsL = null;
    this.owlWingsR = null;
    this.feathers = [];
    this.isDispatched = false;

    this.init();
    this.initUI();
    this.bindFormHandlers();
  }

  init() {
    this.buildOwleryChamber();
    this.buildContactOwl();
    this.buildFloatingFeathers();
  }

  buildOwleryChamber() {
    // 1. Procedural Fine Ashlar Stone Texture for Owlery Tower Walls & Floor
    const stoneCanvas = document.createElement('canvas');
    stoneCanvas.width = 512;
    stoneCanvas.height = 512;
    const ctx = stoneCanvas.getContext('2d');

    ctx.fillStyle = '#1c2333';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = 'rgba(10, 14, 24, 0.45)';
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
    stoneTex.repeat.set(6, 4);

    const stoneMat = new THREE.MeshStandardMaterial({
      map: stoneTex,
      roughness: 0.72,
      metalness: 0.1,
      emissive: 0x141c2c,
      emissiveIntensity: 0.38,
      side: THREE.BackSide
    });

    // Circular stone tower chamber
    const chamber = new THREE.Mesh(new THREE.CylinderGeometry(12, 12, 18, 32, 1, true), stoneMat);
    chamber.position.y = 4.5;
    this.group.add(chamber);

    // Tower Flagstone Floor
    const floorMat = new THREE.MeshStandardMaterial({
      map: stoneTex,
      roughness: 0.55,
      metalness: 0.15,
      emissive: 0x101624,
      emissiveIntensity: 0.32
    });
    const floor = new THREE.Mesh(new THREE.CircleGeometry(12, 32), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.35;
    floor.receiveShadow = true;
    this.group.add(floor);

    // 2. Glowing Moonlit Gothic Window (Positioned on the RIGHT half)
    const moonGroup = new THREE.Group();
    moonGroup.position.set(4.2, 3.4, -10.5);

    const moonGeo = new THREE.CircleGeometry(2.0, 32);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xedeaff });
    const moon = new THREE.Mesh(moonGeo, moonMat);
    moonGroup.add(moon);

    // Soft moon halo
    const moonHalo = new THREE.Mesh(
      new THREE.RingGeometry(1.9, 3.0, 32),
      new THREE.MeshBasicMaterial({
        color: 0x9fbaff,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide
      })
    );
    moonGroup.add(moonHalo);
    this.group.add(moonGroup);

    // 3. Comprehensive Owlery Illumination
    const amb = new THREE.AmbientLight(0xdce6f5, 1.85);
    this.group.add(amb);

    const hemi = new THREE.HemisphereLight(0x3e5272, 0x5a3e26, 1.35);
    this.group.add(hemi);

    // Moonlight key light
    const moonLight = new THREE.DirectionalLight(0xb8d2ff, 1.4);
    moonLight.position.set(3.5, 6.0, -7.0);
    this.group.add(moonLight);

    // Warm hanging lantern near the roost
    const roostLantern = new THREE.PointLight(0xffbe58, 3.4, 14, 1.2);
    roostLantern.position.set(2.4, 3.0, 0.4);
    this.group.add(roostLantern);
  }

  buildContactOwl() {
    // Non-emissive feather material prevents bloom lightbulb effect
    const featherMat = new THREE.MeshStandardMaterial({
      color: 0xddd7cb,
      roughness: 0.8,
      metalness: 0.05,
      emissive: 0x000000
    });

    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x5a4430,
      roughness: 0.85,
      metalness: 0.05,
      emissive: 0x000000
    });

    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x4a2e1c,
      roughness: 0.55,
      metalness: 0.15,
      emissive: 0x1f1208,
      emissiveIntensity: 0.35
    });

    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xf5cf58,
      roughness: 0.25,
      metalness: 0.9,
      emissive: 0x5a3e08,
      emissiveIntensity: 0.4
    });

    // 1. Heavy Roost Beam & Brass Wall Brackets
    const roostGroup = new THREE.Group();
    roostGroup.position.set(3.2, 1.0, -1.0);

    const perchBeam = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.18, 0.35), woodMat);
    roostGroup.add(perchBeam);

    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.8, 0.4), brassMat);
    bracket.position.set(2.2, -0.3, 0);
    roostGroup.add(bracket);
    this.group.add(roostGroup);

    // 2. Owl Assembly
    this.owlGroup.position.set(3.2, 1.55, -1.0);

    // Torso (Smooth egg-shaped body resting naturally on roost)
    const bodyGeo = new THREE.SphereGeometry(0.38, 20, 20);
    bodyGeo.scale(1.0, 1.35, 0.9);
    const body = new THREE.Mesh(bodyGeo, featherMat);
    body.position.y = 0.2;
    this.owlGroup.add(body);

    // Golden Talons gripping the wooden beam
    [-0.14, 0.14].forEach(x => {
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.22), brassMat);
      foot.position.set(x, -0.42, 0.06);
      this.owlGroup.add(foot);
    });

    // Head
    this.owlHead = new THREE.Group();
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 20), featherMat);
    this.owlHead.add(headMesh);

    // Beak
    const beak = new THREE.Mesh(
      new THREE.ConeGeometry(0.05, 0.18, 10),
      new THREE.MeshStandardMaterial({ color: 0xd49b28, roughness: 0.3, metalness: 0.6 })
    );
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, -0.06, 0.32);
    this.owlHead.add(beak);

    // Luminous Amber Eyes with Dark Pupil
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffb834 });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x0a0a0a });

    [-0.11, 0.11].forEach(x => {
      const eyeRing = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 8, 20), brassMat);
      eyeRing.position.set(x, 0.08, 0.27);

      const eye = new THREE.Mesh(new THREE.CircleGeometry(0.075, 16), eyeMat);
      eye.position.set(x, 0.08, 0.28);

      const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.038, 16), pupilMat);
      pupil.position.z = 0.01;
      eye.add(pupil);

      this.owlHead.add(eyeRing, eye);
    });

    this.owlHead.position.set(0, 0.68, 0.05);
    this.owlGroup.add(this.owlHead);

    // Wings
    const wingGeo = new THREE.BoxGeometry(0.12, 0.85, 0.42);
    this.owlWingsL = new THREE.Mesh(wingGeo, wingMat);
    this.owlWingsL.position.set(-0.38, 0.15, -0.02);
    this.owlWingsR = new THREE.Mesh(wingGeo, wingMat);
    this.owlWingsR.position.set(0.38, 0.15, -0.02);
    this.owlGroup.add(this.owlWingsL, this.owlWingsR);

    this.group.add(this.owlGroup);
  }

  buildFloatingFeathers() {
    // Soft curved feather shape geometry
    const shape = new THREE.Shape();
    shape.moveTo(0, -0.15);
    shape.quadraticCurveTo(0.06, 0, 0, 0.15);
    shape.quadraticCurveTo(-0.06, 0, 0, -0.15);
    const geo = new THREE.ShapeGeometry(shape);

    const mat = new THREE.MeshStandardMaterial({
      color: 0xc4b9a9,
      roughness: 0.7,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide
    });

    for (let i = 0; i < 20; i++) {
      const f = new THREE.Mesh(geo, mat);
      f.position.set((Math.random() - 0.5) * 8 + 2.0, Math.random() * 6.0, (Math.random() - 0.5) * 5);
      f.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      f.userData = {
        speed: 0.35 + Math.random() * 0.4,
        rotSpeed: 0.4 + Math.random() * 0.4,
        swayOffset: Math.random() * Math.PI * 2
      };
      this.group.add(f);
      this.feathers.push(f);
    }
  }

  initUI() {
    let el = document.getElementById('contact-ui');
    if (!el) {
      el = document.createElement('div');
      el.id = 'contact-ui';
      document.body.appendChild(el);
    }
    el.className = 'contact-ui hidden';
    el.innerHTML = `
      <div class="contact-card-parchment">
        <h2 class="contact-title">${content.contact.title}</h2>
        <p class="contact-subtitle">${content.contact.subtitle}</p>

        <form id="owl-contact-form" class="contact-form" novalidate>
          <div class="form-field">
            <label for="contact-name" class="form-label">Name</label>
            <input type="text" id="contact-name" class="form-input" placeholder="${content.contact.namePlaceholder}" required />
            <span class="field-error" id="err-name"></span>
          </div>

          <div class="form-field">
            <label for="contact-email" class="form-label">Owl Return Address (Email)</label>
            <input type="email" id="contact-email" class="form-input" placeholder="${content.contact.emailPlaceholder}" required />
            <span class="field-error" id="err-email"></span>
          </div>

          <div class="form-field">
            <label for="contact-message" class="form-label">Missive (Message)</label>
            <textarea id="contact-message" class="form-textarea" rows="4" placeholder="${content.contact.messagePlaceholder}" required></textarea>
            <span class="field-error" id="err-message"></span>
          </div>

          <button type="submit" id="btn-dispatch-owl" class="magic-gold-btn submit-btn">
            <span>${content.contact.sendButton}</span> 🪶
          </button>
        </form>

        <div id="contact-status-banner" class="status-banner hidden"></div>

        <div class="wax-seals-row">
          <a href="${content.github}" target="_blank" rel="noopener noreferrer" class="wax-seal-btn seal-github" aria-label="GitHub Profile">
            <span class="seal-inner">GH</span>
          </a>
          <a href="${content.linkedin}" target="_blank" rel="noopener noreferrer" class="wax-seal-btn seal-linkedin" aria-label="LinkedIn Profile">
            <span class="seal-inner">IN</span>
          </a>
          <a href="mailto:${content.email}" class="wax-seal-btn seal-email" aria-label="Send direct email">
            <span class="seal-inner">✉</span>
          </a>
        </div>
      </div>
    `;
  }

  bindFormHandlers() {
    const form = document.getElementById('owl-contact-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('contact-name');
      const emailInput = document.getElementById('contact-email');
      const messageInput = document.getElementById('contact-message');

      const errName = document.getElementById('err-name');
      const errEmail = document.getElementById('err-email');
      const errMessage = document.getElementById('err-message');
      const statusBanner = document.getElementById('contact-status-banner');

      errName.textContent = "";
      errEmail.textContent = "";
      errMessage.textContent = "";

      let isValid = true;

      if (!nameInput.value.trim()) {
        errName.textContent = "Kindly state your name, traveller.";
        isValid = false;
      }

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(emailInput.value.trim())) {
        errEmail.textContent = "Please provide a valid postal email address.";
        isValid = false;
      }

      if (messageInput.value.trim().length < 10) {
        errMessage.textContent = "Your missive must be at least 10 characters long.";
        isValid = false;
      }

      if (!isValid) return;

      const submitBtn = document.getElementById('btn-dispatch-owl');
      submitBtn.disabled = true;
      submitBtn.textContent = "Sealing letter...";

      this.dispatchOwlFlight();

      if (content.formEndpoint && content.formEndpoint.trim() !== "") {
        try {
          const res = await fetch(content.formEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
              name: nameInput.value.trim(),
              email: emailInput.value.trim(),
              message: messageInput.value.trim()
            })
          });

          if (res.ok) {
            statusBanner.textContent = content.contact.successMsg;
            statusBanner.className = "status-banner success";
            form.reset();
          } else {
            throw new Error();
          }
        } catch {
          statusBanner.textContent = "Form server unavailable. Opening mail client...";
          statusBanner.className = "status-banner";
          this.triggerMailto(nameInput.value, emailInput.value, messageInput.value);
        }
      } else {
        this.triggerMailto(nameInput.value, emailInput.value, messageInput.value);
        statusBanner.textContent = content.contact.successMsg;
        statusBanner.className = "status-banner success";
        form.reset();
      }

      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>${content.contact.sendButton}</span> 🪶`;
    });
  }

  triggerMailto(name, email, message) {
    const subject = encodeURIComponent(`Missive from ${name} via Odyssey Portfolio`);
    const body = encodeURIComponent(`From: ${name} (${email})\n\nMessage:\n${message}`);
    window.location.href = `mailto:${content.email}?subject=${subject}&body=${body}`;
  }

  dispatchOwlFlight() {
    this.isDispatched = true;

    gsap.timeline()
      .to(this.owlGroup.position, {
        x: 0,
        y: 6.5,
        z: -12.0,
        duration: 2.4,
        ease: 'power2.in'
      })
      .to(this.owlGroup.scale, { x: 0.1, y: 0.1, z: 0.1, duration: 1.0 }, 1.4)
      .set(this.owlGroup.position, { x: 3.2, y: 1.55, z: -1.0, delay: 1.5 })
      .set(this.owlGroup.scale, { x: 1, y: 1, z: 1 })
      .add(() => { this.isDispatched = false; });
  }

  enter() {
    this.group.visible = true;
    document.getElementById('contact-ui')?.classList.remove('hidden');
  }

  exit() {
    document.getElementById('contact-ui')?.classList.add('hidden');
    this.group.visible = false;
  }

  update(time, delta, mouse) {
    if (!this.group.visible) return;

    if (this.owlHead && mouse && !this.isDispatched) {
      this.owlHead.rotation.y = mouse.x * 0.75;
      this.owlHead.rotation.x = -mouse.y * 0.45;
    }

    if (this.isDispatched) {
      const flap = Math.sin(time * 22.0) * 0.8;
      this.owlWingsL.rotation.z = flap;
      this.owlWingsR.rotation.z = -flap;
    }

    this.feathers.forEach((f, i) => {
      f.position.y -= delta * f.userData.speed;
      f.position.x += Math.sin(time * 1.5 + f.userData.swayOffset) * 0.006;
      f.rotation.y += delta * f.userData.rotSpeed;
      f.rotation.z = Math.sin(time * 2.0 + i) * 0.2;
      if (f.position.y < -1.8) f.position.y = 6.2;
    });
  }
}
