# Portabox — Instant Quote

The client's multi-step quote app: **Where → What → Size → When → Send quote →
Confirmation**, plus staff-facing admin, call-centre dispatch and customer
portal views. Vite + React 19 + TypeScript + Tailwind 4. Built in Google AI
Studio by the original developer ([original
app](https://ai.studio/apps/826c43c5-6bec-4dec-810b-de94accc5597)); this
repository is the hosting copy. Currently on the client's **V2** source.

The main website links here for every quote CTA, and `/get-a-quote/` on that
site redirects here ([portabox-website](https://github.com/manuelbiocva/portabox-website)).
It also lifts this app's rates, zones, leg fees and interstate matrix out of
`src/services/pricingEngine.ts` with a script, so the two cannot drift apart.
V2 changed none of those numbers.

It reads `?postcode=3000` from the URL, which is how the website's hero boxes
hand over what the visitor already typed.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # writes dist/
npm run lint     # tsc --noEmit — see "Known issues in the supplied source"
```

## Read this before you deploy it

Four things about the app as supplied. None stop it running; all four change
what happens once it is reachable from the internet.

### 1. Three staff tools are open to everyone

The page header carries **Admin & Pricing**, **Call Center Dispatch** and
**Customer Portal**. All three are visible to every visitor on every step, and
none is behind a login.

- **Admin & Pricing** opens the rate editor, the lead list and drop-off
  tracking. One click and a visitor can change what you charge.
- **Call Center Dispatch** opens routing, the fleet view and the delivery
  calendar. No authentication of any kind.
- **Customer Portal** shows an email-and-OTP screen, but it checks against
  records in the browser's own storage. It is a UI, not a door.

V1 had one of these. V2 has three. Gate them, remove them, or move them to a
separate deployment before this is public. This is the blocking item.

### 2. Nothing is saved anywhere

Leads, bookings, fleet state, inventory and the Smartsheet staging queue all
live in `localStorage`. No email, no SMS, no CRM, no sheet.

`smartsheetService.ts` carries a Smartsheet API URL in its config, but nothing
posts to it — the whole module reads and writes browser storage. Across all the
new services, the only real network call in the codebase is to Google Calendar.

So the data lives in one browser on one device until that browser's storage is
cleared, and two people answering enquiries do not see the same list. The rates
the admin portal edits behave the same way: a price change applies to the
browser that made it and to nothing else.

This needs a shared backend before it is the real quoting tool.

### 3. The payment steps are simulations

`StripePaymentSection` and `BraintreePaymentSection` take no money.

If either becomes real, the price has to be recalculated **on the server** at
charge time. Every rate currently lives in the browser bundle, where anyone can
edit them in devtools before paying.

### 4. The quote is not a contract

The figures are computed in the browser from the rates in this repository.
Treat them as an estimate to confirm, which is what the UI says.

## Configuration

| File | What it is |
| --- | --- |
| `firebase-applet-config.json` | **Ships blank.** Fill in with Portabox's own Firebase project to enable the Google Calendar delivery slots. Left empty, the app falls back to static slots and everything else works. |
| `.env.example` | `VITE_GOOGLE_MAPS_API_KEY` renders the map embed in the call-centre view. **Ships as a placeholder** — see below. |
| `.env.local` | Optional. `VITE_STRIPE_PUBLISHABLE_KEY` loads the real Stripe.js for the test-card UI. `VITE_SITE_URL` is where the header's back arrow goes from step 1 when the tab has no history to go back to. See `.env.local.example`. |

Two live credentials arrived with the source and are **not** published here:

- A **Firebase** API key and OAuth client for `gen-lang-client-0776892310`, the
  original developer's Google Cloud project rather than Portabox's. Already
  public in the website repository's history, so it wants rotating or the
  project locking down at the Google Cloud end — leaving it out here does not
  undo that.
- A **Google Maps Platform** key, new in V2, hardcoded as a fallback in
  `routingOptimizationService.ts` and committed in `.env.example`. Maps keys are
  billable, so an unrestricted one in a public repository is somebody else's
  invoice waiting to happen. It now reads from the environment only.

## Deploying

It builds to a static `dist/`, so any static host will serve it. On Vercel,
import the repo and take the defaults — the Vite preset is detected, the build
command is `npm run build`, the output directory is `dist`. There is no router,
so no rewrite rules are needed.

Live at <https://portabox-instant-quote.vercel.app/>.

## Changes made to the supplied source

Kept deliberately small, so the next version from the client merges cleanly.
All of these were re-applied on top of V2, because V2 reverted every one:

- **Dropped the explicit `esbuild@^0.25.0` devDependency.** It conflicts with
  `vite@8`, which wants `^0.27 || ^0.28`, and `npm install` fails outright with
  `ERESOLVE`. Nothing calls esbuild directly — Vite ships its own.
- **Restored the package name.** V2 shipped as `react-example`.
- **Blanked `firebase-applet-config.json`** and **removed the hardcoded Maps
  key**, as above.
- **Made Firebase genuinely optional** in `googleCalendarService.ts`. The
  calendar is documented as falling back to static delivery slots without a
  config, and it does not: `initializeApp` throws `auth/invalid-api-key` on an
  empty key, and because that call sits at module scope the throw lands before
  React mounts. The result is a blank page and one console error. Firebase is
  only initialised when a real config is present, and the three call sites
  treat a null `auth` as signed out.
- **Read `?postcode=` from the URL** in `App.tsx`, so the hand-off from the
  website opens with step 1 already answered instead of asking twice.
- **A back arrow on step 1** in `Header.tsx`. The header had one from step 2;
  on the first step it rendered an empty spacer, so the corner people look at
  to get out was blank. It leaves the quote rather than stepping through it —
  back to the page they came from if they arrived from a link, otherwise to
  `VITE_SITE_URL`.

## Known issues in the supplied source

Left as delivered rather than patched, so the next version merges cleanly.
`npm run build` succeeds regardless, because Vite does not typecheck, but
`npm run lint` reports four errors — all in code new to V2:

| Where | What |
| --- | --- |
| `AdminPortal.tsx:129`, `:401` | Yard inspection literals are missing the required `horizontalLiftSafetyLocks` field. |
| `AdminPortal.tsx:426` | `passed` is `boolean or undefined` where a `boolean` is required. |
| `smartsheetService.ts:172` | `truckType: 'Level-Lift Heavy System'` is not one of the three values its own type allows (`Crane Lift Heavy`, `Slide-On Standard`, `Dual Container Haulage`). Either the union is missing a member or the value is wrong — only the client can say which. |

## What is where

```
src/App.tsx                                    step state, the quote memo, lead submission
src/components/Step1Where.tsx                  …through Step6Confirmation.tsx — one per step
src/components/AdminPortal.tsx                 rate editor, leads, drop-off tracking
src/components/CallCenterCalendarPortal.tsx    dispatch, routing, fleet calendar
src/components/CustomerPortal.tsx              customer-facing booking history
src/services/pricingEngine.ts                  rates, zones, legs, interstate matrix
src/services/routingOptimizationService.ts     fleet routing, slot efficiency incentive
src/services/smartsheetService.ts              inventory, fleet and lead staging (localStorage)
src/services/braintreeService.ts               payment, simulated
src/data/australianPostcodes.ts                63 suburbs, 4 depots, measured road distances
```
