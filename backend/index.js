"use strict";

import express from 'express';
import cors from 'cors';
import morgan from "morgan";
import { database } from './models/database.js';
import { loginRouter } from './routes/loginRoute.js'
import { gameRouter } from './routes/gameRoute.js'
import { ControlloAutenticazione } from './middleware/controlloAutorizzazione.js'
import { publicrouter } from './routes/publicRoute.js';
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';


// ==========================================
// INIT
// ==========================================
const app = express();
const port = process.env.PORT || 3000 ;

// ==========================================
// SWAGGER CONFIG
// ==========================================
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'API di ENIGMA',
      version: '1.0.0',
      description: 'Documentazione delle API per il gioco ENIGMA',
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: 'Server locale'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        }
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            code: {
              type: 'integer',
              description: 'Codice HTTP dell\'errore',
              example: 400
            },
            description: {
              type: 'string',
              description: 'Messaggio descrittivo dell\'errore',
              example: 'Partita non trovata'
            }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js'],
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));


// ==========================================
// MIDDLEWARE
// ==========================================

app.disable('x-powered-by');

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:4200,http://localhost:3000')
  .split(',').map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS bloccato: origine non consentita: ${origin}`));
    }
  },
  credentials: true,
}));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

app.use(morgan('dev'));
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
  console.error(err.stack); 
  
  res.status(err.status || 500).json({
    code: err.status || 500,
    description: err.message || "An error occurred"
  });
  
});


// ==========================================
// START APPLICAZIONE
// ==========================================
app.listen(port, () => console.log(`Server in ascolto su http://localhost:${port}`));