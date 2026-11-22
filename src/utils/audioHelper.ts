// src/utils/audioHelper.ts
// Synthesizes natural sports sounds (Referee whistle, Goal chime) using Web Audio API
// Zero external assets or network dependencies, 100% reliable across all browsers.

class SoundManager {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  constructor() {
    try {
      const saved = localStorage.getItem('proanaliz_sound_enabled');
      if (saved !== null) {
        this.soundEnabled = saved === 'true';
      }
    } catch {
      this.soundEnabled = true;
    }
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public setEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    try {
      localStorage.setItem('proanaliz_sound_enabled', String(enabled));
    } catch {
      // ignore
    }
  }

  public toggle(): boolean {
    this.setEnabled(!this.soundEnabled);
    return this.soundEnabled;
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Hakem düdüğü sesi (Hakem çift düdük: Fiiit - Fiiiit)
   */
  public playRefereeWhistle(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const playBurst = (startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Hakem düdüğü frekansı ~2600Hz ile 2800Hz arası
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(2600, startTime);
      osc.frequency.linearRampToValueAtTime(2850, startTime + duration * 0.5);
      osc.frequency.linearRampToValueAtTime(2550, startTime + duration);

      // Titreşim (Trill) efekti
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 28; // 28Hz hızlı dalgalanma (düdük içindeki bilye sesi)
      lfoGain.gain.value = 180;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(startTime);
      lfo.stop(startTime + duration);

      // Zarf (Envelope)
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
      gain.gain.setValueAtTime(0.25, startTime + duration - 0.03);
      gain.gain.linearRampToValueAtTime(0, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    // 1. Düdük
    playBurst(now, 0.16);
    // 2. Düdük (Biraz daha uzun ve belirgin)
    playBurst(now + 0.22, 0.32);
  }

  /**
   * Gol Bildirim Zili (Coşkulu yükselen melodi)
   */
  public playGoalCelebration(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (Majör Akor)
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      const startTime = now + idx * 0.09;
      const duration = 0.35;

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });

    // 0.4s sonra hakem düdüğü
    setTimeout(() => {
      this.playRefereeWhistle();
    }, 400);
  }
}

export const soundManager = new SoundManager();
