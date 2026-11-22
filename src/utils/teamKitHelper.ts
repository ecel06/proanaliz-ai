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

export interface TeamColorDef {
  keywords: string[];
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
  return dist < 90;
}

// Türkçe karakter ve gereksiz ekleri temizleyen normalizasyon
export function cleanTeamString(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[üÜ]/g, 'u')
    .replace(/[öÖ]/g, 'o')
    .replace(/[ıİ]/g, 'i')
    .replace(/[şŞ]/g, 's')
    .replace(/[çÇ]/g, 'c')
    .replace(/[ğĞ]/g, 'g')
    .replace(/\b(1\.|fc|fsv|sc|ac|as|sk|fk|cf|vfb|vfl|rb|afc|bsc|ssc|rc|tsg|cd|ud|ca|spvg|spvgg|sv|ksv|ssv)\b/gi, ' ')
    .replace(/\((k|u19|u21|u23|kadinlar|women)\)/gi, ' ')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Kapsamlı Otantik Forma Veritabanı
export const TEAM_KIT_CATALOG: TeamColorDef[] = [
  // ================= TÜRKİYE SÜPER LİG & 1. LİG & 2. LİG =================
  { keywords: ['galatasaray', 'cimbom'], primary: '#b91c1c', secondary: '#f59e0b', awayPrimary: '#0f172a', awaySecondary: '#f59e0b', style: 'halves', gk: '#10b981' },
  { keywords: ['fenerbahce', 'fener'], primary: '#1e3a8a', secondary: '#facc15', awayPrimary: '#ffffff', awaySecondary: '#1e3a8a', style: 'stripes', gk: '#f97316' },
  { keywords: ['besiktas', 'bjk', 'kara kartal'], primary: '#0f172a', secondary: '#ffffff', awayPrimary: '#dc2626', awaySecondary: '#ffffff', style: 'stripes', gk: '#eab308' },
  { keywords: ['trabzonspor', 'trabzon'], primary: '#881337', secondary: '#38bdf8', awayPrimary: '#ffffff', awaySecondary: '#881337', style: 'stripes', gk: '#f97316' },
  { keywords: ['basaksehir', 'istanbul basaksehir'], primary: '#ea580c', secondary: '#1e3a8a', awayPrimary: '#ffffff', awaySecondary: '#ea580c', style: 'solid', gk: '#10b981' },
  { keywords: ['samsunspor', 'samsun'], primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#dc2626', style: 'stripes', gk: '#eab308' },
  { keywords: ['goztepe'], primary: '#eab308', secondary: '#dc2626', awayPrimary: '#ffffff', awaySecondary: '#eab308', style: 'halves', gk: '#10b981' },
  { keywords: ['eyupspor', 'eyup'], primary: '#7e22ce', secondary: '#facc15', awayPrimary: '#ffffff', awaySecondary: '#7e22ce', style: 'solid', gk: '#f97316' },
  { keywords: ['kasimpasa'], primary: '#1e3a8a', secondary: '#ffffff', awayPrimary: '#dc2626', awaySecondary: '#ffffff', style: 'stripes', gk: '#10b981' },
  { keywords: ['konyaspor', 'konya'], primary: '#15803d', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#15803d', style: 'solid', gk: '#eab308' },
  { keywords: ['antalyaspor', 'antalya'], primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#dc2626', style: 'stripes', gk: '#10b981' },
  { keywords: ['sivasspor', 'sivas'], primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#dc2626', style: 'stripes', gk: '#eab308' },
  { keywords: ['alanyaspor', 'alanya'], primary: '#ea580c', secondary: '#16a34a', awayPrimary: '#ffffff', awaySecondary: '#ea580c', style: 'stripes', gk: '#3b82f6' },
  { keywords: ['rizespor', 'rize', 'caykur rizespor'], primary: '#2563eb', secondary: '#16a34a', awayPrimary: '#ffffff', awaySecondary: '#2563eb', style: 'stripes', gk: '#f97316' },
  { keywords: ['gaziantep', 'gfk'], primary: '#dc2626', secondary: '#0f172a', awayPrimary: '#ffffff', awaySecondary: '#dc2626', style: 'stripes', gk: '#10b981' },
  { keywords: ['kayserispor', 'kayseri'], primary: '#facc15', secondary: '#dc2626', awayPrimary: '#ffffff', awaySecondary: '#facc15', style: 'halves', gk: '#3b82f6' },
  { keywords: ['bodrum', 'bodrumspor'], primary: '#16a34a', secondary: '#ffffff', awayPrimary: '#dc2626', awaySecondary: '#ffffff', style: 'solid', gk: '#eab308' },
  { keywords: ['adana demirspor', 'adana demir'], primary: '#0284c7', secondary: '#1e3a8a', awayPrimary: '#ffffff', awaySecondary: '#0284c7', style: 'stripes', gk: '#f97316' },
  { keywords: ['hatayspor', 'hatay'], primary: '#881337', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#881337', style: 'solid', gk: '#10b981' },
  { keywords: ['genclerbirligi', 'gencler'], primary: '#dc2626', secondary: '#0f172a', awayPrimary: '#ffffff', awaySecondary: '#dc2626', style: 'stripes', gk: '#3b82f6' },
  { keywords: ['ankaragucu', 'ankara'], primary: '#facc15', secondary: '#1e3a8a', awayPrimary: '#ffffff', awaySecondary: '#1e3a8a', style: 'stripes', gk: '#10b981' },
  { keywords: ['bursaspor', 'bursa'], primary: '#16a34a', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#16a34a', style: 'stripes', gk: '#f97316' },
  { keywords: ['kocaelispor', 'kocaeli'], primary: '#15803d', secondary: '#0f172a', awayPrimary: '#ffffff', awaySecondary: '#15803d', style: 'stripes', gk: '#f97316' },
  { keywords: ['sakaryaspor', 'sakarya'], primary: '#15803d', secondary: '#0f172a', awayPrimary: '#ffffff', awaySecondary: '#15803d', style: 'stripes', gk: '#eab308' },
  { keywords: ['corum', 'arca corum'], primary: '#dc2626', secondary: '#0f172a', awayPrimary: '#ffffff', awaySecondary: '#dc2626', style: 'stripes', gk: '#3b82f6' },
  { keywords: ['erzurum', 'erzurumspor', 'erzurum bb'], primary: '#2563eb', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#2563eb', style: 'solid', gk: '#eab308' },
  { keywords: ['amed', 'amed sportif'], primary: '#16a34a', secondary: '#dc2626', awayPrimary: '#ffffff', awaySecondary: '#16a34a', style: 'stripes', gk: '#f97316' },
  { keywords: ['istanbulspor'], primary: '#facc15', secondary: '#0f172a', awayPrimary: '#ffffff', awaySecondary: '#facc15', style: 'stripes', gk: '#10b981' },
  { keywords: ['pendikspor', 'pendik'], primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#dc2626', style: 'stripes', gk: '#38bdf8' },
  { keywords: ['karagumruk', 'fatih karagumruk'], primary: '#dc2626', secondary: '#0f172a', awayPrimary: '#ffffff', awaySecondary: '#dc2626', style: 'stripes', gk: '#10b981' },
  { keywords: ['umraniyespor', 'umraniye'], primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#dc2626', style: 'solid', gk: '#38bdf8' },
  { keywords: ['bandirmaspor', 'bandirma'], primary: '#881337', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#881337', style: 'solid', gk: '#10b981' },
  { keywords: ['keciorengucu', 'kecioren'], primary: '#881337', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#881337', style: 'solid', gk: '#facc15' },
  { keywords: ['boluspor', 'bolu'], primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#dc2626', style: 'solid', gk: '#10b981' },
  { keywords: ['igdir'], primary: '#15803d', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#15803d', style: 'solid', gk: '#facc15' },
  { keywords: ['manisa'], primary: '#0f172a', secondary: '#ffffff', awayPrimary: '#dc2626', awaySecondary: '#ffffff', style: 'solid', gk: '#10b981' },
  { keywords: ['sanliurfaspor', 'urfaspor', 'sanliurfa'], primary: '#facc15', secondary: '#15803d', awayPrimary: '#ffffff', awaySecondary: '#15803d', style: 'halves', gk: '#ea580c' },
  { keywords: ['erokspor', 'esenler erokspor'], primary: '#facc15', secondary: '#15803d', awayPrimary: '#ffffff', awaySecondary: '#facc15', style: 'solid', gk: '#38bdf8' },
  { keywords: ['sariyer'], primary: '#1d4ed8', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#1d4ed8', style: 'solid', gk: '#f97316' },
  { keywords: ['vanspor', 'van spor'], primary: '#dc2626', secondary: '#0f172a', awayPrimary: '#ffffff', awaySecondary: '#dc2626', style: 'stripes', gk: '#10b981' },

  // ================= İNGİLTERE (PREMIER LEAGUE & CHAMPIONSHIP) =================
  { keywords: ['manchester city', 'man city', 'mancity'], primary: '#0284c7', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#881337', style: 'solid', gk: '#ea580c' },
  { keywords: ['manchester united', 'man united', 'man utd', 'manutd'], primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#1e293b', awaySecondary: '#ffffff', style: 'solid', gk: '#10b981' },
  { keywords: ['arsenal'], primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#18181b', awaySecondary: '#facc15', style: 'solid', gk: '#10b981' },
  { keywords: ['liverpool'], primary: '#b91c1c', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#15803d', style: 'solid', gk: '#38bdf8' },
  { keywords: ['chelsea'], primary: '#1d4ed8', secondary: '#ffffff', awayPrimary: '#38bdf8', awaySecondary: '#1d4ed8', style: 'solid', gk: '#f97316' },
  { keywords: ['tottenham', 'spurs'], primary: '#ffffff', secondary: '#1e293b', awayPrimary: '#0f172a', awaySecondary: '#38bdf8', style: 'solid', gk: '#facc15' },
  { keywords: ['newcastle', 'newcastle united'], primary: '#0f172a', secondary: '#ffffff', awayPrimary: '#15803d', awaySecondary: '#ffffff', style: 'stripes', gk: '#f97316' },
  { keywords: ['aston villa'], primary: '#831843', secondary: '#38bdf8', awayPrimary: '#ffffff', awaySecondary: '#831843', style: 'halves', gk: '#10b981' },
  { keywords: ['brighton', 'brighton hove'], primary: '#2563eb', secondary: '#ffffff', awayPrimary: '#facc15', awaySecondary: '#0f172a', style: 'stripes', gk: '#ea580c' },
  { keywords: ['west ham', 'west ham united'], primary: '#881337', secondary: '#38bdf8', awayPrimary: '#ffffff', awaySecondary: '#881337', style: 'halves', gk: '#10b981' },
  { keywords: ['everton'], primary: '#1d4ed8', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#facc15', style: 'solid', gk: '#ea580c' },
  { keywords: ['wolves', 'wolverhampton'], primary: '#d97706', secondary: '#0f172a', awayPrimary: '#0f172a', awaySecondary: '#d97706', style: 'solid', gk: '#38bdf8' },
  { keywords: ['fulham'], primary: '#ffffff', secondary: '#0f172a', awayPrimary: '#dc2626', awaySecondary: '#0f172a', style: 'solid', gk: '#10b981' },
  { keywords: ['crystal palace'], primary: '#dc2626', secondary: '#2563eb', awayPrimary: '#facc15', awaySecondary: '#2563eb', style: 'stripes', gk: '#ea580c' },
  { keywords: ['nottingham', 'nottingham forest'], primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#38bdf8', awaySecondary: '#1e3a8a', style: 'solid', gk: '#10b981' },
  { keywords: ['brentford'], primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#dc2626', style: 'stripes', gk: '#facc15' },
  { keywords: ['bournemouth'], primary: '#dc2626', secondary: '#0f172a', awayPrimary: '#38bdf8', awaySecondary: '#ffffff', style: 'stripes', gk: '#10b981' },
  { keywords: ['leicester', 'leicester city'], primary: '#1d4ed8', secondary: '#facc15', awayPrimary: '#0f172a', awaySecondary: '#ea580c', style: 'solid', gk: '#f97316' },
  { keywords: ['ipswich', 'ipswich town'], primary: '#2563eb', secondary: '#ffffff', awayPrimary: '#881337', awaySecondary: '#ffffff', style: 'solid', gk: '#facc15' },
  { keywords: ['southampton'], primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#facc15', style: 'stripes', gk: '#10b981' },
  { keywords: ['sunderland'], primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#38bdf8', awaySecondary: '#ffffff', style: 'stripes', gk: '#facc15' },
  { keywords: ['leeds', 'leeds united'], primary: '#ffffff', secondary: '#2563eb', awayPrimary: '#facc15', awaySecondary: '#2563eb', style: 'solid', gk: '#10b981' },
  { keywords: ['burnley'], primary: '#881337', secondary: '#38bdf8', awayPrimary: '#ffffff', awaySecondary: '#881337', style: 'halves', gk: '#facc15' },
  { keywords: ['sheffield united', 'sheffield utd'], primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#dc2626', style: 'stripes', gk: '#10b981' },
  { keywords: ['sheffield wednesday', 'sheffield wed'], primary: '#2563eb', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#facc15', style: 'stripes', gk: '#ea580c' },
  { keywords: ['norwich', 'norwich city'], primary: '#facc15', secondary: '#15803d', awayPrimary: '#0f172a', awaySecondary: '#facc15', style: 'solid', gk: '#dc2626' },
  { keywords: ['west brom', 'west bromwich'], primary: '#1e3a8a', secondary: '#ffffff', awayPrimary: '#dc2626', awaySecondary: '#ffffff', style: 'stripes', gk: '#10b981' },
  { keywords: ['watford'], primary: '#facc15', secondary: '#dc2626', awayPrimary: '#0f172a', awaySecondary: '#facc15', style: 'solid', gk: '#38bdf8' },
  { keywords: ['middlesbrough'], primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#38bdf8', awaySecondary: '#ffffff', style: 'solid', gk: '#facc15' },
  { keywords: ['coventry', 'coventry city'], primary: '#38bdf8', secondary: '#ffffff', awayPrimary: '#dc2626', awaySecondary: '#ffffff', style: 'solid', gk: '#10b981' },
  { keywords: ['blackburn', 'blackburn rovers'], primary: '#2563eb', secondary: '#ffffff', awayPrimary: '#dc2626', awaySecondary: '#0f172a', style: 'halves', gk: '#facc15' },
  { keywords: ['luton', 'luton town'], primary: '#ea580c', secondary: '#ffffff', awayPrimary: '#1e3a8a', awaySecondary: '#ea580c', style: 'solid', gk: '#10b981' },
  { keywords: ['swansea', 'swansea city'], primary: '#ffffff', secondary: '#0f172a', awayPrimary: '#dc2626', awaySecondary: '#ffffff', style: 'solid', gk: '#facc15' },
  { keywords: ['bristol city'], primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#dc2626', style: 'solid', gk: '#10b981' },
  { keywords: ['stoke', 'stoke city'], primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#38bdf8', style: 'stripes', gk: '#facc15' },
  { keywords: ['hull', 'hull city'], primary: '#ea580c', secondary: '#0f172a', awayPrimary: '#ffffff', awaySecondary: '#ea580c', style: 'stripes', gk: '#10b981' },
  { keywords: ['derby', 'derby county'], primary: '#ffffff', secondary: '#0f172a', awayPrimary: '#1e3a8a', awaySecondary: '#ffffff', style: 'solid', gk: '#facc15' },
  { keywords: ['portsmouth'], primary: '#1d4ed8', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#1d4ed8', style: 'solid', gk: '#f97316' },

  // ================= İSPANYA (LA LIGA & LA LIGA 2) =================
  { keywords: ['real madrid'], primary: '#ffffff', secondary: '#ca8a04', awayPrimary: '#f97316', awaySecondary: '#1e293b', style: 'solid', gk: '#10b981' },
  { keywords: ['barcelona', 'barca'], primary: '#991b1b', secondary: '#1e3a8a', awayPrimary: '#0f172a', awaySecondary: '#facc15', style: 'stripes', gk: '#10b981' },
  { keywords: ['atletico madrid', 'atletico'], primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#38bdf8', style: 'stripes', gk: '#facc15' },
  { keywords: ['athletic bilbao', 'bilbao'], primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#0284c7', awaySecondary: '#ffffff', style: 'stripes', gk: '#10b981' },
  { keywords: ['real sociedad', 'sociedad'], primary: '#2563eb', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#2563eb', style: 'stripes', gk: '#f97316' },
  { keywords: ['villarreal'], primary: '#eab308', secondary: '#1e3a8a', awayPrimary: '#1e3a8a', awaySecondary: '#eab308', style: 'solid', gk: '#dc2626' },
  { keywords: ['real betis', 'betis'], primary: '#16a34a', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#16a34a', style: 'stripes', gk: '#f97316' },
  { keywords: ['sevilla'], primary: '#ffffff', secondary: '#dc2626', awayPrimary: '#dc2626', awaySecondary: '#ffffff', style: 'solid', gk: '#eab308' },
  { keywords: ['valencia'], primary: '#ffffff', secondary: '#0f172a', awayPrimary: '#ea580c', awaySecondary: '#0f172a', style: 'solid', gk: '#3b82f6' },
  { keywords: ['girona'], primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#38bdf8', awaySecondary: '#1e3a8a', style: 'stripes', gk: '#facc15' },
  { keywords: ['celta vigo', 'celta'], primary: '#38bdf8', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#ea580c', style: 'solid', gk: '#f97316' },
  { keywords: ['osasuna'], primary: '#dc2626', secondary: '#1e3a8a', awayPrimary: '#ffffff', awaySecondary: '#dc2626', style: 'solid', gk: '#10b981' },
  { keywords: ['mallorca'], primary: '#dc2626', secondary: '#0f172a', awayPrimary: '#ffffff', awaySecondary: '#dc2626', style: 'solid', gk: '#facc15' },
  { keywords: ['rayo vallecano', 'rayo'], primary: '#ffffff', secondary: '#dc2626', awayPrimary: '#0f172a', awaySecondary: '#dc2626', style: 'solid', gk: '#10b981' },
  { keywords: ['getafe'], primary: '#1d4ed8', secondary: '#ffffff', awayPrimary: '#dc2626', awaySecondary: '#ffffff', style: 'solid', gk: '#facc15' },
  { keywords: ['espanyol'], primary: '#2563eb', secondary: '#ffffff', awayPrimary: '#dc2626', awaySecondary: '#ffffff', style: 'stripes', gk: '#10b981' },
  { keywords: ['alaves'], primary: '#2563eb', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#2563eb', style: 'stripes', gk: '#facc15' },
  { keywords: ['las palmas'], primary: '#facc15', secondary: '#2563eb', awayPrimary: '#0f172a', awaySecondary: '#facc15', style: 'solid', gk: '#10b981' },
  { keywords: ['leganes'], primary: '#2563eb', secondary: '#ffffff', awayPrimary: '#15803d', awaySecondary: '#ffffff', style: 'stripes', gk: '#facc15' },
  { keywords: ['real valladolid', 'valladolid'], primary: '#7c3aed', secondary: '#ffffff', awayPrimary: '#dc2626', awaySecondary: '#ffffff', style: 'stripes', gk: '#10b981' },
  { keywords: ['elche'], primary: '#15803d', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#15803d', style: 'solid', gk: '#facc15' },
  { keywords: ['levante'], primary: '#1e3a8a', secondary: '#dc2626', awayPrimary: '#ffffff', awaySecondary: '#1e3a8a', style: 'stripes', gk: '#10b981' },
  { keywords: ['almeria'], primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#dc2626', style: 'stripes', gk: '#facc15' },
  { keywords: ['burgos'], primary: '#ffffff', secondary: '#0f172a', awayPrimary: '#dc2626', awaySecondary: '#ffffff', style: 'solid', gk: '#10b981' },
  { keywords: ['castellon'], primary: '#0f172a', secondary: '#ffffff', awayPrimary: '#15803d', awaySecondary: '#ffffff', style: 'stripes', gk: '#facc15' },
  { keywords: ['sporting gijon', 'gijon'], primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#dc2626', style: 'stripes', gk: '#38bdf8' },
  { keywords: ['real oviedo', 'oviedo'], primary: '#1d4ed8', secondary: '#ffffff', awayPrimary: '#facc15', awaySecondary: '#1d4ed8', style: 'solid', gk: '#10b981' },
  { keywords: ['cordoba'], primary: '#15803d', secondary: '#ffffff', awayPrimary: '#dc2626', awaySecondary: '#ffffff', style: 'stripes', gk: '#facc15' },
  { keywords: ['zaragoza', 'real zaragoza'], primary: '#ffffff', secondary: '#1d4ed8', awayPrimary: '#0f172a', awaySecondary: '#facc15', style: 'solid', gk: '#10b981' },
  { keywords: ['cadiz'], primary: '#facc15', secondary: '#1e3a8a', awayPrimary: '#1e3a8a', awaySecondary: '#facc15', style: 'solid', gk: '#dc2626' },
  { keywords: ['granada'], primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#dc2626', style: 'stripes', gk: '#10b981' },
  { keywords: ['eibar'], primary: '#881337', secondary: '#1e3a8a', awayPrimary: '#ffffff', awaySecondary: '#881337', style: 'stripes', gk: '#facc15' },
  { keywords: ['andorra'], primary: '#1d4ed8', secondary: '#facc15', awayPrimary: '#ffffff', awaySecondary: '#1d4ed8', style: 'solid', gk: '#dc2626' },

  // ================= ALMANYA (BUNDESLIGA & 2. BUNDESLIGA) =================
  { keywords: ['augsburg'], primary: '#ffffff', secondary: '#dc2626', awayPrimary: '#881337', awaySecondary: '#ffffff', style: 'solid', gk: '#facc15' },
  { keywords: ['mainz', 'mainz 05'], primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#1e3a8a', awaySecondary: '#ffffff', style: 'solid', gk: '#10b981' },
  { keywords: ['bayern munich', 'bayern'], primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#9333ea', style: 'solid', gk: '#10b981' },
  { keywords: ['borussia dortmund', 'dortmund'], primary: '#facc15', secondary: '#0f172a', awayPrimary: '#0f172a', awaySecondary: '#facc15', style: 'solid', gk: '#ea580c' },
  { keywords: ['bayer leverkusen', 'leverkusen'], primary: '#0f172a', secondary: '#dc2626', awayPrimary: '#ffffff', awaySecondary: '#dc2626', style: 'stripes', gk: '#38bdf8' },
  { keywords: ['rb leipzig', 'leipzig'], primary: '#ffffff', secondary: '#dc2626', awayPrimary: '#1e3a8a', awaySecondary: '#ea580c', style: 'solid', gk: '#eab308' },
  { keywords: ['eintracht frankfurt', 'frankfurt'], primary: '#0f172a', secondary: '#dc2626', awayPrimary: '#ffffff', awaySecondary: '#0f172a', style: 'stripes', gk: '#f97316' },
  { keywords: ['vfb stuttgart', 'stuttgart'], primary: '#ffffff', secondary: '#dc2626', awayPrimary: '#dc2626', awaySecondary: '#ffffff', style: 'solid', gk: '#10b981' },
  { keywords: ['monchengladbach', 'mönchengladbach', 'gladbach'], primary: '#ffffff', secondary: '#15803d', awayPrimary: '#0f172a', awaySecondary: '#15803d', style: 'solid', gk: '#f97316' },
  { keywords: ['wolfsburg'], primary: '#22c55e', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#22c55e', style: 'solid', gk: '#38bdf8' },
  { keywords: ['werder bremen', 'bremen'], primary: '#15803d', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#15803d', style: 'solid', gk: '#f97316' },
  { keywords: ['hoffenheim'], primary: '#2563eb', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#2563eb', style: 'solid', gk: '#facc15' },
  { keywords: ['freiburg'], primary: '#dc2626', secondary: '#0f172a', awayPrimary: '#ffffff', awaySecondary: '#dc2626', style: 'stripes', gk: '#eab308' },
  { keywords: ['union berlin'], primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#dc2626', style: 'solid', gk: '#10b981' },
  { keywords: ['st pauli'], primary: '#78350f', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#78350f', style: 'solid', gk: '#10b981' },
  { keywords: ['bochum'], primary: '#1d4ed8', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#1d4ed8', style: 'solid', gk: '#f97316' },
  { keywords: ['heidenheim'], primary: '#dc2626', secondary: '#2563eb', awayPrimary: '#ffffff', awaySecondary: '#dc2626', style: 'solid', gk: '#10b981' },
  { keywords: ['holstein kiel', 'kiel'], primary: '#1d4ed8', secondary: '#ffffff', awayPrimary: '#dc2626', awaySecondary: '#ffffff', style: 'solid', gk: '#facc15' },
  { keywords: ['hamburger sv', 'hsv', 'hamburg'], primary: '#ffffff', secondary: '#1d4ed8', awayPrimary: '#1d4ed8', awaySecondary: '#ffffff', style: 'solid', gk: '#dc2626' },
  { keywords: ['schalke', 'schalke 04'], primary: '#1d4ed8', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#1d4ed8', style: 'solid', gk: '#ea580c' },
  { keywords: ['hertha bsc', 'hertha berlin', 'hertha'], primary: '#2563eb', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#2563eb', style: 'stripes', gk: '#facc15' },
  { keywords: ['koln', 'cologne'], primary: '#ffffff', secondary: '#dc2626', awayPrimary: '#dc2626', awaySecondary: '#ffffff', style: 'solid', gk: '#10b981' },
  { keywords: ['hannover', 'hannover 96'], primary: '#dc2626', secondary: '#15803d', awayPrimary: '#15803d', awaySecondary: '#dc2626', style: 'solid', gk: '#facc15' },
  { keywords: ['kaiserslautern'], primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#dc2626', style: 'solid', gk: '#10b981' },
  { keywords: ['karlsruher'], primary: '#1d4ed8', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#1d4ed8', style: 'solid', gk: '#dc2626' },
  { keywords: ['dusseldorf', 'fortuna dusseldorf'], primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#dc2626', style: 'solid', gk: '#facc15' },
  { keywords: ['nurnberg', 'nuremberg'], primary: '#881337', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#881337', style: 'solid', gk: '#10b981' },
  { keywords: ['paderborn'], primary: '#1d4ed8', secondary: '#0f172a', awayPrimary: '#ffffff', awaySecondary: '#1d4ed8', style: 'stripes', gk: '#facc15' },
  { keywords: ['magdeburg'], primary: '#1d4ed8', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#1d4ed8', style: 'solid', gk: '#f97316' },

  // ================= İTALYA (SERIE A & SERIE B) =================
  { keywords: ['internazionale', 'inter', 'inter milan'], primary: '#1d4ed8', secondary: '#0f172a', awayPrimary: '#ffffff', awaySecondary: '#1d4ed8', style: 'stripes', gk: '#ea580c' },
  { keywords: ['ac milan', 'milan'], primary: '#dc2626', secondary: '#0f172a', awayPrimary: '#ffffff', awaySecondary: '#dc2626', style: 'stripes', gk: '#10b981' },
  { keywords: ['juventus', 'juve'], primary: '#0f172a', secondary: '#ffffff', awayPrimary: '#facc15', awaySecondary: '#0f172a', style: 'stripes', gk: '#ea580c' },
  { keywords: ['napoli'], primary: '#0284c7', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#0284c7', style: 'solid', gk: '#f97316' },
  { keywords: ['as roma', 'roma'], primary: '#991b1b', secondary: '#facc15', awayPrimary: '#ffffff', awaySecondary: '#991b1b', style: 'solid', gk: '#10b981' },
  { keywords: ['lazio'], primary: '#38bdf8', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#38bdf8', style: 'solid', gk: '#f97316' },
  { keywords: ['atalanta'], primary: '#1d4ed8', secondary: '#0f172a', awayPrimary: '#ffffff', awaySecondary: '#1d4ed8', style: 'stripes', gk: '#ea580c' },
  { keywords: ['fiorentina'], primary: '#7c3aed', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#7c3aed', style: 'solid', gk: '#facc15' },
  { keywords: ['bologna'], primary: '#dc2626', secondary: '#1e3a8a', awayPrimary: '#ffffff', awaySecondary: '#dc2626', style: 'stripes', gk: '#10b981' },
  { keywords: ['torino'], primary: '#881337', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#881337', style: 'solid', gk: '#38bdf8' },
  { keywords: ['genoa'], primary: '#dc2626', secondary: '#1e3a8a', awayPrimary: '#ffffff', awaySecondary: '#dc2626', style: 'halves', gk: '#10b981' },
  { keywords: ['parma'], primary: '#ffffff', secondary: '#0f172a', awayPrimary: '#facc15', awaySecondary: '#1d4ed8', style: 'solid', gk: '#3b82f6' },
  { keywords: ['como'], primary: '#1d4ed8', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#1d4ed8', style: 'solid', gk: '#f97316' },
  { keywords: ['verona', 'hellas verona'], primary: '#1e3a8a', secondary: '#facc15', awayPrimary: '#facc15', awaySecondary: '#1e3a8a', style: 'solid', gk: '#10b981' },
  { keywords: ['cagliari'], primary: '#dc2626', secondary: '#1e3a8a', awayPrimary: '#ffffff', awaySecondary: '#dc2626', style: 'halves', gk: '#10b981' },
  { keywords: ['udinese'], primary: '#0f172a', secondary: '#ffffff', awayPrimary: '#facc15', awaySecondary: '#0f172a', style: 'stripes', gk: '#ea580c' },
  { keywords: ['empoli'], primary: '#2563eb', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#2563eb', style: 'solid', gk: '#dc2626' },
  { keywords: ['lecce'], primary: '#facc15', secondary: '#dc2626', awayPrimary: '#ffffff', awaySecondary: '#facc15', style: 'stripes', gk: '#10b981' },
  { keywords: ['monza'], primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#dc2626', style: 'solid', gk: '#10b981' },
  { keywords: ['venezia'], primary: '#ea580c', secondary: '#15803d', awayPrimary: '#ffffff', awaySecondary: '#ea580c', style: 'stripes', gk: '#3b82f6' },
  { keywords: ['sampdoria'], primary: '#1d4ed8', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#1d4ed8', style: 'solid', gk: '#dc2626' },
  { keywords: ['sassuolo'], primary: '#15803d', secondary: '#0f172a', awayPrimary: '#ffffff', awaySecondary: '#15803d', style: 'stripes', gk: '#facc15' },
  { keywords: ['salernitana'], primary: '#881337', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#881337', style: 'solid', gk: '#38bdf8' },
  { keywords: ['palermo'], primary: '#ec4899', secondary: '#0f172a', awayPrimary: '#0f172a', awaySecondary: '#ec4899', style: 'solid', gk: '#facc15' },
  { keywords: ['bari'], primary: '#ffffff', secondary: '#dc2626', awayPrimary: '#dc2626', awaySecondary: '#ffffff', style: 'solid', gk: '#10b981' },

  // ================= FRANSA (LIGUE 1 & LIGUE 2) =================
  { keywords: ['paris saint germain', 'psg', 'paris'], primary: '#1e3a8a', secondary: '#dc2626', awayPrimary: '#ffffff', awaySecondary: '#1e3a8a', style: 'solid', gk: '#10b981' },
  { keywords: ['monaco'], primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#facc15', style: 'halves', gk: '#38bdf8' },
  { keywords: ['marseille', 'olympique marseille'], primary: '#38bdf8', secondary: '#ffffff', awayPrimary: '#1e3a8a', awaySecondary: '#38bdf8', style: 'solid', gk: '#ea580c' },
  { keywords: ['lyon', 'olympique lyon'], primary: '#ffffff', secondary: '#2563eb', awayPrimary: '#0f172a', awaySecondary: '#dc2626', style: 'solid', gk: '#10b981' },
  { keywords: ['lille'], primary: '#dc2626', secondary: '#1e3a8a', awayPrimary: '#ffffff', awaySecondary: '#1e3a8a', style: 'solid', gk: '#facc15' },
  { keywords: ['nice'], primary: '#dc2626', secondary: '#0f172a', awayPrimary: '#ffffff', awaySecondary: '#dc2626', style: 'stripes', gk: '#38bdf8' },
  { keywords: ['rennes'], primary: '#dc2626', secondary: '#0f172a', awayPrimary: '#ffffff', awaySecondary: '#dc2626', style: 'solid', gk: '#10b981' },
  { keywords: ['lens'], primary: '#facc15', secondary: '#dc2626', awayPrimary: '#0f172a', awaySecondary: '#facc15', style: 'stripes', gk: '#10b981' },
  { keywords: ['nantes'], primary: '#facc15', secondary: '#15803d', awayPrimary: '#0f172a', awaySecondary: '#facc15', style: 'solid', gk: '#dc2626' },
  { keywords: ['strasbourg'], primary: '#2563eb', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#2563eb', style: 'solid', gk: '#facc15' },
  { keywords: ['toulouse'], primary: '#7c3aed', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#7c3aed', style: 'solid', gk: '#facc15' },
  { keywords: ['reims'], primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#1e3a8a', awaySecondary: '#dc2626', style: 'solid', gk: '#10b981' },
  { keywords: ['brest'], primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#1e3a8a', awaySecondary: '#ffffff', style: 'solid', gk: '#facc15' },
  { keywords: ['saint etienne'], primary: '#15803d', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#15803d', style: 'solid', gk: '#facc15' },
  { keywords: ['auxerre'], primary: '#ffffff', secondary: '#2563eb', awayPrimary: '#0f172a', awaySecondary: '#ffffff', style: 'solid', gk: '#dc2626' },
  { keywords: ['montpellier'], primary: '#1e3a8a', secondary: '#ea580c', awayPrimary: '#ffffff', awaySecondary: '#1e3a8a', style: 'solid', gk: '#10b981' },
  { keywords: ['angers'], primary: '#0f172a', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#0f172a', style: 'stripes', gk: '#facc15' },

  // ================= DİĞER BÜYÜK AVRUPA KULÜPLERİ =================
  { keywords: ['ajax', 'ajax amsterdam'], primary: '#ffffff', secondary: '#dc2626', awayPrimary: '#0f172a', awaySecondary: '#facc15', style: 'solid', gk: '#38bdf8' },
  { keywords: ['psv', 'psv eindhoven'], primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#38bdf8', style: 'stripes', gk: '#facc15' },
  { keywords: ['feyenoord'], primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#10b981', style: 'halves', gk: '#38bdf8' },
  { keywords: ['az alkmaar'], primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#dc2626', style: 'solid', gk: '#facc15' },
  { keywords: ['twente'], primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#38bdf8', awaySecondary: '#ffffff', style: 'solid', gk: '#10b981' },
  { keywords: ['utrecht'], primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#dc2626', style: 'halves', gk: '#facc15' },
  { keywords: ['benfica'], primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#dc2626', style: 'solid', gk: '#eab308' },
  { keywords: ['porto'], primary: '#1d4ed8', secondary: '#ffffff', awayPrimary: '#ea580c', awaySecondary: '#1d4ed8', style: 'stripes', gk: '#10b981' },
  { keywords: ['sporting', 'sporting cp', 'sporting lisbon'], primary: '#15803d', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#15803d', style: 'stripes', gk: '#f97316' },
  { keywords: ['braga'], primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#dc2626', style: 'solid', gk: '#facc15' },
  { keywords: ['celtic'], primary: '#15803d', secondary: '#ffffff', awayPrimary: '#facc15', awaySecondary: '#15803d', style: 'stripes', gk: '#f97316' },
  { keywords: ['rangers'], primary: '#1d4ed8', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#1d4ed8', style: 'solid', gk: '#ea580c' },
  { keywords: ['club brugge', 'brugge'], primary: '#1d4ed8', secondary: '#0f172a', awayPrimary: '#ffffff', awaySecondary: '#1d4ed8', style: 'stripes', gk: '#ea580c' },
  { keywords: ['anderlecht'], primary: '#7c3aed', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#7c3aed', style: 'solid', gk: '#facc15' },
  { keywords: ['union saint gilloise'], primary: '#facc15', secondary: '#1d4ed8', awayPrimary: '#ffffff', awaySecondary: '#facc15', style: 'solid', gk: '#10b981' },
  { keywords: ['olympiacos', 'olympiakos'], primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#dc2626', style: 'stripes', gk: '#10b981' },
  { keywords: ['panathinaikos'], primary: '#15803d', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#15803d', style: 'solid', gk: '#f97316' },
  { keywords: ['shakhtar', 'shakhtar donetsk'], primary: '#ea580c', secondary: '#0f172a', awayPrimary: '#ffffff', awaySecondary: '#ea580c', style: 'stripes', gk: '#10b981' },
  { keywords: ['dynamo kyiv', 'kiev'], primary: '#ffffff', secondary: '#2563eb', awayPrimary: '#2563eb', awaySecondary: '#ffffff', style: 'solid', gk: '#facc15' },
  { keywords: ['crvena zvezda', 'red star'], primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#1e3a8a', awaySecondary: '#ffffff', style: 'stripes', gk: '#10b981' },
  { keywords: ['partizan'], primary: '#0f172a', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#0f172a', style: 'stripes', gk: '#facc15' },

  // ================= MİLLİ TAKIMLAR (NATIONAL TEAMS) =================
  { keywords: ['turkiye', 'turkey', 'turk'], primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#dc2626', style: 'solid', gk: '#38bdf8' },
  { keywords: ['almanya', 'germany'], primary: '#ffffff', secondary: '#0f172a', awayPrimary: '#db2777', awaySecondary: '#7c3aed', style: 'solid', gk: '#10b981' },
  { keywords: ['fransa', 'france'], primary: '#1e3a8a', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#1e3a8a', style: 'solid', gk: '#facc15' },
  { keywords: ['ispanya', 'spain'], primary: '#dc2626', secondary: '#facc15', awayPrimary: '#facc15', awaySecondary: '#dc2626', style: 'solid', gk: '#10b981' },
  { keywords: ['ingiltere', 'england'], primary: '#ffffff', secondary: '#1e3a8a', awayPrimary: '#dc2626', awaySecondary: '#ffffff', style: 'solid', gk: '#facc15' },
  { keywords: ['italya', 'italy'], primary: '#1d4ed8', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#1d4ed8', style: 'solid', gk: '#ea580c' },
  { keywords: ['hollanda', 'netherlands'], primary: '#ea580c', secondary: '#ffffff', awayPrimary: '#1e3a8a', awaySecondary: '#ea580c', style: 'solid', gk: '#38bdf8' },
  { keywords: ['portekiz', 'portugal'], primary: '#b91c1c', secondary: '#15803d', awayPrimary: '#ffffff', awaySecondary: '#15803d', style: 'halves', gk: '#facc15' },
  { keywords: ['arjantin', 'argentina'], primary: '#38bdf8', secondary: '#ffffff', awayPrimary: '#1e3a8a', awaySecondary: '#38bdf8', style: 'stripes', gk: '#10b981' },
  { keywords: ['brezilya', 'brazil'], primary: '#facc15', secondary: '#15803d', awayPrimary: '#1d4ed8', awaySecondary: '#ffffff', style: 'solid', gk: '#10b981' },
  { keywords: ['belcika', 'belgium'], primary: '#dc2626', secondary: '#0f172a', awayPrimary: '#ffffff', awaySecondary: '#38bdf8', style: 'solid', gk: '#facc15' },
  { keywords: ['hirvatistan', 'croatia'], primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#1e3a8a', awaySecondary: '#dc2626', style: 'stripes', gk: '#10b981' },
  { keywords: ['avusturya', 'austria'], primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#dc2626', style: 'solid', gk: '#10b981' },
  { keywords: ['isvicre', 'switzerland'], primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#dc2626', style: 'solid', gk: '#facc15' },
  { keywords: ['danimarka', 'denmark'], primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#dc2626', style: 'solid', gk: '#10b981' },
  { keywords: ['isvec', 'sweden'], primary: '#facc15', secondary: '#2563eb', awayPrimary: '#1e3a8a', awaySecondary: '#facc15', style: 'solid', gk: '#dc2626' },
  { keywords: ['norvec', 'norway'], primary: '#dc2626', secondary: '#1e3a8a', awayPrimary: '#ffffff', awaySecondary: '#1e3a8a', style: 'solid', gk: '#10b981' },
  { keywords: ['polonya', 'poland'], primary: '#ffffff', secondary: '#dc2626', awayPrimary: '#dc2626', awaySecondary: '#ffffff', style: 'solid', gk: '#10b981' },
  { keywords: ['romanya', 'romania'], primary: '#facc15', secondary: '#dc2626', awayPrimary: '#dc2626', awaySecondary: '#facc15', style: 'solid', gk: '#2563eb' },
  { keywords: ['macaristan', 'hungary'], primary: '#dc2626', secondary: '#15803d', awayPrimary: '#ffffff', awaySecondary: '#15803d', style: 'solid', gk: '#facc15' },
  { keywords: ['cekya', 'czech', 'czechia'], primary: '#dc2626', secondary: '#2563eb', awayPrimary: '#ffffff', awaySecondary: '#2563eb', style: 'solid', gk: '#10b981' },
  { keywords: ['sirbistan', 'serbia'], primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#2563eb', style: 'solid', gk: '#10b981' },
  { keywords: ['yunanistan', 'greece'], primary: '#2563eb', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#2563eb', style: 'solid', gk: '#facc15' },
  { keywords: ['iskocya', 'scotland'], primary: '#1e293b', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#1e293b', style: 'solid', gk: '#dc2626' },
  { keywords: ['galler', 'wales'], primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#15803d', style: 'solid', gk: '#facc15' },
  { keywords: ['ukrayna', 'ukraine'], primary: '#facc15', secondary: '#2563eb', awayPrimary: '#2563eb', awaySecondary: '#facc15', style: 'solid', gk: '#10b981' },
  { keywords: ['fas', 'morocco'], primary: '#dc2626', secondary: '#15803d', awayPrimary: '#ffffff', awaySecondary: '#15803d', style: 'solid', gk: '#10b981' },
  { keywords: ['senegal'], primary: '#ffffff', secondary: '#15803d', awayPrimary: '#15803d', awaySecondary: '#facc15', style: 'solid', gk: '#ea580c' },
  { keywords: ['misir', 'egypt'], primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#0f172a', style: 'solid', gk: '#10b981' },
  { keywords: ['nijerya', 'nigeria'], primary: '#16a34a', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#16a34a', style: 'stripes', gk: '#facc15' },
  { keywords: ['japonya', 'japan'], primary: '#1e3a8a', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#1e3a8a', style: 'solid', gk: '#dc2626' },
  { keywords: ['guney kore', 'korea'], primary: '#dc2626', secondary: '#0f172a', awayPrimary: '#0f172a', awaySecondary: '#ffffff', style: 'solid', gk: '#10b981' },
  { keywords: ['suudi arabistan', 'saudi arabia'], primary: '#15803d', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#15803d', style: 'solid', gk: '#facc15' },
  { keywords: ['avustralya', 'australia'], primary: '#facc15', secondary: '#15803d', awayPrimary: '#1e3a8a', awaySecondary: '#facc15', style: 'solid', gk: '#dc2626' },
  { keywords: ['amerika', 'usa', 'united states'], primary: '#ffffff', secondary: '#1e3a8a', awayPrimary: '#1e3a8a', awaySecondary: '#dc2626', style: 'solid', gk: '#10b981' },
  { keywords: ['meksika', 'mexico'], primary: '#15803d', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#881337', style: 'solid', gk: '#ea580c' },
  { keywords: ['kolombiya', 'colombia'], primary: '#facc15', secondary: '#1e3a8a', awayPrimary: '#1e3a8a', awaySecondary: '#facc15', style: 'solid', gk: '#dc2626' },
  { keywords: ['uruguay'], primary: '#38bdf8', secondary: '#0f172a', awayPrimary: '#ffffff', awaySecondary: '#38bdf8', style: 'solid', gk: '#dc2626' },
];

// Belirlenemeyen takımlar için zengin, göz alıcı 16 palet
const DYNAMIC_PALETTES: TeamColorDef[] = [
  { keywords: [], primary: '#dc2626', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#dc2626' }, // Kırmızı
  { keywords: [], primary: '#2563eb', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#2563eb' }, // Mavi
  { keywords: [], primary: '#eab308', secondary: '#0f172a', awayPrimary: '#0f172a', awaySecondary: '#eab308' }, // Sarı
  { keywords: [], primary: '#15803d', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#15803d' }, // Yeşil
  { keywords: [], primary: '#7c3aed', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#7c3aed' }, // Mor
  { keywords: [], primary: '#ea580c', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#ea580c' }, // Turuncu
  { keywords: [], primary: '#0284c7', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#0284c7' }, // Gök Mavisi
  { keywords: [], primary: '#881337', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#881337' }, // Bordo
  { keywords: [], primary: '#0f172a', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#0f172a' }, // Lacivert/Siyah
  { keywords: [], primary: '#059669', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#059669' }, // Zümrüt
  { keywords: [], primary: '#db2777', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#db2777' }, // Pembe/Fuşya
  { keywords: [], primary: '#0891b2', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#0891b2' }, // Turkuaz
  { keywords: [], primary: '#4f46e5', secondary: '#ffffff', awayPrimary: '#facc15', awaySecondary: '#4f46e5' }, // Çivit Mavisi
  { keywords: [], primary: '#d97706', secondary: '#0f172a', awayPrimary: '#0f172a', awaySecondary: '#d97706' }, // Kehribar
  { keywords: [], primary: '#475569', secondary: '#ffffff', awayPrimary: '#ffffff', awaySecondary: '#475569' }, // Çelik Grisi
  { keywords: [], primary: '#65a30d', secondary: '#ffffff', awayPrimary: '#0f172a', awaySecondary: '#65a30d' }, // Limon Yeşili
];

/**
 * Bir takımın gerçek forma renklerini ve stilini döndürür.
 * @param teamName Takım ismi (örn: 'FC Augsburg', 'Mainz 05', 'Brighton & Hove Albion')
 * @param isAway Deplasman mı?
 * @param opposingKit Rakip takımın forması (Renk çakışmasını engellemek için)
 * @param customPrimaryColor Takımın varsa API/Veritabanından gelen özel rengi
 */
export function getTeamKit(
  teamName: string,
  isAway: boolean = false,
  opposingKit?: TeamKit,
  customPrimaryColor?: string
): TeamKit {
  const clean = cleanTeamString(teamName);
  let def: TeamColorDef | undefined;

  // 1. En spesifik (en uzun) anahtar kelimelere öncelik vererek ara
  let bestScore = 0;

  for (const item of TEAM_KIT_CATALOG) {
    for (const kw of item.keywords) {
      const cleanKw = cleanTeamString(kw);
      if (!cleanKw) continue;

      // Tam eşleşme veya kelime öbeği içeriyor mu?
      if (clean === cleanKw) {
        if (cleanKw.length + 100 > bestScore) {
          bestScore = cleanKw.length + 100;
          def = item;
        }
      } else if (clean.includes(cleanKw)) {
        if (cleanKw.length > bestScore) {
          bestScore = cleanKw.length;
          def = item;
        }
      }
    }
  }

  // 3. Hiçbiri tutmadıysa isimden deterministik dengeli bir palet seç
  if (!def) {
    let hash = 0;
    for (let i = 0; i < teamName.length; i++) {
      hash = (hash << 5) - hash + teamName.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % DYNAMIC_PALETTES.length;
    def = DYNAMIC_PALETTES[idx];
  }

  // 4. İç Saha veya Deplasman renkleri
  let primary = def.primary;
  let secondary = def.secondary;

  if (isAway) {
    const homeColor = opposingKit ? opposingKit.primaryColor : undefined;
    const isClashing = homeColor && areColorsTooClose(primary, homeColor);

    if (isClashing || (def.awayPrimary && homeColor && areColorsTooClose(primary, homeColor))) {
      primary = def.awayPrimary || (isLightColor(def.primary) ? '#1e3a8a' : '#ffffff');
      secondary = def.awaySecondary || (isLightColor(primary) ? '#0f172a' : '#ffffff');
    }
  }

  // 5. Forma numarası ve kenarlık kontrastı
  const light = isLightColor(primary);
  const numberColor = light ? '#0f172a' : '#ffffff';
  const borderColor = light ? '#475569' : '#ffffff';

  // 6. Kaleci forma rengi
  let gkColor = def.gk;
  if (!gkColor) {
    gkColor = isAway ? '#ec4899' : '#f97316';
  }
  if (areColorsTooClose(gkColor, primary)) {
    gkColor = areColorsTooClose('#facc15', primary) ? '#38bdf8' : '#facc15';
  }
  const gkNumberColor = isLightColor(gkColor) ? '#0f172a' : '#ffffff';

  // 7. Çizgili / Parçalı Forma Gradyanları
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
