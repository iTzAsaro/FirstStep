# ╔══════════════════════════════════════════════════════════════════════╗
# ║ Dockerfile  — Backend (Node.js + Express + TypeScript)               ║
# ║ Etapa 1: build   → compila TS a JS en /dist                          ║
# ║ Etapa 2: runtime → solo deps de producción + /dist, usuario no-root  ║
# ╚══════════════════════════════════════════════════════════════════════╝

# ── Etapa 1: Compilar TypeScript ─────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json tsconfig.json ./
RUN npm ci

COPY src ./src

# Compila TS → dist/  (según tsconfig.json: outDir = "dist")
RUN npm run build

# ── Etapa 2: Imagen de producción ────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Solo dependencias de producción (sin devDeps)
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copiar el JS compilado desde builder
COPY --from=builder /app/dist ./dist

# Usuario no-root para reducir superficie de ataque
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Puerto que usa Express (PORT env var, default 3001)
EXPOSE 3001

# Punto de entrada: dist/server.js  (main en package.json)
CMD ["node", "dist/server.js"]
