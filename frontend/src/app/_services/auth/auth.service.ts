import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface SignupRequest {
  username: string;
  password: string;
  email: string;
  nome?: string;
  cognome?: string;
}

export interface AuthResponse {
  token: string;
  username: string;
}

export interface SignupResponse {
  username: string;
  nome: string;
  cognome: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly apiUrl = environment.apiUrl;
  private http = inject(HttpClient);
  private router = inject(Router);

  // --- Stato reattivo ---
  private _token = signal<string | null>(localStorage.getItem('enigma_token'));
  private _username = signal<string | null>(localStorage.getItem('enigma_username'));

  readonly token = this._token.asReadonly();
  readonly username = this._username.asReadonly();
  readonly isLoggedIn = computed(() => this._token() !== null);

  // --- Login ---
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth`, credentials).pipe(
      tap(response => {
        this._token.set(response.token);
        this._username.set(response.username);
        localStorage.setItem('enigma_token', response.token);
        localStorage.setItem('enigma_username', response.username);
      })
    );
  }

  // --- Signup ---
  signup(data: SignupRequest): Observable<SignupResponse> {
    return this.http.post<SignupResponse>(`${this.apiUrl}/signup`, data);
  }

  // --- Logout ---
  logout(): void {
    this._token.set(null);
    this._username.set(null);
    localStorage.removeItem('enigma_token');
    localStorage.removeItem('enigma_username');
    this.router.navigate(['/']);
  }

  getToken(): string | null {
    return this._token();
  }
}
