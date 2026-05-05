"use strict";
import Partita from "../models/partita.js";

export class GestorePartita {

    export static CreaPartita(req,res) {

        const partitaDaRegistarre = new Partita({
            parola = req.body.parola,
            argomento = req.body.argomento,
            suggerimento = req.body.suggerimento,
            utenteId = req.body.utenteId
        })

        return partitaDaRegistarre.save();
        
    }
}