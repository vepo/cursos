# Configuration

Runtime settings for **Learn** (cursos). Source of truth in code: [`src/main/resources/application.properties`](../src/main/resources/application.properties) and [`BrandProperties`](../src/main/java/dev/vepo/cursos/branding/BrandProperties.java).

Quarkus maps dotted properties to environment variables by uppercasing and replacing non-alphanumeric characters with `_`. Examples:

| Property | Environment variable |
|----------|----------------------|
| `learn.brand.name` | `LEARN_BRAND_NAME` |
| `learn.brand.show-developer-links` | `LEARN_BRAND_SHOW_DEVELOPER_LINKS` |
| `mp.jwt.verify.issuer` | `JWT_ISSUER` (also set via `${JWT_ISSUER:...}` in properties) |
| `cursos.media.signing-secret` | `CURSOS_MEDIA_SIGNING_SECRET` |
| `quarkus.rest-client.passport-api.url` | `PASSPORT_API_URL` |

Deploy packaging and production wiring: [deployment.md](deployment.md).

## HTTP and CORS

| Property | Env / notes | Default / `%dev` | Purpose |
|----------|-------------|------------------|---------|
| `quarkus.http.port` | — | `%dev` **8083**; container **8080** | HTTP listen port |
| `quarkus.http.test-port` | — | **8084** | Tests |
| `quarkus.http.limits.max-body-size` | — | **250M** | Large video uploads |
| `quarkus.http.cors.*` | — | Origins/headers `*`; methods include GET–PATCH | CORS |

## Datasource and Flyway

| Property | Env | Notes |
|----------|-----|-------|
| `quarkus.datasource.db-kind` | — | `postgresql` |
| `quarkus.datasource.username` | `QUARKUS_DATASOURCE_USERNAME` | Prod: `cursos_user` |
| `quarkus.datasource.password` | `QUARKUS_DATASOURCE_PASSWORD` | From secrets / `POSTGRES_CURSOS_PASSWORD` in compose |
| `quarkus.datasource.jdbc.url` | `QUARKUS_DATASOURCE_JDBC_URL` | e.g. `jdbc:postgresql://postgres:5432/cursos_db` |
| `quarkus.hibernate-orm.database.generation` | `QUARKUS_HIBERNATE_ORM_DATABASE_GENERATION` | Prod: **`validate`** (Flyway owns schema) |
| `quarkus.flyway.migrate-at-start` | — | `true` |
| `quarkus.flyway.clean-at-start` | — | **`true` only in `%dev`** — wipes DB on each restart |

`%dev` uses Dev Services PostgreSQL (`cursos` DB name) unless overridden.

## JWT (Passport verify-only)

| Property | Env | Default | Purpose |
|----------|-----|---------|---------|
| `mp.jwt.verify.issuer` | `JWT_ISSUER` | `https://passport.vepo.dev` | Must match Passport issuer |
| `mp.jwt.verify.publickey` | — | Embedded PEM in `%dev` / `%test` | Dev/test only |
| `mp.jwt.verify.publickey.location` | `MP_JWT_VERIFY_PUBLICKEY_LOCATION` | `%prod`: `file:/opt/keys/public_key.pem` | Prod public key path |

Learn never needs Passport’s private key. Keep the public key in sync with Passport’s signing keypair.

## Passport REST client

| Property | Env | Default | Purpose |
|----------|-----|---------|---------|
| `quarkus.rest-client.passport-api.url` | `PASSPORT_API_URL` | `http://localhost:8080` | Login proxy, account/password APIs |

## Mailer

| Property | Env | Default | Purpose |
|----------|-----|---------|---------|
| `quarkus.mailer.mock` | `QUARKUS_MAILER_MOCK` | `true` (also forced in `%dev` / `%test`) | No real SMTP in local/test |
| `quarkus.mailer.from` | `QUARKUS_MAILER_FROM` | — | Prod sender |
| `quarkus.mailer.host` | `QUARKUS_MAILER_HOST` | — | SMTP host |
| `quarkus.mailer.port` | `QUARKUS_MAILER_PORT` | — | SMTP port |
| `quarkus.mailer.username` | `QUARKUS_MAILER_USERNAME` | — | SMTP user |
| `quarkus.mailer.password` | `QUARKUS_MAILER_PASSWORD` | — | SMTP password |
| `quarkus.mailer.start-tls` | `QUARKUS_MAILER_START_TLS` | — | e.g. `REQUIRED` |

Enrollment and related notifications use Quarkus Mailer + Qute. Set mock to `false` and configure SMTP for real delivery.

## Media (playback tickets)

| Property | Env | Default | Purpose |
|----------|-----|---------|---------|
| `cursos.media.signing-secret` | `CURSOS_MEDIA_SIGNING_SECRET` | Dev placeholder string | HMAC for signed media URLs |
| `cursos.media.playback-ticket-ttl-seconds` | — | `300` (`60` in `%test`) | Video ticket lifetime |
| `cursos.media.max-image-bytes` | — | `12582912` (~12 MiB) | Image upload limit |
| `cursos.media.max-video-bytes` | — | `262144000` (~250 MiB) | Video upload limit |
| `cursos.media.range-chunk-bytes` | — | `1048576` (1 MiB) | Default Range chunk |

**Production:** always set a strong `CURSOS_MEDIA_SIGNING_SECRET`. Anyone who can forge tickets can stream media until expiry.

## Branding (white-label)

Exposed publicly as `GET /api/branding`. One deployment = one brand.

| Property | Env | Default | Purpose |
|----------|-----|---------|---------|
| `learn.brand.name` | `LEARN_BRAND_NAME` | `Learn` | Product display name |
| `learn.brand.tagline` | `LEARN_BRAND_TAGLINE` | `Aprenda no seu ritmo` | Tagline |
| `learn.brand.logo-url` | `LEARN_BRAND_LOGO_URL` | (empty) | Optional logo URL |
| `learn.brand.favicon-url` | `LEARN_BRAND_FAVICON_URL` | (empty) | Optional favicon URL |
| `learn.brand.accent` | `LEARN_BRAND_ACCENT` | `#0D9488` | Accent color |
| `learn.brand.header-bg` | `LEARN_BRAND_HEADER_BG` | `#0F172A` | Header background |
| `learn.brand.on-chrome` | `LEARN_BRAND_ON_CHROME` | `#F8FAFC` | Text/icons on header |
| `learn.brand.page-bg` | `LEARN_BRAND_PAGE_BG` | `#F8FAFC` | Page background |
| `learn.brand.surface` | `LEARN_BRAND_SURFACE` | `#FFFFFF` | Surface / cards |
| `learn.brand.text` | `LEARN_BRAND_TEXT` | `#0F172A` | Primary text |
| `learn.brand.text-muted` | `LEARN_BRAND_TEXT_MUTED` | `#64748B` | Muted text |
| `learn.brand.link` | `LEARN_BRAND_LINK` | `#0F766E` | Links |
| `learn.brand.border` | `LEARN_BRAND_BORDER` | `#E2E8F0` | Borders |
| `learn.brand.danger` | `LEARN_BRAND_DANGER` | `#DC2626` | Danger / errors |
| `learn.brand.support-url` | `LEARN_BRAND_SUPPORT_URL` | (empty) | Footer Support link |
| `learn.brand.docs-url` | `LEARN_BRAND_DOCS_URL` | (empty) | Footer Docs link |
| `learn.brand.legal-url` | `LEARN_BRAND_LEGAL_URL` | (empty) | Footer Legal link |
| `learn.brand.credit` | `LEARN_BRAND_CREDIT` | (empty) | Optional secondary footer credit line (author credit is always shown) |
| `learn.brand.show-developer-links` | `LEARN_BRAND_SHOW_DEVELOPER_LINKS` | `false` (`true` in `%dev`) | Show OpenAPI in footer |

## OpenAPI / Swagger UI

| Property | Notes |
|----------|-------|
| `quarkus.smallrye-openapi.path` | `/openapi.yaml` |
| `quarkus.swagger-ui.path` | `/openapi` |
| `%prod.quarkus.swagger-ui.enable` | `false` — Swagger UI off in production |
| `%dev` / `%test` | Swagger UI included for local exploration |

## Quinoa (Angular)

| Property | Value | Purpose |
|----------|-------|---------|
| `quarkus.quinoa` | `true` (`false` in `%test`) | Embed / drive SPA |
| `quarkus.quinoa.ui-dir` | `src/main/webui` | Angular project root |
| `quarkus.quinoa.build-dir` | `dist/cursos/browser` | Angular `application` builder output (must include `browser/` so `/` serves `index.html`) |
| `quarkus.quinoa.package-manager-command.build` | `run build:ui` | Package UI without `prebuild`/`generate:api` (run codegen before `mvn package`) |
| `quarkus.quinoa.dev-server.port` | `4203` | Dev UI port (proxied via 8083) |
| `quarkus.quinoa.dev-server.command` | `npm run start` | Dev server command |
| `quarkus.quinoa.dev-server.check-timeout` | `120000` | ms — first compile can be slow |

## Quarkus profile

| Env | Typical use |
|-----|-------------|
| `QUARKUS_PROFILE=prod` | Container / production (no Flyway clean, JWT from file, Swagger off) |
| (unset / `dev`) | `mvn quarkus:dev` — Dev Services, clean-at-start, embedded JWT, developer branding links |

## Minimal production example

Aligned with the backoffice-prod `cursos` service. Replace secrets; do not commit real passwords.

```bash
QUARKUS_PROFILE=prod
QUARKUS_DATASOURCE_USERNAME=cursos_user
QUARKUS_DATASOURCE_PASSWORD=<secret>
QUARKUS_DATASOURCE_JDBC_URL=jdbc:postgresql://postgres:5432/cursos_db
QUARKUS_HIBERNATE_ORM_DATABASE_GENERATION=validate
MP_JWT_VERIFY_PUBLICKEY_LOCATION=file:/opt/keys/public_key.pem
JWT_ISSUER=https://passport.vepo.dev
PASSPORT_API_URL=http://passport:8080
CURSOS_MEDIA_SIGNING_SECRET=<strong-random-secret>
LEARN_BRAND_NAME=Learn
LEARN_BRAND_SHOW_DEVELOPER_LINKS=false
```

Optional branding and mailer:

```bash
LEARN_BRAND_TAGLINE=Aprenda no seu ritmo
LEARN_BRAND_ACCENT=#0D9488
LEARN_BRAND_SUPPORT_URL=https://example.com/support
QUARKUS_MAILER_MOCK=false
QUARKUS_MAILER_FROM=noreply@example.com
QUARKUS_MAILER_HOST=smtp.example.com
QUARKUS_MAILER_PORT=587
QUARKUS_MAILER_USERNAME=api
QUARKUS_MAILER_PASSWORD=<secret>
QUARKUS_MAILER_START_TLS=REQUIRED
```

## Related

- [deployment.md](deployment.md)
- [ARCHITECTURE.md](../ARCHITECTURE.md) §14
- [feature/learn-productization.md](../feature/learn-productization.md) — branding design
