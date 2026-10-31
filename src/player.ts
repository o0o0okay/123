import type { UpgradeKey } from "./data/cars";
import { MAX_LEVEL, cars } from "./data/cars";
import { STOCK_PAINT, type Paints } from "./data/paints";
import { DEFAULT_TASK_PROGRESS, type TaskProgress } from "./data/tasks";
import { DEFAULT_DAILY, type DailyState } from "./data/daily";
import { DEFAULT_DEFI, type DefiState } from "./data/staking";

export interface PlayerState {
  coins: number;
  /** car currently driven (must be owned) */
  activeCarId: string;
  /** ids of cars bought in the shop */
  owned: string[];
  upgrades: Record<string, Partial<Record<UpgradeKey, number>>>;
  /** paint id sprayed on each owned car (missing = factory paint) */
  paints: Paints;
  /** pending coins from the last chase, collectable in the garage */
  runReward: number;
  /** stored progress for mission metrics */
  taskProgress: TaskProgress;
  /** ids of missions whose reward was claimed */
  tasksClaimed: string[];
  /** daily login check-in (streak + last claim day) */
  daily: DailyState;
  bestEscape: number;
  totalRuns: number;
  /** wins per race mode */
  raceWins: Record<string, number>;
  /** total races driven */
  raceCount: number;
  /** leaderboard score: lifetime points + the best single run of every mode */
  score: PlayerScore;
  /** staking, liquidity pools and collateral-backed loans */
  defi: DefiState;
}

export interface PlayerScore {
  /** points of every race ever driven (the global board sorts on this) */
  total: number;
  /** races that were scored */
  runs: number;
  wins: number;
  /** best single run per race mode (the mode boards sort on this) */
  best: Record<string, number>;
}

const KEY = "hc_player_v1";

export const DEFAULT_PLAYER: PlayerState = {
  coins: 45680,
  activeCarId: "comet",
  owned: ["comet"],
  upgrades: {
    comet: { engine: 2, body: 1, tires: 0, nitro: 0 },
  },
  paints: {},
  runReward: 2400,
  taskProgress: { ...DEFAULT_TASK_PROGRESS },
  tasksClaimed: [],
  daily: { ...DEFAULT_DAILY },
  bestEscape: 0,
  totalRuns: 0,
  raceWins: {},
  raceCount: 0,
  score: { total: 0, runs: 0, wins: 0, best: {} },
  defi: { positions: [], loans: [], pools: [] },
};

export function loadPlayer(): PlayerState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PLAYER;
    const parsed = JSON.parse(raw) as Partial<PlayerState>;

    // only keep ids of cars that still exist; always own at least the starter
    let owned = Array.isArray(parsed.owned)
      ? parsed.owned.filter((id) => cars.some((c) => c.id === id))
      : [...DEFAULT_PLAYER.owned];
    if (!owned.length) owned = [...DEFAULT_PLAYER.owned];

    const activeCarId =
      parsed.activeCarId && owned.includes(parsed.activeCarId) ? parsed.activeCarId : owned[0];

    return {
      ...DEFAULT_PLAYER,
      ...parsed,
      owned,
      activeCarId,
      upgrades: { ...DEFAULT_PLAYER.upgrades, ...(parsed.upgrades ?? {}) },
      paints: { ...(parsed.paints ?? {}) },
      taskProgress: { ...DEFAULT_TASK_PROGRESS, ...(parsed.taskProgress ?? {}) },
      tasksClaimed: Array.isArray(parsed.tasksClaimed) ? parsed.tasksClaimed : [],
      daily: { ...DEFAULT_DAILY, ...(parsed.daily ?? {}) },
      raceWins: { ...(parsed.raceWins ?? {}) },
      raceCount: parsed.raceCount ?? 0,
      score: {
        ...DEFAULT_PLAYER.score,
        ...(parsed.score ?? {}),
        best: { ...(parsed.score?.best ?? {}) },
      },
      defi: {
        positions: Array.isArray(parsed.defi?.positions) ? parsed.defi.positions : DEFAULT_DEFI.positions,
        loans: Array.isArray(parsed.defi?.loans) ? parsed.defi.loans : DEFAULT_DEFI.loans,
        pools: Array.isArray(parsed.defi?.pools) ? parsed.defi.pools : DEFAULT_DEFI.pools,
      },
    };
  } catch {
    return DEFAULT_PLAYER;
  }
}

export function savePlayer(p: PlayerState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

export const ZERO_LEVELS: Record<UpgradeKey, number> = { engine: 0, body: 0, tires: 0, nitro: 0 };

/** Paint currently worn by a car (factory paint when never sprayed). */
export function paintOf(p: PlayerState, carId: string): string {
  return p.paints?.[carId] ?? STOCK_PAINT;
}

export function levelsOf(p: PlayerState, carId: string): Record<UpgradeKey, number> {
  const raw = p.upgrades[carId] ?? {};
  return {
    engine: Math.min(MAX_LEVEL, raw.engine ?? 0),
    body: Math.min(MAX_LEVEL, raw.body ?? 0),
    tires: Math.min(MAX_LEVEL, raw.tires ?? 0),
    nitro: Math.min(MAX_LEVEL, raw.nitro ?? 0),
  };
}
