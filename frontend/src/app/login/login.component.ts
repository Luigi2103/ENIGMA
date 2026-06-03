import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../_services/auth/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  // --- Password visibility toggle ---
  showPassword = signal(false);

  // --- Login form ---
  loginData = { username: '', password: '' };

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
}
