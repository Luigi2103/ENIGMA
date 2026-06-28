"use strict"

/**
 * Recupera un URL immagine da Unsplash per ognuna delle query fornite.
 *
 * Per ogni query:
 * 1. Chiama l'API Unsplash con `content_filter=high` per escludere contenuti espliciti.
 * 2. Tra i risultati, seleziona i top 5 per like e ne sceglie uno casualmente
 *    per variare i risultati tra generazioni diverse dello stesso enigma.
 * 3. Restituisce l'URL in formato `raw` con dimensioni fisse 400x400 ritagliate.
 *
 * Gli errori HTTP specifici (401, 403, 429) vengono loggati con messaggi diagnostici
 * e il risultato per quella query viene impostato a `null`.
 * I `null` vengono filtrati dal risultato finale.
 *
 * @param {string[]} parole - Array di query di ricerca in inglese (tipicamente 4).
 * @returns {Promise<string[]>} Array di URL immagine validi (possibilmente meno di 4 se alcune query falliscono).
 */
export async function RecuperaImmagini(parole) {
    const urls = await Promise.all(
        parole.map(async (parola) => {
            try {
                const response = await fetch(
                    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(parola)}&per_page=15&order_by=relevant&content_filter=high&client_id=${process.env.IMAGE_API_KEY}`
                );

                if (response.status === 401) {
                    console.error(`[Unsplash] API key non valida o scaduta`);
                    return null;
                }
                if (response.status === 403) {
                    console.error(`[Unsplash] Accesso negato — controlla che la chiave sia in modalità produzione`);
                    return null;
                }
                if (response.status === 429) {
                    console.warn(`[Unsplash] Rate limit raggiunto (50 req/ora in demo)`);
                    return null;
                }
                if (!response.ok) {
                    console.error(`[Unsplash] Errore ${response.status} per "${parola}": ${response.statusText}`);
                    return null;
                }

                const data = await response.json();
                if (!data.results || data.results.length === 0) {
                    console.warn(`[Unsplash] Nessun risultato per "${parola}"`);
                    return null;
                }

                // Prendi i migliori 5 per like, poi scegli casualmente per variare i risultati
                const top5 = [...data.results]
                    .sort((a, b) => b.likes - a.likes)
                    .slice(0, 5);
                const scelta = top5[Math.floor(Math.random() * top5.length)];

                console.log(`[Unsplash] "${parola}" → ${scelta.urls.small}`);
                return `${scelta.urls.raw}&w=400&h=400&fit=crop`;

            } catch (error) {
                console.error(`[Unsplash] Errore di rete per "${parola}":`, error.message);
                return null;
            }
        })
    );
    return urls.filter(url => url !== null);
}