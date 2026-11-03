/** ============================================================
 *  nameReveal.js — "The Wand Writes" scene.
 *  Dark stone hall, candles, wand writes name in light, etc.
 *  ============================================================ */

import * as THREE from 'three';
import gsap from 'gsap';
import { PERSONAL, NAME_REVEAL } from '../content.js';
import {
  setScene, setCamera, addLoopCallback, removeLoopCallback,
  isMobile, prefersReducedMotion,
} from '../systems/renderer.js';
import {
  playSparkle, playChime, playFlash,
  startAmbientPad, startCandleAmbience,
  stopAmbientPad, stopCandleAmbience, isEnabled,
} from '../systems/audio.js';

/* ---------- Letter path data (simplified strokes for "Joel Biju") ---------- */
// Each letter: array of strokes, each stroke: array of {x, y} (0-1 normalised within letter bbox)
const LETTER_PATHS = {
  J: [[{x:.7,y:0},{x:.7,y:.75},{x:.55,y:.95},{x:.3,y:.95},{x:.15,y:.8}]],
  o: [[{x:.5,y:.3},{x:.8,y:.45},{x:.8,y:.7},{x:.5,y:.9},{x:.2,y:.7},{x:.2,y:.45},{x:.5,y:.3}]],
  e: [[{x:.8,y:.55},{x:.2,y:.55},{x:.2,y:.35},{x:.5,y:.25},{x:.8,y:.4},{x:.8,y:.6},{x:.5,y:.85},{x:.2,y:.75}]],
  l: [[{x:.4,y:0},{x:.4,y:.9}]],
  ' ': [],
  B: [[{x:.2,y:.95},{x:.2,y:0}],[{x:.2,y:0},{x:.6,y:0},{x:.75,y:.15},{x:.75,y:.3},{x:.6,y:.45},{x:.2,y:.45}],[{x:.2,y:.45},{x:.65,y:.45},{x:.8,y:.6},{x:.8,y:.78},{x:.65,y:.95},{x:.2,y:.95}]],
  i: [[{x:.5,y:.3},{x:.5,y:.9}],[{x:.5,y:.08},{x:.5,y:.15}]],
  j: [[{x:.55,y:.08},{x:.55,y:.15}],[{x:.55,y:.3},{x:.55,y:.85},{x:.4,y:1},{x:.25,y:.95}]],
  u: [[{x:.2,y:.3},{x:.2,y:.7},{x:.35,y:.9},{x:.55,y:.9},{x:.75,y:.7},{x:.75,y:.3}]],
};

/* Build full path for entire name */
function buildNamePath(name) {
  const letters = name.split('');
  const totalWidth = letters.length;
  const allPoints = [];
  const startX = -totalWidth * 0.28;

  letters.forEach((ch, idx) => {
    const paths = LETTER_PATHS[ch] || LETTER_PATHS[ch.toLowerCase()] || [];
    const offsetX = startX + idx * 0.56;
    paths.forEach(stroke => {
      stroke.forEach(pt => {
        allPoints.push(new THREE.Vector3(
          offsetX + pt.x * 0.48,
          2.2 - pt.y * 1.0,
          0
        ));
      });
      // Add a gap marker (NaN) between strokes
      allPoints.push(null);
    });
  });
  return allPoints.filter((_, i, arr) => !(arr[i] === null && (i === 0 || arr[i-1] === null)));
}

/* ---------- Scene ---------- */

let scene, camera, hallGroup;
let candles = [];
let dustParticles = null;
let wandTip = null;
let wandLight = null;
let trailParticles = [];
let nameGroup = null;
let updateFn = null;
let timeline = null;
let overlay = null;
let isActive = false;

export function createNameRevealScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x030510);
  scene.fog = new THREE.FogExp2(0x030510, 0.12);

  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 1.6, 6);

  hallGroup = new THREE.Group();
  scene.add(hallGroup);

  buildHall();
  buildCandles();
  buildDust();
  buildWand();
  buildTrailSystem();

  // Ambient light
  const ambient = new THREE.AmbientLight(0x1a1428, 0.3);
  scene.add(ambient);

  return { scene, camera };
}

/* ---------- Hall geometry ---------- */
function buildHall() {
  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a35,
    roughness: 0.92,
    metalness: 0.05,
    bumpScale: 0.02,
  });

  // Floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 20),
    new THREE.MeshStandardMaterial({ color: 0x1e1e28, roughness: 0.95, metalness: 0.02 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  hallGroup.add(floor);

  // Back wall
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), stoneMat);
  wall.position.set(0, 4, -5);
  wall.receiveShadow = true;
  hallGroup.add(wall);

  // Side walls
  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 8), stoneMat.clone());
  leftWall.position.set(-7, 4, 0);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.receiveShadow = true;
  hallGroup.add(leftWall);

  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 8), stoneMat.clone());
  rightWall.position.set(7, 4, 0);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.receiveShadow = true;
  hallGroup.add(rightWall);

  // Ceiling
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 20),
    new THREE.MeshStandardMaterial({ color: 0x141420, roughness: 0.98 })
  );
  ceiling.position.y = 8;
  ceiling.rotation.x = Math.PI / 2;
  hallGroup.add(ceiling);

  // Stone pillars
  const pillarGeo = new THREE.CylinderGeometry(0.25, 0.3, 8, 8);
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x333340, roughness: 0.85, metalness: 0.1 });
  const pillarPositions = [
    [-4, 4, -3], [4, 4, -3],
    [-4, 4, 1], [4, 4, 1],
    [-4, 4, 5], [4, 4, 5],
  ];
  pillarPositions.forEach(p => {
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.set(...p);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    hallGroup.add(pillar);
  });

  // Stone block details on walls
  const blockGeo = new THREE.BoxGeometry(0.8, 0.4, 0.08);
  for (let i = 0; i < 30; i++) {
    const block = new THREE.Mesh(blockGeo, stoneMat.clone());
    block.material.color.setHSL(0, 0, 0.12 + Math.random() * 0.06);
    const side = Math.random() > 0.5 ? 1 : -1;
    block.position.set(
      side * 6.94,
      0.2 + Math.random() * 6,
      -4 + Math.random() * 10
    );
    block.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
    hallGroup.add(block);
  }
}

/* ---------- Candles ---------- */
function buildCandles() {
  const candlePositions = [
    [-3, 2.5, -4], [3, 2.5, -4],
    [-5, 3.0, -1], [5, 3.0, -1],
    [-3, 2.8, 2], [3, 2.8, 2],
    [-1.5, 2.2, -4.5], [1.5, 2.2, -4.5],
  ];

  const candleBodyGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.3, 6);
  const candleBodyMat = new THREE.MeshStandardMaterial({ color: 0xd4c5a0, roughness: 0.7 });
  const flameGeo = new THREE.SphereGeometry(0.04, 6, 6);
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xffaa33 });

  candlePositions.forEach(pos => {
    const body = new THREE.Mesh(candleBodyGeo, candleBodyMat);
    body.position.set(pos[0], pos[1], pos[2]);
    hallGroup.add(body);

    const flame = new THREE.Mesh(flameGeo, flameMat.clone());
    flame.position.set(pos[0], pos[1] + 0.18, pos[2]);
    flame.scale.y = 1.5;
    hallGroup.add(flame);

    const light = new THREE.PointLight(0xffaa33, isMobile ? 0.6 : 1.2, 6, 2);
    light.position.set(pos[0], pos[1] + 0.25, pos[2]);
    if (!isMobile) {
      light.castShadow = true;
      light.shadow.mapSize.set(256, 256);
      light.shadow.bias = -0.002;
    }
    hallGroup.add(light);

    candles.push({ flame, light, baseIntensity: light.intensity, phase: Math.random() * Math.PI * 2 });
  });
}

/* ---------- Dust particles ---------- */
function buildDust() {
  const count = isMobile ? 80 : 250;
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 1] = Math.random() * 6;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    sizes[i] = Math.random() * 2 + 1;
  }

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.PointsMaterial({
    color: 0xf3e9d2,
    size: 0.03,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });

  dustParticles = new THREE.Points(geo, mat);
  scene.add(dustParticles);
}

/* ---------- Wand ---------- */
function buildWand() {
  // Wand body
  const wandGeo = new THREE.CylinderGeometry(0.012, 0.02, 0.5, 8);
  const wandMat = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.6, metalness: 0.1 });
  const wand = new THREE.Mesh(wandGeo, wandMat);
  wand.rotation.z = -Math.PI / 6;

  // Tip glow
  const tipGeo = new THREE.SphereGeometry(0.025, 8, 8);
  const tipMat = new THREE.MeshBasicMaterial({ color: 0xe8b04a, transparent: true, opacity: 0 });
  const tip = new THREE.Mesh(tipGeo, tipMat);
  tip.position.y = 0.26;

  wandLight = new THREE.PointLight(0xe8b04a, 0, 5, 2);
  wandLight.position.y = 0.26;

  const wandGroup = new THREE.Group();
  wandGroup.add(wand);
  wandGroup.add(tip);
  wandGroup.add(wandLight);
  wandGroup.visible = false;
  wandGroup.position.set(2, 1.0, 2);

  scene.add(wandGroup);
  wandTip = { group: wandGroup, tip, light: wandLight, wand };
}

/* ---------- Trail / spark particle system ---------- */
let trailGeo, trailMat, trailPoints;
const MAX_TRAIL = 800;
const trailPositions = new Float32Array(MAX_TRAIL * 3);
const trailAlphas = new Float32Array(MAX_TRAIL);
let trailCount = 0;

function buildTrailSystem() {
  trailGeo = new THREE.BufferGeometry();
  trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
  trailGeo.setAttribute('alpha', new THREE.BufferAttribute(trailAlphas, 1));

  trailMat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(0xe8b04a) },
    },
    vertexShader: `
      attribute float alpha;
      varying float vAlpha;
      void main() {
        vAlpha = alpha;
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = max(2.0, 6.0 * (1.0 / -mvPos.z));
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        if (d > 1.0) discard;
        float a = vAlpha * (1.0 - d * d);
        gl_FragColor = vec4(uColor * 1.5, a);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  trailPoints = new THREE.Points(trailGeo, trailMat);
  scene.add(trailPoints);
}

function addTrailPoint(x, y, z) {
  if (trailCount < MAX_TRAIL) {
    const i = trailCount;
    trailPositions[i * 3] = x;
    trailPositions[i * 3 + 1] = y;
    trailPositions[i * 3 + 2] = z;
    trailAlphas[i] = 1.0;
    trailCount++;
    trailGeo.attributes.position.needsUpdate = true;
    trailGeo.attributes.alpha.needsUpdate = true;
    trailGeo.setDrawRange(0, trailCount);
  }
}

/* ---------- 3D gold text (built from geometry) ---------- */
function create3DName(name) {
  nameGroup = new THREE.Group();
  nameGroup.visible = false;

  // We'll create solid gold 3D letters using ExtrudeGeometry from shapes
  const goldMat = new THREE.MeshPhysicalMaterial({
    color: 0xe8b04a,
    metalness: 0.85,
    roughness: 0.18,
    clearcoat: 0.3,
    clearcoatRoughness: 0.1,
    reflectivity: 0.9,
    emissive: 0xe8b04a,
    emissiveIntensity: 0.08,
  });

  // Create a canvas to measure and use text shape
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const fontSize = 120;
  ctx.font = `bold ${fontSize}px Cinzel, serif`;
  const textWidth = ctx.measureText(name).width;
  const scale = 4.0 / textWidth; // Fit name to ~4 units wide

  // Since we can't load fonts into Three.js without a font file, we create
  // 3D box letters as a stylish fallback
  const letters = name.split('');
  const totalWidthEstimate = letters.length * 0.52;
  const startX = -totalWidthEstimate / 2;

  letters.forEach((ch, i) => {
    if (ch === ' ') return;

    // Create a 3D letter block
    const w = 0.38;
    const h = 0.55;
    const d = 0.08;

    // Custom shape per letter using simple geometry compositions
    const letterGroup = new THREE.Group();

    // Main body - use a combination of boxes/cylinders for each letter
    const geo = createLetterGeometry(ch, w, h, d);
    geo.forEach(mesh => {
      mesh.material = goldMat.clone();
      mesh.castShadow = true;
      letterGroup.add(mesh);
    });

    letterGroup.position.x = startX + i * 0.52;
    letterGroup.position.y = 2.0;
    letterGroup.position.z = -0.5;
    letterGroup.scale.set(0, 0, 0);

    nameGroup.add(letterGroup);
  });

  scene.add(nameGroup);
  return nameGroup;
}

function createLetterGeometry(ch, w, h, d) {
  const meshes = [];
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xe8b04a,
    metalness: 0.85,
    roughness: 0.18,
    clearcoat: 0.3,
    clearcoatRoughness: 0.1,
  });

  const box = (sx, sy, sz, px, py, pz) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
    m.position.set(px, py, pz);
    return m;
  };
  const cyl = (r, len, px, py, pz, rotZ) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), mat);
    m.position.set(px, py, pz);
    if (rotZ) m.rotation.z = rotZ;
    return m;
  };

  const t = d; // thickness
  const hw = w / 2;
  const hh = h / 2;

  switch(ch.toUpperCase()) {
    case 'J':
      meshes.push(box(w * 0.8, t, d, 0, hh - t/2, 0));          // top bar
      meshes.push(box(t, h * 0.7, d, hw * 0.4, hh * 0.2, 0));   // vertical
      meshes.push(box(w * 0.4, t, d, 0, -hh + t/2, 0));         // bottom curve
      meshes.push(box(t, h * 0.2, d, -hw * 0.2, -hh * 0.6, 0)); // hook
      break;
    case 'O':
      meshes.push(box(w, t, d, 0, hh - t/2, 0));     // top
      meshes.push(box(w, t, d, 0, -hh + t/2, 0));    // bottom
      meshes.push(box(t, h, d, -hw + t/2, 0, 0));    // left
      meshes.push(box(t, h, d, hw - t/2, 0, 0));     // right
      break;
    case 'E':
      meshes.push(box(t, h, d, -hw + t/2, 0, 0));       // left vertical
      meshes.push(box(w * 0.8, t, d, -hw * 0.1, hh - t/2, 0));    // top
      meshes.push(box(w * 0.6, t, d, -hw * 0.2, 0, 0));           // middle
      meshes.push(box(w * 0.8, t, d, -hw * 0.1, -hh + t/2, 0));   // bottom
      break;
    case 'L':
      meshes.push(box(t, h, d, -hw + t/2, 0, 0));               // vertical
      meshes.push(box(w * 0.8, t, d, -hw * 0.1, -hh + t/2, 0)); // bottom
      break;
    case 'B':
      meshes.push(box(t, h, d, -hw + t/2, 0, 0));                    // left vertical
      meshes.push(box(w * 0.6, t, d, -hw * 0.1, hh - t/2, 0));       // top
      meshes.push(box(w * 0.5, t, d, -hw * 0.15, 0, 0));             // middle
      meshes.push(box(w * 0.6, t, d, -hw * 0.1, -hh + t/2, 0));      // bottom
      meshes.push(box(t, h * 0.45, d, hw * 0.35, hh * 0.48, 0));     // right-top
      meshes.push(box(t, h * 0.45, d, hw * 0.42, -hh * 0.48, 0));    // right-bottom
      break;
    case 'I':
      meshes.push(box(w * 0.6, t, d, 0, hh - t/2, 0));   // top
      meshes.push(box(t, h * 0.85, d, 0, -hh * 0.08, 0)); // vertical
      meshes.push(box(w * 0.6, t, d, 0, -hh + t/2, 0));  // bottom
      break;
    case 'U':
      meshes.push(box(t, h * 0.85, d, -hw + t/2, hh * 0.1, 0));   // left
      meshes.push(box(t, h * 0.85, d, hw - t/2, hh * 0.1, 0));    // right
      meshes.push(box(w, t, d, 0, -hh + t/2, 0));                  // bottom
      break;
    default:
      meshes.push(box(w * 0.6, h * 0.8, d, 0, 0, 0));
      break;
  }

  return meshes;
}

/* ---------- Timeline animation ---------- */
export function playNameReveal(uiContainer, onComplete) {
  isActive = true;
  setScene(scene);
  setCamera(camera);

  // Create UI overlay
  overlay = document.createElement('div');
  overlay.id = 'name-reveal-overlay';
  overlay.innerHTML = `
    <div class="reveal-controls">
      <button class="btn-magic" id="btn-skip-reveal">${NAME_REVEAL.skip}</button>
      <button class="btn-magic" id="btn-replay-reveal" style="display:none">${NAME_REVEAL.replay}</button>
    </div>
    <div class="role-text" id="role-text">${PERSONAL.role}</div>
    <div class="scroll-hint" id="scroll-hint">${NAME_REVEAL.scrollHint}</div>
  `;
  uiContainer.appendChild(overlay);
  overlay.classList.add('active');

  const btnSkip = overlay.querySelector('#btn-skip-reveal');
  const btnReplay = overlay.querySelector('#btn-replay-reveal');
  const roleText = overlay.querySelector('#role-text');
  const scrollHint = overlay.querySelector('#scroll-hint');

  // Create 3D name
  const name3D = create3DName(PERSONAL.name);

  // Build the path that the wand follows to write
  const namePoints = buildNamePath(PERSONAL.name);

  // Audio
  if (isEnabled()) {
    startAmbientPad();
    startCandleAmbience();
  }

  // GSAP master timeline
  timeline = gsap.timeline({
    onComplete: () => {
      btnReplay.style.display = '';
      if (onComplete) onComplete();
    }
  });

  // Camera state
  const camPos = { x: 0, y: 1.6, z: 6 };

  // 0-2s: Dark hall, candles, dust, slow camera push-in
  timeline.to(camPos, {
    z: 4.5,
    y: 1.8,
    duration: 2,
    ease: 'power1.inOut',
    onUpdate: () => {
      camera.position.set(camPos.x, camPos.y, camPos.z);
    }
  }, 0);

  // 2-3s: Wand appears and tip glows
  timeline.call(() => {
    wandTip.group.visible = true;
  }, [], 2);

  timeline.to(wandTip.group.position, {
    x: 0.5, y: 1.8, z: 1,
    duration: 0.8,
    ease: 'power2.out',
  }, 2);

  timeline.to(wandTip.tip.material, {
    opacity: 1,
    duration: 0.5,
    ease: 'power2.in',
    onStart: () => playSparkle(),
  }, 2.3);

  timeline.to(wandTip.light, {
    intensity: 2.0,
    duration: 0.5,
    ease: 'power2.in',
  }, 2.3);

  // 3-7s: Wand writes the name - move through path points
  const validPoints = namePoints.filter(p => p !== null);
  const writeDuration = 4;
  const wandWriteTarget = { x: 0, y: 2.2, z: 0.2 };

  if (validPoints.length > 0) {
    const pathProgress = { t: 0 };
    let lastPointIndex = -1;

    timeline.to(pathProgress, {
      t: 1,
      duration: writeDuration,
      ease: 'none',
      onUpdate: () => {
        const idx = Math.floor(pathProgress.t * (validPoints.length - 1));
        if (idx !== lastPointIndex && idx < validPoints.length) {
          lastPointIndex = idx;
          const pt = validPoints[idx];

          // Move wand tip
          wandTip.group.position.x = pt.x;
          wandTip.group.position.y = pt.y + 0.3;
          wandTip.group.position.z = pt.z + 0.3;

          // Add trail sparkle
          addTrailPoint(pt.x, pt.y, pt.z);

          // Spawn extra sparks around the point
          for (let s = 0; s < 2; s++) {
            addTrailPoint(
              pt.x + (Math.random() - 0.5) * 0.08,
              pt.y + (Math.random() - 0.5) * 0.08,
              pt.z + (Math.random() - 0.5) * 0.04
            );
          }
        }
      },
      onStart: () => {
        if (isEnabled()) playSparkle();
      }
    }, 3);

    // Intermittent sparkle sounds during writing
    for (let t = 3.5; t < 7; t += 0.8) {
      timeline.call(() => { if (isEnabled()) playSparkle(); }, [], t);
    }
  }

  // 7-8s: Flash effect — trail turns into solid 3D letters
  timeline.call(() => {
    if (isEnabled()) playFlash();
    if (isEnabled()) playChime();

    // Flash the trail bright
    gsap.to(trailMat.uniforms.uColor.value, {
      r: 2, g: 1.8, b: 1.2,
      duration: 0.3,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        trailMat.uniforms.uColor.value.set(0xe8b04a);
      }
    });

    // Fade out trail
    gsap.to({}, {
      duration: 0.8,
      onUpdate: function() {
        const progress = this.progress();
        for (let i = 0; i < trailCount; i++) {
          trailAlphas[i] = Math.max(0, 1 - progress);
        }
        trailGeo.attributes.alpha.needsUpdate = true;
      }
    });

    // Show 3D name
    name3D.visible = true;
    name3D.children.forEach((letterGroup, i) => {
      gsap.to(letterGroup.scale, {
        x: 1, y: 1, z: 1,
        duration: 0.5,
        delay: i * 0.06,
        ease: 'back.out(1.7)',
      });
    });
  }, [], 7);

  // Camera settle
  timeline.to(camPos, {
    x: 0, y: 1.9, z: 4.0,
    duration: 1.5,
    ease: 'power2.inOut',
    onUpdate: () => camera.position.set(camPos.x, camPos.y, camPos.z),
  }, 7);

  // 8-9s: Role text fades in with shimmer
  timeline.call(() => {
    // Animate role text characters
    const text = PERSONAL.role;
    roleText.textContent = '';
    roleText.style.opacity = '1';

    const chars = text.split('');
    chars.forEach((ch, i) => {
      const span = document.createElement('span');
      span.textContent = ch;
      span.style.opacity = '0';
      span.style.display = 'inline-block';
      span.style.filter = 'blur(4px)';
      span.style.transition = 'opacity 0.3s ease, filter 0.3s ease';
      roleText.appendChild(span);

      setTimeout(() => {
        span.style.opacity = '1';
        span.style.filter = 'blur(0px)';
      }, i * 50);
    });
  }, [], 8);

  // 9-10s: Scroll hint
  timeline.to(scrollHint, {
    opacity: 0.8,
    duration: 0.8,
    ease: 'power2.inOut',
  }, 9);

  // Skip
  btnSkip.addEventListener('click', () => {
    skipToEnd(name3D, roleText, scrollHint, btnReplay, onComplete);
  });

  // Replay
  btnReplay.addEventListener('click', () => {
    btnReplay.style.display = 'none';
    resetAndReplay(name3D, roleText, scrollHint, uiContainer, onComplete);
  });

  // Update function
  updateFn = (dt, elapsed) => {
    if (!isActive) return;
    // Candle flicker
    candles.forEach(c => {
      c.phase += dt * (3 + Math.random() * 2);
      const flicker = 0.7 + Math.sin(c.phase) * 0.2 + Math.random() * 0.1;
      c.light.intensity = c.baseIntensity * flicker;
      c.flame.scale.y = 1.3 + Math.sin(c.phase * 1.3) * 0.3;
    });

    // Dust drift
    if (dustParticles) {
      const pos = dustParticles.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        pos.array[i * 3 + 1] += Math.sin(elapsed + i) * 0.0008;
        pos.array[i * 3] += Math.cos(elapsed * 0.5 + i * 0.3) * 0.0003;
      }
      pos.needsUpdate = true;
    }

    // Fade trail alpha naturally
    for (let i = 0; i < trailCount; i++) {
      trailAlphas[i] *= 0.998;
    }
    if (trailCount > 0) trailGeo.attributes.alpha.needsUpdate = true;

    // Gentle name float
    if (nameGroup && nameGroup.visible) {
      nameGroup.position.y = Math.sin(elapsed * 0.5) * 0.03;
      nameGroup.rotation.y = Math.sin(elapsed * 0.3) * 0.02;
    }
  };
  addLoopCallback(updateFn);
}

function skipToEnd(name3D, roleText, scrollHint, btnReplay, onComplete) {
  if (timeline) {
    timeline.kill();
    timeline = null;
  }

  // Immediately show final state
  wandTip.group.visible = false;
  name3D.visible = true;
  name3D.children.forEach(g => g.scale.set(1, 1, 1));

  camera.position.set(0, 1.9, 4.0);

  roleText.textContent = PERSONAL.role;
  roleText.style.opacity = '1';

  gsap.to(scrollHint, { opacity: 0.8, duration: 0.3 });
  btnReplay.style.display = '';

  // Clear trail
  for (let i = 0; i < trailCount; i++) trailAlphas[i] = 0;
  if (trailCount > 0) trailGeo.attributes.alpha.needsUpdate = true;

  if (onComplete) onComplete();
}

function resetAndReplay(name3D, roleText, scrollHint, uiContainer, onComplete) {
  // Kill existing timeline
  if (timeline) { timeline.kill(); timeline = null; }

  // Reset all state
  wandTip.group.visible = false;
  wandTip.group.position.set(2, 1.0, 2);
  wandTip.tip.material.opacity = 0;
  wandTip.light.intensity = 0;

  name3D.visible = false;
  name3D.children.forEach(g => g.scale.set(0, 0, 0));

  camera.position.set(0, 1.6, 6);

  roleText.textContent = PERSONAL.role;
  roleText.style.opacity = '0';
  scrollHint.style.opacity = '0';

  // Reset trail
  trailCount = 0;
  trailGeo.setDrawRange(0, 0);

  // Remove old overlay
  if (overlay) { overlay.remove(); overlay = null; }
  if (updateFn) removeLoopCallback(updateFn);

  // Re-play
  playNameReveal(uiContainer, onComplete);
}

export function disposeNameReveal() {
  isActive = false;
  if (timeline) { timeline.kill(); timeline = null; }
  if (updateFn) { removeLoopCallback(updateFn); updateFn = null; }
  if (overlay) { overlay.remove(); overlay = null; }
  stopAmbientPad();
  stopCandleAmbience();
}
