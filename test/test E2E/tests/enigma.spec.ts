import { test, expect, type Page } from '@playwright/test';


const BACKEND_URL = 'http://localhost:3000';

/** Credenziali dell'utente creato appositamente per i test E2E nel DB reale. */
const E2E_USER = {
  username: `e2e_testuser_${Date.now()}`,
  password: 'E2ePassword123!',
  nome: 'E2E',
  cognome: 'Testuser',
  email: `e2e_test_${Date.now()}@playwright.local`,
  token: ""
};



//prima dell'inizio dei WF viene creato un utente fittizio per i wf che necessitano di un login reale
test.beforeAll(async ({ request }) => {
  const res = await request.post(`${BACKEND_URL}/signup`, {
    data: {
      username: E2E_USER.username,
      password: E2E_USER.password,
      nome: E2E_USER.nome,
      cognome: E2E_USER.cognome,
      email: E2E_USER.email,
    },

  });
  if (!res.ok()) {
    throw new Error(
      `[E2E setup] Impossibile creare l'utente di prova: ${res.status()} ${await res.text()}`
    );
  }

  const authRes = await request.post(`${BACKEND_URL}/auth`, {
    data: { username: E2E_USER.username, password: E2E_USER.password },
  });

  if (authRes.ok()) {
    E2E_USER.token = (await authRes.json()).token;
  }

  console.log(`[E2E setup] Utente '${E2E_USER.username}' creato nel DB.`);
});


test.afterAll(async ({ request }) => {
  const deleteRes = await request.delete(`${BACKEND_URL}/users/${E2E_USER.username}`, {
    headers: { Authorization: `Bearer ${E2E_USER.token}` },
  });
  if (deleteRes.ok()) {
    console.log(`[E2E teardown] Utente '${E2E_USER.username}' eliminato dal DB.`);
  } else {
    console.warn(`[E2E teardown] Cleanup fallito: ${deleteRes.status()} ${await deleteRes.text()}`);
  }
});

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
      //intercetta la richiesta col metodo POST
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: E2E_USER.token, username: E2E_USER.username })
      });
      //le altre richieste passano
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
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Username' }).fill(E2E_USER.username);
  await page.getByRole('textbox', { name: 'Password' }).fill(E2E_USER.password);
  await page.getByRole('button', { name: ' Accedi' }).click();
  await expect(page).not.toHaveURL(/login/);
}

/**
 * Esegue il login con l'utente E2E reale (nessun mock): usa le credenziali
 * dell'utente creato in beforeAll e interagisce col backend reale.
 * Da usare nei test che necessitano di uno stato DB autentico.
 */
async function loginAsReal(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Username' }).fill(E2E_USER.username);
  await page.getByRole('textbox', { name: 'Password' }).fill(E2E_USER.password);
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
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(body)
      });
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

  await page.route(`http://localhost:3000/games/${gameId}**`, async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url.endsWith('/attempts')) {
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: '[]'
        });
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
          Utente: { username: E2E_USER.username }
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

  await page.goto('/');
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

  //testiamo l'invio da tastiera
  await page.getByRole('textbox', { name: 'Conferma Password *' }).press('Enter');

  await expect(page).toHaveURL(/login/);

  await page.getByRole('textbox', { name: 'Username' }).fill(username);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: ' Accedi' }).click();

  await expect(page).not.toHaveURL(/login/);

  // cleanup: elimina l'utente creato durante questo test
  const authRes = await page.request.post(`${BACKEND_URL}/auth`, { data: { username, password } });
  if (authRes.ok()) {
    const { token } = await authRes.json();
    await page.request.delete(`${BACKEND_URL}/users/${username}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
});

test('Workflow 2 – Login fallito poi riuscito dopo correzione', async ({ page }) => {
  let authCallCount = 0;

  await page.route('**/auth', async (route) => {
    if (route.request().method() === 'POST') {
      authCallCount++;
      if (authCallCount === 1) {
        await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ code: 401, description: 'Credenziali non valide' }) });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ token: E2E_USER.token, username: E2E_USER.username }) });
      }
    } else {
      await route.continue();
    }
  });

  await page.goto('/');
  await page.locator('app-navbar').getByRole('link', { name: 'Accedi' }).click();
  await expect(page).toHaveURL(/login/);

  await page.getByRole('textbox', { name: 'Username' }).fill(E2E_USER.username);
  await page.getByRole('textbox', { name: 'Password' }).fill('passwordSbagliata');
  await page.getByRole('button', { name: ' Accedi' }).click();

  await expect(page).toHaveURL(/login/);
  await expect(page.locator('[role="alert"].alert-box--error')).toBeVisible();

  await page.getByRole('textbox', { name: 'Password' }).clear();
  await page.getByRole('textbox', { name: 'Password' }).fill(E2E_USER.password);
  await page.getByRole('button', { name: ' Accedi' }).click();

  await expect(page).not.toHaveURL(/login/);
});

test('Workflow 3 – Login e navigazione tra le sezioni', async ({ page }) => {
  await loginAs(page);

  await expect(page).toHaveURL('/');

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

  await page.goto('/games');
  await expect(page).toHaveURL(/games/);

  await page.locator('#btn-create-topbar').click();
  await expect(page.locator('[role="dialog"]')).toBeVisible();
  await expect(page.locator('#modal-title')).toHaveText('Genera un nuovo Enigma');

  await page.locator('button.chip', { hasText: 'Spazio' }).click();
  await page.locator('#btn-submit-create').click();

  await expect(page.locator('.modal-success-title')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('.modal-success-title')).toHaveText('Enigma Creato!');

  await page.locator('.modal-success-container button', { hasText: 'Gioca Ora' }).click();
  await expect(page).toHaveURL(new RegExp(`/games/${MOCK_GAME_ID}`));
});

test('Workflow 5 – Login e creazione enigma fallita', async ({ page }) => {
  const ERROR_MESSAGE = 'Il servizio AI non è al momento disponibile. Riprova più tardi.';

  await mockPostGames(page, 500, { message: ERROR_MESSAGE });

  await loginAs(page);

  await page.goto('/games');
  await expect(page).toHaveURL(/games/);

  await page.locator('#btn-create-topbar').click();
  await expect(page.locator('[role="dialog"]')).toBeVisible();
  await expect(page.locator('#modal-title')).toHaveText('Genera un nuovo Enigma');

  await page.locator('button.chip', { hasText: 'Spazio' }).click();
  await page.locator('#btn-submit-create').click();

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


test('Workflow 6 – Esaurimento tentativi', async ({ page }) => {
  const MOCK_GAME_ID = 9999;

  await mockGamePlay(page, MOCK_GAME_ID);
  await loginAs(page);

  await page.goto(`/games/${MOCK_GAME_ID}`);
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

  await page.goto(`/games/${MOCK_GAME_ID}`);
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
  await expect(page).toHaveURL('/');

  await page.locator('#btn-navbar-logout').click();

  await expect(page.locator('app-navbar').getByRole('link', { name: 'Accedi' })).toBeVisible();
  await expect(page.locator('app-navbar').getByRole('link', { name: 'Registrati' })).toBeVisible();
  await expect(page.locator('#btn-navbar-logout')).not.toBeVisible();


  await page.goto('/games');
  await expect(page.locator('#btn-create-topbar')).not.toBeVisible();
});

test('Workflow 9 – Registrazione fallita', async ({ page }) => {
  await page.goto('/signup');
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
  await page.goto('/signup');
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
  await page.goto('/signup');
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

  // cleanup: elimina l'utente dupUsername creato durante questo test
  const authRes = await page.request.post(`${BACKEND_URL}/auth`, { data: { username: dupUsername, password: 'prova123' } });
  if (authRes.ok()) {
    const { token } = await authRes.json();
    await page.request.delete(`${BACKEND_URL}/users/${dupUsername}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
});

test('Workflow 10 – Utente guest visita un enigma e viene bloccato', async ({ page }) => {
  await page.goto('/games/1');

  await expect(page.locator('.gp-clue__text')).toBeVisible();

  await expect(page.locator('.gp-state-card--locked')).toBeVisible();
  await expect(page.locator('.gp-state-card--locked h2')).toHaveText('Accedi per giocare');
  await expect(page.locator('#risposta-input')).not.toBeVisible();

  await expect(page.locator('#btn-play-login')).toBeVisible();
  await expect(page.locator('#btn-play-signup')).toBeVisible();


  await page.locator('#btn-play-login').click();
  await expect(page).toHaveURL(/login/);
});

/**
 * Workflow 11 – Login reale con l'utente E2E e navigazione.
 *
 * Questo test usa `loginAsReal`: nessun mock, credenziali vere nel DB.
 * Dimostra come usare l'utente creato in beforeAll per test che richiedono
 * un'autenticazione autentica (es. interazioni che lasciano traccia nel DB).
 */
test('Workflow 11 – Login reale con utente E2E e navigazione base', async ({ page }) => {
  await loginAsReal(page);

  await expect(page).toHaveURL('/');

  // L'utente reale vede la dashboard con il proprio username
  await expect(page.locator('app-home')).toBeVisible();

  await page.locator('app-navbar').getByRole('link', { name: 'Enigmi' }).click();
  await expect(page).toHaveURL(/games/);

  // L'utente loggato vede il pulsante "Crea" nella topbar
  await expect(page.locator('#btn-create-topbar')).toBeVisible();

  await page.locator('#btn-navbar-logout').click();
  await expect(page.locator('app-navbar').getByRole('link', { name: 'Accedi' })).toBeVisible();
});