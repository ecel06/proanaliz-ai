// src/components/stocks/StockChart.tsx
import React, { useMemo, useState } from 'react';
import { StockCandle } from '../../types/stocks';
import { formatStockPrice } from '../../utils/stockAnalysisEngine';

interface StockChartProps {
  candles: StockCandle[];
  currency: string;
  stopLoss?: number;
  tp1?: number;
  analystTarget?: number | null;
  range: '1mo' | '3mo' | '6mo' | '1y';
  onChangeRange: (r: '1mo' | '3mo' | '6mo' | '1y') => void;
  loading?: boolean;
}

function calcEMA(values: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(values.length).fill(null);
  if (values.length < period) return result;
  let sum = 0;
  for (let i = 0; i < period; i++) sum += values[i];
  let ema = sum / period;
  result[period - 1] = ema;
  const k = 2 / (period + 1);
  for (let i = period; i < values.length; i++) {
    ema = values[i] * k + ema * (1 - k);
    result[i] = ema;
  }
  return result;
}

function calcBollingerSeries(values: number[], period = 20, mult = 2) {
  const upper: (number | null)[] = new Array(values.length).fill(null);
  const lower: (number | null)[] = new Array(values.length).fill(null);
  if (values.length < period) return { upper, lower };
  for (let i = period - 1; i < values.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += values[j];
    const mean = sum / period;
    let varSum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const d = values[j] - mean;
      varSum += d * d;
    }
    const std = Math.sqrt(varSum / period);
    upper[i] = mean + mult * std;
    lower[i] = mean - mult * std;
  }
  return { upper, lower };
}

function calcRSISeries(values: number[], period = 14): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (values.length <= period) return out;
  let gainSum = 0;
  let lossSum = 0;
  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gainSum += diff;
    else lossSum += Math.abs(diff);
  }
  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    const gain = diff >= 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return out;
}

export const StockChart: React.FC<StockChartProps> = ({
  candles,
  currency,
  stopLoss,
  tp1,
  analystTarget,
  range,
  onChangeRange,
  loading = false,
}) => {
  const [chartType, setChartType] = useState<'candle' | 'area'>('candle');
  const [showEma, setShowEma] = useState<boolean>(true);
  const [showBB, setShowBB] = useState<boolean>(false);
  const [showRSI, setShowRSI] = useState<boolean>(true);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const visibleCandles = useMemo(() => {
    if (!candles || candles.length === 0) return [];
    return candles.slice(-110);
  }, [candles]);

  const closesAll = useMemo(() => candles.map((c) => c.close), [candles]);
  const ema20All = useMemo(() => calcEMA(closesAll, 20).slice(-110), [closesAll]);
  const ema50All = useMemo(() => calcEMA(closesAll, 50).slice(-110), [closesAll]);
  const bbAll = useMemo(() => {
    const { upper, lower } = calcBollingerSeries(closesAll, 20, 2);
    return { upper: upper.slice(-110), lower: lower.slice(-110) };
  }, [closesAll]);
  const rsiAll = useMemo(() => calcRSISeries(closesAll, 14).slice(-110), [closesAll]);

  const W = 760;
  const RSI_H = showRSI ? 76 : 0;
  const H = 310 + RSI_H;
  const VOL_H = 52;
  const PAD_L = 12;
  const PAD_R = 64;
  const PAD_T = 16;
  const PAD_B = 62 + RSI_H;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const { minP, maxP, maxVol } = useMemo(() => {
    if (visibleCandles.length === 0) return { minP: 0, maxP: 100, maxVol: 1 };
    let lo = Infinity;
    let hi = -Infinity;
    let mv = 1;
    visibleCandles.forEach((c, i) => {
      if (c.low < lo) lo = c.low;
      if (c.high > hi) hi = c.high;
      if (c.volume > mv) mv = c.volume;
      if (showEma && ema20All[i]) {
        lo = Math.min(lo, ema20All[i]!);
        hi = Math.max(hi, ema20All[i]!);
      }
      if (showEma && ema50All[i]) {
        lo = Math.min(lo, ema50All[i]!);
        hi = Math.max(hi, ema50All[i]!);
      }
      if (showBB && bbAll.lower[i] && bbAll.upper[i]) {
        lo = Math.min(lo, bbAll.lower[i]!);
        hi = Math.max(hi, bbAll.upper[i]!);
      }
    });
    if (stopLoss && stopLoss > lo * 0.85 && stopLoss < hi * 1.15) lo = Math.min(lo, stopLoss);
    if (tp1 && tp1 > lo * 0.85 && tp1 < hi * 1.15) hi = Math.max(hi, tp1);
    const pad = (hi - lo) * 0.06 || hi * 0.02 || 1;
    return { minP: lo - pad, maxP: hi + pad, maxVol: mv };
  }, [visibleCandles, showEma, showBB, ema20All, ema50All, bbAll, stopLoss, tp1]);

  const toX = (idx: number) =>
    PAD_L + ((idx + 0.5) / Math.max(1, visibleCandles.length)) * plotW;
  const toY = (price: number) =>
    PAD_T + ((maxP - price) / Math.max(0.0001, maxP - minP)) * plotH;

  const rsiTop = H - RSI_H + 10;
  const rsiPlotH = Math.max(1, RSI_H - 18);
  const toRsiY = (val: number) => rsiTop + ((100 - val) / 100) * rsiPlotH;

  const areaPath = useMemo(() => {
    if (visibleCandles.length === 0) return '';
    return visibleCandles
      .map((c, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(c.close).toFixed(1)}`)
      .join(' ');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleCandles, minP, maxP]);

  const buildSeriesPath = (series: (number | null)[], yFn: (v: number) => number) => {
    let path = '';
    series.forEach((val, i) => {
      if (val === null) return;
      const cmd = path === '' ? 'M' : 'L';
      path += `${cmd} ${toX(i).toFixed(1)} ${yFn(val).toFixed(1)} `;
    });
    return path.trim();
  };

  const activeIdx =
    hoverIdx !== null && visibleCandles[hoverIdx] ? hoverIdx : visibleCandles.length - 1;
  const activeCandle = visibleCandles[activeIdx];
  const activeRsi = rsiAll[activeIdx];

  const candleWidth = Math.max(2, Math.min(8, (plotW / Math.max(1, visibleCandles.length)) * 0.65));

  return (
    <div className="rounded-2xl bg-slate-950/85 border border-slate-800 p-3 sm:p-4 space-y-2.5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-1">
          {(['1mo', '3mo', '6mo', '1y'] as const).map((r) => (
            <button
              key={r}
              onClick={() => onChangeRange(r)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-black cursor-pointer transition-all ${
                range === r
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {r === '1mo' ? '1A' : r === '3mo' ? '3A' : r === '6mo' ? '6A' : '1Y'}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setShowEma((v) => !v)}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold border cursor-pointer transition-all ${
              showEma
                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-400/40'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            EMA 20/50
          </button>
          <button
            onClick={() => setShowBB((v) => !v)}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold border cursor-pointer transition-all ${
              showBB
                ? 'bg-purple-500/15 text-purple-300 border-purple-400/40'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            Bollinger (20,2)
          </button>
          <button
            onClick={() => setShowRSI((v) => !v)}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold border cursor-pointer transition-all ${
              showRSI
                ? 'bg-amber-500/15 text-amber-300 border-amber-400/40'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            RSI (14)
          </button>
          <button
            onClick={() => setChartType((t) => (t === 'candle' ? 'area' : 'candle'))}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-[10px] font-bold cursor-pointer"
          >
            {chartType === 'candle' ? 'Mum Grafik' : 'Çizgi Grafik'}
          </button>
        </div>
      </div>

      {/* OHLCV Live Readout Bar */}
      {activeCandle && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono text-slate-300 bg-slate-900/70 px-3 py-1.5 rounded-xl border border-slate-800/80">
          <span className="text-slate-400">
            {new Date(activeCandle.time * 1000).toLocaleDateString('tr-TR')}
          </span>
          <span>
            A: <strong className="text-white">{formatStockPrice(activeCandle.open, '')}</strong>
          </span>
          <span>
            Y: <strong className="text-emerald-400">{formatStockPrice(activeCandle.high, '')}</strong>
          </span>
          <span>
            D: <strong className="text-rose-400">{formatStockPrice(activeCandle.low, '')}</strong>
          </span>
          <span>
            K: <strong className="text-amber-300">{formatStockPrice(activeCandle.close, currency)}</strong>
          </span>
          <span className="text-slate-400">
            Hacim: <strong className="text-slate-200">{(activeCandle.volume / 1e6).toFixed(2)}M</strong>
          </span>
          {showRSI && activeRsi !== null && activeRsi !== undefined && (
            <span className="text-amber-300">
              RSI: <strong>{activeRsi.toFixed(1)}</strong>
            </span>
          )}
          {showEma && (
            <span className="ml-auto text-[10px] text-slate-400 hidden sm:inline">
              <span className="text-cyan-400">━ EMA20</span> &nbsp;{' '}
              <span className="text-amber-400">━ EMA50</span>
            </span>
          )}
        </div>
      )}

      {/* Chart SVG */}
      {loading ? (
        <div className="h-[260px] flex items-center justify-center text-xs text-slate-400 animate-pulse">
          Tarihsel fiyat mumları yükleniyor...
        </div>
      ) : visibleCandles.length === 0 ? (
        <div className="h-[260px] flex items-center justify-center text-xs text-slate-500">
          Bu sembol için grafik verisi bulunamadı.
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto select-none overflow-visible"
          onMouseLeave={() => setHoverIdx(null)}
        >
          {/* Horizontal Price Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const pVal = maxP - t * (maxP - minP);
            const yPos = PAD_T + t * plotH;
            return (
              <g key={t}>
                <line
                  x1={PAD_L}
                  y1={yPos}
                  x2={W - PAD_R}
                  y2={yPos}
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={W - PAD_R + 6}
                  y={yPos + 3}
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {pVal >= 100 ? pVal.toFixed(1) : pVal >= 1 ? pVal.toFixed(2) : pVal.toPrecision(3)}
                </text>
              </g>
            );
          })}

          {/* Analyst Target Guide */}
          {analystTarget && analystTarget >= minP && analystTarget <= maxP && (
            <g>
              <line
                x1={PAD_L}
                y1={toY(analystTarget)}
                x2={W - PAD_R}
                y2={toY(analystTarget)}
                stroke="#38bdf8"
                strokeDasharray="2 3"
                strokeWidth="1.2"
              />
              <text
                x={W - PAD_R - 95}
                y={toY(analystTarget) - 4}
                fill="#7dd3fc"
                fontSize="9"
                fontWeight="bold"
              >
                Analist: {formatStockPrice(analystTarget, '')}
              </text>
            </g>
          )}

          {/* AI Target & Stop-Loss Guide Lines */}
          {tp1 && tp1 >= minP && tp1 <= maxP && (
            <g>
              <line
                x1={PAD_L}
                y1={toY(tp1)}
                x2={W - PAD_R}
                y2={toY(tp1)}
                stroke="#10b981"
                strokeDasharray="5 3"
                strokeWidth="1.2"
              />
              <text x={PAD_L + 4} y={toY(tp1) - 4} fill="#34d399" fontSize="9" fontWeight="bold">
                TP1: {formatStockPrice(tp1, '')}
              </text>
            </g>
          )}
          {stopLoss && stopLoss >= minP && stopLoss <= maxP && (
            <g>
              <line
                x1={PAD_L}
                y1={toY(stopLoss)}
                x2={W - PAD_R}
                y2={toY(stopLoss)}
                stroke="#f43f5e"
                strokeDasharray="5 3"
                strokeWidth="1.2"
              />
              <text x={PAD_L + 4} y={toY(stopLoss) + 11} fill="#fb7185" fontSize="9" fontWeight="bold">
                SL: {formatStockPrice(stopLoss, '')}
              </text>
            </g>
          )}

          {/* Bollinger Bands Overlay */}
          {showBB && (
            <>
              <path
                d={buildSeriesPath(bbAll.upper, toY)}
                fill="none"
                stroke="#a855f7"
                strokeDasharray="3 2"
                strokeWidth="1.1"
                opacity="0.75"
              />
              <path
                d={buildSeriesPath(bbAll.lower, toY)}
                fill="none"
                stroke="#a855f7"
                strokeDasharray="3 2"
                strokeWidth="1.1"
                opacity="0.75"
              />
            </>
          )}

          {/* Candles or Area */}
          {chartType === 'area' ? (
            <path d={areaPath} fill="none" stroke="#10b981" strokeWidth="2.2" />
          ) : (
            visibleCandles.map((c, i) => {
              const cx = toX(i);
              const isGreen = c.close >= c.open;
              const col = isGreen ? '#10b981' : '#f43f5e';
              const topBody = toY(Math.max(c.open, c.close));
              const botBody = toY(Math.min(c.open, c.close));
              const bodyH = Math.max(1.5, botBody - topBody);
              return (
                <g key={c.time}>
                  <line x1={cx} y1={toY(c.high)} x2={cx} y2={toY(c.low)} stroke={col} strokeWidth="1.2" />
                  <rect
                    x={cx - candleWidth / 2}
                    y={topBody}
                    width={candleWidth}
                    height={bodyH}
                    fill={col}
                    rx="0.8"
                  />
                </g>
              );
            })
          )}

          {/* EMA Overlays */}
          {showEma && (
            <>
              <path d={buildSeriesPath(ema20All, toY)} fill="none" stroke="#22d3ee" strokeWidth="1.4" opacity="0.9" />
              <path d={buildSeriesPath(ema50All, toY)} fill="none" stroke="#fbbf24" strokeWidth="1.4" opacity="0.9" />
            </>
          )}

          {/* Volume Sub-chart */}
          {visibleCandles.map((c, i) => {
            const cx = toX(i);
            const vh = (c.volume / Math.max(1, maxVol)) * VOL_H;
            const isGreen = c.close >= c.open;
            const volBottom = H - RSI_H - 4;
            return (
              <rect
                key={`v_${c.time}`}
                x={cx - candleWidth / 2}
                y={volBottom - vh}
                width={candleWidth}
                height={Math.max(1, vh)}
                fill={isGreen ? 'rgba(16,185,129,0.45)' : 'rgba(244,63,94,0.45)'}
              />
            );
          })}

          {/* RSI(14) Oscillator Panel */}
          {showRSI && (
            <g>
              <line x1={PAD_L} y1={rsiTop - 2} x2={W - PAD_R} y2={rsiTop - 2} stroke="#1e293b" strokeWidth="1" />
              <rect
                x={PAD_L}
                y={toRsiY(70)}
                width={plotW}
                height={toRsiY(30) - toRsiY(70)}
                fill="rgba(148,163,184,0.05)"
              />
              {[70, 50, 30].map((lvl) => (
                <g key={lvl}>
                  <line
                    x1={PAD_L}
                    y1={toRsiY(lvl)}
                    x2={W - PAD_R}
                    y2={toRsiY(lvl)}
                    stroke={lvl === 70 ? '#f43f5e44' : lvl === 30 ? '#10b98144' : '#334155'}
                    strokeDasharray="2 3"
                    strokeWidth="1"
                  />
                  <text x={W - PAD_R + 6} y={toRsiY(lvl) + 3} fill="#64748b" fontSize="9" fontFamily="monospace">
                    {lvl}
                  </text>
                </g>
              ))}
              <path
                d={buildSeriesPath(rsiAll, toRsiY)}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1.4"
              />
              <text x={PAD_L + 4} y={rsiTop + 10} fill="#fbbf24" fontSize="9" fontWeight="bold">
                RSI(14)
              </text>
            </g>
          )}

          {/* Hover Vertical Crosshair + Hit Targets */}
          {hoverIdx !== null && visibleCandles[hoverIdx] && (
            <line
              x1={toX(hoverIdx)}
              y1={PAD_T}
              x2={toX(hoverIdx)}
              y2={H - 4}
              stroke="#64748b"
              strokeDasharray="2 2"
              strokeWidth="1"
            />
          )}
          {visibleCandles.map((c, i) => {
            const slotW = plotW / Math.max(1, visibleCandles.length);
            return (
              <rect
                key={`hit_${c.time}`}
                x={toX(i) - slotW / 2}
                y={PAD_T}
                width={slotW}
                height={H - PAD_T}
                fill="transparent"
                onMouseEnter={() => setHoverIdx(i)}
              />
            );
          })}
        </svg>
      )}
    </div>
  );
};
