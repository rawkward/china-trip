import { DEFAULT_PARAMS } from '../../shared/budget-core.js';

const PARAMS_KEY = 'params';
const ITEM_COLUMNS =
  'id, category_id, name, qty, qty_formula, unit_price, price_formula, currency, note, sort, created_at, updated_at';
const CATEGORY_COLUMNS = 'id, name, sort, created_at, updated_at';

export function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

// -- settings ---------------------------------------------------------------

export async function readParams(db) {
  const row = await db
    .prepare('SELECT value, updated_at FROM settings WHERE key = ?')
    .bind(PARAMS_KEY)
    .first();
  if (!row) return { params: { ...DEFAULT_PARAMS }, updated_at: null };
  return { params: { ...DEFAULT_PARAMS, ...JSON.parse(row.value) }, updated_at: row.updated_at };
}

export async function writeParams(db, params, updatedAt) {
  await db
    .prepare(
      `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    )
    .bind(PARAMS_KEY, JSON.stringify(params), updatedAt)
    .run();
}

// -- categories -------------------------------------------------------------

export async function listCategories(db) {
  const { results } = await db
    .prepare(`SELECT ${CATEGORY_COLUMNS} FROM categories ORDER BY sort, id`)
    .all();
  return results ?? [];
}

export async function getCategory(db, id) {
  return db.prepare(`SELECT ${CATEGORY_COLUMNS} FROM categories WHERE id = ?`).bind(id).first();
}

export async function createCategory(db, { id, name }) {
  const ts = nowSeconds();
  const row = await db
    .prepare('SELECT COALESCE(MAX(sort), -1) + 1 AS next_sort FROM categories')
    .first();
  const sort = row && row.next_sort != null ? row.next_sort : 0;
  await db
    .prepare('INSERT INTO categories (id, name, sort, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
    .bind(id, name, sort, ts, ts)
    .run();
  return { id, name, sort, created_at: ts, updated_at: ts };
}

export async function updateCategory(db, id, fields) {
  const current = await getCategory(db, id);
  if (!current) return null;

  const sets = [];
  const values = [];

  if (fields.name !== undefined) {
    sets.push('name = ?');
    values.push(fields.name);
  }
  if (fields.sort !== undefined) {
    const row = await db.prepare('SELECT COALESCE(MAX(sort), 0) AS max_sort FROM categories').first();
    const maxSort = row && row.max_sort != null ? row.max_sort : 0;
    const clamped = Math.max(0, Math.min(fields.sort, maxSort));
    sets.push('sort = ?');
    values.push(clamped);
  }

  const ts = nowSeconds();
  sets.push('updated_at = ?');
  values.push(ts);
  values.push(id);

  await db.prepare(`UPDATE categories SET ${sets.join(', ')} WHERE id = ?`).bind(...values).run();
  return getCategory(db, id);
}

export async function deleteCategory(db, id) {
  const current = await getCategory(db, id);
  if (!current) return null;
  const countRow = await db
    .prepare('SELECT COUNT(*) AS n FROM items WHERE category_id = ?')
    .bind(id)
    .first();
  const itemsDeleted = countRow && countRow.n != null ? countRow.n : 0;
  await db.prepare('DELETE FROM items WHERE category_id = ?').bind(id).run();
  await db.prepare('DELETE FROM categories WHERE id = ?').bind(id).run();
  return { items_deleted: itemsDeleted };
}

// -- items ------------------------------------------------------------------

export async function listItems(db) {
  const { results } = await db.prepare(`SELECT ${ITEM_COLUMNS} FROM items ORDER BY sort, id`).all();
  return results ?? [];
}

export async function getItem(db, id) {
  return db.prepare(`SELECT ${ITEM_COLUMNS} FROM items WHERE id = ?`).bind(id).first();
}

export async function createItem(db, item) {
  const ts = nowSeconds();
  const row = await db
    .prepare('SELECT COALESCE(MAX(sort), -1) + 1 AS next_sort FROM items WHERE category_id = ?')
    .bind(item.category_id)
    .first();
  const sort = row && row.next_sort != null ? row.next_sort : 0;
  await db
    .prepare(
      `INSERT INTO items (id, category_id, name, qty, qty_formula, unit_price, price_formula, currency, note, sort, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      item.id,
      item.category_id,
      item.name,
      item.qty,
      item.qty_formula,
      item.unit_price,
      item.price_formula,
      item.currency,
      item.note,
      sort,
      ts,
      ts,
    )
    .run();
  return getItem(db, item.id);
}

export async function updateItem(db, id, item, requestedSort) {
  const current = await getItem(db, id);
  if (!current) return null;

  let sort = current.sort;
  if (requestedSort !== undefined) {
    const row = await db
      .prepare('SELECT COALESCE(MAX(sort), 0) AS max_sort FROM items WHERE category_id = ?')
      .bind(item.category_id)
      .first();
    const maxSort = row && row.max_sort != null ? row.max_sort : 0;
    sort = Math.max(0, Math.min(requestedSort, maxSort));
  } else if (item.category_id !== current.category_id) {
    const row = await db
      .prepare('SELECT COALESCE(MAX(sort), -1) + 1 AS next_sort FROM items WHERE category_id = ?')
      .bind(item.category_id)
      .first();
    sort = row && row.next_sort != null ? row.next_sort : 0;
  }

  const ts = nowSeconds();
  await db
    .prepare(
      `UPDATE items
       SET category_id = ?, name = ?, qty = ?, qty_formula = ?, unit_price = ?, price_formula = ?, currency = ?, note = ?, sort = ?, updated_at = ?
       WHERE id = ?`,
    )
    .bind(
      item.category_id,
      item.name,
      item.qty,
      item.qty_formula,
      item.unit_price,
      item.price_formula,
      item.currency,
      item.note,
      sort,
      ts,
      id,
    )
    .run();
  return getItem(db, id);
}

export async function deleteItem(db, id) {
  const current = await getItem(db, id);
  if (!current) return false;
  await db.prepare('DELETE FROM items WHERE id = ?').bind(id).run();
  return true;
}

// -- заметки к дням ---------------------------------------------------------

const DAY_NOTE_COLUMNS = 'day_key, variant_id, day_date, body, updated_at';

export async function listDayNotes(db) {
  const { results } = await db
    .prepare(`SELECT ${DAY_NOTE_COLUMNS} FROM day_notes ORDER BY day_key`)
    .all();
  return results ?? [];
}

export async function getDayNote(db, key) {
  return db.prepare(`SELECT ${DAY_NOTE_COLUMNS} FROM day_notes WHERE day_key = ?`).bind(key).first();
}

export async function upsertDayNote(db, note) {
  const ts = nowSeconds();
  await db
    .prepare(
      `INSERT INTO day_notes (day_key, variant_id, day_date, body, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(day_key) DO UPDATE SET
         variant_id = excluded.variant_id,
         day_date = excluded.day_date,
         body = excluded.body,
         updated_at = excluded.updated_at`,
    )
    .bind(note.day_key, note.variant_id, note.day_date, note.body, ts)
    .run();
  return getDayNote(db, note.day_key);
}

export async function deleteDayNote(db, key) {
  const existing = await getDayNote(db, key);
  if (!existing) return false;
  await db.prepare('DELETE FROM day_notes WHERE day_key = ?').bind(key).run();
  return true;
}

// -- правка текста к остановкам ---------------------------------------------

const STOP_NOTE_COLUMNS = 'stop_key, variant_id, day_date, stop_slug, stop_name, body, updated_at';

export async function listStopNotes(db) {
  const { results } = await db
    .prepare(`SELECT ${STOP_NOTE_COLUMNS} FROM stop_notes ORDER BY stop_key`)
    .all();
  return results ?? [];
}

export async function getStopNote(db, key) {
  return db.prepare(`SELECT ${STOP_NOTE_COLUMNS} FROM stop_notes WHERE stop_key = ?`).bind(key).first();
}

export async function upsertStopNote(db, note) {
  const ts = nowSeconds();
  await db
    .prepare(
      `INSERT INTO stop_notes (stop_key, variant_id, day_date, stop_slug, stop_name, body, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(stop_key) DO UPDATE SET
         variant_id = excluded.variant_id,
         day_date = excluded.day_date,
         stop_slug = excluded.stop_slug,
         stop_name = excluded.stop_name,
         body = excluded.body,
         updated_at = excluded.updated_at`,
    )
    .bind(note.stop_key, note.variant_id, note.day_date, note.stop_slug, note.stop_name || '', note.body, ts)
    .run();
  return getStopNote(db, note.stop_key);
}

export async function deleteStopNote(db, key) {
  const existing = await getStopNote(db, key);
  if (!existing) return false;
  await db.prepare('DELETE FROM stop_notes WHERE stop_key = ?').bind(key).run();
  return true;
}

// -- правка любого текста в карточке дня ------------------------------------

const DAY_TEXT_COLUMNS = 'day_key, variant_id, day_date, body, updated_at';

export async function listDayTexts(db) {
  const { results } = await db
    .prepare(`SELECT ${DAY_TEXT_COLUMNS} FROM day_texts ORDER BY day_key`)
    .all();
  return results ?? [];
}

export async function getDayText(db, key) {
  return db.prepare(`SELECT ${DAY_TEXT_COLUMNS} FROM day_texts WHERE day_key = ?`).bind(key).first();
}

export async function upsertDayText(db, note) {
  const ts = nowSeconds();
  await db
    .prepare(
      `INSERT INTO day_texts (day_key, variant_id, day_date, body, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(day_key) DO UPDATE SET
         variant_id = excluded.variant_id,
         day_date = excluded.day_date,
         body = excluded.body,
         updated_at = excluded.updated_at`,
    )
    .bind(note.day_key, note.variant_id, note.day_date, note.body, ts)
    .run();
  return getDayText(db, note.day_key);
}

export async function deleteDayText(db, key) {
  const existing = await getDayText(db, key);
  if (!existing) return false;
  await db.prepare('DELETE FROM day_texts WHERE day_key = ?').bind(key).run();
  return true;
}

// -- теги карточек справочника ----------------------------------------------

const GUIDE_TAG_COLUMNS = 'tag_key, kind, city, guide_id, tag, updated_at';

export async function listGuideTags(db) {
  const { results } = await db
    .prepare(`SELECT ${GUIDE_TAG_COLUMNS} FROM guide_tags ORDER BY kind, city, tag_key`)
    .all();
  return results ?? [];
}

export async function getGuideTag(db, key) {
  return db.prepare(`SELECT ${GUIDE_TAG_COLUMNS} FROM guide_tags WHERE tag_key = ?`).bind(key).first();
}

export async function upsertGuideTag(db, row) {
  const ts = nowSeconds();
  await db
    .prepare(
      `INSERT INTO guide_tags (tag_key, kind, city, guide_id, tag, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(tag_key) DO UPDATE SET
         kind = excluded.kind,
         city = excluded.city,
         guide_id = excluded.guide_id,
         tag = excluded.tag,
         updated_at = excluded.updated_at`,
    )
    .bind(row.tag_key, row.kind, row.city, row.guide_id, row.tag, ts)
    .run();
  return getGuideTag(db, row.tag_key);
}

export async function deleteGuideTag(db, key) {
  const existing = await getGuideTag(db, key);
  if (!existing) return false;
  await db.prepare('DELETE FROM guide_tags WHERE tag_key = ?').bind(key).run();
  return true;
}

// -- чек-лист ---------------------------------------------------------------

const CHECKLIST_GROUP_COLUMNS = 'id, cap, sort, updated_at';
const CHECKLIST_ITEM_COLUMNS = 'id, group_id, text, sort, updated_at';

export async function listChecklistGroups(db) {
  const { results } = await db
    .prepare(`SELECT ${CHECKLIST_GROUP_COLUMNS} FROM checklist_groups ORDER BY sort, id`)
    .all();
  return results ?? [];
}

export async function listChecklistItems(db, groupId) {
  if (groupId === undefined || groupId === null) {
    const { results } = await db
      .prepare(`SELECT ${CHECKLIST_ITEM_COLUMNS} FROM checklist_items ORDER BY group_id, sort, id`)
      .all();
    return results ?? [];
  }
  const { results } = await db
    .prepare(`SELECT ${CHECKLIST_ITEM_COLUMNS} FROM checklist_items WHERE group_id = ? ORDER BY sort, id`)
    .bind(groupId)
    .all();
  return results ?? [];
}

export async function getChecklistGroup(db, id) {
  return db
    .prepare(`SELECT ${CHECKLIST_GROUP_COLUMNS} FROM checklist_groups WHERE id = ?`)
    .bind(id)
    .first();
}

export async function getChecklistItem(db, id) {
  return db
    .prepare(`SELECT ${CHECKLIST_ITEM_COLUMNS} FROM checklist_items WHERE id = ?`)
    .bind(id)
    .first();
}

export async function insertChecklistGroup(db, { id, cap }) {
  const ts = nowSeconds();
  const row = await db
    .prepare('SELECT COALESCE(MAX(sort), -1) + 1 AS next_sort FROM checklist_groups')
    .first();
  const sort = row && row.next_sort != null ? row.next_sort : 0;
  await db
    .prepare('INSERT INTO checklist_groups (id, cap, sort, updated_at) VALUES (?, ?, ?, ?)')
    .bind(id, cap, sort, ts)
    .run();
  return { id, cap, sort, updated_at: ts };
}

export async function updateChecklistGroup(db, id, fields) {
  const current = await getChecklistGroup(db, id);
  if (!current) return null;
  const ts = nowSeconds();
  await db
    .prepare('UPDATE checklist_groups SET cap = ?, updated_at = ? WHERE id = ?')
    .bind(fields.cap, ts, id)
    .run();
  return getChecklistGroup(db, id);
}

export async function deleteChecklistGroup(db, id) {
  const current = await getChecklistGroup(db, id);
  if (!current) return null;
  const countRow = await db
    .prepare('SELECT COUNT(*) AS n FROM checklist_items WHERE group_id = ?')
    .bind(id)
    .first();
  const itemsDeleted = countRow && countRow.n != null ? countRow.n : 0;
  await db.prepare('DELETE FROM checklist_items WHERE group_id = ?').bind(id).run();
  await db.prepare('DELETE FROM checklist_groups WHERE id = ?').bind(id).run();
  return { items_deleted: itemsDeleted };
}

export async function insertChecklistItem(db, { id, group_id, text }) {
  const ts = nowSeconds();
  const row = await db
    .prepare('SELECT COALESCE(MAX(sort), -1) + 1 AS next_sort FROM checklist_items WHERE group_id = ?')
    .bind(group_id)
    .first();
  const sort = row && row.next_sort != null ? row.next_sort : 0;
  await db
    .prepare('INSERT INTO checklist_items (id, group_id, text, sort, updated_at) VALUES (?, ?, ?, ?, ?)')
    .bind(id, group_id, text, sort, ts)
    .run();
  return { id, group_id, text, sort, updated_at: ts };
}

export async function updateChecklistItem(db, id, fields) {
  const current = await getChecklistItem(db, id);
  if (!current) return null;
  const ts = nowSeconds();
  await db
    .prepare('UPDATE checklist_items SET text = ?, updated_at = ? WHERE id = ?')
    .bind(fields.text, ts, id)
    .run();
  return getChecklistItem(db, id);
}

export async function deleteChecklistItem(db, id) {
  const current = await getChecklistItem(db, id);
  if (!current) return false;
  await db.prepare('DELETE FROM checklist_items WHERE id = ?').bind(id).run();
  return true;
}

export async function countChecklistGroups(db) {
  const row = await db.prepare('SELECT COUNT(*) AS n FROM checklist_groups').first();
  return row && row.n != null ? row.n : 0;
}

export async function countChecklistItemsInGroup(db, groupId) {
  const row = await db
    .prepare('SELECT COUNT(*) AS n FROM checklist_items WHERE group_id = ?')
    .bind(groupId)
    .first();
  return row && row.n != null ? row.n : 0;
}

// -- login throttle ---------------------------------------------------------

export async function countLoginFailures(db, ip, since) {
  const row = await db
    .prepare('SELECT COUNT(*) AS n FROM login_attempts WHERE ip = ? AND ts >= ?')
    .bind(ip, since)
    .first();
  return row && row.n != null ? row.n : 0;
}

export async function earliestLoginFailure(db, ip, since) {
  const row = await db
    .prepare('SELECT MIN(ts) AS ts FROM login_attempts WHERE ip = ? AND ts >= ?')
    .bind(ip, since)
    .first();
  return row && row.ts != null ? row.ts : null;
}

export async function recordLoginFailure(db, ip, ts) {
  await db.prepare('INSERT INTO login_attempts (ip, ts) VALUES (?, ?)').bind(ip, ts).run();
}

export async function clearLoginFailures(db, ip) {
  await db.prepare('DELETE FROM login_attempts WHERE ip = ?').bind(ip).run();
}

export async function pruneLoginAttempts(db, before) {
  await db.prepare('DELETE FROM login_attempts WHERE ts < ?').bind(before).run();
}
