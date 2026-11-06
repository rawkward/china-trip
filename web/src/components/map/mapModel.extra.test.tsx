import { describe, expect, it } from "vitest";
import type { MarkerRecord } from "@/lib/map";
import {
  allPopupHtml,
  cityColor,
  cityLabel,
  dayPinHtml,
  dayPopupHtml,
  escapeHtml,
  filterMarkers,
  presentKinds,
} from "./mapModel";

const record: MarkerRecord = {
  key: "a",
  name: "Отель",
  tag: "hotel",
  lat: 1,
  lon: 2,
  city: "hk",
  days: [],
};

describe("mapModel: ветки без данных", () => {
  it("пустой реестр — нет типов и городов", () => {
    expect(presentKinds([])).toEqual([]);
    expect(filterMarkers([], "all", "all")).toEqual([]);
  });

  it("незнакомый город получает серый цвет и своё имя", () => {
    expect(cityColor("zzz")).toBe("#8a8278");
    expect(cityLabel("zzz")).toBe("zzz");
    expect(cityColor("hk")).not.toBe("#8a8278");
    expect(cityLabel("hk")).toBe("Гонконг");
  });

  it("поп-ап без дней не рисует пустую строку «дни:»", () => {
    const html = allPopupHtml(record, "https://maps.example/1");
    expect(html).toContain("<strong>Отель</strong>");
    expect(html).not.toContain("дни:");
  });

  it("поп-ап точки без тега не добавляет лишний разделитель", () => {
    const html = dayPopupHtml(0, { name: "Точка", tag: "", lat: 1, lon: 2 }, 3, "https://maps.example/1");
    expect(html).toContain("Д3");
    expect(html).not.toContain(" · ");
  });

  it("поп-ап точки с тегом подписывает тип", () => {
    const html = dayPopupHtml(0, { name: "Отель", tag: "hotel", lat: 1, lon: 2 }, 1, "https://maps.example/1");
    expect(html).toContain("Д1 · Отели");
  });

  it("escapeHtml не трогает безопасный текст и экранирует цвет маркера", () => {
    expect(escapeHtml("обычный текст")).toBe("обычный текст");
    expect(dayPinHtml(0, 'red" onmouseover="x')).toContain("&quot;");
  });
});
