# Поездка в Китай · осень 2026

Интерактивный план поездки: варианты маршрута, расписание по дням, карта, фото, чеклист бронирования.

## Файлы
- `index.html` — приложение (самодостаточное: дизайн + логика внутри)
- `assets/data.js` — сгенерированные данные (URL фото, координаты точек)
- `assets/photos.json`, `assets/places.json` — сырые данные (фото из Wikimedia, геокодинг OSM/Nominatim)

## Локальный просмотр
```bash
python3 -m http.server 8765
```
открой http://localhost:8765 — или просто открой `index.html` двойным кликом.

## Деплой на GitHub Pages
1. Создай пустой репозиторий на GitHub (например `china-trip`).
2. ```bash
   git remote add origin git@github.com:<user>/china-trip.git
   git push -u origin main
   ```
3. В репозитории: **Settings → Pages → Source: Deploy from a branch → main / root**.
4. Сайт будет на `https://<user>.github.io/china-trip/`.

## Данные
- Фото — Wikimedia Commons (лицензии CC, атрибуция в подвале сайта).
- Координаты — OpenStreetMap/Nominatim (WGS-84); карта — CARTO/OSM.
- Маршрут — черновик, даты уточняются (3 варианта, «хвост» Чунцин/Улун/Бэйбэй детально расписан).
