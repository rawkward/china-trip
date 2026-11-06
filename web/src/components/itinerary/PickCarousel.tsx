import { useState } from "react";
import { GUIDE_ITEMS } from "@/data";
import { guideIdFor } from "@/lib/guide";
import { cn } from "@/lib/cn";
import { stopFieldSet, stopKey } from "@/lib/texts";
import type { Pick } from "@/types";
import { EditableText, hasText, type ItineraryEditApi } from "./EditableText";
import { StopNote } from "./StopNote";

export interface PickCarouselProps {
  dayKey: string;
  groupSlug: string;
  picks: Pick[];
  texts: Record<string, string>;
  api: ItineraryEditApi;
}

function isRecommended(pick: Pick, index: number): boolean {
  return pick.rec === true || (index === 0 && pick.rec !== false);
}

/**
 * Карусель равноправных вариантов одного слота. Индекс живёт в компоненте,
 * поэтому правки текста не сбрасывают выбранный вариант.
 */
export function PickCarousel({ dayKey, groupSlug, picks, texts, api }: PickCarouselProps) {
  const [state, setState] = useState(0);
  if (!picks.length) return null;

  const index = Math.min(state, picks.length - 1);
  const pick = picks[index];
  const fields = stopFieldSet(groupSlug, index) as { name: string; cost: string; dim: string };
  const guideId = guideIdFor(GUIDE_ITEMS, pick.name) || guideIdFor(GUIDE_ITEMS, pick._name);
  const recommended = isRecommended(pick, index);
  const noteKey = stopKey(dayKey, pick._name ?? pick.name);

  const go = (next: number) => setState((next + picks.length) % picks.length);

  return (
    <div className="mt-1.5 min-w-0 border-l-2 border-accent/25 pl-2.5 sm:pl-3">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wide",
            recommended
              ? "border-accent/25 bg-accent-soft text-accent-ink"
              : "border-line bg-paper-deep text-muted",
          )}
        >
          {recommended ? "рекомендуем" : "альтернатива"}
        </span>
      </div>

      <div className="mt-1 min-w-0 text-[0.9rem] font-semibold leading-snug text-ink">
        <EditableText
          dayKey={dayKey}
          field={fields.name}
          value={pick.name}
          edited={hasText(texts, fields.name)}
          api={api}
          ariaLabel="название варианта"
        />
        {guideId && (
          <a
            href={"#g-" + guideId}
            className="ml-1.5 whitespace-nowrap text-[0.72rem] font-semibold text-accent underline decoration-dotted underline-offset-2"
          >
            в справочнике
          </a>
        )}
      </div>

      {pick.note && (
        <StopNote stopKey={noteKey} original={pick.note} edits={api} />
      )}

      {pick.cost && (
        <div className="mt-1 text-[0.76rem] font-semibold tabular-nums text-accent">
          <EditableText
            dayKey={dayKey}
            field={fields.cost}
            value={pick.cost}
            edited={hasText(texts, fields.cost)}
            api={api}
            ariaLabel="цена варианта"
          />
        </div>
      )}

      {pick.dim && (
        <div className="mt-0.5 text-[0.72rem] leading-relaxed text-muted-soft">
          <EditableText
            dayKey={dayKey}
            field={fields.dim}
            value={pick.dim}
            edited={hasText(texts, fields.dim)}
            api={api}
            kind="text"
            ariaLabel="оговорка варианта"
          />
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          aria-label="предыдущий вариант"
          className="inline-flex size-10 items-center justify-center rounded-lg border border-line bg-surface text-[1.05rem] text-muted transition-colors hover:border-line-strong hover:text-accent"
          onClick={() => go(index - 1)}
        >
          ‹
        </button>
        <div className="flex items-center gap-0.5">
          {picks.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={"вариант " + (i + 1)}
              aria-pressed={i === index}
              className="inline-flex size-8 items-center justify-center rounded-full p-0 transition-colors hover:bg-paper-deep"
              onClick={() => setState(i)}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "size-2 rounded-full transition-colors",
                  i === index ? "bg-accent" : "bg-line-strong",
                )}
              />
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-label="следующий вариант"
          className="inline-flex size-10 items-center justify-center rounded-lg border border-line bg-surface text-[1.05rem] text-muted transition-colors hover:border-line-strong hover:text-accent"
          onClick={() => go(index + 1)}
        >
          ›
        </button>
        <span className="ml-0.5 text-[0.72rem] tabular-nums text-muted-soft">
          {index + 1} / {picks.length}
        </span>
      </div>
    </div>
  );
}
