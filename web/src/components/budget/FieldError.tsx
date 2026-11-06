import type { DraftError } from "../../lib/budget/drafts";

export function FieldError({ field, error }: { field: string; error: DraftError | null }) {
  if (!error || error.field !== field) return null;
  return (
    <p className="mt-1 text-[0.72rem] text-accent-ink" role="alert">
      {error.message}
    </p>
  );
}
