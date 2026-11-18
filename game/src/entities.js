// The garden's cast: the lantern spirit, drifting embers, hunting shadow
// wisps, the Gloom Brute, and the sparks a pulse leaves behind. This file
// owns movement, spawning, collisions and scoring — never drawing.
import { makeRng, range } from './rng.js';

export const WORLD = { w: 1280, h: 720 };
export const FINAL_WAVE = 10;

const EMBER_VALUE = 10;
const COMBO_WINDOW = 3.5;

export function createWorld(seed) {
  const rng = makeRng(seed);
  const state = {
    seed,
    rng,
    time: 0,
    wave: 0,
    score: 0,
    embers: 0,
    hearts: 3,
    combo: 0,
    comboTimer: 0,
    bestCombo: 0,
    banished: 0,
    pulses: 0,
    player: {
      x: 640,
      y: 400,
      r: 16,
      speed: 300,
      vx: 0,
      vy: 0,
      face: 0,
      invuln: 0,
      pulseCooldown: 0,
      pulseAnim: 0,
    },
    wisps: [],
    embersList: [],
    brute: null,
    particles: [],
    motes: [],
    banner: '',
    bannerTimer: 0,
    shake: 0,
    dawn: 0,
  };

  // Fixed starfield motes for the night sky, seeded once.
  for (let i = 0; i < 90; i += 1) {
    state.motes.push({
      x: rng() * WORLD.w,
      y: rng() * WORLD.h,
      r: range(rng, 0.6, 2.2),
      tw: range(rng, 0, Math.PI * 2),
      speed: range(rng, 0.4, 1.4),
    });
  }
  return state;
}

function spawnEmber(s, x, y) {
  s.embersList.push({
    x: x ?? range(s.rng, 60, WORLD.w - 60),
    y: y ?? range(s.rng, 110, WORLD.h - 60),
    r: 9,
    bob: range(s.rng, 0, Math.PI * 2),
    kind: s.rng() < 0.12 ? 'grand' : 'small',
  });
}

function spawnWisp(s, edge) {
  const side = edge ?? Math.floor(s.rng() * 4);
  let x;
  let y;
  if (side === 0) {
    x = range(s.rng, 0, WORLD.w);
    y = -30;
  } else if (side === 1) {
    x = WORLD.w + 30;
    y = range(s.rng, 0, WORLD.h);
  } else if (side === 2) {
    x = range(s.rng, 0, WORLD.w);
    y = WORLD.h + 30;
  } else {
    x = -30;
    y = range(s.rng, 0, WORLD.h);
  }
  const speed = range(s.rng, 55, 85) + s.wave * 7;
  s.wisps.push({
    x,
    y,
    r: range(s.rng, 13, 18),
    speed,
    wobble: range(s.rng, 0, Math.PI * 2),
    wobbleSpeed: range(s.rng, 1.2, 2.4),
    hits: 1,
  });
}

export function startWave(s, n) {
  s.wave = n;
  s.wisps = [];
  s.brute = null;
  const count = 3 + n * 2;
  for (let i = 0; i < count; i += 1) spawnWisp(s);
  const embers = 5 + Math.min(6, n);
  for (let i = 0; i < embers; i += 1) spawnEmber(s);
  if (n % 3 === 0) {
    s.brute = {
      x: WORLD.w / 2,
      y: -60,
      r: 46,
      speed: 42 + n * 2,
      hits: 3,
      maxHits: 3,
      wobble: 0,
    };
  }
  s.banner = n === 1 ? 'Wave 1 — the tide rises' : `Wave ${n}`;
  s.bannerTimer = 2.2;
}

export function burst(s, x, y, color, n, speed) {
  for (let i = 0; i < n; i += 1) {
    const a = s.rng() * Math.PI * 2;
    const v = range(s.rng, speed * 0.3, speed);
    s.particles.push({
      x,
      y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      life: range(s.rng, 0.35, 0.8),
      maxLife: 0.8,
      r: range(s.rng, 2, 5),
      color,
    });
  }
}

// The pulse: a ring of light that shoves every shadow away from the
// lantern. Wisps caught inside the ring are banished; the Brute only
// loses one of its three hearts of gloom per pulse.
export function firePulse(s, audio) {
  const p = s.player;
  if (p.pulseCooldown > 0) return false;
  p.pulseCooldown = 1.2;
  p.pulseAnim = 0.45;
  s.pulses += 1;
  audio.pulse();
  const R = 190;
  for (const w of s.wisps) {
    const dx = w.x - p.x;
    const dy = w.y - p.y;
    const d = Math.hypot(dx, dy);
    if (d < R + w.r) {
      const push = 420;
      const nx = d === 0 ? 1 : dx / d;
      const ny = d === 0 ? 0 : dy / d;
      w.x += nx * push * 0.16;
      w.y += ny * push * 0.16;
      if (d < R * 0.62) {
        w.banished = true;
        s.banished += 1;
        s.score += 15 * Math.max(1, s.combo);
        burst(s, w.x, w.y, '#b9a7ff', 14, 260);
        audio.banish();
      }
    }
  }
  s.wisps = s.wisps.filter((w) => !w.banished);
  if (s.brute) {
    const dx = s.brute.x - p.x;
    const dy = s.brute.y - p.y;
    const d = Math.hypot(dx, dy);
    if (d < R + s.brute.r) {
      s.brute.hits -= 1;
      const nx = d === 0 ? 1 : dx / d;
      const ny = d === 0 ? 0 : dy / d;
      s.brute.x += nx * 150;
      s.brute.y += ny * 150;
      burst(s, s.brute.x, s.brute.y, '#8f7bff', 20, 300);
      if (s.brute.hits <= 0) {
        s.score += 150 * Math.max(1, s.combo);
        s.banished += 1;
        burst(s, s.brute.x, s.brute.y, '#ffd76a', 40, 380);
        for (let i = 0; i < 5; i += 1) spawnEmber(s, s.brute.x + range(s.rng, -70, 70), s.brute.y + range(s.rng, -50, 50));
        audio.banish();
        s.brute = null;
      }
    }
  }
  return true;
}

function hurtPlayer(s, audio) {
  const p = s.player;
  if (p.invuln > 0 || s.hearts <= 0) return;
  s.hearts -= 1;
  s.combo = 0;
  s.comboTimer = 0;
  p.invuln = 1.6;
  s.shake = 14;
  burst(s, p.x, p.y, '#ff7a6b', 22, 320);
  audio.hurt();
}

export function updateWorld(s, dt, input, audio) {
  s.time += dt;
  const p = s.player;
  p.pulseCooldown = Math.max(0, p.pulseCooldown - dt);
  p.pulseAnim = Math.max(0, p.pulseAnim - dt);
  p.invuln = Math.max(0, p.invuln - dt);
  s.shake = Math.max(0, s.shake - dt * 30);
  s.bannerTimer = Math.max(0, s.bannerTimer - dt);
  if (s.comboTimer > 0) {
    s.comboTimer -= dt;
    if (s.comboTimer <= 0) s.combo = 0;
  }

  // Move the lantern spirit.
  const ax = input.axis();
  p.vx += ax.x * 2400 * dt;
  p.vy += ax.y * 2400 * dt;
  p.vx *= Math.pow(0.0001, dt);
  p.vy *= Math.pow(0.0001, dt);
  const spd = Math.hypot(p.vx, p.vy);
  const max = p.speed;
  if (spd > max) {
    p.vx = (p.vx / spd) * max;
    p.vy = (p.vy / spd) * max;
  }
  p.x = Math.max(24, Math.min(WORLD.w - 24, p.x + p.vx * dt));
  p.y = Math.max(100, Math.min(WORLD.h - 24, p.y + p.vy * dt));
  if (spd > 20) p.face = Math.atan2(p.vy, p.vx);

  if (input.pressed(' ') || input.consumeClick()) firePulse(s, audio);

  // Wisps hunt the light.
  for (const w of s.wisps) {
    w.wobble += w.wobbleSpeed * dt;
    const dx = p.x - w.x;
    const dy = p.y - w.y;
    const d = Math.hypot(dx, dy) || 1;
    const wob = Math.sin(w.wobble) * 26;
    w.x += ((dx / d) * w.speed + (-dy / d) * wob) * dt;
    w.y += ((dy / d) * w.speed + (dx / d) * wob) * dt;
  }
  if (s.brute) {
    const b = s.brute;
    b.wobble += dt;
    const dx = p.x - b.x;
    const dy = p.y - b.y;
    const d = Math.hypot(dx, dy) || 1;
    b.x += (dx / d) * b.speed * dt + Math.sin(b.wobble * 2) * 18 * dt;
    b.y += (dy / d) * b.speed * dt;
  }

  // Embers: bob, drift toward the lantern when close, and get eaten.
  for (const e of s.embersList) {
    e.bob += dt * 2;
    const dx = p.x - e.x;
    const dy = p.y - e.y;
    const d = Math.hypot(dx, dy);
    if (d < 130 && d > 1) {
      e.x += (dx / d) * 190 * dt;
      e.y += (dy / d) * 190 * dt;
    }
    if (d < p.r + e.r + 4) {
      e.eaten = true;
      s.embers += 1;
      s.combo += 1;
      s.comboTimer = COMBO_WINDOW;
      s.bestCombo = Math.max(s.bestCombo, s.combo);
      const mult = Math.max(1, s.combo);
      s.score += EMBER_VALUE * mult * (e.kind === 'grand' ? 5 : 1);
      burst(s, e.x, e.y, e.kind === 'grand' ? '#ffd76a' : '#ffe9a8', e.kind === 'grand' ? 18 : 8, 200);
      audio.pickup(s.combo);
    }
  }
  s.embersList = s.embersList.filter((e) => !e.eaten);

  // Collisions: a shadow that touches the lantern costs a heart.
  for (const w of s.wisps) {
    const d = Math.hypot(w.x - p.x, w.y - p.y);
    if (d < w.r + p.r - 2) {
      hurtPlayer(s, audio);
      w.x += ((w.x - p.x) / (d || 1)) * 60;
      w.y += ((w.y - p.y) / (d || 1)) * 60;
    }
  }
  if (s.brute) {
    const d = Math.hypot(s.brute.x - p.x, s.brute.y - p.y);
    if (d < s.brute.r + p.r - 4) hurtPlayer(s, audio);
  }

  // Particles fade; motes twinkle.
  for (const pt of s.particles) {
    pt.life -= dt;
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.vx *= 0.94;
    pt.vy *= 0.94;
  }
  s.particles = s.particles.filter((pt) => pt.life > 0);
  for (const m of s.motes) m.tw += m.speed * dt;

  // A cleared wave (no wisps, no brute, embers optional) opens the next.
  if (s.wisps.length === 0 && !s.brute && s.wave > 0) {
    if (s.wave >= FINAL_WAVE) return 'victory';
    const bonus = 50 + s.wave * 25;
    s.score += bonus;
    audio.waveClear();
    startWave(s, s.wave + 1);
    audio.waveStart();
  }
  if (s.hearts <= 0) return 'gameover';
  return 'playing';
}
