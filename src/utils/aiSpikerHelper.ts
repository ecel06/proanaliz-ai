// src/utils/aiSpikerHelper.ts
// 🎙️ ProAnaliz AI Türkçe Canlı Maç Spikeri (Web Speech API)
// Sıfır harici bağımlılık, sıfır gecikme ve kesintisiz Türkçe seslendirme motoru.

class AISpikerManager {
  private isEnabled: boolean = false;
  private lastSpokenText: string = '';
  private lastSpokenAt: number = 0;
  private isSpeaking: boolean = false;

  constructor() {
    try {
      this.isEnabled = localStorage.getItem('proanaliz_ai_spiker') === 'true';
    } catch {
      this.isEnabled = false;
    }
  }

  public getStatus(): boolean {
    return this.isEnabled;
  }

  public toggle(): boolean {
    this.isEnabled = !this.isEnabled;
    try {
      localStorage.setItem('proanaliz_ai_spiker', this.isEnabled ? 'true' : 'false');
    } catch {}

    if (!this.isEnabled) {
      this.cancel();
    } else {
      this.speak('Yapay zeka canlı maç spikeri devrede. Maç anlatımı başladı.');
    }
    return this.isEnabled;
  }

  public cancel(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
  }

  public speak(text: string, force: boolean = false): void {
    if (!this.isEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    const now = Date.now();
    // 3 saniye içinde aynı veya çok yakın cümleyi tekrar okumayı engelle
    if (!force && this.lastSpokenText === text && now - this.lastSpokenAt < 8000) {
      return;
    }
    if (!force && now - this.lastSpokenAt < 3000) {
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Önceki uzun kuyruğu temizle, taze tut

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'tr-TR';
      utterance.rate = 1.08; // Maç heyecanı için hafif tempolu
      utterance.pitch = 1.02;

      // Türkçe ses seçimi yap
      const voices = window.speechSynthesis.getVoices();
      const trVoice = voices.find(v => v.lang.startsWith('tr') || v.lang.includes('TR'));
      if (trVoice) {
        utterance.voice = trVoice;
      }

      utterance.onstart = () => {
        this.isSpeaking = true;
      };
      utterance.onend = () => {
        this.isSpeaking = false;
      };
      utterance.onerror = () => {
        this.isSpeaking = false;
      };

      this.lastSpokenText = text;
      this.lastSpokenAt = now;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('[AISpiker] Seslendirme hatası:', err);
    }
  }

  public announcePhase(phase: string, homeTeam: string, awayTeam: string, isFinished: boolean, score: { home: number; away: number }): void {
    if (isFinished) {
      this.speak(`Hakem son düdüğü çaldı ve maç sona erdi! Maç sonucu: ${homeTeam} ${score.home}, ${awayTeam} ${score.away}.`, true);
      return;
    }

    switch (phase) {
      case 'danger':
        this.speak(`${homeTeam} ceza sahasına sokuluyor, çok tehlikeli an!`);
        break;
      case 'home_attack':
        this.speak(`${homeTeam} organize hücumla ileri çıkıyor.`);
        break;
      case 'away_attack':
        this.speak(`${awayTeam} savunma arkasına sarkmaya çalışıyor.`);
        break;
      case 'corner':
        this.speak(`Köşe vuruşu kazanıldı, ceza alanında hareketlilik var.`);
        break;
      case 'goal':
        this.speak(`Goooooool! Top ağlarda! Gol geldi!`, true);
        break;
      default:
        break;
    }
  }
}

export const aiSpiker = new AISpikerManager();
