import * as THREE from 'three';

export class SkillBase {
  constructor(scene, camera, houseThemeManager, data) {
    this.scene = scene;
    this.camera = camera;
    this.houseTheme = houseThemeManager;
    this.data = data;
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.isEntered = false;
  }

  init() {}
  enter() {
    this.isEntered = true;
    this.group.visible = true;
  }
  update(time, delta, mouse) {}
  exit() {
    this.isEntered = false;
    this.group.visible = false;
  }
  dispose() {
    this.group.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    });
    this.scene.remove(this.group);
  }
}