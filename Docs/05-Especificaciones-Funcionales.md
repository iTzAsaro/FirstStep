# Especificaciones Funcionales

## 1) Roles

### Talento

Usuario final que crea su perfil, completa onboarding y consume el dashboard personal.

### Empresa

Usuario corporativo que registra su organización y accede a un dashboard de empresa (mock en el frontend actual).

## 2) Alcance actual (frontend)

- Landing con acceso a 4 rutas de autenticación (login/registro por rol).
- Portal dual (pantalla de acceso diferenciada por “Talento” y “Empresas”).
- Sesión mock (persistencia en `localStorage`) para habilitar navegación.
- Rutas protegidas por rol:
  - Talento: onboarding y dashboard.
  - Empresa: dashboard empresa.

## 3) Historias de usuario (MVP)

### 3.1) Talento — Registro

- Como talento, quiero registrarme con email y contraseña para iniciar mi experiencia.
- Criterios de aceptación:
  - Si email está vacío, no permite enviar.
  - Si contraseña es menor a 8 caracteres, no permite enviar.
  - Al enviar, se crea sesión mock y se navega a onboarding.

### 3.2) Talento — Login

- Como talento, quiero iniciar sesión para continuar donde lo dejé.
- Criterios de aceptación:
  - Si email o contraseña están vacíos, no permite enviar.
  - Al enviar, se crea sesión mock.
  - Si onboarding no está completo, navega a onboarding.
  - Si onboarding está completo, navega al dashboard.

### 3.3) Talento — Onboarding

- Como talento, quiero completar onboarding para habilitar el dashboard.
- Criterios de aceptación:
  - Al completar, se marca `onboardingCompleted=true` en sesión.
  - El dashboard queda accesible mediante ruta protegida.

### 3.4) Talento — Dashboard

- Como talento, quiero ver un panel con mi estado y accesos.
- Criterios de aceptación:
  - Se muestra una bienvenida usando el nombre normalizado del email.
  - Se permite cerrar sesión.

### 3.5) Empresa — Registro

- Como empresa, quiero registrar mi organización para acceder al portal corporativo.
- Criterios de aceptación:
  - Requiere nombre de empresa, email, tamaño de empresa, contraseña y aceptar términos.
  - Al enviar, se crea sesión mock con `role=empresa` y se navega al dashboard de empresa.

### 3.6) Empresa — Login

- Como empresa, quiero iniciar sesión para acceder al dashboard corporativo.
- Criterios de aceptación:
  - Requiere nombre de empresa, email y contraseña (mock).
  - Al enviar, se crea sesión mock y se navega al dashboard de empresa.

### 3.7) Empresa — Dashboard (mock)

- Como empresa, quiero acceder a un panel inicial para luego integrar módulos (vacantes, candidatos, etc.).
- Criterios de aceptación:
  - Ruta protegida por rol empresa.
  - Permite cerrar sesión.

## 4) Requisitos no funcionales (NFR)

- UX: navegación clara entre roles, textos consistentes, estados deshabilitados en formularios.
- Mantenibilidad: estructura FSD, componentes reutilizables en `shared/ui`.
- Calidad: `npm run lint` (typecheck) y `npm run doctor`.
- Seguridad (futuro backend): JWT, bcrypt, sanitización (definido en stack.md).

## 5) Contrato API (propuesto, futuro)

Este proyecto no implementa backend, pero para avanzar sin fricción se propone:

- `POST /auth/talent/signup` → crea usuario talento
- `POST /auth/talent/login` → retorna JWT
- `POST /auth/company/signup` → crea empresa + usuario corporativo
- `POST /auth/company/login` → retorna JWT
- `GET /me` → retorna perfil del usuario autenticado
- `PATCH /talent/profile` → actualiza perfil / onboarding

## 6) Modelo de datos (propuesto, futuro)

Ver ERD en `04-Diagramas.md`.
