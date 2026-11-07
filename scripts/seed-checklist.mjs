#!/usr/bin/env node
// Разовый сев чек-листа через API воркера. JSON с содержимым не коммитим.
// Usage: node scripts/seed-checklist.mjs <path-to-json> [--reset] [password]
// Пароль: TRIP_PASSWORD или аргумент (если он не --reset).
// API: TRIP_API_URL (по умолчанию боевой воркер).

import fs from 'node:fs';

const API_BASE = (
  process.env.TRIP_API_URL ||
  process.env.BUDGET_API_URL ||
  'https://china-trip-api.pages.dev'
).replace(/\/+$/, '');

// Cloudflare отбивает запросы без user-agent (ошибка 1010).
const USER_AGENT = 'china-trip-checklist-seed/1.0 (+https://github.com/rawkward/china-trip)';

function fail(message) {
  console.error(`seed-checklist: ${message}`);
  process.exit(1);
}

const args = process.argv.slice(2);
const seedPath = args[0];
if (!seedPath) {
  fail('usage: node scripts/seed-checklist.mjs <path-to-json> [--reset] [password]');
}

const reset = args.includes('--reset');
const passwordArg = args.slice(1).find((arg) => arg !== '--reset');
const password = process.env.TRIP_PASSWORD || passwordArg || '';
if (!password) fail('пароль не задан: TRIP_PASSWORD или аргумент командной строки');

if (!fs.existsSync(seedPath)) fail(`файл не найден: ${seedPath}`);

let seed;
try {
  seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
} catch (err) {
  fail(`не удалось разобрать ${seedPath}: ${err.message}`);
}
if (!Array.isArray(seed)) fail('JSON должен быть массивом: [{ cap, items: ["<b>…</b>…", …] }]');

async function call(path, { method = 'GET', body, token } = {}) {
  const headers = { 'user-agent': USER_AGENT, accept: 'application/json' };
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (token) headers.authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(API_BASE + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (err) {
    fail(`нет связи с ${API_BASE}: ${err.message}`);
  }

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const detail = data?.details?.[0]?.message || data?.error || `ошибка ${response.status}`;
    fail(`${method} ${path}: ${response.status} ${detail}`);
  }
  return data;
}

const login = await call('/api/login', { method: 'POST', body: { password } });
const token = login?.token;
if (!token) fail('сервер не вернул токен');

const existing = await call('/api/checklist', { token });
const groups = Array.isArray(existing?.groups) ? existing.groups : [];

if (groups.length > 0 && !reset) {
  console.log(`уже есть ${groups.length} групп — сев пропущен (добавьте --reset, чтобы перезаписать)`);
  process.exit(0);
}

if (reset) {
  for (const group of groups) {
    await call(`/api/checklist/groups/${encodeURIComponent(group.id)}`, { method: 'DELETE', token });
  }
}

let createdGroups = 0;
let createdItems = 0;

for (const [groupIndex, group] of seed.entries()) {
  if (!group || typeof group !== 'object' || Array.isArray(group)) {
    fail(`группа #${groupIndex} должна быть объектом`);
  }
  if (typeof group.cap !== 'string' || !group.cap.trim()) {
    fail(`у группы #${groupIndex} нет названия`);
  }
  if (!Array.isArray(group.items)) {
    fail(`у группы «${group.cap}» нет массива items`);
  }

  const created = await call('/api/checklist/groups', {
    method: 'POST',
    body: { cap: group.cap },
    token,
  });
  const groupId = created?.group?.id;
  if (!groupId) fail(`сервер не вернул id группы «${group.cap}»`);
  createdGroups += 1;

  for (const [itemIndex, text] of group.items.entries()) {
    if (typeof text !== 'string') {
      fail(`пункт #${itemIndex} в группе «${group.cap}» должен быть строкой`);
    }
    await call('/api/checklist/items', {
      method: 'POST',
      body: { group: groupId, text },
      token,
    });
    createdItems += 1;
  }
}

console.log(`готово: ${createdGroups} групп, ${createdItems} пунктов`);
