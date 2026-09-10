!macro NSIS_HOOK_POSTINSTALL
  SetShellVarContext current
  CreateShortCut "$DESKTOP\flood.md.lnk" "$INSTDIR\flood-desktop.exe"
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  SetShellVarContext current
  Delete "$DESKTOP\flood.md.lnk"
!macroend
