"use strict";

import { Sequelize } from "sequelize";
import 'dotenv/config';
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

Utente.hasMany(Partita, { foreignKey: "utenteId" });
Partita.belongsTo(Utente, { foreignKey: "utenteId" });
Utente.hasMany(Tentativo, { foreignKey: "utenteId" });
Tentativo.belongsTo(Utente, { foreignKey: "utenteId" });
Partita.hasMany(Tentativo, { foreignKey: "partitaId" });
Tentativo.belongsTo(Partita, { foreignKey: "partitaId" });

// ==========================================
// SYNC DATABASE
// ==========================================
database.sync({ alter: true })
    .then(() => console.log("Database sincronizzato"))
    .catch(err => console.error("Errore sincronizzazione: " + err.message));