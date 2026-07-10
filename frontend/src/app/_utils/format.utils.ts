import { Partita } from '../_services/rest-backend/rest-backend.service';

/** Formatta una data ISO in formato leggibile italiano (es. "9 lug 2026") */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

/** Restituisce l'URL della prima foto di una partita, o null se assente */
export function getGameImage(game: Partita): string | null {
  return game.foto && game.foto.length > 0 ? game.foto[0] : null;
}

/** Restituisce un gradiente CSS per l'avatar in base alla posizione in classifica */
export function getAvatarColor(index: number): string {
  const colors = [
    'linear-gradient(135deg, #f59e0b, #d97706)', // oro
    'linear-gradient(135deg, #94a3b8, #64748b)', // argento
    'linear-gradient(135deg, #b45309, #92400e)', // bronzo
  ];
  return colors[index] ?? 'linear-gradient(135deg, #7c3aed, #9f67ff)';
}
