@echo off
echo.
echo [ZAP Setup] Creo l'utente di test "zaptest" nel database...
echo.

curl -s -X POST http://localhost:3000/signup ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"zaptest\",\"password\":\"ZapTest123!\",\"nome\":\"ZAP\",\"cognome\":\"Test\",\"email\":\"zaptest@enigma-local.dev\"}" ^
  -w "\n\nHTTP Status: %%{http_code}\n"

echo.
echo Se vedi HTTP Status: 201 --^> utente creato con successo!
echo Se vedi HTTP Status: 409 --^> utente gia' esistente (tutto ok).
echo Se non vedi nulla    --^> il backend non e' in ascolto su porta 3000.
echo.
pause
