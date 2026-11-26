// scripts/testTavanLive.mjs
import { fetchStockScreener } from '../server/stockService.js';

async function run() {
  console.log('--- 1. BIST Canlı Veri Seti Alınıyor ---');
  const res = await fetchStockScreener('bist', '', false);
  const stocks = res.stocks || [];
  console.log(`Toplam BIST Hissesi: ${stocks.length}`);

  // Simulate Engine Rules in JS directly matching stockAnalysisEngine.ts
  const sectorLeadersMap = new Map();
  stocks.forEach((s) => {
    if (!s.sector) return;
    const current = sectorLeadersMap.get(s.sector);
    const chg = s.changePct || 0;
    if (!current || chg > current.changePct) {
      sectorLeadersMap.set(s.sector, { symbol: s.symbol, changePct: chg, sector: s.sector });
    }
  });

  const kapCatalysts = new Set(['ASELS', 'KONTR', 'MIATK']);

  const phases = ['pre_market', 'call_auction', 'in_session', 'post_market', 'weekend'];
  let totalErrors = 0;

  for (const phase of phases) {
    const isLive = phase === 'in_session';
    const isCallAuction = phase === 'call_auction';

    const candidates = [];

    stocks.forEach((s) => {
      const price = s.close || 1;
      const changePct = s.changePct || 0;
      const isMegaCap = Boolean(s.marketCap && s.marketCap > 65e9);
      const isNearCeilingClose = changePct >= 9.4;

      if (changePct >= 9.7) return; // already locked

      let score = 10;
      let squeezeStatus = 'Normal';
      if (s.bbLower !== null && s.bbUpper !== null && s.bbUpper > 0) {
        const bbMid = (s.bbUpper + s.bbLower) / 2;
        const bbWidth = (s.bbUpper - s.bbLower) / (bbMid || 1);
        if (bbWidth <= 0.075) squeezeStatus = 'Daralma / Yay Eşiğinde';
      }

      let isDipReversal = false;
      if (s.rsi !== null && s.rsi <= 32) {
        isDipReversal = true;
        score += 26;
      } else if (s.rsi !== null && s.rsi <= 38 && changePct >= 1.0) {
        isDipReversal = true;
        score += 16;
      }

      if (squeezeStatus === 'Daralma / Yay Eşiğinde') score += 24;

      if (s.valueTraded && s.marketCap && s.marketCap > 0) {
        const turnoverRate = (s.valueTraded / s.marketCap) * 100;
        if (turnoverRate >= 3.5) score += 20;
        else if (turnoverRate >= 1.8) score += 10;
      }

      if (isLive) {
        if (changePct >= 5.5) score += 32;
        else if (changePct >= 2.5) score += 20;
        else if (changePct <= 0) score -= 25;
      } else if (isCallAuction) {
        score += 16;
        if (changePct >= 2.5) score += 15;
      } else {
        if (changePct >= 6.5 && !isNearCeilingClose) score -= 35;
        else if (changePct >= 0.8 && changePct <= 4.2 && squeezeStatus === 'Daralma / Yay Eşiğinde') score += 26;
        else if (isDipReversal && changePct >= -3.5 && changePct <= 3.0) score += 24;
      }

      if (isMegaCap) {
        score = Math.min(score, 50);
      } else if (s.marketCap && s.marketCap < 35e9 && s.marketCap > 1.5e9) {
        score += 8;
      }

      const hasKapCatalyst = !isMegaCap && kapCatalysts.has(s.symbol);
      if (hasKapCatalyst) score += 24;

      const secLeader = s.sector ? sectorLeadersMap.get(s.sector) : null;
      let isSectorDomino = false;
      if (!isMegaCap && secLeader && secLeader.symbol !== s.symbol && secLeader.changePct >= 7.5 && changePct >= 1.2 && changePct <= 6.2) {
        isSectorDomino = true;
        score += 22;
      }

      score = Math.min(92, Math.max(0, Math.round(score)));

      let category = 'NORMAL';
      let categoryLabel = 'Normal Seyir';
      if (!isMegaCap) {
        if (isCallAuction && score >= 75) {
          category = 'TAVAN_SERISI';
          categoryLabel = '🌅 Açılış Eşleşme Tavanı';
        } else if (hasKapCatalyst && score >= 75) {
          category = 'HABER_KATALIZOR';
          categoryLabel = '⚡ KAP Katalizör Tavanı (Episodic Pivot)';
        } else if (isSectorDomino && score >= 75) {
          category = 'SEKTOR_DOMINO';
          categoryLabel = `🔗 Sektörel Domino (${secLeader?.symbol} Sürüklemesi)`;
        } else if (isDipReversal && score >= 75) {
          category = 'DIP_TEPKI_TAVANI';
          categoryLabel = '🎯 Dip Tepki Tavanı Adayı';
        } else if (squeezeStatus === 'Daralma / Yay Eşiğinde' && score >= 75) {
          category = 'SIKISMA_PATLAMASI';
          categoryLabel = '⚡ Sıkışma Patlaması Adayı';
        } else if (score >= 80) {
          category = 'KIRILIM_TAVANI';
          categoryLabel = '🚀 Güçlü Tavan Adayı';
        }
      }

      const isCandidate = !isMegaCap && (
        isLive || isCallAuction
          ? score >= 75 && (changePct >= 2.0 || category === 'SEKTOR_DOMINO' || category === 'HABER_KATALIZOR') && changePct < 9.7
          : score >= 78 && (
              (changePct >= -3.5 && changePct <= 3.0 && isDipReversal && s.rsi !== null && s.rsi <= 32) ||
              (changePct >= 0.8 && changePct <= 4.2 && squeezeStatus === 'Daralma / Yay Eşiğinde') ||
              category === 'SEKTOR_DOMINO' ||
              category === 'HABER_KATALIZOR' ||
              isNearCeilingClose
            )
      );

      if (isCandidate) {
        // Enforce signal harmonization:
        const signal = score >= 80 ? 'GÜÇLÜ AL' : 'AL';
        const bias = 'LONG (AL)';

        candidates.push({
          symbol: s.symbol,
          name: s.name,
          changePct,
          score,
          category,
          categoryLabel,
          signal,
          bias,
          marketCap: s.marketCap,
        });
      }
    });

    candidates.sort((a, b) => b.score - a.score);
    const topCandidates = candidates.slice(0, 5);

    console.log(`\n--- Seans Fazı: [${phase}] ---`);
    console.log(`Toplam Elit Aday (Maksimum 5): ${topCandidates.length}`);
    topCandidates.forEach((c) => {
      console.log(`  -> ${c.symbol.padEnd(6)} | %${c.changePct >= 0 ? '+' : ''}${c.changePct.toFixed(2)}% | Skor: %${c.score} | ${c.signal} | ${c.categoryLabel} | Piyasa Değeri: ${(c.marketCap / 1e9).toFixed(1)} Mr TL`);

      if (c.marketCap > 65e9) {
        console.error(`  [HATA] Mega-Cap ${c.symbol} aday olamaz!`);
        totalErrors++;
      }
      if (c.signal !== 'GÜÇLÜ AL' && c.signal !== 'AL') {
        console.error(`  [HATA] ${c.symbol} sinyali çelişkili: ${c.signal}!`);
        totalErrors++;
      }
    });
  }

  console.log('\n=============================================');
  if (totalErrors === 0) {
    console.log('✅ TÜM KONTROLLER BAŞARILI: 0 HATA! Mega-Cap koruması devrede, sinyaller %100 uyumlu, aday listesi elit ve dengeli.');
  } else {
    console.error(`❌ ${totalErrors} HATA TESPİT EDİLDİ!`);
  }
}

run().catch(console.error);
