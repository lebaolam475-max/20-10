(() => {
  'use strict';

  const main = document.querySelector('main');
  if (!main) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const TAU = Math.PI * 2;
  const clamp = n => Math.max(0, Math.min(1, n));
  const ease = n => 1 - Math.pow(1 - clamp(n), 3);
  let seed = 2010;
  const rnd = () => { seed = seed * 16807 % 2147483647; return (seed - 1) / 2147483646; };

  // Bảng màu: [cánh ngoài, giữa cánh, gốc cánh]
  const PAL = [
    ['#fff3f7', '#f7a8c4', '#d9507f'],
    ['#ffffff', '#fde4ec', '#f3b3c7'],
    ['#fff6dc', '#ffd479', '#f0a53a'],
    ['#f5ecff', '#cfb0f5', '#9b72d6'],
    ['#fff0e8', '#ffb59b', '#ee7f66']
  ];

  function makeSprite(type, p) {
    const S = 120, dpr = 2, pal = PAL[p];
    const c = document.createElement('canvas');
    c.width = c.height = S * dpr;
    const g = c.getContext('2d');
    g.scale(dpr, dpr);
    g.translate(S / 2, S / 2);
    const paint = (cy, r) => {
      const gr = g.createRadialGradient(0, cy, 1, 0, cy, r);
      gr.addColorStop(0, pal[2]); gr.addColorStop(.45, pal[1]); gr.addColorStop(1, pal[0]);
      g.fillStyle = gr; g.fill();
      g.strokeStyle = pal[1]; g.lineWidth = .7; g.stroke();
    };
    if (type === 'blossom') {
      for (let i = 0; i < 5; i++) {
        g.save(); g.rotate(i * TAU / 5); g.beginPath(); g.moveTo(0, 0);
        g.bezierCurveTo(-20, -12, -24, -46, -6, -54); g.lineTo(0, -47); g.lineTo(6, -54);
        g.bezierCurveTo(24, -46, 20, -12, 0, 0); g.closePath(); paint(0, 56); g.restore();
      }
      g.fillStyle = '#f5b942'; g.beginPath(); g.arc(0, 0, 5, 0, TAU); g.fill();
    } else if (type === 'daisy') {
      for (let i = 0; i < 14; i++) {
        g.save(); g.rotate(i * TAU / 14); g.beginPath(); g.ellipse(0, -32, 6.5, 20, 0, 0, TAU);
        g.fillStyle = pal[0]; g.fill(); g.strokeStyle = pal[1]; g.lineWidth = .8; g.stroke(); g.restore();
      }
      g.fillStyle = '#f6c343'; g.beginPath(); g.arc(0, 0, 12, 0, TAU); g.fill();
      g.fillStyle = '#e8a021'; g.beginPath(); g.arc(-2, -2, 6, 0, TAU); g.fill();
    } else if (type === 'tulip') {
      [[-14, -.25], [14, .25], [0, 0]].forEach(([dx, rot]) => {
        g.save(); g.translate(dx, 40); g.rotate(rot); g.beginPath(); g.moveTo(0, 0);
        g.bezierCurveTo(-22, -8, -22, -48, 0, -62); g.bezierCurveTo(22, -48, 22, -8, 0, 0);
        g.closePath(); paint(-6, 64); g.restore();
      });
    } else {
      [-1.15, 1.15, -.7, .7, -.3, .3, 0].forEach(a => {
        g.save(); g.translate(0, 36); g.rotate(a); g.beginPath(); g.moveTo(0, 0);
        g.bezierCurveTo(-24, -14, -18, -44, 0, -60); g.bezierCurveTo(18, -44, 24, -14, 0, 0);
        g.closePath(); paint(0, 60); g.restore();
      });
    }
    return c;
  }

  const sprites = [
    ['blossom', 0], ['blossom', 1], ['blossom', 4], ['daisy', 1], ['daisy', 2],
    ['tulip', 0], ['tulip', 4], ['tulip', 3], ['lotus', 0], ['lotus', 1]
  ].map(([type, p]) => makeSprite(type, p));

  function makeLayer(z) {
    const c = document.createElement('canvas');
    c.setAttribute('aria-hidden', 'true');
    Object.assign(c.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: z });
    main.prepend(c);
    return { c, g: c.getContext('2d') };
  }
  const back = makeLayer(-1);  // luống hoa phía sau nội dung
  const front = makeLayer(3);  // hoa bay và hoa tung lên phía trước
  let W = 0, H = 0;
  let border = [];
  const parts = [];

  function buildBorder() {
    seed = 2010;
    const n = Math.max(8, Math.round(W / 78));
    border = Array.from({ length: n }, (_, i) => {
      const x = (i + .2 + rnd() * .6) / n * W;
      return {
        x, stem: 60 + rnd() * H * .2, size: 38 + rnd() * 28,
        sp: Math.floor(rnd() * sprites.length), ph: rnd() * TAU,
        delay: .4 + Math.abs(x / W - .5) * 1.6 + rnd() * .5, lean: (rnd() - .5) * 30
      };
    });
  }

  function addDrift(initial) {
    parts.push({
      x: Math.random() * W, y: initial ? Math.random() * H : -40,
      vx: (Math.random() - .3) * 14, vy: 14 + Math.random() * 18,
      size: 20 + Math.random() * 20, sp: Math.floor(Math.random() * sprites.length),
      rot: Math.random() * TAU, vr: (Math.random() - .5) * 1, ph: Math.random() * TAU, burst: false, life: 1
    });
  }
  function burst(x, y, count) {
    for (let i = 0; i < count; i++) {
      parts.push({
        x, y, vx: (Math.random() - .5) * 320, vy: -(140 + Math.random() * 240),
        size: 22 + Math.random() * 20, sp: Math.floor(Math.random() * sprites.length),
        rot: Math.random() * TAU, vr: (Math.random() - .5) * 5, ph: 0, burst: true, life: 1
      });
    }
  }

  function drawBorder(t) {
    const g = back.g;
    g.clearRect(0, 0, W, H);
    border.forEach(f => {
      const k = ease((t - f.delay) / 1.8);
      if (k <= 0) return;
      const sway = motion.matches ? 0 : Math.sin(t * 1.1 + f.ph + f.x * .004) * .07;
      const h = f.stem * k, bx = f.x, by = H + 4;
      const hx = bx + f.lean * k + sway * h * 1.4, hy = by - h;
      g.globalAlpha = .92;
      g.strokeStyle = '#6f9a74'; g.lineWidth = 2.2; g.lineCap = 'round';
      g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(bx + sway * h * .4, by - h * .55, hx, hy); g.stroke();
      g.save();
      g.translate(bx + (hx - bx) * .45, by - h * .45);
      g.rotate(-.7 + sway * 2);
      g.fillStyle = '#7fae84';
      g.beginPath(); g.ellipse(f.size * .22, 0, f.size * .24 * k, f.size * .09 * k, 0, 0, TAU); g.fill();
      g.restore();
      const s = f.size * 2 * (.4 + .6 * k);
      g.save(); g.translate(hx, hy); g.rotate(sway * 2 + f.lean * .01);
      g.drawImage(sprites[f.sp], -s / 2, -s / 2, s, s);
      g.restore();
    });
    g.globalAlpha = 1;
  }

  function stepFront(dt) {
    const g = front.g;
    g.clearRect(0, 0, W, H);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      if (p.burst) {
        p.vy += 260 * dt; p.vx *= .995; p.life -= .55 * dt;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
      } else {
        p.ph += dt;
        p.x += (p.vx + Math.sin(p.ph * 1.3) * 18) * dt;
        if (p.y > H + 40) { p.y = -40; p.x = Math.random() * W; }
        if (p.x > W + 40) p.x = -40;
        if (p.x < -40) p.x = W + 40;
      }
      p.y += p.vy * dt;
      p.x += p.burst ? p.vx * dt : 0;
      p.rot += p.vr * dt;
      g.save();
      g.globalAlpha = p.burst ? Math.min(1, p.life * 1.5) : .8;
      g.translate(p.x, p.y); g.rotate(p.rot);
      g.drawImage(sprites[p.sp], -p.size, -p.size, p.size * 2, p.size * 2);
      g.restore();
    }
  }

  function size() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    [back, front].forEach(l => {
      l.c.width = Math.round(W * dpr); l.c.height = Math.round(H * dpr);
      l.g.setTransform(dpr, 0, 0, dpr, 0, 0);
    });
    buildBorder();
  }

  let raf = 0, last = 0, t = 0;
  function frame(now) {
    raf = 0;
    const dt = last ? Math.min(.05, (now - last) / 1000) : .016;
    last = now; t += dt;
    drawBorder(t); stepFront(dt);
    if (!document.hidden && !motion.matches) raf = requestAnimationFrame(frame);
  }
  function start() {
    cancelAnimationFrame(raf); raf = 0; last = 0;
    if (motion.matches) {
      parts.length = 0; front.g.clearRect(0, 0, W, H); drawBorder(99);
    } else {
      if (!parts.some(p => !p.burst)) {
        const n = innerWidth < 768 ? 7 : 12;
        for (let i = 0; i < n; i++) addDrift(true);
      }
      raf = requestAnimationFrame(frame);
    }
  }

  // Chạm vào từ vựng: chữ nảy lên và hoa tung ra.
  document.querySelectorAll('.beauty-list li').forEach(li => {
    li.tabIndex = 0;
    li.setAttribute('role', 'button');
    const word = li.querySelector('.bw-word');
    word.addEventListener('animationend', () => li.classList.remove('is-popped'));
    const pop = () => {
      li.classList.remove('is-popped'); void li.offsetWidth; li.classList.add('is-popped');
      if (motion.matches) return;
      const r = li.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
      burst(x, y, 12);
      if (typeof spawnHearts === 'function') spawnHearts(x, y, 4);
    };
    li.addEventListener('click', pop);
    li.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pop(); }
    });
  });

  // Bất ngờ: khi bó hoa nở xong, hoa tung lên từ giữa màn hình.
  document.addEventListener('bouquet:ready', () => { if (!motion.matches) burst(W / 2, H * .62, 22); });
  document.addEventListener('welcome:begin', () => { if (!motion.matches) burst(W / 2, H * .7, 16); });

  window.addEventListener('resize', size);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) start(); });
  motion.addEventListener('change', start);
  size();
  start();
})();