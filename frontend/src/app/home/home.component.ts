import { Component, OnInit, AfterViewInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PublicService, Partita, LeaderboardEntry } from '../_services/rest-backend/rest-backend.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, AfterViewInit {

  private publicService = inject(PublicService);

  // --- Static ---
  readonly currentYear = new Date().getFullYear();

  // --- State ---
  games = signal<Partita[]>([]);
  leaderboard = signal<LeaderboardEntry[]>([]);
  gamesLoading = signal(true);
  leaderboardLoading = signal(true);
  gamesError = signal(false);
  leaderboardError = signal(false);

  ngOnInit(): void {
    this.loadGames();
    this.loadLeaderboard();
  }

  ngAfterViewInit(): void {
    this.initScrollAnimations();
  }

  private loadGames(): void {
    this.publicService.getGames().subscribe({
      next: (data) => {
        this.games.set(data.slice(0, 6)); // mostriamo max 6 card in homepage
        this.gamesLoading.set(false);
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
        this.leaderboard.set(data.slice(0, 5)); // top 5 in homepage
        this.leaderboardLoading.set(false);
      },
      error: () => {
        this.leaderboardError.set(true);
        this.leaderboardLoading.set(false);
      }
    });
  }

  private initScrollAnimations(): void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.12 }
    );

    document.querySelectorAll('.fade-in-up, .fade-in').forEach((el) => {
      observer.observe(el);
    });
  }

  /**
   * Formatta la data in italiano
   */
  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  /**
   * Ottiene la prima foto disponibile o placeholder
   */
  getGameImage(game: Partita): string | null {
    return game.foto && game.foto.length > 0 ? game.foto[0] : null;
  }

  /**
   * Rank visivo per la leaderboard
   */
  getRankIcon(index: number): string {
    const icons = ['bi-trophy-fill', 'bi-award-fill', 'bi-star-fill'];
    return icons[index] ?? 'bi-circle-fill';
  }

  getRankClass(index: number): string {
    const classes = ['rank-gold', 'rank-silver', 'rank-bronze'];
    return classes[index] ?? 'rank-default';
  }
}
