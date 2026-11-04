# Budget section — feature spec

Status: approved for implementation. Owner: Anton. Implementer: OpenCode CLI.
Target: `https://rawkward.github.io/china-trip/` (public GitHub Pages) + a private API
(`Cloudflare Worker` + `D1`) so the budget survives page reloads and devices.

## 1. Goal

Replace the offline workbook `china-trip-budget.xlsx` with a budget section on the trip site:
add expense items, group them into categories, edit, delete, and see live totals in roubles
converted at the current CNY/HKD rate. Everything the two travellers type must be stored
server-side and reappear on the next visit from any device.

Decisions already taken by the owner (do not re-litigate):

- Backend: **Cloudflare Worker + D1** (free plan, no project pausing). Alternative hosts rejected.
- Auth: **one shared password** for both travellers.
- Only the budget data is protected. The rest of the site stays public as it is today.
- Scope of the budget section: everything the workbook has — parameters calculator
  (rates, nights, nightly price, food/day), expense items, category summary.
- FX: fetched from the CBR daily JSON when the page opens, **with an explicit manual override**.
  A silently changed rate is forbidden: the UI shows the fetched rate and a button to apply it.

## 2. Non-goals

- No per-user accounts, roles, or audit trail of who edited what.
- No gating of the rest of the page (route, map, tours, links). The repo is public, so a
  client-side gate there would be theatre.
- No real-time collaboration, no websockets.
- No import/export of the .xlsx file. The workbook is superseded; its numbers are the seed.
- No changes to `assets/itinerary.js`, `assets/data.js`, `assets/place_photos.js`.

## 3. Architecture

```
GitHub Pages (static, public)          Cloudflare Worker (private API)        D1 (SQLite)
index.html + assets/budget.js   ──►    /api/*  Authorization: Bearer <token>  ──►  settings / categories / items
        │                                         ▲
        └── shared/budget-core.js (ES module: money math + formula evaluator + validation)
```

`shared/budget-core.js` is the single source of truth for:
money conversion, formula evaluation, item/category normalisation, validation and totals.
It is imported by the Worker (bundled by wrangler) and by the frontend (`<script type="module">`),
and unit-tested once with `node --test`. Duplicating this logic in two places is not allowed.

Directory layout to create:

```
china-trip/
  package.json                     # {"private":true,"type":"module","scripts":{"test":"node --test tests/"}}
  shared/budget-core.js            # pure logic, no DOM, no fetch, no D1
  worker/
    src/index.js                   # router + handlers
    src/auth.js                    # token sign/verify, password check, throttle
    src/db.js                      # D1 queries
    src/cors.js
    wrangler.toml
    package.json                   # devDependency: wrangler only
    schema.sql                     # tables + indexes
    scripts/seed.mjs               # node script: reads a local JSON, emits seed SQL
    .dev.vars.example
  assets/budget.js                 # UI: state, fetch, render, inline editing (ES module)
  assets/budget-config.js          # window.BUDGET_CONFIG = { API_BASE: "..." }
  tests/                           # node --test, no dependencies
    budget-core.test.js
    budget-api.test.js             # integration against `wrangler dev --local`
```

## 4. Data model (D1)

```sql
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
  qty           REAL,            -- nullable when qty_formula is set
  qty_formula   TEXT,            -- nullable when qty is set
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
```

Rules enforced by the Worker on writes (never trust the client):

- `currency` ∈ RUB, CNY, HKD.
- Exactly one of `qty` / `qty_formula` is set; same for `unit_price` / `price_formula`
  (an item may use a formula for one and a number for the other).
- Formula strings must parse and may only reference identifiers present in `settings.params`
  (see §5). A formula that names an unknown parameter is a 422, not a silent zero.
- `name` 1..120 chars after trim; `note` 0..500; category `name` 1..60.
- `sort` is server-assigned on create (`max(sort)+1` in scope) and clamped on move.
- Deleting a category deletes its items (ON DELETE CASCADE) — the client must confirm first.

`settings` holds a single JSON document under key `params` (value = JSON string), plus
`params_updated_at` is redundant — use the row's `updated_at`. Shape:

```json
{
  "cny_rate": 12.0873,
  "hkd_rate": 10.2660,
  "people": 2,
  "trip_days": 13,
  "reserve_pct": 0.10,
  "cq_nights": 3, "cq_hotel": 450, "cq_food": 200, "cq_transport": 60,
  "zzj_nights": 2, "zzj_hotel": 300, "zzj_food": 150, "zzj_transport": 80,
  "hk_nights": 5, "hk_hotel": 1100, "hk_food": 450, "hk_transport": 30
}
```

All values are finite numbers ≥ 0 (`people`, `trip_days` ≥ 1, `reserve_pct` in 0..1).
Keys valid for user-defined cities: `/^[a-z][a-z0-9_]{0,31}$/`. Adding a fourth city must not
require a code change — the UI derives city blocks from keys matching `^(.+)_(nights|hotel|food|transport)$`
that share the same prefix.

## 5. Formula parameters and evaluation

Identifiers are the keys of `settings.params`. The evaluator supports `+ - * / ( )`, decimal
numbers, unary minus and identifiers; no functions, no exponent operator, no strings.

- Numbers are parsed with `.` as the decimal separator.
- Division by zero → error `DIV_ZERO`, reported as such.
- Unknown identifier → error `UNKNOWN_PARAM` naming the identifier.
- No `eval`, no `new Function`. Hand-written tokenizer + recursive-descent parser,
  max expression length 200 chars, max nesting 20.
- The parsers live in `shared/budget-core.js` and are tested against the strings used by the
  seed data (`people*cq_nights`, `cq_hotel`, …) and a set of hostile inputs
  (`"1;DROP TABLE items"`, `"alert(1)"`, `"1/0"`, `"x"`, `"((((((((((1))))))))))"`).

## 6. Money math (also `shared/budget-core.js`)

```
amountInCurrency = qty × unit_price              (formulas resolved via params first)
amountRub        = amountInCurrency × rate(currency)   // RUB → 1
base             = Σ amountRub over all items
reserve          = round(base × reserve_pct)
total            = base + reserve
perPerson        = total / people
perDay           = total / people / trip_days        // trip_days = 16 in the seed
```

Per-category sums use the same conversion. Rounding is applied only for display and for
`reserve`/`total` (integers in ₽); item amounts keep full precision. Display format: `12 345 ₽`
(non-breaking space as thousands separator, no decimals), `¥450`, `HK$1 100`.

**Acceptance numbers** — with the seed data and seed params the module must produce exactly:

| Metric | Value |
|---|---|
| base | 375 464 ₽ |
| reserve | 37 546 ₽ |
| total | 413 010 ₽ |
| per person | 206 505 ₽ |
| per person per day | 12 907 ₽ |

and per-category base sums: Дорога в Москву и обратно 10 400, Перелёты 86 926,
Ж/д внутри Китая 29 928, Проживание 82 035, Билеты и развлечения 69 733,
Еда 74 908, Транспорт в городе 16 134, Прочее 5 400. Items in the seed: 37.

## 7. HTTP API

Base: `https://<worker>.<subdomain>.workers.dev`. All responses are JSON.
Auth: `Authorization: Bearer <token>`. Anything under `/api/` except `/api/login`
and `/api/health` requires it and answers `401 {"error":"unauthorized"}` otherwise.

| Method | Path | Body | 200 response |
|---|---|---|---|
| GET | `/api/health` | – | `{"ok":true}` |
| POST | `/api/login` | `{"password":"…"}` | `{"token":"v1.<exp>.<sig>","expires_at":<epoch>}` |
| GET | `/api/budget` | – | `{"params":{…},"params_updated_at":<epoch>,"categories":[…],"items":[…],"version":<epoch_ms>}` |
| PATCH | `/api/params` | `{"cny_rate":12.2,…}` partial | updated `params` document |
| POST | `/api/categories` | `{"name":"Еда"}` | created category |
| PATCH | `/api/categories/:id` | `{"name"?, "sort"?}` | updated category |
| DELETE | `/api/categories/:id` | – | `{"deleted":true,"items_deleted":<n>}` |
| POST | `/api/items` | `{category_id,name,qty\|qty_formula,unit_price\|price_formula,currency,note}` | created item |
| PATCH | `/api/items/:id` | any subset | updated item |
| DELETE | `/api/items/:id` | – | `{"deleted":true}` |

Errors: `400` malformed JSON / bad route, `401` auth, `403` wrong password,
`404` unknown id, `413` body > 32 KB, `422 {"error":"validation","details":[…]}`,
`429 {"error":"too_many_attempts","retry_after":<sec>}`, `500`.

- `GET /api/budget` returns items and categories ordered by `sort`, `id`.
- `PATCH` merge semantics: unknown keys are ignored, `null` is rejected with 422.
- CORS: `Access-Control-Allow-Origin` echoed only for
  `https://rawkward.github.io`, `http://localhost:8765`, `http://127.0.0.1:8765`;
  `Allow-Methods: GET,POST,PATCH,DELETE,OPTIONS`, `Allow-Headers: authorization,content-type`,
  `Max-Age: 86400`. `OPTIONS` → 204. A request from another origin gets no CORS header
  (the browser blocks it) — do not answer 200 with a wildcard.

## 8. Auth details

- Env: `BUDGET_PASSWORD` and `TOKEN_SECRET` (Worker secrets, never in the repo).
  Local dev: `.dev.vars` (gitignored, `.dev.vars.example` committed with placeholders).
- Password check: SHA-256 of both sides, constant-time compare; a wrong password costs the
  same time as a right one.
- Token: `v1.<expEpochSeconds>.<hex HMAC-SHA256(key=TOKEN_SECRET, msg="budget|"+exp)>`,
  TTL 30 days. Verify signature first (constant time), then expiry.
- Throttle: more than 5 failed logins from one IP within 15 minutes → 429 with `retry_after`.
  IP from `CF-Connecting-IP`. Successful login clears the counter for that IP.
  Attempts older than 24 h are pruned opportunistically on login.
- The frontend stores the token in `localStorage` under `chinatrip.budget.token` and the
  expiry next to it; an expired/401 token is dropped and the login card is shown again.

## 9. Frontend

New section `#budget`, placed after `#links` and before `#notes`, in the existing design
language (cards, `--line` borders, `--accent`, Fraunces headings, tabular numbers).
Nav: add `<a href="#budget">Бюджет</a>`; the existing `#notes` entry becomes «Ритм»
(the section keeps its heading «Бюджет и ритм» → rename to «Ритм и заметки» to avoid two
budgets; keep its cards as they are).

States:

1. **Locked** — title, one paragraph («Раздел закрыт паролем: это личный бюджет поездки»),
   password input + «Войти», error line. Enter submits.
2. **Loading** — skeleton rows.
3. **Ready** — summary + params + items, as below.
4. **Error** — message + «Повторить».

Ready layout:

- **Summary strip** (5 cards): Итого, База, Резерв, На человека, На человека в день.
- **Rate banner** when the CBR fetch returns a rate that differs from the stored one by more
  than 0.1%: «ЦБ на 31.10.2026: ¥12,0873 · HK$10,2660 — обновить?» with «Обновить»/«Скрыть».
  Fetch `https://www.cbr-xml-daily.ru/daily_json.js` (CORS open, verified). A failed fetch is
  silent — the stored rate stays and the panel shows «курс не обновлён».
- **Параметры** (collapsible `<details>`, open by default on desktop):
  people, trip_days, reserve %; CNY/HKD rate with the date of the last update and an
  editable field; then one block per city: nights, hotel ¥/night, food ¥/day, transport ¥/day.
  Any change POSTs `PATCH /api/params` (debounced 600 ms) and re-renders totals.
- **Статьи расходов**, grouped by category. Per category: header with name, subtotal ₽,
  item count, buttons «＋ статья», «✎», «🗑». Per item row: name, `кол-во × цена` (formula shown
  as the formula text with its current value in the tooltip), currency, amount in ₽, note,
  «✎», «🗑», «↑», «↓». Currency amounts are shown right-aligned, tabular.
- **Adding/editing an item** happens inline in the table (row turns into inputs, buttons
  «Сохранить»/«Отмена»). Fields: название (text), количество (number OR formula text with a
  toggle «формула»), цена за единицу (same toggle), валюта (select), категория (select),
  комментарий (text). Formula mode shows a hint listing available parameter names.
- **Category** create/rename via an inline prompt row; delete asks
  «Удалить категорию «Еда» и её 3 статьи?» and only then calls the API.
- Optimistic UI is not required; every mutation awaits the server response, then re-renders
  from a local state object updated with the response. On failure: keep the previous state,
  show a toast with the server's error, do not lose the typed values.
- Deleting an item/category asks for confirmation (`confirm()` is acceptable).
- localStorage caches the last successful `GET /api/budget` payload and renders it (marked
  «данные с 12:30, обновляем…») while the fresh request is in flight; offline therefore still
  shows the last known budget read-only.
- Mobile (≤940 px): the items table becomes stacked cards; params fields full width.

Security of rendering: every user-supplied string (item name, note, category name) is inserted
with `textContent` or through an `esc()` helper — `innerHTML` is only ever used with static
markup or with already-escaped values. A category called `<img src=x onerror=alert(1)>` must
render as text. The token lives only in `localStorage`; it is never put in a URL or logged.


All UI text is Russian. Code comments and identifiers are English.

## 10. FX source

`https://www.cbr-xml-daily.ru/daily_json.js` → `Valute.CNY.Value / Nominal`,
`Valute.HKD.Value / Nominal`, plus `Date`. Verified reachable with permissive CORS.
Never auto-apply a fetched rate: fetch → show → user confirms → `PATCH /api/params`
(and the params panel notes «курс ЦБ на <дата>»).

## 11. Seed data

The workbook's 26 items and the parameter block are the starting state. Because the repo is
public, the seed file must **not** be committed: it lives outside the repo
(`C:/Users/user/hermes-projects/china-trip-budget/seed.json`) and is loaded with
`node worker/scripts/seed.mjs <path>` → SQL piped into
`wrangler d1 execute china-trip-budget --remote --file -`.
`.gitignore` gains `worker/.dev.vars`, `worker/.wrangler/`, `worker/node_modules/`, `*.seed.json`.

Item rows use formulas exactly where the workbook used cell references:
`Гонконг, 5 ночей × HK$ за ночь` → `qty_formula: "people*hk_nights"`, `price_formula: "hk_hotel"`.

Seed file shape (`seed.json`, already produced at
`C:/Users/user/hermes-projects/china-trip-budget/seed.json` — read it, do not retype the numbers):

```json
{ "params": { … as in §4 … },
  "categories": [ { "name": "Еда", "items": [
      { "name": "…", "qty_formula": "people*cq_nights", "price_formula": "cq_food",
        "currency": "CNY", "note": "…" } ] } ] }
```

`worker/scripts/seed.mjs` takes that path, generates ids (`cat_…`, `itm_…` — deterministic
8-char hex from name+index, so re-seeding twice produces the same rows), assigns `sort` by
array order, and prints one SQL script (`DELETE FROM items; DELETE FROM categories;`,
`INSERT …`) to stdout. Nothing about it touches the network.

Tests resolve the same file with this order: `$BUDGET_SEED_PATH` → `<repo>/../china-trip-budget/seed.json`
→ `tests/fixtures/budget-seed.local.json`; if none exists, the seed-dependent assertions are
skipped with a visible `# SKIPPED: no seed fixture` line instead of failing. Never commit real
budget data — a committed `tests/fixtures/budget-seed.example.json` with 3 dummy items exists
only to document the shape.


## 12. Tests (must pass before deploy)

`node --test "tests/**/*.test.js"` with no third-party dependencies (this Node 22.12 rejects a
bare directory argument, so the glob form is the supported one).

1. `budget-core.test.js` — evaluator (valid + hostile inputs), conversion, totals table from
   §6, formatting, validation helpers (formula identifiers, currency, name lengths, param shape).
2. `budget-api.test.js` — expects `wrangler dev --local` on `http://127.0.0.1:8787`
   (`BUDGET_PASSWORD=test-pass`), run only when `BUDGET_API_URL` is set; skipped otherwise.
   Covers: health, wrong password 403, throttle 429 after 6 failures, login → token,
   401 without token, seeded GET, create/update/delete item, category cascade delete,
   params PATCH rejects bad shapes, 422 on unknown formula param, CORS preflight for the
   Pages origin and absence for a foreign origin.

Manual/E2E verification by Hermes after deploy: log in from the live page, add/edit/delete an
item, reload in a second browser profile, confirm persistence, and confirm a wrong password
and a `curl` without token both fail.

## 13. Deploy

Two deploy targets share the same handler (`worker/src/index.js`), the same D1 database
(`china-trip-budget`, id `bee3e353-0c61-4326-b0ad-f0a2b48afef6`) and one root `wrangler` install.

**Primary: Pages project `china-trip-api`.** `api/functions/api/[[path]].js` is an `[[path]]`
catch-all that re-exports `worker.fetch`, so `/api/health`, `/api/login`, `/api/budget`,
`/api/params`, `/api/categories[/:id]` and `/api/items[/:id]` keep their original paths;
`api/public/index.html` is only the asset root the Pages project needs.

1. `npm install && npx wrangler login` at the repo root (browser OAuth, done once by the owner).
2. `npx wrangler d1 create china-trip-budget` (only if the database does not exist yet) → put
   `database_id` into `api/wrangler.toml` and `worker/wrangler.toml`.
3. `npx wrangler d1 execute china-trip-budget --remote --file worker/schema.sql`.
4. Secrets for Pages:
   `npx wrangler pages secret put BUDGET_PASSWORD --project-name china-trip-api`, same for
   `TOKEN_SECRET`.
5. `cd api && npx wrangler pages deploy public --project-name china-trip-api` →
   `https://china-trip-api.pages.dev` (plus a per-deployment `<hash>.china-trip-api.pages.dev`).
6. Put that URL into `assets/budget-config.js`, bump `?v=` on the script tags, push to Pages.

Why Pages is primary: `*.workers.dev` is blocked by the owner's corporate TLS proxy (it answers
an empty 200 and kills the TLS handshake), while `*.pages.dev` is reachable from the same machine.

**Fallback: Worker `china-trip-budget`.** For networks where `workers.dev` works, deploy it with
`cd worker && npx wrangler deploy` → `https://china-trip-budget.<subdomain>.workers.dev`; secrets
there are set with plain `npx wrangler secret put BUDGET_PASSWORD` / `TOKEN_SECRET`.
