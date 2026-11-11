// Типы данных поездки. Источники: src/data/itinerary.js, guide.js, places.js.
// Данные — статические JS-объекты (огромные), поэтому типы объявлены здесь,
// а не выводятся из файлов: на границе один каст.

export interface City {
  label: string;
  color: string;
}

export type Cities = Record<string, City>;

/** Тег остановки — ключ иконки и фильтра карты. */
export type DayTag =
  | "sight"
  | "food"
  | "transport"
  | "hotel"
  | "shopping"
  | "spa"
  | "festival"
  | "optional";

/** Вариант внутри карусели одного слота (обед, отель, смотровая). */
export interface Pick {
  name: string;
  note?: string;
  cost?: string;
  rec?: boolean;
  dim?: string;
  /** ссылка на страницу бронирования (Trip.com) */
  url?: string;
  /** снимок исходного имени: правка текста адресуется по нему */
  _name?: string;
}

/** Сворачиваемая картинка-карта под остановкой (кнопка «Карта маршрута»). */
export interface StopMap {
  src: string;
  caption?: string;
}

/** Остановка дня. Либо обычная (`name`), либо группа вариантов (`picks`). */
export interface Stop {
  k: string;
  name?: string;
  title?: string;
  tag?: DayTag;
  note?: string;
  cost?: string;
  picks?: Pick[];
  /** как показывать варианты: карусель по одному (по умолчанию), списком или только забронированный */
  layout?: "carousel" | "list" | "booked";
  /** одна внешняя ссылка под группой вариантов (расписание, билеты) */
  url?: string;
  /** сворачиваемая карта под текстом остановки */
  map?: StopMap;
  // --- производные поля, которые добавляет слой правок (lib/texts.ts) ---
  _name?: string;
  _title?: string;
  _slug?: string;
  _time?: string;
}

/** Блок дня в данных (без номера и даты). */
export interface DayBlock {
  city: string;
  title: string;
  sub: string;
  places: Stop[];
}

/** День маршрута: блок + номер и дата из оси варианта. */
export interface Day extends DayBlock {
  n: number;
  date: string;
  /** исходный заголовок/подзаголовок до правок — для сброса */
  _title?: string;
  _sub?: string;
  /** остановки, скрытые из дня правкой `hide` (в справочнике остаются) */
  _hidden?: Stop[];
}

export interface Variant {
  id: string;
  title: string;
  photo: string;
  main?: boolean;
  dates?: string[];
  china: DayBlock[];
  hk: DayBlock[];
  cities: string[];
  summary: string;
  pros: string[];
  cons: string[];
  budget: string;
}

export interface Itinerary {
  CITIES: Cities;
  DATES: string[];
  VARIANTS: Variant[];
  HK_DEPART?: DayBlock;
}

export type GuideKind = "stay" | "food" | "sight" | "tip";

export interface GuideKindMeta {
  label: string;
  eyebrow: string;
  title: string;
}

export interface GuideItem {
  kind: GuideKind;
  city: string;
  id: string;
  en: string;
  zh?: string;
  addr?: string;
  site?: string;
  hours?: string;
  note?: string;
  maps?: string;
  /** подстроки названий остановок: по ним в дне появляется ссылка «в справочнике» */
  match?: string[];
  rec?: boolean;
  badge?: string;
  /** парк: карточка попадает и в «Места», и в отдельный раздел «Парки» */
  park?: true;
}

export interface Guide {
  cityOrder: string[];
  kinds: Record<GuideKind, GuideKindMeta> & Record<string, GuideKindMeta>;
  items: GuideItem[];
}

export interface Place {
  name: string;
  lat: number;
  lon: number;
}

export type Places = Record<string, Place>;

export interface Photo {
  src: string;
  page: string;
  description: string;
}

export type Photos = Record<string, Photo>;

/* ---------- контент разделов ---------- */

export interface BookingRow {
  when: string;
  it: string;
  url?: string;
}

export interface TourRow {
  tag: string;
  title: string;
  meta: string;
  price: string;
  url: string;
  note: string;
  verdict: string;
  fit: string;
}

export interface LinkRow {
  tag: string;
  title: string;
  src: string;
  url: string;
  note: string;
  take: string;
  gap: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  sort: number;
}

export interface ChecklistGroup {
  id: string;
  cap: string;
  sort: number;
  items: ChecklistItem[];
}

/* ---------- слой правок в D1 ---------- */

/** Значение тега карточки справочника: рекомендация / выбор / альтернатива. */
export type GuideTagValue = "rec" | "choice" | "alt";

export interface DayNote {
  day_key: string;
  body: string;
  updated_at: number;
}

export interface StopNote {
  stop_key: string;
  body: string;
  updated_at: number;
}

/** Правки любого текста в карточке дня: ключ поля → значение. */
export type DayTextsMap = Record<string, string>;

export interface DayTextRecord {
  day_key: string;
  texts: DayTextsMap;
  updated_at: number;
}

export interface GuideTagRecord {
  tag_key: string;
  tag: GuideTagValue;
}

export interface AuthToken {
  token: string;
  expiresAt: number;
}
