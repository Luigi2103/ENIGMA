"use strict";
import { Partita, Utente, Tentativo } from "../models/database.js";
import { GeneraEnigma } from "../utils/gemini.js";
import { RecuperaImmagini } from "../utils/recuperaImmagini.js";
import { PickRandomTema } from "../utils/prompt.js";

/** Numero massimo di tentativi consentiti per enigma. */
const MAX_TENTATIVI = 10;

export class GestorePartita {


    /**
     * Genera un nuovo enigma tramite AI e lo persiste nel database come nuova partita.
     *
     * Flusso:
     * 1. Valida l'argomento fornito dall'utente (tipo e lunghezza).
     * 2. Se non fornito, sceglie un tema casuale dalla lista predefinita.
     * 3. Chiama Gemini AI per generare parola, query immagini e suggerimento.
     * 4. Recupera le immagini da Unsplash tramite le query generate.
     * 5. Salva la partita nel database e la restituisce.
     *
     * @param {import('express').Request} req - Legge `req.body.argomento` (opzionale) e `req.username`.
     * @returns {Promise<Partita>} La partita appena creata e salvata.
     * @throws {Error} 400 se `argomento` non è una stringa o supera i 100 caratteri.
     * @throws {Error} Se l'utente non esiste, la generazione AI fallisce o il salvataggio fallisce.
     */
    static async GeneraECreaPartita(req) {
        // Validazione input: se argomento è fornito deve essere una stringa entro 100 caratteri
        const argomentoRaw = req.body?.argomento;
        if (argomentoRaw !== undefined && argomentoRaw !== null) {
            if (typeof argomentoRaw !== 'string') {
                const err = new Error("Il campo 'argomento' deve essere una stringa");
                err.status = 400;
                throw err;
            }
            if (argomentoRaw.length > 100) {
                const err = new Error("Il campo 'argomento' non può superare i 100 caratteri");
                err.status = 400;
                throw err;
            }
        }

        const tema = argomentoRaw ?? PickRandomTema();

        const utente = await Utente.findOne({ where: { username: req.username } });
        if (!utente) throw new Error("Utente non trovato");

        const enigma = await GeneraEnigma(tema);

        if (!enigma || !enigma.parola || !enigma.parole_immagini || !Array.isArray(enigma.parole_immagini)) {
            throw new Error("Generazione dell'enigma fallita o formato non valido");
        }

        const foto = await RecuperaImmagini(enigma.parole_immagini)

        const partitaDaRegistrare = new Partita({
            parola: enigma.parola,
            argomento: enigma.tema_usato ?? tema,
            suggerimento: enigma.suggerimento,
            utenteId: utente.id,
            foto: foto,
            parole_immagini: enigma.parole_immagini
        });

        return await partitaDaRegistrare.save()
    }


    /**
     * Registra un tentativo di risposta dell'utente per una partita attiva.
     *
     * Controlla che la partita esista e sia attiva, che l'utente non abbia esaurito
     * i tentativi e non abbia già vinto. Se la risposta è corretta, disattiva la partita.
     *
     * @param {import('express').Request} req - Legge `req.params.id`, `req.body.risposta` e `req.username`.
     * @returns {Promise<Tentativo>} Il tentativo appena creato e salvato.
     * @throws {Error} 404 se la partita non esiste.
     * @throws {Error} 400 se la partita non è attiva, i tentativi sono esauriti o l'utente ha già vinto.
     */
    static async RegistraTentativo(req) {

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

    /**
     * Disabilita (abbandona) una partita attiva.
     *
     * Solo il creatore della partita può disabilitarla.
     *
     * @param {import('express').Request} req - Legge `req.params.id` e `req.username`.
     * @returns {Promise<Partita>} La partita aggiornata con `attiva = false`.
     * @throws {Error} 404 se la partita non esiste.
     * @throws {Error} 400 se la partita è già non attiva.
     * @throws {Error} 403 se l'utente non è il creatore della partita.
     */
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

    /**
     * Restituisce i tentativi effettuati dall'utente autenticato per una partita.
     *
     * @param {import('express').Request} req - Legge `req.params.id` e `req.username`.
     * @returns {Promise<Tentativo[]>} Lista dei tentativi in ordine cronologico ascendente.
     * @throws {Error} 404 se la partita non esiste.
     */
    static async OttieniTentativi(req) {
        const utente = await GestorePartita._verificaUtente(req.username);
        const partita = await Partita.findOne({ where: { id: req.params.id } });
        if (!partita) {
            const err = new Error("Partita non trovata");
            err.status = 404;
            throw err;
        }

        return await Tentativo.findAll({
            where: {
                utenteId: utente.id,
                partitaId: partita.id
            },
            order: [['createdAt', 'ASC']]
        });
    }


    // ==========================================
    // FUNZIONI PRIVATE
    // ==========================================

    /**
     * Verifica che una partita esista e sia ancora attiva.
     *
     * @param {number|string} idPartita - ID della partita da cercare.
     * @returns {Promise<Partita>} La partita trovata.
     * @throws {Error} 404 se la partita non esiste.
     * @throws {Error} 400 se la partita non è attiva.
     */
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

    /**
     * Verifica che un utente esista tramite username.
     *
     * @param {string} username - Username dell'utente da cercare.
     * @returns {Promise<Utente>} L'utente trovato.
     * @throws {Error} Se l'utente non esiste.
     */
    static async _verificaUtente(username) {
        const utente = await Utente.findOne({ where: { username } });
        if (!utente) throw new Error("Utente non trovato");
        return utente;
    }

    /**
     * Controlla che l'utente possa ancora effettuare tentativi per la partita.
     *
     * Lancia un errore se i tentativi sono esauriti (`>= MAX_TENTATIVI`)
     * oppure se l'utente ha già vinto la partita.
     *
     * @param {number} utenteId - ID dell'utente.
     * @param {number} partitaId - ID della partita.
     * @returns {Promise<number>} Il numero di tentativi già effettuati.
     * @throws {Error} Se i tentativi sono esauriti o l'utente ha già vinto.
     */
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



