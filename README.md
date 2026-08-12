# Stefo

Work calendar for hospital staff. Next.js 16 (App Router) + React 19 + Tailwind 4,
deployed on Render.

Current scope: sign in, land on the current month. The month grid is a
Google-Calendar-style six-week view with adjacent-month padding, so the layout
never reflows between months.

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
| `app/calendar/` | Signed-in month view |
| `components/month-calendar.tsx` | Month grid, navigation, today highlight |
| `lib/calendar.ts` | Pure date maths — grid building, month stepping |
| `lib/auth.ts` | Stub session (temporary) |
| `lib/supabase/` | Real auth, staged and not yet wired |
| `proxy.ts` | Route protection (Next 16's replacement for `middleware.ts`) |

Dates are handled in local time throughout — `toDateKey` formats manually
rather than via `toISOString()`, which would shift days across the date line.
The server renders its own date and the browser corrects it on mount, so a
UTC host doesn't show the wrong "today" to staff in another timezone.

## Deploying

`render.yaml` is a Render blueprint: **New → Blueprint → connect
`RyanKYoung/stefo`**. It builds with `npm ci && npm run build` and serves with
`npm run start` on the free plan, health-checking `/login`.
