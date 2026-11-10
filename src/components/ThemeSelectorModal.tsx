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
  Sparkles,
  Sliders,
  RotateCcw,
  Shield,
  Eye
} from 'lucide-react';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTheme: TeamTheme;
  onSelectTheme: (theme: TeamTheme) => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  isOpen,
  onClose,
  activeTheme,
  onSelectTheme
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');

  // Custom theme editor state
  const [customName, setCustomName] = useState('Takımım');
  const [customPrimary, setCustomPrimary] = useState('#fbbf24'); // Default Yellow
  const [customSecondary, setCustomSecondary] = useState('#1e3a8a'); // Default Navy
  const [customBg, setCustomBg] = useState('#040918'); // Default Deep Navy

  if (!isOpen) return null;

  const handleApplyCustom = () => {
    const custom = createCustomTheme(customName, customPrimary, customSecondary, customBg);
    onSelectTheme(custom);
    onClose();
  };

  const handleResetDefault = () => {
    onSelectTheme(DEFAULT_THEME);
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner"
              style={{
                backgroundColor: activeTheme.badgeBg,
                border: `1.5px solid ${activeTheme.primaryColor}`
              }}
            >
              <Palette className="w-5 h-5" style={{ color: activeTheme.primaryColor }} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center space-x-2">
                <span>Takım Teması & Renk Seçici</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono font-bold bg-slate-800 text-slate-300">
                  {activeTheme.emoji} {activeTheme.shortName}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Uygulamayı desteklediğin takımın renkleriyle donat!
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
              <div className="text-xs text-slate-400 font-medium">
                Aşağıdan desteklediğin takımı seç; arka plan, butonlar, rozetler ve istatistik vurguları anında takımının renklerine bürünsün:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PRESET_THEMES.map((theme) => {
                  const isSelected = activeTheme.id === theme.id;
                  return (
                    <div
                      key={theme.id}
                      onClick={() => onSelectTheme(theme)}
                      className={`relative p-3.5 rounded-2xl border transition-all cursor-pointer group hover:scale-[1.01] ${
                        isSelected
                          ? 'border-2 shadow-xl ring-2'
                          : 'border-slate-800 hover:border-slate-700 bg-slate-950/60'
                      }`}
                      style={{
                        backgroundColor: theme.bgDark,
                        borderColor: isSelected ? theme.primaryColor : undefined,
                        boxShadow: isSelected ? `0 0 25px -5px ${theme.primaryColor}40` : undefined
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <span className="text-2xl drop-shadow">{theme.emoji}</span>
                          <div>
                            <div className="font-black text-sm text-white group-hover:text-amber-200 transition-colors">
                              {theme.name}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {theme.club}
                            </div>
                          </div>
                        </div>

                        {/* Selection Badge */}
                        {isSelected ? (
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-md animate-scaleUp"
                            style={{
                              backgroundColor: theme.primaryColor,
                              color: theme.bgDark
                            }}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-slate-700 group-hover:border-slate-500" />
                        )}
                      </div>

                      {/* Color Palette Swatches Preview */}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                        <div className="flex items-center space-x-1.5">
                          <span
                            className="w-4 h-4 rounded-full border border-white/20 shadow-xs"
                            style={{ backgroundColor: theme.primaryColor }}
                            title="Ana Renk"
                          />
                          <span
                            className="w-4 h-4 rounded-full border border-white/20 shadow-xs"
                            style={{ backgroundColor: theme.secondaryColor }}
                            title="İkincil Renk"
                          />
                          <span
                            className="w-4 h-4 rounded-full border border-white/20 shadow-xs"
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
                          Önizleme
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
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  🎨 Kendi Takımının Renklerini Belirle
                </div>

                <div className="space-y-3">
                  {/* Team Name */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                      Takım / Tema Adı:
                    </label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="Örn: Göztepe, Bursaspor, Adana Demirspor..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-bold text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Color Pickers Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Primary Color */}
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-300 block">
                        Yazı & Buton Rengi:
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={customPrimary}
                          onChange={(e) => setCustomPrimary(e.target.value)}
                          className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0"
                        />
                        <span className="font-mono text-xs font-bold text-slate-300">
                          {customPrimary}
                        </span>
                      </div>
                    </div>

                    {/* Secondary Color */}
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-300 block">
                        İkincil Vurgu Rengi:
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={customSecondary}
                          onChange={(e) => setCustomSecondary(e.target.value)}
                          className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0"
                        />
                        <span className="font-mono text-xs font-bold text-slate-300">
                          {customSecondary}
                        </span>
                      </div>
                    </div>

                    {/* Background Dark Color */}
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-300 block">
                        Arka Plan Rengi:
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={customBg}
                          onChange={(e) => setCustomBg(e.target.value)}
                          className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0"
                        />
                        <span className="font-mono text-xs font-bold text-slate-300">
                          {customBg}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Preview Box */}
              <div
                className="p-4 rounded-2xl border transition-all"
                style={{
                  backgroundColor: customBg,
                  borderColor: customPrimary,
                  boxShadow: `0 0 20px ${customPrimary}30`
                }}
              >
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div className="flex items-center space-x-2">
                    <Eye className="w-4 h-4" style={{ color: customPrimary }} />
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: customPrimary }}>
                      {customName} Canlı Önizleme
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ backgroundColor: `${customPrimary}20`, color: customPrimary }}>
                    Örnek Maç Kartı
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between text-white font-bold text-sm">
                  <span>Ev Sahibi</span>
                  <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ backgroundColor: customSecondary, color: '#ffffff' }}>
                    2 - 1
                  </span>
                  <span>Deplasman</span>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    className="flex-1 py-1.5 px-3 rounded-xl font-black text-xs shadow-md"
                    style={{
                      backgroundColor: customPrimary,
                      color: customBg
                    }}
                  >
                    Kupona Ekle (%78 Güven)
                  </button>
                  <span className="text-xs font-mono font-bold" style={{ color: customPrimary }}>
                    Oran: 1.85
                  </span>
                </div>
              </div>

              <button
                onClick={handleApplyCustom}
                className="w-full py-3 rounded-2xl font-black text-sm transition-all cursor-pointer shadow-lg active:scale-95"
                style={{
                  backgroundColor: customPrimary,
                  color: customBg
                }}
              >
                Bu Renkleri Uygula ve Kaydet 🎨
              </button>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80">
          <button
            onClick={handleResetDefault}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Orijinal Temaya Dön</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-md cursor-pointer"
          >
            Tamamdır
          </button>
        </div>

      </div>
    </div>
  );
};
