#!/usr/bin/env node
// Reads a local seed JSON (never committed) and prints an SQL script to stdout.
// Usage: node worker/scripts/seed.mjs <path-to-seed.json>

import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { resolveParams } from '../../shared/budget-core.js';

function fail(message) {
  console.error(`seed: ${message}`);
  process.exit(1);
}

const seedPath = process.argv[2];
if (!seedPath) fail('usage: node worker/scripts/seed.mjs <path-to-seed.json>');
if (!fs.existsSync(seedPath)) fail(`file not found: ${seedPath}`);

let seed;
try {
  seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
} catch (err) {
  fail(`cannot parse ${seedPath}: ${err.message}`);
}

if (!seed || typeof seed !== 'object' || Array.isArray(seed)) fail('seed must be a JSON object');
if (!seed.params || typeof seed.params !== 'object' || Array.isArray(seed.params)) {
  fail('seed.params must be an object');
}
if (!Array.isArray(seed.categories)) fail('seed.categories must be an array');

const params = resolveParams(seed.params);

const seen = new Set();
function makeId(prefix, name, index) {
  for (let attempt = 0; ; attempt += 1) {
    const digest = createHash('sha256').update(`${prefix}|${name}|${index}|${attempt}`).digest('hex');
    const id = `${prefix}_${digest.slice(0, 8)}`;
    if (!seen.has(id)) {
      seen.add(id);
      return id;
    }
  }
}

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlValue(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) fail('non-finite number in seed');
    return String(value);
  }
  return sqlString(value);
}

const ts = Math.floor(Date.now() / 1000);
const lines = [];

lines.push('DELETE FROM items;');
lines.push('DELETE FROM categories;');
lines.push(
  `INSERT INTO settings (key, value, updated_at) VALUES ('params', ${sqlString(JSON.stringify(params))}, ${ts}) ` +
    'ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;',
);

seed.categories.forEach((category, categoryIndex) => {
  if (!category || typeof category !== 'object') fail(`category #${categoryIndex} must be an object`);
  if (typeof category.name !== 'string' || category.name.trim() === '') {
    fail(`category #${categoryIndex} has no name`);
  }
  if (!Array.isArray(category.items)) fail(`category "${category.name}" has no items array`);

  const categoryId = makeId('cat', category.name, categoryIndex);
  lines.push(
    `INSERT INTO categories (id, name, sort, created_at, updated_at) VALUES (` +
      `${sqlString(categoryId)}, ${sqlString(category.name.trim())}, ${categoryIndex}, ${ts}, ${ts});`,
  );

  category.items.forEach((item, itemIndex) => {
    if (!item || typeof item !== 'object') fail(`item #${itemIndex} in "${category.name}" must be an object`);
    if (typeof item.name !== 'string' || item.name.trim() === '') {
      fail(`item #${itemIndex} in "${category.name}" has no name`);
    }
    if (!['RUB', 'CNY', 'HKD'].includes(item.currency)) {
      fail(`item "${item.name}" has invalid currency`);
    }
    const hasQty = item.qty !== undefined && item.qty !== null;
    const hasQtyFormula = item.qty_formula !== undefined && item.qty_formula !== null;
    if (hasQty === hasQtyFormula) fail(`item "${item.name}" must set exactly one of qty / qty_formula`);
    const hasPrice = item.unit_price !== undefined && item.unit_price !== null;
    const hasPriceFormula = item.price_formula !== undefined && item.price_formula !== null;
    if (hasPrice === hasPriceFormula) {
      fail(`item "${item.name}" must set exactly one of unit_price / price_formula`);
    }

    const itemId = makeId('itm', item.name, itemIndex);
    lines.push(
      `INSERT INTO items (id, category_id, name, qty, qty_formula, unit_price, price_formula, currency, note, sort, created_at, updated_at) VALUES (` +
        [
          sqlString(itemId),
          sqlString(categoryId),
          sqlString(item.name.trim()),
          sqlValue(item.qty),
          sqlValue(item.qty_formula),
          sqlValue(item.unit_price),
          sqlValue(item.price_formula),
          sqlString(item.currency),
          sqlString(item.note ?? ''),
          itemIndex,
          ts,
          ts,
        ].join(', ') +
        ');',
    );
  });
});

process.stdout.write(`${lines.join('\n')}\n`);
