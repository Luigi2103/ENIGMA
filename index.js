"use strict";

import express from 'express';
import cors from 'cors';
import morgan from "morgan";
import { database } from './models/database.js';
import { loginRouter } from './routes/loginRoute.js'
import { gameRouter } from './routes/gameRoute.js'
import { ControlloAutenticazione } from './middleware/controlloAutorizzazione.js'
import { publicrouter } from './routes/publicRoute.js';


// ==========================================
// INIT
// ==========================================
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


app.use(loginRouter);
app.use(publicrouter);
app.use(ControlloAutenticazione);
app.use(gameRouter);


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
app.listen(port, () => console.log(`Server in ascolto su http://localhost:${port}`));