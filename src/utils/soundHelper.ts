// src/utils/soundHelper.ts
// Authentic Soccer Goal Celebration Sound Engine:
// 1. Primary: Real, passionate match announcer "Ve top ağlarda GOOOL!" audio (/sounds/goal.mp3)
// 2. Variants: Ercan Taner "Allah'ım GOOOL!" (/sounds/ercan.mp3), "Kafa ve GOOOL!" (/sounds/kafa.mp3)
// 3. Fallback: Electronic double-tone sports chime (Web Audio API)
// Features preloading, automatic gesture unlocking (iOS/Android compatible), and zero latency.

export type GoalSoundVariant = 'spiker' | 'ercan' | 'kafa';

let audioCtx: AudioContext | null = null;
const audioInstances: Partial<Record<GoalSoundVariant, HTMLAudioElement>> = {};
let isAudioUnlocked = false;

export function getGoalSoundVariant(): GoalSoundVariant {
  if (typeof window === 'undefined') return 'spiker';
  try {
    const saved = localStorage.getItem('proanaliz_goal_sound_variant');
    if (saved === 'ercan' || saved === 'kafa' || saved === 'spiker') {
      return saved;
    }
  } catch {}
  return 'spiker';
}

export function setGoalSoundVariant(variant: GoalSoundVariant): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('proanaliz_goal_sound_variant', variant);
  } catch {}
}

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

function getGoalAudio(variant?: GoalSoundVariant): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  const activeVar = variant || getGoalSoundVariant();
  
  if (!audioInstances[activeVar]) {
    const fileName = activeVar === 'ercan' ? 'ercan.mp3' : activeVar === 'kafa' ? 'kafa.mp3' : 'goal.mp3';
    const origin = window.location?.origin || '';
    const audioUrl = `${origin}/sounds/${fileName}?v=20261112_11`;
    
    const audio = new Audio(audioUrl);
    audio.preload = 'auto';
    audio.volume = 0.98;
    audioInstances[activeVar] = audio;
  }
  return audioInstances[activeVar] || null;
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
      audio.volume = 0;
      const p = audio.play();
      if (p !== undefined) {
        p.then(() => {
          audio.pause();
          audio.currentTime = 0;
          audio.volume = 0.98;
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
 * Plays the authentic, electrifying Turkish commentator "GOOOOLLLL!" celebration voice.
 * If audio file or playback is restricted by browser sandbox, falls back to crisp synth chime.
 */
export function playGoalChime(variant?: GoalSoundVariant): void {
  if (!isSoundEnabled()) return;

  try {
    const audio = getGoalAudio(variant);
    if (audio) {
      audio.currentTime = 0;
      audio.volume = 0.98;
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
