"use strict"

export async function RecuperaImmagini(parole) {
    const urls = await Promise.all(
        parole.map(async (parola) => {
            try {
                const response = await fetch(
                    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(parola)}&per_page=1&client_id=${process.env.IMAGE_API_KEY}`
                );
                
                if (!response.ok) {
                    console.error(`Errore API Unsplash per la parola "${parola}":`, response.status, response.statusText);
                    return null;
                }

                const data = await response.json();

                if (!data.results || data.results.length === 0) return null;

                return data.results[0].urls.regular;
            } catch (error) {
                console.error(`Errore di rete nel recupero dell'immagine per "${parola}":`, error);
                return null;
            }
        })
    );

    return urls; // ["url1", "url2", "url3", "url4"]
}