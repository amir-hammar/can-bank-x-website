# CanBankX Website

## Run with Docker (shared KrakenD network)

This project includes a Docker setup that serves the Vite build with Nginx and joins the external network `can-bank-x-network`.

### 1) Create the shared network (one time)

```bash
docker network create can-bank-x-network
```

If it already exists, Docker will return an error and you can ignore it.

### 2) Start this app container

```bash
docker compose up -d --build
```

The app is exposed at:

- `http://localhost:8083`

### 3) Routing expectation

Nginx proxies these paths over `can-bank-x-network`:

- `/api/*` -> `api-gateway:8080`
- `/auth/*` -> `api-gateway:8080`
- `/realms/*` -> `keycloak:8080`
- `/resources/*` -> `keycloak:8080`

This aligns with your backend services named `api-gateway` and `keycloak`.

### 4) Stop containers

```bash
docker compose down
```

## Frontend auth env (Keycloak)

Create `.env` in this frontend project if you need to override defaults:

```env
VITE_KEYCLOAK_REALM=can-bank-x
VITE_KEYCLOAK_CLIENT_ID=can-bank-x-web
VITE_KEYCLOAK_CLIENT_SECRET=
VITE_KEYCLOAK_TOKEN_PATH=/realms/can-bank-x/protocol/openid-connect/token
```

With the nginx config in this repo, `/realms/*` is proxied to the `keycloak` container on `can-bank-x-network`.
