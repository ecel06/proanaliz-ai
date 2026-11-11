// src/components/stocks/StockAIChatModal.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  Bot,
  RotateCcw,
  Send,
  Sparkles,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import {
  StockItem,
  StockMarketType,
  StockQuantAnalysis,
} from '../../types/stocks';
import { fetchStockDeepAnalysis } from '../../services/stockService';
import { buildInstitutionalAIMemo, formatStockPrice } from '../../utils/stockAnalysisEngine';

interface StockChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text: string;
  picks?: { stock: StockItem; analysis: StockQuantAnalysis }[];
  quickSuggestions?: string[];
}

interface StockAIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  stocks: StockItem[];
  analysesMap: Map<string, StockQuantAnalysis>;
  market: StockMarketType;
  selectedStock: StockItem | null;
  onSelectStock: (stock: StockItem) => void;
}

export const StockAIChatModal: React.FC<StockAIChatModalProps> = ({
  isOpen,
  onClose,
  stocks,
  analysesMap,
  market,
  selectedStock,
  onSelectStock,
}) => {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [strategy, setStrategy] = useState<'strong_buy' | 'value' | 'dip_bounce' | 'dividend'>('strong_buy');
  const [pickCount, setPickCount] = useState<number>(5);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const marketTitle = market === 'bist' ? 'BIST (Türkiye)' : market === 'us' ? 'NASDAQ / NYSE' : 'Kripto (Binance)';

  const buildWelcome = (): StockChatMessage => ({
    id: 'st_welcome',
    sender: 'assistant',
    timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    text:
      `Merhaba! Ben **ProAnaliz Borsa AI & Sinyal Robotu** 📈🤖\n\n` +
      `Şu anda **${marketTitle}** piyasasında **${stocks.length} hisse/varlık** canlı teknik + temel röntgenden geçiriliyor.\n` +
      `• *"5 hisseli Güçlü AL portföyü kur"*\n` +
      `• *"${selectedStock?.symbol || (market === 'bist' ? 'THYAO' : 'NVDA')} alınır mı?"*\n` +
      `• *"F/K ucuz değer hisseleri hangileri?"*\n` +
      `• *"RSI aşırı satım tepki adayları kimler?"*\n` +
      `• *"SAT sinyali veren riskli hisseleri göster"*`,
    quickSuggestions: [
      '🔥 5 Güçlü AL Portföyü Kur',
      `🔍 ${selectedStock?.symbol || (market === 'bist' ? 'THYAO' : 'NVDA')} Analiz Et`,
      '💎 Ucuz Değer Hisseleri',
      '⚡ RSI Dip Tepki Adayları',
    ],
  });

  const [messages, setMessages] = useState<StockChatMessage[]>(() => [buildWelcome()]);

  useEffect(() => {
    setMessages([buildWelcome()]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [market, selectedStock?.symbol]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!isOpen) return null;

  const processQuery = async (
    queryText: string,
    override?: { strat?: 'strong_buy' | 'value' | 'dip_bounce' | 'dividend'; count?: number }
  ): Promise<StockChatMessage> => {
    const q = queryText.toLowerCase();
    const nowTime = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    const enriched = stocks
      .map((s) => ({ stock: s, analysis: analysesMap.get(s.symbol) }))
      .filter((x): x is { stock: StockItem; analysis: StockQuantAnalysis } => Boolean(x.analysis));

    // 1. Check specific stock inquiry -> fetch live Deep MTF + Backtest + Analyst Consensus + News!
    if (!override) {
      const matched = enriched.find(
        (x) =>
          q.includes(x.stock.symbol.toLowerCase()) ||
          (x.stock.name.toLowerCase().split(' ')[0].length >= 4 &&
            q.includes(x.stock.name.toLowerCase().split(' ')[0]))
      );
      if (matched && !q.includes('portföy') && !q.includes('liste')) {
        const { stock, analysis } = matched;
        const deep = await fetchStockDeepAnalysis(stock.symbol, stock.market);
        const memo = buildInstitutionalAIMemo(stock, analysis, deep);
        const mtfLine = deep
          ? `\n• **Çoklu Zaman Dilimi (MTF):** ${deep.mtfSummary.alignment} (${deep.mtf
              .map((m) => `${m.timeframe.split(' ')[0]}: ${m.signal}`)
              .join(' | ')})`
          : '';
        const analystLine = deep?.financials?.targetMeanPrice
          ? `\n• **Kurumsal Analist Hedefi:** Ort. **${formatStockPrice(
              deep.financials.targetMeanPrice,
              stock.currency
            )}** (%${deep.financials.upsidePct ?? 0} potansiyel • ${
              deep.financials.numberOfAnalystOpinions ?? '-'
            } kurum)`
          : '';
        const btLine =
          deep?.backtest && deep.backtest.totalTrades > 0
            ? `\n• **1Y Backtest Kanıtı:** ${deep.backtest.totalTrades} işlemde **%${deep.backtest.winRate}** kazanma, bileşik **%${deep.backtest.strategyReturnPct}** (Profit Factor: ${deep.backtest.profitFactor})`
            : '';
        const newsLine =
          deep?.news && deep.news.length > 0
            ? `\n• **Güncel Haber (${deep.news[0].sentiment}):** "${deep.news[0].title}"`
            : '';

        return {
          id: `st_${Date.now()}`,
          sender: 'assistant',
          timestamp: nowTime,
          text:
            `📊 **${stock.symbol} — ${stock.name}** [${memo.convictionBadge}]\n` +
            `• Güncel Fiyat: **${formatStockPrice(stock.close, stock.currency)}** (${stock.changePct >= 0 ? '+' : ''}%${stock.changePct.toFixed(2)})\n` +
            `• Quant Sinyal: **${analysis.signal}** (AI Skor: **${analysis.score}/100** | Trend: %${analysis.trendScore} | Momentum: %${analysis.momentumScore} | Temel: %${analysis.fundamentalScore})` +
            mtfLine +
            analystLine +
            btLine +
            `\n• **İşlem Planı:** Stop-Loss **${formatStockPrice(analysis.tradePlan.stopLoss, stock.currency)}** (${analysis.tradePlan.stopLossPct}%) → Hedef 1 **${formatStockPrice(analysis.tradePlan.tp1, stock.currency)}** → Hedef 2 **${formatStockPrice(analysis.tradePlan.tp2, stock.currency)}** (R/R: 1:${analysis.tradePlan.riskReward})` +
            newsLine,
          picks: [matched],
          quickSuggestions: ['🔥 5 Güçlü AL Portföyü Kur', '⚠️ Riskli / SAT Sinyalleri'],
        };
      }
    }

    // 2. Determine strategy
    const countMatch = q.match(/(\d+)\s*(?:hisse|adet|varlık)/);
    const limit = override?.count || (countMatch ? Math.min(10, Math.max(2, parseInt(countMatch[1], 10))) : pickCount);

    let chosenStrat = override?.strat;
    if (!chosenStrat) {
      if (q.includes('sat') || q.includes('risk')) {
        const sells = [...enriched]
          .filter((x) => x.analysis.signal === 'SAT' || x.analysis.signal === 'GÜÇLÜ SAT')
          .sort((a, b) => a.analysis.score - b.analysis.score)
          .slice(0, limit);
        return {
          id: `st_${Date.now()}`,
          sender: 'assistant',
          timestamp: nowTime,
          text:
            sells.length > 0
              ? `⚠️ **${marketTitle} — Teknik Zayıflık & SAT Sinyali Veren ${sells.length} Hisse:**\nAşağıdaki varlıklar EMA ortalamalarının altında veya aşırı alım/zayıf momentum bölgesinde.`
              : `✅ **${marketTitle}** taramasında şu an kritik GÜÇLÜ SAT sinyali üreten hisse görünmüyor.`,
          picks: sells,
          quickSuggestions: ['🔥 5 Güçlü AL Portföyü Kur', '💎 Ucuz Değer Hisseleri'],
        };
      }
      if (q.includes('rsi') || q.includes('dip') || q.includes('tepki') || q.includes('aşırı sat')) {
        chosenStrat = 'dip_bounce';
      } else if (q.includes('temettü') || q.includes('temettu')) {
        chosenStrat = 'dividend';
      } else if (q.includes('ucuz') || q.includes('değer') || q.includes('f/k') || q.includes('pd/dd')) {
        chosenStrat = 'value';
      } else {
        chosenStrat = strategy;
      }
    }

    let sorted: { stock: StockItem; analysis: StockQuantAnalysis }[] = [];
    let headline = '';

    if (chosenStrat === 'dip_bounce') {
      sorted = [...enriched]
        .filter((x) => x.stock.rsi !== null && x.stock.rsi <= 42)
        .sort((a, b) => (a.stock.rsi || 50) - (b.stock.rsi || 50))
        .slice(0, limit);
      headline = `⚡ **RSI Dip & Tepki Adayları (${marketTitle}):** Kısa vadede aşırı satılmış, destek tepkisi potansiyeli taşıyan en ucuz RSI hisseleri:`;
    } else if (chosenStrat === 'value') {
      sorted = [...enriched]
        .filter((x) => x.stock.pe !== null && x.stock.pe > 0 && x.analysis.fundamentalScore >= 60)
        .sort((a, b) => b.analysis.fundamentalScore + b.analysis.score - (a.analysis.fundamentalScore + a.analysis.score))
        .slice(0, limit);
      headline = `💎 **Ucuz Değer & Kaliteli Bilanço Hisseleri (${marketTitle}):** Düşük F/K, makul PD/DD ve yüksek ROE skoruna göre ilk ${limit} hisse:`;
    } else if (chosenStrat === 'dividend') {
      sorted = [...enriched]
        .filter((x) => (x.stock.dividendYield || 0) > 1.5)
        .sort((a, b) => (b.stock.dividendYield || 0) - (a.stock.dividendYield || 0))
        .slice(0, limit);
      headline = `💰 **En Yüksek Temettü Verimli Güçlü Hisseler (${marketTitle}):**`;
    } else {
      sorted = [...enriched]
        .sort((a, b) => b.analysis.score - a.analysis.score)
        .slice(0, limit);
      headline = `🔥 **ProAnaliz Quant — En Yüksek AI Skorlu ${limit} AL Sinyali (${marketTitle}):** Trend + Momentum + Temel analiz uyumu en yüksek hisseler:`;
    }

    return {
      id: `st_${Date.now()}`,
      sender: 'assistant',
      timestamp: nowTime,
      text: sorted.length > 0 ? headline : `${marketTitle} piyasasında bu kritere tam uyan hisse bulunamadı.`,
      picks: sorted,
      quickSuggestions: ['💎 Ucuz Değer Hisseleri', '⚡ RSI Dip Tepki Adayları', '⚠️ SAT Sinyalleri'],
    };
  };

  const handleSend = async (
    argText?: string,
    override?: { strat?: 'strong_buy' | 'value' | 'dip_bounce' | 'dividend'; count?: number }
  ) => {
    const msg = (argText || inputText).trim();
    if (!msg) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `u_${Date.now()}`,
        sender: 'user',
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        text: msg,
      },
    ]);
    setInputText('');
    setIsTyping(true);
    try {
      const reply = await processQuery(msg, override);
      setMessages((prev) => [...prev, reply]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleWizardGenerate = () => {
    const labels = {
      strong_buy: 'Güçlü AL Portföyü',
      value: 'Ucuz Değer Hisseleri',
      dip_bounce: 'RSI Dip Tepki Adayları',
      dividend: 'Yüksek Temettü Portföyü',
    };
    handleSend(`${pickCount} hisseli ${labels[strategy]} oluştur`, {
      strat: strategy,
      count: pickCount,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-2xl h-[90vh] sm:h-[85vh] rounded-3xl bg-slate-900 border border-cyan-500/40 shadow-2xl shadow-cyan-500/15 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 sm:px-5 sm:py-4 bg-gradient-to-r from-cyan-500/20 via-slate-900 to-emerald-500/15 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-sm sm:text-base text-white">
                  ProAnaliz Borsa AI &amp; Sinyal Robotu
                </h3>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black">
                  QUANT MOTORU
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {marketTitle} • {stocks.length} Hisse Canlı Analiz
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setMessages([buildWelcome()])}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Sohbeti Sıfırla"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 transition-colors cursor-pointer"
              title="Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quant Portföy Sihirbazı */}
        <div className="px-4 py-2.5 bg-slate-950/75 border-b border-slate-800 flex flex-wrap items-center gap-2">
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as typeof strategy)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-cyan-300 cursor-pointer"
          >
            <option value="strong_buy">🔥 Güçlü AL (Trend+Momentum)</option>
            <option value="value">💎 Ucuz Değer (F/K + PD/DD + ROE)</option>
            <option value="dip_bounce">⚡ RSI Aşırı Satım Tepki</option>
            <option value="dividend">💰 Yüksek Temettü Verimi</option>
          </select>

          <select
            value={pickCount}
            onChange={(e) => setPickCount(Number(e.target.value))}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white cursor-pointer"
          >
            <option value={3}>3 Hisse</option>
            <option value={5}>5 Hisse</option>
            <option value={7}>7 Hisse</option>
            <option value={10}>10 Hisse</option>
          </select>

          <button
            onClick={handleWizardGenerate}
            className="ml-auto px-3 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs cursor-pointer transition-all flex items-center space-x-1 shadow-md shadow-cyan-500/20"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Portföy Tarama</span>
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => (
            <div key={m.id} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[92%] rounded-2xl px-4 py-3 text-xs sm:text-[13px] leading-relaxed whitespace-pre-line ${
                  m.sender === 'user'
                    ? 'bg-cyan-400 text-slate-950 font-bold rounded-br-none'
                    : 'bg-slate-800/90 text-slate-100 border border-slate-700/80 rounded-bl-none'
                }`}
              >
                {m.text.split('**').map((part, idx) =>
                  idx % 2 === 1 ? <strong key={idx}>{part}</strong> : <span key={idx}>{part}</span>
                )}
              </div>

              {m.picks && m.picks.length > 0 && (
                <div className="mt-2.5 w-full max-w-lg space-y-1.5">
                  {m.picks.map(({ stock, analysis }) => (
                    <button
                      key={stock.symbol}
                      onClick={() => {
                        onSelectStock(stock);
                        onClose();
                      }}
                      className="w-full p-2.5 rounded-xl bg-slate-950/90 hover:bg-slate-900 border border-slate-800 hover:border-cyan-400/60 flex items-center justify-between gap-2 text-left cursor-pointer transition-all"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-black text-xs text-white">{stock.symbol}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-black ${
                              analysis.signal === 'GÜÇLÜ AL'
                                ? 'bg-emerald-500 text-slate-950'
                                : analysis.signal === 'AL'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : analysis.signal === 'SAT' || analysis.signal === 'GÜÇLÜ SAT'
                                ? 'bg-rose-500/20 text-rose-300'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {analysis.signal} ({analysis.score})
                          </span>
                          <span className="text-[10px] text-slate-400 truncate">{stock.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          RSI: {stock.rsi?.toFixed(1) ?? '-'} • F/K: {stock.pe?.toFixed(1) ?? '-'} • Hedef:{' '}
                          <span className="text-emerald-400">{formatStockPrice(analysis.tradePlan.tp1, stock.currency)}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-mono font-black text-white">
                          {formatStockPrice(stock.close, stock.currency)}
                        </div>
                        <div
                          className={`text-[10px] font-mono font-bold flex items-center justify-end space-x-0.5 ${
                            stock.changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          <TrendingUp className="w-3 h-3" />
                          <span>
                            {stock.changePct >= 0 ? '+' : ''}
                            {stock.changePct.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {m.quickSuggestions && m.quickSuggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {m.quickSuggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSend(s)}
                      className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-cyan-400/20 border border-slate-700 hover:border-cyan-400/50 text-[11px] font-bold text-slate-300 hover:text-cyan-200 cursor-pointer transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <span className="text-[10px] text-slate-500 mt-1">{m.timestamp}</span>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center space-x-2 text-xs text-cyan-300 font-bold">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>Teknik göstergeler ve bilanço çarpanları taranıyor...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-slate-950 border-t border-slate-800 flex items-center space-x-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Örn: THYAO alınır mı, 5 ucuz değer hissesi ver, RSI dip hisseler..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-black text-xs cursor-pointer transition-all flex items-center space-x-1"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

