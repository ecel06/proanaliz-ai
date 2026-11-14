// src/data/dividendData.ts
import { StockDividendItem, StockPortfolioPosition } from '../types/stocks';

export const INITIAL_DIVIDENDS: StockDividendItem[] = [
  // =========================================================================
  // 1. YAKLAŞAN / KESİNLEŞMİŞ TEMETTÜLER (Ödeme Tarihi Gelmemiş)
  // Borsa İstanbul & SPK Takvimi: Hak kullanım ve T+2 ödeme iş günüdür.
  // =========================================================================
  {
    id: 'div-froto-2026',
    code: 'FROTO',
    companyName: 'Ford Otomotiv Sanayi A.Ş.',
    grossDividendPerShare: 48.11,
    netDividendPerShare: 43.30,
    dividendYieldPct: 4.2,
    basePrice: 1045.0,
    exDividendDate: '24 Kasım 2026 Salı',
    paymentDate: '26 Kasım 2026 Perşembe',
    status: 'confirmed',
    year: 2026,
    notes: 'Yıl Sonu 2. Temettü Ödemesi (Yönetim Kurulu Onaylı).',
  },
  {
    id: 'div-bimas-2026',
    code: 'BIMAS',
    companyName: 'BİM Birleşik Mağazalar A.Ş.',
    grossDividendPerShare: 11.11,
    netDividendPerShare: 10.00,
    dividendYieldPct: 2.1,
    basePrice: 485.0,
    exDividendDate: '22 Aralık 2026 Salı',
    paymentDate: '24 Aralık 2026 Perşembe',
    status: 'expected',
    year: 2026,
    notes: '2. Taksit Temettü Dağıtım Planı.',
  },

  // =========================================================================
  // 2. 2026 YILI İÇERİSİNDE BAŞARIYLA DAĞITILMIŞ / ÖDENMİŞ TEMETTÜLER
  // =========================================================================
  {
    id: 'div-tuprs-2026',
    code: 'TUPRS',
    companyName: 'Tüpraş Türkiye Petrol Rafinerileri A.Ş.',
    grossDividendPerShare: 11.93,
    netDividendPerShare: 10.74,
    dividendYieldPct: 6.8,
    basePrice: 158.4,
    exDividendDate: '29 Eylül 2026 Salı',
    paymentDate: '01 Ekim 2026 Perşembe',
    status: 'paid',
    year: 2026,
    notes: '2. Taksit Nakit Temettü Dağıtımı Hesaba Geçti.',
  },
  {
    id: 'div-doas-2026',
    code: 'DOAS',
    companyName: 'Doğuş Otomotiv Servis ve Ticaret A.Ş.',
    grossDividendPerShare: 40.90,
    netDividendPerShare: 36.81,
    dividendYieldPct: 14.5,
    basePrice: 254.0,
    exDividendDate: '21 Nisan 2026 Salı',
    paymentDate: '24 Nisan 2026 Cuma',
    status: 'paid',
    year: 2026,
    notes: 'Borsa İstanbul\'un En Yüksek Temettü Verimlerinden Biri (23 Nisan Tatili Sonrası T+2 Ödendi).',
  },
  {
    id: 'div-toaso-2026',
    code: 'TOASO',
    companyName: 'Tofaş Türk Otomobil Fabrikası A.Ş.',
    grossDividendPerShare: 20.00,
    netDividendPerShare: 18.00,
    dividendYieldPct: 7.9,
    basePrice: 228.0,
    exDividendDate: '07 Nisan 2026 Salı',
    paymentDate: '09 Nisan 2026 Perşembe',
    status: 'paid',
    year: 2026,
    notes: 'Tamamı Nakit Temettü Olarak Ödendi.',
  },
  {
    id: 'div-ttrak-2026',
    code: 'TTRAK',
    companyName: 'Türk Traktör ve Ziraat Makineleri A.Ş.',
    grossDividendPerShare: 62.96,
    netDividendPerShare: 56.66,
    dividendYieldPct: 6.4,
    basePrice: 885.0,
    exDividendDate: '01 Nisan 2026 Çarşamba',
    paymentDate: '03 Nisan 2026 Cuma',
    status: 'paid',
    year: 2026,
    notes: 'Yıllık Kar Payı Dağıtımı.',
  },
  {
    id: 'div-ismen-2026',
    code: 'ISMEN',
    companyName: 'İş Yatırım Menkul Değerler A.Ş.',
    grossDividendPerShare: 4.56,
    netDividendPerShare: 4.10,
    dividendYieldPct: 10.8,
    basePrice: 38.0,
    exDividendDate: '31 Mart 2026 Salı',
    paymentDate: '02 Nisan 2026 Perşembe',
    status: 'paid',
    year: 2026,
    notes: 'Aracı Kurum Sektörü Lider Temettü Ödemesi.',
  },
  {
    id: 'div-enjsa-2026',
    code: 'ENJSA',
    companyName: 'Enerjisa Enerji A.Ş.',
    grossDividendPerShare: 3.10,
    netDividendPerShare: 2.79,
    dividendYieldPct: 4.9,
    basePrice: 57.2,
    exDividendDate: '09 Nisan 2026 Perşembe',
    paymentDate: '13 Nisan 2026 Pazartesi',
    status: 'paid',
    year: 2026,
    notes: 'Düzenli Temettü Ödeme Politikası.',
  },
  {
    id: 'div-kchol-2026',
    code: 'KCHOL',
    companyName: 'Koç Holding A.Ş.',
    grossDividendPerShare: 8.89,
    netDividendPerShare: 8.00,
    dividendYieldPct: 3.9,
    basePrice: 204.0,
    exDividendDate: '24 Nisan 2026 Cuma',
    paymentDate: '28 Nisan 2026 Salı',
    status: 'paid',
    year: 2026,
    notes: 'Holding İştirak Kâr Payları Kaynaklı.',
  },
  {
    id: 'div-aygaz-2026',
    code: 'AYGAZ',
    companyName: 'Aygaz A.Ş.',
    grossDividendPerShare: 7.61,
    netDividendPerShare: 6.85,
    dividendYieldPct: 4.6,
    basePrice: 148.5,
    exDividendDate: '02 Nisan 2026 Perşembe',
    paymentDate: '06 Nisan 2026 Pazartesi',
    status: 'paid',
    year: 2026,
    notes: 'Yıllık Nakit Temettü.',
  },
  {
    id: 'div-eregl-2026',
    code: 'EREGL',
    companyName: 'Ereğli Demir ve Çelik Fabrikaları T.A.Ş.',
    grossDividendPerShare: 0.50,
    netDividendPerShare: 0.45,
    dividendYieldPct: 1.1,
    basePrice: 42.1,
    exDividendDate: '16 Nisan 2026 Perşembe',
    paymentDate: '20 Nisan 2026 Pazartesi',
    status: 'paid',
    year: 2026,
    notes: 'Yatırım Dönemi Kısmi Temettüsü.',
  },
];

/**
 * Portföydeki hisselerin yıllık tahmini temettü getirisini hesaplar
 */
export function calculatePortfolioDividends(
  positions: StockPortfolioPosition[],
  dividends: StockDividendItem[] = INITIAL_DIVIDENDS
) {
  const openPositions = positions.filter((p) => p.status === 'open' && p.market === 'bist');
  let totalNetDividendTl = 0;
  const breakdown: {
    symbol: string;
    units: number;
    netPerShare: number;
    totalTl: number;
    yieldPct: number;
    paymentDate: string;
  }[] = [];

  openPositions.forEach((pos) => {
    const div = dividends.find((d) => d.code.toUpperCase() === pos.symbol.toUpperCase());
    if (div && div.netDividendPerShare > 0) {
      const totalTl = Number((pos.units * div.netDividendPerShare).toFixed(2));
      totalNetDividendTl += totalTl;
      breakdown.push({
        symbol: pos.symbol,
        units: pos.units,
        netPerShare: div.netDividendPerShare,
        totalTl,
        yieldPct: div.dividendYieldPct,
        paymentDate: div.paymentDate,
      });
    }
  });

  return {
    totalNetDividendTl: Number(totalNetDividendTl.toFixed(2)),
    payingStockCount: breakdown.length,
    breakdown,
  };
}
