/**
 * Paints that can be sprayed on an owned car in the garage.
 *
 * Every car sprite is recoloured with a CSS filter (hue rotation + saturation),
 * which keeps the artwork, windows and shading intact while changing the body
 * colour. Applying a paint always costs coins — the stock colour is free so the
 * player can always go back to the factory look.
 */
export interface Paint {
  id: string;
  name: { en: string; fa: string };
  /** coins charged every time this paint is applied */
  price: number;
  /** CSS filter applied to the car sprite ("" = untouched factory paint) */
  filter: string;
  /** two-stop gradient used for the colour chip in the picker */
  swatch: string;
}

export const STOCK_PAINT = "stock";

export const PAINTS: Paint[] = [
  {
    id: STOCK_PAINT,
    name: { en: "FACTORY", fa: "رنگ کارخانه" },
    price: 0,
    filter: "",
    swatch: "linear-gradient(135deg,#6f9bf0,#2b4fa8)",
  },
  {
    id: "crimson",
    name: { en: "CRIMSON", fa: "زرشکی" },
    price: 400,
    filter: "hue-rotate(130deg) saturate(1.7) brightness(0.9)",
    swatch: "linear-gradient(135deg,#ff6a5a,#a5160f)",
  },
  {
    id: "sunburst",
    name: { en: "SUNBURST", fa: "کهربایی" },
    price: 700,
    filter: "hue-rotate(186deg) saturate(3.2) brightness(1.45)",
    swatch: "linear-gradient(135deg,#ffd15a,#e2830c)",
  },
  {
    id: "acid",
    name: { en: "ACID", fa: "اسیدی" },
    price: 900,
    filter: "hue-rotate(216deg) saturate(0.8) brightness(1.75)",
    swatch: "linear-gradient(135deg,#d4ff6a,#4fa01a)",
  },
  {
    id: "seafoam",
    name: { en: "SEAFOAM", fa: "دریایی" },
    price: 1100,
    filter: "hue-rotate(296deg) saturate(0.8) brightness(1.4)",
    swatch: "linear-gradient(135deg,#8ffbd0,#158d6a)",
  },
  {
    id: "glacier",
    name: { en: "GLACIER", fa: "یخی" },
    price: 1300,
    filter: "hue-rotate(348deg) saturate(0.8) brightness(1.75)",
    swatch: "linear-gradient(135deg,#c3ecff,#2f7fd0)",
  },
  {
    id: "ultraviolet",
    name: { en: "ULTRAVIOLET", fa: "فرابنفش" },
    price: 1600,
    filter: "hue-rotate(40deg) saturate(1.7) brightness(0.95)",
    swatch: "linear-gradient(135deg,#c98cff,#5b21b6)",
  },
  {
    id: "bubblegum",
    name: { en: "BUBBLEGUM", fa: "آدامسی" },
    price: 1900,
    filter: "hue-rotate(106deg) saturate(0.9) brightness(1.4)",
    swatch: "linear-gradient(135deg,#ffa8d6,#c01a6b)",
  },
  {
    id: "midnight",
    name: { en: "MIDNIGHT", fa: "نیمه‌شب" },
    price: 2100,
    filter: "hue-rotate(-40deg) saturate(1.1) brightness(0.45) contrast(1.15)",
    swatch: "linear-gradient(135deg,#4a5578,#0d1130)",
  },
  {
    id: "gold",
    name: { en: "24K GOLD", fa: "طلایی" },
    price: 2400,
    filter: "hue-rotate(180deg) saturate(0.9) brightness(1.75)",
    swatch: "linear-gradient(135deg,#fff0a0,#c98900)",
  },
  {
    id: "chrome",
    name: { en: "CHROME", fa: "کرومی" },
    price: 2800,
    filter: "saturate(0) brightness(1.3) contrast(1.05)",
    swatch: "linear-gradient(135deg,#ffffff,#8a96b4)",
  },
];

/** paint id per car id */
export type Paints = Record<string, string>;

const BY_ID: Record<string, Paint> = Object.fromEntries(PAINTS.map((p) => [p.id, p]));

export function paintById(id: string | undefined): Paint {
  return (id && BY_ID[id]) || BY_ID[STOCK_PAINT];
}

/** CSS filter for a paint id — empty string when the car wears the factory paint. */
export function paintFilter(id: string | undefined): string {
  return paintById(id).filter;
}

/** Filter string that keeps an extra filter (e.g. a drop shadow) in place. */
export function paintFilterWith(id: string | undefined, extra: string): string {
  return [paintFilter(id), extra].filter(Boolean).join(" ");
}

export function paintName(id: string | undefined, lang: "en" | "fa"): string {
  return paintById(id).name[lang];
}
