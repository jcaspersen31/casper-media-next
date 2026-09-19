import pdfParse from "pdf-parse";

// Best-effort PDF "table" extraction: pdf-parse gives us flat text, not a
// real table structure, so we scan line-by-line for "<label> ... <number>"
// patterns and match the label against the lab profile's known source
// labels. This is intentionally simple for the POC — labs whose PDF layout
// doesn't fit "label ... value per line" will show up as flagged/missing
// rather than silently misparsed.
export async function parsePdf(buffer, knownLabels) {
  const data = await pdfParse(buffer);
  const lines = data.text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const sortedLabels = [...knownLabels].sort((a, b) => b.length - a.length);
  const result = {};

  for (const line of lines) {
    const lower = line.toLowerCase();
    const match = sortedLabels.find((label) => lower.includes(label.toLowerCase()));
    if (!match) continue;
    const numbers = line.match(/-?\d+(\.\d+)?/g);
    if (!numbers || numbers.length === 0) continue;
    // Take the last number on the line — labels frequently repeat units/codes
    // before the value (e.g. "pH (1:1) ... 6.2").
    result[match] = numbers[numbers.length - 1];
  }

  // A PDF report can hold multiple samples; without real table structure
  // this heuristic only reliably supports a single-sample PDF, so we return
  // it as one row and let review flag anything missing.
  return [result];
}
