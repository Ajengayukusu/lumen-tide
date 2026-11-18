// The state machine: title → playing ⇄ paused → victory / game over,
// plus the frame loop. One job: decide which scene is showing and drive
// the world forward one frame at a time.
import { createWorld, startWave, updateWorld, FINAL_WAVE } from './entities.js';
import { render } from './render.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { poseShot } from './shots.js';

export function createGame(canvas, statusEl) {
  const ctx = canvas.getContext('2d');
  const audio = createAudio();
  const input = createInput(canvas);
  const params = new URLSearchParams(window.location.search);
  const seed = Number(params.get('seed') || 20261118);
  const shot = params.get('shot');

  let world = createWorld(seed);
  let scene = 'title';
  let last = performance.now();
  let announced = '';

  function announce(msg) {
    if (msg === announced) return;
    announced = msg;
    statusEl.textContent = msg;
  }

  function begin() {
    world = createWorld(seed + Math.floor(Math.random() * 100000));
    startWave(world, 1);
    scene = 'playing';
    audio.unlock();
    audio.waveStart();
    announce('Wave 1. Gather embers, pulse the shadows away.');
  }

  function restart() {
    begin();
  }

  if (shot) {
    // A posed screenshot: the game jumps straight to a finished scene.
    const posed = poseShot(shot, seed);
    world = posed.world;
    scene = posed.scene;
    world.time = posed.time || 0;
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    if (!shot) {
      if (input.consume('m')) {
        const muted = audio.toggleMute();
        announce(muted ? 'Sound off.' : 'Sound on.');
      }
      if (scene === 'title') {
        world.time += dt;
        if (input.consume('enter') || input.consumeClick()) begin();
      } else if (scene === 'playing') {
        if (input.consume('p') || input.consume('escape')) {
          scene = 'paused';
          announce('Paused.');
        } else {
          const result = updateWorld(world, dt, input, audio);
          if (result === 'victory') {
            scene = 'victory';
            audio.victory();
            announce(`Dawn breaks. Final score ${world.score}.`);
          } else if (result === 'gameover') {
            scene = 'gameover';
            audio.gameOver();
            announce(`The light fades. Final score ${world.score}.`);
          }
        }
      } else if (scene === 'paused') {
        if (input.consume('p') || input.consume('escape') || input.consume('enter')) {
          scene = 'playing';
          announce('Playing.');
        }
      } else if (scene === 'victory' || scene === 'gameover') {
        world.time += dt;
        if (input.consume('r') || input.consume('enter') || input.consumeClick()) restart();
      }
    } else {
      // Posed scenes idle gently so the screenshot has a living frame.
      world.time += dt;
      for (const e of world.embersList) e.bob += dt * 2;
      for (const m of world.motes) m.tw += m.speed * dt;
    }

    render(ctx, world, scene);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);

  return {
    get scene() {
      return scene;
    },
    get world() {
      return world;
    },
  };
}
