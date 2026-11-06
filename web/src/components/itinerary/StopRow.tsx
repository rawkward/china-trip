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
  onMove: (slug: string, dir: "up" | "down") => void;
}

/** Одна остановка дня или группа равноправных вариантов (карусель). */
export function StopRow({ day, dayKey, stop, texts, api, index, total, onMove }: StopRowProps) {
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
            <EditableText
              dayKey={dayKey}
              field={groupFields.title}
              value={stop.title ?? stop.name ?? ""}
              edited={hasText(texts, groupFields.title)}
              api={api}
              className="text-[0.9rem] font-semibold"
              ariaLabel="название группы вариантов"
            />
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

          <PickCarousel
            dayKey={dayKey}
            groupSlug={slug}
            picks={stop.picks ?? []}
            texts={texts}
            api={api}
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

  return (
    <li className="flex gap-2.5 border-b border-dashed border-line py-2.5 last:border-b-0 sm:gap-3">
      <StopIcon tag={stop.tag} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          {timeNode}
          <EditableText
            dayKey={dayKey}
            field={fields.name}
            value={stop.name ?? ""}
            edited={hasText(texts, fields.name)}
            api={api}
            className="text-[0.9rem] font-semibold"
            ariaLabel="название остановки"
          />
          {guideId && (
            <a
              href={"#g-" + guideId}
              className="whitespace-nowrap text-[0.72rem] font-semibold text-accent underline decoration-dotted underline-offset-2"
            >
              в справочнике
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

        {timeEditor}
        {admin}
        {refPicker}
      </div>
    </li>
  );
}

function StopIcon({ tag }: { tag?: Stop["tag"] }) {
  return (
    <span aria-hidden="true" className="w-5 shrink-0 pt-0.5 text-center text-[1rem] sm:w-6">
      {tagIcon(tag)}
    </span>
  );
}
