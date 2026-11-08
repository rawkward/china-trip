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
    test("карточка уезжает под «Альтернативы» и остаётся там после перезагрузки", async ({
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

      // без входа редактора тега нет
      await expect(
        page.locator("#g-victoria-peak").getByRole("button", { name: "альтернатива" }),
      ).toHaveCount(0);

      await page.getByLabel("Пароль для правок").fill("test");
      await page.getByRole("button", { name: "Войти" }).click();
      await expect(page.getByText(/Правка открыта/)).toBeVisible();

      const card = page.locator("#g-victoria-peak");
      await expect(card).toBeVisible();
      await expect(card.locator("xpath=ancestor::details")).toHaveCount(0);

      await card.getByRole("button", { name: "альтернатива" }).click();

      // карточка переехала в раскрывашку, а тег запомнился
      await expect(card.locator("xpath=ancestor::details")).toHaveCount(1);
      await expect(
        card.locator("xpath=ancestor::details/summary").filter({ hasText: /Альтернативы · \d+/ }),
      ).toHaveCount(1);

      await card.locator("xpath=ancestor::details/summary").click();
      await expect(card.getByRole("button", { name: "альтернатива" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );

      // перезагрузка не возвращает карточку в основной список
      await page.reload({ waitUntil: "networkidle" });
      const reloaded = page.locator("#g-victoria-peak");
      await expect(reloaded.locator("xpath=ancestor::details")).toHaveCount(1);
      await reloaded.locator("xpath=ancestor::details/summary").click();
      await expect(reloaded.getByRole("button", { name: "альтернатива" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });
  });
}
