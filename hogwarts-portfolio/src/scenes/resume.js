import * as THREE from 'three';
import gsap from 'gsap';
import { jsPDF } from 'jspdf';
import { content } from '../content.js';

export class ResumeScene {
  constructor(scene, camera, houseThemeManager) {
    this.scene = scene;
    this.camera = camera;
    this.houseTheme = houseThemeManager;

    this.group = new THREE.Group();
    // Positioned along the path at Z = -475
    this.group.position.set(0, 0, -475);
    this.scene.add(this.group);

    this.scrollHandleL = null;
    this.scrollHandleR = null;
    this.parchmentPlane = null;
    this.scrollCanvas = null;
    this.scrollCtx = null;
    this.scrollTex = null;
    this.unrollProgress = { val: 0 };
    this.isUnrolled = false;

    this.init();
    this.initUI();
    this.setupDownloadHandler();
  }

  init() {
    this.buildQuietStudyDesk();
    this.buildUnrollingParchmentScroll();
  }

  buildQuietStudyDesk() {
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x3d2516,
      roughness: 0.7,
      metalness: 0.1,
      emissive: 0x160c07,
      emissiveIntensity: 0.25
    });

    // Dark carved oak study desk
    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.22, 3.8), woodMat);
    deskTop.position.set(0, -0.6, 0);
    this.group.add(deskTop);

    // Desk Legs
    [[-2.8, -1.6, -1.5], [2.8, -1.6, -1.5], [-2.8, -1.6, 1.5], [2.8, -1.6, 1.5]].forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 1.8, 12), woodMat);
      leg.position.set(x, y, z);
      this.group.add(leg);
    });

    // Quiet candle cluster on desk
    const candleWaxMat = new THREE.MeshStandardMaterial({ color: 0xf3e9d2, roughness: 0.35 });
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffe484 });

    [-2.2, 2.2].forEach(x => {
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.65, 10), candleWaxMat);
      c.position.set(x, -0.25, -1.0);
      const f = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.14, 8), flameMat);
      f.position.set(x, 0.15, -1.0);
      this.group.add(c, f);
    });

    // Warm candle desk light
    const deskCandle = new THREE.PointLight(0xffbe58, 4.2, 9.0, 1.2);
    deskCandle.position.set(0, 1.2, 0.5);
    this.group.add(deskCandle);

    const roomAmb = new THREE.AmbientLight(0x40302b, 1.2);
    this.group.add(roomAmb);
  }

  buildUnrollingParchmentScroll() {
    const handleMat = new THREE.MeshStandardMaterial({
      color: 0x22130c,
      roughness: 0.4,
      metalness: 0.2
    });

    const brassCapMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.25,
      metalness: 0.9,
      emissive: 0x4a3205,
      emissiveIntensity: 0.4
    });

    // Left Handle
    this.scrollHandleL = new THREE.Group();
    const rodL = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 3.4, 16), handleMat);
    const capL1 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), brassCapMat);
    capL1.position.y = 1.7;
    const capL2 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), brassCapMat);
    capL2.position.y = -1.7;
    this.scrollHandleL.add(rodL, capL1, capL2);
    this.scrollHandleL.position.set(-0.2, -0.42, 0);
    this.group.add(this.scrollHandleL);

    // Right Handle
    this.scrollHandleR = new THREE.Group();
    const rodR = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 3.4, 16), handleMat);
    const capR1 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), brassCapMat);
    capR1.position.y = 1.7;
    const capR2 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), brassCapMat);
    capR2.position.y = -1.7;
    this.scrollHandleR.add(rodR, capR1, capR2);
    this.scrollHandleR.position.set(0.2, -0.42, 0);
    this.group.add(this.scrollHandleR);

    // High-Resolution Parchment Canvas Texture
    this.scrollCanvas = document.createElement('canvas');
    this.scrollCanvas.width = 1440;
    this.scrollCanvas.height = 960;
    this.scrollCtx = this.scrollCanvas.getContext('2d');
    this.renderScrollParchment();

    this.scrollTex = new THREE.CanvasTexture(this.scrollCanvas);
    this.scrollTex.minFilter = THREE.LinearFilter;
    this.scrollTex.magFilter = THREE.LinearFilter;

    const paperMat = new THREE.MeshStandardMaterial({
      map: this.scrollTex,
      roughness: 0.65,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    // Dynamic unrolling parchment mesh
    this.parchmentPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.01, 3.0), paperMat);
    this.parchmentPlane.rotation.x = -Math.PI / 2;
    this.parchmentPlane.position.set(0, -0.44, 0);
    this.group.add(this.parchmentPlane);
  }

  renderScrollParchment() {
    const ctx = this.scrollCtx;
    if (!ctx) return;

    // Aged Parchment background
    ctx.fillStyle = '#f6edd9';
    ctx.fillRect(0, 0, 1440, 960);

    // Ornate Renaissance Frame
    ctx.strokeStyle = '#b8860b';
    ctx.lineWidth = 12;
    ctx.strokeRect(30, 30, 1380, 900);
    ctx.strokeStyle = '#3d2516';
    ctx.lineWidth = 3;
    ctx.strokeRect(44, 44, 1352, 872);

    // Header Name & Title
    ctx.fillStyle = '#1c120c';
    ctx.font = "bold 64px 'Cinzel', serif";
    ctx.textAlign = 'center';
    ctx.fillText(content.name.toUpperCase(), 720, 125);

    ctx.fillStyle = '#8b5a2b';
    ctx.font = "italic 32px 'Lora', serif";
    ctx.fillText(content.role, 720, 180);

    ctx.fillStyle = '#1c120c';
    ctx.fillRect(440, 210, 560, 2);

    // Education
    ctx.textAlign = 'start';
    ctx.fillStyle = '#b8860b';
    ctx.font = "bold 32px 'Cinzel', serif";
    ctx.fillText("EDUCATION", 80, 280);

    ctx.fillStyle = '#2b1a10';
    ctx.font = "400 24px 'Lora', serif";
    ctx.fillText(content.education, 80, 325);

    // Core Skills Column
    ctx.fillStyle = '#b8860b';
    ctx.font = "bold 32px 'Cinzel', serif";
    ctx.fillText("TECHNICAL MASTERIES", 80, 410);

    const skillNames = content.skills.map(s => s.name).join("  •  ");
    ctx.fillStyle = '#2b1a10';
    ctx.font = "bold 26px monospace";
    ctx.fillText(skillNames, 80, 455);

    // Key Projects
    ctx.fillStyle = '#b8860b';
    ctx.font = "bold 32px 'Cinzel', serif";
    ctx.fillText("KEY EXPEDITIONS & PROJECTS", 80, 545);

    content.projects.forEach((p, i) => {
      ctx.fillStyle = '#1c120c';
      ctx.font = "bold 24px 'Cinzel', serif";
      ctx.fillText(`• ${p.name}`, 80, 600 + i * 75);

      ctx.fillStyle = '#4a3321';
      ctx.font = "italic 22px 'Lora', serif";
      ctx.fillText(p.tagline, 110, 630 + i * 75);
    });

    // Links & Dispatch
    ctx.fillStyle = '#8b5a2b';
    ctx.font = "bold 22px 'Cinzel', serif";
    ctx.textAlign = 'center';
    ctx.fillText(`${content.email}   |   ${content.github}   |   ${content.linkedin}`, 720, 880);

    if (this.scrollTex) this.scrollTex.needsUpdate = true;
  }

  initUI() {
    let el = document.getElementById('resume-ui');
    if (!el) {
      el = document.createElement('div');
      el.id = 'resume-ui';
      document.body.appendChild(el);
    }
    el.className = 'resume-ui hidden';
    el.innerHTML = `
      <div class="resume-header">
        <h2 class="resume-title">${content.resume.title}</h2>
        <p class="resume-subtitle">${content.resume.subtitle}</p>
      </div>

      <div class="resume-actions-dock">
        <button id="btn-download-resume" class="magic-gold-btn" aria-label="Download PDF Resume">
          <span class="btn-scroll-icon">📜</span>
          <span>${content.resume.downloadBtnText}</span>
        </button>
      </div>
    `;
  }

  setupDownloadHandler() {
    const btn = document.getElementById('btn-download-resume');
    if (!btn) return;

    btn.addEventListener('click', async () => {
      // 1. Check if public/resume.pdf exists on server
      try {
        const response = await fetch('/resume.pdf', { method: 'HEAD' });
        if (response.ok) {
          const a = document.createElement('a');
          a.href = '/resume.pdf';
          a.download = `${content.name.replace(/\s+/g, '_')}_Resume.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          return;
        }
      } catch (err) {
        // Fallback directly to client-side generation
      }

      // 2. In-browser PDF generation fallback (always working)
      this.generateBrowserPDF();
    });
  }

  generateBrowserPDF() {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4'
    });

    const pageW = doc.internal.pageSize.getWidth();

    // Background & Borders
    doc.setFillColor(252, 249, 242);
    doc.rect(0, 0, pageW, doc.internal.pageSize.getHeight(), 'F');
    doc.setDrawColor(184, 134, 11);
    doc.setLineWidth(3);
    doc.rect(20, 20, pageW - 40, doc.internal.pageSize.getHeight() - 40, 'S');

    // Header
    doc.setFont('times', 'bold');
    doc.setTextColor(28, 18, 12);
    doc.setFontSize(26);
    doc.text(content.name.toUpperCase(), pageW / 2, 70, { align: 'center' });

    doc.setFont('times', 'italic');
    doc.setFontSize(14);
    doc.setTextColor(139, 90, 43);
    doc.text(content.role, pageW / 2, 95, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(70, 50, 30);
    doc.text(`${content.email}  |  ${content.github}  |  ${content.linkedin}`, pageW / 2, 115, { align: 'center' });

    let y = 150;

    // Summary
    doc.setFont('times', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(184, 134, 11);
    doc.text("EXECUTIVE SUMMARY", 45, y);
    doc.setLineWidth(0.5);
    doc.line(45, y + 4, pageW - 45, y + 4);

    y += 24;
    doc.setFont('times', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    const summaryLines = doc.splitTextToSize(content.resume.summary, pageW - 90);
    doc.text(summaryLines, 45, y);
    y += summaryLines.length * 15 + 15;

    // Education
    doc.setFont('times', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(184, 134, 11);
    doc.text("EDUCATION", 45, y);
    doc.line(45, y + 4, pageW - 45, y + 4);

    y += 24;
    doc.setFont('times', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    doc.text(content.education, 45, y);
    y += 30;

    // Technical Skills
    doc.setFont('times', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(184, 134, 11);
    doc.text("TECHNICAL PROFICIENCIES", 45, y);
    doc.line(45, y + 4, pageW - 45, y + 4);

    y += 24;
    doc.setFont('courier', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    const skillsText = content.skills.map(s => s.name).join("  •  ");
    doc.text(skillsText, 45, y);
    y += 30;

    // Key Projects
    doc.setFont('times', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(184, 134, 11);
    doc.text("KEY PROJECTS & CODECRAFT", 45, y);
    doc.line(45, y + 4, pageW - 45, y + 4);

    y += 24;
    content.projects.forEach(p => {
      doc.setFont('times', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(20, 20, 20);
      doc.text(`• ${p.name}`, 45, y);

      y += 16;
      doc.setFont('times', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      const descLines = doc.splitTextToSize(p.description, pageW - 100);
      doc.text(descLines, 55, y);
      y += descLines.length * 13 + 10;
    });

    doc.save(`${content.name.replace(/\s+/g, '_')}_Resume.pdf`);
  }

  enter() {
    this.group.visible = true;
    this.unrollProgress.val = 0;
    this.isUnrolled = false;

    // Satisfying real physical 3D unrolling animation
    gsap.to(this.unrollProgress, {
      val: 1.0,
      duration: 1.8,
      ease: 'power2.out',
      onUpdate: () => {
        const p = this.unrollProgress.val;
        const width = p * 4.6;
        this.scrollHandleL.position.x = -width / 2;
        this.scrollHandleR.position.x = width / 2;

        this.parchmentPlane.geometry.dispose();
        this.parchmentPlane.geometry = new THREE.PlaneGeometry(Math.max(width, 0.01), 3.0);
      },
      onComplete: () => {
        this.isUnrolled = true;
      }
    });

    document.getElementById('resume-ui')?.classList.remove('hidden');
  }

  exit() {
    document.getElementById('resume-ui')?.classList.add('hidden');
    this.group.visible = false;
  }

  update(time, delta, mouse) {
    if (!this.group.visible) return;
  }
}