# scripts/createShortcut.ps1
# Creates a Windows Desktop shortcut for ProAnaliz AI across all valid Desktop paths

$projectDir = (Get-Item $PSScriptRoot).Parent.FullName
$vbsPath = Join-Path $projectDir "ProAnaliz_Baslat.vbs"
$icoPath = Join-Path $projectDir "proanaliz.ico"

# Collect all possible Desktop locations (Registry, OneDrive, Standard, Turkish Masaüstü)
$possibleDesktops = [System.Collections.Generic.List[string]]::new()

try {
    $regDesktop = (Get-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders' -ErrorAction SilentlyContinue).Desktop
    if ($regDesktop) {
        $expanded = [System.Environment]::ExpandEnvironmentVariables($regDesktop)
        $possibleDesktops.Add($expanded)
    }
} catch {}

$envDesktop = [Environment]::GetFolderPath("Desktop")
if ($envDesktop) { $possibleDesktops.Add($envDesktop) }

$userProfile = $env:USERPROFILE
if ($userProfile) {
    $possibleDesktops.Add((Join-Path $userProfile "OneDrive\Masaüstü"))
    $possibleDesktops.Add((Join-Path $userProfile "OneDrive\Desktop"))
    $possibleDesktops.Add((Join-Path $userProfile "Masaüstü"))
    $possibleDesktops.Add((Join-Path $userProfile "Desktop"))
}

$wshShell = New-Object -ComObject WScript.Shell
$createdCount = 0

foreach ($dest in ($possibleDesktops | Select-Object -Unique)) {
    if (Test-Path $dest) {
        try {
            $shortcutPath = Join-Path $dest "ProAnaliz AI.lnk"
            $shortcut = $wshShell.CreateShortcut($shortcutPath)
            $shortcut.TargetPath = "wscript.exe"
            $shortcut.Arguments = "`"$vbsPath`""
            $shortcut.WorkingDirectory = $projectDir
            $shortcut.Description = "ProAnaliz AI - Profesyonel Futbol Analiz ve İstatistik Motoru"
            
            if (Test-Path $icoPath) {
                $shortcut.IconLocation = "$icoPath,0"
            }
            
            $shortcut.Save()
            Write-Host "✅ Kısayol başarıyla oluşturuldu: $shortcutPath"
            $createdCount++
        } catch {
            Write-Host "⚠️ Kısayol oluşturulamadı ($dest): $_"
        }
    }
}

if ($createdCount -eq 0) {
    Write-Host "⚠️ Hiçbir masaüstü klasörü bulunamadı veya erişilemedi."
}

