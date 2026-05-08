# Autenticación (Frontend)

Este proyecto implementa dos flujos de autenticación en frontend: **usuarios empresariales** y **usuarios normales**.

## Objetivo

- Tener flujos separados (empresa/usuario) con UI, validación, manejo de errores y recuperación de contraseña.
- Mantener la arquitectura escalable para evolucionar ambos flujos sin mezclar responsabilidades.

## Arquitectura (FSD)

- `pages/` contiene pantallas/rutas:
  - `login` selección de tipo de login
  - `company-login` registro empresarial (pantalla basada en mockup)
  - `company-login/sign-in` inicio de sesión empresarial
  - `company-forgot-password` recuperación empresarial
  - `company-dashboard` pantalla protegida de ejemplo
  - `user-login` registro de usuario normal
  - `user-sign-in` inicio de sesión de usuario normal
  - `user-forgot-password` recuperación de usuario normal
  - `user-dashboard` pantalla protegida de ejemplo
- `features/` encapsula casos de uso:
  - `company-auth/login` formulario + validación + llamada a API
  - `company-auth/password-recovery` formulario + validación + llamada a API
  - `company-auth/register` formulario + validación + llamada a API
  - `user-auth/login` formulario + validación + llamada a API
  - `user-auth/register` formulario + validación + llamada a API
  - `user-auth/password-recovery` formulario + validación + llamada a API
- `processes/` mantiene procesos transversales:
  - `processes/auth` estado de sesión en memoria + guards de rutas (empresa/usuario)
- `shared/` contiene utilidades y UI reutilizable:
  - `shared/api/httpClient.ts` wrapper fetch JSON
  - `shared/config/env.ts` variables de entorno
  - `shared/lib/validation/validators.ts` validaciones comunes
  - `shared/ui/*` componentes base (Button, TextField)

## Rutas

- `/login` selección de login (empresa/usuario)
- `/login/company` registro empresarial
- `/login/company/sign-in` inicio de sesión empresarial
- `/login/company/forgot-password` recuperación de contraseña empresarial
- `/dashboard/company` ruta protegida (requiere sesión empresarial)
- `/login/user` registro usuario normal
- `/login/user/sign-in` inicio de sesión usuario normal
- `/login/user/forgot-password` recuperación de contraseña usuario normal
- `/dashboard/user` ruta protegida (requiere sesión usuario normal)

## Contratos esperados con el Backend

El frontend está preparado para integrarse con endpoints HTTP (recomendado sobre HTTPS):

### Login empresa

`POST /api/auth/company/login`

Body:
```json
{
  "companyName": "Acme Tech",
  "email": "admin@company.com",
  "password": "********"
}
```

Response:
```json
{
  "user": {
    "id": "company_123",
    "companyName": "Acme Tech",
    "email": "admin@company.com",
    "kind": "company"
  }
}
```

### Recuperación de contraseña (solicitud)

`POST /api/auth/company/forgot-password`

Body:
```json
{
  "companyName": "Acme Tech",
  "email": "admin@company.com"
}
```

Response:
```json
{ "ok": true }
```

### Registro usuario

`POST /api/auth/user/register`

Body:
```json
{
  "fullName": "Alex Johnson",
  "email": "user@firststep.com",
  "password": "********"
}
```

Response:
```json
{ "ok": true }
```

### Login usuario

`POST /api/auth/user/login`

Body:
```json
{
  "email": "user@firststep.com",
  "password": "********"
}
```

Response:
```json
{
  "user": {
    "id": "user_123",
    "fullName": "Alex Johnson",
    "email": "user@firststep.com",
    "kind": "user"
  }
}
```

### Recuperación usuario (solicitud)

`POST /api/auth/user/forgot-password`

Body:
```json
{
  "email": "user@firststep.com"
}
```

Response:
```json
{ "ok": true }
```

## Seguridad (criterios)

En el frontend:
- No se almacena la contraseña.
- No se persiste el token en `localStorage`. La sesión actual vive en memoria para el demo.
- Las llamadas usan `credentials: "include"` para permitir un enfoque recomendado con **cookie httpOnly** cuando exista backend.

En el backend (recomendado para cumplir el requisito):
- Hash de contraseñas con `bcrypt` o `argon2`.
- Protección contra fuerza bruta (rate limit), bloqueo temporal y logging seguro.
- Tokens/sesión:
  - Preferencia: cookie `httpOnly`, `secure`, `sameSite` apropiado.
  - Alternativa: access token corto + refresh token rotativo, evitando `localStorage`.

## Modo mock (solo desarrollo)

Si no hay backend aún, se puede activar un modo de prueba:

- `VITE_USE_MOCK_AUTH=true`
- Credenciales demo:
  - Company: `Acme Tech`
  - Email: `admin@company.com`
  - Password: `Password123`
  - User Email: `user@firststep.com`
  - User Password: `Password123`

Esto permite validar el flujo UI y la ruta protegida (`/dashboard/company`) sin comprometer credenciales reales.

## Nota de implementación

El estado de sesión del demo vive en memoria. Cuando exista backend, el enfoque recomendado es manejar sesión por cookie httpOnly o tokens de corta duración, manteniendo el frontend sin persistir secretos.
