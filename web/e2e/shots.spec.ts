import { test } from "@playwright/test";

/**
 * Скриншоты для визуальной проверки: `npx playwright test e2e/shots.spec.ts`.
 * Файлы: e2e/shots/<project>-full.png и по одному на раздел.
 */
test("скриншоты разделов", async ({ page }, testInfo) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(400);

  const project = testInfo.project.name;
  // Мобильный fullPage не снимаем: вся страница выше лимита WebKit (32767 px),
  // снимок падает не из-за рендера. Разделы снимаются по отдельности.
  if (project === "desktop") {
    await page.screenshot({ path: `e2e/shots/${project}-full.png`, fullPage: true });
  } else {
    await page.screenshot({ path: `e2e/shots/${project}-viewport.png` });
  }

  const ids = [
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
  ];
  for (const id of ids) {
    const el = page.locator(`#${id}`);
    if (!(await el.count())) continue;
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);
    if (project === "desktop") {
      await el.screenshot({ path: `e2e/shots/${project}-${id}.png` });
    } else {
      // на мобильном длинный раздел выше лимита движка — снимаем экран, не весь блок
      await page.screenshot({ path: `e2e/shots/${project}-${id}.png` });
    }
  }
});
