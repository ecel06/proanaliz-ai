// src/utils/teamKitHelper.ts
// Gerçek takım forma renkleri, alternatif deplasman formaları ve görsel kit motoru

export interface TeamKit {
  primaryColor: string;
  secondaryColor: string;
  numberColor: string;
  borderColor: string;
  gradient?: string;
  gkColor: string;
  gkNumberColor: string;
  isStriped?: boolean;
}

interface TeamColorDef {
  primary: string;
  secondary: string;
  awayPrimary?: string;
  awaySecondary?: string;
  style?: 'solid' | 'stripes' | 'halves';
  gk?: string;
}

// Renk aydınlık hesabı (Yazı ve numara rengini otomatik kontrastlar)
export function isLightColor(hex: string): boolean {
  if (!hex || !hex.startsWith('#') || hex.length < 7) return false;
  const r = parseInt(hex.substring(1, 3), 16) || 0;
  const g = parseInt(hex.substring(3, 5), 16) || 0;
  const b = parseInt(hex.substring(5, 7), 16) || 0;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62;
}

// İki rengin birbirine yakınlığını ölçer (Aynı renk formaların çakışmasını engeller)
function areColorsTooClose(hex1: string, hex2: string): boolean {
  if (!hex1 || !hex2 || hex1.length < 7 || hex2.length < 7) return false;
  const r1 = parseInt(hex1.substring(1, 3), 16) || 0;
  const g1 = parseInt(hex1.substring(3, 5), 16) || 0;
  const b1 = parseInt(hex1.substring(5, 7), 16) || 0;

  const r2 = parseInt(hex2.substring(1, 3), 16) || 0;
  const g2 = parseInt(hex2.substring(3, 5), 16) || 0;
  const b2 = parseInt(hex2.substring(5, 7), 16) || 0;

  const dist = Math.sqrt(
    Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2)
  );
  return dist < 85; // 85'ten küçükse renkler çok benzer (örn: Kırmızı vs Kırmızı, Beyaz vs Beyaz)
}

// Türkiye ve Dünya Liglerindeki Takımların Otantik Forma Veritabanı
const TEAM_KIT_DATABASE: Record<string, TeamColorDef> = {
  // --- TÜRKİYE SÜPER LİG & 1. LİG ---
  galatasaray: { primary: '#b91c1c', secondary: '#f59e0b', awayPrimary: '#0f172a', awaySecondary: '#f59e0b', style: 'halves', gk: '#10b981' },
  fenerbahce: { primary: '#1e3a8a', secondary: '#facc15', awayPrimary: '#ffffff', awaySecondary: '#1e3a8a', style: 'stripes', gk: '#f97316' },
  fenerbah: { primary: '#1e3a8a', secondary: '#facc15', awayPrimary: '#ffffff', awaySecondary: '#1e3a8a', style: 'stripes', gk: '#f97316' },
  besiktas: { primary: '#0f172a', secondary: '#ffffff', awayPrimary: '#dc2626', awaySecondary: '#ffffff', style: 'stripes', gk: '#eab308' },
  beşiktaş: { primary: '#0f172a', secondary: '#ffffff', awayPrimary: '#dc2626', awaySecondary: '#ffffff', style: 'stripes', gk: '#eab308' },
  trabzonspor: { primary: '#881337', secondary: '#38bdf8', awayPrimary: '#ffffff', awaySecondary: '#881337', style: 'stripes', gk: '#f97316' },
  trabzon: { primary: '#881337', secondary: '#38bdf8', awayPrimary: '#ffffff', awaySecondary: '#881337', style: 'stripes', gk: '#f97316' },
  basaksehir: { primary: '#ea580c', secondary: '#1e3a8a', awayPrimary: '#ffffff', awaySecondary: '#ea580c', style: 'solid', gk: '#10b981' },
  başakşehir: { primary: '#ea580c', secondary: '#1e3a8a', awayPrimary: '#ffffff', awaySecondary: '#ea580c', style: 'solid', gk: '#10b981' },
  samsunspor: { primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#dc2626', style: 'stripes', gk: '#eab308' },
  goztepe: { primary: '#eab308', secondary: '#dc2626', awayPrimary: '#ffffff', awaySecondary: '#eab308', style: 'halves', gk: '#10b981' },
  göztepe: { primary: '#eab308', secondary: '#dc2626', awayPrimary: '#ffffff', awaySecondary: '#eab308', style: 'halves', gk: '#10b981' },
  eyupspor: { primary: '#7e22ce', secondary: '#facc15', awayPrimary: '#ffffff', awaySecondary: '#7e22ce', style: 'solid', gk: '#f97316' },
  eyüpspor: { primary: '#7e22ce', secondary: '#facc15', awayPrimary: '#ffffff', awaySecondary: '#7e22ce', style: 'solid', gk: '#f97316' },
  kasimpasa: { primary: '#1e3a8a', secondary: '#ffffff', awayPrimary: '#dc2626', awaySecondary: '#ffffff', style: 'stripes', gk: '#10b981' },
  kasımpaşa: { primary: '#1e3a8a', secondary: '#ffffff', awayPrimary: '#dc2626', awaySecondary: '#ffffff', style: 'stripes', gk: '#10b981' },
  konyaspor: { primary: '#15803d', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#15803d', style: 'solid', gk: '#eab308' },
  antalyaspor: { primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#dc2626', style: 'stripes', gk: '#10b981' },
  sivasspor: { primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#dc2626', style: 'stripes', gk: '#eab308' },
  alanyaspor: { primary: '#ea580c', secondary: '#16a34a', awayPrimary: '#ffffff', awaySecondary: '#ea580c', style: 'stripes', gk: '#3b82f6' },
  rizespor: { primary: '#2563eb', secondary: '#16a34a', awayPrimary: '#ffffff', awaySecondary: '#2563eb', style: 'stripes', gk: '#f97316' },
  gaziantep: { primary: '#dc2626', secondary: '#0f172a', awayPrimary: '#ffffff', awaySecondary: '#dc2626', style: 'stripes', gk: '#10b981' },
  kayserispor: { primary: '#facc15', secondary: '#dc2626', awayPrimary: '#ffffff', awaySecondary: '#facc15', style: 'halves', gk: '#3b82f6' },
  bodrum: { primary: '#16a34a', secondary: '#ffffff', awayPrimary: '#dc2626', awaySecondary: '#ffffff', style: 'solid', gk: '#eab308' },
  bursaspor: { primary: '#16a34a', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#16a34a', style: 'stripes', gk: '#f97316' },
  kocaelispor: { primary: '#15803d', secondary: '#0f172a', awayPrimary: '#ffffff', awaySecondary: '#15803d', style: 'stripes', gk: '#f97316' },
  corum: { primary: '#dc2626', secondary: '#0f172a', awayPrimary: '#ffffff', awaySecondary: '#dc2626', style: 'stripes', gk: '#3b82f6' },
  çorum: { primary: '#dc2626', secondary: '#0f172a', awayPrimary: '#ffffff', awaySecondary: '#dc2626', style: 'stripes', gk: '#3b82f6' },
  erzurum: { primary: '#2563eb', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#2563eb', style: 'solid', gk: '#eab308' },
  amed: { primary: '#16a34a', secondary: '#dc2626', awayPrimary: '#ffffff', awaySecondary: '#16a34a', style: 'stripes', gk: '#f97316' },

  // --- ALMANYA BUNDESLIGA ---
  augsburg: { primary: '#ffffff', secondary: '#dc2626', awayPrimary: '#991b1b', awaySecondary: '#ffffff', style: 'solid', gk: '#facc15' },
  fcaugsburg: { primary: '#ffffff', secondary: '#dc2626', awayPrimary: '#991b1b', awaySecondary: '#ffffff', style: 'solid', gk: '#facc15' },
  mainz: { primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#1e3a8a', awaySecondary: '#ffffff', style: 'solid', gk: '#10b981' },
  fsvmainz: { primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#1e3a8a', awaySecondary: '#ffffff', style: 'solid', gk: '#10b981' },
  bayern: { primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#9333ea', style: 'solid', gk: '#10b981' },
  dortmund: { primary: '#facc15', secondary: '#0f172a', awayPrimary: '#0f172a', awaySecondary: '#facc15', style: 'solid', gk: '#ea580c' },
  leverkusen: { primary: '#0f172a', secondary: '#dc2626', awayPrimary: '#ffffff', awaySecondary: '#dc2626', style: 'stripes', gk: '#38bdf8' },
  leipzig: { primary: '#ffffff', secondary: '#dc2626', awayPrimary: '#1e3a8a', awaySecondary: '#ea580c', style: 'solid', gk: '#eab308' },
  frankfurt: { primary: '#0f172a', secondary: '#dc2626', awayPrimary: '#ffffff', awaySecondary: '#0f172a', style: 'stripes', gk: '#f97316' },
  stuttgart: { primary: '#ffffff', secondary: '#dc2626', awayPrimary: '#dc2626', awaySecondary: '#ffffff', style: 'solid', gk: '#10b981' },
  monchengladbach: { primary: '#ffffff', secondary: '#15803d', awayPrimary: '#0f172a', awaySecondary: '#15803d', style: 'solid', gk: '#f97316' },
  mönchengladbach: { primary: '#ffffff', secondary: '#15803d', awayPrimary: '#0f172a', awaySecondary: '#15803d', style: 'solid', gk: '#f97316' },
  wolfsburg: { primary: '#22c55e', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#22c55e', style: 'solid', gk: '#38bdf8' },
  bremen: { primary: '#15803d', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#15803d', style: 'solid', gk: '#f97316' },
  hoffenheim: { primary: '#2563eb', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#2563eb', style: 'solid', gk: '#facc15' },
  freiburg: { primary: '#dc2626', secondary: '#0f172a', awayPrimary: '#ffffff', awaySecondary: '#dc2626', style: 'stripes', gk: '#eab308' },
  unionberlin: { primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#dc2626', style: 'solid', gk: '#10b981' },
  stpauli: { primary: '#78350f', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#78350f', style: 'solid', gk: '#10b981' },
  bochum: { primary: '#1d4ed8', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#1d4ed8', style: 'solid', gk: '#f97316' },
  heidenheim: { primary: '#dc2626', secondary: '#2563eb', awayPrimary: '#ffffff', awaySecondary: '#dc2626', style: 'solid', gk: '#10b981' },

  // --- İNGİLTERE PREMIER LİG ---
  mancity: { primary: '#0284c7', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#881337', style: 'solid', gk: '#ea580c' },
  manchestercity: { primary: '#0284c7', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#881337', style: 'solid', gk: '#ea580c' },
  arsenal: { primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#18181b', awaySecondary: '#facc15', style: 'solid', gk: '#10b981' },
  liverpool: { primary: '#b91c1c', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#15803d', style: 'solid', gk: '#38bdf8' },
  chelsea: { primary: '#1d4ed8', secondary: '#ffffff', awayPrimary: '#38bdf8', awaySecondary: '#1d4ed8', style: 'solid', gk: '#f97316' },
  manunited: { primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#1e293b', awaySecondary: '#ffffff', style: 'solid', gk: '#10b981' },
  manchesterunited: { primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#1e293b', awaySecondary: '#ffffff', style: 'solid', gk: '#10b981' },
  tottenham: { primary: '#ffffff', secondary: '#1e293b', awayPrimary: '#0f172a', awaySecondary: '#38bdf8', style: 'solid', gk: '#facc15' },
  newcastle: { primary: '#0f172a', secondary: '#ffffff', awayPrimary: '#15803d', awaySecondary: '#ffffff', style: 'stripes', gk: '#f97316' },
  astonvilla: { primary: '#831843', secondary: '#38bdf8', awayPrimary: '#ffffff', awaySecondary: '#831843', style: 'halves', gk: '#10b981' },
  brighton: { primary: '#2563eb', secondary: '#ffffff', awayPrimary: '#facc15', awaySecondary: '#0f172a', style: 'stripes', gk: '#ea580c' },
  westham: { primary: '#881337', secondary: '#38bdf8', awayPrimary: '#ffffff', awaySecondary: '#881337', style: 'halves', gk: '#10b981' },
  everton: { primary: '#1d4ed8', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#facc15', style: 'solid', gk: '#ea580c' },
  wolves: { primary: '#d97706', secondary: '#0f172a', awayPrimary: '#0f172a', awaySecondary: '#d97706', style: 'solid', gk: '#38bdf8' },
  fulham: { primary: '#ffffff', secondary: '#0f172a', awayPrimary: '#dc2626', awaySecondary: '#0f172a', style: 'solid', gk: '#10b981' },
  crystalpalace: { primary: '#dc2626', secondary: '#2563eb', awayPrimary: '#facc15', awaySecondary: '#2563eb', style: 'stripes', gk: '#ea580c' },
  nottingham: { primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#38bdf8', awaySecondary: '#1e3a8a', style: 'solid', gk: '#10b981' },
  brentford: { primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#dc2626', style: 'stripes', gk: '#facc15' },
  bournemouth: { primary: '#dc2626', secondary: '#0f172a', awayPrimary: '#38bdf8', awaySecondary: '#ffffff', style: 'stripes', gk: '#10b981' },
  leicester: { primary: '#1d4ed8', secondary: '#facc15', awayPrimary: '#0f172a', awaySecondary: '#ea580c', style: 'solid', gk: '#f97316' },

  // --- İSPANYA LA LIGA ---
  realmadrid: { primary: '#ffffff', secondary: '#ca8a04', awayPrimary: '#f97316', awaySecondary: '#1e293b', style: 'solid', gk: '#10b981' },
  barcelona: { primary: '#991b1b', secondary: '#1e3a8a', awayPrimary: '#0f172a', awaySecondary: '#facc15', style: 'stripes', gk: '#10b981' },
  atletico: { primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#38bdf8', style: 'stripes', gk: '#facc15' },
  atleticomadrid: { primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#38bdf8', style: 'stripes', gk: '#facc15' },
  sevilla: { primary: '#ffffff', secondary: '#dc2626', awayPrimary: '#dc2626', awaySecondary: '#ffffff', style: 'solid', gk: '#eab308' },
  sociedad: { primary: '#2563eb', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#2563eb', style: 'stripes', gk: '#f97316' },
  bilbao: { primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#0284c7', awaySecondary: '#ffffff', style: 'stripes', gk: '#10b981' },
  villarreal: { primary: '#eab308', secondary: '#1e3a8a', awayPrimary: '#1e3a8a', awaySecondary: '#eab308', style: 'solid', gk: '#dc2626' },
  betis: { primary: '#16a34a', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#16a34a', style: 'stripes', gk: '#f97316' },
  valencia: { primary: '#ffffff', secondary: '#0f172a', awayPrimary: '#ea580c', awaySecondary: '#0f172a', style: 'solid', gk: '#3b82f6' },
  girona: { primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#38bdf8', awaySecondary: '#1e3a8a', style: 'stripes', gk: '#facc15' },
  celta: { primary: '#38bdf8', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#ea580c', style: 'solid', gk: '#f97316' },
  osasuna: { primary: '#dc2626', secondary: '#1e3a8a', awayPrimary: '#ffffff', awaySecondary: '#dc2626', style: 'solid', gk: '#10b981' },
  mallorca: { primary: '#dc2626', secondary: '#0f172a', awayPrimary: '#ffffff', awaySecondary: '#dc2626', style: 'solid', gk: '#facc15' },
  rayo: { primary: '#ffffff', secondary: '#dc2626', awayPrimary: '#0f172a', awaySecondary: '#dc2626', style: 'solid', gk: '#10b981' },
  getafe: { primary: '#1d4ed8', secondary: '#ffffff', awayPrimary: '#dc2626', awaySecondary: '#ffffff', style: 'solid', gk: '#facc15' },
  espanyol: { primary: '#2563eb', secondary: '#ffffff', awayPrimary: '#dc2626', awaySecondary: '#ffffff', style: 'stripes', gk: '#10b981' },

  // --- İTALYA SERIE A ---
  inter: { primary: '#1d4ed8', secondary: '#0f172a', awayPrimary: '#ffffff', awaySecondary: '#1d4ed8', style: 'stripes', gk: '#ea580c' },
  milan: { primary: '#dc2626', secondary: '#0f172a', awayPrimary: '#ffffff', awaySecondary: '#dc2626', style: 'stripes', gk: '#10b981' },
  acmilan: { primary: '#dc2626', secondary: '#0f172a', awayPrimary: '#ffffff', awaySecondary: '#dc2626', style: 'stripes', gk: '#10b981' },
  juventus: { primary: '#0f172a', secondary: '#ffffff', awayPrimary: '#facc15', awaySecondary: '#0f172a', style: 'stripes', gk: '#ea580c' },
  napoli: { primary: '#0284c7', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#0284c7', style: 'solid', gk: '#f97316' },
  roma: { primary: '#991b1b', secondary: '#facc15', awayPrimary: '#ffffff', awaySecondary: '#991b1b', style: 'solid', gk: '#10b981' },
  asroma: { primary: '#991b1b', secondary: '#facc15', awayPrimary: '#ffffff', awaySecondary: '#991b1b', style: 'solid', gk: '#10b981' },
  lazio: { primary: '#38bdf8', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#38bdf8', style: 'solid', gk: '#f97316' },
  atalanta: { primary: '#1d4ed8', secondary: '#0f172a', awayPrimary: '#ffffff', awaySecondary: '#1d4ed8', style: 'stripes', gk: '#ea580c' },
  fiorentina: { primary: '#7c3aed', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#7c3aed', style: 'solid', gk: '#facc15' },
  bologna: { primary: '#dc2626', secondary: '#1e3a8a', awayPrimary: '#ffffff', awaySecondary: '#dc2626', style: 'stripes', gk: '#10b981' },
  torino: { primary: '#881337', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#881337', style: 'solid', gk: '#38bdf8' },
  genoa: { primary: '#dc2626', secondary: '#1e3a8a', awayPrimary: '#ffffff', awaySecondary: '#dc2626', style: 'halves', gk: '#10b981' },
  parma: { primary: '#ffffff', secondary: '#0f172a', awayPrimary: '#facc15', awaySecondary: '#1d4ed8', style: 'solid', gk: '#3b82f6' },
  como: { primary: '#1d4ed8', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#1d4ed8', style: 'solid', gk: '#f97316' },
  verona: { primary: '#1e3a8a', secondary: '#facc15', awayPrimary: '#facc15', awaySecondary: '#1e3a8a', style: 'solid', gk: '#10b981' },

  // --- FRANSA LIGUE 1 ---
  psg: { primary: '#1e3a8a', secondary: '#dc2626', awayPrimary: '#ffffff', awaySecondary: '#1e3a8a', style: 'solid', gk: '#10b981' },
  paris: { primary: '#1e3a8a', secondary: '#dc2626', awayPrimary: '#ffffff', awaySecondary: '#1e3a8a', style: 'solid', gk: '#10b981' },
  monaco: { primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#facc15', style: 'halves', gk: '#38bdf8' },
  marseille: { primary: '#38bdf8', secondary: '#ffffff', awayPrimary: '#1e3a8a', awaySecondary: '#38bdf8', style: 'solid', gk: '#ea580c' },
  lyon: { primary: '#ffffff', secondary: '#2563eb', awayPrimary: '#0f172a', awaySecondary: '#dc2626', style: 'solid', gk: '#10b981' },
  lille: { primary: '#dc2626', secondary: '#1e3a8a', awayPrimary: '#ffffff', awaySecondary: '#1e3a8a', style: 'solid', gk: '#facc15' },
  nice: { primary: '#dc2626', secondary: '#0f172a', awayPrimary: '#ffffff', awaySecondary: '#dc2626', style: 'stripes', gk: '#38bdf8' },
  rennes: { primary: '#dc2626', secondary: '#0f172a', awayPrimary: '#ffffff', awaySecondary: '#dc2626', style: 'solid', gk: '#10b981' },
  lens: { primary: '#facc15', secondary: '#dc2626', awayPrimary: '#0f172a', awaySecondary: '#facc15', style: 'stripes', gk: '#10b981' },

  // --- DİĞER ÖNEMLİ AVRUPA VE DÜNYA TAKIMLARI ---
  ajax: { primary: '#ffffff', secondary: '#dc2626', awayPrimary: '#0f172a', awaySecondary: '#facc15', style: 'solid', gk: '#38bdf8' },
  psv: { primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#38bdf8', style: 'stripes', gk: '#facc15' },
  feyenoord: { primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#10b981', style: 'halves', gk: '#38bdf8' },
  benfica: { primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#dc2626', style: 'solid', gk: '#eab308' },
  porto: { primary: '#1d4ed8', secondary: '#ffffff', awayPrimary: '#ea580c', awaySecondary: '#1d4ed8', style: 'stripes', gk: '#10b981' },
  sporting: { primary: '#15803d', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#15803d', style: 'stripes', gk: '#f97316' },
  celtic: { primary: '#15803d', secondary: '#ffffff', awayPrimary: '#facc15', awaySecondary: '#15803d', style: 'stripes', gk: '#f97316' },
  rangers: { primary: '#1d4ed8', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#1d4ed8', style: 'solid', gk: '#ea580c' },
  olympiacos: { primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#dc2626', style: 'stripes', gk: '#10b981' },
  panathinaikos: { primary: '#15803d', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#15803d', style: 'solid', gk: '#f97316' },
};

// Fallback dinamik yüksek kontrastlı palet (Bilinmeyen lig ve takımlar için)
const FALLBACK_PALETTE: TeamColorDef[] = [
  { primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#dc2626' }, // Kırmızı
  { primary: '#2563eb', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#2563eb' }, // Mavi
  { primary: '#eab308', secondary: '#0f172a', awayPrimary: '#0f172a', awaySecondary: '#eab308' }, // Sarı
  { primary: '#15803d', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#15803d' }, // Yeşil
  { primary: '#7c3aed', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#7c3aed' }, // Mor
  { primary: '#ea580c', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#ea580c' }, // Turuncu
  { primary: '#0284c7', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#0284c7' }, // Gök Mavisi
  { primary: '#881337', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#881337' }, // Bordo
  { primary: '#0f172a', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#0f172a' }, // Siyah / Lacivert
  { primary: '#059669', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#059669' }, // Zümrüt Yeşili
];

// Takım isminden temiz anahtar üretir
function normalizeTeamKey(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[üÜ]/g, 'u')
    .replace(/[öÖ]/g, 'o')
    .replace(/[ıİ]/g, 'i')
    .replace(/[şŞ]/g, 's')
    .replace(/[çÇ]/g, 'c')
    .replace(/[ğĞ]/g, 'g')
    .replace(/\b(fc|fsv|sc|ac|as|sk|fk|cf|vfb|vfl|rb|afc|bsc|ssc|rc|tsg)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Bir takımın gerçek forma renklerini ve stilini döndürür.
 * @param teamName Takım ismi (örn: 'FC Augsburg', 'Mainz 05', 'Galatasaray')
 * @param isAway Deplasman mı?
 * @param opposingKit Rakip takımın forması (Renk çakışmasını engellemek için)
 */
export function getTeamKit(
  teamName: string,
  isAway: boolean = false,
  opposingKit?: TeamKit
): TeamKit {
  const normKey = normalizeTeamKey(teamName);
  let def: TeamColorDef | undefined;

  // 1. Veritabanında tam veya alt eşleşme ara
  for (const [key, val] of Object.entries(TEAM_KIT_DATABASE)) {
    if (normKey === key || normKey.includes(key) || key.includes(normKey)) {
      def = val;
      break;
    }
  }

  // 2. Bulunamadıysa tutarlı deterministik hash paletinden al
  if (!def) {
    let hash = 0;
    for (let i = 0; i < teamName.length; i++) {
      hash = (hash << 5) - hash + teamName.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % FALLBACK_PALETTE.length;
    def = FALLBACK_PALETTE[idx];
  }

  // 3. İç saha veya Deplasman renklerini belirle
  let primary = def.primary;
  let secondary = def.secondary;

  // Eğer deplasman ise ve rakiple çakışma varsa alternatif formayı giy
  if (isAway) {
    const homeColor = opposingKit ? opposingKit.primaryColor : undefined;
    const isClashing = homeColor && areColorsTooClose(primary, homeColor);

    if (isClashing || (def.awayPrimary && Math.abs(primary.localeCompare(homeColor || '')) < 2)) {
      primary = def.awayPrimary || (isLightColor(def.primary) ? '#1e3a8a' : '#ffffff');
      secondary = def.awaySecondary || (isLightColor(primary) ? '#0f172a' : '#ffffff');
    }
  }

  // 4. Numara rengini ve kenarlık rengini otomatik kontrastla
  const light = isLightColor(primary);
  const numberColor = light ? '#0f172a' : '#ffffff';
  const borderColor = light ? '#475569' : '#ffffff';

  // 5. Kaleci rengini ayarla (Saha oyuncularıyla çakışmayacak neon renkler)
  let gkColor = def.gk;
  if (!gkColor) {
    gkColor = isAway ? '#ec4899' : '#f97316'; // Ev: Neon Turuncu, Deplasman: Neon Pembe
  }
  // Eğer kaleci rengi ana formayla çakışıyorsa alternatif neon renk ver
  if (areColorsTooClose(gkColor, primary)) {
    gkColor = areColorsTooClose('#facc15', primary) ? '#38bdf8' : '#facc15';
  }
  const gkNumberColor = isLightColor(gkColor) ? '#0f172a' : '#ffffff';

  // 6. Özel forma gradyanları (Çizgili ve Parçalı formalar için)
  let gradient: string | undefined;
  if (def.style === 'halves') {
    gradient = `linear-gradient(135deg, ${primary} 50%, ${secondary} 50%)`;
  } else if (def.style === 'stripes') {
    gradient = `repeating-linear-gradient(90deg, ${primary}, ${primary} 4px, ${secondary} 4px, ${secondary} 8px)`;
  }

  return {
    primaryColor: primary,
    secondaryColor: secondary,
    numberColor,
    borderColor,
    gradient,
    gkColor,
    gkNumberColor,
    isStriped: def.style === 'stripes' || def.style === 'halves',
  };
}
