import { formatRub } from "@shared/budget-core.js";
import { cn } from "../../lib/cn";
import { formatRate } from "../../lib/budget/numbers";
import type { BudgetTotals, ParamsDoc } from "../../lib/budget/types";

interface SummaryProps {
  totals: BudgetTotals | null;
  params: ParamsDoc;
}

export function Summary({ totals, params }: SummaryProps) {
  const cards = [
    { key: "total", label: "Итого", value: totals ? formatRub(totals.total) : "—", accent: true },
    { key: "base", label: "База", value: totals ? formatRub(totals.base) : "—" },
    { key: "reserve", label: "Резерв", value: totals ? formatRub(totals.reserve) : "—" },
    { key: "per-person", label: "На человека", value: totals ? formatRub(totals.perPerson) : "—" },
    { key: "per-day", label: "На человека в день", value: totals ? formatRub(totals.perDay) : "—" },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((card) => (
          <div
            key={card.key}
            data-summary={card.key}
            className={cn(
              "surface p-3 sm:p-4",
              card.accent && "border-accent/25 bg-accent-soft/40",
            )}
          >
            <div className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted">
              {card.label}
            </div>
            <div
              data-summary-value={card.key}
              className={cn(
                "mt-1 font-display text-[1.1rem] font-semibold tabular-nums sm:text-[1.25rem]",
                card.accent && "text-accent-ink",
              )}
            >
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {totals && totals.categories.length > 0 && (
        <div className="mt-3 grid gap-x-4 gap-y-1 rounded-card border border-line bg-surface/70 px-3 py-2 sm:grid-cols-2 lg:grid-cols-4">
          {totals.categories.map((category, index) => (
            <div
              key={category.id || `bucket-${index}`}
              className="flex items-baseline justify-between gap-2 border-b border-line/60 py-1 last:border-0 sm:border-0"
            >
              <span className="truncate text-[0.78rem] text-muted">
                {category.name || "Без категории"}
              </span>
              <span className="shrink-0 text-[0.8rem] font-medium tabular-nums">
                {formatRub(category.subtotal)}
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="mt-2 text-[0.76rem] text-muted-soft">
        Валюта — рубли.{" "}
        {Number.isFinite(params.cny_rate) && Number.isFinite(params.hkd_rate)
          ? `Курс: ¥${formatRate(params.cny_rate)} · HK$${formatRate(params.hkd_rate)} за единицу.`
          : "Курс не задан."}
      </p>
    </div>
  );
}
