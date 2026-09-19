import { parseCsv } from "./csv";
import { parseXlsx } from "./xlsx";
import { parsePdf } from "./pdf";
import { resolveHeader, allKnownHeaders } from "../columnAliases";

function detectSourceType(filename) {
  const ext = filename.toLowerCase().split(".").pop();
  if (ext === "csv") return "csv";
  if (ext === "xlsx" || ext === "xls") return "xlsx";
  if (ext === "pdf") return "pdf";
  return null;
}

// Normalizes raw parsed rows (source-column-label -> raw string value) into
// canonical samples by resolving each header against the global column
// alias table (exact match, then fuzzy match + auto-learn). Columns that
// resolve via fuzzy match are reported separately from ones that don't
// resolve at all, so the customer/admin can see what was guessed vs. what
// needs a real mapping.
async function normalizeRows(rawRows) {
  const samples = [];
  const flaggedColumns = new Set();
  const autoMatched = new Map(); // sourceLabel -> metricKey

  for (const row of rawRows) {
    const raw_values = {};
    let sample_id = null;

    for (const [sourceLabel, value] of Object.entries(row)) {
      if (value === "" || value == null) continue;
      const resolved = await resolveHeader(sourceLabel);
      if (!resolved) {
        flaggedColumns.add(sourceLabel);
        continue;
      }
      if (resolved.matchType === "fuzzy") {
        autoMatched.set(sourceLabel, resolved.metricKey);
      }
      if (resolved.metricKey === "sample_id") {
        // First matching column wins if more than one maps to sample_id
        // (e.g. a lab's own internal sample number plus a customer field label).
        if (sample_id === null) sample_id = value;
        continue;
      }
      const num = Number(value);
      raw_values[resolved.metricKey] = Number.isFinite(num) ? num : value;
    }

    samples.push({ sample_id, raw_values });
  }

  return {
    samples,
    flaggedColumns: [...flaggedColumns],
    autoMatchedColumns: [...autoMatched.entries()].map(([sourceLabel, metricKey]) => ({ sourceLabel, metricKey })),
  };
}

/**
 * Parses an uploaded file, resolving its columns against the global column
 * alias table — no lab profile selection required.
 * @returns {Promise<{ samples: {sample_id: string|null, raw_values: object}[], flaggedColumns: string[], autoMatchedColumns: {sourceLabel: string, metricKey: string}[], sourceType: string }>}
 */
export async function parseUpload(buffer, filename) {
  const sourceType = detectSourceType(filename);
  if (!sourceType) {
    throw new Error("Could not determine file type. Upload a .csv, .xlsx, or .pdf file.");
  }

  let rawRows;
  if (sourceType === "csv") {
    rawRows = parseCsv(buffer);
  } else if (sourceType === "xlsx") {
    rawRows = parseXlsx(buffer);
  } else {
    rawRows = await parsePdf(buffer, await allKnownHeaders());
  }

  const { samples, flaggedColumns, autoMatchedColumns } = await normalizeRows(rawRows);

  if (samples.length === 0) {
    throw new Error("No data rows were found in the uploaded file.");
  }

  return { samples, flaggedColumns, autoMatchedColumns, sourceType };
}
