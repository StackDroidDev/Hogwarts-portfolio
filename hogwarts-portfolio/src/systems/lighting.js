import * as THREE from 'three';

export class HallLighting {
  constructor(scene) {
    this.scene = scene;
    this.flickerLights = [];
    this.init();
  }

  init() {
    // Ambient moon / night fill
    const ambient = new THREE.AmbientLight(0x0a1024, 0.4);
    this.scene.add(ambient);

    // Moonlight shaft through high arched windows
    const moonDir = new THREE.DirectionalLight(0x5a7ca6, 1.2);
    moonDir.position.set(12, 18, -10);
    moonDir.castShadow = true;
    moonDir.shadow.mapSize.width = 1024;
    moonDir.shadow.mapSize.height = 1024;
    moonDir.shadow.bias = -0.0005;
    this.scene.add(moonDir);

    // Warm hall central presence
    const warmCenter = new THREE.PointLight(0xe8b04a, 1.8, 22, 1.5);
    warmCenter.position.set(0, 1.5, 0);
    this.scene.add(warmCenter);
    this.flickerLights.push({ light: warmCenter, baseIntensity: 1.8 });
  }

  registerCandleLight(light, baseIntensity = 1.0) {
    this.flickerLights.push({ light, baseIntensity });
  }

  update(time) {
    // Realistic multi-frequency organic candle flicker
    for (let i = 0; i < this.flickerLights.length; i++) {
      const item = this.flickerLights[i];
      const noise =
        Math.sin(time * 8.0 + i * 1.7) * 0.12 +
        Math.sin(time * 19.3 + i * 2.3) * 0.08 +
        (Math.random() - 0.5) * 0.06;
      item.light.intensity = Math.max(0.1, item.baseIntensity + noise);
    }
  }
}