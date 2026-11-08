import { describe, expect, it } from "vitest";
import { hrefFor, parseHash, tabForSection, tabHref } from "./tabs";

describe("parseHash: новые адреса", () => {
  it("открывает вкладки без раздела", () => {
    expect(parseHash("#/route")).toEqual({ tab: "route", anchor: null });
    expect(parseHash("#/guide")).toEqual({ tab: "guide", anchor: null });
    expect(parseHash("#/info")).toEqual({ tab: "info", anchor: null });
    expect(parseHash("#/budget")).toEqual({ tab: "budget", anchor: null });
  });

  it("разбирает вкладку с разделом", () => {
    expect(parseHash("#/guide/stay")).toEqual({ tab: "guide", anchor: "stay" });
    expect(parseHash("#/guide/sights")).toEqual({ tab: "guide", anchor: "sights" });
    expect(parseHash("#/info/checklist")).toEqual({ tab: "info", anchor: "checklist" });
    expect(parseHash("#/route/itinerary")).toEqual({ tab: "route", anchor: "itinerary" });
  });

  it("пустой hash ведёт на маршрут", () => {
    expect(parseHash("")).toEqual({ tab: "route", anchor: null });
    expect(parseHash("#")).toEqual({ tab: "route", anchor: null });
  });
});

describe("parseHash: старые адреса", () => {
  it("раскладывает старые якоря по вкладкам", () => {
    expect(parseHash("#variants")).toEqual({ tab: "route", anchor: "variants" });
    expect(parseHash("#itinerary")).toEqual({ tab: "route", anchor: "itinerary" });
    expect(parseHash("#missed")).toEqual({ tab: "route", anchor: "missed" });
    expect(parseHash("#stay")).toEqual({ tab: "guide", anchor: "stay" });
    expect(parseHash("#tips")).toEqual({ tab: "guide", anchor: "tips" });
    expect(parseHash("#booking")).toEqual({ tab: "info", anchor: "booking" });
    expect(parseHash("#links")).toEqual({ tab: "info", anchor: "links" });
    expect(parseHash("#budget")).toEqual({ tab: "budget", anchor: null });
    expect(parseHash("#top")).toEqual({ tab: "route", anchor: null });
  });

  it("карточки справочника открывают справочник", () => {
    expect(parseHash("#g-victoria-peak")).toEqual({
      tab: "guide",
      anchor: "g-victoria-peak",
    });
    expect(parseHash("#gp-nan-lian")).toEqual({ tab: "guide", anchor: "gp-nan-lian" });
  });
});

describe("hrefFor", () => {
  it("строит канонические адреса вкладок и разделов", () => {
    expect(tabHref("route")).toBe("#/route");
    expect(hrefFor("guide", null)).toBe("#/guide");
    expect(hrefFor("guide", "sights")).toBe("#/guide/sights");
    expect(hrefFor("info", "checklist")).toBe("#/info/checklist");
    expect(hrefFor("route", "variants")).toBe("#/route/variants");
    expect(hrefFor("budget", "budget")).toBe("#/budget");
    expect(hrefFor("route", "top")).toBe("#/route");
  });

  it("сохраняет публичные якоря карточек справочника", () => {
    expect(hrefFor("guide", "g-victoria-peak")).toBe("#g-victoria-peak");
    expect(hrefFor("guide", "gp-nan-lian")).toBe("#gp-nan-lian");
  });

  it("переносит раздел в его вкладку", () => {
    expect(hrefFor("route", "sights")).toBe("#/guide/sights");
    expect(tabForSection("sights")).toBe("guide");
    expect(tabForSection("checklist")).toBe("info");
    expect(tabForSection("unknown")).toBeNull();
  });
});
