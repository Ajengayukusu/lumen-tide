// Keyboard and mouse state, read once per frame by the game loop.
// Movement: WASD or arrow keys. Pulse: Space or left click.
// R restarts from an end screen, P pauses, M mutes, Enter starts.
export function createInput(canvas) {
  const keys = new Set();
  let mouse = { x: 640, y: 360, clicked: false };
  let clickedAt = 0;

  function key(e) {
    return e.key.length === 1 ? e.key.toLowerCase() : e.key;
  }

  window.addEventListener('keydown', (e) => {
    const k = key(e);
    if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
    keys.add(k);
  });
  window.addEventListener('keyup', (e) => keys.delete(key(e)));
  window.addEventListener('blur', () => keys.clear());

  function trackPointer(e) {
    const rect = canvas.getBoundingClientRect();
    mouse = {
      x: ((e.clientX - rect.left) / rect.width) * 1280,
      y: ((e.clientY - rect.top) / rect.height) * 720,
      clicked: mouse.clicked,
    };
  }

  canvas.addEventListener('pointermove', trackPointer);
  canvas.addEventListener('pointerdown', (e) => {
    trackPointer(e);
    mouse.clicked = true;
    clickedAt = performance.now();
  });
  window.addEventListener('pointerup', () => {
    mouse.clicked = false;
  });

  return {
    axis() {
      let x = 0;
      let y = 0;
      if (keys.has('a') || keys.has('arrowleft')) x -= 1;
      if (keys.has('d') || keys.has('arrowright')) x += 1;
      if (keys.has('w') || keys.has('arrowup')) y -= 1;
      if (keys.has('s') || keys.has('arrowdown')) y += 1;
      if (x !== 0 && y !== 0) {
        const inv = 1 / Math.hypot(x, y);
        x *= inv;
        y *= inv;
      }
      return { x, y };
    },
    pressed(code) {
      return keys.has(code);
    },
    consume(code) {
      if (!keys.has(code)) return false;
      keys.delete(code);
      return true;
    },
    mouse() {
      return mouse;
    },
    // A click is a fresh press, not a held button: true once per press.
    consumeClick() {
      if (!mouse.clicked) return false;
      if (performance.now() - clickedAt > 400) return false;
      mouse.clicked = false;
      return true;
    },
  };
}
