// Живая проверка опубликованного сайта: node web/e2e/live-check.mjs [url]
// Открывает страницу, ждёт загрузки, проверяет разделы, консоль, API-ответы и снимает скриншот.
import { chromium } from "playwright";

const url = process.argv[2] ?? "https://rawkward.github.io/china-trip/";
const errors = [];
const failedRequests = [];
const apiCalls = [];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push("console: " + m.text());
});
page.on("requestfailed", (r) => failedRequests.push(r.url() + " → " + (r.failure()?.errorText ?? "?")));
page.on("response", (r) => {
  const u = r.url();
  if (u.includes("/api/")) apiCalls.push(r.status() + " " + u.replace(/^https?:\/\/[^/]+/, ""));
});

const started = Date.now();
const response = await page.goto(url + "?cb=" + Date.now(), { waitUntil: "networkidle", timeout: 60000 });
const status = response?.status();
const loadMs = Date.now() - started;

const sections = await page.$$eval("main section[id], div[id='top']", (els) => els.map((el) => el.id));
const h1 = await page.locator("h1").first().innerText();
const dayCards = await page.locator("#dayList button[aria-expanded]").count();
const variantCards = await page.locator("#variants [role='button']").count();
const guideCards = await page.locator("[id^='g-']").count();
const overflow = await page.evaluate(() => ({
  scroll: document.documentElement.scrollWidth,
  client: document.documentElement.clientWidth,
}));

// карта: раскрываем день и жмём «Показать на карте»
await page.locator("#dayList button[aria-expanded]").first().click();
await page.getByRole("button", { name: "Показать на карте" }).first().click();
await page.waitForTimeout(2500);
const leaflet = await page.locator(".leaflet-container").count();
const tiles = await page.locator(".leaflet-tile-loaded").count();
const pins = await page.locator(".daypin").count();

await page.screenshot({ path: "e2e/shots/live-desktop.png", fullPage: false });

await browser.close();

const report = {
  url,
  httpStatus: status,
  loadMs,
  h1,
  sections: sections.length,
  variantCards,
  dayCards,
  guideCards,
  map: { leaflet, tiles, pins },
  horizontalOverflow: overflow.scroll > overflow.client + 1 ? overflow : false,
  apiCalls: [...new Set(apiCalls)],
  failedRequests: failedRequests.slice(0, 10),
  errors: errors.slice(0, 10),
};

console.log(JSON.stringify(report, null, 2));

const problems = [];
if (status !== 200) problems.push("HTTP " + status);
if (sections.length < 12) problems.push("разделов меньше 12");
if (variantCards < 6) problems.push("карточек вариантов меньше 6");
if (dayCards < 10) problems.push("дней меньше 10");
if (guideCards < 100) problems.push("карточек справочника меньше 100");
if (!leaflet || !pins) problems.push("карта не отрисовалась");
if (report.horizontalOverflow) problems.push("горизонтальный скролл");
if (errors.length) problems.push("ошибки в консоли");
if (failedRequests.length) problems.push("упавшие запросы");

if (problems.length) {
  console.error("\nПРОБЛЕМЫ: " + problems.join("; "));
  process.exit(1);
}
console.log("\nЖИВОЙ САЙТ В ПОРЯДКЕ");
