// Правила правки любого текста в карточке дня. Общие для Worker и тестов.

export const DAY_TEXTS_MAX_FIELDS = 40;
export const DAY_TEXT_MAX_LEN = 1200;
export const DAY_TEXT_TIME_MAX_LEN = 40;
export const DAY_TEXTS_MAX_BODY = 16000;

// Ключ дня: «<id варианта>|<ДД.ММ>», например hk-first|07.12.
const DAY_KEY_RE = /^[a-z0-9][a-z0-9_-]{0,39}\|\d{2}\.\d{2}$/;

// Список slug-ов через запятую, до 40 штук: порядок остановок и скрытые из дня.
const SLUGS_RE = /^[a-z0-9]{4,10}(,[a-z0-9]{4,10}){0,39}$/;

// Замена остановки карточкой справочника: kind|city|id.
const REF_RE = /^(stay|food|sight|tip)\|[a-z0-9_-]{1,20}\|[a-z0-9][a-z0-9_-]{0,39}$/;

// Поля: title, sub, order, hide, stop:<slug>:(name|cost|time),
// picks:<slug>:(title|note|cost|time), pick:<slug>:<i>:(name|cost|dim), ref:<slug>.
const SLUG = '[a-z0-9]{4,10}';
const FIELD_RE = new RegExp(
  '^(title|sub|order|hide|stop:' + SLUG + ':(name|cost|time)|picks:' + SLUG + ':(title|note|cost|time)' +
    '|pick:' + SLUG + ':\\d{1,2}:(name|cost|dim)|ref:' + SLUG + ')$',
);

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
    if ((field === 'order' || field === 'hide') && !SLUGS_RE.test(text)) {
      const message = field === 'hide' ? 'скрытые — это slug-и через запятую' : 'порядок — это slug-и через запятую';
      throw new DayTextError('bad_value', field, message);
    }
    if (field.startsWith('ref:') && !REF_RE.test(text)) {
      throw new DayTextError('bad_value', field, 'замена — это id карточки «вид|город|id»');
    }
    const maxLength = field.endsWith(':time') ? DAY_TEXT_TIME_MAX_LEN : DAY_TEXT_MAX_LEN;
    if (text.length > maxLength) {
      throw new DayTextError('body_too_long', field, `поле длиннее ${maxLength} символов`);
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
