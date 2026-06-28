"use strict";
import { LoginController } from "../controllers/loginController.js";

/**
 * Middleware Express che verifica l'autenticazione JWT su ogni richiesta protetta.
 *
 * Legge il token dall'header `Authorization: Bearer <token>`, lo verifica
 * con la chiave segreta e, se valido, inietta `req.username` per i controller downstream.
 *
 * @param {import('express').Request} req - Request Express. Legge `req.headers.authorization`.
 * @param {import('express').Response} res - Response Express (non usata direttamente).
 * @param {import('express').NextFunction} next - Callback next: chiamata con `{status:401}` se il token
 *   manca o non è valido, altrimenti chiamata senza argomenti per proseguire.
 */
export function ControlloAutenticazione (req,res,next) {
    const authHeader = req.headers['authorization']
    const token = authHeader?.split(' ')[1];
    if(!token){
        next({status: 401, message: "Accesso negato"});
        return;
    }

    LoginController.isTokenValid(token, (err, token) => {
    if(err){
      next({status: 401, message: "Accesso negato"});
    } else {
      req.username = token.user;
      next();
    }
  });
}