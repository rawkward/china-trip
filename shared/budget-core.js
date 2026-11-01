// Pure budget logic shared by the Worker and the browser.
// No DOM, no fetch, no D1, no Node built-ins.

export const CURRENCIES = Object.freeze(['RUB', 'CNY', 'HKD']);

export const DEFAULT_PARAMS = Object.freeze({ people: 2, trip_days: 13, reserve_pct: 0.1 });

export const PARAM_KEY_RE = /^[a-z][a-z0-9_]{0,31}$/;
export const CITY_FIELD_RE = /^([a-z][a-z0-9_]*)_(nights|hotel|food|transport)$/;
const CITY_FIELDS = Object.freeze(['nights', 'hotel', 'food', 'transport']);

export const LIMITS = Object.freeze({
  formulaLength: 200,
  formulaDepth: 20,
  itemName: 120,
  categoryName: 60,
  note: 500,
  categoryId: 64,
});

const ITEM_FIELDS = Object.freeze([
  'category_id',
  'name',
  'qty',
  'qty_formula',
  'unit_price',
  'price_formula',
  'currency',
  'note',
]);

export class BudgetError extends Error {
  constructor(code, message, details = []) {
    super(message);
    this.name = 'BudgetError';
    this.code = code;
    this.details = details;
  }
}

function validationError(field, message) {
  return new BudgetError('validation', message, [{ field, message }]);
}

function syntaxError(message, pos) {
  return new BudgetError('SYNTAX', message, pos === undefined ? [] : [{ position: pos }]);
}

// ---------------------------------------------------------------------------
// §5 formula evaluator: tokenizer + recursive-descent parser
// ---------------------------------------------------------------------------

function tokenize(source) {
  if (typeof source !== 'string') throw syntaxError('formula must be a string');
  if (source.length > LIMITS.formulaLength) {
    throw new BudgetError(
      'TOO_LONG',
      `formula is longer than ${LIMITS.formulaLength} characters`,
      [{ length: source.length }],
    );
  }

  const tokens = [];
  let i = 0;
  while (i < source.length) {
    const ch = source[i];

    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      i += 1;
      continue;
    }

    if ((ch >= '0' && ch <= '9') || ch === '.') {
      let j = i;
      let dot = false;
      while (j < source.length) {
        const c = source[j];
        if (c >= '0' && c <= '9') {
          j += 1;
        } else if (c === '.') {
          if (dot) break;
          dot = true;
          j += 1;
        } else {
          break;
        }
      }
      const text = source.slice(i, j);
      const value = Number(text);
      if (text === '' || !Number.isFinite(value)) throw syntaxError('bad number', i);
      tokens.push({ type: 'number', value, pos: i });
      i = j;
      continue;
    }

    if (ch >= 'a' && ch <= 'z') {
      let j = i;
      while (j < source.length && /[a-z0-9_]/.test(source[j])) j += 1;
      tokens.push({ type: 'identifier', value: source.slice(i, j), pos: i });
      i = j;
      continue;
    }

    if (ch === '+' || ch === '-' || ch === '*' || ch === '/') {
      tokens.push({ type: 'operator', value: ch, pos: i });
      i += 1;
      continue;
    }

    if (ch === '(') {
      tokens.push({ type: 'lparen', value: ch, pos: i });
      i += 1;
      continue;
    }

    if (ch === ')') {
      tokens.push({ type: 'rparen', value: ch, pos: i });
      i += 1;
      continue;
    }

    throw syntaxError(`unexpected character "${ch}"`, i);
  }

  return tokens;
}

function readIdentifier(params, name) {
  if (params && Object.prototype.hasOwnProperty.call(params, name)) {
    const value = params[name];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  throw new BudgetError('UNKNOWN_PARAM', `unknown formula parameter "${name}"`, [{ param: name }]);
}

function evaluateTokens(tokens, params) {
  let index = 0;
  let depth = 0;

  function peek() {
    return tokens[index];
  }

  function parseExpression() {
    let value = parseTerm();
    while (peek() && peek().type === 'operator' && (peek().value === '+' || peek().value === '-')) {
      const op = tokens[index].value;
      index += 1;
      const rhs = parseTerm();
      value = op === '+' ? value + rhs : value - rhs;
    }
    return value;
  }

  function parseTerm() {
    let value = parseFactor();
    while (peek() && peek().type === 'operator' && (peek().value === '*' || peek().value === '/')) {
      const op = tokens[index].value;
      index += 1;
      const rhs = parseFactor();
      if (op === '*') {
        value *= rhs;
      } else {
        if (rhs === 0) throw new BudgetError('DIV_ZERO', 'division by zero');
        value /= rhs;
      }
    }
    return value;
  }

  function parseFactor() {
    const token = peek();
    if (!token) throw syntaxError('unexpected end of formula');

    if (token.type === 'operator' && (token.value === '+' || token.value === '-')) {
      index += 1;
      const value = parseFactor();
      return token.value === '-' ? -value : value;
    }

    if (token.type === 'number') {
      index += 1;
      return token.value;
    }

    if (token.type === 'identifier') {
      index += 1;
      const next = peek();
      if (next && next.type === 'lparen') throw syntaxError('function calls are not supported', next.pos);
      return readIdentifier(params, token.value);
    }

    if (token.type === 'lparen') {
      depth += 1;
      if (depth > LIMITS.formulaDepth) {
        throw new BudgetError('TOO_DEEP', `formula nesting is deeper than ${LIMITS.formulaDepth}`);
      }
      index += 1;
      const value = parseExpression();
      const closing = peek();
      if (!closing || closing.type !== 'rparen') throw syntaxError('missing closing parenthesis', token.pos);
      index += 1;
      depth -= 1;
      return value;
    }

    throw syntaxError('unexpected token', token.pos);
  }

  const value = parseExpression();
  if (index !== tokens.length) throw syntaxError('unexpected trailing input', tokens[index] && tokens[index].pos);
  if (!Number.isFinite(value)) throw new BudgetError('DIV_ZERO', 'formula produced a non-finite value');
  return value;
}

export function evaluateFormula(expression, params = {}) {
  if (typeof expression !== 'string' || expression.trim() === '') {
    throw syntaxError('formula is empty');
  }
  return evaluateTokens(tokenize(expression), params);
}

export function formulaParams(expression) {
  const tokens = tokenize(expression);
  const names = [];
  for (const token of tokens) {
    if (token.type === 'identifier' && !names.includes(token.value)) names.push(token.value);
  }
  return names;
}

export function validateFormula(expression, params = {}) {
  const params_used = formulaParams(expression);
  for (const name of params_used) {
    if (!Object.prototype.hasOwnProperty.call(params, name)) {
      throw new BudgetError('UNKNOWN_PARAM', `unknown formula parameter "${name}"`, [{ param: name }]);
    }
  }
  evaluateFormula(expression, params);
  return { params: params_used };
}

// ---------------------------------------------------------------------------
// §4 params validation
// ---------------------------------------------------------------------------

function assertPlainObject(value, field) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw validationError(field, `${field} must be an object`);
  }
}

function validateParamEntry(key, value) {
  if (value === null) throw validationError(key, 'value must not be null');
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw validationError(key, 'value must be a finite number');
  }
  if (key === 'people' || key === 'trip_days') {
    if (!Number.isInteger(value) || value < 1) {
      throw validationError(key, 'value must be an integer >= 1');
    }
    return value;
  }
  if (key === 'reserve_pct') {
    if (value < 0 || value > 1) throw validationError(key, 'value must be between 0 and 1');
    return value;
  }
  if (value < 0) throw validationError(key, 'value must be >= 0');
  return value;
}

export function validateParamsDoc(params) {
  assertPlainObject(params, 'params');
  const result = {};
  for (const [key, value] of Object.entries(params)) {
    if (!PARAM_KEY_RE.test(key)) throw validationError(key, 'invalid parameter name');
    result[key] = validateParamEntry(key, value);
  }
  return result;
}

export function validateParamsPatch(patch) {
  assertPlainObject(patch, 'params');
  const result = {};
  for (const [key, value] of Object.entries(patch)) {
    if (!PARAM_KEY_RE.test(key)) continue;
    result[key] = validateParamEntry(key, value);
  }
  return result;
}

export function resolveParams(params = {}) {
  const validated = validateParamsDoc(params);
  return { ...DEFAULT_PARAMS, ...validated };
}

// ---------------------------------------------------------------------------
// §6 money math
// ---------------------------------------------------------------------------

export function rateFor(currency, params = {}) {
  if (!CURRENCIES.includes(currency)) {
    throw validationError('currency', `currency must be one of ${CURRENCIES.join(', ')}`);
  }
  if (currency === 'RUB') return 1;
  const key = currency === 'CNY' ? 'cny_rate' : 'hkd_rate';
  return readIdentifier(params, key);
}

function resolveOperand(numberValue, formula, params, field) {
  const hasFormula = formula !== null && formula !== undefined;
  const hasNumber = numberValue !== null && numberValue !== undefined;
  if (hasFormula === hasNumber) {
    throw validationError(field, `exactly one of ${field} and ${field === 'qty' ? 'qty_formula' : 'price_formula'} must be set`);
  }
  if (hasFormula) {
    if (typeof formula !== 'string' || formula.trim() === '') {
      throw validationError(field, 'formula must be a non-empty string');
    }
    return evaluateFormula(formula, params);
  }
  if (typeof numberValue !== 'number' || !Number.isFinite(numberValue)) {
    throw validationError(field, 'value must be a finite number');
  }
  return numberValue;
}

export function itemAmount(item, params = {}) {
  const qty = resolveOperand(item.qty, item.qty_formula, params, 'qty');
  const unitPrice = resolveOperand(item.unit_price, item.price_formula, params, 'unit_price');
  const amount = qty * unitPrice;
  if (!Number.isFinite(amount)) throw new BudgetError('DIV_ZERO', 'item amount is not finite');
  return { qty, unitPrice, amount, amountRub: amount * rateFor(item.currency, params) };
}

export function computeBudget({ params, categories = [], items = [] } = {}) {
  const resolved = resolveParams(params);
  const buckets = new Map();
  for (const category of categories) {
    buckets.set(category.id, { id: category.id, name: category.name, subtotal: 0, count: 0 });
  }

  let base = 0;
  for (const item of items) {
    const { amountRub } = itemAmount(item, resolved);
    base += amountRub;
    let bucket = buckets.get(item.category_id);
    if (!bucket) {
      bucket = { id: item.category_id || null, name: '', subtotal: 0, count: 0 };
      buckets.set(item.category_id, bucket);
    }
    bucket.subtotal += amountRub;
    bucket.count += 1;
  }

  const reserve = Math.round(base * resolved.reserve_pct);
  const total = base + reserve;
  const perPerson = total / resolved.people;
  const perDay = perPerson / resolved.trip_days;

  return {
    params: resolved,
    base,
    reserve,
    total,
    perPerson,
    perDay,
    categories: [...buckets.values()],
  };
}

// ---------------------------------------------------------------------------
// formatting (§6)
// ---------------------------------------------------------------------------

export function formatNumber(value) {
  const rounded = Math.round(Number(value));
  if (!Number.isFinite(rounded)) return '—';
  const sign = rounded < 0 ? '-' : '';
  const digits = String(Math.abs(rounded));
  return sign + digits.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
}

export function formatRub(value) {
  return `${formatNumber(value)}\u00a0₽`;
}

export function formatMoney(value, currency) {
  if (!CURRENCIES.includes(currency)) {
    throw validationError('currency', `currency must be one of ${CURRENCIES.join(', ')}`);
  }
  if (currency === 'RUB') return formatRub(value);
  if (currency === 'CNY') return `¥${formatNumber(value)}`;
  return `HK$${formatNumber(value)}`;
}

// ---------------------------------------------------------------------------
// item / category normalisation (§4)
// ---------------------------------------------------------------------------

function trimmedString(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function validateItem(item, params) {
  const name = trimmedString(item.name);
  if (typeof name !== 'string' || name.length < 1 || name.length > LIMITS.itemName) {
    throw validationError('name', `name must be 1..${LIMITS.itemName} characters`);
  }

  const note = item.note === undefined || item.note === null ? '' : item.note;
  if (typeof note !== 'string' || note.length > LIMITS.note) {
    throw validationError('note', `note must be at most ${LIMITS.note} characters`);
  }

  if (typeof item.category_id !== 'string' || item.category_id.length < 1 || item.category_id.length > LIMITS.categoryId) {
    throw validationError('category_id', 'category_id is required');
  }

  if (!CURRENCIES.includes(item.currency)) {
    throw validationError('currency', `currency must be one of ${CURRENCIES.join(', ')}`);
  }

  const hasQty = item.qty !== null && item.qty !== undefined;
  const hasQtyFormula = item.qty_formula !== null && item.qty_formula !== undefined;
  if (hasQty === hasQtyFormula) {
    throw validationError('qty', 'exactly one of qty and qty_formula must be set');
  }
  if (hasQty) {
    if (typeof item.qty !== 'number' || !Number.isFinite(item.qty) || item.qty < 0) {
      throw validationError('qty', 'qty must be a finite number >= 0');
    }
  } else if (typeof item.qty_formula !== 'string' || item.qty_formula.trim() === '') {
    throw validationError('qty_formula', 'qty_formula must be a non-empty string');
  }

  const hasPrice = item.unit_price !== null && item.unit_price !== undefined;
  const hasPriceFormula = item.price_formula !== null && item.price_formula !== undefined;
  if (hasPrice === hasPriceFormula) {
    throw validationError('unit_price', 'exactly one of unit_price and price_formula must be set');
  }
  if (hasPrice) {
    if (typeof item.unit_price !== 'number' || !Number.isFinite(item.unit_price) || item.unit_price < 0) {
      throw validationError('unit_price', 'unit_price must be a finite number >= 0');
    }
  } else if (typeof item.price_formula !== 'string' || item.price_formula.trim() === '') {
    throw validationError('price_formula', 'price_formula must be a non-empty string');
  }

  const qtyFormula = hasQtyFormula ? trimmedString(item.qty_formula) : null;
  const priceFormula = hasPriceFormula ? trimmedString(item.price_formula) : null;
  if (qtyFormula !== null) validateFormula(qtyFormula, params);
  if (priceFormula !== null) validateFormula(priceFormula, params);

  return {
    category_id: item.category_id,
    name,
    qty: hasQty ? item.qty : null,
    qty_formula: qtyFormula,
    unit_price: hasPrice ? item.unit_price : null,
    price_formula: priceFormula,
    currency: item.currency,
    note,
  };
}

export function mergeItem(base, patch) {
  assertPlainObject(patch, 'item');
  const next = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (!ITEM_FIELDS.includes(key)) continue;
    if (value === null) throw validationError(key, 'null is not allowed; omit the field instead');
    next[key] = value;
  }
  const touchedQty = Object.prototype.hasOwnProperty.call(patch, 'qty');
  const touchedQtyFormula = Object.prototype.hasOwnProperty.call(patch, 'qty_formula');
  if (touchedQtyFormula && !touchedQty) next.qty = null;
  if (touchedQty && !touchedQtyFormula) next.qty_formula = null;

  const touchedPrice = Object.prototype.hasOwnProperty.call(patch, 'unit_price');
  const touchedPriceFormula = Object.prototype.hasOwnProperty.call(patch, 'price_formula');
  if (touchedPriceFormula && !touchedPrice) next.unit_price = null;
  if (touchedPrice && !touchedPriceFormula) next.price_formula = null;

  return next;
}

export function normalizeItemInput(input, params = {}, options = {}) {
  const { base = null } = options;
  const source = base ? mergeItem(base, input) : input;
  assertPlainObject(source, 'item');
  return validateItem(source, params);
}

export function normalizeCategoryInput(input, options = {}) {
  const { partial = false } = options;
  assertPlainObject(input, 'category');
  const result = {};
  if (Object.prototype.hasOwnProperty.call(input, 'name')) {
    const name = trimmedString(input.name);
    if (typeof name !== 'string' || name.length < 1 || name.length > LIMITS.categoryName) {
      throw validationError('name', `name must be 1..${LIMITS.categoryName} characters`);
    }
    result.name = name;
  } else if (!partial) {
    throw validationError('name', 'name is required');
  }
  if (Object.prototype.hasOwnProperty.call(input, 'sort')) {
    if (input.sort === null) throw validationError('sort', 'sort must be a number');
    if (typeof input.sort !== 'number' || !Number.isFinite(input.sort)) {
      throw validationError('sort', 'sort must be a number');
    }
    result.sort = Math.trunc(input.sort);
  }
  return result;
}

// ---------------------------------------------------------------------------
// derived helpers for the UI (§4, §9)
// ---------------------------------------------------------------------------

export function cityBlocks(params = {}) {
  const blocks = new Map();
  for (const [key, value] of Object.entries(params)) {
    const match = CITY_FIELD_RE.exec(key);
    if (!match) continue;
    const prefix = match[1];
    const field = match[2];
    if (prefix.length > 32) continue;
    if (typeof value !== 'number' || !Number.isFinite(value)) continue;
    if (!blocks.has(prefix)) {
      const block = { prefix };
      for (const name of CITY_FIELDS) block[name] = undefined;
      blocks.set(prefix, block);
    }
    blocks.get(prefix)[field] = value;
  }
  return [...blocks.values()];
}
