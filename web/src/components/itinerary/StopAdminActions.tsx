import type { ReactNode } from "react";

function AdminButton({
  children,
  onClick,
  disabled,
  label,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      className="rounded-md border border-line bg-surface px-1.5 py-0.5 text-[0.72rem] font-semibold text-muted transition-colors hover:border-line-strong hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export interface StopAdminActionsProps {
  token: string | null;
  index: number;
  total: number;
  time?: string;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEditTime: () => void;
  onToggleRef: () => void;
}

/** Служебные кнопки остановки: порядок, время и замена на карточку справочника. */
export function StopAdminActions({
  token,
  index,
  total,
  time,
  onMoveUp,
  onMoveDown,
  onEditTime,
  onToggleRef,
}: StopAdminActionsProps) {
  if (!token) return null;

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1.5">
      <AdminButton label="выше" disabled={index === 0} onClick={onMoveUp}>
        ↑
      </AdminButton>
      <AdminButton label="ниже" disabled={index === total - 1} onClick={onMoveDown}>
        ↓
      </AdminButton>
      <AdminButton label={time ? "править время" : "добавить время"} onClick={onEditTime}>
        {time ? "время: " + time : "＋ время"}
      </AdminButton>
      <AdminButton label="заменить на карточку из справочника" onClick={onToggleRef}>
        заменить
      </AdminButton>
    </div>
  );
}
