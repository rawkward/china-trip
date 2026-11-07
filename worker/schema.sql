CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  sort       INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS items (
  id            TEXT PRIMARY KEY,
  category_id   TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  qty           REAL,
  qty_formula   TEXT,
  unit_price    REAL,
  price_formula TEXT,
  currency      TEXT NOT NULL CHECK (currency IN ('RUB','CNY','HKD')),
  note          TEXT NOT NULL DEFAULT '',
  sort          INTEGER NOT NULL,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS items_category_idx ON items(category_id, sort);

CREATE TABLE IF NOT EXISTS login_attempts (
  ip TEXT NOT NULL,
  ts INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS login_attempts_idx ON login_attempts(ip, ts);

CREATE TABLE IF NOT EXISTS day_notes (
  day_key    TEXT PRIMARY KEY,
  variant_id TEXT NOT NULL,
  day_date   TEXT NOT NULL,
  body       TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS day_notes_variant_idx ON day_notes(variant_id);

CREATE TABLE IF NOT EXISTS stop_notes (
  stop_key   TEXT PRIMARY KEY,
  variant_id TEXT NOT NULL,
  day_date   TEXT NOT NULL,
  stop_slug  TEXT NOT NULL,
  stop_name  TEXT NOT NULL DEFAULT '',
  body       TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS stop_notes_variant_idx ON stop_notes(variant_id, day_date);

CREATE TABLE IF NOT EXISTS day_texts (
  day_key    TEXT PRIMARY KEY,
  variant_id TEXT NOT NULL,
  day_date   TEXT NOT NULL,
  body       TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS day_texts_variant_idx ON day_texts(variant_id);

CREATE TABLE IF NOT EXISTS guide_tags (
  tag_key    TEXT PRIMARY KEY,
  kind       TEXT NOT NULL,
  city       TEXT NOT NULL,
  guide_id   TEXT NOT NULL,
  tag        TEXT NOT NULL CHECK (tag IN ('rec','alt','choice')),
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS guide_tags_kind_idx ON guide_tags(kind, city);

CREATE TABLE IF NOT EXISTS checklist_groups (
  id         TEXT PRIMARY KEY,
  cap        TEXT NOT NULL,
  sort       INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS checklist_items (
  id         TEXT PRIMARY KEY,
  group_id   TEXT NOT NULL,
  text       TEXT NOT NULL,
  sort       INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS checklist_items_group_idx ON checklist_items(group_id, sort);
