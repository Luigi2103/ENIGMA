"use strict"
export async function RecuperaImmagini(parole) {
    const urls = await Promise.all(
        parole.map(async (parola) => {
            try {
                const response = await fetch(
                    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(parola)}&per_page=10&order_by=relevant&content_filter=high&client_id=${process.env.IMAGE_API_KEY}`
                );
                if (!response.ok) {
                    console.error(`Errore API Unsplash per la parola "${parola}":`, response.status, response.statusText);
                    return null;
                }
                const data = await response.json();
                if (!data.results || data.results.length === 0) return null;

                // Sceglie la foto con più like tra i primi risultati (più popolare = più iconica)
                const migliore = data.results.reduce((prev, curr) =>
                    curr.likes > prev.likes ? curr : prev
                );

                return `${migliore.urls.raw}&w=400&h=400&fit=crop`;

            } catch (error) {
                console.error(`Errore di rete nel recupero dell'immagine per "${parola}":`, error);
                return null;
            }
        })
    );
    return urls;
}