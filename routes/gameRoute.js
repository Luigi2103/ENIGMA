"use strict";

import express from "express";
import { GestorePartita } from "../controllers/gestorePartitaController.js";
import { Partita,Utente,Tentativo } from "../models/database.js";


const gameRouter = express.Router();
const MAX_TENTATIVI = 10;

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


gameRouter.patch("/games/:id", async (req,res,next) => {
    GestorePartita.DisabilitaPartita(req).then((partita) => {
        res.status(204).send();
    }).catch((error) => {
        next({ status: error.status, message: error.message });
    })
})



export { gameRouter };