# 🚀 FirstStep

Plataforma de empleo juvenil — React/Vite · Node.js/Express · Supabase · Ollama

---

## Estructura del monorepo

```
FirstStep/
├── frontend/          React + Vite + TypeScript + Tailwind
├── backend/           Node.js + Express + TypeScript + Supabase
├── .github/workflows/ CI/CD con GitHub Actions
├── docker-compose.yml Desarrollo local (frontend + backend + ollama)
└── .env.example       Plantilla de variables de entorno
```

---

## Desarrollo local con Docker

```bash
# 1. Copia y edita el .env
cp .env.example .env

# 2. Levanta todo (primera vez construye las imágenes)
docker-compose up --build

# 3. Accesos
#    Frontend  →  http://localhost:5173
#    Backend   →  http://localhost:3001
#    Ollama    →  http://localhost:11434

# 4. Descargar un modelo en Ollama (primera vez)
docker exec -it firststep-ollama ollama pull llama3

# Ver logs de un servicio
docker-compose logs -f backend

# Apagar
docker-compose down
```

---

## Despliegue en AWS (GitHub Actions)

Los pipelines se disparan automáticamente al hacer push a `main`:

| Workflow | Se activa cuando cambia… | EC2 destino |
|---|---|---|
| `deploy-frontend.yml` | `frontend/**` | EC2 Frontend `:80` |
| `deploy-backend.yml` | `backend/**` | EC2 Backend `:3001` |
| `deploy-ollama.yml` | Manual / workflow file | EC2 IA `:11434` |

### Secrets requeridos en GitHub

Ve a **Settings → Secrets and variables → Actions** y agrega:

```
DOCKERHUB_USERNAME      tu usuario de Docker Hub
DOCKERHUB_TOKEN         token de Docker Hub (Account Settings → Security)

EC2_USER                ec2-user
EC2_SSH_KEY             contenido completo del .pem de AWS
EC2_HOST_FRONTEND       IP pública del EC2 frontend
EC2_HOST_BACKEND        IP pública del EC2 backend
EC2_HOST_IA             IP pública del EC2 ollama

DATABASE_URL            postgresql://...supabase.co:5432/postgres
JWT_SECRET              string secreto largo
JWT_EXPIRES_IN          15m
BCRYPT_ROUNDS           10
CORS_ORIGIN             http://<EC2_FRONTEND_IP>
SUPABASE_JWKS_URL       https://<ref>.supabase.co/auth/v1/.well-known/jwks
SUPABASE_JWKS_BASE64    (opcional)
SUPABASE_JWT_SECRET     (opcional)

VITE_API_URL            http://<EC2_BACKEND_IP>:3001
VITE_OLLAMA_URL         http://<EC2_IA_IP>:11434
```

> ⚠️ **AWS Academy:** Las IPs cambian al pausar el lab. Actualiza los secrets `EC2_HOST_*` y `VITE_*` cada vez que reinicies la sesión.

```bash
# Actualización rápida con GitHub CLI
gh secret set EC2_HOST_FRONTEND --body "nueva.ip"
gh secret set EC2_HOST_BACKEND  --body "nueva.ip"
gh secret set EC2_HOST_IA       --body "nueva.ip"
gh secret set VITE_API_URL      --body "http://nueva.ip.backend:3001"
gh secret set VITE_OLLAMA_URL   --body "http://nueva.ip.ia:11434"
```

---

## Comandos útiles en EC2 (por SSH)

```bash
# Ver contenedores corriendo
docker ps

# Ver logs en tiempo real
docker logs firststep-backend -f
docker logs firststep-frontend -f

# Reiniciar manualmente
docker restart firststep-backend

# Limpiar disco
docker system prune -f

# Ollama: modelos disponibles
ollama list

# Ollama: descargar otro modelo
ollama pull mistral
```
