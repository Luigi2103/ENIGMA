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

/**
 * Modale standalone per la creazione di un nuovo enigma tramite IA.
 *
 * Gestisce internamente le fasi (idle → waiting → success/error),
 * la riproduzione dei video e la logica di submit.
 *
 * Il padre controlla solo la visibilità tramite @if; il modale
 * emette `closed` e `gameCreated` quando appropriato.
 */
@Component({
  selector: 'app-create-game-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-game-modal.component.html',
  styleUrl: './create-game-modal.component.scss'
})
export class CreateGameModalComponent {
  private gameService = inject(GameService);

  /** Emesso quando l'utente chiude il modale (solo se non in fase 'waiting') */
  @Output() closed = new EventEmitter<void>();

  /** Emesso con l'ID della partita appena creata, dopo la fase 'success' */
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

  /** Chiude il modale (ignorato se la creazione è in corso) */
  close(): void {
    if (this.creationPhase() === 'waiting') return;
    this.closed.emit();
  }

  /** Avvia la creazione dell'enigma */
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

  /** Navigazione post-creazione: emette l'ID al padre che gestisce il routing */
  handleSuccessAction(): void {
    if (this.createdPartita) {
      this.gameCreated.emit(this.createdPartita.id);
    }
  }

  /** Torna alla fase idle dopo un errore */
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
