// src/utils/bistIndexHelper.ts
export type { BistIndexType } from '../types/stocks';
import { BistIndexType } from '../types/stocks';

// 👑 BIST 30 (XU030) - Borsa İstanbul'un en likit 30 amiral gemisi
export const BIST_30_SYMBOLS = new Set([
  'THYAO', 'ASELS', 'GARAN', 'AKBNK', 'YKBNK', 'ISCTR', 'KCHOL', 'SAHOL', 'TUPRS', 'EREGL',
  'BIMAS', 'FROTO', 'TOASO', 'TCELL', 'TTKOM', 'SISE', 'PGSUS', 'ASTOR', 'ARCLK', 'MGROS',
  'TAVHL', 'ENKAI', 'PETKM', 'SASA', 'HEKTS', 'GUBRF', 'KOZAL', 'EKGYO', 'ALARK', 'KONTR'
]);

// 🏢 BIST 50 (XU050) - BIST 30 + sonraki 20 derinlikli hisse
export const BIST_50_SYMBOLS = new Set([
  ...BIST_30_SYMBOLS,
  'DOAS', 'AEFES', 'CCOLA', 'ULKER', 'SOKM', 'HALKB', 'VAKBN', 'KRDMD', 'ODAS', 'VESTL',
  'CIMSA', 'OYAKC', 'BRISA', 'KORDS', 'ENJSA', 'AGHOL', 'OTKAR', 'TURSG', 'TSKB', 'TUKAS'
]);

// 📈 BIST 100 (XU100) - Borsa İstanbul ana gösterge endeksi (İlk 100 hisse)
export const BIST_100_SYMBOLS = new Set([
  ...BIST_50_SYMBOLS,
  'ALBRK', 'ANHYT', 'ANSGR', 'AYGAZ', 'BAGFS', 'BERA', 'BFREN', 'BIENY', 'BOBET', 'BTCIM',
  'CANTE', 'CLEBI', 'CWENE', 'DOHOL', 'ECILC', 'ECZYT', 'EGEEN', 'ENERY', 'EUPWR', 'EUREN',
  'GESAN', 'GLYHO', 'GSDHO', 'GZNMI', 'IPEKE', 'ISDMR', 'ISGYO', 'ISMEN', 'IZMDC', 'KARSN',
  'KAYSE', 'KCAER', 'KMPUR', 'KONYA', 'KOZAA', 'KZBGY', 'MAVI', 'MIATK', 'PENTA', 'QUAGR',
  'REEDR', 'SAYAS', 'SDTTR', 'SELEC', 'SKBNK', 'SMRTG', 'TABGD', 'TATEN', 'TKFEN', 'TMSN',
  'TRGYO', 'TSPOR', 'YEOTK', 'ZOREN'
]);

// 💰 BIST Temettü 25 (XTMTU) - Düzenli ve yüksek nakit kâr payı dağıtan devler
export const BIST_DIVIDEND_25_SYMBOLS = new Set([
  'FROTO', 'EREGL', 'TUPRS', 'TOASO', 'BIMAS', 'TTKOM', 'TCELL', 'DOAS', 'CCOLA', 'ENKAI',
  'SISE', 'KCHOL', 'ISCTR', 'AKBNK', 'BRISA', 'VESBE', 'ANHYT', 'TSKB', 'AGHOL', 'MGROS',
  'ALARK', 'AEFES', 'CIMSA', 'SELEC', 'OYAKC'
]);

// 🏦 BIST Banka (XBANK) - Bankacılık sektörü hisseleri
export const BIST_BANKA_SYMBOLS = new Set([
  'GARAN', 'AKBNK', 'ISCTR', 'YKBNK', 'VAKBN', 'HALKB', 'TSKB', 'ALBRK', 'SKBNK', 'QNBFB', 'KLNMA'
]);

// 🏭 BIST Sınai (XUSIN) - İmalat, üretim ve sanayi lokomotifleri
export const BIST_SINAI_SYMBOLS = new Set([
  'TUPRS', 'EREGL', 'FROTO', 'TOASO', 'SISE', 'ARCLK', 'SASA', 'PETKM', 'KRDMD', 'VESTL',
  'CIMSA', 'OYAKC', 'BRISA', 'KORDS', 'HEKTS', 'GUBRF', 'AEFES', 'CCOLA', 'ULKER', 'SOKM',
  'EGEEN', 'BFREN', 'KCAER', 'KMPUR', 'IZMDC', 'BAGFS', 'KONYA'
]);

// 💻 BIST Teknoloji / Bilişim & Savunma (XUTEK)
export const BIST_TEKNO_SYMBOLS = new Set([
  'ASELS', 'KONTR', 'LOGO', 'KFEIN', 'VBTYZ', 'MIATK', 'REEDR', 'SDTTR', 'PENTA', 'PAPIL',
  'ARDYZ', 'NETAS', 'SMRTG', 'CWENE', 'EUPWR', 'YEOTK'
]);

export interface BistIndexMeta {
  id: BistIndexType;
  label: string;
  badge: string;
  count: number | string;
  description: string;
  icon: string;
}

export const BIST_INDICES_CONFIG: BistIndexMeta[] = [
  {
    id: 'ALL',
    label: 'BIST Tüm',
    badge: 'TÜMÜ',
    count: '600+',
    description: 'Borsa İstanbul pay piyasasında işlem gören tüm hisse senetleri',
    icon: '🌐',
  },
  {
    id: 'BIST30',
    label: 'BIST 30',
    badge: 'XU030',
    count: 30,
    description: "Türkiye'nin piyasa değeri ve işlem hacmi en yüksek 30 amiral gemisi",
    icon: '👑',
  },
  {
    id: 'BIST50',
    label: 'BIST 50',
    badge: 'XU050',
    count: 50,
    description: 'BIST 30 şirketleri ile sonraki en derinlikli 20 kurumsal hisse',
    icon: '🏢',
  },
  {
    id: 'BIST100',
    label: 'BIST 100',
    badge: 'XU100',
    count: 100,
    description: 'Borsa İstanbul ana gösterge endeksi (Piyasanın kalbi)',
    icon: '📈',
  },
  {
    id: 'DIVIDEND25',
    label: 'Temettü 25',
    badge: 'XTMTU',
    count: 25,
    description: 'Düzenli ve yüksek nakit kâr payı dağıtan temettü şampiyonları',
    icon: '💰',
  },
  {
    id: 'XBANK',
    label: 'Banka',
    badge: 'XBANK',
    count: 11,
    description: 'Mevduat ve yatırım bankacılığı finans devleri',
    icon: '🏦',
  },
  {
    id: 'XUSIN',
    label: 'Sınai',
    badge: 'XUSIN',
    count: 27,
    description: 'Otomotiv, demir-çelik, enerji, kimya ve üretim devleri',
    icon: '🏭',
  },
  {
    id: 'XUTEK',
    label: 'Teknoloji',
    badge: 'XUTEK',
    count: 16,
    description: 'Savunma elektroniği, yazılım, bilişim ve teknoloji şirketleri',
    icon: '💻',
  },
];

export function isStockInIndex(symbol: string, indexType: BistIndexType): boolean {
  const sym = symbol.toUpperCase().replace(/\.IS$/, '');
  switch (indexType) {
    case 'BIST30':
      return BIST_30_SYMBOLS.has(sym);
    case 'BIST50':
      return BIST_50_SYMBOLS.has(sym);
    case 'BIST100':
      return BIST_100_SYMBOLS.has(sym);
    case 'DIVIDEND25':
      return BIST_DIVIDEND_25_SYMBOLS.has(sym);
    case 'XBANK':
      return BIST_BANKA_SYMBOLS.has(sym);
    case 'XUSIN':
      return BIST_SINAI_SYMBOLS.has(sym);
    case 'XUTEK':
      return BIST_TEKNO_SYMBOLS.has(sym);
    case 'ALL':
    default:
      return true;
  }
}
