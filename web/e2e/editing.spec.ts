import { expect, test, type APIRequestContext } from "@playwright/test";

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

/**
 * Правки остановок и карусели вариантов: пустой текст прячет авторское описание,
 * замена на карточку справочника сворачивает группу в одну остановку.
 * Мок держит состояние в памяти, поэтому чистим только свои ключи до и после теста.
 */
const MOCK_API = "http://127.0.0.1:8790";
const DAY_KEY = "hk-first|05.12";
const DAY_NUM = 2;

async function mockToken(request: APIRequestContext): Promise<string> {
  const res = await request.post(MOCK_API + "/api/login", { data: { password: PASSWORD } });
  expect(res.ok()).toBeTruthy();
  const { token } = (await res.json()) as { token: string };
  return token;
}

async function resetStopNotes(request: APIRequestContext): Promise<void> {
  const token = await mockToken(request);
  const res = await request.get(MOCK_API + "/api/stop-notes");
  const { notes } = (await res.json()) as { notes: { stop_key: string }[] };
  for (const note of notes) {
    if (note.stop_key.startsWith(DAY_KEY + "|")) {
      await request.delete(MOCK_API + "/api/stop-notes/" + encodeURIComponent(note.stop_key), {
        headers: { authorization: "Bearer " + token },
      });
    }
  }
}

async function resetDayRefs(request: APIRequestContext): Promise<void> {
  const token = await mockToken(request);
  const res = await request.get(MOCK_API + "/api/day-texts");
  const { notes } = (await res.json()) as { notes: { day_key: string; texts: Record<string, string> }[] };
  const record = notes.find((note) => note.day_key === DAY_KEY);
  if (!record) return;
  const texts = { ...record.texts };
  for (const key of Object.keys(texts)) {
    if (key.startsWith("ref:")) delete texts[key];
  }
  await request.put(MOCK_API + "/api/day-texts/" + encodeURIComponent(DAY_KEY), {
    headers: { authorization: "Bearer " + token },
    data: { texts },
  });
}

test.describe("правки остановок", () => {
  test.beforeEach(async ({ page, request }) => {
    await resetStopNotes(request);
    await resetDayRefs(request);

    await page.goto("/", { waitUntil: "networkidle" });
    await page.getByLabel("Пароль для правок").fill(PASSWORD);
    await page.getByRole("button", { name: "Войти" }).click();
    await expect(page.getByText(/Правка открыта/)).toBeVisible();
    await page.locator("#dayList button[aria-expanded]").nth(DAY_NUM - 1).click();
    await expect(page.locator("#day-body-" + DAY_NUM)).toBeVisible();
  });

  test.afterEach(async ({ request }) => {
    await resetStopNotes(request);
    await resetDayRefs(request);
  });

  test("пустой текст скрывает описание и возвращается кнопкой", async ({ page }) => {
    const region = page.locator("#day-body-" + DAY_NUM);
    const row = region.locator("li").filter({ hasText: "Пересадка в Пудуне 2 ч 05" }).first();
    const original = "Терминал 1 → терминал 1 без выхода";

    await expect(row).toContainText(original);

    await row.getByRole("button", { name: "править текст к остановке" }).click();
    await row.getByLabel("Текст к остановке").fill("");
    await row.getByRole("button", { name: "Сохранить" }).click();

    await expect(row.getByText("описание скрыто")).toBeVisible();
    await expect(row.getByText(original)).toHaveCount(0);

    await page.reload({ waitUntil: "networkidle" });
    await page.locator("#dayList button[aria-expanded]").nth(DAY_NUM - 1).click();
    await expect(region.getByText("описание скрыто")).toBeVisible();
    await expect(region.getByText(original)).toHaveCount(0);

    await region.getByRole("button", { name: "вернуть авторский текст" }).click();
    await expect(region.getByText(original)).toBeVisible();
    await expect(region.getByText("описание скрыто")).toHaveCount(0);
  });

  test("замена в карусели заменяет группу целиком", async ({ page }) => {
    const region = page.locator("#day-body-" + DAY_NUM);
    const group = region.locator("li").filter({ hasText: "Ужин рядом с отелем" }).first();

    await expect(group.getByRole("button", { name: "следующий вариант" })).toBeVisible();

    await group.getByRole("button", { name: "заменить на карточку из справочника" }).click();
    const firstCard = group.getByRole("button", { name: / — / }).first();
    await expect(firstCard).toBeVisible();
    const selectedName = (await firstCard.innerText()).split("—")[0].trim();
    await firstCard.click();

    const replaced = region.locator("li").filter({ hasText: selectedName }).first();
    await expect(replaced).toContainText(selectedName);
    await expect(replaced.getByRole("button", { name: "следующий вариант" })).toHaveCount(0);
    await expect(replaced.getByRole("link", { name: "карточка справочника" })).toHaveAttribute(
      "href",
      /^#g-/,
    );

    await page.reload({ waitUntil: "networkidle" });
    await page.locator("#dayList button[aria-expanded]").nth(DAY_NUM - 1).click();
    const saved = region.locator("li").filter({ hasText: selectedName }).first();
    await expect(saved).toContainText(selectedName);
    await expect(saved.getByRole("button", { name: "следующий вариант" })).toHaveCount(0);
    await expect(saved.getByRole("link", { name: "карточка справочника" })).toBeVisible();

    await saved.getByRole("button", { name: "заменить на карточку из справочника" }).click();
    await saved.getByRole("button", { name: "оставить как есть" }).click();

    const back = region.locator("li").filter({ hasText: "Ужин рядом с отелем" }).first();
    await expect(back.getByRole("button", { name: "следующий вариант" })).toBeVisible();
    await expect(back.getByText("1 / 5")).toBeVisible();
  });
});
