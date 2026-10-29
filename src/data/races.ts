import type { CarStats } from "./cars";

export type RaceId = "street" | "score" | "demolition" | "pursuit" | "drift" | "timeattack";

export type RaceIconKey = RaceId;

export interface RaceMode {
  id: RaceId;
  icon: RaceIconKey;
  /** gradient classes for the mode card */
  color: string;
  title: { en: string; fa: string };
  desc: { en: string; fa: string };
  /** which stat matters most */
  primary: "topSpeed" | "armor" | "accel" | "boost";
  /** entry fee in coins (0 = free) */
  fee: number;
  /** reward range for a 1st place finish */
  reward: [number, number];
  /** number of opponents */
  rivals: number;
  /** minimum power recommended */
  minPower: number;
  /** result unit label */
  unit: { en: string; fa: string };
}

export const RACES: RaceMode[] = [
  {
    id: "street",
    icon: "street",
    color: "from-[#5fc8ff] to-[#2b7fe0]",
    title: { en: "Street Race", fa: "مسابقه خیابانی" },
    desc: {
      en: "Classic sprint through downtown. First across the line wins the pot.",
      fa: "اسپرینت کلاسیک در مرکز شهر. اولین نفری که خط پایان را رد کند برنده است.",
    },
    primary: "topSpeed",
    fee: 500,
    reward: [3200, 4800],
    rivals: 5,
    minPower: 400,
    unit: { en: "LAP TIME", fa: "زمان دور" },
  },
  {
    id: "score",
    icon: "score",
    color: "from-[#ffd23a] to-[#ff9a1f]",
    title: { en: "Score Attack", fa: "کسب امتیاز" },
    desc: {
      en: "Chain near-misses, drifts and jumps. Highest score before the timer ends.",
      fa: "فرارهای مویی، دریفت و پرش را زنجیره کن. بیشترین امتیاز قبل از پایان زمان.",
    },
    primary: "accel",
    fee: 400,
    reward: [2800, 5600],
    rivals: 7,
    minPower: 350,
    unit: { en: "PTS", fa: "امتیاز" },
  },
  {
    id: "demolition",
    icon: "demolition",
    color: "from-[#ff6b4a] to-[#c92a12]",
    title: { en: "Demolition Duel", fa: "رو در رو (نابودی)" },
    desc: {
      en: "Head-to-head arena. Ram, slam and wreck your rival before they wreck you.",
      fa: "میدان رو در رو. حریف را بکوب و نابود کن قبل از اینکه او تو را نابود کند.",
    },
    primary: "armor",
    fee: 800,
    reward: [5000, 7500],
    rivals: 1,
    minPower: 520,
    unit: { en: "HP LEFT", fa: "جان باقی" },
  },
  {
    id: "pursuit",
    icon: "pursuit",
    color: "from-[#8fd0ff] to-[#1b2142]",
    title: { en: "Police Pursuit", fa: "فرار از پلیس" },
    desc: {
      en: "Survive the heat. Outrun cruisers, roadblocks and the chopper as long as you can.",
      fa: "زنده بمان! از ماشین‌های پلیس، سدها و هلیکوپتر تا جایی که می‌توانی فرار کن.",
    },
    primary: "topSpeed",
    fee: 0,
    reward: [2000, 6000],
    rivals: 6,
    minPower: 300,
    unit: { en: "SEC", fa: "ثانیه" },
  },
  {
    id: "drift",
    icon: "drift",
    color: "from-[#c98cff] to-[#8e3bff]",
    title: { en: "Drift King", fa: "پادشاه دریفت" },
    desc: {
      en: "Mountain pass showdown. Longest combined drift angle takes the crown.",
      fa: "رویارویی در گردنه کوهستان. طولانی‌ترین دریفت زنجیره‌ای تاج را می‌برد.",
    },
    primary: "accel",
    fee: 600,
    reward: [3600, 5200],
    rivals: 3,
    minPower: 450,
    unit: { en: "DRIFT PTS", fa: "امتیاز دریفت" },
  },
  {
    id: "timeattack",
    icon: "timeattack",
    color: "from-[#9ef05a] to-[#4fae22]",
    title: { en: "Time Attack", fa: "رکورد زمانی" },
    desc: {
      en: "Solo lap against the clock. Beat the ghost time for a bonus payout.",
      fa: "یک دور انفرادی مقابل زمان. رکورد شبح را بشکن و پاداش اضافه بگیر.",
    },
    primary: "boost",
    fee: 300,
    reward: [2200, 4000],
    rivals: 0,
    minPower: 300,
    unit: { en: "LAP", fa: "زمان دور" },
  },
];

/* ------------------------------------------------------------------ */
/* simulation                                                          */
/* ------------------------------------------------------------------ */

export interface RaceResult {
  raceId: RaceId;
  /** 1 = win */
  place: number;
  /** total participants incl. player */
  total: number;
  /** score shown in the result panel (value + unit) */
  score: string;
  /** coins earned (0 on a bad loss) */
  reward: number;
  /** nice per-stage breakdown for the result screen */
  highlights: { en: string; fa: string }[];
  /** was it a win? */
  won: boolean;
  /** damage (0-100) taken — flavour only */
  damage: number;
}

function rand(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

/** Performance factor 0..1+ based on the mode's primary stat vs recommended power. */
function performance(mode: RaceMode, stats: CarStats): number {
  const statWeight: Record<RaceMode["primary"], number> = {
    topSpeed: stats.topSpeed / 330,
    armor: stats.armor / 110,
    accel: stats.accel / 95,
    boost: stats.boost / 90,
  };
  const powerRatio = stats.power / Math.max(1, mode.minPower);
  // 65% primary stat, 35% overall power, with a dash of luck
  return statWeight[mode.primary] * 0.65 + Math.min(1.4, powerRatio) * 0.35 + (Math.random() - 0.5) * 0.25;
}

export function simulateRace(mode: RaceMode, stats: CarStats): RaceResult {
  const perf = performance(mode, stats);
  const total = mode.rivals + 1;

  // place: perf >= 1 almost always wins, < 0.6 usually last
  let place: number;
  if (mode.rivals === 0) {
    place = perf >= 0.95 ? 1 : 2; // 1 = beat the ghost, 2 = lost to ghost
  } else {
    const slot = Math.max(0, Math.min(1, (1.25 - perf) / 0.75)); // 0 best, 1 worst
    place = Math.max(1, Math.min(total, Math.round(1 + slot * (total - 1))));
  }
  const won = place === 1;

  // reward scaling by place
  const [lo, hi] = mode.reward;
  const base = rand(lo, hi);
  const placeFactor = won ? 1 : place === 2 ? 0.55 : place === 3 ? 0.35 : place <= total / 2 ? 0.2 : 0.08;
  const reward = Math.round((base * placeFactor) / 10) * 10;

  const damage = Math.max(0, Math.min(100, Math.round(60 - stats.armor * 0.4 + rand(-10, 25))));

  let score = "";
  const highlights: { en: string; fa: string }[] = [];

  switch (mode.id) {
    case "street": {
      const lap = (92 - stats.topSpeed * 0.12 + rand(-20, 20) / 10).toFixed(2);
      score = `${lap}s`;
      highlights.push(
        { en: `Finished ${ordinal(place)} of ${total}`, fa: `رتبه ${place} از ${total}` },
        { en: `Top speed ${stats.topSpeed} km/h`, fa: `سرعت نهایی ${stats.topSpeed} کیلومتر بر ساعت` },
        { en: `${rand(2, 6)} overtakes`, fa: `${rand(2, 6)} سبقت` },
      );
      break;
    }
    case "score": {
      const pts = Math.round((stats.accel * 180 + stats.boost * 120) * (0.7 + perf * 0.5));
      score = pts.toLocaleString("en-US");
      highlights.push(
        { en: `${rand(8, 24)} near-misses`, fa: `${rand(8, 24)} فرار مویی` },
        { en: `Best combo x${rand(4, 12)}`, fa: `بهترین کمبو x${rand(4, 12)}` },
        { en: `${rand(1, 5)} jumps landed`, fa: `${rand(1, 5)} پرش موفق` },
      );
      break;
    }
    case "demolition": {
      const hp = won ? rand(15, 70) : 0;
      score = won ? `${hp}%` : "WRECKED";
      highlights.push(
        { en: won ? "Rival wrecked!" : "You got wrecked", fa: won ? "حریف نابود شد!" : "تو نابود شدی" },
        { en: `${rand(4, 11)} slams landed`, fa: `${rand(4, 11)} ضربه موفق` },
        { en: `Armor ${stats.armor} absorbed ${rand(30, 80)}% damage`, fa: `بدنه ${stats.armor}، ${rand(30, 80)}٪ ضربه را جذب کرد` },
      );
      break;
    }
    case "pursuit": {
      const secs = Math.round(40 + perf * 90 + rand(-8, 12));
      score = `${secs}s`;
      highlights.push(
        { en: `Escaped ${rand(3, 9)} cruisers`, fa: `از ${rand(3, 9)} ماشین پلیس فرار کردی` },
        { en: `${rand(1, 4)} roadblocks smashed`, fa: `${rand(1, 4)} سد شکسته شد` },
        { en: won ? "Lost the chopper!" : "Caught by the chopper", fa: won ? "هلیکوپتر را گم کردی!" : "هلیکوپتر گرفتت" },
      );
      break;
    }
    case "drift": {
      const pts = Math.round((stats.accel * 95 + stats.topSpeed * 20) * (0.6 + perf * 0.5));
      score = pts.toLocaleString("en-US");
      highlights.push(
        { en: `Longest drift ${rand(80, 240)}m`, fa: `طولانی‌ترین دریفت ${rand(80, 240)} متر` },
        { en: `Max angle ${rand(38, 72)}°`, fa: `بیشترین زاویه ${rand(38, 72)} درجه` },
        { en: `${rand(6, 18)} linked corners`, fa: `${rand(6, 18)} پیچ زنجیره‌ای` },
      );
      break;
    }
    case "timeattack": {
      const lap = (74 - stats.boost * 0.15 - stats.topSpeed * 0.05 + rand(-15, 15) / 10).toFixed(2);
      score = `${lap}s`;
      highlights.push(
        { en: won ? "Ghost beaten!" : "Ghost was faster", fa: won ? "رکورد شبح شکست!" : "شبح سریع‌تر بود" },
        { en: `Nitro used ${rand(2, 5)} times`, fa: `${rand(2, 5)} بار نیترو زدی` },
        { en: `Perfect corners ${rand(3, 9)}`, fa: `${rand(3, 9)} پیچ بی‌نقص` },
      );
      break;
    }
  }

  return { raceId: mode.id, place, total, score, reward, highlights, won, damage };
}

export function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
