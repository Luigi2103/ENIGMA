"use strict";
import express from "express";
import { LoginController } from "../controllers/loginController.js";

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
 */
loginRouter.post("/auth", async (req, res, next) => {
    try {
        const risultatoLogin = await LoginController.verificaLogin(req, res);
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
 *               fotoProfilo:
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
 */
loginRouter.post("/signup", async (req, res, next) => {
    LoginController.InserisciUtente(req, res).then((user) => {
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

export { loginRouter };