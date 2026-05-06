"use strict";
import { Partita, Utente } from "../models/database.js";
import { GeneraEnigma } from "../utils/gemini.js";
import { RecuperaImmagini } from "../utils/recuperaImmagini.js"

export class GestorePartita {


    static async GeneraECreaPartita(req) {
        const tema = req.body?.argomento || "qualsiasi";

        const utente = await Utente.findOne({ where: { username: req.username } });
        if (!utente) throw new Error("Utente non trovato");

        const enigma = await GeneraEnigma(tema);

        if (!enigma || !enigma.parola || !enigma.parole_immagini || !Array.isArray(enigma.parole_immagini)) {
            throw new Error("Generazione dell'enigma fallita o formato non valido");
        }

        const foto = await RecuperaImmagini(enigma.parole_immagini)

        const partitaDaRegistrare = new Partita({
            parola: enigma.parola,
            argomento: tema,
            suggerimento: enigma.suggerimento,
            utenteId: utente.id,
            foto: foto
        });

        return await partitaDaRegistrare.save()
    }
}
