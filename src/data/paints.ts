import { BODY_COLORS, PAINT_FILTERS } from "./paintFilters";

/**
 * Paints that can be sprayed on an owned car in the garage.
 *
 * Every sprite has its own body colour, so each paint stores the colour it is
 * supposed to look like (`hex`); `paintFilters.ts` (generated) holds the CSS
 * filter that maps every car sprite onto that colour. That way the chip in the
 * picker and the car on screen always show the same paint.
 */
export interface Paint {
  id: string;
  name: { en: string; fa: string };
  /** coins charged every time this paint is applied (0 = factory colour) */
  price: number;
  /** the colour the car body turns into */
  hex: string;
}

export const STOCK_PAINT = "stock";

export const PAINTS: Paint[] = [
  { id: STOCK_PAINT, name: { en: "FACTORY", fa: "رنگ کارخانه" }, price: 0, hex: "#4f7fd8" },
  { id: "crimson", name: { en: "CRIMSON", fa: "زرشکی" }, price: 400, hex: "#e02436" },
  { id: "sunburst", name: { en: "SUNBURST", fa: "کهربایی" }, price: 700, hex: "#f59b18" },
  { id: "acid", name: { en: "ACID", fa: "اسیدی" }, price: 900, hex: "#a6de2a" },
  { id: "seafoam", name: { en: "SEAFOAM", fa: "دریایی" }, price: 1100, hex: "#21c39a" },
  { id: "glacier", name: { en: "GLACIER", fa: "یخی" }, price: 1300, hex: "#5fd4f2" },
  { id: "ultraviolet", name: { en: "ULTRAVIOLET", fa: "فرابنفش" }, price: 1600, hex: "#9455e8" },
  { id: "bubblegum", name: { en: "BUBBLEGUM", fa: "آدامسی" }, price: 1900, hex: "#f55fa8" },
  { id: "midnight", name: { en: "MIDNIGHT", fa: "نیمه‌شب" }, price: 2100, hex: "#223a78" },
  { id: "gold", name: { en: "24K GOLD", fa: "طلایی" }, price: 2400, hex: "#e8b72a" },
  { id: "chrome", name: { en: "CHROME", fa: "کرومی" }, price: 2800, hex: "#c9d2e0" },
];

/** paint id per car id */
export type Paints = Record<string, string>;

const BY_ID: Record<string, Paint> = Object.fromEntries(PAINTS.map((p) => [p.id, p]));

export function paintById(id: string | undefined): Paint {
  return (id && BY_ID[id]) || BY_ID[STOCK_PAINT];
}

/* ------------------------------------------------------------------ */
/* colours                                                             */
/* ------------------------------------------------------------------ */

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function mix(hex: string, target: number, amount: number): string {
  const c = hexToRgb(hex).map((v) => Math.round(v + (target - v) * amount));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

function rgbToHex(rgb: [number, number, number]): string {
  return `#${rgb.map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("")}`;
}

/** The colour a paint shows on a given car (factory paint differs per car). */
export function paintColor(paint: Paint, carId?: string): string {
  if (paint.id === STOCK_PAINT && carId && BODY_COLORS[carId]) return rgbToHex(BODY_COLORS[carId]);
  return paint.hex;
}

/** Two-stop gradient that represents a paint in the picker. */
export function paintSwatch(paint: Paint, carId?: string): string {
  const base = paintColor(paint, carId);
  return `linear-gradient(135deg, ${mix(base, 255, 0.28)}, ${mix(base, 0, 0.22)})`;
}

/* ------------------------------------------------------------------ */
/* filters                                                             */
/* ------------------------------------------------------------------ */

/**
 * CSS filter that recolours the sprite of `carId` with `paintId`
 * (empty string = factory paint / no change).
 */
export function paintFilterFor(carId: string, paintId: string | undefined): string {
  if (!paintId || paintId === STOCK_PAINT) return "";
  const byCar = PAINT_FILTERS[carId];
  const combo = (byCar ?? PAINT_FILTERS[Object.keys(PAINT_FILTERS)[0]])?.[paintId];
  if (!combo) return "";
  const [deg, sat, bri] = combo;
  return `hue-rotate(${deg}deg) saturate(${sat}) brightness(${bri})`;
}

/** Filter string that keeps an extra filter (e.g. a drop shadow) in place. */
export function paintFilterWith(carId: string, paintId: string | undefined, extra: string): string {
  return [paintFilterFor(carId, paintId), extra].filter(Boolean).join(" ");
}

export function paintName(id: string | undefined, lang: "en" | "fa"): string {
  return paintById(id).name[lang];
}
