@echo off
setlocal

echo.
echo  =====================================================
echo   ENIGMA -- OWASP ZAP Security Scanner
echo  =====================================================
echo.

REM Controlla Docker
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERRORE] Docker non e' in esecuzione!
    echo          Avvia Docker Desktop e riprova.
    pause & exit /b 1
)

REM Controlla che il backend risponda
curl -s --max-time 5 http://localhost:3000/games >nul 2>&1
if errorlevel 1 (
    echo [AVVISO] Il backend su localhost:3000 non risponde.
    echo          Avvia il server Node.js prima di procedere.
    echo.
    echo          Premi INVIO per continuare comunque, o chiudi questa finestra per annullare.
    pause
)

echo [INFO] Avvio scansione ZAP... (puo' richiedere 5-20 minuti)
echo [INFO] I report saranno in: %~dp0reports\
echo.

docker run --rm ^
  --add-host=host.docker.internal:host-gateway ^
  -v "%~dp0:/zap/wrk:rw" ^
  -e ZAP_JVM_OPTIONS="-Xmx1024m" ^
  ghcr.io/zaproxy/zaproxy:stable ^
  zap.sh -cmd -autorun /zap/wrk/zap.yaml

echo.
if errorlevel 1 (
    echo [ERRORE] ZAP ha terminato con codice di errore.
    echo          Controlla l'output sopra per dettagli.
) else (
    echo [OK] Scansione completata!
    echo [OK] Apro il report HTML...
    start "" "%~dp0reports\report.html"
)

echo.
pause