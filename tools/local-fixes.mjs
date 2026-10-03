/* Re-apply the local fixes on top of a fresh drop from the client.
 *
 * Every version so far has arrived with the same handful of problems, and
 * each new version reverts whatever was fixed last time — V2 and V3 both did.
 * Rather than hand-patching the same six places again, this applies them and
 * then verifies them.
 *
 *   node tools/local-fixes.mjs          apply, then verify
 *   node tools/local-fixes.mjs --check  verify only; exits 1 if anything is missing
 *
 * It is idempotent: running it twice changes nothing the second time.
 *
 * It is deliberately strict. If a fix cannot be applied because the code it
 * anchors to has moved, it fails loudly rather than skipping quietly — a
 * silently unapplied fix here means a blank page or a published credential.
 */
import fs from 'node:fs';

const CHECK_ONLY = process.argv.includes('--check');
const applied = [];
const already = [];
const failed = [];

const read = (f) => fs.readFileSync(f, 'utf8');
const write = (f, s) => fs.writeFileSync(f, s);

/**
 * @param name   what the fix is, for the report
 * @param file   the file it touches
 * @param done   (src) => boolean — is it already in place?
 * @param apply  (src) => string  — return the patched source, or throw
 */
function fix(name, file, done, apply) {
  let src;
  try {
    src = read(file);
  } catch {
    failed.push(`${name}: ${file} is missing`);
    return;
  }
  if (done(src)) { already.push(name); return; }
  if (CHECK_ONLY) { failed.push(`${name}: NOT APPLIED`); return; }
  try {
    const out = apply(src);
    if (out === src || !done(out)) throw new Error('anchor not found — the upstream code moved');
    write(file, out);
    applied.push(name);
  } catch (e) {
    failed.push(`${name}: ${e.message}`);
  }
}

/* -- 1. package.json ------------------------------------------------------
   esbuild ^0.25 conflicts with vite@8's peer range (^0.27 || ^0.28), so
   npm install fails outright with ERESOLVE. Nothing calls esbuild directly;
   Vite ships its own. The name arrives as the scaffolding default. */
fix(
  'package.json: drop the esbuild pin, restore the name',
  'package.json',
  (s) => { const p = JSON.parse(s); return !p.devDependencies?.esbuild && p.name === 'portabox-instant-quote'; },
  (s) => {
    const p = JSON.parse(s);
    delete p.devDependencies.esbuild;
    p.name = 'portabox-instant-quote';
    return JSON.stringify(p, null, 2) + '\n';
  }
);

/* -- 2. firebase-applet-config.json ---------------------------------------
   Arrives carrying a live API key and OAuth client for the original
   developer's Google Cloud project, not Portabox's — and a different project
   each version. It is imported statically, so the file must exist; it ships
   with empty values. */
fix(
  'firebase config: blank the developer\'s project credentials',
  'firebase-applet-config.json',
  (s) => { const c = JSON.parse(s); return !c.apiKey && !c.projectId; },
  (s) => {
    const c = JSON.parse(s);
    const blank = {};
    for (const k of Object.keys(c)) blank[k] = '';
    return JSON.stringify(blank, null, 2) + '\n';
  }
);

/* -- 3. .env.example ------------------------------------------------------
   A Google Maps Platform key is billable. One arrives committed here. */
fix(
  '.env.example: replace the live Maps key with a placeholder',
  '.env.example',
  (s) => !/AIza[A-Za-z0-9_-]{20,}/.test(s),
  (s) => s.replace(/VITE_GOOGLE_MAPS_API_KEY="[^"]*"/, 'VITE_GOOGLE_MAPS_API_KEY="MY_GOOGLE_MAPS_API_KEY"')
);

/* -- 4. routingOptimizationService.ts -------------------------------------
   The same Maps key, hardcoded as a runtime fallback. Unset, only the
   call-centre map embed stops rendering; the slot-efficiency incentive the
   pricing engine imports is arithmetic over depot coordinates. */
fix(
  'routing service: read the Maps key from the environment only',
  'src/services/routingOptimizationService.ts',
  (s) => !/AIza[A-Za-z0-9_-]{20,}/.test(s),
  (s) => s.replace(
    /export const GOOGLE_MAPS_API_KEY =\s*\(import\.meta\.env\.VITE_GOOGLE_MAPS_API_KEY as string\) \|\|\s*'AIza[A-Za-z0-9_-]+';/,
    `/**\n` +
    ` * Supplied with a live key hardcoded as the fallback. A Maps Platform key\n` +
    ` * is billable, so a public repository is the last place for one — and it\n` +
    ` * belonged to the original developer's Google Cloud project rather than\n` +
    ` * Portabox's. Read from the environment only.\n` +
    ` */\n` +
    `export const GOOGLE_MAPS_API_KEY =\n` +
    `  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || '';`
  )
);

/* -- 5. googleCalendarService.ts ------------------------------------------
   The calendar is documented as falling back to static delivery slots without
   a config. It does not: initializeApp throws auth/invalid-api-key on an empty
   key, and that call sits at module scope, so the throw lands before React
   mounts and takes the whole page down. Blank page, one console error. */
fix(
  'calendar service: make Firebase genuinely optional',
  'src/services/googleCalendarService.ts',
  (s) => s.includes('hasFirebaseConfig'),
  (s) => {
    let out = s.replace(
      /const app = getApps\(\)\.length === 0 \? initializeApp\(firebaseConfig\) : getApp\(\);\s*\nexport const auth = getAuth\(app\);/,
      `// Firebase is only touched when a real config is present. initializeApp\n` +
      `// throws auth/invalid-api-key on an empty key, and because this runs at\n` +
      `// module scope the throw lands before React mounts — a blank page. The\n` +
      `// three call sites below treat a null auth as "signed out", which is what\n` +
      `// sends DeliverySlotPicker to the static windows.\n` +
      `const hasFirebaseConfig = Boolean(firebaseConfig?.apiKey && firebaseConfig?.projectId);\n` +
      `const app = hasFirebaseConfig\n` +
      `  ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApp())\n` +
      `  : null;\n` +
      `export const auth = app ? getAuth(app) : null;\n` +
      `export const isCalendarConfigured = hasFirebaseConfig;`
    );
    out = out.replace(
      '  return onAuthStateChanged(auth, async (user: User | null) => {',
      `  if (!auth) {\n` +
      `    if (onAuthFailure) onAuthFailure();\n` +
      `    return () => {};\n` +
      `  }\n` +
      `  return onAuthStateChanged(auth, async (user: User | null) => {`
    );
    out = out.replace(
      '    const result = await signInWithPopup(auth, provider);',
      `    if (!auth) {\n` +
      `      throw new Error(\n` +
      `        'Google Calendar is not configured. Fill in firebase-applet-config.json to enable it.'\n` +
      `      );\n` +
      `    }\n` +
      `    const result = await signInWithPopup(auth, provider);`
    );
    out = out.replace('  await signOut(auth);', '  if (auth) await signOut(auth);');
    return out;
  }
);

/* -- 6. App.tsx -----------------------------------------------------------
   The website's postcode boxes hand off as ?postcode=3000. Without this the
   app opens on its built-in default and asks for it a second time, which is
   the one thing the hand-off exists to prevent. */
fix(
  'App: read ?postcode= from the URL',
  'src/App.tsx',
  (s) => s.includes('postcodeFromUrl'),
  (s) => {
    let out = s.replace(
      /import \{\s*AUSTRALIAN_POSTCODES,\s*PostcodeRecord,\s*\} from '\.\/data\/australianPostcodes';/,
      `import {\n  AUSTRALIAN_POSTCODES,\n  PostcodeRecord,\n  searchPostcodes,\n} from './data/australianPostcodes';`
    );
    out = out.replace(
      'export default function App() {',
      `/**\n` +
      ` * The website's postcode boxes hand off here as ?postcode=3000.\n` +
      ` *\n` +
      ` * searchPostcodes resolves anything valid: one of the known suburbs, or a\n` +
      ` * synthetic record placed by state range. Anything else is ignored and the\n` +
      ` * default stands, so a junk parameter cannot break the opening screen.\n` +
      ` */\n` +
      `function postcodeFromUrl(): PostcodeRecord | null {\n` +
      `  if (typeof window === 'undefined') return null;\n` +
      `  const raw = new URLSearchParams(window.location.search).get('postcode');\n` +
      `  if (!raw || !/^[0-9]{4}$/.test(raw.trim())) return null;\n` +
      `  return searchPostcodes(raw.trim())[0] || null;\n` +
      `}\n\n` +
      `export default function App() {`
    );
    out = out.replace(
      /useState<PostcodeRecord \| null>\(\s*AUSTRALIAN_POSTCODES\[0\]/,
      'useState<PostcodeRecord | null>(\n    postcodeFromUrl() || AUSTRALIAN_POSTCODES[0]'
    );
    return out;
  }
);

/* -- 7. the back button's destination -------------------------------------
   V3 added its own back button and cancel-quote modal, which is better than
   what was here before — but it sends people to https://portabox.com.au,
   which does not resolve. The client's domain is portabox.au, and while the
   rebuild is in review the arrow should land there instead. Configurable so
   Vercel can change it without a commit. */
const SITE_FALLBACK = 'https://portabox-website.vercel.app/';

fix(
  'cancel modal: configurable site URL (shipped pointing at a dead domain)',
  'src/components/CancelQuoteModal.tsx',
  (s) => s.includes('VITE_SITE_URL'),
  (s) => s.replace(
    /websiteUrl = 'https:\/\/portabox\.com\.au',/,
    `websiteUrl = (import.meta.env.VITE_SITE_URL as string) || '${SITE_FALLBACK}',`
  )
);

fix(
  'App: pass the same site URL to the cancel modal',
  'src/App.tsx',
  (s) => !s.includes('websiteUrl="https://portabox.com.au"'),
  (s) => s.replace(
    /websiteUrl="https:\/\/portabox\.com\.au"/,
    `websiteUrl={(import.meta.env.VITE_SITE_URL as string) || '${SITE_FALLBACK}'}`
  )
);

/* -- 8. the staff button -------------------------------------------------
   Ships as a 32px icon-only circle in slate-400, desktop only, with no label
   — easy to miss, and invisible to staff on a phone or tablet. It is the only
   way into the admin, dispatch and customer views, so it is given the same
   pill treatment as the Back button opposite it, a "Staff" label from sm up,
   and presence at every width.

   Widening it pushed the logo off centre, because the header used
   space-between with fixed-width sides: the logo drifts by half the
   difference between them. A three-column grid with 1fr either side holds it
   centred whatever the buttons do. */
fix(
  'header: make the staff button visible, and keep the logo centred',
  'src/components/Header.tsx',
  (s) => s.includes('grid-cols-[1fr_auto_1fr]') && !s.includes('hidden lg:flex w-8 h-8'),
  (s) => {
    let out = s.replace(
      'className="hidden lg:flex w-8 h-8 rounded-full border border-slate-200/90 bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-700 items-center justify-center transition-colors cursor-pointer shadow-2xs"\n            >\n              <Lock className="w-3.5 h-3.5" />',
      'className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-white shadow-xs border border-slate-200 text-slate-700 hover:text-slate-950 hover:border-slate-300 transition-all cursor-pointer active:scale-95 text-xs sm:text-sm font-bold"\n            >\n              <Lock className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />\n              <span className="hidden sm:inline">Staff</span>'
    );
    out = out.replace(
      /(max-w-6xl mx-auto py-2 sm:py-3\.5 px-3 sm:px-8 )flex items-center justify-between/,
      '$1grid grid-cols-[1fr_auto_1fr] items-center gap-2'
    );
    out = out.replace(
      '<div className="w-16 sm:w-32 flex items-center">',
      '<div className="flex items-center justify-start">'
    );
    out = out.replace(
      '<div className="w-16 sm:w-32 flex items-center justify-end gap-2">',
      '<div className="flex items-center justify-end gap-1.5 sm:gap-2">'
    );
    return out;
  }
);

/* -- report --------------------------------------------------------------- */
const line = (mark, xs) => xs.forEach((x) => console.log(`  ${mark} ${x}`));
if (applied.length) { console.log('applied:'); line('+', applied); }
if (already.length) { console.log('already in place:'); line('=', already); }
if (failed.length) { console.log('FAILED:'); line('!', failed); }

console.log(
  `\n${applied.length} applied, ${already.length} already in place, ${failed.length} failed`
);
if (failed.length) {
  console.log('A failed fix means the upstream code moved. Re-read it and update this file.');
  process.exitCode = 1;
}
