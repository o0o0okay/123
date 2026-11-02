/**
 * Weekly engagement of a driver.
 *
 * The account page draws a small calendar of the last weeks: one tile per day,
 * shaded by how much the player did that day. The counts come from the same
 * place everything else is written to — the ledger — so the grid can never
 * disagree with the history panel.
 *
 * Days are local calendar days (`YYYY-MM-DD`, see `dayKey`), never UTC: a run
 * at 00:30 belongs to the day the player is living in.
 */

import { dayKey } from "./daily";

export const DAY_MS = 86_400_000;

/** actions per local day, keyed `YYYY-MM-DD` */
export type ActivityMap = Record<string, number>;

/** 0 = nothing, then low → medium → high → best */
export type EngagementLevel = 0 | 1 | 2 | 3 | 4;

/** how many actions a day needs for each level */
export const LEVEL_STEPS = { medium: 3, high: 6, best: 10 } as const;

export function levelOf(count: number): EngagementLevel {
  if (count >= LEVEL_STEPS.best) return 4;
  if (count >= LEVEL_STEPS.high) return 3;
  if (count >= LEVEL_STEPS.medium) return 2;
  if (count >= 1) return 1;
  return 0;
}

/** records one action for the local day it happened on (immutably) */
export function bumpActivity(map: ActivityMap | undefined, at = Date.now(), by = 1): ActivityMap {
  const key = dayKey(new Date(at));
  const base = map ?? {};
  return { ...base, [key]: (base[key] ?? 0) + by };
}

/** keeps only well-formed day keys with a positive count, newest 400 days */
export function sanitizeActivity(raw: unknown): ActivityMap {
  if (!raw || typeof raw !== "object") return {};
  const out: ActivityMap = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) continue;
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n) || n <= 0) continue;
    out[key] = Math.min(10_000, Math.round(n));
  }
  const keys = Object.keys(out).sort();
  if (keys.length <= 400) return out;
  const trimmed: ActivityMap = {};
  for (const key of keys.slice(-400)) trimmed[key] = out[key];
  return trimmed;
}

/**
 * Rebuilds an engagement map from the ledger.
 *
 * Saves written before this existed have no activity record at all; their
 * history still carries the timestamps, so the first open of the account page
 * shows a real calendar instead of an empty one.
 */
export function activityFromHistory(list: { at: number }[] | undefined): ActivityMap {
  const out: ActivityMap = {};
  for (const row of list ?? []) {
    if (!Number.isFinite(row?.at)) continue;
    out[dayKey(new Date(row.at))] = (out[dayKey(new Date(row.at))] ?? 0) + 1;
  }
  return out;
}

export interface DayCell {
  /** local `YYYY-MM-DD` */
  key: string;
  /** epoch ms at local midnight */
  date: number;
  count: number;
  level: EngagementLevel;
  /** days after today inside the current week */
  future: boolean;
  today: boolean;
}

export interface WeekRow {
  /** epoch ms at local midnight of the week's first day */
  start: number;
  days: DayCell[];
}

/** midnight of a given day, in local time */
function midnight(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** first day of the week that holds `date` (weekStartsOn: 0 = Sunday, 6 = Saturday) */
export function startOfWeek(date: Date, weekStartsOn = 0) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const shift = (d.getDay() - weekStartsOn + 7) % 7;
  d.setDate(d.getDate() - shift);
  return d.getTime();
}

/**
 * The last `weeks` weeks as rows, oldest first, each with seven day cells.
 * The current week is the last row and may contain future cells.
 */
export function weekRows(
  activity: ActivityMap | undefined,
  now = Date.now(),
  weeks = 5,
  weekStartsOn = 0,
): WeekRow[] {
  const today = midnight(new Date(now));
  const firstOfThisWeek = startOfWeek(new Date(now), weekStartsOn);
  const rows: WeekRow[] = [];

  for (let w = weeks - 1; w >= 0; w--) {
    const start = new Date(firstOfThisWeek);
    start.setDate(start.getDate() - w * 7);
    const days: DayCell[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const key = dayKey(d);
      const date = midnight(d);
      const future = date > today;
      const count = future ? 0 : (activity?.[key] ?? 0);
      days.push({ key, date, count, level: levelOf(count), future, today: date === today });
    }
    rows.push({ start: start.getTime(), days });
  }
  return rows;
}

/** how much happened across the last `days` days (today included) */
export function engagementStats(activity: ActivityMap | undefined, now = Date.now(), days = 7) {
  let actions = 0;
  let activeDays = 0;
  let best = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const count = activity?.[dayKey(d)] ?? 0;
    actions += count;
    if (count > 0) activeDays += 1;
    best = Math.max(best, count);
  }
  return { actions, activeDays, best, level: levelOf(best) as EngagementLevel };
}
