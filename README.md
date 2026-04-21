# Industrias MM

Sitio corporativo en Astro + TypeScript con contenido local en markdown, SEO tecnico y arquitectura orientada a dominio.

## Scripts

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run check`
- `npm run cms:proxy`

## Estructura

- `src/content`: productos, servicios, proyectos, páginas y blog
- `src/lib/content`: acceso y transformacion de contenido
- `src/lib/seo`: metadata, breadcrumbs y JSON-LD
- `src/components`: UI, layout y componentes por dominio
- `src/layouts`: composicion de paginas

## CMS

Se agrego un panel en `/admin` con Decap CMS para administrar:

- categorias de productos
- productos

Archivos clave:

- `public/admin/index.html`
- `public/admin/config.yml`

Para editar en local:

1. Inicializa el proyecto como repositorio Git si aun no lo has hecho.
2. Ejecuta `npm run dev`.
3. En otra terminal ejecuta `npm run cms:proxy`.
4. Abre `/admin`.

## Despliegue En Netlify

La configuracion del CMS ya esta preparada para Netlify usando `git-gateway`.

Archivos clave:

- `src/pages/admin.astro`
- `public/admin/config.yml`
- `netlify.toml`

Proceso recomendado:

1. Sube este proyecto a GitHub.
2. En Netlify crea un sitio nuevo desde ese repositorio.
3. Netlify usara:
   - build command: `npm run build`
   - publish directory: `dist`
4. En Netlify ve a `Project configuration > Identity` y activa `Identity`.
5. En `Registration`, usa `Invite only` si solo quieres acceso para editores invitados.
6. En `External providers`, activa Google o GitHub si quieres login social.
7. En `Services > Git Gateway`, activa `Git Gateway`.
8. Invita usuarios desde Identity.
9. Entra al CMS desde `https://tu-dominio/admin/`.

Costo estimado a fecha de 2026-04-21:

- Netlify Free: `0 USD/mes`, con limite de 300 credits/mes.
- Netlify Identity: incluida sin costo adicional en planes credit-based.

Esto hace que la opcion mas simple para empezar sea normalmente `0 USD/mes`, siempre que tu trafico y despliegues entren en el plan gratuito.

Segun la documentacion oficial de Decap CMS, Astro debe servir el `admin/` desde `public/`, el panel puede cargarse desde CDN, y el modo local usa `local_backend` junto a `npx decap-server`. Fuentes:

- https://decapcms.org/docs/install-decap-cms/
- https://decapcms.org/docs/working-with-a-local-git-repository/
- https://decapcms.org/docs/widgets/
- https://decapcms.org/docs/git-gateway-backend/
- https://decapcms.org/docs/choosing-a-backend/
- https://docs.netlify.com/manage/security/secure-access-to-sites/identity/get-started/
- https://docs.netlify.com/manage/security/secure-access-to-sites/git-gateway/
- https://www.netlify.com/pricing/
- https://docs.netlify.com/manage/security/secure-access-to-sites/identity/plans-and-pricing/
