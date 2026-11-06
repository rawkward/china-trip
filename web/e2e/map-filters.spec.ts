import { expect, test } from "@playwright/test";

/**
 * Карта: режим «Все точки», фильтры по городу и типу уменьшают число маркеров,
 * кнопка «Другая карта» меняет подпись подложки. Отдельный файл, чтобы не
 * пересекаться с базовым сценарием map.spec.ts.
 */
test("карта: фильтры города/типа и смена подложки", async ({ page }, testInfo) => {
  await page.goto("/", { waitUntil: "networkidle" });

  if (testInfo.project.name === "mobile") {
    const toggle = page.getByRole("button", { name: "Карта", exact: true });
    if (await toggle.isVisible()) await toggle.click();
  }

  const map = page.locator('[role="region"][aria-label="Карта маршрута"]');
  await expect(map).toBeVisible();
  await expect(page.locator(".leaflet-container")).toBeVisible();

  await map.getByRole("button", { name: "Все точки" }).click();
  await expect(map.getByRole("button", { name: "Все точки" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  const markers = page.locator(".leaflet-overlay-pane path");
  await expect.poll(() => markers.count(), { timeout: 20_000 }).toBeGreaterThan(0);
  const allCount = await markers.count();

  await map.getByRole("button", { name: "Гонконг", exact: true }).click();
  await expect(map.getByRole("button", { name: "Гонконг", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect.poll(() => markers.count(), { timeout: 20_000 }).toBeLessThan(allCount);
  const cityCount = await markers.count();

  await map.getByRole("button", { name: "Отели", exact: true }).click();
  await expect(map.getByRole("button", { name: "Отели", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect.poll(() => markers.count(), { timeout: 20_000 }).toBeLessThan(cityCount);

  const tileLabel = map.getByText(/^Подложка:/).first();
  const before = (await tileLabel.textContent())?.trim();
  expect(before).toBeTruthy();

  await map.getByRole("button", { name: "Другая карта" }).click();
  await expect.poll(async () => (await tileLabel.textContent())?.trim()).not.toBe(before);
});
