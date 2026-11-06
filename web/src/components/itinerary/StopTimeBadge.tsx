interface StopTimeBadgeProps {
  time?: string;
  editable: boolean;
  onEdit: () => void;
}

/** Время остановки с карандашом правки (карандаш только при открытой правке). */
export function StopTimeBadge({ time, editable, onEdit }: StopTimeBadgeProps) {
  if (!time) return null;

  return (
    <span className="mr-1.5 inline-flex items-center rounded-full border border-line bg-paper-deep px-1.5 align-[1px] text-[0.7rem] font-semibold tabular-nums text-muted">
      {time}
      {editable && (
        <button
          type="button"
          aria-label="править время"
          className="ml-1 text-[0.68rem] text-muted-soft transition-colors hover:text-accent"
          onClick={onEdit}
        >
          ✎
        </button>
      )}
    </span>
  );
}
