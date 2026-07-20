# Deployment

How to package and run **Learn** (Maven artifact / Docker image `cursos`). Product UI name is Learn; container and repo remain `cursos`.

For day-to-day local development, use [README.md](../README.md) § Quick start (`./scripts/dev.sh`). This guide covers packaging, containers, and production wiring.

## Prerequisites

| Dependency | Notes |
|------------|-------|
| Java 21 | Matches Quarkus runtime |
| Maven | Wrapper `./mvnw` or system `mvn` |
| Node.js + npm | Required for Quinoa Angular build (package and Docker) |
| PostgreSQL | Database `cursos_db` (or Dev Services in `%dev`) |
| Passport | Running identity service; JWT public key must match Passport’s signing key |
| Shared issuer | `JWT_ISSUER` must equal Passport’s issuer (default `https://passport.vepo.dev`) |

Learn does **not** sign JWTs. Mount or configure the **Passport public key** for verification.

## Local package (fast-jar)

Quinoa embeds the Angular production build into the Quarkus JVM application.

```bash
./mvnw -DskipTests package
```

Artifacts:

- `target/quarkus-app/` — runnable fast-jar layout
- Entry: `target/quarkus-app/quarkus-run.jar`

Example (requires Postgres + Passport and prod-style config):

```bash
java -jar target/quarkus-app/quarkus-run.jar
```

Prefer the Docker image for production-like runs.

## Container image

| Item | Value |
|------|-------|
| Dockerfile | [src/main/docker/Dockerfile](../src/main/docker/Dockerfile) |
| Base | UBI 9 OpenJDK 21 runtime |
| Mode | JVM (not native) — Quinoa SPA + OpenPDF certificates |
| Listen | `8080` inside the container (`quarkus.http.host=0.0.0.0`) |
| Published image | `vepo/cursos:main` (CI: [`.github/workflows/maven.yml`](../.github/workflows/maven.yml)) |

Build after `mvn package` (CI builds the image from `target/quarkus-app/`):

```bash
./mvnw -DskipTests package
docker build -f src/main/docker/Dockerfile -t vepo/cursos:local .
```

## Runtime dependencies

Every non-dev deployment needs:

1. **PostgreSQL** — user/database (platform standard: `cursos_user` / `cursos_db`).
2. **JWT public key** — file mount default `file:/opt/keys/public_key.pem`, or set `MP_JWT_VERIFY_PUBLICKEY_LOCATION`.
3. **Passport URL** — `PASSPORT_API_URL` (compose example: `http://passport:8080`).
4. **Issuer** — `JWT_ISSUER` aligned with Passport.
5. **Datasource** — `QUARKUS_DATASOURCE_JDBC_URL`, username, password; Hibernate `validate` in prod.

Optional but recommended in prod:

- `CURSOS_MEDIA_SIGNING_SECRET` — HMAC for playback / image tickets (do not use the dev default).
- Mailer SMTP env vars when enrollment emails should leave mock mode (see [configuration.md](configuration.md)).
- Branding overrides (`LEARN_BRAND_*`) for white-label.

Health endpoint (container healthcheck):

```text
GET /q/health
```

Full property and env reference: [configuration.md](configuration.md).

## Platform production (backoffice-prod)

Production hosts Learn at **https://learn.vepo.dev** behind nginx, with Backoffice proxying `/cursos/` to the same container. The authoritative runbook (DNS, TLS, Postgres bootstrap, compose, smoke) is:

**[backoffice-prod MoP — §4b Learn (cursos)](../../backoffice-prod/docs/MOP-UPDATE-ENVIRONMENT.md)**  
(path relative to a sibling checkout: `../backoffice-prod/docs/MOP-UPDATE-ENVIRONMENT.md`)

Summary of the `cursos` compose service (do not treat as a substitute for the MoP):

| Setting | Typical value |
|---------|----------------|
| Image | `vepo/cursos:main` |
| Profile | `QUARKUS_PROFILE=prod` |
| JDBC | `jdbc:postgresql://postgres:5432/cursos_db` |
| JWT key | Volume `./keys/public_key.pem` → `/opt/keys/public_key.pem` |
| Passport | `PASSPORT_API_URL=http://passport:8080` |
| Public host | `learn.vepo.dev` → container `:8080` |
| Backoffice API prefix | `https://backoffice.vepo.dev/cursos/` |

## Post-deploy smoke checks

```bash
# App health
curl -sf https://learn.vepo.dev/q/health

# Via Backoffice reverse proxy (if used)
curl -sf https://backoffice.vepo.dev/cursos/q/health

# Public branding (no auth)
curl -sf https://learn.vepo.dev/api/branding

# SPA must be at site root (not nested under /browser/)
curl -sf https://learn.vepo.dev/ | grep -q '<title>Learn</title>'
```

Then in a browser:

1. Open https://learn.vepo.dev
2. Log in with a Passport user (platform admin / teacher as appropriate)
3. Confirm catalog loads and an enrolled course can be opened

## Related

- [configuration.md](configuration.md) — env and properties
- [ARCHITECTURE.md](../ARCHITECTURE.md) §11–§14 — ports and config overview
- [README.md](../README.md) — quick start and features
