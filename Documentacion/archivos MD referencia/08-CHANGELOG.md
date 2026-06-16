# CHANGELOG

Este registro sigue una estructura simple por versión. No es un release oficial, sino un historial de cambios del repositorio.

## [0.2.0] — 2026-05-15

- Se añadió Landing Page como `/` con sección de acceso por rol (Talento y Empresas) y enlaces a login/registro.
- Se añadieron rutas y páginas dedicadas:
  - Registro Talento (`/talento/registro`)
  - Login Empresa (`/empresa/login`)
  - Dashboard Empresa (`/empresa/dashboard`) con protección por rol
- Se reforzó el flujo de empresa hacia dashboard en registro/login.
- Se consolidó el frontend en `frontend/` (Vite + TS + Tailwind).
- Se configuraron scripts de calidad: `lint`, `doctor`.

## [0.1.0] — 2026-05-15

- Inicialización del frontend (React + Vite + TypeScript + Tailwind).
- Implementación base FSD (`app/pages/features/entities/shared`).
- Implementación de pantallas derivadas de `Mock/`:
  - Portal (Talento/Empresas), login usuario, registro empresa, onboarding usuario, dashboard usuario.
- Sesión mock persistida en `localStorage`.
