/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SITE_URL?: string;
  readonly PUBLIC_WHATSAPP_NUMBER?: string;
  readonly CONTACT_EMAIL?: string;
  readonly CONTACT_FORM_RECIPIENT?: string;
  readonly DATABASE_URL?: string;
  readonly AUTO_RUN_MIGRATIONS?: string;
  readonly PGHOST?: string;
  readonly PGPORT?: string;
  readonly PGUSER?: string;
  readonly PGPASSWORD?: string;
  readonly PGDATABASE?: string;
  readonly ADMIN_USERNAME?: string;
  readonly ADMIN_PASSWORD?: string;
  readonly ADMIN_SESSION_SECRET?: string;
  readonly CLOUDINARY_CLOUD_NAME?: string;
  readonly CLOUDINARY_API_KEY?: string;
  readonly CLOUDINARY_API_SECRET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
