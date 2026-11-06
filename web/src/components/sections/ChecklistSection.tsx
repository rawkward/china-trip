import { useMemo, useState } from "react";
import { CHECKS } from "../../content/checks";
import { readJson, writeJson, STORAGE_KEYS } from "../../lib/storage";
import { cn } from "../../lib/cn";
import { Button, Checkbox } from "../ui";
import { Section } from "../layout/Section";

interface FlatItem {
  id: string;
  group: string;
  index: number;
  html: string;
}

const TOTAL = CHECKS.reduce((n, g) => n + g.items.length, 0);

/** Плоский список пунктов: id = «chk-<группа>-<номер>» (стабилен, пока не переставили). */
const FLAT: FlatItem[] = CHECKS.flatMap((group, gi) =>
  group.items.map((html, ii) => ({ id: `chk-${gi}-${ii}`, group: group.cap, index: gi, html })),
);

/** Чек-лист: отметки живут в localStorage этого браузера. */
export function ChecklistSection() {
  const [state, setState] = useState<Record<string, boolean>>(() =>
    readJson<Record<string, boolean>>(STORAGE_KEYS.checklist, {}),
  );

  const done = useMemo(() => Object.values(state).filter(Boolean).length, [state]);

  const toggle = (id: string, checked: boolean) => {
    setState((prev) => {
      const next = { ...prev, [id]: checked };
      writeJson(STORAGE_KEYS.checklist, next);
      return next;
    });
  };

  const reset = () => {
    setState({});
    writeJson(STORAGE_KEYS.checklist, {});
  };

  const progress = TOTAL ? Math.round((done / TOTAL) * 100) : 0;

  return (
    <Section
      id="checklist"
      action={
        <div className="flex items-center gap-3">
          <span className="text-[0.82rem] font-medium text-muted">
            Отмечено {done} из {TOTAL}
          </span>
          <Button variant="ghost" size="sm" onClick={reset}>
            Сбросить
          </Button>
        </div>
      }
    >
      <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-paper-deep">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {CHECKS.map((group, gi) => (
          <div key={group.cap} className="surface p-4 sm:p-5">
            <h3 className="mb-2 flex items-baseline gap-2 text-[1rem]">
              {group.cap}
              <span className="tag-pill">{group.items.length}</span>
            </h3>
            <div className="grid gap-0.5">
              {group.items.map((html, ii) => {
                const id = `chk-${gi}-${ii}`;
                return (
                  <Checkbox
                    key={id}
                    id={id}
                    checked={Boolean(state[id])}
                    onChange={(checked) => toggle(id, checked)}
                    className={cn(state[id] && "opacity-80")}
                  >
                    <span dangerouslySetInnerHTML={{ __html: html }} />
                  </Checkbox>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[0.78rem] text-muted-soft">
        Отметки сохраняются в этом браузере — на другом устройстве список будет чистым.
      </p>
      {/* FLAT держим рядом: он же задаёт id пунктов и годится для тестов */}
      <span hidden data-check-total={TOTAL} data-check-flat={FLAT.length} />
    </Section>
  );
}
