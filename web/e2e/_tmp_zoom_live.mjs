import { chromium } from "playwright";

const out = "C:/Users/user/AppData/Local/hermes/profiles/family/cache/scratch";
const url = "https://rawkward.github.io/china-trip/?cb=" + Date.now();

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 430, height: 900 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
page.on("pageerror", (e) => console.log("pageerror:", e.message));

await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
await page.waitForTimeout(1500);

// вкладка маршрута
const tab = page.getByRole("tab", { name: /Маршрут/ }).first();
if (await tab.count()) await tab.click();
await page.waitForTimeout(1200);

const card = page.locator("#dayList article", { hasText: "Фужун" }).first();
console.log("fuzhou card:", await card.count());
await card.scrollIntoViewIfNeeded();
const header = card.locator("button[aria-expanded]").first();
if ((await header.getAttribute("aria-expanded")) !== "true") await header.click();
await page.waitForTimeout(500);

const det = card.locator("details", { hasText: "Карта маршрута" }).first();
console.log("details:", await det.count());
await det.locator("summary").click();
await page.waitForTimeout(500);
const thumb = det.getByRole("button", { name: /Открыть крупнее/ }).first();
console.log("thumb:", await thumb.count());
await thumb.click();
await page.waitForTimeout(700);

const dialog = page.getByRole("dialog");
console.log("dialog live:", await dialog.isVisible());
const label = dialog.locator("span[aria-live]");
console.log("start:", (await label.innerText()).trim());
await dialog.getByRole("button", { name: "Увеличить" }).click();
await dialog.getByRole("button", { name: "Увеличить" }).click();
console.log("after 2x plus:", (await label.innerText()).trim());
await page.screenshot({ path: `${out}/live-zoom.png` });
await page.keyboard.press("Escape");
await page.waitForTimeout(400);
console.log("dialog after Esc:", await page.getByRole("dialog").count());

await browser.close();
