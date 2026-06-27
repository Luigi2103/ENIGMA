"use strict";

import { Utente } from "../models/database.js";
import Jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

export class LoginController {

    static async verificaUsernameUnico(validateUsername) {
        const trovato = await Utente.findOne({
            where: {
                username: validateUsername
            }
        })
        return trovato === null;
    }

    static async verificaMailUnica(validateMail) {
        const trovato = await Utente.findOne({
            where: {
                email: validateMail
            }
        })
        return trovato === null;
    }

    static async verificaLogin(req, res) {
        const utente = await Utente.findOne({
            where: { username: req.body.username }
        });
        if (!utente) return false;
        return await bcrypt.compare(req.body.password, utente.password);
    }

    static async InserisciUtente(req, res) {
        let isUniqueUsername = await this.verificaUsernameUnico(req.body.username);
        let isUniqueEmail = await this.verificaMailUnica(req.body.email);

        if (!isUniqueUsername || !isUniqueEmail) {
            if(!isUniqueUsername && !isUniqueEmail){
                return Promise.reject(new Error("Username e mail già in uso"));
            }else if(!isUniqueUsername) {
                return Promise.reject(new Error("Username già in uso"))
            }else {
                return Promise.reject(new Error("Mail già in uso"))
            }
        }

        const utenteDaRegistrare = new Utente({
            username: req.body.username,
            nome: req.body.nome,
            cognome: req.body.cognome,
            email: req.body.email,
            fotoProfilo: req.body.fotoProfilo ?? null,
            password: req.body.password
        });


        return await utenteDaRegistrare.save();
    }

    static creaToken(username) {
        return Jwt.sign({ user: username }, process.env.TOKEN_SECRET, { expiresIn: `${24 * 60 * 60}s` });
    }

    static isTokenValid(token, callback) {
        Jwt.verify(token, process.env.TOKEN_SECRET, callback);
    }

}
