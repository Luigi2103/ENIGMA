"use strict";

export function CreatePrompt(tema = "qualsiasi") {
    return `Sei un'intelligenza artificiale e il tuo compito è generare un enigma per un gioco. Genera una parola italiana di massimo 10 caratteri inerente al tema "${tema}".
            Genera anche 4 termini di ricerca che userò per scaricare immagini dall'API di Unsplash per far indovinare la parola al giocatore. 
            ATTENZIONE: Questi 4 termini per Unsplash devono essere obbligatoriamente in INGLESE, composti da singole parole precise e senza errori.
            Genera infine un breve suggerimento in italiano per aiutare il giocatore a indovinare la parola.
            La tua risposta deve essere ESCLUSIVAMENTE in formato JSON testuale crudo. NON usare formattazione markdown (come \`\`\`json). La struttura deve essere esattamente questa:
            {
            "parola": "parola italiana da indovinare",
            "parole_immagini": ["english_word_1", "english_word_2", "english_word_3", "english_word_4"],
            "suggerimento": "suggerimento in italiano"
            }`;
}