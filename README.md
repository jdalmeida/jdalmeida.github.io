# João de Almeida

This repository contains a personal portfolio and article archive. The app uses Go templates, HTMX, and PostgreSQL.

The server renders complete HTML pages. HTMX requests replace event dialogs, article lists, and editor panels.

## Requirements

- Go 1.24 or later
- PostgreSQL 15 or later
- Vercel CLI 56 or later

## Local development

1. Copy `.env.example` to `.env.local`.
2. Set `DATABASE_URL` and `ADMIN_PASSWORD`.
3. Apply the SQL migration in `drizzle/0000_fancy_hemingway.sql`.
4. Start the Go server.

```bash
go run ./cmd/server
```

Open [http://localhost:3000](http://localhost:3000).

The app reads Markdown files from `content/posts` when PostgreSQL is not available. The editor needs PostgreSQL.

## Article API

The portfolio exposes an authenticated JSON API for VXP. The API lists and reads all articles, including drafts.

It also creates drafts and publishes them. Set `PORTFOLIO_API_TOKEN` to a random secret.

Use the same token in the VXP project. Vercel routes these paths to the Go Function:

| Method | Path | Action |
| --- | --- | --- |
| `GET` | `/api/articles` | List articles by status |
| `GET` | `/api/articles/{id-or-slug}` | Read one article |
| `POST` | `/api/articles/drafts` | Create or update a draft |
| `POST` | `/api/articles/{id}/publish` | Publish a draft |

Send the token in the `Authorization: Bearer <token>` header. The API needs PostgreSQL because drafts do not exist in the Markdown archive.

## Event photos

The event gallery draws each photo in a cell of at most 360 CSS pixels, so it serves resized copies instead of the originals in `public/uploads`.

Run the script after adding a photo. It writes a 480px and a 960px copy next to each original and skips the ones that are already up to date.

```bash
pip install pillow
python3 scripts/generate-image-variants.py
```

The widths must match `imageVariantWidths` in `site/render.go`, which builds the `srcset` of the gallery.

## Checks

Run all Go checks before a deployment.

```bash
go test ./...
go vet ./...
go build ./cmd/server
```

## Project structure

```text
api/                    Vercel Go Function
cmd/server/             Local HTTP server
content/posts/          Markdown fallback
site/                   Routes, storage, templates, and rendering
public/                 CSS, JavaScript, images, and videos
drizzle/                PostgreSQL schema
vercel.json             Vercel routes and cache headers
```

## Vercel

The project uses one Go Function at `api/index.go`. Vercel serves the files in `public` from its CDN.

Pull the project settings and run a local Vercel build.

```bash
vercel pull --yes
vercel build
```

Create a preview deployment after the local build passes.

```bash
vercel deploy
```

Use `vercel deploy --prod` only when the preview deployment is correct.
