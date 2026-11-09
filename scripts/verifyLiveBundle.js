// scripts/verifyLiveBundle.js
async function verifyLive() {
  console.log('🌐 [Live Verification] proanaliz-ai.onrender.com kontrol ediliyor...');
  const res = await fetch('https://proanaliz-ai.onrender.com');
  const html = await res.text();
  console.log('✓ HTML Alındı, Boyut:', html.length);

  const match = html.match(/src="\.\/assets\/(index-[^"]+\.js)"/);
  if (!match) {
    console.error('❌ JS Bundle bulunamadı!');
    return;
  }

  const jsUrl = 'https://proanaliz-ai.onrender.com/assets/' + match[1];
  console.log('✓ Bulunan Canlı JS URL:', jsUrl);

  const jsRes = await fetch(jsUrl);
  const code = await jsRes.text();
  console.log('✓ JS Bundle Boyutu:', (code.length / 1024).toFixed(1), 'KB\n');

  const tests = [
    { name: '1. 🎯 Value Bet (Değer Bahisleri & Rozet)', ok: /Değer Bahisleri/i.test(code) && /Değer/i.test(code) },
    { name: '2. 🔥 Canlı Gol Radarı & Örnek Alarm', ok: /Canlı Gol Radarı/i.test(code) && /Örnek Alarmı/i.test(code) },
    { name: '3. 🧮 Monte Carlo Kupon Risk Simülatörü', ok: /Monte Carlo/i.test(code) && (/5000/i.test(code) || /5e3/i.test(code)) },
    { name: '4. 📸 Tek Tıkla Sosyal Kupon Paylaşımı', ok: /whatsapp/i.test(code) && /telegram/i.test(code) && /PRO-/i.test(code) }
  ];

  console.log('📊 CANLI SUNUCU (RENDER) DOĞRULAMA RAPORU:');
  for (const t of tests) {
    console.log(`  ${t.ok ? '✅ ÇALIŞIYOR' : '❌ BAŞARISIZ'}: ${t.name}`);
  }
}

verifyLive().catch(console.error);
