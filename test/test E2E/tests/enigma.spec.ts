import { test, expect, type Page } from '@playwright/test';

const TEST_USER = 'admin';
const TEST_PASSWORD = 'admin';
const MOCK_TOKEN = 'mock-token-e2e';

// ─── Helper condivisi ────────────────────────────────────────────────────────

/**
 * Genera uno username univoco, resistente anche a run in parallelo
 * (Date.now() da solo può collidere se più worker partono nello stesso ms).
 */
function uniqueUsername(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Mocka POST /auth in modo che il frontend riceva un token valido senza
 * bisogno che l'utente TEST_USER esista nel database.
 * Le richieste autenticate al backend reale vengono comunque moccate
 * dai singoli workflow che ne hanno bisogno (mockPostGames, mockGamePlay).
 */
async function mockAuth(page: Page): Promise<void> {
  await page.route('**/auth', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: MOCK_TOKEN, username: TEST_USER })
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Esegue il login simulando il form: usa il mock sull'endpoint /auth
 * in modo da non dipendere dall'utente nel database.
 */
async function loginAs(page: Page): Promise<void> {
  await mockAuth(page);
  await page.goto('http://localhost:4200/login');
  await page.getByRole('textbox', { name: 'Username' }).fill(TEST_USER);
  await page.getByRole('textbox', { name: 'Password' }).fill(TEST_PASSWORD);
  await page.getByRole('button', { name: ' Accedi' }).click();
  await expect(page).not.toHaveURL(/login/);
}

/**
 * Mocka la POST /games (che internamente chiama le API Google Gemini/Imagen).
 * Le GET verso /games vengono lasciate passare normalmente.
 * @param status  Codice HTTP da restituire (es. 201 per successo, 500 per errore)
 * @param body    Corpo JSON della risposta mockata
 */
async function mockPostGames(page: Page, status: number, body: object): Promise<void> {
  await page.route('**/games', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    } else {
      await route.continue();
    }
  });
}

/**
 * Mocka GET /games/:id (dettaglio partita) e GET+POST /games/:id/attempts.
 * @param gameId        ID fittizio della partita da usare nell'URL
 * @param winAtAttempt  Se specificato, il tentativo N-esimo restituirà vincente: true
 */
async function mockGamePlay(page: Page, gameId: number, winAtAttempt?: number): Promise<void> {
  let attemptCounter = 0;

  await page.route(`**/games/${gameId}**`, async (route) => {
    const url = route.request().url();

    // Lascia passare le richieste verso il frontend Angular (porta 4200);
    // il mock deve intercettare solo le chiamate al backend REST (porta 3000)
    if (!url.includes('localhost:3000')) {
      await route.continue();
      return;
    }

    const method = route.request().method();

    if (url.endsWith('/attempts')) {
      if (method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      } else {
        attemptCounter++;
        const vincente = winAtAttempt !== undefined && attemptCounter === winAtAttempt;
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: attemptCounter,
            risposta: vincente ? 'risposta_corretta' : `risposta_errata_${attemptCounter}`,
            vincente,
            partitaId: gameId,
            utenteId: 1
          })
        });
      }
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: gameId,
          argomento: 'Test E2E',
          suggerimento: 'Un indizio generato dal mock',
          foto: [],
          utenteId: 1,
          createdAt: new Date().toISOString(),
          Utente: { username: TEST_USER }
        })
      });
    }
  });
}

/**
 * Compila e invia il form di signup con i dati forniti.
 */
async function fillSignupForm(
  page: Page,
  data: { nome: string; cognome: string; username: string; email: string; password: string; confermaPassword: string }
): Promise<void> {
  await page.getByRole('textbox', { name: 'Nome *', exact: true }).fill(data.nome);
  await page.getByRole('textbox', { name: 'Cognome *' }).fill(data.cognome);
  await page.getByRole('textbox', { name: 'Username *' }).fill(data.username);
  await page.getByRole('textbox', { name: 'Email *' }).fill(data.email);
  await page.getByRole('textbox', { name: 'Password *', exact: true }).fill(data.password);
  await page.getByRole('textbox', { name: 'Conferma Password *' }).fill(data.confermaPassword);
}

// ─── Test ────────────────────────────────────────────────────────────────────

test('Workflow 1 – Registrazione e accesso con il nuovo account', async ({ page }) => {
  const username = uniqueUsername('mario.rossi');
  const password = 'mario1234';

  await page.goto('http://localhost:4200/');
  await page.getByRole('link', { name: 'Registrati' }).click();
  await expect(page).toHaveURL(/signup/);

  await fillSignupForm(page, {
    nome: 'Mario',
    cognome: 'Rossi',
    username,
    email: `${username}@mail.it`,
    password,
    confermaPassword: password
  });
  await page.getByRole('textbox', { name: 'Conferma Password *' }).press('Enter');

  await expect(page).toHaveURL(/login/);

  await page.getByRole('textbox', { name: 'Username' }).fill(username);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: ' Accedi' }).click();

  await expect(page).not.toHaveURL(/login/);
});

test('Workflow 2 – Login fallito poi riuscito dopo correzione', async ({ page }) => {
  let authCallCount = 0;
  await page.route('**/auth', async (route) => {
    if (route.request().method() === 'POST') {
      authCallCount++;
      if (authCallCount === 1) {
        await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ code: 401, description: 'Credenziali non valide' }) });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ token: MOCK_TOKEN, username: TEST_USER }) });
      }
    } else {
      await route.continue();
    }
  });

  await page.goto('http://localhost:4200/');
  await page.locator('app-navbar').getByRole('link', { name: 'Accedi' }).click();
  await expect(page).toHaveURL(/login/);

  await page.getByRole('textbox', { name: 'Username' }).fill(TEST_USER);
  await page.getByRole('textbox', { name: 'Password' }).fill('passwordSbagliata!');
  await page.getByRole('button', { name: ' Accedi' }).click();

  await expect(page).toHaveURL(/login/);
  await expect(page.locator('[role="alert"].alert-box--error')).toBeVisible();

  await page.getByRole('textbox', { name: 'Password' }).clear();
  await page.getByRole('textbox', { name: 'Password' }).fill(TEST_PASSWORD);
  await page.getByRole('button', { name: ' Accedi' }).click();

  await expect(page).not.toHaveURL(/login/);
});

test('Workflow 3 – Login e navigazione tra le sezioni', async ({ page }) => {
  await loginAs(page);

  await expect(page).toHaveURL('http://localhost:4200/');

  await page.locator('app-navbar').getByRole('link', { name: 'Enigmi' }).click();
  await expect(page).toHaveURL(/games/);

  await expect(page.locator('app-enigma-card').first()).toBeVisible();

  await page.locator('app-navbar').getByRole('link', { name: 'Classifica' }).click();
  await expect(page).toHaveURL(/leaderboard/);
});

test('Workflow 4 – Login e creazione di un enigma', async ({ page }) => {
  const MOCK_GAME_ID = 42;

  await mockPostGames(page, 201, {
    id: MOCK_GAME_ID,
    argomento: 'Spazio',
    suggerimento: 'Questo è un indizio generato dal mock',
    utenteId: 1,
    foto: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/The_Earth_seen_from_Apollo_17.jpg/800px-The_Earth_seen_from_Apollo_17.jpg'
    ]
  });

  await loginAs(page);

  await page.goto('http://localhost:4200/games');
  await expect(page).toHaveURL(/games/);

  await page.locator('#btn-create-topbar').click();
  await expect(page.locator('[role="dialog"]')).toBeVisible();
  await expect(page.locator('#modal-title')).toHaveText('Genera un nuovo Enigma');

  await page.locator('button.chip', { hasText: 'Spazio' }).click();
  await page.locator('#btn-submit-create').click();

  await expect(page.locator('.modal-waiting-title')).toBeVisible();
  await expect(page.locator('.modal-waiting-title')).toHaveText('Plasmando l\'Enigma...');

  await expect(page.locator('.modal-success-title')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('.modal-success-title')).toHaveText('Enigma Creato!');

  await page.locator('.modal-success-container button', { hasText: 'Gioca Ora' }).click();
  await expect(page).toHaveURL(new RegExp(`/games/${MOCK_GAME_ID}`));
});

test('Workflow 5 – Login e creazione enigma fallita', async ({ page }) => {
  const ERROR_MESSAGE = 'Il servizio AI non è al momento disponibile. Riprova più tardi.';

  await mockPostGames(page, 500, { message: ERROR_MESSAGE });

  await loginAs(page);

  await page.goto('http://localhost:4200/games');
  await expect(page).toHaveURL(/games/);

  await page.locator('#btn-create-topbar').click();
  await expect(page.locator('[role="dialog"]')).toBeVisible();

  await page.locator('button.chip', { hasText: 'Natura' }).click();
  await page.locator('#btn-submit-create').click();

  // Il mock risponde istantaneamente → Angular può saltare il frame "waiting";
  // aspettiamo direttamente la fase "error" con timeout esteso
  await expect(page.locator('.modal-title', { hasText: 'Generazione Fallita' })).toBeVisible({ timeout: 10000 });
  await expect(page.locator('.modal-error-box')).toContainText(ERROR_MESSAGE);

  await page.locator('.modal-footer button', { hasText: 'Riprova' }).click();
  await expect(page.locator('#modal-title')).toHaveText('Genera un nuovo Enigma');
  await expect(page.locator('#btn-submit-create')).toBeVisible();

  await page.locator('.modal-footer button', { hasText: 'Annulla' }).click();
  await expect(page.locator('[role="dialog"]')).not.toBeVisible();

  await expect(page).toHaveURL(/games/);
  await expect(page).not.toHaveURL(/games\/\d+/);
});


test('Workflow 6 – Login e esaurimento tentativi', async ({ page }) => {
  const MOCK_GAME_ID = 9999;

  await mockGamePlay(page, MOCK_GAME_ID);
  await loginAs(page);

  await page.goto(`http://localhost:4200/games/${MOCK_GAME_ID}`);
  await expect(page.locator('.gp-clue__text')).toBeVisible();

  for (let i = 1; i <= 9; i++) {
    await page.locator('#risposta-input').fill(`risposta_errata_${i}`);
    await page.locator('#btn-submit-risposta').click();
    await expect(page.locator('.gp-attempt')).toHaveCount(i);
  }


  await page.locator('#risposta-input').fill('risposta_errata_10');
  await page.locator('#btn-submit-risposta').click();

  await expect(page.locator('.gp-state-card--lose')).toBeVisible();
  await expect(page.locator('.gp-state-card--lose h2')).toHaveText('Tentativi Esauriti');
  await expect(page.locator('#risposta-input')).not.toBeVisible();

  await page.locator('#btn-lose-leaderboard').click();
  await expect(page).toHaveURL(/leaderboard/);
});

test('Workflow 7 – Login, vittoria al gioco e uscita dalla pagina', async ({ page }) => {
  const MOCK_GAME_ID = 9998;

  await mockGamePlay(page, MOCK_GAME_ID, 3);
  await loginAs(page);

  await page.goto(`http://localhost:4200/games/${MOCK_GAME_ID}`);
  await expect(page.locator('.gp-clue__text')).toBeVisible();

  await page.locator('#risposta-input').fill('risposta_errata_1');
  await page.locator('#btn-submit-risposta').click();
  await expect(page.locator('.gp-attempt')).toHaveCount(1);

  await page.locator('#risposta-input').fill('risposta_errata_2');
  await page.locator('#btn-submit-risposta').click();
  await expect(page.locator('.gp-attempt')).toHaveCount(2);

  await page.locator('#risposta-input').fill('risposta_corretta');
  await page.locator('#btn-submit-risposta').click();

  await expect(page.locator('.gp-state-card--win')).toBeVisible();
  await expect(page.locator('.gp-state-card--win h2')).toHaveText('Hai vinto!');
  await expect(page.locator('#risposta-input')).not.toBeVisible();

  await page.locator('#btn-win-back').click();
  await expect(page).toHaveURL(/\/games$/);
  await expect(page).not.toHaveURL(new RegExp(`/games/${MOCK_GAME_ID}`));
});

test('Workflow 8 – Login e logout', async ({ page }) => {
  await loginAs(page);
  await expect(page).toHaveURL('http://localhost:4200/');

  await page.locator('#btn-navbar-logout').click();

  await expect(page.locator('app-navbar').getByRole('link', { name: 'Accedi' })).toBeVisible();
  await expect(page.locator('app-navbar').getByRole('link', { name: 'Registrati' })).toBeVisible();
  await expect(page.locator('#btn-navbar-logout')).not.toBeVisible();


  await page.goto('http://localhost:4200/games');
  await expect(page.locator('#btn-create-topbar')).not.toBeVisible();
});

test('Workflow 9 – Registrazione fallita', async ({ page }) => {
  // 9a) Password non coincidenti → errore di validazione lato form
  await page.goto('http://localhost:4200/signup');

  await fillSignupForm(page, {
    nome: 'Mario',
    cognome: 'Rossi',
    username: 'mario_test_pw',
    email: 'mario_test_pw@mail.it',
    password: 'password123',
    confermaPassword: 'passwordDiversa'
  });
  await page.locator('#btn-signup-submit').click();

  await expect(page.locator('.alert-box--error')).toBeVisible();
  await expect(page.locator('.alert-box--error')).toContainText('Le password non coincidono.');
  await expect(page).toHaveURL(/signup/);

  const dupUsername = uniqueUsername('luigi_dup');
  const dupEmail1 = `${dupUsername}_a@mail.it`;
  const dupEmail2 = `${dupUsername}_b@mail.it`;

  // Prima registrazione: deve andare a buon fine
  await page.goto('http://localhost:4200/signup');
  await fillSignupForm(page, {
    nome: 'Luigi',
    cognome: 'Duplicato',
    username: dupUsername,
    email: dupEmail1,
    password: 'prova123',
    confermaPassword: 'prova123'
  });
  await page.locator('#btn-signup-submit').click();
  await expect(page).toHaveURL(/login/);

  // Seconda registrazione con lo stesso username: deve fallire
  await page.goto('http://localhost:4200/signup');
  await fillSignupForm(page, {
    nome: 'Luigi',
    cognome: 'Duplicato',
    username: dupUsername,
    email: dupEmail2,
    password: 'prova123',
    confermaPassword: 'prova123'
  });
  await page.locator('#btn-signup-submit').click();

  await expect(page.locator('.alert-box--error')).toBeVisible();
  await expect(page).toHaveURL(/signup/);
});

test('Workflow 10 – Utente guest visita un enigma e viene bloccato', async ({ page }) => {
  await page.goto('http://localhost:4200/games/1');

  await expect(page.locator('.gp-clue__text')).toBeVisible();

  await expect(page.locator('.gp-state-card--locked')).toBeVisible();
  await expect(page.locator('.gp-state-card--locked h2')).toHaveText('Accedi per giocare');
  await expect(page.locator('#risposta-input')).not.toBeVisible();

  await expect(page.locator('#btn-play-login')).toBeVisible();
  await expect(page.locator('#btn-play-signup')).toBeVisible();


  await page.locator('#btn-play-login').click();
  await expect(page).toHaveURL(/login/);
});