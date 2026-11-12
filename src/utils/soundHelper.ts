// src/utils/soundHelper.ts
// Authentic Soccer Goal Celebration Sound Engine:
// 1. Primary: Real, passionate, iconic Turkish match announcer "GOOOOLLLL!" cheer audio (/sounds/goal.mp3)
// 2. Fallback: Electronic double-tone sports chime (Web Audio API)
// Features preloading, automatic gesture unlocking (iOS/Android compatible), and zero latency.

let audioCtx: AudioContext | null = null;
let goalAudio: HTMLAudioElement | null = null;
let isAudioUnlocked = false;

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

function getGoalAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!goalAudio) {
    // Resolve relative to host origin or base path
    const audioUrl = typeof window !== 'undefined' && window.location?.origin
      ? `${window.location.origin}/sounds/goal.mp3`
      : '/sounds/goal.mp3';
    
    goalAudio = new Audio(audioUrl);
    goalAudio.preload = 'auto';
    goalAudio.volume = 0.95;
  }
  return goalAudio;
}

/**
 * Mobile and modern desktop browsers require a user interaction (tap/click)
 * to allow unmuted audio playback. This unlocks audio seamlessly on first interaction.
 */
export function unlockAudio(): void {
  if (isAudioUnlocked || typeof window === 'undefined') return;

  try {
    const audio = getGoalAudio();
    if (audio) {
      // Play and immediately pause at 0 volume to unlock Audio element
      audio.volume = 0;
      const p = audio.play();
      if (p !== undefined) {
        p.then(() => {
          audio.pause();
          audio.currentTime = 0;
          audio.volume = 0.95;
          isAudioUnlocked = true;
        }).catch(() => {});
      }
    }

    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().then(() => {
        isAudioUnlocked = true;
      }).catch(() => {});
    }
  } catch {}
}

// Auto-register touch/click listeners to unlock audio on first tap
if (typeof window !== 'undefined') {
  const unlockEvents = ['touchstart', 'touchend', 'click', 'keydown'];
  const handleUnlock = () => {
    unlockAudio();
    unlockEvents.forEach(evt => window.removeEventListener(evt, handleUnlock));
  };
  unlockEvents.forEach(evt => window.addEventListener(evt, handleUnlock, { once: true, passive: true }));
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
 * Synthesizes clean electronic double-tone chime fallback via Web Audio API
 */
function playFallbackSynthChime(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const playBellTone = (freq: number, startTime: number, duration: number, peakGain: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const harmonicOsc = ctx.createOscillator();
      const harmonicGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      harmonicOsc.type = 'sine';
      harmonicOsc.frequency.setValueAtTime(freq * 2.02, startTime);

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

    playBellTone(932.33, now, 0.16, 0.35);
    playBellTone(1396.91, now + 0.11, 0.65, 0.45);
  } catch {}
}

/**
 * Plays the authentic, electrifying "GOOOOLLLL!" celebration voice.
 * If audio file or playback is restricted by browser sandbox, falls back to crisp synth chime.
 */
export function playGoalChime(): void {
  if (!isSoundEnabled()) return;

  try {
    const audio = getGoalAudio();
    if (audio) {
      audio.currentTime = 0;
      audio.volume = 0.95;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('[Sound] MP3 play blocked or network error, falling back to Web Audio synth:', err);
          playFallbackSynthChime();
        });
        return;
      }
    }
  } catch (e) {
    console.warn('[Sound] Error triggering audio element, falling back:', e);
  }

  // Fallback to Web Audio oscillator if Audio element fails or is unsupported
  playFallbackSynthChime();
}
