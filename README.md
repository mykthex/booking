# GraphQL and Astro project

Server:

- Apollo Server with Express
- GraphQL-Request
- Apollo Client as GraphQL clients
- DB better sql lite
- better-auth;

Client:

- Astro
- React
- tailwindcss
- daisy ui
- better-auth

## Docker deployment

This repository now includes Docker setup for:

- client (Astro)
- server (Express + GraphQL + Better Auth)
- reverse proxy (Caddy)

### 1) Configure environment

Server env:

1. Copy `server/.env.template` to `server/.env`
2. Set real values for `BETTER_AUTH_SECRET`, `STRIPE_SECRET_KEY`, and `MAILGUN_SECRET_KEY`

Compose env (optional defaults):

1. Copy `.env.docker.example` to `.env`
2. Set public domain/origin values if not using localhost

### 2) Build and run

From repository root:

```bash
docker compose up --build -d
```

App entrypoint (with provided Caddyfile):

- `http://localhost:8080`

### 3) Persistent database

SQLite data is stored in the Docker volume `server_data` and mounted at `/app/data` in the server container.

### 4) Production domain notes

For production, update:

- `PUBLIC_API_BASE_URL`
- `CLIENT_ORIGIN`
- `CORS_ORIGINS`
- `TRUSTED_ORIGINS`

to your real HTTPS domain.

## GitHub Actions deployment (GHCR + SSH)

This repo includes a deployment workflow at `.github/workflows/deploy.yml`.

What it does on push to `main`:

1. Builds `server` and `client` Docker images
2. Pushes both images to GitHub Container Registry (GHCR)
3. SSHes into your server, pulls latest code, writes `server/.env`, pulls images, and restarts with Docker Compose

### Required GitHub secrets

Add these in GitHub: Settings -> Secrets and variables -> Actions.

- `DEPLOY_HOST`: Server hostname or IP
- `DEPLOY_USER`: SSH user
- `DEPLOY_SSH_KEY`: Private SSH key for that user
- `DEPLOY_PATH`: Absolute path to checked-out repo on server (example: `/opt/express-api`)
- `SERVER_ENV_FILE`: Full multiline content for `server/.env`
- `GHCR_USERNAME`: GitHub username or service account with `read:packages`
- `GHCR_TOKEN`: Personal access token with `read:packages` (and `write:packages` if needed)
- `PUBLIC_API_BASE_URL`: Public API base URL baked into the client image (example: `https://app.example.com`)

### First-time server prep

On your server:

1. Install Docker + Docker Compose plugin
2. Clone this repository to your `DEPLOY_PATH`
3. Ensure the deploy user can run `docker` commands
4. Run first deploy manually once (optional):

```bash
cd /opt/express-api
docker compose -f docker-compose.yml -f deploy/docker-compose.prod.yml up -d
```

After this, every push to `main` triggers deployment.
