import { Plus } from "lucide-react";
import { Button } from "../ui";
import { compareSort } from "../../lib/budget/numbers";
import type {
  BudgetCategory,
  BudgetItem,
  BudgetTotals,
  ItemDraft,
  ItemPayload,
  ParamsDoc,
} from "../../lib/budget/types";
import { CategoryBlock } from "./CategoryBlock";
import { CategoryNameForm } from "./CategoryNameForm";

export interface ItemsPanelProps {
  categories: BudgetCategory[];
  items: BudgetItem[];
  totals: BudgetTotals | null;
  params: ParamsDoc;
  draft: ItemDraft | null;
  editingCategoryId: string | null;
  addingCategory: boolean;
  busy: boolean;
  offline: boolean;
  onStartNewItem: (categoryId: string) => void;
  onEditItem: (item: BudgetItem) => void;
  onSaveDraft: (payload: ItemPayload) => void;
  onCancelDraft: () => void;
  onDeleteItem: (item: BudgetItem) => void;
  onMoveItem: (item: BudgetItem, delta: number) => void;
  onStartRenameCategory: (id: string) => void;
  onRenameCategory: (id: string, name: string) => void;
  onCancelCategory: () => void;
  onDeleteCategory: (category: BudgetCategory) => void;
  onStartAddCategory: () => void;
  onCreateCategory: (name: string) => void;
}

export function ItemsPanel({
  categories,
  items,
  totals,
  params,
  draft,
  editingCategoryId,
  addingCategory,
  busy,
  offline,
  onStartNewItem,
  onEditItem,
  onSaveDraft,
  onCancelDraft,
  onDeleteItem,
  onMoveItem,
  onStartRenameCategory,
  onRenameCategory,
  onCancelCategory,
  onDeleteCategory,
  onStartAddCategory,
  onCreateCategory,
}: ItemsPanelProps) {
  const subtotals = new Map<string | null, number>();
  if (totals) {
    for (const bucket of totals.categories) subtotals.set(bucket.id, bucket.subtotal);
  }

  const sortedCategories = [...categories].sort(compareSort);
  const disabled = busy || offline;

  return (
    <div className="mt-5 space-y-4">
      {sortedCategories.map((category) => {
        const list = items
          .filter((item) => item.category_id === category.id)
          .sort(compareSort);

        return (
          <CategoryBlock
            key={category.id}
            category={category}
            items={list}
            categories={sortedCategories}
            subtotal={subtotals.get(category.id)}
            params={params}
            draft={draft}
            isRenaming={editingCategoryId === category.id}
            busy={busy}
            offline={offline}
            onStartNewItem={onStartNewItem}
            onEditItem={onEditItem}
            onSaveDraft={onSaveDraft}
            onCancelDraft={onCancelDraft}
            onDeleteItem={onDeleteItem}
            onMoveItem={onMoveItem}
            onStartRenameCategory={onStartRenameCategory}
            onRenameCategory={onRenameCategory}
            onCancelCategory={onCancelCategory}
            onDeleteCategory={onDeleteCategory}
          />
        );
      })}

      {!offline && (
        <div className="pt-1">
          {addingCategory ? (
            <div className="surface p-3">
              <CategoryNameForm
                initial=""
                busy={busy}
                onSubmit={onCreateCategory}
                onCancel={onCancelCategory}
              />
            </div>
          ) : (
            <Button
              variant="soft"
              size="sm"
              data-action="add-category"
              disabled={disabled}
              onClick={onStartAddCategory}
            >
              <Plus className="size-3.5" aria-hidden="true" />
              категория
            </Button>
          )}
        </div>
      )}

      {sortedCategories.length === 0 && offline && (
        <p className="text-[0.82rem] text-muted">Категории не загружены.</p>
      )}
    </div>
  );
}
