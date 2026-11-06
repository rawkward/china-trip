// Тег карточки справочника: «рекомендация», «выбор» или «альтернатива».
// Общие правила для Worker и тестов.

export const GUIDE_TAGS = ['rec', 'alt', 'choice'];

// Ключ тега: «<kind>|<city>|<id>», например food|hk|mak-man-kee.
const TAG_KEY_RE = /^[a-z]{3,6}\|[a-z0-9_-]{1,20}\|[a-z0-9][a-z0-9_-]{0,39}$/;

export class GuideTagError extends Error {
  constructor(code, field, message) {
    super(message);
    this.name = 'GuideTagError';
    this.code = code;
    this.field = field;
  }
}

export function isGuideTagKey(value) {
  return typeof value === 'string' && TAG_KEY_RE.test(value);
}

export function normalizeGuideTagKey(value) {
  const key = String(value === undefined || value === null ? '' : value).trim();
  if (!isGuideTagKey(key)) {
    throw new GuideTagError('bad_key', 'tag_key', 'ключ тега должен быть вида «вид|город|id»');
  }
  return key;
}

export function splitGuideTagKey(key) {
  const [kind, city, guide_id] = normalizeGuideTagKey(key).split('|');
  return { kind, city, guide_id };
}

export function normalizeGuideTag(value) {
  const tag = String(value === undefined || value === null ? '' : value).trim();
  if (!GUIDE_TAGS.includes(tag)) {
    throw new GuideTagError('bad_tag', 'tag', 'тег должен быть rec, alt или choice');
  }
  return tag;
}
