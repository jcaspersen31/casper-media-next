# Soil Deficiency Report — POC

Upload a soil lab report (CSV/XLSX/PDF), pay, and get a deficiency report
with rule-driven recommendations and product links. See `SPEC.md` for the
original product spec this implements.

**Live**: https://soil.caspermediallc.com (Vercel project, separate from the
root Casper Media site — see **Deployment** below). Branch: `agronomy`.

## Quickstart (local dev)

Needs a Postgres instance — a local one, or a free/cheap one on Railway.

```bash
npm install
cp .env.example .env.local   # set DATABASE_URL (and SESSION_SECRET)
npm run migrate               # creates the schema — safe to re-run
npm run seed                  # demo users, metrics, rules, products, sections
npm run dev                   # http://localhost:3100
```

Demo logins (created by `npm run seed`):
- Admin: `admin@caspermediallc.com` / `admin1234`
- Customer: `customer@example.com` / `customer1234`

A sample lab CSV you can upload as-is is in `sample-data/generic-lab-sample.csv`
(any usage works with it).

## Deployment

- **Hosting**: Vercel project imported from this same GitHub repo
  (`jcaspersen31/casper-media-next`), but as its **own** project — Root
  Directory `apps/soil-report`, Production Branch `agronomy`. It's separate
  from the root Casper Media marketing site's Vercel project; one repo, two
  independent deployments.
- **Database**: Postgres on Railway. `DATABASE_URL` in Vercel's env vars must
  be the **public** connection string (Railway's TCP proxy host, e.g.
  `xxxxx.proxy.rlwy.net:PORT`) — not `postgres.railway.internal`, which only
  resolves inside Railway's own network.
- **Env vars set in Vercel**: `DATABASE_URL`, `SESSION_SECRET`, `SETUP_SECRET`
  (see below).
- **Bootstrapping the database**: normally you'd run `npm run migrate &&
  npm run seed` against `DATABASE_URL`, but this session's sandbox (and
  possibly yours) can't open a raw TCP connection to an external Postgres —
  only proxied HTTPS works. Two ways around that:
  1. **`GET /api/setup?key=<SETUP_SECRET>`** — a route on the deployed app
     itself (`app/api/setup/route.js`) that applies the same schema+seed SQL
     from inside the app's own runtime, which *can* reach Railway normally.
     Safe to re-run (everything's idempotent). This is what's actually been
     used so far. Requires `SETUP_SECRET` to be set in Vercel; visiting the
     URL with the right key runs it, wrong/missing key gets a 403/500.
     **Security note**: this route stays live as long as `SETUP_SECRET` is
     set — fine short-term, but worth removing the env var (or deleting the
     route) once you're done needing it, since anyone with the key can
     re-run it.
  2. **`scripts/railway-setup.sql`** — a hand-pasteable combined schema+seed
     script for Railway's web-based Postgres "Query" tab, for when neither
     your machine nor this session can reach the DB directly. In practice
     Railway's Query tab choked on pasting the whole script at once
     ("syntax error at or near limit") — route 1 above is what actually
     worked. Keep both `scripts/railway-setup.sql` and `lib/setupSql.js` in
     sync if the schema changes (see comment at the top of `lib/setupSql.js`).
- **Any schema/seed change** (new table, new seeded rows) needs
  `/api/setup?key=...` re-run against production after the deploy that adds
  it finishes — pure code/UI changes don't need this.

## Column mapping — no lab profile picker

Customers just upload a file and pick a usage — there's no "which lab format
is this" step. Every source column is matched against a single global
`column_aliases` table (`lib/columnAliases.js`):

1. **Exact match** on the normalized header (lowercased, punctuation stripped).
2. **Fuzzy match** (`lib/columnMatch.js`, token overlap, no external dep) against
   every known alias if there's no exact hit. A confident guess is used
   immediately *and* written back to `column_aliases` as `confirmed = 0`, so
   the same header resolves via the fast exact-match path next time — the
   mapping table grows on its own as new lab formats show up.
3. Anything neither step resolves is flagged on the report (visible to the
   customer and admin) rather than guessed or silently dropped.
4. `_ignore` is a special metric-key (alongside `sample_id`) for real lab
   columns that are legitimately not soil metrics — customer name, address,
   dates, lab number, etc. — so they resolve cleanly instead of cluttering
   the flagged list.

Admin reviews auto-learned (unconfirmed) mappings under **Column mappings**,
confirming or correcting them — that's the only manual step, and it only
happens once per unique header, not once per report.

We've since mapped the full column set from a real Ward Labs Haney CSV
export (~45 metrics total now, up from the original ~11 demo ones) —
uploading one of those files should come back with zero flagged columns.
Most of those extra metrics don't have rules yet (see Rules below), so
they're captured in `raw_values` but won't show up in a report until rules
exist for them.

## Admin features

- **Customers** (`/admin/customers`) — full CRUD for customer accounts,
  including password reset. Deleting a customer cascades their reports.
- **Upload for a customer** (form at the top of `/admin/reports`) — admin
  can upload a report on behalf of any customer (e.g. samples mailed in and
  handled by the office). The report belongs to that customer, not the
  admin's own account — admin should never use their own login as a
  stand-in for a real customer's report.
- **Column mappings** (`/admin/column-aliases`) — see above.
- **Rules** (`/admin/rules`) — band thresholds (`band_low`/`band_high`) per
  usage/metric, `band_label` (locked to Very Low/Low/Medium/High/Very High
  via the dropdown — this ordering matters, see **Queued: gauge/chart
  visualization** below), recommendation text, and an optional linked
  product.
- **Report sections** (`/admin/report-sections`) — sections are no longer
  hardcoded. Each is admin-created: a title, one of three types (metric
  table / narrative paragraph / product list), an optional intro paragraph,
  an optional metric filter, and — for narrative sections — an editable
  per-metric sentence template (`{metric} {value} {unit} {band}
  {recommendation}` placeholders) instead of fixed wording. This is what
  makes the report read as actual prose instead of just data tables, per
  the client's stated preference.
- **Report templates** (`/admin/report-templates`) — per usage, which
  sections appear and in what order; pulls its list live from Report
  sections.
- A generated report's `assembled_data` embeds the *resolved* section
  definitions at generate time (see `lib/rulesEngine.js`), so editing or
  deleting a section later doesn't change already-generated reports, and a
  template referencing a deleted section just skips it rather than erroring.

## What's real vs. stubbed for the POC

- **Auth** — real: bcrypt password hashing, signed session cookies, role-gated routes.
- **Database** — real Postgres (`pg`), via `schema.sql` + `npm run migrate`. `lib/db.js`
  is a thin async wrapper (`db.prepare(sql).get/all/run(...params)`, `?` placeholders)
  so call sites read like typical SQL-in-JS rather than raw `pg` query calls.
- **File parsing** — real for CSV/XLSX. PDF parsing is a best-effort heuristic
  (`lib/parsers/pdf.js`): it extracts text and scans for "known label ...
  number" per line, since PDFs don't expose real table structure. It works
  for single-sample PDF reports with one metric per line; anything it can't
  confidently map is flagged for review rather than guessed. This is the
  piece most likely to need lab-specific handling once real PDF samples are
  in hand.
- **Payment** — mocked: `POST /api/reports/:id/pay` simulates an instant
  successful payment so the flow is demoable without Stripe keys. The real
  Stripe integration point is marked in that file — production wiring should
  move the `paid` transition to a verified webhook rather than a client call.
- **Rules engine, report templates, PDF export** — real and fully wired: admin
  edits rules/templates/products, and both the web view and the downloaded
  PDF render from the same assembled report data (`lib/renderSections.js`
  builds a shared view model; `app/reports/ReportView.js` and
  `lib/pdfDocument.js` render it two ways).
- **PWA** — real manifest + service worker for "Add to Home Screen" on
  Android. Icons in `public/icons/` are generated placeholders
  (`scripts/generate-icons.mjs`) — swap for real branded icons before launch
  (see **Queued: client branding** below).

## Known gotchas already hit (context for next time)

- **pdfkit + Vercel**: `@react-pdf/renderer` uses `pdfkit`, which
  `require()`s its standard-font file by a runtime-computed name. Next's
  serverless file tracer can't follow that, so the font file goes missing
  in production (`MODULE_NOT_FOUND ... Helvetica.cjs`) even though
  `serverExternalPackages` alone and even a local `next start` both look
  fine. Fixed via `outputFileTracingIncludes` in `next.config.mjs`, verified
  by actually running `.next/standalone/server.js` locally (the same
  artifact Vercel deploys) — plain `next start` does NOT reproduce this bug,
  don't trust it for this class of issue again.
- **Checkbox styling**: `globals.css`'s blanket `input { width: 100% }` rule
  (meant for text fields) also stretched checkboxes/radios and broke their
  layout wherever they appeared (first seen on Report templates). Fixed by
  excluding `input[type=checkbox]`/`[type=radio]` from that rule.
- **Railway internal vs. public URL**: `postgres.railway.internal` only
  resolves inside Railway's network. Need the public proxy host for
  anything external (this app's Vercel deploy, local dev, migrate/seed
  scripts).
- **Vercel project confusion**: importing the same repo a second time for a
  second app is normal (Root Directory + Production Branch are what
  actually separate them) — Vercel will auto-suffix the project name if it
  collides with the existing one, which looked like a mistake but wasn't.

## Queued for later (not blocking current client review)

### Gauge/chart visualization on report metrics
Client reference: a semicircular speedometer-style gauge (Ward Labs
example — 0–100 score, red→green bands, needle, legend). Design already
worked out, not yet built:
- `metrics` table gets `is_chart` (bool), `chart_min`, `chart_max` — percent
  position computed as `(value - min) / (max - min)`, not a hardcoded 0–100.
- Reuse each rule's existing `band_low`/`band_high` (normalized the same
  way) to draw the gauge's colored zones, instead of a separate min/max/ideal
  set — one source of truth for thresholds.
- `band_label` is being standardized to exactly five fixed values (Very Low
  / Low / Medium / High / Very High — already what the Rules dropdown
  offers) so the gauge can order/color them deterministically.
- Per the `dataviz` skill's guidance: a meter's fill should use the
  reserved *status* palette (good→critical — only 4 fixed steps defined),
  not an arbitrary rainbow. Plan: Very Low→critical, Low→serious,
  Medium→warning, High→good, Very High→a deepened step of that same green
  (a lightness adjustment of the validated hex, not an invented color).
- One SVG gauge component, used in both the web view and the PDF (react-pdf
  supports SVG primitives), plus a legend under it.
- Scope: schema change + Metrics admin UI (is_chart checkbox + min/max
  fields) + `evaluateSample` change (embed a `chart` object per evaluation)
  + the actual gauge component in two renderers. Real work, not a small
  add-on.

### Client branding
Replace the generic "Soil Report" placeholder branding (nav, PWA manifest/
icon, PDF header) with the actual client's company name and logo. Client
has a Cloudinary account for image storage — Gristmill (elsewhere in this
same repo/account) already has a working Cloudinary upload integration to
follow as a pattern rather than building that piece from scratch.

## Open items from the spec (need client input)

- Real threshold numbers/bands per metric and usage — seeded rules are demo
  placeholders only.
- Which labs to expect at launch, so their real column headers can be
  seeded as confirmed aliases up front instead of relying on the fuzzy
  match to learn them from the first real upload.
- Real product catalog and store URLs.
- Final report pricing (seeded at a placeholder $49.00).
- Stripe account/keys for real payments.
- Client's company name/logo + Cloudinary details, for the branding item above.
