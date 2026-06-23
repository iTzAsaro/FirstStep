<div align="center">

# 🚀 FirstStep — Career Co-Pilot

### *Tu primer paso al mundo laboral, potenciado por IA*

> **Rompemos el círculo vicioso del desempleo juvenil profesional.**
> Para trabajar necesitas experiencia. Para tener experiencia necesitas trabajar.
> **FirstStep cambia eso.**

[![React](https://img.shields.io/badge/React_18-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)](https://docker.com)
[![AWS](https://img.shields.io/badge/AWS_EC2-FF9900?style=flat&logo=amazonaws&logoColor=white)](https://aws.amazon.com)

</div>

---

## ¿Qué es FirstStep?

**FirstStep** es una plataforma web de empleabilidad juvenil que conecta a **recién egresados y estudiantes** con **empresas** dispuestas a apostar por talento con alto potencial, sin exigir experiencia previa.

El mercado laboral tiene un problema estructural: las empresas piden experiencia, pero los jóvenes no pueden obtenerla sin que alguien les dé la primera oportunidad. FirstStep resuelve eso desde ambos lados:

- **Para el Talento (jóvenes):** una plataforma que destaca sus habilidades, formación y potencial real — no su historial laboral.
- **Para las Empresas:** acceso a una bolsa de candidatos jóvenes pre-filtrados, listos para aprender y crecer dentro de la organización.

El diferencial de FirstStep es la **inteligencia artificial integrada**: un asistente conversacional que guía al usuario en la construcción de su CV, simula entrevistas técnicas y de recursos humanos, y entrega retroalimentación personalizada — como tener un coach de carrera disponible 24/7.

---

## ✨ Funcionalidades principales

### Para el Talento (egresados y estudiantes)
- **Registro y onboarding guiado** — flujo paso a paso para completar el perfil profesional con habilidades, educación y áreas de interés.
- **Constructor de CV con IA** *(en optimización)* — asistente conversacional que recopila la información del usuario y genera un CV estructurado y descargable en PDF, optimizado para pasar filtros ATS.
- **Bolsa de oportunidades** — listado de ofertas publicadas por empresas, con filtros por área, modalidad y nivel de experiencia requerida. Incluye modal de postulación directa.
- **Perfil de empresa** — vista pública de cada empresa con descripción, industria y ofertas activas.
- **Mensajería directa** *(en desarrollo)* — canal de comunicación entre Talento y Empresa.
- **Simulador de entrevistas con IA** *(en optimización)* — sesiones de práctica con preguntas adaptadas al cargo, con feedback en tiempo real.
- **Chat general con IA** *(en optimización)* — asistente libre para consultas sobre empleabilidad, habilidades blandas y preparación laboral.

### Para la Empresa
- **Registro y onboarding empresarial** — alta del perfil corporativo con descripción, industria y datos de contacto.
- **Dashboard de gestión** — vista centralizada de las ofertas publicadas y postulaciones recibidas.
- **Publicación de ofertas** — formulario para crear y administrar vacantes dirigidas a jóvenes profesionales.
- **Descubrimiento de talentos** — revisión de perfiles de candidatos que han postulado.

---

## 🛠️ Stack tecnológico

### Frontend

| Tecnología | Rol |
|---|---|
| **React 18** | Framework de interfaz de usuario |
| **Vite** | Bundler ultrarrápido con Hot Module Replacement |
| **TypeScript** | Tipado estático end-to-end |
| **Tailwind CSS** | Utilidades de estilos y diseño responsivo |
| **React Router DOM v6** | Enrutamiento del lado del cliente con rutas protegidas |
| **Feature-Sliced Design** | Arquitectura modular escalable (app / pages / features / entities / shared) |
| **Supabase JS** | Cliente para autenticación y tiempo real |
| **Vitest + Testing Library** | Pruebas unitarias y de integración |

### Backend

| Tecnología | Rol |
|---|---|
| **Node.js + Express.js** | API REST del servidor |
| **TypeScript** | Tipado estático y mejor mantenibilidad |
| **Supabase (PostgreSQL)** | Base de datos relacional en la nube |
| **JWT (jsonwebtoken)** | Autenticación stateless por tokens |
| **bcryptjs** | Hash seguro de contraseñas |
| **Jest** | Pruebas unitarias del backend |

### Inteligencia Artificial

| Tecnología | Rol |
|---|---|
| **Ollama** | Motor local para ejecutar LLMs sin depender de APIs externas |
| **llama3.1 (Meta)** | Modelo de lenguaje para el asistente conversacional |
| **Streaming NDJSON** | Generación de respuestas token a token para UX fluida |

### Infraestructura y DevOps

| Tecnología | Rol |
|---|---|
| **Docker + Docker Compose** | Contenedorización de todos los servicios (frontend, backend, Ollama) |
| **Nginx** | Servidor web del frontend y reverse proxy |
| **GitHub Actions** | CI/CD para despliegue automático en AWS |
| **AWS EC2** | Hosting en la nube (3 instancias: frontend, backend, IA) |

---

## 🏗️ Arquitectura del proyecto

FirstStep es un **monorepo fullstack** organizado con una arquitectura en tres capas:

```
FirstStep/
├── frontend/                   # SPA React + Vite + TypeScript
│   ├── src/
│   │   ├── app/                # Providers, router global, estilos base
│   │   ├── pages/              # Vistas completas (una por ruta)
│   │   │   ├── landing/
│   │   │   ├── login-portal/
│   │   │   ├── login-user/
│   │   │   ├── login-company/
│   │   │   ├── signup-talent/
│   │   │   ├── signup-company/
│   │   │   ├── onboarding-user/
│   │   │   ├── onboarding-company/
│   │   │   ├── dashboard-user/
│   │   │   ├── dashboard-company/
│   │   │   ├── opportunities-user/
│   │   │   ├── companies-user/
│   │   │   ├── company-public/
│   │   │   ├── messages-talent/
│   │   │   ├── cv-builder/     # Constructor de CV con IA
│   │   │   ├── chat/           # Chat general con IA
│   │   │   └── interview/      # Simulador de entrevistas con IA
│   │   ├── features/           # Lógica de negocio por feature (auth, onboarding)
│   │   ├── entities/           # Modelos de dominio (session, ollama-session)
│   │   └── shared/             # API clients, config, UI primitives, lib utils
│   ├── Dockerfile
│   └── nginx.conf
│
├── backend/                    # API REST Node.js + Express + TypeScript
│   └── src/
│       ├── modules/
│       │   ├── auth/           # Autenticación JWT + bcrypt
│       │   ├── talent/         # Perfiles de talento
│       │   ├── company/        # Perfiles de empresa
│       │   ├── jobs/           # Ofertas laborales
│       │   ├── cv/             # Almacenamiento de CVs generados
│       │   └── ai/             # Proxy hacia Ollama
│       ├── routes/             # Express routes (auth, talent, company, jobs, cv, ai, files, catalog)
│       └── shared/             # DB (Supabase), middleware (JWT, RBAC, error handler), validadores
│
├── scripts/                    # Herramientas de migración y seed de datos
├── docker-compose.yml          # Entorno local unificado (frontend + backend + ollama)
└── .github/
    └── workflows/
        ├── deploy-frontend.yml
        ├── deploy-backend.yml
        └── deploy-ollama.yml
```

### Flujo de autenticación

```
Usuario → Frontend (React)
       → POST /api/auth/login (Express)
       → Valida credenciales en Supabase/PostgreSQL
       → Retorna JWT firmado
       → Frontend guarda token → accede a rutas protegidas (ProtectedRoute)
```

### Flujo de IA (Constructor de CV / Chat / Entrevistas)

```
Usuario escribe → Frontend hace streaming fetch a /ollama/api/chat
               → Nginx/Vite proxy → Ollama (llama3.1)
               → Respuesta NDJSON token a token → UI actualiza en tiempo real
               → Extracción JSON del CV → Vista previa + descarga PDF
```

---

## 🧑‍💻 Equipo de desarrollo

El proyecto fue construido íntegramente por un equipo de tres desarrolladores fullstack, estudiantes de la carrera de **Ingeniería en Informática** en **DuocUC — Escuela de Informática y Telecomunicaciones**.

| Integrante | Rol principal | Área de enfoque |
|---|---|---|
| **Alexsander Rosales Pérez** | Fullstack Developer | Arquitectura del monorepo, infraestructura Docker/AWS, integración de IA (Ollama), CI/CD con GitHub Actions, Feature-Sliced Design en frontend, API REST backend |
| **Dairys Sánchez Olmedo** | Fullstack Developer | Diseño de interfaces, flujos de usuario (onboarding, dashboard), componentes React, lógica de autenticación frontend |
| **Yael Núñez Quintero** | Fullstack Developer | Módulos de backend (jobs, company, talent, cv), base de datos Supabase/PostgreSQL, lógica de negocio y validaciones |

---

## 🚀 Inicio rápido (Desarrollo local con Docker)

### Prerrequisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo
- Al menos **8 GB de RAM** disponibles para Docker
- Al menos **10 GB de espacio libre** en disco (la imagen de Ollama + el modelo `llama3.1` suman ~6-7 GB)

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/firstep.git
cd firstep/Producto
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales de Supabase y los valores del JWT:

```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
JWT_SECRET=un-string-secreto-largo-y-seguro
JWT_EXPIRES_IN=15m
BCRYPT_ROUNDS=10
CORS_ORIGIN=http://localhost:5173
SUPABASE_JWKS_URL=https://[REF].supabase.co/auth/v1/.well-known/jwks
VITE_API_URL=http://localhost:3001
```

### 3. Levantar todos los servicios

```bash
docker-compose up -d --build
```

### 4. Descargar el modelo de IA (primera vez)

```bash
docker exec -it firststep-ollama ollama pull llama3.1
```

> ⏱️ Este paso puede tardar varios minutos según tu conexión (~4.9 GB de descarga).
> El modelo queda almacenado en el volumen Docker `ollama-data` y no necesita descargarse de nuevo.

### 5. Acceder a la aplicación

| Servicio | URL |
|---|---|
| **Frontend** | http://localhost:5173 |
| **Backend API** | http://localhost:3001 |
| **Ollama** | http://localhost:11434 |

### Comandos útiles

```bash
# Ver logs en tiempo real
docker-compose logs -f backend
docker-compose logs -f frontend

# Detener todos los servicios
docker-compose down

# Detener y eliminar volúmenes (⚠️ borrará la BD y el caché de Ollama)
docker-compose down -v

# Reconstruir solo el frontend (tras cambios de código)
docker-compose up -d --build frontend
```

---

## ☁️ Despliegue en producción (AWS + GitHub Actions)

El proyecto tiene CI/CD completo con **tres pipelines independientes** que se disparan automáticamente al hacer push a `main`:

| Workflow | Trigger | Instancia EC2 |
|---|---|---|
| `deploy-frontend.yml` | Cambios en `frontend/**` | EC2 Frontend — Nginx `:80` |
| `deploy-backend.yml` | Cambios en `backend/**` | EC2 Backend — Node.js `:3001` |
| `deploy-ollama.yml` | Manual / cambios en el workflow | EC2 IA — Ollama `:11434` |

### Secrets requeridos en GitHub

Navega a **Settings → Secrets and variables → Actions** del repositorio y configura:

```
# Docker Hub
DOCKERHUB_USERNAME
DOCKERHUB_TOKEN

# Acceso SSH a EC2
EC2_USER                  ec2-user
EC2_SSH_KEY               contenido completo del .pem
EC2_HOST_FRONTEND         IP pública del EC2 frontend
EC2_HOST_BACKEND          IP pública del EC2 backend
EC2_HOST_IA               IP pública del EC2 ollama

# Variables de entorno del backend
DATABASE_URL
JWT_SECRET
JWT_EXPIRES_IN
BCRYPT_ROUNDS
CORS_ORIGIN
SUPABASE_JWKS_URL

# Variables de build del frontend
VITE_API_URL              http://<IP_BACKEND>:3001
VITE_OLLAMA_URL           http://<IP_IA>:11434
```

> ⚠️ **Nota para AWS Academy:** Las IPs de las instancias cambian al pausar/reanudar el lab. Actualiza los secrets `EC2_HOST_*` y `VITE_*` con las nuevas IPs cada sesión:
>
> ```bash
> gh secret set EC2_HOST_FRONTEND --body "nueva.ip"
> gh secret set VITE_API_URL      --body "http://nueva.ip:3001"
> ```

---

## 🗄️ Base de datos

FirstStep usa **Supabase** (PostgreSQL administrado) como base de datos principal. El esquema incluye las siguientes entidades:

| Tabla | Descripción |
|---|---|
| `users` | Usuarios del sistema (talento y empresas) con roles diferenciados |
| `talent_profiles` | Perfil profesional del talento: skills, educación, áreas de interés |
| `company_profiles` | Perfil corporativo: descripción, industria, tamaño |
| `jobs` | Ofertas laborales publicadas por empresas |
| `job_applications` | Postulaciones de talentos a ofertas |
| `cvs` | CVs generados por el asistente de IA, asociados a perfiles |

El script de inicialización está en `backend/sql/schema.sql` y los datos de prueba en `scripts/seed.ts`.

---

## 🤖 Módulo de IA

El asistente de FirstStep funciona 100% **local y sin depender de APIs externas de pago**, lo que garantiza privacidad de datos y costo operativo cercano a cero.

### Cómo funciona

1. El frontend hace una petición de streaming a `/ollama/api/chat` (proxy en Vite/Nginx).
2. El proxy redirige la petición al contenedor `firststep-ollama` (puerto 11434).
3. Ollama ejecuta el modelo `llama3.1` y devuelve la respuesta token a token en formato NDJSON.
4. El frontend recibe el stream y actualiza la interfaz en tiempo real.
5. Para el CV Builder: al finalizar la conversación, se realiza una segunda llamada para extraer los datos en formato JSON estructurado y renderizar la vista previa del CV.

### Modelo utilizado

| Modelo | Tamaño | Uso |
|---|---|---|
| `llama3.1:latest` (Meta) | ~4.9 GB | Chat general, construcción de CV, simulación de entrevistas |

> Para hardware con recursos limitados (CPU sin GPU dedicada), se recomienda `llama3.2:3b` (~2 GB) como alternativa más liviana:
> ```bash
> docker exec -it firststep-ollama ollama pull llama3.2:3b
> ```

---

## 🧪 Testing

El proyecto tiene cobertura de pruebas en ambas capas:

### Frontend (Vitest + React Testing Library)
```bash
cd frontend
npm run test          # Ejecutar pruebas
npm run test:coverage # Ver informe de cobertura
```

Pruebas incluidas: rutas protegidas, hooks de autenticación, rendering de páginas, lógica de formateo de oportunidades, store de sesión, utils.

### Backend (Jest + Supertest)
```bash
cd backend
npm run test          # Ejecutar pruebas
npm run test:coverage # Ver informe de cobertura
```

Pruebas incluidas: endpoints REST (auth, jobs, company, talent, cv, ai), repositorios, servicios, middleware JWT, validadores.

---

## 📁 Documentación adicional

El proyecto cuenta con documentación técnica completa en la carpeta `Documentacion/`:

| Documento | Contenido |
|---|---|
| `01-Guia-Inicio-Rapido.md` | Setup paso a paso para nuevos desarrolladores |
| `02-Manual-Usuario.md` | Guía de uso para usuarios finales |
| `03-Documentacion-Tecnica.md` | Arquitectura, decisiones de diseño, ADRs |
| `04-Diagramas.md` | Diagramas de flujo, ER, secuencia y componentes |
| `05-Especificaciones-Funcionales.md` | Historias de usuario y criterios de aceptación |
| `06-Guia-Despliegue.md` | Manual detallado de despliegue en AWS |
| `07-Troubleshooting.md` | Solución de problemas comunes |
| `08-CHANGELOG.md` | Historial de cambios por versión |

---

## 🗺️ Roadmap

- [x] Autenticación JWT con roles (Talento / Empresa)
- [x] Onboarding guiado para ambos tipos de usuario
- [x] Dashboard de talento con perfil profesional
- [x] Dashboard de empresa con gestión de ofertas
- [x] Bolsa de oportunidades con filtros y postulación
- [x] Perfiles públicos de empresa
- [x] Constructor de CV con IA (arquitectura lista, en optimización de infraestructura)
- [x] Chat con IA (arquitectura lista, en optimización de infraestructura)
- [x] Simulador de entrevistas (arquitectura lista, en optimización de infraestructura)
- [x] CI/CD completo con GitHub Actions + AWS EC2
- [ ] Notificaciones en tiempo real (Supabase Realtime)
- [ ] Sistema de mensajería Empresa ↔ Talento
- [ ] Panel de analytics para empresas
- [ ] App móvil (React Native)

---

## 📄 Licencia

Este proyecto fue desarrollado como proyecto académico para **DuocUC — Escuela de Informática y Telecomunicaciones** y forma parte del programa de la carrera de Ingeniería en Informática.

---

<div align="center">

**Hecho con ❤️ en Chile 🇨🇱**

*Alexsander Rosales · Dairys Sánchez · Yael Núñez*

*DuocUC — Escuela de Informática y Telecomunicaciones · 2026*

</div>
