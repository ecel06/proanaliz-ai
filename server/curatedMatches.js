

export const CURATED_MATCHES = [
  // =========================================================================
  // 1. TÜRKİYE SÜPER LİG (11. Hafta - 6, 7 ve 8 Kasım 2026)
  // =========================================================================

  // Gaziantep FK - Kasımpaşa (6 Kasım Cuma, 20:00)
  {
    id: 'sl-11-gzt-kas',
    status: 'upcoming',
    league: 'Trendyol Süper Lig',
    leagueCategory: 'super-lig',
    round: '11. Hafta',
    date: '6 Kasım Cuma',
    time: '20:00',
    stadium: 'Kalyon Stadyumu, Gaziantep',
    referee: 'Kadir Sağlam',
    homeTeam: {
      id: 'gzt',
      name: 'Gaziantep FK',
      shortName: 'GFK',
      rank: 16,
      form: ['L', 'W', 'D', 'L', 'L'], // M, G, B, M, M (Son maç TS'ye 2-0 mağlubiyet)
      avgGoalsScored: 1.1,
      avgGoalsConceded: 1.6,
      firstHalfGoalRate: 0.40,
      firstHalfLeadingRate: 0.28,
      avgCorners: 4.7,
      avgCards: 2.7,
      shotsOnTargetAvg: 4.1,
      cleanSheetRate: 0.20,
      primaryColor: '#DC2626'
    },
    awayTeam: {
      id: 'kas',
      name: 'Kasımpaşa',
      shortName: 'KAS',
      rank: 8,
      form: ['D', 'W', 'L', 'W', 'D'], // B, G, M, G, B (Son maç BJK ile 2-2)
      avgGoalsScored: 1.6,
      avgGoalsConceded: 1.4,
      firstHalfGoalRate: 0.50,
      firstHalfLeadingRate: 0.38,
      avgCorners: 5.2,
      avgCards: 2.5,
      shotsOnTargetAvg: 5.0,
      cleanSheetRate: 0.28,
      primaryColor: '#1E3A8A'
    }
  },

  // Eyüpspor - Antalyaspor (7 Kasım Cumartesi, 13:30)
  {
    id: 'sl-11-eyp-ant',
    status: 'upcoming',
    league: 'Trendyol Süper Lig',
    leagueCategory: 'super-lig',
    round: '11. Hafta',
    date: '7 Kasım Cumartesi',
    time: '13:30',
    stadium: 'Recep Tayyip Erdoğan Stadyumu, İstanbul',
    referee: 'Sarper Barış Saka',
    homeTeam: {
      id: 'eyup',
      name: 'Eyüpspor',
      shortName: 'EYP',
      rank: 12,
      form: ['W', 'L', 'D', 'W', 'W'],
      avgGoalsScored: 1.3,
      avgGoalsConceded: 1.4,
      firstHalfGoalRate: 0.45,
      firstHalfLeadingRate: 0.35,
      avgCorners: 5.0,
      avgCards: 2.4,
      shotsOnTargetAvg: 4.6,
      cleanSheetRate: 0.25,
      primaryColor: '#EAB308'
    },
    awayTeam: {
      id: 'ant',
      name: 'Antalyaspor',
      shortName: 'ANT',
      rank: 14,
      form: ['L', 'D', 'W', 'L', 'L'],
      avgGoalsScored: 1.1,
      avgGoalsConceded: 1.6,
      firstHalfGoalRate: 0.38,
      firstHalfLeadingRate: 0.28,
      avgCorners: 4.6,
      avgCards: 2.5,
      shotsOnTargetAvg: 4.0,
      cleanSheetRate: 0.22,
      primaryColor: '#EF4444'
    }
  },

  // Samsunspor - Konyaspor (7 Kasım Cumartesi, 16:00)
  {
    id: 'sl-11-sam-kon',
    status: 'upcoming',
    league: 'Trendyol Süper Lig',
    leagueCategory: 'super-lig',
    round: '11. Hafta',
    date: '7 Kasım Cumartesi',
    time: '16:00',
    stadium: 'Samsun 19 Mayıs Stadyumu',
    referee: 'Ali Şansalan',
    homeTeam: {
      id: 'sam',
      name: 'Samsunspor',
      shortName: 'SAM',
      rank: 10,
      form: ['W', 'D', 'W', 'L', 'L'], // G, B, G, M, M (Son maç 5-2 mağlubiyet)
      avgGoalsScored: 1.4,
      avgGoalsConceded: 1.5,
      firstHalfGoalRate: 0.45,
      firstHalfLeadingRate: 0.35,
      avgCorners: 5.2,
      avgCards: 2.3,
      shotsOnTargetAvg: 4.8,
      cleanSheetRate: 0.28,
      primaryColor: '#EF4444'
    },
    awayTeam: {
      id: 'kon',
      name: 'Konyaspor',
      shortName: 'KON',
      rank: 13,
      form: ['L', 'W', 'D', 'L', 'L'], // M, G, B, M, M (Son maç GS karşısında 4-0 mağlubiyet)
      avgGoalsScored: 1.1,
      avgGoalsConceded: 1.7,
      firstHalfGoalRate: 0.40,
      firstHalfLeadingRate: 0.28,
      avgCorners: 4.4,
      avgCards: 2.6,
      shotsOnTargetAvg: 3.9,
      cleanSheetRate: 0.20,
      primaryColor: '#15803D'
    }
  },

  // Göztepe - İstanbul Başakşehir (7 Kasım Cumartesi, 19:00)
  {
    id: 'sl-11-goz-ibf',
    status: 'upcoming',
    league: 'Trendyol Süper Lig',
    leagueCategory: 'super-lig',
    round: '11. Hafta',
    date: '7 Kasım Cumartesi',
    time: '19:00',
    stadium: 'Gürsel Aksel Stadyumu, İzmir',
    referee: 'Cihan Aydın',
    homeTeam: {
      id: 'goz',
      name: 'Göztepe',
      shortName: 'GÖZ',
      rank: 6,
      form: ['D', 'L', 'W', 'D', 'W'], // B, M, G, B, G (10. haftada FB'yi 2-1 yendi)
      avgGoalsScored: 1.6,
      avgGoalsConceded: 1.2,
      firstHalfGoalRate: 0.55,
      firstHalfLeadingRate: 0.42,
      avgCorners: 5.6,
      avgCards: 2.4,
      shotsOnTargetAvg: 5.2,
      cleanSheetRate: 0.32,
      primaryColor: '#EAB308'
    },
    awayTeam: {
      id: 'ibfk',
      name: 'İstanbul Başakşehir',
      shortName: 'İBFK',
      rank: 8,
      form: ['W', 'L', 'D', 'L', 'W'], // G, M, B, M, G (10. haftada Samsun'u 5-2 yendi)
      avgGoalsScored: 1.8,
      avgGoalsConceded: 1.4,
      firstHalfGoalRate: 0.60,
      firstHalfLeadingRate: 0.44,
      avgCorners: 5.3,
      avgCards: 2.3,
      shotsOnTargetAvg: 5.4,
      cleanSheetRate: 0.30,
      primaryColor: '#F97316'
    }
  },

  // Galatasaray - Kayserispor (7 Kasım Cumartesi, 19:00)
  {
    id: 'sl-11-gs-kay',
    status: 'upcoming',
    league: 'Trendyol Süper Lig',
    leagueCategory: 'super-lig',
    round: '11. Hafta',
    date: '7 Kasım Cumartesi',
    time: '19:00',
    stadium: 'RAMS Park, İstanbul',
    referee: 'Halil Umut Meler',
    homeTeam: {
      id: 'gs',
      name: 'Galatasaray',
      shortName: 'GS',
      rank: 1,
      form: ['W', 'D', 'W', 'W', 'W'], // G, B, G, G, G
      avgGoalsScored: 2.7,
      avgGoalsConceded: 0.8,
      firstHalfGoalRate: 0.75,
      firstHalfLeadingRate: 0.65,
      avgCorners: 7.0,
      avgCards: 1.8,
      shotsOnTargetAvg: 7.5,
      cleanSheetRate: 0.50,
      primaryColor: '#F59E0B'
    },
    awayTeam: {
      id: 'kay',
      name: 'Kayserispor',
      shortName: 'KAY',
      rank: 17,
      form: ['L', 'D', 'L', 'L', 'D'], // M, B, M, M, B
      avgGoalsScored: 0.9,
      avgGoalsConceded: 1.8,
      firstHalfGoalRate: 0.35,
      firstHalfLeadingRate: 0.20,
      avgCorners: 4.2,
      avgCards: 2.8,
      shotsOnTargetAvg: 3.5,
      cleanSheetRate: 0.18,
      primaryColor: '#EF4444'
    }
  },

  // Çaykur Rizespor - Bodrum FK (8 Kasım Pazar, 13:30)
  {
    id: 'sl-11-riz-bod',
    status: 'upcoming',
    league: 'Trendyol Süper Lig',
    leagueCategory: 'super-lig',
    round: '11. Hafta',
    date: '8 Kasım Pazar',
    time: '13:30',
    stadium: 'Çaykur Didi Stadyumu, Rize',
    referee: 'Zorbay Küçük',
    homeTeam: {
      id: 'rize',
      name: 'Çaykur Rizespor',
      shortName: 'RİZ',
      rank: 15,
      form: ['L', 'L', 'W', 'L', 'D'], // M, M, G, M, B (Son maç 0-0)
      avgGoalsScored: 1.0,
      avgGoalsConceded: 1.5,
      firstHalfGoalRate: 0.35,
      firstHalfLeadingRate: 0.25,
      avgCorners: 4.5,
      avgCards: 2.6,
      shotsOnTargetAvg: 3.8,
      cleanSheetRate: 0.22,
      primaryColor: '#16A34A'
    },
    awayTeam: {
      id: 'bodrum',
      name: 'Bodrum FK',
      shortName: 'BOD',
      rank: 13,
      form: ['L', 'W', 'D', 'L', 'L'],
      avgGoalsScored: 1.05,
      avgGoalsConceded: 1.40,
      firstHalfGoalRate: 0.32,
      firstHalfLeadingRate: 0.22,
      avgCorners: 4.3,
      avgCards: 2.7,
      shotsOnTargetAvg: 3.6,
      cleanSheetRate: 0.20,
      primaryColor: '#10B981'
    }
  },

  // Netglobal Sivasspor - Fenerbahçe (8 Kasım Pazar, 16:00)
  {
    id: 'sl-11-siv-fb',
    status: 'upcoming',
    league: 'Trendyol Süper Lig',
    leagueCategory: 'super-lig',
    round: '11. Hafta',
    date: '8 Kasım Pazar',
    time: '16:00',
    stadium: 'BG Grup 4 Eylül Stadyumu, Sivas',
    referee: 'Volkan Bayarslan',
    homeTeam: {
      id: 'sivas',
      name: 'Netglobal Sivasspor',
      shortName: 'SİV',
      rank: 6,
      form: ['L', 'W', 'L', 'W', 'W'],
      avgGoalsScored: 1.6,
      avgGoalsConceded: 1.3,
      firstHalfGoalRate: 0.48,
      firstHalfLeadingRate: 0.38,
      avgCorners: 5.1,
      avgCards: 2.5,
      shotsOnTargetAvg: 4.8,
      cleanSheetRate: 0.30,
      primaryColor: '#DC2626'
    },
    awayTeam: {
      id: 'fb',
      name: 'Fenerbahçe',
      shortName: 'FB',
      rank: 3,
      form: ['W', 'W', 'D', 'W', 'L'], // G, G, B, G, M (10. haftada Göztepe'ye 2-1 yenildi)
      avgGoalsScored: 2.3,
      avgGoalsConceded: 1.0,
      firstHalfGoalRate: 0.65,
      firstHalfLeadingRate: 0.55,
      avgCorners: 6.8,
      avgCards: 2.2,
      shotsOnTargetAvg: 6.9,
      cleanSheetRate: 0.45,
      primaryColor: '#3B82F6'
    }
  },

  // Alanyaspor - Trabzonspor (8 Kasım Pazar, 18:30)
  {
    id: 'sl-11-aln-ts',
    status: 'upcoming',
    league: 'Trendyol Süper Lig',
    leagueCategory: 'super-lig',
    round: '11. Hafta',
    date: '8 Kasım Pazar',
    time: '18:30',
    stadium: 'Gain Park Stadyumu, Alanya',
    referee: 'Mehmet Türkmen',
    homeTeam: {
      id: 'aln',
      name: 'Alanyaspor',
      shortName: 'ALN',
      rank: 14,
      form: ['D', 'L', 'W', 'L', 'L'], // B, M, G, M, M (10. haftada 5-0 yenildi)
      avgGoalsScored: 1.1,
      avgGoalsConceded: 1.8,
      firstHalfGoalRate: 0.40,
      firstHalfLeadingRate: 0.25,
      avgCorners: 4.5,
      avgCards: 2.7,
      shotsOnTargetAvg: 3.9,
      cleanSheetRate: 0.20,
      primaryColor: '#F97316'
    },
    awayTeam: {
      id: 'ts',
      name: 'Trabzonspor',
      shortName: 'TS',
      rank: 5,
      form: ['D', 'D', 'L', 'W', 'W'], // B, B, M, G, G (10. haftada Gaziantep'i 2-0 yendi)
      avgGoalsScored: 1.6,
      avgGoalsConceded: 1.0,
      firstHalfGoalRate: 0.55,
      firstHalfLeadingRate: 0.42,
      avgCorners: 5.5,
      avgCards: 2.5,
      shotsOnTargetAvg: 5.1,
      cleanSheetRate: 0.35,
      primaryColor: '#9333EA'
    }
  },

  // Beşiktaş - Kasımpaşa (8 Kasım Pazar, 20:00)
  {
    id: 'sl-11-bjk-kas',
    status: 'upcoming',
    league: 'Trendyol Süper Lig',
    leagueCategory: 'super-lig',
    round: '11. Hafta',
    date: '8 Kasım Pazar',
    time: '20:00',
    stadium: 'Tüpraş Stadyumu, Beşiktaş / İstanbul',
    referee: 'Ali Şansalan',
    homeTeam: {
      id: 'bjk',
      name: 'Beşiktaş',
      shortName: 'BJK',
      rank: 4,
      form: ['W', 'D', 'W', 'L', 'L'],
      avgGoalsScored: 1.9,
      avgGoalsConceded: 1.0,
      firstHalfGoalRate: 0.60,
      firstHalfLeadingRate: 0.48,
      avgCorners: 6.2,
      avgCards: 2.3,
      shotsOnTargetAvg: 6.2,
      cleanSheetRate: 0.40,
      primaryColor: '#FFFFFF'
    },
    awayTeam: {
      id: 'kas',
      name: 'Kasımpaşa',
      shortName: 'KAS',
      rank: 8,
      form: ['D', 'D', 'L', 'W', 'L'],
      avgGoalsScored: 1.45,
      avgGoalsConceded: 1.7,
      firstHalfGoalRate: 0.45,
      firstHalfLeadingRate: 0.30,
      avgCorners: 5.0,
      avgCards: 2.5,
      shotsOnTargetAvg: 4.8,
      cleanSheetRate: 0.20,
      primaryColor: '#1E3A8A'
    }
  },

  // =========================================================================
  // 2. İNGİLTERE PREMIER LEAGUE (11. Hafta)
  // =========================================================================

  // Chelsea vs Arsenal (Londra Derbisi)
  {
    id: 'pl-11-che-ars',
    status: 'upcoming',
    league: 'Premier League',
    leagueCategory: 'premier-league',
    round: '11. Hafta (Londra Derbisi)',
    date: '10 Kasım Pazar',
    time: '19:30',
    stadium: 'Stamford Bridge, Londra',
    referee: 'Michael Oliver',
    homeTeam: {
      id: 'che',
      name: 'Chelsea',
      shortName: 'CHE',
      rank: 4,
      form: ['W', 'D', 'W', 'L', 'D'],
      avgGoalsScored: 2.15,
      avgGoalsConceded: 1.25,
      firstHalfGoalRate: 0.65,
      firstHalfLeadingRate: 0.48,
      avgCorners: 6.2,
      avgCards: 2.7,
      shotsOnTargetAvg: 6.4,
      cleanSheetRate: 0.30,
      primaryColor: '#2563EB'
    },
    awayTeam: {
      id: 'ars',
      name: 'Arsenal',
      shortName: 'ARS',
      rank: 5,
      form: ['W', 'W', 'D', 'L', 'L'],
      avgGoalsScored: 1.95,
      avgGoalsConceded: 1.10,
      firstHalfGoalRate: 0.60,
      firstHalfLeadingRate: 0.45,
      avgCorners: 6.5,
      avgCards: 2.2,
      shotsOnTargetAvg: 6.2,
      cleanSheetRate: 0.38,
      primaryColor: '#EF4444'
    }
  },

  // Liverpool vs Aston Villa
  {
    id: 'pl-11-liv-avl',
    status: 'upcoming',
    league: 'Premier League',
    leagueCategory: 'premier-league',
    round: '11. Hafta',
    date: '9 Kasım Cumartesi',
    time: '23:00',
    stadium: 'Anfield, Liverpool',
    referee: 'David Coote',
    homeTeam: {
      id: 'liv',
      name: 'Liverpool',
      shortName: 'LIV',
      rank: 1,
      form: ['W', 'W', 'W', 'D', 'W'],
      avgGoalsScored: 2.45,
      avgGoalsConceded: 0.75,
      firstHalfGoalRate: 0.72,
      firstHalfLeadingRate: 0.55,
      avgCorners: 7.3,
      avgCards: 1.8,
      shotsOnTargetAvg: 7.7,
      cleanSheetRate: 0.52,
      primaryColor: '#B91C1C'
    },
    awayTeam: {
      id: 'avl',
      name: 'Aston Villa',
      shortName: 'AVL',
      rank: 6,
      form: ['W', 'D', 'W', 'L', 'L'],
      avgGoalsScored: 1.80,
      avgGoalsConceded: 1.45,
      firstHalfGoalRate: 0.52,
      firstHalfLeadingRate: 0.38,
      avgCorners: 5.7,
      avgCards: 2.8,
      shotsOnTargetAvg: 5.4,
      cleanSheetRate: 0.25,
      primaryColor: '#7C2D12'
    }
  },

  // Brighton vs Manchester City
  {
    id: 'pl-11-bri-mci',
    status: 'upcoming',
    league: 'Premier League',
    leagueCategory: 'premier-league',
    round: '11. Hafta',
    date: '9 Kasım Cumartesi',
    time: '20:30',
    stadium: 'Amex Stadium, Falmer',
    referee: 'Robert Jones',
    homeTeam: {
      id: 'bri',
      name: 'Brighton',
      shortName: 'BRI',
      rank: 8,
      form: ['D', 'W', 'W', 'D', 'L'],
      avgGoalsScored: 1.85,
      avgGoalsConceded: 1.40,
      firstHalfGoalRate: 0.55,
      firstHalfLeadingRate: 0.40,
      avgCorners: 5.8,
      avgCards: 2.4,
      shotsOnTargetAvg: 5.7,
      cleanSheetRate: 0.28,
      primaryColor: '#0284C7'
    },
    awayTeam: {
      id: 'mci',
      name: 'Manchester City',
      shortName: 'MCI',
      rank: 2,
      form: ['W', 'W', 'W', 'W', 'L'],
      avgGoalsScored: 2.30,
      avgGoalsConceded: 1.15,
      firstHalfGoalRate: 0.65,
      firstHalfLeadingRate: 0.50,
      avgCorners: 7.4,
      avgCards: 1.7,
      shotsOnTargetAvg: 7.5,
      cleanSheetRate: 0.32,
      primaryColor: '#38BDF8'
    }
  },

  // =========================================================================
  // 3. İSPANYA LA LIGA (13. Hafta)
  // =========================================================================

  // Real Sociedad vs Barcelona
  {
    id: 'la-13-rso-bar',
    status: 'upcoming',
    league: 'La Liga',
    leagueCategory: 'la-liga',
    round: '13. Hafta',
    date: '10 Kasım Pazar',
    time: '23:00',
    stadium: 'Reale Arena, San Sebastián',
    referee: 'Guillermo Cuadra Fernández',
    homeTeam: {
      id: 'rso',
      name: 'Real Sociedad',
      shortName: 'RSO',
      rank: 11,
      form: ['D', 'W', 'L', 'W', 'L'],
      avgGoalsScored: 1.15,
      avgGoalsConceded: 1.00,
      firstHalfGoalRate: 0.38,
      firstHalfLeadingRate: 0.28,
      avgCorners: 5.1,
      avgCards: 2.5,
      shotsOnTargetAvg: 4.4,
      cleanSheetRate: 0.38,
      primaryColor: '#3B82F6'
    },
    awayTeam: {
      id: 'bar',
      name: 'Barcelona',
      shortName: 'BAR',
      rank: 1,
      form: ['W', 'W', 'W', 'W', 'W'],
      avgGoalsScored: 3.30,
      avgGoalsConceded: 0.90,
      firstHalfGoalRate: 0.82,
      firstHalfLeadingRate: 0.68,
      avgCorners: 7.2,
      avgCards: 2.0,
      shotsOnTargetAvg: 8.4,
      cleanSheetRate: 0.42,
      primaryColor: '#9333EA'
    }
  },

  // Real Madrid vs Osasuna
  {
    id: 'la-13-rma-osa',
    status: 'upcoming',
    league: 'La Liga',
    leagueCategory: 'la-liga',
    round: '13. Hafta',
    date: '9 Kasım Cumartesi',
    time: '16:00',
    stadium: 'Santiago Bernabéu, Madrid',
    referee: 'Mario Melero López',
    homeTeam: {
      id: 'rm',
      name: 'Real Madrid',
      shortName: 'RMA',
      rank: 2,
      form: ['W', 'W', 'W', 'L', 'L'],
      avgGoalsScored: 2.35,
      avgGoalsConceded: 1.10,
      firstHalfGoalRate: 0.65,
      firstHalfLeadingRate: 0.50,
      avgCorners: 6.6,
      avgCards: 1.9,
      shotsOnTargetAvg: 7.1,
      cleanSheetRate: 0.38,
      primaryColor: '#E0E7FF'
    },
    awayTeam: {
      id: 'osa',
      name: 'Osasuna',
      shortName: 'OSA',
      rank: 5,
      form: ['W', 'D', 'L', 'W', 'W'],
      avgGoalsScored: 1.45,
      avgGoalsConceded: 1.35,
      firstHalfGoalRate: 0.48,
      firstHalfLeadingRate: 0.34,
      avgCorners: 4.6,
      avgCards: 2.6,
      shotsOnTargetAvg: 4.5,
      cleanSheetRate: 0.32,
      primaryColor: '#DC2626'
    }
  },

  // =========================================================================
  // 4. İTALYA SERIE A (12. Hafta)
  // =========================================================================

  // Inter vs Napoli (Zirve Derbisi)
  {
    id: 'sa-12-int-nap',
    status: 'upcoming',
    league: 'Serie A',
    leagueCategory: 'serie-a',
    round: '12. Hafta (Zirve Derbisi)',
    date: '10 Kasım Pazar',
    time: '22:45',
    stadium: 'San Siro, Milano',
    referee: 'Maurizio Mariani',
    homeTeam: {
      id: 'int',
      name: 'Inter',
      shortName: 'INT',
      rank: 2,
      form: ['W', 'W', 'W', 'D', 'W'],
      avgGoalsScored: 2.40,
      avgGoalsConceded: 1.05,
      firstHalfGoalRate: 0.68,
      firstHalfLeadingRate: 0.54,
      avgCorners: 6.7,
      avgCards: 2.0,
      shotsOnTargetAvg: 7.0,
      cleanSheetRate: 0.42,
      primaryColor: '#2563EB'
    },
    awayTeam: {
      id: 'nap',
      name: 'Napoli',
      shortName: 'NAP',
      rank: 1,
      form: ['W', 'W', 'W', 'W', 'L'],
      avgGoalsScored: 1.90,
      avgGoalsConceded: 0.80,
      firstHalfGoalRate: 0.58,
      firstHalfLeadingRate: 0.46,
      avgCorners: 5.6,
      avgCards: 2.2,
      shotsOnTargetAvg: 5.9,
      cleanSheetRate: 0.55,
      primaryColor: '#0EA5E9'
    }
  },

  // Juventus vs Torino (Derby della Mole)
  {
    id: 'sa-12-juv-tor',
    status: 'upcoming',
    league: 'Serie A',
    leagueCategory: 'serie-a',
    round: '12. Hafta (Torino Derbisi)',
    date: '9 Kasım Cumartesi',
    time: '22:45',
    stadium: 'Allianz Stadium, Torino',
    referee: 'Simone Sozza',
    homeTeam: {
      id: 'juv',
      name: 'Juventus',
      shortName: 'JUV',
      rank: 5,
      form: ['D', 'W', 'D', 'D', 'W'],
      avgGoalsScored: 1.65,
      avgGoalsConceded: 0.65,
      firstHalfGoalRate: 0.48,
      firstHalfLeadingRate: 0.38,
      avgCorners: 5.2,
      avgCards: 2.1,
      shotsOnTargetAvg: 5.0,
      cleanSheetRate: 0.62,
      primaryColor: '#FFFFFF'
    },
    awayTeam: {
      id: 'tor',
      name: 'Torino',
      shortName: 'TOR',
      rank: 10,
      form: ['L', 'L', 'W', 'L', 'L'],
      avgGoalsScored: 1.25,
      avgGoalsConceded: 1.50,
      firstHalfGoalRate: 0.42,
      firstHalfLeadingRate: 0.28,
      avgCorners: 4.5,
      avgCards: 2.6,
      shotsOnTargetAvg: 4.1,
      cleanSheetRate: 0.24,
      primaryColor: '#7F1D1D'
    }
  },

  // =========================================================================
  // 5. ALMANYA BUNDESLIGA (10. Hafta)
  // =========================================================================

  // St. Pauli vs Bayern Münih
  {
    id: 'bl-10-stp-bay',
    status: 'upcoming',
    league: 'Bundesliga',
    leagueCategory: 'bundesliga',
    round: '10. Hafta',
    date: '9 Kasım Cumartesi',
    time: '17:30',
    stadium: 'Millerntor-Stadion, Hamburg',
    referee: 'Timo Gerach',
    homeTeam: {
      id: 'stp',
      name: 'St. Pauli',
      shortName: 'STP',
      rank: 15,
      form: ['L', 'D', 'L', 'L', 'W'],
      avgGoalsScored: 0.85,
      avgGoalsConceded: 1.30,
      firstHalfGoalRate: 0.30,
      firstHalfLeadingRate: 0.20,
      avgCorners: 4.3,
      avgCards: 2.4,
      shotsOnTargetAvg: 3.5,
      cleanSheetRate: 0.25,
      primaryColor: '#78350F'
    },
    awayTeam: {
      id: 'bay',
      name: 'Bayern Münih',
      shortName: 'BAY',
      rank: 1,
      form: ['D', 'W', 'W', 'W', 'W'],
      avgGoalsScored: 3.50,
      avgGoalsConceded: 0.75,
      firstHalfGoalRate: 0.85,
      firstHalfLeadingRate: 0.70,
      avgCorners: 7.8,
      avgCards: 1.6,
      shotsOnTargetAvg: 8.8,
      cleanSheetRate: 0.55,
      primaryColor: '#DC2626'
    }
  },

  // =========================================================================
  // 6. UEFA ŞAMPİYONLAR LİGİ (Devler Ligi)
  // =========================================================================

  // Inter vs Arsenal
  {
    id: 'cl-4-int-ars',
    status: 'upcoming',
    league: 'UEFA Şampiyonlar Ligi',
    leagueCategory: 'cl',
    round: 'Lig Aşaması • 4. Maç',
    date: 'Çarşamba',
    time: '23:00',
    stadium: 'San Siro, Milano',
    referee: 'István Kovács',
    homeTeam: {
      id: 'int',
      name: 'Inter',
      shortName: 'INT',
      rank: 2,
      form: ['W', 'W', 'W', 'D', 'W'],
      avgGoalsScored: 2.10,
      avgGoalsConceded: 0.70,
      firstHalfGoalRate: 0.65,
      firstHalfLeadingRate: 0.50,
      avgCorners: 6.4,
      avgCards: 2.1,
      shotsOnTargetAvg: 6.8,
      cleanSheetRate: 0.60,
      primaryColor: '#2563EB'
    },
    awayTeam: {
      id: 'ars',
      name: 'Arsenal',
      shortName: 'ARS',
      rank: 5,
      form: ['W', 'W', 'D', 'L', 'L'],
      avgGoalsScored: 1.85,
      avgGoalsConceded: 0.85,
      firstHalfGoalRate: 0.58,
      firstHalfLeadingRate: 0.44,
      avgCorners: 6.5,
      avgCards: 2.0,
      shotsOnTargetAvg: 6.1,
      cleanSheetRate: 0.50,
      primaryColor: '#EF4444'
    }
  },

  // =========================================================================
  // 7. TAMAMLANAN MAÇLAR (SADECE SKORLAR - TAHMİN İÇERMEZ)
  // =========================================================================

  // --- Süper Lig 10. Hafta Gerçek Skorları ---
  {
    id: 'sl-10-kon-gs',
    status: 'finished',
    league: 'Trendyol Süper Lig',
    leagueCategory: 'super-lig',
    round: '10. Hafta (Tamamlandı)',
    date: 'Geçen Hafta',
    time: 'MS',
    stadium: 'Medaş Konya Büyükşehir Stadyumu',
    referee: 'Halil Umut Meler',
    finalScore: { home: 0, away: 4, htHome: 0, htAway: 2, actualCorners: 8, actualCards: 3 },
    homeTeam: { id: 'kon', name: 'Konyaspor', shortName: 'KON', rank: 14, form: ['L', 'W', 'L', 'L', 'L'], avgGoalsScored: 1.15, avgGoalsConceded: 1.75, firstHalfGoalRate: 0.35, firstHalfLeadingRate: 0.20, avgCorners: 4.3, avgCards: 2.6, shotsOnTargetAvg: 3.8, cleanSheetRate: 0.18, primaryColor: '#15803D' },
    awayTeam: { id: 'gs', name: 'Galatasaray', shortName: 'GS', rank: 1, form: ['W', 'W', 'W', 'W', 'W'], avgGoalsScored: 2.85, avgGoalsConceded: 0.70, firstHalfGoalRate: 0.82, firstHalfLeadingRate: 0.68, avgCorners: 7.2, avgCards: 1.8, shotsOnTargetAvg: 7.9, cleanSheetRate: 0.52, primaryColor: '#F59E0B' }
  },
  {
    id: 't1-10-erz-crm',
    status: 'finished',
    league: 'Trendyol 1. Lig',
    leagueCategory: '1-lig',
    round: '10. Hafta (Tamamlandı)',
    date: 'Geçen Hafta',
    time: 'MS',
    stadium: 'Erzurum Kazım Karabekir Stadyumu',
    referee: 'Emre Kargın',
    finalScore: { home: 1, away: 3, htHome: 0, htAway: 1, actualCorners: 9, actualCards: 5 },
    homeTeam: { id: 'erz', name: 'Erzurumspor FK', shortName: 'ERZ', rank: 17, form: ['L', 'W', 'L', 'D', 'L'], avgGoalsScored: 1.10, avgGoalsConceded: 1.70, firstHalfGoalRate: 0.35, firstHalfLeadingRate: 0.22, avgCorners: 4.2, avgCards: 2.8, shotsOnTargetAvg: 3.7, cleanSheetRate: 0.18, primaryColor: '#3B82F6' },
    awayTeam: { id: 'corum', name: 'Çorum FK', shortName: 'ÇRM', rank: 9, form: ['W', 'D', 'L', 'D', 'W'], avgGoalsScored: 1.50, avgGoalsConceded: 1.25, firstHalfGoalRate: 0.52, firstHalfLeadingRate: 0.38, avgCorners: 5.1, avgCards: 2.5, shotsOnTargetAvg: 4.8, cleanSheetRate: 0.32, primaryColor: '#DC2626' }
  },
  {
    id: 'sl-10-siv-riz',
    status: 'finished',
    league: 'Trendyol Süper Lig',
    leagueCategory: 'super-lig',
    round: '10. Hafta (Tamamlandı)',
    date: 'Geçen Hafta',
    time: 'MS',
    stadium: 'BG Grup 4 Eylül Stadyumu, Sivas',
    referee: 'Oğuzhan Çakır',
    finalScore: { home: 2, away: 1, htHome: 1, htAway: 0, actualCorners: 10, actualCards: 4 },
    homeTeam: { id: 'siv', name: 'Netglobal Sivasspor', shortName: 'SİV', rank: 11, form: ['W', 'W', 'D', 'W', 'W'], avgGoalsScored: 1.45, avgGoalsConceded: 1.25, firstHalfGoalRate: 0.50, firstHalfLeadingRate: 0.38, avgCorners: 5.1, avgCards: 2.4, shotsOnTargetAvg: 4.8, cleanSheetRate: 0.28, primaryColor: '#DC2626' },
    awayTeam: { id: 'rize', name: 'Çaykur Rizespor', shortName: 'RİZ', rank: 15, form: ['L', 'L', 'W', 'L', 'L'], avgGoalsScored: 1.15, avgGoalsConceded: 1.65, firstHalfGoalRate: 0.40, firstHalfLeadingRate: 0.25, avgCorners: 4.7, avgCards: 2.6, shotsOnTargetAvg: 4.0, cleanSheetRate: 0.20, primaryColor: '#16A34A' }
  },
  {
    id: 'sl-10-goz-fb',
    status: 'finished',
    league: 'Trendyol Süper Lig',
    leagueCategory: 'super-lig',
    round: '10. Hafta (Tamamlandı)',
    date: 'Geçen Hafta',
    time: 'MS',
    stadium: 'Gürsel Aksel Stadyumu, İzmir',
    referee: 'Ali Şansalan',
    finalScore: { home: 2, away: 1, htHome: 1, htAway: 1, actualCorners: 11, actualCards: 5 },
    homeTeam: { id: 'goz', name: 'Göztepe', shortName: 'GÖZ', rank: 6, form: ['D', 'L', 'W', 'D', 'W'], avgGoalsScored: 1.6, avgGoalsConceded: 1.2, firstHalfGoalRate: 0.55, firstHalfLeadingRate: 0.42, avgCorners: 5.6, avgCards: 2.4, shotsOnTargetAvg: 5.2, cleanSheetRate: 0.32, primaryColor: '#EAB308' },
    awayTeam: { id: 'fb', name: 'Fenerbahçe', shortName: 'FB', rank: 3, form: ['W', 'W', 'D', 'W', 'L'], avgGoalsScored: 2.3, avgGoalsConceded: 1.0, firstHalfGoalRate: 0.65, firstHalfLeadingRate: 0.55, avgCorners: 6.8, avgCards: 2.2, shotsOnTargetAvg: 6.9, cleanSheetRate: 0.45, primaryColor: '#3B82F6' }
  },
  {
    id: 'sl-10-kas-bjk',
    status: 'finished',
    league: 'Trendyol Süper Lig',
    leagueCategory: 'super-lig',
    round: '10. Hafta (Tamamlandı)',
    date: 'Geçen Hafta',
    time: 'MS',
    stadium: 'Recep Tayyip Erdoğan Stadyumu, İstanbul',
    referee: 'Kadir Sağlam',
    finalScore: { home: 2, away: 2, htHome: 1, htAway: 1, actualCorners: 9, actualCards: 4 },
    homeTeam: { id: 'kas', name: 'Kasımpaşa', shortName: 'KAS', rank: 8, form: ['D', 'W', 'L', 'W', 'D'], avgGoalsScored: 1.6, avgGoalsConceded: 1.4, firstHalfGoalRate: 0.50, firstHalfLeadingRate: 0.38, avgCorners: 5.2, avgCards: 2.5, shotsOnTargetAvg: 5.0, cleanSheetRate: 0.28, primaryColor: '#1E3A8A' },
    awayTeam: { id: 'bjk', name: 'Beşiktaş', shortName: 'BJK', rank: 2, form: ['W', 'W', 'L', 'W', 'D'], avgGoalsScored: 2.1, avgGoalsConceded: 1.1, firstHalfGoalRate: 0.60, firstHalfLeadingRate: 0.48, avgCorners: 6.2, avgCards: 2.3, shotsOnTargetAvg: 6.2, cleanSheetRate: 0.40, primaryColor: '#FFFFFF' }
  },
  {
    id: 'sl-10-ant-aln',
    status: 'finished',
    league: 'Trendyol Süper Lig',
    leagueCategory: 'super-lig',
    round: '10. Hafta (Tamamlandı)',
    date: 'Geçen Hafta',
    time: 'MS',
    stadium: 'Corendon Airlines Park, Antalya',
    referee: 'Cihan Aydın',
    finalScore: { home: 1, away: 2, htHome: 1, htAway: 0, actualCorners: 7, actualCards: 3 },
    homeTeam: { id: 'ant', name: 'Antalyaspor', shortName: 'ANT', rank: 14, form: ['D', 'L', 'L', 'L', 'L'], avgGoalsScored: 1.1, avgGoalsConceded: 1.6, firstHalfGoalRate: 0.38, firstHalfLeadingRate: 0.28, avgCorners: 4.6, avgCards: 2.5, shotsOnTargetAvg: 4.0, cleanSheetRate: 0.22, primaryColor: '#EF4444' },
    awayTeam: { id: 'aln', name: 'Alanyaspor', shortName: 'ALN', rank: 15, form: ['W', 'W', 'L', 'L', 'W'], avgGoalsScored: 1.1, avgGoalsConceded: 1.8, firstHalfGoalRate: 0.40, firstHalfLeadingRate: 0.25, avgCorners: 4.5, avgCards: 2.7, shotsOnTargetAvg: 3.9, cleanSheetRate: 0.20, primaryColor: '#F97316' }
  },
  {
    id: 'sl-10-ts-gzt',
    status: 'finished',
    league: 'Trendyol Süper Lig',
    leagueCategory: 'super-lig',
    round: '10. Hafta (Tamamlandı)',
    date: 'Geçen Hafta',
    time: 'MS',
    stadium: 'Papara Park, Trabzon',
    referee: 'Zorbay Küçük',
    finalScore: { home: 2, away: 0, htHome: 1, htAway: 0, actualCorners: 10, actualCards: 3 },
    homeTeam: { id: 'ts', name: 'Trabzonspor', shortName: 'TS', rank: 5, form: ['D', 'D', 'L', 'W', 'W'], avgGoalsScored: 1.6, avgGoalsConceded: 1.0, firstHalfGoalRate: 0.55, firstHalfLeadingRate: 0.42, avgCorners: 5.5, avgCards: 2.5, shotsOnTargetAvg: 5.1, cleanSheetRate: 0.35, primaryColor: '#9333EA' },
    awayTeam: { id: 'gzt', name: 'Gaziantep FK', shortName: 'GFK', rank: 16, form: ['L', 'W', 'D', 'L', 'L'], avgGoalsScored: 1.1, avgGoalsConceded: 1.6, firstHalfGoalRate: 0.40, firstHalfLeadingRate: 0.28, avgCorners: 4.7, avgCards: 2.7, shotsOnTargetAvg: 4.1, cleanSheetRate: 0.20, primaryColor: '#DC2626' }
  },
  {
    id: 'sl-10-ibf-sam',
    status: 'finished',
    league: 'Trendyol Süper Lig',
    leagueCategory: 'super-lig',
    round: '10. Hafta (Tamamlandı)',
    date: 'Geçen Hafta',
    time: 'MS',
    stadium: 'Başakşehir Fatih Terim Stadyumu, İstanbul',
    referee: 'Volkan Bayarslan',
    finalScore: { home: 5, away: 2, htHome: 3, htAway: 1, actualCorners: 12, actualCards: 5 },
    homeTeam: { id: 'ibfk', name: 'İstanbul Başakşehir', shortName: 'İBFK', rank: 8, form: ['W', 'L', 'D', 'L', 'W'], avgGoalsScored: 1.8, avgGoalsConceded: 1.4, firstHalfGoalRate: 0.60, firstHalfLeadingRate: 0.44, avgCorners: 5.3, avgCards: 2.3, shotsOnTargetAvg: 5.4, cleanSheetRate: 0.30, primaryColor: '#F97316' },
    awayTeam: { id: 'sam', name: 'Samsunspor', shortName: 'SAM', rank: 10, form: ['W', 'D', 'W', 'L', 'L'], avgGoalsScored: 1.4, avgGoalsConceded: 1.5, firstHalfGoalRate: 0.45, firstHalfLeadingRate: 0.35, avgCorners: 5.2, avgCards: 2.3, shotsOnTargetAvg: 4.8, cleanSheetRate: 0.28, primaryColor: '#EF4444' }
  },
  {
    id: 'sl-10-bod-eyp',
    status: 'finished',
    league: 'Trendyol Süper Lig',
    leagueCategory: 'super-lig',
    round: '10. Hafta (Tamamlandı)',
    date: 'Geçen Hafta',
    time: 'MS',
    stadium: 'Bodrum İlçe Stadyumu, Muğla',
    referee: 'Halil Umut Meler',
    finalScore: { home: 1, away: 2, htHome: 0, htAway: 1, actualCorners: 9, actualCards: 4 },
    homeTeam: { id: 'bod', name: 'Bodrum FK', shortName: 'BOD', rank: 13, form: ['L', 'D', 'L', 'W', 'L'], avgGoalsScored: 1.1, avgGoalsConceded: 1.5, firstHalfGoalRate: 0.40, firstHalfLeadingRate: 0.25, avgCorners: 4.5, avgCards: 2.6, shotsOnTargetAvg: 4.0, cleanSheetRate: 0.22, primaryColor: '#10B981' },
    awayTeam: { id: 'eyup', name: 'Eyüpspor', shortName: 'EYP', rank: 12, form: ['W', 'L', 'D', 'W', 'W'], avgGoalsScored: 1.3, avgGoalsConceded: 1.4, firstHalfGoalRate: 0.45, firstHalfLeadingRate: 0.35, avgCorners: 5.0, avgCards: 2.4, shotsOnTargetAvg: 4.6, cleanSheetRate: 0.25, primaryColor: '#EAB308' }
  },

  // --- Premier League 10. Hafta Gerçek Skorları ---
  {
    id: 'past-pl-10-bou-mci',
    status: 'finished',
    league: 'Premier League',
    leagueCategory: 'premier-league',
    round: '10. Hafta (Tamamlandı)',
    date: '2 Kasım Cumartesi',
    time: 'MS',
    stadium: 'Vitality Stadium, Bournemouth',
    referee: 'Peter Bankes',
    finalScore: { home: 2, away: 1, htHome: 1, htAway: 0, actualCorners: 10, actualCards: 4 },
    homeTeam: { id: 'bou', name: 'Bournemouth', shortName: 'BOU', rank: 10, form: ['W', 'L', 'W', 'D', 'W'], avgGoalsScored: 1.50, avgGoalsConceded: 1.40, firstHalfGoalRate: 0.50, firstHalfLeadingRate: 0.35, avgCorners: 5.6, avgCards: 2.4, shotsOnTargetAvg: 5.0, cleanSheetRate: 0.25, primaryColor: '#DC2626' },
    awayTeam: { id: 'mci', name: 'Manchester City', shortName: 'MCI', rank: 2, form: ['W', 'W', 'W', 'W', 'L'], avgGoalsScored: 2.30, avgGoalsConceded: 1.15, firstHalfGoalRate: 0.65, firstHalfLeadingRate: 0.50, avgCorners: 7.4, avgCards: 1.7, shotsOnTargetAvg: 7.5, cleanSheetRate: 0.32, primaryColor: '#38BDF8' }
  },
  {
    id: 'past-pl-10-new-ars',
    status: 'finished',
    league: 'Premier League',
    leagueCategory: 'premier-league',
    round: '10. Hafta (Tamamlandı)',
    date: '2 Kasım Cumartesi',
    time: 'MS',
    stadium: 'St. James\' Park, Newcastle',
    referee: 'John Brooks',
    finalScore: { home: 1, away: 0, htHome: 1, htAway: 0, actualCorners: 7, actualCards: 5 },
    homeTeam: { id: 'new', name: 'Newcastle United', shortName: 'NEW', rank: 9, form: ['D', 'L', 'W', 'L', 'W'], avgGoalsScored: 1.55, avgGoalsConceded: 1.30, firstHalfGoalRate: 0.52, firstHalfLeadingRate: 0.38, avgCorners: 5.6, avgCards: 2.6, shotsOnTargetAvg: 5.3, cleanSheetRate: 0.30, primaryColor: '#1E293B' },
    awayTeam: { id: 'ars', name: 'Arsenal', shortName: 'ARS', rank: 5, form: ['W', 'W', 'D', 'L', 'L'], avgGoalsScored: 1.95, avgGoalsConceded: 1.10, firstHalfGoalRate: 0.60, firstHalfLeadingRate: 0.45, avgCorners: 6.5, avgCards: 2.2, shotsOnTargetAvg: 6.2, cleanSheetRate: 0.38, primaryColor: '#EF4444' }
  },
  {
    id: 'past-pl-10-liv-bri',
    status: 'finished',
    league: 'Premier League',
    leagueCategory: 'premier-league',
    round: '10. Hafta (Tamamlandı)',
    date: '2 Kasım Cumartesi',
    time: 'MS',
    stadium: 'Anfield, Liverpool',
    referee: 'Tony Harrington',
    finalScore: { home: 2, away: 1, htHome: 0, htAway: 1, actualCorners: 12, actualCards: 3 },
    homeTeam: { id: 'liv', name: 'Liverpool', shortName: 'LIV', rank: 1, form: ['W', 'W', 'W', 'D', 'W'], avgGoalsScored: 2.45, avgGoalsConceded: 0.75, firstHalfGoalRate: 0.72, firstHalfLeadingRate: 0.55, avgCorners: 7.3, avgCards: 1.8, shotsOnTargetAvg: 7.7, cleanSheetRate: 0.52, primaryColor: '#B91C1C' },
    awayTeam: { id: 'bri', name: 'Brighton', shortName: 'BRI', rank: 8, form: ['D', 'W', 'W', 'D', 'L'], avgGoalsScored: 1.85, avgGoalsConceded: 1.40, firstHalfGoalRate: 0.55, firstHalfLeadingRate: 0.40, avgCorners: 5.8, avgCards: 2.4, shotsOnTargetAvg: 5.7, cleanSheetRate: 0.28, primaryColor: '#0284C7' }
  },

  // --- La Liga 11. Hafta Gerçek Skorları ---
  {
    id: 'past-la-11-rma-bar',
    status: 'finished',
    league: 'La Liga',
    leagueCategory: 'la-liga',
    round: '11. Hafta (El Clásico)',
    date: '26 Ekim Cumartesi',
    time: 'MS',
    stadium: 'Santiago Bernabéu, Madrid',
    referee: 'José María Sánchez Martínez',
    finalScore: { home: 0, away: 4, htHome: 0, htAway: 0, actualCorners: 12, actualCards: 5 },
    homeTeam: { id: 'rm', name: 'Real Madrid', shortName: 'RMA', rank: 2, form: ['W', 'W', 'W', 'L', 'L'], avgGoalsScored: 2.35, avgGoalsConceded: 1.10, firstHalfGoalRate: 0.65, firstHalfLeadingRate: 0.50, avgCorners: 6.6, avgCards: 1.9, shotsOnTargetAvg: 7.1, cleanSheetRate: 0.38, primaryColor: '#E0E7FF' },
    awayTeam: { id: 'bar', name: 'Barcelona', shortName: 'BAR', rank: 1, form: ['W', 'W', 'W', 'W', 'W'], avgGoalsScored: 3.30, avgGoalsConceded: 0.90, firstHalfGoalRate: 0.82, firstHalfLeadingRate: 0.68, avgCorners: 7.2, avgCards: 2.0, shotsOnTargetAvg: 8.4, cleanSheetRate: 0.42, primaryColor: '#9333EA' }
  },

  // --- Şampiyonlar Ligi 4. Hafta Gerçek Skorları ---
  {
    id: 'past-cl-4-spo-mci',
    status: 'finished',
    league: 'UEFA Şampiyonlar Ligi',
    leagueCategory: 'cl',
    round: 'Lig Aşaması • 4. Maç (Tamamlandı)',
    date: '5 Kasım Salı',
    time: 'MS',
    stadium: 'Estádio José Alvalade, Lizbon',
    referee: 'Daniel Siebert',
    finalScore: { home: 4, away: 1, htHome: 1, htAway: 1, actualCorners: 9, actualCards: 4 },
    homeTeam: { id: 'spo', name: 'Sporting CP', shortName: 'SPO', rank: 2, form: ['W', 'W', 'W', 'W', 'W'], avgGoalsScored: 2.70, avgGoalsConceded: 0.80, firstHalfGoalRate: 0.70, firstHalfLeadingRate: 0.55, avgCorners: 6.5, avgCards: 2.1, shotsOnTargetAvg: 7.0, cleanSheetRate: 0.45, primaryColor: '#16A34A' },
    awayTeam: { id: 'mci', name: 'Manchester City', shortName: 'MCI', rank: 4, form: ['W', 'W', 'W', 'W', 'L'], avgGoalsScored: 2.30, avgGoalsConceded: 1.15, firstHalfGoalRate: 0.65, firstHalfLeadingRate: 0.50, avgCorners: 7.4, avgCards: 1.7, shotsOnTargetAvg: 7.5, cleanSheetRate: 0.32, primaryColor: '#38BDF8' }
  },
  {
    id: 'past-cl-4-liv-b04',
    status: 'finished',
    league: 'UEFA Şampiyonlar Ligi',
    leagueCategory: 'cl',
    round: 'Lig Aşaması • 4. Maç (Tamamlandı)',
    date: '5 Kasım Salı',
    time: 'MS',
    stadium: 'Anfield, Liverpool',
    referee: 'Danny Makkelie',
    finalScore: { home: 4, away: 0, htHome: 0, htAway: 0, actualCorners: 11, actualCards: 2 },
    homeTeam: { id: 'liv', name: 'Liverpool', shortName: 'LIV', rank: 1, form: ['W', 'W', 'W', 'D', 'W'], avgGoalsScored: 2.45, avgGoalsConceded: 0.75, firstHalfGoalRate: 0.72, firstHalfLeadingRate: 0.55, avgCorners: 7.3, avgCards: 1.8, shotsOnTargetAvg: 7.7, cleanSheetRate: 0.52, primaryColor: '#B91C1C' },
    awayTeam: { id: 'b04', name: 'Bayer Leverkusen', shortName: 'B04', rank: 7, form: ['W', 'D', 'W', 'D', 'L'], avgGoalsScored: 2.10, avgGoalsConceded: 1.30, firstHalfGoalRate: 0.60, firstHalfLeadingRate: 0.45, avgCorners: 6.2, avgCards: 2.0, shotsOnTargetAvg: 6.3, cleanSheetRate: 0.30, primaryColor: '#DC2626' }
  }
];
