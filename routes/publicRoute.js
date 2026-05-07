"use strict";

import express from "express";
import { Partita, Utente } from "../models/database.js";

export const publicrouter = express.Router(); 

publicrouter.get("/games" , async (req,res,next) => {
    try {
            const partite = await Partita.findAll({
            attributes: ['id', 'argomento', 'suggerimento', 'foto', 'utenteId', 'createdAt'],
            include: [{
                model: Utente,
                attributes: ['username']
            }]
        });
        res.json(partite);
    }catch(error) {
        next({ status: 500, message: error.message });
    }
})