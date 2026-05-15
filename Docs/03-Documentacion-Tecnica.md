# Documentación Técnica (Frontend)

## Stack implementado

- UI: React 18
- Bundler/dev server: Vite 5
- Lenguaje: TypeScript
- Estilos: Tailwind CSS
- Router: react-router-dom

Referencia: `frontend/package.json` y `frontend/vite.config.mjs`.

## Alcance

Este repositorio implementa exclusivamente el frontend. No hay backend ni conexión real a base de datos; los flujos de autenticación y sesión se simulan para permitir navegar la experiencia.

## Arquitectura — Feature-Sliced Design (FSD)

El código vive en `frontend/src/` y se organiza en capas FSD:

- `app/`: composición de la aplicación (providers, router, estilos globales)
- `pages/`: pantallas enrutables (landing, login, registros, dashboards)
- `features/`: acciones/escenarios de negocio encapsulados (login, registro, logout, onboarding)
- `entities/`: entidades del dominio del frontend (sesión)
- `shared/`: utilidades reutilizables (UI kit, config, helpers)

Regla práctica:

- `pages` orquesta UI de alto nivel.
- `features` contiene lógica accionable y side-effects del lado cliente (navegación, state updates).
- `entities` define estado y contratos de datos para el frontend (Session).
- `shared` contiene componentes y utilidades genéricas sin conocimiento del dominio.

## Enrutamiento

El router se define en `frontend/src/app/router/index.tsx`.

Rutas principales (ver `frontend/src/shared/config/routes.ts`):

- `/` Landing
- `/portal` Portal dual (Talento/Empresas)
- `/login` Login talento
- `/talento/registro` Registro talento
- `/onboarding` Onboarding talento (protegido)
- `/dashboard` Dashboard talento (protegido)
- `/empresa/login` Login empresa
- `/empresa/registro` Registro empresa
- `/empresa/dashboard` Dashboard empresa (protegido)

Protección de rutas:

- `ProtectedRoute` valida `isAuthenticated` y opcionalmente `role`.
- Si falla, redirige a `/portal`.

## Sesión (mock)

La entidad `session` centraliza autenticación simulada y persistencia:

- Persistencia: `localStorage` bajo la key `firststep.session.v1`
- Estado: `isAuthenticated`, `role`, `userName`, `companyName`, `onboardingCompleted`
- API de sesión: `loginTalent`, `loginCompany`, `completeOnboarding`, `logout`

Providers:

- `AppProviders` monta `SessionProvider` + `BrowserRouter`.

## UI y estilos

- Tailwind: configuración en `frontend/tailwind.config.js` + `frontend/postcss.config.js`
- Estilos globales: `frontend/src/app/styles/index.css`
- UI kit: `frontend/src/shared/ui/` (`Button`, `Input`, `Checkbox`, `Select`, `PasswordField`)

## Flujos implementados (pantallas)

Recursos base: `frontend/Mock/` (HTML de referencia).

Talento:

- Login: `/login`
- Registro: `/talento/registro`
- Onboarding: `/onboarding`
- Dashboard: `/dashboard`

Empresa:

- Login: `/empresa/login`
- Registro: `/empresa/registro`
- Dashboard: `/empresa/dashboard`

## Calidad y validación

Scripts del proyecto:

- `npm run lint`: `tsc --noEmit` (typecheck)
- `npm run doctor`: React Doctor (diagnóstico de salud del codebase)
- `npm run build`: build de producción (TypeScript + Vite)

## Extensión prevista (sin backend aún)

Para evolucionar hacia backend/BD:

- Mantener `features` como punto de integración de llamadas HTTP (fetch/axios) y manejo de efectos.
- Mantener `entities` para estado normalizado y modelos de datos.
- Introducir un `shared/api` con cliente HTTP, interceptores y tipado.

La especificación propuesta de entidades y endpoints se incluye en `05-Especificaciones-Funcionales.md` y los diagramas en `04-Diagramas.md`.
