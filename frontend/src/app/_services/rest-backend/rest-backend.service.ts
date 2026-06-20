import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

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

export interface PaginatedGames {
  data: Partita[];
  total: number;
  page: number;
  totalPages: number;
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

  private readonly apiUrl = environment.apiUrl;
  private http = inject(HttpClient);

  /**
   * GET /games?page=X&limit=Y – Lista paginata delle partite attive (pubblica)
   */
  getGames(page = 1, limit = 9): Observable<PaginatedGames> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get<PaginatedGames>(`${this.apiUrl}/games`, { params });
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
