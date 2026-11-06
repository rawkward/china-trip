// Данные поездки. Файлы-источники — статические JS-объекты (перенесены из старого
// сайта без изменения содержимого), поэтому на границе один каст к нашим типам.
import rawItinerary from "./itinerary.js";
import rawGuide from "./guide.js";
// eslint-disable-next-line import/no-unresolved
import { TRIP_PHOTOS, TRIP_PLACES } from "./places.js";
import type { Guide, Itinerary, Photos, Places } from "../types";

export const ITINERARY = rawItinerary as unknown as Itinerary;
export const GUIDE = rawGuide as unknown as Guide;
export const PLACES = TRIP_PLACES as unknown as Places;
export const PHOTOS = TRIP_PHOTOS as unknown as Photos;

export const CITIES = ITINERARY.CITIES;
export const DATES = ITINERARY.DATES;
export const VARIANTS = ITINERARY.VARIANTS;
export const GUIDE_ITEMS = GUIDE.items;
