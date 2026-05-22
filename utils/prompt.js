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
    return `Sei un game designer esperto che crea enigmi visivi per un gioco di indovinelli. Il tema è: "${tema}".

Il tuo compito è scegliere UNA parola italiana da far indovinare tramite 4 immagini trovate su Unsplash.

REGOLE per la PAROLA:
- Sostantivo concreto e visivamente riconoscibile (NO parole astratte)
- Massimo 10 caratteri
- Strettamente legata al tema "${tema}"
- Comune e conosciuta (no termini tecnici rari)

REGOLE CRITICHE per le FRASI_IMMAGINI (query di ricerca per Unsplash):
- Devono essere ESATTAMENTE 4 frasi in inglese di 2-3 parole ciascuna
- Ogni frase deve descrivere una SCENA VISIVA SPECIFICA che mostri chiaramente un aspetto distintivo della parola
- Le frasi devono descrivere: 1) l'aspetto fisico caratteristico, 2) il comportamento tipico, 3) l'ambiente/contesto naturale, 4) un dettaglio ravvicinato iconico
- NON usare mai la parola stessa, il suo sinonimo inglese diretto, né termini della stessa categoria generica
- Le immagini risultanti devono permettere di intuire la parola anche senza vederla esplicitamente
- Usa aggettivi e sostantivi descrittivi che Unsplash restituirebbe come foto chiare e riconoscibili

ESEMPI CORRETTI:
- Per "Ippopotamo": ["africa river submerged", "massive jaws open", "thick grey skin", "mud pool wildlife"]
- Per "Guanto": ["leather hand protection", "boxing wrist wrap", "winter hand glove", "baseball mitt catch"]
- Per "Leone": ["golden mane close-up", "savanna grass stalking", "pride resting sunset", "roaring teeth wild"]

ESEMPI SBAGLIATI (troppo vaghi o sinonimi diretti):
- Per "Ippopotamo": ["river", "yawn", "calf", "nostrils"] ← parole singole ambigue
- Per "Leone": ["lion", "animal", "cat", "wildlife"] ← sinonimi diretti

REGOLA per il SUGGERIMENTO:
- Una frase breve in italiano che aiuta senza rivelare la parola
- Deve fare riferimento a caratteristiche visive o comportamentali distintive

Rispondi ESCLUSIVAMENTE con JSON testuale crudo, NESSUN markdown (no \`\`\`json):
{"parola": "parola italiana", "parole_immagini": ["frase 2-3 parole", "frase 2-3 parole", "frase 2-3 parole", "frase 2-3 parole"], "suggerimento": "suggerimento breve"}`;
}