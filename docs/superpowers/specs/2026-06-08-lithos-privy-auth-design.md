# Lithos — Privy-Unified Authentication (Google + Twitter/X + Passwordless Email)

_Design spec · 2026-06-08_

## Goal

Replace the legacy email+password / native-Google / phone-OTP auth in the Lithos
mobile app with a single, simpler Privy-powered login offering exactly three
methods: **Google OAuth, Twitter/X OAuth, and passwordless email (6-digit code)**.
"All-in on Privy": Privy is the only identity entry point; Twitter/X becomes a
dashboard toggle rather than custom OAuth code.

## Context (current state)

- `@privy-io/expo@^0.58.3` + `@privy-io/expo-native-extensions` are already
  installed in `front-end/`, and a Privy app is configured in env
  (`EXPO_PUBLIC_PRIVY_APP_ID=cmieakfr201g9jo0cwewfvsgi`, plus client ID) across
  `.env`, `.env.example`, `.env.production`.
- Backend already exposes `POST /auth/privy/login` (real impl:
  `verifyPrivyToken` → `validatePrivyUser` → issues app JWT) alongside
  `/auth/google/native`, `/auth/login`, `/auth/register`, `/auth/phone/*`.
- **But `PrivyProvider` is NOT mounted** in the mobile app and no `usePrivy` /
  `useLoginWith*` hooks are used — the screens still call the legacy
  `authService` (email/password, native Google, phone). So Privy is unused today.
- `User` model: `password String?` (already optional — passwordless OK),
  `role UserRole @default(BUYER)`. `UserRole = ADMIN | SUPPLIER | BUYER |
  INSPECTOR | LOGISTICS`. **No `privyId` column.**
- `validatePrivyUser(privyUserId, email?, name?, role?)` links **by email only**
  (never persists `privyUserId`; no-email users get a deterministic fallback
  `privy-{id}@temp.local` but are only looked up when an email is present), and
  its `roleMap` uses **AgroTrade role names** (`seller`/`farmer`/`transporter`),
  not Lithos roles.

## Decisions (locked with user)

1. **Architecture:** All-in on Privy (unified login; Twitter = dashboard toggle).
2. **Email login:** Passwordless 6-digit email code (no passwords).
3. **Role on first sign-in:** Role picker (Supplier / Buyer / Inspector /
   Logistics). ADMIN is assigned by email allowlist, not user-pickable.
4. **Retire** phone-auth and email+password flows from the mobile UI entirely.
5. User will set up the **X developer app** for Twitter/X in the Privy dashboard.

## Architecture

### Mobile (`front-end/`)

- **Provider:** Mount `<PrivyProvider appId clientId>` at the app root
  (`RootNavigator` or `App.tsx`), reading `EXPO_PUBLIC_PRIVY_APP_ID` /
  `EXPO_PUBLIC_PRIVY_CLIENT_ID`. Privy callbacks deep-link via the existing
  `lithos://` scheme + `OAuthCallbackScreen`.
- **Login screen (single screen, replaces Welcome/Login/Register/Phone):**
  - `Continue with Google` → `useLoginWithOAuth().login({ provider: 'google' })`
  - `Continue with X` → `useLoginWithOAuth().login({ provider: 'twitter' })`
  - `Continue with email` → `useLoginWithEmail()`: `sendCode(email)` → enter code
    → `loginWithCode(code)`
- **Post-auth bridge (one shared handler):** on Privy authentication →
  `getAccessToken()` → determine new vs returning (call `/auth/privy/login`;
  backend signals whether the user was just created OR mobile shows the role
  picker before the call for new users — see Flow). Send
  `POST /auth/privy/login { privyToken, role?, email?, name? }` → receive app JWT
  → store in `auth.store` → navigate into `Main`.
- **Role picker:** shown only for new users (reuse the Salar role-selection UI
  from the current RegisterScreen): Supplier / Buyer / Inspector / Logistics.
- **Retired screens/UI:** password fields on Login, RegisterScreen password
  flow, `ForgotPasswordScreen`, `PhoneAuthScreen`. `authService` email/password,
  google-native, and phone methods stop being called (left in file, dead).

### Backend (`backend/`)

- **Schema:** add `privyId String? @unique @map("privy_id")` to `User`. Prisma
  migration (generated DB-free via `prisma migrate diff` if no DB, per project
  convention; applies on Railway `migrate deploy`).
- **`validatePrivyUser` rewrite:** lookup order → (1) by `privyId`, (2) by
  `email`, (3) create. Always persist `privyId` on create and backfill it on an
  email match. Fixes returning Twitter/no-email users.
- **Role mapping:** replace `roleMap` with Lithos roles:
  `supplier→SUPPLIER, buyer→BUYER, inspector→INSPECTOR, logistics→LOGISTICS,
  admin→ADMIN`. Unknown/absent → default `SUPPLIER` for new users; never
  downgrade an existing user's role implicitly.
- **ADMIN allowlist:** new env `ADMIN_EMAILS` (comma-separated). If the verified
  Privy email is in the list, force `role = ADMIN` regardless of the picked role
  (applied on create and on login).
- **Token verification:** confirm `verifyPrivyToken` validates against the Privy
  app (`PRIVY_APP_ID` + Privy verification key / app secret). Harden if it is a
  stub; surface clear errors on invalid/expired tokens.
- **Dormant endpoints:** `/auth/login`, `/auth/register`, `/auth/phone/*` remain
  in the controller (no deletion) but are unused by the client.

### Privy dashboard (external, user-performed with guidance)

- On app `cmieakfr2…`, enable login methods: **Google, Twitter/X, Email**.
- **Twitter/X:** paste X developer app API key/secret into Privy (the only piece
  requiring the user's X account). Google + email use Privy defaults.
- Add `lithos://` (and the Expo dev redirect) to allowed redirect URIs/origins.

## Data flow (happy paths)

1. **Google / X:** tap → Privy OAuth (browser/native) → returns to app via
   `lithos://` → Privy session established → `getAccessToken()` → [new user →
   role picker] → `POST /auth/privy/login` → app JWT → `Main`.
2. **Email:** enter email → Privy emails 6-digit code → enter code →
   `loginWithCode` → same bridge as above.
3. **Returning user:** Privy session → `/auth/privy/login` (no role needed; backend
   matches by `privyId`/email) → app JWT → `Main`.

## Error handling

- Privy login cancel/timeout → return to Login screen with a dismissable message;
  no app JWT issued.
- `/auth/privy/login` failure (invalid token, network) → toast + stay on Login;
  Privy session cleared so retry is clean.
- Email code: wrong/expired code → inline error + resend option.
- New user without email (X without shared email) → still created via `privyId`;
  fallback email retained; role picker still shown.

## Testing

- **Backend (Jest):** `validatePrivyUser` —
  (a) new user persists `privyId` + correct Lithos role,
  (b) returning user matched by `privyId` (no duplicate),
  (c) email match backfills `privyId`,
  (d) `ADMIN_EMAILS` forces ADMIN,
  (e) unknown role → SUPPLIER, existing role not downgraded.
  Keep the non-custodial guard green.
- **Mobile (manual):** each of Google / X / email login → new-user role picker →
  lands in app; returning-user skips picker; cancel path returns cleanly.

## Out of scope (YAGNI)

- Embedded wallets / on-chain Privy features (non-custodial prime directive
  unchanged — auth only).
- Admin UI for re-assigning counterparty roles (separate follow-up).
- Web-export auth parity beyond what `@privy-io/expo` provides for free.
- Deleting the dormant legacy endpoints.

## Risks / notes

- X/Twitter OAuth depends on a correctly configured X developer app in Privy;
  if not ready, Google + email ship first and X is enabled by a later dashboard
  toggle (no code change).
- `@privy-io/expo` native modules require a dev/prod build (already have the EAS
  TestFlight pipeline); Privy login won't work in a bare Expo Go client.
