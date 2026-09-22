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

## Identidade

O site segue a identidade JAlmeida: preto e branco para a estrutura, azul para a ação e amarelo para o realce. As três famílias vêm do Google Fonts — Space Grotesk para título, Instrument Sans para corpo e JetBrains Mono para rótulo e código.

Todos os tokens vivem no bloco `:root` de `public/styles.css`, com o tema Terminal (escuro) logo abaixo em `prefers-color-scheme`. Nenhum componente escreve hexadecimal: se faltar um degrau, acrescente o token primeiro.

As marcas são arquivos, não desenhos. O monograma está em `public/assets/jalmeida-mark.png`, a assinatura em `public/assets/jalmeida-signature.png` e a versão animada da abertura em `public/assets/jalmeida-signature-animated.svg`. A tinta está assada em cada arquivo, então o tema escuro inverte a imagem em vez de pedir um segundo arquivo. Não redesenhe nem recomponha o `< J >` com caractere de teclado.

As cores das credenciais de evento ficam em `site/models.go` e as texturas da credencial 3D em `web/lanyard/credential.mjs`, que repete os tokens porque um SVG dentro do canvas WebGL não lê a folha de estilo.

## Desktop Lanyard

O herói pendura as credenciais num molho, como o de crachás de evento numa parede: todas as fitas convergem num gancho só e os crachás caem em leque, sobrepostos. A cena é uma ilha React com a Lanyard do React Bits.

A física prende cada cordão na sua âncora espalhada — é isso que faz o crachá descansar aberto e parar quieto. O que converge no gancho é a fita desenhada, que sai dele na diagonal até o primeiro corpo da corda. As duas coisas vivem em `web/lanyard/scene-config.mjs`, com o gancho em `heroHook` e as âncoras em `heroAnchors`.

Os crachás não se empurram porque cada um tem a sua camada de `z` e o colisor tem 0,01 de profundidade. Trocar isso faz o molho voltar a ser um varal.

Cada credencial também está girada em torno do próprio eixo, entre 9 e 22 graus para um lado ou para o outro, em `heroYaws`. A gravidade não segura esse giro — ela endireita o que pende, não o que gira —, então quem segura é a mola de `setAngvel` em `Lanyard.jsx`, que até então puxava todo mundo para zero e era o motivo de as credenciais olharem todas para a frente. A mola compara o componente `y` do quaternion, não o ângulo, e é isso que `yawTarget` converte.

O giro mudou a iluminação de graça: no varal todos os crachás olhavam para o mesmo lado e recebiam a mesma luz, e no molho cada um pega o refletor num ângulo. Com a luz ambiente em `PI` e o refletor principal em `10`, os crachás virados para a esquerda estouravam — `#0a7d4f` saía verde-menta. A luz ambiente caiu para `1.1`, o refletor para `4` e o material do cartão deixou de ser quase espelho (`metalness` 0.8) para ser o PVC impresso que ele é. Se mexer nisso, vale medir: a cor da faixa tem de sair perto do token, não mais clara.

A cena vale a partir de 1041px, onde o herói tem duas colunas. Abaixo disso o monograma fica no lugar dela e as credenciais se leem na grade da seção de eventos. A largura está em dois lugares que precisam casar: a media query em `public/styles.css` e o `matchMedia` em `public/lanyard-loader.js`.

Install the frontend dependencies after you clone the repository. Rebuild the committed bundle after you change `web/lanyard`.

```bash
npm install
npm run test:lanyard
npm run build:lanyard
```

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

## Event videos

The gallery videos are silent loops hosted on Vercel Blob. The CDN answers Range requests, so the browser already streams them — but only when the MP4 carries its `moov` index before the video data. Phones and most editors write the index at the end, and then the browser has to download the whole file before the first frame.

Check what is online today. The command reads only the first kilobytes.

```bash
python3 scripts/optimize-event-videos.py check https://<blob-host>/ss_brazil3.mp4
```

Rebuild a video from the original file. The command needs `ffmpeg` in the `PATH` or in `FFMPEG_BIN`.

```bash
python3 scripts/optimize-event-videos.py build ~/videos/ss_brazil3.mov
```

It writes an MP4 with the index in front, scaled to 720px, without the audio track the gallery never plays, plus a WebP poster in `public/uploads`. Upload the MP4 to the blob store and set `Poster` on the event in `site/models.go` to the poster path. The gallery draws the poster while the video downloads.

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
