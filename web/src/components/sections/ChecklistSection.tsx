import { useEffect, useMemo, useState } from "react";
import { Pencil, X } from "lucide-react";
import { api, ApiError } from "../../api/client";
import { useToken } from "../../edits/auth";
import type { ChecklistGroup, ChecklistItem } from "../../types";
import { readJson, writeJson, STORAGE_KEYS } from "../../lib/storage";
import { cn } from "../../lib/cn";
import { Button, Checkbox, IconButton, Input, Textarea } from "../ui";
import { toast } from "../ui/Toast";
import { Section } from "../layout/Section";

/** Отметка пункта: «chk-<id из базы>», живёт в localStorage этого браузера. */
function markId(itemId: string): string {
  return `chk-${itemId}`;
}

function messageFor(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return "войдите заново";
    if (err.status === 0) return "нет связи с сервером";
  }
  return err instanceof Error && err.message ? err.message : fallback;
}

/** Чек-лист: содержимое и правки — в D1, отметки «сделано» — в localStorage. */
export function ChecklistSection() {
  const token = useToken();
  const [groups, setGroups] = useState<ChecklistGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadTick, setReloadTick] = useState(0);
  const [marks, setMarks] = useState<Record<string, boolean>>(() =>
    readJson<Record<string, boolean>>(STORAGE_KEYS.checklist, {}),
  );

  const [groupEditId, setGroupEditId] = useState<string | null>(null);
  const [groupDraft, setGroupDraft] = useState("");
  const [itemEditId, setItemEditId] = useState<string | null>(null);
  const [itemDraft, setItemDraft] = useState("");
  const [newItemGroupId, setNewItemGroupId] = useState<string | null>(null);
  const [newItemText, setNewItemText] = useState("");
  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const [newGroupCap, setNewGroupCap] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    const ctrl = new AbortController();
    setLoading(true);
    setError("");
    api
      .listChecklist(token, ctrl.signal)
      .then((list) => {
        if (!ctrl.signal.aborted) setGroups(list);
      })
      .catch((err) => {
        if (!ctrl.signal.aborted) setError(messageFor(err, "не удалось загрузить чек-лист"));
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [token, reloadTick]);

  const allItems = useMemo(() => groups.flatMap((group) => group.items), [groups]);
  const total = allItems.length;
  const done = allItems.filter((item) => marks[markId(item.id)]).length;
  const progress = total ? Math.round((done / total) * 100) : 0;

  if (!token) return null;

  const retry = () => setReloadTick((n) => n + 1);

  const toggle = (id: string, checked: boolean) => {
    setMarks((prev) => {
      const next = { ...prev, [markId(id)]: checked };
      writeJson(STORAGE_KEYS.checklist, next);
      return next;
    });
  };

  const reset = () => {
    setMarks({});
    writeJson(STORAGE_KEYS.checklist, {});
  };

  const report = (err: unknown, fallback: string) => {
    const message = messageFor(err, fallback);
    setError(message);
    toast(message, "error");
  };

  const run = async (task: () => Promise<void>, fallback: string) => {
    setBusy(true);
    try {
      await task();
      setError("");
      setReloadTick((n) => n + 1);
    } catch (err) {
      report(err, fallback);
    } finally {
      setBusy(false);
    }
  };

  const startGroupEdit = (group: ChecklistGroup) => {
    setGroupEditId(group.id);
    setGroupDraft(group.cap);
  };

  const saveGroup = (group: ChecklistGroup) =>
    run(async () => {
      await api.updateChecklistGroup(group.id, groupDraft, token);
      setGroupEditId(null);
      setGroupDraft("");
    }, "не удалось переименовать группу");

  const removeGroup = (group: ChecklistGroup) => {
    if (!window.confirm(`Удалить группу «${group.cap}» вместе с пунктами?`)) return;
    void run(async () => {
      await api.deleteChecklistGroup(group.id, token);
    }, "не удалось удалить группу");
  };

  const startItemEdit = (item: ChecklistItem) => {
    setItemEditId(item.id);
    setItemDraft(item.text);
  };

  const saveItem = (item: ChecklistItem) =>
    run(async () => {
      await api.updateChecklistItem(item.id, itemDraft, token);
      setItemEditId(null);
      setItemDraft("");
    }, "не удалось сохранить пункт");

  const removeItem = (item: ChecklistItem) => {
    if (!window.confirm("Удалить пункт?")) return;
    void run(async () => {
      await api.deleteChecklistItem(item.id, token);
    }, "не удалось удалить пункт");
  };

  const addItem = (groupId: string) =>
    run(async () => {
      await api.createChecklistItem(groupId, newItemText, token);
      setNewItemGroupId(null);
      setNewItemText("");
    }, "не удалось добавить пункт");

  const addGroup = () =>
    run(async () => {
      await api.createChecklistGroup(newGroupCap, token);
      setNewGroupOpen(false);
      setNewGroupCap("");
    }, "не удалось добавить группу");

  const groupForm = (
    <form
      className="mb-2 flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        void addGroup();
      }}
    >
      <Input
        aria-label="Название"
        placeholder="Название"
        value={newGroupCap}
        autoFocus
        className="h-8 min-w-0 flex-1 py-1 text-[0.9rem]"
        onChange={(e) => setNewGroupCap(e.target.value)}
      />
      <Button type="submit" variant="primary" size="sm" disabled={busy || !newGroupCap.trim()}>
        Сохранить
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setNewGroupOpen(false);
          setNewGroupCap("");
        }}
      >
        Отмена
      </Button>
    </form>
  );

  return (
    <Section
      id="checklist"
      action={
        <div className="flex items-center gap-3">
          <span className="text-[0.82rem] font-medium text-muted">
            Отмечено {done} из {total}
          </span>
          <Button variant="ghost" size="sm" onClick={reset} disabled={!total}>
            Сбросить
          </Button>
        </div>
      }
    >
      <div
        className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-paper-deep"
        role="progressbar"
        aria-label="Прогресс чек-листа"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {loading && groups.length === 0 && (
        <p className="text-[0.9rem] text-muted">Загружаю чек-лист…</p>
      )}

      {error && (
        <div
          role="alert"
          className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-accent/30 bg-accent-soft px-3 py-2 text-[0.84rem] text-accent-ink"
        >
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={retry}>
            Повторить
          </Button>
        </div>
      )}

      {!loading && !error && groups.length === 0 && (
        <p className="text-[0.9rem] text-muted">Пока пусто — добавьте группу и пункты.</p>
      )}

      {(groups.length > 0 || !loading) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {groups.map((group) => (
            <div key={group.id} className="surface p-4 sm:p-5">
              {groupEditId === group.id ? (
                <form
                  className="mb-2 flex flex-wrap items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void saveGroup(group);
                  }}
                >
                  <Input
                    aria-label="Название группы"
                    value={groupDraft}
                    autoFocus
                    className="h-8 min-w-0 flex-1 py-1 text-[0.9rem]"
                    onChange={(e) => setGroupDraft(e.target.value)}
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={busy || !groupDraft.trim()}
                  >
                    Сохранить
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setGroupEditId(null)}>
                    Отмена
                  </Button>
                </form>
              ) : (
                <h3 className="mb-2 flex items-center gap-2 text-[1rem]">
                  <span className="min-w-0">{group.cap}</span>
                  <span className="tag-pill">{group.items.length}</span>
                  <span className="ml-auto flex items-center gap-1">
                    <IconButton
                      label="переименовать группу"
                      disabled={busy}
                      onClick={() => startGroupEdit(group)}
                    >
                      <Pencil className="size-3.5" aria-hidden="true" />
                    </IconButton>
                    <IconButton
                      label="удалить группу"
                      disabled={busy}
                      onClick={() => removeGroup(group)}
                    >
                      <X className="size-4" aria-hidden="true" />
                    </IconButton>
                  </span>
                </h3>
              )}

              <div className="grid gap-0.5">
                {group.items.map((item) =>
                  itemEditId === item.id ? (
                    <form
                      key={item.id}
                      className="grid gap-2 rounded-xl border border-line bg-paper/60 p-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        void saveItem(item);
                      }}
                    >
                      <Textarea
                        aria-label="Текст пункта"
                        rows={3}
                        autoFocus
                        value={itemDraft}
                        onChange={(e) => setItemDraft(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          variant="primary"
                          size="sm"
                          disabled={busy || !itemDraft.trim()}
                        >
                          Сохранить
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setItemEditId(null)}>
                          Отмена
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div key={item.id} className="flex items-start gap-1">
                      <Checkbox
                        id={markId(item.id)}
                        checked={Boolean(marks[markId(item.id)])}
                        onChange={(checked) => toggle(item.id, checked)}
                        className={cn("min-w-0 flex-1", marks[markId(item.id)] && "opacity-80")}
                      >
                        <span dangerouslySetInnerHTML={{ __html: item.text }} />
                      </Checkbox>
                      <span className="mt-2 flex shrink-0 items-center gap-1">
                        <IconButton
                          label="править пункт"
                          disabled={busy}
                          onClick={() => startItemEdit(item)}
                        >
                          <Pencil className="size-3.5" aria-hidden="true" />
                        </IconButton>
                        <IconButton
                          label="удалить пункт"
                          disabled={busy}
                          onClick={() => removeItem(item)}
                        >
                          <X className="size-4" aria-hidden="true" />
                        </IconButton>
                      </span>
                    </div>
                  ),
                )}
              </div>

              {newItemGroupId === group.id ? (
                <form
                  className="mt-2 grid gap-2 rounded-xl border border-line bg-paper/60 p-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void addItem(group.id);
                  }}
                >
                  <Textarea
                    aria-label="Новый пункт"
                    rows={3}
                    autoFocus
                    placeholder="Текст пункта; можно <b>выделить</b> и <br>перенести строку"
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={busy || !newItemText.trim()}
                    >
                      Сохранить
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setNewItemGroupId(null);
                        setNewItemText("");
                      }}
                    >
                      Отмена
                    </Button>
                  </div>
                </form>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  disabled={busy}
                  onClick={() => {
                    setNewItemGroupId(group.id);
                    setNewItemText("");
                  }}
                >
                  ＋ пункт
                </Button>
              )}
            </div>
          ))}

          <div className="surface p-4 sm:p-5">
            {newGroupOpen ? (
              groupForm
            ) : (
              <Button variant="soft" disabled={busy} onClick={() => setNewGroupOpen(true)}>
                ＋ группа
              </Button>
            )}
          </div>
        </div>
      )}
    </Section>
  );
}
