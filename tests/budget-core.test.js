import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  BudgetError,
  computeBudget,
  evaluateFormula,
  formulaParams,
  formatMoney,
  formatNumber,
  formatRub,
  itemAmount,
  mergeItem,
  normalizeCategoryInput,
  normalizeItemInput,
  rateFor,
  resolveParams,
  validateFormula,
  validateParamsDoc,
  validateParamsPatch,
  cityBlocks,
} from '../shared/budget-core.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function throwsCode(fn, code) {
  assert.throws(fn, (err) => {
    assert.ok(err instanceof BudgetError, `expected BudgetError, got ${err && err.stack}`);
    assert.equal(err.code, code);
    return true;
  });
}

function loadSeed() {
  const candidates = [];
  if (process.env.BUDGET_SEED_PATH) candidates.push(process.env.BUDGET_SEED_PATH);
  candidates.push(path.resolve(repoRoot, '..', 'china-trip-budget', 'seed.json'));
  candidates.push(path.resolve(repoRoot, 'tests', 'fixtures', 'budget-seed.local.json'));
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return { path: candidate, data: JSON.parse(fs.readFileSync(candidate, 'utf8')) };
    }
  }
  return null;
}

function flattenSeed(seed) {
  const categories = [];
  const items = [];
  seed.categories.forEach((category, categoryIndex) => {
    const categoryId = `cat_seed_${categoryIndex}`;
    categories.push({ id: categoryId, name: category.name, sort: categoryIndex });
    category.items.forEach((item, itemIndex) => {
      items.push({
        id: `itm_seed_${categoryIndex}_${itemIndex}`,
        category_id: categoryId,
        sort: itemIndex,
        note: '',
        ...item,
      });
    });
  });
  return { categories, items };
}

// ---------------------------------------------------------------------------
// §5 formula evaluator
// ---------------------------------------------------------------------------

test('evaluator: arithmetic, precedence, unary minus, decimals', () => {
  assert.equal(evaluateFormula('1+2*3', {}), 7);
  assert.equal(evaluateFormula('(1+2)*3', {}), 9);
  assert.equal(evaluateFormula('-2+5', {}), 3);
  assert.equal(evaluateFormula('-(2+3)', {}), -5);
  assert.equal(evaluateFormula('1.5*2', {}), 3);
  assert.equal(evaluateFormula('10/4', {}), 2.5);
  assert.equal(evaluateFormula('  4 - 1  ', {}), 3);
  assert.equal(evaluateFormula('2*(3+(4-1))', {}), 12);
});

test('evaluator: identifiers come from params', () => {
  const params = { people: 2, cq_nights: 3, cq_hotel: 450 };
  assert.equal(evaluateFormula('people*cq_nights', params), 6);
  assert.equal(evaluateFormula(' people * cq_nights ', params), 6);
  assert.equal(evaluateFormula('cq_hotel', params), 450);
  assert.equal(evaluateFormula('people*(cq_nights+1)', params), 8);
});

test('evaluator: unknown identifier is UNKNOWN_PARAM', () => {
  const params = { people: 2 };
  throwsCode(() => evaluateFormula('x', params), 'UNKNOWN_PARAM');
  throwsCode(() => evaluateFormula('people*trip_days', params), 'UNKNOWN_PARAM');
  try {
    evaluateFormula('people*trip_days', params);
  } catch (err) {
    assert.match(err.message, /trip_days/);
  }
});

test('evaluator: division by zero is DIV_ZERO', () => {
  throwsCode(() => evaluateFormula('1/0', {}), 'DIV_ZERO');
  throwsCode(() => evaluateFormula('1/(2-2)', {}), 'DIV_ZERO');
});

test('evaluator: hostile and malformed input throws typed errors', () => {
  throwsCode(() => evaluateFormula('1;DROP TABLE items', {}), 'SYNTAX');
  throwsCode(() => evaluateFormula('alert(1)', {}), 'SYNTAX');
  throwsCode(() => evaluateFormula('2^3', {}), 'SYNTAX');
  throwsCode(() => evaluateFormula('2**3', {}), 'SYNTAX');
  throwsCode(() => evaluateFormula('"x"', {}), 'SYNTAX');
  throwsCode(() => evaluateFormula('', {}), 'SYNTAX');
  throwsCode(() => evaluateFormula('1+', {}), 'SYNTAX');
  throwsCode(() => evaluateFormula('(1+2', {}), 'SYNTAX');
  throwsCode(() => evaluateFormula('1..2', {}), 'SYNTAX');
});

test('evaluator: length and nesting limits', () => {
  assert.equal(evaluateFormula('((((((((((1))))))))))', {}), 1);
  throwsCode(() => evaluateFormula('('.repeat(21) + '1' + ')'.repeat(21), {}), 'TOO_DEEP');
  throwsCode(() => evaluateFormula('1+'.repeat(101) + '1', {}), 'TOO_LONG');
});

test('formulaParams extracts identifiers in order', () => {
  assert.deepEqual(formulaParams('people*cq_nights'), ['people', 'cq_nights']);
  assert.deepEqual(formulaParams('1+2'), []);
  assert.deepEqual(formulaParams(' cq_hotel '), ['cq_hotel']);
});

test('validateFormula rejects unknown identifiers and bad syntax', () => {
  const params = { people: 2, cq_nights: 3 };
  assert.deepEqual(validateFormula('people*cq_nights', params).params, ['people', 'cq_nights']);
  throwsCode(() => validateFormula('people*something', params), 'UNKNOWN_PARAM');
  throwsCode(() => validateFormula('1;DROP TABLE items', params), 'SYNTAX');
});

// ---------------------------------------------------------------------------
// §6 money math
// ---------------------------------------------------------------------------

test('rates: RUB is 1, CNY/HKD come from params', () => {
  const params = { cny_rate: 12.0873, hkd_rate: 10.266 };
  assert.equal(rateFor('RUB', params), 1);
  assert.equal(rateFor('CNY', params), 12.0873);
  assert.equal(rateFor('HKD', params), 10.266);
  throwsCode(() => rateFor('USD', params), 'validation');
  throwsCode(() => rateFor('CNY', {}), 'UNKNOWN_PARAM');
});

test('itemAmount: numbers and formulas in all currencies', () => {
  const params = resolveParams({ cny_rate: 12.5, hkd_rate: 10, people: 2, cq_nights: 3 });
  const rub = itemAmount({ qty: 2, unit_price: 2000, currency: 'RUB' }, params);
  assert.equal(rub.amount, 4000);
  assert.equal(rub.amountRub, 4000);

  const cny = itemAmount({ qty: 2, unit_price: 191, currency: 'CNY' }, params);
  assert.ok(Math.abs(cny.amountRub - 4775) < 1e-9);

  const hkd = itemAmount(
    { qty_formula: 'people*cq_nights', price_formula: 'cq_hotel', currency: 'HKD' },
    { ...params, cq_hotel: 100 },
  );
  assert.equal(hkd.amount, 600);
  assert.equal(hkd.amountRub, 6000);

  const mixed = itemAmount({ qty_formula: 'people*cq_nights', unit_price: 50, currency: 'RUB' }, params);
  assert.equal(mixed.amount, 300);
});

test('itemAmount: missing rate or bad operand is a typed error', () => {
  throwsCode(() => itemAmount({ qty: 1, unit_price: 1, currency: 'CNY' }, {}), 'UNKNOWN_PARAM');
  throwsCode(() => itemAmount({ currency: 'RUB' }, {}), 'validation');
});

// ---------------------------------------------------------------------------
// §6 acceptance numbers from the real seed file
// ---------------------------------------------------------------------------

test('seed totals match the §6 acceptance table', (t) => {
  const seed = loadSeed();
  if (!seed) {
    console.log('# SKIPPED: no seed fixture');
    t.skip('no seed fixture');
    return;
  }
  const flat = flattenSeed(seed.data);
  assert.equal(flat.items.length, 37);
  assert.equal(flat.categories.length, 8);

  const totals = computeBudget({ params: seed.data.params, ...flat });

  assert.equal(Math.round(totals.base), 374152);
  assert.equal(totals.reserve, 37415);
  assert.equal(Math.round(totals.total), 411567);
  assert.equal(Math.round(totals.perPerson), 205783);
  assert.equal(Math.round(totals.perDay), 12861);

  const expected = {
    'Дорога в Москву и обратно': 11506,
    'Перелёты': 86926,
    'Ж/д внутри Китая': 30368,
    'Проживание': 79310,
    'Билеты и развлечения': 67997,
    'Еда': 76255,
    'Транспорт в городе': 16390,
    'Прочее': 5400,
  };
  const actual = Object.fromEntries(totals.categories.map((c) => [c.name, Math.round(c.subtotal)]));
  assert.deepEqual(actual, expected);

  assert.equal(totals.categories.reduce((sum, c) => sum + c.count, 0), 37);
});

// ---------------------------------------------------------------------------
// formatting
// ---------------------------------------------------------------------------

test('formatNumber: integers with non-breaking thousands separator', () => {
  assert.equal(formatNumber(0), '0');
  assert.equal(formatNumber(450), '450');
  assert.equal(formatNumber(12345), '12\u00a0345');
  assert.equal(formatNumber(204950), '204\u00a0950');
  assert.equal(formatNumber(1234.6), '1\u00a0235');
  assert.equal(formatNumber(-12345), '-12\u00a0345');
});

test('formatMoney / formatRub per §6', () => {
  assert.equal(formatRub(12345), '12\u00a0345\u00a0₽');
  assert.equal(formatMoney(12345, 'RUB'), '12\u00a0345\u00a0₽');
  assert.equal(formatMoney(450, 'CNY'), '¥450');
  assert.equal(formatMoney(1100, 'HKD'), 'HK$1\u00a0100');
  assert.equal(formatMoney(0, 'RUB'), '0\u00a0₽');
});

// ---------------------------------------------------------------------------
// validation helpers
// ---------------------------------------------------------------------------

test('validateParamsDoc rejects bad shapes', () => {
  const good = validateParamsDoc({ cny_rate: 12.0873, hkd_rate: 10.266, people: 2, trip_days: 13, reserve_pct: 0.1, cq_nights: 3 });
  assert.equal(good.people, 2);

  throwsCode(() => validateParamsDoc({ people: 0 }), 'validation');
  throwsCode(() => validateParamsDoc({ people: 1.5 }), 'validation');
  throwsCode(() => validateParamsDoc({ trip_days: -1 }), 'validation');
  throwsCode(() => validateParamsDoc({ reserve_pct: 1.5 }), 'validation');
  throwsCode(() => validateParamsDoc({ reserve_pct: -0.1 }), 'validation');
  throwsCode(() => validateParamsDoc({ cny_rate: -1 }), 'validation');
  throwsCode(() => validateParamsDoc({ cny_rate: '12' }), 'validation');
  throwsCode(() => validateParamsDoc({ cny_rate: NaN }), 'validation');
  throwsCode(() => validateParamsDoc({ Bad_Key: 1 }), 'validation');
});

test('validateParamsPatch ignores unknown keys, rejects bad values and null', () => {
  assert.deepEqual(validateParamsPatch({ cny_rate: 12.2 }), { cny_rate: 12.2 });
  assert.deepEqual(validateParamsPatch({ '__bogus__': 1, cny_rate: 12.2 }), { cny_rate: 12.2 });
  assert.deepEqual(validateParamsPatch({ people: 3, newcity_nights: 4 }), { people: 3, newcity_nights: 4 });
  throwsCode(() => validateParamsPatch({ reserve_pct: null }), 'validation');
  throwsCode(() => validateParamsPatch({ people: 0 }), 'validation');
});

test('normalizeItemInput enforces one number xor formula, currency, lengths', () => {
  const params = { people: 2, cq_nights: 3, cq_hotel: 450 };
  const item = normalizeItemInput(
    { category_id: 'c1', name: '  Еда  ', qty_formula: 'people*cq_nights', price_formula: 'cq_hotel', currency: 'CNY', note: ' ok ' },
    params,
  );
  assert.equal(item.name, 'Еда');
  assert.equal(item.note, ' ok ');
  assert.equal(item.qty, null);
  assert.equal(item.unit_price, null);
  assert.equal(item.qty_formula, 'people*cq_nights');

  throwsCode(() => normalizeItemInput({ category_id: 'c1', name: 'x', qty: 1, qty_formula: 'people', unit_price: 1, currency: 'RUB' }, params), 'validation');
  throwsCode(() => normalizeItemInput({ category_id: 'c1', name: 'x', unit_price: 1, currency: 'RUB' }, params), 'validation');
  const mixed = normalizeItemInput({ category_id: 'c1', name: 'x', qty: 1, price_formula: 'cq_hotel', currency: 'RUB' }, params);
  assert.equal(mixed.qty, 1);
  assert.equal(mixed.price_formula, 'cq_hotel');
  throwsCode(() => normalizeItemInput({ category_id: 'c1', name: 'x', qty: 1, unit_price: 1, currency: 'USD' }, params), 'validation');
  throwsCode(() => normalizeItemInput({ category_id: 'c1', name: '', qty: 1, unit_price: 1, currency: 'RUB' }, params), 'validation');
  throwsCode(() => normalizeItemInput({ category_id: 'c1', name: 'n'.repeat(121), qty: 1, unit_price: 1, currency: 'RUB' }, params), 'validation');
  throwsCode(() => normalizeItemInput({ category_id: 'c1', name: 'x', qty: 1, unit_price: 1, currency: 'RUB', note: 'n'.repeat(501) }, params), 'validation');
  throwsCode(() => normalizeItemInput({ category_id: 'c1', name: 'x', qty: -1, unit_price: 1, currency: 'RUB' }, params), 'validation');
  throwsCode(() => normalizeItemInput({ category_id: 'c1', name: 'x', qty_formula: 'nope', unit_price: 1, currency: 'RUB' }, params), 'UNKNOWN_PARAM');
});

test('mergeItem switches qty and price representations and rejects null', () => {
  const base = { id: 'i1', category_id: 'c1', name: 'x', qty: 2, qty_formula: null, unit_price: 10, price_formula: null, currency: 'RUB', note: '' };
  const merged = mergeItem(base, { qty_formula: 'people' });
  assert.equal(merged.qty_formula, 'people');
  assert.equal(merged.qty, null, 'setting a formula clears the numeric value');
  const merged2 = mergeItem(base, { price_formula: 'people' });
  assert.equal(merged2.price_formula, 'people');
  assert.equal(merged2.unit_price, null, 'setting a price formula clears the numeric value');
  const merged3 = mergeItem(base, { qty: 5, unit_price: 7 });
  assert.equal(merged3.qty, 5);
  assert.equal(merged3.unit_price, 7);
  assert.equal(merged3.qty_formula, null);
  throwsCode(() => mergeItem(base, { name: null }), 'validation');
  throwsCode(() => mergeItem(base, { unit_price: null }), 'validation');
});

test('normalizeCategoryInput trims and enforces 1..60', () => {
  assert.equal(normalizeCategoryInput({ name: '  Еда ' }).name, 'Еда');
  assert.deepEqual(normalizeCategoryInput({ name: 'Еда' }, { partial: true }), { name: 'Еда' });
  assert.deepEqual(normalizeCategoryInput({ sort: 2 }, { partial: true }), { sort: 2 });
  throwsCode(() => normalizeCategoryInput({ name: '' }), 'validation');
  throwsCode(() => normalizeCategoryInput({ name: 'n'.repeat(61) }), 'validation');
  throwsCode(() => normalizeCategoryInput({ name: null }), 'validation');
});

test('resolveParams fills spec defaults without retyping the seed', () => {
  const resolved = resolveParams({ cny_rate: 1 });
  assert.equal(resolved.people, 2);
  assert.equal(resolved.trip_days, 13);
  assert.equal(resolved.reserve_pct, 0.1);
  assert.equal(resolved.cny_rate, 1);
});

test('cityBlocks derives blocks from _nights/_hotel/_food/_transport keys', () => {
  const blocks = cityBlocks({ cny_rate: 1, hkd_rate: 2, cq_nights: 3, cq_hotel: 450, cq_food: 200, cq_transport: 60, hk_nights: 5, hk_hotel: 1100, hk_food: 450, hk_transport: 30 });
  assert.deepEqual(blocks.map((b) => b.prefix), ['cq', 'hk']);
  assert.deepEqual(blocks[0], { prefix: 'cq', nights: 3, hotel: 450, food: 200, transport: 60 });
  const withNewCity = cityBlocks({ xian_nights: 1, xian_hotel: 1, xian_food: 1, xian_transport: 1 });
  assert.equal(withNewCity.length, 1);
  assert.equal(withNewCity[0].prefix, 'xian');
});
