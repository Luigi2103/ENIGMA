import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../_services/auth/auth.service';

@Component({
  selector: 'app-signup',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
})
export class SignupComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // --- Password visibility toggles ---
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  // --- Signup form data ---
  signupData = {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    nome: '',
    cognome: '',
  };

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
            `Account creato con successo! Bentornato, ${user.username}. Reindirizzamento…`
          );
          this.signupData = {
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
            nome: '',
            cognome: '',
          };
          setTimeout(() => this.router.navigateByUrl('/login'), 2500);
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
