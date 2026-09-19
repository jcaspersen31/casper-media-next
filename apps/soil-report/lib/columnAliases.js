import { db } from "./db";
import { normalizeHeader, bestFuzzyMatch } from "./columnMatch";

/**
 * Resolves a raw source column header to a canonical metric key (or the
 * literal "sample_id"). Tries an exact match on the normalized header
 * first; if that misses, fuzzy-matches against every known alias and, on a
 * confident hit, writes the new header back as an unconfirmed alias so the
 * next report with this exact header resolves via the fast exact-match path.
 *
 * @returns {{ metricKey: string, matchType: "exact" | "fuzzy" } | null}
 */
export function resolveHeader(sourceLabel) {
  const normalized = normalizeHeader(sourceLabel);
  if (!normalized) return null;

  const exact = db.prepare("SELECT * FROM column_aliases WHERE header_text = ?").get(normalized);
  if (exact) return { metricKey: exact.metric_key, matchType: "exact" };

  const allAliases = db.prepare("SELECT header_text, metric_key FROM column_aliases").all();
  const match = bestFuzzyMatch(normalized, allAliases);
  if (!match) return null;

  db.prepare(
    "INSERT OR IGNORE INTO column_aliases (header_text, metric_key, confirmed) VALUES (?,?,0)"
  ).run(normalized, match.metricKey);

  return { metricKey: match.metricKey, matchType: "fuzzy" };
}

// Every known header, for the PDF parser's line-scanning heuristic.
export function allKnownHeaders() {
  return db.prepare("SELECT header_text FROM column_aliases").all().map((r) => r.header_text);
}
