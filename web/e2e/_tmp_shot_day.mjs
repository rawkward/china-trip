import { chromium } from "playwright";

const url = process.argv[2] ?? "http://localhost:5199/";
const dayLabel = process.argv[3] ?? "12.12";
const tag = process.argv[4] ?? "day";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 1400 }, deviceScaleFactor: 2 });
page.on("pageerror", (e) => console.log("pageerror:", e.message));

await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(1200);

// нужный день в списке маршрута
const cards = page.locator("#dayList article");
const n = await cards.count();
console.log("day cards:", n);
let target = null;
for (let i = 0; i < n; i++) {
  const c = cards.nth(i);
  const txt = await c.innerText();
  if (txt.includes(dayLabel)) { target = c; console.log("found:", txt.split("\n").slice(0, 2).join(" | ")); break; }
}
if (!target) { console.log("day not found"); await browser.close(); process.exit(1); }

const header = target.locator("button[aria-expanded]").first();
if ((await header.getAttribute("aria-expanded")) !== "true") await header.click();
await page.waitForTimeout(600);

// только карточка дня
await target.screenshot({ path: `C:/Users/user/AppData/Local/hermes/profiles/family/cache/scratch/${tag}-card.png` });

// числа: собираем бейджи остановок
const badges = await target.locator("li span[title='точка ' ], li span[title^='точка ']").allInnerTexts();
console.log("badges:", JSON.stringify(badges));

// карта дня
const mapBtn = target.getByRole("button", { name: "Показать на карте" });
await mapBtn.click();
await page.waitForTimeout(3000);
const map = page.locator(".leaflet-container").first();
await map.screenshot({ path: `C:/Users/user/AppData/Local/hermes/profiles/family/cache/scratch/${tag}-map.png` });
const pinCount = await page.locator(".daypin").count();
console.log("pins:", pinCount);

await browser.close();
