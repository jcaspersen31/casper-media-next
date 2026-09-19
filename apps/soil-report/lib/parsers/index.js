import { parseCsv } from "./csv";
import { parseXlsx } from "./xlsx";
import { parsePdf } from "./pdf";

function detectSourceType(filename) {
  const ext = filename.toLowerCase().split(".").pop();
  if (ext === "csv") return "csv";
  if (ext === "xlsx" || ext === "xls") return "xlsx";
  if (ext === "pdf") return "pdf";
  return null;
}

// Normalizes raw parsed rows (source-column-label -> raw string value) into
// canonical samples using the lab profile's column_map, and flags source
// columns present in the file that the column_map doesn't know about.
function normalizeRows(rawRows, columnMap) {
  const samples = [];
  const flaggedColumns = new Set();

  for (const row of rawRows) {
    const raw_values = {};
    let sample_id = null;

    for (const [sourceLabel, value] of Object.entries(row)) {
      if (value === "" || value == null) continue;
      const metricKey = columnMap[sourceLabel];
      if (!metricKey) {
        flaggedColumns.add(sourceLabel);
        continue;
      }
      if (metricKey === "sample_id") {
        sample_id = value;
        continue;
      }
      const num = Number(value);
      raw_values[metricKey] = Number.isFinite(num) ? num : value;
    }

    samples.push({ sample_id, raw_values });
  }

  return { samples, flaggedColumns: [...flaggedColumns] };
}

/**
 * Parses an uploaded file against a lab profile's column map.
 * @returns {Promise<{ samples: {sample_id: string|null, raw_values: object}[], flaggedColumns: string[], sourceType: string }>}
 */
export async function parseUpload(buffer, filename, labProfile) {
  const sourceType = labProfile?.source_type || detectSourceType(filename);
  if (!sourceType) {
    throw new Error("Could not determine file type. Upload a .csv, .xlsx, or .pdf file.");
  }

  const columnMap = labProfile ? JSON.parse(labProfile.column_map || "{}") : {};

  let rawRows;
  if (sourceType === "csv") {
    rawRows = parseCsv(buffer);
  } else if (sourceType === "xlsx") {
    rawRows = parseXlsx(buffer);
  } else if (sourceType === "pdf") {
    rawRows = await parsePdf(buffer, Object.keys(columnMap));
  } else {
    throw new Error(`Unsupported source type: ${sourceType}`);
  }

  const { samples, flaggedColumns } = normalizeRows(rawRows, columnMap);

  if (samples.length === 0) {
    throw new Error("No data rows were found in the uploaded file.");
  }

  return { samples, flaggedColumns, sourceType };
}
