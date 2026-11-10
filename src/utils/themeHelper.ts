// src/utils/themeHelper.ts
// Comprehensive Team Themes & Custom Color Customization Engine for ProAnaliz AI

export interface TeamTheme {
  id: string;
  name: string;
  shortName: string;
  club: string;
  emoji: string;
  primaryColor: string; // Vurgu & Yazı & Buton Rengi
  secondaryColor: string; // İkincil Renk
  bgDark: string; // Ana Sayfa Arka Planı
  cardBg: string; // Kart ve Panel Arka Planı
  cardBorder: string; // Kenarlık rengi
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
    primaryColor: '#FFED00', // Resmi 100% Canlı Kanarya Sarısı
    secondaryColor: '#002D72', // Resmi Pantone 281 C Lacivert
    bgDark: '#020718', // Derin Gece Laciverti
    cardBg: '#061334', // Net Canlı Lacivert Kartlar
    cardBorder: 'rgba(255, 237, 0, 0.45)', // Parlak Sarı Çerçeve
    accentText: '#FFED00',
    badgeBg: 'rgba(255, 237, 0, 0.20)'
  },
  {
    id: 'galatasaray',
    name: 'Galatasaray',
    shortName: 'GS',
    club: 'Galatasaray SK',
    emoji: '❤️💛',
    primaryColor: '#FFD100', // Canlı Parlak Aslan Sarısı
    secondaryColor: '#E30613', // Resmi Canlı Bayrak Kırmızısı
    bgDark: '#080103', // Derin Saf Gece (Kahverengilik kesinlikle sıfır)
    cardBg: '#150307', // Net Asil Yakut Kırmızısı Kart Yüzeyi
    cardBorder: 'rgba(227, 6, 19, 0.55)', // Alev Kırmızısı Çerçeveler
    accentText: '#FFD100', // Canlı Aslan Sarısı Vurgular
    badgeBg: 'rgba(227, 6, 19, 0.25)'
  },
  {
    id: 'besiktas',
    name: 'Beşiktaş',
    shortName: 'BJK',
    club: 'Beşiktaş JK',
    emoji: '🖤🤍',
    primaryColor: '#FFFFFF', // Saf Kar Beyazı
    secondaryColor: '#94A3B8', // Kartal Grisi
    bgDark: '#000000', // Saf OLED Siyah
    cardBg: '#0D0D11', // Mat Siyah Kart
    cardBorder: 'rgba(255, 255, 255, 0.40)', // Beyaz Çerçeve
    accentText: '#FFFFFF',
    badgeBg: 'rgba(255, 255, 255, 0.16)'
  },
  {
    id: 'trabzonspor',
    name: 'Trabzonspor',
    shortName: 'TS',
    club: 'Trabzonspor',
    emoji: '💙❤️',
    primaryColor: '#00A3E0', // Karadeniz Gök Mavisi
    secondaryColor: '#990033', // Ateş Bordosu
    bgDark: '#050204',
    cardBg: '#12050D',
    cardBorder: 'rgba(0, 163, 224, 0.45)',
    accentText: '#38BDF8',
    badgeBg: 'rgba(0, 163, 224, 0.20)'
  },
  {
    id: 'bursaspor',
    name: 'Bursaspor',
    shortName: 'BUR',
    club: 'Bursaspor',
    emoji: '💚🤍',
    primaryColor: '#00C853', // Parlak Timsah Yeşili
    secondaryColor: '#FFFFFF',
    bgDark: '#010D05',
    cardBg: '#051E0C',
    cardBorder: 'rgba(0, 200, 83, 0.45)',
    accentText: '#69F0AE',
    badgeBg: 'rgba(0, 200, 83, 0.20)'
  },
  {
    id: 'goztepe',
    name: 'Göztepe',
    shortName: 'GÖZ',
    club: 'Göztepe SK',
    emoji: '💛❤️',
    primaryColor: '#FFD700', // Altın Sarısı
    secondaryColor: '#E00000', // Canlı Kırmızı
    bgDark: '#0F0302',
    cardBg: '#220705',
    cardBorder: 'rgba(255, 215, 0, 0.45)',
    accentText: '#FFE082',
    badgeBg: 'rgba(255, 215, 0, 0.20)'
  },
  {
    id: 'adanademir',
    name: 'Adana Demirspor',
    shortName: 'ADS',
    club: 'Adana Demirspor',
    emoji: '💙⚡',
    primaryColor: '#00B4D8', // Canlı Şimşek Mavisi
    secondaryColor: '#002855', // Lacivert
    bgDark: '#020712',
    cardBg: '#05132B',
    cardBorder: 'rgba(0, 180, 216, 0.45)',
    accentText: '#90E0EF',
    badgeBg: 'rgba(0, 180, 216, 0.20)'
  },
  {
    id: 'realmadrid',
    name: 'Real Madrid',
    shortName: 'RMA',
    club: 'Real Madrid CF',
    emoji: '👑🤍',
    primaryColor: '#FFD700', // Kraliyet Altını
    secondaryColor: '#6A0DAD', // Kraliyet Moru
    bgDark: '#040410',
    cardBg: '#0C0D28',
    cardBorder: 'rgba(255, 215, 0, 0.45)',
    accentText: '#FFD700',
    badgeBg: 'rgba(255, 215, 0, 0.20)'
  },
  {
    id: 'barcelona',
    name: 'Barcelona',
    shortName: 'FCB',
    club: 'FC Barcelona',
    emoji: '🔴🔵',
    primaryColor: '#FF1E42', // Canlı Blaugrana Kırmızı
    secondaryColor: '#004D98', // Blaugrana Mavi
    bgDark: '#050210',
    cardBg: '#120726',
    cardBorder: 'rgba(255, 30, 66, 0.45)',
    accentText: '#FF7088',
    badgeBg: 'rgba(255, 30, 66, 0.20)'
  },
  {
    id: 'proanaliz',
    name: 'ProAnaliz Orijinal',
    shortName: 'AI',
    club: 'Varsayılan Tema',
    emoji: '🟢⚽',
    primaryColor: '#10B981', // Zümrüt Yeşili
    secondaryColor: '#064E3B',
    bgDark: '#020617', // Slate 950
    cardBg: '#0F172A',
    cardBorder: 'rgba(16, 185, 129, 0.25)',
    accentText: '#34D399',
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
 * instantly transforms into the chosen team's authentic colors.
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

  // Button text contrast color: if yellow/white, use dark background; else white
  const isLightPrimary = theme.primaryColor.toUpperCase() === '#FFED00' || 
                         theme.primaryColor.toUpperCase() === '#FFD700' || 
                         theme.primaryColor.toUpperCase() === '#FFD100' || 
                         theme.primaryColor.toUpperCase() === '#FFB800' || 
                         theme.primaryColor.toUpperCase() === '#FFFFFF';
  const buttonTextColor = isLightPrimary ? (theme.id === 'fenerbahce' ? '#020718' : '#000000') : '#FFFFFF';

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
    
    /* Neutralize all hardcoded emerald & teal & cyan background tints that turn into muddy brown */
    .bg-emerald-950,
    .bg-emerald-950\\/10,
    .bg-emerald-950\\/20,
    .bg-emerald-950\\/30,
    .bg-emerald-950\\/40,
    .bg-emerald-950\\/50,
    .bg-emerald-950\\/60,
    .bg-emerald-950\\/70,
    .bg-emerald-950\\/80,
    .bg-teal-950\\/60,
    .bg-indigo-950\\/60,
    [class*="bg-emerald-950"],
    [class*="bg-teal-950"],
    [class*="bg-indigo-950"] {
      background-color: ${theme.cardBg} !important;
      background-image: none !important;
    }

    /* Neutralize Tailwind gradient stops so emerald green does NOT blend with red */
    [class*="to-emerald-"],
    [class*="from-emerald-"],
    [class*="via-emerald-"],
    [class*="to-teal-"],
    [class*="from-teal-"],
    [class*="via-teal-"] {
      --tw-gradient-from: ${theme.cardBg} var(--tw-gradient-from-position, 0%) !important;
      --tw-gradient-to: ${theme.cardBg} var(--tw-gradient-to-position, 100%) !important;
      --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
    }
    
    /* Ambient Corner Glows */
    .theme-glow-primary,
    [class*="blur-3xl"][class*="bg-emerald"] {
      background-color: ${theme.id === 'galatasaray' ? 'rgba(227, 6, 19, 0.25)' : (theme.id === 'fenerbahce' ? 'rgba(0, 45, 114, 0.35)' : theme.badgeBg)} !important;
    }
    .theme-glow-secondary,
    [class*="blur-3xl"][class*="bg-cyan"],
    [class*="blur-3xl"][class*="bg-teal"] {
      background-color: ${theme.id === 'galatasaray' ? 'rgba(255, 209, 0, 0.18)' : (theme.id === 'fenerbahce' ? 'rgba(255, 237, 0, 0.18)' : theme.badgeBg)} !important;
    }
    
    /* Borders */
    .border-slate-800, 
    .border-slate-800\\/60, 
    .border-slate-800\\/80,
    .border-slate-700,
    .border-slate-700\\/80 {
      border-color: ${theme.cardBorder} !important;
    }
    
    /* Secondary Action Buttons (e.g. Detaylı İncele) */
    .bg-slate-800, .bg-slate-800\\/80, .bg-slate-800\\/90 {
      background-color: ${theme.id === 'galatasaray' ? '#1c050a' : (theme.id === 'fenerbahce' ? '#091A42' : '#1A1A22')} !important;
      border: 1px solid ${theme.cardBorder} !important;
      color: #FFFFFF !important;
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
      ${theme.id === 'galatasaray' ? `
        background: linear-gradient(135deg, #E30613 0%, #B8000F 100%) !important;
        color: #FFD100 !important;
        border: 1.5px solid #FFD100 !important;
        text-shadow: 0 1px 2px rgba(0,0,0,0.8) !important;
      ` : `
        background-color: ${theme.primaryColor} !important;
        color: ${buttonTextColor} !important;
      `}
      font-weight: 900 !important;
    }
    
    /* Soft Pill Badges */
    .bg-emerald-500\\/10, 
    .bg-emerald-500\\/15, 
    .bg-emerald-500\\/20, 
    .bg-emerald-500\\/25, 
    .bg-emerald-500\\/30,
    .bg-emerald-500\\/40 {
      ${theme.id === 'galatasaray' ? `
        background-color: rgba(227, 6, 19, 0.22) !important;
        color: #FFD100 !important;
        border: 1px solid rgba(227, 6, 19, 0.6) !important;
      ` : `
        background-color: ${theme.badgeBg} !important;
        color: ${theme.primaryColor} !important;
        border-color: ${theme.cardBorder} !important;
      `}
    }
    
    /* Primary Accent Borders */
    .border-emerald-500, 
    .border-emerald-400, 
    .border-emerald-500\\/20, 
    .border-emerald-500\\/30, 
    .border-emerald-500\\/40, 
    .border-emerald-500\\/50 {
      border-color: ${theme.id === 'galatasaray' ? '#E30613' : theme.primaryColor} !important;
    }
    
    /* Ambient Glows */
    .glow-emerald {
      box-shadow: 0 0 35px -4px ${theme.id === 'galatasaray' ? '#E30613' : theme.primaryColor}60 !important;
    }

    ::selection {
      background-color: ${theme.primaryColor} !important;
      color: ${buttonTextColor} !important;
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
    shortName: (name || 'ÖZEL').slice(0, 4).toUpperCase(),
    club: 'Özel Renkler',
    emoji: '🎨',
    primaryColor,
    secondaryColor,
    bgDark,
    cardBg: adjustBrightness(bgDark, 14),
    cardBorder: hexToRgba(primaryColor, 0.45),
    accentText: primaryColor,
    badgeBg: hexToRgba(primaryColor, 0.20),
    isCustom: true
  };
}

function hexToRgba(hex: string, alpha: number): string {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return `rgba(255, 237, 0, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function adjustBrightness(hex: string, percent: number): string {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  let num = parseInt(c, 16);
  if (isNaN(num)) return '#081226';
  let r = Math.min(255, Math.max(0, ((num >> 16) & 255) + percent));
  let g = Math.min(255, Math.max(0, ((num >> 8) & 255) + percent));
  let b = Math.min(255, Math.max(0, (num & 255) + percent + 6));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
