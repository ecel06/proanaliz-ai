// src/utils/commentaryEngine.ts
// 🎙️ Coşkulu Profesyonel Türkçe Maç Spikeri & Canlı Stadyum Atmosferi Motoru
// Ercan Taner & Yalçın Çetin ekolü yüksek heyecanlı, dinamik tonlamalı maç anlatımı.
import { soundManager } from './audioHelper';

export type SpikerMode = 'excited' | 'stadium_only' | 'off';

class CommentaryEngine {
  private mode: SpikerMode = 'excited';
  private lastSpokenText: string = '';
  private lastSpokenAt: number = 0;
  private isSpeaking: boolean = false;
  private selectedVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    try {
      const saved = localStorage.getItem('proanaliz_spiker_mode') as SpikerMode;
      if (saved && ['excited', 'stadium_only', 'off'].includes(saved)) {
        this.mode = saved;
      }
    } catch {
      this.mode = 'excited';
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoices();
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  private initVoices(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    // 1. En doğal Neural / Natural sesleri önceliklendir (Microsoft Ahmet Natural, Google Türkçe, Emel Natural)
    const bestTrVoice =
      voices.find(v => (v.lang.startsWith('tr') || v.lang.includes('TR')) && (v.name.includes('Natural') || v.name.includes('Online') || v.name.includes('Google'))) ||
      voices.find(v => (v.lang.startsWith('tr') || v.lang.includes('TR')) && !v.name.includes('Desktop')) ||
      voices.find(v => v.lang.startsWith('tr') || v.lang.includes('TR'));

    if (bestTrVoice) {
      this.selectedVoice = bestTrVoice;
    }
  }

  public getMode(): SpikerMode {
    return this.mode;
  }

  public setMode(mode: SpikerMode): void {
    this.mode = mode;
    try {
      localStorage.setItem('proanaliz_spiker_mode', mode);
    } catch {}

    if (mode === 'off') {
      this.cancel();
    } else if (mode === 'excited') {
      this.speakPhrase('Mikrofondayız! Coşkulu canlı maç anlatımı başladı, iyi seyirler!', 1.1, 1.1, true);
    } else if (mode === 'stadium_only') {
      this.cancel();
      soundManager.playRefereeWhistle();
    }
  }

  public cycleNextMode(): SpikerMode {
    const next: SpikerMode =
      this.mode === 'excited' ? 'stadium_only' : this.mode === 'stadium_only' ? 'off' : 'excited';
    this.setMode(next);
    return next;
  }

  public cancel(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
  }

  public speakPhrase(text: string, rate = 1.15, pitch = 1.15, force = false): void {
    if (this.mode !== 'excited' || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    const now = Date.now();
    if (!force && this.lastSpokenText === text && now - this.lastSpokenAt < 10000) return;
    if (!force && now - this.lastSpokenAt < 3200) return;

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'tr-TR';
      utterance.rate = rate; // Heyecanlı hızlı akış
      utterance.pitch = pitch; // Enerjik yükselen perde

      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }

      utterance.onstart = () => { this.isSpeaking = true; };
      utterance.onend = () => { this.isSpeaking = false; };
      utterance.onerror = () => { this.isSpeaking = false; };

      this.lastSpokenText = text;
      this.lastSpokenAt = now;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('[CommentaryEngine] Hata:', err);
    }
  }

  /**
   * Maç atak durumuna göre canlı ve coşkulu spiker replikleri üretir
   */
  public handleMatchEvent(
    phase: 'home_attack' | 'away_attack' | 'midfield' | 'corner' | 'danger',
    homeTeam: string,
    awayTeam: string,
    isFinished: boolean,
    score: { home: number; away: number }
  ): void {
    if (isFinished) {
      soundManager.playRefereeWhistle();
      if (this.mode === 'excited') {
        this.speakPhrase(
          `Ve karşılaşmada son düdük çaldı! Maç sona erdi! Karşılaşma sonucu: ${homeTeam} ${score.home}, ${awayTeam} ${score.away}!`,
          1.12,
          1.15,
          true
        );
      }
      return;
    }

    if (this.mode === 'stadium_only') {
      if (phase === 'danger') soundManager.playRefereeWhistle();
      return;
    }

    if (this.mode !== 'excited') return;

    const dangerPhrases = [
      `${homeTeam} ceza sahasına sokuluyor... Çok tehlikeli an! Vuruş şansı!`,
      `Ceza sahası içi karıştı! Kaleciyle karşı karşıya... Savunma son anda araya girdi!`,
      `Müthiş bir organizasyon! Sert şut... Kaleci son anda çıkardı!`,
      `Savunma arkasına tehlikeli pas! Gözler hakemde, atak devam ediyor!`
    ];

    const homeAttackPhrases = [
      `${homeTeam} sağ kanattan müthiş bir hızla bindiriyor!`,
      `${homeTeam} rakip yarı alanda presi artırdı, paslaşarak geliyorlar.`,
      `Kritik bölgeye doğru pas... ${homeTeam} etkili hücum hazırlığında!`
    ];

    const awayAttackPhrases = [
      `${awayTeam} kontra atağa çıkıyor! Sayıca üstün geldiler!`,
      `${awayTeam} tehlikeli bölgede boşluk arıyor, savunma dikkatli!`,
      `Hızlı hücum fırsatı... ${awayTeam} etkili gelmeye çalışıyor!`
    ];

    const cornerPhrases = [
      `Köşe vuruşu! Tüm kuleler ceza sahasında, nefesler tutuldu!`,
      `Korner kararı! Ceza alanı ana baba günü, orta geldi... Savunma uzaklaştırdı!`
    ];

    const midfieldPhrases = [
      `Orta sahada kıyasıya bir mücadele var, top bir o kalede bir bu kalede.`,
      `Tempo çok yüksek! İki takım da hata yapmamak için dikkatli paslaşıyor.`
    ];

    let chosenText = '';
    let rate = 1.15;
    let pitch = 1.15;

    switch (phase) {
      case 'danger':
        chosenText = dangerPhrases[Math.floor(Math.random() * dangerPhrases.length)];
        rate = 1.22;
        pitch = 1.25;
        soundManager.playRefereeWhistle();
        break;
      case 'home_attack':
        chosenText = homeAttackPhrases[Math.floor(Math.random() * homeAttackPhrases.length)];
        rate = 1.15;
        pitch = 1.12;
        break;
      case 'away_attack':
        chosenText = awayAttackPhrases[Math.floor(Math.random() * awayAttackPhrases.length)];
        rate = 1.15;
        pitch = 1.12;
        break;
      case 'corner':
        chosenText = cornerPhrases[Math.floor(Math.random() * cornerPhrases.length)];
        rate = 1.18;
        pitch = 1.18;
        break;
      case 'midfield':
        chosenText = midfieldPhrases[Math.floor(Math.random() * midfieldPhrases.length)];
        rate = 1.08;
        pitch = 1.05;
        break;
    }

    if (chosenText) {
      this.speakPhrase(chosenText, rate, pitch);
    }
  }
}

export const commentaryEngine = new CommentaryEngine();
