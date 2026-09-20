import pdfParse from "pdf-parse";

// Real lab-report PDFs are drawn as tables, not text flow: pdf-parse's
// default flattened text loses the spacing between adjacent cells, so two
// side-by-side numbers like "10.4" and "1.3" can come out as one
// unsplittable run ("10.41.3"). We instead read each page's text items with
// their real x/y position (via pdf-parse's `pagerender` hook, which gives
// access to the underlying pdf.js text content) and reconstruct rows/columns
// from the coordinates themselves. This works for any PDF laid out as
// "one or two label rows directly above a row of values, all repeated"
// (one page per sample), which is how most lab PDF exports look, not just
// one specific lab's template.

const ROW_Y_TOLERANCE = 1.5; // pts — items on the same visual row share near-identical y

function groupItemsIntoRows(items) {
  const rows = [];
  for (const raw of items) {
    const str = raw.str.trim();
    if (!str) continue;
    let row = rows.find((r) => Math.abs(r.y - raw.y) <= ROW_Y_TOLERANCE);
    if (!row) {
      row = { y: raw.y, items: [] };
      rows.push(row);
    }
    row.items.push({ str, x: raw.x });
  }
  rows.sort((a, b) => b.y - a.y); // PDF y increases upward — top of page first
  for (const row of rows) row.items.sort((a, b) => a.x - b.x);
  return rows;
}

function isNumericToken(tok) {
  return /^-?\d+(\.\d+)?$/.test(tok) || tok.toUpperCase() === "NONE";
}

// A row of actual data: starts with a lab/sample number, followed mostly by
// numeric (or "NONE"-style placeholder) cells.
function isValueRow(row) {
  if (row.items.length < 3) return false;
  const [first, ...rest] = row.items;
  if (!/^\d{3,7}$/.test(first.str)) return false;
  const numericCount = rest.filter((t) => isNumericToken(t.str)).length;
  return numericCount >= Math.ceil(rest.length * 0.6);
}

// A row of column labels: spans at least two columns (a single stray cell
// like "Lab #" or "Rank" is a row annotation, not a header row, and would
// otherwise displace the real header row out of the buffer below) and has
// no numeric-only cells.
function isLabelRow(row) {
  if (row.items.length < 2) return false;
  return row.items.every((t) => !/^-?\d+(\.\d+)?$/.test(t.str));
}

// Pairs the 1-2 label rows immediately above a value row with that row's
// values, matched by column position (same left-to-right order, same
// count) rather than guessing where one number ends and the next begins.
function buildHeaderLabels(labelRowBuffer, valueCount) {
  if (labelRowBuffer.length === 2) {
    const [nameRow, unitRow] = labelRowBuffer;
    if (nameRow.items.length === valueCount && unitRow.items.length === valueCount) {
      return nameRow.items.map((it, i) => `${it.str} ${unitRow.items[i].str}`.trim());
    }
  }
  const lastRow = labelRowBuffer[labelRowBuffer.length - 1];
  if (lastRow && lastRow.items.length === valueCount) {
    return lastRow.items.map((it) => it.str);
  }
  return null;
}

function findFieldIdValue(rows) {
  for (const row of rows) {
    const labelIdx = row.items.findIndex((it) => /^field id:?$/i.test(it.str));
    if (labelIdx === -1) continue;
    const label = row.items[labelIdx];
    const value = row.items.find((it) => it !== label && it.x > label.x + 5);
    if (value && value.str !== "-") return value.str;
  }
  return null;
}

export async function parsePdf(buffer) {
  const pages = [];
  function pagerender(pageData) {
    return pageData
      .getTextContent({ normalizeWhitespace: false, disableCombineTextItems: true })
      .then((textContent) => {
        pages.push(textContent.items.map((it) => ({ str: it.str, x: it.transform[4], y: it.transform[5] })));
        return ""; // flattened text isn't used — positions are read straight from `pages`
      });
  }

  await pdfParse(buffer, { pagerender });

  const results = [];
  for (const items of pages) {
    const rows = groupItemsIntoRows(items);
    const raw = {};
    let labelRowBuffer = [];

    for (const row of rows) {
      if (isValueRow(row)) {
        const [, ...valueItems] = row.items;
        const labels = buildHeaderLabels(labelRowBuffer, valueItems.length);
        if (labels) {
          labels.forEach((label, i) => {
            raw[label] = valueItems[i].str;
          });
        }
        labelRowBuffer = [];
        continue;
      }
      if (isLabelRow(row)) {
        labelRowBuffer.push(row);
        if (labelRowBuffer.length > 2) labelRowBuffer.shift();
      }
      // Anything else ("Rank" rows, section titles, stray single cells) is
      // ignored without clearing the in-progress label buffer.
    }

    const fieldId = findFieldIdValue(rows);
    if (fieldId) raw["Field ID"] = fieldId;

    if (Object.keys(raw).length > 0) results.push(raw);
  }

  return results;
}
