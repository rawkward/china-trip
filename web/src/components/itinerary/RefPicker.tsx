import { GUIDE_ITEMS } from "@/data";
import { guideTagKey, refKindForTag } from "@/lib/guide";
import { cn } from "@/lib/cn";
import type { DayTag } from "@/types";
import type { ItineraryEditApi } from "./EditableText";

interface RefPickerProps {
  dayKey: string;
  city: string;
  tag?: DayTag;
  field: string;
  current: string;
  api: ItineraryEditApi;
}

/** Выбор карточки справочника вместо текста остановки. */
export function RefPicker({ dayKey, city, tag, field, current, api }: RefPickerProps) {
  const kind = refKindForTag(tag);
  const items = GUIDE_ITEMS.filter((it) => it.kind === kind && it.city === city).slice(0, 40);

  const pick = (value: string) => {
    api.setEditing({ ref: undefined });
    void api.saveText(dayKey, field, value);
  };

  return (
    <div className="mt-1.5 flex max-h-60 flex-col gap-1 overflow-auto rounded-xl border border-line bg-surface p-1.5">
      <button
        type="button"
        className={cn(
          "rounded-lg border px-2 py-1 text-left text-[0.78rem] transition-colors",
          current
            ? "border-line bg-surface text-ink hover:border-accent hover:text-accent"
            : "border-accent bg-accent-soft text-accent-ink",
        )}
        onClick={() => pick("")}
      >
        оставить как есть
      </button>
      {items.map((it) => {
        const key = guideTagKey(it);
        const active = current === key;
        return (
          <button
            key={key}
            type="button"
            className={cn(
              "rounded-lg border px-2 py-1 text-left text-[0.78rem] transition-colors",
              active
                ? "border-accent bg-accent-soft text-accent-ink"
                : "border-line bg-surface text-ink hover:border-accent hover:text-accent",
            )}
            onClick={() => pick(key)}
          >
            {it.en}
            {it.zh ? " — " + it.zh : ""}
          </button>
        );
      })}
      {!items.length && (
        <span className="px-1 py-0.5 text-[0.76rem] text-muted">в этом городе карточек нет</span>
      )}
    </div>
  );
}
