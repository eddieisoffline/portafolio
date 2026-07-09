# Portfolio Data Science

Monorepo ligero para un portafolio profesional de Data Science:

- `./` contiene el backend Fastify que sincroniza Markdown desde GitHub, lo renderiza como HTML sanitizado y lo guarda en PostgreSQL.
- `./frontend` contiene el frontend Astro SSR que consume `GET /projects` y `GET /projects/:slug`.

El frontend no lee Markdown local ni duplica el parseo del backend.

## Frontend Astro

### Instalacion

Requiere Node.js 20.19+ para evitar avisos de engine en dependencias transitivas de Astro/Vite.

```bash
cd frontend
npm install
```

### Variables de entorno

Copia `frontend/.env.example` a `frontend/.env`:

```bash
PUBLIC_API_URL=http://localhost:3000
RESEND_API_KEY=
CONTACT_TO_EMAIL=
CONTACT_FROM_EMAIL=
```

`PUBLIC_API_URL` debe apuntar al backend que expone:

- `GET /projects?lang=es|en`
- `GET /projects/:slug?lang=es|en`

Las variables `RESEND_API_KEY`, `CONTACT_TO_EMAIL` y `CONTACT_FROM_EMAIL` son privadas del servidor Astro. No uses prefijo `PUBLIC_` para ellas.

### Correr en local

En una terminal, levanta el backend:

```bash
npm install
docker compose up -d
npm run migrate
npm run dev
```

En otra terminal, levanta Astro:

```bash
cd frontend
npm run dev
```

### Build y preview

```bash
cd frontend
npm run check
npm run build
npm run preview
```

### Despliegue del frontend

El frontend queda configurado para SSR en Vercel con `@astrojs/vercel`.

En Vercel:

1. Usa `frontend` como root directory.
2. Configura `PUBLIC_API_URL` con la URL publica del backend.
3. Build command: `npm run build`.
4. Output: Astro lo gestiona con el adaptador de Vercel.

Para Netlify o Cloudflare Pages, cambia el adaptador oficial de Astro en `frontend/astro.config.mjs` y conserva `output: "server"`.

### Dashboards Looker Studio

Si un proyecto incluye `dashboardUrl`, la pagina de detalle renderiza un iframe responsive con carga lazy. El dashboard debe estar publicado o compartido con permisos compatibles con embed desde Looker Studio.

### Seguridad del HTML

`contentHtml` se renderiza en el frontend solo dentro de `ProseContent.astro`. Ese HTML debe venir sanitizado desde el backend. El backend actual usa `markdown-it` con HTML crudo desactivado y `sanitize-html` como segunda barrera contra XSS.

---

# Backend

Backend minimal para publicar proyectos de Data Science desde Markdown en GitHub.

## Que hace

- Recibe webhooks de GitHub en `POST /webhooks/github`.
- Verifica `x-hub-signature-256` con `GITHUB_WEBHOOK_SECRET`.
- Acepta eventos `ping` y `push`.
- En `push`, detecta archivos `.md` agregados, modificados o eliminados.
- Descarga Markdown con GitHub REST API, parsea frontmatter, renderiza HTML sanitizado y guarda metadata en PostgreSQL.
- Expone `GET /projects`, `GET /projects/:slug` y `POST /sync/repo`.
- Los endpoints de proyectos aceptan `?lang=es|en` y devuelven `title`, `summary` y `contentHtml` localizados.

## Stack

- Node.js 20+
- Fastify
- TypeScript
- PostgreSQL con SQL directo (`pg`)
- `gray-matter`
- `markdown-it`
- `sanitize-html`
- Vitest

## Variables de entorno

Copia `.env.example` a `.env` y ajusta valores:

```bash
PORT=3000
DATABASE_URL=postgres://portfolio:portfolio@localhost:5432/portfolio
TEST_DATABASE_URL=postgres://portfolio:portfolio@localhost:5433/portfolio_test
GITHUB_WEBHOOK_SECRET=change-me
GITHUB_TOKEN=
SYNC_TOKEN=change-me-too
ALLOWED_REPOS=your-user/your-project,another-user/another-project
```

Notas:

- `GITHUB_TOKEN` es opcional para repos publicos, pero recomendado por rate limit y necesario para repos privados.
- `ALLOWED_REPOS` protege `POST /sync/repo`; usa nombres tipo `owner/repo`.
- `SYNC_TOKEN` se envia como `Authorization: Bearer <SYNC_TOKEN>`.

## Desarrollo local

```bash
npm install
docker compose up -d
npm run migrate
npm run dev
```

La API queda en `http://localhost:3000`.

## Tests

```bash
npm test
```

Los tests de firma y Markdown corren sin base de datos. Los tests de repositorio PostgreSQL se saltan si `TEST_DATABASE_URL` no existe.

Para correrlos con base de datos:

```bash
docker compose up -d postgres_test
$env:TEST_DATABASE_URL="postgres://portfolio:portfolio@localhost:5433/portfolio_test"
npm test
```

En macOS/Linux:

```bash
TEST_DATABASE_URL=postgres://portfolio:portfolio@localhost:5433/portfolio_test npm test
```

## Webhook de GitHub

En tu repo de GitHub:

1. Ve a `Settings` -> `Webhooks` -> `Add webhook`.
2. Payload URL: `https://tu-dominio.com/webhooks/github`.
3. Content type: `application/json`.
4. Secret: el mismo valor de `GITHUB_WEBHOOK_SECRET`.
5. Eventos: `Just the push event` y deja que GitHub envie `ping` al crear el webhook.

## Probar webhook local con ngrok

```bash
npm run dev
ngrok http 3000
```

Usa la URL HTTPS de ngrok como payload URL:

```text
https://<subdominio-ngrok>/webhooks/github
```

## Sincronizacion manual

`POST /sync/repo` descarga y procesa Markdown sin esperar un webhook.

```bash
curl -X POST http://localhost:3000/sync/repo \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer change-me-too" \
  -d '{
    "owner": "your-user",
    "repo": "your-project",
    "ref": "main",
    "paths": ["README.md", "case-study.md"]
  }'
```

Si omites `paths`, el backend lista todos los `.md` del repo con GitHub Trees API.

## Formato Markdown

Ver `examples/project.md`.

Campos requeridos:

- `title` como string legacy o como objeto `{ es, en }`
- `slug`

Campos opcionales:

- `summary` como string legacy o como objeto `{ es, en }`
- `tools`
- `repo_url`
- `demo_url`
- `cover_image` (URL absoluta o ruta relativa como `/images/projects/cover.png`)
- `featured`
- `date`

Si `repo_url` falta, se usa la URL del repo de GitHub.

Para contenido bilingue, usa bloques por idioma:

```md
:::es
## Problema

Contenido en español.
:::

:::en
## Problem

English content.
:::
```

Si falta una traduccion, la API usa el otro idioma disponible como fallback.

Tambien se soporta el formato legacy usado por algunos proyectos existentes:

```md
## Problema

### Español

Contenido en español.

### English

English content.
```

Ese formato separa el cuerpo por idioma durante la sincronizacion. Para traducir titulo y resumen, actualiza el frontmatter a `title.es/title.en` y `summary.es/summary.en`.

## i18n del frontend

El frontend sirve rutas localizadas:

- `/es`
- `/en`
- `/es/projects`
- `/en/projects/:slug`

Las rutas antiguas `/` y `/projects` redirigen al idioma preferido por cookie o `Accept-Language`. El selector del header cambia entre `/es` y `/en` conservando la ruta actual.

## Despliegue

1. Crea una base PostgreSQL gestionada.
2. Configura variables de entorno en el host Node.
3. Ejecuta `npm run build`.
4. Ejecuta migraciones con `npm run migrate`.
5. Arranca con `npm start`.
6. Configura el webhook de GitHub apuntando al dominio publico.

## Decisiones tecnicas

- Fastify por su buena integracion con TypeScript, rutas claras y bajo overhead.
- PostgreSQL desde v1 para evitar migrar fuera de SQLite justo cuando el portafolio empiece a importar.
- SQL directo con `pg` para mantener el backend pequeno y legible.
- `markdown-it` con HTML crudo desactivado y `sanitize-html` como segunda barrera contra XSS.
- Webhooks y sync manual comparten `SyncService`, asi el comportamiento es consistente.
