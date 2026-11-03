import * as THREE from 'three';
import gsap from 'gsap';

export class ScrollManager {
  constructor(camera, scene) {
    this.camera = camera;
    this.scene = scene;
    this.scrollProgress = 0;
    this.targetScroll = 0;
    // 0: Name, 1: Hat, 2: Great Hall, 3: Divination, 4-8: Grand Staircase, 9-13: Skills Corridor
    // 14-17: Portrait Gallery, 18-20: Triwizard Arena
    // 21: Resume Scroll
    // 22: Owlery Tower (Contact)
    // 23: Footer ("Mischief Managed")
    this.maxScroll = 23.0;

    this.isLocked = false;
    this.touchStartY = 0;

    this.waypoints = [
      // 0: Part 1 Name Hall
      { cam: new THREE.Vector3(0, 0, 7.5), look: new THREE.Vector3(0, 0, 0) },
      // 1: Part 2 Sorting Hat Room
      { cam: new THREE.Vector3(0, 0.35, -28.0), look: new THREE.Vector3(0, 0.45, -32.0) },
      // 2: Part 2 The Great Hall (center aisle)
      { cam: new THREE.Vector3(0, 2.0, -82.0), look: new THREE.Vector3(0, 2.5, -112.0) },
      // 3: Part 3 Divination Orbs
      { cam: new THREE.Vector3(0, 1.2, -122.0), look: new THREE.Vector3(0, 1.2, -128.0) },

      // --- GRAND STAIRCASE CLIMB (Waypoints 4 to 8) ---
      { cam: new THREE.Vector3(-1.2, 1.4, -156.0), look: new THREE.Vector3(-2.4, 1.4, -165.0) },
      { cam: new THREE.Vector3(1.2, 5.4, -156.0), look: new THREE.Vector3(2.4, 5.4, -165.0) },
      { cam: new THREE.Vector3(-1.2, 9.6, -156.0), look: new THREE.Vector3(-2.4, 9.6, -165.0) },
      { cam: new THREE.Vector3(1.2, 13.8, -156.0), look: new THREE.Vector3(2.4, 13.8, -165.0) },
      { cam: new THREE.Vector3(0.0, 18.2, -156.0), look: new THREE.Vector3(0.0, 18.2, -165.0) },

      // --- SKILLS CORRIDOR ENTRANCE & ALCOVES (Waypoints 9 to 13) ---
      // 9: Python (Left Alcove at -210)
      { cam: new THREE.Vector3(-1.8, 1.2, -206.0), look: new THREE.Vector3(-4.8, 1.0, -210.0) },
      // 10: C++ (Right Alcove at -225)
      { cam: new THREE.Vector3(1.8, 1.2, -221.0), look: new THREE.Vector3(4.8, 1.0, -225.0) },
      // 11: Kotlin (Left Alcove at -245)
      { cam: new THREE.Vector3(-1.8, 1.2, -241.0), look: new THREE.Vector3(-4.8, 1.0, -245.0) },
      // 12: Android Studio (Right Alcove at -265)
      { cam: new THREE.Vector3(1.8, 1.2, -261.0), look: new THREE.Vector3(4.8, 1.0, -265.0) },
      // 13: HTML & CSS (Left Alcove at -280)
      { cam: new THREE.Vector3(-1.8, 1.2, -276.0), look: new THREE.Vector3(-4.8, 1.0, -280.0) },

      // --- PORTRAIT GALLERY (Waypoints 14 to 17) ---
      { cam: new THREE.Vector3(0.0, 2.2, -305.0), look: new THREE.Vector3(0.0, 2.2, -325.0) },
      { cam: new THREE.Vector3(2.2, 2.6, -313.0), look: new THREE.Vector3(-6.5, 2.8, -313.0) },
      { cam: new THREE.Vector3(-2.2, 2.6, -325.0), look: new THREE.Vector3(6.5, 2.8, -325.0) },
      { cam: new THREE.Vector3(2.2, 2.6, -337.0), look: new THREE.Vector3(-6.5, 2.8, -337.0) },

      // --- TRIWIZARD ARENA (Waypoints 18 to 20) ---
      { cam: new THREE.Vector3(0.0, 2.2, -378.0), look: new THREE.Vector3(0.0, 2.2, -395.0) },
      { cam: new THREE.Vector3(0.0, 2.2, -405.0), look: new THREE.Vector3(0.0, 2.2, -420.0) },
      { cam: new THREE.Vector3(0.0, 1.2, -427.0), look: new THREE.Vector3(0.0, 0.4, -432.0) },

      // --- RESUME SCROLL (Waypoint 21: Direct transition from Arena) ---
      { cam: new THREE.Vector3(0.0, 3.2, -470.0), look: new THREE.Vector3(0.0, -0.4, -475.0) },

      // --- OWLERY TOWER CONTACT (Waypoint 22) ---
      { cam: new THREE.Vector3(0.0, 2.2, -509.0), look: new THREE.Vector3(1.8, 1.6, -515.0) },

      // --- FOOTER MISCHIEF MANAGED (Waypoint 23) ---
      { cam: new THREE.Vector3(0.0, 1.2, -550.0), look: new THREE.Vector3(0.0, -1.0, -555.0) }
    ];

    this.onRoomChangeCallbacks = [];
    this.currentRoomIndex = 0;

    this.initEvents();
  }

  initEvents() {
    window.addEventListener('wheel', (e) => {
      if (this.isLocked) return;
      const delta = e.deltaY * 0.0012;
      this.targetScroll = THREE.MathUtils.clamp(this.targetScroll + delta, 0, this.maxScroll);
    }, { passive: true });

    window.addEventListener('touchstart', (e) => {
      if (this.isLocked) return;
      this.touchStartY = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (this.isLocked) return;
      const touchY = e.touches[0].clientY;
      const delta = (this.touchStartY - touchY) * 0.003;
      this.touchStartY = touchY;
      this.targetScroll = THREE.MathUtils.clamp(this.targetScroll + delta, 0, this.maxScroll);
    }, { passive: true });

    window.addEventListener('keydown', (e) => {
      if (this.isLocked) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        this.targetScroll = THREE.MathUtils.clamp(this.targetScroll + 0.5, 0, this.maxScroll);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        this.targetScroll = THREE.MathUtils.clamp(this.targetScroll - 0.5, 0, this.maxScroll);
      }
    });
  }

  setLock(locked) {
    this.isLocked = locked;
  }

  scrollToRoom(targetProgress, duration = 1.8) {
    this.targetScroll = THREE.MathUtils.clamp(targetProgress, 0, this.maxScroll);
    gsap.to(this, {
      scrollProgress: this.targetScroll,
      duration,
      ease: 'power2.inOut'
    });
  }

  onRoomChange(cb) {
    this.onRoomChangeCallbacks.push(cb);
  }

  update(mouseParallax) {
    this.scrollProgress += (this.targetScroll - this.scrollProgress) * 0.07;

    const p = this.scrollProgress;
    const baseCamPos = new THREE.Vector3();
    const baseLookPos = new THREE.Vector3();

    const segIndex = Math.min(Math.floor(p), this.waypoints.length - 2);
    const segT = p - segIndex;

    const wpA = this.waypoints[segIndex];
    const wpB = this.waypoints[segIndex + 1];

    baseCamPos.lerpVectors(wpA.cam, wpB.cam, segT);
    baseLookPos.lerpVectors(wpA.look, wpB.look, segT);

    // Smooth transition flight leaving Arena (Waypoint 20) straight into Resume Study Desk (Waypoint 21)
    if (segIndex === 20) {
      baseCamPos.x += Math.sin(segT * Math.PI) * 0.6;
      baseCamPos.y += Math.sin(segT * Math.PI) * 0.35;
    }

    if (mouseParallax) {
      this.camera.position.x = baseCamPos.x + mouseParallax.x * 0.5;
      this.camera.position.y = baseCamPos.y + mouseParallax.y * 0.35;
      this.camera.position.z = baseCamPos.z;
    } else {
      this.camera.position.copy(baseCamPos);
    }

    this.camera.lookAt(baseLookPos);

    const progBar = document.getElementById('global-scroll-progress');
    if (progBar) {
      progBar.style.width = `${(p / this.maxScroll) * 100}%`;
    }

    // Room boundaries (Re-indexed cleanly without Magic Camera):
    // 0: Name, 1: Hat, 2: Hall, 3: Divination, 4: Timeline, 5: Skills, 6: Projects, 7: Arena
    // 8: Resume, 9: Contact (Owlery), 10: Footer
    let activeIndex = 0;
    if (p >= 22.5) {
      activeIndex = 10; // Footer ("Mischief Managed")
    } else if (p >= 21.5) {
      activeIndex = 9;  // Owlery Tower (Contact)
    } else if (p >= 20.5) {
      activeIndex = 8;  // Resume Scroll
    } else if (p >= 17.5) {
      activeIndex = 7;  // Triwizard Arena
    } else if (p >= 13.6) {
      activeIndex = 6;  // Portrait Gallery
    } else if (p >= 8.5) {
      activeIndex = 5;  // Skills Corridor
    } else if (p >= 3.6) {
      activeIndex = 4;  // Grand Staircase Timeline
    } else if (p >= 2.6) {
      activeIndex = 3;  // Divination Orbs
    } else if (p >= 1.5) {
      activeIndex = 2;  // The Great Hall
    } else if (p >= 0.5) {
      activeIndex = 1;  // Sorting Hat Room
    } else {
      activeIndex = 0;  // Name Reveal Hall
    }

    if (this.scene) {
      this.scene.userData = { currentRoom: activeIndex };
    }

    if (activeIndex !== this.currentRoomIndex) {
      this.currentRoomIndex = activeIndex;
      this.onRoomChangeCallbacks.forEach(cb => cb(activeIndex, this.scrollProgress));
    }
  }
}
