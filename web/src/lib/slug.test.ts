import { describe, expect, it } from "vitest";
import { stopSlug } from "./slug";

describe("stopSlug", () => {
  // Значения сняты со старой страницы: ключи правок уже лежат в D1, хеш менять нельзя.
  it("совпадает с реализацией старого сайта", () => {
    expect(stopSlug("Сяхаоли")).toBe("nhlbx0");
    expect(stopSlug("Заселение у Пекин-роуд / Тауэр")).toBe("njf3k5");
    expect(stopSlug("Causeway Bay + Harbour City")).toBe("1ogw2p");
    expect(stopSlug("Симфония огней")).toBe("19hkak");
    expect(stopSlug("Круиз Гуйлинь → Яншо")).toBe("15uyp2");
  });

  it("всегда даёт 6 символов base36", () => {
    for (const s of ["", "a", "осень 2026", "长", "x".repeat(500)]) {
      expect(stopSlug(s)).toMatch(/^[a-z0-9]{6}$/);
    }
  });

  it("не зависит от пробелов на концах и null", () => {
    expect(stopSlug(null)).toBe(stopSlug(""));
    expect(stopSlug(undefined)).toBe("ztntfp");
    expect(stopSlug("Сяхаоли")).not.toBe(stopSlug("Сяхаоли "));
  });
});
