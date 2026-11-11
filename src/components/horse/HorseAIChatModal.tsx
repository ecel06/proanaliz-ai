// src/components/horse/HorseAIChatModal.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  Bot,
  Check,
  RotateCcw,
  Send,
  Sparkles,
  Ticket,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import {
  GeneratedAltiliCoupon,
  ProgramDetail,
} from '../../types/horseRacing';
import {
  GameConfig,
  analyzeRaceHorses,
  generateBudgetHorseCoupon,
  getHorsePrimaryAgf,
  getProgramHighlights,
} from '../../utils/horseRacingEngine';

interface HorseChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text: string;
  coupon?: GeneratedAltiliCoupon | null;
  quickSuggestions?: string[];
}

interface HorseAIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  detail: ProgramDetail | null;
  availableGames: GameConfig[];
  activeGame: GameConfig | null;
  onApplyCoupon: (coupon: GeneratedAltiliCoupon) => void;
}

export const HorseAIChatModal: React.FC<HorseAIChatModalProps> = ({
  isOpen,
  onClose,
  detail,
  availableGames,
  activeGame,
  onApplyCoupon,
}) => {
  const [wizardGameId, setWizardGameId] = useState<string>(activeGame?.id || 'ALTILI_1');
  const [wizardRisk, setWizardRisk] = useState<'ekonomik' | 'ideal' | 'surpriz'>('ideal');
  const [wizardBudget, setWizardBudget] = useState<number>(100);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [appliedId, setAppliedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeGame?.id) {
      setWizardGameId(activeGame.id);
    }
  }, [activeGame?.id]);

  const buildWelcomeMessage = (): HorseChatMessage => ({
    id: 'hr_welcome',
    sender: 'assistant',
    timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    text: detail
      ? `Merhaba! Ben **ProAnaliz AI At Yarışı & Altılı Robotu** 🏇✨\n\nŞu anda **${detail.program.name}** (${detail.races.length} koşu) canlı TJK/AGF verileri yüklü.\n• *"50 TL bütçeye uygun Altılı yap"*\n• *"Günün en sağlam Bankosu kim?"*\n• *"2. 6'lı Ganyan için sürprizli kupon hazırla"*\n• *"3. koşuda hangi atlar önde?"*`
      : 'At yarışı bülteni yükleniyor... Bülten açıldığında canlı AGF ve form verileriyle kupon üretebilirim.',
    quickSuggestions: [
      '🎯 50 ₺ İdeal Altılı Yap',
      '⚡ Günün Bankosu Kim?',
      '💣 Sürprizli 150 ₺ Altılı',
      '🏇 1. Koşu Analizi',
    ],
  });

  const [messages, setMessages] = useState<HorseChatMessage[]>(() => [buildWelcomeMessage()]);

  // Reset welcome context if user switches hippodrome
  useEffect(() => {
    setMessages([buildWelcomeMessage()]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail?.program.id]);

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

  const processQuery = (
    queryText: string,
    override?: { gameId?: string; risk?: 'ekonomik' | 'ideal' | 'surpriz'; budget?: number }
  ) => {
    const q = queryText.toLowerCase();
    const nowTime = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    if (!detail) {
      return {
        id: `ai_${Date.now()}`,
        sender: 'assistant' as const,
        timestamp: nowTime,
        text: 'Şu anda aktif hipodrom verisi yok. Lütfen yukarıdan bir hipodrom seçin.',
      };
    }

    // 1. Check for specific race inquiry (e.g. "3. koşu", "5. koşuda kim gelir")
    const raceMatch = q.match(/(\d+)\s*\.?\s*(?:koşu|kosu|ayak)/);
    if (raceMatch && !q.includes('altılı') && !q.includes('altili') && !q.includes('kupon') && !override) {
      const rNo = parseInt(raceMatch[1], 10);
      const race = detail.races.find((r) => r.number === rNo);
      if (race) {
        const analysis = analyzeRaceHorses(race);
        const ranked = Array.from(analysis.values()).sort((a, b) => b.score - a.score).slice(0, 4);
        const lines = ranked.map((item, idx) => {
          const horse = race.horses.find((h) => h.number === item.horseNumber);
          const agf = horse ? getHorsePrimaryAgf(horse) : { percentage: 0 };
          return `${idx + 1}. **#${item.horseNumber} ${horse?.name || ''}** (${horse?.jockey?.name || '-'}) • AI: **%${item.score}** [${item.tag}]${agf.percentage > 0 ? ` • AGF %${agf.percentage.toFixed(1)}` : ''}${horse?.ganyan ? ` • Ganyan ${horse.ganyan.toFixed(2)}` : ''}\n   _${item.reasons.join(' • ')}_`;
        });
        return {
          id: `ai_${Date.now()}`,
          sender: 'assistant' as const,
          timestamp: nowTime,
          text: `🏇 **${detail.program.place} • ${race.number}. Koşu (${race.hour} • ${race.distance}m ${race.raceCourseType})**\n\n${lines.join('\n\n')}`,
          quickSuggestions: ['🎯 50 ₺ İdeal Altılı Yap', '⚡ Günün Bankosu Kim?'],
        };
      }
    }

    // 2. Banko question
    if ((q.includes('banko') || q.includes('tek')) && !q.includes('kupon') && !q.includes('altılı') && !q.includes('altili') && !override) {
      const highlights = getProgramHighlights(detail);
      const b = highlights?.bestBanko;
      if (b && b.top && b.topHorse) {
        const agf = getHorsePrimaryAgf(b.topHorse);
        return {
          id: `ai_${Date.now()}`,
          sender: 'assistant' as const,
          timestamp: nowTime,
          text:
            `⚡ **${detail.program.place} Günün En Sağlam Banko Adayı:**\n\n` +
            `• **${b.race.number}. Koşu (${b.race.hour}) — #${b.topHorse.number} ${b.topHorse.name}**\n` +
            `• Jokey: **${b.topHorse.jockey.name}** • AI Güveni: **%${b.top.score}**${agf.percentage > 0 ? ` • AGF: **%${agf.percentage.toFixed(1)}**` : ''}\n` +
            `• Gerekçeler: ${b.top.reasons.join(', ')}\n\n` +
            (highlights?.surpriseRace?.sleeperHorse
              ? `💣 **En Riskli / Sürpriz Ayağı:** ${highlights.surpriseRace.race.number}. Koşu (#${highlights.surpriseRace.sleeperHorse.number} ${highlights.surpriseRace.sleeperHorse.name})`
              : ''),
          quickSuggestions: ['🎯 Ekonomik Altılı Yap', '💣 Geniş Sürprizli Altılı'],
        };
      }
    }

    // 3. Surprise / Bomba inquiry
    if ((q.includes('sürpriz') || q.includes('surpriz') || q.includes('bomba')) && !q.includes('kupon') && !q.includes('altılı') && !q.includes('altili') && !override) {
      const highlights = getProgramHighlights(detail);
      const s = highlights?.surpriseRace;
      if (s && s.sleeper && s.sleeperHorse) {
        return {
          id: `ai_${Date.now()}`,
          sender: 'assistant' as const,
          timestamp: nowTime,
          text:
            `💣 **${detail.program.place} Sürpriz & Bomba Raporu:**\n\n` +
            `• **${s.race.number}. Koşu (${s.race.hour})** günün en dengeli/kaotik ayağı görünüyor.\n` +
            `• Dikkat Çeken Sürpriz: **#${s.sleeperHorse.number} ${s.sleeperHorse.name}** (${s.sleeperHorse.jockey.name}) • Ganyan: **${s.sleeperHorse.ganyan > 0 ? s.sleeperHorse.ganyan.toFixed(2) : '-'}**\n` +
            `• Notlar: ${s.sleeper.reasons.join(' • ')}`,
          quickSuggestions: ['💣 150 ₺ Sürprizli Altılı Yap', '⚡ Günün Bankosu Kim?'],
        };
      }
    }

    // 4. Coupon Generation (budget, game, risk)
    let targetGame =
      availableGames.find((g) => g.id === (override?.gameId || wizardGameId)) ||
      availableGames[0] ||
      null;

    if (!override?.gameId) {
      if (q.includes('2. 6') || q.includes('2. alt') || q.includes('ikinci alt')) {
        targetGame = availableGames.find((g) => g.id === 'ALTILI_2') || targetGame;
      } else if (q.includes('5\'li') || q.includes('5li') || q.includes('beşli')) {
        targetGame = availableGames.find((g) => g.id === 'BESLI' || g.id === 'BESLI_2') || targetGame;
      } else if (q.includes('4\'lü') || q.includes('4lu') || q.includes('dörtlü')) {
        targetGame = availableGames.find((g) => g.id === 'DORTLU' || g.id === 'DORTLU_2') || targetGame;
      } else if (q.includes('3\'lü') || q.includes('3lu') || q.includes('üçlü')) {
        targetGame = availableGames.find((g) => g.id === 'UCLU_1' || g.id === 'UCLU_2') || targetGame;
      }
    }

    let risk: 'ekonomik' | 'ideal' | 'surpriz' = override?.risk || wizardRisk;
    if (!override?.risk) {
      if (q.includes('ekonomik') || q.includes('ucuz') || q.includes('dar')) risk = 'ekonomik';
      else if (q.includes('sürpriz') || q.includes('surpriz') || q.includes('geniş') || q.includes('bomba')) risk = 'surpriz';
    }

    let budget = override?.budget || wizardBudget;
    if (!override?.budget) {
      const budgetMatch = q.match(/(\d+)\s*(?:tl|₺|lira)/);
      if (budgetMatch) {
        budget = Math.max(10, Math.min(2000, parseInt(budgetMatch[1], 10)));
      }
    }

    const coupon = generateBudgetHorseCoupon(detail, targetGame, budget, risk);
    if (!coupon) {
      return {
        id: `ai_${Date.now()}`,
        sender: 'assistant' as const,
        timestamp: nowTime,
        text: `${detail.program.place} programı için seçili oyunda yeterli koşu bulunamadı.`,
      };
    }

    return {
      id: `ai_${Date.now()}`,
      sender: 'assistant' as const,
      timestamp: nowTime,
      text: `🏇 **${coupon.title}** hazır!\nCanlı AGF yüzdeleri, HP puanları, son 6 yarış pist performansı ve jokey avantajları hesaplanarak **${coupon.totalCombinations} kolon (${coupon.estimatedCost.toFixed(2)} ₺)** kurgulandı.`,
      coupon,
      quickSuggestions: ['⚡ Ekonomik 35 ₺ Yap', '💣 Geniş 200 ₺ Yap'],
    };
  };

  const handleSend = (
    textArg?: string,
    override?: { gameId?: string; risk?: 'ekonomik' | 'ideal' | 'surpriz'; budget?: number }
  ) => {
    const msg = (textArg || inputText).trim();
    if (!msg) return;

    const userMsg: HorseChatMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      text: msg,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      const reply = processQuery(msg, override);
      setMessages((prev) => [...prev, reply]);
      setIsTyping(false);
    }, 350);
  };

  const handleWizardRun = () => {
    const gName = availableGames.find((g) => g.id === wizardGameId)?.label || "6'lı Ganyan";
    const rLabel =
      wizardRisk === 'ekonomik' ? 'Ekonomik' : wizardRisk === 'surpriz' ? 'Sürprizli' : 'İdeal';
    handleSend(`${wizardBudget} ₺ bütçeli ${rLabel} ${gName} kuponu hazırla`, {
      gameId: wizardGameId,
      risk: wizardRisk,
      budget: wizardBudget,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-2xl h-[90vh] sm:h-[85vh] rounded-3xl bg-slate-900 border border-amber-500/40 shadow-2xl shadow-amber-500/15 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 sm:px-5 sm:py-4 bg-gradient-to-r from-amber-500/20 via-slate-900 to-emerald-500/15 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-sm sm:text-base text-white">
                  AI At Yarışı &amp; Altılı Robotu
                </h3>
                <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black">
                  CANLI TJK/AGF
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-[260px] sm:max-w-sm">
                {detail ? `${detail.program.name} (${detail.races.length} Koşu)` : 'Hipodrom seçili değil'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setMessages([buildWelcomeMessage()])}
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

        {/* Altılı Kupon Sihirbazı (3 Açılır Menü) */}
        <div className="px-4 py-2.5 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center gap-2">
          <select
            value={wizardGameId}
            onChange={(e) => setWizardGameId(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white cursor-pointer"
            aria-label="Oyun Türü"
          >
            {availableGames.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </select>

          <select
            value={wizardRisk}
            onChange={(e) => setWizardRisk(e.target.value as 'ekonomik' | 'ideal' | 'surpriz')}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-amber-300 cursor-pointer"
            aria-label="Kupon Stratejisi"
          >
            <option value="ekonomik">Ekonomik (2 Tek)</option>
            <option value="ideal">İdeal Dengeli</option>
            <option value="surpriz">Sürpriz / Bomba</option>
          </select>

          <select
            value={wizardBudget}
            onChange={(e) => setWizardBudget(Number(e.target.value))}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-emerald-300 cursor-pointer"
            aria-label="Bütçe Limiti"
          >
            <option value={25}>25 ₺ Bütçe</option>
            <option value={50}>50 ₺ Bütçe</option>
            <option value={100}>100 ₺ Bütçe</option>
            <option value={200}>200 ₺ Bütçe</option>
            <option value={500}>500 ₺ Geniş</option>
          </select>

          <button
            onClick={handleWizardRun}
            className="ml-auto px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer transition-all flex items-center space-x-1 shadow-md shadow-amber-500/20"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Altılı Yap</span>
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[90%] rounded-2xl px-4 py-3 text-xs sm:text-[13px] leading-relaxed whitespace-pre-line ${
                  m.sender === 'user'
                    ? 'bg-amber-400 text-slate-950 font-bold rounded-br-none'
                    : 'bg-slate-800/90 text-slate-100 border border-slate-700/80 rounded-bl-none'
                }`}
              >
                {m.text.split('**').map((part, idx) =>
                  idx % 2 === 1 ? <strong key={idx}>{part}</strong> : <span key={idx}>{part}</span>
                )}
              </div>

              {/* Generated Horse Coupon Card */}
              {m.coupon && (
                <div className="mt-2.5 w-full max-w-md rounded-2xl bg-slate-950/90 border border-amber-400/50 p-3.5 space-y-2.5 shadow-xl">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                    <div className="flex items-center space-x-1.5">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span className="font-black text-xs text-white">{m.coupon.title}</span>
                    </div>
                    <span className="font-mono font-black text-xs text-amber-400">
                      {m.coupon.estimatedCost.toFixed(2)} ₺
                    </span>
                  </div>

                  <div className="space-y-1">
                    {m.coupon.legs.map((leg) => (
                      <div
                        key={leg.legIndex}
                        className="flex items-center justify-between text-xs py-1 border-b border-slate-800/50 last:border-0"
                      >
                        <span className="text-slate-400 font-bold">
                          {leg.legIndex}. Ayak ({leg.raceNumber}. Koşu)
                        </span>
                        <div className="flex flex-wrap gap-1 justify-end">
                          {leg.horses.map((hNo) => (
                            <span
                              key={hNo}
                              className={`px-2 py-0.5 rounded font-mono font-black text-[11px] ${
                                leg.banko === hNo
                                  ? 'bg-amber-400 text-slate-950'
                                  : 'bg-slate-800 text-white border border-slate-700'
                              }`}
                            >
                              {hNo}
                              {leg.banko === hNo ? ' TEK' : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">
                      {m.coupon.totalCombinations.toLocaleString('tr-TR')} Kolon • Güven %
                      {m.coupon.avgConfidence}
                    </span>
                    <button
                      onClick={() => {
                        onApplyCoupon(m.coupon!);
                        setAppliedId(m.coupon!.id);
                        setTimeout(() => onClose(), 450);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-black text-xs cursor-pointer transition-all flex items-center space-x-1 ${
                        appliedId === m.coupon.id
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                      }`}
                    >
                      {appliedId === m.coupon.id ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Kupona Aktarıldı</span>
                        </>
                      ) : (
                        <>
                          <Ticket className="w-3.5 h-3.5" />
                          <span>Kupona Aktar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {m.quickSuggestions && m.quickSuggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {m.quickSuggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSend(s)}
                      className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-amber-400/20 border border-slate-700 hover:border-amber-400/50 text-[11px] font-bold text-slate-300 hover:text-amber-200 cursor-pointer transition-all"
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
            <div className="flex items-center space-x-2 text-xs text-amber-300 font-bold">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>AGF ve form verileri analiz ediliyor...</span>
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
            placeholder="Örn: 50 TL'ye 2. 6'lı Ganyan kuponu yap veya 4. koşu kim gelir..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-black text-xs cursor-pointer transition-all flex items-center space-x-1"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

