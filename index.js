"use strict";

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
import morgan from "morgan";


// ==========================================
// INIT
// ==========================================
dotenv.config();
const app = express();
const port = process.env.PORT || 3000 ;



// ==========================================
// MIDDLEWARE
// ==========================================
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());



// ==========================================
// ROTTE DICHIARATE
// ==========================================

app.get('/', (req, res) => {
  res.send('Benvenuto nell\'API di EN?GMA! 🧩');
});



// ==========================================
// GESTIONE ERRORI
// ==========================================

app.use((err, req, res, next) => {
  console.log(err.stack); 
  
  res.status(err.status || 500).json({
    code: err.status || 500,
    description: err.message || "An error occurred"
  });
  
});


// ==========================================
// START APPLICAZIONE
// ==========================================
app.listen(port);