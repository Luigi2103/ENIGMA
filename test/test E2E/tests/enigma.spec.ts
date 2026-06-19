import { test, expect } from '@playwright/test';

// Credenziali utente di test esistente nel DB
const TEST_USER = 'Luigi';
const TEST_PASSWORD = 'prova123';

// ============================================================
// WORKFLOW 1: Registrazione → Login con il nuovo account
// Simula un nuovo utente che si iscrive e poi accede
// ============================================================
test('Workflow 1 – Registrazione e accesso con il nuovo account', async ({ page }) => {
  const username = `mario.rossi_${Date.now()}`;
  const password = 'mario1234';

  // STEP 1: L'utente arriva sulla home e clicca Registrati
  await page.goto('http://localhost:4200/');
  await page.getByRole('link', { name: 'Registrati' }).click();
  await expect(page).toHaveURL(/signup/);

  // STEP 2: Compila il form di registrazione
  await page.getByRole('textbox', { name: 'Nome *', exact: true }).fill('Mario');
  await page.getByRole('textbox', { name: 'Cognome *' }).fill('Rossi');
  await page.getByRole('textbox', { name: 'Username *' }).fill(username);
  await page.getByRole('textbox', { name: 'Email *' }).fill(`${username}@mail.it`);
  await page.getByRole('textbox', { name: 'Password *', exact: true }).fill(password);
  await page.getByRole('textbox', { name: 'Conferma Password *' }).fill(password);
  await page.getByRole('textbox', { name: 'Conferma Password *' }).press('Enter');

  // STEP 3: Dopo la registrazione viene reindirizzato al login
  await expect(page).toHaveURL(/login/);

  // STEP 4: L'utente effettua il login con le credenziali appena create
  await page.getByRole('textbox', { name: 'Username' }).fill(username);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: ' Accedi' }).click();

  // STEP 5: Login riuscito → redirect fuori da /login
  await expect(page).not.toHaveURL(/login/);
});

// ============================================================
// WORKFLOW 2: Tentativo login errato → Correzione → Accesso
// Simula un utente che sbaglia la password e poi la corregge
// ============================================================
test('Workflow 2 – Login fallito poi riuscito dopo correzione', async ({ page }) => {
  // STEP 1: L'utente va alla pagina di login
  await page.goto('http://localhost:4200/');
  await page.locator('app-navbar').getByRole('link', { name: 'Accedi' }).click();
  await expect(page).toHaveURL(/login/);

  // STEP 2: Inserisce la password sbagliata
  await page.getByRole('textbox', { name: 'Username' }).fill(TEST_USER);
  await page.getByRole('textbox', { name: 'Password' }).fill('passwordSbagliata!');
  await page.getByRole('button', { name: ' Accedi' }).click();

  // STEP 3: Login fallito → resta su /login con errore
  await expect(page).toHaveURL(/login/);
  await expect(page.locator('[role="alert"].alert-box--error')).toBeVisible();

  // STEP 4: L'utente corregge la password e riprova
  await page.getByRole('textbox', { name: 'Password' }).clear();
  await page.getByRole('textbox', { name: 'Password' }).fill(TEST_PASSWORD);
  await page.getByRole('button', { name: ' Accedi' }).click();

  // STEP 5: Login riuscito → redirect fuori da /login
  await expect(page).not.toHaveURL(/login/);
});

// ============================================================
// WORKFLOW 3: Login → Navigazione tra le sezioni dell'app
// Simula un utente che esplora home, enigmi e classifica
// ============================================================
test('Workflow 3 – Login e navigazione tra le sezioni', async ({ page }) => {
  // STEP 1: Login
  await page.goto('http://localhost:4200/login');
  await page.getByRole('textbox', { name: 'Username' }).fill(TEST_USER);
  await page.getByRole('textbox', { name: 'Password' }).fill(TEST_PASSWORD);
  await page.getByRole('button', { name: ' Accedi' }).click();
  await expect(page).not.toHaveURL(/login/);

  // STEP 2: È sulla home, verifica che i contenuti siano visibili
  await expect(page).toHaveURL('http://localhost:4200/');

  // STEP 3: Naviga alla pagina Enigmi
  await page.locator('app-navbar').getByRole('link', { name: 'Enigmi' }).click();
  await expect(page).toHaveURL(/games/);

  // STEP 4: Verifica che le card degli enigmi siano caricate
  await expect(page.locator('app-enigma-card').first()).toBeVisible();

  // STEP 5: Naviga alla Classifica
  await page.locator('app-navbar').getByRole('link', { name: 'Classifica' }).click();
  await expect(page).toHaveURL(/leaderboard/);
});