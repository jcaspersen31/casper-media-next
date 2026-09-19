import pdfParse from "pdf-parse";
import { normalizeHeader } from "../columnMatch";

// Best-effort PDF "table" extraction: pdf-parse gives us flat text, not a
// real table structure, so we scan line-by-line for "<label> ... <number>"
// patterns and match the (normalized) label against every known column
// alias. This is intentionally simple for the POC — labs whose PDF layout
// doesn't fit "label ... value per line" will show up as flagged/missing
// rather than silently misparsed.
export async function parsePdf(buffer, knownHeaders) {
  const data = await pdfParse(buffer);
  const lines = data.text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // Longest normalized label first, so a specific alias ("h3a icap potassium")
  // wins over a shorter one that happens to also be a substring.
  const sortedHeaders = [...knownHeaders].sort((a, b) => b.length - a.length);
  const result = {};

  for (const line of lines) {
    const normalizedLine = normalizeHeader(line);
    const match = sortedHeaders.find((header) => normalizedLine.includes(header));
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
