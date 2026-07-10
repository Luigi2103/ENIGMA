import { Component, Input, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Partita } from '../_services/rest-backend/rest-backend.service';
import { AuthService } from '../_services/auth/auth.service';
import { getGameImage, formatDate } from '../_utils/format.utils';

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

  readonly getGameImage = getGameImage;
  readonly formatDate = formatDate;

  isMine = computed(() => {
    const currentUsername = this.authService.username();
    return !!currentUsername && this.game.Utente?.username === currentUsername;
  });
}
