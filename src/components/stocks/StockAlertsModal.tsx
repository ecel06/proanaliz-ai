import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, Volume2, CheckCircle2, AlertCircle, X, ShieldAlert } from 'lucide-react';
import { StockAlertItem, StockItem, AlertConditionType, StockMarketType } from '../../types/stocks';

interface StockAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStock?: StockItem | null;
  alerts: StockAlertItem[];
  onSaveAlert: (alert: StockAlertItem) => void;
  onDeleteAlert: (id: string) => void;
  onClearTriggered: () => void;
}

export const playAlertSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
    osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.24); // D6
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch {}
};

export const StockAlertsModal: React.FC<StockAlertsModalProps> = ({
  isOpen,
  onClose,
  currentStock,
  alerts,
  onSaveAlert,
  onDeleteAlert,
  onClearTriggered,
}) => {
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [market, setMarket] = useState<StockMarketType>('bist');
  const [condition, setCondition] = useState<AlertConditionType>('price_above');
  const [targetValue, setTargetValue] = useState<number>(0);
  const [note, setNote] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (currentStock) {
      setSymbol(currentStock.symbol);
      setName(currentStock.name || currentStock.symbol);
      setMarket(currentStock.market);
      if (condition === 'price_above') {
        setTargetValue(Number((currentStock.close * 1.05).toFixed(2)));
      } else if (condition === 'price_below') {
        setTargetValue(Number((currentStock.close * 0.95).toFixed(2)));
      } else if (condition === 'rsi_below') {
        setTargetValue(30);
      } else if (condition === 'rsi_above') {
        setTargetValue(70);
      }
      setShowAddForm(true);
    }
  }, [currentStock]);

  const handleConditionChange = (c: AlertConditionType) => {
    setCondition(c);
    if (!currentStock) return;
    if (c === 'price_above') {
      setTargetValue(Number((currentStock.close * 1.05).toFixed(2)));
    } else if (c === 'price_below') {
      setTargetValue(Number((currentStock.close * 0.95).toFixed(2)));
    } else if (c === 'rsi_below') {
      setTargetValue(30);
    } else if (c === 'rsi_above') {
      setTargetValue(70);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol.trim() || targetValue <= 0) return;

    const newAlert: StockAlertItem = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      symbol: symbol.trim().toUpperCase(),
      name: name.trim() || symbol.trim().toUpperCase(),
      market,
      condition,
      targetValue,
      initialValue: currentStock?.close,
      note: note.trim() || undefined,
      createdAt: new Date().toISOString(),
      triggered: false,
    };

    onSaveAlert(newAlert);
    setNote('');
    setShowAddForm(false);
  };

  if (!isOpen) return null;

  const triggeredCount = alerts.filter((a) => a.triggered).length;
  const activeCount = alerts.length - triggeredCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Akıllı Fiyat & RSI Alarm Merkezi
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full">
                  {activeCount} Aktif / {triggeredCount} Tetiklendi
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Belirlediğiniz hedef fiyat, stop-loss veya RSI seviyelerinde anlık sesli ve görsel bildirim alın
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={playAlertSound}
              title="Ses Testi"
              className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 rounded-lg transition-colors"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-lg shadow-amber-500/10"
            >
              <Plus className="w-4 h-4" />
              <span>{showAddForm ? 'Formu Kapat' : 'Yeni Alarm Oluştur'}</span>
            </button>
            {triggeredCount > 0 && (
              <button
                onClick={onClearTriggered}
                className="text-xs text-slate-400 hover:text-rose-400 transition-colors"
              >
                Tetiklenenleri Temizle ({triggeredCount})
              </button>
            )}
          </div>

          {/* Add Form */}
          {showAddForm && (
            <form
              onSubmit={handleCreate}
              className="p-4 rounded-xl bg-slate-800/50 border border-amber-500/30 space-y-4 animate-in slide-in-from-top-2 duration-200"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Hisse Sembolü
                  </label>
                  <input
                    type="text"
                    required
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    placeholder="THYAO, AAPL..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-sm uppercase focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Piyasa
                  </label>
                  <select
                    value={market}
                    onChange={(e) => setMarket(e.target.value as StockMarketType)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="bist">Borsa İstanbul (BIST)</option>
                    <option value="us">ABD (NASDAQ / NYSE)</option>
                    <option value="crypto">Kripto Varlıklar</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Alarm Koşulu
                  </label>
                  <select
                    value={condition}
                    onChange={(e) => handleConditionChange(e.target.value as AlertConditionType)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="price_above">📈 Fiyat Üzerine Çıkınca (Hedef)</option>
                    <option value="price_below">📉 Fiyat Altına İnerse (Stop-Loss)</option>
                    <option value="rsi_below">🎯 RSI Aşırı Satım Dip (RSI &lt;= 30)</option>
                    <option value="rsi_above">⚠️ RSI Aşırı Alım Tepe (RSI &gt;= 70)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    {condition.startsWith('rsi') ? 'Hedef RSI Değeri' : 'Tetiklenme Fiyatı'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={targetValue || ''}
                    onChange={(e) => setTargetValue(parseFloat(e.target.value) || 0)}
                    placeholder={condition.startsWith('rsi') ? '30 veya 70' : 'Örn: 310.50'}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Özel Not (Opsiyonel)
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Direnç kırılımı alarmı, ek alım yap..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors"
                >
                  Alarmı Kaydet
                </button>
              </div>
            </form>
          )}

          {/* Alarm List */}
          {alerts.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-slate-800/20 border border-slate-800 space-y-3">
              <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="text-sm font-semibold text-slate-300">Henüz Tanımlı Alarm Bulunmuyor</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Herhangi bir hissenin detay sayfasından veya yukarıdaki "Yeni Alarm Oluştur" butonuyla anlık fiyat ve RSI alarmları kurabilirsiniz.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {alerts.map((alert) => {
                const isPriceAbove = alert.condition === 'price_above';
                const isPriceBelow = alert.condition === 'price_below';
                const isRsiBelow = alert.condition === 'rsi_below';
                const isRsiAbove = alert.condition === 'rsi_above';

                return (
                  <div
                    key={alert.id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                      alert.triggered
                        ? 'bg-rose-950/20 border-rose-800/40'
                        : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          alert.triggered
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {alert.triggered ? <AlertCircle className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{alert.symbol}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-700 text-slate-300 font-semibold uppercase">
                            {alert.market}
                          </span>
                          {alert.triggered ? (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                              TETİKLENDİ
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                              Aktif
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-300 mt-0.5">
                          {isPriceAbove && (
                            <span>
                              Fiyat <span className="font-mono font-bold text-emerald-400">{alert.targetValue}</span> üzerine çıkınca
                            </span>
                          )}
                          {isPriceBelow && (
                            <span>
                              Fiyat <span className="font-mono font-bold text-rose-400">{alert.targetValue}</span> altına düşünce
                            </span>
                          )}
                          {isRsiBelow && (
                            <span>
                              RSI <span className="font-mono font-bold text-amber-400">&lt;= {alert.targetValue}</span> (Aşırı Satım Dip)
                            </span>
                          )}
                          {isRsiAbove && (
                            <span>
                              RSI <span className="font-mono font-bold text-purple-400">&gt;= {alert.targetValue}</span> (Aşırı Alım Tepe)
                            </span>
                          )}
                          {alert.note && <span className="text-slate-400 ml-2 italic">— {alert.note}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onDeleteAlert(alert.id)}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Alarmı Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Her 45 saniyede taranan canlı piyasa verileriyle kontrol edilir</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors"
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
};
