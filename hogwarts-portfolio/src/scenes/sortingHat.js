import * as THREE from 'three';
import gsap from 'gsap';
import { content } from '../content.js';

export class SortingHatScene {
  constructor(scene, houseThemeManager, scrollManager) {
    this.scene = scene;
    this.houseTheme = houseThemeManager;
    this.scrollManager = scrollManager;

    this.group = new THREE.Group();
    // Positioned at Waypoint 1 (Z = -32.0)
    this.group.position.set(0, 0, -32.0);
    this.scene.add(this.group);

    // 3D Objects
    this.hatMesh = null;
    this.hatGroup = null;
    this.mouthCrease = null;
    this.keyLight = null;
    this.rimLight = null;
    this.hatSpotlight = null;
    this.shockwaveMesh = null;
    this.vortexParticles = null;

    // State
    this.ceremonyDone = false;
    this.currentQuestionIdx = 0;
    this.scores = { gryffindor: 0, slytherin: 0, ravenclaw: 0, hufflepuff: 0 };
    this.mouthTimeline = null;

    this.init();
    this.buildVortexTransition();
    this.initUI();
  }

  init() {
    this.buildStool();
    this.buildRealisticHat();
    this.buildRoomLighting();
    this.buildShockwave();
  }

  buildStool() {
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x5a341e,
      roughness: 0.55,
      metalness: 0.15,
      emissive: 0x1d1007,
      emissiveIntensity: 0.25
    });

    const seat = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.16, 24), woodMat);
    seat.position.y = -0.55;
    seat.receiveShadow = true;
    seat.castShadow = true;
    this.group.add(seat);

    // 4 Splayed Legs with bronze ferrules
    const legGeo = new THREE.CylinderGeometry(0.065, 0.085, 1.8, 12);
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2 + Math.PI / 4;
      const leg = new THREE.Mesh(legGeo, woodMat);
      leg.position.set(Math.cos(angle) * 0.7, -1.45, Math.sin(angle) * 0.7);
      leg.rotation.z = Math.sin(angle) * 0.16;
      leg.rotation.x = Math.cos(angle) * 0.16;
      this.group.add(leg);
    }

    // Soft warm golden ground disc beneath the stool
    const discMat = new THREE.MeshBasicMaterial({
      color: 0xe8b04a,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending
    });
    const groundGlow = new THREE.Mesh(new THREE.CircleGeometry(1.8, 24), discMat);
    groundGlow.rotation.x = -Math.PI / 2;
    groundGlow.position.y = -2.35;
    this.group.add(groundGlow);
  }

  buildRealisticHat() {
    this.hatGroup = new THREE.Group();
    this.hatGroup.position.set(0, -0.45, 0);

    // Rich antique brown leather with warm emissive tone so it never renders pitch black
    const leatherMat = new THREE.MeshStandardMaterial({
      color: 0x82522e,
      roughness: 0.52,
      metalness: 0.22,
      emissive: 0x331b0b,
      emissiveIntensity: 0.38
    });

    // 1. Hat Brim (curved organic folds)
    const brimGeo = new THREE.TorusGeometry(1.25, 0.32, 18, 36);
    const pos = brimGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      pos.setY(i, y + Math.sin(x * 3.2) * 0.11 + Math.cos(z * 2.8) * 0.09);
    }
    brimGeo.computeVertexNormals();

    const brim = new THREE.Mesh(brimGeo, leatherMat);
    brim.rotation.x = Math.PI / 2;
    brim.scale.set(1.15, 1.05, 0.4);
    this.hatGroup.add(brim);

    // 2. Main Hat Body (wrinkles, character folds and slouch)
    const coneGeo = new THREE.ConeGeometry(0.95, 2.25, 32, 28);
    const cPos = coneGeo.attributes.position;
    for (let i = 0; i < cPos.count; i++) {
      const y = cPos.getY(i);
      const x = cPos.getX(i);
      const z = cPos.getZ(i);

      if (y > -0.2) {
        cPos.setZ(i, z - Math.pow(y + 0.9, 1.7) * 0.24);
        cPos.setX(i, x + Math.pow(y + 0.9, 1.5) * 0.14);
      }
      cPos.setX(i, cPos.getX(i) + Math.sin(y * 8.0) * 0.06);
    }
    coneGeo.computeVertexNormals();

    this.hatMesh = new THREE.Mesh(coneGeo, leatherMat);
    this.hatMesh.position.y = 1.05;
    this.hatGroup.add(this.hatMesh);

    // 3. Eyebrow Crease Fold
    const browGeo = new THREE.TorusGeometry(0.46, 0.07, 10, 20, Math.PI);
    const brow = new THREE.Mesh(browGeo, leatherMat);
    brow.position.set(0, 0.9, 0.56);
    brow.rotation.x = -0.35;
    this.hatGroup.add(brow);

    // 4. Expressive Speaking Mouth Crease
    const mouthGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.62, 12);
    const mouthMat = new THREE.MeshStandardMaterial({
      color: 0x221208,
      roughness: 0.85,
      emissive: 0x140a04,
      emissiveIntensity: 0.3
    });
    this.mouthCrease = new THREE.Mesh(mouthGeo, mouthMat);
    this.mouthCrease.rotation.z = Math.PI / 2;
    this.mouthCrease.position.set(0, 0.54, 0.68);
    this.hatGroup.add(this.mouthCrease);

    // 5. Patches on the hat
    const patchGeo = new THREE.PlaneGeometry(0.28, 0.28);
    const patchMat = new THREE.MeshStandardMaterial({
      color: 0x5a361c,
      roughness: 0.75,
      emissive: 0x241206,
      emissiveIntensity: 0.25
    });
    const patch = new THREE.Mesh(patchGeo, patchMat);
    patch.position.set(-0.38, 1.2, 0.46);
    patch.rotation.y = -0.4;
    this.hatGroup.add(patch);

    this.group.add(this.hatGroup);
  }

    buildRoomLighting() {
    // 1. Broad Ambient Chamber Light
    const chamberAmb = new THREE.AmbientLight(0xfce8c3, 1.8);
    this.group.add(chamberAmb);

    // 2. High-Angle Warm Overhead Spotlight
    this.hatSpotlight = new THREE.SpotLight(0xfffaea, 8.5, 32, 0.85, 0.4, 1.0);
    this.hatSpotlight.position.set(0, 7.5, 4.0);
    if (this.hatMesh) {
      this.hatSpotlight.target = this.hatMesh;
    }
    this.group.add(this.hatSpotlight);

    // 3. Front Face Fill Light (ensures folds, mouth, and eyes are bright and distinct)
    this.keyLight = new THREE.PointLight(0xffe6b0, 5.5, 20, 1.0);
    this.keyLight.position.set(0, 2.8, 3.8);
    this.group.add(this.keyLight);

    // 4. Golden Silhouette Rim Light
    this.rimLight = new THREE.PointLight(0xf3b23c, 4.8, 16, 1.1);
    this.rimLight.position.set(0, 2.8, -2.5);
    this.group.add(this.rimLight);

    // 5. Ground Plinth Light
    const plinthGlow = new THREE.PointLight(0xffbe58, 3.0, 10, 1.2);
    plinthGlow.position.set(0, 0.2, 1.5);
    this.group.add(plinthGlow);
  }


  buildVortexTransition() {
    // Circular anti-aliased glowing mote texture (eliminates blocky square pixels)
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 64;
    pCanvas.height = 64;
    const pCtx = pCanvas.getContext('2d');

    const grad = pCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 235, 175, 1.0)');
    grad.addColorStop(0.3, 'rgba(232, 176, 74, 0.65)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    pCtx.fillStyle = grad;
    pCtx.beginPath();
    pCtx.arc(32, 32, 32, 0, Math.PI * 2);
    pCtx.fill();

    const pTex = new THREE.CanvasTexture(pCanvas);

    // Swirling stardust motes around the Sorting Hat chamber
    const count = 220;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const angle = i * 0.28;
      const radius = 1.6 + Math.random() * 2.8;
      const z = (Math.random() - 0.5) * 8.0;

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = 0.2 + (Math.random() - 0.5) * 3.5;
      positions[i * 3 + 2] = z;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      map: pTex,
      color: 0xffd580,
      size: 0.16,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.vortexParticles = new THREE.Points(geo, mat);
    this.group.add(this.vortexParticles);
  }

  buildShockwave() {
    const geo = new THREE.RingGeometry(0.2, 0.5, 32);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffe89e,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    this.shockwaveMesh = new THREE.Mesh(geo, mat);
    this.shockwaveMesh.position.set(0, 0.5, 0.8);
    this.group.add(this.shockwaveMesh);
  }

  initUI() {
    let el = document.getElementById('sorting-hat-ui');
    if (!el) {
      el = document.createElement('div');
      el.id = 'sorting-hat-ui';
      document.body.appendChild(el);
    }

    el.className = 'sorting-ui-container hidden';
    el.innerHTML = `
      <div id="hat-speech-bubble" class="hat-speech-bubble">
        <p id="hat-typed-text" class="speech-text"></p>
      </div>

      <div id="sorting-start-actions" class="sorting-actions-row">
        <button id="btn-hat-decide" class="hogwarts-btn primary">${content.sortingHat.btnDecide}</button>
        <button id="btn-hat-choose" class="hogwarts-btn">${content.sortingHat.btnChoose}</button>
      </div>

      <div id="sorting-quiz-card" class="sorting-quiz-card hidden">
        <div id="quiz-question" class="quiz-question"></div>
        <div id="quiz-options" class="quiz-options"></div>
      </div>

      <div id="sorting-crests-grid" class="crests-grid hidden">
        ${content.sortingHat.crests.map(c => `
          <div class="crest-card" data-house="${c.id}" style="--crest-accent: ${c.accent}">
            <div class="crest-symbol">${c.symbol}</div>
            <h3 class="crest-name">${c.name}</h3>
            <p class="crest-sub">${c.subtitle}</p>
          </div>
        `).join('')}
      </div>

      <div id="sorting-result-banner" class="sorting-result-banner hidden">
        <div class="result-badge">Sorted Into</div>
        <h1 id="result-house-title" class="result-house-title">Gryffindor</h1>
        <button id="btn-continue-hall" class="hogwarts-btn primary">Proceed to Great Hall</button>
      </div>

      <div class="sorting-footer-actions">
        <button id="btn-skip-sorting" class="skip-link">${content.sortingHat.btnSkip}</button>
      </div>

      <div id="change-house-widget" class="change-house-widget hidden">
        <span id="current-house-tag" class="house-tag"></span>
        <button id="btn-change-house" class="ghost-btn">${content.sortingHat.btnChangeHouse}</button>
      </div>
    `;

    this.bindUIEvents();
  }

  bindUIEvents() {
    document.getElementById('btn-hat-decide')?.addEventListener('click', () => this.startQuiz());
    document.getElementById('btn-hat-choose')?.addEventListener('click', () => this.showCrests());
    document.getElementById('btn-skip-sorting')?.addEventListener('click', () => this.pickRandomHouse());
    document.getElementById('btn-change-house')?.addEventListener('click', () => this.reopenCeremony());
    document.getElementById('btn-continue-hall')?.addEventListener('click', () => this.scrollManager.scrollToRoom(2));

    document.querySelectorAll('.crest-card').forEach(card => {
      card.addEventListener('click', () => {
        const house = card.getAttribute('data-house');
        this.concludeSorting(house);
      });
    });
  }

  onEnterRoom() {
    const ui = document.getElementById('sorting-hat-ui');
    if (ui) ui.classList.remove('hidden');

    const p1Role = document.getElementById('role-subtitle');
    const p1Hint = document.getElementById('scroll-hint');
    if (p1Role) p1Role.style.display = 'none';
    if (p1Hint) p1Hint.style.display = 'none';

    const saved = this.houseTheme.loadSavedHouse();
    if (saved && !this.ceremonyDone) {
      this.showReturningVisitorState(saved);
    } else if (!this.ceremonyDone) {
      this.wakeUpHat();
    }
  }

  wakeUpHat() {
    document.getElementById('sorting-quiz-card')?.classList.add('hidden');
    document.getElementById('sorting-crests-grid')?.classList.add('hidden');
    document.getElementById('sorting-result-banner')?.classList.add('hidden');
    document.getElementById('change-house-widget')?.classList.add('hidden');
    document.getElementById('sorting-start-actions')?.classList.remove('hidden');

    const bubble = document.getElementById('hat-speech-bubble');
    if (bubble) bubble.classList.remove('hidden');

    this.animateMouth(3.0);
    this.typeSpeech(content.sortingHat.initialSpeech);
  }

  showReturningVisitorState(houseId) {
    document.getElementById('sorting-quiz-card')?.classList.add('hidden');
    document.getElementById('sorting-crests-grid')?.classList.add('hidden');
    document.getElementById('sorting-result-banner')?.classList.add('hidden');

    document.getElementById('sorting-start-actions')?.classList.remove('hidden');

    const widget = document.getElementById('change-house-widget');
    const tag = document.getElementById('current-house-tag');
    if (widget) widget.classList.remove('hidden');
    if (tag) tag.textContent = `House: ${houseId.toUpperCase()}`;

    const bubble = document.getElementById('hat-speech-bubble');
    if (bubble) bubble.classList.remove('hidden');

    this.typeSpeech(content.sortingHat.subsequentSpeech);
    this.animateMouth(2.0);
  }

  reopenCeremony() {
    try {
      localStorage.removeItem('hogwarts_portfolio_house');
    } catch {}
    this.ceremonyDone = false;
    this.scores = { gryffindor: 0, slytherin: 0, ravenclaw: 0, hufflepuff: 0 };
    this.currentQuestionIdx = 0;
    this.wakeUpHat();
  }

  startQuiz() {
    document.getElementById('hat-speech-bubble')?.classList.add('hidden');
    document.getElementById('sorting-start-actions')?.classList.add('hidden');
    document.getElementById('sorting-crests-grid')?.classList.add('hidden');
    document.getElementById('sorting-result-banner')?.classList.add('hidden');

    const quizCard = document.getElementById('sorting-quiz-card');
    quizCard?.classList.remove('hidden');

    this.currentQuestionIdx = 0;
    this.renderQuestion();
  }

  renderQuestion() {
    const qData = content.sortingHat.quiz[this.currentQuestionIdx];
    const qText = document.getElementById('quiz-question');
    const optsContainer = document.getElementById('quiz-options');

    if (!qData || !qText || !optsContainer) return;

    qText.textContent = `Question ${this.currentQuestionIdx + 1} of 3: ${qData.question}`;
    optsContainer.innerHTML = '';

    qData.options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.className = 'hogwarts-btn quiz-opt-btn';
      btn.textContent = opt.text;
      btn.addEventListener('click', () => {
        Object.entries(opt.houses).forEach(([house, pts]) => {
          this.scores[house] = (this.scores[house] || 0) + pts;
        });

        this.currentQuestionIdx++;
        if (this.currentQuestionIdx < content.sortingHat.quiz.length) {
          this.renderQuestion();
        } else {
          this.resolveQuizResults();
        }
      });
      optsContainer.appendChild(btn);
    });
  }

  resolveQuizResults() {
    let max = -1;
    let winners = [];
    Object.entries(this.scores).forEach(([house, val]) => {
      if (val > max) {
        max = val;
        winners = [house];
      } else if (val === max) {
        winners.push(house);
      }
    });

    const finalHouse = winners[Math.floor(Math.random() * winners.length)];
    this.concludeSorting(finalHouse);
  }

  showCrests() {
    document.getElementById('hat-speech-bubble')?.classList.add('hidden');
    document.getElementById('sorting-start-actions')?.classList.add('hidden');
    document.getElementById('sorting-quiz-card')?.classList.add('hidden');
    document.getElementById('sorting-result-banner')?.classList.add('hidden');

    document.getElementById('sorting-crests-grid')?.classList.remove('hidden');
  }

  pickRandomHouse() {
    const list = ['gryffindor', 'slytherin', 'ravenclaw', 'hufflepuff'];
    this.concludeSorting(list[Math.floor(Math.random() * list.length)]);
  }

  concludeSorting(houseId) {
    this.ceremonyDone = true;
    this.houseTheme.saveHouse(houseId);

    document.getElementById('sorting-start-actions')?.classList.add('hidden');
    document.getElementById('sorting-quiz-card')?.classList.add('hidden');
    document.getElementById('sorting-crests-grid')?.classList.add('hidden');

    const bubble = document.getElementById('hat-speech-bubble');
    if (bubble) bubble.classList.remove('hidden');

    this.animateMouth(2.5);
    this.typeSpeech(`"${houseId.toUpperCase()}!"`);
    this.triggerCelebrationEffect(houseId);

    setTimeout(() => {
      if (bubble) bubble.classList.add('hidden');
      const banner = document.getElementById('sorting-result-banner');
      const title = document.getElementById('result-house-title');
      const data = this.houseTheme.getThemeData(houseId);

      if (banner && title && data) {
        title.textContent = data.name.toUpperCase();
        title.style.color = data.glow;
        banner.classList.remove('hidden');
      }
    }, 1400);
  }

  triggerCelebrationEffect(houseId) {
    const data = this.houseTheme.getThemeData(houseId);
    const color = data ? new THREE.Color(data.particleColor) : new THREE.Color(0xffe89e);

    gsap.timeline()
      .to(this.hatMesh.position, { y: 1.35, duration: 0.25, ease: 'power2.out' })
      .to(this.hatMesh.rotation, { z: 0.2, duration: 0.12, yoyo: true, repeat: 3 })
      .to(this.hatMesh.position, { y: 1.05, duration: 0.4, ease: 'bounce.out' });

    if (this.keyLight) {
      gsap.timeline()
        .to(this.keyLight, { intensity: 12.0, duration: 0.15 })
        .to(this.keyLight, { intensity: 4.8, duration: 0.8, ease: 'power1.out' });
    }

    if (this.shockwaveMesh) {
      this.shockwaveMesh.material.color.copy(color);
      this.shockwaveMesh.scale.set(1, 1, 1);
      this.shockwaveMesh.material.opacity = 0.95;

      gsap.to(this.shockwaveMesh.scale, { x: 16, y: 16, duration: 1.2, ease: 'power2.out' });
      gsap.to(this.shockwaveMesh.material, { opacity: 0, duration: 1.2, ease: 'power2.out' });
    }

    const flashEl = document.createElement('div');
    flashEl.className = 'sorting-screen-flash';
    flashEl.style.backgroundColor = data ? data.glow : '#ffffff';
    document.body.appendChild(flashEl);
    setTimeout(() => flashEl.remove(), 600);
  }

  animateMouth(duration = 2.0) {
    if (this.mouthTimeline) this.mouthTimeline.kill();
    this.mouthTimeline = gsap.timeline({ repeat: Math.floor(duration * 3), yoyo: true });
    this.mouthTimeline
      .to(this.mouthCrease.scale, { y: 2.6, z: 1.4, duration: 0.14 })
      .to(this.mouthCrease.rotation, { x: 0.22, duration: 0.14 });

    setTimeout(() => {
      if (this.mouthTimeline) this.mouthTimeline.kill();
      gsap.to(this.mouthCrease.scale, { y: 1, z: 1, duration: 0.2 });
      gsap.to(this.mouthCrease.rotation, { x: 0, duration: 0.2 });
    }, duration * 1000);
  }

  typeSpeech(text, onComplete) {
    const el = document.getElementById('hat-typed-text');
    if (!el) return;
    el.textContent = '';
    let idx = 0;
    const timer = setInterval(() => {
      el.textContent += text[idx];
      idx++;
      if (idx >= text.length) {
        clearInterval(timer);
        if (onComplete) onComplete();
      }
    }, 28);
  }

  update(time) {
    if (this.hatMesh) {
      this.hatMesh.rotation.y = Math.sin(time * 0.9) * 0.06;
    }
    if (this.vortexParticles) {
      this.vortexParticles.rotation.y = time * 0.08;
    }
  }
}
