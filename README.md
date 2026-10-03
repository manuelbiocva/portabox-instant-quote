# Portabox — Instant Quote

The client's multi-step quote app: **Where → What → Size → When → Send quote →
Confirmation**. Vite + React 19 + TypeScript + Tailwind 4. Built in Google AI
Studio by the original developer ([original
app](https://ai.studio/apps/826c43c5-6bec-4dec-810b-de94accc5597)); this
repository is the hosting copy.

The same five steps are also built natively into the main website at
`/get-a-quote/` ([portabox-website](https://github.com/manuelbiocva/portabox-website)),
which shares this app's pricing engine — the rates, zones, leg fees and
interstate matrix are lifted out of `src/services/pricingEngine.ts` by a script
there, so the two cannot drift apart.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # writes dist/
npm run lint     # tsc --noEmit
```

## Read this before you deploy it

Three things about the app as supplied. None of them stop it running; all three
change what happens once it is reachable from the internet.

### 1. Anyone can edit your prices

There is an **"Admin & Pricing" button in the page header**, top right, next to
the phone number. It is visible to every visitor and it has no login. One click
opens the rate editor, the lead list and the drop-off tracking.

`HANDOVER.md` calls this a footer link. It is not — it is in the header, on
every screen of the flow.

Gate it, remove it, or move rate editing elsewhere before this is public. This
is the blocking item.

### 2. Nothing is saved anywhere

Leads from "Send quote" go to `localStorage` and no further — no email, no SMS,
no CRM. They live in one browser on one device until that browser's storage is
cleared. Two people answering enquiries do not see the same list.

The rates the admin portal edits are stored the same way
(`portabox_app_config_v2`), so a price change applies to the browser that made
it and to nothing else.

Both need a shared backend before this is the real quoting tool.

### 3. The payment step is a simulation

`StripePaymentSection` runs against Stripe test mode and takes no money.

If it becomes real, the price must be recalculated **on the server** at charge
time. Every rate currently lives in the browser bundle, where anyone can edit
them in devtools before paying.

## Configuration

| File | What it is |
| --- | --- |
| `firebase-applet-config.json` | **Ships blank.** Fill in with Portabox's own Firebase project to enable the Google Calendar delivery slots. Left empty, the app falls back to static slots and everything else works. |
| `.env.local` | Optional. `VITE_STRIPE_PUBLISHABLE_KEY` loads the real Stripe.js for the test-card UI. `VITE_SITE_URL` is where the header's back arrow goes from step 1, when there is nothing in the tab's history to go back to. It currently defaults to `https://portabox-website.vercel.app/`, the rebuilt site — **temporary**, until the rebuild is what people arrive from, then it becomes `https://portabox.au/`. See `.env.local.example`. |

The config that came with the source carried a live API key and OAuth client for
`gen-lang-client-0776892310` — the original developer's Google Cloud project,
not Portabox's. It was blanked rather than published here. That key is already
public in the website repository's history, so it should be rotated or the
project locked down at the Google Cloud end; leaving it out of this repo does
not undo that.

## Deploying

It builds to a static `dist/`, so any static host will serve it. On Vercel,
import the repo and take the defaults — the Vite preset is detected, the build
command is `npm run build`, the output directory is `dist`. There is no router,
so no rewrite rules are needed.

Point it at a subdomain or a path the main site links to — `/booking/`, say, or
`quote.portabox.au`. Not `/get-a-quote/`: that URL belongs to the native flow on
the main site.

## Changes made to the supplied source

Three:

- **Dropped the explicit `esbuild@^0.25.0` devDependency.** It conflicted with
  `vite@8`, which wants `^0.27 || ^0.28`, and `npm install` failed outright with
  `ERESOLVE`. Nothing calls esbuild directly — Vite ships its own.
- **Blanked `firebase-applet-config.json`**, as above. It is imported statically
  by `googleCalendarService.ts`, so the file has to exist for the build to
  succeed; it ships with empty values rather than being ignored.
- **Made Firebase genuinely optional** in `googleCalendarService.ts`. The
  calendar was documented as falling back to static delivery slots without a
  config, and it did not: `initializeApp` throws `auth/invalid-api-key` on an
  empty key, and because that call sits at module scope the throw landed before
  React mounted. The result was a blank page and one console error. Firebase is
  now only initialised when a real config is present, and the three call sites
  treat a null `auth` as signed out.

Everything else is the source as delivered.

## What is where

```
src/App.tsx                      step state, the quote memo, lead submission
src/components/Step1Where.tsx    …through Step6Confirmation.tsx — one per step
src/components/AdminPortal.tsx   rate editor, leads, drop-off tracking
src/services/pricingEngine.ts    rates, zones, legs, interstate matrix
src/data/australianPostcodes.ts  63 suburbs, 4 depots, measured road distances
```

`HANDOVER.md` is the original developer's note, kept as delivered. It is
accurate except for where the admin button lives.
