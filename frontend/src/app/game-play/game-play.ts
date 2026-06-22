import { Component, OnInit, inject, signal, computed, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PublicService, Partita } from '../_services/rest-backend/rest-backend.service';
import { GameService } from '../_services/rest-backend/game.service';
import { AuthService } from '../_services/auth/auth.service';

const MAX_TENTATIVI = 10;

export interface Tentativo {
  id: number;
  risposta: string;
  vincente: boolean;
  partitaId: number;
  utenteId: number;
}

@Component({
  selector: 'app-game-play',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './game-play.html',
  styleUrl: './game-play.scss'
})
export class GamePlayComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private publicSvc = inject(PublicService);
  private gameSvc = inject(GameService);
  readonly auth = inject(AuthService);

  // --- Caricamento partita ---
  game = signal<Partita | null>(null);
  loading = signal(true);
  loadError = signal<string | null>(null);

  // --- Stato di gioco ---
  tentativi = signal<Tentativo[]>([]);
  risposta = '';
  submitting = signal(false);
  submitError = signal<string | null>(null);

  // --- Computed ---
  tentativiRimasti = computed(() => MAX_TENTATIVI - this.tentativi().length);
  haVinto = computed(() => this.tentativi().some(t => t.vincente));
  haPerso = computed(() => !this.haVinto() && this.tentativiRimasti() <= 0);
  inGioco = computed(() => !this.haVinto() && !this.haPerso());
  activeModalImage = signal<string | null>(null);
  parolaSegreta = signal<string | null>(null);

  constructor() {
    // Quando l'utente perde, carica automaticamente la parola segreta
    effect(() => {
      if (this.haPerso()) {
        const gameId = this.game()?.id;
        if (gameId) {
          this.gameSvc.getSolution(gameId).subscribe({
            next: (res) => this.parolaSegreta.set(res.parola),
            error: () => this.parolaSegreta.set(null)
          });
        }
      }
    });
  }

  @ViewChild('rispostaInput') rispostaInput!: ElementRef<HTMLInputElement>;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (isNaN(id)) {
      this.router.navigate(['/games']);
      return;
    }
    this.loadGame(id);
  }

  private loadGame(id: number): void {
    this.loading.set(true);
    this.loadError.set(null);

    this.publicSvc.getGame(id).subscribe({
      next: (data) => {
        this.game.set(data);
        if (this.auth.isLoggedIn()) {
          this.gameSvc.getAttempts(id).subscribe({
            next: (attempts) => {
              this.tentativi.set(attempts);
              this.loading.set(false);
            },
            error: () => {
              // Anche se fallisce il caricamento dei tentativi, mostriamo comunque il gioco
              this.loading.set(false);
            }
          });
        } else {
          this.loading.set(false);
        }
      },
      error: (err) => {
        this.loadError.set(err?.error?.message ?? 'Enigma non trovato o non più attivo.');
        this.loading.set(false);
      }
    });
  }

  // --- Lightbox ---
  selectImage(url: string): void {
    this.activeModalImage.set(url);
  }

  closeLightbox(): void {
    this.activeModalImage.set(null);
  }

  // --- Gioco ---
  submitRisposta(): void {
    const r = this.risposta.trim();
    if (!r || this.submitting() || !this.inGioco()) return;
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    const gameId = this.game()?.id;
    if (!gameId) return;

    this.submitting.set(true);
    this.submitError.set(null);

    this.gameSvc.submitAttempt(gameId, r).subscribe({
      next: (tentativo) => {
        this.tentativi.update(list => [...list, tentativo]);
        this.risposta = '';
        this.submitting.set(false);
        this._focusInput();
      },
      error: (err) => {
        this.submitError.set(err?.error?.message ?? 'Errore nell\'invio della risposta.');
        this.submitting.set(false);
        this._focusInput();
      }
    });
  }

  private _focusInput(): void {
    setTimeout(() => this.rispostaInput?.nativeElement?.focus(), 0);
  }

  // --- Helpers ---
  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  tentativoClass(t: Tentativo): string {
    return t.vincente ? 'attempt--win' : 'attempt--fail';
  }

  readonly MAX_TENTATIVI = MAX_TENTATIVI;
}
