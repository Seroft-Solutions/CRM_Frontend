@echo off
rem  -----------------------------------------------------------------
rem  prune-empty-dirs.bat   —   Recursively delete every empty folder
rem  -----------------------------------------------------------------
rem  Usage examples
rem     • Double-click to clean the current folder
rem     • prune-empty-dirs.bat  "D:\code\CRMCup\CRM_Frontend"
rem  -----------------------------------------------------------------

:: 1. Pick the root to scan
set "ROOT=%~1"
if "%ROOT%"=="" set "ROOT=%CD%"

echo.
echo   Pruning empty directories under:
echo   "%ROOT%"
echo   ---------------------------------------------------------------

:: 2. Loop until no more folders can be removed
:REPEAT
set "ANY_REMOVED="

:: 2a. Walk **all** directories bottom-up
for /f "delims=" %%D in ('
        dir "%ROOT%" /ad /s /b ^| sort /R
') do (
    rd "%%D" 2>nul && (
        echo     removed "%%D"
        set "ANY_REMOVED=1"
    )
)

:: 2b. If something disappeared this pass, run again
if defined ANY_REMOVED goto REPEAT

echo   ---------------------------------------------------------------
echo   Done – every truly empty directory is now gone.
echo.
pause
