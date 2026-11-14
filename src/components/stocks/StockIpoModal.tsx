// src/components/stocks/StockIpoModal.tsx
import React, { useMemo, useState } from 'react';
import {
  Rocket,
  Calendar,
  CheckCircle2,
  XCircle,
  Calculator,
  Search,
  ExternalLink,
  Flame,
  Award,
  Layers,
  DollarSign,
  TrendingUp,
  X,
  Briefcase,
  HelpCircle,
  ShieldCheck,
  Building,
  Info,
} from 'lucide-react';
import { IpoStatus, StockIpoItem, StockItem, StockPortfolioPosition } from '../../types/stocks';
import { calculateEstimatedLots, INITIAL_IPOS } from '../../data/ipoData';

interface StockIpoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToPortfolio?: (pos: StockPortfolioPosition) => void;
  onShowToast?: (msg: string) => void;
  stocks?: StockItem[];
}

export const StockIpoModal: React.FC<StockIpoModalProps> = ({
  isOpen,
  onClose,
  onAddToPortfolio,
  onShowToast,
  stocks = [],
}) => {
  const ipos = INITIAL_IPOS;
  const initialTab: IpoStatus = ipos.some((i) => i.status === 'active')
    ? 'active'
    : ipos.some((i) => i.status === 'upcoming')
    ? 'upcoming'
    : 'recent';
  const [activeTab, setActiveTab] = useState<IpoStatus>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [katilimFilterOnly, setKatilimFilterOnly] = useState(false);
  const [selectedIpoId, setSelectedIpoId] = useState<string>('');

  const getLivePrice = (ipo: StockIpoItem) => {
    const live = stocks.find((s) => s.symbol.toUpperCase() === ipo.code.toUpperCase());
    if (live && live.close > 0) return live.close;
    return ipo.currentPrice || ipo.offerPrice;
  };

  const getLiveReturnPct = (ipo: StockIpoItem) => {
    if (!ipo.offerPrice || ipo.offerPrice <= 0) return 0;
    const curr = getLivePrice(ipo);
    return Number((((curr - ipo.offerPrice) / ipo.offerPrice) * 100).toFixed(1));
  };

  // Calculator custom participants state
  const [customParticipants, setCustomParticipants] = useState<number>(2500000);

  const filteredIpos = useMemo(() => {
    return ipos.filter((ipo) => {
      if (ipo.status !== activeTab) return false;
      if (katilimFilterOnly && !ipo.katilimEndeksineUygun) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          ipo.code.toLowerCase().includes(q) ||
          ipo.companyName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [ipos, activeTab, katilimFilterOnly, searchQuery]);

  const activeCounts = useMemo(() => {
    return {
      active: ipos.filter((i) => i.status === 'active').length,
      upcoming: ipos.filter((i) => i.status === 'upcoming').length,
      recent: ipos.filter((i) => i.status === 'recent').length,
      draft: ipos.filter((i) => i.status === 'draft').length,
    };
  }, [ipos]);

  const selectedIpo: StockIpoItem | null = useMemo(() => {
    if (filteredIpos.length === 0) return null;
    const match = filteredIpos.find((i) => i.id === selectedIpoId);
    return match || filteredIpos[0];
  }, [selectedIpoId, filteredIpos]);

  const calcResult = useMemo(() => {
    if (!selectedIpo || selectedIpo.offerPrice <= 0) return { lots: 0, cost: 0 };
    return calculateEstimatedLots(
      selectedIpo.totalShares,
      selectedIpo.offerPrice,
      customParticipants
    );
  }, [selectedIpo, customParticipants]);

  const handleAddIpoToPortfolio = (ipo: StockIpoItem, lots: number, price: number) => {
    if (!onAddToPortfolio) return;
    const newPos: StockPortfolioPosition = {
      id: `ipo-pos-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      symbol: ipo.code,
      name: ipo.companyName,
      market: 'bist',
      units: Math.max(1, lots),
      entryPrice: price,
      currentPrice: price,
      stopLoss: Number((price * 0.95).toFixed(2)),
      targetPrice: Number((price * 1.5).toFixed(2)),
      entryDate: new Date().toISOString(),
      status: 'open',
      notes: `Halka Arz Merkezi: ${ipo.code} (${lots} Lot) halka arz fiyatından eklendi`,
    };
    onAddToPortfolio(newPos);
    onShowToast?.(`🚀 ${ipo.code} (${lots} Lot) Sanal Portföye Eklendi!`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-cyan-500/20 border border-indigo-500/40 flex items-center justify-center text-cyan-400 shadow-inner">
              <Rocket className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Borsa İstanbul Halka Arz Merkezi &amp; SPK Takvimi
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full animate-pulse">
                  CANLI AKIŞ
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Talep toplama tarihleri, Katılım Endeksi uygunluğu ve akıllı "Kaç Lot Düşer?" simülatörü
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

        {/* 4 Status Tabs Bar - Responsive 2x2 Grid on Mobile (No scrolling, fully visible) */}
        <div className="border-b border-slate-800 bg-slate-950/60 px-3 sm:px-6 pt-3 pb-2.5 space-y-2.5 lg:space-y-0 lg:flex lg:items-center lg:justify-between lg:gap-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
            {[
              {
                id: 'active',
                label: '🟢 Talep Toplayan',
                count: activeCounts.active,
                badgeColor: 'bg-emerald-500 text-slate-950',
              },
              {
                id: 'upcoming',
                label: '🟡 Yaklaşanlar',
                count: activeCounts.upcoming,
                badgeColor: 'bg-amber-500 text-slate-950',
              },
              {
                id: 'recent',
                label: '📈 İşlem Görenler',
                count: activeCounts.recent,
                badgeColor: 'bg-cyan-500 text-slate-950',
              },
              {
                id: 'draft',
                label: '⚪ SPK Taslaklar',
                count: activeCounts.draft,
                badgeColor: 'bg-slate-700 text-slate-200',
              },
            ].map((t) => {
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setActiveTab(t.id as IpoStatus);
                  }}
                  className={`px-2.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-between gap-1.5 border ${
                    active
                      ? 'border-cyan-500/60 text-cyan-300 bg-cyan-500/15 shadow-sm shadow-cyan-950/40 ring-1 ring-cyan-500/30'
                      : 'border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900 bg-slate-950/40'
                  }`}
                >
                  <span className="truncate">{t.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black shrink-0 ${t.badgeColor}`}
                  >
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Filters: Search + Katılım Endeksi */}
          <div className="flex items-center gap-2 pt-1 lg:pt-0">
            <button
              onClick={() => setKatilimFilterOnly((prev) => !prev)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                katilimFilterOnly
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-500/20'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Yalnızca Diyanet ve BIST Katılım Finansı İlkelerine Uygun Hisseleri Göster"
            >
              <span>🕌 Katılım Endeksi</span>
              {katilimFilterOnly && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
            </button>

            <div className="relative flex-1 lg:w-44">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Halka arz ara..."
                className="w-full pl-7 pr-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>
        </div>

        {/* Modal Body: Left List + Right Detail Workspace */}
        <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row">
          {/* LEFT: IPO Cards List */}
          <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-slate-800 p-3 sm:p-4 space-y-2.5 bg-slate-950/40 shrink-0 overflow-y-auto max-h-[300px] lg:max-h-none">
            {filteredIpos.length === 0 ? (
              <div className="p-5 text-center text-xs text-slate-400 space-y-3">
                <Rocket className="w-8 h-8 text-slate-600 mx-auto" />
                {activeTab === 'active' ? (
                  <div className="space-y-1.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left">
                    <div className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
                      <Info className="w-3.5 h-3.5 shrink-0" />
                      <span>Aktif Talep Toplama Yok</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Borsa İstanbul ve SPK kurallarına göre hafta sonu talep toplama yapılmaz. İşlemler yalnızca hafta içi iş günlerinde gerçekleşir.
                    </p>
                  </div>
                ) : activeTab === 'upcoming' ? (
                  <div className="space-y-1.5 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-left">
                    <div className="font-bold text-indigo-300 flex items-center gap-1.5 text-xs">
                      <Info className="w-3.5 h-3.5 shrink-0" />
                      <span>Tarih Bekleyen Yok</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Şu anda SPK onaylı takvim bekleyen şirket bulunmuyor. Yeni onaylar haftalık SPK bülteninde açıklanır.
                    </p>
                  </div>
                ) : (
                  <div>Bu kategoride halka arz kaydı bulunamadı.</div>
                )}
              </div>
            ) : (
              filteredIpos.map((ipo) => {
                const isSel = selectedIpo?.id === ipo.id;
                return (
                  <div
                    key={ipo.id}
                    onClick={() => setSelectedIpoId(ipo.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                      isSel
                        ? 'bg-gradient-to-br from-indigo-950/70 to-slate-900 border-cyan-400/60 shadow-lg shadow-cyan-950/30'
                        : 'bg-slate-900/80 border-slate-800 hover:bg-slate-850 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-black text-white">{ipo.code}</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-800 text-slate-300">
                            {ipo.pazar}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-300 font-semibold line-clamp-1 mt-0.5">
                          {ipo.companyName}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {ipo.offerPrice > 0 ? (
                          <div className="text-xs font-mono font-black text-cyan-300">
                            {ipo.offerPrice.toFixed(2)} ₺
                          </div>
                        ) : (
                          <div className="text-[10px] text-amber-400 font-bold">Fiyat Bekleniyor</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800/80">
                      <div className="flex items-center gap-1">
                        {ipo.katilimEndeksineUygun ? (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                            🕌 Katılım Uygun
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-medium">
                            Katılım Dışı
                          </span>
                        )}
                      </div>
                      {ipo.status === 'recent' ? (
                        <span
                          className={`font-mono font-black ${
                            getLiveReturnPct(ipo) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {getLiveReturnPct(ipo) >= 0 ? '+' : ''}
                          {getLiveReturnPct(ipo)}% ({ipo.ceilingCount} Tavan)
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono text-[9px]">
                          {ipo.bookBuildingDates.split(' ')[0]}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* RIGHT: Selected IPO Comprehensive Institutional Sheet */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-900/50">
            {selectedIpo ? (
              <div className="space-y-4">
                {/* 1. Header Banner */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 border border-slate-800 shadow-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-2xl font-black text-white tracking-tight">
                          {selectedIpo.code}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-black">
                          {selectedIpo.pazar}
                        </span>
                        {selectedIpo.status === 'active' && (
                          <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black animate-pulse">
                            🟢 TALEP TOPLUYOR
                          </span>
                        )}
                        {selectedIpo.status === 'upcoming' && (
                          <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black">
                            🟡 SPK ONAYLI / TARİH BEKLİYOR
                          </span>
                        )}
                        {selectedIpo.status === 'recent' && (
                          <span className="px-2.5 py-0.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-black">
                            📈 BORSADA İŞLEM GÖRÜYOR
                          </span>
                        )}
                      </div>
                      <h2 className="text-sm font-bold text-slate-300 mt-1">
                        {selectedIpo.companyName}
                      </h2>
                    </div>

                    <div className="text-left sm:text-right">
                      <div className="text-[11px] text-slate-400 font-medium">Halka Arz Fiyatı</div>
                      <div className="text-2xl font-mono font-black text-cyan-300">
                        {selectedIpo.offerPrice > 0 ? `${selectedIpo.offerPrice.toFixed(2)} ₺` : 'Belirlenmedi'}
                      </div>
                    </div>
                  </div>

                  {/* Golden Badges Row: Katılım, T1-T2, Dağıtım */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800">
                    <div
                      className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                        selectedIpo.katilimEndeksineUygun
                          ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                          : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                      }`}
                    >
                      {selectedIpo.katilimEndeksineUygun ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                      )}
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider">
                          Katılım Endeksi
                        </div>
                        <div className="text-xs font-black">
                          {selectedIpo.katilimEndeksineUygun
                            ? '🕌 UYGUN (Helal Finans)'
                            : '❌ UYGUN DEĞİL'}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                        selectedIpo.t1t2Kullanilabilir
                          ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                          : 'bg-amber-950/30 border-amber-500/30 text-amber-300'
                      }`}
                    >
                      <DollarSign className="w-5 h-5 text-amber-400 shrink-0" />
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider">
                          T1-T2 Bakiye
                        </div>
                        <div className="text-xs font-black">
                          {selectedIpo.t1t2Kullanilabilir
                            ? '💳 Kullanılabilir (Hisse Satıp Girilir)'
                            : '⚠️ Kullanılamaz (Nakit Gerekir)'}
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2.5 text-slate-200">
                      <Layers className="w-5 h-5 text-cyan-400 shrink-0" />
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Dağıtım Şekli
                        </div>
                        <div className="text-xs font-black">{selectedIpo.distributionMethod}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Key Metrics Grid: Büyüklük, Tarih, Konsorsiyum */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold block">
                      Talep Toplama Tarihi
                    </span>
                    <span className="text-xs font-bold text-white mt-1 block">
                      {selectedIpo.bookBuildingDates}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold block">
                      Toplam Dağıtılacak Lot
                    </span>
                    <span className="text-xs font-mono font-bold text-white mt-1 block">
                      {selectedIpo.totalShares > 0
                        ? `${(selectedIpo.totalShares / 1e6).toFixed(2)} Mn Lot`
                        : '-'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold block">
                      Halka Arz Büyüklüğü
                    </span>
                    <span className="text-xs font-mono font-bold text-cyan-300 mt-1 block">
                      {selectedIpo.totalSizeTl > 0
                        ? `${(selectedIpo.totalSizeTl / 1e6).toFixed(1)} Mn ₺`
                        : '-'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold block">
                      Konsorsiyum Lideri
                    </span>
                    <span className="text-xs font-bold text-white mt-1 block truncate" title={selectedIpo.leadUnderwriter}>
                      {selectedIpo.leadUnderwriter}
                    </span>
                  </div>
                </div>

                {/* 3. Tavan Serisi Karnesi (Eğer Borsada Yeni Başladıysa) */}
                {selectedIpo.status === 'recent' && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-cyan-950/40 border border-emerald-500/40 shadow-lg space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-emerald-300">
                          Borsa Tavan Karnesi &amp; Canlı Getiri
                        </h4>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-black">
                        {selectedIpo.firstTradingDate}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                      <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Arz Fiyatı</span>
                        <span className="font-mono font-black text-white">
                          {selectedIpo.offerPrice.toFixed(2)} ₺
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Güncel Borsa Fiyatı</span>
                        <span className="font-mono font-black text-cyan-300">
                          {getLivePrice(selectedIpo).toFixed(2)} ₺
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Tavan Sayısı</span>
                        <span className="font-mono font-black text-amber-400">
                          🔥 {selectedIpo.ceilingCount} Tavan
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Halka Arzdan Getiri</span>
                        <span
                          className={`font-mono font-black ${
                            getLiveReturnPct(selectedIpo) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {getLiveReturnPct(selectedIpo) >= 0 ? '+' : ''}
                          {getLiveReturnPct(selectedIpo)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. 🧮 "KAÇ LOT DÜŞER?" İNTERAKTİF SİMÜLATÖRÜ */}
                {selectedIpo.offerPrice > 0 && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-cyan-500/30 shadow-xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                          <Calculator className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider text-cyan-300">
                            🧮 Kaç Lot Düşer? Dağıtım Simülatörü
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            Katılımcı sayısına göre kişi başı tahmini lot ve gereken nakit bütçesi
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400">Önerilen Bütçe: </span>
                        <span className="text-xs font-mono font-black text-emerald-400">
                          {calcResult.cost.toLocaleString('tr-TR')} ₺
                        </span>
                      </div>
                    </div>

                    {/* Quick Preset Buttons for Participant Count */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-semibold">
                          Tahmini Başvuru Sayısı:{' '}
                          <strong className="text-cyan-300 font-mono">
                            {(customParticipants / 1e6).toFixed(1)} Milyon Kişi
                          </strong>
                        </span>
                        <div className="flex items-center gap-1.5">
                          {[1500000, 2000000, 2500000, 3000000, 3500000].map((count) => (
                            <button
                              key={count}
                              onClick={() => setCustomParticipants(count)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                                customParticipants === count
                                  ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              {(count / 1e6).toFixed(1)}M
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Slider Input */}
                      <input
                        type="range"
                        min="1000000"
                        max="4000000"
                        step="100000"
                        value={customParticipants}
                        onChange={(e) => setCustomParticipants(Number(e.target.value))}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>

                    {/* Result Callout & 1-Click Portfolio Add */}
                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-950 border border-cyan-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-xs text-slate-300">
                          {(customParticipants / 1e6).toFixed(1)} Milyon Katılımda Düşecek Pay:
                        </div>
                        <div className="text-base sm:text-lg font-black text-white flex items-center gap-2 mt-0.5">
                          <span className="text-cyan-300 font-mono">
                            ~{calcResult.lots} Lot
                          </span>
                          <span className="text-slate-500">&bull;</span>
                          <span className="text-emerald-400 font-mono">
                            {calcResult.cost.toFixed(2)} ₺
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          handleAddIpoToPortfolio(
                            selectedIpo,
                            calcResult.lots,
                            selectedIpo.offerPrice
                          )
                        }
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Briefcase className="w-4 h-4 text-slate-950" />
                        <span>Bu Tutarı Sanal Portföye Ekle</span>
                      </button>
                    </div>

                    {/* Official Breakdown Table */}
                    {selectedIpo.estimatedLotsByParticipants.length > 0 && (
                      <div className="overflow-x-auto rounded-xl border border-slate-800">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-900/80 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                            <tr>
                              <th className="py-2 px-3">Katılımcı Sayısı</th>
                              <th className="py-2 px-3">Tahmini Dağıtım</th>
                              <th className="py-2 px-3 text-right">Gereken Bütçe (₺)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/70 text-slate-300">
                            {selectedIpo.estimatedLotsByParticipants.map((row) => (
                              <tr key={row.participantsLabel} className="hover:bg-slate-900/50">
                                <td className="py-2 px-3 font-medium">{row.participantsLabel}</td>
                                <td className="py-2 px-3 font-mono font-bold text-cyan-300">
                                  {row.lots} Lot
                                </td>
                                <td className="py-2 px-3 font-mono font-bold text-right text-emerald-400">
                                  {row.totalCostTl.toLocaleString('tr-TR', {
                                    minimumFractionDigits: 2,
                                  })}{' '}
                                  ₺
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* 5. Fon Kullanım Yeri & Taahhütler */}
                {selectedIpo.useOfProceeds.length > 0 && (
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-cyan-400" />
                      <span>Halka Arz Gelirinin Kullanım Yeri</span>
                    </h4>
                    <div className="space-y-1.5">
                      {selectedIpo.useOfProceeds.map((use) => (
                        <div key={use.category} className="space-y-0.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-300">{use.category}</span>
                            <span className="font-mono font-black text-cyan-300">%{use.pct}</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-cyan-400"
                              style={{ width: `${use.pct}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full min-h-[380px] flex flex-col items-center justify-center text-center p-6 sm:p-10 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                  <Calendar className="w-8 h-8 text-amber-400" />
                </div>
                <div className="max-w-md space-y-2">
                  <h3 className="text-base font-black text-white">
                    {activeTab === 'upcoming'
                      ? 'Şu Anda SPK Onaylı Tarih Bekleyen Halka Arz Bulunmuyor'
                      : 'Şu Anda Aktif Talep Toplayan Halka Arz Bulunmuyor'}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {activeTab === 'upcoming'
                      ? 'SPK haftalık bülteninde onay alan şirketler onaylandığı gün burada listelenir ve talep toplama takvimi ilan edilir.'
                      : 'Borsa İstanbul ve SPK mevzuatı gereği talep toplama işlemleri yalnızca hafta içi resmi iş günlerinde (10:30-13:00 veya 09:00-17:00) gerçekleştirilir. Hafta sonu talep toplama yapılmaz.'}
                  </p>
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 text-left space-y-1.5 mt-3">
                    <div className="text-cyan-300 font-bold flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>SPK Onay ve Takvim Takibi</span>
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                      SPK bültenleri her hafta Perşembe gecesi yayımlanır. Onay alan yeni şirketler onaylandığı an takvime eklenir. Borsada işlem gören güncel halka arzların tavan karnelerini ve taslak izahnameleri inceleyebilirsiniz.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setActiveTab('recent')}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-lg shadow-cyan-950/40 cursor-pointer"
                  >
                    📈 Son İşlem Gören Tavan Serileri ({activeCounts.recent})
                  </button>
                  <button
                    onClick={() => setActiveTab('draft')}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all border border-slate-700 cursor-pointer"
                  >
                    📋 SPK Taslak İzahnameler ({activeCounts.draft})
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span className="text-[11px]">
              Veriler SPK bültenleri ve KAP izahnamelerinden derlenmektedir. (YTD)
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
