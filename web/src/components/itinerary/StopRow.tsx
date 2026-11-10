import { GUIDE_ITEMS } from "@/data";
import type { Day, Stop } from "@/types";
import { guideIdFor } from "@/lib/guide";
import { groupFieldSet, stopFieldSet, stopKey } from "@/lib/texts";
import { EditableText, InlineEditor, hasText, type ItineraryEditApi } from "./EditableText";
import { PickCarousel } from "./PickCarousel";
import { RefPicker } from "./RefPicker";
import { StopAdminActions } from "./StopAdminActions";
import { StopNote } from "./StopNote";
import { StopTimeBadge } from "./StopTimeBadge";
import { slugOfStop, tagIcon } from "./stopMeta";

export interface StopRowProps {
  day: Day;
  dayKey: string;
  stop: Stop;
  texts: Record<string, string>;
  api: ItineraryEditApi;
  index: number;
  total: number;
  /** Номер метки этой остановки на карте дня или null, если её там нет. */
  mapNum: number | null;
  /** Цвет города — тот же, что у метки на карте. */
  mapColor?: string;
  onMove: (slug: string, dir: "up" | "down") => void;
  onDelete: (slug: string) => void;
}

/** Одна остановка дня или группа равноправных вариантов (карусель). */
export function StopRow({
  day,
  dayKey,
  stop,
  texts,
  api,
  index,
  total,
  mapNum,
  mapColor = "#8a8278",
  onMove,
  onDelete,
}: StopRowProps) {
  const slug = slugOfStop(stop);
  const isPicks = !!stop.picks && stop.picks.length > 0;
  const fields = stopFieldSet(slug) as { name: string; cost: string; time: string; ref: string };
  const groupFields = groupFieldSet(slug);
  const timeField = isPicks ? groupFields.time : fields.time;
  const refField = isPicks ? groupFields.ref : fields.ref;
  const timeEditing = api.token !== null && api.editing.time === timeField;
  const refOpen = api.token !== null && api.editing.ref === refField;

  const timeNode = (
    <StopTimeBadge
      time={stop._time}
      editable={api.token !== null}
      onEdit={() => api.setEditing({ time: timeField })}
    />
  );

  const admin = (
    <StopAdminActions
      token={api.token}
      index={index}
      total={total}
      time={stop._time}
      onMoveUp={() => onMove(slug, "up")}
      onMoveDown={() => onMove(slug, "down")}
      onEditTime={() => api.setEditing({ time: timeField })}
      onToggleRef={() => api.setEditing({ ref: refOpen ? undefined : refField })}
      onDelete={() => onDelete(slug)}
    />
  );

  const timeEditor = timeEditing ? (
    <InlineEditor
      field={timeField}
      value={stop._time ?? ""}
      edited={hasText(texts, timeField)}
      ariaLabel="Время остановки"
      onSave={(f, v) => void api.saveText(dayKey, f, v)}
      onCancel={() => api.setEditing({ time: undefined })}
    />
  ) : null;

  const refPicker = refOpen ? (
    <RefPicker
      dayKey={dayKey}
      city={day.city}
      tag={stop.tag}
      field={refField}
      current={texts[refField] ?? ""}
      api={api}
    />
  ) : null;

  if (isPicks) {
    return (
      <li className="flex gap-2.5 border-b border-dashed border-line py-2.5 last:border-b-0 sm:gap-3">
        <StopIcon tag={stop.tag} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            {timeNode}
            <span className="flex min-w-0 items-baseline gap-x-2">
              {mapNum !== null && <MapNumBadge n={mapNum} color={mapColor} />}
              <EditableText
                dayKey={dayKey}
                field={groupFields.title}
                value={stop.title ?? stop.name ?? ""}
                edited={hasText(texts, groupFields.title)}
                api={api}
                className="text-[0.9rem] font-semibold"
                ariaLabel="название группы вариантов"
              />
            </span>
            {stop.cost && (
              <span className="ml-auto shrink-0 text-[0.8rem] font-semibold tabular-nums text-accent">
                <EditableText
                  dayKey={dayKey}
                  field={groupFields.cost}
                  value={stop.cost}
                  edited={hasText(texts, groupFields.cost)}
                  api={api}
                  ariaLabel="цена группы"
                />
              </span>
            )}
          </div>

          {stop.note && (
            <EditableText
              dayKey={dayKey}
              field={groupFields.note}
              value={stop.note}
              edited={hasText(texts, groupFields.note)}
              api={api}
              kind="text"
              className="mt-0.5 block text-[0.82rem] leading-relaxed text-muted"
              ariaLabel="описание группы"
            />
          )}

          {stop.url && (
            <a
              href={stop.url}
              target="_blank"
              rel="noopener"
              className="mt-1 inline-flex items-center rounded-full border border-accent/30 bg-accent-soft px-2.5 py-1 text-[0.74rem] font-semibold text-accent-ink transition-colors hover:border-accent"
            >
              расписание и билеты на Trip.com →
            </a>
          )}

          <PickCarousel
            dayKey={dayKey}
            groupSlug={slug}
            picks={stop.picks ?? []}
            texts={texts}
            api={api}
            layout={stop.layout}
          />

          {timeEditor}
          {admin}
          {refPicker}
        </div>
      </li>
    );
  }

  const stopOriginal = stop._name ?? stop.name ?? "";
  const guideId = guideIdFor(GUIDE_ITEMS, stop.name) || guideIdFor(GUIDE_ITEMS, stop._name);
  const ref = texts[fields.ref] ?? "";
  const refId = ref.split("|")[2] ?? "";
  const refHref = refId && GUIDE_ITEMS.some((it) => it.id === refId) ? "#g-" + refId : "";

  return (
    <li className="flex gap-2.5 border-b border-dashed border-line py-2.5 last:border-b-0 sm:gap-3">
      <StopIcon tag={stop.tag} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          {timeNode}
          <span className="flex min-w-0 items-baseline gap-x-2">
            {mapNum !== null && <MapNumBadge n={mapNum} color={mapColor} />}
            <EditableText
              dayKey={dayKey}
              field={fields.name}
              value={stop.name ?? ""}
              edited={hasText(texts, fields.name)}
              api={api}
              className="text-[0.9rem] font-semibold"
              ariaLabel="название остановки"
            />
          </span>
          {guideId && (
            <a
              href={"#g-" + guideId}
              className="whitespace-nowrap text-[0.72rem] font-semibold text-accent underline decoration-dotted underline-offset-2"
            >
              в справочнике
            </a>
          )}
          {refHref && (
            <a
              href={refHref}
              className="whitespace-nowrap text-[0.72rem] font-semibold text-accent underline decoration-dotted underline-offset-2"
            >
              карточка справочника
            </a>
          )}
          {stop.cost && (
            <span className="ml-auto shrink-0 text-[0.8rem] font-semibold tabular-nums text-accent">
              <EditableText
                dayKey={dayKey}
                field={fields.cost}
                value={stop.cost}
                edited={hasText(texts, fields.cost)}
                api={api}
                ariaLabel="цена остановки"
              />
            </span>
          )}
        </div>

        <StopNote stopKey={stopKey(dayKey, stopOriginal)} original={stop.note} edits={api} />

        {stop.map && <CollapsedMap map={stop.map} />}

        {timeEditor}
        {admin}
        {refPicker}
      </div>
    </li>
  );
}

/** Кружок с номером точки — визуальная копия метки на карте дня. */
function MapNumBadge({ n, color }: { n: number; color: string }) {
  return (
    <span
      title={"точка " + n + " на карте"}
      className="inline-flex shrink-0 items-center justify-center rounded-full text-[0.68rem] font-bold leading-none tabular-nums text-white"
      style={{
        width: "1.15rem",
        height: "1.15rem",
        backgroundColor: color,
        boxShadow: "0 0 0 1.5px #fff",
      }}
    >
      <span aria-hidden="true">{n}</span>
      <span className="sr-only">точка {n} на карте</span>
    </span>
  );
}

function StopIcon({ tag }: { tag?: Stop["tag"] }) {
  return (
    <span aria-hidden="true" className="w-5 shrink-0 pt-0.5 text-center text-[1rem] sm:w-6">
      {tagIcon(tag)}
    </span>
  );
}

/** Картинка-карта под остановкой: по умолчанию свёрнута в кнопку. */
function CollapsedMap({ map }: { map: NonNullable<Stop["map"]> }) {
  return (
    <details className="mt-1.5 rounded-lg border border-line bg-paper-deep/30 px-2 py-1">
      <summary className="cursor-pointer list-none text-[0.76rem] font-semibold text-accent select-none marker:text-accent">
        Карта маршрута ▾
      </summary>
      <figure className="mt-1.5 mb-1">
        <img
          src={map.src}
          alt={map.caption ?? "карта маршрута"}
          loading="lazy"
          className="w-full rounded-md border border-line"
        />
        {map.caption && (
          <figcaption className="mt-1 text-[0.72rem] leading-snug text-muted-soft">
            {map.caption}
          </figcaption>
        )}
      </figure>
    </details>
  );
}
