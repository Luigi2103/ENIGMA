"use strict";

import express from "express";
import { GestorePartita } from "../controllers/gestorePartitaController.js";
import { Partita,Utente,Tentativo } from "../models/database.js";


const gameRouter = express.Router();
const MAX_TENTATIVI = 10;

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
 *                 description: Tema opzionale per la generazione dell'enigma
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
 *                 suggerimento:
 *                   type: string
 *                 utenteId:
 *                   type: integer
 *                 foto:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: Non autorizzato
 *       500:
 *         description: Errore interno del server
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
 *         description: Richiesta non valida o tentativi esauriti
 *       401:
 *         description: Non autorizzato
 *       404:
 *         description: Partita non trovata
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
        next({ status: 400, message: error.message });
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
 *       401:
 *         description: Non autorizzato
 *       403:
 *         description: Accesso negato (non sei il proprietario della partita)
 *       404:
 *         description: Partita non trovata
 */
gameRouter.patch("/games/:id", async (req,res,next) => {
    GestorePartita.DisabilitaPartita(req).then((partita) => {
        res.status(204).send();
    }).catch((error) => {
        next({ status: error.status, message: error.message });
    })
})



export { gameRouter };