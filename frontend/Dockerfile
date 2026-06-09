# ╔══════════════════════════════════════════════════════════════════════╗
# ║ Dockerfile  — Frontend (React + Vite + TypeScript)                   ║
# ║ Etapa 1: build   → Node 20 alpine, instala deps, compila TS y Vite   ║
# ║ Etapa 2: runtime → Nginx alpine sirve /dist + proxy /api y /ollama   ║
# ╚══════════════════════════════════════════════════════════════════════╝

# ── Etapa 1: Build ──────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# VITE_* se incrustan en el bundle en build-time (no disponibles en runtime)
ARG VITE_API_URL=http://localhost:3001
ARG VITE_OLLAMA_URL=http://localhost:11434
ARG VITE_SUPABASE_URL=
ARG VITE_SUPABASE_ANON_KEY=
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_OLLAMA_URL=$VITE_OLLAMA_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN npm run build

# ── Etapa 2: Nginx ───────────────────────────────────────────────────────
FROM nginx:1.27-alpine

# URLs a las que Nginx hará proxy (se inyectan como ARG en build)
# En docker-compose local: backend=http://backend:3001, ollama=http://ollama:11434
# En GitHub Actions (EC2): se pasan las IPs reales de cada EC2
ARG BACKEND_URL=http://backend:3001
ARG OLLAMA_URL=http://ollama:11434

COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar la plantilla nginx.conf y sustituir los placeholders con sed
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN sed -i "s|BACKEND_URL_PLACEHOLDER|${BACKEND_URL}|g" /etc/nginx/conf.d/default.conf && \
    sed -i "s|OLLAMA_URL_PLACEHOLDER|${OLLAMA_URL}|g"   /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
