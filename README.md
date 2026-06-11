# Portfolio Data Science Backend

Backend minimal para publicar proyectos de Data Science desde Markdown en GitHub.

## Que hace

- Recibe webhooks de GitHub en `POST /webhooks/github`.
- Verifica `x-hub-signature-256` con `GITHUB_WEBHOOK_SECRET`.
- Acepta eventos `ping` y `push`.
- En `push`, detecta archivos `.md` agregados, modificados o eliminados.
- Descarga Markdown con GitHub REST API, parsea frontmatter, renderiza HTML sanitizado y guarda metadata en PostgreSQL.
- Expone `GET /projects`, `GET /projects/:slug` y `POST /sync/repo`.

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

- `title`
- `slug`

Campos opcionales:

- `summary`
- `tools`
- `repo_url`
- `demo_url`
- `cover_image`
- `featured`
- `date`

Si `repo_url` falta, se usa la URL del repo de GitHub.

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
