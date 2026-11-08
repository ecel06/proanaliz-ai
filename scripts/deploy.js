// scripts/deploy.js
// Automates git push and triggers Render deploy hook so deployment is 100% hands-free.

import { execSync } from 'child_process';

const DEPLOY_HOOK_URL = 'https://api.render.com/deploy/srv-dbo9obp5efls73d8kfp0?key=OT41AzNOijg';

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
    console.log('🎉 [AutoDeploy] Başarılı! Render otomatik dağıtıma başladı. Deploy ID:', data.deploy?.id);
  } catch (err) {
    console.error('Deploy hook tetikleme hatası:', err.message);
  }
}

main();
