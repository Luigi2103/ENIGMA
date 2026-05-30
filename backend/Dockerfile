FROM node:20-alpine

# Imposta la directory di lavoro all'interno del container
WORKDIR /usr/src/app

# Copia package.json e package-lock.json (se presente)
COPY package*.json ./

# Installa le dipendenze
RUN npm install

# Copia tutto il resto del codice
COPY . .

# Espone la porta su cui gira l'app
EXPOSE 3000

# Comando per avviare l'applicazione in modalità produzione
CMD ["npm", "run", "dev"]
