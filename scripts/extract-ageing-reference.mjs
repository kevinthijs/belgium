#!/usr/bin/env node
// Review the official 2024 workbook before updating the historical scenario.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import XLSX from "xlsx";
const input = process.argv[2];
if (!input) throw new Error('Usage: node scripts/extract-ageing-reference.cjs official-ageing-tables.xlsx');
const target = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/data/reference/financial-outlook-snapshot.json');
const current = JSON.parse(fs.readFileSync(target, 'utf8'));
const raw = fs.readFileSync(input);
const workbook = XLSX.read(raw);
if (!workbook.Sheets["cross-country_tables"]) throw new Error("Required source worksheet is missing");
const rows = XLSX.utils.sheet_to_json(workbook.Sheets["cross-country_tables"], { header: 1, defval: null });
for (const metric of Object.values(current.ageing.metrics)) {
  const start = rows.findIndex(row => row[1] === metric.title);
  if (start < 0) throw new Error('Source table not found: ' + metric.title);
  const header = rows[start + 2];
  for (const country of ['BE', 'FR', 'NL', 'DE', 'ES']) {
    const row = rows.slice(start + 3, start + 33).find(item => item[1] === country);
    if (!row) throw new Error('Country missing: ' + country);
    metric.values[country] = Object.fromEntries([2022, 2030, 2050, 2070].map(year => {
      const value = row[header.indexOf(year)];
      if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('Invalid value: ' + country + ' ' + year);
      return [year, value];
    }));
  }
}
current.ageing.sourceSha256 = crypto.createHash('sha256').update(raw).digest('hex');
const temporary = target + '.tmp';
fs.writeFileSync(temporary, JSON.stringify(current, null, 2) + '\n');
fs.renameSync(temporary, target);
console.log('Updated the historical scenario. Verify publication, definitions and tests before publishing.');
