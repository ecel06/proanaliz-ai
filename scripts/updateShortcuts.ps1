$sh = New-Object -ComObject WScript.Shell
$desktop = [Environment]::GetFolderPath([Environment+SpecialFolder]::Desktop)
$appDir = "C:\Users\BCM\.gemini\antigravity-ide\brain\94cb2a23-73ac-4d20-84e2-7a8667d1a4ff"
$vbsPath = "$appDir\ProAnaliz_Baslat.vbs"
$iconPath = "$appDir\proanaliz.ico"

$scPaths = @(
  "$desktop\ProAnaliz AI.lnk",
  "$desktop\ProAnaliz AI - Futbol İstatistik & Olasılık Motoru.lnk"
)

foreach ($scPath in $scPaths) {
  $sc = $sh.CreateShortcut($scPath)
  $sc.TargetPath = "C:\WINDOWS\system32\wscript.exe"
  $sc.Arguments = "`"$vbsPath`""
  $sc.WorkingDirectory = $appDir
  $sc.IconLocation = "$iconPath,0"
  $sc.Description = "ProAnaliz AI - Futbol Analiz & Tahmin Motoru"
  $sc.Save()
  Write-Host "Kısayol başarıyla güncellendi: $scPath"
}

