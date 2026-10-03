# Portabox — Instant Quote

The client's multi-step quote app: **Where → What → Size → When → Send quote →
Confirmation**, plus staff-facing admin, call-centre dispatch and customer
portal views. Vite + React 19 + TypeScript + Tailwind 4. Built in Google AI
Studio by the original developer ([original
app](https://ai.studio/apps/826c43c5-6bec-4dec-810b-de94accc5597)); this
repository is the hosting copy. Currently on the client's **V3** source.

The main website links here for every quote CTA, and `/get-a-quote/` on that
site redirects here ([portabox-website](https://github.com/manuelbiocva/portabox-website)).
It also lifts this app's rates, zones, leg fees and interstate matrix out of
`src/services/pricingEngine.ts` with a script, so the two cannot drift apart.
Neither V2 nor V3 changed any of those numbers.

It reads `?postcode=3000` from the URL, which is how the website's hero boxes
hand over what the visitor already typed.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # writes dist/
npm run lint     # tsc --noEmit — clean as of V3
```

## Taking a new version from the client

Each drop has arrived with the same handful of problems, and each one reverts
whatever was fixed in the last. So:

```bash
rm -rf src && cp -r "<new source>/src" src       # and the root files
node tools/local-fixes.mjs                       # re-apply, then verify
npm install && npm run build
```

`tools/local-fixes.mjs` applies the eight local fixes listed below and is
idempotent — running it twice changes nothing. `--check` verifies without
writing and exits non-zero if anything is missing. It fails loudly rather than
skipping quietly when upstream code moves, because a silently unapplied fix
here means a blank page or a published credential.

Before pushing, confirm nothing live is staged:

```bash
git grep -nE "AIza[A-Za-z0-9_-]{20,}|sk_live|pk_live"
```

And check whether the pricing inputs moved — if they did, the website's
`tools/extract-quote-data.cjs` needs running too.

## Read this before you deploy it

### 1. The staff tools are hidden, not protected

V3 moved **Admin & Pricing**, **Call Center Dispatch** and **Customer Portal**
out of the header and behind one discreet lock icon, top right, desktop only.
That is a real improvement — a visitor will not stumble into them.

It is not a lock. Clicking it opens the portal hub, and clicking through to
*Admin Management & Pricing* lands on the Portabox Management Console — rate
editor, lead list, customer search — with no password at any point. The
customer portal shows an email-and-OTP screen, but it checks against records in
the browser's own storage.

Anyone who finds the icon has everything. Put real authentication in front of
the hub, or move these views to a separate deployment, before this is public.

### 2. Nothing is saved anywhere

Leads, bookings, fleet state, inventory and the Smartsheet staging queue all
live in `localStorage`. No email, no SMS, no CRM, no sheet.

`smartsheetService.ts` carries a Smartsheet API URL in its config, but nothing
posts to it — the module reads and writes browser storage. Across the whole
codebase the only real network call is to Google Calendar.

So the data lives in one browser on one device until that browser's storage is
cleared, and two people answering enquiries do not see the same list. The rates
the admin console edits behave the same way: a price change applies to the
browser that made it and nowhere else.

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
| `.env.local` | Optional. `VITE_STRIPE_PUBLISHABLE_KEY` loads the real Stripe.js for the test-card UI. `VITE_SITE_URL` is where the back button sends people when they cancel the quote. See `.env.local.example`. |

Live credentials arrive with every version and are **not** published here:

- A **Firebase** API key and OAuth client for the original developer's own
  Google Cloud project rather than Portabox's — a different project each
  version (`gen-lang-client-0776892310` in V1 and V2,
  `gen-lang-client-0997503885` in V3). The V1/V2 one is already public in the
  website repository's history, so it wants rotating or the project locking
  down at the Google Cloud end; leaving it out here does not undo that.
- A **Google Maps Platform** key, hardcoded as a fallback in
  `routingOptimizationService.ts` and committed in `.env.example`. Maps keys
  are billable, so an unrestricted one in a public repository is somebody
  else's invoice waiting to happen. It reads from the environment only.

## Deploying

It builds to a static `dist/`, so any static host will serve it. On Vercel,
import the repo and take the defaults — the Vite preset is detected, the build
command is `npm run build`, the output directory is `dist`. There is no router,
so no rewrite rules are needed.

Live at <https://portabox-instant-quote.vercel.app/>.

## Changes made to the supplied source

Kept deliberately small, so the next version merges cleanly. All of these are
applied by `tools/local-fixes.mjs`:

- **Dropped the explicit `esbuild@^0.25.0` devDependency.** It conflicts with
  `vite@8`, which wants `^0.27 || ^0.28`, and `npm install` fails outright with
  `ERESOLVE`. Nothing calls esbuild directly — Vite ships its own.
- **Restored the package name.** It arrives as `react-example`.
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
- **Made the back button's destination configurable**, in
  `CancelQuoteModal.tsx` and `App.tsx`. V3 added its own back button and
  cancel-quote modal — better than what was here before, and it replaced an
  earlier local fix — but it sends people to `https://portabox.com.au`, which
  does not resolve. The domain is `portabox.au`. It now reads `VITE_SITE_URL`,
  defaulting to the rebuilt site while that is in review.

## What is where

```
src/App.tsx                                    step state, the quote memo, lead submission
src/components/Step1Where.tsx                  …through Step6Confirmation.tsx — one per step
src/components/PortalHubModal.tsx              the staff entry point behind the lock icon
src/components/AdminPortal.tsx                 rate editor, leads, drop-off tracking
src/components/CallCenterCalendarPortal.tsx    dispatch, routing, fleet calendar
src/components/CustomerPortal.tsx              customer-facing booking history
src/components/CancelQuoteModal.tsx            the back button's confirm-and-leave step
src/services/pricingEngine.ts                  rates, zones, legs, interstate matrix
src/services/routingOptimizationService.ts     fleet routing, slot efficiency incentive
src/services/smartsheetService.ts              inventory, fleet and lead staging (localStorage)
src/services/braintreeService.ts               payment, simulated
src/data/australianPostcodes.ts                63 suburbs, 4 depots, measured road distances
tools/local-fixes.mjs                          re-applies the local fixes after a new drop
```
