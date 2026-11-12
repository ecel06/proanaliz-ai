import React, { useState } from 'react';
import {
  Briefcase,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  CheckCircle2,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  X,
  History,
  ShieldCheck,
} from 'lucide-react';
import { StockPortfolioPosition, StockMarketType } from '../../types/stocks';

interface StockPortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  positions: StockPortfolioPosition[];
  onClosePosition: (id: string, exitPrice: number) => void;
  onDeletePosition: (id: string) => void;
  onAddPosition: (pos: StockPortfolioPosition) => void;
  onResetPortfolio: () => void;
}

export const StockPortfolioModal: React.FC<StockPortfolioModalProps> = ({
  isOpen,
  onClose,
  positions,
  onClosePosition,
  onDeletePosition,
  onAddPosition,
  onResetPortfolio,
}) => {
  const [activeTab, setActiveTab] = useState<'open' | 'history' | 'add'>('open');
  const [closingPosId, setClosingPosId] = useState<string | null>(null);
  const [exitPriceInput, setExitPriceInput] = useState<number>(0);

  // Manual Add Form State
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [market, setMarket] = useState<StockMarketType>('bist');
  const [units, setUnits] = useState<number>(100);
  const [entryPrice, setEntryPrice] = useState<number>(0);
  const [stopLoss, setStopLoss] = useState<number | ''>('');
  const [targetPrice, setTargetPrice] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const openPositions = positions.filter((p) => p.status === 'open');
  const closedPositions = positions.filter((p) => p.status === 'closed');

  const INITIAL_CASH = 100000;

  // Compute Open PnL
  const openPnLTl = openPositions
    .filter((p) => p.market === 'bist')
    .reduce((sum, p) => sum + (p.currentPrice - p.entryPrice) * p.units, 0);

  const openPnLUsd = openPositions
    .filter((p) => p.market !== 'bist')
    .reduce((sum, p) => sum + (p.currentPrice - p.entryPrice) * p.units, 0);

  // Compute Realized PnL
  const realizedPnLTl = closedPositions
    .filter((p) => p.market === 'bist')
    .reduce((sum, p) => sum + ((p.exitPrice || p.entryPrice) - p.entryPrice) * p.units, 0);

  const realizedPnLUsd = closedPositions
    .filter((p) => p.market !== 'bist')
    .reduce((sum, p) => sum + ((p.exitPrice || p.entryPrice) - p.entryPrice) * p.units, 0);

  const totalInvestedTl = openPositions
    .filter((p) => p.market === 'bist')
    .reduce((sum, p) => sum + p.entryPrice * p.units, 0);

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol.trim() || units <= 0 || entryPrice <= 0) return;

    const newPos: StockPortfolioPosition = {
      id: `pos-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      symbol: symbol.trim().toUpperCase(),
      name: name.trim() || symbol.trim().toUpperCase(),
      market,
      units,
      entryPrice,
      currentPrice: entryPrice,
      stopLoss: typeof stopLoss === 'number' ? stopLoss : null,
      targetPrice: typeof targetPrice === 'number' ? targetPrice : null,
      entryDate: new Date().toISOString(),
      status: 'open',
      notes: notes.trim() || undefined,
    };

    onAddPosition(newPos);
    setSymbol('');
    setName('');
    setEntryPrice(0);
    setStopLoss('');
    setTargetPrice('');
    setNotes('');
    setActiveTab('open');
  };

  const startClosing = (pos: StockPortfolioPosition) => {
    setClosingPosId(pos.id);
    setExitPriceInput(pos.currentPrice);
  };

  const confirmClose = (id: string) => {
    if (exitPriceInput <= 0) return;
    onClosePosition(id, exitPriceInput);
    setClosingPosId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-sky-950/20 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Sanal Portföy & İşlem Defteri (Paper Trading)
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-full">
                  CANLI SİMÜLASYON
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Gerçek sermayenizi riske atmadan Lot Mühendisi ve algoritmik sinyalleri simüle edin
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

        {/* Top Summary Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:p-5 bg-slate-950/50 border-b border-slate-800">
          <div className="p-3 rounded-xl bg-slate-850/60 border border-slate-700/50">
            <span className="text-[11px] text-slate-400 font-medium">Bağlanan Sermaye (BIST)</span>
            <div className="text-base sm:text-lg font-bold text-white mt-1">
              {totalInvestedTl.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
            </div>
            <span className="text-[10px] text-slate-400">{openPositions.length} Açık Pozisyon</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-850/60 border border-slate-700/50">
            <span className="text-[11px] text-slate-400 font-medium">Açık Kar / Zarar (BIST)</span>
            <div
              className={`text-base sm:text-lg font-bold mt-1 flex items-center gap-1 ${
                openPnLTl >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {openPnLTl >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {openPnLTl >= 0 ? '+' : ''}
              {openPnLTl.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
            </div>
            <span className="text-[10px] text-slate-400">Canlı PnL</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-850/60 border border-slate-700/50">
            <span className="text-[11px] text-slate-400 font-medium">Gerçekleşen Kar (BIST)</span>
            <div
              className={`text-base sm:text-lg font-bold mt-1 ${
                realizedPnLTl >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {realizedPnLTl >= 0 ? '+' : ''}
              {realizedPnLTl.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
            </div>
            <span className="text-[10px] text-slate-400">{closedPositions.length} Kapanan İşlem</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-850/60 border border-slate-700/50">
            <span className="text-[11px] text-slate-400 font-medium">Açık Kar/Zarar (ABD/Kripto)</span>
            <div
              className={`text-base sm:text-lg font-bold mt-1 flex items-center gap-1 ${
                openPnLUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {openPnLUsd >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {openPnLUsd >= 0 ? '+' : ''}${openPnLUsd.toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-400">Dolar Bazlı Varlıklar</span>
          </div>
        </div>

        {/* Tab Header */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-5 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('open')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'open'
                ? 'border-sky-500 text-sky-400 bg-slate-900/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              <span>Açık Pozisyonlar ({openPositions.length})</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'history'
                ? 'border-sky-500 text-sky-400 bg-slate-900/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4" />
              <span>Kapatılan İşlemler ({closedPositions.length})</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'add'
                ? 'border-sky-500 text-sky-400 bg-slate-900/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Manuel Pozisyon Ekle</span>
            </div>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'open' && (
            <>
              {openPositions.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-slate-800/20 border border-slate-800 space-y-3">
                  <Briefcase className="w-10 h-10 text-slate-600 mx-auto" />
                  <div className="text-sm font-semibold text-slate-300">Henüz Açık Pozisyonunuz Yok</div>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Hisse detay sayfasındaki <strong>"Lot Mühendisi"</strong> panelinden tek tıkla sanal portföye pozisyon ekleyebilir veya yukarıdaki form ile manuel giriş yapabilirsiniz.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-900/60 border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-3">Hisse</th>
                        <th className="py-3 px-3">Lot / Adet</th>
                        <th className="py-3 px-3">Giriş Fiyatı</th>
                        <th className="py-3 px-3">Güncel Fiyat</th>
                        <th className="py-3 px-3">Stop / Hedef</th>
                        <th className="py-3 px-3">Açık Kar / Zarar</th>
                        <th className="py-3 px-3 text-right">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 text-slate-300">
                      {openPositions.map((pos) => {
                        const curPrice = pos.currentPrice || pos.entryPrice;
                        const pnlVal = (curPrice - pos.entryPrice) * pos.units;
                        const pnlPct = ((curPrice - pos.entryPrice) / pos.entryPrice) * 100;
                        const isProfit = pnlVal >= 0;
                        const currency = pos.market === 'bist' ? '₺' : '$';

                        const isClosingThis = closingPosId === pos.id;

                        return (
                          <tr key={pos.id} className="hover:bg-slate-850/50 transition-colors">
                            <td className="py-3 px-3">
                              <div className="font-bold text-white">{pos.symbol}</div>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-semibold uppercase">
                                {pos.market}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-slate-200">
                              {pos.units.toLocaleString()}
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-300">
                              {pos.entryPrice.toFixed(2)} {currency}
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-white">
                              {curPrice.toFixed(2)} {currency}
                            </td>
                            <td className="py-3 px-3 text-[11px] font-mono space-y-0.5">
                              {pos.stopLoss ? (
                                <div className="text-rose-400">Stop: {pos.stopLoss.toFixed(2)}</div>
                              ) : (
                                <div className="text-slate-400">Stop: -</div>
                              )}
                              {pos.targetPrice ? (
                                <div className="text-emerald-400">Hedef: {pos.targetPrice.toFixed(2)}</div>
                              ) : (
                                <div className="text-slate-400">Hedef: -</div>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <div
                                className={`font-mono font-bold flex items-center gap-1 ${
                                  isProfit ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {isProfit ? '+' : ''}
                                {pnlVal.toFixed(2)} {currency}
                                <span className="text-[10px] font-semibold">
                                  ({isProfit ? '+' : ''}
                                  {pnlPct.toFixed(2)}%)
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right">
                              {isClosingThis ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <input
                                    type="number"
                                    step="any"
                                    value={exitPriceInput}
                                    onChange={(e) => setExitPriceInput(parseFloat(e.target.value) || 0)}
                                    className="w-20 px-2 py-1 bg-slate-900 border border-sky-500 rounded text-xs text-white font-mono"
                                  />
                                  <button
                                    onClick={() => confirmClose(pos.id)}
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold"
                                  >
                                    Kapat
                                  </button>
                                  <button
                                    onClick={() => setClosingPosId(null)}
                                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
                                  >
                                    İptal
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => startClosing(pos)}
                                    className="px-2.5 py-1 bg-sky-600/30 hover:bg-sky-600 text-sky-200 hover:text-white rounded-lg text-xs font-semibold transition-colors border border-sky-500/30"
                                  >
                                    Pozisyonu Kapat
                                  </button>
                                  <button
                                    onClick={() => onDeletePosition(pos.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                                    title="Sil"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {activeTab === 'history' && (
            <>
              {closedPositions.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-slate-800/20 border border-slate-800 space-y-3">
                  <History className="w-10 h-10 text-slate-600 mx-auto" />
                  <div className="text-sm font-semibold text-slate-300">Henüz Kapatılmış Bir İşlem Bulunmuyor</div>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Açık pozisyonlarınızı kapattığınızda gerçekleşen karlarınız ve başarı oranınız burada arşivlenir.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-900/60 border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-3">Hisse</th>
                        <th className="py-3 px-3">Adet</th>
                        <th className="py-3 px-3">Alış</th>
                        <th className="py-3 px-3">Kapanış</th>
                        <th className="py-3 px-3">Gerçekleşen Kar/Zarar</th>
                        <th className="py-3 px-3">Kapanış Tarihi</th>
                        <th className="py-3 px-3 text-right">Sil</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 text-slate-300">
                      {closedPositions.map((pos) => {
                        const exitPrice = pos.exitPrice || pos.entryPrice;
                        const pnlVal = (exitPrice - pos.entryPrice) * pos.units;
                        const pnlPct = ((exitPrice - pos.entryPrice) / pos.entryPrice) * 100;
                        const isProfit = pnlVal >= 0;
                        const currency = pos.market === 'bist' ? '₺' : '$';

                        return (
                          <tr key={pos.id} className="hover:bg-slate-850/50 transition-colors">
                            <td className="py-3 px-3 font-bold text-white">{pos.symbol}</td>
                            <td className="py-3 px-3 font-mono">{pos.units.toLocaleString()}</td>
                            <td className="py-3 px-3 font-mono">
                              {pos.entryPrice.toFixed(2)} {currency}
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-white">
                              {exitPrice.toFixed(2)} {currency}
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`font-mono font-bold ${
                                  isProfit ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {isProfit ? '+' : ''}
                                {pnlVal.toFixed(2)} {currency} ({isProfit ? '+' : ''}
                                {pnlPct.toFixed(2)}%)
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-400 text-[11px]">
                              {pos.exitDate ? new Date(pos.exitDate).toLocaleDateString('tr-TR') : '-'}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => onDeletePosition(pos.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {activeTab === 'add' && (
            <form
              onSubmit={handleManualAdd}
              className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-4 max-w-xl mx-auto"
            >
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-sky-400" />
                Yeni Sanal Pozisyon Girişi
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Hisse Sembolü</label>
                  <input
                    type="text"
                    required
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    placeholder="THYAO, NVDA..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono uppercase text-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Piyasa</label>
                  <select
                    value={market}
                    onChange={(e) => setMarket(e.target.value as StockMarketType)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
                  >
                    <option value="bist">Borsa İstanbul (BIST)</option>
                    <option value="us">ABD Borsaları</option>
                    <option value="crypto">Kripto Varlıklar</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Lot / Adet</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={units}
                    onChange={(e) => setUnits(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Alış Fiyatı</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={entryPrice || ''}
                    onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
                    placeholder="284.50"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Stop-Loss (Zarar Kes)</label>
                  <input
                    type="number"
                    step="any"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="Opsiyonel"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Hedef Fiyat (Kar Al)</label>
                  <input
                    type="number"
                    step="any"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="Opsiyonel"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Strateji Notu</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Örn: 200 EMA desteği kırılım testi..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 transition-colors shadow-lg shadow-sky-500/10"
                >
                  Pozisyonu Kaydet
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <span>Sanal portföy verileriniz güvenle tarayıcınızda saklanır.</span>
          </div>
          <div className="flex items-center gap-2">
            {positions.length > 0 && (
              <button
                onClick={onResetPortfolio}
                className="px-3 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-950/30 transition-colors"
              >
                Portföyü Sıfırla
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
