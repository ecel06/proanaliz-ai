// src/components/AdminAICoPilotModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Crown,
  X,
  Send,
  Trash2,
  Key,
  ExternalLink,
  Sparkles,
  Bot,
  User as UserIcon,
  Check,
  AlertTriangle,
  RotateCcw,
  Zap,
  TrendingUp,
  ShieldCheck,
  Activity,
  Layers,
} from 'lucide-react';
import { User, callAdminAICoPilotApi } from '../utils/authHelper';

interface AdminAICoPilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  clientContext?: any;
  onShowToast?: (msg: string) => void;
}

interface ChatMsg {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

const STORAGE_KEY_API = 'proanaliz_admin_gemini_key';
const STORAGE_KEY_MSGS = 'proanaliz_admin_copilot_history';

export const AdminAICoPilotModal: React.FC<AdminAICoPilotModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  clientContext,
  onShowToast,
}) => {
  const [apiKey, setApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_API) || '';
    } catch {
      return '';
    }
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(apiKey);
  const [messages, setMessages] = useState<ChatMsg[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MSGS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'welcome',
        sender: 'assistant',
        text: `👑 **Hoş Geldiniz Sayın Yöneticim!**\n\nBen doğrudan platformun içine entegre edilmiş **Admin AI Co-Pilot** (Google Gemini) yapay zeka asistanınızım. Gün içinde bilgisayar başında olamadığınız anlarda cebinizden canlı BIST tavan adaylarını, maç analizlerini ve sistem durumunu yönetebilirsiniz.\n\nBana ne danışmak istersiniz?`,
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading]);

  // Persist messages
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MSGS, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // Save API key
  const handleSaveApiKey = () => {
    const trimmed = tempApiKey.trim();
    setApiKey(trimmed);
    try {
      localStorage.setItem(STORAGE_KEY_API, trimmed);
    } catch {}
    setIsSettingsOpen(false);
    onShowToast?.('✅ Gemini API Anahtarı başarıyla kaydedildi!');
  };

  const handleClearHistory = () => {
    if (window.confirm('Sohbet geçmişini sıfırlamak istiyor musunuz?')) {
      const welcome: ChatMsg = {
        id: 'welcome-' + Date.now(),
        sender: 'assistant',
        text: `👑 Sohbet sıfırlandı. Canlı veriler üzerinden sormak istediğiniz konuyu yazabilirsiniz.`,
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([welcome]);
      try {
        localStorage.removeItem(STORAGE_KEY_MSGS);
      } catch {}
      onShowToast?.('Sohbet geçmişi temizlendi.');
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: ChatMsg = {
      id: 'u-' + Date.now(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const chatHistory = messages.slice(-6).map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const res = await callAdminAICoPilotApi(text, chatHistory, apiKey, clientContext);

      if (res.success && res.reply) {
        const assistantMsg: ChatMsg = {
          id: 'a-' + Date.now(),
          sender: 'assistant',
          text: res.reply,
          timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        const errorMsg: ChatMsg = {
          id: 'err-' + Date.now(),
          sender: 'assistant',
          text: `⚠️ **Hata:** ${res.error || 'Yapay zeka yanıtı alınamadı.'}\n\nLütfen Gemini API anahtarınızı kontrol ediniz.`,
          timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err: any) {
      const failMsg: ChatMsg = {
        id: 'fail-' + Date.now(),
        sender: 'assistant',
        text: `⚠️ **Bağlantı Hatası:** ${err.message || 'Sunucuya ulaşılamadı.'}`,
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, failMsg]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Render markdown-like simple text formatting
  const renderFormattedText = (raw: string) => {
    const lines = raw.split('\n');
    return (
      <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-2" />;

          // Headers
          if (line.startsWith('### ')) {
            return (
              <h4 key={idx} className="text-sm font-black text-amber-300 mt-2 pb-1 border-b border-amber-500/20">
                {line.replace('### ', '')}
              </h4>
            );
          }
          if (line.startsWith('## ') || line.startsWith('# ')) {
            return (
              <h3 key={idx} className="text-base font-black text-white mt-2 pb-1 border-b border-cyan-500/30">
                {line.replace(/^#+ /, '')}
              </h3>
            );
          }

          // Bullet points
          if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
            const clean = line.trim().replace(/^[\*\-] /, '');
            return (
              <div key={idx} className="flex items-start space-x-2 pl-2">
                <span className="text-amber-400 font-bold shrink-0 mt-0.5">•</span>
                <span
                  dangerouslySetInnerHTML={{
                    __html: formatBold(clean),
                  }}
                />
              </div>
            );
          }

          // Numbered lists
          const numMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
          if (numMatch) {
            return (
              <div key={idx} className="flex items-start space-x-2 pl-2">
                <span className="text-cyan-400 font-mono font-bold shrink-0">{numMatch[1]}.</span>
                <span
                  dangerouslySetInnerHTML={{
                    __html: formatBold(numMatch[2]),
                  }}
                />
              </div>
            );
          }

          return (
            <p
              key={idx}
              dangerouslySetInnerHTML={{
                __html: formatBold(line),
              }}
            />
          );
        })}
      </div>
    );
  };

  const formatBold = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-black">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-amber-200">$1</em>')
      .replace(/`(.*?)`/g, '<code class="px-1 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-[11px]">$1</code>');
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl h-[94vh] sm:h-[88vh] bg-slate-900/95 border-2 border-amber-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-amber-500/20">
        {/* Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 bg-gradient-to-r from-amber-950/60 via-slate-900 to-cyan-950/40 border-b border-amber-500/30 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20 shrink-0">
              <Crown className="w-5 h-5 text-slate-950 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-black text-white tracking-wide flex items-center gap-1.5">
                  <span>👑 Admin AI Co-Pilot</span>
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                  Yönetici Konsolu
                </span>
                {apiKey ? (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hidden xs:inline">
                    Gemini Aktif ⚡
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hidden xs:inline">
                    Anahtar Bekleniyor 🔑
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Google DeepMind Gemini 1.5 Entegrasyonu • Cebinizdeki 7/24 Baş Analist
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                isSettingsOpen || !apiKey
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="Google Gemini API Anahtarı Ayarları"
            >
              <Key className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">API Anahtarı</span>
            </button>

            <button
              onClick={handleClearHistory}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
              title="Sohbeti Temizle"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* API Key Drawer / Settings Banner */}
        {isSettingsOpen && (
          <div className="p-3.5 sm:p-4 bg-slate-950 border-b border-amber-500/30 space-y-2.5 animate-in slide-in-from-top duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" />
                <span>Google Gemini API Anahtarı</span>
              </span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>Ücretsiz API Anahtarı Al (Google AI Studio)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="password"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                placeholder="AIzaSy... ile başlayan Gemini API anahtarınızı yapıştırın"
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white font-mono focus:outline-hidden focus:border-amber-400"
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleSaveApiKey}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-xs font-black transition-all cursor-pointer hover:brightness-110 flex items-center justify-center space-x-1.5 shadow-md shadow-amber-500/20"
                >
                  <Check className="w-4 h-4" />
                  <span>Kaydet</span>
                </button>
                {apiKey && (
                  <button
                    onClick={() => {
                      setTempApiKey('');
                      setApiKey('');
                      try {
                        localStorage.removeItem(STORAGE_KEY_API);
                      } catch {}
                      onShowToast?.('API anahtarı kaldırıldı.');
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-bold cursor-pointer"
                  >
                    Kaldır
                  </button>
                )}
              </div>
            </div>
            <p className="text-[10px] text-slate-400">
              * Bu anahtar yalnızca sizin tarayıcınızda ve oturumunuzda saklanır, üçüncü şahıslarla asla paylaşılmaz.
            </p>
          </div>
        )}

        {/* Quick Suggestion Chips */}
        <div className="px-3 sm:px-6 py-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center space-x-1.5 overflow-x-auto scrollbar-none shrink-0">
          <span className="text-[10px] font-bold text-slate-400 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Hızlı Soru:</span>
          </span>
          {[
            '🎯 BIST Tavan Adaylarını Raporla',
            '⚡ Portföyümdeki Hisseleri Analiz Et',
            '⚽ Günün En Güvendiğin 3 Maçı',
            '📊 BIST Seans Görünümü & Strateji',
            '🖥️ Platform Sağlık ve Servis Durumu',
          ].map((promptText) => (
            <button
              key={promptText}
              disabled={loading}
              onClick={() => handleSend(promptText)}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-[11px] font-semibold text-slate-300 hover:text-white shrink-0 transition-all cursor-pointer whitespace-nowrap active:scale-95 disabled:opacity-50"
            >
              {promptText}
            </button>
          ))}
        </div>

        {/* Chat Message Scroll Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4">
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div
                key={m.id}
                className={`flex items-start space-x-2.5 sm:space-x-3 ${
                  isUser ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-black shadow-md ${
                    isUser
                      ? 'bg-cyan-500 text-slate-950 shadow-cyan-500/20'
                      : 'bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 shadow-amber-500/20'
                  }`}
                >
                  {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-3 sm:p-4 shadow-md ${
                    isUser
                      ? 'bg-gradient-to-br from-cyan-600 to-blue-700 text-white rounded-tr-none'
                      : 'bg-slate-950/90 border border-amber-500/30 text-slate-200 rounded-tl-none ring-1 ring-amber-500/10'
                  }`}
                >
                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/10 text-[10px]">
                    <span className="font-black opacity-80">
                      {isUser ? (currentUser?.name || 'Yönetici') : '👑 Admin AI Co-Pilot (Gemini)'}
                    </span>
                    <span className="font-mono opacity-60">{m.timestamp}</span>
                  </div>

                  {renderFormattedText(m.text)}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 flex items-center justify-center shrink-0 shadow-md animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-amber-500/30 rounded-tl-none flex items-center space-x-2.5">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="text-xs font-bold text-amber-300 ml-1">Gemini analiz ediyor...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-2.5 sm:p-4 bg-slate-950 border-t border-slate-800 flex items-center space-x-2 shrink-0"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Yöneticim, BIST hisseleri, tavan adayları veya maçlar hakkında soru sorun..."
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400 transition-colors"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 disabled:opacity-40 text-slate-950 font-black text-xs sm:text-sm flex items-center space-x-1.5 transition-all shadow-md shadow-amber-500/20 cursor-pointer disabled:cursor-not-allowed"
          >
            <span>Gönder</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
