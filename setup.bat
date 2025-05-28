@echo off
echo Smart Carbon Monitoring System - Setup Script
echo =============================================
echo.

:: Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    exit /b 1
)

:: Display Node.js version
echo Node.js version:
node -v
echo.

:: Check if npm is installed
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo npm is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    exit /b 1
)

:: Display npm version
echo npm version:
npm -v
echo.

:: Create logs directory if it doesn't exist
if not exist logs mkdir logs
echo Created logs directory

:: Install dependencies
echo Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Failed to install dependencies.
    exit /b 1
)
echo Dependencies installed successfully!
echo.

:: Create a logs directory
if not exist logs mkdir logs
echo Created logs directory
echo.

:: Offer to start the application
echo Setup complete!
echo.
echo Options:
echo 1. Start the application in production mode (npm start)
echo 2. Start the application in development mode (npm run dev)
echo 3. Run tests (npm test)
echo 4. Exit without starting
echo.

set /p option="Select an option (1-4): "

if "%option%"=="1" (
    echo Starting application in production mode...
    call npm start
) else if "%option%"=="2" (
    echo Starting application in development mode...
    call npm run dev
) else if "%option%"=="3" (
    echo Running tests...
    call npm test
) else (
    echo Exiting setup. Run 'npm start' or 'npm run dev' to start the application.
)

exit /b 0
