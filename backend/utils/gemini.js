"use strict";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { GetSystemInstruction, GetUserMessage, SanitizzaTema } from "./prompt.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Genera un enigma visivo tramite Gemini AI.
 * Difese di sicurezza applicate:
 * 1. SanitizzaTema() — strip caratteri pericolosi e limite di lunghezza
 * 2. systemInstruction separata — il tema utente non può sovrascrivere le istruzioni di sistema
 * 3. Validazione schema JSON — verifica che l'output rispetti il formato atteso
 * @param {string} temaRaw - tema grezzo dall'input utente
 * @returns {Promise<{tema_usato: string, parola: string, parole_immagini: string[], suggerimento: string}>}
 */
export async function GeneraEnigma(temaRaw) {
    // 1. Sanitizza l'input prima di qualsiasi uso
    const tema = SanitizzaTema(temaRaw);

    // 2. Modello con systemInstruction separata (non modificabile dall'utente)
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: GetSystemInstruction(),
    });

    // 3. Il tema va nel messaggio utente, isolato da delimitatori XML
    const result = await model.generateContent(GetUserMessage(tema));
    const text = result.response.text();

    let parsed;
    try {
        parsed = JSON.parse(text);
    } catch (e) {
        throw new Error(`Risposta di Gemini non è JSON valido: ${text}`);
    }

    // 4. Validazione schema: verifica che tutti i campi richiesti siano presenti e del tipo corretto
    if (
        typeof parsed.tema_usato !== 'string' ||
        typeof parsed.parola !== 'string' ||
        !Array.isArray(parsed.parole_immagini) ||
        parsed.parole_immagini.length !== 4 ||
        parsed.parole_immagini.some(q => typeof q !== 'string') ||
        typeof parsed.suggerimento !== 'string'
    ) {
        throw new Error(`Schema JSON di Gemini non valido: ${text}`);
    }

    // 5. Sanità aggiuntiva sulla parola (max 10 caratteri come da regole del prompt)
    if (parsed.parola.length > 10) {
        throw new Error(`Parola troppo lunga restituita da Gemini: "${parsed.parola}"`);
    }

    return parsed;
}
