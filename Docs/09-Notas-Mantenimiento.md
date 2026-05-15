# Notas de Mantenimiento

## Objetivo

Este documento resume prácticas recomendadas para mantener el frontend consistente, escalable y fácil de evolucionar.

## Calidad mínima

Antes de integrar cambios:

```bash
cd frontend
npm run lint
npm run build
npm run doctor
```

## Convenciones del proyecto

- Mantener Feature-Sliced Design:
  - UI de pantallas en `pages/*/ui`
  - Lógica de escenarios (acciones) en `features/*/model`
  - Estado y API local del dominio (frontend) en `entities/*/model`
  - Componentes atómicos y genéricos en `shared/ui`
- Mantener rutas en `shared/config/routes.ts`.
- Evitar lógica de sesión dispersa: toda la sesión se gestiona en `entities/session`.

## Evolución hacia backend real

Cuando se implemente backend:

- Reemplazar `SessionProvider` mock por llamadas reales de login/registro.
- Conservar el contrato del estado local (role, onboardingCompleted) para mantener la UX.
- Implementar cliente HTTP en `shared/api` con tipado y manejo de errores.

## Seguridad (cuando haya backend)

- No guardar JWT en `localStorage` si se prioriza seguridad (considerar cookies HttpOnly).
- Usar hashing seguro en backend (bcrypt) y JWT con expiración corta y rotación.
- Sanitizar entradas, validar payloads y aplicar control de acceso por rol.

## Gestión de dependencias

- Revisar actualizaciones de `react`, `vite`, `typescript` periódicamente.
- Mantener `react-router-dom` en una versión compatible con React 18.
- Si se añade ESLint/Prettier en el futuro, definir reglas en un solo lugar y automatizar en CI.

## Estrategia de releases (propuesta)

- Mantener versiones semánticas (MAJOR.MINOR.PATCH).
- Actualizar `08-CHANGELOG.md` en cada cambio relevante de UI/arquitectura.

## Checklist de revisión de PR (propuesto)

- No rompe rutas existentes.
- No introduce dependencias innecesarias.
- Mantiene patrones FSD y reutiliza `shared/ui`.
- No duplica lógica de navegación ni estado en páginas.
