// src/components/AIChatModal.tsx
// ProAnaliz AI - Interactive AI Chatbot & Smart Coupon Generator Modal

import React, { useState, useRef, useEffect } from 'react';
import { Match, MatchAnalysis } from '../types';
import {
  AIChatMessage,
  AIChatCoupon,
  AICouponItem,
  AICouponType,
  handleAIChatQuery,
  formatCouponForClipboard
} from '../utils/aiChatEngine';
import {
  Bot,
  Send,
  X,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  Flame,
  ShieldCheck,
  Trophy,
  BrainCircuit,
  Clock,
  CheckCircle2,
  XCircle,
  Activity,
  Layers,
  ArrowRight,
  Ticket,
  Plus
} from 'lucide-react';

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  allMatches: Match[];
  analysesMap: Map<string, MatchAnalysis>;
  currentTime?: Date;
  onSelectMatch?: (match: Match) => void;
  betslipMatchIds?: string[];
  onAddCouponToBetslip?: (coupon: AIChatCoupon) => void;
  onAddItemToBetslip?: (item: AICouponItem) => void;
}

export const AIChatModal: React.FC<AIChatModalProps> = ({
  isOpen,
  onClose,
  allMatches,
  analysesMap,
  currentTime = new Date(),
  onSelectMatch,
  betslipMatchIds = [],
  onAddCouponToBetslip,
  onAddItemToBetslip
}) => {
  const [messages, setMessages] = useState<AIChatMessage[]>(() => [
    {
      id: 'welcome',
      sender: 'assistant',
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      text: `Merhaba! Ben **ProAnaliz AI Futbol & Kupon Robotu**. 🤖⚽\n\n` +
        `Bana doğal dille istediğin kuponu söyleyebilirsin:\n` +
        `• *"Bana 3 maçlık banko kupon yap"*\n` +
        `• *"4 maçlık sürpriz kupon hazırla"*\n` +
        `• *"3 maçlık 2.5 üst kuponu ver"*\n` +
        `• *"Karşılıklı gol var kuponu yap"*\n` +
        `• Veya istediğin takımı sor: *"Galatasaray maçı ne olur?"*\n\n` +
        `Poisson dağılımı ve gerçek form analizleriyle saniyeler içinde kuponunu hazırlıyorum!`,
      quickSuggestions: [
        '🎲 3 Maçlık İlk Yarı / Maç Sonucu Kuponu Yap',
        '⚡ 3 Maçlık Banko Kupon Yap',
        '🎯 4 Maçlık İdeal Kupon Hazırla',
        '💣 3 Maçlık Sürpriz Kupon Ver',
        '⚽ 3 Maçlık 2.5 Üst Kuponu',
        '🤝 3 Maçlık KG Var Kuponu'
      ]
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedCouponId, setCopiedCouponId] = useState<string | null>(null);
  const [addedCouponId, setAddedCouponId] = useState<string | null>(null);

  // 3 Açılır Menü (Kupon Sihirbazı) State:
  // 1. Menü: banko | ideal | surpriz
  const [wizardRisk, setWizardRisk] = useState<'banko' | 'ideal' | 'surpriz'>('banko');
  // 2. Menü: kaç maç (2, 3, 4, 5, 6)
  const [wizardCount, setWizardCount] = useState<number>(3);
  // 3. Menü: ne oynanacağı (otomatik, 3.5 üst, 2.5 üst, kg, vb.)
  const [wizardPick, setWizardPick] = useState<string>('auto');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        scrollToBottom();
      }, 150);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!isOpen) return null;

  const handleSendMessage = (
    textToSend?: string,
    optionsOverride?: { type?: AICouponType; matchCount?: number }
  ) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    // Add user message
    const userMsg: AIChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      text: query
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI thinking delay for realism
    setTimeout(() => {
      const aiResponse = handleAIChatQuery(query, allMatches, analysesMap, currentTime, optionsOverride);
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 550);
  };

  const handleWizardSubmit = () => {
    let resolvedType: AICouponType = wizardRisk;
    let label = '';
    const riskNames: Record<string, string> = { banko: 'Banko', ideal: 'İdeal', surpriz: 'Sürpriz' };
    
    if (wizardPick === 'auto') {
      resolvedType = wizardRisk;
      label = `🎯 ${wizardCount} Maçlık ${riskNames[wizardRisk]} Kupon Hazırla`;
    } else {
      resolvedType = wizardPick as AICouponType;
      const pickNames: Record<string, string> = {
        over35: '3.5 Gol Üst',
        over25: '2.5 Gol Üst',
        btts: 'KG Var (Karşılıklı Gol)',
        htft: 'İlk Yarı / Maç Sonucu (İY/MS)',
        match_result: 'Maç Sonucu (Taraf Bahsi)',
        under25: '2.5 Gol Alt',
        under35: '3.5 Gol Alt',
        over15: '1.5 Gol Üst',
        btts_no: 'KG Yok',
        first_half: 'İlk Yarı'
      };
      label = `🎯 ${wizardCount} Maçlık ${riskNames[wizardRisk]} ${pickNames[wizardPick] || ''} Kuponu`;
    }

    handleSendMessage(label, { type: resolvedType, matchCount: wizardCount });
  };

  const handleCopyCoupon = (coupon: AIChatCoupon) => {
    const text = formatCouponForClipboard(coupon);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedCouponId(coupon.id);
      setTimeout(() => setCopiedCouponId(null), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      
      {/* Modal Dialog Card */}
      <div 
        className="w-full max-w-3xl h-[92vh] sm:h-[85vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-slate-700/50"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/70 border-b border-slate-800 flex items-center justify-between shrink-0">
          
          <div className="flex items-center space-x-3 min-w-0">
            <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-emerald-500 p-[2px] shadow-lg shadow-purple-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Bot className="w-5 h-5 text-amber-300 animate-pulse" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-sm sm:text-base text-white truncate">
                  ProAnaliz AI Sohbet & Kupon Robotu
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hidden sm:inline-block">
                  Canlı Model
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Poisson olasılık & form modeliyle doğal dille anında kupon hazırla
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => {
                setMessages([
                  {
                    id: 'reset',
                    sender: 'assistant',
                    timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
                    text: `Sohbet sıfırlandı. 🤖 Nasıl bir kupon hazırlamamı istersin?`,
                    quickSuggestions: [
                      '⚡ 3 Maçlık Banko Kupon Yap',
                      '🎯 4 Maçlık İdeal Kupon Hazırla',
                      '💣 3 Maçlık Sürpriz Kupon Ver'
                    ]
                  }
                ]);
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Sohbeti Temizle"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 no-scrollbar">
          
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';

            return (
              <div 
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-2`}
              >
                {/* Sender Avatar & Name */}
                <div className={`flex items-center space-x-2 text-[10px] font-bold text-slate-400 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    isUser ? 'bg-indigo-600 text-white' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  }`}>
                    {isUser ? 'Siz' : 'AI'}
                  </div>
                  <span>{isUser ? 'Siz' : 'ProAnaliz AI'}</span>
                  <span className="text-slate-600">• {msg.timestamp}</span>
                </div>

                {/* Message Bubble */}
                <div 
                  className={`max-w-[92%] sm:max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-md ${
                    isUser
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-tr-none'
                      : 'bg-slate-950/80 border border-slate-800/90 text-slate-200 rounded-tl-none whitespace-pre-line'
                  }`}
                >
                  {msg.text}
                </div>

                {/* Render Coupon Card if attached */}
                {msg.coupon && (
                  <div className="w-full max-w-[96%] sm:max-w-[90%] mt-2 rounded-2xl sm:rounded-3xl bg-slate-950 border-2 border-emerald-500/30 overflow-hidden shadow-2xl shadow-emerald-500/10">
                    
                    {/* Coupon Header Banner */}
                    <div className="p-3.5 sm:p-4 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-950 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {msg.coupon.badge}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            {msg.coupon.items.length} Karşılaşma
                          </span>
                        </div>
                        <h4 className="font-black text-sm sm:text-base text-white mt-0.5">
                          {msg.coupon.title}
                        </h4>
                      </div>

                      {/* Odds & Payout Display */}
                      <div className="flex items-center space-x-4 bg-slate-900/90 px-3.5 py-2 rounded-xl border border-slate-800">
                        <div>
                          <div className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Toplam Oran</div>
                          <div className="text-base sm:text-lg font-black text-emerald-400 font-mono">
                            {msg.coupon.totalOdds.toFixed(2)}
                          </div>
                        </div>
                        <div className="h-6 w-px bg-slate-800" />
                        <div>
                          <div className="text-[9px] uppercase tracking-wider font-bold text-slate-400">100 ₺ Kazancı</div>
                          <div className="text-base sm:text-lg font-black text-amber-300 font-mono">
                            {(msg.coupon.totalOdds * 100).toFixed(0)} ₺
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Match Rows */}
                    <div className="p-2 sm:p-3 space-y-2">
                      {msg.coupon.items.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          onClick={() => onSelectMatch && onSelectMatch(item.match)}
                          className="p-2.5 sm:p-3 rounded-xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800/80 transition-all cursor-pointer group"
                        >
                          {/* Row 1: Code, League, Match Time, Outcome Badge */}
                          <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400 mb-1.5">
                            <div className="flex items-center space-x-1.5 truncate">
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono font-bold border border-amber-500/20">
                                KOD: {item.iddaaCode}
                              </span>
                              <span className="font-semibold text-slate-300 truncate">{item.league}</span>
                              <span>•</span>
                              <span>{item.matchTimeText}</span>
                            </div>

                            {/* Outcome Badge if finished or live */}
                            {item.pickStatus === 'won' && (
                              <div className="flex items-center space-x-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-black text-[10px] border border-emerald-400/50 animate-pulse shrink-0">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>TUTTU</span>
                                {item.score && (
                                  <span className="font-mono ml-1">({item.score.home}-{item.score.away})</span>
                                )}
                              </div>
                            )}
                            {item.pickStatus === 'lost' && (
                              <div className="flex items-center space-x-1 px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-black text-[10px] border border-rose-400/50 shrink-0">
                                <XCircle className="w-3 h-3 text-rose-400" />
                                <span>YATTI</span>
                                {item.score && (
                                  <span className="font-mono ml-1">({item.score.home}-{item.score.away})</span>
                                )}
                              </div>
                            )}
                            {item.pickStatus === 'live' && (
                              <div className="flex items-center space-x-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-black text-[10px] border border-amber-400/50 animate-pulse shrink-0">
                                <Activity className="w-3 h-3 text-amber-400" />
                                <span>CANLI {item.liveMinute || ''}</span>
                                {item.score && (
                                  <span className="font-mono ml-1">({item.score.home}-{item.score.away})</span>
                                )}
                              </div>
                            )}
                            {item.pickStatus === 'upcoming' && (
                              <div className="flex items-center space-x-1 px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 font-bold text-[10px] border border-indigo-500/30 shrink-0">
                                <Clock className="w-3 h-3 text-indigo-400" />
                                <span>Oynanmadı</span>
                              </div>
                            )}
                          </div>

                          {/* Row 2: Team Names vs */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="font-black text-xs sm:text-sm text-slate-100 group-hover:text-emerald-300 transition-colors truncate">
                              {item.homeTeam} <span className="text-slate-500 text-xs font-normal">vs</span> {item.awayTeam}
                            </div>
                          </div>

                          {/* Row 3: The Pick Badge, Odds, Confidence & Single Add Button */}
                          <div className="flex items-center justify-between bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800 gap-2">
                            <div className="flex items-center space-x-2 min-w-0">
                              <span className="font-extrabold text-xs text-emerald-400 truncate">
                                {item.pickLabel}
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                                %{item.confidence} Güven
                              </span>
                            </div>
                            <div className="flex items-center space-x-1.5 shrink-0">
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-mono font-black text-xs border border-emerald-500/30">
                                {item.odd.toFixed(2)}
                              </span>
                              {onAddItemToBetslip && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onAddItemToBetslip(item);
                                  }}
                                  className={`px-2 py-0.5 rounded text-[10px] font-black border transition-all cursor-pointer flex items-center space-x-0.5 ${
                                    betslipMatchIds.includes(String(item.matchId))
                                      ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                                      : 'bg-slate-800 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  }`}
                                  title="Bu maçı kuponuma ekle"
                                >
                                  {betslipMatchIds.includes(String(item.matchId)) ? (
                                    <>
                                      <Check className="w-3 h-3" />
                                      <span>Kuponda</span>
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="w-3 h-3" />
                                      <span>Ekle</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Row 4: AI Analysis Reason */}
                          <p className="mt-1.5 text-[10px] text-slate-400 italic line-clamp-2">
                            "{item.reasoning}"
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Coupon Card Action Footer */}
                    <div className="p-3 bg-slate-900/90 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Ort. Güven: <strong className="text-emerald-300">%{msg.coupon.avgConfidence}</strong></span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {onAddCouponToBetslip && (
                          <button
                            type="button"
                            onClick={() => {
                              onAddCouponToBetslip(msg.coupon!);
                              setAddedCouponId(msg.coupon!.id);
                              setTimeout(() => setAddedCouponId(null), 2500);
                            }}
                            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-md shadow-emerald-500/20 active:scale-95"
                          >
                            {addedCouponId === msg.coupon.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>Kupona Aktarıldı!</span>
                              </>
                            ) : (
                              <>
                                <Ticket className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Kuponuma Aktar ({msg.coupon.items.length})</span>
                              </>
                            )}
                          </button>
                        )}

                        <button
                          onClick={() => handleCopyCoupon(msg.coupon!)}
                          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs transition-colors cursor-pointer border border-slate-700"
                        >
                          {copiedCouponId === msg.coupon.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-300">Kopyalandı!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                              <span>Kuponu Kopyala</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                  </div>
                )}

                {/* Quick suggestions if present */}
                {msg.quickSuggestions && (
                  <div className="flex flex-wrap gap-1.5 mt-2 max-w-[95%]">
                    {msg.quickSuggestions.map((sug, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(sug)}
                        className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-purple-600/30 text-slate-300 hover:text-purple-200 border border-slate-700/70 hover:border-purple-500/50 text-[11px] font-semibold transition-all cursor-pointer active:scale-95 shadow-sm"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}

              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-center space-x-2 text-slate-400 text-xs bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-2xl rounded-tl-none w-fit shadow-md">
              <Bot className="w-4 h-4 text-emerald-400 animate-spin" />
              <span>ProAnaliz AI bülteni tarıyor ve kupon hazırlıyor...</span>
              <span className="flex space-x-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></span>
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input & Action Bar */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 shrink-0">
          
          {/* 3 Açılır Menülü Hızlı Kupon Sihirbazı */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-2.5 sm:p-3 mb-2.5 shadow-lg backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Hızlı Kupon Menüsü</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                Açılır menüden seçin, tek tıkla kupon oluşsun
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              {/* 1. Menü: Kupon Tarzı (Banko, İdeal, Sürpriz) */}
              <div className="sm:col-span-3">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-0.5">
                  1. Kupon Tarzı
                </label>
                <select
                  value={wizardRisk}
                  onChange={(e) => setWizardRisk(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700/80 hover:border-slate-600 rounded-xl px-2.5 py-2 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 cursor-pointer transition-colors"
                >
                  <option value="banko">🛡️ Banko</option>
                  <option value="ideal">⚖️ İdeal</option>
                  <option value="surpriz">💣 Sürpriz</option>
                </select>
              </div>

              {/* 2. Menü: Kaç Maç (Rakamlar) */}
              <div className="sm:col-span-3">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-0.5">
                  2. Maç Sayısı
                </label>
                <select
                  value={wizardCount}
                  onChange={(e) => setWizardCount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700/80 hover:border-slate-600 rounded-xl px-2.5 py-2 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 cursor-pointer transition-colors"
                >
                  <option value={2}>2 Maç</option>
                  <option value={3}>3 Maç</option>
                  <option value={4}>4 Maç</option>
                  <option value={5}>5 Maç</option>
                  <option value={6}>6 Maç</option>
                </select>
              </div>

              {/* 3. Menü: Ne Oynanacağı (Bahis Tercihleri) */}
              <div className="sm:col-span-4">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-0.5">
                  3. Bahis Tercihi
                </label>
                <select
                  value={wizardPick}
                  onChange={(e) => setWizardPick(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 hover:border-slate-600 rounded-xl px-2.5 py-2 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 cursor-pointer transition-colors truncate"
                >
                  <option value="auto">🎲 Karışık / Otomatik</option>
                  <option value="over35">🔥 3.5 Gol Üstü</option>
                  <option value="over25">⚽ 2.5 Gol Üstü</option>
                  <option value="btts">🤝 Karşılıklı Gol Var (KG Var)</option>
                  <option value="htft">🎲 İlk Yarı / Maç Sonu (İY/MS)</option>
                  <option value="match_result">🏆 Maç Sonucu (MS 1 - X - 2)</option>
                  <option value="under25">🔒 2.5 Gol Altı</option>
                  <option value="under35">🛡️ 3.5 Gol Altı</option>
                  <option value="over15">⚡ 1.5 Gol Üstü</option>
                  <option value="btts_no">🚫 Karşılıklı Gol Yok (KG Yok)</option>
                  <option value="first_half">⏱️ İlk Yarı Tercihleri</option>
                </select>
              </div>

              {/* Kupon Hazırla Butonu */}
              <div className="sm:col-span-2 flex items-end">
                <button
                  type="button"
                  onClick={handleWizardSubmit}
                  disabled={isTyping}
                  className="w-full py-2 px-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-500 hover:from-purple-500 hover:to-emerald-400 text-white font-black text-xs shadow-md shadow-purple-600/30 flex items-center justify-center space-x-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Kupon Yap</span>
                </button>
              </div>
            </div>
          </div>

          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-2"
          >
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Örn: 3 maçlık banko kupon yap veya 4 maçlık sürpriz kupon hazırla..."
                className="w-full pl-4 pr-10 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-inner"
              />
              <Sparkles className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400/60 pointer-events-none" />
            </div>

            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className={`p-3 rounded-2xl font-bold transition-all cursor-pointer shadow-lg shrink-0 flex items-center justify-center ${
                !inputText.trim() || isTyping
                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700/50'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/30 active:scale-95'
              }`}
              title="Gönder"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Footer Disclaimer */}
          <div className="mt-2 text-center text-[10px] text-slate-500">
            Poisson istatistiği & gerçek takım formları ile çalışır. Bahis oynatmaz; saf olasılık simülasyonudur.
          </div>

        </div>

      </div>

    </div>
  );
};
