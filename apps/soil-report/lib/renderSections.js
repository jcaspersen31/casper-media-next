const DEFAULT_SENTENCE_TEMPLATE = "{metric} measured {value}{unit}, rated {band}. {recommendation}";

function fillTemplate(template, evaluation) {
  return template
    .replaceAll("{metric}", evaluation.displayName)
    .replaceAll("{value}", String(evaluation.value))
    .replaceAll("{unit}", evaluation.unit || "")
    .replaceAll("{band}", evaluation.band)
    .replaceAll("{recommendation}", evaluation.recommendation || "");
}

function narrativeFor(evaluations, sentenceTemplate) {
  if (evaluations.length === 0) return "No matching metrics were available on this sample.";
  const template = sentenceTemplate || DEFAULT_SENTENCE_TEMPLATE;
  return evaluations
    .map((e) => fillTemplate(template, e).replace(/\s+/g, " ").trim())
    .join(" ");
}

// Builds a renderer-agnostic view model for each report section, shared by
// the web view and the PDF export so both stay in sync. `assembled.sections`
// already holds each section's resolved admin-edited definition (see
// lib/rulesEngine.js's assembleReportData) — no DB access needed here.
export function buildSectionViewModels(assembled) {
  return assembled.sections.map((def) => {
    if (def.type === "product_list") {
      const products = assembled.allProducts.filter((p) => p.category === def.productCategory);
      return { key: def.key, title: def.title, type: def.type, introText: def.introText, products };
    }

    // metric_table / narrative — per sample
    const perSample = assembled.samples.map((sample) => {
      const evaluations = def.metricKeys
        ? sample.evaluations.filter((e) => def.metricKeys.includes(e.metricKey))
        : sample.evaluations;
      return {
        sampleId: sample.sampleId || `Sample ${sample.id}`,
        evaluations,
        narrative: def.type === "narrative" ? narrativeFor(evaluations, def.sentenceTemplate) : null,
      };
    });

    return { key: def.key, title: def.title, type: def.type, introText: def.introText, perSample };
  });
}
