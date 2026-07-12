import { Component, OnInit, AfterViewInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PublicService, Partita, LeaderboardEntry } from '../_services/rest-backend/rest-backend.service';
import { AuthService } from '../_services/auth/auth.service';
import { EnigmaCardComponent } from '../enigma-card/enigma-card.component';
import { UserStatCardComponent } from '../user-stat-card/user-stat-card.component';
import { CreateGameModalComponent } from '../create-game-modal/create-game-modal.component';
import { getAvatarColor } from '../_utils/format.utils';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, EnigmaCardComponent, UserStatCardComponent, CreateGameModalComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {

  private publicService = inject(PublicService);
  readonly auth = inject(AuthService);
  private router = inject(Router);

  readonly getAvatarColor = getAvatarColor;

  constructor() {
    // re-inizializza le animazioni ogni volta che cambia lo stato login
    effect(() => {
      this.auth.isLoggedIn();
      setTimeout(() => this.initScrollAnimations(), 100);
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

  ngOnInit(): void {
    this.loadGames();
    this.loadLeaderboard();
  }

  ngAfterViewInit(): void {
    this.initScrollAnimations();
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
    this.scrollObserver?.disconnect();
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

  private scrollObserver: IntersectionObserver | null = null;

  private initScrollAnimations(): void {
    this.scrollObserver?.disconnect();
    this.scrollObserver = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.12 }
    );
    document.querySelectorAll('.fade-in-up, .fade-in').forEach(el => this.scrollObserver!.observe(el));
  }

  openModal(): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/' } });
      return;
    }
    this.showModal.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    this.showModal.set(false);
    document.body.style.overflow = '';
  }

  onGameCreated(id: number): void {
    this.closeModal();
    this.router.navigate(['/games', id]);
  }
}

