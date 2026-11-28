import { chromium } from "playwright";

const out = "C:/Users/user/AppData/Local/hermes/profiles/family/cache/scratch";
const url = "http://localhost:8765/china-trip/#itinerary";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 430, height: 900 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
page.on("pageerror", (e) => console.log("pageerror:", e.message));
page.on("console", (m) => { if (m.type() === "error") console.log("console error:", m.text()); });

await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(1500);

// карточка дня с Фужуном
const card = page.locator("#dayList article", { hasText: "Фужун" }).first();
await card.scrollIntoViewIfNeeded();
const header = card.locator("button[aria-expanded]").first();
if ((await header.getAttribute("aria-expanded")) !== "true") await header.click();
await page.waitForTimeout(500);

// раскрыть «Карта маршрута»
const det = card.locator("details", { hasText: "Карта маршрута" }).first();
await det.locator("summary").click();
await page.waitForTimeout(400);
const thumb = det.getByRole("button", { name: /Открыть крупнее/ }).first();
console.log("thumb found:", await thumb.count());
await det.screenshot({ path: `${out}/zoom-1-thumb.png` });

await thumb.click();
await page.waitForTimeout(500);
const dialog = page.getByRole("dialog");
console.log("dialog open:", await dialog.isVisible());

await page.screenshot({ path: `${out}/zoom-2-open.png` });

// кнопки зума
const plus = dialog.getByRole("button", { name: "Увеличить" });
const minus = dialog.getByRole("button", { name: "Уменьшить" });
console.log("start label:", (await dialog.locator("span[aria-live]").innerText()).trim());
await plus.click(); await plus.click(); await plus.click();
console.log("after 3x plus:", (await dialog.locator("span[aria-live]").innerText()).trim());
const img = dialog.locator("img").first();
console.log("img transform:", await img.evaluate((el) => el.style.transform));
await page.screenshot({ path: `${out}/zoom-3-zoomed.png` });
await minus.click();
console.log("after minus:", (await dialog.locator("span[aria-live]").innerText()).trim());

// зум колесом
await dialog.locator("[data-zoom-panel]").first().hover();
await page.mouse.wheel(0, -300);
await page.waitForTimeout(300);
console.log("after wheel:", (await dialog.locator("span[aria-live]").innerText()).trim());

// сброс и закрытие
await dialog.getByRole("button", { name: "Сброс" }).click();
console.log("after reset:", (await dialog.locator("span[aria-live]").innerText()).trim());
await page.keyboard.press("Escape");
await page.waitForTimeout(400);
console.log("dialog after Esc:", await page.getByRole("dialog").count());

// повторное открытие и закрытие по фону
await thumb.click();
await page.waitForTimeout(300);
await page.mouse.click(5, 450);
await page.waitForTimeout(300);
console.log("dialog after backdrop:", await page.getByRole("dialog").count());

await browser.close();
