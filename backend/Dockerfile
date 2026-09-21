FROM node:20-alpine

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install --omit=dev

# Copiar código fuente
COPY . .

# Variables por defecto
ENV NODE_ENV=production
ENV PORT=3001
ENV TZ=America/Caracas

EXPOSE 3001

CMD ["node", "src/app.js"]
