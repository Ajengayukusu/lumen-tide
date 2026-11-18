// Everything the eye sees: the night garden, the lantern spirit, the
// shadows, the embers, the HUD and the title / end screens. No game logic
// lives here — render only reads the world state.
import { WORLD, FINAL_WAVE } from './entities.js';

const INK = '#f4ead2';
const DIM = '#b9b3a4';

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function text(ctx, str, x, y, size, color, align, weight, font) {
  ctx.fillStyle = color;
  ctx.font = `${weight || 700} ${size}px ${font || 'Georgia, serif'}`;
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function drawGarden(ctx, s) {
  // Deep indigo sky.
  const sky = ctx.createLinearGradient(0, 0, 0, WORLD.h);
  sky.addColorStop(0, '#0a0e24');
  sky.addColorStop(0.55, '#101736');
  sky.addColorStop(1, '#1a2340');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WORLD.w, WORLD.h);

  // Moon.
  const moon = ctx.createRadialGradient(1120, 92, 8, 1120, 92, 90);
  moon.addColorStop(0, 'rgba(255, 244, 200, 0.9)');
  moon.addColorStop(0.25, 'rgba(255, 244, 200, 0.25)');
  moon.addColorStop(1, 'rgba(255, 244, 200, 0)');
  ctx.fillStyle = moon;
  ctx.fillRect(1000, 0, 240, 210);
  ctx.fillStyle = '#fff3c4';
  circle(ctx, 1120, 92, 34);
  ctx.fillStyle = '#e8d9a0';
  circle(ctx, 1110, 84, 7);
  circle(ctx, 1132, 100, 5);
  circle(ctx, 1124, 78, 4);

  // Twinkling motes.
  for (const m of s.motes) {
    const a = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(m.tw));
    ctx.fillStyle = `rgba(220, 225, 255, ${a.toFixed(3)})`;
    circle(ctx, m.x, m.y, m.r);
  }

  // Rolling hills at the garden's edge.
  ctx.fillStyle = '#0d1526';
  ctx.beginPath();
  ctx.moveTo(0, 640);
  ctx.bezierCurveTo(220, 590, 420, 660, 700, 628);
  ctx.bezierCurveTo(940, 600, 1100, 662, 1280, 630);
  ctx.lineTo(1280, 720);
  ctx.lineTo(0, 720);
  ctx.closePath();
  ctx.fill();

  // Fireflies' grass: short glowing blades along the bottom.
  ctx.strokeStyle = 'rgba(120, 200, 140, 0.35)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 46; i += 1) {
    const x = ((i * 137.5) % 1280) + 8;
    const hgt = 10 + ((i * 53) % 22);
    const sway = Math.sin(s.time * 1.1 + i) * 4;
    ctx.beginPath();
    ctx.moveTo(x, 720);
    ctx.quadraticCurveTo(x + sway, 720 - hgt * 0.6, x + sway * 1.6, 720 - hgt);
    ctx.stroke();
  }
}

function drawEmber(ctx, e, time) {
  const bobY = Math.sin(e.bob) * 4;
  const glowR = e.kind === 'grand' ? 30 : 20;
  const g = ctx.createRadialGradient(e.x, e.y + bobY, 1, e.x, e.y + bobY, glowR);
  g.addColorStop(0, 'rgba(255, 214, 106, 0.85)');
  g.addColorStop(1, 'rgba(255, 214, 106, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(e.x - glowR, e.y + bobY - glowR, glowR * 2, glowR * 2);
  ctx.fillStyle = e.kind === 'grand' ? '#ffd76a' : '#ffe9a8';
  circle(ctx, e.x, e.y + bobY, e.kind === 'grand' ? 8 : 5.5);
  ctx.fillStyle = '#fffbe8';
  circle(ctx, e.x - 1.5, e.y + bobY - 1.5, 2);
}

function drawWisp(ctx, w, time) {
  const wob = Math.sin(w.wobble) * 3;
  const g = ctx.createRadialGradient(w.x, w.y, 2, w.x, w.y, w.r * 2.4);
  g.addColorStop(0, 'rgba(150, 120, 255, 0.5)');
  g.addColorStop(1, 'rgba(150, 120, 255, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(w.x - w.r * 2.4, w.y - w.r * 2.4, w.r * 4.8, w.r * 4.8);
  // A ragged shadow body.
  ctx.fillStyle = '#241d4d';
  ctx.beginPath();
  ctx.arc(w.x, w.y + wob * 0.4, w.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#171233';
  ctx.beginPath();
  ctx.moveTo(w.x - w.r * 0.8, w.y + w.r * 0.4);
  ctx.quadraticCurveTo(w.x - w.r * 0.4, w.y + w.r * 1.5 + wob, w.x, w.y + w.r * 0.7);
  ctx.quadraticCurveTo(w.x + w.r * 0.4, w.y + w.r * 1.5 - wob, w.x + w.r * 0.8, w.y + w.r * 0.4);
  ctx.closePath();
  ctx.fill();
  // Two pale eyes.
  ctx.fillStyle = '#d9ccff';
  circle(ctx, w.x - w.r * 0.35, w.y - 2 + wob * 0.3, 2.6);
  circle(ctx, w.x + w.r * 0.35, w.y - 2 + wob * 0.3, 2.6);
}

function drawBrute(ctx, b, time) {
  const g = ctx.createRadialGradient(b.x, b.y, 6, b.x, b.y, b.r * 2.6);
  g.addColorStop(0, 'rgba(140, 100, 255, 0.55)');
  g.addColorStop(1, 'rgba(140, 100, 255, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(b.x - b.r * 2.6, b.y - b.r * 2.6, b.r * 5.2, b.r * 5.2);
  ctx.fillStyle = '#1c1440';
  circle(ctx, b.x, b.y, b.r);
  // Crown of thorns.
  ctx.strokeStyle = '#3a2d6e';
  ctx.lineWidth = 5;
  for (let i = 0; i < 7; i += 1) {
    const a = -Math.PI / 2 + (i - 3) * 0.32;
    ctx.beginPath();
    ctx.moveTo(b.x + Math.cos(a) * b.r * 0.8, b.y + Math.sin(a) * b.r * 0.8);
    ctx.lineTo(b.x + Math.cos(a) * (b.r + 18), b.y + Math.sin(a) * (b.r + 18));
    ctx.stroke();
  }
  // Angry eyes and a torn mouth.
  ctx.fillStyle = '#ff5d47';
  circle(ctx, b.x - 16, b.y - 8, 5);
  circle(ctx, b.x + 16, b.y - 8, 5);
  ctx.strokeStyle = '#d9ccff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(b.x - 18, b.y + 16);
  ctx.quadraticCurveTo(b.x, b.y + 26, b.x + 18, b.y + 16);
  ctx.stroke();
  // Gloom hearts left, as three small shards above the brute.
  for (let i = 0; i < b.maxHits; i += 1) {
    ctx.fillStyle = i < b.hits ? '#b9a7ff' : 'rgba(185, 167, 255, 0.25)';
    const sx = b.x - 26 + i * 26;
    circle(ctx, sx, b.y - b.r - 22, 6);
  }
}

function drawPlayer(ctx, p, time) {
  const blink = p.invuln > 0 && Math.floor(time * 12) % 2 === 0;
  const glowR = 74 + Math.sin(time * 3) * 7;
  const g = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, glowR);
  g.addColorStop(0, 'rgba(255, 226, 130, 0.75)');
  g.addColorStop(0.4, 'rgba(255, 200, 90, 0.22)');
  g.addColorStop(1, 'rgba(255, 200, 90, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(p.x - glowR, p.y - glowR, glowR * 2, glowR * 2);

  // Pulse ring while it expands.
  if (p.pulseAnim > 0) {
    const f = 1 - p.pulseAnim / 0.45;
    ctx.strokeStyle = `rgba(255, 230, 150, ${(1 - f).toFixed(3)})`;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 30 + f * 165, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (!blink) {
    // Wings.
    const flap = Math.sin(time * 14) * 0.5;
    ctx.fillStyle = 'rgba(255, 236, 170, 0.85)';
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.face);
    ctx.beginPath();
    ctx.ellipse(-6, -12 - flap * 6, 13, 7 - flap * 2, -0.6, 0, Math.PI * 2);
    ctx.ellipse(-6, 12 + flap * 6, 13, 7 - flap * 2, 0.6, 0, Math.PI * 2);
    ctx.fill();
    // Body: a little lantern.
    ctx.fillStyle = '#3a2a12';
    ctx.beginPath();
    ctx.ellipse(0, 0, 15, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe27a';
    ctx.beginPath();
    ctx.ellipse(2, 0, 10, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2a1e0c';
    circle(ctx, 12, -3, 1.8);
    circle(ctx, 12, 3, 1.8);
    ctx.restore();
  }
}

function drawParticles(ctx, s) {
  for (const pt of s.particles) {
    const a = Math.max(0, pt.life / pt.maxLife);
    ctx.fillStyle = pt.color;
    ctx.globalAlpha = a;
    circle(ctx, pt.x, pt.y, pt.r * a + 0.5);
  }
  ctx.globalAlpha = 1;
}

function drawHud(ctx, s) {
  // Top bar.
  ctx.fillStyle = 'rgba(7, 10, 24, 0.55)';
  ctx.fillRect(0, 0, WORLD.w, 76);
  ctx.fillStyle = 'rgba(244, 234, 210, 0.16)';
  ctx.fillRect(0, 76, WORLD.w, 1);

  // Hearts.
  for (let i = 0; i < 3; i += 1) {
    const x = 36 + i * 36;
    const y = 38;
    ctx.fillStyle = i < s.hearts ? '#ff8a7a' : 'rgba(255, 138, 122, 0.22)';
    ctx.beginPath();
    ctx.moveTo(x, y + 8);
    ctx.bezierCurveTo(x - 12, y - 4, x - 6, y - 14, x, y - 5);
    ctx.bezierCurveTo(x + 6, y - 14, x + 12, y - 4, x, y + 8);
    ctx.closePath();
    ctx.fill();
  }

  text(ctx, `SCORE  ${s.score}`, 640, 30, 30, INK, 'center', 800);
  text(ctx, `WAVE ${s.wave} / ${FINAL_WAVE}`, 640, 60, 16, DIM, 'center', 600, 'Verdana, sans-serif');
  text(ctx, `EMBERS ${s.embers}`, 1180, 30, 18, '#ffd76a', 'right', 700, 'Verdana, sans-serif');
  text(ctx, `BANISHED ${s.banished}`, 1180, 58, 14, DIM, 'right', 600, 'Verdana, sans-serif');

  // Combo flame.
  if (s.combo >= 2) {
    text(ctx, `COMBO x${Math.max(1, s.combo)}`, 170, 30, 22, '#ffb347', 'left', 800);
    const w = 110 * (s.comboTimer / 3.5);
    ctx.fillStyle = 'rgba(255, 179, 71, 0.3)';
    ctx.fillRect(170, 48, 110, 6);
    ctx.fillStyle = '#ffb347';
    ctx.fillRect(170, 48, Math.max(0, w), 6);
  }

  // Pulse cooldown as a lantern meter, bottom centre (kept clear of the
  // viewport's bottom edge, where headless captures can clip a few px).
  const cd = s.player.pulseCooldown;
  const ready = cd <= 0;
  ctx.fillStyle = 'rgba(7, 10, 24, 0.55)';
  ctx.beginPath();
  ctx.arc(640, 644, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = ready ? '#ffd76a' : 'rgba(255, 215, 106, 0.35)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(640, 644, 30, -Math.PI / 2, -Math.PI / 2 + (ready ? Math.PI * 2 : (1 - cd / 1.2) * Math.PI * 2));
  ctx.stroke();
  text(ctx, ready ? 'PULSE' : '…', 640, 646, 12, ready ? '#ffd76a' : DIM, 'center', 800, 'Verdana, sans-serif');
  text(ctx, 'SPACE / CLICK', 640, 676, 11, DIM, 'center', 600, 'Verdana, sans-serif');

  // Wave banner.
  if (s.bannerTimer > 0) {
    const a = Math.min(1, s.bannerTimer);
    ctx.globalAlpha = a;
    text(ctx, s.banner, 640, 200, 44, INK, 'center', 800);
    ctx.globalAlpha = 1;
  }
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(7, 10, 24, 0.72)';
  ctx.strokeStyle = 'rgba(255, 215, 106, 0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 18);
  ctx.fill();
  ctx.stroke();
}

function drawTitle(ctx, s) {
  ctx.fillStyle = 'rgba(7, 10, 24, 0.45)';
  ctx.fillRect(0, 0, WORLD.w, WORLD.h);
  panel(ctx, 290, 130, 700, 430);
  text(ctx, 'LUMEN TIDE', 640, 200, 64, '#ffd76a', 'center', 800);
  text(ctx, 'Keeper of the Last Light', 640, 248, 24, INK, 'center', 400, 'Georgia, serif');
  text(ctx, 'The night garden is filling with shadows.', 640, 310, 19, DIM, 'center', 400, 'Georgia, serif');
  text(ctx, 'Gather the embers. Pulse the dark away.', 640, 340, 19, DIM, 'center', 400, 'Georgia, serif');
  text(ctx, 'Survive all 10 waves and bring the dawn.', 640, 370, 19, DIM, 'center', 400, 'Georgia, serif');
  text(ctx, 'WASD / ARROWS — move      SPACE / CLICK — pulse', 640, 430, 17, INK, 'center', 700, 'Verdana, sans-serif');
  text(ctx, 'P — pause      M — mute      R — restart', 640, 460, 15, DIM, 'center', 600, 'Verdana, sans-serif');
  const blink = Math.floor(s.time * 2) % 2 === 0;
  if (blink) text(ctx, 'Press ENTER or CLICK to begin', 640, 520, 20, '#ffd76a', 'center', 700);
}

function drawEnd(ctx, s, won) {
  ctx.fillStyle = won ? 'rgba(255, 220, 130, 0.16)' : 'rgba(7, 10, 24, 0.6)';
  ctx.fillRect(0, 0, WORLD.w, WORLD.h);
  panel(ctx, 290, 130, 700, 440);
  if (won) {
    text(ctx, 'DAWN BREAKS', 640, 205, 58, '#ffd76a', 'center', 800);
    text(ctx, 'You kept the last light alive.', 640, 255, 22, INK, 'center', 400, 'Georgia, serif');
  } else {
    text(ctx, 'THE LIGHT FADES', 640, 205, 52, '#ff8a7a', 'center', 800);
    text(ctx, 'The shadows take the garden… this time.', 640, 255, 22, INK, 'center', 400, 'Georgia, serif');
  }
  text(ctx, `SCORE  ${s.score}`, 640, 320, 34, INK, 'center', 800);
  text(ctx, `Waves cleared ${won ? FINAL_WAVE : Math.max(0, s.wave - 1)}  ·  Embers ${s.embers}  ·  Shadows banished ${s.banished}`, 640, 362, 17, DIM, 'center', 600, 'Verdana, sans-serif');
  text(ctx, `Best combo x${Math.max(1, s.bestCombo)}`, 640, 392, 17, DIM, 'center', 600, 'Verdana, sans-serif');
  const blink = Math.floor(s.time * 2) % 2 === 0;
  if (blink) text(ctx, 'Press R or CLICK to play again', 640, 500, 20, '#ffd76a', 'center', 700);
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(7, 10, 24, 0.6)';
  ctx.fillRect(0, 0, WORLD.w, WORLD.h);
  text(ctx, 'PAUSED', 640, 340, 54, INK, 'center', 800);
  text(ctx, 'Press P to keep playing', 640, 400, 19, DIM, 'center', 600, 'Verdana, sans-serif');
}

export function render(ctx, s, scene) {
  ctx.save();
  if (s.shake > 0) {
    ctx.translate((Math.random() - 0.5) * s.shake, (Math.random() - 0.5) * s.shake);
  }
  drawGarden(ctx, s);
  for (const e of s.embersList) drawEmber(ctx, e, s.time);
  for (const w of s.wisps) drawWisp(ctx, w, s.time);
  if (s.brute) drawBrute(ctx, s.brute, s.time);
  drawPlayer(ctx, s.player, s.time);
  drawParticles(ctx, s);
  ctx.restore();

  if (scene === 'playing' || scene === 'paused') drawHud(ctx, s);
  if (scene === 'title') drawTitle(ctx, s);
  if (scene === 'gameover') drawEnd(ctx, s, false);
  if (scene === 'victory') drawEnd(ctx, s, true);
  if (scene === 'paused') drawPaused(ctx);
}
