"use strict";

import { Sequelize } from "sequelize";
import 'dotenv/config';
import { CreaUtente } from "./utente.js";
import { CreaPartita } from "./partita.js";




// ==========================================
// CREAZIONE CONNESSIONE DB
// ==========================================
export const database = new Sequelize(process.env.DB_CONNECTION_URI, {
    dialect: process.env.DIALECT,
    dialectOptions: {
        ssl: { require: true, rejectUnauthorized: false }
    }
});


// ==========================================
// DICHIARAZIONE MODELLI
// ==========================================
export const Utente = CreaUtente(database);
export const Partita = CreaPartita(database);  

// ==========================================
// CREAZIONE ASSOCIAZIONI
// ==========================================



// ==========================================
// SYNC DATABASE
// ==========================================
database.sync({ alter: true })
    .then(() => console.log("Database sincronizzato"))
    .catch(err => console.error("Errore sincronizzazione: " + err.message));