import { useState } from "react";
import { LogIn, LogOut, LockKeyhole } from "lucide-react";
import { useEdits } from "../../edits/EditsContext";
import { useAuth } from "../../edits/auth";
import { Button, Input } from "../ui";
import { toast } from "../ui/Toast";

/**
 * Одна панель доступа на всю страницу: тем же паролем открываются заметки к дням,
 * правки текстов остановок, теги справочника и бюджет.
 */
export function AccessBar() {
  const { login, logout, error } = useEdits();
  const auth = useAuth();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!password) {
      toast("введите пароль", "error");
      return;
    }
    setBusy(true);
    try {
      await login(password);
      setPassword("");
      toast("правка открыта", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "вход не удался", "error");
    } finally {
      setBusy(false);
    }
  };

  if (auth.token) {
    const until = auth.expiresAt
      ? new Date(auth.expiresAt * 1000).toLocaleDateString("ru-RU")
      : "";
    return (
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface/70 px-3 py-2">
        <span className="inline-flex items-center gap-1.5 text-[0.82rem] font-medium text-ink-soft">
          <LockKeyhole className="size-3.5 text-accent" aria-hidden="true" />
          Правка открыта{until ? ` до ${until}` : ""}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto"
          onClick={() => {
            logout();
            toast("правка закрыта");
          }}
        >
          <LogOut className="size-3.5" aria-hidden="true" />
          Выйти
        </Button>
      </div>
    );
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface/70 px-3 py-2">
      <span className="w-full text-[0.78rem] text-muted sm:w-auto">
        Правки текстов, заметки к дням и теги справочника открываются паролем — тем же, что у бюджета.
      </span>
      <div className="ml-auto flex items-center gap-2">
        <Input
          type="password"
          value={password}
          autoComplete="current-password"
          placeholder="пароль"
          aria-label="Пароль для правок"
          className="h-8 w-40 py-1 text-[0.82rem]"
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void submit();
          }}
        />
        <Button variant="primary" size="sm" disabled={busy} onClick={() => void submit()}>
          <LogIn className="size-3.5" aria-hidden="true" />
          {busy ? "Входим…" : "Войти"}
        </Button>
      </div>
      {error && <span className="w-full text-[0.78rem] text-accent-ink">{error}</span>}
    </div>
  );
}
