// scripts/deploy.js
// Automates git push, triggers Render deploy hook, and monitors until live.

import { execSync } from 'child_process';

const DEPLOY_HOOK_URL = 'https://api.render.com/deploy/srv-dbo9obp5efls73d8kfp0?key=OT41AzNOijg';
const EXPECTED_VERSION = '2026.11.13.10';
const LIVE_VERSION_URL = 'https://proanaliz-ai.onrender.com/api/version';

async function main() {
  console.log('🚀 [AutoDeploy] Kodlar GitHub main dalına gönderiliyor...');
  try {
    execSync('git push origin main', { stdio: 'inherit' });
  } catch (e) {
    console.warn('Git push uyarısı:', e.message);
  }

  console.log('📡 [AutoDeploy] Render bulut sunucusu tetikleniyor...');
  try {
    const res = await fetch(DEPLOY_HOOK_URL, { method: 'POST' });
    const data = await res.json();
    console.log('🎉 [AutoDeploy] Başarılı! Render otomatik derleme başlattı. Deploy ID:', data.deploy?.id);
  } catch (err) {
    console.error('Deploy hook tetikleme hatası:', err.message);
  }

  console.log(`⏳ [AutoDeploy] Render üzerinde sürüm ${EXPECTED_VERSION} bekleniyor (bu işlem ~90-120sn sürer)...`);
  const startTime = Date.now();
  const maxWait = 6 * 60 * 1000; // 6 minutes max

  while (Date.now() - startTime < maxWait) {
    await new Promise(r => setTimeout(r, 6000));
    try {
      const res = await fetch(`${LIVE_VERSION_URL}?_t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        if (data.version === EXPECTED_VERSION) {
          console.log(`\n✅ [AutoDeploy] TEBRİKLER! Sürüm ${EXPECTED_VERSION} Render'da ${elapsed}s içinde YAYINA GİRDİ!`);
          return;
        } else {
          process.stdout.write(`\r... Derleniyor (${elapsed}s) - Mevcut Canlı Sürüm: ${data.version} ... `);
        }
      }
    } catch (e) {
      // Container swapping, brief connection drop is normal
      process.stdout.write('.');
    }
  }
  console.log('\n⚠️ [AutoDeploy] Zaman aşımı. Render arkaplanda derlemeyi tamamlayacaktır.');
}

main();

