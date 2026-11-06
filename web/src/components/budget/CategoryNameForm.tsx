import { useState } from "react";
import { Button, Input } from "../ui";

interface CategoryNameFormProps {
  initial: string;
  busy: boolean;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}

export function CategoryNameForm({ initial, busy, onSubmit, onCancel }: CategoryNameFormProps) {
  const [name, setName] = useState(initial);
  const [error, setError] = useState("");

  return (
    <form
      className="flex flex-wrap items-start gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const value = name.trim();
        if (!value) {
          setError("Укажите название категории");
          return;
        }
        setError("");
        onSubmit(value);
      }}
    >
      <div className="min-w-40 flex-1">
        <Input
          data-field="category-name"
          type="text"
          maxLength={60}
          autoComplete="off"
          autoFocus
          aria-label="Название категории"
          value={name}
          disabled={busy}
          className="h-9 px-2.5 py-1 text-[0.85rem]"
          onChange={(event) => {
            setName(event.currentTarget.value);
            setError("");
          }}
        />
        {error && (
          <p className="mt-1 text-[0.72rem] text-accent-ink" role="alert">
            {error}
          </p>
        )}
      </div>
      <Button variant="primary" size="sm" type="submit" data-action="save-category" disabled={busy}>
        Сохранить
      </Button>
      <Button variant="ghost" size="sm" disabled={busy} onClick={onCancel}>
        Отмена
      </Button>
    </form>
  );
}
