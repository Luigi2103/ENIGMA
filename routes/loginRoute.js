"use strict";
import express from "express";
import { LoginController } from "../controllers/loginController.js";

const loginRouter = express.Router();

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

loginRouter.post("/signup", async (req, res, next) => {
    LoginController.InserisciUtente(req, res).then((user) => {
        res.status(201).json({
            id: user.id,
            username: user.username,
            nome: user.nome,
            cognome: user.cognome,
            email: user.email,
            fotoProfilo: user.fotoProfilo ?? null
        });
    }).catch((error) => {
        next({ status: 409, message: error.message });
    });
});

export { loginRouter };