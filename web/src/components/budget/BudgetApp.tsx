import { useCallback, useEffect, useMemo } from "react";
import { Section } from "../layout/Section";
import { AccessBar } from "../layout/AccessBar";
import { toast } from "../ui/Toast";
import { useAuth } from "../../edits/auth";
import { computeTotals } from "../../lib/budget/calc";
import type { BudgetData, BudgetTotals, ItemPayload } from "../../lib/budget/types";
import { useBudgetCategories } from "../../hooks/useBudgetCategories";
import { useBudgetData } from "../../hooks/useBudgetData";
import { useBudgetFx } from "../../hooks/useBudgetFx";
import { useBudgetItems } from "../../hooks/useBudgetItems";
import { useBudgetPanels } from "../../hooks/useBudgetPanels";
import { useBudgetParams } from "../../hooks/useBudgetParams";
import { useBudgetRunner } from "../../hooks/useBudgetRunner";
import { BudgetCacheNotice, BudgetError, BudgetLoading, BudgetLocked } from "./BudgetStates";
import { FxBanner } from "./FxBanner";
import { ItemsPanel } from "./ItemsPanel";
import { ParamsPanel } from "./ParamsPanel";
import { Summary } from "./Summary";

function safeCompute(data: BudgetData | null): BudgetTotals | null {
  if (!data) return null;
  try {
    return computeTotals(data);
  } catch {
    return null;
  }
}

export function BudgetApp() {
  const { token } = useAuth();
  const panels = useBudgetPanels();
  const fx = useBudgetFx();
  const budget = useBudgetData({ token, onLoadStart: panels.reset });
  const params = useBudgetParams({ token, setData: budget.setData });
  const runner = useBudgetRunner(budget.offline);
  const itemActions = useBudgetItems({
    data: budget.data,
    token,
    runner,
    setData: budget.setData,
    clearDraft: panels.clearDraft,
  });
  const categoryActions = useBudgetCategories({
    data: budget.data,
    params: budget.data?.params ?? {},
    token,
    runner,
    setData: budget.setData,
    applyParams: params.applyNow,
    bumpParamsReset: params.bumpReset,
    closeCreate: panels.closeCreate,
    closeRename: panels.closeRename,
    closeDeleted: panels.closeDeleted,
  });

  const { reset: resetPanels } = panels;
  const { cancel: cancelParams } = params;
  const { resetRequest, reveal: revealFx, load: loadFx, dismiss: dismissFx } = fx;
  const { bumpReset } = params;
  const { freshTick } = budget;

  useEffect(() => {
    if (token) return;
    resetPanels();
    cancelParams();
    resetRequest();
  }, [token, resetPanels, cancelParams, resetRequest]);

  useEffect(() => {
    if (!freshTick) return;
    revealFx();
    loadFx();
    bumpReset();
  }, [freshTick, revealFx, loadFx, bumpReset]);

  const retry = useCallback(() => {
    resetRequest();
    budget.retry();
  }, [resetRequest, budget.retry]);

  const totals = useMemo(() => safeCompute(budget.data), [budget.data]);
  const paramsDoc = budget.data?.params ?? {};

  const applyFx = () => {
    const rate = fx.fx;
    if (!rate || !token) return;
    runner.run(async () => {
      await params.applyNow({ cny_rate: rate.cny, hkd_rate: rate.hkd });
      dismissFx();
      params.bumpReset();
      toast("Курс обновлён", "success");
    });
  };

  const saveDraft = (payload: ItemPayload) => {
    itemActions.saveDraft(panels.draft, payload);
  };

  if (!token) return <BudgetLocked />;
  if (budget.status === "loading" || budget.status === "locked") return <BudgetLoading />;
  if (budget.status === "error") {
    return <BudgetError error={budget.error} onRetry={retry} />;
  }

  return (
    <Section id="budget">
      <div className="mb-3">
        <AccessBar />
      </div>

      {budget.cacheAt !== null && (budget.stale || budget.offline) && (
        <BudgetCacheNotice
          cacheAt={budget.cacheAt}
          offline={budget.offline}
          onRetry={retry}
        />
      )}

      <Summary totals={totals} params={paramsDoc} />
      {!fx.dismissed && (
        <FxBanner
          fx={fx.fx}
          params={paramsDoc}
          busy={runner.busy || budget.offline}
          onApply={applyFx}
          onDismiss={dismissFx}
        />
      )}
      <ParamsPanel
        params={paramsDoc}
        paramsUpdatedAt={budget.data?.params_updated_at ?? null}
        fx={fx.fx}
        fxFailed={fx.failed}
        saved={params.saved}
        disabled={runner.busy || budget.offline}
        resetKey={params.resetKey}
        onParamChange={params.change}
        onAddCity={categoryActions.addCity}
      />
      <ItemsPanel
        categories={budget.data?.categories ?? []}
        items={budget.data?.items ?? []}
        totals={totals}
        params={paramsDoc}
        draft={panels.draft}
        editingCategoryId={panels.editingCategoryId}
        addingCategory={panels.addingCategory}
        busy={runner.busy}
        offline={budget.offline}
        onStartNewItem={panels.startNewItem}
        onEditItem={panels.editItem}
        onSaveDraft={saveDraft}
        onCancelDraft={panels.cancelDraft}
        onDeleteItem={itemActions.deleteItem}
        onMoveItem={itemActions.moveItem}
        onStartRenameCategory={panels.startRename}
        onRenameCategory={categoryActions.renameCategory}
        onCancelCategory={panels.cancelCategory}
        onDeleteCategory={categoryActions.deleteCategory}
        onStartAddCategory={panels.startAddCategory}
        onCreateCategory={categoryActions.createCategory}
      />
    </Section>
  );
}
