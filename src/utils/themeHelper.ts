// src/utils/themeHelper.ts
// Comprehensive Team Themes & Custom Color Customization Engine for ProAnaliz AI

export interface TeamTheme {
  id: string;
  name: string;
  shortName: string;
  club: string;
  emoji: string;
  primaryColor: string; // Vurgu & Yazı & Buton Rengi (örn #fbbf24 Kanarya Sarısı)
  secondaryColor: string; // İkincil Renk (örn #1e3a8a Lacivert)
  bgDark: string; // Ana Sayfa Arka Planı (örn #030816 Derin Gece Laciverti)
  cardBg: string; // Kart ve Panel Arka Planı (örn #081126)
  cardBorder: string; // Kenarlık rengi (örn rgba(251, 191, 36, 0.28))
  accentText: string; // Parlak metin rengi
  badgeBg: string; // Rozet arka planı
  isCustom?: boolean;
}

export const PRESET_THEMES: TeamTheme[] = [
  {
    id: 'fenerbahce',
    name: 'Fenerbahçe',
    shortName: 'FB',
    club: 'Fenerbahçe SK',
    emoji: '💛💙',
    primaryColor: '#fbbf24', // Kanarya Sarısı
    secondaryColor: '#1e3a8a', // Koyu Lacivert
    bgDark: '#040a1c', // Derin Gece Laciverti
    cardBg: '#091536',
    cardBorder: 'rgba(251, 191, 36, 0.35)',
    accentText: '#fde047',
    badgeBg: 'rgba(251, 191, 36, 0.18)'
  },
  {
    id: 'galatasaray',
    name: 'Galatasaray',
    shortName: 'GS',
    club: 'Galatasaray SK',
    emoji: '❤️💛',
    primaryColor: '#f59e0b', // Aslan Sarısı
    secondaryColor: '#be123c', // Gül/Bordo Kırmızı
    bgDark: '#120306', // Derin Bordo Gece
    cardBg: '#24080e',
    cardBorder: 'rgba(245, 158, 11, 0.35)',
    accentText: '#fbbf24',
    badgeBg: 'rgba(245, 158, 11, 0.18)'
  },
  {
    id: 'besiktas',
    name: 'Beşiktaş',
    shortName: 'BJK',
    club: 'Beşiktaş JK',
    emoji: '🖤🤍',
    primaryColor: '#ffffff', // Saf Kar Beyazı
    secondaryColor: '#64748b', // Kartal Grisi
    bgDark: '#000000', // Saf OLED Siyah
    cardBg: '#111116',
    cardBorder: 'rgba(255, 255, 255, 0.3)',
    accentText: '#ffffff',
    badgeBg: 'rgba(255, 255, 255, 0.15)'
  },
  {
    id: 'trabzonspor',
    name: 'Trabzonspor',
    shortName: 'TS',
    club: 'Trabzonspor',
    emoji: '💙❤️',
    primaryColor: '#38bdf8', // Karadeniz Gök Mavisi
    secondaryColor: '#9f1239', // Bordo
    bgDark: '#0d0409', // Derin Bordo Gece
    cardBg: '#1c0814',
    cardBorder: 'rgba(56, 189, 248, 0.35)',
    accentText: '#7dd3fc',
    badgeBg: 'rgba(56, 189, 248, 0.18)'
  },
  {
    id: 'bursaspor',
    name: 'Bursaspor',
    shortName: 'BUR',
    club: 'Bursaspor',
    emoji: '💚🤍',
    primaryColor: '#22c55e', // Timsah Yeşili
    secondaryColor: '#ffffff',
    bgDark: '#021006',
    cardBg: '#08210f',
    cardBorder: 'rgba(34, 197, 94, 0.35)',
    accentText: '#4ade80',
    badgeBg: 'rgba(34, 197, 94, 0.18)'
  },
  {
    id: 'goztepe',
    name: 'Göztepe',
    shortName: 'GÖZ',
    club: 'Göztepe SK',
    emoji: '💛❤️',
    primaryColor: '#eab308', // Göztepe Sarısı
    secondaryColor: '#dc2626', // Kırmızı
    bgDark: '#140504',
    cardBg: '#260a08',
    cardBorder: 'rgba(234, 179, 8, 0.35)',
    accentText: '#fde047',
    badgeBg: 'rgba(234, 179, 8, 0.18)'
  },
  {
    id: 'adanademir',
    name: 'Adana Demirspor',
    shortName: 'ADS',
    club: 'Adana Demirspor',
    emoji: '💙⚡',
    primaryColor: '#0ea5e9', // Şimşek Mavisi
    secondaryColor: '#1e3a8a', // Lacivert
    bgDark: '#030816',
    cardBg: '#091530',
    cardBorder: 'rgba(14, 165, 233, 0.35)',
    accentText: '#38bdf8',
    badgeBg: 'rgba(14, 165, 233, 0.18)'
  },
  {
    id: 'realmadrid',
    name: 'Real Madrid',
    shortName: 'RMA',
    club: 'Real Madrid CF',
    emoji: '👑🤍',
    primaryColor: '#fbbf24', // Kraliyet Altını
    secondaryColor: '#7c3aed', // Mor
    bgDark: '#060614',
    cardBg: '#0e0f2b',
    cardBorder: 'rgba(251, 191, 36, 0.35)',
    accentText: '#fde047',
    badgeBg: 'rgba(251, 191, 36, 0.18)'
  },
  {
    id: 'barcelona',
    name: 'Barcelona',
    shortName: 'FCB',
    club: 'FC Barcelona',
    emoji: '🔴🔵',
    primaryColor: '#f43f5e', // Blaugrana Kırmızı
    secondaryColor: '#2563eb', // Blaugrana Mavi
    bgDark: '#0a0516',
    cardBg: '#170b30',
    cardBorder: 'rgba(244, 63, 94, 0.35)',
    accentText: '#fb7185',
    badgeBg: 'rgba(244, 63, 94, 0.18)'
  },
  {
    id: 'proanaliz',
    name: 'ProAnaliz Orijinal',
    shortName: 'AI',
    club: 'Varsayılan Tema',
    emoji: '🟢⚽',
    primaryColor: '#10b981', // Zümrüt Yeşili
    secondaryColor: '#064e3b',
    bgDark: '#020617', // Slate 950
    cardBg: '#0f172a',
    cardBorder: 'rgba(16, 185, 129, 0.25)',
    accentText: '#34d399',
    badgeBg: 'rgba(16, 185, 129, 0.15)'
  }
];

export const DEFAULT_THEME: TeamTheme = PRESET_THEMES[PRESET_THEMES.length - 1]; // ProAnaliz Varsayılan

const STORAGE_KEY = 'proanaliz_active_team_theme';

export function getStoredTheme(): TeamTheme {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_THEME;
    const parsed = JSON.parse(raw);
    return parsed.id ? parsed : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function saveStoredTheme(theme: TeamTheme): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
  } catch {}
}

/**
 * Injects dynamic CSS rules globally onto document.head so the entire app
 * instantly transforms into the chosen team's colors (background, cards, borders, buttons, and accents).
 */
export function applyThemeToDOM(theme: TeamTheme): void {
  if (typeof document === 'undefined') return;

  const styleId = 'proanaliz-dynamic-team-theme';
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;

  if (theme.id === 'proanaliz') {
    if (styleEl) {
      styleEl.innerHTML = '';
    }
    if (document.body) {
      document.body.style.backgroundColor = '#020617';
    }
    return;
  }

  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  styleEl.innerHTML = `
    /* ProAnaliz AI - Active Team Theme: ${theme.name} (${theme.id}) */
    html, body, #root, .min-h-screen, .bg-slate-950 {
      background-color: ${theme.bgDark} !important;
    }
    
    /* Card & Panel Surfaces */
    .bg-slate-900, 
    .bg-slate-900\\/40, 
    .bg-slate-900\\/60, 
    .bg-slate-900\\/70, 
    .bg-slate-900\\/80, 
    .bg-slate-900\\/90, 
    .bg-slate-950\\/60, 
    .bg-slate-950\\/70, 
    .bg-slate-950\\/80, 
    .bg-slate-950\\/90,
    .glass-panel {
      background-color: ${theme.cardBg} !important;
    }
    
    /* Borders */
    .border-slate-800, 
    .border-slate-800\\/60, 
    .border-slate-800\\/80,
    .border-slate-700,
    .border-slate-700\\/80 {
      border-color: ${theme.cardBorder} !important;
    }
    
    /* Primary Text & Icon Highlights */
    .text-emerald-400, 
    .text-emerald-300, 
    .text-emerald-500 {
      color: ${theme.primaryColor} !important;
    }
    
    /* Primary Buttons & Solid Badges */
    .bg-emerald-500, 
    .bg-emerald-400, 
    .bg-emerald-600 {
      background-color: ${theme.primaryColor} !important;
      color: ${theme.bgDark} !important;
    }
    
    /* Soft Pill Badges */
    .bg-emerald-500\\/10, 
    .bg-emerald-500\\/15, 
    .bg-emerald-500\\/20, 
    .bg-emerald-500\\/25, 
    .bg-emerald-500\\/30,
    .bg-emerald-500\\/40 {
      background-color: ${theme.badgeBg} !important;
      color: ${theme.primaryColor} !important;
    }
    
    /* Primary Accent Borders */
    .border-emerald-500, 
    .border-emerald-400, 
    .border-emerald-500\\/20, 
    .border-emerald-500\\/30, 
    .border-emerald-500\\/40, 
    .border-emerald-500\\/50 {
      border-color: ${theme.primaryColor} !important;
    }
    
    /* Ambient Glows */
    .glow-emerald {
      box-shadow: 0 0 25px -4px ${theme.primaryColor}40 !important;
    }

    ::selection {
      background-color: ${theme.primaryColor} !important;
      color: ${theme.bgDark} !important;
    }
  `;

  if (document.body) {
    document.body.style.backgroundColor = theme.bgDark;
  }
}

/**
 * Creates a custom user theme from custom color hex codes.
 */
export function createCustomTheme(
  name: string,
  primaryColor: string,
  secondaryColor: string,
  bgDark: string
): TeamTheme {
  return {
    id: `custom_${Date.now()}`,
    name: name || 'Özel Temam',
    shortName: (name || 'Özel').slice(0, 4).toUpperCase(),
    club: 'Özel Renkler',
    emoji: '🎨',
    primaryColor,
    secondaryColor,
    bgDark,
    cardBg: adjustBrightness(bgDark, 14),
    cardBorder: hexToRgba(primaryColor, 0.35),
    accentText: primaryColor,
    badgeBg: hexToRgba(primaryColor, 0.18),
    isCustom: true
  };
}

function hexToRgba(hex: string, alpha: number): string {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return `rgba(251, 191, 36, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function adjustBrightness(hex: string, percent: number): string {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  let num = parseInt(c, 16);
  if (isNaN(num)) return '#0a1020';
  let r = Math.min(255, Math.max(0, ((num >> 16) & 255) + percent));
  let g = Math.min(255, Math.max(0, ((num >> 8) & 255) + percent));
  let b = Math.min(255, Math.max(0, (num & 255) + percent));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
