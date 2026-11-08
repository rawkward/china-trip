import { useState } from "react";
import type { EditsValue } from "@/edits/EditsContext";
import { cn } from "@/lib/cn";
import { Button, Textarea } from "../ui";

export interface StopNoteProps {
  stopKey: string;
  /** Авторский текст из данных (может содержать простой HTML). */
  original?: string;
  edits: Pick<
    EditsValue,
    "token" | "editing" | "setEditing" | "stopNotes" | "saveStopNote" | "resetStopNote"
  >;
  className?: string;
}

function EditNoteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="ml-1 align-baseline text-[0.72rem] text-muted-soft transition-colors hover:text-accent"
      aria-label="править текст к остановке"
      onClick={onClick}
    >
      ✎ править текст
    </button>
  );
}

function NoteEditor({
  value,
  edited,
  onSave,
  onReset,
  onCancel,
}: {
  value: string;
  edited: boolean;
  onSave: (value: string) => void;
  onReset: () => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(value);

  return (
    <span className="mt-1 block">
      <Textarea
        aria-label="Текст к остановке"
        className="min-h-[70px] py-1.5 text-[0.86rem]"
        maxLength={1200}
        placeholder="Текст к этой остановке"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />
      <span className="mt-0.5 block text-[0.72rem] text-muted-soft">
        пустое поле скрывает авторский текст
      </span>
      <span className="mt-1 flex flex-wrap gap-1.5">
        <Button size="sm" variant="primary" onClick={() => onSave(draft)}>
          Сохранить
        </Button>
        {edited && (
          <Button size="sm" variant="danger" onClick={onReset}>
            Вернуть мой текст
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Отмена
        </Button>
      </span>
    </span>
  );
}

/** Текст остановки: авторский HTML либо сохранённая правка с пометкой «правка». */
export function StopNote({ stopKey, original, edits, className }: StopNoteProps) {
  const note = edits.stopNotes[stopKey];
  const hidden = !!note && note.body === "";
  const editing = edits.token !== null && edits.editing.stop === stopKey;
  const originalText = original ?? "";

  if (editing) {
    return (
      <div className={cn("text-[0.82rem] text-muted", className)}>
        <NoteEditor
          value={note?.body ?? originalText}
          edited={!!note}
          onSave={(value) => void edits.saveStopNote(stopKey, value)}
          onReset={() => void edits.resetStopNote(stopKey)}
          onCancel={() => edits.setEditing({ stop: undefined })}
        />
      </div>
    );
  }

  if (hidden) {
    if (!edits.token) return null;
    return (
      <div className={cn("mt-0.5 text-[0.82rem] leading-relaxed text-muted-soft", className)}>
        <span>описание скрыто</span>
        <EditNoteButton onClick={() => edits.setEditing({ stop: stopKey })} />
        <button
          type="button"
          className="ml-2 text-[0.72rem] text-muted-soft underline decoration-dotted transition-colors hover:text-accent"
          onClick={() => void edits.resetStopNote(stopKey)}
        >
          вернуть авторский текст
        </button>
      </div>
    );
  }

  if (!note && !originalText && !edits.token) return null;

  return (
    <div className={cn("mt-0.5 text-[0.82rem] leading-relaxed text-muted", className)}>
      {note ? (
        <>
          <span className="whitespace-pre-line">
            <span className="mr-1 text-[0.62rem] font-bold uppercase tracking-wide text-accent">
              правка:
            </span>
            {note.body}
          </span>
          {edits.token && <EditNoteButton onClick={() => edits.setEditing({ stop: stopKey })} />}
        </>
      ) : originalText ? (
        <>
          <span
            className="[&_a]:text-accent [&_a]:underline"
            dangerouslySetInnerHTML={{ __html: originalText }}
          />
          {edits.token && <EditNoteButton onClick={() => edits.setEditing({ stop: stopKey })} />}
        </>
      ) : (
        <button
          type="button"
          className="text-[0.78rem] text-muted-soft underline decoration-dotted transition-colors hover:text-accent"
          onClick={() => edits.setEditing({ stop: stopKey })}
        >
          ✎ добавить текст к остановке
        </button>
      )}
      {note && edits.token && (
        <button
          type="button"
          className="ml-2 text-[0.72rem] text-muted-soft underline decoration-dotted transition-colors hover:text-accent"
          onClick={() => void edits.resetStopNote(stopKey)}
        >
          вернуть мой текст
        </button>
      )}
    </div>
  );
}
