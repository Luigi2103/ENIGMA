# 🔒 Test Sicurezza — OWASP ZAP

Scansione automatica di vulnerabilità (XSS, SQLi, IDOR, Missing Headers, ecc.)
tramite **OWASP ZAP** in modalità Docker.

---

## ▶️ Come avviare la scansione

### Prerequisiti
- **Docker Desktop** in esecuzione
- **Backend Node.js** avviato su `localhost:3000`
- **Frontend Angular** avviato su `localhost:4200` *(opzionale)*

### Passi

**1. Crea l'utente di test** *(solo la prima volta)*
```
doppio click su:  1-crea-utente-zap.bat
```
Questo crea l'utente `zaptest` nel database, necessario perché ZAP
possa autenticarsi e testare le route protette da JWT.

**2. Avvia la scansione**
```
doppio click su:  run-zap.bat
```
La scansione dura circa **10–20 minuti**. Al termine si apre automaticamente il report.

---

## 📊 Cosa testa ZAP

| Fase | Cosa fa |
|------|---------|
| **Spider** | Trova tutte le route REST del backend |
| **AJAX Spider** | Naviga il frontend Angular come un browser reale |
| **Passive Scan** | Analizza le risposte HTTP (header mancanti, info leak...) |
| **Active Scan** | Inietta payload malevoli (XSS, SQLi, path traversal...) |

ZAP si **autentica automaticamente** su `/auth` con l'utente `zaptest`
e usa il token JWT per testare anche le route protette (`/games`, ecc.).

---

## 📁 Output

Dopo la scansione trovi i report in `reports/`:

| File | Descrizione |
|------|-------------|
| `report.html` | Report leggibile nel browser, con alert per severità |
| `report.json` | Report machine-readable per automazione CI/CD |

### Severità degli alert
- 🔴 **High** — Vulnerabilità critiche da risolvere subito
- 🟠 **Medium** — Da risolvere a breve
- 🟡 **Low** — Miglioramenti consigliati
- ℹ️ **Informational** — Note informative (spesso falsi positivi)

---

## ⚙️ File di configurazione

| File | Descrizione |
|------|-------------|
| `zap.yaml` | Piano di scansione ZAP (contesti, autenticazione, job) |
| `run-zap.bat` / `.sh` | Script di avvio per Windows / Mac (verifica Docker e backend, poi lancia ZAP) |
| `1-crea-utente-zap.bat` / `.sh` | Crea l'utente di test nel DB via API per Windows / Mac |
| `2-elimina-utente-zap.bat` / `.sh`| Elimina l'utente di test "zaptest" a fine scansione (tramite API, Windows / Mac) |

**Nota per utenti Mac/Linux:**
Per eseguire questi script su sistemi Unix-like, assicurati di dare i permessi di esecuzione:
```bash
chmod +x run-zap.sh
chmod +x 1-crea-utente-zap.sh
chmod +x 2-elimina-utente-zap.sh
```
