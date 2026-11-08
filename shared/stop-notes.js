// Правила правки текста к остановкам маршрута. Общие для Worker и тестов.

export const STOP_NOTE_MAX_BODY = 1200;

// Ключ остановки: «<id варианта>|<ДД.ММ>|<slug остановки>», например hk-first|15.12|k3f9qa.
const STOP_KEY_RE = /^[a-z0-9][a-z0-9_-]{0,39}\|\d{2}\.\d{2}\|[a-z0-9]{4,10}$/i;

export class StopNoteError extends Error {
  constructor(code, field, message) {
    super(message);
    this.name = 'StopNoteError';
    this.code = code;
    this.field = field;
  }
}

export function isStopNoteKey(value) {
  return typeof value === 'string' && STOP_KEY_RE.test(value);
}

export function normalizeStopNoteKey(value) {
  const key = String(value === undefined || value === null ? '' : value).trim();
  if (!isStopNoteKey(key)) {
    throw new StopNoteError('bad_key', 'stop_key', 'ключ остановки должен быть вида «вариант|ДД.ММ|slug»');
  }
  return key;
}

export function splitStopKey(key) {
  const [variant_id, day_date, stop_slug] = normalizeStopNoteKey(key).split('|');
  return { variant_id, day_date, stop_slug };
}

export function normalizeStopNoteBody(value) {
  if (typeof value !== 'string') {
    throw new StopNoteError('bad_body', 'body', 'текст должен быть строкой');
  }
  const body = value.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  if (body.length > STOP_NOTE_MAX_BODY) {
    throw new StopNoteError('body_too_long', 'body', `текст длиннее ${STOP_NOTE_MAX_BODY} символов`);
  }
  return body;
}
