// Ember Sigils — tiny WebAudio sound effects, synthesized, no audio files.
// A pluck for playing a card, a low thud for damage, a shimmer for healing,
// a short arpeggio for victory. Mute with M; nothing plays before the first
// user gesture, so the AudioContext is created lazily.
let context = null;
let muted = false;

function ensureContext() {
  if (context) return context;
  try {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
  } catch {
    return null;
  }
  return context;
}

function tone(freq, duration, type, gain, when = 0) {
  const ctx = ensureContext();
  if (!ctx || muted) return;
  const start = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(gain, start + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

export function createAudio() {
  return {
    unlock() {
      const ctx = ensureContext();
      if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    isMuted() {
      return muted;
    },
    playCard() {
      tone(520, 0.12, 'triangle', 0.16);
      tone(780, 0.16, 'triangle', 0.12, 0.05);
    },
    hit() {
      tone(110, 0.22, 'sawtooth', 0.2);
      tone(82, 0.26, 'square', 0.1, 0.02);
    },
    heal() {
      tone(660, 0.18, 'sine', 0.12);
      tone(990, 0.24, 'sine', 0.1, 0.08);
    },
    block() {
      tone(220, 0.14, 'triangle', 0.14);
      tone(330, 0.18, 'triangle', 0.1, 0.04);
    },
    turn() {
      tone(392, 0.1, 'triangle', 0.1);
    },
    win() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.3, 'triangle', 0.14, i * 0.09));
    },
    lose() {
      [392, 330, 262, 196].forEach((f, i) => tone(f, 0.34, 'sawtooth', 0.08, i * 0.11));
    },
  };
}
