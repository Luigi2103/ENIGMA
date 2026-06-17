"use strict";

import express from "express";
import { Partita, Utente, Tentativo, database } from "../models/database.js";

export const publicrouter = express.Router(); 

/**
 * @swagger
 * tags:
 *   name: Public
 *   description: API pubbliche accessibili senza autenticazione
 */

/**
 * @swagger
 * /games:
 *   get:
 *     summary: Ottieni la lista di tutte le partite
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Lista delle partite recuperata con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   argomento:
 *                     type: string
 *                   suggerimento:
 *                     type: string
 *                   foto:
 *                     type: array
 *                     items:
 *                       type: string
 *                   utenteId:
 *                     type: integer
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   Utente:
 *                     type: object
 *                     properties:
 *                       username:
 *                         type: string
 *       500:
 *         description: Errore del server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
publicrouter.get("/games" , async (req,res,next) => {
    try {
        const page  = Math.max(1, parseInt(req.query.page)  || 1);
        const limit = Math.max(1, parseInt(req.query.limit) || 9);
        const offset = (page - 1) * limit;

        const { count, rows } = await Partita.findAndCountAll({
            where: { attiva: true },
            attributes: ['id', 'argomento', 'suggerimento', 'foto', 'utenteId', 'createdAt'],
            include: [{
                model: Utente,
                attributes: ['username']
            }],
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });

        res.json({
            data: rows,
            total: count,
            page,
            totalPages: Math.ceil(count / limit)
        });
    }catch(error) {
        next({ status: 500, message: error.message });
    }
})

/**
 * @swagger
 * /games/{id}:
 *   get:
 *     summary: Ottieni i dettagli di una partita specifica
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID della partita
 *     responses:
 *       200:
 *         description: Dettagli della partita recuperati con successo
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
 *                 foto:
 *                     type: array
 *                     items:
 *                       type: string
 *                 utenteId:
 *                   type: integer
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 Utente:
 *                   type: object
 *                   properties:
 *                     username:
 *                       type: string
 *       404:
 *         description: Enigma non trovato
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Errore del server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
publicrouter.get("/games/:id", async (req, res, next) => {
    try {
        const partita = await Partita.findOne({
            where: { id: req.params.id, attiva: true },
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

/**
 * @swagger
 * /leaderboard:
 *   get:
 *     summary: Ottieni la classifica degli utenti
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Classifica recuperata con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   utenteId:
 *                     type: integer
 *                   enigmi_risolti:
 *                     type: integer
 *                     description: Numero di enigmi risolti (restituito come stringa da PostgreSQL)
 *                   Utente:
 *                     type: object
 *                     properties:
 *                       username:
 *                         type: string
 *       500:
 *         description: Errore del server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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