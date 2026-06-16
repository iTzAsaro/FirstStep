# Manual de Usuario

## Visión general

FirstStep ofrece dos tipos de cuenta:

- Talento (usuario normal)
- Empresas (usuario corporativo)

La aplicación presenta un Landing Page (inicio) desde el cual se puede elegir el tipo de acceso (login o registro) para cada rol.

## Flujo para Talento

### Registro (Talento)

1. Ir a Inicio (`/`).
2. En la sección “Acceso”, elegir “Talento” → “Registro”.
3. Completar correo, contraseña y aceptar términos.
4. Al finalizar, se inicia sesión (mock) y se redirige al onboarding.

### Login (Talento)

1. Ir a Inicio (`/`).
2. En la sección “Acceso”, elegir “Talento” → “Login”.
3. Ingresar correo y contraseña.
4. Al iniciar sesión (mock), se redirige al onboarding si corresponde, o al dashboard si ya está completo.

### Onboarding (Talento)

1. Completar los pasos solicitados en la pantalla de onboarding.
2. Finalizar para habilitar el acceso al dashboard.

### Dashboard (Talento)

1. Visualizar información de bienvenida y accesos.
2. Desde el dashboard se puede cerrar sesión.

## Flujo para Empresas

### Registro (Empresa)

1. Ir a Inicio (`/`).
2. En la sección “Acceso”, elegir “Empresas” → “Registro”.
3. Completar datos de la empresa, correo y contraseña (mock).
4. Se inicia sesión como empresa (mock) y se redirige al dashboard de empresa.

### Login (Empresa)

1. Ir a Inicio (`/`).
2. En la sección “Acceso”, elegir “Empresas” → “Login”.
3. Completar nombre de empresa, correo y contraseña (mock).
4. Se inicia sesión como empresa (mock) y se redirige al dashboard de empresa.

### Dashboard (Empresa)

1. Visualizar panel de empresa (mock).
2. Usar “Cerrar sesión” para terminar la sesión.

## Notas sobre credenciales

- En este estado del proyecto no existe validación real contra backend.
- El sistema simula autenticación guardando estado en `localStorage`.
- La contraseña solo se utiliza para habilitar/deshabilitar botones de forma local.

## Cerrar sesión

El botón “Cerrar sesión” borra la sesión persistida y devuelve al portal/inicio según el flujo de cada pantalla.
