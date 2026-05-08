"use strict";

import express from "express";
import { Partita, Utente, Tentativo, database } from "../models/database.js";

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

publicrouter.get("/games/:id", async (req, res, next) => {
    try {
        const partita = await Partita.findByPk(req.params.id, {
            attributes: ['id', 'argomento', 'suggerimento', 'foto', 'utenteId', 'createdAt'],
            include: [{
                model: Utente,
                attributes: ['username']
            }]
        });
        if (!partita) {
            return next({ status: 404, message: "Enigma non trovato" });
        }
        res.json(partita);
    } catch (error) {
        next({ status: 500, message: error.message });
    }
});

publicrouter.get("/leaderboard", async (req, res, next) => {
    try {
        const classifica = await Tentativo.findAll({
            where: { vincente: true },
            attributes: [
                'utenteId',
                [database.fn('COUNT', database.col('Tentativo.id')), 'enigmi_risolti']
            ],
            include: [{
                model: Utente,
                attributes: ['username']
            }],
            group: ['utenteId', 'Utente.id', 'Utente.username'],
            order: [[database.fn('COUNT', database.col('Tentativo.id')), 'DESC']]
        });
        res.json(classifica);
    } catch (error) {
        next({ status: 500, message: error.message });
    }
});