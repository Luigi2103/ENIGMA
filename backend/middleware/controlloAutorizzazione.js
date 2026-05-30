"use strict";
import { LoginController } from "../controllers/loginController.js";

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