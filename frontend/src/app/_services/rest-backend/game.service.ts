import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CreatedGame {
  id: number;
  argomento: string;
  suggerimento: string;
  utenteId: number;
  foto: string[];
}

export interface AttemptResult {
  id: number;
  risposta: string;
  vincente: boolean;
  partitaId: number;
  utenteId: number;
}

@Injectable({
  providedIn: 'root'
})
export class GameService {

  private readonly apiUrl = 'http://localhost:3000';
  private http = inject(HttpClient);

  /**
   * POST /games – Crea una nuova partita (richiede token JWT)
   */
  createGame(argomento?: string): Observable<CreatedGame> {
    const body = argomento ? { argomento } : {};
    return this.http.post<CreatedGame>(`${this.apiUrl}/games`, body);
  }

  /**
   * POST /games/:id/attempts – Invia un tentativo (richiede token JWT)
   */
  submitAttempt(gameId: number, risposta: string): Observable<AttemptResult> {
    return this.http.post<AttemptResult>(
      `${this.apiUrl}/games/${gameId}/attempts`,
      { risposta }
    );
  }

  /**
   * PATCH /games/:id – Disabilita/abbandona una partita (richiede token JWT)
   */
  disableGame(gameId: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/games/${gameId}`, {});
  }
}
