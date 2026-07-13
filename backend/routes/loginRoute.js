"use strict";
import express from "express";
import { LoginController } from "../controllers/loginController.js";
import { Partita, Utente, Tentativo } from "../models/database.js";
import { ControlloAutenticazione } from "../middleware/controlloAutorizzazione.js";

const loginRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autenticazione e registrazione utenti
 */

/**
 * @swagger
 * /auth:
 *   post:
 *     summary: Effettua il login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login effettuato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 username:
 *                   type: string
 *       401:
 *         description: Credenziali non valide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 401
 *               description: Credenziali non valide
 */
loginRouter.post("/auth", async (req, res, next) => {
    try {
        const risultatoLogin = await LoginController.verificaLogin(req);
        if (risultatoLogin) {
            res.json({
                token: LoginController.creaToken(req.body.username),
                username: req.body.username
            });
        } else {
            res.status(401).json({ error: "Credenziali non valide" });
        }
    } catch (err) {
        next(err);
    }
});

/**
 * @swagger
 * /signup:
 *   post:
 *     summary: Registra un nuovo utente
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - email
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               email:
 *                 type: string
 *               nome:
 *                 type: string
 *               cognome:
 *                 type: string
 *     responses:
 *       201:
 *         description: Utente registrato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 username:
 *                   type: string
 *                 nome:
 *                   type: string
 *                 cognome:
 *                   type: string
 *                 email:
 *                   type: string
 *       409:
 *         description: Conflitto (username o email già in uso)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 409
 *               description: Conflitto (username o email già in uso)
 */
loginRouter.post("/signup", async (req, res, next) => {
    LoginController.InserisciUtente(req).then((user) => {
        res.status(201).json({
            username: user.username,
            nome: user.nome,
            cognome: user.cognome,
            email: user.email,
        });
    }).catch((error) => {
        next({ status: 409, message: error.message });
    });
});

/**
 * @swagger
 * /users/{username}:
 *   delete:
 *     summary: Elimina l'account dell'utente autenticato
 *     description: >
 *       L'utente può eliminare solo il proprio account.
 *       Vengono rimossi in cascata tutti i tentativi e le partite associate.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Account eliminato con successo
 *       403:
 *         description: Non autorizzato (stai cercando di eliminare un account altrui)
 *       404:
 *         description: Utente non trovato
 */
loginRouter.delete("/users/:username", ControlloAutenticazione, async (req, res, next) => {
    if (req.username !== req.params.username) {
        return res.status(403).json({ error: "Non puoi eliminare un account che non è il tuo" });
    }

    try {
        const user = await Utente.findOne({ where: { username: req.params.username } });
        if (!user) {
            return res.status(404).json({ error: "Utente non trovato" });
        }

        // Cascade manuale: tentativo → partita → utente (evita errori FK su PostgreSQL)
        const partite = await Partita.findAll({ where: { utenteId: user.id } });
        for (const partita of partite) {
            await Tentativo.destroy({ where: { partitaId: partita.id } });
        }
        await Partita.destroy({ where: { utenteId: user.id } });
        await Utente.destroy({ where: { username: req.params.username } });

        return res.status(200).json({ message: "Account eliminato con successo" });
    } catch (err) {
        next(err);
    }
});

export { loginRouter };