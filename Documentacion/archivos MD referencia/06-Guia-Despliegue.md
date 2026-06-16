# Guía de Despliegue (Frontend)

## Objetivo

Desplegar el frontend construido con Vite como sitio estático.

## Build

```bash
cd frontend
npm install
npm run build
```

Salida: `frontend/dist/`.

## Opción A — Hosting estático (recomendado)

### Netlify

- Build command: `npm run build`
- Publish directory: `dist`
- Base directory: `frontend`

### Vercel

- Framework preset: Vite
- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`

## Opción B — Servir `dist/` con Nginx

Configuración mínima (conceptual):

- Document root apuntando a `dist/`
- Fallback de SPA:
  - cualquier ruta desconocida debe responder `index.html`

Ejemplo de comportamiento esperado:

- `/talento/registro` no existe como archivo, debe servir `index.html` y dejar que React Router renderice la pantalla.

## Variables de entorno

En el estado actual no se requieren variables de entorno. Para integrar backend en el futuro se recomienda:

- `VITE_API_BASE_URL=https://...`

## Docker (propuesta)

El stack menciona Docker. Para un despliegue reproducible del frontend se recomienda una imagen multi-stage:

- Stage 1: build (Node) → genera `dist/`
- Stage 2: runtime (Nginx) → sirve `dist/` con fallback SPA

No se incluye Dockerfile en el repositorio actual; la implementación se definirá cuando el pipeline de despliegue quede confirmado.

## Checklist

- `npm run lint` pasa.
- `npm run build` genera `dist/` sin errores.
- El servidor de hosting está configurado como SPA (fallback a `index.html`).
