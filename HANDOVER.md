# Portabox Instant Quote: handover notes

Exported from Google AI Studio on 1 Oct 2026. Vite + React 19 + TypeScript + Tailwind 4.

## Run it

    npm install
    npm run dev        # http://localhost:3000
    npm run build      # static output in /dist

No API keys are needed for the quote flow. The README's mention of GEMINI_API_KEY is
AI Studio boilerplate: nothing in src/ calls Gemini.

## What is real and what is simulated (read before demoing to the client)

| Feature | Status |
|---|---|
| 6-step quote flow, pricing engine, postcode lookup, sidebar, UI | Real, runs fully in the browser |
| Pricing rates, zones, promo codes, fuel surcharge | Real, but stored in the browser's localStorage (key portabox_app_config_v2). Edited via /admin. Resets per browser. |
| Leads ("Send quote") | Saved to localStorage only. NOT sent anywhere. No SMS, no email, no CRM. |
| SMS and email on the confirmation screen | Simulated previews. Nothing is sent. |
| Stripe payment | Simulated. Generates a fake transaction id after a 1.2 s delay. Do not present as live payments. |
| Google Calendar delivery slots | Optional. Uses Firebase Auth from the original owner's Google project. Falls back to static slots if sign-in fails. |
| Admin Portal (link in the footer) | No login. Anyone who finds the link can change prices. Hide or protect before going live. |
| Drop-off tracking tab | Browser-local analytics only. Google Ads cannot see it. |

## Before it can be the live quoting tool

1. Leads must go somewhere: POST to a GoHighLevel inbound webhook (or an API) from
   App.tsx handleSendQuote. That single change turns it from a demo into a lead tool.
2. Pricing should move out of localStorage into a shared source (Google Sheet or JSON
   on the server) so every visitor sees the same rates.
3. Remove or password-protect the Admin Portal route.
4. Add dataLayer pushes (quote_start, quote_step, quote_generated, lead_captured) for GTM.
5. Decide on payments: remove the Stripe section for v1, or wire a real server-side intent.

## Hosting for the client demo

It is a static site after `npm run build`. GitHub Pages, Cloudflare Pages, Netlify or
Vercel all work with zero config (build command: npm run build, output: dist).
For production on portabox.au/booking/ see the LH Media action plan (Cloudflare route).

## Files

- src/services/pricingEngine.ts   all pricing logic and default rates
- src/data/australianPostcodes.ts  postcode -> suburb/state/hub lookup
- src/components/Step1Where ... Step6Confirmation.tsx  the screens
- src/components/AdminPortal.tsx   rate editor + leads + drop-off tracking
- firebase-applet-config.json      public web config for the original owner's Firebase project (calendar sign-in only)
