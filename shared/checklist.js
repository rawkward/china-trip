// Чек-лист поездки: группы и пункты. Общие правила для Worker и тестов.
// Текст пункта — HTML-строка (как и раньше), поэтому чистим только пробелы и пустые строки.

export const CHECKLIST_LIMITS = Object.freeze({
  cap: 120,
  text: 2000,
  groups: 40,
  itemsPerGroup: 200,
});

export class ChecklistError extends Error {
  constructor(code, field, message) {
    super(message);
    this.name = 'ChecklistError';
    this.code = code;
    this.field = field;
  }
}

export function normalizeChecklistCap(value) {
  const cap = String(value === undefined || value === null ? '' : value)
    .replace(/\s+/g, ' ')
    .trim();
  if (!cap) {
    throw new ChecklistError('empty_cap', 'cap', 'название группы не может быть пустым');
  }
  if (cap.length > CHECKLIST_LIMITS.cap) {
    throw new ChecklistError(
      'cap_too_long',
      'cap',
      `название группы — не длиннее ${CHECKLIST_LIMITS.cap} символов`,
    );
  }
  return cap;
}

export function normalizeChecklistText(value) {
  const text = String(value === undefined || value === null ? '' : value)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (!text) {
    throw new ChecklistError('empty_text', 'text', 'текст пункта не может быть пустым');
  }
  if (text.length > CHECKLIST_LIMITS.text) {
    throw new ChecklistError(
      'text_too_long',
      'text',
      `текст пункта — не длиннее ${CHECKLIST_LIMITS.text} символов`,
    );
  }
  return text;
}

/** id группы или пункта: «grp_<uuid>» / «itm_<uuid>». */
export function newChecklistId(prefix = 'chk') {
  const safe = String(prefix === undefined || prefix === null ? '' : prefix)
    .replace(/[^a-z0-9_-]/gi, '')
    .slice(0, 16) || 'chk';
  const uuid =
    typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${safe}_${uuid}`;
}
