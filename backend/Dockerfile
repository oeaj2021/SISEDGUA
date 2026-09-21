FROM node:20-alpine

WORKDIR /app

# Instalar netcat para comprobación de conexión y utilitarios
RUN apk add --no-cache netcat-openbsd

# Instalar dependencias
COPY package*.json ./
RUN npm install --omit=dev

# Copiar código fuente
COPY . .

# Permisos para el script de inicio
RUN chmod +x entrypoint.sh

# Variables por defecto
ENV NODE_ENV=production
ENV PORT=3001
ENV TZ=America/Caracas

EXPOSE 3001

ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "src/app.js"]
