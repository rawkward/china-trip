import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

export interface ZoomImageProps {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
}

const MIN_SCALE = 1;
const MAX_SCALE = 6;
const BUTTON_STEP = 0.5;
const WHEEL_STEP = 0.25;
const DOUBLE_TAP_SCALE = 2.5;

interface Transform {
  k: number;
  x: number;
  y: number;
}

const IDENTITY: Transform = { k: MIN_SCALE, x: 0, y: 0 };

function clampScale(value: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));
}

/** Картинка-миниатюра: по клику открывает полноэкранный просмотр с зумом. */
export function ZoomImage({ src, alt, caption, className }: ZoomImageProps) {
  const [open, setOpen] = useState(false);
  const [transform, setTransform] = useState<Transform>(IDENTITY);
  const closeRef = useRef<HTMLButtonElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchStart = useRef<{ distance: number; scale: number } | null>(null);
  const dragStart = useRef<{ pointerId: number; x: number; y: number; tx: number; ty: number } | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    setTransform(IDENTITY);
    pointers.current.clear();
    pinchStart.current = null;
    dragStart.current = null;
  }, []);

  const zoomBy = (delta: number) => {
    setTransform((prev) => ({ k: clampScale(prev.k + delta), x: 0, y: 0 }));
  };

  const reset = () => setTransform(IDENTITY);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const area = areaRef.current;
    if (!area) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      setTransform((prev) => ({ k: clampScale(prev.k + (event.deltaY < 0 ? WHEEL_STEP : -WHEEL_STEP)), x: 0, y: 0 }));
    };
    area.addEventListener("wheel", onWheel, { passive: false });
    return () => area.removeEventListener("wheel", onWheel);
  }, [open]);

  const handleBackdrop = (event: ReactMouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("[data-zoom-panel]")) return;
    close();
  };

  const pointerDistance = (): number => {
    const [a, b] = [...pointers.current.values()];
    if (!a || !b) return 0;
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 2) {
      pinchStart.current = { distance: pointerDistance(), scale: transform.k };
      dragStart.current = null;
    } else if (pointers.current.size === 1 && transform.k > 1) {
      dragStart.current = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        tx: transform.x,
        ty: transform.y,
      };
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.current.size >= 2 && pinchStart.current) {
      const distance = pointerDistance();
      if (pinchStart.current.distance > 0) {
        const scale = pinchStart.current.scale * (distance / pinchStart.current.distance);
        setTransform({ k: clampScale(scale), x: 0, y: 0 });
      }
      return;
    }

    const drag = dragStart.current;
    if (drag && drag.pointerId === event.pointerId) {
      setTransform((prev) => ({
        ...prev,
        x: drag.tx + (event.clientX - drag.x),
        y: drag.ty + (event.clientY - drag.y),
      }));
    }
  };

  const handlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
    if (dragStart.current?.pointerId === event.pointerId) dragStart.current = null;
  };

  const handleDoubleClick = () => {
    setTransform((prev) => (prev.k > 1 ? IDENTITY : { k: DOUBLE_TAP_SCALE, x: 0, y: 0 }));
  };

  const zoomLabel = alt ? `Открыть крупнее: ${alt}` : "Открыть крупнее";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={zoomLabel}
        title={zoomLabel}
        className={cn("group relative block w-full cursor-zoom-in", className)}
      >
        <img src={src} alt={alt} loading="lazy" draggable={false} className="w-full rounded-md border border-line" />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-1.5 top-1.5 rounded-full bg-ink/70 px-2 py-0.5 text-[0.68rem] font-semibold text-paper opacity-90"
        >
          увеличить ⤢
        </span>
      </button>

      {open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={alt}
            onClick={handleBackdrop}
            className="fixed inset-0 z-[1400] flex flex-col items-center justify-center overflow-hidden bg-ink/85 p-4 backdrop-blur-sm"
          >
            <button
              ref={closeRef}
              type="button"
              onClick={close}
              aria-label="Закрыть"
              title="Закрыть"
              className="absolute right-3 top-3 inline-flex size-10 items-center justify-center rounded-full border border-paper/25 bg-ink/60 text-xl leading-none text-paper transition-colors hover:bg-ink/80"
            >
              <span aria-hidden="true">×</span>
            </button>

            <div className="flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden">
              <div
                ref={areaRef}
                data-zoom-panel=""
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerEnd}
                onPointerCancel={handlePointerEnd}
                onDoubleClick={handleDoubleClick}
                className={cn(
                  "flex h-full w-full touch-none select-none items-center justify-center",
                  transform.k > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in",
                )}
              >
                <img
                  src={src}
                  alt={alt}
                  draggable={false}
                  className="max-h-full max-w-full object-contain"
                  style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})` }}
                />
              </div>
            </div>

            {caption && (
              <p data-zoom-panel="" className="mt-2 max-w-[92vw] shrink-0 text-center text-[0.78rem] leading-snug text-paper/80">
                {caption}
              </p>
            )}

            <div
              data-zoom-panel=""
              className="mt-3 flex shrink-0 items-center gap-2 rounded-full border border-paper/20 bg-ink/70 px-2 py-1.5 text-paper"
            >
              <button
                type="button"
                onClick={() => zoomBy(-BUTTON_STEP)}
                aria-label="Уменьшить"
                title="Уменьшить"
                className="inline-flex size-9 items-center justify-center rounded-full text-lg leading-none transition-colors hover:bg-paper/15 disabled:opacity-40"
                disabled={transform.k <= MIN_SCALE}
              >
                −
              </button>
              <span aria-live="polite" className="min-w-[3.5rem] text-center text-[0.82rem] font-semibold tabular-nums">
                {Math.round(transform.k * 100)}%
              </span>
              <button
                type="button"
                onClick={() => zoomBy(BUTTON_STEP)}
                aria-label="Увеличить"
                title="Увеличить"
                className="inline-flex size-9 items-center justify-center rounded-full text-lg leading-none transition-colors hover:bg-paper/15 disabled:opacity-40"
                disabled={transform.k >= MAX_SCALE}
              >
                +
              </button>
              <button
                type="button"
                onClick={reset}
                className="ml-1 rounded-full px-3 py-1.5 text-[0.78rem] font-semibold transition-colors hover:bg-paper/15"
              >
                Сброс
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
