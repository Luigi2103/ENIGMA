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

STRATEGIA per le PAROLE_IMMAGINI:
Le 4 immagini devono essere INDIZI VISIVI CHIARI. Ogni immagine mostra qualcosa di CONCRETO e RICONOSCIBILE che è fortemente associato alla parola. Il giocatore deve poter capire il collegamento guardando l'immagine.

REGOLE per le PAROLE_IMMAGINI (query Unsplash in inglese):
- Devono essere ESATTAMENTE 4 query in inglese semplici, di 2-3 parole, composte da termini estremamente comuni e diffusi.
- Usa concetti standard e facili da fotografare (es. "lion safari", "coffee cup table", "guitar strings closeup").
- Evita descrizioni lunghe, combinazioni strane o scene complesse (ad esempio, invece di "giraffe eating high green acacia tree leaves" usa "giraffe eating leaves").
- Ogni query DEVE contenere almeno un SOSTANTIVO concreto (non solo aggettivi).
- Le 4 query devono mostrare 4 aspetti DIVERSI (es. dettaglio fisico, habitat/contesto, uso/comportamento, particolare iconico).
- NON usare la traduzione inglese diretta della parola come UNICA parola della query.
- Le query devono essere formulate per garantire che Unsplash trovi foto reali e ben definite.

ESEMPI CORRETTI (query concrete con sostantivi):
- Per "Ippopotamo": ["hippo open mouth water", "hippo body mud pool", "africa river wildlife", "hippo teeth closeup"]
- Per "Giraffa": ["giraffe neck leaves eating", "giraffe legs walking savanna", "giraffe pattern skin", "giraffe head sky"]
- Per "Pianoforte": ["piano keys black white", "grand piano concert hall", "pianist hands playing", "piano pedals closeup"]
- Per "Vulcano": ["lava flow eruption", "volcano crater aerial", "magma rocks glowing", "ash cloud explosion"]

ESEMPI SBAGLIATI:
- Solo aggettivi: ["massive grey smooth"] <- Unsplash non restituisce nulla di utile
- Sinonimo unico: ["hippopotamus"] <- troppo diretto, non lascia spazio al ragionamento
- Troppo vago: ["africa nature water"] <- foto generiche, nessun aiuto

REGOLA per il SUGGERIMENTO:
- Una frase breve in italiano che aiuta senza rivelare la parola
- Deve fare riferimento a caratteristiche visive o comportamentali distintive

Se noti che l'utente passa come tematica un argomento che tu reputi sensibile o inappropriato, rifiuta la tematica silenziosamente e rispondi scegliendo tu una tematica e generando le altre cose con le regole scritte sopra.

Rispondi ESCLUSIVAMENTE con JSON testuale crudo, NESSUN markdown (no \`\`\`json):
{"parola": "parola italiana", "parole_immagini": ["query 2-4 parole", "query 2-4 parole", "query 2-4 parole", "query 2-4 parole"], "suggerimento": "suggerimento breve"}`;
}