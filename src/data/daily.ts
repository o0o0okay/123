/**
 * Daily check-in ("daily reward") rules.
 *
 * The player logs in once per calendar day and claims coins. Consecutive days
 * build a streak; the reward climbs through a 7-day cycle and then starts over.
 * Missing a day resets the streak to the first day.
 *
 * Everything here is pure so it can be unit-tested with a fake clock.
 */

/** Coins paid for day 1 … day 7 of the streak cycle. */
export const DAILY_REWARDS = [500, 750, 1000, 1500, 2000, 3000, 5000] as const;

/** Length of one streak cycle (a week). */
export const DAILY_CYCLE = DAILY_REWARDS.length;

/** What we persist in the player save. */
export interface DailyState {
  /** local calendar day of the last claim, `YYYY-MM-DD` (null = never claimed) */
  lastClaim: string | null;
  /** consecutive days claimed, including `lastClaim` */
  streak: number;
  /** lifetime number of claims (nice for stats / future badges) */
  total: number;
}

export const DEFAULT_DAILY: DailyState = { lastClaim: null, streak: 0, total: 0 };

export type DailyTileState = "claimed" | "current" | "locked";

export interface DailyTile {
  /** day number inside the current cycle: 1 … 7 */
  day: number;
  reward: number;
  state: DailyTileState;
}

export interface DailyView {
  /** the reward that is claimable right now (or the one just claimed today) */
  reward: number;
  /** index inside the cycle of `reward`: 0 … 6 */
  dayIndex: number;
  /** true when today's reward has already been taken */
  claimedToday: boolean;
  /** consecutive days claimed (0 when the streak was broken) */
  streak: number;
  /** lifetime claims */
  total: number;
  /** ms left until the next local midnight */
  msToReset: number;
  /** the seven tiles of the cycle shown in the UI */
  tiles: DailyTile[];
  /** tile index (0 … 6) that represents today */
  activeIndex: number;
}

/** Local calendar key for a date, e.g. `2026-10-29` (never UTC — the day flips at local midnight). */
export function dayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** `true` when `key` is exactly the day before `today` (local time, DST safe). */
function isYesterday(key: string, now: Date): boolean {
  const y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  return key === dayKey(y);
}

/** Milliseconds from `now` until the next local midnight. */
export function msUntilMidnight(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return Math.max(0, next.getTime() - now.getTime());
}

/** `HH:MM:SS` countdown label. */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => `${n}`.padStart(2, "0")).join(":");
}

/** Turns the saved daily state into everything the UI needs. */
export function resolveDaily(state: DailyState | undefined, now: Date = new Date()): DailyView {
  const s: DailyState = { ...DEFAULT_DAILY, ...(state ?? {}) };
  const today = dayKey(now);
  const last = s.lastClaim ?? null;

  // a clock that jumped backwards must not hand out a second reward
  const claimedToday = !!last && last >= today;
  const alive = !!last && isYesterday(last, now);
  const streak = Math.max(0, s.streak || 0);

  // days claimed in a row that "count" right now
  const baseStreak = claimedToday ? streak : alive ? streak : 0;
  const dayIndex = claimedToday
    ? Math.max(0, (streak - 1) % DAILY_CYCLE)
    : alive
      ? streak % DAILY_CYCLE
      : 0;

  // the cycle we are showing: the one that contains today
  const cycleStart = Math.floor((claimedToday ? Math.max(0, baseStreak - 1) : baseStreak) / DAILY_CYCLE) * DAILY_CYCLE;

  const tiles: DailyTile[] = DAILY_REWARDS.map((reward, i) => {
    const absoluteDay = cycleStart + i + 1; // 1-based streak day this tile represents
    const state: DailyTileState =
      absoluteDay <= baseStreak ? "claimed" : absoluteDay === baseStreak + 1 ? "current" : "locked";
    return { day: i + 1, reward, state };
  });

  const activeIndex = claimedToday ? Math.max(0, (streak - 1) % DAILY_CYCLE) : dayIndex;

  return {
    reward: DAILY_REWARDS[dayIndex],
    dayIndex,
    claimedToday,
    streak: baseStreak,
    total: s.total ?? 0,
    msToReset: msUntilMidnight(now),
    tiles,
    activeIndex,
  };
}

/** Applies a claim to the saved state. Returns the same state when it is not allowed. */
export function claimDaily(state: DailyState | undefined, now: Date = new Date()): DailyState {
  const s: DailyState = { ...DEFAULT_DAILY, ...(state ?? {}) };
  const view = resolveDaily(s, now);
  if (view.claimedToday) return s;

  const today = dayKey(now);
  const alive = !!s.lastClaim && isYesterday(s.lastClaim, now);
  return {
    lastClaim: today,
    streak: (alive ? s.streak : 0) + 1,
    total: view.total + 1,
  };
}
