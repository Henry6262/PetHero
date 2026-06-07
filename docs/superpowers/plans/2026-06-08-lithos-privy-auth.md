# Lithos Privy-Unified Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace legacy email/password + native-Google + phone auth in the Lithos mobile app with a single Privy login offering Google, Twitter/X, and passwordless email, with a first-login role picker and ADMIN-by-email-allowlist.

**Architecture:** Mobile uses the already-mounted `PrivyProvider` (App.tsx) + Privy hooks for the three login methods; on Privy success it exchanges the Privy access token at `POST /auth/privy/login` for the app's own JWT. Backend hardens the existing `validatePrivyUser` (link by `privyId`, Lithos role map, admin allowlist) and returns an `isNewUser` flag that drives the role picker.

**Tech Stack:** NestJS + Prisma (PostgreSQL) + Jest (backend); React Native + Expo + `@privy-io/expo@0.58` + Zustand (`auth.store`) + React Navigation (mobile).

**Repo:** `normie-apps/lithium-broker` (its own git repo; `backend/` and `front-end/`). Run git commands from that root.

**Prerequisite (manual, not a code task) — Privy dashboard:** On Privy app `cmieakfr2…` enable login methods **Google, Twitter/X, Email**; for Twitter/X paste an X developer app key/secret; add redirect scheme `lithos://`. Google + email work without extra credentials. If X isn't ready, ship Tasks 1–8 (Google + email work immediately) and toggle X on later — no code change.

---

## File Structure

**Backend (`backend/`):**
- Modify `prisma/schema.prisma` — add `User.privyId`.
- Create `prisma/migrations/<ts>_add_user_privy_id/migration.sql`.
- Modify `src/common/config/env.validation.ts` — add `ADMIN_EMAILS`.
- Modify `src/auth/auth.service.ts` — rewrite `validatePrivyUser`, add admin-allowlist + role-map helpers.
- Modify `src/auth/auth.controller.ts` — thread `isNewUser` into the `privy/login` response.
- Modify `src/auth/dto/auth.dto.ts` — add `isNewUser` to the success response DTO.
- Test `src/auth/auth.service.privy.spec.ts` (new).

**Mobile (`front-end/`):**
- Create `src/pages/Auth/hooks/usePrivyLogin.ts` — the post-auth bridge.
- Rewrite `src/pages/Auth/screens/LoginScreen.tsx` — 3-method Privy login.
- Create `src/pages/Auth/screens/RolePickerScreen.tsx` — first-login role choice.
- Modify `src/navigation/AuthStack.tsx` + `src/navigation/types.ts` — entry = Login, add RolePicker, drop Welcome/Register/ForgotPassword/PhoneAuth.
- Modify `src/services/authService.ts` — confirm `privyLogin` payload + response type.

---

## Task 1: Add `privyId` to the User model

**Files:**
- Modify: `backend/prisma/schema.prisma` (User model)
- Create: `backend/prisma/migrations/<timestamp>_add_user_privy_id/migration.sql`

- [ ] **Step 1: Add the column to the schema**

In `backend/prisma/schema.prisma`, inside `model User`, directly under the `password String?` line add:

```prisma
  privyId             String?             @unique @map("privy_id")
```

- [ ] **Step 2: Generate the migration**

If a dev Postgres is running (`DATABASE_URL` reachable):

Run: `cd backend && npx prisma migrate dev --name add_user_privy_id`
Expected: migration created + applied, `Prisma schema loaded`, client regenerated.

If no DB is available (docker down), generate it DB-free (project convention):

Run:
```bash
cd backend
git show HEAD:prisma/schema.prisma > /tmp/old.prisma
mkdir -p prisma/migrations/$(date +%Y%m%d%H%M%S)_add_user_privy_id
npx prisma migrate diff \
  --from-schema-datamodel /tmp/old.prisma \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/$(ls -dt prisma/migrations/*add_user_privy_id | head -1 | xargs basename)/migration.sql
npx prisma generate
```
Expected: `migration.sql` contains `ALTER TABLE "users" ADD COLUMN "privy_id" TEXT;` + a unique index; `prisma generate` succeeds.

- [ ] **Step 3: Verify the SQL**

Run: `cat backend/prisma/migrations/*add_user_privy_id/migration.sql`
Expected: contains `ADD COLUMN "privy_id"` and `CREATE UNIQUE INDEX ... ON "users"("privy_id")`.

- [ ] **Step 4: Typecheck (client picked up the new field)**

Run: `cd backend && npx tsc --noEmit`
Expected: no errors (the new optional field doesn't break existing code).

- [ ] **Step 5: Commit**

```bash
cd /Users/henry/Documents/Gazillion-dollars/normie-apps/lithium-broker
git add backend/prisma/schema.prisma backend/prisma/migrations
git commit -m "feat(auth): add User.privyId for Privy identity linking"
```

---

## Task 2: Add `ADMIN_EMAILS` env config

**Files:**
- Modify: `backend/src/common/config/env.validation.ts`
- Modify: `backend/.env.example`

- [ ] **Step 1: Add the optional env var**

In `backend/src/common/config/env.validation.ts`, after the `PRIVY_APP_SECRET` block (before the closing `}` of the class), add:

```typescript
  @IsString()
  @IsOptional()
  ADMIN_EMAILS: string; // comma-separated emails always granted ADMIN
```

- [ ] **Step 2: Document it**

Append to `backend/.env.example`:

```
# Comma-separated list of emails that are always assigned the ADMIN role on Privy login
ADMIN_EMAILS=enriquemiloslavov11@gmail.com
```

- [ ] **Step 3: Typecheck**

Run: `cd backend && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add backend/src/common/config/env.validation.ts backend/.env.example
git commit -m "feat(auth): ADMIN_EMAILS allowlist env var"
```

---

## Task 3: Rewrite `validatePrivyUser` (TDD)

Links by `privyId` → `email` → create; persists `privyId`; maps Lithos roles; applies the ADMIN allowlist; returns `{ user, isNewUser }`.

**Files:**
- Modify: `backend/src/auth/auth.service.ts:375-425` (`validatePrivyUser`)
- Test: `backend/src/auth/auth.service.privy.spec.ts` (new)

- [ ] **Step 1: Write the failing test**

Create `backend/src/auth/auth.service.privy.spec.ts`:

```typescript
import { Test } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { UserRole } from "@prisma/client";
import { AuthService } from "./auth.service";
import { PrismaService } from "../prisma/prisma.service";

// Minimal in-memory fake of the prisma User table for unit isolation.
function makeFakePrisma() {
  const rows: any[] = [];
  return {
    rows,
    user: {
      findUnique: async ({ where }: any) =>
        rows.find((r) =>
          where.privyId ? r.privyId === where.privyId : r.email === where.email,
        ) ?? null,
      create: async ({ data }: any) => {
        const row = { id: `u${rows.length + 1}`, ...data };
        rows.push(row);
        return row;
      },
      update: async ({ where, data }: any) => {
        const row = rows.find((r) => r.id === where.id);
        Object.assign(row, data);
        return row;
      },
    },
  };
}

async function buildService(prisma: any, adminEmails = "") {
  const moduleRef = await Test.createTestingModule({
    providers: [
      AuthService,
      { provide: PrismaService, useValue: prisma },
      { provide: ConfigService, useValue: { get: (k: string) => (k === "ADMIN_EMAILS" ? adminEmails : undefined) } },
    ],
  })
    // AuthService has more deps (JwtService, etc.); override what the test path needs.
    .useMocker((token) => ({}))
    .compile();
  return moduleRef.get(AuthService);
}

describe("validatePrivyUser", () => {
  it("creates a new user, persists privyId, maps the Lithos role, flags isNewUser", async () => {
    const prisma = makeFakePrisma();
    const svc = await buildService(prisma);
    const { user, isNewUser } = await svc.validatePrivyUser("did:privy:abc", "a@b.com", "Ann", "inspector");
    expect(isNewUser).toBe(true);
    expect(user.privyId).toBe("did:privy:abc");
    expect(user.role).toBe(UserRole.INSPECTOR);
  });

  it("matches a returning user by privyId without creating a duplicate", async () => {
    const prisma = makeFakePrisma();
    const svc = await buildService(prisma);
    await svc.validatePrivyUser("did:privy:abc", "a@b.com", "Ann", "supplier");
    const { user, isNewUser } = await svc.validatePrivyUser("did:privy:abc", undefined, undefined, undefined);
    expect(isNewUser).toBe(false);
    expect(prisma.rows.length).toBe(1);
    expect(user.privyId).toBe("did:privy:abc");
  });

  it("backfills privyId when matched by email", async () => {
    const prisma = makeFakePrisma();
    prisma.rows.push({ id: "u1", email: "a@b.com", role: UserRole.BUYER });
    const svc = await buildService(prisma);
    const { user, isNewUser } = await svc.validatePrivyUser("did:privy:xyz", "a@b.com", "Ann", undefined);
    expect(isNewUser).toBe(false);
    expect(user.privyId).toBe("did:privy:xyz");
  });

  it("forces ADMIN for allowlisted emails regardless of picked role", async () => {
    const prisma = makeFakePrisma();
    const svc = await buildService(prisma, "boss@lithos.com, other@x.com");
    const { user } = await svc.validatePrivyUser("did:privy:adm", "boss@lithos.com", "Boss", "buyer");
    expect(user.role).toBe(UserRole.ADMIN);
  });

  it("defaults unknown/absent role to SUPPLIER for new users", async () => {
    const prisma = makeFakePrisma();
    const svc = await buildService(prisma);
    const { user } = await svc.validatePrivyUser("did:privy:n", "n@b.com", "N", undefined);
    expect(user.role).toBe(UserRole.SUPPLIER);
  });
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `cd backend && npx jest auth.service.privy --silent`
Expected: FAIL — `validatePrivyUser` returns a `User` (not `{user, isNewUser}`) and ignores `privyId`/admin allowlist.

- [ ] **Step 3: Implement the rewrite**

Replace the body of `validatePrivyUser` in `backend/src/auth/auth.service.ts` with:

```typescript
  private mapLithosRole(role?: string): UserRole {
    const roleMap: Record<string, UserRole> = {
      supplier: UserRole.SUPPLIER,
      buyer: UserRole.BUYER,
      inspector: UserRole.INSPECTOR,
      logistics: UserRole.LOGISTICS,
      admin: UserRole.ADMIN,
    };
    return (role && roleMap[role.toLowerCase()]) || UserRole.SUPPLIER;
  }

  private isAdminEmail(email?: string): boolean {
    if (!email) return false;
    const list = (this.configService.get<string>("ADMIN_EMAILS") || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    return list.includes(email.toLowerCase());
  }

  async validatePrivyUser(
    privyUserId: string,
    email?: string,
    name?: string,
    role?: string,
  ): Promise<{ user: User; isNewUser: boolean }> {
    // 1) by privyId, 2) by email
    let user: User | null = await this.prisma.user.findUnique({
      where: { privyId: privyUserId },
    });
    if (!user && email) {
      user = await this.prisma.user.findUnique({ where: { email } });
    }

    const resolvedRole = this.isAdminEmail(email)
      ? UserRole.ADMIN
      : this.mapLithosRole(role);

    if (!user) {
      const created = await this.prisma.user.create({
        data: {
          privyId: privyUserId,
          email: email || `privy-${privyUserId}@temp.local`,
          name: name || "Privy User",
          role: resolvedRole,
          isEmailVerified: !!email,
          isActive: true,
        },
      });
      return { user: created, isNewUser: true };
    }

    // Existing user: backfill privyId; force ADMIN if allowlisted; apply an
    // explicitly picked role; never implicitly downgrade.
    const data: Record<string, unknown> = {};
    if (!user.privyId) data.privyId = privyUserId;
    if (this.isAdminEmail(email)) data.role = UserRole.ADMIN;
    else if (role) data.role = this.mapLithosRole(role);
    if (Object.keys(data).length > 0) {
      user = await this.prisma.user.update({ where: { id: user.id }, data });
    }
    return { user, isNewUser: false };
  }
```

Ensure `ConfigService` is injected in the `AuthService` constructor (it is used elsewhere; if not present, add `private configService: ConfigService` and import from `@nestjs/config`).

- [ ] **Step 4: Update the one caller**

In `backend/src/auth/auth.controller.ts` `privyLogin`, change:

```typescript
      const user = await this.authService.validatePrivyUser(
        verifiedToken.sub, email || undefined, name || undefined, role,
      );
      const result = await this.authService.login(user);
      ...
      return this.serializeAuthResult(result, "Privy authentication successful");
```

to:

```typescript
      const { user, isNewUser } = await this.authService.validatePrivyUser(
        verifiedToken.sub, email || undefined, name || undefined, role,
      );
      const result = await this.authService.login(user);
      ...
      return { ...this.serializeAuthResult(result, "Privy authentication successful"), isNewUser };
```

- [ ] **Step 5: Run the test, verify it passes**

Run: `cd backend && npx jest auth.service.privy --silent`
Expected: PASS (5 tests).

- [ ] **Step 6: Full suite + non-custodial guard + typecheck**

Run: `cd backend && npx jest --silent && npx tsc --noEmit`
Expected: all green, including `test/non-custodial.spec.ts`.

- [ ] **Step 7: Commit**

```bash
git add backend/src/auth/auth.service.ts backend/src/auth/auth.controller.ts backend/src/auth/auth.service.privy.spec.ts
git commit -m "feat(auth): privyId linking, Lithos role map, ADMIN allowlist, isNewUser"
```

---

## Task 4: Add `isNewUser` to the auth response DTO

**Files:**
- Modify: `backend/src/auth/dto/auth.dto.ts` (`AuthSuccessResponseDto`)

- [ ] **Step 1: Add the optional field**

In `backend/src/auth/dto/auth.dto.ts`, inside `AuthSuccessResponseDto`, add:

```typescript
  @ApiPropertyOptional({ description: "True when this Privy login just created the user" })
  isNewUser?: boolean;
```

(Ensure `ApiPropertyOptional` is imported from `@nestjs/swagger`.)

- [ ] **Step 2: Typecheck**

Run: `cd backend && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add backend/src/auth/dto/auth.dto.ts
git commit -m "feat(auth): expose isNewUser on auth success response"
```

---

## Task 5: Mobile — Privy login bridge hook

Exchanges a Privy session for the app JWT and reports whether a role picker is needed.

**Files:**
- Create: `front-end/src/pages/Auth/hooks/usePrivyLogin.ts`
- Modify: `front-end/src/services/authService.ts` (confirm `privyLogin` shape + response type)

- [ ] **Step 1: Confirm the authService payload + response type**

In `front-end/src/services/authService.ts`, ensure `privyLogin` is:

```typescript
  privyLogin: async (data: {
    privyToken: string;
    role?: string;
    email?: string;
    name?: string;
  }): Promise<LoginResponse & { isNewUser?: boolean }> => {
    return apiClient
      .post<LoginResponse & { isNewUser?: boolean }>('/auth/privy/login', data)
      .then((r) => r.data);
  },
```

(If the existing signature differs, update it to this. `LoginResponse` already carries `user` + tokens.)

- [ ] **Step 2: Write the bridge hook**

Create `front-end/src/pages/Auth/hooks/usePrivyLogin.ts`:

```typescript
import { useCallback, useState } from 'react';
import { usePrivy } from '@privy-io/expo';
import { authService } from '../../../services/authService';
import { useAuthStore } from '../../../stores/auth.store';

/**
 * Bridges a completed Privy session to the Lithos backend:
 * Privy access token -> POST /auth/privy/login -> app JWT in auth.store.
 * Returns needsRole=true when the backend just created the user, so the
 * caller can show the role picker (which calls completeRole()).
 */
export function usePrivyLogin() {
  const { getAccessToken, user: privyUser } = usePrivy();
  const login = useAuthStore((s) => s.login);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailFromPrivy = (): string | undefined =>
    privyUser?.linked_accounts?.find((a: any) => a.type === 'email')?.address;

  const exchange = useCallback(
    async (role?: string): Promise<{ needsRole: boolean }> => {
      setBusy(true);
      setError(null);
      try {
        const privyToken = await getAccessToken();
        if (!privyToken) throw new Error('No Privy session');
        const res = await authService.privyLogin({
          privyToken,
          role,
          email: emailFromPrivy(),
        });
        login(res.user, res.token ?? (res as any).accessToken, (res as any).refreshToken);
        return { needsRole: !!res.isNewUser && !role };
      } catch (e: any) {
        setError(e?.message ?? 'Login failed');
        throw e;
      } finally {
        setBusy(false);
      }
    },
    [getAccessToken, login, privyUser],
  );

  return { exchange, busy, error };
}
```

- [ ] **Step 3: Typecheck**

Run: `cd front-end && ../node_modules/.bin/tsc --noEmit -p tsconfig.json`
Expected: no errors in the new hook (resolve any mismatch with the real `LoginResponse` field names — `token` vs `accessToken` — by matching `auth.store.login`'s signature `(user, token, refreshToken?)`).

- [ ] **Step 4: Commit**

```bash
git add front-end/src/pages/Auth/hooks/usePrivyLogin.ts front-end/src/services/authService.ts
git commit -m "feat(mobile): usePrivyLogin bridge (Privy session -> app JWT)"
```

---

## Task 6: Mobile — unified Login screen (Google / X / email)

**Files:**
- Rewrite: `front-end/src/pages/Auth/screens/LoginScreen.tsx`

- [ ] **Step 1: Implement the screen**

Replace `front-end/src/pages/Auth/screens/LoginScreen.tsx` with (adapt styling tokens to the existing Salar components — `GradientBackground`, `GlassInput`, `GlassButton` — already used in this folder):

```tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useLoginWithOAuth, useLoginWithEmail } from '@privy-io/expo';
import { useNavigation } from '@react-navigation/native';
import { GradientBackground } from '../../../shared/components/GradientBackground';
import { GlassButton } from '../../../shared/components/GlassButton';
import { GlassInput } from '../../../shared/components/GlassInput';
import { usePrivyLogin } from '../hooks/usePrivyLogin';

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { exchange, error: bridgeError } = usePrivyLogin();
  const [phase, setPhase] = useState<'idle' | 'exchanging'>('idle');

  // After ANY Privy login completes, exchange for the app JWT.
  const afterPrivy = async () => {
    setPhase('exchanging');
    try {
      const { needsRole } = await exchange();
      if (needsRole) navigation.navigate('RolePicker');
      // returning users: AppBootstrap reacts to auth.store and shows Main.
    } finally {
      setPhase('idle');
    }
  };

  const { login: oauthLogin, state: oauthState } = useLoginWithOAuth({
    onSuccess: afterPrivy,
  });

  const { sendCode, loginWithCode, state: emailState } = useLoginWithEmail({
    onLoginSuccess: afterPrivy,
  });

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);

  const busy = phase === 'exchanging' || oauthState.status === 'loading';

  return (
    <GradientBackground>
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 14 }}>
        <Text style={{ color: '#fff', fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 8 }}>
          Sign in to Lithos
        </Text>

        <GlassButton textColor="#06201C" onPress={() => oauthLogin({ provider: 'google' })} disabled={busy}>
          Continue with Google
        </GlassButton>
        <GlassButton textColor="#06201C" onPress={() => oauthLogin({ provider: 'twitter' })} disabled={busy}>
          Continue with X
        </GlassButton>

        <Text style={{ color: '#9aa', textAlign: 'center', marginVertical: 4 }}>or with email</Text>

        {!codeSent ? (
          <>
            <GlassInput placeholder="you@email.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
            <GlassButton
              onPress={async () => { await sendCode({ email }); setCodeSent(true); }}
              disabled={busy || !email.includes('@')}
            >
              Email me a code
            </GlassButton>
          </>
        ) : (
          <>
            <GlassInput placeholder="6-digit code" keyboardType="number-pad" value={code} onChangeText={setCode} />
            <GlassButton onPress={() => loginWithCode({ code })} disabled={busy || code.length < 6}>
              Verify & sign in
            </GlassButton>
            <Text onPress={() => setCodeSent(false)} style={{ color: '#9aa', textAlign: 'center' }}>
              Use a different email
            </Text>
          </>
        )}

        {busy && <ActivityIndicator color="#2DD4BF" />}
        {(bridgeError || oauthState.status === 'error' || emailState.status === 'error') && (
          <Text style={{ color: '#f87171', textAlign: 'center' }}>
            {bridgeError ?? 'Login failed — please try again.'}
          </Text>
        )}
      </View>
    </GradientBackground>
  );
}
```

NOTE: if `GradientBackground`/`GlassInput`/`GlassButton` live at different import paths, match the imports used by the sibling screens in `front-end/src/pages/Auth/screens/`. Confirm the OAuth provider literal for X is `'twitter'` against the installed SDK's `OAuthProviderType`.

- [ ] **Step 2: Typecheck**

Run: `cd front-end && ../node_modules/.bin/tsc --noEmit -p tsconfig.json`
Expected: no errors in `LoginScreen.tsx`.

- [ ] **Step 3: Commit**

```bash
git add front-end/src/pages/Auth/screens/LoginScreen.tsx
git commit -m "feat(mobile): unified Privy login screen (Google/X/email-OTP)"
```

---

## Task 7: Mobile — first-login Role Picker screen

**Files:**
- Create: `front-end/src/pages/Auth/screens/RolePickerScreen.tsx`

- [ ] **Step 1: Implement the screen**

Create `front-end/src/pages/Auth/screens/RolePickerScreen.tsx`:

```tsx
import React, { useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { GradientBackground } from '../../../shared/components/GradientBackground';
import { GlassButton } from '../../../shared/components/GlassButton';
import { usePrivyLogin } from '../hooks/usePrivyLogin';

const ROLES = [
  { key: 'supplier', label: 'Supplier (miner / producer)' },
  { key: 'buyer', label: 'Buyer (refiner / trader)' },
  { key: 'inspector', label: 'Inspector (assay / quality)' },
  { key: 'logistics', label: 'Logistics provider' },
];

export default function RolePickerScreen() {
  const { exchange, busy, error } = usePrivyLogin();
  const [selecting, setSelecting] = useState<string | null>(null);

  const pick = async (role: string) => {
    setSelecting(role);
    try {
      await exchange(role); // updates role on backend + refreshes app JWT/user
      // AppBootstrap reacts to the updated auth.store and routes to Main.
    } finally {
      setSelecting(null);
    }
  };

  return (
    <GradientBackground>
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 14 }}>
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700', textAlign: 'center' }}>
          What's your role?
        </Text>
        <Text style={{ color: '#9aa', textAlign: 'center', marginBottom: 8 }}>
          This sets up your portal in Lithos.
        </Text>
        {ROLES.map((r) => (
          <GlassButton key={r.key} onPress={() => pick(r.key)} disabled={busy}>
            {r.label}
          </GlassButton>
        ))}
        {busy && <ActivityIndicator color="#2DD4BF" />}
        {error && <Text style={{ color: '#f87171', textAlign: 'center' }}>{error}</Text>}
      </View>
    </GradientBackground>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd front-end && ../node_modules/.bin/tsc --noEmit -p tsconfig.json`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add front-end/src/pages/Auth/screens/RolePickerScreen.tsx
git commit -m "feat(mobile): first-login role picker screen"
```

---

## Task 8: Mobile — rewire AuthStack, retire phone/password

**Files:**
- Modify: `front-end/src/navigation/AuthStack.tsx`
- Modify: `front-end/src/navigation/types.ts` (`AuthStackParamList`)

- [ ] **Step 1: Update the param list**

In `front-end/src/navigation/types.ts`, set `AuthStackParamList` to:

```typescript
export type AuthStackParamList = {
  Login: undefined;
  RolePicker: undefined;
};
```

(Remove `Welcome`, `Register`, `ForgotPassword`, `PhoneAuth` entries. If other files import those route names from this type, the typecheck in Step 3 will flag them — delete those now-dead navigations.)

- [ ] **Step 2: Rewrite the stack**

Replace `front-end/src/navigation/AuthStack.tsx` with:

```tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';
import LoginScreen from '../pages/Auth/screens/LoginScreen';
import RolePickerScreen from '../pages/Auth/screens/RolePickerScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStack() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0a0a0f' } }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="RolePicker" component={RolePickerScreen} />
    </Stack.Navigator>
  );
}
```

- [ ] **Step 3: Delete the retired screen files**

Run:
```bash
cd front-end
git rm src/pages/Auth/screens/WelcomeScreen.tsx \
       src/pages/Auth/screens/RegisterScreen.tsx \
       src/pages/Auth/screens/ForgotPasswordScreen.tsx \
       src/pages/Auth/screens/PhoneAuthScreen.tsx
```
(Keep `OAuthCallbackScreen.tsx` — it's the deep-link target. If any remaining file imports a deleted screen, remove that import/usage.)

- [ ] **Step 4: Typecheck the whole app**

Run: `cd front-end && ../node_modules/.bin/tsc --noEmit -p tsconfig.json`
Expected: 0 errors. Fix any dangling references to deleted routes/screens (e.g. `navigation.navigate('Welcome')`).

- [ ] **Step 5: Commit**

```bash
git add front-end/src/navigation
git commit -m "feat(mobile): auth entry = Privy login + role picker; retire phone/password screens"
```

---

## Task 9: Verify end-to-end (build + manual smoke)

**Files:** none (verification only)

- [ ] **Step 1: Backend green**

Run: `cd backend && npx jest --silent && npx tsc --noEmit`
Expected: all tests pass; non-custodial guard green; no type errors.

- [ ] **Step 2: Mobile typechecks + web bundles**

Run: `cd front-end && ../node_modules/.bin/tsc --noEmit -p tsconfig.json`
Expected: 0 errors.

- [ ] **Step 3: Confirm Privy dashboard methods enabled**

Manually verify in the Privy dashboard (app `cmieakfr2…`) that Google, Twitter/X, and Email are enabled and `lithos://` is an allowed redirect. (X requires the X developer app creds; if absent, expect only Google + email to work.)

- [ ] **Step 4: TestFlight build + manual login smoke**

Run: `cd front-end && eas build --platform ios --profile testflight --non-interactive` then `eas submit --platform ios --profile testflight --latest --non-interactive`.
On device: each of Google / X / email → new user sees the role picker → lands in app; sign out + back in (returning) skips the picker. Confirm `ADMIN_EMAILS` (set on Railway) yields an ADMIN account.

- [ ] **Step 5: Push**

```bash
cd /Users/henry/Documents/Gazillion-dollars/normie-apps/lithium-broker
git fetch origin && git merge origin/main --no-edit && git push origin main
```

---

## Notes for the implementer

- **Run order:** Tasks 1–4 (backend) before 5–8 (mobile) — the mobile bridge depends on the `isNewUser` field.
- **Backend deploy:** the new migration + `ADMIN_EMAILS` must reach Railway (set the env var in the Railway service) for the role flow to behave in the TestFlight build, which points at the live API.
- **Non-custodial prime directive is unchanged** — this is authentication only. Do not add embedded wallets or any fund-moving code; keep `test/non-custodial.spec.ts` green.
- **Salar styling:** the new screens must reuse the existing `GradientBackground`/`GlassInput`/`GlassButton` components and `#0B0B0E`/mint palette already used by the sibling Auth screens; match their exact import paths.
