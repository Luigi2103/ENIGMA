@echo off
setlocal

echo.
echo [ZAP Cleanup] Elimino l'utente di test "zaptest" e tutti i suoi dati...
echo.

node -e "fetch('http://localhost:3000/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'zaptest', password: 'ZapTest123!' }) }).then(r=>r.json()).then(d=>{ if(!d.token) { console.log('Nessun token ricevuto (forse utente inesistente).'); return; } return fetch('http://localhost:3000/users/zaptest', { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + d.token } }); }).then(r=>{ if(r && r.status===200) console.log('Utente e relativi dati eliminati con successo!'); else if(r) console.log('Operazione non riuscita o utente non trovato.'); }).catch(e => console.log('Impossibile connettersi al server locale. Assicurati che il backend sia acceso sulla porta 3000.'));"

echo.
pause
