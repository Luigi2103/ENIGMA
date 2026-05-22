"use strict";
import { Partita, Utente, Tentativo } from "../models/database.js";
import { GeneraEnigma } from "../utils/gemini.js";
import { RecuperaImmagini } from "../utils/recuperaImmagini.js";
import { PickRandomTema } from "../utils/prompt.js";

const MAX_TENTATIVI = 10;

export class GestorePartita {


    static async GeneraECreaPartita(req) {
        const tema = req.body?.argomento ?? PickRandomTema();

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
            foto: foto,
            parole_immagini: enigma.parole_immagini
        });

        return await partitaDaRegistrare.save()
    }


    static async RegistraTentativo(req) {

        //Controlla che la partita sia valida e attiva e che l'utente esista e che non abbia già vinto
        const [partita, utente] = await Promise.all([
            GestorePartita._verificaPartita(req.params.id),
            GestorePartita._verificaUtente(req.username)
        ]);


        const numeroTentativi = await GestorePartita._controllaStatoTentativi(utente.id, partita.id);


        const corretto = req.body.risposta.toLowerCase() === partita.parola.toLowerCase();

        if (corretto) {
            partita.set('attiva', false);
            await partita.save();
        }

        const tentativoDaRegistrare = new Tentativo({
            risposta: req.body.risposta,
            vincente: corretto,
            utenteId: utente.id,
            partitaId: partita.id
        });


        return await tentativoDaRegistrare.save();
    }

    static async DisabilitaPartita(req) {

        const [partita, utente] = await Promise.all([
            GestorePartita._verificaPartita(req.params.id),
            GestorePartita._verificaUtente(req.username)
        ]);

        if (partita.utenteId !== utente.id) {
            const err = new Error("Non sei il creatore di questa partita");
            err.status = 403;
            throw err;
        };

        partita.set('attiva', false);

        return await partita.save();
    }


    // --- FUNZIONI AUSILIARIE ---

    static async _verificaPartita(idPartita) {
        const partita = await Partita.findOne({ where: { id: idPartita } });
        if (!partita) {
            const err = new Error("Partita non trovata");
            err.status = 404;
            throw err;
        }
        if (!partita.attiva) {
            const err = new Error("Partita non attiva");
            err.status = 400;
            throw err;
        }
        return partita;
    }

    static async _verificaUtente(username) {
        const utente = await Utente.findOne({ where: { username } });
        if (!utente) throw new Error("Utente non trovato");
        return utente;
    }

    static async _controllaStatoTentativi(utenteId, partitaId) {
        const [numeroTentativi, haVinto] = await Promise.all([
            Tentativo.count({ where: { utenteId, partitaId } }),
            Tentativo.findOne({ where: { utenteId, partitaId, vincente: true } })
        ]);

        if (numeroTentativi >= MAX_TENTATIVI) {
            throw new Error("Numero massimo di tentativi raggiunti");
        }

        if (haVinto) {
            throw new Error("Hai già superato quest'enigma");
        }

        return numeroTentativi;
    }


}


