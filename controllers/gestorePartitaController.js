"use strict";
import { Partita, Utente } from "../models/database.js";
import { GeneraEnigma } from "../utils/gemini.js";

export class GestorePartita {


    static async GeneraECreaPartita(req) {
        const tema = req.body.argomento ?? "qualsiasi";

        const utente = await Utente.findOne({ where: { username: req.username } });
        if (!utente) throw new Error("Utente non trovato");

        const enigma = await GeneraEnigma(tema);

        const partitaDaRegistrare = new Partita({
            parola: enigma.parola,
            argomento: tema,
            suggerimento: enigma.suggerimento,
            utenteId: utente.id
        });

        const partita = await partitaDaRegistrare.save();

        return { partita, parole_immagini: enigma.parole_immagini };
    }
}
