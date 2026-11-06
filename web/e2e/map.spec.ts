import { expect, test } from "@playwright/test";

/**
 * Карта маршрута: мобильный тумблер «Карта», кнопка «Показать на карте» у дня,
 * появление тайлов и нумерованных точек с линией. Скриншот — e2e/shots/map-<project>.png.
 */
test("карта показывает день маршрута и не остаётся пустой", async ({ page }, testInfo) => {
  const project = testInfo.project.name;
  await page.goto("/", { waitUntil: "networkidle" });

  if (project === "mobile") {
    const toggle = page.getByRole("button", { name: "Карта", exact: true });
    if (await toggle.isVisible()) await toggle.click();
  }

  const dayHeader = page.getByRole("button", { name: /^Д3\b/ }).first();
  await expect(dayHeader).toBeVisible();
  if ((await dayHeader.getAttribute("aria-expanded")) !== "true") {
    await dayHeader.click();
  }

  const focus = page.locator("#day-body-3").getByRole("button", {
    name: "Показать на карте",
  });
  await expect(focus).toBeVisible();
  await focus.click();

  const mapPanel = page.locator('[role="region"][aria-label="Карта маршрута"]');
  await expect(mapPanel).toBeVisible();
  await expect(page.locator(".leaflet-container")).toBeVisible();

  await page.waitForFunction(
    () => document.querySelectorAll(".leaflet-tile-loaded").length > 0,
    null,
    { timeout: 30_000 },
  );

  await expect(page.locator(".daypin")).not.toHaveCount(0);
  await expect(page.locator(".leaflet-overlay-pane path")).not.toHaveCount(0);

  const tileLabel = await page.getByText(/^Подложка:/).first().textContent();
  testInfo.annotations.push({ type: "tile-layer", description: tileLabel ?? "?" });

  await mapPanel.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await mapPanel.screenshot({ path: `e2e/shots/map-${project}.png` });
});
