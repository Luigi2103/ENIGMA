FROM node:20-alpine

# Imposta la directory di lavoro all'interno del container
WORKDIR /usr/src/app

# Copia package.json e package-lock.json
COPY package*.json ./

# Installa le dipendenze in modo deterministico
RUN npm install --omit=dev

# Copia tutto il resto del codice
COPY . .

# Espone la porta su cui gira l'app
EXPOSE 3000

# Avvia l'applicazione
CMD ["node", "index.js"]
