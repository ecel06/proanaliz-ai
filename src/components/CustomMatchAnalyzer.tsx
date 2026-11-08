import React, { useState, useMemo } from 'react';
import { Match, TeamStats, MatchResult, MatchAnalysis } from '../types';
import { analyzeMatch } from '../utils/predictionEngine';
import { toFairOdds } from '../utils/predictionEngine';
import { getInitialWeeklyMatches } from '../services/bulletinService';
import { getMatchLiveState } from '../utils/liveMatchHelper';
import {
  X,
  Calculator,
  Sparkles,
  Bot,
  Flame,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  Target,
  Swords,
  Timer,
  AlertTriangle,
  Compass,
  Search,
  ExternalLink,
  Calendar,
  Clock
} from 'lucide-react';

interface CustomMatchAnalyzerProps {
  isOpen: boolean;
  onClose: () => void;
  matches?: Match[];
  onSelectMatchDetail?: (match: Match) => void;
}

export const CustomMatchAnalyzer: React.FC<CustomMatchAnalyzerProps> = ({
  isOpen,
  onClose,
  matches,
  onSelectMatchDetail
}) => {
  // Arama ve Seçilen Bültendeki Maç Durumu
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUpcomingMatch, setSelectedUpcomingMatch] = useState<Match | null>(null);

  // Home Team State
  const [homeName, setHomeName] = useState('Ev Sahibi Takım');
  const [homeScored, setHomeScored] = useState(2.1);
  const [homeConceded, setHomeConceded] = useState(0.9);
  const [homeHtGoalRate, setHomeHtGoalRate] = useState(65);
  const [homeHtLeadRate, setHomeHtLeadRate] = useState(50);
  const [homeCorners, setHomeCorners] = useState(6.2);
  const [homeCards, setHomeCards] = useState(2.1);
  const [homeForm, setHomeForm] = useState<MatchResult[]>(['W', 'W', 'D', 'W', 'L']);

  // Away Team State
  const [awayName, setAwayName] = useState('Deplasman Takım');
  const [awayScored, setAwayScored] = useState(1.6);
  const [awayConceded, setAwayConceded] = useState(1.3);
  const [awayHtGoalRate, setAwayHtGoalRate] = useState(50);
  const [awayHtLeadRate, setAwayHtLeadRate] = useState(35);
  const [awayCorners, setAwayCorners] = useState(5.0);
  const [awayCards, setAwayCards] = useState(2.4);
  const [awayForm, setAwayForm] = useState<MatchResult[]>(['D', 'W', 'L', 'W', 'D']);

  // Result state
  const [analysisResult, setAnalysisResult] = useState<MatchAnalysis | null>(null);

  // Bültendeki tüm maçlar
  // Bültendeki maçlar (Sadece henüz oynanmamış / gelecek veya canlı maçlar alınır)
  const allAvailableMatches = useMemo(() => {
    const raw = matches && matches.length > 0 ? matches : getInitialWeeklyMatches();
    return raw.filter((m) => {
      if (m.status === 'finished') return false;
      if (m.time === 'MS' || m.time === 'Bitti' || m.time === 'FT') return false;
      const s = getMatchLiveState(m);
      if (s.isFinished) return false;
      return true;
    });
  }, [matches]);

  // Yalnızca henüz oynanmamış (gelecek / oynanacak) veya şu an canlı olan maçlar
  const upcomingMatches = allAvailableMatches;

  // Hızlı öneri butonları (bültenden popüler ilk 6 oynanacak maç)
  const upcomingQuickPicks = useMemo(() => {
    return upcomingMatches.slice(0, 6);
  }, [upcomingMatches]);

  // Arama sorgusuna göre anında filtreleme (SADECE oynanacak maçlar taranır, bitmiş maçlar kesinlikle gelmez)
  const filteredUpcomingMatches = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return upcomingMatches.filter((m) => {
      // Çift emniyet: Asla bitmiş maç geçmesin
      if (m.status === 'finished' || m.time === 'MS' || m.time === 'Bitti' || m.time === 'FT') return false;
      const s = getMatchLiveState(m);
      if (s.isFinished) return false;

      const home = m.homeTeam?.name?.toLowerCase() || '';
      const away = m.awayTeam?.name?.toLowerCase() || '';
      const league = m.league?.toLowerCase() || '';
      const code = m.iddaaCode?.toLowerCase() || '';
      return home.includes(q) || away.includes(q) || league.includes(q) || code.includes(q);
    });
  }, [searchQuery, upcomingMatches]);

  if (!isOpen) return null;

  const loadMatchFromBulletin = (match: Match) => {
    setSelectedUpcomingMatch(match);

    setHomeName(match.homeTeam.name);
    setHomeScored(match.homeTeam.avgGoalsScored ?? 1.8);
    setHomeConceded(match.homeTeam.avgGoalsConceded ?? 1.0);
    const homeHtG = (match.homeTeam.firstHalfGoalRate ?? 0.6) > 1
      ? match.homeTeam.firstHalfGoalRate
      : Math.round((match.homeTeam.firstHalfGoalRate ?? 0.6) * 100);
    const homeHtL = (match.homeTeam.firstHalfLeadingRate ?? 0.45) > 1
      ? match.homeTeam.firstHalfLeadingRate
      : Math.round((match.homeTeam.firstHalfLeadingRate ?? 0.45) * 100);
    setHomeHtGoalRate(homeHtG);
    setHomeHtLeadRate(homeHtL);
    setHomeCorners(match.homeTeam.avgCorners ?? 5.5);
    setHomeCards(match.homeTeam.avgCards ?? 2.2);
    setHomeForm(match.homeTeam.form || ['W', 'D', 'W', 'L', 'W']);

    setAwayName(match.awayTeam.name);
    setAwayScored(match.awayTeam.avgGoalsScored ?? 1.4);
    setAwayConceded(match.awayTeam.avgGoalsConceded ?? 1.2);
    const awayHtG = (match.awayTeam.firstHalfGoalRate ?? 0.5) > 1
      ? match.awayTeam.firstHalfGoalRate
      : Math.round((match.awayTeam.firstHalfGoalRate ?? 0.5) * 100);
    const awayHtL = (match.awayTeam.firstHalfLeadingRate ?? 0.35) > 1
      ? match.awayTeam.firstHalfLeadingRate
      : Math.round((match.awayTeam.firstHalfLeadingRate ?? 0.35) * 100);
    setAwayHtGoalRate(awayHtG);
    setAwayHtLeadRate(awayHtL);
    setAwayCorners(match.awayTeam.avgCorners ?? 4.8);
    setAwayCards(match.awayTeam.avgCards ?? 2.5);
    setAwayForm(match.awayTeam.form || ['D', 'W', 'L', 'W', 'D']);

    // Doğrudan Poisson analizini ve taktik raporu üret
    const res = analyzeMatch(match.homeTeam, match.awayTeam, match.id);
    setAnalysisResult(res);
  };

  const handleCalculate = () => {
    const homeTeam: TeamStats = {
      id: 'custom-home',
      name: homeName || 'Ev Sahibi Takım',
      shortName: (homeName || 'EV').slice(0, 3).toUpperCase(),
      form: homeForm,
      avgGoalsScored: Number(homeScored),
      avgGoalsConceded: Number(homeConceded),
      firstHalfGoalRate: homeHtGoalRate / 100,
      firstHalfLeadingRate: homeHtLeadRate / 100,
      avgCorners: Number(homeCorners),
      avgCards: Number(homeCards),
      shotsOnTargetAvg: Number((homeScored * 2.8).toFixed(1)),
      cleanSheetRate: Math.max(0.1, 1 - (homeConceded / 2)),
      primaryColor: '#10b981'
    };

    const awayTeam: TeamStats = {
      id: 'custom-away',
      name: awayName || 'Deplasman Takım',
      shortName: (awayName || 'DEP').slice(0, 3).toUpperCase(),
      form: awayForm,
      avgGoalsScored: Number(awayScored),
      avgGoalsConceded: Number(awayConceded),
      firstHalfGoalRate: awayHtGoalRate / 100,
      firstHalfLeadingRate: awayHtLeadRate / 100,
      avgCorners: Number(awayCorners),
      avgCards: Number(awayCards),
      shotsOnTargetAvg: Number((awayScored * 2.8).toFixed(1)),
      cleanSheetRate: Math.max(0.1, 1 - (awayConceded / 2)),
      primaryColor: '#8b5cf6'
    };

    const res = analyzeMatch(homeTeam, awayTeam);
    setAnalysisResult(res);
  };

  const toggleFormItem = (team: 'home' | 'away', index: number) => {
    const nextResult = (current: MatchResult): MatchResult => {
      if (current === 'W') return 'D';
      if (current === 'D') return 'L';
      return 'W';
    };

    if (team === 'home') {
      const updated = [...homeForm];
      updated[index] = nextResult(updated[index]);
      setHomeForm(updated);
    } else {
      const updated = [...awayForm];
      updated[index] = nextResult(updated[index]);
      setAwayForm(updated);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="fixed inset-0" onClick={onClose}></div>

      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto z-10 max-h-[94vh] flex flex-col">
        
        {/* Header */}
        <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-100 text-sm sm:text-base">
                Kendi Maçını Analiz Et
              </h3>
              <p className="text-[11px] text-slate-400">
                Bültende olmayan herhangi iki takımın istatistiklerini girerek Poisson simülasyonu çalıştır
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">

          {/* Arama Motoru - Oynanacak Maç Arama & Anında Getirme */}
          <div className="rounded-2xl bg-slate-950/90 border border-emerald-500/30 p-4 space-y-3.5 shadow-xl">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center space-x-2">
                <Search className="w-4 h-4" />
                <span>Oynanacak Maç Arama Motoru</span>
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                Bültende {upcomingMatches.length} Oynanacak / Canlı Maç Var
              </span>
            </div>

            {/* Arama Girdi Çubuğu */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Oynanacak maç, takım adı veya İddaa kodu yazın (Örn: Galatasaray, Fenerbahçe, Real Madrid, 48210)..."
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 shadow-inner transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Arama Yapılmamışken: Bültenden Gerçek Hızlı Maç Önerileri */}
            {!searchQuery.trim() && (
              <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
                <span className="text-slate-400 font-medium whitespace-nowrap text-[11px] flex items-center space-x-1 shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Bültenden Hızlı Seç:</span>
                </span>
                {upcomingQuickPicks.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => loadMatchFromBulletin(m)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 font-semibold border border-slate-800 hover:border-emerald-500/40 whitespace-nowrap cursor-pointer transition-all flex items-center space-x-1.5 text-[11px] shrink-0"
                  >
                    {m.iddaaCode && (
                      <span className="font-mono text-[10px] text-amber-400 font-black">
                        #{m.iddaaCode}
                      </span>
                    )}
                    <span>{m.homeTeam.shortName || m.homeTeam.name} vs {m.awayTeam.shortName || m.awayTeam.name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Arama Sonuçları: Yazılan Maç Doğrudan Altında Çıkar */}
            {searchQuery.trim() && (
              <div className="space-y-2 pt-1 animate-fadeIn">
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span>Bulunan Oynanacak Maçlar ({filteredUpcomingMatches.length})</span>
                  <span className="text-emerald-400 font-medium">Seçtiğiniz maçın tüm verileri anında yüklenir</span>
                </div>

                {filteredUpcomingMatches.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center text-xs text-slate-400">
                    "{searchQuery}" aramasına uygun oynanacak maç bulunamadı. Lütfen takım adı veya İddaa kodunu kontrol edin.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
                    {filteredUpcomingMatches.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => loadMatchFromBulletin(m)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                          selectedUpcomingMatch?.id === m.id
                            ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/50 shadow-md shadow-emerald-950/30'
                            : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800 hover:border-emerald-500/40'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-2">
                          <span className="font-bold text-slate-300 truncate max-w-[170px]">{m.league}</span>
                          <div className="flex items-center space-x-1.5 shrink-0">
                            {m.iddaaCode && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-mono font-black border border-amber-500/30">
                                #{m.iddaaCode}
                              </span>
                            )}
                            <span className="font-mono text-slate-400">{m.date} {m.time}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="font-black text-xs text-white flex items-center space-x-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                              <span>{m.homeTeam.name}</span>
                            </div>
                            <div className="font-black text-xs text-slate-300 flex items-center space-x-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400"></span>
                              <span>{m.awayTeam.name}</span>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              loadMatchFromBulletin(m);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 text-[11px] font-black border border-emerald-500/40 transition-all shrink-0 ml-2 cursor-pointer"
                          >
                            ⚡ Yükle & Analiz Et
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Aktif İncelenen Oynanacak Maç Kartı */}
            {selectedUpcomingMatch && (
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/60 border border-emerald-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] text-emerald-400 font-black uppercase tracking-wider flex items-center space-x-2">
                      <span>Aktif İncelenen Oynanacak Maç</span>
                      {selectedUpcomingMatch.iddaaCode && (
                        <span className="font-mono bg-amber-500/25 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30">
                          İddaa Kodu: {selectedUpcomingMatch.iddaaCode}
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-black text-white mt-0.5">
                      {selectedUpcomingMatch.homeTeam.name} vs {selectedUpcomingMatch.awayTeam.name}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center space-x-2 mt-0.5">
                      <span>{selectedUpcomingMatch.league}</span>
                      <span>•</span>
                      <span className="font-mono">{selectedUpcomingMatch.date} {selectedUpcomingMatch.time}</span>
                      {selectedUpcomingMatch.stadium && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[200px]">{selectedUpcomingMatch.stadium}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {onSelectMatchDetail && (
                    <button
                      onClick={() => onSelectMatchDetail(selectedUpcomingMatch)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-all cursor-pointer"
                    >
                      <span>Tam Detay Penceresi</span>
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                    </button>
                  )}
                  <span className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-black font-mono border border-emerald-500/30">
                    Veriler Yüklendi ✓
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Input Grid: Ev Sahibi vs Deplasman */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Ev Sahibi Takım Kutusu */}
            <div className="rounded-2xl bg-slate-950/70 border border-emerald-500/30 p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-xs uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                  <span>Ev Sahibi Takım</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">İç Saha Verileri</span>
              </div>

              {/* Takım İsmi */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Takım İsmi</label>
                <input
                  type="text"
                  value={homeName}
                  onChange={(e) => setHomeName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Gol Atma & Yeme */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Ort. Atılan Gol: <strong className="text-emerald-400">{homeScored}</strong>
                  </label>
                  <input
                    type="range"
                    min="0.4"
                    max="3.5"
                    step="0.1"
                    value={homeScored}
                    onChange={(e) => setHomeScored(parseFloat(e.target.value))}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Ort. Yenen Gol: <strong className="text-rose-400">{homeConceded}</strong>
                  </label>
                  <input
                    type="range"
                    min="0.3"
                    max="3.0"
                    step="0.1"
                    value={homeConceded}
                    onChange={(e) => setHomeConceded(parseFloat(e.target.value))}
                    className="w-full accent-rose-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* İlk Yarı Oranları */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    İY Gol Bulma: <strong className="text-slate-200">%{homeHtGoalRate}</strong>
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="95"
                    step="5"
                    value={homeHtGoalRate}
                    onChange={(e) => setHomeHtGoalRate(parseInt(e.target.value))}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    İY Önde Bitirme: <strong className="text-slate-200">%{homeHtLeadRate}</strong>
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="85"
                    step="5"
                    value={homeHtLeadRate}
                    onChange={(e) => setHomeHtLeadRate(parseInt(e.target.value))}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* Form Durumu Seçici */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1.5">
                  Son 5 Maç Formu (Değiştirmek için tıkla):
                </label>
                <div className="flex items-center space-x-2">
                  {homeForm.map((res, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleFormItem('home', i)}
                      className={`w-7 h-7 rounded-lg text-xs font-black cursor-pointer transition-all ${
                        res === 'W'
                          ? 'bg-emerald-500 text-emerald-950 ring-2 ring-emerald-400/40'
                          : res === 'D'
                          ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-400/40'
                          : 'bg-rose-500 text-rose-950 ring-2 ring-rose-400/40'
                      }`}
                    >
                      {res === 'W' ? 'G' : res === 'D' ? 'B' : 'M'}
                    </button>
                  ))}
                  <span className="text-[10px] text-slate-500 ml-2">(G: Galibiyet, B: Beraberlik, M: Mağlubiyet)</span>
                </div>
              </div>

              {/* Korner & Kart */}
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-800/80">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Ort. Korner</label>
                  <input
                    type="number"
                    step="0.5"
                    value={homeCorners}
                    onChange={(e) => setHomeCorners(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Ort. Kart</label>
                  <input
                    type="number"
                    step="0.5"
                    value={homeCards}
                    onChange={(e) => setHomeCards(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                  />
                </div>
              </div>

            </div>

            {/* Deplasman Takım Kutusu */}
            <div className="rounded-2xl bg-slate-950/70 border border-purple-500/30 p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-xs uppercase tracking-wider text-purple-400 flex items-center space-x-1.5">
                  <span className="h-2 w-2 rounded-full bg-purple-400"></span>
                  <span>Deplasman Takım</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Dış Saha Verileri</span>
              </div>

              {/* Takım İsmi */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Takım İsmi</label>
                <input
                  type="text"
                  value={awayName}
                  onChange={(e) => setAwayName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Gol Atma & Yeme */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Ort. Atılan Gol: <strong className="text-purple-400">{awayScored}</strong>
                  </label>
                  <input
                    type="range"
                    min="0.3"
                    max="3.5"
                    step="0.1"
                    value={awayScored}
                    onChange={(e) => setAwayScored(parseFloat(e.target.value))}
                    className="w-full accent-purple-400 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Ort. Yenen Gol: <strong className="text-rose-400">{awayConceded}</strong>
                  </label>
                  <input
                    type="range"
                    min="0.3"
                    max="3.0"
                    step="0.1"
                    value={awayConceded}
                    onChange={(e) => setAwayConceded(parseFloat(e.target.value))}
                    className="w-full accent-rose-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* İlk Yarı Oranları */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    İY Gol Bulma: <strong className="text-slate-200">%{awayHtGoalRate}</strong>
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="95"
                    step="5"
                    value={awayHtGoalRate}
                    onChange={(e) => setAwayHtGoalRate(parseInt(e.target.value))}
                    className="w-full accent-purple-400 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    İY Önde Bitirme: <strong className="text-slate-200">%{awayHtLeadRate}</strong>
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="85"
                    step="5"
                    value={awayHtLeadRate}
                    onChange={(e) => setAwayHtLeadRate(parseInt(e.target.value))}
                    className="w-full accent-purple-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* Form Durumu Seçici */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1.5">
                  Son 5 Maç Formu (Değiştirmek için tıkla):
                </label>
                <div className="flex items-center space-x-2">
                  {awayForm.map((res, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleFormItem('away', i)}
                      className={`w-7 h-7 rounded-lg text-xs font-black cursor-pointer transition-all ${
                        res === 'W'
                          ? 'bg-emerald-500 text-emerald-950 ring-2 ring-emerald-400/40'
                          : res === 'D'
                          ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-400/40'
                          : 'bg-rose-500 text-rose-950 ring-2 ring-rose-400/40'
                      }`}
                    >
                      {res === 'W' ? 'G' : res === 'D' ? 'B' : 'M'}
                    </button>
                  ))}
                  <span className="text-[10px] text-slate-500 ml-2">(G: Galibiyet, B: Beraberlik, M: Mağlubiyet)</span>
                </div>
              </div>

              {/* Korner & Kart */}
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-800/80">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Ort. Korner</label>
                  <input
                    type="number"
                    step="0.5"
                    value={awayCorners}
                    onChange={(e) => setAwayCorners(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Ort. Kart</label>
                  <input
                    type="number"
                    step="0.5"
                    value={awayCards}
                    onChange={(e) => setAwayCards(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                  />
                </div>
              </div>

            </div>

          </div>

          {/* Calculate Button */}
          <div className="flex justify-center pt-2">
            <button
              onClick={handleCalculate}
              className="flex items-center space-x-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition-all transform active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-5 h-5 fill-current" />
              <span>Yapay Zeka Poisson Algoritmasını Çalıştır</span>
            </button>
          </div>

          {/* Computed Analysis Output Screen */}
          {analysisResult && (
            <div className="rounded-2xl bg-slate-950 border border-emerald-500/50 p-5 sm:p-6 space-y-5 animate-fadeIn">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-extrabold text-emerald-400">
                    Özel Maç Analiz Raporu Başarıyla Üretildi
                  </h4>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  {homeName} vs {awayName}
                </div>
              </div>

              {/* 3-Kademeli Yapay Zeka Tercih Matrisi */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. Ana Banko Tercih */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-950 border border-emerald-500/50 shadow-lg shadow-emerald-500/10 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                        <Flame className="w-3 h-3" />
                        <span>1. Ana Banko</span>
                      </span>
                      <span className="text-xs font-mono font-black text-emerald-300">
                        Adil Oran: {toFairOdds(analysisResult.primaryPrediction.confidence)}
                      </span>
                    </div>
                    <div className="text-base font-black text-white">
                      {analysisResult.primaryPrediction.label}
                    </div>
                    <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                      {analysisResult.primaryPrediction.reason}
                    </p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Güven Endeksi</span>
                    <span className="font-mono font-black text-emerald-400">%{analysisResult.primaryPrediction.confidence}</span>
                  </div>
                </div>

                {/* 2. Kasa / Güvenli Tercih */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-sky-950/70 via-slate-900 to-slate-950 border border-sky-500/50 shadow-lg shadow-sky-500/10 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center space-x-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>2. Kasa Güvenli</span>
                      </span>
                      <span className="text-xs font-mono font-black text-sky-300">
                        Adil Oran: {toFairOdds(analysisResult.safePrediction?.confidence || 75)}
                      </span>
                    </div>
                    <div className="text-base font-black text-white">
                      {analysisResult.safePrediction?.label || '1.5 Gol Üst / Çifte Şans'}
                    </div>
                    <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                      {analysisResult.safePrediction?.reason || 'Yüksek başarı ihtimalli, düşük riskli kasa tercihi.'}
                    </p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Güven Endeksi</span>
                    <span className="font-mono font-black text-sky-400">%{analysisResult.safePrediction?.confidence || 78}</span>
                  </div>
                </div>

                {/* 3. Sürpriz / Değer Tercihi */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-950/70 via-slate-900 to-slate-950 border border-purple-500/50 shadow-lg shadow-purple-500/10 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center space-x-1">
                        <Target className="w-3 h-3" />
                        <span>3. Sürpriz Değer</span>
                      </span>
                      <span className="text-xs font-mono font-black text-purple-300">
                        Adil Oran: {toFairOdds(analysisResult.surprisePrediction?.confidence || 30)}
                      </span>
                    </div>
                    <div className="text-base font-black text-white">
                      {analysisResult.surprisePrediction?.label || 'İY/MS veya Skor Kombini'}
                    </div>
                    <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                      {analysisResult.surprisePrediction?.reason || 'Yüksek katsayılı değer bahsi seçeneği.'}
                    </p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Olasılık</span>
                    <span className="font-mono font-black text-purple-400">%{analysisResult.surprisePrediction?.confidence || 28}</span>
                  </div>
                </div>
              </div>

              {/* 4-Maddeli Detaylı Taktik Analizi */}
              {analysisResult.tacticalBreakdown && (
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                    <Compass className="w-4 h-4 text-emerald-400" />
                    <span>Uzman Taktiksel Maç Okuması & Raporu</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                      <div className="font-bold text-emerald-400 flex items-center space-x-1.5 mb-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>1. Maçın Dinamiği & Form Analizi</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{analysisResult.tacticalBreakdown.overview}</p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                      <div className="font-bold text-indigo-400 flex items-center space-x-1.5 mb-1">
                        <Swords className="w-3.5 h-3.5" />
                        <span>2. Hücum Gücü vs Savunma Zaafı (xG)</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{analysisResult.tacticalBreakdown.attackVsDefense}</p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                      <div className="font-bold text-amber-400 flex items-center space-x-1.5 mb-1">
                        <Timer className="w-3.5 h-3.5" />
                        <span>3. İlk Yarı Beklentisi & Oyun Temposu</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{analysisResult.tacticalBreakdown.tempoTempo}</p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                      <div className="font-bold text-rose-400 flex items-center space-x-1.5 mb-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>4. Kritik Risk & Dikkat Edilmesi Gerekenler</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{analysisResult.tacticalBreakdown.keyRisk}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Comment */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 leading-relaxed flex items-start space-x-2.5">
                <Bot className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p>{analysisResult.aiComment}</p>
              </div>

              {/* MS 1 - X - 2 Probs */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-300">
                  <span>Maç Sonucu 1 - X - 2 Olasılıkları</span>
                  <span className="font-mono text-emerald-400">
                    MS 1: %{analysisResult.ms1} • MS X: %{analysisResult.msX} • MS 2: %{analysisResult.ms2}
                  </span>
                </div>
                <div className="h-4 w-full bg-slate-800 rounded-xl overflow-hidden flex shadow-inner">
                  <div style={{ width: `${analysisResult.ms1}%` }} className="bg-emerald-500 flex items-center justify-center text-[10px] font-black text-slate-950">
                    1 (%{analysisResult.ms1})
                  </div>
                  <div style={{ width: `${analysisResult.msX}%` }} className="bg-amber-400 flex items-center justify-center text-[10px] font-black text-slate-950">
                    X (%{analysisResult.msX})
                  </div>
                  <div style={{ width: `${analysisResult.ms2}%` }} className="bg-purple-500 flex items-center justify-center text-[10px] font-black text-white">
                    2 (%{analysisResult.ms2})
                  </div>
                </div>
              </div>

              {/* Alt/Üst ve İY/MS Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400">1.5 Gol Üst</div>
                  <div className="text-base font-black text-emerald-400 font-mono">%{analysisResult.over15}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400">2.5 Gol Üst</div>
                  <div className="text-base font-black text-amber-400 font-mono">%{analysisResult.over25}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400">KG Var İhtimali</div>
                  <div className="text-base font-black text-purple-400 font-mono">%{analysisResult.bttsYes}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400">En Güçlü İY/MS</div>
                  <div className="text-xs font-black text-slate-100">{analysisResult.topHtFt[0]?.label}</div>
                  <div className="text-[10px] text-emerald-400 font-mono">%{analysisResult.topHtFt[0]?.prob}</div>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};

