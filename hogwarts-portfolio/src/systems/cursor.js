export class WandCursor {
  constructor() {
    this.cursorEl = document.getElementById('wand-cursor');
    this.lastSparkTime = 0;
    this.init();
  }

  init() {
    if (!this.cursorEl) return;
    window.addEventListener('pointermove', (e) => {
      this.cursorEl.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      
      const now = performance.now();
      if (now - this.lastSparkTime > 35) {
        this.spawnSpark(e.clientX, e.clientY);
        this.lastSparkTime = now;
      }
    });
  }

  spawnSpark(x, y) {
    const spark = document.createElement('div');
    spark.className = 'spark-dot';
    const size = Math.random() * 4 + 2;
    spark.style.width = `${size}px`;
    spark.style.height = `${size}px`;
    spark.style.left = `${x}px`;
    spark.style.top = `${y}px`;

    document.body.appendChild(spark);

    const vx = (Math.random() - 0.5) * 40;
    const vy = (Math.random() - 0.5) * 40 + 20;

    spark.animate([
      { transform: 'translate(0, 0) scale(1)', opacity: 0.9 },
      { transform: `translate(${vx}px, ${vy}px) scale(0)`, opacity: 0 }
    ], {
      duration: 600 + Math.random() * 400,
      easing: 'cubic-bezier(0, .9, .57, 1)'
    }).onfinish = () => spark.remove();
  }
}