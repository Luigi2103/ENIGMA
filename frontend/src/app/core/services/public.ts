import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// --- Interfacce modello ---
export interface Partita {
  id: number;
  argomento: string;
  suggerimento: string;
  foto: string[];
  utenteId: number;
  createdAt: string;
  Utente: { username: string };
}

export interface LeaderboardEntry {
  utenteId: number;
  enigmi_risolti: string; // PostgreSQL COUNT restituisce stringa
  Utente: { username: string };
}

@Injectable({
  providedIn: 'root'
})
export class PublicService {

  private readonly apiUrl = 'http://localhost:3000';
  private http = inject(HttpClient);

  /**
   * GET /games – Lista di tutte le partite attive (pubblica)
   */
  getGames(): Observable<Partita[]> {
    return this.http.get<Partita[]>(`${this.apiUrl}/games`);
  }

  /**
   * GET /games/:id – Dettaglio singola partita (pubblica)
   */
  getGame(id: number): Observable<Partita> {
    return this.http.get<Partita>(`${this.apiUrl}/games/${id}`);
  }

  /**
   * GET /leaderboard – Classifica utenti (pubblica)
   */
  getLeaderboard(): Observable<LeaderboardEntry[]> {
    return this.http.get<LeaderboardEntry[]>(`${this.apiUrl}/leaderboard`);
  }
}
