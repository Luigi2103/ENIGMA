"use strict"
import express from "express";
import { GestorePartita } from "../controllers/gestorePartitaController.js";

const gameRouter = express.Router();

gameRouter.post("/games", async (req, res, next) => {
    GestorePartita.GeneraECreaPartita(req).then(({ partita, parole_immagini }) => {
        res.status(201).json({
            id: partita.id,
            argomento: partita.argomento,
            suggerimento: partita.suggerimento,
            utenteId: partita.utenteId,
            parole_immagini
        });
    }).catch((error) => {
        next({ status: 500, message: error.message });
    });
});

export { gameRouter };