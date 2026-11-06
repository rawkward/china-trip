import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { api, ApiError } from "../api/client";
import { clearAuth, loginWithPassword, useAuth } from "./auth";
import type { DayNote, DayTextsMap, GuideTagValue, StopNote } from "../types";

export interface EditingState {
  /** ключ дня, заметку которого правим */
  note?: string;
  /** ключ остановки, текст которой правим */
  stop?: string;
  /** ключ поля текста в карточке дня (или "order") */
  text?: string;
  /** ключ поля времени остановки */
  time?: string;
  /** ключ поля «заменить на карточку справочника» */
  ref?: string;
}

export interface EditsValue {
  token: string | null;
  expiresAt: number;
  dayNotes: Record<string, DayNote>;
  stopNotes: Record<string, StopNote>;
  dayTexts: Record<string, DayTextsMap>;
  guideTags: Record<string, GuideTagValue>;
  editing: EditingState;
  error: string;
  loading: boolean;
  setEditing: (patch: Partial<EditingState>) => void;
  saveDayNote: (key: string, body: string) => Promise<void>;
  deleteDayNote: (key: string) => Promise<void>;
  saveStopNote: (key: string, body: string) => Promise<void>;
  resetStopNote: (key: string) => Promise<void>;
  saveText: (dayKey: string, field: string, value: string) => Promise<void>;
  saveGuideTag: (key: string, tag: GuideTagValue) => Promise<void>;
  login: (password: string) => Promise<void>;
  logout: () => void;
  reload: () => void;
}

const EditsContext = createContext<EditsValue | null>(null);

const EMPTY_EDITS: EditingState = {};

function normalizeText(value: string): string {
  return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

export function EditsProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const token = auth.token;
  const [dayNotes, setDayNotes] = useState<Record<string, DayNote>>({});
  const [stopNotes, setStopNotes] = useState<Record<string, StopNote>>({});
  const [dayTexts, setDayTexts] = useState<Record<string, DayTextsMap>>({});
  const [guideTags, setGuideTags] = useState<Record<string, GuideTagValue>>({});
  const [editing, setEditingState] = useState<EditingState>(EMPTY_EDITS);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reloadTick, setReloadTick] = useState(0);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  /** 401 посреди работы: токен протух — выходим и говорим об этом. */
  const fail = useCallback((err: unknown, fallback = "не сохранилось") => {
    if (err instanceof ApiError && err.status === 401) {
      clearAuth();
      setError("правка закрыта: войдите заново");
      return;
    }
    const message = err instanceof Error && err.message ? err.message : fallback;
    setError(message);
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    Promise.all([
      api.listDayNotes(ctrl.signal).catch(() => []),
      api.listStopNotes(ctrl.signal).catch(() => []),
      api.listDayTexts(ctrl.signal).catch(() => []),
      api.listGuideTags(ctrl.signal).catch(() => []),
    ])
      .then(([notes, stops, texts, tags]) => {
        if (!alive.current) return;
        setDayNotes(Object.fromEntries(notes.map((n) => [n.day_key, n])));
        setStopNotes(Object.fromEntries(stops.map((n) => [n.stop_key, n])));
        setDayTexts(
          Object.fromEntries(texts.map((t) => [t.day_key, t.texts ?? {}])),
        );
        setGuideTags(Object.fromEntries(tags.map((t) => [t.tag_key, t.tag])));
      })
      .finally(() => {
        if (alive.current) setLoading(false);
      });
    return () => ctrl.abort();
  }, [reloadTick]);

  const setEditing = useCallback((patch: Partial<EditingState>) => {
    setEditingState((prev) => ({ ...prev, ...patch }));
  }, []);

  const requireToken = useCallback((): string | null => {
    if (!token) {
      setError("чтобы править, войдите по паролю");
      return null;
    }
    return token;
  }, [token]);

  const saveDayNote = useCallback(
    async (key: string, body: string) => {
      const t = requireToken();
      if (!t) return;
      try {
        const note = await api.putDayNote(key, body, t);
        setDayNotes((prev) => {
          const next = { ...prev };
          if (note) next[key] = note;
          else delete next[key];
          return next;
        });
        setEditing({ note: undefined });
        setError("");
      } catch (err) {
        fail(err);
      }
    },
    [requireToken, fail, setEditing],
  );

  const deleteDayNote = useCallback(
    async (key: string) => {
      const t = requireToken();
      if (!t) return;
      try {
        await api.deleteDayNote(key, t);
      } catch {
        /* удаление идёт «через силу»: локальное состояние всё равно чистим */
      }
      setDayNotes((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setEditing({ note: undefined });
      setError("");
    },
    [requireToken, setEditing],
  );

  const saveStopNote = useCallback(
    async (key: string, body: string) => {
      const t = requireToken();
      if (!t) return;
      try {
        const note = await api.putStopNote(key, body, t);
        setStopNotes((prev) => {
          const next = { ...prev };
          if (note) next[key] = note;
          else delete next[key];
          return next;
        });
        setEditing({ stop: undefined });
        setError("");
      } catch (err) {
        fail(err);
      }
    },
    [requireToken, fail, setEditing],
  );

  const resetStopNote = useCallback(
    async (key: string) => {
      const t = requireToken();
      if (!t) return;
      try {
        await api.deleteStopNote(key, t);
      } catch {
        /* возвращаем авторский текст в любом случае */
      }
      setStopNotes((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setEditing({ stop: undefined });
      setError("");
    },
    [requireToken, setEditing],
  );

  const saveText = useCallback(
    async (dayKey: string, field: string, value: string) => {
      const t = requireToken();
      if (!t) return;
      setDayTexts((prev) => {
        const texts = { ...(prev[dayKey] ?? {}) };
        const clean = normalizeText(value);
        if (clean === "") delete texts[field];
        else texts[field] = clean;
        return { ...prev, [dayKey]: texts };
      });
      const texts = { ...(dayTexts[dayKey] ?? {}) };
      const clean = normalizeText(value);
      if (clean === "") delete texts[field];
      else texts[field] = clean;
      try {
        const saved = await api.putDayTexts(dayKey, texts, t);
        setDayTexts((prev) => {
          const next = { ...prev };
          if (saved) next[dayKey] = saved;
          else delete next[dayKey];
          return next;
        });
        setEditing({ text: undefined, time: undefined, ref: undefined });
        setError("");
      } catch (err) {
        fail(err);
        setReloadTick((n) => n + 1);
      }
    },
    [requireToken, dayTexts, fail, setEditing],
  );

  const saveGuideTag = useCallback(
    async (key: string, tag: GuideTagValue) => {
      const t = requireToken();
      if (!t) return;
      setGuideTags((prev) => ({ ...prev, [key]: tag }));
      try {
        const saved = await api.putGuideTag(key, tag, t);
        if (saved?.tag_key) setGuideTags((prev) => ({ ...prev, [saved.tag_key]: saved.tag }));
        setError("");
      } catch (err) {
        fail(err);
        setReloadTick((n) => n + 1);
      }
    },
    [requireToken, fail],
  );

  const login = useCallback(async (password: string) => {
    setError("");
    try {
      await loginWithPassword(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "вход не удался");
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setEditingState(EMPTY_EDITS);
    setError("");
  }, []);

  const reload = useCallback(() => setReloadTick((n) => n + 1), []);

  const value = useMemo<EditsValue>(
    () => ({
      token,
      expiresAt: auth.expiresAt,
      dayNotes,
      stopNotes,
      dayTexts,
      guideTags,
      editing,
      error,
      loading,
      setEditing,
      saveDayNote,
      deleteDayNote,
      saveStopNote,
      resetStopNote,
      saveText,
      saveGuideTag,
      login,
      logout,
      reload,
    }),
    [
      token,
      auth.expiresAt,
      dayNotes,
      stopNotes,
      dayTexts,
      guideTags,
      editing,
      error,
      loading,
      setEditing,
      saveDayNote,
      deleteDayNote,
      saveStopNote,
      resetStopNote,
      saveText,
      saveGuideTag,
      login,
      logout,
      reload,
    ],
  );

  return <EditsContext.Provider value={value}>{children}</EditsContext.Provider>;
}

export function useEdits(): EditsValue {
  const ctx = useContext(EditsContext);
  if (!ctx) throw new Error("useEdits must be used inside <EditsProvider>");
  return ctx;
}
