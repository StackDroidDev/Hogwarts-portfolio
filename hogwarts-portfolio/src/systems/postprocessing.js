import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export function createPostProcessing(renderer, scene, camera) {
  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // Balanced Bloom (keeps the glow without edge artifacts)
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.65, // strength
    0.4,  // radius
    0.85  // threshold
  );
  composer.addPass(bloomPass);

  // Clean edge pass - REMOVES horizontal/corner blur cutouts
  const cleanEdgeShader = {
    uniforms: {
      tDiffuse: { value: null },
      uVignetteDarkness: { value: 0.45 },
      uVignetteOffset: { value: 1.2 } // High offset eliminates blur clipping at corners
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float uVignetteDarkness;
      uniform float uVignetteOffset;
      varying vec2 vUv;

      void main() {
        vec4 color = texture2D(tDiffuse, vUv);
        // Soft cinematic vignette with NO edge blur or hard clipping
        vec2 uv = (vUv - 0.5) * 1.0;
        float dist = length(uv);
        float vig = smoothstep(uVignetteOffset, uVignetteOffset * 0.4, dist * (uVignetteDarkness + 0.3));
        color.rgb = mix(color.rgb * 0.75, color.rgb, vig);
        gl_FragColor = color;
      }
    `
  };

  const edgePass = new ShaderPass(cleanEdgeShader);
  composer.addPass(edgePass);

  return {
    composer,
    resize(width, height) {
      composer.setSize(width, height);
      bloomPass.setSize(width, height);
    }
  };
}
