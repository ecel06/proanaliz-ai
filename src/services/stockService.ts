// src/services/stockService.ts
import { StockChartResponse, StockMarketType, StockScreenerResponse } from '../types/stocks';

export async function fetchStockScreener(
  market: StockMarketType,
  search = '',
  force = false
): Promise<StockScreenerResponse> {
  const params = new URLSearchParams({ market });
  if (search.trim()) params.set('search', search.trim());
  if (force) params.set('force', '1');
  const res = await fetch(`/api/stocks/screener?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Borsa tarama verisi alınamadı (HTTP ${res.status})`);
  }
  return res.json();
}

export async function fetchStockChart(
  symbol: string,
  market: StockMarketType,
  range: '1mo' | '3mo' | '6mo' | '1y' = '6mo',
  interval: '1d' | '1wk' = '1d'
): Promise<StockChartResponse | null> {
  try {
    const params = new URLSearchParams({ market, range, interval });
    const res = await fetch(`/api/stocks/chart/${encodeURIComponent(symbol)}?${params.toString()}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.chart || null;
  } catch {
    return null;
  }
}

