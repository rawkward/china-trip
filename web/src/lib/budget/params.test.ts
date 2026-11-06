import { describe, expect, it } from "vitest";
import { cityBlocksOf, cityParamsPatch, cityPrefixes } from "./params";

describe("параметры городов", () => {
  it("достаёт блоки городов из плоского ParamsDoc", () => {
    const blocks = cityBlocksOf({
      people: 2,
      hk_nights: 3,
      hk_hotel: 1000,
      hk_food: 200,
      hk_transport: 50,
      cq_nights: 2,
    });

    expect(blocks).toEqual([
      { prefix: "hk", nights: 3, hotel: 1000, food: 200, transport: 50 },
      { prefix: "cq", nights: 2, hotel: undefined, food: undefined, transport: undefined },
    ]);
    expect(cityPrefixes({ hk_nights: 1, cq_nights: 1 })).toEqual(["hk", "cq"]);
  });

  it("игнорирует негородские и нечисловые ключи", () => {
    expect(
      cityBlocksOf({ people: 2, hk_nights: Number.NaN, "1bad_nights": 3 } as Record<
        string,
        number
      >),
    ).toEqual([]);
  });

  it("собирает PATCH из четырёх нулей", () => {
    expect(cityParamsPatch("sh")).toEqual({
      sh_nights: 0,
      sh_hotel: 0,
      sh_food: 0,
      sh_transport: 0,
    });
  });
});
