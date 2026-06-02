import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../_services/auth/auth.service';
import { ElementRef, ViewChild } from '@angular/core';

type TabMode = 'login' | 'signup';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  activeTab = signal<TabMode>('login');
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // --- Password visibility toggles ---
  showLoginPassword = signal(false);
  showSignupPassword = signal(false);
  showConfirmPassword = signal(false);

  // --- Login form ---
  loginData = { username: '', password: '' };

  // --- Signup form ---
  signupData = {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    nome: '',
    cognome: '',
  };

  setTab(tab: TabMode): void {
    this.activeTab.set(tab);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    // Reset password visibility quando si cambia tab
    this.showLoginPassword.set(false);
    this.showSignupPassword.set(false);
    this.showConfirmPassword.set(false);
  }


  focusNext(event: Event, nextId: string | null): void {
    event.preventDefault();
    if (nextId) {
      const el = document.getElementById(nextId) as HTMLElement | null;
      el?.focus();
    } else {
      const form = (event.target as HTMLElement).closest('form') as HTMLFormElement | null;
      form?.requestSubmit();
    }
  }

  onLogin(): void {
    if (!this.loginData.username || !this.loginData.password) {
      this.errorMessage.set('Inserisci username e password.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.loginData).subscribe({
      next: () => {
        this.isLoading.set(false);
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err.status === 401
            ? 'Credenziali non valide. Riprova.'
            : 'Errore di connessione al server.'
        );
      },
    });
  }

  onSignup(): void {
    this.errorMessage.set(null);

    if (
      !this.signupData.username ||
      !this.signupData.email ||
      !this.signupData.password
    ) {
      this.errorMessage.set('Compila tutti i campi obbligatori.');
      return;
    }

    if (this.signupData.password !== this.signupData.confirmPassword) {
      this.errorMessage.set('Le password non coincidono.');
      return;
    }

    this.isLoading.set(true);

    this.authService
      .signup({
        username: this.signupData.username,
        email: this.signupData.email,
        password: this.signupData.password,
        nome: this.signupData.nome || undefined,
        cognome: this.signupData.cognome || undefined,
      })
      .subscribe({
        next: (user) => {
          this.isLoading.set(false);
          this.successMessage.set(
            `Account creato con successo! Bentornato, ${user.username}. Accedi ora.`
          );
          this.signupData = {
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
            nome: '',
            cognome: '',
          };
          setTimeout(() => this.setTab('login'), 2500);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(
            err.error?.description || err.error?.message || 'Errore durante la registrazione.'
          );
        },
      });
  }
}
