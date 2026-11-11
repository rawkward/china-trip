import { useState } from "react";
import { BOOKING } from "../../content/booking";
import { readJson, writeJson, STORAGE_KEYS } from "../../lib/storage";
import { Button, Checkbox } from "../ui";
import { cn } from "../../lib/cn";
import { Section } from "../layout/Section";

/** Куплено ли: отметка «b-<индекс>» в localStorage, по умолчанию — из поля done. */
function markId(index: number): string {
  return `b-${index}`;
}

/** Брони чек-листом: сроки сверху вниз, ссылка — внутри строки, галочка живёт в браузере. */
export function BookingSection() {
  const [marks, setMarks] = useState<Record<string, boolean>>(() =>
    readJson<Record<string, boolean>>(STORAGE_KEYS.booking, {}),
  );

  const isDone = (index: number) => marks[markId(index)] ?? Boolean(BOOKING[index].done);
  const doneCount = BOOKING.reduce((sum, _row, i) => sum + (isDone(i) ? 1 : 0), 0);

  const toggle = (index: number, checked: boolean) => {
    setMarks((prev) => {
      const next = { ...prev, [markId(index)]: checked };
      writeJson(STORAGE_KEYS.booking, next);
      return next;
    });
  };

  const reset = () => {
    writeJson(STORAGE_KEYS.booking, {});
    setMarks({});
  };

  return (
    <Section
      id="booking"
      action={
        <div className="flex items-center gap-3">
          <span className="text-[0.82rem] font-medium text-muted">
            Куплено {doneCount} из {BOOKING.length}
          </span>
          <Button variant="ghost" size="sm" onClick={reset} disabled={Object.keys(marks).length === 0}>
            Сбросить
          </Button>
        </div>
      }
    >
      <ol className="grid gap-3">
        {BOOKING.map((row, i) => (
          <li
            key={i}
            className={cn(
              "surface grid gap-x-5 gap-y-1.5 p-4 sm:grid-cols-[9.5rem_1fr] sm:p-5",
              isDone(i) && "opacity-70",
            )}
          >
            <div className="flex items-baseline gap-2 sm:block">
              <span className="text-[0.7rem] font-bold tracking-[0.12em] text-muted-soft uppercase">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="tag-pill sm:mt-1">{row.when}</span>
            </div>
            <Checkbox
              id={markId(i)}
              checked={isDone(i)}
              onChange={(checked) => toggle(i, checked)}
            >
              <span
                className="[&_a]:link-quiet [&_b]:font-semibold"
                dangerouslySetInnerHTML={{ __html: row.it }}
              />
            </Checkbox>
          </li>
        ))}
      </ol>
    </Section>
  );
}
