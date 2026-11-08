import { expect, test } from "@playwright/test";

test("страница поднимается и разложена по вкладкам", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });

  await page.goto("/", { waitUntil: "networkidle" });

  await expect(page.locator("h1")).toBeVisible();
  for (const id of ["variants", "itinerary", "missed"]) {
    await expect(page.locator(`#${id}`), `раздел #${id}`).toHaveCount(1);
  }

  // чек-лист закрыт паролем: без входа его нет ни в меню, ни на странице
  await expect(page.locator("#checklist")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Чек-лист" })).toHaveCount(0);

  // старый якорь открывает нужную вкладку и нормализуется в новый адрес
  await page.goto("/#sights", { waitUntil: "networkidle" });
  await expect(page.locator("#sights")).toBeVisible();
  for (const id of ["stay", "food", "parks", "tips"]) {
    await expect(page.locator(`#${id}`), `раздел #${id}`).toHaveCount(1);
  }
  await expect(page.locator("#itinerary")).toHaveCount(0);
  await expect(page).toHaveURL(/#\/guide\/sights$/);

  await page.goto("/#booking", { waitUntil: "networkidle" });
  for (const id of ["booking", "tours", "links"]) {
    await expect(page.locator(`#${id}`), `раздел #${id}`).toHaveCount(1);
  }
  await expect(page.locator("#checklist")).toHaveCount(0);

  await page.goto("/#budget", { waitUntil: "networkidle" });
  await expect(page.locator("#budget")).toBeVisible();
  await expect(page.locator("#variants")).toHaveCount(0);

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

  const main = page.locator("#variants [role='button'][aria-pressed='true']");
  await expect(main.first()).toBeVisible();

  const rows = page.locator("#variants details");
  await expect(rows.first()).toBeVisible();
  const count = await rows.count();
  expect(count).toBeGreaterThan(1);

  const row = rows.first();
  const title = (await row.locator("summary .font-display").innerText()).trim();
  await row.locator("summary").click();
  await row.getByRole("button", { name: "Показать этот маршрут" }).click();

  await expect(page.locator("#itinerary")).toBeInViewport();
  const stored = await page.evaluate(() => localStorage.getItem("china-trip-variant-v5"));
  expect(stored).toBeTruthy();

  await page.reload({ waitUntil: "networkidle" });
  const reloaded = page.locator("#variants details").first();
  await expect(reloaded.locator("summary")).toContainText(title.slice(0, 12));
  await expect(reloaded.locator("summary")).toContainText("показан сейчас");
});
