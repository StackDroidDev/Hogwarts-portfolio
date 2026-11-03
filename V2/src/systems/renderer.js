/** ============================================================
 *  renderer.js — Three.js renderer, camera, post-processing.
 *  Shared by all scenes.
 *  ============================================================ */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

/* ---------- Vignette + Film grain shader ---------- */
const VignetteGrainShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uVignetteStrength: { value: 0.45 },
    uGrainStrength: { value: 0.06 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uVignetteStrength;
    uniform float uGrainStrength;
    varying vec2 vUv;

    float rand(vec2 co) {
      return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      // Vignette
      float dist = distance(vUv, vec2(0.5));
      color.rgb *= 1.0 - uVignetteStrength * dist * dist * 2.8;
      // Film grain
      float grain = rand(vUv * uTime) * uGrainStrength;
      color.rgb += grain - uGrainStrength * 0.5;
      gl_FragColor = color;
    }
  `,
};

/* ---------- State ---------- */
let renderer, camera, composer, scene;
let bloomPass, vignettePass;
let width, height;
const clock = new THREE.Clock();

/* ---------- Mobile detection ---------- */
const isMobile = /Mobi|Android/i.test(navigator.userAgent)
  || window.matchMedia('(pointer: coarse)').matches;

const prefersReducedMotion =
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export { isMobile, prefersReducedMotion };

/* ---------- Init ---------- */
export function initRenderer(container) {
  width = container.clientWidth;
  height = container.clientHeight;

  // Renderer
  renderer = new THREE.WebGLRenderer({
    antialias: !isMobile,
    powerPreference: 'high-performance',
    alpha: false,
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.shadowMap.enabled = !isMobile;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  // Camera
  camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
  camera.position.set(0, 1.6, 6);

  // Scene (placeholder, set per-room)
  scene = new THREE.Scene();

  // Post-processing
  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  bloomPass = new UnrealBloomPass(
    new THREE.Vector2(width, height),
    isMobile ? 0.6 : 1.0,
    0.4,
    0.85
  );
  composer.addPass(bloomPass);

  vignettePass = new ShaderPass(VignetteGrainShader);
  composer.addPass(vignettePass);

  // Resize
  window.addEventListener('resize', onResize);

  return { renderer, camera, composer, scene };
}

function onResize() {
  const container = renderer.domElement.parentElement;
  if (!container) return;
  width = container.clientWidth;
  height = container.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  composer.setSize(width, height);
}

/* ---------- Accessors ---------- */
export function getRenderer() { return renderer; }
export function getCamera() { return camera; }
export function getComposer() { return composer; }
export function getScene() { return scene; }
export function getClock() { return clock; }

export function setScene(s) {
  scene = s;
  composer.passes[0].scene = s;
}

export function setCamera(c) {
  camera = c;
  composer.passes[0].camera = c;
}

/* ---------- Render loop ---------- */
let loopCallbacks = [];
let loopRunning = false;
let loopRAF = null;

export function addLoopCallback(fn) {
  loopCallbacks.push(fn);
}

export function removeLoopCallback(fn) {
  loopCallbacks = loopCallbacks.filter(f => f !== fn);
}

export function startLoop() {
  if (loopRunning) return;
  loopRunning = true;
  tick();
}

export function stopLoop() {
  loopRunning = false;
  if (loopRAF) cancelAnimationFrame(loopRAF);
}

function tick() {
  if (!loopRunning) return;
  loopRAF = requestAnimationFrame(tick);
  const dt = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  if (vignettePass) {
    vignettePass.uniforms.uTime.value = elapsed;
  }

  for (const cb of loopCallbacks) cb(dt, elapsed);

  composer.render();
}

export function renderOnce() {
  composer.render();
}
