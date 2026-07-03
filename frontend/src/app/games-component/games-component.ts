import { Component, OnInit, OnDestroy, inject, signal, computed, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, timer } from 'rxjs';
import { PublicService, Partita, LeaderboardEntry } from '../_services/rest-backend/rest-backend.service';
import { AuthService } from '../_services/auth/auth.service';
import { GameService, CreatedGame } from '../_services/rest-backend/game.service';
import { EnigmaCardComponent } from '../enigma-card/enigma-card.component';

@Component({
  selector: 'app-games-component',
  imports: [CommonModule, RouterLink, FormsModule, EnigmaCardComponent],
  templateUrl: './games-component.html',
  styleUrl: './games-component.scss'
})
export class GamesComponent implements OnInit, OnDestroy {


  private publicService = inject(PublicService);
  private gameService = inject(GameService);
  readonly authService = inject(AuthService);
  private router = inject(Router);

  constructor() {
    effect(() => {
      const phase = this.creationPhase();
      if (phase === 'idle') return;
      Promise.resolve().then(() => {
        if (phase === 'waiting') this.playVideo(this.loadingVideoRef);
        else if (phase === 'success') this.playVideo(this.successVideoRef);
        else if (phase === 'error') this.playVideo(this.errorVideoRef);
      });
    });
  }

  games = signal<Partita[]>([]);
  loading = signal(true);
  error = signal(false);


  leaderboard = signal<LeaderboardEntry[]>([]);
  myRank = computed(() => {
    const lb = this.leaderboard();
    const idx = lb.findIndex(e => e.Utente?.username === this.authService.username());
    return idx >= 0 ? idx + 1 : null;
  });
  mySolved = computed(() => {
    const entry = this.leaderboard().find(e => e.Utente?.username === this.authService.username());
    return entry ? Number(entry.enigmi_risolti) : 0;
  });

  showModal = signal(false);
  creating = signal(false);
  creationPhase = signal<'idle' | 'waiting' | 'success' | 'error'>('idle');
  createError = signal<string | null>(null);
  argomento = '';
  createdPartita: CreatedGame | null = null;

  @ViewChild('loadingVideo') loadingVideoRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('successVideo') successVideoRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('errorVideo') errorVideoRef?: ElementRef<HTMLVideoElement>;

  searchQuery = '';

  // Paginazione
  readonly PAGE_SIZE = 9;
  currentPage = signal(1);
  totalPages = signal(1);
  totalGames = signal(0);
  pageNumbers = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));
  filteredGames = this.games;

  ngOnInit(): void {
    this.loadGames(1);
    if (this.authService.isLoggedIn()) {
      this.loadLeaderboard();
    }
    setTimeout(() => this.initScrollAnimations(), 0);
  }


  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }


  private loadGames(page: number = 1): void {
    this.loading.set(true);
    this.error.set(false);
    this.publicService.getGames(page, this.PAGE_SIZE).subscribe({
      next: (res) => {
        this.games.set(res.data);
        this.currentPage.set(res.page);
        this.totalPages.set(res.totalPages);
        this.totalGames.set(res.total);
        this.loading.set(false);
        setTimeout(() => this.initScrollAnimations(), 0);
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
      error: () => { }
    });
  }

  onSearch(): void {
    this.loadGames(1);
  }

  goToPage(page: number): void {
    const clamped = Math.max(1, Math.min(page, this.totalPages()));
    this.loadGames(clamped);
    setTimeout(() => {
      document.getElementById('games-grid-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }

  openModal(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/games' } });
      return;
    }
    this.argomento = '';
    this.createError.set(null);
    this.creationPhase.set('idle');
    this.createdPartita = null;
    this.showModal.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    if (this.creationPhase() === 'waiting') return;
    this.showModal.set(false);
    this.creationPhase.set('idle');
    document.body.style.overflow = '';
  }

  submitCreate(): void {
    if (this.creationPhase() === 'waiting' || this.creationPhase() === 'success') return;

    this.creating.set(true);
    this.creationPhase.set('waiting');
    this.createError.set(null);

    forkJoin({
      partita: this.gameService.createGame(this.argomento.trim() || undefined),
      delay: timer(3000)
    }).subscribe({
      next: ({ partita }) => {
        this.creating.set(false);
        this.createdPartita = partita;
        this.creationPhase.set('success');
      },
      error: (err) => {
        this.creating.set(false);
        this.creationPhase.set('error');
        this.createError.set(err?.error?.message ?? 'Errore durante la creazione. Riprova.');
      }
    });
  }


  /** Avvia un elemento video riportandolo all'inizio. */
  private playVideo(ref?: ElementRef<HTMLVideoElement>): void {
    const video = ref?.nativeElement;
    if (!video) return;
    video.muted = true;
    video.currentTime = 0;
    video.play().catch(() => { });
  }

  handleSuccessVideoEnded(): void {
    if (this.createdPartita) {
      const id = this.createdPartita.id;
      this.closeModal();
      this.router.navigate(['/games', id]);
    }
  }

  retry(): void {
    this.loadGames(this.currentPage());
  }

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
