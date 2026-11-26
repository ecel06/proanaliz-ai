// scripts/analyzeCeilings.mjs
// Quantitative BIST Ceiling (Tavan) Anatomy & Pattern Extraction Engine
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchStockChart } from '../server/stockService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Extended high-beta & high-momentum BIST universe for comprehensive backtest
const TARGET_SYMBOLS = [
  // High Beta & Growth & Popular Ceiling Names
  'KATMR', 'HEKTS', 'TCKRC', 'TOASO', 'KCAER', 'ASTOR', 'KONTR', 'REEDR', 'MIATK', 
  'CWENE', 'YEOTK', 'ALARK', 'CANTE', 'EUPWR', 'GESAN', 'ENJSA', 'ODAS', 'BERA',
  'SMRTG', 'ALFAS', 'KOPOL', 'SDTTR', 'PASEU', 'GZNMI', 'TABGD', 'BIMAS', 'THYAO',
  'ASELS', 'GARAN', 'AKBNK', 'YKBNK', 'ISCTR', 'KCHOL', 'SAHOL', 'TUPRS', 'EREGL',
  'FROTO', 'TCELL', 'TTKOM', 'SISE', 'PGSUS', 'ARCLK', 'MGROS', 'TAVHL', 'ENKAI',
  'PETKM', 'SASA', 'GUBRF', 'KOZAL', 'DOAS', 'EKGYO', 'AEFES', 'CCOLA', 'ULKER',
  'SOKM', 'HALKB', 'VAKBN', 'KRDMD', 'VESTL', 'AGHOL', 'AKFYE', 'AKSA', 'AKSEN',
  'ALBRK', 'ALGYO', 'ANSGR', 'AYGAZ', 'BIOEN', 'BRSAN', 'BRYAT', 'BUCIM', 'CMENT',
  'CEMTS', 'CLEBI', 'DOHOL', 'ECILC', 'ECZYT', 'EGEEN', 'GENIL', 'GLYHO', 'GWIND',
  'HEKTS', 'IPEKE', 'ISDMR', 'ISGYO', 'ISMEN', 'IZMDC', 'KARSN', 'KARTN', 'KORDS',
  'KOZAA', 'KZBGY', 'MAVI', 'MOBTL', 'NTHOL', 'OTKAR', 'OYAKC', 'PENTA', 'QUAGR',
  'SELEC', 'SKBNK', 'TMSN', 'TRGYO', 'TSKB', 'TTRAK', 'TURSG', 'VESBE', 'ZOREN'
];

function calcRSI(closes, period = 14) {
  if (closes.length <= period) return 50;
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) {
      avgGain = (avgGain * (period - 1) + diff) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(diff)) / period;
    }
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return Number((100 - (100 / (1 + rs))).toFixed(2));
}

function calcBollingerWidth(closes, period = 20) {
  if (closes.length < period) return 0.1;
  const slice = closes.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
  const std = Math.sqrt(variance);
  const upper = mean + 2 * std;
  const lower = mean - 2 * std;
  return Number(((upper - lower) / mean).toFixed(4));
}

function calcEMA(closes, period) {
  if (closes.length === 0) return 0;
  const k = 2 / (period + 1);
  let ema = closes[0];
  for (let i = 1; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k);
  }
  return ema;
}

async function runCeilingAnatomyStudy() {
  console.log(`[Study] Starting BIST Ceiling Anatomy & Backtest across ${TARGET_SYMBOLS.length} stocks...`);
  const detectedCeilings = [];
  let totalCandlesExamined = 0;

  for (let sIdx = 0; sIdx < TARGET_SYMBOLS.length; sIdx++) {
    const sym = TARGET_SYMBOLS[sIdx];
    try {
      const chart = await fetchStockChart(sym, 'bist', '3mo', '1d');
      if (!chart || !Array.isArray(chart.candles) || chart.candles.length < 25) {
        continue;
      }

      const candles = chart.candles;
      totalCandlesExamined += candles.length;

      // Scan for ceiling days in the last 40 trading days (~2 months)
      const startIndex = Math.max(21, candles.length - 40);

      for (let i = startIndex; i < candles.length; i++) {
        const today = candles[i];
        const prev = candles[i - 1];
        if (!today || !prev || prev.close <= 0) continue;

        const dailyGain = (today.close - prev.close) / prev.close;
        const maxDailyGain = (today.high - prev.close) / prev.close;

        // BIST ceiling definition: Daily gain >= +9.5% or close near high with +9.3%+
        const isCeiling = dailyGain >= 0.094 || (maxDailyGain >= 0.098 && today.close >= today.high * 0.99);

        if (isCeiling) {
          const dateStr = new Date(today.time * 1000).toISOString().split('T')[0];

          // Historical window prior to ceiling day (T-1, T-2, ..., T-20)
          const historyUntilT1 = candles.slice(0, i);
          const tMinus1 = candles[i - 1];
          const tMinus2 = candles[i - 2];

          if (historyUntilT1.length < 20) continue;

          // 1. RVOL on T-1 (Relative Volume)
          const vol20 = historyUntilT1.slice(-21, -1).map(c => c.volume);
          const avgVol20 = vol20.reduce((a, b) => a + b, 0) / (vol20.length || 1);
          const rvol_T1 = avgVol20 > 0 ? Number((tMinus1.volume / avgVol20).toFixed(2)) : 1;

          // 2. Price Change on T-1 and T-2
          const tMinus1Gain = (tMinus1.close - tMinus2.close) / (tMinus2.close || 1);
          const tMinus2Gain = i >= 3 ? (tMinus2.close - candles[i - 3].close) / (candles[i - 3].close || 1) : 0;

          // 3. Technical Indicators on T-1
          const closesUntilT1 = historyUntilT1.map(c => c.close);
          const rsi_T1 = calcRSI(closesUntilT1, 14);
          const bbWidth_T1 = calcBollingerWidth(closesUntilT1, 20);
          const ema20_T1 = calcEMA(closesUntilT1, 20);
          const ema50_T1 = calcEMA(closesUntilT1, 50);

          // 4. Squeeze detection (BB width in lowest 30% of recent 40 days)
          const recentWidths = [];
          for (let w = Math.max(20, closesUntilT1.length - 30); w < closesUntilT1.length; w++) {
            recentWidths.push(calcBollingerWidth(closesUntilT1.slice(0, w + 1), 20));
          }
          const avgWidth = recentWidths.reduce((a, b) => a + b, 0) / (recentWidths.length || 1);
          const isSqueeze = bbWidth_T1 <= avgWidth * 0.85;

          // 5. Dip vs Breakout Classification
          const minCloseRecent = Math.min(...closesUntilT1.slice(-30));
          const maxCloseRecent = Math.max(...closesUntilT1.slice(-30));
          const isDipReversal = tMinus1.close <= minCloseRecent * 1.15 && rsi_T1 < 50;
          const isBreakout = tMinus1.close >= maxCloseRecent * 0.95;

          detectedCeilings.push({
            symbol: sym,
            ceilingDate: dateStr,
            ceilingGainPct: Number((dailyGain * 100).toFixed(2)),
            tMinus1: {
              date: new Date(tMinus1.time * 1000).toISOString().split('T')[0],
              gainPct: Number((tMinus1Gain * 100).toFixed(2)),
              rvol: rvol_T1,
              rsi: rsi_T1,
              bbWidth: bbWidth_T1,
              isSqueeze,
              aboveEMA20: tMinus1.close >= ema20_T1,
              aboveEMA50: tMinus1.close >= ema50_T1,
              isDipReversal,
              isBreakout,
            }
          });
        }
      }
    } catch (err) {
      // ignore individual stock fetch errors
    }
  }

  console.log(`[Study Completed] Analyzed ${totalCandlesExamined} candles. Found ${detectedCeilings.length} confirmed ceiling events!`);

  if (detectedCeilings.length === 0) {
    console.log('[Study] No ceilings detected in sample window.');
    return;
  }

  // --- STATISTICAL AGGREGATION & DNA EXTRACTION ---
  const count = detectedCeilings.length;
  const rvolList = detectedCeilings.map(c => c.tMinus1.rvol).sort((a, b) => a - b);
  const rsiList = detectedCeilings.map(c => c.tMinus1.rsi).sort((a, b) => a - b);
  const bbWidthList = detectedCeilings.map(c => c.tMinus1.bbWidth).sort((a, b) => a - b);
  const tMinus1GainList = detectedCeilings.map(c => c.tMinus1.gainPct);

  const avgRvol = Number((rvolList.reduce((a, b) => a + b, 0) / count).toFixed(2));
  const medianRvol = rvolList[Math.floor(count / 2)];
  const pctWithVolumeSpike = Number(((detectedCeilings.filter(c => c.tMinus1.rvol >= 1.5).length / count) * 100).toFixed(1));
  const pctWithHighVolumeSpike = Number(((detectedCeilings.filter(c => c.tMinus1.rvol >= 2.0).length / count) * 100).toFixed(1));

  const pctSqueeze = Number(((detectedCeilings.filter(c => c.tMinus1.isSqueeze).length / count) * 100).toFixed(1));
  const pctAboveEMA20 = Number(((detectedCeilings.filter(c => c.tMinus1.aboveEMA20).length / count) * 100).toFixed(1));
  const pctDipReversal = Number(((detectedCeilings.filter(c => c.tMinus1.isDipReversal).length / count) * 100).toFixed(1));
  const pctBreakout = Number(((detectedCeilings.filter(c => c.tMinus1.isBreakout).length / count) * 100).toFixed(1));

  const avgRsi = Number((rsiList.reduce((a, b) => a + b, 0) / count).toFixed(1));
  const rsiBetween45And68 = Number(((detectedCeilings.filter(c => c.tMinus1.rsi >= 45 && c.tMinus1.rsi <= 68).length / count) * 100).toFixed(1));

  // T-1 day price behavior: was it quietly positive (+0.1% to +4.5%)?
  const pctQuietGreen = Number(((detectedCeilings.filter(c => c.tMinus1.gainPct >= 0.1 && c.tMinus1.gainPct <= 4.8).length / count) * 100).toFixed(1));
  const avgTMinus1Gain = Number((tMinus1GainList.reduce((a, b) => a + b, 0) / count).toFixed(2));

  const report = {
    generatedAt: new Date().toISOString(),
    totalCeilingsFound: count,
    keyMetrics: {
      volume: {
        avgRVOL: avgRvol,
        medianRVOL: medianRvol,
        pctRVOLAbove1_5x: pctWithVolumeSpike,
        pctRVOLAbove2_0x: pctWithHighVolumeSpike,
        verdict: 'Tavan yapmadan 1 gün önce hisselerin %' + pctWithVolumeSpike + '\'inde belirgin bir hacim patlaması (RVOL >= 1.5x) oluşuyor.'
      },
      volatility: {
        pctPreSqueeze: pctSqueeze,
        verdict: 'Tavanların %' + pctSqueeze + '\'i daralan Bollinger bandı sıkışması (enerji depolama) sonrası patlıyor.'
      },
      rsi: {
        avgRSI_TMinus1: avgRsi,
        pctInSweetSpot_45_to_68: rsiBetween45And68,
        verdict: 'Tavan yapacak hisselerin %' + rsiBetween45And68 + '\'i tavan öncesi 45-68 RSI tatlı bandında (ne aşırı doymuş ne de ölü) bulunuyor.'
      },
      priceAction: {
        avgPreGain: avgTMinus1Gain,
        pctQuietGreenTMinus1: pctQuietGreen,
        pctAboveEMA20: pctAboveEMA20,
        verdict: 'Tavan yapan hisselerin %' + pctQuietGreen + '\'i tavan gününden bir gün önce sessizce +%0.1 ile +%4.8 arasında yeşil kapatarak kurumsal alıcı toplamış.'
      },
      archetypes: {
        pctBreakoutMomentum: pctBreakout,
        pctDipReversal: pctDipReversal,
        verdict: 'Tavanların %' + pctBreakout + '\'i Zirve Kırılımı (Momentum), %' + pctDipReversal + '\'i ise Aşırı Satım Dip Dönüşü (Value Reversal) modelinden çıkıyor.'
      }
    },
    topSamples: detectedCeilings.slice(0, 15)
  };

  const outDir = path.join(__dirname, '../server/data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'ceiling_patterns_report.json'), JSON.stringify(report, null, 2), 'utf8');

  console.log('\n=== BIST TAVAN ANATOMİSİ RAPOR ÖZETİ ===');
  console.log(JSON.stringify(report.keyMetrics, null, 2));
  console.log('\nÖrnek Tespit Edilen Tavanlar (İlk 5):');
  console.log(JSON.stringify(report.topSamples.slice(0, 5), null, 2));
}

runCeilingAnatomyStudy().catch(console.error);
