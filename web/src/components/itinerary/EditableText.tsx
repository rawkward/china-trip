import { useEffect, useState } from "react";
import type { EditsValue, EditingState } from "@/edits/EditsContext";
import { cn } from "@/lib/cn";
import { Button, Input, Textarea } from "../ui";

/** Минимум слоя правок, нужный одному текстовому полю. */
export interface TextEditingApi {
  token: string | null;
  editing: EditingState;
  setEditing: (patch: Partial<EditingState>) => void;
  saveText: (dayKey: string, field: string, value: string) => Promise<void>;
}

/** Полный набор операций, которые нужны карточке дня и остановкам. */
export type ItineraryEditApi = Pick<
  EditsValue,
  | "token"
  | "editing"
  | "setEditing"
  | "saveText"
  | "dayNotes"
  | "stopNotes"
  | "saveDayNote"
  | "deleteDayNote"
  | "saveStopNote"
  | "resetStopNote"
> & {
  moveStop?: EditsValue["moveStop"];
};

export function hasText(texts: Record<string, string> | undefined, field: string): boolean {
  return !!texts && Object.prototype.hasOwnProperty.call(texts, field);
}

export interface InlineEditorProps {
  field: string;
  value: string;
  kind?: "line" | "text";
  edited?: boolean;
  ariaLabel?: string;
  onSave: (field: string, value: string) => void;
  onCancel: () => void;
}

/** Инлайн-редактор одного текста: input/textarea и сохранение/сброс/отмена. */
export function InlineEditor({
  field,
  value,
  kind = "line",
  edited = false,
  ariaLabel = "Новый текст",
  onSave,
  onCancel,
}: InlineEditorProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  return (
    <span className="mt-1 block w-full min-w-0">
      {kind === "text" ? (
        <Textarea
          aria-label={ariaLabel}
          className="min-h-20 py-1.5 text-[0.86rem]"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
      ) : (
        <Input
          aria-label={ariaLabel}
          className="h-8 py-1 text-[0.86rem]"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
      )}
      <span className="mt-1 flex flex-wrap gap-1.5">
        <Button size="sm" variant="primary" onClick={() => onSave(field, draft)}>
          Сохранить
        </Button>
        {edited && (
          <Button size="sm" variant="ghost" onClick={() => onSave(field, "")}>
            Сбросить
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Отмена
        </Button>
      </span>
    </span>
  );
}

export interface EditableTextProps {
  dayKey: string;
  field: string;
  value: string;
  edited: boolean;
  api: TextEditingApi;
  kind?: "line" | "text";
  className?: string;
  ariaLabel?: string;
}

/**
 * Текст с карандашом (только при токене). Один открытый редактор на страницу
 * определяется `editing.text`, поэтому все поля используют общий ключ.
 */
export function EditableText({
  dayKey,
  field,
  value,
  edited,
  api,
  kind = "line",
  className,
  ariaLabel,
}: EditableTextProps) {
  const editing = api.token !== null && api.editing.text === field;

  if (editing) {
    return (
      <InlineEditor
        field={field}
        value={value}
        kind={kind}
        edited={edited}
        ariaLabel={ariaLabel}
        onSave={(f, v) => void api.saveText(dayKey, f, v)}
        onCancel={() => api.setEditing({ text: undefined })}
      />
    );
  }

  return (
    <span className={cn("min-w-0", className)}>
      {value}
      {edited && (
        <span className="ml-1 text-[0.62rem] font-bold uppercase tracking-wide text-accent">
          правка
        </span>
      )}
      {api.token && (
        <button
          type="button"
          className="ml-1 align-baseline text-[0.72rem] text-muted-soft transition-colors hover:text-accent"
          aria-label={ariaLabel ? "править: " + ariaLabel : "править текст"}
          title="править текст"
          onClick={() => api.setEditing({ text: field })}
        >
          ✎
        </button>
      )}
    </span>
  );
}
