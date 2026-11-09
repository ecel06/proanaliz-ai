// src/services/liveFormService.ts
// ProAnaliz AI - Client-Side Dynamic Real Team Form Service
// Dynamically synchronizes 100% authentic real-world match history from /api/forms

import { FormMatchDetail } from '../types';

let cachedForms: Record<string, FormMatchDetail[]> = {};
let isInitialized = false;

function normalizeName(name: string = ''): string {
  return String(name || '')
    .toLowerCase()
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .replace(/[^a-z0-9]/g, '');
}

function getTeamRootClient(name: string = ''): string {
  let clean = String(name || '')
    .toLowerCase()
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u');

  const stopWords = [
    'sportif faaliyetler', 'sportif', 'faaliyetler', 'futbol kulubu', 'futbol', 'kulubu',
    'netglobal', 'ramspark', 'tupras', 'medipol', 'bellona', 'corendon', 'atlantis',
    'sfk', 'fk', 'sk', 'as', 'a.s.', 'spor', 'holding', 'bld', 'belediyesi', 'belediye',
    'f.k.', 's.k.', 'jk', 'b.k.', 'fc', 'cf', 'sc', 'united', 'city', 'town', 'bb'
  ];

  for (const sw of stopWords) {
    clean = clean.replace(new RegExp(`\\b${sw}\\b`, 'g'), ' ');
  }

  clean = clean.replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();

  if (clean.includes('amed')) return 'amed';
  if (clean.includes('kocaeli')) return 'kocaeli';
  if (clean.includes('corum')) return 'corum';
  if (clean.includes('galatasaray')) return 'galatasaray';
  if (clean.includes('fenerbahce')) return 'fenerbahce';
  if (clean.includes('besiktas')) return 'besiktas';
  if (clean.includes('trabzon')) return 'trabzon';
  if (clean.includes('basaksehir')) return 'basaksehir';
  if (clean.includes('goztepe')) return 'goztepe';
  if (clean.includes('samsun')) return 'samsun';
  if (clean.includes('kasimpasa')) return 'kasimpasa';
  if (clean.includes('konya')) return 'konya';
  if (clean.includes('alanya')) return 'alanya';
  if (clean.includes('rize')) return 'rize';
  if (clean.includes('gaziantep')) return 'gaziantep';
  if (clean.includes('genclerbirligi')) return 'genclerbirligi';
  if (clean.includes('eyup')) return 'eyup';
  if (clean.includes('sivas')) return 'sivas';
  if (clean.includes('bodrum')) return 'bodrum';
  if (clean.includes('kayseri')) return 'kayseri';
  if (clean.includes('antalya')) return 'antalya';
  if (clean.includes('adana')) return 'adana';
  if (clean.includes('erzurum')) return 'erzurum';
  if (clean.includes('bandirma')) return 'bandirma';
  if (clean.includes('manisa')) return 'manisa';
  if (clean.includes('igdir')) return 'igdir';
  if (clean.includes('bolu')) return 'bolu';
  if (clean.includes('sakarya')) return 'sakarya';
  if (clean.includes('kecioren')) return 'kecioren';
  if (clean.includes('ankaragucu')) return 'ankaragucu';
  if (clean.includes('istanbulspor')) return 'istanbulspor';
  if (clean.includes('umraniye')) return 'umraniye';
  if (clean.includes('sanliurfa') || clean.includes('urfaspor')) return 'sanliurfa';
  if (clean.includes('pendik')) return 'pendik';
  if (clean.includes('esenler') || clean.includes('erok')) return 'erok';
  if (clean.includes('arsenal')) return 'arsenal';
  if (clean.includes('liverpool')) return 'liverpool';
  if (clean.includes('chelsea')) return 'chelsea';
  if (clean.includes('manchester city') || clean.includes('man city')) return 'mancity';
  if (clean.includes('manchester united') || clean.includes('man utd')) return 'manutd';
  if (clean.includes('real madrid')) return 'realmadrid';
  if (clean.includes('barcelona')) return 'barcelona';
  if (clean.includes('bayern')) return 'bayern';
  if (clean.includes('dortmund')) return 'dortmund';
  if (clean.includes('inter')) return 'inter';
  if (clean.includes('juventus')) return 'juventus';
  if (clean.includes('milan')) return 'milan';
  if (clean.includes('paris') || clean.includes('psg')) return 'psg';

  const tokens = clean.split(' ').filter(Boolean);
  return tokens[0] || clean;
}

// 1. Initialize from local storage or public json file
export async function initLiveFormService(): Promise<void> {
  if (isInitialized && Object.keys(cachedForms).length > 0) return;

  try {
    const saved = localStorage.getItem('proanaliz_real_forms');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        cachedForms = parsed;
      }
    }
  } catch (e) {
    // Ignore localStorage error
  }

  // Fetch static fallback if empty
  if (Object.keys(cachedForms).length === 0) {
    try {
      const res = await fetch('/data/realFormsCache.json');
      if (res.ok) {
        const data = await res.json();
        if (data && data.forms) {
          cachedForms = data.forms;
        }
      }
    } catch {
      // Continue to API fetch
    }
  }

  isInitialized = true;
  // Trigger background live refresh
  refreshLiveForms().catch(() => { });
}

// 2. Refresh from backend API dynamically
export async function refreshLiveForms(): Promise<boolean> {
  try {
    let res = await fetch('/api/forms', { signal: AbortSignal.timeout(3000) });
    if (!res.ok) {
      res = await fetch('http://localhost:3001/api/forms', { signal: AbortSignal.timeout(3000) });
    }

    if (res.ok) {
      const data = await res.json();
      if (data && data.forms && Object.keys(data.forms).length > 0) {
        cachedForms = { ...cachedForms, ...data.forms };
        try {
          localStorage.setItem('proanaliz_real_forms', JSON.stringify(cachedForms));
        } catch {
          // Ignore quota error
        }
        return true;
      }
    }
  } catch (err) {
    // Fallback quietly
  }
  return false;
}

// 3. Query real form for any team
export function getLiveRealForm(teamName: string = ''): FormMatchDetail[] | null {
  if (!teamName) return null;
  const root = getTeamRootClient(teamName);
  const norm = normalizeName(teamName);

  if (cachedForms[teamName]) return cachedForms[teamName];
  if (root && root.length >= 3 && cachedForms[root]) return cachedForms[root];
  if (norm && norm.length >= 3 && cachedForms[norm]) return cachedForms[norm];

  return null;
}

// Auto-start dynamic background polling every 5 minutes in browser
if (typeof window !== 'undefined') {
  initLiveFormService();
  setInterval(() => {
    refreshLiveForms();
  }, 5 * 60 * 1000);
}

