import {
  Component,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  signal,
  effect,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, timer } from 'rxjs';
import { GameService, CreatedGame } from '../_services/rest-backend/game.service';

export type CreationPhase = 'idle' | 'waiting' | 'success' | 'error';

// modale per creare un enigma via IA – fasi: idle → attesa → successo/errore
@Component({
  selector: 'app-create-game-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-game-modal.component.html',
  styleUrl: './create-game-modal.component.scss'
})
export class CreateGameModalComponent {
  private gameService = inject(GameService);

  @Output() closed = new EventEmitter<void>();
  @Output() gameCreated = new EventEmitter<number>();

  @ViewChild('loadingVideo') loadingVideoRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('successVideo') successVideoRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('errorVideo')   errorVideoRef?: ElementRef<HTMLVideoElement>;

  readonly creationPhase = signal<CreationPhase>('idle');
  readonly createError = signal<string | null>(null);
  argomento = '';

  private createdPartita: CreatedGame | null = null;

  constructor() {
    // Avvia il video corretto a ogni cambio di fase
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

  // chiude il modale (ignorato se sta generando)
  close(): void {
    if (this.creationPhase() === 'waiting') return;
    this.closed.emit();
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

  // emette l'id al padre, che fa il navigate
  handleSuccessAction(): void {
    if (this.createdPartita) {
      this.gameCreated.emit(this.createdPartita.id);
    }
  }

  resetToIdle(): void {
    this.creationPhase.set('idle');
  }

  private playVideo(ref?: ElementRef<HTMLVideoElement>): void {
    const video = ref?.nativeElement;
    if (!video) return;
    video.muted = true;
    video.currentTime = 0;
    video.play().catch(() => {});
  }
}
