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
    "notes",
  ]) {
    await expect(page.locator(`#${id}`), `раздел #${id}`).toHaveCount(1);
  }

  expect(errors, errors.join("\n")).toEqual([]);
});
