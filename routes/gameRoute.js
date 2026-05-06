"use strict"
import express from "express";
import { GestorePartita } from "../controllers/gestorePartitaController.js";

const gameRouter = express.Router();

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

export { gameRouter };