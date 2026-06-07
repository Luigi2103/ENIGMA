import { Component, Input, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Partita } from '../_services/rest-backend/rest-backend.service';
import { AuthService } from '../_services/auth/auth.service';

@Component({
  selector: 'app-enigma-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './enigma-card.component.html',
  styleUrl: './enigma-card.component.scss'
})
export class EnigmaCardComponent {
  @Input({ required: true }) game!: Partita;
  @Input() index: number = 0;

  readonly authService = inject(AuthService);

  isMine = computed(() => {
    const currentUsername = this.authService.username();
    return !!currentUsername && this.game.Utente?.username === currentUsername;
  });

  getGameImage(game: Partita): string | null {
    return game.foto && game.foto.length > 0 ? game.foto[0] : null;
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
}
