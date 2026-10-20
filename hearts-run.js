(() => {
  'use strict';

  const main = document.querySelector('main');
  if (!main) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const TAU = Math.PI * 2;
  const COLORS = ['#f06292', '#e8567c', '#ff8fab', '#d95b7d', '#ffb3c6'];

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'fixed', inset: '0', width: '100%', height: '100%',
    pointerEvents: 'none', zIndex: 4
  });
  main.prepend(canvas);
  const g = canvas.getContext('2d');
  let W = 0, H = 0;

  function heart(x, y, s, color, rot, alpha, glow) {
    g.save();
    g.translate(x, y);
    g.rotate(rot);
    g.globalAlpha = alpha;
    if (glow) { g.shadowColor = color; g.shadowBlur = glow; }
    g.beginPath();
    g.moveTo(0, s * .35);
    g.bezierCurveTo(-s * 1.1, -s * .35, -s * .55, -s * 1.1, 0, -s * .45);
    g.bezierCurveTo(s * .55, -s * 1.1, s * 1.1, -s * .35, 0, s * .35);
    g.fillStyle = color;
    g.fill();
    g.restore();
  }

  // Nhịp tim "thịch - thịch".
  const beat = (t, off) => {
    const p = ((t + off) % 1.1) / 1.1;
    return 1 + .2 * (Math.exp(-(((p - .08) / .06) ** 2)) + .6 * Math.exp(-(((p - .3) / .07) ** 2)));
  };

  // Đường chạy vòng theo mép màn hình (hình chữ nhật bo tròn).
  function edge(u, inset) {
    const a = TAU * u, c = Math.cos(a), s = Math.sin(a);
    return [
      W / 2 + (W / 2 - inset) * Math.sign(c) * Math.pow(Math.abs(c), .4),
      H / 2 + (H / 2 - inset) * Math.sign(s) * Math.pow(Math.abs(s), .4)
    ];
  }
  const runners = [
    { u0: 0, speed: .04, dir: 1, size: 15, color: COLORS[0] },
    { u0: .34, speed: .05, dir: -1, size: 13, color: COLORS[2] },
    { u0: .67, speed: .035, dir: 1, size: 17, color: COLORS[3] }
  ];

  // Đôi tim đuổi bắt: tim B đi lại đúng đường của tim A, chậm hơn một nhịp.
  function lead(t) {
    return [
      W / 2 + W * .3 * Math.sin(t * .5) + W * .06 * Math.sin(t * 1.9),
      H / 2 + H * .24 * Math.sin(t * .72 + 1) + H * .04 * Math.cos(t * 2.1)
    ];
  }

  const trail = [];
  let lastX = -999, lastY = -999;
  function sprinkle(x, y, n, spread) {
    for (let i = 0; i < n; i++) {
      if (trail.length > 70) trail.shift();
      trail.push({
        x: x + (Math.random() - .5) * 14, y: y + (Math.random() - .5) * 14,
        vx: (Math.random() - .5) * spread, vy: -(18 + Math.random() * 40),
        size: 5 + Math.random() * 7, life: 1,
        color: COLORS[Math.floor(Math.random() * COLORS.length)], ph: Math.random() * TAU
      });
    }
  }

  function draw(t, dt) {
    g.clearRect(0, 0, W, H);

    runners.forEach((r, ri) => {
      for (let k = 9; k >= 0; k--) {
        const [x, y] = edge(r.u0 + r.dir * (r.speed * t - k * .0065), 20);
        const head = k === 0;
        const s = r.size * (1 - k * .075) * (head ? beat(t, ri * .3) : 1);
        heart(x, y, s, r.color, Math.sin(t * 2 + k) * .25, head ? 1 : .75 * (1 - k / 10), head ? 14 : 0);
      }
    });

    const [ax, ay] = lead(t);
    const [bx, by] = lead(t - .9);
    heart(bx, by, 17 * beat(t, .5), COLORS[1], Math.sin(t * 1.5) * .2, .95, 16);
    heart(ax, ay, 20 * beat(t, 0), COLORS[0], Math.sin(t * 1.5 + 1) * .2, .95, 18);

    for (let i = trail.length - 1; i >= 0; i--) {
      const p = trail[i];
      p.life -= dt * .7;
      if (p.life <= 0) { trail.splice(i, 1); continue; }
      p.ph += dt * 4;
      p.x += (p.vx + Math.sin(p.ph) * 16) * dt;
      p.y += p.vy * dt;
      heart(p.x, p.y, p.size, p.color, Math.sin(p.ph) * .3, Math.min(1, p.life * 1.4), 0);
    }
    g.globalAlpha = 1;
  }

  function size() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (motion.matches) draw(0, 0);
  }

  let raf = 0, last = 0, t = 0;
  function frame(now) {
    raf = 0;
    const dt = last ? Math.min(.05, (now - last) / 1000) : .016;
    last = now; t += dt;
    draw(t, dt);
    if (!document.hidden && !motion.matches) raf = requestAnimationFrame(frame);
  }
  function start() {
    cancelAnimationFrame(raf); raf = 0; last = 0;
    if (motion.matches) { trail.length = 0; draw(0, 0); }
    else raf = requestAnimationFrame(frame);
  }

  addEventListener('pointermove', e => {
    if (motion.matches) return;
    if (Math.hypot(e.clientX - lastX, e.clientY - lastY) < 26) return;
    lastX = e.clientX; lastY = e.clientY;
    sprinkle(e.clientX, e.clientY, 1, 30);
  }, { passive: true });
  addEventListener('pointerdown', e => {
    if (!motion.matches) sprinkle(e.clientX, e.clientY, 6, 120);
  }, { passive: true });

  addEventListener('resize', size);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) start(); });
  motion.addEventListener('change', start);
  size();
  start();
})();