import { Component, OnInit, AfterViewInit, OnDestroy, inject, signal, computed, effect, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, timer } from 'rxjs';
import { PublicService, Partita, LeaderboardEntry } from '../_services/rest-backend/rest-backend.service';
import { AuthService } from '../_services/auth/auth.service';
import { GameService, CreatedGame } from '../_services/rest-backend/game.service';
import { EnigmaCardComponent } from '../enigma-card/enigma-card.component';
import { UserStatCardComponent } from '../user-stat-card/user-stat-card.component';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink, FormsModule, EnigmaCardComponent, UserStatCardComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {

  private publicService = inject(PublicService);
  private gameService = inject(GameService);
  readonly auth = inject(AuthService);
  private router = inject(Router);

  @ViewChild('homeLoadingVideo') loadingVideoRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('homeSuccessVideo') successVideoRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('homeErrorVideo')   errorVideoRef?: ElementRef<HTMLVideoElement>;

  constructor() {
    effect(() => {
      this.auth.isLoggedIn();
      setTimeout(() => this.initScrollAnimations(), 100);
    });
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
  leaderboard = signal<LeaderboardEntry[]>([]);
  gamesLoading = signal(true);
  leaderboardLoading = signal(true);
  gamesError = signal(false);
  leaderboardError = signal(false);

  mySolved = computed(() => {
    const entry = this.leaderboard().find(e => e.Utente?.username === this.auth.username());
    return entry ? Number(entry.enigmi_risolti) : 0;
  });
  myRank = computed(() => {
    const idx = this.leaderboard().findIndex(e => e.Utente?.username === this.auth.username());
    return idx >= 0 ? idx + 1 : null;
  });

  showModal = signal(false);
  creationPhase = signal<'idle' | 'waiting' | 'success' | 'error'>('idle');
  createError = signal<string | null>(null);
  argomento = '';
  createdPartita: CreatedGame | null = null;

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

  openModal(): void {
    this.argomento = '';
    this.createError.set(null);
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
    this.creationPhase.set('waiting');
    this.createError.set(null);
    forkJoin({
      partita: this.gameService.createGame(this.argomento.trim() || undefined),
      delay: timer(3000)
    }).subscribe({
      next: ({ partita }) => {
        this.createdPartita = partita;
        this.creationPhase.set('success');
      },
      error: (err) => {
        this.creationPhase.set('error');
        this.createError.set(err?.error?.message ?? 'Errore durante la creazione. Riprova.');
      }
    });
  }

  handleSuccessVideoEnded(): void {
    if (this.createdPartita) {
      const id = this.createdPartita.id;
      this.closeModal();
      this.router.navigate(['/games', id]);
    }
  }

  private playVideo(ref?: ElementRef<HTMLVideoElement>): void {
    const video = ref?.nativeElement;
    if (!video) return;
    video.muted = true;
    video.currentTime = 0;
    video.play().catch(() => {});
  }

  getAvatarColor(index: number): string {
    const colors = [
      'linear-gradient(135deg, #f59e0b, #d97706)',
      'linear-gradient(135deg, #94a3b8, #64748b)',
      'linear-gradient(135deg, #b45309, #92400e)',
    ];
    return colors[index] ?? 'linear-gradient(135deg, #7c3aed, #9f67ff)';
  }
}
