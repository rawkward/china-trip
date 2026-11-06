import { cityLabel } from "../../lib/budget/labels";
import type { CityBlock } from "../../lib/budget/params";
import { NumberField } from "./NumberField";

interface CityParamsProps {
  blocks: CityBlock[];
  disabled: boolean;
  resetKey: number;
  onParamChange: (key: string, value: number) => void;
}

/** Блоки городов: ночи, отель, еда и транспорт. */
export function CityParams({ blocks, disabled, resetKey, onParamChange }: CityParamsProps) {
  return (
    <div className="mt-5 space-y-4">
      {blocks.map((block) => (
        <div key={block.prefix} className="rounded-xl border border-line bg-paper/50 p-3">
          <h4 className="mb-2 text-[0.9rem]">{cityLabel(block.prefix)}</h4>
          <div className="grid gap-3 sm:grid-cols-4">
            <NumberField
              paramKey={`${block.prefix}_nights`}
              label="Ночей"
              value={block.nights}
              step="1"
              disabled={disabled}
              resetKey={resetKey}
              onChange={onParamChange}
            />
            <NumberField
              paramKey={`${block.prefix}_hotel`}
              label="Отель, ¥/ночь"
              value={block.hotel}
              step="any"
              disabled={disabled}
              resetKey={resetKey}
              onChange={onParamChange}
            />
            <NumberField
              paramKey={`${block.prefix}_food`}
              label="Еда, ¥/день"
              value={block.food}
              step="any"
              disabled={disabled}
              resetKey={resetKey}
              onChange={onParamChange}
            />
            <NumberField
              paramKey={`${block.prefix}_transport`}
              label="Транспорт, ¥/день"
              value={block.transport}
              step="any"
              disabled={disabled}
              resetKey={resetKey}
              onChange={onParamChange}
            />
          </div>
        </div>
      ))}
      {blocks.length === 0 && <p className="text-[0.8rem] text-muted">Города не заданы.</p>}
    </div>
  );
}
