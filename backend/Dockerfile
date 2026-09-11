# =====================================================================
# Image Docker de production pour le backend RESTO QR PRO
# =====================================================================
FROM node:20-alpine

WORKDIR /app

# Installe uniquement les dépendances de production, en profitant du
# cache Docker (plus rapide sur les déploiements suivants)
COPY package*.json ./
RUN npm install --omit=dev

# Copie le reste du code du backend
COPY . .

EXPOSE 5000

CMD ["node", "src/server.js"]
