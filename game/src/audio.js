// Every sound in Lumen Tide is synthesised live with WebAudio: no audio
// files are shipped, and the game stays silent until the player first
// interacts (browsers block audio before a gesture).
export function createAudio() {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, vol, slideTo) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const now = ac.currentTime;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + dur);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  function chord(freqs, dur, type, vol) {
    for (const f of freqs) tone(f, dur, type, vol / freqs.length);
  }

  return {
    unlock() {
      ensure();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    get muted() {
      return muted;
    },
    pickup(combo) {
      // Pitch climbs with the combo, so a hot streak sounds like one.
      const base = 520 + Math.min(combo, 12) * 36;
      tone(base, 0.12, 'sine', 0.16, base * 1.6);
    },
    pulse() {
      tone(180, 0.28, 'sine', 0.22, 720);
      tone(90, 0.22, 'triangle', 0.12, 240);
    },
    hurt() {
      tone(220, 0.3, 'sawtooth', 0.18, 55);
      tone(110, 0.35, 'square', 0.08, 40);
    },
    banish() {
      tone(660, 0.18, 'triangle', 0.14, 1320);
    },
    waveClear() {
      chord([523, 659, 784], 0.5, 'sine', 0.2);
    },
    waveStart() {
      tone(392, 0.16, 'triangle', 0.14);
      setTimeout(() => tone(523, 0.2, 'triangle', 0.14), 140);
    },
    victory() {
      const notes = [523, 659, 784, 1047, 1319];
      notes.forEach((f, i) => setTimeout(() => tone(f, 0.45, 'sine', 0.16), i * 130));
    },
    gameOver() {
      const notes = [392, 330, 262, 196];
      notes.forEach((f, i) => setTimeout(() => tone(f, 0.5, 'triangle', 0.14), i * 170));
    },
  };
}
