import * as XLSX from "xlsx";

// Returns array of { columnLabel: rawStringValue } from the first sheet.
export function parseXlsx(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });
  return rows.map((row) => {
    const obj = {};
    for (const key of Object.keys(row)) {
      obj[key.trim()] = String(row[key]).trim();
    }
    return obj;
  });
}
