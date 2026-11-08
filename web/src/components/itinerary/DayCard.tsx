import { ChevronDown, MapPin, Pencil } from "lucide-react";
import { CITIES, PLACES } from "@/data";
import type { Day } from "@/types";
import { cn } from "@/lib/cn";
import { stopNumbers } from "@/lib/map";
import { moveInOrder } from "@/lib/texts";
import { Button, IconButton } from "../ui";
import { InlineEditor, hasText, type ItineraryEditApi } from "./EditableText";
import { DayNote } from "./DayNote";
import { StopRow } from "./StopRow";
import { slugOfStop } from "./stopMeta";

export interface DayCardProps {
  day: Day;
  dayKey: string;
  /** Правки текста именно этого дня (уже наложены через withTexts). */
  texts: Record<string, string>;
  api: ItineraryEditApi;
  open: boolean;
  onToggle: () => void;
  onFocusDay: (n: number) => void;
}

function stopCountWord(n: number): string {
  const tail = n % 100;
  if (tail >= 11 && tail <= 14) return "остановок";
  const last = n % 10;
  if (last === 1) return "остановка";
  if (last >= 2 && last <= 4) return "остановки";
  return "остановок";
}

/** Карточка дня: шапка-аккордеон, остановки, карта и заметка. */
export function DayCard({ day, dayKey, texts, api, open, onToggle, onFocusDay }: DayCardProps) {
  const city = CITIES[day.city] ?? { label: day.city, color: "#8a8278" };
  const isFest = day.places.some((p) => p.tag === "festival");
  const count = day.places.length;
  const bodyId = "day-body-" + day.n;
  const headerField =
    api.token !== null && (api.editing.text === "title" || api.editing.text === "sub")
      ? api.editing.text
      : null;
  const order = day.places.map(slugOfStop);
  const mapNums = stopNumbers(day, PLACES);

  const handleMove = (slug: string, dir: "up" | "down") => {
    const next = moveInOrder(order, slug, dir);
    if (next === order) return;
    const hidden = (day._hidden ?? []).map(slugOfStop);
    void api.saveText(dayKey, "order", next.concat(hidden).join(","));
  };

  const hiddenList = () => (texts.hide ?? "").split(",").filter((slug) => slug.length > 0);

  const handleDelete = (slug: string) => {
    const list = hiddenList();
    if (list.indexOf(slug) === -1) list.push(slug);
    void api.saveText(dayKey, "hide", list.join(","));
  };

  const handleRestore = (slug: string) => {
    const list = hiddenList().filter((item) => item !== slug);
    void api.saveText(dayKey, "hide", list.join(","));
  };

  return (
    <article
      className={cn(
        "surface min-w-0 overflow-hidden",
        isFest && "border-accent/35 bg-accent-soft/20",
      )}
    >
      <div className="flex items-stretch gap-0.5 pr-1">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={bodyId}
          className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-3 text-left transition-colors hover:bg-paper-deep/40 sm:gap-3 sm:px-4"
          onClick={onToggle}
        >
          <span className="w-9 shrink-0 font-display text-[1.4rem] font-bold leading-none text-accent sm:w-11">
            Д{day.n}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-[1rem] font-semibold leading-snug text-ink sm:text-[1.06rem]">
              {day.title}
              {isFest && (
                <span className="ml-2 inline-block rounded-full bg-accent px-1.5 py-0.5 align-[2px] text-[0.6rem] font-bold uppercase tracking-wide text-paper">
                  фестиваль
                </span>
              )}
              {hasText(texts, "title") && (
                <span className="ml-1.5 text-[0.6rem] font-bold uppercase tracking-wide text-accent">
                  правка
                </span>
              )}
            </span>
            <span className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-1.5 text-[0.8rem] text-muted">
              <span
                className="shrink-0 rounded-full px-1.5 py-0.5 text-[0.62rem] font-bold uppercase tracking-wide sm:hidden"
                style={{ backgroundColor: city.color + "1a", color: city.color }}
              >
                {city.label}
              </span>
              <span className="min-w-0 truncate">
                {day.date} · {day.sub}
              </span>
              {hasText(texts, "sub") && (
                <span className="shrink-0 text-[0.6rem] font-bold uppercase tracking-wide text-accent">
                  правка
                </span>
              )}
            </span>
          </span>
          <span
            className="hidden shrink-0 rounded-full px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-wide sm:inline-block"
            style={{ backgroundColor: city.color + "1a", color: city.color }}
          >
            {city.label}
          </span>
          <span className="shrink-0 text-[0.72rem] tabular-nums text-muted" title="остановок">
            {count} <span className="hidden sm:inline">{stopCountWord(count)}</span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "size-4 shrink-0 text-muted transition-transform",
              open && "rotate-180",
            )}
          />
        </button>

        {api.token && (
          <div className="flex shrink-0 flex-col justify-center gap-0.5">
            <IconButton
              label="править заголовок дня"
              className="size-8 border-transparent bg-transparent"
              onClick={() => api.setEditing({ text: "title" })}
            >
              <Pencil className="size-3.5" aria-hidden="true" />
            </IconButton>
            <IconButton
              label="править подзаголовок дня"
              className="size-8 border-transparent bg-transparent"
              onClick={() => api.setEditing({ text: "sub" })}
            >
              <Pencil className="size-3.5" aria-hidden="true" />
            </IconButton>
          </div>
        )}
      </div>

      {headerField && (
        <div className="border-t border-line/70 px-3 py-2 sm:px-4">
          <InlineEditor
            field={headerField}
            value={headerField === "title" ? day.title : day.sub}
            edited={hasText(texts, headerField)}
            ariaLabel={headerField === "title" ? "Заголовок дня" : "Подзаголовок дня"}
            onSave={(f, v) => void api.saveText(dayKey, f, v)}
            onCancel={() => api.setEditing({ text: undefined })}
          />
        </div>
      )}

      {open && (
        <div id={bodyId} role="region" aria-label={"День " + day.n}>
          <div className="border-t border-line px-3 pb-3 pt-2 sm:px-4">
            <ul className="m-0 list-none p-0">
              {day.places.map((stop, i) => (
                <StopRow
                  key={slugOfStop(stop) + "-" + i}
                  day={day}
                  dayKey={dayKey}
                  stop={stop}
                  texts={texts}
                  api={api}
                  index={i}
                  total={day.places.length}
                  mapNum={mapNums[i] ?? null}
                  mapColor={city.color}
                  onMove={handleMove}
                  onDelete={handleDelete}
                />
              ))}
            </ul>

            {day.places.length === 0 && (
              <p className="mt-2 text-[0.82rem] text-muted">в этом дне не осталось остановок</p>
            )}

            {api.token && !!day._hidden?.length && (
              <div className="mt-2 rounded-lg border border-dashed border-line bg-paper-deep/30 px-2.5 py-2">
                <p className="m-0 text-[0.7rem] font-bold uppercase tracking-wide text-muted">
                  убрано из маршрута · справочник не меняется
                </p>
                <ul className="m-0 mt-1 list-none p-0">
                  {day._hidden.map((stop, i) => (
                    <li
                      key={slugOfStop(stop) + "-" + i}
                      className="flex items-center justify-between gap-2 py-0.5 text-[0.8rem] text-muted"
                    >
                      <span className="min-w-0 truncate">{stop.title ?? stop.name ?? ""}</span>
                      <button
                        type="button"
                        className="shrink-0 rounded-md border border-line bg-surface px-1.5 py-0.5 text-[0.72rem] font-semibold text-muted transition-colors hover:border-line-strong hover:text-accent"
                        aria-label={"вернуть " + (stop.title ?? stop.name ?? "")}
                        onClick={() => handleRestore(slugOfStop(stop))}
                      >
                        вернуть
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-3">
              <Button variant="primary" size="sm" onClick={() => onFocusDay(day.n)}>
                <MapPin className="size-3.5" aria-hidden="true" />
                Показать на карте
              </Button>
            </div>

            <DayNote dayKey={dayKey} note={api.dayNotes[dayKey]} edits={api} />
          </div>
        </div>
      )}
    </article>
  );
}
