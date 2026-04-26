# Industrias MM

Sitio corporativo en Astro + TypeScript con frontend público y panel propio sobre SQLite.

## Stack actual

- Astro en modo `server`
- Adapter `@astrojs/node`
- SQLite con `better-sqlite3`
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
- `CONTENT_DB_PATH`
- `PUBLIC_SITE_URL`
- `PUBLIC_WHATSAPP_NUMBER`
- `CONTACT_EMAIL`
- `CONTACT_FORM_RECIPIENT`

Si no defines `ADMIN_USERNAME` y `ADMIN_PASSWORD`, el panel usa valores por defecto pensados solo para desarrollo local:

- usuario: `admin`
- contraseña: `cambiar-esto`

## Panel propio

La primera migración del panel ya está operativa en:

- `/admin`

Qué hace hoy:

- login por sesión HTTP
- gestión de productos
- gestión de categorías de producto
- persistencia en SQLite
- subida de archivos a Cloudinary desde el admin

## Migración desde markdown

Los productos existentes en `src/content/products` no se pierden.

La base SQLite se inicializa automáticamente y, si la tabla de productos está vacía, importa los productos desde los archivos markdown actuales. Desde ese punto, el frontend público de productos y el panel leen de SQLite.

## Alcance actual

En esta fase quedaron migrados:

- productos
- categorías de producto

Siguen todavía en markdown:

- servicios
- proyectos
- páginas
- blog

## Estructura relevante

- `src/lib/db/products.ts`: capa SQLite de productos
- `src/lib/db/categories.ts`: capa SQLite de categorías
- `src/lib/admin/auth.ts`: autenticación del panel
- `src/lib/admin/products.ts`: validación y normalización del payload
- `src/lib/admin/categories.ts`: validación de categorías
- `src/lib/cloudinary.ts`: integración de subida con Cloudinary
- `src/pages/api/admin/*`: endpoints del panel
- `src/pages/admin.astro`: interfaz administrativa
- `src/lib/content/products.ts`: lectura pública de productos conectada a SQLite
- `src/lib/content/productCategories.ts`: lectura pública de categorías conectada a SQLite

## Despliegue recomendado

Como ahora hay escritura en SQLite, este proyecto ya no está orientado a hosting estático ni a un flujo Git-based como Decap CMS.

Lo recomendable es desplegarlo en un entorno con almacenamiento persistente, por ejemplo:

- VPS con Node
- Render
- Railway
- Fly.io

Si vas a producción, lo ideal es montar el archivo SQLite en un volumen persistente y fijar `CONTENT_DB_PATH` a esa ruta.
