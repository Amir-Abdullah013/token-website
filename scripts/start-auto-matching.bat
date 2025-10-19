@echo off
echo 🤖 Starting Automatic Order Matching...
echo.
echo This will run order matching every 30 seconds
echo Press Ctrl+C to stop
echo.

:loop
echo [%date% %time%] Checking for orders to execute...
curl -X GET "http://localhost:3000/api/cron/auto-match-orders" > nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Order matching completed
) else (
    echo ❌ Order matching failed - make sure dev server is running
)
echo.
timeout /t 30 /nobreak > nul
goto loop

