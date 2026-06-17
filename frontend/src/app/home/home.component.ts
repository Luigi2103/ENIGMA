import { Component, OnInit, AfterViewInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PublicService, Partita, LeaderboardEntry } from '../_services/rest-backend/rest-backend.service';
import { AuthService } from '../_services/auth/auth.service';
import { GameService } from '../_services/rest-backend/game.service';
import { EnigmaCardComponent } from '../enigma-card/enigma-card.component';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink, FormsModule, EnigmaCardComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {

  private publicService = inject(PublicService);
  private gameService   = inject(GameService);
  readonly auth         = inject(AuthService);
  private router        = inject(Router);

  constructor() {
    effect(() => {
      // Re-trigger scroll animations observation when auth state changes (e.g., login/logout)
      // because new template blocks (guest vs dashboard) are inserted into the DOM.
      this.auth.isLoggedIn();
      setTimeout(() => this.initScrollAnimations(), 100);
    });
  }

  // --- Static ---
  readonly currentYear = new Date().getFullYear();

  // --- State condiviso ---
  games             = signal<Partita[]>([]);
  leaderboard       = signal<LeaderboardEntry[]>([]);
  gamesLoading      = signal(true);
  leaderboardLoading = signal(true);
  gamesError        = signal(false);
  leaderboardError  = signal(false);

  // --- Stat personali (solo se loggato) ---
  myGames    = computed(() =>
    this.games().filter(g => g.Utente?.username === this.auth.username())
  );
  myGamesCount = computed(() => this.myGames().length);
  mySolved   = computed(() => {
    const entry = this.leaderboard().find(e => e.Utente?.username === this.auth.username());
    return entry ? Number(entry.enigmi_risolti) : 0;
  });
  myRank     = computed(() => {
    const idx = this.leaderboard().findIndex(e => e.Utente?.username === this.auth.username());
    return idx >= 0 ? idx + 1 : null;
  });

  // --- Modal crea enigma ---
  showModal   = signal(false);
  creating    = signal(false);
  createError = signal<string | null>(null);
  argomento   = '';

  ngOnInit(): void {
    this.loadGames();
    this.loadLeaderboard();
  }

  ngAfterViewInit(): void {
    this.initScrollAnimations();
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  private loadGames(): void {
    this.publicService.getGames(1, 6).subscribe({
      next: (res) => {
        this.games.set(res.data);
        this.gamesLoading.set(false);
        setTimeout(() => this.initScrollAnimations(), 0);
      },
      error: () => {
        this.gamesError.set(true);
        this.gamesLoading.set(false);
      }
    });
  }

  private loadLeaderboard(): void {
    this.publicService.getLeaderboard().subscribe({
      next: (data) => {
        this.leaderboard.set(data.slice(0, 5));
        this.leaderboardLoading.set(false);
        setTimeout(() => this.makeLeaderboardVisible(), 100);
      },
      error: () => {
        this.leaderboardError.set(true);
        this.leaderboardLoading.set(false);
      }
    });
  }

  private makeLeaderboardVisible(): void {
    const section = document.getElementById('classifica');
    if (!section) return;
    section.querySelectorAll('.fade-in-up, .fade-in').forEach(el => el.classList.add('visible'));
  }

  private initScrollAnimations(): void {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.12 }
    );
    document.querySelectorAll('.fade-in-up, .fade-in').forEach(el => observer.observe(el));
  }

  // --- Modal ---
  openModal(): void {
    this.argomento = '';
    this.createError.set(null);
    this.showModal.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    if (this.creating()) return;
    this.showModal.set(false);
    document.body.style.overflow = '';
  }

  submitCreate(): void {
    if (this.creating()) return;
    this.creating.set(true);
    this.createError.set(null);
    this.gameService.createGame(this.argomento.trim() || undefined).subscribe({
      next: (partita) => {
        this.creating.set(false);
        this.closeModal();
        this.router.navigate(['/games', partita.id]);
      },
      error: (err) => {
        this.creating.set(false);
        this.createError.set(err?.error?.message ?? 'Errore durante la creazione. Riprova.');
      }
    });
  }

  // --- Helpers ---
  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  getGameImage(game: Partita): string | null {
    return game.foto && game.foto.length > 0 ? game.foto[0] : null;
  }

  getAvatarColor(index: number): string {
    const colors = [
      'linear-gradient(135deg, #f59e0b, #d97706)',
      'linear-gradient(135deg, #94a3b8, #64748b)',
      'linear-gradient(135deg, #b45309, #92400e)',
    ];
    return colors[index] ?? 'linear-gradient(135deg, #7c3aed, #9f67ff)';
  }

  getRankLabel(index: number): string {
    return ['Campione', 'Vicecampione', 'Terzo posto'][index] ?? `#${index + 1}`;
  }
}
