@echo off
REM Build script for Desktop Management System MVP v1.0.0
REM This script must be run as Administrator

REM Change to script directory
cd /d "%~dp0"

echo ========================================
echo   Desktop Management System - MVP Build
echo   Version 1.0.0
echo ========================================
echo.
echo Current directory: %CD%
echo.

REM Check for Administrator privileges
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Running with Administrator privileges
) else (
    echo [ERROR] This script must be run as Administrator!
    echo.
    echo Right-click this file and select "Run as administrator"
    echo.
    pause
    exit /b 1
)

echo.
echo Step 1: Stopping any running processes...
taskkill /F /IM electron.exe 2>nul
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
echo [OK] Processes stopped

echo.
echo Step 2: Cleaning old builds...
if exist "build\electron" (
    rmdir /s /q "build\electron" 2>nul
    timeout /t 2 /nobreak >nul
    if exist "build\electron" (
        echo [WARNING] Could not remove old build folder completely
        echo [INFO] Trying to rename old folder...
        move "build\electron" "build\electron-backup-%RANDOM%" 2>nul
    ) else (
        echo [OK] Old build folder removed
    )
) else (
    echo [OK] No old build to clean
)

echo.
echo Step 3: Building application...
echo This may take 5-10 minutes...
echo.

call npm run build:electron

if %errorLevel% == 0 (
    echo.
    echo ========================================
    echo   BUILD SUCCESSFUL!
    echo ========================================
    echo.
    echo Installer location: build\electron\
    dir /b build\electron\*.exe 2>nul
    echo.
    echo Next step: Create GitHub Release with the installer
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
