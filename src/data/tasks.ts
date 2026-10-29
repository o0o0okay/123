/** Metrics that drive mission progress. */
export type TaskMetric = "buy" | "upgrade" | "chase" | "collect" | "ownCars" | "speed" | "race" | "raceWin";

export type TaskScope = "daily" | "season";

export type TaskIconKey = "buy" | "upgrade" | "chase" | "collect" | "garage" | "speed" | "race" | "trophy";

export interface TaskDef {
  id: string;
  scope: TaskScope;
  icon: TaskIconKey;
  title: { en: string; fa: string };
  desc: { en: string; fa: string };
  metric: TaskMetric;
  goal: number;
  reward: number;
}

export const TASKS: TaskDef[] = [
  {
    id: "daily-collect",
    scope: "daily",
    icon: "collect",
    title: { en: "Payday", fa: "روز پرداخت" },
    desc: { en: "Collect your chase reward in the garage", fa: "پاداش فرار را از گاراژ دریافت کن" },
    metric: "collect",
    goal: 1,
    reward: 1500,
  },
  {
    id: "daily-buy",
    scope: "daily",
    icon: "buy",
    title: { en: "New Wheels", fa: "چرخ‌های نو" },
    desc: { en: "Buy a new car from the shop", fa: "یک ماشین جدید از فروشگاه بخر" },
    metric: "buy",
    goal: 1,
    reward: 3000,
  },
  {
    id: "daily-upgrade",
    scope: "daily",
    icon: "upgrade",
    title: { en: "Tune It Up", fa: "تیونینگ کن" },
    desc: { en: "Upgrade any car 3 times in the garage", fa: "در گاراژ ۳ بار ماشین را ارتقاء بده" },
    metric: "upgrade",
    goal: 3,
    reward: 2500,
  },
  {
    id: "daily-chase",
    scope: "daily",
    icon: "chase",
    title: { en: "Heat Level", fa: "سطح تعقیب" },
    desc: { en: "Start 3 chases to escape the police", fa: "۳ بار برای فرار از پلیس مسابقه شروع کن" },
    metric: "chase",
    goal: 3,
    reward: 2000,
  },
  {
    id: "daily-race",
    scope: "daily",
    icon: "race",
    title: { en: "Rubber Burner", fa: "لاستیک‌سوز" },
    desc: { en: "Enter any 2 races", fa: "در ۲ مسابقه شرکت کن" },
    metric: "race",
    goal: 2,
    reward: 2200,
  },
  {
    id: "season-wins",
    scope: "season",
    icon: "trophy",
    title: { en: "Podium Regular", fa: "سکوی قهرمانی" },
    desc: { en: "Win 5 races in any mode", fa: "۵ مسابقه را در هر حالتی ببر" },
    metric: "raceWin",
    goal: 5,
    reward: 9000,
  },
  {
    id: "season-speed",
    scope: "season",
    icon: "speed",
    title: { en: "Speed Demon", fa: "دیو سرعت" },
    desc: { en: "Reach 300 km/h with any owned car", fa: "با یکی از ماشین‌هایت به ۳۰۰ کیلومتر در ساعت برس" },
    metric: "speed",
    goal: 300,
    reward: 6000,
  },
  {
    id: "season-garage",
    scope: "season",
    icon: "garage",
    title: { en: "Full Garage", fa: "گاراژ کامل" },
    desc: { en: "Own 3 cars at the same time", fa: "همزمان ۳ ماشین داشته باش" },
    metric: "ownCars",
    goal: 3,
    reward: 8000,
  },
];

/** Legacy per-metric progress, used for metrics that need storing. */
export type TaskProgress = Partial<Record<TaskMetric, number>>;

export const DEFAULT_TASK_PROGRESS: TaskProgress = {
  collect: 1,
  buy: 0,
  upgrade: 1,
  chase: 1,
  race: 0,
  raceWin: 0,
};
