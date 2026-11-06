import { useState } from "react";
import type { EditsValue } from "@/edits/EditsContext";
import type { DayNote as DayNoteRecord } from "@/types";
import { Button, Textarea } from "../ui";

const NOTE_MAX = 2000;

/** «06.11, 12:30» — дата и время правки заметки. */
export function formatNoteDate(updatedAt: number): string {
  const date = new Date(Number(updatedAt) * 1000);
  if (Number.isNaN(date.getTime())) return "";
  const day = date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
  const time = date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  return day + ", " + time;
}

export interface DayNoteProps {
  dayKey: string;
  note?: DayNoteRecord;
  edits: Pick<
    EditsValue,
    "token" | "editing" | "setEditing" | "dayNotes" | "saveDayNote" | "deleteDayNote"
  >;
}

function NoteEditor({
  initial,
  hasNote,
  onSave,
  onDelete,
  onCancel,
}: {
  initial: string;
  hasNote: boolean;
  onSave: (body: string) => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(initial);

  return (
    <div className="mt-3 border-t border-dashed border-line pt-3">
      <div className="mb-1 text-[0.68rem] font-bold uppercase tracking-wide text-muted">
        Заметка к дню
      </div>
      <Textarea
        aria-label="Заметка к дню"
        maxLength={NOTE_MAX}
        rows={3}
        placeholder="Что важно помнить про этот день"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />
      <div className="mt-2 flex flex-wrap gap-2">
        <Button size="sm" variant="primary" onClick={() => onSave(draft)}>
          Сохранить
        </Button>
        {hasNote && (
          <Button size="sm" variant="danger" onClick={onDelete}>
            Удалить
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Отмена
        </Button>
      </div>
    </div>
  );
}

/** Заметка к дню: читают все, правят по паролю. */
export function DayNote({ dayKey, note, edits }: DayNoteProps) {
  const editing = edits.token !== null && edits.editing.note === dayKey;

  if (editing) {
    return (
      <NoteEditor
        initial={note?.body ?? ""}
        hasNote={!!note}
        onSave={(body) => void edits.saveDayNote(dayKey, body)}
        onDelete={() => void edits.deleteDayNote(dayKey)}
        onCancel={() => edits.setEditing({ note: undefined })}
      />
    );
  }

  if (!note) {
    if (!edits.token) return null;
    return (
      <div className="mt-3 border-t border-dashed border-line pt-3">
        <button
          type="button"
          className="rounded-lg border border-dashed border-line px-3 py-1 text-[0.8rem] text-muted transition-colors hover:border-accent hover:text-accent"
          onClick={() => edits.setEditing({ note: dayKey })}
        >
          ＋ заметка к дню
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3 border-t border-dashed border-line pt-3">
      <div className="mb-1 text-[0.68rem] font-bold uppercase tracking-wide text-muted">
        Заметка к дню
      </div>
      <div className="whitespace-pre-line text-[0.88rem] leading-relaxed text-ink-soft">
        {note.body}
      </div>
      <div className="mt-1 text-[0.74rem] text-muted">
        обновлено {formatNoteDate(note.updated_at)}
        {edits.token && (
          <button
            type="button"
            className="ml-2 rounded-md border border-line bg-surface px-2 py-0.5 text-[0.74rem] font-semibold text-muted transition-colors hover:border-accent hover:text-accent"
            onClick={() => edits.setEditing({ note: dayKey })}
          >
            править
          </button>
        )}
      </div>
    </div>
  );
}
