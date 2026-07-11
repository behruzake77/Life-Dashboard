/**
 * Sound effects using Web Audio API — no audio files needed.
 * All sounds are synthesized programmatically.
 */

let _ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!_ctx) {
    _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (_ctx.state === 'suspended') {
    _ctx.resume();
  }
  return _ctx;
}

function isSoundEnabled(): boolean {
  try {
    const raw = localStorage.getItem('life_os_settings');
    if (!raw) return true;
    const s = JSON.parse(raw);
    return s.soundEffects !== false;
  } catch {
    return true;
  }
}

type Envelope = { attack?: number; decay?: number; sustain?: number; release?: number };

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.3,
  env: Envelope = {}
) {
  const ac = getCtx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();

  const { attack = 0.01, decay = 0.1, sustain = 0.5, release = 0.1 } = env;
  const now = ac.currentTime;

  osc.connect(gain);
  gain.connect(ac.destination);

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, now);

  // ADSR envelope
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + attack);
  gain.gain.linearRampToValueAtTime(volume * sustain, now + attack + decay);
  gain.gain.setValueAtTime(volume * sustain, now + duration - release);
  gain.gain.linearRampToValueAtTime(0, now + duration);

  osc.start(now);
  osc.stop(now + duration);
}

function playNote(frequency: number, startOffset: number, duration: number, volume = 0.25) {
  const ac = getCtx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);

  const now = ac.currentTime + startOffset;
  osc.type = 'sine';
  osc.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc.start(now);
  osc.stop(now + duration + 0.05);
}

export type SoundType = 'click' | 'success' | 'error' | 'complete' | 'tick' | 'levelUp' | 'habitDone';

export function playSound(type: SoundType): void {
  if (!isSoundEnabled()) return;
  try {
    switch (type) {
      case 'click': {
        // Soft mechanical click
        playTone(800, 0.06, 'square', 0.08, { attack: 0.002, decay: 0.02, sustain: 0.1, release: 0.03 });
        break;
      }
      case 'success': {
        // Two ascending notes — pleasant reward
        playNote(523.25, 0, 0.15, 0.22);   // C5
        playNote(783.99, 0.12, 0.25, 0.2); // G5
        break;
      }
      case 'error': {
        // Descending tone — gentle error
        const ac = getCtx();
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.connect(gain);
        gain.connect(ac.destination);
        const now = ac.currentTime;
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(150, now + 0.3);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.35);
        break;
      }
      case 'complete': {
        // Triumphant 4-note ascending chime (Pomodoro done)
        playNote(523.25, 0,    0.18, 0.25); // C5
        playNote(659.25, 0.14, 0.18, 0.22); // E5
        playNote(783.99, 0.28, 0.18, 0.22); // G5
        playNote(1046.5, 0.42, 0.4,  0.28); // C6
        break;
      }
      case 'tick': {
        // Metronome tick for last seconds of pomodoro
        playTone(1200, 0.04, 'square', 0.06, { attack: 0.002, decay: 0.01, sustain: 0.05, release: 0.01 });
        break;
      }
      case 'levelUp': {
        // Ascending arpeggio — level up / achievement
        const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
        notes.forEach((freq, i) => playNote(freq, i * 0.1, 0.25, 0.2));
        break;
      }
      case 'habitDone': {
        // Soft pop + chime
        playTone(440, 0.04, 'sine', 0.15, { attack: 0.005, decay: 0.02, sustain: 0.3, release: 0.05 });
        playNote(880, 0.04, 0.2, 0.15);
        break;
      }
    }
  } catch {
    // Audio not available or blocked — fail silently
  }
}
