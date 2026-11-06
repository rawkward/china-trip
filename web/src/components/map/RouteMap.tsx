/** ЗАГЛУШКА — заменяется компонентом карты (Leaflet). */
export interface RouteMapProps {
  visible: boolean;
  focusDay: number | null;
  onDayChange?: (n: number) => void;
}

export function RouteMap({ visible, focusDay }: RouteMapProps) {
  return (
    <div className="rounded-card border border-dashed border-line-strong p-6 text-muted">
      Карта (в работе) · {visible ? "открыта" : "скрыта"} · день {focusDay ?? "—"}
    </div>
  );
}
