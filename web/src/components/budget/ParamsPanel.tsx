import { useState } from "react";
import { cityBlocksOf } from "../../lib/budget/params";
import { formatDateIso, formatDateSeconds } from "../../lib/budget/numbers";
import type { FxRate, ParamsDoc } from "../../lib/budget/types";
import { AddCityForm } from "./AddCityForm";
import { CityParams } from "./CityParams";
import { NumberField } from "./NumberField";

interface ParamsPanelProps {
  params: ParamsDoc;
  paramsUpdatedAt: number | null;
  fx: FxRate | null;
  fxFailed: boolean;
  saved: boolean;
  disabled: boolean;
  resetKey: number;
  onParamChange: (key: string, value: number) => void;
  onAddCity: (prefix: string) => void;
}

function isDesktop(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(min-width: 941px)").matches
    : true;
}

function fxNoteText(fx: FxRate | null, fxFailed: boolean, updatedAt: number | null): string {
  const parts: string[] = [];
  if (fx) {
    const date = formatDateIso(fx.date);
    parts.push(date ? `курс ЦБ на ${date}` : "курс ЦБ получен");
  } else if (fxFailed) {
    parts.push("курс не обновлён");
  }
  if (updatedAt) parts.push(`сохранён ${formatDateSeconds(updatedAt)}`);
  return parts.length ? parts.join(" · ") : "курс не обновлён";
}

/** Параметры бюджета: люди, дни, резерв, курсы и блоки городов. */
export function ParamsPanel({
  params,
  paramsUpdatedAt,
  fx,
  fxFailed,
  saved,
  disabled,
  resetKey,
  onParamChange,
  onAddCity,
}: ParamsPanelProps) {
  const [open, setOpen] = useState(isDesktop);
  const blocks = cityBlocksOf(params);
  const existing = blocks.map((block) => block.prefix);

  return (
    <details
      className="surface mt-4 overflow-hidden"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="cursor-pointer select-none px-4 py-3 text-[0.95rem] font-semibold marker:text-accent">
        Параметры
        {saved && (
          <span role="status" className="ml-3 text-[0.75rem] font-medium text-accent">
            сохранено
          </span>
        )}
      </summary>

      <div className="border-t border-line px-4 py-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <NumberField
            paramKey="people"
            label="Человек"
            value={params.people}
            min={1}
            step="1"
            disabled={disabled}
            resetKey={resetKey}
            onChange={onParamChange}
          />
          <NumberField
            paramKey="trip_days"
            label="Дней поездки"
            value={params.trip_days}
            min={1}
            step="1"
            disabled={disabled}
            resetKey={resetKey}
            onChange={onParamChange}
          />
          <NumberField
            paramKey="reserve_pct"
            label="Резерв, %"
            hint="доля от базы"
            value={params.reserve_pct}
            scale={100}
            min={0}
            max={100}
            step="0.1"
            disabled={disabled}
            resetKey={resetKey}
            onChange={onParamChange}
          />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <NumberField
            paramKey="cny_rate"
            label="CNY, ₽ за 1 ¥"
            value={params.cny_rate}
            step="0.0001"
            disabled={disabled}
            resetKey={resetKey}
            onChange={onParamChange}
          />
          <NumberField
            paramKey="hkd_rate"
            label="HKD, ₽ за 1 HK$"
            value={params.hkd_rate}
            step="0.0001"
            disabled={disabled}
            resetKey={resetKey}
            onChange={onParamChange}
          />
        </div>
        <p className="mt-1.5 text-[0.72rem] text-muted-soft">
          {fxNoteText(fx, fxFailed, paramsUpdatedAt)}
        </p>

        <CityParams
          blocks={blocks}
          disabled={disabled}
          resetKey={resetKey}
          onParamChange={onParamChange}
        />

        <AddCityForm existing={existing} disabled={disabled} onAdd={onAddCity} />

        <p className="mt-3 text-[0.72rem] text-muted-soft">Изменения сохраняются автоматически.</p>
      </div>
    </details>
  );
}
