# Soil Deficiency Report App — Proof of Concept Spec

## 1. Goal

A web app (installable on Android without a Play Store submission) where:
- Customers or an admin upload a soil lab report (CSV, xlsx, or PDF)
- The system parses it, flags nutrient deficiencies against a rule set, and generates a report
- Customers pay before the report is generated/unlocked
- The report recommends products, each linking out to the client's existing store

This POC is for demo purposes, hosted in a sandbox under **caspermediallc.com**.

## 2. Confirmed decisions

| Question | Decision |
|---|---|
| Rule logic | Fixed rule set (thresholds/ratios), client to confirm exact numbers |
| Product purchase | Link-out only, no in-app cart/checkout |
| Lab/file formats | Multiple labs, multiple formats (CSV, xlsx, **and PDF**) — must be supported from day one |
| Report purchase timing | Customer pays before report is generated/unlocked |
| Accounts | Customer accounts + admin accounts, both with login |
| Report output | Both a web view and a downloadable PDF |
| Usage types | More than one (e.g. Row Crop Farming, Food Plot/Wildlife), admin can add more; usage affects both thresholds *and* which report sections appear |

## 3. Data model

**users**
- id, role (`customer` / `admin`), email, password hash, name, company

**lab_profiles** — one per lab's report layout, admin-manageable
- id, lab_name (e.g. "Ward Labs Haney", "Regen Ag Lab Haney PDF")
- source_type (`csv` / `xlsx` / `pdf`)
- column_map (JSON: source column/label → canonical metric key)

**metrics** — canonical list of measurable values (H3A_P, WEOC, Soil_pH, K_Ca_ratio, etc.)
- id, key, display_name, unit

**usages** — admin-defined, e.g. "Row Crop Farming", "Food Plot / Wildlife"
- id, name, description

**report_templates** — one per usage, defines which sections a report contains
- id, usage_id, sections (ordered JSON list, e.g. `["biology_narrative", "crop_fertilizer_table"]` vs `["lime_recommendation", "cool_season_mix", "warm_season_mix", "seasonal_nutrient_table"]`)

**rules** — the editable threshold/recommendation table
- id, usage_id, metric_id, band_low, band_high, band_label (Very Low/Low/Medium/High/Very High), recommendation_text, product_link_id

**products** — client's sellable items
- id, name, store_url, category

**samples** — one row per parsed lab sample
- id, report_id, field_id/sample_id, raw_values (JSON), usage_id

**reports**
- id, customer_id, lab_profile_id, usage_id, status (uploaded/paid/generated), created_at

**payments**
- id, report_id, amount, status, provider_ref (Stripe)

## 4. Core flows

**Upload & parse**
1. Customer or admin uploads a file, selects (or system detects) the lab profile and usage
2. Parser branch: CSV/xlsx → tabular read; PDF → table extraction
3. Column map from `lab_profiles` normalizes the source into canonical `metrics`
4. Unmapped/missing columns are flagged for review rather than silently dropped

**Pay**
5. Customer pays (Stripe) → report status moves to `paid`

**Generate**
6. Rules engine compares each sample's metric values against `rules` for the report's `usage_id`, producing a band + recommendation + product link per metric
7. `report_templates` for that usage decides which sections render and in what order
8. Report renders as a web page and a PDF (same underlying data, two renderers)

**View**
9. Customer views/downloads from their account; admin can view any customer's reports

## 5. Android without Play Store

Since this is a POC and the client uses Android, the simplest path is a **PWA (Progressive Web App)**: a normal responsive web app with a manifest + service worker, which Android lets users "Add to Home Screen" for an app-like icon/experience — no APK signing, no store review, no distribution logistics. This is recommended for the POC.

If a true native APK is wanted later, that's a separate build (e.g. via a WebView wrapper) distributed as a direct APK download/sideload — still no Play Store submission required, just more setup than a PWA.

## 6. Hosting

Sandbox subdomain under caspermediallc.com (e.g. `demo.caspermediallc.com` or `app.caspermediallc.com`), pointed at wherever the app is deployed. Actual DNS/hosting provisioning is an infrastructure step to handle when Claude Code sets up deployment — flag your hosting provider/DNS access at that point.

## 7. Open items — need client confirmation before rules are finalized

- Exact threshold numbers/bands for each metric, per usage (the fixed rule set)
- Full list of lab profiles to support at launch (which labs, which formats)
- Product catalog: which products map to which deficiency/recommendation, and their store URLs
- Whether crop/yield-goal-specific math (like Black Diamond's 270 bu/ac corn) is in scope for v1, or later
- Payment amount/pricing per report

## 8. Suggested build order

1. Auth + roles (customer/admin)
2. File upload + lab profile parsing (CSV/xlsx first, then PDF)
3. Admin UI for lab profiles, usages, rules, report templates, product links
4. Stripe paywall
5. Rules engine + report data assembly
6. Report rendering — web view, then PDF export
7. PWA manifest/service worker for Android install
8. Deploy to sandbox subdomain
