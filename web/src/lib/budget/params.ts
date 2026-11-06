import { cityBlocks } from "@shared/budget-core.js";
import type { ParamsDoc } from "./types";

export interface CityBlock {
  prefix: string;
  nights?: number;
  hotel?: number;
  food?: number;
  transport?: number;
}

/**
 * Параметры города приходят из JS-модуля shared с невыводимыми типами массивов,
 * поэтому на границе один явный каст.
 */
export function cityBlocksOf(params: ParamsDoc): CityBlock[] {
  return cityBlocks(params) as unknown as CityBlock[];
}

export function cityPrefixes(params: ParamsDoc): string[] {
  return cityBlocksOf(params).map((block) => block.prefix);
}

/** Тело PATCH для нового города: четыре нулевых параметра. */
export function cityParamsPatch(prefix: string): ParamsDoc {
  return {
    [`${prefix}_nights`]: 0,
    [`${prefix}_hotel`]: 0,
    [`${prefix}_food`]: 0,
    [`${prefix}_transport`]: 0,
  };
}
