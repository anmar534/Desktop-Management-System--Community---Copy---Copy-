@echo off
REM Force Build Script - Desktop Management System MVP v1.0.0
REM This script forcefully cleans and rebuilds the application
REM Must be run as Administrator

cd /d "%~dp0"

echo ========================================
echo   Force Build - Desktop Management System
echo ========================================
echo.

REM Check for Administrator
net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo [ERROR] Must run as Administrator!
    echo Right-click and select "Run as administrator"
    pause
    exit /b 1
)

echo [1/5] Killing all related processes...
taskkill /F /IM electron.exe 2>nul
taskkill /F /IM node.exe 2>nul
taskkill /F /IM "DesktopManagementSystem.exe" 2>nul
echo      Done. Waiting 3 seconds...
timeout /t 3 /nobreak >nul

echo.
echo [2/5] Force removing old build folder...
if exist "build\electron" (
    rmdir /s /q "build\electron" 2>nul
    timeout /t 2 /nobreak >nul

    REM If still exists, try to rename it
    if exist "build\electron" (
        echo      Could not delete, trying to rename...
        ren "build\electron" "electron-old-%RANDOM%-%RANDOM%" 2>nul
        timeout /t 2 /nobreak >nul
    )

    REM Check again
    if exist "build\electron" (
        echo      [WARNING] Build folder still exists!
        echo      Please close any programs that might be using it
        echo      (including File Explorer, VS Code, etc.)
        pause
    ) else (
        echo      [OK] Build folder removed
    )
) else (
    echo      [OK] No old build to remove
)

echo.
echo [3/5] Cleaning npm cache...
call npm cache clean --force 2>nul
echo      Done.

echo.
echo [4/5] Building React application...
call npm run build
if %errorLevel% NEQ 0 (
    echo      [ERROR] Vite build failed!
    pause
    exit /b 1
)
echo      [OK] React build completed

echo.
echo [5/5] Building Electron installer...
echo      This will take 5-10 minutes...
call npx electron-builder

if %errorLevel% == 0 (
    echo.
    echo ========================================
    echo   BUILD SUCCESSFUL!
    echo ========================================
    echo.
    echo Installer created at:
    dir /b build\electron\*.exe 2>nul
    echo.
    echo Files ready for GitHub Release:
    echo   - build\electron\DesktopManagementSystem-1.0.0-win-x64.exe
    echo   - build\electron\latest.yml
    echo.
    echo Next step: Create GitHub Release
    echo See BUILD_INSTRUCTIONS_AR.md for details
    echo.
) else (
    echo.
    echo ========================================
    echo   BUILD FAILED!
    echo ========================================
    echo.
    echo Check the error messages above
    echo.
)

pause
