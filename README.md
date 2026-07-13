# 🔮 ENIGMA

> Piattaforma web di gioco a indovinelli generati dall'intelligenza artificiale.

Progetto universitario per l'esame di **Tecnologie Web** — Prof. Starace, Università degli Studi di Napoli Federico II.

---

## 📖 Descrizione

**ENIGMA** è una web application full-stack che permette agli utenti di sfidarsi con enigmi generati dinamicamente tramite **Google Gemini AI**. Ogni partita propone un suggerimento testuale e immagini generate dall'IA come indizi: l'obiettivo è indovinare la parola segreta entro 10 tentativi.

### Funzionalità principali

- 🤖 **Generazione enigmi con IA** — Ogni enigma (suggerimento + immagini) è creato da Google Gemini su tema libero o scelto dall'utente
- 🎮 **Partite con tentativi limitati** — 10 tentativi per indovinare la parola segreta
- 🏆 **Classifica globale** — Leaderboard pubblica con il numero di enigmi risolti per utente
- 👤 **Autenticazione JWT** — Registrazione e login sicuri con token Bearer
- 📚 **API documentate** — Swagger UI disponibile su `/api-docs`

---

## 🏗️ Architettura

```
ENIGMA/
├── backend/          # REST API – Node.js + Express + Sequelize
├── frontend/         # SPA – Angular 21
└── test/
    ├── test E2E/     # Test end-to-end
    └── test Sicurezza/ # Analisi sicurezza con OWASP ZAP
```

### Stack tecnologico

| Layer       | Tecnologia                                      |
|-------------|-------------------------------------------------|
| Frontend    | Angular 21, Bootstrap 5, Bootstrap Icons        |
| Backend     | Node.js, Express 5, Sequelize ORM               |
| Database    | PostgreSQL                                      |
| AI          | Google Gemini API + Unsplash API (immagini)     |
| Auth        | JWT (jsonwebtoken) + bcrypt                     |
| Docs API    | Swagger (swagger-jsdoc + swagger-ui-express)    |
| Container   | Docker + Docker Compose                         |
| Test        | Playwright (E2E), OWASP ZAP                     |

---

## 🚀 Avvio in locale (Sviluppo)

Per avviare l'applicazione in locale, è necessario eseguire **sia il backend che il frontend in due terminali separati**. 

### Prerequisiti

- [Node.js](https://nodejs.org/) >= 14.0.0
- [npm](https://www.npmjs.com/) >= 6.0.0
- [PostgreSQL](https://www.postgresql.org/) >= 13 in esecuzione sulla tua macchina
- Una **Gemini API Key** da [Google AI Studio](https://aistudio.google.com/)
- Una **Unsplash API Key** da [Unsplash Developers](https://unsplash.com/developers) (per la generazione delle immagini)

---

### ⚙️ Terminale 1: Avvio del Backend

1. **Apri un terminale ed entra nella cartella del backend, poi installa le dipendenze:**

   ```bash
   cd backend
   npm install
   ```

2. **Crea il file di configurazione:**
   Copia il file `.env.example` e rinominalo in `.env`.
   - Su Windows: `copy .env.example .env`
   - Su Mac/Linux: `cp .env.example .env`

3. **Compila il file `.env`** con i tuoi valori (in particolare l'URI del database):

   ```env
   GEMINI_API_KEY=la_tua_api_key_gemini
   IMAGE_API_KEY=la_tua_api_key_unsplash
   PORT=3000
   DB_CONNECTION_URI=postgres://user:password@localhost:5432/enigma
   DIALECT=postgres
   TOKEN_SECRET=una_stringa_segreta_lunga_e_casuale
   CORS_ORIGINS=http://localhost:4200,http://localhost:3000
   ```

4. **Avvia il server backend:**
   
   Puoi scegliere tra la modalità sviluppo (che riavvia in automatico il server se modifichi il codice) o quella standard:

   ```bash
   # Modalità sviluppo (consigliata se devi modificare il codice)
   npm run dev

   # Modalità standard / produzione
   npm start
   ```

   Il backend sarà in ascolto su `http://localhost:3000`.  
   La documentazione Swagger è raggiungibile su `http://localhost:3000/api-docs`.

---

### 🖥️ Terminale 2: Avvio del Frontend

1. **Apri un nuovo terminale separato, entra nella cartella del frontend e installa le dipendenze:**

   ```bash
   cd frontend
   npm install
   ```

2. **Avvia il server di sviluppo Angular:**

   ```bash
   npm start
   ```

   L'applicazione web sarà accessibile direttamente dal browser all'indirizzo `http://localhost:4200`.

---

### 🐳 Avvio con Docker

È disponibile un `Dockerfile` e un `docker-compose.yml` nella cartella `backend/` per containerizzare il server.

```bash
cd backend
docker compose up --build
```

> **Nota:** Il `docker-compose.yml` include anche un servizio `zap` per i test di sicurezza con OWASP ZAP.

---

## 📡 API Reference

La documentazione completa e interattiva delle API è disponibile tramite Swagger UI all'indirizzo:

```
http://localhost:3000/api-docs
```

### Panoramica degli endpoint

#### 🔓 Pubbliche (no autenticazione)

| Metodo | Endpoint        | Descrizione                          |
|--------|-----------------|--------------------------------------|
| `GET`  | `/`             | Stato dell'API                       |
| `POST` | `/auth`         | Login — restituisce token JWT        |
| `POST` | `/signup`       | Registrazione nuovo utente           |
| `GET`  | `/games`        | Lista paginata di tutte le partite   |
| `GET`  | `/games/:id`    | Dettagli di una partita specifica    |
| `GET`  | `/leaderboard`  | Classifica globale degli utenti      |

#### 🔐 Private (richiede `Authorization: Bearer <token>`)

| Metodo   | Endpoint                | Descrizione                                           |
|----------|-------------------------|-------------------------------------------------------|
| `POST`   | `/games`                | Crea una nuova partita (enigma generato dall'IA)      |
| `POST`   | `/games/:id/attempts`   | Invia un tentativo di risposta                        |
| `GET`    | `/games/:id/attempts`   | Recupera i propri tentativi per una partita           |
| `GET`    | `/games/:id/solution`   | Rivela la soluzione (solo dopo aver perso)            |
| `PATCH`  | `/games/:id`            | Chiude la partita dopo la sconfitta del giocatore     |

---

## 🗂️ Struttura del progetto

### Backend

```
backend/
├── controllers/       # Logica di business (GestorePartita, Login)
├── middleware/        # Controllo autenticazione JWT
├── models/            # Modelli Sequelize (Utente, Partita, Tentativo)
│   └── database.js    # Connessione e sync con il DB
├── routes/            # Definizione delle rotte Express + documentazione Swagger
│   ├── loginRoute.js  # POST /auth, POST /signup
│   ├── publicRoute.js # GET /games, GET /leaderboard
│   └── gameRoute.js   # Rotte autenticate (CRUD partite e tentativi)
├── utils/             # Utility (generazione AI, helpers)
├── index.js           # Entry point – configurazione Express
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

### Frontend

```
frontend/src/
├── app/
│   ├── _interceptors/       # HTTP interceptors (aggiunta token JWT alle richieste)
│   ├── _services/
│   │   ├── auth/            # AuthService (login, logout, token, segnali reattivi)
│   │   └── rest-backend/    # PublicService (games, leaderboard), GameService (tentativi, soluzione)
│   ├── _utils/              # Utility condivise (formatDate, getAvatarColor, getGameImage)
│   ├── home/                # Pagina home con enigmi recenti e classifica
│   ├── login/               # Pagina di accesso
│   ├── signup/              # Pagina di registrazione
│   ├── games-component/     # Lista paginata degli enigmi disponibili
│   ├── game-play/           # Schermata di gioco (tentativi, lightbox immagini, win/lose)
│   ├── leaderboard/         # Classifica globale
│   ├── navbar/              # Barra di navigazione
│   ├── footer/              # Footer
│   ├── enigma-card/         # Card riutilizzabile per un enigma nella lista
│   ├── user-stat-card/      # Card con le statistiche dell'utente loggato
│   ├── create-game-modal/   # Modal per la creazione di un nuovo enigma (con AI)
│   ├── app.routes.ts        # Definizione delle rotte Angular
│   └── app.config.ts        # Configurazione dell'applicazione (HTTP, interceptors)
├── environments/
│   ├── environment.ts       # Configurazione sviluppo (localhost:3000)
│   └── environment.prod.ts  # Configurazione produzione (Render)
├── styles.scss              # Stili globali e design system
└── index.html               # Entry point HTML
```

---

## 🔒 Sicurezza

Il progetto implementa diverse misure di sicurezza:

- **CORS configurabile** — Whitelist delle origini consentite tramite variabile d'ambiente `CORS_ORIGINS` (no wildcard `*`)
- **Header nascosti** — `X-Powered-By` disabilitato per non esporre la tecnologia server
- **`X-Content-Type-Options: nosniff`** — Aggiunto su tutte le risposte
- **Password hashate** — Bcrypt per l'hashing delle password
- **JWT Bearer** — Autenticazione stateless tramite token firmati
- **OWASP ZAP** — Test di sicurezza automatizzati inclusi nella suite di test

---

## 🧪 Test

### Test E2E (Playwright)

I test vengono eseguiti su **Chromium, Firefox e WebKit** in parallelo contro `http://localhost:4200`.

```bash
cd "test/test E2E"
npx playwright install   # solo la prima volta (scarica i browser)
npx playwright test

# Per visualizzare il report HTML
npx playwright show-report
```

### Test di Sicurezza (OWASP ZAP)

```bash
cd backend
npm run security
```

> Richiede Docker per avviare il container ZAP.

### Test Frontend

```bash
cd frontend
npm test
```
---

## 👤 Autore

Progetto sviluppato da **Differente Luigi** per il corso di Tecnologie Web — Università degli Studi di Napoli Federico II.

Il deploy del sito è stato effettuato su **Render** ed è disponibile al seguente indirizzo:

```
https://enigma-frontend-ssiz.onrender.com/
```