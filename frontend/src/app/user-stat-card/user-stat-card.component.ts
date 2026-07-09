import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Componente condiviso per le stat-card della dashboard utente.
 * Usato in HomeComponent e GamesComponent per mostrare statistiche
 * (enigmi risolti, posizione in classifica) e il pulsante "Crea".
 */
@Component({
  selector: 'app-user-stat-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-stat-card.component.html',
  styleUrl: './user-stat-card.component.scss'
})
export class UserStatCardComponent {
  /** Classe Bootstrap Icons dell'icona (es. 'bi-check-circle-fill') */
  @Input() icon: string = '';

  /** Valore principale mostrato nella card */
  @Input() value: string | number = '';

  /** Etichetta descrittiva sotto il valore */
  @Input() label: string = '';

  /** Variante colore dell'icona */
  @Input() variant: 'green' | 'gold' | 'cta' = 'green';

  /** Se true, la card è resa come <button> con freccia e emette cardClick */
  @Input() isCta: boolean = false;

  /** Disabilita il pulsante (valido solo quando isCta = true) */
  @Input() disabled: boolean = false;

  /** Emesso al click (solo quando isCta = true) */
  @Output() cardClick = new EventEmitter<void>();
}
