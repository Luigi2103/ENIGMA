"use strict";

import { Utente } from "../models/database.js";
import Jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

export class LoginController {

    /**
     * Verifica che lo username non sia già registrato nel sistema.
     *
     * @param {string} validateUsername - Username da controllare.
     * @returns {Promise<boolean>} `true` se lo username è disponibile, `false` se già in uso.
     */
    static async verificaUsernameUnico(validateUsername) {
        const trovato = await Utente.findOne({
            where: {
                username: validateUsername
            }
        })
        return trovato === null;
    }

    /**
     * Verifica che l'indirizzo email non sia già registrato nel sistema.
     *
     * @param {string} validateMail - Email da controllare.
     * @returns {Promise<boolean>} `true` se la mail è disponibile, `false` se già in uso.
     */
    static async verificaMailUnica(validateMail) {
        const trovato = await Utente.findOne({
            where: {
                email: validateMail
            }
        })
        return trovato === null;
    }

    /**
     * Verifica le credenziali di login dell'utente.
     *
     * Confronta la password fornita con l'hash bcrypt memorizzato nel database.
     *
     * @param {import('express').Request} req - Legge `req.body.username` e `req.body.password`.
     * @returns {Promise<boolean>} `true` se le credenziali sono corrette, `false` altrimenti.
     */
    static async verificaLogin(req) {
        const utente = await Utente.findOne({
            where: { username: req.body.username }
        });
        if (!utente) return false;
        return await bcrypt.compare(req.body.password, utente.password);
    }

    /**
     * Registra un nuovo utente nel sistema.
     *
     * Controlla l'unicità di username e email prima di creare il record.
     * La password viene hashata automaticamente tramite un hook Sequelize (bcrypt).
     *
     * @param {import('express').Request} req - Legge i campi `username`, `nome`, `cognome`,
     *   `email`, `password` e opzionalmente `fotoProfilo` da `req.body`.
     * @returns {Promise<Utente>} L'utente appena creato e salvato.
     * @throws {Error} Se username e/o email sono già in uso.
     */
    static async InserisciUtente(req) {
        let isUniqueUsername = await this.verificaUsernameUnico(req.body.username);
        let isUniqueEmail = await this.verificaMailUnica(req.body.email);

        if (!isUniqueUsername || !isUniqueEmail) {
            if (!isUniqueUsername && !isUniqueEmail) {
                return Promise.reject(new Error("Username e mail già in uso"));
            } else if (!isUniqueUsername) {
                return Promise.reject(new Error("Username già in uso"))
            } else {
                return Promise.reject(new Error("Mail già in uso"))
            }
        }

        const utenteDaRegistrare = new Utente({
            username: req.body.username,
            nome: req.body.nome,
            cognome: req.body.cognome,
            email: req.body.email,
            password: req.body.password
        });


        return await utenteDaRegistrare.save();
    }

    /**
     * Genera un JWT firmato per l'utente autenticato.
     *
     * Il token ha una scadenza di 24 ore e contiene il campo `user` con lo username.
     *
     * @param {string} username - Username da includere nel payload del token.
     * @returns {string} Il token JWT firmato.
     */
    static creaToken(username) {
        return Jwt.sign({ user: username }, process.env.TOKEN_SECRET, { expiresIn: `${24 * 60 * 60}s` });
    }

    /**
     * Verifica la validità di un JWT.
     *
     * @param {string} token - Il token JWT da verificare.
     * @param {function} callback - Callback `(err, decoded)` standard di `jsonwebtoken.verify`.
     */
    static isTokenValid(token, callback) {
        Jwt.verify(token, process.env.TOKEN_SECRET, callback);
    }

}
