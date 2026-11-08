import { expect, test } from "@playwright/test";

/**
 * Правки против мока API (playwright.mock.config.ts): вход по паролю,
 * правка заголовка дня, заметка к дню, сохранение после перезагрузки, выход.
 */
const PASSWORD = "test";

test.describe("правки текстов и заметки", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
  });

  test("вход открывает карандаши, текст правится и остаётся после перезагрузки", async ({ page }) => {
    const dayList = page.locator("#dayList");
    const firstDay = dayList.locator("button[aria-expanded]").first();

    // без входа правки скрыты
    await expect(firstDay).toBeVisible();
    await expect(page.getByRole("button", { name: "править заголовок дня" })).toHaveCount(0);

    // вход по паролю — общая панель под шапкой
    await page.getByLabel("Пароль для правок").fill(PASSWORD);
    await page.getByRole("button", { name: "Войти" }).click();
    await expect(page.getByText(/Правка открыта/)).toBeVisible();

    // раскрываем первый день
    await firstDay.click();
    await expect(firstDay).toHaveAttribute("aria-expanded", "true");

    const originalTitle = (await firstDay.locator("span.font-display").first().innerText()).trim();

    // правим заголовок
    await page.getByRole("button", { name: "править заголовок дня" }).first().click();
    const titleInput = dayList.locator("input[aria-label]").first();
    await titleInput.fill("День первый, проверка");
    await dayList.getByRole("button", { name: "Сохранить" }).first().click();

    await expect(dayList.getByText("День первый, проверка")).toBeVisible();
    await expect(dayList.getByText("правка").first()).toBeVisible();

    // правим текст обратно
    await page.getByRole("button", { name: "править заголовок дня" }).first().click();
    await dayList.locator("input[aria-label]").first().fill(originalTitle);
    await dayList.getByRole("button", { name: "Сохранить" }).first().click();
    await expect(dayList.getByText(originalTitle, { exact: true })).toBeVisible();

    // заметка к дню
    await page.getByRole("button", { name: "＋ заметка к дню" }).first().click();
    await page.getByLabel("Заметка к дню").fill("Проверка заметки из e2e");
    await dayList.getByRole("button", { name: "Сохранить" }).first().click();
    await expect(dayList.getByText("Проверка заметки из e2e")).toBeVisible();
    await expect(dayList.getByText(/обновлено/)).toBeVisible();

    // переживает перезагрузку
    await page.reload({ waitUntil: "networkidle" });
    await page.locator("#dayList button[aria-expanded]").first().click();
    await expect(page.getByText("Проверка заметки из e2e")).toBeVisible();

    // выход снова прячет правки
    await page.getByRole("button", { name: "Выйти" }).click();
    await expect(page.getByRole("button", { name: "править заголовок дня" })).toHaveCount(0);
  });

  test("неверный пароль не открывает правку", async ({ page }) => {
    await page.getByLabel("Пароль для правок").fill("definitely-wrong");
    await page.getByRole("button", { name: "Войти" }).click();
    await expect(page.getByText(/неверный пароль/).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "править заголовок дня" })).toHaveCount(0);
  });

  test("чек-лист скрыт без пароля и появляется после входа", async ({ page }) => {
    await page.goto("/#/info", { waitUntil: "networkidle" });

    await expect(page.locator("#checklist")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Чек-лист" })).toHaveCount(0);

    await page.getByLabel("Пароль для правок").fill(PASSWORD);
    await page.getByRole("button", { name: "Войти" }).click();
    await expect(page.getByText(/Правка открыта/)).toBeVisible();

    await expect(page.locator("#checklist")).toBeVisible();
    await expect(page.getByRole("link", { name: "Чек-лист" }).first()).toBeVisible();
    await expect(page.locator("#checklist")).toContainText("Документы и въезд");
    await expect(page.locator("#checklist")).toContainText("Загранпаспорт");

    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator("#checklist")).toBeVisible();
  });
});
