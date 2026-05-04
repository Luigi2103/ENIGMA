"use strict";
import express from "express";
import { loginController } from "./controllers/loginController";

const loginRouter = express.Router();

loginController.post("/login", async (req, res, next) => {
    try {
        const risultatoLogin = await loginController.verificaLogin(req, res);
        if (risultatoLogin) {
            res.json(loginController.creaToken(req.body.username));
        } else {
            res.status(401).json({ error: "Credenziali non valide" });
        }
    } catch (err) {
        next(err);
    }
});

loginController.post("/registrati" , async (req,res,next) => {
    loginController.InserisciUtente(req,res).then( (user) => {
        res.json(user);
    }).catch((error) => {
        next({status: 409, message: error.message});
    })

})