import { CAR_DIM, CAR_IMG } from "../assets/cars/images";

/** Upgrade categories available in the garage. */
export type UpgradeKey = "engine" | "body" | "tires" | "nitro";

export interface UpgradeDef {
  key: UpgradeKey;
  /** points gained per level */
  perLevel: number;
  baseCost: number;
  maxLevel: number;
}

export const UPGRADES: UpgradeDef[] = [
  { key: "engine", perLevel: 8, baseCost: 750, maxLevel: 8 },
  { key: "body", perLevel: 6, baseCost: 600, maxLevel: 8 },
  { key: "tires", perLevel: 3, baseCost: 520, maxLevel: 8 },
  { key: "nitro", perLevel: 5, baseCost: 880, maxLevel: 8 },
];

export const MAX_LEVEL = 8;

/** Cost of the next level for a category (0 when maxed). */
export function upgradeCost(key: UpgradeKey, level: number): number {
  const def = UPGRADES.find((u) => u.key === key)!;
  if (level >= def.maxLevel) return 0;
  return Math.round((def.baseCost * Math.pow(1.55, level)) / 10) * 10;
}

/* ------------------------------------------------------------------ */
/* brands                                                              */
/* ------------------------------------------------------------------ */

export type Drive = "FWD" | "RWD" | "AWD" | "MR" | "4WD";
export type BrandId = "volta" | "rumble" | "neonix" | "blueline";

export interface BrandInfo {
  name: string;
  initial: string;
  color: string;
  country: { en: string; fa: string };
}

export const BRANDS: Record<BrandId, BrandInfo> = {
  volta: { name: "VOLTA", initial: "V", color: "#3d8ff5", country: { en: "JAPAN", fa: "ژاپن" } },
  rumble: { name: "RUMBLE", initial: "R", color: "#ff7a1a", country: { en: "USA", fa: "آمریکا" } },
  neonix: { name: "NEONIX", initial: "N", color: "#a15cff", country: { en: "ITALY", fa: "ایتالیا" } },
  blueline: { name: "BLUELINE", initial: "B", color: "#e0a814", country: { en: "USA", fa: "آمریکا" } },
};

export const RARITY_COLORS: Record<string, string> = {
  COMMON: "#8ec9ff",
  RARE: "#46f0a0",
  "RARE+": "#ff9a1f",
  EPIC: "#c66bff",
  LEGENDARY: "#ffd23a",
  MYTHIC: "#ff5d8f",
};

/* ------------------------------------------------------------------ */
/* cars                                                                */
/* ------------------------------------------------------------------ */

export interface Car {
  id: string;
  brand: BrandId;
  /** small label on the dark strip (e.g. MUSCLE) */
  cls: string;
  /** big label on the orange banner (e.g. THUNDER) */
  name: string;
  year: number;
  rarity: string;
  rarityColor: string;
  accent: string;
  image: string;
  imgW: number;
  imgH: number;
  /** crop centre for the round avatar (fractions of the image) */
  face: { x: number; y: number; zoom: number };
  /** car tier shown in the TIER pill */
  tier: number;
  /** dealership price in coins (0 = starter car) */
  price: number;
  /** engine output shown on dealership cards */
  bhp: number;
  drive: Drive;
  /** short shop description */
  desc: { en: string; fa: string };
  /** base performance figures (before upgrades) */
  topSpeed: number;
  armor: number;
  accel: number;
  boost: number;
}

type CarSpec = Omit<Car, "image" | "imgW" | "imgH" | "rarityColor">;

function make(spec: CarSpec): Car {
  const [w, h] = CAR_DIM[spec.id] ?? [760, 460];
  return { ...spec, image: CAR_IMG[spec.id], imgW: w, imgH: h, rarityColor: RARITY_COLORS[spec.rarity] ?? "#8ec9ff" };
}

const FACE_TUNER = { x: 0.42, y: 0.5, zoom: 3.4 };
const FACE_MUSCLE = { x: 0.42, y: 0.5, zoom: 3.4 };
const FACE_HYPER = { x: 0.42, y: 0.5, zoom: 3.4 };
const FACE_POLICE = { x: 0.45, y: 0.5, zoom: 3.2 };

export const cars: Car[] = [
  /* ---------- VOLTA (Japan) — tuners ---------- */
  make({
    id: "comet",
    brand: "volta",
    cls: "TUNER",
    name: "COMET",
    year: 2019,
    rarity: "COMMON",
    accent: "#3d8ff5",
    face: FACE_TUNER,
    tier: 1,
    price: 0,
    bhp: 178,
    drive: "FWD",
    desc: {
      en: "Light, nimble starter. Weaves through traffic but crumples on impact.",
      fa: "ماشین شروع سبک و چابک. از لای ترافیک رد می‌شود اما بدنه‌اش ضعیف است.",
    },
    topSpeed: 214,
    armor: 38,
    accel: 62,
    boost: 45,
  }),
  make({
    id: "comet-rs",
    brand: "volta",
    cls: "TUNER",
    name: "COMET RS",
    year: 2021,
    rarity: "RARE",
    accent: "#ff3b2f",
    face: FACE_TUNER,
    tier: 2,
    price: 9500,
    bhp: 212,
    drive: "FWD",
    desc: {
      en: "Track-tuned hatch with a stiffer chassis and a louder exhaust.",
      fa: "هاچ‌بک تیون‌شده برای پیست با شاسی سفت‌تر و اگزوز پرصداتر.",
    },
    topSpeed: 226,
    armor: 40,
    accel: 68,
    boost: 50,
  }),
  make({
    id: "comet-gt",
    brand: "volta",
    cls: "TUNER",
    name: "COMET GT",
    year: 2022,
    rarity: "RARE",
    accent: "#ffd23a",
    face: FACE_TUNER,
    tier: 2,
    price: 14000,
    bhp: 248,
    drive: "AWD",
    desc: {
      en: "All-wheel-drive grip. Launches off the line before the cops blink.",
      fa: "چهارچرخ محرک با چسبندگی بالا. قبل از اینکه پلیس پلک بزند از جا کنده می‌شود.",
    },
    topSpeed: 234,
    armor: 44,
    accel: 74,
    boost: 56,
  }),
  make({
    id: "comet-evo",
    brand: "volta",
    cls: "TUNER",
    name: "COMET EVO",
    year: 2023,
    rarity: "RARE+",
    accent: "#46f0a0",
    face: FACE_TUNER,
    tier: 3,
    price: 21000,
    bhp: 286,
    drive: "AWD",
    desc: {
      en: "The final evolution: twin-turbo, anti-lag and a rally-bred gearbox.",
      fa: "نسخه‌ی نهایی: توئین‌توربو، آنتی‌لگ و گیربکس رالی.",
    },
    topSpeed: 246,
    armor: 48,
    accel: 80,
    boost: 62,
  }),

  /* ---------- RUMBLE (USA) — muscle ---------- */
  make({
    id: "thunder-rx",
    brand: "rumble",
    cls: "MUSCLE",
    name: "THUNDER RX",
    year: 1969,
    rarity: "RARE",
    accent: "#3d9a1f",
    face: FACE_MUSCLE,
    tier: 3,
    price: 18500,
    bhp: 375,
    drive: "RWD",
    desc: {
      en: "Barn-find classic with a big-block V8. Heavy, loud and proud.",
      fa: "کلاسیک پیداشده در انبار با موتور V8 بزرگ. سنگین، پرسروصدا و مغرور.",
    },
    topSpeed: 256,
    armor: 70,
    accel: 64,
    boost: 60,
  }),
  make({
    id: "thunder",
    brand: "rumble",
    cls: "MUSCLE",
    name: "THUNDER",
    year: 1970,
    rarity: "RARE+",
    accent: "#ff3b2f",
    face: FACE_MUSCLE,
    tier: 3,
    price: 25000,
    bhp: 425,
    drive: "RWD",
    desc: {
      en: "V8 muscle with a heavy frame. Smashes roadblocks like cardboard.",
      fa: "ماسل‌کار V8 با شاسی سنگین. سدهای پلیس را مثل مقوا خرد می‌کند.",
    },
    topSpeed: 268,
    armor: 74,
    accel: 71,
    boost: 68,
  }),
  make({
    id: "thunder-ss",
    brand: "rumble",
    cls: "MUSCLE",
    name: "THUNDER SS",
    year: 2018,
    rarity: "EPIC",
    accent: "#3d8ff5",
    face: FACE_MUSCLE,
    tier: 4,
    price: 34000,
    bhp: 455,
    drive: "RWD",
    desc: {
      en: "Modern super-sport trim: wider tyres, launch control and a supercharger whine.",
      fa: "تریم سوپراسپرت مدرن: لاستیک پهن‌تر، لانچ کنترل و صدای سوپرشارژر.",
    },
    topSpeed: 278,
    armor: 78,
    accel: 75,
    boost: 72,
  }),
  make({
    id: "thunder-hc",
    brand: "rumble",
    cls: "MUSCLE",
    name: "THUNDER HC",
    year: 2021,
    rarity: "EPIC",
    accent: "#c92a12",
    face: FACE_MUSCLE,
    tier: 4,
    price: 46000,
    bhp: 707,
    drive: "RWD",
    desc: {
      en: "707 horsepower of pure chaos. Tyres optional, courage mandatory.",
      fa: "۷۰۷ اسب بخار هرج‌ومرج خالص. لاستیک اختیاری، شجاعت اجباری.",
    },
    topSpeed: 292,
    armor: 82,
    accel: 80,
    boost: 80,
  }),

  /* ---------- NEONIX (Italy) — hypercars ---------- */
  make({
    id: "phantom",
    brand: "neonix",
    cls: "HYPER",
    name: "PHANTOM",
    year: 2024,
    rarity: "EPIC",
    accent: "#8e3bff",
    face: FACE_HYPER,
    tier: 5,
    price: 60000,
    bhp: 780,
    drive: "MR",
    desc: {
      en: "Neon hypercar — the fastest thing in the city. Cops can't keep up.",
      fa: "هایپرکار نئونی؛ سریع‌ترین ماشین شهر. پلیس به گردش هم نمی‌رسد.",
    },
    topSpeed: 331,
    armor: 61,
    accel: 94,
    boost: 88,
  }),
  make({
    id: "phantom-r",
    brand: "neonix",
    cls: "HYPER",
    name: "PHANTOM R",
    year: 2025,
    rarity: "EPIC",
    accent: "#14c9a0",
    face: FACE_HYPER,
    tier: 5,
    price: 72000,
    bhp: 820,
    drive: "4WD",
    desc: {
      en: "Road-legal racer with active aero and torque-vectoring all-wheel drive.",
      fa: "مسابقه‌ای قانونی برای خیابان با آیرودینامیک فعال و چهارچرخ محرک هوشمند.",
    },
    topSpeed: 338,
    armor: 64,
    accel: 98,
    boost: 90,
  }),
  make({
    id: "phantom-x",
    brand: "neonix",
    cls: "HYPER",
    name: "PHANTOM X",
    year: 2025,
    rarity: "LEGENDARY",
    accent: "#ff9a1f",
    face: FACE_HYPER,
    tier: 6,
    price: 88000,
    bhp: 900,
    drive: "4WD",
    desc: {
      en: "Experimental hybrid prototype. Silent in electric mode, savage in boost.",
      fa: "پروتوتایپ هیبریدی آزمایشی. در حالت برقی بی‌صدا، در بوست وحشی.",
    },
    topSpeed: 347,
    armor: 66,
    accel: 102,
    boost: 96,
  }),
  make({
    id: "phantom-sv",
    brand: "neonix",
    cls: "HYPER",
    name: "PHANTOM SV",
    year: 2026,
    rarity: "LEGENDARY",
    accent: "#ff3b5c",
    face: FACE_HYPER,
    tier: 6,
    price: 105000,
    bhp: 1020,
    drive: "MR",
    desc: {
      en: "SuperVeloce limited edition — 1,020 bhp and only 20 ever built.",
      fa: "نسخه‌ی محدود سوپرولوچه — ۱۰۲۰ اسب بخار و فقط ۲۰ دستگاه ساخته شده.",
    },
    topSpeed: 358,
    armor: 68,
    accel: 106,
    boost: 100,
  }),

  /* ---------- BLUELINE (USA) — pursuit ---------- */
  make({
    id: "interceptor",
    brand: "blueline",
    cls: "STOLEN",
    name: "INTERCEPTOR",
    year: 2022,
    rarity: "LEGENDARY",
    accent: "#1b2142",
    face: FACE_POLICE,
    tier: 6,
    price: 120000,
    bhp: 450,
    drive: "RWD",
    desc: {
      en: "A stolen police cruiser. Steel bull bar and sirens that confuse the chase.",
      fa: "یک ماشین پلیس دزدی! سپر فولادی و آژیری که تعقیب‌کننده‌ها را گیج می‌کند.",
    },
    topSpeed: 296,
    armor: 112,
    accel: 78,
    boost: 74,
  }),
  make({
    id: "interceptor-gold",
    brand: "blueline",
    cls: "STOLEN",
    name: "INTERCEPTOR GOLD",
    year: 2023,
    rarity: "MYTHIC",
    accent: "#ffd23a",
    face: FACE_POLICE,
    tier: 7,
    price: 150000,
    bhp: 520,
    drive: "AWD",
    desc: {
      en: "The chief's gold-plated parade cruiser. The most armoured car in the city.",
      fa: "ماشین رژه‌ی طلاکوب رئیس پلیس. زره‌پوش‌ترین ماشین شهر.",
    },
    topSpeed: 306,
    armor: 124,
    accel: 82,
    boost: 80,
  }),
];

/** The pursuing police car (used in the loading / race art). */
export const policeCar = {
  image: CAR_IMG.interceptor,
  imgW: CAR_DIM.interceptor?.[0] ?? 760,
  imgH: CAR_DIM.interceptor?.[1] ?? 463,
};

/** Upper bounds (fully upgraded best car) used to scale stat bars in the shop. */
export const STAT_MAX = { topSpeed: 400, armor: 160, accel: 120, boost: 130 };

/** Live performance of a car for a given upgrade level set. */
export interface CarStats {
  topSpeed: number;
  armor: number;
  accel: number;
  boost: number;
  power: number;
}

export function carStats(car: Car, lv: Partial<Record<UpgradeKey, number>>): CarStats {
  const l = (k: UpgradeKey) => lv[k] ?? 0;
  const topSpeed = car.topSpeed + l("engine") * 8;
  const armor = car.armor + l("body") * 6;
  const accel = car.accel + l("tires") * 3;
  const boost = car.boost + l("nitro") * 5;
  // overall power rating
  const power = Math.round(topSpeed * 0.55 + armor * 3.2 + accel * 2.4 + boost * 2.8);
  return { topSpeed, armor, accel, boost, power };
}

/* ------------------------------------------------------------------ */
/* dealership helpers                                                  */
/* ------------------------------------------------------------------ */

/** Performance Points (PP) — the car's stock power rating. */
export function ppOf(car: Car): number {
  return carStats(car, {}).power;
}

/** Display title like "COMET RS '21". */
export function carTitle(car: Car): string {
  return `${car.name} '${String(car.year).slice(-2)}`;
}

/** Coins already invested in upgrades. */
export function upgradeSpent(lv: Partial<Record<UpgradeKey, number>>): number {
  let total = 0;
  for (const u of UPGRADES) {
    const n = Math.min(MAX_LEVEL, lv[u.key] ?? 0);
    for (let i = 0; i < n; i++) total += upgradeCost(u.key, i);
  }
  return total;
}

/** Resale value: 60% of the list price + half of the money spent on upgrades. */
export function sellValue(car: Car, lv: Partial<Record<UpgradeKey, number>>): number {
  return Math.round((car.price * 0.6 + upgradeSpent(lv) * 0.5) / 10) * 10;
}
