(() => {
  'use strict';

  // Nhạc nền: nếu có tệp assets/music.mp3 thì phát tệp đó (lặp lại),
  // nếu không thì tự tạo một giai điệu hộp nhạc nhẹ bằng Web Audio, không cần tệp ngoài.
  const PREF_KEY = 'flower.music.20-10.v1';
  const FILE_SRC = './assets/music.mp3';
  const button = document.getElementById('musicToggle');
  if (!button) return;
  const label = button.querySelector('.music-label');
  const AudioCtx = window.AudioContext || window.webkitAudioContext;

  const BPM = 66;
  const EIGHTH = 60 / BPM / 2;
  const BAR = EIGHTH * 8;
  const mtof = midi => 440 * Math.pow(2, (midi - 69) / 12);
  // C - Am - F - G, lặp lại; mỗi hợp âm là một ô nhịp tám nốt móc đơn.
  const CHORDS = [
    { bass: 48, tones: [60, 64, 67, 72] },
    { bass: 45, tones: [60, 64, 69, 72] },
    { bass: 41, tones: [60, 65, 69, 72] },
    { bass: 43, tones: [59, 62, 67, 71] }
  ];
  const ARPEGGIO = [0, 1, 2, 3, 2, 1, 2, 1];
  // Mỗi nốt: [vị trí (nốt móc đơn), nốt MIDI, độ dài (nốt móc đơn)].
  const MELODY = [
    [[0, 76, 3], [3, 74, 1], [4, 72, 2], [6, 67, 2]],
    [[0, 69, 3], [3, 72, 1], [4, 76, 3], [7, 74, 1]],
    [[0, 77, 3], [3, 76, 1], [4, 72, 2], [6, 69, 2]],
    [[0, 74, 4], [4, 71, 2], [6, 67, 2]],
    [[0, 72, 2], [2, 76, 2], [4, 79, 3], [7, 76, 1]],
    [[0, 81, 3], [3, 79, 1], [4, 76, 2], [6, 72, 2]],
    [[0, 77, 2], [2, 81, 2], [4, 79, 2], [6, 77, 2]],
    [[0, 74, 3], [3, 71, 1], [4, 67, 4]]
  ];

  const audio = new Audio();
  audio.src = FILE_SRC;
  audio.loop = true;
  audio.volume = 0.7;
  audio.preload = 'none';

  let ctx = null;
  let master = null;
  let bus = null;
  let timer = 0;
  let barIndex = 0;
  let nextBar = 0;
  let mode = '';
  let playing = false;
  let autoTried = false;

  function readPref() {
    try { return localStorage.getItem(PREF_KEY); } catch { return null; }
  }
  function savePref(value) {
    try { localStorage.setItem(PREF_KEY, value); } catch { /* Không lưu được thì bỏ qua. */ }
  }
  function render() {
    const text = playing ? 'Tắt nhạc' : 'Bật nhạc';
    button.classList.toggle('is-playing', playing);
    button.setAttribute('aria-label', text);
    label.textContent = text;
  }

  function buildGraph() {
    ctx = new AudioCtx();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    bus = ctx.createGain();
    bus.connect(master);
    // Tiếng vọng nhẹ để nốt đàn ngân dài và ấm hơn.
    const delay = ctx.createDelay(2);
    delay.delayTime.value = EIGHTH * 1.5;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.38;
    const soften = ctx.createBiquadFilter();
    soften.type = 'lowpass';
    soften.frequency.value = 2600;
    const wet = ctx.createGain();
    wet.gain.value = 0.4;
    bus.connect(delay);
    delay.connect(soften);
    soften.connect(feedback);
    feedback.connect(delay);
    soften.connect(wet);
    wet.connect(master);
  }

  function fade(target, seconds) {
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(target, now + seconds);
  }

  function pluck(freq, start, hold, peak, { attack = 0.012, tail = 1.6, type = 'sine' } = {}) {
    const end = start + hold + tail;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(gain);
    gain.connect(bus);
    osc.start(start);
    osc.stop(end + 0.05);
  }

  // Tiếng hộp nhạc: nốt chính cùng một họa âm cao, tắt rất nhanh.
  function bell(midi, start, hold, peak, tail) {
    pluck(mtof(midi), start, hold, peak, { tail });
    pluck(mtof(midi) * 4, start, 0, peak * 0.16, { tail: 0.45 });
  }

  function scheduleBar(index, start) {
    const chord = CHORDS[index % CHORDS.length];
    pluck(mtof(chord.bass), start, BAR - 0.8, 0.1, { attack: 0.12, tail: 0.7, type: 'triangle' });
    ARPEGGIO.forEach((tone, i) => bell(chord.tones[tone], start + i * EIGHTH, 0, 0.055, 1.1));
    MELODY[index % MELODY.length].forEach(([offset, midi, length]) =>
      bell(midi, start + offset * EIGHTH, length * EIGHTH * 0.5, 0.15, 1.9));
  }

  function tick() {
    while (nextBar < ctx.currentTime + 1.5) {
      scheduleBar(barIndex++, nextBar);
      nextBar += BAR;
    }
  }

  function startSynth() {
    if (!ctx) return false;
    ctx.resume().catch(() => {});
    fade(0.55, 2.2);
    if (!timer) {
      nextBar = ctx.currentTime + 0.25;
      tick();
      timer = setInterval(tick, 400);
    }
    return true;
  }

  async function start() {
    if (playing) return;
    playing = true;
    render();
    // Tạo AudioContext ngay trong thao tác chạm để trình duyệt cho phép phát tiếng.
    if (AudioCtx && !ctx) buildGraph();
    if (ctx) ctx.resume().catch(() => {});
    if (mode !== 'synth') {
      try {
        await audio.play();
        mode = 'file';
        if (!playing) audio.pause();
        return;
      } catch {
        if (mode === 'file') { playing = false; render(); return; }
        mode = 'synth';
      }
    }
    if (!playing) return;
    if (!startSynth()) { playing = false; render(); }
  }

  function stop() {
    if (!playing) return;
    playing = false;
    render();
    if (mode === 'file') {
      audio.pause();
    } else if (ctx) {
      fade(0, 0.8);
      setTimeout(() => { if (!playing && ctx) ctx.suspend().catch(() => {}); }, 900);
    }
  }

  button.addEventListener('click', () => {
    autoTried = true;
    if (playing) { savePref('off'); stop(); } else { savePref('on'); start(); }
  });

  // Nhạc tự cất lên một lần, ngay sau một thao tác của người xem (nhập tên, chạm hoa, mở thiệp).
  function autoStart() {
    if (autoTried || playing) return;
    autoTried = true;
    if (readPref() === 'off') return;
    start();
  }
  document.addEventListener('welcome:begin', autoStart);
  ['bloom', 'openCard'].forEach(id => {
    const trigger = document.getElementById(id);
    if (trigger) trigger.addEventListener('click', autoStart);
  });

  // Tạm dừng khi chuyển tab và phát tiếp khi quay lại.
  document.addEventListener('visibilitychange', () => {
    if (!playing) return;
    if (document.hidden) {
      if (mode === 'file') audio.pause(); else if (ctx) ctx.suspend().catch(() => {});
    } else if (mode === 'file') {
      audio.play().catch(() => {});
    } else if (ctx) {
      ctx.resume().catch(() => {});
    }
  });

  render();
})();