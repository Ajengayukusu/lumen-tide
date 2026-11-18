// Posed scenes for the entry's screenshots: from one seed, each shot
// builds the same finished moment every time, so the screenshots are
// real renders of the game's own code, reproducible by anyone.
//   ?shot=start — the title screen over a quiet garden
//   ?shot=play  — mid-wave play, HUD, embers and wisps around the lantern
//   ?shot=brute — wave 3, the Gloom Brute bearing down
//   ?shot=end   — the dawn victory screen with the final score
import { createWorld, startWave, FINAL_WAVE } from './entities.js';
import { range } from './rng.js';

export function poseShot(shot, seed) {
  const world = createWorld(seed);
  if (shot === 'start') {
    world.time = 1.2;
    return { world, scene: 'title', time: 1.2 };
  }
  if (shot === 'play') {
    startWave(world, 2);
    world.time = 6.0;
    world.score = 340;
    world.embers = 21;
    world.combo = 4;
    world.comboTimer = 2.4;
    world.banished = 5;
    world.player.x = 640;
    world.player.y = 380;
    world.player.face = -0.5;
    // A lively mid-wave spread: embers near the lantern, wisps closing in.
    for (const e of world.embersList) {
      e.x = 640 + range(world.rng, -260, 260);
      e.y = 380 + range(world.rng, -160, 160);
    }
    for (let i = 0; i < world.wisps.length; i += 1) {
      const w = world.wisps[i];
      const a = (i / world.wisps.length) * Math.PI * 2;
      w.x = 640 + Math.cos(a) * range(world.rng, 190, 330);
      w.y = 380 + Math.sin(a) * range(world.rng, 130, 220);
    }
    return { world, scene: 'playing', time: 6.0 };
  }
  if (shot === 'brute') {
    startWave(world, 3);
    world.time = 4.0;
    world.score = 610;
    world.embers = 34;
    world.combo = 6;
    world.comboTimer = 2.8;
    world.banished = 11;
    world.player.x = 560;
    world.player.y = 430;
    world.player.face = 0.4;
    world.player.pulseAnim = 0.25;
    if (world.brute) {
      world.brute.x = 760;
      world.brute.y = 330;
      world.brute.hits = 2;
    }
    for (const w of world.wisps) {
      w.x = 760 + range(world.rng, -320, 320);
      w.y = 330 + range(world.rng, -180, 180);
    }
    return { world, scene: 'playing', time: 4.0 };
  }
  if (shot === 'end') {
    startWave(world, FINAL_WAVE);
    world.time = 2.0;
    world.wave = 10;
    world.score = 2840;
    world.embers = 96;
    world.banished = 47;
    world.bestCombo = 9;
    world.hearts = 2;
    world.wisps = [];
    world.brute = null;
    return { world, scene: 'victory', time: 2.0 };
  }
  return { world, scene: 'title', time: 0 };
}
