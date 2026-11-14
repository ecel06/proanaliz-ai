// src/components/FeedbackModal.tsx
import React, { useState } from 'react';
import {
  X,
  MessageSquare,
  Bug,
  Lightbulb,
  BarChart2,
  Star,
  Send,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (message: string) => void;
  userEmail?: string;
}

type FeedbackType = 'bug' | 'feature' | 'data' | 'general';

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
  userEmail = '',
}) => {
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('bug');
  const [targetModule, setTargetModule] = useState<string>('stocks');
  const [rating, setRating] = useState<number>(5);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState(userEmail);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const feedbackItem = {
      id: `fb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: feedbackType,
      module: targetModule,
      rating,
      title: title.trim() || 'Geri Bildirim',
      message: message.trim(),
      contact: contact.trim(),
      createdAt: new Date().toISOString(),
      appVersion: 'v2026.11.14.23 (BETA)',
    };

    try {
      const existingRaw = localStorage.getItem('proanaliz_feedback_list_v1');
      const list = existingRaw ? JSON.parse(existingRaw) : [];
      list.unshift(feedbackItem);
      localStorage.setItem('proanaliz_feedback_list_v1', JSON.stringify(list));
    } catch {
      // LocalStorage fallback
    }

    setSubmitted(true);
    onShowToast?.('🎉 Geri bildiriminiz başarıyla iletildi! Katkınız için teşekkürler.');
    setTimeout(() => {
      setSubmitted(false);
      setTitle('');
      setMessage('');
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <MessageSquare className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  ProAnaliz AI Geri Bildirim &amp; Fikir Kutusu
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  TEST (BETA)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Sistem aktif test aşamasındadır. Fikirleriniz ve hata bildirimleriniz sistemi mükemmelleştirir.
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

        {/* Body */}
        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 animate-bounce" />
            </div>
            <h4 className="text-lg font-bold text-white">Geri Bildiriminiz Alındı!</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Değerli vaktinizi ayırıp görüşlerinizi paylaştığınız için teşekkür ederiz. İlettiğiniz
              bilgiler doğrudan geliştirici ekibine kaydedildi.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* Feedback Type Tabs */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Bildirim Türü
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'bug', label: 'Hata Bildirimi', icon: Bug, color: 'text-rose-400' },
                  { id: 'feature', label: 'Özellik / Fikir', icon: Lightbulb, color: 'text-amber-400' },
                  { id: 'data', label: 'Veri & Hesap', icon: BarChart2, color: 'text-cyan-400' },
                  { id: 'general', label: 'Genel Puan', icon: Star, color: 'text-emerald-400' },
                ].map((t) => {
                  const active = feedbackType === t.id;
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setFeedbackType(t.id as FeedbackType)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                        active
                          ? 'bg-amber-500/15 border-amber-500/60 text-amber-300 shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${t.color}`} />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Module & Rating */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  İlgili Modül / Bölüm
                </label>
                <select
                  value={targetModule}
                  onChange={(e) => setTargetModule(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="stocks">🇹🇷 Borsa İstanbul (Halka Arz, Temettü, KAP, AKD)</option>
                  <option value="crypto">🪙 Kripto Para Terminali</option>
                  <option value="us">🇺🇸 ABD Borsaları (NASDAQ / NYSE)</option>
                  <option value="football">⚽ İddaa &amp; Canlı Futbol Bülteni</option>
                  <option value="horseRacing">🏇 TJK &amp; At Yarışı Bülteni</option>
                  <option value="general">🌐 Genel Arayüz &amp; Mobil Deneyim</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Deneyim Puanınız
                </label>
                <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 cursor-pointer transition-transform hover:scale-125"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-600 hover:text-slate-500'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-amber-300 ml-2 font-mono">{rating}/5</span>
                </div>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Konu Başlığı (Özet)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: Temettü takviminde filtreleme önerisi..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Açıklama / Mesajınız <span className="text-rose-400">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Gördüğünüz hatayı, geliştirmemizi istediğiniz detayı veya fikrinizi buraya yazabilirsiniz..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            {/* Optional Contact */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                İletişim / E-posta (İsteğe bağlı, yanıt dönmemizi isterseniz)
              </label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="ornek@mail.com veya adınız..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Legal Notice */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex items-start gap-2.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Yasal Bildirim (YTD):</strong> ProAnaliz AI bir araştırma ve simülasyon
                yazılımıdır. Sistemde paylaşılan borsa, spor ve yarış verileri test amaçlı olup
                yatırım danışmanlığı kapsamında değildir.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                disabled={!message.trim()}
                className="px-5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-md shadow-amber-950/40 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Geri Bildirimi Gönder</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
