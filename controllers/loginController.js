"use strict";

import Utente from "../models/utente";
import Jwt from "jsonwebtoken";
import { createHash } from "crypto";
import { where } from "sequelize";

export class LoginController {
    
    static async verificaUsernameUnico(validateUsername) {
        const trovato = await Utente.findOne ( {
            where : {
                username : validateUsername
            }
        })
        return ! (trovato !== null)
    }

    static async verificaMailUnica(validateMail) {
        const trovato = await Utente.findOne ( {
            where : {
                email : validateMail
            }
        })
        return ! (trovato !== null)
    }

    static async verificaLogin(req,res) {
        const utente = new Utente( { username : req.body.username , password : createHash('sha256').update(req.body.password).digest('hex')  } )
        const trovato = await Utente.findOne( {
            where : {
                username : utente.username,
                password : utente.password
            }
        })
        return trovato !== null;
    }

    static async InserisciUtente(req,res) {
        let isUniqueUsername = await this.verificaUsernameUnico(req.body.username);
        let isUniqueEmail = await this.verificaMailUnica(req.body.email);

        if (!isUniqueUsername || !isUniqueEmail) {
            return null;
        }

        const utenteDaRegistrare = new Utente({
            username: req.body.username,
            nome: req.body.nome,
            cognome: req.body.cognome,
            email: req.body.email,
            fotoprofilo: req.body.fotoprofilo ?? null,
            password: createHash('sha256').update(req.body.password).digest('hex')
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
