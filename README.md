# NRV Esports — Frontend

The public site, team dashboard, and staff admin portal for Nerve Esports, built with Next.js 16 (App Router) and TypeScript. It talks to the [backend](../backend/README.md) NestJS API for all data — this app renders and never owns state on its own.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- Fonts: **Archivo** (display/headings) and **Spline Sans Mono** (body/UI), loaded via `next/font/google`
- No client-side data-fetching library — pages fetch server-side where possible (`lib/api-server.ts`) and fall back to a thin `fetch` wrapper (`lib/api.ts`) for client components

## Getting started

```bash
npm install
cp .env.example .env.local   # only needed if the API isn't on the default port
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app expects the backend API to be running at `http://localhost:3001` by default (see [`../backend/README.md`](../backend/README.md) to start it).

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | Base URL of the backend API. Only set this if the backend runs somewhere other than the default. |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server (Turbopack) on port 3000 |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |

## Project structure

```
app/
  (site)/            Public site + logged-in dashboard (shares the public nav/footer)
    page.tsx          Home
    tournaments/       Events list + event detail (schedule/standings/teams tabs)
    our-teams/         NRV's own team roster listing
    teams/[id]/        Public roster page for any team
    news/              News list + post detail
    stats/             Player/team stats center
    calendar/          Month calendar (matches, results)
    rules/             Rulebook (wiki-style, versioned)
    about/  sponsors/  legal/
    login/             Login + signup
    dashboard/         Logged-in area: overview, profile, team management, register-a-team
  admin/               Staff portal (admin/editor only) — its own sidebar layout
    events/  teams/  sponsors/  stats/  registrations/  news/  rulebook/  users/  audit/
  auth/discord/callback/   OAuth redirect target for Discord account linking

components/
  ui/primitives.tsx   Shared design-system components (Card, Btn, Table, Pill, Modal, Field, etc.)
  nav.tsx             Public site nav + footer
  admin/              Shared admin-portal building blocks
  dashboard/          Riot/Discord connection cards
  home/ news/ register/ teams/ tournaments/   Feature-specific client components

lib/
  api.ts              Client-side fetch wrapper (adds auth header, refreshes on 401)
  api-server.ts       Server Component fetch helper (no auth header — public GETs only)
  auth-context.tsx    Client auth state (login/signup/logout, token storage, current user)
  types.ts            Shared TypeScript types mirroring backend DTOs/entities
  derived.ts           Pure helpers: event status, registration state, standings, date formatting, game-role lists, player-tag pattern
```

## Design system

Dark theme, fixed palette:

| Token | Value |
|---|---|
| Background | `#0B0B0E` |
| Accent (peri) | `#7E82AC` |
| Accent light | `#BFC2DE` |
| Text | `#E6E6E6` |
| Muted text | `#888BA0` |

All shared visual primitives live in `components/ui/primitives.tsx` — reach for those (`Card`, `Btn`, `Table`, `Pill`, `Field`/`Input`/`Select`, `Modal`, `ConfirmModal`) before writing new markup, so spacing/typography stay consistent across pages.

## Server vs. Client Components

Most pages under `app/(site)/**/page.tsx` are **Server Components** that fetch data with `apiGet` from `lib/api-server.ts` and render server-side. Anything interactive (forms, dropdowns, tables with row click handlers) is a `"use client"` component under `components/`. When a Server Component needs a table with per-row render functions, extract a small client component (see `components/home/standings-table.tsx` or `components/teams/roster-table.tsx`) rather than passing functions as props across the boundary — Next.js will throw a runtime error ("Functions cannot be passed directly to Client Components") otherwise.

## Auth

JWT access + refresh tokens issued by the backend, stored client-side and attached by `lib/api.ts`. `AuthProvider` (`lib/auth-context.tsx`) wraps the whole app and exposes `user`, `login`, `signup`, `logout`, `refreshUser`. Roles are `admin`, `editor`, `user`; the `/admin` layout gates on `admin`/`editor` and shows an access-denied screen otherwise.

## Known gaps

- No MFA login step (backend defers it — see backend README).
- Substitution-request UI (post-roster-lock sub requests) isn't wired to the backend's `sub-requests` module yet.
- No staff/team-coach invite flow, no transactional email UI (backend has no invite or email-sending module yet).
- Calendar page doesn't yet surface the `Announcement` model (schema exists, no controller/UI).
