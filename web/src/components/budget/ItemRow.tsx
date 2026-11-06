import type { ReactNode } from "react";
import { formatMoney, formatNumber, formatRub, itemAmount } from "@shared/budget-core.js";
import type { BudgetItem, ParamsDoc } from "../../lib/budget/types";
import { ItemActions } from "./ItemActions";

interface ItemViewProps {
  item: BudgetItem;
  index: number;
  lastIndex: number;
  params: ParamsDoc;
  busy: boolean;
  offline: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (delta: number) => void;
}

interface CalculatedText {
  qty: ReactNode;
  price: ReactNode;
  amount: string;
  title: string;
}

function calcText(item: BudgetItem, params: ParamsDoc): CalculatedText {
  try {
    const calc = itemAmount(item, params) as {
      qty: number;
      unitPrice: number;
      amountRub: number;
    };
    return {
      qty:
        item.qty_formula !== null && item.qty_formula !== undefined ? (
          <span className="tag-pill max-w-[10rem] truncate font-mono" title={formatNumber(calc.qty)}>
            {item.qty_formula}
          </span>
        ) : (
          formatNumber(calc.qty)
        ),
      price:
        item.price_formula !== null && item.price_formula !== undefined ? (
          <span
            className="tag-pill max-w-[10rem] truncate font-mono"
            title={formatMoney(calc.unitPrice, item.currency)}
          >
            {item.price_formula}
          </span>
        ) : (
          formatMoney(calc.unitPrice, item.currency)
        ),
      amount: formatRub(calc.amountRub),
      title: "",
    };
  } catch (err) {
    return {
      qty:
        item.qty_formula !== null && item.qty_formula !== undefined
          ? item.qty_formula
          : formatNumber(item.qty ?? Number.NaN),
      price:
        item.price_formula !== null && item.price_formula !== undefined
          ? item.price_formula
          : formatNumber(item.unit_price ?? Number.NaN),
      amount: "—",
      title: err instanceof Error ? err.message : "ошибка расчёта",
    };
  }
}

export function ItemRow({ item, params, ...props }: ItemViewProps) {
  const calc = calcText(item, params);

  return (
    <tr className="border-t border-line/70 align-top" data-item={item.id}>
      <td className="px-3 py-2">
        <div className="break-words font-medium text-ink">{item.name}</div>
        {item.note && <div className="mt-0.5 break-words text-[0.74rem] text-muted">{item.note}</div>}
      </td>
      <td className="px-3 py-2 text-right tabular-nums">
        <span className="whitespace-nowrap">
          {calc.qty} × {calc.price}
        </span>
      </td>
      <td className="px-3 py-2 text-right">
        <span className="tag-pill">{item.currency}</span>
      </td>
      <td className="px-3 py-2 text-right font-semibold tabular-nums" title={calc.title}>
        {calc.amount}
      </td>
      <td className="px-2 py-2">
        <ItemActions
          index={props.index}
          lastIndex={props.lastIndex}
          busy={props.busy}
          offline={props.offline}
          onEdit={props.onEdit}
          onDelete={props.onDelete}
          onMove={props.onMove}
        />
      </td>
    </tr>
  );
}

export function MobileItemCard({ item, params, ...props }: ItemViewProps) {
  const calc = calcText(item, params);

  return (
    <div className="rounded-xl border border-line/80 bg-surface/60 p-3" data-item={item.id}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="break-words font-medium text-ink">{item.name}</div>
          {item.note && <div className="mt-0.5 break-words text-[0.74rem] text-muted">{item.note}</div>}
        </div>
        <div className="shrink-0 text-right font-semibold tabular-nums" title={calc.title}>
          {calc.amount}
        </div>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.76rem] text-muted tabular-nums">
        <span>
          {calc.qty} × {calc.price}
        </span>
        <span className="tag-pill">{item.currency}</span>
      </div>
      <div className="mt-2">
        <ItemActions
          index={props.index}
          lastIndex={props.lastIndex}
          busy={props.busy}
          offline={props.offline}
          onEdit={props.onEdit}
          onDelete={props.onDelete}
          onMove={props.onMove}
        />
      </div>
    </div>
  );
}
