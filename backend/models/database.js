"use strict";

import 'dotenv/config';
import { Sequelize } from "sequelize";
import { CreaUtente } from "./utente.js";
import { CreaPartita } from "./partita.js"
import { CreaTentativo } from "./tentativo.js";;




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
export const Tentativo = CreaTentativo(database);

// ==========================================
// CREAZIONE ASSOCIAZIONI
// ==========================================

Utente.hasMany(Partita, { foreignKey: "utenteId" }); //Un utente può avere molte partite
Partita.belongsTo(Utente, { foreignKey: "utenteId" }); //Una partita appartiene ad un utente
Utente.hasMany(Tentativo, { foreignKey: "utenteId" }); //Un utente può avere molti tentativi
Tentativo.belongsTo(Utente, { foreignKey: "utenteId" }); //Un tentativo appartiene ad un utente
Partita.hasMany(Tentativo, { foreignKey: "partitaId" }); //Una partita può avere molti tentativi
Tentativo.belongsTo(Partita, { foreignKey: "partitaId" }); //Un tentativo appartiene ad una partita

// ==========================================
// SYNC DATABASE
// ==========================================
database.sync()
    .then(() => console.log("Database sincronizzato"))
    .catch(err => console.error("Errore sincronizzazione: " + err.message));