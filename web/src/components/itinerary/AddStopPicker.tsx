import { useState } from "react";
import { GUIDE_ITEMS } from "@/data";
import { serializeAddedStops, parseAddedStops, tagForGuideKind } from "@/lib/added-stops";
import { cn } from "@/lib/cn";
import { stopSlug } from "@/lib/slug";
import type { AddedStop } from "@/lib/added-stops";
import type { GuideItem } from "@/types";
import { Button, Input } from "../ui";
import type { ItineraryEditApi } from "./EditableText";

interface AddStopPickerProps {
  dayKey: string;
  city: string;
  texts: Record<string, string>;
  api: ItineraryEditApi;
  existingSlugs: string[];
  onClose: () => void;
}

function matchesQuery(item: GuideItem, query: string): boolean {
  if (!query) return true;
  const q = query.toLocaleLowerCase();
  return (item.en ?? "").toLocaleLowerCase().indexOf(q) !== -1 ||
    (item.zh ?? "").toLocaleLowerCase().indexOf(q) !== -1;
}

/** Добавление остановки в день: своя или карточкой справочника. */
export function AddStopPicker({ dayKey, city, texts, api, existingSlugs, onClose }: AddStopPickerProps) {
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [ownSlugs, setOwnSlugs] = useState<string[]>([]);
  const [dup, setDup] = useState(false);

  const exists = (slug: string) =>
    existingSlugs.indexOf(slug) !== -1 || ownSlugs.indexOf(slug) !== -1;

  const duplicate = name.trim().length > 0 && exists(stopSlug(name.trim()));

  const save = (item: AddedStop) => {
    const current = parseAddedStops(texts.add);
    if (current.some((a) => a.s === item.s) || exists(item.s)) return;
    setOwnSlugs((list) => (list.indexOf(item.s) === -1 ? [...list, item.s] : list));
    void api.saveText(dayKey, "add", serializeAddedStops([...current, item]));
  };

  const addOwn = () => {
    const title = name.trim();
    if (!title) return;
    const slug = stopSlug(title);
    if (exists(slug)) {
      setDup(true);
      return;
    }
    save({ s: slug, n: title });
    setDup(false);
    setName("");
  };

  const items = GUIDE_ITEMS.filter(
    (it) => it.kind !== "tip" && it.city === city && matchesQuery(it, query),
  ).slice(0, 40);

  return (
    <div className="mt-2 flex flex-col gap-2 rounded-xl border border-line bg-surface p-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <Input
          aria-label="название новой остановки"
          className="h-8 min-w-0 flex-1 py-1 text-[0.82rem]"
          placeholder="своя остановка"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setDup(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") addOwn();
          }}
        />
        <Button size="sm" variant="primary" disabled={!name.trim() || duplicate} onClick={addOwn}>
          добавить
        </Button>
        {(duplicate || dup) && (
          <span role="status" className="px-1 text-[0.76rem] text-muted">
            уже в дне
          </span>
        )}
      </div>

      <Input
        aria-label="поиск по справочнику"
        className="h-8 py-1 text-[0.82rem]"
        placeholder="поиск по справочнику"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="flex max-h-60 flex-col gap-1 overflow-auto">
        {items.map((it) => {
          const slug = stopSlug(it.en);
          const already = exists(slug);
          return (
            <button
              key={it.kind + "|" + it.city + "|" + it.id}
              type="button"
              disabled={already}
              className={cn(
                "rounded-lg border px-2 py-1 text-left text-[0.78rem] transition-colors",
                already
                  ? "cursor-not-allowed border-line bg-paper-deep/40 text-muted"
                  : "border-line bg-surface text-ink hover:border-accent hover:text-accent",
              )}
              onClick={() =>
                save({
                  s: slug,
                  n: it.en,
                  t: tagForGuideKind(it.kind),
                  d: it.note?.slice(0, 300),
                  g: it.id,
                })
              }
            >
              {it.en}
              {it.zh ? " — " + it.zh : ""}
              {already ? " · уже в дне" : ""}
            </button>
          );
        })}
        {!items.length && (
          <span className="px-1 py-0.5 text-[0.76rem] text-muted">в этом городе карточек нет</span>
        )}
      </div>

      <div className="flex justify-end">
        <Button size="sm" variant="ghost" onClick={onClose}>
          готово
        </Button>
      </div>
    </div>
  );
}
