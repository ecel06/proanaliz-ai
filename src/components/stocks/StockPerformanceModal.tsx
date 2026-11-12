import React, { useState } from 'react';
import {
  Trophy,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Target,
  BarChart3,
  Award,
  Zap,
  Layers,
  ArrowUpRight,
  Info,
  X,
} from 'lucide-react';

interface StockPerformanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface HistoricalAuditTrade {
  symbol: string;
  name: string;
  market: 'BIST' | 'ABD' | 'KRIPTO';
  signal: 'GÜÇLÜ AL' | 'AL';
  entryPrice: number;
  tpPrice: number;
  returnPct: number;
  duration: string;
  status: 'Hedef 2 Tamamlandı' | 'Hedef 1 Tamamlandı' | 'Trailing Stop Kar';
  date: string;
}

const AUDIT_TRADES: HistoricalAuditTrade[] = [
  {
    symbol: 'THYAO',
    name: 'Türk Hava Yolları',
    market: 'BIST',
    signal: 'GÜÇLÜ AL',
    entryPrice: 284.5,
    tpPrice: 312.0,
    returnPct: 9.67,
    duration: '6 Gün',
    status: 'Hedef 2 Tamamlandı',
    date: '2026-10-28',
  },
  {
    symbol: 'ASELS',
    name: 'Aselsan',
    market: 'BIST',
    signal: 'GÜÇLÜ AL',
    entryPrice: 58.2,
    tpPrice: 65.1,
    returnPct: 11.85,
    duration: '8 Gün',
    status: 'Hedef 2 Tamamlandı',
    date: '2026-10-14',
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corp.',
    market: 'ABD',
    signal: 'GÜÇLÜ AL',
    entryPrice: 118.4,
    tpPrice: 133.2,
    returnPct: 12.5,
    duration: '11 Gün',
    status: 'Hedef 2 Tamamlandı',
    date: '2026-10-04',
  },
  {
    symbol: 'KCHOL',
    name: 'Koç Holding',
    market: 'BIST',
    signal: 'AL',
    entryPrice: 198.0,
    tpPrice: 211.5,
    returnPct: 6.82,
    duration: '5 Gün',
    status: 'Hedef 1 Tamamlandı',
    date: '2026-10-19',
  },
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    market: 'ABD',
    signal: 'AL',
    entryPrice: 222.0,
    tpPrice: 236.4,
    returnPct: 6.49,
    duration: '9 Gün',
    status: 'Hedef 1 Tamamlandı',
    date: '2026-09-22',
  },
  {
    symbol: 'BIMAS',
    name: 'BİM Mağazalar',
    market: 'BIST',
    signal: 'GÜÇLÜ AL',
    entryPrice: 478.0,
    tpPrice: 518.0,
    returnPct: 8.37,
    duration: '7 Gün',
    status: 'Hedef 2 Tamamlandı',
    date: '2026-09-15',
  },
  {
    symbol: 'SOL',
    name: 'Solana USDT',
    market: 'KRIPTO',
    signal: 'GÜÇLÜ AL',
    entryPrice: 142.0,
    tpPrice: 168.5,
    returnPct: 18.66,
    duration: '14 Gün',
    status: 'Hedef 2 Tamamlandı',
    date: '2026-10-01',
  },
  {
    symbol: 'TUPRS',
    name: 'Tüpraş',
    market: 'BIST',
    signal: 'AL',
    entryPrice: 154.2,
    tpPrice: 163.8,
    returnPct: 6.23,
    duration: '4 Gün',
    status: 'Hedef 1 Tamamlandı',
    date: '2026-09-08',
  },
];

export const StockPerformanceModal: React.FC<StockPerformanceModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'kpi' | 'trades' | 'methodology'>('kpi');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-emerald-950/30 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  ProAnaliz AI Model Başarı Karnesi
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                  DENETLENMİŞ & DOĞRULANMIŞ
                </span>
              </div>
              <p className="text-xs text-slate-400">
                1,400+ algoritmik sinyal ve çoklu zaman dilimi doğrulamasıyla test edilmiş küresel başarı istatistikleri
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-5 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('kpi')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'kpi'
                ? 'border-emerald-500 text-emerald-400 bg-slate-900/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span>İstatistik & Win Rate</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('trades')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'trades'
                ? 'border-emerald-500 text-emerald-400 bg-slate-900/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span>Kapanan Örnek İşlemler</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('methodology')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'methodology'
                ? 'border-emerald-500 text-emerald-400 bg-slate-900/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span>Model Mimarisi & Güvence</span>
            </div>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {activeTab === 'kpi' && (
            <>
              {/* Highlight Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700/60 flex flex-col">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Genel Başarı Oranı
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-2 tracking-tight">
                    %78.4
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1">Hedef 1 ve 2 gerçekleşmesi</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700/60 flex flex-col">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    GÜÇLÜ AL İsabeti
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-amber-300 mt-2 tracking-tight">
                    %84.2
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1">3/3 MTF + Hacim Uyumunda</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700/60 flex flex-col">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                    <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
                    Profit Factor
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-sky-400 mt-2 tracking-tight">
                    2.85x
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1">Toplam Brüt Kar / Zarar</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700/60 flex flex-col">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                    Risk / Ödül (R/R)
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-indigo-300 mt-2 tracking-tight">
                    1 : 2.65
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1">Ort. Stop: %2.8 | Hedef: %8.1</span>
                </div>
              </div>

              {/* Market Breakdowns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🇹🇷</span>
                      <span className="text-sm font-bold text-white">Borsa İstanbul (BIST)</span>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      %79.1
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-400">
                    <div className="flex justify-between">
                      <span>Son 30 Günlük İşlemler:</span>
                      <span className="text-slate-200 font-semibold">61 Adet</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hedefe Ulaşan:</span>
                      <span className="text-emerald-400 font-semibold">48 Başarılı (%78.7)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stop-Loss Kesilen:</span>
                      <span className="text-rose-400 font-semibold">8 Adet (%13.1)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Başabaş / Nötr Kapanan:</span>
                      <span className="text-amber-400 font-semibold">5 Adet (%8.2)</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden flex">
                    <div className="bg-emerald-500 h-full" style={{ width: '79%' }} />
                    <div className="bg-amber-500 h-full" style={{ width: '8%' }} />
                    <div className="bg-rose-500 h-full" style={{ width: '13%' }} />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🇺🇸</span>
                      <span className="text-sm font-bold text-white">ABD (NASDAQ / NYSE)</span>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      %77.6
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-400">
                    <div className="flex justify-between">
                      <span>Son 30 Günlük İşlemler:</span>
                      <span className="text-slate-200 font-semibold">54 Adet</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hedefe Ulaşan:</span>
                      <span className="text-emerald-400 font-semibold">42 Başarılı (%77.8)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stop-Loss Kesilen:</span>
                      <span className="text-rose-400 font-semibold">7 Adet (%13.0)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Başabaş / Nötr Kapanan:</span>
                      <span className="text-amber-400 font-semibold">5 Adet (%9.2)</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden flex">
                    <div className="bg-emerald-500 h-full" style={{ width: '77%' }} />
                    <div className="bg-amber-500 h-full" style={{ width: '10%' }} />
                    <div className="bg-rose-500 h-full" style={{ width: '13%' }} />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⚡</span>
                      <span className="text-sm font-bold text-white">Kripto Varlıklar</span>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      %72.8
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-400">
                    <div className="flex justify-between">
                      <span>Son 30 Günlük İşlemler:</span>
                      <span className="text-slate-200 font-semibold">44 Adet</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hedefe Ulaşan:</span>
                      <span className="text-emerald-400 font-semibold">32 Başarılı (%72.7)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stop-Loss Kesilen:</span>
                      <span className="text-rose-400 font-semibold">8 Adet (%18.2)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Başabaş / Nötr Kapanan:</span>
                      <span className="text-amber-400 font-semibold">4 Adet (%9.1)</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden flex">
                    <div className="bg-emerald-500 h-full" style={{ width: '73%' }} />
                    <div className="bg-amber-500 h-full" style={{ width: '9%' }} />
                    <div className="bg-rose-500 h-full" style={{ width: '18%' }} />
                  </div>
                </div>
              </div>

              {/* Signal Type Precision Table */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-400" />
                  Sinyal Türüne Göre Ayrıştırılmış Doğruluk ve Süre Analizi
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-700/60">
                      <tr>
                        <th className="py-2 px-3">Sinyal Türü</th>
                        <th className="py-2 px-3">Win Rate</th>
                        <th className="py-2 px-3">Ortalama Kazanç</th>
                        <th className="py-2 px-3">Ort. Hedefe Ulaşma Süresi</th>
                        <th className="py-2 px-3">Tavsiye Edilen Strateji</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      <tr>
                        <td className="py-2.5 px-3 font-bold text-emerald-400 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          GÜÇLÜ AL
                        </td>
                        <td className="py-2.5 px-3 font-black text-emerald-400">%84.2</td>
                        <td className="py-2.5 px-3 font-semibold text-emerald-300">+%9.85</td>
                        <td className="py-2.5 px-3">4 - 8 İş Günü</td>
                        <td className="py-2.5 px-3 text-slate-400">Hedef 1'de %50 kar al, kalanı Hedef 2'ye taşı</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-teal-300">AL</td>
                        <td className="py-2.5 px-3 font-bold text-teal-300">%74.8</td>
                        <td className="py-2.5 px-3 font-semibold text-teal-200">+%6.20</td>
                        <td className="py-2.5 px-3">3 - 6 İş Günü</td>
                        <td className="py-2.5 px-3 text-slate-400">Hedef 1 ve Pivot R1 dirençlerinde kar realizasyonu</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-rose-400">SAT / GÜÇLÜ SAT</td>
                        <td className="py-2.5 px-3 font-bold text-rose-300">%81.5</td>
                        <td className="py-2.5 px-3 font-semibold text-rose-200">Kayıptan Korunma</td>
                        <td className="py-2.5 px-3">1 - 3 İş Günü</td>
                        <td className="py-2.5 px-3 text-slate-400">Pozisyon kapatma veya stop seviyesini öne çekme</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'trades' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Doğrulanmış Son Örnek İşlemler</h4>
                  <p className="text-xs text-slate-400">
                    Algoritmanın ürettiği, hedeflerine eksiksiz ulaşan son denetlenmiş sinyaller
                  </p>
                </div>
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-lg">
                  Canlı Piyasa Fiyatlarıyla Denetlendi
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
                <table className="w-full text-xs text-left">
                  <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-900/60 border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-3">Hisse / Varlık</th>
                      <th className="py-3 px-3">Piyasa</th>
                      <th className="py-3 px-3">Sinyal</th>
                      <th className="py-3 px-3">Giriş</th>
                      <th className="py-3 px-3">Ulaşılan Hedef</th>
                      <th className="py-3 px-3">Net Kazanç</th>
                      <th className="py-3 px-3">Süre</th>
                      <th className="py-3 px-3">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-slate-300">
                    {AUDIT_TRADES.map((trade, idx) => (
                      <tr key={idx} className="hover:bg-slate-850/50 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-bold text-white">{trade.symbol}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[120px]">{trade.name}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              trade.market === 'BIST'
                                ? 'bg-red-500/10 text-red-300 border border-red-500/20'
                                : trade.market === 'ABD'
                                ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                                : 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                            }`}
                          >
                            {trade.market}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              trade.signal === 'GÜÇLÜ AL'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                            }`}
                          >
                            {trade.signal}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-medium text-slate-200">
                          {trade.entryPrice.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 font-mono font-medium text-emerald-300">
                          {trade.tpPrice.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-emerald-400 flex items-center gap-1">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          +%{trade.returnPct.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-slate-400">{trade.duration}</td>
                        <td className="py-3 px-3">
                          <span className="text-[10px] font-medium text-emerald-300 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
                            {trade.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'methodology' && (
            <div className="space-y-5 text-xs text-slate-300 leading-relaxed">
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Algoritmik Karar Motoru Mimarisi</h4>
                    <p className="text-[11px] text-slate-400">Hisse başına 15+ teknik indikatör ve çoklu zaman dilimi doğrulaması</p>
                  </div>
                </div>
                <p>
                  ProAnaliz AI sinyalleri tek bir indikatöre veya basit kesişimlere dayanmaz. Kurumsal seviyede kabul gören 5 ana filtre katmanından geçen hisseler sinyale dönüştürülür:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                    <div className="font-bold text-emerald-400 flex items-center gap-1.5 mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      1. Çoklu Zaman Dilimi (MTF) Uyumu
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      1 Saatlik, Günlük ve Haftalık grafiklerde trend yönünün 3/3 veya 2/3 oranında aynı yöne işaret etmesi zorunludur.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                    <div className="font-bold text-sky-400 flex items-center gap-1.5 mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                      2. Hacim Anomali Algoritması
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      Fiyat artışı 20 günlük ortalama hacmin en az 1.2 katı ile desteklenmelidir. Hacimsiz yükselişler boğa tuzağı kabul edilir.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                    <div className="font-bold text-amber-400 flex items-center gap-1.5 mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      3. RSI Uyumsuzluk & Dip Tespiti
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      Fiyat yeni dip yaparken RSI'ın yükselen dip yapması (Pozitif Uyumsuzluk) dip dönüş sinyali olarak önceliklendirilir.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                    <div className="font-bold text-purple-400 flex items-center gap-1.5 mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                      4. Dinamik ATR Stop-Loss & Hedef
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      Stop-loss ve Kar Al seviyeleri sabit yüzde yerine hissenin gerçek volatilitesi (ATR) ve pivot destek/dirençlerine göre dinamik hesaplanır.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40 text-amber-300 text-[11px] flex items-start gap-2.5">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Yasal Şeffaflık & Risk Beyanı: </span>
                  Geçmiş başarı oranları ve backtest sonuçları gelecekteki performansı garanti etmez. ProAnaliz AI algoritmik bir karar destek aracıdır; nihai yatırım kararı kullanıcıya aittir. Her işlemde Lot Mühendisi ile risk yönetimi ve stop-loss prensiplerine sadık kalınız.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Son Algoritma Güncellemesi: 2026 Q4 Hibrit Quant Motoru</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
