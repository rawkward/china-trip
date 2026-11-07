import { expect, test } from "@playwright/test";

test("страница поднимается и все разделы на месте", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });

  await page.goto("/", { waitUntil: "networkidle" });

  await expect(page.locator("h1")).toBeVisible();
  for (const id of [
    "variants",
    "itinerary",
    "stay",
    "food",
    "sights",
    "tips",
    "booking",
    "checklist",
    "tours",
    "links",
    "budget",
    "missed",
  ]) {
    await expect(page.locator(`#${id}`), `раздел #${id}`).toHaveCount(1);
  }

  // ничего не распирает страницу по горизонтали
  const overflow = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(overflow.scroll, `горизонтальный скролл: ${JSON.stringify(overflow)}`).toBeLessThanOrEqual(
    overflow.client + 1,
  );

  expect(errors, errors.join("\n")).toEqual([]);
});

test("переключение варианта меняет дни и запоминается", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });

  const cards = page.locator("#variants [role='button']");
  await expect(cards.first()).toBeVisible();
  const count = await cards.count();
  expect(count).toBeGreaterThan(1);

  const second = cards.nth(1);
  const title = (await second.locator("h3").innerText()).trim();
  await second.click();

  await expect(page.locator("#itinerary")).toBeInViewport();
  const stored = await page.evaluate(() => localStorage.getItem("china-trip-variant-v5"));
  expect(stored).toBeTruthy();

  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("#variants [role='button'][aria-pressed='true'] h3")).toHaveText(
    new RegExp(title.slice(0, 12).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
  );
});
