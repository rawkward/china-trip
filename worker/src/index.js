import {
  BudgetError,
  mergeItem,
  normalizeCategoryInput,
  normalizeItemInput,
  resolveParams,
  validateParamsPatch,
} from '../../shared/budget-core.js';
import {
  DayNoteError,
  normalizeDayNoteBody,
  normalizeDayNoteKey,
  splitDayKey,
} from '../../shared/day-notes.js';
import {
  StopNoteError,
  normalizeStopNoteBody,
  normalizeStopNoteKey,
  splitStopKey,
} from '../../shared/stop-notes.js';
import {
  DayTextError,
  normalizeDayTextKey,
  normalizeDayTexts,
  splitDayKey as splitDayTextKey,
} from '../../shared/day-texts.js';
import {
  GuideTagError,
  normalizeGuideTag,
  normalizeGuideTagKey,
  splitGuideTagKey,
} from '../../shared/guide-tags.js';
import {
  CHECKLIST_LIMITS,
  ChecklistError,
  newChecklistId,
  normalizeChecklistCap,
  normalizeChecklistText,
} from '../../shared/checklist.js';
import { preflight, withCors } from './cors.js';
import * as db from './db.js';
import { signToken, verifyPassword, verifyToken, TOKEN_TTL_SECONDS } from './auth.js';

const MAX_BODY_BYTES = 32 * 1024;
const THROTTLE_WINDOW_SECONDS = 15 * 60;
const MAX_FAILURES = 5;
const PRUNE_WINDOW_SECONDS = 24 * 60 * 60;

class HttpError extends Error {
  constructor(status, payload) {
    super(payload && payload.error ? payload.error : 'http_error');
    this.name = 'HttpError';
    this.status = status;
    this.payload = payload;
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function errorResponse(err) {
  if (err instanceof HttpError) return json(err.payload, err.status);
  if (
    err instanceof DayNoteError ||
    err instanceof StopNoteError ||
    err instanceof DayTextError ||
    err instanceof GuideTagError ||
    err instanceof ChecklistError
  ) {
    return json({ error: 'validation', details: [{ code: err.code, field: err.field, message: err.message }] }, 422);
  }
  if (err instanceof BudgetError) {
    return json(
      {
        error: 'validation',
        details:
          err.details && err.details.length > 0
            ? err.details.map((detail) => ({ code: err.code, ...detail }))
            : [{ code: err.code, message: err.message }],
      },
      422,
    );
  }
  console.error('unhandled error:', err && err.message);
  return json({ error: 'internal' }, 500);
}

async function readJsonBody(request) {
  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) {
    throw new HttpError(413, { error: 'body_too_large' });
  }
  if (text.trim() === '') throw new HttpError(400, { error: 'bad_json' });
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new HttpError(400, { error: 'bad_json' });
  }
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    throw new HttpError(400, { error: 'bad_json' });
  }
  return data;
}

async function requireAuth(request, env) {
  if (!env.TOKEN_SECRET) throw new HttpError(500, { error: 'server_misconfigured' });
  const header = request.headers.get('Authorization') || '';
  const match = /^Bearer\s+(\S+)$/i.exec(header);
  if (!match) throw new HttpError(401, { error: 'unauthorized' });
  const payload = await verifyToken(env.TOKEN_SECRET, match[1], db.nowSeconds());
  if (!payload) throw new HttpError(401, { error: 'unauthorized' });
  return payload;
}

function clientIp(request) {
  return request.headers.get('CF-Connecting-IP') || 'unknown';
}

async function handleLogin(request, env) {
  if (!env.BUDGET_PASSWORD || !env.TOKEN_SECRET) {
    throw new HttpError(500, { error: 'server_misconfigured' });
  }
  const ip = clientIp(request);
  const now = db.nowSeconds();
  await db.pruneLoginAttempts(env.DB, now - PRUNE_WINDOW_SECONDS);

  const windowStart = now - THROTTLE_WINDOW_SECONDS;
  const failures = await db.countLoginFailures(env.DB, ip, windowStart);
  if (failures >= MAX_FAILURES) {
    const earliest = await db.earliestLoginFailure(env.DB, ip, windowStart);
    const retryAfter = Math.max(1, Math.ceil((earliest ?? now) + THROTTLE_WINDOW_SECONDS - now));
    throw new HttpError(429, { error: 'too_many_attempts', retry_after: retryAfter });
  }

  const body = await readJsonBody(request);
  const password = typeof body.password === 'string' ? body.password : '';
  const ok = await verifyPassword(password, env.BUDGET_PASSWORD);

  if (!ok) {
    await db.recordLoginFailure(env.DB, ip, now);
    throw new HttpError(403, { error: 'wrong_password' });
  }

  await db.clearLoginFailures(env.DB, ip);
  const expiresAt = now + TOKEN_TTL_SECONDS;
  const token = await signToken(env.TOKEN_SECRET, expiresAt);
  return json({ token, expires_at: expiresAt });
}

async function handleGetBudget(env) {
  const { params, updated_at } = await db.readParams(env.DB);
  const categories = await db.listCategories(env.DB);
  const items = await db.listItems(env.DB);

  let version = updated_at ? updated_at * 1000 : 0;
  for (const category of categories) version = Math.max(version, category.updated_at * 1000);
  for (const item of items) version = Math.max(version, item.updated_at * 1000);
  if (!version) version = Date.now();

  return json({ params, params_updated_at: updated_at, categories, items, version });
}

async function handlePatchParams(request, env) {
  const patch = validateParamsPatch(await readJsonBody(request));
  const { params } = await db.readParams(env.DB);
  const next = resolveParams({ ...params, ...patch });
  await db.writeParams(env.DB, next, db.nowSeconds());
  return json(next);
}

async function handleCreateCategory(request, env) {
  const input = normalizeCategoryInput(await readJsonBody(request));
  const category = await db.createCategory(env.DB, { id: `cat_${crypto.randomUUID()}`, name: input.name });
  return json(category);
}

async function handleUpdateCategory(request, env, id) {
  const fields = normalizeCategoryInput(await readJsonBody(request), { partial: true });
  const category = await db.updateCategory(env.DB, id, fields);
  if (!category) throw new HttpError(404, { error: 'not_found' });
  return json(category);
}

async function handleDeleteCategory(env, id) {
  const result = await db.deleteCategory(env.DB, id);
  if (!result) throw new HttpError(404, { error: 'not_found' });
  return json({ deleted: true, items_deleted: result.items_deleted });
}

async function assertCategoryExists(env, categoryId) {
  const category = await db.getCategory(env.DB, categoryId);
  if (!category) throw new HttpError(404, { error: 'not_found' });
}

async function handleCreateItem(request, env) {
  const body = await readJsonBody(request);
  const { params } = await db.readParams(env.DB);
  const input = normalizeItemInput(body, params);
  await assertCategoryExists(env, input.category_id);
  const item = await db.createItem(env.DB, { ...input, id: `itm_${crypto.randomUUID()}` });
  return json(item);
}

async function handleUpdateItem(request, env, id) {
  const existing = await db.getItem(env.DB, id);
  if (!existing) throw new HttpError(404, { error: 'not_found' });
  const patch = await readJsonBody(request);

  let requestedSort;
  if (Object.prototype.hasOwnProperty.call(patch, 'sort')) {
    if (patch.sort === null) throw new HttpError(422, { error: 'validation', details: [{ field: 'sort', message: 'sort must be a number' }] });
    if (typeof patch.sort !== 'number' || !Number.isFinite(patch.sort)) {
      throw new HttpError(422, { error: 'validation', details: [{ field: 'sort', message: 'sort must be a number' }] });
    }
    requestedSort = Math.trunc(patch.sort);
  }

  const merged = mergeItem(existing, patch);
  const { params } = await db.readParams(env.DB);
  const input = normalizeItemInput(merged, params);
  await assertCategoryExists(env, input.category_id);
  const item = await db.updateItem(env.DB, id, input, requestedSort);
  if (!item) throw new HttpError(404, { error: 'not_found' });
  return json(item);
}

async function handleDeleteItem(env, id) {
  const deleted = await db.deleteItem(env.DB, id);
  if (!deleted) throw new HttpError(404, { error: 'not_found' });
  return json({ deleted: true });
}

// -- заметки к дням ---------------------------------------------------------

async function handleListDayNotes(env) {
  const notes = await db.listDayNotes(env.DB);
  let version = 0;
  for (const note of notes) version = Math.max(version, note.updated_at);
  return json({ notes, version });
}

async function handlePutDayNote(request, env, rawKey) {
  const day_key = normalizeDayNoteKey(rawKey);
  const raw = (await readJsonBody(request)).body;

  // Пустая заметка — это удаление: так «Сохранить» на очищенном поле делает то, что ждёт человек.
  if (typeof raw === 'string' && raw.trim() === '') {
    await db.deleteDayNote(env.DB, day_key);
    return json({ deleted: true, day_key });
  }

  const body = normalizeDayNoteBody(raw);
  const { variant_id, day_date } = splitDayKey(day_key);
  const note = await db.upsertDayNote(env.DB, { day_key, variant_id, day_date, body });
  return json({ note });
}

async function handleDeleteDayNote(env, rawKey) {
  const day_key = normalizeDayNoteKey(rawKey);
  const deleted = await db.deleteDayNote(env.DB, day_key);
  if (!deleted) throw new HttpError(404, { error: 'not_found' });
  return json({ deleted: true, day_key });
}

// -- правка текста к остановкам ---------------------------------------------

async function handleListStopNotes(env) {
  const notes = await db.listStopNotes(env.DB);
  let version = 0;
  for (const note of notes) version = Math.max(version, note.updated_at);
  return json({ notes, version });
}

async function handlePutStopNote(request, env, rawKey) {
  const stop_key = normalizeStopNoteKey(rawKey);
  const payload = await readJsonBody(request);
  const raw = payload.body;

  // Пустой текст — это откат к тексту из маршрута, то есть удаление правки.
  if (typeof raw === 'string' && raw.trim() === '') {
    await db.deleteStopNote(env.DB, stop_key);
    return json({ deleted: true, stop_key });
  }

  const body = normalizeStopNoteBody(raw);
  const { variant_id, day_date, stop_slug } = splitStopKey(stop_key);
  const stop_name = typeof payload.stop_name === 'string' ? payload.stop_name.slice(0, 160) : '';
  const note = await db.upsertStopNote(env.DB, { stop_key, variant_id, day_date, stop_slug, stop_name, body });
  return json({ note });
}

async function handleDeleteStopNote(env, rawKey) {
  const stop_key = normalizeStopNoteKey(rawKey);
  const deleted = await db.deleteStopNote(env.DB, stop_key);
  if (!deleted) throw new HttpError(404, { error: 'not_found' });
  return json({ deleted: true, stop_key });
}

// -- правка любого текста в карточке дня ------------------------------------

function parseDayTexts(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
  } catch {
    // битая строка в D1 не должна ронять публичное чтение
  }
  return {};
}

async function handleListDayTexts(env) {
  const rows = await db.listDayTexts(env.DB);
  const notes = rows.map((row) => ({
    day_key: row.day_key,
    variant_id: row.variant_id,
    day_date: row.day_date,
    texts: parseDayTexts(row.body),
    updated_at: row.updated_at,
  }));
  return json({ notes });
}

async function handlePutDayText(request, env, rawKey) {
  const day_key = normalizeDayTextKey(rawKey);
  const payload = await readJsonBody(request);
  const texts = normalizeDayTexts(payload.texts);
  const { variant_id, day_date } = splitDayTextKey(day_key);

  // Пустой набор — это сброс всех правок дня, строку в D1 не держим.
  if (Object.keys(texts).length === 0) {
    await db.deleteDayText(env.DB, day_key);
    return json({ note: null });
  }

  const row = await db.upsertDayText(env.DB, {
    day_key,
    variant_id,
    day_date,
    body: JSON.stringify(texts),
  });
  return json({ note: { day_key, variant_id, day_date, texts, updated_at: row.updated_at } });
}

async function handleDeleteDayText(env, rawKey) {
  const day_key = normalizeDayTextKey(rawKey);
  const deleted = await db.deleteDayText(env.DB, day_key);
  if (!deleted) throw new HttpError(404, { error: 'not_found' });
  return json({ deleted: true, day_key });
}

// -- теги карточек справочника ----------------------------------------------

async function handleListGuideTags(env) {
  const tags = await db.listGuideTags(env.DB);
  return json({ tags });
}

async function handlePutGuideTag(request, env, rawKey) {
  const tag_key = normalizeGuideTagKey(rawKey);
  const payload = await readJsonBody(request);
  const tag = normalizeGuideTag(payload.tag);
  const { kind, city, guide_id } = splitGuideTagKey(tag_key);
  const row = await db.upsertGuideTag(env.DB, { tag_key, kind, city, guide_id, tag });
  return json({ tag: row });
}

async function handleDeleteGuideTag(env, rawKey) {
  const tag_key = normalizeGuideTagKey(rawKey);
  const deleted = await db.deleteGuideTag(env.DB, tag_key);
  if (!deleted) throw new HttpError(404, { error: 'not_found' });
  return json({ deleted: true, tag_key });
}

// -- чек-лист ---------------------------------------------------------------
// В отличие от заметок к дням, чек-лист закрыт паролем целиком: и чтение, и правки.

function checklistGroupJson(group, items) {
  return {
    id: group.id,
    cap: group.cap,
    sort: group.sort,
    items: items.map((item) => ({ id: item.id, text: item.text, sort: item.sort })),
  };
}

function checklistItemJson(item) {
  return { id: item.id, text: item.text, sort: item.sort };
}

async function handleListChecklist(env) {
  const groups = await db.listChecklistGroups(env.DB);
  const items = await db.listChecklistItems(env.DB);
  const byGroup = new Map(groups.map((group) => [group.id, []]));
  for (const item of items) {
    const list = byGroup.get(item.group_id);
    if (list) list.push(item);
  }
  return json({ groups: groups.map((group) => checklistGroupJson(group, byGroup.get(group.id) ?? [])) });
}

async function handleCreateChecklistGroup(request, env) {
  const body = await readJsonBody(request);
  const cap = normalizeChecklistCap(body.cap);
  const count = await db.countChecklistGroups(env.DB);
  if (count >= CHECKLIST_LIMITS.groups) {
    throw new ChecklistError(
      'too_many_groups',
      'cap',
      `групп не может быть больше ${CHECKLIST_LIMITS.groups}`,
    );
  }
  const group = await db.insertChecklistGroup(env.DB, { id: newChecklistId('grp'), cap });
  return json({ group: checklistGroupJson(group, []) });
}

async function handleUpdateChecklistGroup(request, env, id) {
  const body = await readJsonBody(request);
  const cap = normalizeChecklistCap(body.cap);
  const group = await db.updateChecklistGroup(env.DB, id, { cap });
  if (!group) throw new HttpError(404, { error: 'not_found' });
  const items = await db.listChecklistItems(env.DB, id);
  return json({ group: checklistGroupJson(group, items) });
}

async function handleDeleteChecklistGroup(env, id) {
  const result = await db.deleteChecklistGroup(env.DB, id);
  if (!result) throw new HttpError(404, { error: 'not_found' });
  return json({ deleted: true });
}

async function handleCreateChecklistItem(request, env) {
  const body = await readJsonBody(request);
  const groupId = String(body.group === undefined || body.group === null ? '' : body.group).trim();
  if (!groupId) throw new ChecklistError('bad_group', 'group', 'не указана группа');
  const group = await db.getChecklistGroup(env.DB, groupId);
  if (!group) throw new HttpError(404, { error: 'not_found' });

  const text = normalizeChecklistText(body.text);
  const count = await db.countChecklistItemsInGroup(env.DB, groupId);
  if (count >= CHECKLIST_LIMITS.itemsPerGroup) {
    throw new ChecklistError(
      'too_many_items',
      'text',
      `в группе не может быть больше ${CHECKLIST_LIMITS.itemsPerGroup} пунктов`,
    );
  }
  const item = await db.insertChecklistItem(env.DB, { id: newChecklistId('itm'), group_id: groupId, text });
  return json({ item: checklistItemJson(item) });
}

async function handleUpdateChecklistItem(request, env, id) {
  const existing = await db.getChecklistItem(env.DB, id);
  if (!existing) throw new HttpError(404, { error: 'not_found' });
  const body = await readJsonBody(request);
  const text = normalizeChecklistText(body.text);
  const item = await db.updateChecklistItem(env.DB, id, { text });
  if (!item) throw new HttpError(404, { error: 'not_found' });
  return json({ item: checklistItemJson(item) });
}

async function handleDeleteChecklistItem(env, id) {
  const deleted = await db.deleteChecklistItem(env.DB, id);
  if (!deleted) throw new HttpError(404, { error: 'not_found' });
  return json({ deleted: true });
}

async function route(request, env, url) {
  const { pathname } = url;
  const method = request.method;

  if (method === 'OPTIONS') return preflight(request);

  if (pathname === '/api/health' && method === 'GET') return json({ ok: true });
  if (pathname === '/api/login' && method === 'POST') return handleLogin(request, env);

  if (!pathname.startsWith('/api/')) throw new HttpError(404, { error: 'not_found' });

  // Заметки к дням и правки текста к остановкам читаются без пароля: страница публичная, править — только с токеном.
  if (pathname === '/api/day-notes' && method === 'GET') return handleListDayNotes(env);
  if (pathname === '/api/stop-notes' && method === 'GET') return handleListStopNotes(env);
  if (pathname === '/api/day-texts' && method === 'GET') return handleListDayTexts(env);
  if (pathname === '/api/guide-tags' && method === 'GET') return handleListGuideTags(env);

  await requireAuth(request, env);

  if (pathname === '/api/budget' && method === 'GET') return handleGetBudget(env);
  if (pathname === '/api/params' && method === 'PATCH') return handlePatchParams(request, env);
  if (pathname === '/api/categories' && method === 'POST') return handleCreateCategory(request, env);
  if (pathname === '/api/items' && method === 'POST') return handleCreateItem(request, env);

  if (pathname === '/api/checklist' && method === 'GET') return handleListChecklist(env);
  if (pathname === '/api/checklist/groups' && method === 'POST') {
    return handleCreateChecklistGroup(request, env);
  }
  if (pathname === '/api/checklist/items' && method === 'POST') {
    return handleCreateChecklistItem(request, env);
  }

  const checklistGroupMatch = /^\/api\/checklist\/groups\/([^/]+)$/.exec(pathname);
  if (checklistGroupMatch) {
    const id = decodeURIComponent(checklistGroupMatch[1]);
    if (method === 'PATCH') return handleUpdateChecklistGroup(request, env, id);
    if (method === 'DELETE') return handleDeleteChecklistGroup(env, id);
  }

  const checklistItemMatch = /^\/api\/checklist\/items\/([^/]+)$/.exec(pathname);
  if (checklistItemMatch) {
    const id = decodeURIComponent(checklistItemMatch[1]);
    if (method === 'PATCH') return handleUpdateChecklistItem(request, env, id);
    if (method === 'DELETE') return handleDeleteChecklistItem(env, id);
  }

  const categoryMatch = /^\/api\/categories\/([^/]+)$/.exec(pathname);
  if (categoryMatch) {
    const id = decodeURIComponent(categoryMatch[1]);
    if (method === 'PATCH') return handleUpdateCategory(request, env, id);
    if (method === 'DELETE') return handleDeleteCategory(env, id);
  }

  const itemMatch = /^\/api\/items\/([^/]+)$/.exec(pathname);
  if (itemMatch) {
    const id = decodeURIComponent(itemMatch[1]);
    if (method === 'PATCH') return handleUpdateItem(request, env, id);
    if (method === 'DELETE') return handleDeleteItem(env, id);
  }

  const dayNoteMatch = /^\/api\/day-notes\/([^/]+)$/.exec(pathname);
  if (dayNoteMatch) {
    const key = decodeURIComponent(dayNoteMatch[1]);
    if (method === 'PUT') return handlePutDayNote(request, env, key);
    if (method === 'DELETE') return handleDeleteDayNote(env, key);
  }

  const stopNoteMatch = /^\/api\/stop-notes\/([^/]+)$/.exec(pathname);
  if (stopNoteMatch) {
    const key = decodeURIComponent(stopNoteMatch[1]);
    if (method === 'PUT') return handlePutStopNote(request, env, key);
    if (method === 'DELETE') return handleDeleteStopNote(env, key);
  }

  const dayTextMatch = /^\/api\/day-texts\/([^/]+)$/.exec(pathname);
  if (dayTextMatch) {
    const key = decodeURIComponent(dayTextMatch[1]);
    if (method === 'PUT') return handlePutDayText(request, env, key);
    if (method === 'DELETE') return handleDeleteDayText(env, key);
  }

  const guideTagMatch = /^\/api\/guide-tags\/([^/]+)$/.exec(pathname);
  if (guideTagMatch) {
    const key = decodeURIComponent(guideTagMatch[1]);
    if (method === 'PUT') return handlePutGuideTag(request, env, key);
    if (method === 'DELETE') return handleDeleteGuideTag(env, key);
  }

  throw new HttpError(400, { error: 'bad_route' });
}

export default {
  async fetch(request, env) {
    let response;
    try {
      response = await route(request, env, new URL(request.url));
    } catch (err) {
      response = errorResponse(err);
    }
    return withCors(response, request);
  },
};
