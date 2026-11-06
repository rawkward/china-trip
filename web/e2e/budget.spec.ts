import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const here = path.dirname(fileURLToPath(import.meta.url));

/** Сценарий идёт против мока API (playwright.mock.config.ts); пароль мока — env или "test". */
function readPassword(): string {
  return process.env.MOCK_API_PASSWORD ?? "test";
}

test("бюджет: вход, итоги, правка параметра, добавление и удаление статьи", async ({
  page,
}, testInfo) => {
  const password = readPassword();

  const fxFixture = fs.readFileSync(
    path.resolve(here, "../src/lib/budget/fixtures/cbr-daily.json"),
    "utf8",
  );
  await page.route("https://www.cbr-xml-daily.ru/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: fxFixture,
    }),
  );
  page.on("dialog", (dialog) => void dialog.accept());

  await page.goto("/china-trip/");
  await page.locator("#budget").scrollIntoViewIfNeeded();

  const budget = page.locator("#budget");
  await expect(budget.getByText("Раздел закрыт паролем")).toBeVisible();
  await budget.getByLabel("Пароль для правок").fill(password);
  await budget.getByRole("button", { name: "Войти" }).click();

  await expect(page.locator('[data-summary="total"]')).toBeVisible({ timeout: 20_000 });
  const perPerson = page.locator('[data-summary-value="per-person"]');
  await expect(page.locator('[data-summary-value="total"]')).not.toHaveText("—", { timeout: 20_000 });
  await expect(perPerson).not.toHaveText("—", { timeout: 20_000 });
  const beforePerPerson = (await perPerson.innerText()).trim();

  const params = page.locator("#budget details").first();
  if (!(await params.evaluate((element) => (element as HTMLDetailsElement).open))) {
    await params.locator("summary").click();
  }

  const people = page.locator('[data-param="people"]');
  await people.fill("3");
  await expect(
    page.locator('#budget [role="status"]').filter({ hasText: "сохранено" }),
  ).toBeVisible({ timeout: 15_000 });
  await expect(perPerson).not.toHaveText(beforePerPerson);

  const food = page
    .locator("[data-category]")
    .filter({ has: page.getByRole("heading", { name: "Еда", exact: true }) });
  await expect(food).toHaveCount(1);

  const itemName = `E2E статья ${Date.now()}`;
  await food.locator('[data-action="add-item"]').click();
  await food.locator('[data-field="name"]:visible').fill(itemName);
  await food.locator('[data-field="unit_price"]:visible').fill("100");
  await food.locator('[data-action="save-item"]:visible').click();

  const created = food.locator("[data-item]:visible").filter({ hasText: itemName });
  await expect(created).toHaveCount(1, { timeout: 15_000 });

  await created.locator('[data-action="delete-item"]').click();
  await expect(food.getByText(itemName, { exact: true })).toHaveCount(0, { timeout: 15_000 });

  await people.fill("2");
  await expect(perPerson).toHaveText(beforePerPerson);
  await page.waitForTimeout(900);

  await page.reload();
  await expect(page.locator('[data-summary="total"]')).toBeVisible({ timeout: 20_000 });
  const reloadedParams = page.locator("#budget details").first();
  if (!(await reloadedParams.evaluate((element) => (element as HTMLDetailsElement).open))) {
    await reloadedParams.locator("summary").click();
  }
  await expect(page.locator('[data-param="people"]')).toHaveValue("2");

  await page.locator("#budget").evaluate((element) => {
    document.documentElement.style.scrollBehavior = "auto";
    const top = element.getBoundingClientRect().top + window.scrollY - 88;
    window.scrollTo({ top, behavior: "auto" });
  });
  await page.waitForTimeout(400);
  await page.screenshot({
    path: path.resolve(here, "shots", `budget-${testInfo.project.name}.png`),
  });
});
