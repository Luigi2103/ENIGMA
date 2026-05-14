"use strict";

const temiGioco = [
  // Natura & Animali
  "Animali della savana",
  "Animali marini",
  "Insetti",
  "Fiori e piante",
  "Fenomeni atmosferici",
  "Montagna",

  // Sport & Attività
  "Sport olimpici",
  "Sport estremi",
  "Arti marziali",
  "Danza",

  // Cibo & Cultura italiana
  "Cucina italiana",
  "Dolci e dessert",
  "Frutta esotica",
  "Bevande",

  // Scienza & Tecnologia
  "Spazio e astronomia",
  "Mezzi di trasporto",
  "Strumenti musicali",
  "Professioni",

  // Fantasia & Avventura
  "Magia e Fantasy",
  "Supereroi",
  "Pirati",
  "Far West",
  "Epoche storiche",
  "Mitologia greca",

  // Vita quotidiana
  "Casa e arredamento",
  "Abbigliamento",
  "Giocattoli",
  "Scuola",
];

export function PickRandomTema() {
    return temiGioco[Math.floor(Math.random() * temiGioco.length)];
}

export function CreatePrompt(tema) {
    return `Sei un game designer che crea enigmi visivi per un gioco di indovinelli. Il tema di questa partita è: "${tema}".

Il tuo compito è scegliere UNA parola italiana da far indovinare al giocatore tramite 4 immagini.

REGOLE per la PAROLA:
- Deve essere un sostantivo concreto e visivamente riconoscibile (NO parole astratte come "libertà", "velocità", "amore")
- Massimo 10 caratteri
- Deve essere strettamente legata al tema "${tema}"
- Deve essere comune e conosciuta (no termini tecnici rari)

REGOLE per le PAROLE_IMMAGINI (termini di ricerca per Unsplash):
- Devono essere 4 parole singole in INGLESE, precise e senza errori
- Ognuna deve mostrare la parola da una prospettiva DIVERSA (es. ambiente naturale, primo piano, azione, contesto)
- NON devono essere sinonimi della parola né parole della stessa categoria generica
- Devono essere abbastanza specifiche da restituire immagini utili su Unsplash
- Esempio CORRETTO per "Leone": ["savanna", "mane", "roar", "pride"]
- Esempio SBAGLIATO per "Leone": ["lion", "animal", "cat", "wildlife"]

REGOLA per il SUGGERIMENTO:
- Una frase breve in italiano che aiuta senza rivelare la parola
- Deve fare riferimento a caratteristiche distintive visive o comportamentali

Rispondi ESCLUSIVAMENTE con JSON testuale crudo, NESSUN markdown (no \`\`\`json):
{"parola": "parola italiana", "parole_immagini": ["word1", "word2", "word3", "word4"], "suggerimento": "suggerimento breve"}`;
}