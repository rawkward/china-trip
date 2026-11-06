import type {
  BudgetCategory,
  BudgetItem,
  ItemDraft,
  ItemPayload,
  ParamsDoc,
} from "../../lib/budget/types";
import { CategoryHeader } from "./CategoryHeader";
import { ItemForm } from "./ItemForm";
import { ItemRow, MobileItemCard } from "./ItemRow";

interface CategoryBlockProps {
  category: BudgetCategory;
  items: BudgetItem[];
  categories: BudgetCategory[];
  subtotal: number | undefined;
  params: ParamsDoc;
  draft: ItemDraft | null;
  isRenaming: boolean;
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
}

/** Категория бюджета: шапка, таблица статей на десктопе и карточки на мобильном. */
export function CategoryBlock({
  category,
  items,
  categories,
  subtotal,
  params,
  draft,
  isRenaming,
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
}: CategoryBlockProps) {
  const disabled = busy || offline;
  const hasNewDraft = draft !== null && draft.id === null && draft.category_id === category.id;

  const formProps = {
    categories,
    params,
    busy,
    onSave: onSaveDraft,
    onCancel: onCancelDraft,
  };

  return (
    <section data-category={category.id} className="surface overflow-hidden">
      <CategoryHeader
        category={category}
        itemCount={items.length}
        subtotal={subtotal}
        isRenaming={isRenaming}
        busy={busy}
        disabled={disabled}
        onStartNewItem={() => onStartNewItem(category.id)}
        onStartRename={() => onStartRenameCategory(category.id)}
        onRename={(name) => onRenameCategory(category.id, name)}
        onCancelRename={onCancelCategory}
        onDelete={() => onDeleteCategory(category)}
      />

      <div className="hidden md:block">
        <table className="w-full text-[0.82rem]">
          <thead>
            <tr className="text-[0.7rem] uppercase tracking-[0.08em] text-muted">
              <th className="px-3 py-2 text-left font-semibold">Статья</th>
              <th className="px-3 py-2 text-right font-semibold">Кол-во × цена</th>
              <th className="px-3 py-2 text-right font-semibold">Валюта</th>
              <th className="px-3 py-2 text-right font-semibold">Сумма</th>
              <th className="w-px px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) =>
              draft && draft.id === item.id ? (
                <tr key={item.id} className="border-t border-line/70">
                  <td colSpan={5} className="p-3">
                    <ItemForm key={`edit-${item.id}`} initial={draft} {...formProps} />
                  </td>
                </tr>
              ) : (
                <ItemRow
                  key={item.id}
                  item={item}
                  index={index}
                  lastIndex={items.length - 1}
                  params={params}
                  busy={busy}
                  offline={offline}
                  onEdit={() => onEditItem(item)}
                  onDelete={() => onDeleteItem(item)}
                  onMove={(delta) => onMoveItem(item, delta)}
                />
              ),
            )}

            {hasNewDraft && draft && (
              <tr className="border-t border-line/70">
                <td colSpan={5} className="p-3">
                  <ItemForm key={`new-${category.id}`} initial={draft} {...formProps} />
                </td>
              </tr>
            )}

            {items.length === 0 && !hasNewDraft && (
              <tr>
                <td colSpan={5} className="px-3 py-3 text-[0.8rem] text-muted">
                  Пока пусто
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-2 p-3 md:hidden">
        {items.map((item, index) =>
          draft && draft.id === item.id ? (
            <ItemForm key={`edit-${item.id}`} initial={draft} {...formProps} />
          ) : (
            <MobileItemCard
              key={item.id}
              item={item}
              index={index}
              lastIndex={items.length - 1}
              params={params}
              busy={busy}
              offline={offline}
              onEdit={() => onEditItem(item)}
              onDelete={() => onDeleteItem(item)}
              onMove={(delta) => onMoveItem(item, delta)}
            />
          ),
        )}

        {hasNewDraft && draft && (
          <ItemForm key={`new-${category.id}`} initial={draft} {...formProps} />
        )}

        {items.length === 0 && !hasNewDraft && (
          <p className="text-[0.8rem] text-muted">Пока пусто</p>
        )}
      </div>
    </section>
  );
}
