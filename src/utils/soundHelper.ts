// src/utils/soundHelper.ts
// Synthesizes pleasant soccer goal sound effects using the standard Web Audio API.
// 100% offline, zero external file dependencies, cannot fail due to network/CORS.

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const saved = localStorage.getItem('proanaliz_sound_enabled');
    return saved !== 'false';
  } catch {
    return true;
  }
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('proanaliz_sound_enabled', enabled ? 'true' : 'false');
  } catch {}
}

/**
 * Plays the authentic, crisp, professional Nesine.com & İddaa electronic goal chime:
 * Clean, crystal-clear, modern double-tone chime (ti-ling! / dı-dın!)
 * Zero harsh whistles, zero robot voices. 100% pleasant sports app notification sound.
 */
export function playGoalChime(): void {
  if (!isSoundEnabled()) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Nesine.com / İddaa Iconic Double Chime Frequencies
    // Tone 1: 932.33 Hz (A#5) - Crisp, prompt intro bell
    // Tone 2: 1396.91 Hz (F6) - Bright, ringing, triumphant resolution
    const playBellTone = (freq: number, startTime: number, duration: number, peakGain: number) => {
      // Primary sine oscillator (crystal clear body)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Subtle harmonic overtone for warm metallic chime depth (Nesine app chime feel)
      const harmonicOsc = ctx.createOscillator();
      const harmonicGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      harmonicOsc.type = 'sine';
      harmonicOsc.frequency.setValueAtTime(freq * 2.02, startTime); // Slight chorus detune

      // Super fast attack (4ms) to make it snap, then smooth bell curve
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      harmonicGain.gain.setValueAtTime(0, startTime);
      harmonicGain.gain.linearRampToValueAtTime(peakGain * 0.35, startTime + 0.006);
      harmonicGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      harmonicOsc.connect(harmonicGain);
      harmonicGain.connect(ctx.destination);

      osc.start(startTime);
      harmonicOsc.start(startTime);

      osc.stop(startTime + duration + 0.05);
      harmonicOsc.stop(startTime + duration + 0.05);
    };

    // First bell: short & snappy
    playBellTone(932.33, now, 0.16, 0.35);

    // Second bell: higher pitch, longer resonant sustain
    playBellTone(1396.91, now + 0.11, 0.65, 0.45);
  } catch {
    // Graceful fallback
  }
}

