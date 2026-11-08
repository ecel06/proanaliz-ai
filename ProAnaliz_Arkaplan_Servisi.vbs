' ProAnaliz AI - 7/24 Kesintisiz Arka Plan Servisi
' Antigravity kapali olsa bile Node.js sunucusunu sessizce calistirir.

Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")

strScriptDir = FSO.GetParentFolderName(WScript.ScriptFullName)
serverPath = strScriptDir & "\server\server.js"

' Port 3001 LISTENING kontrol et
Set objExec = WshShell.Exec("cmd /c netstat -ano | findstr /R /C "":3001 .*LISTENING""")
strOutput = ""
Do While objExec.Status = 0
    WScript.Sleep 50
Loop
strOutput = objExec.StdOut.ReadAll()

If InStr(strOutput, "LISTENING") = 0 Then
    nodeBin = "node"
    If FSO.FileExists("C:\Program Files\nodejs\node.exe") Then
        nodeBin = "C:\Program Files\nodejs\node.exe"
    End If
    
    WshShell.CurrentDirectory = strScriptDir
    ' 0 = Tamamen gizli arkaplan, False = bagimsiz devam et
    WshShell.Run """" & nodeBin & """ """ & serverPath & """", 0, False
End If
