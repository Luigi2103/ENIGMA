"use strict"

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

                // Prendi i migliori 5 per like, poi scegli uno casualmente per variare
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
    return urls;
}