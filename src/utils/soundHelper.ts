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
 * Plays an authentic football stadium goal sound:
 * 1. Hakem düdüğü (Referee whistle - çift patlama trrr-trrrt!)
 * 2. Stadyum kornası ve sevinç akorları (Stadium horns)
 * 3. Gerçek coşkulu "Goooooooooool!" spiker anonsu (Web SpeechSynthesis)
 */
export function playGoalChime(): void {
  if (!isSoundEnabled()) return;

  // 1. Spiker Coşkulu "Goooool!" Sesi
  try {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance('Gooooooooool! Gooooooooool!');
      utter.lang = 'tr-TR';
      utter.rate = 1.15;
      utter.pitch = 1.35;
      utter.volume = 1.0;
      window.speechSynthesis.speak(utter);
    }
  } catch {}

  // 2. Hakem Düdüğü & Stadyum Kornası (Web Audio API - %100 Çevrimdışı ve Güvenilir)
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Gerçek hakem düdüğü simülasyonu (3000Hz + 28Hz titreşim)
    const playWhistleBurst = (startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const mod = ctx.createOscillator();
      const modGain = ctx.createGain();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(3100, startTime);

      mod.type = 'triangle';
      mod.frequency.setValueAtTime(28, startTime);
      modGain.gain.setValueAtTime(140, startTime);

      mod.connect(osc.frequency);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.35, startTime + 0.02);
      gain.gain.setValueAtTime(0.35, startTime + duration - 0.03);
      gain.gain.linearRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      mod.start(startTime);
      osc.start(startTime);
      mod.stop(startTime + duration);
      osc.stop(startTime + duration);
    };

    // Düdük 1 (Kısa) ve Düdük 2 (Uzun gol düdüğü)
    playWhistleBurst(now, 0.16);
    playWhistleBurst(now + 0.22, 0.42);

    // Stadyum kutlama akorları
    const fanfareNotes = [523.25, 659.25, 783.99, 1046.50];
    fanfareNotes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + 0.35 + idx * 0.12);

      gain.gain.setValueAtTime(0, now + 0.35 + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.35 + idx * 0.12 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35 + idx * 0.12 + 0.7);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + 0.35 + idx * 0.12);
      osc.stop(now + 0.35 + idx * 0.12 + 0.75);
    });
  } catch {}
}

