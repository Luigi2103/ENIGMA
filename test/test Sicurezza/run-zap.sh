#!/bin/bash

echo ""
echo " ====================================================="
echo "  ENIGMA -- OWASP ZAP Security Scanner (Mac/Linux)"
echo " ====================================================="
echo ""

# Controlla Docker
if ! docker info >/dev/null 2>&1; then
    echo "[ERRORE] Docker non e' in esecuzione!"
    echo "         Avvia Docker Desktop e riprova."
    exit 1
fi

# Controlla che il backend risponda
if ! curl -s --max-time 5 http://localhost:3000/games >/dev/null 2>&1; then
    echo "[AVVISO] Il backend su localhost:3000 non risponde."
    echo "         Avvia il server Node.js prima di procedere."
    echo ""
    read -p "         Premi INVIO per continuare comunque, o premi Ctrl+C per annullare."
fi

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "[INFO] Avvio scansione ZAP... (puo' richiedere 5-20 minuti)"
echo "[INFO] I report saranno in: $DIR/reports/"
echo ""

docker run --rm \
  --add-host=host.docker.internal:host-gateway \
  -v "$DIR:/zap/wrk:rw" \
  -e ZAP_JVM_OPTIONS="-Xmx1024m" \
  ghcr.io/zaproxy/zaproxy:stable \
  zap.sh -cmd -autorun /zap/wrk/zap.yaml

if [ $? -ne 0 ]; then
    echo "[ERRORE] ZAP ha terminato con codice di errore."
    echo "         Controlla l'output sopra per dettagli."
else
    echo "[OK] Scansione completata!"
    echo "[OK] Apro il report HTML..."
    open "$DIR/reports/report.html" || xdg-open "$DIR/reports/report.html" 2>/dev/null
fi

echo ""
read -p "Premi INVIO per uscire..."
