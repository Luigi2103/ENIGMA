import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PublicService, Partita, LeaderboardEntry } from '../_services/rest-backend/rest-backend.service';
import { AuthService } from '../_services/auth/auth.service';
import { EnigmaCardComponent } from '../enigma-card/enigma-card.component';
import { UserStatCardComponent } from '../user-stat-card/user-stat-card.component';
import { CreateGameModalComponent } from '../create-game-modal/create-game-modal.component';

@Component({
  selector: 'app-games-component',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, EnigmaCardComponent, UserStatCardComponent, CreateGameModalComponent],
  templateUrl: './games-component.html',
  styleUrl: './games-component.scss'
})
export class GamesComponent implements OnInit, OnDestroy {

  private publicService = inject(PublicService);
  readonly authService = inject(AuthService);
  private router = inject(Router);

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
  searchQuery = '';

  // Paginazione
  readonly PAGE_SIZE = 9;
  currentPage = signal(1);
  totalPages = signal(1);
  totalGames = signal(0);
  visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    
    if (current <= 4) {
      return [1, 2, 3, 4, 5, '...', total];
    }
    
    if (current >= total - 3) {
      return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    }
    
    return [1, '...', current - 1, current, current + 1, '...', total];
  });
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

  retry(): void {
    this.loadGames(this.currentPage());
  }

  private initScrollAnimations(): void {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.1 }
    );
    document.querySelectorAll('.fade-in-up, .fade-in').forEach(el => observer.observe(el));
  }
}

