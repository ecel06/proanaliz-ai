' ProAnaliz AI - Sessiz Masaüstü Başlatıcı
' CMD konsol penceresini gizleyerek arka planda çalıştırır

Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")

strScriptDir = FSO.GetParentFolderName(WScript.ScriptFullName)
strBatPath = strScriptDir & "\ProAnaliz_Baslat.bat"

WshShell.CurrentDirectory = strScriptDir
' 0 = Pencereyi gizle, False = Komutun bitmesini beklemeden devam et
WshShell.Run "cmd.exe /c """ & strBatPath & """", 0, False

