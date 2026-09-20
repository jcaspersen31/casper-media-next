// Shared constants for the admin-editable report_sections table — used by
// the admin UI and the API route's validation. Section content itself now
// lives in the database (see /admin/report-sections), not here.
export const SECTION_TYPES = [
  { value: "metric_table", label: "Metric table", description: "A table of metric/value/rating/recommendation rows." },
  { value: "narrative", label: "Narrative paragraph", description: "One sentence per metric, joined into a paragraph." },
  { value: "product_list", label: "Product list", description: "Products from a chosen category, as cards/links." },
];

export const DEFAULT_SENTENCE_TEMPLATE = "{metric} measured {value}{unit}, rated {band}. {recommendation}";

export const SENTENCE_TEMPLATE_PLACEHOLDERS = ["{metric}", "{value}", "{unit}", "{band}", "{recommendation}"];
