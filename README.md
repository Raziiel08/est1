# EST1 - Sistema digital de mantenimiento escolar

Sistema web para reportar y hacer seguimiento de problemas de
mantenimiento del colegio.

## Cómo levantarlo

1. `npm install`
2. `npm run dev`

Desde Registrarse se puede crear un usuario de cada rol (estudiante o
docente, técnico, administrador) para probar los distintos recorridos.

## Roles

En esta versión el rol se elige al registrarse, para poder simular los
tres tipos de usuario sin depender de que el colegio los dé de alta. El
rol activo se muestra en la barra superior. Los permisos no dependen
solo de ocultar botones: están reforzados con políticas RLS en la base
de datos, así que aunque alguien edite el cliente no puede, por
ejemplo, cambiar el estado de un reporte ajeno sin ser técnico o
administrador.

## Por qué necesita backend

Varias personas tienen que ver y actualizar los mismos reportes desde
distintos dispositivos, y los permisos por rol tienen que cumplirse de
verdad y no solo en la interfaz. Con `localStorage` cada navegador
tendría su propia copia de los datos, sin sincronizar entre
dispositivos, y cualquiera con acceso a las devtools podría cambiar un
estado sin que nada lo frene. Para un sistema donde técnico,
estudiantes/docentes y administrador trabajan sobre los mismos
registros, esa limitación lo hace inviable como solución final. Lo
único que queda del lado del cliente es la sesión de autenticación
(la maneja `supabase-js`), para no tener que volver a loguearse en
cada visita.

## Eliminar vs cancelar

Los reportes no se borran. Para sacar uno de circulación se usa el
estado `cancelado`, y el cambio queda igual en `historial_estados`. El
borrado real queda para datos sin historial, como una ubicación mal
cargada, y solo el administrador puede hacerlo.

## Estructura

```
src/
  views/            Login, Registro, Inicio, Nuevo reporte,
                     Lista de reportes, Detalle, Estadísticas
  services/
    authStore.js        Sesión y perfil del usuario
    reportesService.js  CRUD de reportes contra Supabase
  router/index.js     Rutas + guards por sesión y por rol
  supabase.js          Cliente de Supabase
supabase/
  schema.sql           Tablas, relaciones, RLS y datos de prueba
```

## Esquema de datos

- `perfiles` — extiende `auth.users` con nombre y rol.
- `ubicaciones` — aulas, baños, patio, pañol, server, taller.
- `categorias` — tipo de problema (electricidad, plomería, etc.).
- `reportes` — ubicación, categoría, autor y técnico asignado.
- `historial_estados` — un registro por cada cambio de estado, con
  quién lo hizo, cuándo y un comentario. Es append-only: no tiene
  políticas de update ni delete.

## Seguridad

La clave `anon` de Supabase puede ir en el cliente (vía `.env`, que
está en `.gitignore`). La clave `service_role` no se usa en ningún
lado: toda la seguridad se apoya en las políticas RLS de
`schema.sql`. Las operaciones muestran mensajes de carga, error y
confirmación.

## Qué falta

- Pantalla de administración para gestionar usuarios y ubicaciones, y
  para que el administrador asigne reportes a un técnico en particular
  (hoy el técnico se autoasigna al tomar un reporte).
- Subida real de fotos (Supabase Storage).
- Notificaciones cuando cambia el estado de un reporte propio.
