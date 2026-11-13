# ---------- Etapa 1: build (compila o TypeScript) ----------
FROM node:22 AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---------- Etapa 2: imagem final, só com o necessário ----------
FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
COPY --from=build /app/node_modules ./node_modules
RUN npm prune --omit=dev

COPY --from=build /app/dist ./dist
RUN mkdir -p uploads

EXPOSE 3333

CMD ["node", "dist/server.js"]
