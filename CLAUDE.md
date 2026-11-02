# menuLaundy — Lavandería GMO customer app

Adds to `~/.claude/CLAUDE.md` (global rules). Where this file differs, this file wins.

Customer-facing web app for Lavandería y Auto-Servicio GMO (companyId **1**): price list,
receipts, Mis Puntos / Recompensas, Reservar, Mi QR. Used on customers' phones and on the
in-store screen. Vite + React 18 + Ionic React 8 (tabs) + Tailwind, React Router **v5**
(`IonReactRouter`, `useHistory`).

## 1. Branches and deploy (overrides global §6)
- Work and commit on **`developement`** — the extra "e" is the real branch name. Never
  commit straight to `main`.
- `main` = **production**: every push auto-deploys to Azure Static Web Apps
  (`purple-forest-05c85b51e.3.azurestaticapps.net`). Promote `developement` → `main`
  only when the user asks to release (PR or merge, as they choose).
- There is no `qa` branch/environment here.

## 2. Backend access
- No backend code lives here. The app calls `smartloans_backend` endpoints through
  `src/api/client.ts` (`get` / `post`). Base URL comes from `VITE_API_URL` and the company
  from `VITE_COMPANY_ID` (`src/api/rewards.ts`) — never hardcode the host (this replaces
  global §6's `appEnv.ts`, which doesn't exist here).
- A feature that needs a new endpoint or stored procedure is built in `smartloans_backend`
  via the posgmo-factory pipeline (global §3 applies there, not to this repo's code).

## 3. Customer session
- Login is by phone number: `src/lib/clientSession.ts` keeps the client on the device for
  30 days (`useClientSession`, `saveClientSession`, `clearClientSession`).
- **Inicio is public.** `/puntos`, `/recompensas`, `/reservar`, `/qr` are wrapped in
  `RequireLogin` and show `LoginPage` until logged in, then continue to that page.
- Don't add new "enter your phone" prompts — read the session. "Salir" must call
  `clearClientSession()` (logs out everywhere).

## 4. Layout and UI
- Mobile-first: check every UI change at **375px** wide and at desktop width. No horizontal
  scroll; respect safe-area insets (`viewport-fit=cover` is on).
- Root font size stays **16px** — never shrink it for small screens (it shrank all rem
  sizing and made the app "very small" on phones).
- The bottom tab bar lives in `App.tsx` (Inicio / Reservar / Mi QR / Mis Puntos /
  Recompensas). Pages must not add their own bottom nav.
- Inside a flex row, a `w-full` child squeezes `flex-1 min-w-0` siblings to zero width
  (vertical one-letter text) — use `basis-full` + `flex-wrap` for a full-width row.
- Every button must do something; don't ship decorative buttons.
- Business name is **"Lavandería y Auto-Servicio"** (the logo image still says Auto-Lavado).

## 5. Rewards and data traps
- Client QR is the signed `GMO1.<companyId>.<clientId>.<firma>` from `POST /laundryDevices/clientQr`
  (`useClientQr` / `ClientQrCode`). Never build it in the app — the HMAC secret is backend-only and
  the washers reject anything else. The POS scanner still accepts legacy `CLIENT:<id>:<name>`.
- Points balance (`posRewardBalances`) and 3+1 rewards are separate: 3+1 "buy 3, the 4th
  free" cards use per-product `posRewardProductCounts.unitsAvailable` matched by
  `freeProductId`; free services = `floor(unitsAvailable / requiredPoints)`.
- Redemption happens in POSVendingV2 (cashier scans the QR); this app only shows status.
- Client **#1 "Desconocido -1"** is the POS walk-in default and has phone 6624737005, so it
  carries everyone's anonymous sales — fine as test data, not a real customer.
- Known PII exposure (needs backend work): `findClientByPhone` downloads `/all_clients`, and
  slot availability downloads full reservations for a date.
- Slot taken = same date + `timeSlot` + `serviceType`, status ≠ `cancelled` (mirrors
  `sp_reservations` in smartloans_backend).

## 6. Verify before done
- `npm run build` must pass (Vite doesn't type-check).
- `npm run typecheck` has known pre-existing errors (missing `@types/react-router-dom`,
  `IonReactRouter` children typing, unused vars) — don't add new ones.
- Dev server: `.claude/launch.json` runs Vite on **5180** (5173 is usually POSVending).
  Test logged-in screens by setting the session, or log in with 6624737005 (read-only).
