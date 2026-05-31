import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  // TODO: implementare la logica di autenticazione
  // Esempio: verificare se l'utente è loggato tramite AuthService
  return true;
};
