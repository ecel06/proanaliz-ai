// src/data/tefasFundsData.ts
// TEFAS (Türkiye Elektronik Fon Alım Satım Platformu) Top Funds & AI Portfolio Baskets for ProAnaliz AI

export type TefasFundCategory = 'hisse' | 'yabanci_teknoloji' | 'altin_emtia' | 'para_piyasasi' | 'degisken';

export interface TefasFundHolding {
  name: string;
  share: number; // Percentage e.g. 12.5
  ticker?: string;
}

export interface TefasFundItem {
  code: string; // e.g. TTE
  name: string;
  manager: string;
  category: TefasFundCategory;
  categoryLabel: string;
  price: number; // TL
  dailyChange: number; // %
  return1M: number; // %
  return3M: number; // %
  return1Y: number; // %
  riskLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7; // 1 lowest, 7 highest
  totalValueTl: number; // e.g. 5.4 Milyar TL
  investorCount: number; // e.g. 48.500 kişi
  aiRating: 'GÜÇLÜ AL' | 'AL' | 'TUT';
  aiScore: number; // 0-100
  topHoldings: TefasFundHolding[];
  aiInsight: string;
}

export interface AIFundBasketAllocation {
  fundCode: string;
  fundName: string;
  share: number; // % in basket
  role: string; // e.g. "Yüksek Büyüme Motoru"
}

export interface AIFundBasket {
  id: string;
  name: string;
  tagline: string;
  riskTitle: 'Düşük Risk (1-2)' | 'Orta / Dengeli Risk (4-5)' | 'Yüksek Büyüme (6-7)';
  expectedAnnualReturn: string;
  icon: string;
  badgeColor: string;
  description: string;
  allocations: AIFundBasketAllocation[];
  aiRecommendationReason: string;
  historical1YReturn: number;
}

export const TEFAS_FUNDS: TefasFundItem[] = [
  {
    code: 'TTE',
    name: 'İş Portföy BIST Teknoloji Ağırlıklı Sınırlı Fon',
    manager: 'İş Portföy',
    category: 'hisse',
    categoryLabel: '🚀 BIST Teknoloji',
    price: 4.88,
    dailyChange: 2.14,
    return1M: 14.8,
    return3M: 32.4,
    return1Y: 138.6,
    riskLevel: 6,
    totalValueTl: 7850000000,
    investorCount: 84200,
    aiRating: 'GÜÇLÜ AL',
    aiScore: 96,
    topHoldings: [
      { name: 'Aselsan', share: 14.5, ticker: 'ASELS' },
      { name: 'Logo Yazılım', share: 11.2, ticker: 'LOGO' },
      { name: 'Kafein Yazılım', share: 8.8, ticker: 'KFEIN' },
      { name: 'Papilon Savunma', share: 7.9, ticker: 'PAPIL' },
      { name: 'Mia Teknoloji', share: 6.8, ticker: 'MIATK' },
    ],
    aiInsight:
      'Yazılım, savunma sanayii ve yarı iletken rallisinin Borsa İstanbul ayağındaki en güçlü fonudur. Yüksek getiri arayan büyüme yatırımcıları için idealdir.',
  },
  {
    code: 'AFT',
    name: 'Ak Portföy Yeni Teknolojiler Yabancı Hisse Fonu',
    manager: 'Ak Portföy',
    category: 'yabanci_teknoloji',
    categoryLabel: '🌐 Global Teknoloji Devleri',
    price: 0.428,
    dailyChange: 1.65,
    return1M: 9.4,
    return3M: 21.2,
    return1Y: 86.4,
    riskLevel: 7,
    totalValueTl: 18400000000,
    investorCount: 162000,
    aiRating: 'GÜÇLÜ AL',
    aiScore: 94,
    topHoldings: [
      { name: 'Nvidia Corporation', share: 11.4, ticker: 'NVDA' },
      { name: 'Microsoft Corp.', share: 9.8, ticker: 'MSFT' },
      { name: 'Apple Inc.', share: 9.2, ticker: 'AAPL' },
      { name: 'Alphabet (Google)', share: 8.6, ticker: 'GOOGL' },
      { name: 'Amazon.com Inc.', share: 7.5, ticker: 'AMZN' },
    ],
    aiInsight:
      'Tek tıkla Türk Lirası ile Nvidia, Apple ve Microsoft gibi küresel yapay zeka liderlerine ortak olmanın en pratik ve likit yoludur.',
  },
  {
    code: 'MAC',
    name: 'Marmara Capital Portföy Hisse Senedi Fonu',
    manager: 'Marmara Capital',
    category: 'hisse',
    categoryLabel: '💎 Değer & Büyüme Hisseleri',
    price: 18.42,
    dailyChange: 0.94,
    return1M: 11.2,
    return3M: 26.8,
    return1Y: 118.2,
    riskLevel: 6,
    totalValueTl: 4200000000,
    investorCount: 39500,
    aiRating: 'GÜÇLÜ AL',
    aiScore: 92,
    topHoldings: [
      { name: 'Türk Hava Yolları', share: 9.8, ticker: 'THYAO' },
      { name: 'Tüpraş', share: 9.1, ticker: 'TUPRS' },
      { name: 'Ford Otosan', share: 8.4, ticker: 'FROTO' },
      { name: 'Koç Holding', share: 7.8, ticker: 'KCHOL' },
      { name: 'Bim Mağazalar', share: 7.2, ticker: 'BIMAS' },
    ],
    aiInsight:
      'Portföy yöneticisi Haydar Acun liderliğinde derin bilanço analiziyle ucuz kalmış ve büyüme potansiyeli yüksek BIST yıldızlarını toplar.',
  },
  {
    code: 'GGK',
    name: 'Garanti Portföy Altın Fonu',
    manager: 'Garanti Portföy',
    category: 'altin_emtia',
    categoryLabel: '🥇 Altın & Kıymetli Maden',
    price: 0.184,
    dailyChange: 0.42,
    return1M: 5.8,
    return3M: 16.4,
    return1Y: 72.8,
    riskLevel: 4,
    totalValueTl: 12500000000,
    investorCount: 98000,
    aiRating: 'AL',
    aiScore: 89,
    topHoldings: [
      { name: 'Borsa İstanbul Altın Sertifikası (ALTINS1)', share: 44.0 },
      { name: 'Darphane Altın Külçeleri', share: 38.5 },
      { name: 'Hazine Altın Tahvilleri', share: 17.5 },
    ],
    aiInsight:
      'Kuyumcu makas farkı, sahtelik veya çalınma riski olmadan ons ve dolar bazlı altın getirisini doğrudan portföye yansıtır.',
  },
  {
    code: 'PPZ',
    name: 'Azimut Portföy Para Piyasası Fonu',
    manager: 'Azimut Portföy',
    category: 'para_piyasasi',
    categoryLabel: '🛡️ Para Piyasası (Günlük Faiz)',
    price: 1.482,
    dailyChange: 0.14,
    return1M: 4.2,
    return3M: 13.1,
    return1Y: 53.4,
    riskLevel: 1,
    totalValueTl: 32000000000,
    investorCount: 185000,
    aiRating: 'AL',
    aiScore: 88,
    topHoldings: [
      { name: 'Gecelik Ters Repo / BIST', share: 58.0 },
      { name: 'Kısa Vadeli Mevduat', share: 26.0 },
      { name: 'Özel Sektör Bonoları', share: 16.0 },
    ],
    aiInsight:
      'Sıfır piyasa riski ile her gün düzenli getiri sunar. Hafta sonu dahi faiz işletir ve dilediğiniz gün tek tıkla nakde dönebilirsiniz.',
  },
  {
    code: 'TI3',
    name: 'İş Portföy İhracatçı Şirketler Fonu',
    manager: 'İş Portföy',
    category: 'hisse',
    categoryLabel: '💵 Döviz Gelirli İhracatçılar',
    price: 3.12,
    dailyChange: 1.15,
    return1M: 10.4,
    return3M: 24.1,
    return1Y: 98.4,
    riskLevel: 6,
    totalValueTl: 3100000000,
    investorCount: 28400,
    aiRating: 'AL',
    aiScore: 91,
    topHoldings: [
      { name: 'Şişecam', share: 10.2, ticker: 'SISE' },
      { name: 'Ford Otosan', share: 9.8, ticker: 'FROTO' },
      { name: 'Vestel Beyaz Eşya', share: 8.5, ticker: 'VESBE' },
      { name: 'Kordsa Teknik Tekstil', share: 7.9, ticker: 'KORDS' },
      { name: 'Arçelik', share: 7.4, ticker: 'ARCLK' },
    ],
    aiInsight:
      'Gelirlerinin büyük bölümü Dolar ve Euro olan BIST ihracatçı devlerine yatırım yaparak kur artışlarına karşı doğal bir kalkan görevi görür.',
  },
  {
    code: 'YAY',
    name: 'Yapı Kredi Portföy Yabancı Teknoloji Fonu',
    manager: 'Yapı Kredi Portföy',
    category: 'yabanci_teknoloji',
    categoryLabel: '🌐 Nasdaq Teknoloji Sepeti',
    price: 2.94,
    dailyChange: 1.48,
    return1M: 8.9,
    return3M: 20.4,
    return1Y: 81.2,
    riskLevel: 7,
    totalValueTl: 9600000000,
    investorCount: 71200,
    aiRating: 'AL',
    aiScore: 90,
    topHoldings: [
      { name: 'Broadcom Inc.', share: 10.2, ticker: 'AVGO' },
      { name: 'Nvidia Corp.', share: 9.8, ticker: 'NVDA' },
      { name: 'Microsoft Corp.', share: 9.1, ticker: 'MSFT' },
      { name: 'Qualcomm', share: 8.4, ticker: 'QCOM' },
      { name: 'Meta Platforms', share: 7.8, ticker: 'META' },
    ],
    aiInsight:
      'Yarı iletken, çip üreticileri ve yapay zeka bulut altyapısı sunan Nasdaq devlerine odaklanan dengeli yabancı teknoloji fonudur.',
  },
  {
    code: 'IIH',
    name: 'İstanbul Portföy Üçüncü Hisse Senedi Fonu',
    manager: 'İstanbul Portföy',
    category: 'hisse',
    categoryLabel: '🎯 BIST Yüksek Alfa Fonu',
    price: 5.64,
    dailyChange: 1.82,
    return1M: 12.6,
    return3M: 29.5,
    return1Y: 106.8,
    riskLevel: 6,
    totalValueTl: 5800000000,
    investorCount: 46200,
    aiRating: 'GÜÇLÜ AL',
    aiScore: 93,
    topHoldings: [
      { name: 'Turkcell', share: 11.2, ticker: 'TCELL' },
      { name: 'Akbank', share: 10.4, ticker: 'AKBNK' },
      { name: 'Enka İnşaat', share: 8.6, ticker: 'ENKAI' },
      { name: 'Sabancı Holding', share: 7.9, ticker: 'SAHOL' },
      { name: 'Astor Enerji', share: 7.2, ticker: 'ASTOR' },
    ],
    aiInsight:
      'Piyasa koşullarına göre aktif taktiksel portföy ayarlaması yapar; yükseliş trendindeki sektörlere hızla ağırlık verir.',
  },
];

export const AI_FUND_BASKETS: AIFundBasket[] = [
  {
    id: 'basket-guvenli',
    name: '🛡️ Güvenli Liman & Enflasyon Kalkanı',
    tagline: 'Sıfır panik, düzenli günlük getiri ve altın koruması',
    riskTitle: 'Düşük Risk (1-2)',
    expectedAnnualReturn: '%58 – %68',
    icon: '🛡️',
    badgeColor: 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300',
    description:
      'Borsa dalgalanmalarından etkilenmek istemeyen, ana parasını enflasyona karşı korurken her gün düzenli faiz ve altın artışı hedefleyen yatırımcılar için tasarlanmıştır.',
    historical1YReturn: 63.8,
    aiRecommendationReason:
      'Mevduat faizine alternatif olarak günlük nakit likiditesi ve ons altın korumasını birleştirir. Negatif getiri olasılığı minimum düzeydedir.',
    allocations: [
      {
        fundCode: 'PPZ',
        fundName: 'Azimut Para Piyasası Fonu',
        share: 50,
        role: 'Düzenli Günlük Faiz & Nakit Likiditesi',
      },
      {
        fundCode: 'GGK',
        fundName: 'Garanti Altın Fonu',
        share: 35,
        role: 'Enflasyon & Döviz Kalkanı (Altın)',
      },
      {
        fundCode: 'TI3',
        fundName: 'İş Portföy İhracatçı Fonu',
        share: 15,
        role: 'Döviz Gelirli Temettü Büyümesi',
      },
    ],
  },
  {
    id: 'basket-dengeli',
    name: '⚖️ Dengeli Büyüme & Karma Portföy',
    tagline: 'BIST 100, Silikon Vadisi ve Altını birleştiren optimal model',
    riskTitle: 'Orta / Dengeli Risk (4-5)',
    expectedAnnualReturn: '%95 – %120',
    icon: '⚖️',
    badgeColor: 'border-cyan-500/40 bg-cyan-950/40 text-cyan-300',
    description:
      'Hem Borsa İstanbul’un en parlak hisselerine hem de Nvidia, Apple gibi dünya devlerine ortak olurken altın ve para piyasası ile riski mükemmel dengeleyen ana sepetimizdir.',
    historical1YReturn: 104.2,
    aiRecommendationReason:
      'Teknoloji hisselerinin yüksek büyüme potansiyelini altın ve para piyasasıyla korur. Yatırımcıların %70’i için en ideal uzun vadeli servet inşası modelidir.',
    allocations: [
      {
        fundCode: 'TTE',
        fundName: 'İş Portföy BIST Teknoloji Fonu',
        share: 40,
        role: 'Yerli Yazılım & Teknoloji Büyümesi',
      },
      {
        fundCode: 'AFT',
        fundName: 'Ak Portföy Global Teknoloji Fonu',
        share: 30,
        role: 'Nvidia & Apple ile Dolar Bazlı Global Kazanç',
      },
      {
        fundCode: 'GGK',
        fundName: 'Garanti Altın Fonu',
        share: 20,
        role: 'Portföy Sigortası & Güvenli Liman',
      },
      {
        fundCode: 'PPZ',
        fundName: 'Azimut Para Piyasası Fonu',
        share: 10,
        role: 'Fırsat Alımları İçin Hazır Likidite',
      },
    ],
  },
  {
    id: 'basket-agresif',
    name: '🚀 Agresif Büyüme & Yapay Zeka Yıldızları',
    tagline: 'Yapay zeka, çip devleri ve BIST ralli hisselerine maksimum ağırlık',
    riskTitle: 'Yüksek Büyüme (6-7)',
    expectedAnnualReturn: '%130 – %165+',
    icon: '🚀',
    badgeColor: 'border-amber-500/40 bg-amber-950/40 text-amber-300',
    description:
      'Geleceğin teknolojilerine ve yüksek tempolu büyüme şirketlerine odaklanır. Kısa vadeli dalgalanmaları umursamayıp 1-2 yılda parasını katlamak isteyenler içindir.',
    historical1YReturn: 128.6,
    aiRecommendationReason:
      'Yapay zeka devrimi ve Borsa İstanbul teknoloji endeksinin ortak sinerjisini kullanır. Geçtiğimiz 1 yılda %128 getiri sağlayarak enflasyonu 2’ye katlamıştır.',
    allocations: [
      {
        fundCode: 'TTE',
        fundName: 'İş Portföy BIST Teknoloji Fonu',
        share: 50,
        role: 'BIST Savunma & Yazılım Lokomotifi',
      },
      {
        fundCode: 'AFT',
        fundName: 'Ak Portföy Yeni Teknolojiler Fonu',
        share: 35,
        role: 'Yapay Zeka & Yarı İletken (Nvidia, MSFT)',
      },
      {
        fundCode: 'MAC',
        fundName: 'Marmara Capital Hisse Fonu',
        share: 15,
        role: 'Derin Değer & Alfa Yaratan BIST Hisseleri',
      },
    ],
  },
];
