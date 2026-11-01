import { before, describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { CURRENCIES } from '../shared/budget-core.js';

const BASE = process.env.BUDGET_API_URL ? process.env.BUDGET_API_URL.replace(/\/+$/, '') : null;
const PASSWORD = process.env.BUDGET_PASSWORD || 'test-pass';
const PAGES_ORIGIN = 'https://rawkward.github.io';

const suite = BASE ? describe : describe.skip;

suite('budget API (integration)', () => {
  let token = null;
  let paramsSnapshot = null;

  function headersFor({ auth = true, origin = PAGES_ORIGIN, json = false, ip } = {}) {
    const headers = {};
    if (origin) headers.Origin = origin;
    if (json) headers['Content-Type'] = 'application/json';
    if (auth && token) headers.Authorization = `Bearer ${token}`;
    if (ip) headers['CF-Connecting-IP'] = ip;
    return headers;
  }

  async function call(path, options = {}) {
    const { method = 'GET', body, rawBody, auth = true, origin = PAGES_ORIGIN, ip } = options;
    const hasBody = body !== undefined || rawBody !== undefined;
    const headers = headersFor({ auth, origin, json: hasBody, ip });
    const response = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: rawBody !== undefined ? rawBody : body !== undefined ? JSON.stringify(body) : undefined,
    });
    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }
    return { response, status: response.status, data, headers: response.headers };
  }

  before(async () => {
    const result = await call('/api/login', { method: 'POST', body: { password: PASSWORD }, auth: false });
    assert.equal(result.status, 200, `login failed: ${JSON.stringify(result.data)}`);
    token = result.data.token;
    const budget = await call('/api/budget');
    assert.equal(budget.status, 200);
    paramsSnapshot = budget.data.params;
  });

  test('GET /api/health is public', async () => {
    const result = await call('/api/health', { auth: false });
    assert.equal(result.status, 200);
    assert.deepEqual(result.data, { ok: true });
  });

  test('protected routes reject missing token', async () => {
    const result = await call('/api/budget', { auth: false });
    assert.equal(result.status, 401);
    assert.deepEqual(result.data, { error: 'unauthorized' });
  });

  test('wrong password is 403', async () => {
    const result = await call('/api/login', { method: 'POST', body: { password: 'nope-nope' }, auth: false });
    assert.equal(result.status, 403);
  });

  test('login returns a v1 token with 30-day expiry', async () => {
    const result = await call('/api/login', { method: 'POST', body: { password: PASSWORD }, auth: false });
    assert.equal(result.status, 200);
    assert.match(result.data.token, /^v1\.\d{1,12}\.[0-9a-f]{64}$/);
    const now = Math.floor(Date.now() / 1000);
    assert.ok(result.data.expires_at > now + 29 * 24 * 3600);
    assert.ok(result.data.expires_at <= now + 31 * 24 * 3600);
    token = result.data.token;
  });

  test('GET /api/budget returns the seeded document shape', async () => {
    const result = await call('/api/budget');
    assert.equal(result.status, 200);
    assert.equal(typeof result.data.params, 'object');
    assert.ok(Array.isArray(result.data.categories));
    assert.ok(Array.isArray(result.data.items));
    assert.ok(Number.isInteger(result.data.version));
    for (const item of result.data.items) {
      assert.ok(CURRENCIES.includes(item.currency));
      assert.ok(item.id);
      assert.ok(item.category_id);
    }
    for (const category of result.data.categories) {
      assert.ok(category.id);
      assert.equal(typeof category.name, 'string');
    }
  });

  test('item create / patch / delete round-trip', async () => {
    const createdCategory = await call('/api/categories', {
      method: 'POST',
      body: { name: `API test ${Date.now()}` },
    });
    assert.equal(createdCategory.status, 200);
    const categoryId = createdCategory.data.id;
    assert.ok(categoryId);

    const created = await call('/api/items', {
      method: 'POST',
      body: {
        category_id: categoryId,
        name: 'Test item',
        qty: 2,
        unit_price: 1000,
        currency: 'RUB',
        note: 'created by integration test',
      },
    });
    assert.equal(created.status, 200, JSON.stringify(created.data));
    const itemId = created.data.id;
    assert.equal(created.data.qty, 2);
    assert.equal(created.data.unit_price, 1000);

    const patched = await call(`/api/items/${itemId}`, {
      method: 'PATCH',
      body: { name: 'Test item renamed', qty_formula: 'people' },
    });
    assert.equal(patched.status, 200, JSON.stringify(patched.data));
    assert.equal(patched.data.name, 'Test item renamed');
    assert.equal(patched.data.qty_formula, 'people');
    assert.equal(patched.data.qty, null);

    const budget = await call('/api/budget');
    assert.ok(budget.data.items.some((item) => item.id === itemId));

    const deleted = await call(`/api/items/${itemId}`, { method: 'DELETE' });
    assert.equal(deleted.status, 200);
    assert.deepEqual(deleted.data, { deleted: true });

    const after = await call('/api/budget');
    assert.ok(!after.data.items.some((item) => item.id === itemId));

    const deletedCategory = await call(`/api/categories/${categoryId}`, { method: 'DELETE' });
    assert.equal(deletedCategory.status, 200);
    assert.deepEqual(deletedCategory.data, { deleted: true, items_deleted: 0 });
  });

  test('deleting a category cascades to its items', async () => {
    const category = await call('/api/categories', {
      method: 'POST',
      body: { name: `Cascade test ${Date.now()}` },
    });
    const categoryId = category.data.id;

    const ids = [];
    for (const name of ['Cascade one', 'Cascade two']) {
      const item = await call('/api/items', {
        method: 'POST',
        body: { category_id: categoryId, name, qty: 1, unit_price: 10, currency: 'RUB' },
      });
      assert.equal(item.status, 200, JSON.stringify(item.data));
      ids.push(item.data.id);
    }

    const deleted = await call(`/api/categories/${categoryId}`, { method: 'DELETE' });
    assert.equal(deleted.status, 200);
    assert.deepEqual(deleted.data, { deleted: true, items_deleted: 2 });

    const budget = await call('/api/budget');
    assert.ok(!budget.data.categories.some((category) => category.id === categoryId));
    for (const id of ids) assert.ok(!budget.data.items.some((item) => item.id === id));
  });

  test('unknown ids are 404', async () => {
    assert.equal((await call('/api/items/does-not-exist', { method: 'DELETE' })).status, 404);
    assert.equal((await call('/api/categories/does-not-exist', { method: 'DELETE' })).status, 404);
    assert.equal(
      (await call('/api/items', {
        method: 'POST',
        body: { category_id: 'missing', name: 'x', qty: 1, unit_price: 1, currency: 'RUB' },
      })).status,
      404,
    );
  });

  test('malformed JSON and unknown routes are 400', async () => {
    const malformed = await call('/api/params', { method: 'PATCH', rawBody: '{"cny_rate":' });
    assert.equal(malformed.status, 400);
    assert.equal((await call('/api/nowhere')).status, 400);
  });

  test('body over 32 KB is 413', async () => {
    const big = JSON.stringify({ cny_rate: 1, pad: 'x'.repeat(33 * 1024) });
    const result = await call('/api/params', { method: 'PATCH', rawBody: big });
    assert.equal(result.status, 413);
  });

  test('PATCH /api/params rejects bad shapes with 422', async () => {
    assert.equal((await call('/api/params', { method: 'PATCH', body: { reserve_pct: 5 } })).status, 422);
    assert.equal((await call('/api/params', { method: 'PATCH', body: { people: 0 } })).status, 422);
    assert.equal((await call('/api/params', { method: 'PATCH', body: { cny_rate: null } })).status, 422);
    assert.equal((await call('/api/params', { method: 'PATCH', body: { cny_rate: 'x' } })).status, 422);
  });

  test('PATCH /api/params ignores unknown keys and keeps the document', async () => {
    const result = await call('/api/params', { method: 'PATCH', body: { __bogus__: 1 } });
    assert.equal(result.status, 200);
    assert.equal(result.data.cny_rate, paramsSnapshot.cny_rate);
    assert.equal(result.data.hkd_rate, paramsSnapshot.hkd_rate);
  });

  test('unknown formula parameter is a 422, not a silent zero', async () => {
    const category = await call('/api/categories', {
      method: 'POST',
      body: { name: `Formula test ${Date.now()}` },
    });
    const categoryId = category.data.id;
    try {
      const result = await call('/api/items', {
        method: 'POST',
        body: { category_id: categoryId, name: 'Bad formula', qty_formula: 'not_a_param', unit_price: 1, currency: 'RUB' },
      });
      assert.equal(result.status, 422);
      assert.equal(result.data.error, 'validation');
      assert.ok(JSON.stringify(result.data.details).includes('not_a_param'));
    } finally {
      await call(`/api/categories/${categoryId}`, { method: 'DELETE' });
    }
  });

  test('CORS preflight echoes the Pages origin', async () => {
    const result = await call('/api/budget', { method: 'OPTIONS', auth: false, origin: PAGES_ORIGIN });
    assert.equal(result.status, 204);
    assert.equal(result.headers.get('access-control-allow-origin'), PAGES_ORIGIN);
    assert.match(result.headers.get('access-control-allow-methods') || '', /PATCH/);
    assert.match(result.headers.get('access-control-allow-headers') || '', /authorization/);
    assert.equal(result.headers.get('access-control-max-age'), '86400');
  });

  test('CORS header is absent for a foreign origin', async () => {
    const result = await call('/api/budget', { method: 'OPTIONS', auth: false, origin: 'https://evil.example' });
    assert.equal(result.status, 204);
    assert.equal(result.headers.get('access-control-allow-origin'), null);
  });

  test('six failed logins from one IP throttle with 429', async () => {
    const ip = '203.0.113.77';
    const statuses = [];
    let last = null;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      last = await call('/api/login', {
        method: 'POST',
        body: { password: `wrong-${attempt}` },
        auth: false,
        origin: null,
        ip,
      });
      statuses.push(last.status);
      if (last.status === 429) break;
    }
    assert.ok(statuses.includes(403), `expected some 403s, got ${statuses.join(',')}`);
    assert.equal(last.status, 429, `expected throttle, got ${statuses.join(',')}`);
    assert.equal(last.data.error, 'too_many_attempts');
    assert.ok(Number.isInteger(last.data.retry_after) && last.data.retry_after > 0);
  });
});
