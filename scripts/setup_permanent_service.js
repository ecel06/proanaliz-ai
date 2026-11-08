// scripts/setup_permanent_service.js
// Creates Windows Startup shortcut and Desktop shortcut so ProAnaliz AI runs independently of Antigravity.

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectDir = path.resolve(__dirname, '..');

const appData = process.env.APPDATA || 'C:\\Users\\BCM\\AppData\\Roaming';
const startupDir = path.join(appData, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');

// User Desktop (OneDrive or standard)
const userProfile = process.env.USERPROFILE || 'C:\\Users\\BCM';
let desktopDir = path.join(userProfile, 'OneDrive', 'Masaüstü');
if (!fs.existsSync(desktopDir)) {
  desktopDir = path.join(userProfile, 'Desktop');
}
if (!fs.existsSync(desktopDir)) {
  desktopDir = path.join(userProfile, 'Masaüstü');
}

console.log('Project Dir:', projectDir);
console.log('Startup Dir:', startupDir);
console.log('Desktop Dir:', desktopDir);

const vbsServicePath = path.join(projectDir, 'ProAnaliz_Arkaplan_Servisi.vbs');
const vbsAppPath = path.join(projectDir, 'ProAnaliz_Baslat.vbs');
const iconPath = path.join(projectDir, 'public', 'favicon.ico');

// PowerShell helper to create a shortcut (.lnk)
function createShortcut(lnkPath, targetPath, args, workingDir, iconLocation, description) {
  const psScript = [
    `$sh = New-Object -ComObject WScript.Shell;`,
    `$shortcut = $sh.CreateShortcut('${lnkPath.replace(/'/g, "''")}');`,
    `$shortcut.TargetPath = '${targetPath.replace(/'/g, "''")}';`,
    `$shortcut.Arguments = '${args.replace(/'/g, "''")}';`,
    `$shortcut.WorkingDirectory = '${workingDir.replace(/'/g, "''")}';`,
    iconLocation ? `$shortcut.IconLocation = '${iconLocation.replace(/'/g, "''")}';` : '',
    `$shortcut.Description = '${description.replace(/'/g, "''")}';`,
    `$shortcut.Save();`
  ].filter(Boolean).join(' ');

  execSync(`powershell -NoProfile -Command "${psScript}"`);
  console.log(`✅ Kısayol oluşturuldu: ${lnkPath}`);
}

try {
  // 1. Startup Shortcut (Runs silently when Windows starts)
  const startupLnk = path.join(startupDir, 'ProAnaliz AI Arkaplan Servisi.lnk');
  createShortcut(
    startupLnk,
    'wscript.exe',
    `"${vbsServicePath}"`,
    projectDir,
    iconPath,
    'ProAnaliz AI Otomatik Arkaplan Servisi'
  );

  // 2. Desktop Shortcut (Opens app UI and ensures server runs)
  if (fs.existsSync(desktopDir)) {
    const desktopLnk = path.join(desktopDir, 'ProAnaliz AI.lnk');
    createShortcut(
      desktopLnk,
      'wscript.exe',
      `"${vbsAppPath}"`,
      projectDir,
      iconPath,
      'ProAnaliz AI - Futbol Analiz Motoru'
    );
  }

  console.log('🎉 Kurulum tamamlandı! ProAnaliz AI artık Windows başlangıcında bağımsız çalışacak.');
} catch (err) {
  console.error('Hata:', err);
  process.exit(1);
}
