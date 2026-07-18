# Account settings (Minha conta)

**Feature version:** 1  
**Status:** done  
**Requested:** 2026-07-18

## Summary

Authenticated users manage their own account under **Minha conta** (`/account`): view username, edit **name** and **email**, and **change password**. Profile updates go through Passport self-service (`PUT /api/auth/me`); Cursos proxies account mutations.

## Wireframe

| Field | Value |
|-------|-------|
| **Source** | ASCII below |
| **Last updated** | 2026-07-18 |

### Screen: `/account` — Minha conta

```
┌──────────────────────────────────────────────────────────────┐
│ HEADER … [nome] [Sair] [☰]                                   │
├──────────────────────────────────────────────────────────────┤
│ MAIN                                                         │
│  Minha conta                                                 │
│  ┌─ Perfil ───────────────────────────────────────────────┐ │
│  │ Usuário (read-only)                                     │ │
│  │ Nome [____________]  Email [____________]  [Salvar]    │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌─ Alterar senha ────────────────────────────────────────┐ │
│  │ Senha atual / Nova / Confirmar  [Alterar senha]        │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

Menu drawer includes **Conta → Minha conta**. Header display name links to `/account`.

## Impact

| Area | Change |
|------|--------|
| Passport | `PUT /api/auth/me` self-update name/email |
| Cursos API | `PUT /api/account`, `POST /api/account/change-password` |
| UI | `/account`, menu entry, header link |
| Docs | Domain, feature catalog, ARCHITECTURE (both repos) |

### Feature questions (FQ)

| ID | Question | Status | Answer |
|----|----------|--------|--------|
| **FQ1** | Edit name/email or view+password only? | answered | Full edit name/email + change password |

### Architecture questions (AQ)

| ID | Question | Status | Answer |
|----|----------|--------|--------|
| **AQ1** | Where does self-update live? | answered | Passport `PUT /auth/me`; Cursos proxies under `/account` |

## Architecture

| Piece | Location |
|-------|----------|
| Passport update | `auth.current.update.UpdateCurrentUserEndpoint` |
| Cursos proxy | `account.update.UpdateAccountEndpoint`, `account.password.ChangeAccountPasswordEndpoint` |
| Rest client | `PassportRestClient.updateMe`, `changePassword` |
| Angular | `components/account/`, route `/account` |

## Changelog

### 2026-07-18 — Minha conta

**Status:** `approved`

**Impact on other features:** Shell menu gains Conta group; no catalog/study changes.

## Feature checklist

| ID | Criterion | Done |
|----|-----------|------|
| FC1 | Passport `PUT /auth/me` updates own name/email | ☑ |
| FC2 | Cursos proxies update + change-password | ☑ |
| FC3 | `/account` UI with profile + password cards | ☑ |
| FC4 | Menu/header expose Minha conta | ☑ |
| FC5 | Docs updated | ☑ |

## Tasks

| ID | Task | Done |
|----|------|------|
| T28 | Passport `PUT /api/auth/me` + test + docs | ☑ |
| T29 | Cursos account proxy endpoints + tests | ☑ |
| T30 | Angular `/account` + menu entry + API regen | ☑ |

## Test coverage

| ID | Test | Covers | Done |
|----|------|--------|------|
| TC1 | Passport update current user | T28 | ☑ |
| TC2 | Cursos account update / change-password | T29 | ☑ |
| TC3 | Account component + nav entry | T30 | ☑ |

**Development approval:** approved 2026-07-18 — tasks: T28, T29, T30 (plan implementation)
