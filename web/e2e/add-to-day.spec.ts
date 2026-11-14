import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

/**
 * Справочник → день → перенос (playwright.mock.config.ts).
 * Карточка чужого города добавляется в день Чунцина, затем переносится
 * в другой день Чунцина; после перезагрузки обе правки остаются в мок-API.
 */
const PASSWORD = "test";
const MOCK_API = "http://127.0.0.1:8790";
const CARD_ID = "#g-lan-fong-yuen";
const CARD_NAME = "Lan Fong Yuen";

async function mockToken(request: APIRequestContext): Promise<string> {
  const res = await request.post(MOCK_API + "/api/login", { data: { password: PASSWORD } });
  expect(res.ok()).toBeTruthy();
  const { token } = (await res.json()) as { token: string };
  return token;
}

/** Мок живёт в памяти между прогонами — чистим тексты основного варианта. */
async function resetDayTexts(request: APIRequestContext): Promise<void> {
  const token = await mockToken(request);
  const res = await request.get(MOCK_API + "/api/day-texts");
  const { notes } = (await res.json()) as { notes: { day_key: string }[] };
  for (const note of notes) {
    if (!note.day_key.startsWith("hk-first|")) continue;
    await request.put(MOCK_API + "/api/day-texts/" + encodeURIComponent(note.day_key), {
      headers: { authorization: "Bearer " + token },
      data: { texts: {} },
    });
  }
}

function dayNumber(label: string | null): number {
  const match = /Д(\d+)/.exec(label ?? "");
  if (!match) throw new Error("в подписи дня нет номера: " + label);
  return Number(match[1]);
}

/** Вкладки — ссылки в липкой шапке; из глубины страницы её бокс вне вьюпорта, поэтому сначала наверх. */
async function switchTab(page: Page, name: string): Promise<void> {
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
  });
  await page.getByRole("link", { name, exact: true }).first().click();
}

async function openDay(page: Page, n: number) {
  const toggle = page.locator(`#dayList button[aria-controls="day-body-${n}"]`);
  await expect(toggle).toBeVisible();
  if ((await toggle.getAttribute("aria-expanded")) !== "true") await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  const body = page.locator("#day-body-" + n);
  await expect(body).toBeVisible();
  return body;
}

test.describe("карточка справочника в день и перенос остановки", () => {
  test.beforeEach(async ({ request }) => {
    await resetDayTexts(request);
  });

  test.afterEach(async ({ request }) => {
    await resetDayTexts(request);
  });

  test("добавляется в чужой день и переносится в другой день", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    await page.getByLabel("Пароль для правок").fill(PASSWORD);
    await page.getByRole("button", { name: "Войти" }).click();
    await expect(page.getByText(/Правка открыта/)).toBeVisible();

    await switchTab(page, "Справочник");
    await expect(page.locator("#sights")).toBeVisible();

    await page.locator(`details:has(${CARD_ID}) summary`).click();
    const card = page.locator(CARD_ID);
    await expect(card).toBeVisible();

    await card.getByRole("button", { name: new RegExp(`добавить «${CARD_NAME}» в день`) }).click();

    const addTargets = page.getByRole("list", { name: new RegExp(`куда добавить «${CARD_NAME}»`) });
    await expect(addTargets).toBeVisible();
    const addTarget = addTargets.locator("button:not([disabled])").filter({ hasText: "Чунцин" }).first();
    await expect(addTarget).toBeVisible();
    const n = dayNumber(await addTarget.getAttribute("aria-label"));
    await addTarget.click();

    await expect(page.getByRole("status").filter({ hasText: /добавлено в Д/ })).toBeVisible();
    await expect(card.getByText("добавлено в Д" + n)).toBeVisible();

    await switchTab(page, "Маршрут");
    await expect(page.locator("#dayList")).toBeVisible();

    const sourceBody = await openDay(page, n);
    await expect(sourceBody).toContainText(CARD_NAME);

    const stopRow = sourceBody.locator("li").filter({ hasText: CARD_NAME }).first();
    await stopRow.getByRole("button", { name: "перенести в другой день" }).click();

    const moveTargets = page.getByRole("list", {
      name: new RegExp(`перенести «${CARD_NAME}» в другой день`),
    });
    await expect(moveTargets).toBeVisible();
    const moveTarget = moveTargets.locator("button:not([disabled])").filter({ hasText: "Чунцин" }).first();
    await expect(moveTarget).toBeVisible();
    const m = dayNumber(await moveTarget.getAttribute("aria-label"));
    expect(m).not.toBe(n);
    await moveTarget.click();

    await expect(page.getByRole("status").filter({ hasText: /перенесено в Д/ })).toBeVisible();

    await expect(sourceBody).not.toContainText(CARD_NAME);
    const targetBody = await openDay(page, m);
    await expect(targetBody).toContainText(CARD_NAME);

    await page.reload({ waitUntil: "networkidle" });
    await expect(page.getByText(/Правка открыта/)).toBeVisible();

    const savedTarget = await openDay(page, m);
    await expect(savedTarget).toContainText(CARD_NAME);
    const savedSource = await openDay(page, n);
    await expect(savedSource).not.toContainText(CARD_NAME);
  });
});
