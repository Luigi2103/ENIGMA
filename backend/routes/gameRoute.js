"use strict";

import express from "express";
import { GestorePartita, MAX_TENTATIVI } from "../controllers/gestorePartitaController.js";
import { Partita,Utente,Tentativo } from "../models/database.js";


const gameRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Games
 *   description: Gestione delle partite e dei tentativi (richiede autenticazione)
 */

/**
 * @swagger
 * /games:
 *   post:
 *     summary: Crea una nuova partita (enigma generato tramite IA)
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               argomento:
 *                 type: string
 *                 description: Tema opzionale per la generazione dell'enigma. Se non fornito, viene usato "qualsiasi".
 *                 example: "Spazio"
 *     responses:
 *       201:
 *         description: Partita creata con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 argomento:
 *                   type: string
 *                   description: Tema usato (default "qualsiasi" se non specificato)
 *                 suggerimento:
 *                   type: string
 *                 utenteId:
 *                   type: integer
 *                 foto:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: Token mancante o non valido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Errore interno del server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
gameRouter.post("/games", async (req, res, next) => {
    GestorePartita.GeneraECreaPartita(req).then((partita) => {
        res.status(201).json({
            id: partita.id,
            argomento: partita.argomento,
            suggerimento: partita.suggerimento,
            utenteId: partita.utenteId,
            foto: partita.foto
        });
    }).catch((error) => {
        next({ status: 500, message: error.message });
    });
});

/**
 * @swagger
 * /games/{id}/attempts:
 *   post:
 *     summary: Invia un tentativo di risposta per un enigma
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID della partita
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - risposta
 *             properties:
 *               risposta:
 *                 type: string
 *                 example: "luna"
 *     responses:
 *       201:
 *         description: Tentativo registrato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 risposta:
 *                   type: string
 *                 vincente:
 *                   type: boolean
 *                 partitaId:
 *                   type: integer
 *                 utenteId:
 *                   type: integer
 *       400:
 *         description: Tentativo non valido (tentativi esauriti, enigma già risolto, partita non attiva)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Token mancante o non valido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Partita non trovata
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
gameRouter.post("/games/:id/attempts", async (req, res, next) => {
    GestorePartita.RegistraTentativo(req).then((tentativo) => {
        res.status(201).json({
            id: tentativo.id,
            risposta: tentativo.risposta,
            vincente: tentativo.vincente,
            partitaId: tentativo.partitaId,
            utenteId: tentativo.utenteId
        });
    }).catch((error) => {
        next({ status: error.status || 400, message: error.message });
    });
});

/**
 * @swagger
 * /games/{id}/attempts:
 *   get:
 *     summary: Ottieni i tentativi dell'utente per una partita
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID della partita
 *     responses:
 *       200:
 *         description: Lista dei tentativi recuperata con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   risposta:
 *                     type: string
 *                   vincente:
 *                     type: boolean
 *                   partitaId:
 *                     type: integer
 *                   utenteId:
 *                     type: integer
 */
gameRouter.get("/games/:id/attempts", async (req, res, next) => {
    GestorePartita.OttieniTentativi(req).then((tentativi) => {
        res.status(200).json(tentativi);
    }).catch((error) => {
        next({ status: error.status || 400, message: error.message });
    });
});


/**
 * @swagger
 * /games/{id}:
 *   patch:
 *     summary: Disabilita/abbandona una partita in corso
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID della partita da disabilitare
 *     responses:
 *       204:
 *         description: Partita disabilitata con successo
 *       400:
 *         description: Partita già non attiva
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Token mancante o non valido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Accesso negato (non sei il creatore della partita)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Partita non trovata
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
/**
 * @swagger
 * /games/{id}/solution:
 *   get:
 *     summary: Ottieni la parola segreta (solo se hai esaurito i tentativi senza vincere)
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID della partita
 *     responses:
 *       200:
 *         description: Parola segreta restituita
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 parola:
 *                   type: string
 *       403:
 *         description: Non hai ancora esaurito i tentativi
 *       404:
 *         description: Partita non trovata
 */
gameRouter.get("/games/:id/solution", async (req, res, next) => {
    try {
        const utente = await Utente.findOne({ where: { username: req.username } });
        if (!utente) return next({ status: 401, message: "Utente non trovato" });

        const partita = await Partita.findOne({ where: { id: req.params.id } });
        if (!partita) return next({ status: 404, message: "Partita non trovata" });

        const [numeroTentativi, haVinto] = await Promise.all([
            Tentativo.count({ where: { utenteId: utente.id, partitaId: partita.id } }),
            Tentativo.findOne({ where: { utenteId: utente.id, partitaId: partita.id, vincente: true } })
        ]);

        // Rivela la parola solo se l'utente ha perso (tentativi esauriti e non ha vinto)
        if (haVinto || numeroTentativi < MAX_TENTATIVI) {
            return next({ status: 403, message: "Non puoi vedere la soluzione: non hai ancora esaurito i tentativi." });
        }

        res.json({ parola: partita.parola });
    } catch (error) {
        next({ status: 500, message: error.message });
    }
});

gameRouter.patch("/games/:id", async (req,res,next) => {
    GestorePartita.DisabilitaPartita(req).then((partita) => {
        res.status(204).send();
    }).catch((error) => {
        next({ status: error.status, message: error.message });
    })
})



export { gameRouter };