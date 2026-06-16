# Troubleshooting (Resolución de problemas)

## 1) `npm` no se reconoce en PowerShell

Síntomas:

- `npm : El término 'npm' no se reconoce...`

Acciones:

1. Verificar instalación:

```powershell
where.exe node
where.exe npm
node -v
npm -v
```

2. Si Node está instalado pero no aparece:
   - Cerrar y reabrir la terminal/IDE para recargar PATH.
   - Revisar variables de entorno del usuario y del sistema.

## 2) El navegador muestra página en blanco

Acciones:

- Verificar consola del navegador (F12).
- Verificar errores en terminal (`npm run dev`).
- Borrar caché del navegador si el build previo quedó en memoria.

## 3) Error de rutas al refrescar (404 en `/empresa/login`, etc.)

Causa:

- Hosting sin fallback de SPA.

Solución:

- Configurar el servidor para que responda `index.html` en rutas desconocidas (ver `06-Guia-Despliegue.md`).

## 4) `EADDRINUSE: address already in use` (puerto ocupado)

Solución:

- Cambiar puerto:

```bash
cd frontend
npm run dev -- --port 5174
```

## 5) Cambios no se reflejan / diagnósticos raros en el editor

Acciones:

- Reiniciar el servidor de TypeScript del editor.
- Reabrir el workspace completo (a veces tras grandes moves de carpetas).

## 6) `npm install` falla con dependencias nativas

Acciones:

- Verificar que `node` es accesible (PATH).
- Reintentar con una terminal nueva.
- Borrar `node_modules` y `package-lock.json` solo si se entiende el impacto.

## 7) Sesión “se pierde” o se comporta raro

Causa:

- La sesión es mock y depende de `localStorage`.

Acciones:

- Borrar `localStorage` del sitio (DevTools → Application → Storage).
- Cerrar sesión desde la UI para resetear el estado.
