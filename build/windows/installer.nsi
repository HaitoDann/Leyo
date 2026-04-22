!define APP_NAME "Leyo Shell"
!define APP_VERSION "2.0.0"
!define APP_PUBLISHER "VinX"
!define APP_EXE "Leyo.exe"
!define INSTALL_DIR "$PROGRAMFILES64\Leyo"

Name "${APP_NAME} ${APP_VERSION}"
OutFile "LeyoSetup.exe"
InstallDir "${INSTALL_DIR}"
InstallDirRegKey HKLM "Software\Leyo" "InstallDir"
RequestExecutionLevel admin
SetCompressor lzma

; Pages
Page welcome
Page directory
Page instfiles
Page finish

UninstPage uninstConfirm
UninstPage instfiles

; Section principale
Section "Leyo Shell" SEC01
  SetOutPath "$INSTDIR"
  File "..\..\build\bin\${APP_EXE}"

  ; Raccourci Bureau
  CreateShortcut "$DESKTOP\Leyo Shell.lnk" \
    "$INSTDIR\${APP_EXE}" "" "$INSTDIR\${APP_EXE}" 0

  ; Raccourci Menu Démarrer
  CreateDirectory "$SMPROGRAMS\Leyo"
  CreateShortcut "$SMPROGRAMS\Leyo\Leyo Shell.lnk" \
    "$INSTDIR\${APP_EXE}" "" "$INSTDIR\${APP_EXE}" 0
  CreateShortcut "$SMPROGRAMS\Leyo\Désinstaller Leyo.lnk" \
    "$INSTDIR\uninstall.exe"

  ; Registre — ajout/suppression de programmes
  WriteRegStr HKLM \
    "Software\Microsoft\Windows\CurrentVersion\Uninstall\Leyo" \
    "DisplayName" "${APP_NAME}"
  WriteRegStr HKLM \
    "Software\Microsoft\Windows\CurrentVersion\Uninstall\Leyo" \
    "UninstallString" '"$INSTDIR\uninstall.exe"'
  WriteRegStr HKLM \
    "Software\Microsoft\Windows\CurrentVersion\Uninstall\Leyo" \
    "DisplayVersion" "${APP_VERSION}"
  WriteRegStr HKLM \
    "Software\Microsoft\Windows\CurrentVersion\Uninstall\Leyo" \
    "Publisher" "${APP_PUBLISHER}"
  WriteRegStr HKLM \
    "Software\Microsoft\Windows\CurrentVersion\Uninstall\Leyo" \
    "DisplayIcon" "$INSTDIR\${APP_EXE}"
  WriteRegDWORD HKLM \
    "Software\Microsoft\Windows\CurrentVersion\Uninstall\Leyo" \
    "NoModify" 1
  WriteRegDWORD HKLM \
    "Software\Microsoft\Windows\CurrentVersion\Uninstall\Leyo" \
    "NoRepair" 1

  WriteUninstaller "$INSTDIR\uninstall.exe"
SectionEnd

Section "Uninstall"
  Delete "$INSTDIR\${APP_EXE}"
  Delete "$INSTDIR\uninstall.exe"
  RMDir "$INSTDIR"
  Delete "$DESKTOP\Leyo Shell.lnk"
  RMDir /r "$SMPROGRAMS\Leyo"
  DeleteRegKey HKLM \
    "Software\Microsoft\Windows\CurrentVersion\Uninstall\Leyo"
  DeleteRegKey HKLM "Software\Leyo"
SectionEnd