// Временная диагностика вёрстки карточки карты: сравнение clientHeight/scrollHeight и границ блоков.
import { chromium } from "playwright";

const url = process.argv[2] ?? "https://rawkward.github.io/china-trip/";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
await page.goto(url + "?cb=" + Date.now(), { waitUntil: "networkidle" });
await page.locator("#itinerary").scrollIntoViewIfNeeded();
await page.waitForTimeout(1500);

const report = await page.evaluate(() => {
  const card = document.querySelector("[aria-label=\"Карта маршрута\"]");
  if (!card) return { error: "карточка карты не найдена" };
  const cardBox = card.getBoundingClientRect();
  const children = [...card.children].map((el) => {
    const r = el.getBoundingClientRect();
    return {
      tag: el.tagName.toLowerCase(),
      cls: (el.className || "").toString().slice(0, 60),
      top: Math.round(r.top - cardBox.top),
      bottom: Math.round(r.bottom - cardBox.top),
      h: Math.round(r.height),
      scrollH: el.scrollHeight,
      clientH: el.clientHeight,
    };
  });
  return {
    card: {
      h: Math.round(cardBox.height),
      scrollH: card.scrollHeight,
      clientH: card.clientHeight,
      overflow: getComputedStyle(card).overflow,
    },
    children,
    clipped: children.some((c) => c.bottom > cardBox.height + 1),
  };
});

console.log(JSON.stringify(report, null, 2));

const shots = await page.evaluate(() => {
  const card = document.querySelector("[aria-label=\"Карта маршрута\"]");
  const tools = card;
  return { toolsText: tools?.textContent?.slice(0, 120) ?? "" };
});
console.log(JSON.stringify(shots));

await browser.close();
