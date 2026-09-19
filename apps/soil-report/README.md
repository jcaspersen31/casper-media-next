# Soil Deficiency Report — POC

Upload a soil lab report (CSV/XLSX/PDF), pay, and get a deficiency report
with rule-driven recommendations and product links. See `SPEC.md` for the
original product spec this implements.

## Quickstart

```bash
npm install
npm run seed     # creates data/soil-report.db and demo data
npm run dev      # http://localhost:3100
```

Demo logins (created by `npm run seed`):
- Admin: `admin@caspermediallc.com` / `admin1234`
- Customer: `customer@example.com` / `customer1234`

A sample lab CSV you can upload as-is is in `sample-data/generic-lab-sample.csv`
(any usage works with it).

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

Admin reviews auto-learned (unconfirmed) mappings under **Column mappings**,
confirming or correcting them — that's the only manual step, and it only
happens once per unique header, not once per report. This assumes a small
number of labs in practice; if that stops being true, the next step up is
LLM-assisted matching for anything the fuzzy pass misses (see conversation
history / ask for details).

## What's real vs. stubbed for the POC

- **Auth** — real: bcrypt password hashing, signed session cookies, role-gated routes.
- **Database** — SQLite (`better-sqlite3`) instead of Postgres, so the POC runs
  with zero external infra. Swapping to Postgres later just means porting
  `lib/db.js`'s schema/queries — the app code doesn't depend on SQLite specifics.
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
  PDF render from the same assembled report data.
- **PWA** — real manifest + service worker for "Add to Home Screen" on
  Android. Icons in `public/icons/` are generated placeholders
  (`scripts/generate-icons.mjs`) — swap for real branded icons before launch.

## Open items from the spec (need client input)

- Real threshold numbers/bands per metric and usage — seeded rules are demo
  placeholders only.
- Which labs to expect at launch, so their real column headers can be
  seeded as confirmed aliases up front instead of relying on the fuzzy
  match to learn them from the first real upload.
- Real product catalog and store URLs.
- Final report pricing (seeded at a placeholder $49.00).
- Stripe account/keys for real payments.
- Hosting/DNS access for the sandbox subdomain (see spec section 6).
