import { SECTION_DEFS } from "./reportSections";

function narrativeFor(evaluations) {
  if (evaluations.length === 0) return "No biology metrics were available on this sample.";
  return evaluations
    .map((e) => {
      const unit = e.unit ? ` ${e.unit}` : "";
      const rec = e.recommendation ? ` ${e.recommendation}` : "";
      return `${e.displayName} measured ${e.value}${unit}, rated ${e.band}.${rec}`;
    })
    .join(" ");
}

// Builds a renderer-agnostic view model for each report_templates section,
// shared by the web view and the PDF export so both stay in sync.
export function buildSectionViewModels(assembled) {
  return assembled.sections
    .map((key) => {
      const def = SECTION_DEFS[key];
      if (!def) return null;

      if (def.type === "product_list") {
        const products = assembled.allProducts.filter((p) => p.category === def.category);
        return { key, title: def.title, type: def.type, products };
      }

      // metric_table / narrative — per sample
      const perSample = assembled.samples.map((sample) => {
        const evaluations = def.metrics
          ? sample.evaluations.filter((e) => def.metrics.includes(e.metricKey))
          : sample.evaluations;
        return {
          sampleId: sample.sampleId || `Sample ${sample.id}`,
          evaluations,
          narrative: def.type === "narrative" ? narrativeFor(evaluations) : null,
        };
      });

      return { key, title: def.title, type: def.type, perSample };
    })
    .filter(Boolean);
}
