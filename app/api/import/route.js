export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Map Orchid category + subcategory to our categories
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
  if (!val) return null;
  const n = parseFloat(String(val).replace(/[^0-9.]/g, ''));
  return isNaN(n) ? null : Math.round(n * 100) / 100;
}

function parseInt2(val) {
  if (!val) return null;
  const n = parseInt(String(val).replace(/[^0-9]/g, ''));
  return isNaN(n) ? null : n;
}

function parseDate(val) {
  if (!val) return null;
  try { const d = new Date(val); return isNaN(d.getTime()) ? null : d; } catch { return null; }
}

function parseCSV(text) {
  const lines = text.replace(/^\uFEFF/, '').split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.replace(/,/g, '').trim() === '') continue;
    // Simple CSV parse — handles basic quoting
    const vals = [];
    let cur = '', inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === ',' && !inQ) { vals.push(cur.trim()); cur = ''; }
      else { cur += ch; }
    }
    vals.push(cur.trim());
    const row = {};
    headers.forEach((h, i) => { row[h] = vals[i] || ''; });
    rows.push(row);
  }
  return rows.filter(r => r['Description'] || r['Part Number'] || r['UPC']);
}

export async function POST(req) {
  try {
    const { csv, preview } = await req.json();
    const rows = parseCSV(csv);

    if (preview) {
      return NextResponse.json({ rows: rows.slice(0, 10), total: rows.length });
    }

    const results = { created: 0, updated: 0, skipped: 0, errors: [] };

    for (const row of rows) {
      try {
        const retailPrice = parsePrice(row['Retail Price']);
        if (!retailPrice) { results.skipped++; continue; }

        const name = row['Description'] || `${row['Manufacturer']} ${row['Model']}`.trim();
        if (!name) { results.skipped++; continue; }

        const onSale = row['On Sale']?.toLowerCase() === 'yes';
        const discountValue = parseFloat(row['Discount Value (%)']) || 0;
        const salePrice = onSale && discountValue > 0
          ? Math.round(retailPrice * (1 - discountValue / 100) * 100) / 100
          : null;

        const category = mapCategory(row['Category'], row['Sub Category']);
        const msrpRaw = parsePrice(row['MSRP']);

        const data = {
          name,
          category,
          price:            Math.round(retailPrice),
          salePrice:        salePrice ? Math.round(salePrice) : null,
          msrp:             msrpRaw ? Math.round(msrpRaw) : null,
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
          quantityOnHand:   parseInt2(row['Quantity on Hand']),
          reorderLevel:     parseInt2(row['Reorder Level']),
          lastReceivedDate: parseDate(row['Last Received Date']),
          description:      [row['Manufacturer'], row['Model']].filter(Boolean).join(' '),
        };

        // Upsert by UPC or part number
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
