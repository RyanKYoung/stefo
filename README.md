# Stefo

DPT clinical rotation schedule for **USC Verdugo Hills Hospital** (Physical
Medicine & Rehabilitation, 1812 Verdugo Blvd, Glendale). Next.js 16 (App
Router) + React 19 + Tailwind 4, deployed on Render.

Sign in and land on the current month. Month, week, and day views; a staff
sidebar with colour-coded people and filterable open shifts; shift claiming and
releasing with administrator approval; and an admin page for approving trades
and importing a schedule CSV.

## Using it

**Staff.** Any email and password signs you in (see the auth warning below).
Unknown emails borrow the first DPT identity so there are always shifts of your
own to work with.

- **Views** — Day, Week, Month in the top right. Week and day are 24-hour grids
  that open scrolled to 6 AM.
- **Selecting** — click a day (or a day header) to highlight it; click an hour
  in the week or day grid to highlight that hour. Each column reserves a narrow
  strip on its left edge that always takes a click, so a fully staffed day
  doesn't make its hours unreachable.
- **Shifts** — click any shift to open the detail panel. **I want it** raises a
  claim on an open shift or someone else's; **Open for taking** releases one of
  your own back to the pool. Claims need administrator approval, so nothing
  moves on the schedule until it's approved.
- **Your hours** sit quietly at the bottom of the sidebar, counted over the
  period named in the toolbar.

**Administrator.** Sign in as `admin@admin.com` with password `1234` — the one
account in the stub whose password is actually checked. Everyone else is
redirected away from `/admin` without being told it exists. From there you can
approve or deny trade requests and upload a schedule CSV.

### Schedule CSV

Columns: **name**, **employee number**, **discipline**, **date**, **shift
hours**, plus an optional **unit**. Headings are matched loosely (`employee no`,
`specialty`, `shift time`, and similar all work). Dates may be `YYYY-MM-DD` or
`MM/DD/YYYY`; hours may be `07:00-15:30`, `0700-1530`, or `7am–3pm`.
Disciplines accept aliases — `PT` becomes DPT, `Nurse` becomes RN.

Every row that can't be read is reported with its row number and reason, split
into **skipped** (dropped) and **adjusted** (imported with a change, such as an
overnight shift clamped to midnight). People already on the roster are matched
by employee number rather than duplicated, so their uploaded shifts stay
attached to the same person.

Uploading replaces the demo schedule for every date in the file; other dates
keep their generated data.

## Design notes

The palette is in the USC family — cardinal `#990000` carries every action,
gold `#ffc72c` appears only as a thin accent, and the neutrals are warmed so
cardinal sits on them without going pink. Facility strings live in
`lib/facility.ts` so they can't drift between the login screen and the header.

This is an **internal scheduling tool, not an official Keck Medicine
property**. It deliberately uses its own mark rather than Keck or USC identity
assets, and should not be presented as an official hospital system.

Body text was checked against WCAG AA: the small-print greys were failing at
3.3–3.6:1 and `--color-ink-faint` was darkened to `#6b675f`, which brings every
text pair to 4.8:1 or better, including out-of-month day numbers on the sunken
cell background.

## Running locally

```bash
npm install
npm run dev
```

No environment variables are needed yet.

## ⚠️ Authentication is a stub

`lib/auth.ts` accepts **any email and any non-empty password** and stores the
email in an unsigned cookie. It is a placeholder so the calendar could be built
before the Supabase project existed. It is not authentication and must not be
pointed at real staff data.

The admin account is no better: `admin@admin.com` / `1234` is a demo
credential, and the "is this person an admin" check is just an email
comparison, so anyone who signs in with that address gets in. Administrator
access has to become a real role on a real session before this is used.

## ⚠️ Data is in server memory

Shift claims, trade approvals, and CSV uploads live in a module-level store
(`lib/store.ts`) and are wiped whenever the server restarts — which on Render's
free plan happens after each idle spin-down. The demo schedule itself is
generated deterministically from each date (`lib/seed.ts`), so it is stable
across restarts; only the changes made on top of it are lost. This whole layer
is what the Supabase tables replace.

### Switching on Supabase auth

The Supabase client code is already written and sitting in `lib/supabase/`
(`server.ts`, `client.ts`, `session.ts`, `env.ts`). To activate it:

1. Create the Supabase project, then put its URL and publishable key in
   `.env.local` (see `.env.example`) and uncomment both entries in `render.yaml`.
2. In `proxy.ts`, replace the `getUserFromRequest` check with
   `updateSession(request)` from `@/lib/supabase/session` — that file already
   contains the full redirect logic, including the `getUser()` revalidation.
3. In `app/login/actions.ts`, swap `startSession(email)` for
   `supabase.auth.signInWithPassword({ email, password })` and `endSession()`
   for `supabase.auth.signOut()`. The vague error string is deliberate: it
   avoids revealing whether an address has an account.
4. In `app/calendar/page.tsx`, swap `getCurrentUser()` for
   `supabase.auth.getUser()`.
5. Delete `lib/auth.ts` and the demo notice in `app/login/page.tsx`.

Turn off self-serve signup in the Supabase dashboard (Authentication →
Sign In / Providers → disable "Allow new users to sign up"); accounts are meant
to be issued by a scheduling administrator.

## Layout

| Path | What it holds |
| --- | --- |
| `app/login/` | Sign-in page, form, and server actions |
| `app/calendar/` | Signed-in calendar; loads the window each view needs |
| `app/admin/` | Trade approval and CSV import, administrators only |
| `components/calendar-workspace.tsx` | View + selection state, toolbar, layout |
| `components/hour-grid.tsx` | The 24-hour grid behind week and day views |
| `components/month-view.tsx` | Month grid with shift chips |
| `components/sidebar.tsx` | Staff roster, open shifts, hours total |
| `components/shift-panel.tsx` | Shift detail and claim/release actions |
| `lib/calendar.ts` | Pure date maths — grid building, stepping, labels |
| `lib/seed.ts` | Deterministic demo schedule |
| `lib/store.ts` | In-memory shifts, trades, uploads (server-only) |
| `lib/csv.ts` | Tolerant schedule CSV parser |
| `lib/layout.ts` | Lane packing so overlapping shifts stay readable |
| `lib/facility.ts` | Facility and program names, in one place |
| `lib/auth.ts` | Stub session (temporary) |
| `lib/supabase/` | Real auth, staged and not yet wired |
| `proxy.ts` | Route protection (Next 16's replacement for `middleware.ts`) |

View and focus date live in the URL (`/calendar?view=week&date=2026-08-12`), so
the server loads exactly the days a view needs and links are shareable.
Selection and the discipline filter are client state.

Dates are handled in local time throughout — `toDateKey` formats manually
rather than via `toISOString()`, which would shift days across the date line.
The server renders its own date (UTC on Render) and the browser renders the
local one; `useSyncExternalStore` reconciles the two snapshots so a UTC host
never shows the wrong "today", without a cascading `setState` in an effect.
The view month is derived rather than stored — `monthOverride === null` means
"follow today", so hydration correcting the date also corrects the month.

## Deploying

`render.yaml` is a Render blueprint: **New → Blueprint → connect
`RyanKYoung/stefo`**. It builds with `npm ci && npm run build` and serves with
`npm run start` on the free plan, health-checking `/login`.
