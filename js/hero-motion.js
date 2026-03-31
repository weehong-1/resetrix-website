/**
 * Hero canvas: drifting node network + soft primary glow (no image assets).
 */
(function initHeroMotion() {
  const canvas = document.getElementById('heroMotion');
  if (!canvas || !canvas.getContext) return;

  const ctx = canvas.getContext('2d');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let rafId = 0;
  let nodes = [];
  let time = 0;
  let w = 0;
  let h = 0;

  const PRIMARY = { r: 191, g: 0, b: 0 };
  const SECONDARY = { r: 255, g: 123, b: 111 };

  function resize() {
    const parent = canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    w = rect.width;
    h = rect.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(w * dpr));
    canvas.height = Math.max(1, Math.floor(h * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function buildNodes() {
    if (w < 1 || h < 1) return;
    const area = w * h;
    const count = Math.min(95, Math.max(32, Math.floor(area / 16000)));
    nodes = [];
    for (let i = 0; i < count; i += 1) {
      nodes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#1a0e10');
    g.addColorStop(0.45, '#231216');
    g.addColorStop(1, '#0c0607');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    const pulse = 0.1 + Math.sin(time * 0.35) * 0.035;
    const rg = ctx.createRadialGradient(w * 0.28, h * 0.18, 0, w * 0.28, h * 0.18, Math.max(w, h) * 0.55);
    rg.addColorStop(0, `rgba(${PRIMARY.r}, ${PRIMARY.g}, ${PRIMARY.b}, ${pulse})`);
    rg.addColorStop(0.55, `rgba(${PRIMARY.r}, ${PRIMARY.g}, ${PRIMARY.b}, 0.02)`);
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, w, h);
  }

  function drawGrid() {
    const step = 48;
    const offset = reducedMotion.matches ? 0 : (time * 18) % step;
    ctx.strokeStyle = `rgba(${PRIMARY.r}, ${PRIMARY.g}, ${PRIMARY.b}, 0.055)`;
    ctx.lineWidth = 1;
    for (let x = -offset; x < w + step; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = offset * 0.4; y < h + step; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  function stepNodes(dt) {
    const drift = reducedMotion.matches ? 0 : dt * 0.045;
    nodes.forEach((n) => {
      if (!reducedMotion.matches) {
        n.phase += 0.006;
        n.x += n.vx + Math.sin(n.phase) * drift;
        n.y += n.vy + Math.cos(n.phase * 0.88) * drift;
      }
      if (n.x < 0) n.x = 0;
      if (n.x > w) n.x = w;
      if (n.y < 0) n.y = 0;
      if (n.y > h) n.y = h;
      if (n.x <= 0 || n.x >= w) n.vx *= -1;
      if (n.y <= 0 || n.y >= h) n.vy *= -1;
    });
  }

  function drawLinks(linkDist) {
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const d = Math.hypot(dx, dy);
        if (d >= linkDist) continue;
        const t = 1 - d / linkDist;
        const alpha = t * 0.2;
        ctx.strokeStyle = `rgba(${SECONDARY.r}, ${SECONDARY.g}, ${SECONDARY.b}, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        ctx.stroke();
      }
    }
  }

  function drawDots() {
    nodes.forEach((n) => {
      ctx.beginPath();
      ctx.arc(n.x, n.y, 2.1, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.32)';
      ctx.fill();
    });
  }

  let last = performance.now();

  function frame(now) {
    const dt = Math.min(32, now - last);
    last = now;
    time += dt * 0.001;
    stepNodes(dt);

    drawBackground();
    drawGrid();
    const linkDist = Math.min(130, w * 0.14);
    drawLinks(linkDist);
    drawDots();

    if (!reducedMotion.matches) {
      rafId = requestAnimationFrame(frame);
    }
  }

  function start() {
    cancelAnimationFrame(rafId);
    resize();
    buildNodes();
    last = performance.now();
    time = 0;
    frame(last);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(start, 120);
  });

  reducedMotion.addEventListener('change', start);
}());
