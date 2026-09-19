// Header normalization + lightweight fuzzy matching for auto-mapping lab
// report columns to canonical metric keys. No external dependency — with
// only a couple of labs in practice, token-overlap scoring is plenty.

export function normalizeHeader(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function tokens(normalized) {
  return normalized.split(" ").filter(Boolean);
}

// Score how well two normalized headers match: 1.0 for identical token sets,
// otherwise the larger of (a) Jaccard similarity and (b) containment — how
// much of the smaller token set is present in the larger one. Containment
// lets a short, specific alias like "ph" match a longer real-world header
// like "1 1 soil ph" without being fooled by generic single-word aliases,
// since we always prefer the longest/most-specific alias that still matches
// (see bestFuzzyMatch).
function similarity(a, b) {
  const setA = new Set(tokens(a));
  const setB = new Set(tokens(b));
  if (setA.size === 0 || setB.size === 0) return 0;

  const intersection = [...setA].filter((t) => setB.has(t)).length;
  const union = new Set([...setA, ...setB]).size;
  const jaccard = intersection / union;
  const containment = intersection / Math.min(setA.size, setB.size);

  return Math.max(jaccard, containment);
}

const FUZZY_THRESHOLD = 0.7;

/**
 * Finds the best-matching alias row for a normalized header among candidate
 * alias rows ({ header_text, metric_key }), preferring more specific
 * (longer) aliases when scores tie, so a generic single-word alias doesn't
 * outrank a more precise multi-word one.
 */
export function bestFuzzyMatch(normalizedHeader, aliasRows) {
  let best = null;
  for (const row of aliasRows) {
    const score = similarity(normalizedHeader, row.header_text);
    if (score < FUZZY_THRESHOLD) continue;
    const aliasLength = tokens(row.header_text).length;
    if (
      !best ||
      score > best.score ||
      (score === best.score && aliasLength > best.aliasLength)
    ) {
      best = { row, score, aliasLength };
    }
  }
  return best ? { metricKey: best.row.metric_key, score: best.score } : null;
}
