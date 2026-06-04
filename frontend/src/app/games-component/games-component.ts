import { Component, OnInit, AfterViewInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PublicService, Partita, LeaderboardEntry } from '../_services/rest-backend/rest-backend.service';
import { AuthService } from '../_services/auth/auth.service';
import { GameService } from '../_services/rest-backend/game.service';

@Component({
  selector: 'app-games-component',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './games-component.html',
  styleUrl: './games-component.scss'
})
export class GamesComponent implements OnInit, AfterViewInit {

  private publicService = inject(PublicService);
  private gameService   = inject(GameService);
  readonly authService  = inject(AuthService);
  private router        = inject(Router);

  // --- State ---
  games          = signal<Partita[]>([]);
  loading        = signal(true);
  error          = signal(false);

  // --- Stat personali (calcolate dalla lista pubblica) ---
  myGames        = computed(() =>
    this.games().filter(g => g.Utente?.username === this.authService.username())
  );
  myGamesCount   = computed(() => this.myGames().length);

  // --- Leaderboard rank ---
  leaderboard    = signal<LeaderboardEntry[]>([]);
  myRank         = computed(() => {
    const lb = this.leaderboard();
    const idx = lb.findIndex(e => e.Utente?.username === this.authService.username());
    return idx >= 0 ? idx + 1 : null;
  });
  mySolved       = computed(() => {
    const entry = this.leaderboard().find(e => e.Utente?.username === this.authService.username());
    return entry ? Number(entry.enigmi_risolti) : 0;
  });

  // --- Modal crea enigma ---
  showModal      = signal(false);
  creating       = signal(false);
  createError    = signal<string | null>(null);
  argomento      = '';

  // --- Filtro ---
  searchQuery    = '';
  filteredGames  = signal<Partita[]>([]);

  ngOnInit(): void {
    this.loadGames();
    if (this.authService.isLoggedIn()) {
      this.loadLeaderboard();
    }
  }

  ngAfterViewInit(): void {
    this.initScrollAnimations();
  }

  private loadGames(): void {
    this.loading.set(true);
    this.error.set(false);
    this.publicService.getGames().subscribe({
      next: (data) => {
        this.games.set(data);
        this.filteredGames.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }

  private loadLeaderboard(): void {
    this.publicService.getLeaderboard().subscribe({
      next: (data) => this.leaderboard.set(data),
      error: () => { /* silent */ }
    });
  }

  onSearch(): void {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) {
      this.filteredGames.set(this.games());
    } else {
      this.filteredGames.set(
        this.games().filter(g =>
          g.argomento.toLowerCase().includes(q) ||
          g.suggerimento.toLowerCase().includes(q) ||
          (g.Utente?.username ?? '').toLowerCase().includes(q)
        )
      );
    }
  }

  // --- Modal ---
  openModal(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/games' } });
      return;
    }
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

  retry(): void {
    this.loadGames();
  }

  // --- Helpers ---
  getGameImage(game: Partita): string | null {
    return game.foto && game.foto.length > 0 ? game.foto[0] : null;
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('it-IT', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  }

  private initScrollAnimations(): void {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.1 }
    );
    document.querySelectorAll('.fade-in-up, .fade-in').forEach(el => observer.observe(el));
  }
}
