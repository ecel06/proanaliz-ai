// src/utils/matchTimelineHelper.ts
// ⏱️ Canlı Maç Olayları ve Zaman Tüneli (Timeline) Oluşturucu

export interface MatchTimelineEvent {
  minute: string;
  type: 'goal' | 'card_yellow' | 'card_red' | 'corner' | 'sub' | 'whistle' | 'var' | 'danger';
  team: 'home' | 'away' | 'system';
  title: string;
  detail: string;
}

export function generateMatchTimeline(
  homeName: string,
  awayName: string,
  homeScore: number,
  awayScore: number,
  isFinished: boolean,
  matchId: string
): MatchTimelineEvent[] {
  // Tutarlı deterministik hash
  let seed = 0;
  for (let i = 0; i < matchId.length; i++) {
    seed = (seed * 31 + matchId.charCodeAt(i)) >>> 0;
  }

  const events: MatchTimelineEvent[] = [
    {
      minute: "1'",
      type: 'whistle',
      team: 'system',
      title: 'Maç Başladı',
      detail: `İlk düdük çaldı. ${homeName} ve ${awayName} sahada.`
    }
  ];

  // 1. Ev Sahibi Golleri
  for (let g = 0; g < homeScore; g++) {
    const min = 15 + ((seed + g * 37) % 65);
    events.push({
      minute: `${min}'`,
      type: 'goal',
      team: 'home',
      title: `⚽ GOL! ${homeName}`,
      detail: `${homeName} baskılı hücumun ardından golü buldu!`
    });
  }

  // 2. Deplasman Golleri
  for (let g = 0; g < awayScore; g++) {
    const min = 20 + ((seed + (g + 3) * 43) % 65);
    events.push({
      minute: `${min}'`,
      type: 'goal',
      team: 'away',
      title: `⚽ GOL! ${awayName}`,
      detail: `${awayName} kontra atakta topu ağlara gönderdi!`
    });
  }

  // 3. Sarı Kartlar & Kornerler
  events.push({
    minute: `${22 + (seed % 15)}'`,
    type: 'corner',
    team: 'home',
    title: '🚩 Köşe Vuruşu',
    detail: `${homeName} sağ kanattan korner kullandı.`
  });

  events.push({
    minute: `${35 + (seed % 9)}'`,
    type: 'card_yellow',
    team: 'away',
    title: '🟨 Sarı Kart',
    detail: `${awayName} oyuncusu taktik faul nedeniyle kart gördü.`
  });

  events.push({
    minute: '45+2\'',
    type: 'whistle',
    team: 'system',
    title: 'İlk Yarı Sona Erdi',
    detail: 'Takımlar soyunma odasına gidiyor.'
  });

  events.push({
    minute: `${55 + (seed % 10)}'`,
    type: 'danger',
    team: 'home',
    title: '⚡ Tehlikeli Pozisyon',
    detail: 'Ceza sahası dışından sert şut az farkla auta çıktı.'
  });

  events.push({
    minute: `${68 + (seed % 10)}'`,
    type: 'sub',
    team: 'away',
    title: '🔁 Oyuncu Değişikliği',
    detail: `${awayName} taktiksel hamleyle hücuma taze kan soktu.`
  });

  if (isFinished) {
    events.push({
      minute: '90+4\'',
      type: 'whistle',
      team: 'system',
      title: '🏁 Maç Sona Erdi (MS)',
      detail: `Karşılaşma tamamlandı: ${homeName} ${homeScore} - ${awayScore} ${awayName}.`
    });
  }

  // Dakikaya göre sırala
  const parseMin = (m: string) => {
    const num = parseInt(m.replace(/\D/g, ''), 10);
    return isNaN(num) ? 999 : num;
  };

  return events.sort((a, b) => parseMin(a.minute) - parseMin(b.minute));
}
