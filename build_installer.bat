@echo off
echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo.
    echo Error: Failed to install dependencies. Please ensure no other processes are locking 'node_modules'.
    echo You may need to restart your computer or manually delete the 'node_modules' folder if this persists.
    pause
    exit /b %errorlevel%
)

echo.
echo Building application...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo Error: Build failed.
    pause
    exit /b %errorlevel%
)

echo.
echo Build completed successfully!
echo The installer should be in the 'release' folder.
pause
