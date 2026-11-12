import { expect, test } from "@playwright/test";

/**
 * Сценарий справочника против мока API. Вынесен в helper, потому что
 * playwright.mock.config.ts матчит только `*editing.spec.ts`, а обычный
 * конфиг игнорирует `editing.spec.ts` — править конфиги в задаче нельзя.
 *
 * Под обычным конфигом (реальный API, порт 8765) тест помечается skipped,
 * под мок-конфигом (порт 8766) — выполняется.
 */
export function registerGuideTagScenario(): void {
  test.describe("справочник: тег карточки", () => {
    test("карточка остаётся в общей сетке города после смены тега", async ({
      page,
    }, testInfo) => {
      test.skip(
        !String(testInfo.project.use.baseURL ?? "").includes(":8766"),
        "нужен мок API: playwright.mock.config.ts",
      );

      await page.goto("/", { waitUntil: "networkidle" });
      await page
        .locator('header nav[aria-label="Вкладки"]')
        .getByRole("link", { name: "Справочник" })
        .click();
      await expect(page.locator("#stay")).toBeVisible();
      await expect(page.getByRole("button", { name: "Войти" })).toBeVisible();

      const card = page.locator("#g-victoria-peak");
      const cityDetails = card.locator("xpath=ancestor::details");
      await expect(cityDetails).toHaveCount(1);
      await expect(cityDetails).not.toHaveAttribute("open", "");

      // без входа редактора тега нет
      await expect(card.getByRole("button", { name: "альтернатива" })).toHaveCount(0);

      await page.getByLabel("Пароль для правок").fill("test");
      await page.getByRole("button", { name: "Войти" }).click();
      await expect(page.getByText(/Правка открыта/)).toBeVisible();

      await cityDetails.locator("summary").click();
      await expect(card).toBeVisible();

      await card.getByRole("button", { name: "альтернатива" }).click();

      // карточка остаётся в сетке своего города, отдельной раскрывашки нет
      await expect(card.getByRole("button", { name: "альтернатива" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(card.locator("xpath=ancestor::details")).toHaveCount(1);
      await expect(cityDetails.locator("summary")).not.toContainText(/Альтернативы · \d+/);

      // перезагрузка сохраняет тег
      await page.reload({ waitUntil: "networkidle" });
      const reloaded = page.locator("#g-victoria-peak");
      const reloadedDetails = reloaded.locator("xpath=ancestor::details");
      await expect(reloadedDetails).not.toHaveAttribute("open", "");
      await reloadedDetails.locator("summary").click();
      await expect(reloaded.getByRole("button", { name: "альтернатива" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });
  });
}
