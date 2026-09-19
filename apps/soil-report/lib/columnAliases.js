import { db } from "./db";
import { normalizeHeader, bestFuzzyMatch } from "./columnMatch";

/**
 * Resolves a raw source column header to a canonical metric key (or the
 * literal "sample_id"). Tries an exact match on the normalized header
 * first; if that misses, fuzzy-matches against every known alias and, on a
 * confident hit, writes the new header back as an unconfirmed alias so the
 * next report with this exact header resolves via the fast exact-match path.
 *
 * @returns {Promise<{ metricKey: string, matchType: "exact" | "fuzzy" } | null>}
 */
export async function resolveHeader(sourceLabel) {
  const normalized = normalizeHeader(sourceLabel);
  if (!normalized) return null;

  const exact = await db.prepare("SELECT * FROM column_aliases WHERE header_text = ?").get(normalized);
  if (exact) return { metricKey: exact.metric_key, matchType: "exact" };

  const allAliases = await db.prepare("SELECT header_text, metric_key FROM column_aliases").all();
  const match = bestFuzzyMatch(normalized, allAliases);
  if (!match) return null;

  await db
    .prepare(
      "INSERT INTO column_aliases (header_text, metric_key, confirmed) VALUES (?,?,0) ON CONFLICT (header_text) DO NOTHING"
    )
    .run(normalized, match.metricKey);

  return { metricKey: match.metricKey, matchType: "fuzzy" };
}

// Every known header, for the PDF parser's line-scanning heuristic.
export async function allKnownHeaders() {
  const rows = await db.prepare("SELECT header_text FROM column_aliases").all();
  return rows.map((r) => r.header_text);
}
