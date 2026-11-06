import { ArrowDown, ArrowUp, Pencil, Trash2 } from "lucide-react";
import { IconButton } from "../ui";

interface ItemActionsProps {
  index: number;
  lastIndex: number;
  busy: boolean;
  offline: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (delta: number) => void;
}

export function ItemActions({
  index,
  lastIndex,
  busy,
  offline,
  onEdit,
  onDelete,
  onMove,
}: ItemActionsProps) {
  const disabled = busy || offline;

  return (
    <div className="flex items-center gap-1">
      <IconButton label="Изменить статью" data-action="edit-item" disabled={disabled} onClick={onEdit}>
        <Pencil className="size-3.5" aria-hidden="true" />
      </IconButton>
      <IconButton label="Удалить статью" data-action="delete-item" disabled={disabled} onClick={onDelete}>
        <Trash2 className="size-3.5" aria-hidden="true" />
      </IconButton>
      <IconButton
        label="Переместить выше"
        disabled={disabled || index === 0}
        onClick={() => onMove(-1)}
      >
        <ArrowUp className="size-3.5" aria-hidden="true" />
      </IconButton>
      <IconButton
        label="Переместить ниже"
        disabled={disabled || index === lastIndex}
        onClick={() => onMove(1)}
      >
        <ArrowDown className="size-3.5" aria-hidden="true" />
      </IconButton>
    </div>
  );
}
