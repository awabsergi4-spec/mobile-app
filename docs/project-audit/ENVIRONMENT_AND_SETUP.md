# Environment & Local Setup (Windows)

Verified on the audit machine (2026-11-14): Windows 11, Node **20.20.2**, npm 10.8.2, Flutter **3.44.9**,
PostgreSQL listening on `localhost:5432` (DB `sahl`, migrated + seeded), **Redis not running**.
No secret values are reproduced in this document.

## 1. Environment variables (`apps/backend/.env`)

Next.js loads `apps/backend/.env` automatically (via `@next/env`/dotenv) for `next dev`, `next build`,
`next start`. The Prisma CLI also loads it. **`tsx` scripts (realtime server) and Vitest do not.**

| Variable | Required? | Used by | Notes |
|---|---|---|---|
| `DATABASE_URL` | **Required** | Prisma | `postgresql://USER:PASSWORD@localhost:5432/sahl?schema=public` |
| `JWT_PRIVATE_KEY` | **Required** | `infrastructure/identity/auth-services.ts` | RSA private key PEM (PKCS#8). Import-time throw if missing |
| `JWT_PUBLIC_KEY` | **Required** | same + `realtime/server.ts` | Matching public key PEM (SPKI) |
| `ACCESS_TOKEN_TTL` | Optional (`15m`) | auth-services | format `<n><s\|m\|h\|d>`; admin cookie is hard-coded to 15 min regardless |
| `REFRESH_TOKEN_TTL` | Optional (`30d`) | auth-services | same format |
| `ALLOWED_ORIGINS` | Optional | `middleware.ts` (CORS for /api/v1), realtime | comma list; needed for Flutter **web** (`http://localhost:5757`) |
| `REDIS_URL` | Optional today | realtime server, `jobs/queue.ts` (unused) | API runs without Redis |
| `REALTIME_PORT` | Optional (`4001`) | realtime server | |
| `SEED_ADMIN_PHONE`, `SEED_ADMIN_PASSWORD` | Optional (dev fallbacks in seed.ts) | `prisma/seed.ts` | **set real values before seeding any shared DB** |
| `DEFAULT_REGION_CODE/CURRENCY/LANGUAGE` | **Unused** | — | seed hard-codes SD/SDG/ar; register route hard-codes `SD` |
| `CLOUDINARY_*` | **Unused** | — | no Cloudinary adapter exists |
| `FCM_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY` | **Unused** | — | `firebase-admin` is never imported |
| `GOOGLE_MAPS_API_KEY` | **Unused** | — | no maps in backend or Flutter |
| `NODE_ENV` | set by Next | cookie `secure` flag, Prisma singleton | |

Current local `.env` (structure only): all three required values present; JWT keys are PKCS#8/SPKI,
double-quoted, single-line with `\n` escapes (the correct form); Cloudinary/FCM/Maps are empty.
`apps/backend/private.pem` and `public.pem` exist on disk — `.gitignore` covers `.env` but **not `*.pem`**;
add `*.pem` before the first commit (the project directory is not currently a git repository).

## 2. JWT keys — how it actually works and the Windows procedure

Implementation facts:
- `JwtTokenService` signs **RS256** with `JWT_PRIVATE_KEY` and verifies with `JWT_PUBLIC_KEY`; the strings are
  passed straight to `jsonwebtoken`, so they must be real multi-line PEM text **after** env loading.
- dotenv expands `\n` into newlines **only inside double quotes**. Single quotes or no quotes leave a literal
  `\n` → `jsonwebtoken` fails (e.g. "secretOrPrivateKey must be an asymmetric key when using RS256").
- If either variable is missing, every route/admin page that imports `auth-services.ts` fails with
  `Missing required environment variable: JWT_PRIVATE_KEY` (or `_PUBLIC_KEY`). Typical causes:
  `.env` not in `apps/backend`, running the server from another directory, or running a `tsx` script
  (which does not read `.env`).

### Generate a keypair on Windows (no OpenSSL needed)

From `apps/backend` in PowerShell, write a small script to your temp folder and run it:

```powershell
@'
const { generateKeyPairSync } = require("crypto");
const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" },
});
const esc = (s) => s.trim().replace(/\r?\n/g, "\\n");
console.log(`JWT_PRIVATE_KEY="${esc(privateKey)}"`);
console.log(`JWT_PUBLIC_KEY="${esc(publicKey)}"`);
'@ | Set-Content -Encoding utf8 "$env:TEMP\gen-jwt.js"
node "$env:TEMP\gen-jwt.js"
```

Replace the two `JWT_*` lines in `apps/backend/.env` with the two printed lines (keep them on one line each,
in double quotes). Do not paste them anywhere else. Delete the temp script afterwards.

Alternative with Git for Windows' OpenSSL (`C:\Program Files\Git\usr\bin\openssl.exe`):
`openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out private.pem` and
`openssl pkey -in private.pem -pubout -out public.pem`, then convert each file to a single `\n`-escaped line
(e.g. with the same `esc` function reading the file via `fs.readFileSync`). Keep `.pem` files out of version control.

Rotating keys invalidates all issued access tokens (refresh tokens stay valid; clients refresh transparently).

### Realtime server and JWT
`npm run realtime:dev` (`tsx watch src/realtime/server.ts`) does **not** load `.env`, so `JWT_PUBLIC_KEY`
is empty and every socket is rejected (and `REDIS_URL` falls back to `redis://localhost:6379`).
Recommended fix (not applied in this audit): load `.env` at the top of `server.ts` (e.g. `@next/env`'s
`loadEnvConfig(process.cwd())`). Nothing in the app uses realtime yet, so this does not block current flows.

## 3. PostgreSQL

Install PostgreSQL 15+ for Windows, create database `sahl`, set `DATABASE_URL`. Then in `apps/backend`:

```bash
npm install
```
```bash
npx prisma generate
```
```bash
npx prisma migrate deploy
```
```bash
npx prisma db seed
```

`npm run prisma:migrate` runs `prisma migrate dev` (may create migrations / reset on drift) — use only on a disposable dev DB.

## 4. Redis (optional today)

Only needed for `npm run realtime:dev`. On Windows use Memurai, Docker (`redis:7`), or WSL. Set `REDIS_URL`.

## 5. Backend + Admin startup

```bash
cd apps/backend
```
```bash
npm run dev
```

- API: `http://localhost:3000/api/v1/health`
- Admin: `http://localhost:3000/admin/login` — sign in with the seeded admin phone/password.
- OTP codes are printed in this terminal (`[OTP] PHONE_VERIFICATION code for …`).
- Checks: `npm run typecheck`, `npm run lint`, `npm test`, `npx prisma validate`, `npm run build`.
- `.claude/launch.json` has `sahl-backend-admin` (npm run dev, port 3000) and `sahl-mobile-web` (flutter web-server 5757).

The root `package.json` declares npm workspaces (`apps/backend`, `packages/shared`); the lockfile is at the repo root.
The CI workflow still says "no package-lock.json exists" and uses `npm install` in `apps/backend` — outdated.

## 6. Flutter startup

```bash
cd apps/mobile
```
```bash
flutter pub get
```
```bash
flutter run -d emulator-5554
```

- Configuration via `--dart-define`: `APP_ENV=development|staging|production`, `API_BASE_URL=http://host:port`.
- Defaults: Android → `http://10.0.2.2:3000` (emulator → host machine), others → `http://localhost:3000`.
- Physical Android device: `--dart-define=API_BASE_URL=http://<PC-LAN-IP>:3000` **and** add that IP to
  `android/app/src/debug/res/xml/network_security_config.xml` (cleartext is allowed only for 10.0.2.2/localhost/127.0.0.1).
  Also allow inbound TCP 3000 in Windows Firewall.
- Flutter web: `flutter run -d web-server --web-port 5757` and add `http://localhost:5757` to `ALLOWED_ORIGINS`.
- Release builds require HTTPS (no cleartext) and are currently signed with the **debug** key.
- No staging/production API URL is defined anywhere in the repo.

## 7. Android emulator checklist

1. Backend running on port 3000 on the host.
2. Emulator uses `10.0.2.2:3000` (default) — no extra config.
3. Register in the app → read the OTP from the backend console → verify → log in.
4. Note the known OTP-phone bug when the number starts with `+` (see BUGS_AND_TECHNICAL_DEBT.md, B-03).

## 8. Third-party credentials needed for launch

| Service | Status | Needed for |
|---|---|---|
| SMS provider (OTP) | none — console sender | real phone verification/login |
| Payment gateway (card / mobile money in Sudan) | none — Mock provider only | collecting real money |
| Cloudinary (or other storage) | env vars only, no adapter | document/portfolio/creative uploads |
| Firebase (FCM + `google-services.json`) | not integrated | push notifications |
| Google Maps / location | not integrated | on-demand location picking & tracking |
| Android release keystore | none | Play Store release |
| AI provider (optional) | config table only | AI features (all disabled) |
