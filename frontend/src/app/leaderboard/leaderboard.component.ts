import { Component, OnInit, AfterViewInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PublicService, LeaderboardEntry } from '../_services/rest-backend/rest-backend.service';

@Component({
  selector: 'app-leaderboard',
  imports: [CommonModule, RouterLink],
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.scss'
})
export class LeaderboardComponent implements OnInit, AfterViewInit {

  private publicService = inject(PublicService);

  leaderboard = signal<LeaderboardEntry[]>([]);
  loading = signal(true);
  error = signal(false);

  ngOnInit(): void {
    this.loadLeaderboard();
  }

  ngAfterViewInit(): void {
    this.initScrollAnimations();
  }

  private loadLeaderboard(): void {
    this.publicService.getLeaderboard().subscribe({
      next: (data) => {
        this.leaderboard.set(data);
        this.loading.set(false);
        // Riavvia le animazioni dopo che i dati sono stati caricati
        setTimeout(() => this.initScrollAnimations(), 50);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }

  retry(): void {
    this.error.set(false);
    this.loading.set(true);
    this.loadLeaderboard();
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
      { threshold: 0.1 }
    );

    document.querySelectorAll('.fade-in-up, .fade-in').forEach((el) => {
      observer.observe(el);
    });
  }

  getRankIcon(index: number): string {
    const icons = ['bi-trophy-fill', 'bi-award-fill', 'bi-star-fill'];
    return icons[index] ?? 'bi-circle-fill';
  }

  getRankClass(index: number): string {
    const classes = ['rank-gold', 'rank-silver', 'rank-bronze'];
    return classes[index] ?? 'rank-default';
  }

  getRankLabel(index: number): string {
    const labels = ['Campione', 'Vicecampione', 'Terzo posto'];
    return labels[index] ?? `#${index + 1}`;
  }

  isPodium(index: number): boolean {
    return index < 3;
  }

  getAvatarColor(index: number): string {
    const colors = [
      'linear-gradient(135deg, #f59e0b, #d97706)',   // gold
      'linear-gradient(135deg, #94a3b8, #64748b)',   // silver
      'linear-gradient(135deg, #b45309, #92400e)',   // bronze
    ];
    return colors[index] ?? 'linear-gradient(135deg, #7c3aed, #9f67ff)';
  }
}
