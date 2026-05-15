# Guía de Inicio Rápido (Frontend)

## Requisitos

- Windows 10/11
- Node.js + npm instalados y disponibles en terminal
- Git (opcional)

## Estructura relevante del repositorio

- `frontend/`: aplicación React (Vite + TypeScript + Tailwind)
- `frontend/src/`: código fuente (Feature-Sliced Design)
- `frontend/Mock/`: recursos HTML de referencia (no se sirven en runtime)
- `Docs/`: documentación del proyecto (este directorio)

## Instalación

Desde la raíz del repo:

```bash
cd frontend
npm install
```

## Ejecutar en desarrollo

```bash
cd frontend
npm run dev
```

Vite mostrará una URL local (por defecto `http://localhost:5173/`).

## Calidad (linting y health-check)

Typecheck (equivalente a linting de TypeScript en este proyecto):

```bash
cd frontend
npm run lint
```

Diagnóstico de calidad con React Doctor:

```bash
cd frontend
npm run doctor
```

## Build de producción (frontend)

```bash
cd frontend
npm run build
```

El resultado queda en `frontend/dist/`.

## Notas rápidas (mock)

El proyecto frontend usa sesión mock en `localStorage` para simular autenticación:

- Talento: login/registro → onboarding → dashboard
- Empresa: login/registro → dashboard empresa (mock)

No hay backend ni BD conectados en este repositorio.
