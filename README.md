# Legendary Arena

**One community. One champion. Endless rivalries.**

A private football tournament and gaming community platform for a group of friends — tournaments, brackets, live chat, leaderboards, and a Hall of Fame.

## Architecture

- **Frontend**: React 19 + Vite + TypeScript + Tailwind CSS v4 + Radix UI primitives, in the repo root (`src/`).
- **Backend API**: Express + Drizzle ORM, in `server/`. Talks to Postgres (Neon) and verifies requests with Firebase Admin.
- **Auth**: Firebase Authentication — this is the *only* thing Firebase is used for. Everything else (users' profiles/stats, rooms, tournaments, matches, chat, notifications, trophies, and even avatar images) lives in Postgres.
- **Images**: no file storage service at all — avatars are resized in the browser (`src/lib/storage.ts`) and saved as a small base64 data URL directly in the user's row. No Firebase Storage, no Blaze plan, no second service to pay for.
- **Realtime**: there is no push channel from Postgres, so chat polls every ~3s and most other data polls every 5-15s. It's not instant like Firestore was, but it's a reasonable trade-off for a private friend-group app without adding a third realtime vendor.

```
src/        → frontend (pages, components, lib/api clients, polling stores)
server/     → backend API (Express routes, Drizzle schema, Firebase Admin token verification)
```

## 1. Set up Firebase (Authentication only)

1. [Firebase console](https://console.firebase.google.com) → create a project.
2. **Authentication** → Sign-in method → enable **Email/Password**. That's the only Firebase product this app uses — no Storage, no billing plan required.
3. Project settings → "Your apps" → add a **Web app** → copy the `firebaseConfig` values into the root `.env` (copy `.env.example` → `.env` first):
   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   VITE_API_URL=http://localhost:8787
   ```
   (Firebase's own config snippet will also include a `storageBucket` value — you can ignore or omit it, it's unused.)
4. Project settings → **Service accounts** → **Generate new private key**. This downloads a JSON file the *backend* uses to verify login tokens (never exposed to the browser).

## 2. Set up Neon (Postgres)

1. Create a project at [neon.tech](https://neon.tech).
2. Copy the connection string from the Neon dashboard (**Connect** button).
3. In `server/`, copy `.env.example` → `.env` and fill in:
   ```
   DATABASE_URL=<your Neon connection string>
   PORT=8787
   FIREBASE_SERVICE_ACCOUNT_JSON=<the whole downloaded service-account JSON, as one line>
   CORS_ORIGIN=http://localhost:5173
   ```
4. Push the schema to your database:
   ```bash
   npm install
   npm run db:push
   ```
   (`server/db/migrations/0000_*.sql` is also checked in if you'd rather run it by hand or via `npm run db:generate`.)

## 3. Run it

```bash
npm install
npm run dev:all     # runs the Vite frontend and the Express API together
```
Or separately: `npm run dev` (frontend) and `npm run server:dev` (API).

Open `http://localhost:5173`, register, and your first account becomes admin automatically (see below). Everyone who registers after that starts as a pending member and needs that admin's approval from **Admin → User Management**.

## How the admin bootstrap works

There's a single-row `bootstrap` table in Postgres. The very first registration atomically flips `bootstrap.claimed` from `false` to `true` (an atomic `UPDATE ... WHERE claimed = false`) and becomes admin/approved; every registration after that is a normal pending member, and nobody can self-promote — only an existing admin can change another account's role or status (enforced server-side in `server/middleware/roles.ts`).

## How the app is organized

- `server/db/schema.ts` — the full Postgres schema (Drizzle).
- `server/routes/*.ts` — the REST API: users, rooms (+ nested chat messages), tournaments, tournament requests, matches, trophies, notifications.
- `server/lib/fixtures.ts` / `server/lib/standings.ts` — bracket/round-robin generation and standings math, run server-side when an admin starts a tournament or advances a round.
- `src/lib/api.ts` — the frontend's fetch wrapper; attaches the signed-in user's Firebase ID token to every request.
- `src/store/*` — Zustand stores that poll each collection endpoint once and share the data across pages (`useRoomsStore`, `useTournamentsStore`, `useMatchesStore`, `useTrophiesStore`, `useTournamentRequestsStore`, `usePlayersStore`).
- `src/lib/{rooms,matches,tournamentLifecycle,chat,admin}.ts` — thin wrappers around `api.ts` calls, kept at the same function names/signatures the UI already uses.
- `src/components/ui/` — shadcn-style primitives built directly on Radix.
- `src/components/shared/` — domain components (match cards, brackets, chat panel, leaderboard table, etc).
- `src/pages/` — one file per route.

### Tournament formats

- **Knockout** — single-elimination bracket with byes for non-power-of-2 player counts. Admin advances each round once all its matches are complete.
- **League / Friendly** — single round-robin (everyone plays everyone once).
- **Group + Knockout** — round-robin "group stage" first; once complete, the admin generates a seeded knockout bracket from the top finishers (configurable advance count).

The Bracket and League Standings views are tabs on the Tournament Details page rather than separate URLs, so the fixture → result → standings loop stays in one place.

### Match results & stats

Both players submit a score. If they match, the result is confirmed automatically and both players' stats update in Postgres. If they disagree, the match is marked **disputed** and only an admin can resolve it (Admin → Tournament Management). An admin's manual correction reverses the previous stat contribution before applying the new one, so re-resolving a match never double-counts.

## Notifications

Notifications are created **server-side**, as a side effect of the relevant action (registering for a tournament, a match result landing, a room join request, an admin approving an account, etc.) — see the `notify()`/`notifyMany()` calls scattered through `server/routes/*.ts`. The frontend only ever reads them (polling `/api/notifications`), it never writes them directly.

## Security model & known trade-offs

- Every `/api/*` route (except account creation) requires a valid Firebase ID token, verified server-side via `firebase-admin`.
- Role/status changes, room/tournament creation, match-dispute resolution, and tournament lifecycle actions are all admin-only, enforced in `server/middleware/roles.ts` — not just hidden in the UI.
- A member can only register/cancel-registration for *themselves*, never another player.
- This is still a small-trust app for a private friend group: there's no row-level multi-tenant isolation beyond what's described above, and match-result confirmation trusts whichever two players are listed on the match. That's an intentional scope boundary, not an oversight — tightening it further would mean modeling per-match authorization more strictly, which wasn't asked for.

## Seeding sample data

No seed script is included — register a handful of real accounts through the UI (the first becomes admin), approve them from Admin → User Management, create a room, and create a tournament. That's faster than building and maintaining a separate seeding script against a schema that's still evolving.
