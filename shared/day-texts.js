// Правила правки любого текста в карточке дня. Общие для Worker и тестов.

export const DAY_TEXTS_MAX_FIELDS = 40;
export const DAY_TEXT_MAX_LEN = 1200;
export const DAY_TEXTS_MAX_BODY = 16000;

// Ключ дня: «<id варианта>|<ДД.ММ>», например hk-first|07.12.
const DAY_KEY_RE = /^[a-z0-9][a-z0-9_-]{0,39}\|\d{2}\.\d{2}$/;

// Поля: title, sub, stop:<slug>:(name|cost), picks:<slug>:(title|note|cost),
// pick:<slug>:<i>:(name|cost|dim).
const FIELD_RE =
  /^(title|sub|stop:[a-z0-9]{4,10}:(name|cost)|picks:[a-z0-9]{4,10}:(title|note|cost)|pick:[a-z0-9]{4,10}:\d{1,2}:(name|cost|dim))$/;

export class DayTextError extends Error {
  constructor(code, field, message) {
    super(message);
    this.name = 'DayTextError';
    this.code = code;
    this.field = field;
  }
}

export function isDayTextKey(value) {
  return typeof value === 'string' && DAY_KEY_RE.test(value);
}

export function normalizeDayTextKey(value) {
  const key = String(value === undefined || value === null ? '' : value).trim();
  if (!isDayTextKey(key)) {
    throw new DayTextError('bad_key', 'day_key', 'день должен быть вида «вариант|ДД.ММ»');
  }
  return key;
}

export function splitDayKey(key) {
  const [variant_id, day_date] = normalizeDayTextKey(key).split('|');
  return { variant_id, day_date };
}

export function normalizeDayTexts(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new DayTextError('bad_body', 'texts', 'тексты должны быть объектом');
  }
  const texts = {};
  let count = 0;
  for (const field of Object.keys(value)) {
    if (!FIELD_RE.test(field)) {
      throw new DayTextError('bad_field', field, `неизвестное поле «${field}»`);
    }
    const raw = value[field];
    if (typeof raw !== 'string') {
      throw new DayTextError('bad_body', field, 'значение поля должно быть строкой');
    }
    const text = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
    if (text.length === 0) continue; // пустая строка — это сброс поля
    if (text.length > DAY_TEXT_MAX_LEN) {
      throw new DayTextError('body_too_long', field, `поле длиннее ${DAY_TEXT_MAX_LEN} символов`);
    }
    texts[field] = text;
    count += 1;
    if (count > DAY_TEXTS_MAX_FIELDS) {
      throw new DayTextError('body_too_long', 'texts', `полей больше ${DAY_TEXTS_MAX_FIELDS}`);
    }
  }
  if (JSON.stringify(texts).length > DAY_TEXTS_MAX_BODY) {
    throw new DayTextError('body_too_long', 'texts', `тексты длиннее ${DAY_TEXTS_MAX_BODY} символов`);
  }
  return texts;
}
