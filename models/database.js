"use strict"

import { Sequelize } from "sequelize";
import 'dotenv/config.js'
import { CreaUtente } from "./utente.js"


// ==========================================
// INIT
// ==========================================




// ==========================================
// CREATE DATABASE CONNECTION
// ==========================================
export const database = new Sequelize(process.env.DB_CONNECTION_URI, {
  dialect: process.env.DIALECT,
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false }
  }
});



// ==========================================
// CREATE ASSOCIATIONS
// ==========================================




// ==========================================
// CREATE TABLE
// ==========================================

CreaUtente(database);



// ==========================================
// SYNCHRONIZE DB
// ==========================================

database.sync({ alter: true }).then( () => {
  console.log("Database sincronizzato");
}).catch( err => {
  console.err("Errore sincronizzazione: " + err.message);
});