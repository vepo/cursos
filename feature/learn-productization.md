# Learn productization

**Feature version:** 1  
**Status:** done  
**Requested:** 2026-07-20

## Summary

Productize the platform as **Learn** (repo/Maven/Docker remain `cursos`): config-driven white-label branding, Learn visual identity, richer footer, Docker image, production wiring via backoffice-prod, and Backoffice shell health/deep-link entry (no course admin CRUD in Backoffice).

## Wireframe

| Field | Value |
|-------|-------|
| **Source** | ASCII below |
| **Last updated** | 2026-07-20 |

### Shell (default Learn)

```
┌──────────────────────────────────────────────────────────────┐
│ ██ HEADER (ink)                                              │
│  [mark] Learn                         [Entrar] / [☰]        │
├──────────────────────────────────────────────────────────────┤
│ MAIN (light slate page)                                       │
│  content                                                      │
├──────────────────────────────────────────────────────────────┤
│ © 2026 Learn · Support · Docs · Legal     [OpenAPI if dev]   │
│ Powered by Learn (optional credit)                            │
└──────────────────────────────────────────────────────────────┘
```

White-label: brand name, logo URL, colors, footer links, and credit come from `GET /api/branding` (env / `learn.brand.*`).

## Impact

| Area | Change |
|------|--------|
| Bounded contexts | Platform — `branding` package |
| API | `GET /api/branding` (public) |
| UI | Shell header/footer, CSS tokens, favicon/mark |
| Schema | None |
| Docker / prod | `vepo/cursos:main`, `learn.vepo.dev`, `/cursos/` proxy |
| Backoffice | MICROSERVICES + quick-card deep-link |
| Docs | Domain spec product name **Learn**, README, catalog, backlog |

## Feature questions (FQ)

| ID | Question | Status | Answer |
|----|----------|--------|--------|
| **FQ1** | Display product name? | answered | **Learn** |
| **FQ2** | White-label depth? | answered | Config-driven (one deploy = one brand) |
| **FQ3** | Backoffice course admin? | answered | Out of scope — health + deep-link only |

## Architecture questions (AQ)

| ID | Question | Status | Answer |
|----|----------|--------|--------|
| **AQ1** | Branding delivery? | answered | `learn.brand.*` config → `GET /api/branding` → Angular `provideAppInitializer` |
| **AQ2** | Container packaging? | answered | JVM fast-jar (Quinoa + OpenPDF; not native) |
| **AQ3** | Public host / proxy? | answered | `learn.vepo.dev`; Backoffice proxy `/cursos/` |

## Architecture

| Area | Design |
|------|--------|
| Packages | `dev.vepo.cursos.branding` — `BrandProperties`, `BrandingService`, `get.GetBrandingEndpoint`, `BrandingResponse` |
| Layers | Endpoint → Service → Properties (no repository) |
| API | `GET /api/branding` (`@Path("/branding")` under `@ApplicationPath("/api")`), `@PermitAll`, `operationId=getBranding` |
| Frontend | `BrandingService`, apply CSS vars on `:root`, shell binds to brand signal |
| Tokens | Default Learn light palette; contract asserts default hex; runtime may override |
| Docker | `src/main/docker/Dockerfile` JVM; CI pushes `vepo/cursos` |
| Health | `quarkus-smallrye-health` for `/q/health` |

## Changelog

### v1 — Learn productization (full + config-driven)

- **Status:** done
- **Impact on other features:** UI visual shell tokens/theme; Backoffice home cards; backoffice-prod MoP
- **Development approval:** approved 2026-07-20 — tasks: T1–T10 (user: implement plan)

#### Feature checklist

- [x] **FC1** Product display name is Learn (user-facing)
- [x] **FC2** Branding configurable via `learn.brand.*` / env
- [x] **FC3** Public branding API
- [x] **FC4** Shell applies brand (title, logo, colors, footer)
- [x] **FC5** Footer: year, links, credit, OpenAPI only when developer links enabled
- [x] **FC6** Default Learn visual identity (light + teal)
- [x] **FC7** Docker image + CI
- [x] **FC8** backoffice-prod wiring + MoP
- [x] **FC9** Backoffice health card + Learn deep-link
- [x] **FC10** Docs/backlog updated

#### Tasks

- [x] **T1** BrandProperties + BrandingService + GetBrandingEndpoint + BrandingResponse
- [x] **T2** Endpoint test for default branding payload
- [x] **T3** Angular BrandingService + app initializer apply tokens/title
- [x] **T4** Shell header/footer Learn UI + assets (mark, favicon)
- [x] **T5** Update visual-shell token contract + specs for Learn defaults
- [x] **T6** User-facing rename Cursos→Learn in copy (emails, OpenAPI title, index.html, domain docs)
- [x] **T7** Dockerfile + health dependency + prod JWT/datasource properties
- [x] **T8** GitHub Actions docker publish `vepo/cursos`
- [x] **T9** backoffice-prod compose/nginx/update.sh/MoP
- [x] **T10** Backoffice MICROSERVICES, proxy, quick-card/nav deep-link

#### Test coverage

- [x] **TC1** `BrandingEndpointTest` — default Learn branding 200
- [x] **TC2** Visual shell token contract — Learn default hex + layout classes
- [x] **TC3** App shell footer shows brand name; OpenAPI gated by `showDeveloperLinks`
- [x] **TC4** ArchitectureTest still green with new endpoint

#### Implementation notes

- JVM Docker image (not native) due to Quinoa + OpenPDF.
- Production host `learn.vepo.dev`; API proxy prefix `/cursos/`.
- Verified: `mvn verify`, `npm run build`, Angular app/theme specs, Backoffice platform-status specs.
