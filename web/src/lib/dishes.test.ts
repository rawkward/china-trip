import { describe, expect, it } from "vitest";
import { dishCountLabel } from "./dishes";

describe("dishCountLabel", () => {
  it("склоняет счётчик по правилам русского языка", () => {
    expect(dishCountLabel(1)).toBe("блюдо");
    expect(dishCountLabel(2)).toBe("блюда");
    expect(dishCountLabel(4)).toBe("блюда");
    expect(dishCountLabel(5)).toBe("блюд");
    expect(dishCountLabel(11)).toBe("блюд");
    expect(dishCountLabel(21)).toBe("блюдо");
  });
});
