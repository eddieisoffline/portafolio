# Portafolio de Data & Analytics Engineering

Código del portafolio de Eduardo Anica González, en producción en **https://www.databyeduardoan.dev** (español en `/es`, inglés en `/en`).

Cada proyecto vive en su propio repositorio de GitHub y publica un `case-study.md`. Este repo no guarda el contenido de los proyectos: lo sincroniza desde GitHub.

- `./`: backend Fastify (TypeScript). Recibe los webhooks de GitHub, renderiza el Markdown como HTML sanitizado y lo guarda en PostgreSQL.
- `./frontend`: frontend Astro SSR. Solo consume `GET /projects` y `GET /projects/:slug`; no lee ni parsea Markdown.

## Proyectos publicados

Al 2026-11-02 el sitio muestra dos casos de estudio, los dos destacados:

| Proyecto | Repositorio | Flujo de datos | Fecha |
|----------|-------------|----------------|-------|
| [Plataforma de datos para concesionarias en Google Cloud](https://www.databyeduardoan.dev/es/projects/auto-dealer-data-platform) | [`auto-dealer-data-platform`](https://github.com/eddieisoffline/auto-dealer-data-platform) | Kaggle → Cloud Storage → BigQuery → Power BI, a diario en Cloud Run. Las cifras son sintéticas. | 2026-10-05 |
| [Mercado automotriz de México con datos vivos del INEGI](https://www.databyeduardoan.dev/es/projects/inegi-auto-market) | [`inegi-auto-market`](https://github.com/eddieisoffline/inegi-auto-market) | INEGI y Banxico → Cloud Storage → BigQuery → Looker Studio, con pronóstico, a diario en Cloud Run. Dashboard público. | 2026-10-14 |

La lista viva está en `/es/projects`. La API (`GET /projects`) es la fuente: si un proyecto no aparece ahí, tampoco aparece en el sitio.

## Cómo llega un proyecto al sitio

```text
push al repo del proyecto
  └─► GitHub manda un POST firmado a /webhooks/github
        └─► el backend verifica la firma y que el repo esté en ALLOWED_REPOS
              └─► baja solo los .md de ese push con la API de GitHub
                    └─► parsea, sanitiza y guarda en PostgreSQL
                          └─► el frontend lo muestra en la siguiente request
```

- Un `.md` sin `title` y `slug` en el frontmatter se omite. Por eso los README y los docs de cada repo no aparecen.
- Si se borra un `.md` del repo, se borra su proyecto.
- `POST /sync/repo` hace lo mismo sin esperar un push (ver [Sincronización manual](#sincronización-manual)).

Qué se muestra y dónde:

- Home: "Destacados" son los 4 proyectos más recientes con `featured: true`. Si ninguno lo tiene, se usan los 4 más recientes. "Últimos casos de estudio" son los 3 siguientes; si no queda ninguno, la sección no aparece (hoy está oculta, porque los dos proyectos son destacados).
- `/projects`: la lista completa, con filtro por herramienta (`?tool=`) que compara el texto exacto de `tools`.
- Cada tarjeta muestra los primeros 6 `tools` y corta el `summary` a 3 líneas.

## Contrato de `case-study.md`

La plantilla está en [`examples/project.md`](examples/project.md). Frontmatter:

```yaml
title: { es: "...", en: "..." }
slug: "kebab-case-unico"
summary: { es: "...", en: "..." }   # 220 caracteres como máximo
tools: ["Python", "pandas", "SQL"]  # el orden importa: la tarjeta muestra los primeros 6
repo_url: "https://github.com/eddieisoffline/<repo>"
cover_image: "https://raw.githubusercontent.com/eddieisoffline/<repo>/main/docs/img/<captura>.png"
featured: true
date: "AAAA-MM-DD"
```

- Obligatorios: `title` y `slug`. `title` y `summary` aceptan un texto plano (formato anterior) o un objeto `{ es, en }`.
- Opcionales: `summary`, `tools`, `repo_url`, `demo_url`, `cover_image`, `featured` y `date`.
- Si falta `repo_url`, se usa `https://github.com/<owner>/<repo>`.
- Si `cover_image` es una URL de GitHub tipo `github.com/.../blob/...?raw=true`, el backend la convierte a `raw.githubusercontent.com`.
- `dashboard_url` no existe en el esquema. Los dashboards se enlazan en el cuerpo del caso de estudio.
- Nombres de `tools` que ya usa el filtro: `Python`, `pandas`, `SQL`, `statsmodels`, `BigQuery`, `Cloud Storage`, `Cloud Run`, `DuckDB`, `Looker Studio`, `Power BI`, `Terraform`, `Docker`, `pytest`, `GitHub Actions`, `Spark`, `Delta Lake`. Un nombre con otra grafía (`Pandas`, `GCS`) crea otro filtro.

Cuerpo:

- Un bloque por idioma, con las mismas secciones en el mismo orden. Si falta una traducción, la API responde con el otro idioma.

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

- Sin HTML crudo, sin comentarios `<!-- -->` y sin Mermaid: el sitio los mostraría como texto o como código. Los diagramas van en bloques ```` ```text ````.
- Enlaces e imágenes con URL absoluta. En la versión en inglés, los enlaces a documentos en español llevan "(in Spanish)".
- Secciones, en este orden: Problema; Estado (solo si el proyecto está en curso); Arquitectura; Dashboard o Evidencia; Lo que ya funciona o Metodología; Hallazgos sobre la fuente; Lo que dicen los datos; Decisiones de diseño; Stack; Datos (fuente, licencia, atribución y docs).

El backend también lee el formato anterior, con `### Español` y `### English` dentro de cada sección:

```md
## Problema

### Español

Contenido en español.

### English

English content.
```

## Despliegue en producción

| Pieza | Dónde |
|-------|-------|
| Frontend | Vercel, root directory `frontend`, dominio `www.databyeduardoan.dev` (el dominio sin `www` redirige ahí) |
| Backend | Vercel, root directory `./`. `src/app.ts` exporta el handler por defecto y crea la app de Fastify una vez por instancia |
| Base de datos | PostgreSQL gestionado en Neon |

- Cada push a `master` redespliega los dos proyectos de Vercel.
- Un cambio de variables de entorno en Vercel solo aplica después de un Redeploy.
- Un cambio en un `case-study.md` llega al sitio cuando se hace push al repo de ese proyecto, no a este.

## Frontend Astro

### Instalación

Requiere Node.js 22.12 o superior (`frontend/.nvmrc` fija la 22).

```bash
cd frontend
npm install
```

### Variables de entorno

Copia `frontend/.env.example` a `frontend/.env`:

```bash
PUBLIC_API_URL=http://localhost:3000
PUBLIC_SITE_URL=http://localhost:4321
LOG_LEVEL=info
RESEND_API_KEY=
CONTACT_TO_EMAIL=
CONTACT_FROM_EMAIL=
```

`PUBLIC_API_URL` apunta al backend que expone:

- `GET /projects?lang=es|en`
- `GET /projects/:slug?lang=es|en`

En producción, `PUBLIC_API_URL` debe usar HTTPS y no puede apuntar a `localhost`. El cliente corta la petición a los 8 segundos.
`PUBLIC_SITE_URL` se usa para las URL canónicas, Open Graph, Twitter Card, `robots.txt` y `sitemap.xml`. En producción debe ser el dominio público, `https://www.databyeduardoan.dev`. Si no se configura, el frontend usa el origen de la request.

`RESEND_API_KEY`, `CONTACT_TO_EMAIL` y `CONTACT_FROM_EMAIL` son privadas del servidor Astro. No lleven prefijo `PUBLIC_`.

### Correr en local

En una terminal, el backend:

```bash
npm install
docker compose up -d
npm run migrate
npm run dev
```

En otra, Astro:

```bash
cd frontend
npm run dev
```

Para ver el sitio con los proyectos publicados sin levantar el backend, apunta `PUBLIC_API_URL` al backend de producción. Astro hace el fetch del lado del servidor, así que CORS no aplica.

### Build y preview

```bash
cd frontend
npm run check
npm run build
npm run preview
```

`npm run check` también falla si a `es` o a `en` les falta una llave de `src/lib/i18n.ts`, donde está todo el texto visible.

### Despliegue del frontend

SSR en Vercel con `@astrojs/vercel`:

1. Root directory: `frontend`.
2. Variables: `PUBLIC_API_URL` con la URL HTTPS del backend y `PUBLIC_SITE_URL` con el dominio público.
3. Build command: `npm run build`.
4. Output: lo gestiona el adaptador de Vercel.

Para Netlify o Cloudflare Pages, cambia el adaptador oficial de Astro en `frontend/astro.config.mjs` y conserva `output: "server"`.

### Dashboards de Looker Studio

Los dashboards se enlazan dentro del caso de estudio (por ejemplo, el de `inegi-auto-market`). La CSP del frontend ya permite iframes de Looker Studio y existe el componente `LookerEmbed.astro`, pero hoy no se renderiza: depende de un `dashboardUrl` que el backend no guarda. Para activarlo hay que agregar `dashboard_url` al esquema del frontmatter y a la migración, y mover el texto del componente a `i18n.ts`.

### Seguridad del HTML

`contentHtml` se inyecta solo en `ProseContent.astro`. Ese HTML llega sanitizado desde el backend, que usa `markdown-it` con HTML crudo desactivado y `sanitize-html` como segunda barrera contra XSS.

## Seguridad y privacidad

- La API usa una política CORS restrictiva: solo los orígenes de `CORS_ORIGINS` pueden leer `GET /projects` y `GET /projects/:slug` desde el navegador.
- En desarrollo se permiten los orígenes locales de Astro. En producción se configura solo el dominio público del portafolio, sin wildcard `*`.
- Los secretos van en variables de entorno, fuera de Git y sin prefijo `PUBLIC_`: `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, `GITHUB_WEBHOOK_SECRET`, `GITHUB_TOKEN` y `SYNC_TOKEN`.
- El formulario de contacto envía solo lo que la persona escribe y usa Resend para mandarlo. Tiene honeypot y rate limit del lado del servidor.
- El sitio usa Vercel Web Analytics, con métricas agregadas y sin cookies de seguimiento, y una cookie funcional, `portfolio_locale`, para recordar el idioma.
- Los datos de los proyectos publicados deben ser públicos, sintéticos o anonimizados. No se publican credenciales, información confidencial de empresas ni datos personales identificables.
- La política de privacidad está en `/es/privacy` y `/en/privacy`.

---

# Backend

API que publica los casos de estudio a partir del Markdown de cada repo en GitHub.

## Qué hace

- Recibe webhooks de GitHub en `POST /webhooks/github` y verifica `x-hub-signature-256` con `GITHUB_WEBHOOK_SECRET`.
- Acepta eventos `ping` y `push`. En un `push`, procesa los `.md` agregados, modificados o eliminados.
- Descarga el Markdown con la API REST de GitHub, valida el frontmatter, renderiza HTML sanitizado y guarda el resultado en PostgreSQL.
- Expone `GET /projects`, `GET /projects/:slug` y `POST /sync/repo`.
- Los endpoints de proyectos aceptan `?lang=es|en` y devuelven `title`, `summary` y `contentHtml` en ese idioma.

## Stack

- Node.js 20.11 o superior
- Fastify
- TypeScript
- PostgreSQL con SQL directo (`pg`)
- `gray-matter` y `zod` para el frontmatter
- `markdown-it` y `sanitize-html`
- Vitest

## Variables de entorno

Copia `.env.example` a `.env` y ajusta los valores:

```bash
PORT=3000
LOG_LEVEL=info
CORS_ORIGINS=http://localhost:4321,http://127.0.0.1:4321
DATABASE_URL=postgres://portfolio:portfolio@localhost:5432/portfolio
MIGRATION_DATABASE_URL=
TEST_DATABASE_URL=postgres://portfolio:portfolio@localhost:5433/portfolio_test
GITHUB_WEBHOOK_SECRET=change-me
GITHUB_TOKEN=
SYNC_TOKEN=change-me-too
ALLOWED_REPOS=your-user/your-project,another-user/another-project
SYNC_ON_STARTUP=true
```

- `CORS_ORIGINS` es una lista separada por comas. En producción lleva solo el dominio público del frontend (`https://www.databyeduardoan.dev`), sin wildcard.
- `GITHUB_TOKEN` es opcional para repos públicos (sin él, GitHub permite 60 peticiones por hora) y obligatorio para repos privados.
- `ALLOWED_REPOS` es la lista de repos `owner/repo` que aceptan el webhook y `POST /sync/repo`. Se compara en minúsculas.
- `SYNC_TOKEN` se envía como `Authorization: Bearer <SYNC_TOKEN>`.
- `MIGRATION_DATABASE_URL` es opcional; `npm run migrate` la usa si existe y, si no, usa `DATABASE_URL`.
- `SYNC_ON_STARTUP` sincroniza todos los repos de `ALLOWED_REPOS` al arrancar. Por defecto está activo en desarrollo y apagado en producción y en tests.

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
npm run typecheck
```

Los tests de firma y de Markdown corren sin base de datos. Los de PostgreSQL se saltan si no existe `TEST_DATABASE_URL`.

Para correrlos con base de datos en PowerShell:

```powershell
docker compose up -d postgres_test
$env:TEST_DATABASE_URL="postgres://portfolio:portfolio@localhost:5433/portfolio_test"
npm test
```

En macOS o Linux:

```bash
TEST_DATABASE_URL=postgres://portfolio:portfolio@localhost:5433/portfolio_test npm test
```

## Webhook de GitHub

En el repo del proyecto:

1. `Settings` → `Webhooks` → `Add webhook`.
2. Payload URL: `https://<backend>/webhooks/github`.
3. Content type: `application/json`.
4. Secret: el mismo valor de `GITHUB_WEBHOOK_SECRET`.
5. Eventos: `Just the push event`. Al crearlo, GitHub manda un `ping`, que debe responder `200`.

El repo también tiene que estar en `ALLOWED_REPOS`. Si no, el webhook responde `403 repo_not_allowed`.

### Probar el webhook en local con ngrok

```bash
npm run dev
ngrok http 3000
```

Usa la URL HTTPS de ngrok como Payload URL:

```text
https://<subdominio-ngrok>/webhooks/github
```

## Sincronización manual

`POST /sync/repo` descarga y procesa el Markdown sin esperar un webhook.

```bash
curl -X POST http://localhost:3000/sync/repo \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer change-me-too" \
  -d '{
    "owner": "your-user",
    "repo": "your-project",
    "ref": "main",
    "paths": ["case-study.md"]
  }'
```

Sin `paths`, el backend lista todos los `.md` del repo con la API de Trees de GitHub.

## i18n del frontend

El frontend sirve rutas por idioma:

- `/es` y `/en`
- `/es/projects` y `/en/projects`
- `/es/projects/:slug` y `/en/projects/:slug`

Las rutas sin idioma (`/` y `/projects`) redirigen según la cookie `portfolio_locale`. Sin cookie, se usa `Accept-Language`: español si empieza con `es` y, en cualquier otro caso, inglés. El selector del header cambia de idioma y conserva la ruta.

## Despliegue fuera de Vercel

En un host Node tradicional:

1. Crea una base PostgreSQL gestionada.
2. Configura las variables de entorno.
3. `npm run build`.
4. `npm run migrate`.
5. `npm start` (arranca `src/server.ts` compilado).
6. Apunta el webhook de GitHub al dominio público.

## Decisiones técnicas

- Fastify, por su integración con TypeScript, sus rutas claras y su bajo overhead.
- PostgreSQL desde la primera versión, para no tener que migrar desde SQLite después.
- SQL directo con `pg`, para que el backend siga siendo pequeño y fácil de leer.
- `markdown-it` con HTML crudo desactivado y `sanitize-html` como segunda barrera contra XSS.
- El webhook y la sincronización manual comparten `SyncService`, así que se comportan igual.

## Pendientes conocidos

- **Mayúsculas en el nombre del repo.** `ALLOWED_REPOS` se pasa a minúsculas y la sincronización al arrancar guarda el repo así, pero el webhook usa el nombre tal como lo manda GitHub. En un repo con mayúsculas, la actualización choca con el `slug` existente y se omite. El arreglo es normalizar `repoFullName` a minúsculas en `SyncService` (`syncPush` y `syncRepo`). Mientras tanto, los repos nuevos van en minúsculas.
- **`LookerEmbed.astro` sin uso.** Ver [Dashboards de Looker Studio](#dashboards-de-looker-studio).
