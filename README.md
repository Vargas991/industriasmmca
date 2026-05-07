# Industrias MM

Sitio corporativo en Astro + TypeScript con frontend publico y panel propio sobre PostgreSQL.

## Stack actual

- Astro en modo `server`
- Adapter `@astrojs/node`
- PostgreSQL con `postgres`
- Render de contenido enriquecido con `marked`
- Panel administrativo propio en `/admin`

## Scripts

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run check`

## Variables de entorno recomendadas

Configura estas variables en tu `.env` antes de usar el panel en serio:

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `DATABASE_URL`
- `AUTO_RUN_MIGRATIONS`
- `PUBLIC_SITE_URL`
- `PUBLIC_WHATSAPP_NUMBER`
- `CONTACT_EMAIL`
- `CONTACT_FORM_RECIPIENT`

Si no usas `DATABASE_URL`, la conexion se arma con:

- `PGHOST`
- `PGPORT`
- `PGUSER`
- `PGPASSWORD`
- `PGDATABASE`

Si no defines `ADMIN_USERNAME` y `ADMIN_PASSWORD`, el panel usa valores por defecto pensados solo para desarrollo local:

- usuario: `admin`
- contrasena: `cambiar-esto`

## Panel propio

La primera version del panel esta operativa en:

- `/admin`

Que hace hoy:

- login por sesion HTTP
- gestion de productos
- gestion de categorias de producto
- persistencia en PostgreSQL
- subida de archivos a Cloudinary desde el admin

## Migracion desde markdown

Los productos existentes en `src/content/products` no se pierden.

La base PostgreSQL se inicializa automaticamente y, si la tabla de productos esta vacia, importa los productos desde los archivos markdown actuales. Desde ese punto, el frontend publico de productos y el panel leen de PostgreSQL.

## Migraciones de base de datos

El esquema se maneja desde `src/lib/db/migrations.ts`. Cada cambio futuro de estructura debe agregarse como una migracion nueva con un `id` unico y ordenado, por ejemplo `002_add_product_price`.

El flujo recomendado es ejecutar migraciones de forma explicita:

```bash
npm run db:migrate
```

El script crea y consulta la tabla `schema_migrations`. Si una migracion ya fue aplicada, no la vuelve a ejecutar; si falta, la ejecuta dentro de una transaccion y luego registra su `id`.

Para desarrollo local puedes activar migraciones automaticas al arrancar la app:

```env
AUTO_RUN_MIGRATIONS=true
```

En produccion se recomienda mantener:

```env
AUTO_RUN_MIGRATIONS=false
```

Reglas recomendadas para evitar perdida de datos:

- No borrar ni recrear tablas en migraciones de produccion.
- Para columnas nuevas, usar `ALTER TABLE ... ADD COLUMN` con `DEFAULT` o permitir `NULL` primero.
- Para renombrar o transformar datos, hacerlo en pasos: crear columna nueva, copiar datos, desplegar codigo compatible, y solo despues retirar la columna vieja.
- Probar cada migracion contra una copia o backup de la base antes de desplegar.
- Hacer backup antes de aplicar migraciones en produccion.

## Alcance actual

En esta fase quedaron migrados:

- productos
- categorias de producto

Siguen todavia en markdown:

- servicios
- proyectos
- paginas
- blog

## Estructura relevante

- `src/lib/db/migrations.ts`: migraciones versionadas de PostgreSQL
- `src/lib/db/products.ts`: capa PostgreSQL de productos
- `src/lib/db/categories.ts`: capa PostgreSQL de categorias
- `src/lib/admin/auth.ts`: autenticacion del panel
- `src/lib/admin/products.ts`: validacion y normalizacion del payload
- `src/lib/admin/categories.ts`: validacion de categorias
- `src/lib/cloudinary.ts`: integracion de subida con Cloudinary
- `src/pages/api/admin/*`: endpoints del panel
- `src/pages/admin/*`: interfaz administrativa
- `src/lib/content/products.ts`: lectura publica de productos conectada a PostgreSQL
- `src/lib/content/productCategories.ts`: lectura publica de categorias conectada a PostgreSQL

## Despliegue recomendado

Como ahora hay escritura en PostgreSQL, este proyecto ya no esta orientado a hosting estatico ni a un flujo Git-based como Decap CMS.

Lo recomendable es desplegarlo en un entorno con base de datos persistente, por ejemplo:

- VPS con Node + PostgreSQL
- Render
- Railway
- Fly.io

Si vas a produccion, configura `DATABASE_URL` hacia una instancia PostgreSQL persistente y con backups.
