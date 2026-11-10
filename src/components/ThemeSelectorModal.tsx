// src/components/ThemeSelectorModal.tsx
// Interactive Team Theme & Custom Color Selector Modal for ProAnaliz AI

import React, { useState } from 'react';
import {
  TeamTheme,
  PRESET_THEMES,
  DEFAULT_THEME,
  createCustomTheme
} from '../utils/themeHelper';
import {
  Palette,
  X,
  Check,
  Sliders,
  RotateCcw,
  Shield,
  Eye,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTheme: TeamTheme;
  onSelectTheme: (theme: TeamTheme) => void;
}

// Quick selectable color chips
const POPULAR_SWATCHES = [
  { label: 'Kanarya Sarısı', hex: '#fbbf24' },
  { label: 'Koyu Lacivert', hex: '#040a1c' },
  { label: 'Aslan Kırmızısı', hex: '#dc2626' },
  { label: 'Kartal Siyahı', hex: '#000000' },
  { label: 'Kar Beyazı', hex: '#ffffff' },
  { label: 'Karadeniz Mavisi', hex: '#0284c7' },
  { label: 'Bordo', hex: '#881337' },
  { label: 'Timsah Yeşili', hex: '#16a34a' },
  { label: 'Zümrüt Yeşili', hex: '#10b981' },
  { label: 'Gece Mavisi', hex: '#0b1329' }
];

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  isOpen,
  onClose,
  activeTheme,
  onSelectTheme
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [justAppliedMessage, setJustAppliedMessage] = useState<string | null>(null);

  // Custom theme editor state
  const [customName, setCustomName] = useState('Takımım');
  const [customPrimary, setCustomPrimary] = useState('#fbbf24'); // Yellow
  const [customSecondary, setCustomSecondary] = useState('#1e3a8a'); // Navy
  const [customBg, setCustomBg] = useState('#040a1c'); // Deep Navy

  if (!isOpen) return null;

  const handleSelectPreset = (theme: TeamTheme) => {
    onSelectTheme(theme);
    setJustAppliedMessage(`${theme.emoji} ${theme.name} teması uygulandı!`);
    setTimeout(() => setJustAppliedMessage(null), 3000);
  };

  const handleApplyCustom = () => {
    const custom = createCustomTheme(customName, customPrimary, customSecondary, customBg);
    onSelectTheme(custom);
    setJustAppliedMessage(`🎨 "${custom.name}" teması kaydedildi ve uygulandı!`);
    setTimeout(() => {
      setJustAppliedMessage(null);
      onClose();
    }, 1200);
  };

  const handleResetDefault = () => {
    onSelectTheme(DEFAULT_THEME);
    setJustAppliedMessage('🟢 Varsayılan ProAnaliz temasına dönüldü.');
    setTimeout(() => setJustAppliedMessage(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner"
              style={{
                backgroundColor: activeTheme.badgeBg || 'rgba(251, 191, 36, 0.2)',
                border: `1.5px solid ${activeTheme.primaryColor}`
              }}
            >
              <Palette className="w-5 h-5" style={{ color: activeTheme.primaryColor }} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center space-x-2">
                <span>Takım Teması & Renk Seçici</span>
                <span
                  className="text-xs px-2.5 py-0.5 rounded-full font-mono font-black border"
                  style={{
                    backgroundColor: activeTheme.badgeBg,
                    color: activeTheme.primaryColor,
                    borderColor: activeTheme.cardBorder
                  }}
                >
                  {activeTheme.emoji} {activeTheme.shortName}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Uygulama arka planını, butonlarını ve yazılarını takımının renklerine dönüştür!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Applied Success Toast */}
        {justAppliedMessage && (
          <div className="px-4 py-2.5 bg-emerald-500/20 border-b border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center space-x-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{justAppliedMessage}</span>
          </div>
        )}

        {/* Tab Switcher: Hazır Takımlar vs Özel Renkler */}
        <div className="flex items-center px-4 sm:px-6 pt-3 pb-2 gap-2 border-b border-slate-800/80 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('presets')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'presets'
                ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4 text-amber-400" />
            <span>Hazır Takım Temaları</span>
          </button>

          <button
            onClick={() => setActiveTab('custom')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'custom'
                ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>Özel Renk Yarat</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* TAB 1: PRESET TEAM THEMES */}
          {activeTab === 'presets' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-300 font-medium">
                Takımını seç; sayfanın arka planı, kartları, butonları ve vurguları anında o takımın renklerine dönüşsün:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PRESET_THEMES.map((theme) => {
                  const isSelected = activeTheme.id === theme.id;
                  return (
                    <div
                      key={theme.id}
                      onClick={() => handleSelectPreset(theme)}
                      className={`relative p-3.5 rounded-2xl border transition-all cursor-pointer group hover:scale-[1.01] ${
                        isSelected
                          ? 'border-2 shadow-2xl ring-2 ring-white/20'
                          : 'border-slate-800 hover:border-slate-600 bg-slate-950/70'
                      }`}
                      style={{
                        backgroundColor: theme.bgDark,
                        borderColor: isSelected ? theme.primaryColor : undefined,
                        boxShadow: isSelected ? `0 0 25px -4px ${theme.primaryColor}50` : undefined
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <span className="text-2xl drop-shadow">{theme.emoji}</span>
                          <div>
                            <div
                              className="font-black text-sm text-white group-hover:brightness-125 transition-all"
                              style={{ color: isSelected ? theme.primaryColor : undefined }}
                            >
                              {theme.name}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {theme.club}
                            </div>
                          </div>
                        </div>

                        {/* Selection Checkmark */}
                        {isSelected ? (
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-md"
                            style={{
                              backgroundColor: theme.primaryColor,
                              color: theme.bgDark
                            }}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-slate-700 group-hover:border-slate-400" />
                        )}
                      </div>

                      {/* Color Palette Swatches Preview */}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/10">
                        <div className="flex items-center space-x-1.5">
                          <span
                            className="w-4 h-4 rounded-full border border-white/30 shadow-xs"
                            style={{ backgroundColor: theme.primaryColor }}
                            title="Ana Vurgu Rengi"
                          />
                          <span
                            className="w-4 h-4 rounded-full border border-white/30 shadow-xs"
                            style={{ backgroundColor: theme.secondaryColor }}
                            title="İkincil Renk"
                          />
                          <span
                            className="w-4 h-4 rounded-full border border-white/30 shadow-xs"
                            style={{ backgroundColor: theme.bgDark }}
                            title="Arka Plan Rengi"
                          />
                        </div>

                        <span
                          className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border"
                          style={{
                            color: theme.accentText,
                            backgroundColor: theme.badgeBg,
                            borderColor: theme.cardBorder
                          }}
                        >
                          {isSelected ? '✓ Aktif Tema' : 'Tıkla ve Uygula'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOM COLOR CREATOR */}
          {activeTab === 'custom' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white uppercase tracking-wider flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Kendi Renk Kombinasyonunu Oluştur</span>
                  </span>
                  <span className="text-[11px] text-slate-400">Canlı Önizlemeli</span>
                </div>

                {/* Team Name Input */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Takım / Tema Adı:
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Örn: Fenerbahçem, Göztepe, Eskişehirspor..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-bold text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* 1. Arka Plan Rengi */}
                <div className="space-y-2 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200">
                      1. Arka Plan Rengi (Background):
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={customBg}
                        onChange={(e) => setCustomBg(e.target.value)}
                        className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={customBg}
                        onChange={(e) => setCustomBg(e.target.value)}
                        className="w-20 px-2 py-0.5 rounded bg-slate-950 border border-slate-700 font-mono text-xs font-bold text-amber-300 uppercase"
                      />
                    </div>
                  </div>
                  {/* Quick Color Swatches for Background */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {POPULAR_SWATCHES.map((swatch) => (
                      <button
                        key={swatch.hex}
                        type="button"
                        onClick={() => setCustomBg(swatch.hex)}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold border transition-transform hover:scale-105 cursor-pointer flex items-center space-x-1"
                        style={{
                          backgroundColor: swatch.hex === '#ffffff' ? '#e2e8f0' : swatch.hex,
                          color: swatch.hex === '#ffffff' || swatch.hex === '#fbbf24' ? '#000000' : '#ffffff',
                          borderColor: customBg === swatch.hex ? '#38bdf8' : 'rgba(255,255,255,0.1)'
                        }}
                      >
                        <span>{swatch.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Yazı & Buton Rengi (Primary) */}
                <div className="space-y-2 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200">
                      2. Yazı, Vurgu & Buton Rengi (Primary):
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={customPrimary}
                        onChange={(e) => setCustomPrimary(e.target.value)}
                        className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={customPrimary}
                        onChange={(e) => setCustomPrimary(e.target.value)}
                        className="w-20 px-2 py-0.5 rounded bg-slate-950 border border-slate-700 font-mono text-xs font-bold text-amber-300 uppercase"
                      />
                    </div>
                  </div>
                  {/* Quick Color Swatches for Primary */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {POPULAR_SWATCHES.map((swatch) => (
                      <button
                        key={swatch.hex}
                        type="button"
                        onClick={() => setCustomPrimary(swatch.hex)}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold border transition-transform hover:scale-105 cursor-pointer flex items-center space-x-1"
                        style={{
                          backgroundColor: swatch.hex === '#ffffff' ? '#e2e8f0' : swatch.hex,
                          color: swatch.hex === '#ffffff' || swatch.hex === '#fbbf24' ? '#000000' : '#ffffff',
                          borderColor: customPrimary === swatch.hex ? '#38bdf8' : 'rgba(255,255,255,0.1)'
                        }}
                      >
                        <span>{swatch.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. İkincil Renk (Secondary) */}
                <div className="space-y-2 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200">
                      3. İkincil Vurgu Rengi (Secondary):
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={customSecondary}
                        onChange={(e) => setCustomSecondary(e.target.value)}
                        className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={customSecondary}
                        onChange={(e) => setCustomSecondary(e.target.value)}
                        className="w-20 px-2 py-0.5 rounded bg-slate-950 border border-slate-700 font-mono text-xs font-bold text-amber-300 uppercase"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* LIVE REAL-TIME PREVIEW CARD */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center space-x-1">
                    <Eye className="w-4 h-4 text-emerald-400" />
                    <span>Canlı Kart & Yazı Önizlemesi:</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Renkler değiştikçe anında güncellenir</span>
                </div>

                <div
                  className="p-5 rounded-2xl border-2 transition-all shadow-2xl"
                  style={{
                    backgroundColor: customBg,
                    borderColor: customPrimary,
                    boxShadow: `0 0 30px ${customPrimary}35`
                  }}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-black uppercase tracking-wider" style={{ color: customPrimary }}>
                        {customName || 'Özel Takımım'}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: `${customPrimary}25`, color: customPrimary }}>
                        Süper Lig • Canlı
                      </span>
                    </div>
                    <span className="font-mono text-xs font-extrabold" style={{ color: customPrimary }}>
                      %82 Güven
                    </span>
                  </div>

                  <div className="my-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: customPrimary }} />
                      <span className="text-base font-black text-white">{customName || 'Ev Sahibi'}</span>
                    </div>

                    <div className="px-3 py-1 rounded-xl font-mono text-sm font-black border" style={{ backgroundColor: customSecondary, color: '#ffffff', borderColor: customPrimary }}>
                      2 - 1
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-base font-black text-white">Rakip Takım</span>
                      <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: customSecondary }} />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-3 border-t border-white/10">
                    <button
                      type="button"
                      className="flex-1 py-2.5 px-4 rounded-xl font-black text-xs transition-transform active:scale-95 shadow-lg"
                      style={{
                        backgroundColor: customPrimary,
                        color: customBg
                      }}
                    >
                      Kupona Ekle (MS 1)
                    </button>

                    <div className="text-right">
                      <div className="text-[10px] text-slate-400">Yapay Zeka Oranı</div>
                      <div className="text-sm font-mono font-black" style={{ color: customPrimary }}>
                        1.85
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Apply Custom Theme Button */}
              <button
                type="button"
                onClick={handleApplyCustom}
                className="w-full py-3.5 px-4 rounded-2xl font-black text-sm transition-all cursor-pointer shadow-xl active:scale-95 flex items-center justify-center space-x-2"
                style={{
                  backgroundColor: customPrimary,
                  color: customBg
                }}
              >
                <Sparkles className="w-4 h-4 fill-current" />
                <span>Bu Renkleri Tüm Uygulamaya Uygula & Kaydet</span>
              </button>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-t border-slate-800 bg-slate-950/90">
          <button
            onClick={handleResetDefault}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Orijinal Temaya Sıfırla</span>
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-md cursor-pointer"
          >
            Tamamdır
          </button>
        </div>

      </div>
    </div>
  );
};
