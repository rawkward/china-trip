// Правила заметок к дням маршрута. Общие для Worker и тестов.

export const DAY_NOTE_MAX_BODY = 2000;

// Ключ дня: «<id варианта>|<ДД.ММ>», например hk-first|07.12.
const DAY_KEY_RE = /^[a-z0-9][a-z0-9_-]{0,39}\|\d{2}\.\d{2}$/i;

export class DayNoteError extends Error {
  constructor(code, field, message) {
    super(message);
    this.name = 'DayNoteError';
    this.code = code;
    this.field = field;
  }
}

export function isDayNoteKey(value) {
  return typeof value === 'string' && DAY_KEY_RE.test(value);
}

export function normalizeDayNoteKey(value) {
  const key = String(value === undefined || value === null ? '' : value).trim();
  if (!isDayNoteKey(key)) {
    throw new DayNoteError('bad_key', 'day_key', 'день должен быть вида «вариант|ДД.ММ»');
  }
  return key;
}

export function splitDayKey(key) {
  const [variant_id, day_date] = normalizeDayNoteKey(key).split('|');
  return { variant_id, day_date };
}

export function normalizeDayNoteBody(value) {
  if (typeof value !== 'string') {
    throw new DayNoteError('bad_body', 'body', 'заметка должна быть текстом');
  }
  const body = value.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  if (body.length === 0) {
    throw new DayNoteError('empty_body', 'body', 'заметка пустая');
  }
  if (body.length > DAY_NOTE_MAX_BODY) {
    throw new DayNoteError('body_too_long', 'body', `заметка длиннее ${DAY_NOTE_MAX_BODY} символов`);
  }
  return body;
}
