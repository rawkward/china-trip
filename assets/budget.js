import {
  CURRENCIES,
  PARAM_KEY_RE,
  cityBlocks,
  computeBudget,
  formatMoney,
  formatNumber,
  formatRub,
  itemAmount,
} from "../shared/budget-core.js";

const TOKEN_KEY = "chinatrip.budget.token";
const TOKEN_EXP_KEY = "chinatrip.budget.token_exp";
const CACHE_KEY = "chinatrip.budget.cache";
const FX_URL = "https://www.cbr-xml-daily.ru/daily_json.js";

const CITY_LABELS = Object.freeze({
  cq: "Чунцин",
  zzj: "Чжанцзяцзе",
  hk: "Гонконг",
});

const state = {
  status: "boot",
  token: null,
  params: {},
  paramsUpdatedAt: null,
  categories: [],
  items: [],
  version: 0,
  loginError: "",
  error: "",
  stale: false,
  offline: false,
  cacheAt: null,
  draft: null,
  editingCategoryId: null,
  addingCategory: false,
  fx: null,
  fxFailed: false,
  fxDismissed: false,
  fxLoading: false,
  fxRequested: false,
  paramsOpen: null,
  pendingParams: null,
  patchTimer: null,
  patchSeq: 0,
  busy: false,
};

let stage = null;
let toastArea = null;

// ---------------------------------------------------------------------------
// small helpers
// ---------------------------------------------------------------------------

const ESCAPES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function esc(value) {
  return String(value === null || value === undefined ? "" : value).replace(
    /[&<>"']/g,
    (ch) => ESCAPES[ch],
  );
}

function attr(value) {
  return esc(value);
}

export function itemWord(count) {
  const n = Math.abs(Math.trunc(Number(count) || 0));
  const tail100 = n % 100;
  if (tail100 >= 11 && tail100 <= 14) return "статей";
  const last = n % 10;
  if (last === 1) return "статья";
  if (last >= 2 && last <= 4) return "статьи";
  return "статей";
}

export function cityLabel(prefix) {
  if (CITY_LABELS[prefix]) return CITY_LABELS[prefix];
  const text = String(prefix).replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function rateDiffers(stored, fetched) {
  if (!Number.isFinite(stored) || !Number.isFinite(fetched)) return false;
  if (stored === 0) return fetched !== 0;
  return Math.abs(fetched - stored) / Math.abs(stored) > 0.001;
}

export function formatClock(ms) {
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return "—";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function formatRate(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return number.toLocaleString("ru-RU", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
}

function formatDateFromSeconds(seconds) {
  if (!seconds) return "—";
  const date = new Date(Number(seconds) * 1000);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("ru-RU");
}

function formatDateIso(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("ru-RU");
}

function displayNumber(value, scale = 1) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "";
  const scaled = value * scale;
  return String(Math.round(scaled * 1000000) / 1000000);
}

function compareSort(a, b) {
  const sa = Number.isFinite(a.sort) ? a.sort : 0;
  const sb = Number.isFinite(b.sort) ? b.sort : 0;
  if (sa !== sb) return sa - sb;
  return String(a.id).localeCompare(String(b.id));
}

function itemsForCategory(categoryId) {
  return state.items.filter((item) => item.category_id === categoryId).sort(compareSort);
}

function replaceItem(item) {
  const index = state.items.findIndex((entry) => entry.id === item.id);
  if (index >= 0) state.items[index] = item;
  else state.items.push(item);
}

function safeCompute() {
  try {
    return computeBudget({
      params: state.params,
      categories: state.categories,
      items: state.items,
    });
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// storage
// ---------------------------------------------------------------------------

function storageGet(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore quota / privacy mode failures
  }
}

function storageRemove(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function readToken() {
  const token = storageGet(TOKEN_KEY);
  if (!token) return null;
  const expires = Number(storageGet(TOKEN_EXP_KEY));
  if (!Number.isFinite(expires) || expires * 1000 <= Date.now()) {
    clearToken();
    return null;
  }
  state.token = token;
  return token;
}

function saveToken(token, expiresAt) {
  storageSet(TOKEN_KEY, token);
  storageSet(TOKEN_EXP_KEY, String(expiresAt));
}

function clearToken() {
  storageRemove(TOKEN_KEY);
  storageRemove(TOKEN_EXP_KEY);
  state.token = null;
}

function readCache() {
  const raw = storageGet(CACHE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.data || typeof parsed.data !== "object") return null;
    if (!Array.isArray(parsed.data.categories) || !Array.isArray(parsed.data.items)) return null;
    return { at: Number(parsed.at) || Date.now(), data: parsed.data };
  } catch {
    return null;
  }
}

function writeCache(data) {
  storageSet(CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

class ApiError extends Error {
  constructor(status, message, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function apiBase() {
  let override = "";
  try {
    override = new URLSearchParams(window.location.search).get("api") || "";
  } catch {
    override = "";
  }
  const configured = (window.BUDGET_CONFIG && window.BUDGET_CONFIG.API_BASE) || "";
  return String(override || configured).replace(/\/+$/, "");
}

function errorMessage(status, data) {
  if (data && data.error === "validation" && Array.isArray(data.details) && data.details.length) {
    const detail = data.details[0];
    if (detail && detail.message) return String(detail.message);
  }
  if (data && typeof data.error === "string") {
    const map = {
      wrong_password: "Неверный пароль",
      unauthorized: "Требуется вход",
      too_many_attempts: "Слишком много попыток",
      not_found: "Не найдено",
      bad_json: "Некорректный запрос",
      bad_route: "Неизвестный запрос",
      body_too_large: "Слишком большой запрос",
      server_misconfigured: "Сервер не настроен",
      internal: "Внутренняя ошибка сервера",
    };
    return map[data.error] || data.error;
  }
  return `Ошибка сервера (${status})`;
}

function errorText(err) {
  if (err instanceof ApiError) {
    if (err.status === 0) return err.message;
    if (err.status === 401) return "Сессия истекла — войдите заново";
    return err.message;
  }
  return err && err.message ? String(err.message) : "Неизвестная ошибка";
}

async function api(path, options = {}) {
  const { method = "GET", body, auth = true } = options;
  const base = apiBase();
  if (!base) throw new ApiError(0, "API не настроен");

  const headers = {};
  if (body !== undefined) headers["content-type"] = "application/json";
  if (auth && state.token) headers.authorization = `Bearer ${state.token}`;

  let response;
  try {
    response = await fetch(`${base}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Сервер недоступен. Проверьте подключение.");
  }

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    if (response.status === 401 && auth) {
      clearToken();
      state.status = "locked";
      renderLocked();
    }
    throw new ApiError(response.status, errorMessage(response.status, data), data);
  }

  return data;
}

// ---------------------------------------------------------------------------
// toasts
// ---------------------------------------------------------------------------

function toast(message, kind = "info") {
  if (!toastArea) return;
  const node = document.createElement("div");
  node.className = `bud-toast ${kind}`;
  node.textContent = message;
  toastArea.appendChild(node);
  window.setTimeout(() => {
    node.remove();
  }, 4200);
}

// ---------------------------------------------------------------------------
// rendering: shell states
// ---------------------------------------------------------------------------

function renderLocked() {
  state.status = "locked";
  stage.innerHTML = `
    <div class="bud-card bud-locked">
      <div class="bud-eyebrow">Личный бюджет</div>
      <h3>Раздел закрыт паролем</h3>
      <p class="muted small">Это личный бюджет поездки. Введите общий пароль, чтобы открыть статьи и параметры.</p>
      <form id="bud-login-form" class="bud-login">
        <label class="bud-label" for="bud-password">Пароль</label>
        <div class="bud-login-row">
          <input id="bud-password" name="password" type="password" autocomplete="current-password" required>
          <button class="bud-btn bud-primary" type="submit">Войти</button>
        </div>
        <p class="bud-error" id="bud-login-error" role="alert">${esc(state.loginError)}</p>
      </form>
    </div>`;
}

function renderLoading() {
  state.status = "loading";
  stage.innerHTML = `
    <div class="bud-card">
      <div class="bud-skeleton" aria-label="Загружаем бюджет">
        <span style="width:36%"></span>
        <span style="width:78%"></span>
        <span style="width:64%"></span>
        <span style="width:88%"></span>
        <span style="width:52%"></span>
      </div>
    </div>`;
}

function renderError() {
  state.status = "error";
  stage.innerHTML = `
    <div class="bud-card">
      <div class="bud-eyebrow">Бюджет</div>
      <h3>Не удалось загрузить бюджет</h3>
      <p class="muted small" role="alert">${esc(state.error)}</p>
      <button type="button" class="bud-btn bud-primary" data-act="retry">Повторить</button>
    </div>`;
}

// ---------------------------------------------------------------------------
// rendering: ready state
// ---------------------------------------------------------------------------

function cacheBadge() {
  if (!state.cacheAt) return "";
  if (state.offline) {
    return `<div class="bud-cache">данные с ${esc(formatClock(state.cacheAt))}, офлайн
      <button type="button" class="bud-btn bud-btn-sm" data-act="retry">Повторить</button></div>`;
  }
  if (state.stale) {
    return `<div class="bud-cache">данные с ${esc(formatClock(state.cacheAt))}, обновляем…</div>`;
  }
  return "";
}

function summaryMarkup(totals) {
  const card = (label, value, modifier = "") =>
    `<div class="bud-sum-card${modifier}"><div class="lbl">${label}</div><div class="val">${value}</div></div>`;
  return `<div class="bud-summary" id="bud-summary">
    ${card("Итого", totals ? formatRub(totals.total) : "—", " bud-sum-total")}
    ${card("База", totals ? formatRub(totals.base) : "—")}
    ${card("Резерв", totals ? formatRub(totals.reserve) : "—")}
    ${card("На человека", totals ? formatRub(totals.perPerson) : "—")}
    ${card("На человека в день", totals ? formatRub(totals.perDay) : "—")}
  </div>`;
}

function fxNoteText() {
  const parts = [];
  if (state.fx) {
    const date = formatDateIso(state.fx.date);
    parts.push(date ? `курс ЦБ на ${date}` : "курс ЦБ получен");
  } else if (state.fxFailed) {
    parts.push("курс не обновлён");
  }
  if (state.paramsUpdatedAt) parts.push(`сохранён ${formatDateFromSeconds(state.paramsUpdatedAt)}`);
  return parts.length ? parts.join(" · ") : "курс не обновлён";
}

function bannerMarkup() {
  if (!state.fx || state.fxDismissed) return "";
  const cnyDiffers = rateDiffers(state.params.cny_rate, state.fx.cny);
  const hkdDiffers = rateDiffers(state.params.hkd_rate, state.fx.hkd);
  if (!cnyDiffers && !hkdDiffers) return "";

  const date = formatDateIso(state.fx.date);
  const when = date ? `ЦБ на ${date}` : "ЦБ";
  return `<div class="bud-banner">
    <div>${esc(when)}: ¥${esc(formatRate(state.fx.cny))} · HK$${esc(formatRate(state.fx.hkd))} — обновить?</div>
    <div class="bud-banner-actions">
      <button type="button" class="bud-btn bud-primary bud-btn-sm" data-act="fx-apply">Обновить</button>
      <button type="button" class="bud-btn bud-btn-sm" data-act="fx-dismiss">Скрыть</button>
    </div>
  </div>`;
}

function paramsMarkup(open) {
  const p = state.params || {};
  const ro = state.offline ? " disabled" : "";

  const numberField = (key, label, options = {}) => {
    const { min = "0", max = "", step = "any", scale = 1, wide = false } = options;
    const scaleAttr = scale !== 1 ? ` data-scale="${scale}"` : "";
    const maxAttr = max === "" ? "" : ` max="${max}"`;
    return `<label class="bud-field${wide ? " bud-field-wide" : ""}">${esc(label)}
      <input type="number" inputmode="decimal" data-param="${attr(key)}"${scaleAttr}
        min="${min}"${maxAttr} step="${step}" value="${attr(displayNumber(p[key], scale))}"${ro}>
    </label>`;
  };

  const cities = cityBlocks(p).map((block) => {
    const prefix = block.prefix;
    return `<div class="bud-city">
      <h4>${esc(cityLabel(prefix))}</h4>
      <div class="bud-params-grid">
        ${numberField(`${prefix}_nights`, "Ночей", { step: "1" })}
        ${numberField(`${prefix}_hotel`, "Отель, ¥/ночь", { step: "any" })}
        ${numberField(`${prefix}_food`, "Еда, ¥/день", { step: "any" })}
        ${numberField(`${prefix}_transport`, "Транспорт, ¥/день", { step: "any" })}
      </div>
    </div>`;
  }).join("");

  return `<details class="bud-params" id="bud-params"${open ? " open" : ""}>
    <summary>Параметры</summary>
    <div class="bud-params-body">
      <div class="bud-params-grid">
        ${numberField("people", "Человек", { min: "1", step: "1" })}
        ${numberField("trip_days", "Дней поездки", { min: "1", step: "1" })}
        ${numberField("reserve_pct", "Резерв, %", { min: "0", max: "100", step: "0.1", scale: 100 })}
      </div>
      <div class="bud-rates">
        ${numberField("cny_rate", "CNY, ₽ за 1 ¥", { step: "0.0001" })}
        ${numberField("hkd_rate", "HKD, ₽ за 1 HK$", { step: "0.0001" })}
        <div class="bud-fx-note" id="bud-fx-note">${esc(fxNoteText())}</div>
      </div>
      ${cities || '<p class="muted small">Города не заданы.</p>'}
      <p class="bud-fx-note">Изменения сохраняются автоматически.</p>
    </div>
  </details>`;
}

function renderReady() {
  state.status = "ready";
  const totals = safeCompute();
  const open = state.paramsOpen === null
    ? !!(window.matchMedia && window.matchMedia("(min-width: 941px)").matches)
    : state.paramsOpen;

  stage.innerHTML = `
    ${cacheBadge()}
    ${summaryMarkup(totals)}
    <div id="bud-fx">${bannerMarkup()}</div>
    ${paramsMarkup(open)}
    ${itemsMarkup(totals)}`;
}

function refreshDerived() {
  const totals = safeCompute();
  const summary = stage.querySelector("#bud-summary");
  if (summary) summary.outerHTML = summaryMarkup(totals);
  if (!state.draft) {
    const items = stage.querySelector("#bud-items");
    if (items) items.outerHTML = itemsMarkup(totals);
  }
  refreshFxUi();
}

function refreshFxUi() {
  const box = stage.querySelector("#bud-fx");
  if (box) box.innerHTML = bannerMarkup();
  const note = stage.querySelector("#bud-fx-note");
  if (note) note.textContent = fxNoteText();
}

// ---------------------------------------------------------------------------
// rendering: items
// ---------------------------------------------------------------------------

function formulaText(text, value) {
  return `<span class="bud-formula" title="${attr(value)}">${esc(text)}</span>`;
}

function itemRow(item, index, lastIndex) {
  let qtyText = "—";
  let priceText = "—";
  let amountText = "—";
  let amountTitle = "";

  try {
    const calc = itemAmount(item, state.params);
    qtyText = item.qty_formula !== null && item.qty_formula !== undefined
      ? formulaText(item.qty_formula, formatNumber(calc.qty))
      : formatNumber(calc.qty);
    priceText = item.price_formula !== null && item.price_formula !== undefined
      ? formulaText(item.price_formula, formatMoney(calc.unitPrice, item.currency))
      : formatMoney(calc.unitPrice, item.currency);
    amountText = formatRub(calc.amountRub);
  } catch (err) {
    qtyText = item.qty_formula !== null && item.qty_formula !== undefined
      ? formulaText(item.qty_formula, "ошибка")
      : formatNumber(item.qty);
    priceText = item.price_formula !== null && item.price_formula !== undefined
      ? formulaText(item.price_formula, "ошибка")
      : formatNumber(item.unit_price);
    amountTitle = err && err.message ? err.message : "";
  }

  const actions = state.offline ? "" : `<div class="bud-row-actions">
    <button type="button" class="bud-icon" data-act="edit-item" data-id="${attr(item.id)}" title="Изменить" aria-label="Изменить статью">✎</button>
    <button type="button" class="bud-icon" data-act="delete-item" data-id="${attr(item.id)}" title="Удалить" aria-label="Удалить статью">🗑</button>
    <button type="button" class="bud-icon" data-act="move-up" data-id="${attr(item.id)}" title="Выше" aria-label="Переместить выше"${index === 0 ? " disabled" : ""}>↑</button>
    <button type="button" class="bud-icon" data-act="move-down" data-id="${attr(item.id)}" title="Ниже" aria-label="Переместить ниже"${index === lastIndex ? " disabled" : ""}>↓</button>
  </div>`;

  return `<tr class="bud-item" data-item="${attr(item.id)}">
    <td data-label="Статья">
      <div class="bud-item-name">${esc(item.name)}</div>
      ${item.note ? `<div class="bud-item-note">${esc(item.note)}</div>` : ""}
    </td>
    <td data-label="Кол-во × цена" class="num">${qtyText} × ${priceText}</td>
    <td data-label="Валюта" class="num">${esc(item.currency)}</td>
    <td data-label="Сумма" class="num"${amountTitle ? ` title="${attr(amountTitle)}"` : ""}>${amountText}</td>
    <td class="bud-actions">${actions}</td>
  </tr>`;
}

function editRow(draft) {
  return `<tr class="bud-edit-row"><td colspan="5">${itemFormMarkup(draft)}</td></tr>`;
}

function itemFormMarkup(draft) {
  const params = Object.keys(state.params).filter((key) => PARAM_KEY_RE.test(key));
  const showHint = draft.qtyMode === "formula" || draft.priceMode === "formula";

  const operand = (label, modeKey, numberKey, formulaKey, action) => {
    const isFormula = draft[modeKey] === "formula";
    const input = isFormula
      ? `<input data-f="${formulaKey}" type="text" maxlength="200" autocomplete="off"
          value="${attr(draft[formulaKey] || "")}" placeholder="people*cq_nights">`
      : `<input data-f="${numberKey}" type="number" inputmode="decimal" min="0" step="any"
          value="${attr(draft[numberKey] === undefined || draft[numberKey] === null ? "" : draft[numberKey])}">`;
    return `<label class="bud-field">${esc(label)}
      <span class="bud-operand">
        ${input}
        <button type="button" class="bud-toggle${isFormula ? " on" : ""}" data-act="${action}"
          aria-pressed="${isFormula}">формула</button>
      </span>
    </label>`;
  };

  const currencyOptions = CURRENCIES.map(
    (currency) => `<option value="${currency}"${currency === draft.currency ? " selected" : ""}>${currency}</option>`,
  ).join("");

  const categoryOptions = state.categories.map(
    (category) => `<option value="${attr(category.id)}"${category.id === draft.category_id ? " selected" : ""}>${esc(category.name)}</option>`,
  ).join("");

  return `<div class="bud-form">
    <div class="bud-form-grid">
      <label class="bud-field bud-field-wide">Название
        <input data-f="name" type="text" maxlength="120" autocomplete="off" value="${attr(draft.name)}">
      </label>
      ${operand("Количество", "qtyMode", "qty", "qty_formula", "toggle-qty")}
      ${operand("Цена за единицу", "priceMode", "unit_price", "price_formula", "toggle-price")}
    </div>
    <div class="bud-form-grid">
      <label class="bud-field">Валюта
        <select data-f="currency">${currencyOptions}</select>
      </label>
      <label class="bud-field">Категория
        <select data-f="category_id">${categoryOptions}</select>
      </label>
      <label class="bud-field bud-field-wide">Комментарий
        <input data-f="note" type="text" maxlength="500" autocomplete="off" value="${attr(draft.note)}">
      </label>
    </div>
    ${showHint ? `<div class="bud-hint"><b>Параметры:</b> ${esc(params.join(", "))}</div>` : ""}
    <div class="bud-form-actions">
      <button type="button" class="bud-btn bud-primary" data-act="save-item">Сохранить</button>
      <button type="button" class="bud-btn" data-act="cancel-item">Отмена</button>
    </div>
  </div>`;
}

function renameCategoryForm(category) {
  return `<form class="bud-cat-rename" data-form="cat-rename" data-cat="${attr(category.id)}">
    <input data-f="cat-name" type="text" maxlength="60" autocomplete="off"
      aria-label="Название категории" value="${attr(category.name)}">
    <button type="submit" class="bud-btn bud-primary bud-btn-sm">Сохранить</button>
    <button type="button" class="bud-btn bud-btn-sm" data-act="cancel-cat">Отмена</button>
  </form>`;
}

function newCategoryForm() {
  return `<form class="bud-cat-new" data-form="cat-new">
    <input data-f="cat-name" type="text" maxlength="60" autocomplete="off"
      aria-label="Название новой категории" placeholder="Название категории">
    <button type="submit" class="bud-btn bud-primary bud-btn-sm">Сохранить</button>
    <button type="button" class="bud-btn bud-btn-sm" data-act="cancel-cat">Отмена</button>
  </form>`;
}

function categoryHead(category, list, subtotal) {
  if (state.editingCategoryId === category.id) {
    return `<div class="bud-cat-head">${renameCategoryForm(category)}</div>`;
  }

  const count = list.length;
  const actions = state.offline ? "" : `<div class="bud-cat-actions">
    <button type="button" class="bud-btn bud-btn-sm" data-act="add-item" data-cat="${attr(category.id)}">＋ статья</button>
    <button type="button" class="bud-icon" data-act="rename-category" data-id="${attr(category.id)}"
      title="Переименовать" aria-label="Переименовать категорию">✎</button>
    <button type="button" class="bud-icon" data-act="delete-category" data-id="${attr(category.id)}"
      title="Удалить" aria-label="Удалить категорию">🗑</button>
  </div>`;

  return `<div class="bud-cat-head">
    <span class="bud-cat-name">${esc(category.name)}</span>
    <span class="bud-cat-meta">${count} ${itemWord(count)}</span>
    <span class="bud-cat-sub">${subtotal === null ? "—" : formatRub(subtotal)}</span>
    ${actions}
  </div>`;
}

function itemsMarkup(totals) {
  const buckets = new Map();
  if (totals) {
    for (const bucket of totals.categories) buckets.set(bucket.id, bucket);
  }

  const categories = [...state.categories].sort(compareSort);
  let html = categories.map((category) => {
    const list = itemsForCategory(category.id);
    const bucket = buckets.get(category.id);
    const subtotal = bucket ? bucket.subtotal : null;

    const rows = list.map((item, index) => {
      if (state.draft && state.draft.id === item.id) return editRow(state.draft);
      return itemRow(item, index, list.length - 1);
    }).join("");

    const appendDraft = state.draft && state.draft.id === null && state.draft.category_id === category.id
      ? editRow(state.draft)
      : "";

    const empty = list.length === 0 && !appendDraft
      ? `<tr class="bud-empty-row"><td colspan="5">Пока пусто</td></tr>`
      : "";

    return `<div class="bud-cat" data-cat="${attr(category.id)}">
      ${categoryHead(category, list, subtotal)}
      <div class="bud-table-wrap">
        <table class="bud-table">
          <thead><tr>
            <th>Статья</th><th class="num">Кол-во × цена</th><th class="num">Валюта</th><th class="num">Сумма</th><th></th>
          </tr></thead>
          <tbody>${rows}${appendDraft}${empty}</tbody>
        </table>
      </div>
    </div>`;
  }).join("");

  if (!state.offline) {
    html += state.addingCategory
      ? newCategoryForm()
      : `<div class="bud-add-cat"><button type="button" class="bud-btn" data-act="add-category">＋ категория</button></div>`;
  }

  if (!categories.length && state.offline) {
    html = `<p class="muted small">Категории не загружены.</p>`;
  }

  return `<div class="bud-items" id="bud-items">${html}</div>`;
}

// ---------------------------------------------------------------------------
// drafts
// ---------------------------------------------------------------------------

function blankDraft(categoryId) {
  return {
    id: null,
    category_id: categoryId,
    name: "",
    qty: "1",
    qty_formula: "",
    qtyMode: "number",
    unit_price: "0",
    price_formula: "",
    priceMode: "number",
    currency: "CNY",
    note: "",
  };
}

function draftFromItem(item) {
  return {
    id: item.id,
    category_id: item.category_id,
    name: item.name || "",
    qty: item.qty === null || item.qty === undefined ? "" : String(item.qty),
    qty_formula: item.qty_formula || "",
    qtyMode: item.qty_formula !== null && item.qty_formula !== undefined ? "formula" : "number",
    unit_price: item.unit_price === null || item.unit_price === undefined ? "" : String(item.unit_price),
    price_formula: item.price_formula || "",
    priceMode: item.price_formula !== null && item.price_formula !== undefined ? "formula" : "number",
    currency: item.currency || "CNY",
    note: item.note || "",
  };
}

function parseNumberInput(value) {
  const text = String(value === undefined || value === null ? "" : value).replace(",", ".").trim();
  if (text === "") return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

function buildItemPayload(draft) {
  const name = String(draft.name || "").trim();
  if (!name) {
    toast("Укажите название статьи", "error");
    return null;
  }
  if (name.length > 120) {
    toast("Название длиннее 120 символов", "error");
    return null;
  }

  const note = String(draft.note || "").trim();
  if (note.length > 500) {
    toast("Комментарий длиннее 500 символов", "error");
    return null;
  }

  if (!CURRENCIES.includes(draft.currency)) {
    toast("Выберите валюту", "error");
    return null;
  }

  const payload = {
    category_id: draft.category_id,
    name,
    currency: draft.currency,
    note,
  };

  if (draft.qtyMode === "formula") {
    const formula = String(draft.qty_formula || "").trim();
    if (!formula) {
      toast("Укажите формулу количества", "error");
      return null;
    }
    payload.qty_formula = formula;
  } else {
    const qty = parseNumberInput(draft.qty);
    if (qty === null || qty < 0) {
      toast("Количество должно быть числом ≥ 0", "error");
      return null;
    }
    payload.qty = qty;
  }

  if (draft.priceMode === "formula") {
    const formula = String(draft.price_formula || "").trim();
    if (!formula) {
      toast("Укажите формулу цены", "error");
      return null;
    }
    payload.price_formula = formula;
  } else {
    const price = parseNumberInput(draft.unit_price);
    if (price === null || price < 0) {
      toast("Цена должна быть числом ≥ 0", "error");
      return null;
    }
    payload.unit_price = price;
  }

  return payload;
}

// ---------------------------------------------------------------------------
// data loading
// ---------------------------------------------------------------------------

function hydrate(data) {
  state.params = data && data.params && typeof data.params === "object" ? data.params : {};
  state.paramsUpdatedAt = data && Number.isFinite(data.params_updated_at) ? data.params_updated_at : null;
  state.categories = data && Array.isArray(data.categories) ? data.categories : [];
  state.items = data && Array.isArray(data.items) ? data.items : [];
  state.version = data && Number.isFinite(data.version) ? data.version : 0;
}

async function loadBudget() {
  if (!state.token) {
    renderLocked();
    return;
  }

  try {
    const data = await api("/api/budget");
    hydrate(data);
    state.stale = false;
    state.offline = false;
    state.cacheAt = null;
    state.error = "";
    writeCache(data);
    renderReady();
    maybeLoadFx();
  } catch (err) {
    if (err.status === 401) {
      renderLocked();
      return;
    }
    if (state.cacheAt) {
      state.offline = true;
      state.stale = false;
      renderReady();
      toast(errorText(err), "error");
      return;
    }
    state.error = errorText(err);
    renderError();
  }
}

function retryLoad() {
  if (!state.token) {
    renderLocked();
    return;
  }
  if (state.cacheAt) {
    state.offline = false;
    state.stale = true;
    renderReady();
  } else {
    renderLoading();
  }
  loadBudget();
}

// ---------------------------------------------------------------------------
// FX (CBR)
// ---------------------------------------------------------------------------

function readCbrRate(data, code) {
  const entry = data && data.Valute && data.Valute[code];
  if (!entry) return null;
  const value = Number(entry.Value);
  const nominal = Number(entry.Nominal);
  if (!Number.isFinite(value) || !Number.isFinite(nominal) || nominal <= 0) return null;
  return value / nominal;
}

function maybeLoadFx() {
  if (state.offline || state.fxRequested) return;
  state.fxRequested = true;
  loadFx();
}

async function loadFx() {
  if (state.fxLoading) return;
  state.fxLoading = true;
  try {
    const response = await fetch(FX_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`http ${response.status}`);
    const data = await response.json();
    const cny = readCbrRate(data, "CNY");
    const hkd = readCbrRate(data, "HKD");
    if (cny === null || hkd === null) throw new Error("cbr shape");
    state.fx = { cny, hkd, date: data.Date || "" };
    state.fxFailed = false;
  } catch {
    state.fxFailed = true;
  } finally {
    state.fxLoading = false;
    if (state.status === "ready") refreshFxUi();
  }
}

async function applyFx() {
  if (!state.fx || state.busy || state.offline) return;
  state.busy = true;
  try {
    const updated = await api("/api/params", {
      method: "PATCH",
      body: { cny_rate: state.fx.cny, hkd_rate: state.fx.hkd },
    });
    state.params = { ...updated, ...(state.pendingParams || {}) };
    state.paramsUpdatedAt = Math.floor(Date.now() / 1000);
    state.fxDismissed = true;
    renderReady();
    toast("Курс обновлён", "success");
  } catch (err) {
    if (err.status !== 401) toast(errorText(err), "error");
  } finally {
    state.busy = false;
  }
}

// ---------------------------------------------------------------------------
// params editing
// ---------------------------------------------------------------------------

function onParamInput(input) {
  if (state.offline || !input) return;
  const key = input.getAttribute("data-param");
  if (!key) return;

  const scale = Number(input.getAttribute("data-scale") || "1");
  const raw = parseNumberInput(input.value);
  if (raw === null) return;
  const value = raw / scale;

  if (key === "people" || key === "trip_days") {
    if (!Number.isInteger(value) || value < 1) return;
  } else if (key === "reserve_pct") {
    if (value < 0 || value > 1) return;
  } else if (value < 0) {
    return;
  }

  queueParamPatch(key, value);
}

function queueParamPatch(key, value) {
  state.pendingParams = { ...(state.pendingParams || {}), [key]: value };
  if (state.patchTimer) window.clearTimeout(state.patchTimer);
  state.patchTimer = window.setTimeout(flushParams, 600);
}

async function flushParams() {
  state.patchTimer = null;
  const patch = state.pendingParams;
  state.pendingParams = null;
  if (!patch || !Object.keys(patch).length || state.offline) return;

  const seq = ++state.patchSeq;
  try {
    const updated = await api("/api/params", { method: "PATCH", body: patch });
    if (seq !== state.patchSeq) return;
    state.params = { ...updated, ...(state.pendingParams || {}) };
    state.paramsUpdatedAt = Math.floor(Date.now() / 1000);
    refreshDerived();
  } catch (err) {
    if (err.status !== 401) toast(errorText(err), "error");
  }
}

// ---------------------------------------------------------------------------
// mutations
// ---------------------------------------------------------------------------

async function runMutation(fn) {
  if (state.offline) {
    toast("Нет связи — раздел открыт только для просмотра", "error");
    return;
  }
  if (state.busy) return;
  state.busy = true;
  try {
    await fn();
  } catch (err) {
    if (err.status !== 401) toast(errorText(err), "error");
  } finally {
    state.busy = false;
  }
}

function startNewItem(categoryId) {
  state.addingCategory = false;
  state.editingCategoryId = null;
  state.draft = blankDraft(categoryId);
  renderReady();
  focusDraft();
}

function startEditItem(id) {
  const item = state.items.find((entry) => entry.id === id);
  if (!item) return;
  state.addingCategory = false;
  state.editingCategoryId = null;
  state.draft = draftFromItem(item);
  renderReady();
  focusDraft();
}

function saveItem() {
  const draft = state.draft;
  if (!draft) return;
  const payload = buildItemPayload(draft);
  if (!payload) return;

  runMutation(async () => {
    const saved = draft.id
      ? await api(`/api/items/${encodeURIComponent(draft.id)}`, { method: "PATCH", body: payload })
      : await api("/api/items", { method: "POST", body: payload });
    replaceItem(saved);
    state.draft = null;
    renderReady();
    toast("Сохранено", "success");
  });
}

function deleteItem(id) {
  const item = state.items.find((entry) => entry.id === id);
  if (!item) return;
  if (!window.confirm(`Удалить статью «${item.name}»?`)) return;

  runMutation(async () => {
    await api(`/api/items/${encodeURIComponent(id)}`, { method: "DELETE" });
    state.items = state.items.filter((entry) => entry.id !== id);
    if (state.draft && state.draft.id === id) state.draft = null;
    renderReady();
    toast("Удалено", "success");
  });
}

function moveItem(id, delta) {
  runMutation(async () => {
    const item = state.items.find((entry) => entry.id === id);
    if (!item) return;

    const siblings = itemsForCategory(item.category_id);
    const index = siblings.findIndex((entry) => entry.id === id);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= siblings.length) return;

    const other = siblings[target];
    const updated = await api(`/api/items/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: { sort: target },
    });
    const updatedOther = await api(`/api/items/${encodeURIComponent(other.id)}`, {
      method: "PATCH",
      body: { sort: index },
    });

    replaceItem(updated);
    replaceItem(updatedOther);
    renderReady();
  });
}

function saveNewCategory() {
  const input = stage.querySelector('form[data-form="cat-new"] input[data-f="cat-name"]');
  const name = input ? input.value.trim() : "";
  if (!name) {
    toast("Укажите название категории", "error");
    return;
  }

  runMutation(async () => {
    const created = await api("/api/categories", { method: "POST", body: { name } });
    state.categories.push(created);
    state.addingCategory = false;
    renderReady();
    toast("Категория добавлена", "success");
  });
}

function saveRenameCategory(id) {
  const input = stage.querySelector('form[data-form="cat-rename"] input[data-f="cat-name"]');
  const name = input ? input.value.trim() : "";
  if (!name) {
    toast("Укажите название категории", "error");
    return;
  }

  runMutation(async () => {
    const updated = await api(`/api/categories/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: { name },
    });
    const index = state.categories.findIndex((entry) => entry.id === id);
    if (index >= 0) state.categories[index] = updated;
    state.editingCategoryId = null;
    renderReady();
    toast("Сохранено", "success");
  });
}

function deleteCategory(id) {
  const category = state.categories.find((entry) => entry.id === id);
  if (!category) return;

  const count = itemsForCategory(id).length;
  const suffix = count > 0 ? ` и её ${count} ${itemWord(count)}` : "";
  if (!window.confirm(`Удалить категорию «${category.name}»${suffix}?`)) return;

  runMutation(async () => {
    await api(`/api/categories/${encodeURIComponent(id)}`, { method: "DELETE" });
    state.categories = state.categories.filter((entry) => entry.id !== id);
    state.items = state.items.filter((entry) => entry.category_id !== id);
    if (state.editingCategoryId === id) state.editingCategoryId = null;
    if (state.draft && state.draft.category_id === id) state.draft = null;
    renderReady();
    toast("Удалено", "success");
  });
}

// ---------------------------------------------------------------------------
// login
// ---------------------------------------------------------------------------

function focusLogin() {
  const input = stage.querySelector("#bud-password");
  if (input) input.focus();
}

function focusDraft() {
  window.setTimeout(() => {
    const input = stage.querySelector('.bud-form input[data-f="name"]');
    if (input) input.focus();
  }, 0);
}

function focusCatNew() {
  window.setTimeout(() => {
    const input = stage.querySelector('form[data-form="cat-new"] input[data-f="cat-name"]');
    if (input) input.focus();
  }, 0);
}

function focusCatRename() {
  window.setTimeout(() => {
    const input = stage.querySelector('form[data-form="cat-rename"] input[data-f="cat-name"]');
    if (input) {
      input.focus();
      input.select();
    }
  }, 0);
}

async function handleLogin(event) {
  if (event) event.preventDefault();
  if (state.busy) return;

  const input = stage.querySelector("#bud-password");
  const password = input ? input.value : "";
  state.busy = true;

  try {
    const data = await api("/api/login", {
      method: "POST",
      body: { password },
      auth: false,
    });
    saveToken(data.token, data.expires_at);
    state.token = data.token;
    state.loginError = "";
    renderLoading();
    await loadBudget();
  } catch (err) {
    if (err.status === 403) {
      state.loginError = "Неверный пароль";
    } else if (err.status === 429) {
      const seconds = Number(err.data && err.data.retry_after) || 0;
      const minutes = Math.max(1, Math.ceil(seconds / 60));
      state.loginError = `Слишком много попыток, попробуйте через ${minutes} мин`;
    } else {
      state.loginError = errorText(err);
    }
    renderLocked();
    focusLogin();
  } finally {
    state.busy = false;
  }
}

// ---------------------------------------------------------------------------
// events
// ---------------------------------------------------------------------------

function onClick(event) {
  const button = event.target.closest("[data-act]");
  if (!button) return;
  const action = button.getAttribute("data-act");

  switch (action) {
    case "retry":
      retryLoad();
      break;
    case "fx-apply":
      applyFx();
      break;
    case "fx-dismiss":
      state.fxDismissed = true;
      refreshFxUi();
      break;
    case "add-category":
      state.addingCategory = true;
      state.editingCategoryId = null;
      state.draft = null;
      renderReady();
      focusCatNew();
      break;
    case "cancel-cat":
      state.addingCategory = false;
      state.editingCategoryId = null;
      renderReady();
      break;
    case "rename-category":
      state.editingCategoryId = button.getAttribute("data-id");
      state.addingCategory = false;
      state.draft = null;
      renderReady();
      focusCatRename();
      break;
    case "delete-category":
      deleteCategory(button.getAttribute("data-id"));
      break;
    case "add-item":
      startNewItem(button.getAttribute("data-cat"));
      break;
    case "edit-item":
      startEditItem(button.getAttribute("data-id"));
      break;
    case "delete-item":
      deleteItem(button.getAttribute("data-id"));
      break;
    case "move-up":
      moveItem(button.getAttribute("data-id"), -1);
      break;
    case "move-down":
      moveItem(button.getAttribute("data-id"), 1);
      break;
    case "save-item":
      saveItem();
      break;
    case "cancel-item":
      state.draft = null;
      renderReady();
      break;
    case "toggle-qty":
      if (!state.draft) return;
      state.draft.qtyMode = state.draft.qtyMode === "formula" ? "number" : "formula";
      renderReady();
      break;
    case "toggle-price":
      if (!state.draft) return;
      state.draft.priceMode = state.draft.priceMode === "formula" ? "number" : "formula";
      renderReady();
      break;
    default:
      break;
  }
}

function onFieldInput(event) {
  const param = event.target.closest("[data-param]");
  if (param) {
    onParamInput(param);
    return;
  }

  const field = event.target.closest("[data-f]");
  if (!field || !state.draft) return;
  if (!field.closest(".bud-form")) return;
  state.draft[field.getAttribute("data-f")] = field.value;
}

function onSubmit(event) {
  const form = event.target.closest("form");
  if (!form) return;

  if (form.id === "bud-login-form") {
    event.preventDefault();
    handleLogin(event);
    return;
  }
  if (form.getAttribute("data-form") === "cat-new") {
    event.preventDefault();
    saveNewCategory();
    return;
  }
  if (form.getAttribute("data-form") === "cat-rename") {
    event.preventDefault();
    saveRenameCategory(form.getAttribute("data-cat"));
  }
}

// ---------------------------------------------------------------------------
// boot
// ---------------------------------------------------------------------------

function boot() {
  const app = document.getElementById("budgetApp");
  if (!app) return;

  app.innerHTML = '<div class="bud-stage"></div><div class="bud-toasts" aria-live="polite"></div>';
  stage = app.querySelector(".bud-stage");
  toastArea = app.querySelector(".bud-toasts");

  stage.addEventListener("click", onClick);
  stage.addEventListener("input", onFieldInput);
  stage.addEventListener("change", onFieldInput);
  stage.addEventListener("submit", onSubmit);
  stage.addEventListener("toggle", (event) => {
    if (event.target && event.target.id === "bud-params") state.paramsOpen = event.target.open;
  }, true);

  const token = readToken();
  if (!token) {
    renderLocked();
    return;
  }

  state.token = token;
  const cached = readCache();
  if (cached) {
    hydrate(cached.data);
    state.cacheAt = cached.at;
    state.stale = true;
    renderReady();
  } else {
    renderLoading();
  }
  loadBudget();
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
}
