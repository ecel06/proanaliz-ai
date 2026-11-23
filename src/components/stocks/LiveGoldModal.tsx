// src/components/stocks/LiveGoldModal.tsx
// Canlı Altın Piyasası Merkezi: Spot Gösterge vs. Kapalıçarşı Serbest Piyasa
import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Coins,
  Scale,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Calculator,
  Info,
  ShieldCheck,
  Building2,
  Globe2,
  Check,
  ArrowUpRight
} from 'lucide-react';

export interface GoldItem {
  id: string;
  name: string;
  shortName: string;
  buying: number;
  selling: number;
  spread: number;
  changePct: number;
  isGram?: boolean;
  isSilver?: boolean;
}

export interface LiveGoldResponse {
  success: boolean;
  updateDate: string;
  timestamp: number;
  spot: {
    ons: number;
    usdTry: number;
    gramAltin: number;
    ceyrekAltin: number;
  };
  kapalicarsi: {
    premiumTL: number;
    premiumPct: number;
    items: GoldItem[];
  };
}

interface LiveGoldModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LiveGoldModal: React.FC<LiveGoldModalProps> = ({ isOpen, onClose }) => {
  const [data, setData] = useState<LiveGoldResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeCategory, setActiveCategory] = useState<'all' | 'ziynet' | 'gram' | 'bilezik'>('all');
  const [calcAmount, setCalcAmount] = useState<number>(1);
  const [calcSelectedId, setCalcSelectedId] = useState<string>('gram-altin');
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('');

  const fetchGoldData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/gold/live?force=true');
      if (res.ok) {
        const json: LiveGoldResponse = await res.json();
        if (json.success) {
          setData(json);
          setLastUpdatedTime(new Date().toLocaleTimeString('tr-TR'));
        }
      }
    } catch (e) {
      console.warn('Altın verisi çekilemedi:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchGoldData();
      const timer = setInterval(fetchGoldData, 30000); // 30 saniyede bir otomatik yenile
      return () => clearInterval(timer);
    }
  }, [isOpen]);

  const items = data?.kapalicarsi?.items || [];
  const spot = data?.spot;
  const premium = data?.kapalicarsi;

  const filteredItems = useMemo(() => {
    if (activeCategory === 'all') return items;
    if (activeCategory === 'ziynet') {
      return items.filter((i) =>
        ['ceyrek-altin', 'yarim-altin', 'tam-altin', 'cumhuriyet-altini', 'ata-altin', 'resat-altin', 'gremse-altin'].includes(i.id)
      );
    }
    if (activeCategory === 'gram') {
      return items.filter((i) => ['gram-altin', 'gram-has-altin', 'gumus'].includes(i.id));
    }
    if (activeCategory === 'bilezik') {
      return items.filter((i) => ['22-ayar-bilezik', '18-ayar-altin', '14-ayar-altin'].includes(i.id));
    }
    return items;
  }, [items, activeCategory]);

  const selectedCalcItem = useMemo(() => {
    return items.find((i) => i.id === calcSelectedId) || items[0];
  }, [items, calcSelectedId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-2xl bg-[#090d16] border border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.15)] flex flex-col max-h-[94vh] overflow-hidden">
        
        {/* Üst Başlık Barı */}
        <div className="px-4 py-3 bg-[#0f1422] border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm sm:text-base font-black text-white">Canlı Altın Piyasası</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  🏛️ Kapalıçarşı &amp; Spot
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Fiziki Kapalıçarşı serbest piyasa alış-satış oranları ve bankalararası gösterge
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchGoldData}
              disabled={isLoading}
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs font-bold flex items-center space-x-1 cursor-pointer"
              title="Fiyatları Yenile"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Yenile</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-rose-600 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Kaydırılabilir İçerik */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
          
          {/* 3 Ana Karşılaştırma Kartı (Spot vs Kapalıçarşı vs Prim) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3.5">
            
            {/* 1. Spot (Gösterge) Fiyatı */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Spot Gram Altın (Gösterge)</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">XAU/USD × USD/TRY</span>
              </div>
              <div className="my-1 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
                  {spot?.gramAltin?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                </span>
              </div>
              <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
                <span>Ons: <b className="text-slate-200 font-mono">${spot?.ons?.toLocaleString('tr-TR')}</b></span>
                <span>Dolar: <b className="text-slate-200 font-mono">{spot?.usdTry?.toFixed(2)} ₺</b></span>
              </div>
            </div>

            {/* 2. Kapalıçarşı Fiziki Fiyatı */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-950/30 to-slate-950 border border-amber-500/40 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Kapalıçarşı Fiziki Gram</span>
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  SERBEST PİYASA
                </span>
              </div>
              <div className="my-1 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400 tracking-tight">
                  {items.find((i) => i.isGram)?.selling?.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) || '---'} ₺
                </span>
              </div>
              <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
                <span>Alış: <b className="text-white font-mono">{items.find((i) => i.isGram)?.buying?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</b></span>
                <span>Makas: <b className="text-amber-300 font-mono">{items.find((i) => i.isGram)?.spread?.toFixed(2)} ₺</b></span>
              </div>
            </div>

            {/* 3. Fiziki Çarşı Primi (Fark) */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Fiziki Çarşı Primi (Fark)</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-black">
                  +{premium?.premiumPct?.toFixed(2)}%
                </span>
              </div>
              <div className="my-1 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 tracking-tight">
                  +{premium?.premiumTL?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                </span>
              </div>
              <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/80 leading-tight">
                Kuyumculardaki fiziki teslimat, kota ve işçilik farkıdır.
              </p>
            </div>
          </div>

          {/* Kategori Filtre Butonları */}
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeCategory === 'all'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Tümü ({items.length})
            </button>
            <button
              onClick={() => setActiveCategory('gram')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeCategory === 'gram'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              🪙 Gram &amp; Külçe
            </button>
            <button
              onClick={() => setActiveCategory('ziynet')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeCategory === 'ziynet'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              👑 Sikke &amp; Ziynet (Çeyrek, Ata, Cumhuriyet)
            </button>
            <button
              onClick={() => setActiveCategory('bilezik')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeCategory === 'bilezik'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              💍 Bilezik &amp; Ayar
            </button>
          </div>

          {/* Kapalıçarşı Canlı Fiyat Tablosu */}
          <div className="rounded-2xl border border-slate-800 bg-[#0b101c] overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-400">
                    <th className="py-2.5 px-3 sm:px-4">Altın Cinsi</th>
                    <th className="py-2.5 px-3 sm:px-4 text-right">Alış (Kuyumcunun Aldığı)</th>
                    <th className="py-2.5 px-3 sm:px-4 text-right">Satış (Sizin Aldığınız)</th>
                    <th className="py-2.5 px-3 sm:px-4 text-right hidden sm:table-cell">Makas (Fark)</th>
                    <th className="py-2.5 px-3 sm:px-4 text-right">Günlük (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs sm:text-sm">
                  {filteredItems.map((item) => {
                    const isPos = item.changePct >= 0;
                    return (
                      <tr key={item.id} className="hover:bg-slate-850/60 transition-colors">
                        <td className="py-3 px-3 sm:px-4 font-bold text-white flex items-center space-x-2">
                          <span className="text-base">{item.isSilver ? '⚪' : '🪙'}</span>
                          <span className="truncate max-w-[150px] sm:max-w-none">{item.name}</span>
                        </td>
                        <td className="py-3 px-3 sm:px-4 text-right font-mono font-bold text-slate-200">
                          {item.buying.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                        </td>
                        <td className="py-3 px-3 sm:px-4 text-right font-mono font-black text-amber-400">
                          {item.selling.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                        </td>
                        <td className="py-3 px-3 sm:px-4 text-right font-mono text-slate-400 text-xs hidden sm:table-cell">
                          {item.spread.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                        </td>
                        <td className="py-3 px-3 sm:px-4 text-right font-mono font-black text-xs">
                          <span className={`inline-flex items-center space-x-0.5 ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            <span>{isPos ? '+' : ''}{item.changePct}%</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 🧮 Akıllı Altın Değer Hesaplayıcı (Converter) */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-[#111625] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-xs font-black text-amber-400 uppercase tracking-wider">
                <Calculator className="w-4 h-4" />
                <span>Pratik Altın Değer Hesaplayıcı</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Elinizdeki altının Kapalıçarşı nakit bozdurma veya satın alma toplamını hesaplayın.
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <input
                type="number"
                min="0.1"
                step="1"
                value={calcAmount}
                onChange={(e) => setCalcAmount(Math.max(0.1, parseFloat(e.target.value) || 1))}
                className="w-16 sm:w-20 px-2.5 py-1.5 rounded-xl bg-black border border-slate-700 text-white font-mono font-bold text-center text-sm focus:border-amber-400 outline-none"
              />
              <select
                value={calcSelectedId}
                onChange={(e) => setCalcSelectedId(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-black border border-slate-700 text-white font-bold text-xs focus:border-amber-400 outline-none cursor-pointer"
              >
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.shortName}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-3 bg-black/60 px-3 py-2 rounded-xl border border-slate-800 shrink-0">
              <div>
                <span className="text-[10px] text-slate-400 block">Bozdurursanız (Alış):</span>
                <span className="font-mono text-sm sm:text-base font-black text-emerald-400">
                  {((selectedCalcItem?.buying || 0) * calcAmount).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
                </span>
              </div>
              <span className="w-px h-6 bg-slate-800" />
              <div>
                <span className="text-[10px] text-slate-400 block">Alırsanız (Satış):</span>
                <span className="font-mono text-sm sm:text-base font-black text-amber-400">
                  {((selectedCalcItem?.selling || 0) * calcAmount).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
                </span>
              </div>
            </div>
          </div>

          {/* ℹ️ Bilgilendirme Notu */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start space-x-2.5 text-[11px] text-slate-400">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-slate-300">Neden Fiyat Farkı Var?</span>
              <p>
                <b>Spot Fiyat:</b> Dünya altın borsasındaki (Ons) ve bankalararası Dolar kurunun teorik ham maliyetidir.  
                <b> Kapalıçarşı Fiyatı:</b> Türkiye'deki fiziki altın ithalat kotaları, nakliye, sigorta ve kuyumcu fiziki teslimat primini içerir.
              </p>
            </div>
          </div>

        </div>

        {/* Alt Bilgi */}
        <div className="px-4 py-2.5 bg-[#090d16] border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Canlı Veri Yayını • Son Güncelleme: {lastUpdatedTime || data?.updateDate || 'Az önce'}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>

      </div>
    </div>
  );
};
