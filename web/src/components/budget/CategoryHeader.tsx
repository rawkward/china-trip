import { Pencil, Plus, Trash2 } from "lucide-react";
import { formatRub } from "@shared/budget-core.js";
import { Button, IconButton } from "../ui";
import { itemWord } from "../../lib/budget/labels";
import type { BudgetCategory } from "../../lib/budget/types";
import { CategoryNameForm } from "./CategoryNameForm";

interface CategoryHeaderProps {
  category: BudgetCategory;
  itemCount: number;
  subtotal: number | undefined;
  isRenaming: boolean;
  busy: boolean;
  disabled: boolean;
  onStartNewItem: () => void;
  onStartRename: () => void;
  onRename: (name: string) => void;
  onCancelRename: () => void;
  onDelete: () => void;
}

/** Шапка категории: название, счётчик, сумма и действия (или форма переименования). */
export function CategoryHeader({
  category,
  itemCount,
  subtotal,
  isRenaming,
  busy,
  disabled,
  onStartNewItem,
  onStartRename,
  onRename,
  onCancelRename,
  onDelete,
}: CategoryHeaderProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-line bg-paper/40 px-3 py-2.5">
      {isRenaming ? (
        <div className="w-full">
          <CategoryNameForm
            initial={category.name}
            busy={busy}
            onSubmit={onRename}
            onCancel={onCancelRename}
          />
        </div>
      ) : (
        <>
          <h3 className="text-[1rem]">{category.name}</h3>
          <span className="tag-pill">
            {itemCount} {itemWord(itemCount)}
          </span>
          <span className="ml-auto font-semibold tabular-nums">
            {subtotal === undefined ? "—" : formatRub(subtotal)}
          </span>
          <Button
            variant="soft"
            size="sm"
            data-action="add-item"
            disabled={disabled}
            onClick={onStartNewItem}
          >
            <Plus className="size-3.5" aria-hidden="true" />
            статья
          </Button>
          <IconButton label="Переименовать категорию" disabled={disabled} onClick={onStartRename}>
            <Pencil className="size-3.5" aria-hidden="true" />
          </IconButton>
          <IconButton label="Удалить категорию" disabled={disabled} onClick={onDelete}>
            <Trash2 className="size-3.5" aria-hidden="true" />
          </IconButton>
        </>
      )}
    </div>
  );
}
