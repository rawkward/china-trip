// Правила правки любого текста в карточке дня. Общие для Worker и тестов.

export const DAY_TEXTS_MAX_FIELDS = 40;
export const DAY_TEXT_MAX_LEN = 1200;
export const DAY_TEXT_TIME_MAX_LEN = 40;
export const DAY_TEXTS_MAX_BODY = 16000;

// Добавленные остановки: компактный JSON-массив, не больше 8 штук.
export const ADDED_STOPS_MAX = 8;
export const ADDED_STOPS_MAX_LEN = 4000;
export const ADDED_STOP_NAME_MAX_LEN = 160;
export const ADDED_STOP_COST_MAX_LEN = 40;
export const ADDED_STOP_DESC_MAX_LEN = 300;
export const ADDED_STOP_GUIDE_MAX_LEN = 40;
const ADDED_STOP_TAGS = ['sight', 'food', 'transport', 'hotel', 'shopping', 'spa', 'festival', 'optional'];
const ADDED_STOP_SLUG_RE = /^[a-z0-9]{4,10}$/;

// Ключ дня: «<id варианта>|<ДД.ММ>», например hk-first|07.12.
const DAY_KEY_RE = /^[a-z0-9][a-z0-9_-]{0,39}\|\d{2}\.\d{2}$/;

// Список slug-ов через запятую, до 40 штук: порядок остановок и скрытые из дня.
const SLUGS_RE = /^[a-z0-9]{4,10}(,[a-z0-9]{4,10}){0,39}$/;

// Замена остановки карточкой справочника: kind|city|id.
const REF_RE = /^(stay|food|sight|tip)\|[a-z0-9_-]{1,20}\|[a-z0-9][a-z0-9_-]{0,39}$/;

// Поля: title, sub, add, order, hide, missed, stop:<slug>:(name|cost|time),
// picks:<slug>:(title|note|cost|time), pick:<slug>:<i>:(name|cost|dim), ref:<slug>.
const SLUG = '[a-z0-9]{4,10}';
const FIELD_RE = new RegExp(
  '^(title|sub|add|order|hide|missed|stop:' + SLUG + ':(name|cost|time)|picks:' + SLUG + ':(title|note|cost|time)' +
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

function badAddedStop(message) {
  return new DayTextError('bad_value', 'add', message);
}

function optionalAddedText(item, key, maxLength, message) {
  const value = item[key];
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') throw badAddedStop(message);
  const text = value.trim();
  if (text.length > maxLength) throw badAddedStop(message);
  return text;
}

function normalizeAddedStop(item) {
  if (item === null || typeof item !== 'object' || Array.isArray(item)) {
    throw badAddedStop('каждая добавленная остановка должна быть объектом');
  }
  const slug = typeof item.s === 'string' ? item.s.trim() : '';
  if (!ADDED_STOP_SLUG_RE.test(slug)) {
    throw badAddedStop('у добавленной остановки битый slug');
  }
  const name = typeof item.n === 'string' ? item.n.trim() : '';
  if (name.length === 0 || name.length > ADDED_STOP_NAME_MAX_LEN) {
    throw badAddedStop(`название добавленной остановки — от 1 до ${ADDED_STOP_NAME_MAX_LEN} символов`);
  }
  const stop = { s: slug, n: name };
  if (item.t !== undefined && item.t !== null) {
    if (typeof item.t !== 'string') {
      throw badAddedStop('неизвестный тег добавленной остановки');
    }
    const tag = item.t.trim();
    if (tag) {
      if (ADDED_STOP_TAGS.indexOf(tag) === -1) {
        throw badAddedStop('неизвестный тег добавленной остановки');
      }
      stop.t = tag;
    }
  }
  const cost = optionalAddedText(item, 'c', ADDED_STOP_COST_MAX_LEN, 'цена добавленной остановки слишком длинная');
  if (cost) stop.c = cost;
  const description = optionalAddedText(
    item,
    'd',
    ADDED_STOP_DESC_MAX_LEN,
    `описание добавленной остановки длиннее ${ADDED_STOP_DESC_MAX_LEN} символов`,
  );
  if (description) stop.d = description;
  const guide = optionalAddedText(
    item,
    'g',
    ADDED_STOP_GUIDE_MAX_LEN,
    `id карточки справочника длиннее ${ADDED_STOP_GUIDE_MAX_LEN} символов`,
  );
  if (guide) stop.g = guide;
  return stop;
}

/** Разбирает и нормализует поле `add`: компактный JSON-массив добавленных остановок. */
export function normalizeAddedStops(value) {
  let list;
  try {
    list = JSON.parse(value);
  } catch {
    throw badAddedStop('добавленные остановки — это JSON-массив');
  }
  if (!Array.isArray(list)) {
    throw badAddedStop('добавленные остановки — это JSON-массив');
  }
  if (list.length > ADDED_STOPS_MAX) {
    throw badAddedStop(`добавленных остановок не больше ${ADDED_STOPS_MAX}`);
  }
  if (list.length === 0) return '';
  const packed = JSON.stringify(list.map((item) => normalizeAddedStop(item)));
  if (packed.length > ADDED_STOPS_MAX_LEN) {
    throw new DayTextError(
      'body_too_long',
      'add',
      `добавленные остановки длиннее ${ADDED_STOPS_MAX_LEN} символов`,
    );
  }
  return packed;
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
    let normalized = text;
    if (field === 'add') {
      normalized = normalizeAddedStops(text);
      if (normalized.length === 0) continue; // пустой массив — тоже сброс поля
    } else {
      if ((field === 'order' || field === 'hide' || field === 'missed') && !SLUGS_RE.test(text)) {
        const message = field === 'hide'
          ? 'скрытые — это slug-и через запятую'
          : field === 'missed'
            ? 'перенесённые — это slug-и через запятую'
            : 'порядок — это slug-и через запятую';
        throw new DayTextError('bad_value', field, message);
      }
      if (field.startsWith('ref:') && !REF_RE.test(text)) {
        throw new DayTextError('bad_value', field, 'замена — это id карточки «вид|город|id»');
      }
      const maxLength = field.endsWith(':time') ? DAY_TEXT_TIME_MAX_LEN : DAY_TEXT_MAX_LEN;
      if (text.length > maxLength) {
        throw new DayTextError('body_too_long', field, `поле длиннее ${maxLength} символов`);
      }
    }
    texts[field] = normalized;
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
