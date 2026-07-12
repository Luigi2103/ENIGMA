import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

// card stat utente: enigmi risolti, rank, o bottone CTA per creare
@Component({
  selector: 'app-user-stat-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-stat-card.component.html',
  styleUrl: './user-stat-card.component.scss'
})
export class UserStatCardComponent {
  @Input() icon: string = '';
  @Input() value: string | number = '';
  @Input() label: string = '';
  @Input() variant: 'green' | 'gold' | 'cta' = 'green';
  // se true la card diventa un <button> che emette cardClick
  @Input() isCta: boolean = false;
  @Input() disabled: boolean = false;
  @Output() cardClick = new EventEmitter<void>();
}
