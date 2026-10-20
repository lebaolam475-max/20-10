(() => {
  'use strict';

  // Trái tim 3D làm từ hàng nghìn hạt sáng đỏ: đập nhịp, xoay, có vòng chữ chúc xoay quanh phía dưới.
  // Chạm vào tim để hạt tỏa ra rồi tụ lại; kéo ngang để xoay.
  const dialog = document.getElementById('heartDialog');
  if (!dialog) return;
  const canvas = document.getElementById('heartCanvas');
  const ctx = canvas.getContext('2d');
  const closeButton = document.getElementById('closeHeart');
  const toLine = document.getElementById('heartTo');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const TAU = Math.PI * 2;
  const SQUASH = 0.28;
  const SHADES = ['#ff2d55', '#ff4d6d', '#e0183f', '#ff7b92', '#ffc2cd'];
  const sprites = SHADES.map(color => {
    const c = document.createElement('canvas');
    c.width = c.height = 32;
    const g = c.getContext('2d');
    const glow = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    glow.addColorStop(0, color);
    glow.addColorStop(0.4, color + 'cc');
    glow.addColorStop(1, color + '00');
    g.fillStyle = glow;
    g.fillRect(0, 0, 32, 32);
    return c;
  });

  let name = '';
  let w = 0, h = 0, scale = 1, cx = 0, cy = 0, ringY = 0, ringR = 1, px = 1;
  let N = 0, X, Y, Z, OX, OY, OZ, VX, VY, VZ, SZ, PH, SH;
  let M = 0, RA, RR, RS, RP, RH;
  let rings = [];
  const sparks = [];
  let angle = 0, spin = 0, dragging = false, lastX = 0, moved = 0, beatBoost = 0;
  let frame = 0, last = 0, time = 0;

  // Mặt trái tim dạng ẩn: (x² + 9/4·y² + z² − 1)³ − x²z³ − 9/80·y²z³ ≤ 0, z hướng lên.
  function heartField(x, y, z) {
    const a = x * x + 2.25 * y * y + z * z - 1;
    return a * a * a - x * x * z * z * z - 0.1125 * y * y * z * z * z;
  }

  function build() {
    if (N) return;
    const small = window.innerWidth < 768;
    const target = small ? 2400 : 3600;
    M = small ? 480 : 820;
    X = new Float32Array(target); Y = new Float32Array(target); Z = new Float32Array(target);
    OX = new Float32Array(target); OY = new Float32Array(target); OZ = new Float32Array(target);
    VX = new Float32Array(target); VY = new Float32Array(target); VZ = new Float32Array(target);
    SZ = new Float32Array(target); PH = new Float32Array(target); SH = new Uint8Array(target);
    let i = 0, tries = 0;
    while (i < target && tries++ < target * 800) {
      const x = (Math.random() * 2 - 1) * 1.3;
      const y = (Math.random() * 2 - 1) * 1.05;
      const z = Math.random() * 2.6 - 1.25;
      const f = heartField(x, y, z);
      if (f > 0) continue;
      // Ưu tiên lớp vỏ để tim có viền rõ, vẫn giữ một ít hạt bên trong cho đầy đặn.
      if (f < -0.12 && Math.random() > 0.1) continue;
      X[i] = x; Y[i] = y; Z[i] = z;
      SZ[i] = 5 + Math.random() * 5;
      PH[i] = Math.random() * TAU;
      const r = Math.random();
      SH[i] = r < 0.3 ? 0 : r < 0.6 ? 1 : r < 0.85 ? 2 : r < 0.96 ? 3 : 4;
      i++;
    }
    N = i;
    RA = new Float32Array(M); RR = new Float32Array(M); RS = new Float32Array(M);
    RP = new Float32Array(M); RH = new Uint8Array(M);
    const ringShades = [0, 2, 2, 1, 3];
    for (let j = 0; j < M; j++) {
      RA[j] = Math.random() * TAU;
      RR[j] = 0.3 + 0.75 * Math.sqrt(Math.random());
      RS[j] = 3 + Math.random() * 4;
      RP[j] = Math.random() * TAU;
      RH[j] = ringShades[Math.floor(Math.random() * ringShades.length)];
    }
  }

  function buildRings() {
    const fontSize = Math.round(Math.max(11, Math.min(18, ringR * 0.075)));
    const specs = [
      { f: 0.92, speed: 0.16, size: fontSize,
        text: `${name ? 'Gửi ' + name + ' · ' : ''}Chúc mừng 20/10 · Luôn rạng rỡ · Bình an · Được yêu thương · ` },
      { f: 0.58, speed: -0.22, size: Math.max(10, fontSize - 2),
        text: 'Hạnh phúc · Mỉm cười · Khỏe mạnh · Yêu thương · ' }
    ];
    rings = specs.map(spec => {
      ctx.font = `italic ${spec.size}px "Palatino Linotype", "Book Antiqua", Georgia, serif`;
      const unit = [...spec.text].map(ch => ({ ch, w: ctx.measureText(ch).width }));
      const unitWidth = unit.reduce((sum, c) => sum + c.w, 0);
      const repeats = Math.max(1, Math.round(TAU * ringR * spec.f / unitWidth));
      const chars = [];
      for (let r = 0; r < repeats; r++) unit.forEach(c => chars.push({ ch: c.ch, w: c.w, a: 0 }));
      const total = chars.reduce((sum, c) => sum + c.w, 0);
      let acc = 0;
      chars.forEach(c => { c.a = -(acc + c.w / 2) / total * TAU; acc += c.w; });
      return { ...spec, chars, font: ctx.font };
    });
  }

  function layout() {
    w = dialog.clientWidth;
    h = dialog.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const landscape = h < 520;
    scale = Math.min(w * (landscape ? 0.2 : 0.31), h * 0.25);
    cx = landscape ? w * 0.62 : w * 0.5;
    cy = h * (landscape ? 0.42 : 0.45);
    ringY = cy + scale * 1.75;
    ringR = Math.min(scale * 1.9, Math.min(cx, w - cx) * 0.95);
    px = Math.max(0.75, Math.min(1.5, scale / 130));
    buildRings();
  }

  function applyName(value) {
    name = String(value || '').normalize('NFC');
    toLine.textContent = name ? `Gửi ${name}` : 'Gửi bạn';
    if (w) buildRings();
  }

  function burst() {
    beatBoost = 1.4;
    for (let i = 0; i < N; i++) {
      const len = Math.hypot(X[i], Y[i], Z[i]) || 1;
      const k = 0.03 + Math.random() * 0.07;
      VX[i] += X[i] / len * k;
      VY[i] += Y[i] / len * k;
      VZ[i] += Z[i] / len * k;
    }
    for (let i = 0; i < 18; i++) addSpark(cx + (Math.random() - 0.5) * scale, cy - Math.random() * scale * 0.6);
  }

  function addSpark(x, y) {
    if (sparks.length > 70) return;
    sparks.push({
      x, y, vx: (Math.random() - 0.5) * 16, vy: -(18 + Math.random() * 34),
      life: 1, size: 4 + Math.random() * 5, shade: Math.random() < 0.5 ? 1 : 3
    });
  }

  function render(t, dt) {
    const still = motion.matches;
    ctx.clearRect(0, 0, w, h);

    // Lần lượt: đĩa hạt và vòng chữ phía dưới, trái tim, rồi tàn sáng bay lên.
    ctx.globalCompositeOperation = 'lighter';
    for (let j = 0; j < M; j++) {
      const a = RA[j] + (still ? 0 : t * 0.35 / (0.4 + RR[j]));
      const s = Math.sin(a);
      const front = (s + 1) / 2;
      const twinkle = still ? 1 : 0.7 + 0.3 * Math.sin(t * 2.6 + RP[j]);
      const size = RS[j] * px;
      ctx.globalAlpha = (0.2 + 0.45 * front) * twinkle;
      ctx.drawImage(sprites[RH[j]], cx + ringR * RR[j] * Math.cos(a) - size / 2,
        ringY + ringR * RR[j] * SQUASH * s - size / 2, size, size);
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffdce4';
    rings.forEach(ring => {
      ctx.font = ring.font;
      const rx = ringR * ring.f;
      const ry = rx * SQUASH;
      const base = still ? 0 : t * ring.speed;
      ring.chars.forEach(c => {
        const a = c.a + base;
        const s = Math.sin(a);
        const co = Math.cos(a);
        let rot = Math.atan2(-ry * co, rx * s);
        if (s < 0) rot += Math.PI;
        ctx.globalAlpha = 0.12 + 0.8 * (s + 1) / 2;
        ctx.save();
        ctx.translate(cx + rx * co, ringY + ry * s);
        ctx.rotate(rot);
        ctx.fillText(c.ch, 0, 0);
        ctx.restore();
      });
    });

    // Nhịp tim "thịch - thịch" và phản ứng khi chạm.
    const phase = (t % 0.95) / 0.95;
    let beat = still ? 0 : Math.exp(-(((phase - 0.08) / 0.055) ** 2)) + 0.65 * Math.exp(-(((phase - 0.3) / 0.065) ** 2));
    beat += beatBoost;
    const bs = 1 + 0.055 * beat;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const step = dt * 60;
    const k = 0.018 * step;
    const damp = Math.pow(0.93, step);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < N; i++) {
      if (!still) {
        VX[i] = (VX[i] - OX[i] * k) * damp; OX[i] += VX[i] * step;
        VY[i] = (VY[i] - OY[i] * k) * damp; OY[i] += VY[i] * step;
        VZ[i] = (VZ[i] - OZ[i] * k) * damp; OZ[i] += VZ[i] * step;
      }
      const x = (X[i] + OX[i]) * bs;
      const y = (Y[i] + OY[i]) * bs;
      const z = (Z[i] + OZ[i]) * bs;
      const rx = x * cos - y * sin;
      const d = x * sin + y * cos;
      const f = 4.2 / (4.2 - d);
      const size = SZ[i] * f * px;
      const twinkle = still ? 1 : 0.7 + 0.3 * Math.sin(t * 2.4 + PH[i]);
      ctx.globalAlpha = Math.min(1, (0.4 + 0.6 * (d + 1.3) / 2.6) * twinkle);
      ctx.drawImage(sprites[SH[i]], cx + rx * scale * f - size / 2, cy - z * scale * f - size / 2, size, size);
    }

    if (!still) {
      if (Math.random() < dt * 14) addSpark(cx + (Math.random() - 0.5) * scale * 2.3, cy - (Math.random() * 1.5 - 0.4) * scale);
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.life -= dt * 0.35;
        if (s.life <= 0) { sparks.splice(i, 1); continue; }
        const size = s.size * px;
        ctx.globalAlpha = s.life * 0.9;
        ctx.drawImage(sprites[s.shade], s.x - size / 2, s.y - size / 2, size, size);
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  function loop(now) {
    frame = 0;
    if (!dialog.open || document.hidden) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;
    time += dt;
    beatBoost *= Math.exp(-dt * 3);
    if (!dragging) angle += 0.5 * dt + spin;
    spin *= 0.94;
    render(time, dt);
    frame = requestAnimationFrame(loop);
  }

  function start() {
    cancelAnimationFrame(frame);
    last = 0;
    if (motion.matches) render(0, 0);
    else frame = requestAnimationFrame(loop);
  }

  function open() {
    if (dialog.open) return;
    build();
    dialog.showModal();
    layout();
    start();
    document.dispatchEvent(new Event('heart:open'));
  }

  document.querySelectorAll('.open-heart').forEach(button => button.addEventListener('click', open));
  closeButton.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { cancelAnimationFrame(frame); frame = 0; });
  window.addEventListener('resize', () => { if (dialog.open) { layout(); if (motion.matches) render(0, 0); } });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && dialog.open) start(); });
  motion.addEventListener('change', () => { if (dialog.open) start(); });
  document.addEventListener('welcome:name', event => applyName(event.detail.name));

  canvas.addEventListener('pointerdown', event => {
    dragging = true;
    moved = 0;
    lastX = event.clientX;
    spin = 0;
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', event => {
    if (!dragging) return;
    const dx = event.clientX - lastX;
    lastX = event.clientX;
    moved += Math.abs(dx);
    angle += dx * 0.008;
    spin = dx * 0.002;
    if (motion.matches) render(0, 0);
  });
  const release = () => {
    if (!dragging) return;
    dragging = false;
    if (moved < 6) { burst(); if (motion.matches) render(0, 0); }
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', () => { dragging = false; });
})();