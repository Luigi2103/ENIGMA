import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

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

  private readonly apiUrl = environment.apiUrl;
  private http = inject(HttpClient);

  createGame(argomento?: string): Observable<CreatedGame> {
    const body = argomento ? { argomento } : {};
    return this.http.post<CreatedGame>(`${this.apiUrl}/games`, body);
  }

  submitAttempt(gameId: number, risposta: string): Observable<AttemptResult> {
    return this.http.post<AttemptResult>(
      `${this.apiUrl}/games/${gameId}/attempts`,
      { risposta }
    );
  }

  getAttempts(gameId: number): Observable<AttemptResult[]> {
    return this.http.get<AttemptResult[]>(`${this.apiUrl}/games/${gameId}/attempts`);
  }

  getSolution(gameId: number): Observable<{ parola: string }> {
    return this.http.get<{ parola: string }>(`${this.apiUrl}/games/${gameId}/solution`);
  }

  disableGame(gameId: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/games/${gameId}`, {});
  }
}
