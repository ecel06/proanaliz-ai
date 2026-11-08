// scripts/fetchBulletin.js
// ProAnaliz AI - Standalone CLI Bulletin Scraper

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchLiveBulletin } from '../server/bulletinService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('⚽ ========================================================');
  console.log('⚽ ProAnaliz AI - Otomatik Canlı İddaa Bülteni Çekici');
  console.log('⚽ Açık spor uç noktalarından tüm ligler taranıyor...');
  console.log('⚽ ========================================================');

  try {
    const data = await fetchLiveBulletin();

    // 1. Write to src/data/liveBulletin.json
    const srcDir = path.resolve(__dirname, '../src/data');
    if (!fs.existsSync(srcDir)) fs.mkdirSync(srcDir, { recursive: true });
    fs.writeFileSync(path.join(srcDir, 'liveBulletin.json'), JSON.stringify(data, null, 2), 'utf8');

    // 2. Write to public/data/bulletin.json for client-side static fetch
    const publicDir = path.resolve(__dirname, '../public/data');
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
    fs.writeFileSync(path.join(publicDir, 'bulletin.json'), JSON.stringify(data, null, 2), 'utf8');

    console.log('\n📊 LİG BAZLI MAÇ DAĞILIMI:');
    Object.entries(data.leagueCounts).forEach(([name, count]) => {
      console.log(`   - ${name.padEnd(25, ' ')}: ${count} maç`);
    });

    console.log('\n✨ TOPLAM MAÇ SAYISI:', data.totalMatches);
    console.log('💾 Veriler src/data/liveBulletin.json ve public/data/bulletin.json konumuna kaydedildi!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Hata oluştu:', err);
    process.exit(1);
  }
}

main();

