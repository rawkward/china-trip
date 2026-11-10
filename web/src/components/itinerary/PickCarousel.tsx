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
  layout?: "carousel" | "list";
}

function isRecommended(pick: Pick, index: number): boolean {
  return pick.rec === true || (index === 0 && pick.rec !== false);
}

/**
 * Карусель равноправных вариантов одного слота. Индекс живёт в компоненте,
 * поэтому правки текста не сбрасывают выбранный вариант.
 */
export function PickCarousel({ dayKey, groupSlug, picks, texts, api, layout }: PickCarouselProps) {
  const [state, setState] = useState(0);
  if (!picks.length) return null;

  if (layout === "list") {
    return (
      <ul className="mt-1.5 m-0 list-none space-y-1.5 p-0 border-l-2 border-accent/25 pl-2.5 sm:pl-3">
        {picks.map((item, i) => {
          const f = stopFieldSet(groupSlug, i) as { name: string; cost: string };
          const otherGuide = guideIdFor(GUIDE_ITEMS, item.name) || guideIdFor(GUIDE_ITEMS, item._name);
          return (
            <li key={i} className="border-b border-dashed border-line pb-1.5 last:border-b-0 last:pb-0">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-[0.9rem] font-semibold leading-snug text-ink">
                  <EditableText
                    dayKey={dayKey}
                    field={f.name}
                    value={item.name}
                    edited={hasText(texts, f.name)}
                    api={api}
                    ariaLabel="название варианта"
                  />
                </span>
                {item.rec === true && (
                  <span className="rounded-full border border-accent/25 bg-accent-soft px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-accent-ink">
                    наш выбор
                  </span>
                )}
                {otherGuide && (
                  <a
                    href={"#g-" + otherGuide}
                    className="whitespace-nowrap text-[0.72rem] font-semibold text-accent underline decoration-dotted underline-offset-2"
                  >
                    в справочнике
                  </a>
                )}
                {item.cost && (
                  <span className="ml-auto shrink-0 text-[0.78rem] font-semibold tabular-nums text-accent">
                    <EditableText
                      dayKey={dayKey}
                      field={f.cost}
                      value={item.cost}
                      edited={hasText(texts, f.cost)}
                      api={api}
                      ariaLabel="цена варианта"
                    />
                  </span>
                )}
              </div>
              {item.note && <StopNote stopKey={stopKey(dayKey, item._name ?? item.name)} original={item.note} edits={api} />}
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener"
                  className="mt-1 inline-flex items-center rounded-full border border-accent/30 bg-accent-soft px-2.5 py-1 text-[0.72rem] font-semibold text-accent-ink transition-colors hover:border-accent"
                >
                  открыть на Trip.com →
                </a>
              )}
            </li>
          );
        })}
      </ul>
    );
  }

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

      {pick.url && (
        <a
          href={pick.url}
          target="_blank"
          rel="noopener"
          className="mt-1.5 inline-flex items-center rounded-full border border-accent/30 bg-accent-soft px-2.5 py-1 text-[0.74rem] font-semibold text-accent-ink transition-colors hover:border-accent"
        >
          открыть на Trip.com →
        </a>
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
