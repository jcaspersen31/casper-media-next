export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function mapCategory(category, subCategory) {
  const sub = (subCategory || '').toLowerCase();
  const cat = (category || '').toLowerCase();
  if (sub.includes('rifle')) return 'Rifles';
  if (sub.includes('shotgun')) return 'Shotguns';
  if (sub.includes('pistol') || sub.includes('handgun') || sub.includes('revolver')) return 'Handguns';
  if (cat.includes('handgun') || cat.includes('pistol')) return 'Handguns';
  if (cat.includes('shotgun')) return 'Shotguns';
  if (cat.includes('rifle') || cat.includes('long gun')) return 'Rifles';
  if (cat.includes('ammo') || cat.includes('ammunition')) return 'Ammunition';
  if (cat.includes('optic') || cat.includes('scope')) return 'Optics';
  if (cat.includes('accessory') || cat.includes('accessories')) return 'Accessories';
  return subCategory || category || 'Accessories';
}

function parsePrice(val) {
  if (!val || val.trim() === '') return null;
  const n = parseFloat(String(val).replace(/[^0-9.]/g, ''));
  return isNaN(n) ? null : Math.round(n);
}

function parseIntVal(val) {
  if (!val || val.trim() === '') return null;
  const n = parseInt(String(val).replace(/[^0-9]/g, ''));
  return isNaN(n) ? null : n;
}

function parseDate(val) {
  if (!val || val.trim() === '') return null;
  try { const d = new Date(val); return isNaN(d.getTime()) ? null : d; } catch { return null; }
}

function parseCSV(text) {
  // Strip BOM
  const clean = text.replace(/^\uFEFF/, '');
  const lines = clean.split(/\r?\n/);
  if (!lines.length) return [];

  // Parse headers
  const headers = parseCSVLine(lines[0]);

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const vals = parseCSVLine(line);
    // Skip empty rows
    if (vals.every(v => !v.trim())) continue;
    const row = {};
    headers.forEach((h, idx) => {
      row[h.trim()] = (vals[idx] || '').trim();
    });
    // Must have at least a description or part number
    if (!row['Description'] && !row['Part Number'] && !row['UPC']) continue;
    rows.push(row);
  }
  return rows;
}

function parseCSVLine(line) {
  const vals = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i+1] === '"') { cur += '"'; i++; }
      else { inQuote = !inQuote; }
    } else if (ch === ',' && !inQuote) {
      vals.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  vals.push(cur);
  return vals;
}

function buildProductData(row) {
  const retailPrice = parsePrice(row['Retail Price']);
  if (!retailPrice) return null;

  const name = (row['Description'] || '').trim();
  if (!name) return null;

  const onSale = (row['On Sale'] || '').toLowerCase() === 'yes';
  const discountValue = parseFloat(row['Discount Value (%)'] || '0') || 0;
  const salePrice = onSale && discountValue > 0
    ? Math.round(retailPrice * (1 - discountValue / 100))
    : null;

  return {
    name,
    category:         mapCategory(row['Category'], row['Sub Category']),
    price:            retailPrice,
    salePrice,
    msrp:             parsePrice(row['MSRP']),
    onSale,
    discountValue:    discountValue || null,
    upc:              row['UPC'] || null,
    manufacturer:     row['Manufacturer'] || null,
    model:            row['Model'] || null,
    partNumber:       row['Part Number'] || null,
    sku:              row['Part Number'] || null,
    caliber:          row['Firearm Caliber / GA'] || null,
    atfType:          row['ATF Type'] || null,
    cartridge:        row['Catridge'] || null,
    action:           row['Action'] || null,
    barrelLength:     row['Barrel Length'] || null,
    overallLength:    row['Overall Length'] || null,
    magazineCapacity: row['Magazine Capacity'] || null,
    magazineType:     row['Magazine Type'] || null,
    condition:        row['Firearm Condition'] || null,
    quantityOnHand:   parseIntVal(row['Quantity on Hand']),
    reorderLevel:     parseIntVal(row['Reorder Level']),
    lastReceivedDate: parseDate(row['Last Received Date']),
    description:      [row['Manufacturer'], row['Model']].filter(Boolean).join(' ') || null,
  };
}

export async function POST(req) {
  try {
    const { csv, preview } = await req.json();
    const rows = parseCSV(csv);

    if (preview) {
      const previewData = rows.slice(0, 10).map(row => buildProductData(row)).filter(Boolean);
      return NextResponse.json({ rows: previewData, total: rows.length });
    }

    const results = { created: 0, updated: 0, skipped: 0, errors: [] };

    for (const row of rows) {
      try {
        const data = buildProductData(row);
        if (!data) { results.skipped++; continue; }

        const existing = row['UPC']
          ? await prisma.product.findFirst({ where: { upc: row['UPC'] } })
          : row['Part Number']
          ? await prisma.product.findFirst({ where: { partNumber: row['Part Number'] } })
          : null;

        if (existing) {
          await prisma.product.update({ where: { id: existing.id }, data });
          results.updated++;
        } else {
          await prisma.product.create({ data });
          results.created++;
        }
      } catch (e) {
        results.errors.push({ row: row['Description'] || row['Part Number'], error: e.message });
      }
    }

    return NextResponse.json(results);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
